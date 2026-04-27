import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType = "ANNOUNCEMENT" | "REPORT" | "COMMENT";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export async function listForUser(
  supabase: SupabaseClient,
  userId: string,
  { limit }: { limit: number },
): Promise<NotificationItem[]> {
  const { data } = await supabase
    .from("notifications")
    .select("id, type, body, link, read_at, created_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as NotificationItem[];
}

export async function countUnread(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("deleted_at", null)
    .is("read_at", null);
  return count ?? 0;
}

export async function markAllRead(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)
    .is("deleted_at", null);
  return !error;
}

export async function softDelete(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);
  return !error;
}

export async function fanOutAnnouncement(
  admin: SupabaseClient,
  body: string,
): Promise<{ count: number } | null> {
  const { data: profiles, error: listErr } = await admin
    .from("profiles")
    .select("id");
  if (listErr || !profiles) return null;

  const rows = (profiles as { id: string }[]).map((p) => ({
    user_id: p.id,
    type: "ANNOUNCEMENT" as const,
    body,
  }));
  if (rows.length === 0) return { count: 0 };

  const { error } = await admin.from("notifications").insert(rows);
  if (error) return null;
  return { count: rows.length };
}

export async function notifyOne(
  admin: SupabaseClient,
  userId: string,
  type: NotificationType,
  body: string,
  link: string | null,
): Promise<boolean> {
  const { error } = await admin.from("notifications").insert({
    user_id: userId,
    type,
    body,
    link,
  });
  return !error;
}

export async function notifyAdmins(
  admin: SupabaseClient,
  type: NotificationType,
  body: string,
  link: string | null,
): Promise<{ count: number } | null> {
  const { data: admins, error: listErr } = await admin
    .from("profiles")
    .select("id")
    .eq("is_admin", true);
  if (listErr || !admins) return null;

  const rows = (admins as { id: string }[]).map((p) => ({
    user_id: p.id,
    type,
    body,
    link,
  }));
  if (rows.length === 0) return { count: 0 };

  const { error } = await admin.from("notifications").insert(rows);
  if (error) return null;
  return { count: rows.length };
}
