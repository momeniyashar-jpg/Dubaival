var { rateLimitExceeded } = require("./_lib/ratelimit");

// Zero-touch onboarding (CLAUDE.md #4 CRITICAL DIRECTIVE): no user should
// ever need to generate/paste their own Groq, Gemini, Unsplash, Pexels, or
// ElevenLabs key just to use the app's built-in AI tools — those are
// platform-shared services, not per-user accounts. This file (despite its
// name — kept to avoid adding a 13th function on Vercel Hobby's 12-function
// ceiling) now proxies all 5 behind a single `?provider=` switch, each using
// its own platform-level env var. Default (no `provider` param) stays Groq,
// unchanged, for 100% backward compatibility with existing callers.

var GEMINI_MODELS_ALLOWED = ["gemini-2.0-flash", "gemini-2.0-flash-exp"];

async function handleGeminiGenerate(req, res) {
  if (rateLimitExceeded(req, res, 60000, 30)) return;
  var key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  var body = req.body;
  if (!body || !body.contents) return res.status(400).json({ error: "Missing contents" });
  if (JSON.stringify(body).length > 60000) return res.status(413).json({ error: "Request too large" });
  var model = req.query.model || "gemini-2.0-flash";
  if (GEMINI_MODELS_ALLOWED.indexOf(model) === -1) return res.status(400).json({ error: "Model not allowed" });
  try {
    var upstream = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: body.contents, generationConfig: body.generationConfig }) }
    );
    var data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream failed: " + e.message });
  }
}

async function handleUnsplashSearch(req, res) {
  if (rateLimitExceeded(req, res, 60000, 30)) return;
  var key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return res.status(500).json({ error: "UNSPLASH_ACCESS_KEY not configured" });
  var query = (req.body && req.body.query) || "";
  var perPage = Math.min((req.body && req.body.per_page) || 1, 10);
  // Defaults to "squarish" — unchanged for every existing caller (social
  // media post images, js/chat.js searchUnsplash()/searchUnsplashMulti())
  // which never send this field. Hero/banner sections (js/core.js
  // _dvGetStockPhoto()) pass "landscape" instead, since a square crop of a
  // skyline shot loses most of its composition when stretched wide.
  var orientationAllowed = ["landscape", "portrait", "squarish"];
  var orientation = orientationAllowed.indexOf(req.body && req.body.orientation) !== -1 ? req.body.orientation : "squarish";
  if (!query) return res.status(400).json({ error: "Missing query" });
  try {
    var upstream = await fetch(
      "https://api.unsplash.com/search/photos?query=" + encodeURIComponent(query) + "&per_page=" + perPage + "&orientation=" + orientation,
      { headers: { Authorization: "Client-ID " + key } }
    );
    var data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream failed: " + e.message });
  }
}

async function handlePexelsSearch(req, res) {
  if (rateLimitExceeded(req, res, 60000, 30)) return;
  var key = process.env.PEXELS_API_KEY;
  if (!key) return res.status(500).json({ error: "PEXELS_API_KEY not configured" });
  var query = (req.body && req.body.query) || "";
  var perPage = Math.min((req.body && req.body.per_page) || 1, 10);
  // Same orientation override as handleUnsplashSearch above — defaults to
  // "square" (unchanged for existing social-post callers).
  var orientationAllowed = ["landscape", "portrait", "square"];
  var orientation = orientationAllowed.indexOf(req.body && req.body.orientation) !== -1 ? req.body.orientation : "square";
  if (!query) return res.status(400).json({ error: "Missing query" });
  try {
    var upstream = await fetch(
      "https://api.pexels.com/v1/search?query=" + encodeURIComponent(query) + "&per_page=" + perPage + "&orientation=" + orientation,
      { headers: { Authorization: key } }
    );
    var data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream failed: " + e.message });
  }
}

// Returns raw audio bytes (base64-wrapped in JSON) rather than streaming,
// since this handler must return a single JSON-compatible response like
// every other branch here — the client decodes the base64 back to a Blob.
async function handleElevenLabsSpeak(req, res) {
  if (rateLimitExceeded(req, res, 60000, 15)) return;
  var key = process.env.ELEVENLABS_API_KEY;
  if (!key) return res.status(500).json({ error: "ELEVENLABS_API_KEY not configured" });
  var text = (req.body && req.body.text) || "";
  var voiceId = (req.body && req.body.voice_id) || "21m00Tcm4TlvDq8ikWAM";
  if (!text) return res.status(400).json({ error: "Missing text" });
  if (text.length > 2500) return res.status(413).json({ error: "Text too long (max 2500 chars)" });
  try {
    var upstream = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId + "/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "audio/mpeg", "xi-api-key": key },
      body: JSON.stringify({
        text: text,
        model_id: (req.body && req.body.model_id) || "eleven_multilingual_v2",
        voice_settings: (req.body && req.body.voice_settings) || undefined,
      }),
    });
    if (!upstream.ok) {
      var errText = await upstream.text().catch(function () { return ""; });
      return res.status(upstream.status).json({ error: "ElevenLabs error: " + errText });
    }
    var buf = Buffer.from(await upstream.arrayBuffer());
    res.status(200).json({ audio_base64: buf.toString("base64"), mime_type: "audio/mpeg" });
  } catch (e) {
    res.status(502).json({ error: "Upstream failed: " + e.message });
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  var provider = (req.query && req.query.provider) || "groq";
  if (provider === "gemini") return handleGeminiGenerate(req, res);
  if (provider === "unsplash") return handleUnsplashSearch(req, res);
  if (provider === "pexels") return handlePexelsSearch(req, res);
  if (provider === "elevenlabs") return handleElevenLabsSpeak(req, res);

  if (rateLimitExceeded(req, res, 60000, 20)) return;

  var key = process.env.GROQ_API_KEY;
  if (!key) return res.status(500).json({ error: "GROQ_API_KEY not configured" });

  var body = req.body;
  if (!body || !body.messages) return res.status(400).json({ error: "Missing messages" });

  // Body size limits — prevent oversized / abuse payloads
  var rawLen = JSON.stringify(body).length;
  if (rawLen > 50000) return res.status(413).json({ error: "Request too large" });
  if (!Array.isArray(body.messages)) return res.status(400).json({ error: "messages must be an array" });
  if (body.messages.length > 20) return res.status(400).json({ error: "Too many messages (max 20)" });
  for (var mi = 0; mi < body.messages.length; mi++) {
    var msg = body.messages[mi];
    if (!msg || typeof msg.content !== "string") return res.status(400).json({ error: "Invalid message" });
    if (msg.content.length > 6000) return res.status(400).json({ error: "Message too long (max 6000 chars)" });
  }

  var allowed = ["llama-3.3-70b-versatile", "llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768"];
  var model = body.model || "llama-3.3-70b-versatile";
  if (allowed.indexOf(model) === -1) return res.status(400).json({ error: "Model not allowed" });

  try {
    var upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({
        model: model,
        messages: body.messages,
        temperature: body.temperature !== undefined ? body.temperature : 0.4,
        max_tokens: Math.min(body.max_tokens || 900, 2000),
      }),
    });
    var data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream failed: " + e.message });
  }
};
