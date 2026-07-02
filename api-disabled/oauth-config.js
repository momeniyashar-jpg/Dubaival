module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).end();
  res.status(200).json({
    meta_app_id: process.env.META_APP_ID || "",
    google_client_id: process.env.GOOGLE_CLIENT_ID || ""
  });
};
