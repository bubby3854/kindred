"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createAnnouncementAction,
  type AnnouncementFormState,
} from "./actions";

export function AnnouncementForm() {
  const [state, formAction, pending] = useActionState<
    AnnouncementFormState,
    FormData
  >(createAnnouncementAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && state.ok === true) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          공지 내용 <span className="text-[color:var(--accent)]">*</span>
        </span>
        <textarea
          name="body"
          required
          maxLength={1000}
          rows={6}
          placeholder="모든 사용자에게 전송될 공지를 적어주세요. (최대 1,000자)"
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] transition-colors resize-y leading-relaxed"
        />
        <span className="text-xs text-[color:var(--muted)]">
          전송하면 모든 사용자의 알림함에 즉시 표시됩니다. 되돌릴 수 없어요.
        </span>
      </label>

      {state && state.ok === false && (
        <p role="alert" className="text-sm text-[color:var(--accent)]">
          {state.error}
        </p>
      )}
      {state && state.ok === true && (
        <p className="text-sm text-[color:var(--success)]">
          {state.count}명에게 전송됨.
        </p>
      )}

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer inline-flex items-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-wait transition-opacity"
        >
          {pending ? "전송 중…" : "전체 공지 전송"}
        </button>
      </div>
    </form>
  );
}
