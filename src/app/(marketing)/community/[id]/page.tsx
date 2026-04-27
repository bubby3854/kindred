import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPost, listComments } from "@/lib/repositories/community";
import { findById as findProfileById } from "@/lib/repositories/profiles";
import {
  deletePostAction,
  deleteCommentAction,
  togglePinPostAction,
} from "../actions";
import { CommentForm } from "./comment-form";
import { ReportButton } from "./report-button";
import { AdminCommentTools } from "./admin-comment-tools";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const post = await getPost(supabase, id);
  if (!post) return { title: "찾을 수 없음 · kindred" };
  return {
    title: `${post.title} · 커뮤니티 · kindred`,
  };
}

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [post, comments, userResult] = await Promise.all([
    getPost(supabase, id),
    listComments(supabase, id),
    supabase.auth.getUser(),
  ]);
  if (!post) notFound();

  const viewer = userResult.data.user;
  const viewerProfile = viewer ? await findProfileById(supabase, viewer.id) : null;
  const isAdmin = Boolean(viewerProfile?.is_admin);
  const isAuthor = Boolean(viewer && viewer.id === post.author_id);
  const authorName = post.profiles?.display_name ?? "익명의 메이커";
  const banUntil = viewerProfile?.comment_ban_until
    ? new Date(viewerProfile.comment_ban_until)
    : null;
  const isBanned = banUntil ? banUntil > new Date() : false;

  return (
    <article className="mx-auto max-w-3xl px-6 pt-16 pb-24 flex flex-col gap-12">
      <header className="flex flex-col gap-5">
        <Link
          href="/community"
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 커뮤니티
        </Link>
        <div className="flex items-baseline gap-3 flex-wrap">
          {post.is_pinned && (
            <span className="inline-flex items-center rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 px-2.5 py-0.5 text-xs text-[color:var(--accent)] font-medium">
              📌 공지
            </span>
          )}
          <h1 className="font-serif text-4xl sm:text-5xl leading-[1.1] tracking-tight">
            {post.title}
          </h1>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap text-sm text-[color:var(--muted)]">
          <div className="flex items-center gap-3">
            {post.profiles?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.profiles.avatar_url}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-full border border-[color:var(--border)] object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="h-7 w-7 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] flex items-center justify-center text-xs"
              >
                {authorName.charAt(0)}
              </span>
            )}
            <Link
              href={`/u/${post.author_id}`}
              className="text-[color:var(--foreground)] hover:text-[color:var(--accent)] transition-colors underline underline-offset-4"
            >
              {authorName}
            </Link>
            <span aria-hidden="true">·</span>
            <span>{new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <form
                action={togglePinPostAction.bind(null, post.id, !post.is_pinned)}
              >
                <button
                  type="submit"
                  className="cursor-pointer text-[color:var(--accent)] hover:opacity-80 underline underline-offset-4"
                >
                  {post.is_pinned ? "고정 해제" : "상단 고정"}
                </button>
              </form>
            )}
            {isAuthor && (
              <form action={deletePostAction.bind(null, post.id)}>
                <button
                  type="submit"
                  className="cursor-pointer text-[color:var(--accent)] hover:opacity-80 underline underline-offset-4"
                >
                  삭제
                </button>
              </form>
            )}
          </div>
        </div>
      </header>

      <div className="leading-relaxed whitespace-pre-wrap">{post.body}</div>

      <section className="flex flex-col gap-6 pt-6 border-t border-[color:var(--border)]">
        <h2 className="font-serif text-2xl">
          댓글{" "}
          <span className="text-[color:var(--muted)] text-base">
            ({comments.length})
          </span>
        </h2>

        {comments.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            첫 댓글을 남겨주세요.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[color:var(--border)]">
            {comments.map((c) => {
              const cAuthor = c.profiles?.display_name ?? "익명의 메이커";
              const isCommentAuthor = Boolean(
                viewer && viewer.id === c.author_id,
              );
              return (
                <li key={c.id} className="py-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 text-xs text-[color:var(--muted)]">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/u/${c.author_id}`}
                        className="text-[color:var(--foreground)] hover:text-[color:var(--accent)] transition-colors"
                      >
                        {cAuthor}
                      </Link>
                      <span aria-hidden="true">·</span>
                      <span>
                        {new Date(c.created_at).toLocaleString("ko-KR")}
                      </span>
                    </div>
                    {isCommentAuthor && (
                      <form
                        action={deleteCommentAction.bind(null, c.id, post.id)}
                      >
                        <button
                          type="submit"
                          className="cursor-pointer text-[color:var(--accent)] hover:opacity-80"
                        >
                          삭제
                        </button>
                      </form>
                    )}
                  </div>
                  {c.is_hidden ? (
                    <p className="text-sm italic text-[color:var(--muted)] rounded-md border border-dashed border-[color:var(--border)] px-3 py-2">
                      관리자에 의해 숨김처리 되었습니다.
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {c.body}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    {viewer && !isCommentAuthor && !c.is_hidden && (
                      <ReportButton commentId={c.id} postId={post.id} />
                    )}
                    {isAdmin && (
                      <AdminCommentTools
                        commentId={c.id}
                        postId={post.id}
                        isHidden={c.is_hidden}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {viewer ? (
          isBanned ? (
            <p className="text-sm rounded-md border-l-2 border-[color:var(--warning)] bg-[color:var(--card)] px-4 py-3 text-[color:var(--muted)]">
              {banUntil!.toLocaleString("ko-KR")}까지 댓글 작성이 제한됩니다.
            </p>
          ) : (
            <CommentForm postId={post.id} />
          )
        ) : (
          <p className="text-sm text-[color:var(--muted)]">
            <Link
              href={`/login?next=/community/${post.id}`}
              className="underline underline-offset-4 text-[color:var(--accent)] hover:opacity-80"
            >
              로그인
            </Link>
            하면 댓글을 남길 수 있어요.
          </p>
        )}
      </section>
    </article>
  );
}
