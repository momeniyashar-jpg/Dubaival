const { supabaseRequest, SUPABASE_URL } = require("./lib/shared");

const UAE_RE_HOST = "uae-real-estate2.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";

const AREA_LOCATION_MAP = {
  "Dubai Marina":"dubai-marina","Downtown Dubai":"downtown-dubai",
  "Palm Jumeirah":"palm-jumeirah","Business Bay":"business-bay",
  "JVC":"jumeirah-village-circle","Dubai Hills Estate":"dubai-hills-estate",
  "MBR City":"mohammed-bin-rashid-city","Dubai Creek Harbour":"dubai-creek-harbour",
  "Jumeirah Lake Towers":"jumeirah-lake-towers","DAMAC Hills":"damac-hills",
  "Arabian Ranches":"arabian-ranches","Dubai Silicon Oasis":"dubai-silicon-oasis",
  "International City":"international-city","Dubai Sports City":"dubai-sports-city",
  "Jumeirah Beach Residence":"jumeirah-beach-residence","DIFC":"difc",
  "Al Barsha":"al-barsha","Emaar Beachfront":"emaar-beachfront",
  "Town Square":"town-square","Motor City":"motor-city",
  "Discovery Gardens":"discovery-gardens","Al Furjan":"al-furjan",
  "Dubai South":"dubai-south","Mirdif":"mirdif",
  "Jumeirah Village Triangle":"jumeirah-village-triangle",
  "Sobha Hartland":"sobha-hartland","City Walk":"city-walk",
  "Dubai Harbour":"dubai-harbour","Dubailand":"dubailand",
  "Production City":"impz","Al Quoz":"al-quoz","Barsha Heights":"barsha-heights",
  "The Valley":"the-valley","Tilal Al Ghaf":"tilal-al-ghaf",
  "Dubai Land Residence Complex":"dlrc","Jumeirah":"jumeirah",
  "Al Sufouh":"al-sufouh","Mudon":"mudon","Reem":"reem",
  "The Greens":"the-greens","The Views":"the-views"
};

function trimmedMean(arr) {
  if (!arr.length) return null;
  arr.sort(function(a,b){return a-b;});
  var lo = arr[Math.floor(arr.length * 0.2)];
  var hi = arr[Math.floor(arr.length * 0.8)];
  var trimmed = arr.filter(function(v){return v >= lo && v <= hi;});
  var pool = trimmed.length ? trimmed : arr;
  return Math.round(pool.reduce(function(s,v){return s+v;}, 0) / pool.length);
}

async function fetchAreaListings(areaSlug, purpose) {
  try {
    var url = "https://" + UAE_RE_HOST + "/properties/list" +
      "?locationExternalIDs=" + encodeURIComponent(areaSlug) +
      "&purpose=" + purpose +
      "&hitsPerPage=25&page=0&sort=date-desc";
    var r = await fetch(url, {
      headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": UAE_RE_HOST }
    });
    if (!r.ok) return [];
    var data = await r.json();
    return (data.hits || []).filter(function(h) {
      return h.price > 0 && h.area > 0;
    });
  } catch(e) {
    return [];
  }
}

function extractRents(listings) {
  var byBeds = {};
  listings.forEach(function(l) {
    var beds = l.rooms || 0;
    if (!byBeds[beds]) byBeds[beds] = [];
    byBeds[beds].push(l.price);
  });
  return {
    studio: trimmedMean(byBeds[0] || []),
    r1: trimmedMean(byBeds[1] || []),
    r2: trimmedMean(byBeds[2] || []),
    r3: trimmedMean(byBeds[3] || [])
  };
}

module.exports = async function handler(req, res) {
  if (process.env.CRON_SECRET && req.headers.authorization !== "Bearer " + process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  var areas = Object.keys(AREA_LOCATION_MAP);
  var results = { updated: 0, skipped: 0, errors: 0, history: 0 };

  for (var i = 0; i < areas.length; i++) {
    var area = areas[i];
    var slug = AREA_LOCATION_MAP[area];
    try {
      var saleListings = await fetchAreaListings(slug, "for-sale");
      var rentListings = await fetchAreaListings(slug, "for-rent");

      var salePsfs = saleListings.map(function(l){ return Math.round(l.price / l.area); })
        .filter(function(p){ return p > 400 && p < 15000; });
      var psf = trimmedMean(salePsfs);
      var rents = extractRents(rentListings);

      if (!psf && !rents.r1) {
        results.skipped++;
        continue;
      }

      var row = { area_key: area, updated_at: new Date().toISOString(), sample_size: salePsfs.length };
      if (psf) row.psf = psf;
      if (rents.studio) row.rent_studio = rents.studio;
      if (rents.r1) row.rent_1br = rents.r1;
      if (rents.r2) row.rent_2br = rents.r2;
      if (rents.r3) row.rent_3br = rents.r3;

      var resp = await supabaseRequest(
        "/area_benchmarks",
        {
          method: "POST",
          headers: { "Prefer": "resolution=merge-duplicates" },
          body: JSON.stringify(row)
        }
      );
      if (resp.ok) results.updated++;
      else results.errors++;

      if (psf) {
        var histResp = await supabaseRequest(
          "/price_history",
          {
            method: "POST",
            headers: { "Prefer": "resolution=merge-duplicates" },
            body: JSON.stringify({
              area_key: area,
              psf: psf,
              rent_avg: rents.r1 || null,
              sample_size: salePsfs.length,
              snapshot_date: new Date().toISOString().slice(0, 10)
            })
          }
        );
        if (histResp.ok) results.history++;
      }

      if (i < areas.length - 1) await new Promise(function(r){setTimeout(r, 200);});
    } catch(e) {
      results.errors++;
    }
  }

  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    areas_processed: areas.length,
    results: results
  });
};
