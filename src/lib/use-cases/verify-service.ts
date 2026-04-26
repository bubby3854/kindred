import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getForVerification,
  markVerified,
  markVerifyAttempted,
  type ServiceStatus,
} from "@/lib/repositories/services";
import { verifyOwnership, type VerifyResult } from "@/lib/verify";
import { getSlotStatus } from "@/lib/use-cases/slot-status";
import type { Plan } from "@/lib/plans";

export type VerifyServiceOutcome =
  | { ok: true }
  | { ok: false; status: "not_found" }
  | { ok: false; status: "forbidden" }
  | { ok: false; status: "slot_full"; plan: Plan; slots: number }
  | { ok: false; status: "failed"; reason: VerifyResult & { ok: false } };

export async function verifyServiceForOwner(
  supabase: SupabaseClient,
  params: { serviceId: string; userId: string },
): Promise<VerifyServiceOutcome> {
  const service = await getForVerification(supabase, params.serviceId);
  if (!service) return { ok: false, status: "not_found" };
  if (service.owner_id !== params.userId)
    return { ok: false, status: "forbidden" };

  // Verifying a DRAFT will publish it → enforce slot limit before doing the
  // (slow) external HTTP fetch. PENDING_VERIFY/PUBLISHED already count, so
  // re-verifying them does not change the active count.
  if (service.status === "DRAFT") {
    const slot = await getSlotStatus(supabase, params.userId);
    if (!slot.hasRoom) {
      return {
        ok: false,
        status: "slot_full",
        plan: slot.plan,
        slots: slot.slots,
      };
    }
  }

  const result = await verifyOwnership(service.url, service.verify_token);
  const now = new Date().toISOString();

  if (!result.ok) {
    await markVerifyAttempted(supabase, service.id, now);
    return { ok: false, status: "failed", reason: result };
  }

  const nextStatus: ServiceStatus =
    service.status === "DRAFT" || service.status === "PENDING_VERIFY"
      ? "PUBLISHED"
      : service.status;

  await markVerified(supabase, service.id, {
    nowIso: now,
    nextStatus,
    publishedAtIso: nextStatus === "PUBLISHED" ? now : null,
    thumbnailUrl: result.thumbnailUrl,
  });

  return { ok: true };
}
