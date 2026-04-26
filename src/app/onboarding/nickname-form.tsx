"use client";

import { useActionState } from "react";
import { setNicknameAction, type FormState } from "./actions";

export function NicknameForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    setNicknameAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          닉네임 <span className="text-[color:var(--accent)]">*</span>
        </span>
        <input
          name="nickname"
          required
          minLength={2}
          maxLength={20}
          autoFocus
          autoComplete="off"
          placeholder="예: 오렌지캣"
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] transition-colors"
        />
        <span className="text-xs text-[color:var(--muted)]">
          2-20자. 서비스 페이지에 공개적으로 표시돼요. 나중에 변경할 수 있습니다.
        </span>
      </label>

      {state && state.ok === false && (
        <p role="alert" className="text-sm text-[color:var(--accent)]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer inline-flex items-center justify-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-wait transition-opacity"
      >
        {pending ? "저장 중…" : "시작하기"}
      </button>
    </form>
  );
}
