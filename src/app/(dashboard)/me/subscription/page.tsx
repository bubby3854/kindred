import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findByUserId as findSubscriptionByUserId } from "@/lib/repositories/subscriptions";
import { PLAN_SLOTS, PLAN_PRICE_KRW, slotsForPlan, type Plan } from "@/lib/plans";
import { CheckoutButton } from "./checkout-button";
import { PortalButton } from "./portal-button";

export const metadata = { title: "구독 · kindred" };
export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<Plan, string> = {
  FREE: "Free",
  PRO: "Pro",
  BUSINESS: "Business",
};

const PLAN_TAGLINE: Record<Plan, string> = {
  FREE: "한 명의 메이커, 한 개의 작품으로 시작하세요.",
  PRO: "여러 작품을 정리하고 보여주는 메이커를 위해.",
  BUSINESS: "다수의 서비스를 운영하는 팀 / 스튜디오를 위해.",
};

const PLAN_PERKS: Record<Plan, string[]> = {
  FREE: ["서비스 1개", "소유권 인증", "공개 페이지"],
  PRO: ["서비스 5개", "Free의 모든 기능"],
  BUSINESS: ["서비스 20개", "Pro의 모든 기능"],
};

const ORDER: Plan[] = ["FREE", "PRO", "BUSINESS"];

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ ls?: string }>;
}) {
  const { ls } = await searchParams;
  const justSubscribed = ls === "success";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const subscription = await findSubscriptionByUserId(supabase, user.id);
  const currentPlan: Plan = (subscription?.plan ?? "FREE") as Plan;
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  const checkoutReady = Boolean(
    process.env.LEMONSQUEEZY_API_KEY &&
      process.env.LEMONSQUEEZY_STORE_ID &&
      process.env.LEMONSQUEEZY_VARIANT_ID_PRO &&
      process.env.LEMONSQUEEZY_VARIANT_ID_BUSINESS,
  );

  return (
    <div className="mx-auto max-w-5xl px-6 pt-16 pb-24 flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <Link
          href="/me"
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 내 페이지
        </Link>
        <h1 className="font-serif text-5xl leading-tight">구독.</h1>
        <p className="text-[color:var(--muted)] leading-relaxed">
          더 많은 서비스를 등록하시려면 플랜을 변경해주세요. 결제·환불·구독
          관리는 Lemon Squeezy 의 고객 센터에서 진행됩니다.
        </p>
      </header>

      {justSubscribed && (
        <div className="rounded-lg border-l-2 border-[color:var(--success)] bg-[color:var(--card)] px-5 py-4 text-sm">
          <p className="font-medium mb-1 text-[color:var(--foreground)]">
            결제가 진행 중이에요
          </p>
          <p className="text-[color:var(--muted)] leading-relaxed">
            Lemon Squeezy 가 처리되는 즉시 (보통 몇 초 안에) 플랜이 활성화돼요.
            잠시 후 새로고침해주세요.
          </p>
        </div>
      )}

      <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
            현재 플랜
          </span>
          <span className="font-serif text-3xl">{PLAN_LABEL[currentPlan]}</span>
          <span className="text-sm text-[color:var(--muted)]">
            슬롯 {slotsForPlan(currentPlan)}개
          </span>
        </div>
        {periodEnd && currentPlan !== "FREE" && (
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              다음 결제
            </span>
            <span className="font-mono text-sm">
              {periodEnd.toLocaleDateString("ko-KR")}
            </span>
            <span className="text-xs text-[color:var(--muted)]">
              {PLAN_PRICE_KRW[currentPlan].toLocaleString()}원
            </span>
          </div>
        )}
      </section>

      {!checkoutReady && (
        <div className="rounded-lg border-l-2 border-[color:var(--warning)] bg-[color:var(--card)] px-5 py-4 text-sm">
          <p className="font-medium mb-1 text-[color:var(--foreground)]">
            결제 시스템 설정 중
          </p>
          <p className="text-[color:var(--muted)] leading-relaxed">
            Lemon Squeezy API 키와 variant ID 설정이 끝나면 즉시 활성화됩니다.
            그 전까지 모든 사용자는 Free 플랜으로 이용 가능합니다.
          </p>
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-3">
        {ORDER.map((plan) => {
          const isCurrent = plan === currentPlan;
          const slots = PLAN_SLOTS[plan];
          const price = PLAN_PRICE_KRW[plan];
          return (
            <article
              key={plan}
              className={`rounded-xl border p-6 flex flex-col gap-5 ${
                isCurrent
                  ? "border-[color:var(--foreground)] bg-[color:var(--card)]"
                  : "border-[color:var(--border)] bg-[color:var(--card)]"
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl">{PLAN_LABEL[plan]}</h2>
                  {isCurrent && (
                    <span className="text-[10px] uppercase tracking-[0.18em] rounded-full border border-[color:var(--foreground)] px-2 py-0.5">
                      현재
                    </span>
                  )}
                </div>
                <p className="text-sm text-[color:var(--muted)] leading-relaxed">
                  {PLAN_TAGLINE[plan]}
                </p>
              </div>

              <div className="flex items-baseline gap-1.5 border-t border-[color:var(--border)] pt-4">
                <span className="font-serif text-4xl">
                  {price === 0 ? "무료" : `${price.toLocaleString()}`}
                </span>
                {price > 0 && (
                  <span className="text-sm text-[color:var(--muted)]">
                    원 / 월
                  </span>
                )}
              </div>

              <ul className="flex flex-col gap-2 text-sm">
                <li className="flex items-baseline gap-2">
                  <span aria-hidden="true" className="text-[color:var(--accent)]">
                    ·
                  </span>
                  서비스 {slots}개
                </li>
                {PLAN_PERKS[plan].slice(1).map((perk) => (
                  <li key={perk} className="flex items-baseline gap-2">
                    <span
                      aria-hidden="true"
                      className="text-[color:var(--accent)]"
                    >
                      ·
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              <PlanCta
                plan={plan}
                currentPlan={currentPlan}
                checkoutReady={checkoutReady}
              />
            </article>
          );
        })}
      </section>

      {currentPlan !== "FREE" && subscription?.ls_customer_id && (
        <section className="flex flex-col gap-3 pt-6 border-t border-[color:var(--border)]">
          <h2 className="font-serif text-xl text-[color:var(--muted)]">
            결제·구독 관리
          </h2>
          <p className="text-sm text-[color:var(--muted)] leading-relaxed">
            카드 변경·구독 취소·인보이스 다운로드는 Lemon Squeezy 고객 센터에서
            진행해주세요. 취소하시면 다음 결제일부터 Free 로 전환되고 슬롯
            초과분은 자동으로 숨겨집니다 (삭제 아님).
          </p>
          <PortalButton />
        </section>
      )}
    </div>
  );
}

function PlanCta({
  plan,
  currentPlan,
  checkoutReady,
}: {
  plan: Plan;
  currentPlan: Plan;
  checkoutReady: boolean;
}) {
  if (plan === currentPlan) {
    return (
      <button
        type="button"
        disabled
        className="cursor-not-allowed inline-flex items-center justify-center rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-medium opacity-60"
      >
        현재 플랜
      </button>
    );
  }

  if (plan === "FREE") {
    return (
      <button
        type="button"
        disabled
        className="cursor-not-allowed inline-flex items-center justify-center rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-medium opacity-60"
        title="결제·구독 관리에서 취소해주세요"
      >
        Free로 변경
      </button>
    );
  }

  if (!checkoutReady) {
    return (
      <button
        type="button"
        disabled
        className="cursor-not-allowed inline-flex items-center justify-center rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-medium opacity-60"
        title="Lemon Squeezy 설정 후 활성화"
      >
        업그레이드 (준비 중)
      </button>
    );
  }

  return (
    <CheckoutButton
      plan={plan as "PRO" | "BUSINESS"}
      label={`${PLAN_LABEL[plan]}로 업그레이드`}
    />
  );
}
