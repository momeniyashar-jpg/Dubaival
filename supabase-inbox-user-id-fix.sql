-- Fixes a real, standalone bug found 2026-07-16 while debugging the WhatsApp
-- webhook: email_inbox and social_inbox were created (supabase-inbox-schema.sql)
-- with NO user_id column at all, but api/inbox.js (every ingestion path —
-- email/Gmail, Instagram, Facebook, WhatsApp) and js/inbox.js (the client
-- Inbox UI) have always assumed one exists, filtering/inserting by it. Every
-- insert into either table has been silently failing since this feature was
-- built (wrapped in an empty try/catch — api/inbox.js always returns
-- {"ok":true} to the webhook caller regardless), so the Inbox has never
-- actually stored a single message on any platform, not just WhatsApp.
--
-- This also means supabase-inbox-rls-lockdown.sql's policies (which reference
-- user_id in their USING clause) could never have been successfully applied
-- either, since the column they depend on didn't exist — so the original,
-- wide-open "USING(true)" policies from supabase-inbox-schema.sql are very
-- likely still the active ones. This migration adds the missing column AND
-- re-applies the correct owner-only policies in one shot.
--
-- Safe to run multiple times.

ALTER TABLE email_inbox  ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE social_inbox ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_email_inbox_user_id  ON email_inbox(user_id);
CREATE INDEX IF NOT EXISTS idx_social_inbox_user_id ON social_inbox(user_id);

DROP POLICY IF EXISTS "Service role full access on email_inbox"  ON email_inbox;
DROP POLICY IF EXISTS "Service role full access on social_inbox" ON social_inbox;
DROP POLICY IF EXISTS "Users read own email_inbox"    ON email_inbox;
DROP POLICY IF EXISTS "Users update own email_inbox"  ON email_inbox;
DROP POLICY IF EXISTS "Users read own social_inbox"   ON social_inbox;
DROP POLICY IF EXISTS "Users update own social_inbox" ON social_inbox;

CREATE POLICY "Users read own email_inbox" ON email_inbox
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id));

CREATE POLICY "Users update own email_inbox" ON email_inbox
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id))
  WITH CHECK (auth.uid() IS NOT NULL AND (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id));

CREATE POLICY "Users read own social_inbox" ON social_inbox
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id));

CREATE POLICY "Users update own social_inbox" ON social_inbox
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id))
  WITH CHECK (auth.uid() IS NOT NULL AND (auth.uid()::text = user_id OR auth.jwt() ->> 'email' = user_id));
