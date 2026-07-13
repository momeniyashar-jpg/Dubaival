// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved. See LICENSE.
// --- LIGHTWEIGHT VORONOI (half-plane intersection) ----------------------------
// Used by js/map.js to replace real-world-radius circles (which overlap by an
// unfixable, zoom-invariant proportion — see js/map.js's comment history) with
// real, non-overlapping region polygons. No external geometry library —
// dependency-free, ~347 points, fast enough to recompute on every zoom tick.
//
// Method: for each site, start with a large bounding rectangle and clip it
// against the perpendicular-bisector half-plane of every other site (keep only
// the half closer to this site). This is the classic "Voronoi cell as
// intersection of half-planes" construction — O(n) clips per site, O(n^2)
// total, each clip O(vertices). For n≈350 this runs in well under 100ms.
//
// Coordinates are plain {x,y} pairs in a LOCAL EQUIRECTANGULAR projection
// (see _dvLatLngToXY/_dvXYToLatLng below), not raw lat/lng — raw lat/lng
// isn't isotropic (a degree of longitude is shorter than a degree of latitude
// away from the equator), so bisectors computed directly in lat/lng would be
// subtly wrong. The projection error at Dubai's ~25°N over a ~60km span is
// negligible for this purpose.

var DV_EARTH_R = 6371000; // meters

function _dvLatLngToXY(lat, lng, originLat, originLng) {
  var latRad = originLat * Math.PI / 180;
  return {
    x: (lng - originLng) * Math.PI / 180 * DV_EARTH_R * Math.cos(latRad),
    y: (lat - originLat) * Math.PI / 180 * DV_EARTH_R
  };
}
function _dvXYToLatLng(x, y, originLat, originLng) {
  var latRad = originLat * Math.PI / 180;
  return {
    lat: originLat + y / DV_EARTH_R * 180 / Math.PI,
    lng: originLng + x / (DV_EARTH_R * Math.cos(latRad)) * 180 / Math.PI
  };
}

// Sutherland-Hodgman: clip convex polygon `poly` ([{x,y},...]) to the
// half-plane nx*x + ny*y <= c. Returns a new polygon (possibly empty).
function _dvClipHalfPlane(poly, nx, ny, c) {
  if (!poly.length) return poly;
  var out = [];
  for (var i = 0; i < poly.length; i++) {
    var cur = poly[i], prev = poly[(i - 1 + poly.length) % poly.length];
    var curIn = (nx * cur.x + ny * cur.y) <= c;
    var prevIn = (nx * prev.x + ny * prev.y) <= c;
    if (curIn !== prevIn) {
      // Edge crosses the boundary — find intersection point
      var dx = cur.x - prev.x, dy = cur.y - prev.y;
      var denom = nx * dx + ny * dy;
      var t = denom !== 0 ? (c - (nx * prev.x + ny * prev.y)) / denom : 0;
      out.push({ x: prev.x + t * dx, y: prev.y + t * dy });
    }
    if (curIn) out.push(cur);
  }
  return out;
}

// sites: [{x,y,...anything}]. bbox: {minX,minY,maxX,maxY}.
// Returns [{site, cell:[{x,y},...]}] — one entry per site, in the same order.
function dvComputeVoronoi(sites, bbox) {
  var boxPoly = [
    { x: bbox.minX, y: bbox.minY }, { x: bbox.maxX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.maxY }, { x: bbox.minX, y: bbox.maxY }
  ];
  return sites.map(function (site) {
    var poly = boxPoly;
    for (var i = 0; i < sites.length; i++) {
      var other = sites[i];
      if (other === site) continue;
      if (other.x === site.x && other.y === site.y) continue; // coincident points — no bisector
      var mx = (site.x + other.x) / 2, my = (site.y + other.y) / 2;
      var nx = other.x - site.x, ny = other.y - site.y;
      var c = nx * mx + ny * my;
      poly = _dvClipHalfPlane(poly, nx, ny, c);
      if (!poly.length) break;
    }
    return { site: site, cell: poly };
  });
}

// Polygon area via shoelace formula (used to sanity-check/sort cells).
function _dvPolyArea(poly) {
  if (poly.length < 3) return 0;
  var a = 0;
  for (var i = 0; i < poly.length; i++) {
    var p1 = poly[i], p2 = poly[(i + 1) % poly.length];
    a += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(a) / 2;
}
