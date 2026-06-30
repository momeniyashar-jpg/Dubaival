-- DubaiVal Knowledge Base — run ONCE in the Supabase SQL Editor for this project.
-- Backs the RAG (Retrieval-Augmented Generation) system that lets DubAIVal's AI
-- features ground their answers in a growing, continuously-updated body of real
-- Dubai real-estate knowledge (live news + daily market snapshots), instead of
-- relying only on the LLM's frozen training data.
--
-- Embeddings are 768-dim vectors from Google Gemini's text-embedding-004 model
-- (chosen because 768 dims stays safely under pgvector's practical ~2000-dim
-- HNSW/ivfflat indexing ceiling — the newer gemini-embedding-001 defaults to
-- 3072 dims, which is NOT safely indexable).
--
-- All writes (insert/upsert) happen server-side only, via the Supabase service
-- role key (api/lib/embeddings.js + api/proxy-news.js + api/refresh-market-data.js
-- + api/knowledge-query.js), which bypasses RLS — so there is no anon/authenticated
-- INSERT policy, only a public SELECT policy for symmetry with the rest of the app.

create extension if not exists vector;

create table if not exists knowledge_base (
  id bigint generated always as identity primary key,
  source_type text not null check (source_type in ('news', 'market_snapshot')),
  source_url text not null,
  title text,
  content text not null,
  area text,
  tag text,
  embedding vector(768),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source_type, source_url)
);

create index if not exists knowledge_base_area_idx on knowledge_base (area);
create index if not exists knowledge_base_source_type_idx on knowledge_base (source_type);
create index if not exists knowledge_base_published_at_idx on knowledge_base (published_at desc);

-- HNSW index for fast approximate cosine-similarity search. Cosine distance
-- (<=>) is used because Gemini embeddings are not guaranteed unit-normalized
-- and cosine is the recommended distance for text-embedding-004.
create index if not exists knowledge_base_embedding_idx
  on knowledge_base using hnsw (embedding vector_cosine_ops);

alter table knowledge_base enable row level security;

drop policy if exists "knowledge_base public read" on knowledge_base;
create policy "knowledge_base public read" on knowledge_base
  for select using (true);

-- Semantic search RPC — called via POST /rest/v1/rpc/match_knowledge from
-- api/knowledge-query.js. Returns the top `match_count` rows ranked by cosine
-- similarity, optionally filtered to a single area and/or limited to entries
-- newer than `min_published_at`.
create or replace function match_knowledge(
  query_embedding vector(768),
  match_count int default 5,
  filter_area text default null,
  min_published_at timestamptz default null
)
returns table (
  id bigint,
  source_type text,
  source_url text,
  title text,
  content text,
  area text,
  tag text,
  published_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    knowledge_base.id,
    knowledge_base.source_type,
    knowledge_base.source_url,
    knowledge_base.title,
    knowledge_base.content,
    knowledge_base.area,
    knowledge_base.tag,
    knowledge_base.published_at,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where knowledge_base.embedding is not null
    and (filter_area is null or knowledge_base.area = filter_area)
    and (min_published_at is null or knowledge_base.published_at >= min_published_at)
  order by knowledge_base.embedding <=> query_embedding
  limit match_count;
$$;
