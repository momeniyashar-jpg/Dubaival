-- Ad conversion feedback loop for AI Chief of Staff (added 2026-07-17).
--
-- Closes a real gap the user pointed out after seeing competitor products
-- (YCloud) that report WhatsApp conversions back to Meta so ad targeting
-- gets smarter. When someone clicks "Send Message" on a Facebook/Instagram
-- ad, WhatsApp's own incoming-message webhook payload includes a
-- "referral" object (source_id, source_url, ctwa_clid) identifying which ad
-- started the conversation — ctwa_clid is the specific token Meta's
-- Conversions API needs to attribute a later conversion back to that ad.
-- This was always present in the raw webhook payload (already stored as
-- raw_payload text) but never extracted into its own column or acted on.
--
-- Run this once in Supabase SQL Editor.

-- Raw ad-referral object captured from the WhatsApp webhook, when present
-- (null for ordinary, non-ad-originated conversations).
alter table social_inbox add column if not exists ad_referral jsonb;

-- Carried forward onto the Client Memory Bank record when a client is
-- saved from an ad-attributed WhatsApp conversation, so the "real
-- conversion" event (see js/chiefs.js chiefsSaveClient) can be reported
-- back to Meta with the correct ctwa_clid at save time.
alter table chiefs_clients add column if not exists ad_referral jsonb;

-- Per-agent Meta Ads Conversions API credentials — same table every other
-- platform credential in this project already lives in (js/chat.js Social
-- Setup), so this needs no new sync/push/pull plumbing.
alter table social_credentials add column if not exists meta_pixel_id text;
alter table social_credentials add column if not exists meta_capi_token text;
