"use client";

import { useEffect, useState } from "react";
import type { SitePopup } from "@/lib/repositories/site-popups";

function storageKey(viewerId: string | null): string {
  return `kindred:dismissed-popups:${viewerId ?? "anon"}`;
}

function readDismissed(viewerId: string | null): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(viewerId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr.filter((x) => typeof x === "string"));
  } catch {
    // ignore
  }
  return new Set();
}

function writeDismissed(viewerId: string | null, set: Set<string>) {
  try {
    localStorage.setItem(storageKey(viewerId), JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export function SitePopupGate({
  popups,
  viewerId,
}: {
  popups: SitePopup[];
  viewerId: string | null;
}) {
  const [current, setCurrent] = useState<SitePopup | null>(null);

  useEffect(() => {
    if (popups.length === 0) {
      // viewerId could have changed (logout/switch account) — reset.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrent(null);
      return;
    }
    const dismissed = readDismissed(viewerId);
    const next = popups.find((p) => !dismissed.has(p.id)) ?? null;
    // localStorage is only available client-side, so we must read on mount
    // and update state if a non-dismissed popup exists.
    setCurrent(next);
  }, [popups, viewerId]);

  useEffect(() => {
    if (!current) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  function dismiss() {
    if (!current) return;
    const dismissed = readDismissed(viewerId);
    dismissed.add(current.id);
    writeDismissed(viewerId, dismissed);
    // Show next pending popup if any.
    const next = popups.find((p) => !dismissed.has(p.id));
    setCurrent(next ?? null);
  }

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-popup-title"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-black/60 backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={dismiss}
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
      />
      <div className="relative max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] shadow-xl flex flex-col">
        <div className="px-6 pt-6 pb-2 flex items-baseline justify-between gap-3">
          <h2
            id="site-popup-title"
            className="font-serif text-2xl leading-tight"
          >
            {current.title}
          </h2>
          <button
            type="button"
            onClick={dismiss}
            aria-label="닫기"
            className="cursor-pointer text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors text-xl leading-none -mt-1"
          >
            ×
          </button>
        </div>
        <p className="px-6 py-2 text-sm text-[color:var(--foreground)] leading-relaxed whitespace-pre-wrap">
          {current.body}
        </p>
        <div className="px-6 py-4 flex justify-end border-t border-[color:var(--border)] mt-2">
          <button
            type="button"
            onClick={dismiss}
            className="cursor-pointer inline-flex items-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
