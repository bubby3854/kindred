"use client";

import { useActionState } from "react";
import { updateProfileAction, type FormState } from "./actions";

type Initial = {
  display_name: string;
  contact_email: string;
  external_url: string;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateProfileAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Field
        label="닉네임"
        hint="2-20자. 서비스 페이지에 메이커명으로 표시돼요."
        required
      >
        <input
          name="display_name"
          required
          minLength={2}
          maxLength={20}
          defaultValue={initial.display_name}
          autoComplete="off"
          placeholder="예: 오렌지캣"
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] transition-colors"
        />
      </Field>

      <Field label="공개 이메일" hint="회사·협업 문의용. 비워두면 표시 안 됨.">
        <input
          name="contact_email"
          type="email"
          inputMode="email"
          defaultValue={initial.contact_email}
          autoComplete="off"
          placeholder="contact@example.com"
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] font-mono text-sm transition-colors"
        />
      </Field>

      <Field label="외부 링크" hint="LinkedIn, 카카오 오픈채팅, 트위터 등 1개. 비워두면 표시 안 됨.">
        <input
          name="external_url"
          type="url"
          inputMode="url"
          defaultValue={initial.external_url}
          placeholder="https://linkedin.com/in/..."
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] font-mono text-sm transition-colors"
        />
      </Field>

      {state && state.ok === false && (
        <p role="alert" className="text-sm text-[color:var(--accent)] -mt-2">
          {state.error}
        </p>
      )}
      {state && state.ok === true && (
        <p className="text-sm text-[color:var(--success)] -mt-2">저장됨.</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer inline-flex items-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-wait transition-opacity"
        >
          {pending ? "저장 중…" : "프로필 저장"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">
          {label}
          {required && <span className="text-[color:var(--accent)]"> *</span>}
        </span>
        {hint && (
          <span className="text-xs text-[color:var(--muted)]">{hint}</span>
        )}
      </div>
      {children}
    </label>
  );
}
