// Server-side functions for AI Chief of Staff (Vercel Hobby: 12-function
// limit — this file's job broadened from "just the embedding endpoint" to
// "Chiefs server functions" for that reason, same pattern used by
// api/proxy-groq.js's provider switch and api/inbox.js's action switch).
//
// GET/POST ?action= (default = embed, for backward compatibility — every
// existing caller never sends this param):
//   (default) embed  → generate a Gemini/Jina embedding vector
//     Body: { text: string, taskType?: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" }
//     Returns: { embedding: float[] | null }
//   concierge-save    → the ONLY write path for the public, no-sign-in AI
//     Concierge chat (js/chiefs.js's renderConciergePage()/conciergeSend()).
//     See that action's own comment below for why this must be a validated
//     server endpoint using the service-role key, never a bare client-side
//     REST insert with the anon key.
//
// Embedding action fails soft: if no embedding provider is configured,
// returns { embedding: null } so callers gracefully degrade to rule-based
// matching.

var embeddings = require("./_lib/embeddings.js");
var shared = require("./_lib/shared.js");
var { rateLimitExceeded } = require("./_lib/ratelimit");

async function handleEmbed(req, res) {
  if (rateLimitExceeded(req, res, 60000, 60)) return;
  var body = req.body || {};
  var text = String(body.text || "").trim();
  if (!text) return res.status(400).json({ error: "text required" });

  if (!embeddings.hasProvider()) {
    return res.status(200).json({ embedding: null });
  }
  try {
    var taskType = body.taskType === "RETRIEVAL_QUERY" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT";
    var embedding = await embeddings.embedText(text.slice(0, 3000), taskType);
    return res.status(200).json({ embedding: embedding || null });
  } catch (e) {
    return res.status(200).json({ embedding: null });
  }
}

// Node port of js/chiefs.js's _scoreMatch(client, listing) — kept
// deliberately identical in logic (not imported, since this runs in a
// separate Node/browser runtime pair) so a Concierge-created client scores
// against inventory exactly the same way the real Auto-Matching Engine does
// everywhere else in this tab.
function _scoreMatchServer(client, listing) {
  if (client.purpose !== listing.purpose) return null;
  if (listing.status !== "available" && listing.status !== "pocket") return null;
  var score = 0, reasons = [];
  var areas = Array.isArray(client.areas_wanted) ? client.areas_wanted : [];
  if (areas.length > 0) {
    var aMatch = areas.some(function (a) { return a && listing.area && a.toLowerCase() === listing.area.toLowerCase(); });
    if (!aMatch) return null;
    score += 40; reasons.push("Area: " + listing.area);
  } else { score += 15; }
  if (client.beds_wanted && listing.beds) {
    if (client.beds_wanted === listing.beds) { score += 25; reasons.push("Beds: " + listing.beds); }
    else score -= 10;
  }
  var price = Number(listing.price) || 0;
  if (price > 0) {
    var minP = Number(client.min_price) || 0;
    var maxP = Number(client.max_price) || Infinity;
    if (price >= minP && price <= maxP) { score += 25; reasons.push("In budget: AED " + price.toLocaleString()); }
    else if (maxP !== Infinity && price > maxP * 1.12) return null;
    else if (price < minP * 0.88) score -= 5;
  }
  if (client.prop_type && listing.prop_type && client.prop_type === listing.prop_type) {
    score += 10; reasons.push("Type: " + listing.prop_type);
  }
  return score >= 40 ? { score: Math.min(100, Math.max(0, score)), reasons: reasons } : null;
}

// ── ACTION: concierge-save ───────────────────────────────────────────────────
// The AI Concierge (js/chiefs.js CONCIERGE_STATE/renderConciergePage()) is a
// PUBLIC, no-sign-in-required chat page — a shareable link
// (dubaival.com/#concierge=<agentId>) any cold prospect can open. Before
// 2026-07-19 this saved a new lead directly from the visitor's own browser
// using the Supabase ANON key, which only worked because chiefs_clients/
// chiefs_matches RLS was a blanket "allow all" policy — real client PII
// written by a totally unauthenticated caller. Once that RLS was tightened
// to real per-agent ownership (auth.uid()=agent_id — see
// supabase-chiefs-security-lockdown.sql), an anonymous visitor's browser can
// no longer write to those tables at all, by design. This endpoint is the
// new, sole write path for the Concierge flow: it runs server-side with the
// SERVICE ROLE key (bypasses RLS deliberately, the same way every other
// privileged write in this project does — e.g. the admin RPCs), but unlike
// a bare client insert, every write here is validated and rate-limited
// first, so a public unauthenticated surface can never become an arbitrary
// write primitive into someone else's real business data.
async function handleConciergeSave(req, res) {
  // Generous but real: a genuine multi-turn conversation naturally re-checks
  // this once per exchange, but nothing legitimate needs more than a
  // handful of saves per minute from one visitor.
  if (rateLimitExceeded(req, res, 60000, 10)) return;

  var body = req.body || {};
  var agentId = String(body.agentId || "").trim();
  var clientName = String(body.clientName || "").trim().slice(0, 200);
  var clientPhone = body.clientPhone ? String(body.clientPhone).replace(/[^\d+]/g, "").slice(0, 30) : null;
  var clientEmail = body.clientEmail ? String(body.clientEmail).trim().slice(0, 200) : null;

  if (!agentId) return res.status(400).json({ error: "agentId required" });
  if (!clientName) return res.status(400).json({ error: "clientName required" });
  if (!clientPhone && !clientEmail) return res.status(400).json({ error: "phone or email required" });

  var purpose = body.purpose === "rent" ? "rent" : "sale";
  var propType = ["apartment", "villa", "townhouse", "penthouse"].indexOf(body.propType) !== -1 ? body.propType : "apartment";
  var bedsWanted = typeof body.bedsWanted === "string" ? body.bedsWanted.slice(0, 20) : null;
  var areasWanted = Array.isArray(body.areasWanted) ? body.areasWanted.filter(function (a) { return a && typeof a === "string"; }).slice(0, 5).map(function (a) { return a.slice(0, 80); }) : null;
  var minPrice = Number(body.minPrice) || null;
  var maxPrice = Number(body.maxPrice) || null;
  var rawConversation = typeof body.rawConversation === "string" ? body.rawConversation.slice(0, 3000) : null;
  var notes = typeof body.notes === "string" ? body.notes.slice(0, 1000) : null;

  var row = {
    agent_id: agentId, client_name: clientName,
    client_phone: clientPhone, client_email: clientEmail,
    purpose: purpose, prop_type: propType,
    beds_wanted: bedsWanted, areas_wanted: areasWanted,
    min_price: minPrice, max_price: maxPrice,
    timeline: "flexible", status: "active", source: "livechat",
    raw_conversation: rawConversation, notes: notes,
    updated_at: new Date().toISOString(),
  };

  try {
    var saveResp = await shared.supabaseRequest("/chiefs_clients", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    if (!saveResp.ok) {
      var errText = await saveResp.text().catch(function () { return ""; });
      console.error("concierge-save insert failed:", saveResp.status, errText);
      return res.status(502).json({ error: "Could not save — please try again." });
    }
    var saved = await saveResp.json();
    var savedRow = Array.isArray(saved) && saved[0];
    if (!savedRow) return res.status(502).json({ error: "Could not save — please try again." });

    // Embed + match against the SAME target agent's own inventory —
    // fetched server-side too, never trusting client-supplied listing data
    // for scoring (a malicious visitor could otherwise fabricate a
    // high-score "match" against a listing they invented).
    var matchesFound = 0;
    try {
      var invResp = await shared.supabaseRequest(
        "/chiefs_inventory?agent_id=eq." + encodeURIComponent(agentId) + "&status=in.(available,pocket)&select=id,area,beds,price,purpose,prop_type&limit=100",
        { method: "GET" }
      );
      var listings = invResp.ok ? await invResp.json() : [];
      var newMatches = [];
      listings.forEach(function (listing) {
        var ms = _scoreMatchServer(row, listing);
        if (ms) newMatches.push({ agent_id: agentId, client_id: savedRow.id, inventory_id: listing.id, match_score: ms.score, match_reasons: ms.reasons, status: "new" });
      });
      if (newMatches.length) {
        var matchResp = await shared.supabaseRequest("/chiefs_matches", {
          method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(newMatches),
        });
        if (matchResp.ok) matchesFound = newMatches.length;
      }
    } catch (e) { console.error("concierge-save matching error:", e.message); }

    // Embedding for the agent's own later semantic auto-match runs —
    // fire-and-forget, never blocks the response the visitor is waiting on.
    if (embeddings.hasProvider()) {
      var summaryText = ["Looking for", bedsWanted, propType, "to", purpose === "rent" ? "rent" : "buy",
        areasWanted && areasWanted.length ? "in " + areasWanted.join(", ") : "",
        maxPrice ? "budget up to AED " + maxPrice : "", notes || ""].filter(Boolean).join(" ");
      embeddings.embedText(summaryText.slice(0, 3000), "RETRIEVAL_QUERY").then(function (emb) {
        if (!emb) return;
        return shared.supabaseRequest("/chiefs_clients?id=eq." + savedRow.id, {
          method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ embedding: emb }),
        });
      }).catch(function () {});
    }

    return res.status(200).json({ ok: true, clientId: savedRow.id, matchesFound: matchesFound });
  } catch (e) {
    console.error("concierge-save error:", e.message);
    return res.status(500).json({ error: "Something went wrong — please try again." });
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,apikey");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  var action = (req.query && req.query.action) || "embed";
  if (action === "concierge-save") return handleConciergeSave(req, res);
  return handleEmbed(req, res);
};
