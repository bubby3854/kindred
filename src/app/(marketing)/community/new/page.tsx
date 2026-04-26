import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findById as findProfileById } from "@/lib/repositories/profiles";
import { PostForm } from "./post-form";

export const metadata = { title: "새 글 · kindred" };

export default async function NewPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/community/new");

  const profile = await findProfileById(supabase, user.id);
  if (!profile?.display_name) redirect("/onboarding?next=/community/new");

  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <Link
          href="/community"
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 커뮤니티
        </Link>
        <h1 className="font-serif text-4xl leading-tight">새 글.</h1>
      </header>

      <PostForm />
    </div>
  );
}
