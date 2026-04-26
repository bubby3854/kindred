import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  downgradeToFree,
  findByCustomerKey as findSubscriptionByCustomerKey,
  updateByUserId as updateSubscriptionByUserId,
} from "@/lib/repositories/subscriptions";
import {
  listActiveByOwnerNewestFirst,
  setStatusByIds,
} from "@/lib/repositories/services";
import { mapTossStatusToInternal, verifyTossSignature } from "@/lib/toss";

// Toss Payments webhook endpoint. Configure in the Toss merchant dashboard
// pointing at <site>/api/toss/webhook. Signature verification is HMAC-SHA256
// over the raw body using TOSS_WEBHOOK_SECRET.
export async function POST(request: NextRequest) {
  const secret = process.env.TOSS_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const raw = await request.text();
  const sig = verifyTossSignature(raw, request.headers.get("toss-signature"), secret);
  if (!sig.ok) {
    return NextResponse.json({ error: sig.reason }, { status: 401 });
  }

  let event: TossWebhookEvent;
  try {
    event = JSON.parse(raw) as TossWebhookEvent;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  // Toss sends event types like PAYMENT_STATUS_CHANGED.
  if (event.eventType === "PAYMENT_STATUS_CHANGED") {
    await handlePaymentStatusChanged(event.data);
  }

  return NextResponse.json({ ok: true });
}

async function handlePaymentStatusChanged(payment: TossPayment) {
  const customerKey = payment.customerKey;
  if (!customerKey) return;

  const status = mapTossStatusToInternal(payment.status);

  const admin = createAdminClient();
  const sub = await findSubscriptionByCustomerKey(admin, customerKey);
  if (!sub) return;

  const updates: Record<string, unknown> = { status };
  if (status === "ACTIVE" && payment.approvedAt) {
    // Renewal succeeded — bump current_period_end + schedule next charge in 30d.
    const periodEnd = new Date(
      new Date(payment.approvedAt).getTime() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    updates.current_period_end = periodEnd;
    updates.next_charge_at = periodEnd;
  }

  await updateSubscriptionByUserId(admin, sub.user_id, updates);

  // If subscription effectively canceled, hide excess services beyond Free slot (1).
  if (status === "CANCELED") {
    await downgradeToFree(admin, sub.user_id);
    await hideExcessServices(sub.user_id, 1);
  }
}

async function hideExcessServices(userId: string, keep: number) {
  const admin = createAdminClient();
  const services = await listActiveByOwnerNewestFirst(admin, userId);
  if (services.length <= keep) return;
  const toHide = services.slice(keep).map((s) => s.id);
  await setStatusByIds(admin, toHide, "HIDDEN");
}

type TossWebhookEvent = {
  eventType: string;
  createdAt?: string;
  data: TossPayment;
};

type TossPayment = {
  paymentKey?: string;
  orderId?: string;
  customerKey?: string;
  status?: string;
  approvedAt?: string;
  totalAmount?: number;
};
