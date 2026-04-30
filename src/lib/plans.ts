export const PLAN_SLOTS = {
  FREE: 3,
  PRO: 5,
  BUSINESS: 20,
} as const;

export type Plan = keyof typeof PLAN_SLOTS;

export function slotsForPlan(plan: Plan): number {
  return PLAN_SLOTS[plan];
}

// Display prices (KRW). Source-of-truth for billing is the variant
// configured in Lemon Squeezy — these are for UI only.
export const PLAN_PRICE_KRW: Record<Plan, number> = {
  FREE: 0,
  PRO: 9900,
  BUSINESS: 29000,
};
