import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listPosts } from "@/lib/repositories/community";

export const metadata = { title: "커뮤니티 · kindred" };
export const revalidate = 30;

export default async function CommunityPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    posts,
  ] = await Promise.all([
    supabase.auth.getUser(),
    listPosts(supabase, { limit: 60 }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 flex flex-col gap-12">
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
            커뮤니티
          </p>
          <h1 className="font-serif text-5xl leading-tight">메이커들의 글.</h1>
        </div>
        {user ? (
          <Link
            href="/community/new"
            className="cursor-pointer inline-flex items-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            새 글 쓰기
          </Link>
        ) : (
          <Link
            href="/login?next=/community/new"
            className="cursor-pointer inline-flex items-center rounded-full border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium hover:border-[color:var(--foreground)] transition-colors"
          >
            로그인하고 글쓰기
          </Link>
        )}
      </header>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--border)] px-8 py-16 text-center">
          <p className="font-serif text-2xl mb-2">아직 글이 없어요.</p>
          <p className="text-sm text-[color:var(--muted)]">
            첫 글을 남겨보시겠어요?
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-[color:var(--border)]">
          {posts.map((p) => (
            <li key={p.id} className="py-5">
              <Link
                href={`/community/${p.id}`}
                className="flex flex-col gap-2 group"
              >
                <h2 className="font-serif text-2xl group-hover:text-[color:var(--accent)] transition-colors">
                  {p.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[color:var(--muted)]">
                  <span>
                    {p.profiles?.display_name ?? "익명의 메이커"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(p.created_at).toLocaleDateString("ko-KR")}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
