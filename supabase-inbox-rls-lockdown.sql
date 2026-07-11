-- ═══════════════════════════════════════════════════════════════════════════
-- INBOX RLS LOCKDOWN (2026-07-11)
-- ═══════════════════════════════════════════════════════════════════════════
-- email_inbox and social_inbox both shipped with:
--   CREATE POLICY "Service role full access on ..." ... FOR ALL USING (true)
-- with NO "TO <role>" clause. In Postgres/Supabase, a policy with no TO
-- clause applies to every role — anon and authenticated included — not just
-- the service role the name implies. That means any anon API caller could
-- read (and write) every agent's private email + Instagram/Facebook DM
-- threads, including client names, phone numbers, and message content.
--
-- Fix: drop the wide-open policies. Reads are scoped to the requesting
-- user's own rows (matched against auth.uid() or their JWT email, since
-- `user_id` was populated using either a Supabase Auth UUID or an email
-- string depending on login method — see js/chat.js:_getPostUserId()).
-- Inserts/webhook ingestion continue to happen exclusively server-side via
-- the service-role key (api/inbox.js), which bypasses RLS entirely — so no
-- anon/authenticated INSERT policy is created at all.
--
-- Run this in Supabase Dashboard -> SQL Editor. Safe to re-run (idempotent).
-- ═══════════════════════════════════════════════════════════════════════════

-- email_inbox ----------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access on email_inbox" ON email_inbox;

CREATE POLICY "Users read own email_inbox" ON email_inbox
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id)
  );

CREATE POLICY "Users update own email_inbox" ON email_inbox
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id)
  );

-- social_inbox -----------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access on social_inbox" ON social_inbox;

CREATE POLICY "Users read own social_inbox" ON social_inbox
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id)
  );

CREATE POLICY "Users update own social_inbox" ON social_inbox
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id)
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id)
  );
