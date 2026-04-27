-- ============================================================
-- Toss → Lemon Squeezy 전환
--
-- 토스 빌링키·고객키 컬럼을 제거하고 LS subscription_id / customer_id 로
-- 교체. LS 가 갱신·결제 재시도를 자체 처리하므로 next_charge_at 도 불필요.
-- LS 상태 매핑을 위해 PAUSED 추가.
-- ============================================================
alter table public.subscriptions
  drop column if exists toss_customer_key,
  drop column if exists toss_billing_key,
  drop column if exists next_charge_at;

alter table public.subscriptions
  add column if not exists ls_subscription_id text unique,
  add column if not exists ls_customer_id text;

create index if not exists subscriptions_ls_subscription_idx
  on public.subscriptions (ls_subscription_id);
create index if not exists subscriptions_ls_customer_idx
  on public.subscriptions (ls_customer_id);

alter type public.subscription_status add value if not exists 'PAUSED';
