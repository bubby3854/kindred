"use client";

import { useState, useTransition } from "react";
import {
  COMMENT_REPORT_REASONS,
  type CommentReportReason,
} from "@/lib/repositories/community";
import { reportCommentAction } from "../actions";

export function ReportButton({
  commentId,
  postId,
}: {
  commentId: string;
  postId: string;
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState<CommentReportReason>("SPAM");
  const [detail, setDetail] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const fd = new FormData();
    fd.set("reason", reason);
    fd.set("detail", detail);
    startTransition(async () => {
      await reportCommentAction(commentId, postId, fd);
      setSubmitted(true);
      setOpen(false);
    });
  }

  if (submitted) {
    return (
      <span className="text-xs text-[color:var(--muted)]">신고 접수됨</span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-xs text-[color:var(--muted)] hover:text-[color:var(--accent)] transition-colors"
      >
        신고
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-3 mt-2 w-full sm:w-72">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as CommentReportReason)}
        className="rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-1 text-sm outline-none focus:border-[color:var(--foreground)]"
      >
        {COMMENT_REPORT_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="추가 설명 (선택)"
        className="rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-1 text-sm outline-none focus:border-[color:var(--foreground)] resize-y"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer text-xs text-[color:var(--muted)] hover:text-[color:var(--foreground)] px-2"
        >
          취소
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="cursor-pointer rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-3 py-1 text-xs font-medium hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "전송 중…" : "신고"}
        </button>
      </div>
    </div>
  );
}
