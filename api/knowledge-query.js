// Public semantic-search endpoint over the DubAIVal knowledge base (RAG).
// Embeds the incoming query with Gemini, then calls the match_knowledge()
// Postgres RPC (pgvector cosine similarity) via Supabase REST.
//
// Fails soft: if GEMINI_API_KEY or SUPABASE_SERVICE_ROLE_KEY isn't configured,
// or the upstream calls fail, this returns { results: [] } with HTTP 200 so
// callers (askAI grounding) can treat "no context available" as a no-op
// rather than an error.

var embeddings = require("./_lib/embeddings.js");
var shared = require("./_lib/shared.js");
var { rateLimitExceeded } = require("./_lib/ratelimit");

// Admin-only: batch-embed and upsert hand-curated "research note" facts
// (real estate domain/process knowledge gathered via research — e.g. web
// search) into the same knowledge_base RAG table used for news/market
// snapshots, so grounded AI answers (Chat Agents, Area Comparison, Personal
// Advisor, Portfolio Analysis) get the benefit of it too. Deliberately
// generic/reusable — any future research session can inject facts through
// this same action, not just a one-off for today's off-plan research.
// Verified via the same admin_verify() RPC every other admin action already
// uses (supabase-admin-security-fix.sql) — called server-side here since
// this endpoint also needs the service-role key to call embedTexts()/write
// to knowledge_base, neither of which the client can do directly.
async function handleIngestResearch(req, res) {
  var body = req.body || {};
  var pw = String(body.admin_password || "");
  var notes = Array.isArray(body.notes) ? body.notes : [];
  if (!notes.length) return res.status(400).json({ error: "No notes provided" });

  try {
    var verifyResp = await shared.supabaseRequest("/rpc/admin_verify", {
      method: "POST",
      body: JSON.stringify({ p_admin_password: pw }),
    });
    var ok = verifyResp.ok && (await verifyResp.json()) === true;
    if (!ok) return res.status(401).json({ error: "Invalid admin password" });
  } catch (e) {
    return res.status(500).json({ error: "Could not verify admin password" });
  }

  if (!embeddings.hasProvider() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "No embedding provider configured (JINA_API_KEY / GEMINI_API_KEY)" });
  }

  var clean = notes
    .map(function (n) {
      return {
        title: String(n.title || "").slice(0, 300),
        content: String(n.content || "").slice(0, 6000),
        area: n.area ? String(n.area).slice(0, 80) : null,
        tag: n.tag ? String(n.tag).slice(0, 60) : null,
      };
    })
    .filter(function (n) { return n.content; });
  if (!clean.length) return res.status(400).json({ error: "Every note needs content" });

  try {
    var texts = clean.map(function (n) { return n.content; });
    var vectors = await embeddings.embedTexts(texts, "RETRIEVAL_DOCUMENT");

    var rows = [];
    clean.forEach(function (n, i) {
      var vec = vectors[i];
      if (!vec) return;
      // Stable key per note title (not date-stamped like market_snapshot) —
      // re-injecting the same research note updates it in place instead of
      // accumulating duplicates, since this is evergreen knowledge, not a
      // daily-changing figure.
      var slug = n.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "note-" + i;
      rows.push({
        source_type: "research_note",
        source_url: "research:" + slug,
        title: n.title || slug,
        content: n.content,
        area: n.area,
        tag: n.tag,
        embedding: vec,
        published_at: new Date().toISOString(),
      });
    });
    if (!rows.length) return res.status(500).json({ error: "Embedding failed for every note" });

    var resp = await shared.supabaseRequest("/knowledge_base", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
    if (!resp.ok) return res.status(500).json({ error: "Supabase insert failed (HTTP " + resp.status + ")" });

    return res.status(200).json({ ingested: rows.length, skipped: clean.length - rows.length });
  } catch (e) {
    return res.status(500).json({ error: "Ingestion failed: " + e.message });
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only", results: [] });

  if (rateLimitExceeded(req, res, 60000, 30)) return;

  var body = req.body || {};

  if (body.action === "ingest") return handleIngestResearch(req, res);

  var query = String(body.query || "").trim();
  if (!query) return res.status(400).json({ error: "Missing query", results: [] });

  if (!embeddings.hasProvider() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
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
