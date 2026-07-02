// Server-side Gemini embedding endpoint for AI Chief of Staff.
// Generates text-embedding-004 (768-dim) vectors for:
//   - Inventory listings  → stored in chiefs_inventory.embedding
//   - Client requirements → stored in chiefs_clients.embedding
//   - Co-pilot queries    → used on-the-fly for semantic inventory search
//
// POST /api/chiefs-embed
//   Body: { text: string, taskType?: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" }
//   Returns: { embedding: float[] | null }
//
// Fails soft: if GEMINI_API_KEY is not configured, returns { embedding: null }
// so callers gracefully degrade to rule-based matching.

var { embedText } = require("./lib/embeddings.js");
var { rateLimitExceeded } = require("../lib/ratelimit");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,apikey");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  if (rateLimitExceeded(req, res, 60000, 60)) return;

  var body = req.body || {};
  var text = String(body.text || "").trim();
  if (!text) return res.status(400).json({ error: "text required" });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({ embedding: null });
  }

  try {
    var taskType =
      body.taskType === "RETRIEVAL_QUERY" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT";
    var embedding = await embedText(text.slice(0, 3000), taskType);
    return res.status(200).json({ embedding: embedding || null });
  } catch (e) {
    return res.status(200).json({ embedding: null });
  }
};
