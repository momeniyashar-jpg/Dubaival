-- Off-Market Private Exchange (OFM) Schema
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================================
-- TABLE: ofm_listings
-- Hidden off-market property listings. Never publicly browsable.
-- Lister provides full unit details; area auto-derived from building.
-- ============================================================
CREATE TABLE IF NOT EXISTS ofm_listings (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lister_token        text NOT NULL,
  lister_type         text NOT NULL CHECK (lister_type IN ('owner','poa','management')),
  -- Documents (base64 compressed)
  doc1_base64         text,    -- Title Deed / POA Agreement / Management Contract
  doc2_base64         text,    -- Emirates ID/Passport / POA holder ID / RERA Card
  phone               text NOT NULL,
  -- Property identity
  area                text NOT NULL,
  building            text NOT NULL,
  unit_number         text,    -- shown only at viewing_arranged stage
  prop_type           text DEFAULT 'apartment' CHECK (prop_type IN ('apartment','villa','townhouse','penthouse','duplex','studio')),
  -- Unit specs
  beds                text NOT NULL,
  baths               text,
  parking             int DEFAULT 1,
  maid_room           boolean DEFAULT false,
  study_room          boolean DEFAULT false,
  storage_room        boolean DEFAULT false,
  size_sqft           float NOT NULL,
  floor_num           text,
  view_type           text,
  furnished           text DEFAULT 'Unfurnished',
  -- Tenancy status
  vacant              boolean DEFAULT true,
  tenancy_end_date    text,    -- if tenanted, when does tenancy expire
  -- Pricing
  asking_price        bigint NOT NULL,
  price_negotiable    boolean DEFAULT true,
  service_charge_psf  float,
  -- Additional info
  notes               text,
  -- DubAIVal AVM auto-computed
  dv_fair_price       bigint,
  dv_psf              float,
  dv_verdict          text,
  dv_confidence       int,
  dv_signal           text,
  -- Admin
  doc_verified        boolean DEFAULT false,
  active              boolean DEFAULT true,
  match_count         int DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ofm_listings_token_idx    ON ofm_listings(lister_token);
CREATE INDEX IF NOT EXISTS ofm_listings_building_idx ON ofm_listings(building);
CREATE INDEX IF NOT EXISTS ofm_listings_area_idx     ON ofm_listings(area);
CREATE INDEX IF NOT EXISTS ofm_listings_active_idx   ON ofm_listings(active);

ALTER TABLE ofm_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ofm_listings_anon_read   ON ofm_listings;
DROP POLICY IF EXISTS ofm_listings_anon_insert ON ofm_listings;
DROP POLICY IF EXISTS ofm_listings_anon_update ON ofm_listings;
CREATE POLICY ofm_listings_anon_read   ON ofm_listings FOR SELECT TO anon USING (active = true);
CREATE POLICY ofm_listings_anon_insert ON ofm_listings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY ofm_listings_anon_update ON ofm_listings FOR UPDATE TO anon USING (true);

-- ============================================================
-- TABLE: ofm_requests
-- Buyer/agent requirements. Deliberately minimal — just building + beds + budget.
-- ============================================================
CREATE TABLE IF NOT EXISTS ofm_requests (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_token     text NOT NULL,
  requester_type      text NOT NULL CHECK (requester_type IN ('buyer','agent')),
  doc_base64          text,     -- Emirates ID/Passport or RERA Card
  phone               text NOT NULL,
  -- What they want (simple)
  building            text NOT NULL,   -- specific building they want
  area                text,            -- auto-derived from building
  beds                text NOT NULL,   -- e.g. "2 BR"
  max_budget          bigint NOT NULL, -- maximum they will pay (AED)
  -- Optional preferences
  payment_method      text DEFAULT 'flexible' CHECK (payment_method IN ('cash','mortgage','flexible')),
  min_size            float,
  preferred_floor     text,
  view_pref           text,
  timeline            text DEFAULT '3 months',
  notes               text,
  -- Status
  active              boolean DEFAULT true,
  match_count         int DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ofm_requests_token_idx    ON ofm_requests(requester_token);
CREATE INDEX IF NOT EXISTS ofm_requests_building_idx ON ofm_requests(building);
CREATE INDEX IF NOT EXISTS ofm_requests_active_idx   ON ofm_requests(active);

ALTER TABLE ofm_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ofm_requests_anon_read   ON ofm_requests;
DROP POLICY IF EXISTS ofm_requests_anon_insert ON ofm_requests;
DROP POLICY IF EXISTS ofm_requests_anon_update ON ofm_requests;
CREATE POLICY ofm_requests_anon_read   ON ofm_requests FOR SELECT TO anon USING (active = true);
CREATE POLICY ofm_requests_anon_insert ON ofm_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY ofm_requests_anon_update ON ofm_requests FOR UPDATE TO anon USING (true);

-- ============================================================
-- TABLE: ofm_matches
-- AI-scored pairs. 9-stage pipeline from matched → completed.
-- Price tolerance built into score: ≤15% over = full, ≤30% = partial, >30% = no match.
-- ============================================================
CREATE TABLE IF NOT EXISTS ofm_matches (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id          uuid REFERENCES ofm_listings(id) ON DELETE CASCADE,
  request_id          uuid REFERENCES ofm_requests(id) ON DELETE CASCADE,
  lister_token        text NOT NULL,
  requester_token     text NOT NULL,
  -- Match scoring
  ai_score            float DEFAULT 0,   -- 0-100
  price_delta_pct     float,             -- (asking - budget) / budget × 100
  ai_rationale        text,
  -- Pipeline stage
  stage               text DEFAULT 'matched'
    CHECK (stage IN (
      'matched',          -- AI found match, lister hasn't seen yet
      'lister_approved',  -- lister accepted to engage
      'chat_active',      -- both parties can chat anonymously
      'media_shared',     -- lister shared photos/media
      'id_submitted',     -- requester submitted ID docs
      'viewing_arranged', -- physical viewing scheduled
      'offer_made',       -- formal offer submitted
      'closing',          -- in DLD/Trustee closing process
      'completed',        -- transaction complete
      'rejected'          -- lister or requester rejected
    )),
  rejected_by         text,  -- 'lister' or 'requester'
  rejection_note      text,
  lister_seen         boolean DEFAULT false,
  requester_seen      boolean DEFAULT false,
  offer_amount        bigint,
  closing_notes       text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE(listing_id, request_id)  -- one match per listing-request pair
);

CREATE INDEX IF NOT EXISTS ofm_matches_listing_idx   ON ofm_matches(listing_id);
CREATE INDEX IF NOT EXISTS ofm_matches_request_idx   ON ofm_matches(request_id);
CREATE INDEX IF NOT EXISTS ofm_matches_lister_tok    ON ofm_matches(lister_token);
CREATE INDEX IF NOT EXISTS ofm_matches_requester_tok ON ofm_matches(requester_token);
CREATE INDEX IF NOT EXISTS ofm_matches_stage_idx     ON ofm_matches(stage);

ALTER TABLE ofm_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ofm_matches_anon_read   ON ofm_matches;
DROP POLICY IF EXISTS ofm_matches_anon_insert ON ofm_matches;
DROP POLICY IF EXISTS ofm_matches_anon_update ON ofm_matches;
CREATE POLICY ofm_matches_anon_read   ON ofm_matches FOR SELECT TO anon USING (true);
CREATE POLICY ofm_matches_anon_insert ON ofm_matches FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY ofm_matches_anon_update ON ofm_matches FOR UPDATE TO anon USING (true);

-- ============================================================
-- TABLE: ofm_messages
-- Anonymous in-platform chat. No identity revealed until id_submitted stage.
-- ============================================================
CREATE TABLE IF NOT EXISTS ofm_messages (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id     uuid REFERENCES ofm_matches(id) ON DELETE CASCADE,
  sender_role  text NOT NULL CHECK (sender_role IN ('lister','requester')),
  sender_token text NOT NULL,
  body         text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ofm_messages_match_idx ON ofm_messages(match_id, created_at);

ALTER TABLE ofm_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ofm_messages_anon_read   ON ofm_messages;
DROP POLICY IF EXISTS ofm_messages_anon_insert ON ofm_messages;
CREATE POLICY ofm_messages_anon_read   ON ofm_messages FOR SELECT TO anon USING (true);
CREATE POLICY ofm_messages_anon_insert ON ofm_messages FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- TABLE: ofm_media
-- Property photos/videos. Uploaded by lister. Visible from media_shared stage.
-- ============================================================
CREATE TABLE IF NOT EXISTS ofm_media (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id      uuid REFERENCES ofm_matches(id) ON DELETE CASCADE,
  lister_token  text NOT NULL,
  media_type    text DEFAULT 'photo' CHECK (media_type IN ('photo','video_url')),
  data          text NOT NULL,   -- base64 (photo) or URL (video)
  caption       text,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ofm_media_match_idx ON ofm_media(match_id);

ALTER TABLE ofm_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ofm_media_anon_read   ON ofm_media;
DROP POLICY IF EXISTS ofm_media_anon_insert ON ofm_media;
DROP POLICY IF EXISTS ofm_media_anon_delete ON ofm_media;
CREATE POLICY ofm_media_anon_read   ON ofm_media FOR SELECT TO anon USING (true);
CREATE POLICY ofm_media_anon_insert ON ofm_media FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY ofm_media_anon_delete ON ofm_media FOR DELETE TO anon USING (true);
