// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- MORTGAGE STANDALONE -----------------------------------------------------
function renderMortgageStandalone(cl){
  if(!window.MORT_SA)window.MORT_SA={price:"",dp:25,tenure:25,type:"fixed1",nationality:"expat"};
  const M=window.MORT_SA;

  const wrap=el("div",{});

  // Price input
  const priceWrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"18px",marginBottom:"12px"}});
  priceWrap.appendChild(div({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"14px"},"◆ Property Details"));

  const priceRow=el("div",{style:{marginBottom:"12px"}});
  priceRow.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"5px"},"Property Price (AED)"));
  const priceInp=el("input",{type:"number",placeholder:"e.g. 2,500,000",style:{width:"100%",background:cl.bg,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"10px 12px",borderRadius:"8px",fontSize:"14px",fontFamily:"'Space Grotesk',monospace",boxSizing:"border-box",outline:"none"}});
  priceInp.value=M.price||"";
  priceInp.addEventListener("input",function(){M.price=this.value;});
  priceInp.addEventListener("change",function(){render();});
  priceRow.appendChild(priceInp);
  priceWrap.appendChild(priceRow);
  wrap.appendChild(priceWrap);

  const price=parseInt(M.price)||0;
  if(price>=500000){
    const calcWrap=renderMortgage(price,cl);
    if(calcWrap)wrap.appendChild(calcWrap);
  } else {
    const placeholder=el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"40px 20px",textAlign:"center"}});
    placeholder.appendChild(div({fontSize:"32px",marginBottom:"10px"},"💰"));
    placeholder.appendChild(div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif"},"Enter property price above to calculate mortgage"));
    wrap.appendChild(placeholder);
  }

  return wrap;
}

// --- MORTGAGE CALCULATOR ------------------------------------------------------
function renderMortgage(price, cl){
  if(!price||price<500000)return null;
  
  // State
  if(!window.MORT)window.MORT={dp:20,tenure:25,type:"fixed1",nationality:"expat"};
  const M=window.MORT;
  
  const RATES={fixed1:4.49,fixed3:4.75,variable:4.25};
  const maxLTV=M.nationality==="uae"?80:(price>=5000000?65:75);
  const minDP=100-maxLTV;
  if(M.dp<minDP)M.dp=minDP;
  
  const dpAmt=Math.round(price*M.dp/100);
  const loanAmt=price-dpAmt;
  const annualRate=(RATES[M.type])/100;
  const monthlyRate=annualRate/12;
  const n=M.tenure*12;
  const monthly=Math.round(loanAmt*(monthlyRate*Math.pow(1+monthlyRate,n))/(Math.pow(1+monthlyRate,n)-1));
  const totalPaid=monthly*n;
  const totalInterest=totalPaid-loanAmt;
  const dldFee=Math.round(price*0.04);
  const agencyFee=Math.round(price*0.02);
  const mortgageFee=Math.round(price*0.0025);
  const totalCost=dpAmt+dldFee+agencyFee+mortgageFee;

  const wrap=el("div",{style:{background:cl.surface,border:"1px solid "+cl.goldDim,borderRadius:"14px",padding:"18px",marginTop:"14px"}});
  
  // Header
  wrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"◆ Mortgage Calculator"),
    span({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace"},"Dubai Rates · June 2026"),
  ]));

  // Rate type selector
  const rateRow=el("div",{style:{display:"flex",gap:"6px",marginBottom:"12px"}});
  [{k:"fixed1",l:"Fixed 1Y · 4.49%"},{k:"fixed3",l:"Fixed 3Y · 4.75%"},{k:"variable",l:"Variable · 4.25%"}].forEach(function(rt){
    const active=M.type===rt.k;
    const btn=el("button",{style:{
      flex:"1",padding:"6px 4px",borderRadius:"8px",fontSize:"9.5px",
      border:"1px solid "+(active?cl.gold:cl.border),
      background:active?cl.goldFaint:"transparent",
      color:active?cl.gold:cl.sub,
      fontFamily:"'Space Grotesk',monospace",cursor:"pointer",fontWeight:active?"700":"400",
      lineHeight:"1.3"
    },onclick:function(){M.type=rt.k;render();}},rt.l);
    rateRow.appendChild(btn);
  });
  wrap.appendChild(rateRow);

  // Down payment slider
  const dpRow=el("div",{style:{marginBottom:"12px"}});
  const dpLabel=el("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"4px"}});
  dpLabel.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},"Down Payment"));
  dpLabel.appendChild(span({color:cl.gold,fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},M.dp+"% · AED "+dpAmt.toLocaleString()));
  dpRow.appendChild(dpLabel);
  const slider=el("input",{type:"range",min:minDP,max:50,value:M.dp,style:{width:"100%",accentColor:cl.gold}});
  slider.addEventListener("input",function(){M.dp=parseInt(this.value);render();});
  dpRow.appendChild(slider);
  const dpHint=el("div",{style:{display:"flex",justifyContent:"space-between"}});
  dpHint.appendChild(span({color:cl.sub,fontSize:"8px",fontFamily:"'Space Grotesk',monospace"},"Min "+minDP+"% ("+(M.nationality==="uae"?"UAE National":"Expat")+")"));
  dpHint.appendChild(span({color:cl.sub,fontSize:"8px",fontFamily:"'Space Grotesk',monospace"},"Loan: AED "+loanAmt.toLocaleString()));
  dpRow.appendChild(dpHint);
  wrap.appendChild(dpRow);

  // Tenure + Nationality row
  const optRow=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}});
  
  const tenureBox=el("div",{});
  tenureBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Tenure"));
  const tenureSel=el("select",{style:{width:"100%",background:cl.bg,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"6px 8px",borderRadius:"6px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace"}});
  [15,20,25].forEach(function(y){
    const opt=el("option",{value:y},y+" years");
    if(M.tenure===y)opt.selected=true;
    tenureSel.appendChild(opt);
  });
  tenureSel.addEventListener("change",function(){M.tenure=parseInt(this.value);render();});
  tenureBox.appendChild(tenureSel);
  optRow.appendChild(tenureBox);

  const natBox=el("div",{});
  natBox.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Buyer Type"));
  const natSel=el("select",{style:{width:"100%",background:cl.bg,border:"1px solid "+cl.border,color:"#F0F2F5",padding:"6px 8px",borderRadius:"6px",fontSize:"12px",fontFamily:"'Space Grotesk',monospace"}});
  [{v:"expat",l:"Expat (max 75%)"},{v:"uae",l:"UAE National (max 80%)"}].forEach(function(n){
    const opt=el("option",{value:n.v},n.l);
    if(M.nationality===n.v)opt.selected=true;
    natSel.appendChild(opt);
  });
  natSel.addEventListener("change",function(){M.nationality=this.value;render();});
  natBox.appendChild(natSel);
  optRow.appendChild(natBox);
  wrap.appendChild(optRow);

  // Results
  const results=el("div",{style:{background:cl.raised,borderRadius:"10px",padding:"14px",marginBottom:"12px"}});
  
  // Monthly payment - big number
  const mpRow=el("div",{style:{textAlign:"center",marginBottom:"12px",paddingBottom:"12px",borderBottom:"1px solid "+cl.border}});
  mpRow.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Monthly Payment"));
  mpRow.appendChild(div({color:cl.gold,fontSize:"24px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},"AED "+monthly.toLocaleString()));
  mpRow.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},M.tenure+" years · "+RATES[M.type]+"% p.a."));
  results.appendChild(mpRow);

  // Stats grid
  const statsGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}});
  [
    {l:"Total Interest",v:"AED "+totalInterest.toLocaleString(),c:cl.red},
    {l:"Total Repaid",v:"AED "+totalPaid.toLocaleString(),c:"#F0F2F5"},
    {l:"DLD Fee (4%)",v:"AED "+dldFee.toLocaleString(),c:cl.sub},
    {l:"Total Upfront",v:"AED "+totalCost.toLocaleString(),c:cl.gold},
  ].forEach(function(s){
    const cell=el("div",{style:{background:"rgba(240,242,245,0.04)",borderRadius:"6px",padding:"8px"}});
    cell.appendChild(div({color:cl.sub,fontSize:"8px",letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"2px"},s.l));
    cell.appendChild(div({color:s.c,fontSize:"12px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace"},s.v));
    statsGrid.appendChild(cell);
  });
  results.appendChild(statsGrid);
  wrap.appendChild(results);

  // Disclaimer
  wrap.appendChild(div({color:cl.sub,fontSize:"8.5px",fontFamily:"'Space Grotesk',monospace",lineHeight:"1.5"},
    "Indicative only · Subject to bank approval · Rates: ENBD/FAB June 2026 · DLD transfer fee 4% · Agency fee 2%"));

  return wrap;
}

