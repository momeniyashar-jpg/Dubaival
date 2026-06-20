// Copyright (c) 2024-2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- LOOKUP -------------------------------------------------------------------
function resolveDLDArea(area){
  if(!area)return area;
  if(typeof DLD_AREA_MAP!=="undefined"&&DLD_AREA_MAP[area])return DLD_AREA_MAP[area];
  return area;
}

function lookupBuilding(name,areaHint){
  areaHint=resolveDLDArea(areaHint);
  const filterByArea=function(results){
    if(!areaHint||!results||results.length===0)return results;
    const areaFiltered=results.filter(function(e){return !e[1].a||e[1].a===areaHint;});
    return areaFiltered.length>0?areaFiltered:results;
  };
  if(!name||name.length<3)return null;
  const k=name.toLowerCase().trim();
  // 1. Exact match
  if(DB[k])return DB[k];
  // 2. Alias map (handles "Tower 1" vs "T1" and other variants)
  if(ALIASES[k]&&DB[ALIASES[k]])return DB[ALIASES[k]];
  // 3. Normalize: replace "tower N" with "tN" and retry
  const norm=k.replace(/\btower\s+([0-9]+)/g,"t$1").replace(/\btower\s+([a-c])\b/g,"$1");
  if(DB[norm])return DB[norm];
  if(ALIASES[norm]&&DB[ALIASES[norm]])return DB[ALIASES[norm]];
  // 4. Prefix match — only if k is specific enough (>8 chars) to avoid wrong tower matches
  if(k.length>8){
    const prefix=Object.entries(DB).find(function(e){return e[0].startsWith(k)||k.startsWith(e[0])});
    if(prefix)return prefix[1];
  }
  // 5. Contains match — but skip if result is a base entry when tower-specific exists
  const allContains=Object.entries(DB).filter(function(e){return k.includes(e[0])||e[0].includes(k);});
  if(allContains.length>0){
    // Prefer area match
    const areaMatch=allContains.filter(function(e){return !areaHint||e[1].a===areaHint;});
    const pool=areaMatch.length>0?areaMatch:allContains;
    // Prefer exact length match or longest key match
    const best=pool.sort(function(a,b){
      const aExact=a[0]===k?1:0;
      const bExact=b[0]===k?1:0;
      return bExact-aExact||b[0].length-a[0].length;
    })[0];
    return best[1];
  }
  // 6. Word match
  const words=k.split(" ").filter(function(w){return w.length>2;});
  if(words.length>=2){
    const wordMatch=Object.entries(DB).find(function(e){return words.every(function(w){return e[0].includes(w);});});
    if(wordMatch)return wordMatch[1];
  }
  return null;
}

function lookupCommercial(name,areaHint){
  if(typeof DB_COM==="undefined"||!name||name.length<2)return null;
  areaHint=resolveDLDArea(areaHint);
  var k=name.toLowerCase().trim();
  if(DB_COM[k])return DB_COM[k];
  var norm=k.replace(/\btower\s+([0-9]+)/g,"t$1");
  if(DB_COM[norm])return DB_COM[norm];
  if(k.length>6){
    var hit=Object.entries(DB_COM).find(function(e){return e[0].startsWith(k)||k.startsWith(e[0]);});
    if(hit)return hit[1];
  }
  var all=Object.entries(DB_COM).filter(function(e){return k.includes(e[0])||e[0].includes(k);});
  if(all.length>0){
    if(areaHint){var am=all.filter(function(e){return e[1].a===areaHint;});if(am.length)all=am;}
    return all.sort(function(a,b){return b[0].length-a[0].length;})[0][1];
  }
  return null;
}

function lookupLand(name,areaHint){
  if(typeof DB_LAND==="undefined"||!name||name.length<2)return null;
  areaHint=resolveDLDArea(areaHint);
  var k=name.toLowerCase().trim();
  if(DB_LAND[k])return DB_LAND[k];
  if(k.length>6){
    var hit=Object.entries(DB_LAND).find(function(e){return e[0].startsWith(k)||k.startsWith(e[0]);});
    if(hit)return hit[1];
  }
  var all=Object.entries(DB_LAND).filter(function(e){return k.includes(e[0])||e[0].includes(k);});
  if(all.length>0){
    if(areaHint){var am=all.filter(function(e){return e[1].a===areaHint;});if(am.length)all=am;}
    return all.sort(function(a,b){return b[0].length-a[0].length;})[0][1];
  }
  return null;
}

function computeCommercialValuation(f){
  f.area=resolveDLDArea(f.area);
  var bData=lookupCommercial(f.building||"",f.area);
  var aData=(typeof AREAS_COM!=="undefined"?AREAS_COM[f.area]:null)||null;
  var size=parseFloat((f.buaSize||f.size||"").toString().replace(/,/g,""))||0;
  var price=parseFloat((f.price||"").toString().replace(/,/g,""))||0;
  var askPSF=size>0&&price>0?Math.round(price/size):0;
  if(!askPSF||!f.area)return null;
  var basePSF,psfLo,psfHi,dataSource,confScore;
  if(bData){
    basePSF=bData.p;psfLo=bData.lo;psfHi=bData.hi;
    dataSource=(f.building||"")+" · Commercial DB";confScore=82;
  }else if(aData){
    basePSF=aData.psf;psfLo=Math.round(basePSF*0.80);psfHi=Math.round(basePSF*1.20);
    dataSource="Commercial area benchmark · "+f.area;confScore=65;
  }else{
    var resArea=AREAS[f.area];
    if(resArea){basePSF=Math.round(resArea.psf*0.75);psfLo=Math.round(basePSF*0.75);psfHi=Math.round(basePSF*1.25);}
    else{basePSF=1000;psfLo=750;psfHi=1250;}
    dataSource="Estimated from residential · "+f.area;confScore=50;
  }
  var adjPSF=basePSF;
  var subType=(f.subType||"office").toLowerCase();
  if(subType==="retail"||subType==="shop")adjPSF=Math.round(adjPSF*1.15);
  else if(subType==="warehouse")adjPSF=Math.round(adjPSF*0.60);
  var fairPrice=Math.round(adjPSF*size);
  var deviation=Math.round((askPSF-adjPSF)/adjPSF*100);
  var verdict=deviation<=-15?"UNDERVALUED":deviation<=-5?"BELOW_MARKET":deviation<=5?"FAIR_VALUE":deviation<=15?"ABOVE_MARKET":"OVERPRICED";
  var grossYield=aData?Math.round(aData.psf>0?(aData.avgP>0?800/aData.psf:7):7):7;
  if(grossYield<4)grossYield=4;if(grossYield>12)grossYield=12;
  var netYield=Math.round((grossYield-1.5)*10)/10;
  return{
    askPSF:askPSF,adjPSF:adjPSF,psfLo:psfLo,psfHi:psfHi,
    fairPrice:fairPrice,deviation:deviation,verdict:verdict,
    grossYield:grossYield,netYield:netYield,
    confScore:confScore,dataSource:dataSource,
    inDB:!!bData,propType:"commercial",subType:subType,
    areaAvgPrice:aData?aData.avgP:null,areaAvgSize:aData?aData.avgSz:null,
    areaTxns:aData?aData.n:null
  };
}

function computeLandValuation(f){
  f.area=resolveDLDArea(f.area);
  var bData=lookupLand(f.building||f.project||"",f.area);
  var aData=(typeof AREAS_LAND!=="undefined"?AREAS_LAND[f.area]:null)||null;
  var size=parseFloat((f.plotSize||f.size||"").toString().replace(/,/g,""))||0;
  var price=parseFloat((f.price||"").toString().replace(/,/g,""))||0;
  var askPSF=size>0&&price>0?Math.round(price/size):0;
  if(!askPSF||!f.area)return null;
  var basePSF,psfLo,psfHi,dataSource,confScore;
  if(bData){
    basePSF=bData.p;psfLo=bData.lo;psfHi=bData.hi;
    dataSource=(f.building||f.project||"")+" · Land DB";confScore=80;
  }else if(aData){
    basePSF=aData.psf;psfLo=Math.round(basePSF*0.75);psfHi=Math.round(basePSF*1.25);
    dataSource="Land area benchmark · "+f.area;confScore=62;
  }else{
    basePSF=500;psfLo=350;psfHi=650;
    dataSource="Generic land estimate";confScore=40;
  }
  var adjPSF=basePSF;
  var zoning=(f.zoning||"residential").toLowerCase();
  if(zoning==="commercial")adjPSF=Math.round(adjPSF*1.3);
  else if(zoning==="mixed")adjPSF=Math.round(adjPSF*1.15);
  else if(zoning==="industrial")adjPSF=Math.round(adjPSF*0.5);
  var fairPrice=Math.round(adjPSF*size);
  var deviation=Math.round((askPSF-adjPSF)/adjPSF*100);
  var verdict=deviation<=-15?"UNDERVALUED":deviation<=-5?"BELOW_MARKET":deviation<=5?"FAIR_VALUE":deviation<=15?"ABOVE_MARKET":"OVERPRICED";
  var devPotential=zoning==="residential"?Math.round(adjPSF*3.5):zoning==="commercial"?Math.round(adjPSF*4):Math.round(adjPSF*2.5);
  return{
    askPSF:askPSF,adjPSF:adjPSF,psfLo:psfLo,psfHi:psfHi,
    fairPrice:fairPrice,deviation:deviation,verdict:verdict,
    confScore:confScore,dataSource:dataSource,
    inDB:!!bData,propType:"land",zoning:zoning,
    devPotentialPSF:devPotential,devPotentialTotal:Math.round(devPotential*size),
    areaAvgPrice:aData?aData.avgP:null,areaAvgSize:aData?aData.avgSz:null,
    areaTxns:aData?aData.n:null
  };
}

// --- STATISTICAL AVM ENGINE ---------------------------------------------------
// Phase 3: Comparable Sales Method + Auto-Calibration
var DYNAMIC_BENCHMARKS={};
var AVM_CALIBRATION={};

function findComparables(building,area,grade,beds,isVilla,limit){
  limit=limit||8;
  var targetPSF=0;
  var bData=DB[building?building.toLowerCase().trim():""];
  if(bData)targetPSF=bData.p;
  else if(AREAS[area])targetPSF=AREAS[area].psf;
  if(!targetPSF)return[];
  var candidates=[];
  var keys=Object.keys(DB);
  for(var i=0;i<keys.length;i++){
    var k=keys[i];
    var d=DB[k];
    if(k===(building||"").toLowerCase().trim())continue;
    var score=0;
    if(d.a===area)score+=40;
    else{var aD=AREAS[d.a];var tD=AREAS[area];if(aD&&tD&&Math.abs(aD.psf-tD.psf)/tD.psf<0.25)score+=15;}
    if(grade&&d.g===grade)score+=20;
    else if(grade&&d.g){var gOrder=["C","B","B+","A-","A","A+","Ultra"];var gi=gOrder.indexOf(d.g);var ti=gOrder.indexOf(grade);if(gi>=0&&ti>=0&&Math.abs(gi-ti)<=1)score+=10;}
    if(targetPSF>0&&d.p>0){var psfDiff=Math.abs(d.p-targetPSF)/targetPSF;if(psfDiff<0.1)score+=25;else if(psfDiff<0.2)score+=15;else if(psfDiff<0.35)score+=8;else score-=5;}
    var dIsVilla=d.a&&(d.a.includes("Ranches")||d.a.includes("Hills")||d.a.includes("Mudon")||d.a.includes("Tilal")||d.a.includes("DAMAC Hills")||d.a.includes("The Valley")||d.a.includes("Mira"));
    if(isVilla===dIsVilla)score+=10;
    if(score>=30)candidates.push({key:k,data:d,score:score});
  }
  candidates.sort(function(a,b){return b.score-a.score;});
  return candidates.slice(0,limit);
}

function computeComparableEstimate(comps,targetPSF){
  if(!comps.length)return null;
  var totalW=0,wSum=0;
  for(var i=0;i<comps.length;i++){
    var w=comps[i].score;
    wSum+=comps[i].data.p*w;
    totalW+=w;
  }
  if(totalW===0)return null;
  var compPSF=Math.round(wSum/totalW);
  var blend=targetPSF>0?Math.round(targetPSF*0.7+compPSF*0.3):compPSF;
  return{compPSF:compPSF,blendedPSF:blend,compCount:comps.length,spread:comps.length>1?Math.round((comps[comps.length-1].data.p-comps[0].data.p)/2):0};
}

function getCalibrationFactor(area){
  if(AVM_CALIBRATION[area]&&AVM_CALIBRATION[area].sample_count>=3)return AVM_CALIBRATION[area].bias_factor;
  return 1.0;
}

function getDynamicBenchmark(area){
  var d=DYNAMIC_BENCHMARKS[area];
  if(!d||!d.updated_at)return null;
  var age=(Date.now()-new Date(d.updated_at).getTime())/(1000*60*60*24);
  if(age>7)return null;
  return d;
}

async function fetchDynamicBenchmarks(){
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/area_benchmarks?select=*",{
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}
    });
    if(!resp.ok)return;
    var rows=await resp.json();
    if(!rows||!rows.length)return;
    rows.forEach(function(r){
      DYNAMIC_BENCHMARKS[r.area_key]={
        psf:r.psf,r1:r.rent_1br,r2:r.rent_2br,r3:r.rent_3br,
        rStudio:r.rent_studio,rv3:r.rent_villa_3br,rv4:r.rent_villa_4br,rv5:r.rent_villa_5br,
        dom:r.dom,txVol:r.tx_vol,sampleSize:r.sample_size,updated_at:r.updated_at
      };
    });
  }catch(e){console.warn("Dynamic benchmarks fetch failed:",e.message);}
}

async function fetchCalibrationData(){
  try{
    var resp=await fetch(SUPABASE_URL+"/rest/v1/avm_calibration?select=*",{
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}
    });
    if(!resp.ok)return;
    var rows=await resp.json();
    if(!rows||!rows.length)return;
    rows.forEach(function(r){AVM_CALIBRATION[r.area_key]=r;});
  }catch(e){console.warn("Calibration data fetch failed:",e.message);}
}

async function fetchPriceHistory(area,days){
  days=days||90;
  try{
    var since=new Date(Date.now()-days*24*60*60*1000).toISOString().slice(0,10);
    var resp=await fetch(SUPABASE_URL+"/rest/v1/price_history?area_key=eq."+encodeURIComponent(area)+"&snapshot_date=gte."+since+"&order=snapshot_date.asc&select=psf,rent_avg,snapshot_date",{
      headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY}
    });
    if(!resp.ok)return[];
    return await resp.json();
  }catch(e){return[];}
}

// --- ERROR LOGGING & SMART GUIDANCE -------------------------------------------
var DV_ERROR_LOG=[];
var DV_LOG_MAX=200;

function dvLog(type,context,detail){
  var entry={ts:Date.now(),type:type,ctx:context,detail:detail};
  DV_ERROR_LOG.push(entry);
  if(DV_ERROR_LOG.length>DV_LOG_MAX)DV_ERROR_LOG.shift();
  try{localStorage.setItem("dv_error_log",JSON.stringify(DV_ERROR_LOG.slice(-50)));}catch(e){}
}

function dvLoadLog(){
  try{var s=localStorage.getItem("dv_error_log");if(s)DV_ERROR_LOG=JSON.parse(s);}catch(e){}
}
dvLoadLog();

function findNearbyAreas(area,limit){
  limit=limit||3;
  var coords=typeof AREA_COORDS!=="undefined"?AREA_COORDS:{};
  var target=coords[area];
  if(!target)return[];
  var candidates=[];
  var areaKeys=Object.keys(AREAS);
  for(var i=0;i<areaKeys.length;i++){
    var k=areaKeys[i];
    if(k===area)continue;
    var c=coords[k];
    if(!c)continue;
    var dlat=c[0]-target[0];
    var dlng=c[1]-target[1];
    var dist=Math.sqrt(dlat*dlat+dlng*dlng);
    var psfDiff=Math.abs((AREAS[k].psf||1500)-(AREAS[area]?AREAS[area].psf:1500));
    candidates.push({area:k,dist:dist,psfDiff:psfDiff,psf:AREAS[k].psf});
  }
  candidates.sort(function(a,b){return(a.dist*0.6+a.psfDiff/5000*0.4)-(b.dist*0.6+b.psfDiff/5000*0.4);});
  return candidates.slice(0,limit);
}

function getConfidenceGuidance(val,f){
  if(val.confScore>=80)return null;
  var tips=[];
  if(!val.inDB)tips.push({tip:"This building is not in our verified database — estimate uses area benchmarks",action:"Try a well-known building in "+f.area});
  if(f.view==="Not specified")tips.push({tip:"Specifying view type improves accuracy by up to 7%",action:"Select a view (Sea, Marina, Park, etc.)"});
  if(!f.floor&&f.propCategory!=="villa")tips.push({tip:"Floor level affects pricing by up to 15%",action:"Enter the floor number"});
  if(!val.hasDynamic)tips.push({tip:"Live market data not available — using curated benchmarks",action:"Data refreshes daily when connected"});
  if(val.confScore<55){
    var nearby=findNearbyAreas(f.area,3);
    if(nearby.length)tips.push({tip:"For higher-confidence analysis, consider nearby areas with more data",action:nearby.map(function(n){return n.area;}).join(", "),nearby:nearby});
  }
  return tips.length?tips:null;
}

// --- VALUATION ENGINE ---------------------------------------------------------
function computeValuation(f,buildingVal,liveData){
  f.area=resolveDLDArea(f.area);
  const bData=lookupBuilding(buildingVal||f.building||"",f.area);
  const staticArea=AREAS[f.area]||{psf:1800,sc:15,y:[5,7],g:[10,18,28]};
  if(!AREAS[f.area])dvLog("no_area","computeValuation","Area not in AREAS: "+f.area+" — using generic defaults");
  const dynBench=getDynamicBenchmark(f.area);
  const aData=Object.assign({},staticArea);
  if(dynBench){
    if(dynBench.psf&&dynBench.sampleSize>=5)aData.psf=Math.round(staticArea.psf*0.4+dynBench.psf*0.6);
    if(dynBench.r1)aData.r1=Math.round(staticArea.r1*0.3+dynBench.r1*0.7);
    if(dynBench.r2)aData.r2=Math.round((staticArea.r2||100000)*0.3+dynBench.r2*0.7);
    if(dynBench.r3)aData.r3=Math.round((staticArea.r3||150000)*0.3+dynBench.r3*0.7);
    if(dynBench.rStudio)aData.rStudio=dynBench.rStudio;
    if(dynBench.dom)aData.dom=Math.round((staticArea.dom||60)*0.3+dynBench.dom*0.7);
    if(dynBench.txVol)aData.txVol=Math.round((staticArea.txVol||100)*0.3+dynBench.txVol*0.7);
  }
  const calFactor=getCalibrationFactor(f.area);
  const size=parseFloat((f.buaSize||f.size||"").toString().replace(/,/g,""))||0;
  const price=parseFloat((f.price||"").toString().replace(/,/g,""))||0;
  const askPSF=size>0&&price>0?Math.round(price/size):0;
  if(!askPSF||!f.area)return null;
  const isVillaType=f.propCategory==="villa";
  let basePSF,psfLo,psfHi,dataSource,dataLayer,compData=null;
  if(bData){
    basePSF=bData.p;psfLo=bData.lo;psfHi=bData.hi;dataSource=(buildingVal||f.building||"")+" · Verified DB";dataLayer=1;
    var comps=findComparables(buildingVal||f.building,f.area,bData.g,f.beds,isVillaType,8);
    if(comps.length>=3){
      compData=computeComparableEstimate(comps,basePSF);
      basePSF=compData.blendedPSF;
      dataSource+=" + "+comps.length+" comps";
    }
  }
  else{
    dvLog("fallback","computeValuation","Building not in DB: "+(buildingVal||f.building||"")+" · Area: "+f.area);
    const sales=liveData&&liveData.sales?liveData.sales:[];
    const pool=sales.filter(function(s){return s.psf>400&&s.psf<15000});
    if(pool.length>=3){
      const psfs=pool.map(function(s){return s.psf}).sort(function(a,b){return a-b});
      const pLo=psfs[Math.floor(psfs.length*0.2)];
      const pHi=psfs[Math.floor(psfs.length*0.8)];
      // Trimmed mean: average only comps within the 20th-80th percentile band,
      // so a single distressed/bulk-deal sale can't skew the base price.
      const trimmed=psfs.filter(function(p){return p>=pLo&&p<=pHi});
      const meanPool=trimmed.length?trimmed:psfs;
      basePSF=Math.round(meanPool.reduce(function(s,p){return s+p},0)/meanPool.length);
      psfLo=pLo||Math.round(basePSF*0.90);
      psfHi=pHi||Math.round(basePSF*1.10);
      dataSource=pool.length+" comps · "+f.area;dataLayer=2;
    }else{
      // No real signal of building grade exists here (an unmatched building-name
      // string is not evidence of any particular grade), so use the area's own
      // blended psf average rather than guessing a grade tier — guessing "B+"
      // by default previously caused systematic overestimation in budget areas
      // (e.g. Town Square) whenever any building name was typed but not found in DB.
      basePSF=aData.psf;psfLo=Math.round(basePSF*0.87);psfHi=Math.round(basePSF*1.13);
      dataSource="Area benchmark · "+f.area;dataLayer=4;
      dvLog("area_only","computeValuation","No live comps, area-only: "+(buildingVal||f.building||"")+" · "+f.area);
      var areaComps=findComparables(null,f.area,null,f.beds,isVillaType,10);
      if(areaComps.length>=3){
        var ac=computeComparableEstimate(areaComps,basePSF);
        basePSF=Math.round(basePSF*0.5+ac.compPSF*0.5);
        psfLo=Math.round(basePSF*0.87);psfHi=Math.round(basePSF*1.13);
        dataSource="Area benchmark + "+areaComps.length+" comps · "+f.area;
        compData=ac;
      }
    }
  }
  if(calFactor!==1.0){basePSF=Math.round(basePSF*calFactor);psfLo=Math.round(psfLo*calFactor);psfHi=Math.round(psfHi*calFactor);}
  if(dynBench&&dynBench.psf&&dynBench.sampleSize>=5)dataSource+=" · Live";
  // Premiums
  // For DB buildings: apply differential view premium vs the grade baseline,
  // but never penalize — views below baseline get 0 (no negative adjustment).
  // Rule: no punishment in pricing for any view type.
  const GRADE_BASE_VIEW={"Ultra":0.28,"A+":0.19,"A":0.12,"A-":0.06,"B+":0.03,"B":0,"C":0};
  const rawVP=VIEW_P[f.view]||0;
  let vP;
  if(bData&&bData.g&&GRADE_BASE_VIEW[bData.g]!==undefined){
    if(f.view==="Not specified"){
      vP=0; // assume average view already in DB price
    } else {
      vP=rawVP-GRADE_BASE_VIEW[bData.g];
      vP=Math.max(0,Math.min(0.15,vP));
    }
  } else {
    vP=rawVP;
  }
  const isVilla=f.propCategory==="villa";
  const floorN=parseInt(f.floor)||0;
  // Villas: always fP=0 (ground-level, no floor premium)
  // Apartments in DB: differential vs baseline floor 15
  // Apartments not in DB: standard +0.5% per floor above 10
  let fP=0;
  if(!isVilla){
    if(bData&&floorN>0){
      const diffFloors=floorN-15;
      fP=Math.max(-0.07,Math.min(0.15,diffFloors*0.005));
    } else if(!bData&&floorN>10){
      fP=(floorN-10)*0.005;
    }
    // If floor not entered for DB building, fP=0 (assume baseline)
  }
  // Loft premium (double height ceiling)
  const loftP=f.aptSubtype==="Loft"?0.08:0;
  // Penthouse premium
  const penthP=f.aptSubtype==="Penthouse"?0.15:0;
  // Maid's room premium
  const maidP=f.hasMaid?0.03:0;
  const privatePoolP=isVilla&&f.privatePool?0.12:0;  // 12% - private pool premium (Dubai market)
  const singleRowP=isVilla&&f.singleRow?0.08:0;    // 8% - single row / end-unit privacy
  const cornerVillaP=isVilla&&f.cornerVilla?0.05:0; // 5% - corner plot premium
  // Developer-furnished buildings (df:1): base PSF already includes furniture premium
  // Selecting "Furnished" = no extra premium (already in price); "Unfurnished" = discount
  const isDevFurnished=!!(bData&&bData.df);
  let furnP;
  if(isDevFurnished){
    furnP=f.furnished==="Unfurnished"?-0.10:f.furnished==="Semi-Furnished"?-0.05:0;
  }else{
    furnP=f.furnished==="Furnished"?0.15:f.furnished==="Semi-Furnished"?0.07:0;
  }
  const geoAdj=getAreaGeoAdj(f.area)||0;
  // Location Intelligence: metro/amenity proximity premium
  const geoScore=computeGeoScore(f.area);
  const locP=geoScore?geoScore.locationPremium:0;
  const hedonicMult=(1+vP)*(1+fP)*(1+loftP)*(1+penthP)*(1+maidP)*(1+furnP)*(1+privatePoolP)*(1+singleRowP)*(1+cornerVillaP)*(1+geoAdj)*(1+locP);
  const adjPSF=Math.round(basePSF*hedonicMult);
  psfLo=Math.round(psfLo*hedonicMult);psfHi=Math.round(psfHi*hedonicMult);
  const parkBonus=Math.max(0,(parseInt(f.parking)||1)-1)*80000;
  const fairPrice=Math.round(adjPSF*size+parkBonus);
  // Area-sensitive price ladder (based on DLD distress data March 2026)
  var areaSens=(["Palm Jumeirah","Dubai Marina","Downtown Dubai","DIFC","Dubai Harbour","Emaar Beachfront","Jumeirah Beach Residence","City Walk"].indexOf(f.area)>=0)?"high":(["Business Bay","Dubai Creek Harbour","MBR City","Sobha Hartland","Dubai Hills Estate","Jumeirah Lake Towers"].indexOf(f.area)>=0)?"med":"low";
  // Distress floor: how low can motivated sellers go?
  var distressFloor=areaSens==="high"?0.78:areaSens==="med"?0.82:0.85;
  var goodFloor=areaSens==="high"?0.90:areaSens==="med"?0.92:0.93;
  var overCeil=areaSens==="high"?1.10:areaSens==="med"?1.12:1.14;
  const distressPrice=Math.round(adjPSF*distressFloor*size);
  const goodPrice=Math.round(adjPSF*goodFloor*size);
  const overpricedAt=Math.round(adjPSF*overCeil*size);
  const vsPct=((askPSF-adjPSF)/adjPSF)*100;
  let verdict,suggestedOffer;
  if(askPSF<=adjPSF*(distressFloor+0.05)){verdict="DISTRESS";suggestedOffer=null;}
  else if(askPSF<=adjPSF*(goodFloor+0.04)){verdict="GOOD";suggestedOffer=null;}
  else if(askPSF<=adjPSF*1.07){verdict="FAIR";suggestedOffer=Math.round(fairPrice*0.97);}
  else{verdict="OVER";suggestedOffer=fairPrice;}
  const baseConf=[0,95,85,72,58][dataLayer]||58;
  const inputPenalty=(!f.floor&&!isVilla?-4:0)+(f.view==="Not specified"?-2:0)+(!f.serviceCharge?-1:0);
  const compBonus=compData&&compData.compCount>=5?4:compData&&compData.compCount>=3?2:0;
  const dynBonus=dynBench&&dynBench.sampleSize>=5?3:0;
  const calBonus=calFactor!==1.0?2:0;
  // FSD-style spread adjustment (CoreLogic Forecast Standard Deviation logic):
  // tighter lo-hi PSF range relative to price = more confident estimate
  const relSpread=adjPSF>0?(psfHi-psfLo)/adjPSF:0.25;
  const spreadAdj=relSpread<=0.15?5:relSpread<=0.25?0:relSpread<=0.40?-5:-10;
  const confScore=Math.min(97,Math.max(40,baseConf+inputPenalty+spreadAdj+compBonus+dynBonus+calBonus));
  const confTier=confScore>=90?{label:"Very High",range:"±3–5%",spread:0.04,c:"green"}:confScore>=80?{label:"High",range:"±5–8%",spread:0.07,c:"green"}:confScore>=68?{label:"Medium",range:"±8–12%",spread:0.11,c:"yellow"}:confScore>=55?{label:"Low",range:"±12–18%",spread:0.15,c:"yellow"}:{label:"Indicative",range:"±18–25%",spread:0.22,c:"red"};
  const priceLow=Math.round(fairPrice*(1-confTier.spread));
  const priceHigh=Math.round(fairPrice*(1+confTier.spread));
  const bnMap={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5,"6 BR":6,"7 BR":7,"7+ BR":7};
  const bn=bnMap[f.beds]!=null?bnMap[f.beds]:2;
  let rent=isVilla?(bn<=2?aData.rv2||130000:bn<=3?aData.rv3||180000:bn<=4?aData.rv4||240000:bn<=5?aData.rv5||350000:bn<=6?aData.rv6||500000:aData.rv7||650000):bn===0?(aData.rStudio||(aData.r1||65000)*0.65):bn===1?aData.r1||65000:bn===2?aData.r2||100000:bn===3?aData.r3||150000:(aData.r3||150000)*1.4;
  // Grade/brand premium on rent: branded residences command higher rents
  if(bData&&bData.g){var _grm=bData.g==="Ultra"?1.20:bData.g==="A+"?1.12:bData.g==="A"?1.05:1.0;if(_grm>1.0)rent=Math.round(rent*_grm);}
  const sc=(parseFloat(f.serviceCharge)||(bData&&bData.sc)||aData.sc||15)*size;
  const grossYield=(rent/price*100).toFixed(1);
  const netYield=((rent-sc)/price*100).toFixed(1);
  const gr=aData.g||[10,18,28];
  // Price-to-Rent ratio bubble signal (NY Fed SR-218 / NBER WP-11643 / UBS GREBI thresholds)
  const grossYieldNum=parseFloat(grossYield);
  const prRatio=grossYieldNum>0?100/grossYieldNum:null;
  const investSignal=prRatio===null?null:prRatio<15?{label:"Undervalued",c:"green"}:prRatio<20?{label:"Fair Value",c:"green"}:prRatio<25?{label:"Elevated",c:"yellow"}:{label:"Bubble Risk",c:"red"};
  // Total annualized return = Net Yield + base-case capital growth annualized over the 3-year forecast horizon
  const totalReturnAnnual=(parseFloat(netYield)+gr[1]/3).toFixed(1);
  // Market Liquidity / Days on Market analysis
  const domEst=aData.dom||60;
  const txVol=aData.txVol||100;
  const liqScore=domEst<=20?95:domEst<=30?85:domEst<=45?72:domEst<=65?55:domEst<=90?40:25;
  const liqTier=liqScore>=90?{label:"Very High",c:"green",desc:"Sells in under 3 weeks — extremely liquid market"}:liqScore>=80?{label:"High",c:"green",desc:"Typically sells within a month — strong demand"}:liqScore>=65?{label:"Moderate",c:"yellow",desc:"1–2 months average — normal market pace"}:liqScore>=45?{label:"Low",c:"yellow",desc:"2–3 months to sell — patience required"}:liqScore>=30?{label:"Very Low",c:"red",desc:"3–6 months — limited buyer pool, negotiate carefully"}:{label:"Illiquid",c:"red",desc:"6+ months — very few transactions, high exit risk"};
  const txLabel=txVol>=3000?"Very Active":txVol>=1000?"Active":txVol>=400?"Moderate":txVol>=100?"Slow":"Very Slow";
  // Building Turnover Rate
  const bldgName=buildingVal||f.building||"";
  const bldgUnits=estimateBldgUnits(bldgName,bData,isVilla);
  const bldgAnnualTx=estimateBldgTx(bldgName,f.area,aData,bData);
  const turnoverRate=bldgUnits>0?Math.round(bldgAnnualTx/bldgUnits*1000)/10:0;
  const turnoverTier=turnoverRate>=12?{label:"Hot Market",c:"green",desc:"Units trade hands rapidly — very high demand, low exit risk"}:turnoverRate>=6?{label:"Active",c:"green",desc:"Healthy trading volume — good liquidity, units sell with ease"}:turnoverRate>=3?{label:"Stable",c:"yellow",desc:"Normal market pace — adequate liquidity for planned exits"}:turnoverRate>=1?{label:"Slow",c:"yellow",desc:"Below-average activity — may take longer to find a buyer"}:{label:"Stagnant",c:"red",desc:"Very few trades — high illiquidity risk, exercise caution"};
  // --- Margin of Safety (MoS) Index ---
  // Component 1: Price Gap (50% weight) — how far below/above fair value
  const vsPctNum=parseFloat(vsPct)||0;
  const priceGapScore=vsPctNum<=-20?95:vsPctNum<=-12?85:vsPctNum<=-5?72:vsPctNum<=0?58:vsPctNum<=5?42:vsPctNum<=12?25:10;
  // Component 2: Time Decay (20% weight) — SC vs area average as age proxy
  const scPSF=parseFloat(f.serviceCharge)||(bData&&bData.sc)||aData.sc||15;
  const areaSCAvg=aData.sc||15;
  const scRatio=areaSCAvg>0?scPSF/areaSCAvg:1;
  const timeDecayScore=scRatio<=0.75?90:scRatio<=0.95?75:scRatio<=1.10?60:scRatio<=1.35?40:20;
  // Component 3: Market Depth (30% weight) — is this price point in the area's liquid range?
  const areaPsfAvg=aData.psf||1500;
  const psfDeviation=areaPsfAvg>0?Math.abs(askPSF-areaPsfAvg)/areaPsfAvg:0.5;
  const marketDepthScore=psfDeviation<=0.15?90:psfDeviation<=0.30?72:psfDeviation<=0.50?50:psfDeviation<=0.75?30:15;
  // Composite MoS (weighted)
  const mosRaw=Math.round(priceGapScore*0.50+timeDecayScore*0.20+marketDepthScore*0.30);
  const mosScore=Math.min(95,Math.max(5,mosRaw));
  const mosTier=mosScore>=80?{label:"Deep Value",c:"green",desc:"Strong margin of safety — price significantly below intrinsic value with favorable market conditions"}:mosScore>=65?{label:"Value Buy",c:"green",desc:"Positive margin of safety — priced below fair value with room for appreciation"}:mosScore>=50?{label:"Fair Entry",c:"yellow",desc:"Neutral margin — price aligns with market value, moderate risk-reward balance"}:mosScore>=35?{label:"Thin Margin",c:"yellow",desc:"Limited safety buffer — priced at or slightly above value, returns depend on market growth"}:{label:"Speculative",c:"red",desc:"Negative margin of safety — price exceeds intrinsic value, high risk of capital loss in a downturn"};
  return{askPSF,adjPSF,psfLo,psfHi,fairPrice,distressPrice,goodPrice,overpricedAt,verdict,vsPct:vsPct.toFixed(1),suggestedOffer,dataSource,dataLayer,confScore,confTier,priceLow,priceHigh,inDB:!!bData,bData,isDevFurnished,vP:Math.round(vP*100),fP:Math.round(fP*100),furnP:Math.round(furnP*100),loftP:Math.round(loftP*100),penthP:Math.round(penthP*100),maidP:Math.round(maidP*100),privatePoolP:Math.round(privatePoolP*100),singleRowP:Math.round(singleRowP*100),cornerVillaP:Math.round(cornerVillaP*100),locP:Math.round(locP*100),geo:Math.round(geoAdj*100),rent,sc,grossYield,netYield,g0:gr[0],g1:gr[1],g2:gr[2],prRatio:prRatio?prRatio.toFixed(1):null,investSignal,totalReturnAnnual,domEst,txVol,liqScore,liqTier,txLabel,turnoverRate,turnoverTier,bldgUnits,bldgAnnualTx,mosScore,mosTier,priceGapScore,timeDecayScore,marketDepthScore,compData:compData,hasDynamic:!!dynBench,calFactor:calFactor,geoScore:geoScore};
}

function computeRentalValuation(f){
  f.area=resolveDLDArea(f.area);
  var buildingVal=(f.building||"").toLowerCase().trim();
  var bData=lookupBuilding(buildingVal,f.area);
  var aData=AREAS[f.area]||null;
  if(!aData)return null;
  var askRent=parseInt(String(f.price||"").replace(/[^0-9]/g,""));
  if(!askRent||askRent<5000)return null;
  var size=parseFloat(String(f.size||f.buaSize||"").replace(/,/g,""))||0;
  var isVilla=f.propCategory==="villa";
  var bnMap={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5,"6 BR":6,"7 BR":7,"7+ BR":7};
  var bn=bnMap[f.beds]!=null?bnMap[f.beds]:2;
  var estRent=isVilla?(bn<=2?aData.rv2||130000:bn<=3?aData.rv3||180000:bn<=4?aData.rv4||240000:bn<=5?aData.rv5||350000:bn<=6?aData.rv6||500000:aData.rv7||650000):bn===0?(aData.rStudio||(aData.r1||65000)*0.65):bn===1?aData.r1||65000:bn===2?aData.r2||100000:bn===3?aData.r3||150000:(aData.r3||150000)*1.4;
  // Furnished premium on rent: furnished +15-20%, semi +8-10%
  var furnMult=f.furnished==="Furnished"?1.17:f.furnished==="Semi-Furnished"?1.09:1.0;
  estRent=Math.round(estRent*furnMult);
  // View premium on rent
  var viewAdj=1.0;
  if(f.view&&f.view!=="Not specified"){
    var vl=f.view.toLowerCase();
    if(vl.indexOf("full sea")>=0||vl.indexOf("burj khalifa")>=0||vl.indexOf("beach access")>=0)viewAdj=1.12;
    else if(vl.indexOf("partial sea")>=0||vl.indexOf("partial burj")>=0||vl.indexOf("canal")>=0)viewAdj=1.07;
    else if(vl.indexOf("golf")>=0||vl.indexOf("lagoon")>=0||vl.indexOf("skyline")>=0)viewAdj=1.05;
    else if(vl.indexOf("pool")>=0||vl.indexOf("garden")>=0||vl.indexOf("park")>=0)viewAdj=1.03;
  }
  estRent=Math.round(estRent*viewAdj);
  // Floor premium for apartments (higher floors get ~2-5% more rent)
  if(!isVilla&&f.floor){
    var fl=parseInt(f.floor)||0;
    if(fl>=40)estRent=Math.round(estRent*1.05);
    else if(fl>=25)estRent=Math.round(estRent*1.03);
    else if(fl>=15)estRent=Math.round(estRent*1.02);
  }
  // Grade/brand premium: branded residences (Address, Vida, Palace, Armani, etc.)
  // command higher rents due to hotel services, concierge, premium amenities
  if(bData&&bData.g){
    var gradeRentP=bData.g==="Ultra"?1.20:bData.g==="A+"?1.12:bData.g==="A"?1.05:1.0;
    if(gradeRentP>1.0)estRent=Math.round(estRent*gradeRentP);
  }
  // Rent range: ±12% for market variability
  var rentLow=Math.round(estRent*0.88);
  var rentHigh=Math.round(estRent*1.12);
  var vsPct=((askRent-estRent)/estRent*100);
  var verdict=vsPct<=-12?"BELOW_MARKET":vsPct<=-3?"COMPETITIVE":vsPct<=5?"MARKET_RATE":vsPct<=15?"ABOVE_MARKET":"OVERPRICED";
  var suggestedRent=null;
  if(verdict==="ABOVE_MARKET")suggestedRent=Math.round(estRent*1.03);
  else if(verdict==="OVERPRICED")suggestedRent=estRent;
  // Confidence
  var hasRentalData=isVilla?(aData.rv2||aData.rv3||aData.rv4||aData.rv5):aData.r1;
  var baseConf=hasRentalData?82:60;
  var inputBonus=(f.beds?3:0)+(f.view&&f.view!=="Not specified"?2:0)+(f.furnished?1:0)+(bData?5:0);
  var confScore=Math.min(95,Math.max(40,baseConf+inputBonus));
  var confTier=confScore>=90?{label:"Very High",range:"±3–5%",c:"green"}:confScore>=80?{label:"High",range:"±5–8%",c:"green"}:confScore>=68?{label:"Medium",range:"±8–12%",c:"yellow"}:confScore>=55?{label:"Low",range:"±12–18%",c:"yellow"}:{label:"Indicative",range:"±18–25%",c:"red"};
  // Rent PSF
  var askRentPSF=size>0?Math.round(askRent/size):0;
  var estRentPSF=size>0?Math.round(estRent/size):0;
  // Service charge and net rent
  var sc=(parseFloat(f.serviceCharge)||(bData&&bData.sc)||aData.sc||15)*(size||0);
  var netRent=askRent-sc;
  // Area rental benchmarks for comparison
  var areaRents=[];
  if(!isVilla){
    if(aData.r1)areaRents.push({beds:"Studio",rent:Math.round(aData.r1*0.65)});
    if(aData.r1)areaRents.push({beds:"1 BR",rent:aData.r1});
    if(aData.r2)areaRents.push({beds:"2 BR",rent:aData.r2});
    if(aData.r3)areaRents.push({beds:"3 BR",rent:aData.r3});
    if(aData.r3)areaRents.push({beds:"4 BR+",rent:Math.round(aData.r3*1.4)});
  }else{
    if(aData.rv3)areaRents.push({beds:"3 BR",rent:aData.rv3});
    if(aData.rv4)areaRents.push({beds:"4 BR",rent:aData.rv4});
    if(aData.rv5)areaRents.push({beds:"5 BR",rent:aData.rv5});
    if(aData.rv6)areaRents.push({beds:"6 BR",rent:aData.rv6});
    if(aData.rv7)areaRents.push({beds:"7 BR",rent:aData.rv7});
  }
  // Growth forecast
  var gr=aData.g||[10,18,28];
  // Liquidity
  var domEst=aData.dom||60;
  var txVol=aData.txVol||100;
  return{askRent:askRent,estRent:estRent,rentLow:rentLow,rentHigh:rentHigh,vsPct:vsPct.toFixed(1),verdict:verdict,suggestedRent:suggestedRent,confScore:confScore,confTier:confTier,askRentPSF:askRentPSF,estRentPSF:estRentPSF,monthly:Math.round(askRent/12),estMonthly:Math.round(estRent/12),sc:Math.round(sc),netRent:netRent,areaRents:areaRents,inDB:!!bData,bData:bData,dataSource:bData?"Building Database":"Area Benchmark",area:f.area,beds:f.beds||"2 BR",isVilla:isVilla,furnished:f.furnished||"Unfurnished",furnMult:furnMult,viewAdj:viewAdj,gr:gr,domEst:domEst,txVol:txVol,size:size};
}

