-- ============================================================
-- Lightweight service view tracking
--
-- One row per page view of /s/[id]. Inserted via service_role from a
-- small client beacon (no PII collected — viewer_id only set if logged
-- in, no IP). Owner views are skipped at the app layer.
-- ============================================================
create table public.service_views (
  id bigserial primary key,
  service_id uuid not null references public.services (id) on delete cascade,
  viewer_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index service_views_service_idx
  on public.service_views (service_id, created_at desc);

alter table public.service_views enable row level security;

-- No public read; counts surface via owner dashboard which uses service_role.
-- Inserts also go through service_role beacon endpoint.
