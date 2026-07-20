// Unified Inbox system (Hobby plan: 12 function limit) — consolidates what were
// 6 separate, never-deployed files under api_disabled/ (oauth-meta, oauth-google,
// meta-webhook, gmail-poll, email-inbox, send-email-replies) plus the existing
// reply-email.js, into one function so no new Vercel function slot is needed.
//
// Actions (all via ?action=):
//   GET  ?action=config          → {meta_app_id, google_client_id} for OAuth buttons
//   POST ?action=oauth-meta      → exchange Meta code for page/IG tokens (from callback.html)
//   POST ?action=oauth-google    → exchange Google code for a Gmail refresh token (from callback.html)
//   GET  ?action=meta-webhook    → Meta webhook subscription verification
//   POST ?action=meta-webhook    → Meta webhook events (Instagram/Facebook DMs + comments)
//   POST ?action=email-inbound   → inbound email webhook (Brevo/similar inbound-parse provider)
//   GET  ?action=gmail-poll      → cron: poll each connected user's Gmail for new mail
//   GET  ?action=send-replies    → cron: AI auto-reply to unanswered emails
//   POST ?action=reply (default) → manual agent reply to an email, sent from the Inbox UI
//
// Fixed while consolidating: oauth-meta.js/meta-webhook.js disagreed on column
// names (meta_access_token/meta_fb_page_id/meta_ig_id vs the real schema's
// ig_token/ig_id/fb_id — the same columns js/chat.js's manual-token-paste flow
// already reads/writes); oauth-google.js/gmail-poll.js used google_refresh_token/
// google_email, but the actual migration added gmail_refresh_token/gmail_email.
// Both are now consistently ig_token/ig_id/fb_id and gmail_refresh_token/gmail_email.

var shared = require("./_lib/shared");
var { rateLimitExceeded } = require("./_lib/ratelimit");
var { fetchKnowledgeContextServer } = require("./_lib/rag");
var crypto = require("crypto");

function _readRawBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    req.on("data", function (c) { chunks.push(c); });
    req.on("end", function () { resolve(Buffer.concat(chunks)); });
    req.on("error", reject);
  });
}

var GRAPH_BASE = "https://graph.facebook.com/v25.0";
var GROQ_KEY = process.env.GROQ_API_KEY;
var META_WEBHOOK_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN || "dubaival_meta_webhook_2026";
var SUPABASE_ANON_KEY = "sb_publishable_HNHSNnmBUYcTnF35bMEzxA_qhsoe6Yj";

async function _resolveUserId(accessToken) {
  if (!accessToken) return null;
  try {
    var r = await fetch(shared.SUPABASE_URL + "/auth/v1/user", {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + accessToken },
    });
    if (!r.ok) return null;
    var d = await r.json();
    return d && (d.email || d.id) ? (d.email || d.id) : null;
  } catch (e) {
    return null;
  }
}

// Separate from _resolveUserId above (which prefers email, for the existing
// email_inbox/social_credentials user_id convention) — the whatsapp_credits
// RPCs below key off user_profiles.id, the real Supabase auth UUID, so this
// always returns the UUID specifically, never an email.
async function _resolveAuthUid(accessToken) {
  if (!accessToken) return null;
  try {
    var r = await fetch(shared.SUPABASE_URL + "/auth/v1/user", {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + accessToken },
    });
    if (!r.ok) return null;
    var d = await r.json();
    return d && d.id ? d.id : null;
  } catch (e) {
    return null;
  }
}

function stripHtml(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 5000);
}

function parseFromHeader(fromStr) {
  fromStr = String(fromStr || "");
  var match = fromStr.match(/<([^>]+)>/);
  var email = match ? match[1] : fromStr.trim();
  var name = fromStr.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || null;
  return { email: email, name: name };
}

function buildEmailHtml(reply, agentName) {
  var lines = String(reply || "").split("\n").map(function (l) {
    return "<p style='margin:0 0 10px'>" + l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</p>";
  }).join("");
  return [
    "<div style='font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#222'>",
    "<div style='background:#070B14;padding:20px 24px;border-radius:8px 8px 0 0'>",
    "<img src='https://www.dubaival.com/logo.png' alt='DubAIVal' style='height:40px'>",
    "</div>",
    "<div style='padding:24px;background:#fff;border-radius:0 0 8px 8px'>",
    lines,
    "<hr style='border:none;border-top:1px solid #eee;margin:20px 0'>",
    agentName ? "<p style='color:#555;font-size:13px'>" + agentName + "</p>" : "",
    "<p style='color:#888;font-size:12px'>DubAIVal — AI-Powered Dubai Real Estate Valuations<br>",
    "<a href='https://www.dubaival.com' style='color:#D4AF37'>www.dubaival.com</a></p>",
    "</div></div>",
  ].join("");
}

// RAG-grounded system prompt base — shared by email + social replies so a
// client hears from the SAME real-estate-specialist AI regardless of which
// channel they wrote in, not a generic chatbot that "just answers to answer"
// (the exact gap this was built to close — see CLAUDE.md work log).
var REPLY_BASE_PERSONA =
  "You are DubAIVal's real estate AI agent — a genuine Dubai property specialist, not a generic support bot. " +
  "Ground every factual claim (prices, yields, growth, areas, regulations) in the verified knowledge provided below when it's relevant; " +
  "if nothing relevant was provided, answer from general Dubai real estate expertise but never invent specific numbers you're not sure of. " +
  "Speak with the tone, precision, and confidence of an experienced Dubai property consultant — never a flat, generic customer-service reply.";

async function _groundedSystemPrompt(basePrompt, queryText) {
  var sys = basePrompt;
  try {
    var context = await fetchKnowledgeContextServer(queryText);
    if (context) {
      sys =
        sys +
        "\n\nRelevant up-to-date Dubai real estate knowledge (from live news and daily market data — use only if genuinely helpful, ignore if irrelevant):\n" +
        context;
    }
  } catch (e) {
    // Grounding is best-effort — never block a reply on RAG failing.
  }
  return sys;
}

async function generateAIEmailReply(fromName, subject, bodyText) {
  if (!GROQ_KEY) return null;
  try {
    var queryText = (subject || "") + " " + (bodyText || "").slice(0, 1500);
    var sys = await _groundedSystemPrompt(
      REPLY_BASE_PERSONA +
        " Reply to client emails professionally and helpfully. Be warm, professional, concise (under 250 words). " +
        "Reply in the same language as the client. Sign off as 'The DubAIVal Team | www.dubaival.com'. " +
        "Do NOT include generic pleasantries like 'I hope this email finds you well'. Get straight to the point.",
      queryText
    );
    var r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: "From: " + (fromName || "Client") + "\nSubject: " + subject + "\n\n" + (bodyText || "").slice(0, 1500) },
        ],
        max_tokens: 350,
        temperature: 0.7,
      }),
    });
    var d = await r.json();
    return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || null;
  } catch (e) {
    return null;
  }
}

async function generateAISocialReply(platform, eventType, senderName, messageText) {
  if (!GROQ_KEY) return null;
  try {
    var sys = await _groundedSystemPrompt(
      REPLY_BASE_PERSONA +
        " Help clients with property valuations, investment advice, area comparisons, off-plan projects, rental yields, and Dubai property market questions. " +
        "Be warm, professional, and concise. Reply in the same language as the user (Arabic, English, or Farsi). Keep replies under 200 words. " +
        "Platform: " + platform + ", Type: " + eventType,
      messageText
    );
    var r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: (senderName ? senderName + " says: " : "") + messageText },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });
    var d = await r.json();
    return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || null;
  } catch (e) {
    return null;
  }
}

// ── ACTION: config ───────────────────────────────────────────────────────────
async function handleConfig(req, res) {
  return res.status(200).json({
    meta_app_id: process.env.META_APP_ID || "",
    google_client_id: process.env.GOOGLE_CLIENT_ID || "",
  });
}

// ── ACTION: oauth-meta ────────────────────────────────────────────────────────
async function handleOauthMeta(req, res) {
  var body = req.body || {};
  var code = body.code, userId = body.userId;
  var redirectUri = body.redirectUri || "https://www.dubaival.com/callback";
  var appId = process.env.META_APP_ID, appSecret = process.env.META_APP_SECRET;

  if (!code || !userId) return res.status(400).json({ error: "Missing code or userId" });
  if (!appId || !appSecret) return res.status(500).json({ error: "META_APP_ID/META_APP_SECRET not configured" });

  try {
    var r1 = await fetch(GRAPH_BASE + "/oauth/access_token?client_id=" + appId +
      "&client_secret=" + appSecret + "&redirect_uri=" + encodeURIComponent(redirectUri) +
      "&code=" + encodeURIComponent(code));
    var d1 = await r1.json();
    if (!d1.access_token) return res.status(400).json({ error: (d1.error && d1.error.message) || "Token exchange failed" });
    var shortToken = d1.access_token;

    var r2 = await fetch(GRAPH_BASE + "/oauth/access_token?grant_type=fb_exchange_token&client_id=" + appId +
      "&client_secret=" + appSecret + "&fb_exchange_token=" + shortToken);
    var d2 = await r2.json();
    var longToken = d2.access_token || shortToken;

    var r3 = await fetch(GRAPH_BASE + "/me/accounts?access_token=" + longToken + "&limit=20");
    var d3 = await r3.json();
    var pages = d3.data || [];
    if (!pages.length) return res.status(400).json({ error: "No Facebook pages found. Make sure you have a Facebook Page." });

    var page = pages[0];
    var fbId = page.id, pageToken = page.access_token;

    var r4 = await fetch(GRAPH_BASE + "/" + fbId + "?fields=instagram_business_account&access_token=" + pageToken);
    var d4 = await r4.json();
    var igId = (d4.instagram_business_account && d4.instagram_business_account.id) || null;

    var creds = { ig_token: pageToken, fb_id: fbId, updated_at: new Date().toISOString() };
    if (igId) creds.ig_id = igId;

    // A correctly configured app-level webhook (callback URL + verify token
    // in the Meta App Dashboard) is not enough — each individual Page must
    // also be subscribed to the app before Meta will actually deliver DM/
    // comment events for it. Do that now, right after we have a page token.
    try {
      await fetch(GRAPH_BASE + "/" + fbId + "/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed&access_token=" + pageToken, { method: "POST" });
    } catch (e) { /* connect still succeeds; page just won't receive webhook events until retried */ }

    var existResp = await shared.supabaseRequest("/social_credentials?user_id=eq." + encodeURIComponent(userId), { method: "GET" });
    var existing = existResp.ok ? await existResp.json() : [];
    if (existing.length) {
      await shared.supabaseRequest("/social_credentials?user_id=eq." + encodeURIComponent(userId), {
        method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(creds),
      });
    } else {
      await shared.supabaseRequest("/social_credentials", {
        method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(Object.assign({ user_id: userId }, creds)),
      });
    }

    return res.status(200).json({ ok: true, fb_id: fbId, ig_id: igId, ig_token: pageToken, page_name: page.name });
  } catch (e) {
    console.error("oauth-meta error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}

// ── ACTION: oauth-google ──────────────────────────────────────────────────────
async function handleOauthGoogle(req, res) {
  var body = req.body || {};
  var code = body.code, userId = body.userId;
  var redirectUri = body.redirectUri || "https://www.dubaival.com/callback";
  var clientId = process.env.GOOGLE_CLIENT_ID, clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code || !userId) return res.status(400).json({ error: "Missing code or userId" });
  if (!clientId || !clientSecret) return res.status(500).json({ error: "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not configured" });

  try {
    var tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "code=" + encodeURIComponent(code) + "&client_id=" + encodeURIComponent(clientId) +
        "&client_secret=" + encodeURIComponent(clientSecret) + "&redirect_uri=" + encodeURIComponent(redirectUri) +
        "&grant_type=authorization_code",
    });
    var tokens = await tokenResp.json();
    if (!tokens.refresh_token) return res.status(400).json({ error: tokens.error_description || "No refresh token. Try revoking app access and reconnecting." });

    var profileResp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: "Bearer " + tokens.access_token },
    });
    var profile = profileResp.ok ? await profileResp.json() : {};
    var gmailEmail = profile.emailAddress || null;

    var creds = { gmail_refresh_token: tokens.refresh_token, gmail_email: gmailEmail, updated_at: new Date().toISOString() };
    var existResp = await shared.supabaseRequest("/social_credentials?user_id=eq." + encodeURIComponent(userId), { method: "GET" });
    var existing = existResp.ok ? await existResp.json() : [];
    if (existing.length) {
      await shared.supabaseRequest("/social_credentials?user_id=eq." + encodeURIComponent(userId), {
        method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(creds),
      });
    } else {
      await shared.supabaseRequest("/social_credentials", {
        method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(Object.assign({ user_id: userId }, creds)),
      });
    }

    return res.status(200).json({ ok: true, gmail: gmailEmail });
  } catch (e) {
    console.error("oauth-google error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}

// ── ACTION: meta-webhook ──────────────────────────────────────────────────────
async function findUserByPage(pageId, igId) {
  try {
    var query = "/social_credentials?select=user_id,ig_token,ig_id,fb_id,auto_reply_instagram,auto_reply_facebook";
    query += igId ? "&or=(ig_id.eq." + igId + ",fb_id.eq." + pageId + ")" : "&fb_id=eq." + pageId;
    var resp = await shared.supabaseRequest(query, { method: "GET" });
    if (!resp.ok) return null;
    var rows = await resp.json();
    return rows.length ? rows[0] : null;
  } catch (e) {
    return null;
  }
}

// A toggle column absent (pre-migration row) or explicitly null defaults to
// enabled — matches this project's automation-first convention (CLAUDE.md
// Directive #3: default leans toward automatic, agent must deliberately
// switch a process to manual). Only an explicit `false` disables it.
function _autoReplyOn(val) {
  return val !== false;
}

async function replyInstagramDM(igId, recipientId, message, token) {
  if (!token || !igId) return;
  await fetch(GRAPH_BASE + "/" + igId + "/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text: message }, access_token: token }),
  });
}
async function replyFacebookDM(recipientId, message, token) {
  if (!token) return;
  await fetch(GRAPH_BASE + "/me/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text: message }, access_token: token }),
  });
}
async function replyFacebookComment(commentId, message, token) {
  if (!token) return;
  await fetch(GRAPH_BASE + "/" + commentId + "/comments", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message, access_token: token }),
  });
}
// Instagram Graph API replies to a comment via POST /{ig-comment-id}/replies
// — a genuinely different endpoint shape from Facebook's /{comment-id}/comments,
// not something replyFacebookComment() can be reused for.
async function replyInstagramComment(commentId, message, token) {
  if (!token || !commentId) return;
  await fetch(GRAPH_BASE + "/" + commentId + "/replies", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message, access_token: token }),
  });
}

// autoReplyEnabled: the per-agent, per-platform toggle (auto_reply_instagram/
// auto_reply_facebook on social_credentials, defaulted via _autoReplyOn()).
// When false, the message is still logged to social_inbox (status "new") so
// nothing is ever lost — it just isn't auto-answered, matching this file's
// "manual" convention elsewhere: AI prepares nothing, a human replies from
// the Inbox UI instead.
async function handleSocialEvent(userId, pageToken, igAccountId, platform, eventType, senderId, senderName, messageText, messageId, threadId, postId, rawPayload, autoReplyEnabled) {
  if (!messageText || messageText.trim() === "") return;
  var aiReply = autoReplyEnabled === false ? null : await generateAISocialReply(platform, eventType, senderName, messageText);
  var row = {
    user_id: userId || "default", platform: platform, event_type: eventType,
    sender_id: senderId, sender_name: senderName || null, thread_id: threadId || null,
    message_id: messageId || (platform + "_" + senderId + "_" + Date.now()),
    message_text: messageText.slice(0, 2000), post_id: postId || null,
    status: aiReply ? "replied" : "new", ai_reply: aiReply || null,
    replied_at: aiReply ? new Date().toISOString() : null,
    raw_payload: rawPayload ? JSON.stringify(rawPayload) : null,
  };
  try {
    await shared.supabaseRequest("/social_inbox", {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row),
    });
  } catch (e) {}
  if (aiReply) {
    try {
      if (platform === "instagram" && eventType === "dm") await replyInstagramDM(igAccountId, senderId, aiReply, pageToken);
      else if (platform === "instagram" && eventType === "comment") await replyInstagramComment(postId, aiReply, pageToken);
      else if (platform === "facebook" && eventType === "dm") await replyFacebookDM(senderId, aiReply, pageToken);
      else if (platform === "facebook" && eventType === "comment") await replyFacebookComment(postId, aiReply, pageToken);
    } catch (e) {}
  }
}

async function handleMetaWebhook(req, res) {
  if (req.method === "GET") {
    var mode = req.query["hub.mode"], token = req.query["hub.verify_token"], challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === META_WEBHOOK_VERIFY_TOKEN) return res.status(200).send(challenge);
    return res.status(403).json({ error: "Forbidden" });
  }
  if (rateLimitExceeded(req, res, 60000, 120)) return;
  try {
    var body = req.body || {};
    if (body.object === "instagram") {
      var entries = body.entry || [];
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i], pageId = entry.id, messaging = entry.messaging || [];
        for (var j = 0; j < messaging.length; j++) {
          var msg = messaging[j];
          if (msg.message && msg.message.text) {
            var igId = msg.recipient && msg.recipient.id;
            var creds = await findUserByPage(pageId, igId);
            await handleSocialEvent(
              creds && creds.user_id, creds && creds.ig_token, creds && creds.ig_id,
              "instagram", "dm", String((msg.sender && msg.sender.id) || ""), null,
              msg.message.text, msg.message.mid || null, (msg.sender && msg.sender.id) || null, null, msg,
              _autoReplyOn(creds && creds.auto_reply_instagram)
            );
          }
        }
        // Instagram comments — a real, previously-missing gap: unlike
        // Facebook below (which already handles both entry.messaging AND
        // entry.changes/field=feed), Instagram DMs were the only event type
        // ever processed here. Instagram's own webhook delivers comment
        // events via field="comments" on the same entry.changes shape.
        var igChanges = entry.changes || [];
        for (var ic = 0; ic < igChanges.length; ic++) {
          var igChange = igChanges[ic];
          if (igChange.field === "comments" && igChange.value && igChange.value.text) {
            var igVal = igChange.value;
            // For Instagram, entry.id IS the IG-scoped account id (same
            // convention the DM branch above relies on) — pass it as both
            // args so the lookup checks ig_id (where these credentials are
            // actually stored) rather than only the fb_id fallback column.
            // igVal.media.id is the MEDIA the comment was posted on, not the
            // connected account, and would never match ig_id/fb_id at all.
            var igCommentCreds = await findUserByPage(pageId, pageId);
            await handleSocialEvent(
              igCommentCreds && igCommentCreds.user_id, igCommentCreds && igCommentCreds.ig_token, igCommentCreds && igCommentCreds.ig_id,
              "instagram", "comment", String((igVal.from && igVal.from.id) || ""), (igVal.from && igVal.from.username) || null,
              igVal.text, igVal.id || null, null, igVal.id || null, igVal,
              _autoReplyOn(igCommentCreds && igCommentCreds.auto_reply_instagram)
            );
          }
        }
      }
    }
    if (body.object === "page") {
      var fbEntries = body.entry || [];
      for (var fi = 0; fi < fbEntries.length; fi++) {
        var fbEntry = fbEntries[fi], fbPageId = fbEntry.id;
        var fbCreds = await findUserByPage(fbPageId, null);
        var fbAutoReply = _autoReplyOn(fbCreds && fbCreds.auto_reply_facebook);
        var fbMessaging = fbEntry.messaging || [];
        for (var fj = 0; fj < fbMessaging.length; fj++) {
          var fbMsg = fbMessaging[fj];
          if (fbMsg.message && fbMsg.message.text) {
            await handleSocialEvent(
              fbCreds && fbCreds.user_id, fbCreds && fbCreds.ig_token, null,
              "facebook", "dm", String((fbMsg.sender && fbMsg.sender.id) || ""), null,
              fbMsg.message.text, fbMsg.message.mid || null, (fbMsg.sender && fbMsg.sender.id) || null, null, fbMsg,
              fbAutoReply
            );
          }
        }
        var changes = fbEntry.changes || [];
        for (var fk = 0; fk < changes.length; fk++) {
          var change = changes[fk];
          if (change.field === "feed" && change.value) {
            var val = change.value;
            if ((val.item === "comment" || val.item === "post") && val.verb === "add" && val.message) {
              await handleSocialEvent(
                fbCreds && fbCreds.user_id, fbCreds && fbCreds.ig_token, null,
                "facebook", "comment", String((val.from && val.from.id) || ""), (val.from && val.from.name) || null,
                val.message, val.comment_id || val.post_id || null, null, val.comment_id || val.post_id || null, val,
                fbAutoReply
              );
            }
          }
        }
      }
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("meta-webhook error:", e.message);
    return res.status(200).json({ ok: true }); // always 200 to Meta
  }
}

// ── ACTION: whatsapp-webhook / whatsapp-send ──────────────────────────────────
// WhatsApp Business API (Meta Cloud API) — unlike Instagram/Facebook DMs
// above (free to send via a connected Page token), Meta bills real money per
// 24h conversation window, so every send here is gated behind the
// whatsapp_credits pay-per-use balance (supabase-whatsapp-credits-schema.sql)
// instead of being unconditionally free like the rest of this file.
var WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || META_WEBHOOK_VERIFY_TOKEN;

async function findCredsByWhatsAppPhoneId(phoneId) {
  try {
    var resp = await shared.supabaseRequest(
      "/social_credentials?whatsapp_phone_id=eq." + encodeURIComponent(phoneId) +
      "&select=user_id,whatsapp_token,whatsapp_phone_id,auto_reply_whatsapp",
      { method: "GET" }
    );
    if (!resp.ok) return null;
    var rows = await resp.json();
    return rows.length ? rows[0] : null;
  } catch (e) {
    return null;
  }
}

async function sendWhatsAppMessage(phoneId, token, to, text) {
  var r = await fetch(GRAPH_BASE + "/" + phoneId + "/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "text", text: { body: text } }),
  });
  var d = await r.json();
  if (!r.ok || d.error) throw new Error((d.error && d.error.message) || "WhatsApp send failed (HTTP " + r.status + ")");
  return d;
}

// Looks up the real Supabase auth UUID that owns a given social_credentials
// row (whose user_id column stores email, per _resolveUserId's convention
// above) — needed since the whatsapp_credits RPCs key off user_profiles.id
// (a UUID), not the email string social_credentials itself uses.
async function _authUidForEmail(email) {
  if (!email) return null;
  try {
    var resp = await shared.supabaseRequest("/user_profiles?email=eq." + encodeURIComponent(email) + "&select=id", { method: "GET" });
    if (!resp.ok) return null;
    var rows = await resp.json();
    return rows.length ? rows[0].id : null;
  } catch (e) {
    return null;
  }
}

async function handleWhatsAppWebhook(req, res) {
  if (req.method === "GET") {
    var mode = req.query["hub.mode"], token = req.query["hub.verify_token"], challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) return res.status(200).send(challenge);
    return res.status(403).json({ error: "Forbidden" });
  }
  if (rateLimitExceeded(req, res, 60000, 120)) return;
  try {
    var body = req.body || {};
    var entries = body.entry || [];
    for (var i = 0; i < entries.length; i++) {
      var changes = entries[i].changes || [];
      for (var j = 0; j < changes.length; j++) {
        var value = (changes[j] && changes[j].value) || {};
        var phoneId = value.metadata && value.metadata.phone_number_id;
        var messages = value.messages || [];
        if (!phoneId || !messages.length) continue;
        var creds = await findCredsByWhatsAppPhoneId(phoneId);
        var contactName = (value.contacts && value.contacts[0] && value.contacts[0].profile && value.contacts[0].profile.name) || null;
        for (var k = 0; k < messages.length; k++) {
          var msg = messages[k];
          var from = msg.from;

          // OTP tap-to-confirm ("✅ This is me") — only meaningful on our OWN
          // platform WhatsApp number, never on an individual agent's own
          // connected number (that has nothing to do with account sign-up).
          // Must run before the `!text` continue below, since a template
          // quick-reply button tap arrives with no msg.text at all — a
          // template button reply is `type:"button"` with `button.payload`;
          // an interactive quick-reply is `interactive.button_reply.id`.
          // Checking both shapes defensively since this couldn't be tested
          // against a live Meta webhook in this sandbox.
          if (PLATFORM_WHATSAPP_PHONE_ID && phoneId === PLATFORM_WHATSAPP_PHONE_ID) {
            var tapPayload = (msg.button && msg.button.payload) || (msg.interactive && msg.interactive.button_reply && msg.interactive.button_reply.id) || null;
            if (tapPayload) {
              try { await _consumeOtpButtonTap(from, tapPayload); } catch (e) { console.error("otp button-tap error:", e.message); }
              continue; // never log an OTP confirmation tap as a normal inbox message
            }
          }

          var text = msg.text && msg.text.body;
          if (!text) continue; // images/voice/etc. not handled yet — logged nowhere, matches "text only" scope of the rest of this file

          // Per-agent manual/automatic toggle — checked BEFORE the window
          // gate below so a disabled toggle never spends a real credit on
          // an AI reply that will just be discarded. When off, the message
          // is still logged (status "new") for the agent to answer manually
          // from the Inbox UI — matches this file's "manual" convention.
          var whatsappAutoReplyOn = _autoReplyOn(creds && creds.auto_reply_whatsapp);

          // Window gate BEFORE spending anything on an AI reply — matches
          // Meta's real per-24h-conversation-window billing (not per
          // message): if this contact already has an active window today,
          // ensure_whatsapp_window() reports allowed=true/credit_consumed
          // =false and this reply is free, already paid for. A message with
          // no credit left to open a NEW window is still logged (status
          // "new") so it's never silently lost, it just doesn't get an
          // automatic reply.
          var authUid = whatsappAutoReplyOn && creds ? await _authUidForEmail(creds.user_id) : null;
          var hadWindow = false, windowCreditConsumed = false;
          if (authUid) {
            var windowResp = await shared.supabaseRequest("/rpc/ensure_whatsapp_window", {
              method: "POST", body: JSON.stringify({ p_user_id: authUid, p_contact_phone: from }),
            });
            var windowRows = windowResp.ok ? await windowResp.json() : [];
            var windowResult = windowRows[0] || {};
            hadWindow = !!windowResult.allowed;
            windowCreditConsumed = !!windowResult.credit_consumed;
          }

          var aiReply = null;
          if (hadWindow) {
            try {
              aiReply = await generateAISocialReply("whatsapp", "dm", contactName, text);
              if (aiReply && creds.whatsapp_token) {
                await sendWhatsAppMessage(phoneId, creds.whatsapp_token, from, aiReply);
              } else {
                aiReply = null; // nothing actually sent — refund below
              }
            } catch (e) {
              aiReply = null; // send failed downstream — refund the credit, never charge for a failed send
            }
            // Only refund when THIS call newly opened the window (spent a
            // credit) — reusing an already-open window never needs one.
            if (!aiReply && windowCreditConsumed && authUid) {
              try { await shared.supabaseRequest("/rpc/refund_whatsapp_window", { method: "POST", body: JSON.stringify({ p_user_id: authUid, p_contact_phone: from }) }); } catch (e) {}
            }
          }

          var row = {
            user_id: (creds && creds.user_id) || "default", platform: "whatsapp", event_type: "dm",
            sender_id: from, sender_name: contactName, thread_id: from,
            message_id: msg.id || ("whatsapp_" + from + "_" + Date.now()),
            message_text: text.slice(0, 2000), status: aiReply ? "replied" : "new",
            ai_reply: aiReply || null, replied_at: aiReply ? new Date().toISOString() : null,
            raw_payload: JSON.stringify(msg),
            // Present only when this conversation started from a Click-to-
            // WhatsApp ad — carries the ctwa_clid the Conversions API needs
            // to attribute a later conversion back to that specific ad.
            ad_referral: msg.referral || null,
          };
          try {
            var insResp = await shared.supabaseRequest("/social_inbox", {
              method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row),
            });
            if (!insResp.ok) {
              var insErrText = await insResp.text();
              console.error("whatsapp-webhook social_inbox insert failed:", insResp.status, insErrText);
            }
          } catch (e) { console.error("whatsapp-webhook social_inbox insert threw:", e.message); }
        }
      }
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("whatsapp-webhook error:", e.message);
    return res.status(200).json({ ok: true }); // always 200 to Meta
  }
}

// Manual/AI-drafted outbound send — used by the Inbox reply box and AI Chief
// of Staff's WhatsApp drafter, both of which currently only open a wa.me deep
// link for the agent to send by hand. This is the real, credit-gated
// server-side send those call sites can opt into instead.
async function handleWhatsAppSend(req, res) {
  if (rateLimitExceeded(req, res, 60000, 20)) return;
  var body = req.body || {};
  var authUid = await _resolveAuthUid(body.access_token);
  if (!authUid) return res.status(401).json({ error: "Please sign in to send a WhatsApp message." });

  var to = String(body.to || "").replace(/\D/g, "");
  var text = (body.message || "").trim();
  if (!to || !text) return res.status(400).json({ error: "Missing recipient or message" });

  try {
    var emailResp = await shared.supabaseRequest("/user_profiles?id=eq." + authUid + "&select=email", { method: "GET" });
    var emailRows = emailResp.ok ? await emailResp.json() : [];
    var email = emailRows.length ? emailRows[0].email : null;
    var credsResp = email ? await shared.supabaseRequest("/social_credentials?user_id=eq." + encodeURIComponent(email) + "&select=whatsapp_token,whatsapp_phone_id", { method: "GET" }) : null;
    var credsRows = credsResp && credsResp.ok ? await credsResp.json() : [];
    var creds = credsRows.length ? credsRows[0] : null;
    if (!creds || !creds.whatsapp_token || !creds.whatsapp_phone_id) {
      return res.status(400).json({ error: "Connect WhatsApp Business API first in Social Setup." });
    }

    // Same 24h-conversation-window gate as the webhook path above — a
    // manual reply to a contact already inside an active window (e.g. the
    // agent replying minutes after that contact's own inbound message
    // opened one) costs nothing extra.
    var windowResp = await shared.supabaseRequest("/rpc/ensure_whatsapp_window", {
      method: "POST", body: JSON.stringify({ p_user_id: authUid, p_contact_phone: to }),
    });
    var windowRows = windowResp.ok ? await windowResp.json() : [];
    var windowResult = windowRows[0] || {};
    if (!windowResult.allowed) {
      return res.status(402).json({ error: "No WhatsApp credits left — buy a credit to send more messages.", needsCredit: true });
    }

    try {
      await sendWhatsAppMessage(creds.whatsapp_phone_id, creds.whatsapp_token, to, text);
    } catch (sendErr) {
      if (windowResult.credit_consumed) {
        try { await shared.supabaseRequest("/rpc/refund_whatsapp_window", { method: "POST", body: JSON.stringify({ p_user_id: authUid, p_contact_phone: to }) }); } catch (e) {}
      }
      return res.status(502).json({ error: sendErr.message });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("whatsapp-send error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}

// ── ACTION: meta-conversion ──────────────────────────────────────────────────
// Reports a real conversion (a new Client Memory Bank record saved from a
// Click-to-WhatsApp ad conversation) back to Meta's Conversions API, so ad
// targeting/optimization gets the actual outcome — not just "someone
// clicked," but "this became a real lead." Same idea as competitor products
// like YCloud, built directly into AI Chief of Staff per the user's
// explicit direction, since this tab is the one place a "new client saved"
// event is genuinely known.
//
// Fails soft everywhere (never blocks the caller's own client-save flow):
// no ctwa_clid, no configured Pixel/token, or a failed Graph API call all
// just return ok:false with a reason, never a thrown error.
async function handleMetaConversion(req, res) {
  if (rateLimitExceeded(req, res, 60000, 30)) return;
  try {
    var body = req.body || {};
    var ctwaClid = body.ctwa_clid;
    if (!ctwaClid) return res.status(200).json({ ok: false, reason: "no ad attribution on this contact" });

    var userId = await _resolveUserId(body.access_token);
    if (!userId) return res.status(401).json({ ok: false, reason: "not signed in" });

    var credsResp = await shared.supabaseRequest(
      "/social_credentials?user_id=eq." + encodeURIComponent(userId) + "&select=meta_pixel_id,meta_capi_token",
      { method: "GET" }
    );
    var credsRows = credsResp.ok ? await credsResp.json() : [];
    var creds = credsRows[0];
    if (!creds || !creds.meta_pixel_id || !creds.meta_capi_token) {
      return res.status(200).json({ ok: false, reason: "Meta Ads Pixel not connected — set it up in Social Setup" });
    }

    var crypto = require("crypto");
    var userData = { ctwa_clid: String(ctwaClid) };
    if (body.phone) {
      // Meta requires PII hashed before it ever leaves our server — digits
      // only (country code included, no leading +), then SHA-256.
      var normalizedPhone = String(body.phone).replace(/\D/g, "");
      if (normalizedPhone) userData.ph = [crypto.createHash("sha256").update(normalizedPhone).digest("hex")];
    }

    var eventBody = {
      data: [{
        event_name: body.event_name || "Lead",
        event_time: Math.floor(Date.now() / 1000),
        action_source: "business_messaging",
        messaging_channel: "whatsapp",
        user_data: userData,
      }],
    };
    var capiResp = await fetch(
      "https://graph.facebook.com/v19.0/" + encodeURIComponent(creds.meta_pixel_id) + "/events?access_token=" + encodeURIComponent(creds.meta_capi_token),
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(eventBody) }
    );
    if (!capiResp.ok) {
      var errText = await capiResp.text().catch(function () { return ""; });
      console.error("meta-conversion CAPI error:", capiResp.status, errText);
      return res.status(200).json({ ok: false, reason: "Meta rejected the event" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("meta-conversion error:", e.message);
    return res.status(200).json({ ok: false, reason: e.message });
  }
}

// ── ACTION: send-otp / verify-otp ─────────────────────────────────────────────
// Shared, reusable OTP primitive backing the "zero-touch onboarding" standing
// directive (CLAUDE.md #4) — a user's identity for a phone number or email is
// confirmed ONLY via a one-time code we send, never by asking them to fetch
// or paste anything from a 3rd-party developer dashboard. Used by Sign Up
// (js/auth.js) today for phone verification; any future "confirm you own
// this contact" step anywhere in the app should reuse these two actions
// rather than inventing a new one.
var PLATFORM_WHATSAPP_PHONE_ID = process.env.DV_PLATFORM_WHATSAPP_PHONE_ID;
var PLATFORM_WHATSAPP_TOKEN = process.env.DV_PLATFORM_WHATSAPP_TOKEN;
var OTP_WHATSAPP_TEMPLATE = process.env.DV_OTP_WHATSAPP_TEMPLATE_NAME || "otp_verification";
var OTP_WHATSAPP_LANG = process.env.DV_OTP_WHATSAPP_TEMPLATE_LANG || "en_US";
// Optional: a Utility-category template with ONE quick-reply button (e.g.
// "✅ This is me"). If the operator sets this up and configures its name
// here, phone verification becomes a genuine single TAP with zero typing —
// the button's reply arrives back through the normal WhatsApp webhook and
// is auto-matched against the pending OTP row (see the button-tap handling
// inside handleWhatsAppWebhook below). Meta restricts its "Authentication"
// template category to code-delivery mechanics only (no custom buttons),
// so a tap-to-confirm experience specifically needs a Utility template —
// this is a real, separate template from OTP_WHATSAPP_TEMPLATE above, not a
// variant of it. Falls back to the code-based Authentication template
// (still fully supported, unchanged) whenever this isn't configured.
var OTP_WHATSAPP_TAP_TEMPLATE = process.env.DV_OTP_WHATSAPP_TAP_TEMPLATE_NAME;
var DV_SITE_ORIGIN = process.env.DV_SITE_ORIGIN || "https://www.dubaival.com";

// ── AI Voice Concierge (ElevenLabs Conversational AI) ─────────────────────
// See supabase-voice-agent-schema.sql and CLAUDE.md for the full design.
// ELEVENLABS_AGENT_LLM/ELEVENLABS_VOICE_ID are tunable once the operator has
// a live account and can see which LLM/voice options their plan offers —
// gemini-2.0-flash is a reasonable, fast default, not a confirmed final choice.
var ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
var ELEVENLABS_WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET || "";
var ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "";
var ELEVENLABS_LLM = process.env.ELEVENLABS_AGENT_LLM || "gemini-2.0-flash";
var ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

// Real-time voice persona — same "genuine specialist, not a generic bot"
// bar as REPLY_BASE_PERSONA above, adapted for a live phone call: short
// spoken sentences, no markdown (everything is read aloud by TTS), and
// explicit instructions on when to call each of the 2 webhook tools an
// operator attaches to this agent in the ElevenLabs dashboard (see
// handleVoiceAdminSetupAgent's returned nextSteps for the exact URLs).
// {{agentName}}/{{agentId}}/{{creditsAvailable}} are dynamic variables this
// agent receives per-call from action=voice-init below.
var VOICE_AGENT_SYSTEM_PROMPT =
  "You are DubaiVal's AI Voice Concierge — a real, knowledgeable Dubai real estate consultant speaking on the phone on behalf of {{agentName}}, a real estate agent. " +
  "Speak naturally and conversationally, in short sentences — this is a live phone call, not a chat message. Never use markdown, asterisks, numbered lists, or bullet points; everything you say will be spoken aloud. " +
  "You genuinely know Dubai real estate — areas, buildings, rental yields, price trends, off-plan projects, RERA/DLD basics — with the tone and confidence of an experienced consultant, never a flat customer-service script. " +
  "When the caller asks a factual question about a specific area, building, price, or yield, call the lookup_market_knowledge tool to ground your answer in real, current data before answering — never guess a specific number you are not sure of. " +
  "Your goal on every call: naturally understand what the caller is looking for (buy or rent, area, budget, bedrooms, timeline), and the moment you have their name plus a phone number or email, call the save_lead tool right away so " +
  "{{agentName}} can follow up personally — do this naturally as part of the conversation, never interrogate the caller with a rigid list of questions. " +
  "If {{creditsAvailable}} is false, politely explain this line is temporarily unavailable, offer to take a short message (name and number), and end the call warmly without further back-and-forth. " +
  "If {{agentId}} is empty, you have no specific agent to route this call to — help the caller generally and suggest they call back or visit dubaival.com.";

function _dig(obj, paths) {
  for (var i = 0; i < paths.length; i++) {
    var parts = paths[i].split(".");
    var cur = obj;
    for (var j = 0; j < parts.length && cur; j++) cur = cur[parts[j]];
    if (cur !== undefined && cur !== null && cur !== "") return cur;
  }
  return null;
}

// ElevenLabs signs webhooks as "t={unix},v0={hmac-sha256 hex}" over the
// string "{t}.{rawBody}" — same general scheme as Stripe's (see
// api/billing.js verifyStripeSignature), confirmed against ElevenLabs' own
// docs, just a different window (30 min) and field name (v0, not v1).
// Degrades to "allow" (not "deny") when the secret isn't configured yet, so
// this is usable the moment the operator has a live ElevenLabs account —
// matching the same graceful-degradation convention used for
// WHATSAPP_VERIFY_TOKEN/META_WEBHOOK_VERIFY_TOKEN above.
function _verifyElevenLabsSignature(rawBody, sigHeader, secret) {
  if (!secret) return true;
  if (!sigHeader) return false;
  var parts = {};
  sigHeader.split(",").forEach(function (p) {
    var kv = p.split("=");
    if (kv.length === 2) parts[kv[0]] = kv[1];
  });
  if (!parts.t || !parts.v0) return false;
  var ageSeconds = Math.abs(Date.now() / 1000 - Number(parts.t));
  if (isNaN(ageSeconds) || ageSeconds > 1800) return false;
  var signedPayload = parts.t + "." + (rawBody ? rawBody.toString("utf8") : "");
  var expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  var a = Buffer.from(expected, "utf8");
  var b = Buffer.from(parts.v0, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Reverse of _authUidForEmail() above — resolves the real email a
// social_credentials row is keyed by (that table's user_id column, per this
// file's established convention) from a real Supabase auth UUID, needed
// since voice_calls/chiefs_clients key agent identity by UUID text while
// social_credentials (where the per-agent voice_auto_save_extracted toggle
// lives) keys by email.
async function _emailForAuthUid(uuid) {
  if (!uuid) return null;
  try {
    var resp = await shared.supabaseRequest("/user_profiles?id=eq." + encodeURIComponent(uuid) + "&select=email,name", { method: "GET" });
    if (!resp.ok) return null;
    var rows = await resp.json();
    return rows.length ? rows[0] : null;
  } catch (e) {
    return null;
  }
}

// Sends a WhatsApp "Authentication" category template message carrying a
// one-time code. Unlike sendWhatsAppMessage() above (plain text, used for
// agent<->client chat inside an already-open 24h conversation window), a
// brand-new signup contact has no open window with our platform's own
// WhatsApp number — Meta only allows a business to message a number that
// has never messaged us first via a pre-approved template. The component
// shape below (body variable + copy-code button) matches Meta's standard
// Authentication template format; this could not be tested against a real,
// approved Meta template in this sandbox, so if the operator's actual
// template differs, adjust `components` to match what Meta actually expects.
async function sendWhatsAppOtpTemplate(to, code) {
  var r = await fetch(GRAPH_BASE + "/" + PLATFORM_WHATSAPP_PHONE_ID + "/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + PLATFORM_WHATSAPP_TOKEN },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: OTP_WHATSAPP_TEMPLATE,
        language: { code: OTP_WHATSAPP_LANG },
        components: [
          { type: "body", parameters: [{ type: "text", text: code }] },
          { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
        ],
      },
    }),
  });
  var d = await r.json();
  if (!r.ok || d.error) throw new Error((d.error && d.error.message) || "WhatsApp OTP send failed (HTTP " + r.status + ")");
  return d;
}

// Sends the tap-to-confirm variant: a Utility template whose one quick-reply
// button carries `buttonToken` as its payload. When the user taps it in
// WhatsApp (no typing at all), Meta sends the payload back to our webhook —
// see the button-tap branch in handleWhatsAppWebhook, which matches it
// against the pending otp_verifications row and marks it verified
// automatically. Component/button shape for a Quick Reply button on a
// Utility template; adjust to match the operator's actual approved template
// if it differs — not tested against a live Meta template in this sandbox.
async function sendWhatsAppOtpTapTemplate(to, buttonToken) {
  var r = await fetch(GRAPH_BASE + "/" + PLATFORM_WHATSAPP_PHONE_ID + "/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + PLATFORM_WHATSAPP_TOKEN },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: OTP_WHATSAPP_TAP_TEMPLATE,
        language: { code: OTP_WHATSAPP_LANG },
        components: [
          { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: buttonToken }] },
        ],
      },
    }),
  });
  var d = await r.json();
  if (!r.ok || d.error) throw new Error((d.error && d.error.message) || "WhatsApp tap-to-confirm send failed (HTTP " + r.status + ")");
  return d;
}

function _otpNormalizeContact(type, value) {
  if (type === "phone") return String(value || "").replace(/\D/g, "");
  return String(value || "").trim().toLowerCase();
}

function _otpLinkPage(ok, message) {
  return "<!doctype html><html><body style=\"font-family:sans-serif;background:#070B14;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0\">" +
    "<div style=\"text-align:center;max-width:340px;padding:24px\">" +
    "<div style=\"font-size:40px;margin-bottom:12px\">" + (ok ? "✅" : "⚠️") + "</div>" +
    "<p style=\"color:" + (ok ? "#10B981" : "#EF4444") + ";font-size:15px;line-height:1.5\">" + message + "</p></div></body></html>";
}

// Looks up the caller's OWN pending row and marks it verified via whichever
// signal proves ownership — a matching typed code, a matching button tap, or
// a matching magic-link token. Shared by handleVerifyOtp/handleVerifyOtpLink/
// the button-tap branch in handleWhatsAppWebhook so all 3 confirmation paths
// funnel through one consistent state transition.
async function _markOtpRowVerified(row) {
  return shared.supabaseRequest("/otp_verifications?id=eq." + row.id, {
    method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ verified_at: new Date().toISOString() }),
  });
}

async function handleSendOtp(req, res) {
  if (rateLimitExceeded(req, res, 60000, 10)) return;
  try {
    var body = req.body || {};
    var contactType = body.contact_type;
    var purpose = body.purpose || "signup";
    if (contactType !== "email" && contactType !== "phone") {
      return res.status(400).json({ error: "contact_type must be 'email' or 'phone'" });
    }
    var contact = _otpNormalizeContact(contactType, body.contact_value);
    if (!contact || (contactType === "email" && !/.+@.+\..+/.test(contact)) || (contactType === "phone" && contact.length < 8)) {
      return res.status(400).json({ error: "Please enter a valid " + contactType });
    }

    // Per-contact throttle (independent of the per-IP limiter above) — stops
    // someone from OTP-bombing one specific phone/email from many IPs.
    var recentResp = await shared.supabaseRequest(
      "/otp_verifications?contact_type=eq." + contactType +
        "&contact_value=eq." + encodeURIComponent(contact) +
        "&created_at=gte." + new Date(Date.now() - 15 * 60000).toISOString() +
        "&select=id",
      { method: "GET" }
    );
    var recentRows = recentResp.ok ? await recentResp.json() : [];
    if (recentRows.length >= 3) {
      return res.status(429).json({ error: "Too many codes requested — please wait a few minutes and try again." });
    }

    var crypto = require("crypto");
    var code = String(Math.floor(100000 + Math.random() * 900000));
    var codeHash = crypto.createHash("sha256").update(code).digest("hex");
    // One-tap alternatives to typing — added so "just click Connect" is a
    // real, zero-typing option, not just the typed-code fallback.
    var buttonToken = crypto.randomBytes(16).toString("hex");
    var linkToken = crypto.randomBytes(24).toString("hex");
    var linkTokenHash = crypto.createHash("sha256").update(linkToken).digest("hex");
    var expiresAt = new Date(Date.now() + 10 * 60000).toISOString();

    var insertResp = await shared.supabaseRequest("/otp_verifications", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ contact_type: contactType, contact_value: contact, code_hash: codeHash, button_token: buttonToken, link_token_hash: linkTokenHash, purpose: purpose, expires_at: expiresAt }),
    });
    if (!insertResp.ok) return res.status(500).json({ error: "Could not create verification code" });

    if (contactType === "email") {
      var verifyUrl = DV_SITE_ORIGIN + "/api/inbox?action=verify-otp-link&token=" + linkToken + "&contact=" + encodeURIComponent(contact) + "&purpose=" + encodeURIComponent(purpose);
      var sent = await shared.sendEmail(
        contact,
        "Your DubaiVal verification code",
        "<div style=\"font-family:sans-serif;padding:24px\"><h2 style=\"color:#0D1220\">Verify your email</h2>" +
          "<p style=\"margin:16px 0\"><a href=\"" + verifyUrl + "\" style=\"display:inline-block;background:#D4AF37;color:#0D1220;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700\">Verify Instantly →</a></p>" +
          "<p style=\"color:#556677;font-size:12px\">Or, if you prefer, enter this code instead:</p>" +
          "<p style=\"font-size:28px;letter-spacing:6px;font-weight:700;color:#D4AF37\">" + code + "</p>" +
          "<p style=\"color:#556677\">This expires in 10 minutes. If you didn't request this, you can ignore this email.</p></div>"
      );
      if (!sent) return res.status(502).json({ error: "Could not send the verification email right now" });
    } else {
      if (!PLATFORM_WHATSAPP_PHONE_ID || !PLATFORM_WHATSAPP_TOKEN) {
        return res.status(503).json({ error: "WhatsApp verification isn't set up yet — please use email instead", code: "whatsapp_otp_unavailable" });
      }
      try {
        if (OTP_WHATSAPP_TAP_TEMPLATE) {
          await sendWhatsAppOtpTapTemplate(contact, buttonToken); // real single-tap, zero typing
        } else {
          await sendWhatsAppOtpTemplate(contact, code); // fallback: typed code
        }
      } catch (e) {
        console.error("send-otp whatsapp error:", e.message);
        return res.status(502).json({ error: "Could not send the WhatsApp code right now — please try email instead" });
      }
    }
    return res.status(200).json({ ok: true, tapMode: contactType === "phone" && !!OTP_WHATSAPP_TAP_TEMPLATE });
  } catch (e) {
    console.error("send-otp error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}

// Email magic link — clicking it (a plain GET, works from any inbox with no
// typing at all) verifies the same row a typed code or button tap would.
async function handleVerifyOtpLink(req, res) {
  try {
    var token = req.query.token;
    var contact = _otpNormalizeContact("email", req.query.contact || "");
    var purpose = req.query.purpose || "signup";
    if (!token || !contact) return res.status(400).send(_otpLinkPage(false, "This link is missing information — please request a new one."));
    var crypto = require("crypto");
    var tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    var resp = await shared.supabaseRequest(
      "/otp_verifications?contact_type=eq.email&contact_value=eq." + encodeURIComponent(contact) +
        "&purpose=eq." + encodeURIComponent(purpose) +
        "&link_token_hash=eq." + tokenHash + "&verified_at=is.null&order=created_at.desc&limit=1",
      { method: "GET" }
    );
    var rows = resp.ok ? await resp.json() : [];
    var row = rows[0];
    if (!row) return res.status(400).send(_otpLinkPage(false, "This link is invalid or was already used — please request a new one."));
    if (new Date(row.expires_at).getTime() < Date.now()) return res.status(400).send(_otpLinkPage(false, "This link has expired — please request a new code."));
    await _markOtpRowVerified(row);
    return res.status(200).send(_otpLinkPage(true, "Verified! You can close this tab and go back to DubaiVal — it will pick this up automatically."));
  } catch (e) {
    return res.status(500).send(_otpLinkPage(false, "Something went wrong — please request a new code."));
  }
}

// Matches an inbound WhatsApp quick-reply button tap (payload = the
// button_token we sent) against a pending OTP row for that phone and marks
// it verified — the real, zero-typing "tap ✅ This is me" confirmation path.
// Called from inside handleWhatsAppWebhook, ONLY for messages arriving on
// our own platform WhatsApp number (never on an individual agent's own
// connected number, which has nothing to do with account sign-up). A tap
// with no matching/expired row is silently ignored (could be a stale or
// duplicate retry) — never surfaced as an error back to Meta.
async function _consumeOtpButtonTap(phone, token) {
  var contact = _otpNormalizeContact("phone", phone);
  var resp = await shared.supabaseRequest(
    "/otp_verifications?contact_type=eq.phone&contact_value=eq." + encodeURIComponent(contact) +
      "&button_token=eq." + encodeURIComponent(token) + "&verified_at=is.null&order=created_at.desc&limit=1",
    { method: "GET" }
  );
  var rows = resp.ok ? await resp.json() : [];
  var row = rows[0];
  if (!row) return;
  if (new Date(row.expires_at).getTime() < Date.now()) return;
  await _markOtpRowVerified(row);
}

// Lets the client auto-detect verification with no further action from the
// user — polled while a code/link/tap is pending, regardless of WHICH of
// the 3 confirmation paths the user actually used.
async function handleOtpStatus(req, res) {
  if (rateLimitExceeded(req, res, 60000, 60)) return;
  try {
    var contactType = req.query.contact_type;
    var purpose = req.query.purpose || "signup";
    if (contactType !== "email" && contactType !== "phone") return res.status(400).json({ error: "contact_type must be 'email' or 'phone'" });
    var contact = _otpNormalizeContact(contactType, req.query.contact_value || "");
    if (!contact) return res.status(400).json({ error: "Missing contact_value" });
    var resp = await shared.supabaseRequest(
      "/otp_verifications?contact_type=eq." + contactType + "&contact_value=eq." + encodeURIComponent(contact) +
        "&purpose=eq." + encodeURIComponent(purpose) + "&order=created_at.desc&limit=1&select=verified_at",
      { method: "GET" }
    );
    var rows = resp.ok ? await resp.json() : [];
    return res.status(200).json({ verified: !!(rows[0] && rows[0].verified_at) });
  } catch (e) {
    return res.status(200).json({ verified: false });
  }
}

async function handleVerifyOtp(req, res) {
  if (rateLimitExceeded(req, res, 60000, 20)) return;
  try {
    var body = req.body || {};
    var contactType = body.contact_type;
    var purpose = body.purpose || "signup";
    var code = String(body.code || "").trim();
    if (contactType !== "email" && contactType !== "phone") return res.status(400).json({ ok: false, error: "contact_type must be 'email' or 'phone'" });
    var contact = _otpNormalizeContact(contactType, body.contact_value);
    if (!contact || !code) return res.status(400).json({ ok: false, error: "Missing contact or code" });

    var resp = await shared.supabaseRequest(
      "/otp_verifications?contact_type=eq." + contactType +
        "&contact_value=eq." + encodeURIComponent(contact) +
        "&purpose=eq." + encodeURIComponent(purpose) +
        "&verified_at=is.null&order=created_at.desc&limit=1",
      { method: "GET" }
    );
    var rows = resp.ok ? await resp.json() : [];
    var row = rows[0];
    if (!row) return res.status(400).json({ ok: false, error: "No pending code for this contact — request a new one" });
    if (new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ ok: false, error: "Code expired — request a new one" });
    if (row.attempts >= 5) return res.status(429).json({ ok: false, error: "Too many attempts — request a new code" });

    var crypto = require("crypto");
    var codeHash = crypto.createHash("sha256").update(code).digest("hex");
    if (codeHash !== row.code_hash) {
      await shared.supabaseRequest("/otp_verifications?id=eq." + row.id, {
        method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ attempts: row.attempts + 1 }),
      });
      return res.status(400).json({ ok: false, error: "Incorrect code" });
    }

    await shared.supabaseRequest("/otp_verifications?id=eq." + row.id, {
      method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ verified_at: new Date().toISOString() }),
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("verify-otp error:", e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}

// ── ACTION: email-inbound ─────────────────────────────────────────────────────
// NOTE: unlike gmail-poll (which knows the owning user_id from the
// social_credentials row it polled), a generic inbound-parse webhook has no
// per-user routing info — it only knows a shared "to" address. Rows written
// here are stored without a user_id and will not appear in any signed-in
// user's per-account Inbox view (js/inbox.js filters by user_id). This path
// only makes sense today for a single shared support inbox read directly
// from Supabase; per-agent inbound email is handled via gmail-poll instead.
async function handleEmailInbound(req, res) {
  if (rateLimitExceeded(req, res, 60000, 60)) return;
  try {
    var body = req.body || {};
    var fromRaw = body.From || body.from || body.sender || "";
    var parsed = parseFromHeader(fromRaw);
    var fromEmail = parsed.email, fromName = parsed.name;
    var toEmail = body.To || body.to || body.recipient || "";
    var toMatch = String(toEmail).match(/<([^>]+)>/);
    if (toMatch) toEmail = toMatch[1];
    var subject = body.Subject || body.subject || "(No subject)";
    var bodyText = (body.TextBody || body.text_body || body.text || body["body-plain"] || "").slice(0, 8000);
    var bodyHtml = body.HtmlBody || body.html_body || body["body-html"] || null;
    if (bodyHtml) bodyHtml = stripHtml(bodyHtml);
    var messageId = body.MessageID || body.message_id || body["Message-Id"] || body["Message-ID"] || (fromEmail + "_" + Date.now());
    if (!fromEmail) return res.status(400).json({ error: "No sender" });

    var row = {
      from_email: fromEmail, from_name: fromName || fromEmail.split("@")[0], to_email: toEmail,
      subject: subject, body_text: bodyText, body_html: bodyHtml, status: "new",
      message_id: messageId, received_at: new Date().toISOString(),
    };
    await shared.supabaseRequest("/email_inbox", {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row),
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("email-inbound error:", e.message);
    return res.status(200).json({ ok: true }); // always 200
  }
}

// ── ACTION: gmail-poll (cron) ──────────────────────────────────────────────────
async function refreshGoogleAccessToken(refreshToken) {
  var r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(refreshToken) +
      "&client_id=" + encodeURIComponent(process.env.GOOGLE_CLIENT_ID) +
      "&client_secret=" + encodeURIComponent(process.env.GOOGLE_CLIENT_SECRET),
  });
  var d = await r.json();
  return d.access_token || null;
}
function decodeBase64Url(str) {
  try { return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"); } catch (e) { return ""; }
}
function extractGmailBody(payload) {
  if (!payload) return "";
  if (payload.body && payload.body.data) return decodeBase64Url(payload.body.data);
  if (payload.parts) {
    for (var i = 0; i < payload.parts.length; i++) {
      var part = payload.parts[i];
      if (part.mimeType === "text/plain" && part.body && part.body.data) return decodeBase64Url(part.body.data);
    }
    for (var j = 0; j < payload.parts.length; j++) {
      var p2 = payload.parts[j];
      if (p2.mimeType === "text/html" && p2.body && p2.body.data) return decodeBase64Url(p2.body.data).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
  }
  return "";
}
function getGmailHeader(headers, name) {
  var h = (headers || []).find(function (x) { return x.name.toLowerCase() === name.toLowerCase(); });
  return h ? h.value : "";
}
async function pollUserGmail(userId, refreshToken, gmailEmail, deadline) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return;
  var accessToken = await refreshGoogleAccessToken(refreshToken);
  if (!accessToken) return;

  var listResp = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=" + encodeURIComponent("is:unread in:inbox newer_than:1d") + "&maxResults=20",
    { headers: { Authorization: "Bearer " + accessToken } }
  );
  if (!listResp.ok) return;
  var messages = ((await listResp.json()).messages) || [];

  for (var i = 0; i < messages.length; i++) {
    if (Date.now() > deadline) break; // time-budget guard — resume next hour
    try {
      var msgResp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + messages[i].id + "?format=full", {
        headers: { Authorization: "Bearer " + accessToken },
      });
      if (!msgResp.ok) continue;
      var msg = await msgResp.json();
      var headers = (msg.payload && msg.payload.headers) || [];
      var fromRaw = getGmailHeader(headers, "From");
      var fromMatch = fromRaw.match(/<([^>]+)>/);
      var fromEmail = fromMatch ? fromMatch[1] : fromRaw.trim();
      var fromName = fromRaw.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || null;
      var subject = getGmailHeader(headers, "Subject") || "(No subject)";
      var messageId = getGmailHeader(headers, "Message-Id") || msg.id;
      var bodyText = extractGmailBody(msg.payload).slice(0, 8000);
      var threadId = msg.threadId || null;
      if (fromEmail && gmailEmail && fromEmail.toLowerCase() === gmailEmail.toLowerCase()) continue;

      var row = {
        user_id: userId, from_email: fromEmail, from_name: fromName || (fromEmail ? fromEmail.split("@")[0] : "Unknown"),
        to_email: gmailEmail || "", subject: subject, body_text: bodyText, status: "new",
        message_id: messageId, thread_id: threadId, received_at: new Date(parseInt(msg.internalDate, 10)).toISOString(),
      };
      await shared.supabaseRequest("/email_inbox", {
        method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row),
      });
      await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + msg.id + "/modify", {
        method: "POST", headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
        body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
      });
    } catch (e) { /* skip individual failures */ }
  }
}
async function handleGmailPoll(req, res) {
  if (process.env.CRON_SECRET) {
    var auth = (req.headers["authorization"] || "").replace("Bearer ", "");
    if (auth !== process.env.CRON_SECRET) return res.status(401).json({ error: "Unauthorized" });
  }
  var deadline = Date.now() + 50000;
  try {
    var resp = await shared.supabaseRequest("/social_credentials?gmail_refresh_token=not.is.null&select=user_id,gmail_refresh_token,gmail_email", { method: "GET" });
    if (!resp.ok) return res.status(500).json({ error: "Failed to fetch credentials" });
    var users = await resp.json();
    var count = 0;
    for (var i = 0; i < users.length; i++) {
      if (Date.now() > deadline) break;
      try {
        await pollUserGmail(users[i].user_id, users[i].gmail_refresh_token, users[i].gmail_email, deadline);
        count++;
      } catch (e) {}
    }
    return res.status(200).json({ ok: true, polled: count });
  } catch (e) {
    console.error("gmail-poll error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}

// ── ACTION: send-replies (cron) ────────────────────────────────────────────────
async function handleSendReplies(req, res) {
  if (process.env.CRON_SECRET) {
    var auth = (req.headers["authorization"] || "").replace("Bearer ", "");
    if (auth !== process.env.CRON_SECRET) return res.status(401).json({ error: "Unauthorized" });
  }
  var deadline = Date.now() + 50000;
  try {
    var resp = await shared.supabaseRequest("/email_inbox?status=eq.new&select=id,user_id,from_email,from_name,subject,body_text&order=received_at.asc&limit=50", { method: "GET" });
    if (!resp.ok) return res.status(500).json({ error: "Failed to fetch emails" });
    var emails = await resp.json();
    if (!emails.length) return res.status(200).json({ ok: true, sent: 0 });

    // Per-agent manual/automatic toggle for email — this cron previously
    // auto-replied to EVERY pending email across the whole platform with
    // zero per-user scoping at all. A toggle absent/null (pre-migration, or
    // an agent who never touched this setting) defaults to enabled, matching
    // this project's automation-first convention; only an explicit `false`
    // disables it, leaving the email for the agent to answer manually.
    var userIds = emails.map(function (e) { return e.user_id; }).filter(Boolean);
    var toggleMap = {};
    if (userIds.length) {
      try {
        var uniqueIds = userIds.filter(function (v, i, a) { return a.indexOf(v) === i; });
        var inList = uniqueIds.map(function (u) { return encodeURIComponent(u); }).join(",");
        var credsResp = await shared.supabaseRequest("/social_credentials?user_id=in.(" + inList + ")&select=user_id,auto_reply_email", { method: "GET" });
        var credsRows = credsResp.ok ? await credsResp.json() : [];
        credsRows.forEach(function (r) { toggleMap[r.user_id] = r.auto_reply_email; });
      } catch (e) {}
    }

    var sent = 0, errors = 0, skipped = 0;
    for (var i = 0; i < emails.length; i++) {
      if (Date.now() > deadline) break;
      var email = emails[i];
      if (email.user_id && !_autoReplyOn(toggleMap[email.user_id])) { skipped++; continue; }
      try {
        var reply = await generateAIEmailReply(email.from_name, email.subject, email.body_text);
        if (!reply) { errors++; continue; }
        var replySubject = email.subject && email.subject !== "(No subject)"
          ? (email.subject.startsWith("Re:") ? email.subject : "Re: " + email.subject) : "Re: Your inquiry to DubAIVal";
        var emailOk = await shared.sendEmail(email.from_email, replySubject, buildEmailHtml(reply, null));
        if (!emailOk) { errors++; continue; }
        await shared.supabaseRequest("/email_inbox?id=eq." + email.id, {
          method: "PATCH", headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ status: "ai_replied", ai_reply: reply, replied_at: new Date().toISOString() }),
        });
        sent++;
      } catch (e) { errors++; }
    }
    return res.status(200).json({ ok: true, sent: sent, errors: errors, skipped: skipped, total: emails.length });
  } catch (e) {
    console.error("send-replies error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}

// ── ACTION: reply (manual agent reply, default POST action) ──────────────────
async function handleReply(req, res) {
  if (rateLimitExceeded(req, res, 60000, 20)) return;
  var body = req.body || {};
  // Requires a real signed-in user — reply-email.js had no auth check at all,
  // meaning anyone could call it to send arbitrary emails from our domain.
  var callerId = await _resolveUserId(body.access_token);
  if (!callerId) return res.status(401).json({ error: "Please sign in to send a reply." });

  var messageId = body.messageId, replyTo = body.replyTo, replyName = body.replyName;
  var subject = body.subject, replyBody = body.body, agentName = body.agentName || "DubAIVal Team";
  if (!messageId || !replyTo || !replyBody) return res.status(400).json({ error: "Missing required fields" });

  try {
    var replySubject = subject && subject !== "(No subject)"
      ? (subject.startsWith("Re:") ? subject : "Re: " + subject) : "Re: Your inquiry to DubAIVal";
    var emailOk = await shared.sendEmail(replyTo, replySubject, buildEmailHtml(replyBody, agentName));
    if (!emailOk) return res.status(500).json({ error: "Failed to send email" });
    await shared.supabaseRequest("/email_inbox?id=eq." + messageId, {
      method: "PATCH", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "agent_replied", agent_reply: replyBody, replied_at: new Date().toISOString() }),
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("reply error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}

// ── AI Voice Concierge — agent self-service actions ───────────────────────
// All 3 below require a real signed-in user (access_token in body, same
// convention as handleWhatsAppSend above).
async function handleVoiceActivate(req, res) {
  if (rateLimitExceeded(req, res, 60000, 10)) return;
  var body = req.body || {};
  var authUid = await _resolveAuthUid(body.access_token);
  if (!authUid) return res.status(401).json({ error: "Please sign in to activate AI Voice Concierge." });
  var label = String(body.label || "").trim().slice(0, 100) || null;
  try {
    var r = await shared.supabaseRequest("/rpc/claim_voice_number", {
      method: "POST",
      body: JSON.stringify({ p_agent_uid: authUid, p_agent_label: label }),
    });
    if (!r.ok) {
      var errText = await r.text().catch(function () { return ""; });
      console.error("claim_voice_number failed:", r.status, errText);
      return res.status(500).json({ error: "Could not activate — please try again." });
    }
    var rows = await r.json();
    var phoneNumber = rows && rows[0] && rows[0].phone_number;
    if (!phoneNumber) return res.status(409).json({ error: "No AI Voice Concierge numbers are available right now — please check back soon." });
    return res.status(200).json({ ok: true, phoneNumber: phoneNumber });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleVoiceDeactivate(req, res) {
  if (rateLimitExceeded(req, res, 60000, 10)) return;
  var body = req.body || {};
  var authUid = await _resolveAuthUid(body.access_token);
  if (!authUid) return res.status(401).json({ error: "Please sign in first." });
  try {
    await shared.supabaseRequest("/rpc/release_voice_number", {
      method: "POST",
      body: JSON.stringify({ p_agent_uid: authUid }),
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleVoiceStatus(req, res) {
  if (rateLimitExceeded(req, res, 60000, 30)) return;
  var body = req.body || {};
  var authUid = await _resolveAuthUid(body.access_token);
  if (!authUid) return res.status(401).json({ error: "Please sign in first." });
  try {
    var r = await shared.supabaseRequest("/rpc/get_voice_status", {
      method: "POST",
      body: JSON.stringify({ p_agent_uid: authUid }),
    });
    var rows = r.ok ? await r.json() : [];
    var row = rows[0] || { phone_number: null, voice_credits: 0 };
    var callsResp = await shared.supabaseRequest(
      "/voice_calls?agent_id=eq." + encodeURIComponent(authUid) +
      "&select=caller_phone,duration_seconds,credits_charged,client_saved,ended_at&order=ended_at.desc&limit=10",
      { method: "GET" }
    );
    var calls = callsResp.ok ? await callsResp.json() : [];
    return res.status(200).json({ ok: true, phoneNumber: row.phone_number, voiceCredits: row.voice_credits, recentCalls: calls });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// ── AI Voice Concierge — ElevenLabs → us webhooks ─────────────────────────

// Conversation-initiation webhook: ElevenLabs calls this the instant a call
// connects, before the agent says anything, so we can tell it WHICH real
// estate agent's number was dialed (one shared Agent definition serves
// every agent's own number — see CLAUDE.md for why). Field names for the
// called/caller number are defensive (checked against several plausible
// paths) since this exact payload shape could not be confirmed against a
// live ElevenLabs account in this session — safe to correct in one place
// (the _dig() path lists below) once tested live.
async function handleVoiceInit(req, res) {
  var sig = req.headers["elevenlabs-signature"];
  if (!_verifyElevenLabsSignature(req._rawBody, sig, ELEVENLABS_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "invalid signature" });
  }
  var body = req.body || {};
  var calledNumber = _dig(body, ["to_number", "called_number", "caller_id.to", "metadata.to_number", "to"]);
  var fromNumber = _dig(body, ["from_number", "caller_number", "caller_id.from", "metadata.from_number", "from"]);

  var agentId = null, agentName = "DubaiVal", creditsAvailable = true;
  try {
    if (calledNumber) {
      var r = await shared.supabaseRequest(
        "/voice_agent_numbers?phone_number=eq." + encodeURIComponent(calledNumber) +
        "&status=eq.assigned&select=assigned_agent_id,assigned_agent_label",
        { method: "GET" }
      );
      var rows = r.ok ? await r.json() : [];
      if (rows.length) {
        agentId = rows[0].assigned_agent_id;
        agentName = rows[0].assigned_agent_label || "your DubaiVal agent";
        var credResp = await shared.supabaseRequest(
          "/user_profiles?id=eq." + encodeURIComponent(agentId) + "&select=voice_credits", { method: "GET" }
        );
        var credRows = credResp.ok ? await credResp.json() : [];
        creditsAvailable = !credRows.length || Number(credRows[0].voice_credits || 0) > 0;
      }
    }
  } catch (e) {
    console.error("voice-init lookup error:", e.message);
  }

  var firstMessage = agentId
    ? (creditsAvailable
        ? "Thanks for calling " + agentName + "'s office, this is their AI assistant — how can I help you with a Dubai property today?"
        : "Thanks for calling " + agentName + "'s office. I'm sorry, this line is temporarily unavailable — please try again shortly, or leave a message with your name and number after the tone.")
    : "Thanks for calling DubaiVal — I'm an AI real estate assistant. How can I help you today?";

  return res.status(200).json({
    dynamic_variables: {
      agentId: agentId || "",
      agentName: agentName,
      callerPhone: fromNumber || "",
      creditsAvailable: creditsAvailable,
    },
    conversation_config_override: { agent: { first_message: firstMessage } },
  });
}

// Post-call webhook: ElevenLabs calls this once a conversation ends, with
// the real duration + full transcript. Deducts credits (post-paid, matching
// how the call's real cost is only known after the fact) and logs the call.
// If the mid-call save_lead tool was never triggered (e.g. the caller hung
// up early), runs the SAME lightweight extraction the text AI Concierge/
// Conversation Scanner already use on the full transcript, as a fallback
// safety net — respecting the per-agent voice_auto_save_extracted toggle.
async function handleVoiceWebhook(req, res) {
  var sig = req.headers["elevenlabs-signature"];
  if (!_verifyElevenLabsSignature(req._rawBody, sig, ELEVENLABS_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "invalid signature" });
  }
  var body = req.body || {};
  if (body.type && body.type !== "post_call_transcription") return res.status(200).json({ ok: true, ignored: true });
  var data = body.data || body;

  var conversationId = data.conversation_id || data.conversationId || null;
  var durationSeconds = Number(_dig(data, ["metadata.call_duration_secs", "call_duration_secs", "duration", "duration_seconds"])) || 0;
  var transcriptRaw = data.transcript;
  var transcriptText = Array.isArray(transcriptRaw)
    ? transcriptRaw.map(function (t) { return (t.role || t.speaker || "?") + ": " + (t.message || t.text || ""); }).join("\n")
    : (typeof transcriptRaw === "string" ? transcriptRaw : "");
  var dynVars = _dig(data, ["conversation_initiation_client_data.dynamic_variables", "dynamic_variables"]) || {};
  var agentId = dynVars.agentId || null;
  var callerPhone = dynVars.callerPhone || _dig(data, ["metadata.caller_id.from", "from_number"]) || null;

  if (!agentId) {
    // No real estate agent to bill/log against — acknowledge without
    // erroring so ElevenLabs doesn't keep retrying a call we can't attribute.
    return res.status(200).json({ ok: true, skipped: "no agentId" });
  }

  try {
    if (conversationId) {
      var existing = await shared.supabaseRequest(
        "/voice_calls?elevenlabs_conversation_id=eq." + encodeURIComponent(conversationId) + "&select=id", { method: "GET" }
      );
      var existingRows = existing.ok ? await existing.json() : [];
      if (existingRows.length) return res.status(200).json({ ok: true, deduped: true }); // ElevenLabs can redeliver
    }

    var minutes = Math.max(1, Math.ceil(durationSeconds / 60));
    await shared.supabaseRequest("/rpc/consume_voice_credits", {
      method: "POST", body: JSON.stringify({ p_user_id: agentId, p_minutes: minutes }),
    });

    var clientSaved = false;
    try {
      var alreadySaved = await shared.supabaseRequest(
        "/chiefs_clients?agent_id=eq." + encodeURIComponent(agentId) + "&source=eq.voice_call" +
        (callerPhone ? "&client_phone=eq." + encodeURIComponent(callerPhone) : "") +
        "&select=id&limit=1", { method: "GET" }
      );
      var alreadyRows = alreadySaved.ok ? await alreadySaved.json() : [];
      clientSaved = alreadyRows.length > 0;

      if (!clientSaved && transcriptText && GROQ_KEY) {
        var agentProfile = await _emailForAuthUid(agentId);
        var toggleOn = true; // default-on, matches this project's automation-first convention
        if (agentProfile && agentProfile.email) {
          var toggleResp = await shared.supabaseRequest(
            "/social_credentials?user_id=eq." + encodeURIComponent(agentProfile.email) + "&select=voice_auto_save_extracted", { method: "GET" }
          );
          var toggleRows = toggleResp.ok ? await toggleResp.json() : [];
          if (toggleRows.length && toggleRows[0].voice_auto_save_extracted === false) toggleOn = false;
        }

        if (toggleOn) {
          var extracted = await _extractLeadFromTranscript(transcriptText);
          if (extracted && extracted.name && (extracted.phone || extracted.email || callerPhone)) {
            var saveResp = await fetch(DV_SITE_ORIGIN + "/api/chiefs-embed?action=concierge-save", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                agentId: agentId, clientName: extracted.name,
                clientPhone: extracted.phone || callerPhone || null, clientEmail: extracted.email || null,
                purpose: extracted.purpose || "sale", propType: extracted.prop_type || "apartment",
                bedsWanted: extracted.beds || null, areasWanted: Array.isArray(extracted.areas) ? extracted.areas.filter(Boolean) : null,
                minPrice: extracted.min_price || null, maxPrice: extracted.max_price || null,
                rawConversation: transcriptText.slice(0, 3000), notes: extracted.summary || null,
                source: "voice_call",
              }),
            });
            var saved = await saveResp.json().catch(function () { return {}; });
            clientSaved = !!(saveResp.ok && saved && saved.ok);
          }
        }
      }
    } catch (e) {
      console.error("voice-webhook fallback extraction error:", e.message);
    }

    await shared.supabaseRequest("/voice_calls", {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        agent_id: agentId, caller_phone: callerPhone,
        elevenlabs_conversation_id: conversationId, duration_seconds: durationSeconds,
        credits_charged: minutes, transcript: transcriptText.slice(0, 8000),
        client_saved: clientSaved, ended_at: new Date().toISOString(),
      }),
    });

    return res.status(200).json({ ok: true, minutesCharged: minutes, clientSaved: clientSaved });
  } catch (e) {
    console.error("voice-webhook error:", e.message);
    return res.status(200).json({ ok: true }); // always 200 so ElevenLabs doesn't retry forever on our own bug
  }
}

// Same JSON-extraction contract as js/chiefs.js's _conciergeTryExtractAndSave()
// (name/phone/email/purpose/prop_type/beds/areas/min_price/max_price/summary)
// — kept deliberately identical so a voice-call lead and a text-Concierge
// lead save with exactly the same shape into chiefs_clients.
async function _extractLeadFromTranscript(transcriptText) {
  if (!GROQ_KEY) return null;
  try {
    var r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.1, max_tokens: 400,
        messages: [
          {
            role: "system",
            content: "Extract real estate lead details from this phone call transcript between an AI voice assistant and a caller. Return strict JSON: {name, phone, email, purpose (\"sale\" or \"rent\"), prop_type, beds, areas (array), min_price, max_price, summary}. Use null for anything not mentioned. Never invent a value.",
          },
          { role: "user", content: transcriptText.slice(0, 3000) },
        ],
      }),
    });
    var d = await r.json();
    var raw = d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// ── AI Voice Concierge — admin (operator-only) setup ──────────────────────

async function handleVoiceAdminAddNumber(req, res) {
  if (rateLimitExceeded(req, res, 60000, 10)) return;
  var body = req.body || {};
  var phoneNumber = String(body.phone_number || "").trim();
  if (!phoneNumber) return res.status(400).json({ error: "phone_number required" });
  try {
    var r = await shared.supabaseRequest("/rpc/admin_add_voice_number", {
      method: "POST",
      body: JSON.stringify({
        p_admin_password: body.admin_password, p_phone_number: phoneNumber,
        p_twilio_account_sid: body.twilio_account_sid || null, p_twilio_auth_token: body.twilio_auth_token || null,
      }),
    });
    if (!r.ok) return res.status(401).json({ error: "Invalid admin password, or a database error occurred." });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleVoiceAdminListNumbers(req, res) {
  if (rateLimitExceeded(req, res, 60000, 20)) return;
  var body = req.body || {};
  try {
    var r = await shared.supabaseRequest("/rpc/admin_list_voice_numbers", {
      method: "POST", body: JSON.stringify({ p_admin_password: body.admin_password }),
    });
    if (!r.ok) return res.status(401).json({ error: "Invalid admin password" });
    var rows = await r.json();
    return res.status(200).json({ ok: true, numbers: rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// Creates (first run) or updates (every run after) the ONE shared
// ElevenLabs Agent every real estate agent's own phone number routes into.
// The 2 webhook tools + conversation-init/post-call webhooks could not be
// attached via this API call with full confidence (ElevenLabs' exact nested
// tool-schema inside the create/update body wasn't verifiable live in this
// session) — rather than guess at a schema that could silently fail to
// attach, this returns the exact URLs the operator pastes into the
// ElevenLabs dashboard once, the same "give the exact value, disclose the
// manual step" pattern already used for WhatsApp/Meta setup in this project.
async function handleVoiceAdminSetupAgent(req, res) {
  if (rateLimitExceeded(req, res, 60000, 5)) return;
  var body = req.body || {};
  if (!ELEVENLABS_API_KEY) return res.status(500).json({ error: "ELEVENLABS_API_KEY not configured in Vercel env vars." });

  var idResp = await shared.supabaseRequest("/rpc/admin_get_voice_agent_id", {
    method: "POST", body: JSON.stringify({ p_admin_password: body.admin_password }),
  });
  if (!idResp.ok) return res.status(401).json({ error: "Invalid admin password" });
  var existingId = await idResp.json();

  var agentBody = {
    name: "DubaiVal AI Voice Concierge",
    conversation_config: {
      agent: {
        first_message: "Thanks for calling — how can I help you with a Dubai property today?",
        language: "en",
        prompt: { prompt: VOICE_AGENT_SYSTEM_PROMPT, llm: ELEVENLABS_LLM },
      },
    },
  };
  if (ELEVENLABS_VOICE_ID) agentBody.conversation_config.tts = { voice_id: ELEVENLABS_VOICE_ID };

  try {
    var method = existingId ? "PATCH" : "POST";
    var url = existingId ? (ELEVENLABS_BASE + "/convai/agents/" + existingId) : (ELEVENLABS_BASE + "/convai/agents/create");
    var elResp = await fetch(url, {
      method: method,
      headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(agentBody),
    });
    var elData = await elResp.json().catch(function () { return {}; });
    if (!elResp.ok) {
      var msg = (elData.detail && (elData.detail.message || elData.detail)) || elData.message || JSON.stringify(elData);
      return res.status(502).json({ error: "ElevenLabs API error: " + msg });
    }
    var agentId = existingId || elData.agent_id || elData.id;
    if (!agentId) return res.status(502).json({ error: "ElevenLabs did not return an agent id — check the response shape once live." });

    await shared.supabaseRequest("/voice_agent_config?id=eq.default", {
      method: "PATCH", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ elevenlabs_agent_id: agentId, updated_at: new Date().toISOString() }),
    });

    return res.status(200).json({
      ok: true, agentId: agentId, mode: existingId ? "updated" : "created",
      nextSteps: [
        "In the ElevenLabs dashboard, open this Agent → Tools → Add Tool → Webhook, and add 2 tools:",
        "1) lookup_market_knowledge → POST " + DV_SITE_ORIGIN + "/api/knowledge-query — body: {query, areas}",
        "2) save_lead → POST " + DV_SITE_ORIGIN + "/api/chiefs-embed?action=concierge-save — body: {agentId, clientName, clientPhone, clientEmail, purpose, propType, bedsWanted, areasWanted, maxPrice, rawConversation, source:\"voice_call\"}",
        "Then set the Conversation Initiation Webhook (Advanced settings) to: " + DV_SITE_ORIGIN + "/api/inbox?action=voice-init",
        "And register the Post-Call Webhook (Workspace → Webhooks) pointing at: " + DV_SITE_ORIGIN + "/api/inbox?action=voice-webhook",
        "Finally, link each Twilio number you've added in DubaiVal's Admin Dashboard to this Agent via ElevenLabs' own Twilio integration UI.",
      ],
    });
  } catch (e) {
    return res.status(500).json({ error: "Could not reach ElevenLabs: " + e.message });
  }
}

// ── ROUTER ─────────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Body parsing is done manually here (bodyParser disabled below, see
  // module.exports.config) so action=voice-init/voice-webhook can verify
  // ElevenLabs' HMAC signature against the EXACT raw bytes sent — a
  // re-serialized JSON.stringify(req.body) is not guaranteed byte-identical
  // to what was actually POSTed, which would make signature verification
  // silently unreliable. Every other action here just gets req.body
  // assigned from the same parsed JSON Vercel's automatic parser would have
  // produced, so none of their existing logic needed to change.
  var _raw = await _readRawBody(req);
  req._rawBody = _raw;
  try { req.body = JSON.parse(_raw.toString("utf8") || "{}"); } catch (e) { req.body = {}; }

  var action = (req.query && req.query.action) || "";

  if (action === "meta-webhook") return handleMetaWebhook(req, res);
  if (action === "whatsapp-webhook") return handleWhatsAppWebhook(req, res);
  if (action === "voice-init") return handleVoiceInit(req, res);
  if (action === "voice-webhook") return handleVoiceWebhook(req, res);
  if (action === "config" && req.method === "GET") return handleConfig(req, res);
  if (action === "gmail-poll") return handleGmailPoll(req, res);
  if (action === "send-replies") return handleSendReplies(req, res);
  // Both GET: a clicked email link and a polled status check are always GET.
  if (action === "verify-otp-link") return handleVerifyOtpLink(req, res);
  if (action === "otp-status" && req.method === "GET") return handleOtpStatus(req, res);

  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (action === "oauth-meta") return handleOauthMeta(req, res);
  if (action === "oauth-google") return handleOauthGoogle(req, res);
  if (action === "email-inbound") return handleEmailInbound(req, res);
  if (action === "whatsapp-send") return handleWhatsAppSend(req, res);
  if (action === "meta-conversion") return handleMetaConversion(req, res);
  if (action === "send-otp") return handleSendOtp(req, res);
  if (action === "verify-otp") return handleVerifyOtp(req, res);
  if (action === "voice-activate") return handleVoiceActivate(req, res);
  if (action === "voice-deactivate") return handleVoiceDeactivate(req, res);
  if (action === "voice-status") return handleVoiceStatus(req, res);
  if (action === "voice-admin-add-number") return handleVoiceAdminAddNumber(req, res);
  if (action === "voice-admin-list-numbers") return handleVoiceAdminListNumbers(req, res);
  if (action === "voice-admin-setup-agent") return handleVoiceAdminSetupAgent(req, res);
  return handleReply(req, res); // default POST action
};

module.exports.config = { api: { bodyParser: false } };
