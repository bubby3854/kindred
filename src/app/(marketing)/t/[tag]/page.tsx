import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listPublishedByTag } from "@/lib/repositories/services";
import { loadCardLikeMeta } from "@/lib/use-cases/cards-enrichment";
import { ServiceCardLink } from "@/components/service-card-link";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag).toLowerCase();
  return {
    title: `#${decoded} · kindred`,
    description: `${decoded} 태그가 달린 서비스를 모아 봤어요.`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag).toLowerCase();
  if (!decoded) notFound();

  const supabase = await createClient();
  const [items, userResult] = await Promise.all([
    listPublishedByTag(supabase, decoded, { limit: 60 }),
    supabase.auth.getUser(),
  ]);
  const viewer = userResult.data.user;
  const likeMeta = await loadCardLikeMeta(supabase, items, viewer?.id ?? null);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 flex flex-col gap-12">
      <header className="flex flex-col gap-3 max-w-3xl">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 홈
        </Link>
        <h1 className="font-serif text-5xl sm:text-6xl leading-[1.05] tracking-tight">
          <span className="text-[color:var(--muted)]">#</span>
          {decoded}
        </h1>
        <p className="text-lg text-[color:var(--muted)] leading-relaxed">
          이 태그가 달린 서비스를 모아 봤어요.
        </p>
      </header>

      <section className="flex flex-col gap-6">
        <div className="flex items-baseline justify-between border-b border-[color:var(--border)] pb-4">
          <h2 className="font-serif text-2xl">서비스</h2>
          <span className="text-sm text-[color:var(--muted)]">
            {items.length > 0 ? `총 ${items.length}개` : "아직 없음"}
          </span>
        </div>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[color:var(--border)] px-8 py-16 text-center">
            <p className="font-serif text-2xl mb-2">아직 비어 있어요.</p>
            <p className="text-sm text-[color:var(--muted)]">
              이 태그를 사용한 첫 서비스가 되어보세요.
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
                  isLoggedIn={Boolean(viewer)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
