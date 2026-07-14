// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// ── Dubai Real Estate News ────────────────────────────────────────────────────
// Multi-source RSS aggregated server-side, displayed with live polling.
// Shows cached articles instantly; background-fetches on every tab visit.
var NEWS_STATE = {
  articles: [],
  filter: "all",      // all | launch | general
  loading: false,
  error: null,
  stale: false,
  lastFetch: 0,
  knownLinks: null,   // for NEW badge
  lastVisit: 0,
  launchSearch: "",   // Launch Bank's own search box
  launchExpanded: false
};
try { NEWS_STATE.lastVisit = parseInt(localStorage.getItem("dv_news_last_visit") || "0", 10) || 0; } catch (e) {}
try {
  var _nc = localStorage.getItem("dv_news_cache");
  if (_nc) {
    var _np = JSON.parse(_nc);
    if (_np && Array.isArray(_np.articles) && _np.articles.length) {
      NEWS_STATE.articles = _np.articles;
      NEWS_STATE.lastFetch = _np.ts || 0;
    }
  }
} catch (e) {}
// Re-enrich cached articles from before the Launch Bank feature existed —
// _areas/_developers is cheap to (re)compute and keeps old cache entries
// from showing as unenriched until the next live refresh.
try { NEWS_STATE.articles.forEach(function(a) { if (typeof _enrichArticle === "function") _enrichArticle(a); }); } catch (e) {}

var _newsListEl = null;
var _newsStatusEl = null;
var _newsPollTimer = null;
var _newsPolling = false;

function stopNewsPolling() {
  if (_newsPollTimer) { clearInterval(_newsPollTimer); _newsPollTimer = null; }
  if (_newsPolling) {
    document.removeEventListener("visibilitychange", _newsVisibilityHandler);
    _newsPolling = false;
  }
  try { localStorage.setItem("dv_news_last_visit", String(Date.now())); } catch (e) {}
  _newsListEl = null;
  _newsStatusEl = null;
}

function _newsVisibilityHandler() {
  if (document.hidden) {
    if (_newsPollTimer) { clearInterval(_newsPollTimer); _newsPollTimer = null; }
  } else {
    if (!_newsPollTimer && _newsListEl) {
      _fetchNews(false);
      _newsPollTimer = setInterval(function() { _fetchNews(false); }, 60000);
    }
  }
}

function startNewsPolling() {
  if (_newsPollTimer) clearInterval(_newsPollTimer);
  if (!_newsPolling) {
    document.addEventListener("visibilitychange", _newsVisibilityHandler);
    _newsPolling = true;
  }
  if (!document.hidden) {
    _newsPollTimer = setInterval(function() { _fetchNews(false); }, 60000);
  }
}

// ── Launch Bank enrichment ────────────────────────────────────────────────────
// Turns a plain launch-tagged headline into a lightly structured record (area +
// developer, when detectable) instead of just a filtered list of links — the
// "database/bank" feel requested, built entirely from data already fetched
// (no new endpoint, no fabricated fields). Reuses the app's real 347-area
// benchmark DB (js/api.js's _detectAreasInText()) so area tagging stays
// accurate as the DB grows, rather than a second hardcoded area list.
var DEVELOPER_NAMES = [
  "Emaar", "DAMAC", "Sobha", "Nakheel", "Meraas", "Danube", "Azizi", "Binghatti",
  "Ellington", "Deyaar", "Nshama", "Select Group", "Omniyat", "Dubai Properties",
  "Meydan", "Arada", "Union Properties", "Majid Al Futtaim", "Aldar", "Damac Properties",
  "Wasl", "Dubai Holding", "MAG", "Tiger Group", "Object 1", "Beyond", "Samana"
];
function _detectDevelopersInText(text) {
  if (!text) return [];
  var lower = text.toLowerCase();
  var hits = [];
  var seen = {};
  DEVELOPER_NAMES.forEach(function(name) {
    var key = name.toLowerCase();
    if (seen[key.split(" ")[0]]) return; // "DAMAC" vs "Damac Properties" — count once
    if (lower.indexOf(key) !== -1) { hits.push(name); seen[key.split(" ")[0]] = true; }
  });
  return hits.slice(0, 2);
}
function _enrichArticle(a) {
  var text = (a.title || "") + " " + (a.description || "");
  a._areas = (typeof _detectAreasInText === "function") ? _detectAreasInText(text) : [];
  a._developers = _detectDevelopersInText(text);
  return a;
}

async function _fetchNews(initial) {
  if (NEWS_STATE.loading) return;
  NEWS_STATE.loading = true;
  NEWS_STATE.error = null;
  if (!NEWS_STATE.articles.length) _renderNewsList();
  if (_newsStatusEl) { _newsStatusEl.innerHTML = ""; _newsStatusEl.appendChild(span({ color: "#8899AA", fontSize: "11px" }, "Updating…")); }
  try {
    var r = await fetch("/api/proxy-news", { cache: "no-store" });
    // Always try to parse JSON — server returns HTTP 200 even on error
    var data;
    try { data = await r.json(); } catch (e) { data = { articles: [] }; }
    var incoming = Array.isArray(data && data.articles) ? data.articles : [];
    incoming.forEach(_enrichArticle);
    var prevKnown = NEWS_STATE.knownLinks;
    var freshSet = {};
    incoming.forEach(function(a) {
      freshSet[a.link] = true;
      a.isNew = !!(prevKnown && !prevKnown[a.link] && a.ts && a.ts > NEWS_STATE.lastVisit);
    });
    NEWS_STATE.knownLinks = freshSet;
    if (incoming.length) NEWS_STATE.articles = incoming;
    NEWS_STATE.stale = !!(data && data.stale);
    NEWS_STATE.error = incoming.length ? null : (data && data.error) || null;
    if (incoming.length) NEWS_STATE.lastFetch = (data && data.fetchedAt) || Date.now();
    if (incoming.length) {
      try {
        // Strip image data URLs before storing (too large for localStorage)
        var forStorage = incoming.map(function(a) { return Object.assign({}, a, { image: a.image && a.image.startsWith("data:") ? null : a.image }); });
        localStorage.setItem("dv_news_cache", JSON.stringify({ articles: forStorage, ts: NEWS_STATE.lastFetch }));
      } catch (e) {}
    }
  } catch (e) {
    // True network failure (no connection at all)
    if (!NEWS_STATE.articles.length) {
      NEWS_STATE.error = "No connection to news service. Check your internet.";
    }
    NEWS_STATE.stale = true;
  }
  NEWS_STATE.loading = false;
  _renderNewsList();
  _renderNewsStatus();
  // Refresh the Launch Bank's results in place (leaves its search <input>
  // untouched) so newly-polled launches appear without rebuilding the tab.
  // If the Bank hasn't been created yet (zero launches when the tab first
  // rendered), it appears next time the tab is opened — a full rebuild here
  // could steal focus mid-typing for the rare case of a launch arriving in
  // the exact 60s window a user is searching.
  if (_launchResultsEl) _renderLaunchResults(C());
}

var _DUBAI_SPOTS = [
  "Dubai Marina waterfront skyscrapers golden sunset",
  "Burj Khalifa Downtown Dubai aerial view blue sky",
  "Palm Jumeirah aerial view luxury villas Dubai",
  "Dubai Creek Harbour tower modern architecture",
  "DIFC financial district Dubai glass towers",
  "Dubai Marina yacht canal luxury apartments sunset",
  "Burj Al Arab beach luxury hotel Dubai coastline",
  "Dubai skyline aerial view evening lights",
  "Business Bay canal Dubai skyscrapers reflection",
  "Emaar Beachfront Dubai sea view towers"
];

// Async image fallback chain: RSS feed → Gemini AI → Unsplash → hide
// No Pollinations.ai — removed in favour of higher-quality sources.
async function _loadNewsImage(imgEl, a, idx, shimmer, banner) {
  function _show(src) { imgEl.src = src; }
  function _hide() { if (banner) banner.style.display = "none"; }

  // 1. RSS feed image (already set as imgEl.src by caller — handled via onload/onerror)
  // We only enter here after RSS image fails or was absent.

  // 2. Gemini AI generated image (if key available)
  if (typeof generateGeminiImage === "function") {
    var gKey = localStorage.getItem("dv_gemini_key");
    if (gKey) {
      var spot = _DUBAI_SPOTS[idx % _DUBAI_SPOTS.length];
      var titleWords = (a.title || "").replace(/[^\w\s]/g, " ").trim().split(" ").slice(0, 5).join(" ");
      var gUrl = await generateGeminiImage(spot + " " + titleWords + " professional real estate photography");
      if (gUrl) { _show(gUrl); return; }
    }
  }

  // 3. Unsplash real photos (if API key available)
  var uKey = localStorage.getItem("dv_unsplash_key");
  if (uKey) {
    try {
      var q = "dubai real estate " + _DUBAI_SPOTS[idx % _DUBAI_SPOTS.length].split(" ").slice(0, 3).join(" ");
      var r = await fetch(
        "https://api.unsplash.com/search/photos?query=" + encodeURIComponent(q) + "&per_page=5&orientation=landscape",
        { headers: { "Authorization": "Client-ID " + uKey } }
      );
      var d = await r.json();
      if (d.results && d.results.length) {
        _show(d.results[idx % Math.min(d.results.length, 5)].urls.regular);
        return;
      }
    } catch (e) {}
  }

  // 4. No image available — hide the banner entirely
  _hide();
}

// ── Domain → readable source name ─────────────────────────────────────────────
var SOURCE_NAMES = {
  "gulfnews.com": "Gulf News", "arabianbusiness.com": "Arabian Business",
  "khaleejtimes.com": "Khaleej Times", "thenationalnews.com": "The National",
  "zawya.com": "Zawya", "propertyfinder.ae": "Property Finder",
  "bayut.com": "Bayut", "arabnews.com": "Arab News",
  "reuters.com": "Reuters", "bloomberg.com": "Bloomberg"
};

function _sourceLabel(article) {
  if (article.source && article.source.length < 60 && article.source.indexOf(".") === -1) return article.source;
  try {
    var domain = new URL(article.link).hostname.replace(/^www\./, "");
    return SOURCE_NAMES[domain] || article.source || domain;
  } catch (e) { return article.source || "News"; }
}

function _tagMeta(tag, cl) {
  if (tag === "launch") return {
    label: "🚀 New Launch",
    color: cl.yellow || "#F59E0B",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.25)"
  };
  return {
    label: "📰 Market News",
    color: "#60A5FA",
    bg: "rgba(96,165,250,0.10)",
    border: "rgba(96,165,250,0.20)"
  };
}

// ── Loading skeleton ───────────────────────────────────────────────────────────
function _renderSkeleton(cl) {
  var wrap = div({});
  for (var i = 0; i < 5; i++) {
    var card = div({
      background: cl.surface, border: "1px solid " + cl.border,
      borderRadius: "14px", padding: "18px", marginBottom: "12px",
      animation: "skeletonPulse 1.5s ease-in-out infinite"
    });
    var topRow = div({ display: "flex", gap: "8px", marginBottom: "12px" });
    topRow.appendChild(div({ width: "80px", height: "20px", background: cl.border, borderRadius: "10px" }));
    topRow.appendChild(div({ width: "50px", height: "20px", background: cl.border, borderRadius: "10px", marginLeft: "auto" }));
    card.appendChild(topRow);
    card.appendChild(div({ height: "18px", background: cl.border, borderRadius: "6px", marginBottom: "8px" }));
    card.appendChild(div({ height: "18px", background: cl.border, borderRadius: "6px", width: "75%", marginBottom: "10px" }));
    card.appendChild(div({ height: "13px", background: cl.border, borderRadius: "4px", width: "90%" }));
    wrap.appendChild(card);
  }
  return wrap;
}

// ── Launch Bank — prominent, structured "now launching" database ────────────
// Always visible above the main feed regardless of the active filter pill
// below, per the user's request to make launches feel like a real bank
// rather than something you have to click a pill to discover. Built entirely
// from the same tagged articles the main feed already has (classifyTag() +
// _enrichArticle() above) — no new data source, no fabricated fields.
function _renderLaunchCard(a, cl) {
  var card = div({
    background: "linear-gradient(135deg,rgba(245,158,11,0.08),rgba(245,158,11,0.02))",
    border: "1px solid rgba(245,158,11,0.22)", borderRadius: "12px",
    padding: "12px", cursor: "pointer", minWidth: "240px", maxWidth: "240px",
    flexShrink: "0", transition: "transform 0.15s ease, border-color 0.15s ease"
  });
  card.addEventListener("mouseenter", function() { card.style.transform = "translateY(-2px)"; card.style.borderColor = "rgba(245,158,11,0.5)"; });
  card.addEventListener("mouseleave", function() { card.style.transform = "translateY(0)"; card.style.borderColor = "rgba(245,158,11,0.22)"; });
  card.addEventListener("click", function() { window.open(a.link, "_blank", "noopener,noreferrer"); });

  var topRow = div({ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", flexWrap: "wrap" });
  if (a.isNew) {
    topRow.appendChild(span({ fontSize: "9px", fontWeight: "700", padding: "2px 7px", borderRadius: "10px", background: "rgba(16,185,129,0.9)", color: "#fff" }, "NEW"));
  }
  (a._developers || []).forEach(function(d) {
    topRow.appendChild(span({ fontSize: "9px", fontWeight: "700", padding: "2px 8px", borderRadius: "10px", background: "rgba(212,175,55,0.15)", color: cl.gold }, d));
  });
  (a._areas || []).slice(0, 2).forEach(function(ar) {
    topRow.appendChild(span({ fontSize: "9px", fontWeight: "600", padding: "2px 8px", borderRadius: "10px", background: "rgba(96,165,250,0.12)", color: "#60A5FA" }, ar));
  });
  card.appendChild(topRow);

  card.appendChild(div({ color: cl.white, fontSize: "12.5px", fontWeight: "700", lineHeight: "1.4", marginBottom: "8px", display: "-webkit-box", WebkitLineClamp: "3", WebkitBoxOrient: "vertical", overflow: "hidden" }, a.title));

  var bottomRow = div({ display: "flex", alignItems: "center", justifyContent: "space-between" });
  bottomRow.appendChild(span({ fontSize: "10px", color: "#F59E0B", fontWeight: "600" }, _sourceLabel(a)));
  bottomRow.appendChild(span({ fontSize: "10px", color: cl.sub }, timeAgo(a.pubDate)));
  card.appendChild(bottomRow);

  return card;
}

// The search input lives in the "shell" (built once per tab visit / data
// refresh) while matches live in a separate "results" container that's the
// only thing rebuilt on every keystroke — otherwise recreating the <input>
// node on every character typed would steal focus/cursor position.
var _launchBankEl = null;
var _launchResultsEl = null;

function _renderLaunchResults(cl) {
  if (!_launchResultsEl) return;
  _launchResultsEl.innerHTML = "";
  var launches = NEWS_STATE.articles.filter(function(a) { return a.tag === "launch"; });
  var q = (NEWS_STATE.launchSearch || "").trim().toLowerCase();
  var filtered = q ? launches.filter(function(a) {
    var hay = (a.title + " " + (a.description || "") + " " + (a._areas || []).join(" ") + " " + (a._developers || []).join(" ")).toLowerCase();
    return hay.indexOf(q) !== -1;
  }) : launches;

  if (!filtered.length) {
    _launchResultsEl.appendChild(div({ color: cl.sub, fontSize: "12px", textAlign: "center", padding: "16px 0" },
      q ? "No launches match \"" + NEWS_STATE.launchSearch + "\"." : "No new project launches found right now."));
    return;
  }
  var visible = NEWS_STATE.launchExpanded ? filtered : filtered.slice(0, 8);
  var strip = div({ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px" });
  visible.forEach(function(a) { strip.appendChild(_renderLaunchCard(a, cl)); });
  _launchResultsEl.appendChild(strip);
  if (filtered.length > 8) {
    var moreBtn = el("button", {
      style: {
        marginTop: "10px", background: "transparent", border: "1px solid rgba(245,158,11,0.3)",
        color: "#F59E0B", borderRadius: "8px", padding: "6px 14px", fontSize: "11px", fontWeight: "700",
        cursor: "pointer", fontFamily: "'Space Grotesk',monospace"
      }
    });
    moreBtn.textContent = NEWS_STATE.launchExpanded ? "Show Less" : "Show All " + filtered.length + " Launches";
    moreBtn.addEventListener("click", function() { NEWS_STATE.launchExpanded = !NEWS_STATE.launchExpanded; _renderLaunchResults(cl); });
    _launchResultsEl.appendChild(moreBtn);
  }
}

function _renderLaunchBank(wrap, cl) {
  var launches = NEWS_STATE.articles.filter(function(a) { return a.tag === "launch"; });
  if (!launches.length) { _launchBankEl = null; _launchResultsEl = null; return; }

  var bank = div({
    background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.18)",
    borderRadius: "16px", padding: "16px", marginBottom: "20px"
  });

  var header = div({ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "4px" });
  header.appendChild(el("h2", { style: { color: "#F59E0B", fontSize: "15px", fontWeight: "800", margin: "0", display: "flex", alignItems: "center", gap: "6px" } }, "🚀 Launch Bank"));
  header.appendChild(span({ fontSize: "10px", fontWeight: "700", color: "#F59E0B", background: "rgba(245,158,11,0.12)", padding: "3px 10px", borderRadius: "10px" }, launches.length + " tracked"));
  bank.appendChild(header);

  bank.appendChild(el("p", { style: { color: cl.sub, fontSize: "11px", margin: "4px 0 12px", lineHeight: "1.6" } },
    "Every new project, tower and off-plan launch we've spotted in Dubai real estate news — searchable by area or developer."));

  var searchWrap = div({ position: "relative", marginBottom: "12px" });
  var searchInp = el("input", {
    style: {
      width: "100%", boxSizing: "border-box", background: cl.surfaceSolid || cl.surface,
      border: "1px solid rgba(245,158,11,0.25)", color: cl.white, borderRadius: "10px",
      padding: "9px 12px", fontSize: "12px", fontFamily: "'Inter',sans-serif", outline: "none"
    },
    type: "text", placeholder: "Search launches by area or developer (e.g. \"Dubai Marina\" or \"Emaar\")"
  });
  searchInp.value = NEWS_STATE.launchSearch;
  searchInp.addEventListener("input", function() { NEWS_STATE.launchSearch = searchInp.value; _renderLaunchResults(cl); });
  searchWrap.appendChild(searchInp);
  bank.appendChild(searchWrap);

  _launchResultsEl = div({});
  bank.appendChild(_launchResultsEl);
  _launchBankEl = bank;
  wrap.appendChild(bank);
  _renderLaunchResults(cl);
}

// ── Status bar ────────────────────────────────────────────────────────────────
function _renderNewsStatus() {
  if (!_newsStatusEl) return;
  var cl = C();
  _newsStatusEl.innerHTML = "";
  if (NEWS_STATE.error && !NEWS_STATE.articles.length) {
    // The article list below already shows a full error + "Try Again" CTA
    // for this exact case (see _renderNewsList) — leave the status bar
    // empty here instead of showing a second, redundant retry button.
    return;
  }
  var row = div({ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" });
  if (NEWS_STATE.loading) {
    row.appendChild(span({ color: "#8899AA", fontSize: "11px" }, "Updating…"));
  } else if (NEWS_STATE.stale && NEWS_STATE.articles.length) {
    row.appendChild(span({ color: "#F59E0B", fontSize: "10px" }, "⚡ Serving cached articles"));
    row.appendChild(span({ color: "#8899AA", fontSize: "10px" }, "· " + (NEWS_STATE.lastFetch ? "last updated " + timeAgo(new Date(NEWS_STATE.lastFetch).toISOString()) : "—")));
  } else if (NEWS_STATE.lastFetch) {
    var dot = el("span", { style: { display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981", verticalAlign: "middle", marginRight: "2px" } });
    row.appendChild(dot);
    row.appendChild(span({ color: "#8899AA", fontSize: "11px", verticalAlign: "middle" }, "Live · updated " + timeAgo(new Date(NEWS_STATE.lastFetch).toISOString())));
  }
  if (NEWS_STATE.error && NEWS_STATE.articles.length) {
    row.appendChild(span({ color: "#EF4444", fontSize: "10px", marginLeft: "6px" }, "⚠ Some sources unavailable"));
  }
  _newsStatusEl.appendChild(row);
}

// ── Article list ───────────────────────────────────────────────────────────────
function _renderNewsList() {
  if (!_newsListEl) return;
  var cl = C();
  _newsListEl.innerHTML = "";

  // Loading skeleton (first load only)
  if (NEWS_STATE.loading && !NEWS_STATE.articles.length) {
    _newsListEl.appendChild(_renderSkeleton(cl));
    return;
  }

  var filtered = NEWS_STATE.articles.filter(function(a) {
    return NEWS_STATE.filter === "all" ? true : a.tag === NEWS_STATE.filter;
  });

  if (!filtered.length) {
    var empty = div({ textAlign: "center", padding: "60px 20px" });
    if (NEWS_STATE.error && !NEWS_STATE.articles.length) {
      empty.appendChild(div({ fontSize: "32px", marginBottom: "12px" }, "⚠"));
      empty.appendChild(div({ color: "#EF4444", fontSize: "13px", fontWeight: "600", fontFamily: "'Space Grotesk',monospace", marginBottom: "6px" }, "Unable to load news"));
      empty.appendChild(div({ color: cl.sub, fontSize: "11px", marginBottom: "14px" }, NEWS_STATE.error));
      var retryLarge = el("button", {
        style: { background: "transparent", border: "1px solid #EF4444", color: "#EF4444", borderRadius: "8px", padding: "7px 18px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "'Space Grotesk',monospace" },
        onclick: function() { _fetchNews(false); }
      }, "Try Again");
      empty.appendChild(retryLarge);
    } else {
      empty.appendChild(div({ fontSize: "32px", marginBottom: "12px" }, "📰"));
      empty.appendChild(div({ color: cl.sub, fontSize: "13px" }, NEWS_STATE.filter === "launch" ? "No new project launches found right now." : "No articles in this category right now."));
      empty.appendChild(div({ color: cl.muted || cl.sub, fontSize: "11px", marginTop: "6px" }, "Check back soon — news refreshes every minute."));
    }
    _newsListEl.appendChild(empty);
    return;
  }

  // Insert skeleton CSS if not already present
  if (!document.getElementById("news-skeleton-css")) {
    var styleEl = el("style", { id: "news-skeleton-css" });
    styleEl.textContent = "@keyframes skeletonPulse{0%,100%{opacity:0.5}50%{opacity:1}} @keyframes newsSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}";
    document.head.appendChild(styleEl);
  }

  filtered.forEach(function(a, idx) {
    var meta = _tagMeta(a.tag, cl);
    var srcLabel = _sourceLabel(a);

    var card = div({
      background: cl.surface,
      backdropFilter: cl.blur, WebkitBackdropFilter: cl.blur,
      border: "1px solid " + (a.isNew ? meta.border : cl.border),
      borderRadius: "14px", marginBottom: "10px",
      cursor: "pointer", overflow: "hidden",
      transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
      boxShadow: cl.glassShadow,
      animation: "newsSlideIn 0.3s ease both",
      animationDelay: Math.min(idx * 30, 300) + "ms"
    });

    card.addEventListener("mouseenter", function() {
      card.style.transform = "translateY(-2px)";
      card.style.borderColor = meta.color;
      card.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)";
    });
    card.addEventListener("mouseleave", function() {
      card.style.transform = "translateY(0)";
      card.style.borderColor = a.isNew ? meta.border : cl.border;
      card.style.boxShadow = cl.glassShadow;
    });
    card.addEventListener("click", function() { window.open(a.link, "_blank", "noopener,noreferrer"); });

    // AI image: Gemini (from server, data URL) or Pollinations fallback
    var isLaunch = a.tag === "launch";
    var fallbackBg = isLaunch
      ? "linear-gradient(135deg,#2a1f05,#1a1200,#070B14)"
      : "linear-gradient(135deg,#051428,#071830,#070B14)";

    var imgBanner = div({
      width: "100%", height: "180px", overflow: "hidden",
      background: fallbackBg, position: "relative"
    });

    // Loading shimmer (shown until image loads)
    var shimmer = div({ style: {
      position: "absolute", inset: "0",
      background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.04) 50%,transparent 100%)",
      animation: "shimmer 1.5s infinite"
    }});
    imgBanner.appendChild(shimmer);

    var imgEl = document.createElement("img");
    imgEl.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;opacity:0;transition:opacity 0.5s ease;position:relative;z-index:1";
    imgEl.onload = function() { imgEl.style.opacity = "1"; shimmer.style.display = "none"; };
    imgEl.onerror = function() {
      if (!imgEl.dataset.fallback) {
        imgEl.dataset.fallback = "1";
        _loadNewsImage(imgEl, a, idx, shimmer, imgBanner);
      } else {
        imgBanner.style.display = "none";
      }
    };
    imgEl.src = a.image || "";
    if (!a.image) setTimeout(function() { imgEl.dispatchEvent(new Event("error")); }, 0);
    imgBanner.appendChild(imgEl);

    // Dark overlay for text readability
    var overlay = div({ style: {
      position: "absolute", inset: "0",
      background: "linear-gradient(to top,rgba(7,11,20,0.85) 0%,rgba(7,11,20,0.2) 50%,transparent 100%)"
    }});
    imgBanner.appendChild(overlay);

    // Tag badge + NEW — bottom left
    var catLabel = div({ style: { position: "absolute", left: "14px", bottom: "12px", display: "flex", gap: "6px", alignItems: "center" }});
    catLabel.appendChild(span({
      fontSize: "10px", fontWeight: "700", padding: "4px 12px", borderRadius: "20px",
      background: "rgba(0,0,0,0.55)", color: meta.color,
      border: "1px solid " + meta.border, letterSpacing: "0.02em", backdropFilter: "blur(8px)"
    }, meta.label));
    if (a.isNew) {
      catLabel.appendChild(span({
        fontSize: "10px", fontWeight: "700", padding: "4px 9px", borderRadius: "20px",
        background: "rgba(16,185,129,0.9)", color: "#fff", animation: "pulse 2s infinite"
      }, "NEW"));
    }
    imgBanner.appendChild(catLabel);

    // Zoom on hover
    card.addEventListener("mouseenter", function() { imgEl.style.transform = "scale(1.03)"; imgEl.style.transition = "transform 0.4s ease,opacity 0.4s ease"; });
    card.addEventListener("mouseleave", function() { imgEl.style.transform = "scale(1)"; });

    card.appendChild(imgBanner);

    // Content area
    var content = div({ padding: "14px 16px" });

    // Time row (below banner)
    content.appendChild(div({ marginBottom: "8px" },
      span({ fontSize: "11px", color: cl.sub }, timeAgo(a.pubDate))
    ));

    // Title
    var title = el("div", {
      style: { color: cl.white, fontSize: "14px", fontWeight: "700", lineHeight: "1.45", marginBottom: a.description ? "6px" : "10px" }
    }, a.title);
    content.appendChild(title);

    // Description
    if (a.description) {
      var desc = el("div", {
        style: { color: cl.sub, fontSize: "12px", lineHeight: "1.65", marginBottom: "10px", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" }
      }, a.description);
      content.appendChild(desc);
    }

    // Source row
    var srcRow = div({ display: "flex", alignItems: "center", gap: "6px" });
    srcRow.appendChild(span({ fontSize: "11px", color: cl.gold, fontWeight: "600" }, srcLabel));
    srcRow.appendChild(span({ color: cl.border, fontSize: "10px" }, "·"));
    srcRow.appendChild(span({ fontSize: "11px", color: cl.sub }, "Click to read"));
    content.appendChild(srcRow);

    card.appendChild(content);
    _newsListEl.appendChild(card);
  });
}

// ── Main render function ───────────────────────────────────────────────────────
function renderNews() {
  var cl = C();
  var wrap = div({ maxWidth: "800px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "'Space Grotesk',monospace" });

  // ─ Header ─
  var titleRow = div({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "6px", flexWrap: "wrap" });
  titleRow.appendChild(el("h1", { style: { color: cl.white, fontSize: "20px", fontWeight: "700", margin: "0" } }, "Dubai Real Estate News"));
  var refreshBtn = el("button", {
    style: {
      background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)",
      color: cl.gold, borderRadius: "8px", padding: "7px 14px",
      fontSize: "11px", fontWeight: "700", cursor: "pointer", fontFamily: "'Space Grotesk',monospace",
      transition: "background 0.15s"
    },
    onclick: function() { _fetchNews(false); }
  });
  refreshBtn.textContent = "↻ Refresh";
  refreshBtn.addEventListener("mouseenter", function() { refreshBtn.style.background = "rgba(212,175,55,0.15)"; });
  refreshBtn.addEventListener("mouseleave", function() { refreshBtn.style.background = "rgba(212,175,55,0.08)"; });
  titleRow.appendChild(refreshBtn);
  wrap.appendChild(titleRow);

  wrap.appendChild(el("p", {
    style: { color: cl.sub, fontSize: "12px", margin: "0 0 8px", lineHeight: "1.6" }
  }, "Live market news from Gulf News, Arabian Business, Khaleej Times, Google News and more. Auto-refreshes every minute."));

  _newsStatusEl = div({ minHeight: "18px", marginBottom: "14px" });
  wrap.appendChild(_newsStatusEl);

  // ─ Launch Bank — always visible, independent of the filter pills below ─
  _renderLaunchBank(wrap, cl);

  // ─ Filter pills with counts ─
  var pills = div({ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" });
  var filters = [
    { id: "all", label: "All News" },
    { id: "launch", label: "🚀 New Launches" },
    { id: "general", label: "📰 Market News" }
  ];
  var pillEls = {};

  function getCount(id) {
    if (!NEWS_STATE.articles.length) return "";
    var n = id === "all" ? NEWS_STATE.articles.length : NEWS_STATE.articles.filter(function(a) { return a.tag === id; }).length;
    return n ? " (" + n + ")" : "";
  }

  function paintPills() {
    filters.forEach(function(f) {
      var active = NEWS_STATE.filter === f.id;
      var btn = pillEls[f.id];
      btn.style.background = active ? cl.gold : "transparent";
      btn.style.color = active ? "#0A0E1A" : cl.sub;
      btn.style.borderColor = active ? cl.gold : cl.border;
      btn.textContent = f.label + getCount(f.id);
    });
  }

  filters.forEach(function(f) {
    var pill = el("button", {
      style: {
        background: "transparent", color: cl.sub,
        border: "1px solid " + cl.border, borderRadius: "20px",
        padding: "7px 16px", fontSize: "11.5px", fontWeight: "700", cursor: "pointer",
        fontFamily: "'Space Grotesk',monospace", transition: "all 0.15s ease",
        whiteSpace: "nowrap"
      },
      onclick: function() { NEWS_STATE.filter = f.id; paintPills(); _renderNewsList(); }
    }, f.label + getCount(f.id));
    pillEls[f.id] = pill;
    pills.appendChild(pill);
  });
  paintPills();
  wrap.appendChild(pills);

  // ─ Article list container ─
  _newsListEl = div({});
  wrap.appendChild(_newsListEl);

  // Render immediately from cache, then fetch if stale
  _renderNewsList();
  _renderNewsStatus();
  paintPills();

  var stale = !NEWS_STATE.articles.length || (Date.now() - NEWS_STATE.lastFetch) > 300000;
  if (stale) _fetchNews(true);
  startNewsPolling();

  return wrap;
}
