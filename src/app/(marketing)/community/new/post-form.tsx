"use client";

import { useActionState } from "react";
import { createPostAction, type PostFormState } from "../actions";

export function PostForm() {
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(
    createPostAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          제목 <span className="text-[color:var(--accent)]">*</span>
        </span>
        <input
          name="title"
          required
          maxLength={120}
          autoFocus
          autoComplete="off"
          placeholder="제목을 입력하세요"
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] transition-colors"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          내용 <span className="text-[color:var(--accent)]">*</span>
        </span>
        <textarea
          name="body"
          required
          maxLength={8000}
          rows={14}
          placeholder="자유롭게 적어주세요."
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] transition-colors resize-y leading-relaxed"
        />
      </label>

      {state && state.ok === false && (
        <p role="alert" className="text-sm text-[color:var(--accent)]">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer inline-flex items-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-wait transition-opacity"
        >
          {pending ? "등록 중…" : "등록"}
        </button>
      </div>
    </form>
  );
}
