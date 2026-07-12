-- Launch-readiness item 2/8: lightweight per-result feedback ("was this accurate?")
-- Run this once in Supabase Dashboard -> SQL Editor.

create table if not exists analyzer_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  mode text not null,              -- 'sale' | 'rent' | 'commercial' | 'land'
  area text,
  building text,
  is_accurate boolean not null,
  conf_score integer,
  data_source text,
  verdict text,
  comment text
);

create index if not exists analyzer_feedback_created_at_idx on analyzer_feedback(created_at desc);
create index if not exists analyzer_feedback_area_idx on analyzer_feedback(area);

alter table analyzer_feedback enable row level security;

-- Anonymous visitors may submit feedback (write-only) but never read/modify
-- others' feedback — matches the OFM lockdown pattern used elsewhere in this
-- app (session 2026-07-11): public tables get narrow, purpose-specific
-- policies, never blanket anon SELECT/UPDATE/DELETE.
drop policy if exists analyzer_feedback_insert on analyzer_feedback;
create policy analyzer_feedback_insert on analyzer_feedback
  for insert to anon
  with check (true);
