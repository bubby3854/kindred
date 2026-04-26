"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleLikeAction } from "@/app/like-actions";

export function LikeButton({
  serviceId,
  initialCount,
  initialLiked,
  isLoggedIn,
  size = "md",
}: {
  serviceId: string;
  initialCount: number;
  initialLiked: boolean;
  isLoggedIn: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    const wasLiked = liked;
    // Optimistic
    setLiked(!wasLiked);
    setCount((c) => c + (wasLiked ? -1 : 1));
    startTransition(async () => {
      const res = await toggleLikeAction(serviceId, wasLiked);
      if (!res.ok) {
        // Revert
        setLiked(wasLiked);
        setCount((c) => c + (wasLiked ? 1 : -1));
      }
    });
  }

  const padding = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";
  const text = size === "sm" ? "text-xs" : "text-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
      className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full border ${padding} ${text} transition-colors disabled:opacity-50 ${
        liked
          ? "border-[color:var(--accent)] text-[color:var(--accent)] bg-[color:var(--accent)]/5"
          : "border-[color:var(--border)] hover:border-[color:var(--foreground)]"
      }`}
    >
      <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
      <span className="font-mono tabular-nums">{count}</span>
    </button>
  );
}
