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
  // Added 2026-08-05 (Phase 1 of the GenieMap gap-closing plan) — 3 more
  // filters matching GenieMap's own real filter set (stage, price band,
  // handover range), on top of the pre-existing area/developer/sort. Shared
  // by both the list AND the new map view via _offplanFilteredItems() below,
  // so the two views can never show a different set of projects for the
  // same filter selection.
  filterStage: "",
  filterPriceBand: "", // '' | 'under1500' | '1500-2000' | '2000-2500' | '2500+'
  filterHandoverRange: "", // '' | '1y' | '1-2y' | '2-3y' | '3y+'
  view: "list", // 'list' | 'map' | 'directory'
  sort: "handover", // 'handover' | 'growth' | 'newest'
  showSubmitForm: false,
  submitting: false,
  submitError: "",
  submitOk: false,
  form: { name:"", developer:"", area:"", projectStage:"prelaunch", eoiOpenDate:"", launchDate:"", expectedHandover:"", paymentPlan:"", unitPricing:"", source:"", sourceUrl:"", notes:"" },
  aiExtract: { open:false, text:"", loading:false, error:null },
  // Developer Sales-Contact Directory — added 2026-08-05 (Phase 3 of the
  // GenieMap gap-closing plan). A genuinely separate dataset from
  // `projects` (developer_contacts is its own table), but kept inside this
  // same OFFPLAN_STATE object per this file's own established convention
  // (projects/devRecords/form/aiExtract already live here together).
  contacts: [],
  contactsLoaded: false,
  contactsLoading: false,
  contactsDbError: false,
  contactSearch: "",
  showContactForm: false,
  contactSubmitting: false,
  contactSubmitError: "",
  contactSubmitOk: false,
  contactForm: { developer:"", contactName:"", role:"", phone:"", whatsapp:"", email:"", officeArea:"", source:"", sourceUrl:"", notes:"" }
};

// Off-plan project map — dedicated state, deliberately NOT sharing
// _dvMapState (js/map.js's own Interactive Map tab state) even though both
// use the same Google Maps loader/light theme — keeps this map's lifecycle
// fully independent so switching tabs/views can never leave the other one's
// gmap instance dangling.
var _offplanMapState = { gmap: null, markers: [], panelEl: null };

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

// ── DEVELOPER SALES-CONTACT DIRECTORY ───────────────────────────────────────
// Added 2026-08-05 (Phase 3 of the GenieMap gap-closing plan). Same
// review-workflow shape as offplanLoad()/offplanSubmit() above (public
// submission -> pending -> admin approves/rejects), reusing the exact
// pattern rather than inventing a second one — see
// supabase-developer-contacts-schema.sql for the real table/RPCs.
async function contactsLoad(){
  if(OFFPLAN_STATE.contactsLoading||OFFPLAN_STATE.contactsLoaded)return;
  OFFPLAN_STATE.contactsLoading=true;
  try{
    var r=await fetch(SUPABASE_URL+"/rest/v1/developer_contacts?select=*&review_status=eq.published&order=developer.asc&limit=500",{headers:_offplanH()});
    if(r.ok)OFFPLAN_STATE.contacts=await r.json();
    else OFFPLAN_STATE.contactsDbError=true;
  }catch(e){OFFPLAN_STATE.contactsDbError=true;}
  OFFPLAN_STATE.contactsLoading=false;
  OFFPLAN_STATE.contactsLoaded=true;
  render();
}
async function contactSubmit(){
  var f=OFFPLAN_STATE.contactForm;
  if(!f.developer||!f.contactName){
    OFFPLAN_STATE.contactSubmitError="Please fill in developer and contact name at minimum.";
    render();return;
  }
  if(!f.phone&&!f.whatsapp&&!f.email){
    OFFPLAN_STATE.contactSubmitError="Add at least one way to reach this contact — phone, WhatsApp, or email.";
    render();return;
  }
  if(typeof DV_AUTH==="undefined"||!DV_AUTH.user){
    DV_AUTH.showModal=true;DV_AUTH.modalTab="signin";render();return;
  }
  OFFPLAN_STATE.contactSubmitting=true;OFFPLAN_STATE.contactSubmitError="";render();
  try{
    var r=await fetch(SUPABASE_URL+"/rest/v1/rpc/submit_developer_contact",{
      method:"POST",headers:_offplanH(),
      body:JSON.stringify({
        p_developer:f.developer,p_contact_name:f.contactName,p_role:f.role||null,
        p_phone:f.phone||null,p_whatsapp:f.whatsapp||null,p_email:f.email||null,
        p_office_area:f.officeArea||null,p_source:f.source||"agent-submission",
        p_source_url:f.sourceUrl||null,p_notes:f.notes||null,p_submitted_by:DV_AUTH.user.email
      })
    });
    if(r.ok){
      OFFPLAN_STATE.contactSubmitOk=true;
      OFFPLAN_STATE.contactForm={developer:"",contactName:"",role:"",phone:"",whatsapp:"",email:"",officeArea:"",source:"",sourceUrl:"",notes:""};
    }else{
      OFFPLAN_STATE.contactSubmitError="Could not submit — please try again.";
    }
  }catch(e){OFFPLAN_STATE.contactSubmitError="Network error — please try again.";}
  OFFPLAN_STATE.contactSubmitting=false;render();
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

// ── FILTERING (shared by list + map view) — added 2026-08-05 ───────────────
// A project's own "entry price" for filtering purposes is its CHEAPEST unit
// type's launch_psf — matches how a real buyer thinks about a masterplan
// ("starting from X/sqft"), not an average across wildly different unit
// types (a studio and a villa in the same project shouldn't be blended).
function _offplanMinPSF(p){
  var psfs=(p.unit_types||[]).map(function(u){return u.launch_psf;}).filter(function(v){return v>0;});
  return psfs.length?Math.min.apply(null,psfs):null;
}
function _offplanYearsToHandover(p){
  var h=new Date(p.expected_handover);
  if(isNaN(h.getTime()))return null;
  return (h.getTime()-Date.now())/(365.25*24*3600*1000);
}
function _offplanFilteredItems(){
  return OFFPLAN_STATE.projects.filter(function(p){
    if(OFFPLAN_STATE.filterArea&&p.area!==OFFPLAN_STATE.filterArea)return false;
    if(OFFPLAN_STATE.filterDeveloper&&p.developer!==OFFPLAN_STATE.filterDeveloper)return false;
    if(OFFPLAN_STATE.filterStage&&p.project_stage!==OFFPLAN_STATE.filterStage)return false;
    if(OFFPLAN_STATE.filterPriceBand){
      var minPsf=_offplanMinPSF(p);
      if(minPsf==null)return false;
      var band=OFFPLAN_STATE.filterPriceBand;
      if(band==="under1500"&&!(minPsf<1500))return false;
      if(band==="1500-2000"&&!(minPsf>=1500&&minPsf<2000))return false;
      if(band==="2000-2500"&&!(minPsf>=2000&&minPsf<2500))return false;
      if(band==="2500+"&&!(minPsf>=2500))return false;
    }
    if(OFFPLAN_STATE.filterHandoverRange){
      var yrs=_offplanYearsToHandover(p);
      if(yrs==null)return false;
      var hr=OFFPLAN_STATE.filterHandoverRange;
      if(hr==="1y"&&!(yrs<=1))return false;
      if(hr==="1-2y"&&!(yrs>1&&yrs<=2))return false;
      if(hr==="2-3y"&&!(yrs>2&&yrs<=3))return false;
      if(hr==="3y+"&&!(yrs>3))return false;
    }
    return true;
  }).map(function(p){
    var dev=OFFPLAN_STATE.devRecords[p.developer]||null;
    var fcs=_offplanProjectForecasts(p,dev);
    return{p:p,fcs:fcs,avgGrowth:_offplanAvgGrowth(fcs)};
  });
}
function _offplanSortItems(items){
  var sorted=items.slice();
  if(OFFPLAN_STATE.sort==="handover")sorted.sort(function(a,b){return new Date(a.p.expected_handover)-new Date(b.p.expected_handover);});
  else if(OFFPLAN_STATE.sort==="growth")sorted.sort(function(a,b){return b.avgGrowth-a.avgGrowth;});
  else sorted.sort(function(a,b){return new Date(b.p.created_at)-new Date(a.p.created_at);});
  return sorted;
}

// ── MAP VIEW (Phase 1 of the GenieMap gap-closing plan, added 2026-08-05) ──
// One colored pin per FILTERED project (color = project_stage, reusing
// OFFPLAN_STAGE_COLORS — no new color scale invented). Reuses the exact
// Google Maps loading/light-theme/cleanup machinery already proven in
// js/map.js's own Interactive Map tab (_dvGmapLoad/_GMAP_LIGHT_STYLES/
// _dvGeocodeBuilding/_dvBatchPromises) rather than duplicating any of it —
// safe to reference here despite js/offplan.js loading earlier in
// index.html's script order, since these are all deferred scripts and this
// function only ever runs after every module has finished loading (same
// established cross-file-call pattern used elsewhere in this app, e.g.
// js/app.js calling js/portfolio.js's computeAssetMetrics()).
function _offplanMapCleanup(){
  _offplanMapState.markers.forEach(function(m){
    google.maps.event.clearInstanceListeners(m);
    m.setMap(null);
  });
  _offplanMapState.markers=[];
  if(_offplanMapState.gmap){
    google.maps.event.clearInstanceListeners(_offplanMapState.gmap);
    _offplanMapState.gmap=null;
  }
}
// Resolves a project's map coordinate: the free, instant AREA_COORDS
// centroid first (covers most areas); only falls back to a live, cached
// geocode call (via the same helper the Interactive Map tab's own Building
// Tier already uses) for the areas AREA_COORDS doesn't have — confirmed a
// real, non-hypothetical gap: "DAMAC Islands" itself (one of this session's
// own seeded projects) has no AREA_COORDS entry despite being a real,
// long-tracked AREAS key.
function _offplanResolveCoords(project){
  var coords=(typeof AREA_COORDS!=="undefined")?AREA_COORDS[project.area]:null;
  if(coords)return Promise.resolve({lat:coords[0],lng:coords[1]});
  if(typeof _dvGeocodeBuilding==="function"){
    return _dvGeocodeBuilding(project.name,project.area).then(function(r){
      return(r&&r.lat)?{lat:r.lat,lng:r.lng}:null;
    });
  }
  return Promise.resolve(null);
}
function _offplanShowPanel(cl,item){
  var panel=_offplanMapState.panelEl;
  if(!panel)return;
  panel.innerHTML="";
  var closeBtn=el("button",{style:{position:"absolute",top:"8px",right:"8px",width:"26px",height:"26px",borderRadius:"8px",border:"1px solid "+cl.border,background:cl.raised,color:cl.sub,fontSize:"14px",cursor:"pointer",zIndex:"2"}});
  closeBtn.textContent="✕";
  closeBtn.addEventListener("click",function(){panel.style.display="none";});
  panel.appendChild(closeBtn);
  var inner=el("div",{style:{padding:"14px"}});
  inner.appendChild(_renderOffplanCard(cl,item.p,item.fcs));
  panel.appendChild(inner);
  panel.style.display="block";
}
function _renderOffplanMap(cl,items){
  var mapWrap=el("div",{style:{position:"relative",width:"100%",height:"480px",borderRadius:"14px",overflow:"hidden",border:"1px solid "+cl.border,marginBottom:"16px"}});
  var mapTs=new Date().getTime();
  var mapId="dv-offplan-gmap-"+mapTs;
  var mapEl=el("div",{style:{width:"100%",height:"100%"},id:mapId});
  mapWrap.appendChild(mapEl);
  var panelEl=el("div",{id:mapId+"-panel",style:{
    position:"absolute",top:"10px",right:"10px",bottom:"10px",width:"320px",maxWidth:"88vw",
    overflowY:"auto",background:cl.surfaceSolid||cl.surface,border:"1px solid "+cl.border,
    borderRadius:"14px",boxShadow:"0 8px 30px rgba(0,0,0,0.35)",display:"none",zIndex:"5"
  }});
  mapWrap.appendChild(panelEl);

  if(!items.length){
    var emptyOverlay=el("div",{style:{position:"absolute",top:"0",left:"0",right:"0",bottom:"0",display:"flex",alignItems:"center",justifyContent:"center",background:cl.raised,zIndex:"1"}});
    emptyOverlay.appendChild(div({color:cl.sub,fontSize:"12px"},"No projects match these filters."));
    mapWrap.appendChild(emptyOverlay);
    return mapWrap;
  }

  setTimeout(function(){
    var container=document.getElementById(mapId);
    if(!container)return;
    _dvGmapLoad(function(){
      var c2=document.getElementById(mapId);
      if(!c2)return;
      _offplanMapCleanup();
      var gmap=new google.maps.Map(c2,{
        center:{lat:25.15,lng:55.22},zoom:11,
        styles:(typeof _GMAP_LIGHT_STYLES!=="undefined")?_GMAP_LIGHT_STYLES:[],
        zoomControl:true,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,
        gestureHandling:"greedy"
      });
      _offplanMapState.gmap=gmap;
      _offplanMapState.panelEl=document.getElementById(mapId+"-panel");
      var bounds=new google.maps.LatLngBounds();
      var batcher=(typeof _dvBatchPromises==="function")?_dvBatchPromises:function(arr,size,fn){return Promise.all(arr.map(fn));};
      batcher(items,4,function(item){
        return _offplanResolveCoords(item.p).then(function(pos){
          if(!pos)return;
          var stageColor=OFFPLAN_STAGE_COLORS[item.p.project_stage]||cl.sub;
          var mk=new google.maps.Marker({
            position:pos,map:gmap,title:item.p.name,
            icon:{path:google.maps.SymbolPath.CIRCLE,scale:9,fillColor:stageColor,fillOpacity:0.9,strokeColor:"#FFFFFF",strokeWeight:2}
          });
          mk.addListener("click",function(){_offplanShowPanel(cl,item);});
          _offplanMapState.markers.push(mk);
          bounds.extend(pos);
        });
      }).then(function(){
        if(!bounds.isEmpty()){
          gmap.fitBounds(bounds);
          google.maps.event.addListenerOnce(gmap,"bounds_changed",function(){
            if(gmap.getZoom()>15)gmap.setZoom(15);
          });
        }
      });
    },function(){
      mapEl.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",bottom:"0",display:"flex",alignItems:"center",justifyContent:"center",color:cl.sub,fontSize:"12px"},"Map unavailable right now."));
    });
  },0);

  return mapWrap;
}

function renderOffPlan(){
  var cl=C();
  if(!OFFPLAN_STATE.loaded&&!OFFPLAN_STATE.loading)offplanLoad();
  // Triggered here (not only inside the Directory view itself) so the
  // "Contact developer" link on each project card (List/Map views) has
  // real data to check against without requiring a Directory visit first.
  if(!OFFPLAN_STATE.contactsLoaded&&!OFFPLAN_STATE.contactsLoading&&typeof contactsLoad==="function")contactsLoad();
  var wrap=el("div",{style:{padding:"20px",maxWidth:"900px",margin:"0 auto",paddingBottom:"80px"}});

  var hero=el("div",{style:{marginBottom:"20px"}});
  hero.appendChild(div({fontSize:"20px",fontWeight:"700",color:"#F0F2F5",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Off-Plan Projects"));
  hero.appendChild(div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6"},"Track off-plan launches across developers with a price forecast from launch → handover → 5 years after, per unit type, based on real area growth data and each developer's own track record."));
  wrap.appendChild(hero);

  // Filters — Row 1: Area/Developer/Stage. Row 2: Price Band/Handover
  // Range/Sort. Shared identically by both List and Map view via
  // _offplanFilteredItems() below, so switching views never changes which
  // projects are showing. Extended 2026-08-05 (Phase 1 of the GenieMap
  // gap-closing plan) from the original area/developer/sort-only row —
  // matches GenieMap's own real filter set (area, developer, price, handover
  // date, stage/availability).
  var filterRow1=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"8px"}});
  var areaNames=(typeof AREAS!=="undefined")?Object.keys(AREAS).sort():[];
  filterRow1.appendChild(mkSelect(Object.assign({},I(),{fontSize:"12px",padding:"8px"}),[""].concat(areaNames),OFFPLAN_STATE.filterArea,function(v){OFFPLAN_STATE.filterArea=v;render();}));
  var devNames=Array.from(new Set(OFFPLAN_STATE.projects.map(function(p){return p.developer;}))).sort();
  filterRow1.appendChild(mkSelect(Object.assign({},I(),{fontSize:"12px",padding:"8px"}),[""].concat(devNames),OFFPLAN_STATE.filterDeveloper,function(v){OFFPLAN_STATE.filterDeveloper=v;render();}));
  var stageOptLabels=["Any Stage"].concat(Object.keys(OFFPLAN_STAGE_LABELS).map(function(k){return OFFPLAN_STAGE_LABELS[k];}));
  var stageKeysForFilter=[""].concat(Object.keys(OFFPLAN_STAGE_LABELS));
  var curStageLabel=OFFPLAN_STATE.filterStage?OFFPLAN_STAGE_LABELS[OFFPLAN_STATE.filterStage]:"Any Stage";
  filterRow1.appendChild(mkSelect(Object.assign({},I(),{fontSize:"12px",padding:"8px"}),stageOptLabels,curStageLabel,function(v){
    var idx=stageOptLabels.indexOf(v);
    OFFPLAN_STATE.filterStage=idx>=0?stageKeysForFilter[idx]:"";render();
  }));

  var filterRow2=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}});
  var priceBandLabels={"":"Any Price","under1500":"Under 1,500/sqft","1500-2000":"1,500–2,000/sqft","2000-2500":"2,000–2,500/sqft","2500+":"2,500+/sqft"};
  var priceBandKeys=Object.keys(priceBandLabels);
  filterRow2.appendChild(mkSelect(Object.assign({},I(),{fontSize:"12px",padding:"8px"}),priceBandKeys.map(function(k){return priceBandLabels[k];}),priceBandLabels[OFFPLAN_STATE.filterPriceBand],function(v){
    var found=priceBandKeys.find(function(k){return priceBandLabels[k]===v;});
    OFFPLAN_STATE.filterPriceBand=found||"";render();
  }));
  var handoverLabels={"":"Any Handover","1y":"Within 1 Year","1-2y":"1–2 Years","2-3y":"2–3 Years","3y+":"3+ Years"};
  var handoverKeys=Object.keys(handoverLabels);
  filterRow2.appendChild(mkSelect(Object.assign({},I(),{fontSize:"12px",padding:"8px"}),handoverKeys.map(function(k){return handoverLabels[k];}),handoverLabels[OFFPLAN_STATE.filterHandoverRange],function(v){
    var found=handoverKeys.find(function(k){return handoverLabels[k]===v;});
    OFFPLAN_STATE.filterHandoverRange=found||"";render();
  }));
  filterRow2.appendChild(mkSelect(Object.assign({},I(),{fontSize:"12px",padding:"8px"}),["Handover Date","Highest Growth","Newest"],{handover:"Handover Date",growth:"Highest Growth",newest:"Newest"}[OFFPLAN_STATE.sort]||"Handover Date",function(v){OFFPLAN_STATE.sort={"Handover Date":"handover","Highest Growth":"growth","Newest":"newest"}[v]||"handover";render();}));
  // Filter rows only apply to the project List/Map views — Directory shows
  // developer contacts, a completely different dataset with its own search.
  if(OFFPLAN_STATE.view!=="directory"){
    wrap.appendChild(filterRow1);
    wrap.appendChild(filterRow2);
  }

  // List / Map / Directory toggle — Directory added 2026-08-05 (Phase 3 of
  // the GenieMap gap-closing plan).
  var viewToggle=el("div",{style:{display:"flex",gap:"6px",marginBottom:"16px"}});
  [["list","☰ List"],["map","📍 Map"],["directory","👥 Directory"]].forEach(function(pair){
    var active=OFFPLAN_STATE.view===pair[0];
    var b=el("button",{style:{flex:"1",padding:"9px",borderRadius:"9px",border:"1px solid "+(active?cl.goldDim||cl.gold:cl.border),background:active?(cl.goldFaint||"rgba(212,175,55,0.1)"):"transparent",color:active?cl.gold:cl.sub,fontSize:"12px",fontWeight:active?"700":"500",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    b.textContent=pair[1];
    b.addEventListener("click",function(){OFFPLAN_STATE.view=pair[0];render();});
    viewToggle.appendChild(b);
  });
  wrap.appendChild(viewToggle);

  // Directory is a fully separate dataset (developer contacts, not
  // projects) — branches out here before any project-specific loading/
  // error/empty-state/filter logic below, none of which applies to it.
  if(OFFPLAN_STATE.view==="directory"){
    wrap.appendChild(_renderDeveloperDirectory(cl));
    return wrap;
  }

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

  var filtered=_offplanSortItems(_offplanFilteredItems());

  if(filtered.length===0){
    var emptyCard=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"32px 20px",textAlign:"center"}});
    emptyCard.appendChild(div({fontSize:"28px",marginBottom:"10px"},"🏗"));
    emptyCard.appendChild(div({color:"#E8EDF5",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},OFFPLAN_STATE.projects.length===0?"No off-plan projects tracked yet":"No projects match these filters"));
    emptyCard.appendChild(div({color:cl.sub,fontSize:"12px",lineHeight:"1.6"},OFFPLAN_STATE.projects.length===0?"Be the first to submit a project you know about — it'll be reviewed and published once verified.":"Try clearing a filter above."));
    wrap.appendChild(emptyCard);
    return wrap;
  }

  if(OFFPLAN_STATE.view==="map"){
    wrap.appendChild(_renderOffplanMap(cl,filtered));
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

  var bottomRow=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"4px",gap:"8px"}});
  if(p.source_url){
    var srcLink=el("a",{href:p.source_url,target:"_blank",rel:"noopener",style:{display:"inline-block",color:cl.gold,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",textDecoration:"none"}});
    srcLink.textContent="Source →";
    bottomRow.appendChild(srcLink);
  }
  // Developer Sales-Contact Directory link (Phase 3, added 2026-08-05) —
  // only shown once contacts are loaded AND this project's developer has at
  // least one real published contact on file. Jumps straight to the
  // Directory view pre-filtered to this developer, rather than duplicating
  // a second inline contact-display component here.
  if(OFFPLAN_STATE.contactsLoaded&&!OFFPLAN_STATE.contactsDbError){
    var devContacts=OFFPLAN_STATE.contacts.filter(function(c){return c.developer===p.developer;});
    if(devContacts.length){
      var contactLink=el("button",{style:{background:"transparent",border:"none",color:"#3B82F6",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",padding:"0",marginLeft:"auto"}});
      contactLink.textContent="📞 "+devContacts.length+" Developer Contact"+(devContacts.length===1?"":"s")+" →";
      contactLink.addEventListener("click",function(){OFFPLAN_STATE.view="directory";OFFPLAN_STATE.contactSearch=p.developer;render();});
      bottomRow.appendChild(contactLink);
    }
  }
  if(bottomRow.children&&bottomRow.children.length)card.appendChild(bottomRow);
  return card;
}

function _renderContactCard(cl,c){
  var card=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"14px",marginBottom:"10px"}});
  var topRow=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px",gap:"8px"}});
  var left=el("div",{});
  left.appendChild(div({color:"#E8EDF5",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},c.contact_name));
  left.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},c.developer+(c.role?" · "+c.role:"")));
  if(c.office_area)left.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},c.office_area));
  topRow.appendChild(left);
  card.appendChild(topRow);

  var actRow=el("div",{style:{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"8px"}});
  function actBtn(label,color,href){
    var b=el("a",{href:href,target:"_blank",rel:"noopener",style:{display:"inline-flex",alignItems:"center",gap:"4px",background:hexAlpha(color,0.1),border:"1px solid "+hexAlpha(color,0.3),borderRadius:"8px",padding:"6px 11px",fontSize:"10.5px",fontWeight:"700",color:color,fontFamily:"'Space Grotesk',monospace",textDecoration:"none"}});
    b.textContent=label;
    return b;
  }
  if(c.phone)actRow.appendChild(actBtn("📞 Call","#3B82F6","tel:"+c.phone.replace(/[^0-9+]/g,"")));
  var waNum=(c.whatsapp||c.phone||"").replace(/[^0-9+]/g,"");
  if(waNum)actRow.appendChild(actBtn("WhatsApp","#25D366","https://wa.me/"+waNum.replace(/^\+/,"")));
  if(c.email)actRow.appendChild(actBtn("✉ Email","#F59E0B","mailto:"+c.email));
  card.appendChild(actRow);

  if(c.notes)card.appendChild(div({color:cl.sub,fontSize:"10.5px",fontFamily:"'Inter',sans-serif",marginTop:"8px",lineHeight:"1.5"},c.notes));
  if(c.source_url){
    var srcLink=el("a",{href:c.source_url,target:"_blank",rel:"noopener",style:{display:"inline-block",marginTop:"6px",color:cl.gold,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",textDecoration:"none"}});
    srcLink.textContent="Source →";
    card.appendChild(srcLink);
  }
  return card;
}

function _renderContactSubmitForm(cl){
  var card=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"16px"}});
  var f=OFFPLAN_STATE.contactForm;
  card.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"Submit a Developer Contact"));
  if(OFFPLAN_STATE.contactSubmitOk){
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
  grid.appendChild(field("Developer","developer","e.g. Emaar"));
  grid.appendChild(field("Contact Name","contactName","e.g. Sara Al Mansoori"));
  grid.appendChild(field("Role (optional)","role","e.g. Off-Plan Sales Manager"));
  grid.appendChild(field("Office / Area (optional)","officeArea","e.g. Business Bay HQ"));
  grid.appendChild(field("Phone","phone","+971 5..."));
  grid.appendChild(field("WhatsApp (optional, if different)","whatsapp","+971 5..."));
  grid.appendChild(field("Email (optional)","email","name@developer.com"));
  grid.appendChild(field("Source","source","linkedin / developer-site / met in person"));
  card.appendChild(grid);
  card.appendChild(el("div",{style:{marginTop:"8px"}},[field("Source URL (optional)","sourceUrl","https://...")]));
  card.appendChild(el("div",{style:{marginTop:"8px"}},[field("Notes (optional)","notes","Anything else worth noting")]));
  if(OFFPLAN_STATE.contactSubmitError)card.appendChild(div({color:"#EF4444",fontSize:"11px",marginTop:"8px"},OFFPLAN_STATE.contactSubmitError));
  var btn=el("button",{style:{width:"100%",marginTop:"12px",padding:"11px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#C9A84C,#D4A843)",color:"#070B14",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  btn.textContent=OFFPLAN_STATE.contactSubmitting?"Submitting…":"Submit for Review";
  btn.addEventListener("click",contactSubmit);
  card.appendChild(btn);
  return card;
}

function _renderDeveloperDirectory(cl){
  var wrap=el("div",{});
  var hdr=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}});
  hdr.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Developer Sales-Contact Directory"));
  wrap.appendChild(hdr);
  wrap.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",marginBottom:"12px"},
    "Real sales contacts at the developers behind these off-plan launches — reach out directly instead of going through a generic inquiry form."));

  var submitBtn=el("button",{style:{width:"100%",padding:"10px",borderRadius:"10px",border:"1px solid rgba(212,175,55,0.3)",background:"rgba(212,175,55,0.08)",color:cl.gold,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",marginBottom:"12px"}});
  submitBtn.textContent=OFFPLAN_STATE.showContactForm?"− Hide Submit Form":"+ Submit a Developer Contact";
  submitBtn.addEventListener("click",function(){OFFPLAN_STATE.showContactForm=!OFFPLAN_STATE.showContactForm;OFFPLAN_STATE.contactSubmitOk=false;render();});
  wrap.appendChild(submitBtn);
  if(OFFPLAN_STATE.showContactForm)wrap.appendChild(_renderContactSubmitForm(cl));

  if(!OFFPLAN_STATE.contactsLoaded&&!OFFPLAN_STATE.contactsLoading&&typeof contactsLoad==="function")contactsLoad();

  if(OFFPLAN_STATE.contactsLoading||!OFFPLAN_STATE.contactsLoaded){
    wrap.appendChild(div({color:cl.sub,fontSize:"12px",textAlign:"center",padding:"30px 0"},"Loading developer contacts…"));
    return wrap;
  }
  if(OFFPLAN_STATE.contactsDbError){
    var errCard=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"20px",textAlign:"center"}});
    errCard.appendChild(div({color:cl.sub,fontSize:"12px"},"Developer contacts aren't available yet — this feature is still being set up."));
    wrap.appendChild(errCard);
    return wrap;
  }

  var searchInp=el("input",{type:"text",placeholder:"Filter by developer or contact name…",
    style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"9px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"10px"}});
  searchInp.value=OFFPLAN_STATE.contactSearch||"";
  searchInp.addEventListener("input",function(){OFFPLAN_STATE.contactSearch=this.value;render();});
  wrap.appendChild(searchInp);

  var q=(OFFPLAN_STATE.contactSearch||"").toLowerCase();
  var matches=OFFPLAN_STATE.contacts.filter(function(c){
    if(!q)return true;
    return (c.developer||"").toLowerCase().indexOf(q)!==-1||(c.contact_name||"").toLowerCase().indexOf(q)!==-1;
  });

  if(!matches.length){
    var emptyCard=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"32px 20px",textAlign:"center"}});
    emptyCard.appendChild(div({fontSize:"28px",marginBottom:"10px"},"👥"));
    emptyCard.appendChild(div({color:"#E8EDF5",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},OFFPLAN_STATE.contacts.length===0?"No developer contacts on file yet":"No contacts match this filter"));
    emptyCard.appendChild(div({color:cl.sub,fontSize:"12px",lineHeight:"1.6"},OFFPLAN_STATE.contacts.length===0?"Be the first to submit a real contact you know — it'll be reviewed and published once verified.":"Try clearing the filter above."));
    wrap.appendChild(emptyCard);
    return wrap;
  }

  matches.forEach(function(c){wrap.appendChild(_renderContactCard(cl,c));});
  return wrap;
}
