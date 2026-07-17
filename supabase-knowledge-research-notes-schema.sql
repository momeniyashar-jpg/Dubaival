-- DubaiVal RAG — adds a new knowledge_base source_type, 'research_note',
-- for durable domain-expertise facts (real estate process/regulation
-- knowledge gathered via research, e.g. web search) that should make the
-- site's AI more expert over time — distinct from 'news' (time-sensitive
-- articles) and 'market_snapshot'/'forecast_accuracy' (daily/weekly
-- auto-generated numeric facts). A research_note is written ONCE (or
-- updated in place via the same source_url key) and is meant to stay
-- retrievable indefinitely, not superseded daily.
--
-- Same additive pattern as supabase-forecast-accuracy-schema.sql (which did
-- the same thing for 'forecast_accuracy') — run this once in Supabase SQL
-- Editor, after supabase-knowledge-base-schema.sql is already applied.

alter table knowledge_base drop constraint if exists knowledge_base_source_type_check;
alter table knowledge_base add constraint knowledge_base_source_type_check
  check (source_type in ('news', 'market_snapshot', 'forecast_accuracy', 'research_note'));
