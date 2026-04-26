-- ============================================================
-- Drop auto-fill of display_name on signup
--
-- Was pulling Google's full_name (often a real Korean name) and
-- exposing it on public service pages. Now users pick a nickname
-- in /onboarding before reaching the dashboard.
-- avatar_url stays auto-filled — not personally identifying in the
-- same way and useful as a default identity.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
