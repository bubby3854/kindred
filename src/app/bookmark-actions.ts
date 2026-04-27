"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  add as addBookmark,
  remove as removeBookmark,
} from "@/lib/repositories/bookmarks";

export async function toggleBookmarkAction(
  serviceId: string,
  currentlyBookmarked: boolean,
): Promise<{ ok: boolean; bookmarked?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const ok = currentlyBookmarked
    ? await removeBookmark(supabase, serviceId, user.id)
    : await addBookmark(supabase, serviceId, user.id);
  if (!ok) return { ok: false };

  revalidatePath(`/s/${serviceId}`);
  revalidatePath("/me/bookmarks");
  return { ok: true, bookmarked: !currentlyBookmarked };
}
