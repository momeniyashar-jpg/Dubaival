-- AI Chief of Staff — Database Schema
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Agent Inventory Bank
CREATE TABLE IF NOT EXISTS chiefs_inventory (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id      TEXT NOT NULL,
  source        TEXT NOT NULL DEFAULT 'pocket',   -- pocket | pf | bayut | developer
  source_url    TEXT,
  building      TEXT,
  area          TEXT NOT NULL,
  unit_no       TEXT,
  prop_type     TEXT DEFAULT 'apartment',          -- apartment | villa | townhouse | penthouse
  beds          TEXT,
  size_sqft     NUMERIC,
  floor_num     TEXT,
  view_type     TEXT,
  furnished     TEXT DEFAULT 'Unfurnished',
  purpose       TEXT DEFAULT 'sale',               -- sale | rent
  price         NUMERIC,
  status        TEXT DEFAULT 'available',          -- available | under_offer | sold | rented | expired
  notes         TEXT,
  contact_name  TEXT,
  contact_phone TEXT,
  dv_fair_price NUMERIC,
  dv_psf        NUMERIC,
  dv_verdict    TEXT,
  dv_confidence INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Client Memory Bank
CREATE TABLE IF NOT EXISTS chiefs_clients (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id       TEXT NOT NULL,
  client_name    TEXT NOT NULL,
  client_phone   TEXT,
  client_email   TEXT,
  purpose        TEXT DEFAULT 'sale',              -- sale | rent
  prop_type      TEXT DEFAULT 'apartment',
  beds_wanted    TEXT,
  areas_wanted   TEXT[],
  min_price      NUMERIC,
  max_price      NUMERIC,
  min_size       NUMERIC,
  max_size       NUMERIC,
  view_pref      TEXT,
  furnished_pref TEXT,
  timeline       TEXT DEFAULT 'flexible',          -- urgent | short | medium | flexible
  notes          TEXT,
  status         TEXT DEFAULT 'active',            -- active | paused | matched | closed
  source         TEXT DEFAULT 'manual',            -- manual | whatsapp | email
  raw_conversation TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Auto-Matched Pairs
CREATE TABLE IF NOT EXISTS chiefs_matches (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id       TEXT NOT NULL,
  client_id      UUID REFERENCES chiefs_clients(id) ON DELETE CASCADE,
  inventory_id   UUID REFERENCES chiefs_inventory(id) ON DELETE CASCADE,
  match_score    NUMERIC,
  match_reasons  TEXT[],
  draft_message  TEXT,
  status         TEXT DEFAULT 'new',               -- new | draft_ready | approved | sent | dismissed
  agent_notes    TEXT,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, inventory_id)
);

-- 4. Deal Pipeline
CREATE TABLE IF NOT EXISTS chiefs_pipeline (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id         TEXT NOT NULL,
  client_id        UUID REFERENCES chiefs_clients(id),
  inventory_id     UUID REFERENCES chiefs_inventory(id),
  client_name      TEXT NOT NULL,
  property_desc    TEXT,
  stage            TEXT DEFAULT 'lead',            -- lead | viewing | offer | mou | docs | closing | closed | lost
  deal_value       NUMERIC,
  commission_est   NUMERIC,
  next_action      TEXT,
  next_action_date TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chiefs_inv_agent   ON chiefs_inventory(agent_id);
CREATE INDEX IF NOT EXISTS idx_chiefs_inv_status  ON chiefs_inventory(status);
CREATE INDEX IF NOT EXISTS idx_chiefs_cli_agent   ON chiefs_clients(agent_id);
CREATE INDEX IF NOT EXISTS idx_chiefs_cli_status  ON chiefs_clients(status);
CREATE INDEX IF NOT EXISTS idx_chiefs_mat_agent   ON chiefs_matches(agent_id);
CREATE INDEX IF NOT EXISTS idx_chiefs_mat_status  ON chiefs_matches(status);
CREATE INDEX IF NOT EXISTS idx_chiefs_pip_agent   ON chiefs_pipeline(agent_id);
CREATE INDEX IF NOT EXISTS idx_chiefs_pip_stage   ON chiefs_pipeline(stage);

-- RLS: enable but allow anon key (consistent with rest of app)
ALTER TABLE chiefs_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE chiefs_clients   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chiefs_matches   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chiefs_pipeline  ENABLE ROW LEVEL SECURITY;

-- Policy: allow all via anon key (app filters by agent_id client-side)
CREATE POLICY "chiefs_inv_anon"  ON chiefs_inventory FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "chiefs_cli_anon"  ON chiefs_clients   FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "chiefs_mat_anon"  ON chiefs_matches   FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "chiefs_pip_anon"  ON chiefs_pipeline  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
