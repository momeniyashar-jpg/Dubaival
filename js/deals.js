// --- DEAL NETWORK TAB --------------------------------------------------------
var DEAL_STATE={mode:"browse",filter:{type:"all",purpose:"sale",area:"",beds:"",minPrice:"",maxPrice:"",urgency:""},
  form:{type:"have",agentName:"",agentPhone:"",agentCompany:"",agentEmail:"",reraNumber:"",area:"",building:"",propType:"apartment",beds:"",sizeSqft:"",floor:"",view:"",furnished:"Unfurnished",purpose:"sale",price:"",urgency:"normal",notes:"",offMarket:false,contactMode:"whatsapp",titleDeedNo:"",titleDeedImg:null,requestReferral:false},
  deals:[],loading:false,posting:false,myTokens:[],matches:[],waParser:{text:"",parsing:false,parsed:null},
  inquiry:{dealId:null,name:"",phone:"",email:"",message:"",sending:false},myInquiries:{},
  mediaPhotos:[],videoUrl:"",mediaUploading:false,mediaView:null,sentInquiries:{},dealMediaCache:{},
  requestReferral:false,agentHub:{mode:"list",agents:[],referrals:[],regForm:{name:"",phone:"",email:"",company:"",rera:"",areas:"",specialties:"",bio:""},loading:false},adminToken:null};
try{var dt=localStorage.getItem("dv_deal_tokens");if(dt)DEAL_STATE.myTokens=JSON.parse(dt);}catch(e){}
try{var si=localStorage.getItem("dv_sent_inquiries");if(si)DEAL_STATE.sentInquiries=JSON.parse(si);}catch(e){}
try{var at=localStorage.getItem("dv_admin_token");if(at)DEAL_STATE.adminToken=at;}catch(e){}
try{var ap=localStorage.getItem("dv_agent_profile");if(ap){var p=JSON.parse(ap);DEAL_STATE.form.agentName=p.name||"";DEAL_STATE.form.agentPhone=p.phone||"";DEAL_STATE.form.agentCompany=p.company||"";DEAL_STATE.form.agentEmail=p.email||"";DEAL_STATE.form.reraNumber=p.rera||"";}}catch(e){}
function saveAgentProfile(){try{localStorage.setItem("dv_agent_profile",JSON.stringify({name:DEAL_STATE.form.agentName,phone:DEAL_STATE.form.agentPhone,company:DEAL_STATE.form.agentCompany,email:DEAL_STATE.form.agentEmail,rera:DEAL_STATE.form.reraNumber}));}catch(e){}}

async function fetchDeals(){
  DEAL_STATE.loading=true;render();
  try{
    var q=SUPABASE_URL+"/rest/v1/deal_board?select=id,type,agent_name,agent_phone,agent_company,agent_email,rera_number,area,building,prop_type,beds,size_sqft,floor_num,view_type,furnished,purpose,price,price_negotiable,dv_fair_price,dv_psf,dv_verdict,dv_confidence,dv_yield,dv_signal,title_deed_no,urgency,notes,off_market,active,edit_token,contact_count,contact_mode,created_at,expires_at,updated_at&active=eq.true&order=created_at.desc&limit=100";
    var f=DEAL_STATE.filter;
    if(f.type&&f.type!=="all")q+="&type=eq."+f.type;
    if(f.purpose)q+="&purpose=eq."+f.purpose;
    if(f.area)q+="&area=eq."+encodeURIComponent(f.area);
    if(f.beds)q+="&beds=eq."+encodeURIComponent(f.beds);
    if(f.minPrice)q+="&price=gte."+f.minPrice;
    if(f.maxPrice)q+="&price=lte."+f.maxPrice;
    if(f.urgency&&f.urgency!=="all")q+="&urgency=eq."+f.urgency;
    var resp=await fetch(q,{headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}});
    if(resp.ok){DEAL_STATE.deals=await resp.json();fetchMyInquiries();}
  }catch(e){console.warn("Deal fetch failed:",e.message);}
  DEAL_STATE.loading=false;render();
}

async function postDeal(){
  if(DEAL_STATE.posting)return;
  var f=DEAL_STATE.form;
  if(!f.agentName||!f.agentPhone||!f.area||!f.price){alert("Please fill required fields");return;}
  if(!f.reraNumber||f.reraNumber.trim().length<3){alert("RERA BRN is required (minimum 3 characters). Please enter your RERA number to post a deal.");return;}
  if(f.type==="have"&&!f.titleDeedNo){alert("Title Deed number is required for listings. Please enter your Title Deed number to verify property ownership.");return;}
  saveAgentProfile();
  DEAL_STATE.posting=true;render();
  var row={type:f.type,agent_name:f.agentName,agent_phone:f.agentPhone,agent_company:f.agentCompany||null,
    agent_email:f.agentEmail||null,rera_number:f.reraNumber||null,
    area:f.area,building:f.building||null,prop_type:f.propType,beds:f.beds||null,
    size_sqft:parseFloat(f.sizeSqft)||null,floor_num:f.floor||null,view_type:f.view||null,
    furnished:f.furnished,purpose:f.purpose,price:parseFloat(f.price.replace(/,/g,""))||0,
    urgency:f.urgency,notes:f.notes||null,off_market:f.offMarket,contact_mode:f.contactMode||"whatsapp",
    title_deed_no:f.titleDeedNo||null,title_deed_img:f.titleDeedImg||null};
  if(f.type==="have"&&row.size_sqft&&row.price){
    try{
      var valInput={area:f.area,building:f.building||"",buaSize:String(row.size_sqft),price:String(row.price),
        propCategory:f.propType==="villa"||f.propType==="townhouse"?"villa":"apartment",
        beds:f.beds||"2 BR",view:f.view||"Not specified",floor:f.floor||"",
        furnished:f.furnished||"Unfurnished",parking:"1",serviceCharge:""};
      var val=computeValuation(valInput,f.building||"",null);
      if(val){row.dv_fair_price=val.fairPrice;row.dv_psf=val.adjPSF;row.dv_verdict=val.verdict;
        row.dv_confidence=val.confScore;row.dv_yield=parseFloat(val.grossYield);row.dv_signal=val.investSignal?val.investSignal.label:null;}
    }catch(e){}
  }
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/deal_board",{method:"POST",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=representation"},
      body:JSON.stringify(row)});
    if(!resp.ok){alert("Failed to post deal ("+resp.status+")");DEAL_STATE.posting=false;render();return;}
    if(resp.ok){
      var created=await resp.json();
      if(created&&created[0]){
        if(created[0].edit_token){
          DEAL_STATE.myTokens.push(created[0].edit_token);
          try{localStorage.setItem("dv_deal_tokens",JSON.stringify(DEAL_STATE.myTokens));}catch(e){}
        }
        if(DEAL_STATE.mediaPhotos.length||DEAL_STATE.videoUrl){
          try{await uploadDealMedia(created[0].id,DEAL_STATE.mediaPhotos,DEAL_STATE.videoUrl);}catch(e){console.warn("Media upload failed:",e);}
        }
        if(f.type==="need"&&f.requestReferral){
          try{await createReferral(created[0].id,f.agentName,f.agentPhone,f.area,parseFloat(f.price.replace(/,/g,""))||null,f.propType);}catch(e){console.warn("Referral creation failed:",e);}
        }
      }
      DEAL_STATE.mediaPhotos=[];DEAL_STATE.videoUrl="";
      DEAL_STATE.waParser={text:"",parsing:false,parsed:null};
      DEAL_STATE.form={type:"have",agentName:f.agentName,agentPhone:f.agentPhone,agentCompany:f.agentCompany,agentEmail:f.agentEmail,reraNumber:f.reraNumber,area:"",building:"",propType:"apartment",beds:"",sizeSqft:"",floor:"",view:"",furnished:"Unfurnished",purpose:"sale",price:"",urgency:"normal",notes:"",offMarket:false,contactMode:f.contactMode,titleDeedNo:"",titleDeedImg:null,requestReferral:false};
      DEAL_STATE.mode="browse";
      fetchDeals();
    }
  }catch(e){alert("Post failed: "+e.message);}
  DEAL_STATE.posting=false;render();
}

function findMatches(deal){
  var matches=[];
  var opposite=deal.type==="have"?"need":"have";
  DEAL_STATE.deals.forEach(function(d){
    if(d.type!==opposite||d.purpose!==deal.purpose)return;
    var score=0;
    if(d.area===deal.area)score+=40;
    if(d.prop_type===deal.prop_type)score+=20;
    if(d.beds===deal.beds)score+=15;
    var priceDiff=deal.price>0&&d.price>0?Math.abs(d.price-deal.price)/Math.max(d.price,deal.price):1;
    if(priceDiff<0.1)score+=20;else if(priceDiff<0.2)score+=10;else if(priceDiff<0.35)score+=5;
    if(d.urgency==="hot")score+=5;
    if(score>=40)matches.push({deal:d,score:score});
  });
  matches.sort(function(a,b){return b.score-a.score;});
  return matches.slice(0,5);
}

function compressPhoto(file,maxW,quality){
  maxW=maxW||800;quality=quality||0.65;
  return new Promise(function(resolve,reject){
    var reader=new FileReader();
    reader.onload=function(e){
      var img=new Image();
      img.onload=function(){
        var w=img.width,h=img.height;
        if(w>maxW){h=h*maxW/w;w=maxW;}
        var c=document.createElement("canvas");c.width=w;c.height=h;
        c.getContext("2d").drawImage(img,0,0,w,h);
        resolve(c.toDataURL("image/jpeg",quality));
      };
      img.onerror=function(){reject(new Error("Image load failed"));};
      img.src=e.target.result;
    };
    reader.onerror=function(){reject(new Error("File read failed"));};
    reader.readAsDataURL(file);
  });
}

async function uploadDealMedia(dealId,photos,videoUrl){
  var rows=[];
  for(var i=0;i<photos.length;i++){
    rows.push({deal_id:dealId,media_type:"photo",data:photos[i],sort_order:i});
  }
  if(videoUrl&&videoUrl.trim()){rows.push({deal_id:dealId,media_type:"video",data:videoUrl.trim(),sort_order:photos.length});}
  if(!rows.length)return;
  var resp=await fetch(SUPABASE_URL+"/rest/v1/deal_media",{method:"POST",
    headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},
    body:JSON.stringify(rows)});
  if(!resp.ok)throw new Error("Media upload failed ("+resp.status+")");
}

async function fetchDealMedia(dealId){
  if(DEAL_STATE.dealMediaCache[dealId])return DEAL_STATE.dealMediaCache[dealId];
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/deal_media?deal_id=eq."+dealId+"&order=sort_order",
      {headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}});
    if(resp.ok){var data=await resp.json();DEAL_STATE.dealMediaCache[dealId]=data;return data;}
  }catch(e){}
  return [];
}

async function updateInquiryStatus(inquiryId,status){
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/deal_inquiries?id=eq."+inquiryId,{method:"PATCH",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify({status:status})});
    if(!resp.ok)throw new Error("Server returned "+resp.status);
    fetchDeals();
  }catch(e){alert("Failed to update: "+e.message);}
}

async function deleteDealMedia(mediaId,dealId){
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/deal_media?id=eq."+mediaId,{method:"DELETE",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}});
    if(!resp.ok)throw new Error("Server returned "+resp.status);
    delete DEAL_STATE.dealMediaCache[dealId];
    render();
  }catch(e){alert("Failed to delete: "+e.message);}
}

async function sendInquiry(dealId){
  var inq=DEAL_STATE.inquiry;
  if(!inq.name||!inq.name.trim()){alert("Please enter your name");return;}
  if(!inq.phone||!inq.phone.trim()){alert("Please enter your phone number");return;}
  inq.sending=true;render();
  try{
    var row={deal_id:dealId,sender_name:inq.name,sender_phone:inq.phone||null,sender_email:inq.email||null,message:inq.message||null};
    var resp=await fetch(SUPABASE_URL+"/rest/v1/deal_inquiries",{method:"POST",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify(row)});
    if(resp.ok){
      DEAL_STATE.sentInquiries[dealId]={phone:inq.phone,name:inq.name,ts:Date.now()};
      try{localStorage.setItem("dv_sent_inquiries",JSON.stringify(DEAL_STATE.sentInquiries));}catch(e){}
      DEAL_STATE.inquiry={dealId:null,name:inq.name,phone:inq.phone,email:inq.email,message:"",sending:false};
      alert("Interest sent! The owner will review your request and share property media if approved.");}
    else{alert("Failed to send");}
  }catch(e){alert("Error: "+e.message);}
  inq.sending=false;render();
}

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
  DEAL_STATE.agentHub.loading=true;
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/dv_agents?active=eq.true&order=rating.desc,deals_closed.desc",
      {headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}});
    if(resp.ok)DEAL_STATE.agentHub.agents=await resp.json();
  }catch(e){}
  DEAL_STATE.agentHub.loading=false;render();
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
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/dv_referrals?order=created_at.desc&limit=50",
      {headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}});
    if(resp.ok)DEAL_STATE.agentHub.referrals=await resp.json();
  }catch(e){}
}

async function assignReferral(referralId,agentId){
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/dv_referrals?id=eq."+referralId,{method:"PATCH",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({assigned_agent_id:agentId,status:"assigned",updated_at:new Date().toISOString()})});
    if(!resp.ok)throw new Error("Server returned "+resp.status);
    fetchReferrals().then(function(){render();});
  }catch(e){alert("Failed: "+e.message);}
}

async function updateReferralStatus(referralId,status,dealValue){
  try{
    var patch={status:status,updated_at:new Date().toISOString()};
    if(dealValue)patch.deal_value=dealValue;
    if(status==="closed"&&dealValue){patch.commission_earned=dealValue*0.02;}
    await fetch(SUPABASE_URL+"/rest/v1/dv_referrals?id=eq."+referralId,{method:"PATCH",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"},
      body:JSON.stringify(patch)});
    fetchReferrals().then(function(){render();});
  }catch(e){alert("Failed: "+e.message);}
}

async function updateAgentSubscription(agentId,subscription){
  try{
    await fetch(SUPABASE_URL+"/rest/v1/dv_agents?id=eq."+agentId,{method:"PATCH",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({subscription:subscription,updated_at:new Date().toISOString()})});
    fetchAgents();
  }catch(e){alert("Failed: "+e.message);}
}

async function fetchMyInquiries(){
  var dealIds=[];
  if(DEAL_STATE.myTokens.length){
    var myDeals=DEAL_STATE.deals.filter(function(d){return DEAL_STATE.myTokens.indexOf(d.edit_token)!==-1;});
    for(var i=0;i<myDeals.length;i++){dealIds.push(myDeals[i].id);}
  }
  var sentKeys=Object.keys(DEAL_STATE.sentInquiries);
  for(var j=0;j<sentKeys.length;j++){var sid=parseInt(sentKeys[j]);if(dealIds.indexOf(sid)===-1)dealIds.push(sid);}
  if(!dealIds.length)return;
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/deal_inquiries?deal_id=in.("+dealIds.join(",")+")&order=created_at.desc",
      {headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}});
    if(resp.ok){
      var data=await resp.json();
      data.forEach(function(inq){
        if(!DEAL_STATE.myInquiries[inq.deal_id])DEAL_STATE.myInquiries[inq.deal_id]=[];
        DEAL_STATE.myInquiries[inq.deal_id].push(inq);
      });
    }
    render();
  }catch(e){}
}

function renderDeals(){
  var cl=C();var wrap=div({padding:"16px 20px",maxWidth:"640px",margin:"0 auto",paddingBottom:"90px"});
  wrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"},[
    div({},[span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block"},"◆ Deal Network"),
      span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"Agent-to-Agent · Off-Market Deals")]),
    el("button",{style:{background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:"#070B14",border:"none",padding:"8px 16px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
      onclick:function(){DEAL_STATE.mode=DEAL_STATE.mode==="post"?"browse":"post";render();}},DEAL_STATE.mode==="post"?"← Browse":"+ Post Deal")
  ]));
  var modeBar=div({display:"flex",gap:"6px",marginBottom:"14px"});
  [{l:"Deals",v:"browse"},{l:"Agent Hub",v:"agents"},{l:"Admin",v:"admin"}].forEach(function(m){
    if(m.v==="admin"&&!DEAL_STATE.adminToken)return;
    var active=DEAL_STATE.mode===m.v||(m.v==="browse"&&(DEAL_STATE.mode==="browse"||DEAL_STATE.mode==="post"));
    var btn=el("button",{style:{padding:"6px 14px",borderRadius:"8px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
      background:active?"rgba(201,168,76,0.15)":"transparent",color:active?cl.gold:cl.sub,border:"1px solid "+(active?"rgba(201,168,76,0.3)":cl.border)},
      onclick:function(){DEAL_STATE.mode=m.v;if(m.v==="agents")fetchAgents();if(m.v==="admin"){fetchAgents();fetchReferrals().then(function(){render();});}render();}});
    btn.textContent=m.l;modeBar.appendChild(btn);
  });
  if(!DEAL_STATE.adminToken){
    var adminLink=el("button",{style:{padding:"6px 10px",borderRadius:"8px",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
      background:"transparent",color:cl.sub,border:"1px solid "+cl.border,marginLeft:"auto"},
      onclick:function(){var token=prompt("Enter DubAIVal Admin Token:");if(token&&token.trim()){DEAL_STATE.adminToken=token.trim();try{localStorage.setItem("dv_admin_token",token.trim());}catch(e){}DEAL_STATE.mode="admin";fetchAgents();fetchReferrals().then(function(){render();});render();}}});
    adminLink.textContent="Admin Login";modeBar.appendChild(adminLink);
  }
  wrap.appendChild(modeBar);

  if(DEAL_STATE.mode==="post")return renderDealForm(wrap,cl);
  if(DEAL_STATE.mode==="agents")return renderAgentHub(wrap,cl);
  if(DEAL_STATE.mode==="admin")return renderAdminDashboard(wrap,cl);

  var fBar=div({display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px"});
  [{l:"All",v:"all"},{l:"I Have",v:"have"},{l:"I Need",v:"need"}].forEach(function(t){
    var active=DEAL_STATE.filter.type===t.v;
    fBar.appendChild(el("button",{style:{background:active?cl.gold:"transparent",color:active?"#070B14":cl.sub,border:"1px solid "+(active?cl.gold:cl.border),padding:"6px 12px",borderRadius:"16px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",fontWeight:active?"700":"400"},
      onclick:function(){DEAL_STATE.filter.type=t.v;fetchDeals();}},t.l));
  });
  [{l:"Sale",v:"sale"},{l:"Rent",v:"rent"}].forEach(function(p){
    var active=DEAL_STATE.filter.purpose===p.v;
    fBar.appendChild(el("button",{style:{background:active?"rgba(0,200,150,0.15)":"transparent",color:active?cl.green:cl.sub,border:"1px solid "+(active?"rgba(0,200,150,0.3)":cl.border),padding:"6px 12px",borderRadius:"16px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
      onclick:function(){DEAL_STATE.filter.purpose=p.v;fetchDeals();}},p.l));
  });
  wrap.appendChild(fBar);

  var filterRow=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"14px"});
  var areaSelect=el("select",{style:{background:cl.surface,border:"1px solid "+cl.border,color:cl.subHi,padding:"8px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Inter',sans-serif"}});
  areaSelect.appendChild(el("option",{value:""},"All Areas"));
  ["Dubai Marina","Downtown Dubai","Business Bay","Palm Jumeirah","JVC","Dubai Hills Estate","MBR City","Dubai Creek Harbour","Jumeirah Lake Towers","DAMAC Hills","Arabian Ranches","Emaar Beachfront","DIFC","Al Furjan","Town Square","Dubai South","Sobha Hartland","City Walk"].forEach(function(a){
    var opt=el("option",{value:a});opt.textContent=a;if(DEAL_STATE.filter.area===a)opt.selected=true;areaSelect.appendChild(opt);
  });
  areaSelect.onchange=function(){DEAL_STATE.filter.area=this.value;fetchDeals();};
  filterRow.appendChild(areaSelect);
  var bedsSelect=el("select",{style:{background:cl.surface,border:"1px solid "+cl.border,color:cl.subHi,padding:"8px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Inter',sans-serif"}});
  bedsSelect.appendChild(el("option",{value:""},"All Beds"));
  ["Studio","1 BR","2 BR","3 BR","4 BR","5 BR","5+ BR"].forEach(function(b){var o=el("option",{value:b});o.textContent=b;bedsSelect.appendChild(o);});
  bedsSelect.onchange=function(){DEAL_STATE.filter.beds=this.value;fetchDeals();};
  filterRow.appendChild(bedsSelect);
  var urgSelect=el("select",{style:{background:cl.surface,border:"1px solid "+cl.border,color:cl.subHi,padding:"8px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Inter',sans-serif"}});
  [{l:"All Priority",v:"all"},{l:"🔥 Hot",v:"hot"},{l:"⚡ Urgent",v:"urgent"},{l:"Normal",v:"normal"}].forEach(function(u){
    var o=el("option",{value:u.v});o.textContent=u.l;urgSelect.appendChild(o);});
  urgSelect.onchange=function(){DEAL_STATE.filter.urgency=this.value;fetchDeals();};
  filterRow.appendChild(urgSelect);
  wrap.appendChild(filterRow);

  // RERA Verified toggle
  if(!DEAL_STATE.filter.reraOnly)DEAL_STATE.filter.reraOnly=false;
  var reraToggle=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px"});
  var reraActive=DEAL_STATE.filter.reraOnly;
  var reraTBtn=el("button",{style:{display:"flex",alignItems:"center",gap:"6px",padding:"6px 14px",borderRadius:"8px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",background:reraActive?hexAlpha("#3B82F6",0.15):"transparent",color:reraActive?"#3B82F6":cl.sub,border:"1px solid "+(reraActive?"rgba(59,130,246,0.3)":cl.border)}});
  reraTBtn.textContent=(reraActive?"✓ ":"")+"RERA Verified Only";
  reraTBtn.addEventListener("click",function(){DEAL_STATE.filter.reraOnly=!DEAL_STATE.filter.reraOnly;render();});
  reraToggle.appendChild(reraTBtn);
  wrap.appendChild(reraToggle);

  var allDeals=DEAL_STATE.deals;
  if(DEAL_STATE.filter.reraOnly)allDeals=allDeals.filter(function(d){return d.rera_number&&d.rera_number.length>=3;});
  var haveCount=allDeals.filter(function(d){return d.type==="have";}).length;
  var needCount=allDeals.filter(function(d){return d.type==="need";}).length;
  var hotCount=allDeals.filter(function(d){return d.urgency==="hot";}).length;
  var nowISO=new Date().toISOString();
  var expiringCount=allDeals.filter(function(d){if(!d.expires_at)return false;var ms=new Date(d.expires_at).getTime()-Date.now();return ms>0&&ms<3*86400000;}).length;

  // Row 1: core stats
  var stats=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"8px",marginBottom:"10px"});
  [{l:"Total",v:allDeals.length,c:cl.gold},{l:"I Have",v:haveCount,c:cl.green},{l:"I Need",v:needCount,c:"#60A5FA"},{l:"🔥 Hot",v:hotCount,c:"#EF4444"}].forEach(function(s){
    stats.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",padding:"10px 6px",textAlign:"center"},[
      div({color:s.c,fontSize:"20px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},String(s.v)),
      div({color:cl.sub,fontSize:"8.5px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},s.l)]));
  });
  wrap.appendChild(stats);

  // Row 2: avg price + top areas + have/need ratio + expiring
  if(allDeals.length>0){
    var avgPrice=0,priceN=0;
    allDeals.forEach(function(d){if(d.price){avgPrice+=d.price;priceN++;}});
    if(priceN)avgPrice=Math.round(avgPrice/priceN);
    var areaFreq={};
    allDeals.forEach(function(d){if(d.area){areaFreq[d.area]=(areaFreq[d.area]||0)+1;}});
    var topAreas=Object.entries(areaFreq).sort(function(a,b){return b[1]-a[1];}).slice(0,3);
    var hPct=allDeals.length?Math.round(haveCount/allDeals.length*100):50;

    var row2=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"});

    // Avg price + expiring
    row2.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",padding:"10px 12px"},[
      div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"},[
        div({},[div({color:cl.sub,fontSize:"8.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Avg Price"),
          div({color:cl.gold,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},avgPrice?"AED "+avgPrice.toLocaleString():"—")]),
        expiringCount>0?div({textAlign:"right"},[div({color:"#EF4444",fontSize:"8.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"⚠ Expiring"),
          div({color:"#EF4444",fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},String(expiringCount))]):div({})
      ]),
      div({background:"rgba(255,255,255,0.05)",borderRadius:"4px",height:"6px",overflow:"hidden",display:"flex"})
    ]));

    // Top areas
    var topBox=[div({color:cl.sub,fontSize:"8.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"Top Areas")];
    if(topAreas.length===0)topBox.push(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},"—"));
    topAreas.forEach(function(ta){
      topBox.push(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2px"},[
        span({color:"#F0F2F5",fontSize:"10.5px",fontFamily:"'Inter',sans-serif"},ta[0]),
        span({color:cl.gold,fontSize:"10.5px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},String(ta[1]))]));
    });
    row2.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",padding:"10px 12px"},topBox));
    wrap.appendChild(row2);

    // Have/Need ratio bar
    var ratioBar=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",padding:"10px 12px",marginBottom:"14px"},[
      div({display:"flex",justifyContent:"space-between",marginBottom:"5px"},[
        span({color:cl.green,fontSize:"9.5px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"I HAVE "+hPct+"%"),
        span({color:"#60A5FA",fontSize:"9.5px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"I NEED "+(100-hPct)+"%")]),
      div({background:"rgba(255,255,255,0.05)",borderRadius:"4px",height:"7px",overflow:"hidden",position:"relative"},[
        div({background:"linear-gradient(90deg,#10B981,#059669)",height:"100%",width:hPct+"%",borderRadius:"4px 0 0 4px",position:"absolute",left:"0",top:"0"}),
        div({background:"linear-gradient(90deg,#3B82F6,#60A5FA)",height:"100%",width:(100-hPct)+"%",borderRadius:"0 4px 4px 0",position:"absolute",right:"0",top:"0"})])
    ]);
    wrap.appendChild(ratioBar);
  }

  if(DEAL_STATE.loading){wrap.appendChild(div({textAlign:"center",padding:"40px"},[div({width:"30px",height:"30px",borderRadius:"50%",border:"2px solid "+cl.border,borderTopColor:cl.gold,animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}),span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},"Loading deals…")]));return wrap;}

  if(!DEAL_STATE.deals.length){
    wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"32px",textAlign:"center"},[
      div({fontSize:"32px",marginBottom:"12px"},"🤝"),
      div({color:cl.subHi,fontSize:"14px",fontWeight:"600",fontFamily:"'Inter',sans-serif",marginBottom:"6px"},"No deals yet"),
      div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif",marginBottom:"16px"},"Be the first to post — your deal gets auto-valued by DubAIVal AVM"),
      el("button",{style:{background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:"#070B14",border:"none",padding:"10px 24px",borderRadius:"8px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
        onclick:function(){DEAL_STATE.mode="post";render();}},"Post Your First Deal")]));
    return wrap;
  }

  // --- SMART MATCHING ALERTS ---
  var allMatches=[];
  var seenPairs={};
  DEAL_STATE.deals.forEach(function(d){
    var ms=findMatches(d);
    ms.forEach(function(m){
      var pairKey=[Math.min(d.id,m.deal.id),Math.max(d.id,m.deal.id)].join("-");
      if(seenPairs[pairKey])return;
      seenPairs[pairKey]=true;
      var have=d.type==="have"?d:m.deal;
      var need=d.type==="need"?d:m.deal;
      allMatches.push({have:have,need:need,score:m.score});
    });
  });
  allMatches.sort(function(a,b){return b.score-a.score;});

  if(allMatches.length>0){
    var matchPanel=div({background:"linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.03))",border:"1px solid rgba(201,168,76,0.35)",borderRadius:"14px",padding:"14px 16px",marginBottom:"14px"});
    matchPanel.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"},[
      div({display:"flex",alignItems:"center",gap:"8px"},[
        span({fontSize:"16px"},"🔗"),
        div({},[
          div({color:cl.gold,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"Smart Matches"),
          div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},"Have ↔ Need deals matched by area, type & budget")])]),
      span({background:"rgba(201,168,76,0.15)",color:cl.gold,fontSize:"11px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",padding:"4px 10px",borderRadius:"10px"},String(allMatches.length)+" match"+(allMatches.length!==1?"es":""))
    ]));
    allMatches.slice(0,5).forEach(function(m,idx){
      var mCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",padding:"10px 12px",marginBottom:idx<Math.min(allMatches.length,5)-1?"8px":"0"});
      // Score badge
      var scoreColor=m.score>=80?"#10B981":m.score>=60?cl.gold:"#60A5FA";
      var scoreLabel=m.score>=80?"Excellent":m.score>=60?"Strong":"Good";
      // Top: score + area
      mCard.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"},[
        div({display:"flex",alignItems:"center",gap:"6px"},[
          span({background:hexAlpha(scoreColor,0.12),color:scoreColor,fontSize:"10px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",padding:"3px 8px",borderRadius:"8px"},m.score+"% "+scoreLabel),
          span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},m.have.area+(m.have.prop_type?" · "+m.have.prop_type:""))]),
        span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},m.have.beds||"")
      ]));
      // Have row
      var hRow=div({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 8px",background:"rgba(0,200,150,0.06)",borderRadius:"6px",marginBottom:"4px"});
      hRow.appendChild(div({display:"flex",alignItems:"center",gap:"6px"},[
        span({color:cl.green,fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"HAVE"),
        span({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif"},m.have.agent_name+(m.have.building?" · "+m.have.building:""))]));
      hRow.appendChild(span({color:cl.green,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+m.have.price.toLocaleString()));
      mCard.appendChild(hRow);
      // Need row
      var nRow=div({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 8px",background:"rgba(96,165,250,0.06)",borderRadius:"6px"});
      nRow.appendChild(div({display:"flex",alignItems:"center",gap:"6px"},[
        span({color:"#60A5FA",fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"NEED"),
        span({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif"},m.need.agent_name+(m.need.building?" · "+m.need.building:""))]));
      nRow.appendChild(span({color:"#60A5FA",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+m.need.price.toLocaleString()));
      mCard.appendChild(nRow);
      matchPanel.appendChild(mCard);
    });
    if(allMatches.length>5){
      matchPanel.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",textAlign:"center",marginTop:"8px"},"+ "+(allMatches.length-5)+" more matches"));
    }
    wrap.appendChild(matchPanel);
  }

  DEAL_STATE.deals.forEach(function(d){
    var isHave=d.type==="have";
    var urgColors={hot:"#EF4444",urgent:"#F59E0B",normal:cl.border};
    var urgLabels={hot:"🔥 HOT",urgent:"⚡ URGENT",normal:""};
    var card=el("div",{style:{background:cl.surface,border:"1px solid "+(d.urgency==="hot"?"rgba(239,68,68,0.4)":d.urgency==="urgent"?"rgba(245,158,11,0.3)":cl.border),borderRadius:"14px",padding:"14px 16px",marginBottom:"10px",cursor:"pointer",transition:"border-color 0.2s"}});
    var topRow=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}});
    var leftTop=el("div",{});
    var typeBadge=el("span",{style:{fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em",padding:"3px 8px",borderRadius:"10px",
      background:isHave?"rgba(0,200,150,0.12)":"rgba(96,165,250,0.12)",color:isHave?cl.green:"#60A5FA"}});
    typeBadge.textContent=isHave?"I HAVE":"I NEED";
    leftTop.appendChild(typeBadge);
    if(d.urgency!=="normal"){var urgBadge=el("span",{style:{fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",padding:"3px 8px",borderRadius:"10px",marginLeft:"6px",background:"rgba(239,68,68,0.12)",color:urgColors[d.urgency]}});urgBadge.textContent=urgLabels[d.urgency];leftTop.appendChild(urgBadge);}
    if(d.rera_number){var verBadge=el("span",{style:{fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",padding:"3px 8px",borderRadius:"10px",marginLeft:"6px",background:hexAlpha("#3B82F6",0.12),color:"#3B82F6"}});verBadge.textContent="RERA Verified ✓";leftTop.appendChild(verBadge);}
    if(d.title_deed_no){var tdBadge=el("span",{style:{fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",padding:"3px 8px",borderRadius:"10px",marginLeft:"6px",background:"rgba(234,179,8,0.12)",color:"#EAB308"}});tdBadge.textContent="📜 TITLE DEED";leftTop.appendChild(tdBadge);}
    if(d.off_market){var omBadge=el("span",{style:{fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",padding:"3px 8px",borderRadius:"10px",marginLeft:"6px",background:"rgba(201,168,76,0.12)",color:cl.gold}});omBadge.textContent="OFF-MARKET";leftTop.appendChild(omBadge);}
    topRow.appendChild(leftTop);
    var purposeBadge=el("span",{style:{fontSize:"10px",color:d.purpose==="sale"?cl.gold:"#60A5FA",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"}});
    purposeBadge.textContent=d.purpose==="sale"?"FOR SALE":"FOR RENT";
    topRow.appendChild(purposeBadge);
    card.appendChild(topRow);

    // Expiry countdown
    if(d.expires_at){
      var expMs=new Date(d.expires_at).getTime()-Date.now();
      var expDays=Math.ceil(expMs/86400000);
      var expHours=Math.max(0,Math.floor(expMs/3600000));
      var isExpired=expMs<=0;
      var isUrgentExp=!isExpired&&expDays<=3;
      var isWarnExp=!isExpired&&!isUrgentExp&&expDays<=7;
      var expColor=isExpired?"#EF4444":isUrgentExp?"#EF4444":isWarnExp?"#F59E0B":"#6B7280";
      var expBg=isExpired?"rgba(239,68,68,0.08)":isUrgentExp?"rgba(239,68,68,0.08)":isWarnExp?"rgba(245,158,11,0.06)":"transparent";
      var expText=isExpired?"❌ Expired":expDays===0?"⚠️ "+expHours+"h left":expDays===1?"⚠️ 1 day left":isUrgentExp?"⚠️ "+expDays+" days left":"⏱ "+expDays+" days left";
      var expBar=div({background:expBg,borderRadius:"8px",padding:"6px 10px",marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"center"});
      expBar.appendChild(span({color:expColor,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},expText));
      if(!isExpired){
        var totalDays=Math.max(1,Math.ceil((new Date(d.expires_at).getTime()-new Date(d.created_at).getTime())/86400000));
        var pctLeft=Math.max(0,Math.min(100,Math.round(expDays/totalDays*100)));
        var barColor=isUrgentExp?"#EF4444":isWarnExp?"#F59E0B":"#10B981";
        expBar.appendChild(div({width:"80px",height:"4px",background:"rgba(255,255,255,0.06)",borderRadius:"2px",overflow:"hidden",flexShrink:"0"},[
          div({height:"100%",width:pctLeft+"%",background:barColor,borderRadius:"2px",transition:"width 0.3s"})]));
      }
      card.appendChild(expBar);
      if(isExpired)card.style.opacity="0.45";
    }

    var title=d.area+(d.building?" · "+d.building:"")+(d.beds?" · "+d.beds:"");
    card.appendChild(div({color:cl.subHi,fontSize:"14px",fontWeight:"700",fontFamily:"'Inter',sans-serif",marginBottom:"4px"},title));
    var detailRow=div({display:"flex",gap:"12px",flexWrap:"wrap",marginBottom:"8px"});
    if(d.prop_type)detailRow.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},d.prop_type));
    if(d.size_sqft)detailRow.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},d.size_sqft.toLocaleString()+" sqft"));
    if(d.floor_num)detailRow.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},"Floor "+d.floor_num));
    if(d.view_type)detailRow.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},d.view_type));
    if(d.furnished&&d.furnished!=="Unfurnished")detailRow.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},d.furnished));
    card.appendChild(detailRow);

    var priceRow=div({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:"1px solid "+cl.border,borderBottom:"1px solid "+cl.border,marginBottom:"8px"});
    priceRow.appendChild(div({},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},isHave?"Asking Price":"Budget"),
      div({color:cl.gold,fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+d.price.toLocaleString()+(d.price_negotiable?" ±":""))]));
    if(d.dv_fair_price&&isHave){
      var verdictColors={DISTRESS:cl.green,GOOD:cl.green,FAIR:"#F59E0B",OVER:"#EF4444"};
      var verdictLabels={DISTRESS:"DISTRESS DEAL",GOOD:"GOOD PRICE",FAIR:"FAIR",OVER:"OVERPRICED"};
      priceRow.appendChild(div({textAlign:"right"},[
        div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"DubAIVal Estimate"),
        div({color:verdictColors[d.dv_verdict]||cl.sub,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+d.dv_fair_price.toLocaleString()),
        span({color:verdictColors[d.dv_verdict]||cl.sub,fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",background:hexAlpha(verdictColors[d.dv_verdict]||cl.sub,0.12),padding:"2px 6px",borderRadius:"8px"},verdictLabels[d.dv_verdict]||"—")
      ]));
    }
    card.appendChild(priceRow);

    if(d.dv_psf||d.dv_yield||d.dv_confidence){
      var metricRow=div({display:"flex",gap:"8px",marginBottom:"8px"});
      if(d.dv_psf)metricRow.appendChild(div({background:cl.raised,borderRadius:"6px",padding:"4px 8px",textAlign:"center",flex:"1"},[span({color:cl.sub,fontSize:"8px",fontFamily:"'Space Grotesk',monospace",display:"block"},"PSF"),span({color:cl.subHi,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+d.dv_psf.toLocaleString())]));
      if(d.dv_yield)metricRow.appendChild(div({background:cl.raised,borderRadius:"6px",padding:"4px 8px",textAlign:"center",flex:"1"},[span({color:cl.sub,fontSize:"8px",fontFamily:"'Space Grotesk',monospace",display:"block"},"Yield"),span({color:d.dv_yield>=7?cl.green:"#F59E0B",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},d.dv_yield.toFixed(1)+"%")]));
      if(d.dv_confidence)metricRow.appendChild(div({background:cl.raised,borderRadius:"6px",padding:"4px 8px",textAlign:"center",flex:"1"},[span({color:cl.sub,fontSize:"8px",fontFamily:"'Space Grotesk',monospace",display:"block"},"Conf."),span({color:d.dv_confidence>=80?cl.green:d.dv_confidence>=60?"#F59E0B":"#EF4444",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},d.dv_confidence+"%")]));
      if(d.dv_signal)metricRow.appendChild(div({background:cl.raised,borderRadius:"6px",padding:"4px 8px",textAlign:"center",flex:"1"},[span({color:cl.sub,fontSize:"8px",fontFamily:"'Space Grotesk',monospace",display:"block"},"Signal"),span({color:d.dv_signal==="Undervalued"||d.dv_signal==="Fair Value"?cl.green:"#F59E0B",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},d.dv_signal)]));
      card.appendChild(metricRow);
    }

    if(d.notes){card.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",fontStyle:"italic",marginBottom:"8px",lineHeight:"1.5"},"\""+d.notes+"\""));}

    var bottomRow=div({display:"flex",justifyContent:"space-between",alignItems:"center"});
    var agentInfo=[span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},d.agent_name+(d.agent_company?" · "+d.agent_company:""))];
    if(d.rera_number)agentInfo.push(span({color:"#3B82F6",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginLeft:"6px"},"RERA: "+d.rera_number));
    agentInfo.push(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},timeAgo(d.created_at)));
    bottomRow.appendChild(div({},agentInfo));
    if(d.contact_mode==="private"){
      var intBtn=el("button",{style:{background:"linear-gradient(135deg,#8B5CF6,#7C3AED)",color:"#fff",border:"none",padding:"7px 14px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
      intBtn.textContent=DEAL_STATE.inquiry.dealId===d.id?"Close":"Send Interest";
      intBtn.onclick=(function(did){return function(e){e.stopPropagation();DEAL_STATE.inquiry.dealId=DEAL_STATE.inquiry.dealId===did?null:did;render();};})(d.id);
      bottomRow.appendChild(intBtn);
    }else{
      var contactBtn=el("button",{style:{background:"linear-gradient(135deg,#10B981,#059669)",color:"#fff",border:"none",padding:"7px 14px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
      contactBtn.textContent="WhatsApp";
      contactBtn.onclick=function(e){e.stopPropagation();var phone=d.agent_phone.replace(/[^0-9+]/g,"");
        var msg=encodeURIComponent("Hi "+d.agent_name+", I'm interested in your "+d.type+" listing: "+d.area+(d.building?" - "+d.building:"")+" at AED "+d.price.toLocaleString()+" (via DubAIVal Deal Network)");
        window.open("https://wa.me/"+phone+"?text="+msg,"_blank");};
      bottomRow.appendChild(contactBtn);
    }
    card.appendChild(bottomRow);

    // Share buttons
    var shareRow=div({display:"flex",gap:"6px",marginTop:"8px",paddingTop:"8px",borderTop:"1px solid "+cl.border});
    var shareText=(d.type==="have"?"🏠 ":"🔍 ")+d.area+(d.building?" – "+d.building:"")+" | "+(d.beds||"")+" "+d.prop_type+" | AED "+d.price.toLocaleString()+(d.dv_verdict?" | DubAIVal: "+d.dv_verdict:"")+" | dubaival.com";
    var waShareBtn=el("button",{style:{background:"rgba(37,211,102,0.1)",border:"1px solid rgba(37,211,102,0.25)",color:"#25D366",padding:"5px 10px",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"},
      onclick:(function(txt){return function(e){e.stopPropagation();window.open("https://wa.me/?text="+encodeURIComponent(txt),"_blank");};})(shareText)});
    waShareBtn.textContent="WhatsApp";
    shareRow.appendChild(waShareBtn);
    var copyBtn=el("button",{style:{background:"rgba(255,255,255,0.05)",border:"1px solid "+cl.border,color:cl.sub,padding:"5px 10px",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"},
      onclick:(function(txt,btn){return function(e){e.stopPropagation();navigator.clipboard.writeText(txt).then(function(){btn.textContent="✓ Copied!";btn.style.color="#10B981";setTimeout(function(){btn.textContent="📋 Copy";btn.style.color=cl.sub;},1500);});};})(shareText)});
    copyBtn.textContent="📋 Copy";
    shareRow.appendChild(copyBtn);
    if(navigator.share){
      var nativeBtn=el("button",{style:{background:"rgba(255,255,255,0.05)",border:"1px solid "+cl.border,color:cl.sub,padding:"5px 10px",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
        onclick:(function(txt,area,bld){return function(e){e.stopPropagation();navigator.share({title:"DubAIVal Deal – "+area+(bld?" – "+bld:""),text:txt}).catch(function(){});};})(shareText,d.area,d.building)});
      nativeBtn.textContent="📤 Share";
      shareRow.appendChild(nativeBtn);
    }
    card.appendChild(shareRow);

    if(d.contact_mode==="private"&&DEAL_STATE.inquiry.dealId===d.id){
      var inqForm=div({background:cl.raised,borderRadius:"10px",padding:"12px",marginTop:"8px",border:"1px solid rgba(139,92,246,0.3)"});
      inqForm.appendChild(div({color:"#8B5CF6",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",fontWeight:"700"},"Send Your Interest"));
      var inqRow1=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"});
      var inqNameInp=el("input",{type:"text",placeholder:"Your Name *",value:DEAL_STATE.inquiry.name||"",
        style:{width:"100%",background:cl.surface,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"8px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
      inqNameInp.oninput=function(){DEAL_STATE.inquiry.name=this.value;};
      inqRow1.appendChild(inqNameInp);
      var inqPhoneInp=el("input",{type:"tel",placeholder:"WhatsApp / Phone *",value:DEAL_STATE.inquiry.phone||"",
        style:{width:"100%",background:cl.surface,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"8px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
      inqPhoneInp.oninput=function(){DEAL_STATE.inquiry.phone=this.value;};
      inqRow1.appendChild(inqPhoneInp);
      inqForm.appendChild(inqRow1);
      var inqEmailInp=el("input",{type:"email",placeholder:"Email (optional)",value:DEAL_STATE.inquiry.email||"",
        style:{width:"100%",background:cl.surface,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"8px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"8px"}});
      inqEmailInp.oninput=function(){DEAL_STATE.inquiry.email=this.value;};
      inqForm.appendChild(inqEmailInp);
      var inqMsgInp=el("textarea",{placeholder:"Message (optional) — e.g. I have a client looking for this type of unit…",rows:"2",
        style:{width:"100%",background:cl.surface,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"8px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",resize:"vertical",marginBottom:"8px"}});
      inqMsgInp.value=DEAL_STATE.inquiry.message||"";inqMsgInp.oninput=function(){DEAL_STATE.inquiry.message=this.value;};
      inqForm.appendChild(inqMsgInp);
      var inqSendBtn=el("button",{style:{width:"100%",padding:"10px",background:"linear-gradient(135deg,#8B5CF6,#7C3AED)",color:"#fff",border:"none",borderRadius:"8px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",opacity:DEAL_STATE.inquiry.sending?"0.5":"1"},
        onclick:(function(did){return function(){sendInquiry(did);};})(d.id)});
      inqSendBtn.textContent=DEAL_STATE.inquiry.sending?"Sending…":"Send Interest";
      inqForm.appendChild(inqSendBtn);
      inqForm.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif",textAlign:"center",marginTop:"6px"},"Your info is shared only with the deal poster — their number stays private"));
      card.appendChild(inqForm);
    }

    var isOwner=DEAL_STATE.myTokens.indexOf(d.edit_token)!==-1;
    var myInqs=DEAL_STATE.myInquiries[d.id];
    if(myInqs&&myInqs.length&&isOwner){
      var inqWrap=div({background:cl.raised,borderRadius:"8px",padding:"8px 10px",marginTop:"8px",border:"1px solid rgba(139,92,246,0.2)"});
      inqWrap.appendChild(div({color:"#8B5CF6",fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em",marginBottom:"6px"},"◆ "+myInqs.length+" INTEREST"+(myInqs.length>1?"S":"")+" RECEIVED"));
      myInqs.slice(0,10).forEach(function(inq){
        var iRow=div({padding:"6px 0",borderBottom:"1px solid "+cl.border});
        var iTop=div({display:"flex",justifyContent:"space-between",alignItems:"center"});
        var iInfo=div({});
        var statusColor=inq.status==="approved"?"#10B981":inq.status==="rejected"?"#EF4444":"#F59E0B";
        var statusLabel=inq.status==="approved"?"✓ Approved":inq.status==="rejected"?"✗ Rejected":"⏳ Pending";
        iInfo.appendChild(div({display:"flex",alignItems:"center",gap:"6px"},[
          div({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif",fontWeight:"600"},inq.sender_name),
          span({color:statusColor,fontSize:"8px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",background:hexAlpha(statusColor,0.12),padding:"2px 6px",borderRadius:"6px"},statusLabel)
        ]));
        var contactParts=[];
        if(inq.sender_phone)contactParts.push(inq.sender_phone);
        if(inq.sender_email)contactParts.push(inq.sender_email);
        if(contactParts.length)iInfo.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},contactParts.join(" · ")));
        if(inq.message)iInfo.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",fontStyle:"italic",marginTop:"2px"},"\""+inq.message+"\""));
        iTop.appendChild(iInfo);
        var iActions=div({display:"flex",gap:"4px",alignItems:"center",flexShrink:"0",marginLeft:"8px"});
        if(!inq.status||inq.status==="pending"){
          var approveBtn=el("button",{style:{background:"rgba(16,185,129,0.15)",color:"#10B981",border:"1px solid rgba(16,185,129,0.3)",padding:"4px 10px",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
            onclick:(function(iid){return function(e){e.stopPropagation();updateInquiryStatus(iid,"approved");};})(inq.id)});
          approveBtn.textContent="Approve";iActions.appendChild(approveBtn);
          var rejectBtn=el("button",{style:{background:"rgba(239,68,68,0.1)",color:"#EF4444",border:"1px solid rgba(239,68,68,0.2)",padding:"4px 10px",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
            onclick:(function(iid){return function(e){e.stopPropagation();updateInquiryStatus(iid,"rejected");};})(inq.id)});
          rejectBtn.textContent="Reject";iActions.appendChild(rejectBtn);
        }else if(inq.status==="approved"&&inq.sender_phone){
          var waBtn=el("button",{style:{background:"rgba(37,211,102,0.15)",color:"#25D366",border:"1px solid rgba(37,211,102,0.3)",padding:"4px 10px",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
            onclick:(function(phone,name){return function(e){e.stopPropagation();window.open("https://wa.me/"+phone.replace(/[^0-9+]/g,"")+"?text="+encodeURIComponent("Hi "+name+", your request for my property listing on DubAIVal has been approved. Photos and details are now available for you."),"_blank");};})(inq.sender_phone,inq.sender_name)});
          waBtn.textContent="WhatsApp";iActions.appendChild(waBtn);
        }
        iActions.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},timeAgo(inq.created_at)));
        iTop.appendChild(iActions);
        iRow.appendChild(iTop);
        inqWrap.appendChild(iRow);
      });
      card.appendChild(inqWrap);
    }

    if(isOwner){
      var mediaManage=div({background:cl.raised,borderRadius:"8px",padding:"8px 10px",marginTop:"8px",border:"1px solid rgba(96,165,250,0.2)"});
      var mmHead=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"});
      mmHead.appendChild(span({color:"#60A5FA",fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em"},"◆ PROPERTY MEDIA"));
      var mmToggle=el("button",{style:{background:"rgba(96,165,250,0.12)",color:"#60A5FA",border:"1px solid rgba(96,165,250,0.3)",padding:"4px 10px",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
        onclick:(function(did){return function(e){e.stopPropagation();DEAL_STATE.mediaView=DEAL_STATE.mediaView===did?null:did;if(DEAL_STATE.mediaView===did)fetchDealMedia(did).then(function(){render();});else render();};})(d.id)});
      mmToggle.textContent=DEAL_STATE.mediaView===d.id?"Close":"Manage Media";
      mmHead.appendChild(mmToggle);
      mediaManage.appendChild(mmHead);
      if(DEAL_STATE.mediaView===d.id){
        var existingMedia=DEAL_STATE.dealMediaCache[d.id]||[];
        var existPhotos=existingMedia.filter(function(m){return m.media_type==="photo";});
        var existVideos=existingMedia.filter(function(m){return m.media_type==="video";});
        if(existPhotos.length){
          var mGrid=div({display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(70px,1fr))",gap:"6px",marginBottom:"8px",marginTop:"8px"});
          existPhotos.forEach(function(m){
            var thumb=div({position:"relative",paddingTop:"100%",borderRadius:"6px",overflow:"hidden",border:"1px solid "+cl.border});
            thumb.appendChild(el("img",{src:m.data,style:{position:"absolute",top:"0",left:"0",width:"100%",height:"100%",objectFit:"cover"}}));
            var delBtn=el("button",{style:{position:"absolute",top:"2px",right:"2px",background:"rgba(239,68,68,0.9)",color:"#fff",border:"none",borderRadius:"50%",width:"18px",height:"18px",fontSize:"11px",cursor:"pointer",lineHeight:"16px",textAlign:"center"},
              onclick:(function(mid,did){return function(e){e.stopPropagation();if(confirm("Delete this photo?"))deleteDealMedia(mid,did);};})(m.id,d.id)});
            delBtn.textContent="×";thumb.appendChild(delBtn);
            mGrid.appendChild(thumb);
          });
          mediaManage.appendChild(mGrid);
        }
        if(existVideos.length){existVideos.forEach(function(v){
          mediaManage.appendChild(div({display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"},[
            span({color:"#60A5FA",fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},"🎥 "+v.data),
            el("button",{style:{background:"rgba(239,68,68,0.1)",color:"#EF4444",border:"none",padding:"2px 8px",borderRadius:"4px",fontSize:"9px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},
              onclick:(function(mid,did){return function(e){e.stopPropagation();if(confirm("Delete this video link?"))deleteDealMedia(mid,did);};})(v.id,d.id)},
            "Delete")]));
        });}
        mediaManage.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif",marginTop:"4px",marginBottom:"8px"},existPhotos.length+" photo"+(existPhotos.length!==1?"s":"")+", "+existVideos.length+" video"+(existVideos.length!==1?"s":"")));
        var addMoreWrap=div({display:"flex",gap:"6px",alignItems:"center"});
        var addPhotoLabel=el("label",{style:{display:"inline-flex",alignItems:"center",gap:"4px",background:"rgba(96,165,250,0.12)",color:"#60A5FA",border:"1px solid rgba(96,165,250,0.3)",padding:"6px 12px",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
        var addPhotoFileInp=el("input",{type:"file",accept:"image/*",multiple:true,style:{display:"none"}});
        addPhotoFileInp.onchange=(function(did){return async function(){
          var files=Array.from(this.files).slice(0,5);
          var photos=[];
          for(var i=0;i<files.length;i++){try{photos.push(await compressPhoto(files[i],800,0.65));}catch(e){}}
          if(photos.length){await uploadDealMedia(did,photos,"");delete DEAL_STATE.dealMediaCache[did];fetchDealMedia(did).then(function(){render();});}
        };})(d.id);
        addPhotoLabel.appendChild(addPhotoFileInp);addPhotoLabel.appendChild(document.createTextNode("+ Add Photos"));
        addMoreWrap.appendChild(addPhotoLabel);
        var addVidBtn=el("button",{style:{background:"rgba(96,165,250,0.12)",color:"#60A5FA",border:"1px solid rgba(96,165,250,0.3)",padding:"6px 12px",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
          onclick:(function(did){return function(e){e.stopPropagation();var url=prompt("Enter video URL (YouTube / Google Drive):");if(url&&url.trim()){uploadDealMedia(did,[],(url));delete DEAL_STATE.dealMediaCache[did];fetchDealMedia(did).then(function(){render();});}};})(d.id)});
        addVidBtn.textContent="+ Add Video";addMoreWrap.appendChild(addVidBtn);
        mediaManage.appendChild(addMoreWrap);
      }
      card.appendChild(mediaManage);
    }

    if(!isOwner&&DEAL_STATE.sentInquiries[d.id]){
      var sentInq=DEAL_STATE.sentInquiries[d.id];
      var buyerInqStatus="pending";
      if(myInqs){
        var matchedInq=myInqs.find(function(iq){return iq.sender_phone===sentInq.phone;});
        if(matchedInq)buyerInqStatus=matchedInq.status||"pending";
      }
      if(buyerInqStatus==="approved"){
        var mediaAccess=div({background:cl.raised,borderRadius:"8px",padding:"8px 10px",marginTop:"8px",border:"1px solid rgba(16,185,129,0.3)"});
        mediaAccess.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"},[
          span({color:"#10B981",fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em"},"✓ ACCESS GRANTED — PROPERTY MEDIA"),
          el("button",{style:{background:"rgba(16,185,129,0.15)",color:"#10B981",border:"1px solid rgba(16,185,129,0.3)",padding:"4px 10px",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
            onclick:(function(did){return function(e){e.stopPropagation();DEAL_STATE.mediaView=DEAL_STATE.mediaView===("b_"+did)?null:"b_"+did;if(DEAL_STATE.mediaView==="b_"+did)fetchDealMedia(did).then(function(){render();});else render();};})(d.id)},DEAL_STATE.mediaView===("b_"+d.id)?"Close":"View Media")
        ]));
        if(DEAL_STATE.mediaView===("b_"+d.id)){
          var bMedia=DEAL_STATE.dealMediaCache[d.id]||[];
          var bPhotos=bMedia.filter(function(m){return m.media_type==="photo";});
          var bVideos=bMedia.filter(function(m){return m.media_type==="video";});
          if(bPhotos.length){
            var bGrid=div({display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:"6px",marginTop:"8px"});
            bPhotos.forEach(function(m){
              var thumb=div({position:"relative",paddingTop:"75%",borderRadius:"8px",overflow:"hidden",border:"1px solid "+cl.border,cursor:"pointer"});
              thumb.appendChild(el("img",{src:m.data,style:{position:"absolute",top:"0",left:"0",width:"100%",height:"100%",objectFit:"cover"}}));
              thumb.onclick=function(e){e.stopPropagation();window.open(m.data,"_blank");};
              bGrid.appendChild(thumb);
            });
            mediaAccess.appendChild(bGrid);
          }
          if(bVideos.length){bVideos.forEach(function(v){
            mediaAccess.appendChild(div({marginTop:"6px"},[span({color:"#60A5FA",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",textDecoration:"underline"},
              el("a",{href:v.data,target:"_blank",style:{color:"#60A5FA",fontSize:"11px",fontFamily:"'Space Grotesk',monospace"}},"🎥 Watch Video"))]));
          });}
          if(!bPhotos.length&&!bVideos.length){mediaAccess.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",textAlign:"center",padding:"12px"},"No media uploaded yet — check back later"));}
        }
        card.appendChild(mediaAccess);
      }else if(buyerInqStatus==="rejected"){
        card.appendChild(div({background:cl.raised,borderRadius:"8px",padding:"8px 10px",marginTop:"8px",border:"1px solid rgba(239,68,68,0.2)",color:"#EF4444",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"✗ Your request was not approved by the owner"));
      }else{
        card.appendChild(div({background:cl.raised,borderRadius:"8px",padding:"8px 10px",marginTop:"8px",border:"1px solid rgba(245,158,11,0.2)",color:"#F59E0B",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"⏳ Interest sent — waiting for owner approval to access property media"));
      }
    }

    var matches=findMatches(d);
    if(matches.length){
      var mWrap=el("div",{style:{background:cl.raised,borderRadius:"8px",padding:"8px 10px",marginTop:"8px"}});
      mWrap.appendChild(div({color:cl.gold,fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em",marginBottom:"6px"},"◆ "+matches.length+" POTENTIAL MATCH"+(matches.length>1?"ES":"")));
      matches.slice(0,3).forEach(function(m){
        var mRow=div({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0",fontSize:"11px"});
        mRow.appendChild(span({color:cl.subHi,fontFamily:"'Inter',sans-serif"},m.deal.area+(m.deal.building?" · "+m.deal.building:"")+" · AED "+m.deal.price.toLocaleString()));
        mRow.appendChild(span({color:cl.gold,fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},m.score+"%"));
        mWrap.appendChild(mRow);
      });
      card.appendChild(mWrap);
    }
    wrap.appendChild(card);
  });
  if(!DEAL_STATE.deals.length&&!DEAL_STATE.loading){fetchDeals();}
  return wrap;
}

function renderDealForm(wrap,cl){
  var f=DEAL_STATE.form;
  var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px"});
  card.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"14px"},"◆ Post a Deal"));

  var typeToggle=div({display:"flex",gap:"8px",marginBottom:"14px"});
  [{l:"I Have (Listing)",v:"have"},{l:"I Need (Request)",v:"need"}].forEach(function(t){
    var active=f.type===t.v;
    typeToggle.appendChild(el("button",{style:{flex:"1",padding:"10px",borderRadius:"8px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
      background:active?(t.v==="have"?"rgba(0,200,150,0.15)":"rgba(96,165,250,0.15)"):"transparent",
      color:active?(t.v==="have"?cl.green:"#60A5FA"):cl.sub,border:"1px solid "+(active?(t.v==="have"?"rgba(0,200,150,0.3)":"rgba(96,165,250,0.3)"):cl.border)},
      onclick:function(){f.type=t.v;render();}},t.l));
  });
  card.appendChild(typeToggle);

  function makeInput(label,key,placeholder,type){
    var g=div({marginBottom:"10px"});
    g.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",marginBottom:"4px"},label));
    var inp=el("input",{type:type||"text",placeholder:placeholder||"",value:f[key]||"",
      style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"10px",borderRadius:"8px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
    inp.oninput=function(){f[key]=this.value;};
    g.appendChild(inp);return g;
  }
  function makeSelect(label,key,options){
    var g=div({marginBottom:"10px"});
    g.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",marginBottom:"4px"},label));
    var sel=el("select",{style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"10px",borderRadius:"8px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
    options.forEach(function(o){var opt=el("option",{value:o.v||o});opt.textContent=o.l||o;if(f[key]===(o.v||o))opt.selected=true;sel.appendChild(opt);});
    sel.onchange=function(){f[key]=this.value;render();};
    g.appendChild(sel);return g;
  }

  card.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",marginTop:"4px"},"Agent Info"));
  var agentRow=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
  agentRow.appendChild(makeInput("Name *","agentName","Your name"));
  agentRow.appendChild(makeInput("WhatsApp *","agentPhone","+971 5X XXX XXXX","tel"));
  card.appendChild(agentRow);
  var agentRow2=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
  agentRow2.appendChild(makeInput("Company","agentCompany","Agency name"));
  agentRow2.appendChild(makeInput("Email","agentEmail","agent@email.com","email"));
  card.appendChild(agentRow2);
  var reraRow=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",alignItems:"end"});
  var reraInp=makeInput("RERA BRN *","reraNumber","e.g. 12345");
  reraRow.appendChild(reraInp);
  var reraInfo=div({marginBottom:"10px",display:"flex",alignItems:"center",gap:"6px",height:"40px"});
  if(f.reraNumber&&f.reraNumber.length>=3){reraInfo.appendChild(span({color:"#3B82F6",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",background:"rgba(59,130,246,0.12)",padding:"4px 10px",borderRadius:"8px",fontWeight:"700"},"✓ Verified Badge Active"));}
  else{reraInfo.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",fontStyle:"italic"},"Add RERA BRN for Verified badge"));}
  reraRow.appendChild(reraInfo);
  card.appendChild(reraRow);

  var waSection=div({background:cl.raised,border:"1px solid "+cl.border,borderRadius:"10px",padding:"12px",marginBottom:"14px"});
  waSection.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"},[
    div({},[span({color:"#25D366",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"WhatsApp Parser"),
      span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginLeft:"8px"},"Paste text → auto-fill form")])
  ]));
  var waTextarea=el("textarea",{placeholder:"Paste WhatsApp listing text here…\n\ne.g. \"2BR in Marina Gate 1, 1200 sqft, high floor, sea view, asking 3.2M\"",rows:"3",
    style:{width:"100%",background:cl.surface,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",resize:"vertical"}});
  waTextarea.value=DEAL_STATE.waParser.text||"";
  waTextarea.oninput=function(){DEAL_STATE.waParser.text=this.value;};
  waSection.appendChild(waTextarea);
  var waActions=div({display:"flex",gap:"8px",marginTop:"8px",alignItems:"center"});
  var waParseBtn=el("button",{style:{background:"linear-gradient(135deg,#25D366,#128C7E)",color:"#fff",border:"none",padding:"8px 16px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",opacity:DEAL_STATE.waParser.parsing?"0.5":"1"},
    onclick:async function(){
      var txt=DEAL_STATE.waParser.text.trim();if(!txt||DEAL_STATE.waParser.parsing)return;
      DEAL_STATE.waParser.parsing=true;render();
      try{
        var sys="You are a Dubai real estate listing parser. Extract structured data from informal WhatsApp text. Return ONLY valid JSON, no markdown, no explanation. Schema: {\"area\":\"string\",\"building\":\"string or null\",\"prop_type\":\"apartment|villa|townhouse|penthouse|land|office\",\"beds\":\"Studio|1 BR|2 BR|3 BR|4 BR|5 BR|5+ BR or null\",\"size_sqft\":number or null,\"floor\":\"string or null\",\"view\":\"Sea|Marina|Skyline|Garden|Park|Pool|Canal|Golf|Community|Landmark|Open|Road or null\",\"furnished\":\"Unfurnished|Furnished|Semi-Furnished\",\"purpose\":\"sale|rent\",\"price\":number (AED, no commas),\"urgency\":\"normal|urgent|hot\",\"notes\":\"any extra details not captured above\"}. If M means million (e.g. 3.2M = 3200000). If K means thousand. Default purpose=sale unless rent/rental/yearly/monthly mentioned. Default urgency=normal unless urgent/asap/hot/motivated mentioned.";
        var reply=await askAI([{role:"user",content:"Parse this listing:\n"+txt}],sys);
        var cleaned=reply.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();
        var parsed=JSON.parse(cleaned);
        DEAL_STATE.waParser.parsed=parsed;
        if(parsed.area)f.area=parsed.area;
        if(parsed.building)f.building=parsed.building;
        if(parsed.prop_type)f.propType=parsed.prop_type;
        if(parsed.beds)f.beds=parsed.beds;
        if(parsed.size_sqft)f.sizeSqft=String(parsed.size_sqft);
        if(parsed.floor)f.floor=parsed.floor;
        if(parsed.view)f.view=parsed.view;
        if(parsed.furnished)f.furnished=parsed.furnished;
        if(parsed.purpose)f.purpose=parsed.purpose;
        if(parsed.price)f.price=String(parsed.price);
        if(parsed.urgency)f.urgency=parsed.urgency;
        if(parsed.notes)f.notes=parsed.notes;
      }catch(e){alert("Could not parse text: "+e.message);}
      DEAL_STATE.waParser.parsing=false;render();
    }});
  waParseBtn.textContent=DEAL_STATE.waParser.parsing?"Parsing…":"Parse & Auto-Fill";
  waActions.appendChild(waParseBtn);
  if(DEAL_STATE.waParser.parsed){waActions.appendChild(span({color:cl.green,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"✓ Parsed — fields auto-filled"));}
  waSection.appendChild(waActions);
  card.appendChild(waSection);

  card.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",marginTop:"8px"},"Property Details"));

  var propRow1=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
  var areaInp=makeInput("Area *","area","e.g. Dubai Marina");
  var areaInput=areaInp.querySelector("input");
  if(areaInput){
    var dlId="dl-deal-areas";
    var dl=el("datalist",{id:dlId});
    Object.keys(AREAS).sort().forEach(function(a){dl.appendChild(el("option",{value:a}));});
    areaInp.appendChild(dl);
    areaInput.setAttribute("list",dlId);
  }
  propRow1.appendChild(areaInp);
  propRow1.appendChild(makeInput("Building","building","e.g. Marina Gate 1"));
  card.appendChild(propRow1);

  var propRow2=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"});
  propRow2.appendChild(makeSelect("Type","propType",["apartment","villa","townhouse","penthouse","land","office"]));
  propRow2.appendChild(makeSelect("Beds","beds",["Studio","1 BR","2 BR","3 BR","4 BR","5 BR","5+ BR"]));
  propRow2.appendChild(makeInput("Size (sqft)","sizeSqft","1200","number"));
  card.appendChild(propRow2);

  var propRow3=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"});
  propRow3.appendChild(makeInput("Floor","floor","e.g. 25"));
  propRow3.appendChild(makeSelect("View","view",["Not specified","Sea","Marina","Skyline","Garden","Park","Pool","Canal","Golf","Community","Landmark","Open","Road"]));
  propRow3.appendChild(makeSelect("Furnished","furnished",["Unfurnished","Furnished","Semi-Furnished"]));
  card.appendChild(propRow3);

  card.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",marginTop:"8px"},"Pricing & Priority"));
  var priceRow=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
  priceRow.appendChild(makeSelect("Purpose","purpose",[{l:"For Sale",v:"sale"},{l:"For Rent",v:"rent"}]));
  priceRow.appendChild(makeInput(f.type==="have"?"Asking Price (AED) *":"Budget (AED) *","price","e.g. 2,500,000"));
  card.appendChild(priceRow);

  var urgRow=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"});
  urgRow.appendChild(makeSelect("Priority","urgency",[{l:"Normal",v:"normal"},{l:"⚡ Urgent",v:"urgent"},{l:"🔥 Hot Deal",v:"hot"}]));
  var omToggle=div({marginBottom:"10px"});
  omToggle.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",marginBottom:"4px"},"Off-Market"));
  var omBtn=el("button",{style:{width:"100%",padding:"10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
    background:f.offMarket?"rgba(201,168,76,0.15)":"transparent",color:f.offMarket?cl.gold:cl.sub,border:"1px solid "+(f.offMarket?cl.goldDim:cl.border)},
    onclick:function(){f.offMarket=!f.offMarket;render();}});
  omBtn.textContent=f.offMarket?"Off-Market ✓":"Not Listed Online";
  omToggle.appendChild(omBtn);
  urgRow.appendChild(omToggle);
  card.appendChild(urgRow);

  card.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",marginTop:"4px"},"Contact Method"));
  var cmRow=div({display:"flex",gap:"8px",marginBottom:"14px"});
  [{l:"WhatsApp Direct",v:"whatsapp",ic:"#25D366",desc:"Buyers see your number"},{l:"Private (Anonymous)",v:"private",ic:"#8B5CF6",desc:"Buyers send interest — you decide who to contact"}].forEach(function(cm){
    var active=f.contactMode===cm.v;
    var cmBtn=el("button",{style:{flex:"1",padding:"10px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",textAlign:"center",
      background:active?"rgba("+(cm.v==="whatsapp"?"37,211,102":"139,92,246")+",0.12)":"transparent",
      color:active?cm.ic:cl.sub,border:"1px solid "+(active?cm.ic+"66":cl.border)},
      onclick:function(){f.contactMode=cm.v;render();}});
    cmBtn.appendChild(div({fontWeight:"700",marginBottom:"2px"},cm.l));
    cmBtn.appendChild(div({fontSize:"9px",opacity:"0.7",fontFamily:"'Inter',sans-serif"},cm.desc));
    cmRow.appendChild(cmBtn);
  });
  card.appendChild(cmRow);

  if(f.type==="have"){
    var mediaSection=div({background:cl.raised,border:"1px solid rgba(96,165,250,0.25)",borderRadius:"10px",padding:"12px",marginBottom:"14px"});
    mediaSection.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"},[
      div({},[span({color:"#60A5FA",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"Property Media"),
        span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginLeft:"8px"},"Photos & Video — shared only with approved buyers")])
    ]));
    var photoGrid=div({display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:"8px",marginBottom:"10px"});
    DEAL_STATE.mediaPhotos.forEach(function(p,idx){
      var thumb=div({position:"relative",paddingTop:"100%",borderRadius:"8px",overflow:"hidden",border:"1px solid "+cl.border});
      var img=el("img",{src:p,style:{position:"absolute",top:"0",left:"0",width:"100%",height:"100%",objectFit:"cover"}});
      thumb.appendChild(img);
      var removeBtn=el("button",{style:{position:"absolute",top:"4px",right:"4px",background:"rgba(239,68,68,0.9)",color:"#fff",border:"none",borderRadius:"50%",width:"20px",height:"20px",fontSize:"12px",cursor:"pointer",lineHeight:"18px",textAlign:"center"},
        onclick:(function(i){return function(e){e.stopPropagation();DEAL_STATE.mediaPhotos.splice(i,1);render();};})(idx)});
      removeBtn.textContent="×";
      thumb.appendChild(removeBtn);
      photoGrid.appendChild(thumb);
    });
    if(DEAL_STATE.mediaPhotos.length<10){
      var addPhotoBtn=div({paddingTop:"100%",position:"relative",borderRadius:"8px",border:"2px dashed "+cl.border,cursor:"pointer",transition:"border-color 0.2s"});
      var addLabel=el("label",{style:{position:"absolute",top:"0",left:"0",width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer"}});
      var addFileInput=el("input",{type:"file",accept:"image/*",multiple:true,style:{display:"none"}});
      addFileInput.onchange=async function(){
        var files=Array.from(this.files);
        var remaining=10-DEAL_STATE.mediaPhotos.length;
        files=files.slice(0,remaining);
        DEAL_STATE.mediaUploading=true;render();
        for(var i=0;i<files.length;i++){
          try{var compressed=await compressPhoto(files[i],800,0.65);DEAL_STATE.mediaPhotos.push(compressed);}catch(e){}
        }
        DEAL_STATE.mediaUploading=false;render();
      };
      addLabel.appendChild(addFileInput);
      addLabel.appendChild(span({color:cl.sub,fontSize:"24px"},"＋"));
      addLabel.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginTop:"4px"},"Add Photo"));
      addPhotoBtn.appendChild(addLabel);
      photoGrid.appendChild(addPhotoBtn);
    }
    mediaSection.appendChild(photoGrid);
    if(DEAL_STATE.mediaUploading){mediaSection.appendChild(div({color:"#60A5FA",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",textAlign:"center",marginBottom:"8px"},"Compressing photos…"));}
    mediaSection.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif",marginBottom:"10px"},"Max 10 photos · Auto-compressed · Buyers see these only after you approve their request"));
    var vidG=div({marginBottom:"4px"});
    vidG.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",marginBottom:"4px"},"Video Link (YouTube / Google Drive)"));
    var vidInp=el("input",{type:"url",placeholder:"https://youtube.com/watch?v=… or Google Drive link",value:DEAL_STATE.videoUrl||"",
      style:{width:"100%",background:cl.surface,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"10px",borderRadius:"8px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
    vidInp.oninput=function(){DEAL_STATE.videoUrl=this.value;};
    vidG.appendChild(vidInp);
    mediaSection.appendChild(vidG);
    card.appendChild(mediaSection);

    var tdSection=div({background:cl.raised,border:"1px solid rgba(234,179,8,0.25)",borderRadius:"10px",padding:"12px",marginBottom:"14px"});
    tdSection.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"},[
      div({},[span({color:"#EAB308",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"Title Deed Verification"),
        span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginLeft:"8px"},"Required for listings")])
    ]));
    var tdRow=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"});
    tdRow.appendChild(makeInput("Title Deed Number *","titleDeedNo","e.g. 123-456-7890"));
    var tdUploadG=div({marginBottom:"10px"});
    tdUploadG.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",marginBottom:"4px"},"Upload Title Deed Photo"));
    var tdFileWrap=div({display:"flex",alignItems:"center",gap:"8px"});
    var tdFileBtn=el("label",{style:{display:"inline-flex",alignItems:"center",gap:"6px",background:cl.surface,border:"1px solid "+cl.border,color:cl.subHi,padding:"9px 14px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",transition:"border-color 0.2s"}});
    var tdFileInput=el("input",{type:"file",accept:"image/*,.pdf",style:{display:"none"}});
    tdFileInput.onchange=function(){
      var file=this.files[0];if(!file)return;
      if(file.size>5*1024*1024){alert("File too large — max 5MB");return;}
      var reader=new FileReader();
      reader.onload=function(e){f.titleDeedImg=e.target.result;render();};
      reader.readAsDataURL(file);
    };
    tdFileBtn.appendChild(tdFileInput);
    tdFileBtn.appendChild(document.createTextNode(f.titleDeedImg?"Change File":"Choose File"));
    tdFileWrap.appendChild(tdFileBtn);
    if(f.titleDeedImg){
      tdFileWrap.appendChild(span({color:cl.green,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"✓ Uploaded"));
      var tdRemoveBtn=el("button",{style:{background:"transparent",border:"1px solid rgba(239,68,68,0.3)",color:"#EF4444",padding:"4px 10px",borderRadius:"6px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
        onclick:function(){f.titleDeedImg=null;render();}});
      tdRemoveBtn.textContent="Remove";
      tdFileWrap.appendChild(tdRemoveBtn);
    }
    tdUploadG.appendChild(tdFileWrap);
    tdRow.appendChild(tdUploadG);
    tdSection.appendChild(tdRow);
    if(f.titleDeedNo&&f.titleDeedNo.length>=3){
      tdSection.appendChild(div({display:"flex",alignItems:"center",gap:"6px"},[
        span({color:"#EAB308",fontSize:"18px"},"📜"),
        span({color:"#EAB308",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",fontWeight:"700",background:"rgba(234,179,8,0.12)",padding:"4px 10px",borderRadius:"8px"},"Title Deed #"+f.titleDeedNo+(f.titleDeedImg?" · Document Attached":""))]));
    }else{
      tdSection.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",fontStyle:"italic"},"Enter your Title Deed number to verify ownership and build buyer trust"));
    }
    card.appendChild(tdSection);
  }

  if(f.type==="need"){
    var refSection=div({background:cl.raised,border:"1px solid rgba(201,168,76,0.25)",borderRadius:"10px",padding:"12px",marginBottom:"14px"});
    var refToggle=div({display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"});
    refToggle.onclick=function(){f.requestReferral=!f.requestReferral;render();};
    var refLeft=div({});
    refLeft.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"DubAIVal Agent Matching"));
    refLeft.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},"We'll match you with a verified Gold agent for your search"));
    refToggle.appendChild(refLeft);
    var refSwitch=div({width:"44px",height:"24px",borderRadius:"12px",position:"relative",cursor:"pointer",transition:"background 0.3s",
      background:f.requestReferral?"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")":"rgba(255,255,255,0.1)"});
    var refKnob=div({width:"20px",height:"20px",borderRadius:"50%",background:"#fff",position:"absolute",top:"2px",transition:"left 0.3s",
      left:f.requestReferral?"22px":"2px",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"});
    refSwitch.appendChild(refKnob);
    refToggle.appendChild(refSwitch);
    refSection.appendChild(refToggle);
    if(f.requestReferral){
      refSection.appendChild(div({marginTop:"10px",padding:"8px",background:cl.surface,borderRadius:"8px",border:"1px solid rgba(201,168,76,0.15)"},[
        div({color:cl.gold,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6"},[
          div({marginBottom:"4px",fontWeight:"700"},"How it works:"),
          div({},"1. Post your request — we receive it instantly"),
          div({},"2. DubAIVal selects a verified Gold agent specializing in your area"),
          div({},"3. Agent connects you with matching properties & sellers"),
          div({color:cl.sub,fontSize:"10px",marginTop:"6px",fontStyle:"italic"},"DubAIVal referral fee: 2% of final transaction value — paid by agent, not by you")
        ])
      ]));
    }
    card.appendChild(refSection);
  }

  var notesG=div({marginBottom:"14px"});
  notesG.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",marginBottom:"4px"},"Notes"));
  var notesInp=el("textarea",{placeholder:"Additional details, special conditions, commission split…",rows:"3",
    style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"10px",borderRadius:"8px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",resize:"vertical"}});
  notesInp.value=f.notes||"";notesInp.oninput=function(){f.notes=this.value;};
  notesG.appendChild(notesInp);
  card.appendChild(notesG);

  var submitBtn=el("button",{style:{width:"100%",padding:"14px",background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:"#070B14",border:"none",borderRadius:"10px",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
    onclick:function(){postDeal();}});
  submitBtn.textContent=DEAL_STATE.posting?"Posting…":(f.type==="have"?"Post Listing + Auto-Valuation":"Post Request");
  if(DEAL_STATE.posting)submitBtn.style.opacity="0.5";
  card.appendChild(submitBtn);

  if(f.type==="have"){
    card.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",textAlign:"center",marginTop:"8px",lineHeight:"1.5"},"Your listing will be auto-valued by DubAIVal AVM engine — buyers see Fair/Good/Over verdict instantly"));
  }

  wrap.appendChild(card);
  return wrap;
}

function renderAgentHub(wrap,cl){
  var hub=DEAL_STATE.agentHub;
  var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px"});
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
    function regInput(label,key,placeholder,type){
      var g=div({marginBottom:"10px"});
      g.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",marginBottom:"4px"},label));
      var inp=el("input",{type:type||"text",placeholder:placeholder||"",value:rf[key]||"",
        style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"10px",borderRadius:"8px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
      inp.oninput=function(){rf[key]=this.value;};
      g.appendChild(inp);return g;
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
      style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"10px",borderRadius:"8px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",resize:"vertical"}});
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
    if(hub.loading){card.appendChild(div({textAlign:"center",padding:"20px",color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},"Loading agents…"));}
    else if(!hub.agents.length){
      card.appendChild(div({textAlign:"center",padding:"20px"},[
        div({fontSize:"28px",marginBottom:"8px"},"🏢"),
        div({color:cl.subHi,fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif",marginBottom:"4px"},"No agents registered yet"),
        div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"Be the first to join the DubAIVal referral network")]));
    }else{
      var sortedAgents=hub.agents.slice().sort(function(a,b){
        var aTier=(a.subscription==="gold"||a.subscription==="platinum")?1:0;
        var bTier=(b.subscription==="gold"||b.subscription==="platinum")?1:0;
        var aRera=a.rera_number?1:0;var bRera=b.rera_number?1:0;
        var scoreA=aTier*2+aRera;var scoreB=bTier*2+bRera;
        return scoreB-scoreA;
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
        agLeft.appendChild(agInfo);
        agTop.appendChild(agLeft);
        if(ag.rera_number)agTop.appendChild(span({color:"#3B82F6",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",background:hexAlpha("#3B82F6",0.12),padding:"3px 8px",borderRadius:"6px",fontWeight:"700"},"RERA: "+ag.rera_number));
        agCard.appendChild(agTop);
        if(ag.areas_text)agCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"4px"},"Areas: "+ag.areas_text));
        if(ag.specialties)agCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},"Specialties: "+ag.specialties));
        if(!ag.rera_number)agCard.appendChild(div({background:hexAlpha("#F59E0B",0.08),border:"1px solid "+hexAlpha("#F59E0B",0.25),borderRadius:"6px",padding:"5px 10px",marginTop:"6px",display:"flex",alignItems:"center",gap:"4px"},[
          span({color:"#F59E0B",fontSize:"9px"},"⚠"),
          span({color:"#F59E0B",fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Add RERA number to get verified badge")
        ]));
        if(ag.deals_closed>0||ag.video_analyses>0){
          var agStats=div({display:"flex",gap:"12px",marginTop:"6px"});
          if(ag.deals_closed>0)agStats.appendChild(span({color:cl.green,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},ag.deals_closed+" deals closed"));
          if(ag.video_analyses>0)agStats.appendChild(span({color:"#60A5FA",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},ag.video_analyses+" video analyses"));
          agCard.appendChild(agStats);
        }
        card.appendChild(agCard);
      });
    }
  }
  wrap.appendChild(card);return wrap;
}

function renderAdminDashboard(wrap,cl){
  var hub=DEAL_STATE.agentHub;
  var card=div({background:cl.surface,border:"1px solid rgba(239,68,68,0.2)",borderRadius:"14px",padding:"18px",marginBottom:"14px"});
  card.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},[
    div({},[span({color:"#EF4444",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block"},"◆ Admin Dashboard"),
      span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"Referral Management · Agent Control")]),
    el("button",{style:{background:"rgba(239,68,68,0.1)",color:"#EF4444",border:"1px solid rgba(239,68,68,0.2)",padding:"6px 12px",borderRadius:"6px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},
      onclick:function(){DEAL_STATE.adminToken=null;try{localStorage.removeItem("dv_admin_token");}catch(e){}DEAL_STATE.mode="browse";render();}},"Logout")
  ]));

  var stats=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"8px",marginBottom:"14px"});
  var totalAgents=hub.agents.length;
  var goldAgents=hub.agents.filter(function(a){return a.subscription==="gold"||a.subscription==="platinum";}).length;
  var pendingRefs=hub.referrals.filter(function(r){return r.status==="pending";}).length;
  var closedRefs=hub.referrals.filter(function(r){return r.status==="closed";}).length;
  var totalCommission=hub.referrals.reduce(function(sum,r){return sum+(r.commission_earned||0);},0);
  [{l:"Total Agents",v:totalAgents,c:cl.subHi},{l:"Gold/Platinum",v:goldAgents,c:"#EAB308"},{l:"Pending Referrals",v:pendingRefs,c:"#F59E0B"},{l:"Closed Deals",v:closedRefs,c:cl.green}].forEach(function(s){
    stats.appendChild(div({background:cl.raised,borderRadius:"8px",padding:"8px",textAlign:"center"},[
      div({color:s.c,fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},String(s.v)),
      div({color:cl.sub,fontSize:"8px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},s.l)]));
  });
  card.appendChild(stats);
  if(totalCommission>0){
    card.appendChild(div({background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:"10px",padding:"10px",textAlign:"center",marginBottom:"14px"},[
      div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"TOTAL REFERRAL COMMISSION EARNED"),
      div({color:cl.green,fontSize:"22px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+totalCommission.toLocaleString())]));
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
          onclick:(function(rid,sel){return function(){var aid=sel.value;if(!aid){alert("Please select an agent");return;}assignReferral(rid,parseInt(aid));};})(ref.id,agentSelect)});
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
      if(ref.deal_value)refInfo.appendChild(div({color:cl.green,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Deal: AED "+ref.deal_value.toLocaleString()+(ref.commission_earned?" · Commission: AED "+ref.commission_earned.toLocaleString():"")));
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

function timeAgo(dateStr){
  if(!dateStr)return"—";
  var d=new Date(dateStr);if(isNaN(d.getTime()))return"—";var now=new Date();var diff=Math.floor((now-d)/1000);
  if(diff<60)return"just now";if(diff<3600)return Math.floor(diff/60)+"m ago";
  if(diff<86400)return Math.floor(diff/3600)+"h ago";if(diff<604800)return Math.floor(diff/86400)+"d ago";
  return d.toLocaleDateString("en-GB",{day:"numeric",month:"short"});
}

