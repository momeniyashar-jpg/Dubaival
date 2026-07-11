// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved.
// --- OFF-MARKET PRIVATE EXCHANGE (OFM) -------------------------------------------
// Blind matching: listings hidden, requester posts requirements → AI matches →
// lister approves → 9-stage pipeline → DLD closing.

// ── Backward-compat shell (app.js routes via DEAL_STATE.mode) ──────────────────
var DEAL_STATE={mode:"browse",agentHub:{mode:"list",agents:[],referrals:[],
  regForm:{name:"",phone:"",email:"",company:"",rera:"",areas:"",specialties:"",bio:""},
  loading:false,loaded:false},adminToken:null,
  videoAnalyses:[],videoForm:{dealId:"",videoUrl:"",title:"",summary:"",agentId:null}};
// Session-only: admin password is re-verified via the admin_verify RPC on
// login (see _ofmAdminLogin) and never persisted to disk.
try{
  localStorage.removeItem("dv_admin_token"); // drop any pre-existing leftover credential
  var _at=sessionStorage.getItem("dv_admin_token");
  if(_at)DEAL_STATE.adminToken=_at;
}catch(e){}

// ── OFM Main State ─────────────────────────────────────────────────────────────
var OFM_STATE={
  view:"dashboard",
  // Lister flow (3 steps)
  listStep:1,
  listForm:{listerType:"",phone:"",doc1:null,doc1Name:"",doc2:null,doc2Name:"",
    area:"",building:"",unitNumber:"",propType:"apartment",beds:"",baths:"1",
    parking:1,maidRoom:false,studyRoom:false,storageRoom:false,sizeSqft:"",
    floorNum:"",viewType:"",furnished:"Unfurnished",vacant:true,tenancyEndDate:"",
    askingPrice:"",priceNegotiable:true,serviceChargePsf:"",notes:"",purpose:"sale"},
  listPosting:false,listMatchCount:0,
  // Requester flow (2 steps)
  reqStep:1,
  reqForm:{requesterType:"",phone:"",doc:null,docName:"",building:"",area:"",
    beds:"",maxBudget:"",paymentMethod:"flexible",minSize:"",preferredFloor:"",
    viewPref:"",timeline:"3 months",notes:"",purpose:"sale"},
  reqPosting:false,reqMatchCount:0,
  // My data
  myListings:[],listingsLoading:false,
  myRequests:[],requestsLoading:false,
  // Match view
  activeMatchId:null,activeMatch:null,matchReqDetails:null,
  matchesForListing:{},matchesForRequest:{},matchesLoading:false,
  messages:[],messagesLoading:false,msgDraft:"",msgSending:false,
  media:[],mediaLoading:false,mediaUploading:false,
  activeListing:null,activeRequest:null,
};

// ── HTTP Helpers ───────────────────────────────────────────────────────────────
function _ofmH(){
  return{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,
    "Content-Type":"application/json","Prefer":"return=representation"};
}
function _ofmHR(){return{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY};}

// ── Session Tokens ─────────────────────────────────────────────────────────────
function _ofmLt(){
  try{var t=localStorage.getItem("ofm_lt");
    if(!t){t="lt"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
      localStorage.setItem("ofm_lt",t);}return t;}
  catch(e){return"lt"+Math.random().toString(36).slice(2);}
}
function _ofmRt(){
  try{var t=localStorage.getItem("ofm_rt");
    if(!t){t="rt"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
      localStorage.setItem("ofm_rt",t);}return t;}
  catch(e){return"rt"+Math.random().toString(36).slice(2);}
}

// Anonymous display ID from token (e.g. "A7K9")
function _ofmAnonId(token){
  var h=5381;for(var i=0;i<(token||"").length;i++)h=((h<<5)+h)^token.charCodeAt(i);
  h=Math.abs(h);var c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return c[h%32]+c[(h>>5)%32]+c[(h>>10)%32]+c[(h>>15)%32];
}

// Compress image to base64 (max 700px, 70% quality)
function _ofmCompressDoc(file){
  return new Promise(function(resolve,reject){
    if(!file){reject(new Error("No file"));return;}
    var r=new FileReader();
    r.onload=function(e){
      var img=new Image();
      img.onload=function(){
        var mx=700,sc=Math.min(mx/img.width,mx/img.height,1);
        var cv=document.createElement("canvas");
        cv.width=Math.round(img.width*sc);cv.height=Math.round(img.height*sc);
        cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
        resolve(cv.toDataURL("image/jpeg",0.70));
      };
      img.onerror=reject;img.src=e.target.result;
    };
    r.onerror=reject;r.readAsDataURL(file);
  });
}

// Derive area from building name using global DB
function _ofmAreaFromBuilding(building){
  if(!building||typeof DB==="undefined")return"";
  var key=building.toLowerCase().trim();
  if(DB[key])return DB[key].a||"";
  // Try partial match
  var keys=Object.keys(DB);
  for(var i=0;i<keys.length;i++){
    if(keys[i].indexOf(key)===0&&DB[keys[i]].a)return DB[keys[i]].a;
  }
  return"";
}

// ── Matching Engine ────────────────────────────────────────────────────────────
// Hard rules: building match + beds match + price ≤ budget × 1.15 (15% tolerance)
// Score: building(60) + beds(25) + price proximity(15) = max 100. Min 60 to create.
function _ofmScoreMatch(listing,req){
  var lb=(listing.building||"").toLowerCase().replace(/\s+/g," ").trim();
  var rb=(req.building||"").toLowerCase().replace(/\s+/g," ").trim();
  if(!lb||!rb)return null;

  var bScore=0;
  if(lb===rb)bScore=60;
  else if(lb.indexOf(rb)!==-1||rb.indexOf(lb)!==-1)bScore=40;
  else return null;

  var bedsScore=0;
  if(listing.beds&&req.beds){
    if(listing.beds===req.beds)bedsScore=25;
    else return null;// beds mismatch — hard filter
  }

  var priceScore=0,priceDelta=0;
  if(listing.asking_price&&req.max_budget){
    var ratio=listing.asking_price/req.max_budget;
    if(ratio>1.15)return null;// over 15% — no match
    priceDelta=parseFloat(((ratio-1)*100).toFixed(1));
    priceScore=ratio<=1.00?15:ratio<=1.07?10:5;
  }

  var score=bScore+bedsScore+priceScore;
  if(score<60)return null;
  var notes=[];
  if(bScore===60)notes.push("Exact building");else notes.push("Building partial");
  if(bedsScore)notes.push(req.beds||listing.beds);
  if(listing.asking_price&&req.max_budget)
    notes.push(priceDelta<=0?"Within budget":priceDelta.toFixed(1)+"% over");
  return{score,rationale:notes.join("; "),priceDeltaPct:priceDelta};
}

// Run matching when LISTER posts (matches against existing requests)
async function _ofmRunMatchingForListing(listingId,listing,listerToken){
  try{
    var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_requests?select=id,requester_token,building,beds,max_budget,purpose&active=eq.true&limit=500",
      {headers:_ofmHR()});
    if(!r.ok)return 0;
    var reqs=await r.json();
    var rows=[];
    reqs.filter(function(req){return req.purpose===(listing.purpose||"sale");})
      .forEach(function(req){
        var res=_ofmScoreMatch(listing,req);
        if(res)rows.push({listing_id:listingId,request_id:req.id,
          lister_token:listerToken,requester_token:req.requester_token,
          ai_score:res.score,ai_rationale:res.rationale,
          price_delta_pct:res.priceDeltaPct,stage:"matched"});
      });
    if(!rows.length)return 0;
    await fetch(SUPABASE_URL+"/rest/v1/ofm_matches",{method:"POST",
      headers:Object.assign({},_ofmH(),{"Prefer":"return=minimal,resolution=ignore-duplicates"}),
      body:JSON.stringify(rows)});
    return rows.length;
  }catch(e){console.warn("OFM match:",e.message);return 0;}
}

// Run matching when REQUESTER posts (matches against existing listings)
// Only fetches non-sensitive columns: id, lister_token, building, beds, asking_price, purpose
async function _ofmRunMatchingForRequest(requestId,req,requesterToken){
  try{
    var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_listings?select=id,lister_token,building,beds,asking_price,purpose&active=eq.true&limit=500",
      {headers:_ofmHR()});
    if(!r.ok)return 0;
    var listings=await r.json();
    var rows=[];
    listings.filter(function(l){return l.purpose===(req.purpose||"sale");})
      .forEach(function(l){
        var res=_ofmScoreMatch(l,req);
        if(res)rows.push({listing_id:l.id,request_id:requestId,
          lister_token:l.lister_token,requester_token:requesterToken,
          ai_score:res.score,ai_rationale:res.rationale,
          price_delta_pct:res.priceDeltaPct,stage:"matched"});
      });
    if(!rows.length)return 0;
    await fetch(SUPABASE_URL+"/rest/v1/ofm_matches",{method:"POST",
      headers:Object.assign({},_ofmH(),{"Prefer":"return=minimal,resolution=ignore-duplicates"}),
      body:JSON.stringify(rows)});
    return rows.length;
  }catch(e){console.warn("OFM match:",e.message);return 0;}
}
// ── CRUD: Submit Listing ───────────────────────────────────────────────────────
async function _ofmSubmitListing(f,listerToken){
  var price=parseInt(String(f.askingPrice||"").replace(/,/g,""))||0;
  var sqft=parseFloat(f.sizeSqft)||0;
  var area=f.area||_ofmAreaFromBuilding(f.building);
  // Auto-valuation via DubAIVal engine
  var dv={};
  try{
    if(f.building&&sqft&&price&&f.purpose==="sale"){
      var vi={area:area,building:f.building,buaSize:String(sqft),price:String(price),
        propCategory:(f.propType==="villa"||f.propType==="townhouse")?"villa":"apartment",
        beds:f.beds||"2 BR",view:f.viewType||"Not specified",floor:f.floorNum||"",
        furnished:f.furnished||"Unfurnished",parking:String(f.parking||1),serviceCharge:""};
      var v=computeValuation(vi,f.building,null);
      if(v){dv={dv_fair_price:v.fairPrice,dv_psf:v.adjPSF,dv_verdict:v.verdict,
        dv_confidence:v.confScore,dv_signal:v.investSignal?v.investSignal.label:null};}
    }
  }catch(e){}
  var row=Object.assign({
    lister_token:listerToken,lister_type:f.listerType,
    doc1_base64:f.doc1||null,doc2_base64:f.doc2||null,phone:f.phone,
    area:area,building:f.building,unit_number:f.unitNumber||null,
    prop_type:f.propType||"apartment",beds:f.beds,baths:f.baths||null,
    parking:parseInt(f.parking)||1,maid_room:!!f.maidRoom,
    study_room:!!f.studyRoom,storage_room:!!f.storageRoom,
    size_sqft:sqft||null,floor_num:f.floorNum||null,view_type:f.viewType||null,
    furnished:f.furnished||"Unfurnished",vacant:f.vacant!==false,
    tenancy_end_date:f.tenancyEndDate||null,asking_price:price||null,
    price_negotiable:f.priceNegotiable!==false,
    service_charge_psf:parseFloat(f.serviceChargePsf)||null,
    notes:f.notes||null,purpose:f.purpose||"sale"
  },dv);
  var resp=await fetch(SUPABASE_URL+"/rest/v1/ofm_listings",
    {method:"POST",headers:_ofmH(),body:JSON.stringify(row)});
  if(!resp.ok){var e=await resp.json().catch(function(){return{};});
    throw new Error(e.message||"Listing failed");}
  var created=await resp.json();
  return Array.isArray(created)?created[0]:created;
}

// ── CRUD: Submit Request ───────────────────────────────────────────────────────
async function _ofmSubmitRequest(f,requesterToken){
  var budget=parseInt(String(f.maxBudget||"").replace(/,/g,""))||0;
  var area=f.area||_ofmAreaFromBuilding(f.building);
  var row={requester_token:requesterToken,requester_type:f.requesterType,
    doc_base64:f.doc||null,phone:f.phone,
    building:f.building,area:area||null,beds:f.beds,
    max_budget:budget||null,purpose:f.purpose||"sale",
    payment_method:f.paymentMethod||"flexible",
    min_size:parseFloat(f.minSize)||null,
    preferred_floor:f.preferredFloor||null,view_pref:f.viewPref||null,
    timeline:f.timeline||"3 months",notes:f.notes||null};
  var resp=await fetch(SUPABASE_URL+"/rest/v1/ofm_requests",
    {method:"POST",headers:_ofmH(),body:JSON.stringify(row)});
  if(!resp.ok){var e=await resp.json().catch(function(){return{};});
    throw new Error(e.message||"Request failed");}
  var created=await resp.json();
  return Array.isArray(created)?created[0]:created;
}

// ── CRUD: Load My Listings ─────────────────────────────────────────────────────
async function _ofmLoadMyListings(lt){
  var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_listings?select=id,area,building,unit_number,prop_type,beds,size_sqft,floor_num,asking_price,price_negotiable,vacant,dv_verdict,dv_confidence,dv_fair_price,dv_signal,active,match_count,purpose,created_at&lister_token=eq."+encodeURIComponent(lt)+"&order=created_at.desc",
    {headers:_ofmHR()});
  return r.ok?await r.json():[];
}

// ── CRUD: Load My Requests ─────────────────────────────────────────────────────
async function _ofmLoadMyRequests(rt){
  var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_requests?select=id,building,area,beds,max_budget,purpose,payment_method,timeline,active,match_count,created_at&requester_token=eq."+encodeURIComponent(rt)+"&order=created_at.desc",
    {headers:_ofmHR()});
  return r.ok?await r.json():[];
}

// ── CRUD: Load Matches ─────────────────────────────────────────────────────────
async function _ofmLoadMatchesForListing(listingId){
  var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_matches?listing_id=eq."+listingId+"&stage=neq.rejected&order=ai_score.desc",
    {headers:_ofmHR()});
  return r.ok?await r.json():[];
}
async function _ofmLoadMatchesForRequest(requestId){
  var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_matches?request_id=eq."+requestId+"&stage=neq.rejected&order=created_at.desc",
    {headers:_ofmHR()});
  return r.ok?await r.json():[];
}

// Load anonymized request details (for lister to see what requester wants)
async function _ofmLoadReqDetails(requestId){
  var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_requests?id=eq."+requestId+"&select=id,requester_type,building,area,beds,max_budget,purpose,payment_method,min_size,preferred_floor,view_pref,timeline,notes",
    {headers:_ofmHR()});
  if(!r.ok)return null;var d=await r.json();return d[0]||null;
}

// Load my listing detail (full, for lister only)
async function _ofmLoadListingDetail(listingId,lt){
  var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_listings?id=eq."+listingId+"&lister_token=eq."+encodeURIComponent(lt),
    {headers:_ofmHR()});
  if(!r.ok)return null;var d=await r.json();return d[0]||null;
}

// ── CRUD: Match Actions ────────────────────────────────────────────────────────
async function _ofmApproveMatch(matchId){
  var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_matches?id=eq."+matchId,
    {method:"PATCH",headers:_ofmH(),
     body:JSON.stringify({stage:"lister_approved",lister_seen:true,
       updated_at:new Date().toISOString()})});
  return r.ok;
}
async function _ofmRejectMatch(matchId,note){
  var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_matches?id=eq."+matchId,
    {method:"PATCH",headers:_ofmH(),
     body:JSON.stringify({stage:"rejected",rejected_by:"lister",
       rejection_note:note||null,updated_at:new Date().toISOString()})});
  return r.ok;
}
async function _ofmAdvanceStage(matchId,newStage,extra){
  var payload=Object.assign({stage:newStage,updated_at:new Date().toISOString()},extra||{});
  var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_matches?id=eq."+matchId,
    {method:"PATCH",headers:_ofmH(),body:JSON.stringify(payload)});
  return r.ok;
}

// ── CRUD: Messages ─────────────────────────────────────────────────────────────
async function _ofmSendMsg(matchId,role,text,token){
  var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_messages",
    {method:"POST",headers:_ofmH(),
     body:JSON.stringify({match_id:matchId,sender_role:role,sender_token:token,body:text.trim()})});
  return r.ok;
}
async function _ofmLoadMsgs(matchId){
  var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_messages?match_id=eq."+matchId+"&order=created_at.asc&limit=200",
    {headers:_ofmHR()});
  return r.ok?await r.json():[];
}

// ── CRUD: Media ────────────────────────────────────────────────────────────────
async function _ofmUploadMedia(matchId,lt,file){
  try{
    var b64=await _ofmCompressDoc(file);
    var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_media",
      {method:"POST",headers:_ofmH(),
       body:JSON.stringify({match_id:matchId,lister_token:lt,media_type:"photo",data:b64})});
    return r.ok;
  }catch(e){return false;}
}
async function _ofmLoadMedia(matchId){
  var r=await fetch(SUPABASE_URL+"/rest/v1/ofm_media?match_id=eq."+matchId+"&order=created_at.asc",
    {headers:_ofmHR()});
  return r.ok?await r.json():[];
}

// ── Stats: Platform overview ───────────────────────────────────────────────────
async function _ofmLoadStats(){
  try{
    var [lr,rr,mr]=await Promise.all([
      fetch(SUPABASE_URL+"/rest/v1/ofm_listings?select=id&active=eq.true",{headers:_ofmHR()}),
      fetch(SUPABASE_URL+"/rest/v1/ofm_requests?select=id&active=eq.true",{headers:_ofmHR()}),
      fetch(SUPABASE_URL+"/rest/v1/ofm_matches?select=id&stage=eq.completed",{headers:_ofmHR()})
    ]);
    var listings=lr.ok?(await lr.json()).length:0;
    var requests=rr.ok?(await rr.json()).length:0;
    var completed=mr.ok?(await mr.json()).length:0;
    return{listings,requests,completed};
  }catch(e){return{listings:0,requests:0,completed:0};}
}
// ── Pipeline Stages ────────────────────────────────────────────────────────────
var OFM_STAGES=[
  {id:"matched",         label:"Matched",          icon:"search",        lbl:"AI Match"},
  {id:"lister_approved", label:"Seller Interested", icon:"check-circle",  lbl:"Seller OK"},
  {id:"chat_active",     label:"Chat Open",         icon:"message-circle",lbl:"Chat"},
  {id:"media_shared",    label:"Photos Shared",     icon:"camera",        lbl:"Media"},
  {id:"id_submitted",    label:"ID Verified",       icon:"credit-card",   lbl:"ID"},
  {id:"viewing_arranged",label:"Viewing Set",       icon:"home",          lbl:"Viewing"},
  {id:"offer_made",      label:"Offer Made",        icon:"clipboard-list",lbl:"Offer"},
  {id:"closing",         label:"In Closing",        icon:"scale",         lbl:"DLD"},
  {id:"completed",       label:"Completed",         icon:"party-popper",  lbl:"Done"},
];
function _ofmStageIdx(stage){
  var i=OFM_STAGES.findIndex(function(s){return s.id===stage;});return i>=0?i:0;
}
function _ofmStageMeta(stage){
  return OFM_STAGES.find(function(s){return s.id===stage;})||OFM_STAGES[0];
}

// Shared spinner helper
function _ofmSpinner(cl,msg){
  return div({textAlign:"center",padding:"40px 20px"},[
    div({width:"28px",height:"28px",borderRadius:"50%",border:"2px solid "+cl.border,
      borderTopColor:cl.gold,animation:"spin 0.8s linear infinite",margin:"0 auto 10px"}),
    span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},msg||"Loading…")]);
}

// ── Navigation Bar ─────────────────────────────────────────────────────────────
function _ofmNav(cl){
  var lt=_ofmLt(),rt=_ofmRt();
  var hasListings=!!localStorage.getItem("ofm_lt");
  var hasRequests=!!localStorage.getItem("ofm_rt");
  var tabs=[{v:"dashboard",l:"Exchange",ico:"zap"}];
  if(hasListings)tabs.push({v:"my_listings",l:"My Listings",ico:"folder-open"});
  if(hasRequests)tabs.push({v:"my_requests",l:"My Requests",ico:"search"});
  tabs.push({v:"agent_hub",l:"Agents",ico:"users"});

  var nav=div({display:"flex",gap:"4px",marginBottom:"16px",overflowX:"auto",
    padding:"2px 0",WebkitOverflowScrolling:"touch"});
  tabs.forEach(function(t){
    var active=OFM_STATE.view===t.v;
    var btn=el("button",{style:{
      display:"flex",alignItems:"center",gap:"5px",
      padding:"8px 14px",borderRadius:"20px",fontSize:"11px",fontWeight:"700",
      fontFamily:"'Space Grotesk',monospace",cursor:"pointer",whiteSpace:"nowrap",
      flexShrink:"0",transition:"all 0.15s",
      background:active?"linear-gradient(135deg,"+hexAlpha(cl.gold,0.18)+","+hexAlpha(cl.gold,0.08)+")":"transparent",
      color:active?cl.gold:cl.sub,
      border:"1px solid "+(active?hexAlpha(cl.gold,0.4):cl.border)},
      onclick:function(){OFM_STATE.view=t.v;render();}});
    btn.innerHTML='<i data-lucide="'+t.ico+'" style="width:11px;height:11px;vertical-align:middle;margin-right:4px"></i>'+t.l;
    nav.appendChild(btn);
  });
  return nav;
}

// ── Pipeline Bar Component ─────────────────────────────────────────────────────
function _ofmPipelineBar(currentStage,cl){
  var curIdx=_ofmStageIdx(currentStage);
  var wrap=div({overflowX:"auto",WebkitOverflowScrolling:"touch",marginBottom:"16px"});
  var row=div({display:"flex",alignItems:"center",minWidth:"fit-content",gap:"0",padding:"4px 0"});
  OFM_STAGES.forEach(function(s,i){
    var done=i<curIdx,active=i===curIdx;
    var dotColor=done?cl.green:active?cl.gold:cl.border;
    var dot=div({width:"28px",height:"28px",borderRadius:"50%",flexShrink:"0",
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",
      background:done?hexAlpha(cl.green,0.15):active?hexAlpha(cl.gold,0.18):"transparent",
      border:"2px solid "+(done?cl.green:active?cl.gold:cl.border),
      color:done?cl.green:active?cl.gold:cl.sub});
    if(done){dot.textContent="✓";}
    else if(active){dot.innerHTML='<i data-lucide="'+s.icon+'" style="width:12px;height:12px;color:'+cl.gold+'"></i>';}
    else{dot.textContent=""+(i+1);}
    var col=div({display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",minWidth:"48px"});
    col.appendChild(dot);
    col.appendChild(span({color:done?cl.green:active?cl.gold:cl.sub,fontSize:"8px",
      fontFamily:"'Space Grotesk',monospace",fontWeight:active?"700":"400",
      textAlign:"center",lineHeight:"1.2",whiteSpace:"nowrap"},s.lbl));
    row.appendChild(col);
    if(i<OFM_STAGES.length-1){
      row.appendChild(div({height:"2px",width:"16px",flexShrink:"0",marginBottom:"16px",
        background:i<curIdx?"linear-gradient(90deg,"+cl.green+","+cl.green+")":cl.border}));
    }
  });
  wrap.appendChild(row);return wrap;
}

// ── Main Router ────────────────────────────────────────────────────────────────
function renderDeals(){
  var cl=C();
  var wrap=div({maxWidth:"640px",margin:"0 auto",padding:"0 0 80px"});

  // Legacy mode compatibility from app.js
  if(DEAL_STATE.mode==="agents"){OFM_STATE.view="agent_hub";DEAL_STATE.mode="browse";}
  if(DEAL_STATE.mode==="admin"){OFM_STATE.view="admin";DEAL_STATE.mode="browse";}

  wrap.appendChild(_ofmNav(cl));
  var v=OFM_STATE.view;
  if(v==="post_listing")return _ofmPostListing(wrap,cl);
  if(v==="post_request")return _ofmPostRequest(wrap,cl);
  if(v==="my_listings")return _ofmMyListings(wrap,cl);
  if(v==="my_requests")return _ofmMyRequests(wrap,cl);
  if(v==="match_view")return _ofmMatchView(wrap,cl);
  if(v==="agent_hub")return renderAgentHub(wrap,cl);
  if(v==="admin")return renderAdminDashboard(wrap,cl);
  return _ofmDashboard(wrap,cl);
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function _ofmDashboard(wrap,cl){
  // Hero card
  var hero=div({background:"linear-gradient(135deg,#0D1220 0%,#111827 100%)",
    border:"1px solid "+hexAlpha(cl.gold,0.25),borderRadius:"16px",padding:"28px 20px",
    marginBottom:"14px",position:"relative",overflow:"hidden"});
  hero.appendChild(div({position:"absolute",top:"-30px",right:"-30px",width:"130px",height:"130px",
    borderRadius:"50%",background:"radial-gradient(circle,"+hexAlpha(cl.gold,0.07)+" 0%,transparent 70%)"}));
  hero.appendChild(div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"},[
    div({background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:"#070B14",
      fontSize:"8px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",
      padding:"4px 10px",borderRadius:"20px",letterSpacing:"0.1em"},"⚡ OFF-MARKET EXCHANGE"),
    div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Private · Verified · Blind")
  ]));
  hero.appendChild(div({color:cl.white,fontSize:"22px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",
    lineHeight:"1.2",marginBottom:"8px"},"Trade Property\nWithout Listing Publicly"));
  hero.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",marginBottom:"20px"},
    "Your property stays hidden. AI matches you with verified buyers. You approve who sees it."));

  // CTA buttons
  var ctaRow=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"20px"});
  var haveBtn=el("button",{style:{padding:"16px 12px",borderRadius:"12px",cursor:"pointer",
    background:"linear-gradient(135deg,"+hexAlpha(cl.gold,0.15)+","+hexAlpha(cl.gold,0.05)+")",
    border:"1px solid "+hexAlpha(cl.gold,0.4),color:cl.gold,fontFamily:"'Space Grotesk',monospace",
    fontWeight:"800",fontSize:"12px"},
    onclick:function(){OFM_STATE.view="post_listing";OFM_STATE.listStep=1;render();}});
  haveBtn.innerHTML='<i data-lucide="home" style="width:14px;height:14px;vertical-align:middle;margin-right:5px"></i>I HAVE A<br>PROPERTY';
  var needBtn=el("button",{style:{padding:"16px 12px",borderRadius:"12px",cursor:"pointer",
    background:"linear-gradient(135deg,rgba(59,130,246,0.12),rgba(59,130,246,0.05))",
    border:"1px solid rgba(59,130,246,0.35)",color:"#60A5FA",fontFamily:"'Space Grotesk',monospace",
    fontWeight:"800",fontSize:"12px"},
    onclick:function(){OFM_STATE.view="post_request";OFM_STATE.reqStep=1;render();}});
  needBtn.innerHTML='<i data-lucide="search" style="width:14px;height:14px;vertical-align:middle;margin-right:5px"></i>I NEED A<br>PROPERTY';
  ctaRow.appendChild(haveBtn);ctaRow.appendChild(needBtn);hero.appendChild(ctaRow);

  // Stats row (async load)
  var statsRow=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"});
  [{l:"Active Sellers",v:"–"},{l:"Active Buyers",v:"–"},{l:"Deals Closed",v:"–"}]
    .forEach(function(s,i){
      var card=div({background:hexAlpha(cl.gold,0.04),borderRadius:"10px",padding:"10px",
        textAlign:"center",border:"1px solid "+cl.border});
      var vEl=div({color:cl.gold,fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},s.v);
      card.appendChild(vEl);
      card.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginTop:"3px"},s.l));
      statsRow.appendChild(card);
      // Async fill
      _ofmLoadStats().then(function(stats){
        var vals=[stats.listings,stats.requests,stats.completed];
        vEl.textContent=String(vals[i]);
      }).catch(function(){});
    });
  hero.appendChild(statsRow);
  wrap.appendChild(hero);

  // How it works
  var how=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",
    padding:"18px",marginBottom:"14px"});
  how.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.12em",
    textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",
    marginBottom:"14px",fontWeight:"700"},"◆ HOW IT WORKS"));
  var steps=[
    {ico:"lock",t:"List Privately","d":"Submit property + documents. Your listing is never public."},
    {ico:"bot",t:"AI Matching","d":"System finds buyers matching your building, beds & price (±15%)."},
    {ico:"check-circle",t:"You Approve","d":"Review each buyer's requirements. Accept or decline anonymously."},
    {ico:"message-circle",t:"Anonymous Chat","d":"Discuss via encrypted in-platform chat. No identity revealed yet."},
    {ico:"landmark",t:"DLD Closing","d":"Share ID, arrange viewing, submit offer, close through Trustee."},
  ];
  steps.forEach(function(s,i){
    var row=div({display:"flex",gap:"12px",alignItems:"flex-start",
      marginBottom:i<steps.length-1?"12px":"0"});
    var icoCirc=div({width:"32px",height:"32px",borderRadius:"50%",flexShrink:"0",
      background:hexAlpha(cl.gold,0.1),border:"1px solid "+hexAlpha(cl.gold,0.25),
      display:"flex",alignItems:"center",justifyContent:"center"});
    icoCirc.innerHTML='<i data-lucide="'+s.ico+'" style="width:14px;height:14px;color:'+cl.gold+'"></i>';
    row.appendChild(icoCirc);
    var info=div({});
    info.appendChild(div({color:cl.subHi,fontSize:"12px",fontWeight:"700",
      fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},s.t));
    info.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",
      lineHeight:"1.5"},s.d));
    row.appendChild(info);how.appendChild(row);
  });
  wrap.appendChild(how);

  // Document requirements preview
  var docBox=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",
    padding:"16px",marginBottom:"14px"});
  docBox.appendChild(div({color:cl.sub,fontSize:"10px",letterSpacing:"0.1em",
    textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",
    marginBottom:"12px",fontWeight:"700"},"◆ DOCUMENT REQUIREMENTS"));
  var docCols=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
  [{title:"Owner",docs:["Title Deed","Emirates ID / Passport"]},
   {title:"POA",docs:["POA Agreement","POA Holder ID"]},
   {title:"Mgmt Co.",docs:["Mgmt Contract","RERA Card"]},
   {title:"Buyer / Agent",docs:["Emirates ID / Passport","or RERA Card"]}]
    .forEach(function(cat){
      var card=div({background:cl.raised,borderRadius:"10px",padding:"10px",
        border:"1px solid "+cl.border});
      card.appendChild(div({color:cl.gold,fontSize:"10px",fontWeight:"700",
        fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},cat.title));
      cat.docs.forEach(function(d){
        card.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",
          marginBottom:"2px"},"• "+d));
      });
      docCols.appendChild(card);
    });
  docBox.appendChild(docCols);
  wrap.appendChild(docBox);
  return wrap;
}
// ── Shared UI: Input + Label ───────────────────────────────────────────────────
function _ofmInp(label,placeholder,value,onChange,type,required){
  var g=div({marginBottom:"10px"});
  g.appendChild(div({color:C().sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",
    letterSpacing:"0.06em",marginBottom:"4px"},label+(required?" *":"")));
  var inp=el("input",{type:type||"text",placeholder:placeholder||"",value:value||"",
    style:{width:"100%",background:C().raised,border:"1px solid "+C().border,
      color:C().white,padding:"10px 12px",borderRadius:"8px",fontSize:"13px",
      fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
  inp.oninput=function(){onChange(this.value);};
  g.appendChild(inp);return g;
}

function _ofmSel(label,opts,val,onChange){
  var cl=C();
  var g=div({marginBottom:"10px"});
  g.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",
    letterSpacing:"0.06em",marginBottom:"4px"},label));
  var sel=el("select",{style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,
    color:cl.white,padding:"10px",borderRadius:"8px",fontSize:"13px",
    fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
  opts.forEach(function(o){
    var opt=el("option",{value:o.v||(typeof o==="string"?o:o.l)});
    opt.textContent=o.l||o;if((o.v||o)===val)opt.selected=true;sel.appendChild(opt);});
  sel.onchange=function(){onChange(this.value);};
  g.appendChild(sel);return g;
}

function _ofmDocUpload(label,fileName,onFile,cl){
  var g=div({marginBottom:"10px"});
  g.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",
    letterSpacing:"0.06em",marginBottom:"4px"},label+" * (photo or PDF scan)"));
  var inp=el("input",{type:"file",accept:"image/*,application/pdf",style:{display:"none"}});
  var btn=el("button",{style:{width:"100%",padding:"12px",borderRadius:"8px",cursor:"pointer",
    background:fileName?hexAlpha(cl.green,0.08):"transparent",
    border:"1px dashed "+(fileName?cl.green:cl.border),
    color:fileName?cl.green:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace",
    fontWeight:"600",textAlign:"left"}});
  btn.textContent=fileName?("✓ "+fileName):"📎 Tap to upload document";
  btn.onclick=function(){inp.click();};
  inp.onchange=function(){
    var file=this.files[0];if(!file)return;
    btn.textContent="Compressing…";btn.style.opacity="0.6";
    _ofmCompressDoc(file).then(function(b64){
      onFile(b64,file.name);
      btn.textContent="✓ "+file.name;
      btn.style.background=hexAlpha(cl.green,0.08);
      btn.style.borderColor=cl.green;btn.style.color=cl.green;btn.style.opacity="1";
    }).catch(function(){btn.textContent="✗ Error — retry";btn.style.opacity="1";});
  };
  g.appendChild(inp);g.appendChild(btn);return g;
}

// Building autocomplete (from DB)
function _ofmBuildingAutocomplete(label,val,onSelect,cl){
  var g=div({marginBottom:"10px",position:"relative"});
  g.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",
    letterSpacing:"0.06em",marginBottom:"4px"},label+" *"));
  var inp=el("input",{type:"text",placeholder:"e.g. Marina Gate 1, Burj Khalifa…",value:val||"",
    style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,
      color:cl.white,padding:"10px 12px",borderRadius:"8px",fontSize:"13px",
      fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
  var dropdown=el("div",{style:{position:"absolute",top:"100%",left:"0",right:"0",
    background:cl.surface,border:"1px solid "+cl.border,borderRadius:"0 0 8px 8px",
    maxHeight:"180px",overflowY:"auto",zIndex:"999",display:"none"}});
  inp.oninput=function(){
    var v=this.value.toLowerCase().trim();
    if(v.length<2){dropdown.style.display="none";onSelect(this.value,"");return;}
    var matches=[];
    if(typeof DB!=="undefined"){
      var keys=Object.keys(DB);
      for(var i=0;i<keys.length&&matches.length<12;i++){
        if(keys[i].indexOf(v)!==-1)matches.push({key:keys[i],area:DB[keys[i]].a||""});
      }
    }
    dropdown.innerHTML="";
    if(!matches.length){dropdown.style.display="none";onSelect(this.value,"");return;}
    matches.forEach(function(m){
      var opt=el("div",{style:{padding:"8px 12px",cursor:"pointer",fontSize:"12px",
        fontFamily:"'Inter',sans-serif",color:cl.subHi,borderBottom:"1px solid "+cl.border}});
      var displayName=m.key.split(" ").map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(" ");
      opt.innerHTML="<span style='color:"+cl.subHi+"'>"+displayName+"</span> <span style='color:"+cl.sub+";font-size:10px'>"+m.area+"</span>";
      opt.onmousedown=function(e){e.preventDefault();
        inp.value=displayName;dropdown.style.display="none";onSelect(displayName,m.area);};
      opt.onmouseover=function(){this.style.background=cl.raised;};
      opt.onmouseout=function(){this.style.background="";};
      dropdown.appendChild(opt);
    });
    dropdown.style.display="block";
    onSelect(this.value,"");
  };
  inp.onblur=function(){setTimeout(function(){dropdown.style.display="none";},150);};
  g.appendChild(inp);g.appendChild(dropdown);return g;
}

// ── Post Listing Form (3 Steps) ────────────────────────────────────────────────
function _ofmPostListing(wrap,cl){
  var f=OFM_STATE.listForm;
  // Step indicator
  var stepBar=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px"});
  [1,2,3].forEach(function(n){
    var active=OFM_STATE.listStep===n,done=OFM_STATE.listStep>n;
    stepBar.appendChild(div({width:"28px",height:"28px",borderRadius:"50%",
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:"700",
      fontFamily:"'Space Grotesk',monospace",flexShrink:"0",
      background:done?hexAlpha(cl.green,0.15):active?hexAlpha(cl.gold,0.18):"transparent",
      border:"2px solid "+(done?cl.green:active?cl.gold:cl.border),
      color:done?cl.green:active?cl.gold:cl.sub},done?"✓":String(n)));
    if(n<3)stepBar.appendChild(div({flex:"1",height:"2px",
      background:n<OFM_STATE.listStep?cl.green:cl.border}));
  });
  var labels=["Choose Type","Upload Docs","Property Details"];
  var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",
    padding:"20px",marginBottom:"14px"});
  card.appendChild(div({display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px"},[
    el("button",{style:{background:"transparent",border:"none",cursor:"pointer",
      color:cl.sub,fontSize:"16px",padding:"0"},
      onclick:function(){
        if(OFM_STATE.listStep>1){OFM_STATE.listStep--;render();}
        else{OFM_STATE.view="dashboard";render();}}},"←"),
    div({},[
      div({color:cl.gold,fontSize:"10px",letterSpacing:"0.1em",
        textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},
        "LIST A PROPERTY — Step "+OFM_STATE.listStep+" of 3"),
      div({color:cl.subHi,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},
        labels[OFM_STATE.listStep-1])
    ])
  ]));
  card.appendChild(stepBar);

  // ── Step 1: Lister type ──────────────────────────────────────────────────────
  if(OFM_STATE.listStep===1){
    card.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",
      lineHeight:"1.6",marginBottom:"16px"},"Select your role as the lister. Each type requires specific documents."));
    var types=[
      {id:"owner",icon:"home",title:"Owner",subtitle:"You own the property",
       docs:["Title Deed (required)","Emirates ID or Passport"]},
      {id:"poa",icon:"scroll",title:"Power of Attorney",subtitle:"You act on behalf of owner",
       docs:["POA Agreement with owner","Your Emirates ID / Passport"]},
      {id:"management",icon:"building-2",title:"Property Management Co.",subtitle:"Managing the property",
       docs:["Management Contract","Company RERA Card"]},
    ];
    types.forEach(function(t){
      var active=f.listerType===t.id;
      var tc=el("button",{style:{width:"100%",textAlign:"left",padding:"14px",marginBottom:"8px",
        borderRadius:"12px",cursor:"pointer",
        background:active?hexAlpha(cl.gold,0.1):"transparent",
        border:"2px solid "+(active?cl.gold:cl.border),
        color:"inherit",transition:"all 0.15s"},
        onclick:function(){f.listerType=t.id;render();}});
      var icoBox=div({width:"36px",height:"36px",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"10px",background:hexAlpha(cl.gold,0.12)});
      icoBox.innerHTML='<i data-lucide="'+t.icon+'" style="width:18px;height:18px;color:'+cl.gold+'"></i>';
      tc.appendChild(div({display:"flex",gap:"12px",alignItems:"flex-start"},[
        icoBox,
        div({},[
          div({color:active?cl.gold:cl.subHi,fontSize:"13px",fontWeight:"700",
            fontFamily:"'Space Grotesk',monospace"},t.title),
          div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",
            marginBottom:"6px"},t.subtitle),
          div({},t.docs.map(function(d){
            return div({color:active?hexAlpha(cl.gold,0.8):cl.sub,
              fontSize:"10px",fontFamily:"'Inter',sans-serif"},"✓ "+d);
          }))
        ])
      ]));
      card.appendChild(tc);
    });
    var nextBtn=el("button",{style:{width:"100%",padding:"14px",marginTop:"4px",
      background:f.listerType?"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")":"rgba(255,255,255,0.05)",
      color:f.listerType?"#070B14":cl.sub,border:"none",borderRadius:"10px",
      fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
      cursor:f.listerType?"pointer":"not-allowed"},
      onclick:function(){if(f.listerType){OFM_STATE.listStep=2;render();}}});
    nextBtn.textContent="Continue →";
    card.appendChild(nextBtn);
  }

  // ── Step 2: Documents + Phone ────────────────────────────────────────────────
  else if(OFM_STATE.listStep===2){
    var docConfig={
      owner:{d1:"Title Deed",d2:"Emirates ID / Passport"},
      poa:{d1:"POA Agreement (with owner)",d2:"POA Holder Emirates ID / Passport"},
      management:{d1:"Management Contract",d2:"Company RERA Card"},
    }[f.listerType]||{d1:"Document 1",d2:"Document 2"};

    card.appendChild(_ofmDocUpload(docConfig.d1,f.doc1Name,
      function(b64,name){f.doc1=b64;f.doc1Name=name;render();},cl));
    card.appendChild(_ofmDocUpload(docConfig.d2,f.doc2Name,
      function(b64,name){f.doc2=b64;f.doc2Name=name;render();},cl));
    card.appendChild(_ofmInp("Your Phone (WhatsApp) *","+971 5X XXX XXXX",f.phone,
      function(v){f.phone=v;},"tel",true));
    card.appendChild(div({background:hexAlpha("#3B82F6",0.08),border:"1px solid "+hexAlpha("#3B82F6",0.2),
      borderRadius:"8px",padding:"10px",marginBottom:"12px",fontSize:"10px",
      fontFamily:"'Inter',sans-serif",color:"#60A5FA",lineHeight:"1.5"},
      "🔒 Documents are encrypted and shared only with verified buyers after both parties agree. Admin-verified badge confirms authenticity."));
    var can=f.doc1&&f.doc2&&f.phone;
    var n2=el("button",{style:{width:"100%",padding:"14px",
      background:can?"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")":"rgba(255,255,255,0.05)",
      color:can?"#070B14":cl.sub,border:"none",borderRadius:"10px",
      fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
      cursor:can?"pointer":"not-allowed"},
      onclick:function(){if(can){OFM_STATE.listStep=3;render();}}});
    n2.textContent="Continue →";card.appendChild(n2);
  }

  // ── Step 3: Property Details ─────────────────────────────────────────────────
  else{
    card.appendChild(_ofmBuildingAutocomplete("Building Name",f.building,
      function(bName,area){f.building=bName;if(area)f.area=area;},cl));
    if(f.area)card.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",
      marginBottom:"10px",marginTop:"-6px"},"Area: "+f.area));

    var r1=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
    r1.appendChild(_ofmInp("Unit Number","e.g. 1204",f.unitNumber,function(v){f.unitNumber=v;}));
    r1.appendChild(_ofmInp("Floor","e.g. 12",f.floorNum,function(v){f.floorNum=v;}));
    card.appendChild(r1);

    var r2=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
    r2.appendChild(_ofmSel("Bedrooms *",[
      {l:"Studio",v:"Studio"},{l:"1 BR",v:"1 BR"},{l:"2 BR",v:"2 BR"},
      {l:"3 BR",v:"3 BR"},{l:"4 BR",v:"4 BR"},{l:"5 BR+",v:"5 BR+"},
      {l:"Villa/TH",v:"Villa"}],f.beds,function(v){f.beds=v;}));
    r2.appendChild(_ofmSel("Bathrooms",[
      {l:"1",v:"1"},{l:"2",v:"2"},{l:"3",v:"3"},{l:"4",v:"4"},{l:"5+",v:"5+"}],
      f.baths,function(v){f.baths=v;}));
    card.appendChild(r2);

    var r3=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"});
    r3.appendChild(_ofmInp("Size (sqft) *","e.g. 950",f.sizeSqft,function(v){f.sizeSqft=v;},"number"));
    r3.appendChild(_ofmInp("Parking","e.g. 1",String(f.parking||1),function(v){f.parking=v;},"number"));
    r3.appendChild(_ofmSel("Furnished",[
      "Furnished","Semi-Furnished","Unfurnished"],f.furnished,function(v){f.furnished=v;}));
    card.appendChild(r3);

    // Toggles: maid room, study, storage
    var toggleRow=div({display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"10px"});
    [{k:"maidRoom",l:"Maid Room"},{k:"studyRoom",l:"Study Room"},{k:"storageRoom",l:"Storage"}]
      .forEach(function(tog){
        var active=!!f[tog.k];
        var btn=el("button",{style:{padding:"7px 14px",borderRadius:"20px",fontSize:"11px",
          fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
          background:active?hexAlpha(cl.gold,0.15):"transparent",
          border:"1px solid "+(active?hexAlpha(cl.gold,0.4):cl.border),
          color:active?cl.gold:cl.sub},
          onclick:function(){f[tog.k]=!f[tog.k];render();}});
        btn.textContent=(active?"✓ ":"")+tog.l;toggleRow.appendChild(btn);
      });
    card.appendChild(toggleRow);

    card.appendChild(_ofmSel("View Type",[
      {l:"Not Specified",v:""},{l:"Burj Khalifa + Fountain",v:"Burj Khalifa + Fountain"},
      {l:"Full Sea View",v:"Full Sea View"},{l:"Beach Access",v:"Beach Access View"},
      {l:"Palm View",v:"Palm View"},{l:"Marina View",v:"Marina View"},
      {l:"Full Canal View",v:"Full Canal View"},{l:"Golf View",v:"Golf View"},
      {l:"Skyline View",v:"Skyline View"},{l:"Community View",v:"Community View"},
      {l:"Pool View",v:"Pool View"},{l:"Garden / Park View",v:"Garden/Park View"}],
      f.viewType,function(v){f.viewType=v;}));

    // Vacant / Tenanted
    var vacRow=div({display:"flex",gap:"8px",marginBottom:"10px"});
    [{l:"Vacant",v:true},{l:"Tenanted",v:false}].forEach(function(t){
      var active=f.vacant===t.v;
      var btn=el("button",{style:{flex:"1",padding:"9px",borderRadius:"8px",cursor:"pointer",
        background:active?hexAlpha(cl.green,0.1):"transparent",
        border:"1px solid "+(active?cl.green:cl.border),
        color:active?cl.green:cl.sub,fontSize:"11px",fontWeight:"700",
        fontFamily:"'Space Grotesk',monospace"},
        onclick:function(){f.vacant=t.v;render();}});
      btn.textContent=(active?"✓ ":"")+t.l;vacRow.appendChild(btn);
    });
    card.appendChild(vacRow);
    if(!f.vacant)card.appendChild(_ofmInp("Tenancy Ends","MM/YYYY",f.tenancyEndDate,
      function(v){f.tenancyEndDate=v;}));

    card.appendChild(_ofmSel("Purpose",[{l:"For Sale",v:"sale"},{l:"For Rent",v:"rent"}],
      f.purpose,function(v){f.purpose=v;}));
    card.appendChild(_ofmInp("Asking Price (AED) *","e.g. 2,500,000",f.askingPrice,
      function(v){f.askingPrice=v;},"text",true));

    // Price negotiable toggle
    var negRow=div({display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"});
    negRow.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",flex:"1"},
      "Price negotiable?"));
    [{l:"Yes",v:true},{l:"Fixed",v:false}].forEach(function(t){
      var active=f.priceNegotiable===t.v;
      var btn=el("button",{style:{padding:"6px 14px",borderRadius:"20px",fontSize:"10px",
        fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
        background:active?hexAlpha(cl.gold,0.15):"transparent",
        border:"1px solid "+(active?hexAlpha(cl.gold,0.4):cl.border),
        color:active?cl.gold:cl.sub},
        onclick:function(){f.priceNegotiable=t.v;render();}});
      btn.textContent=t.l;negRow.appendChild(btn);
    });
    card.appendChild(negRow);

    var notesG=div({marginBottom:"12px"});
    notesG.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",
      letterSpacing:"0.06em",marginBottom:"4px"},"Additional Notes"));
    var ta=el("textarea",{placeholder:"E.g. Upgraded kitchen, recently renovated, motivated seller…",rows:"2",
      style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,
        padding:"10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",
        outline:"none",boxSizing:"border-box",resize:"vertical"}});
    ta.value=f.notes||"";ta.oninput=function(){f.notes=this.value;};
    notesG.appendChild(ta);card.appendChild(notesG);

    var canSubmit=f.building&&f.beds&&f.sizeSqft&&f.askingPrice&&!OFM_STATE.listPosting;
    var submitBtn=el("button",{style:{width:"100%",padding:"14px",
      background:canSubmit?"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")":"rgba(255,255,255,0.05)",
      color:canSubmit?"#070B14":cl.sub,border:"none",borderRadius:"10px",
      fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
      cursor:canSubmit?"pointer":"not-allowed",opacity:OFM_STATE.listPosting?"0.6":"1"},
      onclick:async function(){
        if(!canSubmit)return;
        if(!f.building){alert("Please select a building");return;}
        if(!f.beds){alert("Please select bedrooms");return;}
        if(!f.askingPrice){alert("Please enter asking price");return;}
        OFM_STATE.listPosting=true;render();
        try{
          var lt=_ofmLt();
          var created=await _ofmSubmitListing(f,lt);
          var matchCount=await _ofmRunMatchingForListing(created.id,
            {building:f.building,beds:f.beds,asking_price:parseInt(String(f.askingPrice).replace(/,/g,"")),
             purpose:f.purpose},lt);
          OFM_STATE.listMatchCount=matchCount;
          OFM_STATE.listPosting=false;
          // Reset form, go to my listings
          OFM_STATE.listForm={listerType:"",phone:"",doc1:null,doc1Name:"",doc2:null,doc2Name:"",
            area:"",building:"",unitNumber:"",propType:"apartment",beds:"",baths:"1",
            parking:1,maidRoom:false,studyRoom:false,storageRoom:false,sizeSqft:"",
            floorNum:"",viewType:"",furnished:"Unfurnished",vacant:true,tenancyEndDate:"",
            askingPrice:"",priceNegotiable:true,serviceChargePsf:"",notes:"",purpose:"sale"};
          OFM_STATE.listStep=1;OFM_STATE.view="my_listings";
          render();
        }catch(e){
          OFM_STATE.listPosting=false;
          alert("Error: "+(e.message||"Could not submit. Try again."));render();
        }
      }});
    submitBtn.textContent=OFM_STATE.listPosting?"Submitting + matching…":"Submit Listing";
    card.appendChild(submitBtn);
    card.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",
      textAlign:"center",marginTop:"8px",lineHeight:"1.5"},
      "🤖 DubAIVal AVM auto-valuation runs on submit · Listing stays hidden until you approve a match"));
  }
  wrap.appendChild(card);
  return wrap;
}

// ── Alias for legacy calls ─────────────────────────────────────────────────────
function renderDealForm(wrap,cl){
  OFM_STATE.view="post_listing";OFM_STATE.listStep=1;return _ofmPostListing(wrap||div({}),cl||C());
}
// ── Post Request Form (2 Steps) ────────────────────────────────────────────────
function _ofmPostRequest(wrap,cl){
  var f=OFM_STATE.reqForm;
  // Step indicator
  var stepBar=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px"});
  [1,2].forEach(function(n){
    var active=OFM_STATE.reqStep===n,done=OFM_STATE.reqStep>n;
    stepBar.appendChild(div({width:"28px",height:"28px",borderRadius:"50%",
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",flexShrink:"0",
      background:done?hexAlpha(cl.green,0.15):active?hexAlpha(cl.gold,0.18):"transparent",
      border:"2px solid "+(done?cl.green:active?cl.gold:cl.border),
      color:done?cl.green:active?cl.gold:cl.sub},done?"✓":String(n)));
    if(n<2)stepBar.appendChild(div({flex:"1",height:"2px",
      background:OFM_STATE.reqStep>n?cl.green:cl.border}));
  });

  var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",
    padding:"20px",marginBottom:"14px"});
  card.appendChild(div({display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px"},[
    el("button",{style:{background:"transparent",border:"none",cursor:"pointer",
      color:cl.sub,fontSize:"16px",padding:"0"},
      onclick:function(){
        if(OFM_STATE.reqStep>1){OFM_STATE.reqStep--;render();}
        else{OFM_STATE.view="dashboard";render();}}},"←"),
    div({},[
      div({color:"#60A5FA",fontSize:"10px",letterSpacing:"0.1em",
        textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},
        "FIND A PROPERTY — Step "+OFM_STATE.reqStep+" of 2"),
      div({color:cl.subHi,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},
        OFM_STATE.reqStep===1?"Your Role + ID":"What You're Looking For")
    ])
  ]));
  card.appendChild(stepBar);

  // ── Step 1: Requester type + ID doc ─────────────────────────────────────────
  if(OFM_STATE.reqStep===1){
    card.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",
      lineHeight:"1.6",marginBottom:"16px"},
      "Identify yourself to receive off-market property matches. Your contact stays private until you choose to share it."));
    [{id:"buyer",icon:"house",title:"Buyer",subtitle:"Looking to purchase a property",doc:"Emirates ID or Passport"},
     {id:"agent",icon:"briefcase",title:"Agent",subtitle:"Searching on behalf of a client",doc:"RERA Card + Emirates ID"}]
      .forEach(function(t){
        var active=f.requesterType===t.id;
        var tc=el("button",{style:{width:"100%",textAlign:"left",padding:"14px",
          marginBottom:"8px",borderRadius:"12px",cursor:"pointer",
          background:active?hexAlpha("#60A5FA",0.1):"transparent",
          border:"2px solid "+(active?"#60A5FA":cl.border),
          color:"inherit",transition:"all 0.15s"},
          onclick:function(){f.requesterType=t.id;render();}});
        var bIco=div({width:"36px",height:"36px",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"10px",background:hexAlpha("#60A5FA",0.12)});
        bIco.innerHTML='<i data-lucide="'+t.icon+'" style="width:18px;height:18px;color:#60A5FA"></i>';
        tc.appendChild(div({display:"flex",gap:"12px",alignItems:"center"},[
          bIco,
          div({},[
            div({color:active?"#60A5FA":cl.subHi,fontSize:"13px",fontWeight:"700",
              fontFamily:"'Space Grotesk',monospace"},t.title),
            div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},t.subtitle),
            div({color:active?hexAlpha("#60A5FA",0.8):cl.sub,fontSize:"10px",
              fontFamily:"'Inter',sans-serif",marginTop:"4px"},"Required: "+t.doc)
          ])
        ]));
        card.appendChild(tc);
      });

    if(f.requesterType){
      var docLabel=f.requesterType==="buyer"?"Emirates ID or Passport":"RERA Card";
      card.appendChild(_ofmDocUpload(docLabel,f.docName,
        function(b64,name){f.doc=b64;f.docName=name;render();},cl));
    }
    card.appendChild(_ofmInp("Your Phone (WhatsApp) *","+971 5X XXX XXXX",f.phone,
      function(v){f.phone=v;},"tel",true));
    card.appendChild(div({background:hexAlpha("#3B82F6",0.07),border:"1px solid "+hexAlpha("#3B82F6",0.2),
      borderRadius:"8px",padding:"10px",marginBottom:"12px",fontSize:"10px",
      fontFamily:"'Inter',sans-serif",color:"#60A5FA",lineHeight:"1.5"},
      "🔒 Your identity is revealed to sellers only after both parties agree to connect — typically at the viewing stage."));
    var can1=f.requesterType&&f.doc&&f.phone;
    var n1=el("button",{style:{width:"100%",padding:"14px",
      background:can1?"linear-gradient(135deg,#3B82F6,#2563EB)":"rgba(255,255,255,0.05)",
      color:can1?"#fff":cl.sub,border:"none",borderRadius:"10px",
      fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
      cursor:can1?"pointer":"not-allowed"},
      onclick:function(){if(can1){OFM_STATE.reqStep=2;render();}}});
    n1.textContent="Continue →";card.appendChild(n1);
  }

  // ── Step 2: Requirements ─────────────────────────────────────────────────────
  else{
    card.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",
      lineHeight:"1.6",marginBottom:"14px"},
      "Tell us exactly what you're looking for. Be specific — AI matches you to hidden off-market listings in your target building."));

    card.appendChild(_ofmBuildingAutocomplete("Target Building *",f.building,
      function(bName,area){f.building=bName;if(area)f.area=area;},cl));
    if(f.area)card.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",
      marginBottom:"10px",marginTop:"-6px"},"Area: "+f.area));

    var r1=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
    r1.appendChild(_ofmSel("Bedrooms *",[
      {l:"Studio",v:"Studio"},{l:"1 BR",v:"1 BR"},{l:"2 BR",v:"2 BR"},
      {l:"3 BR",v:"3 BR"},{l:"4 BR",v:"4 BR"},{l:"5 BR+",v:"5 BR+"},
      {l:"Villa/TH",v:"Villa"}],f.beds,function(v){f.beds=v;}));
    r1.appendChild(_ofmSel("Purpose",[{l:"For Sale",v:"sale"},{l:"For Rent",v:"rent"}],
      f.purpose,function(v){f.purpose=v;}));
    card.appendChild(r1);

    card.appendChild(_ofmInp("Max Budget (AED) *","e.g. 2,500,000",f.maxBudget,
      function(v){f.maxBudget=v;},"text",true));

    // Price info box
    if(f.maxBudget){
      var budget=parseInt(String(f.maxBudget).replace(/,/g,""))||0;
      if(budget>0){
        card.appendChild(div({background:hexAlpha(cl.gold,0.07),borderRadius:"8px",
          padding:"8px 12px",marginBottom:"10px",fontSize:"10px",
          fontFamily:"'Space Grotesk',monospace"},[
          span({color:cl.sub},"Matches up to: "),
          span({color:cl.gold,fontWeight:"700"},"AED "+(budget*1.15).toLocaleString("en",{maximumFractionDigits:0})),
          span({color:cl.sub}," (your budget +15% seller tolerance)")
        ]));
      }
    }

    card.appendChild(_ofmSel("Payment Method",[
      {l:"Flexible",v:"flexible"},{l:"Cash",v:"cash"},{l:"Mortgage",v:"mortgage"}],
      f.paymentMethod,function(v){f.paymentMethod=v;}));

    var r2=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
    r2.appendChild(_ofmInp("Min Size (sqft)","e.g. 800",f.minSize,function(v){f.minSize=v;},"number"));
    r2.appendChild(_ofmSel("Timeline",[
      {l:"ASAP",v:"ASAP"},{l:"1 month",v:"1 month"},{l:"3 months",v:"3 months"},
      {l:"6 months",v:"6 months"},{l:"1 year",v:"1 year"}],
      f.timeline,function(v){f.timeline=v;}));
    card.appendChild(r2);

    card.appendChild(_ofmSel("View Preference",[
      {l:"Any View",v:""},{l:"Sea View",v:"Sea View"},{l:"Burj / Fountain View",v:"Burj Khalifa + Fountain"},
      {l:"Palm View",v:"Palm View"},{l:"Marina View",v:"Marina View"},
      {l:"Canal View",v:"Full Canal View"},{l:"Golf View",v:"Golf View"}],
      f.viewPref,function(v){f.viewPref=v;}));

    var notesG=div({marginBottom:"12px"});
    notesG.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",
      letterSpacing:"0.06em",marginBottom:"4px"},"Additional Notes (optional)"));
    var ta=el("textarea",{placeholder:"E.g. Must be vacant, prefer high floor, open to negotiation…",rows:"2",
      style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,
        padding:"10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",
        outline:"none",boxSizing:"border-box",resize:"vertical"}});
    ta.value=f.notes||"";ta.oninput=function(){f.notes=this.value;};
    notesG.appendChild(ta);card.appendChild(notesG);

    var canSub=f.building&&f.beds&&f.maxBudget&&!OFM_STATE.reqPosting;
    var subBtn=el("button",{style:{width:"100%",padding:"14px",
      background:canSub?"linear-gradient(135deg,#3B82F6,#2563EB)":"rgba(255,255,255,0.05)",
      color:canSub?"#fff":cl.sub,border:"none",borderRadius:"10px",
      fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
      cursor:canSub?"pointer":"not-allowed",opacity:OFM_STATE.reqPosting?"0.6":"1"},
      onclick:async function(){
        if(!canSub)return;
        if(!f.building){alert("Please enter a building name");return;}
        if(!f.beds){alert("Please select bedrooms");return;}
        if(!f.maxBudget){alert("Please enter your budget");return;}
        OFM_STATE.reqPosting=true;render();
        try{
          var rt=_ofmRt();
          var created=await _ofmSubmitRequest(f,rt);
          var mc=await _ofmRunMatchingForRequest(created.id,
            {building:f.building,beds:f.beds,
             max_budget:parseInt(String(f.maxBudget).replace(/,/g,"")),purpose:f.purpose},rt);
          OFM_STATE.reqMatchCount=mc;
          OFM_STATE.reqPosting=false;
          OFM_STATE.reqForm={requesterType:"",phone:"",doc:null,docName:"",
            building:"",area:"",beds:"",maxBudget:"",paymentMethod:"flexible",
            minSize:"",preferredFloor:"",viewPref:"",timeline:"3 months",notes:"",purpose:"sale"};
          OFM_STATE.reqStep=1;OFM_STATE.view="my_requests";
          render();
        }catch(e){
          OFM_STATE.reqPosting=false;
          alert("Error: "+(e.message||"Could not submit. Try again."));render();
        }
      }});
    subBtn.textContent=OFM_STATE.reqPosting?"Finding matches…":"Find My Property";
    card.appendChild(subBtn);
    card.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",
      textAlign:"center",marginTop:"8px",lineHeight:"1.5"},
      "🤖 AI matches your request to hidden off-market listings · Sellers choose whether to engage"));
  }
  wrap.appendChild(card);return wrap;
}
// ── My Listings View ───────────────────────────────────────────────────────────
function _ofmMyListings(wrap,cl){
  var lt=_ofmLt();
  // Load on first render
  if(!OFM_STATE.listingsLoading&&!OFM_STATE.myListings.length){
    OFM_STATE.listingsLoading=true;
    _ofmLoadMyListings(lt).then(function(data){
      OFM_STATE.myListings=data;OFM_STATE.listingsLoading=false;render();
    }).catch(function(){OFM_STATE.listingsLoading=false;render();});
  }

  var hdr=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"});
  hdr.appendChild(div({},[
    div({color:cl.gold,fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",
      fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"◆ MY LISTINGS"),
    div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},
      "Review and manage buyer matches for each property")
  ]));
  hdr.appendChild(el("button",{style:{background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",
    color:"#070B14",border:"none",padding:"8px 14px",borderRadius:"8px",
    fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
    onclick:function(){OFM_STATE.view="post_listing";OFM_STATE.listStep=1;render();}},"+ New"));
  wrap.appendChild(hdr);

  if(OFM_STATE.listMatchCount>0){
    wrap.appendChild(div({background:hexAlpha(cl.green,0.08),border:"1px solid "+hexAlpha(cl.green,0.25),
      borderRadius:"10px",padding:"12px 14px",marginBottom:"12px",
      display:"flex",alignItems:"center",gap:"10px"},[
      (function(){var e=div({width:"30px",height:"30px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:"0"});e.innerHTML='<i data-lucide="party-popper" style="width:18px;height:18px;color:'+cl.green+'"></i>';return e;})(),
      div({},[
        div({color:cl.green,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},
          OFM_STATE.listMatchCount+" potential buyer"+(OFM_STATE.listMatchCount>1?"s":"")+" found!"),
        div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},
          "Review matches below — approve to start an anonymous chat")
      ])
    ]));
    OFM_STATE.listMatchCount=0;
  }

  if(OFM_STATE.listingsLoading){wrap.appendChild(_ofmSpinner(cl,"Loading your listings…"));return wrap;}
  if(!OFM_STATE.myListings.length){
    wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,
      borderRadius:"14px",padding:"32px",textAlign:"center"},[
      (function(){var e=div({width:"52px",height:"52px",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",background:hexAlpha(cl.gold,0.1),margin:"0 auto 12px"});e.innerHTML='<i data-lucide="home" style="width:24px;height:24px;color:'+cl.gold+'"></i>';return e;})(),
      div({color:cl.subHi,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
        marginBottom:"6px"},"No listings yet"),
      div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginBottom:"16px"},
        "List your first off-market property and let AI find verified buyers for you"),
      el("button",{style:{background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",
        color:"#070B14",border:"none",padding:"12px 24px",borderRadius:"10px",
        fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
        onclick:function(){OFM_STATE.view="post_listing";OFM_STATE.listStep=1;render();}},"List a Property")
    ]));
    return wrap;
  }

  OFM_STATE.myListings.forEach(function(listing){
    var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",
      padding:"16px",marginBottom:"10px"});

    // Header row
    var topRow=div({display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"});
    var propInfo=div({});
    propInfo.appendChild(div({color:cl.subHi,fontSize:"14px",fontWeight:"700",
      fontFamily:"'Space Grotesk',monospace"},listing.building));
    propInfo.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},
      [listing.beds,listing.prop_type,listing.size_sqft?listing.size_sqft.toLocaleString()+" sqft":"",
       listing.area].filter(Boolean).join(" · ")));
    topRow.appendChild(propInfo);

    // Price + verdict badge
    var priceBadge=div({textAlign:"right"});
    priceBadge.appendChild(div({color:cl.gold,fontSize:"14px",fontWeight:"800",
      fontFamily:"'Space Grotesk',monospace"},listing.asking_price?"AED "+(listing.asking_price/1e6).toFixed(2)+"M":"—"));
    if(listing.dv_verdict){
      var vColors={"DISTRESS DEAL":"#10B981","GOOD PRICE":"#10B981","FAIR MARKET":"#3B82F6",
        "OVERPRICED":"#EF4444"};
      var vc=vColors[listing.dv_verdict]||cl.sub;
      priceBadge.appendChild(span({color:vc,fontSize:"9px",fontWeight:"700",
        fontFamily:"'Space Grotesk',monospace",background:hexAlpha(vc,0.12),
        padding:"2px 8px",borderRadius:"6px"},listing.dv_verdict));
    }
    topRow.appendChild(priceBadge);
    card.appendChild(topRow);

    // AVM comparison
    if(listing.dv_fair_price&&listing.asking_price){
      var diff=((listing.asking_price-listing.dv_fair_price)/listing.dv_fair_price*100);
      var avmCol=diff>5?"#EF4444":diff<-5?"#10B981":"#3B82F6";
      card.appendChild(div({background:hexAlpha(avmCol,0.07),borderRadius:"8px",
        padding:"7px 10px",marginBottom:"10px",
        display:"flex",justifyContent:"space-between",alignItems:"center"},[
        span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"DubAIVal Fair Value"),
        span({color:avmCol,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},
          "AED "+(listing.dv_fair_price/1e6).toFixed(2)+"M  ("+(diff>0?"+":"")+diff.toFixed(1)+"%)")
      ]));
    }

    // Matches section
    var matchKey="_ofm_matches_"+listing.id;
    var matchData=OFM_STATE.matchesForListing[listing.id];
    if(!matchData){
      // Load matches for this listing
      var matchLoadBtn=el("button",{style:{width:"100%",padding:"10px",marginBottom:"8px",
        background:"transparent",border:"1px solid "+cl.border,color:cl.sub,
        borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
        cursor:"pointer"},
        onclick:(function(lid){return function(){
          if(OFM_STATE.matchesLoading)return;
          OFM_STATE.matchesLoading=true;
          _ofmLoadMatchesForListing(lid).then(function(matches){
            OFM_STATE.matchesForListing[lid]=matches;OFM_STATE.matchesLoading=false;render();
          }).catch(function(){OFM_STATE.matchesLoading=false;render();});
        };})(listing.id)});
      matchLoadBtn.innerHTML='<i data-lucide="search" style="width:12px;height:12px;vertical-align:middle;margin-right:5px"></i>Load Buyer Matches';
      card.appendChild(matchLoadBtn);
    }else if(matchData.length===0){
      card.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",
        textAlign:"center",padding:"8px",
        background:cl.raised,borderRadius:"8px",marginBottom:"8px"},
        "No matches yet — matching runs against active buyer requests"));
    }else{
      var pendingMatches=matchData.filter(function(m){return m.stage==="matched";});
      var activeMatches=matchData.filter(function(m){return m.stage!=="matched"&&m.stage!=="rejected";});
      if(pendingMatches.length){
        card.appendChild(div({color:"#F59E0B",fontSize:"10px",fontWeight:"700",
          fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em",
          marginBottom:"6px"},"⟡ "+pendingMatches.length+" BUYER MATCH"+(pendingMatches.length>1?"ES":"")+" WAITING"));
        pendingMatches.slice(0,5).forEach(function(match){
          var mRow=div({background:cl.raised,borderRadius:"10px",padding:"10px 12px",
            marginBottom:"6px",border:"1px solid "+hexAlpha("#F59E0B",0.2)});
          // Load request details async if not cached
          var reqDetails=OFM_STATE.matchReqDetails&&OFM_STATE.matchReqDetails[match.request_id];
          if(reqDetails){
            mRow.appendChild(div({marginBottom:"6px"},[
              div({color:cl.subHi,fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace"},
                "Buyer #"+_ofmAnonId(match.requester_token)),
              div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},
                [reqDetails.beds,reqDetails.payment_method,
                 reqDetails.max_budget?"Budget: AED "+(reqDetails.max_budget/1e6).toFixed(2)+"M":""].filter(Boolean).join(" · ")),
              div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},
                reqDetails.timeline?"Timeline: "+reqDetails.timeline:""),
            ]));
            if(match.price_delta_pct&&match.price_delta_pct>0){
              mRow.appendChild(div({color:"#F59E0B",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",
                marginBottom:"6px"},
                "⚠ "+match.price_delta_pct.toFixed(1)+"% over buyer budget — negotiation required"));
            }
          }else{
            mRow.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace",
              marginBottom:"6px"},"Buyer #"+_ofmAnonId(match.requester_token)+" · Score: "+Math.round(match.ai_score)));
            // Async load request details
            if(!OFM_STATE.matchReqDetails)OFM_STATE.matchReqDetails={};
            if(!OFM_STATE.matchReqDetails[match.request_id]){
              _ofmLoadReqDetails(match.request_id).then(function(d){
                if(d){OFM_STATE.matchReqDetails[d.id]=d;render();}
              }).catch(function(){});
            }
          }
          var actRow=div({display:"flex",gap:"6px"});
          var approveBtn=el("button",{style:{flex:"1",padding:"8px",borderRadius:"8px",
            background:"rgba(16,185,129,0.12)",color:"#10B981",border:"1px solid rgba(16,185,129,0.3)",
            fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
            onclick:(function(mid,lid){return async function(){
              var ok=await _ofmApproveMatch(mid);
              if(ok){OFM_STATE.matchesForListing[lid]=null;render();}
            };})(match.id,listing.id)});
          approveBtn.textContent="✓ Accept";
          var rejectBtn=el("button",{style:{flex:"1",padding:"8px",borderRadius:"8px",
            background:"rgba(239,68,68,0.08)",color:"#EF4444",border:"1px solid rgba(239,68,68,0.2)",
            fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
            onclick:(function(mid,lid){return async function(){
              var ok=await _ofmRejectMatch(mid,"Not a fit");
              if(ok){OFM_STATE.matchesForListing[lid]=null;render();}
            };})(match.id,listing.id)});
          rejectBtn.textContent="✗ Decline";
          actRow.appendChild(approveBtn);actRow.appendChild(rejectBtn);mRow.appendChild(actRow);
          card.appendChild(mRow);
        });
      }
      if(activeMatches.length){
        card.appendChild(div({color:cl.green,fontSize:"10px",fontWeight:"700",
          fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},
          "◆ "+activeMatches.length+" ACTIVE CONVERSATION"+(activeMatches.length>1?"S":"")));
        activeMatches.forEach(function(match){
          var aBtn=el("button",{style:{width:"100%",padding:"9px",marginBottom:"4px",
            background:hexAlpha(cl.green,0.08),border:"1px solid "+hexAlpha(cl.green,0.2),
            color:cl.green,borderRadius:"8px",fontSize:"11px",fontWeight:"700",
            fontFamily:"'Space Grotesk',monospace",cursor:"pointer",textAlign:"left"},
            onclick:function(){
              OFM_STATE.activeMatchId=match.id;OFM_STATE.activeMatch=match;
              OFM_STATE.activeListing=listing;OFM_STATE.activeRequest=null;
              OFM_STATE.view="match_view";render();
            }});
          aBtn.textContent=_ofmStageMeta(match.stage).icon+" Buyer #"+_ofmAnonId(match.requester_token)+" · "+_ofmStageMeta(match.stage).label+" →";
          card.appendChild(aBtn);
        });
      }
    }

    // Reload / archive
    var bottomRow=div({display:"flex",gap:"6px",justifyContent:"flex-end",alignItems:"center"});
    if(typeof showVideoGenUI==="function"){
      var vidBtn=el("button",{style:{padding:"6px 12px",borderRadius:"6px",
        background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.3)",color:"#A78BFA",
        fontSize:"9px",fontFamily:"'Space Grotesk',monospace",fontWeight:"600",cursor:"pointer",
        display:"flex",alignItems:"center",gap:"4px"},
        onclick:(function(lst){return function(){
          showVideoGenUI("",{
            building:lst.building,area:lst.area,price:lst.asking_price,
            beds:lst.beds,size:lst.size_sqft,txnType:lst.purpose||"sale"
          });
        };})(listing)});
      vidBtn.innerHTML='<i data-lucide="video" style="width:10px;height:10px"></i>Create Video';
      bottomRow.appendChild(vidBtn);
    }
    var reloadBtn=el("button",{style:{padding:"6px 12px",borderRadius:"6px",
      background:"transparent",border:"1px solid "+cl.border,color:cl.sub,
      fontSize:"9px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
      onclick:(function(lid){return function(){
        OFM_STATE.matchesForListing[lid]=null;render();
      };})(listing.id)});
    reloadBtn.textContent="↻ Refresh";
    bottomRow.appendChild(reloadBtn);
    bottomRow.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",
      alignSelf:"center"},timeAgo(listing.created_at)));
    card.appendChild(bottomRow);
    wrap.appendChild(card);
  });
  return wrap;
}

// ── My Requests View ───────────────────────────────────────────────────────────
function _ofmMyRequests(wrap,cl){
  var rt=_ofmRt();
  if(!OFM_STATE.requestsLoading&&!OFM_STATE.myRequests.length){
    OFM_STATE.requestsLoading=true;
    _ofmLoadMyRequests(rt).then(function(data){
      OFM_STATE.myRequests=data;OFM_STATE.requestsLoading=false;render();
    }).catch(function(){OFM_STATE.requestsLoading=false;render();});
  }

  var hdr=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"});
  hdr.appendChild(div({},[
    div({color:"#60A5FA",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",
      fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"◆ MY REQUESTS"),
    div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},
      "Track matches and pipeline for each search")
  ]));
  hdr.appendChild(el("button",{style:{background:"linear-gradient(135deg,#3B82F6,#2563EB)",
    color:"#fff",border:"none",padding:"8px 14px",borderRadius:"8px",
    fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
    onclick:function(){OFM_STATE.view="post_request";OFM_STATE.reqStep=1;render();}},"+ New"));
  wrap.appendChild(hdr);

  if(OFM_STATE.reqMatchCount>0){
    wrap.appendChild(div({background:hexAlpha("#3B82F6",0.08),border:"1px solid "+hexAlpha("#3B82F6",0.25),
      borderRadius:"10px",padding:"12px 14px",marginBottom:"12px",
      display:"flex",alignItems:"center",gap:"10px"},[
      (function(){var e=div({width:"30px",height:"30px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:"0"});e.innerHTML='<i data-lucide="search" style="width:18px;height:18px;color:#60A5FA"></i>';return e;})(),
      div({},[
        div({color:"#60A5FA",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},
          OFM_STATE.reqMatchCount+" potential match"+(OFM_STATE.reqMatchCount>1?"es":"")+" found!"),
        div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},
          "Waiting for sellers to review your request and approve contact")
      ])
    ]));
    OFM_STATE.reqMatchCount=0;
  }

  if(OFM_STATE.requestsLoading){wrap.appendChild(_ofmSpinner(cl,"Loading your requests…"));return wrap;}
  if(!OFM_STATE.myRequests.length){
    wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,
      borderRadius:"14px",padding:"32px",textAlign:"center"},[
      (function(){var e=div({width:"52px",height:"52px",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",background:hexAlpha("#3B82F6",0.1),margin:"0 auto 12px"});e.innerHTML='<i data-lucide="search" style="width:24px;height:24px;color:#60A5FA"></i>';return e;})(),
      div({color:cl.subHi,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
        marginBottom:"6px"},"No requests yet"),
      div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginBottom:"16px"},
        "Post a property search request and AI will match you with hidden off-market sellers"),
      el("button",{style:{background:"linear-gradient(135deg,#3B82F6,#2563EB)",
        color:"#fff",border:"none",padding:"12px 24px",borderRadius:"10px",
        fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
        onclick:function(){OFM_STATE.view="post_request";OFM_STATE.reqStep=1;render();}},"Find a Property")
    ]));
    return wrap;
  }

  OFM_STATE.myRequests.forEach(function(req){
    var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",
      padding:"16px",marginBottom:"10px"});
    card.appendChild(div({color:cl.subHi,fontSize:"14px",fontWeight:"700",
      fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},req.building));
    card.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginBottom:"10px"},
      [req.beds,req.purpose,req.max_budget?"Budget: AED "+(req.max_budget/1e6).toFixed(2)+"M":"",
       req.payment_method].filter(Boolean).join(" · ")));

    // Load matches for this request
    var matchData=OFM_STATE.matchesForRequest[req.id];
    if(!matchData){
      var loadBtn=el("button",{style:{width:"100%",padding:"10px",marginBottom:"8px",
        background:"transparent",border:"1px solid "+cl.border,color:cl.sub,
        borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
        cursor:"pointer"},
        onclick:(function(rid){return function(){
          _ofmLoadMatchesForRequest(rid).then(function(m){
            OFM_STATE.matchesForRequest[rid]=m;render();
          }).catch(function(){});
        };})(req.id)});
      loadBtn.innerHTML='<i data-lucide="search" style="width:12px;height:12px;vertical-align:middle;margin-right:5px"></i>Check Match Status';card.appendChild(loadBtn);
    }else if(!matchData.length){
      card.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",
        padding:"10px",background:cl.raised,borderRadius:"8px",textAlign:"center",marginBottom:"8px"},
        "No matches yet — new listings matching your criteria will appear here"));
    }else{
      matchData.forEach(function(match){
        var stageColor=match.stage==="matched"?"#F59E0B":match.stage==="rejected"?"#EF4444":cl.green;
        var mRow=div({background:cl.raised,borderRadius:"10px",padding:"10px 12px",
          marginBottom:"6px",border:"1px solid "+hexAlpha(stageColor,0.25),cursor:"pointer"});
        mRow.onclick=(function(m,r){return function(){
            OFM_STATE.activeMatchId=m.id;OFM_STATE.activeMatch=m;
            OFM_STATE.activeRequest=r;OFM_STATE.activeListing=null;
            OFM_STATE.view="match_view";render();};})(match,req);
        mRow.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center"},[
          div({},[
            div({color:cl.subHi,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},
              "Seller #"+_ofmAnonId(match.lister_token)),
            div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},
              _ofmStageMeta(match.stage).icon+" "+_ofmStageMeta(match.stage).label)
          ]),
          div({color:stageColor,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},
            match.stage==="matched"?"Pending →":"Open Chat →")
        ]));
        if(match.stage==="matched"){
          mRow.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif",
            marginTop:"6px"},"Waiting for seller to review your request and approve contact"));
        }
        card.appendChild(mRow);
      });
    }
    card.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",
      textAlign:"right",marginTop:"4px"},timeAgo(req.created_at)));
    wrap.appendChild(card);
  });
  return wrap;
}
// ── Match View (9-stage pipeline + chat) ──────────────────────────────────────
function _ofmMatchView(wrap,cl){
  var m=OFM_STATE.activeMatch;
  if(!m){OFM_STATE.view="dashboard";render();return wrap;}

  var isLister=!!_ofmLt()&&m.lister_match;
  var role=isLister?"lister":"requester";
  var myToken=isLister?_ofmLt():_ofmRt();

  var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",
    padding:"20px",marginBottom:"14px"});

  // Header
  card.appendChild(div({display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px"},[
    el("button",{style:{background:"transparent",border:"none",cursor:"pointer",
      color:cl.sub,fontSize:"16px",padding:"0"},
      onclick:function(){
        OFM_STATE.view=isLister?"my_listings":"my_requests";
        OFM_STATE.activeMatch=null;render();}},"←"),
    div({},[
      div({color:"#60A5FA",fontSize:"10px",letterSpacing:"0.1em",
        textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},
        "MATCH #"+_ofmAnonId(m.id)),
      div({color:cl.subHi,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},
        _ofmStageMeta(m.stage).label)
    ])
  ]));

  // Pipeline bar
  card.appendChild(_ofmPipelineBar(m.stage,cl));

  // Stage-specific content
  var stage=m.stage;

  // ── Matched stage: lister sees buyer requirements, decides ──────────────────
  if(stage==="matched"&&isLister){
    card.appendChild(div({background:hexAlpha(cl.gold,0.07),borderRadius:"10px",
      padding:"14px",marginBottom:"14px"},[
      div({color:cl.gold,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
        marginBottom:"10px"},"◆ BUYER REQUIREMENTS"),
    ]));
    var reqBox=card.lastChild;

    // Load request details async
    if(!OFM_STATE._matchReqCache)OFM_STATE._matchReqCache={};
    var rid=m.request_id;
    if(OFM_STATE._matchReqCache[rid]){
      _ofmRenderReqDetails(reqBox,OFM_STATE._matchReqCache[rid],m,cl);
    } else {
      var loadingEl=div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",padding:"8px 0"},"Loading buyer requirements…");
      reqBox.appendChild(loadingEl);
      _ofmLoadReqDetails(rid).then(function(req){
        if(req){OFM_STATE._matchReqCache[rid]=req;reqBox.removeChild(loadingEl);_ofmRenderReqDetails(reqBox,req,m,cl);}
      });
    }

    // Approve / Reject buttons
    var btnRow=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginTop:"14px"});
    var approveBtn=el("button",{style:{padding:"14px",borderRadius:"10px",cursor:"pointer",
      background:"linear-gradient(135deg,"+hexAlpha(cl.green,0.2)+","+hexAlpha(cl.green,0.1)+")",
      border:"1px solid "+hexAlpha(cl.green,0.4),color:cl.green,
      fontWeight:"700",fontSize:"12px",fontFamily:"'Space Grotesk',monospace"},
      onclick:async function(){
        approveBtn.textContent="Approving…";approveBtn.disabled=true;
        var ok=await _ofmApproveMatch(m.id);
        if(ok){m.stage="lister_approved";render();}
        else{approveBtn.textContent="Accept Match";approveBtn.disabled=false;}
      }});
    approveBtn.textContent="✓ Accept Match";
    var rejectBtn=el("button",{style:{padding:"14px",borderRadius:"10px",cursor:"pointer",
      background:"transparent",border:"1px solid "+cl.border,color:cl.sub,
      fontWeight:"600",fontSize:"12px",fontFamily:"'Space Grotesk',monospace"},
      onclick:async function(){
        var note=prompt("Reason for declining (optional):");
        if(note===null)return;
        rejectBtn.textContent="Declining…";rejectBtn.disabled=true;
        var ok=await _ofmRejectMatch(m.id,note);
        if(ok){OFM_STATE.view=isLister?"my_listings":"my_requests";OFM_STATE.activeMatch=null;render();}
        else{rejectBtn.textContent="✗ Decline";rejectBtn.disabled=false;}
      }});
    rejectBtn.textContent="✗ Decline";
    btnRow.appendChild(approveBtn);btnRow.appendChild(rejectBtn);
    card.appendChild(btnRow);
  }

  // ── Matched stage: requester waits ─────────────────────────────────────────
  else if(stage==="matched"&&!isLister){
    card.appendChild(div({background:hexAlpha("#3B82F6",0.07),borderRadius:"10px",padding:"14px",
      textAlign:"center"},[
      (function(){var e=div({width:"40px",height:"40px",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"});e.innerHTML='<i data-lucide="hourglass" style="width:24px;height:24px;color:#60A5FA"></i>';return e;})(),
      div({color:cl.subHi,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
        marginBottom:"6px"},"Waiting for Seller"),
      div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},
        "Your request has been matched. The seller is reviewing your requirements anonymously. You'll be notified once they accept.")
    ]));
  }

  // ── Lister Approved: open chat ──────────────────────────────────────────────
  else if(stage==="lister_approved"){
    card.appendChild(div({background:hexAlpha(cl.green,0.07),borderRadius:"10px",padding:"14px",
      marginBottom:"14px",textAlign:"center"},[
      (function(){var e=div({width:"36px",height:"36px",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 6px"});e.innerHTML='<i data-lucide="check-circle" style="width:20px;height:20px;color:'+cl.green+'"></i>';return e;})(),
      div({color:cl.green,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
        marginBottom:"4px"},isLister?"You accepted this match":"Seller accepted your match!"),
      div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},
        "You can now chat anonymously. Start the conversation below.")
    ]));
    if(isLister){
      var openChatBtn=el("button",{style:{width:"100%",padding:"13px",borderRadius:"10px",
        cursor:"pointer",background:"linear-gradient(135deg,#3B82F6,#2563EB)",color:"#fff",
        border:"none",fontWeight:"700",fontSize:"13px",fontFamily:"'Space Grotesk',monospace"},
        onclick:async function(){
          await _ofmAdvanceStage(m.id,"chat_active");
          m.stage="chat_active";render();
        }});
      openChatBtn.innerHTML='<i data-lucide="message-circle" style="width:14px;height:14px;vertical-align:middle;margin-right:6px"></i>Open Chat Channel';
      card.appendChild(openChatBtn);
    }
  }

  // ── Chat active + all further stages: show chat + stage actions ─────────────
  if(["chat_active","media_shared","id_submitted","viewing_arranged",
      "offer_made","closing","completed"].indexOf(stage)>=0){
    // Info box for current stage
    var stageInfo={
      chat_active:{ico:"message-circle",t:"Anonymous Chat Active",d:"Discuss requirements. Identities remain hidden."},
      media_shared:{ico:"camera",t:"Photos Shared",d:"Property photos have been shared. Continue discussions."},
      id_submitted:{ico:"credit-card",t:"IDs Verified",d:"Both parties have verified identity. Proceed to viewing."},
      viewing_arranged:{ico:"home",t:"Viewing Arranged",d:"Property viewing is scheduled. Discuss offers afterward."},
      offer_made:{ico:"clipboard-list",t:"Offer Submitted",d:"An offer is on the table. DLD closing to follow."},
      closing:{ico:"scale",t:"In DLD Closing",d:"Transaction in progress via DLD Trustee."},
      completed:{ico:"party-popper",t:"Deal Completed!",d:"Congratulations! The deal has been successfully closed."}
    };
    var si=stageInfo[stage];
    if(si){
      var siIco=div({width:"30px",height:"30px",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center"});
      siIco.innerHTML='<i data-lucide="'+si.ico+'" style="width:18px;height:18px;color:'+(stage==="completed"?cl.green:cl.gold)+'"></i>';
      card.appendChild(div({background:stage==="completed"?hexAlpha(cl.green,0.1):hexAlpha(cl.gold,0.07),
        borderRadius:"10px",padding:"12px 14px",marginBottom:"14px",display:"flex",gap:"10px",alignItems:"center"},[
        siIco,
        div({},[
          div({color:stage==="completed"?cl.green:cl.gold,fontSize:"12px",fontWeight:"700",
            fontFamily:"'Space Grotesk',monospace"},si.t),
          div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",lineHeight:"1.4"},si.d)
        ])
      ]));
    }

    // Stage advance actions (lister drives progression)
    if(isLister&&stage!=="completed"){
      var nextActions={
        chat_active:{ico:"camera",btn:"Share Property Photos",next:"media_shared"},
        media_shared:{ico:"credit-card",btn:"Both IDs Verified",next:"id_submitted"},
        id_submitted:{ico:"home",btn:"Confirm Viewing Set",next:"viewing_arranged"},
        viewing_arranged:{ico:"clipboard-list",btn:"Offer Submitted",next:"offer_made"},
        offer_made:{ico:"scale",btn:"Move to DLD Closing",next:"closing"},
        closing:{ico:"party-popper",btn:"Mark as Completed",next:"completed"}
      };
      var na=nextActions[stage];
      if(na){
        var advBtn=el("button",{style:{width:"100%",padding:"12px",borderRadius:"10px",
          marginBottom:"14px",cursor:"pointer",
          background:hexAlpha(cl.gold,0.12),border:"1px solid "+hexAlpha(cl.gold,0.35),
          color:cl.gold,fontWeight:"700",fontSize:"12px",fontFamily:"'Space Grotesk',monospace"},
          onclick:async function(){
            advBtn.disabled=true;advBtn.textContent="Updating…";
            var extra=na.next==="completed"?{completed_at:new Date().toISOString()}:{};
            var ok=await _ofmAdvanceStage(m.id,na.next,extra);
            if(ok){m.stage=na.next;render();}
            else{advBtn.disabled=false;advBtn.innerHTML='<i data-lucide="'+na.ico+'" style="width:13px;height:13px;vertical-align:middle;margin-right:6px"></i>'+na.btn;}
          }});
        advBtn.innerHTML='<i data-lucide="'+na.ico+'" style="width:13px;height:13px;vertical-align:middle;margin-right:6px"></i>'+na.btn;
        card.appendChild(advBtn);
      }
    }

    // Media upload (lister only, in chat_active or media_shared)
    if(isLister&&(stage==="chat_active"||stage==="media_shared")){
      var mediaSection=div({marginBottom:"14px"});
      mediaSection.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",
        marginBottom:"8px",letterSpacing:"0.06em"},"PROPERTY PHOTOS"));
      var fileInp=el("input",{type:"file",accept:"image/*",multiple:true,
        style:{display:"none"}});
      var uploadBtn=el("button",{style:{padding:"10px 16px",borderRadius:"8px",cursor:"pointer",
        background:hexAlpha("#3B82F6",0.1),border:"1px solid "+hexAlpha("#3B82F6",0.3),
        color:"#60A5FA",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",fontWeight:"600"},
        onclick:function(){fileInp.click();}});
      uploadBtn.innerHTML='<i data-lucide="camera" style="width:13px;height:13px;vertical-align:middle;margin-right:6px"></i>Upload Photos';
      fileInp.onchange=async function(){
        var files=Array.from(this.files||[]);
        uploadBtn.textContent="Uploading "+files.length+" photo(s)…";
        uploadBtn.disabled=true;
        for(var i=0;i<files.length;i++){
          await _ofmUploadMedia(m.id,_ofmLt(),files[i]);
        }
        if(stage==="chat_active"){await _ofmAdvanceStage(m.id,"media_shared");m.stage="media_shared";}
        uploadBtn.innerHTML='<i data-lucide="camera" style="width:13px;height:13px;vertical-align:middle;margin-right:6px"></i>Upload More Photos';
        uploadBtn.disabled=false;
        render();
      };
      mediaSection.appendChild(uploadBtn);
      mediaSection.appendChild(fileInp);
      card.appendChild(mediaSection);
    }

    // Media viewer (for requester in media_shared+)
    if(!isLister&&["media_shared","id_submitted","viewing_arranged","offer_made","closing","completed"].indexOf(stage)>=0){
      var mediaViewSection=div({marginBottom:"14px"});
      mediaViewSection.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",
        marginBottom:"8px",letterSpacing:"0.06em"},"PROPERTY PHOTOS"));
      var mediaGrid=div({display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px"});
      mediaViewSection.appendChild(mediaGrid);
      card.appendChild(mediaViewSection);

      _ofmLoadMedia(m.id).then(function(photos){
        if(!photos.length){
          mediaGrid.appendChild(div({color:cl.sub,fontSize:"11px",
            fontFamily:"'Inter',sans-serif",gridColumn:"1/-1"},"No photos yet."));
          return;
        }
        photos.forEach(function(p){
          if(p.media_type==="photo"&&p.data){
            var img=el("img",{src:p.data,
              style:{width:"100%",aspectRatio:"1",objectFit:"cover",
                borderRadius:"8px",cursor:"pointer",border:"1px solid "+cl.border}});
            img.onclick=function(){window.open(p.data,"_blank");};
            mediaGrid.appendChild(img);
          }
        });
      });
    }

    // ── Chat Interface ────────────────────────────────────────────────────────
    var chatWrap=div({background:cl.raised,borderRadius:"12px",overflow:"hidden",
      border:"1px solid "+cl.border});
    var chatHead=div({padding:"10px 14px",borderBottom:"1px solid "+cl.border,
      display:"flex",alignItems:"center",gap:"8px"},[
      div({width:"8px",height:"8px",borderRadius:"50%",background:cl.green,flexShrink:"0"}),
      div({color:cl.subHi,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},
        "Anonymous Chat — Match #"+_ofmAnonId(m.id)),
    ]);
    chatWrap.appendChild(chatHead);

    var msgThread=div({height:"260px",overflowY:"auto",padding:"12px",
      display:"flex",flexDirection:"column",gap:"8px"});
    chatWrap.appendChild(msgThread);

    // Loading spinner for messages
    msgThread.appendChild(_ofmSpinner(cl,"Loading messages…"));

    _ofmLoadMsgs(m.id).then(function(msgs){
      msgThread.innerHTML="";
      if(!msgs.length){
        msgThread.appendChild(div({textAlign:"center",color:cl.sub,fontSize:"11px",
          fontFamily:"'Inter',sans-serif",padding:"20px 0"},"No messages yet. Say hello!"));
        return;
      }
      msgs.forEach(function(msg){
        var mine=msg.sender_role===role;
        var bubble=div({display:"flex",justifyContent:mine?"flex-end":"flex-start"});
        bubble.appendChild(div({
          maxWidth:"80%",padding:"8px 12px",borderRadius:mine?"12px 12px 2px 12px":"12px 12px 12px 2px",
          background:mine?"linear-gradient(135deg,#3B82F6,#2563EB)":cl.surface,
          color:mine?"#fff":cl.white,fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5",
          border:mine?"none":"1px solid "+cl.border},[
          div({},msg.body),
          div({fontSize:"9px",color:mine?"rgba(255,255,255,0.6)":cl.sub,marginTop:"4px",
            textAlign:"right"},
            msg.sender_role===(isLister?"lister":"requester")?"You":
            (isLister?"Buyer #"+_ofmAnonId(m.request_id):"Seller #"+_ofmAnonId(m.listing_id)))
        ]));
        msgThread.appendChild(bubble);
      });
      msgThread.scrollTop=msgThread.scrollHeight;
    });

    // Message input
    var inputRow=div({display:"flex",gap:"8px",padding:"10px",borderTop:"1px solid "+cl.border});
    var msgInp=el("input",{type:"text",placeholder:"Type a message…",
      style:{flex:"1",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,
        padding:"10px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",
        outline:"none"}});
    var sendBtn=el("button",{style:{padding:"10px 16px",borderRadius:"8px",cursor:"pointer",
      background:"linear-gradient(135deg,#3B82F6,#2563EB)",color:"#fff",border:"none",
      fontWeight:"700",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",flexShrink:"0"},
      onclick:async function(){
        var txt=msgInp.value.trim();if(!txt)return;
        sendBtn.disabled=true;msgInp.disabled=true;
        var ok=await _ofmSendMsg(m.id,role,txt,myToken);
        if(ok){
          msgInp.value="";
          var bubble=div({display:"flex",justifyContent:"flex-end"});
          bubble.appendChild(div({maxWidth:"80%",padding:"8px 12px",
            borderRadius:"12px 12px 2px 12px",
            background:"linear-gradient(135deg,#3B82F6,#2563EB)",
            color:"#fff",fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},[
            div({},txt),
            div({fontSize:"9px",color:"rgba(255,255,255,0.6)",marginTop:"4px",textAlign:"right"},"You")
          ]));
          msgThread.appendChild(bubble);
          msgThread.scrollTop=msgThread.scrollHeight;
        }
        sendBtn.disabled=false;msgInp.disabled=false;msgInp.focus();
      }});
    sendBtn.textContent="Send";
    msgInp.onkeydown=function(e){if(e.key==="Enter")sendBtn.click();};
    inputRow.appendChild(msgInp);inputRow.appendChild(sendBtn);
    chatWrap.appendChild(inputRow);
    card.appendChild(chatWrap);

    // Privacy reminder
    card.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",
      textAlign:"center",marginTop:"10px",lineHeight:"1.5"},
      "🔒 Your real name and contact details remain hidden until you both agree to share them"));
  }

  wrap.appendChild(card);return wrap;
}

// Helper: render anonymized request details in match card
function _ofmRenderReqDetails(container,req,match,cl){
  var fields=[
    {l:"Looking For",v:req.beds+(req.purpose===("rent")?" (Rent)":" (Purchase)")},
    {l:"Max Budget",v:req.max_budget?"AED "+(req.max_budget).toLocaleString():"Not specified"},
    {l:"Payment",v:(req.payment_method||"Flexible")},
    {l:"Min Size",v:req.min_size?req.min_size+" sqft":"Any"},
    {l:"Timeline",v:req.timeline||"Flexible"},
    {l:"View Pref",v:req.view_pref||"Any"},
  ];
  if(req.notes)fields.push({l:"Notes",v:req.notes});

  // Price delta warning
  if(match.price_delta_pct>10){
    container.appendChild(div({background:hexAlpha("#F59E0B",0.1),borderRadius:"8px",
      padding:"8px 12px",marginBottom:"10px",fontSize:"10px",fontFamily:"'Inter',sans-serif",
      color:"#F59E0B"},
      "⚠️ Buyer's budget is "+match.price_delta_pct.toFixed(0)+"% below your asking price — "+
      "still within the 15% match window. Seller's discretion applies."));
  }

  var grid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"});
  fields.forEach(function(f){
    var c=div({background:cl.raised,borderRadius:"8px",padding:"8px 10px",
      border:"1px solid "+cl.border});
    c.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",
      letterSpacing:"0.06em",marginBottom:"3px"},f.l.toUpperCase()));
    c.appendChild(div({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif",
      fontWeight:"600"},f.v));
    grid.appendChild(c);
  });
  container.appendChild(grid);

  var aiScore=div({marginTop:"10px",display:"flex",alignItems:"center",gap:"8px"},[
    div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"AI Match Score"),
    div({background:hexAlpha(cl.gold,0.15),border:"1px solid "+hexAlpha(cl.gold,0.3),
      color:cl.gold,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
      padding:"3px 10px",borderRadius:"20px"},(match.ai_score||0)+"/100")
  ]);
  container.appendChild(aiScore);
}
// ── Agent Hub (preserved from original) ────────────────────────────────────────
function renderAgentHub(wrap,cl){
  var hub=DEAL_STATE.agentHub;
  if(!hub.loaded&&!hub.loading)fetchAgents();
  var card=div({background:cl.surface,backdropFilter:cl.blur,WebkitBackdropFilter:cl.blur,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"14px",boxShadow:cl.glassShadow});
  card.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"◆ Agent Referral Program"));
  card.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif",marginBottom:"14px",lineHeight:"1.6"},
    "Join DubAIVal's verified agent network. Gold agents receive buyer referrals matched to their area of expertise. Earn more deals, build your reputation."));

  var subTabs=div({display:"flex",gap:"6px",marginBottom:"14px"});
  [{l:"Registered Agents",v:"list"},{l:"Join Program",v:"register"}].forEach(function(t){
    var active=hub.mode===t.v;
    subTabs.appendChild(el("button",{style:{flex:"1",padding:"8px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
      background:active?"rgba(201,168,76,0.12)":"transparent",color:active?cl.gold:cl.sub,border:"1px solid "+(active?"rgba(201,168,76,0.3)":cl.border)},
      onclick:function(){hub.mode=t.v;render();}},t.l));
  });
  card.appendChild(subTabs);

  if(hub.mode==="register"){
    var rf=hub.regForm;
    card.appendChild(renderSmartBar({
      stateKey:"_aiAgent",histKey:"dv_smart_agent",title:"AI Agent Profile",subtitle:"Describe yourself — AI fills the registration form",
      placeholder:"e.g. I'm Ahmed, RERA 54321, specializing in Marina and JBR luxury apartments, 5 years experience",
      examples:["Sara, RERA 12345, ABC Real Estate, Dubai Hills and Arabian Ranches villas"],
      sysPrompt:'You are a real estate agent profile parser. Extract these fields and return ONLY a JSON object: {"name":null,"phone":null,"email":null,"company":null,"rera":null,"areas":null,"specialties":null,"bio":null}. areas and specialties are comma-separated strings. If not mentioned set to null.',
      fieldMap:[
        {k:"name",target:rf,fk:"name"},{k:"phone",target:rf,fk:"phone"},{k:"email",target:rf,fk:"email"},
        {k:"company",target:rf,fk:"company"},{k:"rera",target:rf,fk:"rera"},{k:"areas",target:rf,fk:"areas"},
        {k:"specialties",target:rf,fk:"specialties"},{k:"bio",target:rf,fk:"bio"}
      ]
    }));
    function regInput(label,key,placeholder,type){
      var g=div({marginBottom:"10px"});
      g.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",marginBottom:"4px"},label));
      var inp=el("input",{type:type||"text",placeholder:placeholder||"",value:rf[key]||"",
        style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"10px",borderRadius:"8px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
      inp.oninput=function(){rf[key]=this.value;};g.appendChild(inp);return g;
    }
    var r1=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
    r1.appendChild(regInput("Full Name *","name","Agent name"));
    r1.appendChild(regInput("WhatsApp *","phone","+971 5X XXX XXXX","tel"));
    card.appendChild(r1);
    var r2=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
    r2.appendChild(regInput("Company","company","Agency name"));
    r2.appendChild(regInput("RERA BRN *","rera","e.g. 12345"));
    card.appendChild(r2);
    card.appendChild(regInput("Email","email","agent@email.com","email"));
    card.appendChild(regInput("Areas of Expertise","areas","e.g. Dubai Marina, Downtown, JBR"));
    card.appendChild(regInput("Specialties","specialties","e.g. Luxury villas, Off-plan, Commercial"));
    var bioG=div({marginBottom:"14px"});
    bioG.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",marginBottom:"4px"},"Short Bio"));
    var bioInp=el("textarea",{placeholder:"Tell buyers about your experience and track record…",rows:"3",
      style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"10px",borderRadius:"8px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",resize:"vertical"}});
    bioInp.value=rf.bio||"";bioInp.oninput=function(){rf.bio=this.value;};
    bioG.appendChild(bioInp);card.appendChild(bioG);

    var tierInfo=div({background:cl.raised,borderRadius:"10px",padding:"12px",marginBottom:"14px",border:"1px solid rgba(201,168,76,0.15)"});
    tierInfo.appendChild(div({color:cl.gold,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em",marginBottom:"8px"},"SUBSCRIPTION TIERS"));
    [{t:"Free",c:cl.sub,d:"Listed in directory · No referral priority",p:"AED 0"},
     {t:"Gold",c:"#EAB308",d:"Priority referrals · Verified badge · Featured listing · Video analysis uploads",p:"AED 499/mo"},
     {t:"Platinum",c:"#A78BFA",d:"Top priority · Exclusive leads · DubAIVal co-branding · Premium support",p:"AED 999/mo"}
    ].forEach(function(tier){
      tierInfo.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid "+cl.border},[
        div({},[span({color:tier.c,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},tier.t),
          div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},tier.d)]),
        span({color:tier.c,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},tier.p)
      ]));
    });
    card.appendChild(tierInfo);

    var regBtn=el("button",{style:{width:"100%",padding:"14px",background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:"#070B14",border:"none",borderRadius:"10px",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
      onclick:async function(){
        if(!rf.name||!rf.phone||!rf.rera){alert("Please fill required fields (Name, WhatsApp, RERA)");return;}
        var ok=await registerAgent(rf);
        if(ok){hub.regForm={name:"",phone:"",email:"",company:"",rera:"",areas:"",specialties:"",bio:""};hub.mode="list";fetchAgents();}
      }});
    regBtn.textContent="Register as Agent";
    card.appendChild(regBtn);
    card.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",textAlign:"center",marginTop:"8px"},"Registration starts on Free tier — upgrade to Gold for referral priority"));
  }

  if(hub.mode==="list"){
    if(hub.loading){
      card.appendChild(div({textAlign:"center",padding:"20px",color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},"Loading agents…"));
    }else if(!hub.agents.length){
      card.appendChild(div({textAlign:"center",padding:"20px"},[
        div({fontSize:"28px",marginBottom:"8px"},""),
        div({color:cl.subHi,fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif",marginBottom:"4px"},"No agents registered yet"),
        div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"Be the first to join the DubAIVal referral network")]));
    }else{
      var sortedAgents=hub.agents.slice().sort(function(a,b){
        var aTier=(a.subscription==="gold"||a.subscription==="platinum")?1:0;
        var bTier=(b.subscription==="gold"||b.subscription==="platinum")?1:0;
        var aRera=a.rera_number?1:0;var bRera=b.rera_number?1:0;
        return(bTier*2+bRera)-(aTier*2+aRera);
      });
      sortedAgents.forEach(function(ag){
        var agCard=div({background:cl.raised,borderRadius:"10px",padding:"10px 12px",marginBottom:"8px",border:"1px solid "+cl.border});
        var agTop=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"});
        var agLeft=div({display:"flex",alignItems:"center",gap:"8px"});
        var subColors={free:cl.sub,gold:"#EAB308",platinum:"#A78BFA"};
        agLeft.appendChild(div({width:"36px",height:"36px",borderRadius:"50%",background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",display:"flex",alignItems:"center",justifyContent:"center",color:"#070B14",fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},ag.agent_name?ag.agent_name.charAt(0).toUpperCase():"A"));
        var agInfo=div({});
        var nameRow=div({display:"flex",alignItems:"center",gap:"6px"});
        nameRow.appendChild(span({color:cl.subHi,fontSize:"12px",fontWeight:"700",fontFamily:"'Inter',sans-serif"},ag.agent_name));
        if(ag.rera_number)nameRow.appendChild(span({color:"#3B82F6",fontSize:"11px",fontWeight:"700",title:"RERA Verified"},"✓"));
        nameRow.appendChild(span({color:subColors[ag.subscription]||cl.sub,fontSize:"8px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",padding:"2px 6px",borderRadius:"6px",
            background:hexAlpha(subColors[ag.subscription]||cl.sub,0.12),textTransform:"uppercase"},ag.subscription||"FREE"));
        agInfo.appendChild(nameRow);
        if(ag.agent_company)agInfo.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},ag.agent_company));
        agLeft.appendChild(agInfo);agTop.appendChild(agLeft);
        if(ag.rera_number)agTop.appendChild(span({color:"#3B82F6",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",background:hexAlpha("#3B82F6",0.12),padding:"3px 8px",borderRadius:"6px",fontWeight:"700"},"RERA: "+ag.rera_number));
        agCard.appendChild(agTop);
        if(ag.areas_text)agCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"4px"},"Areas: "+ag.areas_text));
        if(ag.specialties)agCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},"Specialties: "+ag.specialties));
        if(!ag.rera_number)agCard.appendChild(div({background:hexAlpha("#F59E0B",0.08),border:"1px solid "+hexAlpha("#F59E0B",0.25),borderRadius:"6px",padding:"5px 10px",marginTop:"6px",display:"flex",alignItems:"center",gap:"4px"},[
          span({color:"#F59E0B",fontSize:"9px"},"!"),
          span({color:"#F59E0B",fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Add RERA number to get verified badge")]));
        if(ag.deals_closed>0||ag.video_analyses>0){
          var agStats=div({display:"flex",gap:"12px",marginTop:"6px"});
          if(ag.deals_closed>0)agStats.appendChild(span({color:cl.green,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},ag.deals_closed+" deals closed"));
          if(ag.video_analyses>0)agStats.appendChild(span({color:"#A78BFA",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},ag.video_analyses+" video analyses"));
          agCard.appendChild(agStats);
        }
        if((ag.subscription==="gold"||ag.subscription==="platinum")&&ag.rera_number){
          var vaToggleKey="_va_"+ag.id;
          var vaBtn=el("button",{style:{marginTop:"6px",background:hexAlpha("#8B5CF6",0.1),border:"1px solid "+hexAlpha("#8B5CF6",0.25),color:"#A78BFA",padding:"5px 12px",borderRadius:"8px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
            onclick:(function(k,aid){return function(e){e.stopPropagation();DEAL_STATE.videoForm.agentId=aid;window[k]=!window[k];render();};})(vaToggleKey,ag.id)});
          vaBtn.textContent=window[vaToggleKey]?"Close":"Upload Video Analysis";
          agCard.appendChild(vaBtn);
          if(window[vaToggleKey]){
            var vaForm=div({background:cl.raised,borderRadius:"10px",padding:"12px",marginTop:"8px",border:"1px solid "+hexAlpha("#8B5CF6",0.2)});
            vaForm.appendChild(div({color:"#A78BFA",fontSize:"9px",fontWeight:"700",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"NEW VIDEO ANALYSIS"));
            var dSel=el("select",{style:{width:"100%",background:cl.surface,border:"1px solid "+cl.border,color:cl.subHi,padding:"9px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",marginBottom:"8px",boxSizing:"border-box"}});
            dSel.appendChild(el("option",{value:""},"Select Deal (optional)"));
            DEAL_STATE.deals.forEach(function(dd){var o=el("option",{value:dd.id});o.textContent=(dd.building||dd.area||"Unknown")+" — "+(dd.beds||"")+" "+(dd.prop_type||"")+" (AED "+(dd.price?dd.price.toLocaleString():"?")+")";if(String(DEAL_STATE.videoForm.dealId)===String(dd.id))o.selected=true;dSel.appendChild(o);});
            dSel.onchange=function(){DEAL_STATE.videoForm.dealId=this.value;};
            vaForm.appendChild(dSel);
            var vUrlInp=el("input",{type:"url",placeholder:"YouTube or Instagram video URL",value:DEAL_STATE.videoForm.videoUrl||"",style:{width:"100%",background:cl.surface,border:"1px solid "+cl.border,color:cl.white,padding:"9px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"8px"}});
            vUrlInp.oninput=function(){DEAL_STATE.videoForm.videoUrl=this.value;};vaForm.appendChild(vUrlInp);
            var vTitleInp=el("input",{type:"text",placeholder:"e.g. Marina Gate 1 — Full Unit Tour & Market Analysis",value:DEAL_STATE.videoForm.title||"",style:{width:"100%",background:cl.surface,border:"1px solid "+cl.border,color:cl.white,padding:"9px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"8px"}});
            vTitleInp.oninput=function(){DEAL_STATE.videoForm.title=this.value;};vaForm.appendChild(vTitleInp);
            var vSumInp=el("textarea",{placeholder:"Brief analysis summary (max 500 chars)",rows:"3",maxlength:"500",style:{width:"100%",background:cl.surface,border:"1px solid "+cl.border,color:cl.white,padding:"9px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",resize:"vertical",marginBottom:"4px"}});
            vSumInp.value=DEAL_STATE.videoForm.summary||"";vSumInp.oninput=function(){if(this.value.length>500)this.value=this.value.substring(0,500);DEAL_STATE.videoForm.summary=this.value;};
            vaForm.appendChild(vSumInp);
            vaForm.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",textAlign:"right",marginBottom:"10px"},(DEAL_STATE.videoForm.summary||"").length+"/500"));
            var vSubmit=el("button",{style:{width:"100%",padding:"10px",background:DEAL_STATE.videoUploading?"#4B5563":"linear-gradient(135deg,#8B5CF6,#7C3AED)",color:"#fff",border:"none",borderRadius:"8px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:DEAL_STATE.videoUploading?"not-allowed":"pointer"},
              onclick:(function(agId,k){return async function(){
                var vf=DEAL_STATE.videoForm;if(!vf.videoUrl||!vf.title){alert("Video URL and title are required");return;}
                if(vf.videoUrl.indexOf("youtube")===-1&&vf.videoUrl.indexOf("youtu.be")===-1&&vf.videoUrl.indexOf("instagram")===-1){alert("Only YouTube or Instagram URLs are accepted");return;}
                var ok=await postVideoAnalysis({agent_id:agId,deal_id:vf.dealId||null,video_url:vf.videoUrl,title:vf.title,summary:vf.summary||null});
                if(ok){window[k]=false;alert("Video analysis submitted for review!");render();}
              };})(ag.id,vaToggleKey)});
            vSubmit.textContent=DEAL_STATE.videoUploading?"Submitting…":"Submit for Review";
            vaForm.appendChild(vSubmit);
            vaForm.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif",textAlign:"center",marginTop:"6px"},"Videos are reviewed by admin before publishing"));
            agCard.appendChild(vaForm);
          }
        }
        card.appendChild(agCard);
      });
    }
  }
  wrap.appendChild(card);return wrap;
}
// ── Admin Dashboard ────────────────────────────────────────────────────────────
function _ofmAdminLogin(wrap,cl){
  var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"24px",marginTop:"20px"});
  card.appendChild(div({color:"#EF4444",fontSize:"12px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"16px"},"◆ Admin Dashboard Login"));
  var pwInp=el("input",{type:"password",placeholder:"Enter admin password",style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"12px",borderRadius:"8px",fontSize:"14px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"10px"}});
  var pwBtn=el("button",{style:{width:"100%",padding:"12px",background:"linear-gradient(135deg,#C9A84C,#7A5E28)",color:"#08090C",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
  pwBtn.textContent="Login";
  pwBtn.addEventListener("click",async function(){
    var lockKey="dv_ofm_admin_lock";var attKey="dv_ofm_admin_att";
    var lockUntil=parseInt(sessionStorage.getItem(lockKey)||"0");
    if(Date.now()<lockUntil){var rem=Math.ceil((lockUntil-Date.now())/60000);pwInp.placeholder="Locked — try again in "+rem+"m";pwInp.style.borderColor="#EF4444";return;}
    var pwVal=pwInp.value;
    pwBtn.textContent="Verifying...";
    try{
      var vResp=await fetch(SUPABASE_URL+"/rest/v1/rpc/admin_verify",{
        method:"POST",
        headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({p_admin_password:pwVal})
      });
      var ok=vResp.ok&&(await vResp.json())===true;
      if(ok){
        sessionStorage.removeItem(lockKey);sessionStorage.removeItem(attKey);
        DEAL_STATE.adminToken=pwVal;
        try{sessionStorage.setItem("dv_admin_token",pwVal);}catch(e){}
        fetchReferrals().then(function(){render();});
      }else{
        var att=parseInt(sessionStorage.getItem(attKey)||"0")+1;
        sessionStorage.setItem(attKey,att);
        if(att>=5){sessionStorage.setItem(lockKey,Date.now()+30*60*1000);sessionStorage.removeItem(attKey);pwInp.placeholder="Too many attempts — locked 30 min";}
        pwBtn.textContent="Login";pwInp.style.borderColor="#EF4444";pwInp.value="";
      }
    }catch(e){pwBtn.textContent="Login";pwInp.style.borderColor="#EF4444";pwInp.value="";}
  });
  card.appendChild(pwInp);card.appendChild(pwBtn);
  wrap.appendChild(card);
  return wrap;
}

// Shared helper: calls a password-gated admin RPC and auto-logs-out on a
// rejected/expired password so the login form reappears instead of silently
// failing forever.
async function _ofmAdminCall(rpcName,params){
  params.p_admin_password=DEAL_STATE.adminToken;
  var resp=await fetch(SUPABASE_URL+"/rest/v1/rpc/"+rpcName,{
    method:"POST",
    headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"},
    body:JSON.stringify(params)
  });
  if(resp.status===401||resp.status===403||(resp.status===400&&(await resp.clone().text()).indexOf("Not authorized")!==-1)){
    DEAL_STATE.adminToken=null;
    try{sessionStorage.removeItem("dv_admin_token");}catch(e){}
  }
  return resp;
}

function renderAdminDashboard(wrap,cl){
  if(!DEAL_STATE.adminToken)return _ofmAdminLogin(wrap,cl);
  var hub=DEAL_STATE.agentHub;
  var card=div({background:cl.surface,border:"1px solid rgba(239,68,68,0.2)",borderRadius:"14px",padding:"18px",marginBottom:"14px"});
  card.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},[
    div({},[span({color:"#EF4444",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block"},"◆ Admin Dashboard"),
      span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"Referral Management · Agent Control")]),
    el("button",{style:{background:"rgba(239,68,68,0.1)",color:"#EF4444",border:"1px solid rgba(239,68,68,0.2)",padding:"6px 12px",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
      onclick:function(){DEAL_STATE.adminToken=null;try{sessionStorage.removeItem("dv_admin_token");}catch(e){}OFM_STATE.view="dashboard";render();}},"Logout")
  ]));

  var stats=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"8px",marginBottom:"14px"});
  var totalAgents=hub.agents.length;
  var goldAgents=hub.agents.filter(function(a){return a.subscription==="gold"||a.subscription==="platinum";}).length;
  var pendingRefs=hub.referrals.filter(function(r){return r.status==="pending";}).length;
  var closedRefs=hub.referrals.filter(function(r){return r.status==="closed";}).length;
  [{l:"Total Agents",v:totalAgents,c:cl.subHi},{l:"Gold/Platinum",v:goldAgents,c:"#EAB308"},
   {l:"Pending Referrals",v:pendingRefs,c:"#F59E0B"},{l:"Closed Deals",v:closedRefs,c:cl.green}]
    .forEach(function(s){
      stats.appendChild(div({background:cl.raised,borderRadius:"8px",padding:"8px",textAlign:"center"},[
        div({color:s.c,fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},String(s.v)),
        div({color:cl.sub,fontSize:"8px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},s.l)]));
    });
  card.appendChild(stats);

  var totalDealValue=hub.referrals.reduce(function(sum,r){return sum+(r.deal_value||0);},0);
  if(closedRefs>0){
    card.appendChild(div({background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:"10px",padding:"10px",textAlign:"center",marginBottom:"14px"},[
      div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"TOTAL CLOSED DEAL VALUE"),
      div({color:cl.green,fontSize:"22px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+totalDealValue.toLocaleString())]));
  }

  card.appendChild(div({color:"#F59E0B",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",fontWeight:"700"},"◆ PENDING REFERRAL REQUESTS"));
  var pendingList=hub.referrals.filter(function(r){return r.status==="pending";});
  if(!pendingList.length){
    card.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",padding:"12px",textAlign:"center"},"No pending referrals"));
  }else{
    pendingList.forEach(function(ref){
      var refCard=div({background:cl.raised,borderRadius:"8px",padding:"10px",marginBottom:"6px",border:"1px solid rgba(245,158,11,0.2)"});
      refCard.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"},[
        div({},[div({color:cl.subHi,fontSize:"12px",fontWeight:"700",fontFamily:"'Inter',sans-serif"},ref.buyer_name),
          div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},ref.buyer_phone)]),
        span({color:"#F59E0B",fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",background:"rgba(245,158,11,0.12)",padding:"3px 8px",borderRadius:"6px"},"PENDING")
      ]));
      var details=[];
      if(ref.buyer_area)details.push("Area: "+ref.buyer_area);
      if(ref.buyer_budget)details.push("Budget: AED "+ref.buyer_budget.toLocaleString());
      if(ref.buyer_prop_type)details.push("Type: "+ref.buyer_prop_type);
      if(details.length)refCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginBottom:"8px"},details.join(" · ")));
      var goldAgentsList=hub.agents.filter(function(a){return a.subscription==="gold"||a.subscription==="platinum";});
      if(goldAgentsList.length){
        var assignRow=div({display:"flex",gap:"6px",alignItems:"center"});
        var agentSelect=el("select",{style:{flex:"1",background:cl.surface,border:"1px solid "+cl.border,color:cl.subHi,padding:"8px",borderRadius:"6px",fontSize:"11px",fontFamily:"'Inter',sans-serif"}});
        agentSelect.appendChild(el("option",{value:""},"Select Agent…"));
        goldAgentsList.forEach(function(a){var o=el("option",{value:String(a.id)});o.textContent=a.agent_name+" ("+a.subscription+") — "+(a.areas_text||"all areas");agentSelect.appendChild(o);});
        assignRow.appendChild(agentSelect);
        var assignBtn=el("button",{style:{background:"linear-gradient(135deg,#10B981,#059669)",color:"#fff",border:"none",padding:"8px 14px",borderRadius:"6px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
          onclick:(function(rid,sel){return function(){var aid=sel.value;if(!aid){alert("Please select an agent");return;}assignReferral(rid,parseInt(aid,10));};})(ref.id,agentSelect)});
        assignBtn.textContent="Assign";assignRow.appendChild(assignBtn);
        refCard.appendChild(assignRow);
      }else{
        refCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",fontStyle:"italic"},"No Gold agents available — agents need Gold subscription for referrals"));
      }
      card.appendChild(refCard);
    });
  }

  card.appendChild(div({color:"#10B981",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",marginTop:"14px",fontWeight:"700"},"◆ ACTIVE & CLOSED REFERRALS"));
  var activeRefs=hub.referrals.filter(function(r){return r.status!=="pending";});
  if(!activeRefs.length){
    card.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",padding:"12px",textAlign:"center"},"No active referrals yet"));
  }else{
    activeRefs.forEach(function(ref){
      var statusColors={assigned:"#60A5FA",connected:"#F59E0B",negotiating:"#A78BFA",closed:"#10B981",cancelled:"#EF4444"};
      var sc=statusColors[ref.status]||cl.sub;
      var refRow=div({background:cl.raised,borderRadius:"8px",padding:"8px 10px",marginBottom:"4px",border:"1px solid "+cl.border,display:"flex",justifyContent:"space-between",alignItems:"center"});
      var refInfo=div({});
      refInfo.appendChild(div({display:"flex",alignItems:"center",gap:"6px"},[
        span({color:cl.subHi,fontSize:"11px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},ref.buyer_name+(ref.buyer_area?" · "+ref.buyer_area:"")),
        span({color:sc,fontSize:"8px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",background:hexAlpha(sc,0.12),padding:"2px 6px",borderRadius:"6px",textTransform:"uppercase"},ref.status)
      ]));
      if(ref.deal_value)refInfo.appendChild(div({color:cl.green,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Deal Value: AED "+ref.deal_value.toLocaleString()));
      refRow.appendChild(refInfo);
      if(ref.status!=="closed"&&ref.status!=="cancelled"){
        var actionSel=el("select",{style:{background:cl.surface,border:"1px solid "+cl.border,color:cl.subHi,padding:"4px 8px",borderRadius:"6px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"}});
        var defOpt=el("option",{value:"",disabled:true,selected:true});defOpt.textContent="Update…";actionSel.appendChild(defOpt);
        [{l:"→ Connected",v:"connected"},{l:"→ Negotiating",v:"negotiating"},{l:"→ Closed",v:"closed"},{l:"→ Cancelled",v:"cancelled"}].forEach(function(s){
          var o=el("option",{value:s.v});o.textContent=s.l;actionSel.appendChild(o);});
        actionSel.onchange=(function(rid){return function(){
          var newStatus=this.value;
          if(newStatus==="closed"){var val=prompt("Enter deal value (AED):");if(val===null||val===undefined){this.value=this.options[0].value;return;}updateReferralStatus(rid,newStatus,parseFloat(val)||0);}
          else{updateReferralStatus(rid,newStatus,null);}
        };})(ref.id);
        refRow.appendChild(actionSel);
      }
      card.appendChild(refRow);
    });
  }

  // Pending Video Reviews
  card.appendChild(div({color:"#A78BFA",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",marginTop:"14px",fontWeight:"700"},"◆ PENDING VIDEO REVIEWS"));
  (function(){
    var vidSection=div({});
    fetchVideoAnalyses("pending").then(function(pending){
      if(!pending.length){vidSection.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",padding:"12px",textAlign:"center",marginBottom:"10px"},"No pending video reviews"));return;}
      pending.forEach(function(vid){
        var vCard=div({background:cl.raised,borderRadius:"8px",padding:"10px",marginBottom:"6px",border:"1px solid "+hexAlpha("#A78BFA",0.2)});
        vCard.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"},[
          div({},[div({color:cl.subHi,fontSize:"12px",fontWeight:"700",fontFamily:"'Inter',sans-serif"},vid.title),
            div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},"Agent #"+vid.agent_id+(vid.deal_id?" · Deal: "+String(vid.deal_id).substring(0,8)+"…":""))]),
          span({color:"#F59E0B",fontSize:"8px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",background:"rgba(245,158,11,0.12)",padding:"2px 6px",borderRadius:"6px"},"PENDING")
        ]));
        if(vid.summary)vCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5",marginBottom:"6px"},vid.summary));
        var vLink=el("a",{href:vid.video_url,target:"_blank",rel:"noopener",style:{color:"#A78BFA",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",textDecoration:"none",display:"block",marginBottom:"8px"}});
        vLink.textContent="▶ "+vid.video_url;vCard.appendChild(vLink);
        var vActions=div({display:"flex",gap:"6px"});
        var approveVBtn=el("button",{style:{flex:"1",padding:"7px",background:"rgba(16,185,129,0.12)",color:cl.green,border:"1px solid rgba(16,185,129,0.3)",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
          onclick:(function(vId){return async function(){await updateVideoStatus(vId,"approved");render();};})(vid.id)});
        approveVBtn.textContent="✓ Approve";
        var rejectVBtn=el("button",{style:{flex:"1",padding:"7px",background:"rgba(239,68,68,0.12)",color:"#EF4444",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
          onclick:(function(vId){return async function(){await updateVideoStatus(vId,"rejected");render();};})(vid.id)});
        rejectVBtn.textContent="✗ Reject";
        vActions.appendChild(approveVBtn);vActions.appendChild(rejectVBtn);
        vCard.appendChild(vActions);vidSection.appendChild(vCard);
      });
    });
    card.appendChild(vidSection);
  })();

  // Market Intelligence Control
  card.appendChild(div({color:"#F59E0B",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",marginTop:"14px",fontWeight:"700"},"◆ AI MARKET INTELLIGENCE · GROQ"));
  (function(){
    var miCard=div({background:hexAlpha("#F59E0B",0.04),border:"1px solid "+hexAlpha("#F59E0B",0.15),borderRadius:"10px",padding:"14px",marginBottom:"14px"});
    var overall=typeof MARKET_MOMENTUM!=="undefined"?MARKET_MOMENTUM["_overall"]:null;
    var momKeys=typeof MARKET_MOMENTUM!=="undefined"?Object.keys(MARKET_MOMENTUM).filter(function(k){return k!=="_overall";}):[];
    var momAge=overall&&overall.updated?Math.round((Date.now()-new Date(overall.updated).getTime())/(1000*60*60*24)):null;
    var stale=typeof shouldRunIntelligence==="function"&&shouldRunIntelligence();
    miCard.appendChild(div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"},[
      div({background:cl.raised,borderRadius:"8px",padding:"8px",textAlign:"center"},[
        div({color:cl.sub,fontSize:"8px",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},"AREAS TRACKED"),
        div({color:"#F59E0B",fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},String(momKeys.length))]),
      div({background:cl.raised,borderRadius:"8px",padding:"8px",textAlign:"center"},[
        div({color:cl.sub,fontSize:"8px",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},"DATA AGE"),
        div({color:stale?"#EF4444":"#10B981",fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},momAge!==null?momAge+"d":"—")]),
      div({background:cl.raised,borderRadius:"8px",padding:"8px",textAlign:"center"},[
        div({color:cl.sub,fontSize:"8px",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},"STATUS"),
        div({color:stale?"#EF4444":"#10B981",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},stale?"STALE":"FRESH")]),
    ]));
    if(overall&&overall.trend){
      var trendCol=overall.trend==="up"?"#10B981":overall.trend==="down"?"#EF4444":"#F59E0B";
      miCard.appendChild(div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px",padding:"8px 10px",background:cl.raised,borderRadius:"8px"},[
        div({width:"6px",height:"6px",borderRadius:"50%",background:trendCol,flexShrink:"0"}),
        span({color:trendCol,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Overall Market: "+overall.trend.toUpperCase()+" "+(overall.pct>0?"+":"")+overall.pct+"%"),
      ]));
    }
    var miStatusEl=div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",textAlign:"center",marginTop:"8px",display:"none"});
    var runBtn=el("button",{style:{width:"100%",padding:"10px",background:"linear-gradient(135deg,#F59E0B,#D97706)",color:"#000",border:"none",borderRadius:"8px",fontSize:"12px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",letterSpacing:"0.06em"}});
    runBtn.textContent=stale?"Run AI Market Analysis (Recommended)":"Refresh Market Intelligence";
    runBtn.onclick=async function(){
      runBtn.disabled=true;runBtn.style.opacity="0.5";runBtn.textContent="Analyzing 50 areas with Groq AI…";
      miStatusEl.style.display="block";miStatusEl.textContent="Sending to Groq Llama 3.3-70b…";
      try{
        var result=await runMarketIntelligence();
        if(result.success){
          runBtn.textContent="✓ Updated "+result.count+" areas";runBtn.style.background="#10B981";
          miStatusEl.textContent="Overall: "+((result.overall&&result.overall.trend)||"stable")+" · "+(result.overall&&result.overall.note?result.overall.note:"Analysis complete");
          miStatusEl.style.color="#10B981";
        }else{
          runBtn.textContent="✗ Failed — retry";runBtn.style.background="#EF4444";runBtn.disabled=false;runBtn.style.opacity="1";
          miStatusEl.textContent="Error: "+(result.error||"Unknown");miStatusEl.style.color="#EF4444";
        }
      }catch(e){
        runBtn.textContent="✗ Error — retry";runBtn.style.background="#EF4444";runBtn.disabled=false;runBtn.style.opacity="1";
        miStatusEl.textContent=e.message;miStatusEl.style.color="#EF4444";
      }
    };
    miCard.appendChild(runBtn);miCard.appendChild(miStatusEl);
    miCard.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif",marginTop:"8px",lineHeight:"1.4",opacity:"0.7"},"Uses Groq AI (Llama 3.3-70b) to analyze market trends for 50 key Dubai areas. Results are stored in Supabase and applied as correction factors to valuations. Recommended: run weekly."));
    card.appendChild(miCard);
  })();

  card.appendChild(div({color:"#60A5FA",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",marginTop:"14px",fontWeight:"700"},"◆ AGENT MANAGEMENT"));
  hub.agents.forEach(function(ag){
    var agRow=div({background:cl.raised,borderRadius:"8px",padding:"8px 10px",marginBottom:"4px",border:"1px solid "+cl.border,display:"flex",justifyContent:"space-between",alignItems:"center"});
    var subColors={free:cl.sub,gold:"#EAB308",platinum:"#A78BFA"};
    agRow.appendChild(div({display:"flex",alignItems:"center",gap:"8px"},[
      span({color:cl.subHi,fontSize:"11px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},ag.agent_name),
      span({color:subColors[ag.subscription]||cl.sub,fontSize:"8px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",padding:"2px 6px",borderRadius:"6px",
        background:hexAlpha(subColors[ag.subscription]||cl.sub,0.12),textTransform:"uppercase"},ag.subscription||"free"),
      span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"RERA: "+(ag.rera_number||"—"))
    ]));
    var subSel=el("select",{style:{background:cl.surface,border:"1px solid "+cl.border,color:cl.subHi,padding:"4px 8px",borderRadius:"6px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"}});
    [{l:"Free",v:"free"},{l:"Gold ★",v:"gold"},{l:"Platinum ★★",v:"platinum"}].forEach(function(s){
      var o=el("option",{value:s.v});o.textContent=s.l;if(ag.subscription===s.v)o.selected=true;subSel.appendChild(o);});
    subSel.onchange=(function(aid){return function(){updateAgentSubscription(aid,this.value);};})(ag.id);
    agRow.appendChild(subSel);
    card.appendChild(agRow);
  });
  wrap.appendChild(card);return wrap;
}

// ── Utility: timeAgo ───────────────────────────────────────────────────────────
function timeAgo(dateStr){
  if(!dateStr)return"—";
  var d=new Date(dateStr);if(isNaN(d.getTime()))return"—";
  var diff=Math.floor((Date.now()-d.getTime())/1000);
  if(diff<60)return"just now";if(diff<3600)return Math.floor(diff/60)+"m ago";
  if(diff<86400)return Math.floor(diff/3600)+"h ago";if(diff<604800)return Math.floor(diff/86400)+"d ago";
  return d.toLocaleDateString("en-GB",{day:"numeric",month:"short"});
}

// ── Agent & Referral CRUD (preserved from original) ────────────────────────────
async function registerAgent(formData){
  try{
    var row={agent_name:formData.name,agent_phone:formData.phone,agent_email:formData.email||null,
      agent_company:formData.company||null,rera_number:formData.rera,
      areas_text:formData.areas||null,specialties:formData.specialties||null,bio:formData.bio||null};
    var resp=await fetch(SUPABASE_URL+"/rest/v1/dv_agents",{method:"POST",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=representation"},
      body:JSON.stringify(row)});
    if(resp.ok){alert("Agent registration successful! You'll be notified when approved for the referral program.");return true;}
    else{var err=await resp.text();alert("Registration failed: "+err);return false;}
  }catch(e){alert("Error: "+e.message);return false;}
}

async function fetchAgents(){
  if(DEAL_STATE.agentHub.loading)return;
  DEAL_STATE.agentHub.loading=true;
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/dv_agents?active=eq.true&order=rating.desc,deals_closed.desc",
      {headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}});
    if(resp.ok)DEAL_STATE.agentHub.agents=await resp.json();
  }catch(e){}
  DEAL_STATE.agentHub.loading=false;
  DEAL_STATE.agentHub.loaded=true;
  render();
}

async function createReferral(buyerDealId,buyerName,buyerPhone,area,budget,propType){
  try{
    var row={buyer_deal_id:buyerDealId,buyer_name:buyerName,buyer_phone:buyerPhone,
      buyer_area:area||null,buyer_budget:budget||null,buyer_prop_type:propType||null,status:"pending"};
    var resp=await fetch(SUPABASE_URL+"/rest/v1/dv_referrals",{method:"POST",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify(row)});
    return resp.ok;
  }catch(e){return false;}
}

async function fetchReferrals(){
  if(!DEAL_STATE.adminToken)return;
  try{
    var resp=await _ofmAdminCall("admin_get_referrals",{});
    if(resp.ok)DEAL_STATE.agentHub.referrals=await resp.json();
  }catch(e){}
}

async function assignReferral(referralId,agentId){
  try{
    var resp=await _ofmAdminCall("admin_update_referral",
      {p_referral_id:referralId,p_updates:{assigned_agent_id:agentId,status:"assigned"}});
    if(!resp.ok)throw new Error("Server returned "+resp.status);
    fetchReferrals().then(function(){render();});
  }catch(e){alert("Failed: "+e.message);}
}

async function updateReferralStatus(referralId,status,dealValue){
  try{
    var patch={status:status};
    if(dealValue)patch.deal_value=dealValue;
    var resp=await _ofmAdminCall("admin_update_referral",{p_referral_id:referralId,p_updates:patch});
    if(!resp.ok){alert("Failed to update referral ("+resp.status+")");return;}
    fetchReferrals().then(function(){render();});
  }catch(e){alert("Failed: "+e.message);}
}

async function updateAgentSubscription(agentId,subscription){
  try{
    var resp=await _ofmAdminCall("admin_update_agent",{p_agent_id:agentId,p_updates:{subscription:subscription}});
    if(!resp.ok){alert("Failed to update subscription ("+resp.status+")");return;}
    fetchAgents();
  }catch(e){alert("Failed: "+e.message);}
}

async function fetchVideoAnalyses(status){
  var q=SUPABASE_URL+"/rest/v1/agent_video_analyses?select=*&order=created_at.desc";
  if(status)q+="&status=eq."+status;
  try{
    var resp=await fetch(q,{headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}});
    if(resp.ok)return await resp.json();
  }catch(e){}
  return[];
}

async function postVideoAnalysis(data){
  DEAL_STATE.videoUploading=true;render();
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/agent_video_analyses",{method:"POST",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=representation"},
      body:JSON.stringify(data)});
    if(!resp.ok){alert("Failed to submit video analysis");DEAL_STATE.videoUploading=false;render();return false;}
    DEAL_STATE.videoForm={dealId:"",videoUrl:"",title:"",summary:"",agentId:null};
    DEAL_STATE.videoUploading=false;render();return true;
  }catch(e){alert("Error: "+e.message);DEAL_STATE.videoUploading=false;render();return false;}
}

async function updateVideoStatus(videoId,status){
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/agent_video_analyses?id=eq."+videoId,{method:"PATCH",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({status:status})});
    if(!resp.ok){alert("Failed to update video status ("+resp.status+")");return;}
    if(status==="approved"){
      var vids=await fetchVideoAnalyses("approved");
      var agentCounts={};
      vids.forEach(function(v){agentCounts[v.agent_id]=(agentCounts[v.agent_id]||0)+1;});
      for(var aid in agentCounts){
        await fetch(SUPABASE_URL+"/rest/v1/dv_agents?id=eq."+aid,{method:"PATCH",
          headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"},
          body:JSON.stringify({video_analyses:agentCounts[aid]})});
      }
    }
  }catch(e){alert("Failed: "+e.message);}
}

// ── Legacy aliases (app.js may call these directly) ───────────────────────────
function saveAgentProfile(){
  try{localStorage.setItem("dv_agent_profile",JSON.stringify({name:DEAL_STATE.form.agentName,phone:DEAL_STATE.form.agentPhone,company:DEAL_STATE.form.agentCompany,email:DEAL_STATE.form.agentEmail,rera:DEAL_STATE.form.reraNumber}));}catch(e){}
}
function renderDealForm(){OFM_STATE.view="post_listing";OFM_STATE.listStep=1;render();}
