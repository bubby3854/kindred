-- ============================================================
-- Community board: posts + comments
--
-- Anyone can read, logged-in users write their own. Author can edit/delete
-- their own rows. Cascade on profile delete cleans up.
-- ============================================================
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index community_posts_created_idx on public.community_posts (created_at desc);
create index community_posts_author_idx on public.community_posts (author_id);

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index community_comments_post_idx on public.community_comments (post_id, created_at);
create index community_comments_author_idx on public.community_comments (author_id);

create trigger set_updated_at_community_posts
before update on public.community_posts
for each row execute function public.tg_set_updated_at();

create trigger set_updated_at_community_comments
before update on public.community_comments
for each row execute function public.tg_set_updated_at();

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;

create policy "community_posts_read_all" on public.community_posts
  for select using (true);

create policy "community_posts_insert_own" on public.community_posts
  for insert with check (author_id = auth.uid());

create policy "community_posts_update_own" on public.community_posts
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "community_posts_delete_own" on public.community_posts
  for delete using (author_id = auth.uid());

create policy "community_comments_read_all" on public.community_comments
  for select using (true);

create policy "community_comments_insert_own" on public.community_comments
  for insert with check (author_id = auth.uid());

create policy "community_comments_update_own" on public.community_comments
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "community_comments_delete_own" on public.community_comments
  for delete using (author_id = auth.uid());
