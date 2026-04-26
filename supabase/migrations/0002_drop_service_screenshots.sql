-- ============================================================
-- Drop service_screenshots
--
-- Replaced by auto-fetched og:image stored on services.thumbnail_url
-- during ownership verification. The 1:N gallery had no UI shipped.
-- ============================================================
drop policy if exists "screenshots_read_public" on public.service_screenshots;
drop policy if exists "screenshots_write_own" on public.service_screenshots;

drop table if exists public.service_screenshots;
