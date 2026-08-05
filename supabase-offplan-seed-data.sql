-- Off-Plan Projects — initial real-data seed (added 2026-08-05)
--
-- Closes the "database starts completely empty" gap documented in
-- CLAUDE.md's Outstanding items for the Off-Plan Projects tab (see the
-- 2026-07-17 work-log entry) — GenieMap-style gap analysis found this to be
-- the single biggest blocker before anything else in that feature area is
-- useful. Rather than wait on the Bayut "new-projects" API integration
-- (built, never live-tested — see js/app.js _adminFetchBayutOffplan) or a
-- Tamani/DLD-Pulse integration (not yet investigated), this seeds a small,
-- deliberately conservative set of REAL, individually-verified, currently
-- active (not-yet-handed-over) Dubai off-plan projects so the tab and the
-- planned off-plan map (Phase 1 of the GenieMap gap-closing plan) aren't
-- empty while those richer pipelines get built.
--
-- Sourcing discipline (Directive #2 — never fabricate, disclose what's
-- estimated vs confirmed): every project's launch_date/expected_handover/
-- payment_plan comes from a live WebSearch citation (source_url below).
-- Per-unit-type launch_psf figures preferentially use REAL DLD-transacted
-- averages already present in this repo's own
-- tools/calibration-output.json (the same ground-truth source powering
-- VALUATION_DB) rather than a developer's marketed "starting from" price —
-- these are noted as such in each project's `notes` field. Two strong
-- candidates found during research (Trillionaire Residences by Binghatti,
-- The Crest by Sobha) were REJECTED before inclusion once a handover-date
-- check showed both are already delivered (Q4 2024 and June 2025
-- respectively, both before this seed's 2026-08-05 write date) — i.e.
-- already resale-market buildings, not off-plan. A large real transaction
-- count in calibration data is NOT by itself a safe signal that a project
-- is still off-plan; always independently confirm the handover date is
-- genuinely still in the future before seeding.
--
-- Run this in Supabase SQL Editor AFTER supabase-offplan-schema.sql has
-- been applied. Idempotent-ish: uses a NOT EXISTS guard per project name so
-- re-running this file doesn't create duplicates, but it does NOT update an
-- existing row if one already exists under the same name (delete manually
-- via the Admin Dashboard first if a genuine re-seed is intended).

-- ── 1. DAMAC Islands 2 (Dubailand) ──────────────────────────────────────────
with new_project as (
  insert into offplan_projects (
    name, developer, area, project_stage, launch_date, expected_handover,
    payment_plan, source, source_url, notes, review_status, reviewed_at
  )
  select
    'DAMAC Islands 2', 'DAMAC Properties', 'DAMAC Islands', 'under_construction',
    '2025-11-12', '2028-10-01',
    '75/25 (10% booking deposit, 75% during construction, 25% at handover)',
    'web-research',
    'https://www.damacproperties.com/en/communities/damac-islands-2-community/projects/damac-islands-2/',
    'Phase 2 of DAMAC''s tropical-island-themed villa/townhouse masterplan in Dubailand — 8 clusters (Bahamas, Bermuda, Tahiti, Barbados, Maui, Antigua, Mauritius, Cuba) launched in stages through Feb 2026 (Antigua was the final cluster released, 28 Feb 2026). Handover Q4 2028 per developer materials. Unit-type PSF figures below are REAL DLD-transacted averages from tools/calibration-output.json (this repo''s own calibration source, real n=800-1,476 per cluster), not developer-quoted launch prices — these reflect actual closed sales (including likely secondary/assignment resales ahead of handover), which is why they run somewhat above the community''s marketed "starting from AED 2.45M" entry price.',
    'published', now()
  where not exists (select 1 from offplan_projects where name = 'DAMAC Islands 2')
  returning id
)
insert into offplan_unit_types (project_id, unit_type, launch_psf, size_min, size_max)
select id, v.unit_type, v.launch_psf, v.size_min, v.size_max
from new_project, (values
  ('Villa (Cuba Cluster)', 1772, null::integer, null::integer),
  ('Villa (Bahamas Cluster)', 1822, null::integer, null::integer),
  ('Villa (Tahiti Cluster)', 1822, null::integer, null::integer)
) as v(unit_type, launch_psf, size_min, size_max);

-- ── 2. Sobha Hartland 2 - Skyscape Collection (Bukadra) ────────────────────
with new_project as (
  insert into offplan_projects (
    name, developer, area, project_stage, launch_date, expected_handover,
    payment_plan, source, source_url, notes, review_status, reviewed_at
  )
  select
    'Sobha Hartland 2 - Skyscape Collection', 'Sobha Realty', 'Sobha Hartland 2',
    'under_construction', '2025-03-01', '2028-10-01',
    '60/40 (20% booking, 40% during construction, 40% at handover)',
    'web-research',
    'https://sobha-skyscape-avenue.com/en/',
    'Launch date is an ESTIMATE (confirmed: construction started in 2025; the exact launch day could not be independently verified) — flagged explicitly rather than presented as confirmed fact. Three towers within the Sobha Hartland 2 masterplan: Skyscape Avenue (handover ~Dec 2028) and Skyscape Aura (handover ~Q4 2028) share this row''s Q4 2028 expected_handover; Skyscape Altius hands over LATER, ~Q4 2029 (not reflected in this single project-level date — see its own unit-type entry for the real PSF, which is the only per-tower differentiation this schema captures cleanly). PSF figures are real DLD-transacted averages from tools/calibration-output.json, independently cross-validated: Skyscape Avenue''s calibration figure (2,425/sqft) closely matches a separately-cited live DLD data point (Feb 2026, AED 2,400-2,520/sqft) for the same building — strong agreement between two independent sources.',
    'published', now()
  where not exists (select 1 from offplan_projects where name = 'Sobha Hartland 2 - Skyscape Collection')
  returning id
)
insert into offplan_unit_types (project_id, unit_type, launch_psf, size_min, size_max)
select id, v.unit_type, v.launch_psf, v.size_min, v.size_max
from new_project, (values
  ('Apartment (Skyscape Altius — handover ~Q4 2029)', 2530, null::integer, null::integer),
  ('Apartment (Skyscape Avenue — handover ~Dec 2028)', 2425, null::integer, null::integer),
  ('Apartment (Skyscape Aura — handover ~Q4 2028)', 2395, 743, null::integer)
) as v(unit_type, launch_psf, size_min, size_max);

-- ── 3. Binghatti Skyrise (Business Bay) ─────────────────────────────────────
with new_project as (
  insert into offplan_projects (
    name, developer, area, project_stage, launch_date, expected_handover,
    payment_plan, source, source_url, notes, review_status, reviewed_at
  )
  select
    'Binghatti Skyrise', 'Binghatti Developers', 'Business Bay', 'under_construction',
    '2024-10-30', '2026-12-01',
    '70/30 (20% booking, 50% during construction, 30% at handover)',
    'web-research',
    'https://www.binghatti.com/en/projects/binghatti-skyrise',
    '3 towers, 48 floors each, 3,333 total residential units (studio-3BR mix). Launched 30 Oct 2024 at an AED 5B project value. Marketed launch price from AED 975,000 for a studio. Handover Q4 2026 — the nearest-term of this seed batch, still genuinely future as of this row''s 2026-08-05 write date. PSF below is the real DLD-transacted average for Tower C specifically (tools/calibration-output.json, n=4,696 real transactions, avg unit size 466 sqft) — the only one of the 3 towers with clean, individually-confirmed calibration data at seeding time; Towers A/B share the same overall project pricing per Binghatti''s own materials but weren''t independently verified here.',
    'published', now()
  where not exists (select 1 from offplan_projects where name = 'Binghatti Skyrise')
  returning id
)
insert into offplan_unit_types (project_id, unit_type, launch_psf, size_min, size_max)
select id, v.unit_type, v.launch_psf, v.size_min, v.size_max
from new_project, (values
  ('Apartment (Tower C)', 2577, null::integer, null::integer)
) as v(unit_type, launch_psf, size_min, size_max);

-- ── 4. The Oasis by Emaar (Dubailand) ───────────────────────────────────────
with new_project as (
  insert into offplan_projects (
    name, developer, area, project_stage, launch_date, expected_handover,
    payment_plan, source, source_url, notes, review_status, reviewed_at
  )
  select
    'The Oasis by Emaar', 'Emaar Properties', 'The Oasis by Emaar', 'under_construction',
    '2023-06-13', '2027-10-01',
    '80/20 (10% deposit, 70% during construction, 20% at handover)',
    'web-research',
    'https://www.emaar.com/en/press-release-listing/emaar-unveils-the-oasis-by-emaar-at-burj-khalifa-gala-with-guest-of-honour-shahrukh-khan',
    'A 100M-sqft ultra-luxury villa masterplan launched 13 June 2023 (Palmiera the first collection released). expected_handover above (Q4 2027) is PALMIERA''s own handover — the earliest-delivered collection, used as this row''s representative date since the schema holds one date per project. Other named collections hand over LATER, at real, individually-sourced starting prices (not independently converted to PSF here — sizes per collection weren''t confirmed, and doing so would risk a fabricated-looking precision this data doesn''t support): Tierra Address Villas from AED 13.2M; Mirage from AED 15.8M, handover ~Q2 2028; Mareva, handover ~Q1 2030; Lavita (ultra-luxury) from AED 40M, handover ~Q1 2029. The single launch_psf below (1,840/sqft) is the one confirmed community-wide average found during research — not broken out per collection.',
    'published', now()
  where not exists (select 1 from offplan_projects where name = 'The Oasis by Emaar')
  returning id
)
insert into offplan_unit_types (project_id, unit_type, launch_psf, size_min, size_max)
select id, v.unit_type, v.launch_psf, v.size_min, v.size_max
from new_project, (values
  ('Villa (Community Average)', 1840, null::integer, null::integer)
) as v(unit_type, launch_psf, size_min, size_max);
