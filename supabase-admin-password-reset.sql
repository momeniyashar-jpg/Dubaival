-- Admin password reset (2026-07-17) — the password previously communicated
-- to the user ("DubaiVal2025!") did NOT match the hash hardcoded in
-- _admin_password_ok() (supabase-admin-security-fix.sql) — verified by
-- computing sha256("DubaiVal2025!") and comparing byte-for-byte against the
-- literal in that file; they don't match. Since this is a one-way SHA-256
-- hash, the original real password (whatever it was) cannot be recovered
-- from it. This migration rotates it to a new, known password instead,
-- following the exact same pattern the original file's own comment
-- describes ("To rotate the password, replace this literal").
--
-- NEW ADMIN PASSWORD: DubaiVal-Admin-2026!
--
-- Run this in Supabase SQL Editor. Safe to re-run (idempotent
-- create-or-replace). Requires supabase-admin-security-fix.sql to already
-- be applied (this only replaces the one function it defines).

create or replace function _admin_password_ok(p_admin_password text)
returns boolean
language plpgsql
security definer
as $$
begin
  if p_admin_password is null then return false; end if;
  return encode(digest(p_admin_password, 'sha256'), 'hex')
       = 'fbd81d324969fe44f11e22a7b9170f90a163295f7131a78ed5060ae9c94e24f6';
end;
$$;
