// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- RENDER -------------------------------------------------------------------
var _sentimentCache={};
async function fetchMarketSentiment(area){
  if(_sentimentCache[area]&&Date.now()-_sentimentCache[area].ts<3600000)return _sentimentCache[area].data;
  try{
    var rows=await fetchPriceHistory(area,180);
    if(rows&&rows.length>=2){
      var first=rows[0].psf,last=rows[rows.length-1].psf;
      if(first>0){
        var chg=parseFloat(((last-first)/first*100).toFixed(1));
        var s=chg>3?"bull":chg<-3?"bear":"neutral";
        var result={chg:chg,s:s,source:"dld",points:rows.length};
        _sentimentCache[area]={data:result,ts:Date.now()};
        return result;
      }
    }
  }catch(e){}
  try{
    var ld=await fetchLiveData("",area,"2 BR");
    if(ld&&ld.sales&&ld.sales.length>=3){
      var sorted=ld.sales.slice().sort(function(a,b){return a.psf-b.psf;});
      var mid=sorted[Math.floor(sorted.length/2)].psf;
      var areaData=AREAS[area];
      if(areaData&&areaData.psf>0){
        var chg2=parseFloat(((mid-areaData.psf)/areaData.psf*100).toFixed(1));
        var s2=chg2>5?"bull":chg2<-5?"bear":"neutral";
        var result2={chg:chg2,s:s2,source:"live",points:ld.sales.length};
        _sentimentCache[area]={data:result2,ts:Date.now()};
        return result2;
      }
    }
  }catch(e){}
  return null;
}
// --- DEAL ALERTS ---
function renderFind(){
  const cl=C();
  const wrap=el("div",{style:{padding:"16px",maxWidth:"640px",margin:"0 auto"}});

  wrap.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Property Search"));
  wrap.appendChild(div({color:cl.sub,fontSize:"12px",marginBottom:"16px",fontFamily:"'Inter',sans-serif"},"Tell DubAIVal what you're looking for. AI searches Bayut, PropertyFinder & market data."));

  if(!window.FIND_STATE)window.FIND_STATE={area:"",building:"",beds:"2 BR",maxPrice:"",minYield:"",type:"Apartment",query:"",results:[],loading:false,searched:false,sort:"score",
    sf:{area:"",grade:"",minYield:"",maxPSF:"",minPSF:"",minGrowth:"",maxDOM:"",minTurnover:"",type:"Apartment",beds:"Any",sort:"yield",showResults:false,results:[]}
  };
  var FS=window.FIND_STATE;

  // Build area and building name lists for autocomplete
  var _areaNames=Object.keys(AREAS).sort();
  var _bldgNames=Object.keys(DB).sort();

  // Natural language search
  const nlWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"}});
  nlWrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Ask in Natural Language"));
  const nlRow=el("div",{style:{display:"flex",gap:"8px"}});
  const nlInp=el("input",{type:"text",placeholder:"e.g. 2BR under 2M in JVC with 7%+ yield, or furnished studio near metro...",style:{flex:"1",background:cl.raised||"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:cl.white,padding:"11px 14px",borderRadius:"10px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none"}});
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

  // Area — smart autocomplete
  const aBox=el("div",{}); aBox.appendChild(lbl("Area"));
  aBox.appendChild(mkAuto(S(),_areaNames,FS.area,function(v){FS.area=v;},"Type area name..."));
  filterGrid.appendChild(aBox);

  // Building — smart autocomplete
  const bldgBox=el("div",{}); bldgBox.appendChild(lbl("Building"));
  bldgBox.appendChild(mkAuto(S(),_bldgNames,FS.building,function(v){FS.building=v;},"Type building name..."));
  filterGrid.appendChild(bldgBox);

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

  // Sort By
  const sBox=el("div",{}); sBox.appendChild(lbl("Sort By"));
  sBox.appendChild(mkSelect(S(),["Best Deal Score","Lowest PSF","Lowest Price","Highest PSF","Newest"],FS.sort==="psf_asc"?"Lowest PSF":FS.sort==="price_asc"?"Lowest Price":FS.sort==="psf_desc"?"Highest PSF":FS.sort==="newest"?"Newest":"Best Deal Score",function(v){FS.sort={"Best Deal Score":"score","Lowest PSF":"psf_asc","Lowest Price":"price_asc","Highest PSF":"psf_desc","Newest":"newest"}[v]||"score";}));
  filterGrid.appendChild(sBox);

  filterWrap.appendChild(filterGrid);

  const filterBtn=el("button",{style:{width:"100%",padding:"11px",borderRadius:"8px",border:"none",background:"linear-gradient(135deg,#C9A84C,#7A5E28)",color:"#08090C",fontSize:"13px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
  filterBtn.textContent="Find Properties";
  filterBtn.addEventListener("click",function(){doSearch();});
  filterWrap.appendChild(filterBtn);
  wrap.appendChild(filterWrap);

  // Smart Discovery Filter — searches buildings by financial criteria
  var sf=FS.sf;
  var sfCard=el("div",{style:{background:cl.surface,border:"1px solid "+(sf.showResults?cl.goldDim:cl.border),borderRadius:"14px",padding:"18px",marginBottom:"14px",position:"relative",overflow:"hidden"}});
  sfCard.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,#6366F1,#6366F1,transparent)",animation:"shimmer 3s ease infinite"}));
  sfCard.appendChild(span({color:"#818CF8",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"◆ Smart Property Discovery"));
  sfCard.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",display:"block",marginBottom:"14px"},"Filter "+Object.keys(DB).length.toLocaleString()+" buildings by yield, growth, price, liquidity & more"));

  var sfG1=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"10px"});
  var sfArea=div({});sfArea.appendChild(lbl("Area"));sfArea.appendChild(mkAuto(Object.assign({},S(),{fontSize:"11px",padding:"7px 8px"}),_areaNames,sf.area,function(v){sf.area=v;},"All Areas"));sfG1.appendChild(sfArea);
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
      var aData=AREAS[bData.a]||{psf:1800,sc:15,y:[5,7],g:[3,9,16],dom:60,txVol:100};
      var _vdb=typeof VALUATION_DB!=="undefined"&&VALUATION_DB[key]?VALUATION_DB[key]:null;
      var _psf=_vdb?_vdb.p:bData.p;
      if(_psf<minP||_psf>maxP)return;
      var yi=aData.y||[5,7];var avgYield=(yi[0]+yi[1])/2;
      if(avgYield<minY)return;
      var gr=aData.g||[3,9,16];
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
      var netYield=avgYield-((bData.sc||aData.sc||15)/_psf*100);
      var totalReturn=netYield+gr[1]/3;
      var prRatio=avgYield>0?(100/avgYield):20;
      var signal=prRatio<15?"Undervalued":prRatio<20?"Fair Value":prRatio<25?"Elevated":"Overheated";
      results.push({name:key,area:bData.a,psf:_psf,lo:_vdb?_vdb.lo:bData.lo,hi:_vdb?_vdb.hi:bData.hi,sc:bData.sc||aData.sc||15,grade:bData.g||"N/A",yield:avgYield,netYield:netYield,growth3:gr[1],dom:dom,txVol:txVol,turnover:turnover,totalReturn:totalReturn,signal:signal});
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
      box.appendChild(span({color:item.c,fontSize:"13px",fontWeight:"700",fontFamily:"'JetBrains Mono',monospace",fontFeatureSettings:"'tnum'"},item.v));
      sfStats.appendChild(box);
    });
    sfResCard.appendChild(sfStats);
    sf.results.forEach(function(r,idx){
      var sigColor=r.signal==="Undervalued"||r.signal==="Fair Value"?cl.green:r.signal==="Elevated"?cl.yellow:cl.red;
      var row=el("div",{style:{background:cl.raised,backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",borderRadius:"12px",padding:"12px 14px",marginBottom:"6px",cursor:"pointer",border:"1px solid "+cl.border,transition:"border-color 0.2s ease,transform 0.2s ease,box-shadow 0.2s ease"},onclick:function(){
        if(window.analyzerState){analyzerState.f.building=r.name;analyzerState.f.area=r.area;analyzerState.stage=0;}
        setSection("Market","Analyzer");
      }});
      row.addEventListener("mouseenter",function(){this.style.borderColor=cl.goldDim;this.style.transform="translateX(4px)";this.style.boxShadow="0 2px 10px rgba(212,175,55,0.06)";});
      row.addEventListener("mouseleave",function(){this.style.borderColor=cl.border;this.style.transform="translateX(0)";this.style.boxShadow="none";});
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
      resWrap.appendChild(div({background:cl.goldFaint,border:"1px solid "+cl.goldDim,borderRadius:"8px",padding:"10px 14px",marginBottom:"12px",color:cl.white,fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6"},FS.aiSummary));
    }

    FS.results.forEach(function(r,i){
      var card=el("div",{style:{background:cl.raised,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",borderRadius:"14px",padding:"14px",marginBottom:"10px",border:"1px solid "+cl.border,transition:"border-color 0.2s ease,transform 0.2s ease,box-shadow 0.2s ease",cursor:"pointer",boxShadow:"0 2px 16px rgba(0,0,0,0.15)"}});
      card.addEventListener("mouseenter",function(){card.style.borderColor="rgba(212,175,55,0.3)";card.style.transform="translateY(-2px)";card.style.boxShadow="0 8px 30px rgba(0,0,0,0.3),0 0 16px rgba(212,175,55,0.04)";});
      card.addEventListener("mouseleave",function(){card.style.borderColor=cl.border;card.style.transform="translateY(0)";card.style.boxShadow="0 2px 16px rgba(0,0,0,0.15)";});
      
      // Photo + Title row
      var topRow=el("div",{style:{display:"flex",gap:"12px",marginBottom:"10px"}});
      if(r.photo){
        var img=el("img",{style:{width:"80px",height:"60px",borderRadius:"8px",objectFit:"cover",flexShrink:"0"}});
        img.src=r.photo;
        img.onerror=function(){this.style.display="none";};
        topRow.appendChild(img);
      }
      var titleBlock=el("div",{style:{flex:"1",minWidth:"0"}});
      var titleEl=el("div",{style:{color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Inter',sans-serif",marginBottom:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}});
      titleEl.textContent=r.title||r.name||"Property";
      titleBlock.appendChild(titleEl);
      titleBlock.appendChild(div({color:cl.gold,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+(r.price?(r.price/1e6).toFixed(2)+"M":"—")));
      if(r.source){
        var srcBadge2=el("span",{style:{background:r.source==="PropertyFinder"?"rgba(0,120,255,0.15)":"rgba(255,80,0,0.15)",border:"1px solid "+(r.source==="PropertyFinder"?"rgba(0,120,255,0.4)":"rgba(255,80,0,0.4)"),color:r.source==="PropertyFinder"?"#4da6ff":"#ff8040",padding:"1px 7px",borderRadius:"20px",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginLeft:"6px"}});
        srcBadge2.textContent=r.source;
        titleBlock.appendChild(srcBadge2);
      }
      titleBlock.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},(r.area||"")+(r.size?" · "+Math.round(r.size).toLocaleString()+" sqft":"")+(r.beds?" · "+r.beds+"BR":"")));
      topRow.appendChild(titleBlock);
      card.appendChild(topRow);
      
      // Deal Score + PSF + Permit row
      var metaRow=el("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"8px"}});
      if(r.dealScore!==undefined){
        var dsColor=r.dealScore>=75?"#22C55E":r.dealScore>=55?"#EAB308":"#EF4444";
        var dsLabel=r.dealScore>=80?"Excellent":r.dealScore>=65?"Good":r.dealScore>=50?"Fair":"Below Avg";
        metaRow.appendChild(el("span",{style:{background:hexAlpha(dsColor,0.12),border:"1px solid "+hexAlpha(dsColor,0.4),color:dsColor,padding:"2px 8px",borderRadius:"20px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"}},r.dealScore+"/100 "+dsLabel));
      }
      if(r.grade){
        metaRow.appendChild(el("span",{style:{background:cl.goldFaint,border:"1px solid "+cl.goldDim,color:cl.gold,padding:"2px 8px",borderRadius:"20px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"}},"Grade: "+r.grade));
      }
      if(r.psf)metaRow.appendChild(el("span",{style:{background:"rgba(201,168,76,0.1)",border:"1px solid "+cl.goldDim,color:cl.gold,padding:"2px 8px",borderRadius:"20px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"}},"PSF: AED "+r.psf.toLocaleString()));
      if(r.permit)metaRow.appendChild(el("span",{style:{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.4)",color:cl.green,padding:"2px 8px",borderRadius:"20px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"}},"Permit: "+r.permit));
      if(r.furnished)metaRow.appendChild(el("span",{style:{background:cl.raised,border:"1px solid "+cl.border,color:cl.sub,padding:"2px 8px",borderRadius:"20px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"}},r.furnished));
      if(r.estYield)metaRow.appendChild(el("span",{style:{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.4)",color:"#10B981",padding:"2px 8px",borderRadius:"20px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"}},"Yield ~"+r.estYield+"%"));
      if(r.growth)metaRow.appendChild(el("span",{style:{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.4)",color:"#3B82F6",padding:"2px 8px",borderRadius:"20px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"}},"+"+r.growth+"% 1yr"));
      card.appendChild(metaRow);

      // Agent info
      if(r.agentName||r.agencyName){
        var agentRow=el("div",{style:{display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:"8px",marginBottom:"8px"}});
        var agentInfo=el("div",{style:{flex:"1"}});
        agentInfo.appendChild(div({color:cl.white,fontSize:"11px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},r.agentName||r.agencyName));
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
      if(r.listingUrl||r.bayutUrl||r.pfUrl){
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
        analyzerState.f.size=r.size?String(Math.round(r.size)):"";
        analyzerState.f.price=r.price?String(r.price):"";
        analyzerState.f.furnished=r.furnished||"Unfurnished";
        analyzerState.f.floor=r.floor?String(r.floor):"";
        analyzerState.f.propCategory=(r.type&&(r.type.toLowerCase().includes("villa")||r.type.toLowerCase().includes("townhouse")))?"villa":"apartment";
        analyzerState.stage=0;
        setSection("Market","Analyzer");
        window.scrollTo(0,0);
      });
      btnRow.appendChild(anaBtn);
      card.appendChild(btnRow);
      resWrap.appendChild(card);
    });
    // Load More button
    if(FS.hasMore){
      var loadMoreBtn=el("button",{style:{width:"100%",padding:"12px",borderRadius:"10px",border:"1px solid "+cl.goldDim,background:"transparent",color:cl.gold,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",marginTop:"10px",letterSpacing:"0.06em"}});
      loadMoreBtn.textContent=FS.loadingMore?"Loading...":"Load More Listings";
      loadMoreBtn.addEventListener("click",function(){
        if(FS.loadingMore)return;
        FS.page=(FS.page||0)+1;
        doSearch(true);
      });
      resWrap.appendChild(loadMoreBtn);
    }
    // Source summary
    var bayutCount=FS.results.filter(function(r){return r.source==="Bayut";}).length;
    var pfCount=FS.results.filter(function(r){return r.source==="PropertyFinder";}).length;
    var aiCount=FS.results.filter(function(r){return r.source==="AI Estimate";}).length;
    var srcParts=[];
    if(bayutCount>0)srcParts.push("Bayut: "+bayutCount);
    if(pfCount>0)srcParts.push("PropertyFinder: "+pfCount);
    if(aiCount>0)srcParts.push("AI: "+aiCount);
    if(srcParts.length>0){
      resWrap.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",textAlign:"center",marginTop:"8px",opacity:"0.6"},srcParts.join(" · ")));
    }
    wrap.appendChild(resWrap);
  }

  async function doSearch(loadMore){
    var query=FS.query||"";
    var area=FS.area||"";
    var beds=FS.beds||"";
    var maxPrice=parseInt(FS.maxPrice)||0;
    var type=FS.type||"Apartment";

    if(!loadMore){
      FS.loading=true;FS.results=[];FS.searched=false;FS.aiSummary="";FS.page=0;FS.hasMore=false;
    }else{
      FS.loadingMore=true;
    }
    render();

    try{
      var bedsNumMap={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5};
      var bn=bedsNumMap[beds]||2;
      var searchTerm=query||(area?area:"Dubai");
      var pageNum=FS.page||0;

      // Fetch Bayut + PropertyFinder in parallel
      var bayutResults=[];
      var pfResults=[];
      var locId=await getUAELocationId(searchTerm);
      if(!locId&&area)locId=await getUAELocationId(area);

      var bayutP=async function(){
        if(!locId)return[];
        var params=new URLSearchParams({locationExternalIDs:locId,purpose:"for-sale",hitsPerPage:"25",page:String(pageNum)});
        if(beds){params.set("rooms_min",String(bn));params.set("rooms_max",String(bn));}
        if(maxPrice>0)params.set("priceMax",String(maxPrice));
        var r;
        if(UAE_RE_KEY){r=await fetch("https://"+UAE_RE_HOST+"/properties/list?"+params,{headers:{"x-rapidapi-key":UAE_RE_KEY,"x-rapidapi-host":UAE_RE_HOST}});}
        else{r=await fetch(API_BASE+"/proxy-rapidapi?endpoint=properties/list&"+params);}
        if(!r.ok)return[];
        var d=await r.json();
        var hits=d.hits||[];
        FS.hasMore=hits.length>=25;
        return hits.filter(function(p){return p.price&&p.area;}).map(function(p){
          var psf=p.area>0?Math.round(p.price/p.area):0;
          var locName=p.location&&p.location.length>0?p.location[p.location.length-1].name:(area||"Dubai");
          var imgs=p.coverPhoto?[p.coverPhoto.url]:(p.photos||[]).map(function(ph){return ph.url||"";});
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
            photo:imgs[0]||"",
            listingUrl:p.externalURL||"https://www.bayut.com",
            listingSource:"Bayut",
            source:"Bayut"
          };
        }).filter(function(p){return p.psf>200&&p.psf<20000;});
      };

      var pfP=async function(){
        if(pageNum>0)return[];
        try{
          var pfLocId=await getPFLocationId((area||searchTerm)+" Dubai");
          if(!pfLocId)return[];
          var params=new URLSearchParams({location_id:String(pfLocId),page:"1"});
          if(beds)params.set("bedrooms",String(bn));
          var r;
          if(UAE_RE_KEY){r=await fetch("https://"+PF_HOST+"/search-sale?"+params,{headers:{"x-rapidapi-key":UAE_RE_KEY,"x-rapidapi-host":PF_HOST}});}
          else{r=await fetch(API_BASE+"/proxy-rapidapi?endpoint=search-sale&source=pf&"+params);}
          if(!r.ok)return[];
          var d=await r.json();
          var items=d.data||d.hits||d.properties||[];
          if(!Array.isArray(items))return[];
          return items.filter(function(p){
            var price=p.price&&typeof p.price==="object"?p.price.value:p.price;
            var size=p.size||p.area||0;
            return price&&size&&price>0&&size>0;
          }).map(function(p){
            var price=p.price&&typeof p.price==="object"?p.price.value:p.price;
            var size=p.size||p.area||p.sqft||0;
            var imgs=p.images||p.photos||[];
            var imgUrl=Array.isArray(imgs)&&imgs.length>0?(typeof imgs[0]==="string"?imgs[0]:imgs[0].url||imgs[0].src||""):"";
            return{
              title:p.title||"Property",
              area:p.location_name||p.area_name||area||"Dubai",
              price:price,
              size:size,
              psf:Math.round(price/size),
              beds:p.bedrooms||p.beds||bn,
              baths:p.bathrooms||p.baths||0,
              floor:"",
              furnished:p.furnishing||"",
              permit:"",
              agentName:p.agent_name||"",
              agencyName:p.agency_name||"",
              agentPhone:"",
              agentWA:"",
              photo:imgUrl||p.thumbnail||p.image||"",
              listingUrl:p.url||p.link||"https://www.propertyfinder.ae",
              listingSource:"PropertyFinder",
              source:"PropertyFinder"
            };
          }).filter(function(p){return p.psf>200&&p.psf<20000;});
        }catch(e){return[];}
      };

      var results=await Promise.allSettled([bayutP(),pfP()]);
      bayutResults=results[0].status==="fulfilled"?results[0].value:[];
      pfResults=results[1].status==="fulfilled"?results[1].value:[];

      var combined=bayutResults.concat(pfResults);

      // Building filter
      var bldgFilter=(FS.building||"").toLowerCase().trim();
      if(bldgFilter.length>1){
        combined=combined.filter(function(r){return(r.title||"").toLowerCase().indexOf(bldgFilter)>=0;});
      }

      if(combined.length>0){
        combined=scoreDealQuality(combined);
        if(loadMore){
          FS.results=FS.results.concat(combined);
        }else{
          FS.results=combined;
        }
        sortResults();
        var sources=[];
        if(bayutResults.length>0)sources.push("Bayut ("+bayutResults.length+")");
        if(pfResults.length>0)sources.push("PropertyFinder ("+pfResults.length+")");
        var prices=FS.results.map(function(r){return r.price;});
        FS.aiSummary="Found "+FS.results.length+" live listings"+(area?" in "+area:"")+". Prices: AED "+(Math.min.apply(null,prices)/1e6).toFixed(2)+"M – AED "+(Math.max.apply(null,prices)/1e6).toFixed(2)+"M. Sources: "+sources.join(" + ")+".";
      }

      // Groq AI fallback if no live results
      if(FS.results.length===0&&!loadMore){
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
            FS.results=scoreDealQuality(FS.results);
            sortResults();
            FS.aiSummary="Live API unavailable — showing AI market estimates. Prices reflect typical June 2026 values for "+searchQuery;
          }
        }
      }
    }catch(e){
      console.warn("Search failed:",e.message);
    }

    // If no results, fallback to DB
    if(FS.results.length===0&&!loadMore){
      doDBSearch(query,area,beds,maxPrice,type);
      FS.aiSummary="Live search unavailable. Showing "+FS.results.length+" buildings from DubAIVal database (8,500+ properties). Click 'Analyze Deal' for full valuation.";
    }

    FS.searched=true;FS.loading=false;FS.loadingMore=false;
    render();
  }

  function scoreDealQuality(listings){
    return listings.map(function(r){
      var areaKey=r.area||"";
      var aData=AREAS[areaKey]||null;
      var score=50;
      if(aData){
        // PSF vs area benchmark (lower = better deal, max 30 pts)
        var benchPSF=aData.psf||1800;
        var psfRatio=r.psf/benchPSF;
        if(psfRatio<=0.85)score+=30;
        else if(psfRatio<=0.95)score+=20;
        else if(psfRatio<=1.05)score+=10;
        else if(psfRatio<=1.15)score+=0;
        else score-=10;
        // Yield (max 25 pts)
        var avgY=aData.y?((aData.y[0]+aData.y[1])/2):5;
        if(avgY>=8)score+=25;
        else if(avgY>=7)score+=20;
        else if(avgY>=6)score+=15;
        else if(avgY>=5)score+=10;
        // Growth (max 15 pts)
        var gr1=aData.g?aData.g[0]:3;
        if(gr1>=8)score+=15;
        else if(gr1>=5)score+=10;
        else if(gr1>=3)score+=5;
        // Liquidity — low DOM (max 10 pts)
        var dom=aData.dom||60;
        if(dom<=30)score+=10;
        else if(dom<=45)score+=7;
        else if(dom<=60)score+=4;
        // Service charge efficiency (max 10 pts)
        var sc=aData.sc||15;
        if(sc<=12)score+=10;
        else if(sc<=18)score+=7;
        else if(sc<=25)score+=4;
      }
      // Building grade bonus (max 10 pts)
      var bData=DB[(r.title||"").toLowerCase()];
      if(bData){
        var gradeScore={"Ultra":10,"A+":8,"A":6,"A-":4,"B+":2,"B":0,"C":-5};
        score+=(gradeScore[bData.g]||0);
        r.grade=bData.g;
      }
      r.dealScore=Math.max(0,Math.min(100,score));
      return r;
    });
  }

  function sortResults(){
    var s=FS.sort||"score";
    if(s==="score")FS.results.sort(function(a,b){return(b.dealScore||0)-(a.dealScore||0);});
    else if(s==="psf_asc")FS.results.sort(function(a,b){return a.psf-b.psf;});
    else if(s==="price_asc")FS.results.sort(function(a,b){return a.price-b.price;});
    else if(s==="psf_desc")FS.results.sort(function(a,b){return b.psf-a.psf;});
  }

  function doDBSearch(query,area,beds,maxPrice,type){
    var bldgFilter=(FS.building||"").toLowerCase().trim();
    var queryLower=(query||"").toLowerCase().trim();
    var bedsNumMap={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5};
    var bn=bedsNumMap[beds]||2;
    var sizeEst=beds==="Studio"?500:beds==="1 BR"?750:beds==="2 BR"?1100:beds==="3 BR"?1600:2200;
    var dbResults=[];
    Object.entries(DB).forEach(function(e){
      var key=e[0],val=e[1];
      if(dbResults.length>=50)return;
      var areaMatch=!area||val.a===area;
      if(bldgFilter.length>1&&key.indexOf(bldgFilter)<0)return;
      if(queryLower.length>1&&!bldgFilter&&key.indexOf(queryLower)<0&&(val.a||"").toLowerCase().indexOf(queryLower)<0)return;
      if(areaMatch){
        var estPrice=val.p*sizeEst;
        if(maxPrice&&estPrice>maxPrice)return;
        var aData=AREAS[val.a];
        var avgYield=aData&&aData.y?((aData.y[0]+aData.y[1])/2):6;
        var estRent=Math.round(estPrice*avgYield/100);
        var gr=aData&&aData.g?aData.g:[8,15,25];
        dbResults.push({
          title:key,area:val.a,psf:val.p,price:estPrice,
          size:sizeEst,
          beds:bn,baths:bn>0?bn:1,
          grade:val.g,g:val.g,
          source:"DubAIVal DB",
          agentName:"",agencyName:"",agentPhone:"",agentWA:"",photo:"",
          listingUrl:"",
          estRent:estRent,estYield:avgYield.toFixed(1),
          growth:gr[0],
          apiSource:"DubAIVal DB"
        });
      }
    });
    FS.results=scoreDealQuality(dbResults);
    sortResults();
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
  hdr.appendChild(div({color:cl.sub,fontSize:"12px",marginTop:"4px",fontFamily:"'Inter',sans-serif"},"Set your criteria. DubAIVal scans 10,800+ properties instantly."));
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
  aBox.appendChild(mkSelect({width:"100%",background:cl.raised||"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:cl.white,padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",outline:"none"},["Any"].concat(Object.keys(AREAS)),AF.area||"Any",function(v){AF.area=v==="Any"?"":v;}));
  r1.appendChild(aBox);
  const tBox=el("div",{});
  tBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Type"));
  tBox.appendChild(mkSelect({width:"100%",background:cl.raised||"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:cl.white,padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",outline:"none"},["Any","Apartment","Villa"],AF.type||"Any",function(v){AF.type=v;}));
  r1.appendChild(tBox);
  formWrap.appendChild(r1);

  // Row 2: Max PSF + Min Yield
  const r2=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}});
  const pBox=el("div",{});
  pBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Max PSF (AED)"));
  const pInp=el("input",{type:"number",placeholder:"e.g. 2000",style:{width:"100%",background:cl.raised||"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:cl.white,padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
  pInp.value=AF.maxPSF||"";
  pInp.addEventListener("input",function(){AF.maxPSF=this.value;});
  pBox.appendChild(pInp);
  r2.appendChild(pBox);
  const yBox=el("div",{});
  yBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Min Yield %"));
  const yInp=el("input",{type:"number",placeholder:"e.g. 7",style:{width:"100%",background:cl.raised||"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:cl.white,padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
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
      info.appendChild(div({color:cl.white,fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},alert.area+" - "+alert.type));
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
      info.appendChild(div({color:cl.white,fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif",textTransform:"capitalize"},m.key));
      info.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},m.d.a+" · AED "+m.d.p.toLocaleString()+" PSF"));
      const badge=el("span",{style:{background:"rgba(0,200,150,0.1)",border:"1px solid rgba(0,200,150,0.3)",color:"#00C896",fontSize:"10px",padding:"3px 8px",borderRadius:"10px",fontFamily:"'Space Grotesk',monospace",flexShrink:"0",marginLeft:"8px"}});
      badge.textContent=m.d.g;
      row.appendChild(info);
      row.appendChild(badge);
      row.addEventListener("click",function(){analyzerState.f.area=m.d.a;analyzerState.f.building=m.key;setSection("Market","Analyzer");});
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
    var pwInp=el("input",{type:"password",placeholder:"Enter admin password",style:{width:"100%",background:cl.raised||"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:cl.white,padding:"12px",borderRadius:"8px",fontSize:"14px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"10px"}});
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
    topRow.appendChild(div({color:cl.white,fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},label));
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
  
  wrap.appendChild(makeSlider("Apartment Adjustment","aptAdj",-0.08,0.05,0.01,"Effect on all apartment valuations. DLD data: -3% geo pressure, supply pipeline risk."));
  wrap.appendChild(makeSlider("Villa Adjustment","villaAdj",-0.05,0.08,0.01,"Effect on all villa valuations. DLD data: villas +16% YoY, end-user demand strong."));
  
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



var TAB_TO_SECTION={
  "Market":["Market","Dashboard"],"Index":["Market","Index"],"Analyzer":["Market","Analyzer"],
  "Map":["Market","Map"],"Find":["Market","Find"],"Compare":["Market","Compare"],
  "Portfolio":["Portfolio","Assets"],"Alerts":["Portfolio","Alerts"],
  "Health":["Portfolio","Health"],"Projections":["Portfolio","Projections"],
  "Deals":["Network","Deals"],"Social":["Network","Social"],"Chat":["Network","Chat"],
  "AgentHub":["Network","AgentHub"],
  "Workspace":["More","Workspace"],"About":["More","About"],"Admin":["More","Admin"],
  "MediaStudio":["Network","MediaStudio"],"Reports":["More","Reports"]
};

function renderHome(){
  var cl=C();
  var wrap=el("div",{style:{padding:"20px",maxWidth:"960px",margin:"0 auto"}});

  var hero=el("div",{style:{marginBottom:"24px"}});
  var hr=new Date().getHours();
  var greeting="Good "+(hr<12?"Morning":hr<18?"Afternoon":"Evening");
  if(USER_PROFILE.name)greeting+=", "+USER_PROFILE.name;
  hero.appendChild(div({fontSize:"22px",fontWeight:"700",color:cl.white,fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},greeting));
  hero.appendChild(div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"Dubai Real Estate Intelligence Dashboard"));
  wrap.appendChild(hero);

  // --- 3 Hero Feature Cards ---
  var heroContainer=el("div",{style:{position:"relative",marginBottom:"20px"}});
  heroContainer.className="dv-hero-container";
  var heroGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",position:"relative",zIndex:"1"}});heroGrid.className="dv-hero-grid";
  var heroFeatures=[
    {icon:"search",title:"Analyze Any Property",desc:"AI valuation for 10,880+ properties across 347 areas",color:"#D4AF37",bg:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",hoverBorder:"rgba(212,175,55,0.4)",hoverShadow:"rgba(212,175,55,0.12)",sec:"Market",sub:"Analyzer",micro:"AI-powered valuation — price per sqft, rent estimate, yield, investment signal, and confidence score for any Dubai property",microLink:"Start Analysis →",microColor:"#D4AF37"},
    {icon:"handshake",title:"Off-Market Deals",desc:"",color:"#10B981",bg:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",hoverBorder:"rgba(16,185,129,0.4)",hoverShadow:"rgba(16,185,129,0.12)",sec:"Network",sub:"Deals",countKey:"deals",micro:"Private owner-to-buyer deal board — browse exclusive listings, verified title deeds, direct contact with property owners",microLink:"Browse Deals →",microColor:"#10B981"},
    {icon:"video",title:"AI Media Studio",desc:"35+ AI Tools",color:"#8B5CF6",bg:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",hoverBorder:"rgba(139,92,246,0.4)",hoverShadow:"rgba(139,92,246,0.12)",sec:"Network",sub:"MediaStudio",micro:"35+ professional tools — AI video creator, post designer, content calendar, hashtag intelligence, avatar studio, and more",microLink:"Open Studio →",microColor:"#8B5CF6"}
  ];
  heroFeatures.forEach(function(hf){
    var hCard=el("div",{style:{background:hf.bg,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid "+hf.border,borderRadius:"16px",padding:"28px 20px",cursor:"pointer",transition:"transform 0.3s ease,border-color 0.3s ease,box-shadow 0.3s ease",position:"relative",overflow:"hidden",minHeight:"140px",display:"flex",flexDirection:"column",justifyContent:"space-between"}});
    hCard.className="dv-hero-card dv-glass";
    var glow=el("div",{style:{position:"absolute",top:"-40px",right:"-40px",width:"120px",height:"120px",borderRadius:"50%",background:hf.color,opacity:"0.04",filter:"blur(40px)",pointerEvents:"none"}});
    hCard.appendChild(glow);
    var topRow=el("div",{style:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px",position:"relative"}});
    var iconBox=el("div",{style:{width:"44px",height:"44px",borderRadius:"12px",background:"rgba(255,255,255,0.06)",border:"1px solid "+hf.border,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:"0"}});
    iconBox.innerHTML='<i data-lucide="'+hf.icon+'" style="width:22px;height:22px;color:'+hf.color+'"></i>';
    topRow.appendChild(iconBox);
    topRow.appendChild(div({color:cl.white,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",lineHeight:"1.2"},hf.title));
    hCard.appendChild(topRow);
    var descText=hf.desc;
    if(hf.countKey==="deals"){var dc=0;try{dc=JSON.parse(localStorage.getItem("dv_deal_cache")||"[]").length;}catch(e){}descText=dc>0?dc+" active deals":"Browse exclusive listings";}
    hCard.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif",position:"relative"},descText));
    var microInfo=el("div",{style:{position:"absolute",bottom:"0",left:"0",right:"0",padding:"12px 16px",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderRadius:"0 0 16px 16px",transform:"translateY(100%)",opacity:"0",transition:"transform 0.3s ease,opacity 0.3s ease",fontSize:"12px",color:cl.sub,lineHeight:"1.5",zIndex:"2"}});
    microInfo.innerHTML=hf.micro+' <span style="color:'+hf.microColor+';font-weight:700;cursor:pointer;font-family:\'Space Grotesk\',monospace;font-size:11px;display:block;margin-top:4px">'+hf.microLink+'</span>';
    hCard.appendChild(microInfo);
    hCard.addEventListener("mouseenter",function(){hCard.style.borderColor=hf.hoverBorder;hCard.style.transform="translateY(-4px)";hCard.style.boxShadow="0 12px 40px rgba(0,0,0,0.4), 0 0 30px "+hf.hoverShadow+", 0 4px 16px rgba(212,175,55,0.06)";microInfo.style.transform="translateY(0)";microInfo.style.opacity="1";});
    hCard.addEventListener("mouseleave",function(){hCard.style.borderColor=darkMode?hf.border:(cl.glassBorder||hf.border);hCard.style.transform="translateY(0)";hCard.style.boxShadow="";microInfo.style.transform="translateY(100%)";microInfo.style.opacity="0";});
    hCard.addEventListener("click",function(){setSection(hf.sec,hf.sub);});
    heroGrid.appendChild(hCard);
  });
  heroContainer.appendChild(heroGrid);
  wrap.appendChild(heroContainer);

  // --- Workspace Quick Card ---
  var wsCard=el("div",{style:{background:cl.glass||"rgba(255,255,255,0.04)",backdropFilter:cl.blur||"blur(16px)",WebkitBackdropFilter:cl.blur||"blur(16px)",border:"1px solid "+(cl.glassBorder||"rgba(255,255,255,0.08)"),borderRadius:"14px",padding:"16px 20px",marginBottom:"20px",cursor:"pointer",display:"flex",alignItems:"center",gap:"14px",transition:"transform 0.2s ease,border-color 0.2s ease,box-shadow 0.2s ease",boxShadow:cl.glassShadow||"0 4px 24px rgba(0,0,0,0.2)"}});
  wsCard.className="dv-glass";
  var wsIcon=el("div",{style:{width:"40px",height:"40px",borderRadius:"10px",background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:"0"}});
  wsIcon.innerHTML='<i data-lucide="layout-dashboard" style="width:20px;height:20px;color:#3B82F6"></i>';
  wsCard.appendChild(wsIcon);
  var wsText=el("div",{style:{flex:"1"}});
  wsText.appendChild(div({color:cl.white,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},"My Workspace"));
  wsText.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"Your personalized dashboard — drag & drop widgets, custom reports, and saved views"));
  wsCard.appendChild(wsText);
  var wsBtn=el("span",{style:{color:"#3B82F6",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",whiteSpace:"nowrap"}});
  wsBtn.textContent="Open →";
  wsCard.appendChild(wsBtn);
  wsCard.addEventListener("mouseenter",function(){wsCard.style.borderColor="rgba(255,255,255,0.15)";wsCard.style.transform="translateY(-2px)";wsCard.style.boxShadow="0 4px 20px rgba(0,0,0,0.3)";});
  wsCard.addEventListener("mouseleave",function(){wsCard.style.borderColor="rgba(255,255,255,0.08)";wsCard.style.transform="translateY(0)";wsCard.style.boxShadow="none";});
  wsCard.addEventListener("click",function(){setSection("More","Workspace");});
  wrap.appendChild(wsCard);

  // --- Market Pulse Card ---
  var pulseCard=el("div",{style:{background:cl.glass||cl.surface,backdropFilter:cl.blur,WebkitBackdropFilter:cl.blur,border:"1px solid "+(cl.glassBorder||cl.border),borderRadius:"14px",padding:"24px",marginBottom:"16px",transition:"border-color 0.25s ease,box-shadow 0.25s ease",boxShadow:(cl.glassShadow||"0 4px 24px rgba(0,0,0,0.2)")+",inset 0 1px 0 rgba(255,255,255,0.04)"}});
  pulseCard.className="dv-glass";
  pulseCard.addEventListener("mouseenter",function(){pulseCard.style.borderColor=cl.goldGlassBorder;pulseCard.style.boxShadow="0 8px 40px rgba(0,0,0,0.4),0 0 20px rgba(212,175,55,0.05)";});
  pulseCard.addEventListener("mouseleave",function(){pulseCard.style.borderColor=cl.border;pulseCard.style.boxShadow=cl.glassShadow;});
  pulseCard.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"600",borderLeft:"3px solid "+cl.gold,paddingLeft:"10px",marginBottom:"16px"},"Market Pulse"));
  var areaKeys=Object.keys(AREAS);
  var totalPSF=0,totalYield=0,psfCount=0,yieldCount=0;
  var movers=[];
  areaKeys.forEach(function(k){
    var a=AREAS[k];
    if(a.psf>0){totalPSF+=a.psf;psfCount++;}
    if(a.y&&a.y[0]>0){totalYield+=(a.y[0]+a.y[1])/2;yieldCount++;}
    if(a.g&&a.g[0]!==undefined)movers.push({name:k,growth:a.g[0],psf:a.psf});
  });
  movers.sort(function(a,b){return b.growth-a.growth;});
  var avgPSF=psfCount>0?Math.round(totalPSF/psfCount):0;
  var avgYield=yieldCount>0?(totalYield/yieldCount).toFixed(1):0;
  var dbCount=Object.keys(DB).length;
  var comCount=typeof DB_COM!=="undefined"?Object.keys(DB_COM).length:0;
  var landCount=typeof DB_LAND!=="undefined"?Object.keys(DB_LAND).length:0;

  var statsGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:"12px",marginBottom:"16px"}});
  [{l:"Avg PSF",v:"AED "+avgPSF.toLocaleString(),c:cl.gold,ic:"trending-up",arrow:true},{l:"Avg Yield",v:avgYield+"%",c:"#10B981",ic:"percent",arrow:true},{l:"Residential",v:dbCount.toLocaleString(),c:"#3B82F6",ic:"building-2"},{l:"Commercial",v:comCount.toLocaleString(),c:"#8B5CF6",ic:"briefcase"},{l:"Land Plots",v:landCount.toLocaleString(),c:"#F59E0B",ic:"map-pin"},{l:"Areas",v:String(areaKeys.length),c:"#3B82F6",ic:"map"}].forEach(function(s){
    var card=el("div",{style:{background:cl.glass||"rgba(255,255,255,0.03)",backdropFilter:cl.blur||"blur(8px)",WebkitBackdropFilter:cl.blur||"blur(8px)",border:"1px solid "+(cl.glassBorder||"rgba(255,255,255,0.06)"),borderRadius:"12px",padding:"14px",textAlign:"center",transition:"transform 0.2s ease,box-shadow 0.2s ease,border-color 0.2s ease",cursor:"default"}});
    card.className="dv-glass";
    card.addEventListener("mouseenter",function(){card.style.transform="translateY(-2px)";card.style.boxShadow=darkMode?"0 4px 20px rgba(0,0,0,0.3),0 2px 12px rgba(212,175,55,0.06)":"0 4px 20px rgba(0,0,0,0.08)";card.style.borderColor=darkMode?"rgba(212,175,55,0.15)":"rgba(0,0,0,0.12)";});
    card.addEventListener("mouseleave",function(){card.style.transform="translateY(0)";card.style.boxShadow="";card.style.borderColor="";});
    var icWrap=el("div",{style:{marginBottom:"6px",display:"flex",alignItems:"center",justifyContent:"center",gap:"4px"}});
    icWrap.innerHTML='<i data-lucide="'+s.ic+'" style="width:14px;height:14px;color:'+s.c+';opacity:0.6"></i>';
    card.appendChild(icWrap);
    var valRow=el("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:"4px",marginBottom:"2px"}});
    valRow.appendChild(div({color:s.c,fontSize:"20px",fontWeight:"800",fontFamily:"'JetBrains Mono',monospace",fontFeatureSettings:"'tnum'"},s.v));
    if(s.arrow)valRow.appendChild(span({color:"#10B981",fontSize:"12px",fontWeight:"700"},"▲"));
    card.appendChild(valRow);
    card.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",textTransform:"uppercase"},s.l));
    statsGrid.appendChild(card);
  });
  pulseCard.appendChild(statsGrid);

  if(movers.length>0){
    pulseCard.appendChild(el("div",{style:{height:"1px",background:"linear-gradient(90deg,transparent 0%,rgba(212,175,55,0.3) 50%,transparent 100%)",margin:"20px 0"}}));
    pulseCard.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Top Movers (1-Year Growth)"));
    var moverList=el("div",{style:{display:"flex",flexDirection:"column",gap:"6px"}});
    movers.slice(0,5).forEach(function(m,i){
      var bgOrig=i%2===0?(darkMode?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)"):"transparent";
      var row=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:bgOrig,borderRadius:"8px",transition:"transform 0.15s ease,background 0.15s ease",cursor:"default"}});
      row.addEventListener("mouseenter",function(){row.style.transform="translateX(4px)";row.style.background=darkMode?"rgba(212,175,55,0.06)":"rgba(154,106,16,0.06)";});
      row.addEventListener("mouseleave",function(){row.style.transform="translateX(0)";row.style.background=bgOrig;});
      row.appendChild(span({color:cl.white,fontSize:"12px",fontFamily:"'Inter',sans-serif"},m.name));
      var badge=el("div",{style:{display:"flex",alignItems:"center",gap:"8px"}});
      badge.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'JetBrains Mono',monospace",fontFeatureSettings:"'tnum'"},"PSF "+m.psf.toLocaleString()));
      var growthColor=m.growth>0?"#10B981":"#EF4444";
      badge.appendChild(span({color:growthColor,fontSize:"12px",fontWeight:"700",fontFamily:"'JetBrains Mono',monospace",fontFeatureSettings:"'tnum'"},(m.growth>0?"+":"")+m.growth.toFixed(1)+"%"));
      row.appendChild(badge);
      moverList.appendChild(row);
    });
    pulseCard.appendChild(moverList);
  }
  wrap.appendChild(pulseCard);

  // --- Two-column: Portfolio + Quick Actions ---
  var twoCol=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}});

  // Portfolio Summary
  var portfolioAssets=[];
  try{portfolioAssets=JSON.parse(localStorage.getItem("dubaival_portfolio")||"[]");}catch(e){}
  var pfCard=el("div",{style:{background:cl.surface,backdropFilter:cl.blur,WebkitBackdropFilter:cl.blur,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",boxShadow:cl.glassShadow}});
  pfCard.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"600",borderLeft:"3px solid "+cl.gold,paddingLeft:"10px",marginBottom:"16px"},"Your Portfolio"));
  if(portfolioAssets.length>0){
    var totalVal=0,totalRent=0;
    portfolioAssets.forEach(function(a){totalVal+=(parseFloat(a.price)||0);totalRent+=(parseFloat(a.rent)||0);});
    pfCard.appendChild(div({color:cl.white,fontSize:"18px",fontWeight:"700",fontFamily:"'JetBrains Mono',monospace",fontFeatureSettings:"'tnum'",marginBottom:"8px"},"AED "+(totalVal/1e6).toFixed(2)+"M"));
    var pfStats=el("div",{style:{display:"flex",flexDirection:"column",gap:"6px"}});
    pfStats.appendChild(div({display:"flex",justifyContent:"space-between"},[span({color:cl.sub,fontSize:"11px"},"Assets"),span({color:cl.white,fontSize:"12px",fontWeight:"600"},String(portfolioAssets.length))]));
    if(totalRent>0)pfStats.appendChild(div({display:"flex",justifyContent:"space-between"},[span({color:cl.sub,fontSize:"11px"},"Rental Income"),span({color:"#10B981",fontSize:"12px",fontWeight:"600"},"AED "+(totalRent/12).toLocaleString(undefined,{maximumFractionDigits:0})+"/mo")]));
    pfCard.appendChild(pfStats);
    var pfBtn=el("button",{style:{marginTop:"14px",width:"100%",padding:"10px",background:"rgba(212,175,55,0.15)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",color:cl.gold,border:"1px solid rgba(212,175,55,0.3)",borderRadius:"10px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    pfBtn.addEventListener("mouseenter",function(){pfBtn.style.background="rgba(212,175,55,0.25)";pfBtn.style.boxShadow="0 0 20px rgba(212,175,55,0.1)";});
    pfBtn.addEventListener("mouseleave",function(){pfBtn.style.background="rgba(212,175,55,0.15)";pfBtn.style.boxShadow="none";});
    pfBtn.textContent="View Portfolio →";
    pfBtn.addEventListener("click",function(){setSection("Portfolio","Assets");});
    pfCard.appendChild(pfBtn);
  } else {
    pfCard.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif",marginBottom:"12px"},"No assets tracked yet. Add your first property to start."));
    var addBtn=el("button",{style:{padding:"10px 16px",background:"rgba(212,175,55,0.15)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",color:cl.gold,border:"1px solid rgba(212,175,55,0.3)",borderRadius:"10px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    addBtn.addEventListener("mouseenter",function(){addBtn.style.background="rgba(212,175,55,0.25)";addBtn.style.boxShadow="0 0 20px rgba(212,175,55,0.1)";});
    addBtn.addEventListener("mouseleave",function(){addBtn.style.background="rgba(212,175,55,0.15)";addBtn.style.boxShadow="none";});
    addBtn.textContent="+ Add Asset";
    addBtn.addEventListener("click",function(){setSection("Portfolio","Assets");});
    pfCard.appendChild(addBtn);
  }
  twoCol.appendChild(pfCard);

  // Quick Actions
  var actCard=el("div",{style:{background:cl.surface,backdropFilter:cl.blur,WebkitBackdropFilter:cl.blur,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",boxShadow:cl.glassShadow}});
  actCard.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"600",borderLeft:"3px solid "+cl.gold,paddingLeft:"10px",marginBottom:"16px"},"Quick Actions"));
  var actGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}});
  [{icon:"search",l:"Analyze",sec:"Market",sub:"Analyzer"},{icon:"scan-search",l:"Search",sec:"Market",sub:"Find"},{icon:"scale",l:"Compare",sec:"Market",sub:"Compare"},{icon:"handshake",l:"Post Deal",sec:"Network",sub:"Deals"},{icon:"bar-chart-3",l:"Market Index",sec:"Market",sub:"Index"},{icon:"smartphone",l:"Media Studio",sec:"Network",sub:"MediaStudio"}].forEach(function(a){
    var _abBg=cl.glass||"rgba(255,255,255,0.03)";
    var _abBd=cl.glassBorder||"rgba(255,255,255,0.06)";
    var ab=el("button",{style:{padding:"12px 10px",background:_abBg,backdropFilter:cl.blur||"blur(8px)",WebkitBackdropFilter:cl.blur||"blur(8px)",border:"1px solid "+_abBd,borderRadius:"10px",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px",transition:"all 0.2s ease"}});
    ab.className="dv-glass";
    var abIcon=el("span",{style:{width:"16px",height:"16px",display:"inline-flex",alignItems:"center",justifyContent:"center",color:cl.gold}});
    abIcon.innerHTML='<i data-lucide="'+a.icon+'"></i>';
    ab.appendChild(abIcon);
    ab.appendChild(span({color:cl.white,fontSize:"12px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},a.l));
    ab.addEventListener("mouseenter",function(){this.style.borderColor=darkMode?"rgba(212,175,55,0.3)":"rgba(154,106,16,0.2)";this.style.background=darkMode?"rgba(212,175,55,0.08)":"rgba(154,106,16,0.06)";this.style.boxShadow=darkMode?"0 0 16px rgba(212,175,55,0.06)":"0 2px 12px rgba(0,0,0,0.06)";});
    ab.addEventListener("mouseleave",function(){this.style.borderColor="";this.style.background="";this.style.boxShadow="";});
    ab.addEventListener("click",function(){setSection(a.sec,a.sub);});
    actGrid.appendChild(ab);
  });
  actCard.appendChild(actGrid);
  twoCol.appendChild(actCard);
  wrap.appendChild(twoCol);

  // --- Two-column: Alerts + Recent Activity ---
  var bottomRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}});

  // Active Alerts
  var alertCard=el("div",{style:{background:cl.surface,backdropFilter:cl.blur,WebkitBackdropFilter:cl.blur,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",boxShadow:cl.glassShadow}});
  alertCard.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"600",borderLeft:"3px solid "+cl.gold,paddingLeft:"10px",marginBottom:"14px"},"Active Alerts"));
  var alerts=[];
  try{alerts=JSON.parse(localStorage.getItem("dv_alerts")||"[]");}catch(e){}
  if(alerts.length>0){
    alerts.slice(0,4).forEach(function(al){
      var row=el("div",{style:{padding:"8px 0",borderBottom:"1px solid "+cl.border,display:"flex",justifyContent:"space-between",alignItems:"center"}});
      var desc=(al.beds||"Any")+" BR "+(al.area||"Any area");
      if(al.maxPsf)desc+=" < "+al.maxPsf+" PSF";
      if(al.minYield)desc+=" > "+al.minYield+"% yield";
      row.appendChild(span({color:cl.white,fontSize:"11px",fontFamily:"'Inter',sans-serif"},desc));
      var dot=el("div",{style:{width:"6px",height:"6px",borderRadius:"50%",background:"#10B981",flexShrink:"0"}});
      row.appendChild(dot);
      alertCard.appendChild(row);
    });
    var alertBtn=el("button",{style:{marginTop:"10px",padding:"6px 12px",background:"transparent",border:"1px solid "+cl.border,borderRadius:"8px",color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    alertBtn.textContent="View All "+alerts.length+" Alerts →";
    alertBtn.addEventListener("click",function(){setSection("Portfolio","Alerts");});
    alertCard.appendChild(alertBtn);
  } else {
    alertCard.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif",marginBottom:"10px"},"No alerts set. Get notified when properties match your criteria."));
    var setAlertBtn=el("button",{style:{padding:"8px 14px",background:"transparent",border:"1px solid "+cl.gold,borderRadius:"8px",color:cl.gold,fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    setAlertBtn.textContent="+ Set Alert";
    setAlertBtn.addEventListener("click",function(){setSection("Portfolio","Alerts");});
    alertCard.appendChild(setAlertBtn);
  }
  bottomRow.appendChild(alertCard);

  // Recent Activity
  var recentCard=el("div",{style:{background:cl.surface,backdropFilter:cl.blur,WebkitBackdropFilter:cl.blur,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",boxShadow:cl.glassShadow}});
  recentCard.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"600",borderLeft:"3px solid "+cl.gold,paddingLeft:"10px",marginBottom:"14px"},"Recent Activity"));
  var recent=[];
  try{recent=JSON.parse(localStorage.getItem("dubaival_recent")||"[]");}catch(e){}
  if(recent.length>0){
    recent.slice(0,5).forEach(function(r){
      var row=el("div",{style:{padding:"6px 0",borderBottom:"1px solid "+cl.border}});
      row.appendChild(div({color:cl.white,fontSize:"11px",fontFamily:"'Inter',sans-serif"},r.label||r.building||r.area||"Valuation"));
      if(r.ts){
        var ago=Date.now()-r.ts;
        var agoStr=ago<3600000?Math.round(ago/60000)+"m ago":ago<86400000?Math.round(ago/3600000)+"h ago":Math.round(ago/86400000)+"d ago";
        row.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},agoStr));
      }
      recentCard.appendChild(row);
    });
  } else {
    recentCard.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif"},"No recent activity. Start by analyzing a property."));
  }
  bottomRow.appendChild(recentCard);
  wrap.appendChild(bottomRow);

  return wrap;
}

function renderProfilePanel(){
  var cl=C();
  var panel=el("div",{style:{background:cl.surface,borderBottom:"1px solid "+cl.border,padding:"16px 20px"}});
  var pGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:"16px",maxWidth:"800px",margin:"0 auto"}});

  var typeBox=el("div",{});
  typeBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Investor Type"));
  var typeGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}});
  [{k:"income",l:"Rental Income",ic:"R"},{k:"growth",l:"Capital Growth",ic:"G"},{k:"flip",l:"Flip / Resale",ic:"F"},{k:"enduse",l:"End Use",ic:"E"}].forEach(function(p){
    var active=USER_PROFILE.investorType===p.k;
    var b=el("button",{style:{padding:"7px 8px",borderRadius:"7px",fontSize:"11px",border:"1px solid "+(active?cl.gold:cl.border),background:active?(cl.goldFaint||"rgba(212,175,55,0.06)"):"transparent",color:active?"#F0F2F5":cl.sub,fontFamily:"'Inter',sans-serif",cursor:"pointer",textAlign:"left"}});
    b.textContent=p.ic+" "+p.l;
    b.addEventListener("click",function(){USER_PROFILE.investorType=p.k;saveProfile();render();});
    typeGrid.appendChild(b);
  });
  typeBox.appendChild(typeGrid);
  pGrid.appendChild(typeBox);

  var riskBox=el("div",{});
  riskBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Risk Tolerance"));
  var riskGrid=el("div",{style:{display:"flex",flexDirection:"column",gap:"5px"}});
  [{k:"conservative",l:"Conservative"},{k:"moderate",l:"Moderate"},{k:"aggressive",l:"Aggressive"}].forEach(function(r){
    var active=USER_PROFILE.risk===r.k;
    var b=el("button",{style:{padding:"7px 10px",borderRadius:"7px",fontSize:"11px",border:"1px solid "+(active?cl.gold:cl.border),background:active?(cl.goldFaint||"rgba(212,175,55,0.06)"):"transparent",color:active?"#F0F2F5":cl.sub,fontFamily:"'Inter',sans-serif",cursor:"pointer",textAlign:"left"}});
    b.textContent=r.l;
    b.addEventListener("click",function(){USER_PROFILE.risk=r.k;saveProfile();render();});
    riskGrid.appendChild(b);
  });
  riskBox.appendChild(riskGrid);
  pGrid.appendChild(riskBox);

  var budgetBox=el("div",{});
  budgetBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Budget Range (AED)"));
  var bRow=el("div",{style:{display:"flex",gap:"8px",alignItems:"center"}});
  var bMin=el("input",{type:"number",placeholder:"Min",style:{flex:"1",background:cl.raised||"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:cl.white,padding:"7px 10px",borderRadius:"7px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",minWidth:"0"}});
  bMin.value=USER_PROFILE.budgetMin?USER_PROFILE.budgetMin.toLocaleString():"";
  bMin.addEventListener("change",function(){USER_PROFILE.budgetMin=parseInt(this.value.replace(/,/g,""))||0;saveProfile();});
  var bMax=el("input",{type:"number",placeholder:"Max",style:{flex:"1",background:cl.raised||"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:cl.white,padding:"7px 10px",borderRadius:"7px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",minWidth:"0"}});
  bMax.value=USER_PROFILE.budgetMax?USER_PROFILE.budgetMax.toLocaleString():"";
  bMax.addEventListener("change",function(){USER_PROFILE.budgetMax=parseInt(this.value.replace(/,/g,""))||0;saveProfile();});
  bRow.appendChild(bMin);
  bRow.appendChild(span({color:cl.sub,fontSize:"12px"},"—"));
  bRow.appendChild(bMax);
  budgetBox.appendChild(bRow);
  pGrid.appendChild(budgetBox);

  var nameBox=el("div",{});
  nameBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Your Name (optional)"));
  var nameInp=el("input",{type:"text",placeholder:"e.g. Ahmed Al Mansouri",style:{width:"100%",background:cl.raised||"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:cl.white,padding:"7px 10px",borderRadius:"7px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
  nameInp.value=USER_PROFILE.name||"";
  nameInp.addEventListener("input",function(){USER_PROFILE.name=this.value;saveProfile();});
  nameBox.appendChild(nameInp);
  pGrid.appendChild(nameBox);

  panel.appendChild(pGrid);

  var summary=el("div",{style:{display:"flex",gap:"10px",flexWrap:"wrap",marginTop:"12px",paddingTop:"10px",borderTop:"1px solid "+cl.border,maxWidth:"800px",margin:"12px auto 0"}});
  var typeLabels={income:"Rental Income",growth:"Capital Growth",flip:"Flip / Resale",enduse:"End Use"};
  var riskLabels={conservative:"Conservative",moderate:"Moderate",aggressive:"Aggressive"};
  [{l:"Type",v:typeLabels[USER_PROFILE.investorType]||"Not set"},{l:"Risk",v:riskLabels[USER_PROFILE.risk]||"Moderate"},{l:"Budget",v:USER_PROFILE.budgetMax?"Up to AED "+(USER_PROFILE.budgetMax/1000000).toFixed(1)+"M":"Not set"}].forEach(function(item){
    var chip=el("div",{style:{background:cl.goldFaint||"rgba(212,175,55,0.06)",border:"1px solid "+(cl.goldDim||"#8A6420"),borderRadius:"20px",padding:"3px 12px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",color:cl.gold}});
    chip.textContent=item.l+": "+item.v;
    summary.appendChild(chip);
  });
  panel.appendChild(summary);
  return panel;
}

function render(preserveScroll){
  if(!DB_LOADED){
    var app=document.getElementById('app');
    if(app&&(!app.innerHTML||app.innerHTML.indexOf('loading')>-1)){
      app.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#070B14;gap:16px"><div style="width:40px;height:40px;border-radius:50%;border:2px solid #1C2030;border-top-color:#C9A84C;animation:spin 0.8s linear infinite"></div><div style="color:#4B5563;font-size:12px;font-family:Space Grotesk,monospace;letter-spacing:0.1em">LOADING DATABASE...</div></div>';
    }
    return;
  }
  document.documentElement.dir=isRTL()?"rtl":"ltr";
  document.documentElement.lang=isRTL()?"ar":"en";
  if(darkMode)document.documentElement.classList.remove("light-mode");
  else document.documentElement.classList.add("light-mode");
  if(isRTL())document.body.style.fontFamily="Cairo,'Space Grotesk',monospace";
  else document.body.style.fontFamily="";
  var _scrollY=preserveScroll?window.scrollY:0;

  if(currentTab&&TAB_TO_SECTION[currentTab]){
    var mapped=TAB_TO_SECTION[currentTab];
    currentSection=mapped[0];currentSubTab=mapped[1];
    currentTab="";
  }
  if(!window._adminHashChecked&&window.location.hash==="#admin"){currentSection="More";currentSubTab="Admin";window._adminHashChecked=true;}

  var cl=C();
  var app=document.getElementById("app");
  app.innerHTML="";
  app.style.cssText="background:"+cl.bg+";min-height:100vh;color:"+cl.white+";overflow-x:hidden;max-width:100vw;";

  if(!document.getElementById("dvGlobalStyles")){
    var gs=document.createElement("style");gs.id="dvGlobalStyles";
    gs.textContent="@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)}70%{box-shadow:0 0 0 10px rgba(201,168,76,0)}100%{box-shadow:0 0 0 0 rgba(201,168,76,0)}}@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}";
    document.head.appendChild(gs);
  }

  var layout=el("div",{style:{display:"flex",minHeight:"100vh"}});

  // --- SIDEBAR (desktop) ---
  var sbClass="dv-sidebar"+(sidebarCollapsed?" collapsed":"");
  var sidebar=el("nav",{style:{}});
  sidebar.className=sbClass;

  var logoWrap=el("div",{});
  logoWrap.className="dv-sidebar-logo";
  var _logoSize=sidebarCollapsed?28:36;
  var logoBox=el("div",{style:{width:_logoSize+"px",height:_logoSize+"px",flexShrink:"0",borderRadius:"10px",background:"linear-gradient(135deg,#D4AF37,#B8941F)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",boxShadow:"0 2px 8px rgba(212,175,55,0.3)"}});
  var logoImg=el("img",{src:"logo.png",alt:"DubAIVal",style:{width:(_logoSize-4)+"px",height:(_logoSize-4)+"px",objectFit:"contain"}});
  logoImg.onerror=function(){this.style.display="none";var fb=document.createElement("span");fb.style.cssText="color:#fff;font-family:Space Grotesk,monospace;font-weight:800;font-size:"+(_logoSize<32?"10":"13")+"px";fb.textContent="DV";this.parentNode.appendChild(fb);};
  logoBox.appendChild(logoImg);
  logoWrap.appendChild(logoBox);
  var logoText=el("div",{});
  logoText.className="dv-sidebar-logo-text";
  logoText.appendChild(div({fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",color:cl.white},"DubAIVal"));
  logoText.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',monospace"},"AI PROPERTY INTEL"));
  logoWrap.appendChild(logoText);
  sidebar.appendChild(logoWrap);

  NAV_SECTIONS.forEach(function(sec){
    var isActive=currentSection===sec.id;
    var isKey=sec.id==="Market"||sec.id==="Network";
    var item=el("div",{});
    item.className="dv-sidebar-item"+(isActive?" active":"");
    if(isActive&&sec.accentColor)item.style.borderLeftColor=sec.accentColor;
    var iconSize=isKey?"24px":"20px";
    var iconSpan=el("span",{style:{flexShrink:"0",width:iconSize,height:iconSize,display:"inline-flex",alignItems:"center",justifyContent:"center",color:isActive&&sec.accentColor?sec.accentColor:""}});
    iconSpan.innerHTML='<i data-lucide="'+sec.icon+'" style="width:'+iconSize+';height:'+iconSize+'"></i>';
    item.appendChild(iconSpan);
    var labelWrap=el("span",{style:{display:"flex",flexDirection:"column",overflow:"hidden"}});
    labelWrap.className="dv-sidebar-label";
    var labelMain=el("span",{});
    labelMain.textContent=sec.label;
    labelWrap.appendChild(labelMain);
    if(sec.subtitle&&!sidebarCollapsed){
      var sub=el("span",{style:{fontSize:"8px",color:sec.accentColor||"#6B7A9E",letterSpacing:"0.08em",fontFamily:"'Space Grotesk',monospace",opacity:"0.7",lineHeight:"1"}});
      sub.textContent=sec.subtitle;
      labelWrap.appendChild(sub);
    }
    item.appendChild(labelWrap);
    if(sec.badgeKey==="deals"&&!sidebarCollapsed){
      var dealCount=0;try{var dc=JSON.parse(localStorage.getItem("dv_deal_cache")||"[]");dealCount=dc.length;}catch(e){}
      if(dealCount>0){var badge=el("span",{style:{background:"rgba(16,185,129,0.15)",color:"#10B981",fontSize:"8px",fontWeight:"700",fontFamily:"'JetBrains Mono',monospace",padding:"2px 6px",borderRadius:"999px",marginLeft:"auto",flexShrink:"0"}});badge.textContent=String(dealCount);item.appendChild(badge);}
    }
    if(sec.id==="Network"&&!sidebarCollapsed){
      var tbadge=el("span",{style:{background:"rgba(139,92,246,0.15)",color:"#8B5CF6",fontSize:"7px",fontWeight:"700",fontFamily:"'JetBrains Mono',monospace",padding:"2px 6px",borderRadius:"999px",marginLeft:"auto",flexShrink:"0"}});tbadge.textContent="35+";item.appendChild(tbadge);
    }
    item.addEventListener("click",function(){setSection(sec.id);});
    sidebar.appendChild(item);
  });

  var sbControls=el("div",{style:{marginTop:"auto",borderTop:"1px solid #1C2540",padding:"8px 0"}});
  var themeItem=el("div",{});
  themeItem.className="dv-sidebar-item";
  var themeIcon=el("span",{style:{flexShrink:"0",width:"20px",height:"20px",display:"inline-flex",alignItems:"center",justifyContent:"center"}});
  themeIcon.innerHTML='<i data-lucide="'+(darkMode?"sun":"moon")+'"></i>';
  themeItem.appendChild(themeIcon);
  var themeLabel=el("span",{});
  themeLabel.className="dv-sidebar-label";
  themeLabel.textContent=darkMode?"Light Mode":"Dark Mode";
  themeItem.appendChild(themeLabel);
  themeItem.addEventListener("click",function(){darkMode=!darkMode;try{localStorage.setItem("dv_dark",darkMode?"1":"0");}catch(e){}render();});
  sbControls.appendChild(themeItem);

  var langItem=el("div",{});
  langItem.className="dv-sidebar-item";
  var langIcon=el("span",{style:{flexShrink:"0",width:"20px",height:"20px",display:"inline-flex",alignItems:"center",justifyContent:"center"}});
  langIcon.innerHTML='<i data-lucide="globe"></i>';
  langItem.appendChild(langIcon);
  var langLabel=el("span",{});
  langLabel.className="dv-sidebar-label";
  langLabel.textContent=dvLang==="ar"?"English":dvLang==="fa"?"English":"Arabic";
  langItem.appendChild(langLabel);
  langItem.addEventListener("click",function(){setLang(dvLang==="en"?"ar":"en");});
  sbControls.appendChild(langItem);
  sidebar.appendChild(sbControls);

  var collapseBtn=el("div",{});
  collapseBtn.className="dv-sidebar-toggle";
  collapseBtn.textContent=sidebarCollapsed?"»":"«";
  collapseBtn.addEventListener("click",function(){
    sidebarCollapsed=!sidebarCollapsed;
    try{localStorage.setItem("dv_sidebar_collapsed",sidebarCollapsed?"1":"0");}catch(e){}
    render();
  });
  sidebar.appendChild(collapseBtn);
  layout.appendChild(sidebar);

  // --- MAIN AREA ---
  var main=el("div",{});
  main.className="dv-main"+(sidebarCollapsed?" sidebar-collapsed":"");

  // Top bar
  var header=el("div",{style:{background:cl.surface,borderBottom:"1px solid "+cl.border,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:"50px",position:"sticky",top:"0",zIndex:"50"}});
  var secTitle=el("div",{style:{display:"flex",alignItems:"center",gap:"8px"}});
  var curSec=NAV_SECTIONS.find(function(n){return n.id===currentSection;});
  var mLogoWrap=el("span",{style:{display:"none",alignItems:"center"}});
  mLogoWrap.className="dv-mobile-logo";
  var mLogoBox=el("span",{style:{width:"28px",height:"28px",borderRadius:"7px",background:"linear-gradient(135deg,#D4AF37,#B8941F)",display:"inline-flex",alignItems:"center",justifyContent:"center",overflow:"hidden",boxShadow:"0 2px 6px rgba(212,175,55,0.3)"}});
  var mLogoImg=el("img",{src:"logo.png",alt:"DV",style:{width:"24px",height:"24px",objectFit:"contain"}});
  mLogoImg.onerror=function(){this.style.display="none";var fb=document.createElement("span");fb.style.cssText="color:#fff;font-family:Space Grotesk,monospace;font-weight:800;font-size:10px";fb.textContent="DV";this.parentNode.appendChild(fb);};
  mLogoBox.appendChild(mLogoImg);
  mLogoWrap.appendChild(mLogoBox);
  secTitle.appendChild(mLogoWrap);
  var secIconWrap=el("span",{style:{width:"18px",height:"18px",display:"inline-flex",alignItems:"center"}});
  secIconWrap.className="dv-desktop-sec-icon";
  if(curSec)secIconWrap.innerHTML='<i data-lucide="'+curSec.icon+'"></i>';
  secTitle.appendChild(secIconWrap);
  secTitle.appendChild(span({fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",color:cl.white},curSec?curSec.label:"DubAIVal"));
  header.appendChild(secTitle);

  var controls=el("div",{style:{display:"flex",alignItems:"center",gap:"8px"}});
  controls.appendChild(div({display:"flex",alignItems:"center",gap:"5px",background:"rgba(16,185,129,0.08)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid rgba(16,185,129,0.18)",borderRadius:"999px",padding:"4px 12px",boxShadow:"0 2px 12px rgba(0,0,0,0.2)"},[div({width:"5px",height:"5px",borderRadius:"50%",background:cl.green||"#10B981",animation:"pulse 2s infinite",flexShrink:"0"}),(function(){var lb=el("span",{style:{color:cl.green||"#10B981",fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em"}});lb.textContent="LIVE";return lb;})()]));
  if(typeof renderNotifBell==="function")controls.appendChild(renderNotifBell());
  if(typeof renderAuthButton==="function")controls.appendChild(renderAuthButton());
  var profileBtn=el("button",{style:{background:showProfilePanel?"rgba(212,175,55,0.08)":"rgba(255,255,255,0.04)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid "+(showProfilePanel?"rgba(212,175,55,0.15)":"rgba(255,255,255,0.10)"),borderRadius:"999px",padding:"5px 14px",cursor:"pointer",color:showProfilePanel?cl.gold:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace",transition:"all 0.15s ease",boxShadow:"0 2px 12px rgba(0,0,0,0.2)"}});
  profileBtn.textContent="Profile";
  profileBtn.addEventListener("click",function(){showProfilePanel=!showProfilePanel;render();});
  controls.appendChild(profileBtn);
  header.appendChild(controls);
  main.appendChild(header);

  if(showProfilePanel){
    main.appendChild(renderProfilePanel());
  }

  // Sub-tab pills
  if(curSec&&curSec.subs&&curSec.subs.length>0){
    var pillBar=el("div",{});
    pillBar.className="dv-subtabs";
    curSec.subs.forEach(function(sub){
      var isActive=currentSubTab===sub.id;
      var p=el("button",{});
      p.className="dv-pill"+(isActive?" active":"");
      p.textContent=sub.label;
      p.addEventListener("click",function(){currentSubTab=sub.id;render();});
      pillBar.appendChild(p);
    });
    main.appendChild(pillBar);
  }

  // Content area with per-page gradient blobs
  var content=el("div",{style:{flex:"1",overflow:"auto"}});
  var blobMap={Home:"dv-blobs-home",Market:"dv-blobs-market",Portfolio:"dv-blobs-portfolio",Network:"dv-blobs-network",More:"dv-blobs-more"};
  content.className="dv-page-blobs "+(blobMap[currentSection]||"dv-blobs-home");

  if(currentSection==="Home"){
    content.appendChild(renderHome());
  } else if(currentSection==="Market"){
    if(currentSubTab==="Dashboard"||currentSubTab==="QuickCheck"||currentSubTab==="TrackRecord")content.appendChild(renderMarket());
    else if(currentSubTab==="Analyzer")content.appendChild(renderAnalyzer());
    else if(currentSubTab==="Index")content.appendChild(renderMarketIndex());
    else if(currentSubTab==="Compare")content.appendChild(renderCompare());
    else if(currentSubTab==="Find")content.appendChild(renderFind());
    else if(currentSubTab==="Map")content.appendChild(renderMap());
    else if(currentSubTab==="Advisor")content.appendChild(renderPersonal());
    else content.appendChild(renderMarket());
  } else if(currentSection==="Portfolio"){
    if(currentSubTab==="Assets")content.appendChild(renderPortfolio());
    else if(currentSubTab==="Health")content.appendChild(renderPortfolio());
    else if(currentSubTab==="Projections")content.appendChild(renderPortfolio());
    else if(currentSubTab==="Alerts")content.appendChild(renderAlerts());
    else content.appendChild(renderPortfolio());
  } else if(currentSection==="Network"){
    if(currentSubTab==="Deals")content.appendChild(renderDeals());
    else if(currentSubTab==="AgentHub"&&typeof renderAgentHub==="function")content.appendChild(renderAgentHub());
    else if(currentSubTab==="MediaStudio"&&typeof renderMediaStudio==="function")content.appendChild(renderMediaStudio());
    else if(currentSubTab==="Chat")content.appendChild(renderChat());
    else if(currentSubTab==="Social")content.appendChild(renderSocial());
    else content.appendChild(renderDeals());
  } else if(currentSection==="More"){
    if(currentSubTab==="Workspace")content.appendChild(renderWorkspace());
    else if(currentSubTab==="Reports"&&typeof renderReportBuilder==="function")content.appendChild(renderReportBuilder(el("div",{style:{padding:"20px",maxWidth:"900px",margin:"0 auto"}}),cl));
    else if(currentSubTab==="About")content.appendChild(renderAbout());
    else if(currentSubTab==="Admin")content.appendChild(renderAdmin());
    else content.appendChild(renderWorkspace());
  } else {
    content.appendChild(renderHome());
  }

  main.appendChild(content);

  main.appendChild(div({borderTop:"1px solid "+cl.border,padding:"10px 20px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"4px"},[
    span({color:cl.sub,fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace"},t("footer_tag")),
    span({color:cl.sub,fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace"},t("not_advice")),
  ]));

  layout.appendChild(main);
  app.appendChild(layout);

  // --- BOTTOM TABS (mobile) ---
  var bottomBar=el("div",{});
  bottomBar.className="dv-bottom-tabs";
  NAV_SECTIONS.forEach(function(sec){
    var isActive=currentSection===sec.id;
    var tab=el("div",{});
    tab.className="dv-bottom-tab"+(isActive?" active":"");
    var ic=el("span",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center"}});
    ic.innerHTML='<i data-lucide="'+sec.icon+'"></i>';
    tab.appendChild(ic);
    tab.appendChild(el("span",{},sec.label));
    tab.addEventListener("click",function(){setSection(sec.id);});
    bottomBar.appendChild(tab);
  });
  app.appendChild(bottomBar);

  if(typeof renderAuthModal==="function"){
    var authModal=renderAuthModal();
    if(authModal)app.appendChild(authModal);
  }

  if(window._autoValuate&&analyzerState.f.area&&analyzerState.f.price){
    window._autoValuate=false;
    currentSection="Market";currentSubTab="Analyzer";
    try{analyzerState.val=computeValuation(analyzerState.f);analyzerState.stage=2;}catch(e){}
    setTimeout(render,50);
  }

  checkTourOnLoad();
  if(preserveScroll&&_scrollY)requestAnimationFrame(function(){window.scrollTo(0,_scrollY);});
  if(typeof lucide!=="undefined"&&lucide.createIcons)try{lucide.createIcons();}catch(e){}
}
