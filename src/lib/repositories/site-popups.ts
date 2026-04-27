import type { SupabaseClient } from "@supabase/supabase-js";

export type SitePopup = {
  id: string;
  title: string;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function listActive(
  supabase: SupabaseClient,
): Promise<SitePopup[]> {
  const { data } = await supabase
    .from("site_popups")
    .select("id, title, body, is_active, created_at, updated_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as SitePopup[];
}

export async function listAll(
  admin: SupabaseClient,
): Promise<SitePopup[]> {
  const { data } = await admin
    .from("site_popups")
    .select("id, title, body, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });
  return (data ?? []) as SitePopup[];
}

export async function getById(
  admin: SupabaseClient,
  id: string,
): Promise<SitePopup | null> {
  const { data } = await admin
    .from("site_popups")
    .select("id, title, body, is_active, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  return (data as SitePopup | null) ?? null;
}

export async function createPopup(
  admin: SupabaseClient,
  input: { title: string; body: string; createdBy: string },
): Promise<{ id: string } | null> {
  const { data, error } = await admin
    .from("site_popups")
    .insert({
      title: input.title,
      body: input.body,
      created_by: input.createdBy,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return { id: data.id as string };
}

export async function updatePopup(
  admin: SupabaseClient,
  id: string,
  patch: { title?: string; body?: string; isActive?: boolean },
): Promise<boolean> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.body !== undefined) dbPatch.body = patch.body;
  if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;
  if (Object.keys(dbPatch).length === 0) return true;
  const { error } = await admin
    .from("site_popups")
    .update(dbPatch)
    .eq("id", id);
  return !error;
}

export async function deletePopup(
  admin: SupabaseClient,
  id: string,
): Promise<boolean> {
  const { error } = await admin.from("site_popups").delete().eq("id", id);
  return !error;
}
