-- ============================================================
-- Add free-input tech tags to services
--
-- Stored as text[] for simplicity (small cardinality per row).
-- App layer normalizes (trim + lowercase) before insert.
-- ============================================================
alter table public.services
  add column if not exists tags text[] not null default '{}';

create index if not exists services_tags_gin_idx on public.services using gin (tags);
