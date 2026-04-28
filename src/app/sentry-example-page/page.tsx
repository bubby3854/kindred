"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryExamplePage() {
  const [sent, setSent] = useState<string | null>(null);

  function triggerClientError() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (window as any).nonExistentFunctionForSentryTest;
    fn();
  }

  function triggerExplicitCapture() {
    const eventId = Sentry.captureException(
      new Error("kindred sentry-example explicit captureException"),
    );
    setSent(eventId);
  }

  async function triggerServerError() {
    await fetch("/api/sentry-test-throw");
  }

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "4rem 1.5rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Sentry 테스트 페이지
      </h1>
      <p style={{ color: "#666", marginBottom: "2rem", lineHeight: 1.6 }}>
        세 가지 방식의 에러를 발생시킵니다. 각 버튼 클릭 후 Sentry Issues 페이지에서
        해당 에러가 나타나는지 확인하세요.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <button
          type="button"
          onClick={triggerClientError}
          style={btnStyle}
        >
          1) Throw uncaught (window.onerror 경로)
        </button>
        <button
          type="button"
          onClick={triggerExplicitCapture}
          style={btnStyle}
        >
          2) Sentry.captureException 직접 호출
        </button>
        <button
          type="button"
          onClick={triggerServerError}
          style={btnStyle}
        >
          3) 서버 사이드 에러 트리거
        </button>
      </div>

      {sent && (
        <p style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "#0a0" }}>
          ✓ Sentry event ID: {sent}
        </p>
      )}
    </main>
  );
}

const btnStyle = {
  padding: "0.75rem 1rem",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "0.875rem",
  cursor: "pointer",
  fontFamily: "inherit",
} as const;
