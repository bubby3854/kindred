import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listActiveWithIds } from "@/lib/repositories/categories";
import { createServiceAction } from "../actions";
import { ServiceForm } from "../service-form";

export const metadata = { title: "서비스 추가 · kindred" };

export default async function NewServicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const categories = await listActiveWithIds(supabase);

  return (
    <div className="mx-auto max-w-2xl px-6 pt-16 pb-24 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <Link
          href="/me"
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 내 페이지
        </Link>
        <h1 className="font-serif text-5xl leading-tight">새 서비스.</h1>
        <p className="text-[color:var(--muted)] leading-relaxed">
          기본 정보를 먼저 저장한 뒤, 다음 단계에서 메타 태그로 소유권을
          인증해요. 인증 전에는 다른 사람에게 보이지 않아요.
        </p>
      </header>

      <ServiceForm
        action={createServiceAction}
        categories={categories}
        submitLabel="저장하고 인증으로"
      />
    </div>
  );
}
