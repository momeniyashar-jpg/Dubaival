// Meta OAuth — exchanges authorization code for page tokens, stores per user
// POST { code, userId, redirectUri }
var shared = require("../lib/shared.js");

var GRAPH = "https://graph.facebook.com/v25.0";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  var body = req.body || {};
  var code = body.code;
  var userId = body.userId;
  var redirectUri = body.redirectUri || "https://www.dubaival.com/callback";
  var appId = process.env.META_APP_ID;
  var appSecret = process.env.META_APP_SECRET;

  if (!code || !userId) return res.status(400).json({ error: "Missing code or userId" });
  if (!appId || !appSecret) return res.status(500).json({ error: "META_APP_ID/META_APP_SECRET not configured" });

  try {
    // Step 1: exchange code for short-lived user token
    var r1 = await fetch(GRAPH + "/oauth/access_token?client_id=" + appId +
      "&client_secret=" + appSecret +
      "&redirect_uri=" + encodeURIComponent(redirectUri) +
      "&code=" + encodeURIComponent(code));
    var d1 = await r1.json();
    if (!d1.access_token) return res.status(400).json({ error: d1.error || "Token exchange failed" });
    var shortToken = d1.access_token;

    // Step 2: exchange for long-lived user token (60 days)
    var r2 = await fetch(GRAPH + "/oauth/access_token?grant_type=fb_exchange_token&client_id=" + appId +
      "&client_secret=" + appSecret + "&fb_exchange_token=" + shortToken);
    var d2 = await r2.json();
    var longToken = d2.access_token || shortToken;

    // Step 3: get user's pages + page tokens
    var r3 = await fetch(GRAPH + "/me/accounts?access_token=" + longToken + "&limit=20");
    var d3 = await r3.json();
    var pages = (d3.data || []);
    if (!pages.length) return res.status(400).json({ error: "No Facebook pages found. Make sure you have a Facebook Page." });

    // Use first page (or user can select later)
    var page = pages[0];
    var fbId = page.id;
    var pageToken = page.access_token;

    // Step 4: get Instagram Business Account linked to this page
    var r4 = await fetch(GRAPH + "/" + fbId + "?fields=instagram_business_account&access_token=" + pageToken);
    var d4 = await r4.json();
    var igId = (d4.instagram_business_account && d4.instagram_business_account.id) || null;

    // Step 5: store in social_credentials for this user
    var creds = { ig_token: pageToken, fb_id: fbId, updated_at: new Date().toISOString() };
    if (igId) creds.ig_id = igId;

    // Try update first, then insert
    var resp = await shared.supabaseRequest(
      "/social_credentials?user_id=eq." + encodeURIComponent(userId),
      { method: "GET" }
    );
    var existing = resp.ok ? await resp.json() : [];

    if (existing.length) {
      await shared.supabaseRequest(
        "/social_credentials?user_id=eq." + encodeURIComponent(userId),
        { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(creds) }
      );
    } else {
      await shared.supabaseRequest("/social_credentials", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(Object.assign({ user_id: userId }, creds))
      });
    }

    return res.status(200).json({
      ok: true,
      fb_id: fbId,
      ig_id: igId,
      page_name: page.name,
      pages: pages.map(function(p) { return { id: p.id, name: p.name }; })
    });
  } catch (e) {
    console.error("oauth-meta error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
