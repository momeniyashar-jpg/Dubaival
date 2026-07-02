// Google OAuth — exchanges code for Gmail refresh token, stores per user
// POST { code, userId, redirectUri }
var shared = require("./lib/shared.js");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  var body = req.body || {};
  var code = body.code;
  var userId = body.userId;
  var redirectUri = body.redirectUri || "https://www.dubaival.com/callback";
  var clientId = process.env.GOOGLE_CLIENT_ID;
  var clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code || !userId) return res.status(400).json({ error: "Missing code or userId" });
  if (!clientId || !clientSecret) return res.status(500).json({ error: "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not configured" });

  try {
    // Exchange code for tokens
    var tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "code=" + encodeURIComponent(code) +
        "&client_id=" + encodeURIComponent(clientId) +
        "&client_secret=" + encodeURIComponent(clientSecret) +
        "&redirect_uri=" + encodeURIComponent(redirectUri) +
        "&grant_type=authorization_code"
    });
    var tokens = await tokenResp.json();
    if (!tokens.refresh_token) return res.status(400).json({ error: tokens.error_description || "No refresh token. Try revoking app access and reconnecting." });

    // Get user's Gmail address
    var profileResp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: "Bearer " + tokens.access_token }
    });
    var profile = profileResp.ok ? await profileResp.json() : {};
    var gmailEmail = profile.emailAddress || null;

    // Store refresh token + gmail email in social_credentials
    var creds = {
      gmail_refresh_token: tokens.refresh_token,
      gmail_email: gmailEmail,
      updated_at: new Date().toISOString()
    };

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

    return res.status(200).json({ ok: true, gmail: gmailEmail });
  } catch (e) {
    console.error("oauth-google error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
