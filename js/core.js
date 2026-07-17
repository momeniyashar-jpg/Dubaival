// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- SECURITY HELPERS ---------------------------------------------------------
function escHtml(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
// --- THEME --------------------------------------------------------------------
function useThemeToggle(){return function(){darkMode=!darkMode;render();}}

// --- i18n --------------------------------------------------------------------
var dvLang="en";
try{dvLang=localStorage.getItem("dv_lang")||"en";}catch(e){}
var LANG={
en:{
  // Tabs
  tab_market:"Market",tab_index:"Index",tab_analyzer:"Analyzer",tab_map:"Map",tab_find:"Find",
  tab_deals:"Deals",tab_social:"Social",tab_compare:"Compare",tab_portfolio:"Portfolio",tab_alerts:"Alerts",
  tab_chat:"AI Agents",tab_workspace:"Workspace",tab_about:"About",
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
  footer_tag:"DubAIVal · DLD · Cascade AVM",
  // Auth
  auth_signin:"Sign In",auth_signup:"Sign Up",auth_signout:"Sign Out",
  auth_name:"Full Name",auth_email:"Email",auth_password:"Password",
  auth_create_account:"Create Account",auth_cloud_sync:"Cloud sync for your portfolio",
  auth_fill_fields:"Please fill in all fields",
  auth_disclaimer:"Your data is encrypted and stored securely via Supabase Auth."
},
ar:{
  tab_market:"السوق",tab_index:"المؤشر",tab_analyzer:"التقييم",tab_map:"الخريطة",tab_find:"البحث",
  tab_deals:"الصفقات",tab_social:"اجتماعی",tab_compare:"المقارنة",tab_portfolio:"المحفظة",tab_alerts:"التنبيهات",
  tab_chat:"الذكاء الاصطناعي",tab_workspace:"میز کار",tab_about:"حول",
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
  footer_tag:"DubAIVal · دائرة الأراضي · محرك Cascade",
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

var GREEN_AREAS={"Dubai Hills Estate":90,"Dubai Creek Harbour":88,"Expo City":92,"Sustainable City":95,"Town Square":80,"Tilal Al Ghaf":88,"The Valley":82,"Dubai South":78,"Emaar Beachfront":75,"Bluewaters Island":80,"MBR City":82,"DAMAC Hills":72,"Mudon":75,"Remraam":65};
function computeSustainabilityScore(building,area,bData,aData,manualSC){
  var grade=bData?bData.g:"B";
  var ageScore=grade==="Ultra"||grade==="A+"?92:grade==="A"?85:grade==="A-"?75:grade==="B+"?65:grade==="B"?55:grade==="C"?35:50;
  var scEff=70;
  // Service charge is fully manual (2026-07-17) — this component used to
  // score bData.sc (a per-building DB figure with confirmed errors) with no
  // connection to whatever the user actually entered on the Analyzer form.
  // Now only a real, user-provided service charge is scored; area-level
  // aData.sc is kept as the comparison BENCHMARK only (an aggregate across
  // many buildings, not one potentially-wrong entry), never as the reported
  // figure itself. With no manual input, this component stays neutral (70)
  // rather than silently scoring an unverified number.
  var manualSCNum=parseFloat(manualSC)||0;
  if(manualSCNum>0&&aData&&aData.sc&&aData.sc>0){
    // Branded residences (Ultra/A+) have higher SC for premium services (concierge, hotel amenities, spa)
    // Compare against grade-appropriate benchmark instead of raw area average
    var scBench=aData.sc;
    if(grade==="Ultra")scBench=aData.sc*1.25;
    else if(grade==="A+")scBench=aData.sc*1.15;
    else if(grade==="A")scBench=aData.sc*1.08;
    var ratio=manualSCNum/scBench;
    scEff=ratio<0.8?90:ratio<=1.0?78:ratio<=1.2?55:30;
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
    else if(typeof children==="string"||typeof children==="number")e.textContent=String(children);
    else if(children instanceof Node)e.appendChild(children);
    else if(children)console.warn("el(): invalid children type",typeof children,children);
  }
  return e;
}
function div(style,children){return el("div",{style:style},children)}
function span(style,text){const e=el("span",{style:style});if(text!=null)e.textContent=String(text);return e}
function numSpan(style,text){var s=Object.assign({fontFamily:"'JetBrains Mono',monospace",fontFeatureSettings:"'tnum'"},style);const e=el("span",{style:s});if(text!=null)e.textContent=String(text);return e}
function inp(style,placeholder,type,value,onChange){
  const e=el("input",{style:style,placeholder:placeholder||"",type:type||"text"});
  e.value=value||"";
  e.addEventListener("input",function(){onChange(e.value)});
  return e;
}
function mkSelect(style,options,value,onChange){
  // The closed <select> inherits the app's dark theme via `style`, but the
  // OPEN native dropdown popup is rendered by the OS/browser, not by CSS —
  // an <option> with no explicit background/color falls back to the
  // platform's light-mode default, producing illegible light-on-light (or
  // in dark mode, dark-on-dark) text. Setting both explicitly on every
  // option is the one part of a native select Chrome/Firefox/Edge do honor.
  var cl=C();
  const e=el("select",{style:style});
  options.forEach(function(o){
    const opt=el("option",{value:o},o);
    opt.style.background=cl.surfaceSolid||"#0D1220";
    opt.style.color=cl.white;
    if(o===value)opt.selected=true;
    e.appendChild(opt);
  });
  e.addEventListener("change",function(){onChange(e.value)});
  return e;
}
function mkAuto(style,items,value,onChange,placeholder){
  var cl=C();
  var wrap=el("div",{style:{position:"relative"}});
  var input=el("input",{type:"text",placeholder:placeholder||"Type to search...",style:Object.assign({},style,{width:"100%",boxSizing:"border-box"})});
  input.value=value||"";
  var dropdown=el("div",{style:{position:"absolute",top:"100%",left:"0",right:"0",maxHeight:"200px",overflowY:"auto",background:cl.surfaceSolid||cl.surface,border:"1px solid "+cl.border,borderRadius:"0 0 10px 10px",zIndex:"999",display:"none",boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}});
  function showSuggestions(q){
    dropdown.innerHTML="";
    var query=q.toLowerCase().trim();
    var matches=query?items.filter(function(it){return it.toLowerCase().indexOf(query)>=0;}).slice(0,15):items.slice(0,15);
    if(matches.length===0){dropdown.style.display="none";return;}
    matches.forEach(function(m){
      var opt=el("div",{style:{padding:"8px 12px",cursor:"pointer",fontSize:"12px",fontFamily:"'Inter',sans-serif",color:cl.subHi,borderBottom:"1px solid "+cl.border,transition:"background 0.1s"}});
      opt.textContent=m;
      opt.addEventListener("mouseenter",function(){this.style.background="rgba(201,168,76,0.1)";});
      opt.addEventListener("mouseleave",function(){this.style.background="transparent";});
      opt.addEventListener("mousedown",function(e){
        e.preventDefault();
        input.value=m;
        onChange(m);
        dropdown.style.display="none";
      });
      dropdown.appendChild(opt);
    });
    dropdown.style.display="block";
  }
  input.addEventListener("input",function(){
    onChange(this.value);
    showSuggestions(this.value);
  });
  input.addEventListener("focus",function(){showSuggestions(this.value);});
  input.addEventListener("blur",function(){setTimeout(function(){dropdown.style.display="none";},150);});
  wrap.appendChild(input);
  wrap.appendChild(dropdown);
  return wrap;
}
function btn(style,text,onClick){
  const e=el("button",{style:{...style,cursor:"pointer"},onclick:onClick});
  e.textContent=text;
  return e;
}
function lbl(text){return span({color:C().sub,fontSize:"9.5px",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"5px",fontFamily:"'Space Grotesk',monospace",display:"block"},text)}
function S(){var cl=C();return{width:"100%",background:cl.raised,backdropFilter:cl.blur,WebkitBackdropFilter:cl.blur,border:"1px solid "+cl.border,color:cl.white,padding:"11px 14px",borderRadius:"10px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxShadow:"inset 0 1px 2px rgba(0,0,0,0.1)"}}
function I(){return{...S(),caretColor:C().gold,boxSizing:"border-box"}}
function fld(labelText,input){const w=div({marginBottom:"12px"});w.appendChild(lbl(labelText));w.appendChild(input);return w;}
function pill(text,color){
  const cl=C();
  const map={green:{bg:cl.greenBg,bo:cl.greenBo,tx:cl.green},gold:{bg:cl.goldFaint,bo:cl.goldDim,tx:cl.gold},gray:{bg:"transparent",bo:cl.border,tx:cl.sub},red:{bg:cl.redBg,bo:cl.redBo,tx:cl.red},yellow:{bg:cl.yellowBg,bo:cl.yellowBo,tx:cl.yellow}};
  const p=map[color]||map.gray;
  return span({background:p.bg,border:"1px solid "+p.bo,color:p.tx,padding:"3px 10px",borderRadius:"20px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",fontWeight:"600"},text);
}

// --- SHARE MODAL --------------------------------------------------------------
function showShareModal(opts){
  // opts: { text, file, fileName, fileType, url, title }
  var cl=C();
  var overlay=el("div",{style:{position:"fixed",inset:"0",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",zIndex:"99999",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}});
  overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  var modal=el("div",{style:{background:cl.bg||"#070B14",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"16px",padding:"24px",maxWidth:"400px",width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}});
  modal.appendChild(div({fontSize:"16px",fontWeight:"700",color:cl.white||"#fff",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"Share Content"));
  modal.appendChild(div({fontSize:"11px",color:cl.sub||"#6B7A9E",marginBottom:"20px",fontFamily:"'Inter',sans-serif"},"Send directly to your favorite app"));

  var grid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"16px"}});

  function shareBtn(name,color,icon,fn){
    var b=el("button",{style:{background:hexAlpha(color,0.1),border:"1px solid "+hexAlpha(color,0.25),color:color,borderRadius:"12px",padding:"14px 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",fontSize:"10px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",transition:"all 0.2s"},onclick:fn});
    b.addEventListener("mouseenter",function(){b.style.background=hexAlpha(color,0.2);b.style.transform="translateY(-2px)";});
    b.addEventListener("mouseleave",function(){b.style.background=hexAlpha(color,0.1);b.style.transform="";});
    var ic=el("span",{style:{fontSize:"20px"}});ic.textContent=icon;
    b.appendChild(ic);
    b.appendChild(document.createTextNode(name));
    return b;
  }

  var txt=opts.text||"";
  var encodedText=encodeURIComponent(txt);
  var encodedUrl=encodeURIComponent(opts.url||"https://www.dubaival.com");

  // Quick Share (Web Share API)
  if(navigator.share){
    grid.appendChild(shareBtn("Quick Share","#10B981","\u{1F4E4}",async function(){
      try{
        var shareData={title:opts.title||"DubAIVal",text:txt};
        if(opts.file){
          var f=opts.file instanceof File?opts.file:new File([opts.file],opts.fileName||"dubaival-content",{type:opts.fileType||"image/png"});
          if(navigator.canShare&&navigator.canShare({files:[f]}))shareData.files=[f];
        }
        await navigator.share(shareData);
      }catch(e){}
    }));
  }

  // WhatsApp
  grid.appendChild(shareBtn("WhatsApp","#25D366","\u{1F4AC}",function(){
    window.open("https://api.whatsapp.com/send?text="+encodedText,"_blank","noopener,noreferrer");
  }));

  // Telegram
  grid.appendChild(shareBtn("Telegram","#0088CC","\u{2708}",function(){
    window.open("https://t.me/share/url?url="+encodedUrl+"&text="+encodedText,"_blank","noopener,noreferrer");
  }));

  // Twitter/X
  grid.appendChild(shareBtn("X / Twitter","#1DA1F2","\u{1D54F}",function(){
    window.open("https://twitter.com/intent/tweet?text="+encodedText,"_blank","noopener,noreferrer");
  }));

  // LinkedIn
  grid.appendChild(shareBtn("LinkedIn","#0A66C2","\u{1F4BC}",function(){
    window.open("https://www.linkedin.com/sharing/share-offsite/?url="+encodedUrl,"_blank","noopener,noreferrer");
  }));

  // Copy Text
  grid.appendChild(shareBtn("Copy Text","#8B5CF6","\u{1F4CB}",function(){
    navigator.clipboard.writeText(txt).then(function(){
      var btns=grid.querySelectorAll("button");
      var last=btns[btns.length-1];if(last)last.style.borderColor="#10B981";
      setTimeout(function(){if(last)last.style.borderColor="";},1500);
    });
  }));

  modal.appendChild(grid);

  // Download button (if file exists)
  if(opts.file||opts.url){
    var dlBtn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.05))",border:"1px solid rgba(212,175,55,0.3)",color:"#D4AF37",borderRadius:"10px",padding:"12px",cursor:"pointer",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px",transition:"all 0.2s"},onclick:function(){
      if(opts.url){var a=document.createElement("a");a.href=opts.url;a.download=opts.fileName||"dubaival-content";a.click();}
      else if(opts.file){var blob=opts.file instanceof Blob?opts.file:new Blob([opts.file]);var u=URL.createObjectURL(blob);var a=document.createElement("a");a.href=u;a.download=opts.fileName||"dubaival-content";a.click();URL.revokeObjectURL(u);}
      dlBtn.textContent="Downloaded!";setTimeout(function(){dlBtn.textContent="Download File";},2000);
    }});
    dlBtn.textContent="Download File";
    modal.appendChild(dlBtn);
  }

  // Close
  var closeBtn=el("button",{style:{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:cl.sub||"#6B7A9E",borderRadius:"10px",padding:"10px",cursor:"pointer",fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},onclick:function(){overlay.remove();}});
  closeBtn.textContent="Close";
  modal.appendChild(closeBtn);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function makeShareButton(opts,style){
  var cl=C();
  var b=el("button",{style:Object.assign({background:"linear-gradient(135deg,rgba(16,185,129,0.15),rgba(6,182,212,0.1))",border:"1px solid rgba(16,185,129,0.3)",color:"#10B981",borderRadius:"8px",padding:"8px 16px",cursor:"pointer",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"flex",alignItems:"center",gap:"5px",transition:"all 0.2s"},style||{}),onclick:function(){showShareModal(opts);}});
  b.textContent="Share";
  return b;
}

// --- STATE --------------------------------------------------------------------
var currentTab="";
var currentSection="Home";
var currentSubTab="";
var sidebarCollapsed=false;
try{sidebarCollapsed=localStorage.getItem("dv_sidebar_collapsed")==="1";}catch(e){}

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  FROZEN NAVIGATION — DO NOT MODIFY WITHOUT EXPLICIT USER APPROVAL       ║
// ║  This is the canonical tab structure for DubAIVal.                      ║
// ║  Any session that changes this array MUST also update CLAUDE.md and     ║
// ║  the routing block in js/app.js. See CLAUDE.md § "Frozen Navigation".  ║
// ║  Last locked: 2026-07-04                                                ║
// ╚══════════════════════════════════════════════════════════════════════════╝
var NAV_SECTIONS=[
  {id:"Home",icon:"home",label:"Home",subs:[]},
  {id:"Market",icon:"bar-chart-3",label:"Market",subtitle:"AI Valuation",accentColor:"#D4AF37",subs:[
    {id:"Dashboard",label:"Dashboard"},
    {id:"Analyzer",label:"Analyzer"},
    {id:"QuickCheck",label:"Quick Check"},
    {id:"TrackRecord",label:"Track Record"},
    {id:"Index",label:"Market Index"},
    {id:"Compare",label:"Compare"},
    {id:"Find",label:"Find"},
    {id:"OffPlan",label:"Off-Plan"},
    {id:"Map",label:"Map"},
    {id:"Advisor",label:"Advisor"},
    {id:"News",label:"News"}
  ]},
  {id:"Portfolio",icon:"briefcase",label:"Portfolio",accentColor:"#3B82F6",subs:[
    {id:"Assets",label:"My Assets"},
    {id:"Health",label:"Health"},
    {id:"Projections",label:"Projections"},
    {id:"Alerts",label:"Alerts"}
  ]},
  {id:"Network",icon:"users",label:"Network",accentColor:"#10B981",badgeKey:"deals",subs:[
    {id:"Deals",label:"Deal Board"},
    {id:"Chat",label:"AI Agents"},
    {id:"Chiefs",label:"AI Chief of Staff"}
  ]},
  {id:"SocialMedia",icon:"share-2",label:"Social",accentColor:"#EC4899",badgeKey:"autopost",subs:[
    {id:"Studio",label:"Media Studio"},
    {id:"Avatar",label:"Avatar Studio"},
    {id:"VideoPlatform",label:"Video Platform"},
    {id:"SocialChat",label:"AI Assistant"}
  ]},
  {id:"More",icon:"settings",label:"More",subs:[
    {id:"Workspace",label:"Workspace"},
    {id:"Reports",label:"Reports"},
    {id:"About",label:"About"}
  ]}
];

var _skipPush=false;
function setSection(sec,sub){
  currentSection=sec;
  currentSubTab=sub||"";
  var s=NAV_SECTIONS.find(function(n){return n.id===sec;});
  if(s&&s.subs.length>0&&!sub)currentSubTab=s.subs[0].id;
  if(!_skipPush){
    var stateObj={section:currentSection,sub:currentSubTab};
    var hash="#"+currentSection+(currentSubTab?"/"+currentSubTab:"");
    history.pushState(stateObj,"",hash);
  }
  if(typeof dvTrack==="function")dvTrack("tab_view",{section:currentSection,sub:currentSubTab});
  render();
}
window.addEventListener("popstate",function(e){
  // If the auth modal is open, a real back-button press should close it instead
  // of silently changing the section behind it (see renderAuthModal in auth.js —
  // that's what pushed this history entry in the first place). Reset the push
  // flag without calling history.back() again — the browser already moved once.
  if(typeof DV_AUTH!=="undefined"&&DV_AUTH.showModal){
    DV_AUTH.showModal=false;
    DV_AUTH.error="";
    if(typeof _dvModalHistoryPushed!=="undefined")_dvModalHistoryPushed=false;
    render();
    return;
  }
  if(!e.state||!e.state.section){
    // Backed past the app's own root entry (e.g. no earlier in-app state left,
    // or a native WebView lost its state after being backgrounded). history.go(1)
    // is not reliable here — if there is nothing further forward, it navigates
    // the document away entirely instead of recovering. Push a fresh, known-good
    // Home state instead: pushState never navigates away, so this always keeps
    // the user inside the app rather than crashing into a blank/foreign page.
    currentSection="Home";
    currentSubTab="";
    history.pushState({section:"Home",sub:""},"","#Home");
    render();
    return;
  }
  _skipPush=true;
  currentSection=e.state.section;
  currentSubTab=e.state.sub||"";
  render();
  _skipPush=false;
});
(function(){
  var stateObj={section:currentSection,sub:currentSubTab};
  // Only default the hash to Home when the page loaded with none at all —
  // unconditionally rewriting it here (as this used to do) silently clobbered
  // any real deep link already in the URL, e.g. "#admin", before app.js's own
  // hash check (window.location.hash==="#admin", in its render() function)
  // ever got a chance to see the original value. Found 2026-07-17: this is
  // why the hidden Admin route has been unreachable by direct URL navigation
  // since this replaceState call was added (2026-07-07) — every fresh visit
  // to /#admin was silently rewritten to /#Home before the admin check ran.
  var hash=window.location.hash||("#"+currentSection+(currentSubTab?"/"+currentSubTab:""));
  history.replaceState(stateObj,"",hash);
})();

// -- MARKET CYCLE INDEX (Market Dashboard's "All" view + Home's Market
// Cycle widget) --
// Moved here from js/market.js 2026-07-17 so the Home page can reuse the
// exact same series instead of duplicating it.
// Real DLD monthly PSF data (js/market.js's PSF_CHART_DATA) only covers
// 2023-06 onward — there is no granular month-by-month transaction data
// loaded for 2002-2023 to plot an exact "All-time" PSF chart the way a
// crypto exchange plots exact daily prices. Per user request (2026-07-15,
// "خودت با توجه به داده هایی که داریم و با توجه به داده هایی که در فضای
// آنلاین وجود دارد بهترین راه حل رو فیکس کن" — combine what we have with
// publicly documented market data), this is a real INDEX (base 100 =
// 2002) reconstructed from Dubai's widely-documented residential price
// cycle — the same 7-era narrative already relied on elsewhere in the app
// (freehold-law-era boom, 2008 GFC crash, recovery, 2014-19 correction,
// COVID dip, 2021-25 post-pandemic super-cycle, 2026 moderation) —
// smoothly distributed year-by-year via compound growth within each era
// so it renders as a real trend line, not a stepped approximation. This is
// the same convention real long-run property indices use (Case-Shiller in
// the US, Halifax in the UK, REIDIN/Phidar for Dubai) — a relative index,
// not one absolute AED/sqft figure meant to span decades of changing
// building/area mix.
// Exact figures: run tools/build-market-cycle-index.js against the full,
// unfiltered DLD transactions CSV (same source used for calibration — see
// tools/calibrate-db.js) to replace this illustrative series with a real
// year-by-year DLD-derived index once that CSV is available in a session
// that can read it.
var MARKET_CYCLE_INDEX={
  baseYear:2002,
  years:[2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026],
  index:[100,131,171,224,292,382,500,397,315,250,292,342,400,372,347,323,301,280,245,274,306,343,383,429,429],
  eras:[
    {from:2002,to:2008,label:"Freehold Boom",pct:"+400%"},
    {from:2008,to:2011,label:"Global Financial Crisis",pct:"-50%"},
    {from:2011,to:2014,label:"Recovery",pct:"+60%"},
    {from:2014,to:2019,label:"Correction",pct:"-25 to -35%"},
    {from:2019,to:2020,label:"COVID Dip",pct:"-10 to -15%"},
    {from:2020,to:2025,label:"Post-Pandemic Super-Cycle",pct:"+75%"},
    {from:2025,to:2026,label:"Moderation · Buyer Window",pct:"±3 to 8%"}
  ]
};

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
  // Cap: max -8% to +3% — allow meaningful correction during market downturns
  return Math.max(-0.08,Math.min(0.03,risk+social+econ));
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
    var prompt='Dubai real estate macro risk analysis for '+dateStr+'.\n\nOFFICIAL DLD CONTEXT:\n- Q1 2026: AED 252B transactions (+31% YoY)\n- Jan 2026: 16,919 sales, avg PSF AED 1,976 (+18% YoY)\n- Feb-Mar 2026: Geo shock from US-Israel-Iran strikes, -20% DFM index\n- Apr-May 2026: Partial recovery, volumes up but prices 5-10% below Jan peak\n- June 2026: Cautious stabilization, premium segment (Downtown, Palm) still 8-12% below peak\n- Secondary market correction: resale prices under pressure, new off-plan absorbing demand\n- Buyer sentiment: wait-and-see in premium; active in mid-market/affordable\n\nBased on latest available data, return ONLY this JSON (no other text):\n{"riskFactor":<0.85-1.05>,"socialIndex":<0.92-1.05>,"economicOutlook":<0.92-1.05>,"label":"<brief status in English>","reason":"<one sentence why>"}\n\nGuidelines:\n- riskFactor<1 = geopolitical tension + market correction reducing demand\n- socialIndex reflects DLD weekly volume trend vs 6-month average\n- economicOutlook reflects resale price trend and fundamentals\n- Be data-driven and conservative, not optimistic';

    var resp=await callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:prompt}],max_tokens:200,temperature:0.1});
    
    var data=await resp.json();
    var text=data.choices&&data.choices[0]?data.choices[0].message.content:"";
    var clean=text.replace(/```json|```/g,"").trim();
    var parsed=JSON.parse(clean);
    
    if(typeof parsed.riskFactor==="number"){
      MACRO_VARS.riskFactor=Math.max(0.90,Math.min(1.05,parsed.riskFactor));
      MACRO_VARS.socialIndex=Math.max(0.93,Math.min(1.05,parsed.socialIndex||1.0));
      MACRO_VARS.economicOutlook=Math.max(0.93,Math.min(1.05,parsed.economicOutlook||1.0));
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

// ── FIRST-PARTY EVENT TRACKING (launch-readiness item 3) ─────────────────────
// dvTrack() was already being called at 6 real funnel points (Analyzer
// submit x4, PDF export x2 — see js/market.js/js/app.js) but was never
// actually defined anywhere, so every one of those calls silently threw
// and was swallowed by its own try/catch — meaning none of them ever
// tracked anything. Implemented for real now: writes to analytics_events
// (see supabase-analytics-events-schema.sql, requires manual execution),
// grouped by a per-browser-tab session id so a funnel (view -> analyze ->
// signup -> subscribe) can be reconstructed later without requiring login.
// Fire-and-forget — never blocks or throws into the caller.
var _dvSessionId=(function(){
  try{
    var k="dv_session_id";
    var v=sessionStorage.getItem(k);
    if(!v){v=Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,10);sessionStorage.setItem(k,v);}
    return v;
  }catch(e){return "nosession_"+Math.random().toString(36).slice(2,10);}
})();
function dvTrack(eventName,meta){
  try{if(typeof gtag==="function")gtag("event",eventName,meta||{});}catch(e){}
  try{
    fetch(SUPABASE_URL+"/rest/v1/analytics_events",{
      method:"POST",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify({session_id:_dvSessionId,event_name:eventName,area:(meta&&meta.area)||null,meta:meta||{}})
    }).catch(function(){});
  }catch(e){}
}

// ── AUTOMATIC + MANUAL ERROR REPORTING (beta-launch readiness) ───────────────
// Two halves of one system: (1) uncaught JS errors/promise rejections are
// captured automatically and sent through the same analytics_events pipeline
// as dvTrack() above, tagged event_name='js_error' — no separate table, no
// separate infra. (2) a small rolling in-memory buffer of the last few
// errors/reports is kept so the manual "Report an Issue" widget below can
// attach real technical context automatically instead of asking the user to
// describe a stack trace themselves. index.html's window.onerror/
// unhandledrejection handlers call _dvCaptureError(); this file is loaded
// deferred, so those handlers guard with typeof checks in case an error fires
// before this script has executed.
var _dvRecentIssues=[];
function _dvCaptureError(kind,detail){
  try{
    _dvRecentIssues.unshift({kind:kind,detail:String(detail||"").slice(0,500),ts:Date.now()});
    if(_dvRecentIssues.length>5)_dvRecentIssues.length=5;
  }catch(e){}
}
function dvTrackError(payload){
  _dvCaptureError(payload.kind||"error",payload.message||"");
  dvTrack("js_error",payload);
}

var REPORT_ISSUE_STATE={open:false,submitting:false,submitted:false,message:"",error:null};
function _reportIssueSection(){
  try{return (typeof currentSection!=="undefined"?currentSection:"")+(typeof currentSubTab!=="undefined"&&currentSubTab?"/"+currentSubTab:"");}catch(e){return "";}
}
async function _submitIssueReport(){
  var msg=(REPORT_ISSUE_STATE.message||"").trim();
  if(!msg){REPORT_ISSUE_STATE.error="Please describe what happened.";render();return;}
  REPORT_ISSUE_STATE.submitting=true;REPORT_ISSUE_STATE.error=null;render();
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/analytics_events",{
      method:"POST",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify({session_id:_dvSessionId,event_name:"user_report",area:null,meta:{
        message:msg,url:location.href,section:_reportIssueSection(),
        ua:navigator.userAgent,recentIssues:_dvRecentIssues
      }})
    });
    if(resp.ok){REPORT_ISSUE_STATE.submitted=true;REPORT_ISSUE_STATE.message="";}
    else REPORT_ISSUE_STATE.error="Could not send report ("+resp.status+"). Please try again.";
  }catch(e){REPORT_ISSUE_STATE.error="Network error — please try again.";}
  REPORT_ISSUE_STATE.submitting=false;render();
}

function renderReportIssueWidget(){
  var cl=C();
  var wrap=div({});

  var fab=el("button",{style:{position:"fixed",right:"18px",bottom:"20px",zIndex:"9500",
    background:cl.surfaceSolid||cl.surface,color:cl.sub,border:"1px solid "+cl.border,
    borderRadius:"22px",padding:"9px 14px",fontSize:"11px",fontWeight:"700",cursor:"pointer",
    fontFamily:"'Space Grotesk',monospace",boxShadow:"0 4px 20px rgba(0,0,0,0.35)",
    display:"flex",alignItems:"center",gap:"6px"}});
  fab.id="dv-report-issue-fab";
  fab.className="dv-report-fab";
  fab.innerHTML="🐞";
  var fabLabel=span({fontSize:"11px"},"Report Issue");
  fab.appendChild(fabLabel);
  fab.addEventListener("click",function(){REPORT_ISSUE_STATE.open=true;REPORT_ISSUE_STATE.submitted=false;REPORT_ISSUE_STATE.error=null;render();});
  wrap.appendChild(fab);

  if(!REPORT_ISSUE_STATE.open)return wrap;

  var overlay=div({position:"fixed",top:"0",left:"0",right:"0",bottom:"0",zIndex:"9999",
    background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"});
  overlay.addEventListener("click",function(e){if(e.target===overlay){REPORT_ISSUE_STATE.open=false;render();}});

  var modal=div({background:cl.surfaceSolid||cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",
    padding:"20px",maxWidth:"420px",width:"100%"});
  modal.addEventListener("click",function(e){e.stopPropagation();});

  modal.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",
    fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"Report an Issue"));

  if(REPORT_ISSUE_STATE.submitted){
    modal.appendChild(div({color:cl.white,fontSize:"13px",fontFamily:"'Inter',sans-serif",marginTop:"10px",marginBottom:"16px"},
      "✓ Thanks — we've received your report and will look into it."));
    var closeBtn=el("button",{style:{width:"100%",padding:"10px",background:cl.raised,border:"1px solid "+cl.border,
      color:cl.sub,borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    closeBtn.textContent="Close";
    closeBtn.addEventListener("click",function(){REPORT_ISSUE_STATE.open=false;render();});
    modal.appendChild(closeBtn);
  }else{
    modal.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif",marginBottom:"12px",lineHeight:"1.6"},
      "Something not working, or not what you expected? Tell us what happened — we'll see it immediately."));
    var textarea=el("textarea",{style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,
      color:cl.white,padding:"10px",borderRadius:"8px",fontSize:"13px",fontFamily:"'Inter',sans-serif",
      outline:"none",resize:"vertical",minHeight:"80px",boxSizing:"border-box"},
      placeholder:"e.g. \"The Analyzer showed AED 0 for my building\" or \"Nothing happened when I clicked Submit\""});
    textarea.value=REPORT_ISSUE_STATE.message;
    textarea.addEventListener("input",function(){REPORT_ISSUE_STATE.message=textarea.value;});
    modal.appendChild(textarea);
    if(REPORT_ISSUE_STATE.error){
      modal.appendChild(div({color:cl.red,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginTop:"6px"},REPORT_ISSUE_STATE.error));
    }
    var btnRow=div({display:"flex",gap:"8px",marginTop:"14px"});
    var cancelBtn=el("button",{style:{flex:"1",padding:"10px",background:"transparent",border:"1px solid "+cl.border,
      color:cl.sub,borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    cancelBtn.textContent="Cancel";
    cancelBtn.addEventListener("click",function(){REPORT_ISSUE_STATE.open=false;render();});
    btnRow.appendChild(cancelBtn);
    var submitBtn=el("button",{style:{flex:"1",padding:"10px",background:cl.gold,color:"#070B14",border:"none",
      borderRadius:"8px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
      cursor:REPORT_ISSUE_STATE.submitting?"default":"pointer",opacity:REPORT_ISSUE_STATE.submitting?"0.6":"1"}});
    submitBtn.textContent=REPORT_ISSUE_STATE.submitting?"Sending...":"Send Report";
    submitBtn.disabled=REPORT_ISSUE_STATE.submitting;
    submitBtn.addEventListener("click",function(){_submitIssueReport();});
    btnRow.appendChild(submitBtn);
    modal.appendChild(btnRow);
  }

  overlay.appendChild(modal);
  wrap.appendChild(overlay);
  return wrap;
}

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
    var today=new Date();
    var dateStr=today.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
    // Deliberately does not assert specific hardcoded "verified" data points —
    // those go stale the moment they're written and would keep being fed to
    // the model as current fact indefinitely. Ask it to reason from its own
    // most recent knowledge relative to the (correctly dynamic) date instead.
    var prompt='Dubai real estate market intelligence for '+dateStr+'.\n\nUsing the most recent Dubai Land Department (DLD) transaction data, price trends, and market sentiment you are aware of as of this date, provide a brief, conservative macro adjustment for apartment and villa valuations. Do not invent or assume specific events/figures you are not confident about.\n\nReturn JSON only:\n{"apt_adj":<-0.05 to 0.05>,"villa_adj":<-0.03 to 0.05>,"label":"<10 words>","reason":"<one sentence, cite a specific data point only if you are confident in it>","market_psf":<your best current estimate of average AED/sqft>,"trend":"stable|up|down"}\n\nNote: adj=0 means no change to DB PSF values. Negative=buyers have leverage.';
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
    MACRO_VARS.source="Groq AI · DLD Data · "+dateStr;
    render();
  }catch(e){
    console.warn("Market intel fetch failed:",e.message);
  }
}

async function saveSupabaseConfig(aptAdj, villaAdj, label, adminPw){
  // Writes go through a password-gated RPC (admin_update_market_config) —
  // direct anon PATCH to market_config is no longer permitted server-side,
  // see supabase-admin-security-fix.sql.
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/rpc/admin_update_market_config",{
      method:"POST",
      headers:{
        "apikey":SUPABASE_KEY,
        "Authorization":"Bearer "+SUPABASE_KEY,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({p_admin_password:adminPw,p_apt_adj:aptAdj,p_villa_adj:villaAdj,p_label:label})
    });
    return resp.ok;
  }catch(e){
    console.warn("Supabase save failed:",e.message);
    return false;
  }
}

// --- MARKET MOMENTUM (AI-powered trend intelligence) --------------------------
var MARKET_MOMENTUM={};
var MOMENTUM_LOADED=false;

async function fetchMarketMomentum(){
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/market_momentum?select=area_key,trend,pct_change,confidence,updated_at",{
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}
    });
    if(!resp.ok)return;
    var rows=await resp.json();
    if(!rows||!rows.length)return;
    rows.forEach(function(r){
      MARKET_MOMENTUM[r.area_key]={
        trend:r.trend,pct:r.pct_change,conf:r.confidence,
        updated:r.updated_at
      };
    });
    MOMENTUM_LOADED=true;
    console.log("[DubaiVal] Market momentum loaded:",rows.length,"areas");
  }catch(e){console.warn("Market momentum fetch failed:",e.message);}
}

function getMomentumFactor(area){
  var m=MARKET_MOMENTUM[area];
  if(!m)m=MARKET_MOMENTUM["_overall"];
  if(!m||m.pct==null)return 1.0;
  var age=m.updated?(Date.now()-new Date(m.updated).getTime())/(1000*60*60*24):999;
  if(age>30)return 1.0;
  if(m.pct===0)return 1.0;
  var confWeight=m.conf==="high"?1.0:m.conf==="medium"?0.7:0.4;
  var rawAdj=m.pct/100*confWeight;
  var capped=Math.max(-0.15,Math.min(0.15,rawAdj));
  return 1.0+capped;
}

var MI_TOP_AREAS=["Downtown Dubai","Dubai Marina","Palm Jumeirah","Business Bay",
  "Jumeirah Village Circle","Dubai Hills Estate","Dubai Creek Harbour",
  "MBR City","Emaar Beachfront","DIFC","Sobha Hartland","Jumeirah Lake Towers",
  "Arabian Ranches","Damac Hills","Tilal Al Ghaf","Bluewaters Island",
  "Palm Jebel Ali","Dubai Islands","Emirates Hills","District One"];

async function runMarketIntelligence(){
  var areaList=MI_TOP_AREAS.join(", ");
  var prompt="You are a Dubai real estate market analyst with deep knowledge of the UAE property market.\n\n"+
    "Based on your knowledge of Dubai real estate market dynamics, macroeconomic factors, "+
    "interest rates, supply pipeline, seasonal patterns, and global investment flows, "+
    "estimate the current price trend for each area listed below.\n\n"+
    "Consider: UAE Central Bank rates, new supply delivery, off-plan vs ready ratio, "+
    "golden visa demand, expo legacy, tourism numbers, rental yield compression.\n\n"+
    "For each area, provide:\n"+
    "- trend: 'up', 'down', or 'stable'\n"+
    "- pct: estimated % price change over last 6 months (e.g., -5 means 5% decline)\n"+
    "- conf: 'high', 'medium', or 'low'\n"+
    "- sector: 'luxury', 'mid', or 'affordable'\n\n"+
    "Areas: "+areaList+"\n\n"+
    "IMPORTANT: Respond ONLY with valid JSON, no markdown, no explanation:\n"+
    '{"overall":{"trend":"...","pct":0,"note":"..."},"areas":{"Area Name":{"trend":"...","pct":0,"conf":"...","sector":"..."}}}';

  try{
    var sys="You are a structured data API. Output ONLY valid JSON. No markdown code fences. No explanatory text.";
    var resp=await askAI([{role:"user",content:prompt}],sys,"Dubai real estate market trend price change forecast",MI_TOP_AREAS);
    resp=resp.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();
    var data=JSON.parse(resp);
    if(!data||!data.areas)throw new Error("Invalid AI response structure");

    var rows=[];
    if(data.overall){
      rows.push({area_key:"_overall",trend:data.overall.trend||"stable",
        pct_change:data.overall.pct||0,confidence:"medium",
        sector:"mid",note:data.overall.note||"",source:"groq_ai",
        updated_at:new Date().toISOString()});
    }
    Object.entries(data.areas).forEach(function(e){
      var area=e[0],d=e[1];
      if(!AREAS[area])return;
      rows.push({area_key:area,trend:d.trend||"stable",
        pct_change:typeof d.pct==="number"?d.pct:0,
        confidence:d.conf||"medium",sector:d.sector||"mid",
        note:"",source:"groq_ai",
        updated_at:new Date().toISOString()});
    });

    if(rows.length===0)throw new Error("No valid areas in AI response");

    var upsertResp=await fetch(SUPABASE_URL+"/rest/v1/market_momentum",{
      method:"POST",
      headers:{
        "apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,
        "Content-Type":"application/json","Prefer":"resolution=merge-duplicates"
      },
      body:JSON.stringify(rows)
    });

    if(!upsertResp.ok)throw new Error("Supabase upsert failed: "+upsertResp.status);

    rows.forEach(function(r){
      MARKET_MOMENTUM[r.area_key]={trend:r.trend,pct:r.pct_change,conf:r.confidence,updated:r.updated_at};
    });
    MOMENTUM_LOADED=true;

    console.log("[DubaiVal] Market intelligence updated:",rows.length,"areas");
    return{success:true,count:rows.length,overall:data.overall};
  }catch(e){
    console.error("[DubaiVal] Market intelligence failed:",e.message);
    return{success:false,error:e.message};
  }
}

function generateFallbackMomentum(){
  if(typeof AREAS==="undefined")return;
  var totalG=0,cnt=0;
  MI_TOP_AREAS.forEach(function(name){
    var a=AREAS[name];if(!a||!a.g)return;
    var g1yr=a.g[0]||0;
    var trend=g1yr>=5?"up":g1yr>=2?"stable":"down";
    var halfYearPct=Math.round(g1yr/2*10)/10;
    MARKET_MOMENTUM[name]={trend:trend,pct:halfYearPct,conf:"medium",updated:new Date().toISOString()};
    totalG+=g1yr;cnt++;
  });
  var avgG=cnt>0?totalG/cnt:3;
  MARKET_MOMENTUM["_overall"]={trend:avgG>=4?"up":avgG>=2?"stable":"down",pct:Math.round(avgG/2*10)/10,conf:"medium",updated:new Date().toISOString()};
  MOMENTUM_LOADED=true;
  console.log("[DubaiVal] Fallback momentum generated for",cnt,"areas (from AREAS growth data)");
}

function shouldRunIntelligence(){
  var overall=MARKET_MOMENTUM["_overall"];
  if(!overall||!overall.updated)return true;
  var age=(Date.now()-new Date(overall.updated).getTime())/(1000*60*60*24);
  return age>7;
}

if(typeof window!=="undefined"){
  setTimeout(fetchLiveMarket,1500);
  setTimeout(fetchSupabaseConfig,500);
  setTimeout(fetchDynamicBenchmarks,600);
  setTimeout(fetchCalibrationData,700);
  setTimeout(async function(){
    await fetchMarketMomentum();
    if(shouldRunIntelligence()){
      console.log("[DubaiVal] Market intelligence stale/missing — running AI update...");
      var timeout=new Promise(function(res){setTimeout(function(){res({success:false,error:"timeout"});},12000);});
      var result=await Promise.race([runMarketIntelligence(),timeout]);
      if(!result||!result.success){
        console.log("[DubaiVal] AI intelligence failed/timed out, generating fallback from AREAS growth data...");
        generateFallbackMomentum();
      }
    }
    render();
  },800);
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

// Shared across every file that builds an AI prompt referencing "the current
// month" — several call sites used to hardcode a literal "June 2026"/"July
// 2026", accurate only in the month they were written and wrong every month
// after (first found in fetchMarketIntelligence() on 2026-07-11, then in 3
// more js/portfolio.js prompts on 2026-07-12; this pass fixed the remaining
// instances across the app — see the 2026-07-12 work log for the full list).
function _currentMonthYear(){return new Date().toLocaleDateString("en-US",{month:"long",year:"numeric"});}

function getDubaiRealEstateBrain(){
  var areaSummary="";
  try{
    var areaStats={};
    Object.entries(DB).forEach(function(e){
      var a=e[1].a;
      if(!areaStats[a])areaStats[a]={psfs:[],count:0,grades:{}};
      areaStats[a].psfs.push(e[1].p);
      areaStats[a].count++;
      var g=e[1].g||"B";if(!areaStats[a].grades[g])areaStats[a].grades[g]=0;areaStats[a].grades[g]++;
    });
    var lines=[];
    Object.entries(areaStats).sort(function(a,b){return b[1].count-a[1].count;}).slice(0,40).forEach(function(e){
      var psfs=e[1].psfs.sort(function(a,b){return a-b;});
      var med=psfs[Math.floor(psfs.length/2)];
      var lo=psfs[Math.floor(psfs.length*0.1)];
      var hi=psfs[Math.floor(psfs.length*0.9)];
      var ad=AREAS[e[0]];
      var yld=ad&&ad.y?(ad.y[0]+"-"+ad.y[1]+"%"):"—";
      var gr=ad&&ad.g?ad.g[0]+"%":"—";
      var dom=ad&&ad.dom?ad.dom+"d":"—";
      lines.push(e[0]+":"+lo+"-"+hi+"PSF(med"+med+"),"+e[1].count+"bldgs,Y"+yld+",G"+gr+",DOM"+dom);
    });
    areaSummary=lines.join(" | ");
  }catch(x){}
  var profile="";
  try{
    profile="Investor:"+(USER_PROFILE.investorType||"general")+"|Risk:"+(USER_PROFILE.risk||"moderate");
    if(USER_PROFILE.budgetMax)profile+="|Budget:AED"+(USER_PROFILE.budgetMax/1e6).toFixed(1)+"M";
    if(USER_PROFILE.budgetMin)profile+="|MinBudget:AED"+(USER_PROFILE.budgetMin/1e6).toFixed(1)+"M";
    if(USER_PROFILE.preferredAreas)profile+="|Areas:"+USER_PROFILE.preferredAreas;
  }catch(x){}
  return "YOU ARE DUBAIVAL AI — THE MOST EXPERT DUBAI REAL ESTATE SPECIALIST IN THE WORLD.\n"+
    "You have 15+ years of Dubai property market experience. You know every building, every area, every developer, every regulation.\n"+
    "Date: "+_currentMonthYear()+". Platform: DubAIVal.com — AI-powered Dubai real estate intelligence.\n\n"+
    "═══ YOUR DATABASE (LIVE) ═══\n"+
    "9,227 residential buildings | 1,914 commercial | 428 land plots | 347 areas | All DLD-verified\n"+
    areaSummary+"\n\n"+
    "═══ DUBAI MARKET KNOWLEDGE (baseline reference, "+_currentMonthYear()+") ═══\n"+
    "MARKET CONDITIONS:\n"+
    "- Post-geopolitical correction phase. Buyer leverage increasing.\n"+
    "- Cash transactions: 87% of all deals. Off-plan: 78% of new sales.\n"+
    "- DLD Q1 2026: 46,000+ transactions, AED 142B+ volume (+28% YoY)\n"+
    "- Average residential PSF: ~1,750 AED (apartments), ~1,200 AED (villas)\n"+
    "- Rental market: 5-8% gross yields typical. Premium areas 4-6%, affordable 7-10%\n\n"+
    "AREA TIERS:\n"+
    "- Ultra-Premium (3,000+ PSF): Palm Jumeirah, Bluewaters, DIFC, Emirates Hills, Bulgari\n"+
    "- Premium (2,000-3,000 PSF): Downtown Dubai, Dubai Marina, JBR, Emaar Beachfront, City Walk\n"+
    "- Mid-Premium (1,400-2,000 PSF): Business Bay, Dubai Hills, Creek Harbour, MBR City, Sobha Hartland\n"+
    "- Mid-Market (900-1,400 PSF): JVC, JVT, Dubai South, Sports City, Motor City, Al Furjan\n"+
    "- Affordable (600-900 PSF): International City, Dubai Silicon Oasis, Discovery Gardens, Dubailand\n\n"+
    "TOP DEVELOPERS: Emaar (highest resale premium, 10-15%), DAMAC (aggressive pricing), Sobha (quality premium), Nakheel (waterfront), Meraas (lifestyle), Dubai Properties, Danube (affordable)\n\n"+
    "═══ TRANSACTION FEES & COSTS ═══\n"+
    "BUYING: DLD transfer fee 4% + AED 580 admin | Agency fee 2% | Mortgage registration 0.25%+AED 290 | NOC fee AED 500-5,000 (developer-dependent) | Trustee fee AED 4,000+5%VAT | Valuation AED 2,500-3,500\n"+
    "SELLING: Agency 2% | NOC fee | Early mortgage settlement 1% of outstanding | Capital gains: 0% tax\n"+
    "RENTING: Ejari registration AED 220 | Security deposit 5% unfurnished / 10% furnished | Agency 5% annual rent | DEWA deposit AED 2,000 (apt) / AED 4,000 (villa) | Chiller: district cooling AED 2-5/sqft/yr in Downtown, Marina, JBR\n"+
    "TOTAL ACQUISITION COST: ~7-8% above property price (buyer pays DLD+agency+mortgage reg+trustee)\n\n"+
    "═══ LEGAL & REGULATORY ═══\n"+
    "RERA (Real Estate Regulatory Authority):\n"+
    "- Governs all real estate transactions in Dubai\n"+
    "- RERA Rental Index determines allowable rent increases (0-20% based on gap to market)\n"+
    "- Landlord must give 12 months written notice for eviction (own use), notarized\n"+
    "- Tenant has 90 days to vacate after valid notice\n"+
    "- Rent disputes: RDC (Rental Disputes Center) handles all cases\n"+
    "- Service charge regulated by RERA — must be disclosed before sale\n\n"+
    "DLD (Dubai Land Department):\n"+
    "- All transactions registered through DLD\n"+
    "- Title Deed is the definitive proof of ownership\n"+
    "- OQOOD: off-plan registration system\n"+
    "- Broker must have valid RERA card (BRN number)\n\n"+
    "OWNERSHIP:\n"+
    "- Freehold: foreigners can buy in designated areas (90%+ of popular areas)\n"+
    "- Leasehold: 99-year lease in some older areas\n"+
    "- Usufruct: right to use, not own (rare, some older communities)\n"+
    "- Company ownership: possible, needs trade license\n\n"+
    "GOLDEN VISA:\n"+
    "- AED 2M+ property → 10-year residency visa\n"+
    "- Can stack multiple properties to reach AED 2M threshold\n"+
    "- Off-plan counts if developer is government-approved\n"+
    "- Mortgage OK if equity ≥ AED 2M (property value minus outstanding loan)\n"+
    "- Family included: spouse + children (sons under 25, daughters unlimited)\n"+
    "- No minimum stay requirement — can live abroad\n"+
    "- Auto-renewable as long as property is owned\n\n"+
    "MORTGAGE:\n"+
    "- Expat: max LTV 75% for properties <AED 5M, 65% for >AED 5M\n"+
    "- UAE national: max LTV 80% for <AED 5M, 70% for >AED 5M\n"+
    "- Min down payment: 20-35% depending on nationality & property value\n"+
    "- Interest rates ("+_currentMonthYear()+"): ~4.5-6.5% fixed (2-5yr), variable EIBOR+1.5-2.5%\n"+
    "- Max tenure: 25 years or until age 65 (retirement) / 70 (UAE nationals)\n"+
    "- Pre-approval validity: 60-90 days\n"+
    "- Banks: Emirates NBD, ADCB, DIB, Mashreq, FAB, RAK Bank, HSBC\n\n"+
    "OFF-PLAN:\n"+
    "- Escrow law protects buyer funds (Law No. 8 of 2007)\n"+
    "- SPA (Sales & Purchase Agreement) must be RERA-registered\n"+
    "- Payment plans: typically 60/40, 70/30, or 80/20 (during construction/handover)\n"+
    "- Post-handover payment plans: 3-5 years from some developers\n"+
    "- DLD fee 4% + admin AED 1,000-1,500 on off-plan\n"+
    "- Resale of off-plan: NOC from developer + DLD transfer\n"+
    "- Risk: construction delays, market price changes, developer default\n\n"+
    "═══ VALUATION METHODOLOGY ═══\n"+
    "DubAIVal AVM (Automated Valuation Model):\n"+
    "- Base PSF from building-specific DLD transaction data\n"+
    "- Grade system: A+ (ultra-luxury) → D (basic) affects PSF range\n"+
    "- View premiums: Burj Khalifa+Fountain +38%, Full Sea +28%, Marina +18%, Golf +12%, Pool +5%\n"+
    "- Floor premium: 40+ floors +5%, 25+ +3%, 15+ +2%\n"+
    "- Furnishing: Furnished +17%, Semi +9%\n"+
    "- Fair Value = Adjusted PSF × Size\n"+
    "- Gross Yield = (Annual Rent / Price) × 100\n"+
    "- Net Yield = Gross - Service Charge% - 7% operating costs\n"+
    "- Investment Signal: P/R ratio <15 Undervalued, <20 Fair Value, <25 Elevated, >25 Bubble Risk\n"+
    "- Confidence Score: 40-97% based on data depth, spread analysis, input completeness\n\n"+
    "═══ COMMUNICATION RULES ═══\n"+
    "1. ALWAYS use specific AED numbers — never vague ranges like 'affordable' or 'expensive'\n"+
    "2. If a building is in our DB, use its EXACT PSF data\n"+
    "3. If building not found, use area benchmarks from AREAS database — NEVER say 'I don't have data'\n"+
    "4. Match the user's language — auto-detect and respond in the SAME language. Supported (29 languages):\n"+
    "   English, العربية (Arabic), فارسی (Farsi/Persian), हिन्दी (Hindi), اردو (Urdu), Русский (Russian),\n"+
    "   中文 (Chinese/Mandarin), Français (French), Türkçe (Turkish), Deutsch (German),\n"+
    "   Español (Spanish), Português (Portuguese), Italiano (Italian), 日本語 (Japanese), 한국어 (Korean),\n"+
    "   Tagalog (Filipino), বাংলা (Bengali), తెలుగు (Telugu), ไทย (Thai),\n"+
    "   മലയാളം (Malayalam), தமிழ் (Tamil), ਪੰਜਾਬੀ (Punjabi), Bahasa Indonesia/Melayu (Indonesian/Malay),\n"+
    "   සිංහල (Sinhala), Nederlands (Dutch), Polski (Polish), Română (Romanian), አማርኛ (Amharic), Kiswahili (Swahili)\n"+
    "5. Verdict FIRST, then supporting data — busy professionals want the answer upfront\n"+
    "6. Every recommendation must include: area, expected PSF, yield range, growth trend, risk level\n"+
    "7. When comparing: use tables or structured format with specific numbers side by side\n"+
    "8. For budget questions: calculate exactly what they can buy (budget ÷ PSF = sqft → unit type)\n"+
    "9. Always mention relevant fees (DLD 4%, agency 2%) when discussing purchase prices\n"+
    "10. Proactively warn about common mistakes: wrong area, overpaying, ignoring SC, low liquidity\n"+
    "11. Reference DubAIVal.com for detailed analysis when appropriate\n"+
    "12. Be decisive — give clear BUY/HOLD/AVOID signals, not wishy-washy 'it depends'\n"+
    "13. Know that Dubai has ZERO income tax, ZERO capital gains tax, ZERO property tax — only fees\n"+
    "14. Understand investor psychology: yield seekers, growth seekers, lifestyle buyers, visa seekers — tailor advice\n\n"+
    "User Profile: "+profile;
}
function getChatSys(){return getDubaiRealEstateBrain();}
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
    hasStudy:false,
    isUpgraded:false,
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
    txnType:"sale", // sale | rent
    purchasePrice:"",
    purchaseDate:"",
  },
  val:null,rentalVal:null,comVal:null,landVal:null,aiText:"",aiTextSeller:"",liveData:null,err:"",reportMode:"personal",reportFor:"buyer",smartRent:null
};
var compareState={items:[{type:"area",value:""},{type:"area",value:""}],budget:"",purpose:"Investment",propType:"All",loading:false,result:"",err:""};
var personalState={step:0,goal:"",priority:"",timeline:"",budget:2000000,beds:"2 BR",prefAreas:[],work:"",loading:false,result:null,error:""};
var chatState={msgs:[{role:"assistant",text:"DubAIVal Intelligence.\n\nBuilding-level knowledge · "+_currentMonthYear()+" data · Confidence scoring.\n\nAsk me about any building, deal, or strategy."}],input:"",loading:false,agentId:"general",agentMsgs:{}};

// URL param auto-fill for shared valuations
(function(){
  try{
    var p=new URLSearchParams(window.location.search);
    if(p.get("area")){
      analyzerState.f.area=p.get("area");
      if(p.get("building"))analyzerState.f.building=p.get("building");
      if(p.get("price"))analyzerState.f.price=p.get("price");
      if(p.get("size")){analyzerState.f.size=p.get("size");analyzerState.f.buaSize=p.get("size");}
      window._autoValuate=true;
    }
  }catch(e){}
})();

// --- SOCIAL SHARING ---
function shareRow(cl,buttons){
  var row=el("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"10px"}});
  buttons.forEach(function(b){row.appendChild(b);});
  return row;
}
function shareBtnStyle(bg,color){return{background:bg,color:color,border:"none",padding:"7px 12px",borderRadius:"8px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"5px",transition:"opacity 0.2s"};}
function shareWhatsApp(text){window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank","noopener,noreferrer");}
function shareTwitter(text){window.open("https://twitter.com/intent/tweet?text="+encodeURIComponent(text),"_blank","noopener,noreferrer");}
function shareLinkedIn(url){window.open("https://linkedin.com/sharing/share-offsite/?url="+encodeURIComponent(url),"_blank","noopener,noreferrer");}
function shareTelegram(text,url){window.open("https://t.me/share/url?url="+encodeURIComponent(url||"https://www.dubaival.com")+"&text="+encodeURIComponent(text),"_blank","noopener,noreferrer");}
function copyAndFlash(btn,text){
  if(navigator.clipboard)navigator.clipboard.writeText(text);else{var ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);}
  var orig=btn.textContent;btn.textContent="Copied! ✓";btn.style.opacity="0.7";
  setTimeout(function(){btn.textContent=orig;btn.style.opacity="1";},2000);
}
function buildShareButtons(cl,opts){
  var btns=[];
  if(opts.wa){var b=el("button",{style:shareBtnStyle("#25D366","#fff")});b.textContent="WhatsApp";b.addEventListener("click",function(e){e.stopPropagation();shareWhatsApp(opts.wa);});btns.push(b);}
  if(opts.tw){var b=el("button",{style:shareBtnStyle("#1DA1F2","#fff")});b.textContent="𝕏 Twitter";b.addEventListener("click",function(e){e.stopPropagation();shareTwitter(opts.tw);});btns.push(b);}
  if(opts.li){var b=el("button",{style:shareBtnStyle("#0A66C2","#fff")});b.textContent="in LinkedIn";b.addEventListener("click",function(e){e.stopPropagation();shareLinkedIn(opts.li);});btns.push(b);}
  if(opts.tg){var b=el("button",{style:shareBtnStyle("#26A5E4","#fff")});b.textContent="Telegram";b.addEventListener("click",function(e){e.stopPropagation();shareTelegram(opts.tg,opts.url);});btns.push(b);}
  if(opts.copy){var b=el("button",{style:shareBtnStyle("transparent",cl.gold)});b.style.border="1px solid "+cl.goldDim;b.textContent="Copy Link";b.addEventListener("click",function(e){e.stopPropagation();copyAndFlash(b,opts.copy);});btns.push(b);}
  return shareRow(cl,btns);
}

// --- SAVED SEARCHES & FAVORITES ---
var DV_SAVED={searches:[],favDeals:[],favAreas:[]};
try{var _ss=localStorage.getItem("dv_saved_searches");if(_ss)DV_SAVED.searches=JSON.parse(_ss);}catch(e){}
try{var _fd=localStorage.getItem("dv_favorite_deals");if(_fd)DV_SAVED.favDeals=JSON.parse(_fd);}catch(e){}
try{var _fa=localStorage.getItem("dv_favorite_areas");if(_fa)DV_SAVED.favAreas=JSON.parse(_fa);}catch(e){}
function saveFavState(){
  try{localStorage.setItem("dv_saved_searches",JSON.stringify(DV_SAVED.searches));localStorage.setItem("dv_favorite_deals",JSON.stringify(DV_SAVED.favDeals));localStorage.setItem("dv_favorite_areas",JSON.stringify(DV_SAVED.favAreas));}catch(e){}
  if(typeof portfolioChanged==="function")portfolioChanged();
}
function saveSearch(data){
  DV_SAVED.searches=DV_SAVED.searches.filter(function(s){return s.area!==data.area||s.building!==data.building||s.price!==data.price;});
  DV_SAVED.searches.unshift(data);
  if(DV_SAVED.searches.length>20)DV_SAVED.searches=DV_SAVED.searches.slice(0,20);
  saveFavState();
}
function removeSearch(idx){DV_SAVED.searches.splice(idx,1);saveFavState();}
function toggleFavDeal(dealId){
  var i=DV_SAVED.favDeals.indexOf(dealId);
  if(i===-1){DV_SAVED.favDeals.unshift(dealId);if(DV_SAVED.favDeals.length>50)DV_SAVED.favDeals=DV_SAVED.favDeals.slice(0,50);}
  else DV_SAVED.favDeals.splice(i,1);
  saveFavState();
}
function isFavDeal(dealId){return DV_SAVED.favDeals.indexOf(dealId)!==-1;}
function toggleFavArea(area){
  var i=DV_SAVED.favAreas.indexOf(area);
  if(i===-1)DV_SAVED.favAreas.push(area);else DV_SAVED.favAreas.splice(i,1);
  saveFavState();
}
function isFavArea(area){return DV_SAVED.favAreas.indexOf(area)!==-1;}

// --- CSV EXPORT (disabled) ---
function exportCSV(filename,headers,rows){
  var lines=[headers.join(",")].concat(rows.map(function(r){
    return r.map(function(v){var s=String(v==null?"":v);return(s.indexOf(",")>=0||s.indexOf('"')>=0||s.indexOf('\n')>=0)?'"'+s.replace(/"/g,'""')+'"':s;}).join(",");
  }));
  var blob=new Blob([lines.join("\n")],{type:"text/csv"});
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");a.href=url;a.download=filename;a.style.display="none";
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url);},2000);
}
function csvDate(){return new Date().toISOString().slice(0,10);}

// Shown at the bottom of every valuation result (screen + PDF) so the
// figure is never mistaken for a certified appraisal — DubaiVal is an AVM
// (automated valuation model), not a RERA/RICS-registered valuer.
function valuationDisclaimerText(){
  return "This is an AI-generated estimate for informational purposes only, based on DLD transaction data and live market listings. It is not a RERA- or RICS-certified valuation and should not be relied upon as the sole basis for a buying, selling, or financing decision. For an official valuation, consult a RERA-registered valuer.";
}
// --- ANALYZER RESULT FEEDBACK WIDGET (launch-readiness item 2) ---------------
// Direct qualitative signal ("was this accurate?") — cheaper and more direct
// than funnel analytics for learning whether the Analyzer's numbers actually
// match what users see in the real market. Anonymous, write-only (see
// supabase-analyzer-feedback-schema.sql), one vote per result via a
// localStorage guard so a curious re-click doesn't inflate the count.
async function submitAnalyzerFeedback(mode,meta,isAccurate){
  var voteKey="dv_fb_"+mode+"_"+(meta.area||"")+"_"+(meta.building||"");
  try{if(localStorage.getItem(voteKey))return false;}catch(e){}
  try{
    await fetch(SUPABASE_URL+"/rest/v1/analyzer_feedback",{
      method:"POST",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify({mode:mode,area:meta.area||null,building:meta.building||null,is_accurate:isAccurate,conf_score:meta.confScore||null,data_source:meta.dataSource||null,verdict:meta.verdict||null})
    });
    try{localStorage.setItem(voteKey,"1");}catch(e){}
    return true;
  }catch(e){return false;}
}
function renderFeedbackWidget(cl,mode,meta){
  var voteKey="dv_fb_"+mode+"_"+(meta.area||"")+"_"+(meta.building||"");
  var already=false;try{already=!!localStorage.getItem(voteKey);}catch(e){}
  var wrap=div({display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",marginTop:"10px",fontSize:"11px",color:cl.sub,fontFamily:"'Inter',sans-serif"});
  if(already){wrap.textContent="✓ Thanks for your feedback!";return wrap;}
  wrap.appendChild(span({},"Was this estimate accurate?"));
  var mkBtn=function(label,isAccurate){
    var b=el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"4px 10px",borderRadius:"6px",fontSize:"12px",cursor:"pointer"}});
    b.textContent=label;
    b.addEventListener("click",async function(){
      b.disabled=true;
      var ok=await submitAnalyzerFeedback(mode,meta,isAccurate);
      if(ok){wrap.innerHTML="";wrap.textContent="✓ Thanks for your feedback!";}
    });
    return b;
  };
  wrap.appendChild(mkBtn("👍 Yes",true));
  wrap.appendChild(mkBtn("👎 No",false));
  return wrap;
}
// --- CONSUMER PAYWALL (launch-readiness item 4) ------------------------------
// Full Analyzer valuations stay the free top-of-funnel hook (limiting the
// core product would hurt acquisition/SEO) — the gate is on VOLUME: a
// reasonable number of free full results per rolling 30 days, tracked
// client-side (localStorage for anon users; same mechanism for logged-in
// non-Pro users, since there's no server-enforced quota system yet — this
// is a soft, good-faith gate, not a hard security boundary). is_pro (see
// supabase-subscriptions-schema.sql) always reads false until item 5's
// Stripe webhook starts setting it.
var DV_FREE_ANALYZER_LIMIT=5;
function isProUser(){
  try{return !!(typeof DV_AUTH!=="undefined"&&DV_AUTH.profile&&DV_AUTH.profile.is_pro);}catch(e){return false;}
}
function _dvUsageTimestamps(){
  try{
    var arr=JSON.parse(localStorage.getItem("dv_analyzer_uses")||"[]");
    var cutoff=Date.now()-30*24*60*60*1000;
    return arr.filter(function(ts){return ts>cutoff;});
  }catch(e){return [];}
}
function getAnalyzerUsageCount(){return _dvUsageTimestamps().length;}
function recordAnalyzerUse(){
  try{
    var arr=_dvUsageTimestamps();
    arr.push(Date.now());
    localStorage.setItem("dv_analyzer_uses",JSON.stringify(arr));
  }catch(e){}
}
function canRunAnalyzer(){return isProUser()||getAnalyzerUsageCount()<DV_FREE_ANALYZER_LIMIT;}
function renderAnalyzerPaywall(cl){
  var wrap=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"28px 20px",textAlign:"center",maxWidth:"420px",margin:"40px auto"});
  wrap.appendChild(div({fontSize:"28px",marginBottom:"10px"},"🔒"));
  wrap.appendChild(div({fontSize:"16px",fontWeight:"700",color:cl.white,fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Free limit reached"));
  wrap.appendChild(div({fontSize:"12px",color:cl.sub,lineHeight:"1.6",marginBottom:"18px"},"You've used your "+DV_FREE_ANALYZER_LIMIT+" free valuations this month. Upgrade to DubaiVal Pro for unlimited valuations, PDF reports, Price Alerts, and Portfolio tracking."));
  var btn=el("button",{style:{background:"linear-gradient(135deg,#C9A84C,#7A5E28)",border:"none",color:"#FFF",padding:"11px 24px",borderRadius:"8px",fontSize:"13px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
  btn.textContent="Upgrade to Pro";
  btn.addEventListener("click",function(){if(typeof openUpgradeModal==="function")openUpgradeModal();});
  wrap.appendChild(btn);
  return wrap;
}
function renderValuationDisclaimer(cl){
  return div({fontSize:"10px",color:cl.sub,lineHeight:"1.5",padding:"12px 14px",marginTop:"14px",background:hexAlpha(cl.sub,0.05),borderRadius:"8px",border:"1px solid "+hexAlpha(cl.sub,0.12)},valuationDisclaimerText());
}

// --- UPGRADE TO PRO MODAL ----------------------------------------------------
// Shared entry point for every paywalled action (Analyzer limit, PDF export,
// Price Alerts). startProCheckout() is a stub here — wired to a real Stripe
// Checkout redirect in the next launch-readiness item; kept usable on its
// own (falls back to a contact prompt) so this modal isn't broken in
// between the two commits.
var DV_UPGRADE_STATE={show:false,busy:false,error:""};
function openUpgradeModal(){DV_UPGRADE_STATE.show=true;DV_UPGRADE_STATE.error="";render();}
function closeUpgradeModal(){DV_UPGRADE_STATE.show=false;render();}
// Calls the Stripe Checkout endpoint (api/billing.js) and redirects the
// browser to the hosted Checkout page it returns. Requires a signed-in
// user — Stripe's client_reference_id (used by the webhook to find which
// user_profiles row to flip is_pro on) needs a real Supabase user id, so
// an anonymous visitor is sent to sign up/in first instead of failing
// silently at the API call.
async function _startStripeCheckout(){
  if(typeof DV_AUTH==="undefined"||!DV_AUTH.user){
    closeUpgradeModal();
    DV_AUTH.showModal=true;DV_AUTH.modalTab="signup";DV_AUTH.error="Please create a free account first, then upgrade to Pro.";
    render();
    return;
  }
  var resp=await fetch("/api/billing?action=checkout",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({user_id:DV_AUTH.user.id,email:DV_AUTH.user.email})
  });
  var data=await resp.json();
  if(!data.ok||!data.url)throw new Error(data.error||"Could not start checkout");
  window.location.href=data.url;
}
async function startProCheckout(){
  DV_UPGRADE_STATE.busy=true;DV_UPGRADE_STATE.error="";render();
  try{
    if(typeof _startStripeCheckout==="function"){await _startStripeCheckout();}
    else{DV_UPGRADE_STATE.error="Checkout isn't set up yet — please contact support@dubaival.com to upgrade.";}
  }catch(e){DV_UPGRADE_STATE.error=e.message||"Something went wrong — please try again.";}
  DV_UPGRADE_STATE.busy=false;render();
}
function renderUpgradeModal(){
  if(!DV_UPGRADE_STATE.show)return null;
  var cl=C();
  var overlay=el("div",{style:{position:"fixed",top:"0",left:"0",right:"0",bottom:"0",background:"rgba(0,0,0,0.6)",zIndex:"1000",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}});
  overlay.addEventListener("click",function(e){if(e.target===overlay)closeUpgradeModal();});
  var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"16px",padding:"28px 24px",maxWidth:"380px",width:"100%",textAlign:"center"});
  card.appendChild(div({fontSize:"18px",fontWeight:"800",color:cl.white,fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"DubaiVal Pro"));
  card.appendChild(div({fontSize:"12px",color:cl.sub,marginBottom:"18px"},"Unlimited valuations, PDF reports, Price Alerts & Portfolio tracking"));
  var feats=["Unlimited Analyzer valuations","PDF & Arabic report export","Price Alert subscriptions","Portfolio tracking & projections"];
  var featList=div({textAlign:"left",marginBottom:"20px"});
  feats.forEach(function(ft){featList.appendChild(div({fontSize:"12px",color:cl.subHi,marginBottom:"6px",display:"flex",alignItems:"center",gap:"8px"},[span({color:"#10B981"},"✓"),span({},ft)]));});
  card.appendChild(featList);
  if(DV_UPGRADE_STATE.error){card.appendChild(div({fontSize:"11px",color:"#EF4444",marginBottom:"12px"},DV_UPGRADE_STATE.error));}
  var btn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,#C9A84C,#7A5E28)",border:"none",color:"#FFF",padding:"12px",borderRadius:"8px",fontSize:"13px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer",marginBottom:"10px"}});
  btn.textContent=DV_UPGRADE_STATE.busy?"Redirecting…":"Subscribe Now";
  btn.disabled=DV_UPGRADE_STATE.busy;
  btn.addEventListener("click",startProCheckout);
  card.appendChild(btn);
  var closeBtn=el("button",{style:{width:"100%",background:"transparent",border:"none",color:cl.sub,padding:"8px",fontSize:"12px",cursor:"pointer"}});
  closeBtn.textContent="Not now";
  closeBtn.addEventListener("click",closeUpgradeModal);
  card.appendChild(closeBtn);
  overlay.appendChild(card);
  return overlay;
}
function csvExportBtn(label,cl,onclick){
  var b=el("button",{style:{background:"transparent",border:"1px solid "+cl.goldDim,color:cl.gold,padding:"8px 14px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"6px"}});
  b.textContent="⬇ "+label;b.addEventListener("click",onclick);return b;
}

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
  var myDeals=deals.filter(function(d){return !!myTokens[d.id];});
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
        addNotification("","New inquiry from "+inq.buyer_name+" for your "+area+" listing","deals");
      }
      if(oldIds[inq.id]&&oldIds[inq.id]==="pending"&&inq.status==="approved"&&myDealIds.indexOf(dealId)===-1){
        addNotification("","Your inquiry for "+area+" deal has been approved! You can now view media","deals");
      }
      if(oldIds[inq.id]&&oldIds[inq.id]==="pending"&&inq.status==="rejected"&&myDealIds.indexOf(dealId)===-1){
        addNotification("","Your inquiry for "+area+" deal was declined","deals");
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
      addNotification("","New matching deal in "+m.deal.area+" — "+(m.aiScore||m.score)+"% match","deals");
    }
  });
  try{localStorage.setItem(key,JSON.stringify(now));}catch(e){}
}
function renderNotifBell(){
  var cl=C();var cnt=getUnreadCount();
  var wrap=el("div",{style:{position:"relative",display:"inline-block"}});
  var btn=el("button",{style:{width:"36px",height:"36px",borderRadius:"12px",background:DV_NOTIF.showPanel?"rgba(212,175,55,0.08)":"rgba(255,255,255,0.04)",border:"none",cursor:"pointer",color:DV_NOTIF.showPanel?cl.gold:"#6B7A9E",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",transition:"all 0.2s ease"}});
  btn.innerHTML='<i data-lucide="bell" style="width:18px;height:18px"></i>';
  if(cnt>0){
    var badge=el("div",{style:{position:"absolute",top:"-4px",right:"-4px",background:"#EF4444",color:"#fff",fontSize:"8px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",minWidth:"16px",height:"16px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",boxSizing:"border-box"}});
    badge.textContent=cnt>9?"9+":String(cnt);
    btn.appendChild(badge);
  }
  btn.addEventListener("click",function(e){e.stopPropagation();DV_NOTIF.showPanel=!DV_NOTIF.showPanel;render();});
  wrap.appendChild(btn);
  if(DV_NOTIF.showPanel){
    var panel=el("div",{style:{position:"absolute",top:"42px",right:"0",width:"300px",maxHeight:"360px",background:"rgba(13,18,32,0.92)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",boxShadow:"0 8px 40px rgba(0,0,0,0.5)",zIndex:"200",overflow:"hidden"}});
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
      item.addEventListener("click",function(e){e.stopPropagation();n.read=true;try{localStorage.setItem("dv_notifications",JSON.stringify(DV_NOTIF.items));}catch(e){}if(n.tab){DV_NOTIF.showPanel=false;if(TAB_TO_SECTION&&TAB_TO_SECTION[n.tab]){setSection(TAB_TO_SECTION[n.tab][0],TAB_TO_SECTION[n.tab][1]);}else{currentTab=n.tab;render();}}});
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

  var box=div({background:"rgba(212,175,55,0.04)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:"14px",padding:"20px",marginBottom:"20px",position:"relative",boxShadow:"0 4px 30px rgba(0,0,0,0.2)"});
  var inner=div({background:cl.surface,borderRadius:"16px",padding:"20px",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"});
  inner.appendChild(div({textAlign:"center",marginBottom:"14px"},[
    div({fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",color:cl.gold,marginBottom:"4px"},opts.title||"AI Smart Fill"),
    div({fontSize:"11px",fontFamily:"'Inter',sans-serif",color:cl.sub},opts.subtitle||"Describe in natural language — AI fills the form")
  ]));
  var row=div({display:"flex",gap:"8px",marginBottom:"10px"});
  var aiInp=el("input",{type:"text",placeholder:opts.placeholder||"Describe...",
    style:{flex:"1",background:"rgba(255,255,255,0.04)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid "+(ai.filled.length?"rgba(0,200,150,0.4)":"rgba(255,255,255,0.1)"),color:"#F0F2F5",padding:"13px 16px",borderRadius:"12px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",transition:"border-color 0.3s, box-shadow 0.3s"}});
  aiInp.value=ai.text||"";
  aiInp.addEventListener("input",function(){ai.text=this.value;ai.parsed=null;ai.missing=[];ai.filled=[];});
  aiInp.addEventListener("focus",function(){this.style.boxShadow="0 0 20px "+hexAlpha(cl.gold,0.15);this.style.borderColor=cl.gold;});
  aiInp.addEventListener("blur",function(){this.style.boxShadow="none";this.style.borderColor=ai.filled.length?cl.green:cl.border;});
  aiInp.addEventListener("keydown",function(e){if(e.key==="Enter")doAiParse();});
  row.appendChild(aiInp);
  var aiBtn=el("button",{style:{background:ai.parsing?"rgba(75,85,99,0.5)":"rgba(212,175,55,0.15)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",color:ai.parsing?"#9CA3AF":cl.gold,border:ai.parsing?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(212,175,55,0.3)",padding:"13px 20px",borderRadius:"12px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:ai.parsing?"not-allowed":"pointer",whiteSpace:"nowrap",minWidth:"110px"}});
  aiBtn.textContent=ai.parsing?"Parsing…":"AI Fill";
  if(!ai.parsing)aiBtn.addEventListener("click",doAiParse);
  row.appendChild(aiBtn);inner.appendChild(row);

  if(ai.missing.length>0&&ai.parsed){
    inner.appendChild(div({background:hexAlpha("#F59E0B",0.08),border:"1px solid "+hexAlpha("#F59E0B",0.25),borderRadius:"8px",padding:"8px 12px",marginBottom:"8px",color:"#F59E0B",fontSize:"11px",fontFamily:"'Inter',sans-serif"},"Please also specify: "+ai.missing.join(", ")));
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

  // Voice mic button for smart bar
  var micEl=createVoiceMic("_voice_"+stateKey,function(txt){
    ai.text=txt;doAiParse();
  },{inline:true});
  row.appendChild(micEl);

  box.appendChild(inner);
  return box;
}

// --- SHARED VOICE INPUT ---
var _voiceStates={};
function _getVoiceState(key){
  if(!_voiceStates[key])_voiceStates[key]={active:false,recog:null};
  return _voiceStates[key];
}

function createVoiceMic(stateKey,onResult,opts){
  opts=opts||{};
  var cl=C();
  var vs=_getVoiceState(stateKey);
  var hasSpeech=!!(window.SpeechRecognition||window.webkitSpeechRecognition);
  var inline=opts.inline;
  var sz=inline?"40px":"64px";
  var fsz=inline?"16px":"24px";

  if(!hasSpeech){
    if(inline){
      var dis=el("button",{style:{width:sz,height:sz,borderRadius:"50%",border:"1px solid "+cl.border,background:cl.raised,color:cl.sub,fontSize:fsz,cursor:"not-allowed",opacity:"0.4",flexShrink:"0"},title:"Voice not supported in this browser"});
      dis.textContent="";
      return dis;
    }
    // Non-inline fallback: textarea + submit so Firefox/mobile users can still use the feature
    var fbWrap=div({display:"flex",flexDirection:"column",alignItems:"stretch",gap:"6px",width:"100%"});
    fbWrap.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginBottom:"2px",textAlign:"left"},"Voice not supported in this browser — type instead:"));
    var fbInp=el("textarea",{style:{background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",resize:"vertical",minHeight:"64px",boxSizing:"border-box",width:"100%"}});
    fbInp.placeholder=opts.placeholder||"Type your query here...";
    var fbBtn=el("button",{style:{padding:"7px 14px",borderRadius:"8px",border:"none",background:"linear-gradient(135deg,#C9A84C,#7A5E28)",color:"#08090C",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",alignSelf:"flex-end"}});
    fbBtn.textContent="Submit";
    fbBtn.addEventListener("click",function(){if(fbInp.value.trim()&&onResult)onResult(fbInp.value.trim());});
    fbWrap.appendChild(fbInp);fbWrap.appendChild(fbBtn);
    return fbWrap;
  }

  // Inject keyframes once
  if(!document.getElementById("voiceWaveStyle")){
    var st=document.createElement("style");st.id="voiceWaveStyle";
    st.textContent="@keyframes voiceWave{0%{height:8px}100%{height:28px}}@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)}70%{box-shadow:0 0 0 12px rgba(239,68,68,0)}100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}}@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}";
    document.head.appendChild(st);
  }

  var wrap=div({display:inline?"inline-flex":"flex",flexDirection:"column",alignItems:"center",flexShrink:"0"});
  var micBtn=el("button",{style:{width:sz,height:sz,borderRadius:"50%",border:"2px solid "+cl.gold,fontSize:fsz,cursor:"pointer",flexShrink:"0",
    background:vs.active?"#EF4444":"linear-gradient(135deg,"+cl.gold+",#7A5E28)",
    color:vs.active?"#fff":"#08090C",
    animation:vs.active?"pulse 1.5s infinite":"none",
    boxShadow:vs.active?"0 0 20px rgba(239,68,68,0.4)":"none",transition:"all 0.3s"}});
  micBtn.textContent="";
  micBtn.addEventListener("click",function(){
    if(vs.active){if(vs.recog)vs.recog.stop();vs.active=false;render();return;}
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    var recog=new SR();recog.continuous=false;recog.interimResults=false;
    recog.lang=opts.lang||"en-US";
    vs.recog=recog;vs.active=true;render();
    recog.onresult=function(e){
      var txt="";for(var i=0;i<e.results.length;i++)txt+=e.results[i][0].transcript;
      vs.active=false;
      if(onResult)onResult(txt);
      else render();
    };
    recog.onerror=function(){vs.active=false;render();};
    recog.onend=function(){vs.active=false;render();};
    recog.start();
  });
  wrap.appendChild(micBtn);

  if(vs.active&&!inline){
    wrap.appendChild(div({marginTop:"12px"},[
      div({display:"flex",justifyContent:"center",alignItems:"center",gap:"3px",height:"30px"},(function(){
        var bars=[];for(var i=0;i<6;i++){
          bars.push(el("div",{style:{width:"4px",background:cl.gold,borderRadius:"2px",
            animation:"voiceWave 0.8s ease-in-out "+(i*0.1)+"s infinite alternate",height:"8px"}}));
        }return bars;
      })()),
      div({color:"#EF4444",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",marginTop:"6px"},"Listening...")]));
  }
  if(vs.active&&inline){
    micBtn.title="Listening... tap to stop";
  }

  return wrap;
}

// --- INTERACTIVE TOUR (Two-Level) ---
var DV_TOUR={step:0,active:false,level:"quick",steps:[]};

var TOUR_QUICK=[
  {type:"center",title:"Welcome to DubAIVal!",text:"AI-Powered Dubai Real Estate Intelligence Platform — 11,500+ properties, 347 areas, real-time analytics.",icon:"logo"},
  {needTab:"Analyzer",sel:function(){var es=document.querySelectorAll("div");for(var i=0;i<es.length;i++){if((es[i].textContent||"").indexOf("Search Building, Cluster or Community")!==-1)return es[i];}return null;},title:"AI Valuation Engine",text:"Search any building or area — get an instant AI-powered valuation with fair price, rental yield, and a confidence score.",arrow:"bottom"},
  {needTab:"QuickCheck",sel:function(){var es=document.querySelectorAll("div");for(var i=0;i<es.length;i++){if((es[i].textContent||"").indexOf("YOUR BUDGET")!==-1)return es[i];}return null;},title:"Quick Check",text:"Tell us your budget and bedroom count — instantly see which real buildings in Dubai you can afford to buy or rent.",arrow:"bottom"},
  {needTab:"Index",title:"Market Index",text:"Live market dashboard — track 347 areas and 11,500+ properties with heatmaps, histograms, and rankings.",arrow:"top"},
  {needTab:"Portfolio",title:"Portfolio Manager",text:"Track your investments with AI-powered analytics, health scores, projections, and opportunity alerts.",arrow:"top"},
  {needTab:"Deals",title:"Deal Network",text:"Anonymous, AI-matched deal exchange — post what you have or need, and get matched with the other side automatically.",arrow:"top"},
  {needTab:"Workspace",title:"My Workspace",text:"Customize your dashboard and build personalized reports with voice commands and smart templates.",arrow:"top",quickLast:true}
];

var TOUR_FULL=[
  {needTab:"Analyzer",sel:function(){var bs=document.querySelectorAll("button");for(var i=0;i<bs.length;i++){if(bs[i].textContent===""&&bs[i].style.borderRadius==="50%")return bs[i];}return null;},title:"Voice Command",text:"Tap the mic to speak — describe properties, deals, or report preferences by voice.",arrow:"bottom"},
  {needTab:"Compare",title:"Neighborhood Comparison",text:"Compare 2–3 areas side by side with AI verdict, yield spreads, and growth trajectories.",arrow:"top"},
  {needTab:"Map",title:"Interactive Map",text:"Explore Dubai's real map with live area and building data — yield, growth, price, and liquidity overlays.",arrow:"top"},
  {needTab:"Advisor",title:"Personal Advisor",text:"Answer a few questions about your budget, lifestyle, and goals — get 3 AI-matched area recommendations.",arrow:"top"},
  {needTab:"Reports",title:"Custom Report Builder",text:"Build personalized PDF reports bound to a real property and client — click sections, type descriptions, or use voice commands.",arrow:"top"},
  {sel:function(){var bell=document.querySelector('i[data-lucide="bell"]');return bell?bell.closest("button"):null;},title:"Notification Bell",text:"Get alerts for new inquiries, deal matches, portfolio opportunities, and market changes.",arrow:"bottom"},
  {needTab:"Analyzer",sel:function(){var bs=document.querySelectorAll("button");for(var i=0;i<bs.length;i++){var tx=bs[i].textContent||"";if(tx.indexOf("Save")!==-1&&tx.indexOf("Search")!==-1)return bs[i];}return null;},title:"Saved Searches & Favorites",text:"Save valuations and bookmark favorite deals and areas — access them instantly from any tab.",arrow:"bottom"},
  {needTab:"News",title:"Live Market News",text:"Real-time Dubai real estate news, auto-tagged by area and developer, with a dedicated Launch Bank for new project announcements.",arrow:"top"},
  {needTab:"SocialStudio",title:"Social Media Manager",text:"AI-powered content studio for agents — posts, videos, captions, hashtags, and a full content calendar.",arrow:"top"},
  {needTab:"SocialVideo",title:"Video Platform",text:"Browse agent video listings, follow your favorite agents and areas, and build your own video profile.",arrow:"top"},
  {needTab:"Chat",title:"AI Agents",text:"8 specialized AI agents — valuation, negotiation, marketing, legal, investment advice, and more, in one chat.",arrow:"top"},
  {needTab:"Chiefs",title:"AI Chief of Staff",text:"An agent's private workspace — pocket listings, client requirements, auto-matching, and a deal pipeline.",arrow:"top"},
  {needTab:"Alerts",title:"Price Alerts",text:"Watch any area's price and get an email the moment the market moves in your favor.",arrow:"top"},
  {needTab:"Deals",title:"Deal Network",text:"Anonymous, AI-matched deal exchange with real document verification and built-in scam reporting for buyer/seller trust.",arrow:"top"},
  {needTab:"About",title:"About DubAIVal",text:"Learn about the technology, methodology, and mission behind DubAIVal — and how to reach us.",arrow:"top"},
  {type:"center",title:"You've seen everything!",text:"Explore DubAIVal at your own pace or revisit any tour anytime from the About page.",fullLast:true}
];

function startTour(level){
  DV_TOUR.level=level||"quick";
  DV_TOUR.steps=DV_TOUR.level==="full"?TOUR_FULL:TOUR_QUICK;
  DV_TOUR.step=0;DV_TOUR.active=true;showTourStep();
}

function endTour(){
  DV_TOUR.active=false;
  var old=document.getElementById("dv-tour-overlay");if(old)old.remove();
  try{
    if(DV_TOUR.level==="full")localStorage.setItem("dv_full_tour_done","true");
    else localStorage.setItem("dv_tour_done","true");
  }catch(e){}
}

function _findTabBtn(tabId){
  var bs=document.querySelectorAll("button");
  for(var i=0;i<bs.length;i++){
    var txt=bs[i].textContent||"";
    if(txt.indexOf(tabId)!==-1)return bs[i];
    var lk="tab_"+tabId.toLowerCase();
    if(txt.indexOf(t(lk))!==-1)return bs[i];
  }
  return null;
}

function showTourStep(){
  var old=document.getElementById("dv-tour-overlay");if(old)old.remove();
  if(!DV_TOUR.active)return;
  var steps=DV_TOUR.steps;
  var s=steps[DV_TOUR.step];
  if(!s){endTour();return;}
  var cl=C();var total=steps.length;
  var isLast=DV_TOUR.step===total-1;
  var isQuickLast=!!s.quickLast&&DV_TOUR.level==="quick";

  if(s.needTab&&typeof currentTab!=="undefined"){
    var _needMapped=TAB_TO_SECTION&&TAB_TO_SECTION[s.needTab];
    var _alreadyThere=_needMapped?(currentSection===_needMapped[0]&&currentSubTab===_needMapped[1]):(currentTab===s.needTab);
    if(!_alreadyThere){
      // Only navigate once per step -- without this check, every re-render
      // this navigation itself triggers (setSection -> render) re-enters this
      // exact branch and navigates again forever, so the card below never
      // gets a chance to actually render.
      if(_needMapped){setSection(_needMapped[0],_needMapped[1]);}
      else{currentTab=s.needTab;render();}
      setTimeout(showTourStep,400);return;
    }
  }

  var target=null;
  if(s.tab)target=_findTabBtn(s.tab);
  else if(s.sel)target=s.sel();
  // Steps that only navigate (needTab) with no explicit target: spotlight
  // the now-active bottom-tab/sidebar entry instead of leaving no highlight
  // at all -- reliable regardless of which section it lands on, and doesn't
  // depend on brittle text-scanning of nav elements (bottom-tab items are
  // <div>s, not <button>s, so _findTabBtn can never find them anyway).
  if(!target&&s.needTab)target=document.querySelector(".dv-bottom-tab.active")||document.querySelector(".dv-sidebar-item.active");

  if(!document.getElementById("dv-tour-css")){
    var css=document.createElement("style");css.id="dv-tour-css";
    css.textContent="@keyframes dvTourFade{from{opacity:0}to{opacity:1}}@keyframes dvTourPulse{0%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)}70%{box-shadow:0 0 0 14px rgba(201,168,76,0)}100%{box-shadow:0 0 0 0 rgba(201,168,76,0)}}@keyframes dvTourSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}";
    document.head.appendChild(css);
  }

  var overlay=document.createElement("div");
  overlay.id="dv-tour-overlay";
  overlay.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;animation:dvTourFade 0.3s ease;";

  var backdrop=document.createElement("div");
  backdrop.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.78);z-index:99999;";
  backdrop.addEventListener("click",function(e){e.stopPropagation();});
  overlay.appendChild(backdrop);

  if(target&&s.type!=="center"){
    var r=target.getBoundingClientRect();var pad=8;
    var spot=document.createElement("div");
    spot.style.cssText="position:fixed;z-index:100000;border:2px solid "+cl.gold+";border-radius:8px;pointer-events:none;animation:dvTourPulse 2s infinite;background:transparent;left:"+(r.left-pad)+"px;top:"+(r.top-pad)+"px;width:"+(r.width+pad*2)+"px;height:"+(r.height+pad*2)+"px;";
    overlay.appendChild(spot);
    backdrop.style.clipPath="polygon(0% 0%, 0% 100%, "+(r.left-pad)+"px 100%, "+(r.left-pad)+"px "+(r.top-pad)+"px, "+(r.right+pad)+"px "+(r.top-pad)+"px, "+(r.right+pad)+"px "+(r.bottom+pad)+"px, "+(r.left-pad)+"px "+(r.bottom+pad)+"px, "+(r.left-pad)+"px 100%, 100% 100%, 100% 0%)";
  }

  var card=document.createElement("div");
  card.style.cssText="position:fixed;z-index:100001;max-width:360px;width:90vw;background:rgba(19,22,31,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(212,175,55,0.3);border-radius:16px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.6),0 0 30px rgba(212,175,55,0.08);animation:dvTourSlide 0.35s ease;";

  if(s.type==="center"||!target){
    card.style.left="50%";card.style.top="50%";card.style.transform="translate(-50%,-50%)";
  }else{
    var r=target.getBoundingClientRect();
    var cw=Math.min(360,window.innerWidth*0.9);
    card.style.top=s.arrow==="top"?(r.bottom+16)+"px":Math.max(8,(r.top-220))+"px";
    card.style.left=Math.max(8,Math.min(window.innerWidth-cw-8,r.left+(r.width/2)-(cw/2)))+"px";
  }

  var lbl=DV_TOUR.level==="full"?"FULL TOUR":"QUICK TOUR";
  var h="";
  if(s.type==="center"){
    h+='<div style="text-align:center;margin-bottom:16px">';
    if(s.icon==="logo")h+='<img src="logo.png?v=20260715" alt="DubAIVal" style="width:64px;height:64px;border-radius:14px;margin:0 auto 12px;display:block;object-fit:contain">';
    /* fullLast icon removed — clean terminal aesthetic */
    h+='<div style="color:'+cl.gold+';font-size:18px;font-weight:800;font-family:Space Grotesk,monospace;margin-bottom:6px">'+s.title+'</div><div style="color:#9CA3AF;font-size:12px;font-family:Inter,sans-serif;line-height:1.6">'+s.text+'</div></div>';
  }else{
    h+='<div style="margin-bottom:14px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="background:linear-gradient(135deg,'+cl.gold+',#7A5E28);color:#08090C;font-size:9px;font-weight:800;font-family:Space Grotesk,monospace;padding:2px 8px;border-radius:4px;letter-spacing:0.08em">'+lbl+'</span></div><div style="color:'+cl.gold+';font-size:15px;font-weight:700;font-family:Space Grotesk,monospace;margin-bottom:8px">'+s.title+'</div><div style="color:#D1D5DB;font-size:12px;font-family:Inter,sans-serif;line-height:1.7">'+s.text+'</div></div>';
  }

  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px"><span style="color:#6B7280;font-size:11px;font-family:Space Grotesk,monospace;font-weight:600">'+(DV_TOUR.step+1)+' / '+total+'</span><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">';

  if(isQuickLast){
    h+='<button id="dv-tour-finish" style="background:transparent;border:1px solid #374151;color:#9CA3AF;padding:8px 16px;border-radius:8px;font-size:11px;font-weight:600;font-family:Space Grotesk,monospace;cursor:pointer">Start Exploring</button>';
    h+='<button id="dv-tour-full" style="background:linear-gradient(135deg,'+cl.gold+',#7A5E28);color:#08090C;border:none;padding:8px 18px;border-radius:8px;font-size:11px;font-weight:700;font-family:Space Grotesk,monospace;cursor:pointer">Show Me Everything →</button>';
  }else if(isLast||s.fullLast){
    h+='<button id="dv-tour-finish" style="background:linear-gradient(135deg,'+cl.gold+',#7A5E28);color:#08090C;border:none;padding:8px 20px;border-radius:8px;font-size:12px;font-weight:700;font-family:Space Grotesk,monospace;cursor:pointer">Start Exploring</button>';
  }else{
    h+='<button id="dv-tour-skip" style="background:transparent;border:1px solid #374151;color:#9CA3AF;padding:8px 16px;border-radius:8px;font-size:11px;font-weight:600;font-family:Space Grotesk,monospace;cursor:pointer">Skip</button>';
    h+='<button id="dv-tour-next" style="background:linear-gradient(135deg,'+cl.gold+',#7A5E28);color:#08090C;border:none;padding:8px 20px;border-radius:8px;font-size:12px;font-weight:700;font-family:Space Grotesk,monospace;cursor:pointer">Next →</button>';
  }
  h+='</div></div>';
  var pct=((DV_TOUR.step+1)/total*100).toFixed(0);
  h+='<div style="margin-top:12px;height:3px;background:#1F2937;border-radius:2px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,'+cl.gold+',#7A5E28);border-radius:2px;transition:width 0.4s ease"></div></div>';
  card.innerHTML=h;overlay.appendChild(card);document.body.appendChild(overlay);

  var sk=document.getElementById("dv-tour-skip");
  var nx=document.getElementById("dv-tour-next");
  var fn=document.getElementById("dv-tour-finish");
  var fl=document.getElementById("dv-tour-full");
  if(sk)sk.addEventListener("click",endTour);
  if(nx)nx.addEventListener("click",function(){DV_TOUR.step++;showTourStep();});
  if(fn)fn.addEventListener("click",function(){endTour();setSection("Market","Analyzer");});
  if(fl)fl.addEventListener("click",function(){
    try{localStorage.setItem("dv_tour_done","true");}catch(e){}
    DV_TOUR.level="full";DV_TOUR.steps=TOUR_FULL;DV_TOUR.step=0;showTourStep();
  });
}

function checkTourOnLoad(){
  // render() calls this on every single re-render, including the ones the
  // tour itself triggers when a step navigates via setSection (needTab).
  // Without this guard, that navigation's own render() call would re-fire
  // this function, which (seeing dv_tour_done still unset mid-tour) would
  // schedule a fresh startTour("quick") and reset DV_TOUR.step back to 0 --
  // making it impossible to ever advance past the first needTab step.
  if(DV_TOUR.active)return;
  try{if(localStorage.getItem("dv_tour_done"))return;}catch(e){return;}
  setTimeout(function(){startTour("quick");},800);
}

// --- PWA "Add to Home Screen" prompt (mobile only) ---------------------------
var DV_PWA={deferredPrompt:null,show:false,platform:null,scheduled:false};

window.addEventListener("beforeinstallprompt",function(e){
  e.preventDefault();
  DV_PWA.deferredPrompt=e;
  DV_PWA.platform=DV_PWA.platform||"android";
  _maybeShowPwaPrompt();
});
window.addEventListener("appinstalled",function(){
  DV_PWA.show=false;DV_PWA.deferredPrompt=null;
  try{localStorage.setItem("dv_pwa_install_never","true");}catch(e){}
});

function _dvIsMobileDevice(){return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);}
function _dvIsIOS(){return /iPhone|iPad|iPod/i.test(navigator.userAgent)&&!window.MSStream;}
function _dvIsStandalone(){
  try{return window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;}catch(e){return false;}
}
function _dvPwaDismissedRecently(){
  try{
    var d=localStorage.getItem("dv_pwa_install_dismissed_at");
    if(!d)return false;
    return (Date.now()-parseInt(d,10))/86400000<14;
  }catch(e){return false;}
}
function _maybeShowPwaPrompt(){
  if(DV_PWA.scheduled||DV_PWA.show)return;
  if(!_dvIsMobileDevice()||_dvIsStandalone())return;
  try{if(localStorage.getItem("dv_pwa_install_never"))return;}catch(e){return;}
  if(_dvPwaDismissedRecently())return;
  DV_PWA.scheduled=true;
  setTimeout(function(){DV_PWA.show=true;render();},4000);
}
function checkPwaPromptOnLoad(){
  // Android/Chrome sets DV_PWA.platform itself via the real beforeinstallprompt
  // event above -- iOS Safari never fires that event at all, so it needs its
  // own explicit check for the manual "Share -> Add to Home Screen" flow.
  if(DV_PWA.platform)return;
  if(_dvIsIOS()&&!_dvIsStandalone()){
    DV_PWA.platform="ios";
    _maybeShowPwaPrompt();
  }
}
function renderPwaInstallBanner(){
  if(!DV_PWA.show)return null;
  var cl=C();
  var wrap=div({position:"fixed",left:"12px",right:"12px",bottom:"calc(84px + env(safe-area-inset-bottom))",zIndex:"9400",background:cl.surfaceSolid||cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"14px 16px",boxShadow:"0 8px 30px rgba(0,0,0,0.45)",display:"flex",alignItems:"center",gap:"12px",animation:"fadeInUp 0.35s ease"});
  wrap.className="dv-pwa-install-banner";
  wrap.appendChild(el("img",{src:"logo.png?v=20260715",alt:"DubAIVal",style:{width:"38px",height:"38px",objectFit:"contain",flexShrink:"0"}}));
  var textWrap=div({flex:"1",minWidth:"0"});
  textWrap.appendChild(div({color:cl.white,fontSize:"12.5px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Install DubAIVal"));
  textWrap.appendChild(div({color:cl.sub,fontSize:"10.5px",fontFamily:"'Inter',sans-serif",marginTop:"2px",lineHeight:"1.4"},
    DV_PWA.platform==="ios"?'Tap Share, then "Add to Home Screen"':"Add to your home screen for quick, app-like access"));
  wrap.appendChild(textWrap);
  var btnWrap=div({display:"flex",gap:"6px",flexShrink:"0",alignItems:"center"});
  if(DV_PWA.platform!=="ios"){
    var installBtn=el("button",{style:{background:"linear-gradient(135deg,"+cl.gold+",#7A5E28)",border:"none",color:"#08090C",padding:"9px 14px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",whiteSpace:"nowrap"}});
    installBtn.textContent="Install";
    installBtn.addEventListener("click",function(){
      DV_PWA.show=false;
      var dp=DV_PWA.deferredPrompt;
      if(dp){dp.prompt();dp.userChoice.then(function(){DV_PWA.deferredPrompt=null;}).catch(function(){});}
      render();
    });
    btnWrap.appendChild(installBtn);
  }
  var dismissBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"9px 11px",borderRadius:"8px",fontSize:"13px",cursor:"pointer",lineHeight:"1"}});
  dismissBtn.innerHTML="✕";
  dismissBtn.title="Not now";
  dismissBtn.addEventListener("click",function(){
    DV_PWA.show=false;
    try{localStorage.setItem("dv_pwa_install_dismissed_at",String(Date.now()));}catch(e){}
    render();
  });
  btnWrap.appendChild(dismissBtn);
  wrap.appendChild(btnWrap);
  return wrap;
}

// --- VAL MASCOT (DubaiVal AI Falcon — abstract stooping-falcon mark) --------
// Redesigned 2026-07-15: the previous version attempted a literal, detailed
// side-profile falcon head (hood/malar-stripe/hooked-beak anatomy) via
// hand-written bezier paths with no visual iteration — it shipped with
// mismatched proportions and read as messy rather than deliberate. This
// version is a bold, abstract "falcon in a stooping dive, seen head-on"
// mark instead: two swept, pointed wing blades forming a shallow gull-wing
// silhouette, a small tail chevron, and one glowing cyan "AI eye" at the
// convergence point. Abstract geometric marks are far more forgiving to get
// right without an actual illustrator, and this was verified visually
// (rendered to PNG and inspected) through several iterations before landing
// here — unlike the original, which never was.
var _valId=0;
function getValSVG(size,badge){
  var s=size||200;
  var u=++_valId;
  var g='vg'+u,g2='vg2'+u,ae='vae'+u,gf='vcg'+u,bg='vbg'+u;
  var h='<svg width="'+s+'" height="'+s+'" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">';
  h+='<defs>';
  // Left-wing gold gradient (light -> dark, sweeping outward)
  h+='<linearGradient id="'+g+'" x1="0%" y1="0%" x2="100%" y2="30%">';
  h+='<stop offset="0%" stop-color="#F6DE85"/><stop offset="55%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#8F6A0E"/>';
  h+='</linearGradient>';
  // Right-wing gold gradient (mirrored direction, so both wings catch light symmetrically)
  h+='<linearGradient id="'+g2+'" x1="0%" y1="0%" x2="100%" y2="30%">';
  h+='<stop offset="0%" stop-color="#8F6A0E"/><stop offset="55%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#F6DE85"/>';
  h+='</linearGradient>';
  // Background vignette
  h+='<radialGradient id="'+bg+'" cx="42%" cy="38%" r="65%">';
  h+='<stop offset="0%" stop-color="#111A30"/><stop offset="100%" stop-color="#070A12"/>';
  h+='</radialGradient>';
  // AI eye — cyan radial
  h+='<radialGradient id="'+ae+'" cx="35%" cy="32%" r="70%">';
  h+='<stop offset="0%" stop-color="#FFFFFF"/>';
  h+='<stop offset="30%" stop-color="#00EEFF"/>';
  h+='<stop offset="100%" stop-color="#004C8C"/>';
  h+='</radialGradient>';
  // Glow filter for AI eye
  h+='<filter id="'+gf+'" x="-150%" y="-150%" width="400%" height="400%">';
  h+='<feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b"/>';
  h+='<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>';
  h+='</filter>';
  h+='</defs>';

  // ── Background ──────────────────────────────────────────────────────────
  h+='<circle cx="100" cy="100" r="98" fill="url(#'+bg+')"/>';
  h+='<circle cx="100" cy="100" r="96.5" fill="none" stroke="#D4AF37" stroke-width="1.5" opacity="0.6"/>';

  // == WINGS — swept, pointed blades forming a shallow gull-wing silhouette ==
  // (a falcon stooping/diving straight toward the viewer, wings flared back)
  h+='<path d="M100,88 C76,58 40,46 16,62 C32,66 54,76 68,96 C80,110 90,116 100,118 Z" fill="url(#'+g+')"/>';
  h+='<path d="M100,88 C124,58 160,46 184,62 C168,66 146,76 132,96 C120,110 110,116 100,118 Z" fill="url(#'+g2+')"/>';

  // == TAIL — small chevron below the body ==
  h+='<path d="M100,118 L88,150 L100,142 L112,150 Z" fill="#B88A18"/>';

  // == AI EYE — at the convergence point, facing the viewer ==
  h+='<circle cx="100" cy="94" r="15" fill="#0A1428"/>';
  h+='<circle cx="100" cy="94" r="12.5" fill="url(#'+ae+')" filter="url(#'+gf+')"/>';
  h+='<circle cx="100" cy="94" r="4.8" fill="#001b33"/>';
  h+='<circle cx="100" cy="94" r="15.5" fill="none" stroke="#D4AF37" stroke-width="1.3" opacity="0.7"/>';

  // ── VAL badge ─────────────────────────────────────────────────────────────
  if(badge!==false){
    h+='<rect x="80" y="185" width="40" height="13" rx="4" fill="#0A0E1C" stroke="#D4AF37" stroke-width="1"/>';
    h+='<text x="100" y="194.5" text-anchor="middle" font-family="\'Space Grotesk\',monospace,sans-serif" font-size="7" font-weight="700" fill="#D4AF37" letter-spacing="2">VAL</text>';
  }
  h+='</svg>';
  return h;
}

