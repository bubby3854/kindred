import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  upsertFromLemonSqueezy,
  findBySubscriptionId,
  updateByUserId,
  downgradeToFree,
} from "@/lib/repositories/subscriptions";
import {
  listActiveByOwnerNewestFirst,
  setStatusByIds,
} from "@/lib/repositories/services";
import { autoRestoreHiddenUpToLimit } from "@/lib/use-cases/restore-service";
import {
  verifyWebhookSignature,
  mapStatus,
  planFromVariantId,
} from "@/lib/lemonsqueezy";
import type { Plan } from "@/lib/plans";

// Lemon Squeezy webhook handler. Configure webhook in LS dashboard pointing
// to <site>/api/lemonsqueezy/webhook with the LEMONSQUEEZY_WEBHOOK_SECRET.
// We rely on the `custom_data.user_id` we set when creating the checkout
// to map the LS subscription back to a kindred user.
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let event: LSWebhookEvent;
  try {
    event = JSON.parse(raw) as LSWebhookEvent;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const eventName = event.meta?.event_name;
  if (!eventName) {
    return NextResponse.json({ ok: true, skipped: "no_event_name" });
  }

  const admin = createAdminClient();

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed":
    case "subscription_unpaused":
      await handleSubscriptionUpsert(admin, event);
      break;
    case "subscription_cancelled":
    case "subscription_expired":
      await handleSubscriptionEnd(admin, event);
      break;
    case "subscription_paused":
      await handleSubscriptionPaused(admin, event);
      break;
    case "subscription_payment_success":
    case "subscription_payment_failed":
      // Status comes through in subscription_updated as well; payment events
      // are mostly informational. We could log here for analytics later.
      break;
    default:
      // Ignore unrelated events (one-time orders etc.)
      break;
  }

  return NextResponse.json({ ok: true });
}

async function handleSubscriptionUpsert(
  admin: ReturnType<typeof createAdminClient>,
  event: LSWebhookEvent,
) {
  const sub = event.data;
  const attrs = sub.attributes;
  if (!attrs) return;

  const userId = String(event.meta?.custom_data?.user_id ?? "");
  if (!userId) return;

  const plan = planFromVariantId(String(attrs.variant_id ?? ""));
  if (!plan) return;

  const status = mapStatus(String(attrs.status ?? ""));
  const currentPeriodEnd = attrs.renews_at ?? attrs.ends_at ?? null;

  await upsertFromLemonSqueezy(admin, {
    userId,
    lsSubscriptionId: String(sub.id),
    lsCustomerId: String(attrs.customer_id ?? ""),
    plan: plan as Plan,
    status,
    currentPeriodEndIso: currentPeriodEnd,
  });

  // On upgrade (or first activation), auto-restore previously hidden
  // services up to the new plan's slot capacity.
  if (status === "ACTIVE") {
    await autoRestoreHiddenUpToLimit(admin, userId);
  }
}

async function handleSubscriptionEnd(
  admin: ReturnType<typeof createAdminClient>,
  event: LSWebhookEvent,
) {
  const sub = event.data;
  if (!sub?.id) return;
  const found = await findBySubscriptionId(admin, String(sub.id));
  if (!found) return;

  await downgradeToFree(admin, found.user_id);
  // Hide excess services beyond Free slot (1, newest first kept).
  const services = await listActiveByOwnerNewestFirst(admin, found.user_id);
  if (services.length > 1) {
    await setStatusByIds(
      admin,
      services.slice(1).map((s) => s.id),
      "HIDDEN",
    );
  }
}

async function handleSubscriptionPaused(
  admin: ReturnType<typeof createAdminClient>,
  event: LSWebhookEvent,
) {
  const sub = event.data;
  if (!sub?.id) return;
  const found = await findBySubscriptionId(admin, String(sub.id));
  if (!found) return;
  await updateByUserId(admin, found.user_id, { status: "PAUSED" });
}

type LSWebhookEvent = {
  meta?: {
    event_name?: string;
    custom_data?: { user_id?: string } | null;
  };
  data: {
    id?: string | number;
    type?: string;
    attributes?: {
      variant_id?: string | number;
      customer_id?: string | number;
      status?: string;
      renews_at?: string | null;
      ends_at?: string | null;
    };
  };
};
