// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved.
// AI Chief of Staff — isolated agent workspace
// Globals used: SUPABASE_URL, SUPABASE_KEY, el(), div(), span(), C(), DV_AUTH,
//               AREAS, DB, computeValuation, askAI, callGroqRaw, USER_PROFILE

// ── STATE ─────────────────────────────────────────────────────────────────────
var CHIEFS_STATE = {
  view: "dashboard",
  inventory: [], clients: [], matches: [], pipeline: [],
  loading: {}, loaded: {},
  invForm: { open: false, editing: null, source: "pocket", building: "", area: "", unit_no: "",
    prop_type: "apartment", beds: "2 BR", size_sqft: "", floor_num: "", view_type: "",
    furnished: "Unfurnished", purpose: "sale", price: "", status: "available",
    notes: "", contact_name: "", contact_phone: "" },
  cliForm: { open: false, editing: null, client_name: "", client_phone: "", client_email: "",
    purpose: "sale", prop_type: "apartment", beds_wanted: "2 BR", areas_wanted: [],
    area_input: "", min_price: "", max_price: "", min_size: "", max_size: "",
    view_pref: "", furnished_pref: "", timeline: "flexible", notes: "", status: "active",
    source: "manual", raw_conversation: "" },
  scanner: { open: false, text: "", parsing: false, result: null, error: null },
  pipeForm: { open: false, editing: null, client_name: "", property_desc: "", stage: "lead",
    deal_value: "", next_action: "", next_action_date: "", notes: "" },
  matchDrafting: {}, busySave: false, autoMatchRunning: false,
  expandedInv: null, expandedCli: null, expandedMatch: null, expandedPipe: null,
  matchFilter: "pending"   // pending | approved | all
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function _chiefsId() {
  if (typeof DV_AUTH !== "undefined" && DV_AUTH.user && DV_AUTH.user.id) return DV_AUTH.user.id;
  var fp = localStorage.getItem("dv_chiefs_fp");
  if (!fp) { fp = "cfp_" + Math.random().toString(36).substr(2,12); localStorage.setItem("dv_chiefs_fp", fp); }
  return fp;
}
function _chiefsH() {
  var token = localStorage.getItem("dv_access_token") || SUPABASE_KEY;
  return { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + token, "Content-Type": "application/json" };
}
function _fmtPrice(n) { if (!n) return "—"; return "AED " + Number(n).toLocaleString(); }
function _timeAgo(ts) {
  if (!ts) return "—";
  var s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return "just now"; if (s < 3600) return Math.floor(s/60) + "m ago";
  if (s < 86400) return Math.floor(s/3600) + "h ago"; return Math.floor(s/86400) + "d ago";
}
function _stageColor(stage) {
  return { lead:"#6B7A9E", viewing:"#3B82F6", offer:"#F59E0B", mou:"#8B5CF6",
           docs:"#EC4899", closing:"#10B981", closed:"#D4AF37", lost:"#EF4444" }[stage] || "#6B7A9E";
}
function _statusColor(s) {
  return { available:"#10B981", under_offer:"#F59E0B", sold:"#6B7A9E", rented:"#6B7A9E",
           expired:"#EF4444", pocket:"#8B5CF6" }[s] || "#6B7A9E";
}
function _verdictColor(v) {
  if (!v) return "#6B7A9E";
  if (v.toLowerCase().includes("good") || v.toLowerCase().includes("under")) return "#10B981";
  if (v.toLowerCase().includes("over") || v.toLowerCase().includes("high")) return "#EF4444";
  return "#F59E0B";
}

// ── DATA FETCHING ─────────────────────────────────────────────────────────────
async function chiefsLoadInventory() {
  if (CHIEFS_STATE.loading.inventory) return;
  CHIEFS_STATE.loading.inventory = true; render();
  try {
    var r = await fetch(SUPABASE_URL + "/rest/v1/chiefs_inventory?agent_id=eq." +
      encodeURIComponent(_chiefsId()) + "&order=created_at.desc&limit=200", { headers: _chiefsH() });
    if (r.ok) { CHIEFS_STATE.inventory = await r.json(); CHIEFS_STATE.loaded.inventory = true; }
    else CHIEFS_STATE.inventory = [];
  } catch(e) { CHIEFS_STATE.inventory = []; }
  CHIEFS_STATE.loading.inventory = false; render();
}

async function chiefsLoadClients() {
  if (CHIEFS_STATE.loading.clients) return;
  CHIEFS_STATE.loading.clients = true; render();
  try {
    var r = await fetch(SUPABASE_URL + "/rest/v1/chiefs_clients?agent_id=eq." +
      encodeURIComponent(_chiefsId()) + "&order=created_at.desc&limit=200", { headers: _chiefsH() });
    if (r.ok) { CHIEFS_STATE.clients = await r.json(); CHIEFS_STATE.loaded.clients = true; }
    else CHIEFS_STATE.clients = [];
  } catch(e) { CHIEFS_STATE.clients = []; }
  CHIEFS_STATE.loading.clients = false; render();
}

async function chiefsLoadMatches() {
  if (CHIEFS_STATE.loading.matches) return;
  CHIEFS_STATE.loading.matches = true; render();
  try {
    var r = await fetch(SUPABASE_URL + "/rest/v1/chiefs_matches?agent_id=eq." +
      encodeURIComponent(_chiefsId()) + "&order=created_at.desc&limit=200", { headers: _chiefsH() });
    if (r.ok) { CHIEFS_STATE.matches = await r.json(); CHIEFS_STATE.loaded.matches = true; }
    else CHIEFS_STATE.matches = [];
  } catch(e) { CHIEFS_STATE.matches = []; }
  CHIEFS_STATE.loading.matches = false; render();
}

async function chiefsLoadPipeline() {
  if (CHIEFS_STATE.loading.pipeline) return;
  CHIEFS_STATE.loading.pipeline = true; render();
  try {
    var r = await fetch(SUPABASE_URL + "/rest/v1/chiefs_pipeline?agent_id=eq." +
      encodeURIComponent(_chiefsId()) + "&order=updated_at.desc&limit=200", { headers: _chiefsH() });
    if (r.ok) { CHIEFS_STATE.pipeline = await r.json(); CHIEFS_STATE.loaded.pipeline = true; }
    else CHIEFS_STATE.pipeline = [];
  } catch(e) { CHIEFS_STATE.pipeline = []; }
  CHIEFS_STATE.loading.pipeline = false; render();
}

async function chiefsLoadAll() {
  await Promise.all([chiefsLoadInventory(), chiefsLoadClients(), chiefsLoadMatches(), chiefsLoadPipeline()]);
}

// ── INVENTORY CRUD ────────────────────────────────────────────────────────────
async function chiefsSaveInventory() {
  var f = CHIEFS_STATE.invForm;
  if (!f.area) { alert("Area is required"); return; }
  if (!f.price) { alert("Price is required"); return; }
  CHIEFS_STATE.busySave = true; render();
  var dvFair = null, dvPsf = null, dvVerdict = null, dvConf = null;
  if (f.size_sqft && f.price && typeof computeValuation === "function") {
    try {
      var val = computeValuation({ area: f.area, building: f.building || "", buaSize: String(f.size_sqft),
        price: String(f.price).replace(/,/g,""), propCategory: (f.prop_type==="villa"||f.prop_type==="townhouse")?"villa":"apartment",
        beds: f.beds || "2 BR", view: f.view_type || "Not specified", floor: f.floor_num || "",
        furnished: f.furnished || "Unfurnished", parking: "1", serviceCharge: "" }, f.building||"", null);
      if (val) { dvFair = val.fairPrice; dvPsf = val.adjPSF; dvVerdict = val.verdict; dvConf = val.confScore; }
    } catch(e) {}
  }
  var row = { agent_id: _chiefsId(), source: f.source||"pocket", building: f.building||null,
    area: f.area, unit_no: f.unit_no||null, prop_type: f.prop_type||"apartment",
    beds: f.beds||null, size_sqft: parseFloat(f.size_sqft)||null, floor_num: f.floor_num||null,
    view_type: f.view_type||null, furnished: f.furnished||"Unfurnished", purpose: f.purpose||"sale",
    price: parseFloat(String(f.price||"").replace(/,/g,""))||0, status: f.status||"available",
    notes: f.notes||null, contact_name: f.contact_name||null, contact_phone: f.contact_phone||null,
    dv_fair_price: dvFair, dv_psf: dvPsf, dv_verdict: dvVerdict, dv_confidence: dvConf,
    updated_at: new Date().toISOString() };
  try {
    var url = SUPABASE_URL + "/rest/v1/chiefs_inventory";
    var method = "POST"; var hdrs = Object.assign({}, _chiefsH(), {"Prefer":"return=representation"});
    if (f.editing) { url += "?id=eq." + f.editing; method = "PATCH"; }
    var r = await fetch(url, { method: method, headers: hdrs, body: JSON.stringify(row) });
    if (!r.ok) { var e = await r.json(); throw new Error(e.message || "Save failed"); }
    CHIEFS_STATE.invForm = { open:false, editing:null, source:"pocket", building:"", area:"", unit_no:"",
      prop_type:"apartment", beds:"2 BR", size_sqft:"", floor_num:"", view_type:"",
      furnished:"Unfurnished", purpose:"sale", price:"", status:"available", notes:"", contact_name:"", contact_phone:"" };
    CHIEFS_STATE.loaded.inventory = false;
    await chiefsLoadInventory();
    if (!f.editing) _chiefsAutoMatch();
  } catch(e) { alert("Error: " + e.message); }
  CHIEFS_STATE.busySave = false; render();
}

async function chiefsDeleteInventory(id) {
  if (!confirm("Remove this listing from your inventory?")) return;
  try {
    await fetch(SUPABASE_URL + "/rest/v1/chiefs_inventory?id=eq." + id, { method: "DELETE", headers: _chiefsH() });
    CHIEFS_STATE.inventory = CHIEFS_STATE.inventory.filter(function(x){return x.id!==id;});
    render();
  } catch(e) { alert("Delete failed"); }
}

function chiefsEditInventory(item) {
  CHIEFS_STATE.invForm = { open:true, editing:item.id, source:item.source||"pocket",
    building:item.building||"", area:item.area||"", unit_no:item.unit_no||"",
    prop_type:item.prop_type||"apartment", beds:item.beds||"2 BR", size_sqft:item.size_sqft||"",
    floor_num:item.floor_num||"", view_type:item.view_type||"", furnished:item.furnished||"Unfurnished",
    purpose:item.purpose||"sale", price:item.price||"", status:item.status||"available",
    notes:item.notes||"", contact_name:item.contact_name||"", contact_phone:item.contact_phone||"" };
  CHIEFS_STATE.view = "inventory"; render();
}

// ── CLIENT CRUD ───────────────────────────────────────────────────────────────
async function chiefsSaveClient() {
  var f = CHIEFS_STATE.cliForm;
  if (!f.client_name) { alert("Client name is required"); return; }
  CHIEFS_STATE.busySave = true; render();
  var row = { agent_id: _chiefsId(), client_name: f.client_name.trim(),
    client_phone: f.client_phone||null, client_email: f.client_email||null,
    purpose: f.purpose||"sale", prop_type: f.prop_type||"apartment",
    beds_wanted: f.beds_wanted||null, areas_wanted: f.areas_wanted.length ? f.areas_wanted : null,
    min_price: parseFloat(String(f.min_price||"").replace(/,/g,""))||null,
    max_price: parseFloat(String(f.max_price||"").replace(/,/g,""))||null,
    min_size: parseFloat(f.min_size)||null, max_size: parseFloat(f.max_size)||null,
    view_pref: f.view_pref||null, furnished_pref: f.furnished_pref||null,
    timeline: f.timeline||"flexible", notes: f.notes||null, status: f.status||"active",
    source: f.source||"manual", raw_conversation: f.raw_conversation||null,
    updated_at: new Date().toISOString() };
  try {
    var url = SUPABASE_URL + "/rest/v1/chiefs_clients";
    var method = "POST"; var hdrs = Object.assign({}, _chiefsH(), {"Prefer":"return=representation"});
    if (f.editing) { url += "?id=eq." + f.editing; method = "PATCH"; }
    var r = await fetch(url, { method: method, headers: hdrs, body: JSON.stringify(row) });
    if (!r.ok) { var e = await r.json(); throw new Error(e.message || "Save failed"); }
    CHIEFS_STATE.cliForm = { open:false, editing:null, client_name:"", client_phone:"", client_email:"",
      purpose:"sale", prop_type:"apartment", beds_wanted:"2 BR", areas_wanted:[], area_input:"",
      min_price:"", max_price:"", min_size:"", max_size:"", view_pref:"", furnished_pref:"",
      timeline:"flexible", notes:"", status:"active", source:"manual", raw_conversation:"" };
    CHIEFS_STATE.loaded.clients = false;
    await chiefsLoadClients();
    if (!f.editing) _chiefsAutoMatch();
  } catch(e) { alert("Error: " + e.message); }
  CHIEFS_STATE.busySave = false; render();
}

async function chiefsDeleteClient(id) {
  if (!confirm("Remove this client from your memory bank?")) return;
  try {
    await fetch(SUPABASE_URL + "/rest/v1/chiefs_clients?id=eq." + id, { method: "DELETE", headers: _chiefsH() });
    CHIEFS_STATE.clients = CHIEFS_STATE.clients.filter(function(x){return x.id!==id;});
    render();
  } catch(e) { alert("Delete failed"); }
}

function chiefsEditClient(item) {
  CHIEFS_STATE.cliForm = { open:true, editing:item.id, client_name:item.client_name||"",
    client_phone:item.client_phone||"", client_email:item.client_email||"",
    purpose:item.purpose||"sale", prop_type:item.prop_type||"apartment",
    beds_wanted:item.beds_wanted||"2 BR", areas_wanted:Array.isArray(item.areas_wanted)?item.areas_wanted:[],
    area_input:"", min_price:item.min_price||"", max_price:item.max_price||"",
    min_size:item.min_size||"", max_size:item.max_size||"",
    view_pref:item.view_pref||"", furnished_pref:item.furnished_pref||"",
    timeline:item.timeline||"flexible", notes:item.notes||"", status:item.status||"active",
    source:item.source||"manual", raw_conversation:item.raw_conversation||"" };
  CHIEFS_STATE.view = "clients"; render();
}

// ── CONVERSATION SCANNER ──────────────────────────────────────────────────────
async function chiefsScanConversation() {
  var text = CHIEFS_STATE.scanner.text.trim();
  if (!text) return;
  CHIEFS_STATE.scanner.parsing = true; CHIEFS_STATE.scanner.result = null;
  CHIEFS_STATE.scanner.error = null; render();
  try {
    var groqBody = {
      model: "llama-3.3-70b-versatile", max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a Dubai real estate CRM assistant. Extract client requirements from WhatsApp/email conversations and respond with valid JSON only." },
        { role: "user", content: "Extract requirements from this conversation:\n\n" + text.substring(0,4000) + "\n\nReturn JSON: {\"client_name\":\"string\",\"purpose\":\"sale|rent\",\"prop_type\":\"apartment|villa|townhouse\",\"beds\":\"Studio|1 BR|2 BR|3 BR|4 BR|5+ BR\",\"areas\":[],\"min_price\":null,\"max_price\":null,\"min_size\":null,\"max_size\":null,\"view\":\"\",\"furnished\":\"\",\"timeline\":\"urgent|short|medium|flexible\",\"notes\":\"summary of key requirements\",\"confidence\":85}" }
      ]
    };
    var r = await callGroqRaw(groqBody);
    if (!r.ok) throw new Error("AI error");
    var d = await r.json();
    var content = d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content || "";
    CHIEFS_STATE.scanner.result = JSON.parse(content.trim());
  } catch(e) {
    CHIEFS_STATE.scanner.error = e.message || "Failed to parse conversation";
  }
  CHIEFS_STATE.scanner.parsing = false; render();
}

function chiefsScannerApply() {
  var r = CHIEFS_STATE.scanner.result;
  if (!r) return;
  CHIEFS_STATE.cliForm = { open:true, editing:null,
    client_name: r.client_name||"", client_phone:"", client_email:"",
    purpose: r.purpose||"sale", prop_type: r.prop_type||"apartment",
    beds_wanted: r.beds||"2 BR",
    areas_wanted: Array.isArray(r.areas) ? r.areas.filter(function(a){return a;}) : [],
    area_input:"", min_price:r.min_price?String(r.min_price):"", max_price:r.max_price?String(r.max_price):"",
    min_size:r.min_size?String(r.min_size):"", max_size:r.max_size?String(r.max_size):"",
    view_pref:r.view||"", furnished_pref:r.furnished||"",
    timeline:r.timeline||"flexible", notes:r.notes||"", status:"active",
    source:"whatsapp", raw_conversation:CHIEFS_STATE.scanner.text };
  CHIEFS_STATE.scanner = { open:false, text:"", parsing:false, result:null, error:null };
  CHIEFS_STATE.view = "clients"; render();
}

// ── AUTO-MATCHING ENGINE ──────────────────────────────────────────────────────
function _scoreMatch(client, listing) {
  if (client.purpose !== listing.purpose) return null;
  if (listing.status !== "available" && listing.status !== "pocket") return null;
  var score = 0, reasons = [];
  var areas = Array.isArray(client.areas_wanted) ? client.areas_wanted : [];
  if (areas.length > 0) {
    var aMatch = areas.some(function(a){ return a && listing.area && a.toLowerCase()===listing.area.toLowerCase(); });
    if (!aMatch) return null;
    score += 40; reasons.push("Area: " + listing.area);
  } else { score += 15; }
  if (client.beds_wanted && listing.beds) {
    if (client.beds_wanted === listing.beds) { score += 25; reasons.push("Beds: " + listing.beds); }
    else score -= 10;
  }
  var price = Number(listing.price) || 0;
  if (price > 0) {
    var minP = Number(client.min_price) || 0;
    var maxP = Number(client.max_price) || Infinity;
    if (price >= minP && price <= maxP) { score += 25; reasons.push("In budget: " + _fmtPrice(price)); }
    else if (maxP !== Infinity && price > maxP * 1.12) return null;
    else if (price < minP * 0.88) score -= 5;
  }
  if (client.prop_type && listing.prop_type && client.prop_type === listing.prop_type) {
    score += 10; reasons.push("Type: " + listing.prop_type);
  }
  return score >= 40 ? { score: Math.min(100, Math.max(0, score)), reasons: reasons } : null;
}

async function _chiefsAutoMatch() {
  if (CHIEFS_STATE.autoMatchRunning) return;
  CHIEFS_STATE.autoMatchRunning = true;
  if (!CHIEFS_STATE.loaded.inventory) await chiefsLoadInventory();
  if (!CHIEFS_STATE.loaded.clients) await chiefsLoadClients();
  if (!CHIEFS_STATE.loaded.matches) await chiefsLoadMatches();
  var agentId = _chiefsId();
  var activeClients = CHIEFS_STATE.clients.filter(function(c){ return c.status==="active"; });
  var avail = CHIEFS_STATE.inventory.filter(function(l){ return l.status==="available"||l.status==="pocket"; });
  var existKeys = new Set(CHIEFS_STATE.matches.map(function(m){ return m.client_id+"_"+m.inventory_id; }));
  var newRows = [];
  activeClients.forEach(function(client) {
    avail.forEach(function(listing) {
      var key = client.id + "_" + listing.id;
      if (existKeys.has(key)) return;
      var ms = _scoreMatch(client, listing);
      if (ms) newRows.push({ agent_id:agentId, client_id:client.id, inventory_id:listing.id,
        match_score:ms.score, match_reasons:ms.reasons, status:"new" });
    });
  });
  if (newRows.length > 0) {
    try {
      var r = await fetch(SUPABASE_URL + "/rest/v1/chiefs_matches", {
        method:"POST", headers:Object.assign({},_chiefsH(),{"Prefer":"return=minimal"}),
        body:JSON.stringify(newRows) });
      if (r.ok) { CHIEFS_STATE.loaded.matches = false; await chiefsLoadMatches(); }
    } catch(e) {}
  }
  CHIEFS_STATE.autoMatchRunning = false; render();
}

// ── AI MESSAGE DRAFTER ────────────────────────────────────────────────────────
async function chiefsDraftMessage(matchId) {
  CHIEFS_STATE.matchDrafting[matchId] = true; render();
  var match = CHIEFS_STATE.matches.find(function(m){ return m.id===matchId; });
  if (!match) { CHIEFS_STATE.matchDrafting[matchId]=false; render(); return; }
  var client = CHIEFS_STATE.clients.find(function(c){ return c.id===match.client_id; });
  var listing = CHIEFS_STATE.inventory.find(function(l){ return l.id===match.inventory_id; });
  if (!client || !listing) { CHIEFS_STATE.matchDrafting[matchId]=false; render(); return; }
  var agentName = (typeof USER_PROFILE!=="undefined"&&USER_PROFILE.name) ||
    (typeof DV_AUTH!=="undefined"&&DV_AUTH.user&&DV_AUTH.user.email&&DV_AUTH.user.email.split("@")[0]) || "Your Agent";
  var areas = Array.isArray(client.areas_wanted) ? client.areas_wanted.join(", ") : "—";
  var prompt = "Write a professional, friendly WhatsApp message from real estate agent " + agentName + " to client " + client.client_name + ".\n\n" +
    "Client wants: " + (client.beds_wanted||"") + " " + client.prop_type + " for " + client.purpose + " in " + areas + ". Budget: " + _fmtPrice(client.min_price) + " to " + _fmtPrice(client.max_price) + ". Timeline: " + client.timeline + ".\n\n" +
    "Available property: " + (listing.beds||"") + " " + listing.prop_type + " in " + listing.area + (listing.building?" at "+listing.building:"") + ". Price: " + _fmtPrice(listing.price) + (listing.purpose==="rent"?"/yr":"") + ". Size: " + (listing.size_sqft?listing.size_sqft+" sqft":"N/A") + ". Floor: " + (listing.floor_num||"N/A") + ". View: " + (listing.view_type||"N/A") + ". Furnished: " + (listing.furnished||"N/A") + "." + (listing.dv_verdict?" DubAIVal says: "+listing.dv_verdict+".":"") + "\n\nWrite 2-4 short sentences. Greet by first name. Mention you found a match. Give key details naturally. End with a call to action. No asterisks or formatting symbols. Return only the message.";
  try {
    var result = await askAI([{role:"user",content:prompt}], "You are a professional Dubai real estate agent writing a WhatsApp message.", null);
    if (result && result.trim()) {
      await fetch(SUPABASE_URL + "/rest/v1/chiefs_matches?id=eq." + matchId, {
        method:"PATCH", headers:Object.assign({},_chiefsH(),{"Prefer":"return=minimal"}),
        body:JSON.stringify({draft_message:result.trim(),status:"draft_ready"}) });
      var m = CHIEFS_STATE.matches.find(function(x){ return x.id===matchId; });
      if (m) { m.draft_message = result.trim(); m.status = "draft_ready"; }
    }
  } catch(e) { alert("AI drafting failed: " + (e.message||"error")); }
  CHIEFS_STATE.matchDrafting[matchId] = false; render();
}

async function chiefsApproveMatch(matchId) {
  var match = CHIEFS_STATE.matches.find(function(m){ return m.id===matchId; });
  if (!match || !match.draft_message) return;
  try { await navigator.clipboard.writeText(match.draft_message); } catch(e) {}
  try {
    await fetch(SUPABASE_URL + "/rest/v1/chiefs_matches?id=eq." + matchId, {
      method:"PATCH", headers:Object.assign({},_chiefsH(),{"Prefer":"return=minimal"}),
      body:JSON.stringify({status:"approved",sent_at:new Date().toISOString()}) });
    var m = CHIEFS_STATE.matches.find(function(x){ return x.id===matchId; });
    if (m) m.status = "approved";
  } catch(e) {}
  render();
  alert("✓ Message copied! Paste in WhatsApp to send.");
}

async function chiefsWhatsApp(matchId) {
  var match = CHIEFS_STATE.matches.find(function(m){ return m.id===matchId; });
  if (!match || !match.draft_message) return;
  var client = CHIEFS_STATE.clients.find(function(c){ return c.id===match.client_id; });
  if (client && client.client_phone) {
    var phone = client.client_phone.replace(/[^0-9+]/g,"");
    window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(match.draft_message), "_blank", "noopener,noreferrer");
  }
  await chiefsApproveMatch(matchId);
}

async function chiefsDismissMatch(matchId) {
  try {
    await fetch(SUPABASE_URL + "/rest/v1/chiefs_matches?id=eq." + matchId, {
      method:"PATCH", headers:Object.assign({},_chiefsH(),{"Prefer":"return=minimal"}),
      body:JSON.stringify({status:"dismissed"}) });
    var m = CHIEFS_STATE.matches.find(function(x){ return x.id===matchId; });
    if (m) m.status = "dismissed";
  } catch(e) {}
  render();
}

// ── PIPELINE CRUD ─────────────────────────────────────────────────────────────
async function chiefsSavePipeline() {
  var f = CHIEFS_STATE.pipeForm;
  if (!f.client_name) { alert("Client name is required"); return; }
  CHIEFS_STATE.busySave = true; render();
  var dv = parseFloat(String(f.deal_value||"").replace(/,/g,"")) || null;
  var row = { agent_id:_chiefsId(), client_name:f.client_name.trim(), property_desc:f.property_desc||null,
    stage:f.stage||"lead", deal_value:dv, commission_est:dv?dv*0.02:null,
    next_action:f.next_action||null, next_action_date:f.next_action_date||null,
    notes:f.notes||null, updated_at:new Date().toISOString() };
  try {
    var url = SUPABASE_URL + "/rest/v1/chiefs_pipeline";
    var method = "POST";
    if (f.editing) { url += "?id=eq." + f.editing; method = "PATCH"; }
    var r = await fetch(url, { method:method, headers:Object.assign({},_chiefsH(),{"Prefer":"return=representation"}), body:JSON.stringify(row) });
    if (!r.ok) throw new Error("Save failed");
    CHIEFS_STATE.pipeForm = { open:false, editing:null, client_name:"", property_desc:"",
      stage:"lead", deal_value:"", next_action:"", next_action_date:"", notes:"" };
    CHIEFS_STATE.loaded.pipeline = false;
    await chiefsLoadPipeline();
  } catch(e) { alert("Error: " + e.message); }
  CHIEFS_STATE.busySave = false; render();
}

async function chiefsMoveStage(id, stage) {
  try {
    await fetch(SUPABASE_URL + "/rest/v1/chiefs_pipeline?id=eq." + id, {
      method:"PATCH", headers:Object.assign({},_chiefsH(),{"Prefer":"return=minimal"}),
      body:JSON.stringify({stage:stage,updated_at:new Date().toISOString()}) });
    var p = CHIEFS_STATE.pipeline.find(function(x){ return x.id===id; });
    if (p) p.stage = stage;
    render();
  } catch(e) {}
}

async function chiefsDeletePipeline(id) {
  if (!confirm("Remove from pipeline?")) return;
  try {
    await fetch(SUPABASE_URL + "/rest/v1/chiefs_pipeline?id=eq." + id, { method:"DELETE", headers:_chiefsH() });
    CHIEFS_STATE.pipeline = CHIEFS_STATE.pipeline.filter(function(x){ return x.id!==id; });
    render();
  } catch(e) {}
}

// ── SHARED UI HELPERS ─────────────────────────────────────────────────────────
function _chBtn(text, bg, fg, onClick, extra) {
  var b = el("button", {style:Object.assign({background:bg,color:fg||"#08090C",border:"none",
    padding:"8px 14px",borderRadius:"8px",fontSize:"12px",fontWeight:"700",
    fontFamily:"'Space Grotesk',monospace",cursor:"pointer",whiteSpace:"nowrap"},extra||{})});
  b.textContent = text; b.addEventListener("click", onClick); return b;
}
function _chBadge(text, color) {
  var b = el("span",{style:{background:color+"22",color:color,border:"1px solid "+color+"44",
    borderRadius:"20px",padding:"2px 8px",fontSize:"10px",fontWeight:"700",
    fontFamily:"'Space Grotesk',monospace",whiteSpace:"nowrap"}});
  b.textContent = text; return b;
}
function _chCard(children, extra) {
  var cl = C();
  var c = el("div",{style:Object.assign({background:cl.surface,border:"1px solid "+cl.border,
    borderRadius:"12px",padding:"14px",marginBottom:"10px"},extra||{})});
  if (Array.isArray(children)) children.forEach(function(ch){if(ch)c.appendChild(ch);});
  else if (children) c.appendChild(children);
  return c;
}
function _chField(label, value) {
  var cl = C();
  var w = el("div",{style:{minWidth:"80px"}});
  w.appendChild(span({color:cl.muted,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",fontFamily:"'Space Grotesk',monospace"},label));
  w.appendChild(span({color:cl.white,fontSize:"12px",fontFamily:"'Inter',sans-serif"},value||"—"));
  return w;
}
function _chRow() { var r=el("div",{style:{display:"flex",flexWrap:"wrap",gap:"12px",marginTop:"8px"}}); Array.from(arguments).forEach(function(c){if(c)r.appendChild(c);}); return r; }

// ── VIEW: DASHBOARD ───────────────────────────────────────────────────────────
function _renderChiefsDashboard() {
  var cl = C();
  var wrap = el("div",{style:{padding:"16px",maxWidth:"700px",margin:"0 auto"}});

  // Stats row
  var inv = CHIEFS_STATE.inventory; var cli = CHIEFS_STATE.clients;
  var matches = CHIEFS_STATE.matches; var pipe = CHIEFS_STATE.pipeline;
  var pendingMatches = matches.filter(function(m){ return m.status==="new"||m.status==="draft_ready"; });
  var activeDeals = pipe.filter(function(p){ return p.stage!=="closed"&&p.stage!=="lost"; });
  var stats = [
    {label:"My Listings",val:inv.length,color:"#D4AF37",icon:"📦"},
    {label:"Active Clients",val:cli.filter(function(c){return c.status==="active";}).length,color:"#3B82F6",icon:"👥"},
    {label:"Pending Matches",val:pendingMatches.length,color:"#10B981",icon:"🔗"},
    {label:"Active Deals",val:activeDeals.length,color:"#8B5CF6",icon:"📋"}
  ];
  var statsRow = el("div",{style:{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px",marginBottom:"16px"}});
  stats.forEach(function(s) {
    var c = el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"14px",cursor:"pointer"}});
    c.appendChild(span({fontSize:"20px",display:"block",marginBottom:"6px"},s.icon));
    c.appendChild(div({color:s.color,fontSize:"22px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},String(s.val)));
    c.appendChild(div({color:cl.sub,fontSize:"11px",fontFamily:"'Inter',sans-serif",marginTop:"2px"},s.label));
    statsRow.appendChild(c);
  });
  wrap.appendChild(statsRow);

  // Quick actions
  var qr = el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"}});
  var quickActions = [
    {label:"+ Add Listing",color:"#D4AF37",view:"inventory",action:function(){CHIEFS_STATE.invForm.open=true;CHIEFS_STATE.view="inventory";render();}},
    {label:"+ Add Client",color:"#3B82F6",action:function(){CHIEFS_STATE.cliForm.open=true;CHIEFS_STATE.view="clients";render();}},
    {label:"Scan WhatsApp",color:"#25D366",action:function(){CHIEFS_STATE.scanner.open=true;CHIEFS_STATE.view="clients";render();}},
    {label:"Run Auto-Match",color:"#10B981",action:function(){_chiefsAutoMatch();CHIEFS_STATE.view="matches";render();}}
  ];
  quickActions.forEach(function(qa) {
    var b = el("button",{style:{background:qa.color+"22",border:"1px solid "+qa.color+"44",color:qa.color,
      padding:"10px",borderRadius:"10px",fontSize:"12px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",
      cursor:"pointer"}});
    b.textContent = qa.label; b.addEventListener("click",qa.action); qr.appendChild(b);
  });
  wrap.appendChild(qr);

  // Pending matches preview
  if (pendingMatches.length > 0) {
    wrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Pending Matches"));
    var recent = pendingMatches.slice(0,3);
    recent.forEach(function(m) {
      var client = cli.find(function(c){return c.id===m.client_id;});
      var listing = inv.find(function(l){return l.id===m.inventory_id;});
      if (!client||!listing) return;
      var mc = el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",
        padding:"10px 12px",marginBottom:"8px",cursor:"pointer",display:"flex",alignItems:"center",gap:"10px"}});
      mc.addEventListener("click",function(){CHIEFS_STATE.view="matches";render();});
      var score = el("div",{style:{width:"36px",height:"36px",borderRadius:"50%",background:"#10B98122",
        border:"2px solid #10B981",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:"0"}});
      score.appendChild(span({color:"#10B981",fontSize:"11px",fontWeight:"700"},Math.round(m.match_score||0)+"%"));
      mc.appendChild(score);
      var info = el("div",{style:{flex:"1",minWidth:"0"}});
      info.appendChild(div({color:cl.white,fontSize:"12px",fontWeight:"600",fontFamily:"'Inter',sans-serif",
        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},client.client_name+" → "+listing.area+(listing.building?" · "+listing.building:"")));
      info.appendChild(div({color:cl.sub,fontSize:"11px",marginTop:"2px"},_fmtPrice(listing.price)+" · "+_timeAgo(m.created_at)));
      mc.appendChild(info);
      if (m.status==="draft_ready") mc.appendChild(_chBadge("Draft Ready","#10B981"));
      wrap.appendChild(mc);
    });
    if (pendingMatches.length > 3) {
      var moreBtn = el("button",{style:{width:"100%",background:"transparent",border:"1px solid "+cl.border,
        color:cl.sub,borderRadius:"8px",padding:"8px",fontSize:"11px",cursor:"pointer",marginBottom:"10px"}});
      moreBtn.textContent = "View all " + pendingMatches.length + " matches →";
      moreBtn.addEventListener("click",function(){CHIEFS_STATE.view="matches";render();});
      wrap.appendChild(moreBtn);
    }
  }

  // Upcoming pipeline actions
  var upcoming = pipe.filter(function(p){return p.next_action&&p.stage!=="closed"&&p.stage!=="lost";}).slice(0,3);
  if (upcoming.length > 0) {
    wrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",marginTop:"4px"},"Next Actions"));
    upcoming.forEach(function(p) {
      var pc = el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",
        padding:"10px 12px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"10px",cursor:"pointer"}});
      pc.addEventListener("click",function(){CHIEFS_STATE.view="pipeline";render();});
      var stageTag = el("div",{style:{width:"6px",height:"36px",borderRadius:"3px",background:_stageColor(p.stage),flexShrink:"0"}});
      pc.appendChild(stageTag);
      var info = el("div",{style:{flex:"1",minWidth:"0"}});
      info.appendChild(div({color:cl.white,fontSize:"12px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},p.client_name));
      info.appendChild(div({color:cl.sub,fontSize:"11px",marginTop:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},p.next_action));
      pc.appendChild(info);
      if (p.next_action_date) pc.appendChild(_chBadge(p.next_action_date,"#F59E0B"));
      wrap.appendChild(pc);
    });
  }

  if (!inv.length && !cli.length) {
    var empty = _chCard([
      div({color:cl.white,fontSize:"14px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",textAlign:"center"},"Welcome to AI Chief of Staff"),
      div({color:cl.sub,fontSize:"12px",lineHeight:"1.6",textAlign:"center",fontFamily:"'Inter',sans-serif"},"Your AI-powered agent workspace. Add listings to your inventory, store client requirements, and let the AI automatically match clients to properties and draft personalized WhatsApp messages."),
      div({style:{display:"flex",justifyContent:"center",gap:"8px",marginTop:"12px"}},[
        _chBtn("+ Add Listing","#D4AF37",undefined,function(){CHIEFS_STATE.invForm.open=true;CHIEFS_STATE.view="inventory";render();}),
        _chBtn("+ Add Client","#3B82F6","#fff",function(){CHIEFS_STATE.cliForm.open=true;CHIEFS_STATE.view="clients";render();})
      ])
    ],{textAlign:"center"});
    wrap.appendChild(empty);
  }
  return wrap;
}

// ── VIEW: INVENTORY ───────────────────────────────────────────────────────────
function _renderChiefsInventory() {
  var cl = C();
  var wrap = el("div",{style:{padding:"16px",maxWidth:"700px",margin:"0 auto"}});
  var f = CHIEFS_STATE.invForm;
  var areaNames = Object.keys(typeof AREAS!=="undefined"?AREAS:{}).sort();

  // Header + add button
  var hdr = el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}});
  hdr.appendChild(div({color:cl.white,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Property Inventory"));
  if (!f.open) hdr.appendChild(_chBtn("+ Add Listing","#D4AF37",undefined,function(){CHIEFS_STATE.invForm.open=true;CHIEFS_STATE.invForm.editing=null;render();}));
  wrap.appendChild(hdr);

  // Inline form
  if (f.open) {
    var fm = _chCard(null,{background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.2)"});
    fm.appendChild(div({color:"#D4AF37",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px",letterSpacing:"0.1em"},f.editing?"EDIT LISTING":"NEW LISTING"));
    var g1 = el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}});
    [[lbl("Area *"),mkAuto(Object.assign({},I(),{marginBottom:"0"}),areaNames,f.area,function(v){f.area=v;},"Type area...")],
     [lbl("Building"),el("input",{type:"text",placeholder:"Building name",style:I(),value:f.building||""})],
     [lbl("Purpose"),mkSelect(I(),["sale","rent"],f.purpose||"sale",function(v){f.purpose=v;})],
     [lbl("Type"),mkSelect(I(),["apartment","villa","townhouse","penthouse"],f.prop_type||"apartment",function(v){f.prop_type=v;})],
     [lbl("Bedrooms"),mkSelect(I(),["Studio","1 BR","2 BR","3 BR","4 BR","5+ BR"],f.beds||"2 BR",function(v){f.beds=v;})],
     [lbl("Status"),mkSelect(I(),["available","pocket","under_offer","sold","rented","expired"],f.status||"available",function(v){f.status=v;})],
    ].forEach(function(pair,i) {
      var cell = el("div",{});
      if (pair[0]&&pair[0].tagName) { cell.appendChild(pair[0]); }
      else { cell.appendChild(pair[0]); }
      if (pair[1]) { pair[1].addEventListener("input",function(){f.building=this.value;}); cell.appendChild(pair[1]); }
      g1.appendChild(cell);
    });
    fm.appendChild(g1);
    var g2 = el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"8px"}});
    [["Price (AED) *","number",function(v){f.price=v;},f.price||""],
     ["Size (sqft)","number",function(v){f.size_sqft=v;},f.size_sqft||""],
     ["Floor","text",function(v){f.floor_num=v;},f.floor_num||""]
    ].forEach(function(item) {
      var cell = el("div",{}); cell.appendChild(lbl(item[0]));
      var i2 = inp(I(),"",item[1],item[2]===undefined?"":item[3],item[2]);
      cell.appendChild(i2); g2.appendChild(cell);
    });
    fm.appendChild(g2);
    var g3 = el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}});
    var viewSel = el("div",{}); viewSel.appendChild(lbl("View"));
    viewSel.appendChild(mkSelect(I(),["","Full Sea View","Burj Khalifa View","Burj + Fountain","Fountain View","Palm View","Marina View","Full Canal View","Golf View","Boulevard View","Creek Harbour View","Partial Sea View","Partial Canal View","Garden/Park View","Pool View","Community View","Skyline View","Lake View","Lagoon View","Sheikh Zayed Road View"],f.view_type||"",function(v){f.view_type=v;}));
    var furnSel = el("div",{}); furnSel.appendChild(lbl("Furnished"));
    furnSel.appendChild(mkSelect(I(),["Unfurnished","Semi-Furnished","Furnished"],f.furnished||"Unfurnished",function(v){f.furnished=v;}));
    g3.appendChild(viewSel); g3.appendChild(furnSel); fm.appendChild(g3);
    var g4 = el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}});
    var cnBox = el("div",{}); cnBox.appendChild(lbl("Contact Name"));
    var cnInp = inp(I(),"Seller / Owner name","text",undefined,function(v){f.contact_name=v;}); cnInp.value=f.contact_name||""; cnBox.appendChild(cnInp); g4.appendChild(cnBox);
    var cpBox = el("div",{}); cpBox.appendChild(lbl("Contact Phone"));
    var cpInp = inp(I(),"+971...","tel",undefined,function(v){f.contact_phone=v;}); cpInp.value=f.contact_phone||""; cpBox.appendChild(cpInp); g4.appendChild(cpBox);
    fm.appendChild(g4);
    var notesBox = el("div",{style:{marginBottom:"12px"}}); notesBox.appendChild(lbl("Notes"));
    var notesInp = el("textarea",{placeholder:"Any notes about the property...",style:Object.assign({},I(),{height:"60px",resize:"vertical",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"})});
    notesInp.value = f.notes||""; notesInp.addEventListener("input",function(){f.notes=this.value;}); notesBox.appendChild(notesInp); fm.appendChild(notesBox);
    var btnRow = el("div",{style:{display:"flex",gap:"8px",justifyContent:"flex-end"}});
    btnRow.appendChild(_chBtn("Cancel","rgba(255,255,255,0.06)","#8899AA",function(){CHIEFS_STATE.invForm.open=false;render();},{border:"1px solid rgba(255,255,255,0.1)"}));
    btnRow.appendChild(_chBtn(CHIEFS_STATE.busySave?"Saving...":f.editing?"Save Changes":"Add to Inventory","#D4AF37",undefined,function(){if(!CHIEFS_STATE.busySave)chiefsSaveInventory();}));
    fm.appendChild(btnRow); wrap.appendChild(fm);
  }

  if (CHIEFS_STATE.loading.inventory) {
    wrap.appendChild(div({color:C().sub,fontSize:"12px",textAlign:"center",padding:"20px"},"Loading inventory..."));
    return wrap;
  }

  var inv = CHIEFS_STATE.inventory;
  if (!inv.length && !f.open) {
    wrap.appendChild(_chCard([div({color:cl.sub,fontSize:"12px",textAlign:"center",padding:"8px"},"No listings yet. Add your first pocket listing or import from a URL.")]));
    return wrap;
  }

  inv.forEach(function(item) {
    var expanded = CHIEFS_STATE.expandedInv === item.id;
    var card = el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"12px 14px",marginBottom:"8px"}});
    var top = el("div",{style:{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer"}});
    top.addEventListener("click",function(){CHIEFS_STATE.expandedInv=expanded?null:item.id;render();});
    var left = el("div",{style:{flex:"1",minWidth:"0"}});
    var titleRow = el("div",{style:{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap",marginBottom:"4px"}});
    titleRow.appendChild(span({color:cl.white,fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},(item.beds?item.beds+" ":"")+(item.prop_type||"")+" · "+item.area));
    titleRow.appendChild(_chBadge(item.status||"available",_statusColor(item.status)));
    if (item.purpose==="rent") titleRow.appendChild(_chBadge("RENT","#8B5CF6"));
    left.appendChild(titleRow);
    var subRow = el("div",{style:{display:"flex",gap:"12px",flexWrap:"wrap"}});
    subRow.appendChild(span({color:"#D4AF37",fontSize:"12px",fontWeight:"700"},_fmtPrice(item.price)+(item.purpose==="rent"?"/yr":"")));
    if (item.building) subRow.appendChild(span({color:cl.sub,fontSize:"11px"},item.building));
    if (item.size_sqft) subRow.appendChild(span({color:cl.muted,fontSize:"11px"},item.size_sqft+" sqft"));
    left.appendChild(subRow);
    if (item.dv_verdict) {
      var vd = el("div",{style:{marginTop:"4px"}}); vd.appendChild(_chBadge(item.dv_verdict,_verdictColor(item.dv_verdict)));
      if (item.dv_confidence) { vd.appendChild(span({color:cl.muted,fontSize:"10px",marginLeft:"6px"},item.dv_confidence+"% conf")); } left.appendChild(vd);
    }
    top.appendChild(left);
    top.appendChild(span({color:cl.muted,fontSize:"12px"},expanded?"▲":"▼"));
    card.appendChild(top);
    if (expanded) {
      var details = el("div",{style:{borderTop:"1px solid "+cl.border,marginTop:"10px",paddingTop:"10px"}});
      var drow = _chRow(_chField("Floor",item.floor_num),_chField("View",item.view_type),_chField("Furnished",item.furnished),_chField("Unit",item.unit_no));
      details.appendChild(drow);
      if (item.dv_fair_price) { var dr2=_chRow(_chField("DV Fair Price",_fmtPrice(item.dv_fair_price)),_chField("PSF",item.dv_psf?Math.round(item.dv_psf)+" AED/sqft":null)); details.appendChild(dr2); }
      if (item.contact_name||item.contact_phone) { var dr3=_chRow(_chField("Contact",item.contact_name),_chField("Phone",item.contact_phone)); details.appendChild(dr3); }
      if (item.notes) details.appendChild(div({color:cl.sub,fontSize:"11px",marginTop:"8px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},item.notes));
      var abtn = el("div",{style:{display:"flex",gap:"6px",marginTop:"10px"}});
      abtn.appendChild(_chBtn("✏️ Edit","rgba(255,255,255,0.06)","#8899AA",function(){chiefsEditInventory(item);},{border:"1px solid rgba(255,255,255,0.1)",fontSize:"11px",padding:"6px 10px"}));
      abtn.appendChild(_chBtn("🔗 Find Matches","rgba(16,185,129,0.1)","#10B981",function(){_chiefsAutoMatch();CHIEFS_STATE.view="matches";render();},{border:"1px solid rgba(16,185,129,0.2)",fontSize:"11px",padding:"6px 10px"}));
      abtn.appendChild(_chBtn("🗑️","rgba(239,68,68,0.1)","#EF4444",function(){chiefsDeleteInventory(item.id);},{border:"1px solid rgba(239,68,68,0.2)",fontSize:"11px",padding:"6px 10px"}));
      details.appendChild(abtn); card.appendChild(details);
    }
    wrap.appendChild(card);
  });
  return wrap;
}

// ── VIEW: CLIENTS ─────────────────────────────────────────────────────────────
function _renderChiefsClients() {
  var cl = C();
  var wrap = el("div",{style:{padding:"16px",maxWidth:"700px",margin:"0 auto"}});
  var f = CHIEFS_STATE.cliForm; var sc = CHIEFS_STATE.scanner;

  // Header
  var hdr = el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}});
  hdr.appendChild(div({color:cl.white,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Client Memory Bank"));
  var btnGrp = el("div",{style:{display:"flex",gap:"6px"}});
  if (!f.open && !sc.open) {
    btnGrp.appendChild(_chBtn("📱 Scan Chat","rgba(37,211,102,0.15)","#25D366",function(){CHIEFS_STATE.scanner.open=true;render();},{border:"1px solid rgba(37,211,102,0.2)",fontSize:"11px"}));
    btnGrp.appendChild(_chBtn("+ Add Client","#3B82F6","#fff",function(){CHIEFS_STATE.cliForm.open=true;CHIEFS_STATE.cliForm.editing=null;render();}));
  }
  hdr.appendChild(btnGrp); wrap.appendChild(hdr);

  // Scanner modal
  if (sc.open) {
    var scCard = _chCard(null,{background:"rgba(37,211,102,0.05)",border:"1px solid rgba(37,211,102,0.2)"});
    scCard.appendChild(div({color:"#25D366",fontSize:"11px",fontWeight:"700",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"SCAN WHATSAPP / EMAIL CONVERSATION"));
    scCard.appendChild(div({color:cl.sub,fontSize:"11px",marginBottom:"8px",fontFamily:"'Inter',sans-serif"},"Paste the conversation below. AI will extract client requirements and pre-fill the form."));
    var ta = el("textarea",{placeholder:"Paste WhatsApp or email conversation here...",style:Object.assign({},I(),{height:"120px",resize:"vertical",fontFamily:"'Inter',sans-serif",lineHeight:"1.5",marginBottom:"8px"})});
    ta.value = sc.text; ta.addEventListener("input",function(){CHIEFS_STATE.scanner.text=this.value;}); scCard.appendChild(ta);
    if (sc.error) scCard.appendChild(div({color:"#EF4444",fontSize:"11px",marginBottom:"8px"},sc.error));
    if (sc.result) {
      var res = sc.result;
      var resCard = el("div",{style:{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:"8px",padding:"10px",marginBottom:"8px"}});
      resCard.appendChild(div({color:"#10B981",fontSize:"10px",fontWeight:"700",letterSpacing:"0.1em",marginBottom:"6px"},"AI EXTRACTED REQUIREMENTS"));
      var fields=[["Client",res.client_name],["Looking for",res.beds+" "+res.prop_type+" ("+res.purpose+")"],["Areas",(res.areas||[]).join(", ")],["Budget",_fmtPrice(res.min_price)+" - "+_fmtPrice(res.max_price)],["Timeline",res.timeline],["Notes",res.notes]];
      fields.forEach(function(pair){if(pair[1]&&pair[1]!=="— - —"){resCard.appendChild(div({color:cl.sub,fontSize:"11px",marginBottom:"2px"},"• "+pair[0]+": "+span({color:cl.white},pair[1]).textContent));}});
      resCard.appendChild(div({color:cl.muted,fontSize:"10px",marginTop:"4px"},"Confidence: "+res.confidence+"%"));
      scCard.appendChild(resCard);
    }
    var scanBtnRow = el("div",{style:{display:"flex",gap:"6px"}});
    scanBtnRow.appendChild(_chBtn("Cancel","rgba(255,255,255,0.06)","#8899AA",function(){CHIEFS_STATE.scanner={open:false,text:"",parsing:false,result:null,error:null};render();},{border:"1px solid rgba(255,255,255,0.1)"}));
    if (sc.result) scanBtnRow.appendChild(_chBtn("✓ Use This Client","#10B981","#fff",function(){chiefsScannerApply();}));
    else scanBtnRow.appendChild(_chBtn(sc.parsing?"Analyzing...":"🤖 Extract Requirements","#25D366",undefined,function(){if(!sc.parsing)chiefsScanConversation();}));
    scCard.appendChild(scanBtnRow); wrap.appendChild(scCard);
  }

  // Client form
  if (f.open) {
    var fm = _chCard(null,{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)"});
    fm.appendChild(div({color:"#3B82F6",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px",letterSpacing:"0.1em"},f.editing?"EDIT CLIENT":"NEW CLIENT REQUIREMENTS"));
    var g1 = el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}});
    [[lbl("Name *"),["text","Client name",function(v){f.client_name=v;},f.client_name]],
     [lbl("Phone")  ,["tel","+971...",function(v){f.client_phone=v;},f.client_phone]],
     [lbl("Email")  ,["email","email",function(v){f.client_email=v;},f.client_email]],
     [lbl("Purpose"),null,function(v){f.purpose=v;},["sale","rent"],f.purpose],
     [lbl("Type"),null,function(v){f.prop_type=v;},["apartment","villa","townhouse"],f.prop_type],
     [lbl("Beds Wanted"),null,function(v){f.beds_wanted=v;},["Studio","1 BR","2 BR","3 BR","4 BR","5+ BR"],f.beds_wanted]
    ].forEach(function(row) {
      var cell = el("div",{}); cell.appendChild(row[0]);
      if (row[1]) { var inp2=inp(I(),"",row[1][0],undefined,row[1][2]); inp2.value=row[1][3]||""; cell.appendChild(inp2); }
      else { cell.appendChild(mkSelect(I(),row[3],row[4]||row[3][0],row[2])); }
      g1.appendChild(cell);
    });
    fm.appendChild(g1);
    // Areas wanted (tags)
    var arBox = el("div",{style:{marginBottom:"8px"}}); arBox.appendChild(lbl("Areas Wanted"));
    var arRow = el("div",{style:{display:"flex",flexWrap:"wrap",gap:"4px",marginBottom:"4px"}});
    f.areas_wanted.forEach(function(area) {
      var tag = el("span",{style:{background:"rgba(59,130,246,0.2)",border:"1px solid rgba(59,130,246,0.4)",color:"#3B82F6",borderRadius:"20px",padding:"2px 8px",fontSize:"11px",cursor:"pointer"}});
      tag.textContent = area + " ✕";
      tag.addEventListener("click",function(){f.areas_wanted=f.areas_wanted.filter(function(a){return a!==area;});render();});
      arRow.appendChild(tag);
    });
    arBox.appendChild(arRow);
    var arInpRow = el("div",{style:{display:"flex",gap:"6px"}});
    var areaNames2 = Object.keys(typeof AREAS!=="undefined"?AREAS:{}).sort();
    var arInp = mkAuto(Object.assign({},I(),{flex:"1"}),areaNames2,f.area_input||"",function(v){f.area_input=v;},"Add area...");
    var arAdd = _chBtn("Add","#3B82F6","#fff",function(){if(f.area_input&&!f.areas_wanted.includes(f.area_input)){f.areas_wanted.push(f.area_input);f.area_input="";}render();});
    arInpRow.appendChild(arInp); arInpRow.appendChild(arAdd); arBox.appendChild(arInpRow); fm.appendChild(arBox);
    var g2 = el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}});
    [["Min Budget (AED)",function(v){f.min_price=v;},f.min_price],
     ["Max Budget (AED)",function(v){f.max_price=v;},f.max_price],
     ["Min Size (sqft)",function(v){f.min_size=v;},f.min_size],
     ["Max Size (sqft)",function(v){f.max_size=v;},f.max_size]
    ].forEach(function(item) {
      var cell=el("div",{}); cell.appendChild(lbl(item[0]));
      var i2=inp(I(),"","number",undefined,item[1]); i2.value=item[2]||""; cell.appendChild(i2); g2.appendChild(cell);
    });
    fm.appendChild(g2);
    var g3 = el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}});
    var timelineSel=el("div",{}); timelineSel.appendChild(lbl("Timeline"));
    timelineSel.appendChild(mkSelect(I(),["urgent","short","medium","flexible"],f.timeline||"flexible",function(v){f.timeline=v;})); g3.appendChild(timelineSel);
    var statusSel=el("div",{}); statusSel.appendChild(lbl("Status"));
    statusSel.appendChild(mkSelect(I(),["active","paused","matched","closed"],f.status||"active",function(v){f.status=v;})); g3.appendChild(statusSel);
    fm.appendChild(g3);
    var notesBox=el("div",{style:{marginBottom:"12px"}}); notesBox.appendChild(lbl("Notes / Requirements"));
    var notesInp=el("textarea",{placeholder:"Any specific requirements, preferences, or notes...",style:Object.assign({},I(),{height:"60px",resize:"vertical",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"})});
    notesInp.value=f.notes||""; notesInp.addEventListener("input",function(){f.notes=this.value;}); notesBox.appendChild(notesInp); fm.appendChild(notesBox);
    var btnRow=el("div",{style:{display:"flex",gap:"8px",justifyContent:"flex-end"}});
    btnRow.appendChild(_chBtn("Cancel","rgba(255,255,255,0.06)","#8899AA",function(){CHIEFS_STATE.cliForm.open=false;render();},{border:"1px solid rgba(255,255,255,0.1)"}));
    btnRow.appendChild(_chBtn(CHIEFS_STATE.busySave?"Saving...":f.editing?"Save Changes":"Save Client","#3B82F6","#fff",function(){if(!CHIEFS_STATE.busySave)chiefsSaveClient();}));
    fm.appendChild(btnRow); wrap.appendChild(fm);
  }

  if (CHIEFS_STATE.loading.clients) {
    wrap.appendChild(div({color:cl.sub,fontSize:"12px",textAlign:"center",padding:"20px"},"Loading clients...")); return wrap;
  }

  var clients = CHIEFS_STATE.clients;
  if (!clients.length && !f.open && !sc.open) {
    wrap.appendChild(_chCard([div({color:cl.sub,fontSize:"12px",textAlign:"center",padding:"8px"},"No clients saved. Add a client manually or scan a WhatsApp conversation.")])); return wrap;
  }

  clients.forEach(function(item) {
    var expanded = CHIEFS_STATE.expandedCli === item.id;
    var areas = Array.isArray(item.areas_wanted) ? item.areas_wanted : [];
    var tlColor = {urgent:"#EF4444",short:"#F59E0B",medium:"#3B82F6",flexible:"#10B981"}[item.timeline]||"#6B7A9E";
    var card = el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"12px 14px",marginBottom:"8px"}});
    var top = el("div",{style:{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer"}});
    top.addEventListener("click",function(){CHIEFS_STATE.expandedCli=expanded?null:item.id;render();});
    var av = el("div",{style:{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(59,130,246,0.15)",border:"2px solid rgba(59,130,246,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:"0"}});
    av.appendChild(span({color:"#3B82F6",fontSize:"14px",fontWeight:"700"},item.client_name.charAt(0).toUpperCase()));
    top.appendChild(av);
    var left = el("div",{style:{flex:"1",minWidth:"0"}});
    var tRow = el("div",{style:{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap",marginBottom:"2px"}});
    tRow.appendChild(span({color:cl.white,fontSize:"13px",fontWeight:"600"},item.client_name));
    tRow.appendChild(_chBadge(item.timeline||"flexible",tlColor));
    if (item.status!=="active") tRow.appendChild(_chBadge(item.status,"#6B7A9E"));
    if (item.source==="whatsapp") tRow.appendChild(_chBadge("WhatsApp","#25D366"));
    left.appendChild(tRow);
    var sRow = el("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}});
    if (item.beds_wanted) sRow.appendChild(span({color:cl.sub,fontSize:"11px"},item.beds_wanted+" "+item.prop_type));
    if (areas.length) sRow.appendChild(span({color:cl.sub,fontSize:"11px"},areas.slice(0,2).join(", ")+(areas.length>2?" +more":"")));
    if (item.max_price) sRow.appendChild(span({color:"#D4AF37",fontSize:"11px","fontWeight":"600"},"≤ "+_fmtPrice(item.max_price)));
    left.appendChild(sRow);
    top.appendChild(left);
    var matchCount = CHIEFS_STATE.matches.filter(function(m){return m.client_id===item.id&&(m.status==="new"||m.status==="draft_ready");}).length;
    if (matchCount>0) top.appendChild(_chBadge(matchCount+" match"+(matchCount>1?"es":""),"#10B981"));
    top.appendChild(span({color:cl.muted,fontSize:"12px"},expanded?"▲":"▼"));
    card.appendChild(top);
    if (expanded) {
      var det = el("div",{style:{borderTop:"1px solid "+cl.border,marginTop:"10px",paddingTop:"10px"}});
      var dr1 = _chRow(_chField("Purpose",item.purpose),_chField("Type",item.prop_type),_chField("Phone",item.client_phone),_chField("Email",item.client_email));
      det.appendChild(dr1);
      if (item.min_price||item.max_price) det.appendChild(_chRow(_chField("Min Budget",_fmtPrice(item.min_price)),_chField("Max Budget",_fmtPrice(item.max_price)),_chField("Min Size",item.min_size?item.min_size+" sqft":null),_chField("Max Size",item.max_size?item.max_size+" sqft":null)));
      if (areas.length>0) { var arTags=el("div",{style:{marginTop:"8px"}}); arTags.appendChild(div({color:cl.muted,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"4px"},"Preferred Areas")); var tags=el("div",{style:{display:"flex",flexWrap:"wrap",gap:"4px"}}); areas.forEach(function(a){tags.appendChild(_chBadge(a,"#3B82F6"));}); arTags.appendChild(tags); det.appendChild(arTags); }
      if (item.notes) det.appendChild(div({color:cl.sub,fontSize:"11px",marginTop:"8px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},item.notes));
      var abtn=el("div",{style:{display:"flex",gap:"6px",marginTop:"10px",flexWrap:"wrap"}});
      abtn.appendChild(_chBtn("✏️ Edit","rgba(255,255,255,0.06)","#8899AA",function(){chiefsEditClient(item);},{border:"1px solid rgba(255,255,255,0.1)",fontSize:"11px",padding:"6px 10px"}));
      abtn.appendChild(_chBtn("🔗 Find Matches","rgba(16,185,129,0.1)","#10B981",function(){_chiefsAutoMatch();CHIEFS_STATE.view="matches";render();},{border:"1px solid rgba(16,185,129,0.2)",fontSize:"11px",padding:"6px 10px"}));
      if (item.client_phone) abtn.appendChild(_chBtn("💬 WhatsApp","rgba(37,211,102,0.1)","#25D366",function(){var p=item.client_phone.replace(/[^0-9+]/g,"");window.open("https://wa.me/"+p,"_blank","noopener,noreferrer");},{border:"1px solid rgba(37,211,102,0.2)",fontSize:"11px",padding:"6px 10px"}));
      abtn.appendChild(_chBtn("🗑️","rgba(239,68,68,0.1)","#EF4444",function(){chiefsDeleteClient(item.id);},{border:"1px solid rgba(239,68,68,0.2)",fontSize:"11px",padding:"6px 10px"}));
      det.appendChild(abtn); card.appendChild(det);
    }
    wrap.appendChild(card);
  });
  return wrap;
}

// ── VIEW: MATCHES ─────────────────────────────────────────────────────────────
function _renderChiefsMatches() {
  var cl = C();
  var wrap = el("div",{style:{padding:"16px",maxWidth:"700px",margin:"0 auto"}});
  var flt = CHIEFS_STATE.matchFilter;

  var hdr = el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}});
  hdr.appendChild(div({color:cl.white,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Auto-Matched Pairs"));
  var autoBtn = _chBtn(CHIEFS_STATE.autoMatchRunning?"Matching...":"↻ Re-Match","rgba(16,185,129,0.15)","#10B981",function(){if(!CHIEFS_STATE.autoMatchRunning)_chiefsAutoMatch();},{border:"1px solid rgba(16,185,129,0.2)",fontSize:"11px"});
  hdr.appendChild(autoBtn); wrap.appendChild(hdr);

  // Filter tabs
  var ftabs = el("div",{style:{display:"flex",gap:"6px",marginBottom:"14px",flexWrap:"wrap"}});
  [{id:"pending",label:"Pending"},{id:"approved",label:"Approved"},{id:"all",label:"All"}].forEach(function(t) {
    var b = el("button",{style:{background:flt===t.id?"rgba(16,185,129,0.2)":"transparent",
      border:"1px solid "+(flt===t.id?"rgba(16,185,129,0.5)":"rgba(255,255,255,0.1)"),
      color:flt===t.id?"#10B981":cl.sub,borderRadius:"20px",padding:"4px 12px",
      fontSize:"11px",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
    b.textContent = t.label; b.addEventListener("click",function(){CHIEFS_STATE.matchFilter=t.id;render();}); ftabs.appendChild(b);
  });
  wrap.appendChild(ftabs);

  if (CHIEFS_STATE.loading.matches) {
    wrap.appendChild(div({color:cl.sub,fontSize:"12px",textAlign:"center",padding:"20px"},"Loading matches...")); return wrap;
  }

  var matches = CHIEFS_STATE.matches.filter(function(m) {
    if (flt==="pending") return m.status==="new"||m.status==="draft_ready";
    if (flt==="approved") return m.status==="approved"||m.status==="sent";
    return m.status!=="dismissed";
  });

  if (!matches.length) {
    wrap.appendChild(_chCard([
      div({color:cl.sub,fontSize:"12px",textAlign:"center",padding:"8px"},flt==="pending"?"No pending matches. Add listings and clients, then click Re-Match.":"No matches found.")
    ]));
    return wrap;
  }

  matches.forEach(function(match) {
    var client = CHIEFS_STATE.clients.find(function(c){return c.id===match.client_id;});
    var listing = CHIEFS_STATE.inventory.find(function(l){return l.id===match.inventory_id;});
    if (!client||!listing) return;
    var expanded = CHIEFS_STATE.expandedMatch === match.id;
    var isDrafting = CHIEFS_STATE.matchDrafting[match.id];
    var sc = match.match_score || 0;
    var scColor = sc>=80?"#10B981":sc>=60?"#F59E0B":"#6B7A9E";
    var card = el("div",{style:{background:cl.surface,border:"1px solid "+(match.status==="draft_ready"?"rgba(16,185,129,0.3)":cl.border),borderRadius:"12px",padding:"12px 14px",marginBottom:"10px"}});

    // Match header
    var mhdr = el("div",{style:{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",marginBottom:"8px"}});
    mhdr.addEventListener("click",function(){CHIEFS_STATE.expandedMatch=expanded?null:match.id;render();});
    var scoreRing = el("div",{style:{width:"42px",height:"42px",borderRadius:"50%",background:scColor+"22",border:"2px solid "+scColor,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:"0"}});
    scoreRing.appendChild(span({color:scColor,fontSize:"12px",fontWeight:"800"},Math.round(sc)+"%"));
    mhdr.appendChild(scoreRing);
    var minfo = el("div",{style:{flex:"1",minWidth:"0"}});
    minfo.appendChild(div({color:cl.white,fontSize:"13px",fontWeight:"600",fontFamily:"'Inter',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},client.client_name+" → "+listing.area+(listing.building?" · "+listing.building:"")));
    minfo.appendChild(div({color:cl.sub,fontSize:"11px",marginTop:"2px"},_fmtPrice(listing.price)+(listing.purpose==="rent"?"/yr":"")+(listing.beds?" · "+listing.beds:"")+" · "+_timeAgo(match.created_at)));
    mhdr.appendChild(minfo);
    var statusBadge = {new:"new",draft_ready:"draft ready",approved:"approved",sent:"sent",dismissed:"dismissed"}[match.status]||match.status;
    var statusColor = {new:"#6B7A9E",draft_ready:"#10B981",approved:"#D4AF37",sent:"#3B82F6",dismissed:"#EF4444"}[match.status]||"#6B7A9E";
    mhdr.appendChild(_chBadge(statusBadge,statusColor));
    mhdr.appendChild(span({color:cl.muted,fontSize:"12px"},expanded?"▲":"▼"));
    card.appendChild(mhdr);

    // Match reasons
    if (match.match_reasons && match.match_reasons.length) {
      var reasons = el("div",{style:{display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"8px"}});
      match.match_reasons.forEach(function(r){ reasons.appendChild(_chBadge(r,"#6B7A9E")); });
      card.appendChild(reasons);
    }

    // Draft message
    if (match.draft_message) {
      var dmBox = el("div",{style:{background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:"8px",padding:"10px",marginBottom:"8px"}});
      dmBox.appendChild(div({color:"#10B981",fontSize:"9px",fontWeight:"700",letterSpacing:"0.1em",marginBottom:"6px"},"AI DRAFTED MESSAGE"));
      var dmText = el("textarea",{style:Object.assign({},I(),{height:"80px",resize:"vertical",fontFamily:"'Inter',sans-serif",lineHeight:"1.5",fontSize:"12px"})});
      dmText.value = match.draft_message;
      dmText.addEventListener("input",function(){
        var m2 = CHIEFS_STATE.matches.find(function(x){return x.id===match.id;});
        if (m2) m2.draft_message = this.value;
      });
      dmBox.appendChild(dmText); card.appendChild(dmBox);
    }

    // Action buttons
    var abtn = el("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap"}});
    if (match.status==="new") {
      abtn.appendChild(_chBtn(isDrafting?"Drafting...":"🤖 Draft Message","rgba(16,185,129,0.15)","#10B981",function(){if(!isDrafting)chiefsDraftMessage(match.id);},{border:"1px solid rgba(16,185,129,0.2)",fontSize:"11px"}));
    }
    if (match.draft_message && match.status!=="approved" && match.status!=="sent") {
      abtn.appendChild(_chBtn("📋 Copy & Approve","rgba(212,175,55,0.15)","#D4AF37",function(){chiefsApproveMatch(match.id);},{border:"1px solid rgba(212,175,55,0.2)",fontSize:"11px"}));
      if (client.client_phone) abtn.appendChild(_chBtn("💬 Send via WhatsApp","rgba(37,211,102,0.15)","#25D366",function(){chiefsWhatsApp(match.id);},{border:"1px solid rgba(37,211,102,0.2)",fontSize:"11px"}));
    }
    if (match.status==="new"||match.status==="draft_ready") abtn.appendChild(_chBtn("Dismiss","rgba(255,255,255,0.04)","#6B7A9E",function(){chiefsDismissMatch(match.id);},{border:"1px solid rgba(255,255,255,0.08)",fontSize:"11px"}));
    card.appendChild(abtn);

    // Expanded details
    if (expanded) {
      var det = el("div",{style:{borderTop:"1px solid "+cl.border,marginTop:"10px",paddingTop:"10px"}});
      det.appendChild(div({color:cl.sub,fontSize:"10px",fontWeight:"700",letterSpacing:"0.1em",marginBottom:"6px"},"CLIENT REQUIREMENTS"));
      det.appendChild(_chRow(_chField("Client",client.client_name),_chField("Phone",client.client_phone),_chField("Purpose",client.purpose),_chField("Beds",client.beds_wanted)));
      var careas=Array.isArray(client.areas_wanted)?client.areas_wanted.join(", "):client.areas_wanted||"—";
      det.appendChild(_chRow(_chField("Areas",careas),_chField("Budget","≤"+_fmtPrice(client.max_price)),_chField("Timeline",client.timeline)));
      det.appendChild(div({color:cl.sub,fontSize:"10px",fontWeight:"700",letterSpacing:"0.1em",margin:"10px 0 6px"},"LISTING DETAILS"));
      det.appendChild(_chRow(_chField("Area",listing.area),_chField("Building",listing.building),_chField("Floor",listing.floor_num),_chField("View",listing.view_type)));
      det.appendChild(_chRow(_chField("Size",listing.size_sqft?listing.size_sqft+" sqft":null),_chField("Furnished",listing.furnished),_chField("DV Verdict",listing.dv_verdict)));
      card.appendChild(det);
    }
    wrap.appendChild(card);
  });
  return wrap;
}

// ── VIEW: PIPELINE ────────────────────────────────────────────────────────────
function _renderChiefsPipeline() {
  var cl = C();
  var wrap = el("div",{style:{padding:"16px",maxWidth:"700px",margin:"0 auto"}});
  var f = CHIEFS_STATE.pipeForm;
  var STAGES = [{id:"lead",label:"Lead"},{id:"viewing",label:"Viewing"},{id:"offer",label:"Offer"},{id:"mou",label:"MOU"},{id:"docs",label:"Docs"},{id:"closing",label:"Closing"},{id:"closed",label:"Closed"},{id:"lost",label:"Lost"}];

  // Header
  var hdr = el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}});
  hdr.appendChild(div({color:cl.white,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Deal Pipeline"));
  if (!f.open) hdr.appendChild(_chBtn("+ Add Deal","#8B5CF6","#fff",function(){CHIEFS_STATE.pipeForm.open=true;CHIEFS_STATE.pipeForm.editing=null;render();}));
  wrap.appendChild(hdr);

  // Pipeline stats
  var pipe = CHIEFS_STATE.pipeline;
  var activeDeals = pipe.filter(function(p){return p.stage!=="closed"&&p.stage!=="lost";});
  var totalValue = activeDeals.reduce(function(s,p){return s+(Number(p.deal_value)||0);},0);
  var totalComm = activeDeals.reduce(function(s,p){return s+(Number(p.commission_est)||0);},0);
  if (pipe.length > 0) {
    var stats = el("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"14px"}});
    [{label:"Active Deals",val:activeDeals.length+"",color:"#8B5CF6"},
     {label:"Total Value",val:totalValue>0?_fmtPrice(totalValue):"—",color:"#D4AF37"},
     {label:"Est. Commission",val:totalComm>0?_fmtPrice(totalComm):"—",color:"#10B981"}
    ].forEach(function(s) {
      var sc = el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",padding:"10px",textAlign:"center"}});
      sc.appendChild(div({color:s.color,fontSize:"16px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},s.val));
      sc.appendChild(div({color:cl.muted,fontSize:"10px",marginTop:"2px"},s.label)); stats.appendChild(sc);
    });
    wrap.appendChild(stats);
  }

  // Add deal form
  if (f.open) {
    var fm = _chCard(null,{background:"rgba(139,92,246,0.06)",border:"1px solid rgba(139,92,246,0.2)"});
    fm.appendChild(div({color:"#8B5CF6",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px",letterSpacing:"0.1em"},f.editing?"EDIT DEAL":"NEW DEAL"));
    var g1=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}});
    var cnCell=el("div",{}); cnCell.appendChild(lbl("Client Name *"));
    var cnInp=inp(I(),"Client name","text",undefined,function(v){f.client_name=v;}); cnInp.value=f.client_name||""; cnCell.appendChild(cnInp); g1.appendChild(cnCell);
    var stCell=el("div",{}); stCell.appendChild(lbl("Stage"));
    stCell.appendChild(mkSelect(I(),STAGES.map(function(s){return s.id;}),f.stage||"lead",function(v){f.stage=v;})); g1.appendChild(stCell);
    fm.appendChild(g1);
    var pdCell=el("div",{style:{marginBottom:"8px"}}); pdCell.appendChild(lbl("Property Description"));
    var pdInp=inp(I(),"e.g. 2BR in Marina, Tower name","text",undefined,function(v){f.property_desc=v;}); pdInp.value=f.property_desc||""; pdCell.appendChild(pdInp); fm.appendChild(pdCell);
    var g2=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}});
    var dvCell=el("div",{}); dvCell.appendChild(lbl("Deal Value (AED)"));
    var dvInp=inp(I(),"","number",undefined,function(v){f.deal_value=v;}); dvInp.value=f.deal_value||""; dvCell.appendChild(dvInp); g2.appendChild(dvCell);
    var naCell=el("div",{}); naCell.appendChild(lbl("Next Action"));
    var naInp=inp(I(),"e.g. Schedule viewing","text",undefined,function(v){f.next_action=v;}); naInp.value=f.next_action||""; naCell.appendChild(naInp); g2.appendChild(naCell);
    var ndCell=el("div",{style:{marginBottom:"8px"}}); ndCell.appendChild(lbl("Next Action Date"));
    var ndInp=el("input",{type:"date",style:I()}); ndInp.value=f.next_action_date||""; ndInp.addEventListener("input",function(){f.next_action_date=this.value;}); ndCell.appendChild(ndInp); fm.appendChild(g2); fm.appendChild(ndCell);
    var ntCell=el("div",{style:{marginBottom:"12px"}}); ntCell.appendChild(lbl("Notes"));
    var ntInp=el("textarea",{placeholder:"Notes, issues, next steps...",style:Object.assign({},I(),{height:"60px",resize:"vertical",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"})});
    ntInp.value=f.notes||""; ntInp.addEventListener("input",function(){f.notes=this.value;}); ntCell.appendChild(ntInp); fm.appendChild(ntCell);
    var btnRow=el("div",{style:{display:"flex",gap:"8px",justifyContent:"flex-end"}});
    btnRow.appendChild(_chBtn("Cancel","rgba(255,255,255,0.06)","#8899AA",function(){CHIEFS_STATE.pipeForm.open=false;render();},{border:"1px solid rgba(255,255,255,0.1)"}));
    btnRow.appendChild(_chBtn(CHIEFS_STATE.busySave?"Saving...":f.editing?"Save Changes":"Add to Pipeline","#8B5CF6","#fff",function(){if(!CHIEFS_STATE.busySave)chiefsSavePipeline();}));
    fm.appendChild(btnRow); wrap.appendChild(fm);
  }

  if (CHIEFS_STATE.loading.pipeline) {
    wrap.appendChild(div({color:cl.sub,fontSize:"12px",textAlign:"center",padding:"20px"},"Loading pipeline...")); return wrap;
  }
  if (!pipe.length&&!f.open) {
    wrap.appendChild(_chCard([div({color:cl.sub,fontSize:"12px",textAlign:"center",padding:"8px"},"No deals in pipeline yet. Add your first deal to start tracking.")])); return wrap;
  }

  // Group by stage
  STAGES.forEach(function(stg) {
    var items = pipe.filter(function(p){return p.stage===stg.id;});
    if (!items.length) return;
    var stgHdr = el("div",{style:{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px",marginTop:"4px"}});
    var dot = el("div",{style:{width:"10px",height:"10px",borderRadius:"50%",background:_stageColor(stg.id),flexShrink:"0"}});
    stgHdr.appendChild(dot);
    stgHdr.appendChild(div({color:_stageColor(stg.id),fontSize:"10px",fontWeight:"700",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace"},stg.label+" ("+items.length+")"));
    wrap.appendChild(stgHdr);
    items.forEach(function(deal) {
      var expanded = CHIEFS_STATE.expandedPipe === deal.id;
      var card = el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderLeft:"3px solid "+_stageColor(deal.stage),borderRadius:"10px",padding:"10px 12px",marginBottom:"8px"}});
      var top = el("div",{style:{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer"}});
      top.addEventListener("click",function(){CHIEFS_STATE.expandedPipe=expanded?null:deal.id;render();});
      var info = el("div",{style:{flex:"1",minWidth:"0"}});
      info.appendChild(div({color:cl.white,fontSize:"12px",fontWeight:"600"},deal.client_name));
      if (deal.property_desc) info.appendChild(div({color:cl.sub,fontSize:"11px",marginTop:"1px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},deal.property_desc));
      top.appendChild(info);
      if (deal.deal_value) top.appendChild(div({color:"#D4AF37",fontSize:"11px",fontWeight:"700",flexShrink:"0"},_fmtPrice(deal.deal_value)));
      top.appendChild(span({color:cl.muted,fontSize:"12px"},expanded?"▲":"▼"));
      card.appendChild(top);
      if (deal.next_action) {
        var na = el("div",{style:{display:"flex",alignItems:"center",gap:"6px",marginTop:"6px"}});
        na.appendChild(span({color:cl.muted,fontSize:"11px"},"→ "+deal.next_action));
        if (deal.next_action_date) na.appendChild(_chBadge(deal.next_action_date,"#F59E0B"));
        card.appendChild(na);
      }
      if (expanded) {
        var det = el("div",{style:{borderTop:"1px solid "+cl.border,marginTop:"8px",paddingTop:"8px"}});
        if (deal.notes) det.appendChild(div({color:cl.sub,fontSize:"11px",lineHeight:"1.5",marginBottom:"8px",fontFamily:"'Inter',sans-serif"},deal.notes));
        if (deal.commission_est) det.appendChild(_chRow(_chField("Deal Value",_fmtPrice(deal.deal_value)),_chField("Est. Commission",_fmtPrice(deal.commission_est))));
        // Stage mover
        var stgRow = el("div",{style:{marginTop:"10px"}}); stgRow.appendChild(div({color:cl.muted,fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"6px"},"Move Stage"));
        var stgBtns = el("div",{style:{display:"flex",flexWrap:"wrap",gap:"4px"}});
        var activeStages = [{id:"lead",label:"Lead"},{id:"viewing",label:"Viewing"},{id:"offer",label:"Offer"},{id:"mou",label:"MOU"},{id:"closing",label:"Closing"},{id:"closed",label:"Closed"},{id:"lost",label:"Lost"}];
        activeStages.forEach(function(s) {
          var isActive = deal.stage===s.id;
          var b = el("button",{style:{background:isActive?_stageColor(s.id)+"33":"transparent",border:"1px solid "+(isActive?_stageColor(s.id)+"66":"rgba(255,255,255,0.1)"),color:isActive?_stageColor(s.id):cl.muted,borderRadius:"6px",padding:"3px 8px",fontSize:"10px",cursor:"pointer"}});
          b.textContent = s.label; if (!isActive) b.addEventListener("click",function(){chiefsMoveStage(deal.id,s.id);}); stgBtns.appendChild(b);
        });
        stgRow.appendChild(stgBtns); det.appendChild(stgRow);
        var abtn=el("div",{style:{display:"flex",gap:"6px",marginTop:"10px"}});
        abtn.appendChild(_chBtn("✏️ Edit","rgba(255,255,255,0.06)","#8899AA",function(){CHIEFS_STATE.pipeForm={open:true,editing:deal.id,client_name:deal.client_name||"",property_desc:deal.property_desc||"",stage:deal.stage||"lead",deal_value:deal.deal_value||"",next_action:deal.next_action||"",next_action_date:deal.next_action_date||"",notes:deal.notes||""};render();},{border:"1px solid rgba(255,255,255,0.1)",fontSize:"11px",padding:"6px 10px"}));
        abtn.appendChild(_chBtn("🗑️","rgba(239,68,68,0.1)","#EF4444",function(){chiefsDeletePipeline(deal.id);},{border:"1px solid rgba(239,68,68,0.2)",fontSize:"11px",padding:"6px 10px"}));
        det.appendChild(abtn); card.appendChild(det);
      }
      wrap.appendChild(card);
    });
  });
  return wrap;
}

// ── MAIN RENDER ───────────────────────────────────────────────────────────────
function renderChiefs() {
  // Init: load data if not yet loaded
  if (!CHIEFS_STATE.loaded.inventory && !CHIEFS_STATE.loading.inventory) chiefsLoadInventory();
  if (!CHIEFS_STATE.loaded.clients && !CHIEFS_STATE.loading.clients) chiefsLoadClients();
  if (!CHIEFS_STATE.loaded.matches && !CHIEFS_STATE.loading.matches) chiefsLoadMatches();
  if (!CHIEFS_STATE.loaded.pipeline && !CHIEFS_STATE.loading.pipeline) chiefsLoadPipeline();

  var cl = C();
  var wrap = el("div",{style:{display:"flex",flexDirection:"column",height:"100%",maxWidth:"100%",overflowX:"hidden"}});

  // Internal view tabs
  var VIEWS = [
    {id:"dashboard",label:"Dashboard",icon:"⌂"},
    {id:"inventory",label:"Inventory",icon:"📦"},
    {id:"clients",label:"Clients",icon:"👥"},
    {id:"matches",label:"Matches",icon:"🔗"},
    {id:"pipeline",label:"Pipeline",icon:"📋"}
  ];
  var tabBar = el("div",{style:{display:"flex",gap:"0",borderBottom:"1px solid "+cl.border,overflowX:"auto",flexShrink:"0",WebkitOverflowScrolling:"touch"}});
  VIEWS.forEach(function(v) {
    var isActive = CHIEFS_STATE.view === v.id;
    var pendingBadge = v.id==="matches" ? CHIEFS_STATE.matches.filter(function(m){return m.status==="new"||m.status==="draft_ready";}).length : 0;
    var t = el("button",{style:{background:isActive?"rgba(212,175,55,0.1)":"transparent",
      borderBottom:"2px solid "+(isActive?"#D4AF37":"transparent"),
      border:"none",color:isActive?"#D4AF37":cl.sub,padding:"10px 14px",
      fontSize:"12px",cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Space Grotesk',monospace",
      fontWeight:isActive?"700":"400",position:"relative",transition:"all 0.2s"}});
    t.textContent = v.icon + " " + v.label;
    if (pendingBadge > 0) {
      var badge = el("span",{style:{background:"#10B981",color:"#fff",borderRadius:"10px",
        padding:"1px 5px",fontSize:"9px",fontWeight:"700",marginLeft:"4px"}});
      badge.textContent = pendingBadge; t.appendChild(badge);
    }
    t.addEventListener("click",function(){CHIEFS_STATE.view=v.id;render();}); tabBar.appendChild(t);
  });
  wrap.appendChild(tabBar);

  // Content
  var content = el("div",{style:{flex:"1",overflow:"auto",width:"100%",boxSizing:"border-box",overflowX:"hidden"}});
  if (CHIEFS_STATE.view==="dashboard") content.appendChild(_renderChiefsDashboard());
  else if (CHIEFS_STATE.view==="inventory") content.appendChild(_renderChiefsInventory());
  else if (CHIEFS_STATE.view==="clients") content.appendChild(_renderChiefsClients());
  else if (CHIEFS_STATE.view==="matches") content.appendChild(_renderChiefsMatches());
  else if (CHIEFS_STATE.view==="pipeline") content.appendChild(_renderChiefsPipeline());
  wrap.appendChild(content);
  return wrap;
}
