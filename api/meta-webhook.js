// Meta webhook — handles Instagram DM, Facebook DM, Facebook comments
// Multi-tenant: routes each event to the DubaiVal user who owns that page
var shared = require("./lib/shared.js");

var VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "dubaival_meta_webhook_2026";
var GROQ_KEY = process.env.GROQ_API_KEY;
var GRAPH_BASE = "https://graph.facebook.com/v25.0";

// ── FIND USER BY PAGE ID ───────────────────────────────────────────────────────
async function findUserByPage(pageId, igId) {
  try {
    var query = "/social_credentials?select=user_id,ig_token,ig_id,fb_id";
    if (igId) query += "&or=(ig_id.eq." + igId + ",fb_id.eq." + pageId + ")";
    else query += "&fb_id=eq." + pageId;
    var resp = await shared.supabaseRequest(query, { method: "GET" });
    if (!resp.ok) return null;
    var rows = await resp.json();
    return rows.length ? rows[0] : null;
  } catch (e) { return null; }
}

// ── AI REPLY GENERATOR ─────────────────────────────────────────────────────────
async function generateAIReply(platform, eventType, senderName, messageText) {
  if (!GROQ_KEY) return null;
  try {
    var r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are DubAIVal, an expert Dubai real estate AI agent. Help clients with property valuations, investment advice, area comparisons, off-plan projects, rental yields, and Dubai property market questions. Be warm, professional, and concise. Reply in the same language as the user (Arabic, English, or Farsi). Keep replies under 200 words. Platform: " + platform + ", Type: " + eventType },
          { role: "user", content: (senderName ? senderName + " says: " : "") + messageText }
        ],
        max_tokens: 300, temperature: 0.7
      })
    });
    var d = await r.json();
    return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || null;
  } catch (e) { return null; }
}

// ── SEND REPLIES ───────────────────────────────────────────────────────────────
async function replyInstagramDM(igId, recipientId, message, token) {
  if (!token || !igId) return;
  await fetch(GRAPH_BASE + "/" + igId + "/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text: message }, access_token: token })
  });
}

async function replyFacebookDM(recipientId, message, token) {
  if (!token) return;
  await fetch(GRAPH_BASE + "/me/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text: message }, access_token: token })
  });
}

async function replyFacebookComment(commentId, message, token) {
  if (!token) return;
  await fetch(GRAPH_BASE + "/" + commentId + "/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message, access_token: token })
  });
}

// ── STORE + REPLY ──────────────────────────────────────────────────────────────
async function handleEvent(userId, pageToken, igAccountId, platform, eventType, senderId, senderName, messageText, messageId, threadId, postId, rawPayload) {
  if (!messageText || messageText.trim() === "") return;

  var aiReply = await generateAIReply(platform, eventType, senderName, messageText);

  var row = {
    user_id: userId || "default",
    platform: platform,
    event_type: eventType,
    sender_id: senderId,
    sender_name: senderName || null,
    thread_id: threadId || null,
    message_id: messageId || (platform + "_" + senderId + "_" + Date.now()),
    message_text: messageText.slice(0, 2000),
    post_id: postId || null,
    status: aiReply ? "replied" : "new",
    ai_reply: aiReply || null,
    replied_at: aiReply ? new Date().toISOString() : null,
    raw_payload: rawPayload ? JSON.stringify(rawPayload) : null
  };

  try {
    await shared.supabaseRequest("/social_inbox", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(row)
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

module.exports = async function handler(req, res) {
  // ── WEBHOOK VERIFICATION (GET) ───────────────────────────────────────────────
  if (req.method === "GET") {
    var mode = req.query["hub.mode"];
    var token = req.query["hub.verify_token"];
    var challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) return res.status(200).send(challenge);
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method !== "POST") return res.status(405).end();

  try {
    var body = req.body || {};
    var object = body.object;

    // ── INSTAGRAM EVENTS ───────────────────────────────────────────────────────
    if (object === "instagram") {
      var entries = body.entry || [];
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var pageId = entry.id;
        var messaging = entry.messaging || [];
        for (var j = 0; j < messaging.length; j++) {
          var msg = messaging[j];
          if (msg.message && msg.message.text) {
            var igId = msg.recipient && msg.recipient.id;
            var creds = await findUserByPage(pageId, igId);
            await handleEvent(
              creds && creds.user_id, creds && creds.ig_token, creds && creds.ig_id,
              "instagram", "dm",
              String(msg.sender && msg.sender.id || ""), null,
              msg.message.text, msg.message.mid || null,
              msg.sender && msg.sender.id || null, null, msg
            );
          }
        }
      }
    }

    // ── FACEBOOK PAGE EVENTS ───────────────────────────────────────────────────
    if (object === "page") {
      var fbEntries = body.entry || [];
      for (var fi = 0; fi < fbEntries.length; fi++) {
        var fbEntry = fbEntries[fi];
        var fbPageId = fbEntry.id;
        var fbCreds = await findUserByPage(fbPageId, null);

        // Messenger DMs
        var fbMessaging = fbEntry.messaging || [];
        for (var fj = 0; fj < fbMessaging.length; fj++) {
          var fbMsg = fbMessaging[fj];
          if (fbMsg.message && fbMsg.message.text) {
            await handleEvent(
              fbCreds && fbCreds.user_id, fbCreds && fbCreds.ig_token, null,
              "facebook", "dm",
              String(fbMsg.sender && fbMsg.sender.id || ""), null,
              fbMsg.message.text, fbMsg.message.mid || null,
              fbMsg.sender && fbMsg.sender.id || null, null, fbMsg
            );
          }
        }

        // Page comments
        var changes = fbEntry.changes || [];
        for (var fk = 0; fk < changes.length; fk++) {
          var change = changes[fk];
          if (change.field === "feed" && change.value) {
            var val = change.value;
            if ((val.item === "comment" || val.item === "post") && val.verb === "add" && val.message) {
              await handleEvent(
                fbCreds && fbCreds.user_id, fbCreds && fbCreds.ig_token, null,
                "facebook", "comment",
                String(val.from && val.from.id || ""), val.from && val.from.name || null,
                val.message, val.comment_id || val.post_id || null,
                null, val.comment_id || val.post_id || null, val
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
};
