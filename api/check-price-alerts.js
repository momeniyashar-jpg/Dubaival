const { supabaseRequest, sendEmail } = require("./lib/shared");

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

async function currentTrimmedPsf(targetName, area, key) {
  const q = targetName + (area ? " " + area : "");
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
    .filter(p => p.price && p.area)
    .map(p => Math.round(p.price / p.area))
    .filter(p => p > 400 && p < 15000)
    .sort((a, b) => a - b);

  if (psfs.length < 3) return null;
  const lo = Math.floor(psfs.length * 0.2);
  const hi = Math.ceil(psfs.length * 0.8);
  const trimmed = psfs.slice(lo, hi);
  const pool = trimmed.length ? trimmed : psfs;
  return Math.round(pool.reduce((a, b) => a + b, 0) / pool.length);
}

module.exports = async function handler(req, res) {
  if (process.env.CRON_SECRET) {
    const auth = req.headers["authorization"] || "";
    if (auth !== "Bearer " + process.env.CRON_SECRET) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
  }

  const rapidKey = process.env.RAPIDAPI_KEY;
  let checked = 0, alerted = 0, errors = 0;

  try {
    const listRes = await supabaseRequest("/price_watches?active=eq.true&select=*");
    if (!listRes.ok) {
      res.status(500).json({ ok: false, error: "Could not load watches" });
      return;
    }
    const watches = await listRes.json();

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
            const dir = pctChange > 0 ? "up ↑" : "down ↓";
            const sign = pctChange > 0 ? "+" : "";
            const color = pctChange > 0 ? "#10B981" : "#EF4444";
            const ok = await sendEmail(
              w.email,
              w.target_name + " price moved " + sign + pctChange.toFixed(1) + "%",
              `<div style="font-family:Arial,sans-serif;color:#111;max-width:500px;margin:0 auto">
                <div style="background:#070B14;padding:24px;border-radius:12px">
                  <h2 style="color:#D4AF37;margin:0 0 8px">Price Alert</h2>
                  <p style="color:${color};font-size:22px;font-weight:700;margin:0 0 12px">${sign}${pctChange.toFixed(1)}% ${dir}</p>
                  <p style="color:#E8EDF5;font-size:15px"><b>${w.target_name}</b> is now averaging <b>AED ${psf.toLocaleString()}/sqft</b></p>
                  <p style="color:#8899AA;font-size:13px">Change since your last alert.</p>
                  <a href="https://www.dubaival.com" style="display:inline-block;margin-top:16px;background:#D4AF37;color:#070B14;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700">Check on DubaiVal</a>
                  <hr style="border:none;border-top:1px solid #1A1F2E;margin:20px 0">
                  <p style="color:#556677;font-size:12px"><a href="${unsubUrl}" style="color:#556677">Unsubscribe from this alert</a></p>
                </div>
              </div>`
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

    res.status(200).json({ ok: true, checked, alerted, errors });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Server error: " + e.message });
  }
};
