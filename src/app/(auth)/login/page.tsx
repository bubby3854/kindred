import { LoginButtons } from "./login-buttons";

export const metadata = { title: "로그인 · kindred" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-20 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          로그인
        </p>
        <h1 className="font-serif text-4xl leading-tight">
          <span className="italic text-[color:var(--accent)]">kindred</span>에
          오신 것을 환영해요.
        </h1>
        <p className="text-[color:var(--muted)] leading-relaxed">
          하나의 계정으로 내 웹앱을 등록하고, 다른 메이커들의 작품을 만나보세요.
        </p>
      </header>

      <LoginButtons />

      <p className="text-xs text-[color:var(--muted)] leading-relaxed">
        계속 진행하시면 등록할 앱이 본인 소유임을 확인하는 것에 동의하는
        것입니다. kindred는 사이트의 메타 태그를 통해 소유권을 검증합니다.
      </p>
    </div>
  );
}
