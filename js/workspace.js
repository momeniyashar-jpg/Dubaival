// Copyright (c) 2024-2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- MY WORKSPACE TAB ---------------------------------------------------------
var WS_STATE={widgets:[],mode:"dashboard",reportMode:"visual",reportSections:[],reportLang:"en",reportColor:"gold",reportTitle:"",reportLogo:null,templates:[],voiceActive:false,voiceText:"",parsed:false};
try{var _ws=localStorage.getItem("dv_workspace");if(_ws){var d=JSON.parse(_ws);WS_STATE.widgets=d.widgets||[];}}catch(e){}
try{var _rt=localStorage.getItem("dv_report_templates");if(_rt)WS_STATE.templates=JSON.parse(_rt);}catch(e){}
function saveWS(){try{localStorage.setItem("dv_workspace",JSON.stringify({widgets:WS_STATE.widgets}));if(typeof portfolioChanged==="function")portfolioChanged();}catch(e){}}
function saveTemplates(){try{localStorage.setItem("dv_report_templates",JSON.stringify(WS_STATE.templates));}catch(e){}}

var WS_TOOLS=[
  {id:"portfolio",icon:"💼",label:"Portfolio Manager",desc:"Track assets, ROI & yield"},
  {id:"alerts",icon:"🔔",label:"Opportunity Alerts",desc:"Hidden investment opportunities"},
  {id:"calculator",icon:"📊",label:"Investment Calculator",desc:"IRR, cash flow & scenarios"},
  {id:"market",icon:"📈",label:"Market Index",desc:"287 areas, PSF & yield data"},
  {id:"dashboard",icon:"📡",label:"Live Dashboard",desc:"Real-time market stats"},
  {id:"comparison",icon:"⚖️",label:"Neighborhood Comparison",desc:"Compare 2-3 areas"},
  {id:"analyzer",icon:"🔍",label:"Valuation Analyzer",desc:"AI-powered property valuation"},
  {id:"fairprice",icon:"💰",label:"Fair Price Checker",desc:"Quick price assessment"},
  {id:"mortgage",icon:"🏦",label:"Mortgage Calculator",desc:"Monthly payments & costs"},
  {id:"deals",icon:"🤝",label:"Deal Network",desc:"Agent-to-agent deals"},
  {id:"agenthub",icon:"👥",label:"Agent Hub",desc:"Agent directory & referrals"},
  {id:"notifications",icon:"🔔",label:"Notifications",desc:"Activity alerts"},
  {id:"favareas",icon:"⭐",label:"Favorite Areas",desc:"Your bookmarked areas"},
  {id:"saved",icon:"📌",label:"Saved Searches",desc:"Recent valuations"}
];

var WS_PRESETS={
  investor:{label:"Investor",icon:"📈",ids:["portfolio","alerts","calculator","market"]},
  agent:{label:"Agent",icon:"👥",ids:["deals","agenthub","notifications","dashboard"]},
  buyer:{label:"Buyer",icon:"🏠",ids:["fairprice","comparison","mortgage","saved"]}
};

var WS_REPORT_SECTIONS=[
  {id:"valuation",label:"Property Valuation Summary",icon:"🔍"},
  {id:"marketcmp",label:"Market Comparison",icon:"⚖️"},
  {id:"areastats",label:"Area Statistics",icon:"📊"},
  {id:"portfolio",label:"Portfolio Overview",icon:"💼"},
  {id:"opportunity",label:"Opportunity Alerts",icon:"🔔"},
  {id:"investment",label:"Investment Scenarios",icon:"📈"},
  {id:"mortgage",label:"Mortgage Analysis",icon:"🏦"},
  {id:"neighborhood",label:"Neighborhood Comparison",icon:"🏘️"},
  {id:"sustainability",label:"Sustainability Score",icon:"🌿"}
];

function renderWorkspace(){
  var cl=C();
  var wrap=div({padding:"16px 20px",maxWidth:"640px",margin:"0 auto",paddingBottom:"90px"});
  wrap.appendChild(div({marginBottom:"16px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"◆ My Workspace"),
    span({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"Your personal dashboard & custom reports")
  ]));

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
    welcome.appendChild(div({fontSize:"36px",marginBottom:"12px"},"🛠️"));
    welcome.appendChild(div({color:cl.gold,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Build Your Workspace"));
    welcome.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",marginBottom:"20px"},"Select tools below to create your personalized dashboard. Choose a preset or pick individually."));

    // Presets
    var presetRow=div({display:"flex",gap:"8px",justifyContent:"center",marginBottom:"16px"});
    Object.keys(WS_PRESETS).forEach(function(k){
      var p=WS_PRESETS[k];
      var btn=el("button",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",padding:"12px 18px",cursor:"pointer",textAlign:"center"}});
      btn.appendChild(div({fontSize:"20px",marginBottom:"4px"},p.icon));
      btn.appendChild(div({color:cl.gold,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},p.label));
      btn.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},p.ids.length+" tools"));
      btn.addEventListener("click",function(){WS_STATE.widgets=p.ids.slice();saveWS();render();});
      presetRow.appendChild(btn);
    });
    welcome.appendChild(presetRow);
    wrap.appendChild(welcome);
  }

  // Tool selector (always show)
  var selCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"14px 16px",marginBottom:"14px"});
  selCard.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"10px"},"Available Tools"));
  var toolGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}});
  WS_TOOLS.forEach(function(t){
    var inWS=WS_STATE.widgets.indexOf(t.id)!==-1;
    var tc=el("div",{style:{background:inWS?hexAlpha(cl.gold,0.06):"rgba(240,242,245,0.03)",border:"1px solid "+(inWS?cl.goldDim:cl.border),borderRadius:"10px",padding:"10px",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",transition:"all 0.2s"}});
    tc.appendChild(span({fontSize:"16px",flexShrink:"0"},t.icon));
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
    var orderCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"14px 16px",marginBottom:"14px"});
    orderCard.appendChild(span({color:cl.gold,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"10px"},"◆ Your Workspace · "+WS_STATE.widgets.length+" tools"));
    WS_STATE.widgets.forEach(function(wid,idx){
      var tool=WS_TOOLS.find(function(t){return t.id===wid;});if(!tool)return;
      var row=div({display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",background:cl.raised,borderRadius:"8px",marginBottom:"4px"});
      row.appendChild(span({fontSize:"14px"},tool.icon));
      row.appendChild(span({color:cl.subHi,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",flex:"1"},tool.label));
      if(idx>0){var upBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,width:"22px",height:"22px",borderRadius:"4px",cursor:"pointer",fontSize:"10px",display:"flex",alignItems:"center",justifyContent:"center"}});upBtn.textContent="↑";
        (function(i){upBtn.addEventListener("click",function(){var tmp=WS_STATE.widgets[i-1];WS_STATE.widgets[i-1]=WS_STATE.widgets[i];WS_STATE.widgets[i]=tmp;saveWS();render();});})(idx);row.appendChild(upBtn);}
      if(idx<WS_STATE.widgets.length-1){var dnBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,width:"22px",height:"22px",borderRadius:"4px",cursor:"pointer",fontSize:"10px",display:"flex",alignItems:"center",justifyContent:"center"}});dnBtn.textContent="↓";
        (function(i){dnBtn.addEventListener("click",function(){var tmp=WS_STATE.widgets[i+1];WS_STATE.widgets[i+1]=WS_STATE.widgets[i];WS_STATE.widgets[i]=tmp;saveWS();render();});})(idx);row.appendChild(dnBtn);}
      orderCard.appendChild(row);
    });
    wrap.appendChild(orderCard);

    // Mini widget dashboard
    var dashGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}});
    WS_STATE.widgets.forEach(function(wid){
      var tool=WS_TOOLS.find(function(t){return t.id===wid;});if(!tool)return;
      var card=el("div",{style:{background:"linear-gradient(135deg,rgba(201,168,76,0.04),transparent)",border:"1px solid "+cl.border,borderRadius:"12px",padding:"14px",cursor:"pointer",transition:"border-color 0.2s"}});
      card.addEventListener("mouseenter",function(){this.style.borderColor=cl.gold;});
      card.addEventListener("mouseleave",function(){this.style.borderColor=cl.border;});
      card.appendChild(div({display:"flex",alignItems:"center",gap:"6px",marginBottom:"8px"},[
        span({fontSize:"16px"},tool.icon),
        span({color:cl.gold,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},tool.label)]));

      // Mini widget content
      var miniContent=getMiniWidget(wid,cl);
      if(miniContent)card.appendChild(miniContent);

      var tabMap={portfolio:"Portfolio",alerts:"Alerts",calculator:"Analyzer",market:"Index",dashboard:"Market",comparison:"Index",analyzer:"Analyzer",fairprice:"Analyzer",mortgage:"Analyzer",deals:"Deals",agenthub:"Deals",notifications:null,favareas:"Index",saved:"Analyzer"};
      var targetTab=tabMap[wid];
      if(targetTab)card.addEventListener("click",function(){currentTab=targetTab;render();});
      dashGrid.appendChild(card);
    });
    wrap.appendChild(dashGrid);
  }

  var tourRow2=div({display:"flex",gap:"8px",justifyContent:"center",marginTop:"24px",flexWrap:"wrap"});
  var tq2=el("button",{style:{background:"transparent",border:"1px solid "+cl.gold,color:cl.gold,padding:"9px 18px",borderRadius:"10px",fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  tq2.textContent="🎯 Quick Tour (8)";
  tq2.addEventListener("click",function(){try{localStorage.removeItem("dv_tour_done");}catch(e){}startTour("quick");});
  var tf2=el("button",{style:{background:"linear-gradient(135deg,"+cl.gold+",#7A5E28)",border:"none",color:"#08090C",padding:"9px 18px",borderRadius:"10px",fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  tf2.textContent="🚀 Full Tour (16)";
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
  }else if(wid==="market"||wid==="dashboard"){
    var aKeys=Object.keys(AREAS);var cnt=aKeys.length;var sumP=0,sumY=0;
    aKeys.forEach(function(k){var a=AREAS[k];sumP+=a.psf||0;if(a.y)sumY+=(a.y[0]+a.y[1])/2;});
    w.appendChild(div({color:cl.text,fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+Math.round(sumP/cnt).toLocaleString()+" avg PSF"));
    w.appendChild(div({color:"#22C55E",fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},(sumY/cnt).toFixed(1)+"% avg yield"));
    w.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},cnt+" areas · "+Object.keys(DB).length+" buildings"));
  }else if(wid==="deals"){
    var dc=DEAL_STATE.deals.length;var hc=DEAL_STATE.deals.filter(function(d){return d.urgency==="hot";}).length;
    w.appendChild(div({color:cl.text,fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},dc+" active deals"));
    if(hc)w.appendChild(div({color:"#EF4444",fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},"🔥 "+hc+" hot deals"));
  }else if(wid==="notifications"){
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
  var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px"});
  card.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"◆ Custom Report Builder"),
    span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Visual · Text · Voice")]));

  // Mode tabs
  var rmBar=div({display:"flex",gap:"6px",marginBottom:"14px"});
  [{l:"🎨 Visual Builder",v:"visual"},{l:"⌨️ Smart Text",v:"text"},{l:"🎤 Voice",v:"voice"}].forEach(function(m){
    var active=WS_STATE.reportMode===m.v;
    rmBar.appendChild(el("button",{style:{flex:"1",padding:"8px",borderRadius:"8px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
      background:active?hexAlpha(cl.gold,0.12):"transparent",color:active?cl.gold:cl.sub,border:"1px solid "+(active?cl.goldDim:cl.border)},
      onclick:function(){WS_STATE.reportMode=m.v;render();}},m.l));
  });
  card.appendChild(rmBar);

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
      style:{flex:"1",background:cl.raised,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"10px 14px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none"}});
    textInp.value=window._wsTextInp||WS_STATE.voiceText||"";
    textInp.addEventListener("input",function(){window._wsTextInp=this.value;WS_STATE.parsed=false;});
    textRow.appendChild(textInp);
    var parseBtn=el("button",{style:{background:"linear-gradient(135deg,"+cl.gold+",#7A5E28)",color:"#08090C",border:"none",padding:"10px 16px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    parseBtn.textContent="Parse";
    parseBtn.addEventListener("click",function(){
      var txt=(window._wsTextInp||WS_STATE.voiceText||"").toLowerCase();
      var secs=[];
      var kwMap={valuation:"valuation",market:"marketcmp",area:"areastats",portfolio:"portfolio",opportunity:"opportunity",investment:"investment",mortgage:"mortgage",comparison:"neighborhood",sustainability:"sustainability",neighbourhood:"neighborhood"};
      Object.keys(kwMap).forEach(function(kw){if(txt.indexOf(kw)!==-1)secs.push(kwMap[kw]);});
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
    row.appendChild(span({fontSize:"14px"},sec.icon));
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
    style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"8px 12px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"8px"}});
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
  logoBtn.textContent=WS_STATE.reportLogo?"✓ Logo uploaded":"📎 Upload Company Logo";
  logoBtn.addEventListener("click",function(){logoInp.click();});
  logoRow.appendChild(logoBtn);logoRow.appendChild(logoInp);
  if(WS_STATE.reportLogo){
    var rmLogo=el("button",{style:{background:"transparent",border:"none",color:"#EF4444",fontSize:"10px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});rmLogo.textContent="× Remove";
    rmLogo.addEventListener("click",function(){WS_STATE.reportLogo=null;try{localStorage.removeItem("dv_report_logo");}catch(e){}render();});
    logoRow.appendChild(rmLogo);
  }
  setCard.appendChild(logoRow);
  card.appendChild(setCard);

  // Save template + Generate buttons
  var btnRow=div({display:"flex",gap:"8px",marginBottom:"10px"});
  var saveTPL=el("button",{style:{flex:"1",padding:"10px",background:"transparent",border:"1px solid "+cl.goldDim,color:cl.gold,borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  saveTPL.textContent="💾 Save Template";
  saveTPL.addEventListener("click",function(){
    if(!WS_STATE.reportSections.length){alert("Select at least one section");return;}
    var name=prompt("Template name:");if(!name)return;
    WS_STATE.templates.unshift({name:name,sections:WS_STATE.reportSections.slice(),lang:WS_STATE.reportLang,color:WS_STATE.reportColor,title:WS_STATE.reportTitle});
    if(WS_STATE.templates.length>10)WS_STATE.templates=WS_STATE.templates.slice(0,10);
    saveTemplates();render();
  });
  btnRow.appendChild(saveTPL);
  var genBtn=el("button",{style:{flex:"1",padding:"10px",background:"linear-gradient(135deg,"+cl.gold+",#7A5E28)",color:"#08090C",border:"none",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  genBtn.textContent="📄 Generate Report";
  genBtn.addEventListener("click",function(){
    if(!WS_STATE.reportSections.length){alert("Select at least one section");return;}
    generateReport();
  });
  btnRow.appendChild(genBtn);
  card.appendChild(btnRow);

  wrap.appendChild(card);
  return wrap;
}

function generateReport(){
  var colors={gold:"#C9A84C",blue:"#3B82F6",green:"#22C55E",red:"#EF4444",purple:"#A78BFA"};
  var accent=colors[WS_STATE.reportColor]||colors.gold;
  var isAr=WS_STATE.reportLang==="ar";
  var title=WS_STATE.reportTitle||(isAr?"تقرير DubaiVal":"DubaiVal Custom Report");

  var w=window.open("","_blank");
  var h='<!DOCTYPE html><html dir="'+(isAr?"rtl":"ltr")+'" lang="'+(isAr?"ar":"en")+'"><head><meta charset="UTF-8"><title>'+title+'</title>';
  h+='<style>*{box-sizing:border-box}body{font-family:'+(isAr?"'Cairo',":"")+"Arial,sans-serif;max-width:800px;margin:0 auto;padding:30px;color:#333;background:#fff}";
  h+="h1{color:"+accent+";font-size:24px;border-bottom:3px solid "+accent+";padding-bottom:10px}";
  h+="h2{color:"+accent+";font-size:18px;margin-top:24px}";
  h+="table{width:100%;border-collapse:collapse;margin:10px 0}td,th{padding:8px 12px;border:1px solid #ddd;font-size:12px}th{background:#f5f5f5}";
  h+=".card{background:#f9f9f9;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin:10px 0}";
  h+=".metric{display:inline-block;padding:8px 16px;margin:4px;border-radius:6px;background:#f0f0f0;font-size:13px}";
  h+=".accent{color:"+accent+"}@media print{body{padding:10px}}</style></head><body>";

  if(WS_STATE.reportLogo)h+='<img src="'+WS_STATE.reportLogo+'" style="max-height:50px;margin-bottom:10px" />';
  h+="<h1>"+title+"</h1>";
  h+='<p style="color:#666;font-size:11px">Generated '+new Date().toLocaleDateString()+" by DubaiVal.com</p>";

  WS_STATE.reportSections.forEach(function(sid){
    var sec=WS_REPORT_SECTIONS.find(function(s){return s.id===sid;});
    if(!sec)return;
    h+="<h2>"+sec.icon+" "+sec.label+"</h2>";

    if(sid==="valuation"&&analyzerState.val){
      var v=analyzerState.val;var f=analyzerState.f;
      h+='<div class="card"><table>';
      h+="<tr><td>Property</td><td>"+(f.building||"")+" "+f.area+"</td></tr>";
      h+="<tr><td>Size</td><td>"+(f.size||f.buaSize||"N/A")+" sqft</td></tr>";
      h+="<tr><td>Asking Price</td><td>AED "+(parseInt(f.price)||0).toLocaleString()+"</td></tr>";
      h+='<tr><td>Fair Price</td><td class="accent">AED '+v.fairPrice.toLocaleString()+"</td></tr>";
      h+="<tr><td>Verdict</td><td><strong>"+v.verdict+"</strong></td></tr>";
      h+="<tr><td>Confidence</td><td>"+v.confScore+"%</td></tr>";
      h+="<tr><td>Gross Yield</td><td>"+v.grossYield+"%</td></tr>";
      h+="<tr><td>Signal</td><td>"+(v.investSignal?v.investSignal.label:"N/A")+"</td></tr>";
      h+="</table></div>";
    }else if(sid==="areastats"){
      h+='<table><tr><th>Area</th><th>PSF</th><th>Yield</th><th>Growth 1Y</th><th>DOM</th></tr>';
      var aKeys=Object.keys(AREAS).slice(0,30);
      aKeys.forEach(function(k){var a=AREAS[k];var y=a.y||[5,7];var g=a.g||[10];
        h+="<tr><td>"+k+"</td><td>AED "+(a.psf||0).toLocaleString()+"</td><td>"+((y[0]+y[1])/2).toFixed(1)+"%</td><td>"+(g[0]||0)+"%</td><td>"+(a.dom||"—")+"</td></tr>";
      });
      h+="</table><p style='color:#999;font-size:10px'>Showing top 30 of "+Object.keys(AREAS).length+" areas</p>";
    }else if(sid==="portfolio"){
      var ps=window.PORTFOLIO_STATE;
      if(ps&&ps.assets.length>0){
        var metrics=ps.assets.map(function(a){return Object.assign({},a,{m:computeAssetMetrics(a)});});
        var tv=metrics.reduce(function(s,a){return s+a.m.currentValue;},0);
        h+='<div class="card"><span class="metric">Total Value: AED '+tv.toLocaleString()+"</span>";
        h+='<span class="metric">Assets: '+ps.assets.length+"</span></div>";
        h+="<table><tr><th>Building</th><th>Area</th><th>Value</th><th>ROI</th><th>Yield</th></tr>";
        metrics.forEach(function(a){h+="<tr><td>"+(a.building||"")+"</td><td>"+a.area+"</td><td>AED "+a.m.currentValue.toLocaleString()+"</td><td>"+a.m.roi.toFixed(1)+"%</td><td>"+a.m.grossYield.toFixed(1)+"%</td></tr>";});
        h+="</table>";
      }else h+="<p>No portfolio assets.</p>";
    }else if(sid==="marketcmp"||sid==="neighborhood"){
      h+='<p>Compare areas at <a href="https://www.dubaival.com">dubaival.com</a> → Market Index → Neighborhood Comparison</p>';
    }else{
      h+='<p style="color:#999">Section data available in the live app at dubaival.com</p>';
    }
  });

  h+='<hr style="margin-top:30px;border-color:#eee"><p style="color:#999;font-size:10px;text-align:center">Generated by DubaiVal.com · '+new Date().toLocaleDateString()+" · dubaival.com</p>";
  h+="</body></html>";
  w.document.write(h);w.document.close();
  setTimeout(function(){w.print();},500);
}

// Load logo from localStorage
try{var _rl=localStorage.getItem("dv_report_logo");if(_rl)WS_STATE.reportLogo=_rl;}catch(e){}
