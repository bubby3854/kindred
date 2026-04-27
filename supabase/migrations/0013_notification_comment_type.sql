-- ============================================================
-- COMMENT notification type
--
-- Fires when someone comments on a user's community post (not self).
-- ============================================================
alter type public.notification_type add value if not exists 'COMMENT';
