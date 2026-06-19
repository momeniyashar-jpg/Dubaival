// --- SOCIAL / VIDEO PLATFORM (placeholder — full version loading) ---
function renderSocial(){
  var cl=C();
  var wrap=div({maxWidth:"820px",margin:"0 auto",padding:"30px 20px",fontFamily:"'Space Grotesk',monospace"});
  var hero=div({textAlign:"center",padding:"60px 20px"});
  hero.appendChild(el("div",{style:{fontSize:"48px",marginBottom:"16px"}},"🎬"));
  hero.appendChild(el("h2",{style:{color:cl.gold,fontSize:"20px",fontWeight:"700",margin:"0 0 12px"}},"PropTech Social — Coming Soon"));
  hero.appendChild(el("p",{style:{color:cl.sub,fontSize:"13px",lineHeight:"1.7",maxWidth:"480px",margin:"0 auto"}},"Dubai's first vertical social platform for real estate professionals. Agent profiles, property video walkthroughs, area-based explore feed, and community rankings."));
  wrap.appendChild(hero);
  return wrap;
}
