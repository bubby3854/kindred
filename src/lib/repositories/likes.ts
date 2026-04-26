import type { SupabaseClient } from "@supabase/supabase-js";

export async function countForService(
  supabase: SupabaseClient,
  serviceId: string,
): Promise<number> {
  const { count } = await supabase
    .from("likes")
    .select("user_id", { count: "exact", head: true })
    .eq("service_id", serviceId);
  return count ?? 0;
}

export async function existsForUser(
  supabase: SupabaseClient,
  serviceId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("likes")
    .select("user_id")
    .eq("service_id", serviceId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function add(
  supabase: SupabaseClient,
  serviceId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("likes")
    .insert({ service_id: serviceId, user_id: userId });
  // Ignore duplicate primary key (already liked).
  return !error || (error.code === "23505");
}

export async function remove(
  supabase: SupabaseClient,
  serviceId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("service_id", serviceId)
    .eq("user_id", userId);
  return !error;
}

export async function countsByServiceIds(
  supabase: SupabaseClient,
  serviceIds: string[],
): Promise<Map<string, number>> {
  if (serviceIds.length === 0) return new Map();
  const { data } = await supabase
    .from("likes")
    .select("service_id")
    .in("service_id", serviceIds);
  const counts = new Map<string, number>();
  for (const id of serviceIds) counts.set(id, 0);
  for (const row of (data ?? []) as { service_id: string }[]) {
    counts.set(row.service_id, (counts.get(row.service_id) ?? 0) + 1);
  }
  return counts;
}

export async function likedByUserFromSet(
  supabase: SupabaseClient,
  userId: string,
  serviceIds: string[],
): Promise<Set<string>> {
  if (serviceIds.length === 0) return new Set();
  const { data } = await supabase
    .from("likes")
    .select("service_id")
    .eq("user_id", userId)
    .in("service_id", serviceIds);
  return new Set(((data ?? []) as { service_id: string }[]).map((r) => r.service_id));
}
