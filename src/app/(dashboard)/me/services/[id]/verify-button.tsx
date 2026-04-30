"use client";

import { useActionState } from "react";
import { verifyServiceAction, type VerifyState } from "../actions";

const REASON_LABEL: Record<
  Exclude<NonNullable<VerifyState> & { ok: false }, { ok: true }>["reason"],
  string
> = {
  not_found: "서비스를 찾을 수 없어요.",
  forbidden: "권한이 없어요.",
  slot_full: "슬롯이 가득 찼어요. 다른 서비스를 정리한 뒤 다시 시도해주세요.",
  fetch_failed: "사이트에 접근할 수 없었어요. URL이 올바른지 확인해주세요.",
  meta_missing: "사이트 <head>에서 인증 메타 태그를 찾지 못했어요.",
  token_mismatch: "메타 태그의 값이 일치하지 않아요.",
};

export function VerifyButton({ serviceId }: { serviceId: string }) {
  const [state, action, pending] = useActionState<VerifyState>(
    verifyServiceAction.bind(null, serviceId),
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer inline-flex items-center justify-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-wait transition-opacity w-fit"
      >
        {pending ? "확인 중…" : "지금 확인하기"}
      </button>
      {state && state.ok === true && (
        <p className="text-sm text-[color:var(--success)]">
          인증 완료. 이제 모두에게 보여요.
        </p>
      )}
      {state && state.ok === false && (
        <p role="alert" className="text-sm text-[color:var(--accent)]">
          {REASON_LABEL[state.reason]}
          {state.detail && (
            <span className="text-[color:var(--muted)]"> · {state.detail}</span>
          )}
        </p>
      )}
    </form>
  );
}
