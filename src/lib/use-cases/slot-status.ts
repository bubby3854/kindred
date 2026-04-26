import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listByOwner,
  type OwnerService,
} from "@/lib/repositories/services";
import { findByUserId as findSubscriptionByUserId } from "@/lib/repositories/subscriptions";
import { slotsForPlan, type Plan } from "@/lib/plans";

export type SlotStatus = {
  plan: Plan;
  slots: number;
  activeCount: number;
  hasRoom: boolean;
};

export function computeSlotStatus(
  services: OwnerService[],
  plan: Plan,
): SlotStatus {
  const slots = slotsForPlan(plan);
  const activeCount = services.filter(
    (s) => s.status === "PUBLISHED" || s.status === "PENDING_VERIFY",
  ).length;
  return { plan, slots, activeCount, hasRoom: activeCount < slots };
}

export async function getSlotStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<SlotStatus> {
  const [services, subscription] = await Promise.all([
    listByOwner(supabase, userId),
    findSubscriptionByUserId(supabase, userId),
  ]);
  const plan = (subscription?.plan ?? "FREE") as Plan;
  return computeSlotStatus(services, plan);
}
