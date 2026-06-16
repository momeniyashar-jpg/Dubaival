const SUPABASE_URL = "https://vrrqajwmygghfmagpgrr.supabase.co";

async function supabaseRequest(path, options) {
  options = options || {};
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = Object.assign(
    { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
    options.headers || {}
  );
  return fetch(SUPABASE_URL + "/rest/v1" + path, Object.assign({}, options, { headers: headers }));
}

async function sendEmail(to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.ALERTS_FROM_EMAIL || "DubaiVal Alerts <onboarding@resend.dev>",
      to: to,
      subject: subject,
      html: html,
    }),
  });
  return res.ok;
}

module.exports = { supabaseRequest: supabaseRequest, sendEmail: sendEmail, SUPABASE_URL: SUPABASE_URL };
