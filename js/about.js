// --- ABOUT TAB ---------------------------------------------------------------
function renderAbout(){
  var cl=C();
  var wrap=div({maxWidth:"820px",margin:"0 auto",padding:"30px 20px",fontFamily:"'Space Grotesk',monospace"});

  // Hero / Mission
  var hero=div({textAlign:"center",marginBottom:"40px"});
  hero.appendChild(el("img",{src:"logo.png",alt:"DubAIVal",style:{width:"64px",height:"64px",borderRadius:"14px",margin:"0 auto 16px",display:"block",objectFit:"contain"}}));
  hero.appendChild(el("h1",{style:{color:cl.gold,fontSize:"22px",fontWeight:"700",margin:"0 0 8px",letterSpacing:"0.04em"}},t("abt_mission")));
  hero.appendChild(el("p",{style:{color:cl.sub,fontSize:"13px",lineHeight:"1.7",maxWidth:"560px",margin:"0 auto"}},"DubAIVal is an independent AI valuation platform built to bring data-driven clarity to one of the world’s most dynamic property markets."));
  wrap.appendChild(hero);

  // Stats row
  var stats=[
    {n:"6,800+",l:"Buildings Tracked"},
    {n:"287",l:"Areas Covered"},
    {n:"3 Sectors",l:"Residential · Commercial · Land"},
    {n:"Cascade AVM",l:"AI Valuation Engine"}
  ];
  var statsRow=div({display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"14px",marginBottom:"40px"});
  stats.forEach(function(s){
    var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"20px 16px",textAlign:"center"});
    card.appendChild(el("div",{style:{color:cl.gold,fontSize:"22px",fontWeight:"700",marginBottom:"4px"}},s.n));
    card.appendChild(el("div",{style:{color:cl.sub,fontSize:"11px",letterSpacing:"0.06em",textTransform:"uppercase"}},s.l));
    statsRow.appendChild(card);
  });
  wrap.appendChild(statsRow);

  // Section helper
  function section(icon,title,body){
    var sec=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"24px",marginBottom:"20px"});
    sec.appendChild(el("div",{style:{color:cl.gold,fontSize:"13px",fontWeight:"700",marginBottom:"12px",letterSpacing:"0.06em"}},icon+" "+title));
    if(typeof body==="string"){
      var p=el("p",{style:{color:cl.text,fontSize:"12.5px",lineHeight:"1.75",margin:"0"}});
      p.innerHTML=body;
      sec.appendChild(p);
    }else{
      sec.appendChild(body);
    }
    return sec;
  }

  // What We Do
  var features=[
    {icon:"🔍",title:"AI Property Valuation",desc:"Cascade AVM engine with hedonic pricing model — building-level data, view premiums, floor adjustments, location intelligence, and confidence scoring."},
    {icon:"🤝",title:"Deal Network",desc:"Agent-to-agent marketplace with title deed verification, privacy-first media gallery, and buyer approval workflow."},
    {icon:"💼",title:"Portfolio Manager",desc:"Track your assets, monitor ROI, run what-if simulations, and get AI-powered portfolio health analysis."},
    {icon:"🗺️",title:"Interactive Map",desc:"Explore 287 areas with growth, yield, price, liquidity, and location intelligence metrics on a live map."},
    {icon:"📈",title:"Market Intelligence",desc:"Real-time market data, comparable analysis, rental benchmarks, and investment signals for every area."},
    {icon:"📍",title:"Location Intelligence",desc:"Metro proximity, amenity scoring, and geographic premiums powered by 56 metro stations and 30+ key POIs."},
    {icon:"🏢",title:"Commercial Valuation",desc:"Office, retail, and warehouse valuation with commercial yield models, tenant analysis, and occupancy benchmarks across Dubai's business districts."},
    {icon:"🌍",title:"Land Valuation",desc:"Plot and land valuation with zoning analysis, FAR/plot ratio calculations, development feasibility, and comparable land transaction data."}
  ];
  var featGrid=div({display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"12px"});
  features.forEach(function(f){
    var card=div({background:cl.bg,border:"1px solid "+cl.border,borderRadius:"10px",padding:"16px"});
    card.appendChild(el("div",{style:{fontSize:"20px",marginBottom:"8px"}},f.icon));
    card.appendChild(el("div",{style:{color:cl.text,fontSize:"12px",fontWeight:"700",marginBottom:"6px"}},f.title));
    card.appendChild(el("div",{style:{color:cl.sub,fontSize:"11px",lineHeight:"1.65"}},f.desc));
    featGrid.appendChild(card);
  });
  wrap.appendChild(section("✨","What We Do",featGrid));

  // Technology
  var techItems=[
    "<b style='color:"+cl.gold+"'>Cascade AVM Engine</b> — Multi-layer valuation: building database → area benchmarks → hedonic adjustments → comparable analysis → live market enrichment.",
    "<b style='color:"+cl.gold+"'>6,800+ Building Database</b> — DLD-verified transaction data covering apartments, villas, townhouses, penthouses, offices, retail spaces, and land plots across Dubai.",
    "<b style='color:"+cl.gold+"'>Hedonic Pricing Model</b> — 10+ adjustment factors: view premium, floor level, loft, penthouse, maid’s room, furnishing, private pool, location score, and more.",
    "<b style='color:"+cl.gold+"'>Location Intelligence</b> — Haversine-based proximity scoring for 56 metro stations, 11 tram stops, 30+ POIs. Geographic premium from -3% to +8%.",
    "<b style='color:"+cl.gold+"'>Real-Time Market Data</b> — Live listings integration via UAE property APIs for price validation and comparable analysis."
  ];
  var techList=div({});
  techItems.forEach(function(t){
    var row=div({display:"flex",gap:"10px",marginBottom:"10px",alignItems:"flex-start"});
    row.appendChild(el("div",{style:{color:cl.gold,fontSize:"8px",marginTop:"5px",flexShrink:"0"}},"◆"));
    var txt=el("div",{style:{color:cl.text,fontSize:"12px",lineHeight:"1.7"}});
    txt.innerHTML=t;
    row.appendChild(txt);
    techList.appendChild(row);
  });
  wrap.appendChild(section("⚙️","Technology",techList));

  // For Partners & Government
  var partnerContent=div({});
  var pText=el("p",{style:{color:cl.text,fontSize:"12.5px",lineHeight:"1.75",margin:"0 0 16px"}});
  pText.innerHTML="DubAIVal is built for transparency and is ready to collaborate with <b style='color:"+cl.gold+"'>Dubai Land Department (DLD)</b>, <b style='color:"+cl.gold+"'>RERA</b>, and government entities to enhance market transparency, support regulatory frameworks, and provide AI-driven property intelligence at scale.";
  partnerContent.appendChild(pText);

  var partnerPoints=[
    "API integration for institutional property valuation",
    "Bulk AVM reports for portfolio assessment",
    "Market transparency dashboards for regulatory bodies",
    "White-label valuation engine for government platforms"
  ];
  partnerPoints.forEach(function(pp){
    var row=div({display:"flex",gap:"8px",marginBottom:"6px",alignItems:"center"});
    row.appendChild(el("div",{style:{color:"#00C896",fontSize:"10px"}},"✓"));
    row.appendChild(el("div",{style:{color:cl.sub,fontSize:"11.5px"}},pp));
    partnerContent.appendChild(row);
  });

  var contactBtn=el("a",{href:"mailto:momeni.yashar@gmail.com?subject=DubAIVal%20Partnership%20Inquiry",style:{display:"inline-flex",alignItems:"center",gap:"8px",marginTop:"18px",padding:"12px 28px",background:"linear-gradient(135deg,"+cl.gold+",#B8860B)",color:"#0D1220",borderRadius:"10px",fontSize:"12.5px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",textDecoration:"none",cursor:"pointer",border:"none",letterSpacing:"0.03em"}},"✉️ Contact Us for Partnership");
  partnerContent.appendChild(contactBtn);

  var apiBtn=el("button",{style:{display:"inline-flex",alignItems:"center",gap:"6px",marginTop:"10px",marginLeft:"10px",padding:"12px 24px",background:"transparent",border:"1px solid "+cl.goldDim,color:cl.gold,borderRadius:"10px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",letterSpacing:"0.03em"}});
  apiBtn.textContent="📡 API Documentation →";
  apiBtn.addEventListener("click",function(){window._showApiDocs=true;render();});
  partnerContent.appendChild(apiBtn);
  wrap.appendChild(section("🏛️",t("abt_partners"),partnerContent));

  // API Documentation (inline)
  if(window._showApiDocs){
    wrap.appendChild(renderApiDocs(cl));
  }

  // Platform Roadmap
  var roadmapContent=div({});
  var roadmapIntro=el("p",{style:{color:cl.text,fontSize:"12.5px",lineHeight:"1.75",margin:"0 0 20px"}});
  roadmapIntro.innerHTML="DubAIVal is expanding from residential into <b style='color:"+cl.gold+"'>commercial real estate</b> and <b style='color:"+cl.gold+"'>land valuation</b> — building the most comprehensive AI-powered property intelligence platform in the UAE.";
  roadmapContent.appendChild(roadmapIntro);

  var phases=[
    {phase:"Phase 1",status:"✅ Live",title:"Residential Valuation",color:"#00C896",items:["6,800+ building database with DLD-verified data","Cascade AVM engine with hedonic pricing","287 area benchmarks with yield, growth & liquidity","Portfolio Manager with health score & projections","Deal Network with agent marketplace","Interactive map, market index & live dashboard","PWA with offline support"]},
    {phase:"Phase 2",status:"🔧 In Development",title:"Commercial Property Valuation",color:cl.gold,items:["Office space valuation (shell & core, fitted, furnished)","Retail unit valuation with footfall & visibility scoring","Warehouse & logistics facility assessment","Commercial yield models (net vs gross, triple net)","Tenant quality scoring & lease analysis","EJARI commercial rent benchmarks","Occupancy rate tracking by district","Commercial deal network for brokers"]},
    {phase:"Phase 3",status:"🔧 In Development",title:"Land & Plot Valuation",color:"#818CF8",items:["Freehold & leasehold plot valuation","Zoning classification & permitted use analysis","FAR (Floor Area Ratio) & plot ratio calculations","Development feasibility & highest-best-use analysis","Infrastructure proximity scoring (roads, utilities, metro)","Comparable land transaction database","Master plan overlay & future development impact","Government land auction tracking"]},
    {phase:"Phase 4",status:"📋 Planned",title:"Enterprise & Government Solutions",color:"#F0A030",items:["White-label valuation API for government platforms","Bulk AVM reports for institutional portfolios","Market transparency dashboards for DLD & RERA","Anti-money laundering (AML) property screening","Automated mortgage valuation for banks","Real-time market surveillance & anomaly detection"]}
  ];

  phases.forEach(function(ph){
    var phCard=div({background:cl.bg,border:"1px solid "+cl.border,borderRadius:"12px",padding:"18px",marginBottom:"14px"});
    var phHead=div({display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px",flexWrap:"wrap"});
    phHead.appendChild(span({color:ph.color,fontSize:"10px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",padding:"3px 10px",borderRadius:"6px",background:hexAlpha(ph.color,0.12),letterSpacing:"0.06em"},ph.phase));
    phHead.appendChild(span({color:cl.text,fontSize:"13px",fontWeight:"700"},ph.title));
    phHead.appendChild(span({color:ph.color,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},ph.status));
    phCard.appendChild(phHead);
    var phGrid=div({display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"4px"});
    ph.items.forEach(function(item){
      var row=div({display:"flex",gap:"8px",alignItems:"center"});
      row.appendChild(span({color:ph.color,fontSize:"8px"},"◆"));
      row.appendChild(span({color:cl.sub,fontSize:"11px",lineHeight:"1.6"},item));
      phGrid.appendChild(row);
    });
    phCard.appendChild(phGrid);
    roadmapContent.appendChild(phCard);
  });

  wrap.appendChild(section("🗺️","Platform Roadmap",roadmapContent));

  // Commercial Valuation Detail
  var commContent=div({});
  var commIntro=el("p",{style:{color:cl.text,fontSize:"12.5px",lineHeight:"1.75",margin:"0 0 16px"}});
  commIntro.innerHTML="Our commercial valuation engine is designed for <b style='color:"+cl.gold+"'>offices, retail spaces, warehouses, and mixed-use properties</b> across Dubai's major business districts — DIFC, Business Bay, DMCC, DAFZ, Dubai South, and more.";
  commContent.appendChild(commIntro);

  var commFeatures=[
    {icon:"🏛️",t:"Office Valuation",d:"Shell & core, fitted, and furnished office valuations with per-sqft benchmarks, view premiums, and building grade analysis."},
    {icon:"🛍️",t:"Retail Valuation",d:"Ground floor vs upper floor pricing, footfall analysis, street visibility scoring, and mall vs high-street benchmarks."},
    {icon:"🏭",t:"Industrial & Logistics",d:"Warehouse, cold storage, and logistics facility assessments with loading capacity, height clearance, and location scoring."},
    {icon:"📊",t:"Commercial Yield Analysis",d:"Net yield, gross yield, triple-net calculations, CAP rate benchmarks, and lease-adjusted valuations."}
  ];
  var commGrid=div({display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"12px"});
  commFeatures.forEach(function(cf){
    var cCard=div({background:cl.bg,border:"1px solid "+cl.border,borderRadius:"10px",padding:"16px"});
    cCard.appendChild(el("div",{style:{fontSize:"20px",marginBottom:"8px"}},cf.icon));
    cCard.appendChild(el("div",{style:{color:cl.text,fontSize:"12px",fontWeight:"700",marginBottom:"6px"}},cf.t));
    cCard.appendChild(el("div",{style:{color:cl.sub,fontSize:"11px",lineHeight:"1.65"}},cf.d));
    commGrid.appendChild(cCard);
  });
  commContent.appendChild(commGrid);

  var commBadge=div({display:"inline-flex",alignItems:"center",gap:"6px",marginTop:"16px",padding:"8px 16px",borderRadius:"8px",background:hexAlpha(cl.gold,0.1),border:"1px solid "+cl.goldDim});
  commBadge.appendChild(span({color:cl.gold,fontSize:"11px",fontWeight:"700"},"🔧 In Development — Launching Q4 2026"));
  commContent.appendChild(commBadge);

  wrap.appendChild(section("🏢","Commercial Property Valuation",commContent));

  // Land Valuation Detail
  var landContent=div({});
  var landIntro=el("p",{style:{color:cl.text,fontSize:"12.5px",lineHeight:"1.75",margin:"0 0 16px"}});
  landIntro.innerHTML="Comprehensive <b style='color:"+cl.gold+"'>land and plot valuation</b> covering freehold plots, leasehold land, mixed-use parcels, and development sites across all designated freehold areas in Dubai.";
  landContent.appendChild(landIntro);

  var landFeatures=[
    {icon:"📐",t:"Plot Analysis",d:"Size, shape factor, corner premium, road frontage, setback compliance, and buildable area calculations."},
    {icon:"🏗️",t:"Development Feasibility",d:"FAR analysis, permitted floors, GFA calculations, estimated construction cost, and projected GDV (Gross Development Value)."},
    {icon:"📋",t:"Zoning & Permits",d:"Land use classification, permitted activities, height restrictions, and master plan compliance verification."},
    {icon:"📈",t:"Land Market Intelligence",d:"Comparable land transactions, price per sqft trends, absorption rates, and upcoming infrastructure impact analysis."}
  ];
  var landGrid=div({display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"12px"});
  landFeatures.forEach(function(lf){
    var lCard=div({background:cl.bg,border:"1px solid "+cl.border,borderRadius:"10px",padding:"16px"});
    lCard.appendChild(el("div",{style:{fontSize:"20px",marginBottom:"8px"}},lf.icon));
    lCard.appendChild(el("div",{style:{color:cl.text,fontSize:"12px",fontWeight:"700",marginBottom:"6px"}},lf.t));
    lCard.appendChild(el("div",{style:{color:cl.sub,fontSize:"11px",lineHeight:"1.65"}},lf.d));
    landGrid.appendChild(lCard);
  });
  landContent.appendChild(landGrid);

  var landBadge=div({display:"inline-flex",alignItems:"center",gap:"6px",marginTop:"16px",padding:"8px 16px",borderRadius:"8px",background:hexAlpha("#818CF8",0.1),border:"1px solid "+"#818CF840"});
  landBadge.appendChild(span({color:"#818CF8",fontSize:"11px",fontWeight:"700"},"🔧 In Development — Launching Q1 2027"));
  landContent.appendChild(landBadge);

  wrap.appendChild(section("🌍","Land & Plot Valuation",landContent));

  // Footer note
  var footer=div({textAlign:"center",marginTop:"30px",padding:"20px",borderTop:"1px solid "+cl.border});
  footer.appendChild(el("div",{style:{color:cl.sub,fontSize:"10px",lineHeight:"1.7"}},"Built with ❤️ in Dubai · DubAIVal · June 2026"));
  footer.appendChild(el("div",{style:{color:cl.sub,fontSize:"9px",marginTop:"4px"}},"Not financial advice — consult a licensed advisor for investment decisions."));
  wrap.appendChild(footer);

  return wrap;
}

function renderApiDocs(cl){
  if(!cl)cl=C();
  var wrap=div({});

  var codeBg="#0A0F1A";
  var codeBorder="#1C2540";
  var kw="#C9A84C";var str="#10B981";var cmt="#4B5563";var num="#818CF8";

  function codeBlock(lang,code){
    var block=div({background:codeBg,border:"1px solid "+codeBorder,borderRadius:"10px",overflow:"hidden",marginBottom:"12px"});
    var header=div({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 12px",borderBottom:"1px solid "+codeBorder,background:"rgba(255,255,255,0.02)"});
    header.appendChild(span({color:cmt,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",textTransform:"uppercase",letterSpacing:"0.08em"},lang));
    var copyBtn=el("button",{style:{background:"transparent",border:"none",color:cmt,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",padding:"2px 6px"}});
    copyBtn.textContent="Copy";
    copyBtn.addEventListener("click",function(){try{navigator.clipboard.writeText(code);copyBtn.textContent="Copied ✓";setTimeout(function(){copyBtn.textContent="Copy";},1500);}catch(e){}});
    header.appendChild(copyBtn);
    block.appendChild(header);
    var pre=el("pre",{style:{margin:"0",padding:"12px",overflow:"auto",fontSize:"11px",lineHeight:"1.7",fontFamily:"'SF Mono','Fira Code',monospace",color:"#E8EDF5",whiteSpace:"pre-wrap",wordBreak:"break-all"}});
    pre.textContent=code;
    block.appendChild(pre);
    return block;
  }

  function badge(text,color){
    return span({color:color||kw,fontSize:"8px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",padding:"2px 8px",borderRadius:"10px",background:hexAlpha(color||kw,0.12),letterSpacing:"0.06em",marginLeft:"8px"},text);
  }

  // API Header
  var apiHeader=div({textAlign:"center",marginBottom:"24px",paddingTop:"10px"});
  apiHeader.appendChild(el("div",{style:{fontSize:"28px",marginBottom:"8px"}},"📡"));
  apiHeader.appendChild(el("h2",{style:{color:cl.gold,fontSize:"18px",fontWeight:"800",margin:"0 0 4px",fontFamily:"'Space Grotesk',monospace"}},"DubaiVal API"));
  apiHeader.appendChild(el("div",{style:{color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif"}},"Real Estate Intelligence for Developers"));
  wrap.appendChild(apiHeader);

  // Base URL
  var baseCard=div({background:codeBg,border:"1px solid "+codeBorder,borderRadius:"10px",padding:"12px 16px",marginBottom:"20px",textAlign:"center"});
  baseCard.appendChild(span({color:cmt,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"BASE URL"));
  baseCard.appendChild(span({color:str,fontSize:"14px",fontWeight:"700",fontFamily:"'SF Mono','Fira Code',monospace"},"https://api.dubaival.com/v1"));
  wrap.appendChild(baseCard);

  // Endpoints
  var endpoints=[
    {
      method:"GET",path:"/api/valuation",
      desc:"Get AI-powered property valuation with confidence scoring and investment signals.",
      params:[{n:"area",t:"string",r:true,d:"Area name (e.g. Dubai Marina)"},{n:"building",t:"string",r:false,d:"Building name"},{n:"size_sqft",t:"integer",r:true,d:"Property size in sqft"},{n:"price",t:"integer",r:true,d:"Asking price in AED"},{n:"beds",t:"string",r:false,d:"e.g. 2 BR, Studio"}],
      response:'{\n  "fair_price": 2850000,\n  "psf": 1425,\n  "verdict": "GOOD",\n  "confidence": 87,\n  "gross_yield": 6.8,\n  "net_yield": 5.2,\n  "signal": "Fair Value",\n  "suggested_offer": 2750000\n}',
      curl:'curl "https://api.dubaival.com/v1/valuation?area=Dubai+Marina&size_sqft=2000&price=3000000&beds=2+BR" \\\n  -H "Authorization: Bearer YOUR_API_KEY"',
      js:'const res = await fetch(\n  "https://api.dubaival.com/v1/valuation?" +\n  new URLSearchParams({\n    area: "Dubai Marina",\n    size_sqft: 2000,\n    price: 3000000,\n    beds: "2 BR"\n  }),\n  { headers: { Authorization: "Bearer YOUR_API_KEY" } }\n);\nconst data = await res.json();'
    },
    {
      method:"GET",path:"/api/market-index",
      desc:"Get market overview with area rankings, average metrics, and top performers.",
      params:[{n:"area",t:"string",r:false,d:"Filter by area (omit for city-wide)"}],
      response:'{\n  "avg_psf": 1680,\n  "avg_yield": 6.2,\n  "avg_growth_1yr": 12.4,\n  "avg_dom": 52,\n  "total_areas": 287,\n  "top_yield": ["International City", ...],\n  "top_growth": ["Dubai Hills Estate", ...]\n}',
      curl:'curl "https://api.dubaival.com/v1/market-index" \\\n  -H "Authorization: Bearer YOUR_API_KEY"',
      js:'const res = await fetch(\n  "https://api.dubaival.com/v1/market-index",\n  { headers: { Authorization: "Bearer YOUR_API_KEY" } }\n);\nconst data = await res.json();'
    },
    {
      method:"GET",path:"/api/building-lookup",
      desc:"Look up building data from our 6,800+ building DLD-verified database.",
      params:[{n:"name",t:"string",r:true,d:"Building name (fuzzy matching)"}],
      response:'{\n  "name": "Marina Gate 1",\n  "area": "Dubai Marina",\n  "psf": 1850,\n  "low_psf": 1650,\n  "high_psf": 2100,\n  "grade": "A",\n  "service_charge": 18\n}',
      curl:'curl "https://api.dubaival.com/v1/building-lookup?name=marina+gate+1" \\\n  -H "Authorization: Bearer YOUR_API_KEY"',
      js:'const res = await fetch(\n  "https://api.dubaival.com/v1/building-lookup?" +\n  new URLSearchParams({ name: "Marina Gate 1" }),\n  { headers: { Authorization: "Bearer YOUR_API_KEY" } }\n);\nconst data = await res.json();'
    },
    {
      method:"GET",path:"/api/area-compare",
      desc:"Side-by-side comparison of two areas across all key metrics.",
      params:[{n:"area1",t:"string",r:true,d:"First area"},{n:"area2",t:"string",r:true,d:"Second area"}],
      response:'{\n  "area1": {\n    "name": "Dubai Marina",\n    "psf": 1850, "yield": 6.5,\n    "growth_1yr": 14, "dom": 35\n  },\n  "area2": {\n    "name": "JVC",\n    "psf": 980, "yield": 8.2,\n    "growth_1yr": 18, "dom": 28\n  },\n  "verdict": "area2_better_value"\n}',
      curl:'curl "https://api.dubaival.com/v1/area-compare?area1=Dubai+Marina&area2=JVC" \\\n  -H "Authorization: Bearer YOUR_API_KEY"',
      js:'const res = await fetch(\n  "https://api.dubaival.com/v1/area-compare?" +\n  new URLSearchParams({\n    area1: "Dubai Marina",\n    area2: "JVC"\n  }),\n  { headers: { Authorization: "Bearer YOUR_API_KEY" } }\n);\nconst data = await res.json();'
    }
  ];

  wrap.appendChild(el("div",{style:{color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"14px"}},"◆ Endpoints"));

  endpoints.forEach(function(ep){
    var epCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"16px"});
    // Method + Path + Badge
    var epHead=div({display:"flex",alignItems:"center",flexWrap:"wrap",gap:"8px",marginBottom:"10px"});
    epHead.appendChild(span({color:"#10B981",fontSize:"10px",fontWeight:"800",fontFamily:"'SF Mono',monospace",padding:"3px 8px",borderRadius:"4px",background:hexAlpha("#10B981",0.12)},ep.method));
    epHead.appendChild(span({color:cl.text,fontSize:"13px",fontWeight:"700",fontFamily:"'SF Mono','Fira Code',monospace"},ep.path));
    epHead.appendChild(badge("Coming Q3 2026","#818CF8"));
    epCard.appendChild(epHead);
    epCard.appendChild(el("div",{style:{color:cl.sub,fontSize:"11.5px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",marginBottom:"14px"}},ep.desc));

    // Parameters
    epCard.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"6px"},"PARAMETERS"));
    var paramTable=div({marginBottom:"14px"});
    ep.params.forEach(function(p){
      var pRow=div({display:"grid",gridTemplateColumns:"100px 60px 40px 1fr",gap:"6px",padding:"4px 8px",borderBottom:"1px solid "+hexAlpha(cl.border,0.5),alignItems:"center"});
      pRow.appendChild(span({color:str,fontSize:"11px",fontFamily:"'SF Mono',monospace"},p.n));
      pRow.appendChild(span({color:num,fontSize:"10px",fontFamily:"'SF Mono',monospace"},p.t));
      pRow.appendChild(span({color:p.r?"#EF4444":cmt,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},p.r?"req":"opt"));
      pRow.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},p.d));
      paramTable.appendChild(pRow);
    });
    epCard.appendChild(paramTable);

    // Response
    epCard.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"6px"},"RESPONSE"));
    epCard.appendChild(codeBlock("JSON",ep.response));

    // Code samples toggle
    if(!window._apiCodeTab)window._apiCodeTab={};
    if(!window._apiCodeTab[ep.path])window._apiCodeTab[ep.path]="curl";
    var codeTabRow=div({display:"flex",gap:"6px",marginBottom:"8px"});
    ["curl","javascript"].forEach(function(lang){
      var active=window._apiCodeTab[ep.path]===lang;
      var tb=el("button",{style:{padding:"4px 12px",borderRadius:"6px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",border:"1px solid "+(active?cl.gold:cl.border),background:active?hexAlpha(cl.gold,0.1):"transparent",color:active?cl.gold:cl.sub}});
      tb.textContent=lang==="curl"?"cURL":"JavaScript";
      tb.addEventListener("click",function(){window._apiCodeTab[ep.path]=lang;render();});
      codeTabRow.appendChild(tb);
    });
    epCard.appendChild(codeTabRow);
    epCard.appendChild(codeBlock(window._apiCodeTab[ep.path]==="curl"?"bash":"javascript",window._apiCodeTab[ep.path]==="curl"?ep.curl:ep.js));

    wrap.appendChild(epCard);
  });

  // Pricing Plans
  wrap.appendChild(el("div",{style:{color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"14px"}},"◆ Pricing Plans"));
  var plans=[
    {name:"Free",price:"$0",period:"/month",calls:"100 calls/day",features:["Valuation endpoint","Building lookup","Community support"],color:cl.sub,highlight:false},
    {name:"Pro",price:"$99",period:"/month",calls:"10,000 calls/day",features:["All endpoints","Market index","Area comparison","Priority support","Webhook alerts"],color:cl.gold,highlight:true},
    {name:"Enterprise",price:"Custom",period:"",calls:"Unlimited",features:["All Pro features","Dedicated infrastructure","Custom endpoints","SLA guarantee","On-premise option","Direct engineering support"],color:"#818CF8",highlight:false}
  ];
  var planGrid=div({display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"14px",marginBottom:"20px"});
  plans.forEach(function(p){
    var pCard=div({background:cl.surface,border:p.highlight?"2px solid "+cl.gold:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",textAlign:"center",position:"relative"});
    if(p.highlight){pCard.appendChild(div({position:"absolute",top:"-1px",left:"50%",transform:"translateX(-50%)",background:cl.gold,color:"#070B14",fontSize:"8px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",padding:"2px 12px",borderRadius:"0 0 8px 8px",letterSpacing:"0.08em"},"POPULAR"));}
    pCard.appendChild(el("div",{style:{color:p.color,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"}},p.name));
    pCard.appendChild(el("div",{style:{color:cl.text,fontSize:"28px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"}},p.price));
    if(p.period)pCard.appendChild(el("div",{style:{color:cl.sub,fontSize:"10px",marginBottom:"8px"}},p.period));
    pCard.appendChild(el("div",{style:{color:p.color,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",padding:"4px 12px",borderRadius:"8px",background:hexAlpha(p.color,0.1),display:"inline-block",marginBottom:"12px"}},p.calls));
    p.features.forEach(function(ft){
      pCard.appendChild(div({display:"flex",alignItems:"center",gap:"6px",justifyContent:"center",marginBottom:"4px"},[
        span({color:"#10B981",fontSize:"10px"},"✓"),
        span({color:cl.sub,fontSize:"10.5px",fontFamily:"'Inter',sans-serif"},ft)
      ]));
    });
    planGrid.appendChild(pCard);
  });
  wrap.appendChild(planGrid);

  // Request API Access
  wrap.appendChild(el("div",{style:{color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"14px"}},"◆ Request API Access"));
  var reqCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px"});
  if(!window._apiReq)window._apiReq={name:"",email:"",company:"",useCase:""};
  var rq=window._apiReq;
  function apiInput(label,key,ph,type){
    var w=div({marginBottom:"10px"});
    w.appendChild(el("div",{style:{color:cl.sub,fontSize:"9px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"}},label));
    var inp=el("input",{type:type||"text",placeholder:ph,style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"10px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
    inp.value=rq[key]||"";
    inp.addEventListener("input",function(){rq[key]=this.value;});
    w.appendChild(inp);
    return w;
  }
  var reqGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"});
  reqGrid.appendChild(apiInput("Name *","name","Your name"));
  reqGrid.appendChild(apiInput("Email *","email","you@company.com","email"));
  reqGrid.appendChild(apiInput("Company","company","Company name"));
  reqGrid.appendChild(apiInput("Use Case","useCase","e.g. Portfolio management tool"));
  reqCard.appendChild(reqGrid);
  var submitBtn=el("a",{href:"",style:{display:"block",width:"100%",padding:"13px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,"+cl.gold+",#B8860B)",color:"#0D1220",fontSize:"13px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",textAlign:"center",textDecoration:"none",boxSizing:"border-box",cursor:"pointer",marginTop:"6px",letterSpacing:"0.04em"}});
  submitBtn.textContent="Request API Access →";
  submitBtn.addEventListener("click",function(e){
    e.preventDefault();
    if(!rq.name||!rq.email){alert("Please fill name and email");return;}
    var subject=encodeURIComponent("DubaiVal API Access Request — "+rq.company);
    var body=encodeURIComponent("Name: "+rq.name+"\nEmail: "+rq.email+"\nCompany: "+rq.company+"\nUse Case: "+rq.useCase);
    window.open("mailto:momeni.yashar@gmail.com?subject="+subject+"&body="+body,"_self");
  });
  reqCard.appendChild(submitBtn);
  reqCard.appendChild(el("div",{style:{color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",textAlign:"center",marginTop:"8px"}},"We'll respond within 24 hours with your API key and documentation."));
  wrap.appendChild(reqCard);

  // Take Tour Again
  var tourRow=div({display:"flex",gap:"10px",justifyContent:"center",marginTop:"30px",flexWrap:"wrap"});
  var tqBtn=el("button",{style:{background:"transparent",border:"2px solid "+cl.gold,color:cl.gold,padding:"12px 22px",borderRadius:"12px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  tqBtn.textContent="🎯 Quick Tour (8 steps)";
  tqBtn.addEventListener("click",function(){try{localStorage.removeItem("dv_tour_done");}catch(e){}startTour("quick");});
  var tfBtn=el("button",{style:{background:"linear-gradient(135deg,"+cl.gold+",#7A5E28)",border:"none",color:"#08090C",padding:"12px 22px",borderRadius:"12px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  tfBtn.textContent="🚀 Full Tour (16 steps)";
  tfBtn.addEventListener("click",function(){try{localStorage.removeItem("dv_full_tour_done");}catch(e){}startTour("full");});
  tourRow.appendChild(tqBtn);tourRow.appendChild(tfBtn);
  wrap.appendChild(tourRow);

  return wrap;
}
