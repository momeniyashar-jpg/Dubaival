-- Pay-per-video AI processing (real Whisper speech-to-text subtitles).
-- Run once in Supabase Dashboard -> SQL Editor. Requires
-- supabase-subscriptions-schema.sql to already be applied (user_profiles
-- table, Stripe columns).
--
-- Deliberately a ONE-TIME-PAYMENT credit model, not a subscription: the
-- site owner explicitly asked for per-video pricing ("نه اینکه ماهانه
-- خرید کنه، برای هر ویدئو پرداخت کنه") so a user only pays for the videos
-- they actually process, separate from the DubaiVal Pro monthly plan.

alter table user_profiles add column if not exists video_credits integer not null default 0;

-- Stripe webhook idempotency guard — a webhook delivery can be retried by
-- Stripe (network blip, slow response, etc.); crediting video_credits is
-- NOT naturally idempotent like flipping is_pro to the same value twice,
-- so every processed event id is recorded here first and any repeat
-- delivery is skipped. Applies to both the existing Pro-subscription
-- webhook path and the new video-credit path in api/billing.js.
create table if not exists stripe_events_processed (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

-- Atomically add credits after a successful one-time payment. SECURITY
-- DEFINER so it can be called via the service-role key from api/billing.js
-- without needing a broader RLS write policy on user_profiles.
create or replace function add_video_credits(p_user_id uuid, p_amount integer)
returns void
language sql
security definer
as $$
  update user_profiles set video_credits = video_credits + p_amount where id = p_user_id;
$$;

-- Atomically consume exactly one credit right before an expensive paid
-- operation (Whisper transcription) is attempted. Returns false (and
-- changes nothing) if the user has no credit left, so the caller can
-- refuse the request instead of running up the developer's own API bill.
create or replace function consume_video_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_remaining integer;
begin
  update user_profiles
  set video_credits = video_credits - 1
  where id = p_user_id and video_credits > 0
  returning video_credits into v_remaining;
  return v_remaining is not null;
end;
$$;
