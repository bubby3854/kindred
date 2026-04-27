import type { SupabaseClient } from "@supabase/supabase-js";

export type CommunityPostListItem = {
  id: string;
  author_id: string;
  title: string;
  created_at: string;
  is_pinned: boolean;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

export type CommunityPostDetail = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  is_hidden: boolean;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

export type CommentReportReason =
  | "SPAM"
  | "HATE"
  | "AD"
  | "INAPPROPRIATE"
  | "OTHER";

export const COMMENT_REPORT_REASONS: { value: CommentReportReason; label: string }[] = [
  { value: "SPAM", label: "스팸" },
  { value: "HATE", label: "욕설/혐오" },
  { value: "AD", label: "광고/홍보" },
  { value: "INAPPROPRIATE", label: "부적절한 내용" },
  { value: "OTHER", label: "기타" },
];

export type PendingReport = {
  id: string;
  comment_id: string;
  reporter_id: string;
  reason: CommentReportReason;
  detail: string | null;
  created_at: string;
  community_comments: {
    id: string;
    post_id: string;
    author_id: string;
    body: string;
    is_hidden: boolean;
    created_at: string;
    profiles: { display_name: string | null } | null;
  } | null;
  reporter: { display_name: string | null } | null;
};

export async function listPosts(
  supabase: SupabaseClient,
  { limit }: { limit: number },
): Promise<CommunityPostListItem[]> {
  const { data } = await supabase
    .from("community_posts")
    .select(
      "id, author_id, title, created_at, is_pinned, profiles(display_name, avatar_url)",
    )
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as CommunityPostListItem[];
}

export async function getPost(
  supabase: SupabaseClient,
  id: string,
): Promise<CommunityPostDetail | null> {
  const { data } = await supabase
    .from("community_posts")
    .select(
      "id, author_id, title, body, created_at, updated_at, is_pinned, profiles(display_name, avatar_url)",
    )
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as CommunityPostDetail | null) ?? null;
}

export async function setPostPinned(
  supabase: SupabaseClient,
  postId: string,
  pinned: boolean,
): Promise<boolean> {
  const { error } = await supabase
    .from("community_posts")
    .update({ is_pinned: pinned })
    .eq("id", postId);
  return !error;
}

export async function createPost(
  supabase: SupabaseClient,
  input: { authorId: string; title: string; body: string },
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      author_id: input.authorId,
      title: input.title,
      body: input.body,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return { id: data.id as string };
}

export async function deletePost(
  supabase: SupabaseClient,
  id: string,
  authorId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", id)
    .eq("author_id", authorId);
  return !error;
}

export async function listComments(
  supabase: SupabaseClient,
  postId: string,
): Promise<CommunityComment[]> {
  const { data } = await supabase
    .from("community_comments")
    .select(
      "id, post_id, author_id, body, created_at, is_hidden, profiles(display_name, avatar_url)",
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as CommunityComment[];
}

export async function setCommentHidden(
  supabase: SupabaseClient,
  commentId: string,
  hidden: boolean,
): Promise<boolean> {
  const { error } = await supabase
    .from("community_comments")
    .update({ is_hidden: hidden })
    .eq("id", commentId);
  return !error;
}

export async function getCommentAuthor(
  supabase: SupabaseClient,
  commentId: string,
): Promise<{ author_id: string; post_id: string } | null> {
  const { data } = await supabase
    .from("community_comments")
    .select("author_id, post_id")
    .eq("id", commentId)
    .maybeSingle();
  return (data as { author_id: string; post_id: string } | null) ?? null;
}

export async function createCommentReport(
  supabase: SupabaseClient,
  input: {
    commentId: string;
    reporterId: string;
    reason: CommentReportReason;
    detail?: string | null;
  },
): Promise<boolean> {
  const { error } = await supabase.from("comment_reports").insert({
    comment_id: input.commentId,
    reporter_id: input.reporterId,
    reason: input.reason,
    detail: input.detail ?? null,
  });
  // Ignore duplicate (already reported by this user).
  return !error || error.code === "23505";
}

export async function listPendingReports(
  supabase: SupabaseClient,
  { limit }: { limit: number },
): Promise<PendingReport[]> {
  const { data } = await supabase
    .from("comment_reports")
    .select(
      "id, comment_id, reporter_id, reason, detail, created_at, community_comments(id, post_id, author_id, body, is_hidden, created_at, profiles(display_name)), reporter:profiles!comment_reports_reporter_id_fkey(display_name)",
    )
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as PendingReport[];
}

export async function resolveReport(
  supabase: SupabaseClient,
  reportId: string,
  adminId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("comment_reports")
    .update({
      resolved: true,
      resolved_by: adminId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);
  return !error;
}

export async function createComment(
  supabase: SupabaseClient,
  input: { postId: string; authorId: string; body: string },
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("community_comments")
    .insert({
      post_id: input.postId,
      author_id: input.authorId,
      body: input.body,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return { id: data.id as string };
}

export async function deleteComment(
  supabase: SupabaseClient,
  id: string,
  authorId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("community_comments")
    .delete()
    .eq("id", id)
    .eq("author_id", authorId);
  return !error;
}
