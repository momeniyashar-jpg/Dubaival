// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- MAP TAB (Google Maps) ---------------------------------------------------
var _dvMapState = {metric: "growth"};

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

function _dvGmapLoad(cb) {
  if (window.google && window.google.maps) { cb(); return; }
  if (Array.isArray(window._dvGmapPending)) { window._dvGmapPending.push(cb); return; }
  window._dvGmapPending = [cb];
  fetch("/api/proxy-maps?action=config")
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.key) throw new Error("No key");
      window._dvGmapReady = function() {
        var cbs = window._dvGmapPending || [];
        window._dvGmapPending = null;
        cbs.forEach(function(f) { f(); });
      };
      var s = document.createElement("script");
      s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(d.key) + "&callback=_dvGmapReady";
      s.async = true;
      document.head.appendChild(s);
    })
    .catch(function() { window._dvGmapPending = null; });
}

function renderMap() {
  var cl = C();
  var wrap = div({padding:"0", maxWidth:"100%", margin:"0", display:"flex", flexDirection:"column", height:"calc(100vh - 130px)"});

  var controls = div({background:cl.surface, borderBottom:"1px solid "+cl.border, padding:"10px 16px", display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap"});
  controls.appendChild(span({color:cl.gold, fontSize:"10px", letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:"'Space Grotesk',monospace", whiteSpace:"nowrap"}, "◆ Interactive Map"));
  var metricOpts = [{v:"growth",l:"Growth"},{v:"yield",l:"Yield"},{v:"price",l:"Price Level"},{v:"liquidity",l:"Liquidity"},{v:"turnover",l:"Turnover"},{v:"location",l:"Location"}];
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

      var infoWin = new google.maps.InfoWindow();

      function getVal(aData, metric, areaName) {
        if (metric==="growth") return (aData.g&&aData.g[1])||10;
        if (metric==="yield") { var y=aData.y||[5,7]; return (y[0]+y[1])/2; }
        if (metric==="price") return aData.psf||1500;
        if (metric==="liquidity") return aData.dom||60;
        if (metric==="turnover") return aData.txVol||100;
        if (metric==="location") { var gs=computeGeoScore(areaName); return gs?gs.locationScore:3; }
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

      AREA_NAMES.forEach(function(name) {
        var coords = AREA_COORDS[name]; if (!coords) return;
        var aData = AREAS[name]; if (!aData) return;
        var val = getVal(aData, _dvMapState.metric, name);
        var color = metricColor(val, _dvMapState.metric);
        var txVol = aData.txVol||100;
        var radiusM = Math.max(250, Math.min(750, Math.sqrt(txVol)*20));
        var gr = aData.g||[3,9,16];
        var yi = aData.y||[5,7];
        var geoS = computeGeoScore(name);
        var geoLine = geoS ? '<div style="margin-top:6px;padding-top:6px;border-top:1px solid #1C2540;font-size:10px;"><span style="color:#818CF8;">'+geoS.metroName+'</span> <b>'+geoS.metroDist+'km</b> · <span style="color:#D4A843;">Location '+geoS.locationScore+'/10</span></div>' : '';

        var popupHtml = '<div style="font-family:\'Space Grotesk\',monospace;min-width:200px;color:#E8EDF5;padding:12px;">'
          +'<div style="color:#D4A843;font-size:12px;font-weight:700;margin-bottom:8px;">'+name+'</div>'
          +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">'
          +'<div><span style="color:#6B7A9E;">PSF</span><br><b>AED '+aData.psf.toLocaleString()+'</b></div>'
          +'<div><span style="color:#6B7A9E;">SC</span><br><b>AED '+(aData.sc||15)+'</b></div>'
          +'<div><span style="color:#6B7A9E;">Yield</span><br><b style="color:#00C896;">'+yi[0]+'-'+yi[1]+'%</b></div>'
          +'<div><span style="color:#6B7A9E;">Growth 3yr</span><br><b style="color:#00C896;">+'+gr[1]+'%</b></div>'
          +'<div><span style="color:#6B7A9E;">DOM</span><br><b>'+(aData.dom||"—")+'d</b></div>'
          +'<div><span style="color:#6B7A9E;">Txn/yr</span><br><b>'+(aData.txVol||"—")+'</b></div>'
          +'</div>'
          +'<div style="margin-top:8px;padding-top:8px;border-top:1px solid #1C2540;font-size:10px;color:#6B7A9E;">'
          +'Rent: Studio '+(aData.r1?Math.round(aData.r1*0.65).toLocaleString():"—")+' · 1BR '+(aData.r1?aData.r1.toLocaleString():"—")+' · 2BR '+(aData.r2?aData.r2.toLocaleString():"—")
          +'</div>'+geoLine+'</div>';

        var circle = new google.maps.Circle({
          map: gmap,
          center: {lat:coords[0], lng:coords[1]},
          radius: radiusM,
          strokeColor: color,
          strokeOpacity: 0.9,
          strokeWeight: 1.5,
          fillColor: color,
          fillOpacity: 0.45,
          clickable: true
        });

        circle.addListener("mouseover", function() {
          circle.setOptions({fillOpacity:0.8, strokeWeight:3});
          infoWin.setContent(popupHtml);
          infoWin.setPosition({lat:coords[0], lng:coords[1]});
          infoWin.open(gmap);
        });
        circle.addListener("mouseout", function() {
          circle.setOptions({fillOpacity:0.45, strokeWeight:1.5});
        });
        circle.addListener("click", function() {
          infoWin.setContent(popupHtml);
          infoWin.setPosition({lat:coords[0], lng:coords[1]});
          infoWin.open(gmap);
        });
      });

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
              infoWin.setContent('<div style="font-family:\'Space Grotesk\',monospace;color:#E8EDF5;padding:8px 10px;font-size:11px;"><span style="color:#818CF8;">M</span> <b>'+s.n+'</b><br><span style="color:#6B7A9E;">'+s.line+' Line</span></div>');
              infoWin.open(gmap, mk);
            });
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
              infoWin.setContent('<div style="font-family:\'Space Grotesk\',monospace;color:#E8EDF5;padding:8px 10px;font-size:11px;"><span style="color:#D4A843;">T</span> <b>'+s.n+'</b><br><span style="color:#6B7A9E;">Dubai Tram</span></div>');
              infoWin.open(gmap, mk);
            });
          });
        }
      }

      var metricLabel = {growth:"3yr Capital Growth",yield:"Net Yield",price:"Price (AED/sqft)",liquidity:"Days on Market",turnover:"Turnover Rate",location:"Location Score"}[_dvMapState.metric];
      var legendItems = _dvMapState.metric==="liquidity"
        ? [{c:"#00C896",l:"Fast (<30d)"},{c:"#F0A030",l:"Moderate"},{c:"#F04060",l:"Slow (>80d)"}]
        : _dvMapState.metric==="price"
        ? [{c:"#D4A843",l:"Premium"},{c:"#818CF8",l:"Mid-range"},{c:"#00C896",l:"Affordable"}]
        : _dvMapState.metric==="location"
        ? [{c:"#00C896",l:"Prime (8-10)"},{c:"#F0A030",l:"Good (5-7)"},{c:"#F04060",l:"Remote (1-4)"},{c:"#818CF8",l:"Metro"}]
        : [{c:"#00C896",l:"High"},{c:"#F0A030",l:"Medium"},{c:"#F04060",l:"Low"}];

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
    });
  }, 80);

  return wrap;
}
