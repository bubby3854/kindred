"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { add as addLike, remove as removeLike } from "@/lib/repositories/likes";

export type LikeActionResult =
  | { ok: true; liked: boolean }
  | { ok: false; reason: "unauthorized" | "failed" };

export async function toggleLikeAction(
  serviceId: string,
  currentlyLiked: boolean,
): Promise<LikeActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthorized" };

  const ok = currentlyLiked
    ? await removeLike(supabase, serviceId, user.id)
    : await addLike(supabase, serviceId, user.id);
  if (!ok) return { ok: false, reason: "failed" };

  revalidatePath(`/s/${serviceId}`);
  return { ok: true, liked: !currentlyLiked };
}
