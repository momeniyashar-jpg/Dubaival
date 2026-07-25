#!/usr/bin/env node
/*
 * Programmatic SEO page generator for DubAIVal.
 *
 * The live app (index.html) is a pure client-side SPA with hash-based
 * routing and no server-rendered content, which search engines can crawl
 * poorly. This script pre-generates real, static, crawlable HTML pages —
 * one per area (347) and one per residential building (~9,413) — from the
 * SAME public benchmark data already shown to any visitor inside the app
 * (AREAS / DB in js/data-residential.js). No proprietary/live data beyond
 * what's already public-facing in the product is exposed.
 *
 * Output is committed static HTML (this project has no build step at
 * deploy time — vercel.json's buildCommand is empty), so this script is
 * run manually/by a Claude session whenever the underlying data changes
 * meaningfully, and its output is committed like any other file.
 *
 * URLs are flat (/areas/<slug>.html, /buildings/<slug>.html) with NO
 * trailing slash, matching vercel.json's "trailingSlash": false + cleanUrls
 * so /areas/<slug> resolves directly without a redirect hop.
 *
 * Usage: node tools/generate-seo-pages.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const SITE = "https://www.dubaival.com";

function loadData() {
  const code = fs.readFileSync(path.join(ROOT, "js/data-residential.js"), "utf8");
  const ctx = {
    window: {}, document: {}, navigator: {}, fetch: function () {},
    localStorage: { getItem: function () { return null; }, setItem: function () {} },
    console: console
  };
  vm.createContext(ctx);
  vm.runInContext(code + "\nthis.__AREAS=AREAS;this.__DB=DB;this.__BLDG_UNITS=BLDG_UNITS;", ctx);
  return { AREAS: ctx.__AREAS, DB: ctx.__DB, BLDG_UNITS: ctx.__BLDG_UNITS };
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function slugify(s) {
  return String(s).toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unnamed";
}

function titleCase(s) {
  return String(s).replace(/\w\S*/g, function (t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
  });
}

function money(n) {
  if (n == null || isNaN(n)) return "N/A";
  return "AED " + Math.round(n).toLocaleString("en-US");
}

function uniqueSlugMap(names) {
  const used = {}; const map = {};
  names.forEach(function (n) {
    let base = slugify(n), s = base, i = 2;
    while (used[s]) { s = base + "-" + i; i++; }
    used[s] = true;
    map[n] = s;
  });
  return map;
}

function areaUrl(slug) { return SITE + "/areas/" + slug; }
function buildingUrl(slug) { return SITE + "/buildings/" + slug; }

function pageShell(opts) {
  return "<!DOCTYPE html>\n" +
'<html lang="en">\n<head>\n' +
'<meta charset="UTF-8"/>\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n' +
"<title>" + esc(opts.title) + "</title>\n" +
'<meta name="description" content="' + esc(opts.description) + '"/>\n' +
'<link rel="canonical" href="' + esc(opts.canonical) + '"/>\n' +
'<meta name="robots" content="index, follow"/>\n' +
'<meta property="og:type" content="website"/>\n' +
'<meta property="og:title" content="' + esc(opts.title) + '"/>\n' +
'<meta property="og:description" content="' + esc(opts.description) + '"/>\n' +
'<meta property="og:url" content="' + esc(opts.canonical) + '"/>\n' +
'<meta property="og:image" content="' + SITE + '/og-image.png"/>\n' +
'<meta name="twitter:card" content="summary_large_image"/>\n' +
'<meta name="twitter:title" content="' + esc(opts.title) + '"/>\n' +
'<meta name="twitter:description" content="' + esc(opts.description) + '"/>\n' +
'<meta name="theme-color" content="#070B14"/>\n' +
'<link rel="icon" href="' + SITE + '/icon-192.png"/>\n' +
'<link rel="stylesheet" href="' + SITE + '/seo.css"/>\n' +
"<script type=\"application/ld+json\">" + JSON.stringify(opts.jsonLd) + "</script>\n" +
"</head>\n<body>\n<div class=\"wrap\">\n" +
'<div class="hdr"><a class="brand" href="' + SITE + '/">DubAIVal</a><a class="cta" href="' + SITE + '/#Market/Analyzer">Get a Free Valuation →</a></div>\n' +
opts.body +
'<div class="foot">\n' +
"<p>DubAIVal is an AI-powered automated valuation model (AVM). Estimates are indicative and not a RERA/RICS-certified valuation. Consult a RERA-registered valuer before making investment decisions.</p>\n" +
'<p><a href="' + SITE + '/">Home</a> · <a href="' + SITE + '/areas">All Dubai Areas</a> · <a href="' + SITE + '/#Market/Dashboard">Live Market Dashboard</a></p>\n' +
"</div>\n</div>\n</body>\n</html>\n";
}

function buildAreaPage(areaName, a, slug, buildingsInArea) {
  const rentLines = [];
  if (a.r1) rentLines.push(["1BR Annual Rent", money(a.r1)]);
  if (a.r2) rentLines.push(["2BR Annual Rent", money(a.r2)]);
  if (a.r3) rentLines.push(["3BR Annual Rent", money(a.r3)]);
  const growth = Array.isArray(a.g) ? a.g : [null, null, null];
  const yieldRange = Array.isArray(a.y) ? a.y[0] + "%–" + a.y[1] + "%" : "N/A";

  const narr = "Properties in " + areaName + " currently average " + money(a.psf) +
    " per sqft, with gross rental yields typically between " + yieldRange +
    ". Over the past year prices in the area have moved roughly " + (growth[0] != null ? growth[0] + "%" : "N/A") +
    ", with a 1-3 year outlook of " + (growth[1] != null ? growth[1] + "%" : "N/A") +
    ". Typical time on market is around " + (a.dom || "N/A") + " days" +
    (a.txVol ? ", with an estimated " + a.txVol.toLocaleString("en-US") + " annual transactions recorded in the area." : ".");

  const bList = buildingsInArea.slice(0, 24).map(function (b) {
    return '<a href="' + buildingUrl(b.slug) + '">' + esc(b.title) + "</a>";
  }).join("\n");

  const body =
    "<h1>" + esc(areaName) + " Property Valuation &amp; Market Data</h1>\n" +
    '<p class="sub">Live AI-powered price per sqft, rental yield &amp; growth benchmarks for ' + esc(areaName) + ", Dubai — updated from DubAIVal's Cascade AVM engine.</p>\n" +
    '<div class="stats">\n' +
    '<div class="stat"><div class="l">Avg Price / Sqft</div><div class="v">' + money(a.psf) + "</div></div>\n" +
    '<div class="stat"><div class="l">Gross Rental Yield</div><div class="v">' + yieldRange + "</div></div>\n" +
    '<div class="stat"><div class="l">Service Charge</div><div class="v">' + (a.sc ? "AED " + a.sc + "/sqft/yr" : "N/A") + "</div></div>\n" +
    '<div class="stat"><div class="l">Avg Days on Market</div><div class="v">' + (a.dom || "N/A") + "</div></div>\n" +
    "</div>\n" +
    '<p class="narr">' + narr + "</p>\n" +
    (rentLines.length ? "<h2>Estimated Annual Rent</h2>\n<table>" + rentLines.map(function (r) { return "<tr><th>" + r[0] + "</th><td>" + r[1] + "</td></tr>"; }).join("") + "</table>\n" : "") +
    "<h2>Price Growth Outlook</h2>\n<table>" +
    "<tr><th>0–1 Year</th><td>" + (growth[0] != null ? growth[0] + "%" : "N/A") + "</td></tr>" +
    "<tr><th>1–3 Year</th><td>" + (growth[1] != null ? growth[1] + "%" : "N/A") + "</td></tr>" +
    "<tr><th>2–5 Year</th><td>" + (growth[2] != null ? growth[2] + "%" : "N/A") + "</td></tr>" +
    "</table>\n" +
    (bList ? "<h2>Buildings in " + esc(areaName) + "</h2>\n<div class=\"links\">" + bList + "</div>\n" : "");

  return pageShell({
    title: areaName + " Property Valuation & Market Data | DubAIVal",
    description: areaName + " Dubai: avg " + money(a.psf) + "/sqft, " + yieldRange + " rental yield, growth outlook & rent estimates — free AI valuation by DubAIVal.",
    canonical: areaUrl(slug),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Place",
      "name": areaName + ", Dubai",
      "address": { "@type": "PostalAddress", "addressLocality": areaName, "addressRegion": "Dubai", "addressCountry": "AE" }
    },
    body: body
  });
}

function buildBuildingPage(name, b, slug, areaSlug, units, siblings) {
  const grade = b.g || "N/A";
  const psf = b.p, lo = b.lo, hi = b.hi;
  const title = titleCase(name);
  const narr = title + " in " + esc(b.a) + " is benchmarked at " + money(psf) + " per sqft" +
    (lo && hi ? " (range " + money(lo) + "–" + money(hi) + " per sqft)" : "") +
    ", grade " + grade + (b.sc ? ", with an estimated service charge of AED " + b.sc + "/sqft/yr" : "") +
    (units ? ". The building has approximately " + units + " units." : ".");

  const sibList = siblings.slice(0, 10).map(function (s) {
    return '<a href="' + buildingUrl(s.slug) + '">' + esc(s.title) + "</a>";
  }).join("\n");

  const body =
    "<h1>" + esc(title) + " — Price &amp; Valuation Benchmark</h1>\n" +
    '<p class="sub">' + esc(b.a) + ", Dubai — AI-powered building benchmark from DubAIVal's Cascade AVM engine.</p>\n" +
    '<div class="stats">\n' +
    '<div class="stat"><div class="l">Price / Sqft</div><div class="v">' + money(psf) + "</div></div>\n" +
    '<div class="stat"><div class="l">Grade</div><div class="v">' + esc(grade) + "</div></div>\n" +
    '<div class="stat"><div class="l">Service Charge</div><div class="v">' + (b.sc ? "AED " + b.sc + "/sqft/yr" : "N/A") + "</div></div>\n" +
    '<div class="stat"><div class="l">Units</div><div class="v">' + (units || "N/A") + "</div></div>\n" +
    "</div>\n" +
    '<p class="narr">' + narr + "</p>\n" +
    '<p><a href="' + areaUrl(areaSlug) + '">View all ' + esc(b.a) + " market data →</a></p>\n" +
    (sibList ? "<h2>Other Buildings in " + esc(b.a) + "</h2>\n<div class=\"links\">" + sibList + "</div>\n" : "");

  return pageShell({
    title: title + " — Price & Valuation | " + b.a + ", Dubai | DubAIVal",
    description: title + " in " + b.a + ": " + money(psf) + "/sqft, grade " + grade + " — free AI valuation & rent estimate by DubAIVal.",
    canonical: buildingUrl(slug),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ApartmentComplex",
      "name": title,
      "address": { "@type": "PostalAddress", "addressLocality": b.a, "addressRegion": "Dubai", "addressCountry": "AE" }
    },
    body: body
  });
}

function writeFile(rel, content) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

const SEO_CSS =
"body{background:#070B14;color:#fff;font-family:Inter,Arial,sans-serif;margin:0;padding:0;line-height:1.55}\n" +
"a{color:#D4AF37}\n" +
".wrap{max-width:920px;margin:0 auto;padding:32px 20px 64px}\n" +
".hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}\n" +
".brand{font-family:'Space Grotesk',Arial,sans-serif;font-weight:700;font-size:20px;color:#D4AF37;text-decoration:none}\n" +
".cta{background:#D4AF37;color:#070B14;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px}\n" +
"h1{font-family:'Space Grotesk',Arial,sans-serif;font-size:28px;margin:8px 0 4px}\n" +
".sub{color:#8899AA;font-size:15px;margin-bottom:24px}\n" +
".stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:24px 0}\n" +
".stat{background:#1A1F2E;border-radius:12px;padding:16px}\n" +
".stat .l{color:#8899AA;font-size:12px;text-transform:uppercase;letter-spacing:.03em}\n" +
".stat .v{font-size:20px;font-weight:700;margin-top:4px}\n" +
"p.narr{color:#C7D0DC;font-size:15px}\n" +
"table{width:100%;border-collapse:collapse;margin:16px 0}\n" +
"td,th{padding:8px 10px;border-bottom:1px solid #1A1F2E;text-align:left;font-size:14px}\n" +
"th{color:#8899AA;font-weight:600}\n" +
".links{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}\n" +
".links a{background:#1A1F2E;padding:6px 12px;border-radius:20px;text-decoration:none;font-size:13px;color:#fff}\n" +
".foot{margin-top:40px;padding-top:20px;border-top:1px solid #1A1F2E;color:#556677;font-size:13px}\n";

function main() {
  const { AREAS, DB, BLDG_UNITS } = loadData();
  const areaNames = Object.keys(AREAS);
  const buildingNames = Object.keys(DB);

  const areaSlugs = uniqueSlugMap(areaNames);
  const buildingSlugs = uniqueSlugMap(buildingNames);

  // group buildings by area for internal linking
  const byArea = {};
  buildingNames.forEach(function (n) {
    const a = DB[n].a || "Unknown";
    (byArea[a] = byArea[a] || []).push({ name: n, slug: buildingSlugs[n], title: titleCase(n) });
  });

  const urls = [SITE + "/", SITE + "/areas"];

  // clean output dirs (regenerate from scratch each run so removed/renamed
  // buildings/areas don't leave stale orphan pages behind)
  ["areas", "buildings"].forEach(function (d) {
    const full = path.join(ROOT, d);
    if (fs.existsSync(full)) fs.rmSync(full, { recursive: true, force: true });
  });

  // area pages -> /areas/<slug>.html
  areaNames.forEach(function (areaName) {
    const slug = areaSlugs[areaName];
    const list = byArea[areaName] || [];
    const html = buildAreaPage(areaName, AREAS[areaName], slug, list);
    writeFile("areas/" + slug + ".html", html);
    urls.push(areaUrl(slug));
  });

  // building pages -> /buildings/<slug>.html
  buildingNames.forEach(function (name) {
    const b = DB[name];
    const slug = buildingSlugs[name];
    const areaSlug = areaSlugs[b.a] || areaSlugs[areaNames[0]];
    const units = BLDG_UNITS[name];
    const siblings = (byArea[b.a] || []).filter(function (x) { return x.slug !== slug; });
    const html = buildBuildingPage(name, b, slug, areaSlug, units, siblings);
    writeFile("buildings/" + slug + ".html", html);
    urls.push(buildingUrl(slug));
  });

  // areas hub page -> /areas.html (served at /areas via cleanUrls)
  const grouped = {};
  areaNames.slice().sort().forEach(function (n) {
    const letter = n[0].toUpperCase();
    (grouped[letter] = grouped[letter] || []).push(n);
  });
  let hubBody = "<h1>Dubai Real Estate Areas — Price &amp; Yield Data</h1>\n" +
    '<p class="sub">Browse AI-powered property valuation benchmarks for all ' + areaNames.length + ' tracked areas in Dubai.</p>\n';
  Object.keys(grouped).sort().forEach(function (letter) {
    hubBody += "<h2>" + letter + "</h2>\n<div class=\"links\">" +
      grouped[letter].map(function (n) {
        return '<a href="' + areaUrl(areaSlugs[n]) + '">' + esc(n) + "</a>";
      }).join("\n") + "</div>\n";
  });
  writeFile("areas.html", pageShell({
    title: "Dubai Real Estate Areas — Price & Yield Data | DubAIVal",
    description: "Browse AI-powered property valuation, rental yield and growth data for all " + areaNames.length + " tracked areas in Dubai.",
    canonical: SITE + "/areas",
    jsonLd: { "@context": "https://schema.org", "@type": "CollectionPage", "name": "Dubai Real Estate Areas" },
    body: hubBody
  }));

  // shared stylesheet (one file instead of an inline <style> repeated in
  // every one of the ~9,600 generated pages, which would otherwise bloat
  // the repo by tens of MB of duplicated CSS)
  writeFile("seo.css", SEO_CSS);

  // sitemap.xml
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(function (u) { return "<url><loc>" + esc(u) + "</loc></url>"; }).join("\n") +
    "\n</urlset>\n";
  writeFile("sitemap.xml", sitemap);

  // robots.txt (create if missing, else leave a pre-existing user-authored one alone)
  const robotsPath = path.join(ROOT, "robots.txt");
  if (!fs.existsSync(robotsPath)) {
    fs.writeFileSync(robotsPath, "User-agent: *\nAllow: /\n\nSitemap: " + SITE + "/sitemap.xml\n");
  }

  console.log("Generated " + areaNames.length + " area pages, " + buildingNames.length + " building pages, 1 hub page, sitemap with " + urls.length + " URLs.");
}

main();
