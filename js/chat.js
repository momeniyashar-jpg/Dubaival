// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- AI AGENTS ---------------------------------------------------------------
var AI_AGENTS=[
  {id:"general",icon:"🧠",name:"DubAIVal Intelligence",nameAr:"هوش DubAIVal",
    desc:"General market Q&A — ask about any building, deal, or strategy",
    color:"#C9A84C",
    suggestions:["Is BLVD Heights at AED 2,800 PSF a good deal?","Best yield under AED 1.5M right now?","Off-plan vs ready in 2026?","Geo risk still affecting prices?"],
    sys:function(){return getChatSys();}
  },
  {id:"valuation",icon:"📊",name:"Valuation Agent",nameAr:"ایجنت ارزیابی",
    desc:"Deep property analysis — fair price, yield, risk, verdict",
    color:"#10B981",
    suggestions:["Analyze Marina Gate 1, 2BR, 1400 sqft, asking AED 2.8M","Is Emaar Beachfront worth AED 3,200 PSF?","Compare Downtown vs JVC for 2BR investment","What's fair price for a 1BR in Business Bay?"],
    sys:function(){
      var base=getChatSys();
      var areas="";try{var top=Object.keys(AREAS).slice(0,50).map(function(k){var a=AREAS[k];return k+":PSF"+a.psf+",Y"+(a.y?(a.y[0]+"-"+a.y[1]):"-")+"%";}).join("|");areas=top;}catch(e){}
      return base+"\n\nYou are the VALUATION AGENT — a specialist property analyst.\n"+
        "For every property query:\n"+
        "1. Look up building PSF from DB (mention if DLD-verified)\n"+
        "2. Calculate fair value = adjPSF × size\n"+
        "3. Compare asking vs fair → verdict (Undervalued/Fair/Overpriced)\n"+
        "4. Gross yield = annual rent / price × 100\n"+
        "5. Net yield = gross - SC% - 7% costs\n"+
        "6. Investment signal: P/R ratio <15 Undervalued, <20 Fair, <25 Elevated, else Bubble Risk\n"+
        "7. Give BUY/HOLD/AVOID recommendation with confidence %\n"+
        "Always provide specific AED numbers. Never say 'I don't have data' — use area benchmarks if building not found.\n"+
        "Top areas data: "+areas;
    }
  },
  {id:"negotiation",icon:"🤝",name:"Negotiation Coach",nameAr:"مشاور مذاکره",
    desc:"How much to offer, negotiation tactics, market leverage",
    color:"#F59E0B",
    suggestions:["Seller asking AED 2.5M for 2BR in JVC, how much should I offer?","How to negotiate with developers on off-plan?","What's my leverage as a cash buyer?","When is the best time to make an offer in Dubai?"],
    sys:function(){
      return getChatSys()+"\n\nYou are the NEGOTIATION COACH — expert in Dubai property negotiations.\n"+
        "For every query:\n"+
        "1. Assess the asking price vs market data (use DB PSF)\n"+
        "2. Calculate Margin of Safety: if asking > fair price, suggest discount %\n"+
        "3. Give specific offer amount in AED\n"+
        "4. Provide negotiation tactics based on:\n"+
        "   - Market conditions (buyer's market = more leverage)\n"+
        "   - Days on market (>60 DOM = seller motivated)\n"+
        "   - Cash vs mortgage (cash buyers get 5-10% better deals)\n"+
        "   - Time of year (Q3/Q4 slower = more negotiable)\n"+
        "5. Red flags to watch for\n"+
        "6. Walk-away price recommendation\n"+
        "Always give a specific AED offer number, not just percentage ranges.";
    }
  },
  {id:"marketing",icon:"📝",name:"Property Marketing",nameAr:"بازاریابی ملک",
    desc:"Write professional property listings, social posts, emails",
    color:"#8B5CF6",
    suggestions:["Write a listing for 2BR in Marina Gate 1, 1400 sqft, AED 2.8M","Create Instagram caption for luxury villa in Palm","Write email to investor about Business Bay opportunity","Draft WhatsApp message for open house invitation"],
    sys:function(){
      return "You are a Dubai luxury real estate MARKETING SPECIALIST.\n"+
        "You write compelling, professional property marketing content.\n"+
        "Style: Sophisticated, benefit-focused, urgency-driven. Use Dubai luxury lifestyle language.\n"+
        "Rules:\n"+
        "1. Always include specific details (sqft, AED price, location, amenities)\n"+
        "2. Highlight ROI/yield for investors, lifestyle for end-users\n"+
        "3. Include call-to-action\n"+
        "4. For social media: use emojis, hashtags, keep punchy\n"+
        "5. For emails: professional tone, structured with sections\n"+
        "6. For listings: SEO-friendly, feature-benefit format\n"+
        "7. Mention nearby landmarks, metro, schools where relevant\n"+
        "Write in the language the user asks in. Default to English.";
    }
  },
  {id:"investor",icon:"💰",name:"Investment Advisor",nameAr:"مشاور سرمایه‌گذاری",
    desc:"Where to buy with your budget — area comparison, portfolio strategy",
    color:"#3B82F6",
    suggestions:["I have AED 2M, where should I invest for best yield?","Compare JVC vs Dubai South vs Sports City for rental income","Is it better to buy 1 expensive or 2 cheap apartments?","Golden Visa through property — what are my options?"],
    sys:function(){
      var areaData="";
      try{
        var sorted=Object.keys(AREAS).map(function(k){var a=AREAS[k];return{n:k,p:a.psf,y:a.y?((a.y[0]+a.y[1])/2):0,g:a.g?a.g[0]:0};}).sort(function(a,b){return b.y-a.y;}).slice(0,40);
        areaData=sorted.map(function(a){return a.n+":PSF"+a.p+",Y"+a.y.toFixed(1)+"%,G"+a.g+"%";}).join("|");
      }catch(e){}
      return getChatSys()+"\n\nYou are an INVESTMENT ADVISOR for Dubai real estate.\n"+
        "Top 40 areas by yield: "+areaData+"\n"+
        "For every investment query:\n"+
        "1. Understand budget, risk tolerance, goal (yield/growth/visa)\n"+
        "2. Recommend 2-3 specific areas with reasons\n"+
        "3. For each area: specific building suggestions, expected PSF, yield, growth\n"+
        "4. Calculate: budget ÷ PSF = size you can get, estimated rent, net yield\n"+
        "5. Risk assessment: liquidity (DOM), volatility, oversupply risk\n"+
        "6. Golden Visa: AED 2M minimum property value\n"+
        "7. Compare scenarios: 1 big vs 2 small, ready vs off-plan\n"+
        "Always give specific AED numbers and building names from DB.";
    }
  },
  {id:"legal",icon:"⚖️",name:"Legal & Process Guide",nameAr:"راهنمای حقوقی",
    desc:"Buying process, visa, fees, RERA rules, tenant rights",
    color:"#EF4444",
    suggestions:["Steps to buy property in Dubai as a foreigner?","What are all the fees when buying in Dubai?","RERA rules for rent increase in 2026?","How does Golden Visa through property work?"],
    sys:function(){
      return "You are a Dubai real estate LEGAL & PROCESS GUIDE.\n"+
        "Expert in: RERA regulations, DLD procedures, visa rules, tenancy law.\n"+
        "Key facts (June 2026):\n"+
        "FEES: DLD transfer 4%, Agency 2%, Mortgage registration 0.25%, NOC AED 500-5000, Trustee AED 4,000+VAT\n"+
        "GOLDEN VISA: AED 2M+ property → 10yr visa. Off-plan counts if developer approved. Can stack properties.\n"+
        "TENANCY: RERA rent index for increases. 90-day notice. 12-month notice for eviction (owner use). Security deposit: 5% unfurnished, 10% furnished.\n"+
        "MORTGAGE: Expat max LTV 75% (<5M) or 65% (>5M). UAE national 80%. Min DP 20-35%.\n"+
        "FREEHOLD: Foreigners can buy in designated freehold areas only.\n"+
        "OFF-PLAN: Escrow law, SPA, OQOOD registration, DLD 4% + admin AED 1,000\n"+
        "Rules:\n"+
        "1. Always cite RERA/DLD regulations where applicable\n"+
        "2. Give step-by-step processes\n"+
        "3. List all applicable fees with AED amounts\n"+
        "4. Warn about common mistakes\n"+
        "5. Recommend consulting a lawyer for complex cases\n"+
        "6. Respond in the user's language";
    }
  },
  {id:"leadcapture",icon:"🧲",name:"Lead Capture",nameAr:"جذب مشتری",
    desc:"Engage visitors, qualify buyers, capture contact info as leads",
    color:"#EC4899",
    suggestions:["I'm looking to buy a 2BR in Dubai under 2M","I want to invest but don't know where to start","Is now a good time to buy in Dubai?","I'm relocating to Dubai, need housing advice"],
    sys:function(){
      var areaData="";
      try{
        var top=Object.keys(AREAS).map(function(k){var a=AREAS[k];return{n:k,p:a.psf,y:a.y?((a.y[0]+a.y[1])/2):0};}).sort(function(a,b){return b.y-a.y;}).slice(0,30);
        areaData=top.map(function(a){return a.n+":PSF"+a.p+",Y"+a.y.toFixed(1)+"%";}).join("|");
      }catch(e){}
      return "You are a Dubai real estate LEAD CAPTURE SPECIALIST working for DubAIVal.\n"+
        "Your goal: Engage potential buyers/investors, understand their needs, and convert them to qualified leads.\n"+
        "Top areas: "+areaData+"\n\n"+
        "CONVERSATION FLOW:\n"+
        "1. ENGAGE: Welcome warmly, ask what brings them to Dubai real estate\n"+
        "2. QUALIFY: Ask these naturally (not all at once):\n"+
        "   - Budget range (AED)\n"+
        "   - Purpose: Investment / End-use / Rental income / Golden Visa\n"+
        "   - Timeline: Ready now / 3-6 months / exploring\n"+
        "   - Nationality (affects mortgage LTV)\n"+
        "   - Preferred areas (or let you recommend)\n"+
        "   - Property type: Apartment / Villa / Townhouse\n"+
        "3. RECOMMEND: Based on answers, suggest 2-3 specific options with real data from DB\n"+
        "4. CONVERT: After providing value, say:\n"+
        "   'I can connect you with a verified DubAIVal agent who specializes in [area]. Would you like to share your WhatsApp or email?'\n"+
        "   Or: 'Would you like me to set up a price alert for [area/building]?'\n\n"+
        "RULES:\n"+
        "- Be helpful FIRST, sell SECOND — provide genuine value before asking for contact\n"+
        "- Use specific AED numbers and real building names from our database\n"+
        "- If they mention a building, give instant PSF data to build trust\n"+
        "- Never be pushy. If they're just exploring, respect that and educate\n"+
        "- Match their language (English/Arabic/Farsi)\n"+
        "- End with a clear next step";
    }
  },
  {id:"outreach",icon:"📣",name:"Social Media Manager",nameAr:"مدیر شبکه‌های اجتماعی",
    desc:"Generate & auto-publish to Instagram, Facebook, WhatsApp — like a pro",
    color:"#F97316",
    suggestions:["Create an Instagram post about investing in JVC with real data","Write a Facebook post about Palm Jumeirah luxury villas","Generate WhatsApp status about Dubai Marina yields","Create a professional post about Business Bay growth for all platforms"],
    sys:function(){
      var hotAreas="";
      try{
        var ranked=Object.keys(AREAS).map(function(k){var a=AREAS[k];return{n:k,p:a.psf,y:a.y?((a.y[0]+a.y[1])/2):0,g:a.g?a.g[0]:0};}).sort(function(a,b){return(b.y+b.g)-(a.y+a.g);}).slice(0,20);
        hotAreas=ranked.map(function(a){return a.n+":PSF"+a.p+",Yield"+a.y.toFixed(1)+"%,Growth"+a.g+"%";}).join("|");
      }catch(e){}
      return "You are a Dubai real estate SOCIAL MEDIA MANAGER & CONTENT CREATOR.\n"+
        "You create professional, high-converting content for Instagram, Facebook, WhatsApp, LinkedIn.\n"+
        "Hot areas: "+hotAreas+"\n\n"+
        "IMPORTANT: When the user asks you to create a post, you MUST respond with EXACTLY this JSON format at the END of your response (after any explanation):\n"+
        "```json\n{\"post\":{\"caption\":\"THE FULL POST TEXT WITH EMOJIS AND HASHTAGS\",\"platform\":\"instagram\"}}\n```\n\n"+
        "Platform options: \"instagram\", \"facebook\", \"whatsapp\", \"all\"\n"+
        "If user says 'all platforms' or doesn't specify, use \"all\".\n\n"+
        "CONTENT STYLE:\n"+
        "- Instagram: Visual hooks, emojis, 5-10 hashtags, carousel-style numbered points\n"+
        "- Facebook: Longer form, professional, CTA to DubaiVal.com\n"+
        "- WhatsApp: Short & punchy, 3-4 lines max, perfect for status/broadcast\n"+
        "- All: Create one master post that works across all platforms\n\n"+
        "RULES:\n"+
        "- ALWAYS use REAL numbers from our database — never fabricate\n"+
        "- Include AED figures, yield %, growth % from database\n"+
        "- Professional luxury tone — like a top Dubai agency\n"+
        "- Include 'DubaiVal.com' or '@dubaiaivaluation' naturally\n"+
        "- If user writes in Farsi/Arabic, create content in that language\n"+
        "- Make every post look like it was created by a marketing expert\n"+
        "- Add call-to-action: DM, link, or contact\n"+
        "- Suggest best posting time for Dubai audience (10AM, 1PM, 7PM GST)";
    }
  }
];

// --- SOCIAL MEDIA PUBLISHER --------------------------------------------------
var SOCIAL_STATE={publishing:false,lastResult:null};

async function publishToInstagram(caption,imageUrl){
  try{
    var body={action:"post",caption:caption,image_url:imageUrl||"https://i.imgur.com/8RKXAIV.jpeg"};
    var r=await fetch(API_BASE+"/proxy-instagram",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    var d=await r.json();
    if(d.error)return{success:false,error:d.error.message||"Instagram API error"};
    return{success:true,media_id:d.media_id};
  }catch(e){return{success:false,error:e.message};}
}

async function publishToFacebook(message,link){
  try{
    var body={action:"fb_post",message:message};
    if(link)body.link=link;
    var r=await fetch(API_BASE+"/proxy-instagram",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    var d=await r.json();
    if(d.error)return{success:false,error:d.error.message||"Facebook API error"};
    return{success:true,post_id:d.post_id};
  }catch(e){return{success:false,error:e.message};}
}

function shareToWhatsApp(text){
  var encoded=encodeURIComponent(text);
  window.open("https://wa.me/?text="+encoded,"_blank");
  return{success:true};
}

function extractPostJSON(text){
  try{
    var match=text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if(match){var parsed=JSON.parse(match[1]);if(parsed.post)return parsed.post;}
    var match2=text.match(/\{"post"\s*:\s*\{[\s\S]*?\}\s*\}/);
    if(match2){var parsed2=JSON.parse(match2[0]);if(parsed2.post)return parsed2.post;}
  }catch(e){}
  return null;
}

function buildPublishBar(postData,msgText,cl){
  var bar=div({display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"10px",paddingTop:"10px",borderTop:"1px solid "+cl.border});

  var caption=postData?postData.caption:msgText;
  var platform=postData?postData.platform:"all";

  var makeBtn=function(label,icon,color,onclick){
    var b=el("button",{style:{
      background:hexAlpha(color,0.12),border:"1px solid "+hexAlpha(color,0.3),
      color:color,padding:"7px 14px",borderRadius:"8px",fontSize:"11px",fontWeight:"600",
      fontFamily:"'Space Grotesk',monospace",cursor:"pointer",display:"flex",alignItems:"center",gap:"5px",transition:"all 0.2s"
    },onclick:onclick});
    b.textContent=icon+" "+label;
    return b;
  };

  if(platform==="instagram"||platform==="all"){
    bar.appendChild(makeBtn("Post to Instagram","📸","#E1306C",async function(){
      if(SOCIAL_STATE.publishing)return;
      SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Publishing...";this.style.opacity="0.6";
      var result=await publishToInstagram(caption);
      SOCIAL_STATE.publishing=false;
      if(result.success){this.textContent="✅ Posted!";this.style.background="#10B98133";this.style.color="#10B981";this.style.borderColor="#10B981";}
      else{this.textContent="❌ Failed";this.style.background="#EF444433";this.style.color="#EF4444";setTimeout(function(){this.textContent="📸 Retry Instagram";this.style.background="";this.style.color="#E1306C";}.bind(this),3000);}
    }));
  }

  if(platform==="facebook"||platform==="all"){
    bar.appendChild(makeBtn("Post to Facebook","📘","#1877F2",async function(){
      if(SOCIAL_STATE.publishing)return;
      SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Publishing...";this.style.opacity="0.6";
      var result=await publishToFacebook(caption,"https://www.dubaival.com");
      SOCIAL_STATE.publishing=false;
      if(result.success){this.textContent="✅ Posted!";this.style.background="#10B98133";this.style.color="#10B981";this.style.borderColor="#10B981";}
      else{this.textContent="❌ Failed";this.style.background="#EF444433";this.style.color="#EF4444";setTimeout(function(){this.textContent="📘 Retry Facebook";this.style.background="";this.style.color="#1877F2";}.bind(this),3000);}
    }));
  }

  if(platform==="whatsapp"||platform==="all"){
    bar.appendChild(makeBtn("Share WhatsApp","📲","#25D366",function(){
      shareToWhatsApp(caption);
      this.textContent="✅ Opened!";this.style.background="#10B98133";this.style.color="#10B981";this.style.borderColor="#10B981";
    }));
  }

  var copyBtn=makeBtn("Copy Text","📋","#9CA3AF",function(){
    navigator.clipboard.writeText(caption).then(function(){
      copyBtn.textContent="✅ Copied!";setTimeout(function(){copyBtn.textContent="📋 Copy Text";},2000);
    });
  });
  bar.appendChild(copyBtn);

  return bar;
}

// --- CHAT STATE (agent-aware) ------------------------------------------------
if(!chatState.agentId)chatState.agentId="general";
if(!chatState.agentMsgs)chatState.agentMsgs={};

function getAgentMsgs(agentId){
  if(!chatState.agentMsgs[agentId]){
    var agent=AI_AGENTS.find(function(a){return a.id===agentId;});
    chatState.agentMsgs[agentId]=[{role:"assistant",text:agent?agent.name+".\n\n"+agent.desc+"\n\nHow can I help you?":"Ready."}];
  }
  return chatState.agentMsgs[agentId];
}

// --- CHAT TAB ----------------------------------------------------------------
function renderChat(){
  var cl=C();
  var wrap=div({display:"flex",flexDirection:"column",height:"calc(100vh - 130px)",padding:"0 20px",maxWidth:"640px",margin:"0 auto",width:"100%"});

  // Agent selector bar
  var agentBar=div({display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"10px",paddingTop:"8px",flexShrink:"0"});
  AI_AGENTS.forEach(function(agent){
    var active=chatState.agentId===agent.id;
    var btn=el("button",{style:{
      background:active?hexAlpha(agent.color,0.15):"transparent",
      border:"1px solid "+(active?agent.color:cl.border),
      color:active?agent.color:cl.sub,
      padding:"6px 12px",borderRadius:"20px",fontSize:"11px",fontWeight:active?"700":"400",
      fontFamily:"'Space Grotesk',monospace",cursor:"pointer",whiteSpace:"nowrap",
      display:"flex",alignItems:"center",gap:"5px",transition:"all 0.2s"
    },onclick:function(){chatState.agentId=agent.id;render(true);}});
    btn.appendChild(document.createTextNode(agent.icon+" "+agent.name));
    agentBar.appendChild(btn);
  });
  wrap.appendChild(agentBar);

  // Active agent header
  var activeAgent=AI_AGENTS.find(function(a){return a.id===chatState.agentId;})||AI_AGENTS[0];
  var hdr=div({display:"flex",alignItems:"center",gap:"10px",padding:"8px 0 12px",borderBottom:"1px solid "+cl.border,marginBottom:"8px",flexShrink:"0"});
  var iconCircle=div({width:"36px",height:"36px",borderRadius:"10px",background:hexAlpha(activeAgent.color,0.15),border:"1px solid "+hexAlpha(activeAgent.color,0.3),display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:"0"});
  iconCircle.textContent=activeAgent.icon;
  hdr.appendChild(iconCircle);
  var hdrText=div({});
  hdrText.appendChild(div({color:activeAgent.color,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},activeAgent.name));
  hdrText.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},activeAgent.desc));
  hdr.appendChild(hdrText);
  wrap.appendChild(hdr);

  // Messages
  var msgs=getAgentMsgs(chatState.agentId);
  var msgsDiv=div({flex:"1",overflowY:"auto",display:"flex",flexDirection:"column",gap:"12px",paddingTop:"8px",paddingBottom:"12px",minHeight:"0"});
  msgs.forEach(function(m){
    var isA=m.role==="assistant";
    var row=div({display:"flex",justifyContent:isA?"flex-start":"flex-end",gap:"8px"});
    if(isA){
      var av=div({width:"28px",height:"28px",borderRadius:"7px",background:hexAlpha(activeAgent.color,0.15),display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",flexShrink:"0"});
      av.textContent=activeAgent.icon;
      row.appendChild(av);
    }
    var bubble=div({maxWidth:"84%",background:isA?cl.surface:hexAlpha(activeAgent.color,0.08),border:"1px solid "+(isA?cl.border:hexAlpha(activeAgent.color,0.2)),borderRadius:isA?"14px 14px 14px 0":"14px 14px 0 14px",padding:"11px 15px",color:cl.subHi,fontSize:"13px",lineHeight:"1.8",fontFamily:"'Inter',sans-serif"});
    if(isA){
      var displayText=m.text.replace(/```json\s*\{[\s\S]*?\}\s*```/g,"").replace(/\{"post"\s*:\s*\{"caption"\s*:[\s\S]*?"platform"\s*:\s*"[^"]*"\s*\}\s*\}/g,"").trim();
      var formatted=formatAIResponse(displayText,cl);
      if(formatted)bubble.appendChild(formatted);else{bubble.style.whiteSpace="pre-wrap";bubble.textContent=displayText;}
      if(chatState.agentId==="outreach"){
        var postData=extractPostJSON(m.text);
        if(postData){
          bubble.appendChild(buildPublishBar(postData,displayText,cl));
        }
      }
    }
    else{bubble.style.whiteSpace="pre-wrap";bubble.textContent=m.text;}
    row.appendChild(bubble);msgsDiv.appendChild(row);
  });
  if(chatState.loading){
    var row2=div({display:"flex",gap:"8px",alignItems:"center"});
    var av2=div({width:"28px",height:"28px",borderRadius:"7px",background:hexAlpha(activeAgent.color,0.15),display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"});
    av2.textContent=activeAgent.icon;row2.appendChild(av2);
    var dots=div({display:"flex",gap:"4px"});
    [0,1,2].forEach(function(j){dots.appendChild(div({width:"7px",height:"7px",borderRadius:"50%",background:activeAgent.color,animation:"bounce 1.1s "+(j*0.18)+"s infinite"}))});
    row2.appendChild(dots);msgsDiv.appendChild(row2);
  }
  wrap.appendChild(msgsDiv);

  // Suggestions (only when few messages)
  if(msgs.length<=1){
    var suggs=div({display:"flex",flexDirection:"column",gap:"7px",marginBottom:"10px"});
    activeAgent.suggestions.forEach(function(s){
      suggs.appendChild(el("button",{style:{background:hexAlpha(activeAgent.color,0.06),border:"1px solid "+hexAlpha(activeAgent.color,0.15),color:cl.sub,padding:"9px 14px",borderRadius:"10px",cursor:"pointer",fontSize:"12.5px",fontFamily:"'Inter',sans-serif",textAlign:"left"},onclick:function(){sendChat(s);}},s));
    });
    wrap.appendChild(suggs);
  }

  // Input row
  var inputRow=div({display:"flex",gap:"10px",alignItems:"center",background:cl.surface,border:"1px solid "+hexAlpha(activeAgent.color,0.3),borderRadius:"12px",padding:"10px 14px",marginBottom:"14px"});
  var chatInp=el("input",{style:{flex:"1",background:"transparent",border:"none",outline:"none",color:cl.white,fontSize:"13px",fontFamily:"'Inter',sans-serif",caretColor:activeAgent.color},placeholder:"Ask "+activeAgent.name+"…"});
  chatInp.value=chatState.input;
  chatInp.addEventListener("input",function(){chatState.input=chatInp.value;});
  chatInp.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}});
  inputRow.appendChild(chatInp);
  var sendBtn=el("button",{style:{background:"linear-gradient(135deg,"+activeAgent.color+","+hexAlpha(activeAgent.color,0.6)+")",color:"#070B14",border:"none",width:"36px",height:"36px",borderRadius:"8px",cursor:"pointer",fontSize:"14px",fontWeight:"800"},onclick:function(){sendChat();}},"→");
  inputRow.appendChild(sendBtn);
  wrap.appendChild(inputRow);

  setTimeout(function(){msgsDiv.scrollTop=msgsDiv.scrollHeight;},50);
  return wrap;
}

// --- SEND CHAT (agent-aware) -------------------------------------------------
async function sendChat(text){
  var t=text||chatState.input.trim();
  if(!t||chatState.loading)return;
  chatState.input="";
  var msgs=getAgentMsgs(chatState.agentId);
  msgs.push({role:"user",text:t});
  chatState.loading=true;render(true);
  try{
    var agent=AI_AGENTS.find(function(a){return a.id===chatState.agentId;})||AI_AGENTS[0];
    var history=msgs.slice(-10).map(function(m){return{role:m.role==="assistant"?"assistant":"user",content:m.text};});
    var reply=await askAI(history,agent.sys());
    msgs.push({role:"assistant",text:reply});
  }catch(e){msgs.push({role:"assistant",text:"Error: "+e.message});}
  chatState.loading=false;render(true);
}
