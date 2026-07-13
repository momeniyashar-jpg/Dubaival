-- DubaiVal — real rental-liquidity ("how fast does this area actually rent")
-- tracking. Run ONCE in the Supabase SQL Editor.
--
-- Everything the app knew about rental demand until now was PRICE-only (real
-- rent vs real price = yield, added 2026-07-13 session 11m). It had no signal
-- at all for "which areas rent quickly vs sit vacant" — user asked for exactly
-- this ("advise a more demandable building, easier to rent than this one").
-- AREAS[].dom/txVol are SALES-side only, not reusable for rentals.
--
-- api/refresh-market-data.js's daily cron already fetches BOTH for-sale AND
-- for-rent listings per area (for the existing rent_1br/2br/3br benchmarks) —
-- this adds tracking of the INDIVIDUAL for-rent listing IDs seen each day
-- (rental_listings_seen), so a listing that stops appearing between two daily
-- snapshots can be inferred as rented (or delisted — same standard caveat
-- every "days on market" metric in the industry has). A weekly job
-- (?action=rental-velocity) then derives a real average time-to-rent per
-- area from accumulated sightings, the same way growth_1yr_realized was
-- derived from accumulated price_history (supabase-area-growth-schema.sql) —
-- and needs the same few weeks of accumulation before it's meaningful.
--
-- rental_listings_seen is written ONLY by the service-role cron — no anon
-- access at all, since it's pure derivation input, never read by the client.

create table if not exists rental_listings_seen (
  listing_id text not null,
  area_key text not null,
  first_seen date not null,
  last_seen date not null,
  beds int,
  price numeric,
  primary key (listing_id, area_key)
);
create index if not exists idx_rental_listings_area on rental_listings_seen(area_key);
create index if not exists idx_rental_listings_last_seen on rental_listings_seen(last_seen);

alter table rental_listings_seen enable row level security;
-- No policies created — RLS enabled with zero grants means anon/authenticated
-- roles get nothing; only the service-role key (used server-side by the cron)
-- bypasses RLS entirely, which is exactly the access this table should have.

alter table area_benchmarks add column if not exists rent_active_count int;
alter table area_benchmarks add column if not exists rent_avg_days_listed numeric;
alter table area_benchmarks add column if not exists rent_velocity_sample_size int;
alter table area_benchmarks add column if not exists rent_velocity_updated_at timestamptz;
