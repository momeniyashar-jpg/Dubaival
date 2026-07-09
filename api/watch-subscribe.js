const { supabaseRequest, sendEmail } = require("./lib/shared");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.dubaival.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

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
      body: JSON.stringify([{ email, target_type: targetType, target_name: targetName, area }]),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text().catch(() => "");
      res.status(500).json({ ok: false, error: "Could not save watch: " + errText });
      return;
    }

    const rows = await insertRes.json();
    const row = rows && rows[0];

    if (row && row.unsubscribe_token) {
      const unsubUrl = "https://www.dubaival.com/api/unsubscribe?token=" + row.unsubscribe_token;
      await sendEmail(
        email,
        "You're watching " + targetName + " on DubaiVal",
        `<div style="font-family:Arial,sans-serif;color:#111;max-width:500px;margin:0 auto">
          <div style="background:#070B14;padding:24px;border-radius:12px">
            <h2 style="color:#D4AF37;margin:0 0 16px">Price Alert Set ✓</h2>
            <p style="color:#E8EDF5;font-size:15px">We'll email you when pricing for <b>${targetName}</b> moves 5% or more.</p>
            <p style="color:#8899AA;font-size:13px">DubaiVal checks prices daily using live market data from 10,800+ properties.</p>
            <hr style="border:none;border-top:1px solid #1A1F2E;margin:20px 0">
            <p style="color:#556677;font-size:12px"><a href="${unsubUrl}" style="color:#556677">Unsubscribe from this alert</a></p>
          </div>
        </div>`
      );
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Server error: " + e.message });
  }
};
