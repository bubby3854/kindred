import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getOwnedById,
  listHiddenByOwnerNewestFirst,
  setStatusByIds,
} from "@/lib/repositories/services";
import { getSlotStatus } from "@/lib/use-cases/slot-status";
import type { Plan } from "@/lib/plans";

export type RestoreOutcome =
  | { ok: true }
  | { ok: false; status: "not_found" }
  | { ok: false; status: "wrong_status" }
  | { ok: false; status: "slot_full"; plan: Plan; slots: number };

export async function restoreSingleForOwner(
  supabase: SupabaseClient,
  params: { serviceId: string; userId: string },
): Promise<RestoreOutcome> {
  const service = await getOwnedById(
    supabase,
    params.serviceId,
    params.userId,
  );
  if (!service) return { ok: false, status: "not_found" };
  if (service.status !== "HIDDEN") return { ok: false, status: "wrong_status" };

  const slot = await getSlotStatus(supabase, params.userId);
  if (!slot.hasRoom) {
    return {
      ok: false,
      status: "slot_full",
      plan: slot.plan,
      slots: slot.slots,
    };
  }

  await setStatusByIds(supabase, [service.id], "PUBLISHED");
  return { ok: true };
}

// Called after a successful subscription upgrade. Brings HIDDEN services back to
// PUBLISHED, newest-first, up to whatever slot capacity remains. Original
// `published_at` is preserved so the public ordering is not artificially bumped.
export async function autoRestoreHiddenUpToLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ restored: number }> {
  const slot = await getSlotStatus(supabase, userId);
  const room = Math.max(0, slot.slots - slot.activeCount);
  if (room === 0) return { restored: 0 };

  const hidden = await listHiddenByOwnerNewestFirst(supabase, userId);
  if (hidden.length === 0) return { restored: 0 };

  const toRestore = hidden.slice(0, room).map((s) => s.id);
  await setStatusByIds(supabase, toRestore, "PUBLISHED");
  return { restored: toRestore.length };
}
