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
        "```json\n{\"post\":{\"caption\":\"THE FULL POST TEXT WITH EMOJIS AND HASHTAGS\",\"platform\":\"instagram\",\"type\":\"post\",\"imageCount\":1}}\n```\n\n"+
        "Platform options: \"instagram\", \"facebook\", \"whatsapp\", \"all\"\n"+
        "Type options: \"post\" (default), \"story\", \"reel\"\n"+
        "If user says 'all platforms' or doesn't specify, use \"all\".\n"+
        "imageCount: number of images (1-10). If user asks for multiple images or carousel, set this. Default 1.\n"+
        "If user says '5 images' or 'carousel' or 'multiple photos', set imageCount accordingly.\n"+
        "If user says 'story' or 'status', set type to \"story\".\n"+
        "If user says 'reel' or 'video', set type to \"reel\".\n\n"+
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
        "- Suggest best posting time for Dubai audience (10AM, 1PM, 7PM GST)"+
        getBrandPrompt();
    }
  }
];

// --- PERSONAL BRANDING -------------------------------------------------------
function getBrandProfile(){
  try{var d=localStorage.getItem("dv_brand_profile");return d?JSON.parse(d):null;}catch(e){return null;}
}
function saveBrandProfile(p){
  localStorage.setItem("dv_brand_profile",JSON.stringify(p));
}
function getBrandPrompt(){
  var p=getBrandProfile();
  if(!p)return"";
  var parts=["\n\n--- PERSONAL BRAND PROFILE (ALWAYS apply this to EVERY post) ---"];
  if(p.name)parts.push("Agent Name: "+p.name);
  if(p.agency)parts.push("Agency/Company: "+p.agency);
  if(p.reraId)parts.push("RERA BRN: "+p.reraId);
  if(p.phone)parts.push("Phone/WhatsApp: "+p.phone);
  if(p.email)parts.push("Email: "+p.email);
  if(p.website)parts.push("Website: "+p.website);
  if(p.igHandle)parts.push("Instagram: @"+p.igHandle.replace(/^@/,""));
  if(p.tone)parts.push("Tone of Voice: "+p.tone);
  if(p.language)parts.push("Default Language: "+p.language);
  if(p.targetAudience)parts.push("Target Audience: "+p.targetAudience);
  if(p.specialties)parts.push("Specialty Areas: "+p.specialties);
  if(p.bio)parts.push("Agent Bio/Tagline: "+p.bio);
  if(p.signature)parts.push("Signature/Closing Line: "+p.signature);
  if(p.hashtags)parts.push("Brand Hashtags (always include): "+p.hashtags);
  if(p.ctaStyle)parts.push("CTA Style: "+p.ctaStyle);
  parts.push("\nBRANDING RULES:");
  parts.push("- ALWAYS sign posts with the agent's name and contact info");
  parts.push("- ALWAYS use the specified tone of voice consistently");
  parts.push("- ALWAYS include brand hashtags in addition to topic hashtags");
  parts.push("- If a signature line is set, ALWAYS end posts with it");
  parts.push("- If Instagram handle is set, mention it instead of @dubaiaivaluation");
  parts.push("- Match the target audience's interests and language level");
  parts.push("- Reflect the agent's specialty areas when relevant");
  parts.push("--- END BRAND PROFILE ---");
  return parts.join("\n");
}

function showBrandingSetup(){
  var existing=document.getElementById("branding-setup-modal");
  if(existing)existing.remove();
  var profile=getBrandProfile()||{};
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.75)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"20px 0"},id:"branding-setup-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #F97316",borderRadius:"16px",padding:"24px",width:"420px",maxWidth:"92vw",maxHeight:"85vh",overflowY:"auto"});
  var title=el("h3",{style:{color:"#F97316",margin:"0 0 4px",fontSize:"16px",fontFamily:"'Space Grotesk',monospace"}});
  title.textContent="🎨 Personal Brand Profile";
  card.appendChild(title);
  var subtitle=el("p",{style:{color:"#8899AA",fontSize:"11px",margin:"0 0 16px",fontFamily:"'Inter',sans-serif"}});
  subtitle.textContent="AI will customize every post to match YOUR brand personality";
  card.appendChild(subtitle);

  var aiAutoBtn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,#8B5CF6,#A78BFA)",color:"#FFF",border:"none",borderRadius:"10px",padding:"12px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",marginBottom:"16px",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"},onclick:function(){overlay.remove();runBehavioralProfiling();}});
  aiAutoBtn.textContent="🧠 AI Auto-Fill from Instagram — Analyze my posts & build profile";
  card.appendChild(aiAutoBtn);

  var sections=[
    {header:"👤 Identity",fields:[
      {key:"name",label:"Your Name",ph:"e.g. Sarah Al-Maktoum",type:"text"},
      {key:"agency",label:"Agency / Company",ph:"e.g. Luxury Living Dubai",type:"text"},
      {key:"reraId",label:"RERA BRN (optional)",ph:"e.g. 12345",type:"text"}
    ]},
    {header:"📱 Contact Info (shown in posts)",fields:[
      {key:"phone",label:"Phone / WhatsApp",ph:"+971 50 xxx xxxx",type:"text"},
      {key:"email",label:"Email",ph:"you@agency.com",type:"text"},
      {key:"website",label:"Website",ph:"www.youragency.com",type:"text"},
      {key:"igHandle",label:"Instagram Handle",ph:"@yourbrand",type:"text"}
    ]},
    {header:"🎭 Brand Personality",fields:[
      {key:"tone",label:"Tone of Voice",ph:"",type:"select",options:["Professional & Authoritative","Friendly & Approachable","Luxury & Exclusive","Data-Driven & Analytical","Casual & Relatable","Bold & Confident","Warm & Trustworthy","Elegant & Sophisticated"]},
      {key:"language",label:"Default Content Language",ph:"",type:"select",options:["English","فارسی (Farsi)","العربية (Arabic)","English + Arabic Mix","English + Farsi Mix","Multilingual"]},
      {key:"targetAudience",label:"Target Audience",ph:"",type:"select",options:["International Investors","UAE Residents Upgrading","First-Time Buyers","High Net Worth Individuals","Expat Families","Golden Visa Seekers","Rental Investors","Luxury Buyers"]},
      {key:"specialties",label:"Specialty Areas (comma separated)",ph:"e.g. Palm Jumeirah, Downtown, Off-plan",type:"text"}
    ]},
    {header:"✍️ Content Style",fields:[
      {key:"bio",label:"Your Tagline / Bio",ph:"e.g. Dubai's #1 Investment Advisor | 10+ Years Experience",type:"textarea"},
      {key:"signature",label:"Signature Closing Line",ph:"e.g. 📞 Call me for exclusive deals | +971 50 xxx xxxx",type:"textarea"},
      {key:"hashtags",label:"Brand Hashtags (always included)",ph:"e.g. #YourBrand #DubaiLuxury #YourAgency",type:"text"},
      {key:"ctaStyle",label:"Preferred Call-to-Action",ph:"",type:"select",options:["DM me for details 📩","Call/WhatsApp for private viewing 📞","Link in bio for more 🔗","Comment 'INFO' for exclusive access 💬","Book a free consultation today 📅","Reply to this post for pricing 💰"]}
    ]}
  ];

  var inputs={};
  sections.forEach(function(sec){
    var secHeader=el("div",{style:{color:"#C9A84C",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",margin:"16px 0 8px",padding:"4px 0",borderBottom:"1px solid #2A3040"}});
    secHeader.textContent=sec.header;
    card.appendChild(secHeader);
    sec.fields.forEach(function(f){
      var lbl=el("label",{style:{color:"#8899AA",fontSize:"11px",display:"block",marginBottom:"3px",fontFamily:"'Space Grotesk',monospace"}});
      lbl.textContent=f.label;
      card.appendChild(lbl);
      var inp;
      if(f.type==="select"){
        inp=el("select",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px 10px",color:"#E0E0E0",fontSize:"12px",marginBottom:"10px",fontFamily:"monospace",boxSizing:"border-box",appearance:"auto"}});
        var defOpt=el("option");defOpt.value="";defOpt.textContent="— Select —";inp.appendChild(defOpt);
        f.options.forEach(function(o){
          var opt=el("option");opt.value=o;opt.textContent=o;
          if(profile[f.key]===o)opt.selected=true;
          inp.appendChild(opt);
        });
      }else if(f.type==="textarea"){
        inp=el("textarea",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px 10px",color:"#E0E0E0",fontSize:"12px",marginBottom:"10px",fontFamily:"monospace",boxSizing:"border-box",resize:"vertical",minHeight:"48px"},placeholder:f.ph});
        inp.value=profile[f.key]||"";
      }else{
        inp=el("input",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px 10px",color:"#E0E0E0",fontSize:"12px",marginBottom:"10px",fontFamily:"monospace",boxSizing:"border-box"},placeholder:f.ph,value:profile[f.key]||""});
      }
      card.appendChild(inp);
      inputs[f.key]=inp;
    });
  });

  var previewSection=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"10px",padding:"12px",margin:"16px 0 8px"});
  var previewTitle=el("div",{style:{color:"#F97316",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"}});
  previewTitle.textContent="📋 Profile Preview";
  previewSection.appendChild(previewTitle);
  var previewText=el("div",{style:{color:"#8899AA",fontSize:"11px",fontFamily:"monospace",lineHeight:"1.6",whiteSpace:"pre-wrap"},id:"brand-preview-text"});
  previewText.textContent="Fill in fields above to see your brand profile...";
  previewSection.appendChild(previewText);
  card.appendChild(previewSection);

  function updatePreview(){
    var lines=[];
    var n=inputs.name?inputs.name.value.trim():"";
    var ag=inputs.agency?inputs.agency.value.trim():"";
    if(n)lines.push("👤 "+n+(ag?" | "+ag:""));
    var tone=inputs.tone?inputs.tone.value:"";
    if(tone)lines.push("🎭 "+tone);
    var lang=inputs.language?inputs.language.value:"";
    if(lang)lines.push("🌐 "+lang);
    var ta=inputs.targetAudience?inputs.targetAudience.value:"";
    if(ta)lines.push("🎯 "+ta);
    var sig=inputs.signature?inputs.signature.value.trim():"";
    if(sig)lines.push("✍️ "+sig);
    var ht=inputs.hashtags?inputs.hashtags.value.trim():"";
    if(ht)lines.push("# "+ht);
    previewText.textContent=lines.length?lines.join("\n"):"Fill in fields above...";
  }
  Object.keys(inputs).forEach(function(k){
    inputs[k].addEventListener("input",updatePreview);
    inputs[k].addEventListener("change",updatePreview);
  });
  updatePreview();

  var btnRow=div({display:"flex",gap:"8px",marginTop:"12px"});
  var saveBtn=el("button",{style:{flex:1,background:"linear-gradient(135deg,#F97316,#FB923C)",color:"#000",border:"none",borderRadius:"10px",padding:"12px",fontSize:"13px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:function(){
    var p={};
    Object.keys(inputs).forEach(function(k){
      var v=inputs[k].value?inputs[k].value.trim():"";
      if(v)p[k]=v;
    });
    saveBrandProfile(p);
    overlay.remove();
    if(Object.keys(p).length>0){
      var toast=div({position:"fixed",bottom:"80px",left:"50%",transform:"translateX(-50%)",background:"#F97316",color:"#000",padding:"10px 20px",borderRadius:"10px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",zIndex:10000,boxShadow:"0 4px 20px rgba(249,115,22,0.4)"});
      toast.textContent="✅ Brand profile saved — AI will personalize all posts!";
      document.body.appendChild(toast);
      setTimeout(function(){toast.remove();},3000);
    }
  }});
  saveBtn.textContent="💾 Save Brand Profile";
  var clearBtn=el("button",{style:{background:"#EF4444",color:"#FFF",border:"none",borderRadius:"10px",padding:"12px 16px",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:function(){
    if(confirm("Clear your brand profile?")){
      localStorage.removeItem("dv_brand_profile");
      overlay.remove();
    }
  }});
  clearBtn.textContent="🗑️";
  var cancelBtn=el("button",{style:{background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"10px",padding:"12px 16px",fontSize:"12px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:function(){overlay.remove();}});
  cancelBtn.textContent="Cancel";
  btnRow.appendChild(saveBtn);btnRow.appendChild(clearBtn);btnRow.appendChild(cancelBtn);
  card.appendChild(btnRow);
  overlay.appendChild(card);
  overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- BEHAVIORAL PROFILING (AI Auto-Persona) ----------------------------------
async function fetchIGPosts(){
  var token=localStorage.getItem("dv_ig_token");
  var igId=localStorage.getItem("dv_ig_id");
  if(!token||!igId)return null;
  try{
    var r=await fetch("https://graph.facebook.com/v25.0/"+igId+"/media?fields=caption,timestamp,like_count,comments_count,media_type&limit=25&access_token="+token);
    if(!r.ok)return null;
    var d=await r.json();
    return d.data||[];
  }catch(e){return null;}
}

async function fetchIGProfile(){
  var token=localStorage.getItem("dv_ig_token");
  var igId=localStorage.getItem("dv_ig_id");
  if(!token||!igId)return null;
  try{
    var r=await fetch("https://graph.facebook.com/v25.0/"+igId+"?fields=name,username,biography,followers_count,follows_count,media_count&access_token="+token);
    if(!r.ok)return null;
    return await r.json();
  }catch(e){return null;}
}

async function analyzeWithGemini(profileData,posts){
  var geminiKey=localStorage.getItem("dv_gemini_key");
  if(!geminiKey)return null;
  var postSummary=posts.slice(0,20).map(function(p,i){
    return(i+1)+". "+(p.caption||"(no caption)").substring(0,200)+" [Likes:"+((p.like_count)||0)+", Comments:"+((p.comments_count)||0)+", Type:"+(p.media_type||"IMAGE")+"]";
  }).join("\n");
  var prompt="You are a social media behavioral analyst. Analyze this Instagram account and create a detailed persona profile.\n\n"+
    "ACCOUNT INFO:\n"+
    "Name: "+(profileData.name||"Unknown")+"\n"+
    "Username: @"+(profileData.username||"unknown")+"\n"+
    "Bio: "+(profileData.biography||"None")+"\n"+
    "Followers: "+(profileData.followers_count||0)+"\n"+
    "Following: "+(profileData.follows_count||0)+"\n"+
    "Total Posts: "+(profileData.media_count||0)+"\n\n"+
    "RECENT POSTS (last 20):\n"+postSummary+"\n\n"+
    "Based on the captions, engagement patterns, content type, and overall presence, provide a JSON response with EXACTLY this format:\n"+
    "```json\n{\n"+
    "  \"tone\": \"one of: Professional & Authoritative, Friendly & Approachable, Luxury & Exclusive, Data-Driven & Analytical, Casual & Relatable, Bold & Confident, Warm & Trustworthy, Elegant & Sophisticated\",\n"+
    "  \"language\": \"primary content language detected\",\n"+
    "  \"targetAudience\": \"one of: International Investors, UAE Residents Upgrading, First-Time Buyers, High Net Worth Individuals, Expat Families, Golden Visa Seekers, Rental Investors, Luxury Buyers\",\n"+
    "  \"specialties\": \"detected specialty areas/topics (comma separated)\",\n"+
    "  \"bio\": \"suggested professional tagline based on their posting style\",\n"+
    "  \"signature\": \"suggested signature closing line for posts\",\n"+
    "  \"hashtags\": \"top 5 brand-relevant hashtags they use or should use\",\n"+
    "  \"ctaStyle\": \"one of: DM me for details 📩, Call/WhatsApp for private viewing 📞, Link in bio for more 🔗, Comment 'INFO' for exclusive access 💬, Book a free consultation today 📅, Reply to this post for pricing 💰\",\n"+
    "  \"contentStyle\": \"brief description of their content personality\",\n"+
    "  \"postingFrequency\": \"how often they post\",\n"+
    "  \"strongTopics\": \"their strongest content themes\",\n"+
    "  \"engagementLevel\": \"low/medium/high based on likes/comments ratio\",\n"+
    "  \"audienceType\": \"who seems to follow them\"\n"+
    "}\n```\n"+
    "Be specific and derive insights ONLY from the actual data provided. Do not fabricate.";

  try{
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.3}})
    });
    if(!r.ok)return null;
    var d=await r.json();
    var text=d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts&&d.candidates[0].content.parts[0]&&d.candidates[0].content.parts[0].text;
    if(!text)return null;
    var jsonMatch=text.match(/```json\s*([\s\S]*?)\s*```/);
    if(jsonMatch)return JSON.parse(jsonMatch[1]);
    var braceMatch=text.match(/\{[\s\S]*\}/);
    if(braceMatch)return JSON.parse(braceMatch[0]);
    return null;
  }catch(e){return null;}
}

async function runBehavioralProfiling(){
  var token=localStorage.getItem("dv_ig_token");
  var igId=localStorage.getItem("dv_ig_id");
  var geminiKey=localStorage.getItem("dv_gemini_key");
  if(!token||!igId){alert("⚙️ First connect your Instagram in Social Setup");return;}
  if(!geminiKey){alert("⚙️ First add your Gemini API key in Social Setup");return;}

  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.8)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"},id:"profiling-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #8B5CF6",borderRadius:"16px",padding:"32px",width:"400px",maxWidth:"90vw",textAlign:"center"});
  var spinner=div({fontSize:"40px",marginBottom:"12px"});
  spinner.textContent="🧠";
  spinner.style.animation="bounce 1s infinite";
  card.appendChild(spinner);
  var statusText=el("div",{style:{color:"#8B5CF6",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"}});
  statusText.textContent="Analyzing Your Instagram...";
  card.appendChild(statusText);
  var detailText=el("div",{style:{color:"#8899AA",fontSize:"11px",fontFamily:"'Inter',sans-serif"}});
  detailText.textContent="Reading your posts, engagement & content style";
  card.appendChild(detailText);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  try{
    statusText.textContent="📡 Fetching your profile...";
    var profile=await fetchIGProfile();
    if(!profile){statusText.textContent="❌ Could not fetch profile";detailText.textContent="Check your Page Access Token";setTimeout(function(){overlay.remove();},3000);return;}

    statusText.textContent="📑 Reading your posts...";
    detailText.textContent="Analyzing captions, engagement & media types";
    var posts=await fetchIGPosts();
    if(!posts||posts.length===0){statusText.textContent="❌ No posts found";detailText.textContent="Your account needs at least a few posts for analysis";setTimeout(function(){overlay.remove();},3000);return;}

    statusText.textContent="🤖 AI analyzing your persona...";
    detailText.textContent="Gemini is building your behavioral profile from "+posts.length+" posts";
    var analysis=await analyzeWithGemini(profile,posts);
    if(!analysis){statusText.textContent="❌ AI analysis failed";detailText.textContent="Try again or check Gemini API key";setTimeout(function(){overlay.remove();},3000);return;}

    var existing=getBrandProfile()||{};
    if(profile.name&&!existing.name)existing.name=profile.name;
    if(profile.username)existing.igHandle=profile.username;
    if(analysis.tone)existing.tone=analysis.tone;
    if(analysis.language)existing.language=analysis.language;
    if(analysis.targetAudience)existing.targetAudience=analysis.targetAudience;
    if(analysis.specialties)existing.specialties=analysis.specialties;
    if(analysis.bio&&!existing.bio)existing.bio=analysis.bio;
    if(analysis.signature&&!existing.signature)existing.signature=analysis.signature;
    if(analysis.hashtags)existing.hashtags=analysis.hashtags;
    if(analysis.ctaStyle)existing.ctaStyle=analysis.ctaStyle;
    saveBrandProfile(existing);

    card.innerHTML="";
    var successIcon=div({fontSize:"40px",marginBottom:"8px"});
    successIcon.textContent="✅";
    card.appendChild(successIcon);
    var successTitle=el("div",{style:{color:"#10B981",fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"}});
    successTitle.textContent="Profile Built!";
    card.appendChild(successTitle);

    var resultBox=div({background:"#0D1117",borderRadius:"10px",padding:"14px",textAlign:"left",marginBottom:"14px"});
    var fields=[
      ["👤 Account","@"+(profile.username||"")+" ("+((profile.followers_count)||0)+" followers)"],
      ["📊 Posts Analyzed",""+posts.length],
      ["🎭 Tone",analysis.tone||"—"],
      ["🌐 Language",analysis.language||"—"],
      ["🎯 Audience",analysis.targetAudience||"—"],
      ["📌 Topics",analysis.strongTopics||analysis.specialties||"—"],
      ["💡 Content Style",analysis.contentStyle||"—"],
      ["📈 Engagement",analysis.engagementLevel||"—"],
      ["⏰ Frequency",analysis.postingFrequency||"—"]
    ];
    fields.forEach(function(f){
      var row=div({display:"flex",gap:"8px",marginBottom:"6px",fontSize:"11px",fontFamily:"'Inter',sans-serif"});
      row.appendChild(el("span",{style:{color:"#8B5CF6",fontWeight:"600",minWidth:"110px",flexShrink:"0"}},f[0]));
      row.appendChild(el("span",{style:{color:"#E0E0E0"}},f[1]));
      resultBox.appendChild(row);
    });
    card.appendChild(resultBox);

    var editBtn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,#F97316,#FB923C)",color:"#000",border:"none",borderRadius:"10px",padding:"12px",fontSize:"13px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},onclick:function(){overlay.remove();showBrandingSetup();}});
    editBtn.textContent="🎨 Review & Edit Profile";
    card.appendChild(editBtn);

    var closeBtn=el("button",{style:{width:"100%",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"10px",padding:"10px",fontSize:"12px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:function(){overlay.remove();render(true);}});
    closeBtn.textContent="Done";
    card.appendChild(closeBtn);
  }catch(e){
    statusText.textContent="❌ Error: "+e.message;
    setTimeout(function(){overlay.remove();},4000);
  }
}

// --- SOCIAL MEDIA PUBLISHER --------------------------------------------------
var SOCIAL_STATE={publishing:false,lastResult:null};
var GRAPH_BASE="https://graph.facebook.com/v25.0/";

function getSocialCreds(){
  var t=localStorage.getItem("dv_ig_token");
  var ig=localStorage.getItem("dv_ig_id");
  var fb=localStorage.getItem("dv_fb_id");
  if(!t||!ig)return null;
  return{token:t,igId:ig,fbId:fb||"",pexels:localStorage.getItem("dv_pexels_key")||""};
}

// --- AI VIDEO EDITOR ---------------------------------------------------------
var VIDEO_EDITOR_STATE={file:null,url:null,duration:0,trimStart:0,trimEnd:30,subtitles:[],caption:"",processing:false};

function showVideoEditor(){
  var existing=document.getElementById("video-editor-modal");
  if(existing)existing.remove();
  VIDEO_EDITOR_STATE={file:null,url:null,duration:0,trimStart:0,trimEnd:30,subtitles:[],caption:"",processing:false};

  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"video-editor-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #EC4899",borderRadius:"16px",padding:"20px",width:"480px",maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"});

  var title=el("h3",{style:{color:"#EC4899",margin:"0 0 4px",fontSize:"16px",fontFamily:"'Space Grotesk',monospace"}});
  title.textContent="🎬 AI Video Editor";
  card.appendChild(title);
  var subtitle=el("p",{style:{color:"#8899AA",fontSize:"11px",margin:"0 0 14px",fontFamily:"'Inter',sans-serif"}});
  subtitle.textContent="Upload → AI trim → subtitles → music → publish";
  card.appendChild(subtitle);

  // Step 1: Upload
  var uploadZone=div({background:"#0D1117",border:"2px dashed #EC4899",borderRadius:"12px",padding:"30px",textAlign:"center",cursor:"pointer",transition:"all 0.2s"});
  uploadZone.innerHTML="<div style='font-size:32px;margin-bottom:8px'>📹</div><div style='color:#EC4899;font-size:13px;font-weight:700;font-family:Space Grotesk,monospace'>Drop video or click to upload</div><div style='color:#8899AA;font-size:10px;margin-top:4px'>MP4, MOV, WebM — Max 100MB</div>";
  var fileInput=el("input",{type:"file",accept:"video/*",style:{display:"none"}});
  uploadZone.onclick=function(){fileInput.click();};
  card.appendChild(uploadZone);
  card.appendChild(fileInput);

  // Preview + Controls container
  var editorUI=div({display:"none",marginTop:"14px"});

  // Video Preview
  var videoWrap=div({position:"relative",borderRadius:"10px",overflow:"hidden",background:"#000",marginBottom:"12px"});
  var video=el("video",{style:{width:"100%",maxHeight:"260px",display:"block",borderRadius:"10px"},controls:true,playsInline:true});
  videoWrap.appendChild(video);
  editorUI.appendChild(videoWrap);

  // Trim Controls
  var trimSection=div({background:"#0D1117",borderRadius:"10px",padding:"12px",marginBottom:"10px"});
  trimSection.appendChild(el("div",{style:{color:"#EC4899",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"}},"✂️ Trim"));
  var trimRow=div({display:"flex",gap:"10px",alignItems:"center"});

  var startLabel=el("span",{style:{color:"#8899AA",fontSize:"10px",fontFamily:"monospace",minWidth:"36px"}},"Start:");
  var startInp=el("input",{type:"number",min:0,step:0.5,value:0,style:{width:"60px",background:"#1A1F2E",border:"1px solid #2A3040",borderRadius:"6px",padding:"4px 6px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",textAlign:"center"}});
  var endLabel=el("span",{style:{color:"#8899AA",fontSize:"10px",fontFamily:"monospace",minWidth:"36px"}},"End:");
  var endInp=el("input",{type:"number",min:1,step:0.5,value:30,style:{width:"60px",background:"#1A1F2E",border:"1px solid #2A3040",borderRadius:"6px",padding:"4px 6px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",textAlign:"center"}});
  var durLabel=el("span",{style:{color:"#C9A84C",fontSize:"10px",fontFamily:"monospace"}});
  durLabel.textContent="Duration: 30.0s";

  trimRow.appendChild(startLabel);trimRow.appendChild(startInp);
  trimRow.appendChild(endLabel);trimRow.appendChild(endInp);
  trimRow.appendChild(durLabel);
  trimSection.appendChild(trimRow);

  var trimSlider=el("input",{type:"range",min:0,max:100,value:0,style:{width:"100%",marginTop:"8px",accentColor:"#EC4899"}});
  trimSection.appendChild(trimSlider);
  editorUI.appendChild(trimSection);

  function updateDur(){
    var s=parseFloat(startInp.value)||0;
    var e=parseFloat(endInp.value)||30;
    durLabel.textContent="Duration: "+(e-s).toFixed(1)+"s";
    VIDEO_EDITOR_STATE.trimStart=s;
    VIDEO_EDITOR_STATE.trimEnd=e;
  }
  startInp.oninput=updateDur;endInp.oninput=updateDur;
  trimSlider.oninput=function(){
    var pct=parseFloat(trimSlider.value)/100;
    var dur=VIDEO_EDITOR_STATE.duration;
    startInp.value=(pct*Math.max(0,dur-30)).toFixed(1);
    endInp.value=(parseFloat(startInp.value)+Math.min(30,dur)).toFixed(1);
    updateDur();
    video.currentTime=parseFloat(startInp.value);
  };

  // AI Auto-Trim button
  var aiTrimBtn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,#8B5CF6,#A78BFA)",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},onclick:async function(){
    var geminiKey=localStorage.getItem("dv_gemini_key");
    if(!geminiKey){alert("Add Gemini API key in Setup first");return;}
    aiTrimBtn.textContent="🤖 Analyzing video...";aiTrimBtn.disabled=true;
    try{
      var dur=VIDEO_EDITOR_STATE.duration;
      var canvas=document.createElement("canvas");
      var ctx=canvas.getContext("2d");
      canvas.width=320;canvas.height=180;
      var frames=[];
      var frameCount=Math.min(8,Math.floor(dur));
      for(var i=0;i<frameCount;i++){
        var t=dur*(i/(frameCount-1||1));
        video.currentTime=t;
        await new Promise(function(r){video.onseeked=r;});
        ctx.drawImage(video,0,0,320,180);
        frames.push({time:t.toFixed(1),dataUrl:canvas.toDataURL("image/jpeg",0.5)});
      }
      var parts=frames.map(function(f){
        return{inlineData:{mimeType:"image/jpeg",data:f.dataUrl.split(",")[1]}};
      });
      parts.push({text:"These are "+frameCount+" frames from a real estate property video (each labeled with timestamp). The video is "+dur.toFixed(1)+"s long. I want to trim it to max 30 seconds for an Instagram Reel/Story. Analyze the frames and tell me:\n1. The best start and end timestamps for a compelling 15-30 second clip\n2. Which frames show the best content (interiors, views, amenities)\n3. A short engaging caption for the reel\n\nRespond in JSON:\n```json\n{\"trimStart\":0,\"trimEnd\":30,\"caption\":\"...\",\"reason\":\"...\"}\n```"});
      var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contents:[{parts:parts}],generationConfig:{temperature:0.3}})
      });
      if(r.ok){
        var d=await r.json();
        var txt=d.candidates&&d.candidates[0]&&d.candidates[0].content.parts[0].text;
        var jm=txt.match(/```json\s*([\s\S]*?)\s*```/);
        var obj=jm?JSON.parse(jm[1]):JSON.parse(txt.match(/\{[\s\S]*\}/)[0]);
        startInp.value=obj.trimStart||0;
        endInp.value=Math.min(obj.trimEnd||30,dur);
        updateDur();
        if(obj.caption)captionInp.value=obj.caption;
        VIDEO_EDITOR_STATE.caption=obj.caption||"";
        video.currentTime=parseFloat(startInp.value);
        aiTrimBtn.textContent="✅ AI suggested: "+obj.reason;
      }else{aiTrimBtn.textContent="❌ AI failed — try manual trim";}
    }catch(e){aiTrimBtn.textContent="❌ Error: "+e.message;}
    setTimeout(function(){aiTrimBtn.textContent="🤖 AI Smart Trim";aiTrimBtn.disabled=false;},4000);
  }});
  aiTrimBtn.textContent="🤖 AI Smart Trim";
  editorUI.appendChild(aiTrimBtn);

  // Subtitles
  var subSection=div({background:"#0D1117",borderRadius:"10px",padding:"12px",marginBottom:"10px"});
  subSection.appendChild(el("div",{style:{color:"#EC4899",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"}},"💬 Subtitles"));
  var subTextarea=el("textarea",{style:{width:"100%",background:"#1A1F2E",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",resize:"vertical",minHeight:"50px",boxSizing:"border-box"},placeholder:"Enter subtitles (one per line):\n0:00 Welcome to this stunning property\n0:05 Spacious living area with panoramic views"});
  subSection.appendChild(subTextarea);
  var aiSubBtn=el("button",{style:{width:"100%",marginTop:"6px",background:"linear-gradient(135deg,#8B5CF6,#A78BFA)",color:"#FFF",border:"none",borderRadius:"6px",padding:"8px",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:async function(){
    var geminiKey=localStorage.getItem("dv_gemini_key");
    if(!geminiKey){alert("Add Gemini API key first");return;}
    aiSubBtn.textContent="🤖 Generating...";aiSubBtn.disabled=true;
    try{
      var dur=VIDEO_EDITOR_STATE.trimEnd-VIDEO_EDITOR_STATE.trimStart;
      var bp=getBrandProfile();
      var prompt="Generate professional real estate video subtitles for a "+dur.toFixed(0)+"s Instagram Reel about a Dubai property."+(bp&&bp.tone?" Tone: "+bp.tone:"")+" Format: one subtitle per line with timestamp. Example:\n0:00 Discover luxury living in Dubai\n0:05 Stunning panoramic views\nGenerate 4-8 subtitles. Keep each under 8 words. Make them compelling and professional.";
      var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.7}})
      });
      if(r.ok){
        var d=await r.json();
        var txt=d.candidates[0].content.parts[0].text;
        var lines=txt.split("\n").filter(function(l){return l.match(/^\d+:\d+/);}).join("\n");
        subTextarea.value=lines;
        aiSubBtn.textContent="✅ Generated!";
      }else{aiSubBtn.textContent="❌ Failed";}
    }catch(e){aiSubBtn.textContent="❌ Error";}
    setTimeout(function(){aiSubBtn.textContent="🤖 AI Generate Subtitles";aiSubBtn.disabled=false;},3000);
  }});
  aiSubBtn.textContent="🤖 AI Generate Subtitles";
  subSection.appendChild(aiSubBtn);
  editorUI.appendChild(subSection);

  // Caption
  var captionSection=div({background:"#0D1117",borderRadius:"10px",padding:"12px",marginBottom:"10px"});
  captionSection.appendChild(el("div",{style:{color:"#EC4899",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"}},"📝 Caption"));
  var captionInp=el("textarea",{style:{width:"100%",background:"#1A1F2E",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",resize:"vertical",minHeight:"60px",boxSizing:"border-box"},placeholder:"Post caption with hashtags..."});
  captionSection.appendChild(captionInp);
  var aiCapBtn=el("button",{style:{width:"100%",marginTop:"6px",background:"linear-gradient(135deg,#F97316,#FB923C)",color:"#000",border:"none",borderRadius:"6px",padding:"8px",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:async function(){
    var geminiKey=localStorage.getItem("dv_gemini_key");
    if(!geminiKey){alert("Add Gemini API key first");return;}
    aiCapBtn.textContent="🤖 Writing...";aiCapBtn.disabled=true;
    try{
      var bp=getBrandProfile();
      var brandCtx=bp?(bp.tone?" Tone:"+bp.tone:"")+(bp.name?" Agent:"+bp.name:"")+(bp.hashtags?" Include these hashtags:"+bp.hashtags:""):"";
      var prompt="Write a professional Instagram Reel caption for a Dubai real estate property video."+brandCtx+" Include:\n- Compelling hook\n- 2-3 key selling points\n- Call to action\n- 5-8 relevant hashtags\nKeep it under 150 words. Make it engaging and professional.";
      var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.7}})
      });
      if(r.ok){
        var d=await r.json();
        captionInp.value=d.candidates[0].content.parts[0].text;
        aiCapBtn.textContent="✅ Generated!";
      }else{aiCapBtn.textContent="❌ Failed";}
    }catch(e){aiCapBtn.textContent="❌ Error";}
    setTimeout(function(){aiCapBtn.textContent="🤖 AI Write Caption";aiCapBtn.disabled=false;},3000);
  }});
  aiCapBtn.textContent="🤖 AI Write Caption";
  captionSection.appendChild(aiCapBtn);
  editorUI.appendChild(captionSection);

  // Process & Export
  var exportSection=div({marginBottom:"10px"});
  var processBtn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,#EC4899,#F472B6)",color:"#FFF",border:"none",borderRadius:"10px",padding:"14px",fontSize:"14px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},onclick:async function(){
    if(!VIDEO_EDITOR_STATE.file){alert("Upload a video first");return;}
    processBtn.textContent="⏳ Processing...";processBtn.disabled=true;
    VIDEO_EDITOR_STATE.processing=true;
    try{
      var s=VIDEO_EDITOR_STATE.trimStart;
      var e=VIDEO_EDITOR_STATE.trimEnd;
      var subs=subTextarea.value.trim().split("\n").filter(Boolean).map(function(l){
        var m=l.match(/^(\d+):(\d+)\s+(.*)/);
        if(m)return{time:parseInt(m[1])*60+parseInt(m[2]),text:m[3]};
        return null;
      }).filter(Boolean);

      var canvas=document.createElement("canvas");
      var ctx=canvas.getContext("2d");
      canvas.width=video.videoWidth||1080;
      canvas.height=video.videoHeight||1920;

      var stream=canvas.captureStream(30);
      if(video.captureStream){
        var audioTracks=video.captureStream().getAudioTracks();
        audioTracks.forEach(function(t){stream.addTrack(t);});
      }

      var chunks=[];
      var recorder=new MediaRecorder(stream,{mimeType:"video/webm;codecs=vp9",videoBitsPerSecond:4000000});
      recorder.ondataavailable=function(ev){if(ev.data.size>0)chunks.push(ev.data);};

      var done=new Promise(function(resolve){recorder.onstop=function(){resolve();};});
      video.currentTime=s;
      await new Promise(function(r){video.onseeked=r;});
      video.play();
      recorder.start();

      var drawFrame=function(){
        if(video.currentTime>=e||video.paused||video.ended){
          video.pause();recorder.stop();return;
        }
        ctx.drawImage(video,0,0,canvas.width,canvas.height);
        var elapsed=video.currentTime-s;
        var activeSub=null;
        for(var i=subs.length-1;i>=0;i--){
          if(elapsed>=subs[i].time){activeSub=subs[i].text;break;}
        }
        if(activeSub){
          var fSize=Math.round(canvas.width/22);
          ctx.font="bold "+fSize+"px 'Space Grotesk', sans-serif";
          ctx.textAlign="center";
          var tx=canvas.width/2;
          var ty=canvas.height-canvas.height*0.12;
          var tw=ctx.measureText(activeSub).width;
          ctx.fillStyle="rgba(0,0,0,0.7)";
          ctx.roundRect(tx-tw/2-16,ty-fSize-6,tw+32,fSize+20,8);
          ctx.fill();
          ctx.fillStyle="#FFFFFF";
          ctx.fillText(activeSub,tx,ty);
        }
        requestAnimationFrame(drawFrame);
      };
      requestAnimationFrame(drawFrame);
      await done;

      var blob=new Blob(chunks,{type:"video/webm"});
      var url=URL.createObjectURL(blob);
      VIDEO_EDITOR_STATE.processedUrl=url;
      VIDEO_EDITOR_STATE.processedBlob=blob;

      processBtn.textContent="✅ Ready!";

      var dlBtn=el("button",{style:{width:"100%",background:"#10B981",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},onclick:function(){
        var a=document.createElement("a");a.href=url;a.download="dubaival-reel.webm";a.click();
      }});
      dlBtn.textContent="⬇️ Download Video";
      exportSection.appendChild(dlBtn);

      var shareBtn=el("button",{style:{width:"100%",background:"#3B82F6",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},onclick:async function(){
        try{
          var file=new File([blob],"dubaival-reel.webm",{type:"video/webm"});
          await navigator.share({files:[file],title:"DubAIVal Reel",text:captionInp.value||""});
        }catch(err){
          var a=document.createElement("a");a.href=url;a.download="dubaival-reel.webm";a.click();
        }
      }});
      shareBtn.textContent="📤 Share (WhatsApp / Instagram / More)";
      exportSection.appendChild(shareBtn);

    }catch(err){
      processBtn.textContent="❌ Error: "+err.message;
    }
    VIDEO_EDITOR_STATE.processing=false;
    setTimeout(function(){processBtn.textContent="🎬 Process & Export";processBtn.disabled=false;},5000);
  }});
  processBtn.textContent="🎬 Process & Export";
  exportSection.appendChild(processBtn);
  editorUI.appendChild(exportSection);

  card.appendChild(editorUI);

  // Close button
  var closeBtn=el("button",{style:{width:"100%",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"10px",padding:"10px",fontSize:"12px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",marginTop:"6px"},onclick:function(){
    if(VIDEO_EDITOR_STATE.url)URL.revokeObjectURL(VIDEO_EDITOR_STATE.url);
    if(VIDEO_EDITOR_STATE.processedUrl)URL.revokeObjectURL(VIDEO_EDITOR_STATE.processedUrl);
    overlay.remove();
  }});
  closeBtn.textContent="Close";
  card.appendChild(closeBtn);

  // File handling
  fileInput.onchange=function(ev){
    var f=ev.target.files[0];
    if(!f)return;
    if(f.size>100*1024*1024){alert("File too large (max 100MB)");return;}
    VIDEO_EDITOR_STATE.file=f;
    VIDEO_EDITOR_STATE.url=URL.createObjectURL(f);
    video.src=VIDEO_EDITOR_STATE.url;
    video.onloadedmetadata=function(){
      VIDEO_EDITOR_STATE.duration=video.duration;
      endInp.value=Math.min(30,video.duration).toFixed(1);
      endInp.max=video.duration;
      startInp.max=video.duration;
      trimSlider.max=100;
      updateDur();
      uploadZone.style.display="none";
      editorUI.style.display="block";
    };
  };
  uploadZone.ondragover=function(ev){ev.preventDefault();uploadZone.style.borderColor="#F472B6";uploadZone.style.background="#1A1020";};
  uploadZone.ondragleave=function(){uploadZone.style.borderColor="#EC4899";uploadZone.style.background="#0D1117";};
  uploadZone.ondrop=function(ev){
    ev.preventDefault();
    uploadZone.style.borderColor="#EC4899";uploadZone.style.background="#0D1117";
    var f=ev.dataTransfer.files[0];
    if(f&&f.type.startsWith("video/")){
      fileInput.files=ev.dataTransfer.files;
      fileInput.onchange({target:{files:[f]}});
    }
  };

  overlay.appendChild(card);
  overlay.addEventListener("click",function(ev){if(ev.target===overlay){
    if(VIDEO_EDITOR_STATE.url)URL.revokeObjectURL(VIDEO_EDITOR_STATE.url);
    if(VIDEO_EDITOR_STATE.processedUrl)URL.revokeObjectURL(VIDEO_EDITOR_STATE.processedUrl);
    overlay.remove();
  }});
  document.body.appendChild(overlay);
}

// --- AI VIDEO GENERATOR (Text-to-Video) — PREMIUM ENGINE ---------------------
var VGEN={generating:false,progress:0,W:1080,H:1920,FPS:30};

function loadImg(url){
  return new Promise(function(resolve){
    var img=new Image();img.crossOrigin="anonymous";
    img.onload=function(){resolve(img);};
    img.onerror=function(){resolve(null);};
    img.src=url;
  });
}

// --- PROFESSIONAL EASING FUNCTIONS (spring, elastic, bounce, expo) ---
function easeInOut(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
function easeOut(t){return 1-Math.pow(1-t,4);}
function easeOutElastic(t){if(t===0||t===1)return t;return Math.pow(2,-10*t)*Math.sin((t-0.075)*2*Math.PI/0.3)+1;}
function easeOutBounce(t){if(t<1/2.75)return 7.5625*t*t;if(t<2/2.75){t-=1.5/2.75;return 7.5625*t*t+0.75;}if(t<2.5/2.75){t-=2.25/2.75;return 7.5625*t*t+0.9375;}t-=2.625/2.75;return 7.5625*t*t+0.984375;}
function easeOutExpo(t){return t===1?1:1-Math.pow(2,-10*t);}
function easeOutBack(t){var c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);}
function spring(t,tension,friction){tension=tension||0.5;friction=friction||0.7;return 1-Math.exp(-tension*t*10)*Math.cos(friction*t*10*Math.PI);}
function smoothstep(a,b,t){t=Math.max(0,Math.min(1,(t-a)/(b-a)));return t*t*(3-2*t);}

function drawRoundRect(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}

function drawGradBg(ctx,w,h,colors){
  var grd=ctx.createLinearGradient(0,0,0,h);
  grd.addColorStop(0,colors[0]||"#070B14");
  grd.addColorStop(0.5,colors[1]||"#0D1220");
  grd.addColorStop(1,colors[2]||"#070B14");
  ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);
}

function drawParticles(ctx,w,h,t,count){
  var pts=[];
  for(var i=0;i<count;i++){
    var px=(Math.sin(i*3.7+t*0.3)*0.5+0.5)*w;
    var py=((i*97.3+t*15)%h);
    var a=0.15+Math.sin(i*2.1+t*0.8)*0.1;
    var r=1.5+Math.sin(i*1.3+t*0.5)*1;
    pts.push({x:px,y:py});
    ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);
    var grd=ctx.createRadialGradient(px,py,0,px,py,r*3);
    grd.addColorStop(0,"rgba(201,168,76,"+a+")");
    grd.addColorStop(0.5,"rgba(201,168,76,"+(a*0.4)+")");
    grd.addColorStop(1,"rgba(201,168,76,0)");
    ctx.fillStyle=grd;ctx.fill();
    var trailLen=15+Math.sin(i*2.3)*8;
    var trailAngle=Math.atan2(Math.cos(i*1.7+t*0.4),Math.sin(i*2.9+t*0.3));
    ctx.save();ctx.globalAlpha=a*0.3;ctx.strokeStyle="rgba(201,168,76,"+a*0.2+")";ctx.lineWidth=0.5;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-Math.cos(trailAngle)*trailLen,py-Math.sin(trailAngle)*trailLen);ctx.stroke();
    ctx.restore();
  }
  ctx.save();ctx.lineWidth=0.5;
  for(var i=0;i<pts.length;i++){
    for(var j=i+1;j<pts.length;j++){
      var dx=pts[i].x-pts[j].x;var dy=pts[i].y-pts[j].y;
      var d=Math.sqrt(dx*dx+dy*dy);
      if(d<130){
        ctx.globalAlpha=(1-d/130)*0.06;ctx.strokeStyle="rgba(201,168,76,0.15)";
        ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.stroke();
      }
    }
  }
  ctx.globalAlpha=1;ctx.restore();
}

function drawLightRays(ctx,w,h,t){
  ctx.save();ctx.globalAlpha=0.04;
  for(var i=0;i<5;i++){
    var angle=Math.PI*0.3+i*0.15+Math.sin(t*0.2+i)*0.1;
    var x1=w*0.8;var y1=-50;
    ctx.beginPath();ctx.moveTo(x1,y1);
    ctx.lineTo(x1+Math.cos(angle)*h*1.5,y1+Math.sin(angle)*h*1.5);
    ctx.lineTo(x1+Math.cos(angle+0.05)*h*1.5,y1+Math.sin(angle+0.05)*h*1.5);
    ctx.closePath();
    var grd=ctx.createLinearGradient(x1,y1,x1+Math.cos(angle)*h,y1+Math.sin(angle)*h);
    grd.addColorStop(0,"rgba(201,168,76,0.3)");grd.addColorStop(1,"rgba(201,168,76,0)");
    ctx.fillStyle=grd;ctx.fill();
  }
  ctx.restore();
}

function drawGlowCircle(ctx,x,y,r,color,alpha){
  ctx.save();ctx.globalAlpha=alpha||0.15;
  var grd=ctx.createRadialGradient(x,y,0,x,y,r);
  grd.addColorStop(0,color);grd.addColorStop(0.4,color.replace(")",",0.3)").replace("rgb","rgba"));
  grd.addColorStop(1,"transparent");
  ctx.fillStyle=grd;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawNeonLine(ctx,x1,y1,x2,y2,color,width){
  ctx.save();
  ctx.shadowColor=color;ctx.shadowBlur=12;
  ctx.strokeStyle=color;ctx.lineWidth=width||2;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.shadowBlur=0;ctx.restore();
}

function drawAnimatedBar(ctx,x,y,maxW,h,pct,progress,color,label,value){
  var p=easeOutElastic(Math.min(progress*1.3,1));
  var barW=maxW*pct*p;
  ctx.save();
  drawRoundRect(ctx,x,y,maxW,h,h/2);
  ctx.fillStyle="rgba(255,255,255,0.04)";ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,0.08)";ctx.lineWidth=1;ctx.stroke();
  if(barW>2){
    var barGrd=ctx.createLinearGradient(x,y,x+barW,y);
    barGrd.addColorStop(0,color);barGrd.addColorStop(1,hexAlpha(color,0.7));
    drawRoundRect(ctx,x,y,barW,h,h/2);ctx.fillStyle=barGrd;ctx.fill();
    ctx.shadowColor=color;ctx.shadowBlur=8;
    drawRoundRect(ctx,x+barW-4,y+2,4,h-4,2);ctx.fillStyle=color;ctx.fill();
    ctx.shadowBlur=0;
    var shineGrd=ctx.createLinearGradient(x,y,x,y+h);
    shineGrd.addColorStop(0,"rgba(255,255,255,0.2)");shineGrd.addColorStop(0.5,"rgba(255,255,255,0)");
    drawRoundRect(ctx,x,y,barW,h/2,h/4);ctx.fillStyle=shineGrd;ctx.fill();
  }
  ctx.restore();
  ctx.font="bold "+Math.round(h*0.65)+"px 'Space Grotesk',sans-serif";
  ctx.fillStyle="#FFF";ctx.textAlign="left";ctx.fillText(label,x,y-10);
  ctx.textAlign="right";ctx.fillStyle=color;ctx.fillText(value,x+maxW,y-10);
}

function drawLineChart(ctx,x,y,w,h,data,progress,color){
  var p=easeOutExpo(Math.min(progress*1.2,1));
  var maxV=Math.max.apply(null,data.map(function(d){return d.v;}))||1;
  var stepX=w/(data.length-1||1);
  var points=[];
  for(var i=0;i<data.length;i++){
    points.push({x:x+stepX*i,y:y+h-(data[i].v/maxV)*h*p});
  }
  // Smooth bezier curve
  ctx.save();ctx.shadowColor=color;ctx.shadowBlur=10;
  ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
  for(var k=1;k<points.length;k++){
    var cpx=(points[k-1].x+points[k].x)/2;
    ctx.quadraticCurveTo(points[k-1].x+(stepX*0.4),points[k-1].y,cpx,(points[k-1].y+points[k].y)/2);
    ctx.quadraticCurveTo(points[k].x-(stepX*0.4),points[k].y,points[k].x,points[k].y);
  }
  ctx.strokeStyle=color;ctx.lineWidth=3.5;ctx.stroke();ctx.shadowBlur=0;ctx.restore();
  // Gradient fill
  ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
  for(var m=1;m<points.length;m++){
    var cpx2=(points[m-1].x+points[m].x)/2;
    ctx.quadraticCurveTo(points[m-1].x+(stepX*0.4),points[m-1].y,cpx2,(points[m-1].y+points[m].y)/2);
    ctx.quadraticCurveTo(points[m].x-(stepX*0.4),points[m].y,points[m].x,points[m].y);
  }
  ctx.lineTo(points[points.length-1].x,y+h);ctx.lineTo(x,y+h);ctx.closePath();
  var grd=ctx.createLinearGradient(0,y,0,y+h);
  grd.addColorStop(0,hexAlpha(color,0.25));grd.addColorStop(1,hexAlpha(color,0));
  ctx.fillStyle=grd;ctx.fill();
  // Data points with glow
  for(var j=0;j<points.length;j++){
    drawGlowCircle(ctx,points[j].x,points[j].y,20,color,0.2);
    ctx.beginPath();ctx.arc(points[j].x,points[j].y,6,0,Math.PI*2);
    ctx.fillStyle=color;ctx.fill();
    ctx.beginPath();ctx.arc(points[j].x,points[j].y,3,0,Math.PI*2);
    ctx.fillStyle="#FFF";ctx.fill();
    ctx.fillStyle="#CCC";ctx.font="bold 22px 'Space Grotesk',sans-serif";ctx.textAlign="center";
    ctx.fillText(data[j].l||"",points[j].x,y+h+28);
    ctx.fillStyle=color;ctx.font="bold 18px sans-serif";
    ctx.fillText(Math.round(data[j].v),points[j].x,points[j].y-16);
  }
}

function drawDonutChart(ctx,cx,cy,r,segments,progress){
  var total=segments.reduce(function(s,seg){return s+seg.v;},0)||1;
  var startA=-Math.PI/2;
  var p=easeOutBack(Math.min(progress*1.1,1));
  // Shadow ring
  ctx.save();ctx.globalAlpha=0.3;
  ctx.beginPath();ctx.arc(cx+3,cy+3,r+2,0,Math.PI*2);
  ctx.arc(cx+3,cy+3,r*0.58,0,Math.PI*2,true);ctx.closePath();
  ctx.fillStyle="#000";ctx.fill();ctx.restore();
  segments.forEach(function(seg){
    var angle=(seg.v/total)*Math.PI*2*p;
    if(angle<0.01)return;
    ctx.save();ctx.shadowColor=seg.c;ctx.shadowBlur=8;
    ctx.beginPath();ctx.arc(cx,cy,r,startA,startA+angle);
    ctx.arc(cx,cy,r*0.6,startA+angle,startA,true);ctx.closePath();
    var sGrd=ctx.createRadialGradient(cx,cy,r*0.6,cx,cy,r);
    sGrd.addColorStop(0,hexAlpha(seg.c,0.8));sGrd.addColorStop(1,seg.c);
    ctx.fillStyle=sGrd;ctx.fill();ctx.shadowBlur=0;
    // Shine
    ctx.beginPath();ctx.arc(cx,cy-2,r-2,startA,startA+angle);
    ctx.arc(cx,cy-2,r*0.75,startA+angle,startA,true);ctx.closePath();
    ctx.fillStyle="rgba(255,255,255,0.1)";ctx.fill();
    ctx.restore();
    if(angle>0.2){
      var midA=startA+angle/2;
      var lx=cx+Math.cos(midA)*(r*0.8);
      var ly=cy+Math.sin(midA)*(r*0.8);
      ctx.font="bold 24px 'Space Grotesk',sans-serif";ctx.fillStyle="#FFF";ctx.textAlign="center";
      ctx.fillText(Math.round(seg.v/total*100)+"%",lx,ly+8);
    }
    startA+=angle;
  });
  // Center label
  ctx.font="bold 36px 'Space Grotesk',sans-serif";ctx.fillStyle="#FFF";ctx.textAlign="center";
  ctx.fillText("Total",cx,cy-4);ctx.font="18px sans-serif";ctx.fillStyle="#8899AA";
  ctx.fillText(Math.round(total),cx,cy+22);
}

function drawGaugeChart(ctx,cx,cy,r,value,max,progress,color,label){
  var p=easeOutElastic(Math.min(progress*1.1,1));
  var pct=(value/max)*p;
  var startAngle=Math.PI*0.8;var arcLen=Math.PI*1.4;
  // Track
  ctx.beginPath();ctx.arc(cx,cy,r,startAngle,startAngle+arcLen);
  ctx.strokeStyle="rgba(255,255,255,0.06)";ctx.lineWidth=20;ctx.lineCap="round";ctx.stroke();
  // Tick marks
  for(var ti=0;ti<=10;ti++){
    var ta=startAngle+(arcLen*ti/10);
    var tx1=cx+Math.cos(ta)*(r-14);var ty1=cy+Math.sin(ta)*(r-14);
    var tx2=cx+Math.cos(ta)*(r+14);var ty2=cy+Math.sin(ta)*(r+14);
    ctx.beginPath();ctx.moveTo(tx1,ty1);ctx.lineTo(tx2,ty2);
    ctx.strokeStyle="rgba(255,255,255,0.1)";ctx.lineWidth=1;ctx.stroke();
  }
  // Value arc with neon glow
  ctx.save();ctx.shadowColor=color;ctx.shadowBlur=20;
  ctx.beginPath();ctx.arc(cx,cy,r,startAngle,startAngle+arcLen*pct);
  var aGrd=ctx.createLinearGradient(cx-r,cy,cx+r,cy);
  aGrd.addColorStop(0,hexAlpha(color,0.6));aGrd.addColorStop(1,color);
  ctx.strokeStyle=aGrd;ctx.lineWidth=20;ctx.lineCap="round";ctx.stroke();
  ctx.shadowBlur=0;ctx.restore();
  // Needle dot
  var needleA=startAngle+arcLen*pct;
  var nx=cx+Math.cos(needleA)*r;var ny=cy+Math.sin(needleA)*r;
  drawGlowCircle(ctx,nx,ny,15,color,0.4);
  ctx.beginPath();ctx.arc(nx,ny,6,0,Math.PI*2);ctx.fillStyle="#FFF";ctx.fill();
  // Center value
  ctx.font="bold 56px 'Space Grotesk',sans-serif";ctx.fillStyle="#FFF";ctx.textAlign="center";
  ctx.fillText(Math.round(value*p),cx,cy+14);
  ctx.font="18px sans-serif";ctx.fillStyle="#8899AA";
  ctx.fillText(label,cx,cy+42);
}

function kenBurns(ctx,img,w,h,progress,direction){
  var scale=1+0.12*easeInOut(progress);
  var dirs=[[-.05,0],[.05,0],[0,-.05],[0,.05],[-.03,-.03],[.03,.03],[-.03,.03],[.03,-.03]];
  var d=dirs[direction%dirs.length];
  var ox=w*d[0]*easeInOut(progress);
  var oy=h*d[1]*easeInOut(progress);
  var iw=img.width,ih=img.height;
  var aspect=w/h;var iAspect=iw/ih;
  var sw,sh,sx,sy;
  if(iAspect>aspect){sh=ih;sw=ih*aspect;sx=(iw-sw)/2;sy=0;}
  else{sw=iw;sh=iw/aspect;sx=0;sy=(ih-sh)/2;}
  ctx.drawImage(img,sx,sy,sw,sh,ox,oy,w*scale,h*scale);
}

// --- CINEMATIC TRANSITIONS ---
function applyTransition(ctx,w,h,progress,type){
  var p=easeOut(progress);
  if(type===0){// Fade
    ctx.fillStyle="rgba(7,11,20,"+Math.max(0,1-p*2)+")";ctx.fillRect(0,0,w,h);
  }else if(type===1){// Slide Left
    var clip=w*(1-p);
    ctx.fillStyle="#070B14";ctx.fillRect(0,0,clip,h);
  }else if(type===2){// Zoom In
    var s=0.5+0.5*p;
    ctx.save();ctx.globalAlpha=1-Math.max(0,1-p*3);
    ctx.translate(w/2*(1-s),h/2*(1-s));ctx.scale(s,s);ctx.restore();
  }else if(type===3){// Wipe diagonal
    ctx.save();ctx.beginPath();
    var wx=w*2*p;ctx.moveTo(wx,0);ctx.lineTo(wx-w*0.3,h);ctx.lineTo(0,h);ctx.lineTo(0,0);ctx.closePath();
    ctx.fillStyle="#070B14";ctx.fill();ctx.restore();
  }else if(type===4){// Circle reveal
    ctx.save();ctx.globalCompositeOperation="destination-in";
    ctx.beginPath();ctx.arc(w/2,h/2,Math.max(w,h)*p,0,Math.PI*2);ctx.fill();
    ctx.globalCompositeOperation="source-over";ctx.restore();
  }else{// Crossfade (default)
    ctx.fillStyle="rgba(7,11,20,"+(1-smoothstep(0,0.5,progress))+")";ctx.fillRect(0,0,w,h);
  }
}

function drawBrandWatermark(ctx,w,h,brand,progress){
  var a=Math.min(progress*2,1)*0.6;
  ctx.save();ctx.globalAlpha=a;
  ctx.font="bold 28px 'Space Grotesk',sans-serif";ctx.fillStyle="#C9A84C";ctx.textAlign="right";
  var name=brand&&brand.name?brand.name:"DubAIVal";
  ctx.fillText(name,w-40,h-40);
  if(brand&&brand.igHandle){
    ctx.font="18px sans-serif";ctx.fillStyle="#8899AA";
    ctx.fillText("@"+brand.igHandle.replace(/^@/,""),w-40,h-70);
  }
  ctx.restore();
}

// --- WEBGL POST-PROCESSING PIPELINE ---
function initPostFX(w,h){
  var c=document.createElement("canvas");c.width=w;c.height=h;
  var gl=c.getContext("webgl")||c.getContext("experimental-webgl");
  if(!gl)return null;
  function comp(src,type){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}return s;}
  function prog(v,f){var p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){gl.deleteProgram(p);return null;}return p;}
  var VS="attribute vec2 a_p;varying vec2 v_u;void main(){v_u=a_p*0.5+0.5;v_u.y=1.0-v_u.y;gl_Position=vec4(a_p,0,1);}";
  var FS="precision mediump float;uniform sampler2D u_t;uniform float u_time;uniform float u_vig;uniform float u_gr;uniform float u_ca;"+
    "varying vec2 v_u;float rnd(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);}"+
    "void main(){vec2 uv=v_u;"+
    "float r=texture2D(u_t,uv+vec2(u_ca,0.0)).r;float g=texture2D(u_t,uv).g;float b=texture2D(u_t,uv-vec2(u_ca,0.0)).b;"+
    "vec3 col=vec3(r,g,b);"+
    "vec3 glow=vec3(0.0);float gs=0.004;"+
    "glow+=texture2D(u_t,uv+vec2(gs,0.0)).rgb;glow+=texture2D(u_t,uv-vec2(gs,0.0)).rgb;"+
    "glow+=texture2D(u_t,uv+vec2(0.0,gs)).rgb;glow+=texture2D(u_t,uv-vec2(0.0,gs)).rgb;"+
    "glow+=texture2D(u_t,uv+vec2(gs,gs)).rgb;glow+=texture2D(u_t,uv-vec2(gs,gs)).rgb;"+
    "glow=glow/6.0;float bri=dot(glow,vec3(0.299,0.587,0.114));col+=glow*max(bri-0.45,0.0)*1.2;"+
    "float vig=1.0-u_vig*pow(length(uv-0.5)*1.4,2.0);col*=vig;"+
    "float n=rnd(uv*100.0+u_time)*u_gr;col+=n-u_gr*0.5;"+
    "col=pow(col,vec3(0.95));col=col*col*(3.0-2.0*col);"+
    "col*=vec3(1.03,1.0,1.05);"+
    "gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);}";
  var vs=comp(VS,gl.VERTEX_SHADER);var fs=comp(FS,gl.FRAGMENT_SHADER);
  if(!vs||!fs)return null;
  var prg=prog(vs,fs);if(!prg)return null;
  var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  var aP=gl.getAttribLocation(prg,"a_p");
  var uT=gl.getUniformLocation(prg,"u_t"),uTime=gl.getUniformLocation(prg,"u_time");
  var uVig=gl.getUniformLocation(prg,"u_vig"),uGr=gl.getUniformLocation(prg,"u_gr"),uCa=gl.getUniformLocation(prg,"u_ca");
  return{canvas:c,process:function(src,time){
    gl.viewport(0,0,w,h);gl.useProgram(prg);
    gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.enableVertexAttribArray(aP);gl.vertexAttribPointer(aP,2,gl.FLOAT,false,0,0);
    gl.uniform1i(uT,0);gl.uniform1f(uTime,time*0.1);gl.uniform1f(uVig,0.35);gl.uniform1f(uGr,0.025);gl.uniform1f(uCa,0.0018);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  },destroy:function(){gl.deleteTexture(tex);gl.deleteBuffer(buf);gl.deleteProgram(prg);}};
}

// --- LENS FLARE ---
function drawLensFlare(ctx,w,h,t,color){
  var fx=w*(0.72+0.08*Math.sin(t*0.4));var fy=h*0.12;
  var cx=w/2;var cy=h/2;
  drawGlowCircle(ctx,fx,fy,70,color,0.12+0.04*Math.sin(t*1.5));
  ctx.save();ctx.globalAlpha=0.08;
  var sgrd=ctx.createLinearGradient(fx-150,fy,fx+150,fy);
  sgrd.addColorStop(0,"transparent");sgrd.addColorStop(0.5,color);sgrd.addColorStop(1,"transparent");
  ctx.fillStyle=sgrd;ctx.fillRect(fx-150,fy-1.5,300,3);
  var sgrd2=ctx.createLinearGradient(fx,fy-80,fx,fy+80);
  sgrd2.addColorStop(0,"transparent");sgrd2.addColorStop(0.5,color);sgrd2.addColorStop(1,"transparent");
  ctx.fillStyle=sgrd2;ctx.fillRect(fx-1,fy-80,2,160);ctx.restore();
  var dx=fx-cx;var dy=fy-cy;
  for(var i=1;i<=5;i++){
    var gx=cx-dx*i*0.25;var gy=cy-dy*i*0.25;
    var gr=10+i*6;var ga=0.04/i;
    var hue=["rgba(100,180,255,","rgba(255,200,100,","rgba(200,100,255,","rgba(100,255,180,","rgba(255,100,150,"][i-1];
    ctx.save();ctx.globalAlpha=ga;ctx.beginPath();ctx.arc(gx,gy,gr,0,Math.PI*2);
    var ggrd=ctx.createRadialGradient(gx,gy,0,gx,gy,gr);
    ggrd.addColorStop(0,hue+"0.5)");ggrd.addColorStop(1,hue+"0)");
    ctx.fillStyle=ggrd;ctx.fill();ctx.restore();
  }
}

// --- KINETIC TYPOGRAPHY ---
function drawKineticText(ctx,text,x,y,progress,style,opts){
  var font=opts.font||"bold 40px 'Space Grotesk',sans-serif";
  var color=opts.color||"#FFF";
  var glow=opts.glow||null;
  ctx.font=font;ctx.textAlign=opts.align||"center";
  if(style==="typewriter"){
    var chars=text.length;var vis=Math.floor(chars*Math.min(progress*1.8,1));
    ctx.fillStyle=color;
    if(glow){ctx.save();ctx.shadowColor=glow;ctx.shadowBlur=12;}
    ctx.fillText(text.substring(0,vis),x,y);
    if(glow)ctx.restore();
    if(vis<chars&&Math.sin(progress*30)>0){
      var partial=text.substring(0,vis);
      var tw=ctx.textAlign==="center"?ctx.measureText(partial).width/2+x-ctx.measureText(text).width/2:ctx.measureText(partial).width;
      ctx.fillStyle=color;ctx.fillRect(tw+2,y-parseInt(font)*0.7,3,parseInt(font)*0.85);
    }
  }else if(style==="word-reveal"){
    var words=text.split(" ");var wProg=progress*words.length*1.5;
    var totalW=ctx.measureText(text).width;
    var curX=opts.align==="center"?x-totalW/2:x;
    words.forEach(function(word,i){
      var wp=Math.min(Math.max(wProg-i,0),1);var ep=easeOutBack(wp);
      ctx.save();ctx.globalAlpha=ep;
      if(glow){ctx.shadowColor=glow;ctx.shadowBlur=12*ep;}
      ctx.textAlign="left";ctx.fillStyle=color;
      ctx.translate(curX,y+25*(1-ep));ctx.fillText(word,0,0);
      ctx.restore();
      curX+=ctx.measureText(word+" ").width;
    });
  }else if(style==="scale-pop"){
    var sp=easeOutElastic(Math.min(progress*2,1));
    ctx.save();ctx.translate(x,y);ctx.scale(sp,sp);
    if(glow){ctx.shadowColor=glow;ctx.shadowBlur=16;}
    ctx.fillStyle=color;ctx.fillText(text,0,0);ctx.restore();
  }else if(style==="blur-in"){
    var bp=easeOutExpo(Math.min(progress*2,1));
    ctx.save();ctx.globalAlpha=bp;
    if(glow){ctx.shadowColor=glow;ctx.shadowBlur=20*(1-bp)+4;}
    ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();
  }else{
    if(glow){ctx.save();ctx.shadowColor=glow;ctx.shadowBlur=12;}
    ctx.fillStyle=color;ctx.fillText(text,x,y);
    if(glow)ctx.restore();
  }
}

// --- ANIMATED PROGRESS BAR ---
function drawVideoProgressBar(ctx,w,h,progress,color){
  var barH=3;var barY=h-barH;
  ctx.save();ctx.globalAlpha=0.3;ctx.fillStyle="#1C2540";ctx.fillRect(0,barY,w,barH);
  ctx.globalAlpha=0.8;
  var grd=ctx.createLinearGradient(0,barY,w*progress,barY);
  grd.addColorStop(0,color);grd.addColorStop(1,hexAlpha(color,0.5));
  ctx.fillStyle=grd;ctx.fillRect(0,barY,w*progress,barH);
  ctx.beginPath();ctx.arc(w*progress,barY+barH/2,5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  ctx.restore();
}

async function parseVideoPromptAI(userPrompt){
  var geminiKey=localStorage.getItem("dv_gemini_key");
  if(!geminiKey)return null;
  var areaList=Object.keys(AREAS).slice(0,50).join(", ");
  var prompt="You are a video planner for a Dubai real estate platform. Parse this request and create a video plan.\n\n"+
    "User request: \""+userPrompt+"\"\n\n"+
    "Available areas: "+areaList+"\n\n"+
    "Respond with ONLY this JSON:\n```json\n{\n"+
    "  \"building\": \"building name or null\",\n"+
    "  \"area\": \"area name from available list or null\",\n"+
    "  \"topic\": \"main topic/theme\",\n"+
    "  \"style\": \"luxury|investment|family|lifestyle|data\",\n"+
    "  \"duration\": 30,\n"+
    "  \"slideCount\": 8,\n"+
    "  \"slides\": [\n"+
    "    {\"type\": \"intro\", \"text\": \"hook text\", \"subtext\": \"subtitle\"},\n"+
    "    {\"type\": \"image\", \"text\": \"overlay text\", \"searchQuery\": \"image search terms\"},\n"+
    "    {\"type\": \"stats\", \"title\": \"title\", \"items\": [{\"label\": \"PSF\", \"value\": \"AED 2,800\"}, ...]},\n"+
    "    {\"type\": \"chart\", \"chartType\": \"bar|line|donut|gauge\", \"title\": \"title\", \"data\": [...]},\n"+
    "    {\"type\": \"comparison\", \"title\": \"title\", \"left\": {\"label\": \"A\", \"values\": [...]}, \"right\": {\"label\": \"B\", \"values\": [...]}},\n"+
    "    {\"type\": \"image\", \"text\": \"...\", \"searchQuery\": \"...\"},\n"+
    "    {\"type\": \"quote\", \"text\": \"inspirational quote about the property/area\"},\n"+
    "    {\"type\": \"cta\", \"text\": \"CTA text\", \"subtext\": \"contact info\"}\n"+
    "  ],\n"+
    "  \"voiceover\": [\"Script line 1\", \"Script line 2\", ...],\n"+
    "  \"caption\": \"Instagram caption with hashtags\",\n"+
    "  \"music\": \"upbeat|calm|luxury|dramatic\"\n"+
    "}\n```\n\n"+
    "RULES:\n- Use REAL data if you know it (PSF, yields, growth for Dubai areas)\n- Make slides visually diverse (mix image/stats/chart/comparison)\n- Voiceover should be 1 line per slide, professional real estate narration\n- Duration 20-60 seconds, 6-12 slides\n- searchQuery should be specific for finding relevant images";
  try{
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.4}})
    });
    if(!r.ok)return null;
    var d=await r.json();
    var txt=d.candidates[0].content.parts[0].text;
    var jm=txt.match(/```json\s*([\s\S]*?)\s*```/);
    return jm?JSON.parse(jm[1]):JSON.parse(txt.match(/\{[\s\S]*\}/)[0]);
  }catch(e){return null;}
}

function enrichPlanWithDB(plan){
  if(!plan)return plan;
  var area=plan.area;
  var aData=area?AREAS[area]:null;
  var bName=plan.building;
  var bData=bName?lookupBuilding(bName,area||""):null;
  if(aData){
    plan._areaData=aData;
    plan.slides.forEach(function(s){
      if(s.type==="stats"&&(!s.items||s.items.length<2)){
        s.items=[
          {label:"Price/sqft",value:"AED "+aData.psf.toLocaleString()},
          {label:"Yield",value:aData.y?(aData.y[0]+"-"+aData.y[1]+"%"):"—"},
          {label:"Growth (1yr)",value:aData.g?(aData.g[0]+"%"):"—"},
          {label:"Service Charge",value:"AED "+aData.sc+"/sqft"},
          {label:"DOM",value:aData.dom?aData.dom+" days":"—"}
        ];
      }
      if(s.type==="chart"&&s.chartType==="bar"&&(!s.data||s.data.length<2)&&aData.g){
        s.data=[{label:"1Y",value:aData.g[0]},{label:"3Y",value:aData.g[1]},{label:"5Y",value:aData.g[2]}];
      }
    });
  }
  if(bData&&bData.p){
    plan._bldgData=bData;
  }
  return plan;
}

async function gatherVideoImages(plan){
  var images=[];
  for(var i=0;i<plan.slides.length;i++){
    var s=plan.slides[i];
    if(s.type==="image"||s.type==="intro"){
      var q=s.searchQuery||plan.building||plan.area||plan.topic||"Dubai luxury real estate";
      var imgs=await findMultipleImages(q,2);
      s._img=imgs&&imgs[0]?imgs[0]:null;
      if(imgs&&imgs[0])images.push(imgs[0]);
    }
  }
  return images;
}

function generateTone(ctx,freq,dur,vol){
  try{
    var ac=new(window.AudioContext||window.webkitAudioContext)();
    var osc=ac.createOscillator();var gain=ac.createGain();
    osc.type="sine";osc.frequency.value=freq;
    gain.gain.value=vol||0.03;
    osc.connect(gain);gain.connect(ac.destination);
    osc.start();osc.stop(ac.currentTime+dur);
    return ac;
  }catch(e){return null;}
}

async function renderVideoFrames(canvas,ctx,plan,progressCb,userPhotos,musicDest){
  var W=canvas.width,H=canvas.height;
  var slides=plan.slides;
  var totalSlides=slides.length;
  var secPerSlide=Math.max(3,(plan.duration||30)/totalSlides);
  var framesPerSlide=Math.round(VGEN.FPS*secPerSlide);
  var transFrames=Math.round(VGEN.FPS*0.6);
  var brand=getBrandProfile();
  var colors={"luxury":["#0A0520","#1A0A3A","#0A0520"],"investment":["#070B14","#0D1830","#070B14"],
    "data":["#070B14","#0D1220","#070B14"],"family":["#0A1020","#0D1830","#0A1020"],
    "lifestyle":["#100818","#1A0C28","#100818"]};
  var bgColors=colors[plan.style]||colors.investment;
  var accentColor={"luxury":"#C9A84C","investment":"#10B981","data":"#3B82F6","family":"#F59E0B","lifestyle":"#EC4899"}[plan.style]||"#C9A84C";

  // Calculate per-slide frame counts (user_video slides get more frames)
  var slideFrames=[];
  slides.forEach(function(s){
    if(s.type==="user_video"&&s._vidDur){
      slideFrames.push(Math.round(VGEN.FPS*s._vidDur));
    }else{
      slideFrames.push(framesPerSlide);
    }
  });
  var totalFrames=slideFrames.reduce(function(a,b){return a+b;},0);

  var loadedImgs={};
  for(var si=0;si<slides.length;si++){
    if(slides[si]._img){
      var im=await loadImg(slides[si]._img);
      if(im)loadedImgs[si]=im;
    }
  }
  if(userPhotos){
    for(var ui=0;ui<userPhotos.length;ui++){
      if(userPhotos[ui])loadedImgs["user_"+ui]=userPhotos[ui];
    }
  }

  var postFX=initPostFX(W,H);

  var stream=canvas.captureStream(VGEN.FPS);
  if(musicDest){
    var mTracks=musicDest.stream.getAudioTracks();
    mTracks.forEach(function(t){stream.addTrack(t);});
  }
  var chunks=[];
  var mimeType="video/mp4;codecs=avc1.42E01E";
  if(!MediaRecorder.isTypeSupported(mimeType)){mimeType="video/webm;codecs=vp9";}
  if(!MediaRecorder.isTypeSupported(mimeType))mimeType="video/webm";
  var recorder=new MediaRecorder(stream,{mimeType:mimeType,videoBitsPerSecond:8000000});
  recorder.ondataavailable=function(ev){if(ev.data.size>0)chunks.push(ev.data);};
  var recDone=new Promise(function(res){recorder.onstop=function(){res();};});
  recorder.start();

  var userPhotoIdx=0;
  for(var frame=0;frame<totalFrames;frame++){
    var cumFrames=0;var slideIdx=0;
    for(var sfi=0;sfi<slideFrames.length;sfi++){
      if(frame<cumFrames+slideFrames[sfi]){slideIdx=sfi;break;}
      cumFrames+=slideFrames[sfi];
      if(sfi===slideFrames.length-1)slideIdx=sfi;
    }
    var localFrame=frame-cumFrames;
    var curSlideFrames=slideFrames[slideIdx]||framesPerSlide;
    var progress=localFrame/curSlideFrames;
    var s=slides[slideIdx];
    var t=frame/VGEN.FPS;

    drawGradBg(ctx,W,H,bgColors);
    drawParticles(ctx,W,H,t,40);
    drawLightRays(ctx,W,H,t);

    var inTrans=localFrame<transFrames;
    var transP=inTrans?localFrame/transFrames:1;
    var transType=slideIdx%5;

    if(s.type==="intro"){
      if(loadedImgs[slideIdx]){
        ctx.save();ctx.globalAlpha=0.35;
        kenBurns(ctx,loadedImgs[slideIdx],W,H,progress,0);
        ctx.restore();
        var grd=ctx.createLinearGradient(0,0,0,H);
        grd.addColorStop(0,"rgba(7,11,20,0.6)");grd.addColorStop(1,"rgba(7,11,20,0.9)");
        ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
      }
      drawLensFlare(ctx,W,H,t,accentColor);
      drawGlowCircle(ctx,W*0.15,H*0.2,180,accentColor,0.06+0.02*Math.sin(t*1.5));
      drawGlowCircle(ctx,W*0.85,H*0.7,140,accentColor,0.04+0.02*Math.cos(t*1.2));
      var titleP=easeOutBack(Math.min(transP*1.2,1));
      var titleY=H*0.35+40*(1-titleP);
      ctx.globalAlpha=titleP;
      var titleFont="bold "+Math.round(W/12)+"px 'Space Grotesk',sans-serif";
      var titleText=s.text||plan.building||plan.area||"";
      ctx.font=titleFont;
      var titleLines=wrapText(ctx,titleText,W-120);
      titleLines.forEach(function(ln,li){
        drawKineticText(ctx,ln,W/2,titleY+li*Math.round(W/10),progress,"typewriter",{font:titleFont,color:accentColor,glow:accentColor,align:"center"});
      });
      if(s.subtext){
        var subP=easeOutExpo(Math.max(0,transP*1.5-0.5));
        ctx.globalAlpha=subP;
        drawKineticText(ctx,s.subtext,W/2,titleY+titleLines.length*Math.round(W/10)+40,Math.max(0,progress-0.3)/0.7,"word-reveal",{font:Math.round(W/26)+"px sans-serif",color:"#CCC",align:"center"});
      }
      drawDecorLine(ctx,W/2-100,titleY-50,200,accentColor,progress);
      drawNeonLine(ctx,W*0.1,titleY-30,W*0.35,titleY-30,accentColor,1);
      drawNeonLine(ctx,W*0.65,titleY-30,W*0.9,titleY-30,accentColor,1);
      ctx.globalAlpha=1;
      if(inTrans)applyTransition(ctx,W,H,transP,0);
    }
    else if(s.type==="image"){
      if(loadedImgs[slideIdx]){
        kenBurns(ctx,loadedImgs[slideIdx],W,H,progress,slideIdx%8);
        var igrd=ctx.createLinearGradient(0,H*0.4,0,H);
        igrd.addColorStop(0,"rgba(7,11,20,0)");igrd.addColorStop(0.6,"rgba(7,11,20,0.5)");
        igrd.addColorStop(1,"rgba(7,11,20,0.92)");
        ctx.fillStyle=igrd;ctx.fillRect(0,0,W,H);
      }
      if(s.text){
        var txtP=easeOutExpo(Math.min(progress*2.5,1));
        var slideUp=25*(1-txtP);
        ctx.globalAlpha=txtP;
        ctx.save();ctx.shadowColor="rgba(0,0,0,0.8)";ctx.shadowBlur=12;
        ctx.font="bold "+Math.round(W/18)+"px 'Space Grotesk',sans-serif";
        ctx.fillStyle="#FFF";ctx.textAlign="center";
        var lines=wrapText(ctx,s.text,W-80);
        lines.forEach(function(ln,li){ctx.fillText(ln,W/2,H*0.78+li*50+slideUp);});
        ctx.shadowBlur=0;ctx.restore();
        ctx.globalAlpha=1;
      }
      if(userPhotos&&userPhotos.length>0&&userPhotoIdx<userPhotos.length&&slideIdx%3===1){
        var uImg=loadedImgs["user_"+userPhotoIdx];
        if(uImg){
          var upSize=Math.round(W*0.25);
          var upX=W-upSize-30;
          var upY=30;
          var photoP=easeOutBack(Math.min(progress*3,1));
          ctx.save();ctx.globalAlpha=photoP;
          ctx.shadowColor=accentColor;ctx.shadowBlur=20;
          drawRoundRect(ctx,upX-4,upY-4,upSize+8,upSize+8,16);
          ctx.fillStyle=accentColor;ctx.fill();
          ctx.shadowBlur=0;
          drawRoundRect(ctx,upX,upY,upSize,upSize,12);
          ctx.clip();
          ctx.drawImage(uImg,0,0,uImg.width,uImg.height,upX,upY,upSize,upSize);
          ctx.restore();
        }
        userPhotoIdx++;
      }
      if(inTrans)applyTransition(ctx,W,H,transP,transType);
    }
    else if(s.type==="stats"){
      drawGlowCircle(ctx,W*0.5,H*0.08,120,accentColor,0.08);
      var stP=easeOutExpo(transP);
      ctx.globalAlpha=stP;
      drawKineticText(ctx,s.title||"Key Metrics",W/2,H*0.15,transP,"scale-pop",{font:"bold "+Math.round(W/16)+"px 'Space Grotesk',sans-serif",color:accentColor,glow:accentColor,align:"center"});
      drawDecorLine(ctx,W/2-80,H*0.17,160,accentColor,progress);
      var items=s.items||[];
      var cardH=Math.round(H*0.1);
      var startY=H*0.22;
      items.forEach(function(item,ii){
        var cy=startY+ii*(cardH+16);
        var ap=easeOutBack(Math.min((progress-ii*0.1)*2.5,1));
        if(ap<=0)return;
        ctx.globalAlpha=ap;
        var slideX=40*(1-ap);
        ctx.save();ctx.translate(slideX,0);
        drawRoundRect(ctx,60,cy,W-120,cardH,14);
        var cardGrd=ctx.createLinearGradient(60,cy,W-60,cy);
        cardGrd.addColorStop(0,"rgba(13,18,32,0.9)");cardGrd.addColorStop(1,"rgba(13,18,32,0.6)");
        ctx.fillStyle=cardGrd;ctx.fill();
        ctx.strokeStyle=hexAlpha(accentColor,0.25);ctx.lineWidth=1;ctx.stroke();
        drawNeonLine(ctx,60,cy,60,cy+cardH,accentColor,2);
        ctx.font="bold "+Math.round(W/28)+"px sans-serif";ctx.fillStyle="#FFF";ctx.textAlign="left";
        ctx.fillText(item.label,90,cy+cardH*0.62);
        ctx.save();ctx.shadowColor=accentColor;ctx.shadowBlur=8;
        ctx.font="bold "+Math.round(W/22)+"px 'Space Grotesk',sans-serif";
        ctx.fillStyle=accentColor;ctx.textAlign="right";
        ctx.fillText(item.value,W-90,cy+cardH*0.62);
        ctx.shadowBlur=0;ctx.restore();
        ctx.restore();
      });
      ctx.globalAlpha=1;
      if(inTrans)applyTransition(ctx,W,H,transP,transType);
    }
    else if(s.type==="chart"){
      var chTrans=easeOutExpo(transP);
      ctx.globalAlpha=chTrans;
      drawKineticText(ctx,s.title||"Market Data",W/2,H*0.13,transP,"blur-in",{font:"bold "+Math.round(W/18)+"px 'Space Grotesk',sans-serif",color:accentColor,glow:accentColor,align:"center"});
      drawDecorLine(ctx,W/2-80,H*0.15,160,accentColor,progress);
      drawGlowCircle(ctx,W*0.5,H*0.5,250,accentColor,0.04);
      var chartP=Math.max(0,(progress-0.12)/0.88);
      if(s.chartType==="bar"){
        var bData=s.data||[];
        var maxBV=Math.max.apply(null,bData.map(function(d){return d.value||0;}))||1;
        var barColors=["#C9A84C","#10B981","#3B82F6","#F59E0B","#EC4899","#8B5CF6"];
        bData.forEach(function(bd,bi){
          drawAnimatedBar(ctx,100,H*0.25+bi*100,W-200,36,
            (bd.value||0)/maxBV,chartP,barColors[bi%barColors.length],
            bd.label||"",typeof bd.value==="number"?(bd.value>=0?"+":"")+bd.value+"%":String(bd.value));
        });
      }else if(s.chartType==="line"){
        var ld=s.data||[];
        drawLineChart(ctx,80,H*0.25,W-160,H*0.35,
          ld.map(function(d){return{v:d.value||0,l:d.label||""};}),chartP,"rgb(201,168,76)");
      }else if(s.chartType==="donut"){
        var dd=s.data||[];
        var dColors=["#C9A84C","#10B981","#3B82F6","#F59E0B","#EC4899"];
        drawDonutChart(ctx,W/2,H*0.45,Math.round(W*0.2),
          dd.map(function(d,di){return{v:d.value||0,c:dColors[di%dColors.length]};}),chartP);
        dd.forEach(function(d,di){
          ctx.font="16px sans-serif";ctx.fillStyle=dColors[di%dColors.length];ctx.textAlign="left";
          ctx.fillText("● "+(d.label||""),W*0.15,H*0.7+di*30);
        });
      }else if(s.chartType==="gauge"){
        drawGaugeChart(ctx,W/2,H*0.45,Math.round(W*0.22),
          s.data&&s.data[0]?s.data[0].value:75,100,chartP,accentColor,
          s.data&&s.data[0]?s.data[0].label:"Score");
      }
      ctx.globalAlpha=1;
      if(inTrans)applyTransition(ctx,W,H,transP,transType);
    }
    else if(s.type==="comparison"){
      var cmpP=easeOutExpo(transP);
      ctx.globalAlpha=cmpP;
      drawKineticText(ctx,s.title||"Comparison",W/2,H*0.12,transP,"word-reveal",{font:"bold "+Math.round(W/18)+"px 'Space Grotesk',sans-serif",color:accentColor,glow:accentColor,align:"center"});
      var half=W/2-20;
      var colA="#10B981",colB="#3B82F6";
      [s.left,s.right].forEach(function(col,ci){
        if(!col)return;
        var ox=ci===0?20:W/2+10;
        var cardSlide=ci===0?-1:1;
        var cardP=easeOutBack(Math.min((progress-ci*0.1)*2,1));
        if(cardP<=0)return;
        ctx.save();ctx.globalAlpha=cardP;ctx.translate(30*cardSlide*(1-cardP),0);
        drawRoundRect(ctx,ox,H*0.18,half,H*0.65,16);
        ctx.fillStyle="rgba(13,18,32,0.7)";ctx.fill();
        ctx.strokeStyle=ci===0?colA:colB;ctx.lineWidth=2;ctx.stroke();
        drawNeonLine(ctx,ox,H*0.18,ox,H*0.18+H*0.65,ci===0?colA:colB,2);
        ctx.font="bold "+Math.round(W/24)+"px sans-serif";
        ctx.fillStyle=ci===0?colA:colB;ctx.textAlign="center";
        ctx.fillText(col.label||"",ox+half/2,H*0.24);
        var vals=col.values||[];
        vals.forEach(function(v,vi){
          var vy=H*0.3+vi*70;
          var valP=easeOutExpo(Math.min((progress-ci*0.1-vi*0.06)*3,1));
          if(valP<=0)return;
          ctx.globalAlpha=valP;
          ctx.font="14px sans-serif";ctx.fillStyle="#8899AA";ctx.textAlign="center";
          ctx.fillText(v.label||"",ox+half/2,vy);
          ctx.font="bold 26px 'Space Grotesk',sans-serif";ctx.fillStyle="#FFF";
          ctx.fillText(v.value||"",ox+half/2,vy+28);
        });
        ctx.restore();
      });
      ctx.globalAlpha=1;
      if(inTrans)applyTransition(ctx,W,H,transP,transType);
    }
    else if(s.type==="quote"){
      drawGlowCircle(ctx,W*0.5,H*0.35,250,accentColor,0.07);
      drawGlowCircle(ctx,W*0.2,H*0.5,100,accentColor,0.03);
      drawGlowCircle(ctx,W*0.8,H*0.3,80,accentColor,0.03);
      var qP=easeOutExpo(transP);
      ctx.globalAlpha=qP;
      var quoteScale=0.85+0.15*easeOutBack(Math.min(progress*2,1));
      ctx.save();ctx.translate(W/2,H*0.45);ctx.scale(quoteScale,quoteScale);ctx.translate(-W/2,-H*0.45);
      ctx.save();ctx.shadowColor=accentColor;ctx.shadowBlur=25;
      ctx.font="100px Georgia,serif";ctx.fillStyle=accentColor;ctx.textAlign="center";
      ctx.fillText("“",W/2,H*0.28);
      ctx.shadowBlur=0;ctx.restore();
      var qFont="italic "+Math.round(W/20)+"px Georgia,serif";
      ctx.font=qFont;
      var qLines=wrapText(ctx,'"'+(s.text||"")+'"',W-120);
      qLines.forEach(function(ln,li){
        drawKineticText(ctx,ln,W/2,H*0.4+li*60,Math.max(0,(progress-li*0.08)*1.5),"typewriter",{font:qFont,color:"#FFF",glow:"rgba(255,255,255,0.4)",align:"center"});
      });
      ctx.restore();
      ctx.globalAlpha=1;
      if(inTrans)applyTransition(ctx,W,H,transP,5);
    }
    else if(s.type==="cta"){
      drawLensFlare(ctx,W,H,t,accentColor);
      drawGlowCircle(ctx,W*0.5,H*0.4,300,accentColor,0.08+0.03*Math.sin(t*2));
      drawGlowCircle(ctx,W*0.2,H*0.6,160,accentColor,0.04);
      drawGlowCircle(ctx,W*0.8,H*0.3,120,accentColor,0.03);
      var ctaP=easeOutElastic(Math.min(transP*1.2,1));
      var pulse=0.97+0.03*Math.sin(t*4);
      ctx.save();ctx.translate(W/2,H*0.4);ctx.scale(pulse*ctaP,pulse*ctaP);ctx.translate(-W/2,-H*0.4);
      drawRoundRect(ctx,60,H*0.25,W-120,H*0.35,24);
      var cGrd=ctx.createLinearGradient(60,H*0.25,W-60,H*0.6);
      cGrd.addColorStop(0,hexAlpha(accentColor,0.2));cGrd.addColorStop(0.5,hexAlpha(accentColor,0.08));
      cGrd.addColorStop(1,hexAlpha(accentColor,0.15));
      ctx.fillStyle=cGrd;ctx.fill();
      ctx.save();ctx.shadowColor=accentColor;ctx.shadowBlur=20;
      ctx.strokeStyle=accentColor;ctx.lineWidth=2;ctx.stroke();
      ctx.shadowBlur=0;ctx.restore();
      drawKineticText(ctx,s.text||"Get In Touch",W/2,H*0.38,progress,"scale-pop",{font:"bold "+Math.round(W/14)+"px 'Space Grotesk',sans-serif",color:accentColor,glow:accentColor,align:"center"});
      if(s.subtext||brand){
        drawKineticText(ctx,s.subtext||(brand?brand.phone||brand.email||"":"DubAIVal.com"),W/2,H*0.44,Math.max(0,progress-0.2)/0.8,"blur-in",{font:Math.round(W/28)+"px sans-serif",color:"#CCC",align:"center"});
      }
      if(brand&&brand.name){
        drawKineticText(ctx,brand.name,W/2,H*0.52,Math.max(0,progress-0.3)/0.7,"word-reveal",{font:"bold "+Math.round(W/22)+"px 'Space Grotesk',sans-serif",color:"#FFF",glow:"#FFF",align:"center"});
      }
      ctx.restore();
      if(inTrans)applyTransition(ctx,W,H,transP,4);
    }
    else if(s.type==="user_video"){
      var vEl=s._vidEl;
      if(vEl){
        try{
          if(localFrame===0){vEl.currentTime=0;vEl.play();}
          ctx.drawImage(vEl,0,0,W,H);
        }catch(e){drawGradBg(ctx,W,H,bgColors);}
        var vGrd=ctx.createLinearGradient(0,H*0.7,0,H);
        vGrd.addColorStop(0,"rgba(7,11,20,0)");vGrd.addColorStop(0.5,"rgba(7,11,20,0.4)");
        vGrd.addColorStop(1,"rgba(7,11,20,0.85)");
        ctx.fillStyle=vGrd;ctx.fillRect(0,0,W,H);
        if(s.text){
          ctx.globalAlpha=easeOutExpo(Math.min(progress*3,1));
          ctx.save();ctx.shadowColor="rgba(0,0,0,0.9)";ctx.shadowBlur=16;
          ctx.font="bold "+Math.round(W/20)+"px 'Space Grotesk',sans-serif";
          ctx.fillStyle="#FFF";ctx.textAlign="center";
          ctx.fillText(s.text,W/2,H*0.9);
          ctx.shadowBlur=0;ctx.restore();
          ctx.globalAlpha=1;
        }
      }
      if(inTrans)applyTransition(ctx,W,H,transP,0);
    }
    else if(s.type==="floorplan"){
      var fpImg=s._fpImg;
      if(fpImg){
        var fpTrans=easeOutExpo(transP);
        ctx.globalAlpha=fpTrans;
        ctx.save();ctx.shadowColor=accentColor;ctx.shadowBlur=10;
        ctx.font="bold "+Math.round(W/16)+"px 'Space Grotesk',sans-serif";
        ctx.fillStyle=accentColor;ctx.textAlign="center";
        ctx.fillText("📐 "+(s.text||"Floor Plan"),W/2,H*0.1);
        ctx.shadowBlur=0;ctx.restore();
        drawDecorLine(ctx,W/2-80,H*0.12,160,accentColor,progress);
        var maxFW=W-100;var maxFH=H*0.7;
        var fAspect=fpImg.width/fpImg.height;
        var fW,fH;
        if(fAspect>maxFW/maxFH){fW=maxFW;fH=maxFW/fAspect;}
        else{fH=maxFH;fW=maxFH*fAspect;}
        var fX=(W-fW)/2;var fY=H*0.15;
        ctx.save();ctx.shadowColor=accentColor;ctx.shadowBlur=20;
        drawRoundRect(ctx,fX-6,fY-6,fW+12,fH+12,16);
        ctx.fillStyle="rgba(255,255,255,0.95)";ctx.fill();
        ctx.strokeStyle=accentColor;ctx.lineWidth=2;ctx.stroke();
        ctx.shadowBlur=0;ctx.restore();
        drawRoundRect(ctx,fX,fY,fW,fH,12);ctx.save();ctx.clip();
        var fpScale=1+0.03*easeOutExpo(progress);
        ctx.translate(fX+fW/2,fY+fH/2);ctx.scale(fpScale,fpScale);ctx.translate(-(fX+fW/2),-(fY+fH/2));
        ctx.drawImage(fpImg,0,0,fpImg.width,fpImg.height,fX,fY,fW,fH);
        ctx.restore();
        ctx.font="14px sans-serif";ctx.fillStyle="#8899AA";ctx.textAlign="center";
        ctx.fillText("Floor Plan — DubAIVal",W/2,fY+fH+30);
        ctx.globalAlpha=1;
      }
      if(inTrans)applyTransition(ctx,W,H,transP,transType);
    }
    else if(s.type==="map"){
      var mapTrans=easeOutExpo(transP);
      ctx.globalAlpha=mapTrans;
      ctx.save();ctx.shadowColor=accentColor;ctx.shadowBlur=10;
      ctx.font="bold "+Math.round(W/16)+"px 'Space Grotesk',sans-serif";
      ctx.fillStyle=accentColor;ctx.textAlign="center";
      ctx.fillText("📍 Location",W/2,H*0.1);
      ctx.shadowBlur=0;ctx.restore();
      drawDecorLine(ctx,W/2-80,H*0.12,160,accentColor,progress);
      var mW=W-80;var mH=H*0.55;var mX=40;var mY=H*0.16;
      ctx.save();ctx.shadowColor="rgba(0,0,0,0.5)";ctx.shadowBlur=20;
      drawRoundRect(ctx,mX,mY,mW,mH,16);
      ctx.fillStyle="#0A1628";ctx.fill();
      ctx.strokeStyle="#1C2540";ctx.lineWidth=2;ctx.stroke();
      ctx.shadowBlur=0;ctx.restore();
      var gridStep=mW/8;
      ctx.strokeStyle="rgba(28,37,64,0.6)";ctx.lineWidth=0.5;
      for(var gi=1;gi<8;gi++){
        ctx.beginPath();ctx.moveTo(mX+gi*gridStep,mY);ctx.lineTo(mX+gi*gridStep,mY+mH);ctx.stroke();
        ctx.beginPath();ctx.moveTo(mX,mY+gi*gridStep);ctx.lineTo(mX+mW,mY+gi*gridStep);ctx.stroke();
      }
      var roadY1=mY+mH*0.35;var roadY2=mY+mH*0.65;
      ctx.fillStyle="#1A2744";
      ctx.fillRect(mX,roadY1,mW,12);ctx.fillRect(mX,roadY2,mW,8);
      ctx.fillRect(mX+mW*0.3,mY,8,mH);ctx.fillRect(mX+mW*0.7,mY,6,mH);
      for(var bi=0;bi<12;bi++){
        var bx=mX+30+Math.abs(Math.sin(bi*2.7))*mW*0.85;
        var by=mY+20+Math.abs(Math.cos(bi*3.1))*mH*0.85;
        var bw=20+Math.abs(Math.sin(bi*1.3))*30;
        var bh=15+Math.abs(Math.cos(bi*2.1))*25;
        drawRoundRect(ctx,bx,by,bw,bh,3);
        ctx.fillStyle=hexAlpha(["#1C2540","#1A2744","#162038"][bi%3],0.8);ctx.fill();
      }
      var pinX=mX+mW/2;var pinY=mY+mH*0.45;
      var pinPulse=1+0.15*Math.sin(t*3);
      ctx.save();ctx.translate(pinX,pinY);ctx.scale(pinPulse,pinPulse);
      ctx.shadowColor=accentColor;ctx.shadowBlur=15;
      ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);
      ctx.fillStyle=hexAlpha(accentColor,0.3);ctx.fill();
      ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);
      ctx.fillStyle=accentColor;ctx.fill();
      ctx.fillStyle="#FFF";ctx.font="bold 14px sans-serif";ctx.textAlign="center";
      ctx.fillText("📍",0,5);
      ctx.shadowBlur=0;ctx.restore();
      ctx.save();ctx.shadowColor="rgba(0,0,0,0.8)";ctx.shadowBlur=10;
      ctx.font="bold "+Math.round(W/24)+"px 'Space Grotesk',sans-serif";
      ctx.fillStyle="#FFF";ctx.textAlign="center";
      ctx.fillText(s._location||s.text||"",W/2,mY+mH+40);
      ctx.shadowBlur=0;ctx.restore();
      ctx.font="14px sans-serif";ctx.fillStyle="#8899AA";ctx.textAlign="center";
      ctx.fillText("Dubai, United Arab Emirates",W/2,mY+mH+65);
      ctx.globalAlpha=1;
      if(inTrans)applyTransition(ctx,W,H,transP,transType);
    }

    drawBrandWatermark(ctx,W,H,brand,progress);
    drawVideoProgressBar(ctx,W,H,frame/totalFrames,accentColor);

    if(postFX){postFX.process(canvas,t);ctx.drawImage(postFX.canvas,0,0);}

    if(progressCb)progressCb(Math.round((frame/totalFrames)*100));

    await new Promise(function(r){requestAnimationFrame(r);});
  }

  if(postFX)postFX.destroy();
  recorder.stop();
  await recDone;
  var outType=mimeType.indexOf("mp4")!==-1?"video/mp4":"video/webm";
  return new Blob(chunks,{type:outType});
}

function wrapText(ctx,text,maxW){
  var words=text.split(" ");var lines=[];var line="";
  words.forEach(function(w){
    var test=line?line+" "+w:w;
    if(ctx.measureText(test).width>maxW&&line){lines.push(line);line=w;}
    else line=test;
  });
  if(line)lines.push(line);
  return lines;
}

function drawDecorLine(ctx,x,y,w,color,progress){
  var p=easeOut(Math.min(progress*3,1));
  ctx.beginPath();ctx.moveTo(x+w/2-w/2*p,y);ctx.lineTo(x+w/2+w/2*p,y);
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
}

async function speakVoiceoverEL(lines,secPerSlide){
  if(!lines||lines.length===0)return null;
  var elKey=localStorage.getItem("dv_elevenlabs_key");
  if(!elKey)return speakVoiceoverFallback(lines,secPerSlide);
  var voiceId=localStorage.getItem("dv_elevenlabs_voice")||"21m00Tcm4TlvDq8ikWAM";
  var fullText=lines.join(". ");
  try{
    var resp=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+voiceId+"/stream",{
      method:"POST",
      headers:{"Content-Type":"application/json","xi-api-key":elKey},
      body:JSON.stringify({text:fullText,model_id:"eleven_turbo_v2_5",
        voice_settings:{stability:0.65,similarity_boost:0.78,style:0.35,use_speaker_boost:true}})
    });
    if(!resp.ok)throw new Error("EL "+resp.status);
    var blob=await resp.blob();
    var url=URL.createObjectURL(blob);
    var audio=new Audio(url);
    audio.volume=0.85;
    return audio;
  }catch(e){
    console.warn("ElevenLabs fallback:",e);
    return speakVoiceoverFallback(lines,secPerSlide);
  }
}
function speakVoiceoverFallback(lines,secPerSlide){
  return new Promise(function(resolve){
    if(!window.speechSynthesis||!lines||lines.length===0){resolve(null);return;}
    var voices=speechSynthesis.getVoices();
    var enVoice=voices.find(function(v){return v.lang.startsWith("en")&&v.name.indexOf("Google")!==-1;})||
      voices.find(function(v){return v.lang.startsWith("en");})||voices[0];
    var idx=0;
    function speakNext(){
      if(idx>=lines.length){resolve(null);return;}
      var u=new SpeechSynthesisUtterance(lines[idx]);
      u.voice=enVoice;u.rate=0.9;u.pitch=1;u.volume=0.8;
      u.onend=function(){idx++;setTimeout(speakNext,200);};
      u.onerror=function(){idx++;setTimeout(speakNext,200);};
      speechSynthesis.speak(u);
      idx++;
    }
    if(voices.length===0){
      speechSynthesis.onvoiceschanged=function(){
        voices=speechSynthesis.getVoices();
        enVoice=voices.find(function(v){return v.lang.startsWith("en")&&v.name.indexOf("Google")!==-1;})||voices[0];
        speakNext();
      };
    }else speakNext();
  });
}

function showVideoGenUI(initialPrompt){
  var existing=document.getElementById("video-gen-modal");
  if(existing)existing.remove();

  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"video-gen-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #C9A84C",borderRadius:"16px",padding:"20px",width:"500px",maxWidth:"95vw",maxHeight:"92vh",overflowY:"auto"});

  card.appendChild(el("h3",{style:{color:"#C9A84C",margin:"0 0 4px",fontSize:"16px",fontFamily:"'Space Grotesk',monospace"}},"🎬 AI Video Generator"));
  card.appendChild(el("p",{style:{color:"#8899AA",fontSize:"11px",margin:"0 0 14px",fontFamily:"'Inter',sans-serif"}},"Describe your video → AI creates it with images, data, charts & voiceover"));

  // Prompt input
  var promptInp=el("textarea",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"10px",padding:"12px",color:"#E0E0E0",fontSize:"13px",fontFamily:"'Inter',sans-serif",resize:"vertical",minHeight:"60px",boxSizing:"border-box"},placeholder:"e.g. Make a video about Vida Dubai Mall Tower 1 with investment data and market trends..."});
  if(initialPrompt)promptInp.value=initialPrompt;
  card.appendChild(promptInp);

  // Options row
  var optRow=div({display:"flex",gap:"8px",margin:"10px 0",flexWrap:"wrap"});
  var formatSel=el("select",{style:{background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"6px 10px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace"}});
  [["9:16 Reel/Story","1080x1920"],["1:1 Square","1080x1080"],["16:9 Landscape","1920x1080"]].forEach(function(o){
    var opt=el("option");opt.value=o[1];opt.textContent=o[0];formatSel.appendChild(opt);
  });
  optRow.appendChild(el("span",{style:{color:"#8899AA",fontSize:"11px",alignSelf:"center"}},"Format:"));
  optRow.appendChild(formatSel);

  var voiceCheck=el("input",{type:"checkbox",checked:true,style:{accentColor:"#C9A84C"}});
  optRow.appendChild(el("span",{style:{color:"#8899AA",fontSize:"11px",alignSelf:"center",marginLeft:"12px"}},"🎙 Voiceover:"));
  optRow.appendChild(voiceCheck);
  card.appendChild(optRow);

  // --- MEDIA UPLOADS (collapsible sections) ---
  var mediaWrap=div({margin:"10px 0",background:"#0D1117",borderRadius:"10px",padding:"12px"});
  mediaWrap.appendChild(el("div",{style:{color:"#C9A84C",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"}},"📎 Add Your Media (all optional)"));

  function makeMediaSection(icon,title,desc,accept,multiple,onFiles){
    var sec=div({marginBottom:"10px",padding:"8px",background:"#1A1F2E",borderRadius:"8px",border:"1px solid #2A3040"});
    var hdr=div({display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",marginBottom:"4px"});
    hdr.appendChild(el("span",{style:{fontSize:"14px"}},icon));
    hdr.appendChild(el("span",{style:{color:"#E0E0E0",fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace"}},title));
    hdr.appendChild(el("span",{style:{color:"#8899AA",fontSize:"10px",flex:"1",textAlign:"right"}},desc));
    sec.appendChild(hdr);
    var inp=el("input",{type:"file",accept:accept,multiple:multiple||false,style:{fontSize:"10px",color:"#8899AA",marginTop:"4px",width:"100%"}});
    var preview=div({display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"4px"});
    inp.onchange=function(){onFiles(Array.from(inp.files||[]),preview);};
    sec.appendChild(inp);sec.appendChild(preview);
    return sec;
  }

  // Photos
  var userPhotoFiles=[];
  mediaWrap.appendChild(makeMediaSection("📷","Photos","Blended naturally into video","image/*",true,function(files,prev){
    userPhotoFiles=files;prev.innerHTML="";
    files.forEach(function(f){
      var url=URL.createObjectURL(f);
      var thumb=el("img",{style:{width:"50px",height:"50px",objectFit:"cover",borderRadius:"6px",border:"1px solid #C9A84C"}});
      thumb.src=url;prev.appendChild(thumb);
    });
  }));

  // User Videos
  var userVideoFiles=[];
  mediaWrap.appendChild(makeMediaSection("🎥","Videos","Your clips merged into final video","video/*",true,function(files,prev){
    userVideoFiles=files;prev.innerHTML="";
    files.forEach(function(f){
      var tag=el("div",{style:{background:"#2A3040",borderRadius:"6px",padding:"4px 8px",fontSize:"10px",color:"#E0E0E0",fontFamily:"monospace"}});
      tag.textContent="🎥 "+f.name.substring(0,20)+" ("+(f.size/1024/1024).toFixed(1)+"MB)";
      prev.appendChild(tag);
    });
  }));

  // Floor Plans
  var floorPlanFiles=[];
  mediaWrap.appendChild(makeMediaSection("📐","Floor Plans","Shown as dedicated slide with labels","image/*",true,function(files,prev){
    floorPlanFiles=files;prev.innerHTML="";
    files.forEach(function(f){
      var url=URL.createObjectURL(f);
      var thumb=el("img",{style:{width:"50px",height:"50px",objectFit:"contain",borderRadius:"6px",border:"1px solid #10B981",background:"#FFF"}});
      thumb.src=url;prev.appendChild(thumb);
    });
  }));

  // Music
  var musicFile=null;
  var musicSec=div({marginBottom:"10px",padding:"8px",background:"#1A1F2E",borderRadius:"8px",border:"1px solid #2A3040"});
  var musicHdr=div({display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"});
  musicHdr.appendChild(el("span",{style:{fontSize:"14px"}},"🎵"));
  musicHdr.appendChild(el("span",{style:{color:"#E0E0E0",fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace"}},"Background Music"));
  musicSec.appendChild(musicHdr);
  var musicSelect=el("select",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"6px",color:"#E0E0E0",fontSize:"10px",fontFamily:"monospace",marginBottom:"6px"}});
  [["none","No Music"],["ambient","🎹 Ambient Piano"],["upbeat","🎸 Upbeat Corporate"],["luxury","🎻 Luxury Orchestral"],["chill","🎧 Chill Lofi"],["dramatic","🥁 Dramatic Cinematic"],["custom","📂 Upload Your Music"]].forEach(function(o){
    var opt=el("option");opt.value=o[0];opt.textContent=o[1];musicSelect.appendChild(opt);
  });
  musicSec.appendChild(musicSelect);
  var musicFileInp=el("input",{type:"file",accept:"audio/*",style:{fontSize:"10px",color:"#8899AA",display:"none",marginTop:"4px",width:"100%"}});
  musicSelect.onchange=function(){musicFileInp.style.display=musicSelect.value==="custom"?"block":"none";};
  musicFileInp.onchange=function(){musicFile=musicFileInp.files[0]||null;};
  musicSec.appendChild(musicFileInp);
  mediaWrap.appendChild(musicSec);

  // Location
  var locationText="";
  var locSec=div({marginBottom:"4px",padding:"8px",background:"#1A1F2E",borderRadius:"8px",border:"1px solid #2A3040"});
  var locHdr=div({display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px"});
  locHdr.appendChild(el("span",{style:{fontSize:"14px"}},"📍"));
  locHdr.appendChild(el("span",{style:{color:"#E0E0E0",fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace"}},"Location / Map"));
  locSec.appendChild(locHdr);
  var locInp=el("input",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"6px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box"},placeholder:"e.g. Dubai Marina, Palm Jumeirah Tower A"});
  locInp.oninput=function(){locationText=locInp.value.trim();};
  locSec.appendChild(locInp);
  mediaWrap.appendChild(locSec);

  card.appendChild(mediaWrap);

  // Progress area
  var progressArea=div({display:"none",margin:"14px 0"});
  var progressBar=div({width:"100%",height:"8px",background:"#0D1117",borderRadius:"4px",overflow:"hidden"});
  var progressFill=div({width:"0%",height:"100%",background:"linear-gradient(90deg,#C9A84C,#F59E0B)",borderRadius:"4px",transition:"width 0.3s"});
  progressBar.appendChild(progressFill);progressArea.appendChild(progressBar);
  var progressLabel=el("div",{style:{color:"#C9A84C",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",marginTop:"6px",textAlign:"center"}});
  progressArea.appendChild(progressLabel);
  card.appendChild(progressArea);

  // Preview canvas
  var previewWrap=div({display:"none",margin:"10px 0",textAlign:"center"});
  var previewCanvas=el("canvas",{style:{maxWidth:"100%",maxHeight:"360px",borderRadius:"10px",border:"1px solid #2A3040"}});
  previewWrap.appendChild(previewCanvas);
  card.appendChild(previewWrap);

  // Result area
  var resultArea=div({display:"none",margin:"10px 0"});
  card.appendChild(resultArea);

  // Generate button
  var genBtn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,#C9A84C,#F59E0B)",color:"#000",border:"none",borderRadius:"10px",padding:"14px",fontSize:"14px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",margin:"10px 0"},onclick:async function(){
    var prompt=promptInp.value.trim();
    if(!prompt){alert("Enter a video description");return;}
    var geminiKey=localStorage.getItem("dv_gemini_key");
    if(!geminiKey){alert("Add Gemini API key in Setup first");return;}

    genBtn.disabled=true;genBtn.textContent="⏳ Starting...";
    progressArea.style.display="block";resultArea.style.display="none";

    try{
      // Step 1: Parse prompt with AI
      progressLabel.textContent="🤖 AI planning your video...";progressFill.style.width="5%";
      var plan=await parseVideoPromptAI(prompt);
      if(!plan||!plan.slides){throw new Error("AI could not create video plan");}

      // Step 2: Enrich with DB data
      progressLabel.textContent="📊 Loading real market data...";progressFill.style.width="10%";
      plan=enrichPlanWithDB(plan);

      // Step 3: Gather images
      progressLabel.textContent="🖼 Finding "+plan.slides.length+" images...";progressFill.style.width="15%";
      await gatherVideoImages(plan);

      // Step 4: Load user photos
      var userImgs=[];
      if(userPhotoFiles.length>0){
        progressLabel.textContent="📷 Loading your photos...";progressFill.style.width="18%";
        for(var ui=0;ui<userPhotoFiles.length;ui++){
          var url=URL.createObjectURL(userPhotoFiles[ui]);
          var im=await loadImg(url);
          if(im)userImgs.push(im);
        }
      }

      // Step 4b: Load floor plans → insert as slides
      if(floorPlanFiles.length>0){
        progressLabel.textContent="📐 Loading floor plans...";progressFill.style.width="19%";
        for(var fi=0;fi<floorPlanFiles.length;fi++){
          var fpUrl=URL.createObjectURL(floorPlanFiles[fi]);
          var fpImg=await loadImg(fpUrl);
          if(fpImg){
            var fpSlide={type:"floorplan",text:"Floor Plan",_fpImg:fpImg};
            var insertAt=Math.min(plan.slides.length-1,Math.round(plan.slides.length*0.6)+fi);
            plan.slides.splice(insertAt,0,fpSlide);
          }
        }
      }

      // Step 4c: Load user videos → insert as slides
      var userVids=[];
      if(userVideoFiles.length>0){
        progressLabel.textContent="🎥 Loading your videos...";progressFill.style.width="20%";
        for(var vi=0;vi<userVideoFiles.length;vi++){
          var vUrl=URL.createObjectURL(userVideoFiles[vi]);
          var vEl=document.createElement("video");
          vEl.src=vUrl;vEl.muted=true;vEl.playsInline=true;
          await new Promise(function(r){vEl.onloadedmetadata=r;vEl.onerror=r;});
          if(vEl.duration>0){
            userVids.push(vEl);
            var vidSlide={type:"user_video",text:"",_vidEl:vEl,_vidDur:Math.min(vEl.duration,10)};
            var vInsert=Math.min(plan.slides.length-1,Math.round(plan.slides.length*0.4)+vi);
            plan.slides.splice(vInsert,0,vidSlide);
          }
        }
      }

      // Step 4d: Location → insert map slide
      if(locationText){
        var mapSlide={type:"map",text:locationText,_location:locationText};
        plan.slides.splice(Math.max(1,plan.slides.length-2),0,mapSlide);
      }

      // Recalculate duration for new slides
      plan.duration=Math.max(plan.duration||30,plan.slides.length*3.5);

      // Step 5: Set canvas size
      var dims=formatSel.value.split("x");
      var cW=parseInt(dims[0]);var cH=parseInt(dims[1]);
      previewCanvas.width=cW;previewCanvas.height=cH;
      previewWrap.style.display="block";
      var pCtx=previewCanvas.getContext("2d");

      // Step 5b: Prepare music audio
      var musicCtx=null;var musicSource=null;var musicDest=null;
      var musicType=musicSelect.value;
      if(musicType!=="none"){
        try{
          musicCtx=new(window.AudioContext||window.webkitAudioContext)();
          musicDest=musicCtx.createMediaStreamDestination();
          if(musicType==="custom"&&musicFile){
            var abuf=await musicFile.arrayBuffer();
            var audioBuf=await musicCtx.decodeAudioData(abuf);
            musicSource=musicCtx.createBufferSource();
            musicSource.buffer=audioBuf;musicSource.loop=true;
            var gain=musicCtx.createGain();gain.gain.value=0.15;
            musicSource.connect(gain);gain.connect(musicDest);
            musicSource.start();
          }else{
            var presets={
              ambient:{notes:[261.6,329.6,392,523.3],pad:true,vol:0.025,lfoRate:0.15,detune:6},
              upbeat:{notes:[329.6,392,493.9,659.3],pad:false,vol:0.02,lfoRate:0.6,detune:3},
              luxury:{notes:[220,277.2,329.6,440],pad:true,vol:0.022,lfoRate:0.1,detune:8},
              chill:{notes:[196,261.6,293.7,392],pad:true,vol:0.02,lfoRate:0.2,detune:5},
              dramatic:{notes:[146.8,220,293.7,440],pad:false,vol:0.018,lfoRate:0.4,detune:4}
            };
            var preset=presets[musicType]||presets.ambient;
            var masterGain=musicCtx.createGain();masterGain.gain.value=preset.vol;
            masterGain.connect(musicDest);
            preset.notes.forEach(function(freq,ni){
              var o1=musicCtx.createOscillator();o1.type="sine";o1.frequency.value=freq;
              o1.detune.value=preset.detune;
              var o2=musicCtx.createOscillator();o2.type="triangle";o2.frequency.value=freq*1.002;
              var oGain=musicCtx.createGain();oGain.gain.value=ni===0?1:0.6;
              var lfo=musicCtx.createOscillator();lfo.type="sine";lfo.frequency.value=preset.lfoRate+ni*0.05;
              var lfoG=musicCtx.createGain();lfoG.gain.value=preset.pad?freq*0.02:freq*0.01;
              lfo.connect(lfoG);lfoG.connect(o1.frequency);lfo.start();
              o1.connect(oGain);o2.connect(oGain);oGain.connect(masterGain);
              o1.start();o2.start();
            });
            var subOsc=musicCtx.createOscillator();subOsc.type="sine";
            subOsc.frequency.value=preset.notes[0]/2;
            var subGain=musicCtx.createGain();subGain.gain.value=0.4;
            subOsc.connect(subGain);subGain.connect(masterGain);subOsc.start();
          }
        }catch(me){musicCtx=null;}
      }

      // Step 6: Render frames
      progressLabel.textContent="🎬 Rendering video...";progressFill.style.width="25%";
      var blob=await renderVideoFrames(previewCanvas,pCtx,plan,function(pct){
        var total=25+pct*0.65;
        progressFill.style.width=total+"%";
        progressLabel.textContent="🎬 Rendering... "+pct+"%";
      },userImgs,musicDest);

      if(musicCtx){try{musicCtx.close();}catch(e){}}
      userVids.forEach(function(v){try{v.pause();v.src="";}catch(e){}});

      progressFill.style.width="95%";
      progressLabel.textContent="✅ Video ready!";

      // Step 7: Voiceover (ElevenLabs or Web Speech)
      var voAudio=null;
      if(voiceCheck.checked&&plan.voiceover&&plan.voiceover.length>0){
        progressLabel.textContent="🎙 Generating voiceover...";
        try{voAudio=await speakVoiceoverEL(plan.voiceover,3);}catch(e){}
      }

      // Step 8: Show results
      progressFill.style.width="100%";
      resultArea.style.display="block";resultArea.innerHTML="";

      var videoUrl=URL.createObjectURL(blob);
      var videoEl=el("video",{style:{width:"100%",maxHeight:"300px",borderRadius:"10px",marginBottom:"10px"},controls:true,src:videoUrl});
      if(voAudio){
        videoEl.onplay=function(){voAudio.currentTime=0;voAudio.play();};
        videoEl.onpause=function(){voAudio.pause();};
        videoEl.onseeked=function(){voAudio.currentTime=videoEl.currentTime;};
      }
      resultArea.appendChild(videoEl);

      // Caption display
      if(plan.caption){
        var capBox=div({background:"#0D1117",borderRadius:"8px",padding:"10px",marginBottom:"8px"});
        capBox.appendChild(el("div",{style:{color:"#C9A84C",fontSize:"10px",fontWeight:"700",marginBottom:"4px"}},"📝 Caption:"));
        var capText=el("div",{style:{color:"#E0E0E0",fontSize:"11px",fontFamily:"'Inter',sans-serif",whiteSpace:"pre-wrap"}});
        capText.textContent=plan.caption;capBox.appendChild(capText);
        resultArea.appendChild(capBox);
      }

      // Action buttons
      var actRow=div({display:"flex",gap:"6px",flexWrap:"wrap"});
      var isMP4=blob.type.indexOf("mp4")!==-1;
      var vidExt=isMP4?"mp4":"webm";
      var dlBtn=el("button",{style:{flex:1,background:"#10B981",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
        var a=document.createElement("a");a.href=videoUrl;a.download="dubaival-video."+vidExt;a.click();
      }});
      dlBtn.textContent="⬇️ Download "+(isMP4?"MP4":"WebM");actRow.appendChild(dlBtn);

      var shareBtn=el("button",{style:{flex:1,background:"#3B82F6",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
        try{
          var file=new File([blob],"dubaival-video."+vidExt,{type:blob.type});
          await navigator.share({files:[file],title:"DubAIVal Video",text:plan.caption||""});
        }catch(err){var a=document.createElement("a");a.href=videoUrl;a.download="dubaival-video."+vidExt;a.click();}
      }});
      shareBtn.textContent="📤 Share";actRow.appendChild(shareBtn);

      if(voiceCheck.checked&&plan.voiceover){
        var voBtn=el("button",{style:{flex:1,background:"#8B5CF6",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
          videoEl.currentTime=0;videoEl.play();
          speakVoiceover(plan.voiceover,plan.duration/plan.slides.length);
        }});
        voBtn.textContent="🎙 Play + Voice";actRow.appendChild(voBtn);
      }

      if(plan.caption){
        var cpBtn=el("button",{style:{flex:1,background:"#F97316",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
          navigator.clipboard.writeText(plan.caption).then(function(){cpBtn.textContent="✅ Copied";setTimeout(function(){cpBtn.textContent="📋 Caption";},2000);});
        }});
        cpBtn.textContent="📋 Caption";actRow.appendChild(cpBtn);
      }
      resultArea.appendChild(actRow);

      genBtn.textContent="🎬 Generate Another";genBtn.disabled=false;
    }catch(err){
      progressLabel.textContent="❌ Error: "+err.message;
      genBtn.textContent="🎬 Generate Video";genBtn.disabled=false;
    }
  }});
  genBtn.textContent="🎬 Generate Video";
  card.appendChild(genBtn);

  // Close
  var closeBtn=el("button",{style:{width:"100%",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"10px",padding:"10px",fontSize:"12px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}});
  closeBtn.textContent="Close";
  card.appendChild(closeBtn);

  overlay.appendChild(card);
  overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- SMART IMAGE SEARCH ------------------------------------------------------
var DUBAI_IMAGE_MAP={
  "palm jumeirah":"palm jumeirah dubai luxury",
  "dubai marina":"dubai marina skyline towers",
  "downtown dubai":"downtown dubai burj khalifa",
  "business bay":"business bay dubai towers canal",
  "jbr":"jumeirah beach residence dubai",
  "dubai hills":"dubai hills estate villa",
  "creek harbour":"dubai creek harbour tower",
  "jumeirah":"jumeirah dubai beach luxury",
  "difc":"difc dubai financial center",
  "dubai creek":"dubai creek harbour skyline",
  "emaar beachfront":"emaar beachfront dubai",
  "bluewaters":"bluewaters island dubai",
  "sobha hartland":"sobha hartland dubai villa",
  "meydan":"meydan dubai racecourse",
  "mbr city":"mohammed bin rashid city dubai",
  "jvc":"jumeirah village circle dubai",
  "jlt":"jumeirah lake towers dubai",
  "al barsha":"al barsha dubai",
  "deira":"deira dubai gold souk",
  "silicon oasis":"dubai silicon oasis",
  "sports city":"dubai sports city",
  "motor city":"dubai motor city",
  "production city":"dubai production city",
  "arabian ranches":"arabian ranches dubai villa",
  "tilal al ghaf":"tilal al ghaf dubai lagoon",
  "district one":"district one mbr city dubai",
  "palm jebel ali":"palm jebel ali dubai",
  "za'abeel":"zaabeel dubai skyline",
  "city walk":"city walk dubai meraas",
  "la mer":"la mer dubai beach"
};

var TOPIC_KEYWORDS={
  "luxury":"luxury penthouse interior design",
  "villa":"dubai luxury villa pool garden",
  "apartment":"modern apartment interior dubai",
  "sea view":"dubai sea view panoramic ocean",
  "investment":"dubai real estate investment skyline",
  "yield":"dubai property investment returns",
  "rental":"dubai apartment rental modern",
  "off-plan":"dubai construction new development",
  "penthouse":"penthouse luxury rooftop dubai",
  "beach":"dubai beach waterfront property",
  "golf":"dubai golf course villa green",
  "canal":"dubai water canal view",
  "skyline":"dubai skyline night cityscape",
  "pool":"luxury pool villa dubai",
  "garden":"dubai garden park villa",
  "family":"family villa dubai community",
  "tower":"dubai tower skyscraper modern"
};

var BUILDING_IMAGE_MAP={
  "five palm":"FIVE Palm Jumeirah hotel Dubai beachfront modern",
  "atlantis the royal":"Atlantis The Royal Dubai luxury resort",
  "atlantis the palm":"Atlantis The Palm Dubai iconic resort",
  "burj al arab":"Burj Al Arab Dubai sail hotel iconic",
  "one za'abeel":"One Za'abeel Dubai skyscraper cantilever",
  "address downtown":"Address Downtown Dubai hotel fountain view",
  "address beach":"Address Beach Resort Dubai JBR",
  "palazzo versace":"Palazzo Versace Dubai luxury hotel",
  "bulgari resort":"Bulgari Resort Dubai Jumeira Bay",
  "cayan tower":"Cayan Tower Dubai Marina twisted tower",
  "princess tower":"Princess Tower Dubai Marina tallest residential",
  "marina 101":"Marina 101 Dubai Marina tower",
  "damac towers":"DAMAC Towers Dubai luxury residential",
  "bluewaters":"Bluewaters Island Dubai Ain Dubai",
  "opus":"The Opus Dubai Zaha Hadid ME hotel",
  "museum of the future":"Museum of the Future Dubai torus building",
  "dubai frame":"Dubai Frame Zabeel Park landmark",
  "emaar beachfront":"Emaar Beachfront Dubai harbour residences",
  "sobha hartland":"Sobha Hartland Dubai MBR City villas",
  "one palm":"One Palm Jumeirah Dubai penthouse",
  "the palm tower":"The Palm Tower Dubai observation deck",
  "nakheel mall":"Nakheel Mall Palm Jumeirah Dubai",
  "marina gate":"Marina Gate Dubai Marina towers",
  "dubai creek tower":"Dubai Creek Tower harbour landmark"
};

function extractImageKeywords(caption){
  var text=caption.toLowerCase();

  var bldgKeys=Object.keys(BUILDING_IMAGE_MAP);
  for(var b=0;b<bldgKeys.length;b++){
    if(text.indexOf(bldgKeys[b])!==-1)return BUILDING_IMAGE_MAP[bldgKeys[b]];
  }

  var keywords=["dubai real estate"];
  var areaKeys=Object.keys(DUBAI_IMAGE_MAP);
  for(var i=0;i<areaKeys.length;i++){
    if(text.indexOf(areaKeys[i])!==-1){keywords=[DUBAI_IMAGE_MAP[areaKeys[i]]];break;}
  }
  var topicKeys=Object.keys(TOPIC_KEYWORDS);
  for(var j=0;j<topicKeys.length;j++){
    if(text.indexOf(topicKeys[j])!==-1){keywords.push(topicKeys[j]);break;}
  }
  if(keywords.length===1)keywords.push("luxury property");
  return keywords.join(" ");
}

async function searchUnsplash(query){
  var key=localStorage.getItem("dv_unsplash_key");
  if(!key)return null;
  try{
    var r=await fetch("https://api.unsplash.com/search/photos?query="+encodeURIComponent(query)+"&per_page=5&orientation=squarish",{
      headers:{"Authorization":"Client-ID "+key}
    });
    var d=await r.json();
    if(d.results&&d.results.length>0){
      var idx=Math.floor(Math.random()*Math.min(d.results.length,3));
      return d.results[idx].urls.regular||d.results[idx].urls.full;
    }
  }catch(e){}
  return null;
}

async function searchPexels(query){
  var key=localStorage.getItem("dv_pexels_key");
  if(!key)return null;
  try{
    var r=await fetch("https://api.pexels.com/v1/search?query="+encodeURIComponent(query)+"&per_page=5&orientation=square",{
      headers:{"Authorization":key}
    });
    var d=await r.json();
    if(d.photos&&d.photos.length>0){
      var idx=Math.floor(Math.random()*Math.min(d.photos.length,3));
      return d.photos[idx].src.large2x||d.photos[idx].src.large;
    }
  }catch(e){}
  return null;
}

async function uploadToPublicHost(blob){
  try{
    var fd=new FormData();
    fd.append("file",blob,"image.png");
    var r=await fetch("https://telegra.ph/upload",{method:"POST",body:fd});
    var d=await r.json();
    if(d&&d[0]&&d[0].src)return "https://telegra.ph"+d[0].src;
  }catch(e){console.log("Upload error:",e);}
  return null;
}

async function generateGeminiImage(query){
  var key=localStorage.getItem("dv_gemini_key");
  if(!key)return null;
  try{
    var prompt="Generate a photorealistic image of "+query+". Professional real estate photography, high resolution, architectural detail, golden hour lighting, cinematic composition. No text, no watermarks, no logos.";
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key="+key,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:["IMAGE","TEXT"],imageMimeType:"image/jpeg"}})
    });
    var d=await r.json();
    if(d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts){
      var parts=d.candidates[0].content.parts;
      for(var i=0;i<parts.length;i++){
        if(parts[i].inlineData&&parts[i].inlineData.data){
          var blob=await fetch("data:"+(parts[i].inlineData.mimeType||"image/jpeg")+";base64,"+parts[i].inlineData.data).then(function(r){return r.blob();});
          var publicUrl=await uploadToPublicHost(blob);
          if(publicUrl){console.log("[DubAIVal] Gemini image uploaded to public URL");return publicUrl;}
          return URL.createObjectURL(blob);
        }
      }
    }
  }catch(e){console.log("Gemini image error:",e);}
  return null;
}

async function searchUnsplashMulti(query,count){
  var key=localStorage.getItem("dv_unsplash_key");
  if(!key)return[];
  try{
    var r=await fetch("https://api.unsplash.com/search/photos?query="+encodeURIComponent(query)+"&per_page="+Math.min(count+2,10)+"&orientation=squarish",{
      headers:{"Authorization":"Client-ID "+key}
    });
    var d=await r.json();
    if(d.results&&d.results.length>0)return d.results.map(function(p){return p.urls.regular||p.urls.full;});
  }catch(e){}
  return[];
}

async function searchPexelsMulti(query,count){
  var key=localStorage.getItem("dv_pexels_key");
  if(!key)return[];
  try{
    var r=await fetch("https://api.pexels.com/v1/search?query="+encodeURIComponent(query)+"&per_page="+Math.min(count+2,10)+"&orientation=square",{
      headers:{"Authorization":key}
    });
    var d=await r.json();
    if(d.photos&&d.photos.length>0)return d.photos.map(function(p){return p.src.large2x||p.src.large;});
  }catch(e){}
  return[];
}

async function findSmartImage(caption){
  var imgs=await findMultipleImages(caption,1);
  return imgs[0];
}

async function findMultipleImages(caption,count){
  var query=extractImageKeywords(caption);
  var collected=[];

  var unsplashImgs=await searchUnsplashMulti(query,count);
  for(var u=0;u<unsplashImgs.length&&collected.length<count;u++)collected.push(unsplashImgs[u]);
  if(collected.length>=count){console.log("[DubAIVal] "+collected.length+" images from Unsplash");return collected;}

  var pexelsImgs=await searchPexelsMulti(query,count-collected.length);
  for(var p=0;p<pexelsImgs.length&&collected.length<count;p++)collected.push(pexelsImgs[p]);
  if(collected.length>=count){console.log("[DubAIVal] "+collected.length+" images from Unsplash+Pexels");return collected;}

  var remaining=count-collected.length;
  for(var g=0;g<remaining;g++){
    var geminiImg=await generateGeminiImage(query+(g>0?" angle "+(g+1):""));
    if(geminiImg)collected.push(geminiImg);
  }
  if(collected.length>0){console.log("[DubAIVal] "+collected.length+" images total (incl. Gemini)");return collected;}

  var fallbacks=[
    "https://images.pexels.com/photos/3769312/pexels-photo-3769312.jpeg?auto=compress&w=1080",
    "https://images.pexels.com/photos/2041556/pexels-photo-2041556.jpeg?auto=compress&w=1080",
    "https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&w=1080",
    "https://images.pexels.com/photos/2115367/pexels-photo-2115367.jpeg?auto=compress&w=1080",
    "https://images.pexels.com/photos/2193300/pexels-photo-2193300.jpeg?auto=compress&w=1080",
    "https://images.pexels.com/photos/1268871/pexels-photo-1268871.jpeg?auto=compress&w=1080",
    "https://images.pexels.com/photos/1838640/pexels-photo-1838640.jpeg?auto=compress&w=1080",
    "https://images.pexels.com/photos/3586966/pexels-photo-3586966.jpeg?auto=compress&w=1080"
  ];
  for(var f=0;f<Math.min(count,fallbacks.length);f++)collected.push(fallbacks[f]);
  return collected;
}

async function publishToInstagram(caption,imageUrls){
  try{
    var c=getSocialCreds();
    if(!c)return{success:false,error:"Social media not configured. Use Setup button to configure."};
    if(!imageUrls)imageUrls=[await findSmartImage(caption)];
    if(typeof imageUrls==="string")imageUrls=[imageUrls];

    if(imageUrls.length===1){
      var params=new URLSearchParams({image_url:imageUrls[0],caption:caption,access_token:c.token});
      var r1=await fetch(GRAPH_BASE+c.igId+"/media",{method:"POST",body:params});
      var d1=await r1.json();
      if(d1.error)return{success:false,error:d1.error.message};
      for(var attempt=0;attempt<10;attempt++){
        await new Promise(function(r){setTimeout(r,3000);});
        var sr=await fetch(GRAPH_BASE+d1.id+"?fields=status_code&access_token="+c.token);
        var sd=await sr.json();
        if(sd.status_code==="FINISHED")break;
        if(sd.status_code==="ERROR")return{success:false,error:"Instagram rejected the image"};
      }
      var params2=new URLSearchParams({creation_id:d1.id,access_token:c.token});
      var r2=await fetch(GRAPH_BASE+c.igId+"/media_publish",{method:"POST",body:params2});
      var d2=await r2.json();
      if(d2.error)return{success:false,error:d2.error.message};
      return{success:true,media_id:d2.id};
    }

    var childIds=[];
    for(var i=0;i<imageUrls.length;i++){
      var cp=new URLSearchParams({image_url:imageUrls[i],is_carousel_item:"true",access_token:c.token});
      var cr=await fetch(GRAPH_BASE+c.igId+"/media",{method:"POST",body:cp});
      var cd=await cr.json();
      if(cd.error)return{success:false,error:"Image "+(i+1)+": "+cd.error.message};
      for(var w=0;w<10;w++){
        await new Promise(function(r){setTimeout(r,3000);});
        var ws=await fetch(GRAPH_BASE+cd.id+"?fields=status_code&access_token="+c.token);
        var wd=await ws.json();
        if(wd.status_code==="FINISHED")break;
        if(wd.status_code==="ERROR")return{success:false,error:"Image "+(i+1)+" rejected by Instagram"};
      }
      childIds.push(cd.id);
    }
    var carouselParams=new URLSearchParams({media_type:"CAROUSEL",caption:caption,access_token:c.token});
    childIds.forEach(function(id){carouselParams.append("children",id);});
    var carR=await fetch(GRAPH_BASE+c.igId+"/media",{method:"POST",body:carouselParams});
    var carD=await carR.json();
    if(carD.error)return{success:false,error:carD.error.message};
    for(var ca=0;ca<10;ca++){
      await new Promise(function(r){setTimeout(r,3000);});
      var cs=await fetch(GRAPH_BASE+carD.id+"?fields=status_code&access_token="+c.token);
      var csd=await cs.json();
      if(csd.status_code==="FINISHED")break;
    }
    var pubR=await fetch(GRAPH_BASE+c.igId+"/media_publish",{method:"POST",body:new URLSearchParams({creation_id:carD.id,access_token:c.token})});
    var pubD=await pubR.json();
    if(pubD.error)return{success:false,error:pubD.error.message};
    return{success:true,media_id:pubD.id,carousel:true,count:childIds.length};
  }catch(e){return{success:false,error:e.message};}
}

async function getPageToken(){
  var c=getSocialCreds();
  if(!c||!c.fbId)return null;
  try{
    var pr=await fetch(GRAPH_BASE+"me/accounts?access_token="+c.token);
    var pd=await pr.json();
    if(pd.data){var pg=pd.data.find(function(p){return p.id===c.fbId;});if(pg&&pg.access_token)return pg.access_token;}
  }catch(e){}
  return c.token;
}

async function waitForMedia(mediaId,token,maxAttempts){
  for(var i=0;i<(maxAttempts||10);i++){
    await new Promise(function(r){setTimeout(r,3000);});
    var sr=await fetch(GRAPH_BASE+mediaId+"?fields=status_code&access_token="+token);
    var sd=await sr.json();
    if(sd.status_code==="FINISHED")return{ready:true};
    if(sd.status_code==="ERROR")return{ready:false,error:"Media rejected"};
  }
  return{ready:true};
}

async function publishInstagramStory(caption,imageUrl){
  try{
    var c=getSocialCreds();
    if(!c)return{success:false,error:"Not configured"};
    if(!imageUrl)imageUrl=await findSmartImage(caption);
    var params=new URLSearchParams({media_type:"STORIES",image_url:imageUrl,access_token:c.token});
    var r1=await fetch(GRAPH_BASE+c.igId+"/media",{method:"POST",body:params});
    var d1=await r1.json();
    if(d1.error)return{success:false,error:d1.error.message};
    var w=await waitForMedia(d1.id,c.token);
    if(!w.ready)return{success:false,error:w.error};
    var r2=await fetch(GRAPH_BASE+c.igId+"/media_publish",{method:"POST",body:new URLSearchParams({creation_id:d1.id,access_token:c.token})});
    var d2=await r2.json();
    if(d2.error)return{success:false,error:d2.error.message};
    return{success:true,media_id:d2.id};
  }catch(e){return{success:false,error:e.message};}
}

async function publishInstagramVideoStory(videoUrl){
  try{
    var c=getSocialCreds();
    if(!c)return{success:false,error:"Not configured"};
    var params=new URLSearchParams({media_type:"STORIES",video_url:videoUrl,access_token:c.token});
    var r1=await fetch(GRAPH_BASE+c.igId+"/media",{method:"POST",body:params});
    var d1=await r1.json();
    if(d1.error)return{success:false,error:d1.error.message};
    var w=await waitForMedia(d1.id,c.token,20);
    if(!w.ready)return{success:false,error:w.error};
    var r2=await fetch(GRAPH_BASE+c.igId+"/media_publish",{method:"POST",body:new URLSearchParams({creation_id:d1.id,access_token:c.token})});
    var d2=await r2.json();
    if(d2.error)return{success:false,error:d2.error.message};
    return{success:true,media_id:d2.id};
  }catch(e){return{success:false,error:e.message};}
}

async function publishInstagramReel(caption,videoUrl){
  try{
    var c=getSocialCreds();
    if(!c)return{success:false,error:"Not configured"};
    if(!videoUrl)return{success:false,error:"Video URL required for Reels"};
    var params=new URLSearchParams({media_type:"REELS",video_url:videoUrl,caption:caption,share_to_feed:"true",access_token:c.token});
    var r1=await fetch(GRAPH_BASE+c.igId+"/media",{method:"POST",body:params});
    var d1=await r1.json();
    if(d1.error)return{success:false,error:d1.error.message};
    var w=await waitForMedia(d1.id,c.token,20);
    if(!w.ready)return{success:false,error:w.error};
    var r2=await fetch(GRAPH_BASE+c.igId+"/media_publish",{method:"POST",body:new URLSearchParams({creation_id:d1.id,access_token:c.token})});
    var d2=await r2.json();
    if(d2.error)return{success:false,error:d2.error.message};
    return{success:true,media_id:d2.id};
  }catch(e){return{success:false,error:e.message};}
}

async function publishToFacebook(message,imageUrls){
  try{
    var c=getSocialCreds();
    if(!c||!c.fbId)return{success:false,error:"Facebook Page ID not configured."};
    var pageToken=await getPageToken();

    if(!imageUrls||imageUrls.length===0){
      var params=new URLSearchParams({message:message,access_token:pageToken});
      var r=await fetch(GRAPH_BASE+c.fbId+"/feed",{method:"POST",body:params});
      var d=await r.json();
      if(d.error)return{success:false,error:d.error.message};
      return{success:true,post_id:d.id};
    }

    if(imageUrls.length===1){
      var pp=new URLSearchParams({url:imageUrls[0],message:message,access_token:pageToken});
      var pr=await fetch(GRAPH_BASE+c.fbId+"/photos",{method:"POST",body:pp});
      var pd=await pr.json();
      if(pd.error)return{success:false,error:pd.error.message};
      return{success:true,post_id:pd.id||pd.post_id};
    }

    var photoIds=[];
    for(var i=0;i<imageUrls.length;i++){
      var up=new URLSearchParams({url:imageUrls[i],published:"false",access_token:pageToken});
      var ur=await fetch(GRAPH_BASE+c.fbId+"/photos",{method:"POST",body:up});
      var ud=await ur.json();
      if(ud.error)return{success:false,error:"Photo "+(i+1)+": "+ud.error.message};
      photoIds.push(ud.id);
    }
    var feedParams=new URLSearchParams({message:message,access_token:pageToken});
    photoIds.forEach(function(id,idx){feedParams.append("attached_media["+idx+"]",'{"media_fbid":"'+id+'"}');});
    var fr=await fetch(GRAPH_BASE+c.fbId+"/feed",{method:"POST",body:feedParams});
    var fd=await fr.json();
    if(fd.error)return{success:false,error:fd.error.message};
    return{success:true,post_id:fd.id,multi:true,count:photoIds.length};
  }catch(e){return{success:false,error:e.message};}
}

async function publishFacebookVideo(message,videoUrl){
  try{
    var c=getSocialCreds();
    if(!c||!c.fbId)return{success:false,error:"Facebook Page ID not configured."};
    var pageToken=await getPageToken();
    var params=new URLSearchParams({file_url:videoUrl,description:message,access_token:pageToken});
    var r=await fetch(GRAPH_BASE+c.fbId+"/videos",{method:"POST",body:params});
    var d=await r.json();
    if(d.error)return{success:false,error:d.error.message};
    return{success:true,video_id:d.id};
  }catch(e){return{success:false,error:e.message};}
}

async function publishFacebookReel(message,videoUrl){
  try{
    var c=getSocialCreds();
    if(!c||!c.fbId)return{success:false,error:"Facebook Page ID not configured."};
    var pageToken=await getPageToken();
    var sp=new URLSearchParams({upload_phase:"start",access_token:pageToken});
    var sr=await fetch(GRAPH_BASE+c.fbId+"/video_reels",{method:"POST",body:sp});
    var sd=await sr.json();
    if(sd.error)return{success:false,error:sd.error.message};
    var vid=sd.video_id;
    var up=await fetch("https://rupload.facebook.com/video-upload/v21.0/"+vid,{
      method:"POST",
      headers:{"Authorization":"OAuth "+pageToken,"file_url":videoUrl}
    });
    var fp=new URLSearchParams({upload_phase:"finish",video_id:vid,description:message,access_token:pageToken});
    var fr=await fetch(GRAPH_BASE+c.fbId+"/video_reels",{method:"POST",body:fp});
    var frd=await fr.json();
    if(frd.error)return{success:false,error:frd.error.message};
    return{success:true,video_id:vid};
  }catch(e){return{success:false,error:e.message};}
}

function shareToWhatsApp(text){
  window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank");
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

// --- BEST TIME TO POST ENGINE ---
var DUBAI_BEST_TIMES={
  instagram:{weekday:["07:00","10:00","13:00","19:00","21:00"],weekend:["09:00","11:00","14:00","20:00","22:00"],peak:"19:00",timezone:"GST (UTC+4)",notes:"Dubai audience most active evenings; Friday brunch posts do well at 11AM"},
  facebook:{weekday:["08:00","12:00","17:00","20:00"],weekend:["10:00","13:00","18:00"],peak:"12:00",timezone:"GST (UTC+4)",notes:"Lunch break & evening commute. Thursday evening is premium slot"},
  linkedin:{weekday:["08:00","10:00","12:00","17:00"],weekend:["10:00"],peak:"10:00",timezone:"GST (UTC+4)",notes:"Business hours. Tuesday-Thursday best. Avoid Friday/Saturday"},
  twitter:{weekday:["07:00","12:00","17:00","21:00"],weekend:["09:00","15:00","21:00"],peak:"12:00",timezone:"GST (UTC+4)",notes:"News cycle peaks at noon. Real estate threads best Tuesday/Wednesday"},
  tiktok:{weekday:["12:00","19:00","21:00","23:00"],weekend:["10:00","14:00","20:00","23:00"],peak:"21:00",timezone:"GST (UTC+4)",notes:"Evening/night peaks. Property tours at 19:00 get most views"},
  whatsapp:{weekday:["09:00","13:00","18:00"],weekend:["10:00","16:00"],peak:"09:00",timezone:"GST (UTC+4)",notes:"Morning broadcasts convert best. Avoid late night"},
  youtube:{weekday:["12:00","15:00","17:00","20:00"],weekend:["10:00","14:00","18:00","21:00"],peak:"17:00",timezone:"GST (UTC+4)",notes:"Afternoon/evening best. Property tours at 15:00, market updates at 17:00. Shorts anytime"}
};
function getBestPostTime(platform){
  var now=new Date();var isWeekend=now.getDay()===5||now.getDay()===6;
  var p=DUBAI_BEST_TIMES[platform]||DUBAI_BEST_TIMES.instagram;
  var times=isWeekend?p.weekend:p.weekday;
  var hour=now.getHours();var best=null;var minDiff=999;
  times.forEach(function(t){var h=parseInt(t);var diff=h-hour;if(diff<0)diff+=24;if(diff<minDiff){minDiff=diff;best=t;}});
  return{next:best,all:times,peak:p.peak,isWeekend:isWeekend,notes:p.notes,timezone:p.timezone};
}
function showBestTimeModal(platform){
  var m=document.getElementById("besttime-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"10px"},id:"besttime-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #F59E0B",borderRadius:"16px",padding:"20px",width:"440px",maxWidth:"96vw"});
  card.appendChild(el("h3",{style:{color:"#F59E0B",margin:"0 0 12px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"🕐 Best Time to Post — Dubai"));
  var platforms=Object.keys(DUBAI_BEST_TIMES);
  platforms.forEach(function(p){
    var info=getBestPostTime(p);
    var pCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"10px",padding:"10px",marginBottom:"8px"});
    var icons={instagram:"📸",facebook:"📘",linkedin:"💼",twitter:"𝕏",tiktok:"🎵",whatsapp:"📲"};
    pCard.appendChild(el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
      el("span",{style:{color:"#FFF",fontSize:"12px",fontWeight:"700",fontFamily:"monospace"}},(icons[p]||"📱")+" "+p.charAt(0).toUpperCase()+p.slice(1)),
      el("span",{style:{color:"#10B981",fontSize:"11px",fontFamily:"monospace"}},"Next: "+info.next)
    ));
    var timesRow=div({display:"flex",gap:"4px",marginTop:"6px",flexWrap:"wrap"});
    info.all.forEach(function(t){
      var chip=el("span",{style:{background:t===info.peak?"#F59E0B22":"#0D1117",border:"1px solid "+(t===info.peak?"#F59E0B":"#2A3040"),color:t===info.peak?"#F59E0B":"#8899AA",padding:"2px 8px",borderRadius:"10px",fontSize:"9px",fontFamily:"monospace"}});
      chip.textContent=t+(t===info.peak?" ⭐":"");timesRow.appendChild(chip);
    });pCard.appendChild(timesRow);
    pCard.appendChild(el("div",{style:{color:"#6B7280",fontSize:"9px",marginTop:"4px",fontFamily:"monospace"}},info.notes));
    card.appendChild(pCard);
  });
  card.appendChild(el("div",{style:{color:"#6B7280",fontSize:"9px",marginTop:"6px",textAlign:"center",fontFamily:"monospace"}},"All times in GST (UTC+4) · "+(getBestPostTime("instagram").isWeekend?"Weekend":"Weekday")+" schedule"));
  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- POST PERFORMANCE ANALYTICS ---
function getPostHistory(){try{return JSON.parse(localStorage.getItem("dv_post_history")||"[]");}catch(e){return[];}}
function savePostToHistory(post){
  var h=getPostHistory();
  post.id="post_"+Date.now();post.postedAt=new Date().toISOString();
  h.unshift(post);if(h.length>200)h=h.slice(0,200);
  localStorage.setItem("dv_post_history",JSON.stringify(h));
}
function showPostAnalytics(){
  var m=document.getElementById("analytics-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"analytics-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #8B5CF6",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#8B5CF6",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"📊 Post Performance Analytics"));
  var history=getPostHistory();
  if(history.length===0){card.appendChild(el("p",{style:{color:"#8899AA",fontSize:"12px",textAlign:"center"}},"No posts tracked yet. Posts will appear here after publishing."));
  }else{
    var stats={total:history.length,platforms:{},types:{},areas:{}};
    history.forEach(function(p){
      stats.platforms[p.platform]=(stats.platforms[p.platform]||0)+1;
      stats.types[p.type||"post"]=(stats.types[p.type||"post"]||0)+1;
      if(p.area)stats.areas[p.area]=(stats.areas[p.area]||0)+1;
    });
    var statGrid=div({display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"12px"});
    [{l:"Total Posts",v:stats.total,c:"#8B5CF6"},{l:"This Week",v:history.filter(function(p){return Date.now()-new Date(p.postedAt).getTime()<7*86400000;}).length,c:"#10B981"},{l:"This Month",v:history.filter(function(p){return new Date(p.postedAt).getMonth()===new Date().getMonth();}).length,c:"#F59E0B"}].forEach(function(s){
      var sc=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"10px",padding:"10px",textAlign:"center"});
      sc.appendChild(el("div",{style:{color:s.c,fontSize:"20px",fontWeight:"800",fontFamily:"monospace"}},String(s.v)));
      sc.appendChild(el("div",{style:{color:"#8899AA",fontSize:"9px",fontFamily:"monospace"}},s.l));statGrid.appendChild(sc);
    });card.appendChild(statGrid);
    card.appendChild(el("div",{style:{color:"#FFF",fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginBottom:"6px"}},"Platform Breakdown"));
    var platWrap=div({display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"12px"});
    var icons={instagram:"📸",facebook:"📘",linkedin:"💼",twitter:"𝕏",tiktok:"🎵",whatsapp:"📲"};
    Object.keys(stats.platforms).forEach(function(p){
      var pct=Math.round(stats.platforms[p]/stats.total*100);
      platWrap.appendChild(el("div",{style:{background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"6px 10px",fontSize:"10px",fontFamily:"monospace",color:"#E0E0E0"}},(icons[p]||"📱")+" "+p+": "+stats.platforms[p]+" ("+pct+"%)"));
    });card.appendChild(platWrap);
    card.appendChild(el("div",{style:{color:"#FFF",fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginBottom:"6px"}},"Recent Posts"));
    history.slice(0,10).forEach(function(p){
      var pCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",marginBottom:"4px"});
      var hdr=div({display:"flex",justifyContent:"space-between",alignItems:"center"});
      hdr.appendChild(el("span",{style:{color:"#8B5CF6",fontSize:"10px",fontFamily:"monospace"}},(icons[p.platform]||"📱")+" "+new Date(p.postedAt).toLocaleDateString()));
      hdr.appendChild(el("span",{style:{color:"#6B7280",fontSize:"9px",fontFamily:"monospace"}},p.type||"post"));
      pCard.appendChild(hdr);
      pCard.appendChild(el("div",{style:{color:"#CCC",fontSize:"10px",marginTop:"4px",maxHeight:"30px",overflow:"hidden"}},(p.caption||"").substring(0,100)+"..."));
      card.appendChild(pCard);
    });
  }
  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- AI CAPTION REWRITER (Platform-Optimized) ---
async function rewriteCaptionForPlatform(caption,targetPlatform){
  var geminiKey=localStorage.getItem("dv_gemini_key");if(!geminiKey)return null;
  var bp=getBrandProfile();var brandCtx=bp?" Brand: "+bp.name+(bp.tone?", Tone: "+bp.tone:""):"";
  var limits={instagram:"2200 chars, 30 hashtags max, emoji-rich, visual hooks",facebook:"63206 chars, longer form OK, link-friendly, professional",linkedin:"3000 chars, professional/corporate, no emojis overload, thought-leadership",twitter:"280 chars STRICT, punchy, thread-friendly, 2-3 hashtags max",tiktok:"2200 chars, Gen-Z friendly, trending sounds reference, casual",whatsapp:"Short & punchy, 3-4 lines, broadcast-friendly, direct CTA"};
  try{
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:"You are an expert social media copywriter for Dubai luxury real estate."+brandCtx+"\n\nOriginal caption:\n"+caption+"\n\nRewrite this caption SPECIFICALLY optimized for "+targetPlatform+".\nPlatform rules: "+limits[targetPlatform]+"\n\nDubai real estate context. Keep all data/numbers accurate. Adapt tone, length, hashtags, emojis, and CTA for "+targetPlatform+".\n\nRespond in valid JSON:\n{\"caption\":\"THE REWRITTEN CAPTION\",\"charCount\":123,\"tips\":\"Brief tip about why this version works better for "+targetPlatform+"\"}"}]}],generationConfig:{responseMimeType:"application/json"}})
    });
    var d=await r.json();
    if(d.candidates&&d.candidates[0])return JSON.parse(d.candidates[0].content.parts[0].text);
  }catch(e){}return null;
}
function showCaptionRewriter(caption){
  var m=document.getElementById("rewriter-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"rewriter-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #EC4899",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#EC4899",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"✍️ AI Caption Rewriter"));
  card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",marginBottom:"10px",fontFamily:"monospace"}},"Select a platform to optimize your caption:"));
  var platforms=[{k:"instagram",icon:"📸",color:"#E1306C"},{k:"facebook",icon:"📘",color:"#1877F2"},{k:"linkedin",icon:"💼",color:"#0A66C2"},{k:"twitter",icon:"𝕏",color:"#1DA1F2"},{k:"tiktok",icon:"🎵",color:"#FF0050"},{k:"whatsapp",icon:"📲",color:"#25D366"}];
  var resultArea=div({});
  var platRow=div({display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"12px"});
  platforms.forEach(function(p){
    platRow.appendChild(el("button",{style:{background:hexAlpha(p.color,0.12),border:"1px solid "+hexAlpha(p.color,0.3),color:p.color,padding:"8px 14px",borderRadius:"8px",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
      this.textContent="⏳ Rewriting...";resultArea.innerHTML="";
      var result=await rewriteCaptionForPlatform(caption,p.k);
      this.textContent=p.icon+" "+p.k.charAt(0).toUpperCase()+p.k.slice(1);
      if(!result){resultArea.appendChild(el("p",{style:{color:"#EF4444",fontSize:"11px"}},"❌ Check Gemini API key."));return;}
      var rCard=div({background:"#0D1117",border:"1px solid "+hexAlpha(p.color,0.3),borderRadius:"10px",padding:"12px"});
      rCard.appendChild(el("div",{style:{color:p.color,fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginBottom:"6px"}},p.icon+" Optimized for "+p.k.charAt(0).toUpperCase()+p.k.slice(1)+" ("+result.charCount+" chars)"));
      var textEl=el("div",{style:{color:"#E0E0E0",fontSize:"11px",lineHeight:"1.5",whiteSpace:"pre-wrap",maxHeight:"200px",overflowY:"auto"}});textEl.textContent=result.caption;rCard.appendChild(textEl);
      if(result.tips){rCard.appendChild(el("div",{style:{color:"#6B7280",fontSize:"9px",marginTop:"6px",fontStyle:"italic"}},"💡 "+result.tips));}
      var copyBtn=el("button",{style:{marginTop:"8px",background:hexAlpha(p.color,0.15),border:"1px solid "+hexAlpha(p.color,0.3),color:p.color,padding:"6px 14px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
        navigator.clipboard.writeText(result.caption);copyBtn.textContent="✅ Copied!";setTimeout(function(){copyBtn.textContent="📋 Copy";},2000);
      }});copyBtn.textContent="📋 Copy";rCard.appendChild(copyBtn);
      resultArea.appendChild(rCard);
    }},p.icon+" "+p.k.charAt(0).toUpperCase()+p.k.slice(1)));
  });card.appendChild(platRow);card.appendChild(resultArea);
  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- COMPETITOR HASHTAG SPY ---
async function spyCompetitorHashtags(competitors){
  var geminiKey=localStorage.getItem("dv_gemini_key");if(!geminiKey)return null;
  try{
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:"You are a Dubai real estate social media intelligence expert.\n\nAnalyze the hashtag strategies of these Dubai real estate competitors/accounts:\n"+(competitors||"@dubaiproperties, @emaborhman, @faborhman, @aboralianrealtor, @dubailuxury")+"\n\nBased on your knowledge of Dubai real estate Instagram marketing:\n1. What are their most-used hashtags?\n2. What niche hashtags do they use that have less competition?\n3. What hashtags are they missing that could boost reach?\n4. Suggest unique hashtag combinations we can own\n\nRespond in valid JSON:\n{\"competitors\":[{\"name\":\"@account\",\"top_hashtags\":[\"#tag1\"],\"strategy\":\"brief description\"}],\"niche_gems\":[{\"tag\":\"#tag\",\"why\":\"reason\"}],\"gaps\":[{\"tag\":\"#tag\",\"opportunity\":\"why\"}],\"unique_combos\":[\"#combo1 #combo2 #combo3\"],\"summary\":\"overall strategy recommendation\"}"}]}],generationConfig:{responseMimeType:"application/json"}})
    });
    var d=await r.json();
    if(d.candidates&&d.candidates[0])return JSON.parse(d.candidates[0].content.parts[0].text);
  }catch(e){}return null;
}
function showCompetitorSpy(){
  var m=document.getElementById("spy-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"spy-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #EF4444",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#EF4444",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"🕵️ Competitor Hashtag Spy"));
  var compInput=el("textarea",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box",minHeight:"50px",resize:"vertical"},placeholder:"Enter competitor Instagram handles (comma separated)\ne.g. @dubailuxury, @emaarproperties, @damacofficial"});
  card.appendChild(compInput);
  var analyzeBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"#EF4444",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
    analyzeBtn.textContent="🔍 Analyzing competitors...";resultWrap.innerHTML="";
    var result=await spyCompetitorHashtags(compInput.value||undefined);
    analyzeBtn.textContent="🔍 Analyze";
    if(!result){resultWrap.appendChild(el("p",{style:{color:"#EF4444",fontSize:"11px"}},"❌ Check Gemini API key."));return;}
    if(result.competitors){
      result.competitors.forEach(function(c){
        var cCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",marginBottom:"6px"});
        cCard.appendChild(el("div",{style:{color:"#E1306C",fontSize:"11px",fontWeight:"700",fontFamily:"monospace"}},c.name));
        cCard.appendChild(el("div",{style:{color:"#8899AA",fontSize:"9px",marginTop:"2px"}},c.strategy));
        var tagWrap=div({display:"flex",gap:"3px",flexWrap:"wrap",marginTop:"4px"});
        (c.top_hashtags||[]).forEach(function(t){tagWrap.appendChild(el("span",{style:{background:"#E1306C18",color:"#E1306C",padding:"2px 6px",borderRadius:"8px",fontSize:"9px",fontFamily:"monospace"}},t));});
        cCard.appendChild(tagWrap);resultWrap.appendChild(cCard);
      });
    }
    if(result.niche_gems&&result.niche_gems.length){
      resultWrap.appendChild(el("div",{style:{color:"#10B981",fontSize:"11px",fontWeight:"700",marginTop:"10px",fontFamily:"monospace"}},"💎 Niche Gems (Low Competition)"));
      result.niche_gems.forEach(function(g){
        resultWrap.appendChild(el("div",{style:{color:"#CCC",fontSize:"10px",marginLeft:"8px"}},"• "+g.tag+" — "+g.why));
      });
    }
    if(result.unique_combos&&result.unique_combos.length){
      resultWrap.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"11px",fontWeight:"700",marginTop:"10px",fontFamily:"monospace"}},"⚡ Unique Combos to Own"));
      result.unique_combos.forEach(function(c){
        var row=el("div",{style:{color:"#E0E0E0",fontSize:"10px",marginLeft:"8px",cursor:"pointer",padding:"4px",borderRadius:"4px"},onclick:function(){navigator.clipboard.writeText(c);row.style.background="#10B98122";setTimeout(function(){row.style.background="";},500);}});
        row.textContent="📋 "+c;resultWrap.appendChild(row);
      });
    }
    if(result.summary){
      resultWrap.appendChild(el("div",{style:{background:"#1A0A1A",border:"1px solid #8B5CF6",borderRadius:"8px",padding:"8px",marginTop:"10px",color:"#CCC",fontSize:"10px",lineHeight:"1.4"}},"🧠 "+result.summary));
    }
  }});analyzeBtn.textContent="🔍 Analyze";card.appendChild(analyzeBtn);
  var resultWrap=div({});card.appendChild(resultWrap);
  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- BULK POST GENERATOR (30 posts for 1 month) ---
async function generateBulkPosts(config){
  var geminiKey=localStorage.getItem("dv_gemini_key");if(!geminiKey)return null;
  var bp=getBrandProfile();var brandCtx=bp?" Agent: "+bp.name+(bp.agency?", Agency: "+bp.agency:"")+(bp.tone?", Tone: "+bp.tone:""):"";
  var areaData="";
  try{var top=Object.keys(AREAS).map(function(k){var a=AREAS[k];return{n:k,p:a.psf,y:a.y?((a.y[0]+a.y[1])/2):0,g:a.g?a.g[0]:0};}).sort(function(a,b){return(b.y+b.g)-(a.y+a.g);}).slice(0,15);
    areaData=top.map(function(a){return a.n+":PSF"+a.p+",Y"+a.y.toFixed(1)+"%";}).join("|");
  }catch(e){}
  try{
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:"You are an expert Dubai real estate social media content planner."+brandCtx+"\n\nReal market data: "+areaData+"\n\nGenerate "+(config.count||30)+" social media posts for "+(config.platform||"Instagram")+" covering the next month.\n\nContent pillars to rotate:\n1. Market Data/Insights (PSF, yields, growth)\n2. Area Spotlights (specific areas with real data)\n3. Investment Tips & Education\n4. Lifestyle/Luxury Dubai content\n5. Success Stories / Testimonials (templated)\n6. Behind the Scenes / Market Tours\n7. FAQ / Myth Busting\n8. Trending News / Market Updates\n\nEach post should have a suggested date (starting tomorrow), time, content pillar, and full caption with hashtags.\n\nRespond in valid JSON:\n{\"posts\":[{\"day\":1,\"date\":\"2026-06-28\",\"time\":\"10:00\",\"pillar\":\"Market Data\",\"caption\":\"Full post caption with emojis and hashtags\",\"type\":\"post\",\"imageHint\":\"what image to use\"}]}"}]}],generationConfig:{responseMimeType:"application/json",maxOutputTokens:8192}})
    });
    var d=await r.json();
    if(d.candidates&&d.candidates[0])return JSON.parse(d.candidates[0].content.parts[0].text);
  }catch(e){console.warn("Bulk gen error:",e);}return null;
}
function showBulkGenerator(){
  var m=document.getElementById("bulk-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"bulk-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #10B981",borderRadius:"16px",padding:"16px",width:"560px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#10B981",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"📦 Bulk Post Generator — 30 Day Plan"));
  var configRow=div({display:"flex",gap:"8px",marginBottom:"10px"});
  var countSel=el("select",{style:{flex:1,background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"6px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace"}});
  [15,20,30,60].forEach(function(n){var o=el("option");o.value=n;o.textContent=n+" posts";if(n===30)o.selected=true;countSel.appendChild(o);});
  var platSel=el("select",{style:{flex:1,background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"6px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace"}});
  ["Instagram","Facebook","LinkedIn","All Platforms"].forEach(function(p){var o=el("option");o.value=p.toLowerCase().replace(" ","_");o.textContent=p;platSel.appendChild(o);});
  configRow.appendChild(countSel);configRow.appendChild(platSel);card.appendChild(configRow);
  var resultWrap=div({});
  var genBtn=el("button",{style:{width:"100%",background:"#10B981",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
    genBtn.textContent="⏳ Generating "+countSel.value+" posts with AI...";resultWrap.innerHTML="";
    var result=await generateBulkPosts({count:parseInt(countSel.value),platform:platSel.value});
    genBtn.textContent="🚀 Generate";
    if(!result||!result.posts){resultWrap.appendChild(el("p",{style:{color:"#EF4444",fontSize:"11px"}},"❌ Generation failed. Check Gemini API key."));return;}
    var schedBtn=el("button",{style:{width:"100%",marginBottom:"10px",background:"#3B82F6",color:"#FFF",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
      result.posts.forEach(function(p){saveCalendarEvent({caption:p.caption,date:p.date,time:p.time,platform:platSel.value,pillar:p.pillar,type:p.type||"post"});});
      schedBtn.textContent="✅ "+result.posts.length+" posts scheduled!";schedBtn.style.background="#10B981";
    }});schedBtn.textContent="📅 Schedule All "+result.posts.length+" to Calendar";resultWrap.appendChild(schedBtn);
    var pillarColors={"Market Data":"#3B82F6","Area Spotlights":"#10B981","Investment Tips":"#F59E0B","Lifestyle":"#EC4899","Success Stories":"#8B5CF6","Behind the Scenes":"#F97316","FAQ":"#06B6D4","Trending News":"#EF4444"};
    result.posts.forEach(function(p,i){
      var pCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",marginBottom:"4px"});
      var hdr=div({display:"flex",justifyContent:"space-between",alignItems:"center"});
      var pColor=pillarColors[p.pillar]||"#8899AA";
      hdr.appendChild(el("span",{style:{color:pColor,fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}},"Day "+(p.day||i+1)+" · "+p.date+" "+p.time));
      hdr.appendChild(el("span",{style:{background:hexAlpha(pColor,0.15),color:pColor,padding:"2px 6px",borderRadius:"6px",fontSize:"8px",fontFamily:"monospace"}},p.pillar||"Post"));
      pCard.appendChild(hdr);
      var capEl=el("div",{style:{color:"#CCC",fontSize:"10px",lineHeight:"1.4",marginTop:"4px",maxHeight:"60px",overflow:"hidden",cursor:"pointer"},onclick:function(){
        navigator.clipboard.writeText(p.caption);capEl.style.color="#10B981";setTimeout(function(){capEl.style.color="#CCC";},1000);
      }});capEl.textContent=p.caption.substring(0,200)+(p.caption.length>200?"...":"");pCard.appendChild(capEl);
      if(p.imageHint)pCard.appendChild(el("div",{style:{color:"#6B7280",fontSize:"8px",marginTop:"2px"}},"📷 "+p.imageHint));
      resultWrap.appendChild(pCard);
    });
  }});genBtn.textContent="🚀 Generate";card.appendChild(genBtn);card.appendChild(resultWrap);
  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- CONTENT RECYCLER ---
function showContentRecycler(){
  var m=document.getElementById("recycler-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"recycler-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #F97316",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#F97316",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"♻️ Content Recycler"));
  var history=getPostHistory();
  if(history.length<3){card.appendChild(el("p",{style:{color:"#8899AA",fontSize:"12px"}},"Need at least 3 posts in history to recycle. Start posting!"));
  }else{
    card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",marginBottom:"10px",fontFamily:"monospace"}},"AI will refresh your old posts with updated data & new angles"));
    var older=history.filter(function(p){return Date.now()-new Date(p.postedAt).getTime()>14*86400000;});
    if(older.length===0)older=history.slice(Math.floor(history.length/2));
    var candidates=older.slice(0,8);
    candidates.forEach(function(p){
      var pCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",marginBottom:"6px"});
      pCard.appendChild(el("div",{style:{color:"#F97316",fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}},"📅 "+new Date(p.postedAt).toLocaleDateString()+" · "+(p.platform||"instagram")));
      var capEl=el("div",{style:{color:"#CCC",fontSize:"10px",lineHeight:"1.4",marginTop:"4px",maxHeight:"40px",overflow:"hidden"}});capEl.textContent=(p.caption||"").substring(0,120);pCard.appendChild(capEl);
      var recycleBtn=el("button",{style:{marginTop:"6px",background:"#F9731622",border:"1px solid #F9731644",color:"#F97316",padding:"4px 10px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
        recycleBtn.textContent="♻️ Refreshing...";
        var geminiKey=localStorage.getItem("dv_gemini_key");
        if(!geminiKey){recycleBtn.textContent="❌ Need Gemini key";return;}
        var areaData="";try{var top=Object.keys(AREAS).slice(0,20).map(function(k){return k+":PSF"+AREAS[k].psf;}).join(",");areaData=top;}catch(e){}
        try{
          var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
            method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({contents:[{parts:[{text:"Refresh this old Dubai real estate social media post with:\n1. Updated market data: "+areaData+"\n2. Fresh angle/hook\n3. New hashtags\n4. Keep the core message but make it feel NEW\n\nOriginal post:\n"+p.caption+"\n\nRespond with ONLY the refreshed caption (no JSON, no explanation)."}]}]})
          });
          var d=await r.json();
          if(d.candidates&&d.candidates[0]){
            var newCap=d.candidates[0].content.parts[0].text;
            var resultDiv=div({background:"#1A1820",border:"1px solid #10B981",borderRadius:"8px",padding:"8px",marginTop:"6px"});
            resultDiv.appendChild(el("div",{style:{color:"#10B981",fontSize:"9px",fontWeight:"700",fontFamily:"monospace",marginBottom:"4px"}},"✨ Refreshed Version"));
            var newText=el("div",{style:{color:"#E0E0E0",fontSize:"10px",lineHeight:"1.4",whiteSpace:"pre-wrap",maxHeight:"100px",overflowY:"auto"}});newText.textContent=newCap;resultDiv.appendChild(newText);
            var copyBtn=el("button",{style:{marginTop:"4px",background:"#10B98122",border:"1px solid #10B98144",color:"#10B981",padding:"3px 8px",borderRadius:"4px",fontSize:"9px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){navigator.clipboard.writeText(newCap);copyBtn.textContent="✅ Copied!";}});
            copyBtn.textContent="📋 Copy";resultDiv.appendChild(copyBtn);pCard.appendChild(resultDiv);
          }
          recycleBtn.textContent="♻️ Recycle";
        }catch(e){recycleBtn.textContent="❌ Error";}
      }});recycleBtn.textContent="♻️ Recycle This";pCard.appendChild(recycleBtn);
      card.appendChild(pCard);
    });
  }
  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- LINK IN BIO GENERATOR ---
function showLinkInBio(){
  var m=document.getElementById("linkinbio-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"linkinbio-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #C9A84C",borderRadius:"16px",padding:"16px",width:"420px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#C9A84C",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"🔗 Link in Bio Generator"));
  var bp=getBrandProfile();
  var links;try{links=JSON.parse(localStorage.getItem("dv_linkinbio")||"[]");}catch(e){links=[];}
  var previewWrap=div({});
  function renderPreview(){
    previewWrap.innerHTML="";
    var phone=div({background:"#000",borderRadius:"24px",padding:"20px 16px",width:"280px",margin:"0 auto",border:"3px solid #333",minHeight:"400px"});
    if(bp&&bp.name){
      phone.appendChild(el("div",{style:{textAlign:"center",marginBottom:"4px"}},el("div",{style:{width:"60px",height:"60px",borderRadius:"50%",background:"linear-gradient(135deg,#C9A84C,#8B6914)",margin:"0 auto 8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",color:"#FFF"}},"🏠")));
      phone.appendChild(el("div",{style:{color:"#FFF",fontSize:"14px",fontWeight:"700",textAlign:"center",fontFamily:"'Space Grotesk',sans-serif"}},bp.name));
      if(bp.bio)phone.appendChild(el("div",{style:{color:"#999",fontSize:"10px",textAlign:"center",marginTop:"2px"}},bp.bio));
    }else{
      phone.appendChild(el("div",{style:{color:"#FFF",fontSize:"14px",fontWeight:"700",textAlign:"center",marginTop:"20px"}},"DubAIVal"));
      phone.appendChild(el("div",{style:{color:"#999",fontSize:"10px",textAlign:"center",marginTop:"2px"}},"AI Property Valuation Dubai"));
    }
    var linkWrap=div({marginTop:"16px"});
    links.forEach(function(l,i){
      var lb=el("div",{style:{background:l.color||"#C9A84C",borderRadius:"10px",padding:"10px 14px",marginBottom:"8px",textAlign:"center",cursor:"pointer",transition:"transform 0.2s"}});
      lb.appendChild(el("div",{style:{color:l.color==="transparent"||l.color==="#FFFFFF"?"#000":"#FFF",fontSize:"12px",fontWeight:"600",fontFamily:"'Space Grotesk',sans-serif"}},(l.icon||"🔗")+" "+l.title));
      if(l.subtitle)lb.appendChild(el("div",{style:{color:"rgba(255,255,255,0.7)",fontSize:"9px",marginTop:"2px"}},l.subtitle));
      linkWrap.appendChild(lb);
    });
    phone.appendChild(linkWrap);
    phone.appendChild(el("div",{style:{textAlign:"center",marginTop:"16px",color:"#444",fontSize:"8px"}},"Powered by DubAIVal.com"));
    previewWrap.appendChild(phone);
  }
  card.appendChild(previewWrap);
  card.appendChild(el("div",{style:{color:"#FFF",fontSize:"11px",fontWeight:"700",marginTop:"12px",marginBottom:"6px",fontFamily:"monospace"}},"Add Links"));
  var addRow=div({display:"flex",gap:"4px",marginBottom:"8px"});
  var titleInp=el("input",{style:{flex:2,background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"6px",color:"#E0E0E0",fontSize:"10px",fontFamily:"monospace",boxSizing:"border-box"},placeholder:"Title (e.g. WhatsApp Me)"});
  var urlInp=el("input",{style:{flex:3,background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"6px",color:"#E0E0E0",fontSize:"10px",fontFamily:"monospace",boxSizing:"border-box"},placeholder:"URL or wa.me/971..."});
  var addBtn=el("button",{style:{background:"#C9A84C",color:"#000",border:"none",borderRadius:"6px",padding:"6px 10px",fontSize:"10px",fontWeight:"700",cursor:"pointer"},onclick:function(){
    if(!titleInp.value.trim())return;
    links.push({title:titleInp.value.trim(),url:urlInp.value.trim(),icon:"🔗",color:"#C9A84C"});
    localStorage.setItem("dv_linkinbio",JSON.stringify(links));
    titleInp.value="";urlInp.value="";renderPreview();renderLinkList();
  }});addBtn.textContent="+";addRow.appendChild(titleInp);addRow.appendChild(urlInp);addRow.appendChild(addBtn);card.appendChild(addRow);
  var quickLinks=[
    {title:"WhatsApp Me",url:"https://wa.me/971",icon:"📲",color:"#25D366"},
    {title:"Free Valuation",url:"https://dubaival.com",icon:"📊",color:"#3B82F6"},
    {title:"Instagram",url:"https://instagram.com/",icon:"📸",color:"#E1306C"},
    {title:"View Properties",url:"https://dubaival.com",icon:"🏠",color:"#10B981"}
  ];
  var quickRow=div({display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"8px"});
  quickLinks.forEach(function(q){
    quickRow.appendChild(el("button",{style:{background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"4px 8px",color:"#8899AA",fontSize:"9px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
      links.push(Object.assign({},q));localStorage.setItem("dv_linkinbio",JSON.stringify(links));renderPreview();renderLinkList();
    }},q.icon+" "+q.title));
  });card.appendChild(quickRow);
  var linkListWrap=div({});
  function renderLinkList(){
    linkListWrap.innerHTML="";
    links.forEach(function(l,i){
      var row=div({display:"flex",gap:"4px",alignItems:"center",marginBottom:"4px"});
      row.appendChild(el("span",{style:{color:"#CCC",fontSize:"10px",flex:1,fontFamily:"monospace"}},l.icon+" "+l.title));
      row.appendChild(el("button",{style:{background:"none",border:"none",color:"#EF4444",fontSize:"12px",cursor:"pointer"},onclick:function(){links.splice(i,1);localStorage.setItem("dv_linkinbio",JSON.stringify(links));renderPreview();renderLinkList();}},"🗑"));
      linkListWrap.appendChild(row);
    });
  }
  card.appendChild(linkListWrap);renderLinkList();
  var copyBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"#C9A84C",color:"#000",border:"none",borderRadius:"8px",padding:"10px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
    var html="<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>"+(bp?bp.name:"DubAIVal")+" — Links</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#070B14;font-family:'Segoe UI',sans-serif;display:flex;justify-content:center;padding:40px 16px;min-height:100vh}.container{max-width:400px;width:100%;text-align:center}.avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#C9A84C,#8B6914);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff}.name{color:#fff;font-size:18px;font-weight:700;margin-bottom:4px}.bio{color:#999;font-size:12px;margin-bottom:24px}.link{display:block;padding:14px;border-radius:12px;margin-bottom:10px;text-decoration:none;color:#fff;font-weight:600;font-size:14px;transition:transform .2s}.link:hover{transform:scale(1.03)}.footer{color:#444;font-size:10px;margin-top:24px}</style></head><body><div class='container'><div class='avatar'>🏠</div><div class='name'>"+(bp?bp.name:"DubAIVal")+"</div><div class='bio'>"+(bp?bp.bio||"":"AI Property Valuation Dubai")+"</div>";
    links.forEach(function(l){html+="<a class='link' href='"+(l.url||"#")+"' style='background:"+(l.color||"#C9A84C")+"'>"+(l.icon||"🔗")+" "+l.title+"</a>";});
    html+="<div class='footer'>Powered by DubAIVal.com</div></div></body></html>";
    navigator.clipboard.writeText(html);copyBtn.textContent="✅ HTML Copied!";setTimeout(function(){copyBtn.textContent="📋 Copy HTML Page";},2000);
  }});copyBtn.textContent="📋 Copy HTML Page";card.appendChild(copyBtn);
  card.appendChild(el("button",{style:{width:"100%",marginTop:"6px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  renderPreview();
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- STORY TEMPLATES (Quiz, Poll, Countdown) ---
var STORY_TEMPLATES=[
  {id:"quiz",name:"🧠 Quiz",color:"#8B5CF6",description:"Test your audience's Dubai market knowledge"},
  {id:"poll",name:"📊 Poll",color:"#3B82F6",description:"Engage with binary choices about property"},
  {id:"countdown",name:"⏰ Countdown",color:"#EF4444",description:"Build urgency for launches, deals, events"},
  {id:"thisorthat",name:"⚡ This or That",color:"#F59E0B",description:"Compare two areas, properties, or strategies"},
  {id:"slider",name:"🔥 Emoji Slider",color:"#EC4899",description:"Rate sentiment on market topics"},
  {id:"ama",name:"❓ AMA",color:"#10B981",description:"Ask Me Anything about Dubai real estate"}
];
async function generateStoryContent(templateId){
  var geminiKey=localStorage.getItem("dv_gemini_key");if(!geminiKey)return null;
  var areaData="";try{var top=Object.keys(AREAS).slice(0,20).map(function(k){return k+":PSF"+AREAS[k].psf;}).join(",");areaData=top;}catch(e){}
  var prompts={
    quiz:"Generate an Instagram Story quiz about Dubai real estate. 1 question with 4 options (only 1 correct). Use real market data: "+areaData+"\nJSON: {\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correct\":0,\"explanation\":\"why\"}",
    poll:"Generate an Instagram Story poll about Dubai property. Binary choice, thought-provoking. Data: "+areaData+"\nJSON: {\"question\":\"...\",\"optionA\":\"...\",\"optionB\":\"...\",\"insight\":\"what the results might show\"}",
    countdown:"Generate an Instagram Story countdown for a Dubai real estate event/launch. Make it exciting.\nJSON: {\"title\":\"...\",\"subtitle\":\"...\",\"date\":\"2026-07-15\",\"emoji\":\"🏗️\",\"urgency\":\"why act now\"}",
    thisorthat:"Generate a This or That Instagram Story comparing two Dubai areas/properties. Data: "+areaData+"\nJSON: {\"title\":\"Which would you choose?\",\"optionA\":{\"name\":\"...\",\"stats\":\"PSF/Yield\"},\"optionB\":{\"name\":\"...\",\"stats\":\"PSF/Yield\"},\"insight\":\"comparison analysis\"}",
    slider:"Generate an Instagram Story emoji slider question about Dubai market sentiment.\nJSON: {\"question\":\"...\",\"emoji\":\"🔥\",\"lowLabel\":\"Not at all\",\"highLabel\":\"Absolutely\",\"context\":\"why ask this\"}",
    ama:"Generate 3 engaging AMA (Ask Me Anything) story prompts for a Dubai real estate agent.\nJSON: {\"prompts\":[{\"question\":\"...\",\"sampleAnswer\":\"...\"}],\"intro\":\"story intro text\"}"
  };
  try{
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:prompts[templateId]||prompts.quiz}]}],generationConfig:{responseMimeType:"application/json"}})
    });
    var d=await r.json();
    if(d.candidates&&d.candidates[0])return JSON.parse(d.candidates[0].content.parts[0].text);
  }catch(e){}return null;
}
function showStoryTemplates(){
  var m=document.getElementById("storytpl-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"storytpl-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #8B5CF6",borderRadius:"16px",padding:"16px",width:"480px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#8B5CF6",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"📱 Story Templates"));
  var resultWrap=div({});
  var tplGrid=div({display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"8px",marginBottom:"12px"});
  STORY_TEMPLATES.forEach(function(t){
    var tCard=el("div",{style:{background:"#0D1117",border:"1px solid "+hexAlpha(t.color,0.3),borderRadius:"10px",padding:"10px",cursor:"pointer",transition:"all 0.2s"},onclick:async function(){
      tCard.style.borderColor=t.color;resultWrap.innerHTML="";
      resultWrap.appendChild(el("div",{style:{color:"#8899AA",fontSize:"11px",textAlign:"center",padding:"10px"}},"⏳ Generating "+t.name+" content..."));
      var content=await generateStoryContent(t.id);
      resultWrap.innerHTML="";
      if(!content){resultWrap.appendChild(el("p",{style:{color:"#EF4444",fontSize:"11px"}},"❌ Check Gemini API key."));return;}
      var rCard=div({background:"#0D1117",border:"1px solid "+t.color,borderRadius:"10px",padding:"12px"});
      rCard.appendChild(el("div",{style:{color:t.color,fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginBottom:"6px"}},t.name+" Content"));
      var preEl=el("pre",{style:{color:"#E0E0E0",fontSize:"10px",lineHeight:"1.5",whiteSpace:"pre-wrap",background:"#0A0E18",padding:"8px",borderRadius:"6px",maxHeight:"200px",overflowY:"auto"}});
      preEl.textContent=JSON.stringify(content,null,2);rCard.appendChild(preEl);
      var copyBtn=el("button",{style:{marginTop:"8px",width:"100%",background:hexAlpha(t.color,0.15),border:"1px solid "+hexAlpha(t.color,0.3),color:t.color,padding:"6px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
        navigator.clipboard.writeText(JSON.stringify(content,null,2));copyBtn.textContent="✅ Copied!";setTimeout(function(){copyBtn.textContent="📋 Copy Content";},2000);
      }});copyBtn.textContent="📋 Copy Content";rCard.appendChild(copyBtn);
      resultWrap.appendChild(rCard);
    }});
    tCard.appendChild(el("div",{style:{fontSize:"20px",textAlign:"center",marginBottom:"4px"}},t.name.split(" ")[0]));
    tCard.appendChild(el("div",{style:{color:"#FFF",fontSize:"11px",fontWeight:"600",textAlign:"center",fontFamily:"monospace"}},t.name.split(" ").slice(1).join(" ")));
    tCard.appendChild(el("div",{style:{color:"#6B7280",fontSize:"9px",textAlign:"center",marginTop:"2px"}},t.description));
    tplGrid.appendChild(tCard);
  });card.appendChild(tplGrid);card.appendChild(resultWrap);
  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- POST PREVIEW MOCKUP (Instagram/Facebook Feed Simulator) ---
function showPostPreview(caption,imageUrl){
  var m=document.getElementById("preview-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"preview-modal"});
  var card=div({background:"#000",borderRadius:"0",width:"380px",maxWidth:"96vw"});
  var bp=getBrandProfile();
  var igHeader=div({display:"flex",alignItems:"center",padding:"10px 12px",gap:"8px"});
  var avatar=el("div",{style:{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(135deg,#C9A84C,#8B6914)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",color:"#FFF",flexShrink:"0"}});avatar.textContent="🏠";
  igHeader.appendChild(avatar);
  var nameCol=div({flex:"1"});
  nameCol.appendChild(el("div",{style:{color:"#FFF",fontSize:"13px",fontWeight:"600"}},bp?bp.name:"dubaival"));
  nameCol.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px"}},"Dubai, UAE"));
  igHeader.appendChild(nameCol);
  igHeader.appendChild(el("span",{style:{color:"#FFF",fontSize:"16px"}},"•••"));
  card.appendChild(igHeader);
  if(imageUrl){
    var img=el("img",{style:{width:"100%",aspectRatio:"1",objectFit:"cover",display:"block"}});
    img.src=imageUrl;card.appendChild(img);
  }else{
    var placeholder=div({width:"100%",aspectRatio:"1",background:"linear-gradient(135deg,#1A0A3A,#0A1628)",display:"flex",alignItems:"center",justifyContent:"center"});
    placeholder.appendChild(el("span",{style:{color:"#333",fontSize:"48px"}},"📷"));card.appendChild(placeholder);
  }
  var actionBar=div({display:"flex",justifyContent:"space-between",padding:"10px 12px"});
  var leftActs=div({display:"flex",gap:"14px"});
  ["♡","💬","✈️"].forEach(function(ic){leftActs.appendChild(el("span",{style:{color:"#FFF",fontSize:"22px",cursor:"pointer"}},ic));});
  actionBar.appendChild(leftActs);actionBar.appendChild(el("span",{style:{color:"#FFF",fontSize:"22px"}},"🔖"));
  card.appendChild(actionBar);
  card.appendChild(el("div",{style:{padding:"0 12px 4px",color:"#FFF",fontSize:"13px",fontWeight:"600"}},"2,847 likes"));
  var capWrap=div({padding:"0 12px 12px"});
  var capText=el("div",{style:{color:"#FFF",fontSize:"12px",lineHeight:"1.5"}});
  var shortCap=caption.length>150?caption.substring(0,150)+"...":caption;
  capText.innerHTML="<span style='font-weight:700'>"+(bp?bp.name:"dubaival")+"</span> "+shortCap.replace(/\n/g,"<br>");
  capWrap.appendChild(capText);
  if(caption.length>150){
    var moreBtn=el("span",{style:{color:"#8899AA",fontSize:"12px",cursor:"pointer"},onclick:function(){capText.innerHTML="<span style='font-weight:700'>"+(bp?bp.name:"dubaival")+"</span> "+caption.replace(/\n/g,"<br>");moreBtn.remove();}});
    moreBtn.textContent="more";capWrap.appendChild(moreBtn);
  }
  card.appendChild(capWrap);
  card.appendChild(el("div",{style:{padding:"0 12px 10px",color:"#8899AA",fontSize:"10px"}},"2 HOURS AGO"));
  var tabRow=div({display:"flex",justifyContent:"center",gap:"16px",padding:"8px",borderTop:"1px solid #222"});
  ["IG Feed","FB Feed","Story"].forEach(function(tab,i){
    tabRow.appendChild(el("button",{style:{background:i===0?"#FFF":"transparent",color:i===0?"#000":"#8899AA",border:"none",borderRadius:"12px",padding:"4px 12px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace",fontWeight:i===0?"700":"400"}},tab));
  });card.appendChild(tabRow);
  card.appendChild(el("button",{style:{width:"100%",marginTop:"4px",background:"#111",color:"#8899AA",border:"none",padding:"10px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close Preview"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- NOTIFICATION REMINDERS ---
function schedulePostReminder(event){
  if(!("Notification" in window))return;
  Notification.requestPermission().then(function(perm){
    if(perm!=="granted")return;
    var postDate=new Date(event.date+"T"+event.time+":00");
    var reminderTime=postDate.getTime()-15*60*1000;
    var delay=reminderTime-Date.now();
    if(delay<=0)return;
    if(delay>24*60*60*1000)return;
    setTimeout(function(){
      new Notification("📱 DubAIVal — Time to Post!",{body:"Scheduled post for "+(event.platform||"Instagram")+" is due in 15 minutes.\n"+(event.caption||"").substring(0,80)+"...",icon:"logo.png",badge:"logo.png",tag:"dv-post-"+event.id,requireInteraction:true});
    },delay);
  });
}

// --- CAPTION LENGTH OPTIMIZER ---
var PLATFORM_LIMITS={instagram:{max:2200,ideal:{min:138,max:150},hashtags:30,note:"First 125 chars show in feed"},facebook:{max:63206,ideal:{min:40,max:80},hashtags:5,note:"Short posts get 23% more engagement"},linkedin:{max:3000,ideal:{min:100,max:200},hashtags:5,note:"First 140 chars before 'see more'"},twitter:{max:280,ideal:{min:71,max:100},hashtags:3,note:"Tweets with 100 chars get 17% more RT"},tiktok:{max:2200,ideal:{min:50,max:150},hashtags:5,note:"Short & catchy, trend references help"},whatsapp:{max:65536,ideal:{min:20,max:100},hashtags:0,note:"Keep broadcast-friendly, 3-4 lines max"}};
function showCaptionOptimizer(caption){
  var m=document.getElementById("optimizer-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"10px"},id:"optimizer-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #06B6D4",borderRadius:"16px",padding:"16px",width:"480px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#06B6D4",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"📏 Caption Length Optimizer"));
  var charCount=caption.length;var hashCount=(caption.match(/#\w+/g)||[]).length;var emojiCount=(caption.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu)||[]).length;
  var statsRow=div({display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"12px"});
  [{l:"Characters",v:charCount,c:"#06B6D4"},{l:"Hashtags",v:hashCount,c:"#10B981"},{l:"Emojis",v:emojiCount,c:"#F59E0B"}].forEach(function(s){
    var sc=div({background:"#0D1117",borderRadius:"8px",padding:"8px",textAlign:"center"});
    sc.appendChild(el("div",{style:{color:s.c,fontSize:"18px",fontWeight:"800",fontFamily:"monospace"}},String(s.v)));
    sc.appendChild(el("div",{style:{color:"#8899AA",fontSize:"9px",fontFamily:"monospace"}},s.l));statsRow.appendChild(sc);
  });card.appendChild(statsRow);
  Object.keys(PLATFORM_LIMITS).forEach(function(p){
    var lim=PLATFORM_LIMITS[p];var pct=Math.min(charCount/lim.max*100,100);
    var inIdeal=charCount>=lim.ideal.min&&charCount<=lim.ideal.max;
    var tooLong=charCount>lim.max;var hashOk=hashCount<=lim.hashtags;
    var status=tooLong?"🔴 Over limit":inIdeal?"🟢 Ideal length":charCount<lim.ideal.min?"🟡 Too short":"🟡 Could be shorter";
    var pCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",marginBottom:"6px"});
    var icons={instagram:"📸",facebook:"📘",linkedin:"💼",twitter:"𝕏",tiktok:"🎵",whatsapp:"📲"};
    pCard.appendChild(el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
      el("span",{style:{color:"#FFF",fontSize:"11px",fontWeight:"600",fontFamily:"monospace"}},(icons[p]||"📱")+" "+p.charAt(0).toUpperCase()+p.slice(1)),
      el("span",{style:{color:tooLong?"#EF4444":inIdeal?"#10B981":"#F59E0B",fontSize:"9px",fontFamily:"monospace"}},status)
    ));
    var barBg=div({height:"4px",background:"#2A3040",borderRadius:"2px",marginTop:"6px",overflow:"hidden"});
    barBg.appendChild(el("div",{style:{height:"100%",width:Math.min(pct,100)+"%",background:tooLong?"#EF4444":inIdeal?"#10B981":"#F59E0B",borderRadius:"2px",transition:"width 0.3s"}}));
    pCard.appendChild(barBg);
    pCard.appendChild(el("div",{style:{display:"flex",justifyContent:"space-between",marginTop:"4px"}},
      el("span",{style:{color:"#6B7280",fontSize:"8px",fontFamily:"monospace"}},charCount+"/"+lim.max+" chars · Ideal: "+lim.ideal.min+"-"+lim.ideal.max),
      el("span",{style:{color:hashOk?"#6B7280":"#EF4444",fontSize:"8px",fontFamily:"monospace"}},"#: "+hashCount+"/"+lim.hashtags)
    ));
    pCard.appendChild(el("div",{style:{color:"#4B5563",fontSize:"8px",marginTop:"2px"}},"💡 "+lim.note));
    card.appendChild(pCard);
  });
  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- EMOJI INTELLIGENCE ---
async function suggestEmojis(caption){
  var geminiKey=localStorage.getItem("dv_gemini_key");if(!geminiKey)return null;
  try{
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:"You are an emoji optimization expert for social media.\n\nCaption:\n"+caption+"\n\nSuggest the BEST emojis to enhance this Dubai real estate post:\n1. Hook emojis (first 2-3 to grab attention)\n2. Separator emojis (to break text sections)\n3. CTA emojis (to drive action)\n4. Avoid overuse — suggest optimal count\n\nRespond in valid JSON:\n{\"hook\":[\"🏠\",\"💎\"],\"separators\":[\"▪️\",\"•\"],\"cta\":[\"📲\",\"🔗\"],\"enhanced_caption\":\"The caption with emojis placed optimally\",\"total_emojis\":8,\"tip\":\"brief advice\"}"}]}],generationConfig:{responseMimeType:"application/json"}})
    });
    var d=await r.json();
    if(d.candidates&&d.candidates[0])return JSON.parse(d.candidates[0].content.parts[0].text);
  }catch(e){}return null;
}
function showEmojiIntelligence(caption){
  var m=document.getElementById("emoji-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"emoji-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #F59E0B",borderRadius:"16px",padding:"16px",width:"480px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#F59E0B",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"😊 Emoji Intelligence"));
  var loadingP=el("p",{style:{color:"#8899AA",fontSize:"12px",textAlign:"center"}},"⏳ Analyzing best emojis...");
  card.appendChild(loadingP);
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
  suggestEmojis(caption).then(function(result){
    loadingP.remove();
    if(!result){card.appendChild(el("p",{style:{color:"#EF4444",fontSize:"12px"}},"❌ Check Gemini API key."));return;}
    var cats=[{k:"hook",l:"🎯 Hook Emojis",c:"#EF4444"},{k:"separators",l:"📐 Separators",c:"#3B82F6"},{k:"cta",l:"📲 CTA Emojis",c:"#10B981"}];
    cats.forEach(function(cat){
      if(!result[cat.k]||!result[cat.k].length)return;
      card.appendChild(el("div",{style:{color:cat.c,fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginTop:"8px"}},cat.l));
      var row=div({display:"flex",gap:"6px",marginTop:"4px"});
      result[cat.k].forEach(function(e){
        var chip=el("span",{style:{fontSize:"24px",cursor:"pointer",padding:"4px",borderRadius:"8px",transition:"background 0.2s"},onclick:function(){
          navigator.clipboard.writeText(e);chip.style.background="#FFF2";setTimeout(function(){chip.style.background="";},500);
        }});chip.textContent=e;row.appendChild(chip);
      });card.appendChild(row);
    });
    if(result.enhanced_caption){
      var enhBox=div({background:"#0D1117",border:"1px solid #F59E0B",borderRadius:"8px",padding:"10px",marginTop:"12px"});
      enhBox.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"10px",fontWeight:"700",fontFamily:"monospace",marginBottom:"4px"}},"✨ Enhanced Caption ("+result.total_emojis+" emojis)"));
      var enhText=el("div",{style:{color:"#E0E0E0",fontSize:"11px",lineHeight:"1.5",whiteSpace:"pre-wrap",maxHeight:"150px",overflowY:"auto"}});enhText.textContent=result.enhanced_caption;enhBox.appendChild(enhText);
      var copyBtn=el("button",{style:{marginTop:"6px",background:"#F59E0B22",border:"1px solid #F59E0B44",color:"#F59E0B",padding:"5px 12px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
        navigator.clipboard.writeText(result.enhanced_caption);copyBtn.textContent="✅ Copied!";setTimeout(function(){copyBtn.textContent="📋 Use Enhanced";},2000);
      }});copyBtn.textContent="📋 Use Enhanced";enhBox.appendChild(copyBtn);
      card.appendChild(enhBox);
    }
    if(result.tip){card.appendChild(el("div",{style:{color:"#6B7280",fontSize:"9px",marginTop:"8px",fontStyle:"italic"}},"💡 "+result.tip));}
    card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  });
}

// --- WATERMARK SYSTEM ---
function applyWatermark(canvas,opts){
  var ctx=canvas.getContext("2d");var w=canvas.width;var h=canvas.height;
  var bp=getBrandProfile();var text=opts&&opts.text?opts.text:(bp?bp.name:"DubAIVal.com");
  var position=opts&&opts.position?opts.position:"bottom-right";
  var opacity=opts&&opts.opacity?opts.opacity:0.35;
  var size=opts&&opts.size?opts.size:Math.round(w/28);
  ctx.save();ctx.globalAlpha=opacity;
  ctx.font="bold "+size+"px 'Space Grotesk',sans-serif";
  ctx.fillStyle="#FFFFFF";ctx.strokeStyle="rgba(0,0,0,0.5)";ctx.lineWidth=2;
  var pad=w*0.04;var x,y;
  switch(position){
    case"top-left":x=pad;y=pad+size;ctx.textAlign="left";break;
    case"top-right":x=w-pad;y=pad+size;ctx.textAlign="right";break;
    case"bottom-left":x=pad;y=h-pad;ctx.textAlign="left";break;
    case"center":x=w/2;y=h/2;ctx.textAlign="center";break;
    default:x=w-pad;y=h-pad;ctx.textAlign="right";
  }
  ctx.strokeText(text,x,y);ctx.fillText(text,x,y);
  if(opts&&opts.showLogo){
    ctx.font="bold "+Math.round(size*0.7)+"px sans-serif";ctx.fillStyle="rgba(255,255,255,"+opacity*0.7+")";
    ctx.fillText("dubaival.com",x,y+size+4);
  }
  ctx.restore();
}
function getWatermarkSettings(){
  try{return JSON.parse(localStorage.getItem("dv_watermark")||'{"enabled":true,"text":"","position":"bottom-right","opacity":0.35,"showLogo":true}');}catch(e){return{enabled:true,position:"bottom-right",opacity:0.35,showLogo:true};}
}
function showWatermarkSetup(){
  var m=document.getElementById("watermark-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"10px"},id:"watermark-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #C9A84C",borderRadius:"16px",padding:"16px",width:"420px",maxWidth:"96vw"});
  card.appendChild(el("h3",{style:{color:"#C9A84C",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"💧 Watermark Settings"));
  var settings=getWatermarkSettings();
  var preview=document.createElement("canvas");preview.width=400;preview.height=300;
  preview.style.cssText="width:100%;border-radius:8px;border:1px solid #2A3040;margin-bottom:10px;";
  card.appendChild(preview);
  function redraw(){
    var ctx=preview.getContext("2d");
    var grd=ctx.createLinearGradient(0,0,0,300);grd.addColorStop(0,"#1A0A3A");grd.addColorStop(1,"#0A1628");
    ctx.fillStyle=grd;ctx.fillRect(0,0,400,300);
    ctx.fillStyle="#333";ctx.font="48px sans-serif";ctx.textAlign="center";ctx.fillText("📷 Sample Image",200,160);
    if(settings.enabled)applyWatermark(preview,settings);
  }
  var enableRow=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"});
  var enableCb=el("input",{type:"checkbox",checked:settings.enabled,onchange:function(){settings.enabled=this.checked;redraw();save();}});
  enableRow.appendChild(enableCb);enableRow.appendChild(el("span",{style:{color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace"}},"Enable Watermark"));card.appendChild(enableRow);
  var textInp=el("input",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"6px 8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box",marginBottom:"8px"},placeholder:"Custom text (leave blank for brand name)",value:settings.text||"",oninput:function(){settings.text=this.value;redraw();save();}});
  card.appendChild(textInp);
  var posRow=div({display:"flex",gap:"4px",marginBottom:"8px",flexWrap:"wrap"});
  posRow.appendChild(el("span",{style:{color:"#8899AA",fontSize:"10px",fontFamily:"monospace",minWidth:"55px"}},"Position:"));
  ["top-left","top-right","bottom-left","bottom-right","center"].forEach(function(p){
    posRow.appendChild(el("button",{style:{background:p===settings.position?"#C9A84C":"#0D1117",color:p===settings.position?"#000":"#8899AA",border:"1px solid "+(p===settings.position?"#C9A84C":"#2A3040"),borderRadius:"6px",padding:"3px 6px",fontSize:"9px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){settings.position=p;redraw();save();
      posRow.querySelectorAll("button").forEach(function(b){b.style.background="#0D1117";b.style.color="#8899AA";b.style.borderColor="#2A3040";});
      this.style.background="#C9A84C";this.style.color="#000";this.style.borderColor="#C9A84C";
    }},p));
  });card.appendChild(posRow);
  var opRow=div({display:"flex",gap:"8px",alignItems:"center",marginBottom:"8px"});
  opRow.appendChild(el("span",{style:{color:"#8899AA",fontSize:"10px",fontFamily:"monospace"}},"Opacity:"));
  var opSlider=el("input",{type:"range",min:"10",max:"80",value:String(Math.round(settings.opacity*100)),style:{flex:1},oninput:function(){settings.opacity=this.value/100;opVal.textContent=this.value+"%";redraw();save();}});
  var opVal=el("span",{style:{color:"#E0E0E0",fontSize:"10px",fontFamily:"monospace"}},Math.round(settings.opacity*100)+"%");
  opRow.appendChild(opSlider);opRow.appendChild(opVal);card.appendChild(opRow);
  function save(){localStorage.setItem("dv_watermark",JSON.stringify(settings));}
  redraw();
  card.appendChild(el("button",{style:{width:"100%",marginTop:"8px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- CONTENT PILLAR PLANNER ---
var DEFAULT_PILLARS=[
  {id:"market",name:"📊 Market Data",color:"#3B82F6",percentage:25,examples:["PSF updates","Yield comparisons","Growth trends"]},
  {id:"area",name:"📍 Area Spotlight",color:"#10B981",percentage:20,examples:["Area guides","Neighborhood tours","Hidden gems"]},
  {id:"education",name:"📚 Education",color:"#8B5CF6",percentage:20,examples:["Buying tips","Investment 101","Legal guide"]},
  {id:"lifestyle",name:"✨ Lifestyle",color:"#EC4899",percentage:15,examples:["Dubai luxury","Community life","Amenities"]},
  {id:"social_proof",name:"🏆 Social Proof",color:"#F59E0B",percentage:10,examples:["Testimonials","Deal closed","Client stories"]},
  {id:"behind",name:"🎬 Behind Scenes",color:"#F97316",percentage:10,examples:["Market visits","Team","Day in life"]}
];
function getPillarSettings(){try{return JSON.parse(localStorage.getItem("dv_content_pillars")||"null")||DEFAULT_PILLARS;}catch(e){return DEFAULT_PILLARS;}}
function showPillarPlanner(){
  var m=document.getElementById("pillar-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"pillar-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #8B5CF6",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#8B5CF6",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"🏛️ Content Pillar Planner"));
  var pillars=getPillarSettings();
  var history=getPostHistory();
  var chartCanvas=document.createElement("canvas");chartCanvas.width=280;chartCanvas.height=280;
  chartCanvas.style.cssText="width:140px;height:140px;display:block;margin:0 auto 12px;";
  card.appendChild(chartCanvas);
  function drawPieChart(){
    var ctx=chartCanvas.getContext("2d");ctx.clearRect(0,0,280,280);
    var cx=140,cy=140,r=120;var startAngle=-Math.PI/2;
    pillars.forEach(function(p){
      var slice=p.percentage/100*Math.PI*2;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,startAngle,startAngle+slice);ctx.closePath();
      ctx.fillStyle=p.color;ctx.fill();ctx.strokeStyle="#1A1F2E";ctx.lineWidth=3;ctx.stroke();
      var midAngle=startAngle+slice/2;var lx=cx+r*0.65*Math.cos(midAngle);var ly=cy+r*0.65*Math.sin(midAngle);
      ctx.fillStyle="#FFF";ctx.font="bold 16px monospace";ctx.textAlign="center";ctx.fillText(p.percentage+"%",lx,ly+5);
      startAngle+=slice;
    });
  }
  drawPieChart();
  pillars.forEach(function(p,i){
    var pCard=div({background:"#0D1117",border:"1px solid "+hexAlpha(p.color,0.3),borderRadius:"8px",padding:"8px",marginBottom:"6px"});
    var hdr=div({display:"flex",justifyContent:"space-between",alignItems:"center"});
    hdr.appendChild(el("span",{style:{color:p.color,fontSize:"11px",fontWeight:"700",fontFamily:"monospace"}},p.name));
    var actual=0;if(history.length>0){actual=Math.round(history.filter(function(h){return(h.pillar||"").toLowerCase().indexOf(p.id)!==-1;}).length/history.length*100);}
    hdr.appendChild(el("span",{style:{color:actual>0?"#10B981":"#6B7280",fontSize:"9px",fontFamily:"monospace"}},"Actual: "+actual+"% | Target: "+p.percentage+"%"));
    pCard.appendChild(hdr);
    var slider=el("input",{type:"range",min:"5",max:"50",value:String(p.percentage),style:{width:"100%",marginTop:"4px"},oninput:function(){
      p.percentage=parseInt(this.value);localStorage.setItem("dv_content_pillars",JSON.stringify(pillars));drawPieChart();
      hdr.querySelector("span:last-child").textContent="Actual: "+actual+"% | Target: "+p.percentage+"%";
    }});pCard.appendChild(slider);
    var exRow=div({display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"4px"});
    p.examples.forEach(function(e){exRow.appendChild(el("span",{style:{background:hexAlpha(p.color,0.1),color:hexAlpha(p.color,1),padding:"2px 6px",borderRadius:"8px",fontSize:"8px",fontFamily:"monospace"}},e));});
    pCard.appendChild(exRow);card.appendChild(pCard);
  });
  var totalPct=pillars.reduce(function(s,p){return s+p.percentage;},0);
  if(totalPct!==100)card.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"10px",textAlign:"center",marginTop:"6px"}},"⚠️ Total: "+totalPct+"% (should be 100%)"));
  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- LINKEDIN API ---
async function publishToLinkedIn(text,imageUrl){
  var token=localStorage.getItem("dv_linkedin_token");var personUrn=localStorage.getItem("dv_linkedin_urn");
  if(!token||!personUrn)return{success:false,error:"LinkedIn token or URN not set. Go to Setup."};
  try{
    var body;
    if(imageUrl){
      var regResp=await fetch("https://api.linkedin.com/v2/assets?action=registerUpload",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json","X-Restli-Protocol-Version":"2.0.0"},
        body:JSON.stringify({registerUploadRequest:{recipes:["urn:li:digitalmediaRecipe:feedshare-image"],owner:personUrn,serviceRelationships:[{identifier:"urn:li:userGeneratedContent",relationshipType:"OWNER"}]}})});
      var regData=await regResp.json();
      var uploadUrl=regData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
      var asset=regData.value.asset;
      var imgResp=await fetch(imageUrl);var imgBlob=await imgResp.blob();
      await fetch(uploadUrl,{method:"PUT",headers:{"Authorization":"Bearer "+token},body:imgBlob});
      body={author:personUrn,lifecycleState:"PUBLISHED",specificContent:{"com.linkedin.ugc.ShareContent":{shareCommentary:{text:text},shareMediaCategory:"IMAGE",media:[{status:"READY",media:asset}]}},visibility:{memberNetworkVisibility:"PUBLIC"}};
    }else{
      body={author:personUrn,lifecycleState:"PUBLISHED",specificContent:{"com.linkedin.ugc.ShareContent":{shareCommentary:{text:text},shareMediaCategory:"NONE"}},visibility:{memberNetworkVisibility:"PUBLIC"}};
    }
    var r=await fetch("https://api.linkedin.com/v2/ugcPosts",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json","X-Restli-Protocol-Version":"2.0.0"},body:JSON.stringify(body)});
    var d=await r.json();if(d.id)return{success:true,id:d.id};return{success:false,error:d.message||JSON.stringify(d)};
  }catch(e){return{success:false,error:e.message};}
}

// --- X (TWITTER) API ---
async function publishToTwitter(text,imageUrl){
  var bearer=localStorage.getItem("dv_twitter_bearer");
  if(!bearer)return{success:false,error:"X/Twitter bearer token not set. Go to Setup."};
  try{
    var mediaId=null;
    if(imageUrl){
      var imgResp=await fetch(imageUrl);var imgBlob=await imgResp.blob();
      var formData=new FormData();formData.append("media",imgBlob,"image.jpg");
      var mResp=await fetch("https://upload.twitter.com/1.1/media/upload.json",{method:"POST",headers:{"Authorization":"Bearer "+bearer},body:formData});
      var mData=await mResp.json();mediaId=mData.media_id_string;
    }
    var tweetBody={text:text};if(mediaId)tweetBody.media={media_ids:[mediaId]};
    var r=await fetch("https://api.twitter.com/2/tweets",{method:"POST",headers:{"Authorization":"Bearer "+bearer,"Content-Type":"application/json"},body:JSON.stringify(tweetBody)});
    var d=await r.json();if(d.data&&d.data.id)return{success:true,id:d.data.id};return{success:false,error:d.detail||d.title||JSON.stringify(d)};
  }catch(e){return{success:false,error:e.message};}
}

// --- TIKTOK API ---
async function publishToTikTok(text,videoUrl){
  var token=localStorage.getItem("dv_tiktok_token");
  if(!token)return{success:false,error:"TikTok token not set. Go to Setup."};
  try{
    var initBody={post_info:{title:text.substring(0,150),privacy_level:"PUBLIC_TO_EVERYONE",disable_duet:false,disable_comment:false,disable_stitch:false},source_info:{source:"PULL_FROM_URL",video_url:videoUrl}};
    var r=await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(initBody)});
    var d=await r.json();if(d.data&&d.data.publish_id)return{success:true,id:d.data.publish_id};return{success:false,error:d.error&&d.error.message?d.error.message:JSON.stringify(d)};
  }catch(e){return{success:false,error:e.message};}
}

// --- YOUTUBE DATA API v3 ---
async function publishToYouTube(title,description,videoUrl,privacy){
  var token=localStorage.getItem("dv_youtube_token");
  if(!token)return{success:false,error:"YouTube token not set. Go to Setup."};
  try{
    var videoResp=await fetch(videoUrl);var videoBlob=await videoResp.blob();
    var metadata={snippet:{title:title.substring(0,100),description:description,tags:["Dubai","Real Estate","Property","Investment","DubAIVal"],categoryId:"22",defaultLanguage:"en"},status:{privacyStatus:privacy||"public",selfDeclaredMadeForKids:false,embeddable:true}};
    var r=await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",{
      method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(metadata)
    });
    if(!r.ok){var errData=await r.json();return{success:false,error:errData.error?errData.error.message:r.statusText};}
    var uploadUrl=r.headers.get("Location");
    if(!uploadUrl)return{success:false,error:"No upload URL returned"};
    var uploadResp=await fetch(uploadUrl,{method:"PUT",headers:{"Authorization":"Bearer "+token,"Content-Type":videoBlob.type||"video/mp4"},body:videoBlob});
    var uploadData=await uploadResp.json();
    if(uploadData.id)return{success:true,id:uploadData.id,url:"https://youtube.com/watch?v="+uploadData.id};
    return{success:false,error:uploadData.error?uploadData.error.message:JSON.stringify(uploadData)};
  }catch(e){return{success:false,error:e.message};}
}

async function publishYouTubeShort(title,description,videoUrl){
  var result=await publishToYouTube(title+" #Shorts",description+"\n\n#Shorts #DubaiRealEstate #DubAIVal",videoUrl,"public");
  return result;
}

async function getYouTubeChannelStats(){
  var token=localStorage.getItem("dv_youtube_token");
  if(!token)return null;
  try{
    var r=await fetch("https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true",{headers:{"Authorization":"Bearer "+token}});
    var d=await r.json();
    if(d.items&&d.items[0])return{name:d.items[0].snippet.title,subscribers:d.items[0].statistics.subscriberCount,views:d.items[0].statistics.viewCount,videos:d.items[0].statistics.videoCount};
  }catch(e){}return null;
}

// --- POST DESIGNER SYSTEM (World-Class) ---
var POST_TEMPLATES={
  luxury:{name:"Luxury Gold",bg:["#0A0520","#1A0A3A"],accent:"#C9A84C",text:"#FFF",overlay:0.6},
  modern:{name:"Modern Blue",bg:["#0A1628","#0D1830"],accent:"#3B82F6",text:"#FFF",overlay:0.55},
  emerald:{name:"Investment",bg:["#041210","#0A2820"],accent:"#10B981",text:"#FFF",overlay:0.55},
  sunset:{name:"Sunset",bg:["#1A0A10","#2A1020"],accent:"#F59E0B",text:"#FFF",overlay:0.5},
  rose:{name:"Lifestyle",bg:["#1A0818","#2A1028"],accent:"#EC4899",text:"#FFF",overlay:0.5},
  minimal:{name:"Minimal",bg:["#F8F8F8","#ECECEC"],accent:"#1A1A2E",text:"#111",overlay:0.12}
};
var IMAGE_FILTERS={
  none:{name:"Original",css:"none"},
  cinematic:{name:"Cinematic",css:"contrast(1.15) saturate(1.1) brightness(0.95)"},
  warm:{name:"Warm Dubai",css:"saturate(1.2) sepia(0.15) brightness(1.05)"},
  cool:{name:"Cool Blue",css:"saturate(0.9) hue-rotate(10deg) brightness(1.05)"},
  moody:{name:"Moody",css:"contrast(1.3) saturate(0.8) brightness(0.85)"},
  bright:{name:"Bright",css:"brightness(1.15) contrast(1.1) saturate(1.15)"},
  bw:{name:"B&W",css:"grayscale(1) contrast(1.2) brightness(1.05)"}
};
var POST_FORMATS={
  square:{name:"□ Post",w:1080,h:1080},
  story:{name:"▯ Story",w:1080,h:1920},
  portrait:{name:"▯ Portrait",w:1080,h:1350},
  landscape:{name:"▭ Landscape",w:1920,h:1080}
};

function extractPostData(caption){
  var text=(caption||"").toLowerCase();var data=[];var foundArea=null;
  var ak=Object.keys(AREAS);
  for(var i=0;i<ak.length;i++){if(text.indexOf(ak[i].toLowerCase())!==-1){foundArea=ak[i];break;}}
  if(foundArea){
    var a=AREAS[foundArea];
    if(a.psf)data.push({label:"Price / Sqft",value:"AED "+a.psf.toLocaleString()});
    if(a.y)data.push({label:"Gross Yield",value:((a.y[0]+a.y[1])/2).toFixed(1)+"%"});
    if(a.g&&a.g[0])data.push({label:"1Y Growth",value:(a.g[0]>0?"+":"")+a.g[0]+"%"});
    if(a.sc)data.push({label:"Service Charge",value:"AED "+a.sc+"/sqft"});
    if(a.r1)data.push({label:"Studio Rent",value:"AED "+a.r1.toLocaleString()+"/yr"});
  }
  return{area:foundArea,data:data};
}

function renderPostDesign(ctx,w,h,opts){
  var T=POST_TEMPLATES[opts.template]||POST_TEMPLATES.luxury;
  var brand=getBrandProfile();var isStory=h>w*1.3;var pad=w*0.08;
  var grd=ctx.createLinearGradient(0,0,0,h);grd.addColorStop(0,T.bg[0]);grd.addColorStop(1,T.bg[1]);
  ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);
  if(opts.bgImg){
    ctx.save();ctx.globalAlpha=1-T.overlay;
    if(opts.filter&&opts.filter!=="none")ctx.filter=IMAGE_FILTERS[opts.filter]?IMAGE_FILTERS[opts.filter].css:"none";
    var iw=opts.bgImg.width,ih=opts.bgImg.height,asp=w/h,iAsp=iw/ih;
    var sw,sh,sx,sy;
    if(iAsp>asp){sh=ih;sw=ih*asp;sx=(iw-sw)/2;sy=0;}else{sw=iw;sh=iw/asp;sx=0;sy=(ih-sh)/2;}
    ctx.drawImage(opts.bgImg,sx,sy,sw,sh,0,0,w,h);ctx.filter="none";ctx.restore();
    var ogrd=ctx.createLinearGradient(0,0,0,h);
    ogrd.addColorStop(0,hexAlpha(T.bg[0],0.75));ogrd.addColorStop(0.35,hexAlpha(T.bg[0],0.5));ogrd.addColorStop(1,hexAlpha(T.bg[0],0.93));
    ctx.fillStyle=ogrd;ctx.fillRect(0,0,w,h);
  }
  ctx.fillStyle=T.accent;ctx.fillRect(0,0,w,5);ctx.fillRect(0,h-5,w,5);
  ctx.save();ctx.globalAlpha=0.15;ctx.strokeStyle=T.accent;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(30,60);ctx.lineTo(30,30);ctx.lineTo(60,30);ctx.stroke();
  ctx.beginPath();ctx.moveTo(w-60,30);ctx.lineTo(w-30,30);ctx.lineTo(w-30,60);ctx.stroke();
  ctx.beginPath();ctx.moveTo(30,h-60);ctx.lineTo(30,h-30);ctx.lineTo(60,h-30);ctx.stroke();
  ctx.beginPath();ctx.moveTo(w-60,h-30);ctx.lineTo(w-30,h-30);ctx.lineTo(w-30,h-60);ctx.stroke();
  ctx.restore();
  var yPos=isStory?h*0.1:h*0.12;
  if(opts.title){
    ctx.save();ctx.shadowColor=T.accent;ctx.shadowBlur=14;
    ctx.font="bold "+Math.round(w/(isStory?13:14))+"px 'Space Grotesk',sans-serif";
    ctx.fillStyle=T.accent;ctx.textAlign="left";
    var tL=wrapText(ctx,opts.title,w-pad*2);
    tL.forEach(function(ln,li){ctx.fillText(ln,pad,yPos+li*Math.round(w/10));});
    ctx.shadowBlur=0;ctx.restore();yPos+=tL.length*Math.round(w/10)+15;
  }
  ctx.fillStyle=T.accent;ctx.fillRect(pad,yPos,w*0.15,3);yPos+=22;
  if(opts.subtitle){
    ctx.font=Math.round(w/28)+"px sans-serif";ctx.fillStyle=hexAlpha(T.text,0.75);ctx.textAlign="left";
    var sL=wrapText(ctx,opts.subtitle,w-pad*2);
    sL.forEach(function(ln,li){ctx.fillText(ln,pad,yPos+li*Math.round(w/24));});
    yPos+=sL.length*Math.round(w/24)+22;
  }
  if(opts.data&&opts.data.length>0){
    var cardH=Math.round(h*0.07);
    opts.data.forEach(function(d,i){
      var cy=yPos+i*(cardH+10);
      drawRoundRect(ctx,pad,cy,w-pad*2,cardH,12);
      ctx.fillStyle="rgba(255,255,255,0.05)";ctx.fill();
      ctx.strokeStyle=hexAlpha(T.accent,0.2);ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle=T.accent;ctx.fillRect(pad,cy+6,3,cardH-12);
      ctx.font="600 "+Math.round(w/34)+"px sans-serif";ctx.fillStyle=hexAlpha(T.text,0.55);ctx.textAlign="left";
      ctx.fillText(d.label,pad+16,cy+cardH*0.62);
      ctx.save();ctx.shadowColor=T.accent;ctx.shadowBlur=6;
      ctx.font="bold "+Math.round(w/24)+"px 'Space Grotesk',sans-serif";ctx.fillStyle=T.accent;ctx.textAlign="right";
      ctx.fillText(d.value,w-pad,cy+cardH*0.62);ctx.shadowBlur=0;ctx.restore();
    });
    yPos+=opts.data.length*(cardH+10)+18;
  }
  if(opts.cta){
    var ctaY=Math.max(yPos+10,h*(isStory?0.82:0.78));
    var ctaW=w*0.5;var ctaH=h*0.055;
    ctx.save();ctx.shadowColor=T.accent;ctx.shadowBlur=16;
    drawRoundRect(ctx,(w-ctaW)/2,ctaY,ctaW,ctaH,ctaH/2);ctx.fillStyle=T.accent;ctx.fill();
    ctx.shadowBlur=0;ctx.restore();
    ctx.font="bold "+Math.round(w/30)+"px 'Space Grotesk',sans-serif";ctx.fillStyle=T.bg[0];ctx.textAlign="center";
    ctx.fillText(opts.cta,w/2,ctaY+ctaH*0.65);
  }
  if(opts.slideNum){
    ctx.font="bold "+Math.round(w/28)+"px 'Space Grotesk',sans-serif";ctx.fillStyle=hexAlpha(T.accent,0.7);ctx.textAlign="center";
    ctx.fillText(opts.slideNum,w/2,h-20);
  }
  var footY=h-22;
  if(brand&&brand.name){
    ctx.font="bold "+Math.round(w/36)+"px 'Space Grotesk',sans-serif";ctx.fillStyle=T.text;ctx.textAlign="right";
    ctx.fillText(brand.name,w-pad,footY);
    if(brand.phone){ctx.font=Math.round(w/48)+"px sans-serif";ctx.fillStyle=hexAlpha(T.text,0.4);ctx.fillText(brand.phone,w-pad,footY-Math.round(w/34));}
  }
  ctx.font="bold "+Math.round(w/48)+"px 'Space Grotesk',sans-serif";ctx.fillStyle=hexAlpha(T.accent,0.4);ctx.textAlign="left";
  ctx.fillText("DubAIVal.com",pad,footY);
}

function showPostDesigner(caption,existingImg){
  var m=document.getElementById("post-designer-modal");if(m)m.remove();
  var pData=extractPostData(caption);
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.9)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"post-designer-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #C9A84C",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#C9A84C",margin:"0 0 8px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"🎨 Professional Post Designer"));

  var state={template:"luxury",filter:"none",format:"square",bgImg:null,title:pData.area||"Dubai Property",subtitle:"",cta:"Learn More →",data:pData.data.slice(0,4),slideCount:1};
  var preview=document.createElement("canvas");var pCtx=preview.getContext("2d");
  var fmt=POST_FORMATS[state.format];preview.width=fmt.w;preview.height=fmt.h;
  preview.style.cssText="width:100%;max-height:320px;border-radius:10px;border:1px solid #2A3040;margin-bottom:10px;object-fit:contain;background:#000;";
  card.appendChild(preview);

  function redraw(){
    var f=POST_FORMATS[state.format];preview.width=f.w;preview.height=f.h;
    renderPostDesign(pCtx,f.w,f.h,state);
  }

  function makeChips(label,items,active,onSelect){
    var row=div({display:"flex",gap:"4px",alignItems:"center",marginBottom:"8px",flexWrap:"wrap"});
    row.appendChild(el("span",{style:{color:"#8899AA",fontSize:"10px",fontFamily:"monospace",minWidth:"55px"}},label));
    items.forEach(function(item){
      var b=el("button",{style:{background:item.key===active?"#C9A84C":"#0D1117",color:item.key===active?"#000":"#8899AA",border:"1px solid "+(item.key===active?"#C9A84C":"#2A3040"),borderRadius:"6px",padding:"4px 8px",fontSize:"9px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){onSelect(item.key);makeChips.rebuild();}});
      b.textContent=item.name;row.appendChild(b);
    });
    return row;
  }

  var tplRow=div({display:"flex",gap:"4px",alignItems:"center",marginBottom:"6px",flexWrap:"wrap"});
  tplRow.appendChild(el("span",{style:{color:"#8899AA",fontSize:"10px",fontFamily:"monospace",minWidth:"55px"}},"Template:"));
  Object.keys(POST_TEMPLATES).forEach(function(k){
    var b=el("button",{style:{background:k===state.template?"#C9A84C":"#0D1117",color:k===state.template?"#000":"#8899AA",border:"1px solid "+(k===state.template?"#C9A84C":"#2A3040"),borderRadius:"6px",padding:"4px 8px",fontSize:"9px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
      state.template=k;rebuildUI();redraw();
    }});b.textContent=POST_TEMPLATES[k].name;tplRow.appendChild(b);
  });card.appendChild(tplRow);

  var filterRow=div({display:"flex",gap:"4px",alignItems:"center",marginBottom:"6px",flexWrap:"wrap"});
  filterRow.appendChild(el("span",{style:{color:"#8899AA",fontSize:"10px",fontFamily:"monospace",minWidth:"55px"}},"Filter:"));
  Object.keys(IMAGE_FILTERS).forEach(function(k){
    var b=el("button",{style:{background:k===state.filter?"#3B82F6":"#0D1117",color:k===state.filter?"#FFF":"#8899AA",border:"1px solid "+(k===state.filter?"#3B82F6":"#2A3040"),borderRadius:"6px",padding:"4px 8px",fontSize:"9px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
      state.filter=k;rebuildUI();redraw();
    }});b.textContent=IMAGE_FILTERS[k].name;filterRow.appendChild(b);
  });card.appendChild(filterRow);

  var fmtRow=div({display:"flex",gap:"4px",alignItems:"center",marginBottom:"8px",flexWrap:"wrap"});
  fmtRow.appendChild(el("span",{style:{color:"#8899AA",fontSize:"10px",fontFamily:"monospace",minWidth:"55px"}},"Format:"));
  Object.keys(POST_FORMATS).forEach(function(k){
    var b=el("button",{style:{background:k===state.format?"#10B981":"#0D1117",color:k===state.format?"#FFF":"#8899AA",border:"1px solid "+(k===state.format?"#10B981":"#2A3040"),borderRadius:"6px",padding:"4px 8px",fontSize:"9px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
      state.format=k;rebuildUI();redraw();
    }});b.textContent=POST_FORMATS[k].name;fmtRow.appendChild(b);
  });card.appendChild(fmtRow);

  function makeInput(label,val,onChange){
    var w=div({marginBottom:"6px"});
    w.appendChild(el("label",{style:{color:"#8899AA",fontSize:"10px",display:"block",marginBottom:"2px",fontFamily:"monospace"}},label));
    var inp=el("input",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"6px 8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box"},value:val||"",oninput:function(){onChange(this.value);redraw();}});
    w.appendChild(inp);return w;
  }
  card.appendChild(makeInput("Title",state.title,function(v){state.title=v;}));
  card.appendChild(makeInput("Subtitle",state.subtitle,function(v){state.subtitle=v;}));
  card.appendChild(makeInput("CTA Button",state.cta,function(v){state.cta=v;}));

  var imgRow=div({display:"flex",gap:"6px",marginBottom:"8px"});
  var imgFileInp=el("input",{type:"file",accept:"image/*",style:{display:"none"},onchange:function(){
    if(this.files&&this.files[0]){var r=new FileReader();r.onload=function(e){var img=new Image();img.onload=function(){state.bgImg=img;redraw();};img.src=e.target.result;};r.readAsDataURL(this.files[0]);}
  }});
  imgRow.appendChild(el("button",{style:{flex:1,background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#8899AA",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){imgFileInp.click();}},"📷 Upload Photo"));
  imgRow.appendChild(el("button",{style:{flex:1,background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#8899AA",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
    this.textContent="🔍 Searching...";var img=await findSmartImage(caption);
    if(img){var im=new Image();im.crossOrigin="anonymous";im.onload=function(){state.bgImg=im;redraw();};im.src=img;}
    this.textContent="🔍 AI Search";
  }},"🔍 AI Search"));
  imgRow.appendChild(imgFileInp);card.appendChild(imgRow);

  var slideRow=div({display:"flex",gap:"6px",alignItems:"center",marginBottom:"10px"});
  slideRow.appendChild(el("span",{style:{color:"#8899AA",fontSize:"10px",fontFamily:"monospace"}},"Carousel:"));
  var slideSel=el("select",{style:{background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"4px 8px",color:"#E0E0E0",fontSize:"10px",fontFamily:"monospace"},onchange:function(){state.slideCount=parseInt(this.value);redraw();}});
  [1,2,3,4,5,6,8,10].forEach(function(n){var o=el("option");o.value=n;o.textContent=n===1?"Single Post":n+" Slides";slideSel.appendChild(o);});
  slideRow.appendChild(slideSel);card.appendChild(slideRow);

  var actRow=div({display:"flex",gap:"6px",flexWrap:"wrap"});
  actRow.appendChild(el("button",{style:{flex:1,background:"#10B981",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
    var f=POST_FORMATS[state.format];var c=document.createElement("canvas");c.width=f.w;c.height=f.h;
    var cx=c.getContext("2d");
    if(state.slideCount>1){
      for(var si=0;si<state.slideCount;si++){
        state.slideNum=(si+1)+"/"+state.slideCount;
        if(si>0&&pData.data.length>0){state.data=[pData.data[si%pData.data.length]];}
        renderPostDesign(cx,f.w,f.h,state);
        var a=document.createElement("a");a.href=c.toDataURL("image/png");a.download="dubaival-post-"+(si+1)+".png";a.click();
      }
      state.slideNum=null;state.data=pData.data.slice(0,4);
    }else{
      renderPostDesign(cx,f.w,f.h,state);
      var a=document.createElement("a");a.href=c.toDataURL("image/png");a.download="dubaival-post.png";a.click();
    }
  }},"💾 Save PNG"));
  actRow.appendChild(el("button",{style:{flex:1,background:"#E1306C",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
    this.textContent="⏳...";
    var f=POST_FORMATS[state.format];var c=document.createElement("canvas");c.width=f.w;c.height=f.h;
    var cx=c.getContext("2d");
    if(state.slideCount>1){
      var urls=[];
      for(var si=0;si<state.slideCount;si++){
        state.slideNum=(si+1)+"/"+state.slideCount;
        if(si>0&&pData.data.length>0){state.data=[pData.data[si%pData.data.length]];}
        renderPostDesign(cx,f.w,f.h,state);
        var blob=await new Promise(function(res){c.toBlob(function(b){res(b);},"image/png");});
        var url=await uploadToPublicHost(blob);if(url)urls.push(url);
      }
      state.slideNum=null;state.data=pData.data.slice(0,4);
      if(urls.length>0){var r=await publishToInstagram(caption,urls);alert(r.success?"✅ Carousel posted!":"❌ "+r.error);}
    }else{
      renderPostDesign(cx,f.w,f.h,state);
      var blob=await new Promise(function(res){c.toBlob(function(b){res(b);},"image/png");});
      var url=await uploadToPublicHost(blob);
      if(url){
        var pubFn=state.format==="story"?publishInstagramStory:publishToInstagram;
        var r=await pubFn(caption,state.format==="story"?url:[url]);
        alert(r.success?"✅ Posted!":"❌ "+r.error);
      }
    }
    this.textContent="📸 Publish IG";
  }},"📸 Publish IG"));
  actRow.appendChild(el("button",{style:{flex:1,background:"#8B5CF6",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
    saveCalendarEvent({caption:caption,template:state.template,format:state.format,platform:"instagram"});
    alert("📅 Added to Content Calendar!");
  }},"📅 Schedule"));
  card.appendChild(actRow);

  var closeBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close");
  card.appendChild(closeBtn);

  function rebuildUI(){
    var tplBtns=tplRow.querySelectorAll("button");tplBtns.forEach(function(b){var k=Object.keys(POST_TEMPLATES).find(function(tk){return POST_TEMPLATES[tk].name===b.textContent;});
      if(k){b.style.background=k===state.template?"#C9A84C":"#0D1117";b.style.color=k===state.template?"#000":"#8899AA";b.style.borderColor=k===state.template?"#C9A84C":"#2A3040";}});
    var fBtns=filterRow.querySelectorAll("button");fBtns.forEach(function(b){var k=Object.keys(IMAGE_FILTERS).find(function(fk){return IMAGE_FILTERS[fk].name===b.textContent;});
      if(k){b.style.background=k===state.filter?"#3B82F6":"#0D1117";b.style.color=k===state.filter?"#FFF":"#8899AA";b.style.borderColor=k===state.filter?"#3B82F6":"#2A3040";}});
    var fmBtns=fmtRow.querySelectorAll("button");fmBtns.forEach(function(b){var k=Object.keys(POST_FORMATS).find(function(fk){return POST_FORMATS[fk].name===b.textContent;});
      if(k){b.style.background=k===state.format?"#10B981":"#0D1117";b.style.color=k===state.format?"#FFF":"#8899AA";b.style.borderColor=k===state.format?"#10B981":"#2A3040";}});
  }

  if(existingImg){var im=new Image();im.crossOrigin="anonymous";im.onload=function(){state.bgImg=im;redraw();};im.src=existingImg;}
  redraw();
  overlay.appendChild(card);
  overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- A/B CAPTION TESTING ---
async function generateCaptionVariants(caption,platform){
  var geminiKey=localStorage.getItem("dv_gemini_key");
  if(!geminiKey)return null;
  var bp=getBrandProfile();var brandCtx=bp?" Agent: "+bp.name+(bp.tone?", Tone: "+bp.tone:""):"";
  try{
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:"You are a social media A/B testing expert."+brandCtx+"\n\nOriginal caption:\n"+caption+"\n\nGenerate 2 alternative versions optimized for higher engagement on "+(platform||"Instagram")+".\nVariant A: More emotional/storytelling approach\nVariant B: More data-driven/FOMO approach\n\nRespond in valid JSON:\n{\"variantA\":\"...\",\"variantB\":\"...\",\"analysis\":\"Brief comparison of which might perform better and why\"}"}]}],generationConfig:{responseMimeType:"application/json"}})
    });
    var d=await r.json();
    if(d.candidates&&d.candidates[0]){
      var txt=d.candidates[0].content.parts[0].text;
      return JSON.parse(txt);
    }
  }catch(e){console.warn("A/B error:",e);}
  return null;
}

function showABTest(caption,platform){
  var m=document.getElementById("ab-test-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"ab-test-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #8B5CF6",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#8B5CF6",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"🧪 A/B Caption Testing"));
  var loadingP=el("p",{style:{color:"#8899AA",fontSize:"12px",textAlign:"center"}},"⏳ Generating variants with AI...");
  card.appendChild(loadingP);
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
  generateCaptionVariants(caption,platform).then(function(result){
    loadingP.remove();
    if(!result){card.appendChild(el("p",{style:{color:"#EF4444",fontSize:"12px"}},"❌ Could not generate variants. Check Gemini API key."));return;}
    var variants=[{label:"Original",text:caption,color:"#C9A84C"},{label:"Variant A — Emotional",text:result.variantA,color:"#10B981"},{label:"Variant B — Data-Driven",text:result.variantB,color:"#3B82F6"}];
    variants.forEach(function(v){
      var vCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"10px",padding:"10px",marginBottom:"8px"});
      vCard.appendChild(el("div",{style:{color:v.color,fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginBottom:"4px"}},v.label));
      var textEl=el("div",{style:{color:"#E0E0E0",fontSize:"11px",lineHeight:"1.5",maxHeight:"120px",overflowY:"auto",whiteSpace:"pre-wrap"}});textEl.textContent=v.text;
      vCard.appendChild(textEl);
      var useBtn=el("button",{style:{marginTop:"6px",background:hexAlpha(v.color,0.15),border:"1px solid "+hexAlpha(v.color,0.3),color:v.color,padding:"5px 12px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
        navigator.clipboard.writeText(v.text).then(function(){useBtn.textContent="✅ Copied!";setTimeout(function(){useBtn.textContent="📋 Use This";},2000);});
      }});useBtn.textContent="📋 Use This";vCard.appendChild(useBtn);
      card.appendChild(vCard);
    });
    if(result.analysis){
      var aBox=div({background:"#1A0A3A",border:"1px solid #8B5CF6",borderRadius:"8px",padding:"10px",marginBottom:"8px"});
      aBox.appendChild(el("div",{style:{color:"#8B5CF6",fontSize:"10px",fontWeight:"700",fontFamily:"monospace",marginBottom:"4px"}},"🧠 AI Analysis"));
      aBox.appendChild(el("div",{style:{color:"#CCC",fontSize:"11px",lineHeight:"1.4"}},result.analysis));
      card.appendChild(aBox);
    }
    card.appendChild(el("button",{style:{width:"100%",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  });
}

// --- HASHTAG INTELLIGENCE ---
async function analyzeHashtags(text){
  var geminiKey=localStorage.getItem("dv_gemini_key");if(!geminiKey)return null;
  try{
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:"You are a Dubai real estate Instagram hashtag specialist.\n\nPost text:\n"+text+"\n\nAnalyze and suggest the BEST hashtags organized by category. Consider:\n- Trending Dubai real estate hashtags\n- Location-specific hashtags\n- Property type hashtags\n- Investment/lifestyle hashtags\n- Branded hashtags\n\nRespond in valid JSON:\n{\"trending\":[{\"tag\":\"#DubaiRealEstate\",\"reach\":\"High\"}],\"location\":[],\"property\":[],\"investment\":[],\"lifestyle\":[],\"total_suggested\":15,\"best_combo\":\"The optimal 8-10 hashtags for max reach\"}"}]}],generationConfig:{responseMimeType:"application/json"}})
    });
    var d=await r.json();
    if(d.candidates&&d.candidates[0])return JSON.parse(d.candidates[0].content.parts[0].text);
  }catch(e){}return null;
}

function showHashtagIntelligence(caption){
  var m=document.getElementById("hashtag-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"hashtag-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #F59E0B",borderRadius:"16px",padding:"16px",width:"480px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#F59E0B",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"#️⃣ Hashtag Intelligence"));
  var loadingP=el("p",{style:{color:"#8899AA",fontSize:"12px",textAlign:"center"}},"⏳ Analyzing trending hashtags...");
  card.appendChild(loadingP);
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
  analyzeHashtags(caption).then(function(result){
    loadingP.remove();
    if(!result){card.appendChild(el("p",{style:{color:"#EF4444",fontSize:"12px"}},"❌ Check Gemini API key."));return;}
    var cats=[{key:"trending",label:"🔥 Trending",color:"#EF4444"},{key:"location",label:"📍 Location",color:"#3B82F6"},{key:"property",label:"🏠 Property",color:"#10B981"},{key:"investment",label:"💰 Investment",color:"#F59E0B"},{key:"lifestyle",label:"✨ Lifestyle",color:"#EC4899"}];
    cats.forEach(function(cat){
      var tags=result[cat.key];if(!tags||tags.length===0)return;
      card.appendChild(el("div",{style:{color:cat.color,fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginTop:"8px",marginBottom:"4px"}},cat.label));
      var tagWrap=div({display:"flex",gap:"4px",flexWrap:"wrap"});
      tags.forEach(function(t){
        var tag=t.tag||t;var reach=t.reach||"";
        var chip=el("span",{style:{background:hexAlpha(cat.color,0.12),border:"1px solid "+hexAlpha(cat.color,0.3),color:cat.color,padding:"3px 8px",borderRadius:"12px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
          navigator.clipboard.writeText(tag);chip.style.background=hexAlpha(cat.color,0.4);setTimeout(function(){chip.style.background=hexAlpha(cat.color,0.12);},500);
        }});chip.textContent=tag+(reach?" ("+reach+")":"");tagWrap.appendChild(chip);
      });card.appendChild(tagWrap);
    });
    if(result.best_combo){
      var bestBox=div({background:"#1A1820",border:"1px solid #F59E0B",borderRadius:"8px",padding:"10px",marginTop:"10px"});
      bestBox.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"10px",fontWeight:"700",fontFamily:"monospace",marginBottom:"4px"}},"⭐ Best Combination (Copy All)"));
      var bestText=el("div",{style:{color:"#E0E0E0",fontSize:"11px",lineHeight:"1.5",cursor:"pointer"},onclick:function(){
        navigator.clipboard.writeText(result.best_combo);bestText.style.color="#10B981";setTimeout(function(){bestText.style.color="#E0E0E0";},1000);
      }});bestText.textContent=result.best_combo;bestBox.appendChild(bestText);
      card.appendChild(bestBox);
    }
    card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  });
}

// --- CONTENT CALENDAR ---
function getCalendarData(){try{return JSON.parse(localStorage.getItem("dv_content_calendar")||"[]");}catch(e){return[];}}
function saveCalendarEvent(evt){
  var cal=getCalendarData();
  evt.id="cal_"+Date.now();evt.status=evt.status||"scheduled";
  evt.createdAt=new Date().toISOString();
  if(!evt.date){var d=new Date();d.setDate(d.getDate()+1);evt.date=d.toISOString().split("T")[0];}
  if(!evt.time)evt.time="10:00";
  cal.push(evt);localStorage.setItem("dv_content_calendar",JSON.stringify(cal));schedulePostReminder(evt);return evt;
}
function deleteCalendarEvent(id){
  var cal=getCalendarData().filter(function(e){return e.id!==id;});
  localStorage.setItem("dv_content_calendar",JSON.stringify(cal));
}

function showContentCalendar(){
  var m=document.getElementById("calendar-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"calendar-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #3B82F6",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#3B82F6",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"📅 Content Calendar"));

  var cal=getCalendarData();
  var now=new Date();var curMonth=now.getMonth();var curYear=now.getFullYear();

  function renderMonth(year,month){
    var container=div({});
    var header=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"});
    var prevBtn=el("button",{style:{background:"none",border:"none",color:"#3B82F6",fontSize:"18px",cursor:"pointer"},onclick:function(){
      month--;if(month<0){month=11;year--;}container.innerHTML="";container.appendChild(renderMonth(year,month));
    }});prevBtn.textContent="◀";
    var nextBtn=el("button",{style:{background:"none",border:"none",color:"#3B82F6",fontSize:"18px",cursor:"pointer"},onclick:function(){
      month++;if(month>11){month=0;year++;}container.innerHTML="";container.appendChild(renderMonth(year,month));
    }});nextBtn.textContent="▶";
    var monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
    header.appendChild(prevBtn);
    header.appendChild(el("span",{style:{color:"#FFF",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"}},monthNames[month]+" "+year));
    header.appendChild(nextBtn);container.appendChild(header);

    var grid=div({display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px"});
    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(function(d){
      grid.appendChild(el("div",{style:{color:"#8899AA",fontSize:"9px",textAlign:"center",padding:"4px",fontFamily:"monospace"}},d));
    });
    var firstDay=new Date(year,month,1).getDay();
    var daysInMonth=new Date(year,month+1,0).getDate();
    for(var i=0;i<firstDay;i++)grid.appendChild(el("div"));
    for(var d=1;d<=daysInMonth;d++){
      var dateStr=year+"-"+String(month+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
      var dayEvents=cal.filter(function(e){return e.date===dateStr;});
      var isToday=d===now.getDate()&&month===now.getMonth()&&year===now.getFullYear();
      var cell=el("div",{style:{background:isToday?"#3B82F622":"#0D1117",border:"1px solid "+(isToday?"#3B82F6":"#2A3040"),borderRadius:"6px",padding:"3px",textAlign:"center",minHeight:"32px",cursor:dayEvents.length?"pointer":"default",position:"relative"},onclick:dayEvents.length?function(evts){return function(){showDayEvents(evts);};}(dayEvents):null});
      cell.appendChild(el("div",{style:{color:isToday?"#3B82F6":"#8899AA",fontSize:"10px",fontWeight:isToday?"700":"400"}},String(d)));
      if(dayEvents.length>0){
        var dot=el("div",{style:{width:"6px",height:"6px",borderRadius:"50%",background:dayEvents.length>1?"#F59E0B":"#10B981",margin:"2px auto 0"}});
        cell.appendChild(dot);
      }
      grid.appendChild(cell);
    }
    container.appendChild(grid);return container;
  }

  function showDayEvents(events){
    var evWrap=card.querySelector("#cal-events");if(evWrap)evWrap.remove();
    evWrap=div({id:"cal-events",marginTop:"10px",borderTop:"1px solid #2A3040",paddingTop:"10px"});
    events.forEach(function(evt){
      var evCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",marginBottom:"6px"});
      var hRow=div({display:"flex",justifyContent:"space-between",alignItems:"center"});
      hRow.appendChild(el("span",{style:{color:"#3B82F6",fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}},evt.time+" — "+(evt.platform||"Instagram")));
      var delBtn=el("button",{style:{background:"none",border:"none",color:"#EF4444",fontSize:"12px",cursor:"pointer"},onclick:function(){deleteCalendarEvent(evt.id);cal=getCalendarData();evCard.remove();}});
      delBtn.textContent="🗑";hRow.appendChild(delBtn);evCard.appendChild(hRow);
      var cap=el("div",{style:{color:"#CCC",fontSize:"10px",lineHeight:"1.4",marginTop:"4px",maxHeight:"60px",overflow:"hidden"}});cap.textContent=(evt.caption||"").substring(0,150);evCard.appendChild(cap);
      evWrap.appendChild(evCard);
    });
    card.appendChild(evWrap);
  }

  card.appendChild(renderMonth(curYear,curMonth));

  if(cal.length>0){
    card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",marginTop:"10px",fontFamily:"monospace"}},"📊 "+cal.length+" scheduled post"+(cal.length>1?"s":"")));
  }

  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

function buildPublishBar(postData,msgText,cl){
  var bar=div({display:"flex",flexDirection:"column",gap:"8px",marginTop:"10px",paddingTop:"10px",borderTop:"1px solid "+cl.border});
  var caption=postData?postData.caption:msgText;
  var platform=postData?postData.platform:"all";
  var imgCount=postData&&postData.imageCount?postData.imageCount:1;
  var postType=postData&&postData.type?postData.type:"post";

  var makeBtn=function(label,color,onclick){
    var b=el("button",{style:{
      background:hexAlpha(color,0.12),border:"1px solid "+hexAlpha(color,0.3),
      color:color,padding:"6px 10px",borderRadius:"8px",fontSize:"10px",fontWeight:"600",
      fontFamily:"'Space Grotesk',monospace",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.2s"
    },onclick:onclick});
    b.textContent=label;return b;
  };
  var successBtn=function(btn){btn.style.background="#10B98133";btn.style.color="#10B981";btn.style.borderColor="#10B981";};
  var failBtn=function(btn,origLabel,color){
    btn.textContent="❌ Failed";btn.style.background="#EF444433";btn.style.color="#EF4444";
    setTimeout(function(){btn.textContent=origLabel;btn.style.background="";btn.style.color=color;},3000);
  };

  var imgPreviewWrap=div({width:"100%",display:"none",gap:"4px",flexWrap:"wrap"});

  var showPreviews=function(urls){
    imgPreviewWrap.innerHTML="";
    urls.forEach(function(url){
      var img=el("img",{style:{width:urls.length>1?((100/Math.min(urls.length,3))-2)+"%":"100%",maxHeight:"160px",objectFit:"cover",borderRadius:"6px",border:"1px solid "+cl.border}});
      img.src=url;imgPreviewWrap.appendChild(img);
    });
    imgPreviewWrap.style.display="flex";
  };

  var videoUrlInput=el("input",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px 10px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box",display:"none"},placeholder:"Paste video URL here (mp4, public link)..."});

  // --- INSTAGRAM ---
  if(platform==="instagram"||platform==="all"){
    var igRow=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
    var igLabel=el("span",{style:{color:"#E1306C",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",minWidth:"70px"}});
    igLabel.textContent="📸 Instagram";
    igRow.appendChild(igLabel);

    var igPostLabel=imgCount>1?"Carousel ("+imgCount+")":"Post";
    igRow.appendChild(makeBtn(igPostLabel,"#E1306C",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Images...";
      var imgs=await findMultipleImages(caption,imgCount);
      showPreviews(imgs);
      this.textContent="⏳ Publishing...";
      var r=await publishToInstagram(caption,imgs);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅"+(r.carousel?" Carousel":"")+" Done";successBtn(this);savePostToHistory({caption:caption,platform:"instagram",type:"post"});}
      else{alert("IG: "+(r.error||"Error"));failBtn(this,igPostLabel,"#E1306C");}
    }));

    igRow.appendChild(makeBtn("Story","#C13584",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Image...";
      var img=await findSmartImage(caption);
      showPreviews([img]);
      this.textContent="⏳ Posting story...";
      var r=await publishInstagramStory(caption,img);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Story Posted";successBtn(this);savePostToHistory({caption:caption,platform:"instagram",type:"story"});}
      else{alert("IG Story: "+(r.error||"Error"));failBtn(this,"Story","#C13584");}
    }));

    igRow.appendChild(makeBtn("Video","#5B51D8",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Uploading video...";
      var r=await publishInstagramReel(caption,vUrl);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Video Posted";successBtn(this);}
      else{alert("IG Video: "+(r.error||"Error"));failBtn(this,"Video","#5B51D8");}
    }));

    igRow.appendChild(makeBtn("Reel","#FF6B00",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Uploading reel...";
      var r=await publishInstagramReel(caption,vUrl);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Reel Posted";successBtn(this);}
      else{alert("IG Reel: "+(r.error||"Error"));failBtn(this,"Reel","#FF6B00");}
    }));

    igRow.appendChild(makeBtn("Video Story","#833AB4",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Uploading...";
      var r=await publishInstagramVideoStory(vUrl);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Video Story Posted";successBtn(this);}
      else{alert("IG Video Story: "+(r.error||"Error"));failBtn(this,"Video Story","#833AB4");}
    }));

    igRow.appendChild(makeBtn("🎬 AI Video","#C9A84C",function(){showVideoGenUI(caption);}));
    bar.appendChild(igRow);
  }

  // --- FACEBOOK ---
  if(platform==="facebook"||platform==="all"){
    var fbRow=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
    var fbLabel=el("span",{style:{color:"#1877F2",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",minWidth:"70px"}});
    fbLabel.textContent="📘 Facebook";
    fbRow.appendChild(fbLabel);

    var fbPostLabel=imgCount>1?"Photo Post ("+imgCount+")":"Photo Post";
    fbRow.appendChild(makeBtn(fbPostLabel,"#1877F2",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Images...";
      var imgs=await findMultipleImages(caption,imgCount);
      showPreviews(imgs);
      this.textContent="⏳ Publishing...";
      var r=await publishToFacebook(caption,imgs);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅"+(r.multi?" ("+r.count+" pics)":"")+" Done";successBtn(this);savePostToHistory({caption:caption,platform:"facebook",type:"post"});}
      else{alert("FB: "+(r.error||"Error"));failBtn(this,fbPostLabel,"#1877F2");}
    }));

    fbRow.appendChild(makeBtn("Text Only","#4267B2",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Posting...";
      var r=await publishToFacebook(caption,[]);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Posted";successBtn(this);}
      else{alert("FB: "+(r.error||"Error"));failBtn(this,"Text Only","#4267B2");}
    }));

    fbRow.appendChild(makeBtn("Video","#1877F2",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Uploading video...";
      var r=await publishFacebookVideo(caption,vUrl);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Video Posted";successBtn(this);}
      else{alert("FB Video: "+(r.error||"Error"));failBtn(this,"Video","#1877F2");}
    }));

    fbRow.appendChild(makeBtn("Reel","#1877F2",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Uploading reel...";
      var r=await publishFacebookReel(caption,vUrl);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Reel Posted";successBtn(this);}
      else{alert("FB Reel: "+(r.error||"Error"));failBtn(this,"Reel","#1877F2");}
    }));

    bar.appendChild(fbRow);
  }

  // --- WHATSAPP ---
  if(platform==="whatsapp"||platform==="all"){
    var waRow=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
    var waLabel=el("span",{style:{color:"#25D366",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",minWidth:"70px"}});
    waLabel.textContent="📲 WhatsApp";
    waRow.appendChild(waLabel);

    waRow.appendChild(makeBtn("Text","#25D366",function(){
      shareToWhatsApp(caption);this.textContent="✅ Opened";successBtn(this);
    }));

    waRow.appendChild(makeBtn("Photo","#128C7E",async function(){
      this.textContent="⏳ Finding image...";
      var imgUrl=await findSmartImage(caption);
      try{
        var resp=await fetch(imgUrl);var blob=await resp.blob();
        var file=new File([blob],"dubaival-post.jpg",{type:blob.type||"image/jpeg"});
        if(navigator.canShare&&navigator.canShare({files:[file]})){
          await navigator.share({text:caption,files:[file]});
          this.textContent="✅ Shared";successBtn(this);
        }else{
          shareToWhatsApp(caption+"\n\n"+imgUrl);
          this.textContent="✅ Opened";successBtn(this);
        }
      }catch(e){
        shareToWhatsApp(caption+"\n\n"+imgUrl);
        this.textContent="✅ Opened";successBtn(this);
      }
    }));

    waRow.appendChild(makeBtn("Video","#075E54",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      try{
        var resp=await fetch(vUrl);var blob=await resp.blob();
        var file=new File([blob],"dubaival-video.mp4",{type:"video/mp4"});
        if(navigator.canShare&&navigator.canShare({files:[file]})){
          await navigator.share({text:caption,files:[file]});
          this.textContent="✅ Shared";successBtn(this);
        }else{
          shareToWhatsApp(caption+"\n\n"+vUrl);
          this.textContent="✅ Opened";successBtn(this);
        }
      }catch(e){
        shareToWhatsApp(caption+"\n\n"+vUrl);
        this.textContent="✅ Opened";successBtn(this);
      }
    }));

    waRow.appendChild(makeBtn("Multi Photo","#25D366",async function(){
      this.textContent="⏳ Finding images...";
      var imgs=await findMultipleImages(caption,imgCount);
      showPreviews(imgs);
      try{
        var files=[];
        for(var mi=0;mi<imgs.length;mi++){
          var resp=await fetch(imgs[mi]);var blob=await resp.blob();
          files.push(new File([blob],"dubaival-"+(mi+1)+".jpg",{type:blob.type||"image/jpeg"}));
        }
        if(navigator.canShare&&navigator.canShare({files:files})){
          await navigator.share({text:caption,files:files});
          this.textContent="✅ Shared";successBtn(this);
        }else{
          shareToWhatsApp(caption+"\n\n"+imgs.join("\n"));
          this.textContent="✅ Opened";successBtn(this);
        }
      }catch(e){
        shareToWhatsApp(caption);
        this.textContent="✅ Opened";successBtn(this);
      }
    }));

    bar.appendChild(waRow);
  }

  // --- LINKEDIN ---
  if(platform==="linkedin"||platform==="all"){
    var liRow=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
    var liLabel=el("span",{style:{color:"#0A66C2",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",minWidth:"70px"}});
    liLabel.textContent="💼 LinkedIn";liRow.appendChild(liLabel);
    liRow.appendChild(makeBtn("Post","#0A66C2",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Publishing...";
      var r=await publishToLinkedIn(caption);SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Posted";successBtn(this);savePostToHistory({caption:caption,platform:"linkedin",type:"post"});}
      else{alert("LinkedIn: "+(r.error||"Error"));failBtn(this,"Post","#0A66C2");}
    }));
    liRow.appendChild(makeBtn("With Image","#0A66C2",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Image...";var img=await findSmartImage(caption);showPreviews([img]);
      this.textContent="⏳ Publishing...";
      var r=await publishToLinkedIn(caption,img);SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Posted";successBtn(this);savePostToHistory({caption:caption,platform:"linkedin",type:"image"});}
      else{alert("LinkedIn: "+(r.error||"Error"));failBtn(this,"With Image","#0A66C2");}
    }));
    bar.appendChild(liRow);
  }

  // --- X (TWITTER) ---
  if(platform==="twitter"||platform==="all"){
    var xRow=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
    var xLabel=el("span",{style:{color:"#1DA1F2",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",minWidth:"70px"}});
    xLabel.textContent="𝕏 Twitter";xRow.appendChild(xLabel);
    xRow.appendChild(makeBtn("Tweet","#1DA1F2",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Tweeting...";
      var tweetText=caption.length>280?caption.substring(0,277)+"...":caption;
      var r=await publishToTwitter(tweetText);SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Tweeted";successBtn(this);savePostToHistory({caption:tweetText,platform:"twitter",type:"tweet"});}
      else{alert("X: "+(r.error||"Error"));failBtn(this,"Tweet","#1DA1F2");}
    }));
    xRow.appendChild(makeBtn("With Image","#1DA1F2",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Image...";var img=await findSmartImage(caption);showPreviews([img]);
      this.textContent="⏳ Tweeting...";
      var tweetText=caption.length>280?caption.substring(0,277)+"...":caption;
      var r=await publishToTwitter(tweetText,img);SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Tweeted";successBtn(this);savePostToHistory({caption:tweetText,platform:"twitter",type:"image"});}
      else{alert("X: "+(r.error||"Error"));failBtn(this,"With Image","#1DA1F2");}
    }));
    bar.appendChild(xRow);
  }

  // --- TIKTOK ---
  if(platform==="tiktok"||platform==="all"){
    var ttRow=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
    var ttLabel=el("span",{style:{color:"#FF0050",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",minWidth:"70px"}});
    ttLabel.textContent="🎵 TikTok";ttRow.appendChild(ttLabel);
    ttRow.appendChild(makeBtn("Video","#FF0050",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Uploading...";
      var r=await publishToTikTok(caption,vUrl);SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Posted";successBtn(this);savePostToHistory({caption:caption,platform:"tiktok",type:"video"});}
      else{alert("TikTok: "+(r.error||"Error"));failBtn(this,"Video","#FF0050");}
    }));
    bar.appendChild(ttRow);
  }

  // --- YOUTUBE ---
  if(platform==="youtube"||platform==="all"){
    var ytRow=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
    var ytLabel=el("span",{style:{color:"#FF0000",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",minWidth:"70px"}});
    ytLabel.textContent="▶️ YouTube";ytRow.appendChild(ytLabel);
    ytRow.appendChild(makeBtn("Video","#FF0000",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Uploading...";
      var title=caption.split("\n")[0].substring(0,100)||"Dubai Property | DubAIVal";
      var r=await publishToYouTube(title,caption,vUrl,"public");SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Uploaded";successBtn(this);savePostToHistory({caption:caption,platform:"youtube",type:"video"});if(r.url)alert("✅ Video live: "+r.url);}
      else{alert("YouTube: "+(r.error||"Error"));failBtn(this,"Video","#FF0000");}
    }));
    ytRow.appendChild(makeBtn("Short","#FF0000",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Uploading Short...";
      var title=caption.split("\n")[0].substring(0,80)||"Dubai Property";
      var r=await publishYouTubeShort(title,caption,vUrl);SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Short Up";successBtn(this);savePostToHistory({caption:caption,platform:"youtube",type:"short"});if(r.url)alert("✅ Short live: "+r.url);}
      else{alert("YT Short: "+(r.error||"Error"));failBtn(this,"Short","#FF0000");}
    }));
    ytRow.appendChild(makeBtn("Unlisted","#CC0000",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Uploading...";
      var title=caption.split("\n")[0].substring(0,100)||"Dubai Property Preview";
      var r=await publishToYouTube(title,caption,vUrl,"unlisted");SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="✅ Uploaded";successBtn(this);savePostToHistory({caption:caption,platform:"youtube",type:"unlisted"});if(r.url)alert("✅ Unlisted video: "+r.url);}
      else{alert("YouTube: "+(r.error||"Error"));failBtn(this,"Unlisted","#CC0000");}
    }));
    bar.appendChild(ytRow);
  }

  // --- TOOLS ROW 1: Creation ---
  var toolRow1=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap",paddingTop:"6px",borderTop:"1px solid "+cl.border});
  toolRow1.appendChild(el("span",{style:{color:"#6B7280",fontSize:"9px",fontFamily:"monospace",minWidth:"40px"}},"Create:"));
  var copyBtn=makeBtn("📋 Copy","#9CA3AF",function(){
    navigator.clipboard.writeText(caption).then(function(){
      copyBtn.textContent="✅ Copied";setTimeout(function(){copyBtn.textContent="📋 Copy";},2000);
    });
  });
  toolRow1.appendChild(copyBtn);
  toolRow1.appendChild(makeBtn("🎬 AI Video","#C9A84C",function(){showVideoGenUI(caption);}));
  toolRow1.appendChild(makeBtn("✂️ Edit Video","#EC4899",function(){showVideoEditor();}));
  toolRow1.appendChild(makeBtn("🎨 Design Post","#8B5CF6",function(){showPostDesigner(caption);}));
  toolRow1.appendChild(makeBtn("📱 Story","#8B5CF6",function(){showStoryTemplates();}));
  toolRow1.appendChild(makeBtn("👁 Preview","#6B7280",async function(){
    this.textContent="⏳...";var img=await findSmartImage(caption);showPostPreview(caption,img);this.textContent="👁 Preview";
  }));
  bar.appendChild(toolRow1);

  // --- TOOLS ROW 2: Intelligence ---
  var toolRow2=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
  toolRow2.appendChild(el("span",{style:{color:"#6B7280",fontSize:"9px",fontFamily:"monospace",minWidth:"40px"}},"AI:"));
  toolRow2.appendChild(makeBtn("🧪 A/B Test","#06B6D4",function(){showABTest(caption,platform);}));
  toolRow2.appendChild(makeBtn("#️⃣ Hashtags","#10B981",function(){showHashtagIntelligence(caption);}));
  toolRow2.appendChild(makeBtn("✍️ Rewrite","#EC4899",function(){showCaptionRewriter(caption);}));
  toolRow2.appendChild(makeBtn("😊 Emojis","#F59E0B",function(){showEmojiIntelligence(caption);}));
  toolRow2.appendChild(makeBtn("📏 Optimize","#06B6D4",function(){showCaptionOptimizer(caption);}));
  toolRow2.appendChild(makeBtn("🕵️ Spy","#EF4444",function(){showCompetitorSpy();}));
  bar.appendChild(toolRow2);

  // --- TOOLS ROW 3: Planning ---
  var toolRow3=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
  toolRow3.appendChild(el("span",{style:{color:"#6B7280",fontSize:"9px",fontFamily:"monospace",minWidth:"40px"}},"Plan:"));
  toolRow3.appendChild(makeBtn("📅 Calendar","#3B82F6",function(){showContentCalendar();}));
  toolRow3.appendChild(makeBtn("📦 Bulk 30","#10B981",function(){showBulkGenerator();}));
  toolRow3.appendChild(makeBtn("♻️ Recycle","#F97316",function(){showContentRecycler();}));
  toolRow3.appendChild(makeBtn("🏛️ Pillars","#8B5CF6",function(){showPillarPlanner();}));
  toolRow3.appendChild(makeBtn("🕐 Best Time","#F59E0B",function(){showBestTimeModal(platform);}));
  toolRow3.appendChild(makeBtn("📊 Analytics","#8B5CF6",function(){showPostAnalytics();}));
  toolRow3.appendChild(makeBtn("🔗 Link Bio","#C9A84C",function(){showLinkInBio();}));
  toolRow3.appendChild(makeBtn("💧 Watermark","#C9A84C",function(){showWatermarkSetup();}));
  bar.appendChild(toolRow3);

  // --- TOOLS ROW 4: Settings ---
  var toolRow4=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
  toolRow4.appendChild(el("span",{style:{color:"#6B7280",fontSize:"9px",fontFamily:"monospace",minWidth:"40px"}},"Config:"));
  toolRow4.appendChild(makeBtn("🎨 Brand","#F97316",function(){showBrandingSetup();}));
  toolRow4.appendChild(makeBtn("⚙️ Setup","#FBBF24",function(){showSocialSetup();}));
  bar.appendChild(toolRow4);

  bar.appendChild(videoUrlInput);
  bar.appendChild(imgPreviewWrap);
  return bar;
}

function showSocialSetup(){
  var existing=document.getElementById("social-setup-modal");
  if(existing)existing.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"},id:"social-setup-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #2A3040",borderRadius:"16px",padding:"24px",width:"380px",maxWidth:"90vw",maxHeight:"85vh",overflowY:"auto"});
  var title=el("h3",{style:{color:"#C9A84C",margin:"0 0 16px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}});
  title.textContent="Social Media Setup";
  card.appendChild(title);
  var fields=[
    {key:"dv_ig_token",label:"Page Access Token",ph:"EAATsXN..."},
    {key:"dv_ig_id",label:"Instagram Account ID",ph:"17841416622862972"},
    {key:"dv_fb_id",label:"Facebook Page ID (optional)",ph:"123456789"},
    {key:"dv_unsplash_key",label:"🥇 Unsplash API Key (best quality)",ph:"Free at unsplash.com/developers"},
    {key:"dv_pexels_key",label:"🥈 Pexels API Key",ph:"Free at pexels.com/api"},
    {key:"dv_gemini_key",label:"🥉 Gemini API Key (AI image gen)",ph:"Free at aistudio.google.com/apikey"},
    {key:"dv_elevenlabs_key",label:"🎙 ElevenLabs API Key (premium voiceover)",ph:"Free at elevenlabs.io/app/settings/api-keys"},
    {key:"dv_elevenlabs_voice",label:"ElevenLabs Voice ID (optional)",ph:"Default: Rachel — or paste custom voice ID"},
    {key:"dv_linkedin_token",label:"💼 LinkedIn Access Token",ph:"OAuth2 token from linkedin.com/developers"},
    {key:"dv_linkedin_urn",label:"LinkedIn Person URN",ph:"urn:li:person:XXXXXXXXX"},
    {key:"dv_twitter_bearer",label:"𝕏 Twitter/X Bearer Token",ph:"From developer.twitter.com"},
    {key:"dv_tiktok_token",label:"🎵 TikTok Access Token",ph:"From developers.tiktok.com"},
    {key:"dv_youtube_token",label:"▶️ YouTube OAuth2 Token",ph:"From console.cloud.google.com — YouTube Data API v3"}
  ];
  var inputs=[];
  fields.forEach(function(f){
    var lbl=el("label",{style:{color:"#8899AA",fontSize:"11px",display:"block",marginBottom:"4px",fontFamily:"'Space Grotesk',monospace"}});
    lbl.textContent=f.label;
    var inp=el("input",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px 10px",color:"#E0E0E0",fontSize:"12px",marginBottom:"12px",fontFamily:"monospace",boxSizing:"border-box"},placeholder:f.ph,value:localStorage.getItem(f.key)||""});
    card.appendChild(lbl);card.appendChild(inp);
    inputs.push({key:f.key,inp:inp});
  });
  var btnRow=div({display:"flex",gap:"8px",marginTop:"8px"});
  var saveBtn=el("button",{style:{flex:1,background:"#C9A84C",color:"#000",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:function(){
    inputs.forEach(function(i){if(i.inp.value.trim())localStorage.setItem(i.key,i.inp.value.trim());else localStorage.removeItem(i.key);});
    overlay.remove();
  }});
  saveBtn.textContent="Save";
  var cancelBtn=el("button",{style:{flex:1,background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:function(){overlay.remove();}});
  cancelBtn.textContent="Cancel";
  btnRow.appendChild(saveBtn);btnRow.appendChild(cancelBtn);
  card.appendChild(btnRow);
  overlay.appendChild(card);
  overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
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
  var hdrText=div({flex:"1"});
  hdrText.appendChild(div({color:activeAgent.color,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},activeAgent.name));
  hdrText.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},activeAgent.desc));
  hdr.appendChild(hdrText);

  var newChatBtn=el("button",{style:{
    background:hexAlpha(activeAgent.color,0.1),border:"1px solid "+hexAlpha(activeAgent.color,0.3),
    color:activeAgent.color,padding:"6px 14px",borderRadius:"8px",fontSize:"11px",fontWeight:"600",
    fontFamily:"'Space Grotesk',monospace",cursor:"pointer",whiteSpace:"nowrap",
    display:"flex",alignItems:"center",gap:"4px",transition:"all 0.2s",flexShrink:"0"
  },onclick:function(){
    chatState.agentMsgs[chatState.agentId]=null;
    render(true);
  }});
  newChatBtn.textContent="✨ New";
  hdr.appendChild(newChatBtn);

  if(chatState.agentId==="outreach"){
    var brandBtn=el("button",{style:{
      background:hexAlpha("#F97316",0.1),border:"1px solid "+hexAlpha("#F97316",0.3),
      color:"#F97316",padding:"6px 14px",borderRadius:"8px",fontSize:"11px",fontWeight:"600",
      fontFamily:"'Space Grotesk',monospace",cursor:"pointer",whiteSpace:"nowrap",
      display:"flex",alignItems:"center",gap:"4px",transition:"all 0.2s",flexShrink:"0"
    },onclick:function(){showBrandingSetup();}});
    var bp=getBrandProfile();
    brandBtn.textContent=bp&&bp.name?"🎨 "+bp.name:"🎨 Brand";
    hdr.appendChild(brandBtn);
  }
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
