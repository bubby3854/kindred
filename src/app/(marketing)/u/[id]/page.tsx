import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findById as findProfileById } from "@/lib/repositories/profiles";
import { listPublishedByOwner } from "@/lib/repositories/services";
import { loadCardLikeMeta } from "@/lib/use-cases/cards-enrichment";
import { ServiceCardLink } from "@/components/service-card-link";
import { JsonLd } from "@/components/json-ld";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.kindred.kr";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await findProfileById(supabase, id);
  if (!profile?.display_name) return { title: "메이커 · kindred" };
  const description = `${profile.display_name}님의 작품을 kindred에서 만나보세요.`;
  return {
    title: `${profile.display_name} · kindred`,
    description,
    alternates: { canonical: `/u/${id}` },
    openGraph: {
      type: "profile",
      title: `${profile.display_name} · kindred`,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
    twitter: {
      card: "summary",
      title: `${profile.display_name} · kindred`,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function MakerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await findProfileById(supabase, id);
  if (!profile?.display_name) notFound();

  const [services, userResult] = await Promise.all([
    listPublishedByOwner(supabase, id, { limit: 60 }),
    supabase.auth.getUser(),
  ]);
  const viewer = userResult.data.user;
  const likeMeta = await loadCardLikeMeta(supabase, services, viewer?.id ?? null);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 flex flex-col gap-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: profile.display_name,
            url: `${SITE_URL}/u/${id}`,
            ...(profile.avatar_url ? { image: profile.avatar_url } : {}),
            ...(profile.external_url ? { sameAs: [profile.external_url] } : {}),
          },
        }}
      />
      <header className="flex flex-col gap-6">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 홈
        </Link>
        <div className="flex items-start gap-5 flex-wrap">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              width={72}
              height={72}
              className="h-18 w-18 rounded-full border border-[color:var(--border)] object-cover"
              style={{ width: 72, height: 72 }}
            />
          ) : (
            <span
              aria-hidden="true"
              className="h-18 w-18 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] flex items-center justify-center font-serif text-3xl"
              style={{ width: 72, height: 72 }}
            >
              {profile.display_name.charAt(0)}
            </span>
          )}
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="font-serif text-4xl sm:text-5xl leading-tight">
              {profile.display_name}
            </h1>
            <p className="text-[color:var(--muted)]">
              {services.length > 0
                ? `공개된 서비스 ${services.length}개`
                : "아직 공개된 서비스가 없어요"}
            </p>
          </div>
        </div>

        {(profile.contact_email || profile.external_url) && (
          <div className="flex flex-wrap gap-3 pt-2">
            {profile.contact_email && (
              <a
                href={`mailto:${profile.contact_email}`}
                className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm hover:border-[color:var(--foreground)] transition-colors font-mono"
              >
                ✉ {profile.contact_email}
              </a>
            )}
            {profile.external_url && (
              <a
                href={profile.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm hover:border-[color:var(--foreground)] transition-colors"
              >
                {prettyHost(profile.external_url)}
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        )}
      </header>

      <section className="flex flex-col gap-6">
        <h2 className="font-serif text-3xl border-b border-[color:var(--border)] pb-3">
          작품
        </h2>
        {services.length === 0 ? (
          <p className="text-[color:var(--muted)]">아직 보여드릴 작품이 없어요.</p>
        ) : (
          <ul className="grid gap-x-8 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
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

function prettyHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
