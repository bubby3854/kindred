import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const error = new Error("kindred sentry-example server-side throw");
  Sentry.captureException(error);
  // Vercel serverless can exit before Sentry's queue flushes; force flush.
  await Sentry.flush(2000);
  throw error;
}
