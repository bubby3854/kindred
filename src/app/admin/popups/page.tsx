import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAll } from "@/lib/repositories/site-popups";
import {
  togglePopupActiveAction,
  deletePopupAction,
} from "./actions";
import { PopupForm } from "./popup-form";

export const dynamic = "force-dynamic";

export default async function AdminPopupsPage() {
  const admin = createAdminClient();
  const popups = await listAll(admin);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl leading-tight">팝업 관리.</h1>
        <p className="text-sm text-[color:var(--muted)] leading-relaxed">
          활성화된 팝업은 모든 방문자에게 한 번 표시되고, 닫은 뒤로는 다시
          뜨지 않아요 (브라우저별 기억). 새 팝업을 만들면 같은 사람도 새로
          보게 됩니다.
        </p>
      </header>

      <section className="flex flex-col gap-5">
        <h2 className="font-serif text-2xl border-b border-[color:var(--border)] pb-2">
          새 팝업
        </h2>
        <PopupForm submitLabel="만들기" />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-serif text-2xl border-b border-[color:var(--border)] pb-2">
          팝업 목록 ({popups.length})
        </h2>
        {popups.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            아직 팝업이 없어요.
          </p>
        ) : (
          <ul className="flex flex-col gap-5">
            {popups.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-5"
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <h3 className="font-serif text-xl flex items-baseline gap-2 flex-wrap">
                    {p.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-[color:var(--success)]/10 border border-[color:var(--success)]/30 px-2 py-0.5 text-[11px] text-[color:var(--success)] font-medium">
                        활성
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[11px] text-[color:var(--muted)]">
                        비활성
                      </span>
                    )}
                    <span>{p.title}</span>
                  </h3>
                  <div className="flex items-center gap-3 text-sm">
                    <Link
                      href={`/admin/popups/${p.id}`}
                      className="text-[color:var(--muted)] hover:text-[color:var(--foreground)] underline underline-offset-4"
                    >
                      수정
                    </Link>
                    <form
                      action={togglePopupActiveAction.bind(
                        null,
                        p.id,
                        !p.is_active,
                      )}
                    >
                      <button
                        type="submit"
                        className="cursor-pointer text-[color:var(--accent)] hover:opacity-80 underline underline-offset-4"
                      >
                        {p.is_active ? "비활성화" : "활성화"}
                      </button>
                    </form>
                    <form action={deletePopupAction.bind(null, p.id)}>
                      <button
                        type="submit"
                        className="cursor-pointer text-[color:var(--accent)] hover:opacity-80 underline underline-offset-4"
                      >
                        삭제
                      </button>
                    </form>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-[color:var(--muted)] line-clamp-6">
                  {p.body}
                </p>
                <p className="text-xs text-[color:var(--muted)]">
                  생성 · {new Date(p.created_at).toLocaleString("ko-KR")}
                  {p.updated_at !== p.created_at && (
                    <> · 수정 · {new Date(p.updated_at).toLocaleString("ko-KR")}</>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
