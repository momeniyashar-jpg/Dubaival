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
  {id:"outreach",icon:"📣",name:"Outreach & Content",nameAr:"تولید محتوا",
    desc:"Generate social posts, ad copy, cold messages, email campaigns with real data",
    color:"#F97316",
    suggestions:["Write 5 Instagram posts about investing in JVC","Create a WhatsApp broadcast for Palm Jumeirah listings","Write Google Ads copy for Dubai property investment","Draft email campaign for Iranian investors in Dubai"],
    sys:function(){
      var hotAreas="";
      try{
        var ranked=Object.keys(AREAS).map(function(k){var a=AREAS[k];return{n:k,p:a.psf,y:a.y?((a.y[0]+a.y[1])/2):0,g:a.g?a.g[0]:0};}).sort(function(a,b){return(b.y+b.g)-(a.y+a.g);}).slice(0,20);
        hotAreas=ranked.map(function(a){return a.n+":PSF"+a.p+",Yield"+a.y.toFixed(1)+"%,Growth"+a.g+"%";}).join("|");
      }catch(e){}
      return "You are a Dubai real estate OUTREACH & CONTENT SPECIALIST.\n"+
        "You create high-converting marketing content using REAL market data.\n"+
        "Hot areas: "+hotAreas+"\n\n"+
        "CONTENT TYPES YOU CREATE:\n\n"+
        "📱 SOCIAL MEDIA (Instagram/LinkedIn/X/TikTok):\n"+
        "- Use hooks that stop scrolling: numbers, questions, bold claims backed by data\n"+
        "- Include specific AED figures, yield %, growth % from our database\n"+
        "- Add relevant hashtags: #DubaiRealEstate #DubaiInvestment #PropertyDubai etc.\n"+
        "- Format for each platform (IG: carousel slides, LinkedIn: long-form, X: thread)\n"+
        "- Include CTA: 'Free valuation at DubaiVal.com' or 'DM for analysis'\n\n"+
        "📧 EMAIL CAMPAIGNS:\n"+
        "- Subject line (A/B variants)\n"+
        "- Personalized opening\n"+
        "- Value-first body with market data\n"+
        "- Clear CTA button text\n"+
        "- P.S. line with urgency\n\n"+
        "💬 WHATSAPP/COLD MESSAGES:\n"+
        "- Short, personal, value-led\n"+
        "- Include one specific data point to build credibility\n"+
        "- Soft CTA (question, not hard sell)\n\n"+
        "🎯 AD COPY (Google/Meta):\n"+
        "- Headline (30 chars), Description (90 chars), Display URL\n"+
        "- Multiple variants for A/B testing\n"+
        "- Target audience segments\n\n"+
        "RULES:\n"+
        "- ALWAYS use real numbers from our database — never make up statistics\n"+
        "- Tailor content to the specified audience (investors, end-users, expats, specific nationalities)\n"+
        "- If asked in Farsi/Arabic, write content in that language\n"+
        "- Include 'Powered by DubAIVal.com' or 'Source: DubAIVal Market Data' naturally\n"+
        "- Generate multiple variants when asked\n"+
        "- Suggest posting schedule and best times for Dubai audience";
    }
  }
];

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
    if(isA){var formatted=formatAIResponse(m.text,cl);if(formatted)bubble.appendChild(formatted);else{bubble.style.whiteSpace="pre-wrap";bubble.textContent=m.text;}}
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
