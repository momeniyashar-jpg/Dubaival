const { supabaseRequest } = require("./lib/shared");

var GRAPH_BASE = "https://graph.facebook.com/v25.0/";

async function getPageToken(igToken, fbId) {
  try {
    var r = await fetch(GRAPH_BASE + "me/accounts?access_token=" + igToken);
    var d = await r.json();
    if (d.data) {
      var pg = d.data.find(function (p) { return p.id === fbId; });
      if (pg && pg.access_token) return pg.access_token;
    }
  } catch (e) {}
  return igToken;
}

async function publishIG(caption, imageUrl, creds) {
  if (!creds.ig_token || !creds.ig_id) return { p: "instagram", ok: false, err: "Not configured" };
  try {
    var params = new URLSearchParams({ image_url: imageUrl, caption: caption, access_token: creds.ig_token });
    var r1 = await fetch(GRAPH_BASE + creds.ig_id + "/media", { method: "POST", body: params });
    var d1 = await r1.json();
    if (d1.error) return { p: "instagram", ok: false, err: d1.error.message };
    for (var attempt = 0; attempt < 10; attempt++) {
      await new Promise(function (r) { setTimeout(r, 3000); });
      var sr = await fetch(GRAPH_BASE + d1.id + "?fields=status_code&access_token=" + creds.ig_token);
      var sd = await sr.json();
      if (sd.status_code === "FINISHED") break;
      if (sd.status_code === "ERROR") return { p: "instagram", ok: false, err: "Instagram rejected the image" };
    }
    var params2 = new URLSearchParams({ creation_id: d1.id, access_token: creds.ig_token });
    var r2 = await fetch(GRAPH_BASE + creds.ig_id + "/media_publish", { method: "POST", body: params2 });
    var d2 = await r2.json();
    if (d2.error) return { p: "instagram", ok: false, err: d2.error.message };
    return { p: "instagram", ok: true, id: d2.id };
  } catch (e) { return { p: "instagram", ok: false, err: e.message }; }
}

async function publishFB(message, imageUrl, creds) {
  if (!creds.ig_token || !creds.fb_id) return { p: "facebook", ok: false, err: "Not configured" };
  try {
    var pageToken = await getPageToken(creds.ig_token, creds.fb_id);
    if (imageUrl) {
      var pp = new URLSearchParams({ url: imageUrl, message: message, access_token: pageToken });
      var pr = await fetch(GRAPH_BASE + creds.fb_id + "/photos", { method: "POST", body: pp });
      var pd = await pr.json();
      if (pd.error) return { p: "facebook", ok: false, err: pd.error.message };
      return { p: "facebook", ok: true, id: pd.id || pd.post_id };
    }
    var params = new URLSearchParams({ message: message, access_token: pageToken });
    var r = await fetch(GRAPH_BASE + creds.fb_id + "/feed", { method: "POST", body: params });
    var d = await r.json();
    if (d.error) return { p: "facebook", ok: false, err: d.error.message };
    return { p: "facebook", ok: true, id: d.id };
  } catch (e) { return { p: "facebook", ok: false, err: e.message }; }
}

async function publishLI(text, imageUrl, creds) {
  if (!creds.linkedin_token || !creds.linkedin_urn) return { p: "linkedin", ok: false, err: "Not configured" };
  try {
    var body;
    if (imageUrl) {
      var regResp = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
        method: "POST",
        headers: { "Authorization": "Bearer " + creds.linkedin_token, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
        body: JSON.stringify({ registerUploadRequest: { recipes: ["urn:li:digitalmediaRecipe:feedshare-image"], owner: creds.linkedin_urn, serviceRelationships: [{ identifier: "urn:li:userGeneratedContent", relationshipType: "OWNER" }] } })
      });
      var regData = await regResp.json();
      var uploadUrl = regData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
      var asset = regData.value.asset;
      var imgResp = await fetch(imageUrl);
      var imgBlob = await imgResp.blob();
      await fetch(uploadUrl, { method: "PUT", headers: { "Authorization": "Bearer " + creds.linkedin_token }, body: imgBlob });
      body = { author: creds.linkedin_urn, lifecycleState: "PUBLISHED", specificContent: { "com.linkedin.ugc.ShareContent": { shareCommentary: { text: text }, shareMediaCategory: "IMAGE", media: [{ status: "READY", media: asset }] } }, visibility: { memberNetworkVisibility: "PUBLIC" } };
    } else {
      body = { author: creds.linkedin_urn, lifecycleState: "PUBLISHED", specificContent: { "com.linkedin.ugc.ShareContent": { shareCommentary: { text: text }, shareMediaCategory: "NONE" } }, visibility: { memberNetworkVisibility: "PUBLIC" } };
    }
    var r = await fetch("https://api.linkedin.com/v2/ugcPosts", { method: "POST", headers: { "Authorization": "Bearer " + creds.linkedin_token, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" }, body: JSON.stringify(body) });
    var d = await r.json();
    if (d.id) return { p: "linkedin", ok: true, id: d.id };
    return { p: "linkedin", ok: false, err: d.message || JSON.stringify(d) };
  } catch (e) { return { p: "linkedin", ok: false, err: e.message }; }
}

function _xPercentEncode(s) { return encodeURIComponent(s).replace(/[!'()*]/g, function (c) { return "%" + c.charCodeAt(0).toString(16).toUpperCase(); }); }

async function _xOauthSign(method, url, params, consumerSecret, tokenSecret) {
  var keys = Object.keys(params).sort();
  var paramStr = keys.map(function (k) { return _xPercentEncode(k) + "=" + _xPercentEncode(params[k]); }).join("&");
  var baseStr = method.toUpperCase() + "&" + _xPercentEncode(url) + "&" + _xPercentEncode(paramStr);
  var signingKey = _xPercentEncode(consumerSecret) + "&" + _xPercentEncode(tokenSecret);
  var crypto = require("crypto");
  var sig = crypto.createHmac("sha1", signingKey).update(baseStr).digest("base64");
  return sig;
}

async function publishTW(text, creds) {
  if (!creds.twitter_consumer_key || !creds.twitter_access_token) return { p: "twitter", ok: false, err: "Not configured" };
  try {
    var nonce = require("crypto").randomBytes(16).toString("hex");
    var ts = Math.floor(Date.now() / 1000).toString();
    var url = "https://api.twitter.com/2/tweets";
    var oauthParams = { oauth_consumer_key: creds.twitter_consumer_key, oauth_nonce: nonce, oauth_signature_method: "HMAC-SHA1", oauth_timestamp: ts, oauth_token: creds.twitter_access_token, oauth_version: "1.0" };
    oauthParams.oauth_signature = await _xOauthSign("POST", url, oauthParams, creds.twitter_consumer_secret, creds.twitter_access_secret);
    var hdr = "OAuth " + Object.keys(oauthParams).sort().map(function (k) { return _xPercentEncode(k) + '="' + _xPercentEncode(oauthParams[k]) + '"'; }).join(", ");
    var tweetText = text.length > 280 ? text.substring(0, 277) + "..." : text;
    var r = await fetch(url, { method: "POST", headers: { "Authorization": hdr, "Content-Type": "application/json" }, body: JSON.stringify({ text: tweetText }) });
    var d = await r.json();
    if (d.data && d.data.id) return { p: "twitter", ok: true, id: d.data.id };
    return { p: "twitter", ok: false, err: d.detail || d.title || JSON.stringify(d) };
  } catch (e) { return { p: "twitter", ok: false, err: e.message }; }
}

async function findImageForPost(caption, pexelsKey) {
  if (!pexelsKey) return null;
  try {
    var words = caption.replace(/[#@🏙️🏡💰📊🔥✨🌊⛳🏖️🌴]/g, "").split(/\s+/).filter(function (w) { return w.length > 3; }).slice(0, 3).join(" ");
    var query = (words || "Dubai real estate luxury") + " Dubai";
    var r = await fetch("https://api.pexels.com/v1/search?query=" + encodeURIComponent(query) + "&per_page=5&orientation=landscape", {
      headers: { Authorization: pexelsKey }
    });
    var d = await r.json();
    if (d.photos && d.photos.length > 0) return d.photos[0].src.large;
  } catch (e) {}
  return "https://images.pexels.com/photos/3769312/pexels-photo-3769312.jpeg?auto=compress&w=1080";
}

module.exports = async function handler(req, res) {
  if (process.env.CRON_SECRET) {
    var auth = req.headers["authorization"] || "";
    if (auth !== "Bearer " + process.env.CRON_SECRET) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
  }

  var published = 0;
  var failed = 0;
  var skipped = 0;
  var errors = [];

  try {
    var now = new Date();
    var nowDate = now.toISOString().split("T")[0];
    var nowTime = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");

    var postsRes = await supabaseRequest(
      "/scheduled_posts?status=eq.scheduled&scheduled_date=lte." + nowDate +
      "&select=*&order=scheduled_date.asc,scheduled_time.asc&limit=20"
    );
    if (!postsRes.ok) {
      res.status(500).json({ ok: false, error: "Failed to fetch scheduled posts" });
      return;
    }
    var posts = await postsRes.json();

    var duePosts = posts.filter(function (p) {
      return p.scheduled_date < nowDate || (p.scheduled_date === nowDate && p.scheduled_time <= nowTime + ":00");
    });

    if (duePosts.length === 0) {
      res.status(200).json({ ok: true, published: 0, message: "No due posts" });
      return;
    }

    var userIds = [];
    duePosts.forEach(function (p) { if (userIds.indexOf(p.user_id) === -1) userIds.push(p.user_id); });

    var credsMap = {};
    for (var u = 0; u < userIds.length; u++) {
      var credsRes = await supabaseRequest("/social_credentials?user_id=eq." + encodeURIComponent(userIds[u]) + "&select=*");
      if (credsRes.ok) {
        var cArr = await credsRes.json();
        if (cArr.length > 0) credsMap[userIds[u]] = cArr[0];
      }
    }

    for (var i = 0; i < duePosts.length; i++) {
      var post = duePosts[i];
      var creds = credsMap[post.user_id];
      if (!creds) {
        skipped++;
        await supabaseRequest("/scheduled_posts?id=eq." + post.id, {
          method: "PATCH",
          body: JSON.stringify({ status: "failed", error_log: "No social credentials found", updated_at: now.toISOString() })
        });
        continue;
      }

      await supabaseRequest("/scheduled_posts?id=eq." + post.id, {
        method: "PATCH",
        body: JSON.stringify({ status: "publishing", updated_at: now.toISOString() })
      });

      var caption = post.caption || "";
      var platform = post.platform || "all";
      var imageUrl = post.image_url;
      if (!imageUrl) imageUrl = await findImageForPost(caption, creds.pexels_key);

      var results = [];
      if (platform === "instagram" || platform === "all") {
        results.push(await publishIG(caption, imageUrl, creds));
      }
      if (platform === "facebook" || platform === "all") {
        results.push(await publishFB(caption, imageUrl, creds));
      }
      if (platform === "linkedin" || platform === "all") {
        results.push(await publishLI(caption, imageUrl, creds));
      }
      if (platform === "twitter" || platform === "all") {
        results.push(await publishTW(caption, creds));
      }

      var succeeded = results.filter(function (r) { return r.ok; });
      var failedR = results.filter(function (r) { return !r.ok; });
      var status = failedR.length === 0 ? "published" : succeeded.length === 0 ? "failed" : "partial";

      await supabaseRequest("/scheduled_posts?id=eq." + post.id, {
        method: "PATCH",
        body: JSON.stringify({
          status: status,
          results: results,
          published_at: now.toISOString(),
          error_log: failedR.length > 0 ? failedR.map(function (r) { return r.p + ": " + r.err; }).join("; ") : null,
          retry_count: (post.retry_count || 0) + (status === "failed" ? 1 : 0),
          updated_at: now.toISOString()
        })
      });

      if (succeeded.length > 0) {
        published++;
        for (var s = 0; s < succeeded.length; s++) {
          if (succeeded[s].id) {
            await supabaseRequest("/post_engagement", {
              method: "POST",
              body: JSON.stringify({
                user_id: post.user_id,
                platform: succeeded[s].p,
                post_id: succeeded[s].id,
                media_id: succeeded[s].id,
                caption_preview: caption.substring(0, 100),
                scheduled_post_id: post.id
              })
            });
          }
        }
      }
      if (failedR.length > 0) {
        failed++;
        errors.push({ post_id: post.id, errors: failedR.map(function (r) { return r.p + ": " + r.err; }) });
      }
    }

    res.status(200).json({
      ok: true,
      total: duePosts.length,
      published: published,
      failed: failed,
      skipped: skipped,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
