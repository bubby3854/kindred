"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Provider = "kakao" | "google" | "github" | "apple";

// Only Google is enabled at MVP launch; other OAuth providers are kept in
// the source for re-enable later.
const PROVIDERS: {
  id: Provider;
  label: string;
  Icon: () => React.ReactElement;
  className?: string;
}[] = [
  { id: "google", label: "Google로 계속하기", Icon: GoogleIcon },
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

