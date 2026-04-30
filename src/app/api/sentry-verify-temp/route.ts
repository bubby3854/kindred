import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const stamp = new Date().toISOString();
  const error = new Error(`SENTRY-VERIFY-${stamp}`);
  Sentry.captureException(error);
  await Sentry.flush(2000);
  throw error;
}
