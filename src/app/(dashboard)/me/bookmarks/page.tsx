import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findById as findProfileById } from "@/lib/repositories/profiles";
import { listBookmarkedServiceIds } from "@/lib/repositories/bookmarks";
import type { PublishedServiceCard } from "@/lib/repositories/services";
import { loadCardLikeMeta } from "@/lib/use-cases/cards-enrichment";
import { ServiceCardLink } from "@/components/service-card-link";

export const metadata = { title: "북마크 · kindred" };
export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/me/bookmarks");

  const profile = await findProfileById(supabase, user.id);
  if (!profile?.display_name) redirect("/onboarding?next=/me/bookmarks");

  const bookmarkedIds = await listBookmarkedServiceIds(supabase, user.id, {
    limit: 100,
  });

  // Fetch services in bookmark order. We use listPublishedWithCategory
  // for shape, but need to filter to only the bookmarked ones — easier
  // to just fetch by ids directly.
  let items: PublishedServiceCard[] = [];
  if (bookmarkedIds.length > 0) {
    const { data } = await supabase
      .from("services")
      .select(
        "id, title, tagline, url, thumbnail_url, tags, categories(slug, name)",
      )
      .eq("status", "PUBLISHED")
      .in("id", bookmarkedIds);
    const byId = new Map<string, PublishedServiceCard>();
    for (const s of (data ?? []) as unknown as PublishedServiceCard[]) {
      byId.set(s.id, s);
    }
    // Preserve bookmark order (most recent first)
    items = bookmarkedIds.map((id) => byId.get(id)).filter(Boolean) as PublishedServiceCard[];
  }

  const likeMeta = await loadCardLikeMeta(supabase, items, user.id);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <Link
          href="/me"
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 내 페이지
        </Link>
        <h1 className="font-serif text-5xl leading-tight">북마크.</h1>
        <p className="text-[color:var(--muted)]">
          관심 있는 서비스를 모아두고 나중에 다시 찾아보세요.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--border)] px-8 py-16 text-center">
          <p className="font-serif text-2xl mb-2">아직 북마크가 없어요.</p>
          <p className="text-sm text-[color:var(--muted)]">
            서비스 상세 페이지의 ☆ 버튼을 누르면 여기에 모입니다.
          </p>
        </div>
      ) : (
        <ul className="grid gap-x-8 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <li key={s.id}>
              <ServiceCardLink
                service={s}
                showCategory
                likeCount={likeMeta.counts.get(s.id) ?? 0}
                likedByViewer={likeMeta.likedByViewer.has(s.id)}
                isLoggedIn
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
