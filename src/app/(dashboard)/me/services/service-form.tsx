"use client";

import { useActionState } from "react";
import type { FormState } from "./actions";

type Category = { id: number; slug: string; name: string };

type Initial = {
  title: string;
  tagline: string;
  description: string;
  url: string;
  category_id: number | null;
};

const EMPTY_INITIAL: Initial = {
  title: "",
  tagline: "",
  description: "",
  url: "",
  category_id: null,
};

export function ServiceForm({
  action,
  categories,
  initial,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  categories: Category[];
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    null,
  );
  const init = initial ?? EMPTY_INITIAL;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Field label="제목" hint="서비스의 이름을 알려주세요." required>
        <input
          name="title"
          required
          maxLength={80}
          defaultValue={init.title}
          placeholder="예: kindred"
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] transition-colors"
        />
      </Field>

      <Field label="한 줄 소개" hint="160자 이내. 카드와 상세 페이지 상단에 표시돼요.">
        <input
          name="tagline"
          maxLength={160}
          defaultValue={init.tagline}
          placeholder="내가 만든 웹앱이 머무를 자리"
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] transition-colors"
        />
      </Field>

      <Field label="URL" hint="실제 서비스 주소." required>
        <input
          name="url"
          type="url"
          required
          inputMode="url"
          defaultValue={init.url}
          placeholder="https://example.com"
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] font-mono text-sm transition-colors"
        />
      </Field>

      <Field label="카테고리" required>
        <select
          name="category_id"
          required
          defaultValue={init.category_id ?? ""}
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] transition-colors"
        >
          <option value="" disabled>
            선택해주세요
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="소개" hint="2,000자 이내. 길게 적어도 좋아요.">
        <textarea
          name="description"
          maxLength={2000}
          defaultValue={init.description}
          rows={6}
          placeholder="이 서비스가 어떤 문제를 푸는지, 어떤 사람에게 좋은지 자유롭게 적어주세요."
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 outline-none focus:border-[color:var(--foreground)] transition-colors resize-y"
        />
      </Field>

      {state && state.ok === false && (
        <p
          role="alert"
          className="text-sm text-[color:var(--accent)] -mt-2"
        >
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
          {pending ? "저장 중…" : submitLabel}
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
