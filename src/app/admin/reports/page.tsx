import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listPendingReports,
  listPendingPostReports,
  COMMENT_REPORT_REASONS,
  type CommentReportReason,
} from "@/lib/repositories/community";
import {
  toggleHideCommentAction,
  banCommentAuthorAction,
  resolveReportAction,
  toggleHidePostAction,
  banPostAuthorAction,
  resolvePostReportAction,
} from "@/app/(marketing)/community/actions";

export const dynamic = "force-dynamic";

const REASON_LABEL: Record<CommentReportReason, string> = Object.fromEntries(
  COMMENT_REPORT_REASONS.map((r) => [r.value, r.label]),
) as Record<CommentReportReason, string>;

export default async function AdminReportsPage() {
  const admin = createAdminClient();
  const [commentReports, postReports] = await Promise.all([
    listPendingReports(admin, { limit: 100 }),
    listPendingPostReports(admin, { limit: 100 }),
  ]);
  const total = commentReports.length + postReports.length;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="font-serif text-4xl leading-tight">신고 내역.</h1>
        <span className="text-sm text-[color:var(--muted)]">
          미처리 {total}건 (게시글 {postReports.length} · 댓글{" "}
          {commentReports.length})
        </span>
      </div>

      {total === 0 && (
        <div className="rounded-lg border border-dashed border-[color:var(--border)] px-8 py-16 text-center">
          <p className="font-serif text-2xl mb-2">처리할 신고가 없어요.</p>
          <p className="text-sm text-[color:var(--muted)]">
            새 신고가 들어오면 여기에 쌓입니다.
          </p>
        </div>
      )}

      {postReports.length > 0 && (
        <section className="flex flex-col gap-5">
          <h2 className="font-serif text-2xl border-b border-[color:var(--border)] pb-2">
            게시글 신고
          </h2>
          <ul className="flex flex-col gap-6">
            {postReports.map((r) => {
              const p = r.community_posts;
              const reporter = r.reporter?.display_name ?? "익명";
              const pAuthor = p?.profiles?.display_name ?? "익명의 메이커";
              return (
                <li
                  key={r.id}
                  className="flex flex-col gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-5"
                >
                  <ReportHeader
                    reasonLabel={REASON_LABEL[r.reason]}
                    reporter={reporter}
                    createdAt={r.created_at}
                    targetHref={p ? `/community/${p.id}` : null}
                  />
                  {r.detail && (
                    <p className="text-sm text-[color:var(--muted)] italic">
                      &ldquo;{r.detail}&rdquo;
                    </p>
                  )}
                  {p ? (
                    <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--background)] p-3 flex flex-col gap-2">
                      <div className="text-xs text-[color:var(--muted)] flex items-center gap-2 flex-wrap">
                        <span>
                          작성자 ·{" "}
                          <span className="text-[color:var(--foreground)]">
                            {pAuthor}
                          </span>
                        </span>
                        {p.is_hidden && (
                          <span className="inline-flex items-center rounded-full bg-[color:var(--warning)]/10 border border-[color:var(--warning)]/30 px-2 py-0.5 text-[11px] text-[color:var(--warning)]">
                            숨김 처리됨
                          </span>
                        )}
                      </div>
                      <p className="font-serif text-lg">{p.title}</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed line-clamp-6">
                        {p.body}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[color:var(--muted)]">
                      원본 게시글이 삭제되었습니다.
                    </p>
                  )}
                  {p && (
                    <div className="flex items-center gap-3 flex-wrap pt-1">
                      <form
                        action={toggleHidePostAction.bind(
                          null,
                          p.id,
                          !p.is_hidden,
                        )}
                      >
                        <button
                          type="submit"
                          className="cursor-pointer text-sm text-[color:var(--warning)] hover:opacity-80 underline underline-offset-4"
                        >
                          {p.is_hidden ? "숨김 해제" : "게시글 숨기기"}
                        </button>
                      </form>
                      <form
                        action={banPostAuthorAction.bind(null, p.id)}
                        className="inline-flex items-center gap-1 text-sm"
                      >
                        <span className="text-[color:var(--muted)]">
                          작성자
                        </span>
                        <input
                          name="days"
                          type="number"
                          min={1}
                          max={365}
                          defaultValue={7}
                          className="w-16 rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-0.5 text-sm outline-none focus:border-[color:var(--foreground)]"
                        />
                        <span className="text-[color:var(--muted)]">
                          일 댓글 금지
                        </span>
                        <button
                          type="submit"
                          className="cursor-pointer rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-3 py-1 text-xs hover:opacity-90 ml-1"
                        >
                          적용
                        </button>
                      </form>
                    </div>
                  )}
                  <form
                    action={resolvePostReportAction.bind(null, r.id)}
                    className="self-end"
                  >
                    <button
                      type="submit"
                      className="cursor-pointer text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] underline underline-offset-4"
                    >
                      처리 완료로 표시
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {commentReports.length > 0 && (
        <section className="flex flex-col gap-5">
          <h2 className="font-serif text-2xl border-b border-[color:var(--border)] pb-2">
            댓글 신고
          </h2>
          <ul className="flex flex-col gap-6">
            {commentReports.map((r) => {
              const c = r.community_comments;
              const reporter = r.reporter?.display_name ?? "익명";
              const cAuthor = c?.profiles?.display_name ?? "익명의 메이커";
              return (
                <li
                  key={r.id}
                  className="flex flex-col gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-5"
                >
                  <ReportHeader
                    reasonLabel={REASON_LABEL[r.reason]}
                    reporter={reporter}
                    createdAt={r.created_at}
                    targetHref={c ? `/community/${c.post_id}` : null}
                  />
                  {r.detail && (
                    <p className="text-sm text-[color:var(--muted)] italic">
                      &ldquo;{r.detail}&rdquo;
                    </p>
                  )}
                  {c ? (
                    <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--background)] p-3 flex flex-col gap-2">
                      <div className="text-xs text-[color:var(--muted)] flex items-center gap-2">
                        <span>
                          작성자 ·{" "}
                          <span className="text-[color:var(--foreground)]">
                            {cAuthor}
                          </span>
                        </span>
                        {c.is_hidden && (
                          <span className="inline-flex items-center rounded-full bg-[color:var(--warning)]/10 border border-[color:var(--warning)]/30 px-2 py-0.5 text-[11px] text-[color:var(--warning)]">
                            숨김 처리됨
                          </span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {c.body}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[color:var(--muted)]">
                      원본 댓글이 삭제되었습니다.
                    </p>
                  )}
                  {c && (
                    <div className="flex items-center gap-3 flex-wrap pt-1">
                      <form
                        action={toggleHideCommentAction.bind(
                          null,
                          c.id,
                          c.post_id,
                          !c.is_hidden,
                        )}
                      >
                        <button
                          type="submit"
                          className="cursor-pointer text-sm text-[color:var(--warning)] hover:opacity-80 underline underline-offset-4"
                        >
                          {c.is_hidden ? "숨김 해제" : "댓글 숨기기"}
                        </button>
                      </form>
                      <form
                        action={banCommentAuthorAction.bind(
                          null,
                          c.id,
                          c.post_id,
                        )}
                        className="inline-flex items-center gap-1 text-sm"
                      >
                        <span className="text-[color:var(--muted)]">
                          작성자
                        </span>
                        <input
                          name="days"
                          type="number"
                          min={1}
                          max={365}
                          defaultValue={7}
                          className="w-16 rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-0.5 text-sm outline-none focus:border-[color:var(--foreground)]"
                        />
                        <span className="text-[color:var(--muted)]">
                          일 댓글 금지
                        </span>
                        <button
                          type="submit"
                          className="cursor-pointer rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-3 py-1 text-xs hover:opacity-90 ml-1"
                        >
                          적용
                        </button>
                      </form>
                    </div>
                  )}
                  <form
                    action={resolveReportAction.bind(null, r.id)}
                    className="self-end"
                  >
                    <button
                      type="submit"
                      className="cursor-pointer text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] underline underline-offset-4"
                    >
                      처리 완료로 표시
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function ReportHeader({
  reasonLabel,
  reporter,
  createdAt,
  targetHref,
}: {
  reasonLabel: string;
  reporter: string;
  createdAt: string;
  targetHref: string | null;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 flex-wrap text-xs text-[color:var(--muted)]">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 px-2 py-0.5 text-[11px] text-[color:var(--accent)] font-medium">
          {reasonLabel}
        </span>
        <span>
          신고자 ·{" "}
          <span className="text-[color:var(--foreground)]">{reporter}</span>
        </span>
        <span aria-hidden="true">·</span>
        <span>{new Date(createdAt).toLocaleString("ko-KR")}</span>
      </div>
      {targetHref && (
        <Link
          href={targetHref}
          className="underline underline-offset-4 hover:text-[color:var(--accent)]"
        >
          원문 보기 ↗
        </Link>
      )}
    </div>
  );
}
