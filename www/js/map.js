// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- MAP TAB (Google Maps) ---------------------------------------------------
var _dvMapState = {metric: "growth", gmap: null, overlays: [], clusterMarkers: []};

// Every render (including a plain metric-toggle click) previously built a
// brand-new google.maps.Map + up to 347 Circle overlays without tearing down
// the previous set — each overlay keeps its own listeners + closures alive
// via the Maps API's internal event bus even after its DOM container is
// discarded, so repeated toggles leaked whole map instances. Tear down
// whatever the last render created before building the next one.
function _dvMapCleanup() {
  _dvClearClusterMarkers();
  if (_dvMapState.overlays.length) {
    _dvMapState.overlays.forEach(function(o) {
      google.maps.event.clearInstanceListeners(o);
      o.setMap(null);
    });
    _dvMapState.overlays = [];
  }
  if (_dvMapState.gmap) {
    google.maps.event.clearInstanceListeners(_dvMapState.gmap);
    _dvMapState.gmap = null;
  }
}

// Lighter-weight teardown for just the marker/cluster layer, re-run on every
// zoom/pan tick (see _dvRenderAreaClusters below) — must NOT touch the
// circles or the map instance itself, only the interactive pins on top.
function _dvClearClusterMarkers() {
  _dvMapState.clusterMarkers.forEach(function(m) {
    google.maps.event.clearInstanceListeners(m);
    m.setMap(null);
  });
  _dvMapState.clusterMarkers = [];
}

// ── Area marker/cluster layer ────────────────────────────────────────────────
// WHY THIS EXISTS: the colored Circle overlays below are anchored to real
// lat/lng centroids with a radius in REAL-WORLD METERS. Two such circles that
// overlap do so by the exact same proportion at every zoom level, because the
// gap between their centers and each radius both scale by the identical
// pixels-per-meter factor as you zoom — zooming in NEVER separates them. With
// ~250 area centroids on the map — many of them adjacent sub-communities only
// a few hundred meters apart (Al Barsha First/Second/Third, Warsan
// First-Fourth, the Al Quoz/Jebel Ali industrial splits, etc.) — that made
// large parts of the map permanently unclickable, at any zoom. This layer
// puts the actual interactive hit-target on fixed-PIXEL-size markers instead,
// which DO spread apart as you zoom in (distance in screen pixels grows with
// zoom; marker size doesn't) — the same technique every map product with
// dense point data uses (marker clustering). Nearby markers merge into a
// single numbered cluster bubble; clicking one zooms in until it splits.
var _DV_CLUSTER_PX = 46;

function _dvProjectToPixel(gmap, lat, lng) {
  var proj = gmap.getProjection();
  if (!proj) return null;
  var scale = Math.pow(2, gmap.getZoom());
  var pt = proj.fromLatLngToPoint(new google.maps.LatLng(lat, lng));
  return {x: pt.x * scale, y: pt.y * scale};
}
function _dvPixelToLatLng(gmap, x, y) {
  var proj = gmap.getProjection();
  var scale = Math.pow(2, gmap.getZoom());
  var latLng = proj.fromPointToLatLng(new google.maps.Point(x / scale, y / scale));
  return {lat: latLng.lat(), lng: latLng.lng()};
}

// Simple greedy single-link clustering in screen-space pixels. O(n^2) but
// n is ~250 (one entry per tracked area), so this is sub-millisecond.
function _dvClusterAreaPoints(gmap, areaPoints) {
  var pts = areaPoints.map(function(p) {
    var px = _dvProjectToPixel(gmap, p.lat, p.lng);
    return {p: p, x: px ? px.x : 0, y: px ? px.y : 0, used: false};
  });
  var clusters = [];
  for (var i = 0; i < pts.length; i++) {
    if (pts[i].used) continue;
    pts[i].used = true;
    var group = [pts[i].p], sumX = pts[i].x, sumY = pts[i].y, count = 1;
    for (var j = i + 1; j < pts.length; j++) {
      if (pts[j].used) continue;
      var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < _DV_CLUSTER_PX) {
        group.push(pts[j].p);
        pts[j].used = true;
        sumX += pts[j].x; sumY += pts[j].y; count++;
      }
    }
    clusters.push({areas: group, cx: sumX / count, cy: sumY / count});
  }
  return clusters;
}

function _dvRenderAreaClusters(gmap, infoWin, areaPoints) {
  if (!gmap.getProjection()) return; // not ready yet — the next 'idle' retries
  _dvClearClusterMarkers();
  var clusters = _dvClusterAreaPoints(gmap, areaPoints);

  clusters.forEach(function(cl) {
    if (cl.areas.length === 1) {
      var a = cl.areas[0];
      var pin = new google.maps.Marker({
        map: gmap,
        position: {lat: a.lat, lng: a.lng},
        icon: {path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: a.color, fillOpacity: 0.95,
          strokeColor: "#ffffff", strokeWeight: 1.5},
        title: a.name,
        zIndex: 10
      });
      pin.addListener("mouseover", function() {
        infoWin.setContent(a.popupHtml);
        infoWin.setPosition({lat: a.lat, lng: a.lng});
        infoWin.open(gmap);
      });
      pin.addListener("click", function() {
        infoWin.setContent(a.popupHtml);
        infoWin.setPosition({lat: a.lat, lng: a.lng});
        infoWin.open(gmap);
      });
      _dvMapState.clusterMarkers.push(pin);
    } else {
      var centerLatLng = _dvPixelToLatLng(gmap, cl.cx, cl.cy);
      var count = cl.areas.length;
      var bubbleScale = Math.min(22, 11 + Math.sqrt(count) * 2.5);
      var bubble = new google.maps.Marker({
        map: gmap,
        position: centerLatLng,
        icon: {path: google.maps.SymbolPath.CIRCLE, scale: bubbleScale, fillColor: "#D4AF37", fillOpacity: 0.92,
          strokeColor: "#070B14", strokeWeight: 2},
        label: {text: String(count), color: "#070B14", fontSize: "11px", fontWeight: "700", fontFamily: "'Space Grotesk',monospace"},
        title: count + " areas — click to zoom in",
        zIndex: 20
      });
      bubble.addListener("mouseover", function() {
        var names = cl.areas.slice(0, 8).map(function(a){return a.name;}).join("<br>");
        var more = count > 8 ? "<br>+" + (count - 8) + " more" : "";
        infoWin.setContent('<div style="font-family:\'Inter\',sans-serif;color:#FFFFFF;padding:8px 10px;font-size:11px;line-height:1.6;max-width:180px;"><b style="color:#D4AF37;">' + count + ' areas</b><br>' + names + more + '</div>');
        infoWin.setPosition(centerLatLng);
        infoWin.open(gmap);
      });
      bubble.addListener("click", function() {
        var bounds = new google.maps.LatLngBounds();
        cl.areas.forEach(function(a) { bounds.extend({lat: a.lat, lng: a.lng}); });
        var zoomBefore = gmap.getZoom();
        gmap.fitBounds(bounds, 60);
        google.maps.event.addListenerOnce(gmap, "idle", function() {
          if (gmap.getZoom() <= zoomBefore) gmap.setZoom(zoomBefore + 3);
        });
      });
      _dvMapState.clusterMarkers.push(bubble);
    }
  });
}

var _GMAP_DARK_STYLES = [
  {elementType:"geometry",stylers:[{color:"#070B14"}]},
  {elementType:"labels.text.fill",stylers:[{color:"#6B7A9E"}]},
  {elementType:"labels.text.stroke",stylers:[{color:"#070B14"}]},
  {featureType:"administrative",elementType:"geometry",stylers:[{color:"#1C2540"}]},
  {featureType:"administrative.country",elementType:"labels.text.fill",stylers:[{color:"#8899AA"}]},
  {featureType:"administrative.locality",elementType:"labels.text.fill",stylers:[{color:"#D4AF37"}]},
  {featureType:"poi",stylers:[{visibility:"off"}]},
  {featureType:"road",elementType:"geometry",stylers:[{color:"#0D1220"}]},
  {featureType:"road",elementType:"geometry.stroke",stylers:[{color:"#1C2540"}]},
  {featureType:"road",elementType:"labels.text.fill",stylers:[{color:"#556677"}]},
  {featureType:"road.highway",elementType:"geometry",stylers:[{color:"#1A2440"}]},
  {featureType:"road.highway",elementType:"geometry.stroke",stylers:[{color:"#1C2540"}]},
  {featureType:"road.highway",elementType:"labels.text.fill",stylers:[{color:"#8899AA"}]},
  {featureType:"transit",stylers:[{visibility:"off"}]},
  {featureType:"water",elementType:"geometry",stylers:[{color:"#0A0F1E"}]},
  {featureType:"water",elementType:"labels.text.fill",stylers:[{color:"#445566"}]}
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
      s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(d.key) + "&callback=_dvGmapReady";
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

// Builds a metric-specific popup — each overlay shows its own relevant data
function _mapPopupHtml(name, aData, metric, geoS) {
  var psf    = aData.psf || 0;
  var sc     = aData.sc  || 15;
  var gr     = aData.g   || [3, 9, 16];
  var yi     = aData.y   || [5, 7];
  var dom    = aData.dom || 60;
  var txVol  = aData.txVol || 100;
  var r1     = aData.r1  || 0;
  var r2     = aData.r2  || 0;
  var psfFmt = psf ? psf.toLocaleString() : "—";

  var hdr = '<div style="font-family:\'Space Grotesk\',monospace;min-width:220px;color:#FFFFFF;padding:12px;">'
    + '<div style="color:#D4AF37;font-size:12px;font-weight:700;margin-bottom:10px;">' + name + '</div>';

  var footer = '</div>';

  var metroRow = geoS
    ? '<div style="margin-top:6px;padding-top:6px;border-top:1px solid #1C2540;font-size:10px;color:#6B7A9E;">'
      + '<span style="color:#818CF8;">⊙ ' + geoS.metroName + '</span>'
      + ' <b style="color:#FFFFFF;">' + geoS.metroDist + 'km</b>'
      + ' · <span style="color:#D4A843;">Location ' + geoS.locationScore + '/10</span></div>'
    : '';

  // ── GROWTH ──────────────────────────────────────────────────────────────────
  if (metric === "growth") {
    return hdr
      + '<div style="background:rgba(0,200,150,0.08);border:1px solid rgba(0,200,150,0.2);border-radius:8px;padding:10px;margin-bottom:8px;">'
      + '<div style="color:#6B7A9E;font-size:9px;letter-spacing:.08em;margin-bottom:6px;">CAPITAL GROWTH</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;text-align:center;">'
      + '<div><div style="color:#00C896;font-size:16px;font-weight:800;">+' + gr[0] + '%</div><div style="color:#6B7A9E;font-size:9px;">1 yr</div></div>'
      + '<div><div style="color:#00C896;font-size:16px;font-weight:800;">+' + gr[1] + '%</div><div style="color:#6B7A9E;font-size:9px;">3 yr</div></div>'
      + '<div><div style="color:#00C896;font-size:16px;font-weight:800;">+' + gr[2] + '%</div><div style="color:#6B7A9E;font-size:9px;">5 yr</div></div>'
      + '</div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">'
      + '<div><span style="color:#6B7A9E;">PSF</span><br><b>AED ' + psfFmt + '</b></div>'
      + '<div><span style="color:#6B7A9E;">Yield</span><br><b style="color:#00C896;">' + yi[0] + '–' + yi[1] + '%</b></div>'
      + '</div>'
      + metroRow + footer;
  }

  // ── YIELD ────────────────────────────────────────────────────────────────────
  if (metric === "yield") {
    var netY = ((yi[0] + yi[1]) / 2 * 0.82).toFixed(1);
    var studioRent = r1 ? Math.round(r1 * 0.6).toLocaleString() : "—";
    var r1Fmt = r1 ? r1.toLocaleString() : "—";
    var r2Fmt = r2 ? r2.toLocaleString() : "—";
    return hdr
      + '<div style="background:rgba(0,200,150,0.08);border:1px solid rgba(0,200,150,0.2);border-radius:8px;padding:10px;margin-bottom:8px;">'
      + '<div style="color:#6B7A9E;font-size:9px;letter-spacing:.08em;margin-bottom:6px;">RENTAL YIELD</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:center;">'
      + '<div><div style="color:#00C896;font-size:18px;font-weight:800;">' + yi[0] + '–' + yi[1] + '%</div><div style="color:#6B7A9E;font-size:9px;">Gross Yield</div></div>'
      + '<div><div style="color:#D4A843;font-size:18px;font-weight:800;">~' + netY + '%</div><div style="color:#6B7A9E;font-size:9px;">Net Yield</div></div>'
      + '</div></div>'
      + '<div style="color:#6B7A9E;font-size:9px;letter-spacing:.06em;margin-bottom:5px;">ANNUAL RENT BENCHMARK</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:10px;margin-bottom:8px;text-align:center;">'
      + '<div><div style="color:#FFFFFF;font-weight:700;">AED ' + studioRent + '</div><div style="color:#6B7A9E;font-size:9px;">Studio</div></div>'
      + '<div><div style="color:#FFFFFF;font-weight:700;">AED ' + r1Fmt + '</div><div style="color:#6B7A9E;font-size:9px;">1 BR</div></div>'
      + '<div><div style="color:#FFFFFF;font-weight:700;">AED ' + r2Fmt + '</div><div style="color:#6B7A9E;font-size:9px;">2 BR</div></div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">'
      + '<div><span style="color:#6B7A9E;">PSF</span><br><b>AED ' + psfFmt + '</b></div>'
      + '<div><span style="color:#6B7A9E;">SC/sqft/yr</span><br><b>AED ' + sc + '</b></div>'
      + '</div>'
      + metroRow + footer;
  }

  // ── PRICE ────────────────────────────────────────────────────────────────────
  if (metric === "price") {
    var DXB_AVG = 1800;
    var vsPct   = psf ? Math.round(((psf - DXB_AVG) / DXB_AVG) * 100) : 0;
    var vsStr   = vsPct >= 0 ? "+" + vsPct + "% vs Dubai avg" : vsPct + "% vs Dubai avg";
    var vsColor = vsPct >= 0 ? "#F59E0B" : "#00C896";
    var tier    = psf > 2500 ? "Premium" : psf > 1500 ? "Mid-Range" : "Affordable";
    var tierClr = psf > 2500 ? "#D4A843" : psf > 1500 ? "#818CF8" : "#00C896";
    return hdr
      + '<div style="background:rgba(212,168,67,0.08);border:1px solid rgba(212,168,67,0.2);border-radius:8px;padding:10px;margin-bottom:8px;">'
      + '<div style="color:#6B7A9E;font-size:9px;letter-spacing:.08em;margin-bottom:6px;">PRICE LEVEL</div>'
      + '<div style="text-align:center;">'
      + '<div style="color:#D4A843;font-size:22px;font-weight:800;">AED ' + psfFmt + '</div>'
      + '<div style="color:#6B7A9E;font-size:9px;margin-bottom:6px;">per sqft</div>'
      + '<span style="color:' + tierClr + ';background:rgba(0,0,0,0.4);padding:2px 10px;border-radius:12px;font-size:10px;font-weight:700;">' + tier + '</span>'
      + '  <span style="color:' + vsColor + ';font-size:10px;font-weight:600;">' + vsStr + '</span>'
      + '</div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:11px;">'
      + '<div><span style="color:#6B7A9E;">SC/yr</span><br><b>AED ' + sc + '</b></div>'
      + '<div><span style="color:#6B7A9E;">Yield</span><br><b style="color:#00C896;">' + yi[0] + '–' + yi[1] + '%</b></div>'
      + '<div><span style="color:#6B7A9E;">Growth 3yr</span><br><b style="color:#00C896;">+' + gr[1] + '%</b></div>'
      + '</div>'
      + metroRow + footer;
  }

  // ── LIQUIDITY ────────────────────────────────────────────────────────────────
  if (metric === "liquidity") {
    var domTier  = dom < 30 ? "Fast" : dom < 60 ? "Moderate" : "Slow";
    var domColor = dom < 30 ? "#00C896" : dom < 60 ? "#F0A030" : "#EF4444";
    var actLvl   = txVol > 200 ? "High" : txVol > 100 ? "Medium" : "Low";
    return hdr
      + '<div style="background:rgba(129,140,248,0.08);border:1px solid rgba(129,140,248,0.2);border-radius:8px;padding:10px;margin-bottom:8px;">'
      + '<div style="color:#6B7A9E;font-size:9px;letter-spacing:.08em;margin-bottom:6px;">MARKET LIQUIDITY</div>'
      + '<div style="text-align:center;">'
      + '<div style="color:' + domColor + ';font-size:26px;font-weight:800;">' + dom + '<span style="font-size:14px;">d</span></div>'
      + '<div style="color:#6B7A9E;font-size:9px;margin-bottom:6px;">Avg Days on Market</div>'
      + '<span style="color:' + domColor + ';background:rgba(0,0,0,0.4);padding:2px 10px;border-radius:12px;font-size:10px;font-weight:700;">' + domTier + ' Market</span>'
      + '</div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">'
      + '<div><span style="color:#6B7A9E;">Txn/yr</span><br><b>' + txVol + '</b></div>'
      + '<div><span style="color:#6B7A9E;">Activity</span><br><b>' + actLvl + '</b></div>'
      + '<div><span style="color:#6B7A9E;">PSF</span><br><b>AED ' + psfFmt + '</b></div>'
      + '<div><span style="color:#6B7A9E;">Yield</span><br><b style="color:#00C896;">' + yi[0] + '–' + yi[1] + '%</b></div>'
      + '</div>'
      + metroRow + footer;
  }

  // ── TURNOVER ─────────────────────────────────────────────────────────────────
  if (metric === "turnover") {
    var actLvl2  = txVol > 300 ? "Very High" : txVol > 150 ? "High" : txVol > 75 ? "Medium" : "Low";
    var actClr2  = txVol > 300 ? "#00C896"   : txVol > 150 ? "#D4A843" : txVol > 75 ? "#F59E0B" : "#6B7A9E";
    var mktSpeed = dom < 30 ? "Fast" : dom < 60 ? "Normal" : "Slow";
    return hdr
      + '<div style="background:rgba(212,168,67,0.06);border:1px solid rgba(212,168,67,0.2);border-radius:8px;padding:10px;margin-bottom:8px;">'
      + '<div style="color:#6B7A9E;font-size:9px;letter-spacing:.08em;margin-bottom:6px;">TRANSACTION VOLUME</div>'
      + '<div style="text-align:center;">'
      + '<div style="color:' + actClr2 + ';font-size:30px;font-weight:800;">' + txVol + '</div>'
      + '<div style="color:#6B7A9E;font-size:9px;margin-bottom:6px;">transactions / year</div>'
      + '<span style="color:' + actClr2 + ';background:rgba(0,0,0,0.4);padding:2px 10px;border-radius:12px;font-size:10px;font-weight:700;">' + actLvl2 + ' Activity</span>'
      + '</div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">'
      + '<div><span style="color:#6B7A9E;">DOM</span><br><b>' + dom + 'd</b></div>'
      + '<div><span style="color:#6B7A9E;">Speed</span><br><b>' + mktSpeed + '</b></div>'
      + '<div><span style="color:#6B7A9E;">PSF</span><br><b>AED ' + psfFmt + '</b></div>'
      + '<div><span style="color:#6B7A9E;">Growth 3yr</span><br><b style="color:#00C896;">+' + gr[1] + '%</b></div>'
      + '</div>'
      + metroRow + footer;
  }

  // ── LOCATION ─────────────────────────────────────────────────────────────────
  if (metric === "location") {
    var locScore = geoS ? geoS.locationScore : 5;
    var locTier  = locScore >= 8 ? "Prime" : locScore >= 6 ? "Good" : locScore >= 4 ? "Fair" : "Remote";
    var locClr   = locScore >= 8 ? "#00C896" : locScore >= 6 ? "#D4A843" : locScore >= 4 ? "#F59E0B" : "#EF4444";
    var stars    = "";
    for (var si = 0; si < 5; si++) stars += si < Math.round(locScore / 2) ? "★" : "☆";
    return hdr
      + '<div style="background:rgba(129,140,248,0.08);border:1px solid rgba(129,140,248,0.2);border-radius:8px;padding:10px;margin-bottom:8px;">'
      + '<div style="color:#6B7A9E;font-size:9px;letter-spacing:.08em;margin-bottom:6px;">LOCATION SCORE</div>'
      + '<div style="text-align:center;">'
      + '<div style="color:' + locClr + ';font-size:32px;font-weight:800;">' + locScore + '<span style="font-size:16px;color:#6B7A9E;">/10</span></div>'
      + '<div style="color:' + locClr + ';font-size:14px;margin:2px 0;">' + stars + '</div>'
      + '<span style="color:' + locClr + ';background:rgba(0,0,0,0.4);padding:2px 10px;border-radius:12px;font-size:10px;font-weight:700;margin-top:4px;display:inline-block;">' + locTier + '</span>'
      + '</div></div>'
      + (geoS
        ? '<div style="background:rgba(129,140,248,0.06);border-radius:6px;padding:8px;margin-bottom:8px;font-size:10px;">'
          + '<div style="color:#6B7A9E;font-size:9px;margin-bottom:3px;">NEAREST METRO</div>'
          + '<div style="color:#818CF8;font-weight:700;">' + geoS.metroName + '</div>'
          + '<div style="color:#8899AA;">' + geoS.metroDist + ' km'
            + (geoS.line ? ' · ' + geoS.line + ' Line' : '') + '</div>'
          + '</div>'
        : '')
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">'
      + '<div><span style="color:#6B7A9E;">PSF</span><br><b>AED ' + psfFmt + '</b></div>'
      + '<div><span style="color:#6B7A9E;">Yield</span><br><b style="color:#00C896;">' + yi[0] + '–' + yi[1] + '%</b></div>'
      + '</div>'
      + footer;
  }

  // Fallback
  return hdr
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">'
    + '<div><span style="color:#6B7A9E;">PSF</span><br><b>AED ' + psfFmt + '</b></div>'
    + '<div><span style="color:#6B7A9E;">SC</span><br><b>AED ' + sc + '</b></div>'
    + '<div><span style="color:#6B7A9E;">Yield</span><br><b style="color:#00C896;">' + yi[0] + '–' + yi[1] + '%</b></div>'
    + '<div><span style="color:#6B7A9E;">Growth 3yr</span><br><b style="color:#00C896;">+' + gr[1] + '%</b></div>'
    + '<div><span style="color:#6B7A9E;">DOM</span><br><b>' + dom + 'd</b></div>'
    + '<div><span style="color:#6B7A9E;">Txn/yr</span><br><b>' + txVol + '</b></div>'
    + '</div>'
    + metroRow + footer;
}

function renderMap() {
  var cl = C();
  var wrap = div({padding:"0", maxWidth:"100%", margin:"0", display:"flex", flexDirection:"column", height:"calc(100vh - 130px)"});

  var controls = div({background:cl.surface, borderBottom:"1px solid "+cl.border, padding:"10px 16px", display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap"});
  controls.appendChild(span({color:cl.gold, fontSize:"10px", letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:"'Space Grotesk',monospace", whiteSpace:"nowrap"}, "◆ Interactive Map"));
  var metricOpts = [
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
  wrap.appendChild(controls);

  if (!document.getElementById("dv-gmap-styles")) {
    var styleEl = document.createElement("style");
    styleEl.id = "dv-gmap-styles";
    styleEl.textContent = ".gm-style .gm-style-iw-c{background:#0D1220!important;border:1px solid #1C2540!important;border-radius:10px!important;padding:0!important;box-shadow:0 4px 24px rgba(0,0,0,.7)!important}.gm-style .gm-style-iw-d{overflow:hidden!important;padding:0!important}.gm-style-iw-t::after,.gm-style-iw-tc::after{background:#1C2540!important}.gm-ui-hover-effect>span{background:#6B7A9E!important}.gm-style .gm-style-iw-chr{padding:4px 4px 0!important}.gm-style .gm-style-iw-ch{padding:0!important}";
    document.head.appendChild(styleEl);
  }

  var mapTs = new Date().getTime();
  var mapId = "dv-gmap-" + mapTs;
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
        styles: _GMAP_DARK_STYLES,
        zoomControl: true,
        zoomControlOptions: {position: google.maps.ControlPosition.RIGHT_TOP},
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy"
      });

      _dvMapState.gmap = gmap;
      var infoWin = new google.maps.InfoWindow();

      function getVal(aData, metric, areaName) {
        if (metric==="growth")    return (aData.g&&aData.g[1])||10;
        if (metric==="yield")     { var y=aData.y||[5,7]; return (y[0]+y[1])/2; }
        if (metric==="price")     return aData.psf||1500;
        if (metric==="liquidity") return aData.dom||60;
        if (metric==="turnover")  return aData.txVol||100;
        if (metric==="location")  { var gs=computeGeoScore(areaName); return gs?gs.locationScore:3; }
        return 0;
      }

      var vals = AREA_NAMES.map(function(n){ return getVal(AREAS[n]||{}, _dvMapState.metric, n); });
      var vMin = Math.min.apply(null, vals), vMax = Math.max.apply(null, vals);

      function metricColor(val, metric) {
        var ratio = vMax>vMin ? (val-vMin)/(vMax-vMin) : 0.5;
        if (metric==="liquidity") ratio = 1-ratio;
        if (metric==="price") {
          if (ratio>0.7) return "#D4A843";
          if (ratio>0.35) return "#818CF8";
          return "#00C896";
        }
        var r,g,b;
        if (ratio>=0.6) { r=Math.round(40+(1-ratio)*300); g=200; b=Math.round(80+ratio*70); }
        else if (ratio>=0.3) { r=Math.round(200+ratio*100); g=Math.round(160+ratio*60); b=48; }
        else { r=240; g=Math.round(ratio*200); b=Math.round(60+ratio*40); }
        return "rgb("+r+","+g+","+b+")";
      }

      var areaPoints = [];

      AREA_NAMES.forEach(function(name) {
        var coords = AREA_COORDS[name]; if (!coords) return;
        var aData  = AREAS[name];       if (!aData)  return;
        var val    = getVal(aData, _dvMapState.metric, name);
        var color  = metricColor(val, _dvMapState.metric);
        var txVol  = aData.txVol || 100;
        var radiusM = Math.max(250, Math.min(750, Math.sqrt(txVol)*20));
        var geoS   = computeGeoScore(name);

        // Each overlay gets its own tailored popup
        var popupHtml = _mapPopupHtml(name, aData, _dvMapState.metric, geoS);

        // Background heat-visualization layer only — NOT the interactive hit
        // target (see the big comment above _dvRenderAreaClusters for why real-
        // world-radius circles can never be reliably clickable once areas are
        // this dense). Purely decorative now: no hover/click listeners.
        var circle = new google.maps.Circle({
          map: gmap,
          center: {lat:coords[0], lng:coords[1]},
          radius: radiusM,
          strokeColor: color,
          strokeOpacity: 0.55,
          strokeWeight: 1,
          fillColor: color,
          fillOpacity: 0.18,
          clickable: false
        });
        _dvMapState.overlays.push(circle);

        areaPoints.push({name:name, lat:coords[0], lng:coords[1], color:color, popupHtml:popupHtml});
      });

      // Interactive layer: fixed-pixel-size pins that cluster when close
      // together on screen and split apart as the user zooms in.
      _dvRenderAreaClusters(gmap, infoWin, areaPoints);
      gmap.addListener("zoom_changed", function() { _dvRenderAreaClusters(gmap, infoWin, areaPoints); });
      gmap.addListener("idle", function() { _dvRenderAreaClusters(gmap, infoWin, areaPoints); });

      if (_dvMapState.metric === "location") {
        if (window.METRO_STATIONS) {
          METRO_STATIONS.forEach(function(s) {
            var mk = new google.maps.Marker({
              map: gmap,
              position: {lat:s.lat, lng:s.lng},
              icon: {path:google.maps.SymbolPath.CIRCLE, scale:5, fillColor:"#818CF8", fillOpacity:1, strokeColor:"#ffffff", strokeWeight:1.5},
              title: s.n
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
              title: s.n
            });
            mk.addListener("click", function() {
              infoWin.setContent('<div style="font-family:\'Space Grotesk\',monospace;color:#FFFFFF;padding:8px 10px;font-size:11px;"><span style="color:#D4A843;">T</span> <b>'+s.n+'</b><br><span style="color:#6B7A9E;">Dubai Tram</span></div>');
              infoWin.open(gmap, mk);
            });
            _dvMapState.overlays.push(mk);
          });
        }
      }

      var metricLabel = {
        growth:"3yr Capital Growth", yield:"Net Yield", price:"Price (AED/sqft)",
        liquidity:"Days on Market",  turnover:"Turnover Rate", location:"Location Score"
      }[_dvMapState.metric];
      var legendItems = _dvMapState.metric==="liquidity"
        ? [{c:"#00C896",l:"Fast (<30d)"},{c:"#F0A030",l:"Moderate (30–60d)"},{c:"#EF4444",l:"Slow (>60d)"}]
        : _dvMapState.metric==="price"
        ? [{c:"#D4A843",l:"Premium (>AED 2,500)"},{c:"#818CF8",l:"Mid-Range"},{c:"#00C896",l:"Affordable (<AED 1,500)"}]
        : _dvMapState.metric==="location"
        ? [{c:"#00C896",l:"Prime (8–10)"},{c:"#F0A030",l:"Good (5–7)"},{c:"#EF4444",l:"Remote (1–4)"},{c:"#818CF8",l:"Metro Station"}]
        : _dvMapState.metric==="turnover"
        ? [{c:"#00C896",l:"Very High (>300/yr)"},{c:"#D4A843",l:"High (150–300)"},{c:"#EF4444",l:"Low (<75/yr)"}]
        : [{c:"#00C896",l:"High"},{c:"#F0A030",l:"Medium"},{c:"#EF4444",l:"Low"}];

      var legDiv = document.createElement("div");
      legDiv.style.cssText = "background:rgba(13,18,32,0.92);border:1px solid #1C2540;border-radius:10px;padding:10px 12px;margin:0 10px 10px;";
      var legTitle = document.createElement("div");
      legTitle.style.cssText = "color:#D4AF37;font-size:9px;font-weight:700;font-family:'Space Grotesk',monospace;letter-spacing:.08em;margin-bottom:6px;";
      legTitle.textContent = metricLabel;
      legDiv.appendChild(legTitle);
      legendItems.forEach(function(lc) {
        var row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;gap:6px;margin-bottom:3px;";
        var dot = document.createElement("div");
        dot.style.cssText = "width:10px;height:10px;border-radius:50%;background:"+lc.c+";flex-shrink:0;";
        var lbl = document.createElement("span");
        lbl.style.cssText = "color:#8899AA;font-size:9px;font-family:'Space Grotesk',monospace;";
        lbl.textContent = lc.l;
        row.appendChild(dot);
        row.appendChild(lbl);
        legDiv.appendChild(row);
      });
      gmap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legDiv);
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
