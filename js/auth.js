// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- AUTH MODULE ---
var DV_AUTH={user:null,profile:null,loading:true,showModal:false,modalTab:"signup",error:"",info:"",busy:false,loginSuccess:false,successName:""};

function sbHeaders(token){
  var h={"apikey":SUPABASE_KEY,"Content-Type":"application/json"};
  if(token)h["Authorization"]="Bearer "+token;
  return h;
}

async function sbAuth(endpoint,body,redirectTo){
  var url=SUPABASE_URL+"/auth/v1/"+endpoint;
  if(redirectTo)url+=(url.indexOf("?")>=0?"&":"?")+"redirect_to="+encodeURIComponent(redirectTo);
  var resp=await fetch(url,{method:"POST",headers:sbHeaders(),body:JSON.stringify(body)});
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
      var osc=ctx.createOscillator();var gain=ctx.createGain();
      osc.type="sine";osc.frequency.setValueAtTime(freq,ctx.currentTime);
      var start=ctx.currentTime+i*0.18;
      gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(0.4,start+0.06);gain.gain.exponentialRampToValueAtTime(0.01,start+0.7);
      osc.connect(gain);gain.connect(masterGain);osc.start(start);osc.stop(start+0.8);
    });
    var shimmer=ctx.createOscillator();var sGain=ctx.createGain();
    shimmer.type="sine";shimmer.frequency.setValueAtTime(1046.50*1.5,ctx.currentTime);
    var sStart=ctx.currentTime+0.6;
    sGain.gain.setValueAtTime(0,sStart);sGain.gain.linearRampToValueAtTime(0.06,sStart+0.1);sGain.gain.exponentialRampToValueAtTime(0.001,sStart+1.2);
    shimmer.connect(sGain);sGain.connect(masterGain);shimmer.start(sStart);shimmer.stop(sStart+1.3);
    setTimeout(function(){ctx.close();},3000);
  }catch(e){}
}

function triggerLoginAnimation(){
  DV_AUTH.loginSuccess=true;render();playDVLoginSound();
  var wins=document.querySelectorAll(".dv-burj-window");
  var sorted=Array.from(wins).sort(function(a,b){return parseFloat(b.getAttribute("y"))-parseFloat(a.getAttribute("y"));});
  sorted.forEach(function(w,i){setTimeout(function(){w.classList.add("lit");},80+i*50);});
  var svg=document.querySelector(".dv-burj-svg");
  if(svg)setTimeout(function(){svg.classList.add("lit");},400);
  var logo=document.querySelector(".dv-login-logo");
  if(logo)setTimeout(function(){logo.classList.add("gold");},300);
  setTimeout(function(){DV_AUTH.showModal=false;DV_AUTH.loginSuccess=false;DV_AUTH.successName="";render();},2800);
}

async function dvSignUp(name,email,password){
  DV_AUTH.busy=true;DV_AUTH.error="";DV_AUTH.info="";render();
  try{
    var data=await sbAuth("signup",{email:email,password:password,data:{display_name:name}},"https://www.dubaival.com");
    if(data.access_token){
      await setAuthSession(data);
      await fetch(SUPABASE_URL+"/rest/v1/user_profiles",{method:"POST",headers:Object.assign({},sbHeaders(data.access_token),{"Prefer":"return=minimal"}),body:JSON.stringify({id:data.user.id,display_name:name,email:email,role:"user",preferred_lang:dvLang})}).catch(function(){});
      DV_AUTH.busy=false;DV_AUTH.successName=name||email.split("@")[0];triggerLoginAnimation();
    }else{
      DV_AUTH.busy=false;
      DV_AUTH.info="Account created! Check your email to confirm, then Sign In.";
      DV_AUTH.modalTab="signin";render();
    }
  }catch(e){DV_AUTH.error=e.message;DV_AUTH.busy=false;render();}
}

async function dvSignIn(email,password){
  DV_AUTH.busy=true;DV_AUTH.error="";DV_AUTH.info="";render();
  try{
    var data=await sbAuth("token?grant_type=password",{email:email,password:password});
    await setAuthSession(data);
    DV_AUTH.busy=false;
    DV_AUTH.successName=(data.user&&data.user.user_metadata&&data.user.user_metadata.display_name)||email.split("@")[0];
    triggerLoginAnimation();syncPortfolioFromCloud();
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
  var rt=localStorage.getItem("dv_refresh_token");if(!rt)return null;
  try{
    var data=await sbAuth("token?grant_type=refresh_token",{refresh_token:rt});
    await setAuthSession(data);return data.access_token;
  }catch(e){
    localStorage.removeItem("dv_access_token");localStorage.removeItem("dv_refresh_token");localStorage.removeItem("dv_user");
    DV_AUTH.user=null;DV_AUTH.profile=null;return null;
  }
}

async function getValidToken(){
  var token=localStorage.getItem("dv_access_token");if(!token)return null;
  try{
    var payload=JSON.parse(atob(token.split(".")[1]));
    if(payload.exp*1000<Date.now()+60000)return await dvRefreshToken();
    return token;
  }catch(e){return await dvRefreshToken();}
}

// --- CLOUD SYNC ---
async function syncPortfolioToCloud(){
  if(!DV_AUTH.user)return;var token=await getValidToken();if(!token)return;
  var assets=[];var goals={};
  try{assets=JSON.parse(localStorage.getItem("dubaival_portfolio"))||[];}catch(e){}
  try{goals=JSON.parse(localStorage.getItem("dubaival_portfolio_goals"))||{};}catch(e){}
  var body={user_id:DV_AUTH.user.id,portfolio_data:assets,goals_data:goals,updated_at:new Date().toISOString()};
  await fetch(SUPABASE_URL+"/rest/v1/user_portfolios?user_id=eq."+DV_AUTH.user.id,{method:"GET",headers:sbHeaders(token)}).then(function(r){return r.json();}).then(async function(rows){
    if(rows.length>0){await fetch(SUPABASE_URL+"/rest/v1/user_portfolios?user_id=eq."+DV_AUTH.user.id,{method:"PATCH",headers:Object.assign({},sbHeaders(token),{"Prefer":"return=minimal"}),body:JSON.stringify({portfolio_data:assets,goals_data:goals,updated_at:new Date().toISOString()})});}
    else{await fetch(SUPABASE_URL+"/rest/v1/user_portfolios",{method:"POST",headers:Object.assign({},sbHeaders(token),{"Prefer":"return=minimal"}),body:JSON.stringify(body)});}
  });
}

async function syncPortfolioFromCloud(){
  if(!DV_AUTH.user)return;var token=await getValidToken();if(!token)return;
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/user_portfolios?user_id=eq."+DV_AUTH.user.id+"&limit=1",{headers:sbHeaders(token)});
    var rows=await resp.json();
    if(!rows||!rows.length)return syncPortfolioToCloud();
    var cloud=rows[0];var localUpdated=localStorage.getItem("dv_portfolio_updated")||"";var cloudUpdated=cloud.updated_at||"";
    if(cloudUpdated>localUpdated){
      localStorage.setItem("dubaival_portfolio",JSON.stringify(cloud.portfolio_data||[]));
      localStorage.setItem("dubaival_portfolio_goals",JSON.stringify(cloud.goals_data||{}));
      localStorage.setItem("dv_portfolio_updated",cloudUpdated);
      if(window.PORTFOLIO_STATE){window.PORTFOLIO_STATE.assets=cloud.portfolio_data||[];window.PORTFOLIO_STATE.goals=cloud.goals_data||{risk:"Moderate",horizon:"3-5 years",target:"Capital Growth"};}
    }else{await syncPortfolioToCloud();localStorage.setItem("dv_portfolio_updated",new Date().toISOString());}
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
        DV_AUTH.loading=false;if(typeof render==="function")render();
      });
    }else{DV_AUTH.loading=false;}
  }catch(e){DV_AUTH.loading=false;}
})();

// --- BURJ KHALIFA SVG ---
function _buildBurjSVG(w,h){
  w=w||60;h=h||160;
  var ns="http://www.w3.org/2000/svg";
  var svg=document.createElementNS(ns,"svg");
  svg.setAttribute("viewBox","0 0 60 165");svg.setAttribute("width",w);svg.setAttribute("height",h);
  svg.classList.add("dv-burj-svg");

  var defs=document.createElementNS(ns,"defs");
  // Golden body gradient
  var grad=document.createElementNS(ns,"linearGradient");
  grad.setAttribute("id","bG"+w);grad.setAttribute("x1","0");grad.setAttribute("y1","0");grad.setAttribute("x2","0");grad.setAttribute("y2","1");
  [["0%","#E8B830"],["18%","#C9920A"],["45%","#A07010"],["70%","#7A5208"],["100%","#4A3006"]].forEach(function(s){
    var st=document.createElementNS(ns,"stop");st.setAttribute("offset",s[0]);st.setAttribute("stop-color",s[1]);grad.appendChild(st);
  });
  defs.appendChild(grad);
  // Spire gradient
  var sg=document.createElementNS(ns,"linearGradient");
  sg.setAttribute("id","bSG"+w);sg.setAttribute("x1","0");sg.setAttribute("y1","0");sg.setAttribute("x2","0");sg.setAttribute("y2","1");
  [["0%","#FFF0A0"],["50%","#FFD040"],["100%","#C9920A"]].forEach(function(s){
    var st=document.createElementNS(ns,"stop");st.setAttribute("offset",s[0]);st.setAttribute("stop-color",s[1]);sg.appendChild(st);
  });
  defs.appendChild(sg);
  // Glow filter
  var filt=document.createElementNS(ns,"filter");
  filt.setAttribute("id","bGlow"+w);filt.setAttribute("x","-50%");filt.setAttribute("y","-50%");filt.setAttribute("width","200%");filt.setAttribute("height","200%");
  var fe=document.createElementNS(ns,"feGaussianBlur");fe.setAttribute("stdDeviation","2");fe.setAttribute("result","blur");
  var feM=document.createElementNS(ns,"feMerge");
  var n1=document.createElementNS(ns,"feMergeNode");n1.setAttribute("in","blur");
  var n2=document.createElementNS(ns,"feMergeNode");n2.setAttribute("in","SourceGraphic");
  feM.appendChild(n1);feM.appendChild(n2);filt.appendChild(fe);filt.appendChild(feM);
  defs.appendChild(filt);
  svg.appendChild(defs);

  // Spire glow halo
  var halo=document.createElementNS(ns,"ellipse");
  halo.setAttribute("cx","30");halo.setAttribute("cy","5");halo.setAttribute("rx","6");halo.setAttribute("ry","10");
  halo.setAttribute("fill","rgba(255,220,80,0.18)");halo.setAttribute("filter","url(#bGlow"+w+")");
  svg.appendChild(halo);

  // Spire
  var sp=document.createElementNS(ns,"line");sp.setAttribute("x1","30");sp.setAttribute("y1","2");sp.setAttribute("x2","30");sp.setAttribute("y2","24");
  sp.setAttribute("stroke","url(#bSG"+w+")");sp.setAttribute("stroke-width","1.4");sp.setAttribute("stroke-linecap","round");svg.appendChild(sp);
  // Spire tip dot
  var tip=document.createElementNS(ns,"circle");tip.setAttribute("cx","30");tip.setAttribute("cy","2");tip.setAttribute("r","1.2");tip.setAttribute("fill","#FFFACC");svg.appendChild(tip);

  // Body
  var body=document.createElementNS(ns,"path");body.setAttribute("d","M30 24 L27 34 L25 48 L23 65 L22 85 L20 108 L17 130 L14 155 L46 155 L43 130 L40 108 L38 85 L37 65 L35 48 L33 34 Z");
  body.setAttribute("fill","url(#bG"+w+")");body.setAttribute("stroke","rgba(255,200,50,0.15)");body.setAttribute("stroke-width","0.4");svg.appendChild(body);
  // Wings
  var wL=document.createElementNS(ns,"path");wL.setAttribute("d","M22 85 L17 90 L11 112 L9 135 L8 155 L17 155 L20 108 Z");
  wL.setAttribute("fill","url(#bG"+w+")");wL.setAttribute("stroke","rgba(255,180,30,0.1)");wL.setAttribute("stroke-width","0.4");svg.appendChild(wL);
  var wR=document.createElementNS(ns,"path");wR.setAttribute("d","M38 85 L43 90 L49 112 L51 135 L52 155 L43 155 L40 108 Z");
  wR.setAttribute("fill","url(#bG"+w+")");wR.setAttribute("stroke","rgba(255,180,30,0.1)");wR.setAttribute("stroke-width","0.4");svg.appendChild(wR);

  // Windows — amber gold
  var wins=[
    {x:29,y:28,w:2,h:1.5},{x:28,y:34,w:4,h:1.5},{x:27,y:40,w:6,h:1.5},{x:26,y:46,w:8,h:2},{x:26,y:52,w:8,h:2},
    {x:25,y:58,w:10,h:2},{x:24,y:64,w:12,h:2},{x:24,y:70,w:12,h:2},{x:23,y:76,w:14,h:2},{x:23,y:82,w:14,h:2},
    {x:22,y:89,w:16,h:2},{x:21,y:95,w:18,h:2},{x:20,y:101,w:20,h:2},{x:19,y:108,w:22,h:2.5},
    {x:18,y:115,w:24,h:2.5},{x:17,y:122,w:26,h:2.5},{x:16,y:130,w:28,h:2.5},{x:15,y:138,w:30,h:2.5},{x:14,y:146,w:32,h:2.5},
    {x:9,y:112,w:5,h:1.5},{x:9,y:120,w:5,h:1.5},{x:9,y:128,w:5,h:1.5},{x:9,y:136,w:5,h:1.5},
    {x:46,y:112,w:5,h:1.5},{x:46,y:120,w:5,h:1.5},{x:46,y:128,w:5,h:1.5},{x:46,y:136,w:5,h:1.5}
  ];
  wins.forEach(function(wp){
    var r=document.createElementNS(ns,"rect");r.setAttribute("x",wp.x);r.setAttribute("y",wp.y);r.setAttribute("width",wp.w);r.setAttribute("height",wp.h);r.setAttribute("rx","0.3");r.classList.add("dv-burj-window");svg.appendChild(r);
  });
  return svg;
}

// --- AUTH GATE (full-screen, replaces app) ---
function renderAuthModal(){
  if(!DV_AUTH.showModal)return null;
  var gate=el("div",{});gate.className="dv-gate";

  // Background
  var bg=el("div",{});bg.className="dv-gate-bg";gate.appendChild(bg);

  // Bokeh circles
  var bokehData=[
    {x:10,y:60,s:80,c:"rgba(212,175,55,0.06)",a:"dvBokeh1 4s ease-in-out infinite"},
    {x:75,y:40,s:60,c:"rgba(212,175,55,0.04)",a:"dvBokeh2 5s ease-in-out infinite 1s"},
    {x:50,y:80,s:100,c:"rgba(40,60,120,0.15)",a:"dvBokeh1 6s ease-in-out infinite 2s"},
    {x:85,y:75,s:50,c:"rgba(212,175,55,0.03)",a:"dvBokeh2 4.5s ease-in-out infinite 0.5s"},
    {x:20,y:85,s:70,c:"rgba(60,80,160,0.1)",a:"dvBokeh1 5.5s ease-in-out infinite 1.5s"}
  ];
  bokehData.forEach(function(b){
    var bk=el("div",{style:{left:b.x+"%",top:b.y+"%",width:b.s+"px",height:b.s+"px",background:b.c,animation:b.a}});
    bk.className="dv-gate-bokeh";gate.appendChild(bk);
  });

  // Gold title bar
  var tb=el("div",{});tb.className="dv-gate-titlebar";
  var tbTxt=el("div",{});tbTxt.className="dv-gate-titlebar-text";tbTxt.textContent="Dubai AI Valuation Intelligence";tb.appendChild(tbTxt);
  var winBtns=el("div",{});winBtns.className="dv-gate-win-btns";
  [{c:"#F59E0B"},{c:"#10B981"},{c:"#EF4444"}].forEach(function(b){
    var btn=el("div",{style:{background:b.c}});btn.className="dv-gate-win-btn";winBtns.appendChild(btn);
  });
  tb.appendChild(winBtns);gate.appendChild(tb);

  // Scrollable area
  var scroll=el("div",{});scroll.className="dv-gate-scroll";

  // SUCCESS state
  if(DV_AUTH.loginSuccess){
    var sWrap=el("div",{});sWrap.className="dv-gate-success";
    var burjSucc=el("div",{style:{marginBottom:"16px"}});burjSucc.appendChild(_buildBurjSVG(80,200));sWrap.appendChild(burjSucc);
    var logoS=el("div",{});logoS.className="dv-login-logo";logoS.textContent="DubAIVal";sWrap.appendChild(logoS);
    var wMsg=el("div",{style:{marginTop:"20px",animation:"dvWelcomeFade 0.8s ease 0.5s both"}});
    wMsg.appendChild(div({color:"#D4AF37",fontSize:"20px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Welcome back"));
    wMsg.appendChild(div({color:"#8899AA",fontSize:"14px",marginTop:"6px"},DV_AUTH.successName));
    sWrap.appendChild(wMsg);scroll.appendChild(sWrap);gate.appendChild(scroll);return gate;
  }

  // Logo area — dAlv with Burj Khalifa
  var logoWrap=el("div",{});logoWrap.className="dv-gate-logo-wrap";
  var burjWrap=el("div",{});burjWrap.className="dv-gate-burj-wrap";burjWrap.appendChild(_buildBurjSVG(56,140));logoWrap.appendChild(burjWrap);
  var logoTxt=el("div",{});logoTxt.className="dv-gate-logo-text";
  var ld=el("span",{});ld.className="dv-gate-logo-d";ld.textContent="d";
  var lai=el("span",{});lai.className="dv-gate-logo-ai";lai.textContent="AI";
  var llv=el("span",{});llv.className="dv-gate-logo-lv";llv.textContent="v";
  logoTxt.appendChild(ld);logoTxt.appendChild(lai);logoTxt.appendChild(llv);logoWrap.appendChild(logoTxt);
  scroll.appendChild(logoWrap);

  // Form
  var form=el("div",{});form.className="dv-gate-form";
  var isSignup=DV_AUTH.modalTab==="signup";
  var nameInp,emailInp,passInp;

  if(isSignup){
    var nlbl=el("label",{});nlbl.className="dv-gate-field-label";nlbl.textContent="Full Name";form.appendChild(nlbl);
    nameInp=el("input",{type:"text",placeholder:"Enter your full name"});nameInp.className="dv-gate-input";form.appendChild(nameInp);
  }

  var elbl=el("label",{});elbl.className="dv-gate-field-label";elbl.textContent="User ID / Email";form.appendChild(elbl);
  emailInp=el("input",{type:"email",placeholder:""});emailInp.className="dv-gate-input";form.appendChild(emailInp);

  var plbl=el("label",{});plbl.className="dv-gate-field-label";plbl.textContent="Password";form.appendChild(plbl);
  passInp=el("input",{type:"password",placeholder:""});passInp.className="dv-gate-input";
  passInp.addEventListener("keydown",function(e){if(e.key==="Enter")doSubmit();});form.appendChild(passInp);

  // Error / Info
  if(DV_AUTH.error){var err=el("div",{});err.className="dv-gate-error";err.textContent=DV_AUTH.error;form.appendChild(err);}
  if(DV_AUTH.info){var inf=el("div",{});inf.className="dv-gate-info";inf.textContent=DV_AUTH.info;form.appendChild(inf);}

  // Checkboxes
  var chkData=[
    {key:"dv_remember",label:"Remember me",icon:"👤",def:true},
    {key:"dv_autosync",label:"Auto-login",icon:"⏱",def:true},
    {key:"dv_alerts",label:"Login invisibly",icon:"👁",def:false}
  ];
  chkData.forEach(function(chk){
    var saved=localStorage.getItem(chk.key);
    var isChecked=saved!==null?saved==="true":chk.def;
    var row=el("div",{});row.className="dv-gate-chk-row";
    var box=el("div",{});box.className="dv-gate-chk-box"+(isChecked?" checked":"");
    var lbl=el("span",{});lbl.className="dv-gate-chk-label";
    var ltxt=el("span",{});ltxt.textContent=chk.label;
    var icon=el("span",{});icon.className="dv-gate-chk-icon";icon.textContent=chk.icon;
    lbl.appendChild(ltxt);lbl.appendChild(icon);
    row.appendChild(box);row.appendChild(lbl);
    row.addEventListener("click",function(){isChecked=!isChecked;box.className="dv-gate-chk-box"+(isChecked?" checked":"");localStorage.setItem(chk.key,isChecked?"true":"false");});
    form.appendChild(row);
  });

  // Submit
  function doSubmit(){
    var email=emailInp.value.trim();var pass=passInp.value;
    if(!email||!pass){DV_AUTH.error="Please fill in all fields";render();return;}
    if(isSignup){var name=(nameInp&&nameInp.value.trim())||"";if(!name){DV_AUTH.error="Please enter your name";render();return;}dvSignUp(name,email,pass);}
    else{dvSignIn(email,pass);}
  }

  var btn=el("button",{});btn.className="dv-gate-btn";
  if(DV_AUTH.busy){btn.disabled=true;btn.textContent="Please wait...";}
  else{btn.textContent=isSignup?"CREATE ACCOUNT":"SIGN IN";}
  if(!DV_AUTH.busy)btn.addEventListener("click",doSubmit);
  form.appendChild(btn);

  // Links
  var linksDiv=el("div",{style:{marginTop:"20px",display:"flex",flexDirection:"column",alignItems:"center",gap:"8px"}});
  if(isSignup){
    var sl=el("button",{});sl.className="dv-gate-link";sl.textContent="Already have an account? Sign In";
    sl.addEventListener("click",function(){DV_AUTH.modalTab="signin";DV_AUTH.error="";DV_AUTH.info="";render();});linksDiv.appendChild(sl);
  }else{
    var cl=el("button",{});cl.className="dv-gate-link";cl.textContent="Create a new DubAIVal ID...";
    cl.addEventListener("click",function(){DV_AUTH.modalTab="signup";DV_AUTH.error="";DV_AUTH.info="";render();});linksDiv.appendChild(cl);
    var fl=el("button",{});fl.className="dv-gate-link";fl.style.fontSize="12px";fl.innerHTML="Forgot your password? <span style='color:#D4AF37'>✦</span>";
    fl.addEventListener("click",function(){
      var email=emailInp?emailInp.value.trim():"";
      if(!email){DV_AUTH.error="Enter your email address first";render();return;}
      fetch(SUPABASE_URL+"/auth/v1/recover?redirect_to="+encodeURIComponent("https://www.dubaival.com"),{method:"POST",headers:sbHeaders(),body:JSON.stringify({email:email})})
        .then(function(){DV_AUTH.info="Password reset link sent to "+email;DV_AUTH.error="";render();})
        .catch(function(){DV_AUTH.error="Failed to send reset email";render();});
    });linksDiv.appendChild(fl);
  }
  form.appendChild(linksDiv);

  form.appendChild(div({textAlign:"center",color:"#2A3040",fontSize:"10px",marginTop:"20px",fontFamily:"'Inter',sans-serif"},"By continuing you agree to DubAIVal's Terms of Service"));
  scroll.appendChild(form);gate.appendChild(scroll);
  return gate;
}

function renderAuthButton(){
  if(DV_AUTH.user&&DV_AUTH.profile){
    var syncBtn=el("button",{});syncBtn.className="dv-icon-btn";syncBtn.style.position="relative";
    syncBtn.innerHTML='<i data-lucide="cloud" style="width:18px;height:18px;color:#10B981"></i>';
    var syncDot=el("div",{style:{position:"absolute",top:"6px",right:"6px",width:"6px",height:"6px",borderRadius:"50%",background:"#10B981"}});
    syncBtn.appendChild(syncDot);syncBtn.addEventListener("click",function(){DV_AUTH.showModal=false;render();});
    return syncBtn;
  }
  var signinBtn=el("button",{});signinBtn.className="dv-icon-btn";
  signinBtn.innerHTML='<i data-lucide="log-in" style="width:18px;height:18px;color:#6B7A9E"></i>';
  signinBtn.addEventListener("click",function(){DV_AUTH.showModal=true;DV_AUTH.modalTab="signin";DV_AUTH.error="";DV_AUTH.info="";render();});
  return signinBtn;
}
