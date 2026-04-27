import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://kindred.kr";

export const revalidate = 3600;

type Row = { id: string; updated_at?: string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [services, profiles, categories, tagRows] = await Promise.all([
    supabase
      .from("services")
      .select("id, updated_at")
      .eq("status", "PUBLISHED")
      .order("updated_at", { ascending: false })
      .limit(2000),
    supabase
      .from("profiles")
      .select("id, updated_at")
      .not("display_name", "is", null)
      .order("updated_at", { ascending: false })
      .limit(2000),
    supabase
      .from("categories")
      .select("slug")
      .eq("is_active", true),
    supabase
      .from("services")
      .select("tags")
      .eq("status", "PUBLISHED"),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/community`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const serviceEntries: MetadataRoute.Sitemap = ((services.data ?? []) as Row[]).map(
    (s) => ({
      url: `${SITE_URL}/s/${s.id}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  const profileEntries: MetadataRoute.Sitemap = ((profiles.data ?? []) as Row[]).map(
    (p) => ({
      url: `${SITE_URL}/u/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );

  const categoryEntries: MetadataRoute.Sitemap = (
    (categories.data ?? []) as { slug: string }[]
  ).map((c) => ({
    url: `${SITE_URL}/c/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const uniqueTags = new Set<string>();
  for (const row of (tagRows.data ?? []) as { tags: string[] | null }[]) {
    for (const t of row.tags ?? []) {
      if (t) uniqueTags.add(t);
    }
  }
  const tagEntries: MetadataRoute.Sitemap = Array.from(uniqueTags).map((t) => ({
    url: `${SITE_URL}/t/${encodeURIComponent(t)}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...serviceEntries,
    ...profileEntries,
    ...tagEntries,
  ];
}
