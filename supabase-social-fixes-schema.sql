-- =============================================================================
-- DubaiVal PropTech Video Platform — fixes + Agent Rating/Review system
-- Run this once in Supabase Dashboard -> SQL Editor, AFTER supabase-social-schema.sql
-- =============================================================================
-- Fixes 3 real, verified bugs found in a pre-launch audit of js/social.js:
--   1. agent_profiles UPDATE/DELETE RLS checks current_setting(
--      'request.header.x-user-id', true) but the client never sent that
--      header — every profile edit silently matched zero rows (PostgREST
--      returns 200 with an empty array, not an error), while the UI still
--      showed "Profile updated!". Fixed client-side in js/social.js
--      (_socialHeaders() now sends x-user-id) — this migration is required
--      for that fix to actually take effect against real RLS policies.
--   2. follower_count was read/displayed/sorted-by everywhere but never
--      written anywhere — permanently 0 for every agent. Fixed with a real
--      trigger instead of a client-computed PATCH (avoids the same
--      non-atomic race condition already present in the like/view counters).
--   3. video_count was updated client-side with a read-then-PATCH pattern
--      (a genuine race condition under concurrent posts/deletes) — replaced
--      with the same trigger approach as follower_count for consistency.
-- Also closes a real security gap: agent_videos UPDATE/DELETE RLS was
-- `using (true))` — any anonymous caller could edit or delete ANY agent's
-- video directly via REST, not just their own. Tightened to owner-only,
-- with two new SECURITY DEFINER RPCs (increment_video_views,
-- toggle_video_like) so ordinary visitor engagement (views/likes) keeps
-- working under the tightened policy without needing to be the owner.
-- Adds the agent rating/review system requested: viewers can leave a
-- 1-5 star rating + optional comment on an agent (one per browser per
-- agent, enforced by a unique constraint) after watching their videos;
-- agent_profiles.rating/review_count are kept as real, persisted,
-- trigger-computed aggregates — no more permanently-decorative "N/A".
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. New column: review_count (rating already existed but was never written)
-- -----------------------------------------------------------------------------
alter table agent_profiles add column if not exists review_count integer default 0;

-- -----------------------------------------------------------------------------
-- 2. Agent Reviews — real visitor ratings/comments, one per browser per agent
-- -----------------------------------------------------------------------------
create table if not exists agent_reviews (
  id          bigint primary key generated always as identity,
  agent_id    bigint not null references agent_profiles(id) on delete cascade,
  video_id    bigint references agent_videos(id) on delete set null,
  reviewer_id text not null,                      -- same per-browser anon id as likes/follows (_socialUserId())
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique(agent_id, reviewer_id)
);
create index if not exists idx_agent_reviews_agent on agent_reviews(agent_id);

alter table agent_reviews enable row level security;
drop policy if exists "anon_read_agent_reviews" on agent_reviews;
create policy "anon_read_agent_reviews" on agent_reviews for select using (true);
drop policy if exists "anon_insert_agent_reviews" on agent_reviews;
create policy "anon_insert_agent_reviews" on agent_reviews for insert with check (
  reviewer_id = current_setting('request.header.x-user-id', true) and length(trim(reviewer_id)) > 0
);
-- No update/delete policy for anon — reviews are immutable once posted
-- (simplest, abuse-resistant design for a beta launch).

-- -----------------------------------------------------------------------------
-- 3. Trigger: keep agent_profiles.rating / review_count as a real aggregate
-- -----------------------------------------------------------------------------
create or replace function _dv_update_agent_rating() returns trigger as $$
declare
  target_agent bigint := coalesce(new.agent_id, old.agent_id);
begin
  update agent_profiles set
    rating = coalesce((select round(avg(rating)::numeric, 2) from agent_reviews where agent_id = target_agent), 0),
    review_count = (select count(*) from agent_reviews where agent_id = target_agent)
  where id = target_agent;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_agent_reviews_rating on agent_reviews;
create trigger trg_agent_reviews_rating
  after insert or update or delete on agent_reviews
  for each row execute function _dv_update_agent_rating();

-- -----------------------------------------------------------------------------
-- 4. Trigger: keep agent_profiles.follower_count as a real, atomic aggregate
-- -----------------------------------------------------------------------------
create or replace function _dv_update_agent_follower_count() returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update agent_profiles set follower_count = follower_count + 1 where id = new.agent_id;
  elsif (tg_op = 'DELETE') then
    update agent_profiles set follower_count = greatest(0, follower_count - 1) where id = old.agent_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_agent_follows_count on agent_follows;
create trigger trg_agent_follows_count
  after insert or delete on agent_follows
  for each row execute function _dv_update_agent_follower_count();

-- -----------------------------------------------------------------------------
-- 5. Trigger: keep agent_profiles.video_count atomic (replaces the client-side
--    read-then-PATCH in js/social.js's _postVideo/_deleteVideo)
-- -----------------------------------------------------------------------------
create or replace function _dv_update_agent_video_count() returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update agent_profiles set video_count = video_count + 1 where id = new.agent_id;
  elsif (tg_op = 'DELETE') then
    update agent_profiles set video_count = greatest(0, video_count - 1) where id = old.agent_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_agent_videos_count on agent_videos;
create trigger trg_agent_videos_count
  after insert or delete on agent_videos
  for each row execute function _dv_update_agent_video_count();

-- -----------------------------------------------------------------------------
-- 6. RPCs for visitor engagement (views/likes) — SECURITY DEFINER so ordinary
--    visitors can still record a view/like after agent_videos UPDATE is
--    tightened to owner-only below.
-- -----------------------------------------------------------------------------
create or replace function increment_video_views(p_video_id bigint) returns void as $$
begin
  update agent_videos set views = views + 1 where id = p_video_id;
end;
$$ language plpgsql security definer;

create or replace function toggle_video_like(p_video_id bigint, p_user_id text) returns boolean as $$
declare
  already_liked boolean;
begin
  select exists(select 1 from video_likes where video_id = p_video_id and user_id = p_user_id) into already_liked;
  if already_liked then
    delete from video_likes where video_id = p_video_id and user_id = p_user_id;
    update agent_videos set likes = greatest(0, likes - 1) where id = p_video_id;
    return false;
  else
    insert into video_likes(video_id, user_id) values (p_video_id, p_user_id);
    update agent_videos set likes = likes + 1 where id = p_video_id;
    return true;
  end if;
end;
$$ language plpgsql security definer;

-- -----------------------------------------------------------------------------
-- 7. Close the real security gap: agent_videos UPDATE/DELETE was `using (true)`
--    — any anonymous caller could edit/delete ANY agent's video directly via
--    REST. Tightened to owner-only; visitor views/likes now go through the
--    RPCs above instead of a direct table PATCH.
-- -----------------------------------------------------------------------------
drop policy if exists "anon_update_agent_videos" on agent_videos;
create policy "anon_update_own_agent_videos" on agent_videos for update using (
  agent_id in (select id from agent_profiles where user_id = current_setting('request.header.x-user-id', true))
);
drop policy if exists "anon_delete_agent_videos" on agent_videos;
create policy "anon_delete_own_agent_videos" on agent_videos for delete using (
  agent_id in (select id from agent_profiles where user_id = current_setting('request.header.x-user-id', true))
);
