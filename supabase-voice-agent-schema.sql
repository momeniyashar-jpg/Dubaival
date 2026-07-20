-- AI Voice Concierge (added 2026-07-19) — a live, real-time phone agent for
-- AI Chief of Staff, built after the user shared an ElevenLabs "Voice Agents
-- With Emotional Intelligence" ad and asked whether the idea fits DubaiVal.
--
-- Architecture (see CLAUDE.md work log for the full research trail):
-- ElevenLabs Conversational AI (their real, documented "ElevenAgents"
-- product) handles the actual real-time speech pipeline (STT/LLM/TTS) end
-- to end — we do NOT build our own audio streaming pipeline. Our job is:
--   1. One shared ElevenLabs Agent definition (system prompt + 3 webhook
--      tools), reused across every real estate agent's own phone number via
--      a per-call "conversation initiation" webhook that tells ElevenLabs
--      WHICH agent's call this is (see api/inbox.js action=voice-init).
--   2. A Twilio phone-number pool the OPERATOR buys/links to the shared
--      ElevenLabs Agent (one-time, manual, operator-only setup per
--      CLAUDE.md Directive #4 — never per-agent).
--   3. Real estate agents self-serve "activate" a number from the pool
--      (claim_voice_number RPC) — zero manual Twilio/ElevenLabs console
--      access for them, matching Directive #4's zero-touch principle.
--   4. Pay-per-minute billing — an agent buys a bundle of voice minutes
--      (Stripe, see api/billing.js action=voice-checkout); minutes are
--      deducted post-call from the real ElevenLabs "call ended" webhook
--      payload (duration), never estimated in advance.
--
-- Run this once in Supabase SQL Editor. Requires supabase-admin-security-fix.sql
-- (_admin_password_ok) and supabase-chiefs-schema.sql (chiefs_clients) to
-- already be applied, which they are.

-- ── Pay-per-minute credit balance ─────────────────────────────────────────
alter table user_profiles add column if not exists voice_credits integer default 0;

-- ── Per-agent voice auto-save toggle ──────────────────────────────────────
-- Mirrors the auto_reply_* columns added the same session for the text
-- reply pipeline (supabase-reply-automation-toggle-schema.sql) — same
-- automation-first default (true), same "only an explicit false disables
-- it" convention, checked server-side in the post-call webhook since a live
-- phone call has no browser/localStorage to read a toggle from.
alter table social_credentials add column if not exists voice_auto_save_extracted boolean default true;

-- ── Twilio number pool (operator-managed) ─────────────────────────────────
-- Populated by the operator via the Admin Dashboard as real UAE (or other)
-- Twilio numbers are purchased and linked to the shared ElevenLabs Agent.
-- twilio_auth_token is a real, sensitive credential — this table is
-- service-role-only (RLS enabled, zero public policies) except the one
-- narrow "an agent can see their OWN assigned number" policy below.
create table if not exists voice_agent_numbers (
  id uuid default gen_random_uuid() primary key,
  phone_number text unique not null,
  twilio_account_sid text,
  twilio_auth_token text,
  elevenlabs_phone_id text,
  assigned_agent_id text,
  assigned_agent_label text,
  status text default 'available' check (status in ('available','assigned')),
  created_at timestamptz default now()
);
create index if not exists idx_voice_numbers_agent on voice_agent_numbers(assigned_agent_id);

alter table voice_agent_numbers enable row level security;

drop policy if exists "Agent reads own assigned voice number" on voice_agent_numbers;
create policy "Agent reads own assigned voice number" on voice_agent_numbers
  for select to authenticated
  using (auth.uid()::text = assigned_agent_id);

-- ── Shared ElevenLabs Agent config (single row) ───────────────────────────
-- Service-role-only, no public policies at all — holds the one ElevenLabs
-- agent_id our server creates/updates via action=voice-admin-setup-agent.
create table if not exists voice_agent_config (
  id text primary key default 'default',
  elevenlabs_agent_id text,
  updated_at timestamptz default now()
);
insert into voice_agent_config (id) values ('default') on conflict (id) do nothing;
alter table voice_agent_config enable row level security;

-- ── Call log / billing audit trail ────────────────────────────────────────
create table if not exists voice_calls (
  id uuid default gen_random_uuid() primary key,
  agent_id text not null,
  caller_phone text,
  elevenlabs_conversation_id text unique,
  duration_seconds integer default 0,
  credits_charged integer default 0,
  transcript text,
  client_saved boolean default false,
  started_at timestamptz,
  ended_at timestamptz default now()
);
create index if not exists idx_voice_calls_agent on voice_calls(agent_id);

alter table voice_calls enable row level security;

drop policy if exists "Agent reads own voice calls" on voice_calls;
create policy "Agent reads own voice calls" on voice_calls
  for select to authenticated
  using (auth.uid()::text = agent_id);

-- ── RPCs ───────────────────────────────────────────────────────────────────

-- Atomically claims the next available pooled number for a signed-in agent,
-- or returns the one they already have if they call this again (idempotent
-- "activate" button — never claims a 2nd number for the same agent).
create or replace function claim_voice_number(p_agent_uid uuid, p_agent_label text)
returns table(phone_number text) language plpgsql security definer as $$
declare v_num text;
begin
  if p_agent_uid is null then raise exception 'Sign in required'; end if;

  select vn.phone_number into v_num from voice_agent_numbers vn
    where vn.assigned_agent_id = p_agent_uid::text and vn.status = 'assigned' limit 1;
  if v_num is not null then return query select v_num; return; end if;

  update voice_agent_numbers
    set assigned_agent_id = p_agent_uid::text, assigned_agent_label = p_agent_label, status = 'assigned'
    where id = (
      select id from voice_agent_numbers where status = 'available' order by created_at asc limit 1 for update skip locked
    )
    returning voice_agent_numbers.phone_number into v_num;

  return query select v_num;
end;
$$;

-- Releases an agent's number back to the pool (Deactivate button).
create or replace function release_voice_number(p_agent_uid uuid)
returns void language plpgsql security definer as $$
begin
  if p_agent_uid is null then raise exception 'Sign in required'; end if;
  update voice_agent_numbers
    set assigned_agent_id = null, assigned_agent_label = null, status = 'available'
    where assigned_agent_id = p_agent_uid::text;
end;
$$;

-- Reads the calling agent's own assignment + credit balance in one call
-- (used by the Chiefs Voice tab's status fetch) — SECURITY DEFINER so it can
-- join user_profiles.voice_credits without a public policy on that column.
create or replace function get_voice_status(p_agent_uid uuid)
returns table(phone_number text, voice_credits integer) language plpgsql security definer as $$
begin
  if p_agent_uid is null then raise exception 'Sign in required'; end if;
  return query
    select vn.phone_number, coalesce(up.voice_credits, 0)
    from user_profiles up
    left join voice_agent_numbers vn on vn.assigned_agent_id = p_agent_uid::text and vn.status = 'assigned'
    where up.id = p_agent_uid;
end;
$$;

-- Credit ledger — same pattern as add_whatsapp_credits/add_video_credits.
create or replace function add_voice_credits(p_user_id uuid, p_minutes integer)
returns void language plpgsql security definer as $$
begin
  update user_profiles set voice_credits = coalesce(voice_credits, 0) + p_minutes where id = p_user_id;
end;
$$;

-- Post-call deduction — always applied regardless of remaining balance
-- (the call already happened; this is post-paid billing, matching how a
-- real telephony/AI usage bill reconciles after the fact, not a
-- pre-authorization hold). A negative balance simply blocks the NEXT call
-- from being answered by the AI (checked in action=voice-init).
create or replace function consume_voice_credits(p_user_id uuid, p_minutes integer)
returns void language plpgsql security definer as $$
begin
  update user_profiles set voice_credits = coalesce(voice_credits, 0) - p_minutes where id = p_user_id;
end;
$$;

-- ── Admin RPCs (operator-only, password-gated via _admin_password_ok) ────

create or replace function admin_add_voice_number(p_admin_password text, p_phone_number text, p_twilio_account_sid text, p_twilio_auth_token text)
returns void language plpgsql security definer as $$
begin
  if not _admin_password_ok(p_admin_password) then raise exception 'Invalid admin password'; end if;
  insert into voice_agent_numbers (phone_number, twilio_account_sid, twilio_auth_token)
  values (p_phone_number, p_twilio_account_sid, p_twilio_auth_token)
  on conflict (phone_number) do update
    set twilio_account_sid = excluded.twilio_account_sid, twilio_auth_token = excluded.twilio_auth_token;
end;
$$;

create or replace function admin_list_voice_numbers(p_admin_password text)
returns table(phone_number text, assigned_agent_label text, status text, elevenlabs_phone_id text, created_at timestamptz)
language plpgsql security definer as $$
begin
  if not _admin_password_ok(p_admin_password) then raise exception 'Invalid admin password'; end if;
  return query
    select vn.phone_number, vn.assigned_agent_label, vn.status, vn.elevenlabs_phone_id, vn.created_at
    from voice_agent_numbers vn order by vn.created_at desc;
end;
$$;

create or replace function admin_get_voice_agent_id(p_admin_password text)
returns text language plpgsql security definer as $$
declare v_id text;
begin
  if not _admin_password_ok(p_admin_password) then raise exception 'Invalid admin password'; end if;
  select elevenlabs_agent_id into v_id from voice_agent_config where id = 'default';
  return v_id;
end;
$$;
