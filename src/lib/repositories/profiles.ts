import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileSummary = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export async function findById(
  supabase: SupabaseClient,
  id: string,
): Promise<ProfileSummary | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", id)
    .maybeSingle();
  return (data as ProfileSummary | null) ?? null;
}
