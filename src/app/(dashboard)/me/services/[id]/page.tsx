import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listActiveWithIds } from "@/lib/repositories/categories";
import { getOwnedById, type ServiceStatus } from "@/lib/repositories/services";
import { updateServiceAction } from "../actions";
import { ServiceForm } from "../service-form";
import { VerifyButton } from "./verify-button";
import { RestoreButton } from "./restore-button";
import { DeleteButton } from "./delete-button";

export const metadata = { title: "서비스 편집 · kindred" };

const STATUS_LABEL: Record<ServiceStatus, string> = {
  DRAFT: "임시저장",
  PENDING_VERIFY: "검증 대기",
  PUBLISHED: "공개",
  HIDDEN: "숨김",
  REJECTED: "반려",
};

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [service, categories] = await Promise.all([
    getOwnedById(supabase, id, user.id),
    listActiveWithIds(supabase),
  ]);
  if (!service) notFound();

  const updateBound = updateServiceAction.bind(null, service.id);

  return (
    <div className="mx-auto max-w-2xl px-6 pt-16 pb-24 flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <Link
          href="/me"
          className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors w-fit"
        >
          ← 내 페이지
        </Link>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <h1 className="font-serif text-5xl leading-tight">서비스 편집.</h1>
          <span className="text-sm text-[color:var(--muted)]">
            상태 · {STATUS_LABEL[service.status]}
          </span>
        </div>
      </header>

      {service.status === "HIDDEN" ? (
        <section className="flex flex-col gap-5 rounded-xl border-l-2 border-[color:var(--warning)] bg-[color:var(--card)] p-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-serif text-2xl">숨겨진 서비스</h2>
            <p className="text-sm text-[color:var(--muted)] leading-relaxed">
              구독 취소 또는 슬롯 초과로 이 서비스가 비공개로 전환됐어요.
              다시 공개하려면 사용 중인 슬롯에 여유가 있어야 합니다.
            </p>
          </div>
          <RestoreButton serviceId={service.id} />
        </section>
      ) : (
        <section className="flex flex-col gap-5 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-serif text-2xl">소유권 인증</h2>
            <p className="text-sm text-[color:var(--muted)] leading-relaxed">
              아래 메타 태그를 사이트의{" "}
              <code className="font-mono">&lt;head&gt;</code> 안에 추가한 뒤
              확인 버튼을 눌러주세요. 인증이 끝나면 자동으로 공개 상태가 됩니다.
              사이트의 <code className="font-mono">og:image</code>를 카드 썸네일로 사용해요.
            </p>
          </div>
          <pre className="rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`<meta name="kindred-verify" content="${service.verify_token}">`}
          </pre>
          <VerifyButton serviceId={service.id} />
          {service.last_verified_at && (
            <p className="text-xs text-[color:var(--muted)]">
              마지막 확인 시도 ·{" "}
              {new Date(service.last_verified_at).toLocaleString("ko-KR")}
            </p>
          )}
        </section>
      )}

      <section className="flex flex-col gap-6">
        <h2 className="font-serif text-2xl border-b border-[color:var(--border)] pb-3">
          기본 정보
        </h2>
        <ServiceForm
          action={updateBound}
          categories={categories}
          submitLabel="변경 사항 저장"
          initial={{
            title: service.title,
            tagline: service.tagline ?? "",
            description: service.description ?? "",
            url: service.url,
            category_id: service.category_id,
            tags: (service.tags ?? []).join(", "),
          }}
        />
      </section>

      {service.status === "PUBLISHED" && (
        <ShowcaseBadge serviceId={service.id} />
      )}

      <section className="flex flex-col gap-3 pt-6 border-t border-[color:var(--border)]">
        <h2 className="font-serif text-xl text-[color:var(--muted)]">
          위험 구역
        </h2>
        <DeleteButton serviceId={service.id} title={service.title} />
      </section>
    </div>
  );
}

function ShowcaseBadge({ serviceId }: { serviceId: string }) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://kindred-chi.vercel.app";
  const linkUrl = `${siteUrl}/s/${serviceId}`;
  const badgeUrl = `${siteUrl}/badge/s/${serviceId}`;
  const snippet = `<a href="${linkUrl}" target="_blank" rel="noopener">\n  <img src="${badgeUrl}" alt="kindred에 등록됨" width="220" height="44" />\n</a>`;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl">쇼케이스 배지</h2>
        <p className="text-sm text-[color:var(--muted)] leading-relaxed">
          본인 사이트에 붙이면 방문자가 한 번에 kindred 페이지로 올 수 있어요.
          아래 HTML 을 사이트 어디에든 붙여넣으세요.
        </p>
      </div>
      <div className="flex justify-center py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/badge/s/${serviceId}`}
          alt="kindred에 등록됨"
          width={220}
          height={44}
        />
      </div>
      <pre className="rounded-md border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-3 text-xs font-mono overflow-x-auto whitespace-pre">
{snippet}
      </pre>
    </section>
  );
}
