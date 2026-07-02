// Receives inbound emails from Brevo (Sendinblue) inbound parsing webhook
// Brevo sends JSON payload to this endpoint when an email arrives
var shared = require("../lib/shared.js");

function stripHtml(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 5000);
}

function parseFrom(fromStr) {
  // "John Doe <john@example.com>" or "john@example.com"
  fromStr = String(fromStr || "");
  var match = fromStr.match(/<([^>]+)>/);
  var email = match ? match[1] : fromStr.trim();
  var name = fromStr.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || null;
  return { email: email, name: name };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    var body = req.body || {};

    // Brevo sends JSON with these fields
    var fromRaw = body.From || body.from || body.sender || "";
    var parsed = parseFrom(fromRaw);
    var fromEmail = parsed.email;
    var fromName = parsed.name;

    var toEmail = body.To || body.to || body.recipient || "";
    // Extract just the email from "Name <email>" format
    var toMatch = String(toEmail).match(/<([^>]+)>/);
    if (toMatch) toEmail = toMatch[1];

    var subject = body.Subject || body.subject || "(No subject)";
    var bodyText = (body.TextBody || body.text_body || body.text || body["body-plain"] || "").slice(0, 8000);
    var bodyHtml = body.HtmlBody || body.html_body || body["body-html"] || null;
    if (bodyHtml) bodyHtml = stripHtml(bodyHtml);

    var messageId = body.MessageID || body.message_id || body["Message-Id"] || body["Message-ID"] ||
      (fromEmail + "_" + Date.now());

    if (!fromEmail || fromEmail === "") {
      return res.status(400).json({ error: "No sender" });
    }

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
    return res.status(200).json({ ok: true }); // always 200
  }
};
