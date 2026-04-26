import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findById as findProfileById } from "@/lib/repositories/profiles";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "프로필 · kindred" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await findProfileById(supabase, user.id);
  if (!profile?.display_name) redirect("/onboarding?next=/me/profile");

  return (
    <div className="mx-auto max-w-2xl px-6 pt-16 pb-24 flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <Link
          href="/me"
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 내 페이지
        </Link>
        <h1 className="font-serif text-5xl leading-tight">프로필.</h1>
        <p className="text-[color:var(--muted)] leading-relaxed">
          서비스 상세 페이지에 메이커로 노출되는 정보예요. 회사·협업 문의를
          받고 싶다면 이메일이나 외부 링크를 채워두세요.
        </p>
      </header>

      <ProfileForm
        initial={{
          display_name: profile.display_name,
          contact_email: profile.contact_email ?? "",
          external_url: profile.external_url ?? "",
        }}
      />
    </div>
  );
}
