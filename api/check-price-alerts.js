const { supabaseRequest, sendEmail } = require("../lib/shared");

const UAE_RE_HOST = "uae-real-estate2.p.rapidapi.com";

async function getLocationId(query, key) {
  try {
    const r = await fetch(
      "https://" + UAE_RE_HOST + "/auto-complete?query=" + encodeURIComponent(query) + "&hitsPerPage=5",
      { headers: { "x-rapidapi-key": key, "x-rapidapi-host": UAE_RE_HOST } }
    );
    if (!r.ok) return null;
    const d = await r.json();
    const hits = d.hits || [];
    return hits.length > 0 ? hits[0].objectID || hits[0].id || null : null;
  } catch (e) {
    return null;
  }
}

// Mirrors the trimmed-mean outlier fix already shipped client-side for live comps
// (only the 20th-80th percentile band is averaged, so one distress/bulk listing
// can't swing the alert).
async function currentTrimmedPsf(targetName, area, key) {
  const q = targetName + " " + (area || "");
  const locId = (await getLocationId(q, key)) || (area ? await getLocationId(area, key) : null);
  if (!locId) return null;

  const params = new URLSearchParams({ locationExternalIDs: locId, purpose: "for-sale", hitsPerPage: "20", page: "0" });
  const r = await fetch("https://" + UAE_RE_HOST + "/properties/list?" + params, {
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": UAE_RE_HOST },
  });
  if (!r.ok) return null;

  const d = await r.json();
  const hits = d.hits || [];
  const psfs = hits
    .filter(function (p) { return p.price && p.area; })
    .map(function (p) { return Math.round(p.price / p.area); })
    .filter(function (p) { return p > 400 && p < 15000; })
    .sort(function (a, b) { return a - b; });

  if (psfs.length < 3) return null;
  const lo = Math.floor(psfs.length * 0.2);
  const hi = Math.ceil(psfs.length * 0.8);
  const trimmed = psfs.slice(lo, hi);
  const pool = trimmed.length ? trimmed : psfs;
  return Math.round(pool.reduce(function (a, b) { return a + b; }, 0) / pool.length);
}

module.exports = async function handler(req, res) {
  const auth = req.headers["authorization"] || "";
  if (!process.env.CRON_SECRET || auth !== "Bearer " + process.env.CRON_SECRET) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  const rapidKey = process.env.RAPIDAPI_KEY;
  let checked = 0;
  let alerted = 0;
  let errors = 0;

  try {
    const listRes = await supabaseRequest("/price_watches?active=eq.true&select=*");
    const watches = listRes.ok ? await listRes.json() : [];

    for (const w of watches) {
      checked++;
      try {
        const psf = await currentTrimmedPsf(w.target_name, w.area, rapidKey);
        if (psf == null) continue;

        const now = new Date().toISOString();

        if (w.last_psf) {
          const pctChange = ((psf - w.last_psf) / w.last_psf) * 100;
          if (Math.abs(pctChange) >= (w.threshold_pct || 5)) {
            const unsubUrl = "https://www.dubaival.com/api/unsubscribe?token=" + w.unsubscribe_token;
            const dir = pctChange > 0 ? "up" : "down";
            const ok = await sendEmail(
              w.email,
              w.target_name + " price moved " + (pctChange > 0 ? "+" : "") + pctChange.toFixed(1) + "%",
              "<div style=\"font-family:Arial,sans-serif;color:#111\">" +
                "<h2 style=\"color:#C9A84C\">Price moved " + dir + "</h2>" +
                "<p><b>" + w.target_name + "</b> is now averaging AED " + psf.toLocaleString() + "/sqft (" +
                (pctChange > 0 ? "+" : "") + pctChange.toFixed(1) + "% since your last alert).</p>" +
                "<p><a href=\"https://www.dubaival.com\" style=\"color:#C9A84C\">Check it on DubAIVal</a></p>" +
                "<p style=\"font-size:12px;color:#888\"><a href=\"" + unsubUrl + "\">Unsubscribe</a></p>" +
                "</div>"
            );
            if (ok) alerted++;
            await supabaseRequest("/price_watches?id=eq." + w.id, {
              method: "PATCH",
              body: JSON.stringify({ last_psf: psf, last_checked_at: now, last_alerted_at: now }),
            });
            continue;
          }
        }

        await supabaseRequest("/price_watches?id=eq." + w.id, {
          method: "PATCH",
          body: JSON.stringify({ last_psf: psf, last_checked_at: now }),
        });
      } catch (e) {
        errors++;
      }
    }

    res.status(200).json({ ok: true, checked: checked, alerted: alerted, errors: errors });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Server error" });
  }
};
