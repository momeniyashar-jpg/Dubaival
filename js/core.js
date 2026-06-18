// --- THEME --------------------------------------------------------------------
function useThemeToggle(){return function(){darkMode=!darkMode;render();}}

// --- i18n --------------------------------------------------------------------
var dvLang="en";
try{dvLang=localStorage.getItem("dv_lang")||"en";}catch(e){}
var LANG={
en:{
  // Tabs
  tab_market:"Market",tab_index:"Index",tab_analyzer:"Analyzer",tab_map:"Map",tab_find:"Find",
  tab_deals:"Deals",tab_compare:"Compare",tab_portfolio:"Portfolio",tab_alerts:"Alerts",
  tab_chat:"AI Chat",tab_about:"About",
  // Header
  hdr_subtitle:"AI Property Intelligence",hdr_live:"LIVE",hdr_profile:"Profile",
  // Analyzer
  az_title:"Property Valuation",az_search:"Search Building, Cluster or Community",
  az_search_ph:"e.g. Marina Gate, Venice, Address Kempinski, Sidra...",
  az_area:"Area",az_building:"Building",az_beds:"Bedrooms",az_size:"Size (sqft)",
  az_price:"Asking Price (AED)",az_floor:"Floor",az_view:"View",az_furnished:"Furnished",
  az_analyze:"Analyze Property",az_loading:"Analyzing with DLD data...",
  // Quick Check
  qc_title:"Quick Check — Is Your Deal Fair?",qc_sub:"Enter any Dubai property to get an instant AI verdict",
  qc_select_area:"Select Area",qc_building_ph:"Building name (optional)",qc_price_ph:"Asking price (AED)",
  qc_btn:"Is This Price Fair?",qc_full:"Want full analysis? →",qc_error:"Could not compute — try selecting a different area.",
  // Verdicts
  v_distress:"DISTRESS DEAL",v_good:"GOOD PRICE",v_fair:"FAIR MARKET",v_over:"OVERPRICED",
  v_distress_s:"GREAT DEAL ✓",v_good_s:"GOOD PRICE ✓",v_fair_s:"FAIR PRICE",v_over_s:"OVERPRICED ✗",
  // Signals
  sig_under:"Undervalued",sig_fair:"Fair Value",sig_elevated:"Elevated",sig_bubble:"Bubble Risk",
  // Confidence
  conf_vh:"Very High",conf_h:"High",conf_m:"Medium",conf_l:"Low",conf_ind:"Indicative",
  // Market
  mkt_overview:"Market Overview",mkt_track:"Track Record",
  // Portfolio
  pf_title:"Portfolio Manager",pf_add:"Add Asset",pf_health:"Portfolio Health Score",
  pf_opp:"Opportunity Alerts",pf_proj:"Future Projection Simulator",pf_swap:"What-If Scenario",
  pf_profile:"Investment Profile",
  // Deals
  dl_title:"Deal Network",dl_post:"Post Deal",dl_browse:"Browse",dl_agents:"Agent Hub",
  dl_rera_req:"RERA BRN is required",dl_verified:"RERA Verified ✓",dl_filter_rera:"RERA Verified Only",
  // Map
  map_title:"Interactive Map",
  // Index
  idx_title:"Dubai Real Estate Market Index",idx_expensive:"Most Expensive Areas",
  idx_yield:"Highest Yield Areas",idx_growth:"Fastest Growing Areas",idx_value:"Best Value Areas",
  idx_compare:"Area Comparison",idx_heatmap:"Price Heatmap — All Areas",
  // About
  abt_mission:"Bringing AI-Powered Transparency to Dubai Real Estate",
  abt_whatwedo:"What We Do",abt_tech:"Technology",abt_partners:"For Partners & Government",
  // Common
  download_pdf:"Download PDF Report",arabic_pdf:"تقرير بالعربية",
  print_hint:"Print dialog opens → Save as PDF",
  not_advice:"Not financial advice — consult a licensed advisor for investment decisions.",
  footer_tag:"DubAIVal · DLD · Cascade AVM · June 2026",
  // Auth
  auth_signin:"Sign In",auth_signup:"Sign Up",auth_signout:"Sign Out",
  auth_name:"Full Name",auth_email:"Email",auth_password:"Password",
  auth_create_account:"Create Account",auth_cloud_sync:"Cloud sync for your portfolio",
  auth_fill_fields:"Please fill in all fields",
  auth_disclaimer:"Your data is encrypted and stored securely via Supabase Auth."
},
ar:{
  tab_market:"السوق",tab_index:"المؤشر",tab_analyzer:"التقييم",tab_map:"الخريطة",tab_find:"البحث",
  tab_deals:"الصفقات",tab_compare:"المقارنة",tab_portfolio:"المحفظة",tab_alerts:"التنبيهات",
  tab_chat:"الذكاء الاصطناعي",tab_about:"حول",
  hdr_subtitle:"ذكاء عقاري بالذكاء الاصطناعي",hdr_live:"مباشر",hdr_profile:"الملف الشخصي",
  az_title:"تقييم العقار",az_search:"ابحث عن مبنى أو مجمع أو منطقة",
  az_search_ph:"مثال: مارينا جيت، فينيس، داماك هيلز...",
  az_area:"المنطقة",az_building:"المبنى",az_beds:"غرف النوم",az_size:"المساحة (قدم مربع)",
  az_price:"السعر المطلوب (درهم)",az_floor:"الطابق",az_view:"الإطلالة",az_furnished:"التأثيث",
  az_analyze:"تحليل العقار",az_loading:"جاري التحليل ببيانات دائرة الأراضي...",
  qc_title:"فحص سريع — هل الصفقة عادلة؟",qc_sub:"أدخل أي عقار في دبي للحصول على حكم فوري",
  qc_select_area:"اختر المنطقة",qc_building_ph:"اسم المبنى (اختياري)",qc_price_ph:"السعر المطلوب (درهم)",
  qc_btn:"هل هذا السعر عادل؟",qc_full:"تحليل كامل →",qc_error:"تعذر الحساب — حاول اختيار منطقة أخرى.",
  v_distress:"صفقة ممتازة",v_good:"سعر جيد",v_fair:"سعر عادل",v_over:"سعر مرتفع",
  v_distress_s:"صفقة ممتازة ✓",v_good_s:"سعر جيد ✓",v_fair_s:"سعر عادل",v_over_s:"سعر مرتفع ✗",
  sig_under:"مقوّم بأقل من قيمته",sig_fair:"قيمة عادلة",sig_elevated:"مرتفع",sig_bubble:"مخاطر فقاعة",
  conf_vh:"عالية جداً",conf_h:"عالية",conf_m:"متوسطة",conf_l:"منخفضة",conf_ind:"استرشادي",
  mkt_overview:"نظرة عامة على السوق",mkt_track:"سجل الأداء",
  pf_title:"مدير المحفظة",pf_add:"إضافة أصل",pf_health:"مؤشر صحة المحفظة",
  pf_opp:"تنبيهات الفرص",pf_proj:"محاكاة التوقعات المستقبلية",pf_swap:"سيناريو ماذا لو",
  pf_profile:"الملف الاستثماري",
  dl_title:"شبكة الصفقات",dl_post:"نشر صفقة",dl_browse:"تصفح",dl_agents:"مركز الوكلاء",
  dl_rera_req:"رقم ريرا مطلوب",dl_verified:"ريرا موثق ✓",dl_filter_rera:"الموثقون فقط",
  map_title:"الخريطة التفاعلية",
  idx_title:"مؤشر سوق العقارات في دبي",idx_expensive:"أغلى المناطق",
  idx_yield:"أعلى عائد",idx_growth:"أسرع نمواً",idx_value:"أفضل قيمة",
  idx_compare:"مقارنة المناطق",idx_heatmap:"خريطة الأسعار — جميع المناطق",
  abt_mission:"نقل الشفافية المدعومة بالذكاء الاصطناعي إلى سوق دبي العقاري",
  abt_whatwedo:"ماذا نقدم",abt_tech:"التكنولوجيا",abt_partners:"للشركاء والجهات الحكومية",
  download_pdf:"تحميل تقرير PDF",arabic_pdf:"تقرير بالعربية",
  print_hint:"يفتح مربع الطباعة → حفظ كـ PDF",
  not_advice:"ليس نصيحة مالية — استشر مستشاراً مرخصاً لقرارات الاستثمار.",
  footer_tag:"DubAIVal · دائرة الأراضي · محرك Cascade · يونيو ٢٠٢٦",
  auth_signin:"تسجيل الدخول",auth_signup:"إنشاء حساب",auth_signout:"خروج",
  auth_name:"الاسم الكامل",auth_email:"البريد الإلكتروني",auth_password:"كلمة المرور",
  auth_create_account:"إنشاء حساب",auth_cloud_sync:"مزامنة سحابية لمحفظتك",
  auth_fill_fields:"يرجى ملء جميع الحقول",
  auth_disclaimer:"بياناتك مشفرة ومخزنة بأمان عبر Supabase Auth."
}
};
function t(key){return(LANG[dvLang]&&LANG[dvLang][key])||LANG.en[key]||key;}
function setLang(lang){dvLang=lang;try{localStorage.setItem("dv_lang",lang);}catch(e){}
  document.documentElement.dir=lang==="ar"?"rtl":"ltr";
  document.documentElement.lang=lang==="ar"?"ar":"en";
  if(lang==="ar")document.body.style.fontFamily="Cairo,'Space Grotesk',monospace";
  else document.body.style.fontFamily="";
  render();
}
function isRTL(){return dvLang==="ar";}

// --- HELPERS -----------------------------------------------------------------
function hexAlpha(c,a){if(c&&c.charAt(0)==="#"){var r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);return"rgba("+r+","+g+","+b+","+a+")";}if(c&&c.indexOf("rgb(")===0)return c.replace("rgb(","rgba(").replace(")",","+a+")");return c||"rgba(255,255,255,0.05)";}

var GREEN_AREAS={"Dubai Hills":90,"Dubai Creek Harbour":88,"Expo City":92,"Sustainable City":95,"Masdar City":95,"Town Square":80,"Tilal Al Ghaf":88,"The Valley":82,"Dubai South":78,"Emaar Beachfront":75,"Bluewaters":80,"MBR City":82,"DAMAC Hills":72,"Mudon":75,"Remraam":65};
function computeSustainabilityScore(building,area,bData,aData){
  var grade=bData?bData.g:"B";
  var ageScore=grade==="Ultra"||grade==="A+"?92:grade==="A"?85:grade==="A-"?75:grade==="B+"?65:grade==="B"?55:grade==="C"?35:50;
  var scEff=70;
  if(bData&&bData.sc&&aData&&aData.sc&&aData.sc>0){
    var ratio=bData.sc/aData.sc;
    scEff=ratio<0.8?90:ratio<=1.0?70:ratio<=1.2?50:30;
  }
  var greenScore=GREEN_AREAS[area]||50;
  var dom=(aData&&aData.dom)||60;
  var liqScore=dom<30?90:dom<=60?70:dom<=90?50:30;
  var score=Math.round(ageScore*0.30+scEff*0.25+greenScore*0.25+liqScore*0.20);
  score=Math.max(0,Math.min(100,score));
  var tier=score>=75?"Excellent":score>=60?"Good":score>=45?"Average":score>=35?"Below Average":"Poor";
  return{score:score,tier:tier,age:ageScore,scEff:scEff,green:greenScore,liq:liqScore};
}

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
    "DB:6162 buildings DLD-verified. "+areaSummary+"\n"+
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

// --- NOTIFICATION SYSTEM ---
var DV_NOTIF={items:[],showPanel:false};
try{var _nn=localStorage.getItem("dv_notifications");if(_nn)DV_NOTIF.items=JSON.parse(_nn);}catch(e){}
function addNotification(icon,text,tab,extra){
  var n={id:Date.now()+"_"+Math.random().toString(36).slice(2,6),icon:icon,text:text,tab:tab||null,extra:extra||null,read:false,ts:new Date().toISOString()};
  DV_NOTIF.items.unshift(n);
  if(DV_NOTIF.items.length>50)DV_NOTIF.items=DV_NOTIF.items.slice(0,50);
  try{localStorage.setItem("dv_notifications",JSON.stringify(DV_NOTIF.items));}catch(e){}
  render();
}
function markAllNotifRead(){
  DV_NOTIF.items.forEach(function(n){n.read=true;});
  try{localStorage.setItem("dv_notifications",JSON.stringify(DV_NOTIF.items));}catch(e){}
  render();
}
function getUnreadCount(){return DV_NOTIF.items.filter(function(n){return!n.read;}).length;}
function checkDealNotifications(oldInquiries,newInquiries,deals,myTokens){
  var myDeals=deals.filter(function(d){return myTokens.indexOf(d.edit_token)!==-1;});
  var myDealIds=myDeals.map(function(d){return d.id;});
  var oldIds={};
  Object.keys(oldInquiries).forEach(function(did){
    (oldInquiries[did]||[]).forEach(function(inq){oldIds[inq.id]=inq.status;});
  });
  Object.keys(newInquiries).forEach(function(did){
    (newInquiries[did]||[]).forEach(function(inq){
      var dealId=parseInt(did);
      var deal=deals.find(function(d){return d.id===dealId;});
      var area=deal?deal.area:"property";
      if(!oldIds[inq.id]&&myDealIds.indexOf(dealId)!==-1){
        addNotification("📩","New inquiry from "+inq.buyer_name+" for your "+area+" listing","deals");
      }
      if(oldIds[inq.id]&&oldIds[inq.id]==="pending"&&inq.status==="approved"&&myDealIds.indexOf(dealId)===-1){
        addNotification("✅","Your inquiry for "+area+" deal has been approved! You can now view media","deals");
      }
      if(oldIds[inq.id]&&oldIds[inq.id]==="pending"&&inq.status==="rejected"&&myDealIds.indexOf(dealId)===-1){
        addNotification("❌","Your inquiry for "+area+" deal was declined","deals");
      }
    });
  });
}
function checkMatchNotifications(dealId,matches){
  var key="dv_notif_matches_"+dealId;
  var prev={};try{var p=localStorage.getItem(key);if(p)prev=JSON.parse(p);}catch(e){}
  var now={};
  matches.forEach(function(m){
    now[m.deal.id]=true;
    if(!prev[m.deal.id]){
      addNotification("🤖","New matching deal in "+m.deal.area+" — "+(m.aiScore||m.score)+"% match","deals");
    }
  });
  try{localStorage.setItem(key,JSON.stringify(now));}catch(e){}
}
function renderNotifBell(){
  var cl=C();var cnt=getUnreadCount();
  var wrap=el("div",{style:{position:"relative",display:"inline-block"}});
  var btn=el("button",{style:{background:DV_NOTIF.showPanel?cl.goldFaint:"transparent",border:"1px solid "+(DV_NOTIF.showPanel?cl.gold:cl.border),borderRadius:"20px",padding:"5px 10px",cursor:"pointer",color:DV_NOTIF.showPanel?cl.gold:cl.sub,fontSize:"14px",position:"relative"}});
  btn.textContent="🔔";
  if(cnt>0){
    var badge=el("div",{style:{position:"absolute",top:"-4px",right:"-4px",background:"#EF4444",color:"#fff",fontSize:"8px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",minWidth:"16px",height:"16px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",boxSizing:"border-box"}});
    badge.textContent=cnt>9?"9+":String(cnt);
    btn.appendChild(badge);
  }
  btn.addEventListener("click",function(e){e.stopPropagation();DV_NOTIF.showPanel=!DV_NOTIF.showPanel;render();});
  wrap.appendChild(btn);
  if(DV_NOTIF.showPanel){
    var panel=el("div",{style:{position:"absolute",top:"42px",right:"0",width:"300px",maxHeight:"360px",background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:"200",overflow:"hidden"}});
    var pHdr=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:"1px solid "+cl.border}});
    pHdr.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"Notifications"));
    if(cnt>0){
      var markBtn=el("button",{style:{background:"transparent",border:"none",color:"#3B82F6",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",padding:"2px 6px"}});
      markBtn.textContent="Mark all read";
      markBtn.addEventListener("click",function(e){e.stopPropagation();markAllNotifRead();});
      pHdr.appendChild(markBtn);
    }
    panel.appendChild(pHdr);
    var list=el("div",{style:{maxHeight:"300px",overflowY:"auto"}});
    if(!DV_NOTIF.items.length){
      list.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",textAlign:"center",padding:"30px 14px"},"No notifications yet"));
    }
    DV_NOTIF.items.forEach(function(n){
      var item=el("div",{style:{display:"flex",gap:"10px",padding:"10px 14px",borderBottom:"1px solid "+cl.border,background:n.read?"transparent":"rgba(201,168,76,0.04)",cursor:"pointer",transition:"background 0.2s"}});
      item.addEventListener("mouseenter",function(){this.style.background="rgba(255,255,255,0.03)";});
      item.addEventListener("mouseleave",function(){this.style.background=n.read?"transparent":"rgba(201,168,76,0.04)";});
      item.addEventListener("click",function(e){e.stopPropagation();n.read=true;try{localStorage.setItem("dv_notifications",JSON.stringify(DV_NOTIF.items));}catch(e){}if(n.tab){activeTab=n.tab;DV_NOTIF.showPanel=false;render();}});
      item.appendChild(span({fontSize:"16px",flexShrink:"0"},n.icon));
      var right=el("div",{style:{flex:"1",minWidth:"0"}});
      right.appendChild(div({color:n.read?cl.sub:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.4",wordBreak:"break-word"},n.text));
      right.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginTop:"3px",opacity:"0.6"},timeAgo(n.ts)));
      item.appendChild(right);
      if(!n.read){item.appendChild(el("div",{style:{width:"6px",height:"6px",borderRadius:"50%",background:cl.gold,flexShrink:"0",marginTop:"4px"}}));}
      list.appendChild(item);
    });
    panel.appendChild(list);
    wrap.appendChild(panel);
    setTimeout(function(){document.addEventListener("click",function closeNotif(){DV_NOTIF.showPanel=false;render();document.removeEventListener("click",closeNotif);},{once:true});},0);
  }
  return wrap;
}

// --- REUSABLE AI SMART BAR ---
function renderSmartBar(opts){
  var cl=C();
  var stateKey=opts.stateKey;
  if(!window[stateKey])window[stateKey]={text:"",parsing:false,parsed:null,missing:[],filled:[]};
  var ai=window[stateKey];
  var histKey=opts.histKey||"dv_smart_"+stateKey;

  function doAiParse(){
    var txt=(ai.text||"").trim();if(!txt||ai.parsing)return;
    ai.parsing=true;ai.parsed=null;ai.missing=[];ai.filled=[];render();
    askAI([{role:"user",content:txt}],opts.sysPrompt).then(function(resp){
      ai.parsing=false;
      try{
        var raw=resp.replace(/```json\s*/g,"").replace(/```/g,"").trim();
        var j=JSON.parse(raw);ai.parsed=j;ai.filled=[];ai.missing=[];
        opts.fieldMap.forEach(function(m){
          var v=j[m.k];
          if(v!==null&&v!==undefined&&v!==""){
            if(m.fn)m.fn(v);else if(m.target)m.target[m.fk]=typeof v==="boolean"?v:String(v);
            ai.filled.push(m.k);
          }else{ai.missing.push(m.k);}
        });
        try{
          var hist=JSON.parse(localStorage.getItem(histKey)||"[]");
          hist=hist.filter(function(h){return h!==txt;});
          hist.unshift(txt);if(hist.length>5)hist=hist.slice(0,5);
          localStorage.setItem(histKey,JSON.stringify(hist));
        }catch(e){}
        if(opts.onParsed)opts.onParsed(j,ai);
        else render();
      }catch(e){ai.missing=["Parse error — try a clearer description"];ai.parsing=false;render();}
    }).catch(function(e){ai.parsing=false;ai.missing=["AI error: "+e.message];render();});
  }

  var box=div({background:"rgba(201,168,76,0.03)",border:"2px solid transparent",borderImage:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+","+cl.gold+") 1",borderRadius:"0",padding:"20px",marginBottom:"20px",position:"relative"});
  var inner=div({background:cl.surface,borderRadius:"16px",padding:"20px",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"});
  inner.appendChild(div({textAlign:"center",marginBottom:"14px"},[
    div({fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",color:cl.gold,marginBottom:"4px"},opts.title||"✨ AI Smart Fill"),
    div({fontSize:"11px",fontFamily:"'Inter',sans-serif",color:cl.sub},opts.subtitle||"Describe in natural language — AI fills the form")
  ]));
  var row=div({display:"flex",gap:"8px",marginBottom:"10px"});
  var aiInp=el("input",{type:"text",placeholder:opts.placeholder||"Describe...",
    style:{flex:"1",background:cl.raised,border:"2px solid "+(ai.filled.length?cl.green:cl.border),color:"#F0F2F5",padding:"13px 16px",borderRadius:"12px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",transition:"border-color 0.3s, box-shadow 0.3s"}});
  aiInp.value=ai.text||"";
  aiInp.addEventListener("input",function(){ai.text=this.value;ai.parsed=null;ai.missing=[];ai.filled=[];});
  aiInp.addEventListener("focus",function(){this.style.boxShadow="0 0 20px "+hexAlpha(cl.gold,0.15);this.style.borderColor=cl.gold;});
  aiInp.addEventListener("blur",function(){this.style.boxShadow="none";this.style.borderColor=ai.filled.length?cl.green:cl.border;});
  aiInp.addEventListener("keydown",function(e){if(e.key==="Enter")doAiParse();});
  row.appendChild(aiInp);
  var aiBtn=el("button",{style:{background:ai.parsing?"#4B5563":"linear-gradient(135deg,#C9A84C,#7A5E28)",color:ai.parsing?"#9CA3AF":"#08090C",border:"none",padding:"13px 20px",borderRadius:"12px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:ai.parsing?"not-allowed":"pointer",whiteSpace:"nowrap",minWidth:"110px"}});
  aiBtn.textContent=ai.parsing?"Parsing…":"✨ AI Fill";
  if(!ai.parsing)aiBtn.addEventListener("click",doAiParse);
  row.appendChild(aiBtn);inner.appendChild(row);

  if(ai.missing.length>0&&ai.parsed){
    inner.appendChild(div({background:hexAlpha("#F59E0B",0.08),border:"1px solid "+hexAlpha("#F59E0B",0.25),borderRadius:"8px",padding:"8px 12px",marginBottom:"8px",color:"#F59E0B",fontSize:"11px",fontFamily:"'Inter',sans-serif"},"⚠ Please also specify: "+ai.missing.join(", ")));
  }else if(ai.missing.length>0){
    inner.appendChild(div({background:hexAlpha("#EF4444",0.08),border:"1px solid "+hexAlpha("#EF4444",0.25),borderRadius:"8px",padding:"8px 12px",marginBottom:"8px",color:"#EF4444",fontSize:"11px",fontFamily:"'Inter',sans-serif"},ai.missing[0]));
  }
  if(ai.filled.length>0){
    inner.appendChild(div({color:cl.green,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"✓ Auto-filled: "+ai.filled.join(", ")));
  }

  if(opts.examples&&opts.examples.length){
    var chipRow=div({display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"8px"});
    opts.examples.forEach(function(ex){
      var chip=el("button",{style:{background:hexAlpha(cl.gold,0.08),border:"1px solid "+hexAlpha(cl.gold,0.2),borderRadius:"20px",padding:"5px 12px",cursor:"pointer",color:cl.gold,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",fontWeight:"600"}});
      chip.textContent=ex;
      chip.addEventListener("click",function(){ai.text=ex;doAiParse();});
      chipRow.appendChild(chip);
    });
    inner.appendChild(chipRow);
  }

  try{
    var hist=JSON.parse(localStorage.getItem(histKey)||"[]");
    if(hist.length>0){
      inner.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em",marginBottom:"4px"},"RECENT"));
      var hRow=div({display:"flex",gap:"5px",flexWrap:"wrap"});
      hist.forEach(function(h){
        var hc=el("button",{style:{background:cl.raised,border:"1px solid "+cl.border,borderRadius:"16px",padding:"4px 10px",cursor:"pointer",color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif",maxWidth:"200px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}});
        hc.textContent=h;
        hc.addEventListener("click",function(){ai.text=h;doAiParse();});
        hRow.appendChild(hc);
      });
      inner.appendChild(hRow);
    }
  }catch(e){}

  box.appendChild(inner);
  return box;
}

