module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  var key = process.env.GROQ_API_KEY;
  if (!key) return res.status(500).json({ error: "GROQ_API_KEY not configured" });

  var body = req.body;
  if (!body || !body.messages) return res.status(400).json({ error: "Missing messages" });

  var allowed = ["llama-3.3-70b-versatile", "llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768"];
  var model = body.model || "llama-3.3-70b-versatile";
  if (allowed.indexOf(model) === -1) return res.status(400).json({ error: "Model not allowed" });

  try {
    var upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({
        model: model,
        messages: body.messages,
        temperature: body.temperature !== undefined ? body.temperature : 0.4,
        max_tokens: Math.min(body.max_tokens || 900, 2000),
      }),
    });
    var data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream failed: " + e.message });
  }
};
