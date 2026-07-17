// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- OFF-PLAN PROJECTS (added 2026-07-17, schema revised same day) -----------
// User's own framing: a place to find off-plan projects from different
// developers, with a price-growth forecast from launch->handover and
// handover->+5yr, based on (1) the area's own real growth data (AREAS[].g,
// the same trusted field every other feature in this app already relies on),
// and (2) the specific developer's own historical track record where one has
// been entered (never fabricated — stays neutral/area-only until real
// developer performance data exists, see Outstanding items in CLAUDE.md).
//
// Schema revised after a research pass into how Dubai off-plan launches
// actually work (see supabase-offplan-schema.sql header): pricing is set PER
// UNIT TYPE by the developer (a studio and a villa in the same masterplan
// price completely differently), so each project can carry multiple unit
// types (offplan_unit_types), each with its own forecast. Projects also now
// carry a real lifecycle stage (Pre-Launch/EOI -> Launched -> Under
// Construction -> Handed Over) and a payment plan (10/70/20, 60/40, etc.) —
// one of the biggest real decision factors for an off-plan buyer.
//
// Data lives in Supabase (offplan_projects / offplan_unit_types /
// developer_track_record — supabase-offplan-schema.sql, requires manual
// execution), NOT a static JS file — unlike the residential building DB,
// this is a living, admin-curated + user-submitted dataset that needs CRUD
// and a review queue, not a recalibrated-periodically reference table.
//
// Ownership model (user-confirmed hybrid): any signed-in user can submit a
// project (lands as 'pending' review_status, invisible publicly); admin adds
// directly as already-published, or approves/rejects submissions from the
// Admin Dashboard (js/app.js renderAdmin() — same "queued, then
// admin-verified" pattern already used for OFM listing document verification).

var OFFPLAN_STAGE_LABELS = {
  prelaunch: "Pre-Launch / EOI",
  launched: "Launched",
  under_construction: "Under Construction",
  handed_over: "Handed Over"
};
var OFFPLAN_STAGE_COLORS = {
  prelaunch: "#F59E0B",
  launched: "#3B82F6",
  under_construction: "#8B5CF6",
  handed_over: "#10B981"
};

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
  form: { name:"", developer:"", area:"", projectStage:"prelaunch", eoiOpenDate:"", launchDate:"", expectedHandover:"", paymentPlan:"", unitPricing:"", source:"", sourceUrl:"", notes:"" },
  aiExtract: { open:false, text:"", loading:false, error:null }
};

function _offplanH(){
  var token=localStorage.getItem("dv_access_token")||SUPABASE_KEY;
  return {"apikey":SUPABASE_KEY,"Authorization":"Bearer "+token,"Content-Type":"application/json"};
}

// Compact shorthand parser for "UnitType:PSF:SizeMin-SizeMax" comma-separated
// entries (e.g. "Studio:1500:400-550, 1BR:1650:750-900") — the pragmatic MVP
// input for per-unit-type pricing without a dynamic add/remove-row form.
function _parseUnitPricing(str){
  if(!str)return[];
  return str.split(",").map(function(chunk){
    var parts=chunk.split(":").map(function(s){return s.trim();});
    if(parts.length<2||!parts[0]||!parts[1])return null;
    var launchPsf=parseFloat(parts[1]);
    if(!launchPsf||launchPsf<=0)return null;
    var sizeMin=null,sizeMax=null;
    if(parts[2]){
      var sizeParts=parts[2].split("-").map(function(s){return s.trim();});
      sizeMin=parseInt(sizeParts[0],10)||null;
      sizeMax=sizeParts[1]?(parseInt(sizeParts[1],10)||null):sizeMin;
    }
    return{unit_type:parts[0],launch_psf:launchPsf,size_min:sizeMin,size_max:sizeMax};
  }).filter(Boolean);
}

function _formatUnitPricingForEdit(unitTypes){
  if(!unitTypes||!unitTypes.length)return"";
  return unitTypes.map(function(u){
    var sizePart=(u.size_min&&u.size_max)?(":"+u.size_min+"-"+u.size_max):"";
    return u.unit_type+":"+u.launch_psf+sizePart;
  }).join(", ");
}

// ── AI EXTRACTION ("Paste & Extract") — added 2026-07-17 ────────────────────
// Removes manual typing for the THIRD data-connection path (developer sites /
// Tamani / any off-plan text a user has on hand) that can't be safely
// scraped server-side — many developer sites are JS-rendered SPAs a plain
// serverless fetch() can't render, so instead of a fragile "give me a URL"
// flow, the user pastes whatever text they already have (a brochure,
// project page copy, WhatsApp forward) and the SAME Groq AI already used
// throughout this app extracts structured fields — never invents a fact not
// present in the text (explicit instruction below), matching the accuracy
// principle used everywhere else in Off-Plan. Shared by both the public
// Submit form (below) and the Admin Quick Add form (js/app.js) — one
// extraction function, no duplicated prompt logic.
function _offplanExtractJSON(txt){
  try{
    var jm=txt.match(/```json\s*([\s\S]*?)\s*```/);
    if(jm)return JSON.parse(jm[1]);
    var ob=txt.match(/\{[\s\S]*\}/);
    if(ob)return JSON.parse(ob[0]);
  }catch(e){}
  return null;
}
async function _offplanAIExtract(text){
  if(!text||!text.trim())return{error:"Paste some project text first."};
  var areaNames=(typeof AREAS!=="undefined")?Object.keys(AREAS):[];
  var stageKeys=["prelaunch","launched","under_construction","handed_over"];
  var sys="You are a real-estate data-extraction assistant for a Dubai off-plan property tracker. "+
    "Given raw text (a developer brochure, project page copy, or listing description), extract ONLY facts that are explicitly stated in the text. "+
    "NEVER invent, estimate, or guess a figure that isn't actually present — use null instead. Return STRICT JSON only, no prose, no markdown fences, matching exactly this shape:\n"+
    '{"name":string|null,"developer":string|null,"area":string|null,"projectStage":"prelaunch"|"launched"|"under_construction"|"handed_over"|null,'+
    '"eoiOpenDate":"YYYY-MM-DD"|null,"launchDate":"YYYY-MM-DD"|null,"expectedHandover":"YYYY-MM-DD"|null,"paymentPlan":string|null,'+
    '"unitTypes":[{"unit_type":string,"launch_psf":number|null,"size_min":number|null,"size_max":number|null}],"notes":string|null}\n'+
    "For \"area\", pick the closest match from this known list if one clearly fits (else return your best plain-text guess): "+areaNames.slice(0,80).join(", ")+"\n"+
    "For dates, convert a relative reference like \"Q3 2026\" or \"June 2029\" into a YYYY-MM-DD estimate (1st of the month/quarter) — but if no year at all is stated, leave it null rather than guessing a year.";
  try{
    var raw=await askAI([{role:"user",content:text}],sys);
    var obj=_offplanExtractJSON(raw);
    if(!obj)return{error:"Could not parse a structured result from the AI — try pasting more complete text."};
    var unitTypes=(obj.unitTypes||[]).filter(function(u){return u&&u.unit_type&&u.launch_psf;});
    return{
      name:obj.name||"",developer:obj.developer||"",area:obj.area||"",
      projectStage:stageKeys.indexOf(obj.projectStage)>=0?obj.projectStage:"prelaunch",
      eoiOpenDate:obj.eoiOpenDate||"",launchDate:obj.launchDate||"",expectedHandover:obj.expectedHandover||"",
      paymentPlan:obj.paymentPlan||"",unitPricing:_formatUnitPricingForEdit(unitTypes),notes:obj.notes||""
    };
  }catch(e){return{error:"AI extraction failed: "+e.message};}
}

async function offplanLoad(){
  if(OFFPLAN_STATE.loading||OFFPLAN_STATE.loaded)return;
  OFFPLAN_STATE.loading=true;
  try{
    var [pRes,dRes]=await Promise.all([
      fetch(SUPABASE_URL+"/rest/v1/offplan_projects?select=*,unit_types:offplan_unit_types(unit_type,launch_psf,size_min,size_max)&review_status=eq.published&order=created_at.desc&limit=300",{headers:_offplanH()}),
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
// no new/separate growth model invented for off-plan specifically. Computed
// PER UNIT TYPE (each unit type has its own launchPSF) since a studio and a
// villa in the same masterplan price completely differently.
function computeOffPlanForecast(area,launchDate,expectedHandover,launchPSF,devRecord){
  var aData=(typeof AREAS!=="undefined"&&AREAS[area])||{g:[10,18,28]};
  var g=aData.g||[10,18,28];
  var launch=new Date(launchDate);
  var handover=new Date(expectedHandover);
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
  var projectedHandoverPSF=Math.round(launchPSF*(1+growthToHandover));
  var growth5yr=(g[2]||28)/100;
  var hasDev5yrData=!!(devRecord&&devRecord.avg_growth_handover_to_5yr!=null);
  if(hasDev5yrData)growth5yr=growth5yr*0.7+(devRecord.avg_growth_handover_to_5yr/100)*0.3;
  var projected5yrPSF=Math.round(projectedHandoverPSF*(1+growth5yr));
  var confidence=hasDevHandoverData?"Medium — area growth + developer track record":"Indicative — area growth only, no developer history yet";
  return{
    launchPSF:launchPSF,
    projectedHandoverPSF:projectedHandoverPSF,
    projected5yrPSF:projected5yrPSF,
    growthToHandoverPct:Math.round(growthToHandover*1000)/10,
    growth5yrPct:Math.round(growth5yr*1000)/10,
    yearsToHandover:Math.round(yearsToHandover*10)/10,
    confidence:confidence,
    hasDevData:hasDevHandoverData
  };
}

// Computes a forecast for every unit type on a project (falls back to a
// single synthetic "General" unit type if none were entered, so an older or
// incomplete row never renders empty).
function _offplanProjectForecasts(p,devRecord){
  var units=(p.unit_types&&p.unit_types.length)?p.unit_types:[{unit_type:"General",launch_psf:null,size_min:p.size_min,size_max:p.size_max}];
  return units.filter(function(u){return u.launch_psf;}).map(function(u){
    var fc=computeOffPlanForecast(p.area,p.launch_date,p.expected_handover,u.launch_psf,devRecord);
    fc.unitType=u.unit_type;
    fc.sizeMin=u.size_min;
    fc.sizeMax=u.size_max;
    return fc;
  });
}

function _offplanAvgGrowth(forecasts){
  if(!forecasts.length)return 0;
  return forecasts.reduce(function(s,f){return s+f.growthToHandoverPct;},0)/forecasts.length;
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
  var unitTypesArr=_parseUnitPricing(f.unitPricing);
  if(!f.name||!f.developer||!f.area||!f.launchDate||!f.expectedHandover){
    OFFPLAN_STATE.submitError="Please fill in project name, developer, area, launch date, and handover date.";
    render();return;
  }
  if(unitTypesArr.length===0){
    OFFPLAN_STATE.submitError="Please add at least one unit type with pricing, e.g. Studio:1500:400-550";
    render();return;
  }
  if(typeof DV_AUTH==="undefined"||!DV_AUTH.user){
    DV_AUTH.showModal=true;DV_AUTH.modalTab="signin";render();return;
  }
  OFFPLAN_STATE.submitting=true;OFFPLAN_STATE.submitError="";render();
  try{
    var r=await fetch(SUPABASE_URL+"/rest/v1/rpc/submit_offplan_project",{
      method:"POST",headers:_offplanH(),
      body:JSON.stringify({
        p_name:f.name,p_developer:f.developer,p_area:f.area,
        p_project_stage:f.projectStage||"prelaunch",
        p_eoi_open_date:f.eoiOpenDate||null,
        p_launch_date:f.launchDate,p_expected_handover:f.expectedHandover,
        p_payment_plan:f.paymentPlan||null,
        p_unit_types:unitTypesArr,
        p_source:f.source||"agent-submission",p_source_url:f.sourceUrl||null,
        p_notes:f.notes||null,p_submitted_by:DV_AUTH.user.email
      })
    });
    if(r.ok){
      OFFPLAN_STATE.submitOk=true;
      OFFPLAN_STATE.form={name:"",developer:"",area:"",projectStage:"prelaunch",eoiOpenDate:"",launchDate:"",expectedHandover:"",paymentPlan:"",unitPricing:"",source:"",sourceUrl:"",notes:""};
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
  hero.appendChild(div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6"},"Track off-plan launches across developers with a price forecast from launch → handover → 5 years after, per unit type, based on real area growth data and each developer's own track record."));
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
    var fcs=_offplanProjectForecasts(p,dev);
    return{p:p,fcs:fcs,avgGrowth:_offplanAvgGrowth(fcs)};
  });
  if(OFFPLAN_STATE.sort==="handover")filtered.sort(function(a,b){return new Date(a.p.expected_handover)-new Date(b.p.expected_handover);});
  else if(OFFPLAN_STATE.sort==="growth")filtered.sort(function(a,b){return b.avgGrowth-a.avgGrowth;});
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
    wrap.appendChild(_renderOffplanCard(cl,item.p,item.fcs));
  });

  return wrap;
}

async function _offplanRunAIExtract(target){
  var ae=OFFPLAN_STATE.aiExtract;
  ae.error=null;ae.loading=true;render();
  var result=await _offplanAIExtract(ae.text);
  ae.loading=false;
  if(result.error){ae.error=result.error;render();return;}
  var f=OFFPLAN_STATE.form;
  ["name","developer","area","projectStage","eoiOpenDate","launchDate","expectedHandover","paymentPlan","unitPricing"].forEach(function(k){
    if(result[k])f[k]=result[k];
  });
  if(result.notes)f.notes=(f.notes?f.notes+" — ":"")+result.notes;
  ae.open=false;ae.text="";
  render();
}
function _renderOffplanSubmitForm(cl){
  var card=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"16px"}});
  var f=OFFPLAN_STATE.form;
  card.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"Submit a Project"));
  if(OFFPLAN_STATE.submitOk){
    card.appendChild(div({color:"#10B981",fontSize:"12px",fontWeight:"600",padding:"10px 0"},"✓ Submitted — it'll appear once an admin reviews and publishes it."));
    return card;
  }

  // Paste & Extract — AI fills the fields below from pasted brochure/project
  // text (developer site, Tamani, WhatsApp forward) instead of typing by hand.
  var ae=OFFPLAN_STATE.aiExtract;
  var aeToggle=el("button",{style:{width:"100%",padding:"8px",borderRadius:"8px",border:"1px dashed "+cl.border,background:"transparent",color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",marginBottom:"10px"}});
  aeToggle.textContent=ae.open?"− Hide Paste & Extract":"✨ Paste & Extract with AI (fill fields automatically)";
  aeToggle.addEventListener("click",function(){ae.open=!ae.open;render();});
  card.appendChild(aeToggle);
  if(ae.open){
    var aeBox=el("div",{style:{background:cl.raised,borderRadius:"10px",padding:"10px",marginBottom:"14px"}});
    var aeTa=el("textarea",{style:{width:"100%",minHeight:"90px",background:cl.surface,border:"1px solid "+cl.border,borderRadius:"8px",color:cl.white,fontSize:"11.5px",fontFamily:"'Inter',sans-serif",padding:"8px",boxSizing:"border-box",resize:"vertical"},placeholder:"Paste project text here — a brochure, developer page copy, or any description with the project details..."});
    aeTa.value=ae.text;
    aeTa.addEventListener("input",function(){ae.text=aeTa.value;});
    aeBox.appendChild(aeTa);
    if(ae.error)aeBox.appendChild(div({color:"#EF4444",fontSize:"10.5px",marginTop:"6px"},ae.error));
    var aeBtn=el("button",{style:{marginTop:"8px",padding:"8px 14px",borderRadius:"8px",border:"none",background:"linear-gradient(135deg,#C9A84C,#D4A843)",color:"#070B14",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    aeBtn.textContent=ae.loading?"Extracting…":"Extract & Fill Fields";
    aeBtn.disabled=ae.loading;
    aeBtn.addEventListener("click",function(){_offplanRunAIExtract();});
    aeBox.appendChild(aeBtn);
    aeBox.appendChild(div({color:cl.sub,fontSize:"9.5px",fontStyle:"italic",marginTop:"6px",lineHeight:"1.5"},"Fields below get pre-filled — always review before submitting, the AI only extracts what's explicitly in the text."));
    card.appendChild(aeBox);
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
  var stageW=el("div",{});stageW.appendChild(lbl("Project Stage"));
  var stageKeys=Object.keys(OFFPLAN_STAGE_LABELS);
  var stageLabelList=stageKeys.map(function(k){return OFFPLAN_STAGE_LABELS[k];});
  stageW.appendChild(mkSelect(I(),stageLabelList,OFFPLAN_STAGE_LABELS[f.projectStage]||stageLabelList[0],function(v){
    var found=stageKeys.find(function(k){return OFFPLAN_STAGE_LABELS[k]===v;});
    f.projectStage=found||"prelaunch";
  }));
  grid.appendChild(stageW);
  grid.appendChild(field("EOI Open Date (optional)","eoiOpenDate","","date"));
  grid.appendChild(field("Launch Date","launchDate","","date"));
  grid.appendChild(field("Expected Handover","expectedHandover","","date"));
  grid.appendChild(field("Payment Plan","paymentPlan","e.g. 10/70/20, 60/40, Post-Handover 3yr"));
  card.appendChild(grid);
  var pricingW=el("div",{style:{marginTop:"8px"}});
  pricingW.appendChild(lbl("Unit Types & Pricing"));
  pricingW.appendChild(inp(I(),"Studio:1500:400-550, 1BR:1650:750-900, 2BR:1600:1100-1400","text",f.unitPricing,function(v){f.unitPricing=v;}));
  pricingW.appendChild(div({color:cl.sub,fontSize:"10px",marginTop:"4px",lineHeight:"1.5"},"Format: UnitType:LaunchPSF:SizeMin-SizeMax — one per unit type, comma-separated. Size range is optional."));
  card.appendChild(pricingW);
  card.appendChild(el("div",{style:{marginTop:"8px"}},[field("Source","source","propertyfinder / bayut / tamani / developer-site")]));
  card.appendChild(el("div",{style:{marginTop:"8px"}},[field("Source URL (optional)","sourceUrl","https://...")]));
  card.appendChild(el("div",{style:{marginTop:"8px"}},[field("Notes (optional)","notes","Anything else worth noting")]));
  if(OFFPLAN_STATE.submitError)card.appendChild(div({color:"#EF4444",fontSize:"11px",marginTop:"8px"},OFFPLAN_STATE.submitError));
  var btn=el("button",{style:{width:"100%",marginTop:"12px",padding:"11px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#C9A84C,#D4A843)",color:"#070B14",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  btn.textContent=OFFPLAN_STATE.submitting?"Submitting…":"Submit for Review";
  btn.addEventListener("click",offplanSubmit);
  card.appendChild(btn);
  return card;
}

function _renderOffplanCard(cl,p,fcs){
  var card=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"12px"}});
  var topRow=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px",gap:"8px"}});
  var left=el("div",{});
  left.appendChild(div({color:"#E8EDF5",fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},p.name));
  left.appendChild(div({color:cl.sub,fontSize:"11.5px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},p.developer+" · "+p.area));
  topRow.appendChild(left);
  var badgeCol=el("div",{style:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"4px"}});
  var stageColor=OFFPLAN_STAGE_COLORS[p.project_stage]||cl.sub;
  badgeCol.appendChild(div({background:hexAlpha(stageColor,0.12),border:"1px solid "+hexAlpha(stageColor,0.3),borderRadius:"8px",padding:"3px 9px",fontSize:"9.5px",fontWeight:"700",color:stageColor,fontFamily:"'Space Grotesk',monospace",whiteSpace:"nowrap"},OFFPLAN_STAGE_LABELS[p.project_stage]||"Pre-Launch / EOI"));
  badgeCol.appendChild(div({background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.25)",borderRadius:"8px",padding:"3px 9px",fontSize:"9.5px",fontWeight:"700",color:"#3B82F6",fontFamily:"'Space Grotesk',monospace",whiteSpace:"nowrap"},"Handover "+_offplanFmtDate(p.expected_handover)));
  topRow.appendChild(badgeCol);
  card.appendChild(topRow);

  var metaRow=el("div",{style:{display:"flex",gap:"10px",flexWrap:"wrap",marginBottom:"12px",fontSize:"10.5px",color:cl.sub,fontFamily:"'Space Grotesk',monospace"}});
  metaRow.appendChild(span({},"Launched "+_offplanFmtDate(p.launch_date)));
  if(p.eoi_open_date)metaRow.appendChild(span({},"· EOI opened "+_offplanFmtDate(p.eoi_open_date)));
  if(p.payment_plan)metaRow.appendChild(span({},"· Payment Plan: "+p.payment_plan));
  card.appendChild(metaRow);

  if(!fcs.length){
    card.appendChild(div({color:cl.sub,fontSize:"11px",fontStyle:"italic",padding:"8px 0"},"No unit pricing on file yet for this project."));
  }else{
    fcs.forEach(function(fc){
      var unitBlock=el("div",{style:{marginBottom:"10px"}});
      var unitLabel=fc.unitType+((fc.sizeMin&&fc.sizeMax)?(" · "+fc.sizeMin+"–"+fc.sizeMax+" sqft"):"");
      unitBlock.appendChild(div({color:"#E8EDF5",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},unitLabel));
      var priceRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}});
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
      unitBlock.appendChild(priceRow);
      card.appendChild(unitBlock);
    });
    card.appendChild(div({color:fcs[0].hasDevData?"#10B981":cl.sub,fontSize:"9.5px",fontFamily:"'Inter',sans-serif",fontStyle:"italic",marginBottom:"4px"},fcs[0].confidence));
  }

  if(p.source_url){
    var srcLink=el("a",{href:p.source_url,target:"_blank",rel:"noopener",style:{display:"inline-block",marginTop:"4px",color:cl.gold,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",textDecoration:"none"}});
    srcLink.textContent="Source →";
    card.appendChild(srcLink);
  }
  return card;
}
