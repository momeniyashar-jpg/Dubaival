// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
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
  // 1b. Normalize "towerN" → "tower N" (users often omit the space)
  const kNorm=k.replace(/\btower(\d)/g,"tower $1");
  if(kNorm!==k&&DB[kNorm])return DB[kNorm];
  // 2. Alias map (handles "Tower 1" vs "T1" and other variants)
  if(ALIASES[k]&&DB[ALIASES[k]])return DB[ALIASES[k]];
  if(kNorm!==k&&ALIASES[kNorm]&&DB[ALIASES[kNorm]])return DB[ALIASES[kNorm]];
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
  const words=k.split(" ").filter(function(w){return w.length>2||/^\d+$/.test(w);});
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
  // DLD-calibrated commercial PSF (VALUATION_DB_COM — see
  // tools/build-valuation-db.js) overrides the legacy DB_COM/AREAS_COM
  // benchmarks the same way VALUATION_DB overrides residential DB, using
  // calibration data that had been computed but never actually applied.
  var bKey=(f.building||"").toLowerCase().trim();
  var vdbComEntry=typeof VALUATION_DB_COM!=="undefined"&&VALUATION_DB_COM[bKey]?VALUATION_DB_COM[bKey]:null;
  var vAreaComEntry=typeof VALUATION_AREAS_COM!=="undefined"&&VALUATION_AREAS_COM[f.area]?VALUATION_AREAS_COM[f.area]:null;
  var basePSF,psfLo,psfHi,dataSource,confScore;
  if(bData){
    if(vdbComEntry){basePSF=vdbComEntry.p;psfLo=vdbComEntry.lo;psfHi=vdbComEntry.hi;dataSource=(f.building||"")+" · DLD Verified Commercial";confScore=86;}
    else{basePSF=bData.p;psfLo=bData.lo;psfHi=bData.hi;dataSource=(f.building||"")+" · Commercial DB";confScore=82;}
  }else if(vAreaComEntry){
    basePSF=vAreaComEntry.psf;psfLo=Math.round(basePSF*0.80);psfHi=Math.round(basePSF*1.20);
    dataSource="DLD commercial area benchmark · "+f.area;confScore=68;
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
  var comPsf=aData&&aData.psf>0?aData.psf:adjPSF;
  var grossYield=9-(comPsf/1000)*0.8;
  if(subType==="warehouse")grossYield+=1.0;
  else if(subType==="retail"||subType==="shop")grossYield+=0.3;
  if(grossYield<5.5)grossYield=5.5;if(grossYield>9)grossYield=9;
  grossYield=Math.round(grossYield*10)/10;
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
  // DLD-calibrated land PSF (VALUATION_DB_LAND — see
  // tools/build-valuation-db.js) overrides the legacy Land DB, using
  // calibration data that had been computed but never actually applied —
  // covers all 253 of 428 DB_LAND plots with an exact key match.
  var bKeyLand=(f.building||f.project||"").toLowerCase().trim();
  var vdbLandEntry=typeof VALUATION_DB_LAND!=="undefined"&&VALUATION_DB_LAND[bKeyLand]?VALUATION_DB_LAND[bKeyLand]:null;
  var basePSF,psfLo,psfHi,dataSource,confScore;
  if(bData){
    if(vdbLandEntry){basePSF=vdbLandEntry.p;psfLo=vdbLandEntry.lo;psfHi=vdbLandEntry.hi;dataSource=(f.building||f.project||"")+" · DLD Verified Land";confScore=84;}
    else{basePSF=bData.p;psfLo=bData.lo;psfHi=bData.hi;dataSource=(f.building||f.project||"")+" · Land DB";confScore=80;}
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
  var _vk=building?building.toLowerCase().trim():"";
  var _ve=typeof VALUATION_DB!=="undefined"&&VALUATION_DB[_vk]?VALUATION_DB[_vk]:null;
  if(_ve)targetPSF=_ve.p;
  else if(bData)targetPSF=bData.p;
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

// Real "how fast does this AREA actually rent" signal — see
// supabase-rental-liquidity-schema.sql / api/refresh-market-data.js's weekly
// ?action=rental-velocity job. AREA-level only (no per-building granularity
// exists or is claimed) — rent_avg_days_listed is null until enough rental
// listings have gone stale for the weekly job to average, exactly like
// growth_1yr_realized needed weeks of price_history before it existed.
function getRentalVelocity(area){
  var d=DYNAMIC_BENCHMARKS[area];
  if(!d)return null;
  if(d.rentAvgDaysListed==null)return{activeCount:d.rentActiveCount||null,avgDaysListed:null,sampleSize:0,ready:false};
  return{activeCount:d.rentActiveCount||null,avgDaysListed:d.rentAvgDaysListed,sampleSize:d.rentVelocitySampleSize||0,ready:true};
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
        dom:r.dom,txVol:r.tx_vol,sampleSize:r.sample_size,updated_at:r.updated_at,
        growth1yr:r.growth_1yr_realized,growthUpdated:r.growth_updated_at,
        rentActiveCount:r.rent_active_count,rentAvgDaysListed:r.rent_avg_days_listed,
        rentVelocitySampleSize:r.rent_velocity_sample_size,rentVelocityUpdated:r.rent_velocity_updated_at
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

// --- LIVE TRANSACTION/LISTING SIGNAL ------------------------------------------
// Robust median of a numeric array using a Tukey fence (1.5×IQR) to reject
// outliers before taking the median — resistant to a single anomalous data
// point (data-entry error, gift/partial-share transfer, a bait listing that
// slips past the price-range filter) skewing a small sample.
function _percentile(sorted,p){
  if(!sorted.length)return 0;
  var idx=(sorted.length-1)*p;
  var lo=Math.floor(idx),hi=Math.ceil(idx);
  if(lo===hi)return sorted[lo];
  return sorted[lo]+(sorted[hi]-sorted[lo])*(idx-lo);
}
function _robustMedian(arr){
  var sorted=arr.slice().sort(function(a,b){return a-b;});
  var q1=_percentile(sorted,0.25),q3=_percentile(sorted,0.75);
  var iqr=q3-q1;
  var lo=q1-1.5*iqr,hi=q3+1.5*iqr;
  var trimmed=sorted.filter(function(v){return v>=lo&&v<=hi;});
  var pool=trimmed.length?trimmed:sorted;
  var mid=Math.floor(pool.length/2);
  return pool.length%2===0?(pool[mid-1]+pool[mid])/2:pool[mid];
}
// Derives a live PSF signal from fetchLiveData()'s {sales, txs} output.
// Real closed transactions (txs) are strongly preferred over listings
// (sales): a transaction only exists once a deal has actually closed, so —
// unlike an asking-price listing — it's immune to both (a) the
// well-documented Dubai-market gap between asking and eventual sale price,
// and (b) agents posting artificially low "bait" listings purely to
// generate leads. Listings are used only when too few real transactions are
// available, and only after a conservative discount for (a) — a documented
// assumption pending empirical recalibration once enough of our own
// txs-vs-sales spread accumulates in the app's own usage.
var LIVE_LIST_DISCOUNT=0.95;
var LIVE_MIN_TX=3,LIVE_MIN_LISTINGS=5;
function getLiveSignal(liveData){
  if(!liveData)return null;
  var txPsfs=(liveData.txs||[]).map(function(t){return t.psf;}).filter(function(p){return p>400&&p<20000;});
  if(txPsfs.length>=LIVE_MIN_TX){
    return{psf:Math.round(_robustMedian(txPsfs)),n:txPsfs.length,source:"live_tx"};
  }
  var salePsfs=(liveData.sales||[]).map(function(s){return s.psf;}).filter(function(p){return p>400&&p<20000;});
  if(salePsfs.length>=LIVE_MIN_LISTINGS){
    return{psf:Math.round(_robustMedian(salePsfs)*LIVE_LIST_DISCOUNT),n:salePsfs.length,source:"live_listing"};
  }
  return null;
}

// --- SHARED HEDONIC PSF ENGINE --------------------------------------------------
// Extracted from computeValuation() so computeAssetMetrics() (js/portfolio.js,
// Portfolio Manager) can share the exact same base-PSF resolution + full
// hedonic premium stack (view/floor grade-differential logic, loft/penthouse/
// maid/study/pool/corner-villa premiums, momentum + calibration factors,
// comparable-sales blending) instead of maintaining its own divergent,
// incomplete copy — which had drifted out of sync (raw view% instead of
// grade-differential, missing villa floor-premium guard, missing several
// premium categories entirely) and could show a materially different "value"
// for the exact same unit depending on which tab you checked it in.
// No early-return branches here — always computes a full result using generic
// defaults when area/building are unknown, exactly mirroring what
// computeValuation always did unconditionally before its own final guard.
// Blends static AREAS[] benchmarks with real, daily-refreshed live market
// data (DYNAMIC_BENCHMARKS — see api/refresh-market-data.js) and the
// AI-estimated recent momentum trend (MARKET_MOMENTUM) into one "live area
// data" object. Single source of truth for "what does this area actually
// look like right now" — used by computeAdjustedPSF() (the Analyzer) and
// by Find's Advanced Market Screener, so both features answer "is this a
// good deal today," not "what did the static database say months ago."
function getLiveAreaData(area){
  const staticArea=AREAS[area]||{psf:1800,sc:15,y:[5,7],g:[3,9,16]};
  const dynBench=getDynamicBenchmark(area);
  const aData=Object.assign({},staticArea);
  if(dynBench){
    if(dynBench.psf&&dynBench.sampleSize>=5)aData.psf=Math.round(staticArea.psf*0.4+dynBench.psf*0.6);
    if(dynBench.r1)aData.r1=Math.round(staticArea.r1*0.3+dynBench.r1*0.7);
    if(dynBench.r2)aData.r2=Math.round((staticArea.r2||100000)*0.3+dynBench.r2*0.7);
    if(dynBench.r3)aData.r3=Math.round((staticArea.r3||150000)*0.3+dynBench.r3*0.7);
    if(dynBench.rStudio)aData.rStudio=dynBench.rStudio;
    if(dynBench.dom)aData.dom=Math.round((staticArea.dom||60)*0.3+dynBench.dom*0.7);
    if(dynBench.txVol)aData.txVol=Math.round((staticArea.txVol||100)*0.3+dynBench.txVol*0.7);
    // Realized 1-year growth from price_history — refreshed weekly (not
    // daily like the fields above), so it needs its own freshness check
    // rather than relying on the shared dynBench.updated_at gate. Blended
    // conservatively (60% static / 40% real) since a single trailing-365-day
    // figure is inherently noisier than the richer live listing samples
    // backing psf. Only g[0] (0-1yr) — g[1]/g[2] (1-3yr/2-5yr) stay
    // static/projected; we don't have years of price_history to derive
    // those from yet, and won't for a long time.
    if(typeof dynBench.growth1yr==="number"&&dynBench.growthUpdated){
      var gAge=(Date.now()-new Date(dynBench.growthUpdated).getTime())/(1000*60*60*24);
      if(gAge<=14){
        var staticG=staticArea.g||[3,9,16];
        aData.g=[Math.round((staticG[0]*0.6+dynBench.growth1yr*0.4)*10)/10,staticG[1],staticG[2]];
      }
    }
  }
  return aData;
}

// Adds the AI-estimated recent momentum trend (market_momentum table,
// refreshed weekly — see runMarketIntelligence() in js/core.js) on top of
// getLiveAreaData()'s realized/static growth, so a currently-heating-up or
// currently-cooling area is reflected even before enough price_history
// exists for the realized-growth blend above. Kept as a separate function
// (not folded into getLiveAreaData() itself) so it never changes
// computeAdjustedPSF()'s output — the Analyzer's numbers are validated
// against real market data and must not shift from an unrelated feature's
// needs. Used only by Find's Advanced Market Screener.
function getLiveAreaDataWithMomentum(area){
  var aData=getLiveAreaData(area);
  if(typeof getMomentumFactor==="function"){
    var mf=getMomentumFactor(area);
    if(mf!==1.0){
      aData=Object.assign({},aData);
      aData.g=(aData.g||[3,9,16]).slice();
      aData.g[0]=Math.round(aData.g[0]*mf*10)/10;
    }
  }
  return aData;
}

function computeAdjustedPSF(f,buildingVal,liveData){
  f.area=resolveDLDArea(f.area);
  const bData=lookupBuilding(buildingVal||f.building||"",f.area);
  const staticArea=AREAS[f.area]||{psf:1800,sc:15,y:[5,7],g:[3,9,16]};
  if(!AREAS[f.area])dvLog("no_area","computeAdjustedPSF","Area not in AREAS: "+f.area+" — using generic defaults");
  const dynBench=getDynamicBenchmark(f.area);
  const aData=getLiveAreaData(f.area);
  const calFactor=getCalibrationFactor(f.area);
  const size=parseFloat((f.buaSize||f.size||"").toString().replace(/,/g,""))||0;
  const isVillaType=f.propCategory==="villa";
  let basePSF,psfLo,psfHi,dataSource,dataLayer,compData=null;
  // DLD-calibrated PSF: VALUATION_DB (real transactions) overrides legacy DB
  const bKey=(buildingVal||f.building||"").toLowerCase().trim();
  const vdbEntry=typeof VALUATION_DB!=="undefined"&&VALUATION_DB[bKey]?VALUATION_DB[bKey]:null;
  const liveSig=getLiveSignal(liveData);
  // Area market-drift correction (root-cause fix, 2026-07-12): VALUATION_DB and
  // VALUATION_AREAS are a flat median over a multi-year historical window (see
  // tools/calibrate-db.js DATE_FROM) — accurate for slow-moving, established
  // areas but measurably stale in fast-appreciating ones. Controlled,
  // bedroom+size-matched validation against real DLD/Bayut data (2026-07-12)
  // found established areas (Dubai Marina, Downtown, Business Bay) within
  // ~1-10% of real prices, but International City ~30-40% understated (real
  // growth ~11%/yr vs our static area-growth assumption of 2%/yr) — a real,
  // area-specific staleness gap, not a single-building anomaly.
  // currentAreaPSF blends the calibrated historical anchor with the daily-
  // refreshed live signal (dynBench, already fetched above) to estimate how
  // much the area has moved since calibration; areaDrift is that movement
  // expressed as a ratio, applied to BOTH the building-level anchor (below)
  // and the area-only fallback anchor (further down) so a building in a
  // fast-moving area gets indexed the same way an unmatched one would.
  // Symmetric — corrects overstatement as well as understatement — and
  // clamped + gated on a real live sample so a thin/noisy read can't swing it.
  const calibAreaPSF=(typeof VALUATION_AREAS!=="undefined"&&VALUATION_AREAS[f.area]&&VALUATION_AREAS[f.area].psf)||staticArea.psf;
  const hasLiveAreaSig=!!(dynBench&&dynBench.psf&&dynBench.sampleSize>=5);
  const currentAreaPSF=hasLiveAreaSig?Math.round(calibAreaPSF*0.4+dynBench.psf*0.6):calibAreaPSF;
  const areaDrift=hasLiveAreaSig&&calibAreaPSF>0?Math.max(0.85,Math.min(1.25,currentAreaPSF/calibAreaPSF)):1;
  if(bData){
    if(vdbEntry){basePSF=vdbEntry.p;psfLo=vdbEntry.lo;psfHi=vdbEntry.hi;}
    else{basePSF=bData.p;psfLo=bData.lo;psfHi=bData.hi;}
    dataSource=(buildingVal||f.building||"")+" · "+(vdbEntry?"DLD Verified":"Legacy DB");dataLayer=1;
    var comps=findComparables(buildingVal||f.building,f.area,bData.g,f.beds,isVillaType,8);
    if(comps.length>=3){
      compData=computeComparableEstimate(comps,basePSF);
      basePSF=compData.blendedPSF;
      dataSource+=" + "+comps.length+" comps";
    }
    if(Math.abs(areaDrift-1)>=0.03){
      basePSF=Math.round(basePSF*areaDrift);psfLo=Math.round(psfLo*areaDrift);psfHi=Math.round(psfHi*areaDrift);
      dataSource+=" · area-indexed";
    }
    // Live nudge from real Bayut transactions/listings for this exact
    // building+area query — see getLiveSignal() above. Weighted lightly and
    // capped well below 50/50 even at large sample sizes: a handful of live
    // records shouldn't override a calibrated database backed by a much
    // larger historical transaction set, just meaningfully move the needle
    // between calibration refreshes.
    if(liveSig){
      var liveWeight=liveSig.source==="live_tx"?Math.min(0.5,0.15+liveSig.n*0.05):Math.min(0.25,0.05+liveSig.n*0.02);
      basePSF=Math.round(basePSF*(1-liveWeight)+liveSig.psf*liveWeight);
      dataSource+=" · "+liveSig.n+(liveSig.source==="live_tx"?" live TX":" live listings (adj)");
    }
  }
  else{
    dvLog("fallback","computeAdjustedPSF","Building not in DB: "+(buildingVal||f.building||"")+" · Area: "+f.area);
    if(liveSig){
      basePSF=liveSig.psf;
      psfLo=Math.round(basePSF*0.90);psfHi=Math.round(basePSF*1.10);
      dataSource=liveSig.n+(liveSig.source==="live_tx"?" live transactions":" live listings (adj)")+" · "+f.area;
      dataLayer=2;
    }else{
      // No real signal of building grade exists here (an unmatched building-name
      // string is not evidence of any particular grade), so use the area's own
      // blended psf average rather than guessing a grade tier — guessing "B+"
      // by default previously caused systematic overestimation in budget areas
      // (e.g. Town Square) whenever any building name was typed but not found in DB.
      // Prefer DLD area benchmark over legacy AREAS data, indexed to today via
      // currentAreaPSF/areaDrift (see above) — the same market-drift correction
      // applied to building-matched valuations, so an unmatched building in a
      // fast-moving area isn't left on the stale flat-calibration anchor either.
      var vAreaEntry=typeof VALUATION_AREAS!=="undefined"&&VALUATION_AREAS[f.area]?VALUATION_AREAS[f.area]:null;
      basePSF=currentAreaPSF;psfLo=Math.round(basePSF*0.87);psfHi=Math.round(basePSF*1.13);
      dataSource=(vAreaEntry?"DLD area":"Area")+" benchmark · "+f.area;dataLayer=4;
      dvLog("area_only","computeAdjustedPSF","No live comps, area-only: "+(buildingVal||f.building||"")+" · "+f.area);
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
  const momFactor=typeof getMomentumFactor==="function"?getMomentumFactor(f.area):1.0;
  if(momFactor!==1.0){basePSF=Math.round(basePSF*momFactor);psfLo=Math.round(psfLo*momFactor);psfHi=Math.round(psfHi*momFactor);}
  if(dynBench&&dynBench.psf&&dynBench.sampleSize>=5)dataSource+=" · Live";
  if(momFactor!==1.0)dataSource+=" · AI Trend";
  // Admin Market Risk Controls (apartment/villa macro adjustment) — a market-
  // wide correction like calFactor/momFactor above, not a property-specific
  // premium, so it's applied to basePSF here rather than folded into the
  // hedonic premium stack below (which is capped). Previously this only ever
  // reached Portfolio's separate copy of this logic despite the Admin UI's
  // "Save & Apply to All Valuations" label promising otherwise.
  const typeAdj=typeof MACRO_VARS!=="undefined"?(isVillaType?(MACRO_VARS.villaAdj||0):(MACRO_VARS.aptAdj||0)):0;
  if(typeAdj!==0){basePSF=Math.round(basePSF*(1+typeAdj));psfLo=Math.round(psfLo*(1+typeAdj));psfHi=Math.round(psfHi*(1+typeAdj));}
  // Premiums
  // For DB buildings: differential view premium vs grade baseline.
  // DB price assumes "average view" for the building's grade.
  // Above-baseline views get premium; below-baseline views get discount.
  // VIEW_P values are 0-38% (no negatives). Differential vs grade baseline creates spread. Asymmetric clamp: -15%/+25%.
  const GRADE_BASE_VIEW={"Ultra":0.25,"A+":0.14,"A":0.08,"A-":0.04,"B+":0.02,"B":0,"C":0};
  const rawVP=VIEW_P[f.view]||VIEW_P[f.view+" View"]||(f.view&&VIEW_P[f.view.replace(/ View$/,"")])||0;
  let vP;
  if(bData&&bData.g&&GRADE_BASE_VIEW[bData.g]!==undefined){
    if(f.view==="Not specified"){
      vP=0;
    } else {
      vP=rawVP-GRADE_BASE_VIEW[bData.g];
      vP=Math.max(-0.15,Math.min(0.25,vP));
    }
  } else {
    vP=rawVP;
  }
  const isVilla=f.propCategory==="villa";
  const floorN=parseInt(f.floor)||0;
  // Villas: always fP=0 (ground-level, no floor premium)
  // Apartments in DB: differential vs grade-dependent baseline floor
  // Ultra/A+ towers are typically 40-80 floors; using floor 15 baseline overstates premium
  const GRADE_FLOOR_BASE={"Ultra":35,"A+":25,"A":20,"A-":15,"B+":12,"B":10,"C":8};
  let fP=0;
  if(!isVilla){
    if(bData&&floorN>0){
      const floorBase=GRADE_FLOOR_BASE[bData.g]||15;
      const diffFloors=floorN-floorBase;
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
  const studyP=f.hasStudy?0.02:0;
  const upgradeP=f.isUpgraded?0.05:0;
  const privatePoolP=isVilla&&f.privatePool?0.12:0;  // 12% - private pool premium (Dubai market)
  const singleRowP=isVilla&&f.singleRow?0.08:0;    // 8% - single row / end-unit privacy
  const cornerVillaP=isVilla&&f.cornerVilla?0.05:0; // 5% - corner plot premium
  // Developer-furnished buildings (df:1): base PSF already includes furniture premium
  // Selecting "Furnished" = no extra premium (already in price); "Unfurnished" = discount
  const isDevFurnished=!!(bData&&bData.df);
  const estVal=basePSF*size;
  // Real furniture packages cost roughly a FIXED AED amount regardless of the
  // unit's price — so the adjustment must shrink as a % of price for
  // expensive units, same graduated table for both directions (adding
  // furniture to a bare unit, or discounting for stripping it from a
  // developer-furnished one). Real bug fixed 2026-07-15 (site owner caught
  // it): a flat -10% here meant a 15M unit priced at -1.5M and a 40M
  // penthouse at -4M for "removing furniture" — far beyond any real
  // furniture package cost, and 6-8x more than what this same table already
  // charges for ADDING furniture at that price point. Same fRate table now
  // used for both branches so the two directions stay consistent with each
  // other at every price point.
  const fRate=estVal>=30e6?[0.015,0.01]:estVal>=15e6?[0.025,0.015]:estVal>=5e6?[0.04,0.025]:estVal>=2e6?[0.07,0.04]:[0.10,0.05];
  let furnP;
  if(isDevFurnished){
    furnP=f.furnished==="Unfurnished"?-fRate[0]:f.furnished==="Semi-Furnished"?-fRate[1]:0;
  }else if(f.furnished==="Furnished"||f.furnished==="Semi-Furnished"){
    furnP=f.furnished==="Furnished"?fRate[0]:fRate[1];
  }else{
    furnP=0;
  }
  const geoAdj=getAreaGeoAdj(f.area)||0;
  // Location Intelligence: metro/amenity proximity premium
  const geoScore=computeGeoScore(f.area);
  const locP=geoScore?geoScore.locationPremium:0;
  let hedonicMult=(1+vP)*(1+fP)*(1+loftP)*(1+penthP)*(1+maidP)*(1+studyP)*(1+upgradeP)*(1+furnP)*(1+privatePoolP)*(1+singleRowP)*(1+cornerVillaP)*(1+geoAdj)*(1+locP);
  const hedonicCap=bData&&bData.g==="Ultra"?1.40:bData&&bData.g==="A+"?1.45:1.50;
  if(hedonicMult>hedonicCap)hedonicMult=hedonicCap;
  const adjPSF=Math.round(basePSF*hedonicMult);
  psfLo=Math.round(psfLo*hedonicMult);psfHi=Math.round(psfHi*hedonicMult);
  return{adjPSF,psfLo,psfHi,basePSF,bData,vdbEntry,dataSource,dataLayer,compData,
    calFactor,momFactor,typeAdj,dynBench,liveSig,aData,isVillaType,isVilla,isDevFurnished,
    vP,fP,furnP,loftP,penthP,maidP,studyP,upgradeP,privatePoolP,singleRowP,cornerVillaP,
    geoAdj,geoScore,locP,hedonicMult,hedonicCap};
}

// --- VALUATION ENGINE ---------------------------------------------------------
function computeValuation(f,buildingVal,liveData){
  const adj=computeAdjustedPSF(f,buildingVal,liveData);
  const{adjPSF,psfLo,psfHi,bData,vdbEntry,dataSource,dataLayer,compData,aData,
    isVilla,isDevFurnished,vP,fP,furnP,loftP,penthP,maidP,privatePoolP,singleRowP,cornerVillaP,
    geoAdj,geoScore,locP,calFactor,momFactor,dynBench,liveSig}=adj;
  const size=parseFloat((f.buaSize||f.size||"").toString().replace(/,/g,""))||0;
  const price=parseFloat((f.price||"").toString().replace(/,/g,""))||0;
  const askPSF=size>0&&price>0?Math.round(price/size):0;
  if(!askPSF||!f.area)return null;
  const parkBonus=Math.max(0,(parseInt(f.parking)||1)-1)*80000;
  const fairPrice=Math.round(adjPSF*size+parkBonus);
  // Area-sensitive price ladder (based on DLD distress data March 2026)
  var areaSens=(["Palm Jumeirah","Dubai Marina","Downtown Dubai","DIFC","Dubai Harbour","Emaar Beachfront","Jumeirah Beach Residence","City Walk"].indexOf(f.area)>=0)?"high":(["Business Bay","Dubai Creek Harbour","MBR City","Sobha Hartland","Dubai Hills Estate","Jumeirah Lake Towers"].indexOf(f.area)>=0)?"med":"low";
  var isUltraLux=fairPrice>=30e6;
  var distressFloor=isUltraLux?0.72:areaSens==="high"?0.78:areaSens==="med"?0.82:0.85;
  var goodFloor=isUltraLux?0.87:areaSens==="high"?0.90:areaSens==="med"?0.92:0.93;
  var overCeil=isUltraLux?1.08:areaSens==="high"?1.10:areaSens==="med"?1.12:1.14;
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
  const liveBonus=liveSig&&liveSig.source==="live_tx"?3:liveSig?1:0;
  // Sample-size confidence adjustment: a VALUATION_DB entry calibrated from
  // only a couple of real DLD transactions (n) is a materially weaker basis
  // than one backed by dozens — one of those few transactions could be a
  // gift/partial-share transfer that slipped past both the global PSF bounds
  // and the Tukey-fence outlier filter (tools/calibrate-db.js) applied at
  // calibration time. Older valuation-db.js builds don't carry `n` at all
  // (dropped "to save space" before this fix), so this is a no-op until the
  // next calibration refresh — graceful, not a regression.
  const nAdj=vdbEntry&&typeof vdbEntry.n==="number"?(vdbEntry.n<5?-3:vdbEntry.n>=15?2:0):0;
  // FSD-style spread adjustment (CoreLogic Forecast Standard Deviation logic):
  // tighter lo-hi PSF range relative to price = more confident estimate
  const relSpread=adjPSF>0?(psfHi-psfLo)/adjPSF:0.25;
  const spreadAdj=relSpread<=0.15?5:relSpread<=0.25?0:relSpread<=0.40?-5:-10;
  const confScore=Math.min(97,Math.max(40,baseConf+inputPenalty+spreadAdj+compBonus+dynBonus+calBonus+liveBonus+nAdj));
  const confTier=confScore>=90?{label:"Very High",range:"±3–5%",spread:0.04,c:"green"}:confScore>=80?{label:"High",range:"±5–8%",spread:0.07,c:"green"}:confScore>=68?{label:"Medium",range:"±8–12%",spread:0.11,c:"yellow"}:confScore>=55?{label:"Low",range:"±12–18%",spread:0.15,c:"yellow"}:{label:"Indicative",range:"±18–25%",spread:0.22,c:"red"};
  const priceLow=Math.round(fairPrice*(1-confTier.spread));
  const priceHigh=Math.round(fairPrice*(1+confTier.spread));
  const bnMap={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5,"6 BR":6,"7 BR":7,"7+ BR":7};
  const bn=bnMap[f.beds]!=null?bnMap[f.beds]:2;
  let rent=isVilla?(bn<=2?aData.rv2||130000:bn<=3?aData.rv3||180000:bn<=4?aData.rv4||240000:bn<=5?aData.rv5||350000:bn<=6?aData.rv6||500000:aData.rv7||650000):bn===0?(aData.rStudio||(aData.r1||65000)*0.65):bn===1?aData.r1||65000:bn===2?aData.r2||100000:bn===3?aData.r3||150000:(aData.r3||150000)*1.4;
  if(bData&&bData.g){var _isBranded=bData.df===1;var _grm=bData.g==="Ultra"?(_isBranded?1.80:1.50):bData.g==="A+"?(_isBranded?1.35:1.15):bData.g==="A"?1.10:bData.g==="A-"?1.0:bData.g==="B+"?0.92:bData.g==="B"?0.85:bData.g==="C"?0.78:1.0;if(_grm!==1.0)rent=Math.round(rent*_grm);}
  var _furnRentM=f.furnished==="Furnished"?1.17:f.furnished==="Semi-Furnished"?1.09:1.0;
  rent=Math.round(rent*_furnRentM);
  if(f.view&&f.view!=="Not specified"){var _vl=f.view.toLowerCase();var _vrm=_vl==="burj khalifa + fountain"?1.18:_vl.indexOf("fountain")>=0?1.15:_vl.indexOf("full sea")>=0||_vl.indexOf("burj khalifa")>=0?1.12:_vl.indexOf("beach access")>=0||_vl.indexOf("palm")>=0?1.10:_vl.indexOf("marina")>=0||_vl.indexOf("full canal")>=0||_vl.indexOf("partial burj")>=0?1.08:_vl.indexOf("partial sea")>=0?1.07:_vl.indexOf("golf")>=0||_vl.indexOf("boulevard")>=0?1.06:_vl.indexOf("lagoon")>=0||_vl.indexOf("creek")>=0||_vl.indexOf("lake")>=0?1.05:_vl.indexOf("skyline")>=0?1.04:_vl.indexOf("partial canal")>=0||_vl.indexOf("sheikh zayed")>=0?1.03:_vl.indexOf("garden")>=0||_vl.indexOf("park")>=0?1.02:_vl.indexOf("pool")>=0||_vl.indexOf("community")>=0?1.01:1.0;rent=Math.round(rent*_vrm);}
  if(!isVilla&&f.floor){var _fl=parseInt(f.floor)||0;if(_fl>=40)rent=Math.round(rent*1.05);else if(_fl>=25)rent=Math.round(rent*1.03);else if(_fl>=15)rent=Math.round(rent*1.02);}
  // Service charge is now fully manual (2026-07-17) — per-building sc figures
  // in the DB had confirmed errors, and silently substituting them into a
  // headline Net Yield number was worse than a disclosed generic estimate.
  // Only the user's own entered value is trusted here; the flat 15 fallback
  // is a neutral Dubai-wide placeholder, never presented as building-specific.
  const sc=(parseFloat(f.serviceCharge)||15)*size;
  const grossYield=(rent/price*100).toFixed(1);
  const netYield=((rent-sc)/price*100).toFixed(1);
  const gr=aData.g||[3,9,16];
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
  // Rental Demand Score — same estimateRentalDemandScore() used by Smart
  // Discovery (js/app.js), now surfaced in the Analyzer report too, since a
  // buyer evaluating a purchase for rental income needs this at the exact
  // moment of the buy decision, not only in a separate discovery list. Uses
  // the building's own calibrated PSF (bData.p) — a structural attribute of
  // the BUILDING, not this one listing's asking price (which the verdict/
  // vsPct fields above already judge separately) — falling back to askPSF
  // only when no building match exists to compare against.
  const demandPsf=bData?bData.p:askPSF;
  const rentVelForDemand=(typeof getRentalVelocity==="function")?getRentalVelocity(f.area):null;
  const demandScore=estimateRentalDemandScore(bData,aData,demandPsf,bldgUnits,rentVelForDemand,f.area);
  // --- Margin of Safety (MoS) Index ---
  // Component 1: Price Gap (50% weight) — how far below/above fair value
  const vsPctNum=parseFloat(vsPct)||0;
  const priceGapScore=vsPctNum<=-20?95:vsPctNum<=-12?85:vsPctNum<=-5?72:vsPctNum<=0?58:vsPctNum<=5?42:vsPctNum<=12?25:10;
  // Component 2: Building Quality & Condition (20% weight)
  // scPSF (the actual figure being judged) is now manual-only, same reasoning
  // as the sc calc above — but expectedSC stays an AREA-level average (an
  // aggregate across many buildings, not one potentially-wrong per-building
  // DB entry) since it's only ever used as a comparison benchmark here, never
  // reported to the user as this property's own service charge.
  const scPSF=parseFloat(f.serviceCharge)||15;
  const areaSCAvg=aData.sc||15;
  const expectedSC=areaSCAvg;
  const scRatio=expectedSC>0?scPSF/expectedSC:1;
  const scScore=scRatio<=0.85?90:scRatio<=1.05?80:scRatio<=1.20?60:scRatio<=1.50?40:20;
  const bGrade=bData?bData.g:null;
  const gradeBonus=bGrade==="Ultra"?15:bGrade==="A+"?12:bGrade==="A"?8:bGrade==="A-"?5:bGrade==="B+"?2:0;
  const timeDecayScore=Math.min(95,scScore+gradeBonus);
  // Component 3: Market Depth (30% weight) — is asking PSF within the building's or area's liquid range?
  const mdRef=vdbEntry?vdbEntry.p:(bData?bData.p:aData.psf||1500);
  const mdRange=vdbEntry?Math.max(1,vdbEntry.hi-vdbEntry.lo):(bData?Math.max(1,(bData.hi||mdRef)-(bData.lo||mdRef)):mdRef*0.30);
  const mdMid=vdbEntry?(vdbEntry.lo+vdbEntry.hi)/2:(bData?(bData.lo+bData.hi)/2:mdRef);
  const psfDeviation=mdRef>0?Math.abs(askPSF-mdMid)/(mdRange||mdRef*0.30):0.5;
  const marketDepthScore=psfDeviation<=0.5?90:psfDeviation<=1.0?72:psfDeviation<=1.5?50:psfDeviation<=2.5?30:15;
  // Composite MoS (weighted)
  const mosRaw=Math.round(priceGapScore*0.50+timeDecayScore*0.20+marketDepthScore*0.30);
  const mosScore=Math.min(95,Math.max(5,mosRaw));
  const mosTier=mosScore>=80?{label:"Deep Value",c:"green",desc:"Strong margin of safety — price significantly below intrinsic value with favorable market conditions"}:mosScore>=65?{label:"Value Buy",c:"green",desc:"Positive margin of safety — priced below fair value with room for appreciation"}:mosScore>=50?{label:"Fair Entry",c:"yellow",desc:"Neutral margin — price aligns with market value, moderate risk-reward balance"}:mosScore>=35?{label:"Thin Margin",c:"yellow",desc:"Limited safety buffer — priced at or slightly above value, returns depend on market growth"}:{label:"Speculative",c:"red",desc:"Negative margin of safety — price exceeds intrinsic value, high risk of capital loss in a downturn"};
  return{askPSF,adjPSF,psfLo,psfHi,fairPrice,distressPrice,goodPrice,overpricedAt,verdict,vsPct:vsPct.toFixed(1),suggestedOffer,dataSource,dataLayer,confScore,confTier,priceLow,priceHigh,inDB:!!bData,bData,isDevFurnished,vP:Math.round(vP*100),fP:Math.round(fP*100),furnP:Math.round(furnP*100),loftP:Math.round(loftP*100),penthP:Math.round(penthP*100),maidP:Math.round(maidP*100),privatePoolP:Math.round(privatePoolP*100),singleRowP:Math.round(singleRowP*100),cornerVillaP:Math.round(cornerVillaP*100),locP:Math.round(locP*100),geo:Math.round(geoAdj*100),rent,sc,grossYield,netYield,g0:gr[0],g1:gr[1],g2:gr[2],prRatio:prRatio?prRatio.toFixed(1):null,investSignal,totalReturnAnnual,domEst,txVol,liqScore,liqTier,txLabel,turnoverRate,turnoverTier,bldgUnits,bldgAnnualTx,mosScore,mosTier,priceGapScore,timeDecayScore,marketDepthScore,demandScore,compData:compData,hasDynamic:!!dynBench,calFactor:calFactor,geoScore:geoScore,momFactor:momFactor,hasMomentum:!!(typeof MOMENTUM_LOADED!=="undefined"&&MOMENTUM_LOADED&&(MARKET_MOMENTUM[f.area]||MARKET_MOMENTUM["_overall"])),liveSig:liveSig};
}

// --- SMART RENTAL INTELLIGENCE ENGINE ----------------------------------------
var SEASONAL_FACTORS=[1.03,1.02,1.0,0.98,0.96,0.94,0.92,0.92,0.96,0.99,1.02,1.04];
var SEASON_LABELS=["Peak Season","High Season","Normal","Cooling","Pre-Summer","Summer Dip","Off-Season","Off-Season","Recovery","Normal","High Season","Peak Season"];

function computeSmartRent(f,liveRentals){
  var buildingVal=(f.building||"").toLowerCase().trim();
  var bData=lookupBuilding(buildingVal,f.area);
  var aData=AREAS[f.area]||null;
  if(!aData)return null;
  var isVilla=f.propCategory==="villa";
  var bnMap={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5};
  var bn=bnMap[f.beds]!=null?bnMap[f.beds]:2;
  var price=parseFloat(String(f.price||"").replace(/[^0-9.]/g,""))||0;
  var size=parseFloat(String(f.size||f.buaSize||"").replace(/,/g,""))||0;
  // --- Layer 1: Hedonic static estimate ---
  var staticRent=isVilla?(bn<=2?aData.rv2||130000:bn<=3?aData.rv3||180000:bn<=4?aData.rv4||240000:bn<=5?aData.rv5||350000:bn<=6?aData.rv6||500000:aData.rv7||650000):bn===0?(aData.rStudio||(aData.r1||65000)*0.65):bn===1?aData.r1||65000:bn===2?aData.r2||100000:bn===3?aData.r3||150000:(aData.r3||150000)*1.4;
  if(bData&&bData.g){var _grm=bData.g==="Ultra"?1.80:bData.g==="A+"?1.35:bData.g==="A"?1.10:bData.g==="A-"?1.0:bData.g==="B+"?0.92:bData.g==="B"?0.85:bData.g==="C"?0.78:1.0;if(_grm!==1.0)staticRent=Math.round(staticRent*_grm);}
  var _fM=f.furnished==="Furnished"?1.17:f.furnished==="Semi-Furnished"?1.09:1.0;
  staticRent=Math.round(staticRent*_fM);
  if(f.view&&f.view!=="Not specified"){var _vl=f.view.toLowerCase();var _vrm=_vl==="burj khalifa + fountain"?1.18:_vl.indexOf("fountain")>=0?1.15:_vl.indexOf("full sea")>=0||_vl.indexOf("burj khalifa")>=0?1.12:_vl.indexOf("beach access")>=0||_vl.indexOf("palm")>=0?1.10:_vl.indexOf("marina")>=0||_vl.indexOf("full canal")>=0||_vl.indexOf("partial burj")>=0?1.08:_vl.indexOf("partial sea")>=0?1.07:_vl.indexOf("golf")>=0||_vl.indexOf("boulevard")>=0?1.06:_vl.indexOf("lagoon")>=0||_vl.indexOf("creek")>=0||_vl.indexOf("lake")>=0?1.05:_vl.indexOf("skyline")>=0?1.04:_vl.indexOf("partial canal")>=0||_vl.indexOf("sheikh zayed")>=0?1.03:_vl.indexOf("garden")>=0||_vl.indexOf("park")>=0?1.02:_vl.indexOf("pool")>=0||_vl.indexOf("community")>=0?1.01:1.0;staticRent=Math.round(staticRent*_vrm);}
  if(!isVilla&&f.floor){var _fl=parseInt(f.floor)||0;if(_fl>=40)staticRent=Math.round(staticRent*1.05);else if(_fl>=25)staticRent=Math.round(staticRent*1.03);else if(_fl>=15)staticRent=Math.round(staticRent*1.02);}
  // --- Layer 2: Live market calibration ---
  // Uses the same Tukey-fence robust median as the sale-side live signal
  // (getLiveSignal(), above) — a raw median or a fixed 10-90th percentile
  // clip (the previous logic here) does nothing to protect against a bait
  // rental listing at a fraction of market rate: with a raw median, a single
  // low outlier among 2-3 buildingMatches pulls the estimate directly; the
  // fixed percentile clip is a no-op at the small sample sizes (3-8
  // listings) this actually runs at in practice. There's no rental
  // equivalent of real sale transactions available via the integrated
  // APIs (Ejari-registered signed leases aren't exposed), so both tiers
  // here are asking-rent listings — the fence is the only defense.
  var liveRent=null,liveSource=null,liveCount=0,liveMedian=null,liveLow=null,liveHigh=null,liveListings=[];
  if(liveRentals){
    if(liveRentals.buildingMatches&&liveRentals.buildingMatches.length>=2){
      var prices=liveRentals.buildingMatches.map(function(l){return l.price;}).sort(function(a,b){return a-b;});
      liveMedian=Math.round(_robustMedian(prices));
      liveLow=prices[0];liveHigh=prices[prices.length-1];
      liveRent=liveMedian;liveSource="live_building";liveCount=prices.length;
      liveListings=liveRentals.buildingMatches;
    }else if(liveRentals.areaListings&&liveRentals.areaListings.length>=3){
      var prices=liveRentals.areaListings.map(function(l){return l.price;}).sort(function(a,b){return a-b;});
      var areaMedian=_robustMedian(prices);
      var _grm2=bData&&bData.g==="Ultra"?1.80:bData&&bData.g==="A+"?1.35:bData&&bData.g==="A"?1.10:1.0;
      liveRent=Math.round(areaMedian*_grm2);
      liveSource="live_area";liveCount=prices.length;
      liveLow=prices[0];liveHigh=prices[prices.length-1];
      liveListings=liveRentals.areaListings;
    }
  }
  // --- Layer 3: Seasonal adjustment ---
  var month=new Date().getMonth();
  var seasonalFactor=SEASONAL_FACTORS[month];
  var seasonLabel=SEASON_LABELS[month];
  // --- Blend layers ---
  var finalRent,source,confidence,sourceLabel;
  if(liveRent&&liveSource==="live_building"&&liveCount>=3){
    finalRent=liveRent;source="live_building";confidence="high";
    sourceLabel="Live Building Data ("+liveCount+" listings)";
  }else if(liveRent&&liveSource==="live_building"){
    finalRent=Math.round(liveRent*0.7+staticRent*seasonalFactor*0.3);
    source="live_blended";confidence="medium-high";
    sourceLabel="Building + Model Blend ("+liveCount+" listings)";
  }else if(liveRent&&liveSource==="live_area"){
    finalRent=Math.round(liveRent*0.5+staticRent*seasonalFactor*0.5);
    source="area_blended";confidence="medium";
    sourceLabel="Area Market + Model ("+liveCount+" listings)";
  }else{
    finalRent=Math.round(staticRent*seasonalFactor);
    source="estimated";confidence="base";
    sourceLabel="Hedonic Model Estimate";
  }
  // --- Yield recalculation ---
  // Service charge is fully manual (2026-07-17) — see computeValuation() for
  // why per-building/area DB sc figures were removed from this calculation.
  var sc=(parseFloat(f.serviceCharge)||15)*size;
  var grossYield=price>0?(finalRent/price*100).toFixed(1):"0.0";
  var netYield=price>0?((finalRent-sc)/price*100).toFixed(1):"0.0";
  var grossYieldNum=parseFloat(grossYield);
  var prRatio=grossYieldNum>0?100/grossYieldNum:null;
  var investSignal=prRatio===null?null:prRatio<15?{label:"Undervalued",c:"green"}:prRatio<20?{label:"Fair Value",c:"green"}:prRatio<25?{label:"Elevated",c:"yellow"}:{label:"Bubble Risk",c:"red"};
  var gr=aData.g||[3,9,16];
  var totalReturnAnnual=(parseFloat(netYield)+gr[1]/3).toFixed(1);
  return{
    rent:finalRent,rentLow:Math.round(finalRent*0.88),rentHigh:Math.round(finalRent*1.12),
    staticRent:staticRent,liveRent:liveRent,liveMedian:liveMedian,liveLow:liveLow,liveHigh:liveHigh,
    source:source,sourceLabel:sourceLabel,liveCount:liveCount,liveListings:liveListings,
    seasonalFactor:seasonalFactor,seasonLabel:seasonLabel,confidence:confidence,
    grossYield:grossYield,netYield:netYield,prRatio:prRatio?prRatio.toFixed(1):null,
    investSignal:investSignal,totalReturnAnnual:totalReturnAnnual,sc:sc,
    bayutCount:liveRentals?liveRentals.bayutCount:0,pfCount:liveRentals?liveRentals.pfCount:0
  };
}

var _BEDS_NUM_MAP={"Studio":0,"1 BR":1,"2 BR":2,"3 BR":3,"4 BR":4,"5 BR":5,"5+ BR":5,"6 BR":6,"7 BR":7,"7+ BR":7};
// Per-building refinement on top of the area-level VILLA_AREAS flag — added
// 2026-07-18, at the user's explicit request, after the Quick Check audit
// flagged that ~12 major "villa" areas (Palm Jumeirah, Dubai Hills Estate,
// Meydan, MBR City, Sobha Hartland, Town Square, Al Furjan, Motor City,
// Dubai South, Nad Al Sheba, Palm Jebel Ali, Dubai Islands) are genuinely
// MIXED with real apartment towers, so every bulk building scan across the
// app (Quick Check, Smart Discovery, Alerts, Compare) was misapplying villa
// rent/size assumptions to real apartment buildings in those areas.
//
// Two candidate per-building classifiers were built and EMPIRICALLY TESTED
// against the real 9,226-building database before this one was chosen —
// both failed and were rejected, not just assumed to be risky:
//   1. Generic apartment-tower keywords ("tower"/"residences"/"views"/
//      "heights") — rejected because real villa/townhouse clusters
//      legitimately use these words too (e.g. "Golf Views" in Jumeirah Golf
//      Estates and "Hills View" in Dubai Hills Estate are villa/townhouse
//      communities, and villa cluster "Golf Place III - Tower 1/2" contains
//      the word "tower").
//   2. A BLDG_UNITS (unit count) threshold — rejected because real villa
//      clusters (e.g. "Sidra 1", "Golf Grove", "Palm Hills", "Majestic
//      Vistas") show BLDG_UNITS of 380-500, statistically indistinguishable
//      from real apartment towers in the same mixed area ("Executive
//      Residences", "Golf Suites" — also 300-500).
// The one signal that held up under a full cross-check of all 2,195
// buildings across the 12 known-mixed areas (zero name conflicts) is the
// building's OWN name literally stating its type — "Villa"/"Townhouse" is
// real, unambiguous evidence of a villa/townhouse, and "Apartment(s)" with
// no such word alongside it is real, unambiguous evidence of an apartment
// building (e.g. "Shoreline Apartments 1-16", "Marina Apartments 1-6",
// "Palm Jumeirah Apartments" in Palm Jumeirah). This intentionally does NOT
// try to catch every apartment building in a mixed area — most (e.g. "Park
// Heights", "Executive Residences") carry no explicit type word in their
// name, so they keep the area-level default. Closing that remaining gap
// needs a real per-building type field verified through actual research —
// a js/data-residential.js change owned by the research branch, not
// something safe to guess at here.
function isVillaBuilding(key,area){
  var isVillaArea=typeof VILLA_AREAS!=="undefined"&&VILLA_AREAS.has&&VILLA_AREAS.has(area);
  if(!isVillaArea)return false;
  if(!key)return true;
  var k=String(key).toLowerCase();
  var hasApt=k.indexOf("apartment")>=0;
  var hasVillaWord=k.indexOf("villa")>=0||k.indexOf("townhouse")>=0;
  if(hasApt&&!hasVillaWord)return false;
  return true;
}
// Rent premium/discount by building grade — branded/Ultra residences command
// materially higher rent than their bare PSF alone would suggest (concierge,
// hotel services, amenities), while lower grades rent for less. Single source
// of truth: used by computeRentalValuation (per-unit) AND by the bulk
// building-yield estimators below (Smart Discovery, Compare, Find/DB search) —
// previously this premium only existed inline inside computeRentalValuation,
// so any bulk building ranking silently used PSF alone with no grade signal.
var GRADE_RENT_PREMIUM={"Ultra":1.80,"A+":1.35,"A":1.10,"A-":1.0,"B+":0.92,"B":0.85,"C":0.78};
// Assumed typical unit size per bed count — matches the ladder Find's
// doDBSearch already used inline (Studio 500 / 1BR 750 / 2BR 1100 / 3BR 1600),
// extended for larger units. Only used where a real size isn't user-entered
// (bulk building scans), never overrides an actual size when one is known.
var TYPICAL_UNIT_SIZE={0:500,1:750,2:1100,3:1600,4:2200,5:3000,6:4200,7:5500};
// Villa/townhouse units run materially larger than an apartment with the
// same bed count (private garden/garage/multiple floors) — a real Dubai
// 3BR townhouse commonly runs 2,000-2,800 sqft (vs ~1,600 sqft for a 3BR
// apartment), and a 4-5BR villa often runs 3,000-5,500+ sqft. Added
// 2026-07-18 (Quick Check audit) — TYPICAL_UNIT_SIZE above was silently
// reused for villa-area buildings too, systematically UNDERSTATING real
// villa building prices/rents (estPrice=psf×size) in every bulk building
// scan that passes isVilla=true (Quick Check's building recommender,
// Smart Discovery, Alerts). No entry below bn=2 — Studio/1BR "villa" hits
// are almost always a mixed-area apartment building misclassified by the
// area-level VILLA_AREAS flag (see the CLAUDE.md work-log note on mixed
// villa/apartment areas), so those fall back to TYPICAL_UNIT_SIZE instead
// of guessing a villa size that wouldn't apply anyway.
var TYPICAL_VILLA_UNIT_SIZE={2:1900,3:2400,4:3400,5:4800,6:6500,7:8500};
// Area rent benchmark for a given bed count/type, before any grade/furnished/
// view/floor adjustment — the base rung of computeRentalValuation's ladder,
// pulled out so bulk building scans can reuse the exact same area rent figures
// instead of falling back to a flat area-wide yield for every building.
function _baseAreaRent(aData,beds,isVilla){
  var bn=_BEDS_NUM_MAP[beds]!=null?_BEDS_NUM_MAP[beds]:2;
  return isVilla?(bn<=2?aData.rv2||130000:bn<=3?aData.rv3||180000:bn<=4?aData.rv4||240000:bn<=5?aData.rv5||350000:bn<=6?aData.rv6||500000:aData.rv7||650000):bn===0?(aData.rStudio||(aData.r1||65000)*0.65):bn===1?aData.r1||65000:bn===2?aData.r2||100000:bn===3?aData.r3||150000:(aData.r3||150000)*1.4;
}
// Real building-level rental yield, scaled from the area's yield band by how
// this SPECIFIC building's PSF compares to the area average and its grade's
// rent premium — without this, every building in an area showed the exact
// same flat yield (real bug found 2026-07-13: Smart Discovery's "Sort by
// Highest Yield" / "Min Yield %" filter could not actually tell a AED 900/sqft
// building apart from a AED 2,400/sqft building in the same area). No specific
// bed count/size is available in a bulk PSF-only scan, so this uses the PSF
// ratio directly (the assumed unit size cancels out of gross yield = rent/price
// when both are scaled by the same size) instead of a fixed size assumption.
function estimateBuildingYield(bData,aData,psf){
  if(!aData)return null;
  var yi=aData.y||[5,7];
  var areaYieldMid=(yi[0]+yi[1])/2;
  var areaPsf=aData.psf||psf;
  if(!psf||psf<=0||!areaPsf)return{gross:areaYieldMid,net:areaYieldMid};
  var gradeRentP=(bData&&bData.g&&GRADE_RENT_PREMIUM[bData.g])||1.0;
  var gross=areaYieldMid*(areaPsf/psf)*gradeRentP;
  gross=Math.max(1,Math.min(20,gross)); // clamp — guards against outlier/erroneous PSF entries producing absurd yields
  var sc=(bData&&bData.sc)||aData.sc||15;
  var net=gross-(sc/psf*100);
  return{gross:gross,net:net};
}
// Same building-level accuracy as estimateBuildingYield, but for contexts that
// DO have a bed count (Find's DB search) — uses the real area rent benchmark
// for that bed count (grade-adjusted) over a real building-PSF-derived price,
// so estRent is an actual AED figure (not reverse-derived from price×yield,
// which was the previous bug: it produced a "rent" with no connection to any
// real rent benchmark, just an assumed flat area yield times the price).
function estimateBuildingRentYield(bData,aData,beds,isVilla,psf){
  if(!aData||!psf||psf<=0)return null;
  var _bn=_BEDS_NUM_MAP[beds]!=null?_BEDS_NUM_MAP[beds]:2;
  var size=(isVilla&&TYPICAL_VILLA_UNIT_SIZE[_bn])||TYPICAL_UNIT_SIZE[_bn]||1100;
  var gradeRentP=(bData&&bData.g&&GRADE_RENT_PREMIUM[bData.g])||1.0;
  var estRent=Math.round(_baseAreaRent(aData,beds,isVilla)*gradeRentP);
  var estPrice=Math.round(psf*size);
  var gross=estPrice>0?(estRent/estPrice*100):0;
  var sc=((bData&&bData.sc)||aData.sc||15)*size;
  var net=estPrice>0?((estRent-sc)/estPrice*100):0;
  return{estRent:estRent,estPrice:estPrice,size:size,gross:gross,net:net};
}

// ── Rental Demand Score ──────────────────────────────────────────────────
// Answers "why would/wouldn't THIS building rent fast/easily" with real,
// itemized, building-specific reasons — without pretending to have measured
// per-building days-to-rent data we don't have (only the AREA has that, via
// getRentalVelocity()). This is a REASONED ASSESSMENT from real structural
// factors real estate professionals actually use to judge rentability, each
// one backed by an actual field in our data (never a fabricated number):
//   1. Price competitiveness — building PSF vs its own area average. A unit
//      priced below the area average, for the same rent, is cheaper for a
//      tenant per sqft and typically attracts more/faster interest.
//   2. Grade/tenant-pool breadth — Ultra/A+ narrows the pool to HNW/corporate
//      tenants (steady but smaller); A/A- hits the widest professional+family
//      pool; B/C widens further via affordability but loses some appeal.
//   3. Service charge burden — high SC relative to the unit's own price is a
//      well-known Dubai rental friction point (tenants feel it via building
//      fees/amenities cost even when the landlord pays it directly).
//   4. Building scale/liquidity — larger buildings (BLDG_UNITS) have a bigger,
//      more active pool of agents/tenants already familiar with the building,
//      and more comparable listings to benchmark against.
//   5. Area rental velocity — the REAL, measured area-level signal from
//      getRentalVelocity(), when it's ready (see supabase-rental-liquidity-schema.sql).
// Score is 0-100 (50 = neutral baseline), each driver additive so it stays
// fully explainable — the point is the reasons list, not the number.
function estimateRentalDemandScore(bData,aData,psf,bldgUnits,rentVel,areaName){
  if(!aData||!psf||psf<=0)return null;
  var areaLabel=areaName||"this area";
  var score=50;
  var drivers=[];

  var areaPsf=aData.psf||psf;
  var priceRatio=areaPsf>0?(psf/areaPsf):1;
  if(priceRatio<=0.80){
    score+=15;
    drivers.push({label:"Priced below area average",impact:"+",reason:"This building is priced "+Math.round((1-priceRatio)*100)+"% below the "+areaLabel+" average PSF — for similar rent, tenants get more value per sqft, which typically attracts faster interest."});
  }else if(priceRatio<=0.95){
    score+=6;
    drivers.push({label:"Competitively priced",impact:"+",reason:"Priced modestly below the area average, a mild advantage for tenant interest."});
  }else if(priceRatio>=1.35){
    score-=12;
    drivers.push({label:"Priced well above area average",impact:"-",reason:"This building is priced "+Math.round((priceRatio-1)*100)+"% above the area average PSF — a narrower pool of tenants can justify the premium, which can slow down leasing."});
  }else if(priceRatio>=1.1){
    score-=4;
    drivers.push({label:"Priced above area average",impact:"-",reason:"Priced somewhat above the area average, a mild drag on tenant interest."});
  }

  var grade=bData&&bData.g;
  if(grade==="Ultra"||grade==="A+"){
    score+=4;
    drivers.push({label:"Premium/branded appeal",impact:"+",reason:"\""+grade+"\"-grade branded residences draw steady demand from HNW and corporate tenants, though this pool is smaller than the mainstream market."});
  }else if(grade==="A"||grade==="A-"){
    score+=12;
    drivers.push({label:"Broad tenant appeal",impact:"+",reason:"\""+grade+"\"-grade buildings hit the widest tenant pool — professionals and families who want quality without an ultra-luxury premium — usually the fastest-moving segment."});
  }else if(grade==="B+"||grade==="B"){
    score+=6;
    drivers.push({label:"Affordability-driven demand",impact:"+",reason:"\""+grade+"\"-grade buildings attract budget-conscious tenants through affordability, a real but somewhat narrower driver than the A/A- segment."});
  }else if(grade==="C"){
    score-=8;
    drivers.push({label:"Limited grade appeal",impact:"-",reason:"\"C\"-grade buildings typically see the narrowest tenant interest and can take longer to lease."});
  }

  var scRatio=psf>0?(((bData&&bData.sc)||aData.sc||15)/psf*100):0;
  if(scRatio>=2.2){
    score-=8;
    drivers.push({label:"High service charge load",impact:"-",reason:"Service charge is a high share of this unit's own price ("+scRatio.toFixed(1)+"%) — a well-known Dubai rental friction point that can deter cost-conscious tenants."});
  }else if(scRatio<=1.0){
    score+=5;
    drivers.push({label:"Low service charge load",impact:"+",reason:"Service charge is a low share of this unit's price ("+scRatio.toFixed(1)+"%) — one less friction point for prospective tenants."});
  }

  if(bldgUnits>=400){
    score+=10;
    drivers.push({label:"Large, liquid building",impact:"+",reason:"With "+bldgUnits.toLocaleString()+"+ units, this building has an active, well-established rental market — more agents familiar with it and more comparable listings for tenants to benchmark against."});
  }else if(bldgUnits>0&&bldgUnits<60){
    score-=5;
    drivers.push({label:"Small building",impact:"-",reason:"With only "+bldgUnits+" units, there are fewer comparable rentals in this specific building, which can mean a smaller pool of agents actively marketing it."});
  }

  if(rentVel&&rentVel.ready){
    if(rentVel.avgDaysListed<=21){
      score+=15;
      drivers.push({label:"Area rents fast",impact:"+",reason:"Rental listings in "+areaLabel+" rent in ~"+Math.round(rentVel.avgDaysListed)+" days on average (measured from "+rentVel.sampleSize+" tracked listings) — strong underlying area-wide demand that lifts every building here, including this one."});
    }else if(rentVel.avgDaysListed>=45){
      score-=12;
      drivers.push({label:"Area rents slowly",impact:"-",reason:"Rental listings in "+areaLabel+" take ~"+Math.round(rentVel.avgDaysListed)+" days on average to rent (measured from "+rentVel.sampleSize+" tracked listings) — a headwind that affects every building here, including this one."});
    }
  }else{
    drivers.push({label:"Area rental-speed data still building up",impact:"·",reason:"We're actively tracking real rental listings in this area to measure actual time-to-rent — check back in a few weeks for a measured (not estimated) area rental-speed signal."});
  }

  score=Math.max(0,Math.min(100,Math.round(score)));
  var tier=score>=75?"Very High":score>=60?"High":score>=40?"Moderate":score>=25?"Below Average":"Low";
  return{score:score,tier:tier,drivers:drivers};
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
  var estRent=_baseAreaRent(aData,f.beds,isVilla);
  // Furnished premium on rent: furnished +15-20%, semi +8-10%
  var furnMult=f.furnished==="Furnished"?1.17:f.furnished==="Semi-Furnished"?1.09:1.0;
  estRent=Math.round(estRent*furnMult);
  // View premium on rent
  var viewAdj=1.0;
  if(f.view&&f.view!=="Not specified"){
    var vl=f.view.toLowerCase();
    if(vl==="burj khalifa + fountain")viewAdj=1.18;
    else if(vl.indexOf("fountain")>=0)viewAdj=1.15;
    else if(vl.indexOf("full sea")>=0||vl.indexOf("burj khalifa")>=0)viewAdj=1.12;
    else if(vl.indexOf("beach access")>=0||vl.indexOf("palm")>=0)viewAdj=1.10;
    else if(vl.indexOf("marina")>=0||vl.indexOf("full canal")>=0||vl.indexOf("partial burj")>=0)viewAdj=1.08;
    else if(vl.indexOf("partial sea")>=0)viewAdj=1.07;
    else if(vl.indexOf("golf")>=0||vl.indexOf("boulevard")>=0)viewAdj=1.06;
    else if(vl.indexOf("lagoon")>=0||vl.indexOf("creek")>=0||vl.indexOf("lake")>=0)viewAdj=1.05;
    else if(vl.indexOf("skyline")>=0)viewAdj=1.04;
    else if(vl.indexOf("partial canal")>=0||vl.indexOf("sheikh zayed")>=0)viewAdj=1.03;
    else if(vl.indexOf("garden")>=0||vl.indexOf("park")>=0)viewAdj=1.02;
    else if(vl.indexOf("pool")>=0||vl.indexOf("community")>=0)viewAdj=1.01;
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
    var gradeRentP=GRADE_RENT_PREMIUM[bData.g]||1.0;
    if(gradeRentP!==1.0)estRent=Math.round(estRent*gradeRentP);
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
  // Service charge is fully manual (2026-07-17) — see computeValuation() for
  // why per-building/area DB sc figures were removed from this calculation.
  var sc=(parseFloat(f.serviceCharge)||15)*(size||0);
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
  var gr=aData.g||[3,9,16];
  // Liquidity
  var domEst=aData.dom||60;
  var txVol=aData.txVol||100;
  return{askRent:askRent,estRent:estRent,rentLow:rentLow,rentHigh:rentHigh,vsPct:vsPct.toFixed(1),verdict:verdict,suggestedRent:suggestedRent,confScore:confScore,confTier:confTier,askRentPSF:askRentPSF,estRentPSF:estRentPSF,monthly:Math.round(askRent/12),estMonthly:Math.round(estRent/12),sc:Math.round(sc),netRent:netRent,areaRents:areaRents,inDB:!!bData,bData:bData,dataSource:bData?"Building Database":"Area Benchmark",area:f.area,beds:f.beds||"2 BR",isVilla:isVilla,furnished:f.furnished||"Unfurnished",furnMult:furnMult,viewAdj:viewAdj,gr:gr,domEst:domEst,txVol:txVol,size:size};
}

