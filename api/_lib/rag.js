// Server-side RAG grounding helper — the backend twin of js/api.js's
// fetchKnowledgeContext(). Used by any serverless function that needs to
// ground an AI reply in the real knowledge_base (news, market snapshots,
// forecast-accuracy audits, curated research notes) instead of calling the
// LLM with no domain context at all.
//
// Mirrors api/knowledge-query.js's retrieval + api/api.js's client-side
// formatting convention exactly, so a grounded reply generated server-side
// (e.g. an email/WhatsApp/Instagram/Facebook auto-reply) carries the same
// real-estate-specialist knowledge as a grounded reply generated through
// the client (Chat Agents, Compare, Personal Advisor, etc.) — same source,
// same formatting, same "ignore if irrelevant" framing in the prompt.

const shared = require("./shared.js");
const embeddings = require("./embeddings.js");

// areas: optional string or array of up to 5 area names to filter by.
// Returns a formatted context string ("- title: content" per line, capped
// at 8 results) or "" if nothing useful was found / embeddings aren't
// configured — callers should treat "" as "proceed without grounding",
// never throw.
async function fetchKnowledgeContextServer(query, areas) {
  if (!query || !embeddings.hasProvider()) return "";

  try {
    var vec = await embeddings.embedText(query, "RETRIEVAL_QUERY");
    if (!vec) return "";

    var areasList = Array.isArray(areas)
      ? areas.filter(Boolean).slice(0, 5)
      : areas
      ? [areas]
      : null;

    var merged = [];
    if (areasList && areasList.length) {
      var perAreaResults = await Promise.all(
        areasList.map(function (a) {
          return shared
            .supabaseRequest("/rpc/match_knowledge", {
              method: "POST",
              body: JSON.stringify({
                query_embedding: vec,
                match_count: 6,
                filter_area: String(a).slice(0, 80),
              }),
            })
            .then(function (r) {
              return r.ok ? r.json() : [];
            })
            .catch(function () {
              return [];
            });
        })
      );
      var seen = {};
      perAreaResults.forEach(function (rows) {
        (Array.isArray(rows) ? rows : []).forEach(function (row) {
          if (seen[row.id]) return;
          seen[row.id] = true;
          merged.push(row);
        });
      });
    } else {
      var r = await shared.supabaseRequest("/rpc/match_knowledge", {
        method: "POST",
        body: JSON.stringify({ query_embedding: vec, match_count: 8 }),
      });
      merged = r.ok ? await r.json() : [];
      if (!Array.isArray(merged)) merged = [];
    }

    if (!merged.length) return "";

    return merged
      .slice(0, 8)
      .map(function (x) {
        return "- " + (x.title ? x.title + ": " : "") + x.content;
      })
      .join("\n");
  } catch (e) {
    return "";
  }
}

module.exports = { fetchKnowledgeContextServer: fetchKnowledgeContextServer };
