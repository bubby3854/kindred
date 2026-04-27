import Link from "next/link";
import type { PublishedServiceCard } from "@/lib/repositories/services";
import { LikeButton } from "@/components/like-button";

export function ServiceCardLink({
  service: s,
  showCategory = false,
  likeCount,
  likedByViewer = false,
  isLoggedIn = false,
}: {
  service: PublishedServiceCard;
  showCategory?: boolean;
  likeCount?: number;
  likedByViewer?: boolean;
  isLoggedIn?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="aspect-[16/10] rounded-lg bg-[color:var(--card)] border border-[color:var(--border)] overflow-hidden">
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
        {showCategory && (
          <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
            {s.categories?.name ?? "기타"}
          </div>
        )}
        <div className="font-serif text-xl leading-snug">{s.title}</div>
        {s.tagline && (
          <p className="text-sm text-[color:var(--muted)] line-clamp-2 leading-relaxed">
            {s.tagline}
          </p>
        )}
        {s.tags && s.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {s.tags.slice(0, 4).map((t) => (
              <Link
                key={t}
                href={`/t/${encodeURIComponent(t)}`}
                className="inline-flex items-center rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[11px] text-[color:var(--muted)] font-mono hover:border-[color:var(--foreground)] hover:text-[color:var(--foreground)] transition-colors"
              >
                {t}
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="mt-auto flex items-center gap-2 pt-2">
        <a
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          바로가기
          <span aria-hidden="true">↗</span>
        </a>
        <Link
          href={`/s/${s.id}`}
          className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-[color:var(--border)] px-3 py-2 text-sm font-medium hover:border-[color:var(--foreground)] transition-colors"
        >
          소개
          <span aria-hidden="true">→</span>
        </Link>
        {likeCount !== undefined && (
          <LikeButton
            serviceId={s.id}
            initialCount={likeCount}
            initialLiked={likedByViewer}
            isLoggedIn={isLoggedIn}
            size="sm"
          />
        )}
      </div>
    </div>
  );
}
