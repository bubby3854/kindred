import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 pt-32 pb-24 flex flex-col gap-6 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
        404
      </p>
      <h1 className="font-serif text-5xl leading-tight">
        여기에는 아무것도 없어요.
      </h1>
      <p className="text-[color:var(--muted)] leading-relaxed">
        주소가 정확한지 확인해주세요. 페이지가 사라졌거나 이동됐을 수도 있어요.
      </p>
      <div className="pt-2">
        <Link
          href="/"
          className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          홈으로
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
