import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  findById as findProfileById,
  updateAvatarIfChanged,
} from "@/lib/repositories/profiles";
import { checkRateLimit } from "@/lib/rate-limit";

// OAuth code-exchange endpoint. Supabase redirects back here after the user
// completes a social sign-in.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/me";

  if (code) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rl = await checkRateLimit("authCallback", ip);
    if (!rl.ok) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(rl.reason)}`, url),
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const latestAvatar =
        (user.user_metadata?.avatar_url as string | undefined) ?? null;
      await updateAvatarIfChanged(supabase, user.id, latestAvatar);

      const profile = await findProfileById(supabase, user.id);
      if (!profile?.display_name) {
        const onboardingUrl = new URL("/onboarding", url);
        onboardingUrl.searchParams.set("next", next);
        return NextResponse.redirect(onboardingUrl);
      }
    }
  }

  return NextResponse.redirect(new URL(next, url));
}
