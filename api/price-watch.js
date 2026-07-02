// Price watch — subscribe (POST) and unsubscribe (GET ?token=)
var shared = require("./lib/shared.js");

var UNSUB_BASE = "https://www.dubaival.com/api/price-watch?token=";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── UNSUBSCRIBE (GET ?token=...) ────────────────────────────────────────────
  if (req.method === "GET") {
    var token = req.query && req.query.token;
    if (!token) return res.status(400).send("Missing token.");
    try {
      await shared.supabaseRequest("/price_watches?unsubscribe_token=eq." + encodeURIComponent(token), {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ active: false })
      });
    } catch (e) {}
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(
      "<!doctype html><html><body style=\"font-family:Arial,sans-serif;text-align:center;padding:60px;background:#08090C;color:#F0F2F5\">" +
      "<h2 style=\"color:#C9A84C\">Unsubscribed</h2>" +
      "<p>You won't receive any more price alerts for this watch.</p>" +
      "<a href=\"https://www.dubaival.com\" style=\"color:#C9A84C\">Back to DubAIVal</a>" +
      "</body></html>"
    );
  }

  // ── SUBSCRIBE (POST) ─────────────────────────────────────────────────────────
  if (req.method !== "POST") return res.status(405).end();

  try {
    var body = req.body || {};
    var email = (body.email || "").trim().toLowerCase();
    var targetName = (body.targetName || "").trim();
    var targetType = body.targetType;
    var area = body.area || null;

    if (!email || !email.includes("@") || !targetName || (targetType !== "building" && targetType !== "area")) {
      return res.status(400).json({ ok: false, error: "Invalid input" });
    }

    var insertResp = await shared.supabaseRequest("/price_watches", {
      method: "POST",
      headers: { Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify([{ email: email, target_type: targetType, target_name: targetName, area: area }])
    });

    if (!insertResp.ok) return res.status(500).json({ ok: false, error: "Could not save watch" });

    var rows = await insertResp.json();
    var row = rows && rows[0];

    if (row && row.unsubscribe_token) {
      var unsubUrl = UNSUB_BASE + row.unsubscribe_token;
      await shared.sendEmail(
        email,
        "You're watching " + targetName + " on DubAIVal",
        "<div style=\"font-family:Arial,sans-serif;color:#111\">" +
          "<h2 style=\"color:#C9A84C\">Price alert set up</h2>" +
          "<p>We'll email you if pricing for <b>" + targetName + "</b> moves 5% or more.</p>" +
          "<p style=\"font-size:12px;color:#888\"><a href=\"" + unsubUrl + "\">Unsubscribe</a></p>" +
          "</div>"
      );
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};
