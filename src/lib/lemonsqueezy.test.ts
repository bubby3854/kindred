import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import {
  mapStatus,
  planFromVariantId,
  verifyWebhookSignature,
} from "./lemonsqueezy";

describe("mapStatus", () => {
  it("active and on_trial → ACTIVE", () => {
    expect(mapStatus("active")).toBe("ACTIVE");
    expect(mapStatus("on_trial")).toBe("ACTIVE");
  });
  it("past_due and unpaid → PAST_DUE", () => {
    expect(mapStatus("past_due")).toBe("PAST_DUE");
    expect(mapStatus("unpaid")).toBe("PAST_DUE");
  });
  it("cancelled and expired → CANCELED", () => {
    expect(mapStatus("cancelled")).toBe("CANCELED");
    expect(mapStatus("expired")).toBe("CANCELED");
  });
  it("paused → PAUSED", () => {
    expect(mapStatus("paused")).toBe("PAUSED");
  });
  it("unknown status falls back to ACTIVE", () => {
    expect(mapStatus("totally-new-status")).toBe("ACTIVE");
  });
});

describe("planFromVariantId", () => {
  const originalPro = process.env.LEMONSQUEEZY_VARIANT_ID_PRO;
  const originalBus = process.env.LEMONSQUEEZY_VARIANT_ID_BUSINESS;

  beforeEach(() => {
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO = "111";
    process.env.LEMONSQUEEZY_VARIANT_ID_BUSINESS = "222";
  });
  afterEach(() => {
    process.env.LEMONSQUEEZY_VARIANT_ID_PRO = originalPro;
    process.env.LEMONSQUEEZY_VARIANT_ID_BUSINESS = originalBus;
  });

  it("matches PRO variant id", () => {
    expect(planFromVariantId("111")).toBe("PRO");
  });
  it("matches BUSINESS variant id", () => {
    expect(planFromVariantId("222")).toBe("BUSINESS");
  });
  it("returns null for unknown id", () => {
    expect(planFromVariantId("999")).toBe(null);
  });
  it("returns null for null/undefined input", () => {
    expect(planFromVariantId(null)).toBe(null);
    expect(planFromVariantId(undefined)).toBe(null);
  });
});

describe("verifyWebhookSignature", () => {
  const secret = "test-secret";
  const originalSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = secret;
  });
  afterEach(() => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = originalSecret;
  });

  function sign(body: string): string {
    return createHmac("sha256", secret).update(body).digest("hex");
  }

  it("returns true for valid signature", () => {
    const body = JSON.stringify({ meta: { event_name: "subscription_created" } });
    expect(verifyWebhookSignature(body, sign(body))).toBe(true);
  });

  it("returns false for tampered body", () => {
    const body = JSON.stringify({ meta: { event_name: "subscription_created" } });
    const sig = sign(body);
    const tampered = body.replace("created", "cancelled");
    expect(verifyWebhookSignature(tampered, sig)).toBe(false);
  });

  it("returns false for missing signature header", () => {
    expect(verifyWebhookSignature("body", null)).toBe(false);
  });

  it("returns false when secret missing", () => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const body = "x";
    // Cannot recompute sign without secret; just pass any hex
    expect(verifyWebhookSignature(body, "ab".repeat(32))).toBe(false);
  });

  it("returns false for malformed hex signature", () => {
    expect(verifyWebhookSignature("body", "not-hex-zzzz")).toBe(false);
  });
});
