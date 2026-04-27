import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPost } from "@/lib/repositories/community";
import { updatePostAction } from "../../actions";
import { PostForm } from "../../new/post-form";

export const metadata = { title: "글 수정 · kindred" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/community/${id}/edit`);

  const post = await getPost(supabase, id);
  if (!post) notFound();
  if (post.author_id !== user.id) redirect(`/community/${id}`);

  const action = updatePostAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <Link
          href={`/community/${id}`}
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 글로 돌아가기
        </Link>
        <h1 className="font-serif text-4xl leading-tight">글 수정.</h1>
      </header>

      <PostForm
        action={action}
        initial={{
          title: post.title,
          body: post.body,
          category: post.category,
        }}
        submitLabel="변경 사항 저장"
      />
    </div>
  );
}
