"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createOwned,
  deleteOwned,
  updateOwned,
} from "@/lib/repositories/services";
import { verifyServiceForOwner } from "@/lib/use-cases/verify-service";
import { getSlotStatus } from "@/lib/use-cases/slot-status";
import { restoreSingleForOwner } from "@/lib/use-cases/restore-service";

const FieldsSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요").max(80),
  tagline: z.string().trim().max(160).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  url: z.string().trim().url("올바른 URL이 아닙니다"),
  category_id: z.coerce.number().int().positive("카테고리를 선택해주세요"),
});

export type FormState = { ok: true } | { ok: false; error: string } | null;

function fromForm(formData: FormData) {
  return {
    title: (formData.get("title") as string | null) ?? "",
    tagline: (formData.get("tagline") as string | null) ?? "",
    description: (formData.get("description") as string | null) ?? "",
    url: (formData.get("url") as string | null) ?? "",
    category_id: (formData.get("category_id") as string | null) ?? "",
  };
}

export async function createServiceAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = FieldsSchema.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const slot = await getSlotStatus(supabase, user.id);
  if (!slot.hasRoom) {
    return {
      ok: false,
      error: `${slot.plan} 플랜의 슬롯(${slot.slots}개)을 모두 사용 중이에요. 구독 페이지에서 플랜을 변경해주세요.`,
    };
  }

  const created = await createOwned(supabase, {
    ownerId: user.id,
    categoryId: parsed.data.category_id,
    title: parsed.data.title,
    tagline: parsed.data.tagline || null,
    description: parsed.data.description || null,
    url: parsed.data.url,
  });

  if (!created) {
    return { ok: false, error: "등록에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath("/me");
  redirect(`/me/services/${created.id}`);
}

export async function updateServiceAction(
  serviceId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = FieldsSchema.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ok = await updateOwned(supabase, serviceId, user.id, {
    categoryId: parsed.data.category_id,
    title: parsed.data.title,
    tagline: parsed.data.tagline || null,
    description: parsed.data.description || null,
    url: parsed.data.url,
  });

  if (!ok) return { ok: false, error: "저장에 실패했습니다." };

  revalidatePath(`/me/services/${serviceId}`);
  revalidatePath("/me");
  return { ok: true };
}

export async function deleteServiceAction(serviceId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await deleteOwned(supabase, serviceId, user.id);
  revalidatePath("/me");
  redirect("/me");
}

export type VerifyState =
  | null
  | { ok: true }
  | {
      ok: false;
      reason:
        | "not_found"
        | "forbidden"
        | "slot_full"
        | "fetch_failed"
        | "meta_missing"
        | "token_mismatch";
      detail?: string;
    };

export async function verifyServiceAction(
  serviceId: string,
  _prev: VerifyState,
): Promise<VerifyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await verifyServiceForOwner(supabase, {
    serviceId,
    userId: user.id,
  });

  revalidatePath(`/me/services/${serviceId}`);
  revalidatePath("/me");

  if (result.ok) return { ok: true };
  if (result.status === "not_found") return { ok: false, reason: "not_found" };
  if (result.status === "forbidden") return { ok: false, reason: "forbidden" };
  if (result.status === "slot_full")
    return {
      ok: false,
      reason: "slot_full",
      detail: `${result.plan} 플랜 ${result.slots}개`,
    };
  return {
    ok: false,
    reason: result.reason.reason,
    detail: "detail" in result.reason ? result.reason.detail : undefined,
  };
}

export type RestoreState =
  | null
  | { ok: true }
  | {
      ok: false;
      reason: "not_found" | "wrong_status" | "slot_full";
      detail?: string;
    };

export async function restoreServiceAction(
  serviceId: string,
  _prev: RestoreState,
): Promise<RestoreState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await restoreSingleForOwner(supabase, {
    serviceId,
    userId: user.id,
  });

  revalidatePath(`/me/services/${serviceId}`);
  revalidatePath("/me");

  if (result.ok) return { ok: true };
  if (result.status === "not_found") return { ok: false, reason: "not_found" };
  if (result.status === "wrong_status")
    return { ok: false, reason: "wrong_status" };
  return {
    ok: false,
    reason: "slot_full",
    detail: `${result.plan} 플랜 ${result.slots}개`,
  };
}
