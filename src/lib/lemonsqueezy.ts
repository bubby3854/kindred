import { createHmac, timingSafeEqual } from "node:crypto";

const API_BASE = "https://api.lemonsqueezy.com/v1";

function apiKey(): string {
  const k = process.env.LEMONSQUEEZY_API_KEY;
  if (!k) throw new Error("LEMONSQUEEZY_API_KEY missing");
  return k;
}

function storeId(): string {
  const s = process.env.LEMONSQUEEZY_STORE_ID;
  if (!s) throw new Error("LEMONSQUEEZY_STORE_ID missing");
  return s;
}

export type LSPlan = "PRO" | "BUSINESS";

export function planVariantId(plan: LSPlan): string {
  const id =
    plan === "PRO"
      ? process.env.LEMONSQUEEZY_VARIANT_ID_PRO
      : process.env.LEMONSQUEEZY_VARIANT_ID_BUSINESS;
  if (!id) throw new Error(`LEMONSQUEEZY_VARIANT_ID_${plan} missing`);
  return id;
}

const headers = () => ({
  Authorization: `Bearer ${apiKey()}`,
  Accept: "application/vnd.api+json",
  "Content-Type": "application/vnd.api+json",
});

export async function createCheckout(input: {
  plan: LSPlan;
  customData: Record<string, unknown>;
  customerEmail?: string;
  redirectUrl?: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const variantId = planVariantId(input.plan);
  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: input.customerEmail,
          custom: input.customData,
        },
        product_options: {
          redirect_url: input.redirectUrl,
        },
      },
      relationships: {
        store: { data: { type: "stores", id: storeId() } },
        variant: { data: { type: "variants", id: variantId } },
      },
    },
  };

  let resp: Response;
  try {
    resp = await fetch(`${API_BASE}/checkouts`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    return { ok: false, error: `HTTP ${resp.status}: ${detail.slice(0, 200)}` };
  }
  const json = (await resp.json()) as {
    data: { attributes: { url: string } };
  };
  return { ok: true, url: json.data.attributes.url };
}

export async function getCustomerPortalUrl(
  customerId: string,
): Promise<string | null> {
  const resp = await fetch(`${API_BASE}/customers/${customerId}`, {
    headers: headers(),
  });
  if (!resp.ok) return null;
  const json = (await resp.json()) as {
    data?: { attributes?: { urls?: { customer_portal?: string } } };
  };
  return json.data?.attributes?.urls?.customer_portal ?? null;
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const computed = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (computed.length !== signatureHeader.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(signatureHeader, "hex"),
    );
  } catch {
    return false;
  }
}

export type InternalSubStatus = "ACTIVE" | "PAST_DUE" | "CANCELED" | "PAUSED";

export function mapStatus(lsStatus: string): InternalSubStatus {
  switch (lsStatus) {
    case "active":
    case "on_trial":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "cancelled":
    case "expired":
      return "CANCELED";
    case "paused":
      return "PAUSED";
    default:
      return "ACTIVE";
  }
}

export function planFromVariantId(variantId: string | null | undefined): LSPlan | null {
  if (!variantId) return null;
  if (variantId === process.env.LEMONSQUEEZY_VARIANT_ID_PRO) return "PRO";
  if (variantId === process.env.LEMONSQUEEZY_VARIANT_ID_BUSINESS) return "BUSINESS";
  return null;
}
