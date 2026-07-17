-- Portfolio value history (added 2026-07-17) — the one genuinely missing
-- piece from an otherwise-complete cloud-sync setup for the Portfolio
-- Manager: user_portfolios (supabase-user-profiles-schema.sql) already
-- syncs the CURRENT asset list/goals, but nothing has ever recorded how the
-- portfolio's total value has moved over time. This table captures one
-- snapshot per signed-in user per day (client-throttled — see
-- _capturePortfolioSnapshot() in js/portfolio.js) so a time-series chart can
-- be rendered on the Portfolio Health tab.
--
-- Same RLS pattern as the existing user_portfolios table: owner-only via
-- auth.uid() = user_id (a real Supabase-issued JWT claim, not a
-- client-suppliable value) — no anon access at all.

create table if not exists portfolio_value_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  snapshot_date date not null default current_date,
  total_value numeric not null default 0,
  total_purchase numeric not null default 0,
  total_roi numeric not null default 0,
  avg_gross_yield numeric not null default 0,
  avg_net_yield numeric not null default 0,
  asset_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

create index if not exists idx_portfolio_snapshots_user_date
  on portfolio_value_snapshots(user_id, snapshot_date);

alter table portfolio_value_snapshots enable row level security;

create policy "Users can read own portfolio snapshots"
  on portfolio_value_snapshots for select using (auth.uid() = user_id);

create policy "Users can insert own portfolio snapshots"
  on portfolio_value_snapshots for insert with check (auth.uid() = user_id);

create policy "Users can update own portfolio snapshots"
  on portfolio_value_snapshots for update using (auth.uid() = user_id);
