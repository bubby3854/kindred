"use client";

import { useState } from "react";
import {
  toggleHideCommentAction,
  banCommentAuthorAction,
} from "../actions";

export function AdminCommentTools({
  commentId,
  postId,
  isHidden,
}: {
  commentId: string;
  postId: string;
  isHidden: boolean;
}) {
  const [banOpen, setBanOpen] = useState(false);
  const hideAction = toggleHideCommentAction.bind(
    null,
    commentId,
    postId,
    !isHidden,
  );
  const banAction = banCommentAuthorAction.bind(null, commentId, postId);

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[color:var(--muted)]">관리자</span>
      <form action={hideAction}>
        <button
          type="submit"
          className="cursor-pointer text-[color:var(--warning)] hover:opacity-80"
        >
          {isHidden ? "숨김 해제" : "숨기기"}
        </button>
      </form>
      {!banOpen ? (
        <button
          type="button"
          onClick={() => setBanOpen(true)}
          className="cursor-pointer text-[color:var(--accent)] hover:opacity-80"
        >
          작성자 댓글 금지
        </button>
      ) : (
        <form action={banAction} className="inline-flex items-center gap-1">
          <input
            name="days"
            type="number"
            min={1}
            max={365}
            defaultValue={7}
            className="w-14 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-1.5 py-0.5 text-xs outline-none focus:border-[color:var(--foreground)]"
          />
          <span>일</span>
          <button
            type="submit"
            className="cursor-pointer rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-2 py-0.5 text-xs hover:opacity-90"
          >
            적용
          </button>
          <button
            type="button"
            onClick={() => setBanOpen(false)}
            className="cursor-pointer text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          >
            취소
          </button>
        </form>
      )}
    </div>
  );
}
