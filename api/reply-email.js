// Manual agent reply to an email — POST {messageId, replyTo, replyName, subject, body}
// Called from the Inbox UI when an agent types and sends a reply
var shared = require("../lib/shared.js");

var FROM = process.env.ALERTS_FROM_EMAIL || "DubAIVal <hello@dubaival.com>";

function buildReplyHtml(body, agentName) {
  var lines = (body || "").split("\n").map(function(l) {
    return "<p style='margin:0 0 10px'>" + l.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") + "</p>";
  }).join("");
  return [
    "<div style='font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#222'>",
    "<div style='background:#070B14;padding:20px 24px;border-radius:8px 8px 0 0'>",
    "<img src='https://www.dubaival.com/logo.png' alt='DubAIVal' style='height:40px'>",
    "</div>",
    "<div style='padding:24px;background:#fff;border-radius:0 0 8px 8px'>",
    lines,
    "<hr style='border:none;border-top:1px solid #eee;margin:20px 0'>",
    "<p style='color:#555;font-size:13px'>" + (agentName || "DubAIVal Team") + "</p>",
    "<p style='color:#888;font-size:12px'>DubAIVal — AI-Powered Dubai Real Estate Valuations<br>",
    "<a href='https://www.dubaival.com' style='color:#D4AF37'>www.dubaival.com</a></p>",
    "</div></div>"
  ].join("");
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    var body = req.body || {};
    var messageId = body.messageId;
    var replyTo = body.replyTo;
    var replyName = body.replyName;
    var subject = body.subject;
    var replyBody = body.body;
    var agentName = body.agentName || "DubAIVal Team";

    if (!messageId || !replyTo || !replyBody) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    var replySubject = subject && subject !== "(No subject)"
      ? (subject.startsWith("Re:") ? subject : "Re: " + subject)
      : "Re: Your inquiry to DubAIVal";

    var emailOk = await shared.sendEmail(replyTo, replySubject, buildReplyHtml(replyBody, agentName));
    if (!emailOk) return res.status(500).json({ error: "Failed to send email" });

    await shared.supabaseRequest("/email_inbox?id=eq." + messageId, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "agent_replied",
        agent_reply: replyBody,
        replied_at: new Date().toISOString()
      })
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("reply-email error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
