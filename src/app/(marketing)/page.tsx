import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listActive as listActiveCategories, type CategorySummary } from "@/lib/repositories/categories";
import {
  listPublishedWithCategory,
  type PublishedServiceCard,
} from "@/lib/repositories/services";
import { loadCardLikeMeta, type CardLikeMeta } from "@/lib/use-cases/cards-enrichment";
import { recentCountsByServiceIds } from "@/lib/repositories/likes";
import { ServiceCardLink } from "@/components/service-card-link";
import { SortTabs, parseSortKey } from "@/components/sort-tabs";
import { JsonLd } from "@/components/json-ld";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.kindred.kr";

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: sortParam } = await searchParams;
  const sort = parseSortKey(sortParam);

  const envReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  let items: PublishedServiceCard[] = [];
  let trendingItems: PublishedServiceCard[] = [];
  let categories: CategorySummary[] = [];
  let isLoggedIn = false;
  let likeMeta: CardLikeMeta = { counts: new Map(), likedByViewer: new Set() };

  if (envReady) {
    const supabase = await createClient();
    const [
      {
        data: { user },
      },
      itemsResult,
      categoriesResult,
    ] = await Promise.all([
      supabase.auth.getUser(),
      listPublishedWithCategory(supabase, { limit: 60 }),
      listActiveCategories(supabase),
    ]);
    items = itemsResult;
    categories = categoriesResult;
    isLoggedIn = Boolean(user);
    likeMeta = await loadCardLikeMeta(supabase, items, user?.id ?? null);

    // Trending: top 6 by likes in last 7 days, only services with at least 1 like.
    const sevenDaysAgo = new Date(
      // eslint-disable-next-line react-hooks/purity
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const recentCounts = await recentCountsByServiceIds(
      supabase,
      items.map((s) => s.id),
      sevenDaysAgo,
    );
    trendingItems = [...items]
      .filter((s) => (recentCounts.get(s.id) ?? 0) > 0)
      .sort(
        (a, b) =>
          (recentCounts.get(b.id) ?? 0) - (recentCounts.get(a.id) ?? 0),
      )
      .slice(0, 6);

    if (sort === "popular") {
      items = [...items].sort(
        (a, b) =>
          (likeMeta.counts.get(b.id) ?? 0) - (likeMeta.counts.get(a.id) ?? 0),
      );
    }
    items = items.slice(0, 24);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 flex flex-col gap-20">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "kindred",
          url: SITE_URL,
          description:
            "kindred는 직접 만든 웹앱이 머무를 자리를 만들어 드려요. 본인 소유가 인증된, 누구나 둘러볼 수 있는 한 페이지를요.",
          inLanguage: "ko-KR",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "kindred",
          url: SITE_URL,
          logo: `${SITE_URL}/opengraph-image`,
        }}
      />
      <section className="flex flex-col gap-6 max-w-4xl">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          메이커를 위한 · 한 명당 한 페이지
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
          내가 만든 웹앱,{" "}
          <span className="text-[color:var(--accent)]">제대로</span> 보여주기.
        </h1>
        <p className="text-lg sm:text-xl text-[color:var(--muted)] max-w-2xl leading-relaxed">
          kindred는 직접 만든 웹앱이 머무를 자리를 만들어 드려요. 본인 소유가
          인증된, 누구나 둘러볼 수 있는 한 페이지를요.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          {isLoggedIn ? (
            <Link
              href="/me"
              className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              내 페이지로
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              내 페이지 만들기
              <span aria-hidden="true">→</span>
            </Link>
          )}
          <a
            href="#latest"
            className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium hover:border-[color:var(--foreground)] transition-colors"
          >
            라이브 둘러보기
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      {!envReady && <SetupNotice />}

      {trendingItems.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between border-b border-[color:var(--border)] pb-4">
            <h2 className="font-serif text-3xl">
              지금 떠오르는{" "}
              <span className="text-[color:var(--accent)]">↑</span>
            </h2>
            <span className="text-sm text-[color:var(--muted)]">
              지난 7일 기준
            </span>
          </div>
          <ul className="grid gap-x-8 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {trendingItems.map((s) => (
              <li key={s.id}>
                <ServiceCardLink
                  service={s}
                  showCategory
                  likeCount={likeMeta.counts.get(s.id) ?? 0}
                  likedByViewer={likeMeta.likedByViewer.has(s.id)}
                  isLoggedIn={isLoggedIn}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {categories.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionEyebrow>카테고리로 둘러보기</SectionEyebrow>
          <nav className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/c/${c.slug}`}
                className="cursor-pointer rounded-full border border-[color:var(--border)] px-4 py-1.5 text-sm hover:border-[color:var(--foreground)] hover:bg-[color:var(--card)] transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </section>
      )}

      <section id="latest" className="flex flex-col gap-6 scroll-mt-20">
        <div className="flex items-baseline justify-between gap-3 flex-wrap border-b border-[color:var(--border)] pb-4">
          <h2 className="font-serif text-3xl">
            {sort === "popular" ? "인기 서비스" : "최근 등록"}
          </h2>
          <div className="flex items-center gap-4">
            <SortTabs current={sort} basePath="/" />
            <span className="text-sm text-[color:var(--muted)]">
              {items.length > 0 ? `총 ${items.length}개` : "아직 없음"}
            </span>
          </div>
        </div>
        {items.length === 0 ? (
          <EmptyState isLoggedIn={isLoggedIn} />
        ) : (
          <ul className="grid gap-x-8 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <li key={s.id}>
                <ServiceCardLink
                  service={s}
                  showCategory
                  likeCount={likeMeta.counts.get(s.id) ?? 0}
                  likedByViewer={likeMeta.likedByViewer.has(s.id)}
                  isLoggedIn={isLoggedIn}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
      {children}
    </p>
  );
}

function SetupNotice() {
  return (
    <div className="rounded-lg border-l-2 border-[color:var(--warning)] bg-[color:var(--card)] px-5 py-4 text-sm">
      <p className="font-medium mb-1 text-[color:var(--foreground)]">
        셋업이 필요합니다
      </p>
      <p className="text-[color:var(--muted)] leading-relaxed">
        <code className="font-mono text-[color:var(--foreground)]">.env.local.example</code>
        를{" "}
        <code className="font-mono text-[color:var(--foreground)]">.env.local</code>
        로 복사하고 Supabase / Toss 키를 입력한 뒤,{" "}
        <code className="font-mono text-[color:var(--foreground)]">
          supabase/migrations/0001_init.sql
        </code>
        을 Supabase에서 실행하세요.
      </p>
    </div>
  );
}

function EmptyState({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-[color:var(--border)] px-8 py-16 text-center">
      <p className="font-serif text-2xl mb-2">아직 비어 있어요.</p>
      <p className="text-sm text-[color:var(--muted)]">
        {isLoggedIn ? (
          <>
            첫 자리를 잡아보세요.{" "}
            <Link
              href="/me/services/new"
              className="underline underline-offset-4 text-[color:var(--accent)] hover:opacity-80"
            >
              내 웹앱 등록하기
            </Link>
          </>
        ) : (
          <>
            처음으로 자리를 잡아보세요.{" "}
            <Link
              href="/login"
              className="underline underline-offset-4 text-[color:var(--accent)] hover:opacity-80"
            >
              로그인
            </Link>
            하고 내 웹앱을 등록할 수 있어요.
          </>
        )}
      </p>
    </div>
  );
}
