// Public semantic-search endpoint over the DubAIVal knowledge base (RAG).
// Embeds the incoming query with Gemini, then calls the match_knowledge()
// Postgres RPC (pgvector cosine similarity) via Supabase REST.
//
// Fails soft: if GEMINI_API_KEY or SUPABASE_SERVICE_ROLE_KEY isn't configured,
// or the upstream calls fail, this returns { results: [] } with HTTP 200 so
// callers (askAI grounding) can treat "no context available" as a no-op
// rather than an error.

var embeddings = require("../lib/embeddings.js");
var shared = require("./lib/shared.js");
var { rateLimitExceeded } = require("../lib/ratelimit");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only", results: [] });

  if (rateLimitExceeded(req, res, 60000, 30)) return;

  var body = req.body || {};
  var query = String(body.query || "").trim();
  if (!query) return res.status(400).json({ error: "Missing query", results: [] });

  if (!process.env.GEMINI_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(200).json({ results: [] });
  }

  try {
    var vec = await embeddings.embedText(query, "RETRIEVAL_QUERY");
    if (!vec) return res.status(200).json({ results: [] });

    var rpcBody = {
      query_embedding: vec,
      match_count: Math.min(Math.max(parseInt(body.limit, 10) || 5, 1), 12),
    };
    if (body.area) rpcBody.filter_area = String(body.area).slice(0, 80);

    var r = await shared.supabaseRequest("/rpc/match_knowledge", {
      method: "POST",
      body: JSON.stringify(rpcBody),
    });
    if (!r.ok) return res.status(200).json({ results: [] });

    var rows = await r.json();
    return res.status(200).json({ results: Array.isArray(rows) ? rows : [] });
  } catch (e) {
    return res.status(200).json({ results: [] });
  }
};
