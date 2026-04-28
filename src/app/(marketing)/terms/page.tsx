import Link from "next/link";

export const metadata = {
  title: "이용약관 · kindred",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 홈
        </Link>
        <h1 className="font-serif text-4xl leading-tight">이용약관.</h1>
        <p className="text-sm text-[color:var(--muted)]">
          최종 갱신일 · 2026-04-27
        </p>
      </header>

      <article className="flex flex-col gap-8 leading-relaxed">
        <Section title="제1조 (목적)">
          본 약관은 kindred(이하 &ldquo;서비스&rdquo;)가 제공하는 인디 메이커
          웹앱 디렉토리 서비스의 이용 조건과 절차, 회원과 서비스 운영자의
          권리·의무 및 책임 사항을 정함을 목적으로 합니다.
        </Section>

        <Section title="제2조 (회원 가입과 계정)">
          서비스는 Google 등 외부 인증 제공자를 통해 가입 절차를 진행합니다.
          회원은 가입 시 닉네임을 설정해야 하며, 닉네임은 서비스 페이지에 공개
          식별자로 노출됩니다.
        </Section>

        <Section title="제3조 (서비스 등록과 소유권 인증)">
          회원은 본인이 운영하는 라이브 웹앱을 등록할 수 있으며, 등록 시 사이트
          소유권 인증(메타 태그 방식) 절차를 거칩니다. 인증되지 않은 서비스는
          공개되지 않습니다. 등록한 서비스의 정보 정확성에 대한 책임은 회원
          본인에게 있습니다.
        </Section>

        <Section title="제4조 (금지 행위)">
          타인 사칭, 허위 등록, 악성 코드 또는 사기성 사이트 등록, 욕설·광고 등
          커뮤니티 가이드라인 위반은 금지됩니다. 위반 시 운영자는 사전 통지
          없이 게시물을 숨김 처리하거나 댓글 작성을 제한할 수 있습니다.
        </Section>

        <Section title="제5조 (구독과 결제)">
          유료 플랜은 토스페이먼츠를 통한 정기결제로 제공됩니다. 구독 취소 시
          익월부터 무료 플랜의 슬롯 한도를 초과하는 서비스는 비공개 상태로
          전환되며, 재구독 시 자동 복원됩니다.
        </Section>

        <Section title="제6조 (책임 제한)">
          서비스는 회원이 등록한 외부 사이트의 정상 동작·콘텐츠를 보증하지
          않으며, 외부 사이트로의 이동에서 발생한 손해에 대해 책임지지
          않습니다.
        </Section>

        <Section title="제7조 (약관의 변경)">
          서비스는 필요한 경우 본 약관을 변경할 수 있으며, 변경 시 사전에 공지
          기능을 통해 안내합니다.
        </Section>
      </article>

      <p className="text-sm text-[color:var(--muted)] pt-6 border-t border-[color:var(--border)]">
        문의는{" "}
        <a
          href="mailto:contact@kindred.app"
          className="underline underline-offset-4 hover:text-[color:var(--accent)]"
        >
          contact@kindred.app
        </a>
        로 보내주세요.
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="text-[color:var(--foreground)]">{children}</p>
    </section>
  );
}
