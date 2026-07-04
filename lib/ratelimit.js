// In-memory per-IP rate limiter for Vercel serverless functions.
// Not a substitute for a Redis-backed distributed limiter, but raises the bar
// significantly within a single warm lambda instance and stops most abuse.

var _store = {};
var _storeSize = 0;
var _lastCleanup = 0;
var MAX_STORE = 5000; // max IPs tracked before forced cleanup

function getIp(req) {
  var xff = req.headers["x-forwarded-for"] || "";
  return xff.split(",")[0].trim() || (req.socket && req.socket.remoteAddress) || "unknown";
}

function cleanup(windowMs) {
  var now = Date.now();
  var cutoff = now - windowMs;
  Object.keys(_store).forEach(function (k) {
    if (_store[k] && _store[k].reset < cutoff) {
      delete _store[k];
      _storeSize--;
    }
  });
  _lastCleanup = now;
}

// Returns true if the request should be BLOCKED (limit exceeded).
// windowMs: rolling window in ms, max: max requests per window.
function isRateLimited(req, windowMs, max) {
  var now = Date.now();
  // Cleanup stale entries every 60s or when store is too large
  if (now - _lastCleanup > 60000 || _storeSize > MAX_STORE) {
    cleanup(windowMs);
  }
  var ip = getIp(req);
  var key = ip + ":" + Math.floor(now / windowMs);
  if (!_store[key]) {
    _store[key] = { count: 0, reset: now + windowMs };
    _storeSize++;
  }
  _store[key].count++;
  return _store[key].count > max;
}

// Returns a middleware-style check function for the given limits.
// Usage: if (rateLimitExceeded(req, res, 60000, 20)) return;
function rateLimitExceeded(req, res, windowMs, max) {
  if (isRateLimited(req, windowMs, max)) {
    res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
    res.status(429).json({ error: "Rate limit exceeded. Please slow down." });
    return true;
  }
  return false;
}

module.exports = { rateLimitExceeded: rateLimitExceeded, getIp: getIp };
