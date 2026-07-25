// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- COMPARE TAB -------------------------------------------------------------
// _currentMonthYear() is defined in js/core.js (loads before this file) and
// shared across every AI prompt in the app that references "the current
// month" instead of a hardcoded, ever-staling literal like "June 2026".

// Resolve a "Community" (CLUSTERS key) name to its real AREAS entry — fixed
// 2026-07-18 (Compare audit): a direct exact `AREAS[v]` lookup silently
// returned `{}` (all-zero PSF/yield/growth) for 53 of the 124 CLUSTERS keys
// (~43%), most of them pure casing/formatting variants of a real AREAS key
// (e.g. "DAMAC HILLS 2" vs "DAMAC Hills 2", "TOWN SQUARE" vs "Town Square")
// or already-mapped DLD sub-community aliases — meaning comparing many
// popular villa communities silently showed "PSF: AED 0 / Yield: 0-0%" as
// if it were real data. Tries an exact match, then a case-insensitive
// match, then the existing DLD_AREA_MAP alias table (js/data-residential.js)
// — deliberately does NOT fall back to a fuzzy/substring guess beyond that,
// since a wrong-but-plausible area match would be worse than honestly
// reporting no data (same principle as `_paPickRealBuilding()` in the
// Personal Advisor rebuild returning null rather than a fabricated pick).
function _cmpResolveCluster(v){
  if(AREAS[v])return v;
  var lower=v.toLowerCase().trim();
  var found=Object.keys(AREAS).find(function(k){return k.toLowerCase().trim()===lower;});
  if(found)return found;
  var resolved=typeof resolveDLDArea==="function"?resolveDLDArea(v):v;
  if(resolved!==v&&AREAS[resolved])return resolved;
  return null;
}

// Helper: get comparison data for any item type
function _cmpItemData(item){
  var t=item.type,v=item.value;
  if(!v)return null;
  if(t==="area"){
    var a=AREAS[v]||{};
    return{label:v,type:"Area",psf:a.psf||0,yLow:a.y?a.y[0]:0,yHigh:a.y?a.y[1]:0,g1:a.g?a.g[0]:0,g3:a.g?a.g[1]:0,sc:a.sc||15,dom:a.dom||90,txVol:a.txVol||0,grade:"—"};
  }
  if(t==="cluster"){
    var realArea=_cmpResolveCluster(v);
    if(!realArea)return null;
    var a=AREAS[realArea]||{};
    var clusterList=typeof CLUSTERS!=="undefined"?CLUSTERS[v]:null;
    return{label:v,type:"Community",psf:a.psf||0,yLow:a.y?a.y[0]:0,yHigh:a.y?a.y[1]:0,g1:a.g?a.g[0]:0,g3:a.g?a.g[1]:0,sc:a.sc||15,dom:a.dom||90,txVol:a.txVol||0,grade:"Villa/TH Community",extra:clusterList?"("+clusterList.length+" sub-clusters)":"",area:realArea};
  }
  if(t==="building"){
    // Fixed 2026-07-18 (Compare audit): was an exact-key `DB[v.toLowerCase()]`
    // lookup — the same recurring bug class already fixed elsewhere this
    // session (Assets tab CSV export, Sustainability Score) — so a
    // free-typed building name with any minor variation silently showed
    // "(no data)" even when a real, fuzzy-matchable entry existed.
    // lookupBuilding() is the same matcher the rest of the app already
    // trusts for this exact purpose.
    var b=typeof lookupBuilding==="function"?lookupBuilding(v,null):(typeof DB!=="undefined"?DB[v.toLowerCase()]:null);
    if(!b)return null;
    var aData=AREAS[b.a]||{};
    // Real building-adjusted yield (scaled from the area band by this
    // building's own PSF + grade) instead of the raw area band stamped on
    // every building regardless of its actual price — see estimateBuildingYield()
    // in js/valuation.js. A tight ±8% band is shown around the point estimate
    // to keep the same "range" display shape as the Area/Community rows.
    var by=(typeof estimateBuildingYield==="function")?estimateBuildingYield(b,aData,b.p):null;
    var yMid=by?by.gross:(aData.y?(aData.y[0]+aData.y[1])/2:0);
    return{label:v,type:"Building",psf:b.p||0,psfLo:b.lo||0,psfHi:b.hi||0,sc:b.sc||aData.sc||15,yLow:Math.round(yMid*0.92*10)/10,yHigh:Math.round(yMid*1.08*10)/10,g1:aData.g?aData.g[0]:0,g3:aData.g?aData.g[1]:0,dom:aData.dom||90,grade:b.g||"N/A",area:b.a};
  }
  return null;
}

// Building search dropdown for Compare
function _cmpBuildingSearch(idx,currentVal,cl){
  var wrap=el("div",{style:{position:"relative"}});
  var inp2=el("input",{style:Object.assign({},S(),{fontSize:"12px"}),placeholder:"Type building name…",value:currentVal||""});
  var drop=el("div",{style:{position:"absolute",top:"100%",left:0,right:0,background:"#1A1F2E",border:"1px solid #2A3040",borderRadius:"8px",zIndex:200,maxHeight:"180px",overflowY:"auto",display:"none"}});
  inp2.addEventListener("input",function(){
    var q=this.value.toLowerCase().trim();
    compareState.items[idx].value=this.value;
    while(drop.firstChild)drop.removeChild(drop.firstChild);
    if(q.length<2){drop.style.display="none";return;}
    // Property Type filter — fixed 2026-07-18 (Compare audit): this field
    // was captured and sent to the AI as plain text ("Property type: Villa")
    // but never actually filtered anything, so the building search still
    // freely suggested apartment towers even with "Villa" selected. Now
    // narrows suggestions by the same VILLA_AREAS-membership convention the
    // rest of the app already uses to infer a building's type (DB entries
    // carry no direct type field). Left unfiltered for "All"/Townhouse/
    // Penthouse — VILLA_AREAS only cleanly distinguishes villa-vs-not, and a
    // Townhouse/Penthouse can genuinely live in either kind of area.
    var pt=compareState.propType;
    var wantVilla=pt==="Villa";
    var wantApt=pt==="Apartment";
    var matches=[];
    Object.keys(DB).forEach(function(k){
      if(matches.length>=8)return;
      if(!k.includes(q))return;
      var d=DB[k];
      // Per-building refinement (2026-07-18) — see isVillaBuilding() in
      // js/valuation.js (mixed villa/apartment areas like Palm Jumeirah/
      // Dubai Hills Estate).
      var _kIsVilla=typeof isVillaBuilding==="function"?isVillaBuilding(k,d.a):(typeof VILLA_AREAS!=="undefined"&&VILLA_AREAS.has(d.a));
      if(wantVilla&&!_kIsVilla)return;
      if(wantApt&&_kIsVilla)return;
      matches.push({k:k,d:d});
    });
    if(!matches.length){drop.style.display="none";return;}
    matches.forEach(function(m){
      var row=el("div",{style:{padding:"8px 12px",cursor:"pointer",fontSize:"12px",color:"#E0E0E0",fontFamily:"'Inter',sans-serif",borderBottom:"1px solid #2A3040"}});
      row.innerHTML='<span style="color:#D4AF37;font-weight:700">'+m.k.replace(/\b\w/g,function(c){return c.toUpperCase();})+'</span><span style="color:#8899AA;font-size:10px;margin-left:6px">'+m.d.a+'</span>';
      row.addEventListener("mousedown",function(e){e.preventDefault();compareState.items[idx].value=m.k.replace(/\b\w/g,function(c){return c.toUpperCase();});inp2.value=compareState.items[idx].value;drop.style.display="none";});
      drop.appendChild(row);
    });
    drop.style.display="block";
  });
  inp2.addEventListener("blur",function(){setTimeout(function(){drop.style.display="none";},150);});
  wrap.appendChild(inp2);wrap.appendChild(drop);
  return wrap;
}

function renderCompare(){
  const cl=C();const s=compareState;
  const wrap=div({padding:"20px",maxWidth:"680px",margin:"0 auto"});
  // Premium header
  var _cmpH=el('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',paddingBottom:'16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}});
  var _cmpHL=el('div',{});
  _cmpHL.appendChild(div({fontSize:'10px',color:'#6B7A9E',fontWeight:'700',fontFamily:"'Inter',sans-serif",letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:'4px'},'Side-by-Side Analysis'));
  _cmpHL.appendChild(div({fontSize:'22px',fontWeight:'800',color:cl.white,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'-0.02em',lineHeight:'1'},'Compare'));
  _cmpH.appendChild(_cmpHL);
  var _cmpBadge=el('div',{style:{display:'flex',alignItems:'center',gap:'5px',background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.20)',borderRadius:'20px',padding:'5px 11px',flexShrink:'0'}});
  _cmpBadge.appendChild(span({fontSize:'10px',color:'#3B82F6',fontFamily:"'Space Grotesk',sans-serif",fontWeight:'700',letterSpacing:'0.08em'},'AI'));
  _cmpH.appendChild(_cmpBadge);
  wrap.appendChild(_cmpH);
  const card=div({background:cl.surface,backdropFilter:cl.blur,WebkitBackdropFilter:cl.blur,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"14px",boxShadow:cl.glassShadow});

  // Comparison items
  var CLUSTER_NAMES=typeof CLUSTERS!=="undefined"?Object.keys(CLUSTERS):[];
  s.items.forEach(function(item,idx){
    var row=div({display:"flex",gap:"8px",alignItems:"flex-start",marginBottom:"10px"});
    // Type selector
    var typeW=div({flexShrink:0,width:"110px"});
    typeW.appendChild(mkSelect({width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px 10px",color:"#E0E0E0",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",outline:"none"},["area","cluster","building"].map(function(t){return t==="area"?"Area":t==="cluster"?"Community":"Building";}),item.type==="area"?"Area":item.type==="cluster"?"Community":"Building",function(v){
      compareState.items[idx].type=v==="Area"?"area":v==="Community"?"cluster":"building";
      compareState.items[idx].value="";render();
    }));
    row.appendChild(typeW);
    // Value selector
    var valW=div({flex:1,minWidth:0});
    if(item.type==="area"){
      valW.appendChild(mkSelect(Object.assign({},S(),{fontSize:"12px"}),["Select area…",...AREA_NAMES],item.value,function(v){compareState.items[idx].value=v==="Select area…"?"":v;}));
    }else if(item.type==="cluster"){
      valW.appendChild(mkSelect(Object.assign({},S(),{fontSize:"12px"}),["Select community…",...CLUSTER_NAMES],item.value,function(v){compareState.items[idx].value=v==="Select community…"?"":v;}));
    }else{
      valW.appendChild(_cmpBuildingSearch(idx,item.value,cl));
    }
    row.appendChild(valW);
    // Remove button (only if more than 2 items)
    if(s.items.length>2){
      var rmBtn=el("button",{style:{flexShrink:0,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"#EF4444",borderRadius:"8px",padding:"8px 10px",fontSize:"13px",cursor:"pointer",lineHeight:1},onclick:function(){compareState.items.splice(idx,1);render();}});
      rmBtn.textContent="×";
      row.appendChild(rmBtn);
    }
    card.appendChild(row);
  });

  // Add button
  if(s.items.length<10){
    var addBtn=el("button",{style:{display:"flex",alignItems:"center",gap:"6px",background:"transparent",border:"1px dashed #2A3040",color:cl.sub,borderRadius:"8px",padding:"7px 14px",fontSize:"12px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",marginBottom:"16px"},onclick:function(){compareState.items.push({type:"area",value:""});render();}});
    addBtn.innerHTML='<span style="font-size:16px;line-height:1">+</span> Add item';
    card.appendChild(addBtn);
  }

  // Options row
  var optRow=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"14px"});
  var bW=div({});bW.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Budget (AED)"));bW.appendChild(inp(I(),"e.g. 3,000,000","number",s.budget,function(v){compareState.budget=v;}));optRow.appendChild(bW);
  var pW=div({});pW.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Purpose"));pW.appendChild(mkSelect(S(),["Investment","End-Use","Rental Income","Capital Appreciation","Off-Plan Flip"],s.purpose,function(v){compareState.purpose=v;}));optRow.appendChild(pW);
  var ptW=div({});ptW.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Property Type"));ptW.appendChild(mkSelect(S(),["All","Apartment","Villa","Townhouse","Penthouse"],s.propType||"All",function(v){compareState.propType=v;}));optRow.appendChild(ptW);
  card.appendChild(optRow);

  if(s.err){card.appendChild(div({background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.35)",borderRadius:"8px",padding:"9px 12px",marginBottom:"10px",color:"#EF4444",fontSize:"12px",fontFamily:"'Inter',sans-serif"},s.err));}

  // Compare button
  var cmpBtn=el("button",{style:{width:"100%",background:"rgba(212,175,55,0.15)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",color:cl.gold,border:"1px solid rgba(212,175,55,0.3)",padding:"13px",borderRadius:"10px",fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:async function(){
    var filled=s.items.filter(function(it){return it.value&&it.value!=="Select area…"&&it.value!=="Select community…";});
    if(filled.length<2){compareState.err="Please select at least 2 items to compare.";render();return;}
    // Duplicate-item guard (added 2026-07-18 Compare audit) — comparing the
    // exact same area/community/building against itself twice produced a
    // real AI call for a meaningless comparison with no warning at all.
    var seenPairs={};
    var hasDup=filled.some(function(it){var k=it.type+"|"+it.value.toLowerCase().trim();if(seenPairs[k])return true;seenPairs[k]=true;return false;});
    if(hasDup){compareState.err="You've selected the same item twice — pick different areas/communities/buildings to compare.";render();return;}
    compareState.err="";compareState.loading=true;compareState.result="";render();
    try{
      var cmpAreas=[];
      var noDataCount=0;
      var lines=filled.map(function(it,i){
        var d=_cmpItemData(it);
        // Fixed 2026-07-18 (Compare audit): the old "(no data)" line gave the
        // AI zero guidance on what to do with an unresolved item — nothing in
        // the system prompt forbade it from filling the gap with a plausible-
        // sounding invented PSF/yield from its own general knowledge, exactly
        // the "AI freely invents numbers" accuracy risk already fixed
        // elsewhere this session (AI Agents, Personal Advisor). The explicit
        // "NO VERIFIED DATA" wording here is paired with a hard instruction
        // in the system prompt below never to invent figures for such a line.
        if(!d){noDataCount++;return(i+1)+". "+it.value+" — NO VERIFIED DATA (not found in our 9,434-building / 347-area database)";}
        if(d.area&&cmpAreas.indexOf(d.area)===-1)cmpAreas.push(d.area);
        var base=(i+1)+". "+d.label+" ("+d.type+(d.area?" — in "+d.area:"")+")";
        var stats=" | PSF: AED "+(d.psf||"N/A");
        if(d.psfLo)stats+=" (range "+d.psfLo+"–"+d.psfHi+")";
        stats+=" | Yield: "+d.yLow+"–"+d.yHigh+"% | 3yr growth: "+d.g3+"% | SC: "+d.sc+" AED/sqft";
        if(d.dom)stats+=" | DOM: "+d.dom+"d";
        if(d.grade&&d.grade!=="—")stats+=" | Grade: "+d.grade;
        if(d.extra)stats+=" "+d.extra;
        return base+stats;
      }).join("\n");
      var prompt="Compare these options for a Dubai buyer — "+_currentMonthYear()+":\n\n"+lines+"\n\nBudget: "+(s.budget?"AED "+parseInt(s.budget).toLocaleString():"not specified")+" | Purpose: "+s.purpose+" | Property type: "+(s.propType||"All")+"\n\nFor each option: assess Value (PSF vs quality), Income (net yield), Growth (3yr), Liquidity & Risk.\nGive a DECISIVE ranked verdict: which is #1, #2, etc. for this buyer and why. Specific AED numbers only. No fluff."+(noDataCount>0?"\n\nIMPORTANT: "+noDataCount+" item(s) above are marked NO VERIFIED DATA — for those items ONLY, state plainly that we have no verified data and you cannot rank them on hard numbers (a directional/qualitative note is fine); do NOT invent a PSF, yield, or growth figure for them.":"");
      var groundQ="Dubai real estate comparison: "+filled.map(function(it){return it.value;}).join(" vs ");
      var text=await askAI([{role:"user",content:prompt}],"You are DubAIVal AI — Dubai's top property intelligence platform with 9,434 buildings and 347 DLD-verified areas. "+_currentMonthYear()+" expert.\nRank each option clearly. Use EXACT PSF, yield, growth data from what's given above — never invent a number for an item marked NO VERIFIED DATA. Cite specific AED numbers. 1 section per option (3 sentences), then a final RANKING table.",groundQ,cmpAreas);
      compareState.result=text;
    }catch(e){compareState.result="Error: "+e.message;}
    compareState.loading=false;render();
  }});
  cmpBtn.textContent="▶ Compare "+(s.items.filter(function(it){return it.value;}).length||"")+" Items";
  card.appendChild(cmpBtn);
  wrap.appendChild(card);
  if(s.loading){wrap.appendChild(div({textAlign:"center",padding:"20px"},[div({width:"36px",height:"36px",borderRadius:"50%",border:"2px solid "+cl.border,borderTopColor:cl.gold,animation:"spin 0.8s linear infinite",margin:"0 auto"})]))}
  if(s.result&&!s.loading){
    var filledItems=s.items.filter(function(it){return it.value;});
    var resCard=div({background:cl.surface,border:"1px solid "+cl.goldDim,borderRadius:"14px",padding:"20px"});
    resCard.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"◆ "+filledItems.map(function(it){return it.value;}).join(" vs ")));
    var resText=div({color:cl.subHi,fontSize:"13.5px",lineHeight:"1.9",fontFamily:"'Inter',sans-serif",whiteSpace:"pre-wrap"});resText.textContent=s.result;resCard.appendChild(resText);wrap.appendChild(resCard);
    // Map — fixed 2026-07-18 (Compare audit): previously excluded EVERY
    // building-type item outright (`it.type!=="building"`), so comparing
    // specific buildings across different areas — the user's actual stated
    // core use case for this tab — lost the entire location/drive-time
    // dimension. Buildings don't have their own tracked lat/lng, but their
    // AREA does, so each item now resolves a `coordKey` (its own value for
    // Area, the resolved real area for Community/Building via the same
    // `_cmpResolveCluster()`/`lookupBuilding()` used above) while keeping
    // the item's own name as the display label.
    var MAP_COLORS=["#60A5FA","#34D399","#FBBF24","#F87171","#A78BFA","#FB923C","#2DD4BF","#E879F9","#4ADE80","#F472B6"];
    var mappableItems=filledItems.map(function(it){
      var coordKey=null;
      if(it.type==="area")coordKey=it.value;
      else if(it.type==="cluster")coordKey=_cmpResolveCluster(it.value);
      else if(it.type==="building"){var b=typeof lookupBuilding==="function"?lookupBuilding(it.value,null):null;coordKey=b?b.a:null;}
      return{it:it,coordKey:coordKey};
    }).filter(function(x){return x.coordKey&&typeof AREA_COORDS!=="undefined"&&AREA_COORDS[x.coordKey];});
    if(mappableItems.length>0){
      var mapCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginTop:"12px"});
      mapCard.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"10px"},"◆ Location Map & Drive Times"));
      var cmpMapId="dv-cmp-gmap-"+Date.now();
      mapCard.appendChild(el("div",{style:{width:"100%",height:"220px",borderRadius:"10px",overflow:"hidden",marginBottom:"14px"},id:cmpMapId}));
      var cols=Math.min(mappableItems.length,3);
      var dtGrid2=div({display:"grid",gridTemplateColumns:"repeat("+cols+",1fr)",gap:"8px"});
      mappableItems.forEach(function(mi2,mi){
        var it=mi2.it,coordKey=mi2.coordKey;
        var dtId="dv-cmp-dt"+mi+Date.now();
        var clr=MAP_COLORS[mi%MAP_COLORS.length];
        dtGrid2.appendChild(div({id:dtId},[span({color:clr,fontSize:"9px",fontWeight:"700",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},it.value),span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Loading…")]));
        setTimeout(function(itCopy,dtIdCopy,clrCopy,coordKeyCopy){
          fetch("/api/proxy-maps?action=distances&lat="+AREA_COORDS[coordKeyCopy][0]+"&lng="+AREA_COORDS[coordKeyCopy][1]).then(function(rr){return rr.json();}).then(function(data){
            var el2=document.getElementById(dtIdCopy);if(!el2)return;
            while(el2.firstChild)el2.removeChild(el2.firstChild);
            el2.appendChild(span({color:clrCopy,fontSize:"9px",fontWeight:"700",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},itCopy.value));
            (data.rows||[]).forEach(function(row){el2.appendChild(div({display:"flex",justifyContent:"space-between",marginBottom:"3px"},[span({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},row.label),span({color:cl.subHi,fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},row.duration)]));});
          }).catch(function(){});
        },100,it,dtId,clr,coordKey);
      });
      mapCard.appendChild(dtGrid2);wrap.appendChild(mapCard);
      setTimeout(function(){
        var c2=document.getElementById(cmpMapId);if(!c2||typeof _dvGmapLoad!=="function")return;
        _dvGmapLoad(function(){
          var c3=document.getElementById(cmpMapId);if(!c3)return;
          var coords=mappableItems.map(function(x){return AREA_COORDS[x.coordKey];});
          var cLat=coords.reduce(function(s,c){return s+c[0];},0)/coords.length;
          var cLng=coords.reduce(function(s,c){return s+c[1];},0)/coords.length;
          var gm=new google.maps.Map(c3,{center:{lat:cLat,lng:cLng},zoom:11,styles:typeof _GMAP_DARK_STYLES!=="undefined"?_GMAP_DARK_STYLES:[],zoomControl:true,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,gestureHandling:"greedy"});
          var bnds=new google.maps.LatLngBounds();
          mappableItems.forEach(function(x,mi){
            var coord=AREA_COORDS[x.coordKey];var clr=MAP_COLORS[mi%MAP_COLORS.length];
            bnds.extend({lat:coord[0],lng:coord[1]});
            new google.maps.Marker({map:gm,position:{lat:coord[0],lng:coord[1]},title:x.it.value,icon:{path:google.maps.SymbolPath.CIRCLE,scale:10,fillColor:clr,fillOpacity:1,strokeColor:"#fff",strokeWeight:2},label:{text:String(mi+1),color:"#fff",fontSize:"10px",fontWeight:"700"}});
          });
          if(mappableItems.length>1)gm.fitBounds(bnds,40);
        });
      },80);
    }
  }
  return wrap;
}

// --- PERSONAL TAB ------------------------------------------------------------
// Re-init if state shape is from old version (no step property)
if(typeof personalState!=="undefined"&&!("step" in personalState)){
  personalState={step:0,goal:"",priority:"",timeline:"",financing:"",nationality:"",budget:2000000,beds:"2 BR",prefAreas:[],work:"",loading:false,result:null,error:""};
}

// Real UAE mortgage LTV rules (matches js/mortgage.js exactly — 4% flat DLD
// fee, LTV tiers by nationality/price) reused here so a "Need Mortgage"
// buyer sees a genuine cash-required estimate, not just an asking price.
function _paCashRequired(price,nationality){
  if(!price||price<=0)return null;
  var isUAE=nationality==="UAE National";
  var maxLTV=isUAE?(price>=5000000?70:80):(price>=5000000?65:75);
  var minDP=100-maxLTV;
  var dpAmt=Math.round(price*minDP/100);
  var dldFee=Math.round(price*0.04);
  var agencyFee=Math.round(price*0.02);
  var mortgageFee=Math.round(price*0.0025);
  return{minDP:minDP,total:dpAmt+dldFee+agencyFee+mortgageFee};
}
// Turns a lowercase DB key ("marina gate 1") into a display name.
function _paTitleCase(key){
  return String(key||"").split(" ").map(function(w){return w?w.charAt(0).toUpperCase()+w.slice(1):w;}).join(" ");
}
// Picks a REAL, currently-tracked building in the given area (highest grade
// first) — used both as the deterministic fallback when the AI's own
// buildingTip doesn't resolve to a real building, and to validate one that
// claims to.
function _paPickRealBuilding(areaName,isVilla){
  var gradeRank={"Ultra":7,"A+":6,"A":5,"A-":4,"B+":3,"B":2,"C":1};
  var best=null,bestRank=-1;
  Object.entries(DB).forEach(function(e){
    var b=e[1];
    if(b.a!==areaName)return;
    // Per-building refinement (2026-07-18) — see isVillaBuilding() in
    // js/valuation.js (mixed villa/apartment areas like Palm Jumeirah/
    // Dubai Hills Estate) — previously matched every building in the area
    // to the same area-level flag, so a real apartment building could be
    // picked as the "real building tip" for a villa recommendation.
    var villaMatch=typeof isVillaBuilding==="function"?isVillaBuilding(e[0],areaName):(typeof VILLA_AREAS!=="undefined"&&VILLA_AREAS.has&&VILLA_AREAS.has(areaName)?true:false);
    if(isVilla!==undefined&&villaMatch!==isVilla)return;
    var rank=gradeRank[b.g]||0;
    if(rank>bestRank){bestRank=rank;best={key:e[0],grade:b.g};}
  });
  if(!best)return null;
  return{name:_paTitleCase(best.key),grade:best.grade};
}
function _paAdvise(){
  var p=personalState;
  p.loading=true;p.result=null;p.error="";p.step=6;render();
  var sqftMap={"Studio":600,"1 BR":900,"2 BR":1300,"3 BR":1900,"4 BR":2700,"5+ BR":4000};
  var sqft=sqftMap[p.beds]||1300;
  var maxPSF=p.budget/sqft;
  var isVillaGoal=p.beds==="4 BR"||p.beds==="5+ BR";
  // Score weights by goal + priority
  var wY=0.4,wG=0.35,wP=0.25;
  if(p.goal==="Build Wealth"){
    if(p.priority==="Stable Income"){wY=0.65;wG=0.2;wP=0.15;}
    else if(p.priority==="Capital Growth"){wY=0.15;wG=0.65;wP=0.2;}
    else if(p.priority==="Flip Off-Plan"){wY=0.1;wG=0.72;wP=0.18;}
    else{wY=0.42;wG=0.38;wP=0.2;}
  }else if(p.goal==="Own a Home"||p.goal==="Relocate to Dubai"){
    wY=0.12;wG=0.22;wP=0.66;
  }else if(p.goal==="Holiday Home"){
    wY=0.62;wG=0.22;wP=0.16;
  }
  function aYld(a){return a.y?((a.y[0]+a.y[1])/2):0;}
  function aG1(a){return a.g?a.g[0]:0;}
  function aG3(a){return a.g?a.g[1]:0;}
  function aG5(a){return a.g?a.g[2]:0;}
  var prefSet={};
  (p.prefAreas||[]).forEach(function(a){prefSet[a]=true;});
  // Real, already-owned exposure (added 2026-07-18) — read directly from
  // localStorage rather than window.PORTFOLIO_STATE, since that object is
  // only populated once the user has actually visited the Portfolio tab in
  // this session; the raw storage key is the same source of truth either
  // way. A genuine advisor accounts for what the client ALREADY owns rather
  // than treating every session as a cold start — areas not yet owned get
  // a modest diversification bonus for wealth-building goals.
  var ownedAreas={};
  try{
    var _paAssets=JSON.parse(localStorage.getItem("dubaival_portfolio"))||[];
    _paAssets.forEach(function(a){if(a&&a.area)ownedAreas[a.area]=(ownedAreas[a.area]||0)+1;});
  }catch(e){}
  var hasPortfolio=Object.keys(ownedAreas).length>0;
  var entries=Object.entries(AREAS).filter(function(e){
    var a=e[1];return a.psf>0&&a.y&&a.g&&(a.psf<=maxPSF*1.4||prefSet[e[0]]);
  });
  var scored=entries.map(function(e){
    var a=e[1];
    var yScore=Math.min(aYld(a)/10,1);
    var gScore=Math.min(aG3(a)/30,1);
    var pScore=1-Math.min(Math.max(a.psf,0)/Math.max(maxPSF,1),1);
    var bonus=prefSet[e[0]]?0.25:0;
    // Diversification nudge — only meaningful for wealth-building goals;
    // someone relocating to live in a specific area shouldn't be steered
    // away from it just because they already own there.
    if(p.goal==="Build Wealth"&&hasPortfolio&&!ownedAreas[e[0]])bonus+=0.08;
    return{name:e[0],psf:a.psf,yld:aYld(a),g1:aG1(a),g3:aG3(a),g5:aG5(a),sc:a.sc||15,dom:a.dom||90,score:wY*yScore+wG*gScore+wP*pScore+bonus};
  }).sort(function(a,b){return b.score-a.score;}).slice(0,10);
  var areaData=scored.map(function(a,i){
    var canAfford=Math.floor(p.budget/a.psf);
    return(i+1)+". "+a.name+": PSF AED "+a.psf+" | yield "+a.yld.toFixed(1)+"% | 3yr growth "+a.g3+"% | SC "+a.sc+" AED/sqft | DOM "+a.dom+"d | "+p.beds+" ≈ "+canAfford+" sqft"+(ownedAreas[a.name]?" | [You already own "+ownedAreas[a.name]+" here]":"");
  }).join("\n");
  var budStr="AED "+(p.budget||0).toLocaleString();
  var extraCtx=[];
  if(p.timeline)extraCtx.push("Timeline: "+p.timeline);
  if(p.financing)extraCtx.push("Financing: "+p.financing);
  if(p.nationality)extraCtx.push("Nationality/residency: "+p.nationality);
  if(hasPortfolio)extraCtx.push("Already owns property in: "+Object.keys(ownedAreas).join(", "));
  var userPrompt="MY PROFILE:\nBudget: "+budStr+" | Goal: "+p.goal+" | Style/Household: "+p.priority+" | Beds: "+p.beds+(p.work?" | Works at: "+p.work:"")+(extraCtx.length?"\n"+extraCtx.join(" | "):"")+"\n"+(Object.keys(prefSet).length?"Interested in: "+Object.keys(prefSet).join(", ")+"\n":"")+"\nTOP 10 BUDGET-MATCHING DUBAI AREAS (ranked for this profile):\n"+areaData+'\n\nRespond ONLY with valid JSON — no markdown, no extra text, JSON.parse()-ready:\n{"profile":{"type":"<2-4 word investor archetype>","dna":"<2 sentences describing this buyer persona, referencing their timeline/financing/existing portfolio if given>","tagline":"<one punchy memorable line>"},"areas":[{"rank":1,"name":"<area name from list above>","thesis":"<2-3 sentence case for this area matching this profile>","whyNow":"<1 sentence time-sensitive trigger — '+_currentMonthYear()+'>","redFlag":"<1 key downside risk>","goldenVisa":<true if budget>=2000000 else false>},{"rank":2,...},{"rank":3,...}],"timing":"<2 sentence market timing assessment '+_currentMonthYear()+'>","nextStep":"<1 specific concrete actionable next step>"}\n\nDo NOT include bestEntry, buildingTip, or scenario fields — those are computed separately from verified data, not written by you.';
  var sysPrompt="You are DubAIVal — Dubai's premier AI property advisor with verified data on 9,434 buildings across 347 DLD-verified areas. "+_currentMonthYear()+".\nCRITICAL: Return ONLY valid JSON. No markdown code fences, no preamble, no explanation. Output must be directly parseable with JSON.parse().\nUse EXACT numbers from the area data provided in the prompt. Do not invent PSF, yield, or growth figures.\nSet goldenVisa:true if and only if budget >= AED 2,000,000.\nprofile.type examples: 'Yield-First Investor', 'Capital Growth Seeker', 'Lifestyle Relocator', 'Off-Plan Flipper', 'AirBnB Income Maximizer', 'Safe-Haven Allocator', 'Family Value Buyer'.";
  askAI([{role:"user",content:userPrompt}],sysPrompt,"Dubai "+p.goal+" "+budStr+" "+p.beds,scored.slice(0,5).map(function(a){return a.name;}))
  .then(function(txt){
    try{
      var c=txt.trim().replace(/^```json\s*/i,"").replace(/^```\s*/,"").replace(/```\s*$/,"").trim();
      var parsed=JSON.parse(c);
      // Splice in deterministic, verified figures for every recommended
      // area — bestEntry/scenario/buildingTip are NEVER AI-authored numbers
      // (added 2026-07-18, closing a real accuracy gap: the AI previously
      // free-wrote these, risking a nonexistent building name or an
      // unfounded return percentage on the exact screen a brand-new visitor
      // uses to decide whether to trust this platform at all).
      (parsed.areas||[]).forEach(function(area){
        if(!area||!area.name)return;
        var match=scored.find(function(s){return s.name.toLowerCase()===String(area.name).toLowerCase();});
        if(!match)return;
        var range=(typeof computeAreaPriceRange==="function")?computeAreaPriceRange(match.name,p.beds,"sale"):null;
        area.bestEntry=range?("AED "+range.lo.toLocaleString()+" – "+range.hi.toLocaleString()):("~AED "+Math.round(match.psf*(sqftMap[p.beds]||1300)).toLocaleString());
        // Same total-return formula already used by computeValuation()
        // (netYield + growth/3, annualized) — here summed over a real
        // 3-year window instead of one year, using the DB's own 1-3yr (g3)
        // and 2-5yr (g5, scaled to a 3yr-equivalent) growth bands so
        // "optimistic" is a genuinely different, longer-trend data point,
        // not an arbitrary multiplier on "base".
        var yrs3Yield=Math.round(match.yld*3);
        area.scenario={
          conservative:"+"+yrs3Yield+"% (yield only, no growth)",
          base:"+"+Math.round(yrs3Yield+match.g3)+"% (yield + 3yr growth)",
          optimistic:"+"+Math.round(yrs3Yield+Math.max(match.g3,match.g5*0.6))+"% (yield + upper growth trend)"
        };
        var isVillaArea=typeof VILLA_AREAS!=="undefined"&&VILLA_AREAS.has&&VILLA_AREAS.has(match.name);
        var aiTip=(area.buildingTip||"").trim();
        var resolved=aiTip.length>3&&typeof lookupBuilding==="function"?lookupBuilding(aiTip,match.name):null;
        if(resolved&&resolved.a===match.name){
          area.buildingTip=aiTip+" ("+resolved.g+")";
        }else{
          var real=_paPickRealBuilding(match.name,isVillaArea);
          area.buildingTip=real?(real.name+" ("+real.grade+")"):null;
        }
        if(p.financing==="Need Mortgage"&&range){
          var midPrice=(range.lo+range.hi)/2;
          var cash=_paCashRequired(midPrice,p.nationality);
          if(cash)area.cashRequired="~AED "+cash.total.toLocaleString()+" cash ("+cash.minDP+"% down + fees)";
        }
      });
      personalState.result=parsed;
    }catch(e){
      personalState.error="Parse error: "+e.message.substring(0,100);
    }
    personalState.loading=false;personalState.step=7;render();
  })
  .catch(function(e){
    personalState.error="AI error: "+e.message;
    personalState.loading=false;personalState.step=7;render();
  });
}

function renderPersonal(){
  var cl=C();var p=personalState;
  var wrap=div({padding:"20px",maxWidth:"640px",margin:"0 auto"});

  // Header (always shown)
  var hdr=div({marginBottom:"18px"});
  // Premium header
  var _paHdrR=el('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}});
  var _paHdrL=el('div',{});
  _paHdrL.appendChild(div({fontSize:'10px',color:'#6B7A9E',fontWeight:'700',fontFamily:"'Inter',sans-serif",letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:'4px'},'AI Investment Advisor'));
  _paHdrL.appendChild(div({fontSize:'22px',fontWeight:'800',color:cl.white,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'-0.02em',lineHeight:'1'},'Personal Advisor'));
  _paHdrR.appendChild(_paHdrL);
  var _paBadge=el('div',{style:{display:'flex',alignItems:'center',gap:'5px',background:'rgba(212,168,67,0.08)',border:'1px solid rgba(212,168,67,0.20)',borderRadius:'20px',padding:'5px 11px',flexShrink:'0'}});
  var _paDot=el('div',{style:{width:'6px',height:'6px',borderRadius:'50%',background:'#D4A843',animation:'dvPulse 2s ease infinite'}});
  _paBadge.appendChild(_paDot);
  _paBadge.appendChild(span({fontSize:'10px',color:'#D4A843',fontFamily:"'Space Grotesk',sans-serif",fontWeight:'700',letterSpacing:'0.08em'},'AI'));
  _paHdrR.appendChild(_paBadge);
  hdr.appendChild(_paHdrR);

  // Progress bar for steps 1-5
  if(p.step>=1&&p.step<=5){
    var pbR=div({display:"flex",gap:"5px",marginBottom:"6px"});
    for(var si=1;si<=5;si++){
      pbR.appendChild(div({flex:"1",height:"3px",borderRadius:"2px",background:si<=p.step?"#D4AF37":"rgba(212,175,55,0.15)"},null));
    }
    hdr.appendChild(pbR);
    var stepLabels=["","Goal","Profile","Budget","Areas","Location"];
    hdr.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},(stepLabels[p.step]||"")+" · Step "+p.step+" of 5"));
  }
  wrap.appendChild(hdr);

  // ── Step 0: Hero landing ──────────────────────────────────────────────────
  if(p.step===0){
    var hero=div({background:"linear-gradient(135deg,rgba(212,175,55,0.1) 0%,rgba(212,175,55,0.03) 100%)",border:"1px solid rgba(212,175,55,0.25)",borderRadius:"16px",padding:"28px 22px",textAlign:"center",marginBottom:"14px"});
    (function(){var e=div({width:"64px",height:"64px",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"16px",background:"rgba(212,175,55,0.12)",margin:"0 auto 14px"});e.innerHTML='<i data-lucide="building-2" style="width:32px;height:32px;color:#D4AF37"></i>';hero.appendChild(e);})();
    hero.appendChild(div({color:cl.white,fontSize:"19px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",lineHeight:"1.3",marginBottom:"10px"},"Your Personalised Dubai Property Report"));
    hero.appendChild(div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif",lineHeight:"1.7",marginBottom:"22px"},"5 questions. One data-backed investment thesis tailored to you — areas, buildings, and your personal 3-year scenario."));
    var bWrap=div({textAlign:"left",marginBottom:"22px",display:"flex",flexDirection:"column",gap:"7px"});
    [["✓","9,434 buildings & 347 DLD-verified areas"],["✓","3-year scenario: conservative · base · optimistic"],["✓","Golden Visa eligibility check (≥ AED 2M)"],["✓","Investor DNA profile + one concrete next step"]].forEach(function(b){
      var row=div({display:"flex",gap:"10px",alignItems:"center"});
      row.appendChild(span({color:"#D4AF37",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",fontSize:"12px"},b[0]));
      row.appendChild(span({color:"#AABBCC",fontSize:"12px",fontFamily:"'Inter',sans-serif"},b[1]));
      bWrap.appendChild(row);
    });
    hero.appendChild(bWrap);
    var startBtn=el("button",{style:{width:"100%",padding:"15px",borderRadius:"12px",border:"none",background:"linear-gradient(135deg,#D4AF37,#B8960F)",color:"#000",fontSize:"15px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",cursor:"pointer"},onclick:function(){personalState.step=1;render();}});
    startBtn.textContent="START MY REPORT →";
    hero.appendChild(startBtn);
    wrap.appendChild(hero);
    var sp=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"14px 16px",display:"flex",gap:"12px",alignItems:"flex-start"});
    (function(){var e=div({width:"36px",height:"36px",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"10px",background:"rgba(139,92,246,0.12)"});e.innerHTML='<i data-lucide="message-circle" style="width:18px;height:18px;color:#8B5CF6"></i>';sp.appendChild(e);})();
    var spT=div({});
    spT.appendChild(div({color:"#CCDDEE",fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.65",marginBottom:"4px"},'"The AI Advisor matched me with Dubai Hills Estate — closed a 3BR at AED 3.2M. Best decision I made this year."'));
    spT.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"— Family Buyer · Relocated from London · June 2026"));
    sp.appendChild(spT);
    wrap.appendChild(sp);
    return wrap;
  }

  // Shared helpers (available from step 1 onward)
  function addBack(prevStep){
    var b=el("button",{style:{background:"none",border:"none",color:cl.sub,fontSize:"12px",cursor:"pointer",fontFamily:"'Inter',sans-serif",padding:"0 0 16px 0"},onclick:function(){personalState.step=prevStep;render();}});
    b.textContent="← Back";
    wrap.appendChild(b);
  }
  function mkOptCard(icon,title,desc,isSel,onClickFn){
    var c=el("button",{style:{width:"100%",display:"flex",alignItems:"center",gap:"14px",padding:"15px 16px",borderRadius:"12px",border:"1px solid "+(isSel?"#D4AF37":"rgba(255,255,255,0.08)"),background:isSel?"rgba(212,175,55,0.1)":cl.surface,cursor:"pointer",marginBottom:"10px",textAlign:"left"},onclick:onClickFn});
    var icoBox=div({width:"40px",height:"40px",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"10px",background:isSel?"rgba(212,175,55,0.15)":"rgba(255,255,255,0.06)"});
    icoBox.innerHTML='<i data-lucide="'+icon+'" style="width:20px;height:20px;color:'+(isSel?"#D4AF37":"#8899AA")+'"></i>';
    c.appendChild(icoBox);
    var ct=div({flex:"1"});
    ct.appendChild(div({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},title));
    ct.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif"},desc));
    c.appendChild(ct);
    if(isSel)c.appendChild(div({color:"#D4AF37",fontSize:"16px",flexShrink:"0"},"✓"));
    return c;
  }

  // ── Step 1: Goal ──────────────────────────────────────────────────────────
  if(p.step===1){
    wrap.appendChild(div({color:cl.white,fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px",lineHeight:"1.3"},"What's your property goal?"));
    wrap.appendChild(div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif",marginBottom:"18px"},"This shapes everything — your areas, buildings, and 3-year plan."));
    [["home","Own a Home","I want to live in it — find my ideal community"],
     ["trending-up","Build Wealth","Investment — yield, capital growth, or off-plan flip"],
     ["globe","Relocate to Dubai","Moving here — lifestyle match + best value for budget"],
     ["sun","Holiday Home","Vacation + AirBnB — earn when I'm away"]].forEach(function(g){
      wrap.appendChild(mkOptCard(g[0],g[1],g[2],p.goal===g[1],function(){
        personalState.goal=g[1];personalState.priority="";personalState.step=2;render();
      }));
    });
  }

  // ── Step 2: Adaptive follow-up ────────────────────────────────────────────
  else if(p.step===2){
    addBack(1);
    var q2,opts2;
    if(p.goal==="Build Wealth"){
      q2="What's your investment style?";
      opts2=[["dollar-sign","Stable Income","High-yield rentals — predictable cash flow every month"],
             ["rocket","Capital Growth","Appreciation play — buy low, sell high in 3-5 years"],
             ["zap","Both Income & Growth","Balanced — moderate yield + long-term appreciation"],
             ["refresh-cw","Flip Off-Plan","Buy at launch price, sell at handover for a premium"]];
    }else if(p.goal==="Holiday Home"){
      q2="How often will you visit?";
      opts2=[["calendar","Monthly visits","Lifestyle property — earns on months I travel"],
             ["sun","Quarterly","Seasonal use — AirBnB between my visits"],
             ["plane","Twice a year","Mostly investment — fully managed AirBnB"],
             ["package","Rarely — Pure AirBnB","Fully managed holiday rental from day one"]];
    }else{
      q2="Who are you moving with?";
      opts2=[["user","Just Me","Studio or 1BR — max location, minimal footprint"],
             ["users","Me & Partner","1-2BR — lifestyle and commute focused"],
             ["users-2","Family with Kids","2-4BR — schools, parks, community feel matters most"],
             ["user-check","Retiree / Empty Nester","Quality of life, quiet, low maintenance, beach access"]];
    }
    wrap.appendChild(div({color:cl.white,fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px",lineHeight:"1.3"},q2));
    wrap.appendChild(div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif",marginBottom:"18px"},"Helps us weight yield, growth, and lifestyle in your report."));
    opts2.forEach(function(o){
      wrap.appendChild(mkOptCard(o[0],o[1],o[2],p.priority===o[1],function(){
        personalState.priority=o[1];personalState.step=3;render();
      }));
    });
  }

  // ── Step 3: Budget & Beds ─────────────────────────────────────────────────
  else if(p.step===3){
    addBack(2);
    wrap.appendChild(div({color:cl.white,fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"What's your budget?"));
    wrap.appendChild(div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif",marginBottom:"18px"},"We'll find areas where your money unlocks the best opportunities."));
    var bCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px 20px",marginBottom:"12px"});
    bCard.appendChild(div({color:cl.subHi,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"BUDGET (AED) — tap to select"));
    var pg=div({display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"7px",marginBottom:"14px"});
    [[500000,"500K"],[750000,"750K"],[1000000,"1M"],[1500000,"1.5M"],[2000000,"2M"],[3000000,"3M"],[5000000,"5M"],[10000000,"10M+"]].forEach(function(pr){
      var isSel=p.budget===pr[0];
      var pb=el("button",{style:{padding:"10px 2px",borderRadius:"8px",border:"1px solid "+(isSel?"#D4AF37":"rgba(255,255,255,0.08)"),background:isSel?"rgba(212,175,55,0.15)":"rgba(255,255,255,0.02)",color:isSel?"#D4AF37":"#8899AA",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){personalState.budget=pr[0];render();}});
      pb.textContent=pr[1];
      pg.appendChild(pb);
    });
    bCard.appendChild(pg);
    bCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginBottom:"6px"},"Or type a custom amount:"));
    var ci=el("input",{style:{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.04)",border:"1px solid "+cl.border,borderRadius:"8px",padding:"10px 12px",color:cl.white,fontSize:"14px",fontFamily:"'Inter',sans-serif",outline:"none"},type:"number",placeholder:"e.g. 2500000"});
    ci.value=p.budget||"";
    ci.oninput=function(){var v=parseInt(this.value)||0;personalState.budget=v;};
    bCard.appendChild(ci);
    if(p.budget>=2000000){
      var gv=div({display:"flex",gap:"10px",alignItems:"center",marginTop:"12px",padding:"10px 12px",background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.25)",borderRadius:"8px"});
      (function(){var e=div({width:"32px",height:"32px",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"8px",background:"rgba(212,175,55,0.12)"});e.innerHTML='<i data-lucide="star" style="width:16px;height:16px;color:#D4AF37"></i>';gv.appendChild(e);})();
      var gvT=div({});
      gvT.appendChild(div({color:"#D4AF37",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Golden Visa Eligible"));
      gvT.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"10-year UAE residency visa with property investment ≥ AED 2M"));
      gv.appendChild(gvT);
      bCard.appendChild(gv);
    }
    wrap.appendChild(bCard);
    var bedsCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px 20px",marginBottom:"14px"});
    bedsCard.appendChild(div({color:cl.subHi,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"BEDROOMS"));
    var bedsRow=div({display:"flex",flexWrap:"wrap",gap:"8px"});
    ["Studio","1 BR","2 BR","3 BR","4 BR","5+ BR"].forEach(function(b){
      var isSel=p.beds===b;
      var bb=el("button",{style:{padding:"9px 14px",borderRadius:"20px",border:"1px solid "+(isSel?"#D4AF37":"rgba(255,255,255,0.1)"),background:isSel?"rgba(212,175,55,0.12)":"transparent",color:isSel?"#D4AF37":"#8899AA",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){personalState.beds=b;render();}});
      bb.textContent=b;
      bedsRow.appendChild(bb);
    });
    bedsCard.appendChild(bedsRow);
    wrap.appendChild(bedsCard);

    // Real-advisor inputs (added 2026-07-18) — timeline shapes urgency
    // framing; financing + nationality feed the actual UAE mortgage LTV
    // rules already used in js/mortgage.js (nationality changes the real
    // max loan-to-value and minimum down payment), so the report can show
    // a genuine cash-required estimate, not just an asking-price range.
    // All 3 are optional, same as Beds above.
    function mkPillRow(title,options,curVal,onPick){
      var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"14px 16px",marginBottom:"10px"});
      card.appendChild(div({color:cl.subHi,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"9px"},title));
      var row=div({display:"flex",flexWrap:"wrap",gap:"7px"});
      options.forEach(function(o){
        var isSel=curVal===o;
        var pb=el("button",{style:{padding:"7px 13px",borderRadius:"18px",border:"1px solid "+(isSel?"#D4AF37":"rgba(255,255,255,0.1)"),background:isSel?"rgba(212,175,55,0.12)":"transparent",color:isSel?"#D4AF37":"#8899AA",fontSize:"11.5px",fontWeight:"600",fontFamily:"'Inter',sans-serif",cursor:"pointer"},onclick:function(){onPick(o);render();}});
        pb.textContent=o;
        row.appendChild(pb);
      });
      card.appendChild(row);
      return card;
    }
    wrap.appendChild(mkPillRow("TIMELINE — OPTIONAL",["Just Browsing","Next 3-6 Months","Ready Now"],p.timeline,function(v){personalState.timeline=v;}));
    wrap.appendChild(mkPillRow("FINANCING — OPTIONAL",["Cash Buyer","Need Mortgage"],p.financing,function(v){personalState.financing=v;}));
    wrap.appendChild(mkPillRow("NATIONALITY — OPTIONAL",["UAE National","Expat / Foreign National"],p.nationality,function(v){personalState.nationality=v;}));

    if(p.budget&&p.beds){
      var sqftMap2={"Studio":600,"1 BR":900,"2 BR":1300,"3 BR":1900,"4 BR":2700,"5+ BR":4000};
      var sqft2=sqftMap2[p.beds]||1300;
      var maxPSF2=Math.round(p.budget/sqft2);
      var ins=div({background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"10px",padding:"12px 14px",marginBottom:"16px",display:"flex",gap:"10px",alignItems:"flex-start"});
      (function(){var e=div({width:"32px",height:"32px",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"8px",background:"rgba(99,102,241,0.12)"});e.innerHTML='<i data-lucide="ruler" style="width:16px;height:16px;color:#818CF8"></i>';ins.appendChild(e);})();
      var insT=div({});
      insT.appendChild(div({color:"#818CF8",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"Your Budget Power"));
      insT.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif"},"AED "+(p.budget||0).toLocaleString()+" ÷ ~"+sqft2+" sqft = max "+maxPSF2+" AED/sqft"));
      insT.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},"We'll match "+p.beds+" options in areas within this range"));
      ins.appendChild(insT);
      wrap.appendChild(ins);
    }
    var nb=el("button",{style:{width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:p.budget?"linear-gradient(135deg,#D4AF37,#B8960F)":"rgba(255,255,255,0.05)",color:p.budget?"#000":"#556677",fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",cursor:p.budget?"pointer":"not-allowed"},onclick:function(){if(personalState.budget){personalState.step=4;render();}}});
    nb.textContent="NEXT →";
    wrap.appendChild(nb);
  }

  // ── Step 4: Area preferences ──────────────────────────────────────────────
  else if(p.step===4){
    addBack(3);
    wrap.appendChild(div({color:cl.white,fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"Any areas on your radar?"));
    wrap.appendChild(div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif",marginBottom:"16px"},"Optional — select all that interest you, or let the data pick for you."));
    var prefArr=p.prefAreas||[];
    var topA=["Downtown Dubai","Dubai Marina","Business Bay","Palm Jumeirah","Dubai Hills Estate","Dubai Creek Harbour","Jumeirah Village Circle","JBR","DIFC","Emaar Beachfront","MBR City","Dubai Harbour","Arabian Ranches","Sobha Hartland","Meydan","District One","Tilal Al Ghaf","Jumeirah Lake Towers"];
    var chWrap=div({display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"20px"});
    topA.forEach(function(a){
      var isSel=prefArr.indexOf(a)>-1;
      var ch=el("button",{style:{padding:"8px 14px",borderRadius:"20px",border:"1px solid "+(isSel?"#D4AF37":"rgba(255,255,255,0.1)"),background:isSel?"rgba(212,175,55,0.12)":"rgba(255,255,255,0.02)",color:isSel?"#D4AF37":"#8899AA",fontSize:"12px",fontFamily:"'Inter',sans-serif",cursor:"pointer"},onclick:function(){
        var arr=(personalState.prefAreas||[]).slice();
        var idx=arr.indexOf(a);
        if(idx>-1)arr.splice(idx,1);else arr.push(a);
        personalState.prefAreas=arr;render();
      }});
      ch.textContent=(isSel?"✓ ":"")+a;
      chWrap.appendChild(ch);
    });
    wrap.appendChild(chWrap);
    var aRow=div({display:"flex",gap:"10px"});
    var skipA=el("button",{style:{flex:"1",padding:"12px",borderRadius:"10px",border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:cl.sub,fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){personalState.prefAreas=[];personalState.step=5;render();}});
    skipA.textContent="Skip — Surprise Me";
    aRow.appendChild(skipA);
    var nextA=el("button",{style:{flex:"2",padding:"12px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#D4AF37,#B8960F)",color:"#000",fontSize:"13px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){personalState.step=5;render();}});
    nextA.textContent=(prefArr.length?"NEXT ("+prefArr.length+" selected)":"NEXT")+" →";
    aRow.appendChild(nextA);
    wrap.appendChild(aRow);
  }

  // ── Step 5: Work location ─────────────────────────────────────────────────
  else if(p.step===5){
    addBack(4);
    wrap.appendChild(div({color:cl.white,fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"Where do you work?"));
    wrap.appendChild(div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif",marginBottom:"18px"},"Optional — optimises commute time in your recommendations."));
    var wc=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px 20px",marginBottom:"16px"});
    var wi=el("input",{style:{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.04)",border:"1px solid "+cl.border,borderRadius:"8px",padding:"12px 14px",color:cl.white,fontSize:"14px",fontFamily:"'Inter',sans-serif",outline:"none",marginBottom:"12px"},type:"text",placeholder:"e.g. DIFC, Downtown Dubai, Work from home…"});
    wi.value=p.work||"";
    wi.oninput=function(){personalState.work=this.value;};
    wc.appendChild(wi);
    var qps=["DIFC","Downtown Dubai","Business Bay","Dubai Media City","Jebel Ali","Work from home"];
    var qpRow=div({display:"flex",flexWrap:"wrap",gap:"6px"});
    qps.forEach(function(qp){
      var qb=el("button",{style:{padding:"6px 12px",borderRadius:"16px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.02)",color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",cursor:"pointer"},onclick:function(){personalState.work=qp;wi.value=qp;}});
      qb.textContent=qp;
      qpRow.appendChild(qb);
    });
    wc.appendChild(qpRow);
    wrap.appendChild(wc);
    var wRow=div({display:"flex",gap:"10px"});
    var wSkip=el("button",{style:{flex:"1",padding:"13px",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:cl.sub,fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){personalState.work="";_paAdvise();}});
    wSkip.textContent="Skip";
    wRow.appendChild(wSkip);
    var wGo=el("button",{style:{flex:"2",padding:"13px",borderRadius:"12px",border:"none",background:"linear-gradient(135deg,#D4AF37,#B8960F)",color:"#000",fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){_paAdvise();}});
    wGo.textContent="BUILD MY REPORT →";
    wRow.appendChild(wGo);
    wrap.appendChild(wRow);
  }

  // ── Step 6: Loading ───────────────────────────────────────────────────────
  else if(p.step===6){
    var lc=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"16px",padding:"40px 24px",textAlign:"center"});
    lc.appendChild(div({width:"52px",height:"52px",borderRadius:"50%",border:"3px solid rgba(212,175,55,0.2)",borderTopColor:"#D4AF37",animation:"spin 0.9s linear infinite",margin:"0 auto 20px"},null));
    lc.appendChild(div({color:cl.white,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Building your personalised report…"));
    lc.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.65",marginBottom:"20px"},"Analysing "+Object.keys(AREAS).length+" areas · Matching "+p.beds+" under AED "+(p.budget?(p.budget).toLocaleString():"—")+" · Running 3-year scenarios"));
    var lList=div({display:"flex",flexDirection:"column",gap:"8px",textAlign:"left"});
    ["Filtering areas by your budget & goal…","Scoring by "+(p.goal==="Build Wealth"&&p.priority==="Stable Income"?"rental yield":"growth & value")+"…","Profiling your investor DNA…","Crafting 3-year conservative / base / optimistic scenarios…","Finalising your personalised report…"].forEach(function(s,i){
      var li=div({display:"flex",alignItems:"center",gap:"10px"});
      var dot=div({width:"14px",height:"14px",flexShrink:"0",borderRadius:"50%",border:"2px solid rgba(212,175,55,0.3)",borderTopColor:"#D4AF37",animation:"spin 0.8s linear infinite"},null);
      dot.style.animationDelay=(i*0.13)+"s";
      li.appendChild(dot);
      li.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},s));
      lList.appendChild(li);
    });
    lc.appendChild(lList);
    wrap.appendChild(lc);
  }

  // ── Step 7: Results ───────────────────────────────────────────────────────
  else if(p.step===7){
    if(p.error){
      var ec=div({background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:"14px",padding:"20px",marginBottom:"14px"});
      ec.appendChild(div({color:"#EF4444",fontSize:"13px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",marginBottom:"12px"},"Unable to generate report: "+p.error));
      var btnRow2=div({display:"flex",gap:"10px",flexWrap:"wrap"});
      var tryBtn=el("button",{style:{background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.3)",color:"#10B981",padding:"10px 20px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){personalState.error="";_paAdvise();}});
      tryBtn.textContent="Try Again";
      var rb=el("button",{style:{background:"rgba(212,175,55,0.12)",border:"1px solid rgba(212,175,55,0.3)",color:cl.gold,padding:"10px 20px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){personalState={step:0,goal:"",priority:"",timeline:"",financing:"",nationality:"",budget:2000000,beds:"2 BR",prefAreas:[],work:"",loading:false,result:null,error:""};render();}});
      rb.textContent="Start Over";
      btnRow2.appendChild(tryBtn);btnRow2.appendChild(rb);
      ec.appendChild(btnRow2);
      wrap.appendChild(ec);
      return wrap;
    }
    var r=p.result;
    if(!r)return wrap;

    // — Profile card
    var pc=div({background:"linear-gradient(135deg,rgba(212,175,55,0.12),rgba(212,175,55,0.04))",border:"1px solid rgba(212,175,55,0.3)",borderRadius:"16px",padding:"20px 22px",marginBottom:"16px"});
    var ph=div({display:"flex",alignItems:"center",gap:"14px",marginBottom:"12px"});
    (function(){var e=div({width:"52px",height:"52px",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"14px",background:"rgba(212,175,55,0.15)"});e.innerHTML='<i data-lucide="crosshair" style="width:26px;height:26px;color:#D4AF37"></i>';ph.appendChild(e);})();
    var pm=div({});
    pm.appendChild(div({color:"#D4AF37",fontSize:"9px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"YOUR INVESTOR PROFILE"));
    pm.appendChild(div({color:cl.white,fontSize:"17px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},r.profile?(r.profile.type||"Property Buyer"):"Property Buyer"));
    ph.appendChild(pm);
    pc.appendChild(ph);
    if(r.profile&&r.profile.dna)pc.appendChild(div({color:"#CCDDEE",fontSize:"13px",fontFamily:"'Inter',sans-serif",lineHeight:"1.75",marginBottom:"10px"},r.profile.dna));
    if(r.profile&&r.profile.tagline)pc.appendChild(div({color:"#D4AF37",fontSize:"13px",fontStyle:"italic",fontFamily:"'Inter',sans-serif"},'"'+r.profile.tagline+'"'));
    wrap.appendChild(pc);

    // — Section label
    wrap.appendChild(div({color:cl.gold,fontSize:"9px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"◆ YOUR TOP 3 MATCHES"));

    var rankCls=["#D4AF37","#C0C0C0","#CD7F32"];
    var rankLbl=["#1 TOP PICK","#2 STRONG MATCH","#3 SOLID BACKUP"];

    (r.areas||[]).slice(0,3).forEach(function(area,i){
      if(!area)return;
      var ac=div({background:cl.surface,border:"1px solid "+(i===0?"rgba(212,175,55,0.3)":cl.border),borderRadius:"16px",padding:"20px",marginBottom:"14px"});
      // Header
      var ah=div({display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"});
      var at=div({});
      at.appendChild(div({color:rankCls[i],fontSize:"8px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},rankLbl[i]));
      at.appendChild(div({color:cl.white,fontSize:"17px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},area.name||"—"));
      ah.appendChild(at);
      if(area.goldenVisa){var gvBadge=div({width:"32px",height:"32px",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"8px",background:"rgba(212,175,55,0.15)",flexShrink:"0"});gvBadge.innerHTML='<i data-lucide="star" style="width:16px;height:16px;color:#D4AF37"></i>';ah.appendChild(gvBadge);}
      ac.appendChild(ah);
      // Thesis
      if(area.thesis)ac.appendChild(div({color:"#CCDDEE",fontSize:"13px",fontFamily:"'Inter',sans-serif",lineHeight:"1.75",marginBottom:"12px"},area.thesis));
      // Key metrics grid
      var mg=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"});
      function mCell(label2,val2,col2){
        var m=div({background:"rgba(255,255,255,0.025)",borderRadius:"8px",padding:"10px 11px"});
        m.appendChild(div({color:cl.sub,fontSize:"8px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},label2));
        m.appendChild(div({color:col2||"#FFFFFF",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},val2||"—"));
        return m;
      }
      if(area.bestEntry)mg.appendChild(mCell("Best Entry",area.bestEntry,"#D4AF37"));
      if(area.buildingTip)mg.appendChild(mCell("Focus On",area.buildingTip,"#60A5FA"));
      if(mg.children.length)ac.appendChild(mg);
      // Cash required — only present when the buyer said "Need Mortgage" in
      // Step 3, computed from the real UAE LTV rules (js/mortgage.js), never
      // AI-authored (added 2026-07-18).
      if(area.cashRequired){
        var crRow=div({background:"rgba(96,165,250,0.06)",border:"1px solid rgba(96,165,250,0.18)",borderRadius:"8px",padding:"10px 11px",marginBottom:"12px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"8px"});
        crRow.appendChild(span({color:"#60A5FA",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.04em"},"CASH NEEDED TO CLOSE"));
        crRow.appendChild(span({color:cl.white,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},area.cashRequired));
        ac.appendChild(crRow);
      }
      // 3-year scenario
      if(area.scenario){
        var sc=div({background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"10px",padding:"12px 14px",marginBottom:"12px"});
        sc.appendChild(div({color:cl.sub,fontSize:"8px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"3-YEAR SCENARIO"));
        var sg=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px"});
        [{l:"Conservative",v:area.scenario.conservative,c:"#8899AA"},{l:"Base",v:area.scenario.base,c:"#10B981"},{l:"Optimistic",v:area.scenario.optimistic,c:"#D4AF37"}].forEach(function(s){
          var sd=div({textAlign:"center",padding:"9px 4px",background:"rgba(255,255,255,0.02)",borderRadius:"6px"});
          sd.appendChild(div({color:s.c,fontSize:"12px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},s.v||"—"));
          sd.appendChild(div({color:cl.sub,fontSize:"8px",textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'Space Grotesk',monospace"},s.l));
          sg.appendChild(sd);
        });
        sc.appendChild(sg);
        ac.appendChild(sc);
      }
      // Why now / Red flag
      if(area.whyNow||area.redFlag){
        var fr=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
        if(area.whyNow){
          var wn=div({background:"rgba(16,185,129,0.07)",border:"1px solid rgba(16,185,129,0.18)",borderRadius:"8px",padding:"10px 11px"});
          wn.appendChild(div({color:"#10B981",fontSize:"8px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"WHY NOW"));
          wn.appendChild(div({color:"#CCDDEE",fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6"},area.whyNow));
          fr.appendChild(wn);
        }
        if(area.redFlag){
          var rf2=div({background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:"8px",padding:"10px 11px"});
          rf2.appendChild(div({color:"#EF4444",fontSize:"8px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"RED FLAG"));
          rf2.appendChild(div({color:"#CCDDEE",fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6"},area.redFlag));
          fr.appendChild(rf2);
        }
        ac.appendChild(fr);
      }
      if(area.goldenVisa){var gvLine=div({marginTop:"10px",padding:"8px 11px",background:"rgba(212,175,55,0.07)",border:"1px solid rgba(212,175,55,0.18)",borderRadius:"6px",color:"#D4AF37",fontSize:"11px",fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:"6px"});gvLine.innerHTML='<i data-lucide="star" style="width:12px;height:12px;flex-shrink:0"></i>Golden Visa eligible — 10-year UAE residency with this investment';ac.appendChild(gvLine);}
      wrap.appendChild(ac);
    });

    // — Timing
    if(r.timing){
      var tc=div({background:"rgba(129,140,248,0.07)",border:"1px solid rgba(129,140,248,0.22)",borderRadius:"14px",padding:"16px 18px",marginBottom:"12px"});
      tc.appendChild(div({color:"#818CF8",fontSize:"8px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"◆ MARKET TIMING — JULY 2026"));
      tc.appendChild(div({color:"#CCDDEE",fontSize:"13px",fontFamily:"'Inter',sans-serif",lineHeight:"1.75"},r.timing));
      wrap.appendChild(tc);
    }

    // — Next step
    if(r.nextStep){
      var ns=div({background:"linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.03))",border:"1px solid rgba(212,175,55,0.28)",borderRadius:"14px",padding:"16px 18px",marginBottom:"16px"});
      ns.appendChild(div({color:"#D4AF37",fontSize:"8px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"◆ YOUR NEXT STEP"));
      ns.appendChild(div({color:cl.white,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},r.nextStep));
      wrap.appendChild(ns);
    }

    // — Actions
    var actR=div({display:"flex",gap:"10px",marginBottom:"16px"});
    var srBtn=el("button",{style:{flex:"1",padding:"12px",borderRadius:"10px",border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:cl.sub,fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){personalState={step:0,goal:"",priority:"",timeline:"",financing:"",nationality:"",budget:2000000,beds:"2 BR",prefAreas:[],work:"",loading:false,result:null,error:""};render();}});
    srBtn.textContent="Start Over";
    actR.appendChild(srBtn);
    var waBtn=el("button",{style:{flex:"1",padding:"12px",borderRadius:"10px",border:"1px solid rgba(37,211,102,0.3)",background:"rgba(37,211,102,0.08)",color:"#25D366",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){
      var t="DubAIVal · My Dubai Property Report 🏙️\n\n";
      if(r.profile)t+="Profile: "+r.profile.type+"\n"+r.profile.tagline+"\n\n";
      if(r.areas&&r.areas[0])t+="#1 Pick: "+r.areas[0].name+"\n"+(r.areas[0].thesis||"")+"\n\n";
      t+="Get your free report: https://www.dubaival.com";
      window.open("https://wa.me/?text="+encodeURIComponent(t),"_blank");
    }});
    waBtn.innerHTML='<i data-lucide="share-2" style="width:13px;height:13px;vertical-align:middle;margin-right:5px"></i>Share';
    actR.appendChild(waBtn);
    wrap.appendChild(actR);

    // — CTA to full analyzer
    var ca=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"});
    ca.appendChild(div({color:"#AABBCC",fontSize:"12px",fontFamily:"'Inter',sans-serif"},"Have a specific property in mind?"));
    var caBtn=el("button",{style:{padding:"8px 14px",borderRadius:"8px",border:"1px solid rgba(212,175,55,0.3)",background:"rgba(212,175,55,0.08)",color:cl.gold,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){window.APP_STATE.tab="Analyzer";render();}});
    caBtn.textContent="Full Analyzer →";
    ca.appendChild(caBtn);
    wrap.appendChild(ca);
  }

  return wrap;
}

// --- PORTFOLIO TAB -----------------------------------------------------------
var STR_DATA={"Downtown Dubai":{nightly:850,occ:0.75},"Dubai Marina":{nightly:650,occ:0.78},"Palm Jumeirah":{nightly:1200,occ:0.7},"Business Bay":{nightly:550,occ:0.72},"Emaar Beachfront":{nightly:900,occ:0.72},"Bluewaters Island":{nightly:960,occ:0.73},"Dubai Creek Harbour":{nightly:420,occ:0.67},"MBR City":{nightly:600,occ:0.64},"Sobha Hartland":{nightly:450,occ:0.74},"Jumeirah Village Circle":{nightly:400,occ:0.73},"Dubai Hills Estate":{nightly:680,occ:0.74},"DAMAC Lagoons":{nightly:650,occ:0.57},"Arabian Ranches":{nightly:800,occ:0.65},"Arabian Ranches 2":{nightly:680,occ:0.56},"Arabian Ranches 3":{nightly:630,occ:0.63},"Tilal Al Ghaf":{nightly:750,occ:0.61},"Al Furjan":{nightly:260,occ:0.75},"Dubai South":{nightly:190,occ:0.71},"Jumeirah Lake Towers":{nightly:300,occ:0.74},"The Springs":{nightly:700,occ:0.57},"The Meadows":{nightly:750,occ:0.57},"The Lakes":{nightly:800,occ:0.59},"Meydan":{nightly:410,occ:0.67},"Al Barsha":{nightly:400,occ:0.72},"Jumeirah Golf Estates":{nightly:730,occ:0.58},"Dubai Sports City":{nightly:190,occ:0.68},"DAMAC Hills":{nightly:500,occ:0.65},"DAMAC Hills 2":{nightly:450,occ:0.58},"Town Square":{nightly:350,occ:0.7},"The Valley":{nightly:450,occ:0.58},"Dubai Harbour":{nightly:750,occ:0.76},"DIFC":{nightly:750,occ:0.71},"City Walk":{nightly:750,occ:0.65},"Palm Jebel Ali":{nightly:980,occ:0.66},"Emirates Hills":{nightly:1100,occ:0.6},"Mudon":{nightly:500,occ:0.62},"Villanova":{nightly:480,occ:0.58},"Al Barari":{nightly:1000,occ:0.62},"Motor City":{nightly:400,occ:0.67},"Jumeirah Bay Island":{nightly:1850,occ:0.64},"Jumeirah Village Triangle":{nightly:250,occ:0.75},"Majan":{nightly:170,occ:0.68},"Polo Residences":{nightly:260,occ:0.71},"Wadi Al Safa":{nightly:300,occ:0.7},"Cherrywoods":{nightly:480,occ:0.61},"The Heights":{nightly:650,occ:0.61},"The Oasis":{nightly:1000,occ:0.6},"Jumeirah Park":{nightly:700,occ:0.63},"Jumeirah Islands":{nightly:1000,occ:0.63},"Victory Heights":{nightly:480,occ:0.58},"The Villa":{nightly:500,occ:0.57},"Mira":{nightly:480,occ:0.59},"Mira Oasis":{nightly:480,occ:0.58},"Serena":{nightly:480,occ:0.56},"Sustainable City":{nightly:450,occ:0.58},"Remraam":{nightly:300,occ:0.7},"Dubai Islands":{nightly:680,occ:0.79},"La Mer":{nightly:720,occ:0.73},"Pearl Jumeirah":{nightly:650,occ:0.77},"The Oasis by Emaar":{nightly:1200,occ:0.61},"Nad Al Sheba":{nightly:780,occ:0.63},"Falcon City":{nightly:300,occ:0.71},"Emaar South":{nightly:330,occ:0.72},"Living Legends":{nightly:260,occ:0.66},"International City":{nightly:200,occ:0.68},"Dubai Silicon Oasis":{nightly:350,occ:0.7},"Al Jaddaf":{nightly:410,occ:0.74},"Culture Village":{nightly:330,occ:0.74},"Arjan":{nightly:350,occ:0.71},"Dubailand":{nightly:250,occ:0.72},"Dubai Investment Park":{nightly:170,occ:0.65},"Dubai Studio City":{nightly:260,occ:0.74},"Dubai Production City":{nightly:220,occ:0.7},"Dubai Media City":{nightly:620,occ:0.75},"Barsha Heights":{nightly:380,occ:0.73},"Mirdif":{nightly:450,occ:0.63},"Liwan":{nightly:190,occ:0.72},"Dubai Festival City":{nightly:430,occ:0.71},"Discovery Gardens":{nightly:250,occ:0.72},"Bur Dubai":{nightly:280,occ:0.76},"Al Nahda":{nightly:140,occ:0.65},"Dubai":{nightly:390,occ:0.68},"Beachgate By Address":{nightly:680,occ:0.75},"Al Wasl":{nightly:450,occ:0.69},"Dubai Residence Complex":{nightly:240,occ:0.72},"Jebel Ali":{nightly:250,occ:0.72},"Dubai Science Park":{nightly:450,occ:0.73},"Dubai Maritime City":{nightly:750,occ:0.7},"Mina Rashid":{nightly:680,occ:0.72},"Ras Al Khor":{nightly:180,occ:0.66},"Wasl Gate":{nightly:300,occ:0.68},"Bukadra":{nightly:410,occ:0.7},"Za'Abeel":{nightly:890,occ:0.74},"Dubai Industrial City":{nightly:160,occ:0.51},"Palace Beach Residence":{nightly:680,occ:0.73},"Jumeirah":{nightly:650,occ:0.77},"Umm Suqeim":{nightly:810,occ:0.69},"Jumeirah Beach Residence (Jbr)":{nightly:650,occ:0.77},"Al Satwa":{nightly:380,occ:0.7},"The Greens":{nightly:380,occ:0.75},"Marina Vista":{nightly:680,occ:0.75},"World Trade Centre":{nightly:650,occ:0.72},"Al Sufouh":{nightly:650,occ:0.69},"Al Thanayah Fourth":{nightly:410,occ:0.74},"Expo City":{nightly:420,occ:0.76},"Al Quoz":{nightly:220,occ:0.69},"The Views":{nightly:480,occ:0.68},"Dubai Design District":{nightly:580,occ:0.7},"The Hills":{nightly:510,occ:0.72},"Dubai Internet City":{nightly:480,occ:0.72},"Muhaisnah":{nightly:170,occ:0.64},"Sheikh Zayed Road":{nightly:620,occ:0.7},"Green Community":{nightly:390,occ:0.6},"Jebel Ali Village":{nightly:350,occ:0.56},"Al Barsha South":{nightly:380,occ:0.71},"Dubai Creek":{nightly:330,occ:0.73},"Al Yufrah 1":{nightly:330,occ:0.7},"Al Goze Fourth":{nightly:220,occ:0.71},"Nadd Hessa":{nightly:260,occ:0.72},"Al Yelayiss 2":{nightly:350,occ:0.65},"Al Kheeran":{nightly:420,occ:0.7},"Al Barshaa South Second":{nightly:300,occ:0.69},"Warsan Fourth":{nightly:150,occ:0.68},"Jumeirah First":{nightly:700,occ:0.72},"Saih Shuaib 2":{nightly:190,occ:0.51},"Al Hebiah Second":{nightly:190,occ:0.69},"Al Safouh Second":{nightly:620,occ:0.71},"Al Yelayiss 1":{nightly:350,occ:0.66},"Madinat Dubai Almelaheyah":{nightly:650,occ:0.73},"Ras Al Khor Industrial First":{nightly:270,occ:0.48},"Madinat Hind 4":{nightly:330,occ:0.7},"Al Barsha South Fifth":{nightly:250,occ:0.74},"Zaabeel First":{nightly:540,occ:0.73},"Al Hebiah Sixth":{nightly:370,occ:0.74},"Al Safouh First":{nightly:620,occ:0.67},"Trade Center First":{nightly:480,occ:0.76},"Jabal Ali Industrial Second":{nightly:160,occ:0.49},"Al Kifaf":{nightly:650,occ:0.69},"Zaabeel Second":{nightly:890,occ:0.69},"Island 2":{nightly:1850,occ:0.79},"Trade Center Second":{nightly:580,occ:0.72},"Muhaisanah First":{nightly:160,occ:0.69},"Saih Shuaib 1":{nightly:140,occ:0.5},"Hessyan First":{nightly:260,occ:0.45},"Rega Al Buteen":{nightly:220,occ:0.72},"Al Hebiah Third":{nightly:410,occ:0.75},"Nad Al Hamar":{nightly:390,occ:0.69},"Jumeirah Second":{nightly:1220,occ:0.65},"Al Qusais Industrial Fourth":{nightly:160,occ:0.67},"World Islands":{nightly:1670,occ:0.44},"Al Yelayiss 4":{nightly:190,occ:0.71},"Al Qusais Industrial Fifth":{nightly:160,occ:0.72},"Deira":{nightly:300,occ:0.74},"Al Karama":{nightly:200,occ:0.67},"Al Mamzar":{nightly:190,occ:0.66},"Al Rashidiya":{nightly:170,occ:0.68},"Al Twar":{nightly:160,occ:0.66},"Al Warqaa":{nightly:170,occ:0.67},"Al Mizhar":{nightly:350,occ:0.56},"Al Khawaneej":{nightly:400,occ:0.59},"Al Garhoud":{nightly:220,occ:0.72},"Al Muraqqabat":{nightly:190,occ:0.65},"Al Rigga":{nightly:200,occ:0.68},"Hor Al Anz":{nightly:160,occ:0.7},"Abu Hail":{nightly:170,occ:0.65},"Al Muteena":{nightly:180,occ:0.67},"Port Saeed":{nightly:260,occ:0.75},"Naif":{nightly:150,occ:0.62},"Al Mankhool":{nightly:210,occ:0.67},"Al Raffa":{nightly:190,occ:0.68},"Oud Metha":{nightly:270,occ:0.71},"Umm Hurair":{nightly:240,occ:0.65},"Dubai Healthcare City":{nightly:280,occ:0.75},"Al Safa":{nightly:390,occ:0.75},"Jumeirah Third":{nightly:420,occ:0.73},"Madinat Jumeirah Living":{nightly:580,occ:0.68},"Jumeirah Heights":{nightly:300,occ:0.75},"The Gardens":{nightly:170,occ:0.66},"Umm Ramool":{nightly:190,occ:0.72},"Al Hamriya":{nightly:140,occ:0.68},"Al Fahidi":{nightly:190,occ:0.67},"Hatta":{nightly:150,occ:0.44},"Al Lisaili":{nightly:130,occ:0.46},"Al Awir":{nightly:150,occ:0.48},"Layan":{nightly:450,occ:0.57},"Rukan":{nightly:430,occ:0.61},"Sobha Hartland 2":{nightly:450,occ:0.74},"Mina Seyahi":{nightly:550,occ:0.76},"Dubai Knowledge Park":{nightly:270,occ:0.71},"Al Qusais":{nightly:160,occ:0.72},"Umm Al Sheif":{nightly:300,occ:0.71},"Al Hudaiba":{nightly:280,occ:0.69},"Nad Shamma":{nightly:140,occ:0.66},"Margham":{nightly:120,occ:0.49},"Lehbab":{nightly:130,occ:0.48},"Umm Nahad":{nightly:150,occ:0.49},"Al Rowaiyah":{nightly:150,occ:0.65},"Dubai Academic City":{nightly:190,occ:0.7},"Dubailand Oasis":{nightly:170,occ:0.72},"Al Hebiah First":{nightly:190,occ:0.65},"Al Hebiah Fourth":{nightly:190,occ:0.67},"Al Hebiah Fifth":{nightly:190,occ:0.72},"Al Thanayah First":{nightly:270,occ:0.73},"Al Thanayah Second":{nightly:270,occ:0.69},"Al Thanayah Third":{nightly:270,occ:0.72},"Al Thanayah Fifth":{nightly:270,occ:0.72},"Warsan":{nightly:150,occ:0.62},"Warsan First":{nightly:150,occ:0.62},"Warsan Second":{nightly:150,occ:0.66},"Warsan Third":{nightly:150,occ:0.63},"Al Barsha South Third":{nightly:260,occ:0.74},"Al Barsha South Fourth":{nightly:260,occ:0.75},"Wadi Al Safa 2":{nightly:140,occ:0.69},"Wadi Al Safa 3":{nightly:140,occ:0.62},"Wadi Al Safa 4":{nightly:140,occ:0.63},"Wadi Al Safa 5":{nightly:140,occ:0.64},"District One":{nightly:1500,occ:0.6},"Creek Beach":{nightly:620,occ:0.73},"Dubai Creek Golf":{nightly:300,occ:0.73},"Jumeirah Bay":{nightly:1370,occ:0.67},"Saadiyat Lagoons":{nightly:700,occ:0.61},"Dubai Outsource City":{nightly:210,occ:0.66},"Dubai Knowledge Village":{nightly:260,occ:0.71},"Dubai Techno Park":{nightly:190,occ:0.69},"Dubai Waterfront":{nightly:200,occ:0.72},"Jebel Ali Industrial First":{nightly:120,occ:0.51},"Jebel Ali Gardens":{nightly:140,occ:0.64},"Muhaisnah Fourth":{nightly:140,occ:0.62},"Al Qusais Second":{nightly:160,occ:0.7},"Al Qusais Third":{nightly:160,occ:0.65},"Ras Al Khor Industrial Second":{nightly:140,occ:0.52},"Ras Al Khor Industrial Third":{nightly:140,occ:0.55},"Jabal Ali Industrial First":{nightly:120,occ:0.53},"Jabal Ali Industrial Third":{nightly:120,occ:0.52},"Al Barshaa South Third":{nightly:260,occ:0.75},"Masakin Al Furjan":{nightly:260,occ:0.69},"Dubai World Central":{nightly:190,occ:0.65},"Rashid Yachts Marina":{nightly:680,occ:0.79},"Dubai Logistics City":{nightly:140,occ:0.55},"Muhaisanah Second":{nightly:140,occ:0.65},"Muhaisanah Third":{nightly:140,occ:0.68},"Muhaisanah Fourth":{nightly:140,occ:0.67},"Al Manara":{nightly:360,occ:0.72},"Umm Suqeim First":{nightly:360,occ:0.72},"Umm Suqeim Second":{nightly:360,occ:0.74},"Umm Suqeim Third":{nightly:420,occ:0.71},"Al Quoz First":{nightly:160,occ:0.69},"Al Quoz Second":{nightly:160,occ:0.65},"Al Quoz Third":{nightly:160,occ:0.7},"Al Quoz Fourth":{nightly:160,occ:0.67},"Al Quoz Industrial First":{nightly:120,occ:0.53},"Al Quoz Industrial Second":{nightly:120,occ:0.55},"Al Quoz Industrial Third":{nightly:120,occ:0.52},"Al Quoz Industrial Fourth":{nightly:120,occ:0.51},"Badrah":{nightly:160,occ:0.69},"Dubai Residence Complex 2":{nightly:160,occ:0.66},"Al Jadaf":{nightly:260,occ:0.71},"Akoya Oxygen":{nightly:150,occ:0.67},"Dubai Star":{nightly:270,occ:0.69},"Mina Rashid Marina":{nightly:580,occ:0.78},"Al Merkad":{nightly:250,occ:0.75},"Bukadra Second":{nightly:150,occ:0.68},"Saih Shuaib 3":{nightly:190,occ:0.44},"Saih Shuaib 4":{nightly:190,occ:0.45},"Hessyan Second":{nightly:200,occ:0.47},"Hessyan Third":{nightly:200,occ:0.44},"Nadd Hessa Second":{nightly:260,occ:0.68},"Al Barsha First":{nightly:280,occ:0.74},"Al Barsha Second":{nightly:260,occ:0.7},"Al Barsha Third":{nightly:250,occ:0.73},"Jebel Ali Hills":{nightly:450,occ:0.62},"Downtown Jebel Ali":{nightly:170,occ:0.65},"Damac Tower":{nightly:420,occ:0.7},"Burj Khalifa Zone":{nightly:750,occ:0.74},"Marsa Dubai":{nightly:580,occ:0.77},"Palm Deira":{nightly:420,occ:0.68},"The Lagoons":{nightly:550,occ:0.66},"Gardenia":{nightly:380,occ:0.59},"Azizi Riviera":{nightly:270,occ:0.69},"Dubai Hills View":{nightly:330,occ:0.7},"Burj Views":{nightly:430,occ:0.68},"Executive Towers":{nightly:390,occ:0.73},"Bay Square":{nightly:360,occ:0.7},"Hadaeq Sheikh Mohammed Bin Rashid":{nightly:700,occ:0.62},"Al Sufouh First":{nightly:320,occ:0.71},"Al Sufouh Second":{nightly:320,occ:0.75},"Mushrif Park":{nightly:400,occ:0.56}};
if(!window.PORTFOLIO_STATE){
  var _pa;try{_pa=JSON.parse(localStorage.getItem("dubaival_portfolio"))||[];}catch(e){_pa=[];}
  var _pg;try{_pg=JSON.parse(localStorage.getItem("dubaival_portfolio_goals"))||{risk:"Moderate",horizon:"3-5 years",target:"Capital Growth"};}catch(e){_pg={risk:"Moderate",horizon:"3-5 years",target:"Capital Growth"};}
  window.PORTFOLIO_STATE={assets:_pa,goals:_pg,showAdd:false,aiAnalysis:"",aiLoading:false,aiErr:"",expandedId:null};
}
// ── Portfolio value history (added 2026-07-17) ──────────────────────────────
// user_portfolios (supabase-user-profiles-schema.sql) already cloud-syncs the
// CURRENT asset list/goals for signed-in users (see syncPortfolioToCloud() /
// syncPortfolioFromCloud() / portfolioChanged() in js/auth.js) — but nothing
// ever recorded how total value moved over time, so there was no way to see
// a real trend, only a live snapshot. This adds one throttled snapshot write
// per signed-in user per day (never more — see the localStorage date guard)
// into portfolio_value_snapshots (supabase-portfolio-history-schema.sql,
// requires manual execution), plus a fetch + SVG line chart on the Health tab.
function _portfolioSnapshotHeaders(token){
  return {"apikey":SUPABASE_KEY,"Authorization":"Bearer "+(token||localStorage.getItem("dv_access_token")||SUPABASE_KEY),"Content-Type":"application/json"};
}
async function _capturePortfolioSnapshot(totalValue,totalPurchase,totalROI,avgGrossYield,avgNetYield,assetCount){
  if(typeof DV_AUTH==="undefined"||!DV_AUTH.user||!assetCount)return;
  var today=new Date().toISOString().slice(0,10);
  if(localStorage.getItem("dv_portfolio_snapshot_date")===today)return;
  try{
    var token=(typeof getValidToken==="function")?await getValidToken():localStorage.getItem("dv_access_token");
    if(!token)return;
    var body={user_id:DV_AUTH.user.id,snapshot_date:today,total_value:Math.round(totalValue),total_purchase:Math.round(totalPurchase),total_roi:Math.round(totalROI*10)/10,avg_gross_yield:Math.round(avgGrossYield*10)/10,avg_net_yield:Math.round(avgNetYield*10)/10,asset_count:assetCount};
    var r=await fetch(SUPABASE_URL+"/rest/v1/portfolio_value_snapshots",{
      method:"POST",
      headers:Object.assign({},_portfolioSnapshotHeaders(token),{"Prefer":"resolution=merge-duplicates,return=minimal"}),
      body:JSON.stringify(body)
    });
    if(r.ok){localStorage.setItem("dv_portfolio_snapshot_date",today);if(window.PORTFOLIO_STATE)window.PORTFOLIO_STATE._history=undefined;}
  }catch(e){}
}
async function _fetchPortfolioHistory(){
  if(typeof DV_AUTH==="undefined"||!DV_AUTH.user)return[];
  try{
    var token=(typeof getValidToken==="function")?await getValidToken():localStorage.getItem("dv_access_token");
    if(!token)return[];
    var r=await fetch(SUPABASE_URL+"/rest/v1/portfolio_value_snapshots?user_id=eq."+DV_AUTH.user.id+"&order=snapshot_date.asc&limit=180",{headers:_portfolioSnapshotHeaders(token)});
    if(!r.ok)return[];
    return await r.json();
  }catch(e){return[];}
}
// Same smoothed cubic-bezier SVG line-chart technique already used by the
// Market Dashboard's PSF Trend chart (js/market.js) — kept self-contained
// here rather than extracted into a shared helper, matching this codebase's
// existing per-file chart convention.
function _renderPortfolioHistoryChart(cl,rows){
  var wrap=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px"});
  wrap.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"◆ Portfolio Value History"));
  var values=rows.map(function(r){return r.total_value;});
  var labels=rows.map(function(r){return r.snapshot_date;});
  var n=values.length;
  var minV=Math.min.apply(null,values),maxV=Math.max.apply(null,values);
  var first=values[0],last=values[n-1];
  var changePct=first>0?((last-first)/first*100):0;
  var isUp=last>=first;
  var statsRow=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"});
  [
    {l:"Current Value",v:"AED "+Math.round(last).toLocaleString(),c:cl.gold},
    {l:"Since First Snapshot",v:(isUp?"+":"")+changePct.toFixed(1)+"%",c:isUp?cl.green:cl.red},
    {l:"Range",v:"AED "+Math.round(minV/1000)+"K–"+Math.round(maxV/1000)+"K",c:cl.sub}
  ].forEach(function(s){
    var cell=div({background:cl.raised,borderRadius:"8px",padding:"8px 10px"});
    cell.appendChild(div({color:cl.sub,fontSize:"7.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},s.l));
    cell.appendChild(div({color:s.c,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},s.v));
    statsRow.appendChild(cell);
  });
  wrap.appendChild(statsRow);
  var chartH=110,chartW=600,padL=44,padR=10,padT=10,padB=22;
  var plotW=chartW-padL-padR,plotH=chartH-padT-padB;
  var yRound=Math.max(1,Math.pow(10,Math.floor(Math.log10(Math.max(1,maxV-minV||maxV)))-1));
  var yMin=Math.floor(minV*0.96/yRound)*yRound;
  var yMax=Math.ceil(maxV*1.04/yRound)*yRound;
  function xPos(i){return n>1?padL+i/(n-1)*plotW:padL+plotW/2;}
  function yPos(v){return yMax>yMin?padT+plotH-(v-yMin)/(yMax-yMin)*plotH:padT+plotH/2;}
  var pathD="M"+xPos(0)+","+yPos(values[0]);
  for(var i=1;i<n;i++){
    var x0=xPos(i-1),y0=yPos(values[i-1]),x1=xPos(i),y1=yPos(values[i]);
    var cx=(x0+x1)/2;
    pathD+=" C"+cx+","+y0+" "+cx+","+y1+" "+x1+","+y1;
  }
  var fillD=pathD+" L"+xPos(n-1)+","+(padT+plotH)+" L"+padL+","+(padT+plotH)+" Z";
  var lineColor=isUp?"#10B981":"#EF4444";
  var xLabelStep=Math.max(1,Math.floor(n/6));
  var xLabels=[];
  for(var j=0;j<n;j+=xLabelStep){
    xLabels.push('<text x="'+xPos(j)+'" y="'+(padT+plotH+15)+'" fill="'+hexAlpha(cl.sub,0.6)+'" font-size="8" text-anchor="middle" font-family="monospace">'+labels[j].slice(5)+'</text>');
  }
  var gradId="dvPfHist"+Date.now();
  var svgHTML='<svg viewBox="0 0 '+chartW+' '+chartH+'" style="width:100%;height:auto;display:block;">'+
    '<defs><linearGradient id="'+gradId+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+lineColor+'" stop-opacity="0.2"/><stop offset="100%" stop-color="'+lineColor+'" stop-opacity="0"/></linearGradient></defs>'+
    '<path d="'+fillD+'" fill="url(#'+gradId+')"/>'+
    '<path d="'+pathD+'" fill="none" stroke="'+lineColor+'" stroke-width="2" stroke-linecap="round"/>'+
    xLabels.join('')+
    '</svg>';
  var svgWrap=div({borderRadius:"8px",overflow:"hidden",background:cl.raised});
  svgWrap.innerHTML=svgHTML;
  wrap.appendChild(svgWrap);
  wrap.appendChild(div({marginTop:"8px",color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},n+" snapshot(s) · "+labels[0]+" to "+labels[n-1]+" · one snapshot captured per day you visit"));
  return wrap;
}
// ── Portfolio PDF Report (added 2026-07-17) ─────────────────────────────────
// Reuses the EXACT SAME print/PDF mechanism the Analyzer's generatePDF()
// (js/app.js) already established — build an HTML string, inject into the
// shared #print-report div, window.print(), clear afterward — no new library.
// Pro-gated the same way (isProUser()/openUpgradeModal()), since a polished
// branded portfolio report is the kind of thing an agent would pay for to
// hand to a client, matching the Analyzer PDF's existing Pro gate.
function generatePortfolioPDF(metrics,totalValue,totalPurchase,totalROI,avgGrossYield,avgNetYield,health){
  if(typeof isProUser==="function"&&!isProUser()){if(typeof openUpgradeModal==="function")openUpgradeModal();return;}
  if(!metrics.length)return;
  var now=new Date();
  var dateStr=now.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
  var areaDist={};
  metrics.forEach(function(a){areaDist[a.area]=(areaDist[a.area]||0)+a.m.currentValue;});
  var areaEntries=Object.entries(areaDist).sort(function(a,b){return b[1]-a[1];});
  var pnl=totalValue-totalPurchase;

  var h='<div style="width:210mm;min-height:297mm;padding:18mm 16mm;box-sizing:border-box;font-family:Inter,sans-serif">';
  h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #C9A84C;padding-bottom:12px;margin-bottom:20px">';
  h+='<div><div style="font-size:20px;font-weight:800"><span style="color:#111">Dub</span><span style="color:#C9A84C">AI</span><span style="color:#111">Val</span></div>';
  h+='<div style="font-size:9px;color:#888;letter-spacing:0.12em;text-transform:uppercase">Property Intelligence &bull; DLD-Verified</div></div>';
  h+='<div style="text-align:right;font-size:10px;color:#666">';
  h+='<div style="font-weight:700;font-size:12px;color:#111">Portfolio Report</div>';
  h+='<div>'+dateStr+'</div>';
  if(health)h+='<div style="margin-top:3px;font-size:9px;color:#C9A84C">Health Score: '+health.score+'/100 ('+health.tier+')</div>';
  h+='</div></div>';

  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:18px">';
  [
    {l:"Total Value",v:"AED "+Math.round(totalValue).toLocaleString()},
    {l:"Total ROI",v:(totalROI>=0?"+":"")+totalROI.toFixed(1)+"%"},
    {l:"Gross Yield",v:avgGrossYield.toFixed(1)+"%"},
    {l:"Net Yield",v:avgNetYield.toFixed(1)+"%"},
    {l:"Assets",v:String(metrics.length)},
    {l:"Unrealized P&L",v:(pnl>=0?"+":"")+"AED "+Math.round(pnl).toLocaleString()}
  ].forEach(function(m){
    h+='<div style="border:1px solid #e0e0e0;border-radius:6px;padding:10px 12px">';
    h+='<div style="font-size:8.5px;text-transform:uppercase;letter-spacing:0.1em;color:#888;margin-bottom:3px">'+m.l+'</div>';
    h+='<div style="font-size:15px;font-weight:700;color:#111">'+m.v+'</div>';
    h+='</div>';
  });
  h+='</div>';

  h+='<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#C9A84C;font-weight:700;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e0e0e0">Area Allocation</div>';
  h+='<div style="margin-bottom:18px">';
  areaEntries.forEach(function(e){
    var pct=(e[1]/totalValue*100).toFixed(0);
    h+='<div style="display:flex;justify-content:space-between;font-size:11px;color:#333;padding:4px 0;border-bottom:1px solid #f0f0f0">';
    h+='<span>'+e[0]+'</span><span style="font-weight:700">'+pct+'% &bull; AED '+Math.round(e[1]).toLocaleString()+'</span></div>';
  });
  h+='</div>';

  h+='<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#C9A84C;font-weight:700;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e0e0e0">Assets</div>';
  h+='<table style="width:100%;border-collapse:collapse;font-size:9.5px;margin-bottom:18px">';
  h+='<tr style="background:#f8f8f8"><th style="text-align:left;padding:6px 8px;color:#666">Property</th><th style="text-align:left;padding:6px 8px;color:#666">Area</th><th style="text-align:right;padding:6px 8px;color:#666">Value</th><th style="text-align:right;padding:6px 8px;color:#666">ROI</th><th style="text-align:right;padding:6px 8px;color:#666">Net Yield</th><th style="text-align:right;padding:6px 8px;color:#666">Signal</th></tr>';
  metrics.forEach(function(a){
    h+='<tr style="border-bottom:1px solid #eee">';
    h+='<td style="padding:6px 8px;color:#111;font-weight:600">'+(a.building||a.area)+'</td>';
    h+='<td style="padding:6px 8px;color:#555">'+a.area+'</td>';
    h+='<td style="padding:6px 8px;text-align:right;color:#111">AED '+Math.round(a.m.currentValue).toLocaleString()+'</td>';
    h+='<td style="padding:6px 8px;text-align:right;color:'+(a.m.roi>=0?"#10B981":"#EF4444")+'">'+(a.m.roi>=0?"+":"")+a.m.roi.toFixed(1)+'%</td>';
    h+='<td style="padding:6px 8px;text-align:right;color:#111">'+a.m.netYield.toFixed(1)+'%</td>';
    h+='<td style="padding:6px 8px;text-align:right;color:#555">'+a.m.investSignal+'</td>';
    h+='</tr>';
  });
  h+='</table>';

  if(health){
    h+='<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#C9A84C;font-weight:700;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e0e0e0">Portfolio Health</div>';
    h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:12px">';
    [{l:"Diversification",v:health.div},{l:"Liquidity",v:health.liq},{l:"Risk-Return",v:health.rr},{l:"Growth",v:health.gr}].forEach(function(c){
      h+='<div style="border:1px solid #e0e0e0;border-radius:6px;padding:8px 10px;text-align:center">';
      h+='<div style="font-size:8px;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:3px">'+c.l+'</div>';
      h+='<div style="font-size:14px;font-weight:700;color:#111">'+c.v+'</div></div>';
    });
    h+='</div>';
    if(health.insight)h+='<div style="font-size:10.5px;color:#555;background:#fdf8ef;border-left:3px solid #C9A84C;padding:8px 12px;margin-bottom:18px">'+health.insight+'</div>';
  }

  h+='<div style="border-top:1px solid #e0e0e0;padding-top:14px;margin-top:14px;text-align:right">';
  h+='<div style="font-weight:700;font-size:13px"><span style="color:#111">Dub</span><span style="color:#C9A84C">AI</span><span style="color:#111">Val</span></div><div style="font-size:10px;color:#888">dubaival.com</div>';
  h+='</div>';
  h+='<div style="font-size:8px;color:#aaa;margin-top:16px;border-top:1px solid #eee;padding-top:8px">Valuations use DubAIVal\'s Cascade AVM with hedonic pricing (11,700+ properties &bull; 347 areas). This is an AI-generated estimate for informational purposes only and is not a RERA- or RICS-certified valuation. Not financial advice — consult a licensed advisor for investment decisions. &bull; Generated '+dateStr+'</div>';
  h+='</div>';

  var printEl=document.getElementById("print-report");
  if(printEl)printEl.innerHTML=h;
  setTimeout(function(){
    window.print();
    setTimeout(function(){if(printEl)printEl.innerHTML="";},2000);
  },150);
}
function computeAssetMetrics(asset){
  // Shares the exact same base-PSF resolution + full hedonic premium stack
  // (view/floor grade-differential logic, loft/penthouse/maid/study/pool/
  // corner-villa premiums, momentum + calibration factors, comparable-sales
  // blending) as the Analyzer (computeValuation, js/valuation.js) via
  // computeAdjustedPSF() — previously this was a separate, incomplete
  // reimplementation that had drifted out of sync (raw view% instead of
  // grade-differential, no villa floor-premium guard, several premium
  // categories missing entirely), so the same unit could show a materially
  // different value depending on whether you checked it here or in the
  // Analyzer. The Admin panel's apartment/villa risk-adjustment sliders
  // (typeAdj) are now applied inside computeAdjustedPSF() itself, so it's
  // already baked into adj.adjPSF here — no separate application needed.
  var isV=asset.type==="Villa"||asset.type==="Townhouse";
  var adj=computeAdjustedPSF({area:asset.area,building:asset.building,propCategory:isV?"villa":"apartment",
    beds:asset.beds,floor:asset.floor,view:asset.view||"Not specified",size:asset.size,
    furnished:asset.furnished,serviceCharge:asset.serviceCharge,parking:asset.parking},asset.building,null);
  var aData=adj.aData;
  var bData=adj.bData;
  var vdbE=adj.vdbEntry;
  var adjPSF=adj.adjPSF;
  var size=parseInt(asset.size)||0;
  var currentValue=adjPSF*size;
  var purchasePrice=parseInt(asset.purchasePrice)||0;
  // Real cost basis (added 2026-07-18) — agency/DLD/renovation costs actually
  // paid, not just the raw purchase price, so ROI/P&L reflect true cash in.
  var extraCosts=parseFloat(asset.extraCosts)||0;
  var costBasis=purchasePrice+extraCosts;
  var roi=costBasis>0?((currentValue-costBasis)/costBasis*100):0;
  var bn={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5}[asset.beds]!=null?{"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5}[asset.beds]:2;
  var estRent=isV?(bn<=2?aData.rv2||130000:bn<=3?aData.rv3||180000:bn<=4?aData.rv4||240000:bn<=5?aData.rv5||350000:bn<=6?aData.rv6||500000:aData.rv7||650000):bn===0?(aData.rStudio||(aData.r1||65000)*0.65):bn===1?aData.r1||65000:bn===2?aData.r2||100000:bn===3?aData.r3||150000:(aData.r3||150000)*1.4;
  // Real rent, when the user has entered what they actually collect (added
  // 2026-07-18) — used for every yield/return figure below instead of the
  // area-model estimate, since a portfolio manager should report on the
  // owner's real cash flow whenever it's known. estRent/rentIsActual are
  // still exposed so the UI and the Rent Optimization alert can show both.
  var hasActualRent=asset.actualRent!==undefined&&asset.actualRent!==null&&String(asset.actualRent).trim()!=="";
  var rent=hasActualRent?(parseFloat(asset.actualRent)||0):estRent;
  var rentIsActual=hasActualRent&&rent>0;
  var sc=(parseFloat(asset.serviceCharge)||(bData&&bData.sc)||aData.sc||15)*size;
  var grossYield=currentValue>0?(rent/currentValue*100):0;
  var netYield=currentValue>0?((rent-sc)/currentValue*100):0;
  var gr=aData.g||[3,9,16];
  var purchaseDate=new Date(asset.purchaseDate);
  var now=new Date();
  var holdingMonths=Math.max(1,Math.round((now-purchaseDate)/(30.44*24*60*60*1000)));
  var holdingYears=holdingMonths/12;
  var annualizedROI=holdingYears>0&&costBasis>0?(Math.pow(currentValue/costBasis,1/holdingYears)-1)*100:roi;
  // Real leverage position (added 2026-07-18) — asset.mortgage is now a real,
  // user-entered field (previously referenced by the Equity Release alert
  // below but never actually settable anywhere, so releasable equity was
  // always computed as if the property had zero debt).
  var mortgage=parseFloat(asset.mortgage)||0;
  var netEquity=currentValue-mortgage;
  var prRatio=grossYield>0?(100/grossYield):20;
  var investSignal=prRatio<15?"Undervalued":prRatio<20?"Fair Value":prRatio<25?"Elevated":"Overheated";
  var totalReturn=netYield+(gr[1]||9)/3;
  var domEst=aData.dom||60;
  var txVol=aData.txVol||100;
  var liqScore=domEst<=20?95:domEst<=30?85:domEst<=45?72:domEst<=65?55:domEst<=90?40:25;
  var liqLabel=liqScore>=90?"Very High":liqScore>=80?"High":liqScore>=65?"Moderate":liqScore>=45?"Low":liqScore>=30?"Very Low":"Illiquid";
  var bldgUnits=estimateBldgUnits(asset.building,bData,isV);
  var bldgAnnualTx=estimateBldgTx(asset.building,asset.area,aData,bData);
  var turnoverRate=bldgUnits>0?Math.round(bldgAnnualTx/bldgUnits*1000)/10:0;
  var turnoverLabel=turnoverRate>=12?"Hot Market":turnoverRate>=6?"Active":turnoverRate>=3?"Stable":turnoverRate>=1?"Slow":"Stagnant";
  // MoS for portfolio
  var purchasePSF=purchasePrice>0&&size>0?Math.round(purchasePrice/size):0;
  var camVsPct=purchasePSF>0&&adjPSF>0?((purchasePSF-adjPSF)/adjPSF*100):0;
  var camPriceGap=camVsPct<=-20?95:camVsPct<=-12?85:camVsPct<=-5?72:camVsPct<=0?58:camVsPct<=5?42:camVsPct<=12?25:10;
  var camScPSF=parseFloat(asset.serviceCharge)||(bData&&bData.sc)||aData.sc||15;
  var camExpectedSC=bData&&bData.sc?bData.sc:aData.sc||15;
  var camScRatio=camExpectedSC>0?camScPSF/camExpectedSC:1;
  var camScScore=camScRatio<=0.85?90:camScRatio<=1.05?80:camScRatio<=1.20?60:camScRatio<=1.50?40:20;
  var camGrade=bData?bData.g:null;
  var camGradeBonus=camGrade==="Ultra"?15:camGrade==="A+"?12:camGrade==="A"?8:camGrade==="A-"?5:camGrade==="B+"?2:0;
  var camTimeDecay=Math.min(95,camScScore+camGradeBonus);
  var camMdRef=vdbE?vdbE.p:(bData?bData.p:aData.psf||1500);
  var camMdRange=vdbE?Math.max(1,vdbE.hi-vdbE.lo):(bData?Math.max(1,(bData.hi||camMdRef)-(bData.lo||camMdRef)):camMdRef*0.30);
  var camMdMid=vdbE?(vdbE.lo+vdbE.hi)/2:(bData?(bData.lo+bData.hi)/2:camMdRef);
  var camPsfDev=camMdRef>0?Math.abs(adjPSF-camMdMid)/(camMdRange||camMdRef*0.30):0.5;
  var camMarketDepth=camPsfDev<=0.5?90:camPsfDev<=1.0?72:camPsfDev<=1.5?50:camPsfDev<=2.5?30:15;
  var camMosScore=Math.min(95,Math.max(5,Math.round(camPriceGap*0.50+camTimeDecay*0.20+camMarketDepth*0.30)));
  var camMosTier=camMosScore>=80?"Deep Value":camMosScore>=65?"Value Buy":camMosScore>=50?"Fair Entry":camMosScore>=35?"Thin Margin":"Speculative";
  return{currentPSF:adjPSF,currentValue:currentValue,purchasePrice:purchasePrice,extraCosts:extraCosts,costBasis:costBasis,roi:roi,rent:rent,estRent:estRent,rentIsActual:rentIsActual,mortgage:mortgage,netEquity:netEquity,sc:sc,grossYield:grossYield,netYield:netYield,holdingMonths:holdingMonths,annualizedROI:annualizedROI,g0:gr[0],g1:gr[1],g2:gr[2],inDB:!!bData,grade:bData?bData.g:"N/A",areaYield:aData.y||[5,7],investSignal:investSignal,totalReturn:totalReturn,domEst:domEst,txVol:txVol,liqScore:liqScore,liqLabel:liqLabel,turnoverRate:turnoverRate,turnoverLabel:turnoverLabel,bldgUnits:bldgUnits,bldgAnnualTx:bldgAnnualTx,mosScore:camMosScore,mosTier:camMosTier};
}
function computePortfolioHealth(metrics,totalValue){
if(!metrics.length)return null;
// Value-weighted, not asset-count-averaged (fixed 2026-07-18 Health audit):
// a portfolio composite score built from a plain per-asset average treats a
// single AED 20M holding the same as one of nine AED 200K ones — wrong for
// a health score meant to represent where the ACTUAL capital sits. Every
// per-asset average below is now weighted by that asset's own currentValue
// share of totalValue (falls back to equal weighting only in the
// zero-value edge case, which can't really occur once metrics.length>0).
function wAvg(fn){
  if(totalValue<=0)return metrics.reduce(function(s,a){return s+fn(a);},0)/metrics.length;
  return metrics.reduce(function(s,a){return s+fn(a)*(a.m.currentValue/totalValue);},0);
}
var ad={},td={};
metrics.forEach(function(a){ad[a.area]=(ad[a.area]||0)+a.m.currentValue;var t=a.type||"Apartment";td[t]=(td[t]||0)+a.m.currentValue;});
var hhi=0;Object.values(ad).forEach(function(v){var s=v/totalValue;hhi+=s*s;});
var nA=Object.keys(ad).length;var minH=nA>1?1/nA:1;var hhNorm=1>minH?(1-hhi)/(1-minH):0;
var areaSc=10+hhNorm*85;
// Type diversification — was a crude binary "has both apartment and villa"
// check (55 or 88, nothing in between); now uses the same HHI concentration
// math as area diversification above, across every distinct property type
// actually present (Apartment/Villa/Townhouse/Penthouse), so 2 types with a
// lopsided 95/5 split scores lower than a genuine 50/50 split, and 3+ types
// scores higher than either — matching how real diversification works
// (fixed 2026-07-18).
var nT=Object.keys(td).length;
var hhiT=0;Object.values(td).forEach(function(v){var s=v/totalValue;hhiT+=s*s;});
var minHT=nT>1?1/nT:1;var hhNormT=1>minHT?(1-hhiT)/(1-minHT):0;
var typeSc=nT>1?Math.round(20+hhNormT*70):40;
var hasBoth=nT>1;
var divSc=Math.round(areaSc*0.7+typeSc*0.3);
var avgLiq=wAvg(function(a){return a.m.liqScore;});
var avgTO=wAvg(function(a){return a.m.turnoverRate;});
var toB=avgTO>=8?15:avgTO>=4?10:avgTO>=2?5:0;
var liqSc=Math.min(95,Math.round(avgLiq*0.8+toB+10));
var avgNY=wAvg(function(a){return a.m.netYield;});
var avgMoS=wAvg(function(a){return a.m.mosScore;});
var ySc=avgNY>=7?92:avgNY>=5.5?80:avgNY>=4?65:avgNY>=2.5?45:25;
// Leverage risk (added 2026-07-18) — folded into Risk-Return, not a new 5th
// pillar, since leverage is precisely a risk-adjustment on returns, not a
// separate concern like diversification/liquidity/growth. Uses the real
// mortgage data added this session — previously the health score had zero
// awareness of debt, so a heavily-leveraged portfolio scored identically
// to an all-cash one at the same nominal yield, despite carrying
// materially more real risk (margin calls, rate exposure, refinancing risk).
var totalMortgage=metrics.reduce(function(s,a){return s+(a.m.mortgage||0);},0);
var avgLTV=totalValue>0?totalMortgage/totalValue:0;
var ltvPenalty=avgLTV>=0.80?18:avgLTV>=0.65?10:avgLTV>=0.50?5:0;
var rrSc=Math.max(10,Math.round(ySc*0.6+avgMoS*0.4)-ltvPenalty);
var avgROI=wAvg(function(a){return a.m.roi;});
var avgTR=wAvg(function(a){return a.m.totalReturn;});
var roiSc=avgROI>=30?95:avgROI>=15?82:avgROI>=5?68:avgROI>=0?50:avgROI>=-10?30:15;
var trSc=avgTR>=10?90:avgTR>=7?75:avgTR>=5?60:avgTR>=3?40:20;
var grSc=Math.round(roiSc*0.5+trSc*0.5);
var raw=Math.round(divSc*0.25+liqSc*0.25+rrSc*0.25+grSc*0.25);
var score=Math.min(95,Math.max(5,raw));
var tier=score>=85?"Excellent":score>=70?"Strong":score>=55?"Moderate":score>=40?"Needs Attention":"At Risk";
var weakest="div";var wVal=divSc;
if(liqSc<wVal){weakest="liq";wVal=liqSc;}if(rrSc<wVal){weakest="rr";wVal=rrSc;}if(grSc<wVal){weakest="gr";wVal=grSc;}
var insight="";
if(weakest==="div"){if(nA<2)insight="Consider diversifying across multiple areas to reduce concentration risk";else if(!hasBoth)insight="Adding a different property type (villa, townhouse, etc.) would improve type diversification";else insight="Strong diversification — maintain balance across areas and types";}
else if(weakest==="liq")insight="Some assets are in low-liquidity markets — monitor exit timing carefully";
else if(weakest==="rr"){if(ltvPenalty>=10)insight="High portfolio leverage (avg LTV ~"+Math.round(avgLTV*100)+"%) is dragging down risk-adjusted returns — consider paying down debt or diversifying financing";else insight="Risk-adjusted returns could improve — look for higher-yield or better-value entries";}
else insight="Growth outlook is your weakest dimension — consider areas with stronger appreciation trends";
return{score:score,tier:tier,div:divSc,liq:liqSc,rr:rrSc,gr:grSc,insight:insight,nAreas:nA,hasBoth:hasBoth,avgLTV:avgLTV};
}
function renderPortfolio(mode){
  mode=mode||"assets";
  var cl=C();var ps=window.PORTFOLIO_STATE;
  var wrap=div({padding:"20px",maxWidth:"640px",margin:"0 auto"});
  var titles={assets:"Portfolio Manager",health:"Portfolio Health",projections:"Projections & What-If"};
  var descs={assets:"Track assets, monitor performance & get AI-powered signals",health:"Health score, diversification analysis & opportunity alerts",projections:"Future projections, scenario analysis & swap simulator"};
  // Premium header
  var _phdr=el('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',paddingBottom:'16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}});
  var _phdrL=el('div',{});
  _phdrL.appendChild(div({fontSize:'10px',color:'#6B7A9E',fontWeight:'700',fontFamily:"'Inter',sans-serif",letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:'4px'},'Investment Management'));
  _phdrL.appendChild(div({fontSize:'22px',fontWeight:'800',color:cl.white,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'-0.02em',lineHeight:'1'},titles[mode]||titles.assets));
  _phdr.appendChild(_phdrL);
  // projections uses blue, not purple — #8B5CF6 is reserved app-wide for rental-mode UI
  var _pmodeColors={assets:'#D4A843',health:'#10B981',projections:'#3B82F6'};
  var _pmc=_pmodeColors[mode]||'#D4A843';
  var _pbadge=el('div',{style:{display:'flex',alignItems:'center',gap:'5px',background:hexAlpha(_pmc,0.08),border:'1px solid '+hexAlpha(_pmc,0.20),borderRadius:'20px',padding:'5px 11px',flexShrink:'0'}});
  var _pdot=el('div',{style:{width:'6px',height:'6px',borderRadius:'50%',background:_pmc,animation:'dvPulse 2s ease infinite'}});
  _pbadge.appendChild(_pdot);
  _pbadge.appendChild(span({fontSize:'10px',color:_pmc,fontFamily:"'Space Grotesk',sans-serif",fontWeight:'700',letterSpacing:'0.08em'},{assets:'LIVE',health:'SCORE',projections:'AI'}[mode]||'LIVE'));
  _phdr.appendChild(_pbadge);
  wrap.appendChild(_phdr);

  // Data loss warning — shown when assets exist but user isn't logged in
  if(mode==="assets"&&ps.assets.length>0){
    var isLoggedIn=typeof DV_AUTH!=="undefined"&&DV_AUTH.user;
    var warnDismissed=localStorage.getItem("dv_portfolio_warn_dismissed")==="1";
    if(!isLoggedIn&&!warnDismissed){
      var warnBanner=div({background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.28)",borderRadius:"10px",padding:"10px 14px",marginBottom:"14px",display:"flex",gap:"10px",alignItems:"flex-start"});
      warnBanner.appendChild(div({color:"#F59E0B",fontSize:"16px",lineHeight:"1",marginTop:"1px",flexShrink:"0"},"⚠"));
      var warnTxt=div({flex:"1"});
      warnTxt.appendChild(div({color:"#F59E0B",fontSize:"12px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"Data stored on this device only"));
      warnTxt.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},"Your portfolio lives in browser storage. Sign in to sync across devices, or export a backup now."));
      var warnBtns=div({display:"flex",gap:"8px",marginTop:"8px",flexWrap:"wrap"});
      var expBtn=el("button",{style:{background:"rgba(212,175,55,0.12)",border:"1px solid rgba(212,175,55,0.3)",color:cl.gold,padding:"5px 12px",borderRadius:"6px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){
        var blob=new Blob([JSON.stringify(ps.assets,null,2)],{type:"application/json"});
        var url=URL.createObjectURL(blob);var a2=document.createElement("a");a2.href=url;a2.download="dubaival-portfolio-backup.json";a2.click();URL.revokeObjectURL(url);
      }});expBtn.textContent="Export Backup";
      var dimBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"5px 12px",borderRadius:"6px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){localStorage.setItem("dv_portfolio_warn_dismissed","1");render();}});dimBtn.textContent="Dismiss";
      warnBtns.appendChild(expBtn);warnBtns.appendChild(dimBtn);
      warnTxt.appendChild(warnBtns);warnBanner.appendChild(warnTxt);
      wrap.appendChild(warnBanner);
    }
  }

  // Sold/exit tracking (added 2026-07-18 portfolio audit) — a property
  // marked Sold is no longer part of the active portfolio (it shouldn't
  // count toward Total Value/Yield/Health/Projections), but its record and
  // realized gain are kept, not deleted, so real transaction history isn't
  // lost the moment "Remove Asset" would have been the only option.
  var activeAssets=ps.assets.filter(function(a){return a.status!=="Sold";});
  var soldAssets=ps.assets.filter(function(a){return a.status==="Sold";});
  var metrics=activeAssets.map(function(a){return Object.assign({},a,{m:computeAssetMetrics(a)});});
  var totalValue=metrics.reduce(function(s,a){return s+a.m.currentValue;},0);
  var totalPurchase=metrics.reduce(function(s,a){return s+a.m.purchasePrice;},0);
  var totalROI=totalPurchase>0?((totalValue-totalPurchase)/totalPurchase*100):0;
  var totalRent=metrics.reduce(function(s,a){return s+a.m.rent;},0);
  var totalSC=metrics.reduce(function(s,a){return s+a.m.sc;},0);
  var avgGrossYield=totalValue>0?(totalRent/totalValue*100):0;
  var avgNetYield=totalValue>0?((totalRent-totalSC)/totalValue*100):0;
  var totalMortgage=metrics.reduce(function(s,a){return s+a.m.mortgage;},0);
  var totalEquity=totalValue-totalMortgage;

  // Throttled to once per signed-in user per day internally — safe to call
  // on every render regardless of which sub-tab is showing.
  _capturePortfolioSnapshot(totalValue,totalPurchase,totalROI,avgGrossYield,avgNetYield,metrics.length);

  // Portfolio Overview (show on assets tab only)
  if(activeAssets.length>0&&mode==="assets"){
    var sumCard=div({background:cl.surface,backdropFilter:cl.blur,WebkitBackdropFilter:cl.blur,border:"1px solid "+cl.border,borderRadius:"14px",padding:"24px",marginBottom:"14px",position:"relative",overflow:"hidden",boxShadow:cl.glassShadow});
    sumCard.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,"+cl.gold+","+cl.gold+",transparent)",animation:"shimmer 3s ease infinite"}));
    sumCard.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"14px"},"◆ Portfolio Overview"));

    var g1=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"});
    [{l:"Total Value",v:"AED "+totalValue.toLocaleString(),c:cl.gold},{l:"Total ROI",v:(totalROI>=0?"+":"")+totalROI.toFixed(1)+"%",c:totalROI>=0?cl.green:cl.red},{l:"Gross Yield",v:avgGrossYield.toFixed(1)+"%",c:cl.green},{l:"Net Yield",v:avgNetYield.toFixed(1)+"%",c:cl.green}].forEach(function(item){
      var box=div({background:cl.surface,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid "+cl.border,borderRadius:"12px",padding:"12px 14px",transition:"transform 0.2s ease,box-shadow 0.2s ease,border-color 0.2s ease",cursor:"default"});
      box.addEventListener("mouseenter",function(){box.style.transform="translateY(-2px)";box.style.boxShadow="0 6px 20px rgba(0,0,0,0.3)";box.style.borderColor=cl.borderHi;});
      box.addEventListener("mouseleave",function(){box.style.transform="translateY(0)";box.style.boxShadow="none";box.style.borderColor=cl.border;});
      box.appendChild(lbl(item.l));
      box.appendChild(span({color:item.c,fontSize:"17px",fontWeight:"700",fontFamily:"'JetBrains Mono',monospace",fontFeatureSettings:"'tnum'",display:"block"},item.v));
      g1.appendChild(box);
    });
    sumCard.appendChild(g1);

    var g2=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"10px",marginBottom:"12px"});
    var pnl=totalValue-totalPurchase;
    // Fixed 2026-07-18: exact-key DB lookup meant free-typed building names
    // (this form has no dropdown for building) almost never resolved to a
    // real building match, silently falling back to the area-wide average —
    // same class of bug already fixed for Find/Deal Scoring in session 11m.
    // lookupBuilding() is the same fuzzy matcher computeAssetMetrics() itself
    // already uses via computeAdjustedPSF(), so this now agrees with it.
    var avgSus=Math.round(metrics.reduce(function(s,a){var bd=lookupBuilding(a.building||"",a.area||"");var ad=AREAS[a.area]||{psf:1800,sc:15};return s+computeSustainabilityScore(a.building||"",a.area||"",bd,ad).score;},0)/Math.max(1,metrics.length));
    var avgSusC=avgSus>=75?"#10B981":avgSus>=50?"#EAB308":avgSus>=35?"#F97316":"#EF4444";
    [{l:"Assets",v:String(activeAssets.length),c:cl.white},{l:"Annual Rent",v:"AED "+totalRent.toLocaleString(),c:cl.white},{l:"Unrealized P&L",v:(pnl>=0?"+":"")+"AED "+pnl.toLocaleString(),c:pnl>=0?cl.green:cl.red},{l:"Sustainability",v:avgSus+"/100",c:avgSusC}].forEach(function(item){
      var box=div({background:cl.raised,borderRadius:"10px",padding:"10px 12px"});
      box.appendChild(lbl(item.l));
      box.appendChild(span({color:item.c,fontSize:"13px",fontWeight:"700",fontFamily:"'JetBrains Mono',monospace",fontFeatureSettings:"'tnum'",display:"block"},item.v));
      g2.appendChild(box);
    });
    sumCard.appendChild(g2);

    // Leverage/Equity row — only shown once at least one asset has a
    // mortgage balance entered, so an unleveraged (cash-buyer) portfolio
    // isn't cluttered with a "0 mortgage" row (added 2026-07-18).
    if(totalMortgage>0){
      var g2b=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"});
      [{l:"Net Equity",v:"AED "+totalEquity.toLocaleString(),c:cl.gold},{l:"Outstanding Mortgage",v:"AED "+totalMortgage.toLocaleString(),c:cl.subHi}].forEach(function(item){
        var box=div({background:cl.raised,borderRadius:"10px",padding:"10px 12px"});
        box.appendChild(lbl(item.l));
        box.appendChild(span({color:item.c,fontSize:"13px",fontWeight:"700",fontFamily:"'JetBrains Mono',monospace",fontFeatureSettings:"'tnum'",display:"block"},item.v));
        g2b.appendChild(box);
      });
      sumCard.appendChild(g2b);
    }

    // Area Allocation bar
    var areaDist={};
    metrics.forEach(function(a){areaDist[a.area]=(areaDist[a.area]||0)+a.m.currentValue;});
    var areaEntries=Object.entries(areaDist).sort(function(a,b){return b[1]-a[1];});
    if(areaEntries.length>0){
      sumCard.appendChild(lbl("Area Allocation"));
      var barColors=[cl.gold,cl.green,cl.blue,cl.yellow,cl.red,cl.goldDim];
      var bar=div({display:"flex",height:"8px",borderRadius:"4px",overflow:"hidden",marginTop:"6px",marginBottom:"8px"});
      areaEntries.forEach(function(e,i){bar.appendChild(div({width:(e[1]/totalValue*100)+"%",background:barColors[i%barColors.length]}));});
      sumCard.appendChild(bar);
      var legend=div({display:"flex",flexWrap:"wrap",gap:"8px"});
      areaEntries.forEach(function(e,i){
        legend.appendChild(div({display:"flex",alignItems:"center",gap:"4px"},[
          div({width:"8px",height:"8px",borderRadius:"2px",background:barColors[i%barColors.length],flexShrink:"0"}),
          span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},e[0]+" "+(e[1]/totalValue*100).toFixed(0)+"%"),
        ]));
      });
      sumCard.appendChild(legend);
    }
    wrap.appendChild(sumCard);

    // CSV Export
    wrap.appendChild(el("div",{style:{marginBottom:"14px",display:"flex",gap:"8px",flexWrap:"wrap"}},[
      csvExportBtn("Export Portfolio (CSV)",cl,function(){
        var hdrs=["building","area","type","beds","size_sqft","purchase_price","purchase_date","current_value","roi_pct","gross_yield","net_yield","growth_1y","sustainability_score"];
        // Fixed 2026-07-18 (Health/Projections audit) — this passed a hardcoded
        // null for bData, meaning the exported Sustainability Score was ALWAYS
        // the area-wide average, regardless of the real building, even worse
        // than the exact-match bug already fixed elsewhere in this file (which
        // at least attempted a real lookup). Now uses lookupBuilding(), the
        // same fuzzy matcher used everywhere else in this file.
        var rows=metrics.map(function(a){var bd=lookupBuilding(a.building||"",a.area||"");var ss=typeof computeSustainabilityScore==="function"?computeSustainabilityScore(a.building,a.area,bd,AREAS[a.area]):null;
          return[a.building||"",a.area,a.type||"Apartment",a.beds,a.size,a.purchasePrice||a.m.purchasePrice,a.purchaseDate||"",a.m.currentValue,a.m.roi.toFixed(1),a.m.grossYield.toFixed(1),a.m.netYield.toFixed(1),(AREAS[a.area]&&AREAS[a.area].g?AREAS[a.area].g[0]:0),ss?ss.score:""];});
        exportCSV("DubAIVal_Portfolio_"+csvDate()+".csv",hdrs,rows);
      }),
      csvExportBtn("PDF Report"+(typeof isProUser==="function"&&!isProUser()?" (Pro)":""),cl,function(){
        generatePortfolioPDF(metrics,totalValue,totalPurchase,totalROI,avgGrossYield,avgNetYield,computePortfolioHealth(metrics,totalValue));
      })
    ]));

  } // end assets overview

    // Portfolio Health Score — Health tab only (was also shown on Assets,
    // making the dedicated Health tab redundant; see CLAUDE.md nav table)
  if(mode==="health"){
    // Portfolio Value History chart — signed-in users only (matches the
    // cloud-sync gating everywhere else in this file). Fetched once per
    // page (ps._history undefined -> not yet requested), re-fetched
    // automatically after a fresh snapshot is captured (see
    // _capturePortfolioSnapshot() resetting ps._history to undefined).
    if(typeof DV_AUTH!=="undefined"&&DV_AUTH.user){
      if(ps._history===undefined){
        ps._history=null;
        _fetchPortfolioHistory().then(function(rows){ps._history=rows;render();});
      }
      if(Array.isArray(ps._history)&&ps._history.length>=2){
        wrap.appendChild(_renderPortfolioHistoryChart(cl,ps._history));
      }
    }
    var health=computePortfolioHealth(metrics,totalValue);
    if(health){
      var hCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"14px",position:"relative",overflow:"hidden"});
      var hScColor=health.score>=70?cl.green:health.score>=55?cl.yellow:cl.red;
      hCard.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,"+hScColor+","+hScColor+",transparent)",animation:"shimmer 3s ease infinite"}));
      hCard.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"16px"},"◆ Portfolio Health Score"));
      var scoreAngle=Math.round(health.score/100*360);
      var circleWrap=div({display:"flex",flexDirection:"column",alignItems:"center",marginBottom:"18px"});
      var circle=div({width:"110px",height:"110px",borderRadius:"50%",background:"conic-gradient("+hScColor+" "+scoreAngle+"deg, "+cl.border+" "+scoreAngle+"deg)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 24px "+hScColor+"30"});
      var inner=div({width:"84px",height:"84px",borderRadius:"50%",background:cl.surfaceSolid||cl.surface,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"});
      inner.appendChild(span({color:hScColor,fontSize:"32px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",lineHeight:"1"},String(health.score)));
      inner.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},"/100"));
      circle.appendChild(inner);circleWrap.appendChild(circle);
      var tierBg=health.score>=70?cl.greenBg:health.score>=55?cl.yellowBg:cl.redBg;
      var tierBo=health.score>=70?cl.greenBo:health.score>=55?cl.yellowBo:cl.redBo;
      circleWrap.appendChild(div({marginTop:"10px",padding:"4px 16px",borderRadius:"20px",background:tierBg,border:"1px solid "+tierBo},[span({color:hScColor,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em"},health.tier)]));
      hCard.appendChild(circleWrap);
      var compGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"});
      [{l:"Diversification",v:health.div,icon:"◈"},{l:"Liquidity",v:health.liq,icon:"◆"},{l:"Risk-Return",v:health.rr,icon:"◇"},{l:"Growth",v:health.gr,icon:"▲"}].forEach(function(c){
        var cBox=div({background:cl.raised,borderRadius:"8px",padding:"10px 12px"});
        var cHead=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"});
        cHead.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},c.icon+" "+c.l));
        var cColor=c.v>=70?cl.green:c.v>=55?cl.yellow:cl.red;
        cHead.appendChild(span({color:cColor,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},c.v));
        cBox.appendChild(cHead);
        var barBg=div({height:"4px",borderRadius:"2px",background:cl.border,overflow:"hidden"});
        barBg.appendChild(div({height:"100%",width:c.v+"%",borderRadius:"2px",background:"linear-gradient(90deg,"+cColor+","+cColor+"90)",transition:"width 1s ease"}));
        cBox.appendChild(barBg);compGrid.appendChild(cBox);
      });
      hCard.appendChild(compGrid);
      if(health.insight){
        hCard.appendChild(div({background:cl.goldFaint,border:"1px solid "+cl.goldDim+"30",borderRadius:"8px",padding:"10px 12px"},[
          span({color:cl.gold,fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",display:"block",marginBottom:"3px"},"INSIGHT"),
          span({color:cl.subHi,fontSize:"11.5px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},health.insight)
        ]));
      }
      wrap.appendChild(hCard);
    }

    // --- OPPORTUNITY ALERTS (Phase 1) ---
    if(metrics.length>0){
      var oaCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"14px",position:"relative",overflow:"hidden"});
      oaCard.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,#F59E0B,#F59E0B,transparent)",animation:"shimmer 3s ease infinite"}));
      oaCard.appendChild(span({color:"#F59E0B",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"Opportunity Alerts"));
      oaCard.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",display:"block",marginBottom:"16px"},"Hidden opportunities and actionable insights for your assets"));

      metrics.forEach(function(a){
        var aData=AREAS[a.area]||{psf:1800,sc:15,y:[5,7],g:[3,9,16]};
        var gr=aData.g||[3,9,16];
        var alerts=[];

        // 0a) Vacant Property Alert (added 2026-07-18) — the Occupancy
        // field added this session had nowhere that actually acted on it;
        // a Vacant unit is real lost income sitting in the portfolio with
        // no signal anywhere pointing it out.
        if(a.occupancy==="Vacant"){
          alerts.push({type:"warn",icon:"",title:"Vacant Property",text:"This property is marked Vacant — you may be missing ~AED "+Math.round(a.m.estRent).toLocaleString()+"/yr in rental income (area estimate). List it or check in with your management.",pct:-1});
        }

        // 0b) Lease Expiring Soon (added 2026-07-18) — the same lease-end
        // date already shown as a passive pill on the collapsed Assets
        // card gets surfaced here too as an actual actionable alert, since
        // Opportunity Alerts is exactly where a portfolio manager should
        // put "something needs your attention soon."
        if(a.occupancy==="Rented"&&a.leaseEnd){
          var daysToLease=Math.round((new Date(a.leaseEnd)-new Date())/86400000);
          if(daysToLease>=0&&daysToLease<=60){
            alerts.push({type:"warn",icon:"",title:"Lease Expiring Soon",text:"Lease ends in "+daysToLease+" day"+(daysToLease===1?"":"s")+" ("+new Date(a.leaseEnd).toLocaleDateString()+") — start renewal or re-listing discussions now.",pct:-1});
          }
        }

        // 1) DLD Fee Recovery Timer
        var pp=a.m.purchasePrice||0;
        var cv=a.m.currentValue||0;
        var annualGrowthRate=(gr[0]||10)/100;
        if(pp>0&&annualGrowthRate>0){
          var dldFee=pp*0.04;
          var monthlyGrowth=cv*annualGrowthRate/12;
          var recoveryMonths=monthlyGrowth>0?Math.ceil(dldFee/monthlyGrowth):999;
          var holdMonths=a.m.holdingMonths||0;
          var recovered=holdMonths>=recoveryMonths;
          var pct=Math.min(100,Math.round(holdMonths/recoveryMonths*100));
          alerts.push({
            type:recovered?"good":"warn",
            icon:"",
            title:"DLD Fee Recovery",
            text:recovered?"DLD fees fully recovered after "+recoveryMonths+" months":recoveryMonths>120?"Recovery unlikely at current growth rate":recoveryMonths+" months to recover DLD fees ("+pct+"% done)",
            pct:pct
          });
        }

        // 2) Rent Optimization Alert — rewritten 2026-07-18. Previously
        // compared the model-estimated rent against itself (recomputed the
        // exact same benchmark locally and called it "actualRent"), so the
        // alert could never actually catch under-renting — it was always
        // ~100%. Now uses the real actual-rent field (a.m.rentIsActual) when
        // the user has entered one, and stays honest (no alert, or a
        // clearly-labeled call-to-action) when it hasn't.
        var isV=a.type==="Villa"||a.type==="Townhouse";
        var benchRent=a.m.estRent||0;
        if(a.m.rentIsActual&&benchRent>0){
          var rentRatio=a.m.rent/benchRent*100;
          if(rentRatio<90){
            alerts.push({type:"warn",icon:"",title:"Rent Optimization",text:"You may be under-renting by "+Math.round(100-rentRatio)+"% — area benchmark: AED "+benchRent.toLocaleString()+"/yr vs your actual AED "+a.m.rent.toLocaleString()+"/yr",pct:Math.round(rentRatio)});
          }else if(rentRatio>115){
            alerts.push({type:"good",icon:"",title:"Rent Optimization",text:"Your actual rent is "+Math.round(rentRatio)+"% of area benchmark — above-market, well optimized",pct:Math.min(100,Math.round(rentRatio))});
          }else{
            alerts.push({type:"good",icon:"",title:"Rent Optimization",text:"Your actual rent is at "+Math.round(rentRatio)+"% of area benchmark — well optimized",pct:Math.min(100,Math.round(rentRatio))});
          }
        }else if(benchRent>0){
          alerts.push({type:"neutral",icon:"",title:"Rent Optimization",text:"Add your actual annual rent on this property (Edit → Actual Annual Rent) to compare it against the area benchmark of AED "+benchRent.toLocaleString()+"/yr — right now this figure is a market estimate, not your real income.",pct:-1});
        }

        // 3) Optimal Exit Window
        var g0=gr[0]||3,g1=gr[1]||9,g2=gr[2]||16;
        var ny=a.m.netYield||5;
        var tr1=ny+g0;
        var tr3=ny+g1/3;
        var tr5=ny+g2/5;
        var bestTR=Math.max(tr1,tr3,tr5);
        var bestWindow=bestTR===tr1?"1 year":bestTR===tr3?"3 years":"5 years";
        var exitType=bestTR>=12?"good":bestTR>=8?"neutral":"warn";
        alerts.push({type:exitType,icon:"",title:"Optimal Exit Window",text:"Best exit: "+bestWindow+" (total return "+bestTR.toFixed(1)+"%/yr) — 1yr: "+tr1.toFixed(1)+"% · 3yr: "+tr3.toFixed(1)+"% · 5yr: "+tr5.toFixed(1)+"%",pct:-1});

        // 4) Equity Release Calculator — fixed 2026-07-18: a.mortgage was
        // referenced here since this alert was first built, but no form
        // field ever set it, so releasable equity was always computed as if
        // the property carried zero debt. Now reads the real, user-entered
        // mortgage balance (a.m.mortgage, computeAssetMetrics()).
        if(pp>0&&cv>pp){
          var equity75=Math.round(cv*0.75);
          var releasable=equity75-a.m.mortgage;
          if(releasable>0){
            alerts.push({type:"good",icon:"",title:"Equity Release",text:"Releasable equity: AED "+releasable.toLocaleString()+" (at 75% LTV"+(a.m.mortgage>0?", net of your AED "+a.m.mortgage.toLocaleString()+" mortgage":" — no mortgage on file")+"). Property grew +"+(a.m.roi>=0?a.m.roi.toFixed(0):0)+"% since purchase.",pct:-1});
          }else{
            alerts.push({type:"neutral",icon:"",title:"Equity Release",text:"No releasable equity yet"+(a.m.mortgage>0?" — outstanding mortgage (AED "+a.m.mortgage.toLocaleString()+") exceeds 75% LTV headroom":" — current LTV headroom insufficient")+". Keep holding for appreciation.",pct:-1});
          }
        }else if(pp>0){
          alerts.push({type:"neutral",icon:"",title:"Equity Release",text:"Property has not appreciated beyond purchase price yet. Equity release not recommended.",pct:-1});
        }

        // 5) Airbnb vs Long-term Rent Comparison (Phase 2) — uses a.m.rent
        // (actual when the user entered one, else the area estimate), same
        // as every other rent-based alert here now that the standalone
        // "actualRent" local var (a mislabeled duplicate of the estimate,
        // see the Rent Optimization fix above) has been removed.
        var strInfo=STR_DATA[a.area];
        var ltrRent=a.m.rent||0;
        if(strInfo&&ltrRent>0){
          var strAnnual=Math.round(strInfo.nightly*365*strInfo.occ*0.80);
          var strDiff=Math.round((strAnnual-ltrRent)/ltrRent*100);
          if(strDiff>30){
            alerts.push({type:"good",icon:"",title:"Airbnb Opportunity",text:"Short-term rental could increase income by "+strDiff+"% — STR estimate: AED "+strAnnual.toLocaleString()+"/yr ("+strInfo.nightly+" AED/night × "+Math.round(strInfo.occ*100)+"% occ × 80% net) vs long-term: AED "+ltrRent.toLocaleString()+"/yr",pct:-1});
          }else if(strDiff>0){
            alerts.push({type:"neutral",icon:"",title:"Airbnb vs Long-term",text:"STR premium only "+strDiff+"% — marginal after management hassle. Long-term rental is optimal. STR: AED "+strAnnual.toLocaleString()+"/yr vs LTR: AED "+ltrRent.toLocaleString()+"/yr",pct:-1});
          }else{
            alerts.push({type:"neutral",icon:"",title:"Long-term Optimal",text:"Long-term rental is optimal for "+a.area+". STR estimate: AED "+strAnnual.toLocaleString()+"/yr vs LTR: AED "+ltrRent.toLocaleString()+"/yr",pct:-1});
          }
        }else if(strInfo){
          var strEst=Math.round(strInfo.nightly*365*strInfo.occ*0.80);
          alerts.push({type:"neutral",icon:"",title:"STR Potential",text:a.area+" STR estimate: AED "+strEst.toLocaleString()+"/yr ("+strInfo.nightly+" AED/night × "+Math.round(strInfo.occ*100)+"% occ). Compare with your rental income.",pct:-1});
        }

        // 6) Renovation ROI Estimator (Phase 2)
        var sz=parseFloat(a.size)||parseFloat(a.buaSize)||0;
        var bGrade=(function(){var bd=lookupBuilding(a.building||"",a.area||"");return bd?bd.g:"B";})();
        if(sz>0&&cv>0){
          var gradeMulti=bGrade==="C"?1.3:bGrade==="B"?1.15:bGrade==="B+"?1.05:bGrade==="A-"?0.9:bGrade==="A"||bGrade==="A+"||bGrade==="Ultra"?0.7:1;
          var levels=[
            {l:"Cosmetic",costLo:150,costHi:250,valLo:5,valHi:8,desc:"Paint, flooring, fixtures"},
            {l:"Kitchen+Bath",costLo:300,costHi:500,valLo:10,valHi:15,desc:"Kitchen & bathroom remodel"},
            {l:"Full Renovation",costLo:500,costHi:800,valLo:15,valHi:22,desc:"Complete interior overhaul"}
          ];
          if(bGrade==="A+"||bGrade==="Ultra"){
            alerts.push({type:"neutral",icon:"",title:"Renovation ROI",text:"Limited renovation upside for "+bGrade+" grade. Premium properties have minimal value-add from renovations.",pct:-1});
          }else{
            var bestLvl=null,bestRoi=0;
            levels.forEach(function(lv){
              var avgCost=Math.round(sz*(lv.costLo+lv.costHi)/2);
              var avgValPct=(lv.valLo+lv.valHi)/2*gradeMulti;
              var valAdd=Math.round(cv*avgValPct/100);
              var roi=Math.round(valAdd/avgCost*100);
              if(roi>bestRoi){bestRoi=roi;bestLvl={name:lv.l,cost:avgCost,valAdd:valAdd,roi:roi,pct:avgValPct,payback:(avgCost>0&&valAdd>0)?Math.round(avgCost/(valAdd/12))+"mo":"—"};}
            });
            if(bestLvl){
              var renoType=bestRoi>=200?"good":bestRoi>=120?"neutral":"warn";
              var renoLines=levels.map(function(lv){
                var c=Math.round(sz*(lv.costLo+lv.costHi)/2);var v=Math.round(cv*(lv.valLo+lv.valHi)/2*gradeMulti/100);return lv.l+": AED "+c.toLocaleString()+" cost → +AED "+v.toLocaleString()+" value ("+Math.round(v/c*100)+"% ROI)";
              }).join(" · ");
              alerts.push({type:renoType,icon:"",title:"Renovation ROI — Best: "+bestLvl.name,text:renoLines+" · Grade "+bGrade+" "+(gradeMulti>1?"(higher upside)":"")+" · Payback: "+bestLvl.payback,pct:-1});
            }
          }
        }

        // Portfolio notifications for actionable alerts
        var notifKey="dv_pnotif_"+a.area+"_"+(a.building||"");
        var prevNotifTs=0;try{prevNotifTs=parseInt(localStorage.getItem(notifKey))||0;}catch(e){}
        if(Date.now()-prevNotifTs>86400000){
          alerts.forEach(function(al){
            if(al.type==="warn"&&al.title.indexOf("Rent")!==-1){
              addNotification("","Rent optimization opportunity for your "+a.area+" property","portfolio");
              try{localStorage.setItem(notifKey,String(Date.now()));}catch(e){}
            }
          });
        }

        // Render asset alerts
        if(alerts.length>0){
          var assetHeader=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px",paddingTop:metrics.indexOf(a)>0?"12px":"0",borderTop:metrics.indexOf(a)>0?"1px solid "+cl.border:"none"});
          assetHeader.appendChild(span({color:cl.gold,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},a.building||a.area));
          assetHeader.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"· "+a.beds+" · "+(a.type||"Apartment")));
          oaCard.appendChild(assetHeader);

          alerts.forEach(function(al){
            var colors={good:{bg:"rgba(16,185,129,0.08)",border:"rgba(16,185,129,0.25)",text:"#10B981"},warn:{bg:"rgba(245,158,11,0.08)",border:"rgba(245,158,11,0.25)",text:"#F59E0B"},neutral:{bg:"rgba(107,122,158,0.08)",border:"rgba(107,122,158,0.25)",text:"#6B7A9E"}};
            var ac=colors[al.type]||colors.neutral;
            var row=div({background:ac.bg,border:"1px solid "+ac.border,borderRadius:"10px",padding:"10px 12px",marginBottom:"8px"});
            var rowHead=div({display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px"});
            rowHead.appendChild(span({fontSize:"13px"},al.icon));
            rowHead.appendChild(span({color:ac.text,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},al.title));
            row.appendChild(rowHead);
            row.appendChild(span({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",display:"block"},al.text));
            if(al.pct>=0){
              var barWrap=div({height:"4px",borderRadius:"2px",background:cl.border,overflow:"hidden",marginTop:"6px"});
              barWrap.appendChild(div({height:"100%",width:Math.min(100,al.pct)+"%",borderRadius:"2px",background:ac.text,transition:"width 1s ease"}));
              row.appendChild(barWrap);
            }
            oaCard.appendChild(row);
          });
        }
      });
      wrap.appendChild(oaCard);
    }
  } // end health section

  // Future Projection Simulator — Projections tab only (was also shown on
  // Assets, making the dedicated Projections tab redundant)
  if(mode==="projections"){
    if(!ps._proj)ps._proj={growth:0,rate:0};
    var projCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"14px",position:"relative",overflow:"hidden"});
    projCard.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,"+cl.gold+","+cl.gold+",transparent)",animation:"shimmer 3s ease infinite"}));
    projCard.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"14px"},"◆ Future Projection Simulator"));
    projCard.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",display:"block",marginBottom:"16px"},"Adjust assumptions to see how your portfolio evolves"));
    var gAdj=ps._proj.growth;var rAdj=ps._proj.rate;
    function mkSlider(label,min,max,step,val,suffix,onChange){
      var sw=div({marginBottom:"16px"});
      var sh=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"});
      sh.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},label));
      var valSpan=span({color:val>0?cl.green:val<0?cl.red:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(val>0?"+":"")+val+suffix);
      sh.appendChild(valSpan);sw.appendChild(sh);
      var si=el("input",{style:{width:"100%",height:"6px",borderRadius:"3px",appearance:"none",WebkitAppearance:"none",background:"linear-gradient(90deg,"+cl.red+","+cl.border+" 50%,"+cl.green+")",outline:"none",cursor:"pointer",accentColor:cl.gold},type:"range"});
      si.min=String(min);si.max=String(max);si.step=String(step);si.value=String(val);
      si.addEventListener("input",function(){onChange(parseFloat(si.value));});
      sw.appendChild(si);
      var ticks=div({display:"flex",justifyContent:"space-between",marginTop:"2px"});
      ticks.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},min+suffix));
      ticks.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"0"+suffix));
      ticks.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"+"+max+suffix));
      sw.appendChild(ticks);return sw;
    }
    projCard.appendChild(mkSlider("Market Growth Adjustment",-30,30,5,gAdj,"%",function(v){ps._proj.growth=v;render();}));
    projCard.appendChild(mkSlider("Interest Rate Change",-3,5,0.5,rAdj,"%",function(v){ps._proj.rate=v;render();}));
    var projYears=[1,3,5];
    var projGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"14px"});
    projYears.forEach(function(yr){
      var projVal=0;var projRent=0;
      metrics.forEach(function(a){
        var baseGrowth=(yr===1?a.m.g0:yr===3?a.m.g1:a.m.g2)||10;
        var adjGrowth=baseGrowth+gAdj;
        var cappedGrowth=Math.max(-50,Math.min(100,adjGrowth));
        var futureVal=a.m.currentValue*(1+cappedGrowth/100);
        projVal+=futureVal;
        var yieldImpact=rAdj>0?Math.max(0.7,1-rAdj*0.04):Math.min(1.3,1-rAdj*0.04);
        projRent+=a.m.rent*yieldImpact*(1+cappedGrowth/200);
      });
      var projROI=totalPurchase>0?((projVal-totalPurchase)/totalPurchase*100):0;
      var projYield=projVal>0?(projRent/projVal*100):0;
      var valChange=projVal-totalValue;
      // Projected Net Equity (added 2026-07-18 Projections audit) — this
      // simulator previously showed only gross projected asset value, with
      // zero awareness of mortgage debt, even though leverage is exactly
      // what makes a real investor's EQUITY grow faster in percentage terms
      // than the underlying asset — the whole point of using a mortgage.
      // Conservatively assumes the mortgage balance itself stays flat over
      // the projection window (no amortization schedule is collected from
      // the user, so this is the safe, disclosed simplification rather than
      // guessing a paydown rate) — shown only when leverage exists.
      var projEquity=projVal-totalMortgage;
      var pBox=div({background:cl.raised,borderRadius:"10px",padding:"12px 10px",textAlign:"center"});
      pBox.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:"8px"},yr+" Year"));
      pBox.appendChild(span({color:cl.gold,fontSize:"15px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",display:"block",lineHeight:"1.2"},"AED"));
      pBox.appendChild(span({color:cl.gold,fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"6px"},Math.round(projVal/1000).toLocaleString()+"K"));
      pBox.appendChild(div({height:"1px",background:cl.border,margin:"6px 0"}));
      var chColor=valChange>=0?cl.green:cl.red;
      pBox.appendChild(span({color:chColor,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},(valChange>=0?"+":"")+"AED "+Math.round(valChange/1000).toLocaleString()+"K"));
      pBox.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",display:"block",marginTop:"2px"},"ROI "+(projROI>=0?"+":"")+projROI.toFixed(0)+"% · Yield "+projYield.toFixed(1)+"%"));
      if(totalMortgage>0){
        pBox.appendChild(div({height:"1px",background:cl.border,margin:"6px 0"}));
        pBox.appendChild(span({color:"#818CF8",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},"Net Equity: AED "+Math.round(projEquity/1000).toLocaleString()+"K"));
      }
      projGrid.appendChild(pBox);
    });
    projCard.appendChild(projGrid);
    if(totalMortgage>0){
      projCard.appendChild(div({color:cl.sub,fontSize:"9.5px",fontFamily:"'Inter',sans-serif",marginBottom:"14px",lineHeight:"1.5"},"Net Equity assumes your current outstanding mortgage (AED "+totalMortgage.toLocaleString()+") stays unchanged over the projection window — it doesn't model a specific amortization schedule."));
    }
    var projInsight="";
    if(gAdj<=-10)projInsight="Stress scenario: significant market correction. Focus on cash flow and avoid leverage.";
    else if(gAdj<0)projInsight="Cautious outlook: moderate pullback expected. High-yield assets outperform in this scenario.";
    else if(gAdj>=20)projInsight="Bull scenario: strong appreciation. Consider locking in gains on overheated segments.";
    else if(gAdj>=10)projInsight="Optimistic outlook: above-trend growth. Growth-oriented areas benefit most.";
    else projInsight="Base case: in-line with current market forecasts from AREAS database.";
    if(rAdj>=2)projInsight+=" Higher rates compress yields and reduce buyer demand — watch for pricing pressure.";
    else if(rAdj<=-1)projInsight+=" Lower rates boost affordability and may accelerate capital inflows.";
    projCard.appendChild(div({background:cl.goldFaint,border:"1px solid "+cl.goldDim+"30",borderRadius:"8px",padding:"10px 12px"},[
      span({color:cl.gold,fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",display:"block",marginBottom:"3px"},"SCENARIO ANALYSIS"),
      span({color:cl.subHi,fontSize:"11.5px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},projInsight)
    ]));
    wrap.appendChild(projCard);
  }

  if(mode==="assets"){
  // Investment Profile
  var goalsCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px"});
  goalsCard.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"◆ Investment Profile"));
  var goalsGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"});
  [{l:"Risk Appetite",k:"risk",opts:["Conservative","Moderate","Aggressive"]},{l:"Horizon",k:"horizon",opts:["1-2 years","3-5 years","5-10 years","10+ years"]},{l:"Target",k:"target",opts:["Capital Growth","Rental Income","Balanced","Quick Flip"]}].forEach(function(item){
    var g=div({});g.appendChild(lbl(item.l));
    g.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11.5px",padding:"8px 10px"}),item.opts,ps.goals[item.k],function(v){ps.goals[item.k]=v;try{localStorage.setItem("dubaival_portfolio_goals",JSON.stringify(ps.goals));}catch(e){}portfolioChanged();ps.aiAnalysis="";render();}));
    goalsGrid.appendChild(g);
  });
  goalsCard.appendChild(goalsGrid);
  wrap.appendChild(goalsCard);
  } // end assets-only investment profile

  // What-If Swap Simulator — Projections tab only (was also shown on Assets)
  if(mode==="projections"){
  if(metrics.length>0){
    if(!ps._swap)ps._swap={sellId:"",buyArea:"",buyType:"Apartment",buyBeds:"2 BR",buySize:"",showResult:false};
    var sw=ps._swap;
    var swCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"14px",position:"relative",overflow:"hidden"});
    swCard.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,#6366F1,#6366F1,transparent)",animation:"shimmer 3s ease infinite"}));
    swCard.appendChild(span({color:"#818CF8",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"◆ What-If Scenario"));
    swCard.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",display:"block",marginBottom:"16px"},"Sell an asset and reinvest — see how your cash flow changes"));
    var swGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px"});
    var sellW=div({});sellW.appendChild(lbl("Sell This Asset"));
    var sellOpts=["Select…"].concat(metrics.map(function(a){return(a.building||a.area)+" (AED "+Math.round(a.m.currentValue/1000)+"K)";}));
    var sellVals=[""].concat(metrics.map(function(a){return a.id;}));
    sellW.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11px",padding:"8px 10px"}),sellOpts,sw.sellId?sellOpts[sellVals.indexOf(sw.sellId)]||"Select…":"Select…",function(v){
      var idx=sellOpts.indexOf(v);sw.sellId=idx>0?sellVals[idx]:"";sw.showResult=false;render();
    }));
    swGrid.appendChild(sellW);
    var buyW=div({});buyW.appendChild(lbl("Buy In Area"));
    buyW.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11px",padding:"8px 10px"}),["Select…"].concat(AREA_NAMES),sw.buyArea||"Select…",function(v){sw.buyArea=v==="Select…"?"":v;sw.showResult=false;render();}));
    swGrid.appendChild(buyW);
    var buyW2=div({});buyW2.appendChild(lbl("Property Type"));
    buyW2.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11px",padding:"8px 10px"}),["Apartment","Villa","Townhouse"],sw.buyType,function(v){sw.buyType=v;sw.showResult=false;render();}));
    swGrid.appendChild(buyW2);
    var buyW3=div({});buyW3.appendChild(lbl("Bedrooms"));
    buyW3.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11px",padding:"8px 10px"}),["Studio","1 BR","2 BR","3 BR","4 BR","5 BR"],sw.buyBeds,function(v){sw.buyBeds=v;sw.showResult=false;render();}));
    swGrid.appendChild(buyW3);
    swCard.appendChild(swGrid);
    var canSim=sw.sellId&&sw.buyArea;
    swCard.appendChild(btn({width:"100%",padding:"11px",borderRadius:"10px",border:"none",background:canSim?"linear-gradient(135deg,#6366F1,#818CF8)":cl.border,color:canSim?"#fff":cl.sub,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",marginBottom:sw.showResult?"14px":"0",opacity:canSim?"1":"0.5"},"SIMULATE SWAP ◆",function(){if(canSim){sw.showResult=true;render();}}));
    if(sw.showResult&&canSim){
      var sellAsset=metrics.find(function(a){return a.id===sw.sellId;});
      if(sellAsset){
        var saleProceeds=sellAsset.m.currentValue;
        var dldFee=Math.round(saleProceeds*0.04);
        var agentFee=Math.round(saleProceeds*0.02);
        // Fixed 2026-07-18 (Projections audit) — this previously deducted
        // only the transaction fees, never the seller's own outstanding
        // mortgage balance (a real field added this same session), so
        // "Sale Proceeds (Net)"/"Buy Power" was materially overstated for
        // any leveraged asset — the seller must pay off the loan at
        // closing before anything is left to reinvest.
        var sellMortgage=sellAsset.m.mortgage||0;
        var netProceeds=Math.max(0,saleProceeds-dldFee-agentFee-sellMortgage);
        var buyAreaData=AREAS[sw.buyArea]||{psf:1800,sc:15,y:[5,7],g:[3,9,16]};
        var buyPSF=buyAreaData.psf;
        var buyIsV=sw.buyType==="Villa"||sw.buyType==="Townhouse";
        var buySize=Math.round(netProceeds/(buyPSF*1.04));
        var buyDLD=Math.round(netProceeds/(1+0.04)*0.04);
        var buyPrice=netProceeds-buyDLD;
        var bn2={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5}[sw.buyBeds]||2;
        var buyRent=buyIsV?(bn2<=2?buyAreaData.rv2||130000:bn2<=3?buyAreaData.rv3||180000:bn2<=4?buyAreaData.rv4||240000:bn2<=5?buyAreaData.rv5||350000:bn2<=6?buyAreaData.rv6||500000:buyAreaData.rv7||650000):bn2===0?(buyAreaData.rStudio||(buyAreaData.r1||65000)*0.65):bn2===1?buyAreaData.r1||65000:bn2===2?buyAreaData.r2||100000:bn2===3?buyAreaData.r3||150000:(buyAreaData.r3||150000)*1.4;
        var buySC=(buyAreaData.sc||15)*buySize;
        var buyGrossY=buyPrice>0?(buyRent/buyPrice*100):0;
        var buyNetY=buyPrice>0?((buyRent-buySC)/buyPrice*100):0;
        var buyGrowth=buyAreaData.g||[3,9,16];
        var sellRent=sellAsset.m.rent;var sellNetY=sellAsset.m.netYield;var sellGrowth=sellAsset.m.g1||9;
        var cashFlowDiff=Math.round((buyRent-buySC)-(sellRent-sellAsset.m.sc));
        var cashFlowPct=sellRent-sellAsset.m.sc>0?(cashFlowDiff/(sellRent-sellAsset.m.sc)*100):0;
        var growthDiff=(buyGrowth[1]||9)-(sellGrowth||9);
        var resCard=div({background:cl.raised,borderRadius:"10px",padding:"14px"});
        resCard.appendChild(span({color:"#818CF8",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"SWAP ANALYSIS"));
        var resG=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"});
        [{l:"Sale Proceeds (Net)",v:"AED "+Math.round(netProceeds/1000).toLocaleString()+"K",s:sellMortgage>0?"After 4% DLD + 2% agent + AED "+Math.round(sellMortgage/1000).toLocaleString()+"K mortgage payoff":"After 4% DLD + 2% agent",c:cl.white},
         {l:"Buy Power in "+sw.buyArea,v:buySize.toLocaleString()+" sqft",s:"At PSF "+buyPSF.toLocaleString(),c:cl.gold},
         {l:"Current Net Cash Flow",v:"AED "+Math.round(sellRent-sellAsset.m.sc).toLocaleString()+"/yr",s:sellAsset.building||sellAsset.area,c:cl.white},
         {l:"New Net Cash Flow",v:"AED "+Math.round(buyRent-buySC).toLocaleString()+"/yr",s:sw.buyArea+" "+sw.buyBeds,c:cashFlowDiff>=0?cl.green:cl.red}
        ].forEach(function(item){
          var b=div({background:cl.surface,borderRadius:"8px",padding:"10px 12px"});
          b.appendChild(lbl(item.l));
          b.appendChild(span({color:item.c,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},item.v));
          if(item.s)b.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",display:"block",marginTop:"2px"},item.s));
          resG.appendChild(b);
        });
        resCard.appendChild(resG);
        var verdictBox=div({background:cashFlowDiff>=0?cl.greenBg:cl.redBg,border:"1px solid "+(cashFlowDiff>=0?cl.greenBo:cl.redBo),borderRadius:"8px",padding:"12px",textAlign:"center",marginBottom:"10px"});
        verdictBox.appendChild(span({color:cashFlowDiff>=0?cl.green:cl.red,fontSize:"20px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",display:"block"},(cashFlowDiff>=0?"+":"")+"AED "+cashFlowDiff.toLocaleString()+"/yr"));
        verdictBox.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",display:"block",marginTop:"2px"},"Cash Flow "+(cashFlowPct>=0?"+":"")+cashFlowPct.toFixed(0)+"% · Net Yield "+sellNetY.toFixed(1)+"% → "+buyNetY.toFixed(1)+"% · 3yr Growth "+(growthDiff>=0?"+":"")+growthDiff.toFixed(0)+"pp"));
        resCard.appendChild(verdictBox);
        var verdict="";
        if(cashFlowDiff>0&&growthDiff>=0)verdict="Strong swap: higher cash flow AND better growth prospects. Consider executing.";
        else if(cashFlowDiff>0&&growthDiff<0)verdict="Cash flow improves but growth outlook weakens. Good for income-focused investors.";
        else if(cashFlowDiff<=0&&growthDiff>0)verdict="Lower immediate cash flow but stronger capital appreciation potential. Suits growth investors.";
        else verdict="This swap reduces both cash flow and growth — reconsider unless there are non-financial reasons.";
        resCard.appendChild(div({background:cl.goldFaint,borderRadius:"6px",padding:"8px 10px"},[
          span({color:cl.gold,fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",display:"block",marginBottom:"2px"},"VERDICT"),
          span({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},verdict)
        ]));
        swCard.appendChild(resCard);
      }
    }
    wrap.appendChild(swCard);
  }
  } // end projections section

  if(mode==="assets"){
  // Asset Cards
  metrics.forEach(function(a){
    var expanded=ps.expandedId===a.id;
    var roiColor=a.m.roi>=15?cl.green:a.m.roi>=0?cl.yellow:cl.red;
    var sigColor=a.m.investSignal==="Undervalued"||a.m.investSignal==="Fair Value"?cl.green:a.m.investSignal==="Elevated"?cl.yellow:cl.red;
    var card=el("div",{style:{background:cl.surface,backdropFilter:cl.blur,WebkitBackdropFilter:cl.blur,border:"1px solid "+(expanded?"rgba(212,175,55,0.3)":cl.border),borderRadius:"14px",padding:"18px",marginBottom:"10px",cursor:"pointer",transition:"all 0.25s ease",boxShadow:cl.glassShadow},onclick:function(){ps.expandedId=expanded?null:a.id;render();}});
    card.addEventListener("mouseenter",function(){if(!expanded){card.style.borderColor="rgba(212,175,55,0.3)";card.style.transform="translateY(-2px)";card.style.boxShadow="0 8px 32px rgba(0,0,0,0.35),0 0 20px rgba(212,175,55,0.05)";}});
    card.addEventListener("mouseleave",function(){if(!expanded){card.style.borderColor=cl.border;card.style.transform="translateY(0)";card.style.boxShadow=cl.glassShadow;}});

    var header=div({display:"flex",justifyContent:"space-between",alignItems:"flex-start"});
    var left=div({flex:"1"});
    var nameRow=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"});
    nameRow.appendChild(span({color:cl.white,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},a.building||a.area));
    if(a.m.inDB)nameRow.appendChild(pill(a.m.grade,"gold"));
    left.appendChild(nameRow);
    left.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace",display:"block"},a.area+" · "+a.beds+" · "+parseInt(a.size).toLocaleString()+" sqft"));
    header.appendChild(left);
    var right=div({textAlign:"right"});
    right.appendChild(span({color:cl.gold,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},"AED "+a.m.currentValue.toLocaleString()));
    right.appendChild(span({color:roiColor,fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",display:"block"},(a.m.roi>=0?"+":"")+a.m.roi.toFixed(1)+"% ROI"));
    header.appendChild(right);
    card.appendChild(header);

    var pills=div({display:"flex",gap:"8px",marginTop:"10px",flexWrap:"wrap"});
    pills.appendChild(pill("Yield "+a.m.grossYield.toFixed(1)+"%","green"));
    pills.appendChild(pill("PSF "+a.m.currentPSF.toLocaleString(),"gold"));
    pills.appendChild(pill(a.m.investSignal,sigColor===cl.green?"green":sigColor===cl.yellow?"yellow":"red"));
    pills.appendChild(pill(a.m.holdingMonths+"mo held","gray"));
    card.appendChild(pills);

    if(expanded){
      var details=div({marginTop:"14px",borderTop:"1px solid "+cl.border,paddingTop:"14px"});
      details.addEventListener("click",function(e){e.stopPropagation();});
      var dGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"});
      [{l:"Purchase Price",v:"AED "+a.m.purchasePrice.toLocaleString(),s:a.m.extraCosts>0?"+AED "+a.m.extraCosts.toLocaleString()+" costs = AED "+a.m.costBasis.toLocaleString()+" basis":"PSF "+(parseInt(a.size)>0?Math.round(a.m.purchasePrice/parseInt(a.size)).toLocaleString():"—"),c:cl.white},{l:"Current Value",v:"AED "+a.m.currentValue.toLocaleString(),s:"PSF "+a.m.currentPSF.toLocaleString(),c:cl.gold},{l:"Annual Rent ("+(a.m.rentIsActual?"Actual":"Est.")+")",v:"AED "+a.m.rent.toLocaleString(),s:null,c:cl.white},{l:"Service Charge",v:"AED "+Math.round(a.m.sc).toLocaleString()+"/yr",s:null,c:cl.white},{l:"Gross Yield",v:a.m.grossYield.toFixed(1)+"%",s:null,c:cl.green},{l:"Net Yield",v:a.m.netYield.toFixed(1)+"%",s:null,c:cl.green}].forEach(function(item){
        var box=div({background:cl.raised,borderRadius:"8px",padding:"10px 12px"});
        box.appendChild(lbl(item.l));
        box.appendChild(span({color:item.c,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},item.v));
        if(item.s)box.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",display:"block"},item.s));
        dGrid.appendChild(box);
      });
      details.appendChild(dGrid);

      // Net Equity — only shown once a mortgage balance is on file, same
      // "don't clutter unleveraged portfolios" reasoning as the Overview
      // row above (added 2026-07-18).
      if(a.m.mortgage>0){
        var eqBox=div({background:cl.raised,borderRadius:"8px",padding:"10px 12px",marginBottom:"12px",display:"flex",justifyContent:"space-between",alignItems:"center"});
        var eqLeft=div({});eqLeft.appendChild(lbl("Net Equity"));eqLeft.appendChild(span({color:cl.gold,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",display:"block"},"AED "+a.m.netEquity.toLocaleString()));
        eqBox.appendChild(eqLeft);
        var eqRight=div({textAlign:"right"});eqRight.appendChild(lbl("Outstanding Mortgage"));eqRight.appendChild(span({color:cl.subHi,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},"AED "+a.m.mortgage.toLocaleString()));
        eqBox.appendChild(eqRight);
        details.appendChild(eqBox);
      }

      // Occupancy / Lease status (added 2026-07-18)
      if(a.occupancy&&a.occupancy!=="Not Specified"){
        var occRow=div({display:"flex",gap:"8px",alignItems:"center",marginBottom:"12px",flexWrap:"wrap"});
        occRow.appendChild(pill(a.occupancy,a.occupancy==="Rented"?"green":a.occupancy==="Vacant"?"yellow":"gray"));
        if(a.occupancy==="Rented"&&a.leaseEnd){
          var daysToLeaseEnd=Math.round((new Date(a.leaseEnd)-new Date())/86400000);
          if(daysToLeaseEnd>=0)occRow.appendChild(span({color:daysToLeaseEnd<=60?"#F59E0B":cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},daysToLeaseEnd<=60?"Lease ends in "+daysToLeaseEnd+"d — "+new Date(a.leaseEnd).toLocaleDateString():"Lease ends "+new Date(a.leaseEnd).toLocaleDateString()));
        }
        details.appendChild(occRow);
      }

      // Growth Forecast
      var forecast=div({background:cl.raised,borderRadius:"8px",padding:"10px 12px",marginBottom:"12px"});
      forecast.appendChild(lbl("3-Year Growth Forecast"));
      var fRow=div({display:"flex",justifyContent:"space-between",marginTop:"6px"});
      [{l:"Conservative",v:"+"+a.m.g0+"%",c:cl.yellow},{l:"Base",v:"+"+a.m.g1+"%",c:cl.green},{l:"Optimistic",v:"+"+a.m.g2+"%",c:cl.gold}].forEach(function(g){
        fRow.appendChild(div({textAlign:"center"},[
          span({color:g.c,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},g.v),
          span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",display:"block"},g.l),
        ]));
      });
      forecast.appendChild(fRow);
      details.appendChild(forecast);

      // Annualized Return + P&L
      var annBox=div({background:cl.goldFaint,border:"1px solid "+cl.goldDim,borderRadius:"8px",padding:"10px 12px",marginBottom:"12px",display:"flex",justifyContent:"space-between",alignItems:"center"});
      var annLeft=div({});
      annLeft.appendChild(lbl("Annualized Return"));
      annLeft.appendChild(span({color:a.m.annualizedROI>=0?cl.green:cl.red,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",display:"block"},(a.m.annualizedROI>=0?"+":"")+a.m.annualizedROI.toFixed(1)+"% p.a."));
      annBox.appendChild(annLeft);
      var annRight=div({textAlign:"right"});
      var unrealized=a.m.currentValue-a.m.costBasis;
      annRight.appendChild(lbl("Unrealized P&L"));
      annRight.appendChild(span({color:unrealized>=0?cl.green:cl.red,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},(unrealized>=0?"+":"")+"AED "+unrealized.toLocaleString()));
      annBox.appendChild(annRight);
      details.appendChild(annBox);

      // Total Return + Signal
      var trBox=div({background:cl.raised,borderRadius:"8px",padding:"10px 12px",marginBottom:"12px",display:"flex",justifyContent:"space-between",alignItems:"center"});
      var trLeft=div({});trLeft.appendChild(lbl("Total Return (Net Yield + Growth)"));
      trLeft.appendChild(span({color:a.m.totalReturn>=8?cl.green:a.m.totalReturn>=5?cl.yellow:cl.red,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",display:"block"},a.m.totalReturn.toFixed(1)+"% p.a."));
      trBox.appendChild(trLeft);
      var trRight=div({textAlign:"right"});trRight.appendChild(lbl("Investment Signal"));
      trRight.appendChild(span({color:sigColor,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},a.m.investSignal));
      trBox.appendChild(trRight);
      details.appendChild(trBox);

      // Sustainability Score
      var susBd=lookupBuilding(a.building||"",a.area||"");
      var susAd=AREAS[a.area]||{psf:1800,sc:15,y:[5,7],g:[3,9,16]};
      var susS=computeSustainabilityScore(a.building||"",a.area||"",susBd,susAd);
      var susC=susS.score>=75?"#10B981":susS.score>=50?"#EAB308":susS.score>=35?"#F97316":"#EF4444";
      var susRow=div({background:hexAlpha(susC,0.06),border:"1px solid "+hexAlpha(susC,0.2),borderRadius:"10px",padding:"10px 12px",marginBottom:"10px"});
      susRow.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"},[
        div({display:"flex",alignItems:"center",gap:"6px"},[span({fontSize:"13px"},""),span({color:susC,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Sustainability Score")]),
        div({display:"flex",alignItems:"center",gap:"6px"},[span({color:susC,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},String(susS.score)),span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},susS.tier)])
      ]));
      [{l:"Age/Grade",v:susS.age},{l:"SC Efficiency",v:susS.scEff},{l:"Green Area",v:susS.green},{l:"Liquidity",v:susS.liq}].forEach(function(fc){
        var fcc=fc.v>=75?"#10B981":fc.v>=50?"#EAB308":fc.v>=35?"#F97316":"#EF4444";
        var fRow=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"});
        fRow.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",width:"80px",flexShrink:"0"},fc.l));
        var bWrap=div({flex:"1",height:"4px",borderRadius:"2px",background:cl.border,overflow:"hidden"});
        bWrap.appendChild(div({height:"100%",width:fc.v+"%",borderRadius:"2px",background:fcc}));
        fRow.appendChild(bWrap);
        fRow.appendChild(span({color:fcc,fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",width:"24px",textAlign:"right"},String(fc.v)));
        susRow.appendChild(fRow);
      });
      details.appendChild(susRow);

      // Edit / Mark as Sold / Remove — added 2026-07-18 (previously only
      // "Remove Asset" existed, so a typo in floor/size meant deleting and
      // re-adding the whole property from scratch, and there was no way to
      // record a real sale — only permanent deletion).
      var actionsRow=div({display:"flex",gap:"8px",flexWrap:"wrap"});
      actionsRow.appendChild(btn({background:cl.goldFaint,border:"1px solid "+cl.goldDim,color:cl.gold,padding:"8px 16px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",fontWeight:"600"},"Edit",function(e){
        e.stopPropagation();
        var realIdx=ps.assets.findIndex(function(x){return x.id===a.id;});
        if(realIdx<0)return;
        ps._new=Object.assign({},ps._new,ps.assets[realIdx]);
        ps._editingId=a.id;ps.showAdd=true;ps.expandedId=null;render();
      }));
      actionsRow.appendChild(btn({background:"transparent",border:"1px solid "+cl.border,color:cl.subHi,padding:"8px 16px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",fontWeight:"600"},"Mark as Sold",function(e){
        e.stopPropagation();
        var salePriceStr=window.prompt("Sale price (AED)?","");
        if(salePriceStr===null)return; // cancelled
        var salePrice=parseFloat(String(salePriceStr).replace(/[^0-9.]/g,""));
        if(!(salePrice>0)){alert("Enter a valid sale price to record this sale.");return;}
        var saleDateStr=window.prompt("Sale date (YYYY-MM-DD)?",new Date().toISOString().slice(0,10));
        if(saleDateStr===null)return; // cancelled
        var realIdx=ps.assets.findIndex(function(x){return x.id===a.id;});
        if(realIdx<0)return;
        ps.assets[realIdx]=Object.assign({},ps.assets[realIdx],{status:"Sold",salePrice:salePrice,saleDate:saleDateStr||new Date().toISOString().slice(0,10)});
        try{localStorage.setItem("dubaival_portfolio",JSON.stringify(ps.assets));}catch(e2){}portfolioChanged();
        if(ps.expandedId===a.id)ps.expandedId=null;ps.aiAnalysis="";render();
      }));
      actionsRow.appendChild(btn({background:cl.redBg,border:"1px solid "+cl.redBo,color:cl.red,padding:"8px 16px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",fontWeight:"600"},"Remove Asset",function(e){e.stopPropagation();ps.assets=ps.assets.filter(function(x){return x.id!==a.id;});try{localStorage.setItem("dubaival_portfolio",JSON.stringify(ps.assets));}catch(e){}portfolioChanged();if(ps.expandedId===a.id)ps.expandedId=null;ps.aiAnalysis="";render();}));
      details.appendChild(actionsRow);
      card.appendChild(details);
    }
    wrap.appendChild(card);
  });

  // Sold Properties — Realized Gains (added 2026-07-18). Kept separate from
  // the active asset list/metrics above so a sale never inflates "Total
  // Value"/yield figures for a property no longer held, while still
  // preserving the transaction record instead of forcing outright deletion.
  if(soldAssets.length>0&&mode==="assets"){
    var soldWrap=div({marginTop:"6px",marginBottom:"14px"});
    soldWrap.appendChild(span({color:cl.sub,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"10px"},"◆ Sold Properties — Realized Gains"));
    soldAssets.forEach(function(a){
      var realizedCostBasis=(parseFloat(a.purchasePrice)||0)+(parseFloat(a.extraCosts)||0);
      var realizedPnl=(parseFloat(a.salePrice)||0)-realizedCostBasis;
      var sCard=div({background:cl.raised,border:"1px solid "+cl.border,borderRadius:"12px",padding:"14px 16px",marginBottom:"8px",opacity:"0.85"});
      var sRow=div({display:"flex",justifyContent:"space-between",alignItems:"flex-start"});
      var sLeft=div({});
      var sNameRow=div({display:"flex",alignItems:"center",gap:"8px"});
      sNameRow.appendChild(span({color:cl.subHi,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},a.building||a.area||"Property"));
      sNameRow.appendChild(pill("SOLD","gray"));
      sLeft.appendChild(sNameRow);
      sLeft.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace",display:"block",marginTop:"2px"},a.area+" · sold "+(a.saleDate||"—")));
      sRow.appendChild(sLeft);
      var sRight=div({textAlign:"right"});
      sRight.appendChild(span({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},"AED "+(parseFloat(a.salePrice)||0).toLocaleString()));
      sRight.appendChild(span({color:realizedPnl>=0?cl.green:cl.red,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},(realizedPnl>=0?"+":"")+"AED "+realizedPnl.toLocaleString()+" realized"));
      sRow.appendChild(sRight);
      sCard.appendChild(sRow);
      var sRemove=btn({background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"5px 12px",borderRadius:"6px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginTop:"8px"},"Remove Record",function(){
        ps.assets=ps.assets.filter(function(x){return x.id!==a.id;});
        try{localStorage.setItem("dubaival_portfolio",JSON.stringify(ps.assets));}catch(e){}portfolioChanged();render();
      });
      sCard.appendChild(sRemove);
      soldWrap.appendChild(sCard);
    });
    wrap.appendChild(soldWrap);
  }

  // Empty state (checks active holdings only — a portfolio with only sold
  // properties still shows this, since there's nothing currently held; the
  // sold history renders separately below regardless)
  if(activeAssets.length===0&&!ps.showAdd){
    var empty=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"40px 20px",textAlign:"center",marginBottom:"14px"});
    empty.appendChild(span({fontSize:"32px",display:"block",marginBottom:"12px"},"◆"));
    empty.appendChild(span({color:cl.white,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"6px"},"Start Building Your Portfolio"));
    empty.appendChild(span({color:cl.sub,fontSize:"12.5px",lineHeight:"1.7",display:"block",marginBottom:"16px"},"Add your Dubai properties to track performance, monitor valuations, and receive AI-powered investment signals."));
    wrap.appendChild(empty);
  }

  // Add button
  if(!ps.showAdd){
    var addBtn=el("button",{style:{width:"100%",padding:"13px",borderRadius:"10px",border:"1px dashed "+cl.goldDim,background:cl.goldFaint,color:cl.gold,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",marginBottom:"14px",letterSpacing:"0.04em"},onclick:function(){ps.showAdd=true;render();}},"+ ADD PROPERTY");
    wrap.appendChild(addBtn);
  }

  // Add form
  if(ps.showAdd){
    // Field set expanded 2026-07-18 (real portfolio-manager audit) — mortgage/
    // actualRent/occupancy/leaseEnd/extraCosts/bathrooms are new; parking
    // already existed in this default object but had no form input until now
    // (see the fg4/fg5/fg6 blocks below).
    if(!ps._new)ps._new={building:"",area:"",type:"Apartment",beds:"2 BR",floor:"",view:"Not specified",size:"",purchasePrice:"",purchaseDate:"",furnished:"Unfurnished",serviceCharge:"",parking:"1",bathrooms:"",mortgage:"",actualRent:"",occupancy:"Not Specified",leaseEnd:"",extraCosts:""};
    var n=ps._new;
    var isEditing=!!ps._editingId;
    var formCard=div({background:cl.surface,border:"1px solid "+cl.goldDim,borderRadius:"14px",padding:"20px",marginBottom:"14px"});
    var formHeader=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"});
    formHeader.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},isEditing?"◆ Edit Property":"◆ Add Property to Portfolio"));
    formHeader.appendChild(el("button",{style:{background:"transparent",border:"none",color:cl.sub,cursor:"pointer",fontSize:"16px",padding:"4px 8px"},onclick:function(){ps.showAdd=false;ps._editingId=null;render();}},"✕"));
    formCard.appendChild(formHeader);

    // AI Smart Bar for Portfolio
    formCard.appendChild(renderSmartBar({
      stateKey:"_aiPortfolio",histKey:"dv_smart_portfolio",title:"AI Portfolio Parser",subtitle:"Describe your investment — AI fills the form",
      placeholder:"e.g. Bought 2BR in Downtown for 2.5M in March 2023, furnished, floor 34, Burj view",
      examples:["Bought Studio in JLT for 650K, 2024","3BR villa DAMAC Hills, 3200sqft, 4.2M, 2022"],
      sysPrompt:'You are a Dubai real estate portfolio parser. Extract these fields and return ONLY a JSON object: {"building":null,"area":null,"propType":null,"beds":null,"size_sqft":null,"floor":null,"view":null,"furnished":null,"purchasePrice":null,"purchaseDate":null,"parking":null,"bathrooms":null,"serviceCharge":null}. propType: Apartment/Villa/Townhouse. beds: "Studio","1 BR","2 BR" etc. purchaseDate: YYYY-MM format. If not mentioned set to null. Parse Arabic: اشتريت=bought, غرفتين=2 BR, مفروش=Furnished, فيلا=Villa, مارينا=Dubai Marina.',
      fieldMap:[
        {k:"building",target:n,fk:"building"},
        {k:"area",target:n,fk:"area"},
        {k:"propType",target:n,fk:"type"},
        {k:"beds",target:n,fk:"beds"},
        {k:"size_sqft",target:n,fk:"size"},
        {k:"floor",target:n,fk:"floor"},
        {k:"view",target:n,fk:"view"},
        {k:"furnished",target:n,fk:"furnished"},
        {k:"purchasePrice",fn:function(v){n.purchasePrice=String(v).replace(/[^0-9]/g,"");}},
        {k:"purchaseDate",target:n,fk:"purchaseDate"},
        {k:"parking",target:n,fk:"parking"},
        {k:"serviceCharge",fn:function(v){n.serviceCharge=String(v).replace(/[^0-9.]/g,"");}},
        {k:"bathrooms",target:n,fk:"bathrooms"}
      ],
      onParsed:function(j){
        if(n.building&&n.building.length>2){var b=lookupBuilding(n.building,n.area);if(b&&b.sc)n.serviceCharge=String(b.sc);if(b&&b.a)n.area=b.a;}
        render();
      }
    }));

    // Building name
    var bField=div({marginBottom:"12px"});
    bField.appendChild(lbl("Building Name"));
    var bInp=inp(I(),"e.g. BLVD Heights, Opera Grand…","text",n.building,function(v){
      n.building=v;
      if(v.length>2){var b=lookupBuilding(v,n.area);if(b&&b.sc)n.serviceCharge=String(b.sc);if(b&&b.a)n.area=b.a;}
    });
    bField.appendChild(bInp);
    if(n.building.length>2&&lookupBuilding(n.building,n.area)){
      var bInfo=lookupBuilding(n.building,n.area);
      bField.appendChild(div({marginTop:"4px",display:"flex",gap:"6px"},[pill("✓ Verified","green"),pill("SC: "+bInfo.sc,"gold"),pill(bInfo.g,"gold")]));
    }
    formCard.appendChild(bField);

    var isVilla=n.type==="Villa"||n.type==="Townhouse";
    var aptViews=["Burj Khalifa + Fountain","Fountain View","Burj Khalifa View","Partial Burj View","Full Sea View","Partial Sea View","Palm View","Marina View","Full Canal View","Partial Canal View","Boulevard View","Creek Harbour View","Skyline View","Sheikh Zayed Road View","Pool View","Garden/Park View","Community View","Not specified"];
    var villaViews=["Beach Access View","Full Sea View","Palm View","Lagoon View","Golf View","Creek Harbour View","Lake View","Garden/Park View","Pool View","Skyline View","Community View","Not specified"];
    var viewOpts=isVilla?villaViews:aptViews;

    var fg1=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"});
    var areaW=div({});areaW.appendChild(lbl("Area *"));areaW.appendChild(mkSelect(S(),[""].concat(AREA_NAMES),n.area,function(v){n.area=v;}));fg1.appendChild(areaW);
    var typeW=div({});typeW.appendChild(lbl("Type"));typeW.appendChild(mkSelect(S(),["Apartment","Villa","Townhouse","Penthouse"],n.type,function(v){n.type=v;if((v==="Villa"||v==="Townhouse")&&aptViews.indexOf(n.view)>=0&&villaViews.indexOf(n.view)<0)n.view="Not specified";render();}));fg1.appendChild(typeW);
    var bedsW=div({});bedsW.appendChild(lbl("Bedrooms"));bedsW.appendChild(mkSelect(S(),["Studio","1 BR","2 BR","3 BR","4 BR","5 BR","5+ BR"],n.beds,function(v){n.beds=v;}));fg1.appendChild(bedsW);
    var floorW=div({});floorW.appendChild(lbl("Floor"));floorW.appendChild(inp(I(),"Floor #","number",n.floor,function(v){n.floor=v;}));fg1.appendChild(floorW);
    var viewW=div({});viewW.appendChild(lbl("View"));viewW.appendChild(mkSelect(S(),viewOpts,n.view,function(v){n.view=v;}));fg1.appendChild(viewW);
    var furnW=div({});furnW.appendChild(lbl("Furnished"));furnW.appendChild(mkSelect(S(),["Unfurnished","Semi-Furnished","Furnished"],n.furnished,function(v){n.furnished=v;}));fg1.appendChild(furnW);
    formCard.appendChild(fg1);

    var fg2=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"});
    var sizeW=div({});sizeW.appendChild(lbl("Size (sqft) *"));sizeW.appendChild(inp(I(),"1,200","number",n.size,function(v){n.size=v;}));fg2.appendChild(sizeW);
    var scW=div({});scW.appendChild(lbl("Service Charge (AED/sqft)"));scW.appendChild(inp(I(),"Auto for known buildings","number",n.serviceCharge,function(v){n.serviceCharge=v;}));fg2.appendChild(scW);
    formCard.appendChild(fg2);

    // Parking/Bathrooms — parking already fed computeAdjustedPSF()'s parking
    // premium but had no way to be entered other than the AI Smart Bar;
    // bathrooms is informational only (added 2026-07-18 portfolio audit).
    var fg2b=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"});
    var parkW=div({});parkW.appendChild(lbl("Parking Spaces"));parkW.appendChild(mkSelect(S(),["0","1","2","3","4+"],n.parking||"1",function(v){n.parking=v;}));fg2b.appendChild(parkW);
    var bathW=div({});bathW.appendChild(lbl("Bathrooms"));bathW.appendChild(inp(I(),"e.g. 2","number",n.bathrooms,function(v){n.bathrooms=v;}));fg2b.appendChild(bathW);
    formCard.appendChild(fg2b);

    var fg3=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"});
    var ppW=div({});ppW.appendChild(lbl("Purchase Price (AED) *"));ppW.appendChild(inp(I(),"2,500,000","number",n.purchasePrice,function(v){n.purchasePrice=v;}));fg3.appendChild(ppW);
    var pdW=div({});pdW.appendChild(lbl("Purchase Date *"));
    var dateInp=el("input",{style:Object.assign({},I(),{colorScheme:"dark"}),type:"date"});dateInp.value=n.purchaseDate||"";dateInp.addEventListener("change",function(){n.purchaseDate=dateInp.value;});
    pdW.appendChild(dateInp);fg3.appendChild(pdW);
    formCard.appendChild(fg3);

    // Real financial position — added 2026-07-18 portfolio audit. Without
    // these, ROI/equity/rent figures were always model estimates with no
    // connection to the user's actual leverage or actual rent collected;
    // "Equity Release" (below in Health) already referenced asset.mortgage
    // but no field ever set it, so releasable equity was always computed as
    // if the property had zero debt.
    var fg3b=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"});
    var mortW=div({});mortW.appendChild(lbl("Outstanding Mortgage (AED) — optional"));mortW.appendChild(inp(I(),"e.g. 1,200,000","number",n.mortgage,function(v){n.mortgage=v;}));fg3b.appendChild(mortW);
    var costW=div({});costW.appendChild(lbl("Other Costs Paid (AED) — optional"));costW.appendChild(inp(I(),"Agency fee, DLD fee, reno…","number",n.extraCosts,function(v){n.extraCosts=v;}));fg3b.appendChild(costW);
    formCard.appendChild(fg3b);

    var fg3c=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"});
    var arW=div({});arW.appendChild(lbl("Actual Annual Rent (AED) — optional"));arW.appendChild(inp(I(),"Leave blank to use market estimate","number",n.actualRent,function(v){n.actualRent=v;}));fg3c.appendChild(arW);
    var occW=div({});occW.appendChild(lbl("Occupancy"));occW.appendChild(mkSelect(S(),["Not Specified","Owner-Occupied","Rented","Vacant"],n.occupancy||"Not Specified",function(v){n.occupancy=v;render();}));fg3c.appendChild(occW);
    formCard.appendChild(fg3c);

    if(n.occupancy==="Rented"){
      var leaseW=div({marginBottom:"16px"});leaseW.appendChild(lbl("Lease End Date — optional"));
      var leaseInp=el("input",{style:Object.assign({},I(),{colorScheme:"dark"}),type:"date"});leaseInp.value=n.leaseEnd||"";leaseInp.addEventListener("change",function(){n.leaseEnd=leaseInp.value;});
      leaseW.appendChild(leaseInp);formCard.appendChild(leaseW);
    }

    var canAdd=n.area&&n.size&&n.purchasePrice&&n.purchaseDate;
    var btnRow=div({display:"flex",gap:"10px"});
    btnRow.appendChild(btn({flex:"1",padding:"13px",borderRadius:"10px",border:"none",background:canAdd?"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")":cl.border,color:canAdd?"#070B14":cl.sub,fontSize:"13px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",opacity:canAdd?"1":"0.5"},isEditing?"SAVE CHANGES":"ADD TO PORTFOLIO",function(){
      if(!canAdd)return;
      if(isEditing){
        var idx=ps.assets.findIndex(function(x){return x.id===ps._editingId;});
        if(idx>=0)ps.assets[idx]=Object.assign({},ps.assets[idx],n);
        ps._editingId=null;
      }else{
        var asset=Object.assign({},n,{id:Date.now().toString(36),status:"Active"});
        ps.assets.push(asset);
      }
      try{localStorage.setItem("dubaival_portfolio",JSON.stringify(ps.assets));}catch(e){}portfolioChanged();
      ps._new={building:"",area:"",type:"Apartment",beds:"2 BR",floor:"",view:"Not specified",size:"",purchasePrice:"",purchaseDate:"",furnished:"Unfurnished",serviceCharge:"",parking:"1",bathrooms:"",mortgage:"",actualRent:"",occupancy:"Not Specified",leaseEnd:"",extraCosts:""};
      ps.showAdd=false;ps.aiAnalysis="";render();
    }));
    btnRow.appendChild(btn({padding:"13px 20px",borderRadius:"10px",border:"1px solid "+cl.border,background:"transparent",color:cl.sub,fontSize:"13px",fontFamily:"'Space Grotesk',monospace"},"Cancel",function(){ps.showAdd=false;ps._editingId=null;render();}));
    formCard.appendChild(btnRow);
    wrap.appendChild(formCard);
  }

  // AI Analysis — Pro-gated (matches the Analyzer's PDF export gate): a
  // decisive BUY/HOLD/SELL-per-asset CFA-style report is exactly the kind
  // of premium output that justifies a Pro subscription, same reasoning
  // already applied to the Analyzer's PDF export.
  if(activeAssets.length>0){
    var _pfIsPro=typeof isProUser!=="function"||isProUser();
    wrap.appendChild(btn({width:"100%",padding:"13px",borderRadius:"10px",border:"none",background:ps.aiLoading?cl.border:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:ps.aiLoading?cl.sub:"#070B14",fontSize:"13px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",marginBottom:"10px",opacity:ps.aiLoading?"0.5":"1"},ps.aiLoading?"ANALYZING PORTFOLIO…":"AI PORTFOLIO ANALYSIS ◆"+(_pfIsPro?"":" (PRO)"),function(){
      if(ps.aiLoading)return;
      if(!_pfIsPro){if(typeof openUpgradeModal==="function")openUpgradeModal();return;}
      ps.aiLoading=true;ps.aiAnalysis="";ps.aiErr="";render();
      var areaDist2={};metrics.forEach(function(a){areaDist2[a.area]=(areaDist2[a.area]||0)+a.m.currentValue;});
      var areaEntries2=Object.entries(areaDist2).sort(function(a,b){return b[1]-a[1];});
      var summary=metrics.map(function(a){return"- "+(a.building||"Unknown")+" in "+a.area+": "+a.beds+", "+parseInt(a.size).toLocaleString()+" sqft, bought AED "+a.m.purchasePrice.toLocaleString()+" ("+a.purchaseDate+"), now AED "+a.m.currentValue.toLocaleString()+" (ROI "+a.m.roi.toFixed(1)+"%), gross yield "+a.m.grossYield.toFixed(1)+"%, net "+a.m.netYield.toFixed(1)+"%, grade: "+a.m.grade+", signal: "+a.m.investSignal+", total return: "+a.m.totalReturn.toFixed(1)+"%"+(a.m.mortgage>0?", mortgage AED "+a.m.mortgage.toLocaleString()+" (net equity AED "+a.m.netEquity.toLocaleString()+")":"")+(a.m.rentIsActual?", rent is ACTUAL (not estimated)":"");}).join("\n");
      var prompt="My Dubai real estate portfolio ("+_currentMonthYear()+"):\n"+summary+"\n\nTotal value: AED "+totalValue.toLocaleString()+" | Total ROI: "+totalROI.toFixed(1)+"%\nAvg gross yield: "+avgGrossYield.toFixed(1)+"% | Avg net yield: "+avgNetYield.toFixed(1)+"%\nAreas: "+areaEntries2.map(function(e){return e[0]+" ("+(e[1]/totalValue*100).toFixed(0)+"%)"}).join(", ")+"\n\nInvestment goals: Risk: "+ps.goals.risk+" | Horizon: "+ps.goals.horizon+" | Target: "+ps.goals.target+"\n\nFor EACH property give a signal: HOLD / SELL / BUY MORE with 1 sentence why.\nThen give 2-3 portfolio-level strategic recommendations.\nBe specific with AED numbers. Consider area growth forecasts and diversification.";
      askAI([{role:"user",content:prompt}],"You are DubAIVal Portfolio Advisor — senior wealth manager specializing in Dubai real estate portfolios. "+_currentMonthYear()+".\nYou manage AED 500M+ in property assets. You think like a CFA: IRR, cash-on-cash return, risk-adjusted yield, concentration risk, liquidity.\nAnalyze this portfolio:\n1. HEALTH CHECK: Overall diversification (area, type, grade), concentration risk, yield efficiency\n2. WINNERS & LOSERS: Which assets outperform/underperform area benchmarks? Use our DB PSF data.\n3. OPTIMIZATION: What to sell (overvalued vs area), what to buy (underweight sectors), rebalancing moves\n4. RISK ALERTS: Over-leveraged? Single-area exposure? Low liquidity assets? SC drag on yield?\n5. 3-YEAR OUTLOOK: Capital appreciation projection based on area growth data, total return forecast\nUse EXACT AED numbers from our 9,434-building database. Decisive BUY/HOLD/SELL signals per asset. Professional tone.","Dubai real estate market trends: "+areaEntries2.map(function(e){return e[0];}).join(", "),areaEntries2.map(function(e){return e[0];})).then(function(text){ps.aiAnalysis=text;ps.aiLoading=false;render();}).catch(function(e){ps.aiErr=e.message;ps.aiLoading=false;render();});
    }));
    if(ps.aiErr)wrap.appendChild(span({color:cl.red,fontSize:"11px",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"10px"},ps.aiErr));
  }
  if(ps.aiLoading){
    var spinWrap=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"24px",textAlign:"center",marginBottom:"14px"});
    spinWrap.appendChild(div({width:"36px",height:"36px",borderRadius:"50%",border:"2px solid "+cl.border,borderTopColor:cl.gold,animation:"spin 0.8s linear infinite",margin:"0 auto 14px"}));
    spinWrap.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},"AI analyzing your portfolio…"));
    wrap.appendChild(spinWrap);
  }
  if(ps.aiAnalysis&&!ps.aiLoading){
    var aiCard=div({background:cl.surface,border:"1px solid "+cl.goldDim,borderRadius:"14px",padding:"20px",marginBottom:"14px"});
    aiCard.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"◆ AI Portfolio Intelligence"));
    var aiFormatted=formatAIResponse(ps.aiAnalysis,cl);
    if(aiFormatted)aiCard.appendChild(aiFormatted);
    else{var aiText=div({color:cl.subHi,fontSize:"13.5px",lineHeight:"1.9",fontFamily:"'Inter',sans-serif",whiteSpace:"pre-wrap"});aiText.textContent=ps.aiAnalysis;aiCard.appendChild(aiText);}
    wrap.appendChild(aiCard);
  }
  } // end assets section

  // Empty state for Health/Projections when no active assets
  if(mode!=="assets"&&activeAssets.length===0){
    var emptyCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"40px 20px",textAlign:"center",marginBottom:"14px"});
    emptyCard.innerHTML='<i data-lucide="'+(mode==="health"?"heart-pulse":"trending-up")+'" style="width:48px;height:48px;color:'+cl.gold+';margin:0 auto 16px;display:block"></i>';
    emptyCard.appendChild(div({color:cl.white,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},mode==="health"?"Portfolio Health Dashboard":"Projections & What-If"));
    emptyCard.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif",marginBottom:"16px"},mode==="health"?"Add assets to see health score, diversification analysis & opportunity alerts":"Add assets to simulate future growth and swap scenarios"));
    var goBtn=el("button",{style:{padding:"10px 24px",background:"rgba(212,175,55,0.15)",color:cl.gold,border:"1px solid rgba(212,175,55,0.3)",borderRadius:"10px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){setSection("Portfolio","Assets");}});
    goBtn.textContent="+ Add Your First Asset";
    emptyCard.appendChild(goBtn);
    wrap.appendChild(emptyCard);
  }

  // Disclaimer
  var disc=div({background:cl.goldFaint,border:"1px solid "+cl.goldDim,borderRadius:"8px",padding:"10px 14px",fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",color:cl.subHi});
  disc.innerHTML="<strong style='color:"+cl.gold+"'>Note:</strong> Valuations use DubAIVal's Cascade AVM with hedonic pricing (11,700+ properties · 347 areas). Portfolio data is stored locally on your device. Not financial advice — consult a licensed advisor for investment decisions.";
  wrap.appendChild(disc);
  return wrap;
}

