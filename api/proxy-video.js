module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  var body = req.body || {};
  var engine = body.engine;
  var action = body.action;

  if (!engine || !action) return res.status(400).json({ error: "Missing engine or action" });

  try {
    // --- KLING AI 2.0 ---
    if (engine === "kling") {
      var kk = process.env.KLING_API_KEY;
      if (!kk) return res.status(500).json({ error: "KLING_API_KEY not configured" });

      if (action === "generate") {
        var kBody = { model_name: body.model || "kling-v2-master", prompt: body.prompt, duration: "5", mode: "std" };
        if (body.image_url) kBody.image = body.image_url;
        var kr = await fetch("https://api.klingai.com/v1/videos/text2video", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + kk },
          body: JSON.stringify(kBody)
        });
        return res.status(kr.status).json(await kr.json());
      }
      if (action === "status") {
        var kr2 = await fetch("https://api.klingai.com/v1/videos/text2video/" + body.task_id, {
          headers: { "Authorization": "Bearer " + kk }
        });
        return res.status(kr2.status).json(await kr2.json());
      }
    }

    // --- LUMA DREAM MACHINE ---
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
        return res.status(lr.status).json(await lr.json());
      }
      if (action === "status") {
        var lr2 = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations/" + body.gen_id, {
          headers: { "Authorization": "Bearer " + lk }
        });
        return res.status(lr2.status).json(await lr2.json());
      }
    }

    // --- HEYGEN ---
    if (engine === "heygen") {
      var hk = process.env.HEYGEN_API_KEY;
      if (!hk) return res.status(500).json({ error: "HEYGEN_API_KEY not configured" });

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
        return res.status(hr.status).json(await hr.json());
      }
      if (action === "status") {
        var hr2 = await fetch("https://api.heygen.com/v1/video_status.get?video_id=" + body.video_id, {
          headers: { "X-Api-Key": hk }
        });
        return res.status(hr2.status).json(await hr2.json());
      }
      if (action === "list_avatars") {
        var hr3 = await fetch("https://api.heygen.com/v2/avatars", {
          headers: { "X-Api-Key": hk }
        });
        return res.status(hr3.status).json(await hr3.json());
      }
    }

    // --- HEDRA ---
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
        return res.status(dr.status).json(await dr.json());
      }
      if (action === "status") {
        var dr2 = await fetch("https://mercury.dev.dream-ai.com/api/v2/characters/" + body.job_id, {
          headers: { "X-API-KEY": drk }
        });
        return res.status(dr2.status).json(await dr2.json());
      }
    }

    // --- RUNWAY GEN-4 ---
    if (engine === "runway") {
      var rk = process.env.RUNWAY_API_KEY;
      if (!rk) return res.status(500).json({ error: "RUNWAY_API_KEY not configured" });

      if (action === "generate") {
        var rwBody = { promptText: body.prompt, model: "gen4_turbo", duration: 5, ratio: "16:9" };
        if (body.image_url) { rwBody.promptImage = body.image_url; }
        var rwr = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + rk, "X-Runway-Version": "2024-11-06" },
          body: JSON.stringify(rwBody)
        });
        return res.status(rwr.status).json(await rwr.json());
      }
      if (action === "status") {
        var rwr2 = await fetch("https://api.dev.runwayml.com/v1/tasks/" + body.task_id, {
          headers: { "Authorization": "Bearer " + rk, "X-Runway-Version": "2024-11-06" }
        });
        return res.status(rwr2.status).json(await rwr2.json());
      }
    }

    // --- MINIMAX (HAILUO) ---
    if (engine === "minimax") {
      var mk = process.env.MINIMAX_API_KEY;
      if (!mk) return res.status(500).json({ error: "MINIMAX_API_KEY not configured" });

      if (action === "generate") {
        var mmBody = { model: "T2V-01-HD", prompt: body.prompt };
        if (body.image_url) { mmBody.model = "I2V-01-HD"; mmBody.first_frame_image = body.image_url; }
        var mmr = await fetch("https://api.minimaxi.chat/v1/video_generation", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + mk },
          body: JSON.stringify(mmBody)
        });
        return res.status(mmr.status).json(await mmr.json());
      }
      if (action === "status") {
        var mmr2 = await fetch("https://api.minimaxi.chat/v1/query/video_generation?task_id=" + body.task_id, {
          headers: { "Authorization": "Bearer " + mk }
        });
        return res.status(mmr2.status).json(await mmr2.json());
      }
    }

    // --- PIKA LABS ---
    if (engine === "pika") {
      var pk = process.env.PIKA_API_KEY;
      if (!pk) return res.status(500).json({ error: "PIKA_API_KEY not configured" });

      if (action === "generate") {
        var pkBody = { promptText: body.prompt, style: "None", sfx: false, aspectRatio: "16:9", frameRate: 24, camera: {}, parameters: { guidanceScale: 16, motion: 2, negativePrompt: "blurry, low quality" } };
        if (body.image_url) pkBody.image = { url: body.image_url, type: "url" };
        var pkr = await fetch("https://api.pika.art/v1/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + pk },
          body: JSON.stringify(pkBody)
        });
        return res.status(pkr.status).json(await pkr.json());
      }
      if (action === "status") {
        var pkr2 = await fetch("https://api.pika.art/v1/generate/" + body.gen_id, {
          headers: { "Authorization": "Bearer " + pk }
        });
        return res.status(pkr2.status).json(await pkr2.json());
      }
    }

    // --- D-ID ---
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
        return res.status(dr3.status).json(await dr3.json());
      }
      if (action === "status") {
        var dr4 = await fetch("https://api.d-id.com/talks/" + body.talk_id, {
          headers: { "Authorization": "Basic " + dk }
        });
        return res.status(dr4.status).json(await dr4.json());
      }
    }

    return res.status(400).json({ error: "Unknown engine: " + engine });
  } catch (e) {
    return res.status(502).json({ error: "Upstream failed: " + e.message });
  }
};
