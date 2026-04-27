import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "@/lib/plans";

export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELED" | "PAST_DUE";

export type UserSubscriptionSummary = {
  plan: Plan;
  status: SubscriptionStatus;
  current_period_end: string | null;
  ls_customer_id: string | null;
  ls_subscription_id: string | null;
};

export type SubscriptionBySubId = {
  user_id: string;
  plan: Plan;
};

export async function findByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserSubscriptionSummary | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, ls_customer_id, ls_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as UserSubscriptionSummary | null) ?? null;
}

export async function findBySubscriptionId(
  supabase: SupabaseClient,
  lsSubscriptionId: string,
): Promise<SubscriptionBySubId | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("user_id, plan")
    .eq("ls_subscription_id", lsSubscriptionId)
    .maybeSingle();
  return (data as SubscriptionBySubId | null) ?? null;
}

export async function upsertFromLemonSqueezy(
  supabase: SupabaseClient,
  params: {
    userId: string;
    lsSubscriptionId: string;
    lsCustomerId: string;
    plan: Plan;
    status: SubscriptionStatus;
    currentPeriodEndIso: string | null;
  },
): Promise<void> {
  await supabase.from("subscriptions").upsert(
    {
      user_id: params.userId,
      ls_subscription_id: params.lsSubscriptionId,
      ls_customer_id: params.lsCustomerId,
      plan: params.plan,
      status: params.status,
      current_period_end: params.currentPeriodEndIso,
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
    .update({
      plan: "FREE",
      status: "CANCELED",
      ls_subscription_id: null,
    })
    .eq("user_id", userId);
}
