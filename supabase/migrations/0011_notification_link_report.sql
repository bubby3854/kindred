-- ============================================================
-- Notification link + REPORT type
--
-- Lets us point a notification at a destination (e.g. /admin/reports)
-- when there's somewhere meaningful to click through to.
-- New REPORT type fires when a comment is reported, so admins see it
-- immediately in the bell.
-- ============================================================
alter type public.notification_type add value if not exists 'REPORT';

alter table public.notifications
  add column if not exists link text;
