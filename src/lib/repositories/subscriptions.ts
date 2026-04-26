import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "@/lib/plans";

export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELED" | "PAST_DUE";

export type UserSubscriptionSummary = {
  plan: Plan;
  status: SubscriptionStatus;
  current_period_end: string | null;
};

export type SubscriptionByCustomerKey = {
  user_id: string;
  plan: Plan;
};

export async function findByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSubscriptionSummary | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as UserSubscriptionSummary | null) ?? null;
}

export async function findByCustomerKey(
  supabase: SupabaseClient,
  customerKey: string,
): Promise<SubscriptionByCustomerKey | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("user_id, plan")
    .eq("toss_customer_key", customerKey)
    .maybeSingle();
  return (data as SubscriptionByCustomerKey | null) ?? null;
}

export async function upsertOnIssue(
  supabase: SupabaseClient,
  params: {
    userId: string;
    customerKey: string;
    billingKey: string;
    plan: Plan;
    periodEndIso: string;
  },
): Promise<void> {
  await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: params.userId,
        toss_customer_key: params.customerKey,
        toss_billing_key: params.billingKey,
        plan: params.plan,
        status: "ACTIVE",
        current_period_end: params.periodEndIso,
        next_charge_at: params.periodEndIso,
      },
      { onConflict: "user_id" },
    );
}

export async function updateByUserId(
  supabase: SupabaseClient,
  userId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await supabase.from("subscriptions").update(patch).eq("user_id", userId);
}

export async function downgradeToFree(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  await supabase
    .from("subscriptions")
    .update({ plan: "FREE", toss_billing_key: null, next_charge_at: null })
    .eq("user_id", userId);
}
