const { supabaseRequest, sendEmail } = require("../lib/shared");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const body = req.body || {};
    const email = (body.email || "").trim().toLowerCase();
    const targetName = (body.targetName || "").trim();
    const targetType = body.targetType;
    const area = body.area || null;

    if (!email || !email.includes("@") || !targetName || ["building", "area"].indexOf(targetType) === -1) {
      res.status(400).json({ ok: false, error: "Invalid input" });
      return;
    }

    const insertRes = await supabaseRequest("/price_watches", {
      method: "POST",
      headers: { Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify([{ email: email, target_type: targetType, target_name: targetName, area: area }]),
    });

    if (!insertRes.ok) {
      res.status(500).json({ ok: false, error: "Could not save watch" });
      return;
    }

    const rows = await insertRes.json();
    const row = rows && rows[0];

    if (row && row.unsubscribe_token) {
      const unsubUrl = "https://www.dubaival.com/api/unsubscribe?token=" + row.unsubscribe_token;
      await sendEmail(
        email,
        "You're watching " + targetName + " on DubAIVal",
        "<div style=\"font-family:Arial,sans-serif;color:#111\">" +
          "<h2 style=\"color:#C9A84C\">Price alert set up</h2>" +
          "<p>We'll email you if pricing for <b>" + targetName + "</b> moves 5% or more.</p>" +
          "<p style=\"font-size:12px;color:#888\"><a href=\"" + unsubUrl + "\">Unsubscribe</a></p>" +
          "</div>"
      );
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Server error" });
  }
};
