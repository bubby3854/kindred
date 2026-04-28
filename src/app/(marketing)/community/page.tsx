import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  listPosts,
  POST_CATEGORIES,
  type CommunityPostCategory,
} from "@/lib/repositories/community";
import { countsByPostIds, likedByUserFromSet } from "@/lib/repositories/post-likes";
import { SortTabs, parseSortKey } from "@/components/sort-tabs";

export const metadata = {
  title: "커뮤니티 · kindred",
  alternates: { canonical: "/community" },
};
export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<CommunityPostCategory, string> = Object.fromEntries(
  POST_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<CommunityPostCategory, string>;

function isCategory(v: string | undefined): v is CommunityPostCategory {
  return v === "LAUNCH" || v === "HELP" || v === "JOB" || v === "CHAT";
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string }>;
}) {
  const { sort: sortParam, category: categoryParam } = await searchParams;
  const sort = parseSortKey(sortParam);
  const category = isCategory(categoryParam) ? categoryParam : undefined;

  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    rawPosts,
  ] = await Promise.all([
    supabase.auth.getUser(),
    listPosts(supabase, { limit: 100, category }),
  ]);

  const ids = rawPosts.map((p) => p.id);
  const [likeCounts, likedSet] = await Promise.all([
    countsByPostIds(supabase, ids),
    user
      ? likedByUserFromSet(supabase, user.id, ids)
      : Promise.resolve(new Set<string>()),
  ]);

  const posts =
    sort === "popular"
      ? [...rawPosts].sort((a, b) => {
          // Pinned still wins.
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return (likeCounts.get(b.id) ?? 0) - (likeCounts.get(a.id) ?? 0);
        })
      : rawPosts;

  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 flex flex-col gap-10">
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
            커뮤니티
          </p>
          <h1 className="font-serif text-5xl leading-tight">메이커들의 글.</h1>
        </div>
        {user ? (
          <Link
            href="/community/new"
            className="cursor-pointer inline-flex items-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            새 글 쓰기
          </Link>
        ) : (
          <Link
            href="/login?next=/community/new"
            className="cursor-pointer inline-flex items-center rounded-full border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium hover:border-[color:var(--foreground)] transition-colors"
          >
            로그인하고 글쓰기
          </Link>
        )}
      </header>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <nav className="flex flex-wrap gap-2">
          <CategoryChip
            label="전체"
            active={!category}
            href={buildCommunityHref({ sort })}
          />
          {POST_CATEGORIES.map((c) => (
            <CategoryChip
              key={c.value}
              label={c.label}
              active={category === c.value}
              href={buildCommunityHref({ sort, category: c.value })}
            />
          ))}
        </nav>
        <SortTabs
          current={sort}
          basePath="/community"
          preserveQuery={{ category }}
        />
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--border)] px-8 py-16 text-center">
          <p className="font-serif text-2xl mb-2">아직 글이 없어요.</p>
          <p className="text-sm text-[color:var(--muted)]">
            첫 글을 남겨보시겠어요?
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-[color:var(--border)]">
          {posts.map((p) => (
            <li key={p.id} className="py-5">
              <Link
                href={`/community/${p.id}`}
                className="flex flex-col gap-2 group"
              >
                <h2 className="font-serif text-2xl group-hover:text-[color:var(--accent)] transition-colors flex items-baseline gap-2 flex-wrap">
                  {p.is_pinned && (
                    <span className="inline-flex items-center rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 px-2 py-0.5 text-[11px] text-[color:var(--accent)] font-medium tracking-wide">
                      📌 공지
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[11px] text-[color:var(--muted)] tracking-wide">
                    {CATEGORY_LABEL[p.category]}
                  </span>
                  {p.is_hidden ? (
                    <span className="italic text-[color:var(--muted)] text-base">
                      운영진에 의해 숨김 처리된 게시글입니다.
                    </span>
                  ) : (
                    <span>{p.title}</span>
                  )}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[color:var(--muted)]">
                  <span>{p.profiles?.display_name ?? "익명의 메이커"}</span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(p.created_at).toLocaleDateString("ko-KR")}</span>
                  <span aria-hidden="true">·</span>
                  <span aria-label="좋아요" className="font-mono">
                    ♥ {likeCounts.get(p.id) ?? 0}
                  </span>
                  {likedSet.has(p.id) && (
                    <span className="text-[color:var(--accent)]">좋아요함</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function buildCommunityHref({
  sort,
  category,
}: {
  sort: "latest" | "popular";
  category?: CommunityPostCategory;
}): string {
  const params = new URLSearchParams();
  if (sort !== "latest") params.set("sort", sort);
  if (category) params.set("category", category);
  const qs = params.toString();
  return qs ? `/community?${qs}` : "/community";
}

function CategoryChip({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-sm transition-colors ${
        active
          ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
          : "border border-[color:var(--border)] text-[color:var(--muted)] hover:border-[color:var(--foreground)] hover:text-[color:var(--foreground)]"
      }`}
    >
      {label}
    </Link>
  );
}
