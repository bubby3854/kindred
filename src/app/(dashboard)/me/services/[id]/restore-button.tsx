"use client";

import { useActionState } from "react";
import { restoreServiceAction, type RestoreState } from "../actions";

const REASON_LABEL: Record<
  Exclude<NonNullable<RestoreState> & { ok: false }, { ok: true }>["reason"],
  string
> = {
  not_found: "서비스를 찾을 수 없어요.",
  wrong_status: "이미 다른 상태예요. 새로고침해주세요.",
  slot_full: "슬롯이 가득 찼어요. 다른 서비스를 정리한 뒤 다시 시도해주세요.",
};

export function RestoreButton({ serviceId }: { serviceId: string }) {
  const [state, action, pending] = useActionState<RestoreState>(
    restoreServiceAction.bind(null, serviceId),
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer inline-flex items-center justify-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-wait transition-opacity w-fit"
      >
        {pending ? "복원 중…" : "다시 공개하기"}
      </button>
      {state && state.ok === true && (
        <p className="text-sm text-[color:var(--success)]">
          공개로 전환됐어요.
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
