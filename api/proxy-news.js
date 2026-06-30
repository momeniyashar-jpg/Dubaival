// In-memory cache — persists across warm invocations of the same lambda instance.
var _cache = { ts: 0, data: null };
var CACHE_MS = 150 * 1000;

var QUERIES = [
  { q: "Dubai real estate market", tag: "general" },
  { q: "Dubai property prices", tag: "general" },
  { q: "Dubai off-plan property launch", tag: "launch" },
  { q: "Emaar OR DAMAC OR Nakheel OR Sobha OR Azizi OR Binghatti launches Dubai", tag: "launch" }
];

var LAUNCH_KEYWORDS = [
  "launch", "unveil", "off-plan", "off plan", "new project", "new tower",
  "reveals", "revealed", "announces new", "new development", "groundbreaking",
  "breaks ground", "pre-launch", "now selling"
];

function decodeEntities(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(s) {
  return decodeEntities(String(s || "").replace(/<[^>]*>/g, "")).trim();
}

function extractTag(block, tag) {
  var re = new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)<\\/" + tag + ">", "i");
  var m = re.exec(block);
  if (!m) return "";
  var val = m[1];
  var cdata = /<!\[CDATA\[([\s\S]*?)\]\]>/.exec(val);
  if (cdata) val = cdata[1];
  return decodeEntities(val.trim());
}

function parseRSS(xml) {
  var items = [];
  var itemRegex = /<item>([\s\S]*?)<\/item>/g;
  var m;
  while ((m = itemRegex.exec(xml))) {
    var block = m[1];
    var title = extractTag(block, "title");
    var link = extractTag(block, "link");
    var pubDate = extractTag(block, "pubDate");
    var source = extractTag(block, "source");
    var description = stripTags(extractTag(block, "description")).slice(0, 220);
    if (!title || !link) continue;
    items.push({ title: title, link: link, pubDate: pubDate, source: source, description: description });
  }
  return items;
}

function classify(item, queryTag) {
  if (queryTag === "launch") return "launch";
  var text = (item.title + " " + item.description).toLowerCase();
  for (var i = 0; i < LAUNCH_KEYWORDS.length; i++) {
    if (text.indexOf(LAUNCH_KEYWORDS[i]) !== -1) return "launch";
  }
  return "general";
}

async function fetchQuery(query) {
  var url = "https://news.google.com/rss/search?q=" + encodeURIComponent(query.q) +
    "&hl=en-AE&gl=AE&ceid=AE:en";
  var controller = new AbortController();
  var timeout = setTimeout(function () { controller.abort(); }, 8000);
  try {
    var r = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DubaiValNewsBot/1.0)" }
    });
    clearTimeout(timeout);
    if (!r.ok) return [];
    var xml = await r.text();
    var items = parseRSS(xml);
    return items.map(function (it) {
      return {
        title: it.title,
        link: it.link,
        pubDate: it.pubDate,
        ts: it.pubDate ? Date.parse(it.pubDate) || 0 : 0,
        source: it.source || "",
        description: it.description,
        tag: classify(it, query.tag)
      };
    });
  } catch (e) {
    clearTimeout(timeout);
    return [];
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    var now = Date.now();
    if (_cache.data && (now - _cache.ts) < CACHE_MS) {
      res.setHeader("Cache-Control", "public, s-maxage=150, stale-while-revalidate=300");
      res.setHeader("X-News-Cache", "hit");
      return res.json(_cache.data);
    }

    var results = await Promise.all(QUERIES.map(fetchQuery));
    var all = [];
    var seen = {};
    results.forEach(function (list) {
      list.forEach(function (item) {
        var key = (item.link || "").split("?")[0] + "|" + item.title.toLowerCase().slice(0, 80);
        if (seen[key]) return;
        seen[key] = true;
        all.push(item);
      });
    });

    var cutoff = now - 30 * 24 * 60 * 60 * 1000;
    all = all.filter(function (a) { return !a.ts || a.ts >= cutoff; });
    all.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    all = all.slice(0, 60);

    var payload = { articles: all, fetchedAt: now };
    _cache = { ts: now, data: payload };

    res.setHeader("Cache-Control", "public, s-maxage=150, stale-while-revalidate=300");
    res.setHeader("X-News-Cache", "miss");
    return res.json(payload);
  } catch (e) {
    if (_cache.data) {
      res.setHeader("X-News-Cache", "stale-error");
      return res.json(_cache.data);
    }
    return res.status(502).json({ error: "News fetch error: " + e.message, articles: [] });
  }
};
