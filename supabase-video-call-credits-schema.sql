-- AI Chief of Staff — pay-per-use Video Call / Screen-Share (added 2026-08-05,
-- Phase 4 of the GenieMap gap-closing plan). Lets an agent start a real live
-- video call with a client directly inside DubaiVal, closing GenieMap's own
-- "video call/screen-share during a viewing or negotiation" feature gap.
--
-- Vendor: Daily.co (see CLAUDE.md work log for the full research trail — a
-- background research pass compared Daily.co, Whereby Embedded, and Twilio
-- Video; Daily.co was chosen for its true zero-commitment pay-as-you-go
-- pricing with no forced monthly base fee, matching this project's existing
-- "buy credits, never a subscription" product philosophy exactly, plus real
-- server-side cloud recording as a future option).
--
-- Architecture (mirrors supabase-voice-agent-schema.sql's already-proven
-- post-paid billing shape, just per-minute video instead of per-minute
-- phone): an agent buys a bundle of call-minutes (Stripe, one-time payment,
-- see api/billing.js action=video-call-checkout). Minutes are deducted AFTER
-- each call from the REAL duration our own server confirms via Daily.co's
-- own REST Meetings API (never trusted from the client, never estimated in
-- advance) — see api/proxy-video.js action=call-end. A room can only be
-- CREATED while the agent has a positive balance (checked at
-- action=call-create-room); running out of credit mid-call never cuts the
-- call short, it only blocks the NEXT one — matching the AI Voice
-- Concierge's exact "credits are checked at call-start, not mid-call" rule.
--
-- Run this once in Supabase SQL Editor. Requires supabase-admin-security-fix.sql
-- (_admin_password_ok, used nowhere in this file directly but kept as the
-- same baseline dependency every other Chiefs-adjacent migration assumes)
-- and supabase-chiefs-schema.sql (chiefs_clients — video_calls.client_id
-- is a soft reference, not a hard FK, matching how chiefs_matches already
-- treats client_id as free-form to avoid an orphaning risk if a client
-- record is later deleted) to already be applied, which they are.

-- ── Pay-per-minute credit balance ─────────────────────────────────────────
alter table user_profiles add column if not exists video_call_credits integer default 0;

-- ── Call log / billing audit trail ────────────────────────────────────────
create table if not exists video_calls (
  id uuid default gen_random_uuid() primary key,
  agent_id text not null,
  daily_room_name text unique not null,
  client_name text,
  client_phone text,
  duration_seconds integer default 0,
  credits_charged integer default 0,
  billed_via text default 'call-end' check (billed_via in ('call-end','webhook')),
  started_at timestamptz,
  ended_at timestamptz default now()
);
create index if not exists idx_video_calls_agent on video_calls(agent_id);

alter table video_calls enable row level security;

drop policy if exists "Agent reads own video calls" on video_calls;
create policy "Agent reads own video calls" on video_calls
  for select to authenticated
  using (auth.uid()::text = agent_id);

-- ── RPCs ───────────────────────────────────────────────────────────────────

-- Credit ledger — same pattern as add_voice_credits/add_whatsapp_credits.
create or replace function add_video_call_credits(p_user_id uuid, p_minutes integer)
returns void language plpgsql security definer as $$
begin
  update user_profiles set video_call_credits = coalesce(video_call_credits, 0) + p_minutes where id = p_user_id;
end;
$$;

-- Post-call deduction — always applied regardless of remaining balance (the
-- call already happened; post-paid, matching how a real usage bill
-- reconciles after the fact, not a pre-authorization hold). A negative
-- balance simply blocks the NEXT room from being created (checked in
-- action=call-create-room), never interrupts a call already in progress.
create or replace function consume_video_call_credits(p_user_id uuid, p_minutes integer)
returns void language plpgsql security definer as $$
begin
  update user_profiles set video_call_credits = coalesce(video_call_credits, 0) - p_minutes where id = p_user_id;
end;
$$;

-- Reads the calling agent's own credit balance + recent call history in one
-- call (used by the Chiefs Video Call tab's status fetch) — SECURITY DEFINER
-- so it can join user_profiles.video_call_credits without a public policy on
-- that column, same reasoning as get_voice_status.
create or replace function get_video_call_status(p_agent_uid uuid)
returns table(video_call_credits integer) language plpgsql security definer as $$
begin
  if p_agent_uid is null then raise exception 'Sign in required'; end if;
  return query
    select coalesce(up.video_call_credits, 0)
    from user_profiles up
    where up.id = p_agent_uid;
end;
$$;

-- Idempotent call logger — used by BOTH action=call-end (the primary,
-- client-triggered path, billed_via='call-end') and action=call-webhook (a
-- defensive fallback for the case where the agent's tab closes before
-- call-end ever fires, billed_via='webhook'). The unique constraint on
-- daily_room_name means whichever path logs a given room FIRST wins — a
-- later webhook firing for a room that call-end already billed is a no-op,
-- never a double-charge.
create or replace function log_video_call(
  p_agent_id text, p_room_name text, p_client_name text, p_client_phone text,
  p_duration_seconds integer, p_credits_charged integer, p_billed_via text,
  p_started_at timestamptz
)
returns boolean language plpgsql security definer as $$
declare v_inserted boolean := false;
begin
  insert into video_calls (agent_id, daily_room_name, client_name, client_phone, duration_seconds, credits_charged, billed_via, started_at)
  values (p_agent_id, p_room_name, p_client_name, p_client_phone, p_duration_seconds, p_credits_charged, p_billed_via, p_started_at)
  on conflict (daily_room_name) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted and p_credits_charged > 0 then
    perform consume_video_call_credits(p_agent_id::uuid, p_credits_charged);
  end if;
  return v_inserted;
end;
$$;
