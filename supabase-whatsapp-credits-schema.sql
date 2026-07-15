-- Pay-per-use WhatsApp Business API credits.
-- Run once in Supabase Dashboard -> SQL Editor. Requires
-- supabase-video-credits-schema.sql (Whisper) to already be applied, since
-- this reuses its shared stripe_events_processed idempotency table.
--
-- Why a separate credit pool: WhatsApp Business API is billed by Meta per
-- 24-hour CONVERSATION WINDOW per contact, a real, ongoing per-use cost
-- distinct from every other pay-per-use feature in this app (Kling/Runway/
-- OpenAI Whisper are one-off API calls with no per-message surcharge from a
-- 3rd party). Within one open 24h window with a given contact, Meta lets
-- unlimited messages flow back and forth for free — billing per MESSAGE
-- (an earlier version of this file) would have wildly overcharged an agent
-- who exchanges many messages with the same client in one day, so 1 credit
-- = 1 NEWLY OPENED 24h conversation window with one contact, matching
-- Meta's real billing unit as closely as this app can verify without live
-- WhatsApp Business API access yet.

alter table user_profiles add column if not exists whatsapp_credits integer not null default 0;

-- WhatsApp Business API connection details, alongside the existing
-- Instagram/Facebook/LinkedIn/etc. columns already on this table.
alter table social_credentials add column if not exists whatsapp_token text;
alter table social_credentials add column if not exists whatsapp_phone_id text;
alter table social_credentials add column if not exists whatsapp_waba_id text;

-- Tracks the currently-open 24h conversation window per (agent, contact)
-- pair. As long as window_expires_at is in the future, that contact's
-- messages are already paid for — no further credit is consumed until it
-- expires and a new window has to be opened.
create table if not exists whatsapp_conversation_windows (
  user_id uuid not null references auth.users on delete cascade,
  contact_phone text not null,
  window_expires_at timestamptz not null,
  primary key (user_id, contact_phone)
);

-- Atomically add credits after a successful one-time payment.
create or replace function add_whatsapp_credits(p_user_id uuid, p_amount integer)
returns void
language sql
security definer
as $$
  update user_profiles set whatsapp_credits = whatsapp_credits + p_amount where id = p_user_id;
$$;

-- Kept for backward compatibility with any direct caller, but
-- ensure_whatsapp_window() below is the real entry point every send/reply
-- now goes through — it wraps this with the 24h-window check so a credit
-- is only ever spent once per contact per day, not once per message.
create or replace function consume_whatsapp_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_remaining integer;
begin
  update user_profiles
  set whatsapp_credits = whatsapp_credits - 1
  where id = p_user_id and whatsapp_credits > 0
  returning whatsapp_credits into v_remaining;
  return v_remaining is not null;
end;
$$;

-- The real gate every WhatsApp send/auto-reply calls before doing anything.
-- Returns (allowed, credit_consumed):
--   - If this contact already has an active (unexpired) window: allowed=true,
--     credit_consumed=false — message proceeds for free, already paid for.
--   - If no active window and a credit was available: consumes exactly 1
--     credit, opens a fresh 24h window, allowed=true, credit_consumed=true.
--   - If no active window and no credit is available: allowed=false,
--     credit_consumed=false — nothing is charged, caller must not send.
-- credit_consumed lets the caller know whether to refund on a downstream
-- send failure (refund_whatsapp_window below) — reusing an existing window
-- never needs a refund since nothing new was spent.
create or replace function ensure_whatsapp_window(p_user_id uuid, p_contact_phone text)
returns table(allowed boolean, credit_consumed boolean)
language plpgsql
security definer
as $$
declare
  v_expires timestamptz;
  v_consumed boolean;
begin
  select window_expires_at into v_expires
  from whatsapp_conversation_windows
  where user_id = p_user_id and contact_phone = p_contact_phone;

  if v_expires is not null and v_expires > now() then
    allowed := true;
    credit_consumed := false;
    return next;
    return;
  end if;

  v_consumed := consume_whatsapp_credit(p_user_id);
  if not v_consumed then
    allowed := false;
    credit_consumed := false;
    return next;
    return;
  end if;

  insert into whatsapp_conversation_windows (user_id, contact_phone, window_expires_at)
  values (p_user_id, p_contact_phone, now() + interval '24 hours')
  on conflict (user_id, contact_phone)
  do update set window_expires_at = excluded.window_expires_at;

  allowed := true;
  credit_consumed := true;
  return next;
end;
$$;

-- Called only when ensure_whatsapp_window() reported credit_consumed=true
-- AND the actual WhatsApp send that followed it failed — refunds the
-- credit and removes the just-opened window, since no message was actually
-- delivered and the window was never really "opened" from Meta's side.
create or replace function refund_whatsapp_window(p_user_id uuid, p_contact_phone text)
returns void
language plpgsql
security definer
as $$
begin
  perform add_whatsapp_credits(p_user_id, 1);
  delete from whatsapp_conversation_windows
  where user_id = p_user_id and contact_phone = p_contact_phone;
end;
$$;
