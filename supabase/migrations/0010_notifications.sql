-- ============================================================
-- In-app notifications
--
-- Per-user rows (fan-out at announce time). Lets each user
-- independently mark read/deleted. Soft-delete via deleted_at so admins
-- can audit later if needed.
--
-- Insert is admin-only (service_role bypasses RLS); user can read,
-- mark read, and soft-delete their own rows.
-- ============================================================
create type public.notification_type as enum ('ANNOUNCEMENT');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  body text not null,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_active_idx
  on public.notifications (user_id, created_at desc)
  where deleted_at is null;

alter table public.notifications enable row level security;

create policy "notifications_read_own" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
