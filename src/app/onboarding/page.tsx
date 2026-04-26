import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findById as findProfileById } from "@/lib/repositories/profiles";
import { NicknameForm } from "./nickname-form";

export const metadata = { title: "닉네임 설정 · kindred" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: nextParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await findProfileById(supabase, user.id);
  // Already onboarded — skip straight to destination.
  if (profile?.display_name) redirect(nextParam && nextParam.startsWith("/") ? nextParam : "/me");

  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/me";

  return (
    <div className="mx-auto max-w-md px-6 py-20 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          시작 전에
        </p>
        <h1 className="font-serif text-4xl leading-tight">
          어떻게 불러드릴까요?
        </h1>
        <p className="text-[color:var(--muted)] leading-relaxed">
          서비스 페이지에 메이커로 표시되는 이름이에요. 본명 대신 닉네임을
          쓰시는 걸 추천드려요.
        </p>
      </header>

      <NicknameForm next={next} />
    </div>
  );
}
