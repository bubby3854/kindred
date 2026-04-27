import type { SupabaseClient } from "@supabase/supabase-js";

export async function add(
  supabase: SupabaseClient,
  serviceId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("bookmarks")
    .insert({ service_id: serviceId, user_id: userId });
  return !error || error.code === "23505";
}

export async function remove(
  supabase: SupabaseClient,
  serviceId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("service_id", serviceId)
    .eq("user_id", userId);
  return !error;
}

export async function existsForUser(
  supabase: SupabaseClient,
  serviceId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("bookmarks")
    .select("user_id")
    .eq("service_id", serviceId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function bookmarkedSetByUser(
  supabase: SupabaseClient,
  userId: string,
  serviceIds: string[],
): Promise<Set<string>> {
  if (serviceIds.length === 0) return new Set();
  const { data } = await supabase
    .from("bookmarks")
    .select("service_id")
    .eq("user_id", userId)
    .in("service_id", serviceIds);
  return new Set(((data ?? []) as { service_id: string }[]).map((r) => r.service_id));
}

export async function listBookmarkedServiceIds(
  supabase: SupabaseClient,
  userId: string,
  { limit }: { limit: number },
): Promise<string[]> {
  const { data } = await supabase
    .from("bookmarks")
    .select("service_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as { service_id: string }[]).map((r) => r.service_id);
}
