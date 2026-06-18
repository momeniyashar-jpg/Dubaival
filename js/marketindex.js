// --- MARKET INDEX TAB ---------------------------------------------------------
function renderMarketIndex(){
  var cl=C();
  var wrap=el("div",{style:{padding:"16px",maxWidth:"820px",margin:"0 auto",fontFamily:"'Space Grotesk',monospace"}});
  var now=new Date();
  var dateStr=now.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});

  // Header
  var header=div({textAlign:"center",marginBottom:"24px"});
  header.appendChild(el("div",{style:{color:cl.gold,fontSize:"10px",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:"6px"}},"◆ Market Intelligence"));
  header.appendChild(el("h1",{style:{color:cl.text,fontSize:"18px",fontWeight:"800",margin:"0 0 4px"}},"Dubai Real Estate Market Index"));
  header.appendChild(el("div",{style:{color:cl.sub,fontSize:"11px"}},"by DubAIVal · "+dateStr));
  wrap.appendChild(header);

  // Compute aggregates
  var names=AREA_NAMES;
  var totalPsf=0,totalYield=0,totalG0=0,cnt=0;
  names.forEach(function(n){
    var a=AREAS[n];if(!a)return;
    totalPsf+=a.psf||0;
    var y=a.y||[5,7];totalYield+=(y[0]+y[1])/2;
    var g=a.g||[10,18,28];totalG0+=g[0]||0;
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
    {n:"6,162",l:"Buildings",icon:"◆"}
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
    var y=a.y||[5,7];var g=a.g||[10,18,28];
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
      var row=div({display:"grid",gridTemplateColumns:columns.map(function(c){return c.w||"1fr";}).join(" "),gap:"6px",padding:"8px 10px",background:i%2===0?"transparent":cl.raised,borderRadius:"6px",cursor:"pointer"});
      row.addEventListener("click",function(){analyzerState.f.area=d.name;currentTab="Analyzer";render();});
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
    lBtn.addEventListener("click",function(){currentTab="Analyzer";render();});
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

  // --- Area Comparison ---
  if(!window._idxCmp)window._idxCmp={a1:"",a2:""};
  var cmpCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"16px"});
  cmpCard.appendChild(el("div",{style:{color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:"4px"}},"◆ Area Comparison"));
  cmpCard.appendChild(el("div",{style:{color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginBottom:"14px"}},"Select two areas to compare side by side"));
  var cmpRow=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px"});
  var sel1=el("select",{style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"10px 12px",borderRadius:"10px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none"}});
  var sel2=el("select",{style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"10px 12px",borderRadius:"10px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none"}});
  var defOpt1=el("option",{value:""});defOpt1.textContent="Select Area A";sel1.appendChild(defOpt1);
  var defOpt2=el("option",{value:""});defOpt2.textContent="Select Area B";sel2.appendChild(defOpt2);
  names.forEach(function(n){
    var o1=el("option",{value:n});o1.textContent=n;if(window._idxCmp.a1===n)o1.selected=true;sel1.appendChild(o1);
    var o2=el("option",{value:n});o2.textContent=n;if(window._idxCmp.a2===n)o2.selected=true;sel2.appendChild(o2);
  });
  sel1.addEventListener("change",function(){window._idxCmp.a1=this.value;render();});
  sel2.addEventListener("change",function(){window._idxCmp.a2=this.value;render();});
  cmpRow.appendChild(sel1);cmpRow.appendChild(sel2);
  cmpCard.appendChild(cmpRow);

  if(window._idxCmp.a1&&window._idxCmp.a2){
    var d1=AREAS[window._idxCmp.a1]||{};var d2=AREAS[window._idxCmp.a2]||{};
    var y1=d1.y||[5,7];var y2=d2.y||[5,7];
    var g1=d1.g||[10,18,28];var g2=d2.g||[10,18,28];
    var rows=[
      {l:"PSF",v1:"AED "+(d1.psf||0).toLocaleString(),v2:"AED "+(d2.psf||0).toLocaleString(),better:(d1.psf||9999)<(d2.psf||9999)?1:2},
      {l:"Yield",v1:((y1[0]+y1[1])/2).toFixed(1)+"%",v2:((y2[0]+y2[1])/2).toFixed(1)+"%",better:(y1[0]+y1[1])>(y2[0]+y2[1])?1:2},
      {l:"1yr Growth",v1:"+"+(g1[0]||0)+"%",v2:"+"+(g2[0]||0)+"%",better:(g1[0]||0)>(g2[0]||0)?1:2},
      {l:"3yr Growth",v1:"+"+(g1[1]||0)+"%",v2:"+"+(g2[1]||0)+"%",better:(g1[1]||0)>(g2[1]||0)?1:2},
      {l:"1BR Rent",v1:"AED "+(d1.r1||0).toLocaleString(),v2:"AED "+(d2.r1||0).toLocaleString(),better:(d1.r1||0)>(d2.r1||0)?1:2},
      {l:"2BR Rent",v1:"AED "+(d1.r2||0).toLocaleString(),v2:"AED "+(d2.r2||0).toLocaleString(),better:(d1.r2||0)>(d2.r1||0)?1:2},
      {l:"DOM",v1:(d1.dom||"—")+"d",v2:(d2.dom||"—")+"d",better:(d1.dom||999)<(d2.dom||999)?1:2},
      {l:"Service Charge",v1:"AED "+(d1.sc||0)+"/sqft",v2:"AED "+(d2.sc||0)+"/sqft",better:(d1.sc||999)<(d2.sc||999)?1:2},
      {l:"Transactions",v1:(d1.txVol||"—")+"/yr",v2:(d2.txVol||"—")+"/yr",better:(d1.txVol||0)>(d2.txVol||0)?1:2}
    ];
    // Column headers
    var cmpHdr=div({display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr",gap:"6px",padding:"6px 10px",borderBottom:"1px solid "+cl.border,marginBottom:"4px"});
    cmpHdr.appendChild(span({color:cl.sub,fontSize:"9px"},"Metric"));
    cmpHdr.appendChild(span({color:cl.gold,fontSize:"10px",fontWeight:"700",textAlign:"center"},window._idxCmp.a1));
    cmpHdr.appendChild(span({color:cl.gold,fontSize:"10px",fontWeight:"700",textAlign:"center"},window._idxCmp.a2));
    cmpCard.appendChild(cmpHdr);
    rows.forEach(function(r,i){
      var rw=div({display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr",gap:"6px",padding:"7px 10px",background:i%2===0?"transparent":cl.raised,borderRadius:"4px"});
      rw.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},r.l));
      rw.appendChild(span({color:r.better===1?"#10B981":cl.text,fontSize:"11.5px",fontWeight:r.better===1?"700":"400",fontFamily:"'Space Grotesk',monospace",textAlign:"center"},r.v1+(r.better===1?" ✓":"")));
      rw.appendChild(span({color:r.better===2?"#10B981":cl.text,fontSize:"11.5px",fontWeight:r.better===2?"700":"400",fontFamily:"'Space Grotesk',monospace",textAlign:"center"},r.v2+(r.better===2?" ✓":"")));
      cmpCard.appendChild(rw);
    });
  }
  wrap.appendChild(cmpCard);

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
    var row=div({display:"grid",gridTemplateColumns:"2fr 3fr 0.8fr",gap:"8px",alignItems:"center",padding:"5px 10px",cursor:"pointer",borderRadius:"4px"});
    row.addEventListener("mouseenter",function(){this.style.background=cl.raised;});
    row.addEventListener("mouseleave",function(){this.style.background="transparent";});
    row.addEventListener("click",function(){analyzerState.f.area=d.name;currentTab="Analyzer";render();});
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
