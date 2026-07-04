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
  lastVisit: 0
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
      try { localStorage.setItem("dv_news_cache", JSON.stringify({ articles: incoming, ts: NEWS_STATE.lastFetch })); } catch (e) {}
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

// ── Status bar ────────────────────────────────────────────────────────────────
function _renderNewsStatus() {
  if (!_newsStatusEl) return;
  var cl = C();
  _newsStatusEl.innerHTML = "";
  if (NEWS_STATE.error && !NEWS_STATE.articles.length) {
    var errWrap = div({ display: "flex", alignItems: "center", gap: "6px" });
    errWrap.appendChild(span({ color: "#F87171", fontSize: "11px" }, "⚠ " + NEWS_STATE.error));
    var retryBtn = el("button", {
      style: { background: "transparent", border: "1px solid #F87171", color: "#F87171", borderRadius: "6px", padding: "2px 10px", fontSize: "10px", cursor: "pointer", fontFamily: "'Space Grotesk',monospace" },
      onclick: function() { _fetchNews(false); }
    }, "Retry");
    errWrap.appendChild(retryBtn);
    _newsStatusEl.appendChild(errWrap);
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
    row.appendChild(span({ color: "#F87171", fontSize: "10px", marginLeft: "6px" }, "⚠ Some sources unavailable"));
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
    empty.appendChild(div({ fontSize: "32px", marginBottom: "12px" }, "📰"));
    empty.appendChild(div({ color: cl.sub, fontSize: "13px" }, NEWS_STATE.filter === "launch" ? "No new project launches found right now." : "No articles in this category right now."));
    empty.appendChild(div({ color: cl.muted || cl.sub, fontSize: "11px", marginTop: "6px" }, "Check back soon — news refreshes every minute."));
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

    // Branded gradient banner
    var isLaunch = a.tag === "launch";
    var bannerBg = isLaunch
      ? "linear-gradient(135deg,#2a1f05 0%,#1a1200 40%,#0d0e16 100%)"
      : "linear-gradient(135deg,#051428 0%,#071830 40%,#070B14 100%)";
    var accentLine = isLaunch
      ? "linear-gradient(90deg,#D4AF37,#F59E0B,rgba(212,175,55,0))"
      : "linear-gradient(90deg,#3B82F6,#60A5FA,rgba(59,130,246,0))";
    var bannerIcons = { launch: ["🏗","🚀","🏙","🌆","🏢"], general: ["📊","📈","🏠","💎","🔑"] };
    var iconPool = bannerIcons[isLaunch ? "launch" : "general"];
    var bannerIcon = iconPool[idx % iconPool.length];

    var imgBanner = div({
      width: "100%", height: "130px", overflow: "hidden",
      background: bannerBg,
      position: "relative"
    });

    // Accent line at top
    var accentEl = div({
      position: "absolute", top: "0", left: "0", right: "0", height: "3px",
      background: accentLine
    });
    imgBanner.appendChild(accentEl);

    // Big emoji — right side
    var iconWrap = div({ style: {
      position: "absolute", right: "16px", top: "50%",
      transform: "translateY(-50%) rotate(-10deg)",
      fontSize: "72px", lineHeight: "1", opacity: "0.35",
      userSelect: "none", pointerEvents: "none"
    }});
    iconWrap.textContent = bannerIcon;
    imgBanner.appendChild(iconWrap);

    // Glow circle behind emoji
    var glow = div({ style: {
      position: "absolute", right: "10px", top: "50%",
      transform: "translateY(-50%)",
      width: "90px", height: "90px", borderRadius: "50%",
      background: isLaunch ? "rgba(212,175,55,0.08)" : "rgba(59,130,246,0.08)",
      filter: "blur(16px)"
    }});
    imgBanner.appendChild(glow);

    // DUBAIVAL logo
    var logoText = div({ style: {
      position: "absolute", left: "14px", top: "14px",
      fontSize: "9px", fontWeight: "800", letterSpacing: "0.14em",
      fontFamily: "'Space Grotesk',monospace",
      color: isLaunch ? "rgba(212,175,55,0.5)" : "rgba(96,165,250,0.45)"
    }});
    logoText.textContent = "DUBAIVAL";
    imgBanner.appendChild(logoText);

    // Tag badge + NEW — bottom left
    var catLabel = div({ style: { position: "absolute", left: "14px", bottom: "12px", display: "flex", gap: "6px", alignItems: "center" }});
    var tagBadgeImg = span({
      fontSize: "10px", fontWeight: "700", padding: "4px 12px", borderRadius: "20px",
      background: isLaunch ? "rgba(212,175,55,0.18)" : "rgba(59,130,246,0.15)",
      color: meta.color, border: "1px solid " + meta.border, letterSpacing: "0.02em"
    }, meta.label);
    catLabel.appendChild(tagBadgeImg);
    if (a.isNew) {
      catLabel.appendChild(span({
        fontSize: "10px", fontWeight: "700", padding: "4px 9px", borderRadius: "20px",
        background: "rgba(16,185,129,0.9)", color: "#fff", animation: "pulse 2s infinite"
      }, "NEW"));
    }
    imgBanner.appendChild(catLabel);
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
