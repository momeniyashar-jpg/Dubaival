module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  var token = process.env.IG_PAGE_TOKEN;
  var igId = process.env.IG_ACCOUNT_ID;
  if (!token || !igId) return res.status(500).json({ error: "Instagram not configured" });

  var body = req.body;
  if (!body || !body.action) return res.status(400).json({ error: "Missing action" });

  var graphBase = "https://graph.facebook.com/v25.0/";

  try {
    if (body.action === "create_media") {
      if (!body.image_url || !body.caption) return res.status(400).json({ error: "Missing image_url or caption" });
      var params = new URLSearchParams({
        image_url: body.image_url,
        caption: body.caption,
        access_token: token
      });
      var r = await fetch(graphBase + igId + "/media", { method: "POST", body: params });
      var d = await r.json();
      if (d.error) return res.status(400).json(d);
      return res.status(200).json(d);
    }

    if (body.action === "publish") {
      if (!body.creation_id) return res.status(400).json({ error: "Missing creation_id" });
      var params2 = new URLSearchParams({
        creation_id: body.creation_id,
        access_token: token
      });
      var r2 = await fetch(graphBase + igId + "/media_publish", { method: "POST", body: params2 });
      var d2 = await r2.json();
      if (d2.error) return res.status(400).json(d2);
      return res.status(200).json(d2);
    }

    if (body.action === "post") {
      if (!body.image_url || !body.caption) return res.status(400).json({ error: "Missing image_url or caption" });
      var cParams = new URLSearchParams({
        image_url: body.image_url,
        caption: body.caption,
        access_token: token
      });
      var cr = await fetch(graphBase + igId + "/media", { method: "POST", body: cParams });
      var cd = await cr.json();
      if (cd.error) return res.status(400).json(cd);
      var pParams = new URLSearchParams({
        creation_id: cd.id,
        access_token: token
      });
      var pr = await fetch(graphBase + igId + "/media_publish", { method: "POST", body: pParams });
      var pd = await pr.json();
      if (pd.error) return res.status(400).json(pd);
      return res.status(200).json({ success: true, media_id: pd.id, creation_id: cd.id });
    }

    if (body.action === "fb_post") {
      var fbPageId = process.env.FB_PAGE_ID;
      if (!fbPageId) return res.status(500).json({ error: "FB_PAGE_ID not configured" });
      if (!body.message) return res.status(400).json({ error: "Missing message" });
      var fbParams = new URLSearchParams({ message: body.message, access_token: token });
      if (body.link) fbParams.set("link", body.link);
      var fbr = await fetch(graphBase + fbPageId + "/feed", { method: "POST", body: fbParams });
      var fbd = await fbr.json();
      if (fbd.error) return res.status(400).json(fbd);
      return res.status(200).json({ success: true, post_id: fbd.id });
    }

    return res.status(400).json({ error: "Unknown action: " + body.action });
  } catch (e) {
    res.status(502).json({ error: "Instagram API failed: " + e.message });
  }
};
