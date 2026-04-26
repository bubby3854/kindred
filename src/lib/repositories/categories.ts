import type { SupabaseClient } from "@supabase/supabase-js";

export type CategorySummary = { slug: string; name: string };

export type CategoryDetail = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
};

export async function listActive(
  supabase: SupabaseClient,
): Promise<CategorySummary[]> {
  const { data } = await supabase
    .from("categories")
    .select("slug, name")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function listActiveWithIds(
  supabase: SupabaseClient,
): Promise<{ id: number; slug: string; name: string }[]> {
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function findBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<CategoryDetail | null> {
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as CategoryDetail | null) ?? null;
}
