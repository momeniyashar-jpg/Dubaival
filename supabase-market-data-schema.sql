-- DubaiVal Market Data — run ONCE in the Supabase SQL Editor.
-- Creates tables for dynamic market data refresh (Phases 1-2).
-- RLS enabled: anon SELECT allowed (client reads), writes via service role only.

-- Phase 1: Live area benchmarks (refreshed daily by cron)
create table if not exists area_benchmarks (
  area_key text primary key,
  psf numeric,
  rent_studio numeric,
  rent_1br numeric,
  rent_2br numeric,
  rent_3br numeric,
  rent_villa_3br numeric,
  rent_villa_4br numeric,
  rent_villa_5br numeric,
  yield_low numeric,
  yield_high numeric,
  dom numeric,
  tx_vol numeric,
  sample_size integer default 0,
  updated_at timestamptz not null default now()
);

alter table area_benchmarks enable row level security;

create policy "anon_read_benchmarks" on area_benchmarks
  for select using (true);

-- Phase 2: Historical price tracking (daily snapshots)
create table if not exists price_history (
  id bigint generated always as identity primary key,
  area_key text not null,
  psf numeric not null,
  rent_avg numeric,
  sample_size integer default 0,
  snapshot_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (area_key, snapshot_date)
);

alter table price_history enable row level security;

create policy "anon_read_history" on price_history
  for select using (true);

-- Phase 3: Calibration factors (auto-calibration data)
create table if not exists avm_calibration (
  area_key text primary key,
  bias_factor numeric not null default 1.0,
  sample_count integer not null default 0,
  avg_error_pct numeric,
  last_calibrated timestamptz not null default now()
);

alter table avm_calibration enable row level security;

create policy "anon_read_calibration" on avm_calibration
  for select using (true);

-- Index for fast history queries
create index if not exists idx_price_history_area_date
  on price_history (area_key, snapshot_date desc);
