import Link from "next/link";

export const metadata = { title: "개인정보처리방침 · kindred" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 홈
        </Link>
        <h1 className="font-serif text-4xl leading-tight">개인정보처리방침.</h1>
        <p className="text-sm text-[color:var(--muted)]">
          최종 갱신일 · 2026-04-27
        </p>
      </header>

      <article className="flex flex-col gap-8 leading-relaxed">
        <Section title="1. 수집하는 개인정보 항목">
          <ul className="list-disc pl-6 flex flex-col gap-1.5">
            <li>OAuth 가입 시: 이메일, 이름(닉네임 설정 시 대체), 프로필 사진</li>
            <li>서비스 등록 시: 본인이 입력한 사이트 정보 (제목·설명·URL 등)</li>
            <li>커뮤니티 활동 시: 게시글, 댓글, 좋아요</li>
            <li>유료 결제 시: 토스페이먼츠가 제공하는 빌링키(카드 정보 비저장)</li>
          </ul>
        </Section>

        <Section title="2. 개인정보 수집·이용 목적">
          서비스 제공, 본인 식별, 결제 처리, 부정 이용 방지, 운영 통계 분석을
          위해 사용합니다. 마케팅 메시지 전송에는 사용하지 않습니다.
        </Section>

        <Section title="3. 보유 및 이용 기간">
          회원 탈퇴 시 즉시 파기합니다. 단, 결제 기록 등 관계 법령에 따라
          보존이 필요한 정보는 해당 법령이 정한 기간 동안 보관합니다.
        </Section>

        <Section title="4. 제3자 제공">
          서비스는 이용자의 개인정보를 제3자에게 판매·제공하지 않습니다. 다만
          결제 처리(토스페이먼츠), 인증(Google 등)에 필요한 최소 정보는 해당
          서비스에 전달됩니다.
        </Section>

        <Section title="5. 처리 위탁">
          <ul className="list-disc pl-6 flex flex-col gap-1.5">
            <li>Supabase: 데이터베이스·인증·스토리지 호스팅</li>
            <li>Vercel: 웹 호스팅 및 콘텐츠 전송</li>
            <li>토스페이먼츠: 결제 처리</li>
          </ul>
        </Section>

        <Section title="6. 이용자의 권리">
          이용자는 언제든 본인의 정보 열람·정정·삭제를 요청할 수 있으며, 회원
          탈퇴를 통해 모든 정보를 즉시 파기할 수 있습니다.
        </Section>

        <Section title="7. 쿠키 사용">
          서비스는 로그인 세션 유지를 위해 필수 쿠키만 사용합니다. 광고 추적
          쿠키는 사용하지 않습니다.
        </Section>
      </article>

      <p className="text-sm text-[color:var(--muted)] pt-6 border-t border-[color:var(--border)]">
        개인정보 관련 문의는{" "}
        <a
          href="mailto:privacy@kindred.app"
          className="underline underline-offset-4 hover:text-[color:var(--accent)]"
        >
          privacy@kindred.app
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
      <div className="text-[color:var(--foreground)]">{children}</div>
    </section>
  );
}
