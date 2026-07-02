-- OAuth additions: Gmail columns on social_credentials + user_id on inbox tables

-- 1. Add Gmail columns to social_credentials (if not exist)
ALTER TABLE social_credentials ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT;
ALTER TABLE social_credentials ADD COLUMN IF NOT EXISTS gmail_email TEXT;

-- 2. Add user_id to email_inbox
ALTER TABLE email_inbox ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE email_inbox ADD COLUMN IF NOT EXISTS thread_id TEXT;
CREATE INDEX IF NOT EXISTS email_inbox_user_id_idx ON email_inbox(user_id);

-- 3. Add user_id to social_inbox
ALTER TABLE social_inbox ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE INDEX IF NOT EXISTS social_inbox_user_id_idx ON social_inbox(user_id);
