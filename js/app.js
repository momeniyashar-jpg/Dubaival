// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- RENDER -------------------------------------------------------------------
function wrapHScroll(scrollEl){
  var wrap=el("div",{style:{position:"relative"}});
  wrap.className="dv-hscroll-wrap";
  wrap.appendChild(scrollEl);
  var bar=el("div",{});bar.className="dv-hscroll-bar";
  var thumb=el("div",{});thumb.className="dv-hscroll-thumb";
  bar.appendChild(thumb);wrap.appendChild(bar);
  function sync(){
    var sw=scrollEl.scrollWidth,cw=scrollEl.clientWidth;
    if(sw<=cw){bar.style.display="none";wrap.classList.add("scrolled-end");return;}
    bar.style.display="block";
    var ratio=cw/sw;var thumbW=Math.max(20,ratio*100);
    thumb.style.width=thumbW+"%";
    thumb.style.left=((scrollEl.scrollLeft/(sw-cw))*(100-thumbW))+"%";
    wrap.classList.toggle("scrolled-end",scrollEl.scrollLeft+cw>=sw-2);
  }
  scrollEl.addEventListener("scroll",sync,{passive:true});
  setTimeout(sync,100);
  return wrap;
}
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

  // Premium header
  var _fndH=el('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',paddingBottom:'16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}});
  var _fndHL=el('div',{});
  _fndHL.appendChild(div({fontSize:'10px',color:'#6B7A9E',fontWeight:'700',fontFamily:"'Inter',sans-serif",letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:'4px'},'AI Property Discovery'));
  _fndHL.appendChild(div({fontSize:'22px',fontWeight:'800',color:'#FFFFFF',fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'-0.02em',lineHeight:'1'},'Find'));
  _fndH.appendChild(_fndHL);
  var _fndBadge=el('div',{style:{display:'flex',alignItems:'center',gap:'5px',background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.20)',borderRadius:'20px',padding:'5px 11px',flexShrink:'0'}});
  _fndBadge.appendChild(span({fontSize:'10px',color:'#3B82F6',fontFamily:"'Space Grotesk',sans-serif",fontWeight:'700',letterSpacing:'0.08em'},'AI'));
  _fndH.appendChild(_fndBadge);
  wrap.appendChild(_fndH);

  if(!window.FIND_STATE)window.FIND_STATE={area:"",building:"",beds:"2 BR",maxPrice:"",minYield:"",type:"Apartment",query:"",results:[],loading:false,searched:false,sort:"score",
    sf:{area:"",grade:"",minYield:"",maxPSF:"",minPSF:"",minGrowth:"",maxDOM:"",minTurnover:"",type:"Apartment",beds:"Any",sort:"yield",showResults:false,results:[],allResults:[],page:0,mapView:false}
  };
  var FS=window.FIND_STATE;

  // Build area and building name lists for autocomplete
  var _areaNames=Object.keys(AREAS).sort();
  var _bldgNames=Object.keys(DB).sort();

  // Natural language search
  const nlWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"}});
  nlWrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Ask in Natural Language"));
  const nlRow=el("div",{style:{display:"flex",gap:"8px"}});
  const nlInp=el("input",{type:"text",placeholder:"e.g. 2BR under 2M in JVC with 7%+ yield, or furnished studio near metro...",style:{flex:"1",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"11px 14px",borderRadius:"10px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none"}});
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

  // Smart Discovery Filter — searches our own building database directly
  // (distinct from the live-listing search above, which queries Bayut/
  // PropertyFinder) — labelled explicitly so it doesn't read as a
  // duplicate of the search/filters above.
  var sf=FS.sf;
  var sfCard=el("div",{style:{background:cl.surface,border:"1px solid "+(sf.showResults?cl.goldDim:cl.border),borderRadius:"14px",padding:"18px",marginBottom:"14px",position:"relative",overflow:"hidden"}});
  sfCard.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,#C9A84C,#C9A84C,transparent)",animation:"shimmer 3s ease infinite"}));
  sfCard.appendChild(span({color:"#D4A843",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"◆ Smart Property Discovery"));
  sfCard.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",display:"block",marginBottom:"14px"},"Different from the search above — this searches our own "+Object.keys(DB).length.toLocaleString()+"-building database directly by yield, growth, price & liquidity, not live market listings"));

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

  sfCard.appendChild(btn({width:"100%",padding:"11px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#C9A84C,#D4A843)",color:"#fff",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em"},"DISCOVER PROPERTIES ◆",function(){
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
    sf.allResults=results;sf.results=results.slice(0,50);sf.page=0;
    sf.showResults=true;
    render();
  }));
  wrap.appendChild(sfCard);

  // Smart Discovery Results
  if(sf.showResults&&sf.results.length>0){
    var sfResCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px"});
    var _sfHdr=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"});
    _sfHdr.appendChild(span({color:"#D4A843",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"◆ "+sf.results.length+(sf.allResults&&sf.allResults.length>sf.results.length?" of "+sf.allResults.length:"")+" Buildings Found"));
    var _sfHdrBtns=div({display:"flex",gap:"6px"});
    _sfHdrBtns.appendChild(el("button",{style:{background:sf.mapView?"rgba(201,168,76,0.15)":"transparent",border:"1px solid "+(sf.mapView?"rgba(201,168,76,0.4)":cl.border),color:sf.mapView?"#D4A843":cl.sub,padding:"4px 10px",borderRadius:"6px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:function(){sf.mapView=!sf.mapView;render();}},sf.mapView?"≡ List":"◆ Map"));
    _sfHdrBtns.appendChild(btn({background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"4px 10px",borderRadius:"6px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"Clear",function(){sf.showResults=false;sf.results=[];sf.mapView=false;render();}));
    _sfHdr.appendChild(_sfHdrBtns);
    sfResCard.appendChild(_sfHdr);
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
    if(!sf.mapView){
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
    if(sf.allResults&&sf.allResults.length>sf.results.length){
      var sfLoadMore=el("button",{style:{width:"100%",padding:"10px",marginTop:"8px",borderRadius:"10px",border:"1px solid rgba(201,168,76,0.4)",background:"rgba(122,94,40,0.08)",color:"#D4A843",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",letterSpacing:"0.06em"}});
      sfLoadMore.textContent="Load More ("+(sf.allResults.length-sf.results.length)+" remaining)";
      sfLoadMore.addEventListener("click",function(){sf.page=(sf.page||0)+1;sf.results=sf.allResults.slice(0,50*(sf.page+1));render();});
      sfResCard.appendChild(sfLoadMore);
    }
      sfResCard.appendChild(div({marginTop:"10px",padding:"8px 10px",background:cl.goldFaint,borderRadius:"6px",fontSize:"10px",color:cl.sub,fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},"Click any building to open it in the Analyzer for full valuation."));
    }else{
      // Map view — group results by area and render Google Maps circles
      var _sfAG={};
      sf.results.forEach(function(r){
        if(!_sfAG[r.area])_sfAG[r.area]={count:0,totalYield:0,buildings:[],coords:null};
        _sfAG[r.area].count++;_sfAG[r.area].totalYield+=r.yield;_sfAG[r.area].buildings.push(r);
        if(!_sfAG[r.area].coords&&typeof AREA_COORDS!=="undefined"&&AREA_COORDS[r.area])_sfAG[r.area].coords=AREA_COORDS[r.area];
      });
      var sfMapId2="dv-sf-gmap-"+Date.now();
      sfResCard.appendChild(el("div",{style:{width:"100%",height:"380px",borderRadius:"10px",overflow:"hidden"},id:sfMapId2}));
      sfResCard.appendChild(div({marginTop:"8px",fontSize:"10px",color:cl.sub,fontFamily:"'Inter',sans-serif",textAlign:"center"},"Click area circles to explore buildings · Circle size = buildings found"));
      setTimeout(function(){
        var sfc=document.getElementById(sfMapId2);if(!sfc||typeof _dvGmapLoad!=="function")return;
        _dvGmapLoad(function(){
          var sfc2=document.getElementById(sfMapId2);if(!sfc2)return;
          var sfGm=new google.maps.Map(sfc2,{center:{lat:25.15,lng:55.22},zoom:11,styles:typeof _GMAP_DARK_STYLES!=="undefined"?_GMAP_DARK_STYLES:[],zoomControl:true,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,gestureHandling:"greedy"});
          var sfIW=new google.maps.InfoWindow();
          Object.entries(_sfAG).forEach(function(ae){
            var aName=ae[0],ag=ae[1];if(!ag.coords)return;
            var avgY=ag.totalYield/ag.count;
            var color=avgY>=8?"#00C896":avgY>=6?"#F0A030":"#F04060";
            var radius=Math.max(200,Math.min(700,ag.count*180));
            var circle=new google.maps.Circle({map:sfGm,center:{lat:ag.coords[0],lng:ag.coords[1]},radius:radius,strokeColor:color,strokeOpacity:0.9,strokeWeight:2,fillColor:color,fillOpacity:0.35,clickable:true});
            var bHtml=ag.buildings.slice(0,5).map(function(b){return'<div style="font-size:10px;color:'+cl.white+';margin-bottom:3px;">'+b.name+' · AED '+b.psf.toLocaleString()+'/sqft</div>';}).join('')+(ag.buildings.length>5?'<div style="font-size:9px;color:#6B7A9E;margin-top:4px;">+'+(ag.buildings.length-5)+' more</div>':'');
            var popHtml='<div style="font-family:\'Space Grotesk\',monospace;min-width:180px;color:'+cl.white+';padding:10px;"><div style="color:#D4A843;font-size:12px;font-weight:700;margin-bottom:6px;">'+aName+'</div><div style="font-size:10px;color:'+cl.sub+';margin-bottom:8px;">'+ag.count+' building'+(ag.count>1?'s':'')+' · Avg Yield '+avgY.toFixed(1)+'%</div>'+bHtml+'</div>';
            circle.addListener("click",function(){sfIW.setContent(popHtml);sfIW.setPosition({lat:ag.coords[0],lng:ag.coords[1]});sfIW.open(sfGm);});
            circle.addListener("mouseover",function(){circle.setOptions({fillOpacity:0.65,strokeWeight:3});});
            circle.addListener("mouseout",function(){circle.setOptions({fillOpacity:0.35,strokeWeight:2});});
          });
        });
      },80);
    }
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
      (function(){
        var imgEl=el("img",{referrerpolicy:"no-referrer",crossorigin:"anonymous",style:{width:"80px",height:"60px",borderRadius:"8px",objectFit:"cover",flexShrink:"0"}});
        var _ac3=typeof AREA_COORDS!=="undefined"&&AREA_COORDS[r.area]?AREA_COORDS[r.area]:null;
        var mapFallback=_ac3?"/api/proxy-maps?action=staticmap&lat="+_ac3[0]+"&lng="+_ac3[1]+"&zoom=15&size=80x60":"";
        if(r.photo){
          imgEl.src=r.photo;
          imgEl.onerror=function(){if(mapFallback){this.src=mapFallback;this.onerror=function(){this.style.display="none";};}else{this.style.display="none";}};
          topRow.appendChild(imgEl);
        }else if(mapFallback){
          imgEl.loading="lazy";
          imgEl.src=mapFallback;
          imgEl.onerror=function(){this.style.display="none";};
          topRow.appendChild(imgEl);
        }
      })();
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
        var agentRow=el("div",{style:{display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",background:cl.surface,borderRadius:"8px",marginBottom:"8px"}});
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
        var params=new URLSearchParams({locationExternalIDs:locId,purpose:"for-sale",hitsPerPage:"50",page:String(pageNum)});
        if(beds){params.set("rooms_min",String(bn));params.set("rooms_max",String(bn));}
        if(maxPrice>0)params.set("priceMax",String(maxPrice));
        var r;
        if(UAE_RE_KEY){r=await fetch("https://"+UAE_RE_HOST+"/properties/list?"+params,{headers:{"x-rapidapi-key":UAE_RE_KEY,"x-rapidapi-host":UAE_RE_HOST}});}
        else{r=await fetch(API_BASE+"/proxy-rapidapi?endpoint=properties/list&"+params);}
        if(!r.ok)return[];
        var d=await r.json();
        var hits=d.hits||[];
        FS.hasMore=hits.length>=50;
        return hits.filter(function(p){return p.price&&p.area;}).map(function(p){
          var psf=p.area>0?Math.round(p.price/p.area):0;
          var locName=p.location&&p.location.length>0?p.location[p.location.length-1].name:(area||"Dubai");
          var imgUrl="";
          if(p.coverPhoto){imgUrl=typeof p.coverPhoto==="string"?p.coverPhoto:(p.coverPhoto.url||p.coverPhoto.thumb||"");}
          if(!imgUrl&&p.mainPhoto){imgUrl=typeof p.mainPhoto==="string"?p.mainPhoto:(p.mainPhoto.url||p.mainPhoto.thumb||"");}
          if(!imgUrl&&p.photos&&p.photos.length>0){var ph0=p.photos[0];imgUrl=typeof ph0==="string"?ph0:(ph0.url||ph0.thumb||"");}
          if(!imgUrl)imgUrl=p.thumbnail||p.image||"";
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
            photo:imgUrl,
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
          var rawPF=Array.isArray(d.data)?d.data:(d.data&&Array.isArray(d.data.data)?d.data.data:(d.data&&Array.isArray(d.data.properties)?d.data.properties:(d.hits||d.properties||d.results||[])));
          var items=Array.isArray(rawPF)?rawPF:[];
          return items.filter(function(p){
            var price=p.price&&typeof p.price==="object"?p.price.value:p.price;
            var size=typeof p.size==="number"?p.size:(typeof p.area==="number"?p.area:(typeof p.sqft==="number"?p.sqft:0));
            return price&&size>0&&price>0;
          }).map(function(p){
            var price=p.price&&typeof p.price==="object"?p.price.value:p.price;
            var size=typeof p.size==="number"?p.size:(typeof p.area==="number"?p.area:(typeof p.sqft==="number"?p.sqft:0));
            var imgUrl=p.cover_photo||"";
            if(!imgUrl){var imgs=p.images||p.photos||[];if(Array.isArray(imgs)&&imgs.length>0){imgUrl=typeof imgs[0]==="string"?imgs[0]:(imgs[0].url||imgs[0].src||imgs[0].thumb||"");}}
            if(!imgUrl)imgUrl=p.thumbnail||p.image||p.photo||"";
            var areaName=p.location_name||p.community_name||p.area_name||(typeof p.area==="string"?p.area:"")||area||"Dubai";
            return{
              title:p.title||"Property",
              area:areaName,
              price:price,
              size:size,
              psf:size>0?Math.round(price/size):0,
              beds:p.bedrooms||p.rooms||p.beds||bn,
              baths:p.bathrooms||p.baths||0,
              floor:"",
              furnished:p.furnishing||p.furnished||"",
              permit:"",
              agentName:p.agent_name||"",
              agencyName:p.agency_name||"",
              agentPhone:"",
              agentWA:"",
              photo:imgUrl,
              listingUrl:p.url||p.link||p.property_url||"https://www.propertyfinder.ae",
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
  // Premium header
  var _alH=el('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',paddingBottom:'16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}});
  var _alHL=el('div',{});
  _alHL.appendChild(div({fontSize:'10px',color:'#6B7A9E',fontWeight:'700',fontFamily:"'Inter',sans-serif",letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:'4px'},'Price Intelligence'));
  _alHL.appendChild(div({fontSize:'22px',fontWeight:'800',color:'#FFFFFF',fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'-0.02em',lineHeight:'1'},'Deal Alerts'));
  _alH.appendChild(_alHL);
  var _alBadge=el('div',{style:{display:'flex',alignItems:'center',gap:'5px',background:'rgba(212,168,67,0.08)',border:'1px solid rgba(212,168,67,0.20)',borderRadius:'20px',padding:'5px 11px',flexShrink:'0'}});
  var _alDot=el('div',{style:{width:'6px',height:'6px',borderRadius:'50%',background:'#D4A843',animation:'dvPulse 2s ease infinite'}});
  _alBadge.appendChild(_alDot);
  _alBadge.appendChild(span({fontSize:'10px',color:'#D4A843',fontFamily:"'Space Grotesk',sans-serif",fontWeight:'700',letterSpacing:'0.08em'},'WATCH'));
  _alH.appendChild(_alBadge);
  wrap.appendChild(_alH);

  // Two-column layout hint
  var twoColNote=el("div",{style:{background:"rgba(212,175,55,0.05)",border:"1px solid rgba(212,175,55,0.18)",borderRadius:"10px",padding:"9px 13px",marginBottom:"14px",display:"flex",gap:"10px",alignItems:"center"}});
  twoColNote.appendChild(div({color:"#D4AF37",fontSize:"14px",flexShrink:"0"},"💡"));
  twoColNote.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},"Deal Alerts scan the database instantly. Price Watch sends you an email when a specific building or area price moves 5%+."));
  wrap.appendChild(twoColNote);

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
  aBox.appendChild(mkSelect({width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",outline:"none"},["Any"].concat(Object.keys(AREAS)),AF.area||"Any",function(v){AF.area=v==="Any"?"":v;}));
  r1.appendChild(aBox);
  const tBox=el("div",{});
  tBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Type"));
  tBox.appendChild(mkSelect({width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",outline:"none"},["Any","Apartment","Villa"],AF.type||"Any",function(v){AF.type=v;}));
  r1.appendChild(tBox);
  formWrap.appendChild(r1);

  // Row 2: Max PSF + Min Yield
  const r2=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}});
  const pBox=el("div",{});
  pBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Max PSF (AED)"));
  const pInp=el("input",{type:"number",placeholder:"e.g. 2000",style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
  pInp.value=AF.maxPSF||"";
  pInp.addEventListener("input",function(){AF.maxPSF=this.value;});
  pBox.appendChild(pInp);
  r2.appendChild(pBox);
  const yBox=el("div",{});
  yBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Min Yield %"));
  const yInp=el("input",{type:"number",placeholder:"e.g. 7",style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
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

  // ── EMAIL PRICE WATCH ──────────────────────────────────────────────────────
  var pwWrap=el("div",{style:{marginTop:"20px"}});
  pwWrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px",borderLeft:"3px solid rgba(212,168,67,0.6)",paddingLeft:"10px"},"Email Price Watch"));
  var pwCard=el("div",{style:{background:cl.surface,border:"1px solid rgba(212,168,67,0.22)",borderRadius:"14px",padding:"16px"}});
  pwCard.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",marginBottom:"12px"},"Get an email when a building or area price moves 5%+. Powered by live market data, checked daily."));

  if(!window.PW_FORM)window.PW_FORM={type:"area",target:"",email:"",status:"",err:""};
  var PW=window.PW_FORM;

  // Target type toggle
  var pwTypeRow=el("div",{style:{display:"flex",gap:"6px",marginBottom:"10px"}});
  ["area","building"].forEach(function(t){
    var tb=el("button",{style:{flex:"1",padding:"7px",borderRadius:"7px",border:"1px solid "+(PW.type===t?"rgba(212,168,67,0.6)":"rgba(212,168,67,0.2)"),background:PW.type===t?"rgba(212,168,67,0.12)":"transparent",color:PW.type===t?"#D4A843":cl.sub,fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    tb.textContent=t==="area"?"Area":"Building";
    tb.addEventListener("click",function(){PW.type=t;PW.target="";PW.status="";PW.err="";render();});
    pwTypeRow.appendChild(tb);
  });
  pwCard.appendChild(pwTypeRow);

  // Target selector
  var pwTgtLabel=div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},PW.type==="area"?"Area":"Building");
  pwCard.appendChild(pwTgtLabel);
  if(PW.type==="area"){
    var pwAreaSel=mkSelect({width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",outline:"none",marginBottom:"8px"},["Select area…"].concat(Object.keys(AREAS)),PW.target||"Select area…",function(v){PW.target=v==="Select area…"?"":v;});
    pwCard.appendChild(pwAreaSel);
  }else{
    var pwBldgInp=el("input",{type:"text",placeholder:"Building name…",style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"8px"}});
    pwBldgInp.value=PW.target||"";
    pwBldgInp.addEventListener("input",function(){PW.target=this.value;});
    pwCard.appendChild(pwBldgInp);
  }

  // Email input
  pwCard.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Email"));
  var pwEmailInp=el("input",{type:"email",placeholder:"your@email.com",style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"10px"}});
  pwEmailInp.value=PW.email||"";
  pwEmailInp.addEventListener("input",function(){PW.email=this.value;});
  pwCard.appendChild(pwEmailInp);

  // Status messages
  if(PW.status){
    var pwOk=el("div",{style:{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:"8px",padding:"8px 12px",marginBottom:"8px",color:"#10B981",fontSize:"11px",fontFamily:"'Inter',sans-serif"}});
    pwOk.textContent="✓ "+PW.status;
    pwCard.appendChild(pwOk);
  }
  if(PW.err){
    var pwErr=el("div",{style:{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"8px",padding:"8px 12px",marginBottom:"8px",color:"#EF4444",fontSize:"11px",fontFamily:"'Inter',sans-serif"}});
    pwErr.textContent=PW.err;
    pwCard.appendChild(pwErr);
  }

  // Submit
  var pwBtn=el("button",{style:{width:"100%",padding:"11px",borderRadius:"8px",border:"none",background:"linear-gradient(135deg,#C9A84C,#7A5E28)",color:"#FFF",fontSize:"13px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
  pwBtn.textContent="Set Price Watch";
  pwBtn.addEventListener("click",function(){
    var em=(PW.email||"").trim().toLowerCase();
    var tgt=(PW.target||"").trim();
    if(!tgt){PW.err="Please select a "+(PW.type==="area"?"area":"building");PW.status="";render();return;}
    if(!em||!em.includes("@")){PW.err="Please enter a valid email address.";PW.status="";render();return;}
    PW.err="";pwBtn.disabled=true;pwBtn.textContent="Setting up…";
    fetch("/api/price-alerts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:em,targetName:tgt,targetType:PW.type,area:PW.type==="building"?null:tgt})})
      .then(function(r){return r.json();})
      .then(function(d){
        if(d.ok){PW.status="Watch set! Check your email for confirmation.";if(typeof dvTrack==="function")dvTrack("price_alert_subscribed",{area:PW.type==="building"?null:tgt,type:PW.type});PW.target="";PW.email="";}
        else{PW.err="Error: "+(d.error||"Please try again");}
        render();
      })
      .catch(function(){PW.err="Network error — please try again.";render();});
  });
  pwCard.appendChild(pwBtn);
  pwWrap.appendChild(pwCard);
  wrap.appendChild(pwWrap);

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
  h+='<div style="font-size:8px;color:#aaa;margin-top:16px;border-top:1px solid #eee;padding-top:8px">This is an AI-generated estimate for informational purposes only (accuracy '+val.confTier.range+'), based on DLD transaction data and live market listings. It is not a RERA- or RICS-certified valuation and should not be relied upon as the sole basis for a buying, selling, or financing decision. For an official valuation, consult a RERA-registered valuer. &bull; Generated '+dateStr+'</div>';
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
  h+='<div style="font-size:8px;color:#aaa;margin-top:12px">هذا تقدير آلي لأغراض معلوماتية فقط، استناداً إلى بيانات معاملات دائرة الأراضي والأملاك والإعلانات الحية. وهو ليس تقييماً معتمداً من RERA أو RICS، ولا ينبغي الاعتماد عليه كأساس وحيد لقرار الشراء أو البيع أو التمويل. للحصول على تقييم رسمي، يرجى استشارة مقيّم معتمد لدى RERA. &bull; تاريخ الإصدار: '+dateStr+'</div>';
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
function _dvNearestArea(lat,lng){
  var best=null,bestDist=Infinity;
  if(typeof AREA_COORDS==="undefined"||typeof AREAS==="undefined")return null;
  Object.entries(AREA_COORDS).forEach(function(e){
    var name=e[0],c=e[1];
    if(!AREAS[name])return;
    var dLat=(c[0]-lat)*Math.PI/180;
    var dLng=(c[1]-lng)*Math.PI/180;
    var a=Math.sin(dLat/2)*Math.sin(dLat/2)+
          Math.cos(lat*Math.PI/180)*Math.cos(c[0]*Math.PI/180)*
          Math.sin(dLng/2)*Math.sin(dLng/2);
    var d=6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    if(d<bestDist){bestDist=d;best=name;}
  });
  return bestDist<8?best:null;
}

function updateSearchSuggestions(query){
  var suggestEl=document.getElementById("dv-search-suggestions");
  if(!suggestEl)return;
  if(!query||query.length<2){suggestEl.innerHTML="";clearTimeout(window._dvPlacesTimer);return;}
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
      if(keyWords[0].startsWith(q))score=90;
    } else if(qWords.every(function(w){return keyWords.some(function(kw){return kw.startsWith(w);});})){
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

  if(results.length===0&&query.length<3){suggestEl.innerHTML="";return;}

  var cl=C();
  suggestEl.innerHTML="";
  suggestEl.dataset.dvQuery=query;

  if(results.length>0){
    suggestEl.style.cssText="background:"+cl.surface+";border:1px solid "+cl.gold+";border-radius:12px;margin-top:4px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.4);position:absolute;width:100%;z-index:100;";
    results.forEach(function(r,i){
      var item=document.createElement("button");
      item.style.cssText="width:100%;padding:12px 16px;background:transparent;border:none;border-bottom:"+(i<results.length-1?"1px solid "+cl.border:"none")+";color:"+cl.white+";font-size:13px;cursor:pointer;text-align:left;font-family:'Inter',sans-serif;display:block;";
      var nameCap=r.name.split(" ").map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(" ");
      var typeLabel=r.type==="community"?" (Community)":r.type==="cluster"?" (Cluster)":"";
      var info=r.area+(r.psf?" · AED "+r.psf.toLocaleString()+" PSF":"")+(r.g?" · "+r.g:"")+(r.type==="community"&&r.clusters?" · "+r.clusters.length+" clusters":"");
      item.innerHTML="<div style='font-weight:600;margin-bottom:2px'>"+nameCap+typeLabel+"</div><div style='font-size:10px;color:"+cl.sub+";font-family:Space Grotesk,monospace'>"+info+"</div>";
      item.addEventListener("mouseenter",function(){this.style.background=cl.raised;});
      item.addEventListener("mouseleave",function(){this.style.background="transparent";});
      item.addEventListener("mousedown",function(e){
        e.preventDefault();
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

  // Google Places tier: kick in when local results are sparse (< 4) and query >= 3 chars
  if(query.length>=3&&results.length<4){
    clearTimeout(window._dvPlacesTimer);
    window._dvPlacesTimer=setTimeout(function(){
      fetch("/api/proxy-maps?action=places&q="+encodeURIComponent(query))
        .then(function(r){return r.json();})
        .then(function(d){
          if(suggestEl.dataset.dvQuery!==query)return; // Stale — user typed more
          if(!d.predictions||!d.predictions.length)return;
          // Filter out names already shown from local DB
          var localNames=results.map(function(r){return r.name.toLowerCase();});
          var extra=d.predictions.filter(function(p){
            var pn=p.name.toLowerCase();
            return !localNames.some(function(n){return n===pn||n.startsWith(pn)||pn.startsWith(n);});
          }).slice(0,5);
          if(!extra.length)return;

          if(!suggestEl.children.length){
            suggestEl.style.cssText="background:"+cl.surface+";border:1px solid "+cl.gold+";border-radius:12px;margin-top:4px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.4);position:absolute;width:100%;z-index:100;";
          }

          // Section divider
          var div2=document.createElement("div");
          div2.style.cssText="padding:5px 14px;background:rgba(212,175,55,0.07);border-top:"+(results.length?"1px solid "+cl.border:"none")+";display:flex;align-items:center;gap:7px;";
          div2.innerHTML="<svg width='11' height='11' viewBox='0 0 48 48' style='flex-shrink:0'><path fill='#4285f4' d='M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z'/></svg><span style='font-size:9px;font-weight:700;letter-spacing:.09em;font-family:Space Grotesk,monospace;color:#D4AF37;text-transform:uppercase;'>Google</span><span style='font-size:9px;color:#6B7A9E;font-family:Space Grotesk,monospace;'>not yet in our database — area auto-detected</span>";
          suggestEl.appendChild(div2);

          extra.forEach(function(p){
            var item=document.createElement("button");
            item.style.cssText="width:100%;padding:10px 16px;background:transparent;border:none;border-top:1px solid "+cl.border+";color:"+cl.white+";font-size:13px;cursor:pointer;text-align:left;font-family:'Inter',sans-serif;display:flex;align-items:center;gap:8px;";
            item.innerHTML="<div style='flex:1;min-width:0'><div style='font-weight:600;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'>"+escHtml(p.name)+"</div><div style='font-size:10px;color:#6B7A9E;font-family:Space Grotesk,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'>"+escHtml(p.address)+"</div></div><div style='flex-shrink:0;font-size:9px;padding:2px 6px;background:rgba(66,133,244,0.12);border:1px solid rgba(66,133,244,0.25);border-radius:4px;color:#88aaee;font-family:Space Grotesk,monospace'>area detect</div>";
            item.addEventListener("mouseenter",function(){this.style.background=cl.raised;});
            item.addEventListener("mouseleave",function(){this.style.background="transparent";});
            item.addEventListener("mousedown",function(e){
              e.preventDefault();
              var bldgName=p.name;
              suggestEl.innerHTML="";
              analyzerState.f.building=bldgName;
              analyzerState.f._googleBuilding=true;
              render();
              // Geocode → nearest benchmark area
              fetch("/api/proxy-maps?action=geocode&address="+encodeURIComponent(bldgName+", Dubai"))
                .then(function(r){return r.json();})
                .then(function(geo){
                  if(!geo.lat)return;
                  var area=_dvNearestArea(geo.lat,geo.lng);
                  if(area){analyzerState.f.area=area;analyzerState.f._googleBuilding=true;render();}
                })
                .catch(function(){});
            });
            suggestEl.appendChild(item);
          });
        })
        .catch(function(){});
    },380);
  }
}


// ── ADMIN PANEL ───────────────────────────────────────────────────────────────
function renderAdmin(){
  var cl=C();
  var wrap=el("div",{style:{padding:"20px",maxWidth:"500px",margin:"0 auto"}});
  
  // Password check
  if(!window.ADMIN_UNLOCKED){
    var pwWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"24px",marginTop:"40px"}});
    pwWrap.appendChild(div({color:cl.gold,fontSize:"12px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"16px"},"◆ DubAIVal Admin"));
    var pwInp=el("input",{type:"password",placeholder:"Enter admin password",style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"12px",borderRadius:"8px",fontSize:"14px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"10px"}});
    var pwBtn=el("button",{style:{width:"100%",padding:"12px",background:"linear-gradient(135deg,#C9A84C,#7A5E28)",color:"#08090C",border:"none",borderRadius:"8px",fontSize:"14px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
    pwBtn.textContent="Login";
    pwBtn.addEventListener("click",async function(){
      // Brute-force lockout: 5 failed attempts → 30 min lockout
      var lockKey="dv_admin_lock";var attKey="dv_admin_att";
      try{
        var lockUntil=parseInt(sessionStorage.getItem(lockKey)||"0");
        if(Date.now()<lockUntil){var rem=Math.ceil((lockUntil-Date.now())/60000);pwInp.placeholder="Locked — try again in "+rem+"m";pwInp.style.borderColor="#EF4444";return;}
        var pwVal=pwInp.value;
        pwBtn.textContent="Verifying...";
        // Password is verified server-side (Supabase RPC) — never hashed/compared
        // client-side, so the credential can't be read out of the JS bundle.
        var vResp=await fetch(SUPABASE_URL+"/rest/v1/rpc/admin_verify",{
          method:"POST",
          headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"},
          body:JSON.stringify({p_admin_password:pwVal})
        });
        var verified=vResp.ok&&(await vResp.json())===true;
        if(verified){
          sessionStorage.removeItem(lockKey);sessionStorage.removeItem(attKey);
          window._adminPw=pwVal;
          window.ADMIN_UNLOCKED=true;render();
        } else {
          var att=parseInt(sessionStorage.getItem(attKey)||"0")+1;
          sessionStorage.setItem(attKey,att);
          if(att>=5){sessionStorage.setItem(lockKey,Date.now()+30*60*1000);sessionStorage.removeItem(attKey);pwInp.placeholder="Too many attempts — locked 30 min";}
          pwBtn.textContent="Login";
          pwInp.style.borderColor="#EF4444";pwInp.value="";
        }
      }catch(e){pwBtn.textContent="Login";pwInp.style.borderColor="#EF4444";pwInp.value="";}
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
    var ok=await saveSupabaseConfig(MACRO_VARS.aptAdj,MACRO_VARS.villaAdj,label,window._adminPw);
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
    row.appendChild(span({color:typColor,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",background:cl.raised,padding:"2px 6px",borderRadius:"8px"},entry.type));
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
  "Deals":["Network","Deals"],"AgentHub":["Network","AgentHub"],"Chat":["Network","Chat"],
  "Health":["Portfolio","Health"],"Projections":["Portfolio","Projections"],
  "Workspace":["More","Workspace"],"About":["More","About"],"Admin":["More","Admin"],
  "Reports":["More","Reports"],
  "SocialStudio":["SocialMedia","Studio"],"SocialAvatar":["SocialMedia","Avatar"],
  "SocialVideo":["SocialMedia","VideoPlatform"],"SocialChat":["SocialMedia","SocialChat"],
  "MediaStudio":["SocialMedia","Studio"],"Social":["SocialMedia","VideoPlatform"]
};

// ─── Top Opportunities Engine ─────────────────────────────────────────────────
// TODO: When DLD live API is integrated, rename to "Market Moments" and upgrade
// to use real-time transaction data instead of static AREAS database.
function generateMarketMoments(){
  var entries=Object.entries(AREAS).filter(function(e){return e[1].psf>0;});
  function aY(a){return a.y?((a.y[0]+a.y[1])/2):0;}
  function g1(a){return a.g?a.g[0]:0;}
  function g5(a){return a.g?a.g[2]:0;}

  var byYield=entries.slice().sort(function(a,b){return aY(b[1])-aY(a[1]);});
  var byG1=entries.filter(function(e){return g1(e[1])>0;}).sort(function(a,b){return g1(b[1])-g1(a[1]);});
  var byG5=entries.filter(function(e){return g5(e[1])>0;}).sort(function(a,b){return g5(b[1])-g5(a[1]);});
  var byDom=entries.filter(function(e){return e[1].dom>0;}).sort(function(a,b){return a[1].dom-b[1].dom;});
  var byScore=entries.filter(function(e){return e[1].y&&e[1].g&&e[1].dom;}).map(function(e){
    var a=e[1];
    return {name:e[0],data:a,score:aY(a)*3+g1(a)*1.5+g5(a)*0.4+(30-Math.min(a.dom,30))*0.6};
  }).sort(function(a,b){return b.score-a.score;});

  var moments=[];
  var usedAreas={};

  if(byYield.length){
    var t=byYield[0];
    usedAreas[t[0]]=1;
    moments.push({icon:"zap",timing:"YIELD CHAMPION",timingColor:"#F59E0B",
      text:t[0]+" averaging "+aY(t[1]).toFixed(1)+"% gross yield — highest in Dubai right now",
      tag:"OPPORTUNITY",tagColor:"#10B981",area:t[0]});
  }
  if(byG1.length&&!usedAreas[byG1[0][0]]){
    var t=byG1[0];usedAreas[t[0]]=1;
    moments.push({icon:"trending-up",timing:"1-YEAR GROWTH LEADER",timingColor:"#3B82F6",
      text:t[0]+" up "+g1(t[1]).toFixed(1)+"% this year — Dubai's fastest-growing area",
      tag:"TRENDING",tagColor:"#3B82F6",area:t[0]});
  }else if(byG1.length>1&&!usedAreas[byG1[1][0]]){
    var t=byG1[1];usedAreas[t[0]]=1;
    moments.push({icon:"trending-up",timing:"1-YEAR GROWTH LEADER",timingColor:"#3B82F6",
      text:t[0]+" up "+g1(t[1]).toFixed(1)+"% this year — one of Dubai's fastest-growing areas",
      tag:"TRENDING",tagColor:"#3B82F6",area:t[0]});
  }
  (function(){
    for(var gi=0;gi<byG5.length;gi++){
      if(!usedAreas[byG5[gi][0]]){
        var t=byG5[gi];usedAreas[t[0]]=1;
        var rate=(g5(t[1])/5).toFixed(1);
        moments.push({icon:"flame",timing:"5-YEAR CAPITAL STORY",timingColor:"#EF4444",
          text:t[0]+": "+g5(t[1]).toFixed(0)+"% appreciation over 5 years — compounding at "+rate+"%/yr",
          tag:"LONG-TERM",tagColor:"#8B5CF6",area:t[0]});
        break;
      }
    }
  })();
  (function(){
    for(var si=0;si<byScore.length;si++){
      if(!usedAreas[byScore[si].name]){
        var t=byScore[si];usedAreas[t.name]=1;
        moments.push({icon:"crosshair",timing:"BEST COMBINED SCORE TODAY",timingColor:"#D4AF37",
          text:t.name+": "+aY(t.data).toFixed(1)+"% yield + "+g1(t.data).toFixed(1)+"% growth — highest opportunity score in Dubai",
          tag:"BEST VALUE",tagColor:"#D4AF37",area:t.name});
        break;
      }
    }
  })();
  (function(){
    for(var di=0;di<byDom.length;di++){
      if(!usedAreas[byDom[di][0]]){
        var t=byDom[di];
        moments.push({icon:"gem",timing:"FASTEST-SELLING MARKET",timingColor:"#10B981",
          text:t[0]+" properties selling in avg "+t[1].dom+" days — most liquid market in Dubai",
          tag:"LIQUID",tagColor:"#10B981",area:t[0]});
        break;
      }
    }
  })();

  // Personalized "For You" — prepended if user has a recent area
  var personalArea=null;
  try{
    if(window._qcState&&window._qcState.area&&AREAS[window._qcState.area])personalArea=window._qcState.area;
    else if(window.analyzerState&&analyzerState.f&&analyzerState.f.area&&AREAS[analyzerState.f.area])personalArea=analyzerState.f.area;
  }catch(ex){}
  if(personalArea){
    var pd=AREAS[personalArea];
    moments.unshift({icon:"star",timing:"FOR YOU",timingColor:"#8B5CF6",
      text:personalArea+": "+aY(pd).toFixed(1)+"% yield · "+g1(pd).toFixed(1)+"% YoY growth · AED "+pd.psf.toLocaleString()+" PSF — last area you checked",
      tag:"PERSONAL",tagColor:"#8B5CF6",area:personalArea,isPersonal:true});
  }

  return moments.slice(0,5);
}

function renderMarketMoments(cl){
  if(!document.getElementById("dv-moments-style")){
    var s=document.createElement("style");s.id="dv-moments-style";
    s.textContent="@keyframes dvFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes dvPulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.8)}}";
    document.head.appendChild(s);
  }
  var moments=generateMarketMoments();
  var sec=el("div",{style:{marginBottom:"24px"}});

  // Header
  var hdr=el("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}});
  hdr.appendChild(div({fontSize:"12px",color:cl.sub,fontWeight:"700",fontFamily:"'Inter',sans-serif",letterSpacing:"0.06em",textTransform:"uppercase"},"Top Opportunities"));
  var liveRow=el("div",{style:{display:"flex",alignItems:"center",gap:"5px"}});
  var dot=el("div",{style:{width:"7px",height:"7px",borderRadius:"50%",background:"#10B981",animation:"dvPulseDot 2s ease-in-out infinite"}});
  liveRow.appendChild(dot);
  liveRow.appendChild(span({color:"#10B981",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",fontWeight:"700",letterSpacing:"0.08em"},"LIVE"));
  hdr.appendChild(liveRow);
  sec.appendChild(hdr);

  moments.forEach(function(m,i){
    var borderCol=m.isPersonal?"rgba(139,92,246,0.35)":cl.border;
    var card=el("div",{style:{
      background:cl.surface,borderRadius:"14px",padding:"13px 15px",marginBottom:"8px",
      border:"1px solid "+borderCol,cursor:"pointer",
      display:"flex",alignItems:"flex-start",gap:"12px",
      transition:"background 0.18s ease,border-color 0.18s ease",
      opacity:"0",animation:"dvFadeUp 0.32s ease "+(i*0.07)+"s both"
    }});
    var iconEl=el("div",{style:{width:"34px",height:"34px",borderRadius:"10px",background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:"0"}});
    iconEl.innerHTML='<i data-lucide="'+m.icon+'" style="width:18px;height:18px;color:'+m.timingColor+';stroke-width:1.8"></i>';
    card.appendChild(iconEl);
    var body=el("div",{style:{flex:"1",minWidth:"0"}});
    var tEl=el("div",{style:{fontSize:"9px",fontWeight:"700",color:m.timingColor,fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.11em",marginBottom:"3px"}});
    tEl.textContent=m.timing;
    body.appendChild(tEl);
    var txtEl=el("div",{style:{fontSize:"13px",color:cl.white,fontFamily:"'Inter',sans-serif",lineHeight:"1.45",fontWeight:"500"}});
    txtEl.textContent=m.text;
    body.appendChild(txtEl);
    card.appendChild(body);
    var badge=el("div",{style:{
      background:m.tagColor+"18",color:m.tagColor,
      border:"1px solid "+m.tagColor+"45",borderRadius:"6px",
      padding:"3px 7px",fontSize:"9px",fontWeight:"700",
      fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.05em",
      flexShrink:"0",alignSelf:"flex-start",whiteSpace:"nowrap"
    }});
    badge.textContent=m.tag;
    card.appendChild(badge);
    card.addEventListener("click",function(){
      if(m.area){
        if(!window._qcState)window._qcState={area:"",beds:"2 BR",building:"",price:"",result:null,rangeResult:null,mode:"sale"};
        window._qcState.area=m.area;window._qcState.rangeResult=null;window._qcState.result=null;
      }
      setSection("Market","Index");
    });
    card.addEventListener("mouseenter",function(){card.style.background=cl.raised;card.style.borderColor=cl.borderHi;});
    card.addEventListener("mouseleave",function(){card.style.background=cl.surface;card.style.borderColor=borderCol;});
    sec.appendChild(card);
  });

  // Footer CTA
  var footer=el("div",{style:{display:"flex",justifyContent:"flex-end",paddingTop:"2px"}});
  var fBtn=el("button",{style:{background:"transparent",border:"none",color:cl.gold,fontSize:"12px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer",padding:"8px 0",display:"flex",alignItems:"center",gap:"4px"}});
  fBtn.innerHTML='View Full Market Index <i data-lucide="arrow-right" style="width:13px;height:13px;vertical-align:middle"></i>';
  fBtn.addEventListener("click",function(){setSection("Market","Index");});
  footer.appendChild(fBtn);
  sec.appendChild(footer);
  return sec;
}

function renderHome(){
  var cl=C();

  // ── Inject keyframe animations once ──────────────────────────────
  if(!document.getElementById('dv-home-css')){
    var st=document.createElement('style');
    st.id='dv-home-css';
    st.textContent=[
      '@keyframes dvFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}',
      '@keyframes dvFadeIn{from{opacity:0}to{opacity:1}}',
      '@keyframes dvPulse{0%,100%{opacity:1}50%{opacity:0.4}}',
      '@keyframes dvGoldShimmer{0%{background-position:200% center}100%{background-position:-200% center}}',
      '@keyframes dvFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',
      '.dv-fu{animation:dvFadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both}',
      '.dv-fu-1{animation-delay:0.04s}.dv-fu-2{animation-delay:0.10s}.dv-fu-3{animation-delay:0.17s}',
      '.dv-fu-4{animation-delay:0.24s}.dv-fu-5{animation-delay:0.32s}.dv-fu-6{animation-delay:0.40s}',
      '.dv-card-lift{transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s ease,border-color 0.2s ease}',
      '.dv-card-lift:hover{transform:translateY(-3px)}'
    ].join('');
    document.head.appendChild(st);
  }

  var wrap=el('div',{style:{width:'100%',maxWidth:'960px',margin:'0 auto',boxSizing:'border-box',paddingBottom:'32px'}});

  // ── ① HERO ────────────────────────────────────────────────────────
  var hero=el('div',{className:'dv-fu dv-fu-1',style:{
    position:'relative',overflow:'hidden',
    margin:'0 0 6px',padding:'36px 20px 28px',
    background:'linear-gradient(160deg,#0C1220 0%,#070B14 45%,#0A0D18 100%)'
  }});

  // Glow orbs
  [
    {w:'280px',h:'280px',top:'-80px',right:'-60px',bg:'radial-gradient(circle,rgba(212,175,55,0.13) 0%,transparent 65%)'},
    {w:'200px',h:'200px',bottom:'-60px',left:'-40px',bg:'radial-gradient(circle,rgba(59,130,246,0.09) 0%,transparent 65%)'},
    {w:'160px',h:'160px',top:'20px',left:'30%',bg:'radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 65%)'}
  ].forEach(function(o){
    var blob=el('div',{style:Object.assign({position:'absolute',borderRadius:'50%',pointerEvents:'none'},o)});
    hero.appendChild(blob);
  });

  // Grid pattern overlay
  var grid=el('div',{style:{
    position:'absolute',inset:'0',pointerEvents:'none',opacity:'0.03',
    backgroundImage:'linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)',
    backgroundSize:'40px 40px'
  }});
  hero.appendChild(grid);

  var heroInner=el('div',{style:{position:'relative',zIndex:'1'}});

  // Greeting pill
  var hr2=new Date().getHours();
  var greetWord=hr2<12?'Morning':hr2<18?'Afternoon':'Evening';
  var greetPill=el('div',{style:{
    display:'inline-flex',alignItems:'center',gap:'6px',
    background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.10)',
    borderRadius:'20px',padding:'5px 12px',marginBottom:'18px'
  }});
  var greetDot=el('div',{style:{width:'6px',height:'6px',borderRadius:'50%',background:'#00C896',animation:'dvPulse 2s ease infinite'}});
  greetPill.appendChild(greetDot);
  greetPill.appendChild(span({fontSize:'11px',color:'#9BA8C8',fontFamily:"'Inter',sans-serif",fontWeight:'500'},'Good '+greetWord+', '+(USER_PROFILE.name||'Explorer')));
  heroInner.appendChild(greetPill);

  // Main headline
  var hl=el('div',{style:{marginBottom:'10px'}});
  hl.appendChild(div({
    fontSize:'clamp(32px,7vw,52px)',fontWeight:'800',
    fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'-0.03em',lineHeight:'1.05',
    color:'#FFFFFF'
  },'Dubai Real Estate,'));
  // Gold gradient word
  var hl2=el('div',{style:{
    fontSize:'clamp(32px,7vw,52px)',fontWeight:'800',
    fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'-0.03em',lineHeight:'1.05',
    background:'linear-gradient(90deg,#F0D060,#D4A843,#B8860B,#D4A843,#F0D060)',
    backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
    backgroundClip:'text',animation:'dvGoldShimmer 4s linear infinite'
  }});
  hl2.textContent='Reimagined.';
  hl.appendChild(hl2);
  heroInner.appendChild(hl);

  heroInner.appendChild(div({
    fontSize:'14px',color:'#6B7A9E',fontFamily:"'Inter',sans-serif",
    lineHeight:'1.6',marginBottom:'24px',maxWidth:'380px'
  },'AI-powered valuations, market intelligence & portfolio management for the world\'s most dynamic real estate market.'));

  // CTA buttons row
  var ctaRow=el('div',{style:{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'28px'}});

  var ctaPrimary=el('button',{style:{
    display:'flex',alignItems:'center',gap:'8px',
    background:'linear-gradient(135deg,#D4A843,#A07D1C)',
    color:'#070B14',border:'none',borderRadius:'12px',
    padding:'13px 22px',fontSize:'13px',fontWeight:'800',
    fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'0.04em',
    cursor:'pointer',transition:'all 0.2s ease',whiteSpace:'nowrap',
    boxShadow:'0 4px 20px rgba(212,168,67,0.35)'
  }});
  ctaPrimary.innerHTML='<i data-lucide="scan-search" style="width:16px;height:16px"></i>Analyze Property';
  ctaPrimary.addEventListener('mouseenter',function(){ctaPrimary.style.boxShadow='0 6px 28px rgba(212,168,67,0.50)';ctaPrimary.style.transform='translateY(-1px)';});
  ctaPrimary.addEventListener('mouseleave',function(){ctaPrimary.style.boxShadow='0 4px 20px rgba(212,168,67,0.35)';ctaPrimary.style.transform='';});
  ctaPrimary.addEventListener('click',function(){setSection('Market','Analyzer');});
  ctaRow.appendChild(ctaPrimary);

  var ctaSecondary=el('button',{style:{
    display:'flex',alignItems:'center',gap:'8px',
    background:'rgba(255,255,255,0.07)',
    color:'#E8EDF5',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'12px',
    padding:'13px 22px',fontSize:'13px',fontWeight:'700',
    fontFamily:"'Space Grotesk',sans-serif",
    cursor:'pointer',transition:'all 0.2s ease',whiteSpace:'nowrap',
    backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)'
  }});
  ctaSecondary.innerHTML='<i data-lucide="bar-chart-3" style="width:16px;height:16px;color:#8B5CF6"></i>Market Index';
  ctaSecondary.addEventListener('mouseenter',function(){ctaSecondary.style.background='rgba(255,255,255,0.11)';ctaSecondary.style.borderColor='rgba(255,255,255,0.20)';});
  ctaSecondary.addEventListener('mouseleave',function(){ctaSecondary.style.background='rgba(255,255,255,0.07)';ctaSecondary.style.borderColor='rgba(255,255,255,0.12)';});
  ctaSecondary.addEventListener('click',function(){setSection('Market','Index');});
  ctaRow.appendChild(ctaSecondary);
  heroInner.appendChild(ctaRow);

  // Stats bar
  (function(){
    var aE=Object.entries(AREAS||{});
    var nB=typeof DB!=='undefined'?Object.keys(DB).length:0;
    var aY=0,aPsf=0,cnt=0;
    aE.forEach(function(e){var a=e[1];if(a.psf>0&&a.y&&a.y[0]>0){aPsf+=a.psf;aY+=(a.y[0]+a.y[1])/2;cnt++;}});
    if(cnt>0){aPsf=Math.round(aPsf/cnt);aY=(aY/cnt).toFixed(1);}
    var bar=el('div',{style:{
      display:'grid',gridTemplateColumns:'repeat(4,1fr)',
      background:'rgba(255,255,255,0.04)',borderRadius:'14px',
      border:'1px solid rgba(255,255,255,0.07)',overflow:'hidden'
    }});
    [{v:nB.toLocaleString(),l:'Buildings',c:'#D4A843'},{v:String(aE.length),l:'Areas',c:'#3B82F6'},
     {v:'AED '+aPsf.toLocaleString(),l:'Avg PSF',c:'#00C896'},{v:aY+'%',l:'Avg Yield',c:'#8B5CF6'}
    ].forEach(function(s,i){
      var sc=el('div',{style:{padding:'14px 10px',textAlign:'center',borderLeft:i?'1px solid rgba(255,255,255,0.06)':'none'}});
      sc.appendChild(div({fontSize:'18px',fontWeight:'800',color:s.c,fontFamily:"'JetBrains Mono',monospace",fontFeatureSettings:"'tnum'",lineHeight:'1'},s.v));
      sc.appendChild(div({fontSize:'9px',color:'#6B7A9E',fontFamily:"'Inter',sans-serif",marginTop:'4px',letterSpacing:'0.06em',textTransform:'uppercase'},s.l));
      bar.appendChild(sc);
    });
    heroInner.appendChild(bar);
  })();

  hero.appendChild(heroInner);
  wrap.appendChild(hero);

  // ── ② AI SEARCH ──────────────────────────────────────────────────
  var srchWrap=el('div',{className:'dv-fu dv-fu-2',style:{padding:'0 16px',marginBottom:'8px'}});
  var srchBox=el('div',{style:{
    position:'relative',background:'rgba(255,255,255,0.04)',
    border:'1px solid rgba(212,175,55,0.25)',borderRadius:'16px',
    padding:'16px 18px',display:'flex',alignItems:'center',gap:'12px',
    cursor:'pointer',transition:'all 0.2s ease',
    boxShadow:'0 0 0 0 rgba(212,175,55,0)'
  }});
  srchBox.addEventListener('mouseenter',function(){
    srchBox.style.borderColor='rgba(212,175,55,0.55)';
    srchBox.style.background='rgba(212,175,55,0.05)';
    srchBox.style.boxShadow='0 0 30px rgba(212,175,55,0.10)';
  });
  srchBox.addEventListener('mouseleave',function(){
    srchBox.style.borderColor='rgba(212,175,55,0.25)';
    srchBox.style.background='rgba(255,255,255,0.04)';
    srchBox.style.boxShadow='0 0 0 0 rgba(212,175,55,0)';
  });
  srchBox.addEventListener('click',function(){setSection('Market','Find');});
  var srchIc=el('div',{style:{width:'38px',height:'38px',borderRadius:'10px',background:'rgba(212,175,55,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:'0'}});
  srchIc.innerHTML='<i data-lucide="sparkles" style="width:20px;height:20px;color:#D4A843"></i>';
  srchBox.appendChild(srchIc);
  var srchTxt=el('div',{style:{flex:'1',minWidth:'0'}});
  srchTxt.appendChild(div({fontSize:'13px',color:'#E8EDF5',fontFamily:"'Inter',sans-serif",fontWeight:'500',marginBottom:'2px'},'AI Property Search'));
  srchTxt.appendChild(div({fontSize:'11px',color:'#6B7A9E',fontFamily:"'Inter',sans-serif"},'e.g. "Best 2BR under 2M with 7%+ yield in JVC"'));
  srchBox.appendChild(srchTxt);
  var srchBtn=el('div',{style:{
    background:'linear-gradient(135deg,rgba(212,175,55,0.20),rgba(212,175,55,0.08))',
    border:'1px solid rgba(212,175,55,0.30)',borderRadius:'10px',
    padding:'8px 14px',display:'flex',alignItems:'center',gap:'5px',flexShrink:'0'
  }});
  srchBtn.innerHTML='<i data-lucide="arrow-right" style="width:14px;height:14px;color:#D4A843"></i>';
  srchBtn.appendChild(span({fontSize:'11px',color:'#D4A843',fontFamily:"'Space Grotesk',sans-serif",fontWeight:'700'},'Search'));
  srchBox.appendChild(srchBtn);
  srchWrap.appendChild(srchBox);

  var chips=el('div',{style:{display:'flex',gap:'8px',marginTop:'10px',flexWrap:'wrap'}});
  [{t:'Downtown 2BR',c:'#3B82F6',i:'building-2'},{t:'High Yield JVC',c:'#00C896',i:'trending-up'},{t:'Marina Sea View',c:'#8B5CF6',i:'waves'},{t:'Palm Villas',c:'#D4A843',i:'palmtree'}].forEach(function(ch){
    var chip=el('div',{style:{display:'flex',alignItems:'center',gap:'5px',background:ch.c+'12',border:'1px solid '+ch.c+'28',borderRadius:'20px',padding:'6px 12px',cursor:'pointer',transition:'all 0.15s ease'}});
    chip.innerHTML='<i data-lucide="'+ch.i+'" style="width:11px;height:11px;color:'+ch.c+'"></i>';
    chip.appendChild(span({fontSize:'11px',color:ch.c,fontFamily:"'Inter',sans-serif",fontWeight:'600'},ch.t));
    chip.addEventListener('click',function(){setSection('Market','Find');});
    chip.addEventListener('mouseenter',function(){chip.style.background=ch.c+'22';chip.style.borderColor=ch.c+'50';});
    chip.addEventListener('mouseleave',function(){chip.style.background=ch.c+'12';chip.style.borderColor=ch.c+'28';});
    chips.appendChild(chip);
  });
  srchWrap.appendChild(chips);
  wrap.appendChild(srchWrap);

  // ── ③ MARKET PULSE ───────────────────────────────────────────────
  // (Buildings/Areas/PSF/Yield stats already shown once in the Hero stats
  // bar above — this section now only surfaces the one thing that isn't
  // shown anywhere else on Home: the current top-growth area. The old
  // "Quick Actions" section was removed entirely: its big Analyzer card
  // duplicated the Hero CTA, and its Deal Board/Portfolio/Market Index
  // tiles duplicated the Explore Platform carousel, Hero secondary CTA,
  // and the Your Portfolio card further down respectively.)
  (function(){
    var aE=Object.entries(AREAS||{});
    var byG=[];
    aE.forEach(function(e){var a=e[1];if(a.g&&a.g[0]>0)byG.push(e);});
    byG.sort(function(a,b){return b[1].g[0]-a[1].g[0];});
    var top=byG[0];
    if(!top)return;

    var pw=el('div',{className:'dv-fu dv-fu-3',style:{padding:'24px 16px 0'}});
    var phdr=el('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}});
    phdr.appendChild(div({fontSize:'10px',color:'#6B7A9E',fontWeight:'700',fontFamily:"'Inter',sans-serif",letterSpacing:'0.10em',textTransform:'uppercase'},'Market Pulse'));
    var liveTag=el('div',{style:{display:'flex',alignItems:'center',gap:'5px',background:'rgba(0,200,150,0.08)',border:'1px solid rgba(0,200,150,0.20)',borderRadius:'20px',padding:'3px 9px'}});
    var liveDot=el('div',{style:{width:'5px',height:'5px',borderRadius:'50%',background:'#00C896',animation:'dvPulse 2s ease infinite'}});
    liveTag.appendChild(liveDot);
    liveTag.appendChild(span({fontSize:'9px',color:'#00C896',fontFamily:"'Space Grotesk',sans-serif",fontWeight:'700',letterSpacing:'0.08em'},'LIVE'));
    phdr.appendChild(liveTag);
    pw.appendChild(phdr);

    var tb=el('div',{style:{
      display:'flex',alignItems:'center',gap:'12px',
      background:'linear-gradient(135deg,rgba(0,200,150,0.07),rgba(0,200,150,0.02))',
      border:'1px solid rgba(0,200,150,0.18)',borderRadius:'14px',
      padding:'14px 16px',cursor:'pointer',transition:'all 0.2s ease',marginBottom:'4px'
    }});
    tb.addEventListener('click',function(){setSection('Market','Index');});
    tb.addEventListener('mouseenter',function(){tb.style.borderColor='rgba(0,200,150,0.35)';});
    tb.addEventListener('mouseleave',function(){tb.style.borderColor='rgba(0,200,150,0.18)';});
    var tbIc=el('div',{style:{width:'36px',height:'36px',borderRadius:'10px',background:'rgba(0,200,150,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:'0'}});
    tbIc.innerHTML='<i data-lucide="trending-up" style="width:18px;height:18px;color:#00C896"></i>';
    tb.appendChild(tbIc);
    var tbTxt=el('div',{style:{flex:'1',minWidth:'0'}});
    tbTxt.appendChild(div({fontSize:'11px',color:'#9BA8C8',fontFamily:"'Inter',sans-serif",marginBottom:'2px'},'Top Performing Area'));
    tbTxt.appendChild(div({fontSize:'14px',fontWeight:'700',color:'#E8EDF5',fontFamily:"'Space Grotesk',sans-serif"},
      top[0]+' — +'+top[1].g[0].toFixed(1)+'% YoY growth'));
    tb.appendChild(tbTxt);
    var tbArr=el('div',{style:{color:'rgba(0,200,150,0.5)',flexShrink:'0'}});
    tbArr.innerHTML='<i data-lucide="chevron-right" style="width:16px;height:16px"></i>';
    tb.appendChild(tbArr);
    pw.appendChild(tb);
    wrap.appendChild(pw);
  })();

  // ── ④ TOP OPPORTUNITIES ──────────────────────────────────────────
  // (renderMarketMoments() already renders its own "Top Opportunities" + LIVE
  // header internally — the outer label here used to duplicate it.)
  var momWrap=el('div',{className:'dv-fu dv-fu-4',style:{padding:'24px 16px 0'}});
  momWrap.appendChild(renderMarketMoments(cl));
  wrap.appendChild(momWrap);

  // ── ⑤ EXPLORE ────────────────────────────────────────────────────
  var expWrap=el('div',{className:'dv-fu dv-fu-5',style:{padding:'24px 16px 0'}});
  expWrap.appendChild(div({fontSize:'10px',color:'#6B7A9E',fontWeight:'700',fontFamily:"'Inter',sans-serif",letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:'14px'},'Explore Platform'));
  var expScroll=el('div',{style:{display:'flex',gap:'10px',overflowX:'auto',paddingBottom:'8px',scrollSnapType:'x mandatory',WebkitOverflowScrolling:'touch'}});
  expScroll.style.cssText+=';-ms-overflow-style:none;scrollbar-width:none';
  [{icon:'handshake',title:'Deal Board',desc:'Off-market & agent network',c:'#00C896',sec:'Network',sub:'Deals'},
   {icon:'users',title:'AI Chief',desc:'Your agent workspace',c:'#8B5CF6',sec:'Network',sub:'Chiefs'},
   {icon:'map',title:'Map View',desc:'Interactive area map',c:'#10B981',sec:'Market',sub:'Map'},
   {icon:'layout-dashboard',title:'Workspace',desc:'Custom dashboard builder',c:'#D4A843',sec:'More',sub:'Workspace'},
   {icon:'user-check',title:'AI Advisor',desc:'Personalized picks',c:'#F59E0B',sec:'Market',sub:'Advisor'},
   {icon:'newspaper',title:'News',desc:'Latest market news',c:'#3B82F6',sec:'Market',sub:'News'}
  ].forEach(function(f){
    var fc=el('div',{style:{
      background:'rgba(255,255,255,0.03)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',
      borderRadius:'18px',padding:'16px',minWidth:'148px',maxWidth:'148px',flexShrink:'0',cursor:'pointer',
      border:'1px solid rgba(255,255,255,0.07)',transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      scrollSnapAlign:'start'
    }});
    var fcIc=el('div',{style:{width:'42px',height:'42px',borderRadius:'13px',background:f.c+'15',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px',transition:'transform 0.2s ease',boxShadow:'0 2px 12px '+f.c+'18'}});
    fcIc.innerHTML='<i data-lucide="'+f.icon+'" style="width:20px;height:20px;color:'+f.c+'"></i>';
    fc.appendChild(fcIc);
    fc.appendChild(div({fontSize:'13px',fontWeight:'700',color:'#E8EDF5',fontFamily:"'Inter',sans-serif",marginBottom:'4px',lineHeight:'1.2'},f.title));
    fc.appendChild(div({fontSize:'11px',color:'#6B7A9E',fontFamily:"'Inter',sans-serif",lineHeight:'1.3'},f.desc));
    fc.addEventListener('click',function(){setSection(f.sec,f.sub);});
    fc.addEventListener('mouseenter',function(){fc.style.background='rgba(255,255,255,0.07)';fc.style.borderColor='rgba(255,255,255,0.14)';fc.style.transform='translateY(-4px)';fcIc.style.transform='scale(1.08)';});
    fc.addEventListener('mouseleave',function(){fc.style.background='rgba(255,255,255,0.03)';fc.style.borderColor='rgba(255,255,255,0.07)';fc.style.transform='translateY(0)';fcIc.style.transform='scale(1)';});
    expScroll.appendChild(fc);
  });
  expWrap.appendChild(wrapHScroll(expScroll));
  wrap.appendChild(expWrap);

  // ── ⑥ PORTFOLIO ──────────────────────────────────────────────────
  var pAssets=[];
  try{pAssets=JSON.parse(localStorage.getItem('dubaival_portfolio')||'[]');}catch(e){}
  var pfWrap=el('div',{style:{padding:'24px 16px 0'}});
  pfWrap.appendChild(div({fontSize:'10px',color:'#6B7A9E',fontWeight:'700',fontFamily:"'Inter',sans-serif",letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:'14px'},'Your Portfolio'));
  if(pAssets.length>0){
    var tV=0,tR=0;
    pAssets.forEach(function(a){tV+=(parseFloat(a.price)||0);tR+=(parseFloat(a.rent)||0);});
    var yld2=tV>0&&tR>0?((tR/tV)*100).toFixed(1):null;
    var pfCard2=el('div',{style:{
      background:'linear-gradient(135deg,rgba(212,175,55,0.10) 0%,rgba(212,175,55,0.03) 50%,rgba(10,15,30,0) 100%)',
      border:'1px solid rgba(212,175,55,0.20)',borderRadius:'18px',padding:'22px',
      boxShadow:'0 4px 24px rgba(212,175,55,0.06)'
    }});
    var pfR=el('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'18px'}});
    var pfL=el('div',{});
    pfL.appendChild(div({fontSize:'10px',color:'rgba(212,175,55,0.60)',fontFamily:"'Inter',sans-serif",letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'5px'},'Total Portfolio Value'));
    pfL.appendChild(div({fontSize:'28px',fontWeight:'800',color:'#FFFFFF',fontFamily:"'JetBrains Mono',monospace",fontFeatureSettings:"'tnum'",lineHeight:'1'},'AED '+(tV/1e6).toFixed(2)+'M'));
    if(tR>0)pfL.appendChild(div({fontSize:'12px',color:'rgba(0,200,150,0.80)',fontFamily:"'Inter',sans-serif",marginTop:'5px'},'Monthly income · AED '+(tR/12).toLocaleString(undefined,{maximumFractionDigits:0})));
    pfR.appendChild(pfL);
    var pfBadges=el('div',{style:{display:'flex',flexDirection:'column',gap:'5px',alignItems:'flex-end'}});
    pfBadges.appendChild(div({background:'rgba(0,200,150,0.12)',border:'1px solid rgba(0,200,150,0.25)',borderRadius:'8px',padding:'4px 10px',fontSize:'11px',fontWeight:'700',color:'#00C896',fontFamily:"'Space Grotesk',sans-serif"},pAssets.length+' Assets'));
    if(yld2)pfBadges.appendChild(div({background:'rgba(212,175,55,0.10)',border:'1px solid rgba(212,175,55,0.25)',borderRadius:'8px',padding:'4px 10px',fontSize:'11px',fontWeight:'700',color:'#D4A843',fontFamily:"'Space Grotesk',sans-serif"},yld2+'% Yield'));
    pfR.appendChild(pfBadges);
    pfCard2.appendChild(pfR);
    var pfBtn2=el('button',{style:{width:'100%',padding:'13px',background:'linear-gradient(135deg,#D4A843,#A07D1C)',color:'#070B14',border:'none',borderRadius:'12px',fontSize:'13px',fontWeight:'800',fontFamily:"'Space Grotesk',sans-serif",cursor:'pointer',letterSpacing:'0.04em',boxShadow:'0 4px 16px rgba(212,168,67,0.25)',transition:'all 0.2s ease'}});
    pfBtn2.textContent='MANAGE PORTFOLIO →';
    pfBtn2.addEventListener('mouseenter',function(){pfBtn2.style.boxShadow='0 6px 24px rgba(212,168,67,0.40)';pfBtn2.style.transform='translateY(-1px)';});
    pfBtn2.addEventListener('mouseleave',function(){pfBtn2.style.boxShadow='0 4px 16px rgba(212,168,67,0.25)';pfBtn2.style.transform='';});
    pfBtn2.addEventListener('click',function(){setSection('Portfolio','Assets');});
    pfCard2.appendChild(pfBtn2);
    pfWrap.appendChild(pfCard2);
  } else {
    var pfEmpty=el('div',{style:{
      background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:'18px',padding:'28px',textAlign:'center'
    }});
    var pfEmptyIc=el('div',{style:{width:'52px',height:'52px',borderRadius:'16px',background:'rgba(212,175,55,0.08)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',animation:'dvFloat 3s ease infinite'}});
    pfEmptyIc.innerHTML='<i data-lucide="briefcase" style="width:26px;height:26px;color:#D4A843"></i>';
    pfEmpty.appendChild(pfEmptyIc);
    pfEmpty.appendChild(div({fontSize:'16px',fontWeight:'700',color:'#E8EDF5',fontFamily:"'Space Grotesk',sans-serif",marginBottom:'8px'},'Track Your Properties'));
    pfEmpty.appendChild(div({fontSize:'13px',color:'#6B7A9E',fontFamily:"'Inter',sans-serif",lineHeight:'1.6',marginBottom:'20px',maxWidth:'280px',margin:'0 auto 20px'},'Add your properties for real-time AVM valuations, yield tracking, and portfolio health analysis.'));
    var pfAddBtn=el('button',{style:{display:'inline-flex',alignItems:'center',gap:'7px',padding:'12px 22px',background:'rgba(212,175,55,0.10)',color:'#D4A843',border:'1px solid rgba(212,175,55,0.25)',borderRadius:'12px',fontSize:'13px',fontWeight:'700',fontFamily:"'Space Grotesk',sans-serif",cursor:'pointer',transition:'all 0.2s ease'}});
    pfAddBtn.innerHTML='<i data-lucide="plus" style="width:15px;height:15px"></i>Add First Asset';
    pfAddBtn.addEventListener('mouseenter',function(){pfAddBtn.style.background='rgba(212,175,55,0.18)';pfAddBtn.style.borderColor='rgba(212,175,55,0.45)';});
    pfAddBtn.addEventListener('mouseleave',function(){pfAddBtn.style.background='rgba(212,175,55,0.10)';pfAddBtn.style.borderColor='rgba(212,175,55,0.25)';});
    pfAddBtn.addEventListener('click',function(){setSection('Portfolio','Assets');});
    pfEmpty.appendChild(pfAddBtn);
    pfWrap.appendChild(pfEmpty);
  }
  wrap.appendChild(pfWrap);

  // ── ⑦ RECENT ACTIVITY ────────────────────────────────────────────
  var recent=[];
  try{recent=JSON.parse(localStorage.getItem('dubaival_recent')||'[]');}catch(e){}
  if(recent.length>0){
    var recWrap=el('div',{style:{padding:'24px 16px 0'}});
    recWrap.appendChild(div({fontSize:'10px',color:'#6B7A9E',fontWeight:'700',fontFamily:"'Inter',sans-serif",letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:'14px'},'Recent Activity'));
    var recCard=el('div',{style:{background:'rgba(255,255,255,0.03)',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.07)',overflow:'hidden'}});
    recent.slice(0,5).forEach(function(r,i){
      var row=el('div',{style:{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderBottom:i<Math.min(recent.length,5)-1?'1px solid rgba(255,255,255,0.06)':'none',cursor:'pointer',transition:'background 0.15s ease'}});
      row.addEventListener('mouseenter',function(){row.style.background='rgba(255,255,255,0.04)';});
      row.addEventListener('mouseleave',function(){row.style.background='';});
      var rIc=el('div',{style:{width:'34px',height:'34px',borderRadius:'10px',background:'rgba(212,175,55,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:'0'}});
      rIc.innerHTML='<i data-lucide="file-search" style="width:16px;height:16px;color:#D4A843"></i>';
      row.appendChild(rIc);
      var rTxt=el('div',{style:{flex:'1',minWidth:'0'}});
      rTxt.appendChild(div({color:'#E8EDF5',fontSize:'13px',fontFamily:"'Inter',sans-serif",fontWeight:'500',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},r.label||r.building||r.area||'Valuation'));
      if(r.ts){var ago=Date.now()-r.ts;rTxt.appendChild(div({color:'#6B7A9E',fontSize:'10px',fontFamily:"'Inter',sans-serif",marginTop:'2px'},ago<3600000?Math.round(ago/60000)+'m ago':ago<86400000?Math.round(ago/3600000)+'h ago':Math.round(ago/86400000)+'d ago'));}
      row.appendChild(rTxt);
      row.appendChild(el('div',{style:{color:'rgba(255,255,255,0.20)',flexShrink:'0'},innerHTML:'<i data-lucide="chevron-right" style="width:15px;height:15px"></i>'}));
      recCard.appendChild(row);
    });
    recWrap.appendChild(recCard);
    wrap.appendChild(recWrap);
  }

  return wrap;
}

function renderProfilePanel(){
  var cl=C();
  var panel=el("div",{style:{background:cl.surface,borderBottom:"1px solid "+cl.border,padding:"20px 24px",maxHeight:"82vh",overflowY:"auto"}});
  var allSocialFields=[];

  function secLabel(text){
    return div({color:"#D4AF37",fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"700",borderLeft:"3px solid #D4AF37",paddingLeft:"8px",marginBottom:"12px",marginTop:"8px"},text);
  }
  function inpStyle(){
    return {width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"8px 11px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"};
  }
  function fieldBlock(labelText,inputEl){
    var w=el("div",{});
    w.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"5px"},labelText));
    w.appendChild(inputEl);
    return w;
  }
  function socialInp(key,label,ph,type){
    var inp=el("input",{type:type||"text",placeholder:ph,style:Object.assign(inpStyle(),{fontFamily:"monospace",fontSize:"11px"})});
    inp.value=localStorage.getItem(key)||"";
    inp.addEventListener("focus",function(){this.style.borderColor="#D4AF37";});
    inp.addEventListener("blur",function(){this.style.borderColor=cl.border;});
    allSocialFields.push({key:key,inp:inp});
    return fieldBlock(label,inp);
  }

  var maxW=el("div",{style:{maxWidth:"760px",margin:"0 auto"}});

  // ── ACCOUNT ────────────────────────────────────────────────────
  maxW.appendChild(secLabel("Account"));
  var acctGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"12px",marginBottom:"20px"}});

  // Email (read-only)
  var emailVal=(typeof DV_AUTH!=="undefined"&&DV_AUTH.user&&DV_AUTH.user.email)||"";
  var emailInp=el("input",{type:"text",value:emailVal,readOnly:true,style:Object.assign(inpStyle(),{opacity:"0.55",cursor:"default"})});
  acctGrid.appendChild(fieldBlock("Email",emailInp));

  // Name
  var nameInp=el("input",{type:"text",placeholder:"Your name",style:inpStyle()});
  nameInp.value=USER_PROFILE.name||"";
  nameInp.addEventListener("input",function(){USER_PROFILE.name=this.value;});
  nameInp.addEventListener("focus",function(){this.style.borderColor="#D4AF37";});
  nameInp.addEventListener("blur",function(){this.style.borderColor=cl.border;});
  acctGrid.appendChild(fieldBlock("Name",nameInp));

  // Phone
  var phoneInp=el("input",{type:"tel",placeholder:"+971 50 000 0000",style:inpStyle()});
  phoneInp.value=localStorage.getItem("dv_phone")||"";
  phoneInp.addEventListener("focus",function(){this.style.borderColor="#D4AF37";});
  phoneInp.addEventListener("blur",function(){this.style.borderColor=cl.border;});
  acctGrid.appendChild(fieldBlock("Phone",phoneInp));

  // WhatsApp
  var waInp=el("input",{type:"tel",placeholder:"+971 50 000 0000",style:inpStyle()});
  waInp.value=localStorage.getItem("dv_whatsapp_number")||"";
  waInp.addEventListener("focus",function(){this.style.borderColor="#D4AF37";});
  waInp.addEventListener("blur",function(){this.style.borderColor=cl.border;});
  acctGrid.appendChild(fieldBlock("WhatsApp",waInp));

  maxW.appendChild(acctGrid);

  // ── AI API KEYS ────────────────────────────────────────────────
  maxW.appendChild(secLabel("AI API Keys"));
  var aiGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"12px",marginBottom:"20px"}});
  aiGrid.appendChild(socialInp("dv_groq","Groq API Key (AI Chat)","gsk_... — free at console.groq.com","password"));
  aiGrid.appendChild(socialInp("dv_gemini_key","Gemini API Key (AI Image + RAG Memory)","AIza... — free at aistudio.google.com/apikey","password"));
  aiGrid.appendChild(socialInp("dv_unsplash_key","Unsplash API Key (Property Photos)","Free at unsplash.com/developers"));
  aiGrid.appendChild(socialInp("dv_pexels_key","Pexels API Key (Property Photos)","Free at pexels.com/api"));
  maxW.appendChild(aiGrid);

  // ── SOCIAL ACCOUNTS ────────────────────────────────────────────
  maxW.appendChild(secLabel("Social Accounts"));

  // Helper: OAuth connect button
  function oauthBtn(label,color,platform){
    var userId=(typeof DV_AUTH!=="undefined"&&DV_AUTH.user)?(DV_AUTH.user.email||DV_AUTH.user.id):"default";
    var state=platform+"_"+userId;
    var btn=el("button",{style:{display:"flex",alignItems:"center",gap:"6px",background:color+"22",border:"1px solid "+color,borderRadius:"8px",padding:"7px 14px",color:color,fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace",whiteSpace:"nowrap"}});
    var connected=false;
    if(platform==="meta"){connected=!!localStorage.getItem("dv_ig_token")||!!localStorage.getItem("dv_fb_id");}
    else if(platform==="google"){connected=!!localStorage.getItem("dv_gmail_connected");}
    btn.innerHTML=(connected?"✓ Connected":"Connect")+" "+label;
    btn.style.background=connected?"#10B98122":color+"22";
    btn.style.borderColor=connected?"#10B981":color;
    btn.style.color=connected?"#10B981":color;
    btn.addEventListener("click",function(){
      if(platform==="meta"){
        fetch("/api/inbox?action=config").then(function(r){return r.json();}).then(function(d){
          var url="https://www.facebook.com/dialog/oauth?client_id="+d.meta_app_id+
            "&redirect_uri="+encodeURIComponent(window.location.origin+"/callback")+
            "&scope=pages_show_list,pages_messaging,instagram_manage_messages,instagram_basic,pages_read_engagement,read_page_mailboxes"+
            "&response_type=code&state="+encodeURIComponent(state);
          window.location.href=url;
        }).catch(function(){alert("Meta App ID not configured. Add META_APP_ID to Vercel env vars.");});
      } else if(platform==="google"){
        fetch("/api/inbox?action=config").then(function(r){return r.json();}).then(function(d){
          var url="https://accounts.google.com/o/oauth2/v2/auth?client_id="+d.google_client_id+
            "&redirect_uri="+encodeURIComponent(window.location.origin+"/callback")+
            "&scope="+encodeURIComponent("https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send")+
            "&response_type=code&access_type=offline&prompt=consent"+
            "&state="+encodeURIComponent(state);
          window.location.href=url;
        }).catch(function(){alert("Google Client ID not configured. Add GOOGLE_CLIENT_ID to Vercel env vars.");});
      }
    });
    return btn;
  }

  // Instagram + Facebook — one OAuth button connects both
  var igSection=el("div",{style:{marginBottom:"14px"}});
  var igHeader=el("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}});
  var igLabel=div({color:"#E1306C",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"📸 Instagram & Facebook");
  igHeader.appendChild(igLabel);
  igHeader.appendChild(oauthBtn("Instagram + Facebook","#E1306C","meta"));
  igSection.appendChild(igHeader);
  var igGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"10px"}});
  igGrid.appendChild(socialInp("dv_ig_id","Account ID (auto-filled after connect)","e.g. 1234567890"));
  igGrid.appendChild(socialInp("dv_ig_token","Access Token (auto-filled after connect)","EAAGm...","password"));
  igSection.appendChild(igGrid);
  maxW.appendChild(igSection);

  // Facebook manual (separate Page ID still shown for info)
  var fbSection=el("div",{style:{marginBottom:"14px"}});
  fbSection.appendChild(div({color:"#1877F2",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"👥 Facebook Page ID (auto-filled)"));
  var fbGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"10px"}});
  fbGrid.appendChild(socialInp("dv_fb_id","Page ID","auto-filled after Connect above"));
  fbSection.appendChild(fbGrid);
  maxW.appendChild(fbSection);

  // Gmail
  var gmailSection=el("div",{style:{marginBottom:"14px"}});
  var gmailHeader=el("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}});
  gmailHeader.appendChild(div({color:"#EA4335",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"📧 Gmail"));
  gmailHeader.appendChild(oauthBtn("Gmail","#EA4335","google"));
  gmailSection.appendChild(gmailHeader);
  var gmailStatus=div({fontSize:"11px",color:"#8899AA",padding:"8px 12px",background:"#0D1220",borderRadius:"8px"},localStorage.getItem("dv_gmail_connected")?"Connected: "+localStorage.getItem("dv_gmail_connected"):"Not connected — click Connect Gmail to link your inbox");
  gmailSection.appendChild(gmailStatus);
  maxW.appendChild(gmailSection);

  // LinkedIn
  var liSection=el("div",{style:{marginBottom:"14px"}});
  liSection.appendChild(div({color:"#0A66C2",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"💼 LinkedIn"));
  var liGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"10px"}});
  liGrid.appendChild(socialInp("dv_linkedin_token","Access Token","AQX...","password"));
  liGrid.appendChild(socialInp("dv_linkedin_urn","Organization URN","urn:li:organization:123"));
  liSection.appendChild(liGrid);
  maxW.appendChild(liSection);

  // X / Twitter
  var twSection=el("div",{style:{marginBottom:"14px"}});
  twSection.appendChild(div({color:cl.white,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"𝕏 X / Twitter"));
  var twGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"10px"}});
  twGrid.appendChild(socialInp("dv_twitter_consumer_key","Consumer Key","API key"));
  twGrid.appendChild(socialInp("dv_twitter_consumer_secret","Consumer Secret","API secret","password"));
  twGrid.appendChild(socialInp("dv_twitter_access_token","Access Token","token","password"));
  twGrid.appendChild(socialInp("dv_twitter_access_secret","Access Secret","secret","password"));
  twSection.appendChild(twGrid);
  maxW.appendChild(twSection);

  // TikTok
  var ttSection=el("div",{style:{marginBottom:"14px"}});
  ttSection.appendChild(div({color:"#69C9D0",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"🎵 TikTok"));
  var ttGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"10px"}});
  ttGrid.appendChild(socialInp("dv_tiktok_token","Access Token","Bearer token...","password"));
  ttSection.appendChild(ttGrid);
  maxW.appendChild(ttSection);

  // YouTube
  var ytSection=el("div",{style:{marginBottom:"20px"}});
  ytSection.appendChild(div({color:"#FF0000",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"▶ YouTube"));
  var ytGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"10px"}});
  ytGrid.appendChild(socialInp("dv_youtube_client_id","Client ID","client_id.apps.google..."));
  ytGrid.appendChild(socialInp("dv_youtube_refresh","Refresh Token","refresh_token...","password"));
  ytSection.appendChild(ytGrid);
  maxW.appendChild(ytSection);

  // ── BUTTONS ────────────────────────────────────────────────────
  var btnRow=el("div",{style:{display:"flex",gap:"10px",flexDirection:"column"}});

  var saveBtn=el("button",{style:{width:"100%",background:"linear-gradient(135deg,#D4AF37,#A07D1C)",border:"none",borderRadius:"8px",padding:"11px",color:"#070B14",fontWeight:"700",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",letterSpacing:"0.06em"}});
  saveBtn.textContent="SAVE PROFILE";
  saveBtn.addEventListener("click",function(){
    // Save account fields
    USER_PROFILE.name=nameInp.value.trim();
    saveProfile();
    localStorage.setItem("dv_phone",phoneInp.value.trim());
    localStorage.setItem("dv_whatsapp_number",waInp.value.trim());
    // Save social fields
    allSocialFields.forEach(function(f){
      if(f.inp.value.trim())localStorage.setItem(f.key,f.inp.value.trim());
      else localStorage.removeItem(f.key);
    });
    if(typeof _syncCredsToServer==="function")_syncCredsToServer();
    saveBtn.textContent="✓ SAVED";
    saveBtn.style.background="linear-gradient(135deg,#10B981,#059669)";
    setTimeout(function(){saveBtn.textContent="SAVE PROFILE";saveBtn.style.background="linear-gradient(135deg,#D4AF37,#A07D1C)";},2000);
  });
  btnRow.appendChild(saveBtn);

  if(typeof DV_AUTH!=="undefined"&&DV_AUTH.user){
    var signOutBtn=el("button",{style:{width:"100%",background:"transparent",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"8px",padding:"9px",color:"#EF4444",fontWeight:"600",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",letterSpacing:"0.04em"}});
    signOutBtn.textContent="Sign Out";
    signOutBtn.addEventListener("mouseenter",function(){this.style.background="rgba(239,68,68,0.08)";});
    signOutBtn.addEventListener("mouseleave",function(){this.style.background="transparent";});
    signOutBtn.addEventListener("click",function(){
      if(typeof dvSignOut==="function")dvSignOut();
    });
    btnRow.appendChild(signOutBtn);
  }

  maxW.appendChild(btnRow);
  panel.appendChild(maxW);
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

  // Auth is optional — no gate, app loads freely

  document.documentElement.dir=isRTL()?"rtl":"ltr";
  document.documentElement.lang=isRTL()?"ar":"en";
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
  app.style.cssText="background:"+cl.bg+";min-height:100vh;color:"+cl.white+";overflow-x:hidden;max-width:100%;width:100%;";

  if(!document.getElementById("dvGlobalStyles")){
    var gs=document.createElement("style");gs.id="dvGlobalStyles";
    gs.textContent="@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)}70%{box-shadow:0 0 0 10px rgba(201,168,76,0)}100%{box-shadow:0 0 0 0 rgba(201,168,76,0)}}@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}";
    document.head.appendChild(gs);
  }

  var layout=el("div",{style:{display:"flex",minHeight:"100vh",maxWidth:"100%",overflowX:"hidden",width:"100%",minWidth:"0"}});

  // --- SIDEBAR (desktop) ---
  var sbClass="dv-sidebar"+(sidebarCollapsed?" collapsed":"");
  var sidebar=el("nav",{style:{}});
  sidebar.className=sbClass;

  var logoWrap=el("div",{});
  logoWrap.className="dv-sidebar-logo";
  var logoSize=sidebarCollapsed?"28px":"36px";
  logoWrap.appendChild(el("img",{src:"logo.png",alt:"DV",style:{width:logoSize,height:logoSize,borderRadius:"7px",flexShrink:"0",objectFit:"contain",transition:"width 0.2s ease,height 0.2s ease"}}));
  var logoText=el("div",{});
  logoText.className="dv-sidebar-logo-text";
  logoText.appendChild(div({fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",color:"#fff"},"DubAIVal"));
  logoText.appendChild(div({color:"#8899AA",fontSize:"9px",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',monospace"},"AI PROPERTY INTEL"));
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
    if(sec.badgeKey==="autopost"&&!sidebarCollapsed){
      var failCount=0;try{var acal=JSON.parse(localStorage.getItem("dv_content_calendar")||"[]");failCount=acal.filter(function(e){return e.status==="failed"||e.status==="partial";}).length;}catch(e){}
      if(failCount>0){var fbadge=el("span",{style:{background:"rgba(239,68,68,0.15)",color:"#EF4444",fontSize:"8px",fontWeight:"700",fontFamily:"'JetBrains Mono',monospace",padding:"2px 6px",borderRadius:"999px",marginLeft:"auto",flexShrink:"0"}});fbadge.textContent=String(failCount);item.appendChild(fbadge);}
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
  var main=el("div",{style:{width:"100%",maxWidth:"100%",overflowX:"hidden",boxSizing:"border-box",minWidth:"0"}});
  main.className="dv-main"+(sidebarCollapsed?" sidebar-collapsed":"");

  // Top bar — Modern native app header
  var header=el("div",{});
  header.className="dv-app-header";
  var curSec=NAV_SECTIONS.find(function(n){return n.id===currentSection;});

  var secTitle=el("div",{style:{display:"flex",alignItems:"center",gap:"10px"}});
  var mobileLogo=el("img",{src:"logo.png",alt:"DV",style:{width:"26px",height:"26px",borderRadius:"8px",objectFit:"contain",display:"none"}});
  mobileLogo.className="dv-mobile-logo";
  secTitle.appendChild(mobileLogo);
  var secIconWrap=el("span",{style:{width:"20px",height:"20px",display:"inline-flex",alignItems:"center",color:curSec&&curSec.accentColor?curSec.accentColor:cl.gold}});
  secIconWrap.className="dv-header-sec-icon";
  if(curSec)secIconWrap.innerHTML='<i data-lucide="'+curSec.icon+'"></i>';
  secTitle.appendChild(secIconWrap);
  secTitle.appendChild(span({fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",color:cl.white,letterSpacing:"-0.02em"},curSec?curSec.label:"DubAIVal"));
  header.appendChild(secTitle);

  var controls=el("div",{style:{display:"flex",alignItems:"center",gap:"6px"}});
  // News icon button with new-article dot
  var newsBtn=el("button",{});
  newsBtn.className="dv-icon-btn";
  newsBtn.style.position="relative";
  newsBtn.title="Dubai Real Estate News";
  newsBtn.innerHTML='<i data-lucide="newspaper" style="width:18px;height:18px"></i>';
  var _hasNewNews=(function(){try{var nc=localStorage.getItem("dv_news_cache");if(!nc)return false;var np=JSON.parse(nc);var lv=parseInt(localStorage.getItem("dv_news_last_visit")||"0",10)||0;return np&&np.articles&&np.articles.some(function(a){return a.ts&&a.ts>lv;});}catch(e){return false;}})();
  if(_hasNewNews){var newsDot=el("div",{style:{position:"absolute",top:"6px",right:"6px",width:"6px",height:"6px",borderRadius:"50%",background:"#EF4444",boxShadow:"0 0 6px #EF4444"}});newsBtn.appendChild(newsDot);}
  newsBtn.addEventListener("click",function(){setSection("Market","News");});
  controls.appendChild(newsBtn);
  if(typeof renderNotifBell==="function")controls.appendChild(renderNotifBell());
  var avatarBtn=el("div",{});
  avatarBtn.className="dv-avatar";
  var _dvLoggedIn=typeof DV_AUTH!=="undefined"&&DV_AUTH.user;
  if(_dvLoggedIn){
    var _dvNameStr=USER_PROFILE.name||(DV_AUTH.user.email||"");
    var avatarInitial=_dvNameStr?_dvNameStr.charAt(0).toUpperCase():"U";
    avatarBtn.innerHTML='<span style="font-size:13px;font-weight:700;color:#D4AF37;font-family:\'Inter\',sans-serif">'+avatarInitial+'</span>';
    avatarBtn.title="My Profile";
    avatarBtn.addEventListener("click",function(){showProfilePanel=!showProfilePanel;render();});
  }else{
    avatarBtn.innerHTML='<i data-lucide="user" style="width:16px;height:16px;color:#6B7A9E"></i>';
    avatarBtn.title="Sign In";
    avatarBtn.style.background="transparent";
    avatarBtn.style.border="1px solid "+cl.border;
    avatarBtn.addEventListener("click",function(){if(typeof DV_AUTH!=="undefined"){DV_AUTH.showModal=true;DV_AUTH.modalTab="signin";DV_AUTH.error="";}render();});
  }
  controls.appendChild(avatarBtn);
  header.appendChild(controls);
  main.appendChild(header);

  // Demo Mode banner
  if(typeof DV_AUTH!=="undefined"&&DV_AUTH.isDemo){
    var demoBanner=el("div",{style:{background:"linear-gradient(90deg,rgba(139,92,246,0.15),rgba(139,92,246,0.05))",borderBottom:"1px solid rgba(139,92,246,0.2)",padding:"6px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px"}});
    demoBanner.appendChild(span({color:"#A78BFA",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"✦ DEMO MODE — Data is simulated. Sign up to save your work."));
    var exitDemo=el("button",{style:{background:"rgba(139,92,246,0.15)",border:"1px solid rgba(139,92,246,0.3)",color:"#A78BFA",borderRadius:"6px",padding:"3px 10px",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",whiteSpace:"nowrap"}});
    exitDemo.textContent="Sign Up Free";
    exitDemo.addEventListener("click",function(){DV_AUTH.isDemo=false;DV_AUTH.user=null;DV_AUTH.profile=null;DV_AUTH.showModal=true;DV_AUTH.modalTab="signup";if(typeof restoreFromDemoBackup==="function")restoreFromDemoBackup();render();});
    demoBanner.appendChild(exitDemo);
    main.appendChild(demoBanner);
  }

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
      p.addEventListener("click",function(){setSection(currentSection,sub.id);});
      pillBar.appendChild(p);
    });
    main.appendChild(wrapHScroll(pillBar));
  }

  if(!(currentSection==="Market"&&currentSubTab==="News")&&typeof stopNewsPolling==="function")stopNewsPolling();

  // Content area
  var content=el("div",{className:"dv-content",style:{flex:"1",overflow:"auto",width:"100%",maxWidth:"100%",boxSizing:"border-box",overflowX:"hidden"}});

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  FROZEN ROUTING — DO NOT MODIFY WITHOUT EXPLICIT USER APPROVAL         ║
  // ║  Each route MUST match NAV_SECTIONS in js/core.js and CLAUDE.md.       ║
  // ║  Section→SubTab→renderFunction mapping is the single source of truth.  ║
  // ║  Last locked: 2026-07-04                                               ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  if(currentSection==="Home"){
    content.appendChild(renderHome());
  } else if(currentSection==="Market"){
    if(currentSubTab==="Dashboard")content.appendChild(renderMarket());
    else if(currentSubTab==="QuickCheck")content.appendChild(renderQuickCheck());
    else if(currentSubTab==="TrackRecord")content.appendChild(renderTrackRecord());
    else if(currentSubTab==="Analyzer")content.appendChild(renderAnalyzer());
    else if(currentSubTab==="Index")content.appendChild(renderMarketIndex());
    else if(currentSubTab==="Compare")content.appendChild(renderCompare());
    else if(currentSubTab==="Find")content.appendChild(renderFind());
    else if(currentSubTab==="Map")content.appendChild(renderMap());
    else if(currentSubTab==="Advisor")content.appendChild(renderPersonal());
    else if(currentSubTab==="News"&&typeof renderNews==="function")content.appendChild(renderNews());
    else content.appendChild(renderMarket());
  } else if(currentSection==="Portfolio"){
    if(currentSubTab==="Assets")content.appendChild(renderPortfolio("assets"));
    else if(currentSubTab==="Health")content.appendChild(renderPortfolio("health"));
    else if(currentSubTab==="Projections")content.appendChild(renderPortfolio("projections"));
    else if(currentSubTab==="Alerts")content.appendChild(renderAlerts());
    else content.appendChild(renderPortfolio("assets"));
  } else if(currentSection==="Network"){
    if(currentSubTab==="Deals")content.appendChild(renderDeals());
    else if(currentSubTab==="Chat")content.appendChild(renderChat());
    else if(currentSubTab==="Chiefs"&&typeof renderChiefs==="function")content.appendChild(renderChiefs());
    else content.appendChild(renderDeals());
  } else if(currentSection==="SocialMedia"){
    if(currentSubTab==="Studio"&&typeof renderMediaStudio==="function")content.appendChild(renderMediaStudio("studio"));
    else if(currentSubTab==="Avatar"&&typeof renderMediaStudio==="function")content.appendChild(renderMediaStudio("avatar"));
    else if(currentSubTab==="VideoPlatform")content.appendChild(renderSocial());
    else if(currentSubTab==="SocialChat")content.appendChild(renderChat());
    else if(typeof renderMediaStudio==="function")content.appendChild(renderMediaStudio());
    else content.appendChild(renderChat());
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

  // Chiefs Co-pilot overlay (fixed, appended to body so it layers above everything)
  if (typeof renderChiefsCopilotOverlay === "function") {
    var _existingCp = document.getElementById("chiefs-copilot-container");
    if (_existingCp) _existingCp.remove();
    var _cpOverlay = renderChiefsCopilotOverlay();
    if (_cpOverlay) { _cpOverlay.id = "chiefs-copilot-container"; document.body.appendChild(_cpOverlay); }
  }

  main.appendChild(div({padding:"16px",textAlign:"center",boxSizing:"border-box",width:"100%",maxWidth:"100%"},[
    span({color:"rgba(107,122,158,0.5)",fontSize:"9px",fontFamily:"'Inter',sans-serif"},t("footer_tag")),
  ]));

  layout.appendChild(main);
  app.appendChild(layout);

  // --- BOTTOM TABS (mobile) — Modern floating nav ---
  var bottomBar=el("div",{});
  bottomBar.className="dv-bottom-tabs";
  NAV_SECTIONS.forEach(function(sec){
    var isActive=currentSection===sec.id;
    var tab=el("div",{});
    tab.className="dv-bottom-tab"+(isActive?" active":"");
    var ic=el("span",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:"24px",height:"24px"}});
    ic.innerHTML='<i data-lucide="'+sec.icon+'" style="width:22px;height:22px;stroke-width:'+(isActive?"2":"1.5")+'"></i>';
    tab.appendChild(ic);
    var label=el("span",{style:{fontSize:"9px",fontWeight:isActive?"700":"500",letterSpacing:"0.02em",opacity:isActive?"1":"0.7"}});
    label.textContent=sec.label;
    tab.appendChild(label);
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

  // Proactive news prefetch: start fetching in the background so News tab loads instantly
  if(!window._newsPrefetchStarted){
    window._newsPrefetchStarted=true;
    setTimeout(function(){
      if(typeof _fetchNews==="function"&&typeof NEWS_STATE!=="undefined"&&!NEWS_STATE.loading){
        var stale=!NEWS_STATE.articles.length||(Date.now()-NEWS_STATE.lastFetch)>300000;
        if(stale)_fetchNews(false);
      }
    },4000);
  }
}
