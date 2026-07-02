const { supabaseRequest } = require("./lib/shared");

var GRAPH_BASE = "https://graph.facebook.com/v25.0/";

async function fetchIGEngagement(mediaId, token) {
  try {
    var r = await fetch(GRAPH_BASE + mediaId + "?fields=like_count,comments_count,timestamp,media_type,permalink&access_token=" + token);
    var d = await r.json();
    if (d.error) return null;
    var insights = null;
    try {
      var ir = await fetch(GRAPH_BASE + mediaId + "/insights?metric=impressions,reach,engagement,saved&access_token=" + token);
      var id = await ir.json();
      if (id.data) {
        insights = {};
        id.data.forEach(function (m) { insights[m.name] = m.values[0].value; });
      }
    } catch (e) {}
    return {
      likes: d.like_count || 0,
      comments: d.comments_count || 0,
      impressions: insights ? (insights.impressions || 0) : 0,
      reach: insights ? (insights.reach || 0) : 0,
      saves: insights ? (insights.saved || 0) : 0,
      engagement_rate: insights && insights.reach > 0
        ? parseFloat(((insights.engagement || 0) / insights.reach * 100).toFixed(2))
        : 0,
      permalink: d.permalink || null
    };
  } catch (e) { return null; }
}

module.exports = async function handler(req, res) {
  var auth = req.headers["authorization"] || "";
  if (!process.env.CRON_SECRET || auth !== "Bearer " + process.env.CRON_SECRET) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  var updated = 0;
  var errors = 0;

  try {
    var engRes = await supabaseRequest(
      "/post_engagement?select=*&order=checked_at.asc&limit=50"
    );
    if (!engRes.ok) {
      res.status(500).json({ ok: false, error: "Failed to fetch engagement records" });
      return;
    }
    var records = await engRes.json();
    if (records.length === 0) {
      res.status(200).json({ ok: true, updated: 0, message: "No posts to check" });
      return;
    }

    var userIds = [];
    records.forEach(function (r) { if (userIds.indexOf(r.user_id) === -1) userIds.push(r.user_id); });
    var credsMap = {};
    for (var u = 0; u < userIds.length; u++) {
      var credsRes = await supabaseRequest("/social_credentials?user_id=eq." + encodeURIComponent(userIds[u]) + "&select=ig_token");
      if (credsRes.ok) {
        var cArr = await credsRes.json();
        if (cArr.length > 0) credsMap[userIds[u]] = cArr[0];
      }
    }

    for (var i = 0; i < records.length; i++) {
      var rec = records[i];
      try {
        if (rec.platform === "instagram" && rec.media_id) {
          var creds = credsMap[rec.user_id];
          if (!creds || !creds.ig_token) continue;

          var eng = await fetchIGEngagement(rec.media_id, creds.ig_token);
          if (eng) {
            await supabaseRequest("/post_engagement?id=eq." + rec.id, {
              method: "PATCH",
              body: JSON.stringify({
                likes: eng.likes,
                comments: eng.comments,
                impressions: eng.impressions,
                reach: eng.reach,
                saves: eng.saves,
                engagement_rate: eng.engagement_rate,
                permalink: eng.permalink,
                checked_at: new Date().toISOString()
              })
            });
            updated++;
          }
        } else {
          await supabaseRequest("/post_engagement?id=eq." + rec.id, {
            method: "PATCH",
            body: JSON.stringify({ checked_at: new Date().toISOString() })
          });
        }
      } catch (e) {
        errors++;
      }
    }

    res.status(200).json({ ok: true, updated: updated, total: records.length, errors: errors });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
