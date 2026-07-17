-- Weekly Portfolio Digest (added 2026-07-17) — a small additive column on
-- the existing user_portfolios table (supabase-user-profiles-schema.sql),
-- used purely as an idempotency guard so the weekly cron
-- (api/refresh-market-data.js?action=portfolio-digest) never double-emails
-- a user if the cron is ever manually re-triggered within the same week.
--
-- Run this once in Supabase SQL Editor, after supabase-user-profiles-schema.sql
-- and supabase-portfolio-history-schema.sql are already applied.

alter table user_portfolios
  add column if not exists last_digest_sent_at timestamptz;
