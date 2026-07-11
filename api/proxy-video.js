var { rateLimitExceeded } = require("./_lib/ratelimit");
var { supabaseRequest, SUPABASE_URL } = require("./_lib/shared");

var ALLOWED_ORIGINS = ["https://www.dubaival.com", "https://dubaival.com", "http://localhost:3000", "http://localhost:5000"];
// Public anon/publishable key — same constant already shipped client-side in
// js/core.js, safe to embed server-side too. Used only to validate a user's
// own access_token against Supabase Auth, never to authorize writes.
var SUPABASE_ANON_KEY = "sb_publishable_HNHSNnmBUYcTnF35bMEzxA_qhsoe6Yj";
// Paid AI-engine video generation is capped per signed-in user per calendar
// month — without this, every generation any end-user triggers is billed
// directly to the developer's own API keys with no limit at all.
var FREE_VIDEO_GENERATIONS_PER_MONTH = 3;

async function _resolveUserId(accessToken) {
  if (!accessToken) return null;
  try {
    var r = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + accessToken },
    });
    if (!r.ok) return null;
    var d = await r.json();
    return d && d.id ? d.id : null;
  } catch (e) {
    return null;
  }
}

async function _checkAndLogVideoQuota(userId, engine) {
  var monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  var countRes = await supabaseRequest(
    "/video_gen_log?user_id=eq." + userId + "&created_at=gte." + monthStart.toISOString() + "&select=id"
  );
  if (countRes.ok) {
    var rows = await countRes.json();
    if (rows.length >= FREE_VIDEO_GENERATIONS_PER_MONTH) {
      return { allowed: false, used: rows.length };
    }
  }
  // Log the attempt now (not just on success) — keeps this simple and is a
  // negligible fairness tradeoff, since providers themselves generally don't
  // charge for failed generations (e.g. Kling: "failed tasks don't consume credits").
  await supabaseRequest("/video_gen_log", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, engine: engine }),
  }).catch(function () {});
  return { allowed: true };
}

module.exports = async function handler(req, res) {
  var reqOrigin = req.headers.origin || "";
  var corsOrigin = ALLOWED_ORIGINS.indexOf(reqOrigin) !== -1 ? reqOrigin : ALLOWED_ORIGINS[0];
  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  var body = req.body || {};
  var engine = body.engine;
  var action = body.action;

  if (!engine || !action) return res.status(400).json({ error: "Missing engine or action" });

  // Status polls happen every few seconds while a job runs; generate/list actions
  // trigger paid third-party API calls and are throttled much harder per IP.
  var isPoll = action === "status" || action === "list_avatars";
  if (rateLimitExceeded(req, res, 60000, isPoll ? 60 : 8)) return;

  // Paid video generation is capped per signed-in user per month (not image
  // generation — that's a separate, much cheaper action).
  if (action === "generate" && engine !== "fal-image") {
    var userId = await _resolveUserId(body.access_token);
    if (!userId) return res.status(401).json({ error: "Please sign in to generate AI videos." });
    var quota = await _checkAndLogVideoQuota(userId, engine);
    if (!quota.allowed) {
      return res.status(403).json({
        error: "You've used all " + FREE_VIDEO_GENERATIONS_PER_MONTH + " free AI videos this month. Your quota resets on the 1st.",
      });
    }
  }

  // Unified task-ID: accept whichever field the client sends
  var tid = body.task_id || body.request_id || body.gen_id || body.job_id || body.talk_id || body.video_id;

  try {

    // ── KLING AI 2.0 (Bearer token — api-singapore.klingai.com) ─────────────
    if (engine === "kling") {
      var kk = process.env.KLING_API_KEY;
      if (!kk) return res.status(400).json({ error: "KLING_API_KEY not configured in Vercel env vars" });

      if (action === "generate") {
        var kBody = { model_name: "kling-v1-6", prompt: body.prompt, negative_prompt: "", cfg_scale: 0.5, mode: "std", duration: "5" };
        if (body.image_url) kBody.image = body.image_url;
        var kr = await fetch("https://api-singapore.klingai.com/v1/videos/text2video", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + kk },
          body: JSON.stringify(kBody)
        });
        var kRaw = await kr.text();
        var kd; try { kd = JSON.parse(kRaw); } catch(e) { return res.status(502).json({ error: "Kling non-JSON response (HTTP " + kr.status + "): " + kRaw.slice(0, 200) }); }
        if (kd.code !== 0) return res.status(400).json({ error: "Kling: " + (kd.message || JSON.stringify(kd)) });
        if (!kd.data || !kd.data.task_id) return res.status(502).json({ error: "Kling: no task_id in response: " + JSON.stringify(kd) });
        return res.json({ task_id: kd.data.task_id });
      }
      if (action === "status") {
        var kr2 = await fetch("https://api-singapore.klingai.com/v1/videos/text2video/" + tid, {
          headers: { "Authorization": "Bearer " + kk }
        });
        var kd2 = await kr2.json();
        // {"data":{"task_status":"succeed","task_result":{"videos":[{"url":"..."}]}}}
        var ks = kd2.data || {};
        var kDone = ks.task_status === "succeed";
        var kErr  = ks.task_status === "failed" ? (ks.task_status_msg || "Generation failed") : null;
        var kUrl  = kDone && ks.task_result && ks.task_result.videos && ks.task_result.videos[0]
                    ? ks.task_result.videos[0].url : null;
        return res.json({ done: kDone, url: kUrl, error: kErr, status: ks.task_status });
      }
    }

    // ── LUMA DREAM MACHINE ───────────────────────────────────────────────────
    if (engine === "luma") {
      var lk = process.env.LUMA_API_KEY;
      if (!lk) return res.status(500).json({ error: "LUMA_API_KEY not configured" });

      if (action === "generate") {
        var lBody = { prompt: body.prompt, aspect_ratio: "16:9" };
        if (body.image_url) lBody.keyframes = { frame0: { type: "image", url: body.image_url } };
        var lr = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + lk },
          body: JSON.stringify(lBody)
        });
        var lRaw = await lr.text();
        var ld; try { ld = JSON.parse(lRaw); } catch(e) { return res.status(502).json({ error: "Luma non-JSON (HTTP " + lr.status + "): " + lRaw.slice(0, 200) }); }
        if (!ld.id) return res.status(lr.status).json({ error: "Luma: " + (ld.detail || ld.message || lRaw.slice(0, 200)) });
        return res.json({ task_id: ld.id });
      }
      if (action === "status") {
        var lr2 = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations/" + tid, {
          headers: { "Authorization": "Bearer " + lk }
        });
        var ld2 = await lr2.json();
        // {"state":"completed","video":{"url":"..."}} or {"state":"failed","failure_reason":"..."}
        var lDone = ld2.state === "completed";
        var lErr  = ld2.state === "failed" ? (ld2.failure_reason || "Generation failed") : null;
        var lUrl  = lDone && ld2.video ? ld2.video.url : null;
        return res.json({ done: lDone, url: lUrl, error: lErr, status: ld2.state });
      }
    }

    // ── HEYGEN (direct API or via Fal.ai) ───────────────────────────────────
    if (engine === "heygen") {
      var hk = process.env.HEYGEN_API_KEY || process.env.PIKA_API_KEY;
      if (!hk) return res.status(500).json({ error: "HEYGEN/FAL API key not configured" });
      var isFal = !process.env.HEYGEN_API_KEY && !!process.env.PIKA_API_KEY;

      if (isFal) {
        if (action === "generate") {
          var hgBody = { image_url: body.image_url || body.source_url, text: body.text, voice_id: body.voice_id || null };
          var hgr = await fetch("https://queue.fal.run/fal-ai/heygen/avatar4/image-to-video", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Key " + hk },
            body: JSON.stringify(hgBody)
          });
          var hgd = await hgr.json();
          if (!hgd.request_id) return res.status(422).json({ error: hgd.detail || hgd.message || "HeyGen/Fal.ai requires a valid face image_url" });
          return res.json({ task_id: hgd.request_id });
        }
        if (action === "status") {
          var hgr2 = await fetch("https://queue.fal.run/fal-ai/heygen/avatar4/image-to-video/requests/" + tid, {
            headers: { "Authorization": "Key " + hk }
          });
          var hgd2 = await hgr2.json();
          var hgDone = hgd2.status === "COMPLETED";
          var hgErr  = hgd2.status === "FAILED" ? (hgd2.error || "Generation failed") : null;
          var hgUrl  = hgDone && hgd2.output ? (hgd2.output.video_url || hgd2.output.url) : null;
          return res.json({ done: hgDone, url: hgUrl, error: hgErr, status: hgd2.status });
        }
      } else {
        if (action === "generate") {
          var hr = await fetch("https://api.heygen.com/v2/video/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Api-Key": hk },
            body: JSON.stringify({
              video_inputs: [{
                character: { type: "avatar", avatar_id: body.avatar_id, avatar_style: "normal" },
                voice: { type: "text", input_text: body.text, voice_id: body.voice_id || "1bd001e7e50f421d891986aad5158bc8" }
              }],
              dimension: { width: 1280, height: 720 }
            })
          });
          var hdRaw = await hr.text();
          var hd; try { hd = JSON.parse(hdRaw); } catch(e) { return res.status(502).json({ error: "HeyGen non-JSON response (HTTP " + hr.status + "): " + hdRaw.slice(0, 200) }); }
          if (hd.error) return res.status(400).json({ error: "HeyGen: " + (hd.error.message || JSON.stringify(hd.error)) });
          if (!hd.data || !hd.data.video_id) return res.status(502).json({ error: "HeyGen: no video_id in response: " + JSON.stringify(hd).slice(0, 200) });
          return res.json({ task_id: hd.data.video_id });
        }
        if (action === "status") {
          var hr2 = await fetch("https://api.heygen.com/v1/video_status.get?video_id=" + tid, {
            headers: { "X-Api-Key": hk }
          });
          var hd2 = await hr2.json();
          var hvData = hd2.data || {};
          var hvDone = hvData.status === "completed";
          var hvErr  = hvData.status === "failed" ? (hvData.error || "Generation failed") : null;
          return res.json({ done: hvDone, url: hvData.video_url || null, error: hvErr, status: hvData.status });
        }
        if (action === "list_avatars") {
          var hr3 = await fetch("https://api.heygen.com/v2/avatars", { headers: { "X-Api-Key": hk } });
          return res.status(hr3.status).json(await hr3.json());
        }
      }
    }

    // ── HEDRA ────────────────────────────────────────────────────────────────
    if (engine === "hedra") {
      var drk = process.env.HEDRA_API_KEY;
      if (!drk) return res.status(500).json({ error: "HEDRA_API_KEY not configured" });

      if (action === "generate") {
        var drBody = { text: body.text, voice_id: body.voice_id || "Sara", aspect_ratio: "16:9" };
        if (body.image_url) drBody.image_url = body.image_url;
        var dr = await fetch("https://mercury.dev.dream-ai.com/api/v2/characters", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-KEY": drk },
          body: JSON.stringify(drBody)
        });
        var dd = await dr.json();
        return res.json({ task_id: dd.jobId || dd.id || dd.job_id });
      }
      if (action === "status") {
        var dr2 = await fetch("https://mercury.dev.dream-ai.com/api/v2/characters/" + tid, {
          headers: { "X-API-KEY": drk }
        });
        var dd2 = await dr2.json();
        var dDone = dd2.status === "complete" || dd2.status === "completed";
        var dErr  = (dd2.status === "failed" || dd2.status === "error") ? (dd2.errorMessage || "Generation failed") : null;
        return res.json({ done: dDone, url: dd2.videoUrl || dd2.video_url || null, error: dErr, status: dd2.status });
      }
    }

    // ── RUNWAY GEN-4 ─────────────────────────────────────────────────────────
    if (engine === "runway") {
      var rk = process.env.RUNWAY_API_KEY;
      if (!rk) return res.status(500).json({ error: "RUNWAY_API_KEY not configured" });

      if (action === "generate") {
        // gen4_turbo requires a reference image; use gen3a_turbo for text-only
        if (!body.image_url) return res.status(400).json({ error: "Runway needs a Reference Image URL. Go back (← Choose Engine) and enter a property photo URL above the prompt." });
        var rwBody = { model: "gen4_turbo", promptText: body.prompt, promptImage: body.image_url, duration: 5, ratio: "1280:768" };
        var rwr = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + rk, "X-Runway-Version": "2024-11-06" },
          body: JSON.stringify(rwBody)
        });
        var rwRaw = await rwr.text();
        var rd; try { rd = JSON.parse(rwRaw); } catch(e) { return res.status(502).json({ error: "Runway non-JSON (HTTP " + rwr.status + "): " + rwRaw.slice(0, 200) }); }
        if (!rd.id) return res.status(rwr.status).json({ error: "Runway: " + (rd.error || rd.message || rwRaw.slice(0, 200)) });
        return res.json({ task_id: rd.id });
      }
      if (action === "status") {
        var rwr2 = await fetch("https://api.dev.runwayml.com/v1/tasks/" + tid, {
          headers: { "Authorization": "Bearer " + rk, "X-Runway-Version": "2024-11-06" }
        });
        var rd2 = await rwr2.json();
        // {"status":"SUCCEEDED","output":["url"]} or {"status":"FAILED","failure":"reason"}
        var rDone = rd2.status === "SUCCEEDED";
        var rErr  = rd2.status === "FAILED" ? (rd2.failure || "Generation failed") : null;
        var rUrl  = rDone && rd2.output && rd2.output[0] ? rd2.output[0] : null;
        return res.json({ done: rDone, url: rUrl, error: rErr, status: rd2.status });
      }
    }

    // ── MINIMAX (HAILUO) — direct API or via Fal.ai gateway ─────────────────
    if (engine === "minimax") {
      var mk = process.env.MINIMAX_API_KEY;
      var falKey = process.env.PIKA_API_KEY; // Fal.ai key — also powers Minimax on Fal
      if (!mk && !falKey) return res.status(500).json({ error: "MINIMAX_API_KEY not configured in Vercel env vars" });

      // Prefer direct Minimax API; fall back to Fal.ai gateway (uses PIKA_API_KEY)
      var mmUseDirect = !!mk;
      var mmFalModel = "fal-ai/minimax/video-01";

      if (!mmUseDirect) {
        // ── Fal.ai gateway ─────────────────────────────────────────────────
        if (action === "generate") {
          var mmFBody = { prompt: body.prompt, aspect_ratio: "16:9" };
          if (body.image_url) mmFBody.image_url = body.image_url;
          var mmFr = await fetch("https://queue.fal.run/" + mmFalModel, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Key " + falKey },
            body: JSON.stringify(mmFBody)
          });
          var mmFRaw = await mmFr.text();
          var mmFd; try { mmFd = JSON.parse(mmFRaw); } catch(e) { return res.status(502).json({ error: "Minimax/Fal non-JSON (HTTP " + mmFr.status + "): " + mmFRaw.slice(0, 200) }); }
          if (!mmFd.request_id) return res.status(mmFr.status).json({ error: mmFd.detail || mmFd.message || "Minimax via Fal.ai failed: " + mmFRaw.slice(0, 200) });
          return res.json({ task_id: mmFd.request_id, request_id: mmFd.request_id });
        }
        if (action === "status") {
          var mmFr2 = await fetch("https://queue.fal.run/" + mmFalModel + "/requests/" + tid, {
            headers: { "Authorization": "Key " + falKey }
          });
          var mmFd2 = await mmFr2.json();
          var mmFDone = mmFd2.status === "COMPLETED";
          var mmFErr = mmFd2.status === "FAILED" ? (mmFd2.error || "Generation failed") : null;
          var mmFUrl = mmFDone && mmFd2.output ? (mmFd2.output.video && mmFd2.output.video.url || mmFd2.output.video_url || mmFd2.output.url) : null;
          return res.json({ done: mmFDone, url: mmFUrl, error: mmFErr, status: mmFd2.status });
        }
      }

      // ── Direct Minimax API ──────────────────────────────────────────────
      if (action === "generate") {
        var mmBody = { model: "T2V-01-HD", prompt: body.prompt };
        if (body.image_url) { mmBody.model = "I2V-01-HD"; mmBody.first_frame_image = body.image_url; }
        var mmr = await fetch("https://api.minimaxi.chat/v1/video_generation", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + mk },
          body: JSON.stringify(mmBody)
        });
        var mmRaw = await mmr.text();
        var mmd; try { mmd = JSON.parse(mmRaw); } catch(e) { return res.status(502).json({ error: "Minimax non-JSON (HTTP " + mmr.status + "): " + mmRaw.slice(0, 300) }); }
        if (!mmd.task_id) {
          var mmErrMsg = (mmd.base_resp && mmd.base_resp.status_msg) ? mmd.base_resp.status_msg : JSON.stringify(mmd).slice(0, 300);
          return res.status(400).json({ error: "Minimax API error (HTTP " + mmr.status + "): " + mmErrMsg });
        }
        return res.json({ task_id: mmd.task_id });
      }
      if (action === "status") {
        var mmr2 = await fetch("https://api.minimaxi.chat/v1/query/video_generation?task_id=" + tid, {
          headers: { "Authorization": "Bearer " + mk }
        });
        var mmd2 = await mmr2.json();
        var mmDone = mmd2.status === "Success";
        var mmErr  = mmd2.status === "Fail" ? ((mmd2.base_resp && mmd2.base_resp.status_msg) || "Generation failed") : null;
        var mmUrl  = null;
        if (mmDone && mmd2.file_id) {
          try {
            var mmFile = await fetch("https://api.minimaxi.chat/v1/files/retrieve?file_id=" + mmd2.file_id, {
              headers: { "Authorization": "Bearer " + mk }
            });
            var mmFd = await mmFile.json();
            mmUrl = (mmFd.file && mmFd.file.download_url) || null;
          } catch(e2) { /* file URL fetch failed — url stays null */ }
        }
        return res.json({ done: mmDone, url: mmUrl, error: mmErr, status: mmd2.status });
      }
    }

    // ── PIKA LABS (via Fal.ai) ───────────────────────────────────────────────
    if (engine === "pika") {
      var pk = process.env.PIKA_API_KEY;
      if (!pk) return res.status(500).json({ error: "PIKA_API_KEY not configured" });

      if (action === "generate") {
        var pikaModel = body.image_url ? "fal-ai/pika/v2.2/image-to-video" : "fal-ai/pika/v2.2/text-to-video";
        var pkBody = { prompt: body.prompt, aspect_ratio: "16:9", duration: 5 };
        if (body.image_url) pkBody.image_url = body.image_url;
        var pkr = await fetch("https://queue.fal.run/" + pikaModel, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Key " + pk },
          body: JSON.stringify(pkBody)
        });
        var pkd = await pkr.json();
        // Fal: {"request_id":"xxx","status":"IN_QUEUE"}
        if (!pkd.request_id) return res.status(pkr.status).json({ error: pkd.detail || pkd.message || "Pika generation failed" });
        // Return both task_id and request_id for client compatibility
        return res.json({ task_id: pkd.request_id, request_id: pkd.request_id, model_path: pikaModel });
      }
      if (action === "status") {
        var pikaModel2 = body.model_path || "fal-ai/pika/v2.2/text-to-video";
        var pkr2 = await fetch("https://queue.fal.run/" + pikaModel2 + "/requests/" + tid, {
          headers: { "Authorization": "Key " + pk }
        });
        var pkd2 = await pkr2.json();
        // {"status":"COMPLETED","output":{"video":{"url":"..."}}} or {"status":"FAILED","error":"..."}
        var pkDone = pkd2.status === "COMPLETED";
        var pkErr  = pkd2.status === "FAILED" ? (pkd2.error || "Generation failed") : null;
        var pkUrl  = pkDone && pkd2.output
                     ? (pkd2.output.video && pkd2.output.video.url || pkd2.output.video_url || pkd2.output.url)
                     : null;
        return res.json({ done: pkDone, url: pkUrl, error: pkErr, status: pkd2.status });
      }
    }

    // ── D-ID ─────────────────────────────────────────────────────────────────
    if (engine === "did") {
      var dk = process.env.DID_API_KEY;
      if (!dk) return res.status(500).json({ error: "DID_API_KEY not configured" });

      if (action === "generate") {
        var dr3 = await fetch("https://api.d-id.com/talks", {
          method: "POST",
          headers: { "Authorization": "Basic " + dk, "Content-Type": "application/json" },
          body: JSON.stringify({
            source_url: body.source_url,
            script: { type: "text", input: body.text, provider: { type: "elevenlabs", voice_id: body.voice_id || "21m00Tcm4TlvDq8ikWAM" } },
            config: { fluent: true, stitch: true }
          })
        });
        var did3d = await dr3.json();
        // D-ID: {"id":"talk_id",...}
        if (!did3d.id) return res.status(dr3.status).json({ error: did3d.message || "D-ID generation failed" });
        return res.json({ task_id: did3d.id });
      }
      if (action === "status") {
        var dr4 = await fetch("https://api.d-id.com/talks/" + tid, {
          headers: { "Authorization": "Basic " + dk }
        });
        var did4d = await dr4.json();
        // {"status":"done","result_url":"..."} or {"status":"error","description":"..."}
        var didDone = did4d.status === "done";
        var didErr  = did4d.status === "error" ? (did4d.description || "Generation failed") : null;
        return res.json({ done: didDone, url: did4d.result_url || null, error: didErr, status: did4d.status });
      }
    }

    // ── FAL.AI IMAGE GENERATION (FLUX — photo-realistic, no expiry) ────────────
    if (engine === "fal-image") {
      var fk = process.env.PIKA_API_KEY;
      if (!fk) return res.status(500).json({ error: "PIKA_API_KEY not configured" });

      if (action === "generate") {
        // Portrait/avatar → flux-realism (photorealistic people)
        // Landscape/banner → flux/schnell (fast, free)
        var fiModel = body.portrait ? "fal-ai/flux-realism" : "fal-ai/flux/schnell";
        var fiSize  = body.portrait ? "square_hd" : "landscape_16_9";
        var fir = await fetch("https://fal.run/" + fiModel, {
          method: "POST",
          headers: { "Authorization": "Key " + fk, "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: body.prompt || "", image_size: fiSize, num_images: 1, sync_mode: true })
        });
        if (!fir.ok) return res.status(502).json({ error: "Fal.ai image error: " + fir.status });
        var fid = await fir.json();
        var fiUrl = fid.images && fid.images[0] && fid.images[0].url;
        if (!fiUrl) return res.status(502).json({ error: "No image returned from Fal.ai" });
        return res.json({ image_url: fiUrl });
      }
    }

    return res.status(400).json({ error: "Unknown engine: " + engine });
  } catch (e) {
    return res.status(502).json({ error: "Upstream failed: " + e.message });
  }
};
