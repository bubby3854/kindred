import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileSummary = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  contact_email: string | null;
  external_url: string | null;
};

export type ProfileUpdateInput = {
  displayName?: string;
  contactEmail?: string | null;
  externalUrl?: string | null;
};

const SELECT_COLUMNS =
  "id, username, display_name, avatar_url, contact_email, external_url";

export async function findById(
  supabase: SupabaseClient,
  id: string,
): Promise<ProfileSummary | null> {
  const { data } = await supabase
    .from("profiles")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as ProfileSummary | null) ?? null;
}

export async function updateDisplayName(
  supabase: SupabaseClient,
  id: string,
  displayName: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", id);
  return !error;
}

export async function updateProfile(
  supabase: SupabaseClient,
  id: string,
  patch: ProfileUpdateInput,
): Promise<boolean> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.displayName !== undefined) dbPatch.display_name = patch.displayName;
  if (patch.contactEmail !== undefined) dbPatch.contact_email = patch.contactEmail;
  if (patch.externalUrl !== undefined) dbPatch.external_url = patch.externalUrl;
  if (Object.keys(dbPatch).length === 0) return true;
  const { error } = await supabase.from("profiles").update(dbPatch).eq("id", id);
  return !error;
}
