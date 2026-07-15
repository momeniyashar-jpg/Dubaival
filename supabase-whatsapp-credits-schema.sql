-- Pay-per-use WhatsApp Business API credits.
-- Run once in Supabase Dashboard -> SQL Editor. Requires
-- supabase-video-credits-schema.sql (Whisper) to already be applied, since
-- this reuses its shared stripe_events_processed idempotency table.
--
-- Why a separate credit pool: WhatsApp Business API is billed by Meta per
-- 24-hour "conversation" window, a real, ongoing per-use cost distinct from
-- every other pay-per-use feature in this app (Kling/Runway/OpenAI Whisper
-- are one-off API calls with no per-message surcharge from a 3rd party).
-- Modeled here as 1 credit = 1 outbound send OR 1 inbound auto-reply
-- (a deliberate simplification of Meta's real 24h-conversation-window
-- billing, chosen since we cannot test the exact conversation-window
-- boundary ourselves before going live — errs toward charging slightly
-- more credits than Meta's real cost in a multi-message exchange, never
-- fewer, so the business never loses money on this feature).

alter table user_profiles add column if not exists whatsapp_credits integer not null default 0;

-- WhatsApp Business API connection details, alongside the existing
-- Instagram/Facebook/LinkedIn/etc. columns already on this table.
alter table social_credentials add column if not exists whatsapp_token text;
alter table social_credentials add column if not exists whatsapp_phone_id text;
alter table social_credentials add column if not exists whatsapp_waba_id text;

-- Atomically add credits after a successful one-time payment.
create or replace function add_whatsapp_credits(p_user_id uuid, p_amount integer)
returns void
language sql
security definer
as $$
  update user_profiles set whatsapp_credits = whatsapp_credits + p_amount where id = p_user_id;
$$;

-- Atomically consume exactly one credit right before an outbound WhatsApp
-- send (or an inbound-message auto-reply) is attempted. Returns false (and
-- changes nothing) if the user has no credit left.
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
