"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { findByUserId as findSubscriptionByUserId } from "@/lib/repositories/subscriptions";
import {
  createCheckout,
  getCustomerPortalUrl,
  type LSPlan,
} from "@/lib/lemonsqueezy";

const PlanSchema = z.enum(["PRO", "BUSINESS"]);

export type CheckoutState =
  | null
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function startCheckoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const planRaw = (formData.get("plan") as string | null) ?? "";
  const parsed = PlanSchema.safeParse(planRaw);
  if (!parsed.success) {
    return { ok: false, error: "잘못된 플랜이에요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/me/subscription");

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://kindred-chi.vercel.app";

  let result;
  try {
    result = await createCheckout({
      plan: parsed.data as LSPlan,
      customerEmail: user.email ?? undefined,
      customData: { user_id: user.id },
      redirectUrl: `${siteUrl}/me/subscription?ls=success`,
    });
  } catch (err) {
    return {
      ok: false,
      error: `결제 시스템 설정이 필요해요. (${(err as Error).message})`,
    };
  }
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, url: result.url };
}

export type PortalState =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function openCustomerPortalAction(): Promise<PortalState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/me/subscription");

  const sub = await findSubscriptionByUserId(supabase, user.id);
  if (!sub?.ls_customer_id) {
    return {
      ok: false,
      error: "활성 구독이 없어요. 먼저 플랜을 구독해주세요.",
    };
  }

  let url: string | null = null;
  try {
    url = await getCustomerPortalUrl(sub.ls_customer_id);
  } catch (err) {
    return {
      ok: false,
      error: `고객 센터 링크를 가져오지 못했어요. (${(err as Error).message})`,
    };
  }
  if (!url) {
    return { ok: false, error: "고객 센터 링크를 가져오지 못했어요." };
  }
  return { ok: true, url };
}
