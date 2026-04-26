"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { findById as findProfileById } from "@/lib/repositories/profiles";
import {
  createPost,
  createComment,
  deletePost,
  deleteComment,
} from "@/lib/repositories/community";

const PostSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요").max(120),
  body: z.string().trim().min(1, "내용을 입력해주세요").max(8000),
});

const CommentSchema = z.object({
  body: z.string().trim().min(1, "내용을 입력해주세요").max(2000),
});

export type PostFormState = { ok: true } | { ok: false; error: string } | null;
export type CommentFormState = { ok: true } | { ok: false; error: string } | null;

export async function createPostAction(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const parsed = PostSchema.safeParse({
    title: (formData.get("title") as string | null) ?? "",
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
  if (!profile?.display_name) redirect("/onboarding?next=/community/new");

  const created = await createPost(supabase, {
    authorId: user.id,
    title: parsed.data.title,
    body: parsed.data.body,
  });
  if (!created) return { ok: false, error: "등록에 실패했습니다." };

  revalidatePath("/community");
  redirect(`/community/${created.id}`);
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

  const created = await createComment(supabase, {
    postId,
    authorId: user.id,
    body: parsed.data.body,
  });
  if (!created) return { ok: false, error: "댓글 작성에 실패했습니다." };

  revalidatePath(`/community/${postId}`);
  return { ok: true };
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
