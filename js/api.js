// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- API ---------------------------------------------------------------------
var API_BASE="/api";
var UAE_RE_KEY="";
const UAE_RE_HOST="uae-real-estate2.p.rapidapi.com";
const PF_HOST="uae-real-estate-api-propertyfinder-ae-data.p.rapidapi.com";
var GROQ_KEY="";try{GROQ_KEY=localStorage.getItem("dv_groq")||"";}catch(e){}

async function getUAELocationId(query){
  try{
    var r;
    if(UAE_RE_KEY){r=await fetch("https://"+UAE_RE_HOST+"/auto-complete?query="+encodeURIComponent(query)+"&hitsPerPage=5",{headers:{"x-rapidapi-key":UAE_RE_KEY,"x-rapidapi-host":UAE_RE_HOST}});}
    else{r=await fetch(API_BASE+"/proxy-rapidapi?endpoint=auto-complete&query="+encodeURIComponent(query)+"&hitsPerPage=5");}
    if(!r.ok)return null;
    const d=await r.json();
    const hits=d.hits||[];
    return hits.length>0?(hits[0].objectID||hits[0].id||null):null;
  }catch(e){return null;}
}

async function getPFLocationId(query){
  try{
    var r;
    if(UAE_RE_KEY){r=await fetch("https://"+PF_HOST+"/autocomplete-location?query="+encodeURIComponent(query),{headers:{"x-rapidapi-key":UAE_RE_KEY,"x-rapidapi-host":PF_HOST}});}
    else{r=await fetch(API_BASE+"/proxy-rapidapi?endpoint=autocomplete-location&source=pf&query="+encodeURIComponent(query));}
    if(!r.ok){console.warn("PF autocomplete-location: HTTP "+r.status);return null;}
    var d=await r.json();
    // PropertyFinder's underlying data API wraps results as {success,data:{...}}
    // with location objects keyed by "externalID" (confirmed via public API docs).
    var hits=d.data||d.hits||d.results||d;
    if(hits&&!Array.isArray(hits)){if(hits.locations)hits=hits.locations;else if(hits.properties)hits=hits.properties;else if(hits.data)hits=hits.data;}
    if(Array.isArray(hits)&&hits.length>0){
      var h0=hits[0];
      var id=h0.externalID||h0.id||h0.location_id||h0.objectID||h0.external_id||h0.key||null;
      if(id)return id;
    }
    if(d.externalID||d.id||d.location_id)return d.externalID||d.id||d.location_id;
    console.warn("PF autocomplete-location: no recognizable id field in response",d);
    return null;
  }catch(e){console.warn("PF autocomplete-location failed:",e.message);return null;}
}

async function fetchPFSales(query,beds,areaFallback){
  try{
    var locId=await getPFLocationId(query+" Dubai")||(areaFallback?await getPFLocationId(areaFallback+" Dubai"):null);
    if(!locId)return[];
    // Send both param spellings — public docs for this data source use the
    // plural "location_ids", but the RapidAPI reseller wrapper's own param
    // name isn't independently confirmed, so cover both rather than guess wrong.
    var params=new URLSearchParams({location_ids:String(locId),location_id:String(locId),page:"1"});
    if(beds!==undefined&&beds!==null)params.set("bedrooms",String(beds));
    var r;
    if(UAE_RE_KEY){r=await fetch("https://"+PF_HOST+"/search-sale?"+params,{headers:{"x-rapidapi-key":UAE_RE_KEY,"x-rapidapi-host":PF_HOST}});}
    else{r=await fetch(API_BASE+"/proxy-rapidapi?endpoint=search-sale&source=pf&"+params);}
    if(!r.ok){console.warn("PF search-sale: HTTP "+r.status);return[];}
    var d=await r.json();
    var rawPF=Array.isArray(d.data)?d.data:(d.data&&Array.isArray(d.data.data)?d.data.data:(d.data&&Array.isArray(d.data.properties)?d.data.properties:(d.hits||d.properties||d.results||[])));
    var items=Array.isArray(rawPF)?rawPF:[];
    return items.filter(function(p){
      var price=p.price&&typeof p.price==="object"?p.price.value:p.price;
      var size=typeof p.size==="number"?p.size:(typeof p.area==="number"?p.area:(typeof p.sqft==="number"?p.sqft:0));
      return price>0&&size>0;
    }).map(function(p){
      var price=p.price&&typeof p.price==="object"?p.price.value:p.price;
      var size=typeof p.size==="number"?p.size:(typeof p.area==="number"?p.area:(typeof p.sqft==="number"?p.sqft:0));
      var imgUrl=p.cover_photo||"";
      if(!imgUrl){var imgs=p.images||p.photos||[];if(Array.isArray(imgs)&&imgs.length>0){imgUrl=typeof imgs[0]==="string"?imgs[0]:(imgs[0].url||imgs[0].src||imgs[0].thumb||"");}}
      if(!imgUrl)imgUrl=p.thumbnail||p.image||"";
      return{price:price,size:size,psf:Math.round(price/size),beds:p.bedrooms||p.rooms||p.beds||0,img:imgUrl,title:p.title||"",source:"pf"};
    }).filter(function(p){return p.psf>400&&p.psf<15000;});
  }catch(e){return[];}
}

async function fetchLiveData(building,area,beds){
  const bedsMap={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5};
  const bn=bedsMap[beds]||2;
  const q=(building&&building.length>2)?building+" "+area:area;
  try{
    var bayutP=async function(){
      var locId=await getUAELocationId(q)||await getUAELocationId(area);
      if(!locId)return{sales:[],txs:[]};
      var fetchList,fetchTx;
      if(UAE_RE_KEY){
        var h={"x-rapidapi-key":UAE_RE_KEY,"x-rapidapi-host":UAE_RE_HOST};
        var params=new URLSearchParams({locationExternalIDs:locId,purpose:"for-sale",hitsPerPage:"24",page:"0",rooms_min:String(bn),rooms_max:String(bn)});
        fetchList=fetch("https://"+UAE_RE_HOST+"/properties/list?"+params,{headers:h}).then(function(r){return r.ok?r.json():null});
        fetchTx=fetch("https://"+UAE_RE_HOST+"/transactions/list?locationExternalIDs="+locId+"&page=1&hitsPerPage=20",{headers:h}).then(function(r){return r.ok?r.json():null});
      }else{
        var listParams="endpoint=properties/list&locationExternalIDs="+locId+"&purpose=for-sale&hitsPerPage=24&page=0&rooms_min="+bn+"&rooms_max="+bn;
        var txParams="endpoint=transactions/list&locationExternalIDs="+locId+"&page=1&hitsPerPage=20";
        fetchList=fetch(API_BASE+"/proxy-rapidapi?"+listParams).then(function(r){return r.ok?r.json():null});
        fetchTx=fetch(API_BASE+"/proxy-rapidapi?"+txParams).then(function(r){return r.ok?r.json():null});
      }
      var [sp,tp]=await Promise.allSettled([fetchList,fetchTx]);
      var sales=sp.status==="fulfilled"&&sp.value&&sp.value.hits?sp.value.hits.filter(function(p){return p.price&&p.area}).map(function(p){
        var imgs=p.coverPhoto?[p.coverPhoto.url||""]:(p.photos||[]).map(function(ph){return ph.url||"";});
        return{price:p.price,size:p.area,psf:Math.round(p.price/p.area),beds:p.rooms,img:imgs[0]||"",title:p.title||"",source:"bayut"};
      }).filter(function(p){return p.psf>400&&p.psf<15000;}):[];
      var txs=tp.status==="fulfilled"&&tp.value&&tp.value.hits?tp.value.hits.filter(function(t){return t.price&&t.area}).map(function(t){return{price:t.price,size:t.area,psf:Math.round(t.price/t.area)}}).filter(function(t){return t.psf>400&&t.psf<15000;}):[];
      return{sales:sales,txs:txs};
    };
    var pfP=fetchPFSales(q,bn,area);
    var [bayutRes,pfRes]=await Promise.allSettled([bayutP(),pfP]);
    var bayut=bayutRes.status==="fulfilled"?bayutRes.value:{sales:[],txs:[]};
    var pf=pfRes.status==="fulfilled"?pfRes.value:[];
    var allSales=bayut.sales.concat(pf);
    return{sales:allSales,txs:bayut.txs};
  }catch(e){return{sales:[],txs:[]};}
}

// --- VIEW-DISTANCE REFINEMENT (Tier 2 — real building geocode) ---------------
// Tier 1 (area-centroid distance, zero network dependency) already runs
// automatically inside computeAdjustedPSF()/computeRentalValuation() via
// getViewDistanceInfo() in js/valuation.js. This is the optional, more
// precise refinement: geocode the EXACT building (not just its area) via the
// same Google Geocoding proxy the Analyzer's own Drive Times/Nearby Amenities
// cards already use, so a "Burj Khalifa View"/"Full Sea View" claim gets
// dampened by the real distance FROM THAT BUILDING. Shares the same
// window._dvGeoCache those cards read/write — whichever resolves first saves
// the other a duplicate geocode call. Never throws; returns null on any
// failure (missing area, no API key configured, network error, Google
// finding no match) so the caller always has the solid Tier-1 area-level
// result to fall back on — this is a pure best-effort upgrade, never a
// requirement for the Analyzer to produce a result.
async function resolveViewDistance(building,area){
  if(!area)return null;
  var query=(building&&building.length>2?building+", ":"")+area;
  try{
    if(!window._dvGeoCache)window._dvGeoCache={};
    var loc=window._dvGeoCache[query];
    if(!loc){
      var r=await fetch("/api/proxy-maps?action=geocode&address="+encodeURIComponent(query));
      var data=await r.json();
      if(!data||data.lat==null)return null;
      loc={lat:data.lat,lng:data.lng};
      window._dvGeoCache[query]=loc;
    }
    var bkDistKm=typeof _dvBurjKhalifaKm==="function"?_dvBurjKhalifaKm(loc.lat,loc.lng):null;
    var seaDistKm=typeof _dvNearestBeachKm==="function"?_dvNearestBeachKm(loc.lat,loc.lng):null;
    // Stage 3 (2026-07-26): the same resolved building coordinate also gives
    // a real building-level distance to the 3 new landmark views — no extra
    // geocode call, just 3 more haversine calcs off the point already fetched.
    var burjAlArabDistKm=typeof _dvBurjAlArabKm==="function"?_dvBurjAlArabKm(loc.lat,loc.lng):null;
    var atlantisDistKm=typeof _dvAtlantisKm==="function"?_dvAtlantisKm(loc.lat,loc.lng):null;
    var operaDistKm=typeof _dvDubaiOperaKm==="function"?_dvDubaiOperaKm(loc.lat,loc.lng):null;
    return{bkDistKm:bkDistKm,seaDistKm:seaDistKm,burjAlArabDistKm:burjAlArabDistKm,atlantisDistKm:atlantisDistKm,operaDistKm:operaDistKm};
  }catch(e){return null;}
}

// --- SMART RENTAL INTELLIGENCE ENGINE ----------------------------------------
var _rentalCache={};
async function fetchLiveRentals(building,area,beds){
  var cacheKey=(building||"").toLowerCase().trim()+"|"+(area||"")+"|"+(beds||"2");
  if(_rentalCache[cacheKey]&&Date.now()-_rentalCache[cacheKey].ts<1800000)return _rentalCache[cacheKey].data;
  var bedsMap={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5};
  var bn=bedsMap[beds]!==undefined?bedsMap[beds]:2;
  var q=(building&&building.length>2)?building+" "+area:area;
  try{
    var bayutP=async function(){
      var locId=await getUAELocationId(q)||await getUAELocationId(area);
      if(!locId)return[];
      var params=new URLSearchParams({locationExternalIDs:locId,purpose:"for-rent",hitsPerPage:"24",page:"0"});
      if(bn>0){params.set("rooms_min",String(bn));params.set("rooms_max",String(bn));}
      else{params.set("categoryExternalID","4");}
      var r;
      if(UAE_RE_KEY){r=await fetch("https://"+UAE_RE_HOST+"/properties/list?"+params,{headers:{"x-rapidapi-key":UAE_RE_KEY,"x-rapidapi-host":UAE_RE_HOST}});}
      else{r=await fetch(API_BASE+"/proxy-rapidapi?endpoint=properties/list&"+params);}
      if(!r.ok)return[];
      var d=await r.json();
      return(d.hits||[]).filter(function(p){return p.price&&p.price>5000;}).map(function(p){
        return{price:p.price,size:p.area||0,beds:p.rooms||0,title:(p.title||"").toLowerCase(),source:"bayut"};
      });
    };
    var pfP=async function(){
      var locId=await getPFLocationId(q+" Dubai")||await getPFLocationId(area+" Dubai");
      if(!locId)return[];
      var params=new URLSearchParams({location_ids:String(locId),location_id:String(locId),page:"1"});
      if(bn!==undefined)params.set("bedrooms",String(bn));
      var r;
      if(UAE_RE_KEY){r=await fetch("https://"+PF_HOST+"/search-rent?"+params,{headers:{"x-rapidapi-key":UAE_RE_KEY,"x-rapidapi-host":PF_HOST}});}
      else{r=await fetch(API_BASE+"/proxy-rapidapi?endpoint=search-rent&source=pf&"+params);}
      if(!r.ok){console.warn("PF search-rent: HTTP "+r.status);return[];}
      var d=await r.json();
      var rawRentPF=Array.isArray(d.data)?d.data:(d.data&&Array.isArray(d.data.data)?d.data.data:(d.data&&Array.isArray(d.data.properties)?d.data.properties:(d.hits||d.properties||d.results||[])));
      var items=Array.isArray(rawRentPF)?rawRentPF:[];
      return items.filter(function(p){
        var price=p.price&&typeof p.price==="object"?p.price.value:p.price;
        return price&&price>5000;
      }).map(function(p){
        var size=typeof p.size==="number"?p.size:(typeof p.area==="number"?p.area:(typeof p.sqft==="number"?p.sqft:0));
        return{price:p.price&&typeof p.price==="object"?p.price.value:p.price,size:size,beds:p.bedrooms||p.rooms||p.beds||0,title:(p.title||"").toLowerCase(),source:"pf"};
      });
    };
    var[bayutRes,pfRes]=await Promise.allSettled([bayutP(),pfP()]);
    var bayutData=bayutRes.status==="fulfilled"?bayutRes.value:[];
    var pfData=pfRes.status==="fulfilled"?pfRes.value:[];
    var all=bayutData.concat(pfData);
    var buildingMatches=[];
    if(building&&building.length>2){
      var bWords=building.toLowerCase().split(/\s+/).filter(function(w){return w.length>2&&w!=="tower"&&w!=="the"&&w!=="residence"&&w!=="residences";});
      buildingMatches=all.filter(function(l){
        var matchCount=0;
        bWords.forEach(function(w){if(l.title.indexOf(w)>=0)matchCount++;});
        return matchCount>=Math.max(1,Math.floor(bWords.length*0.5));
      });
    }
    var result={all:all,buildingMatches:buildingMatches,areaListings:all,bayutCount:bayutData.length,pfCount:pfData.length,ts:Date.now()};
    _rentalCache[cacheKey]={data:result,ts:Date.now()};
    return result;
  }catch(e){return{all:[],buildingMatches:[],areaListings:[],bayutCount:0,pfCount:0,ts:Date.now()};}
}

// Pulls top semantically-relevant snippets from the growing RAG knowledge base
// (live news + daily market snapshots) for a free-text query. Always resolves
// (never throws) — returns "" if the knowledge base isn't configured yet or
// the lookup fails, so callers can treat it as a pure best-effort enrichment.
// `area` may be a single area name, an array of area names (fetched in
// parallel so every named area actually contributes context instead of
// relying on semantic luck across a multi-area query), or omitted for an
// unfiltered global search.
// Pulls top semantically-relevant snippets from the growing RAG knowledge
// base (live news + daily market snapshots) for a free-text query. Always
// resolves (never throws) — returns "" if the knowledge base isn't
// configured yet or the lookup fails, so callers can treat it as a pure
// best-effort enrichment. `area` may be a single area name, an array of
// area names (fetched via ONE request with `areas`, embedding the query
// once server-side and fanning it out per area — previously this made one
// full round-trip, including a fresh embedding call, PER AREA, re-embedding
// the identical query text up to 5x for no benefit), or omitted for an
// unfiltered global search.
async function fetchKnowledgeContext(query,area){
  var areas=Array.isArray(area)?area.filter(Boolean).slice(0,5):(area?[area]:[]);
  var merged;
  try{
    var body={query:query};
    if(areas.length>1)body.areas=areas;
    else if(areas.length===1)body.area=areas[0];
    var r=await fetch(API_BASE+"/knowledge-query",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(body)
    });
    merged=r.ok?((await r.json()).results||[]):[];
  }catch(e){merged=[];}
  if(!merged.length)return "";
  return merged.slice(0,8).map(function(x){return "- "+(x.title?x.title+": ":"")+x.content;}).join("\n");
}

// Scans free text for mentions of known DubAIVal area names (case-insensitive
// substring match against the 347-area benchmark DB), so free-form queries
// (e.g. Chat Agents) can still ground with an area filter instead of always
// falling back to an unfiltered global search.
// "Dubai" itself is a real (catch-all) AREAS key, so it would match almost
// any real-estate query and wrongly narrow retrieval to that one generic
// bucket — excluded here since it names no specific area.
var _AREA_DETECT_EXCLUDE={"Dubai":1};
function _detectAreasInText(text){
  if(!text||typeof AREAS==="undefined")return [];
  var lower=text.toLowerCase();
  var hits=[];
  Object.keys(AREAS).forEach(function(name){
    if(_AREA_DETECT_EXCLUDE[name])return;
    if(name.length>3&&lower.indexOf(name.toLowerCase())!==-1)hits.push(name);
  });
  return hits.slice(0,5);
}

async function askAI(messages,system,groundQuery,groundAreas){
  const groqMessages=[];
  var sys=system||"";
  if(groundQuery){
    var areas=groundAreas&&(Array.isArray(groundAreas)?groundAreas.length:groundAreas)?groundAreas:_detectAreasInText(groundQuery);
    var context=await fetchKnowledgeContext(groundQuery,areas);
    if(context){
      sys=(sys?sys+"\n\n":"")+"Relevant up-to-date Dubai real estate knowledge (from live news and daily market data — use only if genuinely helpful, ignore if irrelevant):\n"+context;
    }
  }
  if(sys)groqMessages.push({role:"system",content:sys});
  messages.forEach(function(m){groqMessages.push({role:m.role,content:m.content})});
  var r;
  if(GROQ_KEY){
    r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+GROQ_KEY},
      body:JSON.stringify({model:"llama-3.3-70b-versatile",max_tokens:1000,messages:groqMessages})
    });
  }else{
    r=await fetch(API_BASE+"/proxy-groq",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"llama-3.3-70b-versatile",max_tokens:1000,messages:groqMessages})
    });
  }
  if(!r.ok)throw new Error("API "+r.status);
  const d=await r.json();
  return d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content||"";
}
function callGroqRaw(groqBody){
  if(GROQ_KEY){return fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+GROQ_KEY},body:JSON.stringify(groqBody)});}
  return fetch(API_BASE+"/proxy-groq",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(groqBody)});
}

// --- AI RESPONSE FORMATTER (Rich styled output) ------------------------------
function formatAIResponse(text,cl){
  if(!text||!cl)return null;
  var container=el("div",{style:{display:"flex",flexDirection:"column",gap:"8px"}});
  var signalPatterns=[
    {rx:/\b(HOLD|SELL|BUY MORE|BUY|STRONG BUY|AVOID|UNDERVALUED|OVERVALUED|FAIR VALUE)\b/gi,type:"signal"},
    {rx:/\b(BULLISH|BEARISH|NEUTRAL)\b/gi,type:"sentiment"},
    {rx:/\b(DISTRESS|GOOD PRICE|FAIR PRICE|OVERPRICED)\b/gi,type:"verdict"}
  ];
  var signalColors={
    "hold":"#F59E0B","sell":"#EF4444","buy more":"#10B981","buy":"#10B981","strong buy":"#10B981",
    "avoid":"#EF4444","undervalued":"#10B981","overvalued":"#EF4444","fair value":"#60A5FA",
    "bullish":"#10B981","bearish":"#EF4444","neutral":"#F59E0B",
    "distress":"#10B981","good price":"#10B981","fair price":"#F59E0B","overpriced":"#EF4444"
  };
  var metricRx=/^[\s•\-\*]*([A-Za-z\s\/\(\)]+?):\s*(AED\s*[\d,\.]+[MKBmkb]?|[\d,\.]+\s*%|[\d,\.]+\s*(?:sqft|PSF|years?|months?|AED))\s*$/gm;
  var metrics=[];
  var match;
  while((match=metricRx.exec(text))!==null){
    var label=match[1].replace(/^[\s•\-\*]+/,"").trim();
    var value=match[2].trim();
    if(label.length>2&&label.length<40)metrics.push({label:label,value:value,idx:match.index,len:match[0].length});
  }
  if(metrics.length>=2){
    var metricIndices=new Set();
    metrics.forEach(function(m){for(var i=m.idx;i<m.idx+m.len;i++)metricIndices.add(i);});
    var textParts=[];
    var lastEnd=0;
    metrics.forEach(function(m){
      if(m.idx>lastEnd)textParts.push({type:"text",content:text.substring(lastEnd,m.idx)});
      lastEnd=m.idx+m.len;
    });
    if(lastEnd<text.length)textParts.push({type:"text",content:text.substring(lastEnd)});
    textParts.forEach(function(p){
      var t=p.content.trim();
      if(!t)return;
      var block=el("div",{style:{color:cl.subHi,fontSize:"13px",lineHeight:"1.8",fontFamily:"'Inter',sans-serif",whiteSpace:"pre-wrap"}});
      block.appendChild(document.createTextNode(t));
      formatInlineSignals(block,t,signalPatterns,signalColors,cl);
      container.appendChild(block);
    });
    var mCard=el("div",{style:{background:"linear-gradient(145deg,"+cl.surface+",rgba(7,11,20,0.95))",border:"1px solid "+cl.goldDim,borderRadius:"12px",padding:"14px 16px",boxShadow:"0 4px 15px rgba(138,100,32,0.15)"}});
    mCard.appendChild(div({color:cl.gold,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"◆ Key Metrics"));
    metrics.forEach(function(m,i){
      var mRow=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<metrics.length-1?"1px solid rgba(255,255,255,0.06)":"none"}});
      mRow.appendChild(span({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif"},m.label));
      var valColor=cl.gold;
      if(m.value.includes("%")){var n=parseFloat(m.value);if(!isNaN(n))valColor=n>=7?"#10B981":n>=4?"#F59E0B":n<0?"#EF4444":cl.gold;}
      mRow.appendChild(span({color:valColor,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},m.value));
      mCard.appendChild(mRow);
    });
    container.appendChild(mCard);
  }else{
    var lines=text.split("\n");
    lines.forEach(function(line){
      if(!line.trim())return;
      var lineEl=el("div",{style:{color:cl.subHi,fontSize:"13px",lineHeight:"1.8",fontFamily:"'Inter',sans-serif",padding:"1px 0"}});
      formatInlineSignals(lineEl,line,signalPatterns,signalColors,cl);
      container.appendChild(lineEl);
    });
  }
  return container;
}

function formatInlineSignals(parentEl,text,patterns,colors,cl){
  parentEl.innerHTML="";
  var segments=[{start:0,end:text.length,type:"text"}];
  patterns.forEach(function(p){
    var newSegments=[];
    segments.forEach(function(seg){
      if(seg.type!=="text"){newSegments.push(seg);return;}
      var str=text.substring(seg.start,seg.end);
      var rx=new RegExp(p.rx.source,"gi");
      var m,last=0;
      while((m=rx.exec(str))!==null){
        if(m.index>last)newSegments.push({start:seg.start+last,end:seg.start+m.index,type:"text"});
        newSegments.push({start:seg.start+m.index,end:seg.start+m.index+m[0].length,type:p.type,word:m[0]});
        last=m.index+m[0].length;
      }
      if(last<str.length)newSegments.push({start:seg.start+last,end:seg.end,type:"text"});
    });
    segments=newSegments;
  });
  var numRx=/\b(AED\s*[\d,\.]+[MKBmkb]?|[\d,\.]+\s*%|[\d,\.]+\s*PSF)\b/gi;
  var finalSegments=[];
  segments.forEach(function(seg){
    if(seg.type!=="text"){finalSegments.push(seg);return;}
    var str=text.substring(seg.start,seg.end);
    var rx=new RegExp(numRx.source,"gi");
    var m,last=0;
    while((m=rx.exec(str))!==null){
      if(m.index>last)finalSegments.push({start:seg.start+last,end:seg.start+m.index,type:"text"});
      finalSegments.push({start:seg.start+m.index,end:seg.start+m.index+m[0].length,type:"number",word:m[0]});
      last=m.index+m[0].length;
    }
    if(last<str.length)finalSegments.push({start:seg.start+last,end:seg.end,type:"text"});
  });
  finalSegments.forEach(function(seg){
    var chunk=text.substring(seg.start,seg.end);
    if(seg.type==="text"){
      parentEl.appendChild(document.createTextNode(chunk));
    }else if(seg.type==="signal"||seg.type==="sentiment"||seg.type==="verdict"){
      var c=colors[seg.word.toLowerCase()]||cl.gold;
      var badge=el("span",{style:{color:c,background:hexAlpha(c,0.12),fontWeight:"800",fontSize:"11px",padding:"2px 8px",borderRadius:"10px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.04em",display:"inline-block",margin:"0 2px"}});
      badge.textContent=seg.word.toUpperCase();
      parentEl.appendChild(badge);
    }else if(seg.type==="number"){
      var ns=el("span",{style:{color:cl.gold,fontWeight:"700",fontFamily:"'Space Grotesk',monospace"}});
      ns.textContent=chunk;
      parentEl.appendChild(ns);
    }
  });
}

