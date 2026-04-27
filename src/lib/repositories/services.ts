import type { SupabaseClient } from "@supabase/supabase-js";

export type ServiceStatus =
  | "DRAFT"
  | "PENDING_VERIFY"
  | "PUBLISHED"
  | "HIDDEN"
  | "REJECTED";

export type PublishedServiceCard = {
  id: string;
  title: string;
  tagline: string | null;
  url: string;
  thumbnail_url: string | null;
  tags: string[];
  categories: { slug: string; name: string } | null;
};

export type OwnerService = {
  id: string;
  title: string;
  status: ServiceStatus;
  url: string;
  updated_at: string;
};

export type ServiceForVerification = {
  id: string;
  owner_id: string;
  url: string;
  verify_token: string;
  status: ServiceStatus;
};

export type OwnedServiceFull = {
  id: string;
  owner_id: string;
  category_id: number | null;
  title: string;
  tagline: string | null;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  tags: string[];
  status: ServiceStatus;
  verify_token: string;
  verified_at: string | null;
  last_verified_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicServiceDetail = {
  id: string;
  owner_id: string;
  title: string;
  tagline: string | null;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  tags: string[];
  status: ServiceStatus;
  published_at: string | null;
  categories: { slug: string; name: string } | null;
};

export type ServiceCreateInput = {
  ownerId: string;
  categoryId: number;
  title: string;
  tagline: string | null;
  description: string | null;
  url: string;
  tags?: string[];
};

export type ServiceUpdateInput = {
  categoryId?: number | null;
  title?: string;
  tagline?: string | null;
  description?: string | null;
  url?: string;
  tags?: string[];
};

const CARD_SELECT =
  "id, title, tagline, url, thumbnail_url, tags, categories(slug, name)";
const CARD_SELECT_CAT_INNER =
  "id, title, tagline, url, thumbnail_url, tags, categories!inner(slug, name)";

export async function listPublishedWithCategory(
  supabase: SupabaseClient,
  { limit }: { limit: number },
): Promise<PublishedServiceCard[]> {
  const { data } = await supabase
    .from("services")
    .select(CARD_SELECT)
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as PublishedServiceCard[];
}

export async function listPublishedByCategorySlug(
  supabase: SupabaseClient,
  slug: string,
  { limit }: { limit: number },
): Promise<PublishedServiceCard[]> {
  const { data } = await supabase
    .from("services")
    .select(CARD_SELECT_CAT_INNER)
    .eq("status", "PUBLISHED")
    .eq("categories.slug", slug)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as PublishedServiceCard[];
}

export async function listPublishedByOwner(
  supabase: SupabaseClient,
  ownerId: string,
  { limit, excludeId }: { limit: number; excludeId?: string } = { limit: 60 },
): Promise<PublishedServiceCard[]> {
  let q = supabase
    .from("services")
    .select(CARD_SELECT)
    .eq("status", "PUBLISHED")
    .eq("owner_id", ownerId)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q;
  return (data ?? []) as unknown as PublishedServiceCard[];
}

export async function listPublishedByTag(
  supabase: SupabaseClient,
  tag: string,
  { limit }: { limit: number },
): Promise<PublishedServiceCard[]> {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return [];
  const { data } = await supabase
    .from("services")
    .select(CARD_SELECT)
    .eq("status", "PUBLISHED")
    .contains("tags", [normalized])
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as PublishedServiceCard[];
}

export async function searchPublished(
  supabase: SupabaseClient,
  query: string,
  { limit }: { limit: number },
): Promise<PublishedServiceCard[]> {
  const term = query.trim();
  if (!term) return [];
  // Escape % and _ so user input doesn't act as wildcards.
  const escaped = term.replace(/[%_\\]/g, (m) => `\\${m}`);
  const pattern = `%${escaped}%`;
  const { data } = await supabase
    .from("services")
    .select(CARD_SELECT)
    .eq("status", "PUBLISHED")
    .or(
      `title.ilike.${pattern},tagline.ilike.${pattern},description.ilike.${pattern}`,
    )
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as PublishedServiceCard[];
}

export async function listByOwner(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<OwnerService[]> {
  const { data } = await supabase
    .from("services")
    .select("id, title, status, url, updated_at")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as OwnerService[];
}

export async function getOwnedById(
  supabase: SupabaseClient,
  id: string,
  ownerId: string,
): Promise<OwnedServiceFull | null> {
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, owner_id, category_id, title, tagline, description, url, thumbnail_url, tags, status, verify_token, verified_at, last_verified_at, published_at, created_at, updated_at",
    )
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error || !data) return null;
  return data as OwnedServiceFull;
}

export async function getPublicDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<PublicServiceDetail | null> {
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, owner_id, title, tagline, description, url, thumbnail_url, tags, status, published_at, categories(slug, name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as PublicServiceDetail;
}

export async function getForVerification(
  supabase: SupabaseClient,
  serviceId: string,
): Promise<ServiceForVerification | null> {
  const { data, error } = await supabase
    .from("services")
    .select("id, owner_id, url, verify_token, status")
    .eq("id", serviceId)
    .single();
  if (error || !data) return null;
  return data as ServiceForVerification;
}

export async function markVerifyAttempted(
  supabase: SupabaseClient,
  serviceId: string,
  attemptedAtIso: string,
): Promise<void> {
  await supabase
    .from("services")
    .update({ last_verified_at: attemptedAtIso })
    .eq("id", serviceId);
}

export async function markVerified(
  supabase: SupabaseClient,
  serviceId: string,
  params: {
    nowIso: string;
    nextStatus: ServiceStatus;
    publishedAtIso: string | null;
    thumbnailUrl?: string | null;
  },
): Promise<void> {
  const update: Record<string, unknown> = {
    verified_at: params.nowIso,
    last_verified_at: params.nowIso,
    status: params.nextStatus,
    published_at: params.publishedAtIso,
  };
  if (params.thumbnailUrl !== undefined) update.thumbnail_url = params.thumbnailUrl;
  await supabase.from("services").update(update).eq("id", serviceId);
}

export async function listActiveByOwnerNewestFirst(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<{ id: string }[]> {
  const { data } = await supabase
    .from("services")
    .select("id")
    .eq("owner_id", ownerId)
    .in("status", ["PUBLISHED", "PENDING_VERIFY"])
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function listHiddenByOwnerNewestFirst(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<{ id: string; updated_at: string }[]> {
  const { data } = await supabase
    .from("services")
    .select("id, updated_at")
    .eq("owner_id", ownerId)
    .eq("status", "HIDDEN")
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function setStatusByIds(
  supabase: SupabaseClient,
  ids: string[],
  status: ServiceStatus,
): Promise<void> {
  if (ids.length === 0) return;
  await supabase.from("services").update({ status }).in("id", ids);
}

export async function createOwned(
  supabase: SupabaseClient,
  input: ServiceCreateInput,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("services")
    .insert({
      owner_id: input.ownerId,
      category_id: input.categoryId,
      title: input.title,
      tagline: input.tagline,
      description: input.description,
      url: input.url,
      tags: input.tags ?? [],
      status: "DRAFT",
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return { id: data.id as string };
}

export async function updateOwned(
  supabase: SupabaseClient,
  id: string,
  ownerId: string,
  patch: ServiceUpdateInput,
): Promise<boolean> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.categoryId !== undefined) dbPatch.category_id = patch.categoryId;
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.tagline !== undefined) dbPatch.tagline = patch.tagline;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.url !== undefined) dbPatch.url = patch.url;
  if (patch.tags !== undefined) dbPatch.tags = patch.tags;
  if (Object.keys(dbPatch).length === 0) return true;
  const { error } = await supabase
    .from("services")
    .update(dbPatch)
    .eq("id", id)
    .eq("owner_id", ownerId);
  return !error;
}

export async function deleteOwned(
  supabase: SupabaseClient,
  id: string,
  ownerId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId);
  return !error;
}
