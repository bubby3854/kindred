"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  findById as findProfileById,
  setCommentBanUntil,
} from "@/lib/repositories/profiles";
import {
  createPost,
  updatePost,
  createComment,
  deletePost,
  deleteComment,
  setPostPinned,
  setPostHidden,
  setCommentHidden,
  createCommentReport,
  createPostReport,
  resolveReport,
  resolvePostReport,
  getCommentAuthor,
  getPostAuthor,
  getPost,
  COMMENT_REPORT_REASONS,
  type CommentReportReason,
} from "@/lib/repositories/community";
import { notifyAdmins, notifyOne } from "@/lib/repositories/notifications";
import {
  add as addPostLike,
  remove as removePostLike,
} from "@/lib/repositories/post-likes";

const PostCategorySchema = z.enum(["LAUNCH", "HELP", "JOB", "CHAT"]);

const PostSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요").max(120),
  body: z.string().trim().min(1, "내용을 입력해주세요").max(8000),
  category: PostCategorySchema,
});

const CommentSchema = z.object({
  body: z.string().trim().min(1, "내용을 입력해주세요").max(2000),
});

const ReportReasonSchema = z.enum([
  "SPAM",
  "HATE",
  "AD",
  "INAPPROPRIATE",
  "OTHER",
]);

export type PostFormState = { ok: true } | { ok: false; error: string } | null;
export type CommentFormState = { ok: true } | { ok: false; error: string } | null;

export async function createPostAction(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const parsed = PostSchema.safeParse({
    title: (formData.get("title") as string | null) ?? "",
    body: (formData.get("body") as string | null) ?? "",
    category: (formData.get("category") as string | null) ?? "",
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
  if (!profile?.display_name) redirect("/onboarding?next=/community/new");

  const created = await createPost(supabase, {
    authorId: user.id,
    title: parsed.data.title,
    body: parsed.data.body,
    category: parsed.data.category,
  });
  if (!created) return { ok: false, error: "등록에 실패했습니다." };

  revalidatePath("/community");
  redirect(`/community/${created.id}`);
}

export async function updatePostAction(
  postId: string,
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const parsed = PostSchema.safeParse({
    title: (formData.get("title") as string | null) ?? "",
    body: (formData.get("body") as string | null) ?? "",
    category: (formData.get("category") as string | null) ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ok = await updatePost(supabase, postId, user.id, {
    title: parsed.data.title,
    body: parsed.data.body,
    category: parsed.data.category,
  });
  if (!ok) return { ok: false, error: "저장에 실패했습니다." };

  revalidatePath("/community");
  revalidatePath(`/community/${postId}`);
  redirect(`/community/${postId}`);
}

export async function createCommentAction(
  postId: string,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const parsed = CommentSchema.safeParse({
    body: (formData.get("body") as string | null) ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "잘못된 입력" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/community/${postId}`);

  const profile = await findProfileById(supabase, user.id);
  if (!profile?.display_name) redirect(`/onboarding?next=/community/${postId}`);

  if (profile.comment_ban_until && new Date(profile.comment_ban_until) > new Date()) {
    const until = new Date(profile.comment_ban_until).toLocaleString("ko-KR");
    return {
      ok: false,
      error: `${until}까지 댓글 작성이 제한됩니다.`,
    };
  }

  const created = await createComment(supabase, {
    postId,
    authorId: user.id,
    body: parsed.data.body,
  });
  if (!created) return { ok: false, error: "댓글 작성에 실패했습니다." };

  // Notify post author about new comment (skip self-comment).
  const post = await getPost(supabase, postId);
  if (post && post.author_id !== user.id) {
    const commenterName = profile.display_name ?? "누군가";
    const admin = createAdminClient();
    await notifyOne(
      admin,
      post.author_id,
      "COMMENT",
      `${commenterName}님이 「${post.title}」에 댓글을 남겼어요.`,
      `/community/${postId}`,
    );
  }

  revalidatePath(`/community/${postId}`);
  return { ok: true };
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profile = await findProfileById(supabase, user.id);
  if (!profile?.is_admin) redirect("/");
  return { user, profile };
}

export async function togglePinPostAction(
  postId: string,
  pinned: boolean,
): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  await setPostPinned(admin, postId, pinned);
  revalidatePath("/community");
  revalidatePath(`/community/${postId}`);
}

export async function toggleHidePostAction(
  postId: string,
  hidden: boolean,
): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  await setPostHidden(admin, postId, hidden);
  revalidatePath("/community");
  revalidatePath(`/community/${postId}`);
  revalidatePath("/admin/reports");
}

export async function reportPostAction(
  postId: string,
  formData: FormData,
): Promise<void> {
  const reasonRaw = (formData.get("reason") as string | null) ?? "";
  const detail = (formData.get("detail") as string | null) ?? "";
  const parsed = ReportReasonSchema.safeParse(reasonRaw);
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/community/${postId}`);

  const reason = parsed.data as CommentReportReason;
  const ok = await createPostReport(supabase, {
    postId,
    reporterId: user.id,
    reason,
    detail: detail.trim() || null,
  });
  if (ok) {
    const reasonLabel =
      COMMENT_REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason;
    const admin = createAdminClient();
    await notifyAdmins(
      admin,
      "REPORT",
      `게시글 신고가 접수됐어요. (사유: ${reasonLabel})`,
      "/admin/reports",
    );
  }
  revalidatePath(`/community/${postId}`);
}

export async function resolvePostReportAction(reportId: string): Promise<void> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await resolvePostReport(admin, reportId, user.id);
  revalidatePath("/admin/reports");
}

export async function togglePostLikeAction(
  postId: string,
  currentlyLiked: boolean,
): Promise<{ ok: boolean; liked?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const ok = currentlyLiked
    ? await removePostLike(supabase, postId, user.id)
    : await addPostLike(supabase, postId, user.id);
  if (!ok) return { ok: false };

  revalidatePath(`/community/${postId}`);
  return { ok: true, liked: !currentlyLiked };
}

export async function toggleHideCommentAction(
  commentId: string,
  postId: string,
  hidden: boolean,
): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  await setCommentHidden(admin, commentId, hidden);
  revalidatePath(`/community/${postId}`);
  revalidatePath("/admin/reports");
}

export async function reportCommentAction(
  commentId: string,
  postId: string,
  formData: FormData,
): Promise<void> {
  const reasonRaw = (formData.get("reason") as string | null) ?? "";
  const detail = (formData.get("detail") as string | null) ?? "";
  const parsed = ReportReasonSchema.safeParse(reasonRaw);
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/community/${postId}`);

  const reason = parsed.data as CommentReportReason;
  const ok = await createCommentReport(supabase, {
    commentId,
    reporterId: user.id,
    reason,
    detail: detail.trim() || null,
  });

  // Only notify admins when this is a fresh report (createCommentReport
  // returns true even on duplicate-key, but we don't have a way to
  // distinguish here. The dedupe noise is acceptable for MVP — if the
  // same user spams the report button they'd hit the unique constraint).
  if (ok) {
    const reasonLabel =
      COMMENT_REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason;
    const admin = createAdminClient();
    await notifyAdmins(
      admin,
      "REPORT",
      `댓글 신고가 접수됐어요. (사유: ${reasonLabel})`,
      "/admin/reports",
    );
  }
  revalidatePath(`/community/${postId}`);
}

export async function banCommentAuthorAction(
  commentId: string,
  postId: string,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const days = Number(formData.get("days") ?? 0);
  if (!Number.isFinite(days) || days < 1 || days > 365) return;

  const admin = createAdminClient();
  const author = await getCommentAuthor(admin, commentId);
  if (!author) return;

  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  await setCommentBanUntil(admin, author.author_id, until);
  revalidatePath(`/community/${postId}`);
  revalidatePath("/admin/reports");
}

export async function banPostAuthorAction(
  postId: string,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const days = Number(formData.get("days") ?? 0);
  if (!Number.isFinite(days) || days < 1 || days > 365) return;

  const admin = createAdminClient();
  const author = await getPostAuthor(admin, postId);
  if (!author) return;

  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  await setCommentBanUntil(admin, author.author_id, until);
  revalidatePath(`/community/${postId}`);
  revalidatePath("/admin/reports");
}

export async function resolveReportAction(reportId: string): Promise<void> {
  const { user } = await requireAdmin();
  const admin = createAdminClient();
  await resolveReport(admin, reportId, user.id);
  revalidatePath("/admin/reports");
}

export async function deletePostAction(postId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await deletePost(supabase, postId, user.id);
  revalidatePath("/community");
  redirect("/community");
}

export async function deleteCommentAction(
  commentId: string,
  postId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await deleteComment(supabase, commentId, user.id);
  revalidatePath(`/community/${postId}`);
}
