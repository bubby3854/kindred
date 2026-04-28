import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { findById as findProfileById } from "@/lib/repositories/profiles";
import {
  countUnread as countUnreadNotifications,
  listForUser as listNotificationsForUser,
} from "@/lib/repositories/notifications";
import { NotificationBell } from "@/components/notification-bell";
import { MobileNav } from "@/components/mobile-nav";
import { SitePopupGate } from "@/components/site-popup-gate";
import { listActive as listActivePopups } from "@/lib/repositories/site-popups";
import { signOutAction } from "./auth-actions";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.kindred.kr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "kindred — 내가 만든 웹앱을 보여주는 곳",
  description:
    "메이커가 직접 만든 웹앱을 소유권 인증과 함께 소개하는 큐레이티드 디렉토리.",
  openGraph: {
    type: "website",
    siteName: "kindred",
    locale: "ko_KR",
    title: "kindred — 내가 만든 웹앱을 보여주는 곳",
    description:
      "메이커가 직접 만든 웹앱을 소유권 인증과 함께 소개하는 큐레이티드 디렉토리.",
  },
  twitter: {
    card: "summary_large_image",
  },
  verification: {
    google: "13FwzzQBS-0L39vRJfz73QLRrs0Ml0_VCrn1gmU0ogc",
    other: {
      "naver-site-verification":
        "f5d315c9f11efc2c17322e8cb51aa2fe7b364d2b",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await findProfileById(supabase, user.id) : null;
  const [unreadCount, notifications] = user
    ? await Promise.all([
        countUnreadNotifications(supabase, user.id),
        listNotificationsForUser(supabase, user.id, { limit: 20 }),
      ])
    : [0, []];
  const activePopups = await listActivePopups(supabase);

  const displayName =
    profile?.display_name ?? user?.email ?? null;
  const avatarUrl =
    profile?.avatar_url ??
    (user?.user_metadata?.avatar_url as string | undefined) ??
    null;
  const initial = (displayName ?? "?").trim().charAt(0).toUpperCase();

  return (
    <html
      lang="ko"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[color:var(--border)]">
          <nav className="mx-auto max-w-6xl flex items-center justify-between px-6 py-5 gap-4">
            <Link
              href="/"
              className="font-serif text-2xl leading-none tracking-tight shrink-0"
            >
              kindred
            </Link>
            <form
              action="/search"
              method="get"
              className="hidden md:flex flex-1 max-w-sm"
            >
              <input
                name="q"
                type="search"
                placeholder="검색"
                aria-label="검색"
                className="w-full rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-1.5 text-sm outline-none focus:border-[color:var(--foreground)] transition-colors"
              />
            </form>
            <div className="flex items-center gap-3 sm:gap-5 text-sm shrink-0">
              <div className="hidden md:flex items-center gap-5">
                <Link
                  href="/"
                  className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
                >
                  둘러보기
                </Link>
                <Link
                  href="/about"
                  className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
                >
                  소개
                </Link>
                <Link
                  href="/community"
                  className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
                >
                  커뮤니티
                </Link>
                <Link
                  href="/makers"
                  className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
                >
                  메이커
                </Link>
                <Link
                  href="/me"
                  className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
                >
                  내 페이지
                </Link>
                {profile?.is_admin && (
                  <Link
                    href="/admin/reports"
                    className="text-[color:var(--accent)] hover:opacity-80 transition-opacity"
                  >
                    관리자
                  </Link>
                )}
              </div>
              {user ? (
                <div className="flex items-center gap-3">
                  <NotificationBell
                    initialUnread={unreadCount}
                    initialItems={notifications}
                  />
                  <Link
                    href="/me"
                    aria-label={displayName ?? "내 계정"}
                    className="flex items-center gap-2 group"
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full border border-[color:var(--border)] object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="h-7 w-7 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] flex items-center justify-center text-xs font-medium"
                      >
                        {initial}
                      </span>
                    )}
                    <span className="hidden sm:inline text-[color:var(--muted)] group-hover:text-[color:var(--foreground)] transition-colors max-w-[10rem] truncate">
                      {displayName}
                    </span>
                  </Link>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="cursor-pointer text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
                    >
                      로그아웃
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="cursor-pointer inline-flex items-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-4 py-2 font-medium hover:opacity-90 transition-opacity"
                >
                  로그인
                </Link>
              )}
              <MobileNav isAdmin={Boolean(profile?.is_admin)} />
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <SitePopupGate popups={activePopups} viewerId={user?.id ?? null} />
        <footer className="border-t border-[color:var(--border)] mt-24">
          <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-[color:var(--muted)]">
            <span>
              <span className="font-serif text-base text-[color:var(--foreground)]">
                kindred
              </span>{" "}
              · {new Date().getFullYear()}
            </span>
            <div className="flex items-center gap-5">
              <Link
                href="/about"
                className="hover:text-[color:var(--foreground)] transition-colors"
              >
                소개
              </Link>
              <Link
                href="/terms"
                className="hover:text-[color:var(--foreground)] transition-colors"
              >
                이용약관
              </Link>
              <Link
                href="/privacy"
                className="hover:text-[color:var(--foreground)] transition-colors"
              >
                개인정보처리방침
              </Link>
              <Link
                href="/community"
                className="hover:text-[color:var(--foreground)] transition-colors"
              >
                커뮤니티
              </Link>
            </div>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
