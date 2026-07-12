// Launch-readiness item 5/8: Stripe Checkout + webhook for the consumer
// Pro subscription (see js/core.js openUpgradeModal()/js/core.js
// isProUser()/supabase-subscriptions-schema.sql).
//
// POST /api/billing?action=checkout → creates a Checkout Session, returns
//   {url} for the client to redirect to.
// POST /api/billing?action=webhook  → Stripe calls this on subscription
//   lifecycle events; verifies the signature and flips user_profiles.is_pro.
//
// No `stripe` npm package — plain fetch() to Stripe's REST API for session
// creation, and Node's built-in crypto for webhook signature verification,
// matching this project's existing "native fetch only" convention for
// every other /api file. bodyParser is disabled for this whole file (the
// webhook needs the exact raw bytes for HMAC verification), so the
// checkout action also reads+parses its own body manually below.
const { supabaseRequest } = require("./_lib/shared");
const { rateLimitExceeded } = require("./_lib/ratelimit");
const crypto = require("crypto");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const SITE_URL = "https://www.dubaival.com";

function readRawBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    req.on("data", function (c) { chunks.push(c); });
    req.on("end", function () { resolve(Buffer.concat(chunks)); });
    req.on("error", reject);
  });
}

async function handleCheckout(req, res) {
  if (rateLimitExceeded(req, res, 60000, 10)) return;
  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
    res.status(500).json({ ok: false, error: "Billing isn't configured yet — contact support@dubaival.com" });
    return;
  }
  var raw = await readRawBody(req);
  var body = {};
  try { body = JSON.parse(raw.toString("utf8") || "{}"); } catch (e) {}
  var userId = (body.user_id || "").trim();
  var email = (body.email || "").trim().toLowerCase();
  if (!userId || !email || !email.includes("@")) {
    res.status(400).json({ ok: false, error: "Missing user_id or email" });
    return;
  }

  var params = new URLSearchParams({
    "mode": "subscription",
    "line_items[0][price]": STRIPE_PRICE_ID,
    "line_items[0][quantity]": "1",
    "success_url": SITE_URL + "/?upgraded=1",
    "cancel_url": SITE_URL + "/",
    "customer_email": email,
    "client_reference_id": userId,
  });

  try {
    var r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + STRIPE_SECRET_KEY, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    var data = await r.json();
    if (!r.ok) {
      res.status(500).json({ ok: false, error: (data.error && data.error.message) || "Stripe error creating checkout session" });
      return;
    }
    res.status(200).json({ ok: true, url: data.url });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Could not reach Stripe: " + e.message });
  }
}

// Manual HMAC verification of Stripe's Stripe-Signature header — same
// algorithm as the official SDK's constructEvent(), reimplemented with
// Node's crypto to avoid adding the stripe npm package for one function.
function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader) return false;
  var parts = {};
  sigHeader.split(",").forEach(function (p) {
    var kv = p.split("=");
    if (kv.length === 2) parts[kv[0]] = kv[1];
  });
  if (!parts.t || !parts.v1) return false;
  var ageSeconds = Math.abs(Date.now() / 1000 - Number(parts.t));
  if (isNaN(ageSeconds) || ageSeconds > 300) return false; // 5-minute replay window, same as Stripe's default
  var signedPayload = parts.t + "." + rawBody.toString("utf8");
  var expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  var a = Buffer.from(expected, "utf8");
  var b = Buffer.from(parts.v1, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function handleWebhook(req, res) {
  if (!STRIPE_WEBHOOK_SECRET) {
    res.status(500).json({ ok: false, error: "Webhook secret not configured" });
    return;
  }
  var raw = await readRawBody(req);
  var sig = req.headers["stripe-signature"];
  if (!verifyStripeSignature(raw, sig, STRIPE_WEBHOOK_SECRET)) {
    res.status(400).json({ ok: false, error: "Invalid signature" });
    return;
  }
  var event;
  try { event = JSON.parse(raw.toString("utf8")); } catch (e) {
    res.status(400).json({ ok: false, error: "Malformed payload" });
    return;
  }

  try {
    if (event.type === "checkout.session.completed") {
      var session = event.data.object;
      var userId = session.client_reference_id;
      if (userId) {
        await supabaseRequest("/user_profiles?id=eq." + encodeURIComponent(userId), {
          method: "PATCH",
          body: JSON.stringify({
            is_pro: true,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            pro_since: new Date().toISOString(),
          }),
        });
      }
    } else if (event.type === "customer.subscription.deleted") {
      var subDel = event.data.object;
      await supabaseRequest("/user_profiles?stripe_customer_id=eq." + encodeURIComponent(subDel.customer), {
        method: "PATCH",
        body: JSON.stringify({ is_pro: false }),
      });
    } else if (event.type === "customer.subscription.updated") {
      var subUpd = event.data.object;
      var badStatuses = ["canceled", "unpaid", "incomplete_expired"];
      if (badStatuses.indexOf(subUpd.status) !== -1) {
        await supabaseRequest("/user_profiles?stripe_customer_id=eq." + encodeURIComponent(subUpd.customer), {
          method: "PATCH",
          body: JSON.stringify({ is_pro: false }),
        });
      }
    }
  } catch (e) {
    // Already verified + parsed — an internal error here (e.g. Supabase
    // hiccup) shouldn't make Stripe retry forever, but is worth knowing
    // about if it ever shows up in Vercel's function logs.
    console.error("billing webhook processing error:", e.message);
  }

  res.status(200).json({ received: true });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.dubaival.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Stripe-Signature");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  var action = req.query && req.query.action;
  if (req.method === "POST" && action === "webhook") return handleWebhook(req, res);
  if (req.method === "POST" && action === "checkout") return handleCheckout(req, res);

  res.status(405).json({ ok: false, error: "Method not allowed" });
};

module.exports.config = { api: { bodyParser: false } };
