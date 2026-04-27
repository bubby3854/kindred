"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createPopupAction,
  updatePopupAction,
  type PopupFormState,
} from "./actions";

type Initial = { title: string; body: string };

export function PopupForm({
  popupId,
  initial,
  submitLabel,
}: {
  popupId?: string;
  initial?: Initial;
  submitLabel: string;
}) {
  const action = popupId
    ? updatePopupAction.bind(null, popupId)
    : createPopupAction;
  const [state, formAction, pending] = useActionState<PopupFormState, FormData>(
    action,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!popupId && state && state.ok === true) formRef.current?.reset();
  }, [state, popupId]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          제목 <span className="text-[color:var(--accent)]">*</span>
        </span>
        <input
          name="title"
          required
          maxLength={120}
          autoComplete="off"
          defaultValue={initial?.title}
          placeholder="예: 운영 정책 안내"
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
          maxLength={4000}
          rows={10}
          defaultValue={initial?.body}
          placeholder="팝업에 보여줄 내용을 적어주세요. 줄바꿈은 그대로 표시됩니다."
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] transition-colors resize-y leading-relaxed"
        />
      </label>

      {state && state.ok === false && (
        <p role="alert" className="text-sm text-[color:var(--accent)]">
          {state.error}
        </p>
      )}
      {state && state.ok === true && popupId && (
        <p className="text-sm text-[color:var(--success)]">저장됨.</p>
      )}

      <div className="flex justify-end pt-1">
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
