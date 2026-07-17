-- Off-Plan Projects feature (added 2026-07-17)
-- Two tables: offplan_projects (individual tracked projects) and
-- developer_track_record (historical performance per developer, used by
-- the price-forecast engine in js/offplan.js).
--
-- Ownership model (user-confirmed hybrid, 2026-07-17):
--   - Admin (same password-gated system as every other admin_* RPC in this
--     project — see supabase-admin-security-fix.sql) can add a project
--     directly as already-published, or approve/reject a pending user
--     submission.
--   - Any signed-in user (e.g. an agent who knows about a new launch) can
--     submit a project, which lands as status='pending' and is invisible
--     to the public until an admin approves it — same "queued, then
--     admin-verified" pattern already used for OFM listing document
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
  launch_date date not null,
  expected_handover date not null,
  launch_psf numeric not null check (launch_psf > 0),
  unit_types text[] default '{}',
  size_min integer,
  size_max integer,
  source text, -- 'propertyfinder' | 'bayut' | 'tamani' | 'developer-site' | 'admin' | 'agent-submission'
  source_url text,
  notes text,
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  submitted_by text, -- email of the submitting user, null for admin-direct-add
  rejection_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_offplan_projects_status on offplan_projects(status);
create index if not exists idx_offplan_projects_area on offplan_projects(area);
create index if not exists idx_offplan_projects_developer on offplan_projects(developer);

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
alter table developer_track_record enable row level security;

-- Public can only ever see published projects — pending/rejected rows are
-- invisible until an admin has acted on them.
drop policy if exists "public read published offplan projects" on offplan_projects;
create policy "public read published offplan projects"
  on offplan_projects for select
  to anon, authenticated
  using (status = 'published');

-- Anyone can submit a suggestion — it always lands as 'pending' regardless
-- of what the client sends, enforced server-side via the RPC below rather
-- than trusting a raw client INSERT with a status column the caller could
-- set to 'published' directly. Direct table INSERT is intentionally NOT
-- opened to anon/authenticated — all writes go through the two RPCs below.

-- Developer track record is public-read (used by the forecast engine on
-- every visitor's browser), write-restricted to admin.
drop policy if exists "public read developer track record" on developer_track_record;
create policy "public read developer track record"
  on developer_track_record for select
  to anon, authenticated
  using (true);

-- Submit a new off-plan project suggestion. Always inserts as 'pending' —
-- the status/submitted_by columns are set server-side, never trusted from
-- the client, so a modified client request can't self-publish.
create or replace function submit_offplan_project(
  p_name text, p_developer text, p_area text, p_launch_date date,
  p_expected_handover date, p_launch_psf numeric, p_unit_types text[],
  p_size_min integer, p_size_max integer, p_source text, p_source_url text,
  p_notes text, p_submitted_by text
) returns uuid
language plpgsql security definer as $$
declare
  v_id uuid;
begin
  insert into offplan_projects(
    name, developer, area, launch_date, expected_handover, launch_psf,
    unit_types, size_min, size_max, source, source_url, notes,
    status, submitted_by
  ) values (
    p_name, p_developer, p_area, p_launch_date, p_expected_handover, p_launch_psf,
    coalesce(p_unit_types,'{}'), p_size_min, p_size_max, p_source, p_source_url, p_notes,
    'pending', p_submitted_by
  ) returning id into v_id;
  return v_id;
end;
$$;

-- Admin-only: add a project directly as already-published (admin is the
-- trusted curator, so their own additions don't need a second review step).
create or replace function admin_add_offplan_project(
  p_admin_password text, p_name text, p_developer text, p_area text,
  p_launch_date date, p_expected_handover date, p_launch_psf numeric,
  p_unit_types text[], p_size_min integer, p_size_max integer,
  p_source text, p_source_url text, p_notes text
) returns uuid
language plpgsql security definer as $$
declare
  v_id uuid;
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'unauthorized';
  end if;
  insert into offplan_projects(
    name, developer, area, launch_date, expected_handover, launch_psf,
    unit_types, size_min, size_max, source, source_url, notes,
    status, reviewed_at
  ) values (
    p_name, p_developer, p_area, p_launch_date, p_expected_handover, p_launch_psf,
    coalesce(p_unit_types,'{}'), p_size_min, p_size_max, p_source, p_source_url, p_notes,
    'published', now()
  ) returning id into v_id;
  return v_id;
end;
$$;

-- Admin-only: list pending submissions for the review queue.
create or replace function admin_pending_offplan_projects(p_admin_password text)
returns setof offplan_projects
language plpgsql security definer as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'unauthorized';
  end if;
  return query select * from offplan_projects where status = 'pending' order by created_at asc;
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
  set status = case when p_approve then 'published' else 'rejected' end,
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
