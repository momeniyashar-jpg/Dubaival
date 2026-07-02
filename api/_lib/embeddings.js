// Gemini text-embedding-004 helper for the knowledge-base RAG system.
// 768-dim output — stays safely under pgvector's practical ~2000-dim HNSW
// indexing ceiling (the newer gemini-embedding-001 defaults to 3072 dims,
// which would not be safely indexable). Free tier on Google AI Studio.
//
// Server-only — never expose GEMINI_API_KEY to the client.

const GEMINI_BATCH_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents";

// Google's batchEmbedContents accepts up to 100 requests per call.
const MAX_BATCH = 100;

function chunk(arr, size) {
  var out = [];
  for (var i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// embedTexts(texts, taskType) -> array of 768-dim float arrays, same order
// as input, or null entries for any text that failed to embed.
// taskType: "RETRIEVAL_DOCUMENT" (default, for ingestion) or "RETRIEVAL_QUERY"
// (for search-time queries) — Gemini tunes the embedding slightly per task type.
async function embedTexts(texts, taskType) {
  var key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured");
  if (!texts || !texts.length) return [];

  var type = taskType || "RETRIEVAL_DOCUMENT";
  var batches = chunk(texts, MAX_BATCH);
  var results = [];

  for (var b = 0; b < batches.length; b++) {
    var batch = batches[b];
    var requests = batch.map(function (t) {
      return {
        model: "models/text-embedding-004",
        content: { parts: [{ text: String(t || "").slice(0, 8000) }] },
        taskType: type,
      };
    });

    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var r = await fetch(GEMINI_BATCH_URL + "?key=" + key, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: requests }),
      });
      clearTimeout(timeout);
      if (!r.ok) {
        for (var i = 0; i < batch.length; i++) results.push(null);
        continue;
      }
      var data = await r.json();
      var embeddings = (data && data.embeddings) || [];
      for (var j = 0; j < batch.length; j++) {
        var e = embeddings[j];
        results.push(e && e.values ? e.values : null);
      }
    } catch (e) {
      clearTimeout(timeout);
      for (var k = 0; k < batch.length; k++) results.push(null);
    }
  }

  return results;
}

async function embedText(text, taskType) {
  var out = await embedTexts([text], taskType);
  return out[0] || null;
}

module.exports = { embedTexts: embedTexts, embedText: embedText };
