-- AI Chief of Staff — Semantic Embedding Extension
-- Run AFTER supabase-chiefs-schema.sql
-- Requires: pgvector (already enabled if RAG/knowledge-base schema was run)
-- Purpose: upgrades rule-based matching to semantic vector similarity
--          using Gemini text-embedding-004 (768-dim) stored in each row.

CREATE EXTENSION IF NOT EXISTS vector;

-- ── EMBEDDING COLUMNS ────────────────────────────────────────────────────────
ALTER TABLE chiefs_inventory ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE chiefs_clients   ADD COLUMN IF NOT EXISTS embedding vector(768);

-- HNSW indexes — O(log n) approximate nearest-neighbor, cosine distance
CREATE INDEX IF NOT EXISTS idx_chiefs_inv_emb
  ON chiefs_inventory USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_chiefs_cli_emb
  ON chiefs_clients USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── FUNCTION 1: CO-PILOT SEARCH ──────────────────────────────────────────────
-- Input: raw query embedding (from /api/chiefs-embed), agent id, optional purpose
-- Used by: chiefsCopilotAnalyze() — embed the incoming message → find matching listings
CREATE OR REPLACE FUNCTION match_chiefs_inventory(
  query_embedding  vector(768),
  agent_id_filter  text,
  purpose_filter   text    DEFAULT NULL,
  match_count      integer DEFAULT 6
)
RETURNS TABLE (
  id            uuid,
  area          text,
  building      text,
  beds          text,
  prop_type     text,
  price         numeric,
  purpose       text,
  size_sqft     numeric,
  floor_num     text,
  view_type     text,
  furnished     text,
  status        text,
  dv_verdict    text,
  dv_confidence integer,
  notes         text,
  contact_name  text,
  contact_phone text,
  similarity    float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.area, i.building, i.beds, i.prop_type,
         i.price, i.purpose, i.size_sqft, i.floor_num,
         i.view_type, i.furnished, i.status, i.dv_verdict,
         i.dv_confidence, i.notes, i.contact_name, i.contact_phone,
         (1 - (i.embedding <=> query_embedding))::float AS similarity
  FROM   chiefs_inventory i
  WHERE  i.agent_id  = agent_id_filter
    AND  i.status    = 'available'
    AND  i.embedding IS NOT NULL
    AND  (purpose_filter IS NULL OR i.purpose = purpose_filter)
  ORDER  BY i.embedding <=> query_embedding
  LIMIT  match_count;
END;
$$;

-- ── FUNCTION 2: FULL SEMANTIC AUTO-MATCH (one query, server-side only) ────────
-- Finds ALL high-similarity client↔listing pairs for an agent in one pass.
-- Pure Postgres — no embedding data ever sent to/from the browser.
-- Used by: _chiefsAutoMatch() — after every new listing or client is saved.
CREATE OR REPLACE FUNCTION auto_match_chiefs_semantic(
  agent_id_param    text,
  similarity_cutoff float DEFAULT 0.62
)
RETURNS TABLE (
  client_id    uuid,
  inventory_id uuid,
  score        float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT  c.id   AS client_id,
          i.id   AS inventory_id,
          (1 - (c.embedding <=> i.embedding))::float AS score
  FROM    chiefs_clients  c
  JOIN    chiefs_inventory i ON i.agent_id = c.agent_id
  WHERE   c.agent_id  = agent_id_param
    AND   c.status    = 'active'
    AND   i.status    = 'available'
    AND   c.embedding IS NOT NULL
    AND   i.embedding IS NOT NULL
    AND   c.purpose   = i.purpose          -- hard filter: sale↔sale, rent↔rent
    AND   (1 - (c.embedding <=> i.embedding)) >= similarity_cutoff
  ORDER   BY score DESC;
END;
$$;

-- No extra RLS grants needed — new columns inherit the existing table policies.
