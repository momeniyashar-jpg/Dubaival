-- Developer Sales-Contact Directory (Phase 3 of the GenieMap gap-closing
-- plan, added 2026-08-05) — closes the last of GenieMap's 3 core feature
-- gaps identified in the original comparison (off-plan map = Phase 1,
-- branded catalog = Phase 2, this = Phase 3; Phase 4 video calls remain).
--
-- A genuinely NEW feature/table, not an extension of an existing one —
-- deliberately mirrors supabase-offplan-schema.sql's own proven review
-- workflow byte-for-byte (same reviewer trust model, same RPC shape) rather
-- than inventing a second review mechanism, since that pattern is already
-- established and battle-tested in this exact codebase:
--
-- Ownership model (same hybrid as Off-Plan Projects):
--   - Admin (same password-gated system as every other admin_* RPC — see
--     supabase-admin-security-fix.sql) can add a contact directly as
--     already-published, or approve/reject a pending user submission.
--   - Any signed-in user (e.g. an agent who has a real developer sales
--     contact's number) can submit a contact, which lands as
--     review_status='pending' and is invisible to the public until an
--     admin approves it.
--
-- `developer` is deliberately free text, not a foreign key into
-- developer_track_record — that table's own `developer` column is `unique`
-- and is the closest thing to a canonical developer name in this schema,
-- but off-plan projects' own `developer` field is ALSO free text with no FK
-- enforcement, so a hard FK here would risk silently orphaning a real
-- submission over a spelling mismatch neither this file nor the existing
-- schema currently guards against elsewhere.
--
-- Run this whole file in Supabase SQL Editor. Requires
-- supabase-admin-security-fix.sql to already be applied (reuses
-- _admin_password_ok()).

create table if not exists developer_contacts (
  id uuid primary key default gen_random_uuid(),
  developer text not null,
  contact_name text not null,
  role text, -- e.g. 'Off-Plan Sales Manager', 'Sales Director'
  phone text,
  whatsapp text, -- only set when it genuinely differs from phone
  email text,
  office_area text, -- e.g. 'Business Bay HQ', 'DAMAC Sales Centre'
  notes text,
  source text, -- 'agent-submission' | 'admin' | 'developer-site' | 'linkedin' | etc.
  source_url text,
  review_status text not null default 'pending' check (review_status in ('pending','published','rejected')),
  submitted_by text, -- email of the submitting user, null for admin-direct-add
  rejection_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_developer_contacts_review_status on developer_contacts(review_status);
create index if not exists idx_developer_contacts_developer on developer_contacts(developer);

alter table developer_contacts enable row level security;

-- Public can only ever see published contacts — pending/rejected rows are
-- invisible until an admin has acted on them (same as offplan_projects).
drop policy if exists "public read published developer contacts" on developer_contacts;
create policy "public read published developer contacts"
  on developer_contacts for select
  to anon, authenticated
  using (review_status = 'published');

-- All writes go through the RPCs below (SECURITY DEFINER), never a raw
-- client INSERT — so a tampered client request can't set
-- review_status='published' directly on a submission.

-- Submit a new developer contact suggestion. Always inserts as
-- review_status='pending' — set server-side, never trusted from the
-- client, so a modified client request can't self-publish.
create or replace function submit_developer_contact(
  p_developer text, p_contact_name text, p_role text, p_phone text,
  p_whatsapp text, p_email text, p_office_area text, p_source text,
  p_source_url text, p_notes text, p_submitted_by text
) returns uuid
language plpgsql security definer as $$
declare
  v_id uuid;
begin
  insert into developer_contacts(
    developer, contact_name, role, phone, whatsapp, email, office_area,
    source, source_url, notes, review_status, submitted_by
  ) values (
    p_developer, p_contact_name, p_role, p_phone, p_whatsapp, p_email,
    p_office_area, p_source, p_source_url, p_notes, 'pending', p_submitted_by
  ) returning id into v_id;
  return v_id;
end;
$$;

-- Admin-only: add a contact directly as already-published (admin is the
-- trusted curator, so their own additions don't need a second review step).
create or replace function admin_add_developer_contact(
  p_admin_password text, p_developer text, p_contact_name text, p_role text,
  p_phone text, p_whatsapp text, p_email text, p_office_area text,
  p_source text, p_source_url text, p_notes text
) returns uuid
language plpgsql security definer as $$
declare
  v_id uuid;
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'unauthorized';
  end if;
  insert into developer_contacts(
    developer, contact_name, role, phone, whatsapp, email, office_area,
    source, source_url, notes, review_status, reviewed_at
  ) values (
    p_developer, p_contact_name, p_role, p_phone, p_whatsapp, p_email,
    p_office_area, p_source, p_source_url, p_notes, 'published', now()
  ) returning id into v_id;
  return v_id;
end;
$$;

-- Admin-only: list pending submissions for the review queue.
create or replace function admin_pending_developer_contacts(p_admin_password text)
returns table(
  id uuid, developer text, contact_name text, role text, phone text,
  whatsapp text, email text, office_area text, notes text, source text,
  source_url text, submitted_by text, created_at timestamptz
)
language plpgsql security definer as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'unauthorized';
  end if;
  return query
    select c.id, c.developer, c.contact_name, c.role, c.phone, c.whatsapp,
           c.email, c.office_area, c.notes, c.source, c.source_url,
           c.submitted_by, c.created_at
    from developer_contacts c
    where c.review_status = 'pending'
    order by c.created_at asc;
end;
$$;

-- Admin-only: approve or reject a pending submission.
create or replace function admin_review_developer_contact(
  p_admin_password text, p_contact_id uuid, p_approve boolean, p_rejection_reason text
) returns void
language plpgsql security definer as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'unauthorized';
  end if;
  update developer_contacts
  set review_status = case when p_approve then 'published' else 'rejected' end,
      rejection_reason = case when p_approve then null else p_rejection_reason end,
      reviewed_at = now()
  where id = p_contact_id;
end;
$$;
