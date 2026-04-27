"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  markAllReadAction,
  deleteNotificationAction,
} from "@/app/notification-actions";
import type { NotificationItem } from "@/lib/repositories/notifications";

export function NotificationBell({
  initialUnread,
  initialItems,
}: {
  initialUnread: number;
  initialItems: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const markedReadRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function toggle() {
    setOpen((v) => {
      const next = !v;
      // Mark all as read once when opening (only first time per session if unread)
      if (next && !markedReadRef.current && unread > 0) {
        markedReadRef.current = true;
        const now = new Date().toISOString();
        setUnread(0);
        setItems((list) =>
          list.map((i) => (i.read_at ? i : { ...i, read_at: now })),
        );
        startTransition(() => {
          void markAllReadAction();
        });
      }
      return next;
    });
  }

  function remove(id: string) {
    setItems((list) => list.filter((i) => i.id !== id));
    startTransition(() => {
      void deleteNotificationAction(id);
    });
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={
          unread > 0 ? `읽지 않은 알림 ${unread}개` : "알림"
        }
        className="cursor-pointer relative inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-[color:var(--card)] transition-colors text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
      >
        <BellIcon />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[color:var(--accent)] ring-2 ring-[color:var(--background)]"
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] shadow-lg z-50">
          <div className="px-4 py-3 border-b border-[color:var(--border)] text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
            알림
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-[color:var(--muted)] text-center">
              알림이 없어요.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-[color:var(--border)]">
              {items.map((n) => (
                <li
                  key={n.id}
                  className="px-4 py-3 flex flex-col gap-1.5 hover:bg-[color:var(--card)] transition-colors"
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {n.body}
                  </p>
                  <div className="flex items-center justify-between gap-3 text-xs text-[color:var(--muted)]">
                    <span>{new Date(n.created_at).toLocaleString("ko-KR")}</span>
                    <button
                      type="button"
                      onClick={() => remove(n.id)}
                      className="cursor-pointer hover:text-[color:var(--accent)]"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
