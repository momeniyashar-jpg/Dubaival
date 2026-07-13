const { supabaseRequest, SUPABASE_URL } = require("./_lib/shared");
const embeddings = require("./_lib/embeddings");

const UAE_RE_HOST = "uae-real-estate2.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";

// Keys here MUST match the exact AREAS/VALUATION_AREAS key strings in
// js/data-residential.js — getDynamicBenchmark(f.area) does a direct object
// lookup, so any mismatch here silently disconnects that area from the daily
// live-refresh signal (found 2026-07-12: "JVC", "Jumeirah Beach Residence" and
// "Production City" didn't match the real AREAS keys below at all — those
// areas' daily live data was being fetched and written, then never read by
// any valuation). "Dubai Land Residence Complex" and "Reem" removed entirely:
// neither is a real top-level AREAS key (DLRC rolls into "Dubailand", already
// tracked separately; "Reem" only exists as building-level sub-community
// entries), so their fetches were pure wasted cron budget.
const AREA_LOCATION_MAP = {
  "Dubai Marina":"dubai-marina","Downtown Dubai":"downtown-dubai",
  "Palm Jumeirah":"palm-jumeirah","Business Bay":"business-bay",
  "Jumeirah Village Circle":"jumeirah-village-circle","Dubai Hills Estate":"dubai-hills-estate",
  "MBR City":"mohammed-bin-rashid-city","Dubai Creek Harbour":"dubai-creek-harbour",
  "Jumeirah Lake Towers":"jumeirah-lake-towers","DAMAC Hills":"damac-hills",
  "Arabian Ranches":"arabian-ranches","Dubai Silicon Oasis":"dubai-silicon-oasis",
  "International City":"international-city","Dubai Sports City":"dubai-sports-city",
  "Jumeirah Beach Residence (Jbr)":"jumeirah-beach-residence","DIFC":"difc",
  "Al Barsha":"al-barsha","Emaar Beachfront":"emaar-beachfront",
  "Town Square":"town-square","Motor City":"motor-city",
  "Discovery Gardens":"discovery-gardens","Al Furjan":"al-furjan",
  "Dubai South":"dubai-south","Mirdif":"mirdif",
  "Jumeirah Village Triangle":"jumeirah-village-triangle",
  "Sobha Hartland":"sobha-hartland","City Walk":"city-walk",
  "Dubai Harbour":"dubai-harbour","Dubailand":"dubailand",
  "Dubai Production City":"impz","Al Quoz":"al-quoz","Barsha Heights":"barsha-heights",
  "The Valley":"the-valley","Tilal Al Ghaf":"tilal-al-ghaf",
  "Jumeirah":"jumeirah",
  "Al Sufouh":"al-sufouh","Mudon":"mudon",
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

// Records which individual for-rent listings are visible today for an area —
// the raw input the weekly rental-velocity job (below) derives real
// time-to-rent from. Does NOT overwrite first_seen on repeat sightings (only
// a plain upsert would clobber it): existing listing_ids get last_seen
// bumped via one batched PATCH, brand-new ones get inserted with
// first_seen=last_seen=today. Never throws — this is a secondary signal, a
// failure here must not affect the area_benchmarks/price_history writes that
// are this cron's primary job.
async function trackRentalListingSightings(area, rentListings, today) {
  try {
    var ids = rentListings
      .map(function(l){ return String(l.id || l.objectID || l.externalID || ""); })
      .filter(function(id){ return id; });
    if (!ids.length) return;

    var existingResp = await supabaseRequest(
      "/rental_listings_seen?area_key=eq." + encodeURIComponent(area) +
      "&listing_id=in.(" + ids.map(encodeURIComponent).join(",") + ")&select=listing_id"
    );
    var existingIds = existingResp.ok ? (await existingResp.json()).map(function(r){ return r.listing_id; }) : [];
    var existingSet = {};
    existingIds.forEach(function(id){ existingSet[id] = true; });

    var newRows = [];
    rentListings.forEach(function(l){
      var id = String(l.id || l.objectID || l.externalID || "");
      if (!id || existingSet[id]) return;
      newRows.push({
        listing_id: id, area_key: area, first_seen: today, last_seen: today,
        beds: l.rooms || null, price: l.price || null
      });
    });

    if (newRows.length) {
      await supabaseRequest("/rental_listings_seen", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(newRows)
      });
    }
    if (existingIds.length) {
      await supabaseRequest(
        "/rental_listings_seen?area_key=eq." + encodeURIComponent(area) +
        "&listing_id=in.(" + existingIds.map(encodeURIComponent).join(",") + ")",
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ last_seen: today })
        }
      );
    }
  } catch (e) {}
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

// ── Realized-growth refresh ──────────────────────────────────────────────────
// AREAS[area].g (0-1yr/1-3yr/2-5yr growth) is 100% manually curated and never
// touched by live data — dynBench only ever blended live psf/rent/dom/txVol.
// This computes REAL 1-year growth from price_history (accumulating daily
// since the main cron above went live) and PATCHes it onto area_benchmarks —
// PATCH specifically, not upsert, so this can never touch the psf/rent/dom/
// tx_vol columns the daily cron above owns. Only 1-year growth: 3yr/5yr
// realized growth would need years of history we don't have yet: those stay
// manual/projected rather than being silently faked from too little data.
// Runs weekly (like the forecast-audit above) rather than daily — a single
// extra day of price_history doesn't meaningfully change a trailing-365-day
// growth figure, and this keeps it off the tight daily-refresh time budget.
var GROWTH_BASELINE_DAYS = 365;
var GROWTH_BASELINE_WINDOW_DAYS = 30;
var GROWTH_TIME_BUDGET_MS = 45000;

async function computeRealizedGrowthForArea(area) {
  var target = new Date(Date.now() - GROWTH_BASELINE_DAYS * 86400000);
  var winLo = new Date(target.getTime() - GROWTH_BASELINE_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
  var winHi = new Date(target.getTime() + GROWTH_BASELINE_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);

  try {
    var baseResp = await supabaseRequest(
      "/price_history?area_key=eq." + encodeURIComponent(area) +
      "&snapshot_date=gte." + winLo + "&snapshot_date=lte." + winHi +
      "&select=psf,snapshot_date&order=snapshot_date.asc&limit=1"
    );
    if (!baseResp.ok) return null;
    var baseRows = await baseResp.json();
    if (!baseRows.length || !baseRows[0].psf) return null;

    var latestResp = await supabaseRequest(
      "/price_history?area_key=eq." + encodeURIComponent(area) +
      "&select=psf,snapshot_date&order=snapshot_date.desc&limit=1"
    );
    if (!latestResp.ok) return null;
    var latestRows = await latestResp.json();
    if (!latestRows.length || !latestRows[0].psf) return null;
    if (baseRows[0].snapshot_date === latestRows[0].snapshot_date) return null;

    var growth = Math.round(((latestRows[0].psf - baseRows[0].psf) / baseRows[0].psf) * 1000) / 10;
    return growth;
  } catch (e) {
    return null;
  }
}

async function handleGrowthRefresh(req, res) {
  var startedAt = Date.now();
  var results = { areasChecked: 0, updated: 0, skipped: 0, timedOut: false };
  var areas = Object.keys(AREA_LOCATION_MAP);
  var CONCURRENCY = 5;

  try {
    for (var i = 0; i < areas.length; i += CONCURRENCY) {
      if (Date.now() - startedAt > GROWTH_TIME_BUDGET_MS) { results.timedOut = true; break; }
      var batch = areas.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(async function (area) {
        results.areasChecked++;
        var growth = await computeRealizedGrowthForArea(area);
        if (growth === null) { results.skipped++; return; }
        var resp = await supabaseRequest(
          "/area_benchmarks?area_key=eq." + encodeURIComponent(area),
          {
            method: "PATCH",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({ growth_1yr_realized: growth, growth_updated_at: new Date().toISOString() })
          }
        );
        if (resp.ok) results.updated++; else results.skipped++;
      }));
      if (i + CONCURRENCY < areas.length) await new Promise(function (r) { setTimeout(r, 200); });
    }
    res.status(200).json({ ok: true, timestamp: new Date().toISOString(), results: results });
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message, results: results });
  }
}

// ── Rental velocity ("how fast does this area actually rent") ──────────────
// trackRentalListingSightings() (above, runs daily) has been accumulating
// first_seen/last_seen per rental listing since supabase-rental-liquidity-
// schema.sql went live. A listing whose last_seen has gone stale (not
// re-observed in the last RENT_STALE_DAYS days of daily crons) is presumed
// rented or delisted — same standard caveat every "days on market" metric in
// the industry carries — and (last_seen - first_seen) is a real, if
// imperfect, time-to-rent sample. Needs the same few weeks of accumulation
// as growth_1yr_realized did before enough stale listings exist to average.
var RENT_STALE_DAYS = 3;
var RENT_VELOCITY_WINDOW_DAYS = 180; // ignore/prune sightings older than this
var RENT_VELOCITY_TIME_BUDGET_MS = 45000;
var RENT_VELOCITY_PRUNE_DAYS = 400;

async function computeRentalVelocityForArea(area) {
  var today = new Date();
  var staleCutoff = new Date(today.getTime() - RENT_STALE_DAYS * 86400000).toISOString().slice(0, 10);
  var windowFloor = new Date(today.getTime() - RENT_VELOCITY_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);

  try {
    var resp = await supabaseRequest(
      "/rental_listings_seen?area_key=eq." + encodeURIComponent(area) +
      "&last_seen=lt." + staleCutoff +
      "&first_seen=gte." + windowFloor +
      "&select=first_seen,last_seen"
    );
    if (!resp.ok) return null;
    var rows = await resp.json();
    if (!rows.length) return null;

    var days = rows.map(function (r) {
      return Math.round((new Date(r.last_seen).getTime() - new Date(r.first_seen).getTime()) / 86400000);
    }).filter(function (d) { return d >= 0; });
    if (!days.length) return null;

    var avg = Math.round((days.reduce(function (s, d) { return s + d; }, 0) / days.length) * 10) / 10;
    return { avgDays: avg, sampleSize: days.length };
  } catch (e) {
    return null;
  }
}

async function pruneOldRentalSightings() {
  var cutoff = new Date(Date.now() - RENT_VELOCITY_PRUNE_DAYS * 86400000).toISOString().slice(0, 10);
  try {
    var resp = await supabaseRequest(
      "/rental_listings_seen?first_seen=lt." + cutoff,
      { method: "DELETE", headers: { Prefer: "return=minimal" } }
    );
    return resp.ok;
  } catch (e) {
    return false;
  }
}

async function handleRentalVelocity(req, res) {
  var startedAt = Date.now();
  var results = { areasChecked: 0, updated: 0, skipped: 0, timedOut: false };
  var areas = Object.keys(AREA_LOCATION_MAP);
  var CONCURRENCY = 5;

  try {
    for (var i = 0; i < areas.length; i += CONCURRENCY) {
      if (Date.now() - startedAt > RENT_VELOCITY_TIME_BUDGET_MS) { results.timedOut = true; break; }
      var batch = areas.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(async function (area) {
        results.areasChecked++;
        var v = await computeRentalVelocityForArea(area);
        if (!v) { results.skipped++; return; }
        var resp = await supabaseRequest(
          "/area_benchmarks?area_key=eq." + encodeURIComponent(area),
          {
            method: "PATCH",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({
              rent_avg_days_listed: v.avgDays,
              rent_velocity_sample_size: v.sampleSize,
              rent_velocity_updated_at: new Date().toISOString()
            })
          }
        );
        if (resp.ok) results.updated++; else results.skipped++;
      }));
      if (i + CONCURRENCY < areas.length) await new Promise(function (r) { setTimeout(r, 200); });
    }
    results.pruned = await pruneOldRentalSightings();
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
  if (req.query && req.query.action === "growth-refresh") {
    return handleGrowthRefresh(req, res);
  }
  if (req.query && req.query.action === "rental-velocity") {
    return handleRentalVelocity(req, res);
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
        if (rentListings.length) row.rent_active_count = rentListings.length;

        if (rentListings.length) await trackRentalListingSightings(area, rentListings, today);

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
