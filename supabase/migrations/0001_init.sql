-- kindred initial schema
-- Apply in Supabase Studio > SQL editor, or via `supabase db push` if using the CLI.

-- ============================================================
-- Enums
-- ============================================================
create type public.service_status as enum (
  'DRAFT',
  'PENDING_VERIFY',
  'PUBLISHED',
  'HIDDEN',
  'REJECTED'
);

create type public.subscription_plan as enum ('FREE', 'PRO', 'BUSINESS');
create type public.subscription_status as enum ('ACTIVE', 'PAUSED', 'CANCELED', 'PAST_DUE');

-- ============================================================
-- profiles  (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_username_idx on public.profiles (username);

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- categories  (admin-defined, fixed)
-- ============================================================
create table public.categories (
  id bigserial primary key,
  slug text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed a few starter categories. Admin can edit later.
insert into public.categories (slug, name, description, sort_order) values
  ('productivity', 'Productivity', 'Tools that help you get things done', 10),
  ('developer', 'Developer Tools', 'APIs, dev utilities, DX boosters', 20),
  ('education', 'Education', 'Learning platforms, courses, study aids', 30),
  ('social', 'Social', 'Communities, networking, messaging', 40),
  ('entertainment', 'Entertainment', 'Games, media, fun', 50),
  ('finance', 'Finance', 'Money, budgeting, investing', 60),
  ('health', 'Health & Wellness', 'Fitness, meditation, medical', 70),
  ('other', 'Other', 'Anything else', 999);

-- ============================================================
-- services
-- ============================================================
create table public.services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  category_id bigint references public.categories (id) on delete set null,
  title text not null,
  tagline text,
  description text,
  url text not null,
  thumbnail_url text,
  status public.service_status not null default 'DRAFT',
  verify_token text not null default encode(gen_random_bytes(16), 'hex'),
  verified_at timestamptz,
  last_verified_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_owner_idx on public.services (owner_id);
create index services_category_idx on public.services (category_id);
create index services_status_idx on public.services (status);
create index services_published_idx on public.services (published_at desc)
  where status = 'PUBLISHED';

-- ============================================================
-- service_screenshots  (1:N, v1 caps at 3 in the app layer)
-- ============================================================
create table public.service_screenshots (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index screenshots_service_idx on public.service_screenshots (service_id, sort_order);

-- ============================================================
-- subscriptions  (Toss Payments billing)
--   - toss_customer_key: customerKey we send to Toss for this user
--   - toss_billing_key:  billingKey returned by Toss after card auth (used for recurring charges)
--   - next_charge_at:    when our cron should next bill this user
-- ============================================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  toss_customer_key text unique,
  toss_billing_key text unique,
  plan public.subscription_plan not null default 'FREE',
  status public.subscription_status not null default 'ACTIVE',
  current_period_end timestamptz,
  next_charge_at timestamptz,
  cancel_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_billing_key_idx on public.subscriptions (toss_billing_key);
create index subscriptions_next_charge_idx on public.subscriptions (next_charge_at)
  where status = 'ACTIVE' and plan <> 'FREE';

-- ============================================================
-- likes  (v1 schema present; UI optional)
-- ============================================================
create table public.likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, service_id)
);

create index likes_service_idx on public.likes (service_id);

-- ============================================================
-- updated_at triggers
-- ============================================================
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles
before update on public.profiles
for each row execute function public.tg_set_updated_at();

create trigger set_updated_at_services
before update on public.services
for each row execute function public.tg_set_updated_at();

create trigger set_updated_at_subscriptions
before update on public.subscriptions
for each row execute function public.tg_set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.service_screenshots enable row level security;
alter table public.subscriptions enable row level security;
alter table public.likes enable row level security;

-- profiles: everyone can read, owner can update.
create policy "profiles_read_all" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- categories: everyone reads active ones. Writes via service_role only.
create policy "categories_read_active" on public.categories
  for select using (is_active);

-- services:
--   public can read PUBLISHED
--   owner can read all of their own rows
--   owner can insert/update/delete their own rows
create policy "services_read_public" on public.services
  for select using (status = 'PUBLISHED' or owner_id = auth.uid());

create policy "services_insert_own" on public.services
  for insert with check (owner_id = auth.uid());

create policy "services_update_own" on public.services
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "services_delete_own" on public.services
  for delete using (owner_id = auth.uid());

-- screenshots: piggyback on services ownership.
create policy "screenshots_read_public" on public.service_screenshots
  for select using (
    exists (
      select 1 from public.services s
      where s.id = service_id
        and (s.status = 'PUBLISHED' or s.owner_id = auth.uid())
    )
  );

create policy "screenshots_write_own" on public.service_screenshots
  for all using (
    exists (select 1 from public.services s where s.id = service_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.services s where s.id = service_id and s.owner_id = auth.uid())
  );

-- subscriptions: user reads own, writes via service_role (webhook) only.
create policy "subscriptions_read_own" on public.subscriptions
  for select using (user_id = auth.uid());

-- likes: user reads own, anyone reads counts via view/RPC if needed; here allow
-- users to manage their own rows and anyone to read.
create policy "likes_read_all" on public.likes
  for select using (true);

create policy "likes_write_own" on public.likes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
