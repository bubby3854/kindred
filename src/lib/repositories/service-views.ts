import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordView(
  admin: SupabaseClient,
  serviceId: string,
  viewerId: string | null,
): Promise<void> {
  await admin
    .from("service_views")
    .insert({ service_id: serviceId, viewer_id: viewerId });
}

export async function countsByServiceIds(
  admin: SupabaseClient,
  serviceIds: string[],
): Promise<Map<string, number>> {
  if (serviceIds.length === 0) return new Map();
  const { data } = await admin
    .from("service_views")
    .select("service_id")
    .in("service_id", serviceIds);
  const counts = new Map<string, number>();
  for (const id of serviceIds) counts.set(id, 0);
  for (const row of (data ?? []) as { service_id: string }[]) {
    counts.set(row.service_id, (counts.get(row.service_id) ?? 0) + 1);
  }
  return counts;
}
