-- ═══════════════════════════════════════════════════════════════════════════
-- ADMIN AUTH SECURITY FIX (2026-07-11)
-- ═══════════════════════════════════════════════════════════════════════════
-- PROBLEM: admin_update_agent / admin_get_referrals / admin_update_referral
-- (added in supabase-rls-hardening.sql) verify a caller by comparing a
-- CLIENT-SUPPLIED SHA-256 hash against a hardcoded literal. The exact same
-- literal hash is also shipped inside the public JS bundle (js/app.js), so
-- reading the hash out of the browser's network/source tab is enough to call
-- these RPCs directly with curl — no need to ever know the real password.
-- A hash that both sides already know is not a secret; it's a bearer token
-- printed on the app's own front door.
--
-- Separately, market_config (the table the "Market Risk Controls" admin panel
-- writes to) has never had any RPC/password gate at all — the client PATCHes
-- it directly with the public anon key, so the password screen in front of it
-- was purely cosmetic UI, not real authorization.
--
-- FIX: RPCs now take the PLAINTEXT password and hash it server-side with
-- pgcrypto before comparing. Only the plaintext ever leaves the browser (over
-- HTTPS, like any normal login form), and it is never embedded in client JS.
-- market_config direct anon UPDATE is revoked; writes now go through a new
-- password-gated RPC, same as the other admin actions.
--
-- Run this in Supabase Dashboard → SQL Editor. Safe to re-run (idempotent).
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- Shared password check (used by every admin RPC below).
-- Hash is the SHA-256 of the existing admin password ("DubaiVal2025!") — kept
-- server-side only from now on. To rotate the password, replace this literal.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function _admin_password_ok(p_admin_password text)
returns boolean
language plpgsql
security definer
as $$
begin
  if p_admin_password is null then return false; end if;
  return encode(digest(p_admin_password, 'sha256'), 'hex')
       = '67ed667fed4620ba36c09d97b542b81c39a5f63bcbdfe8d1931c234748498fc1';
end;
$$;

-- Cheap login-check RPC: lets the client verify a typed password without
-- touching any table. Used by both the Market Risk Controls gate and the
-- Deal Network admin dashboard gate.
create or replace function admin_verify(p_admin_password text)
returns boolean
language plpgsql
security definer
as $$
begin
  return _admin_password_ok(p_admin_password);
end;
$$;

grant execute on function admin_verify(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Re-secure the 3 existing admin RPCs: same behavior, now password-based.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists admin_update_agent(text, bigint, jsonb);
create or replace function admin_update_agent(
  p_admin_password text,
  p_agent_id bigint,
  p_updates jsonb
)
returns boolean
language plpgsql
security definer
as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'Not authorized';
  end if;

  update dv_agents set
    subscription = coalesce(p_updates->>'subscription', subscription),
    active = coalesce((p_updates->>'active')::boolean, active),
    rating = coalesce((p_updates->>'rating')::numeric, rating),
    deals_closed = coalesce((p_updates->>'deals_closed')::integer, deals_closed),
    video_analyses = coalesce((p_updates->>'video_analyses')::integer, video_analyses),
    updated_at = now()
  where id = p_agent_id;

  return true;
end;
$$;

grant execute on function admin_update_agent(text, bigint, jsonb) to anon, authenticated;

drop function if exists admin_get_referrals(text);
create or replace function admin_get_referrals(p_admin_password text)
returns setof dv_referrals
language plpgsql
security definer
as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'Not authorized';
  end if;

  return query select * from dv_referrals order by created_at desc;
end;
$$;

drop function if exists admin_update_referral(text, bigint, jsonb);
create or replace function admin_update_referral(
  p_admin_password text,
  p_referral_id bigint,
  p_updates jsonb
)
returns boolean
language plpgsql
security definer
as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'Not authorized';
  end if;

  update dv_referrals set
    status = coalesce(p_updates->>'status', status),
    assigned_agent_id = coalesce((p_updates->>'assigned_agent_id')::bigint, assigned_agent_id),
    deal_value = coalesce((p_updates->>'deal_value')::numeric, deal_value),
    commission_earned = coalesce((p_updates->>'commission_earned')::numeric, commission_earned),
    notes = coalesce(p_updates->>'notes', notes),
    updated_at = now()
  where id = p_referral_id;

  return true;
end;
$$;

grant execute on function admin_get_referrals(text) to anon, authenticated;
grant execute on function admin_update_referral(text, bigint, jsonb) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- market_config: revoke direct anon writes, add a password-gated RPC instead.
-- (Public SELECT is left untouched — every visitor's valuation needs to read
-- the current macro adjustment, that part was never the problem.)
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "update_market_config" on market_config;
drop policy if exists "market_config_update" on market_config;
drop policy if exists "allow_update_market_config" on market_config;

create or replace function admin_update_market_config(
  p_admin_password text,
  p_apt_adj numeric,
  p_villa_adj numeric,
  p_label text
)
returns boolean
language plpgsql
security definer
as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'Not authorized';
  end if;

  update market_config set
    apt_adj = p_apt_adj,
    villa_adj = p_villa_adj,
    geo_label = p_label,
    updated_at = now()
  where id = 1;

  return true;
end;
$$;

grant execute on function admin_update_market_config(text, numeric, numeric, text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- After running this, no anon PATCH policy should remain on market_config —
-- confirm with: select * from pg_policies where tablename='market_config';
-- (if a stale "anon can update" policy is still listed under a different name,
-- drop it manually before considering this migration complete.)
-- ═══════════════════════════════════════════════════════════════════════════
