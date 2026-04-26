import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slotsForPlan, type Plan } from "@/lib/plans";

export const metadata = { title: "내 페이지 · kindred" };

type ServiceStatus =
  | "DRAFT"
  | "PENDING_VERIFY"
  | "PUBLISHED"
  | "HIDDEN"
  | "REJECTED";

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

  const [{ data: services }, { data: subscription }] = await Promise.all([
    supabase
      .from("services")
      .select("id, title, status, url, updated_at")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const plan = (subscription?.plan ?? "FREE") as Plan;
  const slots = slotsForPlan(plan);
  const activeCount = (services ?? []).filter(
    (s) => s.status === "PUBLISHED" || s.status === "PENDING_VERIFY",
  ).length;
  const usedRatio = Math.min(activeCount / slots, 1);

  return (
    <div className="mx-auto max-w-4xl px-6 pt-16 pb-24 flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
          내 페이지
        </p>
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
        {plan === "FREE" && (
          <div className="flex items-center justify-between text-sm pt-1 flex-wrap gap-2">
            <span className="text-[color:var(--muted)]">
              더 많이 등록하시려면 Pro({slotsForPlan("PRO")}개 슬롯)로
              업그레이드하세요.
            </span>
            <Link
              href="/me/subscription"
              className="cursor-pointer underline underline-offset-4 text-[color:var(--accent)] hover:opacity-80"
            >
              플랜 보기
            </Link>
          </div>
        )}
      </section>

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
            <Link
              href="/me/subscription"
              className="cursor-pointer inline-flex items-center rounded-full border border-[color:var(--foreground)] text-sm font-medium px-4 py-2 hover:bg-[color:var(--foreground)] hover:text-[color:var(--background)] transition-colors"
            >
              슬롯 추가하기
            </Link>
          )}
        </div>

        {(services ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed border-[color:var(--border)] px-8 py-12 text-center">
            <p className="font-serif text-xl mb-2">아직 등록한 서비스가 없어요.</p>
            <p className="text-sm text-[color:var(--muted)]">
              첫 번째 웹앱을 등록해보세요.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-[color:var(--border)]">
            {services!.map((s) => (
              <li
                key={s.id}
                className="py-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-serif text-lg truncate">{s.title}</div>
                  <div className="text-xs text-[color:var(--muted)] truncate font-mono">
                    {s.url}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <StatusBadge status={s.status as ServiceStatus} />
                  <Link
                    href={`/me/services/${s.id}`}
                    className="cursor-pointer text-sm underline underline-offset-4 hover:text-[color:var(--accent)] transition-colors"
                  >
                    수정
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
      dot: "bg-[color:var(--muted)]",
      text: "text-[color:var(--muted)]",
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
