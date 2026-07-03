// Dubai Real Estate News Aggregator — multi-source RSS, world-class reliability
// Sources: Google News (4 targeted queries) + Arabian Business + Gulf News + Bing fallback
// Cache: 10-min server-side, always serves stale rather than empty
// Rate limit: 20 req/min per IP

var _cache = { ts: 0, data: null };
var CACHE_MS = 600 * 1000; // 10 min

// ── Knowledge base ingestion (non-blocking background, after response sent) ──
var _ingestedLinks = {};
var _ingestedCount = 0;
var MAX_INGESTED_TRACK = 1000;

async function ingestNewsToKnowledgeBase(articles) {
  if (!process.env.GEMINI_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  var fresh = articles.filter(function(a) { return a.link && !_ingestedLinks[a.link]; });
  if (!fresh.length) return;
  try {
    var embeddings = require("./lib/embeddings.js");
    var shared = require("./lib/shared.js");
    var texts = fresh.map(function(a) {
      return a.title + (a.description ? ". " + a.description : "");
    });
    var vectors = await embeddings.embedTexts(texts, "RETRIEVAL_DOCUMENT");
    var rows = [];
    fresh.forEach(function(a, i) {
      var vec = vectors[i];
      if (!vec) return;
      rows.push({
        source_type: "news", source_url: a.link, title: a.title,
        content: a.title + (a.description ? ". " + a.description : ""),
        area: null, tag: a.tag || null, embedding: vec,
        published_at: a.ts ? new Date(a.ts).toISOString() : null
      });
    });
    if (!rows.length) return;
    await shared.supabaseRequest("/knowledge_base", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows)
    });
    fresh.forEach(function(a) {
      if (!_ingestedLinks[a.link]) { _ingestedLinks[a.link] = true; _ingestedCount++; }
    });
    if (_ingestedCount > MAX_INGESTED_TRACK) { _ingestedLinks = {}; _ingestedCount = 0; }
  } catch (e) { /* never let ingestion affect news response */ }
}

// ── Request headers — look like a real Chrome browser ─────────────────────────
var CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var FETCH_HEADERS = {
  "User-Agent": CHROME_UA,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "identity",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache"
};

// ── News sources — in priority order ─────────────────────────────────────────
// Google News: best coverage, content-rich, returns 20-40 items per query
// Direct publishers: reliable backup, authoritative Dubai RE sources
// Bing News: last resort fallback
var SOURCES = [
  // ─ Google News (4 targeted queries) ─
  {
    url: "https://news.google.com/rss/search?q=Dubai+real+estate+property+market&hl=en-AE&gl=AE&ceid=AE:en",
    defaultTag: null, priority: 1, name: "Google News - Market"
  },
  {
    url: "https://news.google.com/rss/search?q=Dubai+property+price+investment+2026&hl=en-AE&gl=AE&ceid=AE:en",
    defaultTag: null, priority: 1, name: "Google News - Prices"
  },
  {
    url: "https://news.google.com/rss/search?q=Dubai+off-plan+new+launch+project+developer&hl=en-AE&gl=AE&ceid=AE:en",
    defaultTag: "launch", priority: 1, name: "Google News - Launches"
  },
  {
    url: "https://news.google.com/rss/search?q=Emaar+OR+DAMAC+OR+Nakheel+OR+Sobha+OR+Meraas+launch+Dubai&hl=en-AE&gl=AE&ceid=AE:en",
    defaultTag: "launch", priority: 1, name: "Google News - Developers"
  },
  // ─ Arabian Business (UAE's top business news) ─
  {
    url: "https://www.arabianbusiness.com/rss/industry/property.xml",
    defaultTag: null, priority: 2, name: "Arabian Business"
  },
  // ─ Gulf News Real Estate ─
  {
    url: "https://gulfnews.com/rss/uae/property",
    defaultTag: null, priority: 2, name: "Gulf News"
  },
  // ─ Bing News fallback ─
  {
    url: "https://www.bing.com/news/search?q=Dubai+real+estate&format=rss&setmkt=en-AE&setlang=en",
    defaultTag: null, priority: 3, name: "Bing News"
  }
];

var LAUNCH_KEYWORDS = [
  "launch", "launches", "launched", "unveil", "unveils", "unveiling",
  "off-plan", "off plan", "new project", "new tower", "new development",
  "reveals", "revealed", "announces", "groundbreaking", "breaks ground",
  "pre-launch", "now selling", "new release", "new residential",
  "new community", "sold out", "completion", "handover"
];

// ── RSS parser — handles CDATA, HTML entities, Google & Atom formats ──────────
function decodeEntities(s) {
  return String(s || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, function(_, n) { return String.fromCharCode(parseInt(n, 10)); })
    .replace(/&#x([0-9a-fA-F]+);/g, function(_, h) { return String.fromCharCode(parseInt(h, 16)); });
}

function stripTags(s) {
  return decodeEntities(String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim();
}

function unwrapCDATA(s) {
  var m = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(s.trim());
  return m ? m[1] : s;
}

function extractTag(block, tag) {
  var re = new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + tag + ">", "i");
  var m = re.exec(block);
  if (!m) return "";
  return decodeEntities(unwrapCDATA(m[1].trim()));
}

function extractAttr(str, attr) {
  var re = new RegExp("\\s" + attr + '=["\']([^"\']*)["\']', "i");
  var m = re.exec(str);
  return m ? m[1] : "";
}

function extractImage(block) {
  // Try <media:content url="...">, <enclosure url="...">, <media:thumbnail url="...">
  var mediaM = /media:content[^>]+url=["']([^"']+)["']/i.exec(block);
  if (mediaM) return mediaM[1];
  var encM = /enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image[^"']*["']/i.exec(block);
  if (encM) return encM[1];
  var thumbM = /media:thumbnail[^>]+url=["']([^"']+)["']/i.exec(block);
  if (thumbM) return thumbM[1];
  return null;
}

function extractSource(block) {
  var src = extractTag(block, "source");
  if (src) return src;
  var attr = extractAttr(block.match(/<source[^>]*/i) && block.match(/<source[^>]*/i)[0] || "", "url");
  return attr ? attr.split("/").filter(Boolean)[1] || attr : "";
}

function parseRSS(xml) {
  var items = [];
  var re = /<item[^>]*>([\s\S]*?)<\/item>/g;
  var m;
  while ((m = re.exec(xml)) !== null) {
    var b = m[1];
    var title = extractTag(b, "title");
    if (!title) continue;
    var link = extractTag(b, "link") || extractTag(b, "guid");
    // Google News link is inside <link> CDATA or a plain text URL
    if (!link) { var lm = /<link[^>]*href=["']([^"']+)["']/i.exec(b); if (lm) link = lm[1]; }
    if (!link || !/^https?:\/\//.test(link)) continue;
    var pubDate = extractTag(b, "pubDate") || extractTag(b, "dc:date") || extractTag(b, "published");
    var description = stripTags(extractTag(b, "description") || extractTag(b, "summary")).slice(0, 300);
    var source = extractSource(b);
    var image = extractImage(b);
    items.push({ title: title.slice(0, 250), link, pubDate, description, source, image });
  }
  return items;
}

function classify(item, defaultTag) {
  if (defaultTag === "launch") return "launch";
  var text = ((item.title || "") + " " + (item.description || "")).toLowerCase();
  for (var i = 0; i < LAUNCH_KEYWORDS.length; i++) {
    if (text.indexOf(LAUNCH_KEYWORDS[i]) !== -1) return "launch";
  }
  return "general";
}

async function fetchSource(src) {
  var ctrl = new AbortController();
  var timer = setTimeout(function() { ctrl.abort(); }, 9000);
  try {
    var r = await fetch(src.url, { signal: ctrl.signal, headers: FETCH_HEADERS });
    clearTimeout(timer);
    if (!r.ok) return [];
    var xml = await r.text();
    if (!xml || xml.length < 200) return [];
    var parsed = parseRSS(xml);
    var now = Date.now();
    var cutoff = now - 45 * 24 * 60 * 60 * 1000;
    return parsed
      .map(function(it) {
        var ts = it.pubDate ? (Date.parse(it.pubDate) || 0) : 0;
        return {
          title: it.title,
          link: it.link,
          pubDate: it.pubDate,
          ts: ts,
          source: it.source,
          description: it.description,
          image: it.image || null,
          tag: classify(it, src.defaultTag),
          srcName: src.name
        };
      })
      .filter(function(a) { return !a.ts || a.ts >= cutoff; });
  } catch (e) {
    clearTimeout(timer);
    return [];
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
var { rateLimitExceeded } = require("../lib/ratelimit");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });
  if (rateLimitExceeded(req, res, 60000, 20)) return;

  var now = Date.now();

  // Serve fresh cache immediately
  if (_cache.data && (now - _cache.ts) < CACHE_MS) {
    res.setHeader("Cache-Control", "public, s-maxage=150, stale-while-revalidate=300");
    res.setHeader("X-News-Cache", "hit");
    return res.json(_cache.data);
  }

  try {
    // Fetch ALL sources in parallel — per-source failures are isolated
    var results = await Promise.all(SOURCES.map(fetchSource));

    // Merge + dedup
    var seen = {};
    var all = [];
    results.forEach(function(list) {
      list.forEach(function(item) {
        // Dedup key: base URL + first 60 chars of title (handles tracking params)
        var key = (item.link || "").replace(/[?#].*$/, "") + "|" + (item.title || "").toLowerCase().slice(0, 60);
        if (seen[key]) return;
        seen[key] = true;
        all.push(item);
      });
    });

    // Sort by date desc, cap at 80
    all.sort(function(a, b) { return (b.ts || 0) - (a.ts || 0); });
    all = all.slice(0, 80);

    if (!all.length) {
      // All sources failed — serve stale rather than empty
      if (_cache.data) {
        res.setHeader("X-News-Cache", "stale-all-failed");
        var stalePayload = Object.assign({}, _cache.data, { stale: true, staleReason: "all-sources-failed" });
        return res.json(stalePayload);
      }
      return res.status(502).json({ articles: [], error: "All news sources temporarily unavailable" });
    }

    var payload = { articles: all, fetchedAt: now, stale: false };
    _cache = { ts: now, data: payload };

    res.setHeader("Cache-Control", "public, s-maxage=150, stale-while-revalidate=300");
    res.setHeader("X-News-Cache", "miss");
    res.json(payload);

    // Non-blocking background ingestion
    try { ingestNewsToKnowledgeBase(all).catch(function() {}); } catch (e) {}
    return;

  } catch (e) {
    if (_cache.data) {
      res.setHeader("X-News-Cache", "stale-error");
      var errPayload = Object.assign({}, _cache.data, { stale: true, staleReason: "fetch-error" });
      return res.json(errPayload);
    }
    return res.status(502).json({ articles: [], error: "News unavailable: " + e.message });
  }
};
