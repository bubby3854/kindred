-- ============================================================
-- Bookmarks + post drafts
--
-- Bookmarks: per-user save list of services (mirrors likes shape).
-- Post drafts: is_draft flag on community_posts; drafts stay invisible
-- in public lists / detail to non-author readers.
-- ============================================================
create table public.bookmarks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, service_id)
);

create index bookmarks_user_idx on public.bookmarks (user_id, created_at desc);

alter table public.bookmarks enable row level security;

create policy "bookmarks_read_own" on public.bookmarks
  for select using (user_id = auth.uid());

create policy "bookmarks_insert_own" on public.bookmarks
  for insert with check (user_id = auth.uid());

create policy "bookmarks_delete_own" on public.bookmarks
  for delete using (user_id = auth.uid());

alter table public.community_posts
  add column if not exists is_draft boolean not null default false;
