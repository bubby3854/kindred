import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getPublicDetail,
  listPublishedByOwner,
} from "@/lib/repositories/services";
import { findById as findProfileById } from "@/lib/repositories/profiles";
import {
  countForService as countLikesForService,
  existsForUser as userLikedService,
} from "@/lib/repositories/likes";
import { LikeButton } from "@/components/like-button";
import { ServiceCardLink } from "@/components/service-card-link";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const service = await getPublicDetail(supabase, id);
  if (!service) return { title: "찾을 수 없음 · kindred" };
  return {
    title: `${service.title} · kindred`,
    description: service.tagline ?? service.description ?? undefined,
  };
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "임시저장",
  PENDING_VERIFY: "검증 대기",
  HIDDEN: "숨김",
  REJECTED: "반려",
};

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [service, userResult] = await Promise.all([
    getPublicDetail(supabase, id),
    supabase.auth.getUser(),
  ]);
  if (!service) notFound();

  const viewer = userResult.data.user;
  const isOwner = Boolean(viewer && viewer.id === service.owner_id);
  if (service.status !== "PUBLISHED" && !isOwner) notFound();

  const [owner, likeCount, viewerLiked, sameMakerWorks] = await Promise.all([
    findProfileById(supabase, service.owner_id),
    countLikesForService(supabase, service.id),
    viewer
      ? userLikedService(supabase, service.id, viewer.id)
      : Promise.resolve(false),
    listPublishedByOwner(supabase, service.owner_id, {
      limit: 4,
      excludeId: service.id,
    }),
  ]);

  const ownerName =
    owner?.display_name ?? owner?.username ?? "익명의 메이커";
  const publishedDate = service.published_at
    ? new Date(service.published_at).toLocaleDateString("ko-KR")
    : null;

  return (
    <article className="mx-auto max-w-4xl px-6 pt-16 pb-24 flex flex-col gap-12">
      {isOwner && service.status !== "PUBLISHED" && (
        <div className="rounded-lg border-l-2 border-[color:var(--warning)] bg-[color:var(--card)] px-5 py-4 text-sm flex items-baseline justify-between gap-3 flex-wrap">
          <p className="text-[color:var(--muted)] leading-relaxed">
            <span className="font-medium text-[color:var(--foreground)]">
              비공개 미리보기
            </span>{" "}
            · 현재 상태{" "}
            <span className="font-medium text-[color:var(--foreground)]">
              {STATUS_LABEL[service.status] ?? service.status}
            </span>
            . 본인에게만 보여요.
          </p>
          <Link
            href={`/me/services/${service.id}`}
            className="underline underline-offset-4 text-[color:var(--accent)] hover:opacity-80"
          >
            편집으로
          </Link>
        </div>
      )}
      <header className="flex flex-col gap-5">
        <Link
          href={service.categories ? `/c/${service.categories.slug}` : "/"}
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          {service.categories?.name ?? "기타"} ↗
        </Link>
        <h1 className="font-serif text-5xl sm:text-6xl leading-[1.05] tracking-tight">
          {service.title}
        </h1>
        {service.tagline && (
          <p className="text-xl text-[color:var(--muted)] max-w-2xl leading-relaxed">
            {service.tagline}
          </p>
        )}
        <div className="flex items-center gap-4 flex-wrap pt-2">
          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            바로 가기
            <span aria-hidden="true">↗</span>
          </a>
          <LikeButton
            serviceId={service.id}
            initialCount={likeCount}
            initialLiked={viewerLiked}
            isLoggedIn={Boolean(viewer)}
          />
          <span className="text-sm text-[color:var(--muted)] font-mono">
            {prettyHost(service.url)}
          </span>
        </div>
        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {service.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)] font-mono"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="aspect-[16/10] rounded-xl bg-[color:var(--card)] border border-[color:var(--border)] overflow-hidden">
        {service.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.thumbnail_url}
            alt={`${service.title} 썸네일`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-serif text-8xl text-[color:var(--muted)] italic">
              {service.title.charAt(0).toLowerCase()}
            </span>
          </div>
        )}
      </div>

      {service.description && (
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl border-b border-[color:var(--border)] pb-3">
            소개
          </h2>
          <p className="leading-relaxed whitespace-pre-wrap text-[color:var(--foreground)]">
            {service.description}
          </p>
        </section>
      )}

      {(owner?.contact_email || owner?.external_url) && (
        <section className="flex flex-col gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
          <h2 className="font-serif text-xl">메이커에게 연락하기</h2>
          <div className="flex flex-wrap gap-3">
            {owner.contact_email && (
              <a
                href={`mailto:${owner.contact_email}`}
                className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm hover:border-[color:var(--foreground)] transition-colors font-mono"
              >
                ✉ {owner.contact_email}
              </a>
            )}
            {owner.external_url && (
              <a
                href={owner.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm hover:border-[color:var(--foreground)] transition-colors"
              >
                {prettyHost(owner.external_url)}
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </section>
      )}

      {sameMakerWorks.length > 0 && (
        <section className="flex flex-col gap-5">
          <h2 className="font-serif text-2xl border-b border-[color:var(--border)] pb-3">
            {ownerName}님의 다른 작품
          </h2>
          <ul className="grid gap-x-6 gap-y-8 grid-cols-1 sm:grid-cols-2">
            {sameMakerWorks.slice(0, 4).map((s) => (
              <li key={s.id}>
                <ServiceCardLink service={s} showCategory />
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="flex items-center justify-between gap-3 flex-wrap pt-6 border-t border-[color:var(--border)] text-sm text-[color:var(--muted)]">
        <div className="flex items-center gap-3">
          {owner?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={owner.avatar_url}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-full border border-[color:var(--border)] object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="h-7 w-7 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] flex items-center justify-center text-xs"
            >
              {ownerName.charAt(0)}
            </span>
          )}
          <span>
            <Link
              href={`/u/${service.owner_id}`}
              className="text-[color:var(--foreground)] hover:text-[color:var(--accent)] transition-colors underline underline-offset-4"
            >
              {ownerName}
            </Link>
            님의 작업
          </span>
        </div>
        {publishedDate && <span>등록 · {publishedDate}</span>}
      </footer>
    </article>
  );
}

function prettyHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
