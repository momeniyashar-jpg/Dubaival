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
    if (action === "geocode") {
      var addr = req.query.address;
      if (!addr) return res.status(400).json({ error: "Missing address" });
      var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" +
        encodeURIComponent(addr + ", Dubai, UAE") + "&key=" + key;
      var r = await fetch(url, { headers: headers });
      var data = await r.json();
      if (!data.results || !data.results[0]) return res.json({ lat: null, lng: null });
      var loc = data.results[0].geometry.location;
      return res.json({ lat: loc.lat, lng: loc.lng });

    } else if (action === "amenities") {
      var address = req.query.address;
      if (!address) return res.status(400).json({ error: "Missing address" });

      // Geocode the address
      var geoUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" +
        encodeURIComponent(address + ", Dubai, UAE") + "&key=" + key;
      var geoR = await fetch(geoUrl, { headers: headers });
      var geoData = await geoR.json();
      if (!geoData.results || !geoData.results[0]) {
        return res.json({ error: "Address not found" });
      }
      var loc = geoData.results[0].geometry.location;
      var lat = loc.lat;
      var lng = loc.lng;

      // Search types
      var types = [
        { key: "metro", type: "subway_station", keyword: "metro", radius: 2000 },
        { key: "school", type: "school", radius: 2000 },
        { key: "hospital", type: "hospital", radius: 3000 },
        { key: "supermarket", type: "supermarket", radius: 1500 },
        { key: "mosque", type: "mosque", radius: 1000 }
      ];

      var results = await Promise.all(types.map(async function(t) {
        var u = "https://maps.googleapis.com/maps/api/place/nearbysearch/json" +
          "?location=" + lat + "," + lng +
          "&radius=" + t.radius +
          "&type=" + t.type +
          (t.keyword ? "&keyword=" + encodeURIComponent(t.keyword) : "") +
          "&key=" + key;
        try {
          var rp = await fetch(u, { headers: headers });
          var dp = await rp.json();
          var places = (dp.results || []).map(function(p) {
            return {
              name: p.name,
              dist: haversine(lat, lng, p.geometry.location.lat, p.geometry.location.lng),
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
      return res.json({ lat: lat, lng: lng, amenities: amenities });

    } else {
      return res.status(400).json({ error: "Unknown action. Use: geocode, amenities" });
    }
  } catch (e) {
    return res.status(502).json({ error: "Maps API error: " + e.message });
  }
};
