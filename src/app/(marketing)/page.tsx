import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

type ServiceCard = {
  id: string;
  title: string;
  tagline: string | null;
  url: string;
  thumbnail_url: string | null;
  categories: { slug: string; name: string } | null;
};

export default async function HomePage() {
  const envReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  let items: ServiceCard[] = [];
  let categories: { slug: string; name: string }[] = [];

  if (envReady) {
    const supabase = await createClient();
    const [servicesRes, categoriesRes] = await Promise.all([
      supabase
        .from("services")
        .select("id, title, tagline, url, thumbnail_url, categories(slug, name)")
        .eq("status", "PUBLISHED")
        .order("published_at", { ascending: false })
        .limit(24),
      supabase
        .from("categories")
        .select("slug, name")
        .eq("is_active", true)
        .order("sort_order"),
    ]);
    items = (servicesRes.data ?? []) as unknown as ServiceCard[];
    categories = categoriesRes.data ?? [];
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 flex flex-col gap-20">
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
          <Link
            href="/login"
            className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            내 페이지 만들기
            <span aria-hidden="true">→</span>
          </Link>
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
        <div className="flex items-baseline justify-between border-b border-[color:var(--border)] pb-4">
          <h2 className="font-serif text-3xl">최근 등록</h2>
          <span className="text-sm text-[color:var(--muted)]">
            {items.length > 0 ? `총 ${items.length}개` : "아직 없음"}
          </span>
        </div>
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-x-8 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <li key={s.id}>
                <ServiceCardLink service={s} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ServiceCardLink({ service: s }: { service: ServiceCard }) {
  return (
    <Link
      href={`/s/${s.id}`}
      className="group cursor-pointer flex flex-col gap-3 h-full"
    >
      <div className="aspect-[16/10] rounded-lg bg-[color:var(--card)] border border-[color:var(--border)] overflow-hidden group-hover:border-[color:var(--foreground)] transition-colors">
        {s.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.thumbnail_url}
            alt={`${s.title} 썸네일`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-serif text-5xl text-[color:var(--muted)] italic">
              {s.title.charAt(0).toLowerCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
          {s.categories?.name ?? "기타"}
        </div>
        <div className="font-serif text-xl leading-snug group-hover:text-[color:var(--accent)] transition-colors">
          {s.title}
        </div>
        {s.tagline && (
          <p className="text-sm text-[color:var(--muted)] line-clamp-2 leading-relaxed">
            {s.tagline}
          </p>
        )}
      </div>
    </Link>
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

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[color:var(--border)] px-8 py-16 text-center">
      <p className="font-serif text-2xl mb-2">아직 비어 있어요.</p>
      <p className="text-sm text-[color:var(--muted)]">
        처음으로 자리를 잡아보세요.{" "}
        <Link
          href="/login"
          className="underline underline-offset-4 text-[color:var(--accent)] hover:opacity-80"
        >
          로그인
        </Link>
        하고 내 웹앱을 등록할 수 있어요.
      </p>
    </div>
  );
}
