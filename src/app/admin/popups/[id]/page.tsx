import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getById } from "@/lib/repositories/site-popups";
import { PopupForm } from "../popup-form";

export const dynamic = "force-dynamic";

export default async function EditPopupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();
  const popup = await getById(admin, id);
  if (!popup) notFound();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/admin/popups"
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 팝업 목록
        </Link>
        <h1 className="font-serif text-4xl leading-tight">팝업 수정.</h1>
      </header>

      <PopupForm
        popupId={popup.id}
        initial={{ title: popup.title, body: popup.body }}
        submitLabel="변경 사항 저장"
      />
    </div>
  );
}
