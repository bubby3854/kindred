"use client";

import { useActionState, useEffect } from "react";
import { startCheckoutAction, type CheckoutState } from "./actions";

export function CheckoutButton({
  plan,
  label,
}: {
  plan: "PRO" | "BUSINESS";
  label: string;
}) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    startCheckoutAction,
    null,
  );

  useEffect(() => {
    if (state && state.ok === true) {
      // Redirect to LS hosted checkout.
      window.location.href = state.url;
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="plan" value={plan} />
      <button
        type="submit"
        disabled={pending || (state?.ok === true)}
        className="cursor-pointer inline-flex items-center justify-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-wait transition-opacity"
      >
        {pending || state?.ok === true ? "결제 페이지로…" : label}
      </button>
      {state && state.ok === false && (
        <p
          role="alert"
          className="text-xs text-[color:var(--accent)] leading-relaxed"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
