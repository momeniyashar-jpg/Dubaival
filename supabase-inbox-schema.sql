-- Email Inbox table
CREATE TABLE IF NOT EXISTS email_inbox (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'new', -- new | read | agent_replied | ai_replied
  ai_reply TEXT,
  agent_reply TEXT,
  replied_at TIMESTAMPTZ,
  message_id TEXT UNIQUE
);
ALTER TABLE email_inbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on email_inbox" ON email_inbox FOR ALL USING (true);

-- Social Inbox table (Instagram DM, Facebook DM/comments, LinkedIn)
CREATE TABLE IF NOT EXISTS social_inbox (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,          -- instagram | facebook | linkedin
  event_type TEXT NOT NULL,        -- dm | comment | reply
  sender_id TEXT,
  sender_name TEXT,
  thread_id TEXT,
  message_id TEXT UNIQUE,
  message_text TEXT,
  media_url TEXT,
  post_id TEXT,                    -- for comment replies
  received_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'new',       -- new | replied
  ai_reply TEXT,
  replied_at TIMESTAMPTZ,
  raw_payload JSONB
);
ALTER TABLE social_inbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on social_inbox" ON social_inbox FOR ALL USING (true);
