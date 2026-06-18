// --- COMPARE TAB -------------------------------------------------------------
function renderCompare(){
  const cl=C();const s=compareState;
  const wrap=div({padding:"20px",maxWidth:"640px",margin:"0 auto"});
  wrap.appendChild(div({marginBottom:"16px"},[span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"◆ Area Comparison"),span({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"AI-powered side-by-side analysis")]));
  const card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"14px"});
  const g=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px"});
  const a1W=div({});a1W.appendChild(lbl("Area A"));a1W.appendChild(mkSelect(S(),["Select…",...AREA_NAMES],s.a1,function(v){compareState.a1=v;}));g.appendChild(a1W);
  const a2W=div({});a2W.appendChild(lbl("Area B"));a2W.appendChild(mkSelect(S(),["Select…",...AREA_NAMES],s.a2,function(v){compareState.a2=v;}));g.appendChild(a2W);
  const bW=div({});bW.appendChild(lbl("Budget (AED)"));bW.appendChild(inp(I(),"e.g. 3,000,000","number",s.budget,function(v){compareState.budget=v;}));g.appendChild(bW);
  const pW=div({});pW.appendChild(lbl("Purpose"));pW.appendChild(mkSelect(S(),["Investment","End-Use","Rental Income","Capital Appreciation","Off-Plan Flip"],s.purpose,function(v){compareState.purpose=v;}));g.appendChild(pW);
  card.appendChild(g);
  card.appendChild(el("button",{style:{background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:"#070B14",border:"none",padding:"12px 28px",borderRadius:"8px",fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"},onclick:async function(){
    if(!s.a1||!s.a2||s.a1==="Select…"||s.a2==="Select…")return;
    compareState.loading=true;compareState.result="";render();
    try{
      const d1=AREAS[s.a1]||{};const d2=AREAS[s.a2]||{};
      const text=await askAI([{role:"user",content:"Compare for a client — Dubai June 2026:\nArea A: "+s.a1+" — avg PSF AED "+(d1.psf||"N/A")+", yield "+(d1.y||["N/A","N/A"]).join("-")+"%\nArea B: "+s.a2+" — avg PSF AED "+(d2.psf||"N/A")+", yield "+(d2.y||["N/A","N/A"]).join("-")+"%\nBudget: "+(s.budget?"AED "+parseInt(s.budget).toLocaleString():"not specified")+" | Purpose: "+s.purpose+"\n\nPSF · Yield · 3yr growth · Demand/liquidity · Risk · Decisive verdict"}],"You are DubAIVal AI. June 2026 Dubai market expert. Specific AED numbers only. No fluff. 5 sections, 2 sentences each.");
      compareState.result=text;
    }catch(e){compareState.result="Error: "+e.message;}
    compareState.loading=false;render();
  }},"▶ Compare"));
  wrap.appendChild(card);
  if(s.loading){wrap.appendChild(div({textAlign:"center",padding:"20px"},[div({width:"36px",height:"36px",borderRadius:"50%",border:"2px solid "+cl.border,borderTopColor:cl.gold,animation:"spin 0.8s linear infinite",margin:"0 auto"})]))}
  if(s.result&&!s.loading){
    const r=div({background:cl.surface,border:"1px solid "+cl.goldDim,borderRadius:"14px",padding:"20px"});
    r.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"◆ "+s.a1+" vs "+s.a2));
    const t=div({color:cl.subHi,fontSize:"13.5px",lineHeight:"1.9",fontFamily:"'Inter',sans-serif",whiteSpace:"pre-wrap"});t.textContent=s.result;r.appendChild(t);wrap.appendChild(r);
  }
  return wrap;
}

// --- PERSONAL TAB ------------------------------------------------------------
function renderPersonal(){
  const cl=C();const p=personalState;
  const wrap=div({padding:"20px",maxWidth:"640px",margin:"0 auto"});
  wrap.appendChild(div({marginBottom:"16px"},[span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"◆ Personal Property Advisor"),span({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"Tell us about yourself — get tailored recommendations")]));
  const card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"14px"});
  card.appendChild(fld("Budget (AED) *",inp(I(),"2,000,000","number",p.budget,function(v){personalState.budget=v;})));
  const g=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px"});
  const rW=div({});rW.appendChild(lbl("I am"));rW.appendChild(mkSelect(S(),["Investor","End-User","First-Time Buyer","Upgrader","Relocating"],p.role,function(v){personalState.role=v;}));g.appendChild(rW);
  const puW=div({});puW.appendChild(lbl("Purpose"));puW.appendChild(mkSelect(S(),["Investment","End-Use","Rental Income","Golden Visa","Vacation Home"],p.purpose,function(v){personalState.purpose=v;}));g.appendChild(puW);
  const fW=div({});fW.appendChild(lbl("Family"));fW.appendChild(mkSelect(S(),["Single","Couple","Family with Kids","Retiree"],p.family,function(v){personalState.family=v;}));g.appendChild(fW);
  const cW=div({});cW.appendChild(lbl("Children"));cW.appendChild(mkSelect(S(),["0","1","2","3","4+"],p.children,function(v){personalState.children=v;}));g.appendChild(cW);
  const tlW=div({});tlW.appendChild(lbl("Timeline"));tlW.appendChild(mkSelect(S(),["1 month","3 months","6 months","1 year","2+ years"],p.timeline,function(v){personalState.timeline=v;}));g.appendChild(tlW);
  card.appendChild(g);
  card.appendChild(fld("Work Location",inp(I(),"DIFC, Downtown, Work from home…","text",p.work,function(v){personalState.work=v;})));
  card.appendChild(el("button",{style:{width:"100%",padding:"13px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:"#070B14",fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",cursor:"pointer"},onclick:async function(){
    if(!p.budget)return;
    personalState.loading=true;personalState.result="";render();
    try{
      const text=await askAI([{role:"user",content:"My profile:\nBudget: AED "+parseInt(p.budget).toLocaleString()+" | I am: "+p.role+" | Family: "+p.family+" | Children: "+p.children+"\nWork: "+(p.work||"flexible")+" | Purpose: "+p.purpose+" | Timeline: "+p.timeline+"\n\nGive me 3 specific area recommendations, 3 communities, and 3 buildings in Dubai.\nFor each: current PSF range, expected yield, lifestyle fit, why it matches my profile.\nBe specific with AED numbers."}],"You are DubAIVal Personal Advisor. June 2026 Dubai expert. Specific AED numbers, direct recommendations, no fluff.");
      personalState.result=text;
    }catch(e){personalState.result="Error: "+e.message;}
    personalState.loading=false;render();
  }},"GET RECOMMENDATIONS →"));
  wrap.appendChild(card);
  if(p.loading){wrap.appendChild(div({textAlign:"center",padding:"20px"},[div({width:"36px",height:"36px",borderRadius:"50%",border:"2px solid "+cl.border,borderTopColor:cl.gold,animation:"spin 0.8s linear infinite",margin:"0 auto"})]))}
  if(p.result&&!p.loading){
    const r=div({background:cl.surface,border:"1px solid "+cl.goldDim,borderRadius:"14px",padding:"20px"});
    r.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"◆ Your Recommendations"));
    const t=div({color:cl.subHi,fontSize:"13.5px",lineHeight:"1.9",fontFamily:"'Inter',sans-serif",whiteSpace:"pre-wrap"});t.textContent=p.result;r.appendChild(t);wrap.appendChild(r);
  }
  return wrap;
}

// --- PORTFOLIO TAB -----------------------------------------------------------
if(!window.PORTFOLIO_STATE){
  var _pa;try{_pa=JSON.parse(localStorage.getItem("dubaival_portfolio"))||[];}catch(e){_pa=[];}
  var _pg;try{_pg=JSON.parse(localStorage.getItem("dubaival_portfolio_goals"))||{risk:"Moderate",horizon:"3-5 years",target:"Capital Growth"};}catch(e){_pg={risk:"Moderate",horizon:"3-5 years",target:"Capital Growth"};}
  window.PORTFOLIO_STATE={assets:_pa,goals:_pg,showAdd:false,aiAnalysis:"",aiLoading:false,aiErr:"",expandedId:null};
}
function computeAssetMetrics(asset){
  var aData=AREAS[asset.area]||{psf:1800,sc:15,y:[5,7],g:[10,18,28]};
  var bData=lookupBuilding(asset.building,asset.area);
  var basePSF=bData?bData.p:aData.psf;
  var vP=VIEW_P[asset.view]||0;
  var floorN=parseInt(asset.floor)||20;
  var fP=floorN>10?(floorN-10)*0.005:0;
  var furnP=asset.furnished==="Furnished"?0.15:asset.furnished==="Semi-Furnished"?0.07:0;
  var isV=asset.type==="Villa"||asset.type==="Townhouse";
  var geoAdj=getAreaGeoAdj(asset.area);
  var typeAdj=isV?MACRO_VARS.villaAdj:MACRO_VARS.aptAdj;
  var hedonicMult=(1+vP)*(1+fP)*(1+furnP)*(1+geoAdj+typeAdj);
  var adjPSF=Math.round(basePSF*hedonicMult);
  var size=parseInt(asset.size)||0;
  var currentValue=adjPSF*size;
  var purchasePrice=parseInt(asset.purchasePrice)||0;
  var roi=purchasePrice>0?((currentValue-purchasePrice)/purchasePrice*100):0;
  var bn={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5}[asset.beds]!=null?{"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5}[asset.beds]:2;
  var rent=isV?(bn<=3?aData.rv3||180000:aData.rv4||240000):bn===0?(aData.r1||65000)*0.65:bn===1?aData.r1||65000:bn===2?aData.r2||100000:bn===3?aData.r3||150000:(aData.r3||150000)*1.4;
  var sc=(parseFloat(asset.serviceCharge)||(bData&&bData.sc)||aData.sc||15)*size;
  var grossYield=currentValue>0?(rent/currentValue*100):0;
  var netYield=currentValue>0?((rent-sc)/currentValue*100):0;
  var gr=aData.g||[10,18,28];
  var purchaseDate=new Date(asset.purchaseDate);
  var now=new Date();
  var holdingMonths=Math.max(1,Math.round((now-purchaseDate)/(30.44*24*60*60*1000)));
  var holdingYears=holdingMonths/12;
  var annualizedROI=holdingYears>0&&purchasePrice>0?(Math.pow(currentValue/purchasePrice,1/holdingYears)-1)*100:roi;
  var prRatio=grossYield>0?(100/grossYield):20;
  var investSignal=prRatio<15?"Undervalued":prRatio<20?"Fair Value":prRatio<25?"Elevated":"Overheated";
  var totalReturn=netYield+(gr[1]||18)/3;
  var domEst=aData.dom||60;
  var txVol=aData.txVol||100;
  var liqScore=domEst<=20?95:domEst<=30?85:domEst<=45?72:domEst<=65?55:domEst<=90?40:25;
  var liqLabel=liqScore>=90?"Very High":liqScore>=80?"High":liqScore>=65?"Moderate":liqScore>=45?"Low":liqScore>=30?"Very Low":"Illiquid";
  var bldgUnits=estimateBldgUnits(asset.building,bData,isV);
  var bldgAnnualTx=estimateBldgTx(asset.building,asset.area,aData,bData);
  var turnoverRate=bldgUnits>0?Math.round(bldgAnnualTx/bldgUnits*1000)/10:0;
  var turnoverLabel=turnoverRate>=12?"Hot Market":turnoverRate>=6?"Active":turnoverRate>=3?"Stable":turnoverRate>=1?"Slow":"Stagnant";
  // MoS for portfolio
  var purchasePSF=purchasePrice>0&&size>0?Math.round(purchasePrice/size):0;
  var camVsPct=purchasePSF>0&&adjPSF>0?((purchasePSF-adjPSF)/adjPSF*100):0;
  var camPriceGap=camVsPct<=-20?95:camVsPct<=-12?85:camVsPct<=-5?72:camVsPct<=0?58:camVsPct<=5?42:camVsPct<=12?25:10;
  var camScPSF=parseFloat(asset.serviceCharge)||(bData&&bData.sc)||aData.sc||15;
  var camScRatio=(aData.sc||15)>0?camScPSF/(aData.sc||15):1;
  var camTimeDecay=camScRatio<=0.75?90:camScRatio<=0.95?75:camScRatio<=1.10?60:camScRatio<=1.35?40:20;
  var camAreaPsf=aData.psf||1500;
  var camPsfDev=camAreaPsf>0?Math.abs(adjPSF-camAreaPsf)/camAreaPsf:0.5;
  var camMarketDepth=camPsfDev<=0.15?90:camPsfDev<=0.30?72:camPsfDev<=0.50?50:camPsfDev<=0.75?30:15;
  var camMosScore=Math.min(95,Math.max(5,Math.round(camPriceGap*0.50+camTimeDecay*0.20+camMarketDepth*0.30)));
  var camMosTier=camMosScore>=80?"Deep Value":camMosScore>=65?"Value Buy":camMosScore>=50?"Fair Entry":camMosScore>=35?"Thin Margin":"Speculative";
  return{currentPSF:adjPSF,currentValue:currentValue,purchasePrice:purchasePrice,roi:roi,rent:rent,sc:sc,grossYield:grossYield,netYield:netYield,holdingMonths:holdingMonths,annualizedROI:annualizedROI,g0:gr[0],g1:gr[1],g2:gr[2],inDB:!!bData,grade:bData?bData.g:"N/A",areaYield:aData.y||[5,7],investSignal:investSignal,totalReturn:totalReturn,domEst:domEst,txVol:txVol,liqScore:liqScore,liqLabel:liqLabel,turnoverRate:turnoverRate,turnoverLabel:turnoverLabel,bldgUnits:bldgUnits,bldgAnnualTx:bldgAnnualTx,mosScore:camMosScore,mosTier:camMosTier};
}
function computePortfolioHealth(metrics,totalValue){
if(!metrics.length)return null;
var ad={},td={apt:0,villa:0};
metrics.forEach(function(a){ad[a.area]=(ad[a.area]||0)+a.m.currentValue;var isV=a.type==="Villa"||a.type==="Townhouse";if(isV)td.villa+=a.m.currentValue;else td.apt+=a.m.currentValue;});
var hhi=0;Object.values(ad).forEach(function(v){var s=v/totalValue;hhi+=s*s;});
var nA=Object.keys(ad).length;var minH=nA>1?1/nA:1;var hhNorm=1>minH?(1-hhi)/(1-minH):0;
var areaSc=10+hhNorm*85;
var hasBoth=td.apt>0&&td.villa>0;var typeSc=hasBoth?88:55;
var divSc=Math.round(areaSc*0.7+typeSc*0.3);
var avgLiq=metrics.reduce(function(s,a){return s+a.m.liqScore;},0)/metrics.length;
var avgTO=metrics.reduce(function(s,a){return s+a.m.turnoverRate;},0)/metrics.length;
var toB=avgTO>=8?15:avgTO>=4?10:avgTO>=2?5:0;
var liqSc=Math.min(95,Math.round(avgLiq*0.8+toB+10));
var avgNY=metrics.reduce(function(s,a){return s+a.m.netYield;},0)/metrics.length;
var avgMoS=metrics.reduce(function(s,a){return s+a.m.mosScore;},0)/metrics.length;
var ySc=avgNY>=7?92:avgNY>=5.5?80:avgNY>=4?65:avgNY>=2.5?45:25;
var rrSc=Math.round(ySc*0.6+avgMoS*0.4);
var avgROI=metrics.reduce(function(s,a){return s+a.m.roi;},0)/metrics.length;
var avgTR=metrics.reduce(function(s,a){return s+a.m.totalReturn;},0)/metrics.length;
var roiSc=avgROI>=30?95:avgROI>=15?82:avgROI>=5?68:avgROI>=0?50:avgROI>=-10?30:15;
var trSc=avgTR>=10?90:avgTR>=7?75:avgTR>=5?60:avgTR>=3?40:20;
var grSc=Math.round(roiSc*0.5+trSc*0.5);
var raw=Math.round(divSc*0.25+liqSc*0.25+rrSc*0.25+grSc*0.25);
var score=Math.min(95,Math.max(5,raw));
var tier=score>=85?"Excellent":score>=70?"Strong":score>=55?"Moderate":score>=40?"Needs Attention":"At Risk";
var weakest="div";var wVal=divSc;
if(liqSc<wVal){weakest="liq";wVal=liqSc;}if(rrSc<wVal){weakest="rr";wVal=rrSc;}if(grSc<wVal){weakest="gr";wVal=grSc;}
var insight="";
if(weakest==="div"){if(nA<2)insight="Consider diversifying across multiple areas to reduce concentration risk";else if(!hasBoth)insight="Adding "+(td.villa?"apartments":"villas/townhouses")+" would improve type diversification";else insight="Strong diversification — maintain balance across areas and types";}
else if(weakest==="liq")insight="Some assets are in low-liquidity markets — monitor exit timing carefully";
else if(weakest==="rr")insight="Risk-adjusted returns could improve — look for higher-yield or better-value entries";
else insight="Growth outlook is your weakest dimension — consider areas with stronger appreciation trends";
return{score:score,tier:tier,div:divSc,liq:liqSc,rr:rrSc,gr:grSc,insight:insight,nAreas:nA,hasBoth:hasBoth};
}
function renderPortfolio(){
  var cl=C();var ps=window.PORTFOLIO_STATE;
  var wrap=div({padding:"20px",maxWidth:"640px",margin:"0 auto"});
  wrap.appendChild(div({marginBottom:"16px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"◆ Portfolio Manager"),
    span({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"Track assets, monitor performance & get AI-powered signals")
  ]));

  var metrics=ps.assets.map(function(a){return Object.assign({},a,{m:computeAssetMetrics(a)});});
  var totalValue=metrics.reduce(function(s,a){return s+a.m.currentValue;},0);
  var totalPurchase=metrics.reduce(function(s,a){return s+a.m.purchasePrice;},0);
  var totalROI=totalPurchase>0?((totalValue-totalPurchase)/totalPurchase*100):0;
  var totalRent=metrics.reduce(function(s,a){return s+a.m.rent;},0);
  var totalSC=metrics.reduce(function(s,a){return s+a.m.sc;},0);
  var avgGrossYield=totalValue>0?(totalRent/totalValue*100):0;
  var avgNetYield=totalValue>0?((totalRent-totalSC)/totalValue*100):0;

  // Portfolio Overview
  if(ps.assets.length>0){
    var sumCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"14px",position:"relative",overflow:"hidden"});
    sumCard.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,"+cl.gold+","+cl.gold+",transparent)",animation:"shimmer 3s ease infinite"}));
    sumCard.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"14px"},"◆ Portfolio Overview"));

    var g1=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"});
    [{l:"Total Value",v:"AED "+totalValue.toLocaleString(),c:cl.gold},{l:"Total ROI",v:(totalROI>=0?"+":"")+totalROI.toFixed(1)+"%",c:totalROI>=0?cl.green:cl.red},{l:"Gross Yield",v:avgGrossYield.toFixed(1)+"%",c:cl.green},{l:"Net Yield",v:avgNetYield.toFixed(1)+"%",c:cl.green}].forEach(function(item){
      var box=div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"});
      box.appendChild(lbl(item.l));
      box.appendChild(span({color:item.c,fontSize:"17px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},item.v));
      g1.appendChild(box);
    });
    sumCard.appendChild(g1);

    var g2=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"12px"});
    var pnl=totalValue-totalPurchase;
    [{l:"Assets",v:String(ps.assets.length),c:cl.white},{l:"Annual Rent",v:"AED "+totalRent.toLocaleString(),c:cl.white},{l:"Unrealized P&L",v:(pnl>=0?"+":"")+"AED "+pnl.toLocaleString(),c:pnl>=0?cl.green:cl.red}].forEach(function(item){
      var box=div({background:cl.raised,borderRadius:"10px",padding:"10px 12px"});
      box.appendChild(lbl(item.l));
      box.appendChild(span({color:item.c,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},item.v));
      g2.appendChild(box);
    });
    sumCard.appendChild(g2);

    // Area Allocation bar
    var areaDist={};
    metrics.forEach(function(a){areaDist[a.area]=(areaDist[a.area]||0)+a.m.currentValue;});
    var areaEntries=Object.entries(areaDist).sort(function(a,b){return b[1]-a[1];});
    if(areaEntries.length>0){
      sumCard.appendChild(lbl("Area Allocation"));
      var barColors=[cl.gold,cl.green,cl.blue,cl.yellow,cl.red,cl.goldDim];
      var bar=div({display:"flex",height:"8px",borderRadius:"4px",overflow:"hidden",marginTop:"6px",marginBottom:"8px"});
      areaEntries.forEach(function(e,i){bar.appendChild(div({width:(e[1]/totalValue*100)+"%",background:barColors[i%barColors.length]}));});
      sumCard.appendChild(bar);
      var legend=div({display:"flex",flexWrap:"wrap",gap:"8px"});
      areaEntries.forEach(function(e,i){
        legend.appendChild(div({display:"flex",alignItems:"center",gap:"4px"},[
          div({width:"8px",height:"8px",borderRadius:"2px",background:barColors[i%barColors.length],flexShrink:"0"}),
          span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},e[0]+" "+(e[1]/totalValue*100).toFixed(0)+"%"),
        ]));
      });
      sumCard.appendChild(legend);
    }
    wrap.appendChild(sumCard);

    // Portfolio Health Score
    var health=computePortfolioHealth(metrics,totalValue);
    if(health){
      var hCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"14px",position:"relative",overflow:"hidden"});
      var hScColor=health.score>=70?cl.green:health.score>=55?cl.yellow:cl.red;
      hCard.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,"+hScColor+","+hScColor+",transparent)",animation:"shimmer 3s ease infinite"}));
      hCard.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"16px"},"◆ Portfolio Health Score"));
      var scoreAngle=Math.round(health.score/100*360);
      var circleWrap=div({display:"flex",flexDirection:"column",alignItems:"center",marginBottom:"18px"});
      var circle=div({width:"110px",height:"110px",borderRadius:"50%",background:"conic-gradient("+hScColor+" "+scoreAngle+"deg, "+cl.border+" "+scoreAngle+"deg)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 24px "+hScColor+"30"});
      var inner=div({width:"84px",height:"84px",borderRadius:"50%",background:cl.surface,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"});
      inner.appendChild(span({color:hScColor,fontSize:"32px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",lineHeight:"1"},String(health.score)));
      inner.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},"/100"));
      circle.appendChild(inner);circleWrap.appendChild(circle);
      var tierBg=health.score>=70?cl.greenBg:health.score>=55?cl.yellowBg:cl.redBg;
      var tierBo=health.score>=70?cl.greenBo:health.score>=55?cl.yellowBo:cl.redBo;
      circleWrap.appendChild(div({marginTop:"10px",padding:"4px 16px",borderRadius:"20px",background:tierBg,border:"1px solid "+tierBo},[span({color:hScColor,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em"},health.tier)]));
      hCard.appendChild(circleWrap);
      var compGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"});
      [{l:"Diversification",v:health.div,icon:"◈"},{l:"Liquidity",v:health.liq,icon:"◆"},{l:"Risk-Return",v:health.rr,icon:"◇"},{l:"Growth",v:health.gr,icon:"▲"}].forEach(function(c){
        var cBox=div({background:cl.raised,borderRadius:"8px",padding:"10px 12px"});
        var cHead=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"});
        cHead.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},c.icon+" "+c.l));
        var cColor=c.v>=70?cl.green:c.v>=55?cl.yellow:cl.red;
        cHead.appendChild(span({color:cColor,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},c.v));
        cBox.appendChild(cHead);
        var barBg=div({height:"4px",borderRadius:"2px",background:cl.border,overflow:"hidden"});
        barBg.appendChild(div({height:"100%",width:c.v+"%",borderRadius:"2px",background:"linear-gradient(90deg,"+cColor+","+cColor+"90)",transition:"width 1s ease"}));
        cBox.appendChild(barBg);compGrid.appendChild(cBox);
      });
      hCard.appendChild(compGrid);
      if(health.insight){
        hCard.appendChild(div({background:cl.goldFaint,border:"1px solid "+cl.goldDim+"30",borderRadius:"8px",padding:"10px 12px"},[
          span({color:cl.gold,fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",display:"block",marginBottom:"3px"},"INSIGHT"),
          span({color:cl.subHi,fontSize:"11.5px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},health.insight)
        ]));
      }
      wrap.appendChild(hCard);
    }

    // Future Projection Simulator
    if(!ps._proj)ps._proj={growth:0,rate:0};
    var projCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"14px",position:"relative",overflow:"hidden"});
    projCard.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,"+cl.gold+","+cl.gold+",transparent)",animation:"shimmer 3s ease infinite"}));
    projCard.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"14px"},"◆ Future Projection Simulator"));
    projCard.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",display:"block",marginBottom:"16px"},"Adjust assumptions to see how your portfolio evolves"));
    var gAdj=ps._proj.growth;var rAdj=ps._proj.rate;
    function mkSlider(label,min,max,step,val,suffix,onChange){
      var sw=div({marginBottom:"16px"});
      var sh=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"});
      sh.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},label));
      var valSpan=span({color:val>0?cl.green:val<0?cl.red:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(val>0?"+":"")+val+suffix);
      sh.appendChild(valSpan);sw.appendChild(sh);
      var si=el("input",{style:{width:"100%",height:"6px",borderRadius:"3px",appearance:"none",WebkitAppearance:"none",background:"linear-gradient(90deg,"+cl.red+","+cl.border+" 50%,"+cl.green+")",outline:"none",cursor:"pointer",accentColor:cl.gold},type:"range"});
      si.min=String(min);si.max=String(max);si.step=String(step);si.value=String(val);
      si.addEventListener("input",function(){onChange(parseFloat(si.value));});
      sw.appendChild(si);
      var ticks=div({display:"flex",justifyContent:"space-between",marginTop:"2px"});
      ticks.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},min+suffix));
      ticks.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"0"+suffix));
      ticks.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"+"+max+suffix));
      sw.appendChild(ticks);return sw;
    }
    projCard.appendChild(mkSlider("Market Growth Adjustment",-30,30,5,gAdj,"%",function(v){ps._proj.growth=v;render();}));
    projCard.appendChild(mkSlider("Interest Rate Change",-3,5,0.5,rAdj,"%",function(v){ps._proj.rate=v;render();}));
    var projYears=[1,3,5];
    var projGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"14px"});
    projYears.forEach(function(yr){
      var projVal=0;var projRent=0;
      metrics.forEach(function(a){
        var baseGrowth=(yr===1?a.m.g0:yr===3?a.m.g1:a.m.g2)||10;
        var adjGrowth=baseGrowth+gAdj;
        var cappedGrowth=Math.max(-50,Math.min(100,adjGrowth));
        var futureVal=a.m.currentValue*(1+cappedGrowth/100);
        projVal+=futureVal;
        var yieldImpact=rAdj>0?Math.max(0.7,1-rAdj*0.04):Math.min(1.3,1-rAdj*0.04);
        projRent+=a.m.rent*yieldImpact*(1+cappedGrowth/200);
      });
      var projROI=totalPurchase>0?((projVal-totalPurchase)/totalPurchase*100):0;
      var projYield=projVal>0?(projRent/projVal*100):0;
      var valChange=projVal-totalValue;
      var pBox=div({background:cl.raised,borderRadius:"10px",padding:"12px 10px",textAlign:"center"});
      pBox.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",textTransform:"uppercase",letterSpacing:"0.08em",display:"block",marginBottom:"8px"},yr+" Year"));
      pBox.appendChild(span({color:cl.gold,fontSize:"15px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",display:"block",lineHeight:"1.2"},"AED"));
      pBox.appendChild(span({color:cl.gold,fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"6px"},Math.round(projVal/1000).toLocaleString()+"K"));
      pBox.appendChild(div({height:"1px",background:cl.border,margin:"6px 0"}));
      var chColor=valChange>=0?cl.green:cl.red;
      pBox.appendChild(span({color:chColor,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},(valChange>=0?"+":"")+"AED "+Math.round(valChange/1000).toLocaleString()+"K"));
      pBox.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",display:"block",marginTop:"2px"},"ROI "+(projROI>=0?"+":"")+projROI.toFixed(0)+"% · Yield "+projYield.toFixed(1)+"%"));
      projGrid.appendChild(pBox);
    });
    projCard.appendChild(projGrid);
    var projInsight="";
    if(gAdj<=-10)projInsight="Stress scenario: significant market correction. Focus on cash flow and avoid leverage.";
    else if(gAdj<0)projInsight="Cautious outlook: moderate pullback expected. High-yield assets outperform in this scenario.";
    else if(gAdj>=20)projInsight="Bull scenario: strong appreciation. Consider locking in gains on overheated segments.";
    else if(gAdj>=10)projInsight="Optimistic outlook: above-trend growth. Growth-oriented areas benefit most.";
    else projInsight="Base case: in-line with current market forecasts from AREAS database.";
    if(rAdj>=2)projInsight+=" Higher rates compress yields and reduce buyer demand — watch for pricing pressure.";
    else if(rAdj<=-1)projInsight+=" Lower rates boost affordability and may accelerate capital inflows.";
    projCard.appendChild(div({background:cl.goldFaint,border:"1px solid "+cl.goldDim+"30",borderRadius:"8px",padding:"10px 12px"},[
      span({color:cl.gold,fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",display:"block",marginBottom:"3px"},"SCENARIO ANALYSIS"),
      span({color:cl.subHi,fontSize:"11.5px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},projInsight)
    ]));
    wrap.appendChild(projCard);
  }

  // Investment Profile
  var goalsCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px"});
  goalsCard.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"◆ Investment Profile"));
  var goalsGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"});
  [{l:"Risk Appetite",k:"risk",opts:["Conservative","Moderate","Aggressive"]},{l:"Horizon",k:"horizon",opts:["1-2 years","3-5 years","5-10 years","10+ years"]},{l:"Target",k:"target",opts:["Capital Growth","Rental Income","Balanced","Quick Flip"]}].forEach(function(item){
    var g=div({});g.appendChild(lbl(item.l));
    g.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11.5px",padding:"8px 10px"}),item.opts,ps.goals[item.k],function(v){ps.goals[item.k]=v;localStorage.setItem("dubaival_portfolio_goals",JSON.stringify(ps.goals));ps.aiAnalysis="";render();}));
    goalsGrid.appendChild(g);
  });
  goalsCard.appendChild(goalsGrid);
  wrap.appendChild(goalsCard);

  // What-If Scenario Simulator
  if(metrics.length>0){
    if(!ps._swap)ps._swap={sellId:"",buyArea:"",buyType:"Apartment",buyBeds:"2 BR",buySize:"",showResult:false};
    var sw=ps._swap;
    var swCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"14px",position:"relative",overflow:"hidden"});
    swCard.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,#6366F1,#6366F1,transparent)",animation:"shimmer 3s ease infinite"}));
    swCard.appendChild(span({color:"#818CF8",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"◆ What-If Scenario"));
    swCard.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",display:"block",marginBottom:"16px"},"Sell an asset and reinvest — see how your cash flow changes"));
    var swGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px"});
    var sellW=div({});sellW.appendChild(lbl("Sell This Asset"));
    var sellOpts=["Select…"].concat(metrics.map(function(a){return(a.building||a.area)+" (AED "+Math.round(a.m.currentValue/1000)+"K)";}));
    var sellVals=[""].concat(metrics.map(function(a){return a.id;}));
    sellW.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11px",padding:"8px 10px"}),sellOpts,sw.sellId?sellOpts[sellVals.indexOf(sw.sellId)]||"Select…":"Select…",function(v){
      var idx=sellOpts.indexOf(v);sw.sellId=idx>0?sellVals[idx]:"";sw.showResult=false;render();
    }));
    swGrid.appendChild(sellW);
    var buyW=div({});buyW.appendChild(lbl("Buy In Area"));
    buyW.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11px",padding:"8px 10px"}),["Select…"].concat(AREA_NAMES),sw.buyArea||"Select…",function(v){sw.buyArea=v==="Select…"?"":v;sw.showResult=false;render();}));
    swGrid.appendChild(buyW);
    var buyW2=div({});buyW2.appendChild(lbl("Property Type"));
    buyW2.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11px",padding:"8px 10px"}),["Apartment","Villa","Townhouse"],sw.buyType,function(v){sw.buyType=v;sw.showResult=false;render();}));
    swGrid.appendChild(buyW2);
    var buyW3=div({});buyW3.appendChild(lbl("Bedrooms"));
    buyW3.appendChild(mkSelect(Object.assign({},S(),{fontSize:"11px",padding:"8px 10px"}),["Studio","1 BR","2 BR","3 BR","4 BR","5 BR"],sw.buyBeds,function(v){sw.buyBeds=v;sw.showResult=false;render();}));
    swGrid.appendChild(buyW3);
    swCard.appendChild(swGrid);
    var canSim=sw.sellId&&sw.buyArea;
    swCard.appendChild(btn({width:"100%",padding:"11px",borderRadius:"10px",border:"none",background:canSim?"linear-gradient(135deg,#6366F1,#818CF8)":cl.border,color:canSim?"#fff":cl.sub,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",marginBottom:sw.showResult?"14px":"0",opacity:canSim?"1":"0.5"},"SIMULATE SWAP ◆",function(){if(canSim){sw.showResult=true;render();}}));
    if(sw.showResult&&canSim){
      var sellAsset=metrics.find(function(a){return a.id===sw.sellId;});
      if(sellAsset){
        var saleProceeds=sellAsset.m.currentValue;
        var dldFee=Math.round(saleProceeds*0.04);
        var agentFee=Math.round(saleProceeds*0.02);
        var netProceeds=saleProceeds-dldFee-agentFee;
        var buyAreaData=AREAS[sw.buyArea]||{psf:1800,sc:15,y:[5,7],g:[10,18,28]};
        var buyPSF=buyAreaData.psf;
        var buyIsV=sw.buyType==="Villa"||sw.buyType==="Townhouse";
        var buySize=Math.round(netProceeds/(buyPSF*1.04));
        var buyDLD=Math.round(netProceeds/(1+0.04)*0.04);
        var buyPrice=netProceeds-buyDLD;
        var bn2={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5}[sw.buyBeds]||2;
        var buyRent=buyIsV?(bn2<=3?buyAreaData.rv3||180000:buyAreaData.rv4||240000):bn2===0?(buyAreaData.r1||65000)*0.65:bn2===1?buyAreaData.r1||65000:bn2===2?buyAreaData.r2||100000:bn2===3?buyAreaData.r3||150000:(buyAreaData.r3||150000)*1.4;
        var buySC=(buyAreaData.sc||15)*buySize;
        var buyGrossY=buyPrice>0?(buyRent/buyPrice*100):0;
        var buyNetY=buyPrice>0?((buyRent-buySC)/buyPrice*100):0;
        var buyGrowth=buyAreaData.g||[10,18,28];
        var sellRent=sellAsset.m.rent;var sellNetY=sellAsset.m.netYield;var sellGrowth=sellAsset.m.g1||18;
        var cashFlowDiff=Math.round((buyRent-buySC)-(sellRent-sellAsset.m.sc));
        var cashFlowPct=sellRent-sellAsset.m.sc>0?(cashFlowDiff/(sellRent-sellAsset.m.sc)*100):0;
        var growthDiff=(buyGrowth[1]||18)-(sellGrowth||18);
        var resCard=div({background:cl.raised,borderRadius:"10px",padding:"14px"});
        resCard.appendChild(span({color:"#818CF8",fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"SWAP ANALYSIS"));
        var resG=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"});
        [{l:"Sale Proceeds (Net)",v:"AED "+Math.round(netProceeds/1000).toLocaleString()+"K",s:"After 4% DLD + 2% agent",c:cl.white},
         {l:"Buy Power in "+sw.buyArea,v:buySize.toLocaleString()+" sqft",s:"At PSF "+buyPSF.toLocaleString(),c:cl.gold},
         {l:"Current Net Cash Flow",v:"AED "+Math.round(sellRent-sellAsset.m.sc).toLocaleString()+"/yr",s:sellAsset.building||sellAsset.area,c:cl.white},
         {l:"New Net Cash Flow",v:"AED "+Math.round(buyRent-buySC).toLocaleString()+"/yr",s:sw.buyArea+" "+sw.buyBeds,c:cashFlowDiff>=0?cl.green:cl.red}
        ].forEach(function(item){
          var b=div({background:cl.surface,borderRadius:"8px",padding:"10px 12px"});
          b.appendChild(lbl(item.l));
          b.appendChild(span({color:item.c,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},item.v));
          if(item.s)b.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",display:"block",marginTop:"2px"},item.s));
          resG.appendChild(b);
        });
        resCard.appendChild(resG);
        var verdictBox=div({background:cashFlowDiff>=0?cl.greenBg:cl.redBg,border:"1px solid "+(cashFlowDiff>=0?cl.greenBo:cl.redBo),borderRadius:"8px",padding:"12px",textAlign:"center",marginBottom:"10px"});
        verdictBox.appendChild(span({color:cashFlowDiff>=0?cl.green:cl.red,fontSize:"20px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",display:"block"},(cashFlowDiff>=0?"+":"")+"AED "+cashFlowDiff.toLocaleString()+"/yr"));
        verdictBox.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",display:"block",marginTop:"2px"},"Cash Flow "+(cashFlowPct>=0?"+":"")+cashFlowPct.toFixed(0)+"% · Net Yield "+sellNetY.toFixed(1)+"% → "+buyNetY.toFixed(1)+"% · 3yr Growth "+(growthDiff>=0?"+":"")+growthDiff.toFixed(0)+"pp"));
        resCard.appendChild(verdictBox);
        var verdict="";
        if(cashFlowDiff>0&&growthDiff>=0)verdict="Strong swap: higher cash flow AND better growth prospects. Consider executing.";
        else if(cashFlowDiff>0&&growthDiff<0)verdict="Cash flow improves but growth outlook weakens. Good for income-focused investors.";
        else if(cashFlowDiff<=0&&growthDiff>0)verdict="Lower immediate cash flow but stronger capital appreciation potential. Suits growth investors.";
        else verdict="This swap reduces both cash flow and growth — reconsider unless there are non-financial reasons.";
        resCard.appendChild(div({background:cl.goldFaint,borderRadius:"6px",padding:"8px 10px"},[
          span({color:cl.gold,fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",display:"block",marginBottom:"2px"},"VERDICT"),
          span({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},verdict)
        ]));
        swCard.appendChild(resCard);
      }
    }
    wrap.appendChild(swCard);
  }

  // Asset Cards
  metrics.forEach(function(a){
    var expanded=ps.expandedId===a.id;
    var roiColor=a.m.roi>=15?cl.green:a.m.roi>=0?cl.yellow:cl.red;
    var sigColor=a.m.investSignal==="Undervalued"||a.m.investSignal==="Fair Value"?cl.green:a.m.investSignal==="Elevated"?cl.yellow:cl.red;
    var card=el("div",{style:{background:cl.surface,border:"1px solid "+(expanded?cl.goldDim:cl.border),borderRadius:"14px",padding:"16px",marginBottom:"10px",cursor:"pointer",transition:"all 0.2s"},onclick:function(){ps.expandedId=expanded?null:a.id;render();}});

    var header=div({display:"flex",justifyContent:"space-between",alignItems:"flex-start"});
    var left=div({flex:"1"});
    var nameRow=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"});
    nameRow.appendChild(span({color:cl.white,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},a.building||a.area));
    if(a.m.inDB)nameRow.appendChild(pill(a.m.grade,"gold"));
    left.appendChild(nameRow);
    left.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace",display:"block"},a.area+" · "+a.beds+" · "+parseInt(a.size).toLocaleString()+" sqft"));
    header.appendChild(left);
    var right=div({textAlign:"right"});
    right.appendChild(span({color:cl.gold,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},"AED "+a.m.currentValue.toLocaleString()));
    right.appendChild(span({color:roiColor,fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",display:"block"},(a.m.roi>=0?"+":"")+a.m.roi.toFixed(1)+"% ROI"));
    header.appendChild(right);
    card.appendChild(header);

    var pills=div({display:"flex",gap:"8px",marginTop:"10px",flexWrap:"wrap"});
    pills.appendChild(pill("Yield "+a.m.grossYield.toFixed(1)+"%","green"));
    pills.appendChild(pill("PSF "+a.m.currentPSF.toLocaleString(),"gold"));
    pills.appendChild(pill(a.m.investSignal,sigColor===cl.green?"green":sigColor===cl.yellow?"yellow":"red"));
    pills.appendChild(pill(a.m.holdingMonths+"mo held","gray"));
    card.appendChild(pills);

    if(expanded){
      var details=div({marginTop:"14px",borderTop:"1px solid "+cl.border,paddingTop:"14px"});
      details.addEventListener("click",function(e){e.stopPropagation();});
      var dGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"});
      [{l:"Purchase Price",v:"AED "+a.m.purchasePrice.toLocaleString(),s:"PSF "+(parseInt(a.size)>0?Math.round(a.m.purchasePrice/parseInt(a.size)).toLocaleString():"—"),c:cl.white},{l:"Current Value",v:"AED "+a.m.currentValue.toLocaleString(),s:"PSF "+a.m.currentPSF.toLocaleString(),c:cl.gold},{l:"Annual Rent (Est.)",v:"AED "+a.m.rent.toLocaleString(),s:null,c:cl.white},{l:"Service Charge",v:"AED "+Math.round(a.m.sc).toLocaleString()+"/yr",s:null,c:cl.white},{l:"Gross Yield",v:a.m.grossYield.toFixed(1)+"%",s:null,c:cl.green},{l:"Net Yield",v:a.m.netYield.toFixed(1)+"%",s:null,c:cl.green}].forEach(function(item){
        var box=div({background:cl.raised,borderRadius:"8px",padding:"10px 12px"});
        box.appendChild(lbl(item.l));
        box.appendChild(span({color:item.c,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},item.v));
        if(item.s)box.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",display:"block"},item.s));
        dGrid.appendChild(box);
      });
      details.appendChild(dGrid);

      // Growth Forecast
      var forecast=div({background:cl.raised,borderRadius:"8px",padding:"10px 12px",marginBottom:"12px"});
      forecast.appendChild(lbl("3-Year Growth Forecast"));
      var fRow=div({display:"flex",justifyContent:"space-between",marginTop:"6px"});
      [{l:"Conservative",v:"+"+a.m.g0+"%",c:cl.yellow},{l:"Base",v:"+"+a.m.g1+"%",c:cl.green},{l:"Optimistic",v:"+"+a.m.g2+"%",c:cl.gold}].forEach(function(g){
        fRow.appendChild(div({textAlign:"center"},[
          span({color:g.c,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},g.v),
          span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",display:"block"},g.l),
        ]));
      });
      forecast.appendChild(fRow);
      details.appendChild(forecast);

      // Annualized Return + P&L
      var annBox=div({background:cl.goldFaint,border:"1px solid "+cl.goldDim,borderRadius:"8px",padding:"10px 12px",marginBottom:"12px",display:"flex",justifyContent:"space-between",alignItems:"center"});
      var annLeft=div({});
      annLeft.appendChild(lbl("Annualized Return"));
      annLeft.appendChild(span({color:a.m.annualizedROI>=0?cl.green:cl.red,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",display:"block"},(a.m.annualizedROI>=0?"+":"")+a.m.annualizedROI.toFixed(1)+"% p.a."));
      annBox.appendChild(annLeft);
      var annRight=div({textAlign:"right"});
      var unrealized=a.m.currentValue-a.m.purchasePrice;
      annRight.appendChild(lbl("Unrealized P&L"));
      annRight.appendChild(span({color:unrealized>=0?cl.green:cl.red,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},(unrealized>=0?"+":"")+"AED "+unrealized.toLocaleString()));
      annBox.appendChild(annRight);
      details.appendChild(annBox);

      // Total Return + Signal
      var trBox=div({background:cl.raised,borderRadius:"8px",padding:"10px 12px",marginBottom:"12px",display:"flex",justifyContent:"space-between",alignItems:"center"});
      var trLeft=div({});trLeft.appendChild(lbl("Total Return (Net Yield + Growth)"));
      trLeft.appendChild(span({color:a.m.totalReturn>=8?cl.green:a.m.totalReturn>=5?cl.yellow:cl.red,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",display:"block"},a.m.totalReturn.toFixed(1)+"% p.a."));
      trBox.appendChild(trLeft);
      var trRight=div({textAlign:"right"});trRight.appendChild(lbl("Investment Signal"));
      trRight.appendChild(span({color:sigColor,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block"},a.m.investSignal));
      trBox.appendChild(trRight);
      details.appendChild(trBox);

      details.appendChild(btn({background:cl.redBg,border:"1px solid "+cl.redBo,color:cl.red,padding:"8px 16px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",fontWeight:"600"},"Remove Asset",function(e){e.stopPropagation();ps.assets=ps.assets.filter(function(x){return x.id!==a.id;});localStorage.setItem("dubaival_portfolio",JSON.stringify(ps.assets));if(ps.expandedId===a.id)ps.expandedId=null;ps.aiAnalysis="";render();}));
      card.appendChild(details);
    }
    wrap.appendChild(card);
  });

  // Empty state
  if(ps.assets.length===0&&!ps.showAdd){
    var empty=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"40px 20px",textAlign:"center",marginBottom:"14px"});
    empty.appendChild(span({fontSize:"32px",display:"block",marginBottom:"12px"},"◆"));
    empty.appendChild(span({color:cl.white,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"6px"},"Start Building Your Portfolio"));
    empty.appendChild(span({color:cl.sub,fontSize:"12.5px",lineHeight:"1.7",display:"block",marginBottom:"16px"},"Add your Dubai properties to track performance, monitor valuations, and receive AI-powered investment signals."));
    wrap.appendChild(empty);
  }

  // Add button
  if(!ps.showAdd){
    var addBtn=el("button",{style:{width:"100%",padding:"13px",borderRadius:"10px",border:"1px dashed "+cl.goldDim,background:cl.goldFaint,color:cl.gold,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",marginBottom:"14px",letterSpacing:"0.04em"},onclick:function(){ps.showAdd=true;render();}},"+ ADD PROPERTY");
    wrap.appendChild(addBtn);
  }

  // Add form
  if(ps.showAdd){
    if(!ps._new)ps._new={building:"",area:"",type:"Apartment",beds:"2 BR",floor:"",view:"Not specified",size:"",purchasePrice:"",purchaseDate:"",furnished:"Unfurnished",serviceCharge:"",parking:"1"};
    var n=ps._new;
    var formCard=div({background:cl.surface,border:"1px solid "+cl.goldDim,borderRadius:"14px",padding:"20px",marginBottom:"14px"});
    var formHeader=div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"});
    formHeader.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"◆ Add Property to Portfolio"));
    formHeader.appendChild(el("button",{style:{background:"transparent",border:"none",color:cl.sub,cursor:"pointer",fontSize:"16px",padding:"4px 8px"},onclick:function(){ps.showAdd=false;render();}},"✕"));
    formCard.appendChild(formHeader);

    // Building name
    var bField=div({marginBottom:"12px"});
    bField.appendChild(lbl("Building Name"));
    var bInp=inp(I(),"e.g. BLVD Heights, Opera Grand…","text",n.building,function(v){
      n.building=v;
      if(v.length>2){var b=lookupBuilding(v,n.area);if(b&&b.sc)n.serviceCharge=String(b.sc);if(b&&b.a)n.area=b.a;}
    });
    bField.appendChild(bInp);
    if(n.building.length>2&&lookupBuilding(n.building,n.area)){
      var bInfo=lookupBuilding(n.building,n.area);
      bField.appendChild(div({marginTop:"4px",display:"flex",gap:"6px"},[pill("✓ Verified","green"),pill("SC: "+bInfo.sc,"gold"),pill(bInfo.g,"gold")]));
    }
    formCard.appendChild(bField);

    var isVilla=n.type==="Villa"||n.type==="Townhouse";
    var aptViews=["Burj Khalifa View","Partial Burj View","Full Sea View","Partial Sea View","Full Canal View","Partial Canal View","Pool View","Garden/Park View","City Skyline","Road View","Not specified"];
    var villaViews=["Beach Access View","Full Sea View","Lagoon View","Golf View","Garden/Park View","Pool View","City Skyline","Road View","Not specified"];
    var viewOpts=isVilla?villaViews:aptViews;

    var fg1=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"});
    var areaW=div({});areaW.appendChild(lbl("Area *"));areaW.appendChild(mkSelect(S(),[""].concat(AREA_NAMES),n.area,function(v){n.area=v;}));fg1.appendChild(areaW);
    var typeW=div({});typeW.appendChild(lbl("Type"));typeW.appendChild(mkSelect(S(),["Apartment","Villa","Townhouse","Penthouse"],n.type,function(v){n.type=v;if((v==="Villa"||v==="Townhouse")&&aptViews.indexOf(n.view)>=0&&villaViews.indexOf(n.view)<0)n.view="Not specified";render();}));fg1.appendChild(typeW);
    var bedsW=div({});bedsW.appendChild(lbl("Bedrooms"));bedsW.appendChild(mkSelect(S(),["Studio","1 BR","2 BR","3 BR","4 BR","5 BR","5+ BR"],n.beds,function(v){n.beds=v;}));fg1.appendChild(bedsW);
    var floorW=div({});floorW.appendChild(lbl("Floor"));floorW.appendChild(inp(I(),"Floor #","number",n.floor,function(v){n.floor=v;}));fg1.appendChild(floorW);
    var viewW=div({});viewW.appendChild(lbl("View"));viewW.appendChild(mkSelect(S(),viewOpts,n.view,function(v){n.view=v;}));fg1.appendChild(viewW);
    var furnW=div({});furnW.appendChild(lbl("Furnished"));furnW.appendChild(mkSelect(S(),["Unfurnished","Semi-Furnished","Furnished"],n.furnished,function(v){n.furnished=v;}));fg1.appendChild(furnW);
    formCard.appendChild(fg1);

    var fg2=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"});
    var sizeW=div({});sizeW.appendChild(lbl("Size (sqft) *"));sizeW.appendChild(inp(I(),"1,200","number",n.size,function(v){n.size=v;}));fg2.appendChild(sizeW);
    var scW=div({});scW.appendChild(lbl("Service Charge (AED/sqft)"));scW.appendChild(inp(I(),"Auto for known buildings","number",n.serviceCharge,function(v){n.serviceCharge=v;}));fg2.appendChild(scW);
    formCard.appendChild(fg2);

    var fg3=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"});
    var ppW=div({});ppW.appendChild(lbl("Purchase Price (AED) *"));ppW.appendChild(inp(I(),"2,500,000","number",n.purchasePrice,function(v){n.purchasePrice=v;}));fg3.appendChild(ppW);
    var pdW=div({});pdW.appendChild(lbl("Purchase Date *"));
    var dateInp=el("input",{style:Object.assign({},I(),{colorScheme:"dark"}),type:"date"});dateInp.value=n.purchaseDate||"";dateInp.addEventListener("change",function(){n.purchaseDate=dateInp.value;});
    pdW.appendChild(dateInp);fg3.appendChild(pdW);
    formCard.appendChild(fg3);

    var canAdd=n.area&&n.size&&n.purchasePrice&&n.purchaseDate;
    var btnRow=div({display:"flex",gap:"10px"});
    btnRow.appendChild(btn({flex:"1",padding:"13px",borderRadius:"10px",border:"none",background:canAdd?"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")":cl.border,color:canAdd?"#070B14":cl.sub,fontSize:"13px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",opacity:canAdd?"1":"0.5"},"ADD TO PORTFOLIO",function(){
      if(!canAdd)return;
      var asset=Object.assign({},n,{id:Date.now().toString(36)});
      ps.assets.push(asset);
      localStorage.setItem("dubaival_portfolio",JSON.stringify(ps.assets));
      ps._new={building:"",area:"",type:"Apartment",beds:"2 BR",floor:"",view:"Not specified",size:"",purchasePrice:"",purchaseDate:"",furnished:"Unfurnished",serviceCharge:"",parking:"1"};
      ps.showAdd=false;ps.aiAnalysis="";render();
    }));
    btnRow.appendChild(btn({padding:"13px 20px",borderRadius:"10px",border:"1px solid "+cl.border,background:"transparent",color:cl.sub,fontSize:"13px",fontFamily:"'Space Grotesk',monospace"},"Cancel",function(){ps.showAdd=false;render();}));
    formCard.appendChild(btnRow);
    wrap.appendChild(formCard);
  }

  // AI Analysis
  if(ps.assets.length>0){
    wrap.appendChild(btn({width:"100%",padding:"13px",borderRadius:"10px",border:"none",background:ps.aiLoading?cl.border:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:ps.aiLoading?cl.sub:"#070B14",fontSize:"13px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",marginBottom:"10px",opacity:ps.aiLoading?"0.5":"1"},ps.aiLoading?"ANALYZING PORTFOLIO…":"AI PORTFOLIO ANALYSIS ◆",function(){
      if(ps.aiLoading)return;
      ps.aiLoading=true;ps.aiAnalysis="";ps.aiErr="";render();
      var areaDist2={};metrics.forEach(function(a){areaDist2[a.area]=(areaDist2[a.area]||0)+a.m.currentValue;});
      var areaEntries2=Object.entries(areaDist2).sort(function(a,b){return b[1]-a[1];});
      var summary=metrics.map(function(a){return"- "+(a.building||"Unknown")+" in "+a.area+": "+a.beds+", "+parseInt(a.size).toLocaleString()+" sqft, bought AED "+a.m.purchasePrice.toLocaleString()+" ("+a.purchaseDate+"), now AED "+a.m.currentValue.toLocaleString()+" (ROI "+a.m.roi.toFixed(1)+"%), gross yield "+a.m.grossYield.toFixed(1)+"%, net "+a.m.netYield.toFixed(1)+"%, grade: "+a.m.grade+", signal: "+a.m.investSignal+", total return: "+a.m.totalReturn.toFixed(1)+"%";}).join("\n");
      var prompt="My Dubai real estate portfolio (June 2026):\n"+summary+"\n\nTotal value: AED "+totalValue.toLocaleString()+" | Total ROI: "+totalROI.toFixed(1)+"%\nAvg gross yield: "+avgGrossYield.toFixed(1)+"% | Avg net yield: "+avgNetYield.toFixed(1)+"%\nAreas: "+areaEntries2.map(function(e){return e[0]+" ("+(e[1]/totalValue*100).toFixed(0)+"%)"}).join(", ")+"\n\nInvestment goals: Risk: "+ps.goals.risk+" | Horizon: "+ps.goals.horizon+" | Target: "+ps.goals.target+"\nMarket: Post-geo correction, supply pressure H2 2026, buyer leverage window.\n\nFor EACH property give a signal: HOLD / SELL / BUY MORE with 1 sentence why.\nThen give 2-3 portfolio-level strategic recommendations.\nBe specific with AED numbers. Consider area growth forecasts and diversification.";
      askAI([{role:"user",content:prompt}],"You are DubAIVal Portfolio Advisor. June 2026 Dubai expert. Analyze portfolios for UHNW investors. Specific AED numbers, decisive signals. Professional tone.").then(function(text){ps.aiAnalysis=text;ps.aiLoading=false;render();}).catch(function(e){ps.aiErr=e.message;ps.aiLoading=false;render();});
    }));
    if(ps.aiErr)wrap.appendChild(span({color:cl.red,fontSize:"11px",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"10px"},ps.aiErr));
  }
  if(ps.aiLoading){
    var spinWrap=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"24px",textAlign:"center",marginBottom:"14px"});
    spinWrap.appendChild(div({width:"36px",height:"36px",borderRadius:"50%",border:"2px solid "+cl.border,borderTopColor:cl.gold,animation:"spin 0.8s linear infinite",margin:"0 auto 14px"}));
    spinWrap.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},"AI analyzing your portfolio…"));
    wrap.appendChild(spinWrap);
  }
  if(ps.aiAnalysis&&!ps.aiLoading){
    var aiCard=div({background:cl.surface,border:"1px solid "+cl.goldDim,borderRadius:"14px",padding:"20px",marginBottom:"14px"});
    aiCard.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"◆ AI Portfolio Intelligence"));
    var aiFormatted=formatAIResponse(ps.aiAnalysis,cl);
    if(aiFormatted)aiCard.appendChild(aiFormatted);
    else{var aiText=div({color:cl.subHi,fontSize:"13.5px",lineHeight:"1.9",fontFamily:"'Inter',sans-serif",whiteSpace:"pre-wrap"});aiText.textContent=ps.aiAnalysis;aiCard.appendChild(aiText);}
    wrap.appendChild(aiCard);
  }

  // Disclaimer
  var disc=div({background:cl.goldFaint,border:"1px solid "+cl.goldDim,borderRadius:"8px",padding:"10px 14px",fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",color:cl.subHi});
  disc.innerHTML="<strong style='color:"+cl.gold+"'>Note:</strong> Valuations use DubAIVal's Cascade AVM with hedonic pricing (5,612 buildings · 152 areas). Portfolio data is stored locally on your device. Not financial advice — consult a licensed advisor for investment decisions.";
  wrap.appendChild(disc);
  return wrap;
}

