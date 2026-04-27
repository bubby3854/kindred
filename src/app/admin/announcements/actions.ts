"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findById as findProfileById } from "@/lib/repositories/profiles";
import { fanOutAnnouncement } from "@/lib/repositories/notifications";

const Schema = z.object({
  body: z.string().trim().min(1, "내용을 입력해주세요").max(1000),
});

export type AnnouncementFormState =
  | null
  | { ok: true; count: number }
  | { ok: false; error: string };

export async function createAnnouncementAction(
  _prev: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  const parsed = Schema.safeParse({
    body: (formData.get("body") as string | null) ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profile = await findProfileById(supabase, user.id);
  if (!profile?.is_admin) redirect("/");

  const admin = createAdminClient();
  const result = await fanOutAnnouncement(admin, parsed.data.body);
  if (!result) return { ok: false, error: "전송에 실패했습니다." };

  revalidatePath("/", "layout");
  return { ok: true, count: result.count };
}
