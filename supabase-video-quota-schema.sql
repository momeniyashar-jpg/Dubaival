-- ═══════════════════════════════════════════════════════════════════════════
-- AI VIDEO GENERATION QUOTA LOG (2026-07-11)
-- ═══════════════════════════════════════════════════════════════════════════
-- Tracks how many paid AI-engine video generations (Kling/Runway/Luma/
-- Minimax/Pika/HeyGen/D-ID) each signed-in user has triggered, so a free
-- monthly cap can be enforced server-side in api/proxy-video.js. Without
-- this, every generation any end-user makes is billed directly to the
-- developer's own API keys with no limit at all.
--
-- Only the server (using the service-role key) ever reads or writes this
-- table — no anon access is granted at all.
--
-- Run this in Supabase Dashboard → SQL Editor. Safe to re-run (idempotent).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS video_gen_log (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL,
  engine     text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_gen_log_user_month_idx ON video_gen_log(user_id, created_at);

ALTER TABLE video_gen_log ENABLE ROW LEVEL SECURITY;
-- No policies created — RLS with zero policies denies all anon/authenticated
-- access by default. The server bypasses RLS entirely via the service-role key.
