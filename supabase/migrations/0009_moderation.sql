-- ============================================================
-- Admin role + community moderation
--
-- Adds is_admin to profiles, comment_ban_until for temporary muting,
-- is_pinned on posts for admin announcements at top of /community,
-- is_hidden on comments to soft-delete content (placeholder shown to all),
-- and comment_reports queue for users to flag comments.
--
-- Admin actions are gated in the app layer; admin pages use the
-- service-role client to bypass RLS rather than encoding admin checks
-- into RLS policies (simpler).
-- ============================================================
alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists comment_ban_until timestamptz;

alter table public.community_posts
  add column if not exists is_pinned boolean not null default false;

alter table public.community_comments
  add column if not exists is_hidden boolean not null default false;

create index if not exists community_posts_pinned_idx
  on public.community_posts (is_pinned desc, created_at desc);

create type public.comment_report_reason as enum (
  'SPAM', 'HATE', 'AD', 'INAPPROPRIATE', 'OTHER'
);

create table public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.community_comments (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason public.comment_report_reason not null,
  detail text,
  resolved boolean not null default false,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (comment_id, reporter_id)
);

create index comment_reports_pending_idx
  on public.comment_reports (created_at desc) where not resolved;
create index comment_reports_comment_idx on public.comment_reports (comment_id);

alter table public.comment_reports enable row level security;

-- Logged-in users can see their own reports + create new ones.
-- Admin queries go through service_role and bypass RLS.
create policy "comment_reports_read_own" on public.comment_reports
  for select using (reporter_id = auth.uid());

create policy "comment_reports_insert_own" on public.comment_reports
  for insert with check (reporter_id = auth.uid());

-- Bootstrap: changminc66@gmail.com is the initial admin.
update public.profiles set is_admin = true
  where id = '6b031731-cdc4-448e-aad0-cf16aa977976';
