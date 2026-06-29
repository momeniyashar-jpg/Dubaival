// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- AUTH MODULE ---
var DV_AUTH={user:null,profile:null,loading:true,showModal:false,modalTab:"signup",error:"",busy:false,loginSuccess:false,successName:""};

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

function playDVLoginSound(){
  try{
    var ctx=new(window.AudioContext||window.webkitAudioContext)();
    var notes=[523.25,659.25,783.99,1046.50];
    var masterGain=ctx.createGain();
    masterGain.gain.setValueAtTime(0.15,ctx.currentTime);
    masterGain.connect(ctx.destination);
    notes.forEach(function(freq,i){
      var osc=ctx.createOscillator();
      var gain=ctx.createGain();
      osc.type="sine";
      osc.frequency.setValueAtTime(freq,ctx.currentTime);
      var start=ctx.currentTime+i*0.18;
      gain.gain.setValueAtTime(0,start);
      gain.gain.linearRampToValueAtTime(0.4,start+0.06);
      gain.gain.exponentialRampToValueAtTime(0.01,start+0.7);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(start);
      osc.stop(start+0.8);
      if(i===0){
        var osc2=ctx.createOscillator();
        var g2=ctx.createGain();
        osc2.type="triangle";
        osc2.frequency.setValueAtTime(freq*2,ctx.currentTime);
        g2.gain.setValueAtTime(0,start);
        g2.gain.linearRampToValueAtTime(0.08,start+0.04);
        g2.gain.exponentialRampToValueAtTime(0.001,start+0.5);
        osc2.connect(g2);g2.connect(masterGain);
        osc2.start(start);osc2.stop(start+0.6);
      }
    });
    var shimmer=ctx.createOscillator();
    var sGain=ctx.createGain();
    shimmer.type="sine";
    shimmer.frequency.setValueAtTime(1046.50*1.5,ctx.currentTime);
    var sStart=ctx.currentTime+0.6;
    sGain.gain.setValueAtTime(0,sStart);
    sGain.gain.linearRampToValueAtTime(0.06,sStart+0.1);
    sGain.gain.exponentialRampToValueAtTime(0.001,sStart+1.2);
    shimmer.connect(sGain);sGain.connect(masterGain);
    shimmer.start(sStart);shimmer.stop(sStart+1.3);
    setTimeout(function(){ctx.close();},3000);
  }catch(e){}
}

function triggerLoginAnimation(){
  DV_AUTH.loginSuccess=true;
  render();
  playDVLoginSound();
  var wins=document.querySelectorAll(".dv-burj-window");
  var sorted=Array.from(wins).sort(function(a,b){return parseFloat(b.getAttribute("y"))-parseFloat(a.getAttribute("y"));});
  sorted.forEach(function(w,i){
    setTimeout(function(){w.classList.add("lit");},80+i*50);
  });
  var logo=document.querySelector(".dv-login-logo");
  if(logo)setTimeout(function(){logo.classList.add("gold");},300);
  var svg=document.querySelector(".dv-burj-svg");
  if(svg)setTimeout(function(){svg.classList.add("lit");},400);
  var card=document.querySelector(".dv-login-card");
  if(card)setTimeout(function(){card.classList.add("success");},500);
  setTimeout(function(){
    DV_AUTH.showModal=false;
    DV_AUTH.loginSuccess=false;
    DV_AUTH.successName="";
    render();
  },2800);
}

async function dvSignUp(name,email,password){
  DV_AUTH.busy=true;DV_AUTH.error="";render();
  try{
    var data=await sbAuth("signup",{email:email,password:password,data:{display_name:name}});
    if(data.access_token){
      await setAuthSession(data);
      await fetch(SUPABASE_URL+"/rest/v1/user_profiles",{method:"POST",headers:Object.assign({},sbHeaders(data.access_token),{"Prefer":"return=minimal"}),body:JSON.stringify({id:data.user.id,display_name:name,email:email,role:"user",preferred_lang:dvLang})});
    }
    DV_AUTH.busy=false;
    DV_AUTH.successName=name||email.split("@")[0];
    triggerLoginAnimation();
  }catch(e){DV_AUTH.error=e.message;DV_AUTH.busy=false;render();}
}

async function dvSignIn(email,password){
  DV_AUTH.busy=true;DV_AUTH.error="";render();
  try{
    var data=await sbAuth("token?grant_type=password",{email:email,password:password});
    await setAuthSession(data);
    DV_AUTH.busy=false;
    DV_AUTH.successName=(data.user&&data.user.user_metadata&&data.user.user_metadata.display_name)||email.split("@")[0];
    triggerLoginAnimation();
    syncPortfolioFromCloud();
  }catch(e){DV_AUTH.error=e.message;DV_AUTH.busy=false;render();}
}

async function dvSignOut(){
  var token=localStorage.getItem("dv_access_token");
  if(token)try{await fetch(SUPABASE_URL+"/auth/v1/logout",{method:"POST",headers:sbHeaders(token)});}catch(e){}
  localStorage.removeItem("dv_access_token");localStorage.removeItem("dv_refresh_token");localStorage.removeItem("dv_user");
  DV_AUTH.user=null;DV_AUTH.profile=null;DV_AUTH.modalTab="signin";render();
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

function _buildBurjSVG(){
  var ns="http://www.w3.org/2000/svg";
  var svg=document.createElementNS(ns,"svg");
  svg.setAttribute("viewBox","0 0 80 220");
  svg.setAttribute("width","80");
  svg.setAttribute("height","220");
  svg.classList.add("dv-burj-svg");

  var defs=document.createElementNS(ns,"defs");
  var grad=document.createElementNS(ns,"linearGradient");
  grad.setAttribute("id","burjGrad");grad.setAttribute("x1","0");grad.setAttribute("y1","0");grad.setAttribute("x2","0");grad.setAttribute("y2","1");
  var s1=document.createElementNS(ns,"stop");s1.setAttribute("offset","0%");s1.setAttribute("stop-color","#2A2D35");
  var s2=document.createElementNS(ns,"stop");s2.setAttribute("offset","100%");s2.setAttribute("stop-color","#1A1D25");
  grad.appendChild(s1);grad.appendChild(s2);defs.appendChild(grad);

  var gradGold=document.createElementNS(ns,"linearGradient");
  gradGold.setAttribute("id","burjGradGold");gradGold.setAttribute("x1","0");gradGold.setAttribute("y1","0");gradGold.setAttribute("x2","0");gradGold.setAttribute("y2","1");
  var sg1=document.createElementNS(ns,"stop");sg1.setAttribute("offset","0%");sg1.setAttribute("stop-color","rgba(212,175,55,0.3)");
  var sg2=document.createElementNS(ns,"stop");sg2.setAttribute("offset","100%");sg2.setAttribute("stop-color","rgba(212,175,55,0.05)");
  gradGold.appendChild(sg1);gradGold.appendChild(sg2);defs.appendChild(gradGold);
  svg.appendChild(defs);

  // Spire
  var spire=document.createElementNS(ns,"line");
  spire.setAttribute("x1","40");spire.setAttribute("y1","8");spire.setAttribute("x2","40");spire.setAttribute("y2","38");
  spire.setAttribute("stroke","#3A3D45");spire.setAttribute("stroke-width","1.5");spire.setAttribute("stroke-linecap","round");
  svg.appendChild(spire);

  // Main tower body — Y-shaped silhouette
  var body=document.createElementNS(ns,"path");
  body.setAttribute("d","M40 38 L36 50 L33 65 L30 85 L28 110 L26 140 L22 170 L18 200 L16 215 L64 215 L62 200 L58 170 L54 140 L52 110 L50 85 L47 65 L44 50 Z");
  body.setAttribute("fill","url(#burjGrad)");
  body.setAttribute("stroke","rgba(255,255,255,0.08)");
  body.setAttribute("stroke-width","0.5");
  svg.appendChild(body);

  // Left wing
  var wingL=document.createElementNS(ns,"path");
  wingL.setAttribute("d","M28 110 L22 115 L14 145 L12 175 L10 200 L8 215 L18 215 L22 170 L26 140 Z");
  wingL.setAttribute("fill","url(#burjGrad)");
  wingL.setAttribute("stroke","rgba(255,255,255,0.06)");
  wingL.setAttribute("stroke-width","0.5");
  svg.appendChild(wingL);

  // Right wing
  var wingR=document.createElementNS(ns,"path");
  wingR.setAttribute("d","M52 110 L58 115 L66 145 L68 175 L70 200 L72 215 L62 215 L58 170 L54 140 Z");
  wingR.setAttribute("fill","url(#burjGrad)");
  wingR.setAttribute("stroke","rgba(255,255,255,0.06)");
  wingR.setAttribute("stroke-width","0.5");
  svg.appendChild(wingR);

  // Setback tiers — horizontal lines
  [70,90,110,135,160,185].forEach(function(y){
    var line=document.createElementNS(ns,"line");
    var halfW=3+((y-38)/177)*24;
    line.setAttribute("x1",40-halfW);line.setAttribute("y1",y);
    line.setAttribute("x2",40+halfW);line.setAttribute("y2",y);
    line.setAttribute("stroke","rgba(255,255,255,0.06)");
    line.setAttribute("stroke-width","0.5");
    svg.appendChild(line);
  });

  // Windows — small rectangles along the tower
  var windowPositions=[
    // Upper tower
    {x:38,y:48,w:4,h:2},{x:37,y:56,w:6,h:2},{x:36,y:64,w:8,h:2},
    {x:35,y:72,w:10,h:2},{x:35,y:78,w:10,h:2},
    // Mid tower
    {x:34,y:88,w:12,h:2.5},{x:34,y:94,w:12,h:2.5},{x:33,y:100,w:14,h:2.5},{x:33,y:106,w:14,h:2.5},
    // Below wings
    {x:32,y:116,w:16,h:2.5},{x:31,y:123,w:18,h:2.5},{x:30,y:130,w:20,h:2.5},
    {x:29,y:138,w:22,h:2.5},{x:28,y:146,w:24,h:2.5},
    // Lower tower
    {x:27,y:155,w:26,h:3},{x:26,y:163,w:28,h:3},{x:25,y:172,w:30,h:3},
    {x:24,y:181,w:32,h:3},{x:23,y:190,w:34,h:3},{x:22,y:199,w:36,h:3},
    // Wing windows left
    {x:14,y:150,w:6,h:2},{x:13,y:160,w:7,h:2},{x:12,y:170,w:8,h:2},
    {x:11,y:180,w:9,h:2},{x:10,y:190,w:10,h:2},
    // Wing windows right
    {x:60,y:150,w:6,h:2},{x:60,y:160,w:7,h:2},{x:60,y:170,w:8,h:2},
    {x:60,y:180,w:9,h:2},{x:60,y:190,w:10,h:2},
    // Extra mid
    {x:34,y:82,w:12,h:2},{x:32,y:112,w:16,h:2.5},{x:26,y:168,w:28,h:3},
    {x:25,y:176,w:30,h:3},{x:24,y:185,w:32,h:3},{x:22,y:194,w:36,h:3},
    {x:23,y:205,w:34,h:3},{x:22,y:210,w:36,h:2}
  ];

  windowPositions.forEach(function(wp){
    var rect=document.createElementNS(ns,"rect");
    rect.setAttribute("x",wp.x);rect.setAttribute("y",wp.y);
    rect.setAttribute("width",wp.w);rect.setAttribute("height",wp.h);
    rect.setAttribute("rx","0.5");
    rect.classList.add("dv-burj-window");
    svg.appendChild(rect);
  });

  // Observation deck accent
  var obs=document.createElementNS(ns,"ellipse");
  obs.setAttribute("cx","40");obs.setAttribute("cy","140");
  obs.setAttribute("rx","14");obs.setAttribute("ry","1.5");
  obs.setAttribute("fill","none");obs.setAttribute("stroke","rgba(255,255,255,0.06)");
  obs.setAttribute("stroke-width","0.5");
  svg.appendChild(obs);

  return svg;
}

// --- AUTH MODAL ---
function renderAuthModal(){
  if(!DV_AUTH.showModal)return null;

  var overlay=el("div",{});
  overlay.className="dv-login-overlay";

  var card=el("div",{});
  card.className="dv-login-card";
  card.addEventListener("click",function(e){e.stopPropagation();});

  // Success state
  if(DV_AUTH.loginSuccess){
    card.style.textAlign="center";
    card.style.paddingTop="40px";
    card.style.paddingBottom="40px";

    var burjWrap=el("div",{style:{display:"flex",justifyContent:"center",marginBottom:"20px"}});
    burjWrap.appendChild(_buildBurjSVG());
    card.appendChild(burjWrap);

    var logoS=el("div",{});
    logoS.className="dv-login-logo";
    logoS.textContent="DubAIVal";
    card.appendChild(logoS);

    var welcomeMsg=el("div",{style:{marginTop:"20px",animation:"dvWelcomeFade 0.8s ease 0.5s both"}});
    welcomeMsg.appendChild(div({color:"#D4AF37",fontSize:"18px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Welcome back"));
    welcomeMsg.appendChild(div({color:"#8899AA",fontSize:"14px",marginTop:"6px",fontFamily:"'Inter',sans-serif"},DV_AUTH.successName));
    card.appendChild(welcomeMsg);

    overlay.appendChild(card);
    return overlay;
  }

  // Burj Khalifa silhouette at top
  var burjWrap=el("div",{style:{display:"flex",justifyContent:"center",marginBottom:"16px",opacity:"0.7"}});
  burjWrap.appendChild(_buildBurjSVG());
  card.appendChild(burjWrap);

  // Logo
  var logoDiv=el("div",{style:{textAlign:"center",marginBottom:"24px"}});
  var logoText=el("div",{});
  logoText.className="dv-login-logo";
  logoText.textContent="DubAIVal";
  logoDiv.appendChild(logoText);
  logoDiv.appendChild(div({color:"#556677",fontSize:"12px",fontFamily:"'Inter',sans-serif",marginTop:"4px"},"AI Property Valuation Platform"));
  card.appendChild(logoDiv);

  // Form
  var nameInp,emailInp,passInp;
  var isSignup=DV_AUTH.modalTab==="signup";

  if(isSignup){
    nameInp=el("input",{type:"text",placeholder:"Full Name"});
    nameInp.className="dv-login-input";
    nameInp.style.marginBottom="10px";
    card.appendChild(nameInp);
  }

  emailInp=el("input",{type:"email",placeholder:"Email Address"});
  emailInp.className="dv-login-input";
  emailInp.style.marginBottom="10px";
  card.appendChild(emailInp);

  passInp=el("input",{type:"password",placeholder:"Password"});
  passInp.className="dv-login-input";
  passInp.style.marginBottom="16px";
  passInp.addEventListener("keydown",function(e){if(e.key==="Enter")doSubmit();});
  card.appendChild(passInp);

  // Error message
  if(DV_AUTH.error){
    card.appendChild(div({background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"10px",padding:"10px 14px",marginBottom:"14px",color:"#EF4444",fontSize:"12px",fontFamily:"'Inter',sans-serif"},DV_AUTH.error));
  }

  // 3 Glass checkboxes
  var chkData=[
    {key:"dv_remember",label:"Remember my credentials",def:true},
    {key:"dv_autosync",label:"Auto-sync portfolio to cloud",def:true},
    {key:"dv_alerts",label:"Enable market price alerts",def:false}
  ];

  var chkWrap=el("div",{style:{marginBottom:"20px",display:"flex",flexDirection:"column",gap:"8px"}});
  chkData.forEach(function(chk){
    var saved=localStorage.getItem(chk.key);
    var isChecked=saved!==null?saved==="true":chk.def;
    var row=el("div",{});
    row.className="dv-login-checkbox";
    var box=el("div",{});
    box.className="dv-chk-box"+(isChecked?" checked":"");
    var lbl=el("span",{});
    lbl.className="dv-chk-label";
    lbl.textContent=chk.label;
    row.appendChild(box);row.appendChild(lbl);
    row.addEventListener("click",function(){
      isChecked=!isChecked;
      box.className="dv-chk-box"+(isChecked?" checked":"");
      localStorage.setItem(chk.key,isChecked?"true":"false");
    });
    chkWrap.appendChild(row);
  });
  card.appendChild(chkWrap);

  // Submit button
  function doSubmit(){
    var email=emailInp.value.trim();
    var pass=passInp.value;
    if(!email||!pass){DV_AUTH.error="Please fill in all fields";render();return;}
    if(isSignup){
      var name=(nameInp&&nameInp.value.trim())||"";
      if(!name){DV_AUTH.error="Please fill in all fields";render();return;}
      dvSignUp(name,email,pass);
    }else{dvSignIn(email,pass);}
  }

  var submitBtn=el("button",{});
  submitBtn.className="dv-login-btn";
  if(DV_AUTH.busy){submitBtn.disabled=true;submitBtn.textContent="Signing in...";}
  else{submitBtn.textContent=isSignup?"Create Account":"Sign In";}
  if(!DV_AUTH.busy)submitBtn.addEventListener("click",doSubmit);
  card.appendChild(submitBtn);

  // Links section
  var linksWrap=el("div",{style:{marginTop:"18px",display:"flex",flexDirection:"column",alignItems:"center",gap:"10px"}});

  if(isSignup){
    var switchLink=el("button",{});
    switchLink.className="dv-login-link";
    switchLink.textContent="Already have an account? Sign In";
    switchLink.addEventListener("click",function(){DV_AUTH.modalTab="signin";DV_AUTH.error="";render();});
    linksWrap.appendChild(switchLink);
  }else{
    var createLink=el("button",{});
    createLink.className="dv-login-link";
    createLink.textContent="Create a new account...";
    createLink.addEventListener("click",function(){DV_AUTH.modalTab="signup";DV_AUTH.error="";render();});
    linksWrap.appendChild(createLink);

    var forgotLink=el("button",{});
    forgotLink.className="dv-login-link";
    forgotLink.style.fontSize="11px";
    forgotLink.textContent="Forgot your password?";
    forgotLink.addEventListener("click",function(){
      var email=emailInp?emailInp.value.trim():"";
      if(!email){DV_AUTH.error="Enter your email address first";render();return;}
      fetch(SUPABASE_URL+"/auth/v1/recover",{method:"POST",headers:sbHeaders(),body:JSON.stringify({email:email})})
        .then(function(){DV_AUTH.error="";alert("Password reset link sent to "+email);})
        .catch(function(){DV_AUTH.error="Failed to send reset email";render();});
    });
    linksWrap.appendChild(forgotLink);
  }

  card.appendChild(linksWrap);

  // Disclaimer
  card.appendChild(div({textAlign:"center",color:"#3A4050",fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"16px",lineHeight:"1.5"},"By signing in you agree to DubAIVal's Terms of Service"));

  overlay.appendChild(card);
  return overlay;
}

function renderAuthButton(){
  if(DV_AUTH.user&&DV_AUTH.profile){
    var syncBtn=el("button",{});
    syncBtn.className="dv-icon-btn";
    syncBtn.style.position="relative";
    syncBtn.innerHTML='<i data-lucide="cloud" style="width:18px;height:18px;color:#10B981"></i>';
    var syncDot=el("div",{style:{position:"absolute",top:"6px",right:"6px",width:"6px",height:"6px",borderRadius:"50%",background:"#10B981"}});
    syncBtn.appendChild(syncDot);
    syncBtn.addEventListener("click",function(){DV_AUTH.showModal=false;render();});
    return syncBtn;
  }
  var signinBtn=el("button",{});
  signinBtn.className="dv-icon-btn";
  signinBtn.innerHTML='<i data-lucide="log-in" style="width:18px;height:18px;color:#6B7A9E"></i>';
  signinBtn.addEventListener("click",function(){DV_AUTH.showModal=true;DV_AUTH.modalTab="signin";DV_AUTH.error="";render();});
  return signinBtn;
}
