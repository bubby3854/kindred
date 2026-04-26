"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { updateDisplayName } from "@/lib/repositories/profiles";

const NicknameSchema = z
  .string()
  .trim()
  .min(2, "2자 이상 입력해주세요")
  .max(20, "20자 이내로 입력해주세요");

export type FormState = { ok: true } | { ok: false; error: string } | null;

export async function setNicknameAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = NicknameSchema.safeParse(formData.get("nickname"));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ok = await updateDisplayName(supabase, user.id, parsed.data);
  if (!ok) return { ok: false, error: "저장에 실패했습니다. 잠시 후 다시 시도해주세요." };

  const next = (formData.get("next") as string | null) || "/me";
  revalidatePath("/", "layout");
  redirect(next);
}
