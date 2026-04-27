"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={wrapperRef} className="md:hidden relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        className="cursor-pointer inline-flex items-center justify-center h-9 w-9 rounded-full text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--card)] transition-colors"
      >
        {open ? <CloseIcon /> : <BurgerIcon />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] shadow-lg z-50 overflow-hidden">
          <form action="/search" method="get" className="p-3 border-b border-[color:var(--border)]">
            <input
              name="q"
              type="search"
              placeholder="검색"
              aria-label="검색"
              className="w-full rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-1.5 text-sm outline-none focus:border-[color:var(--foreground)] transition-colors"
            />
          </form>
          <nav className="flex flex-col py-2 text-sm">
            <NavLink href="/" label="둘러보기" onSelect={() => setOpen(false)} />
            <NavLink href="/about" label="소개" onSelect={() => setOpen(false)} />
            <NavLink
              href="/community"
              label="커뮤니티"
              onSelect={() => setOpen(false)}
            />
            <NavLink
              href="/makers"
              label="메이커"
              onSelect={() => setOpen(false)}
            />
            <NavLink href="/me" label="내 페이지" onSelect={() => setOpen(false)} />
            {isAdmin && (
              <NavLink
                href="/admin/reports"
                label="관리자"
                onSelect={() => setOpen(false)}
                accent
              />
            )}
          </nav>
        </div>
      )}
    </div>
  );
}

function NavLink({
  href,
  label,
  onSelect,
  accent = false,
}: {
  href: string;
  label: string;
  onSelect: () => void;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={`px-4 py-2.5 hover:bg-[color:var(--card)] transition-colors ${
        accent
          ? "text-[color:var(--accent)]"
          : "text-[color:var(--foreground)]"
      }`}
    >
      {label}
    </Link>
  );
}

function BurgerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  );
}
