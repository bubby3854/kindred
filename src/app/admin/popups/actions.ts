"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findById as findProfileById } from "@/lib/repositories/profiles";
import {
  createPopup,
  updatePopup,
  deletePopup,
} from "@/lib/repositories/site-popups";

const Schema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요").max(120),
  body: z.string().trim().min(1, "내용을 입력해주세요").max(4000),
});

export type PopupFormState =
  | null
  | { ok: true }
  | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profile = await findProfileById(supabase, user.id);
  if (!profile?.is_admin) redirect("/");
  return { user };
}

export async function createPopupAction(
  _prev: PopupFormState,
  formData: FormData,
): Promise<PopupFormState> {
  const parsed = Schema.safeParse({
    title: (formData.get("title") as string | null) ?? "",
    body: (formData.get("body") as string | null) ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  const created = await createPopup(admin, {
    title: parsed.data.title,
    body: parsed.data.body,
    createdBy: user.id,
  });
  if (!created) return { ok: false, error: "생성에 실패했습니다." };
  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
  redirect("/admin/popups");
}

export async function updatePopupAction(
  popupId: string,
  _prev: PopupFormState,
  formData: FormData,
): Promise<PopupFormState> {
  const parsed = Schema.safeParse({
    title: (formData.get("title") as string | null) ?? "",
    body: (formData.get("body") as string | null) ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }
  await requireAdmin();
  const admin = createAdminClient();
  const ok = await updatePopup(admin, popupId, {
    title: parsed.data.title,
    body: parsed.data.body,
  });
  if (!ok) return { ok: false, error: "저장에 실패했습니다." };
  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function togglePopupActiveAction(
  popupId: string,
  nextActive: boolean,
): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  await updatePopup(admin, popupId, { isActive: nextActive });
  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
}

export async function deletePopupAction(popupId: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  await deletePopup(admin, popupId);
  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
  redirect("/admin/popups");
}
