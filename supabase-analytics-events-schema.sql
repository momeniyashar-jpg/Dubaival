-- Launch-readiness item 3/8: first-party funnel/event tracking.
-- No new external service — reuses the existing Supabase project.
-- Run this once in Supabase Dashboard -> SQL Editor.

create table if not exists analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text not null,
  event_name text not null,
  area text,
  meta jsonb
);

create index if not exists analytics_events_created_at_idx on analytics_events(created_at desc);
create index if not exists analytics_events_event_name_idx on analytics_events(event_name);
create index if not exists analytics_events_session_id_idx on analytics_events(session_id);

alter table analytics_events enable row level security;

-- Write-only for anon, same pattern as analyzer_feedback — no anon
-- SELECT/UPDATE/DELETE. Funnel analysis happens from the Supabase
-- dashboard/SQL editor (or a future internal-only admin view), not from
-- any client-side query.
drop policy if exists analytics_events_insert on analytics_events;
create policy analytics_events_insert on analytics_events
  for insert to anon
  with check (true);
