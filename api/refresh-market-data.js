const { supabaseRequest, SUPABASE_URL } = require("./_lib/shared");
const embeddings = require("./_lib/embeddings");

const UAE_RE_HOST = "uae-real-estate2.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";

const AREA_LOCATION_MAP = {
  "Dubai Marina":"dubai-marina","Downtown Dubai":"downtown-dubai",
  "Palm Jumeirah":"palm-jumeirah","Business Bay":"business-bay",
  "JVC":"jumeirah-village-circle","Dubai Hills Estate":"dubai-hills-estate",
  "MBR City":"mohammed-bin-rashid-city","Dubai Creek Harbour":"dubai-creek-harbour",
  "Jumeirah Lake Towers":"jumeirah-lake-towers","DAMAC Hills":"damac-hills",
  "Arabian Ranches":"arabian-ranches","Dubai Silicon Oasis":"dubai-silicon-oasis",
  "International City":"international-city","Dubai Sports City":"dubai-sports-city",
  "Jumeirah Beach Residence":"jumeirah-beach-residence","DIFC":"difc",
  "Al Barsha":"al-barsha","Emaar Beachfront":"emaar-beachfront",
  "Town Square":"town-square","Motor City":"motor-city",
  "Discovery Gardens":"discovery-gardens","Al Furjan":"al-furjan",
  "Dubai South":"dubai-south","Mirdif":"mirdif",
  "Jumeirah Village Triangle":"jumeirah-village-triangle",
  "Sobha Hartland":"sobha-hartland","City Walk":"city-walk",
  "Dubai Harbour":"dubai-harbour","Dubailand":"dubailand",
  "Production City":"impz","Al Quoz":"al-quoz","Barsha Heights":"barsha-heights",
  "The Valley":"the-valley","Tilal Al Ghaf":"tilal-al-ghaf",
  "Dubai Land Residence Complex":"dlrc","Jumeirah":"jumeirah",
  "Al Sufouh":"al-sufouh","Mudon":"mudon","Reem":"reem",
  "The Greens":"the-greens","The Views":"the-views"
};

function trimmedMean(arr) {
  if (!arr.length) return null;
  arr.sort(function(a,b){return a-b;});
  var lo = arr[Math.floor(arr.length * 0.2)];
  var hi = arr[Math.floor(arr.length * 0.8)];
  var trimmed = arr.filter(function(v){return v >= lo && v <= hi;});
  var pool = trimmed.length ? trimmed : arr;
  return Math.round(pool.reduce(function(s,v){return s+v;}, 0) / pool.length);
}

async function fetchAreaListings(areaSlug, purpose) {
  try {
    var url = "https://" + UAE_RE_HOST + "/properties/list" +
      "?locationExternalIDs=" + encodeURIComponent(areaSlug) +
      "&purpose=" + purpose +
      "&hitsPerPage=25&page=0&sort=date-desc";
    var r = await fetch(url, {
      headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": UAE_RE_HOST }
    });
    if (!r.ok) return [];
    var data = await r.json();
    return (data.hits || []).filter(function(h) {
      return h.price > 0 && h.area > 0;
    });
  } catch(e) {
    return [];
  }
}

function extractRents(listings) {
  var byBeds = {};
  listings.forEach(function(l) {
    var beds = l.rooms || 0;
    if (!byBeds[beds]) byBeds[beds] = [];
    byBeds[beds].push(l.price);
  });
  return {
    studio: trimmedMean(byBeds[0] || []),
    r1: trimmedMean(byBeds[1] || []),
    r2: trimmedMean(byBeds[2] || []),
    r3: trimmedMean(byBeds[3] || [])
  };
}

function buildMarketFact(area, today, psf, sampleSize, rents) {
  var parts = [];
  if (psf) parts.push("average price is AED " + psf + " per sqft (based on " + sampleSize + " live listings)");
  if (rents.studio) parts.push("studio rent ~AED " + rents.studio + "/yr");
  if (rents.r1) parts.push("1BR rent ~AED " + rents.r1 + "/yr");
  if (rents.r2) parts.push("2BR rent ~AED " + rents.r2 + "/yr");
  if (rents.r3) parts.push("3BR rent ~AED " + rents.r3 + "/yr");
  if (!parts.length) return null;
  return area + " market snapshot (" + today + "): " + parts.join("; ") + ".";
}

// Best-effort: batch-embeds all of today's area facts and upserts them into
// the knowledge_base table for RAG grounding. Never throws — a failure here
// must never affect the cron job's own area_benchmarks/price_history writes,
// which have already completed by the time this runs.
async function ingestMarketSnapshotsToKnowledgeBase(facts) {
  if (!embeddings.hasProvider() || !facts.length) return 0;
  var texts = facts.map(function (f) { return f.content; });
  var vectors = await embeddings.embedTexts(texts, "RETRIEVAL_DOCUMENT");

  var rows = [];
  facts.forEach(function (f, i) {
    var vec = vectors[i];
    if (!vec) return;
    rows.push({
      source_type: "market_snapshot",
      source_url: "area-snapshot:" + f.area + ":" + f.date,
      title: f.area + " market snapshot — " + f.date,
      content: f.content,
      area: f.area,
      tag: null,
      embedding: vec,
      published_at: new Date().toISOString()
    });
  });
  if (!rows.length) return 0;

  var resp = await supabaseRequest("/knowledge_base", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows)
  });
  return resp.ok ? rows.length : 0;
}

// One market_snapshot row is inserted per area per day (source_url embeds the
// date, so days never overwrite each other) — left unchecked this grows the
// knowledge_base table forever and dilutes retrieval with stale numbers.
// Prunes snapshot rows past the retention window; news rows are left alone
// (much lower volume, and recency-weighted ranking already deprioritizes them).
var SNAPSHOT_RETENTION_DAYS = 90;
async function pruneOldMarketSnapshots() {
  var cutoff = new Date(Date.now() - SNAPSHOT_RETENTION_DAYS * 86400000).toISOString();
  var resp = await supabaseRequest(
    "/knowledge_base?source_type=eq.market_snapshot&published_at=lt." + encodeURIComponent(cutoff),
    { method: "DELETE", headers: { Prefer: "return=minimal" } }
  );
  return resp.ok;
}

// ── AI forecast-accuracy feedback loop ──────────────────────────────────────
// runMarketIntelligence() (js/core.js) asks the LLM to *estimate* each area's
// trailing 6-month price change purely from its own training knowledge, with
// nothing to check itself against — the estimate is stored in market_momentum
// and never verified. This audit compares that stored estimate against the
// REALIZED 6-month price change computed from real tracked listings in
// price_history (populated by the daily area-refresh run above), then writes
// the discrepancy into knowledge_base as a new fact. Grounded AI answers
// about an area can then retrieve "here's how accurate our own past estimate
// was for this area" — a genuine, compounding feedback signal, distinct from
// (and complementary to) the Analyzer's separate hardcoded-database
// calibration. Runs on its own weekly cron via ?action=forecast-audit rather
// than every day — market_momentum estimates don't change often enough to need
// daily re-auditing, and keeping this off the already-tight daily-refresh
// budget avoids any risk to that cron.
var FORECAST_BASELINE_DAYS = 180; // "6 months" per the runMarketIntelligence prompt
var FORECAST_BASELINE_WINDOW_DAYS = 30; // tolerance either side of the exact mark
var FORECAST_TIME_BUDGET_MS = 45000; // leave headroom under the 60s maxDuration

async function auditForecastForArea(cfg) {
  if (cfg.pct_change === null || cfg.pct_change === undefined || !cfg.updated_at) return null;
  var forecastDate = new Date(cfg.updated_at);
  if (isNaN(forecastDate.getTime())) return null;
  var baselineTarget = new Date(forecastDate.getTime() - FORECAST_BASELINE_DAYS * 86400000);
  var winLo = new Date(baselineTarget.getTime() - FORECAST_BASELINE_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
  var winHi = new Date(baselineTarget.getTime() + FORECAST_BASELINE_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);

  try {
    var baseResp = await supabaseRequest(
      "/price_history?area_key=eq." + encodeURIComponent(cfg.area_key) +
      "&snapshot_date=gte." + winLo + "&snapshot_date=lte." + winHi +
      "&select=psf,snapshot_date&order=snapshot_date.asc&limit=1"
    );
    if (!baseResp.ok) return null;
    var baseRows = await baseResp.json();
    if (!baseRows.length || !baseRows[0].psf) return null;

    var latestResp = await supabaseRequest(
      "/price_history?area_key=eq." + encodeURIComponent(cfg.area_key) +
      "&select=psf,snapshot_date&order=snapshot_date.desc&limit=1"
    );
    if (!latestResp.ok) return null;
    var latestRows = await latestResp.json();
    if (!latestRows.length || !latestRows[0].psf) return null;

    var basePsf = baseRows[0].psf, latestPsf = latestRows[0].psf;
    if (baseRows[0].snapshot_date === latestRows[0].snapshot_date) return null; // no real time gap yet

    var realizedPct = Math.round(((latestPsf - basePsf) / basePsf) * 1000) / 10;
    var aiPct = cfg.pct_change;
    var deltaPp = Math.round((aiPct - realizedPct) * 10) / 10;
    var today = new Date().toISOString().slice(0, 10);

    var content = "AI market intelligence estimated a " + aiPct + "% 6-month price change for " +
      cfg.area_key + " (forecast made " + forecastDate.toISOString().slice(0, 10) +
      "); actual realized change based on tracked listings (" + baseRows[0].snapshot_date +
      " to " + latestRows[0].snapshot_date + ") was " + realizedPct.toFixed(1) + "%, a " +
      (deltaPp > 0 ? "+" : "") + deltaPp.toFixed(1) + " percentage-point difference.";

    return { area: cfg.area_key, date: today, content: content };
  } catch (e) {
    return null;
  }
}

async function ingestForecastAuditFacts(facts) {
  if (!embeddings.hasProvider() || !facts.length) return 0;
  var texts = facts.map(function (f) { return f.content; });
  var vectors = await embeddings.embedTexts(texts, "RETRIEVAL_DOCUMENT");

  var rows = [];
  facts.forEach(function (f, i) {
    var vec = vectors[i];
    if (!vec) return;
    rows.push({
      source_type: "forecast_accuracy",
      source_url: "forecast-accuracy:" + f.area + ":" + f.date,
      title: f.area + " forecast accuracy — " + f.date,
      content: f.content,
      area: f.area,
      tag: null,
      embedding: vec,
      published_at: new Date().toISOString()
    });
  });
  if (!rows.length) return 0;

  var resp = await supabaseRequest("/knowledge_base", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows)
  });
  return resp.ok ? rows.length : 0;
}

async function handleForecastAudit(req, res) {
  var startedAt = Date.now();
  var results = { areasChecked: 0, factsWritten: 0, skipped: 0, timedOut: false };

  try {
    var cfgResp = await supabaseRequest("/market_momentum?select=area_key,pct_change,updated_at&area_key=neq._overall");
    if (!cfgResp.ok) {
      return res.status(200).json({ ok: true, timestamp: new Date().toISOString(), results: results });
    }
    var configs = await cfgResp.json();
    if (!Array.isArray(configs)) configs = [];

    var allFacts = [];
    var AUDIT_CONCURRENCY = 5;
    for (var i = 0; i < configs.length; i += AUDIT_CONCURRENCY) {
      if (Date.now() - startedAt > FORECAST_TIME_BUDGET_MS) { results.timedOut = true; break; }
      var batch = configs.slice(i, i + AUDIT_CONCURRENCY);
      var batchFacts = await Promise.all(batch.map(auditForecastForArea));
      batchFacts.forEach(function (f) {
        results.areasChecked++;
        if (f) allFacts.push(f); else results.skipped++;
      });
    }

    results.factsWritten = await ingestForecastAuditFacts(allFacts);
    res.status(200).json({ ok: true, timestamp: new Date().toISOString(), results: results });
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message, results: results });
  }
}

module.exports = async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== "Bearer " + process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.query && req.query.action === "forecast-audit") {
    return handleForecastAudit(req, res);
  }

  var areas = Object.keys(AREA_LOCATION_MAP);
  var results = { updated: 0, skipped: 0, errors: 0, history: 0, knowledge: 0 };
  var today = new Date().toISOString().slice(0, 10);
  var marketFacts = [];

  // Process areas in small concurrent batches instead of one at a time —
  // 41 areas x 2 sequential API calls each routinely exceeded the 60s
  // function budget under normal RapidAPI latency, silently truncating the
  // daily refresh partway through the area list. Batching keeps a pause
  // between batches (gentle on the upstream API) while cutting wall-clock
  // time roughly 5x.
  var CONCURRENCY = 5;
  for (var i = 0; i < areas.length; i += CONCURRENCY) {
    var batch = areas.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async function(area) {
      var slug = AREA_LOCATION_MAP[area];
      try {
        var saleListings = await fetchAreaListings(slug, "for-sale");
        var rentListings = await fetchAreaListings(slug, "for-rent");

        var salePsfs = saleListings.map(function(l){ return Math.round(l.price / l.area); })
          .filter(function(p){ return p > 400 && p < 15000; });
        var psf = trimmedMean(salePsfs);
        var rents = extractRents(rentListings);

        if (!psf && !rents.r1) {
          results.skipped++;
          return;
        }

        var row = { area_key: area, updated_at: new Date().toISOString(), sample_size: salePsfs.length };
        if (psf) row.psf = psf;
        if (rents.studio) row.rent_studio = rents.studio;
        if (rents.r1) row.rent_1br = rents.r1;
        if (rents.r2) row.rent_2br = rents.r2;
        if (rents.r3) row.rent_3br = rents.r3;

        var resp = await supabaseRequest(
          "/area_benchmarks",
          {
            method: "POST",
            headers: { "Prefer": "resolution=merge-duplicates" },
            body: JSON.stringify(row)
          }
        );
        if (resp.ok) results.updated++;
        else results.errors++;

        if (psf) {
          var histResp = await supabaseRequest(
            "/price_history",
            {
              method: "POST",
              headers: { "Prefer": "resolution=merge-duplicates" },
              body: JSON.stringify({
                area_key: area,
                psf: psf,
                rent_avg: rents.r1 || null,
                sample_size: salePsfs.length,
                snapshot_date: new Date().toISOString().slice(0, 10)
              })
            }
          );
          if (histResp.ok) results.history++;
        }

        var fact = buildMarketFact(area, today, psf, salePsfs.length, rents);
        if (fact) marketFacts.push({ area: area, date: today, content: fact });
      } catch(e) {
        results.errors++;
      }
    }));

    if (i + CONCURRENCY < areas.length) await new Promise(function(r){setTimeout(r, 200);});
  }

  try {
    results.knowledge = await ingestMarketSnapshotsToKnowledgeBase(marketFacts);
  } catch (e) {}

  try {
    results.pruned = await pruneOldMarketSnapshots();
  } catch (e) {}

  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    areas_processed: areas.length,
    results: results
  });
};
