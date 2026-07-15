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
// Pay-per-video AI processing (real Whisper subtitles, see
// api/proxy-whisper.js) — a ONE-TIME payment per credit, deliberately NOT
// part of the Pro subscription, per the site owner's explicit request
// ("نه اینکه ماهانه خرید کنه، برای هر ویدئو پرداخت کنه"). Priced in cents
// via env var so it can be tuned without a code change; no Stripe
// Product/Price needs to be pre-created in the Dashboard since this uses
// inline price_data.
const VIDEO_CREDIT_PRICE_CENTS = parseInt(process.env.VIDEO_CREDIT_PRICE_CENTS || "299", 10);
const VIDEO_CREDIT_CURRENCY = process.env.VIDEO_CREDIT_CURRENCY || "usd";
// Pay-per-video AI GENERATION credit (Kling/Runway/HeyGen/D-ID/etc, see
// api/proxy-video.js) — a separate ONE-TIME payment product from the
// Whisper subtitle credit above (different price point, different job:
// this pays to CREATE a video, not to add subtitles to one already made).
// Every signed-in user still gets 3 free generations per calendar month
// (FREE_VIDEO_GENERATIONS_PER_MONTH in api/proxy-video.js); credits are
// only consumed once that free quota is used up.
const VIDEO_GEN_CREDIT_PRICE_CENTS = parseInt(process.env.VIDEO_GEN_CREDIT_PRICE_CENTS || "499", 10);
const VIDEO_GEN_CREDIT_CURRENCY = process.env.VIDEO_GEN_CREDIT_CURRENCY || "usd";

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

// Pay-per-video AI processing credit — a ONE-TIME payment (mode:"payment"),
// deliberately separate from the Pro subscription above. Uses inline
// price_data instead of a pre-created Stripe Price ID so this works the
// moment STRIPE_SECRET_KEY is set, with no Stripe Dashboard product setup
// required. metadata.type distinguishes this from a subscription checkout
// in the shared webhook handler below.
async function handleVideoCheckout(req, res) {
  if (rateLimitExceeded(req, res, 60000, 10)) return;
  if (!STRIPE_SECRET_KEY) {
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
    "mode": "payment",
    "line_items[0][price_data][currency]": VIDEO_CREDIT_CURRENCY,
    "line_items[0][price_data][unit_amount]": String(VIDEO_CREDIT_PRICE_CENTS),
    "line_items[0][price_data][product_data][name]": "DubaiVal AI Video Processing — 1 Credit",
    "line_items[0][price_data][product_data][description]": "Real AI speech-to-text subtitles for one video",
    "line_items[0][quantity]": "1",
    "success_url": SITE_URL + "/?video_credit=1",
    "cancel_url": SITE_URL + "/",
    "customer_email": email,
    "client_reference_id": userId,
    "metadata[type]": "video_credit",
    "metadata[user_id]": userId,
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

// Same one-time-payment pattern as handleVideoCheckout above, but for AI
// video GENERATION credits (metadata.type="video_gen_credit" distinguishes
// it in the shared webhook handler below).
async function handleVideoGenCheckout(req, res) {
  if (rateLimitExceeded(req, res, 60000, 10)) return;
  if (!STRIPE_SECRET_KEY) {
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
    "mode": "payment",
    "line_items[0][price_data][currency]": VIDEO_GEN_CREDIT_CURRENCY,
    "line_items[0][price_data][unit_amount]": String(VIDEO_GEN_CREDIT_PRICE_CENTS),
    "line_items[0][price_data][product_data][name]": "DubaiVal AI Video Generation — 1 Credit",
    "line_items[0][price_data][product_data][description]": "Generate one AI video (Kling / Runway / HeyGen / D-ID)",
    "line_items[0][quantity]": "1",
    "success_url": SITE_URL + "/?video_gen_credit=1",
    "cancel_url": SITE_URL + "/",
    "customer_email": email,
    "client_reference_id": userId,
    "metadata[type]": "video_gen_credit",
    "metadata[user_id]": userId,
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

  // Idempotency guard: Stripe can and does redeliver the same event (slow
  // response, network blip, etc). Flipping is_pro to the same value twice
  // is harmless, but crediting video_credits is NOT naturally idempotent —
  // a redelivered event would double-credit the user. Record every event
  // id before processing; a 409 (unique violation) means this exact event
  // was already handled, so skip straight to acking it.
  try {
    var dedupeRes = await supabaseRequest("/stripe_events_processed", {
      method: "POST",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({ event_id: event.id }),
    });
    if (dedupeRes.status === 409) {
      res.status(200).json({ received: true, deduped: true });
      return;
    }
  } catch (e) {
    // If the dedupe table itself is unreachable, fail open (process the
    // event anyway) rather than silently dropping a real payment/webhook.
  }

  try {
    if (event.type === "checkout.session.completed") {
      var session = event.data.object;
      var userId = session.client_reference_id;
      if (userId && session.mode === "payment" && session.metadata && session.metadata.type === "video_credit") {
        // Pay-per-video credit purchase — grant exactly 1 credit, separate
        // from the Pro subscription path below.
        await supabaseRequest("/rpc/add_video_credits", {
          method: "POST",
          body: JSON.stringify({ p_user_id: userId, p_amount: 1 }),
        });
      } else if (userId && session.mode === "payment" && session.metadata && session.metadata.type === "video_gen_credit") {
        // Pay-per-video-GENERATION credit purchase — separate pool from the
        // Whisper subtitle credit above (different product, different price).
        await supabaseRequest("/rpc/add_video_gen_credits", {
          method: "POST",
          body: JSON.stringify({ p_user_id: userId, p_amount: 1 }),
        });
      } else if (userId) {
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
  if (req.method === "POST" && action === "video-checkout") return handleVideoCheckout(req, res);
  if (req.method === "POST" && action === "video-gen-checkout") return handleVideoGenCheckout(req, res);

  res.status(405).json({ ok: false, error: "Method not allowed" });
};

module.exports.config = { api: { bodyParser: false } };
