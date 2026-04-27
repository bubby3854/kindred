"use client";

import { useState, useTransition } from "react";
import { openCustomerPortalAction } from "./actions";

export function PortalButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = await openCustomerPortalAction();
      if (res.ok) {
        window.location.href = res.url;
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="cursor-pointer inline-flex items-center justify-center rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-medium hover:border-[color:var(--foreground)] disabled:opacity-50 transition-colors w-fit"
      >
        {pending ? "이동 중…" : "결제·구독 관리"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-[color:var(--accent)]">
          {error}
        </p>
      )}
    </div>
  );
}
