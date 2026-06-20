// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- API ---------------------------------------------------------------------
var API_BASE=(location.hostname==="localhost"||location.hostname==="127.0.0.1")?"":"/api";
var UAE_RE_KEY="";try{UAE_RE_KEY=localStorage.getItem("dv_rapidapi")||"";}catch(e){}
const UAE_RE_HOST="uae-real-estate2.p.rapidapi.com";
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

async function fetchLiveData(building,area,beds){
  const bedsMap={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5};
  const bn=bedsMap[beds]||2;
  const q=(building&&building.length>2)?building+" "+area:area;
  try{
    const locId=await getUAELocationId(q)||await getUAELocationId(area);
    if(!locId)return{sales:[],txs:[]};
    var listParams="endpoint=properties/list&locationExternalIDs="+locId+"&purpose=for-sale&hitsPerPage=15&page=0&rooms_min="+bn+"&rooms_max="+bn;
    var txParams="endpoint=transactions/list&locationExternalIDs="+locId+"&page=1&hitsPerPage=12";
    var fetchList,fetchTx;
    if(UAE_RE_KEY){
      const h={"x-rapidapi-key":UAE_RE_KEY,"x-rapidapi-host":UAE_RE_HOST};
      const params=new URLSearchParams({locationExternalIDs:locId,purpose:"for-sale",hitsPerPage:"15",page:"0",rooms_min:String(bn),rooms_max:String(bn)});
      fetchList=fetch("https://"+UAE_RE_HOST+"/properties/list?"+params,{headers:h}).then(function(r){return r.ok?r.json():null});
      fetchTx=fetch("https://"+UAE_RE_HOST+"/transactions/list?locationExternalIDs="+locId+"&page=1&hitsPerPage=12",{headers:h}).then(function(r){return r.ok?r.json():null});
    }else{
      fetchList=fetch(API_BASE+"/proxy-rapidapi?"+listParams).then(function(r){return r.ok?r.json():null});
      fetchTx=fetch(API_BASE+"/proxy-rapidapi?"+txParams).then(function(r){return r.ok?r.json():null});
    }
    const [sp,tp]=await Promise.allSettled([fetchList,fetchTx]);
    const sales=sp.status==="fulfilled"&&sp.value&&sp.value.hits?sp.value.hits.filter(function(p){return p.price&&p.area}).map(function(p){return{price:p.price,size:p.area,psf:Math.round(p.price/p.area),beds:p.rooms}}).filter(function(p){return p.psf>400&&p.psf<15000}):[];
    const txs=tp.status==="fulfilled"&&tp.value&&tp.value.hits?tp.value.hits.filter(function(t){return t.price&&t.area}).map(function(t){return{price:t.price,size:t.area,psf:Math.round(t.price/t.area)}}).filter(function(t){return t.psf>400&&t.psf<15000}):[];
    return{sales,txs};
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

