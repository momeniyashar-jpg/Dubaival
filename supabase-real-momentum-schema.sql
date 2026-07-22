-- DubaiVal — REAL, data-driven per-area momentum. Run ONCE in Supabase SQL Editor.
--
-- Replaces reliance on two previously-unreliable "market movement" signals:
--   1. fetchLiveMarket()'s "Live Geopolitical Adjustment" (js/core.js) — never
--      actually live: a frozen, hand-written narrative fed to an ungrounded
--      LLM call, producing a cosmetic Dashboard sentence that goes stale the
--      moment it's written and was never actually applied to any valuation.
--   2. runMarketIntelligence()'s AI-estimated 6-month trend (MARKET_MOMENTUM,
--      market_momentum table) — genuinely RAG-grounded in real news, but
--      still just an LLM's OPINION, and confirmed (2026-07-22) to have
--      pointed the wrong direction for at least one real, flagged case
--      (Downtown Dubai during a real, ongoing regional market correction).
--
-- This adds a THIRD signal computed with zero AI involvement, directly from
-- REAL accumulating price_history rows (already being written daily by the
-- existing api/refresh-market-data.js cron from live Bayut/PropertyFinder
-- listings): a rolling comparison of the last ~14 real days of an area's
-- live-listing PSF against the ~14 days before that. Being a genuinely
-- ROLLING comparison (recomputed weekly, always looking at recent-vs-prior),
-- it naturally tracks a real reversal within the same 6-month window (market
-- up, then down again) instead of freezing at a single point-in-time guess —
-- and being computed per AREA (not one number applied to every neighborhood
-- alike), it inherently reflects that different areas correct by different
-- amounts. js/valuation.js's getRealMomentumFactor() prefers this real signal
-- whenever it's available, falling back to the AI-estimated one only when
-- there isn't yet enough real data for a given area (a brand-new area not
-- yet covered by the daily cron, or too few price_history data points).

alter table area_benchmarks add column if not exists momentum_recent_pct numeric;
alter table area_benchmarks add column if not exists momentum_confidence text;
alter table area_benchmarks add column if not exists momentum_sample_recent integer;
alter table area_benchmarks add column if not exists momentum_sample_prior integer;
alter table area_benchmarks add column if not exists momentum_updated_at timestamptz;
