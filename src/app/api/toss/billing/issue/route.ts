import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertOnIssue as upsertSubscriptionOnIssue } from "@/lib/repositories/subscriptions";
import { autoRestoreHiddenUpToLimit } from "@/lib/use-cases/restore-service";
import {
  PLAN_AMOUNT_KRW,
  chargeBillingKey,
  issueBillingKey,
} from "@/lib/toss";

// Called from the client after Toss redirects back with `authKey` and
// `customerKey` query params. We:
//   1. exchange authKey → billingKey
//   2. store the billingKey in `subscriptions`
//   3. immediately charge the first month
const BodySchema = z.object({
  authKey: z.string().min(1),
  customerKey: z.string().min(1),
  plan: z.enum(["PRO", "BUSINESS"]),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { authKey, customerKey, plan } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // The customerKey we issued at checkout time is bound to this user.
  // It should equal the user's id (or a derived value); verify it.
  if (customerKey !== user.id) {
    return NextResponse.json({ error: "customer_key_mismatch" }, { status: 400 });
  }

  let issued;
  try {
    issued = await issueBillingKey({ authKey, customerKey });
  } catch (err) {
    return NextResponse.json(
      { error: "issue_failed", detail: (err as Error).message },
      { status: 502 },
    );
  }

  const amount = PLAN_AMOUNT_KRW[plan];
  const orderId = `kindred-${plan.toLowerCase()}-${user.id}-${Date.now()}`;
  const charge = await chargeBillingKey({
    billingKey: issued.billingKey,
    customerKey,
    orderId,
    orderName: `kindred ${plan} 월 구독`,
    amount,
  });

  if (!charge.ok) {
    return NextResponse.json(
      { error: "charge_failed", detail: charge.body },
      { status: 502 },
    );
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const admin = createAdminClient();
  await upsertSubscriptionOnIssue(admin, {
    userId: user.id,
    customerKey,
    billingKey: issued.billingKey,
    plan,
    periodEndIso: periodEnd.toISOString(),
  });

  // After upgrading, bring back any services that were hidden during a prior
  // downgrade — fill the new slot capacity newest-first.
  const restored = await autoRestoreHiddenUpToLimit(admin, user.id);

  return NextResponse.json({ ok: true, restored: restored.restored });
}
