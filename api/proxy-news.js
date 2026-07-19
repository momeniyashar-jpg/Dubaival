// Dubai Real Estate News Aggregator — world-class multi-tier reliability
// Tier 1: GDELT Project API (no auth, designed for programmatic access, global coverage)
// Tier 2: Google News RSS (Chrome UA, 4 targeted queries)
// Tier 3: Stale cache (always serve rather than empty)
// ALWAYS returns HTTP 200 — never fails the client

var _cache = { ts: 0, data: null };
var CACHE_MS = 600 * 1000; // 10 min

// ── Knowledge base ingestion (non-blocking, after response is sent) ────────────
var kbEmbeddings = require("./_lib/embeddings.js");
var kbShared = require("./_lib/shared.js");
var _ingestedLinks = {};
var _ingestedCount = 0;
var MAX_INGESTED = 1000;

async function ingestToKB(articles) {
  if (!kbEmbeddings.hasProvider() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  var fresh = articles.filter(function(a) { return a.link && !_ingestedLinks[a.link]; });
  if (!fresh.length) return;
  try {
    var texts = fresh.map(function(a) { return a.title + (a.description ? ". " + a.description : ""); });
    var vectors = await kbEmbeddings.embedTexts(texts, "RETRIEVAL_DOCUMENT");
    var rows = [];
    fresh.forEach(function(a, i) {
      if (!vectors[i]) return;
      rows.push({
        source_type: "news", source_url: a.link, title: a.title,
        content: a.title + (a.description ? ". " + a.description : ""),
        area: null, tag: a.tag || null, embedding: vectors[i],
        published_at: a.ts ? new Date(a.ts).toISOString() : null
      });
    });
    if (!rows.length) return;
    // on_conflict is required — without it PostgREST's merge-duplicates
    // upsert defaults to the table's primary key (id, always fresh on
    // insert), so the real dedup target (the separate unique(source_type,
    // source_url) constraint) never actually gets used and a genuine
    // duplicate throws an unhandled 23505 instead of upserting.
    await kbShared.supabaseRequest("/knowledge_base?on_conflict=source_type,source_url", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows)
    });
    fresh.forEach(function(a) {
      if (_ingestedLinks[a.link]) return;
      _ingestedLinks[a.link] = true;
      _ingestedCount++;
    });
    if (_ingestedCount > MAX_INGESTED) { _ingestedLinks = {}; _ingestedCount = 0; }
  } catch (e) { /* never let ingestion affect response */ }
}

// ── Launch keyword classifier ─────────────────────────────────────────────────
var LAUNCH_KW = [
  "launch", "launches", "launched", "unveil", "off-plan", "off plan",
  "new project", "new tower", "new development", "reveals", "announced",
  "groundbreaking", "breaks ground", "pre-launch", "now selling",
  "new residential", "new community", "new phase", "completion", "handover"
];

function classifyTag(title, desc, defaultTag) {
  if (defaultTag === "launch") return "launch";
  var text = ((title || "") + " " + (desc || "")).toLowerCase();
  for (var i = 0; i < LAUNCH_KW.length; i++) {
    if (text.indexOf(LAUNCH_KW[i]) !== -1) return "launch";
  }
  return "general";
}

// ── Parse GDELT seendate: "20260703T120000Z" → Unix ms ───────────────────────
function parseGDELTDate(s) {
  if (!s || s.length < 15) return 0;
  try {
    return Date.parse(
      s.slice(0, 4) + "-" + s.slice(4, 6) + "-" + s.slice(6, 8) + "T" +
      s.slice(9, 11) + ":" + s.slice(11, 13) + ":" + s.slice(13, 15) + "Z"
    ) || 0;
  } catch (e) { return 0; }
}

// ── TIER 1: GDELT Project API ────────────────────────────────────────────────
// Academic-grade open data service. No API key. No bot blocking. Public domain.
// Returns structured JSON with title, url, seendate, socialimage, domain.
var GDELT_QUERIES = [
  { q: "Dubai real estate property market",       defaultTag: null },
  { q: "Dubai property price investment sale",    defaultTag: null },
  { q: "Dubai off-plan new launch project 2026",  defaultTag: "launch" },
  { q: "Emaar DAMAC Nakheel Sobha launch Dubai",  defaultTag: "launch" }
];

async function fetchGDELT(qObj) {
  var url = "https://api.gdeltproject.org/api/v2/doc/doc?" +
    "query=" + encodeURIComponent(qObj.q + " sourcelang:english") +
    "&mode=artlist&maxrecords=25&format=json&timespan=7d&sort=DateDesc";
  var ctrl = new AbortController();
  var timer = setTimeout(function() { ctrl.abort(); }, 10000);
  try {
    var r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; research-bot/1.0)",
        "Accept": "application/json"
      }
    });
    clearTimeout(timer);
    if (!r.ok) return [];
    var data = await r.json();
    var items = Array.isArray(data && data.articles) ? data.articles : [];
    return items.map(function(it) {
      var ts = parseGDELTDate(it.seendate);
      return {
        title: String(it.title || "").slice(0, 250),
        link: it.url || "",
        pubDate: it.seendate || "",
        ts: ts,
        source: it.domain || "",
        description: "",
        image: it.socialimage || null,
        tag: classifyTag(it.title, "", qObj.defaultTag)
      };
    }).filter(function(a) { return a.link && a.title; });
  } catch (e) {
    clearTimeout(timer);
    return [];
  }
}

// ── TIER 2: Google News RSS ───────────────────────────────────────────────────
var GNEWS_QUERIES = [
  { url: "https://news.google.com/rss/search?q=Dubai+real+estate+property+market&hl=en-AE&gl=AE&ceid=AE:en", defaultTag: null },
  { url: "https://news.google.com/rss/search?q=Dubai+property+prices+investment+2026&hl=en-AE&gl=AE&ceid=AE:en", defaultTag: null },
  { url: "https://news.google.com/rss/search?q=Dubai+off-plan+new+launch+developer&hl=en-AE&gl=AE&ceid=AE:en", defaultTag: "launch" },
  { url: "https://news.google.com/rss/search?q=Emaar+OR+DAMAC+OR+Nakheel+launch+Dubai+2026&hl=en-AE&gl=AE&ceid=AE:en", defaultTag: "launch" }
];

var GNEWS_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "identity"
};

function decodeEnt(s) {
  return String(s || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, function(_, n) { return String.fromCharCode(+n); })
    .replace(/&#x([0-9a-fA-F]+);/g, function(_, h) { return String.fromCharCode(parseInt(h, 16)); });
}
function stripTags(s) { return decodeEnt(String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim(); }
function unwrapCDATA(s) { var m = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(s.trim()); return m ? m[1] : s; }
function getTag(b, tag) {
  var m = new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + tag + ">", "i").exec(b);
  return m ? decodeEnt(unwrapCDATA(m[1].trim())) : "";
}

function extractRSSImage(b) {
  var m;
  m = /media:content[^>]+url=["']([^"']+)["']/i.exec(b);
  if (m && /\.(jpe?g|png|webp|gif)/i.test(m[1])) return m[1];
  m = /media:thumbnail[^>]+url=["']([^"']+)["']/i.exec(b);
  if (m && /\.(jpe?g|png|webp|gif)/i.test(m[1])) return m[1];
  m = /enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image/i.exec(b);
  if (m) return m[1];
  m = /enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/i.exec(b);
  if (m) return m[1];
  m = /<img[^>]+src=["']([^"']+)["']/i.exec(b);
  if (m && /^https?:\/\//.test(m[1])) return m[1];
  return null;
}

function parseRSS(xml) {
  var items = [];
  var re = /<item[^>]*>([\s\S]*?)<\/item>/g;
  var m;
  while ((m = re.exec(xml)) !== null) {
    var b = m[1];
    var title = getTag(b, "title");
    if (!title) continue;
    var link = getTag(b, "link") || getTag(b, "guid");
    if (!link || !/^https?:\/\//.test(link)) continue;
    var pubDate = getTag(b, "pubDate") || getTag(b, "dc:date");
    var desc = stripTags(getTag(b, "description")).slice(0, 300);
    var src = getTag(b, "source");
    var image = extractRSSImage(b);
    items.push({ title: title.slice(0, 250), link, pubDate, description: desc, source: src, image: image });
  }
  return items;
}

async function fetchGNews(qObj) {
  var ctrl = new AbortController();
  var timer = setTimeout(function() { ctrl.abort(); }, 9000);
  try {
    var r = await fetch(qObj.url, { signal: ctrl.signal, headers: GNEWS_HEADERS });
    clearTimeout(timer);
    if (!r.ok) return [];
    var xml = await r.text();
    if (!xml || xml.length < 100) return [];
    return parseRSS(xml).map(function(it) {
      var ts = it.pubDate ? (Date.parse(it.pubDate) || 0) : 0;
      return {
        title: it.title, link: it.link, pubDate: it.pubDate,
        ts: ts, source: it.source, description: it.description,
        image: it.image || null,
        tag: classifyTag(it.title, it.description, qObj.defaultTag)
      };
    }).filter(function(a) { return !a.ts || a.ts > Date.now() - 45 * 86400000; });
  } catch (e) {
    clearTimeout(timer);
    return [];
  }
}

// ── Merge + dedup helper ──────────────────────────────────────────────────────
function mergeDedup(lists) {
  var seen = {};
  var all = [];
  lists.forEach(function(list) {
    (list || []).forEach(function(item) {
      var key = (item.link || "").replace(/[?#].*$/, "") + "|" + (item.title || "").toLowerCase().slice(0, 60);
      if (seen[key]) return;
      seen[key] = true;
      all.push(item);
    });
  });
  all.sort(function(a, b) { return (b.ts || 0) - (a.ts || 0); });
  return all.slice(0, 80);
}

// ── Gemini image generation for top articles ──────────────────────────────────
async function generateGeminiImages(articles) {
  var key = process.env.GEMINI_API_KEY;
  if (!key) return;
  var top = articles.slice(0, 8);
  await Promise.all(top.map(function(a) {
    return new Promise(function(resolve) {
      var prompt = "Generate a photorealistic image of " +
        (a.tag === "launch"
          ? "Dubai luxury skyscraper real estate new development aerial view, modern architecture "
          : "Dubai real estate property market skyline business district professional photography ") +
        a.title.slice(0, 60) +
        ". Wide angle, golden hour lighting, cinematic composition. No text, no watermarks.";
      var ctrl = new AbortController();
      var timer = setTimeout(function() { ctrl.abort(); resolve(); }, 12000);
      fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + key,
        {
          signal: ctrl.signal,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"], imageMimeType: "image/jpeg" }
          })
        }
      ).then(function(r) {
        clearTimeout(timer);
        if (!r.ok) { resolve(); return; }
        return r.json();
      }).then(function(data) {
        if (!data) { resolve(); return; }
        var parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
        for (var i = 0; i < parts.length; i++) {
          if (parts[i].inlineData && parts[i].inlineData.data) {
            a.image = "data:" + (parts[i].inlineData.mimeType || "image/jpeg") + ";base64," + parts[i].inlineData.data;
            break;
          }
        }
        resolve();
      }).catch(function() { clearTimeout(timer); resolve(); });
    });
  }));
}

// ── Rate limiter ──────────────────────────────────────────────────────────────
var { rateLimitExceeded } = require("./_lib/ratelimit");

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });
  if (rateLimitExceeded(req, res, 60000, 20)) return;

  var now = Date.now();

  // Serve cache immediately if fresh
  if (_cache.data && (now - _cache.ts) < CACHE_MS) {
    res.setHeader("Cache-Control", "public, s-maxage=150, stale-while-revalidate=300");
    res.setHeader("X-News-Cache", "hit");
    return res.status(200).json(_cache.data);
  }

  try {
    // ── Tier 1: GDELT (primary, no auth, designed for programmatic access) ──
    var gdeltResults = await Promise.all(GDELT_QUERIES.map(fetchGDELT));
    var gdeltArticles = mergeDedup(gdeltResults);

    // ── Tier 2: Google News RSS (fallback, runs in parallel with GDELT) ──
    var gnewsResults = await Promise.all(GNEWS_QUERIES.map(fetchGNews));
    var gnewsArticles = mergeDedup(gnewsResults);

    // Merge both tiers
    var all = mergeDedup([gdeltArticles, gnewsArticles]);

    var gdeltOk = gdeltArticles.length > 0;
    var gnewsOk = gnewsArticles.length > 0;

    if (all.length > 0) {
      // Generate Gemini images for top articles (server-side, free, no copyright)
      await generateGeminiImages(all);

      // Success — cache and return
      var payload = {
        articles: all,
        fetchedAt: now,
        stale: false,
        error: null,
        sources: { gdelt: gdeltOk, gnews: gnewsOk }
      };
      _cache = { ts: now, data: payload };
      res.setHeader("Cache-Control", "public, s-maxage=150, stale-while-revalidate=300");
      res.setHeader("X-News-Cache", "miss");
      res.status(200).json(payload);
      // Background ingestion
      try { ingestToKB(all).catch(function() {}); } catch (e) {}
      return;
    }

    // ── Tier 3: Serve stale cache ──
    if (_cache.data) {
      var stalePayload = Object.assign({}, _cache.data, { stale: true, error: null });
      res.setHeader("X-News-Cache", "stale");
      return res.status(200).json(stalePayload);
    }

    // Total failure — return empty with error (HTTP 200 so client can read body)
    return res.status(200).json({
      articles: [],
      fetchedAt: now,
      stale: false,
      error: "News services temporarily unavailable. Try again in a moment."
    });

  } catch (e) {
    // Unexpected crash — serve stale or empty (ALWAYS HTTP 200)
    if (_cache.data) {
      return res.status(200).json(Object.assign({}, _cache.data, { stale: true }));
    }
    return res.status(200).json({
      articles: [],
      fetchedAt: now,
      stale: false,
      error: "News temporarily unavailable."
    });
  }
};
