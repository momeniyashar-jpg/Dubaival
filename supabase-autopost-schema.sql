-- DubAIVal Auto-Post System — Supabase Schema
-- Tables for server-side 24/7 auto-posting via Vercel Cron

-- 1) Scheduled Posts (calendar events synced from client)
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  caption TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'all',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL DEFAULT '10:00',
  pillar TEXT DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'scheduled',
  image_url TEXT,
  results JSONB,
  published_at TIMESTAMPTZ,
  error_log TEXT,
  retry_count INT DEFAULT 0,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_due
  ON scheduled_posts (scheduled_date, scheduled_time)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user
  ON scheduled_posts (user_id);

-- 2) Social Credentials (tokens synced from client for server-side publishing)
CREATE TABLE IF NOT EXISTS social_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE DEFAULT 'default',
  ig_token TEXT,
  ig_id TEXT,
  fb_id TEXT,
  linkedin_token TEXT,
  linkedin_urn TEXT,
  twitter_consumer_key TEXT,
  twitter_consumer_secret TEXT,
  twitter_access_token TEXT,
  twitter_access_secret TEXT,
  youtube_refresh TEXT,
  youtube_client_id TEXT,
  youtube_client_secret TEXT,
  pexels_key TEXT,
  tiktok_token TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Post Engagement Tracking (server-side engagement sync)
CREATE TABLE IF NOT EXISTS post_engagement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  platform TEXT NOT NULL,
  post_id TEXT NOT NULL,
  media_id TEXT,
  caption_preview TEXT,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  impressions INT DEFAULT 0,
  reach INT DEFAULT 0,
  saves INT DEFAULT 0,
  shares INT DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  permalink TEXT,
  scheduled_post_id UUID REFERENCES scheduled_posts(id),
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_engagement_user
  ON post_engagement (user_id);

CREATE INDEX IF NOT EXISTS idx_post_engagement_platform
  ON post_engagement (platform, post_id);

-- RLS Policies
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on scheduled_posts"
  ON scheduled_posts FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on social_credentials"
  ON social_credentials FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on post_engagement"
  ON post_engagement FOR ALL
  USING (true) WITH CHECK (true);
