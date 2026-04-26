"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-6 pt-32 pb-24 flex flex-col gap-6 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
        문제가 생겼어요
      </p>
      <h1 className="font-serif text-4xl leading-tight">
        잠시 후 다시 시도해주세요.
      </h1>
      <p className="text-sm text-[color:var(--muted)] leading-relaxed">
        {error.message || "예상치 못한 오류가 발생했어요."}
        {error.digest && (
          <span className="block mt-2 font-mono text-xs">
            ref · {error.digest}
          </span>
        )}
      </p>
      <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
        <button
          type="button"
          onClick={() => reset()}
          className="cursor-pointer inline-flex items-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="cursor-pointer inline-flex items-center rounded-full border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium hover:border-[color:var(--foreground)] transition-colors"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
