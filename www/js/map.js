// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- MAP TAB (Google Maps) ---------------------------------------------------
// 2026-07-13 (session 11s), per explicit user direction: the session 11q/11r
// Voronoi cell-polygon layer is REMOVED entirely, even after being fixed for
// opacity/auto-pan in 11r — the user's point (correct) is that Google's own
// base map ALREADY shows Dubai's real area/community/building divisions
// (roads, neighborhood labels, landmarks), so drawing a second, competing
// subdivision on top of it is unnecessary and was the root cause of every
// visual problem so far (opaque color wash, obscured streets). DubAIVal's
// job is only to plot OUR data on top of the real map, not draw a new one.
// This redesign goes back to colored POINT MARKERS (one per area centroid,
// the technique session 11f originally built) instead of any polygon/fill
// layer — zero color curtain is possible by construction, since a marker's
// footprint is a small dot, not an area-covering shape. js/voronoi.js is no
// longer used anywhere and has been removed from the build.
// Kept from the 11q/11r work: one shared continuous color scale for every
// metric, the composite "Investment Score" metric (this map's default), a
// dynamic legend showing the REAL min/max of the data being shown, the light
// high-detail base theme (so neighborhood names/roads/buildings stay fully
// legible), click-only popups (no mouseover-triggered InfoWindow, so no
// auto-pan risk), the Places Autocomplete search box, and the "Explore
// Buildings" popup CTA that deep-links into Find → Smart Property Discovery.
var _dvMapState = {metric: "invest", gmap: null, overlays: [], clusterMarkers: [], tier:"area", focusArea:null, buildingMarkers:[], areaPoints:[], panelEl:null, backControlEl:null};

// 2026-07-13 (session 11t), per explicit user request for a two-tier drill-
// down: click an AREA marker → a rich area-overview panel (investment
// snapshot, building count, key buildings, live nearby essentials). From
// there, optionally "Show Key Buildings on Map" → the map zooms into that
// area and drops one marker per top-grade building (real DB entries,
// geocoded via the existing /api/proxy-maps geocode action, cached so the
// same building is never re-geocoded twice). Clicking a BUILDING marker
// shows a building-specific panel (grade, PSF, service charge, estimated
// unit count/yield/rental demand — all from the real valuation engine, never
// fabricated). Every transition is an explicit click, never automatic, so a
// user never receives a wall of information they didn't ask for.
var _DV_GRADE_RANK = {Ultra:7, "A+":6, A:5, "A-":4, "B+":3, B:2, C:1};
var _DV_GRADE_COLOR = {Ultra:"#9B59B6", "A+":"#D4AF37", A:"#F0A030", "A-":"#F0C060", "B+":"#3B82F6", B:"#60A5FA", C:"#8899AA"};
var _DV_KEY_BUILDINGS_LIMIT = 12;

// Areas genuinely far outside Dubai's urban core (Hatta ~97km east — the next
// farthest tracked area is ~32km) get their own always-solo marker: grouping
// them into the same clustering pass as the urban core would average their
// position toward a spot roughly halfway to Dubai, which is meaningless.
var _DV_MAP_ORIGIN = {lat: 25.15, lng: 55.25};
var _DV_OUTLIER_KM = 55;

function _dvMapCleanup() {
  _dvClearOverlays();
  _dvClearBuildingMarkers();
  _dvMapState.backControlEl = null;
  if (_dvMapState.gmap) {
    google.maps.event.clearInstanceListeners(_dvMapState.gmap);
    _dvMapState.gmap = null;
  }
}

// Re-run on every zoom/pan tick to rebuild the marker layer at the right
// level of detail — must NOT touch the map instance itself.
function _dvClearOverlays() {
  _dvMapState.overlays.forEach(function(o) {
    google.maps.event.clearInstanceListeners(o);
    o.setMap(null);
  });
  _dvMapState.overlays = [];
}

// Light, high-detail base style — POI/transit/buildings/neighborhood labels
// all stay fully visible, with a light brand-gold tint on highways — so
// Dubai's own real streets, communities, and landmarks read clearly, exactly
// what the user asked the map to show, with only small colored point
// markers layered on top (no area-covering fill of any kind). Matches how
// Zillow/Redfin/PropertyFinder/Bayut all use light, detailed base maps.
var _GMAP_LIGHT_STYLES = [
  {elementType:"geometry",stylers:[{color:"#F5F3EE"}]},
  {elementType:"labels.text.fill",stylers:[{color:"#5B6472"}]},
  {elementType:"labels.text.stroke",stylers:[{color:"#F5F3EE"}]},
  {featureType:"administrative.neighborhood",elementType:"labels.text.fill",stylers:[{color:"#8A6D1F"}]},
  {featureType:"administrative.neighborhood",elementType:"labels.text.stroke",stylers:[{color:"#FFFFFF"}]},
  {featureType:"landscape",elementType:"geometry",stylers:[{color:"#EFEDE6"}]},
  {featureType:"poi",elementType:"geometry",stylers:[{color:"#E7E4DA"}]},
  {featureType:"poi",elementType:"labels.text.fill",stylers:[{color:"#8A8F98"}]},
  {featureType:"poi.park",elementType:"geometry",stylers:[{color:"#DCE6D5"}]},
  {featureType:"road",elementType:"geometry",stylers:[{color:"#FFFFFF"}]},
  {featureType:"road",elementType:"geometry.stroke",stylers:[{color:"#D8D3C6"}]},
  {featureType:"road",elementType:"labels.text.fill",stylers:[{color:"#8A8F98"}]},
  {featureType:"road.arterial",elementType:"geometry",stylers:[{color:"#FDFCFA"}]},
  {featureType:"road.highway",elementType:"geometry",stylers:[{color:"#F0DFA3"}]},
  {featureType:"road.highway",elementType:"geometry.stroke",stylers:[{color:"#D4AF37"}]},
  {featureType:"road.highway",elementType:"labels.text.fill",stylers:[{color:"#8A6D1F"}]},
  {featureType:"transit.line",elementType:"geometry",stylers:[{color:"#E5E2D8"}]},
  {featureType:"transit.station",elementType:"geometry",stylers:[{color:"#E7E4DA"}]},
  {featureType:"water",elementType:"geometry",stylers:[{color:"#C7DCE8"}]},
  {featureType:"water",elementType:"labels.text.fill",stylers:[{color:"#6E8A9A"}]}
];

var _dvGmapErrCbs = [];
function _dvGmapLoad(cb, onErr) {
  if (window.google && window.google.maps) { cb(); return; }
  if (onErr) _dvGmapErrCbs.push(onErr);
  if (Array.isArray(window._dvGmapPending)) { window._dvGmapPending.push(cb); return; }
  window._dvGmapPending = [cb];
  fetch("/api/proxy-maps?action=config")
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.key) throw new Error("No key");
      window._dvGmapReady = function() {
        var cbs = window._dvGmapPending || [];
        window._dvGmapPending = null;
        _dvGmapErrCbs = [];
        cbs.forEach(function(f) { f(); });
      };
      var s = document.createElement("script");
      s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(d.key) + "&libraries=places&callback=_dvGmapReady";
      s.onerror = function() {
        window._dvGmapPending = null;
        _dvGmapErrCbs.forEach(function(f){f();});
        _dvGmapErrCbs = [];
      };
      s.async = true;
      document.head.appendChild(s);
    })
    .catch(function() {
      window._dvGmapPending = null;
      _dvGmapErrCbs.forEach(function(f){f();});
      _dvGmapErrCbs = [];
    });
}

// ── Composite Investment Score (new default metric) ────────────────────────
// A real, transparent, itemized-weight composite from the same fields every
// other metric already draws from — no new data source, just a documented
// blend so a user gets one "where should I look first" signal instead of
// having to mentally combine 5 separate single-factor maps themselves. Same
// spirit as computeValuation()'s Margin-of-Safety index (js/valuation.js),
// adapted to area-level inputs.
//   Yield (30%)     — 3% floor / 10% ceiling, Dubai's realistic gross-yield range
//   Growth 3yr (30%)— 0% floor / 30% ceiling
//   Liquidity (20%) — inverse of Days-on-Market, 90d floor / 15d ceiling
//   Turnover (20%)  — log-scaled annual transaction volume, 1 floor / 3000 ceiling
function _dvInvestmentScore(aData) {
  var y = aData.y || [5, 7];
  var yieldMid = (y[0] + y[1]) / 2;
  var g = aData.g || [3, 9, 16];
  var growth3 = g[1];
  var dom = aData.dom || 60;
  var txVol = aData.txVol || 100;
  var yieldScore = Math.max(0, Math.min(100, (yieldMid - 3) / (10 - 3) * 100));
  var growthScore = Math.max(0, Math.min(100, (growth3 - 0) / (30 - 0) * 100));
  var liqScore = Math.max(0, Math.min(100, (90 - dom) / (90 - 15) * 100));
  var txScore = Math.max(0, Math.min(100, Math.log10(Math.max(txVol, 1)) / Math.log10(3000) * 100));
  return Math.round(yieldScore * 0.30 + growthScore * 0.30 + liqScore * 0.20 + txScore * 0.20);
}

// ── Metric registry — single source of truth for every map layer ───────────
// "polarity" drives BOTH the color scale and the legend direction:
//   good-high: bigger number = better investment (green)
//   good-low:  smaller number = better investment (green) — e.g. Days on Market
//   neutral:   no good/bad judgment implied (Price) — blue→gold instead of red→green
// "detail" returns 2 extra popup facts specific to this metric — keeps the
// informational depth the old bespoke-per-metric popups had, without going
// back to a fully custom HTML block per metric (one consistent template
// instead, per the same "professional platform" consistency goal as the
// unified color scale below).
var DV_MAP_METRICS = {
  invest:    {label:"Investment Score", polarity:"good-high", getVal:function(a){return _dvInvestmentScore(a);}, fmt:function(v){return Math.round(v)+"/100";},
    detail:function(a){var y=a.y||[5,7];return [{l:"Yield",v:((y[0]+y[1])/2).toFixed(1)+"%"},{l:"Growth 3yr",v:"+"+((a.g&&a.g[1])||9)+"%"}];}},
  growth:    {label:"3yr Capital Growth", polarity:"good-high", getVal:function(a){return (a.g&&a.g[1])||10;}, fmt:function(v){return "+"+Math.round(v)+"%";},
    detail:function(a){var g=a.g||[3,9,16];return [{l:"1yr",v:"+"+g[0]+"%"},{l:"5yr",v:"+"+g[2]+"%"}];}},
  yield:     {label:"Gross Yield", polarity:"good-high", getVal:function(a){var y=a.y||[5,7];return (y[0]+y[1])/2;}, fmt:function(v){return v.toFixed(1)+"%";},
    detail:function(a){var r1=a.r1||0,r2=a.r2||0;return [{l:"1BR Rent",v:r1?"AED "+r1.toLocaleString():"—"},{l:"2BR Rent",v:r2?"AED "+r2.toLocaleString():"—"}];}},
  price:     {label:"Price (AED/sqft)", polarity:"neutral", getVal:function(a){return a.psf||1500;}, fmt:function(v){return "AED "+Math.round(v).toLocaleString();},
    detail:function(a){var psf=a.psf||1500;var tier=psf>2500?"Premium":psf>1500?"Mid-Range":"Affordable";var vsDXB=Math.round((psf-1800)/1800*100);return [{l:"Tier",v:tier},{l:"vs Dubai Avg",v:(vsDXB>=0?"+":"")+vsDXB+"%"}];}},
  liquidity: {label:"Days on Market", polarity:"good-low", getVal:function(a){return a.dom||60;}, fmt:function(v){return Math.round(v)+"d";},
    detail:function(a){var txVol=a.txVol||100;var actLvl=txVol>200?"High":txVol>100?"Medium":"Low";return [{l:"Txn/yr",v:txVol},{l:"Activity",v:actLvl}];}},
  turnover:  {label:"Annual Transactions", polarity:"good-high", getVal:function(a){return a.txVol||100;}, fmt:function(v){return Math.round(v).toLocaleString();},
    detail:function(a){var dom=a.dom||60;var speed=dom<30?"Fast":dom<60?"Normal":"Slow";return [{l:"DOM",v:dom+"d"},{l:"Speed",v:speed}];}},
  location:  {label:"Location Score", polarity:"good-high", getVal:function(a,name){var gs=computeGeoScore(name);return gs?gs.locationScore:3;}, fmt:function(v){return v.toFixed(1)+"/10";},
    detail:function(a,name){var gs=computeGeoScore(name);if(!gs)return[];var stars="";for(var i=0;i<5;i++)stars+=i<Math.round(gs.locationScore/2)?"★":"☆";return [{l:"Metro",v:gs.metroName+" ("+gs.metroDist+"km)"},{l:"Rating",v:stars}];}}
};

// One continuous HSL interpolation for every metric — replaces the previous
// inconsistent mix of a manual-RGB-blend formula for some metrics and 3
// hardcoded discrete tiers for others (price/location). ratio is 0..1
// (already normalized against the REAL min/max of the data being shown).
function _dvMetricColor(ratio, polarity) {
  ratio = Math.max(0, Math.min(1, ratio));
  if (polarity === "good-low") ratio = 1 - ratio;
  if (polarity === "neutral") {
    var hue = 210 - ratio * 165; // 210=blue (low) -> 45=gold (high) — no quality judgment
    return "hsl(" + Math.round(hue) + ",65%,52%)";
  }
  var hue = ratio * 120; // 0=red (bad) -> 120=green (good)
  return "hsl(" + Math.round(hue) + ",68%,48%)";
}

// ── Info panel — docked over the map, replaces the old floating InfoWindow
// popup for area/building content (kept only for the small single-line
// Metro/Tram facts below). A real side panel scrolls, so it can hold much
// richer content than an InfoWindow bubble without crowding the map.
function _dvShowPanel(html) {
  var p = _dvMapState.panelEl;
  if (!p) return;
  p.innerHTML = '<div style="padding:16px;font-family:\'Inter\',sans-serif;">'
    + '<div style="text-align:right;margin:-8px -8px 4px 0;"><button onclick="_dvHidePanel()" style="background:none;border:none;color:#6B7A9E;font-size:18px;line-height:1;cursor:pointer;padding:4px 8px;">×</button></div>'
    + html
    + '</div>';
  p.style.display = "block";
}
function _dvHidePanel() {
  if (_dvMapState.panelEl) _dvMapState.panelEl.style.display = "none";
}
function _dvStatBox(label, val, color) {
  return '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:9px 10px;">'
    + '<div style="color:#6B7A9E;font-size:9px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px;">' + label + '</div>'
    + '<div style="color:' + color + ';font-size:14px;font-weight:800;font-family:\'Space Grotesk\',monospace;">' + val + '</div></div>';
}
function _dvTitleCase(s) {
  return (s || "").replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

function _dvAreaBuildingCount(areaName) {
  var cnt = 0;
  for (var bk in DB) { if (DB[bk].a === areaName) cnt++; }
  return cnt;
}
// "Key buildings" = highest grade, then highest PSF within that grade — a
// real, defensible proxy for "buildings that matter most to a buyer here"
// derived purely from existing DB fields, never a fabricated importance flag.
function _dvAreaKeyBuildings(areaName, limit) {
  var list = [];
  for (var bk in DB) { if (DB[bk].a === areaName) list.push(Object.assign({name: bk}, DB[bk])); }
  list.sort(function(a, b) { return (_DV_GRADE_RANK[b.g] || 0) - (_DV_GRADE_RANK[a.g] || 0) || (b.p - a.p); });
  return list.slice(0, limit || _DV_KEY_BUILDINGS_LIMIT);
}

var _DV_POI_ICON = {mall:"🛍️", landmark:"🏛️", beach:"🏖️", business:"🏢", airport:"✈️", waterfront:"🌊"};
var _DV_LANDMARK_RADIUS_KM = 8;
// Notable landmarks near an area — reuses the existing, already-curated
// KEY_POIS list (30 real malls/landmarks/beaches/business hubs/airports/
// waterfronts, the same dataset computeGeoScore() already draws on) instead
// of a second hand-written list. Free and instant (static coordinates, no
// live call). Filtered to a real proximity radius so a far-away entry never
// gets mislabeled "nearby" — areas with nothing within range simply show
// no section at all rather than a misleading distant match.
function _dvNearestKeyPois(areaName, limit) {
  var coords = AREA_COORDS[areaName];
  if (!coords || typeof KEY_POIS === "undefined") return [];
  var withDist = KEY_POIS.map(function(p) {
    return {n: p.n, cat: p.cat, dist: haversineKm(coords[0], coords[1], p.lat, p.lng)};
  }).filter(function(p) { return p.dist <= _DV_LANDMARK_RADIUS_KM; });
  withDist.sort(function(a, b) { return a.dist - b.dist; });
  return withDist.slice(0, limit || 3);
}

// Live nearby essentials (mall/hospital/school/supermarket), reusing the
// exact same /api/proxy-maps?action=amenities endpoint + cache key the
// Analyzer's "Nearby Amenities" card already uses — real Google Places data,
// shared/cached across features instead of a second hand-curated list.
function _dvFetchAreaAmenities(areaName, targetId) {
  var cacheKey = "dv_amenities_" + areaName;
  function renderInto(data) {
    var elm = document.getElementById(targetId);
    if (!elm) return; // panel closed or replaced before the fetch resolved
    if (!data || data.error || !data.amenities) { elm.innerHTML = '<div style="color:#556677;font-size:11px;">Nearby data unavailable.</div>'; return; }
    var ams = data.amenities;
    var cfg = [
      {k:"mall", label:"Mall", icon:"🛍️", color:"#D4A843"},
      {k:"hospital", label:"Hospital", icon:"🏥", color:"#EF4444"},
      {k:"school", label:"School", icon:"🎓", color:"#10B981"},
      {k:"supermarket", label:"Supermarket", icon:"🛒", color:"#F59E0B"}
    ];
    function fmtD(m) { return m < 1000 ? m + "m" : (m / 1000).toFixed(1) + "km"; }
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
    cfg.forEach(function(c) {
      var a = ams[c.k];
      html += '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:9px 10px;">'
        + '<div style="display:flex;justify-content:space-between;margin-bottom:3px;">'
        + '<span style="font-size:10px;color:#8899AA;">' + c.icon + ' ' + c.label + '</span>'
        + '<span style="font-size:10px;font-weight:700;color:' + c.color + ';">' + (a ? fmtD(a.dist) : "—") + '</span></div>'
        + '<div style="font-size:10px;color:#9BA8C8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (a ? a.name : "Not found nearby") + '</div>'
        + '</div>';
    });
    html += '</div>';
    elm.innerHTML = html;
  }
  var cached = null;
  try { var s = sessionStorage.getItem(cacheKey); if (s) cached = JSON.parse(s); } catch (e) {}
  if (cached) { renderInto(cached); return; }
  fetch("/api/proxy-maps?action=amenities&address=" + encodeURIComponent(areaName + ", Dubai"))
    .then(function(r) { return r.json(); })
    .then(function(data) { try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) {} renderInto(data); })
    .catch(function() { var elm = document.getElementById(targetId); if (elm) elm.innerHTML = '<div style="color:#556677;font-size:11px;">Nearby data unavailable.</div>'; });
}

// Approximate area size (km²) — no AREAS[] field exists for this (confirmed
// no source of it anywhere in the app), but Google's Geocoding API returns a
// real bounding box for neighborhood-level results. "bounds" (tighter,
// present only for genuine admin/neighborhood regions) is preferred over
// "viewport" (always present, but sized for map display and often padded).
// A plain lat/lng rectangle is an approximation, not an official boundary —
// labeled "Approx." in the panel rather than presented as exact.
function _dvFetchAreaSize(areaName, targetId) {
  var cacheKey = "dv_areasize_" + areaName;
  function renderInto(sqkm) {
    var elm = document.getElementById(targetId);
    if (!elm) return;
    elm.textContent = sqkm ? sqkm.toFixed(1) + " km²" : "—";
  }
  var raw = null;
  try { raw = sessionStorage.getItem(cacheKey); } catch (e) {}
  if (raw !== null) { renderInto(JSON.parse(raw)); return; } // includes a previously-failed lookup (stored as null) — don't refetch
  fetch("/api/proxy-maps?action=geocode&address=" + encodeURIComponent(areaName + ", Dubai"))
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var box = (d && (d.bounds || d.viewport)) || null;
      var sqkm = null;
      if (box && box.northeast && box.southwest) {
        var ne = box.northeast, sw = box.southwest;
        var widthKm = haversineKm(sw.lat, sw.lng, sw.lat, ne.lng);
        var heightKm = haversineKm(sw.lat, sw.lng, ne.lat, sw.lng);
        sqkm = widthKm * heightKm;
      }
      try { sessionStorage.setItem(cacheKey, JSON.stringify(sqkm)); } catch (e) {}
      renderInto(sqkm);
    })
    .catch(function() { renderInto(null); });
}

// ── Tier 1 panel content — clicked an AREA marker ──────────────────────────
function _dvAreaInfoHtml(areaName, aData) {
  var yi = aData.y || [5, 7];
  var g = aData.g || [3, 9, 16];
  var bldgCount = _dvAreaBuildingCount(areaName);
  var metroS = (typeof computeGeoScore === "function") ? computeGeoScore(areaName) : null;
  var landmarks = _dvNearestKeyPois(areaName, 3);
  var amId = "dv-am-" + Math.random().toString(36).slice(2);
  var sizeId = "dv-sz-" + Math.random().toString(36).slice(2);

  var html = '<div style="color:#D4AF37;font-size:16px;font-weight:800;font-family:\'Space Grotesk\',monospace;margin-bottom:2px;">' + areaName + '</div>'
    + '<div style="color:#6B7A9E;font-size:10px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px;">Area Overview</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">'
    + _dvStatBox("Gross Yield", ((yi[0] + yi[1]) / 2).toFixed(1) + "%", "#10B981")
    + _dvStatBox("Avg PSF", "AED " + Math.round(aData.psf || 0).toLocaleString(), "#D4A843")
    + _dvStatBox("3yr Growth", "+" + g[1] + "%", "#10B981")
    + _dvStatBox("Days on Market", Math.round(aData.dom || 60) + "d", "#3B82F6")
    + '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:9px 10px;">'
    + '<div style="color:#6B7A9E;font-size:9px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px;">Approx. Area</div>'
    + '<div id="' + sizeId + '" style="color:#818CF8;font-size:14px;font-weight:800;font-family:\'Space Grotesk\',monospace;">…</div></div>'
    + '</div>'
    + '<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:12px;margin-bottom:14px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
    + '<span style="color:#8899AA;font-size:10px;text-transform:uppercase;letter-spacing:.08em;">Buildings Tracked</span>'
    + '<span style="color:#FFFFFF;font-size:15px;font-weight:800;font-family:\'Space Grotesk\',monospace;">' + bldgCount + '</span></div>'
    + '<button ' + (bldgCount === 0 ? "disabled" : ('onclick="_dvShowKeyBuildings(' + JSON.stringify(areaName).replace(/"/g, "&quot;") + ')"')) + ' style="width:100%;background:linear-gradient(135deg,#D4AF37,#A07D1C);border:none;border-radius:7px;padding:9px;color:#070B14;font-weight:700;font-size:11px;cursor:pointer;margin-bottom:6px;' + (bldgCount === 0 ? "opacity:.4;" : "") + '">📍 Show Key Buildings on Map</button>'
    + '<button onclick="_dvExploreArea(' + JSON.stringify(areaName).replace(/"/g, "&quot;") + ')" style="width:100%;background:transparent;border:1px solid rgba(212,175,55,0.3);border-radius:7px;padding:9px;color:#D4AF37;font-weight:700;font-size:11px;cursor:pointer;">Explore in Smart Discovery →</button>'
    + '</div>';

  if (metroS) {
    html += '<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#8899AA;margin-bottom:10px;">'
      + '<span style="color:#818CF8;">⊙</span> Nearest Metro: <b style="color:#FFFFFF;">' + metroS.metroName + '</b> (' + metroS.metroDist + 'km)</div>';
  }

  if (landmarks.length) {
    html += '<div style="color:#6B7A9E;font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Notable Landmarks Nearby</div>'
      + '<div style="margin-bottom:12px;">';
    landmarks.forEach(function(p) {
      html += '<div style="display:flex;justify-content:space-between;font-size:11px;color:#9BA8C8;margin-bottom:4px;">'
        + '<span>' + (_DV_POI_ICON[p.cat] || "📍") + ' ' + p.n + '</span>'
        + '<span style="color:#6B7A9E;">' + p.dist.toFixed(1) + 'km</span></div>';
    });
    html += '</div>';
  }

  html += '<div style="color:#6B7A9E;font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Nearby Essentials</div>'
    + '<div id="' + amId + '"><div style="color:#556677;font-size:11px;">Loading live data…</div></div>';

  _dvFetchAreaAmenities(areaName, amId);
  _dvFetchAreaSize(areaName, sizeId);
  return html;
}

// ── Tier 2 panel content — clicked a BUILDING marker ───────────────────────
// Every figure here comes from the same real valuation-engine functions the
// Analyzer uses (estimateBldgUnits/estimateBuildingYield/
// estimateRentalDemandScore) — nothing on this panel is fabricated.
function _dvBuildingInfoHtml(name, bData, aData, areaName) {
  var display = _dvTitleCase(name);
  var grade = bData.g || "—";
  var gradeColor = _DV_GRADE_COLOR[bData.g] || "#8899AA";
  var units = (typeof estimateBldgUnits === "function") ? estimateBldgUnits(name, bData, false) : null;
  var yieldEst = (typeof estimateBuildingYield === "function") ? estimateBuildingYield(bData, aData, bData.p) : null;
  var rentVel = (typeof getRentalVelocity === "function") ? getRentalVelocity(areaName) : null;
  var demand = (typeof estimateRentalDemandScore === "function") ? estimateRentalDemandScore(bData, aData, bData.p, units, rentVel, areaName) : null;

  var html = '<div style="color:#D4AF37;font-size:15px;font-weight:800;font-family:\'Space Grotesk\',monospace;margin-bottom:8px;">' + display + '</div>'
    + '<div style="margin-bottom:14px;"><span style="background:' + gradeColor + '22;color:' + gradeColor + ';font-size:10px;font-weight:800;padding:3px 8px;border-radius:6px;">' + grade + ' GRADE</span>'
    + ' <span style="color:#6B7A9E;font-size:10px;margin-left:6px;">' + areaName + '</span></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'
    + _dvStatBox("Price / sqft", "AED " + Math.round(bData.p || 0).toLocaleString(), "#D4A843")
    + _dvStatBox("Service Charge", "AED " + Math.round(bData.sc || 0) + "/sqft", "#F0A030")
    + (yieldEst ? _dvStatBox("Est. Gross Yield", yieldEst.gross.toFixed(1) + "%", "#10B981") : "")
    + (units ? _dvStatBox("Est. Units", units.toLocaleString(), "#3B82F6") : "")
    + '</div>'
    + '<div style="color:#6B7A9E;font-size:10px;margin-bottom:12px;">Typical unit sizes run ~750–1,600 sqft (1BR–3BR) in most Dubai towers — exact unit mix varies by building.</div>';

  if (demand) {
    var dColor = demand.score >= 60 ? "#10B981" : demand.score >= 40 ? "#F0A030" : "#F04060";
    html += '<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:12px;margin-bottom:14px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
      + '<span style="color:#8B5CF6;font-size:10px;text-transform:uppercase;letter-spacing:.06em;">Rental Demand</span>'
      + '<span style="color:' + dColor + ';font-size:12px;font-weight:800;">' + demand.tier + ' · ' + demand.score + '</span></div>';
    demand.drivers.slice(0, 3).forEach(function(d) {
      html += '<div style="font-size:10px;color:#9BA8C8;margin-bottom:3px;">' + (d.impact === "+" ? "▲ " : d.impact === "-" ? "▼ " : "· ") + d.label + '</div>';
    });
    html += '</div>';
  }

  html += '<button onclick="_dvOpenInAnalyzer(' + JSON.stringify(name).replace(/"/g, "&quot;") + ',' + JSON.stringify(areaName).replace(/"/g, "&quot;") + ')" style="width:100%;background:linear-gradient(135deg,#D4AF37,#A07D1C);border:none;border-radius:7px;padding:10px;color:#070B14;font-weight:700;font-size:11px;cursor:pointer;">Full Analysis in Analyzer →</button>';
  return html;
}

// Prefills the Analyzer entry form with the building + area (never a fake
// valuation — size/price still need the user's own input, same as anywhere
// else in the app) and switches to it.
function _dvOpenInAnalyzer(buildingKey, areaName) {
  window.analyzerState = {stage:0, mode:"valuation", f:{area:areaName, propCategory:"", aptSubtype:"", beds:"", bathrooms:"", hasMaid:false, floor:"", view:"Not specified", size:"", furnished:"Unfurnished", parking:"1", serviceCharge:"", price:"", villaType:"", cluster:"", floors:"", plotSize:"", buaSize:"", privatePool:false, singleRow:false, cornerVilla:false, building:_dvTitleCase(buildingKey), txnType:"sale", sector:"residential", subType:"", zoning:"", purchasePrice:"", purchaseDate:""}, val:null, rentalVal:null, comVal:null, landVal:null, aiText:"", aiTextSeller:"", liveData:null, err:"", reportMode:"personal", reportFor:"buyer", smartRent:null};
  setSection("Market", "Analyzer");
}

function _dvGeocodeBuilding(name, areaName) {
  var cacheKey = "dv_geo_" + areaName + "_" + name;
  try {
    var s = sessionStorage.getItem(cacheKey);
    if (s) { var c = JSON.parse(s); return Promise.resolve(c && c.lat ? c : null); }
  } catch (e) {}
  var address = _dvTitleCase(name) + ", " + areaName;
  return fetch("/api/proxy-maps?action=geocode&address=" + encodeURIComponent(address))
    .then(function(r) { return r.json(); })
    .then(function(d) { try { sessionStorage.setItem(cacheKey, JSON.stringify(d)); } catch (e) {} return (d && d.lat) ? d : null; })
    .catch(function() { return null; });
}

function _dvClearBuildingMarkers() {
  _dvMapState.buildingMarkers.forEach(function(m) { google.maps.event.clearInstanceListeners(m); m.setMap(null); });
  _dvMapState.buildingMarkers = [];
}

function _dvRenderGradeLegend(gmap) {
  if (_dvMapState.legendEl) { _dvMapState.legendEl.parentNode && _dvMapState.legendEl.remove(); }
  var legDiv = document.createElement("div");
  legDiv.style.cssText = "background:rgba(13,18,32,0.92);border:1px solid #1C2540;border-radius:10px;padding:10px 12px;margin:0 10px 10px;min-width:140px;";
  var title = document.createElement("div");
  title.style.cssText = "color:#D4AF37;font-size:9px;font-weight:700;font-family:'Space Grotesk',monospace;letter-spacing:.08em;margin-bottom:8px;";
  title.textContent = "BUILDING GRADE";
  legDiv.appendChild(title);
  ["Ultra", "A+", "A", "A-", "B+", "B", "C"].forEach(function(g) {
    var row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:6px;font-size:9px;color:#8899AA;font-family:'Space Grotesk',monospace;margin-bottom:3px;";
    row.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:' + _DV_GRADE_COLOR[g] + ';display:inline-block;flex-shrink:0;"></span>' + g;
    legDiv.appendChild(row);
  });
  gmap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].clear();
  gmap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legDiv);
  _dvMapState.legendEl = legDiv;
}

function _dvRenderBackControl(areaName, count) {
  var gmap = _dvMapState.gmap;
  if (!gmap) return;
  var ctrl = document.createElement("div");
  ctrl.style.cssText = "background:#0D1220;border:1px solid #1C2540;border-radius:20px;padding:7px 14px;margin:10px;color:#D4AF37;font-size:11px;font-weight:700;font-family:'Space Grotesk',monospace;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.3);white-space:nowrap;";
  ctrl.textContent = "← Back to Areas · " + count + " buildings in " + areaName;
  ctrl.onclick = function() { _dvBackToAreas(); };
  gmap.controls[google.maps.ControlPosition.TOP_LEFT].clear();
  gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(ctrl);
  _dvMapState.backControlEl = ctrl;
}
function _dvRemoveBackControl() {
  var gmap = _dvMapState.gmap;
  if (!gmap) return;
  gmap.controls[google.maps.ControlPosition.TOP_LEFT].clear();
  _dvMapState.backControlEl = null;
}

// Explicit, click-driven transition into "Building Tier" for one area —
// never automatic on zoom/pan, so a user is never shown data they didn't
// ask for. Geocodes only the area's top ~12 key buildings (not every
// building in the DB, which would be hundreds of live API calls) and caches
// results in sessionStorage so revisiting the same area/building is free.
function _dvShowKeyBuildings(areaName) {
  var gmap = _dvMapState.gmap;
  if (!gmap) return;
  var bldgs = _dvAreaKeyBuildings(areaName, _DV_KEY_BUILDINGS_LIMIT);
  if (!bldgs.length) return;

  _dvMapState.tier = "building";
  _dvMapState.focusArea = areaName;
  _dvClearOverlays();
  _dvClearBuildingMarkers();
  _dvShowPanel('<div style="color:#8899AA;font-size:12px;">Locating ' + bldgs.length + ' key buildings in ' + areaName + '…</div>');

  Promise.all(bldgs.map(function(b) {
    return _dvGeocodeBuilding(b.name, areaName).then(function(loc) {
      return loc ? Object.assign({}, b, {lat: loc.lat, lng: loc.lng}) : null;
    });
  })).then(function(results) {
    if (_dvMapState.tier !== "building" || _dvMapState.focusArea !== areaName) return; // user navigated away meanwhile
    var located = results.filter(function(r) { return r && r.lat; });
    _dvHidePanel();
    if (!located.length) { _dvShowPanel('<div style="color:#8899AA;font-size:12px;">Could not locate buildings on the map for this area right now.</div>'); return; }
    var bounds = new google.maps.LatLngBounds();
    located.forEach(function(b) {
      var color = _DV_GRADE_COLOR[b.g] || "#8899AA";
      var mk = new google.maps.Marker({
        map: gmap, position: {lat: b.lat, lng: b.lng},
        icon: {path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: color, fillOpacity: 0.95, strokeColor: "#ffffff", strokeWeight: 2},
        title: _dvTitleCase(b.name) + " (" + (b.g || "—") + " grade)", zIndex: 15
      });
      mk.addListener("mouseover", function() { mk.setIcon({path: google.maps.SymbolPath.CIRCLE, scale: 11, fillColor: color, fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3}); });
      mk.addListener("mouseout", function() { mk.setIcon({path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: color, fillOpacity: 0.95, strokeColor: "#ffffff", strokeWeight: 2}); });
      mk.addListener("click", function() { _dvShowPanel(_dvBuildingInfoHtml(b.name, b, AREAS[areaName], areaName)); });
      _dvMapState.buildingMarkers.push(mk);
      bounds.extend({lat: b.lat, lng: b.lng});
    });
    gmap.fitBounds(bounds, 80);
    google.maps.event.addListenerOnce(gmap, "idle", function() { if (gmap.getZoom() > 17) gmap.setZoom(17); });
    _dvRenderGradeLegend(gmap);
    _dvRenderBackControl(areaName, located.length);
  });
}

// Explicit exit from Building Tier back to the normal area-marker view.
function _dvBackToAreas() {
  _dvClearBuildingMarkers();
  _dvHidePanel();
  _dvRemoveBackControl();
  _dvMapState.tier = "area";
  _dvMapState.focusArea = null;
  var gmap = _dvMapState.gmap;
  if (gmap) _dvRenderAreaMarkers(gmap, _dvMapState.areaPoints, _dvMapState.metric);
}

// Deep-links into Find → Smart Property Discovery pre-filtered to the
// clicked area — setSection() renders synchronously, so FIND_STATE is
// guaranteed initialized (via renderFind()'s own lazy init) by the time we
// set .sf.area below.
function _dvExploreArea(areaName) {
  setSection("Market", "Find");
  if (!window.FIND_STATE) {
    window.FIND_STATE = {area:"",building:"",beds:"2 BR",maxPrice:"",minYield:"",type:"Apartment",query:"",results:[],loading:false,searched:false,sort:"score",
      sf:{area:"",grade:"",minYield:"",maxPSF:"",minPSF:"",minGrowth:"",maxDOM:"",minTurnover:"",type:"Apartment",beds:"Any",sort:"yield",showResults:false,results:[],allResults:[],page:0,mapView:false}};
  }
  window.FIND_STATE.sf.area = areaName;
  render();
}

// ── Level-of-detail grouping ─────────────────────────────────────────────
// At low zoom, 280+ individual area markers packed across all of Dubai are
// too fine-grained to read/click reliably. Groups areas within _DV_CLUSTER_PX
// screen pixels of each other into one virtual site (averaged position +
// averaged metric value) at low zoom; splits into full per-area resolution
// as the user zooms in — the same clustering technique session 11f built.
var _DV_CLUSTER_PX = 46;
var _DV_CLUSTER_MAX_ZOOM = 13; // above this zoom, always show full resolution

function _dvProjectToPixel(gmap, lat, lng) {
  var proj = gmap.getProjection();
  if (!proj) return null;
  var scale = Math.pow(2, gmap.getZoom());
  var pt = proj.fromLatLngToPoint(new google.maps.LatLng(lat, lng));
  return {x: pt.x * scale, y: pt.y * scale};
}

function _dvGroupForZoom(gmap, points) {
  var zoom = gmap.getZoom();
  if (zoom >= _DV_CLUSTER_MAX_ZOOM) return points.map(function(p){ return {lat:p.lat, lng:p.lng, val:p.val, members:[p]}; });
  var pts = points.map(function(p) {
    var px = _dvProjectToPixel(gmap, p.lat, p.lng);
    return {p:p, x: px?px.x:0, y: px?px.y:0, used:false};
  });
  var groups = [];
  for (var i = 0; i < pts.length; i++) {
    if (pts[i].used) continue;
    pts[i].used = true;
    var members = [pts[i].p];
    for (var j = i + 1; j < pts.length; j++) {
      if (pts[j].used) continue;
      var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < _DV_CLUSTER_PX) { members.push(pts[j].p); pts[j].used = true; }
    }
    var avgLat = members.reduce(function(s,m){return s+m.lat;},0) / members.length;
    var avgLng = members.reduce(function(s,m){return s+m.lng;},0) / members.length;
    var avgVal = members.reduce(function(s,m){return s+m.val;},0) / members.length;
    groups.push({lat:avgLat, lng:avgLng, val:avgVal, members:members});
  }
  return groups;
}

function _dvMarkerScaleForZoom(zoom) {
  return zoom >= 15 ? 11 : zoom >= 13 ? 9 : zoom >= 11 ? 8 : 7;
}

// Renders one colored point marker per area (or per cluster of nearby areas
// at low zoom) for the current metric + zoom level — Dubai's own real
// streets/communities/buildings stay fully visible underneath, since a
// marker's footprint is a small dot, never an area-covering shape. Torn down
// and rebuilt on every zoom/pan tick so the level-of-detail grouping always
// matches the current view.
function _dvRenderAreaMarkers(gmap, points, metric) {
  _dvClearOverlays();
  var cfg = DV_MAP_METRICS[metric];
  var groups = _dvGroupForZoom(gmap, points);
  if (!groups.length) return;

  var vals = groups.map(function(g){ return g.val; });
  var vMin = Math.min.apply(null, vals), vMax = Math.max.apply(null, vals);
  _dvMapState.legendMin = vMin;
  _dvMapState.legendMax = vMax;
  var scale = _dvMarkerScaleForZoom(gmap.getZoom());

  groups.forEach(function(g) {
    var ratio = vMax > vMin ? (g.val - vMin) / (vMax - vMin) : 0.5;
    var color = _dvMetricColor(ratio, cfg.polarity);
    var isCluster = g.members.length > 1;

    if (isCluster) {
      var clusterMk = new google.maps.Marker({
        map: gmap, position: {lat:g.lat, lng:g.lng},
        icon: {path: google.maps.SymbolPath.CIRCLE, scale: scale + 7, fillColor: "#D4AF37", fillOpacity: 0.95, strokeColor: "#ffffff", strokeWeight: 2},
        label: {text: String(g.members.length), color: "#070B14", fontWeight: "800", fontSize: "11px"},
        title: g.members.length + " areas — click to zoom in",
        zIndex: 20
      });
      clusterMk.addListener("click", function() {
        var bounds = new google.maps.LatLngBounds();
        g.members.forEach(function(m) { bounds.extend({lat:m.lat, lng:m.lng}); });
        var zoomBefore = gmap.getZoom();
        gmap.fitBounds(bounds, 60);
        google.maps.event.addListenerOnce(gmap, "idle", function() { if (gmap.getZoom() <= zoomBefore) gmap.setZoom(zoomBefore + 3); });
      });
      _dvMapState.overlays.push(clusterMk);
    } else {
      var m = g.members[0];
      var mk = new google.maps.Marker({
        map: gmap, position: {lat:m.lat, lng:m.lng},
        icon: {path: google.maps.SymbolPath.CIRCLE, scale: scale, fillColor: color, fillOpacity: 0.92, strokeColor: "#ffffff", strokeWeight: 2},
        title: m.name, zIndex: 10
      });
      // Popups open ONLY on click — hover just enlarges the marker via a
      // plain setIcon() call, never touching the InfoWindow, so there is no
      // auto-pan risk (the bug that made the 11q/11r polygon layer scroll
      // the map on its own). The browser's native title tooltip already
      // gives the area name on hover for free.
      mk.addListener("mouseover", function() { mk.setIcon({path: google.maps.SymbolPath.CIRCLE, scale: scale + 3, fillColor: color, fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3}); });
      mk.addListener("mouseout", function() { mk.setIcon({path: google.maps.SymbolPath.CIRCLE, scale: scale, fillColor: color, fillOpacity: 0.92, strokeColor: "#ffffff", strokeWeight: 2}); });
      mk.addListener("click", function() { _dvShowPanel(_dvAreaInfoHtml(m.name, AREAS[m.name])); });
      _dvMapState.overlays.push(mk);
    }
  });

  _dvRenderLegend(gmap, cfg, vMin, vMax);
}

function _dvRenderLegend(gmap, cfg, vMin, vMax) {
  if (_dvMapState.legendEl) { _dvMapState.legendEl.parentNode && _dvMapState.legendEl.remove(); }
  var legDiv = document.createElement("div");
  legDiv.style.cssText = "background:rgba(13,18,32,0.92);border:1px solid #1C2540;border-radius:10px;padding:10px 12px;margin:0 10px 10px;min-width:160px;";
  var title = document.createElement("div");
  title.style.cssText = "color:#D4AF37;font-size:9px;font-weight:700;font-family:'Space Grotesk',monospace;letter-spacing:.08em;margin-bottom:8px;";
  title.textContent = cfg.label.toUpperCase();
  legDiv.appendChild(title);

  var bar = document.createElement("div");
  var lo = cfg.polarity === "good-low" ? "120" : cfg.polarity === "neutral" ? "45" : "0";
  var hi = cfg.polarity === "good-low" ? "0" : cfg.polarity === "neutral" ? "210" : "120";
  var gradSat = cfg.polarity === "neutral" ? "65%,52%" : "68%,48%";
  bar.style.cssText = "height:8px;border-radius:4px;margin-bottom:6px;background:linear-gradient(90deg,hsl(" + lo + "," + gradSat + "),hsl(" + hi + "," + gradSat + "));";
  legDiv.appendChild(bar);

  var labelsRow = document.createElement("div");
  labelsRow.style.cssText = "display:flex;justify-content:space-between;margin-bottom:6px;";
  var lowLabel = document.createElement("span");
  lowLabel.style.cssText = "color:#8899AA;font-size:9px;font-family:'Space Grotesk',monospace;";
  lowLabel.textContent = cfg.fmt(cfg.polarity === "good-low" ? vMax : vMin);
  var highLabel = document.createElement("span");
  highLabel.style.cssText = "color:#8899AA;font-size:9px;font-family:'Space Grotesk',monospace;";
  highLabel.textContent = cfg.fmt(cfg.polarity === "good-low" ? vMin : vMax);
  labelsRow.appendChild(lowLabel); labelsRow.appendChild(highLabel);
  legDiv.appendChild(labelsRow);

  var qualRow = document.createElement("div");
  qualRow.style.cssText = "display:flex;justify-content:space-between;font-size:8px;color:#556677;font-family:'Space Grotesk',monospace;";
  if (cfg.polarity !== "neutral") {
    qualRow.innerHTML = "<span>WEAKER</span><span>STRONGER</span>";
    legDiv.appendChild(qualRow);
  }

  if (window.METRO_STATIONS || window.TRAM_STATIONS) {
    var metroLegend = document.createElement("div");
    metroLegend.style.cssText = "display:flex;align-items:center;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid #1C2540;";
    metroLegend.innerHTML = '<div style="width:8px;height:8px;border-radius:50%;background:#818CF8;flex-shrink:0;"></div><span style="color:#8899AA;font-size:9px;font-family:\'Space Grotesk\',monospace;">Metro / Tram</span>';
    legDiv.appendChild(metroLegend);
  }

  gmap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].clear();
  gmap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legDiv);
  _dvMapState.legendEl = legDiv;
}

function renderMap() {
  var cl = C();
  // Every fresh render starts back in Area Tier — switching metric/tab
  // tears down the whole gmap instance below, so any stale Building Tier
  // state (focused area, building markers) from before would otherwise
  // point at overlays that no longer exist.
  _dvMapState.tier = "area";
  _dvMapState.focusArea = null;
  var wrap = div({padding:"0", maxWidth:"100%", margin:"0", display:"flex", flexDirection:"column", height:"calc(100vh - 130px)"});
  var mapTs = new Date().getTime();
  var mapId = "dv-gmap-" + mapTs;

  var controls = div({background:cl.surface, borderBottom:"1px solid "+cl.border, padding:"10px 16px", display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap"});
  controls.appendChild(span({color:cl.gold, fontSize:"10px", letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:"'Space Grotesk',monospace", whiteSpace:"nowrap"}, "◆ Interactive Map"));
  var metricOpts = [
    {v:"invest",   l:"Investment Score"},
    {v:"growth",   l:"Growth"},
    {v:"yield",    l:"Yield"},
    {v:"price",    l:"Price Level"},
    {v:"liquidity",l:"Liquidity"},
    {v:"turnover", l:"Turnover"},
    {v:"location", l:"Location"}
  ];
  metricOpts.forEach(function(opt) {
    var active = _dvMapState.metric === opt.v;
    var b = el("button", {style:{background:active?cl.goldFaint:"transparent", border:"1px solid "+(active?cl.goldDim:cl.border), color:active?cl.gold:cl.sub, padding:"5px 12px", borderRadius:"16px", fontSize:"11px", fontFamily:"'Space Grotesk',monospace", fontWeight:active?"700":"400", cursor:"pointer"}, onclick:function(){_dvMapState.metric=opt.v; render();}}, opt.l);
    controls.appendChild(b);
  });
  // Real search — Google Places Autocomplete (wired up after the map loads,
  // below). Directly answers the user's explicit "قابلیت پیدا کردن و سرچ
  // کردن" requirement — search an area, building name, or landmark and the
  // map recenters/zooms straight to it.
  var searchInput = el("input", {type:"text", id:mapId+"-search", placeholder:"🔍 Search area, building, landmark…", autocomplete:"off", style:{marginLeft:"auto", minWidth:"220px", maxWidth:"280px", background:cl.raisedSolid||cl.surface, border:"1px solid "+cl.border, borderRadius:"8px", padding:"7px 12px", color:cl.text||cl.white, fontSize:"12px", fontFamily:"'Inter',sans-serif", outline:"none"}});
  controls.appendChild(searchInput);
  wrap.appendChild(controls);

  if (!document.getElementById("dv-gmap-styles")) {
    var styleEl = document.createElement("style");
    styleEl.id = "dv-gmap-styles";
    styleEl.textContent = ".gm-style .gm-style-iw-c{background:#0D1220!important;border:1px solid #1C2540!important;border-radius:10px!important;padding:0!important;box-shadow:0 4px 24px rgba(0,0,0,.7)!important}.gm-style .gm-style-iw-d{overflow:hidden!important;padding:0!important}.gm-style-iw-t::after,.gm-style-iw-tc::after{background:#1C2540!important}.gm-ui-hover-effect>span{background:#6B7A9E!important}.gm-style .gm-style-iw-chr{padding:4px 4px 0!important}.gm-style .gm-style-iw-ch{padding:0!important}.pac-container{font-family:'Inter',sans-serif!important;border-radius:8px!important;margin-top:4px!important}";
    document.head.appendChild(styleEl);
  }

  var mapArea = div({position:"relative", flex:"1", width:"100%", minHeight:"300px", display:"flex"});
  var mapEl = el("div", {style:{flex:"1", width:"100%", minHeight:"300px"}, id:mapId});
  mapArea.appendChild(mapEl);
  // Docked info panel — replaces the old floating InfoWindow popup for
  // area/building content (see _dvShowPanel). Absolutely positioned over
  // the map so it never needs to trigger a Google Maps resize event.
  var panelEl = el("div", {id: mapId+"-panel", style:{
    position:"absolute", top:"10px", right:"10px", bottom:"10px",
    width:"340px", maxWidth:"92vw", overflowY:"auto",
    background: cl.surfaceSolid||cl.surface, border:"1px solid "+cl.border,
    borderRadius:"14px", boxShadow:"0 8px 30px rgba(0,0,0,0.35)",
    display:"none", zIndex:"5"
  }});
  mapArea.appendChild(panelEl);
  wrap.appendChild(mapArea);

  setTimeout(function() {
    var container = document.getElementById(mapId);
    if (!container) return;
    _dvGmapLoad(function() {
      var c2 = document.getElementById(mapId);
      if (!c2) return;

      _dvMapCleanup();

      var gmap = new google.maps.Map(c2, {
        center: {lat:25.15, lng:55.22},
        zoom: 11,
        styles: _GMAP_LIGHT_STYLES,
        zoomControl: true,
        zoomControlOptions: {position: google.maps.ControlPosition.RIGHT_TOP},
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy"
      });

      _dvMapState.gmap = gmap;
      _dvMapState.panelEl = document.getElementById(mapId + "-panel");
      var infoWin = new google.maps.InfoWindow();
      var cfg = DV_MAP_METRICS[_dvMapState.metric];

      var searchEl = document.getElementById(mapId + "-search");
      if (searchEl && google.maps.places) {
        var dubaiBounds = new google.maps.LatLngBounds({lat:24.75, lng:54.85}, {lat:25.45, lng:55.65});
        var autocomplete = new google.maps.places.Autocomplete(searchEl, {
          bounds: dubaiBounds,
          componentRestrictions: {country: "ae"},
          fields: ["geometry", "name"]
        });
        autocomplete.addListener("place_changed", function() {
          var place = autocomplete.getPlace();
          if (!place || !place.geometry || !place.geometry.location) return;
          if (place.geometry.viewport) gmap.fitBounds(place.geometry.viewport);
          else { gmap.setCenter(place.geometry.location); gmap.setZoom(15); }
        });
      }

      var points = [];
      AREA_NAMES.forEach(function(name) {
        var coords = AREA_COORDS[name]; if (!coords) return;
        var aData = AREAS[name]; if (!aData) return;
        var dLat = coords[0] - _DV_MAP_ORIGIN.lat, dLng = coords[1] - _DV_MAP_ORIGIN.lng;
        var distKm = Math.sqrt(Math.pow(dLat*111, 2) + Math.pow(dLng*101, 2)); // rough km at this latitude
        if (distKm > _DV_OUTLIER_KM) return; // outliers get their own always-solo marker below
        var val = cfg.getVal(aData, name);
        points.push({name:name, lat:coords[0], lng:coords[1], val:val});
      });
      _dvMapState.areaPoints = points;

      _dvRenderAreaMarkers(gmap, points, _dvMapState.metric);
      gmap.addListener("zoom_changed", function() { if (_dvMapState.tier === "area") _dvRenderAreaMarkers(gmap, points, _dvMapState.metric); });
      gmap.addListener("idle", function() { if (_dvMapState.tier === "area") _dvRenderAreaMarkers(gmap, points, _dvMapState.metric); });

      // Genuine geographic outliers (currently just Hatta) — always its own
      // marker, no clustering pass needed since it has no nearby neighbors.
      AREA_NAMES.forEach(function(name) {
        var coords = AREA_COORDS[name]; if (!coords) return;
        var aData = AREAS[name]; if (!aData) return;
        var dLat = coords[0] - _DV_MAP_ORIGIN.lat, dLng = coords[1] - _DV_MAP_ORIGIN.lng;
        var distKm = Math.sqrt(Math.pow(dLat*111, 2) + Math.pow(dLng*101, 2));
        if (distKm <= _DV_OUTLIER_KM) return;
        var color = _dvMetricColor(0.5, cfg.polarity);
        var mk = new google.maps.Marker({
          map: gmap, position: {lat:coords[0], lng:coords[1]},
          icon: {path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: color, fillOpacity: 0.95, strokeColor: "#ffffff", strokeWeight: 1.5},
          title: name + " (outlying area)"
        });
        mk.addListener("click", function() { _dvShowPanel(_dvAreaInfoHtml(name, aData)); });
        _dvMapState.overlays.push(mk);
      });

      if (_dvMapState.metric === "location") {
        if (window.METRO_STATIONS) {
          METRO_STATIONS.forEach(function(s) {
            var mk = new google.maps.Marker({
              map: gmap,
              position: {lat:s.lat, lng:s.lng},
              icon: {path:google.maps.SymbolPath.CIRCLE, scale:5, fillColor:"#818CF8", fillOpacity:1, strokeColor:"#ffffff", strokeWeight:1.5},
              title: s.n, zIndex: 50
            });
            mk.addListener("click", function() {
              infoWin.setContent('<div style="font-family:\'Space Grotesk\',monospace;color:#FFFFFF;padding:8px 10px;font-size:11px;"><span style="color:#818CF8;">M</span> <b>'+s.n+'</b><br><span style="color:#6B7A9E;">'+s.line+' Line</span></div>');
              infoWin.open(gmap, mk);
            });
            _dvMapState.overlays.push(mk);
          });
        }
        if (window.TRAM_STATIONS) {
          TRAM_STATIONS.forEach(function(s) {
            var mk = new google.maps.Marker({
              map: gmap,
              position: {lat:s.lat, lng:s.lng},
              icon: {path:google.maps.SymbolPath.CIRCLE, scale:4, fillColor:"#D4A843", fillOpacity:1, strokeColor:"#ffffff", strokeWeight:1.5},
              title: s.n, zIndex: 50
            });
            mk.addListener("click", function() {
              infoWin.setContent('<div style="font-family:\'Space Grotesk\',monospace;color:#FFFFFF;padding:8px 10px;font-size:11px;"><span style="color:#D4A843;">T</span> <b>'+s.n+'</b><br><span style="color:#6B7A9E;">Dubai Tram</span></div>');
              infoWin.open(gmap, mk);
            });
            _dvMapState.overlays.push(mk);
          });
        }
      }
    }, function() {
      var c3 = document.getElementById(mapId);
      if (!c3) return;
      c3.style.cssText = "flex:1;width:100%;min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;";
      c3.innerHTML = '<div style="font-size:36px;opacity:0.4">🗺️</div>'
        + '<div style="color:#EF4444;font-size:13px;font-weight:600;font-family:Space Grotesk,monospace">Map unavailable</div>'
        + '<div style="color:#556677;font-size:11px;font-family:Inter,sans-serif;text-align:center;max-width:240px;line-height:1.5">Google Maps API could not be loaded.<br>Check your connection and try again.</div>';
    });
  }, 80);

  return wrap;
}
