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
    <div className="mx-auto max-w-2xl px-6 pt-24 pb-24 flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          오류 · 잠시 멈췄어요
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl leading-[1.05] tracking-tight">
          뭔가{" "}
          <span className="italic text-[color:var(--accent)]">잘못</span>
          됐어요.
        </h1>
        <p className="text-[color:var(--muted)] leading-relaxed">
          예상치 못한 오류가 발생했어요. 잠시 후 다시 시도해주세요.
          계속 같은 화면이 보이면 아래의 ref 코드와 함께 알려주세요.
        </p>
        {(error.message || error.digest) && (
          <pre className="rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs font-mono text-[color:var(--muted)] overflow-x-auto">
            {error.message && <span>{error.message}</span>}
            {error.digest && (
              <span className="block mt-1">ref · {error.digest}</span>
            )}
          </pre>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
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
