// --- CHAT TAB ----------------------------------------------------------------
function renderChat(){
  const cl=C();
  const wrap=div({display:"flex",flexDirection:"column",height:"calc(100vh - 130px)",padding:"0 20px",maxWidth:"640px",margin:"0 auto",width:"100%"});
  const msgsDiv=div({flex:"1",overflowY:"auto",display:"flex",flexDirection:"column",gap:"12px",paddingTop:"16px",paddingBottom:"12px",minHeight:"0"});
  chatState.msgs.forEach(function(m){
    const isA=m.role==="assistant";
    const row=div({display:"flex",justifyContent:isA?"flex-start":"flex-end",gap:"8px"});
    if(isA){var av=el("div",{style:{width:"28px",height:"28px",borderRadius:"7px",flexShrink:"0",background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}});av.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20"><g transform="translate(12,1)"><line x1="0" y1="0" x2="0" y2="5" stroke="#fff" stroke-width="1" stroke-linecap="round"/><rect x="-1.5" y="5" width="3" height="2.5" fill="#fff" rx="0.3"/><polygon points="-3,7.5 3,7.5 1.5,5 -1.5,5" fill="#fff"/><rect x="-3.5" y="7.5" width="7" height="3" fill="#fff" rx="0.3"/><polygon points="-5,10.5 5,10.5 3.5,7.5 -3.5,7.5" fill="#fff"/><rect x="-5.5" y="10.5" width="11" height="3.5" fill="#fff" rx="0.4"/><rect x="-6.5" y="14" width="13" height="2" fill="#fff" rx="0.3"/><text x="-4" y="19.5" font-family="Space Grotesk,monospace" font-size="5" font-weight="900" fill="rgba(255,255,255,0.7)">AI</text></g></svg>';row.appendChild(av);}
    const bubble=div({maxWidth:"84%",background:isA?cl.surface:cl.goldFaint,border:"1px solid "+(isA?cl.border:cl.goldDim),borderRadius:isA?"14px 14px 14px 0":"14px 14px 0 14px",padding:"11px 15px",color:cl.subHi,fontSize:"13px",lineHeight:"1.8",fontFamily:"'Inter',sans-serif"});
    if(isA){var formatted=formatAIResponse(m.text,cl);if(formatted)bubble.appendChild(formatted);else{bubble.style.whiteSpace="pre-wrap";bubble.textContent=m.text;}}
    else{bubble.style.whiteSpace="pre-wrap";bubble.textContent=m.text;}
    row.appendChild(bubble);msgsDiv.appendChild(row);
  });
  if(chatState.loading){
    const row=div({display:"flex",gap:"8px",alignItems:"center"});
    var av2=el("div",{style:{width:"28px",height:"28px",borderRadius:"7px",background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}});av2.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20"><g transform="translate(12,1)"><line x1="0" y1="0" x2="0" y2="5" stroke="#fff" stroke-width="1" stroke-linecap="round"/><rect x="-1.5" y="5" width="3" height="2.5" fill="#fff" rx="0.3"/><polygon points="-3,7.5 3,7.5 1.5,5 -1.5,5" fill="#fff"/><rect x="-3.5" y="7.5" width="7" height="3" fill="#fff" rx="0.3"/><polygon points="-5,10.5 5,10.5 3.5,7.5 -3.5,7.5" fill="#fff"/><rect x="-5.5" y="10.5" width="11" height="3.5" fill="#fff" rx="0.4"/><rect x="-6.5" y="14" width="13" height="2" fill="#fff" rx="0.3"/><text x="-4" y="19.5" font-family="Space Grotesk,monospace" font-size="5" font-weight="900" fill="rgba(255,255,255,0.7)">AI</text></g></svg>';row.appendChild(av2);
    const dots=div({display:"flex",gap:"4px"});
    [0,1,2].forEach(function(j){dots.appendChild(div({width:"7px",height:"7px",borderRadius:"50%",background:cl.gold,animation:"bounce 1.1s "+(j*0.18)+"s infinite"}))});
    row.appendChild(dots);msgsDiv.appendChild(row);
  }
  wrap.appendChild(msgsDiv);
  if(chatState.msgs.length<=1){
    const suggs=div({display:"flex",flexDirection:"column",gap:"7px",marginBottom:"10px"});
    ["Is BLVD Heights at AED 2,800 PSF a good deal?","Best yield under AED 1.5M right now?","Off-plan vs ready in 2026?","Geo risk still affecting prices?"].forEach(function(s){
      suggs.appendChild(el("button",{style:{background:cl.surface,border:"1px solid "+cl.border,color:cl.sub,padding:"9px 14px",borderRadius:"10px",cursor:"pointer",fontSize:"12.5px",fontFamily:"'Inter',sans-serif",textAlign:"left"},onclick:function(){sendChat(s);}},s));
    });
    wrap.appendChild(suggs);
  }
  const inputRow=div({display:"flex",gap:"10px",alignItems:"center",background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"10px 14px",marginBottom:"14px"});
  const chatInp=el("input",{style:{flex:"1",background:"transparent",border:"none",outline:"none",color:cl.white,fontSize:"13px",fontFamily:"'Inter',sans-serif",caretColor:cl.gold},placeholder:"Ask about any building, deal, or market question…"});
  chatInp.value=chatState.input;
  chatInp.addEventListener("input",function(){chatState.input=chatInp.value;});
  chatInp.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}});
  inputRow.appendChild(chatInp);
  inputRow.appendChild(el("button",{style:{background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:"#070B14",border:"none",width:"36px",height:"36px",borderRadius:"8px",cursor:"pointer",fontSize:"14px",fontWeight:"800"},onclick:function(){sendChat();}},"→"));
  wrap.appendChild(inputRow);
  setTimeout(function(){msgsDiv.scrollTop=msgsDiv.scrollHeight;},50);
  return wrap;
}

async function sendChat(text){
  const t=text||chatState.input.trim();
  if(!t||chatState.loading)return;
  chatState.input="";chatState.msgs.push({role:"user",text:t});chatState.loading=true;render();
  try{
    const history=chatState.msgs.slice(-8).map(function(m){return{role:m.role==="assistant"?"assistant":"user",content:m.text};});

    const reply=await askAI(history,getChatSys());
    chatState.msgs.push({role:"assistant",text:reply});
  }catch(e){chatState.msgs.push({role:"assistant",text:"Error: "+e.message});}
  chatState.loading=false;render();
}

