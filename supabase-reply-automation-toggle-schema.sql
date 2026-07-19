-- Per-agent, per-channel manual/automatic reply toggle (added 2026-07-19).
--
-- Closes a real gap: the user asked whether the AI could genuinely
-- auto-reply to email/WhatsApp/Instagram/Facebook messages when "automatic"
-- mode is selected, believing this manual/automatic split already existed.
-- It did not — api/inbox.js's email cron, WhatsApp webhook, and Instagram/
-- Facebook webhook all had no per-channel toggle at all; the ONLY existing
-- automation toggle in the app (CHIEFS_AUTOMATION in js/chiefs.js) governs a
-- completely different pipeline (the Co-pilot's match-drafting flow), not
-- this raw webhook-driven auto-reply system.
--
-- 4 real boolean columns on social_credentials (the existing per-agent,
-- per-platform credentials table every lookup in api/inbox.js already
-- joins on via user_id — needs no new table or sync plumbing). All default
-- true, matching this project's established automation-first convention
-- (CLAUDE.md Directive #3: default leans toward automatic, an agent must
-- deliberately switch a specific process to manual).
--
-- A null/absent value (any row that predates this migration) is ALSO
-- treated as enabled by the application code (api/inbox.js's _autoReplyOn()
-- helper: `val !== false`) — only an explicit `false` disables a channel.
--
-- Run this once in Supabase SQL Editor.

alter table social_credentials add column if not exists auto_reply_email      boolean default true;
alter table social_credentials add column if not exists auto_reply_whatsapp   boolean default true;
alter table social_credentials add column if not exists auto_reply_instagram  boolean default true;
alter table social_credentials add column if not exists auto_reply_facebook  boolean default true;
