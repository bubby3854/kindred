import Link from "next/link";

export const metadata = {
  title: "kindred는 어떤 곳인가요 · kindred",
  description:
    "kindred는 직접 만든 웹앱을 소유권 인증과 함께 소개하는 큐레이티드 디렉토리입니다.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 flex flex-col gap-16">
      <header className="flex flex-col gap-5">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          kindred 소개
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl leading-[1.05] tracking-tight">
          내가 만든 웹앱이{" "}
          <span className="italic text-[color:var(--accent)]">머무를 자리</span>
          .
        </h1>
        <p className="text-lg text-[color:var(--muted)] leading-relaxed">
          kindred는 인디 메이커가 직접 만든 라이브 웹앱을 소유권 인증과 함께
          소개하는 큐레이티드 디렉토리입니다. 누구나 등록한 사이트를 둘러보고,
          마음에 드는 메이커에게 직접 연락할 수 있어요.
        </p>
      </header>

      <section className="flex flex-col gap-8">
        <h2 className="font-serif text-3xl border-b border-[color:var(--border)] pb-3">
          어떻게 동작하나요?
        </h2>
        <ol className="flex flex-col gap-6">
          <Step
            n="01"
            title="등록"
            body="제목·태그·소개를 입력하고 본인 사이트 URL을 적습니다. 누구나 자유롭게 시작할 수 있어요."
          />
          <Step
            n="02"
            title="소유권 인증"
            body="kindred가 발급한 메타 태그를 사이트의 <head>에 붙이고 인증 버튼을 누릅니다. 본인 소유인 사이트만 공개됩니다."
          />
          <Step
            n="03"
            title="공개와 발견"
            body="인증이 끝나면 사이트의 og:image를 자동으로 가져와 카드 썸네일로 사용합니다. 카테고리·태그·검색·인기순으로 누구나 발견할 수 있어요."
          />
        </ol>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-serif text-3xl border-b border-[color:var(--border)] pb-3">
          누구를 위한 곳인가요?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Audience
            title="인디 메이커"
            body="혼자 또는 작은 팀이 만든 웹앱·툴·실험을 모아두는 자기 페이지로 활용하세요. 출시·채용·도움 요청을 커뮤니티에서 나눌 수 있어요."
          />
          <Audience
            title="회사 관계자·협업자"
            body="기술 스택과 작업물을 한눈에 보고, 메이커가 공개한 연락 채널로 직접 컨택할 수 있어요. 매칭 중개자 없이 1:1로."
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-8">
        <h2 className="font-serif text-2xl">시작하기</h2>
        <p className="text-[color:var(--muted)] leading-relaxed">
          한 계정에 사이트 3개까지 등록할 수 있어요. 모두 무료입니다.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/me/services/new"
            className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            내 웹앱 등록
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/"
            className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium hover:border-[color:var(--foreground)] transition-colors"
          >
            라이브 둘러보기
            <span aria-hidden="true">↓</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-5">
      <span className="font-mono text-sm text-[color:var(--muted)] shrink-0 pt-1">
        {n}
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-serif text-xl">{title}</h3>
        <p className="text-[color:var(--muted)] leading-relaxed">{body}</p>
      </div>
    </li>
  );
}

function Audience({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[color:var(--border)] p-5">
      <h3 className="font-serif text-xl">{title}</h3>
      <p className="text-sm text-[color:var(--muted)] leading-relaxed">{body}</p>
    </div>
  );
}
