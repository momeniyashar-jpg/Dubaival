// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- MY WORKSPACE TAB ---------------------------------------------------------
var WS_STATE={widgets:[],mode:"dashboard",reportMode:"visual",reportSections:[],reportLang:"en",reportColor:"gold",reportTitle:"",reportLogo:null,templates:[],voiceActive:false,voiceText:"",parsed:false,
  reportArea:"",reportClientName:"",reportPrice:"",reportNationality:"expat",reportBuilding:"",
  agent:{name:"",phone:"",company:"",rera:""},
  // Added 2026-08-05 (Phase 2 of the GenieMap gap-closing plan) — a 2nd
  // report shape alongside the existing single-property valuation report:
  // a branded, multi-project off-plan catalog (GenieMap's own "branded
  // catalog generator" feature). reportType gates which UI/generator runs;
  // everything else in WS_STATE (agent branding, language/color/title/logo,
  // reportClientName) is genuinely report-type-agnostic and stays shared.
  reportType:"valuation",offplanSelected:[],offplanSearch:""};
// The generated report is written via window.document.write(rawHtml) — any
// free-text field (client name, agent name/company/RERA, custom title,
// building name) interpolated in unescaped would execute as real HTML/JS in
// that print window the moment it's opened. Used on every user-typed string
// before it goes into generateReport()'s HTML string.
function _wsEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
var WS_REPORT_COLORS={gold:"#C9A84C",blue:"#3B82F6",green:"#22C55E",red:"#EF4444",purple:"#A78BFA"};
// Shared print-window head+style block — extracted 2026-08-05 (Phase 2) from
// generateReport() verbatim (byte-for-byte, verified via a before/after
// output diff before shipping) so the new Off-Plan Catalog generator below
// reuses the exact same look instead of a second, driftable CSS copy.
function _wsReportStyleBlock(title,isAr,accent){
  var h='<!DOCTYPE html><html dir="'+(isAr?"rtl":"ltr")+'" lang="'+(isAr?"ar":"en")+'"><head><meta charset="UTF-8"><title>'+_wsEsc(title)+'</title>';
  h+='<style>*{box-sizing:border-box}body{font-family:'+(isAr?"'Cairo',":"")+"Arial,sans-serif;max-width:800px;margin:0 auto;padding:30px;color:#333;background:#fff}";
  h+="h1{color:"+accent+";font-size:24px;margin-bottom:4px}";
  h+="h2{color:"+accent+";font-size:18px;margin-top:24px;border-bottom:2px solid "+accent+";padding-bottom:6px}";
  h+="table{width:100%;border-collapse:collapse;margin:10px 0}td,th{padding:8px 12px;border:1px solid #ddd;font-size:12px}th{background:#f5f5f5}";
  h+=".card{background:#f9f9f9;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin:10px 0}";
  h+=".metric{display:inline-block;padding:8px 16px;margin:4px;border-radius:6px;background:#f0f0f0;font-size:13px}";
  h+=".hdr{border-bottom:3px solid "+accent+";padding-bottom:14px;margin-bottom:14px}";
  h+=".accent{color:"+accent+"}.hi{background:"+accent+"18}@media print{body{padding:10px}}</style></head><body>";
  return h;
}
// Shared agent-branding header — same extraction, same verbatim guarantee.
// extraLines is an array of already-built (already-escaped) <p> HTML
// strings appended right after "Prepared for", for report-type-specific
// context (e.g. generateReport()'s "Property: ..." line).
function _wsReportHeaderHtml(title,isAr,agent,extraLines){
  var h='<div class="hdr">';
  if(WS_STATE.reportLogo)h+='<img src="'+WS_STATE.reportLogo+'" style="max-height:50px;margin-bottom:10px;display:block" />';
  h+="<h1>"+_wsEsc(title)+"</h1>";
  var agentLine=[agent.name,agent.company].filter(Boolean).map(_wsEsc).join(" · ");
  var agentLine2=[agent.phone,agent.rera?"RERA "+agent.rera:""].filter(Boolean).map(_wsEsc).join(" · ");
  if(agentLine)h+='<p style="font-size:13px;font-weight:bold;margin:4px 0">'+agentLine+"</p>";
  if(agentLine2)h+='<p style="font-size:12px;color:#555;margin:2px 0">'+agentLine2+"</p>";
  if(WS_STATE.reportClientName)h+='<p style="font-size:12px;color:#555;margin:8px 0 0">Prepared for: <strong>'+_wsEsc(WS_STATE.reportClientName)+"</strong></p>";
  (extraLines||[]).forEach(function(line){h+=line;});
  h+='<p style="color:#999;font-size:10px;margin-top:4px">'+new Date().toLocaleDateString()+"</p>";
  h+="</div>";
  return h;
}
try{var _ws=localStorage.getItem("dv_workspace");if(_ws){var d=JSON.parse(_ws);WS_STATE.widgets=d.widgets||[];}}catch(e){}
try{var _rt=localStorage.getItem("dv_report_templates");if(_rt)WS_STATE.templates=JSON.parse(_rt);}catch(e){}
try{var _ap=localStorage.getItem("dv_agent_profile");if(_ap)WS_STATE.agent=Object.assign(WS_STATE.agent,JSON.parse(_ap));}catch(e){}
function saveWS(){try{localStorage.setItem("dv_workspace",JSON.stringify({widgets:WS_STATE.widgets}));if(typeof portfolioChanged==="function")portfolioChanged();}catch(e){}}
function saveTemplates(){try{localStorage.setItem("dv_report_templates",JSON.stringify(WS_STATE.templates));}catch(e){}}
function saveAgentProfile(){try{localStorage.setItem("dv_agent_profile",JSON.stringify(WS_STATE.agent));}catch(e){}}

var WS_TOOLS=[
  {id:"portfolio",icon:"briefcase",label:"Portfolio Manager",desc:"Track assets, ROI & yield"},
  {id:"alerts",icon:"bell",label:"Opportunity Alerts",desc:"Hidden investment opportunities"},
  {id:"analyzer",icon:"search",label:"Valuation Analyzer",desc:"AI-powered valuation, yield & investment signal"},
  {id:"market",icon:"trending-up",label:"Market Index",desc:"347 areas ranked by yield, growth & value"},
  {id:"dashboard",icon:"radio",label:"Live Dashboard",desc:"Real-time market stats"},
  {id:"mortgage",icon:"landmark",label:"Mortgage Calculator",desc:"Monthly payments & costs"},
  {id:"deals",icon:"handshake",label:"Deal Network",desc:"Agent-to-agent deals & agent directory"},
  {id:"notifications",icon:"bell-ring",label:"Notifications",desc:"Activity alerts"},
  // "favareas"/"saved" added 2026-07-18 (Workspace Dashboard audit) — real,
  // already-persisted data (DV_SAVED.favAreas/searches, js/core.js) and
  // working preview code in getMiniWidget() below already existed for both,
  // but neither was ever offered as a pickable tool here — a genuine
  // input-completeness gap, not a design choice.
  {id:"favareas",icon:"star",label:"Favorite Areas",desc:"Your starred areas at a glance"},
  {id:"saved",icon:"history",label:"Saved Searches",desc:"Jump back into a past valuation"}
];

var WS_PRESETS={
  investor:{label:"Investor",icon:"trending-up",ids:["portfolio","alerts","analyzer","market"]},
  agent:{label:"Agent",icon:"users",ids:["deals","notifications","dashboard"]},
  buyer:{label:"Buyer",icon:"home",ids:["analyzer","market","mortgage"]}
};

// Note (2026-07-12): trimmed from 9 sections to 6, every one now backed by
// real computed data instead of a placeholder. Removed "Portfolio Overview"
// and "Opportunity Alerts" — both only ever pulled the AGENT's own personal
// PORTFOLIO_STATE, which doesn't belong in a report meant to be handed to a
// CLIENT about a specific property/deal (and silently rendered "No portfolio
// assets" for the many agents who don't track a personal portfolio at all).
// Merged the old "Market Comparison" and "Neighborhood Comparison" — both
// were the exact same unwired placeholder text under two different names.
var WS_REPORT_SECTIONS=[
  {id:"valuation",label:"Property Valuation Summary",icon:"search"},
  {id:"areastats",label:"Area Statistics",icon:"bar-chart-3"},
  {id:"marketcmp",label:"Area & Neighborhood Comparison",icon:"scale"},
  {id:"investment",label:"Investment Scenario (1/3/5yr)",icon:"trending-up"},
  {id:"mortgage",label:"Mortgage Estimate",icon:"landmark"},
  {id:"sustainability",label:"Sustainability Score",icon:"leaf"}
];

function renderWorkspace(){
  var cl=C();
  var wrap=div({padding:"16px 20px",maxWidth:"640px",margin:"0 auto",paddingBottom:"90px",boxSizing:"border-box",overflowX:"hidden"});
  // Premium header
  var _wsH=el('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',paddingBottom:'16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}});
  var _wsHL=el('div',{});
  _wsHL.appendChild(div({fontSize:'10px',color:'#6B7A9E',fontWeight:'700',fontFamily:"'Inter',sans-serif",letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:'4px'},'Tools & Reports'));
  _wsHL.appendChild(div({fontSize:'22px',fontWeight:'800',color:'#FFFFFF',fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'-0.02em',lineHeight:'1'},'My Workspace'));
  _wsH.appendChild(_wsHL);
  var _wsBadge=el('div',{style:{display:'flex',alignItems:'center',gap:'5px',background:'rgba(212,168,67,0.08)',border:'1px solid rgba(212,168,67,0.20)',borderRadius:'20px',padding:'5px 11px',flexShrink:'0'}});
  _wsBadge.appendChild(span({fontSize:'10px',color:'#D4A843',fontFamily:"'Space Grotesk',sans-serif",fontWeight:'700',letterSpacing:'0.08em'},'CUSTOM'));
  _wsH.appendChild(_wsBadge);
  wrap.appendChild(_wsH);

  // Mode toggle
  var modeBar=div({display:"flex",gap:"6px",marginBottom:"14px"});
  [{l:"Dashboard",v:"dashboard"},{l:"Report Builder",v:"report"}].forEach(function(m){
    var active=WS_STATE.mode===m.v;
    modeBar.appendChild(el("button",{style:{padding:"8px 16px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
      background:active?"rgba(201,168,76,0.15)":"transparent",color:active?cl.gold:cl.sub,border:"1px solid "+(active?"rgba(201,168,76,0.3)":cl.border)},
      onclick:function(){WS_STATE.mode=m.v;render();}},m.l));
  });
  wrap.appendChild(modeBar);

  if(WS_STATE.mode==="report")return renderReportBuilder(wrap,cl);

  // --- DASHBOARD ---
  if(!WS_STATE.widgets.length){
    // Welcome screen
    var welcome=div({background:"linear-gradient(135deg,rgba(201,168,76,0.06),transparent)",border:"1px solid "+cl.goldDim,borderRadius:"16px",padding:"30px 20px",textAlign:"center",marginBottom:"20px"});
    var _wsWelcomeIcon=el("div",{style:{marginBottom:"12px",display:"flex",justifyContent:"center"}});_wsWelcomeIcon.innerHTML='<i data-lucide="layout-dashboard" style="width:36px;height:36px;color:'+cl.gold+'"></i>';welcome.appendChild(_wsWelcomeIcon);
    welcome.appendChild(div({color:cl.gold,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Build Your Workspace"));
    welcome.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",marginBottom:"20px"},"Select tools below to create your personalized dashboard. Choose a preset or pick individually."));

    // Presets
    var presetRow=div({display:"flex",gap:"8px",justifyContent:"center",marginBottom:"16px"});
    Object.keys(WS_PRESETS).forEach(function(k){
      var p=WS_PRESETS[k];
      var btn=el("button",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",padding:"12px 18px",cursor:"pointer",textAlign:"center"}});
      var _pIcon=div({marginBottom:"4px",display:"flex",justifyContent:"center"});_pIcon.innerHTML='<i data-lucide="'+p.icon+'" style="width:20px;height:20px;color:'+cl.gold+'"></i>';btn.appendChild(_pIcon);
      btn.appendChild(div({color:cl.gold,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},p.label));
      btn.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},p.ids.length+" tools"));
      btn.addEventListener("click",function(){WS_STATE.widgets=p.ids.slice();saveWS();render();});
      presetRow.appendChild(btn);
    });
    welcome.appendChild(presetRow);
    wrap.appendChild(welcome);
  }

  // Tool selector (always show)
  var selCard=div({background:cl.surface,backdropFilter:cl.blur,WebkitBackdropFilter:cl.blur,border:"1px solid "+cl.border,borderRadius:"14px",padding:"14px 16px",marginBottom:"14px",boxShadow:cl.glassShadow});
  selCard.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"10px"},"Available Tools"));
  var toolGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",overflow:"hidden"}});
  WS_TOOLS.forEach(function(t){
    var inWS=WS_STATE.widgets.indexOf(t.id)!==-1;
    var tc=el("div",{style:{background:inWS?hexAlpha(cl.gold,0.06):"rgba(240,242,245,0.03)",border:"1px solid "+(inWS?cl.goldDim:cl.border),borderRadius:"10px",padding:"10px",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",transition:"all 0.2s",minWidth:"0",overflow:"hidden"}});
    var _tIcon=span({flexShrink:"0",display:"flex",alignItems:"center"});_tIcon.innerHTML='<i data-lucide="'+t.icon+'" style="width:16px;height:16px;color:'+(inWS?cl.gold:cl.sub)+'"></i>';tc.appendChild(_tIcon);
    var info=el("div",{style:{flex:"1",minWidth:"0"}});
    info.appendChild(div({color:inWS?cl.gold:cl.subHi,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},t.label));
    info.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},t.desc));
    tc.appendChild(info);
    var actBtn=el("button",{style:{background:inWS?"rgba(239,68,68,0.1)":hexAlpha(cl.gold,0.12),border:"none",color:inWS?"#EF4444":cl.gold,width:"24px",height:"24px",borderRadius:"50%",cursor:"pointer",fontSize:"14px",fontWeight:"700",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:"0"}});
    actBtn.textContent=inWS?"×":"+";
    actBtn.addEventListener("click",function(e){
      e.stopPropagation();
      if(inWS)WS_STATE.widgets=WS_STATE.widgets.filter(function(w){return w!==t.id;});
      else WS_STATE.widgets.push(t.id);
      saveWS();render();
    });
    tc.appendChild(actBtn);
    toolGrid.appendChild(tc);
  });
  selCard.appendChild(toolGrid);
  wrap.appendChild(selCard);

  // Active widgets with reorder
  if(WS_STATE.widgets.length>0){
    var orderCard=div({background:cl.surface,backdropFilter:cl.blur,WebkitBackdropFilter:cl.blur,border:"1px solid "+cl.border,borderRadius:"14px",padding:"14px 16px",marginBottom:"14px",boxShadow:cl.glassShadow});
    orderCard.appendChild(span({color:cl.gold,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"10px"},"◆ Your Workspace · "+WS_STATE.widgets.length+" tools"));
    WS_STATE.widgets.forEach(function(wid,idx){
      var tool=WS_TOOLS.find(function(t){return t.id===wid;});if(!tool)return;
      var row=div({display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",background:cl.raised,borderRadius:"8px",marginBottom:"4px"});
      var _wIcon=span({display:"flex",alignItems:"center"});_wIcon.innerHTML='<i data-lucide="'+tool.icon+'" style="width:14px;height:14px;color:'+cl.gold+'"></i>';row.appendChild(_wIcon);
      row.appendChild(span({color:cl.subHi,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",flex:"1"},tool.label));
      if(idx>0){var upBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,width:"22px",height:"22px",borderRadius:"4px",cursor:"pointer",fontSize:"10px",display:"flex",alignItems:"center",justifyContent:"center"}});upBtn.textContent="↑";
        (function(i){upBtn.addEventListener("click",function(){var tmp=WS_STATE.widgets[i-1];WS_STATE.widgets[i-1]=WS_STATE.widgets[i];WS_STATE.widgets[i]=tmp;saveWS();render();});})(idx);row.appendChild(upBtn);}
      if(idx<WS_STATE.widgets.length-1){var dnBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,width:"22px",height:"22px",borderRadius:"4px",cursor:"pointer",fontSize:"10px",display:"flex",alignItems:"center",justifyContent:"center"}});dnBtn.textContent="↓";
        (function(i){dnBtn.addEventListener("click",function(){var tmp=WS_STATE.widgets[i+1];WS_STATE.widgets[i+1]=WS_STATE.widgets[i];WS_STATE.widgets[i]=tmp;saveWS();render();});})(idx);row.appendChild(dnBtn);}
      orderCard.appendChild(row);
    });
    wrap.appendChild(orderCard);

    // Mini widget dashboard
    var dashGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",overflow:"hidden"}});
    WS_STATE.widgets.forEach(function(wid){
      var tool=WS_TOOLS.find(function(t){return t.id===wid;});if(!tool)return;
      var card=el("div",{style:{background:"linear-gradient(135deg,rgba(201,168,76,0.04),transparent)",border:"1px solid "+cl.border,borderRadius:"12px",padding:"14px",cursor:"pointer",transition:"border-color 0.2s"}});
      card.addEventListener("mouseenter",function(){this.style.borderColor=cl.gold;});
      card.addEventListener("mouseleave",function(){this.style.borderColor=cl.border;});
      card.appendChild(div({display:"flex",alignItems:"center",gap:"6px",marginBottom:"8px"},[
        (function(){var _mIcon=span({display:"flex",alignItems:"center"});_mIcon.innerHTML='<i data-lucide="'+tool.icon+'" style="width:16px;height:16px;color:'+cl.gold+'"></i>';return _mIcon;})(),
        span({color:cl.gold,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},tool.label)]));

      // Mini widget content
      var miniContent=getMiniWidget(wid,cl);
      if(miniContent)card.appendChild(miniContent);

      var tabMap={portfolio:["Portfolio","Assets"],alerts:["Portfolio","Alerts"],market:["Market","Index"],dashboard:["Market","Dashboard"],analyzer:["Market","Analyzer"],mortgage:["Market","Analyzer"],deals:["Network","Deals"],notifications:null,favareas:["Market","Index"],saved:["Market","Analyzer"]};
      var targetNav=tabMap[wid];
      if(targetNav)card.addEventListener("click",function(){
        // The "Saved Searches" card promises to show WS_STATE's saved
        // searches list — but that list only renders when
        // analyzerState.stage===0 (js/market.js). If the user had left the
        // Analyzer mid-flow (e.g. stage 2, showing a result) before coming
        // to Workspace, clicking this specific card would silently land on
        // the stale result screen instead of the list it advertised. The
        // generic "analyzer" tool intentionally leaves stage untouched
        // (resuming whatever was there is the expected, existing behavior
        // everywhere else this tab is reached) — only this dedicated
        // shortcut needs the reset, so it's scoped to wid==="saved" alone.
        if(wid==="saved")analyzerState.stage=0;
        setSection(targetNav[0],targetNav[1]);
      });
      // "Notifications" showed a real unread count but was the only card
      // with zero click behavior at all — every other card either navigates
      // or (for cards not yet special-cased) at least shows "Click to open
      // →" honestly. Wired to the same DV_NOTIF.showPanel toggle the header
      // bell itself uses (js/core.js renderNotifBell()), so this card now
      // genuinely opens the real notification dropdown instead of doing
      // nothing.
      else if(wid==="notifications")card.addEventListener("click",function(){DV_NOTIF.showPanel=true;render();});
      dashGrid.appendChild(card);
    });
    wrap.appendChild(dashGrid);
  }

  var tourRow2=div({display:"flex",gap:"8px",justifyContent:"center",marginTop:"24px",flexWrap:"wrap"});
  var tq2=el("button",{style:{background:"transparent",border:"1px solid "+cl.gold,color:cl.gold,padding:"9px 18px",borderRadius:"10px",fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  tq2.textContent="Quick Tour (8)";
  tq2.addEventListener("click",function(){try{localStorage.removeItem("dv_tour_done");}catch(e){}startTour("quick");});
  var tf2=el("button",{style:{background:"linear-gradient(135deg,"+cl.gold+",#7A5E28)",border:"none",color:"#08090C",padding:"9px 18px",borderRadius:"10px",fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  tf2.textContent="Full Tour (16)";
  tf2.addEventListener("click",function(){try{localStorage.removeItem("dv_full_tour_done");}catch(e){}startTour("full");});
  tourRow2.appendChild(tq2);tourRow2.appendChild(tf2);
  wrap.appendChild(tourRow2);

  return wrap;
}

function getMiniWidget(wid,cl){
  var w=el("div",{});
  if(wid==="portfolio"){
    var ps=window.PORTFOLIO_STATE;
    if(ps&&ps.assets.length>0){
      var metrics=ps.assets.map(function(a){return Object.assign({},a,{m:computeAssetMetrics(a)});});
      var tv=metrics.reduce(function(s,a){return s+a.m.currentValue;},0);
      var tp=metrics.reduce(function(s,a){return s+a.m.purchasePrice;},0);
      var roi=tp>0?((tv-tp)/tp*100):0;
      w.appendChild(div({color:cl.text,fontSize:"15px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+tv.toLocaleString()));
      w.appendChild(div({color:roi>=0?"#22C55E":"#EF4444",fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},(roi>=0?"+":"")+roi.toFixed(1)+"% ROI"));
      w.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},ps.assets.length+" assets"));
    }else w.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},"No assets yet"));
  }else if(wid==="dashboard"){
    var aKeys=Object.keys(AREAS);var cnt=aKeys.length;var sumP=0,sumY=0;
    aKeys.forEach(function(k){var a=AREAS[k];sumP+=a.psf||0;if(a.y)sumY+=(a.y[0]+a.y[1])/2;});
    w.appendChild(div({color:cl.text,fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+Math.round(sumP/cnt).toLocaleString()+" avg PSF"));
    w.appendChild(div({color:"#22C55E",fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},(sumY/cnt).toFixed(1)+"% avg yield"));
    w.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},cnt+" areas · "+Object.keys(DB).length+" buildings"));
  }else if(wid==="market"){
    // Previously byte-identical to "dashboard" (both showed the exact same
    // avg-PSF/avg-yield aggregate) despite being two genuinely different
    // tools — Market Index's own real value is its RANKING tables (Highest
    // Yield/Fastest Growing/Most Expensive), not a plain average already
    // shown by Live Dashboard's own card. Surfaces the actual #1 area by
    // yield instead, matching what this tab is actually for.
    var _mKeys=Object.keys(AREAS);var topArea=null,topYield=-1;
    _mKeys.forEach(function(k){var a=AREAS[k];if(!a||!a.y)return;var y=(a.y[0]+a.y[1])/2;if(y>topYield){topYield=y;topArea=k;}});
    if(topArea){
      w.appendChild(div({color:cl.text,fontSize:"13px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},topArea));
      w.appendChild(div({color:"#22C55E",fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},topYield.toFixed(1)+"% yield · #1 area"));
      w.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},_mKeys.length+" areas ranked"));
    }else w.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},"Rankings unavailable"));
  }else if(wid==="alerts"){
    // Previously fell through to the generic "Click to open →" catch-all
    // despite real, already-persisted alert criteria (dv_alerts) being
    // trivially available — the same completeness gap as favareas/saved.
    var _al=[];try{_al=JSON.parse(localStorage.getItem("dv_alerts")||"[]");}catch(e){}
    w.appendChild(div({color:_al.length>0?cl.gold:cl.sub,fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},_al.length+" alert"+(_al.length!==1?"s":"")+" set"));
    if(_al.length>0)w.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},"Scanning "+Object.keys(DB).length.toLocaleString()+" buildings"));
  }
  // "deals" (Deal Network) mini-widget removed 2026-07-18: it read
  // DEAL_STATE.deals.length, but DEAL_STATE is a backward-compat shell now
  // that Deal Board is the OFM blind-matching system — that field was never
  // declared, so adding "Deal Network" to a custom Workspace Dashboard
  // crashed the entire app the moment this function ran (a genuine,
  // confirmed, easily-reachable bug, found while auditing Reports).
  // OFM listings are deliberately not publicly countable (privacy-by-design
  // blind matching), so there's no honest "N active deals" stat to show
  // here anymore — falls through to the generic "Click to open →" catch-all
  // below instead of showing fabricated/broken data.
  else if(wid==="notifications"){
    var uc=getUnreadCount();
    w.appendChild(div({color:uc>0?cl.gold:cl.sub,fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},uc+" unread"));
  }else if(wid==="favareas"){
    w.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},DV_SAVED.favAreas.length+" areas saved"));
    if(DV_SAVED.favAreas.length>0)w.appendChild(div({color:cl.subHi,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},DV_SAVED.favAreas.slice(0,3).join(", ")+(DV_SAVED.favAreas.length>3?" +more":"")));
  }else if(wid==="saved"){
    w.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},DV_SAVED.searches.length+" saved searches"));
  }else{
    w.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},"Click to open →"));
  }
  return w;
}

// --- REPORT BUILDER ---
function renderReportBuilder(wrap,cl){
  var card=div({background:cl.surface,backdropFilter:cl.blur,WebkitBackdropFilter:cl.blur,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px",boxShadow:cl.glassShadow});
  card.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"◆ Custom Report Builder"),
    span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Visual · Text · Voice")]));

  // Report Type — added 2026-08-05 (Phase 2 of the GenieMap gap-closing
  // plan): a 2nd report shape, a branded multi-project off-plan catalog,
  // alongside the original single-property valuation report. Everything
  // below this toggle branches on it; "Your Details"/"Report Settings"
  // (agent branding, language/color/title/logo) stay unconditional further
  // down since they're genuinely report-type-agnostic.
  var rtBar=div({display:"flex",gap:"6px",marginBottom:"14px"});
  [{l:"Property Report",v:"valuation"},{l:"Off-Plan Catalog",v:"offplan"},{l:"Area Executive Report",v:"area"}].forEach(function(rt){
    var active=WS_STATE.reportType===rt.v;
    rtBar.appendChild(el("button",{style:{flex:"1",padding:"9px",borderRadius:"9px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
      background:active?"linear-gradient(135deg,"+cl.gold+",#7A5E28)":"transparent",color:active?"#08090C":cl.sub,border:"1px solid "+(active?cl.gold:cl.border)},
      onclick:function(){WS_STATE.reportType=rt.v;render();}},rt.l));
  });
  card.appendChild(rtBar);

  if(WS_STATE.reportType==="valuation"){

  // Mode tabs
  var rmBar=div({display:"flex",gap:"6px",marginBottom:"14px"});
  [{l:"Visual Builder",v:"visual"},{l:"Smart Text",v:"text"},{l:"Voice",v:"voice"}].forEach(function(m){
    var active=WS_STATE.reportMode===m.v;
    rmBar.appendChild(el("button",{style:{flex:"1",padding:"8px",borderRadius:"8px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
      background:active?hexAlpha(cl.gold,0.12):"transparent",color:active?cl.gold:cl.sub,border:"1px solid "+(active?cl.goldDim:cl.border)},
      onclick:function(){WS_STATE.reportMode=m.v;render();}},m.l));
  });
  card.appendChild(rmBar);

  // Report Subject — binds the report to an actual property/area/client
  // instead of generating generic, unpersonalized content. This is what
  // makes the output look like a report an agent prepared for a specific
  // deal, not a random data dump.
  var subjCard=div({marginBottom:"14px"});
  var subjHdr=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"});
  subjHdr.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Report Subject"));
  // Repeatable-workflow gap: an agent generating reports for MULTIPLE
  // different clients/properties in one sitting had no way to clear the
  // per-report subject fields (area/client/price/building/nationality)
  // without manually re-touching each one — everything else (agent's own
  // details, section selection, language/color/title/logo) correctly stays
  // put across reports since those genuinely don't change per-client, but
  // the subject fields DO and previously lingered from the last report.
  var newReportBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"3px 10px",borderRadius:"6px",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  newReportBtn.textContent="↺ New Report";
  newReportBtn.addEventListener("click",function(){
    WS_STATE.reportArea="";WS_STATE.reportClientName="";WS_STATE.reportPrice="";WS_STATE.reportBuilding="";WS_STATE.reportNationality="expat";
    render();
  });
  subjHdr.appendChild(newReportBtn);
  subjCard.appendChild(subjHdr);
  // Falls back to the loaded Analyzer valuation's own area, same non-
  // mutating pattern the price field below already uses — previously only
  // price did this, so a user who'd just run the Analyzer and came
  // straight here saw their price pre-filled but NOT their area, meaning
  // Area Statistics/Comparison/Investment/Sustainability either fell back
  // to generic market-wide data or a stale area left over from a
  // completely different report, while the Valuation Summary section
  // above them correctly showed the real property — an internally
  // inconsistent report about "your property" that didn't actually
  // reflect its own area.
  var effReportArea=WS_STATE.reportArea||(analyzerState&&analyzerState.f&&analyzerState.f.area)||"";
  var areaSel=el("select",{style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"9px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"8px"}});
  areaSel.appendChild(el("option",{value:""},"Select area (for stats, comparison, investment & mortgage sections)"));
  Object.keys(AREAS).sort().forEach(function(a){
    var opt=el("option",{value:a},a);
    if(a===effReportArea)opt.selected=true;
    areaSel.appendChild(opt);
  });
  areaSel.addEventListener("change",function(){WS_STATE.reportArea=this.value;render();});
  subjCard.appendChild(areaSel);

  var subjRow=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"});
  var clientInp=el("input",{type:"text",placeholder:"Client name (optional)",
    style:{background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"9px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
  clientInp.value=WS_STATE.reportClientName||"";
  clientInp.addEventListener("input",function(){WS_STATE.reportClientName=this.value;});
  subjRow.appendChild(clientInp);
  // Falls back to a loaded Analyzer valuation's building, same non-mutating
  // pattern as area/price — previously the ONLY way a report could
  // reference a specific building at all (for the Sustainability Score
  // lookup, or just showing the property name in the header) was if the
  // user had already run a full Analyzer valuation this session. A
  // "Custom Report Builder" that can't name a building unless another tab
  // happened to be used first isn't living up to its own name — this makes
  // building-specific reports possible standalone.
  var effReportBuilding=WS_STATE.reportBuilding||(analyzerState&&analyzerState.f&&analyzerState.f.building)||"";
  var buildingInp=el("input",{type:"text",placeholder:"Building name (optional)",
    style:{background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"9px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
  buildingInp.value=effReportBuilding;
  buildingInp.addEventListener("input",function(){WS_STATE.reportBuilding=this.value;});
  subjRow.appendChild(buildingInp);
  subjCard.appendChild(subjRow);

  var priceInp=el("input",{type:"number",placeholder:"Property price AED (for mortgage/investment)",
    style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"9px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"8px"}});
  priceInp.value=WS_STATE.reportPrice||(analyzerState&&analyzerState.f&&analyzerState.f.price)||"";
  priceInp.addEventListener("input",function(){WS_STATE.reportPrice=this.value;});
  subjCard.appendChild(priceInp);

  // Buyer nationality — feeds the Mortgage Estimate section's LTV/down-
  // payment calc below (see the comment at that section: this used to
  // always assume expat LTV tiers regardless of who the buyer actually is,
  // which understates a real UAE national buyer's borrowing power).
  var natRow=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"});
  natRow.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"Buyer:"));
  [{l:"Expat",v:"expat"},{l:"UAE National",v:"uae"}].forEach(function(nt){
    var active=WS_STATE.reportNationality===nt.v;
    natRow.appendChild(el("button",{style:{padding:"5px 12px",borderRadius:"6px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",border:"1px solid "+(active?cl.gold:cl.border),background:active?hexAlpha(cl.gold,0.12):"transparent",color:active?cl.gold:cl.sub},
      onclick:function(){WS_STATE.reportNationality=nt.v;render();}},nt.l));
  });
  subjCard.appendChild(natRow);

  if(typeof analyzerState!=="undefined"&&analyzerState.val){
    subjCard.appendChild(div({background:hexAlpha("#22C55E",0.08),border:"1px solid "+hexAlpha("#22C55E",0.25),borderRadius:"8px",padding:"8px 10px",color:"#22C55E",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},
      "✓ Valuation loaded: "+(analyzerState.f.building||"")+" "+analyzerState.f.area+" — the Property Valuation Summary section will use this."));
  }else{
    subjCard.appendChild(div({background:hexAlpha("#F59E0B",0.08),border:"1px solid "+hexAlpha("#F59E0B",0.25),borderRadius:"8px",padding:"8px 10px",color:"#F59E0B",fontSize:"10px",fontFamily:"'Inter',sans-serif"},
      "No valuation loaded — run the Analyzer for this property first to include a Property Valuation Summary."));
  }
  card.appendChild(subjCard);

  // Your Details — agent's own branding, shown prominently in the report
  // header so it reads as prepared BY the agent, not just by DubAIVal.
  var agentCard=div({marginBottom:"14px"});
  agentCard.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"8px"},"Your Details (shown on the report)"));
  var agentGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
  [["name","Your name"],["phone","Phone / WhatsApp"],["company","Agency / company"],["rera","RERA number (optional)"]].forEach(function(f){
    var fi=el("input",{type:"text",placeholder:f[1],
      style:{background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"9px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
    fi.value=WS_STATE.agent[f[0]]||"";
    fi.addEventListener("input",function(){WS_STATE.agent[f[0]]=this.value;saveAgentProfile();});
    agentGrid.appendChild(fi);
  });
  agentCard.appendChild(agentGrid);
  card.appendChild(agentCard);

  // Saved templates
  if(WS_STATE.templates.length>0){
    var tplRow=div({display:"flex",gap:"6px",overflowX:"auto",marginBottom:"12px",paddingBottom:"4px"});
    WS_STATE.templates.forEach(function(tpl,idx){
      var chip=el("div",{style:{display:"flex",alignItems:"center",gap:"4px",background:hexAlpha(cl.gold,0.08),border:"1px solid "+cl.goldDim,borderRadius:"16px",padding:"4px 10px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:"0"}});
      chip.appendChild(span({color:cl.gold,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},tpl.name));
      var xb=el("button",{style:{background:"transparent",border:"none",color:cl.sub,fontSize:"10px",cursor:"pointer",padding:"0"}});xb.textContent="×";
      xb.addEventListener("click",function(e){e.stopPropagation();WS_STATE.templates.splice(idx,1);saveTemplates();render();});
      chip.appendChild(xb);
      chip.addEventListener("click",function(){
        WS_STATE.reportSections=tpl.sections.slice();WS_STATE.reportLang=tpl.lang||"en";WS_STATE.reportColor=tpl.color||"gold";WS_STATE.reportTitle=tpl.title||"";render();
      });
      tplRow.appendChild(chip);
    });
    card.appendChild(tplRow);
  }

  if(WS_STATE.reportMode==="text"||WS_STATE.reportMode==="voice"){
    // Smart Text input
    if(!window._wsTextInp)window._wsTextInp="";
    var textRow=div({display:"flex",gap:"8px",marginBottom:"12px"});
    var textInp=el("input",{type:"text",placeholder:"e.g. valuation + market + portfolio, arabic, blue",
      style:{flex:"1",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"10px 14px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none"}});
    textInp.value=window._wsTextInp||WS_STATE.voiceText||"";
    textInp.addEventListener("input",function(){window._wsTextInp=this.value;WS_STATE.parsed=false;});
    textRow.appendChild(textInp);
    var parseBtn=el("button",{style:{background:"linear-gradient(135deg,"+cl.gold+",#7A5E28)",color:"#08090C",border:"none",padding:"10px 16px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    parseBtn.textContent="Parse";
    parseBtn.addEventListener("click",function(){
      var txt=(window._wsTextInp||WS_STATE.voiceText||"").toLowerCase();
      var secs=[];
      // 4 different synonym keywords ("market"/"comparison"/"neighborhood"/
      // "neighbourhood") all map to the same "marketcmp" section — a
      // completely natural phrase like "market comparison report" (matching
      // this very field's own placeholder style) matched 2+ of them at
      // once, pushing "marketcmp" onto secs more than once and rendering
      // that whole section TWICE in the generated report. Deduped below.
      var kwMap={valuation:"valuation",area:"areastats",market:"marketcmp",comparison:"marketcmp",neighborhood:"marketcmp",neighbourhood:"marketcmp",investment:"investment",mortgage:"mortgage",sustainability:"sustainability"};
      Object.keys(kwMap).forEach(function(kw){if(txt.indexOf(kw)!==-1&&secs.indexOf(kwMap[kw])===-1)secs.push(kwMap[kw]);});
      if(secs.length===0)secs=["valuation"];
      WS_STATE.reportSections=secs;
      if(txt.indexOf("arabic")!==-1||txt.indexOf("عربي")!==-1||txt.indexOf("عربية")!==-1)WS_STATE.reportLang="ar";else WS_STATE.reportLang="en";
      ["blue","red","green","purple","gold"].forEach(function(c){if(txt.indexOf(c)!==-1)WS_STATE.reportColor=c;});
      WS_STATE.parsed=true;render();
    });
    textRow.appendChild(parseBtn);
    card.appendChild(textRow);

    if(WS_STATE.parsed){
      var secNames=WS_STATE.reportSections.map(function(sid){var s=WS_REPORT_SECTIONS.find(function(x){return x.id===sid;});return s?s.label:sid;});
      card.appendChild(div({background:hexAlpha("#22C55E",0.08),border:"1px solid "+hexAlpha("#22C55E",0.25),borderRadius:"8px",padding:"10px",marginBottom:"12px",color:"#22C55E",fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},"✓ Parsed: "+secNames.join(", ")+" — Language: "+(WS_STATE.reportLang==="ar"?"AR":"EN")+" — Color: "+WS_STATE.reportColor+". Click Generate below."));
    }

    // Voice section
    if(WS_STATE.reportMode==="voice"){
      var voiceWrap=div({textAlign:"center",padding:"16px 0",marginBottom:"12px"});
      voiceWrap.appendChild(createVoiceMic("_voice_ws_report",function(txt){
        WS_STATE.voiceText=txt;window._wsTextInp=txt;render();
      }));
      if(WS_STATE.voiceText){voiceWrap.appendChild(div({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginTop:"8px",fontStyle:"italic"},'"'+WS_STATE.voiceText+'"'));}
      card.appendChild(voiceWrap);
    }
  }

  // Visual Builder — checkboxes always visible
  var secCard=div({marginBottom:"14px"});
  secCard.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"8px"},"Report Sections"));
  WS_REPORT_SECTIONS.forEach(function(sec,idx){
    var checked=WS_STATE.reportSections.indexOf(sec.id)!==-1;
    var row=div({display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",background:checked?hexAlpha(cl.gold,0.06):"transparent",border:"1px solid "+(checked?cl.goldDim:cl.border),borderRadius:"8px",marginBottom:"4px",cursor:"pointer"});
    var cb=el("input",{type:"checkbox",style:{accentColor:cl.gold}});cb.checked=checked;
    cb.addEventListener("change",function(){
      if(this.checked){if(WS_STATE.reportSections.indexOf(sec.id)===-1)WS_STATE.reportSections.push(sec.id);}
      else WS_STATE.reportSections=WS_STATE.reportSections.filter(function(s){return s!==sec.id;});
      render();
    });
    row.appendChild(cb);
    var _sIcon=span({display:"flex",alignItems:"center"});_sIcon.innerHTML='<i data-lucide="'+sec.icon+'" style="width:14px;height:14px;color:'+(checked?cl.gold:cl.sub)+'"></i>';row.appendChild(_sIcon);
    row.appendChild(span({color:checked?cl.gold:cl.subHi,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",flex:"1"},sec.label));
    // Reorder buttons
    if(checked){
      var si=WS_STATE.reportSections.indexOf(sec.id);
      if(si>0){var ub=el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,width:"20px",height:"20px",borderRadius:"4px",cursor:"pointer",fontSize:"9px"}});ub.textContent="↑";
        (function(sid){ub.addEventListener("click",function(e){e.stopPropagation();var i=WS_STATE.reportSections.indexOf(sid);if(i>0){var t=WS_STATE.reportSections[i-1];WS_STATE.reportSections[i-1]=WS_STATE.reportSections[i];WS_STATE.reportSections[i]=t;render();}});})(sec.id);row.appendChild(ub);}
      if(si<WS_STATE.reportSections.length-1){var db=el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,width:"20px",height:"20px",borderRadius:"4px",cursor:"pointer",fontSize:"9px"}});db.textContent="↓";
        (function(sid){db.addEventListener("click",function(e){e.stopPropagation();var i=WS_STATE.reportSections.indexOf(sid);if(i<WS_STATE.reportSections.length-1){var t=WS_STATE.reportSections[i+1];WS_STATE.reportSections[i+1]=WS_STATE.reportSections[i];WS_STATE.reportSections[i]=t;render();}});})(sec.id);row.appendChild(db);}
    }
    row.addEventListener("click",function(e){if(e.target.tagName!=="INPUT"&&e.target.tagName!=="BUTTON")cb.click();});
    secCard.appendChild(row);
  });
  card.appendChild(secCard);

  }else if(WS_STATE.reportType==="offplan"){
    // Off-Plan Catalog picker — pick real, tracked off-plan projects (the
    // same data + forecast engine Phase 1's Off-Plan Projects tab/map
    // already uses) to build one branded, client-facing document combining
    // several launches, matching GenieMap's own "branded catalog generator"
    // feature. Deliberately reuses OFFPLAN_STATE directly rather than a
    // separate fetch — safe cross-file reference despite js/offplan.js
    // loading earlier in index.html's script order, since this only ever
    // runs after every deferred module has finished loading (same pattern
    // already established elsewhere, e.g. this file's own Sustainability
    // Score section calling lookupBuilding()/computeSustainabilityScore()).
    if(typeof OFFPLAN_STATE!=="undefined"&&!OFFPLAN_STATE.loaded&&!OFFPLAN_STATE.loading&&typeof offplanLoad==="function")offplanLoad();

    var opCard=div({marginBottom:"14px"});
    var opHdr=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"});
    opHdr.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Select Off-Plan Projects"));
    var opClearBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"3px 10px",borderRadius:"6px",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    opClearBtn.textContent="↺ Clear Selection";
    opClearBtn.addEventListener("click",function(){WS_STATE.offplanSelected=[];WS_STATE.offplanSearch="";render();});
    opHdr.appendChild(opClearBtn);
    opCard.appendChild(opHdr);

    var opDesc=div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",marginBottom:"10px"},
      "Pick real, tracked off-plan projects to combine into one branded catalog for a client — each shows its full launch → handover → +5yr forecast.");
    opCard.appendChild(opDesc);

    // Client name — the one Report Subject field genuinely relevant to a
    // catalog too ("Prepared for: ..."); area/building/price/nationality
    // (valuation-only) are intentionally NOT shown here.
    var opClientInp=el("input",{type:"text",placeholder:"Client name (optional)",
      style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"9px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"10px"}});
    opClientInp.value=WS_STATE.reportClientName||"";
    opClientInp.addEventListener("input",function(){WS_STATE.reportClientName=this.value;});
    opCard.appendChild(opClientInp);

    if(typeof OFFPLAN_STATE==="undefined"||OFFPLAN_STATE.loading){
      opCard.appendChild(div({color:cl.sub,fontSize:"11px",textAlign:"center",padding:"20px 0"},"Loading tracked projects…"));
    }else if(OFFPLAN_STATE.dbError){
      opCard.appendChild(div({background:hexAlpha("#F59E0B",0.08),border:"1px solid "+hexAlpha("#F59E0B",0.25),borderRadius:"8px",padding:"10px",color:"#F59E0B",fontSize:"11px",fontFamily:"'Inter',sans-serif"},
        "Off-Plan data isn't available yet — this feature is still being set up."));
    }else if(!OFFPLAN_STATE.projects.length){
      opCard.appendChild(div({background:hexAlpha("#F59E0B",0.08),border:"1px solid "+hexAlpha("#F59E0B",0.25),borderRadius:"8px",padding:"10px",color:"#F59E0B",fontSize:"11px",fontFamily:"'Inter',sans-serif"},
        "No off-plan projects tracked yet — add or submit some in Market → Off-Plan first."));
    }else{
      var opSearchInp=el("input",{type:"text",placeholder:"Filter by name, developer, or area…",
        style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"8px 12px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"8px"}});
      opSearchInp.value=WS_STATE.offplanSearch||"";
      opSearchInp.addEventListener("input",function(){WS_STATE.offplanSearch=this.value;render();});
      opCard.appendChild(opSearchInp);

      var q=(WS_STATE.offplanSearch||"").toLowerCase();
      var opMatches=OFFPLAN_STATE.projects.filter(function(p){
        if(!q)return true;
        return (p.name||"").toLowerCase().indexOf(q)!==-1||(p.developer||"").toLowerCase().indexOf(q)!==-1||(p.area||"").toLowerCase().indexOf(q)!==-1;
      });

      var opSelBar=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"});
      opSelBar.appendChild(span({color:cl.gold,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},WS_STATE.offplanSelected.length+" of "+OFFPLAN_STATE.projects.length+" project(s) selected"));
      var opSelAllBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.goldDim,color:cl.gold,padding:"3px 10px",borderRadius:"6px",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
      opSelAllBtn.textContent="Select All ("+opMatches.length+" visible)";
      opSelAllBtn.addEventListener("click",function(){
        opMatches.forEach(function(p){if(WS_STATE.offplanSelected.indexOf(p.id)===-1)WS_STATE.offplanSelected.push(p.id);});
        render();
      });
      opSelBar.appendChild(opSelAllBtn);
      opCard.appendChild(opSelBar);

      var opList=div({maxHeight:"340px",overflowY:"auto",border:"1px solid "+cl.border,borderRadius:"10px",padding:"6px"});
      if(!opMatches.length){
        opList.appendChild(div({color:cl.sub,fontSize:"11px",textAlign:"center",padding:"14px 0"},"No projects match this filter."));
      }
      opMatches.forEach(function(p){
        var checked=WS_STATE.offplanSelected.indexOf(p.id)!==-1;
        var minPsf=(typeof _offplanMinPSF==="function")?_offplanMinPSF(p):null;
        var stageColor=(typeof OFFPLAN_STAGE_COLORS!=="undefined"&&OFFPLAN_STAGE_COLORS[p.project_stage])||cl.sub;
        var stageLabel=(typeof OFFPLAN_STAGE_LABELS!=="undefined"&&OFFPLAN_STAGE_LABELS[p.project_stage])||p.project_stage||"";
        var row=div({display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",background:checked?hexAlpha(cl.gold,0.06):"transparent",border:"1px solid "+(checked?cl.goldDim:cl.border),borderRadius:"8px",marginBottom:"4px",cursor:"pointer"});
        var cb=el("input",{type:"checkbox",style:{accentColor:cl.gold,flexShrink:"0"}});cb.checked=checked;
        cb.addEventListener("change",function(){
          if(this.checked){if(WS_STATE.offplanSelected.indexOf(p.id)===-1)WS_STATE.offplanSelected.push(p.id);}
          else WS_STATE.offplanSelected=WS_STATE.offplanSelected.filter(function(id){return id!==p.id;});
          render();
        });
        row.appendChild(cb);
        var info=div({flex:"1",minWidth:"0"});
        info.appendChild(div({color:checked?cl.gold:cl.subHi,fontSize:"11.5px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},p.name));
        info.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},p.developer+" · "+p.area+(minPsf?" · from AED "+Math.round(minPsf).toLocaleString()+"/sqft":"")));
        row.appendChild(info);
        row.appendChild(div({background:hexAlpha(stageColor,0.12),border:"1px solid "+hexAlpha(stageColor,0.3),borderRadius:"8px",padding:"3px 8px",fontSize:"9px",fontWeight:"700",color:stageColor,fontFamily:"'Space Grotesk',monospace",whiteSpace:"nowrap",flexShrink:"0"},stageLabel));
        row.addEventListener("click",function(e){if(e.target.tagName!=="INPUT")cb.click();});
        opList.appendChild(row);
      });
      opCard.appendChild(opList);
    }
    card.appendChild(opCard);
  }else{
    // Area Executive Report picker — pick ONE real, tracked area (any of
    // the 347 in AREAS, with the 30 curated AREA_REPORT_FEATURED areas
    // surfaced as quick-pick chips) to generate a real market-intelligence
    // report from computeAreaExecutiveReportData()/_areaReportHtml() above.
    var arCard=div({marginBottom:"14px"});
    arCard.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"8px"},"Select an Area"));
    arCard.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",marginBottom:"10px"},
      "Generates a real, branded market-intelligence report for one area — market snapshot, price & rent by unit type, top buildings, and location intelligence, all from DubaiVal's own tracked data."));

    var arClientInp=el("input",{type:"text",placeholder:"Client name (optional)",
      style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"9px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"10px"}});
    arClientInp.value=WS_STATE.reportClientName||"";
    arClientInp.addEventListener("input",function(){WS_STATE.reportClientName=this.value;});
    arCard.appendChild(arClientInp);

    var chipsLabel=span({color:cl.sub,fontSize:"9px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"6px"},"Featured Areas (by real market weight)");
    arCard.appendChild(chipsLabel);
    var chipsWrap=div({display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"12px"});
    AREA_REPORT_FEATURED.forEach(function(a){
      var active=WS_STATE.reportArea===a;
      var chip=el("button",{style:{padding:"6px 10px",borderRadius:"999px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
        border:"1px solid "+(active?cl.gold:cl.border),background:active?hexAlpha(cl.gold,0.14):"transparent",color:active?cl.gold:cl.subHi,fontWeight:active?"700":"400"},
        onclick:function(){WS_STATE.reportArea=a;render();}},a);
      chipsWrap.appendChild(chip);
    });
    arCard.appendChild(chipsWrap);

    var arSel=el("select",{style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"9px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"10px"}});
    arSel.appendChild(el("option",{value:""},"Or search all 347 tracked areas…"));
    Object.keys(AREAS).sort().forEach(function(a){
      var opt=el("option",{value:a},a);
      if(a===WS_STATE.reportArea)opt.selected=true;
      arSel.appendChild(opt);
    });
    arSel.addEventListener("change",function(){WS_STATE.reportArea=this.value;render();});
    arCard.appendChild(arSel);

    if(WS_STATE.reportArea){
      var preview=computeAreaExecutiveReportData(WS_STATE.reportArea);
      if(preview){
        var pv=div({background:hexAlpha(cl.gold,0.06),border:"1px solid "+cl.goldDim,borderRadius:"8px",padding:"10px 12px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",color:cl.subHi});
        pv.appendChild(div({color:cl.gold,fontWeight:"700",marginBottom:"4px"},preview.area+(preview.isVilla?" · Villa/Townhouse":" · Apartment/Tower")));
        pv.appendChild(div({},"AED "+Math.round(preview.psf).toLocaleString()+"/sqft · Yield "+(preview.yield?preview.yield[0]+"–"+preview.yield[1]+"%":"—")+" · "+preview.totalBuildings+" buildings tracked"));
        arCard.appendChild(pv);
      }
    }
    // Pre-built static versions of the 30 featured reports (no sign-in, no
    // generate step) — instant-download alternative to picking an area and
    // clicking Generate above, useful for a visitor who just wants one of
    // the 30 featured areas right now.
    var arHubLink=el("a",{href:"/reports",target:"_blank",style:{display:"block",marginTop:"10px",color:cl.gold,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",textDecoration:"none"}},"Browse all 30 pre-built reports (instant download) →");
    arCard.appendChild(arHubLink);
    card.appendChild(arCard);
  }

  // Settings
  var setCard=div({marginBottom:"14px"});
  setCard.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"8px"},"Report Settings"));
  // Language
  var langRow=div({display:"flex",gap:"6px",marginBottom:"8px"});
  langRow.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",lineHeight:"30px"},"Language:"));
  [{l:"English",v:"en"},{l:"العربية",v:"ar"}].forEach(function(lg){
    var active=WS_STATE.reportLang===lg.v;
    langRow.appendChild(el("button",{style:{padding:"5px 12px",borderRadius:"6px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",border:"1px solid "+(active?cl.gold:cl.border),background:active?hexAlpha(cl.gold,0.12):"transparent",color:active?cl.gold:cl.sub},
      onclick:function(){WS_STATE.reportLang=lg.v;render();}},lg.l));
  });
  setCard.appendChild(langRow);
  // Color
  var colorRow=div({display:"flex",gap:"6px",marginBottom:"8px",alignItems:"center"});
  colorRow.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"Color:"));
  [{l:"Gold",v:"gold",c:"#C9A84C"},{l:"Blue",v:"blue",c:"#3B82F6"},{l:"Green",v:"green",c:"#22C55E"},{l:"Red",v:"red",c:"#EF4444"},{l:"Purple",v:"purple",c:"#A78BFA"}].forEach(function(co){
    var active=WS_STATE.reportColor===co.v;
    var swatch=el("button",{style:{width:"28px",height:"28px",borderRadius:"50%",border:"2px solid "+(active?"#fff":co.c),background:co.c,cursor:"pointer",opacity:active?"1":"0.5",transition:"opacity 0.2s"}});
    swatch.title=co.l;
    swatch.addEventListener("click",function(){WS_STATE.reportColor=co.v;render();});
    colorRow.appendChild(swatch);
  });
  setCard.appendChild(colorRow);
  // Title
  var titleInp=el("input",{type:"text",placeholder:"Custom report title (optional)",
    style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"8px 12px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"8px"}});
  titleInp.value=WS_STATE.reportTitle||"";
  titleInp.addEventListener("input",function(){WS_STATE.reportTitle=this.value;});
  setCard.appendChild(titleInp);
  // Logo upload
  var logoRow=div({display:"flex",alignItems:"center",gap:"8px"});
  var logoInp=el("input",{type:"file",accept:"image/*",style:{display:"none"}});
  logoInp.addEventListener("change",function(){
    if(!this.files.length)return;
    var reader=new FileReader();reader.onload=function(e){WS_STATE.reportLogo=e.target.result;try{localStorage.setItem("dv_report_logo",WS_STATE.reportLogo);}catch(ex){}render();};
    reader.readAsDataURL(this.files[0]);
  });
  var logoBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"6px 12px",borderRadius:"6px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  logoBtn.textContent=WS_STATE.reportLogo?"Logo uploaded":"Upload Company Logo";
  logoBtn.addEventListener("click",function(){logoInp.click();});
  logoRow.appendChild(logoBtn);logoRow.appendChild(logoInp);
  if(WS_STATE.reportLogo){
    var rmLogo=el("button",{style:{background:"transparent",border:"none",color:"#EF4444",fontSize:"10px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});rmLogo.textContent="× Remove";
    rmLogo.addEventListener("click",function(){WS_STATE.reportLogo=null;try{localStorage.removeItem("dv_report_logo");}catch(e){}render();});
    logoRow.appendChild(rmLogo);
  }
  setCard.appendChild(logoRow);
  card.appendChild(setCard);

  // Save template + Generate buttons — "Save Template" only applies to the
  // valuation report (templates store reportSections, which have no
  // equivalent in a catalog's per-generation project selection).
  var btnRow=div({display:"flex",gap:"8px",marginBottom:"10px"});
  if(WS_STATE.reportType==="valuation"){
    var saveTPL=el("button",{style:{flex:"1",padding:"10px",background:"transparent",border:"1px solid "+cl.goldDim,color:cl.gold,borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    saveTPL.textContent="Save Template";
    saveTPL.addEventListener("click",function(){
      if(!WS_STATE.reportSections.length){alert("Select at least one section");return;}
      var name=prompt("Template name:");if(!name)return;
      WS_STATE.templates.unshift({name:name,sections:WS_STATE.reportSections.slice(),lang:WS_STATE.reportLang,color:WS_STATE.reportColor,title:WS_STATE.reportTitle});
      if(WS_STATE.templates.length>10)WS_STATE.templates=WS_STATE.templates.slice(0,10);
      saveTemplates();render();
    });
    btnRow.appendChild(saveTPL);
  }
  var genBtn=el("button",{style:{flex:"1",padding:"10px",background:"linear-gradient(135deg,"+cl.gold+",#7A5E28)",color:"#08090C",border:"none",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  genBtn.textContent=WS_STATE.reportType==="offplan"?"Generate Catalog":WS_STATE.reportType==="area"?"Generate Area Report":"Generate Report";
  genBtn.addEventListener("click",function(){
    if(WS_STATE.reportType==="offplan"){
      if(!WS_STATE.offplanSelected.length){alert("Select at least one project");return;}
      generateOffplanCatalog();
    }else if(WS_STATE.reportType==="area"){
      if(!WS_STATE.reportArea){alert("Select an area first");return;}
      generateAreaExecutiveReport();
    }else{
      if(!WS_STATE.reportSections.length){alert("Select at least one section");return;}
      generateReport();
    }
  });
  btnRow.appendChild(genBtn);
  card.appendChild(btnRow);

  wrap.appendChild(card);
  return wrap;
}

// Areas with the closest price/sqft to the given area — used to build a
// real comparable-areas table instead of an arbitrary alphabetical slice.
function _wsSimilarAreas(area,n){
  var base=AREAS[area];if(!base)return[];
  return Object.keys(AREAS).filter(function(k){return k!==area;})
    .map(function(k){return{k:k,d:Math.abs((AREAS[k].psf||0)-(base.psf||0))};})
    .sort(function(a,b){return a.d-b.d;})
    .slice(0,n).map(function(x){return x.k;});
}

// --- AREA EXECUTIVE REPORT ---
// Added per direct user request: a real, downloadable, in-app "Area
// Executive Market Intelligence Report" — modeled after a real third-party
// agent-branded sample the user shared, but built strictly from DubaiVal's
// own verified database. Several of the sample's flagship sections — buyer-
// nationality composition, named record transactions, per-building short-
// term-rental occupancy/ADR, subjective 1-10 building scores, precise
// multi-year point forecasts — are NOT tracked anywhere in this app's real
// data and are deliberately OMITTED here, not approximated; the generated
// report discloses this plainly (see the "Coming Soon" section in
// _areaReportHtml() below) rather than silently leaving an unexplained gap,
// matching this file's own established honesty conventions (e.g. the
// Off-Plan Catalog's confidence-disclosure wording).
//
// Reachable by ANY signed-in site user (not just agents) via My Workspace →
// Reports → "Area Executive Report" — a real, end-user-facing feature per
// the user's explicit instruction that ordinary DubaiVal visitors must be
// able to generate and download these from inside the site itself, not
// just the agent who requested the original sample.

// 30 areas selected by real market weight — a genuinely mixed villa +
// apartment set spanning every major Dubai price tier, shown as "Featured"
// quick-pick chips in the picker UI below. The underlying report generator
// itself works for ANY of the 347 tracked areas, not just these 30 — this
// list is a curated starting point, not a technical limit.
//
// Selection method (computed directly against the live database, not
// guessed): ranked all 347 AREAS by real txVol, filtered to areas with
// meaningful DB building coverage (>=20 tracked buildings — excludes thin/
// placeholder cadastral sub-parcels with no real per-building data behind
// them, several of which also share one suspicious flat txVol=5000 default
// value rather than a genuinely measured figure), then hand-curated down to
// exactly 30 — keeping every major, publicly recognizable community,
// balancing prime/mid-market/budget price tiers, and ensuring a real mix of
// apartment-dominant, villa-dominant, and mixed-use areas rather than just
// the raw top-30-by-volume (which would have skewed almost entirely toward
// a handful of high-rise districts).
var AREA_REPORT_FEATURED=[
  "Downtown Dubai","Dubai Marina","Business Bay","Jumeirah Village Circle",
  "Jumeirah Lake Towers","Dubai Creek Harbour","Palm Jumeirah","DIFC",
  "Jumeirah Beach Residence (Jbr)","International City","Discovery Gardens",
  "Dubai Silicon Oasis","Arjan","Jumeirah Village Triangle","Dubai Sports City",
  "Emaar Beachfront","City Walk","IMPZ","Dubai Hills Estate","MBR City",
  "DAMAC Hills","DAMAC Hills 2","Al Furjan","Town Square","Sobha Hartland",
  "DAMAC Lagoons","Arabian Ranches","Tilal Al Ghaf","Meydan","Dubai South"
];

function _wsTitleCase(s){
  return String(s||"").replace(/\w\S*/g,function(t){return t.charAt(0).toUpperCase()+t.slice(1);});
}

// Pure data function — no DOM, no WS_STATE — safe to call from an in-app
// render OR the standalone Node build script
// (tools/generate-area-reports.js) alike. Returns null for an unknown area
// rather than fabricating defaults, since this report claims to represent a
// real, specific tracked area.
function computeAreaExecutiveReportData(area){
  var aData=AREAS[area];
  if(!aData)return null;
  var isVilla=typeof VILLA_AREAS!=="undefined"&&VILLA_AREAS.has(area);
  // getLiveAreaData() blends today's live daily-refreshed benchmark on top
  // of the static database when one exists (js/valuation.js — the same
  // function computeAdjustedPSF()/Find's Advanced Market Screener already
  // use), and gracefully falls back to the plain static figures when it
  // doesn't — so this report is always real data either way, just more
  // current when live data happens to be available.
  var live=(typeof getLiveAreaData==="function")?getLiveAreaData(area):aData;

  // Real per-building roll-up (grade distribution + top buildings by grade
  // then PSF) — reads the same DB object every other feature in this app
  // (Analyzer, Find, Map) is calibrated against.
  var buildings=[];
  Object.keys(DB).forEach(function(k){
    var b=DB[k];
    if(b.a!==area)return;
    buildings.push({key:k,name:_wsTitleCase(k),grade:b.g,psf:b.p,sc:b.sc});
  });
  var gradeRank={Ultra:7,"A+":6,A:5,"A-":4,"B+":3,B:2,C:1};
  buildings.sort(function(x,y){
    var gr=(gradeRank[y.grade]||0)-(gradeRank[x.grade]||0);
    return gr!==0?gr:(y.psf||0)-(x.psf||0);
  });
  var gradeCounts={};
  buildings.forEach(function(b){gradeCounts[b.grade]=(gradeCounts[b.grade]||0)+1;});

  // Price/rent by unit type — real, area-wide 10th-90th percentile ranges
  // from the already-established computeAreaPriceRange() (js/market.js —
  // the exact same engine the Analyzer/Quick Check already use), never a
  // second, locally-duplicated formula.
  var bedList=isVilla?["2 BR","3 BR","4 BR","5+ BR"]:["Studio","1 BR","2 BR","3 BR","4 BR"];
  var priceByBeds=[],rentByBeds=[];
  if(typeof computeAreaPriceRange==="function"){
    bedList.forEach(function(bd){
      var pr=computeAreaPriceRange(area,bd,"sale");
      if(pr&&pr.lo)priceByBeds.push({beds:bd,lo:pr.lo,hi:pr.hi});
      var rr=computeAreaPriceRange(area,bd,"rent");
      if(rr&&rr.lo)rentByBeds.push({beds:bd,lo:rr.lo,hi:rr.hi});
    });
  }

  var geo=(typeof computeGeoScore==="function")?computeGeoScore(area):null;
  var sus=(typeof computeSustainabilityScore==="function")?computeSustainabilityScore(null,area,null,aData,null):null;

  return{
    area:area,isVilla:isVilla,
    psf:live.psf,sc:aData.sc,
    yield:aData.y,growth:live.g||aData.g,dom:live.dom,txVol:live.txVol,
    liveBlended:live.psf!==aData.psf||live.dom!==aData.dom,
    buildings:buildings,topBuildings:buildings.slice(0,15),
    gradeCounts:gradeCounts,totalBuildings:buildings.length,
    priceByBeds:priceByBeds,rentByBeds:rentByBeds,
    geo:geo,sustainability:sus
  };
}

// Pure HTML-string builder — no DOM, no window.open — so it's reusable by
// both the in-app generator below (which wraps it in the standard print-
// window mechanism) and the standalone static-file generator
// (tools/generate-area-reports.js). Reuses the same verified-XSS-safe
// _wsReportStyleBlock()/_wsReportHeaderHtml() helpers every other report in
// this app already uses — every user-controlled string still goes through
// _wsEsc() before interpolation.
function _areaReportHtml(area,data,agent,opts){
  opts=opts||{};
  var isAr=opts.lang==="ar";
  var accent=WS_REPORT_COLORS[opts.color]||WS_REPORT_COLORS.gold;
  var title=opts.title||(area+" — Area Executive Market Intelligence Report");
  var h=_wsReportStyleBlock(title,isAr,accent);
  var extraLines=[];
  extraLines.push('<p style="font-size:12px;color:#555;margin:2px 0">Area: <strong>'+_wsEsc(area)+"</strong> · "+(data.isVilla?"Villa/Townhouse Community":"Apartment/Tower Community")+"</p>");
  h+=_wsReportHeaderHtml(title,isAr,agent,extraLines);

  h+="<h2>Market Snapshot</h2>";
  h+='<div class="card"><table>';
  h+="<tr><td>Average PSF</td><td>AED "+Math.round(data.psf||0).toLocaleString()+"/sqft</td></tr>";
  h+="<tr><td>Gross Rental Yield</td><td>"+(data.yield?data.yield[0]+"% – "+data.yield[1]+"%":"—")+"</td></tr>";
  if(data.growth)h+="<tr><td>Price Growth (0-1yr / 1-3yr / 2-5yr)</td><td>"+data.growth[0]+"% / "+data.growth[1]+"% / "+data.growth[2]+"%</td></tr>";
  h+="<tr><td>Avg. Days on Market</td><td>"+(data.dom||"—")+" days</td></tr>";
  h+="<tr><td>Annual Transaction Volume (est.)</td><td>"+(data.txVol||"—")+"</td></tr>";
  h+="<tr><td>Avg. Service Charge</td><td>AED "+(data.sc||"—")+"/sqft/yr</td></tr>";
  h+="<tr><td>Buildings Tracked in This Area</td><td>"+data.totalBuildings+"</td></tr>";
  h+="</table></div>";
  if(data.liveBlended)h+='<p style="color:#22C55E;font-size:10px;font-style:italic">Blended with today\'s live market data where available.</p>';

  if(data.priceByBeds.length){
    h+="<h2>Price by Unit Type (Sale)</h2><table><tr><th>Unit Type</th><th>Estimated Price Range</th></tr>";
    data.priceByBeds.forEach(function(p){
      h+="<tr><td>"+_wsEsc(p.beds)+"</td><td>AED "+p.lo.toLocaleString()+" – "+p.hi.toLocaleString()+"</td></tr>";
    });
    h+="</table>";
  }
  if(data.rentByBeds.length){
    h+="<h2>Rental Market</h2><table><tr><th>Unit Type</th><th>Estimated Annual Rent</th></tr>";
    data.rentByBeds.forEach(function(r){
      h+="<tr><td>"+_wsEsc(r.beds)+"</td><td>AED "+r.lo.toLocaleString()+" – "+r.hi.toLocaleString()+"</td></tr>";
    });
    h+="</table>";
  }

  if(data.totalBuildings){
    h+="<h2>Building Landscape</h2>";
    var gradeOrder=["Ultra","A+","A","A-","B+","B","C"];
    h+='<p style="font-size:12px;color:#555">'+gradeOrder.filter(function(g){return data.gradeCounts[g];}).map(function(g){return _wsEsc(g)+": "+data.gradeCounts[g];}).join(" · ")+"</p>";
    h+="<table><tr><th>Building</th><th>Grade</th><th>PSF</th><th>Service Charge</th></tr>";
    data.topBuildings.forEach(function(b){
      h+="<tr><td>"+_wsEsc(b.name)+"</td><td>"+_wsEsc(b.grade)+"</td><td>AED "+Math.round(b.psf||0).toLocaleString()+"</td><td>AED "+(b.sc||"—")+"/sqft/yr</td></tr>";
    });
    h+="</table>";
    if(data.totalBuildings>data.topBuildings.length)h+='<p style="color:#999;font-size:10px">Showing top '+data.topBuildings.length+" of "+data.totalBuildings+" tracked buildings, ranked by grade then price.</p>";
  }

  if(data.geo){
    h+="<h2>Location Intelligence</h2><table>";
    h+="<tr><td>Nearest Metro/Tram</td><td>"+_wsEsc(data.geo.transitName||"—")+" ("+data.geo.transitDist+" km)</td></tr>";
    h+="<tr><td>Nearest Mall</td><td>"+_wsEsc(data.geo.mallName||"—")+" ("+data.geo.mallDist+" km)</td></tr>";
    h+="<tr><td>Nearest Beach</td><td>"+_wsEsc(data.geo.beachName||"—")+" ("+data.geo.beachDist+" km)</td></tr>";
    h+="<tr><td>Nearest Business Hub</td><td>"+_wsEsc(data.geo.bizName||"—")+" ("+data.geo.bizDist+" km)</td></tr>";
    h+="<tr><td>Nearest Airport</td><td>"+_wsEsc(data.geo.airportName||"—")+" ("+data.geo.airportDist+" km)</td></tr>";
    h+="<tr><td>Location Score</td><td>"+data.geo.locationScore+"/10</td></tr>";
    h+="</table>";
  }

  if(data.sustainability){
    h+="<h2>Sustainability &amp; Efficiency</h2>";
    h+='<div class="card">Score: <strong class="accent">'+data.sustainability.score+"/100 ("+_wsEsc(data.sustainability.tier)+")</strong></div>";
  }

  h+="<h2>Coming Soon to This Report</h2>";
  h+='<p style="font-size:11px;color:#666;line-height:1.7">The following analytics require additional, independently verified data sources DubaiVal is actively working to integrate, and are deliberately not shown here yet rather than estimated: buyer-nationality composition, notable individually recorded transactions, short-term rental (Airbnb-style) occupancy &amp; daily-rate performance, and building-by-building numeric scoring. They will be added to this report once real, verifiable data exists for each.</p>';

  h+='<p style="color:#999;font-size:10px;margin-top:20px;border-top:1px solid #eee;padding-top:10px">All figures are estimates derived from DubaiVal\'s own tracked building &amp; area benchmark database'+(data.liveBlended?" and current live market data":"")+'. Verify current listings and pricing with a licensed agent before making a decision. Powered by DubaiVal.com.</p>';

  h+="</body></html>";
  return h;
}

// In-app entry point — reads WS_STATE (agent branding + the area picked in
// the UI), wraps _areaReportHtml() in the same window.open→document.write→
// print() mechanism every other report in this app already uses.
function generateAreaExecutiveReport(){
  var area=WS_STATE.reportArea;
  var data=computeAreaExecutiveReportData(area);
  if(!data){alert("Select a real, tracked area first.");return;}
  var h=_areaReportHtml(area,data,WS_STATE.agent,{lang:WS_STATE.reportLang,color:WS_STATE.reportColor,title:WS_STATE.reportTitle});
  var w=window.open("","_blank");
  if(!w){alert("Please allow pop-ups for this site to generate the report.");return;}
  w.document.write(h);
  w.document.close();
  w.print();
}

function generateReport(){
  var accent=WS_REPORT_COLORS[WS_STATE.reportColor]||WS_REPORT_COLORS.gold;
  var isAr=WS_STATE.reportLang==="ar";
  var title=WS_STATE.reportTitle||(isAr?"تقرير DubAIVal":"DubAIVal Property Report");
  var agent=WS_STATE.agent||{};
  var reportPrice=parseFloat(WS_STATE.reportPrice)||(analyzerState&&analyzerState.f&&parseFloat(analyzerState.f.price))||0;

  var w=window.open("","_blank");
  if(!w){alert("Please allow pop-ups for this site to generate the report.");return;}
  var h=_wsReportStyleBlock(title,isAr,accent);

  // Header — agent's own branding leads, DubAIVal is a footer credit only
  var effReportBuildingHdr=WS_STATE.reportBuilding||(analyzerState&&analyzerState.f&&analyzerState.f.building)||"";
  var extraLines=[];
  if(effReportBuildingHdr)extraLines.push('<p style="font-size:12px;color:#555;margin:2px 0">Property: <strong>'+_wsEsc(effReportBuildingHdr)+(WS_STATE.reportArea?", "+_wsEsc(WS_STATE.reportArea):"")+"</strong></p>");
  h+=_wsReportHeaderHtml(title,isAr,agent,extraLines);

  WS_STATE.reportSections.forEach(function(sid){
    var sec=WS_REPORT_SECTIONS.find(function(s){return s.id===sid;});
    if(!sec)return;
    h+="<h2>"+sec.label+"</h2>";
    var area=WS_STATE.reportArea||(analyzerState&&analyzerState.f&&analyzerState.f.area)||"";
    var aData=area?AREAS[area]:null;

    if(sid==="valuation"){
      if(analyzerState&&analyzerState.val){
        var v=analyzerState.val;var f=analyzerState.f;
        h+='<div class="card"><table>';
        h+="<tr><td>Property</td><td>"+_wsEsc(f.building||"")+" "+_wsEsc(f.area)+"</td></tr>";
        h+="<tr><td>Size</td><td>"+(f.size||f.buaSize||"N/A")+" sqft</td></tr>";
        h+="<tr><td>Asking Price</td><td>AED "+(parseInt(f.price)||0).toLocaleString()+"</td></tr>";
        h+='<tr><td>Fair Price</td><td class="accent"><strong>AED '+v.fairPrice.toLocaleString()+"</strong></td></tr>";
        h+="<tr><td>Verdict</td><td><strong>"+v.verdict+"</strong></td></tr>";
        h+="<tr><td>Confidence</td><td>"+v.confScore+"%</td></tr>";
        h+="<tr><td>Gross Yield</td><td>"+v.grossYield+"%</td></tr>";
        h+="<tr><td>Signal</td><td>"+(v.investSignal?v.investSignal.label:"N/A")+"</td></tr>";
        h+="</table></div>";
      }else{
        h+='<p style="color:#999">No valuation loaded. Run the Analyzer for this property, then regenerate this report.</p>';
      }
    }else if(sid==="areastats"){
      var rows=area&&aData?[area].concat(_wsSimilarAreas(area,5))
        :Object.keys(AREAS).sort(function(a,b){return (AREAS[b].txVol||0)-(AREAS[a].txVol||0);}).slice(0,8);
      h+='<table><tr><th>Area</th><th>PSF</th><th>Yield</th><th>Growth 1Y</th><th>DOM</th></tr>';
      rows.forEach(function(k){var a=AREAS[k];if(!a)return;var y=a.y||[5,7];var g=a.g||[10];
        h+='<tr'+(k===area?' class="hi"':"")+"><td>"+k+(k===area?" ★":"")+"</td><td>AED "+(a.psf||0).toLocaleString()+"</td><td>"+((y[0]+y[1])/2).toFixed(1)+"%</td><td>"+(g[0]||0)+"%</td><td>"+(a.dom||"—")+" days</td></tr>";
      });
      h+="</table>";
      if(!area)h+='<p style="color:#999;font-size:10px">Select a Report Subject area to lead with a specific property\'s area instead of the market-wide top movers shown here.</p>';
    }else if(sid==="marketcmp"){
      if(area&&aData){
        var cmpAreas=[area].concat(_wsSimilarAreas(area,2));
        h+='<table><tr><th>Metric</th>';
        cmpAreas.forEach(function(k){h+="<th>"+k+(k===area?" ★":"")+"</th>";});
        h+="</tr>";
        var metricRows=[
          ["Price/sqft",function(a){return "AED "+(a.psf||0).toLocaleString();}],
          ["Gross Yield",function(a){var y=a.y||[5,7];return ((y[0]+y[1])/2).toFixed(1)+"%";}],
          ["Growth (0-1yr)",function(a){return (a.g&&a.g[0]||0)+"%";}],
          ["Growth (1-3yr)",function(a){return (a.g&&a.g[1]||0)+"%";}],
          ["Days on Market",function(a){return (a.dom||"—")+" days";}],
          ["Service Charge",function(a){return "AED "+(a.sc||0)+"/sqft/yr";}]
        ];
        metricRows.forEach(function(mr){
          h+="<tr><td><strong>"+mr[0]+"</strong></td>";
          cmpAreas.forEach(function(k){h+="<td"+(k===area?' class="hi"':"")+">"+mr[1](AREAS[k])+"</td>";});
          h+="</tr>";
        });
        h+="</table>";
      }else{
        h+='<p style="color:#999">Select a Report Subject area above to include a side-by-side comparison with its closest comparable areas.</p>';
      }
    }else if(sid==="investment"){
      if(area&&aData&&reportPrice>0){
        var g=aData.g||[10,18,28];
        // "Investment Scenario" in Dubai real estate is a yield-driven case,
        // not just capital appreciation — the area's own rental yield band
        // (aData.y, the exact same field the "marketcmp" section above
        // already displays as "Gross Yield") was already loaded but never
        // used here, so this section previously only told half the
        // investment story. Adds real cumulative rental income + a combined
        // total-return figure, using no new inputs.
        var invY=aData.y||[5,7];
        var midYield=(invY[0]+invY[1])/2;
        h+='<table><tr><th>Horizon</th><th>Projected Value</th><th>Est. Growth</th><th>Cumulative Rental Income</th><th>Est. Total Return</th></tr>';
        [[1,g[0]],[3,g[1]],[5,g[2]]].forEach(function(yr){
          var futureVal=Math.round(reportPrice*(1+(yr[1]||0)/100));
          var cumRentalIncome=Math.round(reportPrice*(midYield/100)*yr[0]);
          var totalReturn=(yr[1]||0)+midYield*yr[0];
          h+="<tr><td>"+yr[0]+" year"+(yr[0]>1?"s":"")+"</td><td class=\"accent\"><strong>AED "+futureVal.toLocaleString()+"</strong></td><td>"+(yr[1]>=0?"+":"")+yr[1]+"%</td><td>AED "+cumRentalIncome.toLocaleString()+"</td><td class=\"accent\"><strong>+"+totalReturn.toFixed(1)+"%</strong></td></tr>";
        });
        h+="</table><p style='color:#999;font-size:10px'>Based on "+_wsEsc(area)+"'s historical growth ("+g.join("/")+"%) and area-average gross rental yield ("+midYield.toFixed(1)+"%). Estimates only, not a guarantee of future performance; rental income shown before service charges, management fees, or vacancy.</p>";
      }else{
        h+='<p style="color:#999">Select a Report Subject area and enter a property price above to include a growth projection.</p>';
      }
    }else if(sid==="mortgage"){
      if(reportPrice>0){
        var dp=20,rate=4.49,tenureYrs=25;
        // Must match js/mortgage.js's own maxLTV formula exactly (real
        // UAE-national tiers are higher than expat tiers at every price
        // band) — this used to hardcode the expat-only tiers regardless of
        // buyer, so a real UAE national's down payment/monthly payment came
        // out wrong (overstated) any time the default 20% fell below the
        // correct minimum for their actual, higher LTV cap.
        var maxLTV=WS_STATE.reportNationality==="uae"?(reportPrice>=5000000?70:80):(reportPrice>=5000000?65:75);
        var minDP=100-maxLTV;
        if(dp<minDP)dp=minDP;
        var dpAmt=Math.round(reportPrice*dp/100);
        var loanAmt=reportPrice-dpAmt;
        var monthlyRate=(rate/100)/12;
        var nPay=tenureYrs*12;
        var monthly=Math.round(loanAmt*(monthlyRate*Math.pow(1+monthlyRate,nPay))/(Math.pow(1+monthlyRate,nPay)-1));
        var dldFee=Math.round(reportPrice*0.04);
        var agencyFee=Math.round(reportPrice*0.02);
        var mortgageFee=Math.round(reportPrice*0.0025);
        var totalUpfront=dpAmt+dldFee+agencyFee+mortgageFee;
        h+='<div class="card"><table>';
        h+="<tr><td>Down Payment ("+dp+"%)</td><td>AED "+dpAmt.toLocaleString()+"</td></tr>";
        h+="<tr><td>Loan Amount</td><td>AED "+loanAmt.toLocaleString()+"</td></tr>";
        h+='<tr><td>Est. Monthly Payment</td><td class="accent"><strong>AED '+monthly.toLocaleString()+"</strong></td></tr>";
        h+="<tr><td>DLD Transfer Fee (4%)</td><td>AED "+dldFee.toLocaleString()+"</td></tr>";
        h+="<tr><td>Agency Fee (2%)</td><td>AED "+agencyFee.toLocaleString()+"</td></tr>";
        h+="<tr><td>Mortgage Registration (0.25%)</td><td>AED "+mortgageFee.toLocaleString()+"</td></tr>";
        h+='<tr><td><strong>Total Upfront Cost</strong></td><td><strong>AED '+totalUpfront.toLocaleString()+"</strong></td></tr>";
        h+="</table></div>";
        h+="<p style='color:#999;font-size:10px'>Assumptions: "+tenureYrs+"-year fixed rate at "+rate+"%, "+dp+"% down payment ("+(WS_STATE.reportNationality==="uae"?"UAE national":"expat")+" buyer). Actual rates vary by bank and buyer profile.</p>";
      }else{
        h+='<p style="color:#999">Enter a property price above to include a mortgage estimate.</p>';
      }
    }else if(sid==="sustainability"){
      if(area&&aData){
        var effBuildingSS=WS_STATE.reportBuilding||(analyzerState&&analyzerState.f&&analyzerState.f.building)||"";
        var bData=effBuildingSS?lookupBuilding(effBuildingSS,area):null;
        var ss=computeSustainabilityScore(effBuildingSS,area,bData,aData,analyzerState&&analyzerState.f&&analyzerState.f.serviceCharge);
        h+='<div class="card"><span class="metric">Score: <strong class="accent">'+ss.score+"/100</strong></span>";
        h+='<span class="metric">Tier: <strong>'+ss.tier+"</strong></span></div>";
        h+="<table><tr><th>Factor</th><th>Score</th></tr>";
        h+="<tr><td>Building Quality/Age</td><td>"+ss.age+"/100</td></tr>";
        h+="<tr><td>Service Charge Efficiency</td><td>"+ss.scEff+"/100</td></tr>";
        h+="<tr><td>Green/Community Score</td><td>"+ss.green+"/100</td></tr>";
        h+="<tr><td>Liquidity (Days on Market)</td><td>"+ss.liq+"/100</td></tr>";
        h+="</table>";
      }else{
        h+='<p style="color:#999">Select a Report Subject area above to include a sustainability score.</p>';
      }
    }
  });

  h+='<hr style="margin-top:30px;border-color:#eee"><p style="color:#999;font-size:10px;text-align:center">Powered by DubAIVal.com — AI-powered Dubai property valuation · '+new Date().toLocaleDateString()+"</p>";
  h+="</body></html>";
  w.document.write(h);w.document.close();
  setTimeout(function(){w.print();},500);
}

// Off-Plan Project Catalog — added 2026-08-05 (Phase 2 of the GenieMap
// gap-closing plan). Reuses the same print-window mechanism, escaping
// helper, agent-branding header, and CSS as generateReport() (via the
// shared _wsReportStyleBlock/_wsReportHeaderHtml helpers extracted above),
// but builds a genuinely different report SHAPE: one section per SELECTED
// off-plan project instead of one property's valuation sections. Every
// number shown is computed by the exact same _offplanProjectForecasts()/
// computeOffPlanForecast() the Off-Plan Projects tab and its map (Phase 1)
// already use — no separate, driftable forecast math.
function generateOffplanCatalog(){
  if(typeof OFFPLAN_STATE==="undefined"||!OFFPLAN_STATE.projects){alert("Off-plan data isn't loaded yet — please try again in a moment.");return;}
  var selected=OFFPLAN_STATE.projects.filter(function(p){return WS_STATE.offplanSelected.indexOf(p.id)!==-1;});
  if(!selected.length){alert("Select at least one project");return;}
  // Sort by handover date (nearest first) for a sensible client-facing
  // document flow, regardless of the order projects were checked in.
  selected.sort(function(a,b){return new Date(a.expected_handover)-new Date(b.expected_handover);});

  var accent=WS_REPORT_COLORS[WS_STATE.reportColor]||WS_REPORT_COLORS.gold;
  var isAr=WS_STATE.reportLang==="ar";
  var title=WS_STATE.reportTitle||(isAr?"كتالوج المشاريع على الخارطة — DubAIVal":"DubAIVal Off-Plan Project Catalog");
  var agent=WS_STATE.agent||{};

  var w=window.open("","_blank");
  if(!w){alert("Please allow pop-ups for this site to generate the catalog.");return;}
  var h=_wsReportStyleBlock(title,isAr,accent);

  var extraLines=[];
  extraLines.push('<p style="font-size:12px;color:#555;margin:2px 0">'+selected.length+" project"+(selected.length===1?"":"s")+" curated for review</p>");
  h+=_wsReportHeaderHtml(title,isAr,agent,extraLines);

  selected.forEach(function(p){
    var devRecord=(OFFPLAN_STATE.devRecords&&OFFPLAN_STATE.devRecords[p.developer])||null;
    var fcs=(typeof _offplanProjectForecasts==="function")?_offplanProjectForecasts(p,devRecord):[];
    var stageLabel=(typeof OFFPLAN_STAGE_LABELS!=="undefined"&&OFFPLAN_STAGE_LABELS[p.project_stage])||p.project_stage||"";
    var fmtDate=(typeof _offplanFmtDate==="function")?_offplanFmtDate:function(d){return d||"—";};

    h+="<h2>"+_wsEsc(p.name)+"</h2>";
    h+='<p style="font-size:12px;color:#555;margin:2px 0">'+_wsEsc(p.developer)+" · "+_wsEsc(p.area)+" · <strong>"+_wsEsc(stageLabel)+"</strong></p>";
    var metaBits=["Launched "+fmtDate(p.launch_date),"Handover "+fmtDate(p.expected_handover)];
    if(p.payment_plan)metaBits.push("Payment Plan: "+_wsEsc(p.payment_plan));
    h+='<p style="font-size:11px;color:#777;margin:2px 0 10px">'+metaBits.join(" · ")+"</p>";

    if(!fcs.length){
      h+='<p style="color:#999;font-size:11px">No unit pricing on file yet for this project.</p>';
    }else{
      h+='<table><tr><th>Unit Type</th><th>Size (sqft)</th><th>Launch PSF</th><th>At Handover</th><th>+5yr Post-Handover</th></tr>';
      fcs.forEach(function(fc){
        var sizeStr=(fc.sizeMin&&fc.sizeMax)?(fc.sizeMin+"–"+fc.sizeMax):"—";
        h+="<tr><td>"+_wsEsc(fc.unitType)+"</td><td>"+sizeStr+"</td>";
        h+='<td class="hi">AED '+Math.round(fc.launchPSF).toLocaleString()+"</td>";
        h+='<td class="accent"><strong>AED '+fc.projectedHandoverPSF.toLocaleString()+"</strong><br><span style='font-size:10px'>("+(fc.growthToHandoverPct>=0?"+":"")+fc.growthToHandoverPct+"%, "+fc.yearsToHandover+"y)</span></td>";
        h+='<td class="accent"><strong>AED '+fc.projected5yrPSF.toLocaleString()+"</strong><br><span style='font-size:10px'>("+(fc.growth5yrPct>=0?"+":"")+fc.growth5yrPct+"%)</span></td>";
        h+="</tr>";
      });
      h+="</table>";
      h+='<p style="color:'+(fcs[0].hasDevData?"#22C55E":"#999")+';font-size:10px;font-style:italic;margin-top:4px">'+_wsEsc(fcs[0].confidence)+"</p>";
    }
    if(p.notes)h+='<p style="color:#999;font-size:10px;margin-top:4px">Notes: '+_wsEsc(p.notes)+"</p>";
  });

  h+='<hr style="margin-top:30px;border-color:#eee">';
  h+='<p style="color:#999;font-size:10px;text-align:center">Forecasts are illustrative projections based on historical area growth data and, where available, developer track record — not a guarantee of future performance. Off-plan investments carry construction, market, and completion-timeline risk. Verify all figures with the developer before purchase.</p>';
  h+='<p style="color:#999;font-size:10px;text-align:center">Powered by DubAIVal.com — AI-powered Dubai property valuation · '+new Date().toLocaleDateString()+"</p>";
  h+="</body></html>";
  w.document.write(h);w.document.close();
  setTimeout(function(){w.print();},500);
}

// Load logo from localStorage
try{var _rl=localStorage.getItem("dv_report_logo");if(_rl)WS_STATE.reportLogo=_rl;}catch(e){}
