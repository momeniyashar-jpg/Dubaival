// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- OFF-PLAN PROJECTS (added 2026-07-17) ------------------------------------
// User's own framing: a place to find off-plan projects from different
// developers, with a price-growth forecast from launch->handover and
// handover->+5yr, based on (1) the area's own real growth data (AREAS[].g,
// the same trusted field every other feature in this app already relies on),
// and (2) the specific developer's own historical track record where one has
// been entered (never fabricated — stays neutral/area-only until real
// developer performance data exists, see Outstanding items in CLAUDE.md).
//
// Data lives in Supabase (offplan_projects / developer_track_record —
// supabase-offplan-schema.sql, requires manual execution), NOT a static JS
// file — unlike the residential building DB, this is a living, admin-curated
// + user-submitted dataset that needs CRUD and a review queue, not a
// recalibrated-periodically reference table.
//
// Ownership model (user-confirmed hybrid): any signed-in user can submit a
// project (lands as 'pending', invisible publicly); admin adds directly as
// already-published, or approves/rejects submissions from the Admin
// Dashboard (js/app.js renderAdmin() — same "queued, then admin-verified"
// pattern already used for OFM listing document verification).

var OFFPLAN_STATE = {
  loading: false,
  loaded: false,
  dbError: false,
  projects: [],
  devRecords: {}, // keyed by developer name
  filterArea: "",
  filterDeveloper: "",
  sort: "handover", // 'handover' | 'growth' | 'newest'
  showSubmitForm: false,
  submitting: false,
  submitError: "",
  submitOk: false,
  form: { name:"", developer:"", area:"", launchDate:"", expectedHandover:"", launchPSF:"", sizeMin:"", sizeMax:"", unitTypes:"", source:"", sourceUrl:"", notes:"" }
};

function _offplanH(){
  var token=localStorage.getItem("dv_access_token")||SUPABASE_KEY;
  return {"apikey":SUPABASE_KEY,"Authorization":"Bearer "+token,"Content-Type":"application/json"};
}

async function offplanLoad(){
  if(OFFPLAN_STATE.loading||OFFPLAN_STATE.loaded)return;
  OFFPLAN_STATE.loading=true;
  try{
    var [pRes,dRes]=await Promise.all([
      fetch(SUPABASE_URL+"/rest/v1/offplan_projects?status=eq.published&order=created_at.desc&limit=300",{headers:_offplanH()}),
      fetch(SUPABASE_URL+"/rest/v1/developer_track_record?select=*&limit=500",{headers:_offplanH()})
    ]);
    OFFPLAN_STATE.projects=pRes.ok?await pRes.json():[];
    var devArr=dRes.ok?await dRes.json():[];
    var devMap={};
    devArr.forEach(function(d){devMap[d.developer]=d;});
    OFFPLAN_STATE.devRecords=devMap;
    if(!pRes.ok||!dRes.ok)OFFPLAN_STATE.dbError=true;
  }catch(e){OFFPLAN_STATE.dbError=true;}
  OFFPLAN_STATE.loading=false;
  OFFPLAN_STATE.loaded=true;
  render();
}

// ── PREDICTION ENGINE ─────────────────────────────────────────────────────
// Reuses the same trusted AREAS[].g growth data every other feature in this
// app already relies on (Analyzer, Portfolio projections, Market Cycle) —
// no new/separate growth model invented for off-plan specifically.
function computeOffPlanForecast(project,devRecord){
  var aData=(typeof AREAS!=="undefined"&&AREAS[project.area])||{g:[10,18,28]};
  var g=aData.g||[10,18,28];
  var launch=new Date(project.launch_date);
  var handover=new Date(project.expected_handover);
  var monthsToHandover=Math.max(1,(handover.getFullYear()-launch.getFullYear())*12+(handover.getMonth()-launch.getMonth()));
  var yearsToHandover=monthsToHandover/12;
  // Annualize the 1-3yr cumulative growth figure as the construction-period proxy
  var annualGrowthDuringBuild=g[1]/2;
  var growthToHandover=Math.pow(1+annualGrowthDuringBuild/100,yearsToHandover)-1;
  var hasDevHandoverData=!!(devRecord&&devRecord.projects_tracked>=1&&devRecord.avg_growth_launch_to_handover!=null);
  if(hasDevHandoverData){
    var devImplied=devRecord.avg_growth_launch_to_handover/100;
    // Blend: area-based projection carries most of the weight (70%); the
    // developer's own historical deviation from area norms adjusts it (30%)
    // — damped so a handful of past projects can't swing the number wildly.
    growthToHandover=growthToHandover*0.7+devImplied*0.3;
  }
  var projectedHandoverPSF=Math.round(project.launch_psf*(1+growthToHandover));
  var growth5yr=(g[2]||28)/100;
  var hasDev5yrData=!!(devRecord&&devRecord.avg_growth_handover_to_5yr!=null);
  if(hasDev5yrData)growth5yr=growth5yr*0.7+(devRecord.avg_growth_handover_to_5yr/100)*0.3;
  var projected5yrPSF=Math.round(projectedHandoverPSF*(1+growth5yr));
  var confidence=hasDevHandoverData?"Medium — area growth + developer track record":"Indicative — area growth only, no developer history yet";
  return{
    launchPSF:project.launch_psf,
    projectedHandoverPSF:projectedHandoverPSF,
    projected5yrPSF:projected5yrPSF,
    growthToHandoverPct:Math.round(growthToHandover*1000)/10,
    growth5yrPct:Math.round(growth5yr*1000)/10,
    yearsToHandover:Math.round(yearsToHandover*10)/10,
    confidence:confidence,
    hasDevData:hasDevHandoverData
  };
}

function _offplanFmtDate(d){
  if(!d)return"—";
  var dt=new Date(d);
  if(isNaN(dt.getTime()))return d;
  return dt.toLocaleDateString("en-GB",{month:"short",year:"numeric"});
}

async function offplanSubmit(){
  var cl=C();
  var f=OFFPLAN_STATE.form;
  if(!f.name||!f.developer||!f.area||!f.launchDate||!f.expectedHandover||!f.launchPSF){
    OFFPLAN_STATE.submitError="Please fill in project name, developer, area, launch date, handover date, and launch PSF.";
    render();return;
  }
  if(typeof DV_AUTH==="undefined"||!DV_AUTH.user){
    DV_AUTH.showModal=true;DV_AUTH.modalTab="signin";render();return;
  }
  OFFPLAN_STATE.submitting=true;OFFPLAN_STATE.submitError="";render();
  try{
    var unitTypesArr=(f.unitTypes||"").split(",").map(function(s){return s.trim();}).filter(Boolean);
    var r=await fetch(SUPABASE_URL+"/rest/v1/rpc/submit_offplan_project",{
      method:"POST",headers:_offplanH(),
      body:JSON.stringify({
        p_name:f.name,p_developer:f.developer,p_area:f.area,
        p_launch_date:f.launchDate,p_expected_handover:f.expectedHandover,
        p_launch_psf:parseFloat(f.launchPSF)||0,
        p_unit_types:unitTypesArr,
        p_size_min:f.sizeMin?parseInt(f.sizeMin):null,
        p_size_max:f.sizeMax?parseInt(f.sizeMax):null,
        p_source:f.source||"agent-submission",p_source_url:f.sourceUrl||null,
        p_notes:f.notes||null,p_submitted_by:DV_AUTH.user.email
      })
    });
    if(r.ok){
      OFFPLAN_STATE.submitOk=true;
      OFFPLAN_STATE.form={name:"",developer:"",area:"",launchDate:"",expectedHandover:"",launchPSF:"",sizeMin:"",sizeMax:"",unitTypes:"",source:"",sourceUrl:"",notes:""};
    }else{
      OFFPLAN_STATE.submitError="Could not submit — please try again.";
    }
  }catch(e){OFFPLAN_STATE.submitError="Network error — please try again.";}
  OFFPLAN_STATE.submitting=false;render();
}

function renderOffPlan(){
  var cl=C();
  if(!OFFPLAN_STATE.loaded&&!OFFPLAN_STATE.loading)offplanLoad();
  var wrap=el("div",{style:{padding:"20px",maxWidth:"900px",margin:"0 auto",paddingBottom:"80px"}});

  var hero=el("div",{style:{marginBottom:"20px"}});
  hero.appendChild(div({fontSize:"20px",fontWeight:"700",color:"#F0F2F5",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Off-Plan Projects"));
  hero.appendChild(div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6"},"Track off-plan launches across developers with a price forecast from launch → handover → 5 years after, based on real area growth data and each developer's own track record."));
  wrap.appendChild(hero);

  // Filters
  var filterRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"16px"}});
  var areaNames=(typeof AREAS!=="undefined")?Object.keys(AREAS).sort():[];
  filterRow.appendChild(mkSelect(Object.assign({},I(),{fontSize:"12px",padding:"8px"}),[""].concat(areaNames),OFFPLAN_STATE.filterArea,function(v){OFFPLAN_STATE.filterArea=v;render();}));
  var devNames=Array.from(new Set(OFFPLAN_STATE.projects.map(function(p){return p.developer;}))).sort();
  filterRow.appendChild(mkSelect(Object.assign({},I(),{fontSize:"12px",padding:"8px"}),[""].concat(devNames),OFFPLAN_STATE.filterDeveloper,function(v){OFFPLAN_STATE.filterDeveloper=v;render();}));
  filterRow.appendChild(mkSelect(Object.assign({},I(),{fontSize:"12px",padding:"8px"}),["Handover Date","Highest Growth","Newest"],{handover:"Handover Date",growth:"Highest Growth",newest:"Newest"}[OFFPLAN_STATE.sort]||"Handover Date",function(v){OFFPLAN_STATE.sort={"Handover Date":"handover","Highest Growth":"growth","Newest":"newest"}[v]||"handover";render();}));
  wrap.appendChild(filterRow);

  // Submit CTA
  var submitBtn=el("button",{style:{width:"100%",padding:"11px",borderRadius:"10px",border:"1px solid rgba(212,175,55,0.3)",background:"rgba(212,175,55,0.08)",color:cl.gold,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",marginBottom:"16px"}});
  submitBtn.textContent=OFFPLAN_STATE.showSubmitForm?"− Hide Submit Form":"+ Submit an Off-Plan Project";
  submitBtn.addEventListener("click",function(){OFFPLAN_STATE.showSubmitForm=!OFFPLAN_STATE.showSubmitForm;OFFPLAN_STATE.submitOk=false;render();});
  wrap.appendChild(submitBtn);

  if(OFFPLAN_STATE.showSubmitForm){
    wrap.appendChild(_renderOffplanSubmitForm(cl));
  }

  if(OFFPLAN_STATE.loading){
    wrap.appendChild(div({color:cl.sub,fontSize:"12px",textAlign:"center",padding:"30px 0"},"Loading tracked projects…"));
    return wrap;
  }
  if(OFFPLAN_STATE.dbError){
    var errCard=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"20px",textAlign:"center"}});
    errCard.appendChild(div({color:cl.sub,fontSize:"12px"},"Off-Plan data isn't available yet — this feature is still being set up."));
    wrap.appendChild(errCard);
    return wrap;
  }

  var filtered=OFFPLAN_STATE.projects.filter(function(p){
    if(OFFPLAN_STATE.filterArea&&p.area!==OFFPLAN_STATE.filterArea)return false;
    if(OFFPLAN_STATE.filterDeveloper&&p.developer!==OFFPLAN_STATE.filterDeveloper)return false;
    return true;
  }).map(function(p){
    var dev=OFFPLAN_STATE.devRecords[p.developer]||null;
    return{p:p,fc:computeOffPlanForecast(p,dev)};
  });
  if(OFFPLAN_STATE.sort==="handover")filtered.sort(function(a,b){return new Date(a.p.expected_handover)-new Date(b.p.expected_handover);});
  else if(OFFPLAN_STATE.sort==="growth")filtered.sort(function(a,b){return b.fc.growthToHandoverPct-a.fc.growthToHandoverPct;});
  else filtered.sort(function(a,b){return new Date(b.p.created_at)-new Date(a.p.created_at);});

  if(filtered.length===0){
    var emptyCard=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"32px 20px",textAlign:"center"}});
    emptyCard.appendChild(div({fontSize:"28px",marginBottom:"10px"},"🏗"));
    emptyCard.appendChild(div({color:"#E8EDF5",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},OFFPLAN_STATE.projects.length===0?"No off-plan projects tracked yet":"No projects match these filters"));
    emptyCard.appendChild(div({color:cl.sub,fontSize:"12px",lineHeight:"1.6"},OFFPLAN_STATE.projects.length===0?"Be the first to submit a project you know about — it'll be reviewed and published once verified.":"Try clearing the area/developer filter above."));
    wrap.appendChild(emptyCard);
    return wrap;
  }

  filtered.forEach(function(item){
    wrap.appendChild(_renderOffplanCard(cl,item.p,item.fc));
  });

  return wrap;
}

function _renderOffplanSubmitForm(cl){
  var card=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"16px"}});
  var f=OFFPLAN_STATE.form;
  card.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"Submit a Project"));
  if(OFFPLAN_STATE.submitOk){
    card.appendChild(div({color:"#10B981",fontSize:"12px",fontWeight:"600",padding:"10px 0"},"✓ Submitted — it'll appear once an admin reviews and publishes it."));
    return card;
  }
  var grid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}});
  function field(label,key,placeholder,type){
    var w=el("div",{});
    w.appendChild(lbl(label));
    w.appendChild(inp(I(),placeholder||"",type||"text",f[key],function(v){f[key]=v;}));
    return w;
  }
  grid.appendChild(field("Project Name","name","e.g. Marina Vista"));
  grid.appendChild(field("Developer","developer","e.g. Emaar"));
  var areaW=el("div",{});areaW.appendChild(lbl("Area"));
  var areaNames=(typeof AREAS!=="undefined")?Object.keys(AREAS).sort():[];
  areaW.appendChild(mkAuto(I(),areaNames,f.area,function(v){f.area=v;},"Search area…"));
  grid.appendChild(areaW);
  grid.appendChild(field("Launch PSF (AED/sqft)","launchPSF","e.g. 1800","number"));
  grid.appendChild(field("Launch Date","launchDate","","date"));
  grid.appendChild(field("Expected Handover","expectedHandover","","date"));
  grid.appendChild(field("Size Min (sqft)","sizeMin","e.g. 450","number"));
  grid.appendChild(field("Size Max (sqft)","sizeMax","e.g. 1400","number"));
  grid.appendChild(field("Unit Types (comma-separated)","unitTypes","Studio, 1BR, 2BR"));
  grid.appendChild(field("Source","source","propertyfinder / bayut / tamani / developer-site"));
  card.appendChild(grid);
  card.appendChild(el("div",{style:{marginTop:"8px"}},[field("Source URL (optional)","sourceUrl","https://...")]));
  card.appendChild(el("div",{style:{marginTop:"8px"}},[field("Notes (optional)","notes","Anything else worth noting")]));
  if(OFFPLAN_STATE.submitError)card.appendChild(div({color:"#EF4444",fontSize:"11px",marginTop:"8px"},OFFPLAN_STATE.submitError));
  var btn=el("button",{style:{width:"100%",marginTop:"12px",padding:"11px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#C9A84C,#D4A843)",color:"#070B14",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  btn.textContent=OFFPLAN_STATE.submitting?"Submitting…":"Submit for Review";
  btn.addEventListener("click",offplanSubmit);
  card.appendChild(btn);
  return card;
}

function _renderOffplanCard(cl,p,fc){
  var card=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"12px"}});
  var topRow=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}});
  var left=el("div",{});
  left.appendChild(div({color:"#E8EDF5",fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},p.name));
  left.appendChild(div({color:cl.sub,fontSize:"11.5px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},p.developer+" · "+p.area));
  topRow.appendChild(left);
  var handBadge=div({background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.25)",borderRadius:"8px",padding:"4px 10px",fontSize:"10px",fontWeight:"700",color:"#3B82F6",fontFamily:"'Space Grotesk',monospace",whiteSpace:"nowrap"},"Handover "+_offplanFmtDate(p.expected_handover));
  topRow.appendChild(handBadge);
  card.appendChild(topRow);

  var metaRow=el("div",{style:{display:"flex",gap:"10px",flexWrap:"wrap",marginBottom:"12px",fontSize:"10.5px",color:cl.sub,fontFamily:"'Space Grotesk',monospace"}});
  metaRow.appendChild(span({},"Launched "+_offplanFmtDate(p.launch_date)));
  if(p.size_min&&p.size_max)metaRow.appendChild(span({},"· "+p.size_min+"–"+p.size_max+" sqft"));
  if(p.unit_types&&p.unit_types.length)metaRow.appendChild(span({},"· "+p.unit_types.join("/")));
  card.appendChild(metaRow);

  var priceRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"10px"}});
  [
    {l:"Launch PSF",v:"AED "+Math.round(fc.launchPSF).toLocaleString(),c:cl.subHi},
    {l:"At Handover ("+fc.yearsToHandover+"y)",v:"AED "+fc.projectedHandoverPSF.toLocaleString(),c:"#10B981",sub:(fc.growthToHandoverPct>=0?"+":"")+fc.growthToHandoverPct+"%"},
    {l:"+5yr Post-Handover",v:"AED "+fc.projected5yrPSF.toLocaleString(),c:"#D4AF37",sub:(fc.growth5yrPct>=0?"+":"")+fc.growth5yrPct+"%"}
  ].forEach(function(s){
    var cell=el("div",{style:{background:cl.raised,borderRadius:"8px",padding:"8px 10px",minWidth:"0"}});
    cell.appendChild(div({color:cl.sub,fontSize:"7.5px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},s.l));
    cell.appendChild(div({color:s.c,fontSize:"12.5px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},s.v));
    if(s.sub)cell.appendChild(div({color:s.c,fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace",marginTop:"1px"},s.sub));
    priceRow.appendChild(cell);
  });
  card.appendChild(priceRow);

  var confBadge=div({color:fc.hasDevData?"#10B981":cl.sub,fontSize:"9.5px",fontFamily:"'Inter',sans-serif",fontStyle:"italic"},fc.confidence);
  card.appendChild(confBadge);

  if(p.source_url){
    var srcLink=el("a",{href:p.source_url,target:"_blank",rel:"noopener",style:{display:"inline-block",marginTop:"8px",color:cl.gold,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",textDecoration:"none"}});
    srcLink.textContent="Source →";
    card.appendChild(srcLink);
  }
  return card;
}
