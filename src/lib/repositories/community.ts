import type { SupabaseClient } from "@supabase/supabase-js";

export type CommunityPostListItem = {
  id: string;
  author_id: string;
  title: string;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

export type CommunityPostDetail = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

export async function listPosts(
  supabase: SupabaseClient,
  { limit }: { limit: number },
): Promise<CommunityPostListItem[]> {
  const { data } = await supabase
    .from("community_posts")
    .select("id, author_id, title, created_at, profiles(display_name, avatar_url)")
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
      "id, author_id, title, body, created_at, updated_at, profiles(display_name, avatar_url)",
    )
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as CommunityPostDetail | null) ?? null;
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
      "id, post_id, author_id, body, created_at, profiles(display_name, avatar_url)",
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as CommunityComment[];
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
