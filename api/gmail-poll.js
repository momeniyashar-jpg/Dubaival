// Hourly cron — polls Gmail for each connected user, stores new emails in email_inbox
// Also sends AI auto-reply if email has been sitting > 8 hours unanswered
var shared = require("./_lib/shared.js");

var GROQ_KEY = process.env.GROQ_API_KEY;
var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

async function refreshAccessToken(refreshToken) {
  var r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(refreshToken) +
      "&client_id=" + encodeURIComponent(GOOGLE_CLIENT_ID) +
      "&client_secret=" + encodeURIComponent(GOOGLE_CLIENT_SECRET)
  });
  var d = await r.json();
  return d.access_token || null;
}

function decodeBase64(str) {
  try { return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"); }
  catch (e) { return ""; }
}

function extractBody(payload) {
  if (!payload) return "";
  if (payload.body && payload.body.data) return decodeBase64(payload.body.data);
  if (payload.parts) {
    for (var i = 0; i < payload.parts.length; i++) {
      var part = payload.parts[i];
      if (part.mimeType === "text/plain" && part.body && part.body.data) return decodeBase64(part.body.data);
    }
    for (var j = 0; j < payload.parts.length; j++) {
      var p2 = payload.parts[j];
      if (p2.mimeType === "text/html" && p2.body && p2.body.data) {
        return decodeBase64(p2.body.data).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      }
    }
  }
  return "";
}

function getHeader(headers, name) {
  var h = (headers || []).find(function(x) { return x.name.toLowerCase() === name.toLowerCase(); });
  return h ? h.value : "";
}

async function generateAIReply(fromName, subject, bodyText) {
  if (!GROQ_KEY) return null;
  try {
    var r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are DubAIVal, an expert Dubai real estate AI agent. Reply to client emails professionally. Be concise (under 250 words). Reply in the same language as the client. Sign off as 'The DubAIVal Team | www.dubaival.com'. Do NOT include 'I hope this email finds you well'." },
          { role: "user", content: "From: " + (fromName || "Client") + "\nSubject: " + subject + "\n\n" + (bodyText || "").slice(0, 1500) }
        ],
        max_tokens: 350, temperature: 0.7
      })
    });
    var d = await r.json();
    return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || null;
  } catch (e) { return null; }
}

async function sendGmailReply(accessToken, toEmail, subject, bodyText, threadId) {
  var replySubject = subject.startsWith("Re:") ? subject : "Re: " + subject;
  var raw = [
    "To: " + toEmail,
    "Subject: " + replySubject,
    "Content-Type: text/plain; charset=utf-8",
    "",
    bodyText
  ].join("\r\n");
  var encoded = Buffer.from(raw).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded, threadId: threadId })
  });
}

async function pollUserGmail(userId, refreshToken, gmailEmail) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return;
  var accessToken = await refreshAccessToken(refreshToken);
  if (!accessToken) return;

  // Fetch unread emails in inbox from last 24 hours
  var query = "is:unread in:inbox newer_than:1d";
  var listResp = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=" + encodeURIComponent(query) + "&maxResults=20",
    { headers: { Authorization: "Bearer " + accessToken } }
  );
  if (!listResp.ok) return;
  var listData = await listResp.json();
  var messages = listData.messages || [];

  for (var i = 0; i < messages.length; i++) {
    try {
      var msgResp = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/" + messages[i].id + "?format=full",
        { headers: { Authorization: "Bearer " + accessToken } }
      );
      if (!msgResp.ok) continue;
      var msg = await msgResp.json();

      var headers = msg.payload && msg.payload.headers || [];
      var fromRaw = getHeader(headers, "From");
      var fromMatch = fromRaw.match(/<([^>]+)>/);
      var fromEmail = fromMatch ? fromMatch[1] : fromRaw.trim();
      var fromName = fromRaw.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || null;
      var subject = getHeader(headers, "Subject") || "(No subject)";
      var messageId = getHeader(headers, "Message-Id") || msg.id;
      var bodyText = extractBody(msg.payload).slice(0, 8000);
      var threadId = msg.threadId || null;

      // Skip emails FROM the user's own Gmail (outgoing)
      if (fromEmail && gmailEmail && fromEmail.toLowerCase() === gmailEmail.toLowerCase()) continue;

      var row = {
        user_id: userId,
        from_email: fromEmail,
        from_name: fromName || (fromEmail ? fromEmail.split("@")[0] : "Unknown"),
        to_email: gmailEmail || "",
        subject: subject,
        body_text: bodyText,
        status: "new",
        message_id: messageId,
        thread_id: threadId,
        received_at: new Date(parseInt(msg.internalDate)).toISOString()
      };

      // Upsert (skip duplicates)
      await shared.supabaseRequest("/email_inbox", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(row)
      });

      // Mark as read in Gmail so we don't process again
      await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + msg.id + "/modify", {
        method: "POST",
        headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
        body: JSON.stringify({ removeLabelIds: ["UNREAD"] })
      });
    } catch (e) { /* skip individual failures */ }
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).end();
  var secret = process.env.CRON_SECRET;
  if (secret) {
    var auth = (req.headers["authorization"] || "").replace("Bearer ", "");
    if (auth !== secret) return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Fetch all users with Gmail connected
    var resp = await shared.supabaseRequest(
      "/social_credentials?gmail_refresh_token=not.is.null&select=user_id,gmail_refresh_token,gmail_email",
      { method: "GET" }
    );
    if (!resp.ok) return res.status(500).json({ error: "Failed to fetch credentials" });
    var users = await resp.json();

    var count = 0;
    for (var i = 0; i < users.length; i++) {
      try {
        await pollUserGmail(users[i].user_id, users[i].gmail_refresh_token, users[i].gmail_email);
        count++;
      } catch (e) { /* skip */ }
    }

    return res.status(200).json({ ok: true, polled: count });
  } catch (e) {
    console.error("gmail-poll error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
