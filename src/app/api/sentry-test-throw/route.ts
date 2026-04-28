export const dynamic = "force-dynamic";

export async function GET() {
  throw new Error("kindred sentry-example server-side throw");
}
