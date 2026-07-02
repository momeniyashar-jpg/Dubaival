// Meta webhook — handles Instagram DM, Facebook DM, Facebook comments
// Verifies Meta webhook challenge (GET) and processes events (POST)
// After storing, immediately sends AI auto-reply via Groq

var shared = require("../lib/shared.js");

var VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "dubaival_meta_webhook_2026";
var GROQ_KEY = process.env.GROQ_API_KEY;
var GRAPH_BASE = "https://graph.facebook.com/v25.0";

// ── AI REPLY GENERATOR ─────────────────────────────────────────────────────
async function generateAIReply(platform, eventType, senderName, messageText) {
  if (!GROQ_KEY) return null;
  var systemPrompt = `You are DubAIVal, an expert Dubai real estate AI agent. You help clients with property valuations, investment advice, area comparisons, off-plan projects, rental yields, and general Dubai property market questions.

Be warm, professional, and concise. Respond in the same language as the user's message (Arabic, English, or Farsi). Keep replies under 200 words. Always offer to provide a detailed valuation or analysis if relevant.

Platform: ${platform}, Message type: ${eventType}`;

  try {
    var r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: (senderName ? senderName + " says: " : "") + messageText }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    var d = await r.json();
    return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || null;
  } catch (e) { return null; }
}

// ── INSTAGRAM DM REPLY ─────────────────────────────────────────────────────
async function replyInstagramDM(recipientId, message) {
  var igToken = process.env.IG_PAGE_TOKEN;
  var igId = process.env.IG_ACCOUNT_ID;
  if (!igToken || !igId) return;
  await fetch(GRAPH_BASE + "/" + igId + "/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      access_token: igToken
    })
  });
}

// ── FACEBOOK MESSENGER REPLY ───────────────────────────────────────────────
async function replyFacebookDM(recipientId, message) {
  var fbToken = process.env.IG_PAGE_TOKEN; // same page token
  if (!fbToken) return;
  await fetch(GRAPH_BASE + "/me/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      access_token: fbToken
    })
  });
}

// ── FACEBOOK COMMENT REPLY ─────────────────────────────────────────────────
async function replyFacebookComment(commentId, message) {
  var fbToken = process.env.IG_PAGE_TOKEN;
  if (!fbToken) return;
  await fetch(GRAPH_BASE + "/" + commentId + "/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message, access_token: fbToken })
  });
}

// ── STORE + REPLY ──────────────────────────────────────────────────────────
async function handleEvent(platform, eventType, senderId, senderName, messageText, messageId, threadId, postId, rawPayload) {
  if (!messageText || messageText.trim() === "") return;

  var aiReply = await generateAIReply(platform, eventType, senderName, messageText);

  var row = {
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
      if (platform === "instagram" && eventType === "dm") await replyInstagramDM(senderId, aiReply);
      else if (platform === "facebook" && eventType === "dm") await replyFacebookDM(senderId, aiReply);
      else if (platform === "facebook" && eventType === "comment") await replyFacebookComment(postId, aiReply);
    } catch (e) {}
  }
}

module.exports = async function handler(req, res) {
  // ── WEBHOOK VERIFICATION (GET) ─────────────────────────────────────────
  if (req.method === "GET") {
    var mode = req.query["hub.mode"];
    var token = req.query["hub.verify_token"];
    var challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method !== "POST") return res.status(405).end();

  try {
    var body = req.body || {};
    var object = body.object;

    // ── INSTAGRAM EVENTS ─────────────────────────────────────────────────
    if (object === "instagram") {
      var entries = body.entry || [];
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var messaging = entry.messaging || [];
        for (var j = 0; j < messaging.length; j++) {
          var msg = messaging[j];
          if (msg.message && msg.message.text) {
            await handleEvent(
              "instagram", "dm",
              String(msg.sender && msg.sender.id || ""),
              null,
              msg.message.text,
              msg.message.mid || null,
              msg.sender && msg.sender.id || null,
              null,
              msg
            );
          }
        }
      }
    }

    // ── FACEBOOK PAGE EVENTS ─────────────────────────────────────────────
    if (object === "page") {
      var fbEntries = body.entry || [];
      for (var fi = 0; fi < fbEntries.length; fi++) {
        var fbEntry = fbEntries[fi];

        // Messenger DMs
        var fbMessaging = fbEntry.messaging || [];
        for (var fj = 0; fj < fbMessaging.length; fj++) {
          var fbMsg = fbMessaging[fj];
          if (fbMsg.message && fbMsg.message.text) {
            await handleEvent(
              "facebook", "dm",
              String(fbMsg.sender && fbMsg.sender.id || ""),
              null,
              fbMsg.message.text,
              fbMsg.message.mid || null,
              fbMsg.sender && fbMsg.sender.id || null,
              null,
              fbMsg
            );
          }
        }

        // Page comments (via feed subscription)
        var changes = fbEntry.changes || [];
        for (var fk = 0; fk < changes.length; fk++) {
          var change = changes[fk];
          if (change.field === "feed" && change.value) {
            var val = change.value;
            // New comment on a page post
            if ((val.item === "comment" || val.item === "post") && val.verb === "add" && val.message) {
              await handleEvent(
                "facebook", "comment",
                String(val.from && val.from.id || ""),
                val.from && val.from.name || null,
                val.message,
                val.comment_id || val.post_id || null,
                null,
                val.comment_id || val.post_id || null, // postId used for reply
                val
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
