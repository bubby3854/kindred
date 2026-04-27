-- ============================================================
-- Site-wide popups (admin-managed announcements / policy notices)
--
-- Active popups are shown once-per-browser via the SitePopupGate
-- (dismissal tracked in localStorage). Admin creates / edits / toggles
-- via /admin/popups using service_role.
-- ============================================================
create table public.site_popups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index site_popups_active_idx on public.site_popups (created_at desc)
  where is_active;

create trigger set_updated_at_site_popups
before update on public.site_popups
for each row execute function public.tg_set_updated_at();

alter table public.site_popups enable row level security;

-- Public can read active popups; writes via service_role.
create policy "site_popups_read_active" on public.site_popups
  for select using (is_active);

-- Seed the policy popup so it shows up immediately for new visitors.
insert into public.site_popups (title, body) values (
  '운영 정책 안내',
  E'kindred 는 인디 메이커가 직접 만든 작품을 소개하는 공간이에요.\n\n다음과 같은 사이트는 등록·홍보가 금지됩니다:\n- 도박·사행성 사이트\n- 성인·음란물 사이트\n- 불법 다운로드(영상·소프트웨어 등) 사이트\n- 사기·피싱·불법 정보 사이트\n- 그 외 관계 법령에 위배되는 콘텐츠\n\n위반 시 운영진은 사전 통지 없이 게시물을 숨기거나 계정의 작성을 제한할 수 있어요. 의심되는 사이트나 게시물을 발견하시면 댓글·게시글의 신고 기능으로 알려주세요.'
);
