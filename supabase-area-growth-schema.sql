-- DubaiVal — realized-growth tracking. Run ONCE in the Supabase SQL Editor.
--
-- AREAS[area].g (the 0-1yr/1-3yr/2-5yr growth forecast shown across the app)
-- is 100% manually curated and never touched by live data — the existing
-- dynBench mechanism only blends live psf/rent/dom/txVol. This adds a
-- REALIZED (not forecast) 1-year growth figure, computed weekly by
-- api/refresh-market-data.js (?action=growth-refresh) from real price_history
-- data that's been accumulating daily since the daily refresh cron went live.
-- Only 1-year growth is computed — 3yr/5yr realized growth would need years
-- of accumulated price_history we don't have yet and won't for a long time;
-- those remain manual/projected, correctly, not silently faked.
--
-- Written via PATCH (not upsert) from the weekly cron specifically so it can
-- never touch the psf/rent/dom/tx_vol columns the daily cron already owns.

alter table area_benchmarks add column if not exists growth_1yr_realized numeric;
alter table area_benchmarks add column if not exists growth_updated_at timestamptz;
