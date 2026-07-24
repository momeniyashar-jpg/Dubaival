// Unified price alerts handler (Hobby plan: 12 function limit)
// POST /api/price-alerts          → subscribe to a price watch
// GET  /api/price-alerts?action=unsubscribe&token=xxx → unsubscribe
// GET  /api/price-alerts?action=check  → cron: check & email alerts
const { supabaseRequest, sendEmail } = require("./_lib/shared");
const { rateLimitExceeded } = require("./_lib/ratelimit");

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
  } catch (e) { return null; }
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
  const psfs = hits.filter(p => p.price && p.area)
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

async function handleSubscribe(req, res) {
  if (rateLimitExceeded(req, res, 60000, 5)) return;

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
    const unsubUrl = "https://www.dubaival.com/api/price-alerts?action=unsubscribe&token=" + row.unsubscribe_token;
    await sendEmail(
      email,
      "You're watching " + targetName + " on DubaiVal",
      `<div style="font-family:Arial,sans-serif;color:#111;max-width:500px;margin:0 auto">
        <div style="background:#070B14;padding:24px;border-radius:12px">
          <h2 style="color:#D4AF37;margin:0 0 16px">Price Alert Set ✓</h2>
          <p style="color:#E8EDF5;font-size:15px">We'll email you when pricing for <b>${targetName}</b> moves 5% or more.</p>
          <p style="color:#8899AA;font-size:13px">DubaiVal checks prices daily using live market data from 11,600+ properties.</p>
          <hr style="border:none;border-top:1px solid #1A1F2E;margin:20px 0">
          <p style="color:#556677;font-size:12px"><a href="${unsubUrl}" style="color:#556677">Unsubscribe from this alert</a></p>
        </div>
      </div>`
    );
  }

  res.status(200).json({ ok: true });
}

async function handleUnsubscribe(req, res) {
  const token = req.query && req.query.token;
  if (!token) { res.status(400).send("Missing token."); return; }

  try {
    await supabaseRequest("/price_watches?unsubscribe_token=eq." + encodeURIComponent(token), {
      method: "PATCH",
      body: JSON.stringify({ active: false }),
    });
  } catch (e) { /* best-effort */ }

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
}

async function handleCheck(req, res) {
  if (process.env.CRON_SECRET) {
    const auth = req.headers["authorization"] || "";
    if (auth !== "Bearer " + process.env.CRON_SECRET) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }
  }

  const rapidKey = process.env.RAPIDAPI_KEY;
  let checked = 0, alerted = 0, errors = 0;
  const startTime = Date.now();

  try {
    const listRes = await supabaseRequest("/price_watches?active=eq.true&select=*");
    if (!listRes.ok) { res.status(500).json({ ok: false, error: "Could not load watches" }); return; }
    const watches = await listRes.json();

    for (const w of watches) {
      // Bail before hitting the function's time budget so we return a clean
      // response with partial progress instead of getting hard-killed mid
      // request — remaining watches simply get checked on tomorrow's run.
      if (Date.now() - startTime > 50000) break;
      checked++;
      try {
        const psf = await currentTrimmedPsf(w.target_name, w.area, rapidKey);
        if (psf == null) continue;
        const now = new Date().toISOString();

        if (w.last_psf) {
          const pctChange = ((psf - w.last_psf) / w.last_psf) * 100;
          if (Math.abs(pctChange) >= (w.threshold_pct || 5)) {
            const unsubUrl = "https://www.dubaival.com/api/price-alerts?action=unsubscribe&token=" + w.unsubscribe_token;
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
                  <a href="https://www.dubaival.com" style="display:inline-block;margin-top:16px;background:#D4AF37;color:#070B14;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700">Check on DubaiVal</a>
                  <hr style="border:none;border-top:1px solid #1A1F2E;margin:20px 0">
                  <p style="color:#556677;font-size:12px"><a href="${unsubUrl}" style="color:#556677">Unsubscribe</a></p>
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
      } catch (e) { errors++; }
    }

    res.status(200).json({ ok: true, checked, alerted, errors });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Server error: " + e.message });
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.dubaival.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const action = req.query && req.query.action;

  if (req.method === "POST") return handleSubscribe(req, res);
  if (req.method === "GET" && action === "unsubscribe") return handleUnsubscribe(req, res);
  if (req.method === "GET" && action === "check") return handleCheck(req, res);

  res.status(405).json({ ok: false, error: "Method not allowed" });
};
