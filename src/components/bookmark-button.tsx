"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleBookmarkAction } from "@/app/bookmark-actions";

export function BookmarkButton({
  serviceId,
  initialBookmarked,
  isLoggedIn,
  size = "md",
}: {
  serviceId: string;
  initialBookmarked: boolean;
  isLoggedIn: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);
    startTransition(async () => {
      const res = await toggleBookmarkAction(serviceId, wasBookmarked);
      if (!res.ok) setBookmarked(wasBookmarked);
    });
  }

  const padding = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";
  const text = size === "sm" ? "text-xs" : "text-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "북마크 해제" : "북마크"}
      title={bookmarked ? "북마크 해제" : "북마크"}
      className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full border ${padding} ${text} transition-colors disabled:opacity-50 ${
        bookmarked
          ? "border-[color:var(--accent)] text-[color:var(--accent)] bg-[color:var(--accent)]/5"
          : "border-[color:var(--border)] hover:border-[color:var(--foreground)]"
      }`}
    >
      <span aria-hidden="true">{bookmarked ? "★" : "☆"}</span>
    </button>
  );
}
