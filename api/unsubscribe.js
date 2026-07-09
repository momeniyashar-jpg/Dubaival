const { supabaseRequest } = require("./lib/shared");

module.exports = async function handler(req, res) {
  const token = req.query && req.query.token;
  if (!token) {
    res.status(400).send("Missing token.");
    return;
  }

  try {
    await supabaseRequest("/price_watches?unsubscribe_token=eq." + encodeURIComponent(token), {
      method: "PATCH",
      body: JSON.stringify({ active: false }),
    });
  } catch (e) {
    // best-effort; still show confirmation
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(
    `<!doctype html><html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;background:#08090C;color:#F0F2F5">
      <div style="max-width:400px;margin:0 auto">
        <div style="font-size:48px;margin-bottom:16px">✓</div>
        <h2 style="color:#D4AF37">Unsubscribed</h2>
        <p style="color:#8899AA">You won't receive any more price alerts for this watch.</p>
        <a href="https://www.dubaival.com" style="display:inline-block;margin-top:24px;background:#D4AF37;color:#070B14;padding:10px 28px;border-radius:8px;text-decoration:none;font-weight:700">Back to DubaiVal</a>
      </div>
    </body></html>`
  );
};
