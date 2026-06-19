// --- PROPTECH VIDEO PLATFORM (SOCIAL TAB) ------------------------------------

// --- State -------------------------------------------------------------------
var SOCIAL_STATE={
  tab:"explore",  // explore | agents | profile | following
  // Explore
  videos:[],videosLoading:false,videosPage:0,videosHasMore:true,
  filter:{area:"",category:"",sort:"newest",myFeed:false},
  expandedVideo:null,
  // Agents
  agentList:[],agentsLoading:false,agentSort:"most-videos",agentSearch:"",
  viewAgent:null,viewAgentVideos:[],
  // Profile
  myProfile:null,profileLoading:false,
  regForm:{name:"",phone:"",rera:"",bio:"",areas:[],specialties:[],photo:null},
  myVideos:[],myVideosLoading:false,
  videoForm:{url:"",title:"",description:"",area:"",category:"walkthrough",propertyType:"",tags:""},
  videoFormOpen:false,videoPosting:false,editingVideoId:null,
  // Following
  followedAreas:[],followedAgents:[]
};

// localStorage restore
(function(){
  try{var id=localStorage.getItem("dv_social_agent_id");if(id)SOCIAL_STATE.myProfile={id:parseInt(id)};}catch(e){}
  try{var lk=localStorage.getItem("dv_social_my_likes");if(lk)SOCIAL_STATE._likedSet=JSON.parse(lk);else SOCIAL_STATE._likedSet=[];}catch(e){SOCIAL_STATE._likedSet=[];}
  try{var fa=localStorage.getItem("dv_social_followed_areas");if(fa)SOCIAL_STATE.followedAreas=JSON.parse(fa);else SOCIAL_STATE.followedAreas=[];}catch(e){SOCIAL_STATE.followedAreas=[];}
  try{var fg=localStorage.getItem("dv_social_followed_agents");if(fg)SOCIAL_STATE.followedAgents=JSON.parse(fg);else SOCIAL_STATE.followedAgents=[];}catch(e){SOCIAL_STATE.followedAgents=[];}
})();

function _socialUserId(){
  var uid=localStorage.getItem("dv_social_uid");
  if(!uid){uid="u_"+Date.now()+"_"+Math.random().toString(36).slice(2,8);localStorage.setItem("dv_social_uid",uid);}
  return uid;
}

// --- Helpers -----------------------------------------------------------------
function extractYouTubeId(url){
  if(!url)return null;
  var m=url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?m[1]:null;
}

function extractInstagramCode(url){
  if(!url)return null;
  var m=url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  return m?m[1]:null;
}

function getVideoThumbnail(url){
  var ytId=extractYouTubeId(url);
  if(ytId)return"https://img.youtube.com/vi/"+ytId+"/hqdefault.jpg";
  return null;
}

function isValidVideoUrl(url){
  if(!url)return false;
  return /youtube\.com|youtu\.be|instagram\.com\/(reel|p)\/|tiktok\.com/i.test(url);
}

function embedVideo(url){
  var cl=C();
  var ytId=extractYouTubeId(url);
  if(ytId){
    var iframe=el("iframe",{src:"https://www.youtube.com/embed/"+ytId+"?autoplay=1&rel=0",
      style:{width:"100%",aspectRatio:"16/9",border:"none",borderRadius:"10px"},
      allow:"autoplay; encrypted-media",allowfullscreen:"true"});
    return iframe;
  }
  var igCode=extractInstagramCode(url);
  if(igCode){
    var w=div({width:"100%",textAlign:"center",padding:"30px 20px"});
    w.appendChild(div({color:cl.sub,fontSize:"12px",marginBottom:"8px",fontFamily:"'Inter',sans-serif"},"Instagram embeds require opening in a new tab"));
    var link=el("a",{href:url,target:"_blank",style:{color:cl.gold,fontSize:"14px",fontFamily:"'Inter',sans-serif",textDecoration:"underline"}});
    link.textContent="Open on Instagram";
    w.appendChild(link);
    return w;
  }
  var fw=div({width:"100%",textAlign:"center",padding:"40px 20px"});
  var fl=el("a",{href:url,target:"_blank",style:{color:cl.gold,fontSize:"14px",fontFamily:"'Inter',sans-serif",textDecoration:"underline"}});
  fl.textContent="Open Video";
  fw.appendChild(fl);
  return fw;
}

function formatViews(n){
  if(n==null)return"0";
  if(n>=1000000)return(n/1000000).toFixed(1)+"M";
  if(n>=1000)return(n/1000).toFixed(1)+"K";
  return String(n);
}

function _socialTimeAgo(dateStr){
  if(!dateStr)return"—";
  var d=new Date(dateStr);if(isNaN(d.getTime()))return"—";
  var diff=Math.floor((Date.now()-d.getTime())/1000);
  if(diff<60)return"just now";
  if(diff<3600)return Math.floor(diff/60)+"m ago";
  if(diff<86400)return Math.floor(diff/3600)+"h ago";
  if(diff<604800)return Math.floor(diff/86400)+"d ago";
  if(diff<2592000)return Math.floor(diff/604800)+"w ago";
  return d.toLocaleDateString("en-GB",{day:"numeric",month:"short"});
}

function _socialHeaders(json){
  var h={"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY};
  if(json)h["Content-Type"]="application/json";
  return h;
}

function _isLiked(videoId){return SOCIAL_STATE._likedSet.indexOf(videoId)!==-1;}
function _saveLikes(){try{localStorage.setItem("dv_social_my_likes",JSON.stringify(SOCIAL_STATE._likedSet));}catch(e){}}
function _saveFollowedAreas(){try{localStorage.setItem("dv_social_followed_areas",JSON.stringify(SOCIAL_STATE.followedAreas));}catch(e){}}
function _saveFollowedAgents(){try{localStorage.setItem("dv_social_followed_agents",JSON.stringify(SOCIAL_STATE.followedAgents));}catch(e){}}

var SOCIAL_CATEGORIES=[
  {v:"walkthrough",l:"Walkthrough"},
  {v:"market-update",l:"Market Update"},
  {v:"tips",l:"Tips & Advice"},
  {v:"review",l:"Property Review"},
  {v:"new-launch",l:"New Launch"}
];

var SOCIAL_PROP_TYPES=[
  {v:"",l:"All Types"},
  {v:"apartment",l:"Apartment"},
  {v:"villa",l:"Villa"},
  {v:"office",l:"Office"},
  {v:"land",l:"Land"},
  {v:"retail",l:"Retail"}
];

// --- API Functions -----------------------------------------------------------

async function _fetchSocialVideos(reset){
  if(reset){SOCIAL_STATE.videosPage=0;SOCIAL_STATE.videos=[];SOCIAL_STATE.videosHasMore=true;}
  SOCIAL_STATE.videosLoading=true;render();
  var limit=12;var offset=SOCIAL_STATE.videosPage*limit;
  var q=SUPABASE_URL+"/rest/v1/agent_videos?select=*,agent_profiles(id,name,photo,rera_no,subscription)&order=";
  var f=SOCIAL_STATE.filter;
  if(f.sort==="most-viewed")q+="views.desc";
  else if(f.sort==="most-liked")q+="likes.desc";
  else q+="created_at.desc";
  q+="&limit="+limit+"&offset="+offset;
  if(f.area)q+="&area=eq."+encodeURIComponent(f.area);
  if(f.category)q+="&category=eq."+encodeURIComponent(f.category);
  if(f.myFeed){
    var areas=SOCIAL_STATE.followedAreas;
    var agents=SOCIAL_STATE.followedAgents;
    if(areas.length&&agents.length){
      q+="&or=(area.in.("+areas.map(function(a){return encodeURIComponent(a);}).join(",")+"),agent_id.in.("+agents.join(",")+"))";
    }else if(areas.length){
      q+="&area=in.("+areas.map(function(a){return encodeURIComponent(a);}).join(",")+")";
    }else if(agents.length){
      q+="&agent_id=in.("+agents.join(",")+")";
    }else{
      SOCIAL_STATE.videosLoading=false;SOCIAL_STATE.videos=[];render();return;
    }
  }
  try{
    var resp=await fetch(q,{headers:_socialHeaders()});
    if(resp.ok){
      var data=await resp.json();
      if(reset)SOCIAL_STATE.videos=data;
      else SOCIAL_STATE.videos=SOCIAL_STATE.videos.concat(data);
      SOCIAL_STATE.videosHasMore=data.length>=limit;
      SOCIAL_STATE.videosPage++;
    }
  }catch(e){console.warn("Social video fetch failed:",e.message);}
  SOCIAL_STATE.videosLoading=false;render();
}

async function _fetchAgentList(){
  SOCIAL_STATE.agentsLoading=true;render();
  var q=SUPABASE_URL+"/rest/v1/agent_profiles?select=*&order=";
  if(SOCIAL_STATE.agentSort==="most-followers")q+="follower_count.desc";
  else if(SOCIAL_STATE.agentSort==="newest")q+="created_at.desc";
  else q+="video_count.desc";
  q+="&limit=100";
  var s=SOCIAL_STATE.agentSearch.trim().toLowerCase();
  try{
    var resp=await fetch(q,{headers:_socialHeaders()});
    if(resp.ok){
      var data=await resp.json();
      if(s){
        data=data.filter(function(a){
          return(a.name||"").toLowerCase().indexOf(s)!==-1||
            (a.areas||[]).some(function(ar){return ar.toLowerCase().indexOf(s)!==-1;});
        });
      }
      SOCIAL_STATE.agentList=data;
    }
  }catch(e){console.warn("Agent list fetch failed:",e.message);}
  SOCIAL_STATE.agentsLoading=false;render();
}

async function _fetchMyProfile(){
  var pid=SOCIAL_STATE.myProfile&&SOCIAL_STATE.myProfile.id;
  if(!pid)return;
  SOCIAL_STATE.profileLoading=true;
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/agent_profiles?id=eq."+pid+"&select=*",{headers:_socialHeaders()});
    if(resp.ok){var d=await resp.json();if(d.length)SOCIAL_STATE.myProfile=d[0];}
  }catch(e){}
  SOCIAL_STATE.profileLoading=false;
}

async function _fetchMyVideos(){
  var pid=SOCIAL_STATE.myProfile&&SOCIAL_STATE.myProfile.id;
  if(!pid)return;
  SOCIAL_STATE.myVideosLoading=true;render();
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/agent_videos?agent_id=eq."+pid+"&select=*&order=created_at.desc",{headers:_socialHeaders()});
    if(resp.ok)SOCIAL_STATE.myVideos=await resp.json();
  }catch(e){}
  SOCIAL_STATE.myVideosLoading=false;render();
}

async function _registerAgent(){
  var f=SOCIAL_STATE.regForm;
  if(!f.name.trim()){alert("Name is required");return;}
  if(!f.phone.trim()){alert("Phone is required");return;}
  var uid=_socialUserId();
  var row={user_id:uid,name:f.name.trim(),phone:f.phone.trim(),rera_no:f.rera.trim()||null,
    bio:f.bio.trim()||null,areas:f.areas.length?f.areas:null,
    specialties:f.specialties.length?f.specialties:null,photo:f.photo||null};
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/agent_profiles",{method:"POST",
      headers:Object.assign({},_socialHeaders(true),{"Prefer":"return=representation"}),
      body:JSON.stringify(row)});
    if(!resp.ok){alert("Registration failed ("+resp.status+")");return;}
    var created=await resp.json();
    if(created&&created[0]){
      SOCIAL_STATE.myProfile=created[0];
      localStorage.setItem("dv_social_agent_id",String(created[0].id));
    }
  }catch(e){alert("Registration error: "+e.message);}
  render();
}

async function _updateProfile(){
  var pid=SOCIAL_STATE.myProfile&&SOCIAL_STATE.myProfile.id;
  if(!pid)return;
  var f=SOCIAL_STATE.regForm;
  var patch={name:f.name.trim(),phone:f.phone.trim(),rera_no:f.rera.trim()||null,
    bio:f.bio.trim()||null,areas:f.areas.length?f.areas:null,
    specialties:f.specialties.length?f.specialties:null,updated_at:new Date().toISOString()};
  if(f.photo)patch.photo=f.photo;
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/agent_profiles?id=eq."+pid,{method:"PATCH",
      headers:Object.assign({},_socialHeaders(true),{"Prefer":"return=representation"}),
      body:JSON.stringify(patch)});
    if(resp.ok){var d=await resp.json();if(d.length)SOCIAL_STATE.myProfile=d[0];alert("Profile updated!");}
    else alert("Update failed ("+resp.status+")");
  }catch(e){alert("Update error: "+e.message);}
  render();
}

async function _postVideo(){
  if(SOCIAL_STATE.videoPosting)return;
  var f=SOCIAL_STATE.videoForm;
  if(!f.url.trim()||!f.title.trim()||!f.area||!f.category){alert("Please fill URL, title, area and category");return;}
  if(!isValidVideoUrl(f.url)){alert("Please enter a valid YouTube, Instagram or TikTok URL");return;}
  var pid=SOCIAL_STATE.myProfile&&SOCIAL_STATE.myProfile.id;
  if(!pid){alert("Please register first");return;}
  SOCIAL_STATE.videoPosting=true;render();
  var thumb=getVideoThumbnail(f.url);
  var tags=f.tags?f.tags.split(",").map(function(t){return t.trim();}).filter(Boolean):null;
  var row={agent_id:pid,title:f.title.trim(),description:f.description.trim()||null,
    video_url:f.url.trim(),thumbnail:thumb,area:f.area,category:f.category,
    property_type:f.propertyType||null,tags:tags&&tags.length?tags:null};
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/agent_videos",{method:"POST",
      headers:Object.assign({},_socialHeaders(true),{"Prefer":"return=representation"}),
      body:JSON.stringify(row)});
    if(!resp.ok){alert("Post failed ("+resp.status+")");SOCIAL_STATE.videoPosting=false;render();return;}
    // Increment video_count on profile
    try{
      var profile=SOCIAL_STATE.myProfile;
      var newCount=(profile.video_count||0)+1;
      fetch(SUPABASE_URL+"/rest/v1/agent_profiles?id=eq."+pid,{method:"PATCH",
        headers:_socialHeaders(true),body:JSON.stringify({video_count:newCount})});
      profile.video_count=newCount;
    }catch(e){}
    SOCIAL_STATE.videoForm={url:"",title:"",description:"",area:"",category:"walkthrough",propertyType:"",tags:""};
    SOCIAL_STATE.videoFormOpen=false;SOCIAL_STATE.editingVideoId=null;
    _fetchMyVideos();
  }catch(e){alert("Post error: "+e.message);}
  SOCIAL_STATE.videoPosting=false;render();
}

async function _deleteVideo(videoId){
  if(!confirm("Delete this video?"))return;
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/agent_videos?id=eq."+videoId,{method:"DELETE",headers:_socialHeaders()});
    if(resp.ok){
      try{
        var pid=SOCIAL_STATE.myProfile&&SOCIAL_STATE.myProfile.id;
        if(pid){
          var newCount=Math.max(0,(SOCIAL_STATE.myProfile.video_count||1)-1);
          fetch(SUPABASE_URL+"/rest/v1/agent_profiles?id=eq."+pid,{method:"PATCH",
            headers:_socialHeaders(true),body:JSON.stringify({video_count:newCount})});
          SOCIAL_STATE.myProfile.video_count=newCount;
        }
      }catch(e){}
      _fetchMyVideos();
    }else{alert("Delete failed ("+resp.status+")");}
  }catch(e){alert("Delete error: "+e.message);}
}

async function _toggleLike(video){
  var uid=_socialUserId();
  var liked=_isLiked(video.id);
  if(liked){
    try{
      await fetch(SUPABASE_URL+"/rest/v1/video_likes?video_id=eq."+video.id+"&user_id=eq."+encodeURIComponent(uid),
        {method:"DELETE",headers:_socialHeaders()});
      SOCIAL_STATE._likedSet=SOCIAL_STATE._likedSet.filter(function(id){return id!==video.id;});
      video.likes=Math.max(0,(video.likes||0)-1);
      fetch(SUPABASE_URL+"/rest/v1/agent_videos?id=eq."+video.id,{method:"PATCH",
        headers:_socialHeaders(true),body:JSON.stringify({likes:video.likes})});
    }catch(e){}
  }else{
    try{
      await fetch(SUPABASE_URL+"/rest/v1/video_likes",{method:"POST",
        headers:Object.assign({},_socialHeaders(true),{"Prefer":"return=minimal"}),
        body:JSON.stringify({video_id:video.id,user_id:uid})});
      SOCIAL_STATE._likedSet.push(video.id);
      video.likes=(video.likes||0)+1;
      fetch(SUPABASE_URL+"/rest/v1/agent_videos?id=eq."+video.id,{method:"PATCH",
        headers:_socialHeaders(true),body:JSON.stringify({likes:video.likes})});
    }catch(e){}
  }
  _saveLikes();render();
}

function _incrementViews(video){
  video.views=(video.views||0)+1;
  try{
    fetch(SUPABASE_URL+"/rest/v1/agent_videos?id=eq."+video.id,{method:"PATCH",
      headers:_socialHeaders(true),body:JSON.stringify({views:video.views})});
  }catch(e){}
}

function _toggleFollowArea(area){
  var uid=_socialUserId();
  var idx=SOCIAL_STATE.followedAreas.indexOf(area);
  if(idx!==-1){
    SOCIAL_STATE.followedAreas.splice(idx,1);
    try{fetch(SUPABASE_URL+"/rest/v1/area_follows?user_id=eq."+encodeURIComponent(uid)+"&area=eq."+encodeURIComponent(area),
      {method:"DELETE",headers:_socialHeaders()});}catch(e){}
  }else{
    SOCIAL_STATE.followedAreas.push(area);
    try{fetch(SUPABASE_URL+"/rest/v1/area_follows",{method:"POST",
      headers:Object.assign({},_socialHeaders(true),{"Prefer":"return=minimal"}),
      body:JSON.stringify({user_id:uid,area:area})});}catch(e){}
  }
  _saveFollowedAreas();render();
}

function _toggleFollowAgent(agentId){
  var uid=_socialUserId();
  var idx=SOCIAL_STATE.followedAgents.indexOf(agentId);
  if(idx!==-1){
    SOCIAL_STATE.followedAgents.splice(idx,1);
    try{fetch(SUPABASE_URL+"/rest/v1/agent_follows?user_id=eq."+encodeURIComponent(uid)+"&agent_id=eq."+agentId,
      {method:"DELETE",headers:_socialHeaders()});}catch(e){}
  }else{
    SOCIAL_STATE.followedAgents.push(agentId);
    try{fetch(SUPABASE_URL+"/rest/v1/agent_follows",{method:"POST",
      headers:Object.assign({},_socialHeaders(true),{"Prefer":"return=minimal"}),
      body:JSON.stringify({user_id:uid,agent_id:agentId})});}catch(e){}
  }
  _saveFollowedAgents();render();
}

async function _fetchAgentVideos(agentId){
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/agent_videos?agent_id=eq."+agentId+"&select=*&order=created_at.desc&limit=50",{headers:_socialHeaders()});
    if(resp.ok)SOCIAL_STATE.viewAgentVideos=await resp.json();
  }catch(e){}
  render();
}

// --- UI Rendering -----------------------------------------------------------

function _socialSpinner(cl){
  return div({textAlign:"center",padding:"30px"},[
    div({width:"32px",height:"32px",borderRadius:"50%",border:"2px solid "+cl.border,
      borderTopColor:cl.gold,animation:"spin 0.8s linear infinite",margin:"0 auto"})
  ]);
}

function _socialEmpty(cl,msg){
  return div({textAlign:"center",padding:"40px 20px"},[
    div({color:cl.sub,fontSize:"13px",fontFamily:"'Inter',sans-serif"},msg)
  ]);
}

function _categoryColor(cat){
  var map={"walkthrough":"#3B82F6","market-update":"#10B981","tips":"#F59E0B","review":"#8B5CF6","new-launch":"#EF4444"};
  return map[cat]||"#6B7280";
}

function _categoryLabel(cat){
  var m={};SOCIAL_CATEGORIES.forEach(function(c){m[c.v]=c.l;});
  return m[cat]||cat;
}

// --- Video Card --------------------------------------------------------------
function _renderVideoCard(video,cl){
  var thumb=video.thumbnail||getVideoThumbnail(video.video_url);
  var agent=video.agent_profiles||{};
  var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",overflow:"hidden",
    cursor:"pointer",transition:"border-color 0.2s,transform 0.2s"});
  card.addEventListener("mouseenter",function(){card.style.borderColor=cl.goldDim;card.style.transform="translateY(-2px)";});
  card.addEventListener("mouseleave",function(){card.style.borderColor=cl.border;card.style.transform="translateY(0)";});
  card.addEventListener("click",function(){
    SOCIAL_STATE.expandedVideo=video;
    _incrementViews(video);
    render();
  });

  // Thumbnail
  var thumbWrap=div({position:"relative",width:"100%",aspectRatio:"16/9",background:cl.raised,overflow:"hidden"});
  if(thumb){
    var img=el("img",{src:thumb,style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}});
    img.onerror=function(){img.style.display="none";};
    thumbWrap.appendChild(img);
  }
  // Play icon overlay
  var playIcon=div({position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
    width:"44px",height:"44px",borderRadius:"50%",background:"rgba(0,0,0,0.6)",display:"flex",
    alignItems:"center",justifyContent:"center"});
  playIcon.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>';
  thumbWrap.appendChild(playIcon);
  // Category badge
  var catColor=_categoryColor(video.category);
  var catBadge=span({position:"absolute",top:"8px",left:"8px",background:hexAlpha(catColor,0.9),
    color:"#fff",fontSize:"9px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
    padding:"3px 8px",borderRadius:"4px",letterSpacing:"0.05em",textTransform:"uppercase"},_categoryLabel(video.category));
  thumbWrap.appendChild(catBadge);
  // Views badge
  var viewBadge=span({position:"absolute",bottom:"8px",right:"8px",background:"rgba(0,0,0,0.7)",
    color:"#fff",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",padding:"3px 8px",borderRadius:"4px"},
    formatViews(video.views)+" views");
  thumbWrap.appendChild(viewBadge);
  card.appendChild(thumbWrap);

  // Info section
  var info=div({padding:"12px"});
  var titleEl=div({color:cl.white,fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif",
    lineHeight:"1.4",marginBottom:"8px",display:"-webkit-box",WebkitLineClamp:"2",WebkitBoxOrient:"vertical",overflow:"hidden"});
  titleEl.textContent=video.title;
  info.appendChild(titleEl);

  // Agent row
  var agentRow=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"});
  if(agent.photo){
    var av=el("img",{src:agent.photo,style:{width:"22px",height:"22px",borderRadius:"50%",objectFit:"cover"}});
    av.onerror=function(){av.style.display="none";};
    agentRow.appendChild(av);
  }else{
    var avPlaceholder=div({width:"22px",height:"22px",borderRadius:"50%",background:cl.raised,
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",color:cl.sub});
    avPlaceholder.textContent=(agent.name||"?").charAt(0).toUpperCase();
    agentRow.appendChild(avPlaceholder);
  }
  agentRow.appendChild(span({color:cl.subHi,fontSize:"11px",fontFamily:"'Inter',sans-serif"},agent.name||"Agent"));
  if(agent.subscription==="gold"||agent.subscription==="platinum"){
    agentRow.appendChild(span({color:cl.gold,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",
      background:hexAlpha(cl.gold,0.1),padding:"1px 6px",borderRadius:"3px"},
      agent.subscription==="platinum"?"PLATINUM":"GOLD"));
  }
  info.appendChild(agentRow);

  // Bottom row: area + likes + time
  var bottomRow=div({display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"});
  bottomRow.appendChild(span({background:hexAlpha(cl.gold,0.1),color:cl.gold,fontSize:"9px",fontWeight:"600",
    fontFamily:"'Space Grotesk',monospace",padding:"3px 8px",borderRadius:"4px"},video.area));
  var liked=_isLiked(video.id);
  bottomRow.appendChild(span({color:liked?cl.red:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginLeft:"auto"},
    (liked?"♥ ":"♡ ")+formatViews(video.likes)));
  bottomRow.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},_socialTimeAgo(video.created_at)));
  info.appendChild(bottomRow);
  card.appendChild(info);
  return card;
}

// --- Video Modal (Expanded View) --------------------------------------------
function _renderVideoModal(cl){
  var video=SOCIAL_STATE.expandedVideo;
  if(!video)return div({});
  var agent=video.agent_profiles||{};

  var overlay=div({position:"fixed",top:"0",left:"0",right:"0",bottom:"0",zIndex:"10000",
    background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-start",justifyContent:"center",
    overflowY:"auto",padding:"20px"});
  overlay.addEventListener("click",function(e){
    if(e.target===overlay){
      SOCIAL_STATE.expandedVideo=null;
      var existing=document.getElementById("dv-social-modal");
      if(existing)existing.remove();
      render();
    }
  });

  var modal=div({background:cl.surface,borderRadius:"16px",maxWidth:"700px",width:"100%",
    overflow:"hidden",border:"1px solid "+cl.border,margin:"20px auto"});
  modal.addEventListener("click",function(e){e.stopPropagation();});

  // Close button
  var closeBtn=el("button",{style:{position:"absolute",top:"12px",right:"12px",background:"rgba(0,0,0,0.5)",
    color:"#fff",border:"none",width:"32px",height:"32px",borderRadius:"50%",fontSize:"16px",cursor:"pointer",
    zIndex:"1",display:"flex",alignItems:"center",justifyContent:"center"}});
  closeBtn.textContent="×";
  closeBtn.addEventListener("click",function(){
    SOCIAL_STATE.expandedVideo=null;
    var existing=document.getElementById("dv-social-modal");
    if(existing)existing.remove();
    render();
  });

  // Video embed
  var videoWrap=div({position:"relative",width:"100%",background:"#000"});
  videoWrap.appendChild(closeBtn);
  videoWrap.appendChild(embedVideo(video.video_url));
  modal.appendChild(videoWrap);

  // Content
  var content=div({padding:"20px"});

  content.appendChild(div({color:cl.white,fontSize:"16px",fontWeight:"700",fontFamily:"'Inter',sans-serif",
    lineHeight:"1.4",marginBottom:"12px"},video.title));

  // Agent info row
  var agRow=div({display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px",
    padding:"12px",background:cl.raised,borderRadius:"10px"});
  if(agent.photo){
    var av2=el("img",{src:agent.photo,style:{width:"36px",height:"36px",borderRadius:"50%",objectFit:"cover"}});
    agRow.appendChild(av2);
  }else{
    var avP=div({width:"36px",height:"36px",borderRadius:"50%",background:cl.border,
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",color:cl.sub,fontWeight:"700"});
    avP.textContent=(agent.name||"?").charAt(0).toUpperCase();
    agRow.appendChild(avP);
  }
  var agInfo=div({});
  agInfo.appendChild(div({color:cl.white,fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},agent.name||"Agent"));
  if(agent.rera_no)agInfo.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},"RERA: "+agent.rera_no));
  agRow.appendChild(agInfo);

  var isFollowing=SOCIAL_STATE.followedAgents.indexOf(agent.id||video.agent_id)!==-1;
  var followBtn=el("button",{style:{marginLeft:"auto",padding:"6px 14px",borderRadius:"8px",fontSize:"10px",fontWeight:"700",
    fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
    background:isFollowing?hexAlpha(cl.gold,0.15):"transparent",color:isFollowing?cl.gold:cl.sub,
    border:"1px solid "+(isFollowing?hexAlpha(cl.gold,0.3):cl.border)}});
  followBtn.textContent=isFollowing?"Following":"+ Follow";
  followBtn.addEventListener("click",function(e){e.stopPropagation();_toggleFollowAgent(agent.id||video.agent_id);});
  agRow.appendChild(followBtn);
  content.appendChild(agRow);

  if(video.description){
    var desc=div({color:cl.subHi,fontSize:"13px",fontFamily:"'Inter',sans-serif",lineHeight:"1.7",marginBottom:"16px",
      whiteSpace:"pre-wrap"});
    desc.textContent=video.description;
    content.appendChild(desc);
  }

  // Metadata row
  var metaRow=div({display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"16px"});
  metaRow.appendChild(span({background:hexAlpha(cl.gold,0.1),color:cl.gold,fontSize:"10px",fontWeight:"600",
    fontFamily:"'Space Grotesk',monospace",padding:"4px 10px",borderRadius:"6px"},video.area));
  var catCol=_categoryColor(video.category);
  metaRow.appendChild(span({background:hexAlpha(catCol,0.15),color:catCol,fontSize:"10px",fontWeight:"600",
    fontFamily:"'Space Grotesk',monospace",padding:"4px 10px",borderRadius:"6px"},_categoryLabel(video.category)));
  if(video.property_type){
    metaRow.appendChild(span({background:hexAlpha("#6B7280",0.15),color:"#9CA3AF",fontSize:"10px",fontWeight:"600",
      fontFamily:"'Space Grotesk',monospace",padding:"4px 10px",borderRadius:"6px"},video.property_type));
  }
  if(video.tags&&video.tags.length){
    video.tags.forEach(function(tag){
      metaRow.appendChild(span({background:hexAlpha(cl.border,0.5),color:cl.sub,fontSize:"9px",
        fontFamily:"'Inter',sans-serif",padding:"3px 8px",borderRadius:"4px"},"#"+tag));
    });
  }
  content.appendChild(metaRow);

  // Action bar
  var actionBar=div({display:"flex",gap:"12px",alignItems:"center",paddingTop:"12px",borderTop:"1px solid "+cl.border});
  var liked=_isLiked(video.id);
  var likeBtn=el("button",{style:{display:"flex",alignItems:"center",gap:"6px",padding:"8px 16px",borderRadius:"8px",
    fontSize:"12px",fontWeight:"600",fontFamily:"'Inter',sans-serif",cursor:"pointer",
    background:liked?hexAlpha(cl.red,0.15):"transparent",color:liked?cl.red:cl.sub,
    border:"1px solid "+(liked?hexAlpha(cl.red,0.3):cl.border)}});
  likeBtn.textContent=(liked?"♥ Liked":"♡ Like")+" ("+formatViews(video.likes)+")";
  likeBtn.addEventListener("click",function(e){e.stopPropagation();_toggleLike(video);});
  actionBar.appendChild(likeBtn);

  actionBar.appendChild(span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},
    formatViews(video.views)+" views"));

  var shareBtn=el("button",{style:{marginLeft:"auto",padding:"8px 14px",borderRadius:"8px",fontSize:"11px",
    fontFamily:"'Space Grotesk',monospace",cursor:"pointer",background:"transparent",color:cl.sub,
    border:"1px solid "+cl.border}});
  shareBtn.textContent="Share";
  shareBtn.addEventListener("click",function(e){
    e.stopPropagation();
    if(navigator.clipboard){navigator.clipboard.writeText(video.video_url);shareBtn.textContent="Copied!";
      setTimeout(function(){shareBtn.textContent="Share";},2000);}
  });
  actionBar.appendChild(shareBtn);
  actionBar.appendChild(span({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},_socialTimeAgo(video.created_at)));
  content.appendChild(actionBar);

  // "More from this agent"
  var relatedAgent=SOCIAL_STATE.videos.filter(function(v){return v.agent_id===video.agent_id&&v.id!==video.id;}).slice(0,4);
  if(relatedAgent.length){
    var moreAgentWrap=div({marginTop:"20px",paddingTop:"16px",borderTop:"1px solid "+cl.border});
    moreAgentWrap.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",
      fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"More from "+(agent.name||"this agent")));
    var relGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"});
    relatedAgent.forEach(function(rv){relGrid.appendChild(_renderVideoCard(rv,cl));});
    moreAgentWrap.appendChild(relGrid);
    content.appendChild(moreAgentWrap);
  }

  // "More from this area"
  var relatedArea=SOCIAL_STATE.videos.filter(function(v){return v.area===video.area&&v.id!==video.id&&v.agent_id!==video.agent_id;}).slice(0,4);
  if(relatedArea.length){
    var moreAreaWrap=div({marginTop:"20px",paddingTop:"16px",borderTop:"1px solid "+cl.border});
    moreAreaWrap.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",
      fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"12px"},"More from "+video.area));
    var areaGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"});
    relatedArea.forEach(function(rv){areaGrid.appendChild(_renderVideoCard(rv,cl));});
    moreAreaWrap.appendChild(areaGrid);
    content.appendChild(moreAreaWrap);
  }

  modal.appendChild(content);
  overlay.appendChild(modal);
  return overlay;
}

// --- Explore Tab -------------------------------------------------------------
function _renderExplore(wrap,cl){
  var filterBar=div({display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"14px",alignItems:"center"});

  var areaSelect=el("select",{style:{background:cl.surface,border:"1px solid "+cl.border,color:cl.subHi,
    padding:"8px 10px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Inter',sans-serif",minWidth:"120px"}});
  areaSelect.appendChild(el("option",{value:""},"All Areas"));
  AREA_NAMES.forEach(function(n){
    var opt=el("option",{value:n});opt.textContent=n;
    if(SOCIAL_STATE.filter.area===n)opt.selected=true;
    areaSelect.appendChild(opt);
  });
  areaSelect.onchange=function(){SOCIAL_STATE.filter.area=this.value;_fetchSocialVideos(true);};
  filterBar.appendChild(areaSelect);

  var catSelect=el("select",{style:{background:cl.surface,border:"1px solid "+cl.border,color:cl.subHi,
    padding:"8px 10px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Inter',sans-serif",minWidth:"120px"}});
  catSelect.appendChild(el("option",{value:""},"All Categories"));
  SOCIAL_CATEGORIES.forEach(function(c){
    var opt=el("option",{value:c.v});opt.textContent=c.l;
    if(SOCIAL_STATE.filter.category===c.v)opt.selected=true;
    catSelect.appendChild(opt);
  });
  catSelect.onchange=function(){SOCIAL_STATE.filter.category=this.value;_fetchSocialVideos(true);};
  filterBar.appendChild(catSelect);

  var sortSelect=el("select",{style:{background:cl.surface,border:"1px solid "+cl.border,color:cl.subHi,
    padding:"8px 10px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Inter',sans-serif"}});
  [{v:"newest",l:"Newest"},{v:"most-viewed",l:"Most Viewed"},{v:"most-liked",l:"Most Liked"}].forEach(function(s){
    var opt=el("option",{value:s.v});opt.textContent=s.l;
    if(SOCIAL_STATE.filter.sort===s.v)opt.selected=true;
    sortSelect.appendChild(opt);
  });
  sortSelect.onchange=function(){SOCIAL_STATE.filter.sort=this.value;_fetchSocialVideos(true);};
  filterBar.appendChild(sortSelect);

  var feedActive=SOCIAL_STATE.filter.myFeed;
  var feedBtn=el("button",{style:{padding:"7px 14px",borderRadius:"8px",fontSize:"10px",fontWeight:"700",
    fontFamily:"'Space Grotesk',monospace",cursor:"pointer",marginLeft:"auto",
    background:feedActive?hexAlpha(cl.gold,0.15):"transparent",color:feedActive?cl.gold:cl.sub,
    border:"1px solid "+(feedActive?hexAlpha(cl.gold,0.3):cl.border)}});
  feedBtn.textContent=feedActive?"My Feed ON":"My Feed";
  feedBtn.addEventListener("click",function(){SOCIAL_STATE.filter.myFeed=!SOCIAL_STATE.filter.myFeed;_fetchSocialVideos(true);});
  filterBar.appendChild(feedBtn);
  wrap.appendChild(filterBar);

  if(SOCIAL_STATE.videosLoading&&!SOCIAL_STATE.videos.length){
    wrap.appendChild(_socialSpinner(cl));return wrap;
  }

  if(!SOCIAL_STATE.videos.length&&!SOCIAL_STATE.videosLoading){
    if(SOCIAL_STATE.filter.myFeed){
      wrap.appendChild(_socialEmpty(cl,"Follow areas or agents to see content in your feed"));
    }else{
      wrap.appendChild(_socialEmpty(cl,"No videos yet. Be the first to post!"));
    }
    return wrap;
  }

  var grid=div({display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"14px"});
  SOCIAL_STATE.videos.forEach(function(v){grid.appendChild(_renderVideoCard(v,cl));});
  wrap.appendChild(grid);

  if(SOCIAL_STATE.videosHasMore){
    var loadMoreWrap=div({textAlign:"center",padding:"20px"});
    if(SOCIAL_STATE.videosLoading){
      loadMoreWrap.appendChild(_socialSpinner(cl));
    }else{
      var loadBtn=el("button",{style:{padding:"10px 28px",borderRadius:"10px",fontSize:"12px",fontWeight:"700",
        fontFamily:"'Space Grotesk',monospace",cursor:"pointer",background:"transparent",color:cl.gold,
        border:"1px solid "+cl.goldDim}});
      loadBtn.textContent="Load More";
      loadBtn.addEventListener("click",function(){_fetchSocialVideos(false);});
      loadMoreWrap.appendChild(loadBtn);
    }
    wrap.appendChild(loadMoreWrap);
  }

  return wrap;
}

// --- Agent Profile Card ------------------------------------------------------
function _renderAgentCard(agent,cl){
  var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"16px",
    cursor:"pointer",transition:"border-color 0.2s,transform 0.2s"});
  card.addEventListener("mouseenter",function(){card.style.borderColor=cl.goldDim;card.style.transform="translateY(-2px)";});
  card.addEventListener("mouseleave",function(){card.style.borderColor=cl.border;card.style.transform="translateY(0)";});
  card.addEventListener("click",function(){
    SOCIAL_STATE.viewAgent=agent;
    _fetchAgentVideos(agent.id);
  });

  var header=div({display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"});
  if(agent.photo){
    var av=el("img",{src:agent.photo,style:{width:"40px",height:"40px",borderRadius:"50%",objectFit:"cover",
      border:"2px solid "+cl.border}});
    av.onerror=function(){av.style.display="none";};
    header.appendChild(av);
  }else{
    var avP=div({width:"40px",height:"40px",borderRadius:"50%",background:cl.raised,
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",color:cl.sub,fontWeight:"700",
      border:"2px solid "+cl.border});
    avP.textContent=(agent.name||"?").charAt(0).toUpperCase();
    header.appendChild(avP);
  }
  var nameCol=div({});
  nameCol.appendChild(div({color:cl.white,fontSize:"14px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},agent.name));
  if(agent.rera_no){
    nameCol.appendChild(span({color:"#3B82F6",fontSize:"9px",fontFamily:"'Space Grotesk',monospace",fontWeight:"700",display:"block",marginTop:"2px"},"RERA VERIFIED"));
  }
  header.appendChild(nameCol);
  if(agent.subscription==="gold"||agent.subscription==="platinum"){
    var badge=span({color:agent.subscription==="platinum"?"#A78BFA":cl.gold,fontSize:"9px",fontWeight:"700",
      fontFamily:"'Space Grotesk',monospace",padding:"3px 8px",borderRadius:"4px",marginLeft:"auto",
      background:hexAlpha(agent.subscription==="platinum"?"#8B5CF6":cl.gold,0.15),
      border:"1px solid "+hexAlpha(agent.subscription==="platinum"?"#8B5CF6":cl.gold,0.3)});
    badge.textContent=agent.subscription.toUpperCase();
    header.appendChild(badge);
  }
  card.appendChild(header);

  if(agent.areas&&agent.areas.length){
    var areasRow=div({display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"10px"});
    agent.areas.slice(0,4).forEach(function(a){
      areasRow.appendChild(span({background:hexAlpha(cl.gold,0.08),color:cl.gold,fontSize:"9px",
        fontFamily:"'Space Grotesk',monospace",padding:"2px 7px",borderRadius:"4px"},a));
    });
    if(agent.areas.length>4){
      areasRow.appendChild(span({color:cl.sub,fontSize:"9px",fontFamily:"'Inter',sans-serif"},"+"+(agent.areas.length-4)+" more"));
    }
    card.appendChild(areasRow);
  }

  var statsRow=div({display:"flex",gap:"16px",paddingTop:"10px",borderTop:"1px solid "+cl.border});
  [{l:"Videos",v:agent.video_count||0},{l:"Followers",v:agent.follower_count||0}].forEach(function(s){
    statsRow.appendChild(div({textAlign:"center"},[
      div({color:cl.white,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},String(s.v)),
      div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},s.l)
    ]));
  });
  if(agent.rating>0){
    var stars="";for(var i=0;i<5;i++)stars+=i<Math.round(agent.rating)?"★":"☆";
    statsRow.appendChild(div({textAlign:"center",marginLeft:"auto"},[
      div({color:cl.gold,fontSize:"13px",letterSpacing:"2px"},stars),
      div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},"Rating")
    ]));
  }
  card.appendChild(statsRow);
  return card;
}

// --- Agent Full Profile View ------------------------------------------------
function _renderAgentProfile(wrap,cl){
  var agent=SOCIAL_STATE.viewAgent;
  if(!agent)return wrap;

  var backBtn=el("button",{style:{padding:"6px 14px",borderRadius:"8px",fontSize:"11px",fontWeight:"600",
    fontFamily:"'Space Grotesk',monospace",cursor:"pointer",background:"transparent",color:cl.sub,
    border:"1px solid "+cl.border,marginBottom:"16px"}});
  backBtn.textContent="← Back to Agents";
  backBtn.addEventListener("click",function(){SOCIAL_STATE.viewAgent=null;render();});
  wrap.appendChild(backBtn);

  var headerCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"16px"});
  var topRow=div({display:"flex",alignItems:"center",gap:"14px",marginBottom:"14px"});
  if(agent.photo){
    var av=el("img",{src:agent.photo,style:{width:"56px",height:"56px",borderRadius:"50%",objectFit:"cover",
      border:"2px solid "+cl.goldDim}});
    topRow.appendChild(av);
  }else{
    var avP=div({width:"56px",height:"56px",borderRadius:"50%",background:cl.raised,
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",color:cl.sub,fontWeight:"700",
      border:"2px solid "+cl.border});
    avP.textContent=(agent.name||"?").charAt(0).toUpperCase();
    topRow.appendChild(avP);
  }
  var infoCol=div({flex:"1"});
  infoCol.appendChild(div({color:cl.white,fontSize:"18px",fontWeight:"700",fontFamily:"'Inter',sans-serif"},agent.name));
  if(agent.rera_no)infoCol.appendChild(div({color:"#3B82F6",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginTop:"3px"},"RERA: "+agent.rera_no));
  if(agent.phone)infoCol.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},agent.phone));
  topRow.appendChild(infoCol);

  var isFollowing=SOCIAL_STATE.followedAgents.indexOf(agent.id)!==-1;
  var followBtn=el("button",{style:{padding:"8px 18px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",
    fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
    background:isFollowing?"transparent":"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",
    color:isFollowing?cl.gold:"#070B14",
    border:isFollowing?"1px solid "+hexAlpha(cl.gold,0.3):"none"}});
  followBtn.textContent=isFollowing?"Following":"+ Follow";
  followBtn.addEventListener("click",function(){_toggleFollowAgent(agent.id);});
  topRow.appendChild(followBtn);
  headerCard.appendChild(topRow);

  if(agent.bio){
    var bioEl=div({color:cl.subHi,fontSize:"13px",fontFamily:"'Inter',sans-serif",lineHeight:"1.7",marginBottom:"14px"});
    bioEl.textContent=agent.bio;
    headerCard.appendChild(bioEl);
  }

  var statsGrid=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"14px"});
  [{l:"Videos",v:agent.video_count||0,c:cl.gold},{l:"Followers",v:agent.follower_count||0,c:"#3B82F6"},
   {l:"Rating",v:agent.rating?agent.rating.toFixed(1):"N/A",c:cl.green}].forEach(function(s){
    statsGrid.appendChild(div({background:cl.raised,borderRadius:"10px",padding:"12px",textAlign:"center"},[
      div({color:s.c,fontSize:"18px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},String(s.v)),
      div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginTop:"3px"},s.l)
    ]));
  });
  headerCard.appendChild(statsGrid);

  if(agent.areas&&agent.areas.length){
    headerCard.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",
      fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"6px"},"AREAS"));
    var areasWrap=div({display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"10px"});
    agent.areas.forEach(function(a){
      areasWrap.appendChild(span({background:hexAlpha(cl.gold,0.1),color:cl.gold,fontSize:"10px",
        fontFamily:"'Space Grotesk',monospace",padding:"4px 10px",borderRadius:"6px"},a));
    });
    headerCard.appendChild(areasWrap);
  }

  if(agent.specialties&&agent.specialties.length){
    headerCard.appendChild(span({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",
      fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"6px"},"SPECIALTIES"));
    var specWrap=div({display:"flex",gap:"6px",flexWrap:"wrap"});
    agent.specialties.forEach(function(s){
      specWrap.appendChild(span({background:hexAlpha("#8B5CF6",0.12),color:"#A78BFA",fontSize:"10px",
        fontFamily:"'Space Grotesk',monospace",padding:"4px 10px",borderRadius:"6px"},s));
    });
    headerCard.appendChild(specWrap);
  }
  wrap.appendChild(headerCard);

  wrap.appendChild(div({marginBottom:"10px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",
      fontFamily:"'Space Grotesk',monospace"},"Videos by "+agent.name)
  ]));

  if(!SOCIAL_STATE.viewAgentVideos.length){
    wrap.appendChild(_socialEmpty(cl,"No videos yet"));
  }else{
    var vGrid=div({display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"14px"});
    SOCIAL_STATE.viewAgentVideos.forEach(function(v){
      v.agent_profiles=agent;
      vGrid.appendChild(_renderVideoCard(v,cl));
    });
    wrap.appendChild(vGrid);
  }
  return wrap;
}

// --- Agents Tab --------------------------------------------------------------
function _renderAgents(wrap,cl){
  if(SOCIAL_STATE.viewAgent)return _renderAgentProfile(wrap,cl);

  var searchBar=div({display:"flex",gap:"8px",marginBottom:"14px",flexWrap:"wrap"});
  var searchInp=el("input",{style:{flex:"1",minWidth:"150px",background:cl.surface,border:"1px solid "+cl.border,
    color:cl.white,padding:"8px 12px",borderRadius:"8px",fontSize:"12px",fontFamily:"'Inter',sans-serif",
    outline:"none",caretColor:cl.gold},placeholder:"Search by name or area...",type:"text"});
  searchInp.value=SOCIAL_STATE.agentSearch;
  searchInp.addEventListener("input",function(){SOCIAL_STATE.agentSearch=searchInp.value;});
  searchInp.addEventListener("keydown",function(e){if(e.key==="Enter")_fetchAgentList();});
  searchBar.appendChild(searchInp);

  var sortSel=el("select",{style:{background:cl.surface,border:"1px solid "+cl.border,color:cl.subHi,
    padding:"8px 10px",borderRadius:"8px",fontSize:"11px",fontFamily:"'Inter',sans-serif"}});
  [{v:"most-videos",l:"Most Videos"},{v:"most-followers",l:"Most Followers"},{v:"newest",l:"Newest"}].forEach(function(s){
    var opt=el("option",{value:s.v});opt.textContent=s.l;
    if(SOCIAL_STATE.agentSort===s.v)opt.selected=true;
    sortSel.appendChild(opt);
  });
  sortSel.onchange=function(){SOCIAL_STATE.agentSort=this.value;_fetchAgentList();};
  searchBar.appendChild(sortSel);

  var searchBtn=el("button",{style:{padding:"8px 16px",borderRadius:"8px",fontSize:"11px",fontWeight:"700",
    fontFamily:"'Space Grotesk',monospace",cursor:"pointer",background:cl.gold,color:"#070B14",border:"none"}});
  searchBtn.textContent="Search";
  searchBtn.addEventListener("click",function(){_fetchAgentList();});
  searchBar.appendChild(searchBtn);
  wrap.appendChild(searchBar);

  if(SOCIAL_STATE.agentsLoading){wrap.appendChild(_socialSpinner(cl));return wrap;}
  if(!SOCIAL_STATE.agentList.length){wrap.appendChild(_socialEmpty(cl,"No agents found"));return wrap;}

  var grid=div({display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"14px"});
  SOCIAL_STATE.agentList.forEach(function(a){grid.appendChild(_renderAgentCard(a,cl));});
  wrap.appendChild(grid);
  return wrap;
}

// --- My Profile Tab ----------------------------------------------------------
function _renderMyProfile(wrap,cl){
  var profile=SOCIAL_STATE.myProfile;
  var hasProfile=profile&&profile.name;

  if(!hasProfile){
    // Registration form
    wrap.appendChild(div({marginBottom:"16px"},[
      span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",
        fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"Create Agent Profile"),
      span({color:cl.sub,fontSize:"12px",fontFamily:"'Inter',sans-serif"},"Register to start posting videos and building your audience")
    ]));
    var formCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px"});
    var f=SOCIAL_STATE.regForm;
    var fg=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px"});
    fg.appendChild(fld("Name *",inp(I(),"Your full name","text",f.name,function(v){SOCIAL_STATE.regForm.name=v;})));
    fg.appendChild(fld("Phone *",inp(I(),"+971 xxx","text",f.phone,function(v){SOCIAL_STATE.regForm.phone=v;})));
    fg.appendChild(fld("RERA BRN",inp(I(),"RERA number","text",f.rera,function(v){SOCIAL_STATE.regForm.rera=v;})));
    formCard.appendChild(fg);
    formCard.appendChild(fld("Bio",inp(I(),"Tell buyers about yourself...","text",f.bio,function(v){SOCIAL_STATE.regForm.bio=v;})));

    // Areas multi-select
    formCard.appendChild(lbl("Areas (select your specialties)"));
    var areasWrap=div({display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px",maxHeight:"150px",overflowY:"auto",
      padding:"10px",background:cl.bg,borderRadius:"8px",border:"1px solid "+cl.border});
    var topAreas=["Dubai Marina","Downtown Dubai","Business Bay","Palm Jumeirah","JVC","Dubai Hills Estate",
      "MBR City","Dubai Creek Harbour","DIFC","Emaar Beachfront","JBR","Arabian Ranches","DAMAC Hills",
      "Sobha Hartland","Meydan","Town Square","Al Furjan","Dubai South","City Walk"];
    topAreas.forEach(function(aName){
      var selected=f.areas.indexOf(aName)!==-1;
      var chip=el("button",{style:{padding:"4px 10px",borderRadius:"6px",fontSize:"10px",fontWeight:"600",
        fontFamily:"'Space Grotesk',monospace",cursor:"pointer",border:"1px solid "+(selected?hexAlpha(cl.gold,0.4):cl.border),
        background:selected?hexAlpha(cl.gold,0.15):"transparent",color:selected?cl.gold:cl.sub}});
      chip.textContent=aName;
      chip.addEventListener("click",function(){
        var idx=SOCIAL_STATE.regForm.areas.indexOf(aName);
        if(idx!==-1)SOCIAL_STATE.regForm.areas.splice(idx,1);
        else SOCIAL_STATE.regForm.areas.push(aName);
        render();
      });
      areasWrap.appendChild(chip);
    });
    formCard.appendChild(areasWrap);

    // Specialties
    formCard.appendChild(lbl("Specialties"));
    var specWrap=div({display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px"});
    ["Luxury","Off-Plan","Commercial","Rental","Villa","Affordable","Investment","New Launch"].forEach(function(s){
      var selected=f.specialties.indexOf(s.toLowerCase())!==-1;
      var chip=el("button",{style:{padding:"4px 10px",borderRadius:"6px",fontSize:"10px",fontWeight:"600",
        fontFamily:"'Space Grotesk',monospace",cursor:"pointer",border:"1px solid "+(selected?hexAlpha("#8B5CF6",0.4):cl.border),
        background:selected?hexAlpha("#8B5CF6",0.15):"transparent",color:selected?"#A78BFA":cl.sub}});
      chip.textContent=s;
      chip.addEventListener("click",function(){
        var val=s.toLowerCase();
        var idx=SOCIAL_STATE.regForm.specialties.indexOf(val);
        if(idx!==-1)SOCIAL_STATE.regForm.specialties.splice(idx,1);
        else SOCIAL_STATE.regForm.specialties.push(val);
        render();
      });
      specWrap.appendChild(chip);
    });
    formCard.appendChild(specWrap);

    // Photo upload
    formCard.appendChild(lbl("Profile Photo"));
    var photoWrap=div({display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"});
    var photoInput=el("input",{type:"file",accept:"image/*",style:{display:"none"}});
    photoInput.addEventListener("change",function(){
      var file=photoInput.files[0];
      if(!file)return;
      if(file.size>100000){
        var reader=new FileReader();
        reader.onload=function(){
          var img=new Image();
          img.onload=function(){
            var canvas=document.createElement("canvas");
            var maxW=150;var scale=maxW/img.width;
            canvas.width=maxW;canvas.height=Math.round(img.height*scale);
            canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
            SOCIAL_STATE.regForm.photo=canvas.toDataURL("image/jpeg",0.6);
            render();
          };
          img.src=reader.result;
        };
        reader.readAsDataURL(file);
      }else{
        var r=new FileReader();r.onload=function(){SOCIAL_STATE.regForm.photo=r.result;render();};
        r.readAsDataURL(file);
      }
    });
    var photoBtn=el("button",{style:{padding:"8px 16px",borderRadius:"8px",fontSize:"11px",
      fontFamily:"'Space Grotesk',monospace",cursor:"pointer",background:"transparent",color:cl.sub,
      border:"1px solid "+cl.border}});
    photoBtn.textContent=f.photo?"Photo Selected - Change":"Upload Photo";
    photoBtn.addEventListener("click",function(){photoInput.click();});
    photoWrap.appendChild(photoInput);
    photoWrap.appendChild(photoBtn);
    if(f.photo){
      photoWrap.appendChild(el("img",{src:f.photo,style:{width:"40px",height:"40px",borderRadius:"50%",objectFit:"cover"}}));
    }
    formCard.appendChild(photoWrap);

    // Register button
    var regBtn=el("button",{style:{width:"100%",padding:"12px",borderRadius:"10px",border:"none",
      background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:"#070B14",fontSize:"13px",
      fontWeight:"800",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
    regBtn.textContent="Create Profile";
    regBtn.addEventListener("click",function(){_registerAgent();});
    formCard.appendChild(regBtn);
    wrap.appendChild(formCard);
    return wrap;
  }

  // --- Existing profile view ---
  if(!profile.name&&profile.id){_fetchMyProfile();wrap.appendChild(_socialSpinner(cl));return wrap;}

  var profCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"14px",padding:"20px",marginBottom:"16px"});
  var pRow=div({display:"flex",alignItems:"center",gap:"14px",marginBottom:"14px"});
  if(profile.photo){
    var av=el("img",{src:profile.photo,style:{width:"50px",height:"50px",borderRadius:"50%",objectFit:"cover",
      border:"2px solid "+cl.goldDim}});
    pRow.appendChild(av);
  }else{
    var avP=div({width:"50px",height:"50px",borderRadius:"50%",background:cl.raised,
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",color:cl.sub,fontWeight:"700"});
    avP.textContent=(profile.name||"?").charAt(0).toUpperCase();
    pRow.appendChild(avP);
  }
  var pInfo=div({flex:"1"});
  pInfo.appendChild(div({color:cl.white,fontSize:"16px",fontWeight:"700",fontFamily:"'Inter',sans-serif"},profile.name));
  if(profile.rera_no)pInfo.appendChild(div({color:"#3B82F6",fontSize:"10px",fontFamily:"'Space Grotesk',monospace",marginTop:"2px"},"RERA: "+profile.rera_no));
  pRow.appendChild(pInfo);

  var editProfBtn=el("button",{style:{padding:"6px 14px",borderRadius:"8px",fontSize:"10px",
    fontFamily:"'Space Grotesk',monospace",cursor:"pointer",background:"transparent",color:cl.sub,
    border:"1px solid "+cl.border}});
  editProfBtn.textContent="Edit Profile";
  editProfBtn.addEventListener("click",function(){
    SOCIAL_STATE.regForm={name:profile.name||"",phone:profile.phone||"",rera:profile.rera_no||"",
      bio:profile.bio||"",areas:profile.areas?profile.areas.slice():[],specialties:profile.specialties?profile.specialties.slice():[],photo:profile.photo||null};
    SOCIAL_STATE.myProfile={id:profile.id};
    render();
  });
  pRow.appendChild(editProfBtn);
  profCard.appendChild(pRow);

  // Stats
  var totalViews=0;var totalLikes=0;
  SOCIAL_STATE.myVideos.forEach(function(v){totalViews+=(v.views||0);totalLikes+=(v.likes||0);});
  var myStats=div({display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"});
  [{l:"Total Views",v:formatViews(totalViews),c:cl.gold},{l:"Total Likes",v:formatViews(totalLikes),c:cl.red},
   {l:"Followers",v:String(profile.follower_count||0),c:"#3B82F6"}].forEach(function(s){
    myStats.appendChild(div({background:cl.raised,borderRadius:"10px",padding:"12px",textAlign:"center"},[
      div({color:s.c,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},s.v),
      div({color:cl.sub,fontSize:"9px",fontFamily:"'Space Grotesk',monospace",marginTop:"3px"},s.l)
    ]));
  });
  profCard.appendChild(myStats);
  wrap.appendChild(profCard);

  // Upload Video button
  var uploadBtn=el("button",{style:{width:"100%",padding:"12px",borderRadius:"10px",border:"none",marginBottom:"16px",
    background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:"#070B14",fontSize:"13px",
    fontWeight:"800",fontFamily:"'Space Grotesk',monospace",cursor:"pointer"}});
  uploadBtn.textContent=SOCIAL_STATE.videoFormOpen?"✕ Cancel":"+ Upload Video";
  uploadBtn.addEventListener("click",function(){
    SOCIAL_STATE.videoFormOpen=!SOCIAL_STATE.videoFormOpen;
    if(!SOCIAL_STATE.videoFormOpen){
      SOCIAL_STATE.videoForm={url:"",title:"",description:"",area:"",category:"walkthrough",propertyType:"",tags:""};
      SOCIAL_STATE.editingVideoId=null;
    }
    render();
  });
  wrap.appendChild(uploadBtn);

  // Video upload form
  if(SOCIAL_STATE.videoFormOpen){
    var vfCard=div({background:cl.surface,border:"1px solid "+cl.goldDim,borderRadius:"14px",padding:"20px",marginBottom:"16px"});
    vfCard.appendChild(span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",
      fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"14px"},
      SOCIAL_STATE.editingVideoId?"Edit Video":"Post New Video"));
    var vf=SOCIAL_STATE.videoForm;

    vfCard.appendChild(fld("Video URL *",inp(I(),"https://youtube.com/watch?v=... or instagram.com/reel/...","url",vf.url,function(v){SOCIAL_STATE.videoForm.url=v;})));

    if(vf.url){
      var valid=isValidVideoUrl(vf.url);
      var thumbUrl=getVideoThumbnail(vf.url);
      var feedbackRow=div({display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"});
      feedbackRow.appendChild(span({color:valid?cl.green:cl.red,fontSize:"10px",fontFamily:"'Space Grotesk',monospace"},
        valid?"Valid URL":"Invalid URL — use YouTube, Instagram or TikTok"));
      if(thumbUrl){
        var thumbPreview=el("img",{src:thumbUrl,style:{width:"60px",height:"34px",borderRadius:"4px",objectFit:"cover"}});
        thumbPreview.onerror=function(){thumbPreview.style.display="none";};
        feedbackRow.appendChild(thumbPreview);
      }
      vfCard.appendChild(feedbackRow);
    }

    vfCard.appendChild(fld("Title *",inp(I(),"e.g. Marina Gate 2BR Walkthrough","text",vf.title,function(v){SOCIAL_STATE.videoForm.title=v;})));
    vfCard.appendChild(fld("Description",inp(I(),"Describe the property or content...","text",vf.description,function(v){SOCIAL_STATE.videoForm.description=v;})));

    var vfg=div({display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"});
    var vfAreaW=div({});vfAreaW.appendChild(lbl("Area *"));
    var vfAreaSel=el("select",{style:S()});
    vfAreaSel.appendChild(el("option",{value:""},"Select Area"));
    AREA_NAMES.forEach(function(n){var o=el("option",{value:n});o.textContent=n;if(vf.area===n)o.selected=true;vfAreaSel.appendChild(o);});
    vfAreaSel.onchange=function(){SOCIAL_STATE.videoForm.area=this.value;};
    vfAreaW.appendChild(vfAreaSel);vfg.appendChild(vfAreaW);

    var vfCatW=div({});vfCatW.appendChild(lbl("Category *"));
    var vfCatSel=el("select",{style:S()});
    SOCIAL_CATEGORIES.forEach(function(c){var o=el("option",{value:c.v});o.textContent=c.l;if(vf.category===c.v)o.selected=true;vfCatSel.appendChild(o);});
    vfCatSel.onchange=function(){SOCIAL_STATE.videoForm.category=this.value;};
    vfCatW.appendChild(vfCatSel);vfg.appendChild(vfCatW);

    var vfPtW=div({});vfPtW.appendChild(lbl("Property Type"));
    var vfPtSel=el("select",{style:S()});
    SOCIAL_PROP_TYPES.forEach(function(p){var o=el("option",{value:p.v});o.textContent=p.l;if(vf.propertyType===p.v)o.selected=true;vfPtSel.appendChild(o);});
    vfPtSel.onchange=function(){SOCIAL_STATE.videoForm.propertyType=this.value;};
    vfPtW.appendChild(vfPtSel);vfg.appendChild(vfPtW);
    vfCard.appendChild(vfg);

    vfCard.appendChild(fld("Tags (comma separated)",inp(I(),"e.g. luxury, sea-view, new","text",vf.tags,function(v){SOCIAL_STATE.videoForm.tags=v;})));

    var postVBtn=el("button",{style:{width:"100%",padding:"12px",borderRadius:"10px",border:"none",
      background:"linear-gradient(135deg,"+cl.gold+","+cl.goldDim+")",color:"#070B14",fontSize:"13px",
      fontWeight:"800",fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
      opacity:SOCIAL_STATE.videoPosting?"0.5":"1"}});
    postVBtn.textContent=SOCIAL_STATE.videoPosting?"Posting...":"Post Video";
    postVBtn.addEventListener("click",function(){_postVideo();});
    vfCard.appendChild(postVBtn);
    wrap.appendChild(vfCard);
  }

  // My Videos list
  wrap.appendChild(div({marginBottom:"10px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",
      fontFamily:"'Space Grotesk',monospace"},"My Videos ("+SOCIAL_STATE.myVideos.length+")")
  ]));

  if(SOCIAL_STATE.myVideosLoading){wrap.appendChild(_socialSpinner(cl));return wrap;}

  if(!SOCIAL_STATE.myVideos.length){
    wrap.appendChild(_socialEmpty(cl,"No videos yet. Upload your first video above!"));
    return wrap;
  }

  SOCIAL_STATE.myVideos.forEach(function(v){
    var row=div({display:"flex",gap:"12px",alignItems:"center",background:cl.surface,border:"1px solid "+cl.border,
      borderRadius:"10px",padding:"10px",marginBottom:"8px"});
    var thumbSrc=v.thumbnail||getVideoThumbnail(v.video_url);
    if(thumbSrc){
      var img=el("img",{src:thumbSrc,style:{width:"80px",height:"45px",borderRadius:"6px",objectFit:"cover",flexShrink:"0"}});
      img.onerror=function(){img.style.display="none";};
      row.appendChild(img);
    }
    var infoCol=div({flex:"1",overflow:"hidden"});
    infoCol.appendChild(div({color:cl.white,fontSize:"12px",fontWeight:"600",fontFamily:"'Inter',sans-serif",
      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},v.title));
    infoCol.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"3px"},
      v.area+" · "+formatViews(v.views)+" views · "+formatViews(v.likes)+" likes · "+_socialTimeAgo(v.created_at)));
    row.appendChild(infoCol);
    var delBtn=el("button",{style:{padding:"6px 10px",borderRadius:"6px",fontSize:"10px",
      fontFamily:"'Space Grotesk',monospace",cursor:"pointer",background:hexAlpha(cl.red,0.1),color:cl.red,
      border:"1px solid "+hexAlpha(cl.red,0.3),flexShrink:"0"}});
    delBtn.textContent="Delete";
    (function(vid){delBtn.addEventListener("click",function(){_deleteVideo(vid);});})(v.id);
    row.appendChild(delBtn);
    wrap.appendChild(row);
  });

  return wrap;
}

// --- Following Tab -----------------------------------------------------------
function _renderFollowing(wrap,cl){
  // Areas I Follow
  wrap.appendChild(div({marginBottom:"10px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",
      fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"Areas I Follow"),
    span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},
      SOCIAL_STATE.followedAreas.length+" areas followed")
  ]));

  if(SOCIAL_STATE.followedAreas.length){
    var areaGrid=div({display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"10px",marginBottom:"20px"});
    SOCIAL_STATE.followedAreas.forEach(function(area){
      var aCard=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",padding:"12px",
        display:"flex",alignItems:"center",justifyContent:"space-between"});
      var areaInfo=div({});
      areaInfo.appendChild(div({color:cl.white,fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},area));
      if(AREAS[area])areaInfo.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},"PSF: "+AREAS[area].psf+" AED"));
      aCard.appendChild(areaInfo);
      var unfollowBtn=el("button",{style:{padding:"5px 10px",borderRadius:"6px",fontSize:"9px",
        fontFamily:"'Space Grotesk',monospace",cursor:"pointer",background:hexAlpha(cl.red,0.1),color:cl.red,
        border:"1px solid "+hexAlpha(cl.red,0.3)}});
      unfollowBtn.textContent="Unfollow";
      (function(a){unfollowBtn.addEventListener("click",function(){_toggleFollowArea(a);});})(area);
      aCard.appendChild(unfollowBtn);
      areaGrid.appendChild(aCard);
    });
    wrap.appendChild(areaGrid);
  }else{
    wrap.appendChild(div({marginBottom:"20px"},[_socialEmpty(cl,"You are not following any areas yet")]));
  }

  // Quick follow
  wrap.appendChild(div({marginBottom:"10px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",
      fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"Popular Areas — Quick Follow"),
    span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"Toggle to follow/unfollow")
  ]));
  var popularAreas=["Dubai Marina","Downtown Dubai","Business Bay","Palm Jumeirah","JVC",
    "Dubai Hills Estate","MBR City","Dubai Creek Harbour","DIFC","Emaar Beachfront",
    "JBR","Arabian Ranches","Meydan","Sobha Hartland","DAMAC Hills","Town Square"];
  var qfWrap=div({display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"24px",padding:"12px",
    background:cl.surface,borderRadius:"10px",border:"1px solid "+cl.border});
  popularAreas.forEach(function(a){
    var isFollowed=SOCIAL_STATE.followedAreas.indexOf(a)!==-1;
    var toggle=el("button",{style:{padding:"6px 12px",borderRadius:"8px",fontSize:"10px",fontWeight:"600",
      fontFamily:"'Space Grotesk',monospace",cursor:"pointer",
      background:isFollowed?hexAlpha(cl.gold,0.15):"transparent",color:isFollowed?cl.gold:cl.sub,
      border:"1px solid "+(isFollowed?hexAlpha(cl.gold,0.3):cl.border),transition:"all 0.2s"}});
    toggle.textContent=(isFollowed?"✓ ":"")+a;
    (function(area){toggle.addEventListener("click",function(){_toggleFollowArea(area);});})(a);
    qfWrap.appendChild(toggle);
  });
  wrap.appendChild(qfWrap);

  // Agents I Follow
  wrap.appendChild(div({marginBottom:"10px"},[
    span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",
      fontFamily:"'Space Grotesk',monospace",display:"block",marginBottom:"4px"},"Agents I Follow"),
    span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},
      SOCIAL_STATE.followedAgents.length+" agents followed")
  ]));

  if(SOCIAL_STATE.followedAgents.length){
    var agentCards=div({display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"10px"});
    var knownAgents={};
    SOCIAL_STATE.agentList.forEach(function(a){knownAgents[a.id]=a;});
    SOCIAL_STATE.followedAgents.forEach(function(agentId){
      var ag=knownAgents[agentId];
      var card=div({background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",padding:"12px",
        display:"flex",alignItems:"center",gap:"10px"});
      if(ag&&ag.photo){
        var av=el("img",{src:ag.photo,style:{width:"32px",height:"32px",borderRadius:"50%",objectFit:"cover"}});
        card.appendChild(av);
      }else{
        var avP=div({width:"32px",height:"32px",borderRadius:"50%",background:cl.raised,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",color:cl.sub});
        avP.textContent=ag?(ag.name||"?").charAt(0).toUpperCase():"?";
        card.appendChild(avP);
      }
      var agInfo=div({flex:"1"});
      agInfo.appendChild(div({color:cl.white,fontSize:"12px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},ag?ag.name:"Agent #"+agentId));
      if(ag)agInfo.appendChild(div({color:cl.sub,fontSize:"10px",fontFamily:"'Inter',sans-serif"},(ag.video_count||0)+" videos"));
      card.appendChild(agInfo);
      var ufBtn=el("button",{style:{padding:"5px 10px",borderRadius:"6px",fontSize:"9px",
        fontFamily:"'Space Grotesk',monospace",cursor:"pointer",background:hexAlpha(cl.red,0.1),color:cl.red,
        border:"1px solid "+hexAlpha(cl.red,0.3)}});
      ufBtn.textContent="Unfollow";
      (function(aid){ufBtn.addEventListener("click",function(){_toggleFollowAgent(aid);});})(agentId);
      card.appendChild(ufBtn);
      agentCards.appendChild(card);
    });
    wrap.appendChild(agentCards);
  }else{
    wrap.appendChild(_socialEmpty(cl,"You are not following any agents yet"));
  }

  return wrap;
}

// --- Main Render Function ----------------------------------------------------
function renderSocial(){
  var cl=C();
  var wrap=div({padding:"16px 20px",maxWidth:"800px",margin:"0 auto",paddingBottom:"90px"});

  // Remove any existing modal
  var existingModal=document.getElementById("dv-social-modal");
  if(existingModal&&!SOCIAL_STATE.expandedVideo)existingModal.remove();

  // Header
  wrap.appendChild(div({display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"},[
    div({},[
      span({color:cl.gold,fontSize:"10px",letterSpacing:"0.14em",textTransform:"uppercase",
        fontFamily:"'Space Grotesk',monospace",display:"block"},"PropTech Video Platform"),
      span({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif"},"Real Estate Video Network for Dubai Agents")
    ])
  ]));

  // Sub-tab bar
  var tabBar=div({display:"flex",gap:"6px",marginBottom:"16px",overflowX:"auto",paddingBottom:"4px"});
  var tabs=[
    {v:"explore",l:"Explore"},
    {v:"agents",l:"Agent Profiles"},
    {v:"profile",l:"My Profile"},
    {v:"following",l:"Following"}
  ];
  tabs.forEach(function(tab){
    var active=SOCIAL_STATE.tab===tab.v;
    var tabBtn=el("button",{style:{padding:"7px 16px",borderRadius:"8px",fontSize:"10px",fontWeight:"700",
      fontFamily:"'Space Grotesk',monospace",cursor:"pointer",whiteSpace:"nowrap",
      background:active?hexAlpha(cl.gold,0.15):"transparent",color:active?cl.gold:cl.sub,
      border:"1px solid "+(active?hexAlpha(cl.gold,0.3):cl.border),transition:"all 0.2s"}});
    tabBtn.textContent=tab.l;
    tabBtn.addEventListener("click",function(){
      SOCIAL_STATE.tab=tab.v;
      SOCIAL_STATE.viewAgent=null;
      if(tab.v==="explore"&&!SOCIAL_STATE.videos.length)_fetchSocialVideos(true);
      if(tab.v==="agents"&&!SOCIAL_STATE.agentList.length)_fetchAgentList();
      if(tab.v==="profile"&&SOCIAL_STATE.myProfile&&SOCIAL_STATE.myProfile.id){_fetchMyProfile();_fetchMyVideos();}
      render();
    });
    tabBar.appendChild(tabBtn);
  });
  wrap.appendChild(tabBar);

  // Route to sub-tab
  if(SOCIAL_STATE.tab==="explore")_renderExplore(wrap,cl);
  else if(SOCIAL_STATE.tab==="agents")_renderAgents(wrap,cl);
  else if(SOCIAL_STATE.tab==="profile")_renderMyProfile(wrap,cl);
  else if(SOCIAL_STATE.tab==="following")_renderFollowing(wrap,cl);

  // Video modal overlay (appended to body)
  if(SOCIAL_STATE.expandedVideo){
    setTimeout(function(){
      var existing=document.getElementById("dv-social-modal");
      if(existing)existing.remove();
      var modal=_renderVideoModal(cl);
      modal.id="dv-social-modal";
      document.body.appendChild(modal);
    },0);
  }

  // Auto-fetch on first render
  if(SOCIAL_STATE.tab==="explore"&&!SOCIAL_STATE.videos.length&&!SOCIAL_STATE.videosLoading){
    setTimeout(function(){_fetchSocialVideos(true);},0);
  }

  return wrap;
}
