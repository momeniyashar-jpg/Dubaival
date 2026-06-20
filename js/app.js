// Copyright (c) 2024-2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- RENDER -------------------------------------------------------------------
const MARKET_SENTIMENT={"Downtown Dubai":{"chg":-20.1,"s":"bear"},"Dubai Marina":{"chg":-18.1,"s":"bear"},"Palm Jumeirah":{"chg":6.2,"s":"bull"},"Business Bay":{"chg":-14.1,"s":"bear"},"Dubai Hills":{"chg":-5.8,"s":"bear"},"Dubai Creek Harbour":{"chg":0.0,"s":"neutral"},"JVC":{"chg":8.6,"s":"bull"},"JLT":{"chg":-11.9,"s":"bear"},"MBR City":{"chg":-3.4,"s":"bear"},"DAMAC Hills":{"chg":59.6,"s":"bull"},"Meydan":{"chg":-36.8,"s":"bear"},"Dubai South":{"chg":5.9,"s":"bull"},"City Walk":{"chg":2.6,"s":"neutral"},"Jumeirah":{"chg":-12.3,"s":"bear"}};
// --- DEAL ALERTS ---
function renderFind(){
  const cl=C();
  const wrap=el("div",{style:{padding:"16px",maxWidth:"640px",margin:"0 auto"}});

  wrap.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Property Search"));
  wrap.appendChild(div({color:cl.sub,fontSize:"12px",marginBottom:"16px",fontFamily:"'Inter',sans-serif"},"Tell DubAIVal what you're looking for. AI searches PropertyFinder & market data."));

  if(!window.FIND_STATE)window.FIND_STATE={area:"",beds:"2 BR",maxPrice:"",minYield:"",type:"Apartment",query:"",results:[],loading:false,searched:false,
    sf:{area:"",grade:"",minYield:"",maxPSF:"",minPSF:"",minGrowth:"",maxDOM:"",minTurnover:"",type:"Apartment",beds:"Any",sort:"yield",showResults:false,results:[]}
  };
  var FS=window.FIND_STATE;

  // Natural language search
  const nlWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"}});
  nlWrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Ask in Natural Language"));
  const nlRow=el("div",{style:{display:"flex",gap:"8px"}});
  const nlInp=el("input",{type:"text",placeholder:"e.g. 2BR under 2M in JVC with 7%+ yield, or furnished studio near metro...",style:{flex:"1",background:"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:"#F0F2F5",padding:"11px 14px",borderRadius:"10px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none"}});
  nlInp.value=FS.query||"";
  nlInp.addEventListener("input",function(){FS.query=this.value;});
  nlInp.addEventListener("keydown",function(e){if(e.key==="Enter")doSearch();});
  const nlBtn=el("button",{style:{background:"linear-gradient(135deg,#C9A84C,#7A5E28)",color:"#08090C",border:"none",padding:"11px 16px",borderRadius:"10px",fontSize:"13px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer",whiteSpace:"nowrap"}});
  nlBtn.textContent=FS.loading?"Searching...":"Search";
  nlBtn.addEventListener("click",function(){doSearch();});
  nlRow.appendChild(nlInp);nlRow.appendChild(nlBtn);
  nlWrap.appendChild(nlRow);
  wrap.appendChild(nlWrap);

  // Quick filters
  const filterWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"}});
  filterWrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"Quick Filters"));
  const filterGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}});

  // Area
  const aBox=el("div",{}); aBox.appendChild(lbl("Area"));
  aBox.appendChild(mkSelect(S(),["Any Area"].concat(Object.keys(AREAS)||[]),FS.area||"Any Area",function(v){FS.area=v==="Any Area"?"":v;}));
  filterGrid.appendChild(aBox);

  // Bedrooms
  const bBox=el("div",{}); bBox.appendChild(lbl("Bedrooms"));
  bBox.appendChild(mkSelect(S(),["Any","Studio","1 BR","2 BR","3 BR","4 BR","5+ BR"],FS.beds||"Any",function(v){FS.beds=v;}));
  filterGrid.appendChild(bBox);

  // Max Price
  const pBox=el("div",{}); pBox.appendChild(lbl("Max Price (AED)"));
  const pInp=inp(I(),"e.g. 2000000","number",FS.maxPrice,function(v){FS.maxPrice=v;});
  pBox.appendChild(pInp); filterGrid.appendChild(pBox);

  // Type
  const tBox=el("div",{}); tBox.appendChild(lbl("Type"));
  tBox.appendChild(mkSelect(S(),["Apartment","Villa","Townhouse","Any"],FS.type||"Apartment",function(v){FS.type=v;}));
  filterGrid.appendChild(tBox);

  filterWrap.appendChild(filterGrid);

  const filterBtn=el("button",{style:{width:"100%",padding:"11px",borderRadius:"8px",border:"none",background:"linear-gradient(135deg,#C9A84C,#7A5E28)",color:"#08090C",fontSize:"13px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
  filterBtn.textContent="Find Properties";
  filterBtn.addEventListener("click",function(){doSearch();});
  filterWrap.appendChild(filterBtn);
  wrap.appendChild(filterWrap);

  // Smart Discovery Filter — searches 6,008 buildings by financial criteria
  var sf=FS.sf;
  var sfCard=el("div",{style:{background:cl.surface,border:"1px solid "+(sf.showResults?cl.goldDim:cl.border),borderRadius:"14px",padding:"18px",marginBottom:"14px",position:"relative",overflow:"hidden"}});
  sfCard.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,#6366F1,#6366F1,transparent)",animation:"shimmer 3s ease infinite"}));
  sfCard.appendChild(span({color:"#818CF8",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"◆ Smart Property Discovery"));
  sfCard.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",display:"block",marginBottom:"14px"},"Filter 6,008 buildings by yield, growth, price, liquidity & more"));

  var sfG1=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"10px"});
  var sfArea=div({});sfArea.appendChild(lbl("Area"));sfArea.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11px",padding:"7px 8px"}),["All Areas"].concat(AREA_NAMES),sf.area||"All Areas",function(v){sf.area=v==="All Areas"?"":v;}));sfG1.appendChild(sfArea);
  var sfGrade=div({});sfGrade.appendChild(lbl("Grade"));sfGrade.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11px",padding:"7px 8px"}),["Any","Ultra","A+","A","A-","B+","B","C"],sf.grade||"Any",function(v){sf.grade=v==="Any"?"":v;}));sfG1.appendChild(sfGrade);
  var sfType=div({});sfType.appendChild(lbl("Type"));sfType.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11px",padding:"7px 8px"}),["Any","Apartment","Villa"],sf.type||"Any",function(v){sf.type=v==="Any"?"":v;}));sfG1.appendChild(sfType);
  sfCard.appendChild(sfG1);

  var sfG2=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"10px"});
  var sfMinY=div({});sfMinY.appendChild(lbl("Min Yield %"));sfMinY.appendChild(inp(Object.assign({},I(),{fontSize:"11px",padding:"7px 8px"}),"e.g. 6","number",sf.minYield,function(v){sf.minYield=v;}));sfG2.appendChild(sfMinY);
  var sfMinG=div({});sfMinG.appendChild(lbl("Min Growth 3yr %"));sfMinG.appendChild(inp(Object.assign({},I(),{fontSize:"11px",padding:"7px 8px"}),"e.g. 15","number",sf.minGrowth,function(v){sf.minGrowth=v;}));sfG2.appendChild(sfMinG);
  var sfMaxD=div({});sfMaxD.appendChild(lbl("Max DOM (days)"));sfMaxD.appendChild(inp(Object.assign({},I(),{fontSize:"11px",padding:"7px 8px"}),"e.g. 45","number",sf.maxDOM,function(v){sf.maxDOM=v;}));sfG2.appendChild(sfMaxD);
  sfCard.appendChild(sfG2);

  var sfG3=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"});
  var sfMinP=div({});sfMinP.appendChild(lbl("Min PSF (AED)"));sfMinP.appendChild(inp(Object.assign({},I(),{fontSize:"11px",padding:"7px 8px"}),"e.g. 800","number",sf.minPSF,function(v){sf.minPSF=v;}));sfG3.appendChild(sfMinP);
  var sfMaxP=div({});sfMaxP.appendChild(lbl("Max PSF (AED)"));sfMaxP.appendChild(inp(Object.assign({},I(),{fontSize:"11px",padding:"7px 8px"}),"e.g. 2500","number",sf.maxPSF,function(v){sf.maxPSF=v;}));sfG3.appendChild(sfMaxP);
  var sfSort=div({});sfSort.appendChild(lbl("Sort By"));sfSort.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11px",padding:"7px 8px"}),["Highest Yield","Lowest PSF","Highest Growth","Best Liquidity","Best Turnover"],{yield:"Highest Yield",psfAsc:"Lowest PSF",growth:"Highest Growth",liquidity:"Best Liquidity",turnover:"Best Turnover"}[sf.sort]||"Highest Yield",function(v){sf.sort={"Highest Yield":"yield","Lowest PSF":"psfAsc","Highest Growth":"growth","Best Liquidity":"liquidity","Best Turnover":"turnover"}[v]||"yield";}));sfG3.appendChild(sfSort);
  sfCard.appendChild(sfG3);

  sfCard.appendChild(btn({width:"100%",padding:"11px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#6366F1,#818CF8)",color:"#fff",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em"},"DISCOVER PROPERTIES ◆",function(){
    var results=[];
    var minY=parseFloat(sf.minYield)||0;
    var minG=parseFloat(sf.minGrowth)||0;
    var maxD=parseFloat(sf.maxDOM)||9999;
    var minP=parseFloat(sf.minPSF)||0;
    var maxP=parseFloat(sf.maxPSF)||999999;
    Object.entries(DB).forEach(function(e){
      var key=e[0],bData=e[1];
      if(sf.area&&bData.a!==sf.area)return;
      if(sf.grade&&bData.g!==sf.grade)return;
      var aData=AREAS[bData.a]||{psf:1800,sc:15,y:[5,7],g:[10,18,28],dom:60,txVol:100};
      if(bData.p<minP||bData.p>maxP)return;
      var yi=aData.y||[5,7];var avgYield=(yi[0]+yi[1])/2;
      if(avgYield<minY)return;
      var gr=aData.g||[10,18,28];
      if(gr[1]<minG)return;
      var dom=aData.dom||60;
      if(dom>maxD)return;
      var isV=VILLA_AREAS&&VILLA_AREAS.has&&VILLA_AREAS.has(bData.a);
      if(sf.type==="Apartment"&&isV)return;
      if(sf.type==="Villa"&&!isV)return;
      var txVol=aData.txVol||100;
      var bldgUnits=estimateBldgUnits(key,bData,isV);
      var bldgTx=estimateBldgTx(key,bData.a,aData,bData);
      var turnover=bldgUnits>0?Math.round(bldgTx/bldgUnits*1000)/10:0;
      var netYield=avgYield-((bData.sc||aData.sc||15)/bData.p*100);
      var totalReturn=netYield+gr[1]/3;
      var prRatio=avgYield>0?(100/avgYield):20;
      var signal=prRatio<15?"Undervalued":prRatio<20?"Fair Value":prRatio<25?"Elevated":"Overheated";
      results.push({name:key,area:bData.a,psf:bData.p,lo:bData.lo,hi:bData.hi,sc:bData.sc||aData.sc||15,grade:bData.g||"N/A",yield:avgYield,netYield:netYield,growth3:gr[1],dom:dom,txVol:txVol,turnover:turnover,totalReturn:totalReturn,signal:signal});
    });
    if(sf.sort==="yield")results.sort(function(a,b){return b.yield-a.yield;});
    else if(sf.sort==="psfAsc")results.sort(function(a,b){return a.psf-b.psf;});
    else if(sf.sort==="growth")results.sort(function(a,b){return b.growth3-a.growth3;});
    else if(sf.sort==="liquidity")results.sort(function(a,b){return a.dom-b.dom;});
    else if(sf.sort==="turnover")results.sort(function(a,b){return b.turnover-a.turnover;});
    sf.results=results.slice(0,50);
    sf.showResults=true;
    render();
  }));
  wrap.appendChild(sfCard);

  // Smart Discovery Results
  if(sf.showResults&&sf.results.length>0){
    var sfResCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px"});
    sfResCard.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},[
      span({color:"#818CF8",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"◆ "+sf.results.length+" Buildings Found"+(sf.results.length>=50?" (showing top 50)":"")),
      btn({background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"4px 10px",borderRadius:"6px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"Clear",function(){sf.showResults=false;sf.results=[];render();})
    ]));
    var sfStats=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"8px",marginBottom:"14px"});
    var avgY2=sf.results.reduce(function(s,r){return s+r.yield;},0)/sf.results.length;
    var avgG2=sf.results.reduce(function(s,r){return s+r.growth3;},0)/sf.results.length;
    var avgP2=sf.results.reduce(function(s,r){return s+r.psf;},0)/sf.results.length;
    var avgD2=sf.results.reduce(function(s,r){return s+r.dom;},0)/sf.results.length;
    [{l:"Avg Yield",v:avgY2.toFixed(1)+"%",c:cl.green},{l:"Avg Growth",v:"+"+avgG2.toFixed(0)+"%",c:cl.green},{l:"Avg PSF",v:"AED "+Math.round(avgP2).toLocaleString(),c:cl.gold},{l:"Avg DOM",v:Math.round(avgD2)+"d",c:avgD2<=30?cl.green:avgD2<=60?cl.yellow:cl.red}].forEach(function(item){
      var box=div({background:cl.raised,borderRadius:"8px",padding:"8px 10px",textAlign:"center"});
      box.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"2px"},item.l));
      box.appendChild(span({color:item.c,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},item.v));
      sfStats.appendChild(box);
    });
    sfResCard.appendChild(sfStats);
    sf.results.forEach(function(r,idx){
      var sigColor=r.signal==="Undervalued"||r.signal==="Fair Value"?cl.green:r.signal==="Elevated"?cl.yellow:cl.red;
      var row=el("div",{style:{background:cl.raised,borderRadius:"10px",padding:"12px 14px",marginBottom:"6px",cursor:"pointer",border:"1px solid "+cl.border,transition:"border 0.2s"},onclick:function(){
        if(window.analyzerState){analyzerState.f.building=r.name;analyzerState.f.area=r.area;analyzerState.stage=0;}
        currentTab="Analyzer";render();
      }});
      row.addEventListener("mouseenter",function(){this.style.borderColor=cl.goldDim;});
      row.addEventListener("mouseleave",function(){this.style.borderColor=cl.border;});
      var rTop=div({display:"flex",justifyContent:"space-between",alignItems:"flex-start"});
      var rLeft=div({flex:"1"});
      var nameRow=div({display:"flex",alignItems:"center",gap:"6px",marginBottom:"3px"});
      nameRow.appendChild(span({color:cl.white,fontSize:"12.5px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},r.name.length>35?r.name.substring(0,32)+"…":r.name));
      nameRow.appendChild(pill(r.grade,"gold"));
      rLeft.appendChild(nameRow);
      rLeft.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},r.area));
      rTop.appendChild(rLeft);
      var rRight=div({textAlign:"right"});
      rRight.appendChild(span({color:cl.gold,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},"AED "+r.psf.toLocaleString()+"/sqft"));
      rRight.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},r.lo.toLocaleString()+" – "+r.hi.toLocaleString()));
      rTop.appendChild(rRight);
      row.appendChild(rTop);
      var rPills=div({display:"flex",gap:"6px",marginTop:"8px",flexWrap:"wrap"});
      rPills.appendChild(pill("Yield "+r.yield.toFixed(1)+"%","green"));
      rPills.appendChild(pill("Growth +"+r.growth3+"%","green"));
      rPills.appendChild(pill("DOM "+r.dom+"d",r.dom<=30?"green":r.dom<=60?"yellow":"red"));
      rPills.appendChild(pill(r.signal,sigColor===cl.green?"green":sigColor===cl.yellow?"yellow":"red"));
      if(r.turnover>=3)rPills.appendChild(pill("TO "+r.turnover+"%",r.turnover>=6?"green":"yellow"));
      row.appendChild(rPills);
      sfResCard.appendChild(row);
    });
    sfResCard.appendChild(div({marginTop:"10px",padding:"8px 10px",background:cl.goldFaint,borderRadius:"6px",fontSize:"10px",color:cl.sub,fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},"Click any building to open it in the Analyzer for full valuation."));
    wrap.appendChild(sfResCard);
  }else if(sf.showResults&&sf.results.length===0){
    wrap.appendChild(div({background:cl.raised,borderRadius:"10px",padding:"20px",textAlign:"center",marginBottom:"14px"},[
      span({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif"},"No buildings match your criteria. Try widening filters.")
    ]));
  }

  // Results
  if(FS.loading){
    const loadDiv=el("div",{style:{textAlign:"center",padding:"32px",color:cl.sub,fontFamily:"'Space Grotesk',monospace",fontSize:"12px"}});
    loadDiv.textContent="Searching market data...";
    wrap.appendChild(loadDiv);
  } else if(FS.searched&&FS.results.length===0){
    wrap.appendChild(div({background:cl.raised,borderRadius:"10px",padding:"20px",textAlign:"center",color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif"},"No results found. Try adjusting your criteria or asking in natural language."));
  } else if(FS.results.length>0){
    const resWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px"}});
    resWrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},FS.results.length+" Properties Found · AI Analysis"));
    
    // AI summary if available
    if(FS.aiSummary){
      resWrap.appendChild(div({background:cl.goldFaint,border:"1px solid "+cl.goldDim,borderRadius:"8px",padding:"10px 14px",marginBottom:"12px",color:"#F0F2F5",fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6"},FS.aiSummary));
    }

    FS.results.forEach(function(r,i){
      var card=el("div",{style:{background:cl.raised,borderRadius:"12px",padding:"14px",marginBottom:"10px",border:"1px solid "+cl.border}});
      
      // Photo + Title row
      var topRow=el("div",{style:{display:"flex",gap:"12px",marginBottom:"10px"}});
      if(r.photo){
        var img=el("img",{style:{width:"80px",height:"60px",borderRadius:"8px",objectFit:"cover",flexShrink:"0"}});
        img.src=r.photo;
        img.onerror=function(){this.style.display="none";};
        topRow.appendChild(img);
      }
      var titleBlock=el("div",{style:{flex:"1",minWidth:"0"}});
      var titleEl=el("div",{style:{color:"#F0F2F5",fontSize:"13px",fontWeight:"700",fontFamily:"'Inter',sans-serif",marginBottom:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}});
      titleEl.textContent=r.title||r.name||"Property";
      titleBlock.appendChild(titleEl);
      titleBlock.appendChild(div({color:cl.gold,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+(r.price?(r.price/1e6).toFixed(2)+"M":"—")));
      if(r.source){
        var srcBadge2=el("span",{style:{background:r.source==="PropertyFinder"?"rgba(0,120,255,0.15)":"rgba(255,80,0,0.15)",border:"1px solid "+(r.source==="PropertyFinder"?"rgba(0,120,255,0.4)":"rgba(255,80,0,0.4)"),color:r.source==="PropertyFinder"?"#4da6ff":"#ff8040",padding:"1px 7px",borderRadius:"20px",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginLeft:"6px"}});
        srcBadge2.textContent=r.source;
        titleBlock.appendChild(srcBadge2);
      }
      titleBlock.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},(r.area||"")+(r.size?" · "+Math.round(r.size*10.764).toLocaleString()+" sqft":"")+(r.beds?" · "+r.beds+"BR":"")));
      topRow.appendChild(titleBlock);
      card.appendChild(topRow);
      
      // PSF + Permit row
      if(r.psf||r.permit){
        var metaRow=el("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"8px"}});
        if(r.psf)metaRow.appendChild(el("span",{style:{background:"rgba(201,168,76,0.1)",border:"1px solid "+cl.goldDim,color:cl.gold,padding:"2px 8px",borderRadius:"20px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"}},"PSF: AED "+r.psf.toLocaleString()));
        if(r.permit)metaRow.appendChild(el("span",{style:{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.4)",color:cl.green,padding:"2px 8px",borderRadius:"20px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"}},"Permit: "+r.permit));
        if(r.furnished)metaRow.appendChild(el("span",{style:{background:cl.raised,border:"1px solid "+cl.border,color:cl.sub,padding:"2px 8px",borderRadius:"20px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"}},r.furnished));
        card.appendChild(metaRow);
      }
      
      // Agent info
      if(r.agentName||r.agencyName){
        var agentRow=el("div",{style:{display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:"8px",marginBottom:"8px"}});
        var agentInfo=el("div",{style:{flex:"1"}});
        agentInfo.appendChild(div({color:"#F0F2F5",fontSize:"11px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},r.agentName||r.agencyName));
        if(r.agencyName&&r.agentName)agentInfo.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},r.agencyName));
        agentRow.appendChild(agentInfo);
        // WhatsApp button
        if(r.agentWA||r.agentPhone){
          var waBtn=el("a",{style:{background:"#25D366",color:"#fff",padding:"5px 10px",borderRadius:"6px",fontSize:"11px",fontWeight:"600",fontFamily:"'Inter',sans-serif",textDecoration:"none",flexShrink:"0"}});
          waBtn.href="https://wa.me/"+(r.agentWA||r.agentPhone).replace(/[^0-9]/g,"");
          waBtn.target="_blank";
          waBtn.textContent="WhatsApp";
          agentRow.appendChild(waBtn);
        }
        if(r.agentPhone&&!r.agentWA){
          var callBtn=el("a",{style:{background:cl.raised,border:"1px solid "+cl.border,color:cl.sub,padding:"5px 10px",borderRadius:"6px",fontSize:"11px",fontFamily:"'Inter',sans-serif",textDecoration:"none",flexShrink:"0",marginLeft:"4px"}});
          callBtn.href="tel:"+r.agentPhone;
          callBtn.textContent="Call";
          agentRow.appendChild(callBtn);
        }
        card.appendChild(agentRow);
      }
      
      // Action buttons
      var btnRow=el("div",{style:{display:"flex",gap:"8px"}});
      
      // PropertyFinder / Bayut link
      if(r.bayutUrl||r.pfUrl){
        var linkBtn=el("a",{style:{flex:"1",background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"7px 10px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",textDecoration:"none",textAlign:"center"}});
        linkBtn.href=r.listingUrl||r.bayutUrl||r.pfUrl||"#";
        linkBtn.target="_blank";
        linkBtn.textContent="View on "+(r.listingSource||r.source||(r.bayutUrl?"Bayut":"PropertyFinder"));
        btnRow.appendChild(linkBtn);
      }
      
      // Analyze button
      var anaBtn=el("button",{style:{flex:"1",background:"linear-gradient(135deg,#C9A84C,#7A5E28)",color:"#08090C",border:"none",padding:"7px 10px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
      anaBtn.textContent="Analyze Deal →";
      anaBtn.addEventListener("click",function(){
        var name=r.title||r.name||"";
        var areaName=r.area||"";
        analyzerState.f.building=name.toLowerCase();
        analyzerState.f.area=areaName;
        analyzerState.f.beds=r.beds===0?"Studio":r.beds?(r.beds+" BR"):(FS.beds||"2 BR");
        analyzerState.f.size=r.size?String(Math.round(r.size*10.764)):"";
        analyzerState.f.price=r.price?String(r.price):"";
        analyzerState.f.furnished=r.furnished||"Unfurnished";
        analyzerState.f.floor=r.floor?String(r.floor):"";
        analyzerState.f.propCategory=(r.type&&(r.type.toLowerCase().includes("villa")||r.type.toLowerCase().includes("townhouse")))?"villa":"apartment";
        currentTab="Analyzer";
        analyzerState.stage=0;
        render();
        // Scroll to top
        window.scrollTo(0,0);
      });
      btnRow.appendChild(anaBtn);
      card.appendChild(btnRow);
      resWrap.appendChild(card);
    });
    wrap.appendChild(resWrap);
  }

  async function doSearch(){
    var query=FS.query||"";
    var area=FS.area||"";
    var beds=FS.beds||"";
    var maxPrice=parseInt(FS.maxPrice)||0;
    var type=FS.type||"Apartment";
    
    FS.loading=true;FS.results=[];FS.searched=false;FS.aiSummary="";
    render();

    try{
      // Step 1: Try uae-real-estate2 for real live listings
      var bedsNumMap={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5};
      var bn=bedsNumMap[beds]||2;
      var searchTerm=query||(area?area:"Dubai");
      var locId=await getUAELocationId(searchTerm);
      if(!locId&&area)locId=await getUAELocationId(area);

      if(locId){
        var params=new URLSearchParams({locationExternalIDs:locId,purpose:"for-sale",hitsPerPage:"25",page:"0"});
        if(beds){params.set("rooms_min",String(bn));params.set("rooms_max",String(bn));}
        if(maxPrice>0)params.set("priceMax",String(maxPrice));
        var listResp;
        if(UAE_RE_KEY){listResp=await fetch("https://"+UAE_RE_HOST+"/properties/list?"+params,{headers:{"x-rapidapi-key":UAE_RE_KEY,"x-rapidapi-host":UAE_RE_HOST}});}
        else{listResp=await fetch(API_BASE+"/proxy-rapidapi?endpoint=properties/list&"+params);}
        if(listResp.ok){
          var listData=await listResp.json();
          var liveHits=listData.hits||[];
          if(liveHits.length>0){
            FS.results=liveHits.filter(function(p){return p.price&&p.area;}).map(function(p){
              var psf=p.area>0?Math.round(p.price/p.area):0;
              var locName=p.location&&p.location.length>0?p.location[p.location.length-1].name:(area||"Dubai");
              return{
                title:p.title||(p.rooms+" BR in "+locName),
                area:locName,
                price:p.price||0,
                size:p.area||0,
                psf:psf,
                beds:p.rooms||bn,
                baths:p.baths||0,
                floor:p.floor||"",
                furnished:p.furnishingStatus||"",
                permit:p.permitNumber||"",
                agentName:(p.agency&&p.agency.name)||"",
                agencyName:(p.agency&&p.agency.name)||"",
                agentPhone:"",
                agentWA:"",
                photo:(p.coverPhoto&&p.coverPhoto.url)||"",
                listingUrl:p.externalURL||"https://www.bayut.com",
                listingSource:"Bayut",
                source:"Bayut"
              };
            }).filter(function(p){return p.psf>200&&p.psf<20000;});
            if(FS.results.length>0){
              var prices=FS.results.map(function(r){return r.price;});
              FS.aiSummary="Found "+FS.results.length+" live listings"+(area?" in "+area:"")+". Prices: AED "+(Math.min.apply(null,prices)/1e6).toFixed(2)+"M – AED "+(Math.max.apply(null,prices)/1e6).toFixed(2)+"M. Source: Bayut via RapidAPI.";
            }
          }
        }
      }

      // Step 2: Groq AI fallback if no live results
      if(FS.results.length===0){
        var searchQuery=(beds?beds+" ":"")+type+" for sale"+(area?" in "+area:"")+(maxPrice?" under AED "+(maxPrice/1e6).toFixed(1)+"M":"")+". June 2026. Dubai UAE.";
        var prompt="Provide market intelligence for: "+searchQuery+"\n\nReturn EXACTLY this JSON array (5-8 typical options based on June 2026 market data):\n[{\"title\":\"Building Name Type Beds\",\"area\":\"Area Name\",\"price\":2500000,\"size\":1200,\"beds\":2,\"baths\":2,\"floor\":15,\"furnished\":\"Unfurnished\",\"permit\":\"\",\"agentName\":\"DubAIVal AI\",\"agencyName\":\"Market Estimate\",\"agentPhone\":\"\",\"agentWA\":\"\",\"photo\":\"\",\"listingUrl\":\"https://www.bayut.com\",\"source\":\"AI Estimate\"}]\n\nUse real June 2026 market prices. Return ONLY the JSON array, no other text.";
        var resp=await callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:"You are a Dubai real estate market expert. Return ONLY valid JSON arrays based on June 2026 market data."},{role:"user",content:prompt}],max_tokens:2000,temperature:0.3});
        var data=await resp.json();
        var text=data.choices&&data.choices[0]?data.choices[0].message.content:"";
        var clean=text.replace(/```json|```/g,"").trim();
        var arrStart=clean.indexOf("[");
        var arrEnd=clean.lastIndexOf("]")+1;
        if(arrStart>=0&&arrEnd>arrStart){
          var parsed=JSON.parse(clean.substring(arrStart,arrEnd));
          if(Array.isArray(parsed)&&parsed.length>0){
            FS.results=parsed.map(function(p){
              return{title:p.title||"Property",area:p.area||area,price:p.price||0,size:p.size||0,psf:p.size>0?Math.round(p.price/p.size):0,beds:p.beds||0,baths:p.baths||0,floor:p.floor||"",furnished:p.furnished||"",permit:p.permit||"",agentName:p.agentName||"DubAIVal AI",agencyName:p.agencyName||"Market Estimate",agentPhone:p.agentPhone||"",agentWA:p.agentWA||"",photo:p.photo||"",listingUrl:p.listingUrl||"https://www.bayut.com",listingSource:p.source||"AI Estimate",source:p.source||"AI Estimate"};
            });
            FS.aiSummary="Live API unavailable — showing AI market estimates. Prices reflect typical June 2026 values for "+searchQuery;
          }
        }
      }
    }catch(e){
      console.warn("Search failed:",e.message);
    }
    
    // If no results, fallback to DB
    if(FS.results.length===0){
      doDBSearch(query,area,beds,maxPrice,type);
      FS.aiSummary="Live search unavailable. Showing DubAIVal database results.";
    }
    
    FS.searched=true;FS.loading=false;
    render();
  }
  function doDBSearch(query,area,beds,maxPrice,type){
    var dbResults=[];
    Object.entries(DB).forEach(function(e){
      var key=e[0],val=e[1];
      if(dbResults.length>=12)return;
      var areaMatch=!area||val.a===area;
      if(areaMatch){
        var estPrice=val.p*(beds==="Studio"?500:beds==="1 BR"?750:beds==="2 BR"?1100:beds==="3 BR"?1600:2200);
        if(maxPrice&&estPrice>maxPrice)return;
        dbResults.push({title:key,area:val.a,psf:val.p,price:estPrice,g:val.g,apiSource:"DubAIVal DB"});
      }
    });
    FS.results=dbResults;
    FS.apiSource="DubAIVal DB";
  }

  return wrap;
}

function renderAlerts(){
  const cl=C();
  const wrap=el("div",{style:{padding:"16px",maxWidth:"640px",margin:"0 auto"}});

  // Header
  const hdr=el("div",{style:{marginBottom:"16px"}});
  hdr.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Deal Alerts"));
  hdr.appendChild(div({color:cl.sub,fontSize:"12px",marginTop:"4px",fontFamily:"'Inter',sans-serif"},"Set your criteria. DubAIVal scans 6,800+ buildings instantly."));
  wrap.appendChild(hdr);

  // Load saved alerts
  var alerts=[];
  try{alerts=JSON.parse(localStorage.getItem("dv_alerts")||"[]");}catch(e){}

  // New alert form
  const formWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"}});
  formWrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"New Alert"));

  if(!window.ALERT_FORM)window.ALERT_FORM={area:"",maxPSF:"",minYield:"",type:"Apartment"};
  var AF=window.ALERT_FORM;

  // Row 1: Area + Type
  const r1=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}});
  const aBox=el("div",{});
  aBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Area"));
  aBox.appendChild(mkSelect({width:"100%",background:"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:"#F0F2F5",padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",outline:"none"},["Any"].concat(Object.keys(AREAS)),AF.area||"Any",function(v){AF.area=v==="Any"?"":v;}));
  r1.appendChild(aBox);
  const tBox=el("div",{});
  tBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Type"));
  tBox.appendChild(mkSelect({width:"100%",background:"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:"#F0F2F5",padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",outline:"none"},["Any","Apartment","Villa"],AF.type||"Any",function(v){AF.type=v;}));
  r1.appendChild(tBox);
  formWrap.appendChild(r1);

  // Row 2: Max PSF + Min Yield
  const r2=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}});
  const pBox=el("div",{});
  pBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Max PSF (AED)"));
  const pInp=el("input",{type:"number",placeholder:"e.g. 2000",style:{width:"100%",background:"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:"#F0F2F5",padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
  pInp.value=AF.maxPSF||"";
  pInp.addEventListener("input",function(){AF.maxPSF=this.value;});
  pBox.appendChild(pInp);
  r2.appendChild(pBox);
  const yBox=el("div",{});
  yBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Min Yield %"));
  const yInp=el("input",{type:"number",placeholder:"e.g. 7",style:{width:"100%",background:"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:"#F0F2F5",padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
  yInp.value=AF.minYield||"";
  yInp.addEventListener("input",function(){AF.minYield=this.value;});
  yBox.appendChild(yInp);
  r2.appendChild(yBox);
  formWrap.appendChild(r2);

  const addBtn=el("button",{style:{width:"100%",padding:"11px",borderRadius:"8px",border:"none",background:"linear-gradient(135deg,#C9A84C,#7A5E28)",color:"#08090C",fontSize:"13px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
  addBtn.textContent="+ Add Alert";
  addBtn.addEventListener("click",function(){
    var a={id:Date.now(),area:AF.area||"Any",type:AF.type||"Any",maxPSF:parseInt(AF.maxPSF)||null,minYield:parseFloat(AF.minYield)||null,created:new Date().toLocaleDateString("en-GB")};
    alerts.push(a);
    try{localStorage.setItem("dv_alerts",JSON.stringify(alerts));}catch(e){}
    window.ALERT_FORM={area:"",maxPSF:"",minYield:"",type:"Apartment"};
    render();
  });
  formWrap.appendChild(addBtn);
  wrap.appendChild(formWrap);

  // Active alerts list
  if(alerts.length>0){
    const listWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"}});
    listWrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"Active Alerts ("+alerts.length+")"));
    alerts.forEach(function(alert,i){
      const row=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<alerts.length-1?"1px solid "+cl.border:"none"}});
      const info=el("div",{style:{flex:"1"}});
      info.appendChild(div({color:"#F0F2F5",fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},alert.area+" - "+alert.type));
      var criteria=[];
      if(alert.maxPSF)criteria.push("Max PSF AED "+alert.maxPSF.toLocaleString());
      if(alert.minYield)criteria.push("Min "+alert.minYield+"% yield");
      info.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},criteria.join(" / ")||"Any match"));
      row.appendChild(info);
      const delBtn=el("button",{style:{background:"transparent",border:"1px solid rgba(239,68,68,0.3)",color:"#EF4444",padding:"5px 10px",borderRadius:"6px",fontSize:"11px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",flexShrink:"0",marginLeft:"10px"}});
      delBtn.textContent="Remove";
      delBtn.addEventListener("click",function(){alerts.splice(i,1);try{localStorage.setItem("dv_alerts",JSON.stringify(alerts));}catch(e){}render();});
      row.appendChild(delBtn);
      listWrap.appendChild(row);
    });
    wrap.appendChild(listWrap);
  }

  // Scan DB for matches
  var matches=[];
  Object.entries(DB).forEach(function(entry){
    if(matches.length>=12)return;
    var key=entry[0],d=entry[1];
    var matched=alerts.some(function(alert){
      var areaOk=!alert.area||alert.area==="Any"||d.a===alert.area;
      var psfOk=!alert.maxPSF||d.p<=alert.maxPSF;
      var aData=AREAS[d.a];
      var yld=aData&&aData.r2?(aData.r2/(d.p*1000)*100):null;
      var yldOk=!alert.minYield||!yld||(yld>=alert.minYield);
      return areaOk&&psfOk&&yldOk;
    });
    if(matched)matches.push({key:key,d:d});
  });

  if(alerts.length>0){
    const mWrap=el("div",{style:{background:cl.surface,border:"1px solid rgba(0,200,150,0.3)",borderRadius:"14px",padding:"16px"}});
    const mTitle=matches.length>0?matches.length+" Buildings Match Your Criteria":"No Matches — Adjust Your Criteria";
    const mColor=matches.length>0?"#00C896":cl.sub;
    mWrap.appendChild(div({color:mColor,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},mTitle));
    matches.forEach(function(m,i){
      const row=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<matches.length-1?"1px solid "+cl.border:"none",cursor:"pointer"}});
      const info=el("div",{style:{flex:"1"}});
      info.appendChild(div({color:"#F0F2F5",fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif",textTransform:"capitalize"},m.key));
      info.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},m.d.a+" · AED "+m.d.p.toLocaleString()+" PSF"));
      const badge=el("span",{style:{background:"rgba(0,200,150,0.1)",border:"1px solid rgba(0,200,150,0.3)",color:"#00C896",fontSize:"10px",padding:"3px 8px",borderRadius:"10px",fontFamily:"'Space Grotesk',monospace",flexShrink:"0",marginLeft:"8px"}});
      badge.textContent=m.d.g;
      row.appendChild(info);
      row.appendChild(badge);
      row.addEventListener("click",function(){analyzerState.f.area=m.d.a;analyzerState.f.building=m.key;currentTab="Analyzer";render();});
      mWrap.appendChild(row);
    });
    wrap.appendChild(mWrap);
  } else {
    wrap.appendChild(div({background:cl.raised,borderRadius:"10px",padding:"20px",textAlign:"center",color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif"},"Add an alert above to scan matching buildings."));
  }

  return wrap;
}

// --- PDF REPORT (print-based, no library) ---
function generatePDF(){
  try{dvTrack('pdf_generated',{area:analyzerState&&analyzerState.f?analyzerState.f.area:'',verdict:analyzerState&&analyzerState.val?analyzerState.val.verdict:''});}catch(e){}
  var f=analyzerState.f;
  var val=analyzerState.val;
  var ai=(analyzerState.aiText||'').replace(/<[^>]*>/g,'').replace(/[\u0080-\uFFFF]/g,'').substring(0,1200);
  if(!val)return;
  var broker={name:'',company:'',rera:''};
  try{broker=JSON.parse(localStorage.getItem('dv_broker')||'null')||broker;}catch(e){}
  var vColors={DISTRESS:'#10B981',GOOD:'#10B981',FAIR:'#F59E0B',OVER:'#EF4444'};
  var vLabels={DISTRESS:'DISTRESS DEAL',GOOD:'GOOD PRICE',FAIR:'FAIR MARKET',OVER:'OVERPRICED'};
  var vColor=vColors[val.verdict]||'#888';
  var vLabel=vLabels[val.verdict]||val.verdict;
  var now=new Date();
  var dateStr=now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  var propName=(f.building||f.cluster||f.area||'Property')+' - '+(f.beds||'')+' '+(f.propCategory==='villa'?'Villa':'Apartment');
  var suggestStr=val.suggestedOffer?'Negotiate to AED '+val.suggestedOffer.toLocaleString():'At asking price';
  var scStr=val.bData&&val.bData.sc?val.bData.sc+' AED/sqft':'Estimated';
  var layerStr=['','Verified DB','Live Comps','','Area Benchmark'][val.dataLayer]||'Estimate';
  var viewStr=f.view&&f.view!=='Not specified'?f.view:'—';
  var brokerHtml='';
  if(broker.name)brokerHtml+='<div style="font-size:13px;font-weight:700;color:#111;margin-bottom:2px">'+broker.name+'</div>';
  if(broker.company)brokerHtml+='<div style="font-size:11px;color:#333">'+broker.company+'</div>';
  if(broker.rera)brokerHtml+='<div style="font-size:11px;color:#333">RERA: '+broker.rera+'</div>';
  var aiHtml=ai?'<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#C9A84C;font-weight:700;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e0e0e0">AI Expert Commentary</div><div style="font-size:11px;line-height:1.7;color:#333;margin-bottom:18px">'+ai.split(String.fromCharCode(10)).join('<br>')+'</div>':'';
  
  var h='<div style="width:210mm;min-height:297mm;padding:18mm 16mm;box-sizing:border-box;font-family:Inter,sans-serif">';
  // Header
  h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #C9A84C;padding-bottom:12px;margin-bottom:20px">';
  h+='<div><div style="font-size:20px;font-weight:800"><span style="color:#111">Dub</span><span style="color:#C9A84C">AI</span><span style="color:#111">Val</span></div>';
  h+='<div style="font-size:9px;color:#888;letter-spacing:0.12em;text-transform:uppercase">Property Intelligence &bull; DLD-Verified</div></div>';
  h+='<div style="text-align:right;font-size:10px;color:#666">';
  h+='<div style="font-weight:700;font-size:12px;color:#111">Valuation Report</div>';
  h+='<div>'+dateStr+'</div>';
  h+='<div style="margin-top:3px;font-size:9px;color:#C9A84C">Confidence: '+val.confTier.label+' ('+val.confScore+'/100)</div>';
  h+='</div></div>';
  // Property
  h+='<div style="background:#f8f8f8;border-left:4px solid #C9A84C;padding:12px 16px;margin-bottom:18px">';
  h+='<div style="font-size:16px;font-weight:700;color:#111;margin-bottom:4px">'+propName+'</div>';
  h+='<div style="font-size:11px;color:#555">'+f.area+(f.floor?' &bull; Floor '+f.floor:'')+(f.view&&f.view!=='Not specified'?' &bull; '+f.view:'')+' &bull; '+(f.size||'—')+' sqft &bull; '+(f.furnished||'Unfurnished')+'</div>';
  if(val.isDevFurnished){h+='<div style="margin-top:6px;font-size:9.5px;color:#C9A84C;font-weight:600">⚑ Developer-Furnished Building — furniture included in base PSF</div>';}
  h+='</div>';
  // Verdict
  var vBg={DISTRESS:'#f0fdf4',GOOD:'#f0fdf4',FAIR:'#fffbeb',OVER:'#fef2f2'};
  h+='<div style="text-align:center;padding:16px;margin-bottom:18px;border:2px solid '+vColor+';border-radius:8px;background:'+(vBg[val.verdict]||'#f8f8f8')+'">';
  h+='<div style="font-size:22px;font-weight:900;letter-spacing:2px;color:'+vColor+';margin-bottom:4px">'+vLabel+'</div>';
  h+='<div style="font-size:12px;color:#555">Asking PSF AED '+val.askPSF.toLocaleString()+' vs Market AED '+val.adjPSF.toLocaleString();
  h+=' &bull; '+(parseFloat(val.vsPct)>=0?'+':'')+val.vsPct+'% vs fair value &bull; '+suggestStr+'</div>';
  h+='</div>';
  // Metrics grid
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px">';
  var metrics=[
    {l:'Market PSF',v:'AED '+val.adjPSF.toLocaleString(),s:val.dataSource},
    {l:'Fair Value',v:'AED '+val.fairPrice.toLocaleString(),s:'Range '+val.confTier.range},
    {l:'Gross Yield',v:val.grossYield+'%',s:'Net '+val.netYield+'% after SC'},
    {l:'Service Charge',v:'AED '+Math.round(val.sc).toLocaleString()+'/yr',s:scStr},
    {l:'View Premium',v:'+'+val.vP+'%',s:viewStr},
    {l:'Data Layer',v:'L'+val.dataLayer,s:layerStr}
  ];
  metrics.forEach(function(m){
    h+='<div style="border:1px solid #e0e0e0;border-radius:6px;padding:10px 12px">';
    h+='<div style="font-size:8.5px;text-transform:uppercase;letter-spacing:0.1em;color:#888;margin-bottom:3px">'+m.l+'</div>';
    h+='<div style="font-size:15px;font-weight:700;color:#111">'+m.v+'</div>';
    h+='<div style="font-size:9px;color:#888;margin-top:2px">'+m.s+'</div>';
    h+='</div>';
  });
  h+='</div>';
  // Price ladder
  h+='<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#C9A84C;font-weight:700;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e0e0e0">Price Ladder</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px">';
  var ladder=[
    {l:'Distress / Floor',v:'AED '+val.distressPrice.toLocaleString(),c:'#10B981'},
    {l:'Good Buy Target',v:'AED '+val.goodPrice.toLocaleString(),c:'#10B981'},
    {l:'Fair Market Value',v:'AED '+val.fairPrice.toLocaleString(),c:'#F59E0B'},
    {l:'Overpriced Above',v:'AED '+val.overpricedAt.toLocaleString(),c:'#EF4444'},
    {l:'Asking Price',v:'AED '+(parseInt(f.price)||0).toLocaleString(),c:vColor},
    {l:'Negotiation Target',v:val.suggestedOffer?'AED '+val.suggestedOffer.toLocaleString():'At asking',c:'#C9A84C'}
  ];
  ladder.forEach(function(item){
    h+='<div style="border:1px solid #e0e0e0;border-radius:6px;padding:8px 12px">';
    h+='<div style="font-size:8.5px;text-transform:uppercase;letter-spacing:0.1em;color:#888;margin-bottom:2px">'+item.l+'</div>';
    h+='<div style="font-size:14px;font-weight:700;color:'+item.c+'">'+item.v+'</div>';
    h+='</div>';
  });
  h+='</div>';
  // AI Commentary
  h+=aiHtml;
  // Broker + Footer
  h+='<div style="border-top:1px solid #e0e0e0;padding-top:14px;margin-top:14px;display:flex;justify-content:space-between;align-items:flex-end">';
  h+='<div>'+brokerHtml+'</div>';
  h+='<div style="text-align:right"><div style="font-weight:700;font-size:13px"><span style="color:#111">Dub</span><span style="color:#C9A84C">AI</span><span style="color:#111">Val</span></div><div style="font-size:10px;color:#888">dubaival.com</div></div>';
  h+='</div>';
  h+='<div style="font-size:8px;color:#aaa;margin-top:16px;border-top:1px solid #eee;padding-top:8px">DLD-Verified Valuation Report &bull; Professional use only &bull; Not financial advice &bull; Accuracy '+val.confTier.range+' &bull; '+dateStr+'</div>';
  h+='</div>';
  
  var printEl=document.getElementById('print-report');
  if(printEl){printEl.innerHTML=h;}
  setTimeout(function(){
    window.print();
    setTimeout(function(){if(printEl)printEl.innerHTML='';},2000);
  },150);
}

function generateArabicPDF(){
  try{dvTrack('pdf_arabic_generated',{area:analyzerState&&analyzerState.f?analyzerState.f.area:''});}catch(e){}
  var f=analyzerState.f;
  var val=analyzerState.val;
  if(!val)return;
  var now=new Date();
  var dateStr=now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  var vColors={DISTRESS:'#10B981',GOOD:'#10B981',FAIR:'#F59E0B',OVER:'#EF4444'};
  var vLabels={DISTRESS:'صفقة ممتازة',GOOD:'سعر جيد',FAIR:'سعر عادل',OVER:'سعر مرتفع'};
  var vColor=vColors[val.verdict]||'#888';
  var vLabel=vLabels[val.verdict]||val.verdict;
  var propType=f.propCategory==='villa'?'فيلا':'شقة';
  var viewAr=f.view&&f.view!=='Not specified'?f.view:'—';
  var furnAr={'Furnished':'مفروشة','Semi-furnished':'نصف مفروشة','Unfurnished':'غير مفروشة'}[f.furnished]||f.furnished||'غير مفروشة';
  var investLabels={'Undervalued':'مقوّم بأقل من قيمته','Fair Value':'قيمة عادلة','Elevated':'مرتفع','Bubble Risk':'مخاطر فقاعة'};
  var investAr=investLabels[val.investSignal]||val.investSignal||'—';

  var h='<div style="width:210mm;min-height:297mm;padding:18mm 16mm;box-sizing:border-box;font-family:Cairo,Noto Sans Arabic,Tahoma,sans-serif;direction:rtl;text-align:right">';
  // Header
  h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #C9A84C;padding-bottom:12px;margin-bottom:20px">';
  h+='<div style="text-align:left"><div style="font-weight:700;font-size:12px;color:#111;font-family:Inter,sans-serif">DubAIVal</div>';
  h+='<div style="font-size:9px;color:#888;letter-spacing:0.08em">www.dubaival.com</div></div>';
  h+='<div><div style="font-size:20px;font-weight:800;color:#111">تقرير التقييم العقاري</div>';
  h+='<div style="font-size:10px;color:#666;margin-top:4px">'+dateStr+'</div>';
  h+='<div style="font-size:9px;color:#C9A84C;margin-top:3px">درجة الثقة: '+val.confScore+'/100 — '+(val.confTier.label||'')+'</div>';
  h+='</div></div>';

  // Property info
  h+='<div style="background:#f8f8f8;border-right:4px solid #C9A84C;border-left:none;padding:12px 16px;margin-bottom:18px;border-radius:4px">';
  h+='<div style="font-size:16px;font-weight:700;color:#111;margin-bottom:6px">'+(f.building||f.cluster||f.area||'عقار')+' — '+propType+'</div>';
  h+='<table style="width:100%;font-size:11px;color:#555;border-collapse:collapse">';
  h+='<tr><td style="padding:3px 0;width:30%;font-weight:600">المنطقة</td><td>'+(f.area||'—')+'</td></tr>';
  h+='<tr><td style="padding:3px 0;font-weight:600">المبنى</td><td>'+(f.building||'—')+'</td></tr>';
  h+='<tr><td style="padding:3px 0;font-weight:600">المساحة</td><td>'+(f.size||'—')+' قدم مربع</td></tr>';
  h+='<tr><td style="padding:3px 0;font-weight:600">الطابق</td><td>'+(f.floor||'—')+'</td></tr>';
  h+='<tr><td style="padding:3px 0;font-weight:600">الإطلالة</td><td>'+viewAr+'</td></tr>';
  h+='<tr><td style="padding:3px 0;font-weight:600">التأثيث</td><td>'+furnAr+'</td></tr>';
  h+='</table></div>';

  // Verdict
  var vBg={DISTRESS:'#f0fdf4',GOOD:'#f0fdf4',FAIR:'#fffbeb',OVER:'#fef2f2'};
  h+='<div style="text-align:center;padding:16px;margin-bottom:18px;border:2px solid '+vColor+';border-radius:8px;background:'+(vBg[val.verdict]||'#f8f8f8')+'">';
  h+='<div style="font-size:22px;font-weight:900;color:'+vColor+';margin-bottom:6px">'+vLabel+'</div>';
  h+='<div style="font-size:12px;color:#555">سعر القدم المربع المطلوب: '+val.askPSF.toLocaleString()+' درهم — السوق: '+val.adjPSF.toLocaleString()+' درهم';
  h+=' &bull; '+(parseFloat(val.vsPct)>=0?'+':'')+val.vsPct+'%</div>';
  h+='</div>';

  // Metrics
  h+='<div style="font-size:10px;letter-spacing:0.12em;color:#C9A84C;font-weight:700;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid #e0e0e0">نتائج التقييم</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px">';
  var arMetrics=[
    {l:'السعر العادل',v:'AED '+val.fairPrice.toLocaleString(),s:val.confTier.range},
    {l:'سعر القدم المربع',v:'AED '+val.adjPSF.toLocaleString(),s:val.dataSource||''},
    {l:'العائد الإجمالي',v:val.grossYield+'%',s:'صافي '+val.netYield+'%'},
    {l:'إشارة الاستثمار',v:investAr,s:'P/R '+(val.priceRentRatio||'—')},
    {l:'العائد الكلي السنوي',v:(val.totalReturnAnnual||'—')+'%',s:'عائد + نمو'},
    {l:'رسوم الخدمة',v:'AED '+Math.round(val.sc).toLocaleString()+'/سنة',s:(val.bData&&val.bData.sc?val.bData.sc:'—')+' درهم/قدم'}
  ];
  arMetrics.forEach(function(m){
    h+='<div style="border:1px solid #e0e0e0;border-radius:6px;padding:10px 12px">';
    h+='<div style="font-size:8.5px;letter-spacing:0.08em;color:#888;margin-bottom:3px">'+m.l+'</div>';
    h+='<div style="font-size:15px;font-weight:700;color:#111;direction:ltr;text-align:right">'+m.v+'</div>';
    h+='<div style="font-size:9px;color:#888;margin-top:2px">'+m.s+'</div>';
    h+='</div>';
  });
  h+='</div>';

  // Price ladder
  h+='<div style="font-size:10px;letter-spacing:0.12em;color:#C9A84C;font-weight:700;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e0e0e0">سلّم الأسعار</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px">';
  var arLadder=[
    {l:'سعر الاستغاثة',v:'AED '+val.distressPrice.toLocaleString(),c:'#10B981'},
    {l:'هدف الشراء الجيد',v:'AED '+val.goodPrice.toLocaleString(),c:'#10B981'},
    {l:'القيمة السوقية العادلة',v:'AED '+val.fairPrice.toLocaleString(),c:'#F59E0B'},
    {l:'مبالغ فيه فوق',v:'AED '+val.overpricedAt.toLocaleString(),c:'#EF4444'},
    {l:'السعر المطلوب',v:'AED '+(parseInt(f.price)||0).toLocaleString(),c:vColor},
    {l:'هدف التفاوض',v:val.suggestedOffer?'AED '+val.suggestedOffer.toLocaleString():'بالسعر المطلوب',c:'#C9A84C'}
  ];
  arLadder.forEach(function(item){
    h+='<div style="border:1px solid #e0e0e0;border-radius:6px;padding:8px 12px">';
    h+='<div style="font-size:8.5px;letter-spacing:0.08em;color:#888;margin-bottom:2px">'+item.l+'</div>';
    h+='<div style="font-size:14px;font-weight:700;color:'+item.c+';direction:ltr;text-align:right">'+item.v+'</div>';
    h+='</div>';
  });
  h+='</div>';

  // Mortgage section if available
  if(val.mortgage&&val.mortgage.monthly){
    h+='<div style="font-size:10px;letter-spacing:0.12em;color:#C9A84C;font-weight:700;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e0e0e0">بيانات الرهن العقاري</div>';
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">';
    h+='<div style="border:1px solid #e0e0e0;border-radius:6px;padding:10px 12px">';
    h+='<div style="font-size:8.5px;color:#888;margin-bottom:3px">القسط الشهري</div>';
    h+='<div style="font-size:15px;font-weight:700;color:#111;direction:ltr;text-align:right">AED '+val.mortgage.monthly.toLocaleString()+'</div></div>';
    h+='<div style="border:1px solid #e0e0e0;border-radius:6px;padding:10px 12px">';
    h+='<div style="font-size:8.5px;color:#888;margin-bottom:3px">إجمالي الفوائد</div>';
    h+='<div style="font-size:15px;font-weight:700;color:#111;direction:ltr;text-align:right">AED '+(val.mortgage.totalInterest||0).toLocaleString()+'</div></div>';
    h+='</div>';
  }

  // Footer
  h+='<div style="border-top:2px solid #C9A84C;padding-top:14px;margin-top:20px;text-align:center">';
  h+='<div style="font-size:11px;color:#555;line-height:1.8">تم إنشاء هذا التقرير بواسطة</div>';
  h+='<div style="font-size:16px;font-weight:800;margin:4px 0;font-family:Inter,sans-serif"><span style="color:#111">Dub</span><span style="color:#C9A84C">AI</span><span style="color:#111">Val</span></div>';
  h+='<div style="font-size:10px;color:#888">www.dubaival.com</div>';
  h+='<div style="font-size:8px;color:#aaa;margin-top:12px">تقرير تقييم معتمد على بيانات دائرة الأراضي والأملاك &bull; للاستخدام المهني فقط &bull; ليس نصيحة مالية &bull; '+dateStr+'</div>';
  h+='</div></div>';

  var printEl=document.getElementById('print-report');
  if(printEl){printEl.innerHTML=h;}
  var fontLink=document.createElement('link');
  fontLink.rel='stylesheet';
  fontLink.href='https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap';
  document.head.appendChild(fontLink);
  setTimeout(function(){
    window.print();
    setTimeout(function(){if(printEl)printEl.innerHTML='';},2000);
  },300);
}

// Update search suggestions without full re-render (keeps focus)
function updateSearchSuggestions(query){
  var suggestEl=document.getElementById("dv-search-suggestions");
  if(!suggestEl)return;
  if(!query||query.length<2){suggestEl.innerHTML="";return;}
  var q=query.toLowerCase().trim();
  var results=[];
  var qWords=q.split(" ").filter(function(w){return w.length>0;});
  
  // Score and search DB
  var scored=[];
  Object.entries(DB).forEach(function(e){
    var key=e[0],val=e[1];
    var score=0;
    var keyWords=key.split(" ");
    if(key.startsWith(q))score=100;
    else if(q.length<=2){
      // Short query: ONLY match if KEY starts with query
      if(keyWords[0].startsWith(q))score=90;
    } else if(qWords.every(function(w){return keyWords.some(function(kw){return kw.startsWith(w);});})){
      // All query words match START of some key word
      score=keyWords[0].startsWith(qWords[0])?85:70;
    } else if(q.length>=5&&qWords.every(function(w){return key.includes(w);}))score=20;
    if(score>0)scored.push({name:key,area:val.a,psf:val.p,g:val.g,sc:val.sc,score:score});
  });
  scored.sort(function(a,b){return b.score-a.score;});
  results=scored.slice(0,8);
  
  // Search CLUSTERS
  if(results.length<8){
    Object.entries(CLUSTERS).forEach(function(e){
      var community=e[0],clusters=e[1];
      var commLower=community.toLowerCase();
      var commWords=commLower.split(" ");
      if(commLower.startsWith(q)||(q.length>2&&qWords.every(function(w){return commWords.some(function(cw){return cw.startsWith(w);});}))){
        if(!results.some(function(r){return r.name===community;}))
          results.push({name:community,area:community,psf:null,g:null,type:"community",clusters:clusters,score:50});
      }
      clusters.forEach(function(c){
        if(results.length>=8)return;
        var cl=c.toLowerCase();
        if(cl.startsWith(q)||qWords[0]&&cl.startsWith(qWords[0])){
          results.push({name:c,area:community,psf:null,g:null,type:"cluster",score:70});
        }
      });
    });
  }

  if(results.length===0){suggestEl.innerHTML="";return;}
  
  var cl=C();
  suggestEl.innerHTML="";
  suggestEl.style.cssText="background:"+cl.surface+";border:1px solid "+cl.gold+";border-radius:12px;margin-top:4px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.4);position:absolute;width:100%;z-index:100;";
  
  results.forEach(function(r,i){
    var item=document.createElement("button");
    item.style.cssText="width:100%;padding:12px 16px;background:transparent;border:none;border-bottom:"+(i<results.length-1?"1px solid "+cl.border:"none")+";color:#F0F2F5;font-size:13px;cursor:pointer;text-align:left;font-family:'Inter',sans-serif;display:block;";
    var nameCap=r.name.split(" ").map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(" ");
    var typeLabel=r.type==="community"?" (Community)":r.type==="cluster"?" (Cluster)":"";
    var info=r.area+(r.psf?" · AED "+r.psf.toLocaleString()+" PSF":"")+(r.g?" · "+r.g:"")+(r.type==="community"&&r.clusters?" · "+r.clusters.length+" clusters":"");
    item.innerHTML="<div style='font-weight:600;margin-bottom:2px'>"+nameCap+typeLabel+"</div><div style='font-size:10px;color:"+cl.sub+";font-family:Space Grotesk,monospace'>"+info+"</div>";
    item.addEventListener("mouseenter",function(){this.style.background=cl.raised;});
    item.addEventListener("mouseleave",function(){this.style.background="transparent";});
    item.addEventListener("mousedown",function(e){
      e.preventDefault(); // Prevent input blur
      analyzerState.f.building=r.name;
      analyzerState.f.area=r.area||"";
      if(r.sc)analyzerState.f.serviceCharge=String(r.sc);
      if(r.type==="community"||r.type==="cluster"){
        analyzerState.f.propCategory="villa";if(!analyzerState.f.beds)analyzerState.f.beds="4 BR";
      } else {
        var n=r.name.toLowerCase();
        var isVA=typeof VILLA_AREAS!=="undefined"&&VILLA_AREAS.has(r.area);
        var isVK=typeof VILLA_KEYWORDS!=="undefined"&&VILLA_KEYWORDS.some(function(kw){return n.includes(kw);});
        analyzerState.f.propCategory=(isVA||isVK)?"villa":"apartment";
        if(analyzerState.f.propCategory==="villa"&&!analyzerState.f.beds)analyzerState.f.beds="4 BR";
      }
      suggestEl.innerHTML="";
      render();
    });
    suggestEl.appendChild(item);
  });
}


// ── ADMIN PANEL ───────────────────────────────────────────────────────────────
function renderAdmin(){
  var cl=C();
  var wrap=el("div",{style:{padding:"20px",maxWidth:"500px",margin:"0 auto"}});
  
  // Password check
  if(!window.ADMIN_UNLOCKED){
    var pwWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"24px",marginTop:"40px"}});
    pwWrap.appendChild(div({color:cl.gold,fontSize:"12px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"16px"},"◆ DubAIVal Admin"));
    var pwInp=el("input",{type:"password",placeholder:"Enter admin password",style:{width:"100%",background:"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:"#F0F2F5",padding:"12px",borderRadius:"8px",fontSize:"14px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"10px"}});
    var pwBtn=el("button",{style:{width:"100%",padding:"12px",background:"linear-gradient(135deg,#C9A84C,#7A5E28)",color:"#08090C",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
    pwBtn.textContent="Login";
    pwBtn.addEventListener("click",async function(){
      try{var enc=new TextEncoder();var buf=await crypto.subtle.digest("SHA-256",enc.encode(pwInp.value));
        var hash=Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,"0");}).join("");
        if(hash==="67ed667fed4620ba36c09d97b542b81c39a5f63bcbdfe8d1931c234748498fc1"){window.ADMIN_UNLOCKED=true;render();}
        else{pwInp.style.borderColor="#EF4444";pwInp.value="";}}catch(e){pwInp.style.borderColor="#EF4444";pwInp.value="";}
    });
    pwWrap.appendChild(pwInp);
    pwWrap.appendChild(pwBtn);
    wrap.appendChild(pwWrap);
    return wrap;
  }
  
  // Admin controls
  wrap.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"◆ Market Risk Controls"));
  wrap.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginBottom:"20px"},"Adjust market sentiment factors. Based on DLD weekly data."));
  
  function makeSlider(label, key, min, max, step, desc){
    var card=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"16px",marginBottom:"12px"}});
    var topRow=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}});
    topRow.appendChild(div({color:"#F0F2F5",fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},label));
    var valDisplay=el("div",{style:{color:cl.gold,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"}});
    var currentVal=MACRO_VARS[key];
    valDisplay.textContent=(currentVal>=0?"+":"")+Math.round(currentVal*100)+"%";
    topRow.appendChild(valDisplay);
    card.appendChild(topRow);
    card.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginBottom:"10px"},desc));
    var slider=el("input",{type:"range",min:String(min),max:String(max),step:String(step),value:String(currentVal),style:{width:"100%",accentColor:cl.gold}});
    slider.addEventListener("input",function(){
      var v=parseFloat(this.value);
      MACRO_VARS[key]=v;
      valDisplay.textContent=(v>=0?"+":"")+Math.round(v*100)+"%";
      valDisplay.style.color=v>0?cl.green:v<0?"#EF4444":cl.gold;
    });
    card.appendChild(slider);
    var rangeRow=el("div",{style:{display:"flex",justifyContent:"space-between"}});
    rangeRow.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},Math.round(min*100)+"%"));
    rangeRow.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},Math.round(max*100)+"%"));
    card.appendChild(rangeRow);
    return card;
  }
  
  wrap.appendChild(makeSlider("🏢 Apartment Adjustment","aptAdj",-0.08,0.05,0.01,"Effect on all apartment valuations. DLD data: -3% geo pressure, supply pipeline risk."));
  wrap.appendChild(makeSlider("🏡 Villa Adjustment","villaAdj",-0.05,0.08,0.01,"Effect on all villa valuations. DLD data: villas +16% YoY, end-user demand strong."));
  
  // Save button
  var saveBtn=el("button",{style:{width:"100%",padding:"14px",background:"linear-gradient(135deg,#C9A84C,#7A5E28)",color:"#08090C",border:"none",borderRadius:"10px",fontSize:"14px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer",marginTop:"8px"}});
  saveBtn.textContent="Save & Apply to All Valuations";
  saveBtn.addEventListener("click",async function(){
    saveBtn.textContent="Saving...";
    saveBtn.style.background="#4B5563";
    // Save to localStorage
    try{localStorage.setItem("dv_macro",JSON.stringify({aptAdj:MACRO_VARS.aptAdj,villaAdj:MACRO_VARS.villaAdj}));}catch(e){}
    // Save to Supabase
    var label=(MACRO_VARS.aptAdj<-0.03?"Cautious":MACRO_VARS.aptAdj<0?"Stable":"Bullish")+" · "+new Date().toLocaleDateString("en-GB");
    var ok=await saveSupabaseConfig(MACRO_VARS.aptAdj,MACRO_VARS.villaAdj,label);
    if(ok){
      saveBtn.textContent="✓ Saved to Cloud!";
      saveBtn.style.background="#10B981";
    } else {
      saveBtn.textContent="✓ Saved Locally";
      saveBtn.style.background="#F59E0B";
    }
    setTimeout(function(){saveBtn.textContent="Save & Apply to All Valuations";saveBtn.style.background="linear-gradient(135deg,#C9A84C,#7A5E28)";},3000);
  });
  wrap.appendChild(saveBtn);
  
  // Current effect preview
  var preview=el("div",{style:{background:cl.raised,borderRadius:"10px",padding:"14px",marginTop:"12px"}});
  preview.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Current Effect on Sample Properties"));
  var samples=[{n:"Blvd Heights 2BR f39",base:2163,floor:0.12,type:"apt"},{n:"Elie Saab AR3 4BR",base:1521,floor:0,type:"villa"},{n:"Marina Gate 2BR f20",base:2000,floor:0.025,type:"apt"}];
  samples.forEach(function(s){
    var adj=MACRO_VARS[s.type==="villa"?"villaAdj":"aptAdj"];
    var psf=Math.round(s.base*(1+s.floor+adj));
    var row=el("div",{style:{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+cl.border}});
    row.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},s.n));
    row.appendChild(span({color:cl.gold,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},"AED "+psf.toLocaleString()+" PSF"));
    preview.appendChild(row);
  });
  wrap.appendChild(preview);

  // -- ERROR LOG (System Monitoring) --
  var logCard=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginTop:"16px"}});
  logCard.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"◆ System Diagnostics · Error Log"));
  var logStats=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}});
  var noAreaCount=DV_ERROR_LOG.filter(function(e){return e.type==="no_area";}).length;
  var fallbackCount=DV_ERROR_LOG.filter(function(e){return e.type==="fallback";}).length;
  var areaOnlyCount=DV_ERROR_LOG.filter(function(e){return e.type==="area_only";}).length;
  [{l:"No Area Match",v:noAreaCount,c:noAreaCount>0?"#EF4444":cl.green},{l:"Building Fallback",v:fallbackCount,c:fallbackCount>5?"#F59E0B":cl.green},{l:"Area-Only Est.",v:areaOnlyCount,c:areaOnlyCount>10?"#F59E0B":cl.green}].forEach(function(s){
    logStats.appendChild(div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[
      div({color:s.c,fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},String(s.v)),
      div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},s.l)
    ]));
  });
  logCard.appendChild(logStats);
  var logList=el("div",{style:{maxHeight:"200px",overflowY:"auto"}});
  var recentLogs=DV_ERROR_LOG.slice(-20).reverse();
  if(!recentLogs.length)logList.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",textAlign:"center",padding:"16px"},"No errors logged yet — system running smoothly"));
  recentLogs.forEach(function(entry){
    var row=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid "+cl.border}});
    var typColor=entry.type==="no_area"?"#EF4444":entry.type==="fallback"?"#F59E0B":"#60A5FA";
    row.appendChild(span({color:typColor,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",background:"rgba(255,255,255,0.05)",padding:"2px 6px",borderRadius:"8px"},entry.type));
    row.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",flex:"1",marginLeft:"8px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},entry.detail));
    row.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},new Date(entry.ts).toLocaleTimeString()));
    logList.appendChild(row);
  });
  logCard.appendChild(logList);
  var clearBtn=el("button",{style:{marginTop:"10px",padding:"8px 16px",background:cl.raised,border:"1px solid "+cl.border,color:cl.sub,borderRadius:"8px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  clearBtn.textContent="Clear Log";
  clearBtn.onclick=function(){DV_ERROR_LOG.length=0;try{localStorage.removeItem("dv_error_log");}catch(e){}render();};
  logCard.appendChild(clearBtn);
  wrap.appendChild(logCard);

  // -- DATA COVERAGE REPORT --
  var covCard=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginTop:"12px"}});
  covCard.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"◆ Data Coverage"));
  var dbSize=Object.keys(DB).length;
  var areaSize=Object.keys(AREAS).length;
  var dynCount=Object.keys(DYNAMIC_BENCHMARKS).length;
  var calCount=Object.keys(AVM_CALIBRATION).filter(function(k){return AVM_CALIBRATION[k].sample_count>=3;}).length;
  [{l:"Buildings in DB",v:dbSize.toLocaleString(),pct:100},{l:"Areas Covered",v:areaSize,pct:100},{l:"Dynamic Benchmarks",v:dynCount+"/"+areaSize,pct:Math.round(dynCount/areaSize*100)},{l:"Calibrated Areas",v:calCount+"/"+areaSize,pct:Math.round(calCount/areaSize*100)}].forEach(function(d){
    var row=el("div",{style:{marginBottom:"8px"}});
    row.appendChild(div({display:"flex",justifyContent:"space-between",marginBottom:"3px"},[
      span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},d.l),
      span({color:cl.gold,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},d.v)
    ]));
    row.appendChild(div({height:"4px",background:cl.border,borderRadius:"2px",overflow:"hidden"},[
      div({height:"100%",width:d.pct+"%",background:d.pct>=80?"#10B981":d.pct>=40?"#F59E0B":"#EF4444",borderRadius:"2px"})
    ]));
    covCard.appendChild(row);
  });
  wrap.appendChild(covCard);

  return wrap;
}

function render(){
  // Show loading if DB not ready
  if(!DB_LOADED){
    const app=document.getElementById('app');
    if(app&&(!app.innerHTML||app.innerHTML.indexOf('loading')>-1)){
      app.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#070B14;gap:16px"><div style="width:40px;height:40px;border-radius:50%;border:2px solid #1C2030;border-top-color:#C9A84C;animation:spin 0.8s linear infinite"></div><div style="color:#4B5563;font-size:12px;font-family:Space Grotesk,monospace;letter-spacing:0.1em">LOADING DATABASE...</div></div>';
    }
    return;
  }
  document.documentElement.dir=isRTL()?"rtl":"ltr";
  document.documentElement.lang=isRTL()?"ar":"en";
  if(isRTL())document.body.style.fontFamily="Cairo,'Space Grotesk',monospace";
  else document.body.style.fontFamily="";
  const cl=C();
  const app=document.getElementById("app");
  app.innerHTML="";
  app.style.background=cl.bg;app.style.minHeight="100vh";app.style.color=cl.white;app.style.overflowX="hidden";app.style.maxWidth="100vw";

  // Inject global keyframes
  if(!document.getElementById("dvGlobalStyles")){
    var gs=document.createElement("style");gs.id="dvGlobalStyles";
    gs.textContent="@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)}70%{box-shadow:0 0 0 10px rgba(201,168,76,0)}100%{box-shadow:0 0 0 0 rgba(201,168,76,0)}}";
    document.head.appendChild(gs);
  }

  // Ticker
  const tickerItems=["Q1 2026: AED 252B · +31%","Villa PSF +16% YoY","Foreign Capital AED 148B","JVC Yield 9.5%","87% Cash Purchases","Off-Plan 77.8%","Buyer Window: 3-6 Months","May: AED 14B+/week","Q1 2026: AED 252B · +31%","Villa PSF +16% YoY","Foreign Capital AED 148B","JVC Yield 9.5%"];
  const tickerInner=div({display:"flex",gap:"56px",whiteSpace:"nowrap",animation:"ticker 32s linear infinite",fontFamily:"'Space Grotesk',monospace",fontSize:"10.5px",color:"#070B14",fontWeight:"700"},tickerItems.map(function(t){return span({},"\u25C6 "+t)}));
  app.appendChild(div({background:cl.gold,overflow:"hidden",padding:"4px 0"},[tickerInner]));

  // Header
  const header=div({background:cl.surface,borderBottom:"1px solid "+cl.border,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:"54px",position:"sticky",top:"0",zIndex:"100"},[
    div({display:"flex",alignItems:"center",gap:"10px"},[
      el("img",{src:"logo.png",alt:"dAIv",style:{width:"36px",height:"36px",borderRadius:"7px",flexShrink:"0",objectFit:"contain"}}),
      div({},[div({fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",color:"#fff"},"DubAIVal"),div({color:cl.goldDim,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},t("hdr_subtitle"))])
    ]),
    div({display:"flex",alignItems:"center",gap:"8px"},[
      div({display:"flex",alignItems:"center",gap:"5px",background:cl.greenBg,border:"1px solid "+cl.greenBo,borderRadius:"20px",padding:"4px 10px"},[div({width:"5px",height:"5px",borderRadius:"50%",background:cl.green,animation:"pulse 2s infinite",flexShrink:"0"}),(function(){var lb=el("span",{style:{color:cl.green,fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace"}});lb.textContent=LIVE_GEO.fetched?"LIVE ·"+LIVE_GEO.trend:"LIVE";return lb;})()]),
      el("button",{style:{background:cl.raised,border:"1px solid "+cl.border,borderRadius:"20px",padding:"5px 10px",cursor:"pointer",color:cl.sub,fontSize:"14px"},onclick:function(){darkMode=!darkMode;render();}},darkMode?"☀️":"🌙"),
      el("button",{style:{background:isRTL()?hexAlpha("#3B82F6",0.12):"transparent",border:"1px solid "+(isRTL()?"rgba(59,130,246,0.3)":cl.border),borderRadius:"20px",padding:"4px 10px",cursor:"pointer",color:isRTL()?"#3B82F6":cl.sub,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},onclick:function(){setLang(dvLang==="ar"?"en":"ar");}},dvLang==="ar"?"EN":"عر"),
      // Notification bell
      renderNotifBell(),
      // Auth button
      renderAuthButton(),
      // Profile button
      (function(){
        var pb=el("button",{style:{background:showProfilePanel?cl.goldFaint:"transparent",border:"1px solid "+(showProfilePanel?cl.gold:cl.border),borderRadius:"20px",padding:"5px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:"5px",color:showProfilePanel?cl.gold:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace",marginLeft:"4px"}});
        var typeIcons={income:"💰",growth:"📈",flip:"🔄",enduse:"🏠"};
        pb.textContent=(typeIcons[USER_PROFILE.investorType]||"👤")+" Profile";
        pb.addEventListener("click",function(){showProfilePanel=!showProfilePanel;render();});
        return pb;
      })(),
    ])
  ]);
  app.appendChild(header);

  // Profile Panel (slide down)
  if(showProfilePanel){
    var panel=el("div",{style:{background:cl.surface,borderBottom:"1px solid "+cl.border,padding:"16px 20px"}});
    var pGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:"16px",maxWidth:"800px",margin:"0 auto"}});

    // Investor Type
    var typeBox=el("div",{});
    typeBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Investor Type"));
    var typeGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}});
    [{k:"income",l:"Rental Income",ic:"💰"},{k:"growth",l:"Capital Growth",ic:"📈"},{k:"flip",l:"Flip / Resale",ic:"🔄"},{k:"enduse",l:"End Use",ic:"🏠"}].forEach(function(p){
      var active=USER_PROFILE.investorType===p.k;
      var b=el("button",{style:{padding:"7px 8px",borderRadius:"7px",fontSize:"11px",border:"1px solid "+(active?cl.gold:cl.border),background:active?cl.goldFaint:"transparent",color:active?"#F0F2F5":cl.sub,fontFamily:"'Inter',sans-serif",cursor:"pointer",textAlign:"left"}});
      b.textContent=p.ic+" "+p.l;
      b.addEventListener("click",function(){USER_PROFILE.investorType=p.k;saveProfile();render();});
      typeGrid.appendChild(b);
    });
    typeBox.appendChild(typeGrid);
    pGrid.appendChild(typeBox);

    // Risk Tolerance
    var riskBox=el("div",{});
    riskBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Risk Tolerance"));
    var riskGrid=el("div",{style:{display:"flex",flexDirection:"column",gap:"5px"}});
    [{k:"conservative",l:"Conservative",ic:"🛡"},{k:"moderate",l:"Moderate",ic:"⚖️"},{k:"aggressive",l:"Aggressive",ic:"🚀"}].forEach(function(r){
      var active=USER_PROFILE.risk===r.k;
      var b=el("button",{style:{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",border:"1px solid "+(active?cl.gold:cl.border),background:active?cl.goldFaint:"transparent",color:active?"#F0F2F5":cl.sub,fontFamily:"'Inter',sans-serif",cursor:"pointer",textAlign:"left"}});
      b.textContent=r.ic+" "+r.l;
      b.addEventListener("click",function(){USER_PROFILE.risk=r.k;saveProfile();render();});
      riskGrid.appendChild(b);
    });
    riskBox.appendChild(riskGrid);
    pGrid.appendChild(riskBox);

    // Budget Range
    var budgetBox=el("div",{});
    budgetBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Budget Range (AED)"));
    var bRow=el("div",{style:{display:"flex",gap:"8px",alignItems:"center"}});
    var bMin=el("input",{type:"number",placeholder:"Min",style:{flex:"1",background:"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:"#F0F2F5",padding:"7px 10px",borderRadius:"7px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",minWidth:"0"}});
    bMin.value=USER_PROFILE.budgetMin?USER_PROFILE.budgetMin.toLocaleString():"";
    bMin.addEventListener("change",function(){USER_PROFILE.budgetMin=parseInt(this.value.replace(/,/g,""))||0;saveProfile();});
    var bMax=el("input",{type:"number",placeholder:"Max",style:{flex:"1",background:"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:"#F0F2F5",padding:"7px 10px",borderRadius:"7px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",minWidth:"0"}});
    bMax.value=USER_PROFILE.budgetMax?USER_PROFILE.budgetMax.toLocaleString():"";
    bMax.addEventListener("change",function(){USER_PROFILE.budgetMax=parseInt(this.value.replace(/,/g,""))||0;saveProfile();});
    bRow.appendChild(bMin);
    bRow.appendChild(span({color:cl.sub,fontSize:"12px"},"–"));
    bRow.appendChild(bMax);
    budgetBox.appendChild(bRow);
    pGrid.appendChild(budgetBox);

    // Name
    var nameBox=el("div",{});
    nameBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Your Name (optional)"));
    var nameInp=el("input",{type:"text",placeholder:"e.g. Ahmed Al Mansouri",style:{width:"100%",background:"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:"#F0F2F5",padding:"7px 10px",borderRadius:"7px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
    nameInp.value=USER_PROFILE.name||"";
    nameInp.addEventListener("input",function(){USER_PROFILE.name=this.value;saveProfile();});
    nameBox.appendChild(nameInp);
    pGrid.appendChild(nameBox);

    panel.appendChild(pGrid);

    // Profile summary bar
    var summary=el("div",{style:{display:"flex",gap:"10px",flexWrap:"wrap",marginTop:"12px",paddingTop:"10px",borderTop:"1px solid "+cl.border,maxWidth:"800px",margin:"12px auto 0"}});
    var typeLabels={income:"Rental Income",growth:"Capital Growth",flip:"Flip / Resale",enduse:"End Use"};
    var riskLabels={conservative:"Conservative",moderate:"Moderate",aggressive:"Aggressive"};
    [{l:"Type",v:typeLabels[USER_PROFILE.investorType]||"Not set"},{l:"Risk",v:riskLabels[USER_PROFILE.risk]||"Moderate"},{l:"Budget",v:USER_PROFILE.budgetMax?"Up to AED "+(USER_PROFILE.budgetMax/1000000).toFixed(1)+"M":"Not set"}].forEach(function(item){
      var chip=el("div",{style:{background:cl.goldFaint,border:"1px solid "+cl.goldDim,borderRadius:"20px",padding:"3px 12px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",color:cl.gold}});
      chip.textContent=item.l+": "+item.v;
      summary.appendChild(chip);
    });
    panel.appendChild(summary);
    app.appendChild(panel);
  }

  // Nav
  const tabs=[{id:"Market",icon:"📊",lk:"tab_market"},{id:"Index",icon:"📈",lk:"tab_index"},{id:"Analyzer",icon:"🔍",lk:"tab_analyzer"},{id:"Map",icon:"🗺️",lk:"tab_map"},{id:"Find",icon:"🔎",lk:"tab_find"},{id:"Deals",icon:"🤝",lk:"tab_deals"},{id:"Social",icon:"🎬",lk:"tab_social"},{id:"Compare",icon:"⚖️",lk:"tab_compare"},{id:"Portfolio",icon:"💼",lk:"tab_portfolio"},{id:"Alerts",icon:"🔔",lk:"tab_alerts"},{id:"Chat",icon:"💬",lk:"tab_chat"},{id:"Workspace",icon:"🛠️",lk:"tab_workspace"},{id:"About",icon:"ℹ️",lk:"tab_about"}];
  const nav=div({background:cl.surface,borderBottom:"1px solid "+cl.border,display:"flex",overflowX:"auto",padding:"0 20px"},
    tabs.map(function(tab){
      const active=currentTab===tab.id;
      return el("button",{style:{background:"transparent",border:"none",borderBottom:"2px solid "+(active?cl.gold:"transparent"),color:active?cl.gold:cl.sub,padding:"11px 14px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",fontSize:"12.5px",fontWeight:active?"700":"400",whiteSpace:"nowrap"},onclick:function(){currentTab=tab.id;render();}},tab.icon+" "+t(tab.lk));
    })
  );
  app.appendChild(nav);

  const content=div({className:"tab-content"});
  // Check URL for admin access
  if(!window._adminHashChecked&&window.location.hash==="#admin"&&currentTab!=="Admin"){currentTab="Admin";window._adminHashChecked=true;}
  
  if(currentTab==="Market")content.appendChild(renderMarket());
  else if(currentTab==="Index")content.appendChild(renderMarketIndex());
  else if(currentTab==="Analyzer")content.appendChild(renderAnalyzer());
  else if(currentTab==="Map")content.appendChild(renderMap());
  else if(currentTab==="Find")content.appendChild(renderFind());
  else if(currentTab==="Deals")content.appendChild(renderDeals());
  else if(currentTab==="Admin")content.appendChild(renderAdmin());
  else if(currentTab==="Social")content.appendChild(renderSocial());
  else if(currentTab==="Compare")content.appendChild(renderCompare());
  else if(currentTab==="Portfolio")content.appendChild(renderPortfolio());
  else if(currentTab==="Alerts")content.appendChild(renderAlerts());
  else if(currentTab==="Chat")content.appendChild(renderChat());
  else if(currentTab==="Workspace")content.appendChild(renderWorkspace());
  else if(currentTab==="About")content.appendChild(renderAbout());
  app.appendChild(content);

  app.appendChild(div({borderTop:"1px solid "+cl.border,padding:"10px 20px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"4px"},[
    span({color:cl.sub,fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace"},t("footer_tag")),
    span({color:cl.sub,fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace"},t("not_advice")),
  ]));

  // Auth modal overlay
  var authModal=renderAuthModal();
  if(authModal)app.appendChild(authModal);

  // Auto-valuate from shared URL
  if(window._autoValuate&&analyzerState.f.area&&analyzerState.f.price){
    window._autoValuate=false;
    currentTab="Analyzer";
    try{analyzerState.val=computeValuation(analyzerState.f);analyzerState.stage=2;}catch(e){}
    setTimeout(render,50);
  }

  // Interactive tour for first-time users
  checkTourOnLoad();
}

