import crypto from "node:crypto";

// Toss Payments API base URL.
export const TOSS_API_BASE = "https://api.tosspayments.com";

function authHeader(secret: string) {
  // Toss expects HTTP Basic with `${secret}:` (note trailing colon).
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

export type IssueBillingKeyResult = {
  billingKey: string;
  customerKey: string;
  cardCompany?: string;
  cardNumber?: string;
};

// Exchange the authKey returned to our successUrl for a permanent billingKey.
// Reference: https://docs.tosspayments.com/reference#authorize-billing-key
export async function issueBillingKey(input: {
  authKey: string;
  customerKey: string;
}): Promise<IssueBillingKeyResult> {
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) throw new Error("TOSS_SECRET_KEY not set");

  const res = await fetch(`${TOSS_API_BASE}/v1/billing/authorizations/issue`, {
    method: "POST",
    headers: {
      Authorization: authHeader(secret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      authKey: input.authKey,
      customerKey: input.customerKey,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`toss.issueBillingKey failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as {
    billingKey: string;
    customerKey: string;
    card?: { company?: string; number?: string };
  };
  return {
    billingKey: json.billingKey,
    customerKey: json.customerKey,
    cardCompany: json.card?.company,
    cardNumber: json.card?.number,
  };
}

// Charge a subscriber using a previously stored billingKey.
// Reference: https://docs.tosspayments.com/reference#bill-with-billing-key
export async function chargeBillingKey(input: {
  billingKey: string;
  customerKey: string;
  orderId: string;
  orderName: string;
  amount: number;
}) {
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) throw new Error("TOSS_SECRET_KEY not set");

  const res = await fetch(
    `${TOSS_API_BASE}/v1/billing/${encodeURIComponent(input.billingKey)}`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(secret),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerKey: input.customerKey,
        orderId: input.orderId,
        orderName: input.orderName,
        amount: input.amount,
      }),
    },
  );
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: json };
}

// Plan → KRW amount. Set the actual prices in Toss + here.
export const PLAN_AMOUNT_KRW = {
  FREE: 0,
  PRO: Number(process.env.TOSS_PRO_AMOUNT ?? 9900),
  BUSINESS: Number(process.env.TOSS_BUSINESS_AMOUNT ?? 29000),
} as const;

// Toss webhook signature verification.
// Toss sends a `Toss-Signature` header (HMAC-SHA256, base64) of the raw body.
// Reference: https://docs.tosspayments.com/guides/webhook
export function verifyTossSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): { ok: true } | { ok: false; reason: string } {
  if (!signatureHeader) return { ok: false, reason: "missing_header" };
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "signature_mismatch" };
  }
  return { ok: true };
}

export function mapTossStatusToInternal(
  tossStatus: string | undefined,
): "ACTIVE" | "PAUSED" | "CANCELED" | "PAST_DUE" {
  switch (tossStatus) {
    case "DONE":
    case "ACTIVE":
      return "ACTIVE";
    case "ABORTED":
    case "EXPIRED":
    case "CANCELED":
      return "CANCELED";
    case "FAILED":
      return "PAST_DUE";
    default:
      return "ACTIVE";
  }
}
