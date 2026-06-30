module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  var key = process.env.GOOGLE_MAPS_KEY;
  if (!key) return res.status(500).json({ error: "GOOGLE_MAPS_KEY not configured" });

  var action = req.query.action;
  var headers = { "Referer": "https://www.dubaival.com/" };

  function haversine(lat1, lng1, lat2, lng2) {
    var R = 6371000;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
            Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
            Math.sin(dLng/2)*Math.sin(dLng/2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }

  try {

    // ── GEOCODE ─────────────────────────────────────────────────────────────
    if (action === "geocode") {
      var addr = req.query.address;
      if (!addr) return res.status(400).json({ error: "Missing address" });
      var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" +
        encodeURIComponent(addr + ", Dubai, UAE") + "&key=" + key;
      var r = await fetch(url, { headers: headers });
      var data = await r.json();
      if (!data.results || !data.results[0]) return res.json({ lat: null, lng: null });
      var loc = data.results[0].geometry.location;
      return res.json({ lat: loc.lat, lng: loc.lng, formatted: data.results[0].formatted_address });

    // ── STATIC MAP (satellite view, dark pin) ────────────────────────────────
    } else if (action === "staticmap") {
      var lat = req.query.lat;
      var lng = req.query.lng;
      if (!lat || !lng) return res.status(400).json({ error: "Missing lat/lng" });
      var zoom = parseInt(req.query.zoom) || 16;
      var size = req.query.size || "600x320";
      var mapUrl =
        "https://maps.googleapis.com/maps/api/staticmap" +
        "?center=" + lat + "," + lng +
        "&zoom=" + zoom +
        "&size=" + size +
        "&scale=2" +
        "&maptype=satellite" +
        "&markers=color:0xC9A84C%7Csize:mid%7C" + lat + "," + lng +
        "&key=" + key;
      var imgR = await fetch(mapUrl, { headers: headers });
      var buf = await imgR.arrayBuffer();
      res.setHeader("Content-Type", imgR.headers.get("content-type") || "image/png");
      res.setHeader("Cache-Control", "public, max-age=604800");
      return res.status(imgR.status).send(Buffer.from(buf));

    // ── STREET VIEW STATIC ───────────────────────────────────────────────────
    } else if (action === "streetview") {
      var lat2 = req.query.lat;
      var lng2 = req.query.lng;
      if (!lat2 || !lng2) return res.status(400).json({ error: "Missing lat/lng" });
      var heading = parseInt(req.query.heading) || 0;
      var svUrl =
        "https://maps.googleapis.com/maps/api/streetview" +
        "?size=600x300" +
        "&location=" + lat2 + "," + lng2 +
        "&fov=90&heading=" + heading + "&pitch=10&radius=200" +
        "&key=" + key;
      var svR = await fetch(svUrl, { headers: headers });
      var svBuf = await svR.arrayBuffer();
      res.setHeader("Content-Type", svR.headers.get("content-type") || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=604800");
      return res.status(svR.status).send(Buffer.from(svBuf));

    // ── DISTANCE MATRIX (drive times to key Dubai hubs) ─────────────────────
    } else if (action === "distances") {
      var lat3 = req.query.lat;
      var lng3 = req.query.lng;
      if (!lat3 || !lng3) return res.status(400).json({ error: "Missing lat/lng" });
      var hubs = [
        { label: "Downtown Dubai", coords: "25.1972,55.2744" },
        { label: "DIFC",           coords: "25.2115,55.2800" },
        { label: "DXB Airport",    coords: "25.2532,55.3657" },
        { label: "Mall of Emirates", coords: "25.1182,55.2003" },
        { label: "JBR Beach",      coords: "25.0772,55.1320" }
      ];
      var destStr = hubs.map(function(h) { return h.coords; }).join("|");
      var dmUrl =
        "https://maps.googleapis.com/maps/api/distancematrix/json" +
        "?origins=" + lat3 + "," + lng3 +
        "&destinations=" + encodeURIComponent(destStr) +
        "&mode=driving&key=" + key;
      var dmR = await fetch(dmUrl, { headers: headers });
      var dmData = await dmR.json();
      var rows = [];
      if (dmData.rows && dmData.rows[0] && dmData.rows[0].elements) {
        dmData.rows[0].elements.forEach(function(el, i) {
          rows.push({
            label: hubs[i].label,
            duration: el.status === "OK" ? el.duration.text : "—",
            distance: el.status === "OK" ? el.distance.text : "—"
          });
        });
      }
      return res.json({ rows: rows });

    // ── NEARBY AMENITIES (geocode + 5 place types) ───────────────────────────
    } else if (action === "amenities") {
      var address = req.query.address;
      if (!address) return res.status(400).json({ error: "Missing address" });

      var geoUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" +
        encodeURIComponent(address + ", Dubai, UAE") + "&key=" + key;
      var geoR = await fetch(geoUrl, { headers: headers });
      var geoData = await geoR.json();
      if (!geoData.results || !geoData.results[0]) return res.json({ error: "Address not found" });
      var loc2 = geoData.results[0].geometry.location;
      var alat = loc2.lat;
      var alng = loc2.lng;

      var types = [
        { key: "metro",       type: "subway_station", keyword: "metro", radius: 2500 },
        { key: "school",      type: "school",                           radius: 2000 },
        { key: "hospital",    type: "hospital",                         radius: 3000 },
        { key: "supermarket", type: "supermarket",                      radius: 1500 },
        { key: "mosque",      type: "mosque",                           radius: 1500 }
      ];

      var results = await Promise.all(types.map(async function(t) {
        var u = "https://maps.googleapis.com/maps/api/place/nearbysearch/json" +
          "?location=" + alat + "," + alng +
          "&radius=" + t.radius + "&type=" + t.type +
          (t.keyword ? "&keyword=" + encodeURIComponent(t.keyword) : "") +
          "&key=" + key;
        try {
          var rp = await fetch(u, { headers: headers });
          var dp = await rp.json();
          var places = (dp.results || []).map(function(p) {
            return {
              name: p.name,
              dist: haversine(alat, alng, p.geometry.location.lat, p.geometry.location.lng),
              rating: p.rating || null
            };
          }).sort(function(a, b) { return a.dist - b.dist; });
          return { key: t.key, nearest: places[0] || null };
        } catch (e) {
          return { key: t.key, nearest: null };
        }
      }));

      var amenities = {};
      results.forEach(function(r) { amenities[r.key] = r.nearest; });
      return res.json({ lat: alat, lng: alng, amenities: amenities });

    // ── PLACES AUTOCOMPLETE (building/establishment suggestions) ────────────
    } else if (action === "places") {
      var q = req.query.q;
      if (!q) return res.status(400).json({ error: "Missing q" });
      var placesUrl = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
        + "?input=" + encodeURIComponent(q)
        + "&components=country:ae"
        + "&location=25.2,55.27&radius=50000"
        + "&types=establishment"
        + "&key=" + key;
      var plR = await fetch(placesUrl, { headers: headers });
      var plData = await plR.json();
      var predictions = (plData.predictions || []).map(function(p) {
        return {
          place_id: p.place_id,
          name: p.structured_formatting ? p.structured_formatting.main_text : p.description.split(",")[0],
          address: p.description
        };
      });
      return res.json({ predictions: predictions });

    // ── CONFIG (return key for Maps JS API client-side loading) ─────────────
    } else if (action === "config") {
      return res.json({ key: key });

    } else {
      return res.status(400).json({ error: "Unknown action. Use: geocode, staticmap, streetview, distances, amenities, config" });
    }

  } catch (e) {
    return res.status(502).json({ error: "Maps API error: " + e.message });
  }
};
