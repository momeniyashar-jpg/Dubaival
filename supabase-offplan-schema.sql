-- Off-Plan Projects feature (added 2026-07-17, revised same day after a
-- research pass into how Dubai off-plan launches actually work).
--
-- Real-world lifecycle confirmed via research + user's own domain knowledge:
--   Pre-Launch (developer opens EOI registration, weeks before launch,
--   sharing area/design/community details and unit counts) -> Official
--   Launch (developer publishes real per-unit-type pricing) -> Under
--   Construction -> Handed Over. Payment plan structure (10/70/20, 60/40,
--   post-handover, etc.) is one of the biggest decision factors for
--   off-plan buyers and needed its own field. Crucially, pricing is set
--   PER UNIT TYPE by the developer (a studio, a townhouse, and a villa in
--   the same masterplan can have entirely different PSF) — modeled as a
--   separate offplan_unit_types table rather than one flat PSF per
--   project, so the forecast engine can be accurate per unit type.
--
-- Two tables: offplan_projects (project-level facts + review workflow) and
-- offplan_unit_types (one row per unit type within a project — the actual
-- PSF/size figures the forecast engine uses), plus developer_track_record
-- (historical performance per developer, used by the price-forecast engine
-- in js/offplan.js).
--
-- Ownership model (user-confirmed hybrid, 2026-07-17):
--   - Admin (same password-gated system as every other admin_* RPC in this
--     project — see supabase-admin-security-fix.sql) can add a project
--     directly as already-published, or approve/reject a pending user
--     submission.
--   - Any signed-in user (e.g. an agent who knows about a new launch) can
--     submit a project, which lands as review_status='pending' and is
--     invisible to the public until an admin approves it — same "queued,
--     then admin-verified" pattern already used for OFM listing document
--     verification (supabase-ofm-trust-safety.sql), reused here rather
--     than inventing a second review mechanism.
--
-- Run this whole file in Supabase SQL Editor. Requires
-- supabase-admin-security-fix.sql to already be applied (reuses
-- _admin_password_ok()).

create table if not exists offplan_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  developer text not null,
  area text not null,
  project_stage text not null default 'prelaunch'
    check (project_stage in ('prelaunch','launched','under_construction','handed_over')),
  eoi_open_date date, -- when EOI/pre-launch registration opened, if known (nullable)
  launch_date date not null, -- official launch date (real per-unit pricing published)
  expected_handover date not null,
  payment_plan text, -- e.g. '10/70/20', '60/40', '1% Monthly', 'Post-Handover 3yr'
  source text, -- 'propertyfinder' | 'bayut' | 'tamani' | 'developer-site' | 'admin' | 'agent-submission'
  source_url text,
  notes text,
  review_status text not null default 'pending' check (review_status in ('pending','published','rejected')),
  submitted_by text, -- email of the submitting user, null for admin-direct-add
  rejection_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_offplan_projects_review_status on offplan_projects(review_status);
create index if not exists idx_offplan_projects_area on offplan_projects(area);
create index if not exists idx_offplan_projects_developer on offplan_projects(developer);

-- Pricing is set PER UNIT TYPE by the developer (a studio and a villa in
-- the same masterplan price completely differently) — one row per unit
-- type within a project, not one flat PSF per project.
create table if not exists offplan_unit_types (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references offplan_projects(id) on delete cascade,
  unit_type text not null, -- 'Studio' | '1BR' | '2BR' | '3BR' | 'Townhouse' | 'Villa' | etc.
  launch_psf numeric not null check (launch_psf > 0),
  size_min integer,
  size_max integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_offplan_unit_types_project on offplan_unit_types(project_id);

create table if not exists developer_track_record (
  id uuid primary key default gen_random_uuid(),
  developer text not null unique,
  tier integer, -- 1 (blue-chip/top-tier) .. 3 (lesser-known), editorial classification only
  projects_tracked integer not null default 0,
  avg_growth_launch_to_handover numeric, -- % , null until real historical data is entered
  avg_growth_handover_to_5yr numeric,    -- % , null until real historical data is entered
  notes text,
  updated_at timestamptz not null default now()
);

alter table offplan_projects enable row level security;
alter table offplan_unit_types enable row level security;
alter table developer_track_record enable row level security;

-- Public can only ever see published projects — pending/rejected rows are
-- invisible until an admin has acted on them.
drop policy if exists "public read published offplan projects" on offplan_projects;
create policy "public read published offplan projects"
  on offplan_projects for select
  to anon, authenticated
  using (review_status = 'published');

-- Unit types are only visible when their PARENT project is published.
drop policy if exists "public read unit types of published projects" on offplan_unit_types;
create policy "public read unit types of published projects"
  on offplan_unit_types for select
  to anon, authenticated
  using (exists (
    select 1 from offplan_projects p
    where p.id = offplan_unit_types.project_id and p.review_status = 'published'
  ));

-- All writes to both tables go through the RPCs below (SECURITY DEFINER),
-- never a raw client INSERT — so a tampered client request can't set
-- review_status='published' directly on a submission.

-- Developer track record is public-read (used by the forecast engine on
-- every visitor's browser), write-restricted to admin.
drop policy if exists "public read developer track record" on developer_track_record;
create policy "public read developer track record"
  on developer_track_record for select
  to anon, authenticated
  using (true);

-- Submit a new off-plan project suggestion, with its unit-type pricing.
-- p_unit_types is a jsonb array like:
--   [{"unit_type":"Studio","launch_psf":1500,"size_min":400,"size_max":550}, ...]
-- Always inserts as review_status='pending' — set server-side, never
-- trusted from the client, so a modified client request can't self-publish.
create or replace function submit_offplan_project(
  p_name text, p_developer text, p_area text, p_project_stage text,
  p_eoi_open_date date, p_launch_date date, p_expected_handover date,
  p_payment_plan text, p_unit_types jsonb, p_source text, p_source_url text,
  p_notes text, p_submitted_by text
) returns uuid
language plpgsql security definer as $$
declare
  v_id uuid;
  v_unit jsonb;
begin
  insert into offplan_projects(
    name, developer, area, project_stage, eoi_open_date, launch_date,
    expected_handover, payment_plan, source, source_url, notes,
    review_status, submitted_by
  ) values (
    p_name, p_developer, p_area, coalesce(p_project_stage,'prelaunch'),
    p_eoi_open_date, p_launch_date, p_expected_handover, p_payment_plan,
    p_source, p_source_url, p_notes, 'pending', p_submitted_by
  ) returning id into v_id;

  for v_unit in select * from jsonb_array_elements(coalesce(p_unit_types,'[]'::jsonb))
  loop
    insert into offplan_unit_types(project_id, unit_type, launch_psf, size_min, size_max)
    values (
      v_id,
      v_unit->>'unit_type',
      (v_unit->>'launch_psf')::numeric,
      nullif(v_unit->>'size_min','')::integer,
      nullif(v_unit->>'size_max','')::integer
    );
  end loop;

  return v_id;
end;
$$;

-- Admin-only: add a project directly as already-published (admin is the
-- trusted curator, so their own additions don't need a second review step).
create or replace function admin_add_offplan_project(
  p_admin_password text, p_name text, p_developer text, p_area text,
  p_project_stage text, p_eoi_open_date date, p_launch_date date,
  p_expected_handover date, p_payment_plan text, p_unit_types jsonb,
  p_source text, p_source_url text, p_notes text
) returns uuid
language plpgsql security definer as $$
declare
  v_id uuid;
  v_unit jsonb;
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'unauthorized';
  end if;
  insert into offplan_projects(
    name, developer, area, project_stage, eoi_open_date, launch_date,
    expected_handover, payment_plan, source, source_url, notes,
    review_status, reviewed_at
  ) values (
    p_name, p_developer, p_area, coalesce(p_project_stage,'prelaunch'),
    p_eoi_open_date, p_launch_date, p_expected_handover, p_payment_plan,
    p_source, p_source_url, p_notes, 'published', now()
  ) returning id into v_id;

  for v_unit in select * from jsonb_array_elements(coalesce(p_unit_types,'[]'::jsonb))
  loop
    insert into offplan_unit_types(project_id, unit_type, launch_psf, size_min, size_max)
    values (
      v_id,
      v_unit->>'unit_type',
      (v_unit->>'launch_psf')::numeric,
      nullif(v_unit->>'size_min','')::integer,
      nullif(v_unit->>'size_max','')::integer
    );
  end loop;

  return v_id;
end;
$$;

-- Admin-only: list pending submissions (with their unit types) for the
-- review queue. Returns one row per project with unit types aggregated as
-- jsonb so the admin UI can show the full picture in one call.
create or replace function admin_pending_offplan_projects(p_admin_password text)
returns table(
  id uuid, name text, developer text, area text, project_stage text,
  eoi_open_date date, launch_date date, expected_handover date,
  payment_plan text, source text, source_url text, notes text,
  submitted_by text, created_at timestamptz, unit_types jsonb
)
language plpgsql security definer as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'unauthorized';
  end if;
  return query
    select p.id, p.name, p.developer, p.area, p.project_stage,
           p.eoi_open_date, p.launch_date, p.expected_handover,
           p.payment_plan, p.source, p.source_url, p.notes,
           p.submitted_by, p.created_at,
           coalesce((
             select jsonb_agg(jsonb_build_object(
               'unit_type', u.unit_type, 'launch_psf', u.launch_psf,
               'size_min', u.size_min, 'size_max', u.size_max
             ))
             from offplan_unit_types u where u.project_id = p.id
           ), '[]'::jsonb) as unit_types
    from offplan_projects p
    where p.review_status = 'pending'
    order by p.created_at asc;
end;
$$;

-- Admin-only: approve or reject a pending submission.
create or replace function admin_review_offplan_project(
  p_admin_password text, p_project_id uuid, p_approve boolean, p_rejection_reason text
) returns void
language plpgsql security definer as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'unauthorized';
  end if;
  update offplan_projects
  set review_status = case when p_approve then 'published' else 'rejected' end,
      rejection_reason = case when p_approve then null else p_rejection_reason end,
      reviewed_at = now()
  where id = p_project_id;
end;
$$;

-- Admin-only: create/update a developer's track record (the historical
-- performance figures the forecast engine blends into its projection).
create or replace function admin_upsert_developer_track_record(
  p_admin_password text, p_developer text, p_tier integer,
  p_projects_tracked integer, p_avg_growth_launch_to_handover numeric,
  p_avg_growth_handover_to_5yr numeric, p_notes text
) returns void
language plpgsql security definer as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'unauthorized';
  end if;
  insert into developer_track_record(
    developer, tier, projects_tracked, avg_growth_launch_to_handover,
    avg_growth_handover_to_5yr, notes, updated_at
  ) values (
    p_developer, p_tier, coalesce(p_projects_tracked,0), p_avg_growth_launch_to_handover,
    p_avg_growth_handover_to_5yr, p_notes, now()
  )
  on conflict (developer) do update set
    tier = excluded.tier,
    projects_tracked = excluded.projects_tracked,
    avg_growth_launch_to_handover = excluded.avg_growth_launch_to_handover,
    avg_growth_handover_to_5yr = excluded.avg_growth_handover_to_5yr,
    notes = excluded.notes,
    updated_at = now();
end;
$$;
