const META_NAME = "kindred-verify";
const FETCH_TIMEOUT_MS = 8000;
const HEAD_BYTES = 64 * 1024;

export type VerifyResult =
  | { ok: true; thumbnailUrl: string | null }
  | { ok: false; reason: "fetch_failed" | "meta_missing" | "token_mismatch"; detail?: string };

export async function verifyOwnership(
  siteUrl: string,
  expectedToken: string,
): Promise<VerifyResult> {
  let html: string;
  let finalUrl = siteUrl;
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
    finalUrl = res.url || siteUrl;
    html = await res.text();
  } catch (err) {
    return { ok: false, reason: "fetch_failed", detail: (err as Error).message };
  }

  const head = html.slice(0, Math.min(html.length, HEAD_BYTES));
  const found = extractMetaByName(head, META_NAME);
  if (!found) return { ok: false, reason: "meta_missing" };
  if (found.trim() !== expectedToken) return { ok: false, reason: "token_mismatch" };

  const rawImage =
    extractMetaByProperty(head, "og:image") ??
    extractMetaByName(head, "twitter:image") ??
    extractMetaByName(head, "twitter:image:src");
  const thumbnailUrl = rawImage ? resolveUrl(rawImage.trim(), finalUrl) : null;

  return { ok: true, thumbnailUrl };
}

function extractMetaByName(head: string, name: string): string | null {
  return matchMetaContent(head, "name", name);
}

function extractMetaByProperty(head: string, property: string): string | null {
  return matchMetaContent(head, "property", property);
}

function matchMetaContent(head: string, attr: string, value: string): string | null {
  const pattern = new RegExp(
    `<meta[^>]*\\b${attr}\\s*=\\s*["']${escapeRegExp(value)}["'][^>]*>`,
    "i",
  );
  const tag = head.match(pattern)?.[0];
  if (!tag) return null;
  const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
  return content?.[1] ?? null;
}

function resolveUrl(candidate: string, base: string): string | null {
  try {
    return new URL(candidate, base).toString();
  } catch {
    return null;
  }
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
