-- ============================================================
-- Add public contact fields to profiles
--
-- Lets makers expose how visitors (recruiters, collaborators) can reach
-- them. Both fields are opt-in; service detail page shows a contact
-- section only when at least one is set.
-- ============================================================
alter table public.profiles
  add column if not exists contact_email text,
  add column if not exists external_url text;
