-- Fixes a critical, real access-control bug found 2026-07-16, while a user
-- asked whether one registered user could see another user's Social Setup
-- data (Instagram/Facebook/LinkedIn/Twitter/YouTube/TikTok/WhatsApp Business
-- API tokens).
--
-- Root cause: supabase-autopost-schema.sql created these 3 policies with
-- FOR ALL USING(true) WITH CHECK(true) and NO "TO service_role" clause.
-- In Postgres/Supabase, a policy with no TO clause applies to PUBLIC — every
-- role, including the anonymous "anon" role — not just the service role its
-- name implied. Combined with js/chat.js's client code always calling these
-- tables using only the public anon key (embedded in the site's own JS,
-- visible to anyone) rather than the signed-in user's own access token, this
-- meant ANY caller on the internet — logged in or not, not just other
-- registered DubAIVal users — could read or overwrite ANY user's row via a
-- direct REST call, just by knowing or guessing their account email (the
-- user_id column stores email, not a random ID).
--
-- Fix: drop the public policies and require a real, cryptographically-signed
-- Supabase JWT whose email claim (auth.email()) matches the row's user_id.
-- The server-side cron job (api/auto-post.js, api/sync-engagement.js) is
-- unaffected — it already authenticates with SUPABASE_SERVICE_ROLE_KEY,
-- which always bypasses RLS regardless of policy. js/chat.js's 7 call sites
-- across social_credentials/scheduled_posts/post_engagement were updated in
-- the same commit to send the user's real access token instead of the anon
-- key, via a new shared _socialCredHeaders() helper.

DROP POLICY IF EXISTS "Service role full access on social_credentials" ON social_credentials;
DROP POLICY IF EXISTS "Service role full access on scheduled_posts" ON scheduled_posts;
DROP POLICY IF EXISTS "Service role full access on post_engagement" ON post_engagement;

CREATE POLICY "Users can only access their own social_credentials"
  ON social_credentials FOR ALL
  TO authenticated
  USING (auth.email() = user_id)
  WITH CHECK (auth.email() = user_id);

CREATE POLICY "Users can only access their own scheduled_posts"
  ON scheduled_posts FOR ALL
  TO authenticated
  USING (auth.email() = user_id)
  WITH CHECK (auth.email() = user_id);

CREATE POLICY "Users can only access their own post_engagement"
  ON post_engagement FOR ALL
  TO authenticated
  USING (auth.email() = user_id)
  WITH CHECK (auth.email() = user_id);
