// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- NEWS TAB (live Dubai real estate news, client-polled) --------------------
var NEWS_STATE = {
  articles: [],
  filter: "all",      // all | launch | general
  loading: false,
  error: null,
  lastFetch: 0,
  knownLinks: null,    // Set of links seen during this tab session (for NEW badge)
  lastVisit: 0
};
try { NEWS_STATE.lastVisit = parseInt(localStorage.getItem("dv_news_last_visit") || "0", 10) || 0; } catch (e) {}
// Restore cached articles from localStorage for instant display
try {
  var _nc = localStorage.getItem("dv_news_cache");
  if (_nc) { var _np = JSON.parse(_nc); if (_np && _np.articles && _np.articles.length) { NEWS_STATE.articles = _np.articles; NEWS_STATE.lastFetch = _np.ts || 0; } }
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
      _newsPollTimer = setInterval(function () { _fetchNews(false); }, 60000);
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
    _newsPollTimer = setInterval(function () { _fetchNews(false); }, 60000);
  }
}

async function _fetchNews(initial) {
  if (NEWS_STATE.loading) return;
  NEWS_STATE.loading = true;
  if (_newsStatusEl) _newsStatusEl.textContent = "Refreshing…";
  try {
    var r = await fetch("/api/proxy-news");
    var data = await r.json();
    var incoming = data.articles || [];
    var prevKnown = NEWS_STATE.knownLinks;
    var freshSet = {};
    incoming.forEach(function (a) {
      freshSet[a.link] = true;
      a.isNew = !!(prevKnown && !prevKnown[a.link] && a.ts && a.ts > NEWS_STATE.lastVisit);
    });
    NEWS_STATE.knownLinks = freshSet;
    NEWS_STATE.articles = incoming;
    NEWS_STATE.error = null;
    NEWS_STATE.lastFetch = Date.now();
    try { localStorage.setItem("dv_news_cache", JSON.stringify({articles: incoming, ts: NEWS_STATE.lastFetch})); } catch (e) {}
  } catch (e) {
    NEWS_STATE.error = "Couldn't reach news service — showing last known articles.";
  }
  NEWS_STATE.loading = false;
  _renderNewsList();
  _renderNewsStatus();
}

function _newsTagMeta(tag, cl) {
  if (tag === "launch") return { label: "🚀 New Launch", color: cl.yellow, bg: cl.yellowBg, bo: cl.yellowBo };
  return { label: "📰 Market News", color: cl.blue || cl.gold, bg: "rgba(59,130,246,0.10)", bo: "rgba(59,130,246,0.30)" };
}

function _renderNewsStatus() {
  if (!_newsStatusEl) return;
  var cl = C();
  _newsStatusEl.innerHTML = "";
  if (NEWS_STATE.error) {
    _newsStatusEl.appendChild(span({ color: cl.red, fontSize: "11px" }, NEWS_STATE.error));
    return;
  }
  var dot = span({ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: cl.green, marginRight: "6px", boxShadow: "0 0 8px " + cl.green, verticalAlign: "middle" });
  _newsStatusEl.appendChild(dot);
  _newsStatusEl.appendChild(span({ color: cl.sub, fontSize: "11px", verticalAlign: "middle" }, "Live · updated " + (NEWS_STATE.lastFetch ? timeAgo(new Date(NEWS_STATE.lastFetch).toISOString()) : "—")));
}

function _renderNewsList() {
  if (!_newsListEl) return;
  var cl = C();
  _newsListEl.innerHTML = "";

  var filtered = NEWS_STATE.articles.filter(function (a) {
    if (NEWS_STATE.filter === "all") return true;
    return a.tag === NEWS_STATE.filter;
  });

  if (NEWS_STATE.loading && !NEWS_STATE.articles.length) {
    var loadWrap = div({ textAlign: "center", padding: "60px 20px", color: cl.sub, fontSize: "12px" });
    loadWrap.appendChild(el("div", { style: { width: "30px", height: "30px", margin: "0 auto 14px", borderRadius: "50%", border: "2px solid " + cl.border, borderTopColor: cl.gold, animation: "spin 0.8s linear infinite" } }));
    loadWrap.appendChild(span({}, "Loading latest Dubai real estate news…"));
    _newsListEl.appendChild(loadWrap);
    return;
  }

  if (!filtered.length) {
    _newsListEl.appendChild(div({ textAlign: "center", padding: "50px 20px", color: cl.sub, fontSize: "12px" }, "No articles in this category right now. Check back soon."));
    return;
  }

  filtered.forEach(function (a) {
    var meta = _newsTagMeta(a.tag, cl);
    var card = div({
      background: cl.surface, backdropFilter: cl.blur, WebkitBackdropFilter: cl.blur,
      border: "1px solid " + (a.isNew ? meta.bo : cl.border), borderRadius: "14px",
      padding: "16px 18px", marginBottom: "12px", cursor: "pointer",
      transition: "transform 0.2s ease,border-color 0.2s ease,box-shadow 0.2s ease",
      boxShadow: cl.glassShadow
    });
    card.addEventListener("mouseenter", function () { card.style.transform = "translateY(-2px)"; card.style.borderColor = meta.color; });
    card.addEventListener("mouseleave", function () { card.style.transform = "translateY(0)"; card.style.borderColor = a.isNew ? meta.bo : cl.border; });
    card.addEventListener("click", function () { window.open(a.link, "_blank", "noopener,noreferrer"); });

    var topRow = div({ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" });
    var badge = span({ fontSize: "10px", fontWeight: "700", padding: "3px 9px", borderRadius: "20px", background: meta.bg, color: meta.color, border: "1px solid " + meta.bo, letterSpacing: "0.02em" }, meta.label);
    topRow.appendChild(badge);
    if (a.isNew) {
      topRow.appendChild(span({ fontSize: "10px", fontWeight: "700", padding: "3px 9px", borderRadius: "20px", background: cl.greenBg, color: cl.green, border: "1px solid " + cl.greenBo, animation: "pulse 2s infinite" }, "NEW"));
    }
    topRow.appendChild(span({ fontSize: "11px", color: cl.sub, marginLeft: "auto" }, timeAgo(a.pubDate)));
    card.appendChild(topRow);

    card.appendChild(el("div", { style: { color: cl.white, fontSize: "13.5px", fontWeight: "700", lineHeight: "1.45", marginBottom: "6px" } }, a.title));
    if (a.description) {
      card.appendChild(el("div", { style: { color: cl.sub, fontSize: "12px", lineHeight: "1.6", marginBottom: "8px" } }, a.description));
    }
    var srcRow = div({ display: "flex", alignItems: "center", gap: "6px" });
    srcRow.appendChild(span({ fontSize: "11px", color: cl.gold, fontWeight: "600" }, a.source || "Google News"));
    card.appendChild(srcRow);

    _newsListEl.appendChild(card);
  });
}

function renderNews() {
  var cl = C();
  var wrap = div({ maxWidth: "780px", margin: "0 auto", padding: "24px 16px 60px", fontFamily: "'Space Grotesk',monospace" });

  var header = div({ marginBottom: "18px" });
  var titleRow = div({ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "6px" });
  titleRow.appendChild(el("h1", { style: { color: cl.white, fontSize: "20px", fontWeight: "700", margin: "0" } }, "Dubai Real Estate News"));
  var refreshBtn = el("button", {
    style: { background: cl.goldGlass || "rgba(212,175,55,0.10)", border: "1px solid " + (cl.goldGlassBorder || "rgba(212,175,55,0.2)"), color: cl.gold, borderRadius: "8px", padding: "7px 14px", fontSize: "11px", fontWeight: "700", cursor: "pointer", fontFamily: "'Space Grotesk',monospace" },
    onclick: function () { _fetchNews(false); }
  }, "↻ Refresh");
  titleRow.appendChild(refreshBtn);
  header.appendChild(titleRow);
  header.appendChild(el("p", { style: { color: cl.sub, fontSize: "12px", margin: "0 0 10px", lineHeight: "1.6" } }, "Live market news and new project launches, aggregated from Gulf News, Khaleej Times, Arabian Business, Zawya and other sources. Updates automatically every minute while this tab is open."));
  _newsStatusEl = div({ minHeight: "16px" });
  header.appendChild(_newsStatusEl);
  wrap.appendChild(header);

  var pills = div({ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" });
  var filters = [
    { id: "all", label: "All News" },
    { id: "launch", label: "🚀 New Launches" },
    { id: "general", label: "📰 Market News" }
  ];
  var pillEls = {};
  function paintPills() {
    filters.forEach(function (f) {
      var active = NEWS_STATE.filter === f.id;
      var btn = pillEls[f.id];
      btn.style.background = active ? cl.gold : "transparent";
      btn.style.color = active ? "#0A0E1A" : cl.sub;
      btn.style.borderColor = active ? cl.gold : cl.border;
    });
  }
  filters.forEach(function (f) {
    var pill = el("button", {
      style: {
        background: "transparent", color: cl.sub,
        border: "1px solid " + cl.border, borderRadius: "20px",
        padding: "7px 16px", fontSize: "11.5px", fontWeight: "700", cursor: "pointer",
        fontFamily: "'Space Grotesk',monospace", transition: "all 0.2s ease"
      },
      onclick: function () { NEWS_STATE.filter = f.id; paintPills(); _renderNewsList(); }
    }, f.label);
    pillEls[f.id] = pill;
    pills.appendChild(pill);
  });
  paintPills();
  wrap.appendChild(pills);

  _newsListEl = div({});
  wrap.appendChild(_newsListEl);

  // Show cached articles instantly; refresh if stale (>5 min) or empty
  var needsFetch = !NEWS_STATE.articles.length || (Date.now() - NEWS_STATE.lastFetch) > 300000;
  if (needsFetch && !NEWS_STATE.articles.length) NEWS_STATE.loading = true;
  _renderNewsList();
  _renderNewsStatus();
  if (needsFetch) _fetchNews(true);
  startNewsPolling();

  return wrap;
}
