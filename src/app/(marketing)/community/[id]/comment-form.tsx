"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createCommentAction,
  type CommentFormState,
} from "../actions";

export function CommentForm({ postId }: { postId: string }) {
  const action = createCommentAction.bind(null, postId);
  const [state, formAction, pending] = useActionState<CommentFormState, FormData>(
    action,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && state.ok === true) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <textarea
        name="body"
        required
        maxLength={2000}
        rows={4}
        placeholder="댓글을 남겨주세요."
        className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] transition-colors resize-y leading-relaxed"
      />
      {state && state.ok === false && (
        <p role="alert" className="text-sm text-[color:var(--accent)]">
          {state.error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer inline-flex items-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-wait transition-opacity"
        >
          {pending ? "등록 중…" : "댓글 달기"}
        </button>
      </div>
    </form>
  );
}
