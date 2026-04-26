const META_NAME = "kindred-verify";
const FETCH_TIMEOUT_MS = 8000;

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "fetch_failed" | "meta_missing" | "token_mismatch"; detail?: string };

export async function verifyOwnership(
  siteUrl: string,
  expectedToken: string,
): Promise<VerifyResult> {
  let html: string;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(siteUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "kindred-verify/1.0 (+https://kindred.app)" },
    });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, reason: "fetch_failed", detail: `HTTP ${res.status}` };
    html = await res.text();
  } catch (err) {
    return { ok: false, reason: "fetch_failed", detail: (err as Error).message };
  }

  const found = extractMetaContent(html, META_NAME);
  if (!found) return { ok: false, reason: "meta_missing" };
  if (found.trim() !== expectedToken) return { ok: false, reason: "token_mismatch" };
  return { ok: true };
}

// Minimal head-only meta extraction. Avoids pulling in a full HTML parser.
function extractMetaContent(html: string, name: string): string | null {
  const head = html.slice(0, Math.min(html.length, 64 * 1024));
  const pattern = new RegExp(
    `<meta[^>]*\\bname\\s*=\\s*["']${escapeRegExp(name)}["'][^>]*>`,
    "i",
  );
  const tag = head.match(pattern)?.[0];
  if (!tag) return null;
  const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
  return content?.[1] ?? null;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
