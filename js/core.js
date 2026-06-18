// --- THEME --------------------------------------------------------------------
function useThemeToggle(){return function(){darkMode=!darkMode;render();}}

// --- HELPERS -----------------------------------------------------------------
function hexAlpha(c,a){if(c&&c.charAt(0)==="#"){var r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);return"rgba("+r+","+g+","+b+","+a+")";}if(c&&c.indexOf("rgb(")===0)return c.replace("rgb(","rgba(").replace(")",","+a+")");return c||"rgba(255,255,255,0.05)";}
function el(tag,attrs,children){
  const e=document.createElement(tag);
  if(attrs)Object.entries(attrs).forEach(function(kv){
    const k=kv[0],v=kv[1];
    if(k==="style"&&typeof v==="object")Object.assign(e.style,v);
    else if(k.startsWith("on"))e.addEventListener(k.slice(2).toLowerCase(),v);
    else if(k==="className")e.className=v;
    else e.setAttribute(k,v);
  });
  if(children){
    if(Array.isArray(children))children.forEach(function(c){if(c!=null&&c!==false)e.appendChild(typeof c==="string"?document.createTextNode(c):c)});
    else if(typeof children==="string")e.textContent=children;
    else if(children)e.appendChild(children);
  }
  return e;
}
function div(style,children){return el("div",{style:style},children)}
function span(style,text){const e=el("span",{style:style});if(text!=null)e.textContent=String(text);return e}
function inp(style,placeholder,type,value,onChange){
  const e=el("input",{style:style,placeholder:placeholder||"",type:type||"text"});
  e.value=value||"";
  e.addEventListener("input",function(){onChange(e.value)});
  return e;
}
function mkSelect(style,options,value,onChange){
  const e=el("select",{style:style});
  options.forEach(function(o){
    const opt=el("option",{value:o},o);
    if(o===value)opt.selected=true;
    e.appendChild(opt);
  });
  e.addEventListener("change",function(){onChange(e.value)});
  return e;
}
function btn(style,text,onClick){
  const e=el("button",{style:{...style,cursor:"pointer"},onclick:onClick});
  e.textContent=text;
  return e;
}
function lbl(text){return span({color:C().sub,fontSize:"9.5px",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"5px",fontFamily:"'Space Grotesk',monospace",display:"block"},text)}
function S(){return{width:"100%",background:C().bg,border:"1px solid "+C().border,color:C().white,padding:"10px 14px",borderRadius:"10px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none"}}
function I(){return{...S(),caretColor:C().gold,boxSizing:"border-box"}}
function fld(labelText,input){const w=div({marginBottom:"12px"});w.appendChild(lbl(labelText));w.appendChild(input);return w;}
function pill(text,color){
  const cl=C();
  const map={green:{bg:cl.greenBg,bo:cl.greenBo,tx:cl.green},gold:{bg:cl.goldFaint,bo:cl.goldDim,tx:cl.gold},gray:{bg:"transparent",bo:cl.border,tx:cl.sub},red:{bg:cl.redBg,bo:cl.redBo,tx:cl.red},yellow:{bg:cl.yellowBg,bo:cl.yellowBo,tx:cl.yellow}};
  const p=map[color]||map.gray;
  return span({background:p.bg,border:"1px solid "+p.bo,color:p.tx,padding:"3px 10px",borderRadius:"20px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",fontWeight:"600"},text);
}

// --- STATE --------------------------------------------------------------------
var currentTab="Market";
// -- Live Geopolitical Adjustment ---------------------------------------------
// ── MACRO RISK SYSTEM ─────────────────────────────────────────────────────
// Based on: Geopolitical × Social × Economic weighted model
// Area sensitivity reflects foreign buyer ratio, off-plan ratio, logistics exposure

var AREA_SENSITIVITY={"Downtown Dubai":0.7,"Dubai Marina":0.75,"Palm Jumeirah":0.6,"Business Bay":0.65,"Jumeirah Village Circle":0.5,"Dubai Hills Estate":0.55,"DAMAC Hills":0.5,"DAMAC Lagoons":0.45,"Arabian Ranches 3":0.4,"Emaar Beachfront":0.7,"Dubai Creek Harbour":0.65,"MBR City":0.6,"Sobha Hartland":0.6,"Al Furjan":0.45,"Jumeirah Lake Towers":0.6,"Dubai South":0.35,"Tilal Al Ghaf":0.4,"DIFC":0.7,"City Walk":0.65,"Dubai Harbour":0.7};

var MACRO_VARS={
  riskFactor:1.00,
  aptAdj:-0.03,         // Apartments: -3% (geo pressure, supply pipeline)
  villaAdj:0.02,        // Villas: +2% (outperforming, end-user demand)
  socialIndex:1.00,
  economicOutlook:1.00,
  lastUpdated:null,
  source:"Default",
  fetched:false,
  fetching:false,
  log:[]               // History of changes with reasons
};

// Compute effective geoAdj for a specific area
function getAreaGeoAdj(area){
  var sens=AREA_SENSITIVITY[area]||0.55;
  var risk=(MACRO_VARS.riskFactor-1)*sens;
  var social=(MACRO_VARS.socialIndex-1)*0.3;
  var econ=(MACRO_VARS.economicOutlook-1)*0.5;
  // Cap tightly: max -5% to +3% - never let AI distort valuations
  return Math.max(-0.05,Math.min(0.03,risk+social+econ));
}

// Legacy LIVE_GEO compatibility
var LIVE_GEO={
  get adj(){return getAreaGeoAdj(window._currentArea||"");},
  label:"Dynamic Risk Model",
  fetched:false,
  fetching:false
};

// Live market data fetcher - queries Groq with DLD official context
async function fetchLiveMarket(){
  if(MACRO_VARS.fetched||MACRO_VARS.fetching)return;
  MACRO_VARS.fetching=true;
  try{
    var today=new Date();
    var dateStr=today.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
    var prompt='Dubai real estate macro risk analysis for '+dateStr+'.\n\nOFFICIAL DLD CONTEXT:\n- Q1 2026: AED 252B transactions (+31% YoY)\n- Jan 2026: 16,919 sales, avg PSF AED 1,976 (+18% YoY)\n- Feb-Mar 2026: Geo shock from US-Israel-Iran strikes, -20% DFM index\n- May 2026: Full recovery, AED 14B+/week, 87% cash purchases\n- June 2026: Volatile stabilization phase\n\nBased on latest available data, return ONLY this JSON (no other text):\n{"riskFactor":<0.90-1.05>,"socialIndex":<0.95-1.05>,"economicOutlook":<0.95-1.05>,"label":"<brief status in English>","reason":"<one sentence why>"}\n\nGuidelines:\n- riskFactor<1 = geopolitical tension reducing demand\n- socialIndex reflects DLD weekly volume trend\n- economicOutlook reflects price trend and fundamentals\n- Be conservative, not optimistic';

    var resp=await callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:prompt}],max_tokens:200,temperature:0.1});
    
    var data=await resp.json();
    var text=data.choices&&data.choices[0]?data.choices[0].message.content:"";
    var clean=text.replace(/```json|```/g,"").trim();
    var parsed=JSON.parse(clean);
    
    if(typeof parsed.riskFactor==="number"){
      MACRO_VARS.riskFactor=Math.max(0.95,Math.min(1.03,parsed.riskFactor));
      MACRO_VARS.socialIndex=Math.max(0.97,Math.min(1.03,parsed.socialIndex||1.0));
      MACRO_VARS.economicOutlook=Math.max(0.97,Math.min(1.03,parsed.economicOutlook||1.0));
      MACRO_VARS.label=parsed.label||"AI Analysis";
      MACRO_VARS.reason=parsed.reason||"";
      MACRO_VARS.lastUpdated=new Date().toISOString();
      MACRO_VARS.source="Groq AI · DLD Context · "+dateStr;
      MACRO_VARS.log.unshift({date:dateStr,rf:MACRO_VARS.riskFactor,si:MACRO_VARS.socialIndex,eo:MACRO_VARS.economicOutlook,reason:parsed.reason});
      if(MACRO_VARS.log.length>30)MACRO_VARS.log.pop();
    }
  }catch(e){
    if(window.location.protocol!=="file:")console.warn("Market fetch:",e.message);
  }
  MACRO_VARS.fetched=true;
  MACRO_VARS.fetching=false;
  render();
}

// ── SUPABASE LIVE CONFIG ──────────────────────────────────────────────────────
var SUPABASE_URL="https://vrrqajwmygghfmagpgrr.supabase.co";
var SUPABASE_KEY="sb_publishable_HNHSNnmBUYcTnF35bMEzxA_qhsoe6Yj";

async function fetchSupabaseConfig(){
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/market_config?id=eq.1&select=apt_adj,villa_adj,geo_label,updated_at",{
      headers:{
        "apikey":SUPABASE_KEY,
        "Authorization":"Bearer "+SUPABASE_KEY,
        "Content-Type":"application/json"
      }
    });
    var data=await resp.json();
    if(data&&data[0]){
      var cfg=data[0];
      if(typeof cfg.apt_adj==="number")MACRO_VARS.aptAdj=cfg.apt_adj;
      if(typeof cfg.villa_adj==="number")MACRO_VARS.villaAdj=cfg.villa_adj;
      if(cfg.geo_label)MACRO_VARS.label=cfg.geo_label;
      MACRO_VARS.lastUpdated=cfg.updated_at;
      MACRO_VARS.source="Supabase · Live · DLD Data";
      // Also fetch market intelligence from Groq with current DLD context
      fetchMarketIntelligence();
      render();
    }
  }catch(e){
    console.warn("Supabase fetch failed:",e.message);
  }
}

async function fetchMarketIntelligence(){
  if(MACRO_VARS.intelFetched)return;
  MACRO_VARS.intelFetched=true;
  try{
    var prompt='Dubai real estate market intelligence for June 14, 2026.\n\nVERIFIED DLD DATA:\n- Avg PSF June 2026: AED 1,755 (+19.8% YoY) [Dubai-Index.com]\n- Q1 2026 volume: AED 252B (+31% YoY) [DLD]\n- Villa PSF: +16% YoY [DLD/Bayut]\n- Apt PSF: -3% MoM (April adj), still +5.49% YoY\n- Ready market: -8% transactions YoY (off-plan dominates at 72%)\n- Feb-Mar 2026: geo shock, -51% transaction volume week of March\n- May 2026: full recovery, AED 14B+/week\n- Distress deals: Marina 15-35%, Downtown/Palm 20-30% below asking\n\nBased on this OFFICIAL data, return JSON only:\n{"apt_adj":<-0.05 to 0.05>,"villa_adj":<-0.03 to 0.05>,"label":"<10 words>","reason":"<one sentence with specific data point>","market_psf":1755,"trend":"stable"}\n\nNote: adj=0 means no change to DB PSF values. Negative=buyers have leverage. DLD PSF is already current 2026 data.';
    var resp=await callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:prompt}],max_tokens:200,temperature:0.1});
    var data=await resp.json();
    var text=data.choices&&data.choices[0]?data.choices[0].message.content:"";
    var clean=text.replace(/```json|```/g,"").trim();
    var parsed=JSON.parse(clean);
    // Only apply if Supabase didn't override (Supabase takes priority)
    if(typeof parsed.apt_adj==="number"&&MACRO_VARS.aptAdj===0){
      // Cap tightly: -5% to +3%
      MACRO_VARS.aptAdj=Math.max(-0.05,Math.min(0.03,parsed.apt_adj));
    }
    if(typeof parsed.villa_adj==="number"&&MACRO_VARS.villaAdj===0){
      MACRO_VARS.villaAdj=Math.max(-0.03,Math.min(0.05,parsed.villa_adj));
    }
    if(parsed.reason)MACRO_VARS.reason=parsed.reason;
    if(parsed.label&&!MACRO_VARS.label)MACRO_VARS.label=parsed.label;
    MACRO_VARS.source="Groq AI · DLD June 2026 Data";
    render();
  }catch(e){
    console.warn("Market intel fetch failed:",e.message);
  }
}

async function saveSupabaseConfig(aptAdj, villaAdj, label){
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/market_config?id=eq.1",{
      method:"PATCH",
      headers:{
        "apikey":SUPABASE_KEY,
        "Authorization":"Bearer "+SUPABASE_KEY,
        "Content-Type":"application/json",
        "Prefer":"return=minimal"
      },
      body:JSON.stringify({apt_adj:aptAdj,villa_adj:villaAdj,geo_label:label,updated_at:new Date().toISOString()})
    });
    return resp.ok;
  }catch(e){
    console.warn("Supabase save failed:",e.message);
    return false;
  }
}

if(typeof window!=="undefined"){
  setTimeout(fetchLiveMarket,1500);
  setTimeout(fetchSupabaseConfig,500);
  setTimeout(fetchDynamicBenchmarks,600);
  setTimeout(fetchCalibrationData,700);
}

// -- USER PROFILE (persisted) ----------------------------------------------
var USER_PROFILE={
  investorType:"income",   // income | growth | flip | enduse
  risk:"moderate",          // conservative | moderate | aggressive
  budgetMin:500000,
  budgetMax:5000000,
  preferredAreas:[],
  name:""
};
try{
  var saved=localStorage.getItem("dv_user_profile");
  if(saved)USER_PROFILE=Object.assign(USER_PROFILE,JSON.parse(saved));
}catch(e){}
function getChatSys(){
  var areaSummary="";
  try{
    var areaStats={};
    Object.entries(DB).forEach(function(e){
      var a=e[1].a;
      if(!areaStats[a])areaStats[a]={psfs:[],count:0};
      areaStats[a].psfs.push(e[1].p);
      areaStats[a].count++;
    });
    var lines=[];
    Object.entries(areaStats).sort(function(a,b){return b[1].count-a[1].count;}).slice(0,25).forEach(function(e){
      var psfs=e[1].psfs.sort(function(a,b){return a-b;});
      var med=psfs[Math.floor(psfs.length/2)];
      lines.push(e[0]+":PSF"+med+"("+e[1].count+"bldgs)");
    });
    areaSummary=lines.join("|");
  }catch(x){}
  var profile="Investor:"+(USER_PROFILE.investorType||"general")+"|Risk:"+(USER_PROFILE.risk||"moderate")+(USER_PROFILE.budgetMax?"|Budget:AED"+(USER_PROFILE.budgetMax/1e6).toFixed(1)+"M":"");
  return "You are DubAIVal AI - Dubai property intelligence. June 2026.\n"+
    "DB:5612 buildings DLD-verified. "+areaSummary+"\n"+
    "Market:Post-geo correction. Buyer leverage. Cash 87%. Off-plan 78%.\n"+
    "User:"+profile+"\n"+
    "Rules: Give specific AED numbers. If building in DB use exact PSF. For yield: Gross=(rent/price)*100. Net=Gross minus SC minus 7% costs. Be concise. Verdict first.";
}
function saveProfile(){
  try{localStorage.setItem("dv_user_profile",JSON.stringify(USER_PROFILE));}catch(e){}
}
var showProfilePanel=false;

var analyzerState={
  stage:0, // 0=form, 1=loading, 2=result
  investorProfile:"investment", // income | growth | flip | enduse
  // Form data
  f:{
    area:"",
    propCategory:"", // apartment | villa
    // Apartment fields
    aptSubtype:"", // Studio, 1BR, 2BR, etc, Duplex, Penthouse, Loft, Mansion
    beds:"",
    bathrooms:"",
    hasMaid:false,
    floor:"",
    view:"Not specified",
    size:"",
    furnished:"Unfurnished",
    parking:"1",
    serviceCharge:"",
    price:"",
    // Villa fields
    villaType:"", // Townhouse, Villa, Standalone Villa, Semi-Detached Villa, Terraced House, Compound Villa
    cluster:"",
    floors:"",
    plotSize:"",
    buaSize:"",
    privatePool:false,
    singleRow:false,
    cornerVilla:false,
    building:"",
  },
  val:null,aiText:"",liveData:null,err:""
};
var compareState={a1:"",a2:"",budget:"",purpose:"Investment",loading:false,result:"",err:""};
var personalState={budget:"",role:"Investor",family:"Couple",children:"0",work:"",purpose:"Investment",timeline:"6 months",loading:false,result:"",err:""};
var chatState={msgs:[{role:"assistant",text:"DubAIVal Intelligence.\n\nBuilding-level knowledge · June 2026 data · Confidence scoring.\n\nAsk me about any building, deal, or strategy."}],input:"",loading:false};

