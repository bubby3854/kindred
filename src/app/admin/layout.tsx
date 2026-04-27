import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findById as findProfileById } from "@/lib/repositories/profiles";

export const metadata = { title: "관리자 · kindred" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/reports");
  const profile = await findProfileById(supabase, user.id);
  if (!profile?.is_admin) redirect("/");

  return (
    <div className="mx-auto max-w-5xl px-6 pt-16 pb-24 flex flex-col gap-10">
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          관리자
        </p>
        <nav className="flex gap-4 text-sm">
          <Link
            href="/admin/reports"
            className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
          >
            신고 내역
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
