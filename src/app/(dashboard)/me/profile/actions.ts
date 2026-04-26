"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/lib/repositories/profiles";

const Schema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, "닉네임은 2자 이상이어야 해요")
    .max(20, "닉네임은 20자 이내로 입력해주세요"),
  contact_email: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "올바른 이메일이 아닙니다"),
  external_url: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || isUrl(v), "올바른 URL이 아닙니다"),
});

function isUrl(v: string): boolean {
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

export type FormState = { ok: true } | { ok: false; error: string } | null;

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = Schema.safeParse({
    display_name: (formData.get("display_name") as string | null) ?? "",
    contact_email: (formData.get("contact_email") as string | null) ?? "",
    external_url: (formData.get("external_url") as string | null) ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ok = await updateProfile(supabase, user.id, {
    displayName: parsed.data.display_name,
    contactEmail: parsed.data.contact_email || null,
    externalUrl: parsed.data.external_url || null,
  });
  if (!ok) return { ok: false, error: "저장에 실패했습니다." };

  revalidatePath("/", "layout");
  return { ok: true };
}
