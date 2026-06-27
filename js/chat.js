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
var GRAPH_BASE="https://graph.facebook.com/v25.0/";

function getSocialCreds(){
  var t=localStorage.getItem("dv_ig_token");
  var ig=localStorage.getItem("dv_ig_id");
  var fb=localStorage.getItem("dv_fb_id");
  if(!t||!ig)return null;
  return{token:t,igId:ig,fbId:fb||"",pexels:localStorage.getItem("dv_pexels_key")||""};
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

function extractImageKeywords(caption){
  var text=caption.toLowerCase();
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

async function generateGeminiImage(query){
  var key=localStorage.getItem("dv_gemini_key");
  if(!key)return null;
  try{
    var prompt="Professional real estate photography of "+query+". High quality, 4K, architectural photography, golden hour lighting, cinematic composition. No text, no watermarks.";
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key="+key,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:["IMAGE","TEXT"],imageMimeType:"image/png"}})
    });
    var d=await r.json();
    if(d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts){
      var parts=d.candidates[0].content.parts;
      for(var i=0;i<parts.length;i++){
        if(parts[i].inlineData&&parts[i].inlineData.data){
          var blob=await fetch("data:"+parts[i].inlineData.mimeType+";base64,"+parts[i].inlineData.data).then(function(r){return r.blob();});
          return URL.createObjectURL(blob);
        }
      }
    }
  }catch(e){console.log("Gemini image error:",e);}
  return null;
}

async function findSmartImage(caption,skipGemini){
  var query=extractImageKeywords(caption);

  var unsplashImg=await searchUnsplash(query);
  if(unsplashImg){console.log("[DubAIVal] Image from Unsplash");return unsplashImg;}

  var pexelsImg=await searchPexels(query);
  if(pexelsImg){console.log("[DubAIVal] Image from Pexels");return pexelsImg;}

  if(!skipGemini){
    var geminiImg=await generateGeminiImage(query);
    if(geminiImg){console.log("[DubAIVal] Image generated by Gemini");return geminiImg;}
  }

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
  console.log("[DubAIVal] Using fallback image");
  return fallbacks[Math.floor(Math.random()*fallbacks.length)];
}

async function publishToInstagram(caption,imageUrl){
  try{
    var c=getSocialCreds();
    if(!c)return{success:false,error:"Social media not configured. Use Setup button to configure."};
    if(!imageUrl)imageUrl=await findSmartImage(caption,true);
    var params=new URLSearchParams({image_url:imageUrl,caption:caption,access_token:c.token});
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
  }catch(e){return{success:false,error:e.message};}
}

async function publishToFacebook(message,link){
  try{
    var c=getSocialCreds();
    if(!c||!c.fbId)return{success:false,error:"Facebook Page ID not configured. Go to Profile to set up."};
    var pr=await fetch(GRAPH_BASE+"me/accounts?access_token="+c.token);
    var pd=await pr.json();
    var pageToken=c.token;
    if(pd.data){var pg=pd.data.find(function(p){return p.id===c.fbId;});if(pg&&pg.access_token)pageToken=pg.access_token;}
    var params=new URLSearchParams({message:message,access_token:pageToken});
    if(link)params.set("link",link);
    var r=await fetch(GRAPH_BASE+c.fbId+"/feed",{method:"POST",body:params});
    var d=await r.json();
    if(d.error)return{success:false,error:d.error.message};
    return{success:true,post_id:d.id};
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

  var imgPreview=null;
  if(platform==="instagram"||platform==="all"){
    var igBtn=makeBtn("Post to Instagram","📸","#E1306C",async function(){
      if(SOCIAL_STATE.publishing)return;
      SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Finding image...";this.style.opacity="0.6";
      var smartImg=await findSmartImage(caption);
      if(imgPreview){imgPreview.src=smartImg;imgPreview.style.display="block";}
      this.textContent="⏳ Publishing...";
      var result=await publishToInstagram(caption,smartImg);
      SOCIAL_STATE.publishing=false;
      if(result.success){this.textContent="✅ Posted!";this.style.background="#10B98133";this.style.color="#10B981";this.style.borderColor="#10B981";}
      else{alert("Instagram Error: "+(result.error||"Unknown"));this.textContent="❌ Failed";this.style.background="#EF444433";this.style.color="#EF4444";setTimeout(function(){this.textContent="📸 Retry Instagram";this.style.background="";this.style.color="#E1306C";}.bind(this),3000);}
    });
    bar.appendChild(igBtn);
  }

  if(platform==="facebook"||platform==="all"){
    bar.appendChild(makeBtn("Post to Facebook","📘","#1877F2",async function(){
      if(SOCIAL_STATE.publishing)return;
      SOCIAL_STATE.publishing=true;
      this.textContent="⏳ Publishing...";this.style.opacity="0.6";
      var result=await publishToFacebook(caption,"https://www.dubaival.com");
      SOCIAL_STATE.publishing=false;
      if(result.success){this.textContent="✅ Posted!";this.style.background="#10B98133";this.style.color="#10B981";this.style.borderColor="#10B981";}
      else{alert("Facebook Error: "+(result.error||"Unknown"));this.textContent="❌ Failed";this.style.background="#EF444433";this.style.color="#EF4444";setTimeout(function(){this.textContent="📘 Retry Facebook";this.style.background="";this.style.color="#1877F2";}.bind(this),3000);}
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

  bar.appendChild(makeBtn("Setup","⚙️","#FBBF24",function(){showSocialSetup();}));

  imgPreview=el("img",{style:{width:"100%",maxHeight:"200px",objectFit:"cover",borderRadius:"8px",marginTop:"8px",display:"none",border:"1px solid "+cl.border}});
  var previewWrap=div({width:"100%"});
  previewWrap.appendChild(imgPreview);
  bar.appendChild(previewWrap);

  return bar;
}

function showSocialSetup(){
  var existing=document.getElementById("social-setup-modal");
  if(existing)existing.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"},id:"social-setup-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #2A3040",borderRadius:"16px",padding:"24px",width:"380px",maxWidth:"90vw"});
  var title=el("h3",{style:{color:"#C9A84C",margin:"0 0 16px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}});
  title.textContent="Social Media Setup";
  card.appendChild(title);
  var fields=[
    {key:"dv_ig_token",label:"Page Access Token",ph:"EAATsXN..."},
    {key:"dv_ig_id",label:"Instagram Account ID",ph:"17841416622862972"},
    {key:"dv_fb_id",label:"Facebook Page ID (optional)",ph:"123456789"},
    {key:"dv_unsplash_key",label:"🥇 Unsplash API Key (best quality)",ph:"Free at unsplash.com/developers"},
    {key:"dv_pexels_key",label:"🥈 Pexels API Key",ph:"Free at pexels.com/api"},
    {key:"dv_gemini_key",label:"🥉 Gemini API Key (AI image gen)",ph:"Free at aistudio.google.com/apikey"}
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
