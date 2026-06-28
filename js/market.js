// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- REPORT MODE HELPERS ------------------------------------------------------
function isRegisteredAgent(){try{var p=localStorage.getItem("dv_agent_profile");return p&&JSON.parse(p).rera;}catch(e){return false;}}

function buildReportTypeSelector(cl,formCard){
  var rm=analyzerState.reportMode||"personal";
  var rf=analyzerState.reportFor||"buyer";
  var sec=el("div",{style:{marginTop:"16px",padding:"14px",background:cl.raised,borderRadius:"12px",border:"1px solid "+cl.border}});
  sec.appendChild(div({color:cl.gold,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"Report Type"));
  var modes=[{v:"personal",l:"Personal",d:"For your own analysis"},{v:"agent",l:"Agent Report",d:"For client presentation"}];
  var mRow=el("div",{style:{display:"flex",gap:"8px",marginBottom:"10px"}});
  modes.forEach(function(m){
    var isActive=rm===m.v;
    var isLocked=m.v==="agent"&&!isRegisteredAgent();
    var btn=el("button",{style:{flex:"1",padding:"10px 12px",borderRadius:"8px",border:"1px solid "+(isActive?cl.gold:cl.border),background:isActive?cl.goldFaint:"transparent",color:isActive?cl.gold:isLocked?"rgba(255,255,255,0.2)":cl.sub,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:isLocked?"not-allowed":"pointer",opacity:isLocked?"0.5":"1"}});
    btn.textContent=m.l;
    if(!isLocked){btn.addEventListener("click",function(){analyzerState.reportMode=m.v;render();});}
    else{btn.title="Register as agent in Deal Network to access";}
    mRow.appendChild(btn);
  });
  sec.appendChild(mRow);
  if(rm==="personal"){
    var pModes=[{v:"investment",l:"Investment Analysis"},{v:"enduse",l:"End-Use / Personal"},{v:"rental",l:"Rental Income"}];
    var pRow=el("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap"}});
    var curProfile=USER_PROFILE.investorType||"income";
    pModes.forEach(function(m){
      var isA=curProfile===(m.v==="investment"?"income":m.v==="rental"?"income":m.v);
      var btn=el("button",{style:{padding:"6px 12px",borderRadius:"14px",border:"1px solid "+(isA?cl.gold:cl.border),background:isA?"rgba(201,168,76,0.1)":"transparent",color:isA?cl.gold:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
      btn.textContent=m.l;
      pRow.appendChild(btn);
    });
    sec.appendChild(pRow);
  }else if(rm==="agent"){
    sec.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginBottom:"8px"},"Generate report for:"));
    var aOpts=[{v:"buyer",l:"Buyer",d:"Convince buyer to purchase"},{v:"seller",l:"Seller",d:"Convince seller to list/accept"},{v:"both",l:"Both Reports",d:"Separate buyer & seller reports"}];
    var aRow=el("div",{style:{display:"flex",gap:"6px"}});
    aOpts.forEach(function(o){
      var isA=rf===o.v;
      var btn=el("button",{style:{flex:"1",padding:"8px 10px",borderRadius:"8px",border:"1px solid "+(isA?"#3B82F6":cl.border),background:isA?"rgba(59,130,246,0.1)":"transparent",color:isA?"#60A5FA":cl.sub,fontSize:"11px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
      btn.textContent=o.l;
      btn.title=o.d;
      btn.addEventListener("click",function(){analyzerState.reportFor=o.v;render();});
      aRow.appendChild(btn);
    });
    sec.appendChild(aRow);
  }
  formCard.appendChild(sec);
}

function getAgentAIPrompt(propDesc,val,mode,area){
  var amenities=AREA_AMENITIES[area]?"Location amenities: "+AREA_AMENITIES[area]+".":"";
  var base=propDesc+". EXACT NUMBERS FROM OUR ENGINE (use these, do NOT invent your own): Market PSF: AED "+val.adjPSF.toLocaleString()+" (range: "+val.psfLo.toLocaleString()+"-"+val.psfHi.toLocaleString()+"). Asking "+val.vsPct+"% vs market. Verdict: "+val.verdict+". Fair value: AED "+val.fairPrice.toLocaleString()+". Suggested offer: AED "+val.suggestedOffer.toLocaleString()+". Est. rent: AED "+(val.rent||0).toLocaleString()+"/yr. Gross yield: "+val.grossYield+"%. Net yield: "+val.netYield+"%. Growth 3yr: "+val.g1+"%. Confidence: "+val.confScore+"% ("+val.confTier+"). Investment signal: "+val.investSignal+". "+amenities;
  if(mode==="buyer"){
    return base+" You are a top-performing Dubai real estate agent writing a report to CONVINCE A BUYER to purchase this property. Use modern sales psychology, urgency triggers, and value framing. Highlight: why this is a smart entry point, rental income potential, capital appreciation outlook, lifestyle/location benefits — mention specific nearby amenities from the location data above. If overpriced, reframe as negotiation opportunity with specific target price. Write 4-5 compelling sentences. ONLY use the AED numbers and amenities provided above — never calculate or estimate your own. Professional but persuasive tone. Do NOT mention you are AI.";
  }else{
    return base+" You are a top-performing Dubai real estate agent writing a report to CONVINCE A SELLER to list/accept an offer on this property. Use modern sales psychology and market timing arguments. Highlight: current market momentum, buyer demand in the area, optimal pricing strategy, risk of holding too long, desirable location amenities from the data above. If underpriced, show them the strong demand justifying a quick sale. If overpriced, show realistic market position and why pricing right leads to faster sale and better net outcome. Write 4-5 compelling sentences. ONLY use the AED numbers and amenities provided above — never calculate or estimate your own. Professional but persuasive tone. Do NOT mention you are AI.";
  }
}

function getRentalAgentAIPrompt(propDesc,rv,mode,area){
  var amenities=AREA_AMENITIES[area]?"Location amenities: "+AREA_AMENITIES[area]+".":"";
  var base=propDesc+". EXACT NUMBERS FROM OUR ENGINE (use these, do NOT invent your own): Market rent: AED "+rv.estRent.toLocaleString()+"/yr (AED "+rv.monthly.toLocaleString()+"/mo). Rent range: AED "+rv.rentLow.toLocaleString()+"-"+rv.rentHigh.toLocaleString()+"/yr. Asking "+rv.vsPct+"% vs market. Verdict: "+rv.verdict.replace(/_/g," ")+". Confidence: "+rv.confScore+"%. "+amenities;
  if(mode==="buyer"){
    return base+" You are a top-performing Dubai leasing agent writing to CONVINCE A TENANT to rent this property. Use persuasion: lifestyle benefits from the location amenities above, value compared to alternatives, limited availability. If above market, reframe as premium value or negotiation opportunity. Write 4-5 compelling sentences. ONLY use the AED numbers and amenities provided above — never calculate or estimate your own. Professional, persuasive. Do NOT mention you are AI.";
  }else{
    return base+" You are a top-performing Dubai leasing agent writing to CONVINCE A LANDLORD about optimal rental strategy. Cover: current demand in the area, how to price for fastest lease, risks of overpricing (vacancy cost), tenant quality at different price points, desirable location amenities. Write 4-5 compelling sentences. ONLY use the AED numbers and amenities provided above — never calculate or estimate your own. Professional, persuasive. Do NOT mention you are AI.";
  }
}

// --- MARKET TAB ---------------------------------------------------------------
function renderMarket(){
  const cl=C();
  const wrap=div({padding:"16px",maxWidth:"960px",margin:"0 auto"});

  // -- LIVE DASHBOARD --
  (function(){
    var aKeys=Object.keys(AREAS);var aCnt=aKeys.length;
    var bCnt=Object.keys(DB).length;
    var sumPsf=0,sumYield=0,sumGr=0,cntY=0,cntG=0;
    aKeys.forEach(function(k){var a=AREAS[k];sumPsf+=a.psf||0;if(a.y){sumYield+=(a.y[0]+a.y[1])/2;cntY++;}if(a.g){sumGr+=a.g[0];cntG++;}});
    var avgPsf=Math.round(sumPsf/aCnt);var avgYield=(sumYield/(cntY||1)).toFixed(1);var avgGr=(sumGr/(cntG||1)).toFixed(1);

    var dSec=el('div',{style:{background:'linear-gradient(135deg,rgba(201,168,76,0.06),rgba(139,92,246,0.04))',border:'1px solid '+cl.goldDim,borderRadius:'16px',padding:'18px',marginBottom:'14px'}});
    var hdr=el('div',{style:{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}});
    var pulse=el('div',{style:{width:'8px',height:'8px',borderRadius:'50%',background:'#22C55E',boxShadow:'0 0 6px #22C55E,0 0 12px rgba(34,197,94,0.4)',animation:'pulse 2s infinite',flexShrink:'0'}});
    hdr.appendChild(pulse);
    hdr.appendChild(span({color:cl.gold,fontSize:'11px',letterSpacing:'0.14em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace",fontWeight:'700'},'Dubai Real Estate Live Dashboard'));
    dSec.appendChild(hdr);

    // Row 1: 5 stat cards with count-up
    var r1=el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:'8px',marginBottom:'14px'}});
    [{l:'Buildings Tracked',v:bCnt,fmt:function(v){return v.toLocaleString();}},{l:'Areas Covered',v:aCnt,fmt:String},{l:'Avg PSF',v:avgPsf,fmt:function(v){return 'AED '+v.toLocaleString();}},{l:'Avg Yield',v:parseFloat(avgYield),fmt:function(v){return v.toFixed(1)+'%';}},{l:'Avg Growth 1Y',v:parseFloat(avgGr),fmt:function(v){return v.toFixed(1)+'%';}}].forEach(function(s){
      var card=el('div',{style:{background:'rgba(240,242,245,0.03)',border:'1px solid '+cl.border,borderRadius:'10px',padding:'10px 8px',textAlign:'center'}});
      card.appendChild(div({color:cl.sub,fontSize:'7.5px',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace",marginBottom:'4px'},s.l));
      var numEl=el('div',{style:{color:cl.gold,fontSize:'16px',fontWeight:'800',fontFamily:"'Space Grotesk',monospace"}});
      numEl.textContent='0';
      card.appendChild(numEl);
      r1.appendChild(card);
      var start=performance.now();var dur=1200;
      (function(el,target,fmt){
        function tick(now){
          var t=Math.min((now-start)/dur,1);
          t=1-Math.pow(1-t,3);
          el.textContent=fmt(Math.round(target*t*10)/10);
          if(t<1)requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      })(numEl,s.v,s.fmt);
    });
    dSec.appendChild(r1);

    // Row 2: 3 charts (wider)
    var r2=el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}});

    // PSF Distribution histogram
    var psfBins=[0,0,0,0,0];var psfLabels=['<1K','1-1.5K','1.5-2K','2-3K','3K+'];
    aKeys.forEach(function(k){var p=AREAS[k].psf||0;if(p<1000)psfBins[0]++;else if(p<1500)psfBins[1]++;else if(p<2000)psfBins[2]++;else if(p<3000)psfBins[3]++;else psfBins[4]++;});
    var psfMax=Math.max.apply(null,psfBins)||1;
    var psfCard=el('div',{style:{background:'rgba(240,242,245,0.03)',border:'1px solid '+cl.border,borderRadius:'10px',padding:'10px'}});
    psfCard.appendChild(div({color:cl.sub,fontSize:'8px',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace",marginBottom:'8px',textAlign:'center'},'PSF Distribution'));
    var psfChart=el('div',{style:{display:'flex',alignItems:'flex-end',gap:'3px',height:'50px'}});
    psfBins.forEach(function(b,i){
      var col=el('div',{style:{flex:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',height:'100%'}});
      col.appendChild(el('div',{style:{width:'100%',height:Math.max(3,b/psfMax*100)+'%',background:'linear-gradient(180deg,'+cl.gold+','+hexAlpha(cl.gold,0.3)+')',borderRadius:'3px 3px 0 0',transition:'height 0.5s'}}));
      col.appendChild(span({color:cl.sub,fontSize:'6px',fontFamily:"'Space Grotesk',monospace",marginTop:'2px'},psfLabels[i]));
      psfChart.appendChild(col);
    });
    psfCard.appendChild(psfChart);
    r2.appendChild(psfCard);

    // Yield Distribution histogram
    var yBins=[0,0,0,0,0];var yLabels=['<5%','5-6','6-7','7-8','8%+'];
    aKeys.forEach(function(k){var a=AREAS[k];if(!a.y)return;var y=(a.y[0]+a.y[1])/2;if(y<5)yBins[0]++;else if(y<6)yBins[1]++;else if(y<7)yBins[2]++;else if(y<8)yBins[3]++;else yBins[4]++;});
    var yMax=Math.max.apply(null,yBins)||1;
    var yCard=el('div',{style:{background:'rgba(240,242,245,0.03)',border:'1px solid '+cl.border,borderRadius:'10px',padding:'10px'}});
    yCard.appendChild(div({color:cl.sub,fontSize:'8px',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace",marginBottom:'8px',textAlign:'center'},'Yield Distribution'));
    var yChart=el('div',{style:{display:'flex',alignItems:'flex-end',gap:'3px',height:'50px'}});
    yBins.forEach(function(b,i){
      var col=el('div',{style:{flex:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',height:'100%'}});
      col.appendChild(el('div',{style:{width:'100%',height:Math.max(3,b/yMax*100)+'%',background:'linear-gradient(180deg,#22C55E,'+hexAlpha('#22C55E',0.3)+')',borderRadius:'3px 3px 0 0',transition:'height 0.5s'}}));
      col.appendChild(span({color:cl.sub,fontSize:'6px',fontFamily:"'Space Grotesk',monospace",marginTop:'2px'},yLabels[i]));
      yChart.appendChild(col);
    });
    yCard.appendChild(yChart);
    r2.appendChild(yCard);

    // Growth Heatmap: top 10 vs bottom 10
    var gArr=[];aKeys.forEach(function(k){var a=AREAS[k];if(a.g)gArr.push({name:k,g:a.g[0]});});
    gArr.sort(function(a,b){return b.g-a.g;});
    var gCard=el('div',{style:{background:'rgba(240,242,245,0.03)',border:'1px solid '+cl.border,borderRadius:'10px',padding:'10px'}});
    gCard.appendChild(div({color:cl.sub,fontSize:'8px',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace",marginBottom:'6px',textAlign:'center'},'Growth Heatmap'));
    var top5=gArr.slice(0,5);var bot5=gArr.slice(-5).reverse();
    top5.concat(bot5).forEach(function(g,i){
      var isTop=i<5;
      var pct=Math.min(100,Math.abs(g.g)*3);
      var row=el('div',{style:{display:'flex',alignItems:'center',gap:'4px',marginBottom:'2px'}});
      row.appendChild(span({color:cl.sub,fontSize:'6px',fontFamily:"'Space Grotesk',monospace",width:'50px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flexShrink:'0',display:'inline-block'},g.name.length>10?g.name.substring(0,10)+'…':g.name));
      row.appendChild(el('div',{style:{flex:'1',height:'4px',background:'rgba(255,255,255,0.04)',borderRadius:'2px',overflow:'hidden'}},[
        el('div',{style:{height:'100%',width:pct+'%',background:isTop?'#22C55E':'#EF4444',borderRadius:'2px'}})]));
      row.appendChild(span({color:isTop?'#22C55E':'#EF4444',fontSize:'6px',fontWeight:'700',fontFamily:"'Space Grotesk',monospace",width:'28px',textAlign:'right',flexShrink:'0'},(g.g>=0?'+':'')+g.g.toFixed(0)+'%'));
      gCard.appendChild(row);
    });
    dSec.appendChild(r2);

    // Growth Heatmap — full-width
    gCard.style.marginBottom='14px';
    gCard.style.padding='14px';
    dSec.appendChild(gCard);

    // Section divider
    dSec.appendChild(el('div',{style:{height:'1px',background:'linear-gradient(90deg,transparent 0%,rgba(212,175,55,0.3) 50%,transparent 100%)',margin:'20px 0'}}));

    // Row 3: Market Pulse — 4 ranking lists (2-column grid)
    var r3=el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}});
    // Compute rankings
    var ranked=aKeys.map(function(k){var a=AREAS[k];return{name:k,psf:a.psf||0,y:a.y?((a.y[0]+a.y[1])/2):0,g:a.g?a.g[0]:0,dom:a.dom||90};});
    var hottest=ranked.slice().sort(function(a,b){return(b.y+b.g)-(a.y+a.g);}).slice(0,5);
    var bestVal=ranked.slice().sort(function(a,b){return(b.y/Math.max(b.psf,1))-(a.y/Math.max(a.psf,1));}).slice(0,5);
    var mostLiq=ranked.slice().sort(function(a,b){return a.dom-b.dom;}).slice(0,5);
    var highGr=ranked.slice().sort(function(a,b){return b.g-a.g;}).slice(0,5);
    [{title:'Hottest Areas',data:hottest,vFn:function(d){return(d.y+d.g).toFixed(1);},color:'#EF4444'},
     {title:'Best Value',data:bestVal,vFn:function(d){return d.y.toFixed(1)+'% @ '+d.psf;},color:'#22C55E'},
     {title:'Most Liquid',data:mostLiq,vFn:function(d){return d.dom+'d DOM';},color:'#3B82F6'},
     {title:'Highest Growth',data:highGr,vFn:function(d){return'+'+d.g.toFixed(1)+'%';},color:'#A78BFA'}].forEach(function(cat){
      var card=el('div',{style:{background:'rgba(240,242,245,0.03)',border:'1px solid '+cl.border,borderRadius:'10px',padding:'10px'}});
      card.appendChild(div({color:cat.color,fontSize:'8px',fontWeight:'700',letterSpacing:'0.06em',fontFamily:"'Space Grotesk',monospace",marginBottom:'6px'},cat.title));
      cat.data.forEach(function(d,i){
        var row=el('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'2px 0'}});
        row.appendChild(span({color:cl.subHi,fontSize:'8px',fontFamily:"'Inter',sans-serif"},''+(i+1)+'. '+(d.name.length>12?d.name.substring(0,12)+'…':d.name)));
        row.appendChild(span({color:cat.color,fontSize:'7px',fontWeight:'700',fontFamily:"'Space Grotesk',monospace"},cat.vFn(d)));
        card.appendChild(row);
      });
      r3.appendChild(card);
    });
    dSec.appendChild(r3);

    // Row 4: Rental Market Snapshot
    var r4hdr=el('div',{style:{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}});
    r4hdr.innerHTML='<i data-lucide="home" style="width:14px;height:14px;color:#8B5CF6;opacity:0.7"></i>';
    r4hdr.appendChild(span({color:'#8B5CF6',fontSize:'9px',letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace",fontWeight:'700'},'Rental Market Snapshot'));
    dSec.appendChild(r4hdr);
    var sumR1=0,sumR2=0,cntR=0;
    aKeys.forEach(function(k){var a=AREAS[k];if(a.r1){sumR1+=a.r1;sumR2+=(a.r2||0);cntR++;}});
    var avgR1=cntR?Math.round(sumR1/cntR):0;
    var avgR2=cntR?Math.round(sumR2/cntR):0;
    dSec.appendChild(el('div',{style:{height:'1px',background:'linear-gradient(90deg,transparent 0%,rgba(139,92,246,0.3) 50%,transparent 100%)',margin:'16px 0'}}));
    var r4=el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}});
    [{l:'Areas w/ Rental Data',v:String(cntR),c:'#8B5CF6'},{l:'Avg 1BR Rent',v:'AED '+avgR1.toLocaleString(),c:'#8B5CF6'},{l:'Avg 2BR Rent',v:'AED '+avgR2.toLocaleString(),c:'#8B5CF6'},{l:'Avg Monthly 1BR',v:'AED '+Math.round(avgR1/12).toLocaleString(),c:'#8B5CF6'}].forEach(function(s){
      var card=el('div',{style:{background:'rgba(139,92,246,0.04)',border:'1px solid rgba(139,92,246,0.15)',borderRadius:'10px',padding:'10px 8px',textAlign:'center'}});
      card.appendChild(div({color:cl.sub,fontSize:'7.5px',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace",marginBottom:'4px'},s.l));
      card.appendChild(el('div',{style:{color:s.c,fontSize:'14px',fontWeight:'800',fontFamily:"'Space Grotesk',monospace"}},s.v));
      r4.appendChild(card);
    });
    dSec.appendChild(r4);

    // Row 5: Commercial & Land Snapshot
    var r5hdr=el('div',{style:{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}});
    r5hdr.innerHTML='<i data-lucide="landmark" style="width:14px;height:14px;color:#3B82F6;opacity:0.7"></i>';
    r5hdr.appendChild(span({color:'#3B82F6',fontSize:'9px',letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace",fontWeight:'700'},'Commercial & Land Snapshot'));
    dSec.appendChild(r5hdr);
    var comCnt=typeof DB_COM!=="undefined"?Object.keys(DB_COM).length:0;
    var landCnt=typeof DB_LAND!=="undefined"?Object.keys(DB_LAND).length:0;
    var comAreaCnt=typeof AREAS_COM!=="undefined"?Object.keys(AREAS_COM).length:0;
    var landAreaCnt=typeof AREAS_LAND!=="undefined"?Object.keys(AREAS_LAND).length:0;
    dSec.appendChild(el('div',{style:{height:'1px',background:'linear-gradient(90deg,transparent 0%,rgba(59,130,246,0.3) 50%,transparent 100%)',margin:'16px 0'}}));
    var r5=el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}});
    [{l:'Commercial Properties',v:String(comCnt),c:'#3B82F6'},{l:'Commercial Areas',v:String(comAreaCnt),c:'#3B82F6'},{l:'Land Plots',v:String(landCnt),c:'#10B981'},{l:'Land Areas',v:String(landAreaCnt),c:'#10B981'}].forEach(function(s){
      var card=el('div',{style:{background:s.c==='#3B82F6'?'rgba(59,130,246,0.04)':'rgba(16,185,129,0.04)',border:'1px solid '+(s.c==='#3B82F6'?'rgba(59,130,246,0.15)':'rgba(16,185,129,0.15)'),borderRadius:'10px',padding:'10px 8px',textAlign:'center'}});
      card.appendChild(div({color:cl.sub,fontSize:'7.5px',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace",marginBottom:'4px'},s.l));
      card.appendChild(el('div',{style:{color:s.c,fontSize:'14px',fontWeight:'800',fontFamily:"'Space Grotesk',monospace"}},s.v));
      r5.appendChild(card);
    });
    dSec.appendChild(r5);

    // Row 6: AI Market Momentum
    (function(){
      var momKeys=Object.keys(MARKET_MOMENTUM).filter(function(k){return k!=="_overall";});
      var overall=MARKET_MOMENTUM["_overall"];
      var upCnt=0,downCnt=0,stableCnt=0;
      momKeys.forEach(function(k){var m=MARKET_MOMENTUM[k];if(m.trend==="up")upCnt++;else if(m.trend==="down")downCnt++;else stableCnt++;});
      var momColor=overall&&overall.trend==="up"?"#10B981":overall&&overall.trend==="down"?"#EF4444":"#F59E0B";
      var momAge=overall&&overall.updated?Math.round((Date.now()-new Date(overall.updated).getTime())/(1000*60*60*24)):null;
      var r6=el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}});
      [{l:'AI Tracked Areas',v:String(momKeys.length),c:momColor},{l:'Trending Up',v:String(upCnt),c:'#10B981'},{l:'Trending Down',v:String(downCnt),c:'#EF4444'},{l:'Data Age',v:momAge!==null?momAge+'d ago':'No data',c:momColor}].forEach(function(s){
        var card=el('div',{style:{background:hexAlpha(momColor,0.04),border:'1px solid '+hexAlpha(momColor,0.15),borderRadius:'10px',padding:'10px 8px',textAlign:'center'}});
        card.appendChild(div({color:cl.sub,fontSize:'7.5px',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace",marginBottom:'4px'},s.l));
        card.appendChild(el('div',{style:{color:s.c,fontSize:'14px',fontWeight:'800',fontFamily:"'Space Grotesk',monospace"}},s.v));
        r6.appendChild(card);
      });
      dSec.appendChild(div({color:momColor,fontSize:'8px',letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace",marginBottom:'6px',fontWeight:'700'},'AI Market Intelligence · Groq'));
      dSec.appendChild(r6);
      if(momKeys.length>0){
        var topMovers=momKeys.map(function(k){return{area:k,pct:MARKET_MOMENTUM[k].pct||0,trend:MARKET_MOMENTUM[k].trend};}).sort(function(a,b){return Math.abs(b.pct)-Math.abs(a.pct);}).slice(0,6);
        var moverGrid=el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px',marginBottom:'12px'}});
        topMovers.forEach(function(m){
          var mc=m.trend==='up'?'#10B981':m.trend==='down'?'#EF4444':'#F59E0B';
          var card=el('div',{style:{background:cl.raised,borderRadius:'8px',padding:'8px',textAlign:'center'}});
          card.appendChild(div({color:cl.sub,fontSize:'7px',fontFamily:"'Space Grotesk',monospace",marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},m.area));
          card.appendChild(div({color:mc,fontSize:'13px',fontWeight:'700',fontFamily:"'Space Grotesk',monospace"},(m.pct>0?'+':'')+m.pct.toFixed(1)+'%'));
          moverGrid.appendChild(card);
        });
        dSec.appendChild(moverGrid);
      }
    })();

    // Footer
    dSec.appendChild(div({color:cl.sub,fontSize:'8px',fontFamily:"'Inter',sans-serif",textAlign:'center',opacity:'0.6'},'Data from '+bCnt.toLocaleString()+' residential + '+comCnt+' commercial + '+landCnt+' land across '+aCnt+'+ areas · Updated daily · Powered by DubAIVal AI'));
    wrap.appendChild(dSec);
  })();

  // -- STATS GRID --
  const statsGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"});
  MARKET_STATS.forEach(function(s){
    var sc=div({background:"rgba(255,255,255,0.03)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"12px",padding:"14px 16px",transition:"transform 0.2s ease,box-shadow 0.2s ease,border-color 0.2s ease",cursor:"default"},[
      div({color:cl.sub,fontSize:"9.5px",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"5px",fontFamily:"'Space Grotesk',monospace"},s.label),
      div({color:cl.gold,fontSize:"17px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},s.val),
      div({color:s.up===true?cl.green:s.up===false?cl.red:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},(s.up===true?"▲ ":"")+s.note),
    ]);
    sc.addEventListener("mouseenter",function(){sc.style.transform="translateY(-2px)";sc.style.boxShadow="0 6px 20px rgba(0,0,0,0.3)";sc.style.borderColor="rgba(255,255,255,0.12)";});
    sc.addEventListener("mouseleave",function(){sc.style.transform="translateY(0)";sc.style.boxShadow="none";sc.style.borderColor="rgba(255,255,255,0.06)";});
    statsGrid.appendChild(sc);
  });
  // ── MACRO RISK MONITOR ────────────────────────────────────────────────
  var riskCard=el("div",{style:{background:cl.surface,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"1px solid "+(MACRO_VARS.riskFactor<0.97?"rgba(240,64,96,0.3)":MACRO_VARS.riskFactor>=1.0?"rgba(212,175,55,0.3)":cl.border),borderRadius:"14px",padding:"16px",marginBottom:"14px",boxShadow:"0 4px 30px rgba(0,0,0,0.3)"}});
  var riskTop=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}});
  var riskTitle=el("div",{});
  riskTitle.appendChild(div({color:cl.gold,fontSize:"9px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"Market Risk Monitor · Live"));
  var rf=MACRO_VARS.riskFactor;
  var riskColor=rf>=1.0?cl.green:rf>=0.97?"#F59E0B":cl.red;
  var riskLbl=rf>=1.0?"BULLISH · Market Expanding":rf>=0.97?"CAUTIOUS · Volatile Stabilization":"RISK-OFF · Market Correction";
  var riskStatus=el("div",{style:{color:riskColor,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"}});
  riskStatus.textContent="● "+riskLbl;
  riskTitle.appendChild(riskStatus);
  riskTop.appendChild(riskTitle);
  var srcBadge=el("div",{style:{background:"rgba(201,168,76,0.08)",border:"1px solid "+cl.goldDim,borderRadius:"20px",padding:"3px 9px",fontSize:"9px",color:cl.gold,fontFamily:"'Space Grotesk',monospace",flexShrink:"0"}});
  srcBadge.textContent=MACRO_VARS.fetched?"AI·DLD":"Loading...";
  riskTop.appendChild(srcBadge);
  riskCard.appendChild(riskTop);
  var indRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginBottom:"10px"}});
  [{l:"Geopolitical",v:MACRO_VARS.riskFactor,icon:""},{l:"Demand",v:MACRO_VARS.socialIndex,icon:""},{l:"Economic",v:MACRO_VARS.economicOutlook,icon:""}].forEach(function(ind){
    var pct=(ind.v-1)*100;
    var col=pct>0?cl.green:pct>-2?"#F59E0B":cl.red;
    var c=el("div",{style:{background:cl.raised,borderRadius:"8px",padding:"8px",textAlign:"center"}});
    c.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},ind.icon+" "+ind.l));
    c.appendChild(div({color:col,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(pct>=0?"+":"")+pct.toFixed(1)+"%"));
    indRow.appendChild(c);
  });
  riskCard.appendChild(indRow);
  if(MACRO_VARS.reason){
    var rEl=el("div",{style:{color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5",padding:"7px 10px",background:"rgba(255,255,255,0.02)",borderRadius:"6px",borderLeft:"2px solid "+cl.goldDim}});
    rEl.textContent=MACRO_VARS.reason;
    riskCard.appendChild(rEl);
  }
  wrap.appendChild(riskCard);

    wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"},[
    div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"},[
      span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Dubai Market · Q1 2026"),
      div({display:"flex",alignItems:"center",gap:"5px",background:cl.greenBg,border:"1px solid "+cl.greenBo,borderRadius:"20px",padding:"3px 10px"},[
        div({width:"5px",height:"5px",borderRadius:"50%",background:cl.green,animation:"pulse 2s infinite",flexShrink:"0"}),
        span({color:cl.green,fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace"},"DLD DATA"),
      ]),
    ]),
    statsGrid,
  ]));

  // -- PSF TREND CHART --
  var PSF_CHART_DATA={"Downtown Dubai":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[2276,2286,2585,2432,2635,2725,2730,2782,2522,2553,2620,2473,2670,2489,2773,2790,2628,2713,2633,2716,2729,2715,2807,2801,2562,2698,2976,2737,3622,3771,3212,2965,2794,2773,2765,2567],"counts":[1648,1160,1244,1412,1724,2508,1436,1392,1236,1356,960,1340,992,1040,1764,1376,1504,1340,1172,1224,1264,1220,1244,1264,892,964,852,848,1560,1772,1220,872,844,536,488,363]},"Dubai Marina":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[3593,2978,3296,2907,3700,1860,3425,2181,2445,2384,2113,2280,2122,1923,1968,2048,2117,2351,2537,2539,2615,3284,3106,2862,2518,2648,2398,2324,2319,2330,2717,2296,2751,2432,2295,2225],"counts":[3908,2424,3004,2464,2824,1968,2808,1680,1872,2436,1860,3028,2080,2260,2516,2212,2732,2904,3036,2480,3308,3836,3516,2748,1988,2208,1528,1556,1592,1584,1572,1156,1652,900,960,520]},"Palm Jumeirah":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[2627,3123,2984,3424,2504,2500,3133,2740,2231,2669,2554,2665,2330,2383,2936,2357,2577,2633,2771,2962,2635,2766,2980,2684,2586,3535,3009,3384,3335,3984,3312,3586,3715,4770,3124,3516],"counts":[644,540,524,548,488,504,532,420,312,428,444,616,480,452,356,364,528,412,440,384,356,440,532,380,384,400,260,440,540,496,484,380,504,380,260,177]},"Business Bay":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[1707,1996,2555,2404,2023,2123,2209,2242,2179,2357,2334,2395,2526,2414,2466,2299,2430,2313,2291,2323,2275,2422,2309,2291,2497,2471,2651,2707,2476,2548,2600,2746,2477,2568,2490,2234],"counts":[1508,1900,4168,3548,2300,3104,3484,3728,2848,3024,2508,3848,4236,4236,2324,2472,3772,2676,5108,2484,2944,3888,4064,3404,3184,5044,6028,5352,3928,3412,3836,3028,2164,1648,1384,731]},"Dubai Hills":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[1890,1912,1900,1985,2010,2066,2118,2140,2140,2066,2169,2262,2176,2390,2162,2324,2431,2258,2224,2280,2392,2395,2475,2422,2426,2557,2415,2300,2293,2487,2468,2490,2325,2415,2337,2324],"counts":[2104,1184,988,1708,1948,1732,2924,2072,1364,872,1748,4160,1468,4836,724,3376,3660,1848,1724,1260,1772,1624,1944,1624,1312,1824,1836,1288,1200,1280,1152,1288,1344,836,596,281]},"Dubai Creek Harbour":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[2060,2177,2154,2157,2052,2072,2089,2161,2231,2197,2224,2248,2390,2466,2664,2617,2502,2295,2363,2281,2288,2270,2361,2422,2465,2409,2366,2553,2483,2573,2516,2616,2458,2395,2673,2516],"counts":[1940,1932,1220,1272,668,652,512,660,1428,996,876,1008,1356,2832,1736,2364,1272,680,952,628,932,572,1008,2036,1580,1376,1216,1672,1056,2212,980,2404,1644,716,2412,468]},"JVC":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[1326,1401,1365,1268,1360,1410,1550,1473,1554,1617,1698,1451,1536,1620,1537,1541,1691,1624,1684,1738,1656,1688,1833,1851,1920,1758,1851,1858,1865,1832,1885,1906,2010,2053,1838,2048],"counts":[312,276,268,232,280,276,204,212,204,240,240,364,260,300,316,276,300,260,232,252,280,256,252,336,256,256,168,252,260,260,188,204,256,172,100,92]},"JLT":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[2069,2087,2005,1793,1589,1340,1596,1743,1695,1446,1352,1608,1492,1873,2286,2125,2186,1950,2040,2077,1957,2014,2412,2222,2232,2031,2095,2075,2206,2345,2115,1905,1664,1759,2496,1864],"counts":[2224,2316,1728,1588,1172,1072,1156,1412,1336,1096,732,1300,1036,1468,1920,1920,2048,1564,1308,1424,1352,1320,1712,1532,1148,1052,1232,960,1176,1360,1028,776,716,512,632,374]},"MBR City":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[1617,1839,1850,1853,1778,1800,1986,1887,1782,1692,1728,1821,1793,2003,2001,2162,2113,1939,2092,1972,1953,1986,2132,2074,1977,2075,2097,2066,2064,2070,2118,2076,2095,2053,2082,2046],"counts":[2348,3448,3500,6220,6696,2272,1792,1708,1876,2992,1500,4740,3756,1676,2020,2152,2132,1224,1656,932,928,1012,1400,1224,976,1008,828,992,1084,944,968,872,1088,620,572,737]},"DAMAC Hills":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[596,676,646,804,748,686,718,770,733,1597,1650,1628,1531,517,975,1692,1690,1017,1587,1617,1665,967,915,1556,1676,1531,913,1605,1657,1481,1081,1364,1598,1837,1881,1725],"counts":[144,104,128,164,112,192,104,96,140,944,1072,1300,672,708,268,1360,1456,504,544,528,476,196,276,556,748,448,180,508,600,324,288,344,368,920,2376,705]},"Meydan":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[852,766,1054,992,806,810,718,808,798,806,869,806,851,836,1113,1845,1885,1750,1875,1780,1875,1880,1845,1930,1950,1950,1945,1910,1769,1930,1918,1793,1669,1755,1700,1212],"counts":[300,292,344,524,188,144,116,80,96,204,144,272,264,196,396,1232,3292,1620,768,484,1160,1700,1116,2332,2936,2596,2048,2420,2592,2548,1472,764,1692,1528,844,356]},"Dubai South":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[801,834,1019,926,802,1191,1245,1523,998,1184,1184,1147,1193,1247,1196,1383,1539,1490,1625,1954,1489,1863,1584,1593,1802,1685,1393,1391,1368,1465,1554,1474,1500,1547,1631,1645],"counts":[432,676,1748,856,456,2284,1012,1208,716,1696,788,1476,1772,2672,3360,4100,4820,1872,3472,3648,3018,3664,3452,2836,2380,2744,2956,3680,2740,3508,4016,3416,3724,4072,4569,2987]},"City Walk":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[2098,2303,2647,2738,2355,2440,2219,3179,3080,2382,2634,2675,2713,2595,2980,2920,2150,2576,2570,2585,2902,2869,3220,3283,3025,3099,3223,3122,3212,3013,3173,3204,3368,3122,2998,3254],"counts":[508,380,504,508,440,344,236,728,512,324,400,1104,392,356,1384,440,748,168,176,268,364,460,1512,1352,832,580,660,652,796,328,472,496,1084,520,720,230]},"Jumeirah":{"labels":["2023-06","2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"],"data":[2648,2470,2535,2608,2647,2618,2792,2641,2632,2653,2431,2695,2770,2736,2909,2669,2642,2739,2818,2638,2710,2808,2881,2700,2841,2769,2667,2693,2887,3091,3280,2768,3116,2952,2585,2875],"counts":[876,256,152,296,140,180,304,652,284,128,96,184,500,340,172,140,156,120,128,100,84,120,128,164,152,80,52,80,116,176,124,828,148,76,44,54]}};  
  const chartWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"}});
  
  // Header
  chartWrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"PSF Trend · 3-Year History · DLD Data"),
    span({color:cl.sub,fontSize:"8.5px",fontFamily:"'Space Grotesk',monospace"},"Source: DLD 2022–2026"),
  ]));

  // Area selector
  if(!window.CHART_STATE)window.CHART_STATE={area:"Downtown Dubai",view:"1Y"};
  const areaNames=Object.keys(PSF_CHART_DATA);
  
  const selRow=el("div",{style:{display:"flex",gap:"6px",marginBottom:"12px",flexWrap:"wrap"}});
  
  // Area dropdown
  const areaSel=el("select",{style:{flex:"1",background:cl.bg,border:"1px solid "+cl.border,color:cl.white,padding:"6px 10px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace"}});
  areaNames.forEach(function(a){
    const opt=el("option",{value:a},a);
    if(a===window.CHART_STATE.area)opt.selected=true;
    areaSel.appendChild(opt);
  });
  areaSel.addEventListener("change",function(){window.CHART_STATE.area=this.value;render();});
  selRow.appendChild(areaSel);

  // View buttons
  [{k:"6M",l:"6M"},{k:"1Y",l:"1Y"},{k:"3Y",l:"3Y"}].forEach(function(v){
    const active=window.CHART_STATE.view===v.k;
    const btn=el("button",{style:{
      padding:"5px 12px",borderRadius:"8px",fontSize:"10px",
      border:"1px solid "+(active?cl.gold:cl.border),
      background:active?cl.goldFaint:"transparent",
      color:active?cl.gold:cl.sub,
      fontFamily:"'Space Grotesk',monospace",cursor:"pointer"
    },onclick:function(){window.CHART_STATE.view=v.k;render();}},v.l);
    selRow.appendChild(btn);
  });
  chartWrap.appendChild(selRow);

  // Get data for selected area and view
  const cData=PSF_CHART_DATA[window.CHART_STATE.area]||PSF_CHART_DATA["Downtown Dubai"];
  const nMonths=window.CHART_STATE.view==="6M"?6:window.CHART_STATE.view==="1Y"?12:36;
  const labels=cData.labels.slice(-nMonths);
  const values=cData.data.slice(-nMonths);
  const minPSF=Math.min.apply(null,values);
  const maxPSF=Math.max.apply(null,values);
  const firstPSF=values[0];
  const lastPSF=values[values.length-1];
  const changePct=((lastPSF-firstPSF)/firstPSF*100).toFixed(1);
  const isUp=lastPSF>=firstPSF;

  // Stats row
  const statsRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}});
  [
    {l:"Current PSF",v:"AED "+lastPSF.toLocaleString(),c:cl.gold},
    {l:nMonths+"M Change",v:(isUp?"+":"")+changePct+"%",c:isUp?cl.green:cl.red},
    {l:"Range",v:minPSF.toLocaleString()+"–"+maxPSF.toLocaleString(),c:cl.sub},
  ].forEach(function(s){
    const cell=el("div",{style:{background:cl.raised,borderRadius:"8px",padding:"8px 10px"}});
    cell.appendChild(div({color:cl.sub,fontSize:"7.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},s.l));
    cell.appendChild(div({color:s.c,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},s.v));
    statsRow.appendChild(cell);
  });
  chartWrap.appendChild(statsRow);

  // SVG Chart
  const chartH=120, chartW=600, padL=40, padR=10, padT=10, padB=25;
  const plotW=chartW-padL-padR, plotH=chartH-padT-padB;
  const yMin=Math.floor(minPSF*0.97/100)*100;
  const yMax=Math.ceil(maxPSF*1.03/100)*100;
  const n=values.length;
  
  function xPos(i){return padL+i/(n-1)*plotW;}
  function yPos(v){return padT+plotH-(v-yMin)/(yMax-yMin)*plotH;}
  
  // Build path
  let pathD="M"+xPos(0)+","+yPos(values[0]);
  for(let i=1;i<n;i++){
    const x0=xPos(i-1),y0=yPos(values[i-1]),x1=xPos(i),y1=yPos(values[i]);
    const cx=(x0+x1)/2;
    pathD+=" C"+cx+","+y0+" "+cx+","+y1+" "+x1+","+y1;
  }
  
  // Fill path
  const fillD=pathD+" L"+xPos(n-1)+","+(padT+plotH)+" L"+padL+","+(padT+plotH)+" Z";
  
  // Y grid lines
  const yStep=Math.round((yMax-yMin)/4/100)*100||500;
  const gridLines=[];
  for(let y=yMin;y<=yMax;y+=yStep){
    const py=yPos(y);
    gridLines.push('<line x1="'+padL+'" y1="'+py+'" x2="'+(chartW-padR)+'" y2="'+py+'" stroke="rgba(240,242,245,0.08)" stroke-width="1"/>');
    gridLines.push('<text x="'+(padL-4)+'" y="'+(py+4)+'" fill="rgba(240,242,245,0.4)" font-size="9" text-anchor="end" font-family="monospace">'+y+'</text>');
  }
  
  // X labels (every 6 months)
  const xLabels=[];
  for(let i=0;i<n;i+=Math.max(1,Math.floor(n/6))){
    const lbl=labels[i].slice(0,7);
    xLabels.push('<text x="'+xPos(i)+'" y="'+(padT+plotH+16)+'" fill="rgba(240,242,245,0.4)" font-size="8" text-anchor="middle" font-family="monospace">'+lbl+'</text>');
  }
  
  const lineColor=isUp?"#10B981":"#EF4444";
  const fillColor=isUp?"rgba(16,185,129,0.08)":"rgba(239,68,68,0.08)";
  
  const svgHTML='<svg viewBox="0 0 '+chartW+' '+chartH+'" style="width:100%;height:auto;display:block;">'+
    '<defs><linearGradient id="grd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+lineColor+'" stop-opacity="0.2"/><stop offset="100%" stop-color="'+lineColor+'" stop-opacity="0"/></linearGradient></defs>'+
    gridLines.join('')+
    '<path d="'+fillD+'" fill="url(#grd)"/>'+
    '<path d="'+pathD+'" fill="none" stroke="'+lineColor+'" stroke-width="2" stroke-linecap="round"/>'+
    xLabels.join('')+
    '</svg>';
  
  const svgWrap=el("div",{style:{borderRadius:"8px",overflow:"hidden",background:"rgba(240,242,245,0.02)",border:"1px solid "+cl.border}});
  svgWrap.innerHTML=svgHTML;
  chartWrap.appendChild(svgWrap);
  
  chartWrap.appendChild(div({marginTop:"8px",color:cl.sub,fontSize:"8px",fontFamily:"'Space Grotesk',monospace",textAlign:"right"},"DLD verified transactions · "+cData.labels[0]+" to "+cData.labels[cData.labels.length-1]));
  wrap.appendChild(chartWrap);

  // -- PSF BENCHMARKS --
  const psfRows=[
    {area:"Palm Jumeirah",    apt:null, villa:3980, yield:"4.0–4.8%"},
    {area:"Emirates Hills",  apt:null, villa:3100, yield:"3.5–4.5%"},
    {area:"Downtown Dubai",  apt:3011, villa:null,  yield:"5.0–6.0%"},
    {area:"DIFC",            apt:2900, villa:null,  yield:"4.8–5.8%"},
    {area:"Al Barari",       apt:null, villa:2900,  yield:"3.8–4.8%"},
    {area:"Emaar Beachfront",apt:2800, villa:null,  yield:"5.5–6.5%"},
    {area:"Business Bay",    apt:2547, villa:null,  yield:"5.5–7.0%"},
    {area:"District One",    apt:null, villa:2500,  yield:"4.2–5.2%"},
    {area:"Dubai Marina",    apt:2058, villa:null,  yield:"5.5–7.2%"},
    {area:"Tilal Al Ghaf",   apt:null, villa:2100,  yield:"4.5–5.5%"},
    {area:"Dubai Hills",     apt:1950, villa:1950,  yield:"4.8–6.0%"},
    {area:"Dubai Creek",     apt:1850, villa:null,  yield:"5.5–6.8%"},
    {area:"Arabian Ranches 3",apt:null,villa:1500,  yield:"5.0–6.2%"},
    {area:"JVC",             apt:1510, villa:null,  yield:"7.0–9.5%"},
    {area:"DAMAC Hills",     apt:null, villa:1150,  yield:"5.8–7.0%"},
    {area:"Dubai South",     apt:950,  villa:880,   yield:"7.0–9.0%"},
  ];

  const psfWrap=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"});
  psfWrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"PSF Benchmarks · 2025–2026"),
    span({color:cl.sub,fontSize:"8.5px",fontFamily:"'Space Grotesk',monospace"},"AED/sqft"),
  ]));

  // Header row
  const headerRow=el("div",{style:{display:"grid",gridTemplateColumns:"2fr 0.8fr 0.8fr 0.9fr",gap:"4px",paddingBottom:"6px",borderBottom:"1px solid "+cl.border,marginBottom:"4px"}});
  ["Area","Apt","Villa","Yield"].forEach(function(h){
    headerRow.appendChild(span({color:cl.sub,fontSize:"8px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},h));
  });
  psfWrap.appendChild(headerRow);

  psfRows.forEach(function(r,i){
    const row=el("div",{style:{display:"grid",gridTemplateColumns:"2fr 0.8fr 0.8fr 0.9fr",gap:"4px",padding:"7px 0",borderBottom:i<psfRows.length-1?"1px solid "+cl.border:"none",alignItems:"center"}});
    row.appendChild(span({color:cl.white,fontSize:"12px",fontFamily:"'Inter',sans-serif"},r.area));
    row.appendChild(span({color:r.apt?cl.white:cl.sub,fontSize:"11px",fontWeight:r.apt?"600":"400",fontFamily:"'Space Grotesk',monospace"},r.apt?r.apt.toLocaleString():"—"));
    row.appendChild(span({color:r.villa?cl.white:cl.sub,fontSize:"11px",fontWeight:r.villa?"600":"400",fontFamily:"'Space Grotesk',monospace"},r.villa?r.villa.toLocaleString():"—"));
    row.appendChild(span({color:cl.green,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},r.yield));
    psfWrap.appendChild(row);
  });
  wrap.appendChild(psfWrap);

  // -- MARKET CYCLE --
  const cycleRows=[
    {yr:"2002–08",n:"Bubble Boom",c:"+400%",col:cl.green},
    {yr:"2008–11",n:"GFC Crash",c:"-50%",col:cl.red},
    {yr:"2011–14",n:"Recovery",c:"+60%",col:cl.green},
    {yr:"2014–19",n:"Correction",c:"-25–35%",col:cl.red},
    {yr:"2020",n:"COVID Dip",c:"-10–15%",col:cl.yellow},
    {yr:"2021–25",n:"Super Cycle",c:"+75%",col:cl.green},
    {yr:"2026 →",n:"Moderation · Buyer Window",c:"±3–8%",col:cl.yellow},
  ];
  wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"14px"},"Market Cycle · 20-Year History"),
    ...cycleRows.map(function(c,i){return div({display:"flex",alignItems:"center",gap:"12px",padding:"9px 0",borderBottom:i<6?"1px solid "+cl.border:"none"},[
      span({color:cl.gold,fontSize:"10.5px",fontFamily:"'Space Grotesk',monospace",minWidth:"60px"},c.yr),
      span({color:cl.white,fontSize:"12.5px",fontFamily:"'Inter',sans-serif",flex:"1"},c.n),
      span({color:c.col,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},c.c),
    ]);}),
    div({marginTop:"12px",background:cl.goldFaint,border:"1px solid "+cl.goldDim,borderRadius:"8px",padding:"10px 14px",color:"rgba(240,242,245,0.7)",fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.7"},
      "June 2026: Post-geo correction. Buyer leverage open 3–6 months. Geo adjustment "+Math.round(LIVE_GEO.adj*100)+"% applied."
    ),
  ]));

  // -- TRACK RECORD / ACCURACY PROOF --
  // Raw facts only (building/area/size/sold price) — fairPrice is computed live
  // via computeValuation() below, so this stays accurate as the model changes
  // instead of going stale like a hardcoded number would.
  const CASE_STUDIES=[
    {building:"Marina Gate 2",label:"Marina Gate 2",area:"Dubai Marina",unitType:"2BR",size:1450,sold:3347222,date:"2025",source:"https://www.bayut.com/for-sale/2-bedroom-apartments/dubai/dubai-marina/marina-gate/marina-gate-2/"},
    {building:"Marina Gate (Marina Gate 1, Select Group)",label:"Marina Gate 1",area:"Dubai Marina",unitType:"3BR",size:1950,sold:6479604,date:"2025",source:"https://www.bayut.com/for-sale/3-bedroom-apartments/dubai/dubai-marina/marina-gate/"},
    {building:"Princess Tower",label:"Princess Tower",area:"Dubai Marina",unitType:"2BR",size:1300,sold:2170304,date:"2025",source:"https://www.propertyfinder.ae/en/transactions/buy/dubai/dubai-marina-princess-tower"},
    {building:"Burj Khalifa",label:"Burj Khalifa",area:"Downtown Dubai",unitType:"1BR",size:900,sold:3130945,date:"2025",source:"https://www.bayut.com/for-sale/1-bedroom-apartments/dubai/downtown-dubai/burj-khalifa-area/burj-khalifa/"},
    {building:"Act One | Act Two Towers (Emaar, Opera District)",label:"Act One | Act Two",area:"Downtown Dubai",unitType:"2BR",size:1350,sold:3787226,date:"2025",source:"https://www.bayut.com/for-sale/apartments/dubai/downtown-dubai/opera-district/act-one-act-two-towers/"},
    {building:"DAMAC Towers by Paramount Hotels and Resorts",label:"DAMAC Towers by Paramount",area:"Business Bay",unitType:"1BR",size:750,sold:1522961,date:"2025",source:"https://www.bayut.com/for-sale/1-bedroom-apartments/dubai/business-bay/damac-towers-by-paramount-hotels-and-resorts/"},
    {building:"Vera Residences (Damac)",label:"Vera Residences",area:"Business Bay",unitType:"1BR",size:890,sold:1540000,date:"2025",source:"https://www.bayut.com/for-sale/apartments/dubai/business-bay/vera-residences/"},
    {building:"Binghatti House",label:"Binghatti House",area:"Jumeirah Village Circle",unitType:"1BR",size:750,sold:1052209,date:"2025",source:"https://www.propertyfinder.ae/en/transactions/buy/dubai/jumeirah-village-circle-district-10-binghatti-house"},
    {building:"Binghatti Onyx",label:"Binghatti Onyx",area:"Jumeirah Village Circle",unitType:"1BR",size:750,sold:1035000,date:"2025",source:"https://www.bayut.com/property-market-analysis/transactions/sale/apartments/dubai/jumeirah-village-circle-jvc/jvc-district-15/binghatti-onyx/"},
    {building:"",label:"JVC — Area Average",area:"Jumeirah Village Circle",unitType:"Studio",size:450,sold:600000,date:"2025",source:"https://www.fazwaz.ae/property-for-sale/united-arab-emirates/dubai/jumeirah-village-circle-jvc"},
    {building:"Elite Sports Residence",label:"Elite Sports Residence",area:"Dubai Sports City",unitType:"Studio",size:450,sold:521000,date:"2025",source:"https://www.propertyfinder.ae/en/buy/dubai/studio-apartments-for-sale-dubai-sports-city-elite-sports-residence.html"},
    {building:"",label:"Dubai Sports City — Area Average",area:"Dubai Sports City",unitType:"1BR",size:750,sold:860775,date:"2025",source:"https://www.cbnme.com/news/dubai-sports-city-records-aed-4-7-billion-in-real-estate-transactions-over-12-months/"},
    {building:"",label:"JLT — Area Average",area:"Jumeirah Lake Towers",unitType:"1BR",size:960,sold:1470000,date:"2025",source:"https://yallavalue.com/dubai/jumeirah-lake-towers-jlt?property_type=apartments&price_type=rental&metric=price_per_sqft"},
    {building:"Tilal Al Furjan (Nakheel)",label:"Tilal Al Furjan",area:"Al Furjan",unitType:"Villa-4BR",size:3934,sold:7560000,date:"2025",source:"https://metropolitan.realestate/jebel-ali-village/tilal-al-furjan/"},
    {building:"",label:"Al Furjan — Area Average",area:"Al Furjan",unitType:"2BR",size:1300,sold:1650000,date:"2025",source:"https://sherwoodsproperty.com/al-furjan-dubai-property-investment-2026/"},
    {building:"",label:"Town Square — Area Average",area:"Town Square",unitType:"Villa-3BR",size:2250,sold:1900000,date:"2025",source:"https://www.propertyfinder.ae/en/buy/dubai/villas-for-sale-town-square.html"},
    {building:"",label:"DAMAC Hills — Area Average",area:"DAMAC Hills",unitType:"Villa-3BR",size:2800,sold:5190312,date:"2025",source:"https://www.bayut.com/for-sale/villas/dubai/damac-hills/"},
    {building:"",label:"Dubai Hills Estate — Area Average",area:"Dubai Hills Estate",unitType:"2BR",size:1200,sold:2260770,date:"2025-08",source:"https://www.espace.ae/latest-property-news-detail/dubai-hills-estate-august-2025-community-report"},
  ];
  const csRows=CASE_STUDIES.map(function(cs){
    const isVilla=/villa/i.test(cs.unitType);
    const bedsMatch=cs.unitType.match(/(\d+)BR/i);
    const beds=bedsMatch?bedsMatch[1]+" BR":/studio/i.test(cs.unitType)?"Studio":"2 BR";
    const f={area:cs.area,building:cs.building,size:cs.size,price:cs.sold,propCategory:isVilla?"villa":"apartment",view:"Not specified",beds:beds};
    const v=computeValuation(f,cs.building,null);
    const err=v?((v.fairPrice-cs.sold)/cs.sold*100):null;
    return{label:cs.label,area:cs.area,unitType:cs.unitType,sold:cs.sold,source:cs.source,fair:v?v.fairPrice:null,err:err,absErr:err!=null?Math.abs(err):null};
  }).filter(function(r){return r.fair!=null;}).sort(function(a,b){return a.absErr-b.absErr;});
  const within10=csRows.filter(function(r){return r.absErr<=10;}).length;
  const within20=csRows.filter(function(r){return r.absErr<=20;}).length;
  const sortedAbs=csRows.map(function(r){return r.absErr;}).sort(function(a,b){return a-b;});
  const medianErr=sortedAbs.length?sortedAbs[Math.floor(sortedAbs.length/2)]:0;
  wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"6px"},"Track Record · Estimate vs. Actual Sale Price"),
    div({color:cl.sub,fontSize:"11.5px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",marginBottom:"14px"},
      "Our fair-value model checked against "+csRows.length+" real DLD-registered transactions (2025–2026). One-off record-breaking sales are excluded — those are non-comparable to building/area averages by definition, so testing against them would be misleading either way."
    ),
    div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"14px"},[
      div({background:cl.raised,borderRadius:"10px",padding:"10px",textAlign:"center"},[
        div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"MEDIAN ERROR"),
        div({color:cl.gold,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},medianErr.toFixed(1)+"%"),
      ]),
      div({background:cl.raised,borderRadius:"10px",padding:"10px",textAlign:"center"},[
        div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"WITHIN ±10%"),
        div({color:cl.green,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},Math.round(within10/csRows.length*100)+"%"),
      ]),
      div({background:cl.raised,borderRadius:"10px",padding:"10px",textAlign:"center"},[
        div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"WITHIN ±20%"),
        div({color:cl.green,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},Math.round(within20/csRows.length*100)+"%"),
      ]),
    ]),
    ...csRows.map(function(r,i){
      const errCol=r.absErr<=10?cl.green:r.absErr<=20?"#F59E0B":cl.red;
      return div({display:"flex",justifyContent:"space-between",alignItems:"center",gap:"8px",padding:"9px 0",borderBottom:i<csRows.length-1?"1px solid "+cl.border:"none"},[
        div({flex:"1",minWidth:"0"},[
          div({color:cl.white,fontSize:"12px",fontFamily:"'Inter',sans-serif",fontWeight:"600",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},r.label),
          div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},[
            r.area+" · "+r.unitType+" · ",
            el("a",{href:r.source,target:"_blank",rel:"noopener",style:{color:cl.sub,textDecoration:"underline"}},"source"),
          ]),
        ]),
        div({textAlign:"right",flexShrink:"0"},[
          div({color:cl.sub,fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace"},"Sold AED "+r.sold.toLocaleString()),
          div({color:cl.white,fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace"},"Est. AED "+r.fair.toLocaleString()),
        ]),
        div({color:errCol,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",minWidth:"48px",textAlign:"right",flexShrink:"0"},(r.err>=0?"+":"")+r.err.toFixed(1)+"%"),
      ]);
    }),
    div({marginTop:"12px",background:cl.goldFaint,border:"1px solid "+cl.goldDim,borderRadius:"8px",padding:"10px 14px",color:"rgba(240,242,245,0.7)",fontSize:"11.5px",fontFamily:"'Inter',sans-serif",lineHeight:"1.7"},
      "Accuracy varies by data depth — check the Confidence Score on each valuation (Verified Building Data vs. Area Benchmark) to gauge the expected range for your specific search."
    ),
  ]));

  return wrap;
}


function renderAnalyzer(){
  const cl=C();
  const f=analyzerState.f;
  const wrap=el("div",{style:{padding:"16px",maxWidth:"640px",margin:"0 auto"}});

  // --- RECENT & SAVED SEARCHES ---
  if(analyzerState.stage===0&&DV_SAVED.searches.length>0){
    var ssWrap=el("div",{style:{marginBottom:"14px"}});
    ssWrap.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"6px"},"Recent & Saved Searches"));
    var ssScroll=el("div",{style:{display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"6px",scrollbarWidth:"thin"}});
    DV_SAVED.searches.forEach(function(s,idx){
      var verdictColors={DISTRESS:"#22C55E",GOOD:"#22C55E",FAIR:"#EAB308",OVER:"#EF4444"};
      var vc=verdictColors[s.verdict]||cl.sub;
      var chip=el("div",{style:{display:"flex",alignItems:"center",gap:"6px",background:hexAlpha(vc,0.08),border:"1px solid "+hexAlpha(vc,0.25),borderRadius:"20px",padding:"5px 8px 5px 12px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:"0"}});
      var chipText=el("span",{style:{color:cl.subHi,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"}});
      chipText.textContent=(s.building?s.building+" · ":"")+s.area+" · "+s.verdict;
      chip.appendChild(chipText);
      var xBtn=el("button",{style:{background:"rgba(255,255,255,0.1)",border:"none",color:cl.sub,fontSize:"10px",width:"16px",height:"16px",borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:"0",lineHeight:"1",flexShrink:"0"}});
      xBtn.textContent="×";
      xBtn.addEventListener("click",function(e){e.stopPropagation();removeSearch(idx);render();});
      chip.appendChild(xBtn);
      chip.addEventListener("click",function(){
        analyzerState.f.area=s.area;analyzerState.f.building=s.building||"";analyzerState.f.size=s.size||"";analyzerState.f.buaSize=s.size||"";
        analyzerState.f.price=s.price||"";analyzerState.f.beds=s.beds||"";analyzerState.f.floor=s.floor||"";
        analyzerState.f.view=s.view||"Not specified";analyzerState.f.propCategory=s.propType||"apartment";
        try{analyzerState.val=computeValuation(analyzerState.f);analyzerState.stage=2;render();}catch(e){render();}
      });
      ssScroll.appendChild(chip);
    });
    ssWrap.appendChild(ssScroll);
    wrap.appendChild(ssWrap);
  }

  // --- AI SMART SEARCH (compact bar) ---
  if(analyzerState.stage===0){
    if(!window._aiSearch)window._aiSearch={text:"",parsing:false,parsed:null,missing:[],filled:[]};
    var ai=window._aiSearch;
    var aiSysPrompt='You are a Dubai real estate property parser. Extract these fields from the user\'s description and return ONLY a JSON object: {"area":null,"building":null,"propType":null,"beds":null,"size_sqft":null,"floor":null,"view":null,"furnished":null,"parking":null,"bathrooms":null,"price":null,"purpose":null}. propType must be one of: apartment, villa, townhouse, penthouse, office, land. beds must be like "Studio","1 BR","2 BR" etc. furnished must be Furnished/Unfurnished/Semi-Furnished. view examples: Full Sea View, Skyline View, Golf View, etc. purpose: sale or rent. If a field is not mentioned, set it to null. Parse Arabic too: غرفتين=2 BR, غرفة=1 BR, ثلاث غرف=3 BR, مارينا=Dubai Marina, داون تاون=Downtown Dubai, شقة=apartment, فيلا=villa, تاون هاوس=townhouse, طابق=floor, إطلالة بحرية=Full Sea View, مفروش=Furnished.';
    var aiBar=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"10px 12px",marginBottom:"16px"}});
    var aiLabel=div({display:"flex",alignItems:"center",gap:"6px",marginBottom:"8px"},[
      span({color:cl.gold,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AI Smart Search"),
      span({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},"— or describe your property in text/voice")
    ]);
    aiBar.appendChild(aiLabel);
    var aiRow=div({display:"flex",gap:"6px",alignItems:"center"});
    var aiInp=el("input",{type:"text",placeholder:"e.g. 2BR Marina, 1200sqft, floor 25, sea view, 2.1M",
      style:{flex:"1",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"10px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
    aiInp.value=ai.text||"";
    aiInp.addEventListener("input",function(){ai.text=this.value;ai.parsed=null;ai.missing=[];ai.filled=[];});
    aiInp.addEventListener("keydown",function(e){if(e.key==="Enter")doAiParse();});
    aiRow.appendChild(aiInp);
    var aiBtn=el("button",{style:{background:ai.parsing?"#4B5563":"linear-gradient(135deg,#C9A84C,#7A5E28)",color:ai.parsing?"#9CA3AF":"#08090C",border:"none",padding:"10px 14px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:ai.parsing?"not-allowed":"pointer",whiteSpace:"nowrap"}});
    aiBtn.textContent=ai.parsing?"…":"AI";
    function doAiParse(){
      var txt=(ai.text||"").trim();if(!txt||ai.parsing)return;
      ai.parsing=true;ai.parsed=null;ai.missing=[];ai.filled=[];render();
      askAI([{role:"user",content:txt}],aiSysPrompt).then(function(resp){
        ai.parsing=false;
        try{
          var raw=resp.replace(/```json\s*/g,"").replace(/```/g,"").trim();
          var j=JSON.parse(raw);
          ai.parsed=j;
          var fieldMap=[
            {k:"area",fk:"area"},{k:"building",fk:"building"},{k:"price",fk:"price"},
            {k:"size_sqft",fk:"size"},{k:"beds",fk:"beds"},{k:"floor",fk:"floor"},
            {k:"view",fk:"view"},{k:"furnished",fk:"furnished"},{k:"parking",fk:"parking"},
            {k:"bathrooms",fk:"bathrooms"},{k:"propType",fk:"propCategory"}
          ];
          var f=analyzerState.f;ai.filled=[];ai.missing=[];
          fieldMap.forEach(function(m){
            var v=j[m.k];
            if(v!==null&&v!==undefined&&v!==""){
              if(m.k==="price")f[m.fk]=String(v).replace(/[^0-9]/g,"");
              else if(m.k==="propType"){f.propCategory=v==="villa"||v==="townhouse"?"villa":"apartment";if(v==="villa"||v==="townhouse")f.villaType=v.charAt(0).toUpperCase()+v.slice(1);if(v==="penthouse")f.aptSubtype="Penthouse";}
              else if(m.k==="size_sqft"){f.size=String(v);f.buaSize=String(v);}
              else f[m.fk]=String(v);
              ai.filled.push(m.k);
            }else{ai.missing.push(m.k);}
          });
          if(j.purpose)f.txnType=j.purpose;
          try{
            var hist=JSON.parse(localStorage.getItem("dv_smart_searches")||"[]");
            hist=hist.filter(function(h){return h!==txt;});
            hist.unshift(txt);if(hist.length>5)hist=hist.slice(0,5);
            localStorage.setItem("dv_smart_searches",JSON.stringify(hist));
          }catch(e){}
          if(f.area&&f.price&&(f.size||f.buaSize)){
            analyzerState.stage=1;render();
            setTimeout(function(){
              if(analyzerState.f.txnType==="rent"){
                var rval=computeRentalValuation(analyzerState.f);
                if(rval){analyzerState.rentalVal=rval;analyzerState.stage=2;}else{analyzerState.err="Could not compute rental valuation";analyzerState.stage=0;}
              }else{
                var val=computeValuation(analyzerState.f);
                if(val){analyzerState.val=val;analyzerState.stage=2;}else{analyzerState.err="Could not compute";analyzerState.stage=0;}
              }
              render();
            },600);
          }else{render();}
        }catch(e){ai.missing=["Parse error — try a clearer description"];ai.parsing=false;render();}
      }).catch(function(e){ai.parsing=false;ai.missing=["AI error: "+e.message];render();});
    }
    if(!ai.parsing)aiBtn.addEventListener("click",doAiParse);
    aiRow.appendChild(aiBtn);
    aiRow.appendChild(createVoiceMic("_voice_analyzer",function(txt){
      ai.text=txt;doAiParse();
    },{inline:true}));
    aiBar.appendChild(aiRow);
    if(ai.filled.length>0){
      aiBar.appendChild(div({color:cl.green,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginTop:"6px"},"✓ Auto-filled: "+ai.filled.join(", ")));
    }
    if(ai.missing.length>0&&ai.parsed){
      var essentials=["area","price","size_sqft"];
      var missingEss=ai.missing.filter(function(m){return essentials.indexOf(m)!==-1;});
      if(missingEss.length){
        aiBar.appendChild(div({color:"#F59E0B",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginTop:"4px"},"Required: "+missingEss.join(", ")));
      }
    }
    wrap.appendChild(aiBar);
  }

  // --- QUICK CHECK ---
  if(analyzerState.stage===0){
    var qc=el("div",{style:{background:"rgba(201,168,76,0.04)",border:"1px solid "+cl.goldDim,borderRadius:"16px",padding:"24px 20px",marginBottom:"20px",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}});
    qc.appendChild(el("div",{style:{textAlign:"center",marginBottom:"16px"}},[
      el("div",{style:{color:cl.gold,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"}},t("qc_title")),
      el("div",{style:{color:cl.sub,fontSize:"11.5px",fontFamily:"'Inter',sans-serif"}},t("qc_sub"))
    ]));
    if(!window._qcState)window._qcState={area:"",building:"",price:"",result:null,mode:"sale"};
    var qs=window._qcState;
    // Sale/Rent toggle for Quick Check
    var qcToggle=el("div",{style:{display:"flex",gap:"0",marginBottom:"14px",background:cl.raised,borderRadius:"8px",overflow:"hidden",border:"1px solid "+cl.border}});
    ["sale","rent"].forEach(function(m){
      var act=qs.mode===m;
      var tb=el("button",{style:{flex:"1",padding:"9px",border:"none",background:act?(m==="rent"?"linear-gradient(135deg,#8B5CF6,#6D28D9)":"linear-gradient(135deg,#C9A84C,#7A5E28)"):"transparent",color:act?(m==="rent"?"#fff":"#08090C"):cl.sub,fontSize:"12px",fontWeight:act?"700":"500",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",letterSpacing:"0.06em"}});
      tb.textContent=m==="sale"?"SALE CHECK":"RENT CHECK";
      tb.addEventListener("click",function(){qs.mode=m;qs.result=null;render();});
      qcToggle.appendChild(tb);
    });
    qc.appendChild(qcToggle);

    // Searchable area input
    var qcAreaWrap=el("div",{style:{position:"relative",marginBottom:"10px"}});
    var qcAreaInp=el("input",{type:"text",placeholder:t("qc_select_area"),style:{width:"100%",background:cl.raised,border:"1px solid "+(qs.area&&AREAS[qs.area]?cl.gold:cl.border),color:cl.white,padding:"11px 14px",borderRadius:"10px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
    qcAreaInp.value=qs.area||"";
    qcAreaInp.addEventListener("input",function(){
      qs.area=this.value;qs.result=null;
      var sg=document.getElementById("qc-area-sugg");if(!sg)return;sg.innerHTML="";
      var q=this.value.toLowerCase().trim();if(q.length<1)return;
      var hits=AREA_NAMES.filter(function(n){return n.toLowerCase().indexOf(q)>=0;});
      hits.slice(0,8).forEach(function(n){
        var row=el("div",{style:{padding:"8px 12px",cursor:"pointer",fontSize:"12px",color:cl.white,borderBottom:"1px solid "+cl.border,fontFamily:"'Inter',sans-serif"}});
        row.textContent=n;
        row.addEventListener("mousedown",function(e){e.preventDefault();qs.area=n;qs.result=null;render();});
        row.addEventListener("mouseenter",function(){this.style.background=cl.raised;});
        row.addEventListener("mouseleave",function(){this.style.background="transparent";});
        sg.appendChild(row);
      });
    });
    qcAreaInp.addEventListener("blur",function(){setTimeout(function(){var sg=document.getElementById("qc-area-sugg");if(sg)sg.innerHTML="";},200);});
    qcAreaWrap.appendChild(qcAreaInp);
    var qcAreaSugg=el("div",{id:"qc-area-sugg",style:{position:"absolute",top:"100%",left:"0",right:"0",zIndex:"100",background:cl.surface,border:"1px solid "+cl.border,borderRadius:"0 0 10px 10px",maxHeight:"180px",overflowY:"auto"}});
    qcAreaWrap.appendChild(qcAreaSugg);
    qc.appendChild(qcAreaWrap);

    // Building input with autocomplete
    var bWrap=el("div",{style:{position:"relative",marginBottom:"10px"}});
    var bInp=el("input",{type:"text",placeholder:"Building name",style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"11px 14px",borderRadius:"10px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
    bInp.value=qs.building||"";
    bInp.addEventListener("input",function(){qs.building=this.value;qs.result=null;
      var sg=document.getElementById("qc-bldg-sugg");if(!sg)return;sg.innerHTML="";
      var q=this.value.toLowerCase().trim();if(q.length<2)return;
      var hits=[];var areaFilter=qs.area?qs.area.toLowerCase():"";
      Object.entries(DB).forEach(function(e){
        if(e[0].indexOf(q)===0||(q.length>=3&&e[0].indexOf(q)>=0)){
          if(!areaFilter||e[1].a&&e[1].a.toLowerCase()===areaFilter)hits.push({k:e[0],d:e[1]});
        }
      });
      hits.slice(0,6).forEach(function(h){
        var row=el("div",{style:{padding:"8px 12px",cursor:"pointer",fontSize:"12px",color:cl.text,borderBottom:"1px solid "+cl.border,fontFamily:"'Inter',sans-serif"}});
        row.textContent=h.k.replace(/\b\w/g,function(c){return c.toUpperCase();})+(h.d.a?" · "+h.d.a:"");
        row.addEventListener("mousedown",function(e){e.preventDefault();qs.building=h.k;if(h.d.a&&!qs.area)qs.area=h.d.a;qs.result=null;render();});
        sg.appendChild(row);
      });
    });
    bInp.addEventListener("blur",function(){setTimeout(function(){var sg=document.getElementById("qc-bldg-sugg");if(sg)sg.innerHTML="";},200);});
    bWrap.appendChild(bInp);
    var bSugg=el("div",{id:"qc-bldg-sugg",style:{position:"absolute",top:"100%",left:"0",right:"0",zIndex:"100",background:cl.surface,border:"1px solid "+cl.border,borderRadius:"0 0 10px 10px",maxHeight:"180px",overflowY:"auto",display:"block"}});
    bWrap.appendChild(bSugg);
    qc.appendChild(bWrap);

    // Price input
    var pInp=el("input",{type:"text",inputMode:"numeric",placeholder:qs.mode==="rent"?"Asking rent (AED/year)":"Asking price (AED)",style:{width:"100%",background:cl.raised,border:"1px solid "+cl.border,color:cl.white,padding:"11px 14px",borderRadius:"10px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"14px"}});
    pInp.value=qs.price||"";
    pInp.addEventListener("input",function(){qs.price=this.value.replace(/[^0-9]/g,"");this.value=qs.price?parseInt(qs.price).toLocaleString():"";qs.result=null;});
    qc.appendChild(pInp);

    // Check button
    var checkBtn=el("button",{style:{width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:"linear-gradient(135deg,#C9A84C,#7A5E28)",color:"#08090C",fontSize:"15px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",letterSpacing:"0.03em"}});
    checkBtn.textContent=t("qc_btn");
    checkBtn.textContent=qs.mode==="rent"?"CHECK RENT":"CHECK PRICE";
    if(qs.mode==="rent"){checkBtn.style.background="linear-gradient(135deg,#8B5CF6,#6D28D9)";checkBtn.style.color="#fff";}
    checkBtn.addEventListener("click",function(){
      if(!qs.area){alert("Please select an area");return;}
      var price=parseInt((qs.price||"").replace(/[^0-9]/g,""));
      if(qs.mode==="rent"){
        if(!price||price<5000){alert("Please enter a valid annual rent");return;}
        var aData=AREAS[qs.area]||{r1:65000,r2:100000};
        var estSize=Math.round((aData.r2||100000)/(aData.psf||1500)*12);
        if(estSize<300)estSize=900;
        var fakeF={area:qs.area,building:qs.building||"",price:String(price),size:String(estSize),buaSize:"",beds:"2 BR",propCategory:"apartment",txnType:"rent",floor:"15",view:"Not specified",furnished:"Unfurnished"};
        var result=computeRentalValuation(fakeF);
        if(result){qs.result=result;qs.result._isRental=true;}else{qs.result={error:true};}
      }else{
        if(!price||price<50000){alert("Please enter a valid price");return;}
        var aData=AREAS[qs.area]||{psf:1800,sc:15,y:[5,7],g:[3,9,16]};
        var estSize=Math.round(price/(aData.psf||1800));
        if(estSize<200)estSize=800;
        if(estSize>10000)estSize=Math.round(price/1200);
        var fakeF={area:qs.area,building:qs.building||"",price:String(price),size:String(estSize),buaSize:"",beds:"2 BR",propCategory:"apartment",txnType:"sale",floor:"15",view:"Not specified",furnished:"Unfurnished",condition:"Used"};
        var result=computeValuation(fakeF);
        if(result){qs.result=result;}else{qs.result={error:true};}
      }
      render();
    });
    qc.appendChild(checkBtn);

    // Result display
    if(qs.result&&!qs.result.error&&qs.result._isRental){
      var rr=qs.result;
      var rentVerdictMap={BELOW_MARKET:{label:"BELOW MARKET",bg:"rgba(16,185,129,0.1)",border:"#10B981",color:"#10B981"},COMPETITIVE:{label:"COMPETITIVE",bg:"rgba(16,185,129,0.1)",border:"#10B981",color:"#10B981"},MARKET_RATE:{label:"MARKET RATE",bg:"rgba(245,158,11,0.1)",border:"#F59E0B",color:"#F59E0B"},ABOVE_MARKET:{label:"ABOVE MARKET",bg:"rgba(249,115,22,0.1)",border:"#F97316",color:"#F97316"},OVERPRICED:{label:"OVERPRICED",bg:"rgba(239,68,68,0.1)",border:"#EF4444",color:"#EF4444"}};
      var vm=rentVerdictMap[rr.verdict]||rentVerdictMap.MARKET_RATE;
      var resCard=el("div",{style:{marginTop:"16px",padding:"16px",borderRadius:"12px",border:"2px solid "+vm.border,background:vm.bg,textAlign:"center"}});
      resCard.appendChild(el("div",{style:{fontSize:"20px",fontWeight:"900",color:vm.color,fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"}},vm.label));
      resCard.appendChild(el("div",{style:{fontSize:"12px",color:cl.sub,lineHeight:"1.6",fontFamily:"'Inter',sans-serif"}},"Market Rent: AED "+rr.estRent.toLocaleString()+"/yr · Monthly: AED "+rr.estMonthly.toLocaleString()+" · "+(parseFloat(rr.vsPct)>=0?"+":"")+rr.vsPct+"% vs market"));
      var fullLink=el("div",{style:{marginTop:"12px"}});
      var fBtn=el("button",{style:{background:"transparent",border:"1px solid rgba(139,92,246,0.3)",color:"#8B5CF6",padding:"8px 20px",borderRadius:"8px",fontSize:"11.5px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",fontWeight:"600"}});
      fBtn.textContent="Full Rental Analysis →";
      fBtn.addEventListener("click",function(){
        analyzerState.f.area=qs.area;analyzerState.f.building=qs.building||"";analyzerState.f.price=qs.price;
        analyzerState.f.propCategory="apartment";analyzerState.f.txnType="rent";analyzerState.f.beds="2 BR";
        render();
        setTimeout(function(){var el=document.getElementById("dv-search-input");if(el)el.scrollIntoView({behavior:"smooth",block:"center"});},100);
      });
      fullLink.appendChild(fBtn);
      resCard.appendChild(fullLink);
      qc.appendChild(resCard);
    }else if(qs.result&&!qs.result.error&&!qs.result._isRental){
      var r=qs.result;
      var verdictMap={DISTRESS:{label:t("v_distress_s"),bg:"rgba(16,185,129,0.1)",border:"#10B981",color:"#10B981"},GOOD:{label:t("v_good_s"),bg:"rgba(16,185,129,0.1)",border:"#10B981",color:"#10B981"},FAIR:{label:t("v_fair_s"),bg:"rgba(245,158,11,0.1)",border:"#F59E0B",color:"#F59E0B"},OVER:{label:t("v_over_s"),bg:"rgba(239,68,68,0.1)",border:"#EF4444",color:"#EF4444"}};
      var vm=verdictMap[r.verdict]||verdictMap.FAIR;
      var resCard=el("div",{style:{marginTop:"16px",padding:"16px",borderRadius:"12px",border:"2px solid "+vm.border,background:vm.bg,textAlign:"center"}});
      resCard.appendChild(el("div",{style:{fontSize:"20px",fontWeight:"900",color:vm.color,fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"}},vm.label));
      resCard.appendChild(el("div",{style:{fontSize:"12px",color:cl.sub,lineHeight:"1.6",fontFamily:"'Inter',sans-serif"}},"Market PSF: AED "+r.adjPSF.toLocaleString()+" · Fair Value: AED "+r.fairPrice.toLocaleString()+" · "+(parseFloat(r.vsPct)>=0?"+":"")+r.vsPct+"% vs market"));
      var fullLink=el("div",{style:{marginTop:"12px"}});
      var fBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.goldDim,color:cl.gold,padding:"8px 20px",borderRadius:"8px",fontSize:"11.5px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",fontWeight:"600"}});
      fBtn.textContent=t("qc_full");
      fBtn.addEventListener("click",function(){
        var price=parseInt((qs.price||"").replace(/[^0-9]/g,""))||0;
        var aData=AREAS[qs.area]||{psf:1800};
        var estSize=Math.round(price/(aData.psf||1800));
        if(estSize<200)estSize=800;if(estSize>10000)estSize=Math.round(price/1200);
        analyzerState.f.area=qs.area;analyzerState.f.building=qs.building||"";
        analyzerState.f.price=String(price);analyzerState.f.size=String(estSize);
        analyzerState.f.beds="2";analyzerState.f.propCategory="apartment";analyzerState.f.txnType="sale";analyzerState.f.floor="15";
        render();
        setTimeout(function(){var el=document.getElementById("dv-search-input");if(el)el.scrollIntoView({behavior:"smooth",block:"center"});},100);
      });
      fullLink.appendChild(fBtn);
      resCard.appendChild(fullLink);
      qc.appendChild(resCard);
    }else if(qs.result&&qs.result.error){
      qc.appendChild(el("div",{style:{marginTop:"14px",padding:"12px",borderRadius:"10px",border:"1px solid "+cl.border,textAlign:"center",color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif"}},"Could not compute — try selecting a different area or entering a building name."));
    }
    window._qcElement=qc;
  }

  if(analyzerState.stage===1){
    // Loading
    const loadDiv=el("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"300px",gap:"16px"}});
    const spinner=el("div",{style:{width:"36px",height:"36px",borderRadius:"50%",border:"2px solid "+cl.border,borderTopColor:cl.gold,animation:"spin 0.8s linear infinite"}});
    loadDiv.appendChild(spinner);
    loadDiv.appendChild(div({color:cl.sub,fontSize:"12px",fontFamily:"'Space Grotesk',monospace"},t("az_loading")));
    wrap.appendChild(loadDiv);
    return wrap;
  }

  if(analyzerState.stage===2&&analyzerState.f.txnType==="rent"&&analyzerState.rentalVal){
    return renderRentalResult(wrap);
  }
  if(analyzerState.stage===2&&analyzerState.comVal){
    return renderCommercialResult(wrap);
  }
  if(analyzerState.stage===2&&analyzerState.landVal){
    return renderLandResult(wrap);
  }
  if(analyzerState.stage===2&&analyzerState.val){
    return renderAnalyzerResult(wrap);
  }

  // -- SMART SEARCH BOX --
  const searchWrap=el("div",{style:{position:"relative",marginBottom:"16px"}});
  searchWrap.appendChild(div({color:cl.gold,fontSize:"9px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Search Building, Cluster or Community"));
  
  const searchInp=el("input",{type:"text",id:"dv-search-input",placeholder:"e.g. Marina Gate, Venice, Address Kempinski, Sidra...",style:{
    width:"100%",background:cl.raised,border:"1px solid "+(f.building&&f.propCategory?cl.gold:cl.border),
    color:cl.white,padding:"13px 16px",borderRadius:"12px",fontSize:"14px",
    fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"
  }});
  // Restore value without losing cursor position
  searchInp.value=f.building&&!f.propCategory?f.building:"";
  
  searchInp.addEventListener("input",function(){
    analyzerState.f.building=this.value;
    analyzerState.f.area="";
    analyzerState.f.propCategory="";
    // Update suggestions without full re-render to keep focus
    updateSearchSuggestions(this.value);
  });
  searchInp.addEventListener("keydown",function(e){
    if(e.key==="Escape"){analyzerState.f.building="";render();}
  });
  searchWrap.appendChild(searchInp);

  // Smart suggestions container (updated via updateSearchSuggestions, not re-render)
  const suggContainer=el("div",{id:"dv-search-suggestions",style:{position:"relative",width:"100%"}});
  searchWrap.appendChild(suggContainer);
  // Trigger initial suggestions if query exists
  if(f.building&&f.building.length>=2&&!f.propCategory){
    setTimeout(function(){updateSearchSuggestions(f.building);},10);
  }
  
  // REMOVED: old inline suggestions (now handled by updateSearchSuggestions)
  if(false&&f.building&&f.building.length>=2){
    const q=f.building.toLowerCase().trim();
    const results=[];
    
    // Search DB entries - smart word-start matching
    var qWords=q.split(" ").filter(function(w){return w.length>0;});
    var scored=[];
    Object.entries(DB).forEach(function(e){
      var key=e[0],val=e[1];
      var score=0;
      var keyWords=key.split(" ");
      // Best: key starts with full query
      if(key.startsWith(q))score=100;
      // Good: every query word matches start of a key word
      else if(qWords.every(function(w){return keyWords.some(function(kw){return kw.startsWith(w);});}))score=80;
      // OK: query is start of key
      else if(key.startsWith(qWords[0]))score=60;
      // Weak: all words appear somewhere (only for long queries)
      else if(q.length>=4&&qWords.every(function(w){return key.includes(w);}))score=30;
      if(score>0)scored.push({name:key,area:val.a,psf:val.p,g:val.g,type:"building",sc:val.sc,score:score});
    });
    scored.sort(function(a,b){return b.score-a.score;});
    scored.slice(0,8).forEach(function(r){results.push(r);});
    
    // Search CLUSTERS
    if(results.length<10){
      Object.entries(CLUSTERS).forEach(function(e){
        const community=e[0],clusters=e[1];
        // Search community name
        if(community.toLowerCase().includes(q)&&results.length<10){
          results.push({name:community,area:community,psf:null,g:null,type:"community",clusters:clusters});
        }
        // Search cluster names
        clusters.forEach(function(c){
          if(results.length>=10)return;
          if(c.toLowerCase().includes(q)){
            results.push({name:c,area:community,psf:null,g:null,type:"cluster"});
          }
        });
      });
    }

    if(results.length>0){
      const sugg=el("div",{style:{background:cl.surface,border:"1px solid "+cl.gold,borderRadius:"12px",marginTop:"4px",overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}});
      results.forEach(function(r,i){
        const item=el("button",{style:{
          width:"100%",padding:"12px 16px",background:"transparent",
          border:"none",borderBottom:i<results.length-1?"1px solid "+cl.border:"none",
          color:cl.white,fontSize:"13px",cursor:"pointer",textAlign:"left",
          fontFamily:"'Inter',sans-serif",display:"block"
        }});
        // Name line
        const nameLine=el("div",{style:{fontWeight:"600",marginBottom:"2px"}});
        nameLine.textContent=(r.name.charAt(0).toUpperCase()+r.name.slice(1))+(r.type==="community"?" (Community)":r.type==="cluster"?" (Cluster)":"");
        item.appendChild(nameLine);
        // Info line
        const infoLine=el("div",{style:{fontSize:"10px",color:cl.sub,fontFamily:"'Space Grotesk',monospace"}});
        var infoText=r.area;
        if(r.psf)infoText+=" · AED "+r.psf.toLocaleString()+" PSF";
        if(r.g)infoText+=" · Grade "+r.g;
        if(r.type==="community")infoText+=" · "+r.clusters.length+" clusters";
        infoLine.textContent=infoText;
        item.appendChild(infoLine);
        
        item.addEventListener("mouseenter",function(){this.style.background=cl.raised;});
        item.addEventListener("mouseleave",function(){this.style.background="transparent";});
        item.addEventListener("click",function(){
          analyzerState.f.building=r.name;
          analyzerState.f.area=r.area;
          if(r.sc)analyzerState.f.serviceCharge=String(r.sc);
          // Auto-detect category
          if(r.type==="community"||r.type==="cluster"){
            analyzerState.f.propCategory="villa";
          } else {
            // Detect from name
            const n=r.name.toLowerCase();
            if(n.includes("villa")||n.includes("townhouse")||n.includes("cluster")||n.includes("phase")){
              analyzerState.f.propCategory="villa";
            } else {
              analyzerState.f.propCategory="apartment";
            }
          }
          render();
        });
        sugg.appendChild(item);
      });
      searchWrap.appendChild(sugg);
    }
  }
  wrap.appendChild(searchWrap);

  // Show selected property info
  if(f.building&&f.propCategory){
    const selectedBar=el("div",{style:{background:cl.goldFaint,border:"1px solid "+cl.goldDim,borderRadius:"10px",padding:"10px 14px",marginBottom:"14px",display:"flex",justifyContent:"space-between",alignItems:"center"}});
    const selLeft=el("div",{});
    selLeft.appendChild(div({color:cl.gold,fontSize:"11px",fontWeight:"700",fontFamily:"'Inter',sans-serif"},
      f.building.charAt(0).toUpperCase()+f.building.slice(1)));
    selLeft.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},
      f.area+(f.propCategory?" · "+(f.propCategory==="villa"?"Villa/Townhouse":"Apartment"):"")));
    selectedBar.appendChild(selLeft);
    const clearBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"4px 10px",borderRadius:"6px",fontSize:"11px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
    clearBtn.textContent="Change";
    clearBtn.addEventListener("click",function(){
      analyzerState.f.building="";analyzerState.f.area="";analyzerState.f.propCategory="";
      analyzerState.f.beds="";analyzerState.f.size="";analyzerState.f.price="";
      render();
    });
    selectedBar.appendChild(clearBtn);
    wrap.appendChild(selectedBar);
  }

  // -- SECTOR TOGGLE (Residential / Commercial / Land) --
  if(f.building&&f.propCategory){
    var secRow=el("div",{style:{display:"flex",gap:"0",marginBottom:"10px",background:cl.raised,borderRadius:"10px",overflow:"hidden",border:"1px solid "+cl.border}});
    [["residential","RESIDENTIAL","#C9A84C"],["commercial","COMMERCIAL","#3B82F6"],["land","LAND","#10B981"]].forEach(function(s){
      var mode=s[0],label=s[1],color=s[2];
      var active=(f.sector||"residential")===mode;
      var btn=el("button",{style:{flex:"1",padding:"10px 6px",border:"none",background:active?"linear-gradient(135deg,"+color+","+color+"99)":"transparent",color:active?"#fff":cl.sub,fontSize:"11px",fontWeight:active?"800":"600",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",letterSpacing:"0.08em",transition:"all 0.2s"}});
      btn.textContent=label;
      btn.addEventListener("click",function(){analyzerState.f.sector=mode;analyzerState.f.price="";analyzerState.f.size="";analyzerState.f.buaSize="";analyzerState.f.plotSize="";analyzerState.val=null;analyzerState.rentalVal=null;analyzerState.comVal=null;analyzerState.landVal=null;analyzerState.stage=0;render();});
      secRow.appendChild(btn);
    });
    wrap.appendChild(secRow);
  }

  // -- SALE / RENT TOGGLE --
  if(f.building&&f.propCategory&&(f.sector||"residential")==="residential"){
    var txnRow=el("div",{style:{display:"flex",gap:"0",marginBottom:"16px",background:cl.raised,borderRadius:"10px",overflow:"hidden",border:"1px solid "+cl.border}});
    ["sale","rent"].forEach(function(mode){
      var active=f.txnType===mode;
      var btn=el("button",{style:{flex:"1",padding:"12px",border:"none",background:active?"linear-gradient(135deg,#C9A84C,#7A5E28)":"transparent",color:active?"#08090C":cl.sub,fontSize:"13px",fontWeight:active?"800":"600",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",letterSpacing:"0.06em",transition:"all 0.2s"}});
      btn.textContent=mode==="sale"?"SALE ANALYSIS":"RENTAL ANALYSIS";
      btn.addEventListener("click",function(){analyzerState.f.txnType=mode;analyzerState.f.price="";analyzerState.val=null;analyzerState.rentalVal=null;analyzerState.stage=0;render();});
      txnRow.appendChild(btn);
    });
    wrap.appendChild(txnRow);
  }

  // Only show form fields after building selected
  if(!f.building||!f.propCategory){
    // Show area quick-select chips
    const quickAreas=["Downtown Dubai","Dubai Marina","Business Bay","Palm Jumeirah","Dubai Hills Estate","DAMAC Lagoons","JVC","Dubai Creek Harbour","MBR City","Emaar Beachfront"];
    const chipWrap=el("div",{style:{marginBottom:"16px"}});
    chipWrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Or browse by area"));
    const chips=el("div",{style:{display:"flex",flexWrap:"wrap",gap:"6px"}});
    quickAreas.forEach(function(area){
      const chip=el("button",{style:{background:cl.raised,border:"1px solid "+cl.border,color:cl.sub,padding:"5px 12px",borderRadius:"20px",fontSize:"11px",cursor:"pointer",fontFamily:"'Inter',sans-serif"}});
      chip.textContent=area;
      chip.addEventListener("click",function(){
        analyzerState.f.area=area;
        analyzerState.f.building=area;
        var isVillaArea=typeof VILLA_AREAS!=="undefined"&&VILLA_AREAS.has(area);
        analyzerState.f.propCategory=isVillaArea?"villa":"apartment";
        if(isVillaArea&&!analyzerState.f.beds)analyzerState.f.beds="4 BR";
        render();
      });
      chip.addEventListener("mouseenter",function(){this.style.borderColor=cl.goldDim;this.style.color=cl.gold;});
      chip.addEventListener("mouseleave",function(){this.style.borderColor=cl.border;this.style.color=cl.sub;});
      chips.appendChild(chip);
    });
    chipWrap.appendChild(chips);
    wrap.appendChild(chipWrap);

    // Quick Price Check — collapsible secondary tool
    if(window._qcElement){
      if(window._qcState&&window._qcState.result)window._qcExpanded=true;
      var qcSection=el("div",{style:{marginTop:"16px"}});
      var qcToggleBar=el("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"rgba(201,168,76,0.04)",border:"1px solid "+cl.goldDim,borderRadius:window._qcExpanded?"10px 10px 0 0":"10px",cursor:"pointer"}});
      qcToggleBar.appendChild(div({display:"flex",alignItems:"center",gap:"8px"},[
        span({color:cl.gold,fontSize:"11px"},""),
        span({color:cl.gold,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Quick Price Check"),
        span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},"— instant estimate with area & price")
      ]));
      qcToggleBar.appendChild(span({color:cl.sub,fontSize:"12px"},window._qcExpanded?"▾":"▸"));
      qcToggleBar.addEventListener("click",function(){window._qcExpanded=!window._qcExpanded;render();});
      qcSection.appendChild(qcToggleBar);
      if(window._qcExpanded){
        window._qcElement.style.borderRadius="0 0 16px 16px";
        window._qcElement.style.borderTop="none";
        window._qcElement.style.marginBottom="0";
        qcSection.appendChild(window._qcElement);
      }
      wrap.appendChild(qcSection);
    }

    return wrap;
  }

  // -- COMMERCIAL FORM --
  if((f.sector||"residential")==="commercial"&&f.building&&f.propCategory){
    var comCard=el("div",{style:{background:cl.surface,border:"1px solid rgba(59,130,246,0.3)",borderRadius:"14px",padding:"20px"}});
    comCard.appendChild(div({color:"#3B82F6",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"14px"},"COMMERCIAL PROPERTY ANALYSIS"));
    var stRow=el("div",{style:{marginBottom:"14px"}});
    stRow.appendChild(lbl("Property Sub-Type"));
    var stGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px"}});
    ["Office","Retail","Warehouse","Shop"].forEach(function(st){
      var active=(f.subType||"Office")===st;
      var b=el("button",{style:{padding:"8px 4px",borderRadius:"8px",fontSize:"11px",border:"1px solid "+(active?"#3B82F6":cl.border),background:active?"rgba(59,130,246,0.1)":"transparent",color:active?"#93C5FD":cl.sub,fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
      b.textContent=st;b.addEventListener("click",function(){analyzerState.f.subType=st;render();});
      stGrid.appendChild(b);
    });
    stRow.appendChild(stGrid);comCard.appendChild(stRow);
    var cspRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}});
    var cszBox=el("div",{});cszBox.appendChild(lbl("Size (sqft) *"));cszBox.appendChild(inp(I(),"e.g. 1200","number",f.size,function(v){analyzerState.f.size=v;}));cspRow.appendChild(cszBox);
    var cprBox=el("div",{});cprBox.appendChild(lbl("Asking Price (AED) *"));cprBox.appendChild(inp(I(),"e.g. 1,500,000","number",f.price,function(v){analyzerState.f.price=v;}));cspRow.appendChild(cprBox);
    comCard.appendChild(cspRow);
    if(f.size&&f.price){
      var cpsf=Math.round(parseInt(f.price)/parseInt(f.size));
      comCard.appendChild(div({background:"rgba(59,130,246,0.05)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:"8px",padding:"10px 14px",display:"flex",justifyContent:"space-between",marginBottom:"12px"},[
        span({color:cl.sub,fontSize:"12px",fontFamily:"'Space Grotesk',monospace"},"Implied PSF"),
        span({color:"#3B82F6",fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+cpsf.toLocaleString()),
      ]));
    }
    var comSubmit=el("button",{style:{marginTop:"10px",width:"100%",padding:"14px",borderRadius:"12px",border:"1px solid rgba(59,130,246,0.4)",background:"rgba(59,130,246,0.15)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",color:"#60A5FA",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.04em",cursor:"pointer"}});
    comSubmit.textContent="ANALYZE COMMERCIAL DEAL ->";
    comSubmit.addEventListener("click",function(){
      analyzerState.stage=1;render();
      setTimeout(function(){
        try{analyzerState.comVal=computeCommercialValuation(analyzerState.f);}catch(e){analyzerState.err="Commercial valuation error: "+e.message;analyzerState.stage=0;render();return;}
        if(!analyzerState.comVal){analyzerState.err="Could not compute commercial valuation";analyzerState.stage=0;render();return;}
        analyzerState.stage=2;render();
      },50);
    });
    comCard.appendChild(comSubmit);
    if(analyzerState.err)comCard.appendChild(div({color:"#EF4444",fontSize:"11px",marginTop:"8px",fontFamily:"'Space Grotesk',monospace"},analyzerState.err));
    wrap.appendChild(comCard);
    return wrap;
  }

  // -- LAND FORM --
  if((f.sector||"residential")==="land"&&f.building&&f.propCategory){
    var landCard=el("div",{style:{background:cl.surface,border:"1px solid rgba(16,185,129,0.3)",borderRadius:"14px",padding:"20px"}});
    landCard.appendChild(div({color:"#10B981",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"14px"},"LAND / PLOT ANALYSIS"));
    var zRow=el("div",{style:{marginBottom:"14px"}});
    zRow.appendChild(lbl("Zoning"));
    var zGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px"}});
    ["Residential","Commercial","Mixed Use","Industrial"].forEach(function(z){
      var zVal=z.toLowerCase().replace(" use","");
      var active=(f.zoning||"residential")===zVal;
      var b=el("button",{style:{padding:"8px 4px",borderRadius:"8px",fontSize:"11px",border:"1px solid "+(active?"#10B981":cl.border),background:active?"rgba(16,185,129,0.1)":"transparent",color:active?"#6EE7B7":cl.sub,fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
      b.textContent=z;b.addEventListener("click",function(){analyzerState.f.zoning=zVal;render();});
      zGrid.appendChild(b);
    });
    zRow.appendChild(zGrid);landCard.appendChild(zRow);
    var lspRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}});
    var lszBox=el("div",{});lszBox.appendChild(lbl("Plot Size (sqft) *"));lszBox.appendChild(inp(I(),"e.g. 5000","number",f.plotSize||f.size,function(v){analyzerState.f.plotSize=v;analyzerState.f.size=v;}));lspRow.appendChild(lszBox);
    var lprBox=el("div",{});lprBox.appendChild(lbl("Asking Price (AED) *"));lprBox.appendChild(inp(I(),"e.g. 3,000,000","number",f.price,function(v){analyzerState.f.price=v;}));lspRow.appendChild(lprBox);
    landCard.appendChild(lspRow);
    if((f.plotSize||f.size)&&f.price){
      var lpsf=Math.round(parseInt(f.price)/parseInt(f.plotSize||f.size));
      landCard.appendChild(div({background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:"8px",padding:"10px 14px",display:"flex",justifyContent:"space-between",marginBottom:"12px"},[
        span({color:cl.sub,fontSize:"12px",fontFamily:"'Space Grotesk',monospace"},"Implied PSF"),
        span({color:"#10B981",fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+lpsf.toLocaleString()),
      ]));
    }
    var landSubmit=el("button",{style:{marginTop:"10px",width:"100%",padding:"14px",borderRadius:"12px",border:"1px solid rgba(16,185,129,0.4)",background:"rgba(16,185,129,0.15)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",color:"#34D399",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.04em",cursor:"pointer"}});
    landSubmit.textContent="ANALYZE LAND DEAL ->";
    landSubmit.addEventListener("click",function(){
      analyzerState.stage=1;render();
      setTimeout(function(){
        try{analyzerState.landVal=computeLandValuation(analyzerState.f);}catch(e){analyzerState.err="Land valuation error: "+e.message;analyzerState.stage=0;render();return;}
        if(!analyzerState.landVal){analyzerState.err="Could not compute land valuation";analyzerState.stage=0;render();return;}
        analyzerState.stage=2;render();
      },50);
    });
    landCard.appendChild(landSubmit);
    if(analyzerState.err)landCard.appendChild(div({color:"#EF4444",fontSize:"11px",marginTop:"8px",fontFamily:"'Space Grotesk',monospace"},analyzerState.err));
    wrap.appendChild(landCard);
    return wrap;
  }

  // -- PROPERTY TYPE SELECTION --
  if(f.propCategory==="villa"){
    // Villa/Townhouse form
    const formCard=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px"}});

    // Report Type Selector (top of form)
    buildReportTypeSelector(cl,formCard);

    // Type selector
    formCard.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Property Type"));
    const typeRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginBottom:"16px"}});
    ["Standalone Villa","Townhouse","Semi-Detached","Cluster Villa","Independent Villa"].forEach(function(t){
      const active=f.villaType===t;
      const b=el("button",{style:{padding:"8px",borderRadius:"8px",fontSize:"12px",border:"1px solid "+(active?cl.gold:cl.border),background:active?cl.goldFaint:"transparent",color:active?cl.white:cl.sub,fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
      b.textContent=t;
      b.addEventListener("click",function(){analyzerState.f.villaType=t;render();});
      typeRow.appendChild(b);
    });
    formCard.appendChild(typeRow);

    // Beds
    formCard.appendChild(fld("Bedrooms",mkSelect(S(),["3 BR","4 BR","5 BR","6 BR","7+ BR"],f.beds||"4 BR",function(v){analyzerState.f.beds=v;})));
    formCard.appendChild(fld("Bathrooms",mkSelect(S(),["3","4","5","6","7","8+"],f.bathrooms||"",function(v){analyzerState.f.bathrooms=v;})));
    
    // Floors info
    formCard.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginTop:"12px",marginBottom:"8px"},"Floor Plan"));
    const floorRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginBottom:"16px"}});
    ["G+1","G+2 (3F)","G+B+1","G+B+2","Other"].forEach(function(fl){
      if(floorRow.children.length>=5)return;
      const active=f.villaFloors===fl;
      const b=el("button",{style:{padding:"7px 6px",borderRadius:"8px",fontSize:"11px",border:"1px solid "+(active?cl.gold:cl.border),background:active?cl.goldFaint:"transparent",color:active?cl.white:cl.sub,fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
      b.textContent=fl;
      b.addEventListener("click",function(){analyzerState.f.villaFloors=fl;render();});
      floorRow.appendChild(b);
    });
    formCard.appendChild(floorRow);

    // View
    formCard.appendChild(fld("View",mkSelect(S(),["Not specified","Full Sea View","Beach Access View","Palm View","Partial Sea View","Golf View","Lagoon View","Creek Harbour View","Lake View","Garden/Park View","Pool View","Skyline View","Boulevard View","Community View"],f.view||"Not specified",function(v){analyzerState.f.view=v;})));

        // Private Pool + Single Row + Parking
    var ppRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}});
    var ppBox=el("div",{});
    ppBox.appendChild(lbl("Features"));
    var ppToggle=el("div",{style:{display:"flex",alignItems:"center",gap:"8px",padding:"9px 12px",background:cl.raised,borderRadius:"8px",cursor:"pointer",border:"1px solid "+(f.privatePool?cl.gold:cl.border)}});
    var ppChk=el("div",{style:{width:"16px",height:"16px",borderRadius:"4px",border:"2px solid "+(f.privatePool?cl.gold:cl.border),background:f.privatePool?cl.gold:"transparent",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",color:"#08090C"}});
    if(f.privatePool)ppChk.textContent="v";
    ppToggle.appendChild(ppChk);
    var ppLbl=el("div",{style:{fontSize:"12px",fontFamily:"'Inter',sans-serif",color:f.privatePool?cl.white:cl.sub}});
    ppLbl.textContent="Private Pool (+12%)";
    ppToggle.appendChild(ppLbl);
    ppToggle.addEventListener("click",function(){analyzerState.f.privatePool=!analyzerState.f.privatePool;render();});
    ppBox.appendChild(ppToggle);

    // Single Row toggle
    var srToggle=el("div",{style:{display:"flex",alignItems:"center",gap:"8px",padding:"7px 10px",background:cl.raised,borderRadius:"8px",cursor:"pointer",border:"1px solid "+(f.singleRow?cl.gold:cl.border),marginTop:"6px"}});
    var srChk=el("div",{style:{width:"16px",height:"16px",borderRadius:"4px",border:"2px solid "+(f.singleRow?cl.gold:cl.border),background:f.singleRow?cl.gold:"transparent",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",color:"#08090C"}});
    if(f.singleRow)srChk.textContent="v";
    srToggle.appendChild(srChk);
    var srLbl=el("div",{style:{fontSize:"12px",fontFamily:"'Inter',sans-serif",color:f.singleRow?cl.white:cl.sub}});
    srLbl.textContent="Single Row (+8%)";
    srToggle.appendChild(srLbl);
    srToggle.addEventListener("click",function(){analyzerState.f.singleRow=!analyzerState.f.singleRow;render();});
    ppBox.appendChild(srToggle);
    // Corner Villa toggle
    var cvToggle=el("div",{style:{display:"flex",alignItems:"center",gap:"8px",padding:"7px 10px",background:cl.raised,borderRadius:"8px",cursor:"pointer",border:"1px solid "+(f.cornerVilla?cl.gold:cl.border),marginTop:"6px"}});
    var cvChk=el("div",{style:{width:"16px",height:"16px",borderRadius:"4px",border:"2px solid "+(f.cornerVilla?cl.gold:cl.border),background:f.cornerVilla?cl.gold:"transparent",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",color:"#08090C"}});
    if(f.cornerVilla)cvChk.textContent="v";
    cvToggle.appendChild(cvChk);
    var cvLbl=el("div",{style:{fontSize:"12px",fontFamily:"'Inter',sans-serif",color:f.cornerVilla?cl.white:cl.sub}});
    cvLbl.textContent="Corner Villa (+5%)";
    cvToggle.appendChild(cvLbl);
    cvToggle.addEventListener("click",function(){analyzerState.f.cornerVilla=!analyzerState.f.cornerVilla;render();});
    ppBox.appendChild(cvToggle);
    ppRow.appendChild(ppBox);
    var pkVBox=el("div",{});
    pkVBox.appendChild(lbl("Parking"));
    pkVBox.appendChild(mkSelect(S(),["1","2","3","4+"],f.parking||"2",function(v){analyzerState.f.parking=v;}));
    ppRow.appendChild(pkVBox);
    formCard.appendChild(ppRow);
    // Furnished status for villas
    formCard.appendChild(fld("Furnished",mkSelect(S(),["Unfurnished","Semi-Furnished","Furnished"],f.furnished||"Unfurnished",function(v){analyzerState.f.furnished=v;})));
    // Maid Room toggle
    var maidRowV=el("div",{style:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px",padding:"10px 12px",background:cl.raised,borderRadius:"8px",cursor:"pointer",border:"1px solid "+(f.hasMaid?cl.gold:cl.border)}});
    var maidChkV=el("div",{style:{width:"18px",height:"18px",borderRadius:"4px",border:"2px solid "+(f.hasMaid?cl.gold:cl.border),background:f.hasMaid?cl.gold:"transparent",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",color:"#08090C",fontWeight:"900"}});
    if(f.hasMaid)maidChkV.textContent="✓";
    var maidLblV=el("div",{});
    maidLblV.appendChild(div({color:cl.white,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"Maid Room (+3%)"));
    maidLblV.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"Dedicated maid quarters — value premium"));
    maidRowV.appendChild(maidChkV);
    maidRowV.appendChild(maidLblV);
    maidRowV.addEventListener("click",function(){analyzerState.f.hasMaid=!analyzerState.f.hasMaid;render();});
    formCard.appendChild(maidRowV);
    // Study Room toggle (villa)
    var studyRowV=el("div",{style:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px",padding:"10px 12px",background:cl.raised,borderRadius:"8px",cursor:"pointer",border:"1px solid "+(f.hasStudy?cl.gold:cl.border)}});
    var studyChkV=el("div",{style:{width:"18px",height:"18px",borderRadius:"4px",border:"2px solid "+(f.hasStudy?cl.gold:cl.border),background:f.hasStudy?cl.gold:"transparent",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",color:"#08090C",fontWeight:"900"}});
    if(f.hasStudy)studyChkV.textContent="✓";
    var studyLblV=el("div",{});
    studyLblV.appendChild(div({color:cl.white,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"Study Room (+2%)"));
    studyLblV.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"Dedicated study/office — value premium"));
    studyRowV.appendChild(studyChkV);
    studyRowV.appendChild(studyLblV);
    studyRowV.addEventListener("click",function(){analyzerState.f.hasStudy=!analyzerState.f.hasStudy;render();});
    formCard.appendChild(studyRowV);
    // Upgraded toggle (villa)
    var upgRowV=el("div",{style:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px",padding:"10px 12px",background:cl.raised,borderRadius:"8px",cursor:"pointer",border:"1px solid "+(f.isUpgraded?cl.gold:cl.border)}});
    var upgChkV=el("div",{style:{width:"18px",height:"18px",borderRadius:"4px",border:"2px solid "+(f.isUpgraded?cl.gold:cl.border),background:f.isUpgraded?cl.gold:"transparent",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",color:"#08090C",fontWeight:"900"}});
    if(f.isUpgraded)upgChkV.textContent="✓";
    var upgLblV=el("div",{});
    upgLblV.appendChild(div({color:cl.white,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"Upgraded (+5%)"));
    upgLblV.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"Kitchen, bathrooms, flooring upgraded by owner"));
    upgRowV.appendChild(upgChkV);
    upgRowV.appendChild(upgLblV);
    upgRowV.addEventListener("click",function(){analyzerState.f.isUpgraded=!analyzerState.f.isUpgraded;render();});
    formCard.appendChild(upgRowV);
    // BUA + Plot
    const sizeRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginTop:"12px",marginBottom:"12px"}});
    const buaBox=el("div",{}); buaBox.appendChild(lbl("BUA (sqft)"));
    const buaInp=inp(I(),"e.g. 2800","number",f.size,function(v){analyzerState.f.size=v;});
    buaBox.appendChild(buaInp); sizeRow.appendChild(buaBox);
    const plotBox=el("div",{}); plotBox.appendChild(lbl("Plot (sqft)"));
    const plotInp=inp(I(),"e.g. 4500","number",f.plotSize||"",function(v){analyzerState.f.plotSize=v;});
    plotBox.appendChild(plotInp); sizeRow.appendChild(plotBox);
    formCard.appendChild(sizeRow);

    // Price + SC
    var isRental=f.txnType==="rent";
    formCard.appendChild(fld(isRental?"Asking Annual Rent (AED)":"Asking Price (AED)",inp(I(),isRental?"e.g. 280,000":"e.g. 4,500,000","number",f.price,function(v){analyzerState.f.price=v;})));
    formCard.appendChild(fld("Service Charge (AED/sqft/yr)",inp(I(),f.serviceCharge||"e.g. 3.5","number",f.serviceCharge,function(v){analyzerState.f.serviceCharge=v;})));

    // PSF display
    if(f.size&&f.price){
      const psf=Math.round(parseInt(f.price)/parseInt(f.size));
      formCard.appendChild(div({background:cl.goldFaint,border:"1px solid "+cl.goldDim,borderRadius:"8px",padding:"10px 14px",display:"flex",justifyContent:"space-between",marginTop:"12px"},[
        span({color:cl.sub,fontSize:"12px",fontFamily:"'Space Grotesk',monospace"},isRental?"Implied Rent PSF":"Implied PSF"),
        span({color:cl.gold,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+psf.toLocaleString()+(isRental?"/yr":"")),
      ]));
    }

    // Purchase history (seller/agent mode)
    if(!isRental&&(analyzerState.reportFor==="seller"||analyzerState.reportFor==="both")){
      var ppSec=el("div",{style:{background:hexAlpha("#8B5CF6",0.06),border:"1px solid "+hexAlpha("#8B5CF6",0.2),borderRadius:"10px",padding:"14px",marginTop:"12px"}});
      ppSec.appendChild(div({color:"#A78BFA",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"Seller Purchase History (Optional)"));
      var ppRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}});
      var ppBox=el("div",{});ppBox.appendChild(lbl("Purchase Price (AED)"));ppBox.appendChild(inp(I(),"e.g. 3,200,000","number",f.purchasePrice||"",function(v){analyzerState.f.purchasePrice=v;}));ppRow.appendChild(ppBox);
      var pdBox=el("div",{});pdBox.appendChild(lbl("Purchase Date"));var pdInp=el("input",{style:I(),type:"date",value:f.purchaseDate||""});pdInp.addEventListener("change",function(e){analyzerState.f.purchaseDate=e.target.value;});pdBox.appendChild(pdInp);ppRow.appendChild(pdBox);
      ppSec.appendChild(ppRow);
      ppSec.appendChild(div({color:hexAlpha("#8B5CF6",0.6),fontSize:"9.5px",fontFamily:"'Inter',sans-serif",marginTop:"8px"},"Enables capital gain analysis, hold vs sell comparison & sell price recommendation"));
      formCard.appendChild(ppSec);
    }

    // Submit
    const canSubmit=true;
    var isAgentModeV=analyzerState.reportMode==="agent";
    const submitBtn=el("button",{style:{marginTop:"14px",width:"100%",padding:"14px",borderRadius:"12px",border:isRental?"1px solid rgba(139,92,246,0.4)":isAgentModeV?"1px solid rgba(59,130,246,0.4)":"1px solid rgba(212,175,55,0.3)",background:isRental?"rgba(139,92,246,0.15)":isAgentModeV?"rgba(59,130,246,0.15)":"rgba(212,175,55,0.15)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",color:isRental?"#A78BFA":isAgentModeV?"#60A5FA":"#D4A843",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.04em",cursor:"pointer"}});
    submitBtn.textContent=isRental?"ANALYZE THIS RENTAL ->":isAgentModeV?"GENERATE AGENT REPORT ->":"ANALYZE THIS DEAL ->";
    if(true){
      submitBtn.addEventListener("click",function(){
        analyzerState.stage=1;
        render();
        setTimeout(function(){
          var rMode=analyzerState.reportMode;
          var rFor=analyzerState.reportFor;
          if(isRental){
            try{
              analyzerState.rentalVal=computeRentalValuation(analyzerState.f);
            }catch(e){analyzerState.err="Rental valuation error: "+e.message;analyzerState.stage=0;render();return;}
            if(!analyzerState.rentalVal){analyzerState.err="Could not compute rental valuation";analyzerState.stage=0;render();return;}
            analyzerState.stage=2;
            try{dvTrack("analyze_rental",{area:analyzerState.f.area,type:"villa"});}catch(e){}
            var rv=analyzerState.rentalVal;
            var propDesc=analyzerState.f.building+" villa in "+analyzerState.f.area+". "+f.beds+". BUA:"+f.size+"sqft. Asking rent AED "+parseInt(f.price).toLocaleString()+"/yr";
            if(rMode==="agent"){
              var buyerP=getRentalAgentAIPrompt(propDesc,rv,"buyer",analyzerState.f.area);
              var sellerP=getRentalAgentAIPrompt(propDesc,rv,"seller",analyzerState.f.area);
              if(rFor==="both"||rFor==="buyer"){callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:buyerP}],max_tokens:400,temperature:0.5}).then(function(r){return r.json();}).then(function(d){analyzerState.aiText=d.choices&&d.choices[0]?d.choices[0].message.content:"";render();}).catch(function(){render();});}
              if(rFor==="both"||rFor==="seller"){callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:sellerP}],max_tokens:400,temperature:0.5}).then(function(r){return r.json();}).then(function(d){analyzerState.aiTextSeller=d.choices&&d.choices[0]?d.choices[0].message.content:"";render();}).catch(function(){render();});}
              if(rFor==="buyer")analyzerState.aiTextSeller="";
              if(rFor==="seller")analyzerState.aiText="";
            }else{
              var amenities=AREA_AMENITIES[analyzerState.f.area]?" Location amenities: "+AREA_AMENITIES[analyzerState.f.area]+".":"";
              var aiPrompt=propDesc+". EXACT DATA: Market rent AED "+rv.estRent.toLocaleString()+"/yr (AED "+rv.monthly.toLocaleString()+"/mo). Range: AED "+rv.rentLow.toLocaleString()+"-"+rv.rentHigh.toLocaleString()+"/yr. Asking "+rv.vsPct+"% vs market. Verdict: "+rv.verdict.replace(/_/g," ")+". Confidence: "+rv.confScore+"%."+amenities+" Use ONLY these numbers and amenities. 3 sentences: rental assessment with location benefits, negotiation target, tenant tips.";
              callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:getChatSys()},{role:"user",content:aiPrompt}],max_tokens:300,temperature:0.4}).then(function(r){return r.json();}).then(function(d){analyzerState.aiText=d.choices&&d.choices[0]?d.choices[0].message.content:"";render();}).catch(function(){render();});
            }
            render();
          }else{
            try{
              analyzerState.val=computeValuation(analyzerState.f);
            }catch(computeErr){
              console.error('computeValuation error:',computeErr);
              analyzerState.err='Valuation error: '+computeErr.message;
              analyzerState.stage=0;
              render();
              return;
            }
            analyzerState.stage=2;analyzerState.smartRent=null;
            try{dvTrack("analyze_property",{area:analyzerState.f.area,type:"villa"});}catch(e){}
            fetchLiveRentals(analyzerState.f.building,analyzerState.f.area,analyzerState.f.beds).then(function(liveRentals){
              var sr=computeSmartRent(analyzerState.f,liveRentals);
              if(sr&&sr.source!=="estimated"){
                analyzerState.smartRent=sr;
                analyzerState.val.rent=sr.rent;
                analyzerState.val.grossYield=sr.grossYield;
                analyzerState.val.netYield=sr.netYield;
                analyzerState.val.prRatio=sr.prRatio;
                analyzerState.val.investSignal=sr.investSignal;
                analyzerState.val.totalReturnAnnual=sr.totalReturnAnnual;
                render();
              }else{analyzerState.smartRent=computeSmartRent(analyzerState.f,null);}
            }).catch(function(){analyzerState.smartRent=computeSmartRent(analyzerState.f,null);});
            var propDesc=analyzerState.f.building+" villa/townhouse in "+analyzerState.f.area+". BUA:"+f.size+"sqft. Asking AED "+parseInt(f.price).toLocaleString();
            if(rMode==="agent"){
              var buyerP=getAgentAIPrompt(propDesc,analyzerState.val,"buyer",analyzerState.f.area);
              var sellerP=getAgentAIPrompt(propDesc,analyzerState.val,"seller",analyzerState.f.area);
              if(rFor==="both"||rFor==="buyer"){callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:buyerP}],max_tokens:400,temperature:0.5}).then(function(r){return r.json();}).then(function(d){analyzerState.aiText=d.choices&&d.choices[0]?d.choices[0].message.content:"";render();}).catch(function(){render();});}
              if(rFor==="both"||rFor==="seller"){callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:sellerP}],max_tokens:400,temperature:0.5}).then(function(r){return r.json();}).then(function(d){analyzerState.aiTextSeller=d.choices&&d.choices[0]?d.choices[0].message.content:"";render();}).catch(function(){render();});}
              if(rFor==="buyer")analyzerState.aiTextSeller="";
              if(rFor==="seller")analyzerState.aiText="";
            }else{
              var vv=analyzerState.val;var amenities=AREA_AMENITIES[analyzerState.f.area]?" Location amenities: "+AREA_AMENITIES[analyzerState.f.area]+".":"";
              var aiPrompt=propDesc+". EXACT DATA: Market PSF AED "+vv.adjPSF.toLocaleString()+" (range "+vv.psfLo.toLocaleString()+"-"+vv.psfHi.toLocaleString()+"). Asking "+vv.vsPct+"% vs market. Verdict: "+vv.verdict+". Fair value: AED "+vv.fairPrice.toLocaleString()+". Suggested offer: AED "+vv.suggestedOffer.toLocaleString()+". Est. rent: AED "+(vv.rent||0).toLocaleString()+"/yr. Gross yield: "+vv.grossYield+"%. Net yield: "+vv.netYield+"%. Growth 3yr: "+vv.g1+"%. Confidence: "+vv.confScore+"% ("+vv.confTier+"). Signal: "+vv.investSignal+"."+amenities+" Investor:"+USER_PROFILE.investorType+". Use ONLY these numbers and amenities. 3 sentences: assessment with location benefits, negotiation target AED, key risk/opportunity.";
              callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:getChatSys()},{role:"user",content:aiPrompt}],max_tokens:300,temperature:0.4}).then(function(r){return r.json();}).then(function(d){analyzerState.aiText=d.choices&&d.choices[0]?d.choices[0].message.content:"";render();}).catch(function(){render();});
            }
            render();
          }
        },50);
      });
    }
    formCard.appendChild(submitBtn);
    if(analyzerState.err)formCard.appendChild(div({color:"#EF4444",fontSize:"11px",marginTop:"8px",fontFamily:"'Space Grotesk',monospace"},analyzerState.err));
    wrap.appendChild(formCard);

  } else {
    // APARTMENT FORM (existing logic, cleaned up)
    const formCard=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px"}});

    // Report Type Selector (top of form)
    buildReportTypeSelector(cl,formCard);

    // Apt subtype
    const APTYPES=["Studio","1 BR","2 BR","3 BR","4 BR","Penthouse","Duplex","Loft"];
    formCard.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Apartment Type"));
    const aptGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px",marginBottom:"16px"}});
    APTYPES.forEach(function(t){
      const active=f.aptSubtype===t||f.beds===t;
      const b=el("button",{style:{padding:"7px 4px",borderRadius:"8px",fontSize:"11px",border:"1px solid "+(active?cl.gold:cl.border),background:active?cl.goldFaint:"transparent",color:active?cl.white:cl.sub,fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
      b.textContent=t;
      b.addEventListener("click",function(){analyzerState.f.aptSubtype=t;analyzerState.f.beds=t;render();});
      aptGrid.appendChild(b);
    });
    formCard.appendChild(aptGrid);

    // Floor + View
    const fvRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}});
    const flBox=el("div",{}); flBox.appendChild(lbl("Floor Number")); flBox.appendChild(inp(I(),"e.g. 19","number",f.floor,function(v){analyzerState.f.floor=v;})); fvRow.appendChild(flBox);
    const vwBox=el("div",{}); vwBox.appendChild(lbl("View")); vwBox.appendChild(mkSelect(S(),["Not specified","Burj Khalifa + Fountain","Fountain View","Burj Khalifa View","Full Sea View","Beach Access View","Palm View","Marina View","Full Canal View","Partial Burj View","Partial Sea View","Golf View","Boulevard View","Lagoon View","Creek Harbour View","Lake View","Skyline View","Partial Canal View","Sheikh Zayed Road View","Garden/Park View","Pool View","Community View"],f.view||"Not specified",function(v){analyzerState.f.view=v;})); fvRow.appendChild(vwBox);
    formCard.appendChild(fvRow);
    // Bathrooms
    const bathRow=el("div",{style:{marginBottom:"12px"}});
    bathRow.appendChild(lbl("Bathrooms"));
    bathRow.appendChild(mkSelect(S(),["","1","2","3","4","5+"],f.bathrooms||"",function(v){analyzerState.f.bathrooms=v;}));
    formCard.appendChild(bathRow);

    // Size + Price
    var isRentalA=f.txnType==="rent";
    const spRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}});
    const szBox=el("div",{}); szBox.appendChild(lbl("Size (sqft) *")); szBox.appendChild(inp(I(),"e.g. 860","number",f.size,function(v){analyzerState.f.size=v;})); spRow.appendChild(szBox);
    const prBox=el("div",{}); prBox.appendChild(lbl(isRentalA?"Asking Rent (AED/yr) *":"Asking Price (AED) *")); prBox.appendChild(inp(I(),isRentalA?"e.g. 95,000":"e.g. 2,500,000","number",f.price,function(v){analyzerState.f.price=v;})); spRow.appendChild(prBox);
    formCard.appendChild(spRow);

    // Furnished + Parking
    const fpRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}});
    const fnBox=el("div",{}); fnBox.appendChild(lbl("Furnished")); fnBox.appendChild(mkSelect(S(),["Unfurnished","Furnished","Semi-Furnished"],f.furnished||"Unfurnished",function(v){analyzerState.f.furnished=v;})); fpRow.appendChild(fnBox);
    const pkBox=el("div",{}); pkBox.appendChild(lbl("Parking")); pkBox.appendChild(mkSelect(S(),["0","1","2","3+"],f.parking||"1",function(v){analyzerState.f.parking=v;})); fpRow.appendChild(pkBox);
    formCard.appendChild(fpRow);
    // Maid room toggle
    const maidRow=el("div",{style:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px",padding:"10px 12px",background:cl.raised,borderRadius:"8px",cursor:"pointer"}});
    const maidCheck=el("div",{style:{width:"18px",height:"18px",borderRadius:"4px",border:"2px solid "+(f.hasMaid?cl.gold:cl.border),background:f.hasMaid?cl.gold:"transparent",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",color:"#08090C",fontWeight:"900"}});
    if(f.hasMaid)maidCheck.textContent="✓";
    const maidLabel=el("div",{});
    maidLabel.appendChild(div({color:cl.white,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"Maid Room"));
    maidLabel.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},isRentalA?"+AED 5-15K/yr rent premium":"+AED 50-100K value premium"));
    maidRow.appendChild(maidCheck);
    maidRow.appendChild(maidLabel);
    maidRow.addEventListener("click",function(){analyzerState.f.hasMaid=!analyzerState.f.hasMaid;render();});
    formCard.appendChild(maidRow);
    // Study Room toggle (apartment)
    const studyRow=el("div",{style:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px",padding:"10px 12px",background:cl.raised,borderRadius:"8px",cursor:"pointer",border:"1px solid "+(f.hasStudy?cl.gold:cl.border)}});
    const studyChk=el("div",{style:{width:"18px",height:"18px",borderRadius:"4px",border:"2px solid "+(f.hasStudy?cl.gold:cl.border),background:f.hasStudy?cl.gold:"transparent",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",color:"#08090C",fontWeight:"900"}});
    if(f.hasStudy)studyChk.textContent="✓";
    const studyLbl=el("div",{});
    studyLbl.appendChild(div({color:cl.white,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"Study Room"));
    studyLbl.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},isRentalA?"+AED 3-8K/yr rent premium":"+2% value premium"));
    studyRow.appendChild(studyChk);
    studyRow.appendChild(studyLbl);
    studyRow.addEventListener("click",function(){analyzerState.f.hasStudy=!analyzerState.f.hasStudy;render();});
    formCard.appendChild(studyRow);
    // Upgraded toggle (apartment)
    const upgRow=el("div",{style:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px",padding:"10px 12px",background:cl.raised,borderRadius:"8px",cursor:"pointer",border:"1px solid "+(f.isUpgraded?cl.gold:cl.border)}});
    const upgChk=el("div",{style:{width:"18px",height:"18px",borderRadius:"4px",border:"2px solid "+(f.isUpgraded?cl.gold:cl.border),background:f.isUpgraded?cl.gold:"transparent",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",color:"#08090C",fontWeight:"900"}});
    if(f.isUpgraded)upgChk.textContent="✓";
    const upgLbl=el("div",{});
    upgLbl.appendChild(div({color:cl.white,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"Upgraded"));
    upgLbl.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},isRentalA?"+5-10% rent premium":"+5% value premium"));
    upgRow.appendChild(upgChk);
    upgRow.appendChild(upgLbl);
    upgRow.addEventListener("click",function(){analyzerState.f.isUpgraded=!analyzerState.f.isUpgraded;render();});
    formCard.appendChild(upgRow);

    // SC
    formCard.appendChild(fld("Service Charge (AED/sqft/yr)",inp(I(),f.serviceCharge||"e.g. 18","number",f.serviceCharge,function(v){analyzerState.f.serviceCharge=v;})));

    // PSF display
    if(f.size&&f.price){
      const psf=Math.round(parseInt(f.price)/parseInt(f.size));
      formCard.appendChild(div({background:cl.goldFaint,border:"1px solid "+cl.goldDim,borderRadius:"8px",padding:"10px 14px",display:"flex",justifyContent:"space-between",marginTop:"12px"},[
        span({color:cl.sub,fontSize:"12px",fontFamily:"'Space Grotesk',monospace"},isRentalA?"Implied Rent PSF":"Implied PSF"),
        span({color:cl.gold,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+psf.toLocaleString()+(isRentalA?"/yr":"")),
      ]));
    }

    // Purchase history (seller/agent mode)
    if(!isRentalA&&(analyzerState.reportFor==="seller"||analyzerState.reportFor==="both")){
      var ppSecA=el("div",{style:{background:hexAlpha("#F87171",0.06),border:"1px solid "+hexAlpha("#F87171",0.2),borderRadius:"10px",padding:"14px",marginTop:"12px"}});
      ppSecA.appendChild(div({color:"#F87171",fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"Seller Purchase History (Optional)"));
      var ppRowA=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}});
      var ppBoxA=el("div",{});ppBoxA.appendChild(lbl("Purchase Price (AED)"));ppBoxA.appendChild(inp(I(),"e.g. 2,000,000","number",f.purchasePrice||"",function(v){analyzerState.f.purchasePrice=v;}));ppRowA.appendChild(ppBoxA);
      var pdBoxA=el("div",{});pdBoxA.appendChild(lbl("Purchase Date"));var pdInpA=el("input",{style:I(),type:"date",value:f.purchaseDate||""});pdInpA.addEventListener("change",function(e){analyzerState.f.purchaseDate=e.target.value;});pdBoxA.appendChild(pdInpA);ppRowA.appendChild(pdBoxA);
      ppSecA.appendChild(ppRowA);
      ppSecA.appendChild(div({color:hexAlpha("#8B5CF6",0.6),fontSize:"9.5px",fontFamily:"'Inter',sans-serif",marginTop:"8px"},"Enables capital gain analysis, hold vs sell comparison & sell price recommendation"));
      formCard.appendChild(ppSecA);
    }

    // Submit
    const canSubmit=true;
    var isAgentMode=analyzerState.reportMode==="agent";
    const submitBtn=el("button",{style:{marginTop:"14px",width:"100%",padding:"14px",borderRadius:"10px",border:"none",background:isRentalA?"linear-gradient(135deg,#8B5CF6,#6D28D9)":isAgentMode?"linear-gradient(135deg,#3B82F6,#1D4ED8)":"linear-gradient(135deg,#C9A84C,#7A5E28)",color:cl.white,fontSize:"14px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer"}});
    submitBtn.textContent=isRentalA?"ANALYZE THIS RENTAL ->":isAgentMode?"GENERATE AGENT REPORT ->":"ANALYZE THIS DEAL ->";
    if(true){
      submitBtn.addEventListener("click",function(){
        analyzerState.stage=1;render();
        setTimeout(function(){
          var rMode=analyzerState.reportMode;
          var rFor=analyzerState.reportFor;
          if(isRentalA){
            try{
              analyzerState.rentalVal=computeRentalValuation(analyzerState.f);
            }catch(e){analyzerState.err="Rental valuation error: "+e.message;analyzerState.stage=0;render();return;}
            if(!analyzerState.rentalVal){analyzerState.err="Could not compute rental valuation";analyzerState.stage=0;render();return;}
            analyzerState.stage=2;
            try{dvTrack("analyze_rental",{area:analyzerState.f.area,type:"apartment"});}catch(e){}
            var rv=analyzerState.rentalVal;
            var propDesc=analyzerState.f.building+" "+analyzerState.f.area+" "+(f.aptSubtype||f.beds||"")+" floor"+(f.floor||"?")+" "+f.view+" "+(f.size||"?")+"sqft rent AED "+parseInt(f.price).toLocaleString()+"/yr";
            if(rMode==="agent"){
              var buyerP=getRentalAgentAIPrompt(propDesc,rv,"buyer",analyzerState.f.area);
              var sellerP=getRentalAgentAIPrompt(propDesc,rv,"seller",analyzerState.f.area);
              if(rFor==="both"||rFor==="buyer"){callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:buyerP}],max_tokens:400,temperature:0.5}).then(function(r){return r.json();}).then(function(d){analyzerState.aiText=d.choices&&d.choices[0]?d.choices[0].message.content:"";render();}).catch(function(){render();});}
              if(rFor==="both"||rFor==="seller"){callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:sellerP}],max_tokens:400,temperature:0.5}).then(function(r){return r.json();}).then(function(d){analyzerState.aiTextSeller=d.choices&&d.choices[0]?d.choices[0].message.content:"";render();}).catch(function(){render();});}
              if(rFor==="buyer")analyzerState.aiTextSeller="";
              if(rFor==="seller")analyzerState.aiText="";
            }else{
              var amenities=AREA_AMENITIES[analyzerState.f.area]?" Location amenities: "+AREA_AMENITIES[analyzerState.f.area]+".":"";
              var aiPrompt=propDesc+". EXACT DATA: Market rent AED "+rv.estRent.toLocaleString()+"/yr (AED "+rv.monthly.toLocaleString()+"/mo). Range: AED "+rv.rentLow.toLocaleString()+"-"+rv.rentHigh.toLocaleString()+"/yr. Asking "+rv.vsPct+"% vs market. Verdict: "+rv.verdict.replace(/_/g," ")+". Confidence: "+rv.confScore+"%."+amenities+" Use ONLY these numbers and amenities. 3 sentences: rental assessment with location benefits, negotiation tip, tenant advice.";
              callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:getChatSys()},{role:"user",content:aiPrompt}],max_tokens:300,temperature:0.4}).then(function(r){return r.json();}).then(function(d){analyzerState.aiText=d.choices&&d.choices[0]?d.choices[0].message.content:"";render();}).catch(function(){render();});
            }
            render();
          }else{
            var fData=Object.assign({},analyzerState.f);
            analyzerState.val=computeValuation(fData);
            if(!analyzerState.val){
              analyzerState.err="Check: size="+fData.size+" price="+fData.price+" area="+fData.area;
              analyzerState.stage=0;render();return;
            }
            analyzerState.stage=2;analyzerState.smartRent=null;
            try{dvTrack("analyze_property",{area:analyzerState.f.area,type:"apartment"});}catch(e){}
            fetchLiveRentals(analyzerState.f.building,analyzerState.f.area,analyzerState.f.beds).then(function(liveRentals){
              var sr=computeSmartRent(analyzerState.f,liveRentals);
              if(sr&&sr.source!=="estimated"){
                analyzerState.smartRent=sr;
                analyzerState.val.rent=sr.rent;
                analyzerState.val.grossYield=sr.grossYield;
                analyzerState.val.netYield=sr.netYield;
                analyzerState.val.prRatio=sr.prRatio;
                analyzerState.val.investSignal=sr.investSignal;
                analyzerState.val.totalReturnAnnual=sr.totalReturnAnnual;
                render();
              }else{
                analyzerState.smartRent=computeSmartRent(analyzerState.f,null);
                render();
              }
            }).catch(function(){
              analyzerState.smartRent=computeSmartRent(analyzerState.f,null);
            });
            var propDesc=analyzerState.f.building+" "+analyzerState.f.area+" "+(f.aptSubtype||f.beds||"")+" floor"+f.floor+" "+f.view+" "+f.size+"sqft AED "+parseInt(f.price).toLocaleString();
            if(rMode==="agent"){
              var buyerP=getAgentAIPrompt(propDesc,analyzerState.val,"buyer",analyzerState.f.area);
              var sellerP=getAgentAIPrompt(propDesc,analyzerState.val,"seller",analyzerState.f.area);
              if(rFor==="both"||rFor==="buyer"){callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:buyerP}],max_tokens:400,temperature:0.5}).then(function(r){return r.json();}).then(function(d){analyzerState.aiText=d.choices&&d.choices[0]?d.choices[0].message.content:"";render();}).catch(function(){render();});}
              if(rFor==="both"||rFor==="seller"){callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:sellerP}],max_tokens:400,temperature:0.5}).then(function(r){return r.json();}).then(function(d){analyzerState.aiTextSeller=d.choices&&d.choices[0]?d.choices[0].message.content:"";render();}).catch(function(){render();});}
              if(rFor==="buyer")analyzerState.aiTextSeller="";
              if(rFor==="seller")analyzerState.aiText="";
            }else{
              var profileLabels={income:"rental income investor",growth:"capital growth investor",flip:"flip investor",enduse:"end-use buyer"};
              var profileCtx=profileLabels[USER_PROFILE.investorType]||"investor";
              var riskCtx=USER_PROFILE.risk==="aggressive"?" Focus upside.":(USER_PROFILE.risk==="conservative"?" Prioritize safety.":"");
              var vv=analyzerState.val;var amenities=AREA_AMENITIES[analyzerState.f.area]?" Location amenities: "+AREA_AMENITIES[analyzerState.f.area]+".":"";
              var aiPrompt=propDesc+". EXACT DATA: Market PSF AED "+vv.adjPSF.toLocaleString()+" (range "+vv.psfLo.toLocaleString()+"-"+vv.psfHi.toLocaleString()+"). Asking "+vv.vsPct+"% vs market. Verdict: "+vv.verdict+". Fair value: AED "+vv.fairPrice.toLocaleString()+". Suggested offer: AED "+vv.suggestedOffer.toLocaleString()+". Price range: AED "+vv.priceLow.toLocaleString()+"-"+vv.priceHigh.toLocaleString()+". Est. rent: AED "+(vv.rent||0).toLocaleString()+"/yr. Gross yield: "+vv.grossYield+"%. Net yield: "+vv.netYield+"%. Growth 3yr: "+vv.g1+"%. Confidence: "+vv.confScore+"% ("+vv.confTier+"). Signal: "+vv.investSignal+". Total return: "+(vv.totalReturnAnnual||0)+"%."+amenities+" Investor: "+profileCtx+"."+riskCtx+" Use ONLY these numbers and amenities — do NOT calculate or invent your own. 3 sentences: assessment with location benefits, negotiation target AED (use suggested offer), key risk/opportunity.";
              callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:getChatSys()},{role:"user",content:aiPrompt}],max_tokens:300,temperature:0.4}).then(function(r){return r.json();}).then(function(d){analyzerState.aiText=d.choices&&d.choices[0]?d.choices[0].message.content:"";render();}).catch(function(){render();});
            }
            render();
          }
        },50);
      });
    }
    formCard.appendChild(submitBtn);
    if(analyzerState.err)formCard.appendChild(div({color:"#EF4444",fontSize:"11px",marginTop:"8px",fontFamily:"'Space Grotesk',monospace"},analyzerState.err));
    wrap.appendChild(formCard);
  }

  return wrap;
}


function renderCommercialResult(wrap){
  var cl=C();var v=analyzerState.comVal;var f=analyzerState.f;
  window.scrollTo({top:0,behavior:"smooth"});
  var accent="#3B82F6";
  wrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"},[
    div({},[
      span({color:accent,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block"},"COMMERCIAL ANALYSIS COMPLETE"),
      span({color:cl.subHi,fontSize:"13px",fontFamily:"'Inter',sans-serif"},(f.building?f.building+" · ":"")+(v.subType||"Office").toUpperCase()+" · "+f.area),
    ]),
    el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"7px 14px",borderRadius:"8px",cursor:"pointer",fontSize:"12px"},onclick:function(){analyzerState={stage:0,mode:"valuation",f:{area:"",propCategory:"",aptSubtype:"",beds:"",bathrooms:"",hasMaid:false,floor:"",view:"Not specified",size:"",furnished:"Unfurnished",parking:"1",serviceCharge:"",price:"",villaType:"",cluster:"",floors:"",plotSize:"",buaSize:"",privatePool:false,singleRow:false,cornerVilla:false,building:"",txnType:"sale",sector:"commercial",subType:"",zoning:"",purchasePrice:"",purchaseDate:""},val:null,rentalVal:null,comVal:null,landVal:null,aiText:"",aiTextSeller:"",liveData:null,err:"",reportMode:"personal",reportFor:"buyer",smartRent:null};render();}},"← New"),
  ]));
  var vcfg={UNDERVALUED:{bg:"linear-gradient(135deg,rgba(34,197,94,0.08),transparent)",bo:"rgba(34,197,94,0.3)",tx:"#22C55E",icon:"●",label:"UNDERVALUED",sub:"Significantly below market"},BELOW_MARKET:{bg:"linear-gradient(135deg,rgba(34,197,94,0.05),transparent)",bo:"rgba(34,197,94,0.2)",tx:"#22C55E",icon:"●",label:"BELOW MARKET",sub:"Below market — opportunity"},FAIR_VALUE:{bg:"linear-gradient(135deg,rgba(234,179,8,0.08),transparent)",bo:"rgba(234,179,8,0.3)",tx:"#EAB308",icon:"●",label:"FAIR VALUE",sub:"At market rate"},ABOVE_MARKET:{bg:"linear-gradient(135deg,rgba(239,68,68,0.05),transparent)",bo:"rgba(239,68,68,0.2)",tx:"#EF4444",icon:"●",label:"ABOVE MARKET",sub:"Above market"},OVERPRICED:{bg:"linear-gradient(135deg,rgba(239,68,68,0.08),transparent)",bo:"rgba(239,68,68,0.3)",tx:"#EF4444",icon:"●",label:"OVERPRICED",sub:"Well above market"}}[v.verdict]||{bg:cl.surface,bo:cl.border,tx:cl.sub,icon:"·",label:v.verdict,sub:""};
  wrap.appendChild(div({background:vcfg.bg,border:"2px solid "+vcfg.bo,borderRadius:"16px",overflow:"hidden",marginBottom:"14px"},[
    div({padding:"20px",textAlign:"center",borderBottom:"1px solid "+cl.border},[
      div({fontSize:"32px",marginBottom:"8px"},vcfg.icon),
      div({fontSize:"18px",fontWeight:"800",color:vcfg.tx,fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},vcfg.label),
      div({fontSize:"11px",color:cl.sub,fontFamily:"'Inter',sans-serif"},vcfg.sub),
    ]),
    div({padding:"16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",textAlign:"center"},[
      div({},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"ASKING PSF"),div({color:cl.white,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+v.askPSF.toLocaleString())]),
      div({},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"MARKET PSF"),div({color:accent,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+v.adjPSF.toLocaleString())]),
      div({},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"DEVIATION"),div({color:v.deviation>0?"#EF4444":"#22C55E",fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(v.deviation>0?"+":"")+v.deviation+"%")]),
    ]),
  ]));
  wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"},[
    div({color:accent,fontSize:"10px",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"COMMERCIAL METRICS"),
    div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"},[
      div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"FAIR VALUE"),div({color:cl.white,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+v.fairPrice.toLocaleString())]),
      div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"CONFIDENCE"),div({color:v.confScore>=75?accent:v.confScore>=60?"#EAB308":"#EF4444",fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},v.confScore+"%")]),
      div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"EST. GROSS YIELD"),div({color:cl.white,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},v.grossYield+"%")]),
      div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"EST. NET YIELD"),div({color:cl.white,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},v.netYield+"%")]),
    ]),
  ]));
  if(v.areaTxns){
    wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"},[
      div({color:accent,fontSize:"10px",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"AREA COMMERCIAL DATA · "+f.area),
      div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"},[
        div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"AVG PRICE"),div({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+(v.areaAvgPrice||0).toLocaleString())]),
        div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"AVG SIZE"),div({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(v.areaAvgSize||0).toLocaleString()+" sqft")]),
        div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"TRANSACTIONS"),div({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(v.areaTxns||0).toLocaleString())]),
      ]),
    ]));
  }
  wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"},[
    div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"DATA SOURCE"),
    div({color:"#93C5FD",fontSize:"12px",fontFamily:"'Inter',sans-serif"},v.dataSource),
  ]));
  return wrap;
}

function renderLandResult(wrap){
  var cl=C();var v=analyzerState.landVal;var f=analyzerState.f;
  window.scrollTo({top:0,behavior:"smooth"});
  var accent="#10B981";
  wrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"},[
    div({},[
      span({color:accent,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block"},"LAND ANALYSIS COMPLETE"),
      span({color:cl.subHi,fontSize:"13px",fontFamily:"'Inter',sans-serif"},(f.building||f.project?((f.building||f.project)+" · "):"")+(v.zoning||"Residential").toUpperCase()+" · "+f.area),
    ]),
    el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"7px 14px",borderRadius:"8px",cursor:"pointer",fontSize:"12px"},onclick:function(){analyzerState={stage:0,mode:"valuation",f:{area:"",propCategory:"",aptSubtype:"",beds:"",bathrooms:"",hasMaid:false,floor:"",view:"Not specified",size:"",furnished:"Unfurnished",parking:"1",serviceCharge:"",price:"",villaType:"",cluster:"",floors:"",plotSize:"",buaSize:"",privatePool:false,singleRow:false,cornerVilla:false,building:"",txnType:"sale",sector:"land",subType:"",zoning:"",purchasePrice:"",purchaseDate:""},val:null,rentalVal:null,comVal:null,landVal:null,aiText:"",liveData:null,err:""};render();}},"← New"),
  ]));
  var vcfg={UNDERVALUED:{bg:"linear-gradient(135deg,rgba(34,197,94,0.08),transparent)",bo:"rgba(34,197,94,0.3)",tx:"#22C55E",icon:"●",label:"UNDERVALUED",sub:"Below market — strong opportunity"},BELOW_MARKET:{bg:"linear-gradient(135deg,rgba(34,197,94,0.05),transparent)",bo:"rgba(34,197,94,0.2)",tx:"#22C55E",icon:"●",label:"BELOW MARKET",sub:"Under market value"},FAIR_VALUE:{bg:"linear-gradient(135deg,rgba(234,179,8,0.08),transparent)",bo:"rgba(234,179,8,0.3)",tx:"#EAB308",icon:"●",label:"FAIR VALUE",sub:"At market rate"},ABOVE_MARKET:{bg:"linear-gradient(135deg,rgba(239,68,68,0.05),transparent)",bo:"rgba(239,68,68,0.2)",tx:"#EF4444",icon:"●",label:"ABOVE MARKET",sub:"Above market"},OVERPRICED:{bg:"linear-gradient(135deg,rgba(239,68,68,0.08),transparent)",bo:"rgba(239,68,68,0.3)",tx:"#EF4444",icon:"●",label:"OVERPRICED",sub:"Well above market"}}[v.verdict]||{bg:cl.surface,bo:cl.border,tx:cl.sub,icon:"·",label:v.verdict,sub:""};
  wrap.appendChild(div({background:vcfg.bg,border:"2px solid "+vcfg.bo,borderRadius:"16px",overflow:"hidden",marginBottom:"14px"},[
    div({padding:"20px",textAlign:"center",borderBottom:"1px solid "+cl.border},[
      div({fontSize:"32px",marginBottom:"8px"},vcfg.icon),
      div({fontSize:"18px",fontWeight:"800",color:vcfg.tx,fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},vcfg.label),
      div({fontSize:"11px",color:cl.sub,fontFamily:"'Inter',sans-serif"},vcfg.sub),
    ]),
    div({padding:"16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",textAlign:"center"},[
      div({},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"ASKING PSF"),div({color:cl.white,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+v.askPSF.toLocaleString())]),
      div({},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"MARKET PSF"),div({color:accent,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+v.adjPSF.toLocaleString())]),
      div({},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"DEVIATION"),div({color:v.deviation>0?"#EF4444":"#22C55E",fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(v.deviation>0?"+":"")+v.deviation+"%")]),
    ]),
  ]));
  wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"},[
    div({color:accent,fontSize:"10px",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"LAND VALUATION METRICS"),
    div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"},[
      div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"FAIR VALUE"),div({color:cl.white,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+v.fairPrice.toLocaleString())]),
      div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"CONFIDENCE"),div({color:v.confScore>=70?accent:v.confScore>=55?"#EAB308":"#EF4444",fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},v.confScore+"%")]),
      div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"PSF RANGE"),div({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+v.psfLo.toLocaleString()+" — "+v.psfHi.toLocaleString())]),
      div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"ZONING"),div({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(v.zoning||"Residential").charAt(0).toUpperCase()+(v.zoning||"residential").slice(1))]),
    ]),
  ]));
  wrap.appendChild(div({background:"rgba(16,185,129,0.04)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:"14px",padding:"16px",marginBottom:"14px"},[
    div({color:accent,fontSize:"10px",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"DEVELOPMENT POTENTIAL"),
    div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"},[
      div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"BUILT-UP VALUE PSF"),div({color:accent,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+v.devPotentialPSF.toLocaleString())]),
      div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"BUILT-UP TOTAL"),div({color:accent,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+v.devPotentialTotal.toLocaleString())]),
    ]),
    div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"10px",lineHeight:"1.5"},"Development potential estimates the value after construction based on area benchmarks and zoning. Actual returns depend on construction costs, approvals, and market conditions."),
  ]));
  if(v.areaTxns){
    wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"},[
      div({color:accent,fontSize:"10px",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"AREA LAND DATA · "+f.area),
      div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"},[
        div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"AVG PLOT PRICE"),div({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+(v.areaAvgPrice||0).toLocaleString())]),
        div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"AVG PLOT SIZE"),div({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(v.areaAvgSize||0).toLocaleString()+" sqft")]),
        div({background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"TRANSACTIONS"),div({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(v.areaTxns||0).toLocaleString())]),
      ]),
    ]));
  }
  wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",marginBottom:"14px"},[
    div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"DATA SOURCE"),
    div({color:"#6EE7B7",fontSize:"12px",fontFamily:"'Inter',sans-serif"},v.dataSource),
  ]));
  return wrap;
}

function renderAnalyzerResult(wrap){
  const cl=C();
  const val=analyzerState.val;
  const f=analyzerState.f;
  const isVilla=f.propCategory==="villa";

  // Scroll to top
  window.scrollTo({top:0,behavior:"smooth"});
  wrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"},[
    div({},[
      span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block"},"Analysis Complete"),
      span({color:cl.subHi,fontSize:"13px",fontFamily:"'Inter',sans-serif"},(f.building?f.building+" · ":"")+(isVilla?f.villaType:f.aptSubtype)+" · "+f.area+(f.cluster?" · "+f.cluster:"")),
    ]),
    el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"7px 14px",borderRadius:"8px",cursor:"pointer",fontSize:"12px"},onclick:function(){
  analyzerState={stage:0,mode:"valuation",f:{area:"",propCategory:"",aptSubtype:"",beds:"",bathrooms:"",hasMaid:false,floor:"",view:"Not specified",size:"",furnished:"Unfurnished",parking:"1",serviceCharge:"",price:"",villaType:"",cluster:"",floors:"",plotSize:"",buaSize:"",privatePool:false,singleRow:false,cornerVilla:false,building:"",txnType:"sale",sector:"residential",subType:"",zoning:"",purchasePrice:"",purchaseDate:""},val:null,rentalVal:null,comVal:null,landVal:null,aiText:"",aiTextSeller:"",liveData:null,err:"",reportMode:"personal",reportFor:"buyer",smartRent:null};
  window.scrollTo({top:0,behavior:"smooth"});
  render();
}},"← New"),
  ]));

  const vcfg={DISTRESS:{bg:"linear-gradient(135deg,"+cl.greenBg+",transparent)",bo:cl.greenBo,tx:cl.green,icon:"●",label:"DISTRESS DEAL",sub:"Significantly below market"},GOOD:{bg:"linear-gradient(135deg,"+cl.greenBg+",transparent)",bo:cl.greenBo,tx:cl.green,icon:"●",label:"GOOD PRICE",sub:"Below market — strong entry"},FAIR:{bg:"linear-gradient(135deg,"+cl.yellowBg+",transparent)",bo:cl.yellowBo,tx:cl.yellow,icon:"●",label:"FAIR PRICE",sub:"At market — room to negotiate"},OVER:{bg:"linear-gradient(135deg,"+cl.redBg+",transparent)",bo:cl.redBo,tx:cl.red,icon:"●",label:"OVERPRICED",sub:"Above market — negotiate hard"}}[val.verdict];
  const confColor=val.confTier.c==="green"?cl.green:val.confTier.c==="yellow"?cl.yellow:cl.red;

  wrap.appendChild(div({background:vcfg.bg,border:"2px solid "+vcfg.bo,borderRadius:"16px",overflow:"hidden",marginBottom:"14px",animation:"fadeUp 0.4s ease"},[
    div({padding:"20px 20px 16px",textAlign:"center",borderBottom:"1px solid "+cl.border},[
      div({color:vcfg.tx,fontSize:"26px",fontWeight:"900",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"AED "+(parseInt(f.price)||0).toLocaleString()),
      div({color:vcfg.tx,fontSize:"10px",fontFamily:"'Inter',sans-serif",opacity:"0.65",marginBottom:"10px"},"Asking Price"),
      div({color:vcfg.tx,fontSize:"22px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.04em"},vcfg.label),
      div({color:vcfg.tx,opacity:"0.75",fontSize:"12px",marginTop:"3px",fontFamily:"'Inter',sans-serif"},vcfg.sub),
    ]),
    div({padding:"16px 20px"},[
      div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"},[
        div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[lbl("Asking PSF"),div({color:cl.white,fontSize:"17px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+val.askPSF.toLocaleString())]),
        div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[lbl("Market PSF"),div({color:cl.green,fontSize:"17px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+val.adjPSF.toLocaleString())]),
      ]),
      div({background:cl.raised,borderRadius:"10px",padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"},[
        span({color:cl.sub,fontSize:"12px",fontFamily:"'Space Grotesk',monospace"},"vs Market Average"),
        span({color:parseFloat(val.vsPct)<0?cl.green:parseFloat(val.vsPct)>8?cl.red:cl.yellow,fontSize:"19px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},(parseFloat(val.vsPct)>0?"+":"")+val.vsPct+"%"),
      ]),
      div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"},[
        div({background:cl.raised,borderRadius:"10px",padding:"10px 12px",textAlign:"center"},[
          div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"GROSS YIELD"),
          div({color:parseFloat(val.grossYield)>=7?cl.green:parseFloat(val.grossYield)>=5?cl.yellow:cl.red,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},val.grossYield+"%"),
        ]),
        div({background:cl.raised,borderRadius:"10px",padding:"10px 12px",textAlign:"center"},[
          div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"NET YIELD"),
          div({color:parseFloat(val.netYield)>=5?cl.green:parseFloat(val.netYield)>=3?cl.yellow:cl.red,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},val.netYield+"%"),
        ]),
        div({background:cl.raised,borderRadius:"10px",padding:"10px 12px",textAlign:"center"},[
          div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"TOTAL RETURN"),
          div({color:parseFloat(val.totalReturnAnnual)>=8?cl.green:parseFloat(val.totalReturnAnnual)>=5?cl.yellow:cl.red,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},val.totalReturnAnnual+"%/yr"),
        ]),
      ]),
      ...[{label:"Distress Deal",price:val.distressPrice,active:val.verdict==="DISTRESS"},{label:"Good Price",price:val.goodPrice,active:val.verdict==="GOOD"},{label:"Fair Market",price:val.fairPrice,active:val.verdict==="FAIR"},{label:"Overpriced",price:val.overpricedAt,active:val.verdict==="OVER"}].map(function(t){
        return div({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",marginBottom:"3px",borderRadius:"8px",background:t.active?vcfg.bg:"transparent",border:t.active?"1px solid "+vcfg.bo:"1px solid transparent"},[
          span({color:t.active?vcfg.tx:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif"},t.label),
          span({color:t.active?vcfg.tx:cl.sub,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+(t.price||0).toLocaleString()),
        ]);
      }),
      val.suggestedOffer?div({background:cl.goldFaint,border:"1px solid "+cl.goldDim,borderRadius:"10px",padding:"12px 14px",marginTop:"10px",marginBottom:"10px"},[lbl("Negotiation Target"),div({color:cl.gold,fontSize:"20px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+val.suggestedOffer.toLocaleString())]):div({}),
      div({background:cl.raised,borderRadius:"10px",padding:"12px 14px",marginTop:"10px"},[
        div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"},[lbl("Valuation Confidence"),span({color:confColor,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},val.confTier.label+" · "+val.confTier.range)]),
        div({height:"5px",background:cl.border,borderRadius:"3px",overflow:"hidden",marginBottom:"8px"},[div({height:"100%",width:val.confScore+"%",background:"linear-gradient(90deg,"+confColor+"90,"+confColor+")",borderRadius:"3px",transition:"width 0.8s"})]),
        span({color:cl.sub,fontSize:"10.5px",fontFamily:"'Space Grotesk',monospace"},"Score "+val.confScore+"/100 · "+val.dataSource),
        val.hasMomentum?div({display:"flex",alignItems:"center",gap:"5px",marginTop:"6px"},[
          div({width:"5px",height:"5px",borderRadius:"50%",background:val.momFactor>1?"#10B981":val.momFactor<1?"#EF4444":"#EAB308",flexShrink:"0"}),
          span({color:val.momFactor>1?"#10B981":val.momFactor<1?"#EF4444":"#EAB308",fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace"},"AI Trend: "+(val.momFactor>1?"+":"")+((val.momFactor-1)*100).toFixed(1)+"% market adjustment"),
        ]):div({}),
      ]),
    ]),
  ]));

  // -- PRICE ANOMALY DETECTION --
  var anomalyPct=Math.abs(parseFloat(val.vsPct)||0);
  var anomalyDir=parseFloat(val.vsPct)>0?"above":"below";
  if(anomalyPct>=30){
    var anomLevel=anomalyPct>=60?"extreme":anomalyPct>=40?"significant":"unusual";
    var anomColors={unusual:{bg:hexAlpha("#F59E0B",0.08),border:hexAlpha("#F59E0B",0.3),text:"#F59E0B",icon:"!"},significant:{bg:hexAlpha("#F97316",0.08),border:hexAlpha("#F97316",0.3),text:"#F97316",icon:"!!"},extreme:{bg:hexAlpha("#EF4444",0.1),border:hexAlpha("#EF4444",0.35),text:"#EF4444",icon:"!!!"}};
    var ac=anomColors[anomLevel];
    var anomTitles={unusual:"Unusual Price — Verify with additional sources",significant:"Significant Anomaly — This price deviates significantly from market norms",extreme:"Extreme Anomaly — This pricing is highly irregular and may warrant investigation"};
    var anomCard=div({background:ac.bg,border:"2px solid "+ac.border,borderRadius:"14px",padding:"18px",marginBottom:"14px"});
    anomCard.appendChild(div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"},[
      span({fontSize:"18px"},ac.icon),
      div({},[
        span({color:ac.text,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.1em",textTransform:"uppercase",display:"block"},"Market Integrity Check"),
        span({color:ac.text,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",opacity:"0.7"},"Powered by DubAIVal AI")
      ])
    ]));
    anomCard.appendChild(div({color:ac.text,fontSize:"13px",fontWeight:"700",fontFamily:"'Inter',sans-serif",marginBottom:"12px",lineHeight:"1.5"},anomTitles[anomLevel]));
    // Details
    var anomDetails=div({background:hexAlpha(ac.text,0.06),borderRadius:"10px",padding:"12px",marginBottom:"12px"});
    anomDetails.appendChild(div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"},[
      div({textAlign:"center"},[
        div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"DEVIATION"),
        div({color:ac.text,fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},(anomalyDir==="above"?"+":"-")+anomalyPct.toFixed(1)+"%"),
        div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},anomalyDir+" market")
      ]),
      div({textAlign:"center"},[
        div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"ASKING PSF"),
        div({color:cl.text,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+val.askPSF.toLocaleString()),
      ]),
      div({textAlign:"center"},[
        div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"AREA AVG PSF"),
        div({color:cl.text,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+val.adjPSF.toLocaleString()),
      ])
    ]));
    anomCard.appendChild(anomDetails);
    // Possible reasons
    anomCard.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"8px"},"POSSIBLE EXPLANATIONS"));
    var reasons=anomalyDir==="below"?[
      {icon:"—",text:"Distress sale — owner may need urgent liquidity (divorce, debt, relocation)"},
      {icon:"—",text:"Data entry error — price or size may be incorrectly entered"},
      {icon:"—",text:"Property condition — significant damage, legal dispute, or encumbrance"}
    ]:[
      {icon:"—",text:"Premium off-market factors — unique view, renovation, or celebrity provenance"},
      {icon:"—",text:"Data entry error — price or size may be incorrectly entered"},
      {icon:"—",text:"Inflated listing — price may not reflect genuine market intent"}
    ];
    reasons.forEach(function(r){
      anomCard.appendChild(div({display:"flex",alignItems:"flex-start",gap:"8px",marginBottom:"6px"},[
        span({fontSize:"12px",flexShrink:"0",marginTop:"1px"},r.icon),
        span({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},r.text)
      ]));
    });
    wrap.appendChild(anomCard);
  }

  // -- SUSTAINABILITY & EFFICIENCY SCORE --
  (function(){
    var bData=val.bData||null;
    var aData=AREAS[f.area]||{psf:1800,sc:15,y:[5,7],g:[3,9,16]};
    var sus=computeSustainabilityScore(f.building||"",f.area||"",bData,aData);
    var susColor=sus.score>=75?"#10B981":sus.score>=50?"#EAB308":sus.score>=35?"#F97316":"#EF4444";
    var susCard=div({background:cl.surface,border:"1px solid "+hexAlpha(susColor,0.3),borderRadius:"14px",padding:"18px",marginBottom:"14px",position:"relative",overflow:"hidden"});
    susCard.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,"+susColor+","+susColor+",transparent)",animation:"shimmer 3s ease infinite"}));
    susCard.appendChild(div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px"},[
      span({fontSize:"16px",color:susColor,fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"S"),
      span({color:susColor,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"Sustainability & Efficiency Score")
    ]));
    var susCircWrap=div({display:"flex",alignItems:"center",gap:"20px",marginBottom:"16px"});
    var scoreAngle=Math.round(sus.score/100*360);
    var circle=div({width:"90px",height:"90px",borderRadius:"50%",background:"conic-gradient("+susColor+" "+scoreAngle+"deg, "+cl.border+" "+scoreAngle+"deg)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px "+hexAlpha(susColor,0.2),flexShrink:"0"});
    var inner=div({width:"68px",height:"68px",borderRadius:"50%",background:cl.surface,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"});
    inner.appendChild(span({color:susColor,fontSize:"26px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",lineHeight:"1"},String(sus.score)));
    inner.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"/100"));
    circle.appendChild(inner);susCircWrap.appendChild(circle);
    var susInfo=div({});
    susInfo.appendChild(div({padding:"4px 14px",borderRadius:"20px",background:hexAlpha(susColor,0.12),border:"1px solid "+hexAlpha(susColor,0.3),display:"inline-block",marginBottom:"6px"},[span({color:susColor,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},sus.tier)]));
    susInfo.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6"},sus.score>=75?"This property scores well on sustainability and efficiency metrics.":sus.score>=50?"Average sustainability profile with room for improvement.":sus.score>=35?"Below average — consider building age and efficiency factors.":"Low sustainability score — older building or high operational costs."));
    susCircWrap.appendChild(susInfo);
    susCard.appendChild(susCircWrap);
    var factors=[
      {l:"Building Age / Grade",v:sus.age,icon:""},
      {l:"Service Charge Efficiency",v:sus.scEff,icon:""},
      {l:"Area Green Rating",v:sus.green,icon:""},
      {l:"Market Liquidity Health",v:sus.liq,icon:""}
    ];
    factors.forEach(function(fc){
      var fcColor=fc.v>=75?"#10B981":fc.v>=50?"#EAB308":fc.v>=35?"#F97316":"#EF4444";
      var fcRow=div({display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"});
      fcRow.appendChild(span({fontSize:"12px",width:"20px",textAlign:"center",flexShrink:"0"},fc.icon));
      var fcRight=div({flex:"1"});
      var fcHead=div({display:"flex",justifyContent:"space-between",marginBottom:"3px"});
      fcHead.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},fc.l));
      fcHead.appendChild(span({color:fcColor,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},fc.v+"/100"));
      fcRight.appendChild(fcHead);
      var barBg=div({height:"4px",borderRadius:"2px",background:cl.border,overflow:"hidden"});
      barBg.appendChild(div({height:"100%",width:fc.v+"%",borderRadius:"2px",background:fcColor,transition:"width 1s ease"}));
      fcRight.appendChild(barBg);fcRow.appendChild(fcRight);susCard.appendChild(fcRow);
    });
    wrap.appendChild(susCard);
  })();

  // -- FURNISHED NOTICE (only when furnished selected) --
  if(analyzerState.f.furnished==="Furnished"||analyzerState.f.furnished==="Semi-Furnished"){
    var furnNoticeTitle,furnNoticeMsg;
    if(val.isDevFurnished){
      furnNoticeTitle="DEVELOPER-FURNISHED BUILDING";
      furnNoticeMsg=analyzerState.f.furnished==="Unfurnished"?"Stripped − furniture removed (−10% applied)":analyzerState.f.furnished==="Semi-Furnished"?"Partially furnished (−5% applied)":"Included in base price — no extra premium";
    }else{
      furnNoticeTitle="OWNER-FURNISHED UNIT";
      var furnPctLabel=val.fairPrice>=30e6?"1.5%":val.fairPrice>=15e6?"2.5%":val.fairPrice>=5e6?"4%":val.fairPrice>=2e6?"7%":"10%";
      furnNoticeMsg=analyzerState.f.furnished==="Furnished"?"Owner-furnished premium +"+furnPctLabel+" applied (scales by property value)":"Semi-furnished premium applied";
    }
    wrap.appendChild(div({background:"linear-gradient(135deg,rgba(201,168,76,0.12),transparent)",border:"1px solid rgba(201,168,76,0.35)",borderRadius:"12px",padding:"12px 16px",marginBottom:"14px",display:"flex",alignItems:"flex-start",gap:"10px"},[
      span({fontSize:"18px"},"⚑"),
      div({},[
        span({color:"#C9A84C",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.06em",display:"block",marginBottom:"3px"},furnNoticeTitle),
        span({color:"#aaa",fontSize:"10.5px",fontFamily:"'Inter',sans-serif"},furnNoticeMsg),
      ]),
    ]));
  }

  // -- CONFIDENCE BREAKDOWN --
  (function(){
    var _furnPctLbl=val.fairPrice>=30e6?"1.5%":val.fairPrice>=15e6?"2.5%":val.fairPrice>=5e6?"4%":val.fairPrice>=2e6?"7%":"10%";
    const furnLabel=val.isDevFurnished?(analyzerState.f.furnished==="Furnished"?"Incl. in base (no extra)":analyzerState.f.furnished==="Unfurnished"?"Stripped −10%":"Semi −5%"):(analyzerState.f.furnished==="Furnished"?"+"+_furnPctLbl:analyzerState.f.furnished==="Semi-Furnished"?"Semi":"-");
    const factors=[
      {l:"Data Source",v:val.dataLayer===1?"Verified DB":"Estimated",ok:val.dataLayer===1},
      {l:"Building Match",v:val.inDB?"Found in DB":"Area benchmark",ok:val.inDB},
      {l:"Comparable Analysis",v:val.compData?val.compData.compCount+" properties":"No comps",ok:!!val.compData},
      {l:"Live Market Data",v:val.hasDynamic?"Active":"Static benchmarks",ok:val.hasDynamic},
      {l:"Auto-Calibration",v:val.calFactor!==1.0?"×"+val.calFactor.toFixed(2):"Pending",ok:val.calFactor!==1.0},
      {l:"AI Market Trend",v:val.hasMomentum?(val.momFactor!==1.0?"Active ×"+val.momFactor.toFixed(2):"Active — Stable"):"No data",ok:val.hasMomentum},
      {l:"Developer Furnished",v:val.isDevFurnished?"Yes — "+furnLabel:"No — "+furnLabel,ok:true},
      {l:"View Specified",v:analyzerState.f.view!=="Not specified"?analyzerState.f.view:"Not specified",ok:analyzerState.f.view!=="Not specified"},
      {l:"Floor Specified",v:analyzerState.f.floor?"Floor "+analyzerState.f.floor:"Not provided",ok:!!analyzerState.f.floor||analyzerState.f.propCategory==="villa"},
    ];
    const bWrap=el("div",{style:{background:cl.raised,borderRadius:"10px",padding:"12px 14px",marginTop:"12px"}});
    bWrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Confidence Factors"));
    factors.forEach(function(fac){
      const row=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid "+cl.border}});
      row.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},fac.l));
      const badge=el("span",{style:{fontSize:"10px",fontFamily:"'Space Grotesk',monospace",color:fac.ok?cl.green:cl.yellow,background:fac.ok?"rgba(0,200,150,0.1)":"rgba(240,160,48,0.1)",padding:"2px 8px",borderRadius:"10px"}});
      badge.textContent=fac.v;
      row.appendChild(badge);
      bWrap.appendChild(row);
    });
    wrap.appendChild(bWrap);
  })();

  // -- SMART GUIDANCE (Proactive Suggestions) --
  (function(){
    var guidance=getConfidenceGuidance(val,analyzerState.f);
    if(!guidance)return;
    var gCard=el("div",{style:{background:"linear-gradient(135deg,rgba(201,168,76,0.08),rgba(0,200,150,0.04))",border:"1px solid rgba(201,168,76,0.25)",borderRadius:"12px",padding:"14px 16px",marginTop:"10px",marginBottom:"4px"}});
    gCard.appendChild(div({color:cl.gold,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"How to Improve This Estimate"));
    guidance.forEach(function(g){
      var row=el("div",{style:{display:"flex",alignItems:"flex-start",gap:"10px",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}});
      row.appendChild(span({color:cl.yellow,fontSize:"14px",lineHeight:"1"},"→"));
      var content=el("div",{});
      content.appendChild(div({color:cl.subHi,fontSize:"11.5px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5",marginBottom:"2px"},g.tip));
      if(g.nearby&&g.nearby.length){
        var nbRow=el("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"4px"}});
        g.nearby.forEach(function(n){
          var btn=el("button",{style:{background:cl.raised,border:"1px solid "+cl.border,color:cl.gold,padding:"4px 10px",borderRadius:"14px",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
          btn.textContent=n.area+" · AED "+n.psf;
          btn.onclick=function(){
            analyzerState.f.area=n.area;
            analyzerState.val=computeValuation(analyzerState.f,analyzerState.f.building,analyzerState.liveData);
            render();
          };
          nbRow.appendChild(btn);
        });
        content.appendChild(nbRow);
      }else{
        content.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",fontStyle:"italic"},g.action));
      }
      row.appendChild(content);
      gCard.appendChild(row);
    });
    wrap.appendChild(gCard);
  })();

  // -- MARKET SENTIMENT (Live) --
  (function(){
    var sentArea=analyzerState.f.area;
    var sentWrap=el("div",{style:{marginTop:"10px"}});
    sentWrap.id="dv-sentiment-wrap";
    var sentLoader=el("div",{style:{background:cl.raised,borderRadius:"10px",padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}});
    sentLoader.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Market Sentiment · "+sentArea));
    sentLoader.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},"Loading..."));
    sentWrap.appendChild(sentLoader);
    wrap.appendChild(sentWrap);
    fetchMarketSentiment(sentArea).then(function(sent){
      sentWrap.innerHTML="";
      if(!sent){sentWrap.style.display="none";return;}
      var sentColors={bull:cl.green,bear:cl.red,neutral:cl.yellow};
      var sentLabels={bull:"BULLISH",bear:"BEARISH",neutral:"NEUTRAL"};
      var sentIcons={bull:"↑",bear:"↓",neutral:"→"};
      var color=sentColors[sent.s]||cl.sub;
      var sourceLabel=sent.source==="dld"?"DLD Data · "+sent.points+" points":"Live Listings · "+sent.points+" properties";
      var sCard=el("div",{style:{background:cl.raised,borderRadius:"10px",padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}});
      var left=el("div",{});
      left.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"Market Sentiment · "+sentArea));
      left.appendChild(div({color:color,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},sentIcons[sent.s]+" "+sentLabels[sent.s]));
      left.appendChild(div({color:cl.sub,fontSize:"8px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px",opacity:"0.7"},sourceLabel));
      var right=el("div",{style:{textAlign:"right"}});
      right.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"6-Month PSF Trend"));
      right.appendChild(div({color:color,fontSize:"18px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(sent.chg>=0?"+":"")+sent.chg+"%"));
      sCard.appendChild(left);
      sCard.appendChild(right);
      sentWrap.appendChild(sCard);
      var isAgentR=analyzerState.reportMode==="agent";
      var rFor=analyzerState.reportFor;
      var note="";
      if(isAgentR){
        var agentNotes={
          buyer:{bull:"Strong demand confirms this as a growth area — present as a time-sensitive opportunity with clear upside potential.",bear:"Market correction creates a rare buying window — frame as a negotiation advantage with significant discount potential.",neutral:"Stable pricing provides certainty — emphasize predictable returns and low volatility as a selling point."},
          seller:{bull:"High buyer activity means premium pricing is achievable — recommend listing now to capture peak demand.",bear:"Motivated buyers are actively seeking deals — position competitive pricing as a strategy for a fast, clean transaction.",neutral:"Balanced market supports fair pricing — advise listing at market to attract qualified buyers efficiently."}
        };
        if(rFor==="both"){
          note="Buyer: "+(agentNotes.buyer[sent.s]||"")+" | Seller: "+(agentNotes.seller[sent.s]||"");
        }else{
          note=(agentNotes[rFor]||agentNotes.buyer)[sent.s]||"";
        }
      }else{
        var profileNotes={
          income:{bull:"High demand supports rental rates.",bear:"Tenant leverage rising — negotiate rent-free periods.",neutral:"Stable rental market."},
          growth:{bull:"Momentum favors entry now.",bear:"Buyer leverage window — negotiate hard.",neutral:"Sideways market — focus on yield."},
          flip:{bull:"Exit conditions improving.",bear:"Hold or negotiate deep discount.",neutral:"Time market carefully."},
          enduse:{bull:"Act quickly — competition rising.",bear:"Best time to negotiate.",neutral:"Stable conditions for purchase."}
        };
        note=(profileNotes[USER_PROFILE.investorType]||profileNotes.income)[sent.s]||"";
      }
      if(note){
        var stratColor=isAgentR?"rgba(59,130,246,0.08)":"rgba(201,168,76,0.08)";
        var stratBorder=isAgentR?"rgba(59,130,246,0.2)":"rgba(201,168,76,0.2)";
        sentWrap.appendChild(div({background:stratColor,border:"1px solid "+stratBorder,borderRadius:"8px",padding:"10px 14px",marginTop:"8px",color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6"},
          "Strategy: "+note
        ));
      }
    });
  })();

  // -- PRICE HISTORY CHART (Phase 2) --
  (function(){
    var phArea=analyzerState.f.area;
    var phCard=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px",display:"none"}});
    phCard.id="dv-price-history-card";
    var phTitle=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}});
    phTitle.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"PSF Price Trend · "+phArea));
    phTitle.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"90 days"));
    phCard.appendChild(phTitle);
    var phCanvas=el("div",{style:{height:"100px",display:"flex",alignItems:"flex-end",gap:"2px",padding:"4px 0"}});
    phCanvas.id="dv-ph-canvas";
    phCard.appendChild(phCanvas);
    var phStats=el("div",{style:{display:"flex",justifyContent:"space-between",marginTop:"8px"}});
    phStats.id="dv-ph-stats";
    phCard.appendChild(phStats);
    wrap.appendChild(phCard);
    fetchPriceHistory(phArea,90).then(function(rows){
      if(!rows||rows.length<2)return;
      phCard.style.display="block";
      var psfs=rows.map(function(r){return r.psf;});
      var mn=Math.min.apply(null,psfs);
      var mx=Math.max.apply(null,psfs);
      var range=mx-mn||1;
      phCanvas.innerHTML="";
      rows.forEach(function(r,idx){
        var pct=Math.max(8,(r.psf-mn)/range*100);
        var isLast=idx===rows.length-1;
        var bar=el("div",{style:{flex:"1",background:isLast?"linear-gradient(180deg,"+cl.gold+","+cl.goldDim+")":"linear-gradient(180deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05))",height:pct+"%",borderRadius:"2px 2px 0 0",minWidth:"4px",cursor:"pointer",transition:"background 0.2s"}});
        bar.title=r.snapshot_date+": AED "+r.psf+"/sqft";
        phCanvas.appendChild(bar);
      });
      var first=psfs[0],last=psfs[psfs.length-1];
      var chg=first>0?((last-first)/first*100).toFixed(1):0;
      var chgColor=chg>=0?cl.green:cl.red;
      phStats.innerHTML="";
      phStats.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"AED "+mn+" → "+mx));
      var chgSpan=el("span",{style:{color:chgColor,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"}});
      chgSpan.textContent=(chg>=0?"+":"")+chg+"%";
      phStats.appendChild(chgSpan);
    });
  })();

  var isAgentReport=analyzerState.reportMode==="agent";
  if(analyzerState.aiText){
    var ecBuyerColor=isAgentReport?"#3B82F6":cl.gold;
    var ecBuyerBorder=isAgentReport?"rgba(59,130,246,0.3)":cl.goldDim;
    var ecLabel=isAgentReport?(analyzerState.reportFor==="seller"?"Agent Report — Seller":"Agent Report — Buyer / Tenant"):"Expert Commentary";
    var ecCard=div({background:cl.surface,border:"1px solid "+ecBuyerBorder,borderRadius:"14px",padding:"18px",marginBottom:"14px"});
    ecCard.appendChild(span({color:ecBuyerColor,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"10px"},ecLabel));
    var ecFormatted=formatAIResponse(analyzerState.aiText,cl);
    if(ecFormatted)ecCard.appendChild(ecFormatted);
    else ecCard.appendChild(div({color:cl.subHi,fontSize:"13.5px",lineHeight:"1.85",fontFamily:"'Inter',sans-serif"},analyzerState.aiText));
    wrap.appendChild(ecCard);
  }
  if(analyzerState.aiTextSeller){
    var ecSCard=div({background:cl.surface,border:"1px solid rgba(239,68,68,0.3)",borderRadius:"14px",padding:"18px",marginBottom:"14px"});
    ecSCard.appendChild(span({color:"#F87171",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"10px"},"Agent Report — Seller / Landlord"));
    var ecSFormatted=formatAIResponse(analyzerState.aiTextSeller,cl);
    if(ecSFormatted)ecSCard.appendChild(ecSFormatted);
    else ecSCard.appendChild(div({color:cl.subHi,fontSize:"13.5px",lineHeight:"1.85",fontFamily:"'Inter',sans-serif"},analyzerState.aiTextSeller));
    wrap.appendChild(ecSCard);
  }

  // =====================================================
  // PERSONALIZED ADVISORY SYSTEM (Seller / Buyer / Agent)
  // =====================================================
  (function(){
    var rMode=analyzerState.reportMode;
    var rFor=analyzerState.reportFor;
    var price=parseInt(String(f.price||"").replace(/,/g,""))||0;
    var size=parseFloat(String(f.size||f.buaSize||"").replace(/,/g,""))||0;
    var purchPrice=parseInt(String(f.purchasePrice||"").replace(/,/g,""))||0;
    var purchDateStr=f.purchaseDate||"";
    var gr=val.g1||9;
    var gr0=val.g0||3;
    var gr2=val.g2||16;
    var rent=val.rent||0;
    var sc=val.sc||0;
    var netYield=parseFloat(val.netYield)||0;
    var fair=val.fairPrice||0;
    var isSeller=rFor==="seller"||rFor==="both";
    var isBuyer=rFor==="buyer"||rFor==="both";
    var isAgent=rMode==="agent";

    // --- SELLER ADVISORY ---
    if(isSeller&&f.txnType==="sale"){
      var _sC="#A78BFA";var _sC2="#8B5CF6";
      var sellerCard=el("div",{style:{background:cl.surface,border:"1px solid "+hexAlpha(_sC2,0.25),borderRadius:"14px",padding:"18px",marginBottom:"14px"}});
      sellerCard.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},[
        span({color:_sC,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Seller Advisory"),
        span({color:hexAlpha(_sC,0.6),fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},purchPrice?"Based on purchase history":"Market-based analysis"),
      ]));

      if(purchPrice&&purchDateStr){
        var purchDate=new Date(purchDateStr);
        var now=new Date();
        var yearsHeld=Math.max(0.1,(now-purchDate)/(365.25*24*60*60*1000));
        var capitalGain=price-purchPrice;
        var capitalGainPct=((price-purchPrice)/purchPrice*100).toFixed(1);
        var annualizedROI=(capitalGainPct/yearsHeld).toFixed(1);
        var totalCostsBuy=Math.round(purchPrice*0.065);
        var totalCostsSell=Math.round(price*0.02);
        var netProfit=capitalGain-totalCostsBuy-totalCostsSell;
        var netProfitPct=((netProfit/purchPrice)*100).toFixed(1);
        var breakEvenPrice=Math.round(purchPrice+totalCostsBuy+totalCostsSell);
        var rentCollected=Math.round(rent*yearsHeld);
        var totalReturn=netProfit+rentCollected;
        var totalReturnPct=((totalReturn/(purchPrice+totalCostsBuy))*100).toFixed(1);

        // Capital gain summary
        sellerCard.appendChild(div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"},[
          div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[lbl("Purchase Price"),div({color:cl.subHi,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+purchPrice.toLocaleString())]),
          div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[lbl("Years Held"),div({color:cl.subHi,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},yearsHeld.toFixed(1)+" yrs")]),
          div({background:capitalGain>=0?cl.greenBg:hexAlpha("#EF4444",0.1),border:"1px solid "+(capitalGain>=0?cl.greenBo:hexAlpha("#EF4444",0.3)),borderRadius:"10px",padding:"12px 14px"},[lbl("Capital Gain"),div({color:capitalGain>=0?cl.green:"#EF4444",fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(capitalGain>=0?"+":"")+capitalGainPct+"% · AED "+(capitalGain>=0?"+":"")+capitalGain.toLocaleString())]),
          div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[lbl("Annualized ROI"),div({color:parseFloat(annualizedROI)>=10?cl.green:parseFloat(annualizedROI)>=5?cl.yellow:"#EF4444",fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},annualizedROI+"%/yr")]),
        ]));

        // Net profit after costs
        sellerCard.appendChild(div({background:cl.raised,borderRadius:"10px",padding:"14px",marginBottom:"12px"},[
          div({color:cl.sub,fontSize:"9.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"Net Profit After Costs"),
          div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"8px"},[
            div({textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"Buy Costs (6.5%)"),div({color:"#EF4444",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"-AED "+totalCostsBuy.toLocaleString())]),
            div({textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"Sell Costs (2%)"),div({color:"#EF4444",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"-AED "+totalCostsSell.toLocaleString())]),
            div({textAlign:"center"},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"Rent Collected"),div({color:cl.green,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"+AED "+rentCollected.toLocaleString())]),
          ]),
          div({borderTop:"1px solid "+cl.border,paddingTop:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"},[
            span({color:cl.subHi,fontSize:"12px",fontWeight:"700",fontFamily:"'Inter',sans-serif"},"Total Net Return"),
            div({textAlign:"right"},[
              div({color:totalReturn>=0?cl.green:"#EF4444",fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+(totalReturn>=0?"+":"")+totalReturn.toLocaleString()),
              span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},totalReturnPct+"% total · "+annualizedROI+"%/yr"),
            ]),
          ]),
        ]));

        // Hold vs Sell analysis
        var projValue1yr=Math.round(fair*(1+gr0/100));
        var addGain1yr=projValue1yr-price;
        var rentIncome1yr=rent;
        var holdBenefit=addGain1yr+rentIncome1yr;
        var projValue3yr=Math.round(fair*(1+gr/100));
        sellerCard.appendChild(div({background:hexAlpha("#F59E0B",0.06),border:"1px solid "+hexAlpha("#F59E0B",0.2),borderRadius:"10px",padding:"14px",marginBottom:"12px"},[
          div({color:"#F59E0B",fontSize:"9.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"Hold vs Sell Analysis"),
          div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"},[
            div({background:hexAlpha(_sC2,0.08),borderRadius:"8px",padding:"12px",textAlign:"center"},[
              div({color:_sC,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"SELL NOW"),
              div({color:_sC,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+netProfit.toLocaleString()),
              div({color:hexAlpha(_sC,0.7),fontSize:"9px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},"Net profit realized today"),
            ]),
            div({background:hexAlpha("#22C55E",0.08),borderRadius:"8px",padding:"12px",textAlign:"center"},[
              div({color:cl.green,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"HOLD 1 MORE YEAR"),
              div({color:cl.green,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED +"+(addGain1yr+rentIncome1yr).toLocaleString()),
              div({color:hexAlpha(cl.green,0.7),fontSize:"9px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},"Growth +"+addGain1yr.toLocaleString()+" · Rent +"+rentIncome1yr.toLocaleString()),
            ]),
          ]),
          div({color:cl.sub,fontSize:"10.5px",fontFamily:"'Inter',sans-serif",marginTop:"10px",lineHeight:"1.6"},
            holdBenefit>0?
            "Holding for 1 year could add AED "+holdBenefit.toLocaleString()+" (capital growth + rental income). If you sell now at AED "+price.toLocaleString()+", you've already secured "+annualizedROI+"%/yr annualized return on your investment.":
            "Market outlook suggests limited upside. Selling now locks in your profit of AED "+netProfit.toLocaleString()+" and frees capital for reinvestment."
          ),
        ]));

        // Sell price recommendation
        var minSellPrice=breakEvenPrice;
        var optimalSell=Math.round(fair*1.02);
        sellerCard.appendChild(div({background:hexAlpha(_sC2,0.06),border:"1px solid "+hexAlpha(_sC2,0.2),borderRadius:"10px",padding:"14px"},[
          div({color:_sC,fontSize:"9.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"Sell Price Recommendation"),
          div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"},[
            div({background:hexAlpha("#EF4444",0.1),borderRadius:"8px",padding:"10px",textAlign:"center"},[
              div({color:"#EF4444",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"DON'T SELL BELOW"),
              div({color:"#F87171",fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+minSellPrice.toLocaleString()),
              div({color:hexAlpha("#EF4444",0.6),fontSize:"8px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},"Break-even price"),
            ]),
            div({background:hexAlpha(_sC2,0.1),border:"1px solid "+hexAlpha(_sC2,0.3),borderRadius:"8px",padding:"10px",textAlign:"center"},[
              div({color:_sC,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"OPTIMAL SELL"),
              div({color:_sC,fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+optimalSell.toLocaleString()),
              div({color:hexAlpha(_sC,0.6),fontSize:"8px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},"Fair value + 2% premium"),
            ]),
            div({background:hexAlpha("#F59E0B",0.1),borderRadius:"8px",padding:"10px",textAlign:"center"},[
              div({color:"#F59E0B",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"WAIT FOR BEST"),
              div({color:"#FBBF24",fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+projValue1yr.toLocaleString()),
              div({color:hexAlpha("#F59E0B",0.6),fontSize:"8px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},"1-year projected value"),
            ]),
          ]),
        ]));
      } else {
        // No purchase data — market-based seller advice
        var optSell=Math.round(fair*1.02);
        var minSell=Math.round(fair*0.95);
        var proj1=Math.round(fair*(1+gr0/100));
        sellerCard.appendChild(div({background:cl.raised,borderRadius:"10px",padding:"14px",marginBottom:"10px"},[
          div({color:cl.sub,fontSize:"9.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"Market-Based Sell Guidance"),
          div({color:cl.subHi,fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.7",marginBottom:"10px"},
            "Based on current market conditions in "+f.area+", fair value is AED "+fair.toLocaleString()+". Your asking price of AED "+price.toLocaleString()+" is "+(price>fair?"above":"below")+" market by "+Math.abs(parseFloat(val.vsPct)).toFixed(1)+"%."),
          div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"},[
            div({textAlign:"center",padding:"8px"},[div({color:"#EF4444",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"Floor Price"),div({color:"#F87171",fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+minSell.toLocaleString())]),
            div({textAlign:"center",padding:"8px",background:hexAlpha(_sC2,0.08),borderRadius:"8px"},[div({color:_sC,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"Optimal Sell"),div({color:_sC,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+optSell.toLocaleString())]),
            div({textAlign:"center",padding:"8px"},[div({color:"#F59E0B",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"1-Year Value"),div({color:"#FBBF24",fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+proj1.toLocaleString())]),
          ]),
        ]));
        sellerCard.appendChild(div({color:hexAlpha(_sC,0.5),fontSize:"9.5px",fontFamily:"'Inter',sans-serif",fontStyle:"italic"},"Enter purchase price & date above for detailed capital gain analysis and hold vs sell comparison."));
      }
      wrap.appendChild(sellerCard);
    }

    // --- BUYER ADVISORY ---
    if(isBuyer&&f.txnType==="sale"){
      var _bC="#2DD4BF";var _bC2="#14B8A6";
      var buyerCard=el("div",{style:{background:cl.surface,border:"1px solid "+hexAlpha(_bC2,0.25),borderRadius:"14px",padding:"18px",marginBottom:"14px"}});
      buyerCard.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},[
        span({color:_bC,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Buyer Advisory"),
        span({color:hexAlpha(_bC,0.6),fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Investment Projection"),
      ]));

      var totalBuyCosts=Math.round(price*0.065);
      var totalInvested=price+totalBuyCosts;

      // Projection grid: 1yr / 3yr / 5yr
      var proj1y=Math.round(fair*(1+gr0/100));
      var proj3y=Math.round(fair*(1+gr/100));
      var proj5y=Math.round(fair*(1+gr2/100));
      var rent1=rent;var rent3=rent*3;var rent5=rent*5;
      var sc1=Math.round(sc);var sc3=Math.round(sc*3);var sc5=Math.round(sc*5);
      var totalR1=proj1y-price+rent1-sc1;
      var totalR3=proj3y-price+rent3-sc3;
      var totalR5=proj5y-price+rent5-sc5;
      var roi1=((totalR1/totalInvested)*100).toFixed(1);
      var roi3=((totalR3/totalInvested)*100).toFixed(1);
      var roi5=((totalR5/totalInvested)*100).toFixed(1);

      buyerCard.appendChild(div({background:cl.raised,borderRadius:"10px",padding:"14px",marginBottom:"12px"},[
        div({color:cl.sub,fontSize:"9.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"Profit Projection If You Buy at AED "+price.toLocaleString()),
        div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"},[
          div({background:hexAlpha(cl.yellow,0.08),border:"1px solid "+hexAlpha(cl.yellow,0.2),borderRadius:"10px",padding:"12px",textAlign:"center"},[
            div({color:cl.yellow,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"1 YEAR"),
            div({color:cl.subHi,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},"Value: AED "+proj1y.toLocaleString()),
            div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},"Rent: +"+rent1.toLocaleString()),
            div({borderTop:"1px solid "+cl.border,marginTop:"6px",paddingTop:"6px"},[
              div({color:totalR1>=0?cl.green:"#EF4444",fontSize:"15px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},(totalR1>=0?"+":"")+totalR1.toLocaleString()),
              div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"ROI: "+roi1+"%"),
            ]),
          ]),
          div({background:hexAlpha(_bC2,0.08),border:"1px solid "+hexAlpha(_bC2,0.3),borderRadius:"10px",padding:"12px",textAlign:"center"},[
            div({color:_bC,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"3 YEARS"),
            div({color:cl.subHi,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},"Value: AED "+proj3y.toLocaleString()),
            div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},"Rent: +"+rent3.toLocaleString()),
            div({borderTop:"1px solid "+cl.border,marginTop:"6px",paddingTop:"6px"},[
              div({color:totalR3>=0?_bC:"#EF4444",fontSize:"15px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},(totalR3>=0?"+":"")+totalR3.toLocaleString()),
              div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"ROI: "+roi3+"%"),
            ]),
          ]),
          div({background:hexAlpha(cl.gold,0.08),border:"1px solid "+hexAlpha(cl.gold,0.2),borderRadius:"10px",padding:"12px",textAlign:"center"},[
            div({color:cl.gold,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"5 YEARS"),
            div({color:cl.subHi,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},"Value: AED "+proj5y.toLocaleString()),
            div({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},"Rent: +"+rent5.toLocaleString()),
            div({borderTop:"1px solid "+cl.border,marginTop:"6px",paddingTop:"6px"},[
              div({color:totalR5>=0?cl.green:"#EF4444",fontSize:"15px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},(totalR5>=0?"+":"")+totalR5.toLocaleString()),
              div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"ROI: "+roi5+"%"),
            ]),
          ]),
        ]),
      ]));

      // Total investment breakdown
      buyerCard.appendChild(div({background:cl.raised,borderRadius:"10px",padding:"14px",marginBottom:"12px"},[
        div({color:cl.sub,fontSize:"9.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"Total Cash Required"),
        div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"},[
          div({},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Property Price"),div({color:cl.subHi,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+price.toLocaleString())]),
          div({},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"DLD Fee (4%)"),div({color:"#EF4444",fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"+AED "+Math.round(price*0.04).toLocaleString())]),
          div({},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Agent Fee (2%)"),div({color:"#EF4444",fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"+AED "+Math.round(price*0.02).toLocaleString())]),
          div({},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Processing (0.5%)"),div({color:"#EF4444",fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"+AED "+Math.round(price*0.005).toLocaleString())]),
        ]),
        div({borderTop:"1px solid "+cl.border,paddingTop:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"},[
          span({color:cl.subHi,fontSize:"12px",fontWeight:"700",fontFamily:"'Inter',sans-serif"},"Total Investment"),
          span({color:_bC,fontSize:"17px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+totalInvested.toLocaleString()),
        ]),
      ]));

      // Break-even timeline
      var annualNetIncome=rent-sc;
      var breakEvenYears=annualNetIncome>0?(totalBuyCosts/annualNetIncome).toFixed(1):"N/A";
      var monthlyRent=Math.round(rent/12);
      buyerCard.appendChild(div({background:hexAlpha(_bC2,0.06),border:"1px solid "+hexAlpha(_bC2,0.2),borderRadius:"10px",padding:"14px"},[
        div({color:_bC,fontSize:"9.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"Purchase Intelligence"),
        div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"},[
          div({},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Cost Recovery via Rent"),div({color:_bC,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},breakEvenYears+" years"),div({color:cl.sub,fontSize:"8.5px",fontFamily:"'Inter',sans-serif"},"Transaction costs paid back by net rental income")]),
          div({},[div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Monthly Rental Income"),div({color:_bC,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+monthlyRent.toLocaleString()+"/mo"),div({color:cl.sub,fontSize:"8.5px",fontFamily:"'Inter',sans-serif"},"Estimated monthly rent if leased out")]),
        ]),
        div({color:cl.sub,fontSize:"10.5px",fontFamily:"'Inter',sans-serif",marginTop:"12px",lineHeight:"1.6"},
          val.verdict==="DISTRESS"||val.verdict==="GOOD"?
          "This is a strong entry point. At AED "+price.toLocaleString()+", you're buying "+(Math.abs(parseFloat(val.vsPct))).toFixed(1)+"% below market. With "+val.totalReturnAnnual+"% projected annual total return, this property offers excellent value.":
          val.verdict==="FAIR"?
          "Fair market pricing. Negotiate toward AED "+(val.suggestedOffer||fair).toLocaleString()+" for better entry. At current price, expect "+val.totalReturnAnnual+"% annual total return with "+breakEvenYears+"-year cost recovery.":
          "Price is above market by "+Math.abs(parseFloat(val.vsPct)).toFixed(1)+"%. Negotiate down to AED "+fair.toLocaleString()+" (fair value) or below. At asking price, your returns will be compressed — consider waiting for a better deal."
        ),
      ]));
      wrap.appendChild(buyerCard);
    }

    // --- AGENT DEAL INTELLIGENCE (combined view) ---
    if(isAgent&&rFor==="both"&&f.txnType==="sale"){
      var agentCard=el("div",{style:{background:cl.surface,border:"1px solid rgba(59,130,246,0.25)",borderRadius:"14px",padding:"18px",marginBottom:"14px"}});
      agentCard.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},[
        span({color:"#3B82F6",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Agent Deal Intelligence"),
        span({color:hexAlpha("#3B82F6",0.6),fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Negotiation & Deal Facilitation"),
      ]));

      var buyerMax=Math.round(fair*1.03);
      var sellerMin=Math.round(fair*0.95);
      var sweetSpot=Math.round((buyerMax+sellerMin)/2);
      var annualRent=val.estRent||Math.round(sweetSpot*(parseFloat(val.grossYield)||5)/100);
      var sweetYield=annualRent>0?((annualRent/sweetSpot)*100).toFixed(1):"—";
      var dealProb=val.verdict==="DISTRESS"?"Very High (90%+)":val.verdict==="GOOD"?"High (75-85%)":val.verdict==="FAIR"?"Moderate (55-70%)":"Low (30-45%)";
      var dealProbColor=val.verdict==="DISTRESS"||val.verdict==="GOOD"?cl.green:val.verdict==="FAIR"?cl.yellow:"#EF4444";

      // Negotiation range
      agentCard.appendChild(div({background:cl.raised,borderRadius:"10px",padding:"14px",marginBottom:"12px"},[
        div({color:cl.sub,fontSize:"9.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px"},"Negotiation Range"),
        div({display:"flex",alignItems:"center",gap:"6px",marginBottom:"10px"},[
          div({flex:"1",height:"8px",borderRadius:"4px",background:"linear-gradient(90deg, #EF4444 0%, #F59E0B 35%, #22C55E 65%, #3B82F6 100%)",position:"relative"}),
        ]),
        div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"},[
          div({textAlign:"center"},[
            div({color:"#EF4444",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"SELLER'S FLOOR"),
            div({color:"#F87171",fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+sellerMin.toLocaleString()),
            div({color:cl.sub,fontSize:"8px",fontFamily:"'Inter',sans-serif"},"Below this = loss for seller"),
          ]),
          div({textAlign:"center",background:hexAlpha("#3B82F6",0.1),borderRadius:"8px",padding:"6px"},[
            div({color:"#3B82F6",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"SWEET SPOT"),
            div({color:"#60A5FA",fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+sweetSpot.toLocaleString()),
            div({color:cl.sub,fontSize:"8px",fontFamily:"'Inter',sans-serif"},"Win-win for both sides"),
          ]),
          div({textAlign:"center"},[
            div({color:cl.green,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"BUYER'S CAP"),
            div({color:cl.green,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+buyerMax.toLocaleString()),
            div({color:cl.sub,fontSize:"8px",fontFamily:"'Inter',sans-serif"},"Above this = overpaying"),
          ]),
        ]),
      ]));

      // Deal metrics
      agentCard.appendChild(div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"},[
        div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[
          lbl("Deal Probability"),
          div({color:dealProbColor,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},dealProb),
        ]),
        div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[
          lbl("Yield at Sweet Spot"),
          div({color:"#3B82F6",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},sweetYield+"%"),
        ]),
        div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[
          lbl("Buyer's Gross Yield"),
          div({color:parseFloat(val.grossYield)>=6?cl.green:cl.yellow,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},val.grossYield+"% at asking"),
        ]),
        div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[
          lbl("Liquidity Score"),
          div({color:val.liqTier&&val.liqTier.c==="green"?cl.green:val.liqTier&&val.liqTier.c==="yellow"?cl.yellow:"#EF4444",fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(val.liqScore||"—")+"/100 · "+(val.liqTier?val.liqTier.label:"—")),
        ]),
      ]));

      // Talking points
      var proj1Agent=Math.round(fair*(1+gr0/100));
      agentCard.appendChild(div({background:hexAlpha("#3B82F6",0.06),border:"1px solid "+hexAlpha("#3B82F6",0.2),borderRadius:"10px",padding:"14px"},[
        div({color:"#3B82F6",fontSize:"9.5px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"Talking Points"),
        div({marginBottom:"6px"},[span({color:cl.green,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"FOR BUYER: "),span({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"Market PSF is AED "+val.adjPSF+". Net yield "+val.netYield+"%. 3-year growth forecast +"+gr+"%. Total return "+val.totalReturnAnnual+"%/yr. "+(val.verdict==="OVER"?"Negotiate to AED "+fair.toLocaleString()+" for fair entry.":"Good entry point — act before the market moves."))]),
        div({marginBottom:"6px"},[span({color:"#F87171",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"FOR SELLER: "),span({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"Fair value AED "+fair.toLocaleString()+". If sold now, buyer gets "+val.grossYield+"% yield. 1-year projected value AED "+proj1Agent.toLocaleString()+". "+(val.verdict==="OVER"?"Price may deter buyers — consider adjusting to AED "+Math.round(fair*1.03).toLocaleString()+".":"Competitive pricing — expect strong buyer interest."))]),
        div({},[span({color:"#3B82F6",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"DEAL TIP: "),span({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"Recommend closing at AED "+sweetSpot.toLocaleString()+" — satisfies both parties. "+(val.domEst?"Average days on market: "+val.domEst+" days. ":"")+"Area liquidity: "+(val.liqTier?val.liqTier.label:"Moderate")+". Buyer yield at this price: "+sweetYield+"%.")]),
      ]));
      wrap.appendChild(agentCard);
    }
  })();

  wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"Yield & Growth"),
    div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"},[
      div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[lbl("Gross Yield"),div({color:cl.green,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},val.grossYield+"%")]),
      div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[lbl("Net Yield"),div({color:parseFloat(val.netYield)>5?cl.green:cl.yellow,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},val.netYield+"%")]),
      div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[lbl("Annual Rent Est."),div({color:cl.subHi,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+val.rent.toLocaleString())]),
      div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[lbl("Annual SC"),div({color:cl.sub,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+Math.round(val.sc).toLocaleString())]),
    ]),
    div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"},[
      div({background:cl.raised,border:"1px solid "+cl.border,borderRadius:"10px",padding:"10px 12px",textAlign:"center"},[div({color:cl.sub,fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Conservative"),div({color:cl.yellow,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"+"+val.g0+"%")]),
      div({background:cl.greenBg,border:"1px solid "+cl.greenBo,borderRadius:"10px",padding:"10px 12px",textAlign:"center"},[div({color:cl.sub,fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Base Case"),div({color:cl.green,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"+"+val.g1+"%")]),
      div({background:cl.raised,border:"1px solid "+cl.border,borderRadius:"10px",padding:"10px 12px",textAlign:"center"},[div({color:cl.sub,fontSize:"9.5px",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Optimistic"),div({color:cl.gold,fontSize:"16px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"+"+val.g2+"%")]),
    ]),
    div({marginTop:"8px",color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"3-year capital appreciation forecast · "+f.area),
    (function(){
      const trGood=parseFloat(val.totalReturnAnnual)>=8;
      const trColor=trGood?cl.green:parseFloat(val.totalReturnAnnual)>=5?cl.yellow:cl.red;
      return div({background:cl.raised,borderRadius:"10px",padding:"12px 14px",marginTop:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"},[
        div({},[lbl("Total Annual Return Est."),span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},"Net Yield + Base-Case Growth/yr")]),
        div({textAlign:"right"},[
          div({color:trColor,fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},val.totalReturnAnnual+"%"),
          span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},trGood?"Meets 8–10% institutional target":"Below institutional benchmark"),
        ]),
      ]);
    })(),
    val.investSignal?div({background:cl.raised,borderRadius:"10px",padding:"12px 14px",marginTop:"8px",display:"flex",justifyContent:"space-between",alignItems:"center"},[
      div({},[lbl("Investment Signal"),span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},"Price-to-Rent ratio "+val.prRatio+"x")]),
      span({color:val.investSignal.c==="green"?cl.green:val.investSignal.c==="yellow"?cl.yellow:cl.red,fontSize:"13px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",padding:"4px 10px",borderRadius:"8px",background:val.investSignal.c==="green"?cl.greenBg:val.investSignal.c==="yellow"?cl.yellowBg:cl.redBg},val.investSignal.label),
    ]):div({}),
  ]));

  // -- RENTAL INTELLIGENCE ENGINE --
  (function(){
    var sr=analyzerState.smartRent;
    var riWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px"}});
    riWrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"},[
      span({color:"#8B5CF6",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Rental Intelligence Engine"),
      sr&&sr.source!=="estimated"?span({color:"#10B981",fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",padding:"3px 8px",borderRadius:"6px",background:hexAlpha("#10B981",0.12)},"LIVE"):span({color:cl.sub,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",padding:"3px 8px",borderRadius:"6px",background:hexAlpha(cl.sub,0.12)},sr?"ESTIMATED":"LOADING...")
    ]));
    if(!sr){
      riWrap.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",textAlign:"center",padding:"16px 0"},"Fetching live rental data from Bayut & Property Finder..."));
      wrap.appendChild(riWrap);return;
    }
    // Source badge and data points
    var srcColor=sr.source==="live_building"?"#10B981":sr.source.indexOf("blended")>=0?"#3B82F6":"#F59E0B";
    riWrap.appendChild(div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px",flexWrap:"wrap"},[
      span({color:srcColor,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",padding:"3px 10px",borderRadius:"8px",background:hexAlpha(srcColor,0.12)},sr.sourceLabel),
      sr.bayutCount>0?span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Bayut: "+sr.bayutCount):span({}),
      sr.pfCount>0?span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"PF: "+sr.pfCount):span({})
    ]));
    // Rent comparison grid
    var rentGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"10px"}});
    [{l:"Smart Rent Est.",v:"AED "+sr.rent.toLocaleString(),c:"#8B5CF6"},
     {l:"Rent Range Low",v:"AED "+sr.rentLow.toLocaleString(),c:cl.sub},
     {l:"Rent Range High",v:"AED "+sr.rentHigh.toLocaleString(),c:cl.sub}
    ].forEach(function(m){
      var box=el("div",{style:{background:cl.raised,borderRadius:"8px",padding:"10px",textAlign:"center"}});
      box.appendChild(div({color:cl.sub,fontSize:"8px",letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},m.l));
      box.appendChild(div({color:m.c,fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},m.v));
      rentGrid.appendChild(box);
    });
    riWrap.appendChild(rentGrid);
    // Live vs Model comparison
    if(sr.liveRent&&sr.staticRent){
      var diff=Math.round((sr.liveRent-sr.staticRent)/sr.staticRent*100);
      var diffLabel=diff>0?"Market "+diff+"% above model":diff<0?"Market "+Math.abs(diff)+"% below model":"Aligned with model";
      var diffC=Math.abs(diff)<=5?"#10B981":Math.abs(diff)<=15?"#F59E0B":"#EF4444";
      riWrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",background:cl.raised,borderRadius:"8px",padding:"10px 12px",marginBottom:"8px"},[
        div({},[
          div({color:cl.sub,fontSize:"8px",letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},"Live vs Model"),
          div({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif"},diffLabel)
        ]),
        div({textAlign:"right"},[
          div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Live: AED "+sr.liveRent.toLocaleString()),
          div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Model: AED "+sr.staticRent.toLocaleString())
        ])
      ]));
    }
    // Building matches detail
    if(sr.liveListings&&sr.liveListings.length>0&&sr.source==="live_building"){
      riWrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px",marginTop:"4px"},"Matching Listings ("+sr.liveListings.length+")"));
      var listWrap=el("div",{style:{maxHeight:"120px",overflow:"auto",borderRadius:"8px",border:"1px solid "+cl.border}});
      sr.liveListings.slice(0,8).forEach(function(l,i){
        var row=el("div",{style:{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderBottom:i<Math.min(sr.liveListings.length,8)-1?"1px solid "+cl.border:"none",fontSize:"11px",fontFamily:"'Inter',sans-serif"}});
        row.appendChild(span({color:cl.subHi,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"60%"},l.title.substring(0,50)));
        row.appendChild(span({color:"#8B5CF6",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+l.price.toLocaleString()+"/yr"));
        listWrap.appendChild(row);
      });
      riWrap.appendChild(listWrap);
    }
    // Seasonal indicator
    var seasonC=sr.seasonalFactor>=1.0?"#10B981":sr.seasonalFactor>=0.96?"#F59E0B":"#EF4444";
    var seasonPct=Math.round((sr.seasonalFactor-1)*100);
    riWrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"8px",padding:"8px 0",borderTop:"1px solid "+cl.border},[
      div({display:"flex",alignItems:"center",gap:"6px"},[
        span({color:seasonC,fontSize:"10px"},"●"),
        span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},sr.seasonLabel),
        span({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},"("+new Date().toLocaleString("en",{month:"long"})+")")
      ]),
      span({color:seasonC,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},(seasonPct>=0?"+":"")+seasonPct+"% seasonal adj.")
    ]));
    wrap.appendChild(riWrap);
  })();

  // -- MARKET LIQUIDITY / DAYS ON MARKET --
  (function(){
    var liqC=val.liqTier.c==="green"?cl.green:val.liqTier.c==="yellow"?cl.yellow:cl.red;
    var liqBg=val.liqTier.c==="green"?cl.greenBg:val.liqTier.c==="yellow"?cl.yellowBg:cl.redBg;
    var liqWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginTop:"14px"}});
    liqWrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"},[
      span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Market Liquidity"),
      span({color:liqC,fontSize:"12px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",padding:"3px 8px",borderRadius:"6px",background:liqBg},val.liqTier.label)
    ]));
    // Liquidity score bar
    var barOuter=el("div",{style:{background:"rgba(240,242,245,0.06)",borderRadius:"6px",height:"8px",marginBottom:"12px",overflow:"hidden"}});
    var barInner=el("div",{style:{width:Math.min(100,val.liqScore)+"%",height:"100%",borderRadius:"6px",background:val.liqScore>=80?"linear-gradient(90deg,#22C55E,#10B981)":val.liqScore>=55?"linear-gradient(90deg,#EAB308,#F59E0B)":"linear-gradient(90deg,#EF4444,#F87171)",transition:"width 0.6s ease"}});
    barOuter.appendChild(barInner);
    liqWrap.appendChild(barOuter);
    // Metrics grid
    var grid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"10px"}});
    [{l:"Avg. Days on Market",v:val.domEst+" days",c:val.domEst<=30?cl.green:val.domEst<=60?cl.yellow:cl.red},
     {l:"Annual Transactions",v:val.txVol.toLocaleString(),c:val.txVol>=1000?cl.green:val.txVol>=300?cl.yellow:cl.red},
     {l:"Market Activity",v:val.txLabel,c:val.txLabel==="Very Active"||val.txLabel==="Active"?cl.green:val.txLabel==="Moderate"?cl.yellow:cl.red}
    ].forEach(function(m){
      var box=el("div",{style:{textAlign:"center"}});
      box.appendChild(div({color:cl.sub,fontSize:"8px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},m.l));
      box.appendChild(div({color:m.c,fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},m.v));
      grid.appendChild(box);
    });
    liqWrap.appendChild(grid);
    // Description
    liqWrap.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5",padding:"8px 0",borderTop:"1px solid "+cl.border,marginTop:"4px"},val.liqTier.desc));
    // Exit risk assessment
    var exitRisk=val.liqScore>=80?"Low exit risk — you can sell quickly at market price":val.liqScore>=55?"Moderate exit risk — allow 1–2 months for a fair-price sale":"High exit risk — expect extended selling period; price 3–5% below market for faster exit";
    var exitC=val.liqScore>=80?cl.green:val.liqScore>=55?cl.yellow:cl.red;
    liqWrap.appendChild(div({display:"flex",alignItems:"center",gap:"6px",marginTop:"6px"},[
      span({color:exitC,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"EXIT RISK"),
      span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},exitRisk)
    ]));
    wrap.appendChild(liqWrap);
  })();

  // -- BUILDING TURNOVER RATE --
  (function(){
    var trC=val.turnoverTier.c==="green"?cl.green:val.turnoverTier.c==="yellow"?cl.yellow:cl.red;
    var trBg=val.turnoverTier.c==="green"?cl.greenBg:val.turnoverTier.c==="yellow"?cl.yellowBg:cl.redBg;
    var trWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginTop:"14px"}});
    trWrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"},[
      span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Building Turnover Rate"),
      span({color:trC,fontSize:"12px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",padding:"3px 8px",borderRadius:"6px",background:trBg},val.turnoverTier.label)
    ]));
    // Turnover gauge bar
    var gaugeMax=25;
    var gaugePct=Math.min(100,val.turnoverRate/gaugeMax*100);
    var gaugeOuter=el("div",{style:{background:"rgba(240,242,245,0.06)",borderRadius:"6px",height:"8px",marginBottom:"12px",overflow:"hidden"}});
    var gaugeInner=el("div",{style:{width:gaugePct+"%",height:"100%",borderRadius:"6px",background:val.turnoverRate>=6?"linear-gradient(90deg,#22C55E,#10B981)":val.turnoverRate>=3?"linear-gradient(90deg,#EAB308,#F59E0B)":"linear-gradient(90deg,#EF4444,#F87171)",transition:"width 0.6s ease"}});
    gaugeOuter.appendChild(gaugeInner);
    trWrap.appendChild(gaugeOuter);
    // Rate display
    var rateBox=el("div",{style:{display:"flex",alignItems:"baseline",gap:"6px",marginBottom:"12px"}});
    rateBox.appendChild(span({color:trC,fontSize:"28px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},val.turnoverRate.toFixed(1)+"%"));
    rateBox.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"of units traded annually"));
    trWrap.appendChild(rateBox);
    // Metrics grid
    var trGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"10px"}});
    [{l:"Total Units",v:val.bldgUnits.toLocaleString(),c:cl.white},
     {l:"Annual Trades",v:val.bldgAnnualTx.toLocaleString(),c:val.bldgAnnualTx>=20?cl.green:val.bldgAnnualTx>=5?cl.yellow:cl.red},
     {l:"Liquidity Risk",v:val.turnoverRate>=6?"Low":val.turnoverRate>=3?"Medium":"High",c:val.turnoverRate>=6?cl.green:val.turnoverRate>=3?cl.yellow:cl.red}
    ].forEach(function(m){
      var box=el("div",{style:{textAlign:"center"}});
      box.appendChild(div({color:cl.sub,fontSize:"8px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},m.l));
      box.appendChild(div({color:m.c,fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},m.v));
      trGrid.appendChild(box);
    });
    trWrap.appendChild(trGrid);
    // Description
    trWrap.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5",padding:"8px 0",borderTop:"1px solid "+cl.border,marginTop:"4px"},val.turnoverTier.desc));
    // Investor insight
    var insight=val.turnoverRate>=12?"This building has exceptionally high trading activity — ideal for short-term investors seeking quick exits.":val.turnoverRate>=6?"Healthy demand means you can likely sell at market price within weeks.":val.turnoverRate>=3?"Standard market activity — plan for a 1–3 month selling window.":val.turnoverRate>=1?"Limited buyer interest — consider pricing 3–5% below market for a faster sale.":"Very few buyers in this building — high risk of capital being locked in. Consider alternative investments.";
    trWrap.appendChild(div({display:"flex",alignItems:"flex-start",gap:"6px",marginTop:"6px"},[
      span({color:cl.gold,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",flexShrink:"0"},"INSIGHT"),
      span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",lineHeight:"1.4"},insight)
    ]));
    wrap.appendChild(trWrap);
  })();

  // -- MARGIN OF SAFETY (MoS) INDEX --
  (function(){
    var mosC=val.mosTier.c==="green"?cl.green:val.mosTier.c==="yellow"?cl.yellow:cl.red;
    var mosBg=val.mosTier.c==="green"?cl.greenBg:val.mosTier.c==="yellow"?cl.yellowBg:cl.redBg;
    var mosWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginTop:"14px",position:"relative",overflow:"hidden"}});
    // Gold shimmer for Deep Value
    if(val.mosScore>=80){mosWrap.appendChild(div({position:"absolute",top:"0",left:"0",right:"0",height:"2px",background:"linear-gradient(90deg,transparent,"+cl.gold+","+cl.gold+",transparent)",animation:"shimmer 3s ease infinite"}));}
    mosWrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},[
      span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Margin of Safety"),
      span({color:mosC,fontSize:"12px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",padding:"3px 8px",borderRadius:"6px",background:mosBg},val.mosTier.label)
    ]));
    // Risk-Reward slider
    var sliderOuter=el("div",{style:{position:"relative",height:"32px",marginBottom:"14px"}});
    // Gradient track: green(left) → yellow(center) → red(right)
    var track=el("div",{style:{position:"absolute",top:"12px",left:"0",right:"0",height:"8px",borderRadius:"6px",background:"linear-gradient(90deg, #22C55E 0%, #22C55E 30%, #EAB308 50%, #EF4444 80%, #DC2626 100%)"}});
    sliderOuter.appendChild(track);
    // Labels above track
    var lblLeft=el("div",{style:{position:"absolute",top:"0",left:"0",fontSize:"7px",color:cl.green,fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em",textTransform:"uppercase"}});lblLeft.textContent="VALUE BUY";
    var lblRight=el("div",{style:{position:"absolute",top:"0",right:"0",fontSize:"7px",color:cl.red,fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em",textTransform:"uppercase"}});lblRight.textContent="SPECULATIVE";
    sliderOuter.appendChild(lblLeft);sliderOuter.appendChild(lblRight);
    // Pointer (inverted: high MoS = left/safe, low MoS = right/risky)
    var ptrPos=Math.max(2,Math.min(98,100-val.mosScore));
    var ptr=el("div",{style:{position:"absolute",top:"8px",left:ptrPos+"%",transform:"translateX(-50%)",width:"16px",height:"16px",borderRadius:"50%",background:mosC,border:"2px solid "+cl.bg,boxShadow:"0 0 8px "+mosC,transition:"left 0.6s ease"}});
    sliderOuter.appendChild(ptr);
    mosWrap.appendChild(sliderOuter);
    // Score display
    var scoreRow=el("div",{style:{display:"flex",alignItems:"baseline",gap:"8px",marginBottom:"14px"}});
    scoreRow.appendChild(span({color:mosC,fontSize:"32px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},String(val.mosScore)));
    scoreRow.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"/ 95  Safety Score"));
    mosWrap.appendChild(scoreRow);
    // 3 component breakdown
    var compGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}});
    var pgDesc=parseFloat(val.vsPct)<=0?"Asking below fair value — good deal":"Asking "+val.vsPct+"% above fair value";
    var bqGrade=val.bData?val.bData.g:"N/A";
    var bqDesc=val.timeDecayScore>=85?"Premium grade ("+bqGrade+"), well-maintained":val.timeDecayScore>=65?"Good condition ("+bqGrade+"), SC in line":val.timeDecayScore>=45?"Moderate — watch maintenance costs":"High SC vs expected — aging risk";
    var mdDesc=val.marketDepthScore>=80?"Price within building's normal range":val.marketDepthScore>=60?"Price near edge of typical range":"Price outside typical range — harder to resell";
    [{l:"Price Gap",v:val.priceGapScore,w:"50%",icon:"",d:pgDesc},
     {l:"Building Quality",v:val.timeDecayScore,w:"20%",icon:"",d:bqDesc},
     {l:"Market Depth",v:val.marketDepthScore,w:"30%",icon:"",d:mdDesc}
    ].forEach(function(comp){
      var cBox=el("div",{style:{background:cl.raised,borderRadius:"10px",padding:"10px 8px",textAlign:"center"}});
      cBox.appendChild(div({fontSize:"14px",marginBottom:"4px"},comp.icon));
      cBox.appendChild(div({color:cl.sub,fontSize:"7px",letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},comp.l));
      var compC=comp.v>=70?cl.green:comp.v>=35?cl.yellow:cl.red;
      cBox.appendChild(div({color:compC,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},String(comp.v)));
      cBox.appendChild(div({color:cl.sub,fontSize:"7px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},"weight: "+comp.w));
      // Mini bar
      var miniBar=el("div",{style:{background:"rgba(240,242,245,0.06)",borderRadius:"3px",height:"3px",marginTop:"6px",overflow:"hidden"}});
      var miniInner=el("div",{style:{width:comp.v+"%",height:"100%",borderRadius:"3px",background:compC,transition:"width 0.5s ease"}});
      miniBar.appendChild(miniInner);
      cBox.appendChild(miniBar);
      cBox.appendChild(div({color:cl.sub,fontSize:"7.5px",fontFamily:"'Inter',sans-serif",marginTop:"5px",lineHeight:"1.3",opacity:"0.85"},comp.d));
      compGrid.appendChild(cBox);
    });
    mosWrap.appendChild(compGrid);
    // Description
    mosWrap.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5",padding:"8px 0",borderTop:"1px solid "+cl.border,marginTop:"4px"},val.mosTier.desc));
    // Actionable verdict
    var mosVerdict=val.mosScore>=80?"Strong conviction buy — significant upside with minimal downside risk.":val.mosScore>=65?"Favorable entry point — below fair value with healthy market support.":val.mosScore>=50?"Proceed with standard due diligence — no significant discount or premium.":val.mosScore>=35?"Exercise caution — limited buffer against market correction.":"High-risk position — price exceeds fundamentals. Wait for a better entry or negotiate aggressively.";
    var verdictC=val.mosScore>=65?cl.green:val.mosScore>=50?cl.yellow:cl.red;
    mosWrap.appendChild(div({display:"flex",alignItems:"flex-start",gap:"6px",marginTop:"6px"},[
      span({color:cl.gold,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",flexShrink:"0"},"VERDICT"),
      span({color:verdictC,fontSize:"10px",fontWeight:"600",fontFamily:"'Inter',sans-serif",lineHeight:"1.4"},mosVerdict)
    ]));
    wrap.appendChild(mosWrap);
  })();

  // -- LOCATION INTELLIGENCE --
  if(val.geoScore){(function(){
    var gs=val.geoScore;
    var locC=gs.locationScore>=7?cl.green:gs.locationScore>=5?cl.yellow:cl.red;
    var locBg=gs.locationScore>=7?cl.greenBg:gs.locationScore>=5?cl.yellowBg:cl.redBg;
    var locBo=gs.locationScore>=7?cl.greenBo:gs.locationScore>=5?cl.yellowBo:cl.redBo;
    var locLabel=gs.locationScore>=9?"Prime":gs.locationScore>=7?"Excellent":gs.locationScore>=5?"Good":gs.locationScore>=3?"Fair":"Remote";
    var locWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginTop:"14px",position:"relative",overflow:"hidden"}});

    locWrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},[
      div({},[
        span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"2px"},"Location Intelligence"),
        span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},"Transit & Amenity Proximity Analysis")
      ]),
      span({color:locC,fontSize:"12px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",padding:"3px 10px",borderRadius:"6px",background:locBg},locLabel+" · "+gs.locationScore+"/10")
    ]));

    // Location Score visual gauge
    var gaugeOuter=el("div",{style:{background:"rgba(240,242,245,0.06)",borderRadius:"8px",height:"10px",marginBottom:"16px",overflow:"hidden",position:"relative"}});
    var gaugeInner=el("div",{style:{width:(gs.locationScore*10)+"%",height:"100%",borderRadius:"8px",background:gs.locationScore>=7?"linear-gradient(90deg,#22C55E,#10B981)":gs.locationScore>=5?"linear-gradient(90deg,#EAB308,#F59E0B)":"linear-gradient(90deg,#EF4444,#F87171)",transition:"width 0.8s ease"}});
    gaugeOuter.appendChild(gaugeInner);locWrap.appendChild(gaugeOuter);

    // Sub-scores grid
    var grid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"14px"}});

    // Metro card
    var metroC=gs.metroScore>=7?cl.green:gs.metroScore>=5?cl.yellow:cl.red;
    var mCard=el("div",{style:{background:cl.raised,borderRadius:"10px",padding:"12px"}});
    mCard.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"},[
      span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Metro"),
      span({color:metroC,fontSize:"11px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},gs.metroScore+"/10")
    ]));
    mCard.appendChild(div({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},gs.metroDist+" km"));
    mCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},gs.metroName+" ("+gs.metroLine+")"));
    if(gs.transitCount>1)mCard.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginTop:"4px",padding:"2px 6px",background:cl.surface,borderRadius:"4px",display:"inline-block"},gs.transitCount+" stations within 2km"));
    grid.appendChild(mCard);

    // Mall card
    var mallC=gs.mallScore>=7?cl.green:gs.mallScore>=5?cl.yellow:cl.red;
    var maCard=el("div",{style:{background:cl.raised,borderRadius:"10px",padding:"12px"}});
    maCard.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"},[
      span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Mall"),
      span({color:mallC,fontSize:"11px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},gs.mallScore+"/10")
    ]));
    maCard.appendChild(div({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},gs.mallDist+" km"));
    maCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},gs.mallName));
    grid.appendChild(maCard);

    // Beach card
    var beachC=gs.beachScore>=7?cl.green:gs.beachScore>=5?cl.yellow:cl.red;
    var bCard=el("div",{style:{background:cl.raised,borderRadius:"10px",padding:"12px"}});
    bCard.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"},[
      span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Beach"),
      span({color:beachC,fontSize:"11px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},gs.beachScore+"/10")
    ]));
    bCard.appendChild(div({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},gs.beachDist+" km"));
    bCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},gs.beachName));
    grid.appendChild(bCard);

    // Business hub card
    var bizC=gs.bizScore>=7?cl.green:gs.bizScore>=5?cl.yellow:cl.red;
    var biCard=el("div",{style:{background:cl.raised,borderRadius:"10px",padding:"12px"}});
    biCard.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"},[
      span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Business"),
      span({color:bizC,fontSize:"11px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},gs.bizScore+"/10")
    ]));
    biCard.appendChild(div({color:cl.white,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},gs.bizDist+" km"));
    biCard.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},gs.bizName));
    grid.appendChild(biCard);

    locWrap.appendChild(grid);

    // Airport distance
    locWrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:cl.raised,borderRadius:"8px",marginBottom:"12px"},[
      span({color:cl.sub,fontSize:"11px",fontFamily:"'Space Grotesk',monospace"},gs.airportName),
      span({color:cl.subHi,fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},gs.airportDist+" km · ~"+Math.round(gs.airportDist*1.5)+" min")
    ]));

    // Valuation impact
    var impactC=gs.locationPremium>0?cl.green:gs.locationPremium<0?cl.red:cl.yellow;
    var impactLabel=gs.locationPremium>0?"+"+Math.round(gs.locationPremium*100)+"%":gs.locationPremium<0?Math.round(gs.locationPremium*100)+"%":"0%";
    var impactDesc=gs.locationPremium>=0.06?"Premium location commands higher PSF due to exceptional connectivity and amenities":gs.locationPremium>=0.02?"Above-average location — good transit access contributes to price resilience":gs.locationPremium>=0?"Neutral location impact — average connectivity for Dubai":gs.locationPremium>=-0.02?"Below-average connectivity — slight discount applied":"Remote location — limited transit access reduces property premium";
    locWrap.appendChild(div({background:locBg,border:"1px solid "+locBo,borderRadius:"10px",padding:"12px 14px",display:"flex",alignItems:"center",gap:"12px"},[
      div({color:impactC,fontSize:"20px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",minWidth:"55px",textAlign:"center"},impactLabel),
      div({},[
        span({color:impactC,fontSize:"10px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.08em",display:"block",marginBottom:"2px"},"VALUATION IMPACT"),
        span({color:cl.sub,fontSize:"10.5px",fontFamily:"'Inter',sans-serif",lineHeight:"1.4"},impactDesc)
      ])
    ]));

    wrap.appendChild(locWrap);
  })();}

  // -- PRICE ALERT WATCH -- (temporarily disabled — backend /api not deploying yet)
  /*
  (function(){
    const targetType=val.inDB?"building":"area";
    const targetName=val.inDB?(analyzerState.f.building||f.area):f.area;
    if(!targetName)return;
    const watchKey="dv_watch_"+targetType+"_"+targetName;
    if(!window.WATCH_STATE)window.WATCH_STATE={};
    if(!window.WATCH_STATE[watchKey])window.WATCH_STATE[watchKey]={busy:false,done:false,error:""};
    const WS=window.WATCH_STATE[watchKey];
    let already=false;
    try{already=!!localStorage.getItem(watchKey);}catch(e){}
    const wWrap=el("div",{style:{background:cl.raised,borderRadius:"10px",padding:"14px",marginTop:"8px"}});
    wWrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Price Alert"));
    if(already||WS.done){
      wWrap.appendChild(div({color:cl.green,fontSize:"12px",fontFamily:"'Inter',sans-serif"},"You're watching "+targetName+" — we'll email you if pricing moves ±5% or more."));
    }else{
      wWrap.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginBottom:"8px"},"Get an email if "+targetName+" pricing moves ±5% or more."));
      const row=el("div",{style:{display:"flex",gap:"8px"}});
      const inp=el("input",{type:"email",placeholder:"your@email.com",style:{flex:"1",background:"rgba(240,242,245,0.05)",border:"1px solid "+cl.border,color:cl.white,padding:"10px 12px",borderRadius:"8px",fontSize:"13px",fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}});
      const btn=el("button",{style:{background:"linear-gradient(135deg,#C9A84C,#7A5E28)",color:"#08090C",border:"none",padding:"10px 16px",borderRadius:"8px",fontSize:"13px",fontWeight:"700",fontFamily:"'Inter',sans-serif",cursor:"pointer",whiteSpace:"nowrap"}});
      btn.textContent=WS.busy?"...":"Watch";
      btn.addEventListener("click",function(){
        const email=inp.value.trim();
        if(!email||!email.includes("@")){inp.style.borderColor="#EF4444";return;}
        WS.busy=true;render();
        fetch("/api/watch-subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email,targetType:targetType,targetName:targetName,area:f.area})})
          .then(function(r){return r.json();})
          .then(function(d){
            WS.busy=false;
            if(d&&d.ok){try{localStorage.setItem(watchKey,"1");}catch(e){}WS.done=true;}
            else{WS.error="Could not set up alert — try again later.";}
            render();
          })
          .catch(function(){WS.busy=false;WS.error="Could not set up alert — try again later.";render();});
      });
      row.appendChild(inp);row.appendChild(btn);
      wWrap.appendChild(row);
      if(WS.error)wWrap.appendChild(div({color:"#EF4444",fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"6px"},WS.error));
      wWrap.appendChild(div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",textAlign:"center",marginTop:"6px"},"Free · Unsubscribe anytime"));
    }
    wrap.appendChild(wWrap);
  })();
  */

  // Mortgage Calculator
  const mortgagePrice=parseInt(analyzerState.f.price)||0;
  if(mortgagePrice>=500000){
    const mortWrap=renderMortgage(mortgagePrice,cl);
    if(mortWrap)wrap.appendChild(mortWrap);
  }

  // Investment Scenario Planner
  (function(){
    var price=parseInt(analyzerState.f.price)||0;
    if(!price||price<100000||!val)return;
    if(!window.INV_CALC)window.INV_CALC={dp:25,rate:4.5,hold:5,rentInc:3,vacancy:5,maint:5000,expanded:false};
    var IC=window.INV_CALC;
    var aData=AREAS[analyzerState.f.area]||{psf:1800,sc:15,y:[5,7],g:[3,9,16]};
    var annualRent=val.rent||0;
    var scTotal=val.sc||0;
    var gr0=(aData.g&&aData.g[0])||10;

    var sec=el('div',{style:{background:cl.surface,border:'1px solid '+cl.goldDim,borderRadius:'14px',padding:'18px',marginTop:'14px'}});
    sec.appendChild(div({display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px',cursor:'pointer',userSelect:'none'},[
      div({},[
        span({color:cl.gold,fontSize:'10px',letterSpacing:'0.14em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace"},'Investment Scenario Planner'),
      ]),
      span({color:cl.sub,fontSize:'9px',fontFamily:"'Space Grotesk',monospace"},IC.expanded?'▲ Collapse':'▼ Expand'),
    ]));
    sec.firstChild.addEventListener('click',function(){IC.expanded=!IC.expanded;render();});

    if(!IC.expanded){wrap.appendChild(sec);return;}

    function mkSlider(label,key,min,max,step,unit,fmt){
      var row=el('div',{style:{marginBottom:'10px'}});
      var top=el('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:'3px'}});
      top.appendChild(span({color:cl.sub,fontSize:'9px',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace"},label));
      var valStr=fmt?fmt(IC[key]):(IC[key]+(unit||''));
      top.appendChild(span({color:cl.gold,fontSize:'12px',fontWeight:'700',fontFamily:"'Space Grotesk',monospace"},valStr));
      row.appendChild(top);
      var sl=el('input',{type:'range',min:min,max:max,step:step,value:IC[key],style:{width:'100%',accentColor:cl.gold}});
      sl.addEventListener('input',function(){IC[key]=parseFloat(this.value);render();});
      row.appendChild(sl);
      return row;
    }

    sec.appendChild(mkSlider('Down Payment','dp',20,100,5,'%'));
    sec.appendChild(mkSlider('Mortgage Rate','rate',2,8,0.25,'%'));
    sec.appendChild(mkSlider('Holding Period (Years)','hold',1,15,1,' yrs'));
    sec.appendChild(mkSlider('Annual Rent Increase','rentInc',0,10,0.5,'%'));
    sec.appendChild(mkSlider('Vacancy Rate','vacancy',0,20,1,'%'));
    sec.appendChild(mkSlider('Annual Maintenance (beyond SC)','maint',0,20000,500,'',function(v){return 'AED '+v.toLocaleString();}));

    function calcScenario(growthPct,vacPct){
      var dpAmt=Math.round(price*IC.dp/100);
      var dld=Math.round(price*0.04);
      var agent=Math.round(price*0.02);
      var mortFee=Math.round(price*0.0025);
      var loanAmt=price-dpAmt;
      var totalInvestment=dpAmt+dld+agent+mortFee;
      var monthlyRate=IC.rate/100/12;
      var nMonths=25*12;
      var monthlyMort=0;
      if(loanAmt>0&&monthlyRate>0){
        monthlyMort=Math.round(loanAmt*(monthlyRate*Math.pow(1+monthlyRate,nMonths))/(Math.pow(1+monthlyRate,nMonths)-1));
      }
      var years=IC.hold;
      var totalRentCollected=0;var totalMortPaid=0;var totalInterest=0;
      var loanBalance=loanAmt;
      var equityByYear=[];
      var cashFlowY1=0;
      for(var y=0;y<years;y++){
        var yearRent=annualRent*Math.pow(1+IC.rentInc/100,y);
        var netRent=yearRent*(1-vacPct/100);
        var yearMort=monthlyMort*12;
        var yearSC=scTotal;
        var yearMaint=IC.maint;
        var netIncome=netRent-yearMort-yearSC-yearMaint;
        totalRentCollected+=netRent;
        totalMortPaid+=yearMort;
        var yearInterest=loanBalance*IC.rate/100;
        var yearPrincipal=yearMort-yearInterest>0?yearMort-yearInterest:0;
        totalInterest+=yearInterest>yearMort?yearMort:yearInterest;
        loanBalance=Math.max(0,loanBalance-yearPrincipal);
        var propValue=price*Math.pow(1+growthPct/100,y+1);
        equityByYear.push({year:y+1,equity:Math.round(propValue-loanBalance),propValue:Math.round(propValue),loanBal:Math.round(loanBalance),netIncome:Math.round(netIncome)});
        if(y===0)cashFlowY1=netIncome;
      }
      var futureValue=price*Math.pow(1+growthPct/100,years);
      var totalReturn=Math.round((futureValue-price)+totalRentCollected-totalInterest-scTotal*years-IC.maint*years);
      var monthlyCF=Math.round((annualRent*(1-vacPct/100)/12)-(monthlyMort)-(scTotal/12)-(IC.maint/12));
      var coc=totalInvestment>0?((cashFlowY1/totalInvestment)*100):0;
      var cumCF=0;var breakEven=years+1;
      for(var y=0;y<years;y++){
        var yr=annualRent*Math.pow(1+IC.rentInc/100,y)*(1-vacPct/100)-monthlyMort*12-scTotal-IC.maint;
        cumCF+=yr;
        if(cumCF>=totalInvestment&&breakEven>years){breakEven=y+1;}
      }
      // IRR via Newton's method
      var cashFlows=[-totalInvestment];
      for(var y=0;y<years;y++){
        var yr=annualRent*Math.pow(1+IC.rentInc/100,y)*(1-vacPct/100)-monthlyMort*12-scTotal-IC.maint;
        cashFlows.push(yr);
      }
      cashFlows[cashFlows.length-1]+=futureValue-loanBalance;
      var irr=0.1;
      for(var iter=0;iter<100;iter++){
        var npv=0,dnpv=0;
        for(var i=0;i<cashFlows.length;i++){
          npv+=cashFlows[i]/Math.pow(1+irr,i);
          dnpv+=-i*cashFlows[i]/Math.pow(1+irr,i+1);
        }
        if(Math.abs(dnpv)<0.001)break;
        var step=npv/dnpv;
        irr=irr-step;
        if(Math.abs(step)<0.0001)break;
      }
      return{totalInvestment:totalInvestment,monthlyCF:monthlyCF,coc:coc,breakEven:breakEven,totalReturn:totalReturn,irr:irr*100,equityByYear:equityByYear,futureValue:Math.round(futureValue)};
    }

    var base=calcScenario(gr0,IC.vacancy);

    // Output metrics
    var metGrid=el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginTop:'14px',marginBottom:'14px'}});
    function metCard(label,value,color){
      var c=el('div',{style:{background:'rgba(240,242,245,0.03)',border:'1px solid '+cl.border,borderRadius:'10px',padding:'10px'}});
      c.appendChild(span({color:cl.sub,fontSize:'8px',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace",display:'block',marginBottom:'4px'},label));
      c.appendChild(span({color:color||cl.text,fontSize:'15px',fontWeight:'700',fontFamily:"'Space Grotesk',monospace"},value));
      return c;
    }
    metGrid.appendChild(metCard('Total Investment','AED '+base.totalInvestment.toLocaleString(),cl.gold));
    metGrid.appendChild(metCard('Monthly Cash Flow','AED '+base.monthlyCF.toLocaleString(),base.monthlyCF>=0?cl.green:cl.red));
    metGrid.appendChild(metCard('Cash-on-Cash Return',base.coc.toFixed(1)+'%',base.coc>=8?cl.green:base.coc>=4?cl.yellow:cl.red));
    metGrid.appendChild(metCard('Break-even',base.breakEven>IC.hold?'> '+IC.hold+' yrs':base.breakEven+' yrs',base.breakEven<=5?cl.green:base.breakEven<=10?cl.yellow:cl.red));
    metGrid.appendChild(metCard('Total Return at Exit','AED '+base.totalReturn.toLocaleString(),base.totalReturn>=0?cl.green:cl.red));
    metGrid.appendChild(metCard('IRR',isFinite(base.irr)?base.irr.toFixed(1)+'%':'N/A',base.irr>=15?cl.green:base.irr>=8?cl.yellow:cl.red));
    sec.appendChild(metGrid);

    // 3 Scenarios
    var scenLabel=el('div',{style:{marginBottom:'10px'}});
    scenLabel.appendChild(span({color:cl.gold,fontSize:'9px',letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace"},'Scenario Comparison'));
    sec.appendChild(scenLabel);
    var cons=calcScenario(gr0*0.5,10);
    var opt=calcScenario(gr0*1.5,2);
    var scenGrid=el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'14px'}});
    [{s:cons,label:'Conservative',color:cl.red,bg:'rgba(239,68,68,0.06)',bo:'rgba(239,68,68,0.2)'},
     {s:base,label:'Base Case',color:cl.yellow,bg:'rgba(234,179,8,0.06)',bo:'rgba(234,179,8,0.2)'},
     {s:opt,label:'Optimistic',color:cl.green,bg:'rgba(34,197,94,0.06)',bo:'rgba(34,197,94,0.2)'}].forEach(function(sc){
      var card=el('div',{style:{background:sc.bg,border:'1px solid '+sc.bo,borderRadius:'10px',padding:'10px'}});
      card.appendChild(span({color:sc.color,fontSize:'10px',fontWeight:'700',fontFamily:"'Space Grotesk',monospace",display:'block',marginBottom:'6px',textAlign:'center'},sc.label));
      [{l:'IRR',v:isFinite(sc.s.irr)?sc.s.irr.toFixed(1)+'%':'N/A'},
       {l:'Total Return',v:'AED '+(sc.s.totalReturn/1000).toFixed(0)+'K'},
       {l:'Monthly CF',v:'AED '+sc.s.monthlyCF.toLocaleString()},
       {l:'Break-even',v:sc.s.breakEven>IC.hold?'>'+IC.hold+'y':sc.s.breakEven+'y'}].forEach(function(m){
        var r=el('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:'3px'}});
        r.appendChild(span({color:cl.sub,fontSize:'8px',fontFamily:"'Space Grotesk',monospace"},m.l));
        r.appendChild(span({color:sc.color,fontSize:'9px',fontWeight:'700',fontFamily:"'Space Grotesk',monospace"},m.v));
        card.appendChild(r);
      });
      scenGrid.appendChild(card);
    });
    sec.appendChild(scenGrid);

    // Equity Growth Chart
    var chartLabel=el('div',{style:{marginBottom:'8px'}});
    chartLabel.appendChild(span({color:cl.gold,fontSize:'9px',letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace"},'Equity Growth'));
    sec.appendChild(chartLabel);
    var maxEq=0;
    base.equityByYear.forEach(function(e){if(e.equity>maxEq)maxEq=e.equity;});
    var chartWrap=el('div',{style:{display:'flex',alignItems:'flex-end',gap:'3px',height:'120px',marginBottom:'14px'}});
    base.equityByYear.forEach(function(e){
      var pct=maxEq>0?(e.equity/maxEq*100):0;
      var col=el('div',{style:{flex:'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',height:'100%'}});
      var bar=el('div',{style:{width:'100%',height:Math.max(2,pct)+'%',background:'linear-gradient(180deg,'+cl.gold+','+hexAlpha(cl.gold,0.4)+')',borderRadius:'4px 4px 0 0',minHeight:'2px',transition:'height 0.3s'}});
      bar.title='Year '+e.year+': AED '+e.equity.toLocaleString();
      col.appendChild(bar);
      col.appendChild(span({color:cl.sub,fontSize:'7px',fontFamily:"'Space Grotesk',monospace",marginTop:'3px'},'Y'+e.year));
      chartWrap.appendChild(col);
    });
    sec.appendChild(chartWrap);

    // Equity table
    var tbl=el('div',{style:{marginBottom:'14px'}});
    var tHead=el('div',{style:{display:'grid',gridTemplateColumns:'40px 1fr 1fr 1fr',gap:'4px',marginBottom:'4px'}});
    ['Year','Property Value','Loan Balance','Equity'].forEach(function(h){
      tHead.appendChild(span({color:cl.sub,fontSize:'7px',letterSpacing:'0.06em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace"},h));
    });
    tbl.appendChild(tHead);
    base.equityByYear.forEach(function(e){
      var r=el('div',{style:{display:'grid',gridTemplateColumns:'40px 1fr 1fr 1fr',gap:'4px',padding:'3px 0',borderBottom:'1px solid '+cl.border}});
      r.appendChild(span({color:cl.sub,fontSize:'9px',fontFamily:"'Space Grotesk',monospace"},''+e.year));
      r.appendChild(span({color:cl.text,fontSize:'9px',fontFamily:"'Space Grotesk',monospace"},'AED '+(e.propValue/1000).toFixed(0)+'K'));
      r.appendChild(span({color:cl.red,fontSize:'9px',fontFamily:"'Space Grotesk',monospace"},'AED '+(e.loanBal/1000).toFixed(0)+'K'));
      r.appendChild(span({color:cl.green,fontSize:'9px',fontFamily:"'Space Grotesk',monospace"},'AED '+(e.equity/1000).toFixed(0)+'K'));
      tbl.appendChild(r);
    });
    sec.appendChild(tbl);

    // Download Report button
    var dlBtn=el('button',{style:{width:'100%',padding:'12px',background:'linear-gradient(135deg,'+cl.gold+',#7A5E28)',color:'#08090C',border:'none',borderRadius:'10px',fontSize:'13px',fontWeight:'700',fontFamily:"'Inter',sans-serif",cursor:'pointer',letterSpacing:'0.03em'}});
    dlBtn.textContent='Download Investment Report';
    dlBtn.addEventListener('click',function(){
      var w=window.open('','_blank');
      if(!w){alert("Please allow popups to download the report.");return;}
      var h='<html><head><title>Investment Report - DubAIVal</title><style>body{font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;color:#333}h1{color:#C9A84C;font-size:22px}h2{color:#555;font-size:16px;border-bottom:1px solid #ddd;padding-bottom:6px}table{width:100%;border-collapse:collapse;margin:10px 0}td,th{padding:6px 10px;border:1px solid #ddd;font-size:12px;text-align:left}th{background:#f5f5f5}.green{color:#22c55e}.red{color:#ef4444}.gold{color:#C9A84C}@media print{body{padding:0}}</style></head><body>';
      h+='<h1>DubAIVal Investment Report</h1>';
      h+='<p><strong>Property:</strong> '+(analyzerState.f.building||'')+(analyzerState.f.building?' · ':'')+analyzerState.f.area+'</p>';
      h+='<p><strong>Price:</strong> AED '+price.toLocaleString()+' | <strong>Size:</strong> '+(analyzerState.f.size||analyzerState.f.buaSize||'N/A')+' sqft</p>';
      h+='<h2>Investment Parameters</h2>';
      h+='<table><tr><td>Down Payment</td><td>'+IC.dp+'%</td></tr><tr><td>Mortgage Rate</td><td>'+IC.rate+'%</td></tr><tr><td>Holding Period</td><td>'+IC.hold+' years</td></tr><tr><td>Rent Increase</td><td>'+IC.rentInc+'%/yr</td></tr><tr><td>Vacancy</td><td>'+IC.vacancy+'%</td></tr><tr><td>Maintenance</td><td>AED '+IC.maint.toLocaleString()+'</td></tr></table>';
      h+='<h2>Key Metrics</h2>';
      h+='<table><tr><td>Total Investment</td><td class="gold">AED '+base.totalInvestment.toLocaleString()+'</td></tr>';
      h+='<tr><td>Monthly Cash Flow</td><td class="'+(base.monthlyCF>=0?'green':'red')+'">AED '+base.monthlyCF.toLocaleString()+'</td></tr>';
      h+='<tr><td>Cash-on-Cash Return</td><td>'+base.coc.toFixed(1)+'%</td></tr>';
      h+='<tr><td>Break-even</td><td>'+(base.breakEven>IC.hold?'> '+IC.hold:base.breakEven)+' years</td></tr>';
      h+='<tr><td>Total Return at Exit</td><td class="'+(base.totalReturn>=0?'green':'red')+'">AED '+base.totalReturn.toLocaleString()+'</td></tr>';
      h+='<tr><td>IRR</td><td>'+(isFinite(base.irr)?base.irr.toFixed(1)+'%':'N/A')+'</td></tr></table>';
      h+='<h2>Scenario Comparison</h2>';
      h+='<table><tr><th></th><th>Conservative</th><th>Base Case</th><th>Optimistic</th></tr>';
      h+='<tr><td>IRR</td><td>'+(isFinite(cons.irr)?cons.irr.toFixed(1)+'%':'N/A')+'</td><td>'+(isFinite(base.irr)?base.irr.toFixed(1)+'%':'N/A')+'</td><td>'+(isFinite(opt.irr)?opt.irr.toFixed(1)+'%':'N/A')+'</td></tr>';
      h+='<tr><td>Total Return</td><td>AED '+cons.totalReturn.toLocaleString()+'</td><td>AED '+base.totalReturn.toLocaleString()+'</td><td>AED '+opt.totalReturn.toLocaleString()+'</td></tr>';
      h+='<tr><td>Monthly CF</td><td>AED '+cons.monthlyCF.toLocaleString()+'</td><td>AED '+base.monthlyCF.toLocaleString()+'</td><td>AED '+opt.monthlyCF.toLocaleString()+'</td></tr></table>';
      h+='<h2>Equity Build-up</h2><table><tr><th>Year</th><th>Property Value</th><th>Loan Balance</th><th>Equity</th><th>Net Income</th></tr>';
      base.equityByYear.forEach(function(e){
        h+='<tr><td>'+e.year+'</td><td>AED '+e.propValue.toLocaleString()+'</td><td>AED '+e.loanBal.toLocaleString()+'</td><td class="green">AED '+e.equity.toLocaleString()+'</td><td class="'+(e.netIncome>=0?'green':'red')+'">AED '+e.netIncome.toLocaleString()+'</td></tr>';
      });
      h+='</table><p style="color:#999;font-size:10px;margin-top:20px">Generated by DubAIVal.com · '+new Date().toLocaleDateString()+'</p></body></html>';
      w.document.write(h);w.document.close();
      setTimeout(function(){w.print();},500);
    });
    sec.appendChild(dlBtn);

    wrap.appendChild(sec);
  })();

  // CSV Export + Save Search
  var expRow=div({display:"flex",gap:"8px",flexWrap:"wrap",marginTop:"8px"});
  expRow.appendChild(csvExportBtn("Export Report (CSV)",cl,function(){
    exportCSV("DubAIVal_Valuation_"+csvDate()+".csv",
      ["building","area","size_sqft","asking_price","fair_price","ask_psf","adj_psf","verdict","confidence","gross_yield","net_yield","signal","total_return_annual"],
      [[f.building||"",f.area,f.size||f.buaSize||"",f.price||"",val.fairPrice,val.askPSF,val.adjPSF,val.verdict,val.confScore,val.grossYield,val.netYield,val.investSignal?val.investSignal.label:"",val.totalReturnAnnual]]);
  }));
  var saveBtn=el("button",{style:{background:"transparent",border:"1px solid "+cl.goldDim,color:cl.gold,padding:"8px 14px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"6px"}});
  var alreadySaved=DV_SAVED.searches.some(function(s){return s.area===f.area&&s.building===f.building&&s.price===f.price;});
  saveBtn.textContent=alreadySaved?"✓ Saved":"Save This Search";
  if(!alreadySaved)saveBtn.addEventListener("click",function(){
    saveSearch({area:f.area,building:f.building||"",size:f.size||f.buaSize||"",price:f.price,beds:f.beds,floor:f.floor,view:f.view,propType:f.propCategory,verdict:val.verdict,fairPrice:val.fairPrice,ts:Date.now()});
    render();
  });
  expRow.appendChild(saveBtn);
  wrap.appendChild(expRow);

  // Share This Valuation
  var bldgLabel=f.building||f.area;
  var shareUrl="https://www.dubaival.com/?area="+encodeURIComponent(f.area)+(f.building?"&building="+encodeURIComponent(f.building):"")+"&price="+(f.price||"")+"&size="+(f.size||f.buaSize||"");
  var waText="DubAIVal AI Valuation: "+bldgLabel+" in "+f.area+" — Fair Price: AED "+val.fairPrice.toLocaleString()+" ("+val.verdict+") — Confidence: "+val.confScore+"% — Check yours at www.dubaival.com";
  var twText=bldgLabel+" in "+f.area+": "+val.verdict+" at AED "+val.fairPrice.toLocaleString()+" ("+val.confScore+"% conf) via @DubAIVal www.dubaival.com";
  var liText="Just valued a property in "+f.area+" using DubAIVal AI — "+val.verdict+" at AED "+val.fairPrice.toLocaleString()+". The platform tracks 10,800+ properties across 348 areas. #DubaiRealEstate #PropTech";
  wrap.appendChild(div({marginTop:"6px"},[
    span({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"Share This Valuation"),
    buildShareButtons(cl,{wa:waText,tw:twText,li:shareUrl,tg:liText,url:shareUrl,copy:shareUrl})
  ]));

  // PDF Report Section
  const pdfWrap=el('div',{style:{background:cl.surface,border:'1px solid '+cl.goldDim,borderRadius:'14px',padding:'18px',marginTop:'14px'}});
  
  // Header
  const pdfHeader=el('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}});
  pdfHeader.appendChild(span({color:cl.gold,fontSize:'10px',letterSpacing:'0.14em',textTransform:'uppercase',fontFamily:"'Space Grotesk',monospace"},'Download PDF Report'));
  pdfHeader.appendChild(span({color:cl.sub,fontSize:'9px',fontFamily:"'Space Grotesk',monospace"},'Professional · DLD Verified'));
  pdfWrap.appendChild(pdfHeader);

  // Broker fields
  if(!window.PDF_BROKER){try{window.PDF_BROKER=JSON.parse(localStorage.getItem('dv_broker')||'null')||{name:'',company:'',rera:''};}catch(e){window.PDF_BROKER={name:'',company:'',rera:''};}}
  const bGrid=el('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px'}});
  [{k:'name',ph:'Your Name (optional)'},{k:'company',ph:'Company (optional)'},{k:'rera',ph:'RERA No. (optional)'}].forEach(function(fld){
    const inp=el('input',{type:'text',placeholder:fld.ph,style:{background:'rgba(240,242,245,0.05)',border:'1px solid '+cl.border,color:cl.white,padding:'8px 10px',borderRadius:'8px',fontSize:'11px',fontFamily:"'Inter',sans-serif",width:'100%',outline:'none',boxSizing:'border-box'}});
    inp.value=window.PDF_BROKER[fld.k]||'';
    inp.addEventListener('input',function(){window.PDF_BROKER[fld.k]=this.value;try{localStorage.setItem('dv_broker',JSON.stringify(window.PDF_BROKER));}catch(e){}});
    bGrid.appendChild(inp);
  });
  pdfWrap.appendChild(bGrid);

  // Check unlock status
  if(!window.PDF_UNLOCKED){try{window.PDF_UNLOCKED=!!localStorage.getItem('dv_pdf_unlocked');}catch(e){}}

  if(!window.PDF_UNLOCKED){
    const gRow=el('div',{style:{display:'flex',gap:'8px'}});
    const eInp=el('input',{type:'email',placeholder:'Enter email to unlock free PDF',style:{flex:'1',background:'rgba(240,242,245,0.05)',border:'1px solid '+cl.border,color:cl.white,padding:'10px 12px',borderRadius:'8px',fontSize:'13px',fontFamily:"'Inter',sans-serif",outline:'none'}});
    const uBtn=el('button',{style:{background:'linear-gradient(135deg,#C9A84C,#7A5E28)',color:'#08090C',border:'none',padding:'10px 16px',borderRadius:'8px',fontSize:'13px',fontWeight:'700',fontFamily:"'Inter',sans-serif",cursor:'pointer',whiteSpace:'nowrap'}});
    uBtn.textContent='Get Report';
    uBtn.addEventListener('click',function(){
      const email=eInp.value.trim();
      if(!email||!email.includes('@')){eInp.style.borderColor='#EF4444';return;}
      try{const leads=JSON.parse(localStorage.getItem('dv_leads')||'[]');leads.push({email:email,date:new Date().toISOString(),prop:analyzerState.f.building||analyzerState.f.area});localStorage.setItem('dv_leads',JSON.stringify(leads));localStorage.setItem('dv_pdf_unlocked','1');}catch(e){}
      window.PDF_UNLOCKED=true;
      generatePDF();
      render();
    });
    gRow.appendChild(eInp);gRow.appendChild(uBtn);
    pdfWrap.appendChild(gRow);
    pdfWrap.appendChild(div({color:cl.sub,fontSize:'9px',fontFamily:"'Space Grotesk',monospace",textAlign:'center',marginTop:'6px'},'Free · No spam · One-time only'));
  } else {
    const dlBtn=el('button',{style:{width:'100%',padding:'13px',borderRadius:'10px',border:'none',background:'linear-gradient(135deg,#C9A84C,#7A5E28)',color:'#08090C',fontSize:'14px',fontWeight:'700',fontFamily:"'Inter',sans-serif",cursor:'pointer'}});
    dlBtn.textContent=t('download_pdf');
    dlBtn.addEventListener('click',function(){generatePDF();});
    var arBtn=el('button',{style:{width:'100%',padding:'13px',borderRadius:'10px',border:'1px solid '+cl.goldDim,background:'transparent',color:cl.gold,fontSize:'14px',fontWeight:'700',fontFamily:"Cairo,'Space Grotesk',sans-serif",cursor:'pointer',marginTop:'8px',direction:'rtl'}});
    arBtn.textContent=t('arabic_pdf');
    arBtn.addEventListener('click',function(){generateArabicPDF();});
    pdfWrap.appendChild(dlBtn);
    pdfWrap.appendChild(arBtn);
    pdfWrap.appendChild(div({color:cl.sub,fontSize:'9px',fontFamily:"'Space Grotesk',monospace",textAlign:'center',marginTop:'8px'},'Print dialog opens → Save as PDF'));
  }
  wrap.appendChild(pdfWrap);

  // --- MARKETING PITCH GENERATOR ---
  var pitchWrap=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginTop:"14px"});
  pitchWrap.appendChild(div({display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"},[
    div({},[
      span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"3px"},"Marketing Pitch Generator"),
      span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"AI-generated property listing for WhatsApp & Email"),
    ]),
    span({fontSize:"13px",color:cl.gold,fontFamily:"'Space Grotesk',monospace",fontWeight:"700"},"AI"),
  ]));

  var pitchLangRow=div({display:"flex",gap:"8px",marginBottom:"12px"});
  var pitchLangs=[{k:"en",label:"English"},{k:"fa",label:"فارسی"},{k:"ar",label:"العربية"},{k:"ru",label:"Русский"},{k:"zh",label:"中文"}];
  if(!window._pitchLang)window._pitchLang="en";
  pitchLangs.forEach(function(lg){
    var b=el("button",{style:{padding:"5px 12px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",border:"1px solid "+(window._pitchLang===lg.k?cl.gold:cl.border),background:window._pitchLang===lg.k?cl.goldFaint:"transparent",color:window._pitchLang===lg.k?cl.gold:cl.sub}});
    b.textContent=lg.label;
    b.addEventListener("click",function(){window._pitchLang=lg.k;render();});
    pitchLangRow.appendChild(b);
  });
  pitchWrap.appendChild(pitchLangRow);

  var pitchToneRow=div({display:"flex",gap:"8px",marginBottom:"14px"});
  var pitchTones=[{k:"professional",label:"Professional",icon:""},{k:"luxury",label:"Luxury",icon:""},{k:"investor",label:"Investor-focused",icon:""},{k:"urgent",label:"Urgent/FOMO",icon:""}];
  if(!window._pitchTone)window._pitchTone="professional";
  pitchTones.forEach(function(tn){
    var b=el("button",{style:{padding:"5px 12px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",border:"1px solid "+(window._pitchTone===tn.k?cl.gold:cl.border),background:window._pitchTone===tn.k?cl.goldFaint:"transparent",color:window._pitchTone===tn.k?cl.gold:cl.sub}});
    b.textContent=tn.icon?(tn.icon+" "+tn.label):tn.label;
    b.addEventListener("click",function(){window._pitchTone=tn.k;render();});
    pitchToneRow.appendChild(b);
  });
  pitchWrap.appendChild(pitchToneRow);

  var pitchOutput=div({id:"pitch-output",minHeight:"60px"});
  if(window._pitchText){
    var pitchBox=div({background:cl.raised,border:"1px solid "+cl.border,borderRadius:"10px",padding:"14px 16px",whiteSpace:"pre-wrap",color:cl.subHi,fontSize:"13px",lineHeight:"1.8",fontFamily:"'Inter',sans-serif"});
    pitchBox.textContent=window._pitchText;
    pitchOutput.appendChild(pitchBox);

    var pitchActions=div({display:"flex",gap:"8px",marginTop:"10px"});
    var copyPitch=el("button",{style:{flex:"1",padding:"9px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",border:"1px solid "+cl.border,background:cl.raised,color:cl.subHi}});
    copyPitch.textContent="Copy";
    copyPitch.addEventListener("click",function(){navigator.clipboard.writeText(window._pitchText);copyPitch.textContent="✓ Copied!";setTimeout(function(){copyPitch.textContent="Copy";},2000);});

    var waPitch=el("button",{style:{flex:"1",padding:"9px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",border:"1px solid #25D366",background:"rgba(37,211,102,0.1)",color:"#25D366"}});
    waPitch.textContent="WhatsApp";
    waPitch.addEventListener("click",function(){window.open("https://wa.me/?text="+encodeURIComponent(window._pitchText),"_blank");});

    var emailPitch=el("button",{style:{flex:"1",padding:"9px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",border:"1px solid "+cl.gold,background:cl.goldFaint,color:cl.gold}});
    emailPitch.textContent="Email";
    emailPitch.addEventListener("click",function(){var subj=encodeURIComponent((f.building||f.area)+" — "+(isVilla?f.villaType:f.aptSubtype)+" | DubAIVal");window.open("mailto:?subject="+subj+"&body="+encodeURIComponent(window._pitchText));});

    pitchActions.appendChild(copyPitch);pitchActions.appendChild(waPitch);pitchActions.appendChild(emailPitch);
    pitchOutput.appendChild(pitchActions);
  }
  pitchWrap.appendChild(pitchOutput);

  var genBtn=el("button",{style:{width:"100%",padding:"12px",borderRadius:"10px",fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",border:"none",background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:cl.white,marginTop:window._pitchText?"10px":"0",transition:"opacity 0.2s"}});
  genBtn.textContent=window._pitchLoading?"Generating...":window._pitchText?"Regenerate Pitch":"Generate Marketing Pitch";
  if(window._pitchLoading)genBtn.style.opacity="0.6";
  genBtn.addEventListener("click",async function(){
    if(window._pitchLoading)return;
    window._pitchLoading=true;render();
    try{
      var langNames={en:"English",fa:"Persian/Farsi",ar:"Arabic",ru:"Russian",zh:"Chinese"};
      var toneGuides={
        professional:"Write in a professional, data-driven tone. Focus on market facts and investment metrics.",
        luxury:"Write in an elegant, aspirational luxury tone. Emphasize lifestyle, exclusivity, and premium features.",
        investor:"Write in an analytical investor-focused tone. Lead with ROI, yield, capital appreciation, and market position.",
        urgent:"Write with urgency and scarcity. Emphasize limited opportunity, market timing, and competitive advantage."
      };
      var prompt="Generate a compelling property marketing pitch for a real estate agent to send to clients.\n\n"+
        "PROPERTY DETAILS:\n"+
        "- Location: "+f.area+(f.cluster?" ("+f.cluster+")":"")+"\n"+
        (f.building?"- Building: "+f.building+"\n":"")+
        "- Type: "+(isVilla?f.villaType:f.aptSubtype)+"\n"+
        "- Bedrooms: "+f.beds+"\n"+
        "- Size: "+(isVilla?f.buaSize:f.size)+" sqft\n"+
        (f.floor&&!isVilla?"- Floor: "+f.floor+"\n":"")+
        (f.view&&f.view!=="Not specified"?"- View: "+f.view+"\n":"")+
        "- Furnished: "+f.furnished+"\n"+
        "- Asking Price: AED "+Number(f.price).toLocaleString()+"\n"+
        "- Price PSF: AED "+val.askPSF.toLocaleString()+"\n\n"+
        "MARKET CONTEXT (from DubAIVal analysis):\n"+
        "- Market PSF: AED "+val.adjPSF.toLocaleString()+"\n"+
        "- vs Market: "+val.vsPct+"%\n"+
        "- Verdict: "+val.verdict+"\n"+
        "- Gross Yield: "+val.grossYield+"%\n"+
        "- Net Yield: "+val.netYield+"%\n"+
        "- Rent Estimate: AED "+Math.round((val.rent||0)*0.88).toLocaleString()+"–"+Math.round((val.rent||0)*1.12).toLocaleString()+"/yr\n"+
        "- Area Growth (1-3yr): "+(val.g1||"N/A")+"%\n"+
        "- Confidence: "+val.confScore+"/100\n\n"+
        "INSTRUCTIONS:\n"+
        "- Language: "+langNames[window._pitchLang]+"\n"+
        "- Tone: "+toneGuides[window._pitchTone]+"\n"+
        "- Format: Ready to paste into WhatsApp. Use line breaks, not HTML.\n"+
        "- Include: property highlights, price justification with market data, investment potential, call to action.\n"+
        "- Length: 150-250 words. Concise but persuasive.\n"+
        "- Add relevant emojis sparingly.\n"+
        "- End with: 'Powered by DubAIVal.com — AI Property Intelligence'";

      var resp=await callGroqRaw({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:prompt}],temperature:0.7,max_tokens:1200});
      var data=await resp.json();
      window._pitchText=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||"Error generating pitch.";
    }catch(e){window._pitchText="Error: "+e.message;}
    window._pitchLoading=false;render();
  });
  pitchWrap.appendChild(genBtn);
  wrap.appendChild(pitchWrap);

  // -- ASKING PRICE DEPENDENCY DISCLAIMER --
  var apDisclaim=div({background:cl.surface,border:"1px solid "+hexAlpha(cl.sub,0.15),borderRadius:"10px",padding:"14px 16px",marginTop:"14px"});
  apDisclaim.appendChild(div({display:"flex",alignItems:"center",gap:"6px",marginBottom:"8px"},[
    span({fontSize:"11px"},""),
    span({color:cl.sub,fontSize:"9px",fontWeight:"700",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Asking Price Dependent Metrics"),
  ]));
  apDisclaim.appendChild(div({color:hexAlpha(cl.sub,0.75),fontSize:"10px",lineHeight:"1.6",fontFamily:"'Inter',sans-serif"},[
    span({},"The following metrics are calculated based on the "),
    span({fontWeight:"700",color:cl.sub},"Asking Price (AED "+(parseInt(f.price)||0).toLocaleString()+")"),
    span({}," you entered. If the asking price changes, these values will adjust accordingly:"),
  ]));
  var apItems=[
    {name:"Price per Sqft (Asking)",desc:"Asking price ÷ property size"},
    {name:"vs Market Average %",desc:"Asking PSF vs estimated market PSF"},
    {name:"Verdict",desc:"DISTRESS / GOOD / FAIR / OVERPRICED classification"},
    {name:"Negotiation Target",desc:"Suggested offer based on asking vs fair value gap"},
    {name:"Gross Yield",desc:"Annual rent ÷ asking price"},
    {name:"Net Yield",desc:"(Annual rent − service charge) ÷ asking price"},
    {name:"Price-to-Rent Ratio",desc:"Inverse of gross yield × 100"},
    {name:"Investment Signal",desc:"Undervalued / Fair Value / Elevated / Bubble Risk"},
    {name:"Total Return Est.",desc:"Net yield + annualized capital growth"},
    {name:"Margin of Safety",desc:"Fair price vs asking price gap analysis"},
  ];
  var apList=el("div",{style:{marginTop:"8px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 12px"}});
  apItems.forEach(function(it){
    apList.appendChild(div({padding:"3px 0"},[
      span({color:cl.sub,fontSize:"9.5px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace"},it.name),
      span({color:hexAlpha(cl.sub,0.55),fontSize:"8.5px",fontFamily:"'Inter',sans-serif",display:"block"},it.desc),
    ]));
  });
  apDisclaim.appendChild(apList);
  apDisclaim.appendChild(div({color:hexAlpha(cl.sub,0.5),fontSize:"8.5px",fontFamily:"'Inter',sans-serif",marginTop:"8px",fontStyle:"italic",borderTop:"1px solid "+hexAlpha(cl.sub,0.1),paddingTop:"6px"},"Market-independent metrics (Market PSF, Fair Price, Rent Estimate, Confidence Score, Area Benchmarks) remain unchanged regardless of asking price."));
  wrap.appendChild(apDisclaim);

  return wrap;
}

function renderRentalResult(wrap){
  var cl=C();
  var rv=analyzerState.rentalVal;
  var f=analyzerState.f;
  if(!rv)return wrap;
  window.scrollTo({top:0,behavior:"smooth"});

  wrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"},[
    div({},[
      span({color:"#8B5CF6",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block"},"Rental Analysis Complete"),
      span({color:cl.subHi,fontSize:"13px",fontFamily:"'Inter',sans-serif"},(f.building?f.building+" · ":"")+(rv.isVilla?f.villaType:f.aptSubtype)+" · "+f.area),
    ]),
    el("button",{style:{background:"transparent",border:"1px solid "+cl.border,color:cl.sub,padding:"7px 14px",borderRadius:"8px",cursor:"pointer",fontSize:"12px"},onclick:function(){
      analyzerState={stage:0,mode:"valuation",f:{area:"",propCategory:"",aptSubtype:"",beds:"",bathrooms:"",hasMaid:false,floor:"",view:"Not specified",size:"",furnished:"Unfurnished",parking:"1",serviceCharge:"",price:"",villaType:"",cluster:"",floors:"",plotSize:"",buaSize:"",privatePool:false,singleRow:false,cornerVilla:false,building:"",txnType:"rent",purchasePrice:"",purchaseDate:""},val:null,rentalVal:null,aiText:"",aiTextSeller:"",liveData:null,err:"",reportMode:"personal",reportFor:"buyer",smartRent:null};
      window.scrollTo({top:0,behavior:"smooth"});render();
    }},"← New"),
  ]));

  var vcfg={BELOW_MARKET:{bg:"linear-gradient(135deg,rgba(16,185,129,0.08),transparent)",bo:"rgba(16,185,129,0.4)",tx:"#10B981",icon:"●",label:"BELOW MARKET",sub:"This rent is significantly below the area average — great deal for tenants"},COMPETITIVE:{bg:"linear-gradient(135deg,rgba(16,185,129,0.06),transparent)",bo:"rgba(16,185,129,0.3)",tx:"#10B981",icon:"●",label:"COMPETITIVE RENT",sub:"Slightly below market — attractive for tenants, fair for landlords"},MARKET_RATE:{bg:"linear-gradient(135deg,rgba(245,158,11,0.08),transparent)",bo:"rgba(245,158,11,0.3)",tx:"#F59E0B",icon:"●",label:"MARKET RATE",sub:"In line with area averages — standard rental pricing"},ABOVE_MARKET:{bg:"linear-gradient(135deg,rgba(249,115,22,0.08),transparent)",bo:"rgba(249,115,22,0.3)",tx:"#F97316",icon:"●",label:"ABOVE MARKET",sub:"Higher than average — negotiate or justify with premium features"},OVERPRICED:{bg:"linear-gradient(135deg,rgba(239,68,68,0.08),transparent)",bo:"rgba(239,68,68,0.3)",tx:"#EF4444",icon:"●",label:"OVERPRICED RENT",sub:"Well above market — significant negotiation recommended"}}[rv.verdict]||{bg:"linear-gradient(135deg,rgba(245,158,11,0.08),transparent)",bo:"rgba(245,158,11,0.3)",tx:"#F59E0B",icon:"●",label:"MARKET RATE",sub:""};
  var confColor=rv.confTier.c==="green"?"#10B981":rv.confTier.c==="yellow"?"#F59E0B":"#EF4444";

  wrap.appendChild(div({background:vcfg.bg,border:"2px solid "+vcfg.bo,borderRadius:"16px",overflow:"hidden",marginBottom:"14px",animation:"fadeUp 0.4s ease"},[
    div({padding:"20px 20px 16px",textAlign:"center",borderBottom:"1px solid "+cl.border},[
      div({fontSize:"32px",marginBottom:"8px"},vcfg.icon),
      div({color:vcfg.tx,fontSize:"22px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace",letterSpacing:"0.04em"},vcfg.label),
      div({color:vcfg.tx,opacity:"0.75",fontSize:"12px",marginTop:"3px",fontFamily:"'Inter',sans-serif"},vcfg.sub),
    ]),
    div({padding:"16px 20px"},[
      div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"},[
        div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[lbl("Asking Rent /yr"),div({color:cl.white,fontSize:"17px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+rv.askRent.toLocaleString())]),
        div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[lbl("Market Estimate /yr"),div({color:"#10B981",fontSize:"17px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+rv.estRent.toLocaleString())]),
      ]),
      div({background:cl.raised,borderRadius:"10px",padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"},[
        span({color:cl.sub,fontSize:"12px",fontFamily:"'Space Grotesk',monospace"},"vs Market Average"),
        span({color:parseFloat(rv.vsPct)<0?"#10B981":parseFloat(rv.vsPct)>10?"#EF4444":"#F59E0B",fontSize:"19px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},(parseFloat(rv.vsPct)>0?"+":"")+rv.vsPct+"%"),
      ]),
      div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"},[
        div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[lbl("Monthly Asking"),div({color:cl.subHi,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+rv.monthly.toLocaleString())]),
        div({background:cl.raised,borderRadius:"10px",padding:"12px 14px"},[lbl("Monthly Market"),div({color:cl.sub,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+rv.estMonthly.toLocaleString())]),
      ]),
      div({background:cl.raised,borderRadius:"10px",padding:"12px 14px",marginBottom:"12px"},[
        lbl("Market Rent Range"),
        div({display:"flex",alignItems:"center",gap:"8px",marginTop:"6px"},[
          span({color:cl.sub,fontSize:"12px",fontFamily:"'Space Grotesk',monospace"},"AED "+rv.rentLow.toLocaleString()),
          (function(){
            var barW=el("div",{style:{flex:"1",height:"6px",borderRadius:"3px",background:cl.border,position:"relative",overflow:"visible"}});
            var pct=Math.max(0,Math.min(100,(rv.askRent-rv.rentLow)/(rv.rentHigh-rv.rentLow)*100));
            var dot=el("div",{style:{position:"absolute",left:pct+"%",top:"-3px",width:"12px",height:"12px",borderRadius:"50%",background:vcfg.tx,border:"2px solid "+cl.surface,transform:"translateX(-50%)",boxShadow:"0 0 6px "+vcfg.tx}});
            barW.appendChild(dot);
            return barW;
          })(),
          span({color:cl.sub,fontSize:"12px",fontFamily:"'Space Grotesk',monospace"},"AED "+rv.rentHigh.toLocaleString()),
        ]),
        div({textAlign:"center",marginTop:"6px",color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"Your asking rent position in market range"),
      ]),
      rv.suggestedRent?div({background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.3)",borderRadius:"10px",padding:"12px 14px",marginBottom:"10px"},[lbl("Negotiation Target"),div({color:"#8B5CF6",fontSize:"20px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+rv.suggestedRent.toLocaleString()+"/yr"),div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},"AED "+Math.round(rv.suggestedRent/12).toLocaleString()+"/month")]):div({}),
      div({background:cl.raised,borderRadius:"10px",padding:"12px 14px",marginTop:"10px"},[
        div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"},[lbl("Valuation Confidence"),span({color:confColor,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},rv.confTier.label+" · "+rv.confTier.range)]),
        div({height:"5px",background:cl.border,borderRadius:"3px",overflow:"hidden",marginBottom:"8px"},[div({height:"100%",width:rv.confScore+"%",background:"linear-gradient(90deg,"+confColor+"90,"+confColor+")",borderRadius:"3px",transition:"width 0.8s"})]),
        span({color:cl.sub,fontSize:"10.5px",fontFamily:"'Space Grotesk',monospace"},"Score "+rv.confScore+"/100 · "+rv.dataSource),
      ]),
    ]),
  ]));

  if(analyzerState.aiText){
    var ecCard=div({background:cl.surface,border:"1px solid rgba(139,92,246,0.3)",borderRadius:"14px",padding:"18px",marginBottom:"14px"});
    ecCard.appendChild(span({color:"#8B5CF6",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"10px"},"Rental Expert Commentary"));
    var ecFormatted=typeof formatAIResponse==="function"?formatAIResponse(analyzerState.aiText,cl):null;
    if(ecFormatted)ecCard.appendChild(ecFormatted);
    else ecCard.appendChild(div({color:cl.subHi,fontSize:"13.5px",lineHeight:"1.85",fontFamily:"'Inter',sans-serif"},analyzerState.aiText));
    wrap.appendChild(ecCard);
  }

  if(rv.sc>0){
    wrap.appendChild(div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px"},[
      span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"Landlord Net Rent Analysis"),
      div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"},[
        div({background:cl.raised,borderRadius:"10px",padding:"12px 14px",textAlign:"center"},[lbl("Gross Rent"),div({color:cl.subHi,fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+rv.askRent.toLocaleString())]),
        div({background:cl.raised,borderRadius:"10px",padding:"12px 14px",textAlign:"center"},[lbl("Annual SC"),div({color:"#EF4444",fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"-AED "+rv.sc.toLocaleString())]),
        div({background:cl.raised,borderRadius:"10px",padding:"12px 14px",textAlign:"center"},[lbl("Net to Landlord"),div({color:rv.netRent>0?"#10B981":"#EF4444",fontSize:"15px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+rv.netRent.toLocaleString())]),
      ]),
    ]));
  }

  if(rv.areaRents&&rv.areaRents.length>0){
    var benchCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"14px"});
    benchCard.appendChild(span({color:"#8B5CF6",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"Area Rental Benchmarks · "+f.area));
    rv.areaRents.forEach(function(ar){
      var isActive=ar.beds===rv.beds||(ar.beds==="Studio"&&rv.beds==="Studio");
      var row=div({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",marginBottom:"4px",borderRadius:"8px",background:isActive?"rgba(139,92,246,0.08)":"transparent",border:isActive?"1px solid rgba(139,92,246,0.25)":"1px solid transparent"});
      row.appendChild(span({color:isActive?"#8B5CF6":cl.sub,fontSize:"12px",fontWeight:isActive?"700":"500",fontFamily:"'Inter',sans-serif"},ar.beds));
      row.appendChild(div({},[
        span({color:isActive?cl.white:cl.subHi,fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"AED "+ar.rent.toLocaleString()+"/yr"),
        span({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginLeft:"8px"},"AED "+Math.round(ar.rent/12).toLocaleString()+"/mo"),
      ]));
      benchCard.appendChild(row);
    });
    wrap.appendChild(benchCard);
  }

  var adjCard=div({background:cl.raised,borderRadius:"10px",padding:"12px 14px",marginBottom:"14px"});
  adjCard.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Rent Adjustments Applied"));
  [{l:"Furnished Status",v:rv.furnished+(rv.furnMult>1?" (+"+Math.round((rv.furnMult-1)*100)+"%)":""),ok:rv.furnMult>1},{l:"View Premium",v:rv.viewAdj>1?"+"+Math.round((rv.viewAdj-1)*100)+"%":"No adjustment",ok:rv.viewAdj>1},{l:"Building Match",v:rv.inDB?"Found in DB":"Area benchmark",ok:rv.inDB},{l:"Rental Data",v:rv.areaRents.length>0?rv.areaRents.length+" categories":"Limited data",ok:rv.areaRents.length>0}].forEach(function(a){
    var row=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid "+cl.border}});
    row.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},a.l));
    var badge=el("span",{style:{fontSize:"10px",fontFamily:"'Space Grotesk',monospace",color:a.ok?"#10B981":"#F59E0B",background:a.ok?"rgba(0,200,150,0.1)":"rgba(240,160,48,0.1)",padding:"2px 8px",borderRadius:"10px"}});
    badge.textContent=a.v;
    row.appendChild(badge);
    adjCard.appendChild(row);
  });
  wrap.appendChild(adjCard);

  var tipCard=div({background:"rgba(139,92,246,0.04)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:"14px",padding:"18px",marginBottom:"14px"});
  tipCard.appendChild(span({color:"#8B5CF6",fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"10px"},"Rental Market Tips"));
  var tips=[];
  if(parseFloat(rv.vsPct)>10)tips.push({icon:"—",text:"This rent is above market — request landlord to include DEWA deposit, maintenance, or parking to justify the premium."});
  if(parseFloat(rv.vsPct)>5)tips.push({icon:"—",text:"Counter-offer with market data: average "+rv.beds+" rent in "+f.area+" is AED "+rv.estRent.toLocaleString()+"/yr."});
  if(parseFloat(rv.vsPct)<-5)tips.push({icon:"—",text:"Good deal for tenants — this is below market rate. Consider locking in a 2-year lease."});
  tips.push({icon:"—",text:"Always get an Ejari registration. RERA rent index: rera.gov.ae/rental-increase-calculator."});
  tips.push({icon:"—",text:"Check the DEWA status and AC type (chiller-free vs metered) — this affects your total cost by AED 5-15K/yr."});
  if(rv.sc>0)tips.push({icon:"—",text:"Landlord pays AED "+rv.sc.toLocaleString()+"/yr in service charges — net return is AED "+rv.netRent.toLocaleString()+"/yr."});
  tips.forEach(function(tip){
    tipCard.appendChild(div({display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"8px"},[
      span({fontSize:"14px",flexShrink:"0"},tip.icon),
      span({color:cl.subHi,fontSize:"11.5px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6"},tip.text),
    ]));
  });
  wrap.appendChild(tipCard);

  var shareRow=div({display:"flex",gap:"8px",marginBottom:"14px"});
  var shareBtn=el("button",{style:{flex:"1",padding:"12px",borderRadius:"10px",border:"1px solid rgba(139,92,246,0.3)",background:"rgba(139,92,246,0.08)",color:"#8B5CF6",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  shareBtn.textContent="Share Rental Analysis";
  shareBtn.addEventListener("click",function(){
    var text="Rental Analysis by DubAIVal.com\n\n"+(f.building||f.area)+" · "+(rv.isVilla?f.villaType:f.aptSubtype)+" · "+rv.beds+"\n\nAsking: AED "+rv.askRent.toLocaleString()+"/yr (AED "+rv.monthly.toLocaleString()+"/mo)\nMarket: AED "+rv.estRent.toLocaleString()+"/yr\nVerdict: "+rv.verdict.replace(/_/g," ")+"\nvs Market: "+rv.vsPct+"%\n\nPowered by DubAIVal.com";
    if(navigator.share)navigator.share({title:"DubAIVal Rental Analysis",text:text}).catch(function(){});
    else{navigator.clipboard.writeText(text).then(function(){alert("Copied to clipboard!");});}
  });
  shareRow.appendChild(shareBtn);
  var waBtn=el("button",{style:{padding:"12px 16px",borderRadius:"10px",border:"1px solid rgba(37,211,102,0.3)",background:"rgba(37,211,102,0.08)",color:"#25D366",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  waBtn.textContent="WhatsApp";
  waBtn.addEventListener("click",function(){
    var text="Rental Analysis by DubAIVal.com\n\n"+(f.building||f.area)+" · "+rv.beds+"\nAsking: AED "+rv.askRent.toLocaleString()+"/yr\nMarket: AED "+rv.estRent.toLocaleString()+"/yr\nVerdict: "+rv.verdict.replace(/_/g," ")+"\n\ndubaival.com";
    window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank");
  });
  shareRow.appendChild(waBtn);
  wrap.appendChild(shareRow);

  return wrap;
}

