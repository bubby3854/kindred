import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { searchPublished } from "@/lib/repositories/services";
import { loadCardLikeMeta } from "@/lib/use-cases/cards-enrichment";
import { ServiceCardLink } from "@/components/service-card-link";

export const metadata = { title: "검색 · kindred" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createClient();
  const [results, userResult] = await Promise.all([
    query ? searchPublished(supabase, query, { limit: 60 }) : Promise.resolve([]),
    supabase.auth.getUser(),
  ]);
  const viewer = userResult.data.user;
  const likeMeta = await loadCardLikeMeta(supabase, results, viewer?.id ?? null);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          검색
        </p>
        <form action="/search" method="get" className="flex gap-2">
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="키워드로 검색"
            autoFocus={!query}
            className="flex-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 outline-none focus:border-[color:var(--foreground)] transition-colors"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-md bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            찾기
          </button>
        </form>
      </header>

      {!query ? (
        <p className="text-[color:var(--muted)]">키워드를 입력해주세요.</p>
      ) : results.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--border)] px-8 py-16 text-center">
          <p className="font-serif text-2xl mb-2">결과가 없어요.</p>
          <p className="text-sm text-[color:var(--muted)]">
            다른 키워드로 시도해보세요. 또는{" "}
            <Link
              href="/"
              className="underline underline-offset-4 text-[color:var(--accent)] hover:opacity-80"
            >
              홈에서 둘러보기
            </Link>
            .
          </p>
        </div>
      ) : (
        <section className="flex flex-col gap-6">
          <p className="text-sm text-[color:var(--muted)]">
            <span className="text-[color:var(--foreground)] font-medium">
              {query}
            </span>{" "}
            · {results.length}개
          </p>
          <ul className="grid gap-x-8 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((s) => (
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
        </section>
      )}
    </div>
  );
}
