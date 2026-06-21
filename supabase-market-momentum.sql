-- Market Momentum table — AI-powered market trend analysis
-- Stores Groq AI market intelligence data per area
CREATE TABLE IF NOT EXISTS market_momentum (
  area_key TEXT PRIMARY KEY,
  trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  pct_change REAL NOT NULL DEFAULT 0,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  sector TEXT DEFAULT 'mid',
  note TEXT,
  source TEXT DEFAULT 'groq_ai',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_momentum_updated ON market_momentum(updated_at DESC);

-- RLS: public read, service-role write
ALTER TABLE market_momentum ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read momentum" ON market_momentum
  FOR SELECT USING (true);

CREATE POLICY "Service write momentum" ON market_momentum
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anon insert/update for client-side AI intelligence
CREATE POLICY "Anon upsert momentum" ON market_momentum
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon update momentum" ON market_momentum
  FOR UPDATE USING (true);

-- Overall market summary row
INSERT INTO market_momentum (area_key, trend, pct_change, confidence, note)
VALUES ('_overall', 'stable', 0, 'low', 'Initial — no AI analysis run yet')
ON CONFLICT (area_key) DO NOTHING;
