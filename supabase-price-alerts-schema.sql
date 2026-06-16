-- DubaiVal Price Alerts — run ONCE in the Supabase SQL Editor for this project.
-- Creates the table backing the "Watch this building/area" feature.
-- RLS is enabled with NO anon policies on purpose: all reads/writes go through
-- /api/watch-subscribe, /api/unsubscribe, /api/check-price-alerts (service role
-- key, server-side only), so watcher emails are never exposed via the public
-- PostgREST endpoint (unlike market_config, which already allows anon PATCH).

create table if not exists price_watches (
  id bigint generated always as identity primary key,
  email text not null,
  target_type text not null check (target_type in ('building','area')),
  target_name text not null,
  area text,
  threshold_pct numeric not null default 5,
  last_psf numeric,
  active boolean not null default true,
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_checked_at timestamptz,
  last_alerted_at timestamptz,
  unique (email, target_type, target_name)
);

alter table price_watches enable row level security;
