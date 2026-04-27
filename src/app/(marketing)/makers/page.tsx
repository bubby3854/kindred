import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "메이커 · kindred",
  description: "kindred 에 가장 활발하게 작품을 올리는 메이커들.",
};
export const revalidate = 300;

type MakerRow = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  serviceCount: number;
  likeCount: number;
};

export default async function MakersPage() {
  const supabase = await createClient();
  const [servicesRes, likesRes] = await Promise.all([
    supabase
      .from("services")
      .select("id, owner_id")
      .eq("status", "PUBLISHED"),
    supabase.from("likes").select("service_id"),
  ]);

  const services = (servicesRes.data ?? []) as {
    id: string;
    owner_id: string;
  }[];
  const likes = (likesRes.data ?? []) as { service_id: string }[];

  const serviceToOwner = new Map<string, string>();
  for (const s of services) serviceToOwner.set(s.id, s.owner_id);
  const servicesPerOwner = new Map<string, number>();
  const likesPerOwner = new Map<string, number>();
  for (const s of services) {
    servicesPerOwner.set(
      s.owner_id,
      (servicesPerOwner.get(s.owner_id) ?? 0) + 1,
    );
  }
  for (const l of likes) {
    const ownerId = serviceToOwner.get(l.service_id);
    if (ownerId) {
      likesPerOwner.set(ownerId, (likesPerOwner.get(ownerId) ?? 0) + 1);
    }
  }

  const sortedOwnerIds = Array.from(servicesPerOwner.keys()).sort((a, b) => {
    const la = likesPerOwner.get(a) ?? 0;
    const lb = likesPerOwner.get(b) ?? 0;
    if (lb !== la) return lb - la;
    return (servicesPerOwner.get(b) ?? 0) - (servicesPerOwner.get(a) ?? 0);
  });
  const topIds = sortedOwnerIds.slice(0, 30);

  let makers: MakerRow[] = [];
  if (topIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", topIds)
      .not("display_name", "is", null);
    const byId = new Map<
      string,
      { id: string; display_name: string; avatar_url: string | null }
    >();
    for (const p of (profiles ?? []) as {
      id: string;
      display_name: string;
      avatar_url: string | null;
    }[]) {
      byId.set(p.id, p);
    }
    makers = topIds
      .map((id) => {
        const p = byId.get(id);
        if (!p) return null;
        return {
          id: p.id,
          displayName: p.display_name,
          avatarUrl: p.avatar_url,
          serviceCount: servicesPerOwner.get(id) ?? 0,
          likeCount: likesPerOwner.get(id) ?? 0,
        };
      })
      .filter(Boolean) as MakerRow[];
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pt-16 pb-24 flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          메이커
        </p>
        <h1 className="font-serif text-5xl leading-tight">
          이곳에서 만든 사람들.
        </h1>
        <p className="text-[color:var(--muted)]">
          공개된 작품과 받은 좋아요를 기준으로 정렬돼요.
        </p>
      </header>

      {makers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--border)] px-8 py-16 text-center">
          <p className="font-serif text-2xl mb-2">아직 메이커가 없어요.</p>
          <p className="text-sm text-[color:var(--muted)]">
            첫 메이커가 되어보세요.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-[color:var(--border)]">
          {makers.map((m, idx) => (
            <li key={m.id} className="py-4">
              <Link
                href={`/u/${m.id}`}
                className="flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-sm text-[color:var(--muted)] tabular-nums w-6 text-right">
                    {idx + 1}
                  </span>
                  {m.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.avatarUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full border border-[color:var(--border)] object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="h-10 w-10 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] flex items-center justify-center font-serif"
                    >
                      {m.displayName.charAt(0)}
                    </span>
                  )}
                  <span className="font-serif text-lg group-hover:text-[color:var(--accent)] transition-colors truncate">
                    {m.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[color:var(--muted)] font-mono shrink-0">
                  <span aria-label="공개 작품">📦 {m.serviceCount}</span>
                  <span aria-label="좋아요">♥ {m.likeCount}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
