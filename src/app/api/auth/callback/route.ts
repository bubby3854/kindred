import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findById as findProfileById } from "@/lib/repositories/profiles";

// OAuth code-exchange endpoint. Supabase redirects back here after the user
// completes a social sign-in.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/me";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
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
