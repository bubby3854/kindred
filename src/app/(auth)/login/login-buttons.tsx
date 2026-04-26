"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Provider = "kakao" | "google" | "github" | "apple";

const PROVIDERS: {
  id: Provider;
  label: string;
  Icon: () => React.ReactElement;
  className?: string;
}[] = [
  {
    id: "kakao",
    label: "카카오로 계속하기",
    Icon: KakaoIcon,
    // Kakao gets a colored treatment per Kakao brand guidelines
    className:
      "bg-[#FEE500] text-[#191919] border-transparent hover:bg-[#F0D900]",
  },
  { id: "google", label: "Google로 계속하기", Icon: GoogleIcon },
  { id: "github", label: "GitHub으로 계속하기", Icon: GitHubIcon },
  { id: "apple", label: "Apple로 계속하기", Icon: AppleIcon },
];

export function LoginButtons() {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    setPending(provider);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setPending(null);
      setError(error.message);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {PROVIDERS.map(({ id, label, Icon, className }) => (
        <button
          key={id}
          type="button"
          onClick={() => signIn(id)}
          disabled={pending !== null}
          aria-label={label}
          className={`cursor-pointer inline-flex items-center justify-center gap-3 rounded-full border px-5 py-3.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-wait ${
            className ??
            "border-[color:var(--border)] bg-[color:var(--card)] hover:border-[color:var(--foreground)]"
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center">
            <Icon />
          </span>
          <span>{pending === id ? "이동 중…" : label}</span>
        </button>
      ))}
      {error && (
        <p role="alert" className="text-sm text-[color:var(--accent)] mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#191919"
        d="M12 3C6.48 3 2 6.55 2 10.93c0 2.85 1.86 5.34 4.66 6.74-.13.5-.83 3.15-.86 3.31 0 0-.01.16.08.22.1.06.21.01.21.01.27-.04 3.21-2.13 3.7-2.46.71.1 1.45.16 2.21.16 5.52 0 10-3.55 10-7.93C22 6.55 17.52 3 12 3Z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.67-2.26 1.07-3.72 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.12a6.6 6.6 0 0 1 0-4.24V7.04H2.18a11 11 0 0 0 0 9.92l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 1.27a11 11 0 0 0-3.48 21.44c.55.1.75-.24.75-.53v-1.86c-3.06.67-3.71-1.47-3.71-1.47-.5-1.27-1.22-1.61-1.22-1.61-1-.68.08-.67.08-.67 1.1.08 1.68 1.14 1.68 1.14.98 1.68 2.58 1.2 3.21.92.1-.72.38-1.2.7-1.48-2.45-.28-5.02-1.22-5.02-5.43 0-1.2.43-2.18 1.14-2.95-.11-.28-.49-1.4.11-2.91 0 0 .93-.3 3.05 1.13a10.5 10.5 0 0 1 5.56 0c2.11-1.43 3.04-1.13 3.04-1.13.6 1.51.23 2.63.11 2.91.71.77 1.14 1.75 1.14 2.95 0 4.22-2.58 5.15-5.04 5.42.4.34.75 1 .75 2.03v3.01c0 .29.2.64.76.53A11 11 0 0 0 12 1.27Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.3c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
    </svg>
  );
}
