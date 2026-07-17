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

async function generateAIEmailReply(fromName, subject, bodyText) {
  if (!GROQ_KEY) return null;
  try {
    var r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are DubAIVal, an expert Dubai real estate AI agent. Reply to client emails professionally and helpfully. Be warm, professional, concise (under 250 words). Reply in the same language as the client. Sign off as 'The DubAIVal Team | www.dubaival.com'. Do NOT include generic pleasantries like 'I hope this email finds you well'. Get straight to the point.",
          },
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
    var r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are DubAIVal, an expert Dubai real estate AI agent. Help clients with property valuations, investment advice, area comparisons, off-plan projects, rental yields, and Dubai property market questions. Be warm, professional, and concise. Reply in the same language as the user (Arabic, English, or Farsi). Keep replies under 200 words. Platform: " + platform + ", Type: " + eventType,
          },
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
    var query = "/social_credentials?select=user_id,ig_token,ig_id,fb_id";
    query += igId ? "&or=(ig_id.eq." + igId + ",fb_id.eq." + pageId + ")" : "&fb_id=eq." + pageId;
    var resp = await shared.supabaseRequest(query, { method: "GET" });
    if (!resp.ok) return null;
    var rows = await resp.json();
    return rows.length ? rows[0] : null;
  } catch (e) {
    return null;
  }
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

async function handleSocialEvent(userId, pageToken, igAccountId, platform, eventType, senderId, senderName, messageText, messageId, threadId, postId, rawPayload) {
  if (!messageText || messageText.trim() === "") return;
  var aiReply = await generateAISocialReply(platform, eventType, senderName, messageText);
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
              msg.message.text, msg.message.mid || null, (msg.sender && msg.sender.id) || null, null, msg
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
        var fbMessaging = fbEntry.messaging || [];
        for (var fj = 0; fj < fbMessaging.length; fj++) {
          var fbMsg = fbMessaging[fj];
          if (fbMsg.message && fbMsg.message.text) {
            await handleSocialEvent(
              fbCreds && fbCreds.user_id, fbCreds && fbCreds.ig_token, null,
              "facebook", "dm", String((fbMsg.sender && fbMsg.sender.id) || ""), null,
              fbMsg.message.text, fbMsg.message.mid || null, (fbMsg.sender && fbMsg.sender.id) || null, null, fbMsg
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
                val.message, val.comment_id || val.post_id || null, null, val.comment_id || val.post_id || null, val
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
      "&select=user_id,whatsapp_token,whatsapp_phone_id",
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
          var text = msg.text && msg.text.body;
          if (!text) continue; // images/voice/etc. not handled yet — logged nowhere, matches "text only" scope of the rest of this file
          var from = msg.from;

          // Window gate BEFORE spending anything on an AI reply — matches
          // Meta's real per-24h-conversation-window billing (not per
          // message): if this contact already has an active window today,
          // ensure_whatsapp_window() reports allowed=true/credit_consumed
          // =false and this reply is free, already paid for. A message with
          // no credit left to open a NEW window is still logged (status
          // "new") so it's never silently lost, it just doesn't get an
          // automatic reply.
          var authUid = creds ? await _authUidForEmail(creds.user_id) : null;
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
    var resp = await shared.supabaseRequest("/email_inbox?status=eq.new&select=id,from_email,from_name,subject,body_text&order=received_at.asc&limit=50", { method: "GET" });
    if (!resp.ok) return res.status(500).json({ error: "Failed to fetch emails" });
    var emails = await resp.json();
    if (!emails.length) return res.status(200).json({ ok: true, sent: 0 });

    var sent = 0, errors = 0;
    for (var i = 0; i < emails.length; i++) {
      if (Date.now() > deadline) break;
      var email = emails[i];
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
    return res.status(200).json({ ok: true, sent: sent, errors: errors, total: emails.length });
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

// ── ROUTER ─────────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  var action = (req.query && req.query.action) || "";

  if (action === "meta-webhook") return handleMetaWebhook(req, res);
  if (action === "whatsapp-webhook") return handleWhatsAppWebhook(req, res);
  if (action === "config" && req.method === "GET") return handleConfig(req, res);
  if (action === "gmail-poll") return handleGmailPoll(req, res);
  if (action === "send-replies") return handleSendReplies(req, res);

  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (action === "oauth-meta") return handleOauthMeta(req, res);
  if (action === "oauth-google") return handleOauthGoogle(req, res);
  if (action === "email-inbound") return handleEmailInbound(req, res);
  if (action === "whatsapp-send") return handleWhatsAppSend(req, res);
  if (action === "meta-conversion") return handleMetaConversion(req, res);
  return handleReply(req, res); // default POST action
};
