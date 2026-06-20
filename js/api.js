// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- API ---------------------------------------------------------------------
var API_BASE=(location.hostname==="localhost"||location.hostname==="127.0.0.1")?"":"/api";
var UAE_RE_KEY="";try{UAE_RE_KEY=localStorage.getItem("dv_rapidapi")||"";}catch(e){}
const UAE_RE_HOST="uae-real-estate2.p.rapidapi.com";
const PF_HOST="propertyfinder-uae-data.p.rapidapi.com";
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
    if(!r.ok)return null;
    var d=await r.json();
    var hits=d.data||d.hits||d;
    if(Array.isArray(hits)&&hits.length>0)return hits[0].id||hits[0].location_id||hits[0].objectID||null;
    if(d.id)return d.id;
    return null;
  }catch(e){return null;}
}

async function fetchPFSales(area,beds){
  try{
    var locId=await getPFLocationId(area+" Dubai");
    if(!locId)return[];
    var params=new URLSearchParams({location_id:String(locId),page:"1"});
    if(beds!==undefined&&beds!==null)params.set("bedrooms",String(beds));
    var r;
    if(UAE_RE_KEY){r=await fetch("https://"+PF_HOST+"/search-sale?"+params,{headers:{"x-rapidapi-key":UAE_RE_KEY,"x-rapidapi-host":PF_HOST}});}
    else{r=await fetch(API_BASE+"/proxy-rapidapi?endpoint=search-sale&source=pf&"+params);}
    if(!r.ok)return[];
    var d=await r.json();
    var items=d.data||d.hits||d.properties||[];
    if(!Array.isArray(items))return[];
    return items.filter(function(p){
      var price=p.price&&typeof p.price==="object"?p.price.value:p.price;
      var size=p.size||p.area||(p.sqft?p.sqft:null);
      return price&&size&&price>0&&size>0;
    }).map(function(p){
      var price=p.price&&typeof p.price==="object"?p.price.value:p.price;
      var size=p.size||p.area||p.sqft;
      var imgs=p.images||p.photos||[];
      var imgUrl=Array.isArray(imgs)&&imgs.length>0?(typeof imgs[0]==="string"?imgs[0]:imgs[0].url||imgs[0].src||""):"";
      return{price:price,size:size,psf:Math.round(price/size),beds:p.bedrooms||p.beds||0,img:imgUrl,title:p.title||"",source:"pf"};
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
    var pfP=fetchPFSales(area,bn);
    var [bayutRes,pfRes]=await Promise.allSettled([bayutP(),pfP]);
    var bayut=bayutRes.status==="fulfilled"?bayutRes.value:{sales:[],txs:[]};
    var pf=pfRes.status==="fulfilled"?pfRes.value:[];
    var allSales=bayut.sales.concat(pf);
    return{sales:allSales,txs:bayut.txs};
  }catch(e){return{sales:[],txs:[]};}
}

async function askAI(messages,system){
  const groqMessages=[];
  if(system)groqMessages.push({role:"system",content:system});
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

