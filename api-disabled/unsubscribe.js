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
    // best-effort; still show the confirmation page below
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(
    "<!doctype html><html><body style=\"font-family:Arial,sans-serif;text-align:center;padding:60px;background:#08090C;color:#F0F2F5\">" +
      "<h2 style=\"color:#C9A84C\">Unsubscribed</h2>" +
      "<p>You won't receive any more price alerts for this watch.</p>" +
      "<a href=\"https://www.dubaival.com\" style=\"color:#C9A84C\">Back to DubAIVal</a>" +
      "</body></html>"
  );
};
