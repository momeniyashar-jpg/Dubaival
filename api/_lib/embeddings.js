// Embedding helper — 768-dim vectors for the knowledge-base RAG system.
// Supports two providers (in preference order):
//   1. Jina AI  — set JINA_API_KEY  (jina_xxx, free, permanent, recommended)
//   2. Gemini   — set GEMINI_API_KEY (AIzaSy... or AQ./ya29. OAuth token)
// Both produce 768-dim vectors compatible with the knowledge_base pgvector schema.
// Server-only — never expose these keys to the client.

const GEMINI_BATCH_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents";
const JINA_URL = "https://api.jina.ai/v1/embeddings";
const MAX_BATCH = 100;

function chunk(arr, size) {
  var out = [];
  for (var i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Jina AI (jina-embeddings-v3, 768-dim via Matryoshka truncation) ───────────
async function embedTextsJina(texts, taskType) {
  var key = process.env.JINA_API_KEY;
  if (!key) throw new Error("JINA_API_KEY not configured");

  var task = taskType === "RETRIEVAL_QUERY" ? "retrieval.query" : "retrieval.passage";
  var batches = chunk(texts, MAX_BATCH);
  var results = [];

  for (var b = 0; b < batches.length; b++) {
    var controller = new AbortController();
    var tid = setTimeout(function() { controller.abort(); }, 20000);
    try {
      var r = await fetch(JINA_URL, {
        method: "POST",
        signal: controller.signal,
        headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "jina-embeddings-v3",
          dimensions: 768,
          task: task,
          input: batches[b].map(function(t) { return String(t || "").slice(0, 8000); })
        })
      });
      clearTimeout(tid);
      if (!r.ok) {
        for (var i = 0; i < batches[b].length; i++) results.push(null);
        continue;
      }
      var data = await r.json();
      var items = (data && data.data) || [];
      for (var j = 0; j < batches[b].length; j++) {
        results.push(items[j] && items[j].embedding ? items[j].embedding : null);
      }
    } catch (e) {
      clearTimeout(tid);
      for (var k = 0; k < batches[b].length; k++) results.push(null);
    }
  }
  return results;
}

// ── Gemini text-embedding-004 (768-dim) ───────────────────────────────────────
// Supports both AIzaSy... API keys (?key= auth) and AQ./ya29. OAuth tokens
// (Bearer auth). OAuth tokens expire in ~1h — use Jina for production.
async function embedTextsGemini(texts, taskType) {
  var key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured");

  var type = taskType || "RETRIEVAL_DOCUMENT";
  var batches = chunk(texts, MAX_BATCH);
  var results = [];
  var isOAuth = key.startsWith("AQ.") || key.startsWith("ya29.");

  for (var b = 0; b < batches.length; b++) {
    var requests = batches[b].map(function(t) {
      return {
        model: "models/text-embedding-004",
        content: { parts: [{ text: String(t || "").slice(0, 8000) }] },
        taskType: type
      };
    });

    var hdrs = { "Content-Type": "application/json" };
    var url = GEMINI_BATCH_URL;
    if (isOAuth) {
      hdrs["Authorization"] = "Bearer " + key;
    } else {
      url = GEMINI_BATCH_URL + "?key=" + key;
    }

    var controller = new AbortController();
    var tid = setTimeout(function() { controller.abort(); }, 15000);
    try {
      var r = await fetch(url, {
        method: "POST", signal: controller.signal,
        headers: hdrs,
        body: JSON.stringify({ requests: requests })
      });
      clearTimeout(tid);
      if (!r.ok) {
        for (var i = 0; i < batches[b].length; i++) results.push(null);
        continue;
      }
      var data = await r.json();
      var embeddings = (data && data.embeddings) || [];
      for (var j = 0; j < batches[b].length; j++) {
        var e = embeddings[j];
        results.push(e && e.values ? e.values : null);
      }
    } catch (e) {
      clearTimeout(tid);
      for (var k = 0; k < batches[b].length; k++) results.push(null);
    }
  }
  return results;
}

// ── Public API ────────────────────────────────────────────────────────────────
async function embedTexts(texts, taskType) {
  if (!texts || !texts.length) return [];
  if (process.env.JINA_API_KEY) return embedTextsJina(texts, taskType);
  if (process.env.GEMINI_API_KEY) return embedTextsGemini(texts, taskType);
  throw new Error("No embedding API configured. Set JINA_API_KEY or GEMINI_API_KEY in Vercel.");
}

async function embedText(text, taskType) {
  var out = await embedTexts([text], taskType);
  return out[0] || null;
}

module.exports = { embedTexts: embedTexts, embedText: embedText };
