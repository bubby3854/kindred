"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ maxWidth: "32rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
              문제가 생겼어요
            </h1>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              잠시 후 다시 시도해 주세요. 동일한 문제가 계속되면 알려주세요.
            </p>
            <Link
              href="/"
              style={{
                display: "inline-block",
                padding: "0.5rem 1rem",
                background: "#000",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "9999px",
                fontSize: "0.875rem",
              }}
            >
              홈으로
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
