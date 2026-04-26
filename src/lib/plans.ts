export const PLAN_SLOTS = {
  FREE: 1,
  PRO: 5,
  BUSINESS: 20,
} as const;

export type Plan = keyof typeof PLAN_SLOTS;

export function slotsForPlan(plan: Plan): number {
  return PLAN_SLOTS[plan];
}
