-- ============================================================
-- Community post extensions: moderation + categories + likes
--
-- Mirrors what we already have on comments + services so posts gain
-- feature parity (hide, report, like, sort, classify).
-- ============================================================

-- Hide moderation (parallel to community_comments.is_hidden)
alter table public.community_posts
  add column if not exists is_hidden boolean not null default false;

-- Post categories (required; default CHAT for backfill of existing rows)
create type public.community_post_category as enum (
  'LAUNCH',  -- 출시
  'HELP',    -- 도움 요청
  'JOB',     -- 채용
  'CHAT'     -- 잡담
);

alter table public.community_posts
  add column if not exists category public.community_post_category
    not null default 'CHAT';

create index if not exists community_posts_category_idx
  on public.community_posts (category, created_at desc);

-- Post reports (parallel to comment_reports)
create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason public.comment_report_reason not null,
  detail text,
  resolved boolean not null default false,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create index post_reports_pending_idx
  on public.post_reports (created_at desc) where not resolved;
create index post_reports_post_idx on public.post_reports (post_id);

alter table public.post_reports enable row level security;

create policy "post_reports_read_own" on public.post_reports
  for select using (reporter_id = auth.uid());

create policy "post_reports_insert_own" on public.post_reports
  for insert with check (reporter_id = auth.uid());

-- Post likes (parallel to likes for services)
create table public.post_likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.community_posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index post_likes_post_idx on public.post_likes (post_id);

alter table public.post_likes enable row level security;

-- Anyone can read counts (aggregated); user can insert/delete their own.
create policy "post_likes_read_all" on public.post_likes
  for select using (true);

create policy "post_likes_insert_own" on public.post_likes
  for insert with check (user_id = auth.uid());

create policy "post_likes_delete_own" on public.post_likes
  for delete using (user_id = auth.uid());
