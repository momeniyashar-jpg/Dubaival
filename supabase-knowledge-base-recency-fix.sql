-- DubaiVal RAG — recency-weighted ranking fix. Run ONCE in the Supabase SQL
-- Editor for this project, after supabase-knowledge-base-schema.sql.
--
-- Problem: match_knowledge() ranked purely by cosine similarity. A stale
-- market_snapshot or news row from months ago could rank above (or tie with)
-- today's data on pure semantic closeness, since nothing ever weighted
-- freshness. This directly undermined the "AI gets smarter/fresher every
-- day" goal — retrieval had no way to prefer new knowledge over old.
--
-- Fix: blend cosine similarity (85% weight) with a linear recency score
-- that decays from 1.0 (published today) to 0.0 (published 180+ days ago),
-- using created_at as a fallback when published_at is null. Output columns
-- and function signature are unchanged — existing callers (js/api.js,
-- api/knowledge-query.js) need no changes.

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
  order by
    (1 - (knowledge_base.embedding <=> query_embedding)) * 0.85
    + greatest(
        0,
        1 - extract(epoch from (now() - coalesce(knowledge_base.published_at, knowledge_base.created_at))) / (86400.0 * 180)
      ) * 0.15
    desc
  limit match_count;
$$;
