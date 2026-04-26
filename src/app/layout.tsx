import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "kindred — 내가 만든 웹앱을 보여주는 곳",
  description:
    "메이커가 직접 만든 웹앱을 소유권 인증과 함께 소개하는 큐레이티드 디렉토리.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          <nav className="mx-auto max-w-6xl flex items-center justify-between px-6 py-5">
            <Link
              href="/"
              className="font-serif text-2xl leading-none tracking-tight"
            >
              kindred
            </Link>
            <div className="flex items-center gap-7 text-sm">
              <Link
                href="/"
                className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
              >
                둘러보기
              </Link>
              <Link
                href="/me"
                className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
              >
                내 페이지
              </Link>
              <Link
                href="/login"
                className="cursor-pointer inline-flex items-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-4 py-2 font-medium hover:opacity-90 transition-opacity"
              >
                로그인
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[color:var(--border)] mt-24">
          <div className="mx-auto max-w-6xl px-6 py-10 flex items-center justify-between text-sm text-[color:var(--muted)]">
            <span>
              <span className="font-serif text-base text-[color:var(--foreground)]">
                kindred
              </span>{" "}
              · {new Date().getFullYear()}
            </span>
            <span>Next.js · Supabase · Toss Payments</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
