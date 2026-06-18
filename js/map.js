// --- MAP TAB -----------------------------------------------------------------
var _dvMapState={metric:"growth",map:null};
function renderMap(){
  if(_dvMapState.map){try{_dvMapState.map.remove();}catch(e){}_dvMapState.map=null;}
  var cl=C();
  var wrap=div({padding:"0",maxWidth:"100%",margin:"0",display:"flex",flexDirection:"column",height:"calc(100vh - 130px)"});
  var controls=div({background:cl.surface,borderBottom:"1px solid "+cl.border,padding:"10px 16px",display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"});
  controls.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",whiteSpace:"nowrap"},"◆ Interactive Map"));
  var metricOpts=[{v:"growth",l:"Growth"},{v:"yield",l:"Yield"},{v:"price",l:"Price Level"},{v:"liquidity",l:"Liquidity"},{v:"turnover",l:"Turnover"},{v:"location",l:"📍 Location"}];
  metricOpts.forEach(function(opt){
    var active=_dvMapState.metric===opt.v;
    var b=el("button",{style:{background:active?cl.goldFaint:"transparent",border:"1px solid "+(active?cl.goldDim:cl.border),color:active?cl.gold:cl.sub,padding:"5px 12px",borderRadius:"16px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",fontWeight:active?"700":"400",cursor:"pointer"},onclick:function(){_dvMapState.metric=opt.v;render();}},opt.l);
    controls.appendChild(b);
  });
  wrap.appendChild(controls);
  var mapId="dv-leaflet-map";
  var mapEl=el("div",{style:{flex:"1",width:"100%",minHeight:"300px"},id:mapId});
  wrap.appendChild(mapEl);
  var legend=div({position:"absolute",bottom:"30px",right:"10px",zIndex:"1000",background:cl.surface+"E8",border:"1px solid "+cl.border,borderRadius:"10px",padding:"10px 12px",pointerEvents:"none"});
  var metricLabel={growth:"3yr Capital Growth",yield:"Net Yield",price:"Price (AED/sqft)",liquidity:"Days on Market",turnover:"Turnover Rate",location:"Location Score"}[_dvMapState.metric];
  legend.appendChild(span({color:cl.gold,fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em",display:"block",marginBottom:"6px"},metricLabel));
  var legendColors=_dvMapState.metric==="liquidity"?[{c:"#00C896",l:"Fast (<30d)"},{c:"#F0A030",l:"Moderate"},{c:"#F04060",l:"Slow (>80d)"}]:_dvMapState.metric==="price"?[{c:"#D4A843",l:"Premium"},{c:"#818CF8",l:"Mid-range"},{c:"#00C896",l:"Affordable"}]:_dvMapState.metric==="location"?[{c:"#00C896",l:"Prime (8-10)"},{c:"#F0A030",l:"Good (5-7)"},{c:"#F04060",l:"Remote (1-4)"},{c:"#818CF8",l:"🚇 Metro"}]:[{c:"#00C896",l:"High"},{c:"#F0A030",l:"Medium"},{c:"#F04060",l:"Low"}];
  legendColors.forEach(function(lc){
    var row=div({display:"flex",alignItems:"center",gap:"6px",marginBottom:"3px"});
    row.appendChild(div({width:"10px",height:"10px",borderRadius:"50%",background:lc.c,flexShrink:"0"}));
    row.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},lc.l));
    legend.appendChild(row);
  });
  setTimeout(function(){
    var container=document.getElementById(mapId);
    if(!container||!window.L)return;
    var map=L.map(mapId,{zoomControl:false,attributionControl:false}).setView([25.15,55.22],11);
    L.control.zoom({position:"topright"}).addTo(map);
    L.control.attribution({position:"bottomleft",prefix:false}).addAttribution('© <a href="https://osm.org">OSM</a>').addTo(map);
    var isDark=darkMode;
    L.tileLayer(isDark?"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png":"https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{maxZoom:18,subdomains:"abcd"}).addTo(map);
    _dvMapState.map=map;
    function getVal(aData,metric,areaName){
      if(metric==="growth")return(aData.g&&aData.g[1])||10;
      if(metric==="yield"){var y=aData.y||[5,7];return(y[0]+y[1])/2;}
      if(metric==="price")return aData.psf||1500;
      if(metric==="liquidity")return aData.dom||60;
      if(metric==="turnover")return aData.txVol||100;
      if(metric==="location"){var gs=computeGeoScore(areaName);return gs?gs.locationScore:3;}
      return 0;
    }
    var vals=AREA_NAMES.map(function(n){return getVal(AREAS[n],_dvMapState.metric,n);});
    var vMin=Math.min.apply(null,vals),vMax=Math.max.apply(null,vals);
    function metricColor(val,metric){
      var ratio=vMax>vMin?(val-vMin)/(vMax-vMin):0.5;
      if(metric==="liquidity"){ratio=1-ratio;} // lower DOM = better
      if(metric==="price"){
        if(ratio>0.7)return"#D4A843";if(ratio>0.35)return"#818CF8";return"#00C896";
      }
      var r,g,b;
      if(ratio>=0.6){r=Math.round(40+(1-ratio)*300);g=200;b=Math.round(80+ratio*70);}
      else if(ratio>=0.3){r=Math.round(200+ratio*100);g=Math.round(160+ratio*60);b=48;}
      else{r=240;g=Math.round(ratio*200);b=Math.round(60+ratio*40);}
      return"rgb("+r+","+g+","+b+")";
    }
    AREA_NAMES.forEach(function(name){
      var coords=AREA_COORDS[name];if(!coords)return;
      var aData=AREAS[name];if(!aData)return;
      var val=getVal(aData,_dvMapState.metric,name);
      var color=metricColor(val,_dvMapState.metric);
      var txVol=aData.txVol||100;
      var radius=Math.max(6,Math.min(22,Math.sqrt(txVol/10)*2.5));
      var marker=L.circleMarker(coords,{radius:radius,fillColor:color,color:color,weight:1.5,opacity:0.9,fillOpacity:0.55});
      var gr=aData.g||[10,18,28];var yi=aData.y||[5,7];
      var geoS=computeGeoScore(name);
      var geoLine=geoS?'<div style="margin-top:6px;padding-top:6px;border-top:1px solid #1C2540;font-size:10px;"><span style="color:#818CF8;">🚇 '+geoS.metroName+'</span> <b>'+geoS.metroDist+'km</b> · <span style="color:#D4A843;">Location '+geoS.locationScore+'/10</span></div>':'';
      var popupContent='<div style="font-family:Space Grotesk,monospace;min-width:200px;color:#E8EDF5;background:#0D1220;border-radius:8px;padding:12px;border:1px solid #1C2540;">'
        +'<div style="color:#D4A843;font-size:12px;font-weight:700;margin-bottom:8px;">'+name+'</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">'
        +'<div><span style="color:#6B7A9E;">PSF</span><br><b>AED '+aData.psf.toLocaleString()+'</b></div>'
        +'<div><span style="color:#6B7A9E;">SC</span><br><b>AED '+(aData.sc||15)+'</b></div>'
        +'<div><span style="color:#6B7A9E;">Yield</span><br><b style="color:#00C896;">'+yi[0]+'-'+yi[1]+'%</b></div>'
        +'<div><span style="color:#6B7A9E;">Growth 3yr</span><br><b style="color:#00C896;">+'+gr[1]+'%</b></div>'
        +'<div><span style="color:#6B7A9E;">DOM</span><br><b>'+(aData.dom||"—")+'d</b></div>'
        +'<div><span style="color:#6B7A9E;">Transactions</span><br><b>'+(aData.txVol||"—")+'/yr</b></div>'
        +'</div>'
        +'<div style="margin-top:8px;padding-top:8px;border-top:1px solid #1C2540;font-size:10px;color:#6B7A9E;">'
        +'Rent: Studio '+(aData.r1?Math.round(aData.r1*0.65).toLocaleString():"—")+' · 1BR '+(aData.r1?aData.r1.toLocaleString():"—")+' · 2BR '+(aData.r2?aData.r2.toLocaleString():"—")
        +'</div>'+geoLine+'</div>';
      marker.bindPopup(popupContent,{className:"dv-popup",maxWidth:280,closeButton:true});
      marker.on("mouseover",function(){this.setStyle({fillOpacity:0.9,weight:3});this.openPopup();});
      marker.on("mouseout",function(){this.setStyle({fillOpacity:0.55,weight:1.5});});
      marker.addTo(map);
    });
    // Draw metro/tram stations when location metric is active
    if(_dvMapState.metric==="location"){
      var metroIcon=L.divIcon({html:'<div style="width:8px;height:8px;background:#818CF8;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px #818CF8;"></div>',className:"",iconSize:[12,12],iconAnchor:[6,6]});
      METRO_STATIONS.forEach(function(s){
        var m=L.marker([s.lat,s.lng],{icon:metroIcon});
        m.bindPopup('<div style="font-family:Space Grotesk,monospace;color:#E8EDF5;background:#0D1220;border-radius:6px;padding:8px 10px;border:1px solid #1C2540;font-size:11px;"><span style="color:#818CF8;">🚇</span> <b>'+s.n+'</b><br><span style="color:#6B7A9E;">'+s.line+' Line</span></div>',{className:"dv-popup",closeButton:false});
        m.addTo(map);
      });
      TRAM_STATIONS.forEach(function(s){
        var m=L.marker([s.lat,s.lng],{icon:L.divIcon({html:'<div style="width:6px;height:6px;background:#D4A843;border:1.5px solid #fff;border-radius:50%;"></div>',className:"",iconSize:[9,9],iconAnchor:[4,4]})});
        m.bindPopup('<div style="font-family:Space Grotesk,monospace;color:#E8EDF5;background:#0D1220;border-radius:6px;padding:8px 10px;border:1px solid #1C2540;font-size:11px;"><span style="color:#D4A843;">🚃</span> <b>'+s.n+'</b><br><span style="color:#6B7A9E;">Dubai Tram</span></div>',{className:"dv-popup",closeButton:false});
        m.addTo(map);
      });
    }
    var legEl=legend.cloneNode(true);legEl.style.position="absolute";legEl.style.bottom="30px";legEl.style.right="10px";legEl.style.zIndex="1000";
    container.style.position="relative";container.appendChild(legEl);
  },80);
  return wrap;
}

