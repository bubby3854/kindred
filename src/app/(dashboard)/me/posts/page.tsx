import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findById as findProfileById } from "@/lib/repositories/profiles";
import {
  listPostsByAuthor,
  listCommentsByAuthor,
} from "@/lib/repositories/community";

export const metadata = { title: "내 글 · kindred" };

export default async function MyPostsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/me/posts");

  const profile = await findProfileById(supabase, user.id);
  if (!profile?.display_name) redirect("/onboarding?next=/me/posts");

  const [posts, comments] = await Promise.all([
    listPostsByAuthor(supabase, user.id, { limit: 60 }),
    listCommentsByAuthor(supabase, user.id, { limit: 60 }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <Link
          href="/me"
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 내 페이지
        </Link>
        <h1 className="font-serif text-5xl leading-tight">내 글.</h1>
        <p className="text-[color:var(--muted)]">
          커뮤니티에 남긴 글과 댓글을 한 곳에서 모아 봐요.
        </p>
      </header>

      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between border-b border-[color:var(--border)] pb-3">
          <h2 className="font-serif text-2xl">게시글</h2>
          <span className="text-sm text-[color:var(--muted)]">
            {posts.length > 0 ? `총 ${posts.length}개` : "없음"}
          </span>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            아직 작성한 글이 없어요.{" "}
            <Link
              href="/community/new"
              className="underline underline-offset-4 text-[color:var(--accent)] hover:opacity-80"
            >
              첫 글 쓰기
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[color:var(--border)]">
            {posts.map((p) => (
              <li key={p.id} className="py-4">
                <Link
                  href={`/community/${p.id}`}
                  className="flex flex-col gap-1.5 group"
                >
                  <h3 className="font-serif text-xl group-hover:text-[color:var(--accent)] transition-colors flex items-baseline gap-2 flex-wrap">
                    {p.is_pinned && (
                      <span className="inline-flex items-center rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 px-2 py-0.5 text-[11px] text-[color:var(--accent)] font-medium tracking-wide">
                        📌 공지
                      </span>
                    )}
                    {p.is_draft && (
                      <span className="inline-flex items-center rounded-full bg-[color:var(--warning)]/10 border border-[color:var(--warning)]/30 px-2 py-0.5 text-[11px] text-[color:var(--warning)] font-medium tracking-wide">
                        임시저장
                      </span>
                    )}
                    <span>{p.title}</span>
                  </h3>
                  <span className="text-xs text-[color:var(--muted)]">
                    {new Date(p.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between border-b border-[color:var(--border)] pb-3">
          <h2 className="font-serif text-2xl">댓글</h2>
          <span className="text-sm text-[color:var(--muted)]">
            {comments.length > 0 ? `총 ${comments.length}개` : "없음"}
          </span>
        </div>
        {comments.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            아직 작성한 댓글이 없어요.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[color:var(--border)]">
            {comments.map((c) => (
              <li key={c.id} className="py-4">
                <Link
                  href={`/community/${c.post_id}`}
                  className="flex flex-col gap-1.5 group"
                >
                  <span className="text-xs text-[color:var(--muted)] truncate">
                    «{c.community_posts?.title ?? "삭제된 글"}» 에서
                  </span>
                  {c.is_hidden ? (
                    <p className="text-sm italic text-[color:var(--muted)]">
                      운영진에 의해 숨김 처리 되었습니다.
                    </p>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed line-clamp-3 group-hover:text-[color:var(--accent)] transition-colors">
                      {c.body}
                    </p>
                  )}
                  <span className="text-xs text-[color:var(--muted)]">
                    {new Date(c.created_at).toLocaleString("ko-KR")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
