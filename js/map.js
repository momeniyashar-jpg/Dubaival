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
var _dvMapState = {metric: "invest", gmap: null, overlays: [], clusterMarkers: []};

// Areas genuinely far outside Dubai's urban core (Hatta ~97km east — the next
// farthest tracked area is ~32km) get their own always-solo marker: grouping
// them into the same clustering pass as the urban core would average their
// position toward a spot roughly halfway to Dubai, which is meaningless.
var _DV_MAP_ORIGIN = {lat: 25.15, lng: 55.25};
var _DV_OUTLIER_KM = 55;

function _dvMapCleanup() {
  _dvClearOverlays();
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

// Builds a metric-specific popup, plus a shared "Explore Buildings" CTA that
// deep-links into Find → Smart Property Discovery pre-filtered to this area —
// the map becomes an entry point into real building-level analysis, not a
// dead-end visualization.
function _mapPopupHtml(name, aData, metric, geoS, val, fmtVal) {
  var psf = aData.psf || 0;
  var psfFmt = psf ? psf.toLocaleString() : "—";
  var cfg = DV_MAP_METRICS[metric];
  var metricLabel = cfg ? cfg.label : metric;
  var detailRows = cfg && cfg.detail ? cfg.detail(aData, name) : [];

  var html = '<div style="font-family:\'Space Grotesk\',monospace;min-width:230px;color:#FFFFFF;padding:12px;">'
    + '<div style="color:#D4AF37;font-size:12px;font-weight:700;margin-bottom:8px;">' + name + '</div>'
    + '<div style="background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.2);border-radius:8px;padding:10px;margin-bottom:8px;text-align:center;">'
    + '<div style="color:#6B7A9E;font-size:9px;letter-spacing:.08em;margin-bottom:4px;">' + metricLabel.toUpperCase() + '</div>'
    + '<div style="color:#D4A843;font-size:20px;font-weight:800;">' + fmtVal + '</div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:11px;margin-bottom:8px;">'
    + '<div><span style="color:#6B7A9E;">PSF</span><br><b>AED ' + psfFmt + '</b></div>';
  detailRows.forEach(function(d) {
    html += '<div><span style="color:#6B7A9E;">' + d.l + '</span><br><b>' + d.v + '</b></div>';
  });
  html += '</div>';
  if (geoS && metric !== "location") {
    html += '<div style="font-size:10px;color:#6B7A9E;margin-bottom:8px;">'
      + '<span style="color:#818CF8;">⊙ ' + geoS.metroName + '</span>'
      + ' <b style="color:#FFFFFF;">' + geoS.metroDist + 'km</b>'
      + ' · <span style="color:#D4A843;">Location ' + geoS.locationScore + '/10</span></div>';
  }
  html += '<button onclick="_dvExploreArea(' + JSON.stringify(name) + ')" style="width:100%;background:linear-gradient(135deg,#D4AF37,#A07D1C);border:none;border-radius:7px;padding:8px;color:#070B14;font-weight:700;font-size:11px;font-family:\'Space Grotesk\',monospace;cursor:pointer;">Explore Buildings in ' + name + ' →</button>'
    + '</div>';
  return html;
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
function _dvRenderAreaMarkers(gmap, infoWin, points, metric) {
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
      mk.addListener("click", function() { infoWin.setContent(m.popupHtml); infoWin.open(gmap, mk); });
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

  var mapEl = el("div", {style:{flex:"1", width:"100%", minHeight:"300px"}, id:mapId});
  wrap.appendChild(mapEl);

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
        var geoS = computeGeoScore(name);
        var fmtVal = cfg.fmt(val);
        var popupHtml = _mapPopupHtml(name, aData, _dvMapState.metric, geoS, val, fmtVal);
        points.push({name:name, lat:coords[0], lng:coords[1], val:val, popupHtml:popupHtml});
      });

      _dvRenderAreaMarkers(gmap, infoWin, points, _dvMapState.metric);
      gmap.addListener("zoom_changed", function() { _dvRenderAreaMarkers(gmap, infoWin, points, _dvMapState.metric); });
      gmap.addListener("idle", function() { _dvRenderAreaMarkers(gmap, infoWin, points, _dvMapState.metric); });

      // Genuine geographic outliers (currently just Hatta) — always its own
      // marker, no clustering pass needed since it has no nearby neighbors.
      AREA_NAMES.forEach(function(name) {
        var coords = AREA_COORDS[name]; if (!coords) return;
        var aData = AREAS[name]; if (!aData) return;
        var dLat = coords[0] - _DV_MAP_ORIGIN.lat, dLng = coords[1] - _DV_MAP_ORIGIN.lng;
        var distKm = Math.sqrt(Math.pow(dLat*111, 2) + Math.pow(dLng*101, 2));
        if (distKm <= _DV_OUTLIER_KM) return;
        var val = cfg.getVal(aData, name);
        var color = _dvMetricColor(0.5, cfg.polarity);
        var geoS = computeGeoScore(name);
        var popupHtml = _mapPopupHtml(name, aData, _dvMapState.metric, geoS, val, cfg.fmt(val));
        var mk = new google.maps.Marker({
          map: gmap, position: {lat:coords[0], lng:coords[1]},
          icon: {path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: color, fillOpacity: 0.95, strokeColor: "#ffffff", strokeWeight: 1.5},
          title: name + " (outlying area)"
        });
        mk.addListener("click", function() { infoWin.setContent(popupHtml); infoWin.open(gmap, mk); });
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
