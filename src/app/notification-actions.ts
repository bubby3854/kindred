"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  markAllRead,
  softDelete,
} from "@/lib/repositories/notifications";

export async function markAllReadAction(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const ok = await markAllRead(supabase, user.id);
  revalidatePath("/", "layout");
  return { ok };
}

export async function deleteNotificationAction(
  notificationId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const ok = await softDelete(supabase, notificationId, user.id);
  revalidatePath("/", "layout");
  return { ok };
}
