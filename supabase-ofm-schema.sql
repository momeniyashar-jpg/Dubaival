-- Off-Market Private Exchange (OFM) Schema
-- Run this in Supabase Dashboard → SQL Editor

-- Enable UUID extension (already enabled if using Supabase defaults)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: ofm_listings
-- Hidden off-market property listings. Never publicly browsable.
-- ============================================================
CREATE TABLE IF NOT EXISTS ofm_listings (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lister_token    text NOT NULL,
  lister_type     text NOT NULL CHECK (lister_type IN ('owner','poa','management')),
  doc1_base64     text,           -- Title Deed / POA Agreement / Management Contract
  doc2_base64     text,           -- Emirates ID/Passport / POA holder ID / RERA Card
  phone           text NOT NULL,
  area            text NOT NULL,
  building        text,
  prop_type       text DEFAULT 'apartment',
  beds            text,
  size_sqft       float,
  floor_num       text,
  view_type       text,
  furnished       text DEFAULT 'Unfurnished',
  purpose         text DEFAULT 'sale',
  asking_price    bigint,
  notes           text,
  dv_fair_price   bigint,
  dv_psf          float,
  dv_verdict      text,
  dv_confidence   int,
  dv_signal       text,
  doc_verified    boolean DEFAULT false,
  active          boolean DEFAULT true,
  match_count     int DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ofm_listings_token_idx ON ofm_listings(lister_token);
CREATE INDEX IF NOT EXISTS ofm_listings_area_idx  ON ofm_listings(area);
CREATE INDEX IF NOT EXISTS ofm_listings_active_idx ON ofm_listings(active);

-- RLS: anon can read limited columns for matching; full row only via lister_token filter
ALTER TABLE ofm_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ofm_listings_anon_read ON ofm_listings
  FOR SELECT TO anon USING (active = true);
CREATE POLICY ofm_listings_anon_insert ON ofm_listings
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY ofm_listings_anon_update ON ofm_listings
  FOR UPDATE TO anon USING (true);

-- ============================================================
-- TABLE: ofm_requests
-- Buyer/agent requirements. Visible to listers for matching.
-- ============================================================
CREATE TABLE IF NOT EXISTS ofm_requests (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_token  text NOT NULL,
  requester_type   text NOT NULL CHECK (requester_type IN ('buyer','agent')),
  doc_base64       text,           -- Emirates ID/Passport or RERA Card
  phone            text NOT NULL,
  purpose          text DEFAULT 'sale',
  areas            text[],
  prop_types       text[],
  beds_wanted      text[],
  min_price        bigint,
  max_price        bigint,
  min_size         float,
  timeline         text,
  notes            text,
  active           boolean DEFAULT true,
  match_count      int DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ofm_requests_token_idx ON ofm_requests(requester_token);
CREATE INDEX IF NOT EXISTS ofm_requests_active_idx ON ofm_requests(active);

ALTER TABLE ofm_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY ofm_requests_anon_read ON ofm_requests
  FOR SELECT TO anon USING (active = true);
CREATE POLICY ofm_requests_anon_insert ON ofm_requests
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY ofm_requests_anon_update ON ofm_requests
  FOR UPDATE TO anon USING (true);

-- ============================================================
-- TABLE: ofm_matches
-- AI-scored pairs between listings and requests.
-- ============================================================
CREATE TABLE IF NOT EXISTS ofm_matches (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id       uuid REFERENCES ofm_listings(id) ON DELETE CASCADE,
  request_id       uuid REFERENCES ofm_requests(id) ON DELETE CASCADE,
  lister_token     text NOT NULL,
  requester_token  text NOT NULL,
  ai_score         float DEFAULT 0,
  ai_rationale     text,
  stage            text DEFAULT 'matched'
    CHECK (stage IN ('matched','lister_approved','chat_active','media_shared',
                     'id_submitted','viewing_arranged','offer_made','closing','completed','rejected')),
  lister_seen      boolean DEFAULT false,
  requester_seen   boolean DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ofm_matches_listing_idx   ON ofm_matches(listing_id);
CREATE INDEX IF NOT EXISTS ofm_matches_request_idx   ON ofm_matches(request_id);
CREATE INDEX IF NOT EXISTS ofm_matches_lister_tok    ON ofm_matches(lister_token);
CREATE INDEX IF NOT EXISTS ofm_matches_requester_tok ON ofm_matches(requester_token);

ALTER TABLE ofm_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY ofm_matches_anon_read ON ofm_matches
  FOR SELECT TO anon USING (true);
CREATE POLICY ofm_matches_anon_insert ON ofm_matches
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY ofm_matches_anon_update ON ofm_matches
  FOR UPDATE TO anon USING (true);

-- ============================================================
-- TABLE: ofm_messages
-- Anonymous in-platform chat. Identity revealed only at id_submitted+
-- ============================================================
CREATE TABLE IF NOT EXISTS ofm_messages (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id     uuid REFERENCES ofm_matches(id) ON DELETE CASCADE,
  sender_role  text NOT NULL CHECK (sender_role IN ('lister','requester')),
  sender_token text NOT NULL,
  body         text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ofm_messages_match_idx ON ofm_messages(match_id);

ALTER TABLE ofm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY ofm_messages_anon_read ON ofm_messages
  FOR SELECT TO anon USING (true);
CREATE POLICY ofm_messages_anon_insert ON ofm_messages
  FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- TABLE: ofm_media
-- Property photos/videos shared at media_shared stage+
-- ============================================================
CREATE TABLE IF NOT EXISTS ofm_media (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id       uuid REFERENCES ofm_matches(id) ON DELETE CASCADE,
  lister_token   text NOT NULL,
  media_type     text DEFAULT 'photo' CHECK (media_type IN ('photo','video_url')),
  data           text NOT NULL,   -- base64 for photo, URL for video
  caption        text,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ofm_media_match_idx ON ofm_media(match_id);

ALTER TABLE ofm_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY ofm_media_anon_read ON ofm_media
  FOR SELECT TO anon USING (true);
CREATE POLICY ofm_media_anon_insert ON ofm_media
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY ofm_media_anon_delete ON ofm_media
  FOR DELETE TO anon USING (true);
