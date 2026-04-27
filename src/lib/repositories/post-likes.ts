import type { SupabaseClient } from "@supabase/supabase-js";

export async function countForPost(
  supabase: SupabaseClient,
  postId: string,
): Promise<number> {
  const { count } = await supabase
    .from("post_likes")
    .select("user_id", { count: "exact", head: true })
    .eq("post_id", postId);
  return count ?? 0;
}

export async function existsForUser(
  supabase: SupabaseClient,
  postId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("post_likes")
    .select("user_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function add(
  supabase: SupabaseClient,
  postId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: userId });
  return !error || error.code === "23505";
}

export async function remove(
  supabase: SupabaseClient,
  postId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);
  return !error;
}

export async function countsByPostIds(
  supabase: SupabaseClient,
  postIds: string[],
): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const { data } = await supabase
    .from("post_likes")
    .select("post_id")
    .in("post_id", postIds);
  const counts = new Map<string, number>();
  for (const id of postIds) counts.set(id, 0);
  for (const row of (data ?? []) as { post_id: string }[]) {
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
  }
  return counts;
}

export async function likedByUserFromSet(
  supabase: SupabaseClient,
  userId: string,
  postIds: string[],
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const { data } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);
  return new Set(((data ?? []) as { post_id: string }[]).map((r) => r.post_id));
}
