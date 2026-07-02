// Daily 8 AM cron — sends AI auto-replies to all unanswered emails in email_inbox
// Runs as a Vercel cron (GET). Skips emails that already have agent_reply.
var shared = require("./lib/shared.js");

var GROQ_KEY = process.env.GROQ_API_KEY;
var FROM = process.env.ALERTS_FROM_EMAIL || "DubAIVal <hello@dubaival.com>";

async function generateEmailReply(fromName, subject, bodyText) {
  if (!GROQ_KEY) return null;
  var systemPrompt = `You are DubAIVal, an expert Dubai real estate AI agent. You reply to client emails professionally and helpfully on behalf of the DubAIVal team.

You help clients with property valuations, investment advice, area comparisons, off-plan projects, rental yields, and general Dubai property market questions.

Guidelines:
- Be warm, professional, and concise
- Reply in the same language as the client's email (Arabic, English, or Farsi)
- Keep replies under 300 words
- End with an offer to provide a detailed property valuation or schedule a call
- Sign off as: "The DubAIVal Team | www.dubaival.com"
- Do NOT include any generic pleasantries like "I hope this email finds you well"
- Get straight to the point`;

  try {
    var r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Email from: " + (fromName || "Client") + "\nSubject: " + subject + "\n\nMessage:\n" + (bodyText || "").slice(0, 1500) }
        ],
        max_tokens: 400,
        temperature: 0.7
      })
    });
    var d = await r.json();
    return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || null;
  } catch (e) { return null; }
}

function buildEmailHtml(reply) {
  var lines = reply.split("\n").map(function(l) {
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
    "<p style='color:#888;font-size:12px'>DubAIVal — AI-Powered Dubai Real Estate Valuations<br>",
    "<a href='https://www.dubaival.com' style='color:#D4AF37'>www.dubaival.com</a></p>",
    "</div></div>"
  ].join("");
}

module.exports = async function handler(req, res) {
  // Vercel crons hit GET; also allow POST for manual trigger
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).end();

  var secret = process.env.CRON_SECRET;
  if (secret) {
    var auth = (req.headers["authorization"] || "").replace("Bearer ", "");
    if (auth !== secret) return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Fetch all unanswered emails (status=new, no agent_reply already set)
    var resp = await shared.supabaseRequest(
      "/email_inbox?status=eq.new&select=id,from_email,from_name,subject,body_text&order=received_at.asc&limit=50",
      { method: "GET" }
    );
    if (!resp.ok) return res.status(500).json({ error: "Failed to fetch emails" });
    var emails = await resp.json();

    if (!emails.length) return res.status(200).json({ ok: true, sent: 0 });

    var sent = 0;
    var errors = 0;
    for (var i = 0; i < emails.length; i++) {
      var email = emails[i];
      try {
        var reply = await generateEmailReply(email.from_name, email.subject, email.body_text);
        if (!reply) { errors++; continue; }

        var replySubject = email.subject && email.subject !== "(No subject)"
          ? (email.subject.startsWith("Re:") ? email.subject : "Re: " + email.subject)
          : "Re: Your inquiry to DubAIVal";

        var emailOk = await shared.sendEmail(email.from_email, replySubject, buildEmailHtml(reply));
        if (!emailOk) { errors++; continue; }

        await shared.supabaseRequest("/email_inbox?id=eq." + email.id, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            status: "ai_replied",
            ai_reply: reply,
            replied_at: new Date().toISOString()
          })
        });
        sent++;
      } catch (e) { errors++; }
    }

    return res.status(200).json({ ok: true, sent: sent, errors: errors, total: emails.length });
  } catch (e) {
    console.error("send-email-replies error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
