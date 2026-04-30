import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { type Plan } from "@/lib/plans";
import { listByOwner, type ServiceStatus } from "@/lib/repositories/services";
import { findByUserId as findSubscriptionByUserId } from "@/lib/repositories/subscriptions";
import { findById as findProfileById } from "@/lib/repositories/profiles";
import { countsByServiceIds as likeCountsByServiceIds } from "@/lib/repositories/likes";
import { countsByServiceIds as viewCountsByServiceIds } from "@/lib/repositories/service-views";
import { computeSlotStatus } from "@/lib/use-cases/slot-status";

export const metadata = { title: "내 페이지 · kindred" };

const PLAN_LABEL: Record<Plan, string> = {
  FREE: "Free",
  PRO: "Pro",
  BUSINESS: "Business",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await findProfileById(supabase, user.id);
  if (!profile?.display_name) redirect("/onboarding?next=/me");

  const [services, subscription] = await Promise.all([
    listByOwner(supabase, user.id),
    findSubscriptionByUserId(supabase, user.id),
  ]);

  const serviceIds = services.map((s) => s.id);
  const admin = createAdminClient();
  const [likeCounts, viewCounts] = await Promise.all([
    likeCountsByServiceIds(supabase, serviceIds),
    viewCountsByServiceIds(admin, serviceIds),
  ]);

  const plan = (subscription?.plan ?? "FREE") as Plan;
  const { slots, activeCount } = computeSlotStatus(services, plan);
  const usedRatio = Math.min(activeCount / slots, 1);
  const hiddenCount = services.filter((s) => s.status === "HIDDEN").length;

  return (
    <div className="mx-auto max-w-4xl px-6 pt-16 pb-24 flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
            내 페이지
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/me/bookmarks"
              className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors underline underline-offset-4"
            >
              북마크
            </Link>
            <Link
              href="/me/posts"
              className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors underline underline-offset-4"
            >
              내 글
            </Link>
            <Link
              href="/me/profile"
              className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors underline underline-offset-4"
            >
              프로필 편집
            </Link>
          </div>
        </div>
        <h1 className="font-serif text-5xl leading-tight">내 서비스.</h1>
      </header>

      <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              현재 플랜
            </span>
            <span className="font-serif text-2xl">{PLAN_LABEL[plan]}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              사용 중인 슬롯
            </span>
            <span className="font-serif text-2xl">
              {activeCount}{" "}
              <span className="text-[color:var(--muted)]">/ {slots}</span>
            </span>
          </div>
        </div>
        <div
          role="progressbar"
          aria-valuenow={activeCount}
          aria-valuemin={0}
          aria-valuemax={slots}
          aria-label={`${slots}개 중 ${activeCount}개 사용 중`}
          className="h-1.5 w-full rounded-full bg-[color:var(--border)] overflow-hidden"
        >
          <div
            className="h-full bg-[color:var(--accent)] transition-[width] duration-500"
            style={{ width: `${usedRatio * 100}%` }}
          />
        </div>
      </section>

      {hiddenCount > 0 && (
        <div className="rounded-lg border-l-2 border-[color:var(--warning)] bg-[color:var(--card)] px-5 py-4 text-sm">
          <p className="font-medium mb-1 text-[color:var(--foreground)]">
            숨겨진 서비스 {hiddenCount}개
          </p>
          <p className="text-[color:var(--muted)] leading-relaxed">
            슬롯 초과로 비공개 상태예요. 다른 서비스를 정리하거나 슬롯에 여유가
            생기면 개별 편집에서 다시 공개할 수 있어요.
          </p>
        </div>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between border-b border-[color:var(--border)] pb-4">
          <h2 className="font-serif text-3xl">등록된 서비스</h2>
          {activeCount < slots ? (
            <Link
              href="/me/services/new"
              className="cursor-pointer inline-flex items-center rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
            >
              서비스 추가
            </Link>
          ) : (
            <span className="text-sm text-[color:var(--muted)]">
              슬롯 모두 사용 중
            </span>
          )}
        </div>

        {services.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[color:var(--border)] px-8 py-12 text-center">
            <p className="font-serif text-xl mb-2">아직 등록한 서비스가 없어요.</p>
            <p className="text-sm text-[color:var(--muted)]">
              첫 번째 웹앱을 등록해보세요.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-[color:var(--border)]">
            {services.map((s) => (
              <li
                key={s.id}
                className="py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-lg truncate">{s.title}</div>
                  <div className="text-xs text-[color:var(--muted)] truncate font-mono">
                    {s.url}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[color:var(--muted)] mt-1.5 font-mono">
                    <span aria-label="조회수">
                      👁 {viewCounts.get(s.id) ?? 0}
                    </span>
                    <span aria-label="좋아요">
                      ♥ {likeCounts.get(s.id) ?? 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <StatusBadge status={s.status} />
                  <Link
                    href={`/me/services/${s.id}`}
                    className="cursor-pointer text-sm underline underline-offset-4 hover:text-[color:var(--accent)] transition-colors"
                  >
                    편집
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const config: Record<
    ServiceStatus,
    { label: string; dot: string; text: string }
  > = {
    DRAFT: {
      label: "임시저장",
      dot: "bg-[color:var(--muted)]",
      text: "text-[color:var(--muted)]",
    },
    PENDING_VERIFY: {
      label: "검증 대기",
      dot: "bg-[color:var(--warning)]",
      text: "text-[color:var(--warning)]",
    },
    PUBLISHED: {
      label: "공개",
      dot: "bg-[color:var(--success)]",
      text: "text-[color:var(--success)]",
    },
    HIDDEN: {
      label: "숨김",
      dot: "bg-[color:var(--warning)]",
      text: "text-[color:var(--warning)]",
    },
    REJECTED: {
      label: "반려",
      dot: "bg-[color:var(--accent)]",
      text: "text-[color:var(--accent)]",
    },
  };
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs tracking-wide ${c.text}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${c.dot}`}
        aria-hidden="true"
      />
      {c.label}
    </span>
  );
}
