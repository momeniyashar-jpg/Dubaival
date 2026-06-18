// --- ABOUT TAB ---------------------------------------------------------------
function renderAbout(){
  var cl=C();
  var wrap=div({maxWidth:"820px",margin:"0 auto",padding:"30px 20px",fontFamily:"'Space Grotesk',monospace"});

  // Hero / Mission
  var hero=div({textAlign:"center",marginBottom:"40px"});
  hero.appendChild(el("img",{src:"logo.png",alt:"DubAIVal",style:{width:"64px",height:"64px",borderRadius:"14px",margin:"0 auto 16px",display:"block",objectFit:"contain"}}));
  hero.appendChild(el("h1",{style:{color:cl.gold,fontSize:"22px",fontWeight:"700",margin:"0 0 8px",letterSpacing:"0.04em"}},"Bringing AI-Powered Transparency to Dubai Real Estate"));
  hero.appendChild(el("p",{style:{color:cl.sub,fontSize:"13px",lineHeight:"1.7",maxWidth:"560px",margin:"0 auto"}},"DubAIVal is an independent AI valuation platform built to bring data-driven clarity to one of the world’s most dynamic property markets."));
  wrap.appendChild(hero);

  // Stats row
  var stats=[
    {n:"6,162",l:"Buildings Tracked"},
    {n:"287",l:"Areas Covered"},
    {n:"Cascade AVM",l:"AI Valuation Engine"},
    {n:"24/7",l:"Real-Time Data"}
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
    {icon:"📍",title:"Location Intelligence",desc:"Metro proximity, amenity scoring, and geographic premiums powered by 56 metro stations and 30+ key POIs."}
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
    "<b style='color:"+cl.gold+"'>6,162 Building Database</b> — DLD-verified transaction data covering apartments, villas, townhouses, and penthouses across Dubai.",
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
  wrap.appendChild(section("🏛️","For Partners & Government",partnerContent));

  // Footer note
  var footer=div({textAlign:"center",marginTop:"30px",padding:"20px",borderTop:"1px solid "+cl.border});
  footer.appendChild(el("div",{style:{color:cl.sub,fontSize:"10px",lineHeight:"1.7"}},"Built with ❤️ in Dubai · DubAIVal · June 2026"));
  footer.appendChild(el("div",{style:{color:cl.sub,fontSize:"9px",marginTop:"4px"}},"Not financial advice — consult a licensed advisor for investment decisions."));
  wrap.appendChild(footer);

  return wrap;
}
