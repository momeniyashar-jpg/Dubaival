-- DubaiVal RAG — forecast-accuracy feedback loop. Run ONCE in the Supabase
-- SQL Editor for this project, after supabase-knowledge-base-schema.sql and
-- supabase-knowledge-base-recency-fix.sql.
--
-- Adds a new knowledge_base source_type, 'forecast_accuracy', written weekly
-- by api/refresh-market-data.js (?action=forecast-audit). Each row compares
-- runMarketIntelligence()'s stored 6-month price-change estimate for an area
-- (market_momentum.pct_change) against the REALIZED 6-month change computed
-- from real tracked listings in price_history — closing the loop between
-- what the AI guessed and what the market actually did, without any model
-- fine-tuning. These facts are retrieved like any other knowledge_base row
-- (same embedding/HNSW/recency-ranked match_knowledge() RPC, same area
-- filter) — no schema or function signature changes needed beyond widening
-- the source_type check.

alter table knowledge_base drop constraint if exists knowledge_base_source_type_check;
alter table knowledge_base add constraint knowledge_base_source_type_check
  check (source_type in ('news', 'market_snapshot', 'forecast_accuracy'));
