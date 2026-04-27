import Link from "next/link";

export type SortKey = "latest" | "popular";

export function SortTabs({
  current,
  basePath,
  preserveQuery = {},
}: {
  current: SortKey;
  basePath: string;
  preserveQuery?: Record<string, string | undefined>;
}) {
  function buildHref(sort: SortKey): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(preserveQuery)) {
      if (v) params.set(k, v);
    }
    if (sort !== "latest") params.set("sort", sort);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const tabs: { key: SortKey; label: string }[] = [
    { key: "latest", label: "최신순" },
    { key: "popular", label: "인기순" },
  ];

  return (
    <div className="flex items-center gap-1 text-sm">
      {tabs.map((t) => {
        const active = t.key === current;
        return (
          <Link
            key={t.key}
            href={buildHref(t.key)}
            className={`rounded-full px-3 py-1 transition-colors ${
              active
                ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
                : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export function parseSortKey(v: string | undefined): SortKey {
  return v === "popular" ? "popular" : "latest";
}
