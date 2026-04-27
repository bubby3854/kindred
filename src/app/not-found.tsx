import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 pt-24 pb-24 flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          404 · 길을 잃었어요
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl leading-[1.05] tracking-tight">
          이 자리는{" "}
          <span className="italic text-[color:var(--accent)]">비어있어요</span>
          .
        </h1>
        <p className="text-[color:var(--muted)] leading-relaxed">
          주소가 잘못됐거나, 글이 삭제됐거나, 비공개로 전환됐을 수 있어요.
          아래에서 다른 곳으로 이동해보세요.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href="/"
          className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          홈으로
          <span aria-hidden="true">→</span>
        </Link>
        <Link
          href="/community"
          className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium hover:border-[color:var(--foreground)] transition-colors"
        >
          커뮤니티 둘러보기
        </Link>
        <Link
          href="/makers"
          className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium hover:border-[color:var(--foreground)] transition-colors"
        >
          메이커 보기
        </Link>
      </div>

      <form
        action="/search"
        method="get"
        className="flex gap-2 pt-6 border-t border-[color:var(--border)]"
      >
        <input
          name="q"
          type="search"
          placeholder="원하던 걸 검색해보세요"
          className="flex-1 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[color:var(--foreground)] transition-colors"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          찾기
        </button>
      </form>
    </div>
  );
}
