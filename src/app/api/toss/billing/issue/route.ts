import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  await admin
    .from("subscriptions")
    .upsert(
      {
        user_id: user.id,
        toss_customer_key: customerKey,
        toss_billing_key: issued.billingKey,
        plan,
        status: "ACTIVE",
        current_period_end: periodEnd.toISOString(),
        next_charge_at: periodEnd.toISOString(),
      },
      { onConflict: "user_id" },
    );

  return NextResponse.json({ ok: true });
}
