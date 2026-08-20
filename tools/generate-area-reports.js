#!/usr/bin/env node
/*
 * Static Area Executive Market Intelligence Report generator.
 *
 * Pre-generates real, downloadable, static HTML reports for DubaiVal's
 * curated set of 30 major areas (AREA_REPORT_FEATURED in js/workspace.js) —
 * a real, agent-branded document modeled after a third-party sample report
 * shared by the site owner, but built strictly from DubaiVal's own verified
 * database. This is the SAME generator (_areaReportHtml() /
 * computeAreaExecutiveReportData()) the in-app Custom Report Builder
 * (My Workspace → Reports → "Area Executive Report") uses to let any
 * signed-in site user generate a report for ANY of the 347 tracked areas
 * on demand — this script just pre-renders the 30 featured ones so they're
 * immediately downloadable from the site without waiting for a click-
 * through generation, matching the project's existing programmatic-SEO
 * precedent (tools/generate-seo-pages.js).
 *
 * Output is committed static HTML (this project has no build step at
 * deploy time), so re-run this manually whenever the underlying area/
 * building data (js/data-residential.js) or the report generator itself
 * (js/workspace.js) changes meaningfully, and commit the output.
 *
 * Usage: node tools/generate-area-reports.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "reports");
const SITE = "https://www.dubaival.com";

function loadApp() {
  const files = [
    "js/data-residential.js",
    "js/data-commercial.js",
    "js/valuation-db.js",
    "js/core.js",
    "js/valuation.js",
    "js/api.js",
    "js/market.js",
    "js/workspace.js",
  ];
  const ctx = {
    window: { addEventListener: function () {}, location: { href: "" }, history: {} },
    localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
    navigator: { language: "en", geolocation: {} },
    document: {
      addEventListener: function () {}, documentElement: {},
      createElement: function () { return { style: {}, setAttribute: function () {}, appendChild: function () {} }; },
      getElementById: function () { return null; },
    },
    history: { replaceState: function () {}, state: null, length: 1, back: function () {}, go: function () {} },
    fetch: function () { return Promise.resolve({ json: function () { return Promise.resolve({}); } }); },
    setTimeout: setTimeout, clearTimeout: clearTimeout, setInterval: setInterval, clearInterval: clearInterval,
    console: console,
  };
  ctx.fetchLiveMarket = function () {};
  ctx.fetchSupabaseConfig = function () {};
  ctx.fetchDynamicBenchmarks = function () {};
  ctx.fetchCalibrationData = function () {};
  vm.createContext(ctx);
  files.forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  });
  return ctx;
}

function slugify(s) {
  return String(s).toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unnamed";
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function main() {
  const ctx = loadApp();
  const runInApp = function (code) { return vm.runInContext(code, ctx); };

  const featured = JSON.parse(runInApp("JSON.stringify(AREA_REPORT_FEATURED)"));
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const DEFAULT_AGENT = { name: "", company: "", phone: "", rera: "" }; // no personal branding — defaults to plain DubaiVal-branded report
  const rows = [];
  let ok = 0, failed = 0;

  featured.forEach(function (area) {
    const slug = slugify(area);
    const script =
      "(function(){" +
      "var data=computeAreaExecutiveReportData(" + JSON.stringify(area) + ");" +
      "if(!data)return JSON.stringify({error:'no data'});" +
      "var agent=" + JSON.stringify(DEFAULT_AGENT) + ";" +
      "var title=" + JSON.stringify(area) + "+' — Area Executive Market Intelligence Report';" +
      "var html=_areaReportHtml(" + JSON.stringify(area) + ",data,agent,{lang:'en',color:'gold',title:title});" +
      "return JSON.stringify({html:html,psf:data.psf,totalBuildings:data.totalBuildings,isVilla:data.isVilla,yield:data.yield});" +
      "})()";
    let result;
    try {
      result = JSON.parse(runInApp(script));
    } catch (e) {
      console.log("FAILED " + area + ": " + e.message);
      failed++;
      return;
    }
    if (result.error) {
      console.log("SKIPPED " + area + " (" + result.error + ")");
      failed++;
      return;
    }
    // Wrap the print-window HTML fragment as a real standalone downloadable
    // page — add a small on-page (non-print) toolbar with a real "Print /
    // Save as PDF" button, since these static files are meant to be opened
    // directly by a browser (not only via the in-app window.open() flow),
    // and a plain http response has no automatic print dialog trigger.
    const toolbar =
      '<div class="no-print" style="position:sticky;top:0;background:#111;color:#fff;padding:10px 16px;' +
      'display:flex;justify-content:space-between;align-items:center;font-family:Arial,sans-serif;font-size:13px;margin:-30px -30px 20px -30px">' +
      "<span>DubaiVal.com · Area Executive Report</span>" +
      '<button onclick="window.print()" style="background:#C9A84C;color:#08090C;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer">Print / Save as PDF</button>' +
      "</div>" +
      "<style>@media print{.no-print{display:none}}</style>";
    const html = result.html.replace("<body>", "<body>" + toolbar);
    fs.writeFileSync(path.join(OUT_DIR, slug + ".html"), html);
    rows.push({ area: area, slug: slug, psf: result.psf, totalBuildings: result.totalBuildings, isVilla: result.isVilla, yield: result.yield });
    ok++;
  });

  // Hub page — a real, linkable index of every generated report, matching
  // the existing /areas.html hub's own visual convention.
  let hub = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">';
  hub += "<title>Area Executive Market Intelligence Reports — DubaiVal</title>";
  hub += '<meta name="description" content="Real, downloadable market intelligence reports for 30 major Dubai areas — pricing, yield, growth, building landscape and location intelligence, from DubaiVal’s own tracked database.">';
  hub += '<link rel="canonical" href="' + SITE + '/reports">';
  hub += '<style>body{font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:30px;background:#08090C;color:#E8EDF5}';
  hub += "h1{color:#C9A84C}a{color:#C9A84C;text-decoration:none}a:hover{text-decoration:underline}";
  hub += ".grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-top:20px}";
  hub += ".card{background:#12151F;border:1px solid #2A2E3A;border-radius:10px;padding:14px}";
  hub += ".meta{color:#8899AA;font-size:12px;margin-top:4px}</style></head><body>";
  hub += "<h1>Area Executive Market Intelligence Reports</h1>";
  hub += "<p>Real, downloadable reports for 30 major Dubai areas — built from DubaiVal’s own tracked building &amp; area benchmark database. Want a report for a different area, or your own agent branding on it? <a href=\"/#Workspace/Reports\">Generate one instantly inside the app</a>.</p>";
  hub += '<div class="grid">';
  rows.sort(function (a, b) { return a.area.localeCompare(b.area); }).forEach(function (r) {
    hub += '<a class="card" href="/reports/' + r.slug + '">';
    hub += "<strong>" + esc(r.area) + "</strong>";
    hub += '<div class="meta">' + (r.isVilla ? "Villa/Townhouse" : "Apartment/Tower") + " · AED " + Math.round(r.psf).toLocaleString() + "/sqft · " + r.totalBuildings + " buildings</div>";
    hub += "</a>";
  });
  hub += "</div></body></html>";
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), hub);

  console.log("Generated " + ok + " area report(s), " + failed + " skipped/failed. Hub: reports/index.html");
}

main();
