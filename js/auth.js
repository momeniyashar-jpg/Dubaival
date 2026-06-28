// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- AUTH MODULE ---
var DV_AUTH={user:null,profile:null,loading:true,showModal:false,modalTab:"signin",error:"",busy:false};

function sbHeaders(token){
  var h={"apikey":SUPABASE_KEY,"Content-Type":"application/json"};
  if(token)h["Authorization"]="Bearer "+token;
  return h;
}

async function sbAuth(endpoint,body){
  var resp=await fetch(SUPABASE_URL+"/auth/v1/"+endpoint,{method:"POST",headers:sbHeaders(),body:JSON.stringify(body)});
  var data=await resp.json();
  if(!resp.ok)throw new Error(data.error_description||data.msg||data.message||"Auth error");
  return data;
}

async function dvSignUp(name,email,password){
  DV_AUTH.busy=true;DV_AUTH.error="";render();
  try{
    var data=await sbAuth("signup",{email:email,password:password,data:{display_name:name}});
    if(data.access_token){
      await setAuthSession(data);
      await fetch(SUPABASE_URL+"/rest/v1/user_profiles",{method:"POST",headers:Object.assign({},sbHeaders(data.access_token),{"Prefer":"return=minimal"}),body:JSON.stringify({id:data.user.id,display_name:name,email:email,role:"user",preferred_lang:dvLang})});
    }
    DV_AUTH.showModal=false;
  }catch(e){DV_AUTH.error=e.message;}
  DV_AUTH.busy=false;render();
}

async function dvSignIn(email,password){
  DV_AUTH.busy=true;DV_AUTH.error="";render();
  try{
    var data=await sbAuth("token?grant_type=password",{email:email,password:password});
    await setAuthSession(data);
    DV_AUTH.showModal=false;
    await syncPortfolioFromCloud();
  }catch(e){DV_AUTH.error=e.message;}
  DV_AUTH.busy=false;render();
}

async function dvSignOut(){
  var token=localStorage.getItem("dv_access_token");
  if(token)try{await fetch(SUPABASE_URL+"/auth/v1/logout",{method:"POST",headers:sbHeaders(token)});}catch(e){}
  localStorage.removeItem("dv_access_token");localStorage.removeItem("dv_refresh_token");localStorage.removeItem("dv_user");
  DV_AUTH.user=null;DV_AUTH.profile=null;render();
}

async function setAuthSession(data){
  localStorage.setItem("dv_access_token",data.access_token);
  localStorage.setItem("dv_refresh_token",data.refresh_token);
  localStorage.setItem("dv_user",JSON.stringify(data.user));
  DV_AUTH.user=data.user;
  DV_AUTH.profile={display_name:data.user.user_metadata&&data.user.user_metadata.display_name||data.user.email};
}

async function dvRefreshToken(){
  var rt=localStorage.getItem("dv_refresh_token");
  if(!rt)return null;
  try{
    var data=await sbAuth("token?grant_type=refresh_token",{refresh_token:rt});
    await setAuthSession(data);
    return data.access_token;
  }catch(e){
    localStorage.removeItem("dv_access_token");localStorage.removeItem("dv_refresh_token");localStorage.removeItem("dv_user");
    DV_AUTH.user=null;DV_AUTH.profile=null;
    return null;
  }
}

async function getValidToken(){
  var token=localStorage.getItem("dv_access_token");
  if(!token)return null;
  try{
    var payload=JSON.parse(atob(token.split(".")[1]));
    if(payload.exp*1000<Date.now()+60000)return await dvRefreshToken();
    return token;
  }catch(e){return await dvRefreshToken();}
}

// --- CLOUD SYNC ---
async function syncPortfolioToCloud(){
  if(!DV_AUTH.user)return;
  var token=await getValidToken();if(!token)return;
  var assets=[];var goals={};
  try{assets=JSON.parse(localStorage.getItem("dubaival_portfolio"))||[];}catch(e){}
  try{goals=JSON.parse(localStorage.getItem("dubaival_portfolio_goals"))||{};}catch(e){}
  var body={user_id:DV_AUTH.user.id,portfolio_data:assets,goals_data:goals,updated_at:new Date().toISOString()};
  await fetch(SUPABASE_URL+"/rest/v1/user_portfolios?user_id=eq."+DV_AUTH.user.id,{method:"GET",headers:sbHeaders(token)}).then(function(r){return r.json();}).then(async function(rows){
    if(rows.length>0){
      await fetch(SUPABASE_URL+"/rest/v1/user_portfolios?user_id=eq."+DV_AUTH.user.id,{method:"PATCH",headers:Object.assign({},sbHeaders(token),{"Prefer":"return=minimal"}),body:JSON.stringify({portfolio_data:assets,goals_data:goals,updated_at:new Date().toISOString()})});
    }else{
      await fetch(SUPABASE_URL+"/rest/v1/user_portfolios",{method:"POST",headers:Object.assign({},sbHeaders(token),{"Prefer":"return=minimal"}),body:JSON.stringify(body)});
    }
  });
}

async function syncPortfolioFromCloud(){
  if(!DV_AUTH.user)return;
  var token=await getValidToken();if(!token)return;
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/user_portfolios?user_id=eq."+DV_AUTH.user.id+"&limit=1",{headers:sbHeaders(token)});
    var rows=await resp.json();
    if(!rows||!rows.length)return syncPortfolioToCloud();
    var cloud=rows[0];
    var localUpdated=localStorage.getItem("dv_portfolio_updated")||"";
    var cloudUpdated=cloud.updated_at||"";
    if(cloudUpdated>localUpdated){
      localStorage.setItem("dubaival_portfolio",JSON.stringify(cloud.portfolio_data||[]));
      localStorage.setItem("dubaival_portfolio_goals",JSON.stringify(cloud.goals_data||{}));
      localStorage.setItem("dv_portfolio_updated",cloudUpdated);
      if(window.PORTFOLIO_STATE){
        window.PORTFOLIO_STATE.assets=cloud.portfolio_data||[];
        window.PORTFOLIO_STATE.goals=cloud.goals_data||{risk:"Moderate",horizon:"3-5 years",target:"Capital Growth"};
      }
    }else{
      await syncPortfolioToCloud();
      localStorage.setItem("dv_portfolio_updated",new Date().toISOString());
    }
  }catch(e){}
}

function portfolioChanged(){
  localStorage.setItem("dv_portfolio_updated",new Date().toISOString());
  if(DV_AUTH.user)syncPortfolioToCloud();
}

// --- INIT ---
(function(){
  DV_AUTH.loading=true;
  try{
    var u=localStorage.getItem("dv_user");
    if(u){
      DV_AUTH.user=JSON.parse(u);
      DV_AUTH.profile={display_name:(DV_AUTH.user.user_metadata&&DV_AUTH.user.user_metadata.display_name)||DV_AUTH.user.email};
      getValidToken().then(function(t){
        if(!t){DV_AUTH.user=null;DV_AUTH.profile=null;}
        DV_AUTH.loading=false;
        if(typeof render==="function")render();
      });
    }else{DV_AUTH.loading=false;}
  }catch(e){DV_AUTH.loading=false;}
})();

// --- AUTH MODAL ---
function renderAuthModal(){
  if(!DV_AUTH.showModal)return null;
  var cl=C();
  var overlay=el("div",{style:{position:"fixed",top:"0",left:"0",right:"0",bottom:"0",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",zIndex:"9999",display:"flex",alignItems:"center",justifyContent:"center"}});
  overlay.addEventListener("click",function(e){if(e.target===overlay){DV_AUTH.showModal=false;DV_AUTH.error="";render();}});

  var modal=el("div",{style:{background:"rgba(13,18,32,0.85)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"20px",padding:"28px 24px",width:"90%",maxWidth:"380px",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",boxShadow:"0 24px 80px rgba(0,0,0,0.6),0 0 40px rgba(212,175,55,0.04)"}});
  modal.addEventListener("click",function(e){e.stopPropagation();});

  modal.appendChild(div({textAlign:"center",marginBottom:"20px"},[
    div({fontSize:"24px",marginBottom:"6px"},""),
    div({color:cl.white,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},DV_AUTH.modalTab==="signin"?t("auth_signin"):t("auth_signup")),
    div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginTop:"4px"},t("auth_cloud_sync"))
  ]));

  // Tabs
  var tabs=el("div",{style:{display:"flex",gap:"4px",marginBottom:"20px",background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"3px"}});
  ["signin","signup"].forEach(function(tabId){
    var active=DV_AUTH.modalTab===tabId;
    var tb=el("button",{style:{flex:"1",padding:"8px",borderRadius:"8px",border:active?"1px solid rgba(212,175,55,0.15)":"1px solid transparent",background:active?"rgba(212,175,55,0.10)":"transparent",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",color:active?"#D4A843":cl.sub,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",transition:"all 0.2s"}});
    tb.textContent=tabId==="signin"?t("auth_signin"):t("auth_signup");
    tb.addEventListener("click",function(){DV_AUTH.modalTab=tabId;DV_AUTH.error="";render();});
    tabs.appendChild(tb);
  });
  modal.appendChild(tabs);

  // Form fields
  var nameInp,emailInp,passInp;

  if(DV_AUTH.modalTab==="signup"){
    nameInp=el("input",{type:"text",placeholder:t("auth_name"),style:{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:cl.white,padding:"12px 14px",borderRadius:"10px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"10px"}});
    modal.appendChild(nameInp);
  }

  emailInp=el("input",{type:"email",placeholder:t("auth_email"),style:{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:cl.white,padding:"12px 14px",borderRadius:"10px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"10px"}});
  modal.appendChild(emailInp);

  passInp=el("input",{type:"password",placeholder:t("auth_password"),style:{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:cl.white,padding:"12px 14px",borderRadius:"10px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"16px"}});
  passInp.addEventListener("keydown",function(e){if(e.key==="Enter")doSubmit();});
  modal.appendChild(passInp);

  if(DV_AUTH.error){
    modal.appendChild(div({background:hexAlpha("#EF4444",0.1),border:"1px solid "+hexAlpha("#EF4444",0.3),borderRadius:"8px",padding:"8px 12px",marginBottom:"12px",color:"#EF4444",fontSize:"11px",fontFamily:"'Inter',sans-serif"},DV_AUTH.error));
  }

  function doSubmit(){
    var email=emailInp.value.trim();
    var pass=passInp.value;
    if(!email||!pass){DV_AUTH.error=t("auth_fill_fields");render();return;}
    if(DV_AUTH.modalTab==="signup"){
      var name=(nameInp&&nameInp.value.trim())||"";
      if(!name){DV_AUTH.error=t("auth_fill_fields");render();return;}
      dvSignUp(name,email,pass);
    }else{dvSignIn(email,pass);}
  }

  var submitBtn=el("button",{style:{width:"100%",padding:"12px",borderRadius:"999px",border:DV_AUTH.busy?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(212,175,55,0.15)",background:DV_AUTH.busy?"rgba(75,85,99,0.3)":"rgba(212,175,55,0.10)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",color:DV_AUTH.busy?"#9CA3AF":"#D4A843",fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:DV_AUTH.busy?"not-allowed":"pointer",marginBottom:"12px",boxShadow:"0 2px 12px rgba(0,0,0,0.2)"}});
  submitBtn.textContent=DV_AUTH.busy?"...":(DV_AUTH.modalTab==="signin"?t("auth_signin"):t("auth_create_account"));
  if(!DV_AUTH.busy)submitBtn.addEventListener("click",doSubmit);
  modal.appendChild(submitBtn);

  modal.appendChild(div({textAlign:"center",color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},t("auth_disclaimer")));

  overlay.appendChild(modal);
  return overlay;
}

function renderAuthButton(){
  var cl=C();
  if(DV_AUTH.user&&DV_AUTH.profile){
    var wrap=el("div",{style:{display:"flex",alignItems:"center",gap:"6px"}});
    var name=DV_AUTH.profile.display_name||DV_AUTH.user.email||"User";
    if(name.length>12)name=name.substring(0,12)+"…";
    var userBtn=el("button",{style:{background:"rgba(16,185,129,0.08)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid rgba(16,185,129,0.18)",borderRadius:"999px",padding:"5px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:"5px",color:"#10B981",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",boxShadow:"0 2px 12px rgba(0,0,0,0.2)"}});
    userBtn.innerHTML="<i data-lucide='user' style='width:12px;height:12px;stroke-width:2'></i> "+name;
    userBtn.addEventListener("click",function(){DV_AUTH.showModal=false;render();});
    wrap.appendChild(userBtn);
    var outBtn=el("button",{style:{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.10)",borderRadius:"999px",padding:"4px 10px",cursor:"pointer",color:cl.sub,fontSize:"9px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace"}});
    outBtn.textContent=t("auth_signout");
    outBtn.addEventListener("click",function(){dvSignOut();});
    wrap.appendChild(outBtn);
    return wrap;
  }
  var signinBtn=el("button",{style:{background:"rgba(99,102,241,0.10)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid rgba(99,102,241,0.18)",borderRadius:"999px",padding:"5px 14px",cursor:"pointer",color:"#818CF8",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",boxShadow:"0 2px 12px rgba(0,0,0,0.2)",letterSpacing:"0.04em"}});
  signinBtn.textContent=t("auth_signin");
  signinBtn.addEventListener("click",function(){DV_AUTH.showModal=true;DV_AUTH.modalTab="signin";DV_AUTH.error="";render();});
  return signinBtn;
}
