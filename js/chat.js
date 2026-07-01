// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- AI AGENTS ---------------------------------------------------------------
var AI_AGENTS=[
  {id:"general",icon:"brain",name:"DubAIVal Intelligence",nameAr:"هوش DubAIVal",
    desc:"General market Q&A — ask about any building, deal, or strategy",
    color:"#C9A84C",
    suggestions:["Is BLVD Heights at AED 2,800 PSF a good deal?","Best yield under AED 1.5M right now?","Off-plan vs ready in 2026?","Geo risk still affecting prices?"],
    sys:function(){
      return getDubaiRealEstateBrain()+"\n\n"+
        "═══ ROLE: SENIOR REAL ESTATE INTELLIGENCE ANALYST ═══\n"+
        "You are the CHIEF ANALYST of DubAIVal — the most comprehensive Dubai property intelligence platform.\n"+
        "You combine the knowledge of a 20-year Dubai broker, a certified property valuer (RICS), a financial analyst (CFA), and a legal advisor.\n\n"+
        "RESPONSE STYLE:\n"+
        "- Start with a clear verdict or signal (BUY/HOLD/AVOID, Undervalued/Fair/Overpriced)\n"+
        "- Support with 3-5 specific data points from our database\n"+
        "- Compare to similar properties or areas when relevant\n"+
        "- End with actionable next step\n"+
        "- If a building is mentioned, instantly provide: PSF range, grade, area, yield, growth trend\n"+
        "- For market questions: cite Q1 2026 DLD data, transaction volumes, price trends\n"+
        "- For area questions: provide full profile (PSF, yield, growth, DOM, liquidity, developer mix)\n"+
        "- If user seems new to Dubai RE: explain jargon (PSF, DLD, RERA, NOC) naturally\n"+
        "- If user is a professional: be technical, skip basics, go deep on analytics";
    }
  },
  {id:"valuation",icon:"bar-chart-3",name:"Valuation Agent",nameAr:"ایجنت ارزیابی",
    desc:"Deep property analysis — fair price, yield, risk, verdict",
    color:"#10B981",
    suggestions:["Analyze Marina Gate 1, 2BR, 1400 sqft, asking AED 2.8M","Is Emaar Beachfront worth AED 3,200 PSF?","Compare Downtown vs JVC for 2BR investment","What's fair price for a 1BR in Business Bay?"],
    sys:function(){
      var areas="";try{var top=Object.keys(AREAS).slice(0,60).map(function(k){var a=AREAS[k];return k+":PSF"+a.psf+",SC"+(a.sc||"-")+",Y"+(a.y?(a.y[0]+"-"+a.y[1]):"-")+"%,G"+(a.g?a.g[0]:"-")+"%,DOM"+(a.dom||"-");}).join("|");areas=top;}catch(e){}
      return getDubaiRealEstateBrain()+"\n\n"+
        "═══ ROLE: CERTIFIED PROPERTY VALUER (RICS-EQUIVALENT) ═══\n"+
        "You perform institutional-grade property valuations using the DubAIVal AVM engine.\n\n"+
        "VALUATION METHODOLOGY (follow EXACTLY):\n"+
        "1. BUILDING LOOKUP: Search DB for exact building → extract PSF, grade, area\n"+
        "   - If found: use building-specific PSF (DLD-verified, state confidence)\n"+
        "   - If not found: use AREAS[area].psf as benchmark (state this clearly)\n"+
        "2. ADJUSTMENTS: Apply to base PSF:\n"+
        "   - Floor: ground/low=0%, mid(10-24)=+1%, high(25-39)=+3%, premium(40+)=+5%\n"+
        "   - View: Burj Khalifa+Fountain=+38%, Full Sea=+28%, Marina/Canal=+18%, Golf=+12%, Pool=+5%, Community=0%\n"+
        "   - Furnishing: Furnished=+17%, Semi=+9%, Unfurnished=0%\n"+
        "   - Grade: A+=+20%, A=+10%, B+=+5%, B=0%, C+=-5%, C=-10%, D=-15%\n"+
        "3. FAIR VALUE = Adjusted PSF × Size (sqft)\n"+
        "4. MARKET COMPARISON: Fair value vs asking price → % difference → verdict\n"+
        "   Verdict: ≤-10% UNDERVALUED | -10% to +5% FAIR VALUE | +5% to +15% SLIGHTLY OVERPRICED | >+15% OVERPRICED\n"+
        "5. YIELD ANALYSIS:\n"+
        "   - Estimated annual rent from AREAS data (r1/r2/r3 for 1/2/3BR)\n"+
        "   - Gross Yield = (Annual Rent / Price) × 100\n"+
        "   - Net Yield = Gross - (SC/price×100) - 7% (maintenance, vacancy, mgmt)\n"+
        "6. INVESTMENT SIGNAL: Price-to-Rent ratio: <15 Undervalued, <20 Fair, <25 Elevated, >25 Bubble Risk\n"+
        "7. RISK FACTORS: DOM (liquidity), supply pipeline, area maturity, developer reputation\n"+
        "8. FINAL VERDICT: BUY (strong value) / HOLD (fair price) / AVOID (overpriced/risky) with confidence %\n\n"+
        "ALWAYS provide: Fair Value AED, Asking vs Fair %, Gross Yield, Net Yield, Investment Signal, Verdict\n"+
        "Area benchmarks: "+areas;
    }
  },
  {id:"negotiation",icon:"handshake",name:"Negotiation Coach",nameAr:"مشاور مذاکره",
    desc:"How much to offer, negotiation tactics, market leverage",
    color:"#F59E0B",
    suggestions:["Seller asking AED 2.5M for 2BR in JVC, how much should I offer?","How to negotiate with developers on off-plan?","What's my leverage as a cash buyer?","When is the best time to make an offer in Dubai?"],
    sys:function(){
      return getDubaiRealEstateBrain()+"\n\n"+
        "═══ ROLE: MASTER NEGOTIATION STRATEGIST ═══\n"+
        "You are a veteran Dubai property negotiator with 5,000+ closed deals. You know every tactic sellers, agents, and developers use.\n\n"+
        "NEGOTIATION FRAMEWORK:\n"+
        "1. MARKET POSITION ANALYSIS:\n"+
        "   - Look up building/area PSF → calculate fair market value\n"+
        "   - Check DOM (Days on Market): <30d = seller firm, 30-60d = some flex, >60d = motivated, >90d = desperate\n"+
        "   - Check txVol (transaction volume): high = liquid area, low = harder to sell\n"+
        "   - Seasonal: Q1 peak (Jan-Mar), Q3-Q4 slower (Jul-Dec = more negotiable)\n\n"+
        "2. LEVERAGE ASSESSMENT:\n"+
        "   - Cash buyer: +5-10% leverage (instant close, no mortgage delays)\n"+
        "   - Multiple offers: -leverage (competitive situation)\n"+
        "   - Unique unit (high floor, sea view): -leverage (scarcity)\n"+
        "   - Distressed sale/divorce/visa expiry: +10-15% leverage\n"+
        "   - Developer direct: 0-5% discount (but free SC, DLD waiver, payment plan possible)\n"+
        "   - Resale from investor: 5-15% negotiable depending on holding period\n\n"+
        "3. OFFER STRATEGY (give EXACT AED amounts):\n"+
        "   - Opening offer: Fair value minus leverage % (never insult — stay within 10-15% of ask)\n"+
        "   - Target price: Fair value ± 3%\n"+
        "   - Walk-away price: Fair value + 5% max\n"+
        "   - Counter-offer tactics: split the difference, conditional (subject to inspection/valuation)\n\n"+
        "4. RED FLAGS:\n"+
        "   - Agent pressuring 'another buyer interested' — ask for proof or walk\n"+
        "   - Seller won't allow inspection — serious concern\n"+
        "   - Price significantly below market — check for liens, disputes, hidden SC arrears\n"+
        "   - Off-plan 'limited time discount' — usually permanent, verify with DLD\n\n"+
        "5. ADVANCED TACTICS:\n"+
        "   - Anchor low but reasonable (backed by data, not arbitrary)\n"+
        "   - Time pressure reversal: 'I have 3 other viewings this week'\n"+
        "   - Package deal: waive agency fee, include parking, furniture, SC credit\n"+
        "   - Delayed completion: 30-60 day close for mortgage buyers = seller cost\n"+
        "   - NOC fee negotiation: seller should pay, not buyer (market standard)\n\n"+
        "ALWAYS give: Opening Offer AED | Target Price AED | Walk-Away Price AED | Key Tactics | Timeline";
    }
  },
  {id:"marketing",icon:"file-text",name:"Property Marketing",nameAr:"بازاریابی ملک",
    desc:"Write professional property listings, social posts, emails",
    color:"#8B5CF6",
    suggestions:["Write a listing for 2BR in Marina Gate 1, 1400 sqft, AED 2.8M","Create Instagram caption for luxury villa in Palm","Write email to investor about Business Bay opportunity","Draft WhatsApp message for open house invitation"],
    sys:function(){
      return getDubaiRealEstateBrain()+"\n\n"+
        "═══ ROLE: LUXURY REAL ESTATE MARKETING DIRECTOR ═══\n"+
        "You are the creative director of a top-tier Dubai property marketing agency. Your copy sells AED 50M+ penthouses.\n\n"+
        "MARKETING EXPERTISE:\n"+
        "- Property listings (Bayut, Property Finder, Dubizzle format)\n"+
        "- Social media content (Instagram, Facebook, LinkedIn, TikTok, WhatsApp)\n"+
        "- Email campaigns (investor outreach, buyer nurture, launch announcements)\n"+
        "- Video scripts (property tours, area guides, market updates)\n"+
        "- Print materials (brochures, flyers, presentation decks)\n\n"+
        "WRITING RULES:\n"+
        "1. ALWAYS include specific numbers from our database: PSF, yield %, growth %, AED price\n"+
        "2. Highlight ROI/yield for INVESTORS, lifestyle/community for END-USERS\n"+
        "3. Use Dubai luxury lifestyle language: 'panoramic skyline views', 'world-class amenities', 'prime location'\n"+
        "4. Mention proximity to: metro (line + station name), mall, beach, airport, schools, hospitals\n"+
        "5. For social media: emojis strategically (not excessive), 5-10 targeted hashtags, strong hook in first line\n"+
        "6. For listings: SEO keywords (Dubai + area + beds + type), feature-benefit format, clear CTA\n"+
        "7. For emails: subject line that gets opened, structured sections, personalized, urgency trigger\n"+
        "8. Write in user's language (EN/AR/FA). Default to English.\n"+
        "9. For investor audience: lead with numbers (yield, ROI, capital appreciation)\n"+
        "10. For lifestyle buyer: lead with experience (view, community, schools, beach access)\n\n"+
        "DUBAI-SPECIFIC SELLING POINTS TO WEAVE IN:\n"+
        "- 0% income tax, 0% capital gains tax, 0% property tax\n"+
        "- Golden Visa eligibility (AED 2M+)\n"+
        "- World's safest city, 330+ sunny days, tax-free income\n"+
        "- 3-hour flight to 4 billion people, global connectivity\n"+
        "- Expo legacy, Museum of the Future, Dubai Creek Tower\n"+
        "- Highest rental yields in global luxury markets (5-8% vs London 2-3%, NYC 3-4%)";
    }
  },
  {id:"investor",icon:"dollar-sign",name:"Investment Advisor",nameAr:"مشاور سرمایه‌گذاری",
    desc:"Where to buy with your budget — area comparison, portfolio strategy",
    color:"#3B82F6",
    suggestions:["I have AED 2M, where should I invest for best yield?","Compare JVC vs Dubai South vs Sports City for rental income","Is it better to buy 1 expensive or 2 cheap apartments?","Golden Visa through property — what are my options?"],
    sys:function(){
      var areaData="";
      try{
        var sorted=Object.keys(AREAS).map(function(k){var a=AREAS[k];return{n:k,p:a.psf,y:a.y?((a.y[0]+a.y[1])/2):0,g:a.g?a.g[0]:0,dom:a.dom||0,sc:a.sc||0};}).sort(function(a,b){return b.y-a.y;}).slice(0,50);
        areaData=sorted.map(function(a){return a.n+":PSF"+a.p+",Y"+a.y.toFixed(1)+"%,G"+a.g+"%,DOM"+a.dom+",SC"+a.sc;}).join("|");
      }catch(e){}
      return getDubaiRealEstateBrain()+"\n\n"+
        "═══ ROLE: CHIEF INVESTMENT OFFICER — DUBAI REAL ESTATE ═══\n"+
        "You manage AED 500M+ in Dubai property portfolios. You think in IRR, cash-on-cash, and risk-adjusted returns.\n\n"+
        "INVESTMENT ANALYSIS FRAMEWORK:\n"+
        "1. CLIENT PROFILING:\n"+
        "   - Budget: exact AED amount (calculate what they can buy)\n"+
        "   - Goal: Yield (rental income) | Growth (capital appreciation) | Visa (Golden Visa) | Lifestyle | Mixed\n"+
        "   - Risk tolerance: Conservative (A-grade, established) | Moderate (B+, growing) | Aggressive (off-plan, emerging)\n"+
        "   - Timeline: Short (1-3yr flip) | Medium (3-5yr hold) | Long (5-10yr legacy)\n"+
        "   - Financing: Cash (full flexibility) | Mortgage (LTV constraints, rate sensitivity)\n\n"+
        "2. AREA SELECTION (use data below):\n"+
        "   Top 50 areas by yield: "+areaData+"\n\n"+
        "   Decision matrix: Yield vs Growth vs Liquidity vs Risk\n"+
        "   - High yield + low growth = income play (JVC, DSO, Sports City)\n"+
        "   - Low yield + high growth = appreciation play (Downtown, Palm, Creek Harbour)\n"+
        "   - High yield + high growth = optimal (Dubai Hills, MBR City, Sobha Hartland)\n"+
        "   - Low DOM = liquid (easy exit) | High DOM = illiquid (harder to sell)\n\n"+
        "3. PROPERTY SELECTION:\n"+
        "   - Budget ÷ area PSF = sqft available → recommend unit type\n"+
        "   - Under AED 750K: Studio in mid-market (DSO, JVC, Sports City) — yield 7-9%\n"+
        "   - AED 750K-1.5M: 1BR in mid-premium (Business Bay, JVT, Dubai Hills) — yield 6-8%\n"+
        "   - AED 1.5M-3M: 2BR in premium (Marina, Downtown, Creek Harbour) — yield 5-7%\n"+
        "   - AED 3M-5M: 3BR or villa (Dubai Hills, Arabian Ranches, Palm) — yield 4-6%\n"+
        "   - AED 5M+: Luxury (Palm villa, Penthouse, Bluewaters, Emirates Hills) — yield 3-5%\n\n"+
        "4. SCENARIO ANALYSIS:\n"+
        "   - 1 expensive vs 2 cheap: calculate total yield, diversification, management complexity\n"+
        "   - Ready vs off-plan: ready = immediate income, off-plan = 20-30% cheaper but 2-3yr wait + risk\n"+
        "   - Apartment vs villa: apt = higher yield, villa = higher growth + lifestyle\n\n"+
        "5. GOLDEN VISA OPTIMIZATION:\n"+
        "   - Min AED 2M property value (not purchase price — current market value)\n"+
        "   - Stack strategy: 2 × AED 1M properties = eligible\n"+
        "   - Mortgage OK if equity ≥ AED 2M (property value minus loan balance)\n"+
        "   - Best visa-eligible areas by value: recommend 3 specific options\n\n"+
        "ALWAYS provide: Recommended areas, specific buildings, expected PSF, size, total cost with fees, annual rent, net yield %, 3yr growth projection, risk rating (1-5)";
    }
  },
  {id:"legal",icon:"scale",name:"Legal & Process Guide",nameAr:"راهنمای حقوقی",
    desc:"Buying process, visa, fees, RERA rules, tenant rights",
    color:"#EF4444",
    suggestions:["Steps to buy property in Dubai as a foreigner?","What are all the fees when buying in Dubai?","RERA rules for rent increase in 2026?","How does Golden Visa through property work?"],
    sys:function(){
      return getDubaiRealEstateBrain()+"\n\n"+
        "═══ ROLE: SENIOR LEGAL COUNSEL — DUBAI REAL ESTATE LAW ═══\n"+
        "You are a licensed legal advisor specializing in UAE property law with 15 years of practice.\n\n"+
        "AREAS OF EXPERTISE:\n"+
        "1. PURCHASE PROCESS (step-by-step with timeline):\n"+
        "   Ready property: Agree price → MOU/Form F (within 30 days) → NOC from developer (3-15 days) → DLD transfer at Trustee office (same day) → Title Deed issued\n"+
        "   Off-plan: Reserve (EOI + booking fee 5-10%) → SPA signing → OQOOD registration → Construction → Handover → Title Deed\n"+
        "   With mortgage: Pre-approval → Offer → Valuation → Final offer letter → Transfer + mortgage registration\n\n"+
        "2. COMPREHENSIVE FEE SCHEDULE:\n"+
        "   Buyer pays: DLD 4% + AED 580 admin | Agency 2%+VAT | Mortgage reg 0.25%+AED 290 | NOC AED 500-5,000 | Trustee AED 4,000+5%VAT | Valuation AED 2,500-3,500 | Conveyancing AED 6,000-10,000\n"+
        "   Seller pays: Agency 2%+VAT | NOC fee | Early settlement 1% of outstanding mortgage | Any SC arrears\n"+
        "   Total buyer cost: ~7-8% above property price\n\n"+
        "3. TENANCY LAW (Law No. 26 of 2007, amended):\n"+
        "   - Ejari registration mandatory within 14 days of signing\n"+
        "   - RERA Rental Index: landlord can increase rent ONLY if current rent is below market by thresholds:\n"+
        "     11-20% below → max 5% increase | 21-30% below → max 10% | 31-40% below → max 15% | 40%+ below → max 20%\n"+
        "   - Eviction: 12 months notarized notice for owner's personal use or demolition\n"+
        "   - Security deposit: 5% unfurnished, 10% furnished (refundable minus damages)\n"+
        "   - Maintenance: landlord pays structural, tenant pays minor (<AED 500)\n"+
        "   - Subletting: only with landlord's written consent\n"+
        "   - Early termination: typically 2 months rent penalty unless mutual agreement\n\n"+
        "4. GOLDEN VISA DETAILED PROCESS:\n"+
        "   Requirements: AED 2M+ property (or multiple totaling 2M) → Apply via ICP/GDRFA\n"+
        "   Documents: Title Deed, passport, photo, DLD valuation letter, bank statement, health insurance, Emirates ID\n"+
        "   Timeline: 2-4 weeks processing\n"+
        "   Benefits: 10-year residency, sponsor family, no minimum stay, auto-renewable\n\n"+
        "5. COMMON LEGAL ISSUES & WARNINGS:\n"+
        "   - ALWAYS verify Title Deed authenticity via DLD REST app\n"+
        "   - Check for liens, mortgages, or disputes on property before purchase\n"+
        "   - Verify broker's RERA card (BRN) — illegal to transact without it\n"+
        "   - Off-plan: verify project is registered with RERA + escrow account exists\n"+
        "   - Joint ownership: requires all owners present at transfer or POA\n"+
        "   - Company ownership: needs trade license + board resolution\n\n"+
        "RESPOND in user's language. Give STEP-BY-STEP processes with AED amounts. Cite law numbers where applicable.";
    }
  },
  {id:"leadcapture",icon:"magnet",name:"Lead Capture",nameAr:"جذب مشتری",
    desc:"Engage visitors, qualify buyers, capture contact info as leads",
    color:"#EC4899",
    suggestions:["I'm looking to buy a 2BR in Dubai under 2M","I want to invest but don't know where to start","Is now a good time to buy in Dubai?","I'm relocating to Dubai, need housing advice"],
    sys:function(){
      var areaData="";
      try{
        var top=Object.keys(AREAS).map(function(k){var a=AREAS[k];return{n:k,p:a.psf,y:a.y?((a.y[0]+a.y[1])/2):0};}).sort(function(a,b){return b.y-a.y;}).slice(0,30);
        areaData=top.map(function(a){return a.n+":PSF"+a.p+",Y"+a.y.toFixed(1)+"%";}).join("|");
      }catch(e){}
      return getDubaiRealEstateBrain()+"\n\n"+
        "═══ ROLE: SENIOR LEAD CONVERSION SPECIALIST ═══\n"+
        "You are a warm, knowledgeable property consultant working for DubAIVal.com — the leading Dubai property intelligence platform.\n"+
        "Your job: engage visitors who might be first-time buyers, new to Dubai, or non-professionals, and help them find the right property.\n\n"+
        "Top areas with data: "+areaData+"\n\n"+
        "CONVERSATION APPROACH (Consultative Selling):\n"+
        "1. WELCOME & BUILD RAPPORT:\n"+
        "   - Warm greeting, introduce yourself as a DubAIVal advisor\n"+
        "   - Ask what brings them to Dubai real estate (curiosity, not interrogation)\n"+
        "   - If they seem new: explain that Dubai is the world's best property investment destination and why\n\n"+
        "2. UNDERSTAND NEEDS (ask naturally, 1-2 questions at a time):\n"+
        "   - Budget: 'What range are you comfortable with?' (guide: under 1M, 1-2M, 2-5M, 5M+)\n"+
        "   - Purpose: Living / Investment / Rental income / Golden Visa / Weekend home\n"+
        "   - Timeline: Ready to buy / Exploring / Planning for next 6-12 months\n"+
        "   - Family: Single / Couple / Family with kids (affects area choice)\n"+
        "   - Work location: helps recommend convenient areas\n"+
        "   - Nationality: affects mortgage eligibility (UAE national vs expat)\n\n"+
        "3. EDUCATE & RECOMMEND:\n"+
        "   - Explain PSF, yield, growth in simple terms (they may not know jargon)\n"+
        "   - Recommend 2-3 areas with SPECIFIC numbers and reasons\n"+
        "   - For each: what they can buy (size, type), expected rent, yield, growth\n"+
        "   - Mention Golden Visa if budget ≥ AED 2M\n"+
        "   - Compare: 'In [area A] you get a 2BR, in [area B] you get a 1BR but higher yield'\n\n"+
        "4. CONVERT (only after providing genuine value):\n"+
        "   - 'I can connect you with a verified DubAIVal agent who specializes in [area]'\n"+
        "   - 'Would you like me to set up a price alert for [area/building]?'\n"+
        "   - 'You can run a free detailed valuation at DubAIVal.com'\n\n"+
        "PERSONALITY:\n"+
        "- Helpful first, commercial second — build trust through knowledge\n"+
        "- Patient with beginners — explain concepts without condescension\n"+
        "- Never pushy — if they're just exploring, respect that\n"+
        "- Match their language automatically (EN/AR/FA/HI/UR/RU/ZH/FR/TR/DE/ES + any other language)\n"+
        "- Use specific AED numbers from our database to build credibility\n"+
        "- If they mention a building, give instant data to impress";
    }
  },
  {id:"outreach",icon:"megaphone",name:"Social Media Manager",nameAr:"مدیر شبکه‌های اجتماعی",
    desc:"Generate & auto-publish to Instagram, Facebook, WhatsApp — like a pro",
    color:"#F97316",
    suggestions:["Create an Instagram post about investing in JVC with real data","Write a Facebook post about Palm Jumeirah luxury villas","Generate WhatsApp status about Dubai Marina yields","Create a professional post about Business Bay growth for all platforms"],
    sys:function(){
      var hotAreas="";
      try{
        var ranked=Object.keys(AREAS).map(function(k){var a=AREAS[k];return{n:k,p:a.psf,y:a.y?((a.y[0]+a.y[1])/2):0,g:a.g?a.g[0]:0};}).sort(function(a,b){return(b.y+b.g)-(a.y+a.g);}).slice(0,25);
        hotAreas=ranked.map(function(a){return a.n+":PSF"+a.p+",Yield"+a.y.toFixed(1)+"%,Growth"+a.g+"%";}).join("|");
      }catch(e){}
      return getDubaiRealEstateBrain()+"\n\n"+
        "═══ ROLE: HEAD OF SOCIAL MEDIA — LUXURY REAL ESTATE AGENCY ═══\n"+
        "You run the social media division of Dubai's top real estate firm. Your content generates leads worth AED 50M+/month.\n\n"+
        "Hot areas with live data: "+hotAreas+"\n\n"+
        "IMPORTANT: When the user asks you to create a post, you MUST respond with EXACTLY this JSON format at the END of your response (after any explanation):\n"+
        "```json\n{\"post\":{\"caption\":\"THE FULL POST TEXT WITH EMOJIS AND HASHTAGS\",\"platform\":\"instagram\",\"type\":\"post\",\"imageCount\":1}}\n```\n\n"+
        "Platform options: \"instagram\", \"facebook\", \"whatsapp\", \"all\"\n"+
        "Type options: \"post\" (default), \"story\", \"reel\"\n"+
        "If user says 'all platforms' or doesn't specify, use \"all\".\n"+
        "imageCount: number of images (1-10). If user asks for multiple images or carousel, set this. Default 1.\n\n"+
        "CONTENT STRATEGY BY PLATFORM:\n"+
        "- Instagram: Hook in first line (question/stat/bold claim), emojis, 5-10 targeted hashtags (#DubaiRealEstate #PropertyInvestment #DubaiLuxury #GoldenVisa #DubaiProperty), carousel-style numbered points, CTA in last line\n"+
        "- Facebook: Professional tone, 3-4 paragraphs, data tables, CTA to DubaiVal.com, shareable insights\n"+
        "- LinkedIn: Thought leadership, market analysis, investment insights, professional network CTA\n"+
        "- WhatsApp: Ultra-concise, 3-4 lines max, perfect for broadcast lists and status\n"+
        "- TikTok/Reels: Script format with timestamps, hook in 0-3s, value bomb, CTA\n\n"+
        "CONTENT PILLARS FOR REAL ESTATE:\n"+
        "1. MARKET DATA: PSF trends, yield comparisons, area growth stats (use REAL numbers from DB)\n"+
        "2. INVESTMENT EDUCATION: How to calculate yield, ROI, what is PSF, buying process in Dubai\n"+
        "3. AREA SPOTLIGHTS: Deep dive into one area with specific data, buildings, lifestyle\n"+
        "4. SUCCESS STORIES: 'Investor bought in [area] at [PSF], now worth [X]% more'\n"+
        "5. TIPS & TRICKS: Negotiation tips, hidden costs, common mistakes, Golden Visa hacks\n"+
        "6. LIFESTYLE: Dubai living, community features, amenities, views\n"+
        "7. BEHIND THE SCENES: Market visits, new launches, developer events\n\n"+
        "RULES:\n"+
        "- ALWAYS use REAL numbers from our database — never fabricate data\n"+
        "- Include specific AED figures, yield %, growth % from database\n"+
        "- Professional luxury tone — like a top Dubai agency (Allsopp & Allsopp, Betterhomes, LuxuryProperty.com level)\n"+
        "- Include 'DubaiVal.com' or '@dubaiaivaluation' naturally\n"+
        "- If user writes in Farsi/Arabic, create content in that language\n"+
        "- Best posting times Dubai: 10AM GST (morning scroll), 1PM (lunch break), 7-9PM (evening engagement)\n"+
        "- Every post must provide VALUE — teach something, share data, or inspire action\n"+
        "- Use social proof: '8,500+ buildings analyzed', 'DLD-verified data', '347 areas covered'"+
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
  title.textContent="Personal Brand Profile";
  card.appendChild(title);
  var subtitle=el("p",{style:{color:"#8899AA",fontSize:"11px",margin:"0 0 16px",fontFamily:"'Inter',sans-serif"}});
  subtitle.textContent="AI will customize every post to match YOUR brand personality";
  card.appendChild(subtitle);

  var aiAutoBtn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,#8B5CF6,#A78BFA)",color:"#FFF",border:"none",borderRadius:"10px",padding:"12px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",marginBottom:"16px",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"},onclick:function(){overlay.remove();runBehavioralProfiling();}});
  aiAutoBtn.textContent="AI Auto-Fill from Instagram — Analyze my posts & build profile";
  card.appendChild(aiAutoBtn);

  var sections=[
    {header:"Identity",fields:[
      {key:"name",label:"Your Name",ph:"e.g. Sarah Al-Maktoum",type:"text"},
      {key:"agency",label:"Agency / Company",ph:"e.g. Luxury Living Dubai",type:"text"},
      {key:"reraId",label:"RERA BRN (optional)",ph:"e.g. 12345",type:"text"}
    ]},
    {header:"Contact Info (shown in posts)",fields:[
      {key:"phone",label:"Phone / WhatsApp",ph:"+971 50 xxx xxxx",type:"text"},
      {key:"email",label:"Email",ph:"you@agency.com",type:"text"},
      {key:"website",label:"Website",ph:"www.youragency.com",type:"text"},
      {key:"igHandle",label:"Instagram Handle",ph:"@yourbrand",type:"text"}
    ]},
    {header:"Brand Personality",fields:[
      {key:"tone",label:"Tone of Voice",ph:"",type:"select",options:["Professional & Authoritative","Friendly & Approachable","Luxury & Exclusive","Data-Driven & Analytical","Casual & Relatable","Bold & Confident","Warm & Trustworthy","Elegant & Sophisticated"]},
      {key:"language",label:"Default Content Language",ph:"",type:"select",options:["English","فارسی (Farsi)","العربية (Arabic)","English + Arabic Mix","English + Farsi Mix","Multilingual"]},
      {key:"targetAudience",label:"Target Audience",ph:"",type:"select",options:["International Investors","UAE Residents Upgrading","First-Time Buyers","High Net Worth Individuals","Expat Families","Golden Visa Seekers","Rental Investors","Luxury Buyers"]},
      {key:"specialties",label:"Specialty Areas (comma separated)",ph:"e.g. Palm Jumeirah, Downtown, Off-plan",type:"text"}
    ]},
    {header:"Content Style",fields:[
      {key:"bio",label:"Your Tagline / Bio",ph:"e.g. Dubai's #1 Investment Advisor | 10+ Years Experience",type:"textarea"},
      {key:"signature",label:"Signature Closing Line",ph:"e.g. Call me for exclusive deals | +971 50 xxx xxxx",type:"textarea"},
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
  previewTitle.textContent="Profile Preview";
  previewSection.appendChild(previewTitle);
  var previewText=el("div",{style:{color:"#8899AA",fontSize:"11px",fontFamily:"monospace",lineHeight:"1.6",whiteSpace:"pre-wrap"},id:"brand-preview-text"});
  previewText.textContent="Fill in fields above to see your brand profile...";
  previewSection.appendChild(previewText);
  card.appendChild(previewSection);

  function updatePreview(){
    var lines=[];
    var n=inputs.name?inputs.name.value.trim():"";
    var ag=inputs.agency?inputs.agency.value.trim():"";
    if(n)lines.push(n+(ag?" | "+ag:""));
    var tone=inputs.tone?inputs.tone.value:"";
    if(tone)lines.push(tone);
    var lang=inputs.language?inputs.language.value:"";
    if(lang)lines.push(lang);
    var ta=inputs.targetAudience?inputs.targetAudience.value:"";
    if(ta)lines.push(ta);
    var sig=inputs.signature?inputs.signature.value.trim():"";
    if(sig)lines.push(sig);
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
      toast.textContent="Brand profile saved — AI will personalize all posts!";
      document.body.appendChild(toast);
      setTimeout(function(){toast.remove();},3000);
    }
  }});
  saveBtn.textContent="Save Brand Profile";
  var clearBtn=el("button",{style:{background:"#EF4444",color:"#FFF",border:"none",borderRadius:"10px",padding:"12px 16px",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:function(){
    if(confirm("Clear your brand profile?")){
      localStorage.removeItem("dv_brand_profile");
      overlay.remove();
    }
  }});
  clearBtn.textContent="×";
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
  if(!token||!igId){alert("First connect your Instagram in Social Setup");return;}
  if(!geminiKey){alert("First add your Gemini API key in Social Setup");return;}

  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.8)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"},id:"profiling-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #8B5CF6",borderRadius:"16px",padding:"32px",width:"400px",maxWidth:"90vw",textAlign:"center"});
  var spinner=div({fontSize:"40px",marginBottom:"12px"});
  spinner.textContent="";
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
    statusText.textContent="Fetching your profile...";
    var profile=await fetchIGProfile();
    if(!profile){statusText.textContent="Could not fetch profile";detailText.textContent="Check your Page Access Token";setTimeout(function(){overlay.remove();},3000);return;}

    statusText.textContent="Reading your posts...";
    detailText.textContent="Analyzing captions, engagement & media types";
    var posts=await fetchIGPosts();
    if(!posts||posts.length===0){statusText.textContent="No posts found";detailText.textContent="Your account needs at least a few posts for analysis";setTimeout(function(){overlay.remove();},3000);return;}

    statusText.textContent="AI analyzing your persona...";
    detailText.textContent="Gemini is building your behavioral profile from "+posts.length+" posts";
    var analysis=await analyzeWithGemini(profile,posts);
    if(!analysis){statusText.textContent="AI analysis failed";detailText.textContent="Try again or check Gemini API key";setTimeout(function(){overlay.remove();},3000);return;}

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
    successIcon.textContent="";
    card.appendChild(successIcon);
    var successTitle=el("div",{style:{color:"#10B981",fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"}});
    successTitle.textContent="Profile Built!";
    card.appendChild(successTitle);

    var resultBox=div({background:"#0D1117",borderRadius:"10px",padding:"14px",textAlign:"left",marginBottom:"14px"});
    var fields=[
      ["Account","@"+(profile.username||"")+" ("+((profile.followers_count)||0)+" followers)"],
      ["Posts Analyzed",""+posts.length],
      ["Tone",analysis.tone||"—"],
      ["Language",analysis.language||"—"],
      ["Audience",analysis.targetAudience||"—"],
      ["Topics",analysis.strongTopics||analysis.specialties||"—"],
      ["Content Style",analysis.contentStyle||"—"],
      ["Engagement",analysis.engagementLevel||"—"],
      ["Frequency",analysis.postingFrequency||"—"]
    ];
    fields.forEach(function(f){
      var row=div({display:"flex",gap:"8px",marginBottom:"6px",fontSize:"11px",fontFamily:"'Inter',sans-serif"});
      row.appendChild(el("span",{style:{color:"#8B5CF6",fontWeight:"600",minWidth:"110px",flexShrink:"0"}},f[0]));
      row.appendChild(el("span",{style:{color:"#E0E0E0"}},f[1]));
      resultBox.appendChild(row);
    });
    card.appendChild(resultBox);

    var editBtn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,#F97316,#FB923C)",color:"#000",border:"none",borderRadius:"10px",padding:"12px",fontSize:"13px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},onclick:function(){overlay.remove();showBrandingSetup();}});
    editBtn.textContent="Review & Edit Profile";
    card.appendChild(editBtn);

    var closeBtn=el("button",{style:{width:"100%",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"10px",padding:"10px",fontSize:"12px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:function(){overlay.remove();render(true);}});
    closeBtn.textContent="Done";
    card.appendChild(closeBtn);
  }catch(e){
    statusText.textContent="Error: "+e.message;
    setTimeout(function(){overlay.remove();},4000);
  }
}

// --- SOCIAL MEDIA PUBLISHER --------------------------------------------------
var SOCIAL_STATE={publishing:false,lastResult:null};
var GRAPH_BASE="https://graph.facebook.com/v25.0/";

// --- AUTO-POST ENGINE (Professional Scheduler) ---
var _autoPostTimer=null;
function startAutoPostEngine(){
  if(_autoPostTimer)return;
  _autoPostTimer=setInterval(_checkDuePosts,60000);
  _checkDuePosts();
}
async function _checkDuePosts(){
  var cal;try{cal=JSON.parse(localStorage.getItem("dv_content_calendar")||"[]");}catch(e){return;}
  var now=new Date();
  var nowDate=now.toISOString().split("T")[0];
  var nowTime=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");
  var due=cal.filter(function(e){return e.status==="scheduled"&&e.date<=nowDate&&(e.date<nowDate||e.time<=nowTime);});
  for(var i=0;i<due.length;i++){
    await _autoPublish(due[i]);
  }
}
async function _autoPublish(evt){
  _updateCalStatus(evt.id,"publishing");
  _autoPostNotify("Publishing","Posting to "+(evt.platform||"all")+"...",evt);
  try{
    var caption=evt.caption||"";
    var platform=evt.platform||"all";
    var results=[];
    var img=null;
    try{img=await findSmartImage(caption);}catch(e){}
    if(platform==="instagram"||platform==="all"){
      try{var r=await publishToInstagram(caption,img?[img]:[]);results.push({p:"instagram",ok:r.success,err:r.error,id:r.media_id});}catch(e){results.push({p:"instagram",ok:false,err:e.message});}
    }
    if(platform==="facebook"||platform==="all"){
      try{var r2=await publishToFacebook(caption,img?[img]:[]);results.push({p:"facebook",ok:r2.success,err:r2.error,id:r2.id});}catch(e){results.push({p:"facebook",ok:false,err:e.message});}
    }
    if(platform==="linkedin"||platform==="all"){
      try{var r3=await publishToLinkedIn(caption,img);results.push({p:"linkedin",ok:r3.success,err:r3.error,id:r3.id});}catch(e){results.push({p:"linkedin",ok:false,err:e.message});}
    }
    if(platform==="twitter"||platform==="all"){
      try{var tweetText=caption.length>280?caption.substring(0,277)+"...":caption;var r4=await publishToTwitter(tweetText,img);results.push({p:"twitter",ok:r4.success,err:r4.error});}catch(e){results.push({p:"twitter",ok:false,err:e.message});}
    }
    if(platform==="whatsapp"){
      shareToWhatsApp(caption);results.push({p:"whatsapp",ok:true});
    }
    var succeeded=results.filter(function(r){return r.ok;});
    var failed=results.filter(function(r){return!r.ok;});
    var status=failed.length===0?"published":succeeded.length===0?"failed":"partial";
    _updateCalStatus(evt.id,status,results);
    savePostToHistory({caption:caption,platform:platform,type:"auto-scheduled",results:results,scheduledDate:evt.date,scheduledTime:evt.time});
    if(succeeded.length>0){
      var platNames=succeeded.map(function(r){return r.p;}).join(", ");
      _autoPostNotify("Published","Posted to "+platNames+" successfully!",evt);
    }
    if(failed.length>0){
      var failNames=failed.map(function(r){return r.p+": "+(r.err||"Unknown");}).join("; ");
      _autoPostNotify("Partial Failure",failNames,evt);
    }
    _trackPostIds(evt.id,results);
  }catch(e){
    _updateCalStatus(evt.id,"failed",[{p:evt.platform,ok:false,err:e.message}]);
    _autoPostNotify("Failed","Error: "+e.message,evt);
  }
}
function _updateCalStatus(id,status,results){
  try{
    var cal=JSON.parse(localStorage.getItem("dv_content_calendar")||"[]");
    cal=cal.map(function(e){if(e.id===id){e.status=status;e.publishedAt=new Date().toISOString();if(results)e.results=results;}return e;});
    localStorage.setItem("dv_content_calendar",JSON.stringify(cal));
  }catch(e){}
}
function _autoPostNotify(title,body,evt){
  try{
    if("Notification" in window&&Notification.permission==="granted"){
      new Notification("DubAIVal — "+title,{body:body+"\n"+(evt.caption||"").substring(0,60),icon:"logo.png",tag:"dv-autopost-"+evt.id});
    }
  }catch(e){}
  try{
    var log=JSON.parse(localStorage.getItem("dv_autopost_log")||"[]");
    log.unshift({title:title,body:body,at:new Date().toISOString(),eventId:evt.id});
    if(log.length>100)log=log.slice(0,100);
    localStorage.setItem("dv_autopost_log",JSON.stringify(log));
  }catch(e){}
  if((title==="Failed"||title==="Partial Failure")&&typeof addNotification==="function"){
    var snippet=(evt.caption||"Post").substring(0,40);
    var platInfo=body.split(":")[0]||"";
    addNotification("⚠️","Auto-post failed — \""+snippet+(snippet.length>=40?"...":"")+"\" on "+platInfo,"SocialStudio");
  }
}
function _trackPostIds(calId,results){
  try{
    var tracked=JSON.parse(localStorage.getItem("dv_post_tracking")||"{}");
    tracked[calId]={results:results,publishedAt:new Date().toISOString(),checked:false};
    localStorage.setItem("dv_post_tracking",JSON.stringify(tracked));
  }catch(e){}
}
setTimeout(startAutoPostEngine,5000);

// --- SERVER-SIDE AUTO-POST SYNC (Supabase) ---
function _getPostUserId(){
  try{var u=JSON.parse(localStorage.getItem("dv_user")||"{}");return u.email||u.id||"default";}catch(e){return "default";}
}

function _syncCredsToServer(){
  try{
    var userId=_getPostUserId();
    var payload={
      user_id:userId,
      ig_token:localStorage.getItem("dv_ig_token")||null,
      ig_id:localStorage.getItem("dv_ig_id")||null,
      fb_id:localStorage.getItem("dv_fb_id")||null,
      linkedin_token:localStorage.getItem("dv_linkedin_token")||null,
      linkedin_urn:localStorage.getItem("dv_linkedin_urn")||null,
      twitter_consumer_key:localStorage.getItem("dv_twitter_consumer_key")||null,
      twitter_consumer_secret:localStorage.getItem("dv_twitter_consumer_secret")||null,
      twitter_access_token:localStorage.getItem("dv_twitter_access_token")||null,
      twitter_access_secret:localStorage.getItem("dv_twitter_access_secret")||null,
      youtube_refresh:localStorage.getItem("dv_youtube_refresh")||null,
      youtube_client_id:localStorage.getItem("dv_youtube_client_id")||null,
      youtube_client_secret:localStorage.getItem("dv_youtube_client_secret")||null,
      pexels_key:localStorage.getItem("dv_pexels_key")||null,
      tiktok_token:localStorage.getItem("dv_tiktok_token")||null,
      updated_at:new Date().toISOString()
    };
    fetch(SUPABASE_URL+"/rest/v1/social_credentials?user_id=eq."+encodeURIComponent(userId),{
      method:"GET",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"}
    }).then(function(r){return r.json();}).then(function(existing){
      if(existing&&existing.length>0){
        fetch(SUPABASE_URL+"/rest/v1/social_credentials?user_id=eq."+encodeURIComponent(userId),{
          method:"PATCH",
          headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},
          body:JSON.stringify(payload)
        });
      }else{
        fetch(SUPABASE_URL+"/rest/v1/social_credentials",{
          method:"POST",
          headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},
          body:JSON.stringify(payload)
        });
      }
    }).catch(function(){});
  }catch(e){}
}

async function _syncCalEventToServer(evt,imageUrl){
  try{
    var userId=_getPostUserId();
    var payload={
      user_id:userId,
      caption:evt.caption||"",
      platform:evt.platform||"all",
      scheduled_date:evt.date,
      scheduled_time:evt.time+":00",
      pillar:evt.pillar||"General",
      status:"scheduled",
      image_url:imageUrl||null,
      client_id:evt.id
    };
    await fetch(SUPABASE_URL+"/rest/v1/scheduled_posts",{
      method:"POST",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify(payload)
    });
  }catch(e){}
}

async function _deleteCalEventFromServer(clientId){
  try{
    var userId=_getPostUserId();
    await fetch(SUPABASE_URL+"/rest/v1/scheduled_posts?client_id=eq."+encodeURIComponent(clientId)+"&user_id=eq."+encodeURIComponent(userId),{
      method:"PATCH",
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify({status:"cancelled",updated_at:new Date().toISOString()})
    });
  }catch(e){}
}

async function _syncAllCalendarToServer(){
  try{
    var cal=JSON.parse(localStorage.getItem("dv_content_calendar")||"[]");
    var scheduled=cal.filter(function(e){return e.status==="scheduled";});
    for(var i=0;i<scheduled.length;i++){
      await _syncCalEventToServer(scheduled[i],null);
    }
  }catch(e){}
}

function _fetchServerEngagement(){
  try{
    var userId=_getPostUserId();
    fetch(SUPABASE_URL+"/rest/v1/post_engagement?user_id=eq."+encodeURIComponent(userId)+"&select=*&order=checked_at.desc&limit=50",{
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"}
    }).then(function(r){return r.json();}).then(function(data){
      if(data&&data.length>0){
        localStorage.setItem("dv_server_engagement",JSON.stringify(data));
      }
    }).catch(function(){});
  }catch(e){}
}

// --- POST ENGAGEMENT TRACKER ---
async function fetchPostEngagement(mediaId){
  var c=getSocialCreds();if(!c)return null;
  try{
    var r=await fetch(GRAPH_BASE+mediaId+"?fields=like_count,comments_count,timestamp,media_type,permalink&access_token="+c.token);
    var d=await r.json();if(d.error)return null;
    var insights=null;
    try{
      var ir=await fetch(GRAPH_BASE+mediaId+"/insights?metric=impressions,reach,engagement,saved&access_token="+c.token);
      var id=await ir.json();
      if(id.data){insights={};id.data.forEach(function(m){insights[m.name]=m.values[0].value;});}
    }catch(e){}
    return{likes:d.like_count||0,comments:d.comments_count||0,timestamp:d.timestamp,permalink:d.permalink,type:d.media_type,insights:insights};
  }catch(e){return null;}
}
async function checkAllPostEngagement(){
  var tracked=JSON.parse(localStorage.getItem("dv_post_tracking")||"{}");
  var keys=Object.keys(tracked);
  var updated=0;
  for(var i=0;i<keys.length;i++){
    var entry=tracked[keys[i]];
    if(!entry.results)continue;
    for(var j=0;j<entry.results.length;j++){
      var r=entry.results[j];
      if(r.ok&&r.id&&r.p==="instagram"){
        var eng=await fetchPostEngagement(r.id);
        if(eng){r.engagement=eng;updated++;}
      }
    }
    entry.lastChecked=new Date().toISOString();
    entry.checked=true;
  }
  if(updated>0)localStorage.setItem("dv_post_tracking",JSON.stringify(tracked));
  return updated;
}

// --- REAL HASHTAG DATA (Instagram Graph API) ---
async function fetchRealHashtagData(hashtag){
  var c=getSocialCreds();if(!c)return null;
  try{
    var sr=await fetch(GRAPH_BASE+"ig_hashtag_search?user_id="+c.igId+"&q="+encodeURIComponent(hashtag.replace("#",""))+"&access_token="+c.token);
    var sd=await sr.json();
    if(!sd.data||!sd.data[0])return null;
    var hid=sd.data[0].id;
    var dr=await fetch(GRAPH_BASE+hid+"?fields=id,name,media_count&access_token="+c.token);
    var dd=await dr.json();
    return{id:hid,name:dd.name||hashtag,mediaCount:dd.media_count||0};
  }catch(e){return null;}
}
async function enrichHashtagsWithRealData(tags){
  var enriched=[];
  for(var i=0;i<Math.min(tags.length,15);i++){
    var tag=typeof tags[i]==="string"?tags[i]:(tags[i].tag||tags[i]);
    var real=await fetchRealHashtagData(tag);
    if(real){
      var competition="Low";
      if(real.mediaCount>5000000)competition="Very High";
      else if(real.mediaCount>1000000)competition="High";
      else if(real.mediaCount>100000)competition="Medium";
      enriched.push({tag:tag,posts:real.mediaCount,competition:competition,score:_hashtagScore(real.mediaCount)});
    }else{
      enriched.push({tag:tag,posts:null,competition:"Unknown",score:50});
    }
  }
  return enriched;
}
function _hashtagScore(posts){
  if(posts>=10000&&posts<=500000)return 90;
  if(posts>=500000&&posts<=2000000)return 70;
  if(posts>=2000000&&posts<=5000000)return 50;
  if(posts>5000000)return 30;
  if(posts<10000)return 60;
  return 50;
}
function _formatPostCount(n){
  if(!n)return"—";
  if(n>=1000000)return(n/1000000).toFixed(1)+"M";
  if(n>=1000)return(n/1000).toFixed(1)+"K";
  return String(n);
}

// --- TRANSLATION MEMORY ---
function _getTranslationMemory(){try{return JSON.parse(localStorage.getItem("dv_translation_memory")||"{}");} catch(e){return{};}}
function _saveTranslation(originalHash,langCode,translation){
  var mem=_getTranslationMemory();
  if(!mem[langCode])mem[langCode]={};
  mem[langCode][originalHash]=translation;
  var keys=Object.keys(mem[langCode]);
  if(keys.length>200){var oldest=keys.slice(0,keys.length-200);oldest.forEach(function(k){delete mem[langCode][k];});}
  localStorage.setItem("dv_translation_memory",JSON.stringify(mem));
}
function _getCachedTranslation(originalHash,langCode){
  var mem=_getTranslationMemory();
  return mem[langCode]&&mem[langCode][originalHash]||null;
}
function _simpleHash(str){var h=0;for(var i=0;i<str.length;i++){h=((h<<5)-h)+str.charCodeAt(i);h|=0;}return"h"+Math.abs(h).toString(36);}

// --- FRAMEWORK PERFORMANCE TRACKING ---
function _getFrameworkStats(){try{return JSON.parse(localStorage.getItem("dv_framework_stats")||"{}");} catch(e){return{};}}
function _trackFrameworkUse(framework){
  var stats=_getFrameworkStats();
  if(!stats[framework])stats[framework]={uses:0,published:0,engagement:0};
  stats[framework].uses++;stats[framework].lastUsed=new Date().toISOString();
  localStorage.setItem("dv_framework_stats",JSON.stringify(stats));
}
function _trackFrameworkPublish(framework){
  var stats=_getFrameworkStats();
  if(!stats[framework])stats[framework]={uses:0,published:0,engagement:0};
  stats[framework].published++;
  localStorage.setItem("dv_framework_stats",JSON.stringify(stats));
}

function getSocialCreds(){
  var t=localStorage.getItem("dv_ig_token");
  var ig=localStorage.getItem("dv_ig_id");
  var fb=localStorage.getItem("dv_fb_id");
  if(!t||!ig)return null;
  return{token:t,igId:ig,fbId:fb||"",pexels:localStorage.getItem("dv_pexels_key")||""};
}

// --- AI VIDEO EDITOR (world-class rebuild) -----------------------------------
var VIDEO_EDITOR_STATE={
  file:null,url:null,duration:0,trimStart:0,trimEnd:0,
  colorPreset:"cinematic",watermark:true,musicType:"luxury",
  subtitleStyle:"animated",subtitleText:"",caption:"",hashtags:"",
  platform:"reel",processing:false,processedBlob:null,processedUrl:null,
  autoResults:{trim:null,subtitles:null,caption:null}
};

function showVideoEditor(){
  var existing=document.getElementById("video-editor-modal");
  if(existing)existing.remove();
  VIDEO_EDITOR_STATE={
    file:null,url:null,duration:0,trimStart:0,trimEnd:0,
    colorPreset:"cinematic",watermark:true,musicType:"luxury",
    subtitleStyle:"animated",subtitleText:"",caption:"",hashtags:"",
    platform:"reel",processing:false,processedBlob:null,processedUrl:null,
    autoResults:{trim:null,subtitles:null,caption:null}
  };

  // ── WORLD-CLASS AI VIDEO EDITOR ─────────────────────────────────────────────
  // Full-screen, tabs: Auto-Pilot | Edit | Export
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",padding:"16px"},id:"video-editor-modal"});
  var card=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"20px",width:"720px",maxWidth:"97vw",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.8)"});

  // ── Header ──────────────────────────────────────────────────────────────────
  var header=div({background:"linear-gradient(135deg,#1A0A1E,#0D1220)",borderBottom:"1px solid #2A3040",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"});
  var hLeft=div({display:"flex",alignItems:"center",gap:"12px"});
  hLeft.appendChild(div({width:"10px",height:"10px",borderRadius:"50%",background:"#EC4899",boxShadow:"0 0 8px #EC4899"},""));
  hLeft.appendChild(div({color:"#F0F2F5",fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AI Video Editor"));
  hLeft.appendChild(div({background:"rgba(236,72,153,0.12)",border:"1px solid rgba(236,72,153,0.3)",borderRadius:"6px",padding:"2px 8px",color:"#EC4899",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em"},"STUDIO"));
  header.appendChild(hLeft);
  var closeX=el("button",{style:{background:"transparent",border:"none",color:"#8899AA",fontSize:"20px",cursor:"pointer",padding:"4px 8px",borderRadius:"6px",lineHeight:"1"}});
  closeX.textContent="×";
  closeX.onclick=function(){
    if(VIDEO_EDITOR_STATE.url)URL.revokeObjectURL(VIDEO_EDITOR_STATE.url);
    if(VIDEO_EDITOR_STATE.processedUrl)URL.revokeObjectURL(VIDEO_EDITOR_STATE.processedUrl);
    overlay.remove();
  };
  header.appendChild(closeX);
  card.appendChild(header);

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  var TABS=["Auto-Pilot","Edit","Export"];
  var activeTab="Auto-Pilot";
  var tabBar=div({display:"flex",borderBottom:"1px solid #2A3040",background:"#070B14"});
  var tabBtns={};
  TABS.forEach(function(t){
    var btn=el("button",{style:{flex:"1",background:"transparent",border:"none",borderBottom:"2px solid transparent",padding:"12px",fontSize:"12px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",transition:"all 0.15s",color:"#556677"}});
    btn.textContent=t==="Auto-Pilot"?"⚡ Auto-Pilot":t==="Edit"?"✏ Manual Edit":"📤 Export";
    btn.onclick=function(){switchTab(t);};
    tabBtns[t]=btn;
    tabBar.appendChild(btn);
  });
  card.appendChild(tabBar);

  var body=div({padding:"20px",minHeight:"400px"});
  card.appendChild(body);

  function switchTab(t){
    activeTab=t;
    TABS.forEach(function(n){
      tabBtns[n].style.color=n===t?"#EC4899":"#556677";
      tabBtns[n].style.borderBottomColor=n===t?"#EC4899":"transparent";
      tabBtns[n].style.background=n===t?"rgba(236,72,153,0.05)":"transparent";
    });
    renderTabBody();
  }
  switchTab("Auto-Pilot");

  // ── Shared video element (reused across tabs) ─────────────────────────────
  var video=el("video",{style:{width:"100%",maxHeight:"280px",display:"block",borderRadius:"10px",background:"#000"},controls:true,playsInline:true});
  var fileInput=el("input",{type:"file",accept:"video/*",style:{display:"none"}});
  document.body.appendChild(fileInput);

  // ── Shared state refs (live inputs) ──────────────────────────────────────
  var startInp=el("input",{type:"number",min:0,step:0.1,value:0,style:{width:"70px",background:"#1A1F2E",border:"1px solid #2A3040",borderRadius:"6px",padding:"5px 8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",textAlign:"center"}});
  var endInp=el("input",{type:"number",min:0,step:0.1,value:30,style:{width:"70px",background:"#1A1F2E",border:"1px solid #2A3040",borderRadius:"6px",padding:"5px 8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",textAlign:"center"}});
  var subTextarea=el("textarea",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",resize:"vertical",minHeight:"70px",boxSizing:"border-box"},placeholder:"0:00 Luxury living in Dubai Marina\n0:05 Stunning sea views from every room\n0:12 AED 2.5M — Call to book a viewing"});
  var captionInp=el("textarea",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"'Inter',sans-serif",resize:"vertical",minHeight:"80px",boxSizing:"border-box"},placeholder:"Post caption + hashtags (auto-generated)..."});

  function updateDurLabel(){
    var s=parseFloat(startInp.value)||0;
    var e=parseFloat(endInp.value)||0;
    VIDEO_EDITOR_STATE.trimStart=s;
    VIDEO_EDITOR_STATE.trimEnd=e;
    return (e-s).toFixed(1)+"s";
  }
  startInp.oninput=updateDurLabel;
  endInp.oninput=updateDurLabel;

  // ── COLOR GRADES ────────────────────────────────────────────────────────────
  var COLOR_GRADES={
    original:{label:"Original",filter:"none"},
    cinematic:{label:"Cinematic",filter:"contrast(1.15) saturate(0.9) brightness(0.95)"},
    bright:{label:"Bright",filter:"brightness(1.12) saturate(1.2)"},
    warm:{label:"Warm",filter:"sepia(0.3) saturate(1.1) brightness(1.05)"},
    cool:{label:"Cool",filter:"hue-rotate(20deg) saturate(1.1) brightness(1.02)"},
    luxury:{label:"Luxury",filter:"contrast(1.1) saturate(0.8) brightness(1.05) sepia(0.1)"}
  };

  // ── PLATFORM PRESETS ─────────────────────────────────────────────────────────
  var PLATFORMS={
    reel:{label:"Instagram Reel",icon:"📱",w:1080,h:1920,maxSec:90,desc:"9:16 vertical"},
    story:{label:"Story/TikTok",icon:"🎵",w:1080,h:1920,maxSec:60,desc:"9:16 · 60s max"},
    square:{label:"Square Post",icon:"⬜",w:1080,h:1080,maxSec:60,desc:"1:1 Instagram/FB"},
    landscape:{label:"YouTube/LinkedIn",icon:"🖥",w:1920,h:1080,maxSec:600,desc:"16:9 landscape"},
    whatsapp:{label:"WhatsApp Status",icon:"💬",w:1080,h:1920,maxSec:30,desc:"9:16 · 30s max"}
  };

  // ── AI ANALYSIS (shared helper) ──────────────────────────────────────────────
  async function aiAnalyzeVideo(statusCb){
    var geminiKey=localStorage.getItem("dv_gemini_key");
    if(!geminiKey)throw new Error("Gemini key not set — go to Setup → Social Setup");
    var dur=VIDEO_EDITOR_STATE.duration;
    if(!dur)throw new Error("No video loaded");
    statusCb("Capturing frames…");
    var canvas=document.createElement("canvas");var ctx=canvas.getContext("2d");
    canvas.width=320;canvas.height=180;
    var frames=[];var frameCount=Math.min(10,Math.max(4,Math.floor(dur/3)));
    for(var i=0;i<frameCount;i++){
      var t=dur*(i/(frameCount-1||1));
      video.currentTime=t;
      await new Promise(function(r){video.onseeked=r;setTimeout(r,800);});
      ctx.drawImage(video,0,0,320,180);
      frames.push({t:t.toFixed(1),data:canvas.toDataURL("image/jpeg",0.45).split(",")[1]});
    }
    var bp=getBrandProfile()||{};
    var plat=PLATFORMS[VIDEO_EDITOR_STATE.platform||"reel"];
    var parts=frames.map(function(f){return{inlineData:{mimeType:"image/jpeg",data:f.data}};});
    parts.push({text:"Dubai real estate video, "+dur.toFixed(0)+"s long, "+frameCount+" frames captured at even intervals. Target platform: "+plat.label+" (max "+plat.maxSec+"s). Agent brand: "+(bp.name||"DubAIVal")+(bp.tone?", tone: "+bp.tone:"")+".\n\nAnalyze frames and respond ONLY in this JSON (no markdown):\n{\"trimStart\":0,\"trimEnd\":30,\"subtitles\":[{\"time\":0,\"text\":\"...\"},{\"time\":5,\"text\":\"...\"}],\"caption\":\"compelling Instagram caption with 5-8 hashtags\",\"colorGrade\":\"cinematic\",\"reason\":\"brief explanation\"}"});
    statusCb("AI analyzing content…");
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:parts}],generationConfig:{temperature:0.2,maxOutputTokens:800}})
    });
    if(!r.ok)throw new Error("Gemini error "+r.status);
    var d=await r.json();
    var txt=((d.candidates||[])[0]||{content:{parts:[{text:"{}"}]}}).content.parts[0].text;
    txt=txt.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();
    var obj=JSON.parse(txt.match(/\{[\s\S]*\}/)[0]);
    return obj;
  }

  // ── RENDER VIDEO WITH OVERLAYS (shared) ──────────────────────────────────────
  async function renderWithOverlays(platKey,statusCb){
    var plat=PLATFORMS[platKey]||PLATFORMS.reel;
    var s=VIDEO_EDITOR_STATE.trimStart||0;
    var e=VIDEO_EDITOR_STATE.trimEnd||VIDEO_EDITOR_STATE.duration||30;
    var subs=(subTextarea.value||"").trim().split("\n").filter(Boolean).map(function(l){
      var m=l.match(/^(\d+):(\d+)\s+(.*)/);
      return m?{time:parseInt(m[1])*60+parseInt(m[2]),text:m[3]}:null;
    }).filter(Boolean);
    var grade=COLOR_GRADES[VIDEO_EDITOR_STATE.colorPreset]||COLOR_GRADES.cinematic;
    var bp=getBrandProfile()||{};
    var canvas=document.createElement("canvas");canvas.width=plat.w;canvas.height=plat.h;
    var ctx=canvas.getContext("2d");
    statusCb("Starting render…");

    var stream=canvas.captureStream(30);
    if(video.captureStream){
      try{video.captureStream().getAudioTracks().forEach(function(t){stream.addTrack(t);});}catch(e){}
    }

    var mimeType=MediaRecorder.isTypeSupported("video/mp4")?"video/mp4":"video/webm;codecs=vp9";
    var chunks=[];
    var recorder=new MediaRecorder(stream,{mimeType:mimeType,videoBitsPerSecond:5000000});
    recorder.ondataavailable=function(ev){if(ev.data&&ev.data.size>0)chunks.push(ev.data);};
    var done=new Promise(function(resolve){recorder.onstop=resolve;});

    video.currentTime=s;
    await new Promise(function(r){video.onseeked=r;setTimeout(r,800);});
    video.playbackRate=1;
    video.play();
    recorder.start(100);

    var wm=VIDEO_EDITOR_STATE.watermark&&(bp.name||bp.tagline);
    var totalDur=e-s;
    var drawFrame=function(){
      if(video.currentTime>=e||video.paused||video.ended){
        video.pause();recorder.stop();statusCb("Finalizing…");return;
      }
      var progress=(video.currentTime-s)/totalDur;
      statusCb("Rendering "+(Math.round(progress*100))+"%…");

      // Draw video frame scaled to canvas with color grade
      ctx.filter=grade.filter;
      var vw=video.videoWidth||1280,vh=video.videoHeight||720;
      var scale=Math.max(plat.w/vw,plat.h/vh);
      var dw=vw*scale,dh=vh*scale;
      ctx.drawImage(video,(plat.w-dw)/2,(plat.h-dh)/2,dw,dh);
      ctx.filter="none";

      // Color overlay for cinematic look
      if(VIDEO_EDITOR_STATE.colorPreset==="cinematic"||VIDEO_EDITOR_STATE.colorPreset==="luxury"){
        var grad=ctx.createLinearGradient(0,0,0,plat.h);
        grad.addColorStop(0,"rgba(0,0,0,0.25)");grad.addColorStop(0.5,"rgba(0,0,0,0)");grad.addColorStop(1,"rgba(0,0,0,0.4)");
        ctx.fillStyle=grad;ctx.fillRect(0,0,plat.w,plat.h);
      }

      // Subtitles
      var elapsed=video.currentTime-s;
      var activeSub=null;
      for(var i=subs.length-1;i>=0;i--){if(elapsed>=subs[i].time){activeSub=subs[i].text;break;}}
      if(activeSub){
        var fSize=Math.max(28,Math.round(plat.w/26));
        ctx.font="bold "+fSize+"px 'Space Grotesk', 'Arial', sans-serif";
        ctx.textAlign="center";
        var tx=plat.w/2,ty=plat.h-plat.h*0.1;
        var tw=ctx.measureText(activeSub).width;
        var pad=20,rh=fSize+pad;
        var rx=tx-tw/2-pad,ry=ty-fSize-pad/2;
        ctx.fillStyle="rgba(0,0,0,0.72)";
        ctx.beginPath();ctx.roundRect(rx,ry,tw+pad*2,rh,10);ctx.fill();
        var grd=ctx.createLinearGradient(rx,ry,rx+tw+pad*2,ry);
        grd.addColorStop(0,"rgba(236,72,153,0.4)");grd.addColorStop(1,"rgba(139,92,246,0.4)");
        ctx.fillStyle=grd;ctx.beginPath();ctx.roundRect(rx,ry,tw+pad*2,rh,10);ctx.fill();
        ctx.fillStyle="#FFFFFF";ctx.shadowColor="rgba(0,0,0,0.8)";ctx.shadowBlur=4;
        ctx.fillText(activeSub,tx,ty);ctx.shadowBlur=0;
      }

      // Watermark
      if(wm){
        var wmText=bp.name||"DubAIVal";
        var wmSize=Math.max(18,Math.round(plat.w/50));
        ctx.font="600 "+wmSize+"px 'Space Grotesk','Arial',sans-serif";
        ctx.textAlign="left";
        var wmW=ctx.measureText(wmText).width;
        ctx.fillStyle="rgba(0,0,0,0.45)";
        ctx.beginPath();ctx.roundRect(plat.w*0.04-8,plat.h*0.92-wmSize,wmW+22,wmSize+14,6);ctx.fill();
        ctx.fillStyle="rgba(212,175,55,0.9)";
        ctx.fillText(wmText,plat.w*0.04,plat.h*0.92);
      }

      requestAnimationFrame(drawFrame);
    };
    requestAnimationFrame(drawFrame);
    await done;
    return new Blob(chunks,{type:mimeType});
  }

  // ── SHOW RESULTS SECTION ────────────────────────────────────────────────────
  function showResultsUI(blob,captionText,platKey,container){
    var url=URL.createObjectURL(blob);
    VIDEO_EDITOR_STATE.processedBlob=blob;
    VIDEO_EDITOR_STATE.processedUrl=url;
    container.innerHTML="";

    var resultCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"12px",overflow:"hidden",marginTop:"16px"});

    var vidEl=el("video",{style:{width:"100%",maxHeight:"300px",display:"block",background:"#000"},controls:true,src:url});
    resultCard.appendChild(vidEl);

    var actRow=div({padding:"12px",display:"flex",gap:"8px",flexWrap:"wrap",borderTop:"1px solid #2A3040"});
    var plat=PLATFORMS[platKey]||PLATFORMS.reel;
    var ext=blob.type.indexOf("mp4")!==-1?"mp4":"webm";

    var dlBtn=el("button",{style:{flex:"1",minWidth:"120px",background:"#10B981",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px 14px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
    dlBtn.textContent="⬇ Download "+ext.toUpperCase();
    dlBtn.onclick=function(){var a=document.createElement("a");a.href=url;a.download="dubaival-"+platKey+"."+ext;a.click();};
    actRow.appendChild(dlBtn);

    var shareBtn=el("button",{style:{flex:"1",minWidth:"120px",background:"#3B82F6",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px 14px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
    shareBtn.textContent="↗ Share";
    shareBtn.onclick=function(){showShareModal({text:captionText||"",file:blob,fileName:"dubaival-"+platKey+"."+ext,fileType:blob.type,title:"DubAIVal Video"});};
    actRow.appendChild(shareBtn);

    if(captionText){
      var cpBtn=el("button",{style:{flex:"1",minWidth:"120px",background:"#F97316",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px 14px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
      cpBtn.textContent="📋 Copy Caption";
      cpBtn.onclick=function(){navigator.clipboard.writeText(captionText).then(function(){cpBtn.textContent="✓ Copied!";setTimeout(function(){cpBtn.textContent="📋 Copy Caption";},2000);});};
      actRow.appendChild(cpBtn);
    }
    resultCard.appendChild(actRow);
    container.appendChild(resultCard);

    if(captionText){
      var capBox=div({background:"#070B14",border:"1px solid #2A3040",borderRadius:"10px",padding:"12px",marginTop:"10px"});
      capBox.appendChild(div({color:"#8899AA",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",marginBottom:"6px"},"POST CAPTION + HASHTAGS"));
      var capTxt=el("p",{style:{color:"#E0E0E0",fontSize:"11px",fontFamily:"'Inter',sans-serif",margin:0,whiteSpace:"pre-wrap",lineHeight:"1.6"}});
      capTxt.textContent=captionText;
      capBox.appendChild(capTxt);
      container.appendChild(capBox);
    }

    // Optional next steps — enhance before publishing
    var veNextSec=div({background:"rgba(255,255,255,0.02)",border:"1px solid #2A3040",borderRadius:"12px",padding:"12px",marginTop:"10px",marginBottom:"10px"});
    veNextSec.appendChild(div({color:"#556677",fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",marginBottom:"10px"}),"✦ OPTIONAL — ENHANCE BEFORE PUBLISHING");
    var veNextRow=div({display:"flex",gap:"6px",flexWrap:"wrap"});
    [
      {icon:"🎨",label:"Design Cover",desc:"Thumbnail / companion image",fn:function(){showPostDesigner(captionText||"");}},
      {icon:"👁",label:"Preview Post",desc:"See how it looks on feed",fn:function(){showPostPreview(captionText||"",null);}},
      {icon:"📱",label:"Story Template",desc:"Create a story too",fn:function(){showStoryTemplates();}}
    ].forEach(function(step){
      var nb=el("button",{style:{flex:"1",minWidth:"100px",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"10px",padding:"10px 8px",cursor:"pointer",textAlign:"center",transition:"all 0.2s",fontFamily:"inherit"}});
      nb.innerHTML="<div style='font-size:20px;margin-bottom:4px'>"+step.icon+"</div><div style='color:#C0C8D8;font-size:10px;font-weight:600;font-family:Space Grotesk,monospace'>"+step.label+"</div><div style='color:#556677;font-size:9px;margin-top:2px;font-family:Inter,sans-serif'>"+step.desc+"</div>";
      nb.onmouseenter=function(){nb.style.borderColor="#EC4899";nb.style.background="rgba(236,72,153,0.05)";};
      nb.onmouseleave=function(){nb.style.borderColor="#2A3040";nb.style.background="#0D1117";};
      nb.onclick=step.fn;veNextRow.appendChild(nb);
    });
    veNextSec.appendChild(veNextRow);container.appendChild(veNextSec);

    // Unified publish bar — same flow as Chat tab
    showVideoPublishBar(blob,captionText||"",container);
  }

  // ── TAB RENDERERS ─────────────────────────────────────────────────────────
  function renderTabBody(){
    body.innerHTML="";
    if(activeTab==="Auto-Pilot")renderAutoPilotTab();
    else if(activeTab==="Edit")renderEditTab();
    else renderExportTab();
  }

  function renderAutoPilotTab(){
    // Upload zone always on top
    var hasVideo=!!VIDEO_EDITOR_STATE.file;
    if(!hasVideo){
      var uploadZone=div({background:"#070B14",border:"2px dashed #EC4899",borderRadius:"16px",padding:"40px 20px",textAlign:"center",cursor:"pointer",transition:"all 0.2s",marginBottom:"16px"});
      uploadZone.innerHTML="<div style='font-size:40px;margin-bottom:10px'>🎬</div><div style='color:#EC4899;font-size:14px;font-weight:700;font-family:Space Grotesk,monospace;margin-bottom:6px'>Drop your video here</div><div style='color:#8899AA;font-size:11px'>MP4 · MOV · WebM · Max 500MB</div>";
      uploadZone.onclick=function(){fileInput.click();};
      uploadZone.ondragover=function(ev){ev.preventDefault();this.style.background="#1A0A1E";this.style.borderColor="#F472B6";};
      uploadZone.ondragleave=function(){this.style.background="#070B14";this.style.borderColor="#EC4899";};
      uploadZone.ondrop=function(ev){
        ev.preventDefault();this.style.background="#070B14";this.style.borderColor="#EC4899";
        var f=ev.dataTransfer.files[0];
        if(f&&f.type.startsWith("video/"))handleFileLoad(f);
      };
      body.appendChild(uploadZone);

      // Platform selector
      body.appendChild(div({color:"#8899AA",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",marginBottom:"8px"},"TARGET PLATFORM"));
      var platRow=div({display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"20px"});
      Object.keys(PLATFORMS).forEach(function(k){
        var p=PLATFORMS[k];
        var btn=el("button",{style:{background:VIDEO_EDITOR_STATE.platform===k?"rgba(236,72,153,0.15)":"#1A1F2E",border:"1px solid "+(VIDEO_EDITOR_STATE.platform===k?"#EC4899":"#2A3040"),borderRadius:"8px",padding:"8px 12px",cursor:"pointer",transition:"all 0.15s",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",minWidth:"80px"}});
        btn.appendChild(div({fontSize:"16px"},p.icon));
        btn.appendChild(div({color:VIDEO_EDITOR_STATE.platform===k?"#EC4899":"#8899AA",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",textAlign:"center"},p.label));
        btn.onclick=function(){VIDEO_EDITOR_STATE.platform=k;renderAutoPilotTab();};
        platRow.appendChild(btn);
      });
      body.appendChild(platRow);
      return;
    }

    // Video loaded — show preview + auto-pilot controls
    var previewWrap=div({marginBottom:"14px",borderRadius:"12px",overflow:"hidden",background:"#000"});
    previewWrap.appendChild(video);
    body.appendChild(previewWrap);

    // Platform selector (compact)
    var platRow=div({display:"flex",gap:"6px",marginBottom:"14px",flexWrap:"wrap"});
    Object.keys(PLATFORMS).forEach(function(k){
      var p=PLATFORMS[k];
      var btn=el("button",{style:{background:VIDEO_EDITOR_STATE.platform===k?"rgba(236,72,153,0.15)":"transparent",border:"1px solid "+(VIDEO_EDITOR_STATE.platform===k?"#EC4899":"#2A3040"),borderRadius:"8px",padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",color:VIDEO_EDITOR_STATE.platform===k?"#EC4899":"#8899AA"}});
      btn.innerHTML=p.icon+" "+p.label;
      btn.onclick=function(){VIDEO_EDITOR_STATE.platform=k;renderAutoPilotTab();};
      platRow.appendChild(btn);
    });
    body.appendChild(platRow);

    // AUTO-PILOT CARD
    var apCard=div({background:"linear-gradient(135deg,rgba(236,72,153,0.08),rgba(139,92,246,0.08))",border:"1px solid rgba(236,72,153,0.25)",borderRadius:"16px",padding:"20px",marginBottom:"16px"});
    apCard.appendChild(div({color:"#F0F2F5",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"⚡ Auto-Pilot"));
    apCard.appendChild(div({color:"#8899AA",fontSize:"11px",fontFamily:"'Inter',sans-serif",marginBottom:"16px"},"AI analyzes your video, finds the best clip, writes subtitles + caption, applies brand and color grade — all in one click."));

    // Steps preview
    var steps=[
      {icon:"✂",label:"AI Smart Trim",desc:"Best 15-30s clip"},
      {icon:"🎨",label:"Color Grade",desc:"Cinematic look"},
      {icon:"💬",label:"AI Subtitles",desc:"Auto-generated"},
      {icon:"✍",label:"Caption + Hashtags",desc:"Optimized for reach"},
      {icon:"🏷",label:"Brand Watermark",desc:"From your profile"},
      {icon:"🎵",label:"Background Music",desc:"Luxury ambience"}
    ];
    var stepsGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"});
    var stepEls=[];
    steps.forEach(function(s){
      var row=div({background:"rgba(255,255,255,0.03)",borderRadius:"8px",padding:"8px 10px",display:"flex",alignItems:"center",gap:"8px"});
      row.appendChild(span({style:{fontSize:"16px"}},s.icon));
      var txt=div({});
      txt.appendChild(div({color:"#C0C8D8",fontSize:"10px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace"},s.label));
      txt.appendChild(div({color:"#556677",fontSize:"9px"},s.desc));
      row.appendChild(txt);
      var statusDot=div({width:"8px",height:"8px",borderRadius:"50%",background:"#2A3040",marginLeft:"auto",flexShrink:"0"},"");
      row.appendChild(statusDot);
      stepsGrid.appendChild(row);
      stepEls.push({row:row,dot:statusDot});
    });
    apCard.appendChild(stepsGrid);

    var progressBar=div({height:"4px",background:"#1A1F2E",borderRadius:"2px",overflow:"hidden",marginBottom:"10px"});
    var progressFill=div({height:"100%",width:"0%",background:"linear-gradient(90deg,#EC4899,#8B5CF6)",borderRadius:"2px",transition:"width 0.4s"},"");
    progressBar.appendChild(progressFill);
    apCard.appendChild(progressBar);

    var statusTxt=div({color:"#8899AA",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",textAlign:"center",marginBottom:"14px"},"Ready to process");
    apCard.appendChild(statusTxt);

    var resultContainer=div({});
    var autoPilotBtn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,#EC4899,#8B5CF6)",color:"#FFF",border:"none",borderRadius:"12px",padding:"16px",fontSize:"15px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.02em",boxShadow:"0 4px 20px rgba(236,72,153,0.4)"}});
    autoPilotBtn.textContent="⚡ Run Auto-Pilot";
    autoPilotBtn.onclick=async function(){
      autoPilotBtn.disabled=true;autoPilotBtn.textContent="Processing…";
      var pct=0;
      function setProgress(p,msg){progressFill.style.width=p+"%";statusTxt.textContent=msg;}
      function setStep(i,done){stepEls[i].dot.style.background=done?"#10B981":"#EC4899";}

      try{
        // Step 1: AI Analysis
        setProgress(5,"AI analyzing video content…");
        var aiResult=await aiAnalyzeVideo(function(msg){statusTxt.textContent=msg;});
        setStep(0,true);setProgress(30,"AI analysis complete");

        // Apply AI trim
        startInp.value=(aiResult.trimStart||0).toFixed(1);
        endInp.value=(Math.min(aiResult.trimEnd||30,VIDEO_EDITOR_STATE.duration)).toFixed(1);
        VIDEO_EDITOR_STATE.trimStart=parseFloat(startInp.value);
        VIDEO_EDITOR_STATE.trimEnd=parseFloat(endInp.value);

        // Color grade
        VIDEO_EDITOR_STATE.colorPreset=aiResult.colorGrade||"cinematic";
        setStep(1,true);setProgress(40,"Color grade applied");

        // Subtitles
        if(aiResult.subtitles&&aiResult.subtitles.length){
          var subLines=aiResult.subtitles.map(function(s){
            var m=Math.floor(s.time/60),sc=Math.floor(s.time%60);
            return m+":"+(sc<10?"0":"")+sc+" "+s.text;
          }).join("\n");
          subTextarea.value=subLines;
        }
        setStep(2,true);setProgress(55,"Subtitles ready");

        // Caption
        if(aiResult.caption){captionInp.value=aiResult.caption;VIDEO_EDITOR_STATE.caption=aiResult.caption;}
        setStep(3,true);setProgress(65,"Caption written");

        // Watermark
        VIDEO_EDITOR_STATE.watermark=true;
        setStep(4,true);setProgress(70,"Watermark enabled");

        // Render
        setProgress(72,"Rendering video…");setStep(5,false);
        var blob=await renderWithOverlays(VIDEO_EDITOR_STATE.platform,function(msg){statusTxt.textContent=msg;});
        setStep(5,true);setProgress(100,"Done! 🎉");

        autoPilotBtn.textContent="⚡ Re-run Auto-Pilot";
        autoPilotBtn.disabled=false;
        showResultsUI(blob,captionInp.value,VIDEO_EDITOR_STATE.platform,resultContainer);

      }catch(err){
        setProgress(0,"Error: "+err.message);
        statusTxt.style.color="#EF4444";
        autoPilotBtn.textContent="⚡ Run Auto-Pilot";
        autoPilotBtn.disabled=false;
      }
    };
    apCard.appendChild(autoPilotBtn);
    body.appendChild(apCard);
    body.appendChild(resultContainer);
  }

  function renderEditTab(){
    var hasVideo=!!VIDEO_EDITOR_STATE.file;
    if(!hasVideo){
      body.appendChild(div({color:"#8899AA",fontSize:"13px",fontFamily:"'Inter',sans-serif",textAlign:"center",padding:"40px 20px"},"Upload a video in Auto-Pilot tab first."));
      return;
    }

    var previewWrap=div({marginBottom:"14px",borderRadius:"12px",overflow:"hidden",background:"#000"});
    previewWrap.appendChild(video);
    body.appendChild(previewWrap);

    function sectionHdr(label,color){
      var h=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"});
      h.appendChild(div({width:"3px",height:"14px",background:color||"#EC4899",borderRadius:"2px"},""));
      h.appendChild(div({color:"#C0C8D8",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em"},label));
      return h;
    }

    // Trim
    var trimSec=div({background:"#1A1F2E",borderRadius:"12px",padding:"14px",marginBottom:"10px"});
    trimSec.appendChild(sectionHdr("TRIM","#EC4899"));
    var trimRow=div({display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"});
    trimRow.appendChild(span({style:{color:"#8899AA",fontSize:"11px"}},"Start (s):"));
    trimRow.appendChild(startInp);
    trimRow.appendChild(span({style:{color:"#8899AA",fontSize:"11px"}},"End (s):"));
    trimRow.appendChild(endInp);
    var durBadge=div({background:"rgba(201,168,76,0.12)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:"6px",padding:"4px 10px",color:"#C9A84C",fontSize:"10px",fontFamily:"monospace"});
    function refreshDurBadge(){durBadge.textContent=updateDurLabel();}
    startInp.addEventListener("input",refreshDurBadge);endInp.addEventListener("input",refreshDurBadge);
    refreshDurBadge();
    trimRow.appendChild(durBadge);
    trimSec.appendChild(trimRow);
    body.appendChild(trimSec);

    // Color Grade
    var colorSec=div({background:"#1A1F2E",borderRadius:"12px",padding:"14px",marginBottom:"10px"});
    colorSec.appendChild(sectionHdr("COLOR GRADE","#F59E0B"));
    var colorRow=div({display:"flex",gap:"6px",flexWrap:"wrap"});
    Object.keys(COLOR_GRADES).forEach(function(k){
      var g=COLOR_GRADES[k];
      var btn=el("button",{style:{background:VIDEO_EDITOR_STATE.colorPreset===k?"rgba(245,158,11,0.2)":"transparent",border:"1px solid "+(VIDEO_EDITOR_STATE.colorPreset===k?"#F59E0B":"#2A3040"),borderRadius:"8px",padding:"6px 12px",cursor:"pointer",color:VIDEO_EDITOR_STATE.colorPreset===k?"#F59E0B":"#8899AA",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",transition:"all 0.15s"}});
      btn.textContent=g.label;
      btn.onclick=function(){VIDEO_EDITOR_STATE.colorPreset=k;renderTabBody();};
      colorRow.appendChild(btn);
    });
    colorSec.appendChild(colorRow);
    body.appendChild(colorSec);

    // Subtitles
    var subSec=div({background:"#1A1F2E",borderRadius:"12px",padding:"14px",marginBottom:"10px"});
    subSec.appendChild(sectionHdr("SUBTITLES","#8B5CF6"));
    subSec.appendChild(subTextarea);
    var aiSubBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"linear-gradient(135deg,#8B5CF6,#A78BFA)",color:"#FFF",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
    aiSubBtn.textContent="✨ AI Generate Subtitles";
    aiSubBtn.onclick=async function(){
      var geminiKey=localStorage.getItem("dv_gemini_key");
      if(!geminiKey){alert("Gemini key needed — go to Setup");return;}
      aiSubBtn.disabled=true;aiSubBtn.textContent="Generating…";
      try{
        var dur=VIDEO_EDITOR_STATE.trimEnd-VIDEO_EDITOR_STATE.trimStart||VIDEO_EDITOR_STATE.duration;
        var bp=getBrandProfile()||{};
        var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({contents:[{parts:[{text:"Write 5-8 professional subtitle lines for a "+Math.round(dur)+"s Dubai real estate Instagram Reel. Agent: "+(bp.name||"")+" Tone: "+(bp.tone||"luxury professional")+". Format: M:SS Text (one per line, max 7 words each, compelling, Arabic-market-friendly). No markdown."}]}],generationConfig:{temperature:0.6}})
        });
        if(r.ok){var d=await r.json();var txt=d.candidates[0].content.parts[0].text;subTextarea.value=txt.split("\n").filter(function(l){return l.match(/\d+:\d+/);}).join("\n");}
      }catch(e){}
      aiSubBtn.textContent="✨ AI Generate Subtitles";aiSubBtn.disabled=false;
    };
    subSec.appendChild(aiSubBtn);
    body.appendChild(subSec);

    // Caption
    var capSec=div({background:"#1A1F2E",borderRadius:"12px",padding:"14px",marginBottom:"10px"});
    capSec.appendChild(sectionHdr("CAPTION + HASHTAGS","#10B981"));
    capSec.appendChild(captionInp);
    var aiCapBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"linear-gradient(135deg,#10B981,#34D399)",color:"#000",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
    aiCapBtn.textContent="✨ AI Write Caption";
    aiCapBtn.onclick=async function(){
      var geminiKey=localStorage.getItem("dv_gemini_key");
      if(!geminiKey){alert("Gemini key needed");return;}
      aiCapBtn.disabled=true;aiCapBtn.textContent="Writing…";
      try{
        var bp=getBrandProfile()||{};
        var platLabel=(PLATFORMS[VIDEO_EDITOR_STATE.platform]||PLATFORMS.reel).label;
        var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({contents:[{parts:[{text:"Write a professional "+platLabel+" caption for a Dubai real estate video. Agent: "+(bp.name||"DubAIVal")+(bp.tone?", tone: "+bp.tone:"")+". Include: hook, 3 selling points, call to action, 6-8 relevant Dubai real estate hashtags. Under 150 words. "+(bp.hashtags?"Always include: "+bp.hashtags:"")}]}],generationConfig:{temperature:0.7}})
        });
        if(r.ok){var d=await r.json();captionInp.value=d.candidates[0].content.parts[0].text;}
      }catch(e){}
      aiCapBtn.textContent="✨ AI Write Caption";aiCapBtn.disabled=false;
    };
    capSec.appendChild(aiCapBtn);
    body.appendChild(capSec);

    // Watermark toggle
    var wmSec=div({background:"#1A1F2E",borderRadius:"12px",padding:"14px",marginBottom:"14px",display:"flex",alignItems:"center",justifyContent:"space-between"});
    wmSec.appendChild(div({},[
      div({color:"#C0C8D8",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Brand Watermark"),
      div({color:"#556677",fontSize:"10px",marginTop:"2px"},"Agent name from brand profile")
    ]));
    var wmToggle=el("input",{type:"checkbox",checked:VIDEO_EDITOR_STATE.watermark,style:{width:"18px",height:"18px",cursor:"pointer",accentColor:"#EC4899"}});
    wmToggle.onchange=function(){VIDEO_EDITOR_STATE.watermark=wmToggle.checked;};
    wmSec.appendChild(wmToggle);
    body.appendChild(wmSec);

    // Render button
    var renderBtn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,#EC4899,#8B5CF6)",color:"#FFF",border:"none",borderRadius:"12px",padding:"14px",fontSize:"14px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
    renderBtn.textContent="🎬 Render Video";
    var renderStatus=div({color:"#8899AA",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",textAlign:"center",marginTop:"8px"});
    var resultContainer=div({});
    renderBtn.onclick=async function(){
      renderBtn.disabled=true;renderBtn.textContent="Rendering…";
      try{
        var blob=await renderWithOverlays(VIDEO_EDITOR_STATE.platform||"reel",function(msg){renderStatus.textContent=msg;});
        renderBtn.textContent="🎬 Re-render";renderBtn.disabled=false;
        showResultsUI(blob,captionInp.value,VIDEO_EDITOR_STATE.platform||"reel",resultContainer);
      }catch(err){renderStatus.textContent="Error: "+err.message;renderBtn.textContent="🎬 Render Video";renderBtn.disabled=false;}
    };
    body.appendChild(renderBtn);
    body.appendChild(renderStatus);
    body.appendChild(resultContainer);
  }

  function renderExportTab(){
    if(!VIDEO_EDITOR_STATE.processedBlob){
      body.appendChild(div({color:"#8899AA",fontSize:"13px",textAlign:"center",padding:"40px 20px",fontFamily:"'Inter',sans-serif"},"Run Auto-Pilot or render a video first."));
      return;
    }

    body.appendChild(div({color:"#F0F2F5",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"16px"},"Export for Each Platform"));

    Object.keys(PLATFORMS).forEach(function(k){
      var p=PLATFORMS[k];
      var row=div({background:"#1A1F2E",border:"1px solid #2A3040",borderRadius:"12px",padding:"14px",marginBottom:"10px",display:"flex",alignItems:"center",justifyContent:"space-between"});
      var info=div({});
      info.appendChild(div({color:"#E8EDF5",fontSize:"12px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace"},p.icon+" "+p.label));
      info.appendChild(div({color:"#556677",fontSize:"10px",marginTop:"2px"},p.desc+" · max "+p.maxSec+"s"));
      row.appendChild(info);
      var dlBtn=el("button",{style:{background:"#10B981",color:"#FFF",border:"none",borderRadius:"8px",padding:"8px 16px",cursor:"pointer",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"}});
      dlBtn.textContent="⬇ Download";
      dlBtn.onclick=async function(){
        dlBtn.textContent="Rendering…";dlBtn.disabled=true;
        var prevPlat=VIDEO_EDITOR_STATE.platform;
        VIDEO_EDITOR_STATE.platform=k;
        try{
          var blob=await renderWithOverlays(k,function(msg){dlBtn.textContent=msg;});
          var ext=blob.type.indexOf("mp4")!==-1?"mp4":"webm";
          var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="dubaival-"+k+"."+ext;a.click();
        }catch(e){alert("Error: "+e.message);}
        VIDEO_EDITOR_STATE.platform=prevPlat;
        dlBtn.textContent="⬇ Download";dlBtn.disabled=false;
      };
      row.appendChild(dlBtn);
      body.appendChild(row);
    });

    // Caption copy
    if(captionInp.value){
      body.appendChild(div({color:"#8899AA",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",margin:"16px 0 8px"},"POST CAPTION"));
      var capBox=div({background:"#070B14",border:"1px solid #2A3040",borderRadius:"10px",padding:"12px"});
      var capTxt=el("p",{style:{color:"#C0C8D8",fontSize:"11px",margin:"0 0 10px",whiteSpace:"pre-wrap",lineHeight:"1.6"}});
      capTxt.textContent=captionInp.value;
      capBox.appendChild(capTxt);
      var cpAllBtn=el("button",{style:{width:"100%",background:"#F97316",color:"#FFF",border:"none",borderRadius:"8px",padding:"8px",cursor:"pointer",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"}});
      cpAllBtn.textContent="📋 Copy Caption + Hashtags";
      cpAllBtn.onclick=function(){navigator.clipboard.writeText(captionInp.value).then(function(){cpAllBtn.textContent="✓ Copied!";setTimeout(function(){cpAllBtn.textContent="📋 Copy Caption + Hashtags";},2000);});};
      capBox.appendChild(cpAllBtn);
      body.appendChild(capBox);
    }
  }

  // ── FILE LOAD HANDLER ─────────────────────────────────────────────────────
  function handleFileLoad(f){
    if(f.size>500*1024*1024){alert("File too large — max 500MB");return;}
    VIDEO_EDITOR_STATE.file=f;
    if(VIDEO_EDITOR_STATE.url)URL.revokeObjectURL(VIDEO_EDITOR_STATE.url);
    VIDEO_EDITOR_STATE.url=URL.createObjectURL(f);
    video.src=VIDEO_EDITOR_STATE.url;
    video.onloadedmetadata=function(){
      VIDEO_EDITOR_STATE.duration=video.duration;
      VIDEO_EDITOR_STATE.trimStart=0;
      VIDEO_EDITOR_STATE.trimEnd=Math.min(30,video.duration);
      startInp.value="0";endInp.value=VIDEO_EDITOR_STATE.trimEnd.toFixed(1);
      switchTab("Auto-Pilot");
    };
  }
  fileInput.onchange=function(ev){var f=ev.target.files[0];if(f)handleFileLoad(f);};

  overlay.appendChild(card);
  overlay.addEventListener("click",function(ev){if(ev.target===overlay){closeX.onclick();}});
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
      ctx.fillText("Location",W/2,H*0.1);
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

  // ── World-Class AI Video Studio ────────────────────────────────────────────
  var VG_STATE={
    template:null,platform:"reel",language:"en",hookType:"emotional",
    prompt:"",mediaPhotos:[],mediaVideos:[],floorPlans:[],musicType:"luxury",
    musicFile:null,locationText:"",processing:false,resultBlob:null,resultUrl:null,
    plan:null,activeTab:"setup"
  };

  var CONTENT_TEMPLATES={
    property_tour:{icon:"🏠",label:"Property Tour",color:"#C9A84C",
      prompt:"Create a cinematic property tour video showcasing [building name] in [area], Dubai. Highlight the views, finishes, amenities, floor plan, and investment value. Include price per sqft and rental yield data.",
      hookType:"emotional",desc:"Show the full property experience"},
    market_report:{icon:"📊",label:"Market Report",color:"#3B82F6",
      prompt:"Create a professional Dubai real estate market report video for [area]. Include current price per sqft, rental yields, price growth trends, and why investors should consider this area now.",
      hookType:"statistic",desc:"Data-driven area analysis"},
    investment_pitch:{icon:"💰",label:"Investment Pitch",color:"#10B981",
      prompt:"Create a compelling investment pitch video for [property/building] in Dubai. Focus on ROI, rental yield, capital appreciation, location advantages, and developer reputation. Target HNW investors.",
      hookType:"statistic",desc:"Convince investors to act now"},
    area_guide:{icon:"🗺",label:"Area Guide",color:"#8B5CF6",
      prompt:"Create an area guide video for [area], Dubai. Cover lifestyle, amenities, transport links, nearby schools, beaches, malls, and why families and professionals choose to live here.",
      hookType:"story",desc:"Complete lifestyle overview"},
    luxury_showcase:{icon:"✨",label:"Luxury Showcase",color:"#EC4899",
      prompt:"Create a luxury property showcase video for [building/project] in Dubai. Emphasize exclusivity, world-class finishes, iconic views, premium amenities, and elite lifestyle. Brand: aspirational and prestigious.",
      hookType:"emotional",desc:"High-end aspirational content"},
    deal_alert:{icon:"🔔",label:"Deal Alert",color:"#F59E0B",
      prompt:"Create an urgent deal alert video for a limited-time opportunity at [building/area] in Dubai. Show the asking price vs market value, the discount, and why buyers must act fast before this deal is gone.",
      hookType:"question",desc:"Time-sensitive opportunity"}
  };

  var VG_PLATFORMS={
    reel:{label:"Instagram Reel",icon:"📱",desc:"9:16 • up to 90s",w:1080,h:1920,maxSec:90},
    story:{label:"Story / TikTok",icon:"🎵",desc:"9:16 • up to 60s",w:1080,h:1920,maxSec:60},
    square:{label:"Square Post",icon:"⬜",desc:"1:1 • Feed",w:1080,h:1080,maxSec:60},
    landscape:{label:"YouTube / LinkedIn",icon:"🖥",desc:"16:9 • up to 10min",w:1920,h:1080,maxSec:600},
    whatsapp:{label:"WhatsApp Status",icon:"💬",desc:"9:16 • 30s max",w:1080,h:1920,maxSec:30}
  };

  var HOOK_TYPES={
    emotional:{label:"Emotional",icon:"❤️",desc:"Triggers desire & aspiration"},
    statistic:{label:"Statistic",icon:"📈",desc:"Opens with a surprising number"},
    question:{label:"Question",icon:"❓",desc:"Asks something the viewer must answer"},
    story:{label:"Story",icon:"📖",desc:"Opens with a narrative or journey"}
  };

  var LANGUAGES={en:"English",ar:"العربية",ru:"Русский",fa:"فارسی"};

  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",padding:"16px"},id:"video-gen-modal"});
  var card=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"20px",width:"720px",maxWidth:"97vw",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.8)"});

  // ── Header ──────────────────────────────────────────────────────────────────
  var vgHeader=div({background:"linear-gradient(135deg,#0A0E1A,#0D1220)",borderBottom:"1px solid #2A3040",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"});
  var vgHL=div({display:"flex",alignItems:"center",gap:"12px"});
  vgHL.appendChild(div({width:"10px",height:"10px",borderRadius:"50%",background:"#C9A84C",boxShadow:"0 0 8px #C9A84C"},""));
  vgHL.appendChild(div({color:"#F0F2F5",fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AI Video Studio"));
  vgHL.appendChild(div({background:"rgba(201,168,76,0.12)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:"6px",padding:"2px 8px",color:"#C9A84C",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em"},"PRO"));
  vgHeader.appendChild(vgHL);
  var vgClose=el("button",{style:{background:"transparent",border:"none",color:"#8899AA",fontSize:"20px",cursor:"pointer",padding:"4px 8px",borderRadius:"6px",lineHeight:"1"}});
  vgClose.textContent="×";vgClose.onclick=function(){if(VG_STATE.resultUrl)URL.revokeObjectURL(VG_STATE.resultUrl);overlay.remove();};
  vgHeader.appendChild(vgClose);
  card.appendChild(vgHeader);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  var VG_TABS=["setup","create","results"];
  var vgTabBar=div({display:"flex",borderBottom:"1px solid #2A3040",background:"#070B14"});
  var vgTabBtns={};
  VG_TABS.forEach(function(t){
    var btn=el("button",{style:{flex:"1",background:"transparent",border:"none",borderBottom:"2px solid transparent",padding:"12px",fontSize:"12px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",transition:"all 0.15s",color:"#556677"}});
    var labels={setup:"⚙ Setup",create:"🎬 Create",results:"📤 Results"};
    btn.textContent=labels[t];
    btn.onclick=function(){vgSwitchTab(t);};
    vgTabBtns[t]=btn;
    vgTabBar.appendChild(btn);
  });
  card.appendChild(vgTabBar);

  var vgBody=div({padding:"20px",minHeight:"420px"});
  card.appendChild(vgBody);

  // ── Shared elements ────────────────────────────────────────────────────────
  var promptInp=el("textarea",{style:{width:"100%",background:"#0D1220",border:"1px solid #2A3040",borderRadius:"10px",padding:"12px",color:"#E0E0E0",fontSize:"13px",fontFamily:"'Inter',sans-serif",resize:"vertical",minHeight:"70px",boxSizing:"border-box"},placeholder:"e.g. Showcase Vida Dubai Mall Tower 1 — views, amenities, 7% yield, why investors should buy now..."});
  if(initialPrompt)promptInp.value=initialPrompt;

  var userPhotoFiles=[];var userVideoFiles=[];var floorPlanFiles=[];var musicFileRef=null;

  function vgSwitchTab(t){
    VG_STATE.activeTab=t;
    VG_TABS.forEach(function(n){
      vgTabBtns[n].style.color=n===t?"#C9A84C":"#556677";
      vgTabBtns[n].style.borderBottomColor=n===t?"#C9A84C":"transparent";
      vgTabBtns[n].style.background=n===t?"rgba(201,168,76,0.05)":"transparent";
    });
    vgBody.innerHTML="";
    if(t==="setup")renderVGSetup();
    else if(t==="create")renderVGCreate();
    else renderVGResults();
  }

  // ── SETUP TAB ─────────────────────────────────────────────────────────────
  function renderVGSetup(){
    // Content Templates
    var tplSec=div({marginBottom:"20px"});
    tplSec.appendChild(div({color:"#8899AA",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",marginBottom:"10px"},"VIDEO TYPE"));
    var tplGrid=div({display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"});
    Object.keys(CONTENT_TEMPLATES).forEach(function(key){
      var t=CONTENT_TEMPLATES[key];
      var isSelected=VG_STATE.template===key;
      var btn=div({background:isSelected?"rgba("+hexToRgb(t.color)+",0.12)":"rgba(255,255,255,0.02)",border:"1px solid "+(isSelected?t.color:"#2A3040"),borderRadius:"10px",padding:"10px 8px",cursor:"pointer",textAlign:"center",transition:"all 0.15s"});
      btn.appendChild(div({fontSize:"20px",marginBottom:"4px"},t.icon));
      btn.appendChild(div({color:isSelected?t.color:"#C0C8D8",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},t.label));
      btn.appendChild(div({color:"#556677",fontSize:"9px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},t.desc));
      btn.onclick=function(){
        VG_STATE.template=key;VG_STATE.hookType=t.hookType;
        if(!promptInp.value.trim()||promptInp.getAttribute("data-auto")==="1"){
          promptInp.value=t.prompt;promptInp.setAttribute("data-auto","1");
        }
        renderVGSetup();
      };
      tplGrid.appendChild(btn);
    });
    tplSec.appendChild(tplGrid);
    vgBody.appendChild(tplSec);

    // Platform Selector
    var platSec=div({marginBottom:"20px"});
    platSec.appendChild(div({color:"#8899AA",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",marginBottom:"10px"},"PLATFORM"));
    var platRow=div({display:"flex",gap:"8px",overflowX:"auto",paddingBottom:"4px"});
    Object.keys(VG_PLATFORMS).forEach(function(pkey){
      var p=VG_PLATFORMS[pkey];
      var isSel=VG_STATE.platform===pkey;
      var pb=div({background:isSel?"rgba(201,168,76,0.12)":"rgba(255,255,255,0.02)",border:"1px solid "+(isSel?"#C9A84C":"#2A3040"),borderRadius:"10px",padding:"10px 12px",cursor:"pointer",minWidth:"100px",textAlign:"center",flexShrink:"0",transition:"all 0.15s"});
      pb.appendChild(div({fontSize:"18px",marginBottom:"3px"},p.icon));
      pb.appendChild(div({color:isSel?"#C9A84C":"#C0C8D8",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},p.label));
      pb.appendChild(div({color:"#556677",fontSize:"9px",marginTop:"2px"},p.desc));
      pb.onclick=function(){VG_STATE.platform=pkey;renderVGSetup();};
      platRow.appendChild(pb);
    });
    platSec.appendChild(platRow);
    vgBody.appendChild(platSec);

    // Language + Hook type row
    var optRow2=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"20px"});

    var langWrap=div({});
    langWrap.appendChild(div({color:"#8899AA",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",marginBottom:"8px"},"LANGUAGE"));
    var langRow=div({display:"flex",gap:"6px",flexWrap:"wrap"});
    Object.keys(LANGUAGES).forEach(function(lk){
      var isSel=VG_STATE.language===lk;
      var lb=div({background:isSel?"rgba(139,92,246,0.15)":"rgba(255,255,255,0.02)",border:"1px solid "+(isSel?"#8B5CF6":"#2A3040"),borderRadius:"8px",padding:"5px 10px",cursor:"pointer",color:isSel?"#A78BFA":"#8899AA",fontSize:"11px",fontFamily:"'Inter',sans-serif",transition:"all 0.15s"});
      lb.textContent=LANGUAGES[lk];lb.onclick=function(){VG_STATE.language=lk;renderVGSetup();};
      langRow.appendChild(lb);
    });
    langWrap.appendChild(langRow);
    optRow2.appendChild(langWrap);

    var hookWrap=div({});
    hookWrap.appendChild(div({color:"#8899AA",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",marginBottom:"8px"},"HOOK TYPE"));
    var hookRow=div({display:"flex",gap:"6px",flexWrap:"wrap"});
    Object.keys(HOOK_TYPES).forEach(function(hk){
      var h=HOOK_TYPES[hk];
      var isSel=VG_STATE.hookType===hk;
      var hb=div({background:isSel?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.02)",border:"1px solid "+(isSel?"#3B82F6":"#2A3040"),borderRadius:"8px",padding:"5px 8px",cursor:"pointer",color:isSel?"#93C5FD":"#8899AA",fontSize:"10px",fontFamily:"'Inter',sans-serif",transition:"all 0.15s",title:h.desc});
      hb.textContent=h.icon+" "+h.label;hb.onclick=function(){VG_STATE.hookType=hk;renderVGSetup();};
      hookRow.appendChild(hb);
    });
    hookWrap.appendChild(hookRow);
    optRow2.appendChild(hookWrap);
    vgBody.appendChild(optRow2);

    // Brand bar (auto-apply)
    var bp=getBrandProfile();
    if(bp&&bp.name){
      var brandBar=div({background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:"10px",padding:"10px 14px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"10px"});
      brandBar.appendChild(div({fontSize:"16px"},"✦"));
      var bbText=div({flex:"1"});
      bbText.appendChild(div({color:"#C9A84C",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Brand Auto-Apply: "+bp.name+(bp.agency?" · "+bp.agency:"")));
      bbText.appendChild(div({color:"#8899AA",fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},"Your watermark, contact info & tone will be applied automatically"));
      brandBar.appendChild(bbText);
      vgBody.appendChild(brandBar);
    }

    // Prompt
    var promptSec=div({marginBottom:"16px"});
    promptSec.appendChild(div({color:"#8899AA",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",marginBottom:"8px"},"VIDEO DESCRIPTION"));
    promptInp.style.display="block";
    promptSec.appendChild(promptInp);
    vgBody.appendChild(promptSec);

    // Media Uploads (collapsible)
    var mediaToggle=div({background:"rgba(255,255,255,0.02)",border:"1px solid #2A3040",borderRadius:"10px",marginBottom:"12px",overflow:"hidden"});
    var mediaHdr=div({display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer"});
    mediaHdr.appendChild(div({color:"#C0C8D8",fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace"},"📎 Add Your Media (photos, videos, floor plans)"));
    var mediaChevron=div({color:"#8899AA",fontSize:"12px",transition:"transform 0.2s"},"▼");
    mediaHdr.appendChild(mediaChevron);
    var mediaBody=div({padding:"12px",borderTop:"1px solid #2A3040",display:"none"});

    mediaHdr.onclick=function(){
      var open=mediaBody.style.display==="block";
      mediaBody.style.display=open?"none":"block";
      mediaChevron.style.transform=open?"":"rotate(180deg)";
    };

    function vgMakeUploadSlot(label,accept,multiple,onFiles){
      var slot=div({marginBottom:"10px"});
      slot.appendChild(div({color:"#8899AA",fontSize:"10px",marginBottom:"4px"},label));
      var inp=el("input",{type:"file",accept:accept,multiple:multiple,style:{fontSize:"10px",color:"#8899AA",width:"100%"}});
      var prev=div({display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"4px"});
      inp.onchange=function(){onFiles(Array.from(inp.files||[]),prev);};
      slot.appendChild(inp);slot.appendChild(prev);
      return slot;
    }

    mediaBody.appendChild(vgMakeUploadSlot("Photos (blended into slides)","image/*",true,function(files,prev){
      userPhotoFiles=files;prev.innerHTML="";
      files.forEach(function(f){var img=el("img",{style:{width:"44px",height:"44px",objectFit:"cover",borderRadius:"6px",border:"1px solid #C9A84C"}});img.src=URL.createObjectURL(f);prev.appendChild(img);});
    }));
    mediaBody.appendChild(vgMakeUploadSlot("Your Videos (merged into final)","video/*",true,function(files,prev){
      userVideoFiles=files;prev.innerHTML="";
      files.forEach(function(f){var t=div({background:"#2A3040",borderRadius:"6px",padding:"4px 8px",fontSize:"9px",color:"#E0E0E0"});t.textContent=f.name.slice(0,18);prev.appendChild(t);});
    }));
    mediaBody.appendChild(vgMakeUploadSlot("Floor Plans (shown as dedicated slide)","image/*",true,function(files,prev){
      floorPlanFiles=files;prev.innerHTML="";
      files.forEach(function(f){var img=el("img",{style:{width:"44px",height:"44px",objectFit:"contain",borderRadius:"6px",border:"1px solid #10B981",background:"#FFF"}});img.src=URL.createObjectURL(f);prev.appendChild(img);});
    }));

    // Location
    var locInp=el("input",{style:{width:"100%",background:"#0D1220",border:"1px solid #2A3040",borderRadius:"8px",padding:"7px 10px",color:"#E0E0E0",fontSize:"11px",boxSizing:"border-box"},placeholder:"e.g. Dubai Marina, Palm Jumeirah..."});
    locInp.oninput=function(){VG_STATE.locationText=locInp.value.trim();};
    if(VG_STATE.locationText)locInp.value=VG_STATE.locationText;
    mediaBody.appendChild(vgMakeUploadSlot("Location / Map",null,false,function(){}));
    mediaBody.lastChild.appendChild(locInp);

    // Music
    var musicSel=el("select",{style:{width:"100%",background:"#0D1220",border:"1px solid #2A3040",borderRadius:"8px",padding:"7px 10px",color:"#E0E0E0",fontSize:"11px",marginBottom:"6px"}});
    [["none","No Music"],["ambient","Ambient Piano"],["upbeat","Upbeat Corporate"],["luxury","Luxury Orchestral"],["chill","Chill Lofi"],["dramatic","Dramatic Cinematic"],["custom","Upload Your Music"]].forEach(function(o){
      var opt=el("option");opt.value=o[0];opt.textContent=o[1];if(o[0]===VG_STATE.musicType)opt.selected=true;musicSel.appendChild(opt);
    });
    musicSel.onchange=function(){VG_STATE.musicType=musicSel.value;};
    var musicInp=el("input",{type:"file",accept:"audio/*",style:{fontSize:"10px",color:"#8899AA",display:"none",width:"100%",marginTop:"4px"}});
    musicSel.onchange=function(){VG_STATE.musicType=musicSel.value;musicInp.style.display=musicSel.value==="custom"?"block":"none";};
    musicInp.onchange=function(){musicFileRef=musicInp.files[0]||null;};
    var musicWrap=div({marginBottom:"4px"});
    musicWrap.appendChild(div({color:"#8899AA",fontSize:"10px",marginBottom:"4px"},"Background Music"));
    musicWrap.appendChild(musicSel);musicWrap.appendChild(musicInp);
    mediaBody.appendChild(musicWrap);

    mediaToggle.appendChild(mediaHdr);mediaToggle.appendChild(mediaBody);
    vgBody.appendChild(mediaToggle);

    // Generate Button
    var genBtn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,#C9A84C,#F59E0B)",color:"#000",border:"none",borderRadius:"12px",padding:"16px",fontSize:"15px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.05em"}});
    genBtn.textContent="🎬 Generate Video";
    genBtn.onclick=function(){
      var prompt=promptInp.value.trim();
      if(!prompt){alert("Please enter a video description or select a template");return;}
      if(!localStorage.getItem("dv_gemini_key")){alert("Add your Gemini API key in Setup first");return;}
      VG_STATE.prompt=prompt;
      vgSwitchTab("create");
      setTimeout(runVGPipeline,100);
    };
    vgBody.appendChild(genBtn);
  }

  // ── CREATE TAB (pipeline) ─────────────────────────────────────────────────
  var vgStepEls={};
  var vgProgressFill,vgProgressLabel,vgPreviewCanvas;

  function renderVGCreate(){
    var steps=[
      {key:"plan",icon:"🤖",label:"AI Planning",desc:"Analyzing prompt, creating script & slide structure"},
      {key:"data",icon:"📊",label:"Market Data",desc:"Enriching with live Dubai property data"},
      {key:"images",icon:"🖼",label:"Gathering Visuals",desc:"Finding the perfect images for each slide"},
      {key:"brand",icon:"✦",label:"Applying Brand",desc:"Adding watermark, tone & brand elements"},
      {key:"music",icon:"🎵",label:"Music & Audio",desc:"Composing background music"},
      {key:"render",icon:"🎬",label:"Rendering Video",desc:"Compositing all elements frame by frame"},
      {key:"voice",icon:"🎤",label:"Voiceover",desc:"Generating professional voiceover narration"}
    ];

    vgBody.appendChild(div({color:"#8899AA",fontSize:"11px",fontFamily:"'Inter',sans-serif",marginBottom:"16px",textAlign:"center"},"Creating your world-class video..."));

    var pBarWrap=div({marginBottom:"20px"});
    var pBarOuter=div({width:"100%",height:"6px",background:"#1A1F2E",borderRadius:"3px",overflow:"hidden"});
    vgProgressFill=div({width:"0%",height:"100%",background:"linear-gradient(90deg,#C9A84C,#F59E0B)",borderRadius:"3px",transition:"width 0.4s ease"});
    pBarOuter.appendChild(vgProgressFill);
    pBarWrap.appendChild(pBarOuter);
    vgProgressLabel=div({color:"#C9A84C",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",marginTop:"8px",textAlign:"center"});
    pBarWrap.appendChild(vgProgressLabel);
    vgBody.appendChild(pBarWrap);

    var stepsGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"});
    steps.forEach(function(s){
      var row=div({background:"rgba(255,255,255,0.02)",border:"1px solid #1A1F2E",borderRadius:"10px",padding:"10px 12px",display:"flex",alignItems:"flex-start",gap:"10px"});
      var dot=div({width:"8px",height:"8px",borderRadius:"50%",background:"#2A3040",flexShrink:"0",marginTop:"3px",transition:"background 0.3s"});
      var txt=div({flex:"1"});
      txt.appendChild(div({color:"#C0C8D8",fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace"},s.icon+" "+s.label));
      txt.appendChild(div({color:"#556677",fontSize:"9px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},s.desc));
      row.appendChild(dot);row.appendChild(txt);
      vgStepEls[s.key]={row:row,dot:dot};
      stepsGrid.appendChild(row);
    });
    vgBody.appendChild(stepsGrid);

    var canvasWrap=div({textAlign:"center",marginBottom:"12px",display:"none"});
    vgPreviewCanvas=el("canvas",{style:{maxWidth:"200px",maxHeight:"200px",borderRadius:"10px",border:"1px solid #2A3040"}});
    canvasWrap.appendChild(vgPreviewCanvas);
    vgBody.appendChild(canvasWrap);
    vgPreviewCanvas._wrap=canvasWrap;
  }

  function vgSetStep(key,state){
    var s=vgStepEls[key];if(!s)return;
    var colors={pending:"#2A3040",active:"#F59E0B",done:"#10B981",error:"#EF4444"};
    s.dot.style.background=colors[state]||"#2A3040";
    s.dot.style.boxShadow=state==="active"?"0 0 6px #F59E0B":state==="done"?"0 0 4px #10B981":"none";
    s.row.style.borderColor=state==="active"?"rgba(245,158,11,0.4)":state==="done"?"rgba(16,185,129,0.3)":"#1A1F2E";
    s.row.style.background=state==="active"?"rgba(245,158,11,0.05)":state==="done"?"rgba(16,185,129,0.04)":"rgba(255,255,255,0.02)";
  }

  function vgProgress(pct,label){
    if(vgProgressFill)vgProgressFill.style.width=pct+"%";
    if(vgProgressLabel)vgProgressLabel.textContent=label||"";
  }

  // ── PIPELINE RUNNER ────────────────────────────────────────────────────────
  async function runVGPipeline(){
    try{
      var prompt=VG_STATE.prompt;
      var plat=VG_PLATFORMS[VG_STATE.platform]||VG_PLATFORMS.reel;
      var langNote=VG_STATE.language!=="en"?"Generate all text (captions, voiceover) in "+LANGUAGES[VG_STATE.language]+". ":"";
      var hookNote=VG_STATE.hookType?("Hook style: "+HOOK_TYPES[VG_STATE.hookType].label+" — "+HOOK_TYPES[VG_STATE.hookType].desc+". "):"";
      var fullPrompt=langNote+hookNote+prompt;

      // Step 1: Plan
      vgSetStep("plan","active");vgProgress(5,"AI planning your video...");
      var plan=await parseVideoPromptAI(fullPrompt);
      if(!plan||!plan.slides)throw new Error("AI could not create video plan");
      VG_STATE.plan=plan;
      vgSetStep("plan","done");

      // Step 2: Enrich with DB data
      vgSetStep("data","active");vgProgress(15,"Loading real market data...");
      plan=enrichPlanWithDB(plan);
      vgSetStep("data","done");

      // Step 3: Gather images
      vgSetStep("images","active");vgProgress(22,"Finding "+plan.slides.length+" visuals...");
      await gatherVideoImages(plan);

      // Load user photos
      var userImgs=[];
      for(var ui=0;ui<userPhotoFiles.length;ui++){
        var uimg=await loadImg(URL.createObjectURL(userPhotoFiles[ui]));
        if(uimg)userImgs.push(uimg);
      }
      // Load floor plans as slides
      for(var fi=0;fi<floorPlanFiles.length;fi++){
        var fpImg=await loadImg(URL.createObjectURL(floorPlanFiles[fi]));
        if(fpImg){
          var fpSlide={type:"floorplan",text:"Floor Plan",_fpImg:fpImg};
          plan.slides.splice(Math.min(plan.slides.length-1,Math.round(plan.slides.length*0.6)+fi),0,fpSlide);
        }
      }
      // Load user videos as slides
      var userVids=[];
      for(var vi=0;vi<userVideoFiles.length;vi++){
        var vEl=document.createElement("video");
        vEl.src=URL.createObjectURL(userVideoFiles[vi]);vEl.muted=true;vEl.playsInline=true;
        await new Promise(function(r){vEl.onloadedmetadata=r;vEl.onerror=r;});
        if(vEl.duration>0){
          userVids.push(vEl);
          var vidSlide={type:"user_video",text:"",_vidEl:vEl,_vidDur:Math.min(vEl.duration,10)};
          plan.slides.splice(Math.min(plan.slides.length-1,Math.round(plan.slides.length*0.4)+vi),0,vidSlide);
        }
      }
      if(VG_STATE.locationText)plan.slides.splice(Math.max(1,plan.slides.length-2),0,{type:"map",text:VG_STATE.locationText,_location:VG_STATE.locationText});
      plan.duration=Math.max(plan.duration||30,plan.slides.length*3.5);
      vgSetStep("images","done");

      // Step 4: Brand
      vgSetStep("brand","active");vgProgress(32,"Applying brand identity...");
      await new Promise(function(r){setTimeout(r,200);});
      vgSetStep("brand","done");

      // Step 5: Music
      vgSetStep("music","active");vgProgress(38,"Composing background music...");
      var musicCtx=null,musicDest=null;
      var mType=VG_STATE.musicType;
      if(mType!=="none"){
        try{
          musicCtx=new(window.AudioContext||window.webkitAudioContext)();
          musicDest=musicCtx.createMediaStreamDestination();
          if(mType==="custom"&&musicFileRef){
            var abuf=await musicFileRef.arrayBuffer();
            var aBuf=await musicCtx.decodeAudioData(abuf);
            var mSrc=musicCtx.createBufferSource();mSrc.buffer=aBuf;mSrc.loop=true;
            var mGain=musicCtx.createGain();mGain.gain.value=0.15;
            mSrc.connect(mGain);mGain.connect(musicDest);mSrc.start();
          }else{
            var mPresets={
              ambient:{notes:[261.6,329.6,392,523.3],pad:true,vol:0.025,lfoRate:0.15,detune:6},
              upbeat:{notes:[329.6,392,493.9,659.3],pad:false,vol:0.02,lfoRate:0.6,detune:3},
              luxury:{notes:[220,277.2,329.6,440],pad:true,vol:0.022,lfoRate:0.1,detune:8},
              chill:{notes:[196,261.6,293.7,392],pad:true,vol:0.02,lfoRate:0.2,detune:5},
              dramatic:{notes:[146.8,220,293.7,440],pad:false,vol:0.018,lfoRate:0.4,detune:4}
            };
            var mPr=mPresets[mType]||mPresets.luxury;
            var mMaster=musicCtx.createGain();mMaster.gain.value=mPr.vol;mMaster.connect(musicDest);
            mPr.notes.forEach(function(freq,ni){
              var o1=musicCtx.createOscillator();o1.type="sine";o1.frequency.value=freq;o1.detune.value=mPr.detune;
              var o2=musicCtx.createOscillator();o2.type="triangle";o2.frequency.value=freq*1.002;
              var oG=musicCtx.createGain();oG.gain.value=ni===0?1:0.6;
              var lfo=musicCtx.createOscillator();lfo.type="sine";lfo.frequency.value=mPr.lfoRate+ni*0.05;
              var lfoG=musicCtx.createGain();lfoG.gain.value=mPr.pad?freq*0.02:freq*0.01;
              lfo.connect(lfoG);lfoG.connect(o1.frequency);lfo.start();
              o1.connect(oG);o2.connect(oG);oG.connect(mMaster);o1.start();o2.start();
            });
            var sub=musicCtx.createOscillator();sub.type="sine";sub.frequency.value=mPr.notes[0]/2;
            var subG=musicCtx.createGain();subG.gain.value=0.4;sub.connect(subG);subG.connect(mMaster);sub.start();
          }
        }catch(me){musicCtx=null;musicDest=null;}
      }
      vgSetStep("music","done");

      // Step 6: Render
      vgSetStep("render","active");vgProgress(45,"Rendering video...");
      var cW=plat.w,cH=plat.h;
      vgPreviewCanvas.width=cW;vgPreviewCanvas.height=cH;
      if(vgPreviewCanvas._wrap)vgPreviewCanvas._wrap.style.display="block";
      var pCtx=vgPreviewCanvas.getContext("2d");
      var blob=await renderVideoFrames(vgPreviewCanvas,pCtx,plan,function(pct){
        vgProgress(45+pct*0.45,"Rendering... "+pct+"%");
      },userImgs,musicDest);
      if(musicCtx){try{musicCtx.close();}catch(e){}}
      userVids.forEach(function(v){try{v.pause();v.src="";}catch(e){}});
      vgSetStep("render","done");

      // Step 7: Voiceover
      vgSetStep("voice","active");vgProgress(92,"Generating voiceover...");
      var voAudio=null;
      if(plan.voiceover&&plan.voiceover.length>0){
        try{voAudio=await speakVoiceoverEL(plan.voiceover,3);}catch(e){}
      }
      vgSetStep("voice","done");

      vgProgress(100,"Video ready!");
      VG_STATE.resultBlob=blob;
      VG_STATE.resultUrl=URL.createObjectURL(blob);
      VG_STATE.plan=plan;
      VG_STATE._voAudio=voAudio;

      setTimeout(function(){vgSwitchTab("results");},800);
    }catch(err){
      vgProgress(0,"Error: "+err.message);
      Object.keys(vgStepEls).forEach(function(k){if(vgStepEls[k].dot.style.background==="#F59E0B")vgSetStep(k,"error");});
      var retryBtn=el("button",{style:{width:"100%",background:"#2A3040",color:"#E0E0E0",border:"none",borderRadius:"10px",padding:"12px",fontSize:"12px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",marginTop:"12px"}});
      retryBtn.textContent="← Back to Setup";
      retryBtn.onclick=function(){vgSwitchTab("setup");};
      vgBody.appendChild(retryBtn);
    }
  }

  // ── RESULTS TAB ───────────────────────────────────────────────────────────
  function renderVGResults(){
    if(!VG_STATE.resultBlob){
      vgBody.appendChild(div({color:"#8899AA",fontSize:"13px",textAlign:"center",padding:"40px 0"},"No video yet — go to Setup to generate one."));
      var backBtn2=el("button",{style:{display:"block",margin:"16px auto",background:"#C9A84C",color:"#000",border:"none",borderRadius:"10px",padding:"12px 28px",fontSize:"12px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
      backBtn2.textContent="← Back to Setup";backBtn2.onclick=function(){vgSwitchTab("setup");};
      vgBody.appendChild(backBtn2);
      return;
    }
    var plan=VG_STATE.plan||{};
    var blob=VG_STATE.resultBlob;
    var voAudio=VG_STATE._voAudio;
    var isMP4=blob.type.indexOf("mp4")!==-1;
    var vidExt=isMP4?"mp4":"webm";

    // Video player
    var videoEl=el("video",{style:{width:"100%",maxHeight:"360px",borderRadius:"12px",marginBottom:"14px",background:"#000"},controls:true,src:VG_STATE.resultUrl});
    if(voAudio){
      videoEl.onplay=function(){voAudio.currentTime=0;voAudio.play();};
      videoEl.onpause=function(){voAudio.pause();};
      videoEl.onseeked=function(){voAudio.currentTime=videoEl.currentTime;};
    }
    vgBody.appendChild(videoEl);

    // Stats row
    var plat=VG_PLATFORMS[VG_STATE.platform]||VG_PLATFORMS.reel;
    var statsRow=div({display:"flex",gap:"8px",marginBottom:"14px",flexWrap:"wrap"});
    [[plat.icon,plat.label],["📐",plat.w+"×"+plat.h],["🎬",(plan.slides||[]).length+" slides"],["🌐",LANGUAGES[VG_STATE.language]||"English"]].forEach(function(s){
      var chip=div({background:"rgba(255,255,255,0.04)",border:"1px solid #2A3040",borderRadius:"8px",padding:"5px 10px",color:"#C0C8D8",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"});
      chip.textContent=s[0]+" "+s[1];statsRow.appendChild(chip);
    });
    vgBody.appendChild(statsRow);

    // Caption box
    if(plan.caption){
      var capBox=div({background:"rgba(255,255,255,0.03)",border:"1px solid #2A3040",borderRadius:"10px",padding:"12px",marginBottom:"14px"});
      capBox.appendChild(div({color:"#C9A84C",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"CAPTION"));
      var capTxt=el("div",{style:{color:"#E0E0E0",fontSize:"11px",fontFamily:"'Inter',sans-serif",whiteSpace:"pre-wrap",lineHeight:"1.5"}});
      capTxt.textContent=plan.caption;capBox.appendChild(capTxt);
      vgBody.appendChild(capBox);
    }

    // Action buttons
    var actGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"});

    var dlBtn=el("button",{style:{background:"#10B981",color:"#FFF",border:"none",borderRadius:"10px",padding:"12px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
    dlBtn.textContent="⬇ Download "+vidExt.toUpperCase();
    dlBtn.onclick=function(){var a=document.createElement("a");a.href=VG_STATE.resultUrl;a.download="dubaival-video."+vidExt;a.click();};
    actGrid.appendChild(dlBtn);

    var shareBtn2=el("button",{style:{background:"#3B82F6",color:"#FFF",border:"none",borderRadius:"10px",padding:"12px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
    shareBtn2.textContent="↗ Share";
    shareBtn2.onclick=function(){showShareModal({text:plan.caption||"",file:blob,fileName:"dubaival-video."+vidExt,fileType:blob.type,title:"DubAIVal Video"});};
    actGrid.appendChild(shareBtn2);

    if(plan.caption){
      var cpBtn2=el("button",{style:{background:"#F97316",color:"#FFF",border:"none",borderRadius:"10px",padding:"12px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
      cpBtn2.textContent="📋 Copy Caption";
      cpBtn2.onclick=function(){navigator.clipboard.writeText(plan.caption).then(function(){cpBtn2.textContent="✓ Copied!";setTimeout(function(){cpBtn2.textContent="📋 Copy Caption";},2000);});};
      actGrid.appendChild(cpBtn2);
    }

    if(voAudio){
      var voBtn2=el("button",{style:{background:"#8B5CF6",color:"#FFF",border:"none",borderRadius:"10px",padding:"12px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
      voBtn2.textContent="🎤 Play + Voice";
      voBtn2.onclick=function(){videoEl.currentTime=0;videoEl.play();};
      actGrid.appendChild(voBtn2);
    }
    vgBody.appendChild(actGrid);

    // Optional next steps — enhance before publishing
    var vgNextSec=div({background:"rgba(255,255,255,0.02)",border:"1px solid #2A3040",borderRadius:"12px",padding:"12px",marginBottom:"10px"});
    vgNextSec.appendChild(div({color:"#556677",fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",marginBottom:"10px"}),"✦ OPTIONAL — ENHANCE BEFORE PUBLISHING");
    var vgNextRow=div({display:"flex",gap:"6px",flexWrap:"wrap"});
    var vgCaption=plan.caption||"";
    [
      {icon:"🎨",label:"Design Cover",desc:"Thumbnail / companion image",fn:function(){showPostDesigner(vgCaption);}},
      {icon:"👁",label:"Preview Post",desc:"See how it looks on feed",fn:function(){showPostPreview(vgCaption,null);}},
      {icon:"📱",label:"Story Template",desc:"Create a story too",fn:function(){showStoryTemplates();}}
    ].forEach(function(step){
      var nb=el("button",{style:{flex:"1",minWidth:"100px",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"10px",padding:"10px 8px",cursor:"pointer",textAlign:"center",transition:"all 0.2s",fontFamily:"inherit"}});
      nb.innerHTML="<div style='font-size:20px;margin-bottom:4px'>"+step.icon+"</div><div style='color:#C0C8D8;font-size:10px;font-weight:600;font-family:Space Grotesk,monospace'>"+step.label+"</div><div style='color:#556677;font-size:9px;margin-top:2px;font-family:Inter,sans-serif'>"+step.desc+"</div>";
      nb.onmouseenter=function(){nb.style.borderColor="#C9A84C";nb.style.background="rgba(201,168,76,0.05)";};
      nb.onmouseleave=function(){nb.style.borderColor="#2A3040";nb.style.background="#0D1117";};
      nb.onclick=step.fn;vgNextRow.appendChild(nb);
    });
    vgNextSec.appendChild(vgNextRow);vgBody.appendChild(vgNextSec);

    // Unified publish bar — same flow as Chat tab
    showVideoPublishBar(blob,plan.caption||"",vgBody);

    // Re-generate button
    var makeNewBtn=el("button",{style:{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid #2A3040",color:"#8899AA",borderRadius:"10px",padding:"10px",fontSize:"11px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",marginTop:"8px"}});
    makeNewBtn.textContent="🔄 Generate Another Video";
    makeNewBtn.onclick=function(){VG_STATE.template=null;vgSwitchTab("setup");};
    vgBody.appendChild(makeNewBtn);
  }

  // helper: hex to rgb string for rgba()
  function hexToRgb(hex){
    var r=0,g=0,b=0;
    if(hex.length===7){r=parseInt(hex.slice(1,3),16);g=parseInt(hex.slice(3,5),16);b=parseInt(hex.slice(5,7),16);}
    return r+","+g+","+b;
  }

  vgSwitchTab("setup");

  overlay.appendChild(card);
  overlay.addEventListener("click",function(e){if(e.target===overlay){if(VG_STATE.resultUrl)URL.revokeObjectURL(VG_STATE.resultUrl);overlay.remove();}});
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

async function uploadVideoToPublicHost(blob){
  try{
    var ext=blob.type.indexOf("mp4")!==-1?"mp4":"webm";
    var fd=new FormData();
    fd.append("file",blob,"video."+ext);
    var r=await fetch("https://telegra.ph/upload",{method:"POST",body:fd});
    var d=await r.json();
    if(d&&d[0]&&d[0].src)return "https://telegra.ph"+d[0].src;
  }catch(e){}
  return null;
}

// Shared publish bar — appears after every video tool output (Video Studio, Video Editor)
function showVideoPublishBar(blob,caption,container){
  var urlCache=null;
  var section=div({background:"rgba(255,255,255,0.02)",border:"1px solid #2A3040",borderRadius:"12px",padding:"14px",marginTop:"12px"});
  section.appendChild(div({color:"#C9A84C",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",marginBottom:"10px"},"📲 PUBLISH TO SOCIAL MEDIA"));
  var statusEl=div({color:"#8899AA",fontSize:"10px",fontFamily:"'Inter',sans-serif",marginBottom:"10px"});
  statusEl.textContent="Select a platform — video uploads automatically then posts";
  section.appendChild(statusEl);

  var manualUrlInp=el("input",{style:{width:"100%",background:"#0D1117",border:"1px solid #EF4444",borderRadius:"8px",padding:"7px 10px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box",display:"none",marginBottom:"8px"},placeholder:"Paste a public video URL (mp4)..."});
  section.appendChild(manualUrlInp);

  var PLATS=[
    {key:"ig_reel",label:"IG Reel",icon:"📱",color:"#E1306C",
      fn:async function(u){return await publishInstagramReel(caption,u);}},
    {key:"ig_story",label:"IG Story",icon:"⭕",color:"#C13584",
      fn:async function(u){return await publishInstagramVideoStory(u);}},
    {key:"tiktok",label:"TikTok",icon:"🎵",color:"#FF0050",
      fn:async function(u){return await publishToTikTok(caption,u);}},
    {key:"facebook",label:"Facebook",icon:"👍",color:"#1877F2",
      fn:async function(u){return await publishToFacebook(caption,[u]);}},
    {key:"twitter",label:"X / Twitter",icon:"𝕏",color:"#14171A",
      fn:async function(u){return await publishToTwitter(caption.substring(0,280),u);}}
  ];

  var btnRow=div({display:"flex",gap:"6px",flexWrap:"wrap"});
  PLATS.forEach(function(p){
    var btn=el("button",{style:{background:"rgba(255,255,255,0.03)",border:"1px solid #2A3040",color:"#C0C8D8",borderRadius:"8px",padding:"8px 12px",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",transition:"all 0.15s"}});
    btn.textContent=p.icon+" "+p.label;
    btn.onmouseenter=function(){if(!btn.disabled){btn.style.borderColor=p.color;btn.style.color=p.color;}};
    btn.onmouseleave=function(){if(!btn.disabled){btn.style.borderColor="#2A3040";btn.style.color="#C0C8D8";}};
    btn.onclick=async function(){
      if(btn.disabled)return;
      btn.disabled=true;
      // Get public URL (upload once, reuse for all platforms)
      if(!urlCache&&!(manualUrlInp.value.trim())){
        statusEl.textContent="⬆ Uploading video to get public URL...";
        statusEl.style.color="#F59E0B";
        urlCache=await uploadVideoToPublicHost(blob);
        if(!urlCache){
          // fallback: ask for manual URL
          manualUrlInp.style.display="block";
          statusEl.textContent="Auto-upload failed. Paste a public video URL above then click again.";
          statusEl.style.color="#EF4444";
          btn.disabled=false;
          return;
        }
      }
      var videoUrl=urlCache||manualUrlInp.value.trim();
      if(!videoUrl){statusEl.textContent="Paste a public video URL above first.";statusEl.style.color="#EF4444";btn.disabled=false;return;}
      statusEl.textContent="📤 Publishing to "+p.label+"...";
      statusEl.style.color="#C9A84C";
      try{
        var result=await p.fn(videoUrl);
        if(result&&result.success){
          btn.textContent="✓ "+p.label;
          btn.style.background="rgba(16,185,129,0.15)";
          btn.style.borderColor="#10B981";
          btn.style.color="#10B981";
          statusEl.textContent="Posted to "+p.label+" successfully!";
          statusEl.style.color="#10B981";
          savePostToHistory({caption:caption,platform:p.key,type:"video"});
        }else{
          btn.style.color="#EF4444";
          statusEl.textContent="Error: "+(result&&result.error?result.error:"Unknown error. Check Social Setup credentials.");
          statusEl.style.color="#EF4444";
          setTimeout(function(){btn.textContent=p.icon+" "+p.label;btn.style.color="#C0C8D8";btn.style.borderColor="#2A3040";btn.disabled=false;},3000);
        }
      }catch(e){
        statusEl.textContent="Error: "+e.message;statusEl.style.color="#EF4444";
        btn.style.color="#EF4444";
        setTimeout(function(){btn.textContent=p.icon+" "+p.label;btn.style.color="#C0C8D8";btn.style.borderColor="#2A3040";btn.disabled=false;},3000);
      }
    };
    btnRow.appendChild(btn);
  });
  section.appendChild(btnRow);

  // Schedule option
  var schedRow=div({marginTop:"10px",paddingTop:"10px",borderTop:"1px solid #1A1F2E"});
  var schedBtn2=el("button",{style:{background:"transparent",border:"none",color:"#8899AA",fontSize:"10px",cursor:"pointer",fontFamily:"'Inter',sans-serif",padding:"0"}});
  schedBtn2.textContent="📅 Schedule instead of posting now";
  schedBtn2.onclick=function(){if(typeof showAddCalendarEvent==="function")showAddCalendarEvent(caption||"Video post");};
  schedRow.appendChild(schedBtn2);
  section.appendChild(schedRow);

  container.appendChild(section);
}

// Shared publish bar — for every image-producing social tool
// blobOrFn: Blob | async fn()→Blob|string | pre-existing URL string | null (text-only)
function showImagePublishBar(blobOrFn,caption,container){
  var urlCache=(typeof blobOrFn==="string")?blobOrFn:null;
  var hasImage=!!blobOrFn;
  var section=div({background:"rgba(255,255,255,0.02)",border:"1px solid #2A3040",borderRadius:"12px",padding:"14px",marginTop:"12px"});
  section.appendChild(div({color:"#C9A84C",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",marginBottom:"10px"},"📲 PUBLISH TO SOCIAL MEDIA"));
  var statusEl=div({color:"#8899AA",fontSize:"10px",fontFamily:"'Inter',sans-serif",marginBottom:"10px"});
  statusEl.textContent=hasImage?"Select a platform — image uploads automatically then posts":"Select a platform to post this content (Instagram requires media)";
  section.appendChild(statusEl);

  var IPLATS=[
    {key:"ig_post",label:"IG Post",icon:"📸",color:"#E1306C",needsImage:true,
      fn:async function(u){return await publishToInstagram(caption,[u]);}},
    {key:"ig_story",label:"IG Story",icon:"⭕",color:"#C13584",needsImage:true,
      fn:async function(u){return await publishInstagramStory(caption,u);}},
    {key:"facebook",label:"Facebook",icon:"👍",color:"#1877F2",needsImage:false,
      fn:async function(u){return await publishToFacebook(caption,u?[u]:[]);}},
    {key:"twitter",label:"X/Twitter",icon:"𝕏",color:"#14171A",needsImage:false,
      fn:async function(u){return await publishToTwitter(caption.substring(0,280));}},
    {key:"linkedin",label:"LinkedIn",icon:"💼",color:"#0A66C2",needsImage:false,
      fn:async function(u){return await publishToLinkedIn(caption,u||null);}}
  ];

  var ibtnRow=div({display:"flex",gap:"6px",flexWrap:"wrap"});
  IPLATS.forEach(function(p){
    var noImg=!hasImage&&p.needsImage;
    var btn=el("button",{style:{background:noImg?"rgba(255,255,255,0.01)":"rgba(255,255,255,0.03)",border:"1px solid "+(noImg?"#1A1F2E":"#2A3040"),color:noImg?"#3A3A4A":"#C0C8D8",borderRadius:"8px",padding:"8px 12px",fontSize:"11px",fontWeight:"600",cursor:noImg?"not-allowed":"pointer",fontFamily:"'Space Grotesk',monospace",transition:"all 0.15s",opacity:noImg?"0.4":"1"}});
    btn.textContent=p.icon+" "+p.label+(noImg?" (needs image)":"");
    if(!noImg){
      btn.onmouseenter=function(){if(!btn.disabled){btn.style.borderColor=p.color;btn.style.color=p.color;}};
      btn.onmouseleave=function(){if(!btn.disabled){btn.style.borderColor="#2A3040";btn.style.color="#C0C8D8";}};
      btn.onclick=async function(){
        if(btn.disabled)return;
        btn.disabled=true;
        var imageUrl=urlCache;
        if(!imageUrl&&blobOrFn){
          if(p.needsImage){
            statusEl.textContent="⬆ Uploading image to get public URL...";
            statusEl.style.color="#F59E0B";
          }
          var blobOrUrl=typeof blobOrFn==="function"?await blobOrFn():blobOrFn;
          if(typeof blobOrUrl==="string"&&blobOrUrl){
            imageUrl=blobOrUrl;urlCache=imageUrl;
          }else if(blobOrUrl){
            imageUrl=await uploadToPublicHost(blobOrUrl);
            if(imageUrl)urlCache=imageUrl;
          }
          if(!imageUrl&&p.needsImage){
            statusEl.textContent="No image available yet. Try 'Generate Image' first.";
            statusEl.style.color="#EF4444";
            btn.disabled=false;return;
          }
        }
        statusEl.textContent="📤 Publishing to "+p.label+"...";
        statusEl.style.color="#C9A84C";
        try{
          var result=await p.fn(imageUrl||null);
          if(result&&result.success){
            btn.textContent="✓ "+p.label;
            btn.style.background="rgba(16,185,129,0.15)";
            btn.style.borderColor="#10B981";
            btn.style.color="#10B981";
            statusEl.textContent="Posted to "+p.label+" successfully!";
            statusEl.style.color="#10B981";
            savePostToHistory({caption:caption,platform:p.key,type:"image"});
          }else{
            btn.style.color="#EF4444";
            statusEl.textContent="Error: "+(result&&result.error?result.error:"Unknown error. Check Social Setup credentials.");
            statusEl.style.color="#EF4444";
            setTimeout(function(){btn.textContent=p.icon+" "+p.label;btn.style.color="#C0C8D8";btn.style.borderColor="#2A3040";btn.disabled=false;},3000);
          }
        }catch(e){
          statusEl.textContent="Error: "+e.message;statusEl.style.color="#EF4444";
          btn.style.color="#EF4444";
          setTimeout(function(){btn.textContent=p.icon+" "+p.label;btn.style.color="#C0C8D8";btn.style.borderColor="#2A3040";btn.disabled=false;},3000);
        }
      };
    }
    ibtnRow.appendChild(btn);
  });
  section.appendChild(ibtnRow);

  var ischedRow=div({marginTop:"10px",paddingTop:"10px",borderTop:"1px solid #1A1F2E"});
  var ischedBtn=el("button",{style:{background:"transparent",border:"none",color:"#8899AA",fontSize:"10px",cursor:"pointer",fontFamily:"'Inter',sans-serif",padding:"0"}});
  ischedBtn.textContent="📅 Schedule instead of posting now";
  ischedBtn.onclick=function(){if(typeof showAddCalendarEvent==="function")showAddCalendarEvent(caption||"Image post");};
  ischedRow.appendChild(ischedBtn);
  section.appendChild(ischedRow);

  container.appendChild(section);
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

  var geminiKey=localStorage.getItem("dv_gemini_key");
  if(geminiKey){
    var geminiPromises=[];
    for(var g=0;g<count;g++)geminiPromises.push(generateGeminiImage(query+(g>0?" different angle "+(g+1):"")));
    var geminiResults=await Promise.all(geminiPromises);
    for(var gi=0;gi<geminiResults.length&&collected.length<count;gi++){
      if(geminiResults[gi])collected.push(geminiResults[gi]);
    }
    if(collected.length>=count){console.log("[DubAIVal] "+collected.length+" images from Gemini AI");return collected;}
  }

  var unsplashImgs=await searchUnsplashMulti(query,count-collected.length);
  for(var u=0;u<unsplashImgs.length&&collected.length<count;u++)collected.push(unsplashImgs[u]);
  if(collected.length>=count){console.log("[DubAIVal] "+collected.length+" images (Gemini+Unsplash)");return collected;}

  var pexelsImgs=await searchPexelsMulti(query,count-collected.length);
  for(var p=0;p<pexelsImgs.length&&collected.length<count;p++)collected.push(pexelsImgs[p]);
  if(collected.length>=count){console.log("[DubAIVal] "+collected.length+" images (Gemini+Unsplash+Pexels)");return collected;}

  if(collected.length>0){console.log("[DubAIVal] "+collected.length+" images total");return collected;}

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
  window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank","noopener,noreferrer");
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
  card.appendChild(el("h3",{style:{color:"#F59E0B",margin:"0 0 12px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Best Time to Post — Dubai"));
  var platforms=Object.keys(DUBAI_BEST_TIMES);
  platforms.forEach(function(p){
    var info=getBestPostTime(p);
    var pCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"10px",padding:"10px",marginBottom:"8px"});
    var icons={instagram:"IG",facebook:"FB",linkedin:"LI",twitter:"𝕏",tiktok:"TT",whatsapp:"WA"};
    pCard.appendChild(el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
      el("span",{style:{color:"#FFF",fontSize:"12px",fontWeight:"700",fontFamily:"monospace"}},(icons[p]||"")+" "+p.charAt(0).toUpperCase()+p.slice(1)),
      el("span",{style:{color:"#10B981",fontSize:"11px",fontFamily:"monospace"}},"Next: "+info.next)
    ));
    var timesRow=div({display:"flex",gap:"4px",marginTop:"6px",flexWrap:"wrap"});
    info.all.forEach(function(t){
      var chip=el("span",{style:{background:t===info.peak?"#F59E0B22":"#0D1117",border:"1px solid "+(t===info.peak?"#F59E0B":"#2A3040"),color:t===info.peak?"#F59E0B":"#8899AA",padding:"2px 8px",borderRadius:"10px",fontSize:"9px",fontFamily:"monospace"}});
      chip.textContent=t+(t===info.peak?" (peak)":"");timesRow.appendChild(chip);
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
  card.appendChild(el("h3",{style:{color:"#8B5CF6",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Post Performance Analytics"));
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
    var icons={instagram:"IG",facebook:"FB",linkedin:"LI",twitter:"𝕏",tiktok:"TT",whatsapp:"WA"};
    Object.keys(stats.platforms).forEach(function(p){
      var pct=Math.round(stats.platforms[p]/stats.total*100);
      platWrap.appendChild(el("div",{style:{background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"6px 10px",fontSize:"10px",fontFamily:"monospace",color:"#E0E0E0"}},(icons[p]||"")+" "+p+": "+stats.platforms[p]+" ("+pct+"%)"));
    });card.appendChild(platWrap);
    card.appendChild(el("div",{style:{color:"#FFF",fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginBottom:"6px"}},"Recent Posts"));
    history.slice(0,10).forEach(function(p){
      var pCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",marginBottom:"4px"});
      var hdr=div({display:"flex",justifyContent:"space-between",alignItems:"center"});
      hdr.appendChild(el("span",{style:{color:"#8B5CF6",fontSize:"10px",fontFamily:"monospace"}},(icons[p.platform]||"")+" "+new Date(p.postedAt).toLocaleDateString()));
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
  card.appendChild(el("h3",{style:{color:"#EC4899",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"AI Caption Rewriter"));
  card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",marginBottom:"10px",fontFamily:"monospace"}},"Select a platform to optimize your caption:"));
  var platforms=[{k:"instagram",icon:"IG",color:"#E1306C"},{k:"facebook",icon:"FB",color:"#1877F2"},{k:"linkedin",icon:"LI",color:"#0A66C2"},{k:"twitter",icon:"𝕏",color:"#1DA1F2"},{k:"tiktok",icon:"TT",color:"#FF0050"},{k:"whatsapp",icon:"WA",color:"#25D366"}];
  var resultArea=div({});
  var platRow=div({display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"12px"});
  platforms.forEach(function(p){
    platRow.appendChild(el("button",{style:{background:hexAlpha(p.color,0.12),border:"1px solid "+hexAlpha(p.color,0.3),color:p.color,padding:"8px 14px",borderRadius:"8px",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
      this.textContent="Rewriting...";resultArea.innerHTML="";
      var result=await rewriteCaptionForPlatform(caption,p.k);
      this.textContent=p.icon+" "+p.k.charAt(0).toUpperCase()+p.k.slice(1);
      if(!result){resultArea.appendChild(el("p",{style:{color:"#EF4444",fontSize:"11px"}},"Check Gemini API key."));return;}
      var rCard=div({background:"#0D1117",border:"1px solid "+hexAlpha(p.color,0.3),borderRadius:"10px",padding:"12px"});
      rCard.appendChild(el("div",{style:{color:p.color,fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginBottom:"6px"}},p.icon+" Optimized for "+p.k.charAt(0).toUpperCase()+p.k.slice(1)+" ("+result.charCount+" chars)"));
      var textEl=el("div",{style:{color:"#E0E0E0",fontSize:"11px",lineHeight:"1.5",whiteSpace:"pre-wrap",maxHeight:"200px",overflowY:"auto"}});textEl.textContent=result.caption;rCard.appendChild(textEl);
      if(result.tips){rCard.appendChild(el("div",{style:{color:"#6B7280",fontSize:"9px",marginTop:"6px",fontStyle:"italic"}},result.tips));}
      var rwBtnRow=div({display:"flex",gap:"4px",marginTop:"8px"});
      var copyBtn=el("button",{style:{background:hexAlpha(p.color,0.15),border:"1px solid "+hexAlpha(p.color,0.3),color:p.color,padding:"6px 14px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
        navigator.clipboard.writeText(result.caption);copyBtn.textContent="Copied!";setTimeout(function(){copyBtn.textContent="Copy";},2000);
      }});copyBtn.textContent="Copy";rwBtnRow.appendChild(copyBtn);
      rwBtnRow.appendChild(makeShareButton({text:result.caption||"",title:"DubAIVal Caption"}));
      rCard.appendChild(rwBtnRow);
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
  card.appendChild(el("h3",{style:{color:"#EF4444",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Competitor Hashtag Spy"));
  var compInput=el("textarea",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box",minHeight:"50px",resize:"vertical"},placeholder:"Enter competitor Instagram handles (comma separated)\ne.g. @dubailuxury, @emaarproperties, @damacofficial"});
  card.appendChild(compInput);
  var analyzeBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"#EF4444",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
    analyzeBtn.textContent="Analyzing competitors...";resultWrap.innerHTML="";
    var result=await spyCompetitorHashtags(compInput.value||undefined);
    analyzeBtn.textContent="Analyze";
    if(!result){resultWrap.appendChild(el("p",{style:{color:"#EF4444",fontSize:"11px"}},"Check Gemini API key."));return;}
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
      resultWrap.appendChild(el("div",{style:{color:"#10B981",fontSize:"11px",fontWeight:"700",marginTop:"10px",fontFamily:"monospace"}},"Niche Gems (Low Competition)"));
      result.niche_gems.forEach(function(g){
        resultWrap.appendChild(el("div",{style:{color:"#CCC",fontSize:"10px",marginLeft:"8px"}},"• "+g.tag+" — "+g.why));
      });
    }
    if(result.unique_combos&&result.unique_combos.length){
      resultWrap.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"11px",fontWeight:"700",marginTop:"10px",fontFamily:"monospace"}},"Unique Combos to Own"));
      result.unique_combos.forEach(function(c){
        var row=el("div",{style:{color:"#E0E0E0",fontSize:"10px",marginLeft:"8px",cursor:"pointer",padding:"4px",borderRadius:"4px"},onclick:function(){navigator.clipboard.writeText(c);row.style.background="#10B98122";setTimeout(function(){row.style.background="";},500);}});
        row.textContent=c;resultWrap.appendChild(row);
      });
    }
    if(result.summary){
      resultWrap.appendChild(el("div",{style:{background:"#1A0A1A",border:"1px solid #8B5CF6",borderRadius:"8px",padding:"8px",marginTop:"10px",color:"#CCC",fontSize:"10px",lineHeight:"1.4"}},result.summary));
    }
  }});analyzeBtn.textContent="Analyze";card.appendChild(analyzeBtn);
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
  card.appendChild(el("h3",{style:{color:"#10B981",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Bulk Post Generator — 30 Day Plan"));
  var configRow=div({display:"flex",gap:"8px",marginBottom:"10px"});
  var countSel=el("select",{style:{flex:1,background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"6px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace"}});
  [15,20,30,60].forEach(function(n){var o=el("option");o.value=n;o.textContent=n+" posts";if(n===30)o.selected=true;countSel.appendChild(o);});
  var platSel=el("select",{style:{flex:1,background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"6px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace"}});
  ["Instagram","Facebook","LinkedIn","All Platforms"].forEach(function(p){var o=el("option");o.value=p.toLowerCase().replace(" ","_");o.textContent=p;platSel.appendChild(o);});
  configRow.appendChild(countSel);configRow.appendChild(platSel);card.appendChild(configRow);
  var resultWrap=div({});
  var genBtn=el("button",{style:{width:"100%",background:"#10B981",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
    genBtn.textContent="Generating "+countSel.value+" posts with AI...";resultWrap.innerHTML="";
    var result=await generateBulkPosts({count:parseInt(countSel.value),platform:platSel.value});
    genBtn.textContent="Generate";
    if(!result||!result.posts){resultWrap.appendChild(el("p",{style:{color:"#EF4444",fontSize:"11px"}},"Generation failed. Check Gemini API key."));return;}
    var schedBtn=el("button",{style:{width:"100%",marginBottom:"6px",background:"#3B82F6",color:"#FFF",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
      result.posts.forEach(function(p){saveCalendarEvent({caption:p.caption,date:p.date,time:p.time,platform:platSel.value,pillar:p.pillar,type:p.type||"post"});});
      schedBtn.textContent=result.posts.length+" posts scheduled!";schedBtn.style.background="#10B981";
    }});schedBtn.textContent="Schedule All "+result.posts.length+" to Calendar";resultWrap.appendChild(schedBtn);
    var allCaptions=result.posts.map(function(p,i){return"Day "+(p.day||i+1)+" ("+p.date+" "+p.time+") ["+( p.pillar||"Post")+"]\n"+p.caption;}).join("\n\n---\n\n");
    var bulkShareRow=div({display:"flex",gap:"6px",marginBottom:"10px"});
    bulkShareRow.appendChild(makeShareButton({text:allCaptions,title:"DubAIVal 30-Day Content Plan"},{flex:"1"}));
    resultWrap.appendChild(bulkShareRow);
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
      if(p.imageHint)pCard.appendChild(el("div",{style:{color:"#6B7280",fontSize:"8px",marginTop:"2px"}},p.imageHint));
      (function(postCaption,postCard){
        var pubBtn=el("button",{style:{marginTop:"4px",background:"transparent",border:"1px solid #2A3040",color:"#8899AA",padding:"3px 8px",borderRadius:"6px",fontSize:"9px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
          if(!postCard.querySelector("[data-ipb]")){
            var m=div({});m.setAttribute("data-ipb","1");postCard.appendChild(m);
            showImagePublishBar(null,postCaption,postCard);
          }
        }});pubBtn.textContent="📲 Post";postCard.appendChild(pubBtn);
      })(p.caption,pCard);
      resultWrap.appendChild(pCard);
    });
  }});genBtn.textContent="Generate";card.appendChild(genBtn);card.appendChild(resultWrap);
  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- CONTENT RECYCLER ---
function showContentRecycler(){
  var m=document.getElementById("recycler-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"recycler-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #F97316",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#F97316",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Content Recycler"));
  var history=getPostHistory();
  if(history.length<3){card.appendChild(el("p",{style:{color:"#8899AA",fontSize:"12px"}},"Need at least 3 posts in history to recycle. Start posting!"));
  }else{
    card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",marginBottom:"10px",fontFamily:"monospace"}},"AI will refresh your old posts with updated data & new angles"));
    var older=history.filter(function(p){return Date.now()-new Date(p.postedAt).getTime()>14*86400000;});
    if(older.length===0)older=history.slice(Math.floor(history.length/2));
    var candidates=older.slice(0,8);
    candidates.forEach(function(p){
      var pCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",marginBottom:"6px"});
      pCard.appendChild(el("div",{style:{color:"#F97316",fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}},new Date(p.postedAt).toLocaleDateString()+" · "+(p.platform||"instagram")));
      var capEl=el("div",{style:{color:"#CCC",fontSize:"10px",lineHeight:"1.4",marginTop:"4px",maxHeight:"40px",overflow:"hidden"}});capEl.textContent=(p.caption||"").substring(0,120);pCard.appendChild(capEl);
      var recycleBtn=el("button",{style:{marginTop:"6px",background:"#F9731622",border:"1px solid #F9731644",color:"#F97316",padding:"4px 10px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
        recycleBtn.textContent="Refreshing...";
        var geminiKey=localStorage.getItem("dv_gemini_key");
        if(!geminiKey){recycleBtn.textContent="Need Gemini key";return;}
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
            resultDiv.appendChild(el("div",{style:{color:"#10B981",fontSize:"9px",fontWeight:"700",fontFamily:"monospace",marginBottom:"4px"}},"Refreshed Version"));
            var newText=el("div",{style:{color:"#E0E0E0",fontSize:"10px",lineHeight:"1.4",whiteSpace:"pre-wrap",maxHeight:"100px",overflowY:"auto"}});newText.textContent=newCap;resultDiv.appendChild(newText);
            var copyBtn=el("button",{style:{marginTop:"4px",background:"#10B98122",border:"1px solid #10B98144",color:"#10B981",padding:"3px 8px",borderRadius:"4px",fontSize:"9px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){navigator.clipboard.writeText(newCap);copyBtn.textContent="Copied!";}});
            copyBtn.textContent="Copy";resultDiv.appendChild(copyBtn);
            showImagePublishBar(null,newCap,resultDiv);
            pCard.appendChild(resultDiv);
          }
          recycleBtn.textContent="Recycle";
        }catch(e){recycleBtn.textContent="Error";}
      }});recycleBtn.textContent="Recycle This";pCard.appendChild(recycleBtn);
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
  card.appendChild(el("h3",{style:{color:"#C9A84C",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Link in Bio Generator"));
  var bp=getBrandProfile();
  var links;try{links=JSON.parse(localStorage.getItem("dv_linkinbio")||"[]");}catch(e){links=[];}
  var previewWrap=div({});
  function renderPreview(){
    previewWrap.innerHTML="";
    var phone=div({background:"#000",borderRadius:"24px",padding:"20px 16px",width:"280px",margin:"0 auto",border:"3px solid #333",minHeight:"400px"});
    if(bp&&bp.name){
      phone.appendChild(el("div",{style:{textAlign:"center",marginBottom:"4px"}},el("div",{style:{width:"60px",height:"60px",borderRadius:"50%",background:"linear-gradient(135deg,#C9A84C,#8B6914)",margin:"0 auto 8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",color:"#FFF"}},"")));
      phone.appendChild(el("div",{style:{color:"#FFF",fontSize:"14px",fontWeight:"700",textAlign:"center",fontFamily:"'Space Grotesk',sans-serif"}},bp.name));
      if(bp.bio)phone.appendChild(el("div",{style:{color:"#999",fontSize:"10px",textAlign:"center",marginTop:"2px"}},bp.bio));
    }else{
      phone.appendChild(el("div",{style:{color:"#FFF",fontSize:"14px",fontWeight:"700",textAlign:"center",marginTop:"20px"}},"DubAIVal"));
      phone.appendChild(el("div",{style:{color:"#999",fontSize:"10px",textAlign:"center",marginTop:"2px"}},"AI Property Valuation Dubai"));
    }
    var linkWrap=div({marginTop:"16px"});
    links.forEach(function(l,i){
      var lb=el("div",{style:{background:l.color||"#C9A84C",borderRadius:"10px",padding:"10px 14px",marginBottom:"8px",textAlign:"center",cursor:"pointer",transition:"transform 0.2s"}});
      lb.appendChild(el("div",{style:{color:l.color==="transparent"||l.color==="#FFFFFF"?"#000":"#FFF",fontSize:"12px",fontWeight:"600",fontFamily:"'Space Grotesk',sans-serif"}},(l.icon||"")+" "+l.title));
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
    links.push({title:titleInp.value.trim(),url:urlInp.value.trim(),icon:"",color:"#C9A84C"});
    localStorage.setItem("dv_linkinbio",JSON.stringify(links));
    titleInp.value="";urlInp.value="";renderPreview();renderLinkList();
  }});addBtn.textContent="+";addRow.appendChild(titleInp);addRow.appendChild(urlInp);addRow.appendChild(addBtn);card.appendChild(addRow);
  var quickLinks=[
    {title:"WhatsApp Me",url:"https://wa.me/971",icon:"WA",color:"#25D366"},
    {title:"Free Valuation",url:"https://dubaival.com",icon:"",color:"#3B82F6"},
    {title:"Instagram",url:"https://instagram.com/",icon:"IG",color:"#E1306C"},
    {title:"View Properties",url:"https://dubaival.com",icon:"",color:"#10B981"}
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
      row.appendChild(el("button",{style:{background:"none",border:"none",color:"#EF4444",fontSize:"12px",cursor:"pointer"},onclick:function(){links.splice(i,1);localStorage.setItem("dv_linkinbio",JSON.stringify(links));renderPreview();renderLinkList();}},"×"));
      linkListWrap.appendChild(row);
    });
  }
  card.appendChild(linkListWrap);renderLinkList();
  var copyBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"#C9A84C",color:"#000",border:"none",borderRadius:"8px",padding:"10px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
    var html="<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>"+(bp?bp.name:"DubAIVal")+" — Links</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#070B14;font-family:'Segoe UI',sans-serif;display:flex;justify-content:center;padding:40px 16px;min-height:100vh}.container{max-width:400px;width:100%;text-align:center}.avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#C9A84C,#8B6914);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff}.name{color:#fff;font-size:18px;font-weight:700;margin-bottom:4px}.bio{color:#999;font-size:12px;margin-bottom:24px}.link{display:block;padding:14px;border-radius:12px;margin-bottom:10px;text-decoration:none;color:#fff;font-weight:600;font-size:14px;transition:transform .2s}.link:hover{transform:scale(1.03)}.footer{color:#444;font-size:10px;margin-top:24px}</style></head><body><div class='container'><div class='avatar'></div><div class='name'>"+(bp?bp.name:"DubAIVal")+"</div><div class='bio'>"+(bp?bp.bio||"":"AI Property Valuation Dubai")+"</div>";
    links.forEach(function(l){html+="<a class='link' href='"+(l.url||"#")+"' style='background:"+(l.color||"#C9A84C")+"'>"+(l.icon||"")+" "+l.title+"</a>";});
    html+="<div class='footer'>Powered by DubAIVal.com</div></div></body></html>";
    navigator.clipboard.writeText(html);copyBtn.textContent="HTML Copied!";setTimeout(function(){copyBtn.textContent="Copy HTML Page";},2000);
  }});copyBtn.textContent="Copy HTML Page";card.appendChild(copyBtn);
  card.appendChild(el("button",{style:{width:"100%",marginTop:"6px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  renderPreview();
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- STORY TEMPLATES (Quiz, Poll, Countdown) ---
var STORY_TEMPLATES=[
  {id:"quiz",name:"Quiz",color:"#8B5CF6",description:"Test your audience's Dubai market knowledge"},
  {id:"poll",name:"Poll",color:"#3B82F6",description:"Engage with binary choices about property"},
  {id:"countdown",name:"Countdown",color:"#EF4444",description:"Build urgency for launches, deals, events"},
  {id:"thisorthat",name:"This or That",color:"#F59E0B",description:"Compare two areas, properties, or strategies"},
  {id:"slider",name:"Emoji Slider",color:"#EC4899",description:"Rate sentiment on market topics"},
  {id:"ama",name:"AMA",color:"#10B981",description:"Ask Me Anything about Dubai real estate"}
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
  card.appendChild(el("h3",{style:{color:"#8B5CF6",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Story Templates"));
  var resultWrap=div({});
  var tplGrid=div({display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"8px",marginBottom:"12px"});
  STORY_TEMPLATES.forEach(function(t){
    var tCard=el("div",{style:{background:"#0D1117",border:"1px solid "+hexAlpha(t.color,0.3),borderRadius:"10px",padding:"10px",cursor:"pointer",transition:"all 0.2s"},onclick:async function(){
      tCard.style.borderColor=t.color;resultWrap.innerHTML="";
      resultWrap.appendChild(el("div",{style:{color:"#8899AA",fontSize:"11px",textAlign:"center",padding:"10px"}},"Generating "+t.name+" content..."));
      var content=await generateStoryContent(t.id);
      resultWrap.innerHTML="";
      if(!content){resultWrap.appendChild(el("p",{style:{color:"#EF4444",fontSize:"11px"}},"Check Gemini API key."));return;}
      var rCard=div({background:"#0D1117",border:"1px solid "+t.color,borderRadius:"10px",padding:"12px"});
      rCard.appendChild(el("div",{style:{color:t.color,fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginBottom:"6px"}},t.name+" Content"));
      var preEl=el("pre",{style:{color:"#E0E0E0",fontSize:"10px",lineHeight:"1.5",whiteSpace:"pre-wrap",background:"#0A0E18",padding:"8px",borderRadius:"6px",maxHeight:"200px",overflowY:"auto"}});
      preEl.textContent=JSON.stringify(content,null,2);rCard.appendChild(preEl);
      var copyBtn=el("button",{style:{marginTop:"8px",width:"100%",background:hexAlpha(t.color,0.15),border:"1px solid "+hexAlpha(t.color,0.3),color:t.color,padding:"6px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
        navigator.clipboard.writeText(JSON.stringify(content,null,2));copyBtn.textContent="Copied!";setTimeout(function(){copyBtn.textContent="Copy Content";},2000);
      }});copyBtn.textContent="Copy Content";rCard.appendChild(copyBtn);
      var stCaption=content.question||(content.title&&content.subtitle?content.title+"\n"+content.subtitle:content.title)||JSON.stringify(content,null,2);
      showImagePublishBar(null,stCaption,rCard);
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
  var avatar=el("div",{style:{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(135deg,#C9A84C,#8B6914)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",color:"#FFF",flexShrink:"0"}});avatar.textContent="";
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
    placeholder.appendChild(el("span",{style:{color:"#333",fontSize:"48px"}},""));card.appendChild(placeholder);
  }
  var actionBar=div({display:"flex",justifyContent:"space-between",padding:"10px 12px"});
  var leftActs=div({display:"flex",gap:"14px"});
  ["♡","",""].forEach(function(ic){leftActs.appendChild(el("span",{style:{color:"#FFF",fontSize:"22px",cursor:"pointer"}},ic));});
  actionBar.appendChild(leftActs);actionBar.appendChild(el("span",{style:{color:"#FFF",fontSize:"22px"}},""));
  card.appendChild(actionBar);
  card.appendChild(el("div",{style:{padding:"0 12px 4px",color:"#FFF",fontSize:"13px",fontWeight:"600"}},"2,847 likes"));
  var capWrap=div({padding:"0 12px 12px"});
  var capText=el("div",{style:{color:"#FFF",fontSize:"12px",lineHeight:"1.5"}});
  var shortCap=caption.length>150?caption.substring(0,150)+"...":caption;
  capText.innerHTML="<span style='font-weight:700'>"+escHtml(bp?bp.name:"dubaival")+"</span> "+escHtml(shortCap).replace(/\n/g,"<br>");
  capWrap.appendChild(capText);
  if(caption.length>150){
    var moreBtn=el("span",{style:{color:"#8899AA",fontSize:"12px",cursor:"pointer"},onclick:function(){capText.innerHTML="<span style='font-weight:700'>"+escHtml(bp?bp.name:"dubaival")+"</span> "+escHtml(caption).replace(/\n/g,"<br>");moreBtn.remove();}});
    moreBtn.textContent="more";capWrap.appendChild(moreBtn);
  }
  card.appendChild(capWrap);
  card.appendChild(el("div",{style:{padding:"0 12px 10px",color:"#8899AA",fontSize:"10px"}},"2 HOURS AGO"));
  var tabRow=div({display:"flex",justifyContent:"center",gap:"16px",padding:"8px",borderTop:"1px solid #222"});
  ["IG Feed","FB Feed","Story"].forEach(function(tab,i){
    tabRow.appendChild(el("button",{style:{background:i===0?"#FFF":"transparent",color:i===0?"#000":"#8899AA",border:"none",borderRadius:"12px",padding:"4px 12px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace",fontWeight:i===0?"700":"400"}},tab));
  });card.appendChild(tabRow);
  var previewShareRow=div({display:"flex",gap:"6px",padding:"8px 12px"});
  var previewShareOpts={text:caption,title:"DubAIVal Post"};
  if(imageUrl){previewShareOpts.url=imageUrl;}
  previewShareRow.appendChild(makeShareButton(previewShareOpts,{flex:"1",padding:"8px",fontSize:"11px"}));
  card.appendChild(previewShareRow);
  var ppWrap=div({padding:"0 8px"});
  showImagePublishBar(imageUrl||null,caption,ppWrap);
  card.appendChild(ppWrap);
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
      new Notification("DubAIVal — Time to Post!",{body:"Scheduled post for "+(event.platform||"Instagram")+" is due in 15 minutes.\n"+(event.caption||"").substring(0,80)+"...",icon:"logo.png",badge:"logo.png",tag:"dv-post-"+event.id,requireInteraction:true});
    },delay);
  });
}

// --- CAPTION LENGTH OPTIMIZER ---
var PLATFORM_LIMITS={instagram:{max:2200,ideal:{min:138,max:150},hashtags:30,note:"First 125 chars show in feed"},facebook:{max:63206,ideal:{min:40,max:80},hashtags:5,note:"Short posts get 23% more engagement"},linkedin:{max:3000,ideal:{min:100,max:200},hashtags:5,note:"First 140 chars before 'see more'"},twitter:{max:280,ideal:{min:71,max:100},hashtags:3,note:"Tweets with 100 chars get 17% more RT"},tiktok:{max:2200,ideal:{min:50,max:150},hashtags:5,note:"Short & catchy, trend references help"},whatsapp:{max:65536,ideal:{min:20,max:100},hashtags:0,note:"Keep broadcast-friendly, 3-4 lines max"}};
function showCaptionOptimizer(caption){
  var m=document.getElementById("optimizer-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"10px"},id:"optimizer-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #06B6D4",borderRadius:"16px",padding:"16px",width:"480px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#06B6D4",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Caption Length Optimizer"));
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
    var status=tooLong?"Over limit":inIdeal?"Ideal length":charCount<lim.ideal.min?"Too short":"Could be shorter";
    var pCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",marginBottom:"6px"});
    var icons={instagram:"IG",facebook:"FB",linkedin:"LI",twitter:"𝕏",tiktok:"TT",whatsapp:"WA"};
    pCard.appendChild(el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
      el("span",{style:{color:"#FFF",fontSize:"11px",fontWeight:"600",fontFamily:"monospace"}},(icons[p]||"")+" "+p.charAt(0).toUpperCase()+p.slice(1)),
      el("span",{style:{color:tooLong?"#EF4444":inIdeal?"#10B981":"#F59E0B",fontSize:"9px",fontFamily:"monospace"}},status)
    ));
    var barBg=div({height:"4px",background:"#2A3040",borderRadius:"2px",marginTop:"6px",overflow:"hidden"});
    barBg.appendChild(el("div",{style:{height:"100%",width:Math.min(pct,100)+"%",background:tooLong?"#EF4444":inIdeal?"#10B981":"#F59E0B",borderRadius:"2px",transition:"width 0.3s"}}));
    pCard.appendChild(barBg);
    pCard.appendChild(el("div",{style:{display:"flex",justifyContent:"space-between",marginTop:"4px"}},
      el("span",{style:{color:"#6B7280",fontSize:"8px",fontFamily:"monospace"}},charCount+"/"+lim.max+" chars · Ideal: "+lim.ideal.min+"-"+lim.ideal.max),
      el("span",{style:{color:hashOk?"#6B7280":"#EF4444",fontSize:"8px",fontFamily:"monospace"}},"#: "+hashCount+"/"+lim.hashtags)
    ));
    pCard.appendChild(el("div",{style:{color:"#4B5563",fontSize:"8px",marginTop:"2px"}},lim.note));
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
  card.appendChild(el("h3",{style:{color:"#F59E0B",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Emoji Intelligence"));
  var loadingP=el("p",{style:{color:"#8899AA",fontSize:"12px",textAlign:"center"}},"Analyzing best emojis...");
  card.appendChild(loadingP);
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
  suggestEmojis(caption).then(function(result){
    loadingP.remove();
    if(!result){card.appendChild(el("p",{style:{color:"#EF4444",fontSize:"12px"}},"Check Gemini API key."));return;}
    var cats=[{k:"hook",l:"Hook Emojis",c:"#EF4444"},{k:"separators",l:"Separators",c:"#3B82F6"},{k:"cta",l:"CTA Emojis",c:"#10B981"}];
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
      enhBox.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"10px",fontWeight:"700",fontFamily:"monospace",marginBottom:"4px"}},"Enhanced Caption ("+result.total_emojis+" emojis)"));
      var enhText=el("div",{style:{color:"#E0E0E0",fontSize:"11px",lineHeight:"1.5",whiteSpace:"pre-wrap",maxHeight:"150px",overflowY:"auto"}});enhText.textContent=result.enhanced_caption;enhBox.appendChild(enhText);
      var copyBtn=el("button",{style:{marginTop:"6px",background:"#F59E0B22",border:"1px solid #F59E0B44",color:"#F59E0B",padding:"5px 12px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
        navigator.clipboard.writeText(result.enhanced_caption);copyBtn.textContent="Copied!";setTimeout(function(){copyBtn.textContent="Use Enhanced";},2000);
      }});copyBtn.textContent="Use Enhanced";enhBox.appendChild(copyBtn);
      card.appendChild(enhBox);
    }
    if(result.tip){card.appendChild(el("div",{style:{color:"#6B7280",fontSize:"9px",marginTop:"8px",fontStyle:"italic"}},result.tip));}
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
  card.appendChild(el("h3",{style:{color:"#C9A84C",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Watermark Settings"));
  var settings=getWatermarkSettings();
  var preview=document.createElement("canvas");preview.width=400;preview.height=300;
  preview.style.cssText="width:100%;border-radius:8px;border:1px solid #2A3040;margin-bottom:10px;";
  card.appendChild(preview);
  function redraw(){
    var ctx=preview.getContext("2d");
    var grd=ctx.createLinearGradient(0,0,0,300);grd.addColorStop(0,"#1A0A3A");grd.addColorStop(1,"#0A1628");
    ctx.fillStyle=grd;ctx.fillRect(0,0,400,300);
    ctx.fillStyle="#333";ctx.font="48px sans-serif";ctx.textAlign="center";ctx.fillText("Sample Image",200,160);
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
  {id:"market",name:"Market Data",color:"#3B82F6",percentage:25,examples:["PSF updates","Yield comparisons","Growth trends"]},
  {id:"area",name:"Area Spotlight",color:"#10B981",percentage:20,examples:["Area guides","Neighborhood tours","Hidden gems"]},
  {id:"education",name:"Education",color:"#8B5CF6",percentage:20,examples:["Buying tips","Investment 101","Legal guide"]},
  {id:"lifestyle",name:"Lifestyle",color:"#EC4899",percentage:15,examples:["Dubai luxury","Community life","Amenities"]},
  {id:"social_proof",name:"Social Proof",color:"#F59E0B",percentage:10,examples:["Testimonials","Deal closed","Client stories"]},
  {id:"behind",name:"Behind Scenes",color:"#F97316",percentage:10,examples:["Market visits","Team","Day in life"]}
];
function getPillarSettings(){try{return JSON.parse(localStorage.getItem("dv_content_pillars")||"null")||DEFAULT_PILLARS;}catch(e){return DEFAULT_PILLARS;}}
function showPillarPlanner(){
  var m=document.getElementById("pillar-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"pillar-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #8B5CF6",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#8B5CF6",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Content Pillar Planner"));
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
  if(totalPct!==100)card.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"10px",textAlign:"center",marginTop:"6px"}},"Total: "+totalPct+"% (should be 100%)"));
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

// --- X (TWITTER) OAuth 1.0a ---
function _xOauthNonce(){var c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",s="";for(var i=0;i<32;i++)s+=c.charAt(Math.floor(Math.random()*c.length));return s;}
function _xPercentEncode(s){return encodeURIComponent(s).replace(/[!'()*]/g,function(c){return"%"+c.charCodeAt(0).toString(16).toUpperCase();});}
async function _xOauthSign(method,url,params,consumerSecret,tokenSecret){
  var keys=Object.keys(params).sort();
  var paramStr=keys.map(function(k){return _xPercentEncode(k)+"="+_xPercentEncode(params[k]);}).join("&");
  var baseStr=method.toUpperCase()+"&"+_xPercentEncode(url)+"&"+_xPercentEncode(paramStr);
  var signingKey=_xPercentEncode(consumerSecret)+"&"+_xPercentEncode(tokenSecret);
  var enc=new TextEncoder();
  var key=await crypto.subtle.importKey("raw",enc.encode(signingKey),{name:"HMAC",hash:"SHA-1"},false,["sign"]);
  var sig=await crypto.subtle.sign("HMAC",key,enc.encode(baseStr));
  return btoa(String.fromCharCode.apply(null,new Uint8Array(sig)));
}
async function _xAuthHeader(method,url,extraParams){
  var ck=localStorage.getItem("dv_twitter_consumer_key")||"";
  var cs=localStorage.getItem("dv_twitter_consumer_secret")||"";
  var at=localStorage.getItem("dv_twitter_access_token")||"";
  var ats=localStorage.getItem("dv_twitter_access_secret")||"";
  var oauthParams={oauth_consumer_key:ck,oauth_nonce:_xOauthNonce(),oauth_signature_method:"HMAC-SHA1",oauth_timestamp:Math.floor(Date.now()/1000).toString(),oauth_token:at,oauth_version:"1.0"};
  var allParams=Object.assign({},oauthParams,extraParams||{});
  oauthParams.oauth_signature=await _xOauthSign(method,url,allParams,cs,ats);
  var hdr="OAuth "+Object.keys(oauthParams).sort().map(function(k){return _xPercentEncode(k)+'="'+_xPercentEncode(oauthParams[k])+'"';}).join(", ");
  return hdr;
}
async function publishToTwitter(text,imageUrl){
  var ck=localStorage.getItem("dv_twitter_consumer_key");
  var at=localStorage.getItem("dv_twitter_access_token");
  if(!ck||!at)return{success:false,error:"X/Twitter API keys not set. Go to Setup → fill Consumer Key, Secret, Access Token, Access Secret."};
  try{
    var tweetBody={text:text};
    var url="https://api.twitter.com/2/tweets";
    var auth=await _xAuthHeader("POST",url,{});
    var r=await fetch(url,{method:"POST",headers:{"Authorization":auth,"Content-Type":"application/json"},body:JSON.stringify(tweetBody)});
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

// --- YOUTUBE DATA API v3 (auto-refresh) ---
async function _ytRefreshToken(){
  var refresh=localStorage.getItem("dv_youtube_refresh");
  var cid=localStorage.getItem("dv_youtube_client_id");
  var csec=localStorage.getItem("dv_youtube_client_secret");
  if(!refresh||!cid||!csec)return null;
  try{
    var r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=refresh_token&refresh_token="+encodeURIComponent(refresh)+"&client_id="+encodeURIComponent(cid)+"&client_secret="+encodeURIComponent(csec)});
    var d=await r.json();if(d.access_token){localStorage.setItem("dv_youtube_token",d.access_token);return d.access_token;}
  }catch(e){}return null;
}
async function _ytGetToken(){
  var token=localStorage.getItem("dv_youtube_token");
  if(!token){token=await _ytRefreshToken();}
  return token;
}
async function publishToYouTube(title,description,videoUrl,privacy){
  var token=await _ytGetToken();
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
  var token=await _ytGetToken();
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
  card.appendChild(el("h3",{style:{color:"#C9A84C",margin:"0 0 8px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Professional Post Designer"));

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
  imgRow.appendChild(el("button",{style:{flex:1,background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#8899AA",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){imgFileInp.click();}},"Upload Photo"));
  imgRow.appendChild(el("button",{style:{flex:1,background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#8899AA",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
    this.textContent="Searching...";var img=await findSmartImage(caption);
    if(img){var im=new Image();im.crossOrigin="anonymous";im.onload=function(){state.bgImg=im;redraw();};im.src=img;}
    this.textContent="AI Search";
  }},"AI Search"));
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
  }},"Save PNG"));
  actRow.appendChild(el("button",{style:{flex:1,background:"linear-gradient(135deg,rgba(16,185,129,0.15),rgba(6,182,212,0.1))",border:"1px solid rgba(16,185,129,0.3)",color:"#10B981",borderRadius:"8px",padding:"10px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
    var f=POST_FORMATS[state.format];var sc=document.createElement("canvas");sc.width=f.w;sc.height=f.h;
    renderPostDesign(sc.getContext("2d"),f.w,f.h,state);
    sc.toBlob(function(b){if(b){showShareModal({text:caption||"",file:b,fileName:"dubaival-post.png",fileType:"image/png",title:"DubAIVal Post"});}});
  }},"Share"));
  card.appendChild(actRow);
  showImagePublishBar(async function(){
    var f=POST_FORMATS[state.format];var oc=document.createElement("canvas");oc.width=f.w;oc.height=f.h;
    renderPostDesign(oc.getContext("2d"),f.w,f.h,state);
    return new Promise(function(res){oc.toBlob(function(b){res(b);},"image/png");});
  },caption||"Dubai Real Estate Post",card);

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
  card.appendChild(el("h3",{style:{color:"#8B5CF6",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"A/B Caption Testing"));
  var loadingP=el("p",{style:{color:"#8899AA",fontSize:"12px",textAlign:"center"}},"Generating variants with AI...");
  card.appendChild(loadingP);
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
  generateCaptionVariants(caption,platform).then(function(result){
    loadingP.remove();
    if(!result){card.appendChild(el("p",{style:{color:"#EF4444",fontSize:"12px"}},"Could not generate variants. Check Gemini API key."));return;}
    var variants=[{label:"Original",text:caption,color:"#C9A84C"},{label:"Variant A — Emotional",text:result.variantA,color:"#10B981"},{label:"Variant B — Data-Driven",text:result.variantB,color:"#3B82F6"}];
    variants.forEach(function(v){
      var vCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"10px",padding:"10px",marginBottom:"8px"});
      vCard.appendChild(el("div",{style:{color:v.color,fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginBottom:"4px"}},v.label));
      var textEl=el("div",{style:{color:"#E0E0E0",fontSize:"11px",lineHeight:"1.5",maxHeight:"120px",overflowY:"auto",whiteSpace:"pre-wrap"}});textEl.textContent=v.text;
      vCard.appendChild(textEl);
      var abBtnRow=div({display:"flex",gap:"4px",marginTop:"6px"});
      var useBtn=el("button",{style:{background:hexAlpha(v.color,0.15),border:"1px solid "+hexAlpha(v.color,0.3),color:v.color,padding:"5px 12px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
        navigator.clipboard.writeText(v.text).then(function(){useBtn.textContent="✓ Copied!";setTimeout(function(){useBtn.textContent="Use This";},2000);});
      }});useBtn.textContent="Use This";abBtnRow.appendChild(useBtn);
      abBtnRow.appendChild(makeShareButton({text:v.text,title:"DubAIVal Caption"}));
      vCard.appendChild(abBtnRow);
      card.appendChild(vCard);
    });
    if(result.analysis){
      var aBox=div({background:"#1A0A3A",border:"1px solid #8B5CF6",borderRadius:"8px",padding:"10px",marginBottom:"8px"});
      aBox.appendChild(el("div",{style:{color:"#8B5CF6",fontSize:"10px",fontWeight:"700",fontFamily:"monospace",marginBottom:"4px"}},"AI Analysis"));
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
  var card=div({background:"#1A1F2E",border:"1px solid #F59E0B",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#F59E0B",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Hashtag Intelligence Pro"));
  var loadingP=el("p",{style:{color:"#8899AA",fontSize:"12px",textAlign:"center"}},"Analyzing hashtags with AI + Real Instagram Data...");
  card.appendChild(loadingP);
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
  analyzeHashtags(caption).then(async function(result){
    loadingP.remove();
    if(!result){card.appendChild(el("p",{style:{color:"#EF4444",fontSize:"12px"}},"Check Gemini API key."));return;}
    var allTags=[];
    var cats=[{key:"trending",label:"Trending",color:"#EF4444"},{key:"location",label:"Location",color:"#3B82F6"},{key:"property",label:"Property",color:"#10B981"},{key:"investment",label:"Investment",color:"#F59E0B"},{key:"lifestyle",label:"Lifestyle",color:"#EC4899"}];
    cats.forEach(function(cat){var tags=result[cat.key];if(tags)tags.forEach(function(t){allTags.push(typeof t==="string"?t:t.tag);});});
    var realDataNote=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",marginBottom:"10px"});
    realDataNote.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}},"Fetching real Instagram post counts..."));
    var realProgress=el("div",{style:{color:"#6B7280",fontSize:"9px",fontFamily:"monospace",marginTop:"4px"}});
    realProgress.textContent="0/"+Math.min(allTags.length,15)+" hashtags checked";
    realDataNote.appendChild(realProgress);card.appendChild(realDataNote);
    var enriched=[];
    var hasIG=!!getSocialCreds();
    if(hasIG){
      for(var ei=0;ei<Math.min(allTags.length,15);ei++){
        realProgress.textContent=(ei+1)+"/"+Math.min(allTags.length,15)+" hashtags checked";
        var rd=await fetchRealHashtagData(allTags[ei]);
        enriched.push({tag:allTags[ei],posts:rd?rd.mediaCount:null,competition:rd?(_hashtagScore(rd.mediaCount)>=70?"Low":_hashtagScore(rd.mediaCount)>=50?"Medium":"High"):"—",score:rd?_hashtagScore(rd.mediaCount):50});
      }
      realDataNote.innerHTML="";
      realDataNote.appendChild(el("div",{style:{color:"#10B981",fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}},"Real data loaded for "+enriched.filter(function(e){return e.posts!==null;}).length+" hashtags"));
      var optimalTags=enriched.filter(function(e){return e.score>=70;}).sort(function(a,b){return b.score-a.score;});
      if(optimalTags.length>0){
        realDataNote.appendChild(el("div",{style:{color:"#8899AA",fontSize:"9px",marginTop:"4px",fontFamily:"monospace"}},"Sweet spot (10K-500K posts) = highest discoverability + low competition"));
      }
    }else{
      realDataNote.innerHTML="";
      realDataNote.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"9px",fontFamily:"monospace"}},"Connect Instagram in Setup for real post counts & competition data"));
    }
    cats.forEach(function(cat){
      var tags=result[cat.key];if(!tags||tags.length===0)return;
      card.appendChild(el("div",{style:{color:cat.color,fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginTop:"10px",marginBottom:"4px"}},cat.label));
      var tagWrap=div({display:"flex",gap:"4px",flexWrap:"wrap"});
      tags.forEach(function(t){
        var tag=typeof t==="string"?t:t.tag;
        var realInfo=enriched.find(function(e){return e.tag===tag;});
        var postStr=realInfo&&realInfo.posts!==null?" · "+_formatPostCount(realInfo.posts)+" posts":"";
        var compStr=realInfo&&realInfo.competition!=="—"?" · "+realInfo.competition:"";
        var scoreColor=realInfo&&realInfo.score>=70?"#10B981":realInfo&&realInfo.score>=50?"#F59E0B":"#EF4444";
        var chip=div({display:"inline-flex",alignItems:"center",gap:"4px",background:hexAlpha(cat.color,0.08),border:"1px solid "+hexAlpha(cat.color,0.25),borderRadius:"12px",padding:"4px 8px",cursor:"pointer",transition:"all 0.2s"});
        chip.onclick=function(){navigator.clipboard.writeText(tag);chip.style.background=hexAlpha(cat.color,0.4);setTimeout(function(){chip.style.background=hexAlpha(cat.color,0.08);},500);};
        chip.appendChild(el("span",{style:{color:cat.color,fontSize:"10px",fontFamily:"monospace",fontWeight:"600"}},tag));
        if(postStr){chip.appendChild(el("span",{style:{color:scoreColor,fontSize:"8px",fontFamily:"monospace"}},postStr));}
        tagWrap.appendChild(chip);
      });card.appendChild(tagWrap);
    });
    if(enriched.length>0){
      var stratBox=div({background:"#0D1220",border:"1px solid #8B5CF6",borderRadius:"10px",padding:"10px",marginTop:"12px"});
      stratBox.appendChild(el("div",{style:{color:"#8B5CF6",fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginBottom:"6px"}},"Optimal Strategy Mix"));
      var high=enriched.filter(function(e){return e.posts&&e.posts>1000000;}).slice(0,3);
      var mid=enriched.filter(function(e){return e.posts&&e.posts>=100000&&e.posts<=1000000;}).slice(0,4);
      var niche=enriched.filter(function(e){return e.posts&&e.posts<100000&&e.posts>=1000;}).slice(0,3);
      var mixParts=[];
      if(high.length>0)mixParts.push(high.length+" broad ("+high.map(function(h){return h.tag;}).join(" ")+")");
      if(mid.length>0)mixParts.push(mid.length+" medium ("+mid.map(function(h){return h.tag;}).join(" ")+")");
      if(niche.length>0)mixParts.push(niche.length+" niche ("+niche.map(function(h){return h.tag;}).join(" ")+")");
      if(mixParts.length>0){
        mixParts.forEach(function(p){stratBox.appendChild(el("div",{style:{color:"#CCC",fontSize:"9px",lineHeight:"1.6",fontFamily:"monospace"}},p));});
        stratBox.appendChild(el("div",{style:{color:"#6B7280",fontSize:"8px",marginTop:"6px",fontStyle:"italic",fontFamily:"monospace"}},"Best formula: 3 broad + 4 medium + 3 niche = maximum reach & discoverability"));
      }
      card.appendChild(stratBox);
    }
    if(result.best_combo){
      var bestBox=div({background:"#1A1820",border:"1px solid #F59E0B",borderRadius:"8px",padding:"10px",marginTop:"10px"});
      bestBox.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"10px",fontWeight:"700",fontFamily:"monospace",marginBottom:"4px"}},"Best Combination (Copy All)"));
      var bestText=el("div",{style:{color:"#E0E0E0",fontSize:"11px",lineHeight:"1.5",cursor:"pointer"},onclick:function(){
        navigator.clipboard.writeText(result.best_combo);bestText.style.color="#10B981";setTimeout(function(){bestText.style.color="#E0E0E0";},1000);
      }});bestText.textContent=result.best_combo;bestBox.appendChild(bestText);
      var hashShareRow=div({marginTop:"6px"});
      hashShareRow.appendChild(makeShareButton({text:result.best_combo,title:"DubAIVal Hashtags"}));
      bestBox.appendChild(hashShareRow);
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
  cal.push(evt);localStorage.setItem("dv_content_calendar",JSON.stringify(cal));schedulePostReminder(evt);
  findSmartImage(evt.caption||"Dubai real estate").then(function(img){_syncCalEventToServer(evt,img);}).catch(function(){_syncCalEventToServer(evt,null);});
  return evt;
}
function deleteCalendarEvent(id){
  var cal=getCalendarData().filter(function(e){return e.id!==id;});
  localStorage.setItem("dv_content_calendar",JSON.stringify(cal));
  _deleteCalEventFromServer(id);
}

function showContentCalendar(){
  var m=document.getElementById("calendar-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"calendar-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #3B82F6",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#3B82F6",margin:"0 0 10px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Content Calendar"));

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
        var hasPublished=dayEvents.some(function(e){return e.status==="published";});
        var hasFailed=dayEvents.some(function(e){return e.status==="failed";});
        var hasScheduled=dayEvents.some(function(e){return e.status==="scheduled";});
        var dotColor=hasFailed?"#EF4444":hasPublished?"#10B981":hasScheduled?"#3B82F6":"#F59E0B";
        var dot=el("div",{style:{width:"6px",height:"6px",borderRadius:"50%",background:dotColor,margin:"2px auto 0"}});
        cell.appendChild(dot);
        if(dayEvents.length>1){cell.appendChild(el("div",{style:{color:"#6B7280",fontSize:"7px",fontFamily:"monospace"}},String(dayEvents.length)));}
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
      delBtn.textContent="×";hRow.appendChild(delBtn);evCard.appendChild(hRow);
      var cap=el("div",{style:{color:"#CCC",fontSize:"10px",lineHeight:"1.4",marginTop:"4px",maxHeight:"60px",overflow:"hidden"}});cap.textContent=(evt.caption||"").substring(0,150);evCard.appendChild(cap);
      evWrap.appendChild(evCard);
    });
    card.appendChild(evWrap);
  }

  card.appendChild(renderMonth(curYear,curMonth));

  if(cal.length>0){
    card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",marginTop:"10px",fontFamily:"monospace"}},cal.length+" scheduled post"+(cal.length>1?"s":"")));
  }

  var addBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"linear-gradient(135deg,#3B82F6,#06B6D4)",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:function(){showAddCalendarEvent();}});
  addBtn.textContent="Add New Post";card.appendChild(addBtn);

  if(cal.length>0){
    var upcomingHeader=el("div",{style:{color:"#3B82F6",fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginTop:"12px",marginBottom:"6px"}});
    upcomingHeader.textContent="Upcoming Posts";card.appendChild(upcomingHeader);
    var today=new Date().toISOString().split("T")[0];
    var upcoming=cal.filter(function(e){return e.date>=today;}).sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;}).slice(0,5);
    var platIcons={instagram:"IG",facebook:"FB",linkedin:"LI",twitter:"X",whatsapp:"WA",youtube:"YT",all:"ALL"};
    upcoming.forEach(function(evt){
      var evCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",marginBottom:"4px",display:"flex",justifyContent:"space-between",alignItems:"center"});
      var leftCol=div({flex:"1",overflow:"hidden"});
      leftCol.appendChild(el("div",{style:{color:"#3B82F6",fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}},evt.date+" "+evt.time+" "+(platIcons[evt.platform]||"")));
      leftCol.appendChild(el("div",{style:{color:"#CCC",fontSize:"9px",marginTop:"2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},(evt.caption||"").substring(0,60)));
      evCard.appendChild(leftCol);
      var delBtn=el("button",{style:{background:"none",border:"none",color:"#EF4444",fontSize:"12px",cursor:"pointer",flexShrink:"0",padding:"4px"},onclick:function(){deleteCalendarEvent(evt.id);evCard.remove();}});
      delBtn.textContent="×";evCard.appendChild(delBtn);
      card.appendChild(evCard);
    });
  }

  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- MULTI-LANGUAGE TRANSLATOR (with Translation Memory) ---
var _RE_TERMS={
  en:{"PSF":"PSF","sqft":"sqft","AED":"AED","ROI":"ROI","yield":"yield","DLD":"DLD","RERA":"RERA","off-plan":"off-plan","ready":"ready","freehold":"freehold","leasehold":"leasehold"},
  ar:{"PSF":"سعر القدم المربع","sqft":"قدم مربع","yield":"العائد","off-plan":"على الخريطة","ready":"جاهز","freehold":"تملك حر","leasehold":"إيجار طويل"},
  fa:{"PSF":"قیمت هر فوت مربع","sqft":"فوت مربع","yield":"بازده","off-plan":"پیش‌فروش","ready":"آماده تحویل","freehold":"مالکیت آزاد","leasehold":"اجاره بلندمدت"},
  ru:{"PSF":"цена за кв.фут","sqft":"кв.фут","yield":"доходность","off-plan":"на этапе строительства","ready":"готовая","freehold":"свободная собственность"},
  zh:{"PSF":"每平方英尺价格","sqft":"平方英尺","yield":"收益率","off-plan":"期房","ready":"现房","freehold":"永久产权"},
  hi:{"PSF":"प्रति वर्ग फुट","sqft":"वर्ग फुट","yield":"उपज","off-plan":"ऑफ-प्लान","ready":"तैयार","freehold":"फ्रीहोल्ड"},
  fr:{"PSF":"prix/pied carré","sqft":"pied carré","yield":"rendement","off-plan":"sur plan","ready":"prêt","freehold":"pleine propriété"}
};
async function translatePost(caption,targetLang,langCode){
  var hash=_simpleHash(caption);
  var cached=_getCachedTranslation(hash,langCode||"xx");
  if(cached)return cached;
  var geminiKey=localStorage.getItem("dv_gemini_key");if(!geminiKey)return null;
  var termGlossary=_RE_TERMS[langCode]?"\n\nUse this real estate glossary for accurate terminology:\n"+Object.keys(_RE_TERMS[langCode]).map(function(k){return k+" → "+_RE_TERMS[langCode][k];}).join(", "):"";
  try{
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:"You are a professional multilingual real estate marketing translator specializing in Dubai luxury property."+termGlossary+"\n\nOriginal post:\n"+caption+"\n\nTranslate to "+targetLang+".\nRules:\n- Keep emojis and formatting intact\n- Adapt hashtags: keep top English ones + add 3-5 local language hashtags\n- Keep numbers (AED, sqft, %) in original format — NEVER convert currencies\n- Adapt cultural tone for "+targetLang+" luxury real estate audience\n- Keep brand mentions (DubAIVal, dubaival.com) unchanged\n- Arabic/Farsi: right-to-left friendly, use ، instead of , for lists\n- Chinese: use 万/亿 for large numbers if natural\n- Russian: formal Вы for addressing readers\n\nRespond in valid JSON:\n{\"translated\":\"FULL TRANSLATED POST\",\"lang\":\""+targetLang+"\",\"notes\":\"Cultural adaptations made\",\"hashtags_added\":[\"#tag\"],\"confidence\":85,\"wordCount\":0}"}]}],generationConfig:{responseMimeType:"application/json"}})
    });
    var d=await r.json();
    if(d.candidates&&d.candidates[0]){
      var result=JSON.parse(d.candidates[0].content.parts[0].text);
      _saveTranslation(hash,langCode||"xx",result);
      return result;
    }
  }catch(e){}return null;
}
function showMultiLanguage(caption){
  var m=document.getElementById("multilang-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"multilang-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #06B6D4",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#06B6D4",margin:"0 0 4px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Multi-Language Translator"));
  card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",marginBottom:"12px",fontFamily:"monospace"}},"Translate your post for international Dubai audiences"));
  var languages=[
    {code:"ar",name:"العربية (Arabic)",flag:"AR",color:"#10B981",audience:"UAE & GCC buyers"},
    {code:"fa",name:"فارسی (Farsi)",flag:"FA",color:"#8B5CF6",audience:"Iranian investors"},
    {code:"ru",name:"Русский (Russian)",flag:"RU",color:"#3B82F6",audience:"Russian-speaking investors"},
    {code:"zh",name:"中文 (Chinese)",flag:"ZH",color:"#EF4444",audience:"Chinese HNW buyers"},
    {code:"hi",name:"हिन्दी (Hindi)",flag:"HI",color:"#F59E0B",audience:"Indian investors"},
    {code:"fr",name:"Français (French)",flag:"FR",color:"#EC4899",audience:"Francophone African & European buyers"}
  ];
  var resultArea=div({});
  var langGrid=div({display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px",marginBottom:"12px"});
  languages.forEach(function(lang){
    var langBtn=el("button",{style:{background:hexAlpha(lang.color,0.08),border:"1px solid "+hexAlpha(lang.color,0.25),color:lang.color,padding:"10px 6px",borderRadius:"10px",fontSize:"10px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace",textAlign:"center",transition:"all 0.2s"},onclick:async function(){
      langBtn.textContent="...";
      var result=await translatePost(caption,lang.name,lang.code);
      langBtn.textContent=lang.flag+" "+lang.code.toUpperCase();
      if(!result){resultArea.innerHTML="";resultArea.appendChild(el("p",{style:{color:"#EF4444",fontSize:"11px"}},"Check Gemini API key."));return;}
      var rCard=div({background:"#0D1117",border:"1px solid "+hexAlpha(lang.color,0.3),borderRadius:"10px",padding:"12px",marginBottom:"8px"});
      rCard.appendChild(el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}},
        el("span",{style:{color:lang.color,fontSize:"11px",fontWeight:"700",fontFamily:"monospace"}},lang.flag+" "+lang.name),
        el("span",{style:{color:"#6B7280",fontSize:"9px",fontFamily:"monospace"}},lang.audience)
      ));
      var textEl=el("div",{style:{color:"#E0E0E0",fontSize:"11px",lineHeight:"1.6",whiteSpace:"pre-wrap",maxHeight:"200px",overflowY:"auto",direction:lang.code==="ar"||lang.code==="fa"?"rtl":"ltr"}});
      textEl.textContent=result.translated;rCard.appendChild(textEl);
      if(result.notes){rCard.appendChild(el("div",{style:{color:"#6B7280",fontSize:"9px",marginTop:"6px",fontStyle:"italic"}},result.notes));}
      if(result.hashtags_added&&result.hashtags_added.length>0){
        var tagWrap=div({display:"flex",gap:"3px",flexWrap:"wrap",marginTop:"6px"});
        result.hashtags_added.forEach(function(t){tagWrap.appendChild(el("span",{style:{background:hexAlpha(lang.color,0.12),color:lang.color,padding:"2px 6px",borderRadius:"8px",fontSize:"9px",fontFamily:"monospace"}},t));});
        rCard.appendChild(tagWrap);
      }
      var btnRow=div({display:"flex",gap:"4px",marginTop:"8px"});
      var copyBtn=el("button",{style:{background:hexAlpha(lang.color,0.15),border:"1px solid "+hexAlpha(lang.color,0.3),color:lang.color,padding:"5px 10px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){navigator.clipboard.writeText(result.translated);copyBtn.textContent="✓ Copied!";setTimeout(function(){copyBtn.textContent="Copy";},2000);}});
      copyBtn.textContent="Copy";btnRow.appendChild(copyBtn);
      btnRow.appendChild(makeShareButton({text:result.translated,title:"DubAIVal — "+lang.name}));
      var schedBtn=el("button",{style:{background:hexAlpha("#3B82F6",0.15),border:"1px solid "+hexAlpha("#3B82F6",0.3),color:"#3B82F6",padding:"5px 10px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){saveCalendarEvent({caption:result.translated,platform:"all",language:lang.code});schedBtn.textContent="✓ Scheduled!";setTimeout(function(){schedBtn.textContent="Schedule";},2000);}});
      schedBtn.textContent="Schedule";btnRow.appendChild(schedBtn);
      rCard.appendChild(btnRow);
      resultArea.appendChild(rCard);
    }});
    langBtn.textContent=lang.flag+" "+lang.code.toUpperCase();langGrid.appendChild(langBtn);
  });
  var allBtn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,#06B6D4,#8B5CF6)",color:"#FFF",border:"none",borderRadius:"10px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},onclick:async function(){
    allBtn.textContent="Translating to all 6 languages...";resultArea.innerHTML="";
    for(var li=0;li<languages.length;li++){
      var lang=languages[li];
      allBtn.textContent=lang.flag+" "+(li+1)+"/"+languages.length+"...";
      var result=await translatePost(caption,lang.name,lang.code);
      if(result){
        var rCard=div({background:"#0D1117",border:"1px solid "+hexAlpha(lang.color,0.3),borderRadius:"10px",padding:"10px",marginBottom:"6px"});
        var hdr=div({display:"flex",justifyContent:"space-between",alignItems:"center"});
        hdr.appendChild(el("span",{style:{color:lang.color,fontSize:"11px",fontWeight:"700",fontFamily:"monospace"}},lang.flag+" "+lang.name));
        var cpBtn=el("button",{style:{background:hexAlpha(lang.color,0.15),border:"1px solid "+hexAlpha(lang.color,0.3),color:lang.color,padding:"3px 8px",borderRadius:"6px",fontSize:"9px",cursor:"pointer",fontFamily:"monospace"}});
        cpBtn.textContent="Copy";
        (function(txt,b){b.onclick=function(){navigator.clipboard.writeText(txt);b.textContent="✓";setTimeout(function(){b.textContent="Copy";},1500);};})(result.translated,cpBtn);
        var hdrBtns=div({display:"flex",gap:"4px"});
        hdrBtns.appendChild(cpBtn);
        (function(txt,ln){hdrBtns.appendChild(makeShareButton({text:txt,title:"DubAIVal — "+ln},{padding:"3px 8px",fontSize:"9px"}));})(result.translated,lang.name);
        hdr.appendChild(hdrBtns);rCard.appendChild(hdr);
        var tx=el("div",{style:{color:"#CCC",fontSize:"10px",lineHeight:"1.5",whiteSpace:"pre-wrap",maxHeight:"80px",overflowY:"auto",marginTop:"4px",direction:lang.code==="ar"||lang.code==="fa"?"rtl":"ltr"}});
        tx.textContent=result.translated;rCard.appendChild(tx);
        resultArea.appendChild(rCard);
      }
    }
    allBtn.textContent="Translate All (6 Languages)";
  }});
  allBtn.textContent="Translate All (6 Languages)";
  card.appendChild(langGrid);card.appendChild(allBtn);card.appendChild(resultArea);
  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- HOOK-STORY-OFFER GENERATOR (Neuromarketing) ---
async function generateHSO(caption,framework){
  var geminiKey=localStorage.getItem("dv_gemini_key");if(!geminiKey)return null;
  var bp=getBrandProfile();var brandCtx=bp?" Brand: "+bp.name+(bp.tone?", Tone: "+bp.tone:""):"";
  var frameworks={
    "hook-story-offer":"HOOK-STORY-OFFER:\n- HOOK (1-2 lines): Pattern interrupt, bold claim, or question that stops the scroll. Use numbers, curiosity gap, or controversy.\n- STORY (3-5 lines): Personal anecdote, client success, or market insight. Create emotional connection. Use sensory language.\n- OFFER (2-3 lines): Clear CTA. What they get, how to get it, why now (urgency/scarcity).",
    "aida":"AIDA Framework:\n- ATTENTION: Bold opening that grabs instantly\n- INTEREST: Relevant facts/data that builds curiosity\n- DESIRE: Benefits, lifestyle, FOMO\n- ACTION: Clear next step CTA",
    "pas":"PAS Framework:\n- PROBLEM: Pain point your audience faces\n- AGITATE: Make the problem feel urgent\n- SOLUTION: Your property/service as the answer",
    "bab":"BAB Framework:\n- BEFORE: Current situation/struggle\n- AFTER: Dream outcome with specific details\n- BRIDGE: How your property/service gets them there",
    "fomo":"FOMO/Scarcity Framework:\n- LIMITED SUPPLY: Only X units, last chance, closing soon\n- SOCIAL PROOF: X people viewed, X inquiries this week\n- URGENCY: Price increase date, market momentum\n- EXCLUSIVITY: Pre-launch, VIP, invite-only"
  };
  var fwDesc=frameworks[framework]||frameworks["hook-story-offer"];
  try{
    var r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key="+geminiKey,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:"You are an expert neuromarketing copywriter for Dubai luxury real estate."+brandCtx+"\n\nOriginal caption:\n"+caption+"\n\nRewrite using the "+framework.toUpperCase()+" framework:\n"+fwDesc+"\n\nNeuromarketing principles to apply:\n- Power words: exclusive, limited, premium, verified, proven, guaranteed\n- Numbers: specific AED figures, %, ROI numbers from the original\n- Sensory language: imagine waking up to, picture yourself, feel the breeze\n- Social proof: used by X investors, X properties sold, trusted by\n- Scarcity: only X available, limited time, prices rising\n- Authority: DLD-verified, RERA-approved, award-winning\n\nRespond in valid JSON:\n{\"rewritten\":\"FULL POST with framework applied\",\"framework\":\""+framework+"\",\"hook_type\":\"type of hook used\",\"psychology_used\":[\"scarcity\",\"social proof\"],\"predicted_engagement\":\"High/Medium/Low\",\"why\":\"Brief explanation of why this version converts better\"}"}]}],generationConfig:{responseMimeType:"application/json"}})
    });
    var d=await r.json();
    if(d.candidates&&d.candidates[0])return JSON.parse(d.candidates[0].content.parts[0].text);
  }catch(e){}return null;
}
function showHookStoryOffer(caption){
  var m=document.getElementById("hso-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"hso-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #F43F5E",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#F43F5E",margin:"0 0 4px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Neuromarketing Post Builder"));
  card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",marginBottom:"12px",fontFamily:"monospace"}},"Rewrite your post using proven psychological frameworks"));
  var fwList=[
    {id:"hook-story-offer",name:"Hook-Story-Offer",icon:"HSO",color:"#F43F5E",desc:"Pattern interrupt → emotional story → CTA"},
    {id:"aida",name:"AIDA",icon:"AIDA",color:"#3B82F6",desc:"Attention → Interest → Desire → Action"},
    {id:"pas",name:"PAS",icon:"PAS",color:"#F59E0B",desc:"Problem → Agitate → Solution"},
    {id:"bab",name:"BAB",icon:"BAB",color:"#10B981",desc:"Before → After → Bridge"},
    {id:"fomo",name:"FOMO/Scarcity",icon:"FOMO",color:"#EF4444",desc:"Urgency + social proof + exclusivity"}
  ];
  var resultArea=div({});
  var fwGrid=div({display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"6px",marginBottom:"12px"});
  fwList.forEach(function(fw){
    var fwBtn=el("button",{style:{background:hexAlpha(fw.color,0.08),border:"1px solid "+hexAlpha(fw.color,0.25),color:fw.color,padding:"10px 8px",borderRadius:"10px",fontSize:"10px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace",textAlign:"left",transition:"all 0.2s"},onclick:async function(){
      fwBtn.textContent="Generating...";resultArea.innerHTML="";
      var result=await generateHSO(caption,fw.id);
      _trackFrameworkUse(fw.id);
      fwBtn.innerHTML="";fwBtn.appendChild(document.createTextNode(fw.icon+" "+fw.name));
      fwBtn.appendChild(el("div",{style:{fontSize:"8px",color:"#8899AA",marginTop:"2px",fontWeight:"400"}},fw.desc));
      if(!result){resultArea.appendChild(el("p",{style:{color:"#EF4444",fontSize:"11px"}},"Check Gemini API key."));return;}
      var rCard=div({background:"#0D1117",border:"1px solid "+hexAlpha(fw.color,0.3),borderRadius:"10px",padding:"12px"});
      var hdr=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"});
      hdr.appendChild(el("span",{style:{color:fw.color,fontSize:"11px",fontWeight:"700",fontFamily:"monospace"}},fw.icon+" "+fw.name));
      if(result.predicted_engagement){
        var engColor=result.predicted_engagement==="High"?"#10B981":result.predicted_engagement==="Medium"?"#F59E0B":"#EF4444";
        hdr.appendChild(el("span",{style:{background:hexAlpha(engColor,0.15),color:engColor,padding:"2px 8px",borderRadius:"8px",fontSize:"9px",fontFamily:"monospace"}},result.predicted_engagement));
      }
      rCard.appendChild(hdr);
      var textEl=el("div",{style:{color:"#E0E0E0",fontSize:"11px",lineHeight:"1.6",whiteSpace:"pre-wrap",maxHeight:"250px",overflowY:"auto"}});
      textEl.textContent=result.rewritten;rCard.appendChild(textEl);
      if(result.psychology_used&&result.psychology_used.length>0){
        var psyRow=div({display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"8px"});
        result.psychology_used.forEach(function(p){psyRow.appendChild(el("span",{style:{background:"#F43F5E18",color:"#F43F5E",padding:"2px 6px",borderRadius:"8px",fontSize:"8px",fontFamily:"monospace"}},p));});
        rCard.appendChild(psyRow);
      }
      if(result.why){rCard.appendChild(el("div",{style:{color:"#6B7280",fontSize:"9px",marginTop:"6px",fontStyle:"italic"}},result.why));}
      var btnRow=div({display:"flex",gap:"4px",marginTop:"8px"});
      var copyBtn=el("button",{style:{background:hexAlpha(fw.color,0.15),border:"1px solid "+hexAlpha(fw.color,0.3),color:fw.color,padding:"5px 10px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){navigator.clipboard.writeText(result.rewritten);copyBtn.textContent="✓ Copied!";setTimeout(function(){copyBtn.textContent="Copy";},2000);}});
      copyBtn.textContent="Copy";btnRow.appendChild(copyBtn);
      btnRow.appendChild(makeShareButton({text:result.rewritten,title:"DubAIVal — "+fw.name}));
      var schedBtn=el("button",{style:{background:hexAlpha("#3B82F6",0.15),border:"1px solid "+hexAlpha("#3B82F6",0.3),color:"#3B82F6",padding:"5px 10px",borderRadius:"6px",fontSize:"10px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){saveCalendarEvent({caption:result.rewritten,platform:"all",framework:fw.id});schedBtn.textContent="✓ Scheduled!";setTimeout(function(){schedBtn.textContent="Schedule";},2000);}});
      schedBtn.textContent="Schedule";btnRow.appendChild(schedBtn);
      rCard.appendChild(btnRow);
      resultArea.appendChild(rCard);
    }});
    fwBtn.appendChild(document.createTextNode(fw.icon+" "+fw.name));
    fwBtn.appendChild(el("div",{style:{fontSize:"8px",color:"#8899AA",marginTop:"2px",fontWeight:"400"}},fw.desc));
    fwGrid.appendChild(fwBtn);
  });
  var allFwBtn=el("button",{style:{gridColumn:"1/-1",background:"linear-gradient(135deg,#F43F5E,#8B5CF6)",color:"#FFF",border:"none",borderRadius:"10px",padding:"10px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:async function(){
    allFwBtn.textContent="Generating all 5 frameworks...";resultArea.innerHTML="";
    for(var fi=0;fi<fwList.length;fi++){
      allFwBtn.textContent=fwList[fi].icon+" "+(fi+1)+"/5...";
      var result=await generateHSO(caption,fwList[fi].id);
      if(result){
        var fw=fwList[fi];
        var rCard=div({background:"#0D1117",border:"1px solid "+hexAlpha(fw.color,0.3),borderRadius:"8px",padding:"10px",marginBottom:"6px"});
        var hdr2=div({display:"flex",justifyContent:"space-between",alignItems:"center"});
        hdr2.appendChild(el("span",{style:{color:fw.color,fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}},fw.icon+" "+fw.name));
        var cp=el("button",{style:{background:hexAlpha(fw.color,0.15),border:"1px solid "+hexAlpha(fw.color,0.3),color:fw.color,padding:"3px 8px",borderRadius:"6px",fontSize:"9px",cursor:"pointer",fontFamily:"monospace"}});
        cp.textContent="Copy";
        (function(txt,b){b.onclick=function(){navigator.clipboard.writeText(txt);b.textContent="✓";setTimeout(function(){b.textContent="Copy";},1500);};})(result.rewritten,cp);
        var hdr2Btns=div({display:"flex",gap:"4px"});
        hdr2Btns.appendChild(cp);
        (function(txt,fn){hdr2Btns.appendChild(makeShareButton({text:txt,title:"DubAIVal — "+fn},{padding:"3px 8px",fontSize:"9px"}));})(result.rewritten,fw.name);
        hdr2.appendChild(hdr2Btns);rCard.appendChild(hdr2);
        var tx=el("div",{style:{color:"#CCC",fontSize:"10px",lineHeight:"1.5",whiteSpace:"pre-wrap",maxHeight:"100px",overflowY:"auto",marginTop:"4px"}});
        tx.textContent=result.rewritten;rCard.appendChild(tx);
        if(result.psychology_used){
          var pRow=div({display:"flex",gap:"3px",flexWrap:"wrap",marginTop:"4px"});
          result.psychology_used.forEach(function(p){pRow.appendChild(el("span",{style:{background:"#F43F5E12",color:"#F43F5E",padding:"1px 5px",borderRadius:"6px",fontSize:"7px",fontFamily:"monospace"}},p));});
          rCard.appendChild(pRow);
        }
        resultArea.appendChild(rCard);
      }
    }
    allFwBtn.textContent="Generate All 5 Frameworks";
  }});
  allFwBtn.textContent="Generate All 5 Frameworks";
  fwGrid.appendChild(allFwBtn);
  card.appendChild(fwGrid);card.appendChild(resultArea);
  card.appendChild(el("button",{style:{width:"100%",marginTop:"10px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- CONTENT CALENDAR ADD EVENT UI ---
function showAddCalendarEvent(defaultCaption){
  var m=document.getElementById("add-cal-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"add-cal-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #3B82F6",borderRadius:"16px",padding:"16px",width:"420px",maxWidth:"96vw"});
  card.appendChild(el("h3",{style:{color:"#3B82F6",margin:"0 0 12px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Schedule Post"));
  var tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
  var defDate=tomorrow.toISOString().split("T")[0];
  var fields=[
    {key:"date",label:"Date",type:"date",def:defDate},
    {key:"time",label:"Time",type:"time",def:"10:00"},
    {key:"platform",label:"Platform",type:"select",options:["instagram","facebook","linkedin","twitter","whatsapp","youtube","all"],def:"all"},
    {key:"pillar",label:"Content Pillar",type:"select",options:["Market Data","Area Spotlight","Investment Tips","Lifestyle","Success Story","FAQ","Trending News","General"],def:"General"}
  ];
  var inputs={};
  fields.forEach(function(f){
    var lbl=el("label",{style:{color:"#8899AA",fontSize:"11px",display:"block",marginBottom:"3px",fontFamily:"monospace"}});
    lbl.textContent=f.label;card.appendChild(lbl);
    var inp;
    if(f.type==="select"){
      inp=el("select",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"12px",fontFamily:"monospace",boxSizing:"border-box",marginBottom:"8px"}});
      f.options.forEach(function(o){var opt=el("option");opt.value=o;opt.textContent=o.charAt(0).toUpperCase()+o.slice(1);if(o===f.def)opt.selected=true;inp.appendChild(opt);});
    }else{
      inp=el("input",{type:f.type,style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"12px",fontFamily:"monospace",boxSizing:"border-box",marginBottom:"8px"},value:f.def});
    }
    card.appendChild(inp);inputs[f.key]=inp;
  });
  var capLbl=el("label",{style:{color:"#8899AA",fontSize:"11px",display:"block",marginBottom:"3px",fontFamily:"monospace"}});
  capLbl.textContent="Caption";card.appendChild(capLbl);
  var capInp=el("textarea",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box",minHeight:"80px",resize:"vertical"},placeholder:"Post caption..."});
  capInp.value=defaultCaption||"";card.appendChild(capInp);
  var btnRow=div({display:"flex",gap:"8px",marginTop:"12px"});
  var saveBtn=el("button",{style:{flex:"1",background:"#3B82F6",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
    var evt={caption:capInp.value,date:inputs.date.value,time:inputs.time.value,platform:inputs.platform.value,pillar:inputs.pillar.value};
    saveCalendarEvent(evt);overlay.remove();
    var existing=document.getElementById("calendar-modal");if(existing){existing.remove();showContentCalendar();}
  }});saveBtn.textContent="Schedule";btnRow.appendChild(saveBtn);
  var cancelBtn=el("button",{style:{flex:"1",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}});
  cancelBtn.textContent="Cancel";btnRow.appendChild(cancelBtn);
  card.appendChild(btnRow);
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
    btn.textContent="Failed";btn.style.background="#EF444433";btn.style.color="#EF4444";
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
    igLabel.textContent="Instagram";
    igRow.appendChild(igLabel);

    var igPostLabel=imgCount>1?"Carousel ("+imgCount+")":"Post";
    igRow.appendChild(makeBtn(igPostLabel,"#E1306C",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Images...";
      var imgs=await findMultipleImages(caption,imgCount);
      showPreviews(imgs);
      this.textContent="Publishing...";
      var r=await publishToInstagram(caption,imgs);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent=""+(r.carousel?"Carousel ":"")+"Done";successBtn(this);savePostToHistory({caption:caption,platform:"instagram",type:"post"});}
      else{alert("IG: "+(r.error||"Error"));failBtn(this,igPostLabel,"#E1306C");}
    }));

    igRow.appendChild(makeBtn("Story","#C13584",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Image...";
      var img=await findSmartImage(caption);
      showPreviews([img]);
      this.textContent="Posting story...";
      var r=await publishInstagramStory(caption,img);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Story Posted";successBtn(this);savePostToHistory({caption:caption,platform:"instagram",type:"story"});}
      else{alert("IG Story: "+(r.error||"Error"));failBtn(this,"Story","#C13584");}
    }));

    igRow.appendChild(makeBtn("Video","#5B51D8",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Uploading video...";
      var r=await publishInstagramReel(caption,vUrl);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Video Posted";successBtn(this);}
      else{alert("IG Video: "+(r.error||"Error"));failBtn(this,"Video","#5B51D8");}
    }));

    igRow.appendChild(makeBtn("Reel","#FF6B00",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Uploading reel...";
      var r=await publishInstagramReel(caption,vUrl);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Reel Posted";successBtn(this);}
      else{alert("IG Reel: "+(r.error||"Error"));failBtn(this,"Reel","#FF6B00");}
    }));

    igRow.appendChild(makeBtn("Video Story","#833AB4",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Uploading...";
      var r=await publishInstagramVideoStory(vUrl);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Video Story Posted";successBtn(this);}
      else{alert("IG Video Story: "+(r.error||"Error"));failBtn(this,"Video Story","#833AB4");}
    }));

    igRow.appendChild(makeBtn("AI Video","#C9A84C",function(){showVideoGenUI(caption);}));
    bar.appendChild(igRow);
  }

  // --- FACEBOOK ---
  if(platform==="facebook"||platform==="all"){
    var fbRow=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
    var fbLabel=el("span",{style:{color:"#1877F2",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",minWidth:"70px"}});
    fbLabel.textContent="Facebook";
    fbRow.appendChild(fbLabel);

    var fbPostLabel=imgCount>1?"Photo Post ("+imgCount+")":"Photo Post";
    fbRow.appendChild(makeBtn(fbPostLabel,"#1877F2",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Images...";
      var imgs=await findMultipleImages(caption,imgCount);
      showPreviews(imgs);
      this.textContent="Publishing...";
      var r=await publishToFacebook(caption,imgs);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent=""+(r.multi?"("+r.count+" pics) ":"")+"Done";successBtn(this);savePostToHistory({caption:caption,platform:"facebook",type:"post"});}
      else{alert("FB: "+(r.error||"Error"));failBtn(this,fbPostLabel,"#1877F2");}
    }));

    fbRow.appendChild(makeBtn("Text Only","#4267B2",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Posting...";
      var r=await publishToFacebook(caption,[]);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Posted";successBtn(this);}
      else{alert("FB: "+(r.error||"Error"));failBtn(this,"Text Only","#4267B2");}
    }));

    fbRow.appendChild(makeBtn("Video","#1877F2",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Uploading video...";
      var r=await publishFacebookVideo(caption,vUrl);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Video Posted";successBtn(this);}
      else{alert("FB Video: "+(r.error||"Error"));failBtn(this,"Video","#1877F2");}
    }));

    fbRow.appendChild(makeBtn("Reel","#1877F2",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Uploading reel...";
      var r=await publishFacebookReel(caption,vUrl);
      SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Reel Posted";successBtn(this);}
      else{alert("FB Reel: "+(r.error||"Error"));failBtn(this,"Reel","#1877F2");}
    }));

    bar.appendChild(fbRow);
  }

  // --- WHATSAPP ---
  if(platform==="whatsapp"||platform==="all"){
    var waRow=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
    var waLabel=el("span",{style:{color:"#25D366",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",minWidth:"70px"}});
    waLabel.textContent="WhatsApp";
    waRow.appendChild(waLabel);

    waRow.appendChild(makeBtn("Text","#25D366",function(){
      shareToWhatsApp(caption);this.textContent="Opened";successBtn(this);
    }));

    waRow.appendChild(makeBtn("Photo","#128C7E",async function(){
      this.textContent="Finding image...";
      var imgUrl=await findSmartImage(caption);
      try{
        var resp=await fetch(imgUrl);var blob=await resp.blob();
        var file=new File([blob],"dubaival-post.jpg",{type:blob.type||"image/jpeg"});
        if(navigator.canShare&&navigator.canShare({files:[file]})){
          await navigator.share({text:caption,files:[file]});
          this.textContent="Shared";successBtn(this);
        }else{
          shareToWhatsApp(caption+"\n\n"+imgUrl);
          this.textContent="Opened";successBtn(this);
        }
      }catch(e){
        shareToWhatsApp(caption+"\n\n"+imgUrl);
        this.textContent="Opened";successBtn(this);
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
          this.textContent="Shared";successBtn(this);
        }else{
          shareToWhatsApp(caption+"\n\n"+vUrl);
          this.textContent="Opened";successBtn(this);
        }
      }catch(e){
        shareToWhatsApp(caption+"\n\n"+vUrl);
        this.textContent="Opened";successBtn(this);
      }
    }));

    waRow.appendChild(makeBtn("Multi Photo","#25D366",async function(){
      this.textContent="Finding images...";
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
          this.textContent="Shared";successBtn(this);
        }else{
          shareToWhatsApp(caption+"\n\n"+imgs.join("\n"));
          this.textContent="Opened";successBtn(this);
        }
      }catch(e){
        shareToWhatsApp(caption);
        this.textContent="Opened";successBtn(this);
      }
    }));

    bar.appendChild(waRow);
  }

  // --- LINKEDIN ---
  if(platform==="linkedin"||platform==="all"){
    var liRow=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
    var liLabel=el("span",{style:{color:"#0A66C2",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",minWidth:"70px"}});
    liLabel.textContent="LinkedIn";liRow.appendChild(liLabel);
    liRow.appendChild(makeBtn("Post","#0A66C2",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Publishing...";
      var r=await publishToLinkedIn(caption);SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Posted";successBtn(this);savePostToHistory({caption:caption,platform:"linkedin",type:"post"});}
      else{alert("LinkedIn: "+(r.error||"Error"));failBtn(this,"Post","#0A66C2");}
    }));
    liRow.appendChild(makeBtn("With Image","#0A66C2",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Image...";var img=await findSmartImage(caption);showPreviews([img]);
      this.textContent="Publishing...";
      var r=await publishToLinkedIn(caption,img);SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Posted";successBtn(this);savePostToHistory({caption:caption,platform:"linkedin",type:"image"});}
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
      this.textContent="Tweeting...";
      var tweetText=caption.length>280?caption.substring(0,277)+"...":caption;
      var r=await publishToTwitter(tweetText);SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Tweeted";successBtn(this);savePostToHistory({caption:tweetText,platform:"twitter",type:"tweet"});}
      else{alert("X: "+(r.error||"Error"));failBtn(this,"Tweet","#1DA1F2");}
    }));
    xRow.appendChild(makeBtn("With Image","#1DA1F2",async function(){
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Image...";var img=await findSmartImage(caption);showPreviews([img]);
      this.textContent="Tweeting...";
      var tweetText=caption.length>280?caption.substring(0,277)+"...":caption;
      var r=await publishToTwitter(tweetText,img);SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Tweeted";successBtn(this);savePostToHistory({caption:tweetText,platform:"twitter",type:"image"});}
      else{alert("X: "+(r.error||"Error"));failBtn(this,"With Image","#1DA1F2");}
    }));
    bar.appendChild(xRow);
  }

  // --- TIKTOK ---
  if(platform==="tiktok"||platform==="all"){
    var ttRow=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
    var ttLabel=el("span",{style:{color:"#FF0050",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",minWidth:"70px"}});
    ttLabel.textContent="TikTok";ttRow.appendChild(ttLabel);
    ttRow.appendChild(makeBtn("Video","#FF0050",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Uploading...";
      var r=await publishToTikTok(caption,vUrl);SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Posted";successBtn(this);savePostToHistory({caption:caption,platform:"tiktok",type:"video"});}
      else{alert("TikTok: "+(r.error||"Error"));failBtn(this,"Video","#FF0050");}
    }));
    bar.appendChild(ttRow);
  }

  // --- YOUTUBE ---
  if(platform==="youtube"||platform==="all"){
    var ytRow=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
    var ytLabel=el("span",{style:{color:"#FF0000",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",minWidth:"70px"}});
    ytLabel.textContent="YouTube";ytRow.appendChild(ytLabel);
    ytRow.appendChild(makeBtn("Video","#FF0000",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Uploading...";
      var title=caption.split("\n")[0].substring(0,100)||"Dubai Property | DubAIVal";
      var r=await publishToYouTube(title,caption,vUrl,"public");SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Uploaded";successBtn(this);savePostToHistory({caption:caption,platform:"youtube",type:"video"});if(r.url)alert("Video live: "+r.url);}
      else{alert("YouTube: "+(r.error||"Error"));failBtn(this,"Video","#FF0000");}
    }));
    ytRow.appendChild(makeBtn("Short","#FF0000",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Uploading Short...";
      var title=caption.split("\n")[0].substring(0,80)||"Dubai Property";
      var r=await publishYouTubeShort(title,caption,vUrl);SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Short Up";successBtn(this);savePostToHistory({caption:caption,platform:"youtube",type:"short"});if(r.url)alert("Short live: "+r.url);}
      else{alert("YT Short: "+(r.error||"Error"));failBtn(this,"Short","#FF0000");}
    }));
    ytRow.appendChild(makeBtn("Unlisted","#CC0000",async function(){
      var vUrl=videoUrlInput.value.trim();
      if(!vUrl){videoUrlInput.style.display="block";videoUrlInput.focus();alert("Paste a video URL first");return;}
      if(SOCIAL_STATE.publishing)return;SOCIAL_STATE.publishing=true;
      this.textContent="Uploading...";
      var title=caption.split("\n")[0].substring(0,100)||"Dubai Property Preview";
      var r=await publishToYouTube(title,caption,vUrl,"unlisted");SOCIAL_STATE.publishing=false;
      if(r.success){this.textContent="Uploaded";successBtn(this);savePostToHistory({caption:caption,platform:"youtube",type:"unlisted"});if(r.url)alert("Unlisted video: "+r.url);}
      else{alert("YouTube: "+(r.error||"Error"));failBtn(this,"Unlisted","#CC0000");}
    }));
    bar.appendChild(ytRow);
  }

  // --- TOOLS ROW 1: Creation ---
  var toolRow1=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap",paddingTop:"6px",borderTop:"1px solid "+cl.border});
  toolRow1.appendChild(el("span",{style:{color:"#6B7280",fontSize:"9px",fontFamily:"monospace",minWidth:"40px"}},"Create:"));
  var copyBtn=makeBtn("Copy","#9CA3AF",function(){
    navigator.clipboard.writeText(caption).then(function(){
      copyBtn.textContent="Copied";setTimeout(function(){copyBtn.textContent="Copy";},2000);
    });
  });
  toolRow1.appendChild(copyBtn);
  toolRow1.appendChild(makeBtn("AI Video","#C9A84C",function(){showVideoGenUI(caption);}));
  toolRow1.appendChild(makeBtn("Edit Video","#EC4899",function(){showVideoEditor();}));
  toolRow1.appendChild(makeBtn("Design Post","#8B5CF6",function(){showPostDesigner(caption);}));
  toolRow1.appendChild(makeBtn("Story","#8B5CF6",function(){showStoryTemplates();}));
  toolRow1.appendChild(makeBtn("Preview","#6B7280",async function(){
    this.textContent="...";var img=await findSmartImage(caption);showPostPreview(caption,img);this.textContent="Preview";
  }));
  bar.appendChild(toolRow1);

  // --- TOOLS ROW 2: Intelligence ---
  var toolRow2=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
  toolRow2.appendChild(el("span",{style:{color:"#6B7280",fontSize:"9px",fontFamily:"monospace",minWidth:"40px"}},"AI:"));
  toolRow2.appendChild(makeBtn("Neuro","#F43F5E",function(){showHookStoryOffer(caption);}));
  toolRow2.appendChild(makeBtn("Translate","#06B6D4",function(){showMultiLanguage(caption);}));
  toolRow2.appendChild(makeBtn("A/B Test","#06B6D4",function(){showABTest(caption,platform);}));
  toolRow2.appendChild(makeBtn("Hashtags","#10B981",function(){showHashtagIntelligence(caption);}));
  toolRow2.appendChild(makeBtn("Rewrite","#EC4899",function(){showCaptionRewriter(caption);}));
  toolRow2.appendChild(makeBtn("Emojis","#F59E0B",function(){showEmojiIntelligence(caption);}));
  toolRow2.appendChild(makeBtn("Optimize","#06B6D4",function(){showCaptionOptimizer(caption);}));
  toolRow2.appendChild(makeBtn("Spy","#EF4444",function(){showCompetitorSpy();}));
  bar.appendChild(toolRow2);

  // --- TOOLS ROW 3: Planning ---
  var toolRow3=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
  toolRow3.appendChild(el("span",{style:{color:"#6B7280",fontSize:"9px",fontFamily:"monospace",minWidth:"40px"}},"Plan:"));
  toolRow3.appendChild(makeBtn("Calendar","#3B82F6",function(){showContentCalendar();}));
  toolRow3.appendChild(makeBtn("Schedule","#3B82F6",function(){showAddCalendarEvent(caption);}));
  toolRow3.appendChild(makeBtn("Bulk 30","#10B981",function(){showBulkGenerator();}));
  toolRow3.appendChild(makeBtn("Recycle","#F97316",function(){showContentRecycler();}));
  toolRow3.appendChild(makeBtn("Pillars","#8B5CF6",function(){showPillarPlanner();}));
  toolRow3.appendChild(makeBtn("Best Time","#F59E0B",function(){showBestTimeModal(platform);}));
  toolRow3.appendChild(makeBtn("Analytics","#8B5CF6",function(){showPostAnalytics();}));
  toolRow3.appendChild(makeBtn("Link Bio","#C9A84C",function(){showLinkInBio();}));
  toolRow3.appendChild(makeBtn("Watermark","#C9A84C",function(){showWatermarkSetup();}));
  bar.appendChild(toolRow3);

  // --- TOOLS ROW 4: Settings ---
  var toolRow4=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
  toolRow4.appendChild(el("span",{style:{color:"#6B7280",fontSize:"9px",fontFamily:"monospace",minWidth:"40px"}},"Config:"));
  toolRow4.appendChild(makeBtn("Brand","#F97316",function(){showBrandingSetup();}));
  toolRow4.appendChild(makeBtn("Setup","#FBBF24",function(){showSocialSetup();}));
  toolRow4.appendChild(makeBtn("Auto-Post Log","#10B981",function(){showAutoPostLog();}));
  toolRow4.appendChild(makeBtn("Engagement","#8B5CF6",function(){showEngagementDashboard();}));
  // --- TOOLS ROW 5: Avatar ---
  var toolRow5=div({display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap"});
  toolRow5.appendChild(el("span",{style:{color:"#6B7280",fontSize:"9px",fontFamily:"monospace",minWidth:"40px"}},"Avatar:"));
  toolRow5.appendChild(makeBtn("Studio","#EC4899",function(){showAvatarStudio();}));
  toolRow5.appendChild(makeBtn("Create","#8B5CF6",function(){showAvatarBuilder();}));
  var activeChar=_getActiveAvatar();
  if(activeChar){
    toolRow5.appendChild(makeBtn("Generate as "+activeChar.name.substring(0,10),"#10B981",function(){showAvatarContentGen(activeChar.id);}));
    toolRow5.appendChild(makeBtn("Video","#F59E0B",function(){showAvatarVideoGen(activeChar.id);}));
  }
  bar.appendChild(toolRow5);
  bar.appendChild(toolRow4);

  bar.appendChild(videoUrlInput);
  bar.appendChild(imgPreviewWrap);
  return bar;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ██ AI AVATAR STUDIO — Character-Based Content Creation System
// ═══════════════════════════════════════════════════════════════════════════════

var AVATAR_STYLES=[
  {id:"professional",label:"Professional",desc:"Business attire, confident, corporate",prompt:"professional business person in modern suit, corporate headshot, studio lighting, neutral background"},
  {id:"luxury",label:"Luxury Agent",desc:"High-end real estate agent look",prompt:"luxury real estate agent, designer outfit, Dubai Marina backdrop, golden hour, cinematic"},
  {id:"casual",label:"Casual Expert",desc:"Approachable, smart casual",prompt:"smart casual professional, friendly smile, modern office, natural lighting"},
  {id:"tech",label:"Tech Innovator",desc:"Modern, tech-forward, startup vibe",prompt:"tech entrepreneur, modern workspace, minimalist, blue accent lighting"},
  {id:"arabic",label:"Emirati Style",desc:"Traditional Gulf professional",prompt:"professional in traditional Gulf attire, modern Dubai skyline, elegant, respectful"},
  {id:"influencer",label:"Social Influencer",desc:"Trendy, camera-ready, dynamic",prompt:"social media influencer, ring light, colorful background, energetic pose"}
];

var AVATAR_VOICES=[
  {id:"21m00Tcm4TlvDq8ikWAM",name:"Rachel",lang:"en",gender:"Female",desc:"Warm, professional"},
  {id:"EXAVITQu4vr4xnSDxMaL",name:"Bella",lang:"en",gender:"Female",desc:"Soft, engaging"},
  {id:"ErXwobaYiN019PkySvjV",name:"Antoni",lang:"en",gender:"Male",desc:"Deep, authoritative"},
  {id:"VR6AewLTigWG4xSOukaG",name:"Arnold",lang:"en",gender:"Male",desc:"Confident, bold"},
  {id:"pNInz6obpgDQGcFmaJgB",name:"Adam",lang:"en",gender:"Male",desc:"Professional, clear"},
  {id:"onwK4e9ZLuTAKqWW03F9",name:"Daniel",lang:"en",gender:"Male",desc:"British, sophisticated"},
  {id:"XB0fDUnXU5powFXDhCwa",name:"Charlotte",lang:"en",gender:"Female",desc:"Elegant, articulate"}
];

var AVATAR_PERSONALITIES=[
  {id:"expert",label:"Market Expert",tone:"Data-driven, analytical, confident. Uses statistics and market data. References DLD transactions."},
  {id:"advisor",label:"Trusted Advisor",tone:"Warm, consultative, empathetic. Focuses on client needs and goals. Asks questions."},
  {id:"luxury",label:"Luxury Specialist",tone:"Sophisticated, exclusive, refined. Uses premium vocabulary. Highlights lifestyle."},
  {id:"investor",label:"Investment Guru",tone:"Sharp, ROI-focused, strategic. Talks yields, cap rates, total returns. Bold predictions."},
  {id:"educator",label:"Market Educator",tone:"Clear, informative, patient. Explains concepts simply. Uses examples and analogies."},
  {id:"motivator",label:"Success Coach",tone:"Energetic, inspiring, action-oriented. Creates urgency. Shares success stories."},
  {id:"custom",label:"Custom Personality",tone:""}
];

function _getAvatars(){try{return JSON.parse(localStorage.getItem("dv_avatars")||"[]");}catch(e){return[];}}
function _saveAvatars(list){localStorage.setItem("dv_avatars",JSON.stringify(list));}
function _getActiveAvatar(){var id=localStorage.getItem("dv_active_avatar");if(!id)return null;var list=_getAvatars();return list.find(function(a){return a.id===id;})||null;}
function _setActiveAvatar(id){localStorage.setItem("dv_active_avatar",id);}

function showAvatarStudio(){
  var m=document.getElementById("avatar-studio-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"avatar-studio-modal"});
  var card=div({background:"linear-gradient(145deg,#1A1F2E,#0D1117)",border:"1px solid #EC4899",borderRadius:"20px",padding:"20px",width:"600px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});

  var hdr=div({display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"});
  hdr.appendChild(el("h3",{style:{color:"#EC4899",margin:0,fontSize:"16px",fontFamily:"'Space Grotesk',monospace"}},"AI Avatar Studio"));
  var closeBtn=el("button",{style:{background:"none",border:"none",color:"#8899AA",fontSize:"18px",cursor:"pointer"},onclick:function(){overlay.remove();}},"✕");
  hdr.appendChild(closeBtn);
  card.appendChild(hdr);
  card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"11px",marginBottom:"16px",fontFamily:"'Inter',sans-serif"}},"Create AI characters that generate content, videos & post to your social media — 24/7 on autopilot."));

  var avatars=_getAvatars();
  var activeId=localStorage.getItem("dv_active_avatar")||"";

  if(avatars.length>0){
    card.appendChild(el("div",{style:{color:"#FFF",fontSize:"12px",fontWeight:"700",fontFamily:"monospace",marginBottom:"8px"}},"Your Avatars ("+avatars.length+")"));
    var grid=div({display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"10px",marginBottom:"16px"});
    avatars.forEach(function(av){
      var isActive=av.id===activeId;
      var avCard=div({background:isActive?"linear-gradient(135deg,#EC489922,#8B5CF622)":"#0D1117",border:"2px solid "+(isActive?"#EC4899":"#2A3040"),borderRadius:"14px",padding:"12px",cursor:"pointer",transition:"all 0.3s",position:"relative"});
      avCard.onmouseenter=function(){if(!isActive)avCard.style.borderColor="#EC489966";};
      avCard.onmouseleave=function(){if(!isActive)avCard.style.borderColor="#2A3040";};

      if(isActive){
        var badge=el("div",{style:{position:"absolute",top:"-6px",right:"-6px",background:"#EC4899",color:"#FFF",fontSize:"8px",fontWeight:"800",padding:"2px 6px",borderRadius:"10px",fontFamily:"monospace"}});
        badge.textContent="ACTIVE";avCard.appendChild(badge);
      }

      if(av.avatarUrl){
        var img=el("img",{style:{width:"100%",height:"100px",objectFit:"cover",borderRadius:"10px",marginBottom:"8px"}});
        img.src=av.avatarUrl;avCard.appendChild(img);
      }else{
        var placeholder=div({width:"100%",height:"100px",borderRadius:"10px",marginBottom:"8px",background:"linear-gradient(135deg,#EC489922,#8B5CF622)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"36px"});
        placeholder.textContent=av.emoji||"🧑‍💼";avCard.appendChild(placeholder);
      }

      avCard.appendChild(el("div",{style:{color:"#FFF",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"}},av.name||"Unnamed"));
      avCard.appendChild(el("div",{style:{color:"#8899AA",fontSize:"9px",fontFamily:"monospace",marginBottom:"6px"}},av.personality||"Custom"));

      var btnRow=div({display:"flex",gap:"4px"});
      var activateBtn=el("button",{style:{flex:1,background:isActive?"#10B98133":"#EC489922",border:"1px solid "+(isActive?"#10B981":"#EC4899"),color:isActive?"#10B981":"#EC4899",padding:"4px",borderRadius:"6px",fontSize:"9px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(e){e.stopPropagation();_setActiveAvatar(av.id);overlay.remove();showAvatarStudio();}});
      activateBtn.textContent=isActive?"✓ Active":"Set Active";btnRow.appendChild(activateBtn);

      var editBtn=el("button",{style:{background:"#3B82F622",border:"1px solid #3B82F6",color:"#3B82F6",padding:"4px 6px",borderRadius:"6px",fontSize:"9px",cursor:"pointer",fontFamily:"monospace"},onclick:function(e){e.stopPropagation();overlay.remove();showAvatarBuilder(av.id);}});
      editBtn.textContent="Edit";btnRow.appendChild(editBtn);

      var delBtn=el("button",{style:{background:"#EF444422",border:"1px solid #EF4444",color:"#EF4444",padding:"4px 6px",borderRadius:"6px",fontSize:"9px",cursor:"pointer",fontFamily:"monospace"},onclick:function(e){e.stopPropagation();if(confirm("Delete avatar '"+av.name+"'?")){var list=_getAvatars().filter(function(x){return x.id!==av.id;});_saveAvatars(list);if(activeId===av.id)localStorage.removeItem("dv_active_avatar");overlay.remove();showAvatarStudio();}}});
      delBtn.textContent="x";btnRow.appendChild(delBtn);
      avCard.appendChild(btnRow);

      avCard.onclick=function(){_setActiveAvatar(av.id);overlay.remove();showAvatarContentGen(av.id);};
      grid.appendChild(avCard);
    });
    card.appendChild(grid);
  }else{
    var empty=div({background:"#0D1117",border:"1px dashed #EC489966",borderRadius:"14px",padding:"30px",textAlign:"center",marginBottom:"16px"});
    empty.appendChild(el("div",{style:{fontSize:"48px",marginBottom:"8px"}},"🧑‍🎨"));
    empty.appendChild(el("div",{style:{color:"#EC4899",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"}},"No Avatars Yet"));
    empty.appendChild(el("div",{style:{color:"#8899AA",fontSize:"11px",fontFamily:"'Inter',sans-serif"}},"Create your first AI character to start generating personalized content."));
    card.appendChild(empty);
  }

  var actionGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"});
  var createBtn=el("button",{style:{background:"linear-gradient(135deg,#EC4899,#8B5CF6)",color:"#FFF",border:"none",borderRadius:"12px",padding:"14px",fontSize:"13px",fontWeight:"800",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:function(){overlay.remove();showAvatarBuilder();}});
  createBtn.textContent="Create New Avatar";actionGrid.appendChild(createBtn);

  if(avatars.length>0){
    var genBtn=el("button",{style:{background:"linear-gradient(135deg,#10B981,#06B6D4)",color:"#FFF",border:"none",borderRadius:"12px",padding:"14px",fontSize:"13px",fontWeight:"800",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:function(){var ac=_getActiveAvatar();if(!ac){alert("Select an active avatar first.");return;}overlay.remove();showAvatarContentGen(ac.id);}});
    genBtn.textContent="Generate Content";actionGrid.appendChild(genBtn);
  }else{
    actionGrid.style.gridTemplateColumns="1fr";
  }
  card.appendChild(actionGrid);

  if(avatars.length>0){
    var extraGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"});
    var vidBtn=el("button",{style:{background:"#F59E0B22",border:"1px solid #F59E0B",color:"#F59E0B",borderRadius:"10px",padding:"10px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(){var ac=_getActiveAvatar();if(!ac){alert("Select an active avatar first.");return;}overlay.remove();showAvatarVideoGen(ac.id);}});
    vidBtn.textContent="AI Video";extraGrid.appendChild(vidBtn);

    var autoBtn=el("button",{style:{background:"#3B82F622",border:"1px solid #3B82F6",color:"#3B82F6",borderRadius:"10px",padding:"10px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(){var ac=_getActiveAvatar();if(!ac){alert("Select an active avatar first.");return;}overlay.remove();showAvatarAutoPilot(ac.id);}});
    autoBtn.textContent="Auto-Pilot";extraGrid.appendChild(autoBtn);

    var batchBtn=el("button",{style:{background:"#8B5CF622",border:"1px solid #8B5CF6",color:"#8B5CF6",borderRadius:"10px",padding:"10px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(){var ac=_getActiveAvatar();if(!ac){alert("Select an active avatar first.");return;}overlay.remove();showAvatarBatchGen(ac.id);}});
    batchBtn.textContent="Batch 30 Days";extraGrid.appendChild(batchBtn);
    card.appendChild(extraGrid);
  }

  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- AVATAR BUILDER (Create / Edit) ---
function showAvatarBuilder(editId){
  var m=document.getElementById("avatar-builder-modal");if(m)m.remove();
  var existing=editId?_getAvatars().find(function(a){return a.id===editId;}):null;
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"avatar-builder-modal"});
  var card=div({background:"linear-gradient(145deg,#1A1F2E,#0D1117)",border:"1px solid #8B5CF6",borderRadius:"20px",padding:"20px",width:"540px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});

  card.appendChild(el("h3",{style:{color:"#8B5CF6",margin:"0 0 4px",fontSize:"16px",fontFamily:"'Space Grotesk',monospace"}},existing?"Edit Avatar":"Create New Avatar"));
  card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",marginBottom:"14px",fontFamily:"monospace"}},"Build a unique AI character for your brand"));

  var avatarPreview=div({width:"120px",height:"120px",borderRadius:"50%",background:"linear-gradient(135deg,#EC4899,#8B5CF6)",margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"48px",overflow:"hidden",border:"3px solid #EC4899"});
  if(existing&&existing.avatarUrl){
    var prevImg=el("img",{style:{width:"100%",height:"100%",objectFit:"cover"}});
    prevImg.src=existing.avatarUrl;avatarPreview.appendChild(prevImg);
  }else{
    avatarPreview.textContent=existing&&existing.emoji?existing.emoji:"🧑‍💼";
  }
  card.appendChild(avatarPreview);

  var mkField=function(label,key,ph,val,type){
    card.appendChild(el("label",{style:{color:"#8899AA",fontSize:"10px",display:"block",marginBottom:"3px",fontFamily:"monospace"}},label));
    var inp;
    if(type==="textarea"){
      inp=el("textarea",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box",minHeight:"60px",resize:"vertical",marginBottom:"8px"},placeholder:ph});
      inp.value=val||"";
    }else{
      inp=el("input",{type:type||"text",style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box",marginBottom:"8px"},placeholder:ph,value:val||""});
    }
    card.appendChild(inp);return inp;
  };

  var nameInp=mkField("Character Name","name","e.g. Sarah Al Dubai",existing?existing.name:"");
  var handleInp=mkField("Social Handle","handle","@dubaipropertypro",existing?existing.handle:"");
  var bioInp=mkField("Bio / Tagline","bio","Dubai's #1 AI-powered real estate advisor",existing?existing.bio:"","textarea");
  var emojiInp=mkField("Avatar Emoji (fallback)","emoji","🧑‍💼",existing?existing.emoji:"🧑‍💼");

  card.appendChild(el("label",{style:{color:"#EC4899",fontSize:"11px",fontWeight:"700",display:"block",marginBottom:"6px",marginTop:"6px",fontFamily:"monospace"}},"Visual Style"));
  var styleGrid=div({display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px",marginBottom:"10px"});
  var selectedStyle=existing?existing.styleId:"professional";
  var styleButtons=[];
  AVATAR_STYLES.forEach(function(s){
    var sBtn=el("button",{style:{background:s.id===selectedStyle?"#EC489933":"#0D1117",border:"1px solid "+(s.id===selectedStyle?"#EC4899":"#2A3040"),color:s.id===selectedStyle?"#EC4899":"#8899AA",padding:"8px 4px",borderRadius:"8px",fontSize:"9px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace",textAlign:"center"},onclick:function(){
      selectedStyle=s.id;
      styleButtons.forEach(function(b){b.style.background="#0D1117";b.style.borderColor="#2A3040";b.style.color="#8899AA";});
      sBtn.style.background="#EC489933";sBtn.style.borderColor="#EC4899";sBtn.style.color="#EC4899";
    }});
    sBtn.textContent=s.label;styleGrid.appendChild(sBtn);styleButtons.push(sBtn);
  });
  card.appendChild(styleGrid);

  var customPromptInp=mkField("Custom Visual Prompt (optional)","customPrompt","Describe your character's appearance in detail...",existing?existing.customPrompt:"","textarea");

  card.appendChild(el("label",{style:{color:"#8B5CF6",fontSize:"11px",fontWeight:"700",display:"block",marginBottom:"6px",marginTop:"6px",fontFamily:"monospace"}},"Personality & Tone"));
  var persGrid=div({display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"6px",marginBottom:"10px"});
  var selectedPers=existing?existing.personalityId:"expert";
  var persButtons=[];
  AVATAR_PERSONALITIES.forEach(function(p){
    var pBtn=el("button",{style:{background:p.id===selectedPers?"#8B5CF633":"#0D1117",border:"1px solid "+(p.id===selectedPers?"#8B5CF6":"#2A3040"),color:p.id===selectedPers?"#8B5CF6":"#8899AA",padding:"6px",borderRadius:"8px",fontSize:"9px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace",textAlign:"left"},onclick:function(){
      selectedPers=p.id;
      persButtons.forEach(function(b){b.style.background="#0D1117";b.style.borderColor="#2A3040";b.style.color="#8899AA";});
      pBtn.style.background="#8B5CF633";pBtn.style.borderColor="#8B5CF6";pBtn.style.color="#8B5CF6";
      if(p.id!=="custom")customToneInp.value=p.tone;
    }});
    pBtn.innerHTML="<b>"+p.label+"</b><br><span style='font-size:8px;opacity:0.7'>"+p.tone.substring(0,40)+"...</span>";
    persGrid.appendChild(pBtn);persButtons.push(pBtn);
  });
  card.appendChild(persGrid);

  var customToneInp=mkField("Tone Description","tone","How should this character communicate?",existing?existing.tone:(AVATAR_PERSONALITIES[0].tone),"textarea");

  card.appendChild(el("label",{style:{color:"#F59E0B",fontSize:"11px",fontWeight:"700",display:"block",marginBottom:"6px",marginTop:"6px",fontFamily:"monospace"}},"Voice & Language"));
  var voiceSelect=el("select",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box",marginBottom:"8px"}});
  AVATAR_VOICES.forEach(function(v){
    var opt=el("option");opt.value=v.id;opt.textContent=v.name+" ("+v.gender+") — "+v.desc;
    if(existing&&existing.voiceId===v.id)opt.selected=true;
    voiceSelect.appendChild(opt);
  });
  card.appendChild(voiceSelect);

  var langSelect=el("select",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box",marginBottom:"8px"}});
  [{v:"en",l:"English"},{v:"ar",l:"Arabic"},{v:"fa",l:"Persian/Farsi"},{v:"ru",l:"Russian"},{v:"zh",l:"Chinese"},{v:"hi",l:"Hindi"},{v:"fr",l:"French"}].forEach(function(lg){
    var opt=el("option");opt.value=lg.v;opt.textContent=lg.l;
    if(existing&&existing.language===lg.v)opt.selected=true;
    langSelect.appendChild(opt);
  });
  card.appendChild(langSelect);

  card.appendChild(el("label",{style:{color:"#10B981",fontSize:"11px",fontWeight:"700",display:"block",marginBottom:"6px",marginTop:"6px",fontFamily:"monospace"}},"Content Settings"));
  var hashtagsInp=mkField("Signature Hashtags","hashtags","#DubaiRealEstate #PropertyInvestment #DubaiLuxury",existing?existing.hashtags:"#DubaiRealEstate #DubAIVal");
  var ctaInp=mkField("Default CTA","cta","DM for exclusive deals | Link in bio | Book a consultation",existing?existing.cta:"");
  var pillarsInp=mkField("Content Pillars (comma-separated)","pillars","Market Data, Investment Tips, Area Spotlights, Lifestyle",existing?(existing.pillars||[]).join(", "):"Market Data, Investment Tips, Area Spotlights, Lifestyle");

  var genAvatarBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"linear-gradient(135deg,#EC4899,#8B5CF6)",color:"#FFF",border:"none",borderRadius:"10px",padding:"12px",fontSize:"12px",fontWeight:"800",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:async function(){
    genAvatarBtn.textContent="Generating AI avatar image...";genAvatarBtn.disabled=true;
    var style=AVATAR_STYLES.find(function(s){return s.id===selectedStyle;})||AVATAR_STYLES[0];
    var prompt=customPromptInp.value.trim()||style.prompt;
    var fullPrompt=prompt+", portrait headshot, high quality, 4k, face clearly visible, looking at camera, "+nameInp.value;
    try{
      var url=await generateGeminiImage(fullPrompt);
      if(url){
        avatarPreview.innerHTML="";
        var newImg=el("img",{style:{width:"100%",height:"100%",objectFit:"cover"}});
        newImg.src=url;avatarPreview.appendChild(newImg);
        avatarPreview.dataset.url=url;
        genAvatarBtn.textContent="Avatar generated! Click Save to keep it.";
      }else{
        genAvatarBtn.textContent="Failed — check Gemini API key in Setup";
      }
    }catch(e){genAvatarBtn.textContent="Error: "+e.message;}
    genAvatarBtn.disabled=false;
  }});
  genAvatarBtn.textContent="Generate AI Avatar Image";card.appendChild(genAvatarBtn);

  var btnRow=div({display:"flex",gap:"8px",marginTop:"14px"});
  var saveBtn=el("button",{style:{flex:1,background:"#10B981",color:"#FFF",border:"none",borderRadius:"10px",padding:"12px",fontSize:"13px",fontWeight:"800",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:function(){
    var avatar={
      id:existing?existing.id:"avatar_"+Date.now(),
      name:nameInp.value.trim()||"Unnamed Avatar",
      handle:handleInp.value.trim(),
      bio:bioInp.value.trim(),
      emoji:emojiInp.value.trim()||"🧑‍💼",
      styleId:selectedStyle,
      customPrompt:customPromptInp.value.trim(),
      personalityId:selectedPers,
      tone:customToneInp.value.trim(),
      voiceId:voiceSelect.value,
      language:langSelect.value,
      hashtags:hashtagsInp.value.trim(),
      cta:ctaInp.value.trim(),
      pillars:pillarsInp.value.split(",").map(function(s){return s.trim();}).filter(Boolean),
      avatarUrl:avatarPreview.dataset.url||(existing?existing.avatarUrl:null),
      createdAt:existing?existing.createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    var list=_getAvatars();
    if(existing){list=list.map(function(a){return a.id===avatar.id?avatar:a;});}
    else{list.push(avatar);}
    _saveAvatars(list);
    _setActiveAvatar(avatar.id);
    overlay.remove();showAvatarStudio();
  }});
  saveBtn.textContent=existing?"Update Avatar":"Create Avatar";btnRow.appendChild(saveBtn);

  var cancelBtn=el("button",{style:{flex:"0 0 auto",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"10px",padding:"12px 20px",fontSize:"12px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}});
  cancelBtn.textContent="Cancel";btnRow.appendChild(cancelBtn);
  card.appendChild(btnRow);

  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- AVATAR CONTENT GENERATOR ---
function showAvatarContentGen(avatarId){
  var av=_getAvatars().find(function(a){return a.id===avatarId;});
  if(!av){alert("Avatar not found.");return;}
  var m=document.getElementById("avatar-content-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"avatar-content-modal"});
  var card=div({background:"linear-gradient(145deg,#1A1F2E,#0D1117)",border:"1px solid #10B981",borderRadius:"20px",padding:"20px",width:"560px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});

  var hdr=div({display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"});
  if(av.avatarUrl){
    var avImg=el("img",{style:{width:"40px",height:"40px",borderRadius:"50%",objectFit:"cover",border:"2px solid #EC4899"}});
    avImg.src=av.avatarUrl;hdr.appendChild(avImg);
  }else{
    var avEmoji=div({width:"40px",height:"40px",borderRadius:"50%",background:"#EC489933",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",border:"2px solid #EC4899"});
    avEmoji.textContent=av.emoji||"●";hdr.appendChild(avEmoji);
  }
  var hdrText=div({});
  hdrText.appendChild(el("div",{style:{color:"#EC4899",fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"}},av.name));
  hdrText.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",fontFamily:"monospace"}},"Generating content as this character"));
  hdr.appendChild(hdrText);
  card.appendChild(hdr);

  var topicLabel=el("label",{style:{color:"#8899AA",fontSize:"10px",display:"block",marginBottom:"3px",fontFamily:"monospace"}});
  topicLabel.textContent="Topic / Theme";card.appendChild(topicLabel);
  var topicInp=el("input",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"10px",color:"#E0E0E0",fontSize:"12px",fontFamily:"monospace",boxSizing:"border-box",marginBottom:"8px"},placeholder:"e.g. Palm Jumeirah market update, Best areas under 2M AED, Dubai Marina lifestyle..."});
  card.appendChild(topicInp);

  var typeGrid=div({display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px",marginBottom:"10px"});
  var selectedType="instagram_post";
  var typeButtons=[];
  [{id:"instagram_post",l:"IG Post"},{id:"instagram_reel",l:"Reel Script"},{id:"linkedin",l:"LinkedIn"},{id:"twitter",l:"Tweet"},{id:"facebook",l:"FB Post"},{id:"youtube_short",l:"YT Short"},{id:"blog",l:"Blog"},{id:"email",l:"Newsletter"}].forEach(function(t){
    var tBtn=el("button",{style:{background:t.id===selectedType?"#10B98133":"#0D1117",border:"1px solid "+(t.id===selectedType?"#10B981":"#2A3040"),color:t.id===selectedType?"#10B981":"#8899AA",padding:"6px",borderRadius:"8px",fontSize:"9px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace"},onclick:function(){
      selectedType=t.id;
      typeButtons.forEach(function(b){b.style.background="#0D1117";b.style.borderColor="#2A3040";b.style.color="#8899AA";});
      tBtn.style.background="#10B98133";tBtn.style.borderColor="#10B981";tBtn.style.color="#10B981";
    }});
    tBtn.textContent=t.l;typeGrid.appendChild(tBtn);typeButtons.push(tBtn);
  });
  card.appendChild(typeGrid);

  var resultArea=div({marginTop:"10px"});
  card.appendChild(resultArea);

  var genBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"linear-gradient(135deg,#10B981,#06B6D4)",color:"#FFF",border:"none",borderRadius:"10px",padding:"14px",fontSize:"13px",fontWeight:"800",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:async function(){
    if(!topicInp.value.trim()){alert("Enter a topic.");return;}
    genBtn.textContent="Generating as "+av.name+"...";genBtn.disabled=true;
    resultArea.innerHTML="";
    try{
      var sys="You are '"+av.name+"', a Dubai real estate content creator.\n"+
        "Bio: "+(av.bio||"")+"\n"+
        "Personality & Tone: "+(av.tone||"Professional and knowledgeable")+"\n"+
        "Language: "+(av.language||"en")+"\n"+
        "Signature hashtags: "+(av.hashtags||"")+"\n"+
        "CTA: "+(av.cta||"")+"\n"+
        "Content pillars: "+(av.pillars||[]).join(", ")+"\n\n"+
        "Generate a "+selectedType.replace(/_/g," ")+" about the given topic.\n"+
        "Stay COMPLETELY in character. Use the specified tone and personality.\n"+
        "Include relevant hashtags from the signature set.\n"+
        "Include CTA if set.\n"+
        (selectedType==="instagram_reel"||selectedType==="youtube_short"?"Format as a video script with [HOOK], [BODY], [CTA] sections and timing notes.\n":"")+
        (selectedType==="twitter"?"Keep under 280 characters.\n":"")+
        (selectedType==="linkedin"?"Professional tone, use line breaks for readability, include relevant data/stats.\n":"")+
        (selectedType==="blog"?"Write a 300-500 word blog post with headings.\n":"")+
        (selectedType==="email"?"Write a professional newsletter email with subject line.\n":"")+
        "Write in "+(av.language==="ar"?"Arabic":av.language==="fa"?"Persian/Farsi":av.language==="ru"?"Russian":av.language==="zh"?"Chinese":av.language==="hi"?"Hindi":av.language==="fr"?"French":"English")+".";

      var reply=await askAI([{role:"user",content:"Create content about: "+topicInp.value.trim()}],sys);

      var resultCard=div({background:"#0D1117",border:"1px solid #10B981",borderRadius:"12px",padding:"14px",marginBottom:"10px"});
      var resultText=el("pre",{style:{color:"#E0E0E0",fontSize:"11px",fontFamily:"'Inter',sans-serif",whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0,lineHeight:"1.6"}});
      resultText.textContent=reply;resultCard.appendChild(resultText);
      resultArea.appendChild(resultCard);

      var actionRow=div({display:"flex",gap:"6px",flexWrap:"wrap"});
      var copyBtn2=el("button",{style:{background:"#3B82F622",border:"1px solid #3B82F6",color:"#3B82F6",padding:"6px 12px",borderRadius:"8px",fontSize:"10px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace"},onclick:function(){navigator.clipboard.writeText(reply);copyBtn2.textContent="Copied";}});
      copyBtn2.textContent="Copy";actionRow.appendChild(copyBtn2);
      actionRow.appendChild(makeShareButton({text:reply,title:"DubAIVal — "+av.name}));

      var avImgRef={url:null};
      var imgBtn=el("button",{style:{background:"#EC489922",border:"1px solid #EC4899",color:"#EC4899",padding:"6px 12px",borderRadius:"8px",fontSize:"10px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
        imgBtn.textContent="Generating image...";
        var imgUrl=await generateGeminiImage(topicInp.value+" Dubai real estate, "+av.name+" character style");
        if(imgUrl){
          var preview=el("img",{style:{width:"100%",maxHeight:"200px",objectFit:"cover",borderRadius:"10px",marginTop:"8px",border:"1px solid #EC4899"}});
          preview.src=imgUrl;resultArea.appendChild(preview);
          avImgRef.url=imgUrl;imgBtn.textContent="Image generated ✓";
        }else{imgBtn.textContent="Failed";}
      }});
      imgBtn.textContent="Generate Image";actionRow.appendChild(imgBtn);

      resultArea.appendChild(actionRow);
      showImagePublishBar(function(){return Promise.resolve(avImgRef.url);},reply,resultArea);
    }catch(e){
      resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"11px",fontFamily:"monospace"}},"Error: "+e.message));
    }
    genBtn.textContent="Generate Content";genBtn.disabled=false;
  }});
  genBtn.textContent="Generate as "+av.name;card.appendChild(genBtn);

  card.appendChild(el("button",{style:{width:"100%",marginTop:"8px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- AVATAR VIDEO GENERATOR (AI Talking Head) ---
// --- Cinematic Video Engine APIs ---
var _VIDEO_PROXY="/api/proxy-video";
async function _videoProxy(body){
  var r=await fetch(_VIDEO_PROXY,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  return await r.json();
}
async function _klingGenVideo(prompt,imageUrl){
  return _videoProxy({engine:"kling",action:"generate",prompt:prompt,image_url:imageUrl||null,model:"kling-v2-master"});
}
async function _klingCheckStatus(taskId){
  return _videoProxy({engine:"kling",action:"status",task_id:taskId});
}
async function _lumaGenVideo(prompt,imageUrl){
  return _videoProxy({engine:"luma",action:"generate",prompt:prompt,image_url:imageUrl||null});
}
async function _lumaCheckStatus(genId){
  return _videoProxy({engine:"luma",action:"status",gen_id:genId});
}
async function _heygenCreateAvatar(text,avatarId,voiceId,imageUrl){
  return _videoProxy({engine:"heygen",action:"generate",text:text,avatar_id:avatarId,voice_id:voiceId,image_url:imageUrl||null});
}
async function _heygenCheckStatus(videoIdOrReqId,isFal){
  if(isFal)return _videoProxy({engine:"heygen",action:"status",request_id:videoIdOrReqId});
  return _videoProxy({engine:"heygen",action:"status",video_id:videoIdOrReqId});
}
async function _heygenListAvatars(){
  try{var d=await _videoProxy({engine:"heygen",action:"list_avatars"});return d.data&&d.data.avatars?d.data.avatars:[];}catch(e){return[];}
}
async function _hedraGenVideo(text,imageUrl,voiceId){
  return _videoProxy({engine:"hedra",action:"generate",text:text,image_url:imageUrl||null,voice_id:voiceId||"Sara"});
}
async function _hedraCheckStatus(jobId){
  return _videoProxy({engine:"hedra",action:"status",job_id:jobId});
}
async function _runwayGenVideo(prompt,imageUrl){
  return _videoProxy({engine:"runway",action:"generate",prompt:prompt,image_url:imageUrl||null});
}
async function _runwayCheckStatus(taskId){
  return _videoProxy({engine:"runway",action:"status",task_id:taskId});
}
async function _minimaxGenVideo(prompt,imageUrl){
  return _videoProxy({engine:"minimax",action:"generate",prompt:prompt,image_url:imageUrl||null});
}
async function _minimaxCheckStatus(taskId){
  return _videoProxy({engine:"minimax",action:"status",task_id:taskId});
}
async function _pikaGenVideo(prompt,imageUrl){
  var r=await _videoProxy({engine:"pika",action:"generate",prompt:prompt,image_url:imageUrl||null});
  if(r&&r.request_id)r._fal_model=imageUrl?"fal-ai/pika/v2.2/image-to-video":"fal-ai/pika/v2.2/text-to-video";
  return r;
}
async function _pikaCheckStatus(requestId,modelPath){
  return _videoProxy({engine:"pika",action:"status",request_id:requestId,model_path:modelPath||"fal-ai/pika/v2.2/text-to-video"});
}
async function _didGenTalk(sourceUrl,script,voiceId){
  return _videoProxy({engine:"did",action:"generate",source_url:sourceUrl,text:script,voice_id:voiceId});
}
async function _didCheckStatus(talkId){
  return _videoProxy({engine:"did",action:"status",talk_id:talkId});
}

function _videoResultUI(resultArea,videoUrl,genVideoBtn){
  resultArea.innerHTML="";
  resultArea.appendChild(el("div",{style:{color:"#10B981",fontSize:"13px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"}},"Cinematic Video Ready"));
  var video=el("video",{style:{width:"100%",maxHeight:"340px",borderRadius:"14px",border:"2px solid #F59E0B",boxShadow:"0 0 30px rgba(245,158,11,0.3)"},controls:true,autoplay:true});
  video.src=videoUrl;resultArea.appendChild(video);
  var dlRow=div({display:"flex",gap:"6px",marginTop:"10px"});
  var dlBtn=el("a",{style:{flex:1,display:"block",background:"linear-gradient(135deg,#10B981,#06B6D4)",color:"#FFF",textAlign:"center",textDecoration:"none",borderRadius:"8px",padding:"10px",fontSize:"11px",fontWeight:"700",fontFamily:"monospace"},href:videoUrl,target:"_blank",download:"avatar-video.mp4"});
  dlBtn.textContent="Download Video";dlRow.appendChild(dlBtn);
  var shareBtn2=el("button",{style:{flex:1,background:"linear-gradient(135deg,rgba(16,185,129,0.15),rgba(6,182,212,0.1))",border:"1px solid rgba(16,185,129,0.3)",color:"#10B981",borderRadius:"8px",padding:"10px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:function(){showShareModal({text:"",url:videoUrl,title:"DubAIVal Avatar Video"});}});
  shareBtn2.textContent="Share";dlRow.appendChild(shareBtn2);
  var publishBtn=el("button",{style:{flex:1,background:"#EC489922",border:"1px solid #EC4899",color:"#EC4899",borderRadius:"8px",padding:"10px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
    publishBtn.textContent="Publishing...";
    try{var r=await publishFacebookVideo("",videoUrl);publishBtn.textContent=r.success?"Published":"Error: "+r.error;}catch(e){publishBtn.textContent="Error: "+e.message;}
  }});
  publishBtn.textContent="Publish";dlRow.appendChild(publishBtn);
  resultArea.appendChild(dlRow);
  genVideoBtn.textContent="Generate Another";genVideoBtn.disabled=false;
}

function _videoPollStatus(checkFn,interval,maxChecks,resultArea,genVideoBtn){
  var count=0;
  var progressBar=div({width:"100%",height:"4px",background:"#2A3040",borderRadius:"2px",marginTop:"8px",overflow:"hidden"});
  var progressFill=div({width:"0%",height:"100%",background:"linear-gradient(90deg,#F59E0B,#EC4899)",borderRadius:"2px",transition:"width 0.5s"});
  progressBar.appendChild(progressFill);resultArea.appendChild(progressBar);
  var timer=setInterval(async function(){
    count++;
    progressFill.style.width=Math.min(Math.round(count/maxChecks*100),95)+"%";
    try{
      var result=await checkFn();
      if(result.done){
        clearInterval(timer);progressFill.style.width="100%";
        _videoResultUI(resultArea,result.url,genVideoBtn);
      }else if(result.error){
        clearInterval(timer);
        resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},result.error));
        genVideoBtn.textContent="Retry";genVideoBtn.disabled=false;
      }else if(count>=maxChecks){
        clearInterval(timer);
        resultArea.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"10px",fontFamily:"monospace"}},"Still processing — check back in a few minutes."));
        genVideoBtn.textContent="Retry";genVideoBtn.disabled=false;
      }
    }catch(e){
      clearInterval(timer);
      resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Error: "+e.message));
      genVideoBtn.disabled=false;
    }
  },interval);
}

function showAvatarVideoGen(avatarId){
  var av=_getAvatars().find(function(a){return a.id===avatarId;});
  if(!av){alert("Avatar not found.");return;}
  var m=document.getElementById("avatar-video-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"avatar-video-modal"});
  var card=div({background:"linear-gradient(145deg,#1A1F2E,#0D1117)",border:"1px solid #F59E0B",borderRadius:"20px",padding:"20px",width:"600px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});

  var hdr=div({display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"});
  if(av.avatarUrl){
    var avImg=el("img",{style:{width:"44px",height:"44px",borderRadius:"50%",objectFit:"cover",border:"2px solid #F59E0B",boxShadow:"0 0 15px rgba(245,158,11,0.3)"}});
    avImg.src=av.avatarUrl;hdr.appendChild(avImg);
  }
  var hdrTxt=div({});
  hdrTxt.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"15px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"}},"Cinematic AI Video Studio"));
  hdrTxt.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",fontFamily:"monospace"}},av.name+" — Movie-quality AI video generation"));
  hdr.appendChild(hdrTxt);
  card.appendChild(hdr);

  var scriptLabel=el("label",{style:{color:"#FFF",fontSize:"11px",fontWeight:"700",display:"block",marginBottom:"4px",fontFamily:"monospace"}});
  scriptLabel.textContent="Video Script / Prompt";card.appendChild(scriptLabel);
  var scriptInp=el("textarea",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"10px",padding:"12px",color:"#E0E0E0",fontSize:"12px",fontFamily:"monospace",boxSizing:"border-box",minHeight:"90px",resize:"vertical",marginBottom:"8px"},placeholder:"Describe the video scene or write a talking-head script..."});
  card.appendChild(scriptInp);

  var aiRow=div({display:"flex",gap:"6px",marginBottom:"14px"});
  var aiScriptBtn=el("button",{style:{flex:1,background:"#8B5CF622",border:"1px solid #8B5CF6",color:"#8B5CF6",borderRadius:"8px",padding:"8px",fontSize:"10px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
    aiScriptBtn.textContent="Writing...";
    try{
      var sys="You are "+av.name+". "+av.tone+". Write a 30-60 second video script for a social media video about Dubai real estate. Include [HOOK] (3 sec), [BODY], [CTA]. Conversational. Write in "+(av.language==="ar"?"Arabic":av.language==="fa"?"Persian":"English")+".";
      scriptInp.value=await askAI([{role:"user",content:"Write a short video script about Dubai real estate market trends"}],sys);
      aiScriptBtn.textContent="Done";
    }catch(e){aiScriptBtn.textContent="Error";}
  }});
  aiScriptBtn.textContent="AI Script";aiRow.appendChild(aiScriptBtn);

  var aiPromptBtn=el("button",{style:{flex:1,background:"#F59E0B22",border:"1px solid #F59E0B",color:"#F59E0B",borderRadius:"8px",padding:"8px",fontSize:"10px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
    aiPromptBtn.textContent="Writing...";
    try{
      scriptInp.value=await askAI([{role:"user",content:"Write a cinematic video prompt for AI video generation about Dubai luxury real estate. Describe the scene visually: camera movements, lighting, architecture, people, mood. 2-3 sentences max. Example: 'Aerial drone shot sweeping over Palm Jumeirah at golden hour...'"}],"You write cinematic video prompts for AI video generators like Kling and Runway. Focus on visual details, camera movements, and cinematic quality. No dialogue — pure visual storytelling.");
      aiPromptBtn.textContent="Done";
    }catch(e){aiPromptBtn.textContent="Error";}
  }});
  aiPromptBtn.textContent="AI Cinematic Prompt";aiRow.appendChild(aiPromptBtn);
  card.appendChild(aiRow);

  card.appendChild(el("div",{style:{color:"#FFF",fontSize:"12px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"}},"Choose Video Engine"));

  var selectedMethod="runway";
  var methodGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"6px",marginBottom:"12px"});
  var methodCards=[];
  var methods=[
    {id:"runway",icon:"RW",name:"Runway Gen-4",desc:"Hollywood-grade cinematic video. Best motion quality in the world.",tier:"Free trial",color:"#FF6B6B",quality:"★★★★★"},
    {id:"kling",icon:"KL",name:"Kling AI 2.0",desc:"Cinematic video from image/text. Movie quality. 5-10s clips.",tier:"Free tier",color:"#F59E0B",quality:"★★★★★"},
    {id:"minimax",icon:"MM",name:"Minimax Hailuo",desc:"Ultra-realistic motion. Cinematic lighting. 6s HD clips.",tier:"Free tier",color:"#3B82F6",quality:"★★★★★"},
    {id:"pika",icon:"PK",name:"Pika Labs",desc:"Creative video effects. Style transfer. Fast generation.",tier:"Free tier",color:"#A855F7",quality:"★★★★☆"},
    {id:"luma",icon:"LM",name:"Luma Dream Machine",desc:"Photorealistic video generation. Smooth motion. 5s clips.",tier:"Free tier",color:"#8B5CF6",quality:"★★★★☆"},
    {id:"heygen",icon:"HG",name:"HeyGen",desc:"Ultra-realistic talking avatar. Lip-sync. Indistinguishable from real.",tier:"Free via Fal.ai",color:"#10B981",quality:"★★★★★"},
    {id:"hedra",icon:"HD",name:"Hedra",desc:"High-quality talking avatar from photo + text. Near HeyGen quality.",tier:"Free tier",color:"#14B8A6",quality:"★★★★☆"},
    {id:"did",icon:"DI",name:"D-ID",desc:"Talking head from photo. Good lip-sync. Quick generation.",tier:"Free credits",color:"#06B6D4",quality:"★★★☆☆"},
  ];
  methods.forEach(function(mt){
    var mc=div({background:mt.id===selectedMethod?"linear-gradient(135deg,"+mt.color+"22,"+mt.color+"11)":"#0D1117",border:"2px solid "+(mt.id===selectedMethod?mt.color:"#2A3040"),borderRadius:"12px",padding:"10px",cursor:"pointer",transition:"all 0.3s"});
    mc.onclick=function(){
      selectedMethod=mt.id;
      methodCards.forEach(function(c,i){c.style.background="#0D1117";c.style.borderColor="#2A3040";});
      mc.style.background="linear-gradient(135deg,"+mt.color+"22,"+mt.color+"11)";mc.style.borderColor=mt.color;
    };
    var topRow=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"});
    topRow.appendChild(el("span",{style:{color:mt.color,fontSize:"12px",fontWeight:"800",fontFamily:"monospace"}},mt.icon+" "+mt.name));
    topRow.appendChild(el("span",{style:{color:"#F59E0B",fontSize:"9px",fontFamily:"monospace"}},mt.quality));
    mc.appendChild(topRow);
    mc.appendChild(el("div",{style:{color:"#8899AA",fontSize:"9px",fontFamily:"monospace",marginBottom:"3px"}},mt.desc));
    mc.appendChild(el("div",{style:{color:mt.tier.includes("Free")?"#10B981":"#F59E0B",fontSize:"8px",fontWeight:"700",fontFamily:"monospace"}},mt.tier));
    methodGrid.appendChild(mc);methodCards.push(mc);
  });
  card.appendChild(methodGrid);

  card.appendChild(el("div",{style:{color:"#10B981",fontSize:"9px",fontFamily:"monospace",marginBottom:"10px",padding:"6px 8px",background:"#10B98115",borderRadius:"6px",border:"1px solid #10B98133"}},"All video engines are server-powered — no API key needed. Just click Generate."));

  var heygenAvatarSection=div({display:"none",marginBottom:"10px"});
  var heygenAvatarId=localStorage.getItem("dv_heygen_avatar")||"";
  heygenAvatarSection.appendChild(el("label",{style:{color:"#10B981",fontSize:"10px",fontFamily:"monospace",display:"block",marginBottom:"3px"}},"HeyGen Avatar ID"));
  var heygenAvatarInp=el("input",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"6px 8px",color:"#E0E0E0",fontSize:"10px",fontFamily:"monospace",boxSizing:"border-box",marginBottom:"4px"},placeholder:"Avatar ID from HeyGen dashboard or click Load Avatars",value:heygenAvatarId});
  heygenAvatarSection.appendChild(heygenAvatarInp);
  var loadAvatarsBtn=el("button",{style:{width:"100%",background:"#10B98122",border:"1px solid #10B981",color:"#10B981",borderRadius:"6px",padding:"6px",fontSize:"9px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
    loadAvatarsBtn.textContent="Loading avatars...";
    var avatars=await _heygenListAvatars();
    if(avatars.length>0){
      heygenAvatarInp.value="";
      var list=div({maxHeight:"120px",overflowY:"auto",border:"1px solid #2A3040",borderRadius:"6px",marginTop:"4px"});
      avatars.slice(0,20).forEach(function(ha){
        var row=el("button",{style:{width:"100%",background:"transparent",border:"none",borderBottom:"1px solid #1A1F2E",color:"#E0E0E0",padding:"6px 8px",fontSize:"10px",fontFamily:"monospace",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"6px"},onclick:function(){heygenAvatarInp.value=ha.avatar_id;list.remove();}});
        if(ha.preview_image_url){var ti=el("img",{style:{width:"28px",height:"28px",borderRadius:"50%",objectFit:"cover"}});ti.src=ha.preview_image_url;row.appendChild(ti);}
        row.appendChild(el("span",{},ha.avatar_name||ha.avatar_id));heygenAvatarSection.appendChild(row);
        list.appendChild(row);
      });
      heygenAvatarSection.appendChild(list);
      loadAvatarsBtn.textContent=avatars.length+" avatars loaded";
    }else{loadAvatarsBtn.textContent="No avatars found";}
  }});
  loadAvatarsBtn.textContent="Load My HeyGen Avatars";heygenAvatarSection.appendChild(loadAvatarsBtn);
  card.appendChild(heygenAvatarSection);

  var resultArea=div({marginTop:"8px"});card.appendChild(resultArea);

  var genVideoBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"linear-gradient(135deg,#F59E0B,#EC4899,#8B5CF6)",color:"#FFF",border:"none",borderRadius:"12px",padding:"14px",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",boxShadow:"0 4px 20px rgba(245,158,11,0.3)"},onclick:async function(){
    var script=scriptInp.value.trim();
    if(!script){alert("Write a script or cinematic prompt first.");return;}

    if(heygenAvatarInp.value.trim())localStorage.setItem("dv_heygen_avatar",heygenAvatarInp.value.trim());

    genVideoBtn.disabled=true;resultArea.innerHTML="";
    var cleanScript=script.replace(/\[HOOK\]|\[BODY\]|\[CTA\]|\[.*?\]/g,"").trim();

    if(selectedMethod==="runway"){
      genVideoBtn.textContent="Runway Gen-4 — Creating Hollywood-grade video...";
      resultArea.appendChild(el("div",{style:{color:"#FF6B6B",fontSize:"11px",fontFamily:"monospace"}},"Generating cinematic video with Runway Gen-4 Turbo..."));
      try{
        var rwd=await _runwayGenVideo(cleanScript,av.avatarUrl||null);
        if(rwd.id){
          resultArea.appendChild(el("div",{style:{color:"#10B981",fontSize:"10px",fontFamily:"monospace"}},"Task started: "+rwd.id));
          _videoPollStatus(async function(){
            var st=await _runwayCheckStatus(rwd.id);
            if(st.status==="SUCCEEDED"&&st.output&&st.output.length>0){return{done:true,url:st.output[0]};}
            else if(st.status==="FAILED"){return{error:"Runway failed: "+(st.failure||"Unknown")};}
            return{done:false};
          },5000,120,resultArea,genVideoBtn);
        }else{
          resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Runway error: "+(rwd.error||JSON.stringify(rwd))));
          genVideoBtn.disabled=false;
        }
      }catch(e){resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Error: "+e.message));genVideoBtn.disabled=false;}
    }

    else if(selectedMethod==="minimax"){
      genVideoBtn.textContent="Minimax Hailuo — Creating ultra-realistic video...";
      resultArea.appendChild(el("div",{style:{color:"#3B82F6",fontSize:"11px",fontFamily:"monospace"}},"Generating HD video with Minimax Hailuo AI..."));
      try{
        var mmd=await _minimaxGenVideo(cleanScript,av.avatarUrl||null);
        if(mmd.task_id){
          resultArea.appendChild(el("div",{style:{color:"#10B981",fontSize:"10px",fontFamily:"monospace"}},"Task started: "+mmd.task_id));
          _videoPollStatus(async function(){
            var st=await _minimaxCheckStatus(mmd.task_id);
            if(st.status==="Success"&&st.file_id){
              var vidUrl="https://api.minimaxi.chat/v1/files/retrieve?file_id="+st.file_id;
              return{done:true,url:vidUrl};
            }else if(st.status==="Fail"){return{error:"Minimax failed: "+(st.base_resp&&st.base_resp.status_msg||"Unknown")};}
            return{done:false};
          },5000,90,resultArea,genVideoBtn);
        }else{
          resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Minimax error: "+(mmd.error||JSON.stringify(mmd))));
          genVideoBtn.disabled=false;
        }
      }catch(e){resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Error: "+e.message));genVideoBtn.disabled=false;}
    }

    else if(selectedMethod==="pika"){
      genVideoBtn.textContent="Pika Labs — Creating creative video...";
      resultArea.appendChild(el("div",{style:{color:"#A855F7",fontSize:"11px",fontFamily:"monospace"}},"Generating creative video with Pika Labs..."));
      try{
        var pkd=await _pikaGenVideo(cleanScript,av.avatarUrl||null);
        var pkReqId=pkd.request_id||pkd.id;
        var pkModel=pkd._fal_model||"fal-ai/pika/v2.2/text-to-video";
        if(pkReqId){
          resultArea.appendChild(el("div",{style:{color:"#10B981",fontSize:"10px",fontFamily:"monospace"}},"Generation started: "+pkReqId));
          _videoPollStatus(async function(){
            var st=await _pikaCheckStatus(pkReqId,pkModel);
            if(st.status==="COMPLETED"&&st.video&&st.video.url){return{done:true,url:st.video.url};}
            else if(st.status==="COMPLETED"&&st.videos&&st.videos.length>0){return{done:true,url:st.videos[0].url};}
            else if(st.status==="FAILED"){return{error:"Pika failed: "+(st.error||"Unknown")};}
            return{done:false};
          },5000,60,resultArea,genVideoBtn);
        }else{
          resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Pika error: "+(pkd.detail||pkd.error||JSON.stringify(pkd))));
          genVideoBtn.disabled=false;
        }
      }catch(e){resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Error: "+e.message));genVideoBtn.disabled=false;}
    }

    else if(selectedMethod==="kling"){
      genVideoBtn.textContent="Kling AI 2.0 — Creating cinematic video...";
      resultArea.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"11px",fontFamily:"monospace"}},"Generating movie-quality video with Kling AI 2.0 Master..."));
      try{
        var kd=await _klingGenVideo(cleanScript,av.avatarUrl||null);
        if(kd.data&&kd.data.task_id){
          resultArea.appendChild(el("div",{style:{color:"#10B981",fontSize:"10px",fontFamily:"monospace"}},"Task started: "+kd.data.task_id));
          _videoPollStatus(async function(){
            var st=await _klingCheckStatus(kd.data.task_id);
            if(st.data&&st.data.task_status==="succeed"&&st.data.task_result&&st.data.task_result.videos){
              return{done:true,url:st.data.task_result.videos[0].url};
            }else if(st.data&&st.data.task_status==="failed"){
              return{error:"Kling generation failed: "+(st.data.task_status_msg||"Unknown")};
            }
            return{done:false};
          },5000,60,resultArea,genVideoBtn);
        }else{
          resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Kling error: "+(kd.error||JSON.stringify(kd))));
          genVideoBtn.disabled=false;
        }
      }catch(e){resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Error: "+e.message));genVideoBtn.disabled=false;}
    }

    else if(selectedMethod==="luma"){
      genVideoBtn.textContent="Luma Dream Machine — Generating...";
      resultArea.appendChild(el("div",{style:{color:"#8B5CF6",fontSize:"11px",fontFamily:"monospace"}},"Creating photorealistic video with Luma Dream Machine..."));
      try{
        var ld=await _lumaGenVideo(cleanScript,av.avatarUrl||null);
        if(ld.id){
          resultArea.appendChild(el("div",{style:{color:"#10B981",fontSize:"10px",fontFamily:"monospace"}},"Generation started: "+ld.id));
          _videoPollStatus(async function(){
            var st=await _lumaCheckStatus(ld.id);
            if(st.state==="completed"&&st.assets&&st.assets.video){return{done:true,url:st.assets.video};}
            else if(st.state==="failed"){return{error:"Luma generation failed: "+(st.failure_reason||"Unknown")};}
            return{done:false};
          },5000,60,resultArea,genVideoBtn);
        }else{
          resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Luma error: "+(ld.error||JSON.stringify(ld))));
          genVideoBtn.disabled=false;
        }
      }catch(e){resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Error: "+e.message));genVideoBtn.disabled=false;}
    }

    else if(selectedMethod==="heygen"){
      var haId=localStorage.getItem("dv_heygen_avatar");
      if(!haId){resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Select a HeyGen avatar first (click Load Avatars)"));genVideoBtn.disabled=false;return;}
      genVideoBtn.textContent="HeyGen — Creating ultra-realistic avatar...";
      resultArea.appendChild(el("div",{style:{color:"#10B981",fontSize:"11px",fontFamily:"monospace"}},"Generating photo-realistic talking avatar with HeyGen..."));
      try{
        var voiceMap={"21m00Tcm4TlvDq8ikWAM":"1bd001e7e50f421d891986aad5158bc8","ErXwobaYiN019PkySvjV":"077ab11b14f04ce0b49b5f6e5cc20979"};
        var heyVoice=voiceMap[av.voiceId]||"1bd001e7e50f421d891986aad5158bc8";
        var hd=await _heygenCreateAvatar(cleanScript,haId,heyVoice,av.avatarUrl||null);
        var hgIsFal=!!(hd.request_id);
        var hgId=hd.request_id||(hd.data&&hd.data.video_id);
        if(hgId){
          resultArea.appendChild(el("div",{style:{color:"#10B981",fontSize:"10px",fontFamily:"monospace"}},(hgIsFal?"Request":"Video")+" ID: "+hgId));
          _videoPollStatus(async function(){
            var st=await _heygenCheckStatus(hgId,hgIsFal);
            if(hgIsFal){
              if(st.status==="COMPLETED"&&st.video&&st.video.url){return{done:true,url:st.video.url};}
              else if(st.status==="FAILED"){return{error:"HeyGen failed: "+(st.error||"Unknown")};}
            }else{
              if(st.data&&st.data.status==="completed"&&st.data.video_url){return{done:true,url:st.data.video_url};}
              else if(st.data&&st.data.status==="failed"){return{error:"HeyGen failed: "+(st.data.error||"Unknown")};}
            }
            return{done:false};
          },5000,60,resultArea,genVideoBtn);
        }else{
          resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"HeyGen error: "+(hd.detail||hd.error||JSON.stringify(hd))));
          genVideoBtn.disabled=false;
        }
      }catch(e){resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Error: "+e.message));genVideoBtn.disabled=false;}
    }

    else if(selectedMethod==="hedra"){
      genVideoBtn.textContent="Hedra — Creating talking avatar...";
      resultArea.appendChild(el("div",{style:{color:"#14B8A6",fontSize:"11px",fontFamily:"monospace"}},"Generating high-quality talking avatar with Hedra..."));
      try{
        var hedraVoice=av.voiceId||"Sara";
        var hrd=await _hedraGenVideo(cleanScript,av.avatarUrl||null,hedraVoice);
        if(hrd.job_id){
          resultArea.appendChild(el("div",{style:{color:"#10B981",fontSize:"10px",fontFamily:"monospace"}},"Job started: "+hrd.job_id));
          _videoPollStatus(async function(){
            var st=await _hedraCheckStatus(hrd.job_id);
            if(st.status==="completed"&&st.video_url){return{done:true,url:st.video_url};}
            else if(st.status==="failed"){return{error:"Hedra failed: "+(st.error||"Unknown")};}
            return{done:false};
          },5000,60,resultArea,genVideoBtn);
        }else{
          resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Hedra error: "+(hrd.error||JSON.stringify(hrd))));
          genVideoBtn.disabled=false;
        }
      }catch(e){resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Error: "+e.message));genVideoBtn.disabled=false;}
    }

    else if(selectedMethod==="did"){
      genVideoBtn.textContent="D-ID — Creating talking avatar...";
      try{
        var sourceUrl=av.avatarUrl;
        if(!sourceUrl){
          resultArea.appendChild(el("div",{style:{color:"#F59E0B",fontSize:"10px",fontFamily:"monospace"}},"Generating avatar image..."));
          var style=AVATAR_STYLES.find(function(s){return s.id===av.styleId;})||AVATAR_STYLES[0];
          sourceUrl=await generateGeminiImage(style.prompt+", face portrait, looking at camera");
          if(!sourceUrl){genVideoBtn.textContent="Could not generate image";genVideoBtn.disabled=false;return;}
        }
        var dd=await _didGenTalk(sourceUrl,cleanScript,av.voiceId||"21m00Tcm4TlvDq8ikWAM");
        if(dd.id){
          resultArea.appendChild(el("div",{style:{color:"#10B981",fontSize:"10px",fontFamily:"monospace"}},"Talk started: "+dd.id));
          _videoPollStatus(async function(){
            var st=await _didCheckStatus(dd.id);
            if(st.status==="done"&&st.result_url){return{done:true,url:st.result_url};}
            else if(st.status==="error"){return{error:"D-ID error: "+(st.error||"Unknown")};}
            return{done:false};
          },5000,24,resultArea,genVideoBtn);
        }else{
          resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"D-ID error: "+(dd.error||JSON.stringify(dd))));
          genVideoBtn.disabled=false;
        }
      }catch(e){resultArea.appendChild(el("div",{style:{color:"#EF4444",fontSize:"10px",fontFamily:"monospace"}},"Error: "+e.message));genVideoBtn.disabled=false;}
    }
  }});
  genVideoBtn.textContent="Generate Cinematic Video";card.appendChild(genVideoBtn);

  card.appendChild(el("button",{style:{width:"100%",marginTop:"8px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- AVATAR AUTO-PILOT (Automated Content Generation + Posting) ---
function showAvatarAutoPilot(avatarId){
  var av=_getAvatars().find(function(a){return a.id===avatarId;});
  if(!av){alert("Avatar not found.");return;}
  var m=document.getElementById("avatar-autopilot-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"avatar-autopilot-modal"});
  var card=div({background:"linear-gradient(145deg,#1A1F2E,#0D1117)",border:"1px solid #3B82F6",borderRadius:"20px",padding:"20px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});

  card.appendChild(el("h3",{style:{color:"#3B82F6",margin:"0 0 4px",fontSize:"16px",fontFamily:"'Space Grotesk',monospace"}},"Auto-Pilot — "+av.name));
  card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",marginBottom:"14px",fontFamily:"monospace"}},"AI generates content as "+av.name+" and auto-schedules to your calendar. Set it and forget it."));

  var config=JSON.parse(localStorage.getItem("dv_autopilot_"+av.id)||"{}");

  var mkField=function(label,val,ph){
    card.appendChild(el("label",{style:{color:"#8899AA",fontSize:"10px",display:"block",marginBottom:"3px",fontFamily:"monospace"}},label));
    var inp=el("input",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box",marginBottom:"8px"},placeholder:ph,value:val||""});
    card.appendChild(inp);return inp;
  };

  var freqSelect=el("select",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box",marginBottom:"8px"}});
  [{v:"1",l:"1 post/day"},{v:"2",l:"2 posts/day"},{v:"3",l:"3 posts/day"},{v:"7",l:"1 post/week"}].forEach(function(o){
    var opt=el("option");opt.value=o.v;opt.textContent=o.l;
    if(config.frequency===o.v)opt.selected=true;
    freqSelect.appendChild(opt);
  });
  card.appendChild(el("label",{style:{color:"#8899AA",fontSize:"10px",display:"block",marginBottom:"3px",fontFamily:"monospace"}},"Posting Frequency"));
  card.appendChild(freqSelect);

  var platformSelect=el("select",{style:{width:"100%",background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",color:"#E0E0E0",fontSize:"11px",fontFamily:"monospace",boxSizing:"border-box",marginBottom:"8px"}});
  [{v:"all",l:"All Platforms"},{v:"instagram",l:"Instagram Only"},{v:"linkedin",l:"LinkedIn Only"},{v:"facebook",l:"Facebook Only"},{v:"twitter",l:"X/Twitter Only"}].forEach(function(o){
    var opt=el("option");opt.value=o.v;opt.textContent=o.l;
    if(config.platform===o.v)opt.selected=true;
    platformSelect.appendChild(opt);
  });
  card.appendChild(el("label",{style:{color:"#8899AA",fontSize:"10px",display:"block",marginBottom:"3px",fontFamily:"monospace"}},"Target Platform"));
  card.appendChild(platformSelect);

  var daysInp=mkField("Generate for how many days?",config.days||"7","7");
  var timeInp=mkField("Preferred posting time",config.time||"10:00","10:00");

  var topics=(av.pillars||["Market Data","Investment Tips","Area Spotlights","Lifestyle"]);
  card.appendChild(el("div",{style:{color:"#10B981",fontSize:"10px",fontFamily:"monospace",marginBottom:"8px"}},"Content pillars: "+topics.join(" · ")));

  var resultArea=div({});card.appendChild(resultArea);

  var launchBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",color:"#FFF",border:"none",borderRadius:"10px",padding:"14px",fontSize:"13px",fontWeight:"800",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:async function(){
    var days=parseInt(daysInp.value)||7;
    var freq=parseInt(freqSelect.value)||1;
    var totalPosts=days*freq;
    launchBtn.textContent="Generating "+totalPosts+" posts as "+av.name+"...";launchBtn.disabled=true;
    resultArea.innerHTML="";

    localStorage.setItem("dv_autopilot_"+av.id,JSON.stringify({frequency:freqSelect.value,platform:platformSelect.value,days:daysInp.value,time:timeInp.value}));

    var progress=el("div",{style:{color:"#3B82F6",fontSize:"11px",fontFamily:"monospace",marginBottom:"8px"}});
    resultArea.appendChild(progress);

    var generated=0;
    var startDate=new Date();
    var sys="You are '"+av.name+"'. "+(av.tone||"")+"\nGenerate a social media post about Dubai real estate.\nTopic will be provided. Stay in character.\nInclude hashtags: "+(av.hashtags||"")+"\nCTA: "+(av.cta||"")+"\nLanguage: "+(av.language||"en")+"\nKeep it concise and engaging. Respond with ONLY the post caption, nothing else.";

    for(var d=0;d<days;d++){
      for(var p=0;p<freq;p++){
        var postDate=new Date(startDate);
        postDate.setDate(postDate.getDate()+d);
        var dateStr=postDate.toISOString().split("T")[0];
        var hour=parseInt(timeInp.value.split(":")[0])||10;
        var adjustedHour=freq>1?hour+p*Math.floor(8/freq):hour;
        var timeStr=String(adjustedHour).padStart(2,"0")+":"+(timeInp.value.split(":")[1]||"00");

        var pillar=topics[(generated)%topics.length];
        var topicPrompts={"Market Data":"latest market trend or price movement","Investment Tips":"investment strategy or opportunity","Area Spotlights":"spotlight on a specific Dubai area","Lifestyle":"Dubai luxury lifestyle and amenities","Success Story":"a client success story","FAQ":"common question about Dubai property","Trending News":"trending Dubai real estate news"};
        var topicPrompt=topicPrompts[pillar]||"Dubai real estate insight";

        progress.textContent="Generating post "+(generated+1)+"/"+totalPosts+" ("+pillar+")...";

        try{
          var reply=await askAI([{role:"user",content:"Write a post about: "+topicPrompt+". Pillar: "+pillar+". Post #"+(generated+1)}],sys);
          var evt={caption:reply,date:dateStr,time:timeStr,platform:platformSelect.value,pillar:pillar};
          saveCalendarEvent(evt);
          generated++;
        }catch(e){
          progress.textContent="Error on post "+(generated+1)+": "+e.message;
          await new Promise(function(r){setTimeout(r,2000);});
        }
      }
    }

    resultArea.innerHTML="";
    var successCard=div({background:"#10B98122",border:"1px solid #10B981",borderRadius:"12px",padding:"16px",textAlign:"center"});
    successCard.appendChild(el("div",{style:{fontSize:"36px",marginBottom:"8px"}},""));
    successCard.appendChild(el("div",{style:{color:"#10B981",fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"}},"Auto-Pilot Complete!"));
    successCard.appendChild(el("div",{style:{color:"#E0E0E0",fontSize:"12px",fontFamily:"monospace",marginTop:"6px"}},generated+" posts generated and scheduled for "+days+" days"));
    successCard.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",fontFamily:"monospace",marginTop:"4px"}},"Posts will auto-publish via client engine + server cron (24/7)"));
    resultArea.appendChild(successCard);
    launchBtn.textContent="Launch Auto-Pilot Again";launchBtn.disabled=false;
  }});
  launchBtn.textContent="Launch Auto-Pilot ("+av.name+")";card.appendChild(launchBtn);

  card.appendChild(el("button",{style:{width:"100%",marginTop:"8px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- AVATAR BATCH GENERATOR (30 Days of Content) ---
function showAvatarBatchGen(avatarId){
  var av=_getAvatars().find(function(a){return a.id===avatarId;});
  if(!av){alert("Avatar not found.");return;}
  var m=document.getElementById("avatar-batch-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"avatar-batch-modal"});
  var card=div({background:"linear-gradient(145deg,#1A1F2E,#0D1117)",border:"1px solid #8B5CF6",borderRadius:"20px",padding:"20px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});

  card.appendChild(el("h3",{style:{color:"#8B5CF6",margin:"0 0 4px",fontSize:"16px",fontFamily:"'Space Grotesk',monospace"}},"30-Day Content Batch — "+av.name));
  card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",marginBottom:"14px",fontFamily:"monospace"}},"Generate a full month of content in one click. AI creates diverse posts across all your content pillars."));

  var pillars=av.pillars&&av.pillars.length>0?av.pillars:["Market Data","Investment Tips","Area Spotlights","Lifestyle"];
  var pillarList=div({display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"12px"});
  pillars.forEach(function(p){
    pillarList.appendChild(el("span",{style:{background:"#8B5CF622",border:"1px solid #8B5CF644",color:"#8B5CF6",padding:"3px 8px",borderRadius:"12px",fontSize:"9px",fontFamily:"monospace"}},p));
  });
  card.appendChild(pillarList);

  var statsPreview=div({display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px",marginBottom:"12px"});
  [{l:"Total Posts",v:"30",c:"#8B5CF6"},{l:"Platforms",v:"All",c:"#10B981"},{l:"Est. Time",v:"~3 min",c:"#F59E0B"}].forEach(function(s){
    var sc=div({background:"#0D1117",borderRadius:"8px",padding:"8px",textAlign:"center"});
    sc.appendChild(el("div",{style:{color:s.c,fontSize:"16px",fontWeight:"800",fontFamily:"monospace"}},s.v));
    sc.appendChild(el("div",{style:{color:"#8899AA",fontSize:"8px",fontFamily:"monospace"}},s.l));
    statsPreview.appendChild(sc);
  });card.appendChild(statsPreview);

  var resultArea=div({});card.appendChild(resultArea);

  var genBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"linear-gradient(135deg,#8B5CF6,#EC4899)",color:"#FFF",border:"none",borderRadius:"10px",padding:"14px",fontSize:"13px",fontWeight:"800",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:async function(){
    genBtn.textContent="Generating 30 days of content...";genBtn.disabled=true;
    resultArea.innerHTML="";
    var progress=el("div",{style:{color:"#8B5CF6",fontSize:"11px",fontFamily:"monospace"}});
    resultArea.appendChild(progress);
    var bar=div({width:"100%",height:"6px",background:"#2A3040",borderRadius:"3px",marginTop:"6px",marginBottom:"10px",overflow:"hidden"});
    var fill=div({width:"0%",height:"100%",background:"linear-gradient(90deg,#8B5CF6,#EC4899)",borderRadius:"3px",transition:"width 0.3s"});
    bar.appendChild(fill);resultArea.appendChild(bar);

    var sys="You are '"+av.name+"'. "+(av.tone||"")+"\nGenerate social media content about Dubai real estate.\nInclude hashtags: "+(av.hashtags||"")+"\nCTA: "+(av.cta||"")+"\nLanguage: "+(av.language||"en")+"\nKeep it engaging. Respond with ONLY the post text.";

    var generated=0;
    var times=["09:00","12:00","17:00","10:00","14:00","18:00","11:00","15:00","20:00","08:00"];
    for(var d=0;d<30;d++){
      var postDate=new Date();postDate.setDate(postDate.getDate()+d+1);
      var dateStr=postDate.toISOString().split("T")[0];
      var pillar=pillars[d%pillars.length];
      var timeStr=times[d%times.length];
      progress.textContent="Day "+(d+1)+"/30 — "+pillar+"...";
      fill.style.width=Math.round((d+1)/30*100)+"%";
      try{
        var reply=await askAI([{role:"user",content:"Create a "+pillar.toLowerCase()+" post about Dubai real estate. Day "+(d+1)+" of 30. Make it unique."}],sys);
        saveCalendarEvent({caption:reply,date:dateStr,time:timeStr,platform:"all",pillar:pillar});
        generated++;
      }catch(e){
        progress.textContent="Day "+(d+1)+" failed: "+e.message;
        await new Promise(function(r){setTimeout(r,1500);});
      }
    }

    resultArea.innerHTML="";
    var done=div({background:"#10B98122",border:"1px solid #10B981",borderRadius:"12px",padding:"20px",textAlign:"center"});
    done.appendChild(el("div",{style:{fontSize:"48px",marginBottom:"8px"}},""));
    done.appendChild(el("div",{style:{color:"#10B981",fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"}},"30 Days Scheduled!"));
    done.appendChild(el("div",{style:{color:"#E0E0E0",fontSize:"12px",fontFamily:"monospace",marginTop:"6px"}},generated+" posts as "+av.name+" ready for auto-publishing"));
    done.appendChild(el("div",{style:{color:"#3B82F6",fontSize:"10px",fontFamily:"monospace",marginTop:"6px"}},"Click 'Sync to Cloud' in Auto-Post Log for 24/7 server-side publishing"));
    resultArea.appendChild(done);
    genBtn.textContent="Generate Another 30 Days";genBtn.disabled=false;
  }});
  genBtn.textContent="Generate 30 Days as "+av.name;card.appendChild(genBtn);

  card.appendChild(el("button",{style:{width:"100%",marginTop:"8px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- AUTO-POST LOG ---
function showAutoPostLog(){
  var m=document.getElementById("autopost-log-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"autopost-log-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #10B981",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#10B981",margin:"0 0 4px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Auto-Post Engine"));
  var engineStatus=_autoPostTimer?"Client Active — checking every 60s":"Client Inactive";
  card.appendChild(el("div",{style:{color:_autoPostTimer?"#10B981":"#EF4444",fontSize:"10px",fontFamily:"monospace",marginBottom:"4px"}},engineStatus));
  card.appendChild(el("div",{style:{color:"#3B82F6",fontSize:"10px",fontFamily:"monospace",marginBottom:"12px"}},"Server Cron — every 15 min (24/7, even when browser closed)"));
  var cal;try{cal=JSON.parse(localStorage.getItem("dv_content_calendar")||"[]");}catch(e){cal=[];}
  var scheduled=cal.filter(function(e){return e.status==="scheduled";}).length;
  var published=cal.filter(function(e){return e.status==="published";}).length;
  var failed=cal.filter(function(e){return e.status==="failed";}).length;
  var partial=cal.filter(function(e){return e.status==="partial";}).length;
  var statsGrid=div({display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px",marginBottom:"12px"});
  [{l:"Queued",v:scheduled,c:"#3B82F6"},{l:"Published",v:published,c:"#10B981"},{l:"Failed",v:failed,c:"#EF4444"},{l:"Partial",v:partial,c:"#F59E0B"}].forEach(function(s){
    var sc=div({background:"#0D1117",borderRadius:"8px",padding:"8px",textAlign:"center"});
    sc.appendChild(el("div",{style:{color:s.c,fontSize:"18px",fontWeight:"800",fontFamily:"monospace"}},String(s.v)));
    sc.appendChild(el("div",{style:{color:"#8899AA",fontSize:"8px",fontFamily:"monospace"}},s.l));statsGrid.appendChild(sc);
  });card.appendChild(statsGrid);
  var log;try{log=JSON.parse(localStorage.getItem("dv_autopost_log")||"[]");}catch(e){log=[];}
  if(log.length>0){
    card.appendChild(el("div",{style:{color:"#FFF",fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginBottom:"6px"}},"Recent Activity"));
    log.slice(0,20).forEach(function(entry){
      var isSuccess=entry.title.indexOf("Published")!==-1;
      var isFail=entry.title.indexOf("Failed")!==-1;
      var logColor=isSuccess?"#10B981":isFail?"#EF4444":"#F59E0B";
      var logCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"6px 8px",marginBottom:"3px"});
      var hdr=div({display:"flex",justifyContent:"space-between",alignItems:"center"});
      hdr.appendChild(el("span",{style:{color:logColor,fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}},entry.title));
      hdr.appendChild(el("span",{style:{color:"#6B7280",fontSize:"8px",fontFamily:"monospace"}},new Date(entry.at).toLocaleString("en-AE",{hour:"2-digit",minute:"2-digit",day:"numeric",month:"short"})));
      logCard.appendChild(hdr);
      logCard.appendChild(el("div",{style:{color:"#8899AA",fontSize:"9px",marginTop:"2px",fontFamily:"monospace"}},entry.body.substring(0,100)));
      card.appendChild(logCard);
    });
  }else{
    card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"11px",textAlign:"center",padding:"20px",fontFamily:"monospace"}},"No auto-posts yet. Schedule posts in Calendar → they auto-publish at the set time."));
  }
  var retryBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"#3B82F622",border:"1px solid #3B82F644",color:"#3B82F6",borderRadius:"8px",padding:"8px",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
    retryBtn.textContent="Retrying failed posts...";
    var cal2=JSON.parse(localStorage.getItem("dv_content_calendar")||"[]");
    var failedPosts=cal2.filter(function(e){return e.status==="failed";});
    for(var ri=0;ri<failedPosts.length;ri++){
      failedPosts[ri].status="scheduled";
    }
    localStorage.setItem("dv_content_calendar",JSON.stringify(cal2));
    await _checkDuePosts();
    retryBtn.textContent="Retried "+failedPosts.length+" posts";overlay.remove();showAutoPostLog();
  }});retryBtn.textContent="Retry All Failed";card.appendChild(retryBtn);
  var syncBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"#3B82F622",border:"1px solid #3B82F644",color:"#3B82F6",borderRadius:"8px",padding:"8px",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"monospace"},onclick:async function(){
    syncBtn.textContent="Syncing to cloud...";
    await _syncAllCalendarToServer();
    _syncCredsToServer();
    syncBtn.textContent="Synced — server will auto-post 24/7";
    setTimeout(function(){syncBtn.textContent="Sync All to Cloud (24/7 Auto-Post)";},3000);
  }});syncBtn.textContent="Sync All to Cloud (24/7 Auto-Post)";card.appendChild(syncBtn);
  card.appendChild(el("button",{style:{width:"100%",marginTop:"8px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

// --- ENGAGEMENT DASHBOARD ---
function showEngagementDashboard(){
  var m=document.getElementById("engagement-modal");if(m)m.remove();
  var overlay=el("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflowY:"auto",padding:"10px"},id:"engagement-modal"});
  var card=div({background:"#1A1F2E",border:"1px solid #8B5CF6",borderRadius:"16px",padding:"16px",width:"520px",maxWidth:"96vw",maxHeight:"94vh",overflowY:"auto"});
  card.appendChild(el("h3",{style:{color:"#8B5CF6",margin:"0 0 4px",fontSize:"15px",fontFamily:"'Space Grotesk',monospace"}},"Engagement Dashboard"));
  card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"10px",marginBottom:"4px",fontFamily:"monospace"}},"Real performance data from your published posts"));
  card.appendChild(el("div",{style:{color:"#3B82F6",fontSize:"9px",marginBottom:"12px",fontFamily:"monospace"}},"Cloud sync: engagement auto-updates every 6 hours via server"));
  var tracked=JSON.parse(localStorage.getItem("dv_post_tracking")||"{}");
  var entries=Object.keys(tracked).map(function(k){return Object.assign({calId:k},tracked[k]);}).filter(function(e){return e.results;}).sort(function(a,b){return(b.publishedAt||"")>(a.publishedAt||"")?1:-1;});
  if(entries.length===0){
    card.appendChild(el("div",{style:{color:"#8899AA",fontSize:"11px",textAlign:"center",padding:"30px",fontFamily:"monospace"}},"No published posts tracked yet.\nPosts from Auto-Post and manual publishing are tracked automatically."));
  }else{
    var totalLikes=0,totalComments=0,totalPosts=0;
    entries.forEach(function(e){
      if(e.results)e.results.forEach(function(r){
        if(r.engagement){totalLikes+=r.engagement.likes||0;totalComments+=r.engagement.comments||0;totalPosts++;}
      });
    });
    var statsGrid=div({display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px",marginBottom:"12px"});
    [{l:"Total Likes",v:totalLikes,c:"#EF4444"},{l:"Total Comments",v:totalComments,c:"#3B82F6"},{l:"Tracked Posts",v:entries.length,c:"#10B981"}].forEach(function(s){
      var sc=div({background:"#0D1117",borderRadius:"8px",padding:"10px",textAlign:"center"});
      sc.appendChild(el("div",{style:{color:s.c,fontSize:"20px",fontWeight:"800",fontFamily:"monospace"}},String(s.v)));
      sc.appendChild(el("div",{style:{color:"#8899AA",fontSize:"9px",fontFamily:"monospace"}},s.l));statsGrid.appendChild(sc);
    });card.appendChild(statsGrid);
    var fwStats=_getFrameworkStats();
    var fwKeys=Object.keys(fwStats);
    if(fwKeys.length>0){
      card.appendChild(el("div",{style:{color:"#F43F5E",fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginBottom:"6px"}},"Framework Performance"));
      var fwGrid=div({display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"4px",marginBottom:"12px"});
      fwKeys.sort(function(a,b){return(fwStats[b].published||0)-(fwStats[a].published||0);}).forEach(function(k){
        var fs=fwStats[k];
        var fCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"6px",padding:"6px"});
        fCard.appendChild(el("div",{style:{color:"#F43F5E",fontSize:"10px",fontWeight:"700",fontFamily:"monospace"}},k.toUpperCase()));
        fCard.appendChild(el("div",{style:{color:"#8899AA",fontSize:"8px",fontFamily:"monospace"}},"Generated: "+fs.uses+" · Published: "+(fs.published||0)));
        fwGrid.appendChild(fCard);
      });card.appendChild(fwGrid);
    }
    card.appendChild(el("div",{style:{color:"#FFF",fontSize:"11px",fontWeight:"700",fontFamily:"monospace",marginBottom:"6px"}},"Recent Posts"));
    entries.slice(0,10).forEach(function(entry){
      var eCard=div({background:"#0D1117",border:"1px solid #2A3040",borderRadius:"8px",padding:"8px",marginBottom:"4px"});
      var hdr=div({display:"flex",justifyContent:"space-between",alignItems:"center"});
      var platforms=entry.results?entry.results.map(function(r){var icons={instagram:"IG",facebook:"FB",linkedin:"LI",twitter:"𝕏"};return(icons[r.p]||"")+(r.ok?" OK":" FAIL");}).join(" "):"";
      hdr.appendChild(el("span",{style:{fontSize:"10px",fontFamily:"monospace"}},platforms));
      hdr.appendChild(el("span",{style:{color:"#6B7280",fontSize:"8px",fontFamily:"monospace"}},entry.publishedAt?new Date(entry.publishedAt).toLocaleDateString("en-AE"):"—"));
      eCard.appendChild(hdr);
      if(entry.results){
        entry.results.forEach(function(r){
          if(r.engagement){
            eCard.appendChild(el("div",{style:{color:"#E0E0E0",fontSize:"9px",marginTop:"4px",fontFamily:"monospace"}},"Likes: "+r.engagement.likes+" · Comments: "+r.engagement.comments+(r.engagement.insights?" · Views: "+_formatPostCount(r.engagement.insights.reach||0)+" reach":"")));
          }
        });
      }
      card.appendChild(eCard);
    });
    var refreshBtn=el("button",{style:{width:"100%",marginTop:"8px",background:"linear-gradient(135deg,#8B5CF6,#06B6D4)",color:"#FFF",border:"none",borderRadius:"8px",padding:"10px",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"},onclick:async function(){
      refreshBtn.textContent="Fetching engagement data from Instagram...";
      var count=await checkAllPostEngagement();
      refreshBtn.textContent="Updated "+count+" posts";
      setTimeout(function(){overlay.remove();showEngagementDashboard();},1500);
    }});refreshBtn.textContent="Refresh Engagement Data";card.appendChild(refreshBtn);
  }
  card.appendChild(el("button",{style:{width:"100%",marginTop:"8px",background:"#2A3040",color:"#8899AA",border:"none",borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"},onclick:function(){overlay.remove();}},"Close"));
  overlay.appendChild(card);overlay.addEventListener("click",function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
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
    {key:"dv_unsplash_key",label:"Unsplash API Key (best quality)",ph:"Free at unsplash.com/developers"},
    {key:"dv_pexels_key",label:"Pexels API Key",ph:"Free at pexels.com/api"},
    {key:"dv_gemini_key",label:"Gemini API Key (AI image gen)",ph:"Free at aistudio.google.com/apikey"},
    {key:"dv_elevenlabs_key",label:"ElevenLabs API Key (premium voiceover)",ph:"Free at elevenlabs.io/app/settings/api-keys"},
    {key:"dv_elevenlabs_voice",label:"ElevenLabs Voice ID (optional)",ph:"Default: Rachel — or paste custom voice ID"},
    {key:"dv_linkedin_token",label:"LinkedIn Access Token",ph:"OAuth2 token from linkedin.com/developers"},
    {key:"dv_linkedin_urn",label:"LinkedIn Person URN",ph:"urn:li:person:XXXXXXXXX"},
    {key:"dv_twitter_consumer_key",label:"𝕏 X Consumer Key (API Key)",ph:"D3gVfd..."},
    {key:"dv_twitter_consumer_secret",label:"𝕏 X Consumer Secret",ph:"w4EHpI..."},
    {key:"dv_twitter_access_token",label:"𝕏 X Access Token",ph:"20708..."},
    {key:"dv_twitter_access_secret",label:"𝕏 X Access Token Secret",ph:"DF6Upt..."},
    {key:"dv_tiktok_token",label:"TikTok Access Token",ph:"From developers.tiktok.com"},
    {key:"dv_youtube_token",label:"YouTube Access Token",ph:"Auto-refreshed — paste initial token here"},
    {key:"dv_youtube_refresh",label:"YouTube Refresh Token",ph:"1//0c... — permanent, auto-renews access token"},
    {key:"dv_youtube_client_id",label:"YouTube Client ID",ph:"916354...apps.googleusercontent.com"},
    {key:"dv_youtube_client_secret",label:"YouTube Client Secret",ph:"GOCSPX-..."},
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
    _syncCredsToServer();
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
  var wrap=div({display:"flex",flexDirection:"column",height:"calc(100vh - 130px)",padding:"0 20px",maxWidth:"800px",margin:"0 auto",width:"100%"});

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
    var btnIcon=el("span",{style:{width:"14px",height:"14px",display:"inline-flex",alignItems:"center",justifyContent:"center"}});
    btnIcon.innerHTML='<i data-lucide="'+agent.icon+'" style="width:14px;height:14px"></i>';
    btn.appendChild(btnIcon);
    btn.appendChild(document.createTextNode(agent.name));
    agentBar.appendChild(btn);
  });
  wrap.appendChild(agentBar);

  // Active agent header
  var activeAgent=AI_AGENTS.find(function(a){return a.id===chatState.agentId;})||AI_AGENTS[0];
  var hdr=div({display:"flex",alignItems:"center",gap:"10px",padding:"8px 0 12px",borderBottom:"1px solid "+cl.border,marginBottom:"8px",flexShrink:"0"});
  var iconCircle=div({width:"36px",height:"36px",borderRadius:"10px",background:hexAlpha(activeAgent.color,0.15),border:"1px solid "+hexAlpha(activeAgent.color,0.3),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:"0"});
  iconCircle.innerHTML='<i data-lucide="'+activeAgent.icon+'" style="width:20px;height:20px;color:'+activeAgent.color+'"></i>';
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
  newChatBtn.textContent="New";
  hdr.appendChild(newChatBtn);

  if(chatState.agentId==="outreach"){
    var brandBtn=el("button",{style:{
      background:hexAlpha("#F97316",0.1),border:"1px solid "+hexAlpha("#F97316",0.3),
      color:"#F97316",padding:"6px 14px",borderRadius:"8px",fontSize:"11px",fontWeight:"600",
      fontFamily:"'Space Grotesk',monospace",cursor:"pointer",whiteSpace:"nowrap",
      display:"flex",alignItems:"center",gap:"4px",transition:"all 0.2s",flexShrink:"0"
    },onclick:function(){showBrandingSetup();}});
    var bp=getBrandProfile();
    brandBtn.textContent=bp&&bp.name?""+bp.name:"Brand";
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
    var reply=await askAI(history,agent.sys(),t);
    msgs.push({role:"assistant",text:reply});
  }catch(e){msgs.push({role:"assistant",text:"Error: "+e.message});}
  chatState.loading=false;render(true);
}

// --- MEDIA STUDIO (clean user-facing view — AI tools run silently in background) ---
function renderMediaStudio(mode){
  var cl=C();
  var wrap=el("div",{style:{padding:"20px",maxWidth:"900px",margin:"0 auto",paddingBottom:"80px"}});

  function makeToolGrid(tools,color){
    var grid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:"10px"}});
    tools.forEach(function(tool){
      var card=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"16px 12px",textAlign:"center",cursor:"pointer",transition:"all 0.2s ease",minHeight:"90px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"6px"}});
      card.appendChild(div({fontSize:"24px"},tool.icon));
      card.appendChild(div({color:"#E8EDF5",fontSize:"11px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},tool.label));
      card.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},tool.desc));
      card.addEventListener("mouseenter",function(){this.style.borderColor=color;this.style.background="#131926";this.style.transform="translateY(-2px)";this.style.boxShadow="0 4px 16px "+hexAlpha(color,0.15);});
      card.addEventListener("mouseleave",function(){this.style.borderColor=cl.border;this.style.background=cl.surface;this.style.transform="";this.style.boxShadow="";});
      card.addEventListener("click",tool.fn);
      grid.appendChild(card);
    });
    return grid;
  }

  function makeSectionHeader(title,color){
    return div({color:color,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"600",borderLeft:"3px solid "+color,paddingLeft:"10px",marginBottom:"14px"},title);
  }

  function makeCollapsible(label,sub,accentColor,bodyFn){
    var cWrap=el("div",{style:{marginBottom:"12px"}});
    var cBtn=el("button",{style:{width:"100%",background:"transparent",border:"1px solid "+cl.border,borderRadius:"10px",padding:"11px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.15s ease",textAlign:"left"}});
    var cLeft=div({style:{display:"flex",alignItems:"center",gap:"10px"}});
    cLeft.appendChild(span({style:{color:accentColor,fontSize:"13px"}},"⚙"));
    cLeft.appendChild(span({style:{color:"#8899AA",fontSize:"11px",fontFamily:"'Inter',sans-serif",fontWeight:"500"}},label));
    if(sub)cLeft.appendChild(span({style:{color:"#445566",fontSize:"9px",fontFamily:"'Space Grotesk',monospace"}},sub));
    cBtn.appendChild(cLeft);
    var cArrow=span({style:{color:"#445566",fontSize:"12px",transition:"transform 0.2s"}},"▼");
    cBtn.appendChild(cArrow);
    cBtn.addEventListener("mouseenter",function(){this.style.borderColor=accentColor;});
    cBtn.addEventListener("mouseleave",function(){this.style.borderColor=cl.border;});
    var cBody=el("div",{style:{display:"none",marginTop:"14px"}});
    cBtn.addEventListener("click",function(){
      var open=cBody.style.display!=="none";
      cBody.style.display=open?"none":"block";
      cArrow.textContent=open?"▼":"▲";
    });
    cWrap.appendChild(cBtn);
    cWrap.appendChild(cBody);
    bodyFn(cBody);
    return cWrap;
  }

  // ── AVATAR STUDIO MODE ───────────────────────────────────────────────────────
  if(mode==="avatar"){
    var avHero=el("div",{style:{marginBottom:"24px"}});
    avHero.appendChild(div({fontSize:"20px",fontWeight:"700",color:"#F59E0B",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Avatar Studio"));
    avHero.appendChild(div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"Build your AI persona and create content as your digital self"));
    wrap.appendChild(avHero);
    wrap.appendChild(makeToolGrid([
      {icon:"image",label:"Gallery",desc:"Avatar collection",fn:function(){showAvatarStudio();}},
      {icon:"LM",label:"Create Avatar",desc:"Build new avatar",fn:function(){showAvatarBuilder();}},
      {icon:"file-text",label:"Generate",desc:"Content as avatar",fn:function(){showAvatarContentGen();}},
      {icon:"video",label:"Avatar Video",desc:"Avatar video",fn:function(){showAvatarVideoGen();}},
      {icon:"bot",label:"AutoPilot",desc:"Auto content",fn:function(){showAvatarAutoPilot();}},
      {icon:"package",label:"Batch",desc:"Bulk generate",fn:function(){showAvatarBatchGen();}}
    ],"#F59E0B"));
    return wrap;
  }

  // ── STUDIO MODE (default) ─────────────────────────────────────────────────────
  var hero=el("div",{style:{marginBottom:"24px"}});
  hero.appendChild(div({fontSize:"20px",fontWeight:"700",color:"#F0F2F5",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Media Studio"));
  hero.appendChild(div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"Create and publish content that gets results"));
  wrap.appendChild(hero);

  // ── SETUP (Branding + Social — persistent configured state) ───────────────
  function makeConfigCard(isConfigured,configuredContent,emptyIcon,emptyLabel,emptyDesc,onEdit,onRemove,onSetup){
    var card=el("div",{style:{background:cl.surface,border:"1px solid "+(isConfigured?"#10B981":cl.border),borderRadius:"12px",padding:"14px 12px",cursor:isConfigured?"default":"pointer",transition:"all 0.2s ease",minHeight:"90px",display:"flex",flexDirection:"column",justifyContent:"center",gap:"6px"}});
    if(isConfigured){
      card.appendChild(div({color:"#10B981",fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em",marginBottom:"2px"},"✓ CONFIGURED"));
      configuredContent.forEach(function(c){card.appendChild(c);});
      var btnRow=el("div",{style:{display:"flex",gap:"6px",marginTop:"8px"}});
      var editBtn=el("button",{style:{flex:"1",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",color:"#10B981",borderRadius:"6px",padding:"5px 0",fontSize:"10px",fontWeight:"600",cursor:"pointer",fontFamily:"'Inter',sans-serif"}});
      editBtn.textContent="Edit";editBtn.addEventListener("click",function(e){e.stopPropagation();onEdit();});
      var removeBtn=el("button",{style:{flex:"1",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#EF4444",borderRadius:"6px",padding:"5px 0",fontSize:"10px",fontWeight:"600",cursor:"pointer",fontFamily:"'Inter',sans-serif"}});
      removeBtn.textContent="Remove";removeBtn.addEventListener("click",function(e){e.stopPropagation();onRemove();});
      btnRow.appendChild(editBtn);btnRow.appendChild(removeBtn);
      card.appendChild(btnRow);
    }else{
      card.appendChild(div({fontSize:"22px",textAlign:"center"},emptyIcon));
      card.appendChild(div({color:"#E8EDF5",fontSize:"11px",fontWeight:"600",fontFamily:"'Inter',sans-serif",textAlign:"center"},emptyLabel));
      card.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",textAlign:"center"},emptyDesc));
      card.appendChild(div({color:"#10B981",fontSize:"9px",fontFamily:"'Inter',sans-serif",textAlign:"center",marginTop:"4px"},"→ Click to set up"));
      card.addEventListener("mouseenter",function(){this.style.borderColor="#10B981";this.style.background="#131926";});
      card.addEventListener("mouseleave",function(){this.style.borderColor=cl.border;this.style.background=cl.surface;});
      card.addEventListener("click",onSetup);
    }
    return card;
  }

  var brand=getBrandProfile();
  var creds=getSocialCreds();
  var setupGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"24px"}});

  var brandCard=makeConfigCard(
    !!(brand&&brand.name),
    [div({color:"#E8EDF5",fontSize:"12px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},brand&&brand.name?brand.name:""),
     div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},(brand&&brand.tagline)?brand.tagline:"Brand profile active")],
    "palette","Branding","Brand profile",
    function(){showBrandingSetup();},
    function(){if(confirm("Remove brand profile?")){localStorage.removeItem("dv_brand_profile");render();}},
    function(){showBrandingSetup();}
  );

  var platforms=[];
  if(creds){if(creds.igId)platforms.push("Instagram");if(creds.fbId)platforms.push("Facebook");}
  var socialCard=makeConfigCard(
    !!(creds&&creds.token),
    [div({color:"#E8EDF5",fontSize:"12px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},platforms.join(" + ")||"Connected"),
     div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},platforms.length+" platform"+(platforms.length!==1?"s":"")+" connected")],
    "wrench","Social Setup","Platform accounts",
    function(){showSocialSetup();},
    function(){if(confirm("Disconnect social accounts?")){localStorage.removeItem("dv_ig_token");localStorage.removeItem("dv_ig_id");localStorage.removeItem("dv_fb_id");render();}},
    function(){showSocialSetup();}
  );

  var setupSec=el("div",{style:{marginBottom:"24px"}});
  setupSec.appendChild(makeSectionHeader("SETUP","#10B981"));
  setupGrid.appendChild(brandCard);
  setupGrid.appendChild(socialCard);
  setupSec.appendChild(setupGrid);
  wrap.appendChild(setupSec);

  // ── CREATE (prominent) ─────────────────────────────────────────────────────
  var createSection=el("div",{style:{marginBottom:"20px"}});
  createSection.appendChild(makeSectionHeader("CREATE","#D4AF37"));
  createSection.appendChild(makeToolGrid([
    {icon:"video",label:"AI Video Studio",desc:"8 AI engines",fn:function(){showVideoGenUI("");}},
    {icon:"scissors",label:"Edit Video",desc:"Trim, subtitles, music",fn:function(){showVideoEditor();}},
    {icon:"palette",label:"Design Post",desc:"Visual canvas editor",fn:function(){showPostDesigner("","");}},
    {icon:"smartphone",label:"Story Templates",desc:"Ready-made formats",fn:function(){showStoryTemplates();}},
    {icon:"eye",label:"Post Preview",desc:"Smart preview",fn:function(){showPostPreview("","");}}
  ],"#D4AF37"));
  wrap.appendChild(createSection);

  // ── AI hint ────────────────────────────────────────────────────────────────
  var aiHint=div({background:"rgba(139,92,246,0.05)",border:"1px solid rgba(139,92,246,0.14)",borderRadius:"10px",padding:"11px 16px",marginBottom:"24px",display:"flex",alignItems:"flex-start",gap:"10px"});
  aiHint.appendChild(span({style:{color:"#8B5CF6",fontSize:"13px",marginTop:"1px",flexShrink:"0"}},"✦"));
  var hintRight=div({style:{flex:"1"}});
  hintRight.appendChild(div({style:{color:"#9D71F5",fontSize:"10px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.09em",marginBottom:"4px"}},"AI IS WORKING BEHIND THE SCENES"));
  hintRight.appendChild(div({style:{color:"#667788",fontSize:"10px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6"}},"When you create with our tools, smart hashtags, caption optimization, A/B tested hooks, multi-platform formatting, best posting times, and engagement boosting are automatically applied — so your content gets seen, clicked, and shared."));
  aiHint.appendChild(hintRight);
  wrap.appendChild(aiHint);

  // ── ANALYTICS (post-create) ────────────────────────────────────────────────
  var analyticsSection=el("div",{style:{marginBottom:"24px"}});
  analyticsSection.appendChild(makeSectionHeader("ANALYTICS","#3B82F6"));
  analyticsSection.appendChild(makeToolGrid([
    {icon:"rocket",label:"Auto-Post",desc:"Automation log",fn:function(){showAutoPostLog();}},
    {icon:"trending-up",label:"Engagement",desc:"Analytics dashboard",fn:function(){showEngagementDashboard();}}
  ],"#3B82F6"));
  wrap.appendChild(analyticsSection);

  // ── ADVANCED AI TOOLS (collapsed) ─────────────────────────────────────────
  wrap.appendChild(makeCollapsible("Advanced AI Tools","Hooks · Hashtags · A/B Test · Translate · Calendar · Planning","#8B5CF6",function(body){
    var aiSec=el("div",{style:{marginBottom:"20px"}});
    aiSec.appendChild(makeSectionHeader("AI INTELLIGENCE","#8B5CF6"));
    aiSec.appendChild(makeToolGrid([
      {icon:"brain",label:"Neuro Hook",desc:"Hook-Story-Offer",fn:function(){showHookStoryOffer("");}},
      {icon:"HD",label:"Translate",desc:"Multi-language",fn:function(){showMultiLanguage("");}},
      {icon:"scale",label:"A/B Test",desc:"Variant generator",fn:function(){showABTest("","");}},
      {icon:"hash",label:"Hashtags",desc:"Intelligence",fn:function(){showHashtagIntelligence("");}},
      {icon:"pen-line",label:"Rewrite",desc:"Caption rewriter",fn:function(){showCaptionRewriter("");}},
      {icon:"smile",label:"Emojis",desc:"Emoji intelligence",fn:function(){showEmojiIntelligence("");}},
      {icon:"ruler",label:"Optimize",desc:"Caption optimizer",fn:function(){showCaptionOptimizer("");}},
      {icon:"search",label:"Spy",desc:"Competitor analysis",fn:function(){showCompetitorSpy();}}
    ],"#8B5CF6"));
    body.appendChild(aiSec);
    var plSec=el("div",{style:{marginBottom:"8px"}});
    plSec.appendChild(makeSectionHeader("PLANNING","#3B82F6"));
    plSec.appendChild(makeToolGrid([
      {icon:"calendar",label:"Calendar",desc:"Content calendar",fn:function(){showContentCalendar();}},
      {icon:"clock",label:"Schedule",desc:"Schedule posts",fn:function(){showAddCalendarEvent("");}},
      {icon:"package",label:"Bulk 30-Day",desc:"Auto-generate month",fn:function(){showBulkGenerator();}},
      {icon:"refresh-cw",label:"Recycle",desc:"Repurpose content",fn:function(){showContentRecycler();}},
      {icon:"landmark",label:"Pillars",desc:"Content strategy",fn:function(){showPillarPlanner();}},
      {icon:"timer",label:"Best Time",desc:"Optimal posting",fn:function(){showBestTimeModal("");}},
      {icon:"bar-chart",label:"Analytics",desc:"Post performance",fn:function(){showPostAnalytics();}},
      {icon:"link",label:"Link in Bio",desc:"Bio link builder",fn:function(){showLinkInBio();}},
      {icon:"droplet",label:"Watermark",desc:"Branding overlay",fn:function(){showWatermarkSetup();}}
    ],"#3B82F6"));
    body.appendChild(plSec);
  }));

  // ── AI Content Assistant (collapsed) ──────────────────────────────────────
  var chatSection=el("div",{style:{marginTop:"16px"}});
  var chatToggle=el("button",{style:{width:"100%",background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"14px 20px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.15s ease"}});
  chatToggle.appendChild(div({},[span({color:"#F0F2F5",fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},"AI Content Assistant"),span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace",marginLeft:"8px"},"Chat with Social Media Manager agent")]));
  var arrow=span({color:cl.sub,fontSize:"16px",transition:"transform 0.2s"},"▼");
  chatToggle.appendChild(arrow);
  var chatBody=el("div",{style:{display:"none",marginTop:"8px"}});
  chatToggle.addEventListener("click",function(){
    var open=chatBody.style.display!=="none";
    chatBody.style.display=open?"none":"block";
    arrow.textContent=open?"▼":"▲";
    if(!open){
      var prev=chatState.agentId;
      chatState.agentId="outreach";
      var chatEl=renderChat();
      chatBody.innerHTML="";
      chatBody.appendChild(chatEl);
      chatState.agentId=prev==="outreach"?prev:prev;
    }
  });
  chatSection.appendChild(chatToggle);
  chatSection.appendChild(chatBody);
  wrap.appendChild(chatSection);

  return wrap;
}
