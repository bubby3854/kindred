"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePostLikeAction } from "@/app/(marketing)/community/actions";

export function PostLikeButton({
  postId,
  initialCount,
  initialLiked,
  isLoggedIn,
}: {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  isLoggedIn: boolean;
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
    setLiked(!wasLiked);
    setCount((c) => c + (wasLiked ? -1 : 1));
    startTransition(async () => {
      const res = await togglePostLikeAction(postId, wasLiked);
      if (!res.ok) {
        setLiked(wasLiked);
        setCount((c) => c + (wasLiked ? 1 : -1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
      className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
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
