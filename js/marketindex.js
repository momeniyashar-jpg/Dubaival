// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- MARKET INDEX TAB ---------------------------------------------------------
function renderMarketIndex(){
  var cl=C();
  var wrap=el("div",{style:{padding:"16px",maxWidth:"820px",margin:"0 auto",fontFamily:"'Space Grotesk',monospace"}});
  var now=new Date();
  var dateStr=now.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});

  // Header
  var header=div({textAlign:"center",marginBottom:"24px"});
  header.appendChild(el("div",{style:{color:cl.gold,fontSize:"10px",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:"6px"}},"◆ Market Intelligence"));
  header.appendChild(el("h1",{style:{color:cl.text,fontSize:"18px",fontWeight:"800",margin:"0 0 4px"}},t("idx_title")));
  header.appendChild(el("div",{style:{color:cl.sub,fontSize:"11px"}},"by DubAIVal · "+dateStr));
  wrap.appendChild(header);

  // Full Market Data CSV Export
  wrap.appendChild(el("div",{style:{textAlign:"center",marginBottom:"16px",display:"none"}},[csvExportBtn("Download Full Market Data (CSV)",cl,function(){
    var hdrs=["area_name","avg_psf","service_charge","1br_rent","2br_rent","3br_rent","yield_low","yield_high","growth_1y","growth_3y","growth_5y","dom","tx_volume"];
    var rows=[];AREA_NAMES.forEach(function(n){var a=AREAS[n];if(!a)return;var y=a.y||[0,0];var g=a.g||[0,0,0];
      rows.push([n,a.psf||0,a.sc||0,a.r1||0,a.r2||0,a.r3||0,y[0],y[1],g[0],g[1],g[2],a.dom||0,a.txVol||0]);});
    exportCSV("DubAIVal_Market_Data_"+csvDate()+".csv",hdrs,rows);
  })]));

  // Compute aggregates
  var names=AREA_NAMES;
  var totalPsf=0,totalYield=0,totalG0=0,cnt=0;
  names.forEach(function(n){
    var a=AREAS[n];if(!a)return;
    totalPsf+=a.psf||0;
    var y=a.y||[5,7];totalYield+=(y[0]+y[1])/2;
    var g=a.g||[3,9,16];totalG0+=g[0]||0;
    cnt++;
  });
  var avgPsf=cnt?Math.round(totalPsf/cnt):0;
  var avgYield=cnt?(totalYield/cnt).toFixed(1):0;
  var avgG0=cnt?(totalG0/cnt).toFixed(1):0;

  // Overall Summary
  var stats=[
    {n:"AED "+avgPsf.toLocaleString(),l:"Avg PSF",icon:"◆"},
    {n:avgYield+"%",l:"Avg Yield",icon:"◈"},
    {n:"+"+avgG0+"%",l:"Avg 1yr Growth",icon:"▲"},
    {n:String(cnt),l:"Areas",icon:"◇"},
    {n:"10,800+",l:"Properties",icon:"◆"}
  ];
  var sumRow=div({display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:"10px",marginBottom:"20px"});
  stats.forEach(function(s){
    var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"14px 12px",textAlign:"center"});
    card.appendChild(el("div",{style:{color:cl.gold,fontSize:"9px",marginBottom:"4px"}},s.icon));
    card.appendChild(el("div",{style:{color:cl.gold,fontSize:"18px",fontWeight:"800",marginBottom:"2px"}},s.n));
    card.appendChild(el("div",{style:{color:cl.sub,fontSize:"10px",letterSpacing:"0.06em",textTransform:"uppercase"}},s.l));
    sumRow.appendChild(card);
  });
  wrap.appendChild(sumRow);

  // Build sorted arrays
  var areaData=[];
  names.forEach(function(n){
    var a=AREAS[n];if(!a||!a.psf)return;
    var y=a.y||[5,7];var g=a.g||[3,9,16];
    var avgY=(y[0]+y[1])/2;
    var valueScore=avgY*2+(g[0]||0)*0.5-((a.psf||1500)/500);
    areaData.push({name:n,psf:a.psf,yield:avgY,g0:g[0]||0,g1:g[1]||0,dom:a.dom||60,sc:a.sc||15,r1:a.r1||0,r2:a.r2||0,txVol:a.txVol||0,valueScore:valueScore});
  });

  function mkTable(title,subtitle,data,columns){
    var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"16px"});
    card.appendChild(el("div",{style:{color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:"4px"}},title));
    card.appendChild(el("div",{style:{color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginBottom:"14px"}},subtitle));
    // Header row
    var hRow=div({display:"grid",gridTemplateColumns:columns.map(function(c){return c.w||"1fr";}).join(" "),gap:"6px",padding:"6px 10px",borderBottom:"1px solid "+cl.border,marginBottom:"4px"});
    columns.forEach(function(c){
      hRow.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.08em",textTransform:"uppercase",textAlign:c.align||"left"},c.label));
    });
    card.appendChild(hRow);
    // Data rows
    data.forEach(function(d,i){
      var row=div({display:"grid",gridTemplateColumns:columns.map(function(c){return c.w||"1fr";}).join(" "),gap:"6px",padding:"8px 10px",background:i%2===0?"transparent":cl.raised,borderRadius:"6px",cursor:"pointer",transition:"all 0.15s ease"});
      row.addEventListener("mouseenter",function(){this.style.background="rgba(212,175,55,0.06)";this.style.transform="translateX(4px)";});
      row.addEventListener("mouseleave",function(){this.style.background=i%2===0?"transparent":cl.raised;this.style.transform="";});
      row.addEventListener("click",function(){analyzerState.f.area=d.name;setSection("Market","Analyzer");});
      columns.forEach(function(c){
        var val=c.render(d,i);
        var s=span({color:c.color?c.color(d):cl.text,fontSize:"11.5px",fontFamily:c.mono?"'Space Grotesk',monospace":"'Inter',sans-serif",fontWeight:c.bold?"700":"400",textAlign:c.align||"left"});
        if(typeof val==="string")s.textContent=val;else s.appendChild(val);
        row.appendChild(s);
      });
      card.appendChild(row);
    });
    // Link
    var link=div({textAlign:"center",marginTop:"12px"});
    var lBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.goldDim,color:cl.gold,padding:"6px 16px",borderRadius:"8px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    lBtn.textContent="Get detailed valuation →";
    lBtn.addEventListener("click",function(){setSection("Market","Analyzer");});
    link.appendChild(lBtn);
    card.appendChild(link);
    return card;
  }

  var rankCol={label:"#",w:"30px",mono:true,bold:true,color:function(){return cl.sub;},render:function(d,i){return String(i+1);}};
  var nameCol={label:"Area",w:"2fr",bold:true,color:function(){return cl.gold;},render:function(d){return d.name;}};

  // Top 10 Expensive
  var byPsf=areaData.slice().sort(function(a,b){return b.psf-a.psf;}).slice(0,10);
  wrap.appendChild(mkTable("◆ Most Expensive Areas","Highest price per square foot",[].concat(byPsf),[
    rankCol,nameCol,
    {label:"PSF",w:"1fr",mono:true,bold:true,align:"right",color:function(){return"#F04060";},render:function(d){return"AED "+d.psf.toLocaleString();}},
    {label:"Yield",w:"0.8fr",mono:true,align:"right",color:function(){return cl.sub;},render:function(d){return d.yield.toFixed(1)+"%";}}
  ]));

  // Top 10 Yield
  var byYield=areaData.slice().sort(function(a,b){return b.yield-a.yield;}).slice(0,10);
  wrap.appendChild(mkTable("◆ Highest Yield Areas","Best rental returns",[].concat(byYield),[
    rankCol,nameCol,
    {label:"Yield",w:"1fr",mono:true,bold:true,align:"right",color:function(){return"#10B981";},render:function(d){return d.yield.toFixed(1)+"%";}},
    {label:"PSF",w:"0.8fr",mono:true,align:"right",color:function(){return cl.sub;},render:function(d){return"AED "+d.psf.toLocaleString();}}
  ]));

  // Top 10 Growth
  var byGrowth=areaData.slice().sort(function(a,b){return b.g0-a.g0;}).slice(0,10);
  wrap.appendChild(mkTable("◆ Fastest Growing Areas","Highest 1-year capital growth",[].concat(byGrowth),[
    rankCol,nameCol,
    {label:"1yr Growth",w:"1fr",mono:true,bold:true,align:"right",color:function(){return"#10B981";},render:function(d){return"+"+d.g0.toFixed(1)+"%";}},
    {label:"3yr",w:"0.6fr",mono:true,align:"right",color:function(){return cl.sub;},render:function(d){return"+"+d.g1+"%";}}
  ]));

  // Top 10 Best Value
  var byValue=areaData.slice().sort(function(a,b){return b.valueScore-a.valueScore;}).slice(0,10);
  wrap.appendChild(mkTable("◆ Best Value Areas","High yield + growth, lower entry price",[].concat(byValue),[
    rankCol,nameCol,
    {label:"Yield",w:"0.7fr",mono:true,align:"right",color:function(){return"#10B981";},render:function(d){return d.yield.toFixed(1)+"%";}},
    {label:"Growth",w:"0.7fr",mono:true,align:"right",color:function(){return"#10B981";},render:function(d){return"+"+d.g0.toFixed(0)+"%";}},
    {label:"PSF",w:"0.8fr",mono:true,bold:true,align:"right",color:function(){return cl.gold;},render:function(d){return"AED "+d.psf.toLocaleString();}}
  ]));

  // Top 10 Highest Rent (1BR)
  var byRent=areaData.filter(function(a){return a.r1>0;}).sort(function(a,b){return b.r1-a.r1;}).slice(0,10);
  wrap.appendChild(mkTable("◆ Highest Rent Areas","Top areas by 1BR annual rent",[].concat(byRent),[
    rankCol,nameCol,
    {label:"1BR Rent",w:"1.2fr",mono:true,bold:true,align:"right",color:function(){return"#8B5CF6";},render:function(d){return"AED "+d.r1.toLocaleString()+"/yr";}},
    {label:"Monthly",w:"0.8fr",mono:true,align:"right",color:function(){return cl.sub;},render:function(d){return"AED "+Math.round(d.r1/12).toLocaleString();}}
  ]));

  // Top 10 Best Rental Value (highest rent-to-price ratio)
  var byRentValue=areaData.filter(function(a){return a.r1>0&&a.psf>0;}).map(function(a){a.rentPsfRatio=a.r1/(a.psf*500)*100;return a;}).sort(function(a,b){return b.rentPsfRatio-a.rentPsfRatio;}).slice(0,10);
  wrap.appendChild(mkTable("◆ Best Rental Value Areas","Highest rent relative to property price",[].concat(byRentValue),[
    rankCol,nameCol,
    {label:"Yield",w:"0.7fr",mono:true,bold:true,align:"right",color:function(){return"#10B981";},render:function(d){return d.yield.toFixed(1)+"%";}},
    {label:"1BR Rent",w:"0.9fr",mono:true,align:"right",color:function(){return"#8B5CF6";},render:function(d){return"AED "+d.r1.toLocaleString();}},
    {label:"PSF",w:"0.8fr",mono:true,align:"right",color:function(){return cl.sub;},render:function(d){return"AED "+d.psf.toLocaleString();}}
  ]));

  // Top Commercial Areas
  if(typeof AREAS_COM!=="undefined"){
    var comData=Object.entries(AREAS_COM).map(function(e){return{name:e[0],psf:e[1].psf,avgP:e[1].avgP,n:e[1].n};}).sort(function(a,b){return b.n-a.n;}).slice(0,10);
    wrap.appendChild(mkTable("◆ Top Commercial Areas","By DLD transaction volume",[].concat(comData),[
      {label:"#",w:"0.3fr",mono:true,align:"center",render:function(d,i){return String(i+1);}},
      {label:"Area",w:"1.5fr",bold:true,render:function(d){return d.name;}},
      {label:"PSF",w:"0.8fr",mono:true,align:"right",color:function(){return"#3B82F6";},render:function(d){return"AED "+d.psf.toLocaleString();}},
      {label:"Avg Price",w:"1fr",mono:true,align:"right",color:function(){return cl.sub;},render:function(d){return"AED "+(d.avgP/1000).toFixed(0)+"K";}},
      {label:"Txns",w:"0.6fr",mono:true,align:"right",color:function(){return"#3B82F6";},render:function(d){return d.n.toLocaleString();}}
    ]));
  }

  // Top Land Areas
  if(typeof AREAS_LAND!=="undefined"){
    var landData=Object.entries(AREAS_LAND).map(function(e){return{name:e[0],psf:e[1].psf,avgP:e[1].avgP,avgSz:e[1].avgSz,n:e[1].n};}).sort(function(a,b){return b.n-a.n;}).slice(0,10);
    wrap.appendChild(mkTable("◆ Top Land Areas","By DLD transaction volume",[].concat(landData),[
      {label:"#",w:"0.3fr",mono:true,align:"center",render:function(d,i){return String(i+1);}},
      {label:"Area",w:"1.5fr",bold:true,render:function(d){return d.name;}},
      {label:"PSF",w:"0.8fr",mono:true,align:"right",color:function(){return"#10B981";},render:function(d){return"AED "+d.psf.toLocaleString();}},
      {label:"Avg Size",w:"0.8fr",mono:true,align:"right",color:function(){return cl.sub;},render:function(d){return d.avgSz.toLocaleString()+" sqft";}},
      {label:"Txns",w:"0.6fr",mono:true,align:"right",color:function(){return"#10B981";},render:function(d){return d.n.toLocaleString();}}
    ]));
  }

  // --- Advanced Area Comparison ---
  if(!window._idxCmp)window._idxCmp={areas:["","",""],aiVerdict:"",aiLoading:false};
  // URL param auto-load
  (function(){
    if(!window._idxCmpInit){
      window._idxCmpInit=true;
      try{
        var sp=new URLSearchParams(window.location.search);
        var cmp=sp.get("compare");
        if(cmp){var parts=cmp.split(",").map(function(s){return s.trim();});for(var i=0;i<3&&i<parts.length;i++)window._idxCmp.areas[i]=parts[i];}
      }catch(e){}
    }
  })();
  var cmp=window._idxCmp;
  var cmpCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"16px"});
  cmpCard.appendChild(el("div",{style:{color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:"4px"}},"◆ Advanced Area Comparison"));
  cmpCard.appendChild(el("div",{style:{color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginBottom:"14px"}},"Compare 2-3 areas side by side with AI-powered analysis"));

  var selRow=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"});
  ["Area A","Area B","Area C (optional)"].forEach(function(ph,idx){
    var sel=el("select",{style:{width:"100%",background:cl.raised,border:"1px solid "+(cmp.areas[idx]?cl.green:cl.border),color:cmp.areas[idx]?"#F0F2F5":"#6B7A9E",padding:"10px 12px",borderRadius:"10px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none"}});
    sel.appendChild(el("option",{value:""},ph));
    names.forEach(function(n){var o=el("option",{value:n});o.textContent=n;if(cmp.areas[idx]===n)o.selected=true;sel.appendChild(o);});
    sel.addEventListener("change",(function(i){return function(){cmp.areas[i]=this.value;cmp.aiVerdict="";render();};})(idx));
    selRow.appendChild(sel);
  });
  cmpCard.appendChild(selRow);

  var activeAreas=cmp.areas.filter(function(a){return a&&AREAS[a];});
  if(activeAreas.length>=2){
    var datas=activeAreas.map(function(n){return{name:n,d:AREAS[n]||{}};});
    // Count buildings per area
    var bldgCounts={};activeAreas.forEach(function(a){bldgCounts[a]=0;});
    Object.values(DB).forEach(function(b){if(b.a&&bldgCounts[b.a]!==undefined)bldgCounts[b.a]++;});

    var colTemplate=activeAreas.length===3?"1.4fr 1fr 1fr 1fr":"1.4fr 1fr 1fr";

    // Header
    var hdr=div({display:"grid",gridTemplateColumns:colTemplate,gap:"6px",padding:"8px 10px",borderBottom:"2px solid "+cl.gold,marginBottom:"2px"});
    hdr.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"METRIC"));
    activeAreas.forEach(function(a){hdr.appendChild(span({color:cl.gold,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",textAlign:"center"},a));});
    cmpCard.appendChild(hdr);

    // Build rows
    function bestIdx(vals,higherBetter){
      var best=higherBetter?-Infinity:Infinity;var bi=0;
      vals.forEach(function(v,i){if(higherBetter?v>best:v<best){best=v;bi=i;}});
      return bi;
    }
    function worstIdx(vals,higherBetter){return bestIdx(vals,!higherBetter);}

    var metrics=[
      {l:"Average PSF",fn:function(d){return d.psf||0;},fmt:function(v){return"AED "+v.toLocaleString();},hi:false},
      {l:"Service Charge",fn:function(d){return d.sc||0;},fmt:function(v){return"AED "+v+"/sqft";},hi:false},
      {l:"Studio Rent",fn:function(d){return Math.round((d.r1||0)*0.65);},fmt:function(v){return v?"AED "+v.toLocaleString():"—";},hi:true},
      {l:"1BR Rent",fn:function(d){return d.r1||0;},fmt:function(v){return v?"AED "+v.toLocaleString():"—";},hi:true},
      {l:"2BR Rent",fn:function(d){return d.r2||0;},fmt:function(v){return v?"AED "+v.toLocaleString():"—";},hi:true},
      {l:"3BR Rent",fn:function(d){return d.r3||0;},fmt:function(v){return v?"AED "+v.toLocaleString():"—";},hi:true},
      {l:"Gross Yield",fn:function(d){var y=d.y||[5,7];return(y[0]+y[1])/2;},fmt:function(v){return v.toFixed(1)+"%";},hi:true},
      {l:"Growth 1yr",fn:function(d){return(d.g||[3,9,16])[0]||0;},fmt:function(v){return(v>=0?"+":"")+v+"%";},hi:true},
      {l:"Growth 3yr",fn:function(d){return(d.g||[3,9,16])[1]||0;},fmt:function(v){return(v>=0?"+":"")+v+"%";},hi:true},
      {l:"Growth 5yr",fn:function(d){return(d.g||[3,9,16])[2]||0;},fmt:function(v){return(v>=0?"+":"")+v+"%";},hi:true},
      {l:"Days on Market",fn:function(d){return d.dom||0;},fmt:function(v){return v?v+"d":"—";},hi:false},
      {l:"Tx Volume",fn:function(d){return d.txVol||0;},fmt:function(v){return v?v.toLocaleString()+"/yr":"—";},hi:true},
      {l:"Sustainability",fn:function(d,n){return GREEN_AREAS[n]||50;},fmt:function(v){return v+"/100";},hi:true},
      {l:"Buildings in DB",fn:function(d,n){return bldgCounts[n]||0;},fmt:function(v){return v.toLocaleString();},hi:true}
    ];

    metrics.forEach(function(m,ri){
      var vals=datas.map(function(dd){return m.fn(dd.d,dd.name);});
      var bi=bestIdx(vals,m.hi);
      var wi=worstIdx(vals,m.hi);
      if(vals[bi]===vals[wi])wi=-1;
      var rw=div({display:"grid",gridTemplateColumns:colTemplate,gap:"6px",padding:"7px 10px",background:ri%2===0?"transparent":cl.raised,borderRadius:"4px"});
      rw.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},m.l));
      vals.forEach(function(v,i){
        var color=i===bi?"#10B981":i===wi?"#EF4444":cl.text;
        var fw=i===bi?"700":"400";
        rw.appendChild(span({color:color,fontSize:"11px",fontWeight:fw,fontFamily:"'Space Grotesk',monospace",textAlign:"center"},m.fmt(v)+(i===bi?" ✓":"")));
      });
      cmpCard.appendChild(rw);
    });

    // --- Bar Charts ---
    var chartCard=div({marginTop:"16px",paddingTop:"14px",borderTop:"1px solid "+cl.border});
    chartCard.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"VISUAL COMPARISON"));
    var barColors=["#C9A84C","#3B82F6","#A78BFA"];

    // PSF chart
    chartCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"Price Per Sqft (AED)"));
    var psfMax=Math.max.apply(null,datas.map(function(dd){return dd.d.psf||0;}))||1;
    datas.forEach(function(dd,i){
      var psfVal=dd.d.psf||0;
      var barRow=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"});
      barRow.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",width:"80px",textAlign:"right",flexShrink:"0"},dd.name.length>12?dd.name.substring(0,12)+"…":dd.name));
      var barBg=div({flex:"1",height:"20px",borderRadius:"4px",background:cl.raised,overflow:"hidden",position:"relative"});
      barBg.appendChild(div({height:"100%",width:Math.round(psfVal/psfMax*100)+"%",background:barColors[i],borderRadius:"4px",transition:"width 1s ease"}));
      barBg.appendChild(span({position:"absolute",right:"8px",top:"3px",color:"#fff",fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+psfVal.toLocaleString()));
      barRow.appendChild(barBg);
      chartCard.appendChild(barRow);
    });

    // Yield chart
    chartCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginTop:"14px",marginBottom:"6px"},"Gross Yield (%)"));
    var yMax=Math.max.apply(null,datas.map(function(dd){var y=dd.d.y||[5,7];return(y[0]+y[1])/2;}))||1;
    datas.forEach(function(dd,i){
      var yy=dd.d.y||[5,7];var yVal=(yy[0]+yy[1])/2;
      var barRow=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"});
      barRow.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",width:"80px",textAlign:"right",flexShrink:"0"},dd.name.length>12?dd.name.substring(0,12)+"…":dd.name));
      var barBg=div({flex:"1",height:"20px",borderRadius:"4px",background:cl.raised,overflow:"hidden",position:"relative"});
      barBg.appendChild(div({height:"100%",width:Math.round(yVal/yMax*100)+"%",background:barColors[i],borderRadius:"4px",transition:"width 1s ease"}));
      barBg.appendChild(span({position:"absolute",right:"8px",top:"3px",color:"#fff",fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},yVal.toFixed(1)+"%"));
      barRow.appendChild(barBg);
      chartCard.appendChild(barRow);
    });
    cmpCard.appendChild(chartCard);

    // --- AI Verdict ---
    var aiSection=div({marginTop:"16px",paddingTop:"14px",borderTop:"1px solid "+cl.border});
    if(cmp.aiVerdict){
      aiSection.appendChild(div({color:cl.gold,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"◆ AI ANALYSIS"));
      aiSection.appendChild(div({background:cl.raised,borderRadius:"10px",padding:"14px",color:cl.subHi,fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.7",whiteSpace:"pre-wrap"},cmp.aiVerdict));
    }else{
      var aiBtn=el("button",{style:{width:"100%",padding:"12px",background:cmp.aiLoading?"#4B5563":"linear-gradient(135deg,#C9A84C,#7A5E28)",color:cmp.aiLoading?"#9CA3AF":"#08090C",border:"none",borderRadius:"10px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:cmp.aiLoading?"not-allowed":"pointer"}});
      aiBtn.textContent=cmp.aiLoading?"Analyzing…":"Get AI Verdict";
      if(!cmp.aiLoading)aiBtn.addEventListener("click",function(){
        cmp.aiLoading=true;render();
        var summary=activeAreas.map(function(n){var d=AREAS[n]||{};var y=d.y||[5,7];var g=d.g||[3,9,16];return n+": PSF "+d.psf+", SC "+d.sc+", yield "+(y[0]+y[1])/2+"%, 1yr growth "+g[0]+"%, 3yr "+g[1]+"%, DOM "+(d.dom||"?")+"d, txVol "+(d.txVol||"?")+" , buildings "+bldgCounts[n]+", sustainability "+(GREEN_AREAS[n]||50);}).join(". ");
        askAI([{role:"user",content:"Compare these Dubai areas for a real estate buyer:\n"+summary+"\n\nProvide: 1) For Investment: which is best and why (yield, growth, liquidity), 2) For Living: which is best and why (community, SC, grade), 3) Value Pick: which offers best value. Be specific with numbers. 3-4 sentences each."}],
          "You are DubAIVal AI — Dubai's leading property intelligence platform with 8,522 buildings and 347 areas in our DLD-verified database. June 2026 market expert.\nYou are a RICS-certified property analyst comparing areas for sophisticated investors.\nFor each comparison dimension: cite the EXACT numbers provided, calculate differences, and give a clear winner.\nConsider hidden factors: SC drag on net yield, DOM as exit risk, transaction volume as liquidity proxy, sustainability as future premium.\nBe decisive — rank areas and declare winners. Use specific AED figures and percentages.",
          "Dubai real estate market comparison: "+activeAreas.join(", ")
        ).then(function(r){cmp.aiVerdict=r;cmp.aiLoading=false;render();}).catch(function(e){cmp.aiLoading=false;cmp.aiVerdict="Error: "+e.message;render();});
      });
      aiSection.appendChild(aiBtn);
    }
    cmpCard.appendChild(aiSection);

    // --- Share button ---
    var shareRow=div({marginTop:"14px",display:"flex",gap:"8px"});
    var shareBtn=el("button",{style:{flex:"1",padding:"10px",background:hexAlpha("#3B82F6",0.12),border:"1px solid "+hexAlpha("#3B82F6",0.3),borderRadius:"8px",color:"#60A5FA",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    shareBtn.textContent="Share Comparison";
    shareBtn.addEventListener("click",function(){
      var url=window.location.origin+window.location.pathname+"?compare="+encodeURIComponent(activeAreas.join(","));
      if(navigator.clipboard){navigator.clipboard.writeText(url).then(function(){shareBtn.textContent="✓ Link Copied!";setTimeout(function(){shareBtn.textContent="Share Comparison";},2000);});}
      else{prompt("Copy this link:",url);}
    });
    shareRow.appendChild(shareBtn);
    (function(aa,ds,ms){
      var expBtn=csvExportBtn("Export Comparison (CSV)",cl,function(){
        var hdrs=["metric"].concat(aa);
        var rows=ms.map(function(m){var r=[m.l];ds.forEach(function(dd){r.push(m.fn(dd.d,dd.name));});return r;});
        exportCSV("DubAIVal_Comparison_"+csvDate()+".csv",hdrs,rows);
      });
      expBtn.style.flex="1";shareRow.appendChild(expBtn);
    })(activeAreas,datas,metrics);
    if(cmp.aiVerdict){
      var resetAi=el("button",{style:{padding:"10px 16px",background:"transparent",border:"1px solid "+cl.border,borderRadius:"8px",color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
      resetAi.textContent="↻ Re-analyze";
      resetAi.addEventListener("click",function(){cmp.aiVerdict="";render();});
      shareRow.appendChild(resetAi);
    }
    cmpCard.appendChild(shareRow);
    // Social share
    var cmpUrl=window.location.origin+window.location.pathname+"?compare="+encodeURIComponent(activeAreas.join(","));
    var cmpText="Comparing "+activeAreas.join(" vs ")+" on DubAIVal — "+activeAreas.length+" areas, 14 metrics, AI verdict. Check it out:";
    cmpCard.appendChild(buildShareButtons(cl,{wa:cmpText+" "+cmpUrl,tw:cmpText+" "+cmpUrl,tg:cmpText,url:cmpUrl,copy:cmpUrl}));
  }else if(activeAreas.length===1){
    cmpCard.appendChild(div({textAlign:"center",padding:"20px",color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"Select at least 2 areas to compare"));
  }
  wrap.appendChild(cmpCard);

  // --- Your Favorite Areas ---
  if(DV_SAVED.favAreas.length>0){
    var favCard=div({background:"linear-gradient(135deg,rgba(201,168,76,0.06),transparent)",border:"1px solid "+cl.goldDim,borderRadius:"14px",padding:"14px 16px",marginBottom:"14px"});
    favCard.appendChild(div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"},[
      span({fontSize:"14px"},"⭐"),
      span({color:cl.gold,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"Your Favorite Areas")]));
    var favGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}});
    DV_SAVED.favAreas.forEach(function(aName){
      var a=AREAS[aName];if(!a)return;
      var y=a.y||[5,7];var g=a.g||[3,9,16];
      var fc=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",padding:"10px",cursor:"pointer"}});
      fc.addEventListener("click",function(){analyzerState.f.area=aName;setSection("Market","Analyzer");});
      fc.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"},[
        span({color:cl.subHi,fontSize:"11px",fontWeight:"700",fontFamily:"'Inter',sans-serif"},aName.length>16?aName.substring(0,16)+"…":aName),
        span({color:cl.gold,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+(a.psf||0).toLocaleString())]));
      fc.appendChild(div({display:"flex",gap:"10px"},[
        span({color:cl.green,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},((y[0]+y[1])/2).toFixed(1)+"% yield"),
        span({color:"#3B82F6",fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"+"+(g[0]||0)+"% growth")]));
      favGrid.appendChild(fc);
    });
    favCard.appendChild(favGrid);
    wrap.appendChild(favCard);
  }

  // --- Price Heatmap ---
  var hmCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"16px"});
  hmCard.appendChild(el("div",{style:{color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:"4px"}},"◆ Price Heatmap — All Areas"));
  hmCard.appendChild(el("div",{style:{color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginBottom:"12px"}},"All "+cnt+" areas sorted by PSF — click any area for valuation"));

  // Search filter
  if(!window._idxFilter)window._idxFilter="";
  var filterInp=el("input",{type:"text",placeholder:"Filter areas...",style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"9px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"12px"}});
  filterInp.value=window._idxFilter||"";
  filterInp.addEventListener("input",function(){window._idxFilter=this.value;render();});
  hmCard.appendChild(filterInp);

  // Legend
  var legRow=div({display:"flex",gap:"12px",marginBottom:"10px",justifyContent:"center"});
  [{c:"#F04060",l:"Premium (>3000)"},{c:"#F0A030",l:"Mid (1500-3000)"},{c:"#10B981",l:"Affordable (<1500)"}].forEach(function(lg){
    var lr=div({display:"flex",alignItems:"center",gap:"4px"});
    lr.appendChild(div({width:"10px",height:"10px",borderRadius:"3px",background:lg.c}));
    lr.appendChild(span({color:cl.sub,fontSize:"9px"},lg.l));
    legRow.appendChild(lr);
  });
  hmCard.appendChild(legRow);

  var sorted=areaData.slice().sort(function(a,b){return b.psf-a.psf;});
  var fq=(window._idxFilter||"").toLowerCase();
  if(fq)sorted=sorted.filter(function(d){return d.name.toLowerCase().indexOf(fq)>=0;});
  var psfMax=sorted.length?sorted[0].psf:5000;
  var psfMin=sorted.length?sorted[sorted.length-1].psf:500;

  sorted.forEach(function(d){
    var ratio=psfMax>psfMin?(d.psf-psfMin)/(psfMax-psfMin):0.5;
    var barColor=ratio>0.65?"#F04060":ratio>0.3?"#F0A030":"#10B981";
    var barW=Math.max(8,Math.round(ratio*100));
    var row=div({display:"grid",gridTemplateColumns:"20px 2fr 3fr 0.8fr",gap:"6px",alignItems:"center",padding:"5px 10px",cursor:"pointer",borderRadius:"4px"});
    row.addEventListener("mouseenter",function(){this.style.background=cl.raised;});
    row.addEventListener("mouseleave",function(){this.style.background="transparent";});
    var starBtn=el("span",{style:{fontSize:"12px",cursor:"pointer",color:isFavArea(d.name)?"#EAB308":"rgba(255,255,255,0.15)",transition:"color 0.2s"}});
    starBtn.textContent=isFavArea(d.name)?"★":"☆";
    (function(name){starBtn.addEventListener("click",function(e){e.stopPropagation();toggleFavArea(name);render();});})(d.name);
    row.appendChild(starBtn);
    row.addEventListener("click",function(){analyzerState.f.area=d.name;setSection("Market","Analyzer");});
    row.appendChild(span({color:cl.text,fontSize:"11px",fontFamily:"'Inter',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},d.name));
    var barWrap=div({height:"6px",borderRadius:"3px",background:cl.border,overflow:"hidden"});
    barWrap.appendChild(div({height:"100%",width:barW+"%",borderRadius:"3px",background:barColor,transition:"width 0.3s ease"}));
    row.appendChild(barWrap);
    row.appendChild(span({color:barColor,fontSize:"10.5px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",textAlign:"right"},"AED "+d.psf.toLocaleString()));
    hmCard.appendChild(row);
  });

  hmCard.appendChild(el("div",{style:{textAlign:"center",marginTop:"12px",color:cl.sub,fontSize:"9px"}},"Showing "+sorted.length+" of "+cnt+" areas · Click any area for full valuation"));
  wrap.appendChild(hmCard);

  return wrap;
}
