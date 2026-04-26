import Link from "next/link";
import type { PublishedServiceCard } from "@/lib/repositories/services";

export function ServiceCardLink({
  service: s,
  showCategory = false,
}: {
  service: PublishedServiceCard;
  showCategory?: boolean;
}) {
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
        {showCategory && (
          <div className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
            {s.categories?.name ?? "기타"}
          </div>
        )}
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
