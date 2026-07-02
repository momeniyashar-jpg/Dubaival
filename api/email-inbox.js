// Receives inbound emails from Mailgun webhook → stores in Supabase email_inbox
var shared = require("../lib/shared.js");
var crypto = require("crypto");

function verifyMailgunSignature(timestamp, token, signature) {
  var key = process.env.MAILGUN_WEBHOOK_KEY;
  if (!key) return true; // skip verification if key not configured yet
  var value = timestamp + token;
  var hash = crypto.createHmac("sha256", key).update(value).digest("hex");
  return hash === signature;
}

function stripHtml(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 5000);
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    var body = req.body || {};

    // Mailgun sends form-encoded data
    var timestamp = body.timestamp || body["signature[timestamp]"] || "";
    var token = body.token || body["signature[token]"] || "";
    var signature = body.signature || body["signature[signature]"] || "";

    if (!verifyMailgunSignature(timestamp, token, signature)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    var fromRaw = body.from || body.sender || "";
    var fromName = fromRaw.replace(/<.*>/, "").trim().replace(/"/g, "") || null;
    var fromEmail = (fromRaw.match(/<([^>]+)>/) || [])[1] || fromRaw.trim();
    var toEmail = body.recipient || body.To || body.to || "";
    var subject = body.subject || body.Subject || "(No subject)";
    var bodyText = (body["body-plain"] || body.text || "").slice(0, 8000);
    var bodyHtml = body["body-html"] ? stripHtml(body["body-html"]) : null;
    var messageId = body["Message-Id"] || body["message-id"] || body["Message-ID"] ||
      (fromEmail + "_" + timestamp);

    if (!fromEmail) return res.status(400).json({ error: "No sender" });

    var row = {
      from_email: fromEmail,
      from_name: fromName || fromEmail.split("@")[0],
      to_email: toEmail,
      subject: subject,
      body_text: bodyText,
      body_html: bodyHtml,
      status: "new",
      message_id: messageId,
      received_at: new Date().toISOString()
    };

    await shared.supabaseRequest("/email_inbox", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(row)
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("email-inbox error:", e.message);
    return res.status(200).json({ ok: true }); // always 200 to Mailgun
  }
};
