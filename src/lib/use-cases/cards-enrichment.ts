import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublishedServiceCard } from "@/lib/repositories/services";
import {
  countsByServiceIds,
  likedByUserFromSet,
} from "@/lib/repositories/likes";

export type CardLikeMeta = {
  counts: Map<string, number>;
  likedByViewer: Set<string>;
};

export async function loadCardLikeMeta(
  supabase: SupabaseClient,
  cards: PublishedServiceCard[],
  viewerId: string | null,
): Promise<CardLikeMeta> {
  const ids = cards.map((c) => c.id);
  const [counts, likedSet] = await Promise.all([
    countsByServiceIds(supabase, ids),
    viewerId ? likedByUserFromSet(supabase, viewerId, ids) : Promise.resolve(new Set<string>()),
  ]);
  return { counts, likedByViewer: likedSet };
}
