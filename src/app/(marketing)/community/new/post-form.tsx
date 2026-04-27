"use client";

import { useActionState } from "react";
import { createPostAction, type PostFormState } from "../actions";
import { POST_CATEGORIES, type CommunityPostCategory } from "@/lib/repositories/community";

type Initial = {
  title: string;
  body: string;
  category: CommunityPostCategory;
};

const EMPTY_INITIAL: Initial = {
  title: "",
  body: "",
  category: "CHAT",
};

export function PostForm({
  action,
  initial,
  submitLabel = "등록",
}: {
  action?: (prev: PostFormState, formData: FormData) => Promise<PostFormState>;
  initial?: Initial;
  submitLabel?: string;
} = {}) {
  const finalAction = action ?? createPostAction;
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(
    finalAction,
    null,
  );
  const init = initial ?? EMPTY_INITIAL;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          카테고리 <span className="text-[color:var(--accent)]">*</span>
        </span>
        <select
          name="category"
          required
          defaultValue={init.category}
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] transition-colors"
        >
          {POST_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

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
          defaultValue={init.title}
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
          defaultValue={init.body}
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
          {pending ? "저장 중…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
