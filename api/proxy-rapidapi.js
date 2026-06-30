var { rateLimitExceeded } = require("./lib/ratelimit");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (rateLimitExceeded(req, res, 60000, 30)) return;

  var key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });

  var endpoint = req.query.endpoint;
  if (!endpoint) return res.status(400).json({ error: "Missing endpoint param" });

  var source = req.query.source || "bayut";
  var host, allowed;
  if (source === "pf") {
    host = "uae-real-estate-api-propertyfinder-ae-data.p.rapidapi.com";
    allowed = ["autocomplete-location", "search-sale", "search-rent"];
  } else {
    host = "uae-real-estate2.p.rapidapi.com";
    allowed = ["auto-complete", "properties/list", "properties/detail", "transactions/list"];
  }
  if (!allowed.some(function (a) { return endpoint.startsWith(a); }))
    return res.status(403).json({ error: "Endpoint not allowed" });

  var qs = Object.keys(req.query)
    .filter(function (k) { return k !== "endpoint" && k !== "source"; })
    .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(req.query[k]); })
    .join("&");
  var url = "https://" + host + "/" + endpoint + (qs ? "?" + qs : "");

  try {
    var upstream = await fetch(url, {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": host },
    });
    var data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream failed: " + e.message });
  }
};
