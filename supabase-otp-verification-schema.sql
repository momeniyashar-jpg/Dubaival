-- Zero-touch onboarding: OTP verification for phone + email (added 2026-07-17).
--
-- Standing directive (see CLAUDE.md "#4 CRITICAL DIRECTIVE — Zero-Touch
-- Onboarding"): a user's only job when connecting anything to DubaiVal is
-- to enter a phone number, an email, or click "Connect X" on a social
-- platform's own consent screen — never to hunt for tokens/API keys. The
-- ONLY verification mechanism allowed is a one-time code (OTP), sent via
-- email or WhatsApp. This table is the shared, reusable backing store for
-- every OTP send/verify anywhere in the app (signup phone/email
-- verification today; any future "confirm you own this contact" step
-- reuses the same table/endpoints instead of inventing a new one).
--
-- Run this once in Supabase SQL Editor.

create table if not exists otp_verifications (
  id uuid primary key default gen_random_uuid(),
  contact_type text not null check (contact_type in ('email','phone')),
  contact_value text not null,
  code_hash text not null,
  -- One-tap alternatives to typing the code, added the same day after the
  -- user asked for a true "just click Connect, zero manual steps" path:
  -- link_token_hash backs the email magic-link (click once in the inbox,
  -- no typing), button_token backs the WhatsApp "✅ This is me" quick-reply
  -- button (tap once in the chat, no typing). Either one, when consumed,
  -- verifies the SAME row a typed code would have — three redundant paths
  -- to the same result, so whichever is easiest for a given user just works.
  link_token_hash text,
  button_token text,
  purpose text not null default 'signup',
  attempts int not null default 0,
  verified_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists otp_verifications_lookup_idx
  on otp_verifications (contact_type, contact_value, purpose, created_at desc);

-- Service-role only — a code is generated, hashed, and checked entirely
-- server-side (api/inbox.js send-otp / verify-otp). No client (anon or
-- authenticated) ever reads or writes this table directly, so there is no
-- public RLS policy to add — RLS stays enabled with zero policies, which
-- Postgres/PostgREST already treats as "deny all except service_role."
alter table otp_verifications enable row level security;

-- Housekeeping: nothing prunes this table automatically yet. Rows are
-- small and short-lived (expires_at is typically +10 minutes), so this is
-- not urgent, but a future session could add a daily prune of rows older
-- than e.g. 7 days the same way pruneOldMarketSnapshots() already does for
-- knowledge_base — flagged here rather than built speculatively now.

-- Tracks whether the phone number on a user's own profile has actually been
-- confirmed via the WhatsApp OTP flow above (js/auth.js Sign Up). The
-- `phone` column on user_profiles already existed; this just adds the
-- verification flag so the app can tell "typed in" apart from "confirmed
-- theirs" — never trust an unverified phone for anything security-sensitive.
alter table user_profiles add column if not exists phone_verified boolean not null default false;
