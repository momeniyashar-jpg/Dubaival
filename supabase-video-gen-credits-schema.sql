-- Pay-per-video AI VIDEO GENERATION credits (Kling/Runway/HeyGen/D-ID/etc).
-- Run once in Supabase Dashboard -> SQL Editor. Requires
-- supabase-video-credits-schema.sql (Whisper subtitle credits) to already
-- be applied, since this reuses its stripe_events_processed idempotency
-- table.
--
-- Deliberately a SEPARATE credit pool from video_credits (Whisper
-- transcription) since the two are different products at different price
-- points ($4.99 to generate a video vs $2.99 to add real subtitles to one
-- already-recorded video) -- a user should be able to buy one without the
-- other implicitly being spent.
--
-- Every signed-in user already gets 3 free AI video generations per
-- calendar month (see FREE_VIDEO_GENERATIONS_PER_MONTH in
-- api/proxy-video.js) -- these credits are consumed only once that free
-- quota is used up in a given month, so this is additive on top of the
-- free tier, not a replacement for it.

alter table user_profiles add column if not exists video_gen_credits integer not null default 0;

-- Atomically add credits after a successful one-time payment.
create or replace function add_video_gen_credits(p_user_id uuid, p_amount integer)
returns void
language sql
security definer
as $$
  update user_profiles set video_gen_credits = video_gen_credits + p_amount where id = p_user_id;
$$;

-- Atomically consume exactly one credit right before an expensive paid
-- video-generation call is attempted. Returns false (and changes nothing)
-- if the user has no credit left.
create or replace function consume_video_gen_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_remaining integer;
begin
  update user_profiles
  set video_gen_credits = video_gen_credits - 1
  where id = p_user_id and video_gen_credits > 0
  returning video_gen_credits into v_remaining;
  return v_remaining is not null;
end;
$$;
