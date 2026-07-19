// Copyright (c) 2026 Mohammad Akbar Momenian. All Rights Reserved.
// AI Chief of Staff — isolated agent workspace
// Globals used: SUPABASE_URL, SUPABASE_KEY, el(), div(), span(), C(), DV_AUTH,
//               AREAS, DB, computeValuation, askAI, callGroqRaw, USER_PROFILE

// ── STATE ─────────────────────────────────────────────────────────────────────
var CHIEFS_STATE = {
  view: "dashboard",
  inventory: [], clients: [], matches: [], pipeline: [],
  loading: {}, loaded: {}, dbError: false,
  invForm: { open: false, editing: null, source: "pocket", building: "", area: "", unit_no: "",
    prop_type: "apartment", beds: "2 BR", size_sqft: "", floor_num: "", view_type: "",
    furnished: "Unfurnished", purpose: "sale", price: "", status: "available",
    notes: "", contact_name: "", contact_phone: "" },
  cliForm: { open: false, editing: null, client_name: "", client_phone: "", client_email: "",
    purpose: "sale", prop_type: "apartment", beds_wanted: "2 BR", areas_wanted: [],
    area_input: "", min_price: "", max_price: "", min_size: "", max_size: "",
    view_pref: "", furnished_pref: "", timeline: "flexible", notes: "", status: "active",
    source: "manual", raw_conversation: "", ad_referral: null },
  scanner: { open: false, text: "", parsing: false, result: null, error: null, source: "whatsapp", transcribing: false, transcribeError: null },
  invScanner: { open: false, text: "", parsing: false, result: null, error: null },
  pipeForm: { open: false, editing: null, client_name: "", property_desc: "", stage: "lead",
    deal_value: "", next_action: "", next_action_date: "", notes: "" },
  matchDrafting: {}, busySave: false, autoMatchRunning: false,
  expandedInv: null, expandedCli: null, expandedMatch: null, expandedPipe: null,
  matchFilter: "pending",   // pending | approved | all
  briefing: { loading: false, text: null, generatedAt: null, error: null, checked: false }
};

// ── AUTOMATION SETTINGS (2026-07-17, standing product directive) ────────────
// Per the user's explicit design requirement: this tab should feel like a
// hired assistant, not a tool the agent babysits. Every automatable process
// gets exactly one toggle — "automatic" (AI does it and acts on its own) or
// "requires approval" (AI prepares it, one click executes it — never a
// multi-step manual workflow). Default is ON (automatic) everywhere; the
// agent opts INTO a human checkpoint, not the other way around. Persisted
// locally per-browser for now (see CLAUDE.md for the cross-device/Supabase
// follow-up note).
var CHIEFS_AUTOMATION_DEFAULTS = { autoDraft: true, autoSend: true, autoSaveExtracted: true, autoReportConversions: true };
var CHIEFS_AUTOMATION = (function() {
  try {
    var saved = JSON.parse(localStorage.getItem("dv_chiefs_automation") || "null");
    if (saved) return Object.assign({}, CHIEFS_AUTOMATION_DEFAULTS, saved);
  } catch (e) {}
  return Object.assign({}, CHIEFS_AUTOMATION_DEFAULTS);
})();
function _chiefsSaveAutomation() {
  try { localStorage.setItem("dv_chiefs_automation", JSON.stringify(CHIEFS_AUTOMATION)); } catch (e) {}
}

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
  // Note: #8B5CF6 is reserved app-wide for rental-mode UI, so "mou" (a deal
  // stage, unrelated to rentals) uses teal instead of purple here.
  return { lead:"#6B7A9E", viewing:"#3B82F6", offer:"#F59E0B", mou:"#14B8A6",
           docs:"#EC4899", closing:"#10B981", closed:"#D4AF37", lost:"#EF4444" }[stage] || "#6B7A9E";
}
function _statusColor(s) {
  return { available:"#10B981", under_offer:"#F59E0B", sold:"#6B7A9E", rented:"#6B7A9E",
           expired:"#EF4444", pocket:"#14B8A6" }[s] || "#6B7A9E";
}
function _verdictColor(v) {
  if (!v) return "#6B7A9E";
  if (v.toLowerCase().includes("good") || v.toLowerCase().includes("under")) return "#10B981";
  if (v.toLowerCase().includes("over") || v.toLowerCase().includes("high")) return "#EF4444";
  return "#F59E0B";
}

// ── DATA FETCHING ─────────────────────────────────────────────────────────────
async function chiefsLoadInventory() {
  if (CHIEFS_STATE.loading.inventory || CHIEFS_STATE.loaded.inventory) return;
  CHIEFS_STATE.loading.inventory = true;
  try {
    var r = await fetch(SUPABASE_URL + "/rest/v1/chiefs_inventory?agent_id=eq." +
      encodeURIComponent(_chiefsId()) + "&order=created_at.desc&limit=200", { headers: _chiefsH() });
    if (r.ok) CHIEFS_STATE.inventory = await r.json();
    else { CHIEFS_STATE.inventory = []; CHIEFS_STATE.dbError = true; }
  } catch(e) { CHIEFS_STATE.inventory = []; }
  CHIEFS_STATE.loading.inventory = false;
  CHIEFS_STATE.loaded.inventory = true;
  render();
}

async function chiefsLoadClients() {
  if (CHIEFS_STATE.loading.clients || CHIEFS_STATE.loaded.clients) return;
  CHIEFS_STATE.loading.clients = true;
  try {
    var r = await fetch(SUPABASE_URL + "/rest/v1/chiefs_clients?agent_id=eq." +
      encodeURIComponent(_chiefsId()) + "&order=created_at.desc&limit=200", { headers: _chiefsH() });
    if (r.ok) CHIEFS_STATE.clients = await r.json();
    else CHIEFS_STATE.clients = [];
  } catch(e) { CHIEFS_STATE.clients = []; }
  CHIEFS_STATE.loading.clients = false;
  CHIEFS_STATE.loaded.clients = true;
  render();
}

async function chiefsLoadMatches() {
  if (CHIEFS_STATE.loading.matches || CHIEFS_STATE.loaded.matches) return;
  CHIEFS_STATE.loading.matches = true;
  try {
    var r = await fetch(SUPABASE_URL + "/rest/v1/chiefs_matches?agent_id=eq." +
      encodeURIComponent(_chiefsId()) + "&order=created_at.desc&limit=200", { headers: _chiefsH() });
    if (r.ok) CHIEFS_STATE.matches = await r.json();
    else CHIEFS_STATE.matches = [];
  } catch(e) { CHIEFS_STATE.matches = []; }
  CHIEFS_STATE.loading.matches = false;
  CHIEFS_STATE.loaded.matches = true;
  render();
}

async function chiefsLoadPipeline() {
  if (CHIEFS_STATE.loading.pipeline || CHIEFS_STATE.loaded.pipeline) return;
  CHIEFS_STATE.loading.pipeline = true;
  try {
    var r = await fetch(SUPABASE_URL + "/rest/v1/chiefs_pipeline?agent_id=eq." +
      encodeURIComponent(_chiefsId()) + "&order=updated_at.desc&limit=200", { headers: _chiefsH() });
    if (r.ok) CHIEFS_STATE.pipeline = await r.json();
    else CHIEFS_STATE.pipeline = [];
  } catch(e) { CHIEFS_STATE.pipeline = []; }
  CHIEFS_STATE.loading.pipeline = false;
  CHIEFS_STATE.loaded.pipeline = true;
  render();
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
    var respData = await r.json();
    if (!r.ok) { throw new Error((respData && respData.message) || "Save failed"); }
    var savedId = f.editing || (Array.isArray(respData) && respData[0] && respData[0].id);
    var wasNew = !f.editing;
    CHIEFS_STATE.invForm = { open:false, editing:null, source:"pocket", building:"", area:"", unit_no:"",
      prop_type:"apartment", beds:"2 BR", size_sqft:"", floor_num:"", view_type:"",
      furnished:"Unfurnished", purpose:"sale", price:"", status:"available", notes:"", contact_name:"", contact_phone:"" };
    CHIEFS_STATE.loaded.inventory = false;
    await chiefsLoadInventory();
    if (wasNew) {
      _chiefsAutoMatch("inventory");
      // Async: generate Gemini embedding and store — fails soft, never blocks UI
      if (savedId) {
        (function(id, txt) {
          _chiefsEmbedText(txt, "RETRIEVAL_DOCUMENT").then(function(emb) {
            if (!emb) return;
            fetch(SUPABASE_URL + "/rest/v1/chiefs_inventory?id=eq." + id, {
              method: "PATCH",
              headers: Object.assign({}, _chiefsH(), {"Prefer":"return=minimal"}),
              body: JSON.stringify({ embedding: emb })
            }).catch(function(){});
          }).catch(function(){});
        })(savedId, _chiefsListingText(row));
      }
    }
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
    ad_referral: f.ad_referral||null,
    updated_at: new Date().toISOString() };
  try {
    var url = SUPABASE_URL + "/rest/v1/chiefs_clients";
    var method = "POST"; var hdrs = Object.assign({}, _chiefsH(), {"Prefer":"return=representation"});
    if (f.editing) { url += "?id=eq." + f.editing; method = "PATCH"; }
    var r = await fetch(url, { method: method, headers: hdrs, body: JSON.stringify(row) });
    var respData = await r.json();
    if (!r.ok) { throw new Error((respData && respData.message) || "Save failed"); }
    var savedId = f.editing || (Array.isArray(respData) && respData[0] && respData[0].id);
    var wasNew = !f.editing;
    CHIEFS_STATE.cliForm = { open:false, editing:null, client_name:"", client_phone:"", client_email:"",
      purpose:"sale", prop_type:"apartment", beds_wanted:"2 BR", areas_wanted:[], area_input:"",
      min_price:"", max_price:"", min_size:"", max_size:"", view_pref:"", furnished_pref:"",
      timeline:"flexible", notes:"", status:"active", source:"manual", raw_conversation:"", ad_referral:null };
    CHIEFS_STATE.loaded.clients = false;
    await chiefsLoadClients();
    if (wasNew) {
      _chiefsAutoMatch("client");
      // Report the conversion back to Meta — a new Client Memory Bank
      // record IS the "real conversion" event this business cares about,
      // per the user's explicit direction (2026-07-17). Only fires when
      // this contact's conversation actually started from a Click-to-
      // WhatsApp ad (ad_referral.ctwa_clid present) and the agent hasn't
      // turned this off in Automation Settings. Fire-and-forget, fails
      // completely soft — never blocks the client save either way.
      if (CHIEFS_AUTOMATION.autoReportConversions && row.ad_referral && row.ad_referral.ctwa_clid) {
        _chiefsReportConversion(row);
      }
      // Async: generate Gemini embedding and store — fails soft, never blocks UI
      if (savedId) {
        (function(id, txt) {
          _chiefsEmbedText(txt, "RETRIEVAL_QUERY").then(function(emb) {
            if (!emb) return;
            fetch(SUPABASE_URL + "/rest/v1/chiefs_clients?id=eq." + id, {
              method: "PATCH",
              headers: Object.assign({}, _chiefsH(), {"Prefer":"return=minimal"}),
              body: JSON.stringify({ embedding: emb })
            }).catch(function(){});
          }).catch(function(){});
        })(savedId, _chiefsClientText(row));
      }
    }
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
    // Automation: save straight to the Client Memory Bank — no "Use This
    // Client" click, no opening the form for a second manual submit — unless
    // the agent has turned "Auto-save extracted client info" off. Covers
    // both entry points (pasted text and transcribed voice calls) since
    // chiefsTranscribeVoiceCall funnels into this same function.
    if (CHIEFS_AUTOMATION.autoSaveExtracted) {
      CHIEFS_STATE.scanner.parsing = false;
      await chiefsScannerAutoSave();
      return;
    }
  } catch(e) {
    CHIEFS_STATE.scanner.error = e.message || "Failed to parse conversation";
  }
  CHIEFS_STATE.scanner.parsing = false; render();
}

// Automation path: builds the same client row chiefsScannerApply() would
// pre-fill into the form, but saves it directly via chiefsSaveClient()
// instead of waiting for a second manual review-and-submit step.
async function chiefsScannerAutoSave() {
  var r = CHIEFS_STATE.scanner.result;
  if (!r) return;
  var srcLabel = CHIEFS_STATE.scanner.source || "conversation";
  CHIEFS_STATE.cliForm = { open:false, editing:null,
    client_name: r.client_name||"Unknown", client_phone:"", client_email:"",
    purpose: r.purpose||"sale", prop_type: r.prop_type||"apartment",
    beds_wanted: r.beds||"2 BR",
    areas_wanted: Array.isArray(r.areas) ? r.areas.filter(function(a){return a;}) : [],
    area_input:"", min_price:r.min_price?String(r.min_price):"", max_price:r.max_price?String(r.max_price):"",
    min_size:r.min_size?String(r.min_size):"", max_size:r.max_size?String(r.max_size):"",
    view_pref:r.view||"", furnished_pref:r.furnished||"",
    timeline:r.timeline||"flexible", notes:r.notes||"", status:"active",
    source: srcLabel, raw_conversation:CHIEFS_STATE.scanner.text };
  var savedName = r.client_name || "New client";
  CHIEFS_STATE.scanner = { open:false, text:"", parsing:false, result:null, error:null, source:"whatsapp", transcribing:false, transcribeError:null };
  await chiefsSaveClient();
  _chiefsToast("🤖","Auto-saved: "+savedName,"Extracted from "+srcLabel+" and added to Client Memory Bank.",function(){
    CHIEFS_STATE.view="clients";
    if(window.APP_STATE){window.APP_STATE.currentSection="Network";window.APP_STATE.currentSubTab="Chiefs";}
    render();
  });
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
    source: CHIEFS_STATE.scanner.source || "whatsapp", raw_conversation:CHIEFS_STATE.scanner.text };
  CHIEFS_STATE.scanner = { open:false, text:"", parsing:false, result:null, error:null, source:"whatsapp", transcribing:false, transcribeError:null };
  CHIEFS_STATE.view = "clients"; render();
}

// ── LISTING SCANNER (Property Inventory) ─────────────────────────────────────
// Real "Paste & Extract" for a pocket listing — closes a genuinely false
// promise the empty-state text used to make ("...or import from a URL"),
// which pointed at a feature that never existed anywhere in this file.
// Reuses the exact same AI-extraction technique already proven for client
// requirements (chiefsScanConversation) applied to a seller's own listing
// text (a WhatsApp message, a Bayut/PF description, or agent notes) instead —
// an agent no longer has to manually re-type every field into the form.
async function chiefsScanListing() {
  var text = CHIEFS_STATE.invScanner.text.trim();
  if (!text) return;
  CHIEFS_STATE.invScanner.parsing = true; CHIEFS_STATE.invScanner.result = null;
  CHIEFS_STATE.invScanner.error = null; render();
  try {
    var groqBody = {
      model: "llama-3.3-70b-versatile", max_tokens: 500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a Dubai real estate CRM assistant. Extract pocket-listing details from a property description (WhatsApp text, a listing-site export, or agent notes) and respond with valid JSON only." },
        { role: "user", content: "Extract listing details from this text:\n\n" + text.substring(0,4000) + "\n\nReturn JSON: {\"building\":\"string or null\",\"area\":\"string or null (Dubai area/community name)\",\"purpose\":\"sale|rent\",\"prop_type\":\"apartment|villa|townhouse|penthouse\",\"beds\":\"Studio|1 BR|2 BR|3 BR|4 BR|5+ BR\",\"price\":null,\"size_sqft\":null,\"floor_num\":\"string or null\",\"view_type\":\"string or null\",\"furnished\":\"Unfurnished|Semi-Furnished|Furnished\",\"contact_name\":\"string or null\",\"contact_phone\":\"string or null\",\"notes\":\"any other detail worth keeping, 1 sentence\",\"confidence\":85}" }
      ]
    };
    var r = await callGroqRaw(groqBody);
    if (!r.ok) throw new Error("AI error");
    var d = await r.json();
    var content = d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content || "";
    CHIEFS_STATE.invScanner.result = JSON.parse(content.trim());
  } catch(e) {
    CHIEFS_STATE.invScanner.error = e.message || "Failed to parse listing";
  }
  CHIEFS_STATE.invScanner.parsing = false; render();
}

// Prefills the real Inventory form for one manual review-and-submit — kept
// review-first by design (unlike the client scanner's optional auto-save):
// a wrong price/building silently saved here would directly undermine this
// app's own valuation-accuracy claims once matched/quoted to a client.
function chiefsListingScannerApply() {
  var r = CHIEFS_STATE.invScanner.result;
  if (!r) return;
  CHIEFS_STATE.invForm = { open:true, editing:null, source:"pocket",
    building: r.building||"", area: r.area||"", unit_no:"",
    prop_type: r.prop_type||"apartment", beds: r.beds||"2 BR",
    size_sqft: r.size_sqft?String(r.size_sqft):"", floor_num: r.floor_num||"",
    view_type: r.view_type||"", furnished: r.furnished||"Unfurnished",
    purpose: r.purpose||"sale", price: r.price?String(r.price):"", status:"available",
    notes: r.notes||"", contact_name: r.contact_name||"", contact_phone: r.contact_phone||"" };
  CHIEFS_STATE.invScanner = { open:false, text:"", parsing:false, result:null, error:null };
  render();
}

// ── VOICE CALL TRANSCRIPTION ──────────────────────────────────────────────────
// Reuses the SAME Whisper proxy + pay-per-use video_credits pool already
// built for the Video Editor's real-subtitle feature (api/proxy-video.js,
// engine="whisper") — the underlying OpenAI cost is identical whether
// transcribing a video's audio track or a call recording, so a second
// credit product would only confuse users buying essentially the same
// thing twice. Once transcribed, the plain-text transcript is fed into the
// EXACT SAME chiefsScanConversation()/chiefsScannerApply() pipeline the
// WhatsApp scanner already uses — no separate extraction logic to maintain.
function _chiefsFileToBase64(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() {
      var result = reader.result || "";
      var comma = result.indexOf(",");
      resolve(comma !== -1 ? result.slice(comma + 1) : result);
    };
    reader.onerror = function() { reject(new Error("Could not read audio file")); };
    reader.readAsDataURL(file);
  });
}

async function chiefsTranscribeVoiceCall(file) {
  if (!file) return;
  CHIEFS_STATE.scanner.transcribing = true;
  CHIEFS_STATE.scanner.transcribeError = null;
  render();
  try {
    var b64 = await _chiefsFileToBase64(file);
    var accessToken = localStorage.getItem("dv_access_token");
    var resp = await fetch("/api/proxy-video", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ engine: "whisper", action: "transcribe", access_token: accessToken, audio_base64: b64, mime_type: file.type || "audio/webm" })
    });
    var data = await resp.json();
    if (!resp.ok) {
      if (data && data.needsCredit) {
        CHIEFS_STATE.scanner.transcribeError = (data.error || "No transcription credits left") + " — use the Buy Credit button below.";
      } else {
        CHIEFS_STATE.scanner.transcribeError = (data && data.error) || "Transcription failed";
      }
    } else {
      CHIEFS_STATE.scanner.text = data.text || "";
      CHIEFS_STATE.scanner.source = "voice_call";
      if (typeof DV_AUTH !== "undefined" && DV_AUTH.profile && DV_AUTH.profile.video_credits > 0) DV_AUTH.profile.video_credits--;
      if (CHIEFS_STATE.scanner.text.trim()) {
        CHIEFS_STATE.scanner.transcribing = false;
        await chiefsScanConversation(); // auto-run the same extraction pipeline as pasted-text
        return;
      }
    }
  } catch (e) {
    CHIEFS_STATE.scanner.transcribeError = e.message || "Transcription failed";
  }
  CHIEFS_STATE.scanner.transcribing = false;
  render();
}

// Reuses the exact same one-time-payment checkout action every other pay-
// per-use credit in this app uses (api/billing.js action=video-checkout) —
// self-contained here rather than importing js/chat.js's own helper, per
// this file's isolated-workspace design (see header comment).
async function chiefsStartVoiceCreditCheckout() {
  if (typeof DV_AUTH === "undefined" || !DV_AUTH.user) {
    if (typeof DV_AUTH !== "undefined") { DV_AUTH.showModal = true; DV_AUTH.modalTab = "signup"; DV_AUTH.error = "Please create a free account first, then buy a transcription credit."; render(); }
    return;
  }
  var resp = await fetch("/api/billing?action=video-checkout", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: DV_AUTH.user.id, email: DV_AUTH.user.email }) });
  var data = await resp.json();
  if (!data.ok || !data.url) throw new Error(data.error || "Could not start checkout");
  window.location.href = data.url;
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

async function _chiefsAutoMatch(triggerSource) {
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
  var semanticCovered = new Set(); // keys already handled by semantic phase

  // ── Phase 1: Semantic matching (single Supabase RPC, server-side cosine) ───
  var semPairs = await _chiefsSemanticRPC("auto_match_chiefs_semantic", {
    agent_id_param: agentId, similarity_cutoff: 0.62
  });
  semPairs.forEach(function(pair) {
    var key = pair.client_id + "_" + pair.inventory_id;
    if (existKeys.has(key)) { semanticCovered.add(key); return; }
    semanticCovered.add(key);
    var client  = CHIEFS_STATE.clients.find(function(c){ return c.id === pair.client_id; });
    var listing = CHIEFS_STATE.inventory.find(function(l){ return l.id === pair.inventory_id; });
    var semScore = Math.round(pair.score * 100);
    var reasons  = ["semantic " + semScore + "%"];
    var finalScore = semScore;
    // Blend with rule-based when both available
    if (client && listing) {
      var rb = _scoreMatch(client, listing);
      if (rb) { finalScore = Math.round(semScore * 0.65 + rb.score * 0.35); reasons = reasons.concat(rb.reasons); }
    }
    newRows.push({ agent_id:agentId, client_id:pair.client_id, inventory_id:pair.inventory_id,
      match_score: finalScore, match_reasons: reasons, status:"new" });
  });

  // ── Phase 2: Rule-based fallback (pairs not covered by semantic) ──────────
  activeClients.forEach(function(client) {
    avail.forEach(function(listing) {
      var key = client.id + "_" + listing.id;
      if (existKeys.has(key) || semanticCovered.has(key)) return;
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
      if (r.ok) {
        CHIEFS_STATE.loaded.matches = false; await chiefsLoadMatches();
        // Automation: draft (and, per the autoSend toggle inside
        // chiefsDraftMessage, send) each freshly-created match immediately —
        // the agent shouldn't have to open Matches and click Draft one by
        // one unless they've turned this off in Automation Settings.
        if (CHIEFS_AUTOMATION.autoDraft) {
          var freshMatches = CHIEFS_STATE.matches.filter(function(m) {
            return m.status === "new" && newRows.some(function(nr) {
              return nr.client_id === m.client_id && nr.inventory_id === m.inventory_id;
            });
          });
          freshMatches.forEach(function(m) { chiefsDraftMessage(m.id); });
        }
        // Proactive notification
        var clientIds = newRows.map(function(x){return x.client_id;}).filter(function(v,i,a){return a.indexOf(v)===i;});
        var listingIds = newRows.map(function(x){return x.inventory_id;}).filter(function(v,i,a){return a.indexOf(v)===i;});
        var clientNames = clientIds.map(function(id){ var c=CHIEFS_STATE.clients.find(function(x){return x.id===id;}); return c?c.client_name:null; }).filter(Boolean);
        var listingLabels = listingIds.map(function(id){ var l=CHIEFS_STATE.inventory.find(function(x){return x.id===id;}); return l?(l.area+(l.building?" · "+l.building:"")):null; }).filter(Boolean);
        var toastTitle, toastSub;
        if (triggerSource==="inventory" && clientNames.length) {
          toastTitle = clientNames.length + " client" + (clientNames.length>1?"s":"") + " matched this listing!";
          toastSub = clientNames.slice(0,3).join(" · ") + (clientNames.length>3?" +"+( clientNames.length-3)+" more":"");
        } else if (triggerSource==="client" && listingLabels.length) {
          toastTitle = listingLabels.length + " listing" + (listingLabels.length>1?"s":"") + " found for this client!";
          toastSub = listingLabels.slice(0,2).join(" · ") + (listingLabels.length>2?" +"+( listingLabels.length-2)+" more":"");
        } else {
          toastTitle = newRows.length + " new match" + (newRows.length>1?"es":"") + " found!";
          toastSub = "Tap to review in Matches tab";
        }
        _chiefsToast("🔗", toastTitle, toastSub, function(){
          CHIEFS_STATE.view="matches";
          if(window.APP_STATE){window.APP_STATE.currentSection="Network";window.APP_STATE.currentSubTab="Chiefs";}
          render();
        });
      }
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
    var result = await askAI([{role:"user",content:prompt}], "You are a professional Dubai real estate agent writing a WhatsApp message.", listing.area, listing.area?[listing.area]:undefined);
    if (result && result.trim()) {
      await fetch(SUPABASE_URL + "/rest/v1/chiefs_matches?id=eq." + matchId, {
        method:"PATCH", headers:Object.assign({},_chiefsH(),{"Prefer":"return=minimal"}),
        body:JSON.stringify({draft_message:result.trim(),status:"draft_ready"}) });
      var m = CHIEFS_STATE.matches.find(function(x){ return x.id===matchId; });
      if (m) { m.draft_message = result.trim(); m.status = "draft_ready"; }
      // Automation: send immediately without waiting for a click, unless the
      // agent has turned "Auto-send matched messages" off in Automation
      // Settings — matches the standing per-process auto/approval directive.
      if (CHIEFS_AUTOMATION.autoSend) {
        var sent = await chiefsSendMatchMessage(matchId);
        if (sent) _chiefsToast("🤖","Auto-sent to "+client.client_name,listing.area+(listing.building?" · "+listing.building:""));
      }
    }
  } catch(e) { alert("AI drafting failed: " + (e.message||"error")); }
  CHIEFS_STATE.matchDrafting[matchId] = false; render();
}

// Real send: POSTs to the connected WhatsApp Business API (same endpoint the
// Inbox reply box uses) so "approve" means the message actually goes out,
// not "copy it, then go paste it into WhatsApp yourself." Falls back to
// clipboard + a wa.me deep-link (opens the agent's own WhatsApp app,
// pre-filled) only when the agent hasn't connected WhatsApp Business API yet
// or the client has no phone on file — never a hard failure.
async function chiefsSendMatchMessage(matchId) {
  var match = CHIEFS_STATE.matches.find(function(m){ return m.id===matchId; });
  if (!match || !match.draft_message) return false;
  var client = CHIEFS_STATE.clients.find(function(c){ return c.id===match.client_id; });
  var sent = false;
  if (client && client.client_phone) {
    sent = await _chiefsRawWhatsAppSend(client.client_phone, match.draft_message);
  }
  try {
    await fetch(SUPABASE_URL + "/rest/v1/chiefs_matches?id=eq." + matchId, {
      method:"PATCH", headers:Object.assign({},_chiefsH(),{"Prefer":"return=minimal"}),
      body:JSON.stringify({status: sent?"sent":"approved", sent_at:new Date().toISOString()}) });
    var m = CHIEFS_STATE.matches.find(function(x){ return x.id===matchId; });
    if (m) m.status = sent?"sent":"approved";
  } catch(e) {}
  if (!sent && client && client.client_phone) {
    try { await navigator.clipboard.writeText(match.draft_message); } catch(e) {}
    var phone2 = client.client_phone.replace(/[^0-9+]/g,"");
    window.open("https://wa.me/" + phone2 + "?text=" + encodeURIComponent(match.draft_message), "_blank", "noopener,noreferrer");
  }
  render();
  return sent;
}

// The single "one-click approval" action per the automation directive:
// clicking Approve actually SENDS the message (real API), it doesn't just
// copy it for the agent to paste elsewhere. Falls back gracefully (see
// chiefsSendMatchMessage) if WhatsApp Business API isn't connected yet.
async function chiefsApproveMatch(matchId) {
  var sent = await chiefsSendMatchMessage(matchId);
  if (sent) _chiefsToast("✅","Message sent!","Delivered via WhatsApp Business API.");
  else alert("Couldn't send automatically (connect WhatsApp Business API in Social Setup, or this client has no phone on file). Message copied — your WhatsApp app should have opened to send it manually.");
}

// Manual override for an agent who deliberately wants to send from their own
// personal WhatsApp app instead of the connected Business API number.
async function chiefsWhatsApp(matchId) {
  var match = CHIEFS_STATE.matches.find(function(m){ return m.id===matchId; });
  if (!match || !match.draft_message) return;
  var client = CHIEFS_STATE.clients.find(function(c){ return c.id===match.client_id; });
  if (client && client.client_phone) {
    var phone = client.client_phone.replace(/[^0-9+]/g,"");
    window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(match.draft_message), "_blank", "noopener,noreferrer");
  }
  try {
    await fetch(SUPABASE_URL + "/rest/v1/chiefs_matches?id=eq." + matchId, {
      method:"PATCH", headers:Object.assign({},_chiefsH(),{"Prefer":"return=minimal"}),
      body:JSON.stringify({status:"approved",sent_at:new Date().toISOString()}) });
    var m = CHIEFS_STATE.matches.find(function(x){ return x.id===matchId; });
    if (m) m.status = "approved";
  } catch(e) {}
  render();
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
    fontFamily:"'Space Grotesk',monospace",cursor:"pointer",whiteSpace:"nowrap",
    display:"inline-flex",alignItems:"center",gap:"5px"},extra||{})});
  b.innerHTML = text; b.addEventListener("click", onClick); return b;
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

// ── AUTOMATION SETTINGS UI ────────────────────────────────────────────────────
function _chToggleRow(label, desc, checked, onChange, isLast) {
  var cl = C();
  var row = el("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",
    padding:"10px 0",borderBottom:isLast?"none":"1px solid "+cl.border}});
  var info = el("div",{style:{flex:"1",minWidth:"0"}});
  info.appendChild(div({color:cl.white,fontSize:"12px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},label));
  info.appendChild(div({color:cl.muted,fontSize:"10.5px",marginTop:"2px",fontFamily:"'Inter',sans-serif",lineHeight:"1.4"},desc));
  row.appendChild(info);
  var sw = el("button",{style:{width:"42px",height:"24px",borderRadius:"20px",border:"none",cursor:"pointer",
    background:checked?"#10B981":"rgba(255,255,255,0.15)",position:"relative",flexShrink:"0",transition:"background 0.2s",padding:"0"}});
  var knob = el("div",{style:{width:"18px",height:"18px",borderRadius:"50%",background:"#fff",position:"absolute",top:"3px",
    left:checked?"21px":"3px",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.4)"}});
  sw.appendChild(knob);
  sw.addEventListener("click",function(){ onChange(!checked); });
  row.appendChild(sw);
  return row;
}

// Per the standing product directive (2026-07-17): this tab should default
// to fully autonomous operation. Each toggle here is the ONLY "manual"
// concept this tab has — AI does the work either way, this just decides
// whether it acts on its own or waits for one approval click.
function _renderChiefsAutomationSettings() {
  var cl = C();
  var card = el("div",{style:{background:"linear-gradient(135deg,rgba(212,175,55,0.06),rgba(212,175,55,0.015))",
    border:"1px solid rgba(212,175,55,0.22)",borderRadius:"14px",padding:"14px 16px",marginBottom:"16px"}});
  var hdr = el("div",{style:{display:"flex",alignItems:"center",gap:"7px",marginBottom:"4px"}});
  hdr.appendChild(span({fontSize:"14px"},"⚡"));
  hdr.appendChild(div({color:"#D4AF37",fontSize:"11px",fontWeight:"800",letterSpacing:"0.08em",fontFamily:"'Space Grotesk',monospace"},"AUTOMATION"));
  card.appendChild(hdr);
  card.appendChild(div({color:cl.muted,fontSize:"10.5px",marginBottom:"2px",fontFamily:"'Inter',sans-serif",lineHeight:"1.4"},"Your AI assistant, on autopilot by default. Turn any of these off if you'd rather review and approve with one click first."));
  card.appendChild(_chToggleRow("Auto-draft messages for new matches",
    "The moment a client is matched to a listing, AI writes the WhatsApp message — no need to click Draft yourself.",
    CHIEFS_AUTOMATION.autoDraft, function(v){ CHIEFS_AUTOMATION.autoDraft=v; _chiefsSaveAutomation(); render(); }));
  card.appendChild(_chToggleRow("Auto-send matched messages",
    "Sends the drafted message straight to the client's WhatsApp the moment it's ready. Turn off to review and approve each one first.",
    CHIEFS_AUTOMATION.autoSend, function(v){ CHIEFS_AUTOMATION.autoSend=v; _chiefsSaveAutomation(); render(); }));
  card.appendChild(_chToggleRow("Auto-save extracted client info",
    "Scanned WhatsApp chats, transcribed calls, and AI Co-pilot inbox replies all save straight to your Client Memory Bank. Turn off to review the extracted details first.",
    CHIEFS_AUTOMATION.autoSaveExtracted, function(v){ CHIEFS_AUTOMATION.autoSaveExtracted=v; _chiefsSaveAutomation(); render(); }));
  var pixelConnected = !!(localStorage.getItem("dv_meta_pixel_id") && localStorage.getItem("dv_meta_capi_token"));
  card.appendChild(_chToggleRow("Report ad conversions to Meta",
    (pixelConnected ? "Connected. " : "Not connected — set up your Meta Ads Pixel in Social Setup to use this. ") +
    "When a client from a Facebook/Instagram ad conversation gets saved to your Client Memory Bank, tells Meta it was a real lead — so your ads get smarter over time.",
    CHIEFS_AUTOMATION.autoReportConversions, function(v){ CHIEFS_AUTOMATION.autoReportConversions=v; _chiefsSaveAutomation(); render(); }, true));
  return card;
}

function _chiefsToast(icon, title, subtitle, onView) {
  var ctr = document.getElementById("chiefs-toast-ctr");
  if (!ctr) {
    ctr = document.createElement("div");
    ctr.id = "chiefs-toast-ctr";
    // dv-toast-safe-bottom: on the native Android app, the plain bottom:80px
    // below never accounts for env(safe-area-inset-bottom) — on any real
    // device where that inset exceeds ~8px (the norm for modern gesture-nav
    // Android, and iPhone Safari's home-indicator inset on the website too),
    // the bottom tab bar's own safe-area-aware position grows taller and
    // this toast's fixed offset no longer clears it, so the toast renders
    // partially hidden behind the tab bar. The class below (see cap-native
    // CSS overrides) bumps this up by the real inset when one exists.
    ctr.className = "dv-toast-safe-bottom";
    ctr.style.cssText = "position:fixed;bottom:80px;right:16px;z-index:9995;display:flex;flex-direction:column-reverse;gap:8px;pointer-events:none;max-width:300px";
    document.body.appendChild(ctr);
  }
  var t = document.createElement("div");
  t.style.cssText = "background:#0D1220;border:1px solid rgba(212,175,55,0.35);border-left:3px solid #D4AF37;border-radius:12px;padding:12px 14px;pointer-events:auto;box-shadow:0 8px 32px rgba(0,0,0,0.7);transform:translateX(130%);transition:transform 0.3s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden";
  // Header
  var row = document.createElement("div");
  row.style.cssText = "display:flex;align-items:flex-start;gap:8px";
  var ic = document.createElement("div"); ic.style.cssText = "font-size:18px;flex-shrink:0;line-height:1.2"; ic.textContent = icon; row.appendChild(ic);
  var txt = document.createElement("div"); txt.style.cssText = "flex:1;min-width:0";
  var ttl = document.createElement("div"); ttl.style.cssText = "color:#D4AF37;font-size:12px;font-weight:700;font-family:'Space Grotesk',monospace;margin-bottom:2px"; ttl.textContent = title; txt.appendChild(ttl);
  if (subtitle) { var sub = document.createElement("div"); sub.style.cssText = "color:#8899AA;font-size:11px;font-family:'Inter',sans-serif;line-height:1.4"; sub.textContent = subtitle; txt.appendChild(sub); }
  row.appendChild(txt);
  var cls = document.createElement("button"); cls.style.cssText = "background:none;border:none;color:#556677;cursor:pointer;font-size:13px;padding:0 0 0 6px;line-height:1;flex-shrink:0"; cls.textContent = "✕";
  cls.addEventListener("click", function(e){ e.stopPropagation(); dismiss(); }); row.appendChild(cls);
  t.appendChild(row);
  // View button
  if (onView) {
    var vb = document.createElement("div"); vb.style.cssText = "background:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.25);border-radius:6px;padding:5px 10px;color:#D4AF37;font-size:11px;font-weight:700;font-family:'Space Grotesk',monospace;margin-top:8px;display:inline-block;cursor:pointer"; vb.textContent = "View Matches →"; t.appendChild(vb);
    t.style.cursor = "pointer"; t.addEventListener("click", function(){ onView(); dismiss(); });
  }
  // Progress bar
  var bar = document.createElement("div"); bar.style.cssText = "position:absolute;bottom:0;left:0;height:2px;background:#D4AF37;width:100%;opacity:0.4;transition:width 7s linear"; t.appendChild(bar);
  ctr.appendChild(t);
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ t.style.transform="translateX(0)"; setTimeout(function(){ bar.style.width="0%"; },50); }); });
  var timer = setTimeout(dismiss, 7500);
  function dismiss(){ clearTimeout(timer); t.style.transform="translateX(130%)"; t.style.opacity="0"; t.style.transition="transform 0.25s ease,opacity 0.25s ease"; setTimeout(function(){ if(t.parentNode)t.parentNode.removeChild(t); },300); }
}

// ── SEMANTIC SEARCH HELPERS ───────────────────────────────────────────────────

// Canonical text for embedding a pocket listing
function _chiefsListingText(l) {
  return [
    l.beds ? l.beds + " bedroom" : "", l.prop_type || "apartment",
    "for " + (l.purpose || "sale"), "in", l.area,
    l.building ? "at " + l.building : "",
    l.price ? "AED " + Number(l.price).toLocaleString() + (l.purpose === "rent" ? " per year" : "") : "",
    l.size_sqft ? l.size_sqft + " sqft" : "",
    l.furnished || "", l.view_type ? l.view_type + " view" : "",
    l.floor_num ? "floor " + l.floor_num : "", l.notes || ""
  ].filter(Boolean).join(" ");
}

// Canonical text for embedding a client requirement
function _chiefsClientText(c) {
  var areas = Array.isArray(c.areas_wanted) ? c.areas_wanted.join(", ") : (c.areas_wanted || "");
  return [
    "Looking for", c.beds_wanted ? c.beds_wanted + " bedroom" : "",
    c.prop_type || "apartment", "to " + (c.purpose === "rent" ? "rent" : "buy"),
    areas ? "in " + areas : "",
    c.max_price ? "budget up to AED " + Number(c.max_price).toLocaleString() : "",
    c.min_price ? "minimum AED " + Number(c.min_price).toLocaleString() : "",
    c.furnished_pref ? "wants " + c.furnished_pref : "",
    c.view_pref ? c.view_pref + " view preferred" : "",
    c.timeline ? "timeline: " + c.timeline : "", c.notes || ""
  ].filter(Boolean).join(" ");
}

// Call /api/chiefs-embed — returns 768-dim float array or null (fails soft)
async function _chiefsEmbedText(text, taskType) {
  if (!text) return null;
  try {
    var r = await fetch("/api/chiefs-embed", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 3000), taskType: taskType || "RETRIEVAL_DOCUMENT" })
    });
    if (!r.ok) return null;
    var d = await r.json(); return d.embedding || null;
  } catch(e) { return null; }
}

// Call a Supabase RPC — returns array or [] (fails soft)
async function _chiefsSemanticRPC(name, params) {
  try {
    var r = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + name, {
      method: "POST",
      headers: Object.assign({}, _chiefsH(), { "Content-Type": "application/json" }),
      body: JSON.stringify(params)
    });
    if (!r.ok) return [];
    var d = await r.json(); return Array.isArray(d) ? d : [];
  } catch(e) { return []; }
}

// ── VIEW: DASHBOARD ───────────────────────────────────────────────────────────
// ── DAILY BRIEFING + PROACTIVE FOLLOW-UP ─────────────────────────────────────
// All signals below are computed purely from data already loaded into
// CHIEFS_STATE (inventory/clients/matches/pipeline) — no new schema, no new
// fetch. askAI() is only ever given these already-computed real facts to
// narrate; it never invents which clients/deals need attention.
function _daysSince(dateStr) {
  if (!dateStr) return null;
  var d = new Date(dateStr).getTime();
  if (isNaN(d)) return null;
  return Math.floor((Date.now() - d) / 86400000);
}

function _chiefsComputeSignals() {
  var inv = CHIEFS_STATE.inventory, cli = CHIEFS_STATE.clients,
    matches = CHIEFS_STATE.matches, pipe = CHIEFS_STATE.pipeline;
  var todayStr = new Date().toISOString().slice(0, 10);

  var newMatches = matches.filter(function(m) {
    var age = _daysSince(m.created_at);
    return (m.status === "new" || m.status === "draft_ready") && age !== null && age < 1;
  });

  var staleClients = cli.filter(function(c) {
    var age = _daysSince(c.updated_at || c.created_at);
    return c.status === "active" && age !== null && age >= 5;
  }).sort(function(a, b) { return _daysSince(b.updated_at) - _daysSince(a.updated_at); }).slice(0, 5);

  var activePipe = pipe.filter(function(p) { return p.stage !== "closed" && p.stage !== "lost"; });
  var overdueActions = activePipe.filter(function(p) { return p.next_action_date && p.next_action_date < todayStr; });
  var todayActions = activePipe.filter(function(p) { return p.next_action_date === todayStr; });
  var stuckDeals = activePipe.filter(function(p) {
    var age = _daysSince(p.updated_at || p.created_at);
    return age !== null && age >= 7;
  });

  var agingListings = inv.filter(function(l) {
    var age = _daysSince(l.created_at);
    return l.status === "available" && age !== null && age >= 30;
  });

  return { newMatches: newMatches, staleClients: staleClients, overdueActions: overdueActions,
    todayActions: todayActions, stuckDeals: stuckDeals, agingListings: agingListings };
}

// Merges every "needs attention" signal into one flat, priority-sorted list
// for the Dashboard's Smart To-Do — replaces the old pipeline-only "Next
// Actions" preview, which missed stale clients / aging listings / stuck
// deals entirely.
function _chiefsSmartTodo(s) {
  var items = [];
  s.overdueActions.forEach(function(p) {
    items.push({ urgency: 1, color: "#EF4444", title: p.client_name, sub: "Overdue: " + p.next_action, badge: p.next_action_date, view: "pipeline" });
  });
  s.todayActions.forEach(function(p) {
    items.push({ urgency: 2, color: "#F59E0B", title: p.client_name, sub: "Due today: " + p.next_action, badge: "Today", view: "pipeline" });
  });
  s.stuckDeals.forEach(function(p) {
    items.push({ urgency: 3, color: "#8B5CF6", title: p.client_name, sub: "No update in " + _daysSince(p.updated_at || p.created_at) + "d · stage: " + p.stage, badge: null, view: "pipeline" });
  });
  s.staleClients.forEach(function(c) {
    items.push({ urgency: 4, color: "#3B82F6", title: c.client_name, sub: "No follow-up in " + _daysSince(c.updated_at || c.created_at) + "d", badge: null, view: "clients" });
  });
  s.agingListings.forEach(function(l) {
    items.push({ urgency: 5, color: "#14B8A6", title: (l.building || l.area), sub: "On market " + _daysSince(l.created_at) + "d, no offer", badge: null, view: "inventory" });
  });
  items.sort(function(a, b) { return a.urgency - b.urgency; });
  return items;
}

function _chiefsSignalsHavePayload(s) {
  return s.newMatches.length + s.staleClients.length + s.overdueActions.length +
    s.todayActions.length + s.stuckDeals.length + s.agingListings.length > 0;
}

async function _chiefsGenerateBriefing(force) {
  if (CHIEFS_STATE.briefing.loading) return;
  if (CHIEFS_STATE.briefing.text && !force) return; // already generated this session
  var s = _chiefsComputeSignals();
  CHIEFS_STATE.briefing.checked = true;
  if (!_chiefsSignalsHavePayload(s)) {
    CHIEFS_STATE.briefing.text = null;
    return;
  }
  CHIEFS_STATE.briefing.loading = true;
  CHIEFS_STATE.briefing.error = null;
  render();
  try {
    var facts = [];
    if (s.newMatches.length) facts.push(s.newMatches.length + " new client-listing match(es) found in the last 24h.");
    if (s.todayActions.length) facts.push(s.todayActions.length + " pipeline action(s) due TODAY: " +
      s.todayActions.map(function(p) { return p.client_name + " (" + p.next_action + ")"; }).join("; ") + ".");
    if (s.overdueActions.length) facts.push(s.overdueActions.length + " pipeline action(s) OVERDUE: " +
      s.overdueActions.map(function(p) { return p.client_name + " (" + p.next_action + ", was due " + p.next_action_date + ")"; }).join("; ") + ".");
    if (s.staleClients.length) facts.push(s.staleClients.length + " active client(s) not followed up in 5+ days: " +
      s.staleClients.map(function(c) { return c.client_name + " (" + _daysSince(c.updated_at || c.created_at) + "d)"; }).join("; ") + ".");
    if (s.stuckDeals.length) facts.push(s.stuckDeals.length + " active deal(s) with no update in 7+ days: " +
      s.stuckDeals.map(function(p) { return p.client_name + " (stage: " + p.stage + ")"; }).join("; ") + ".");
    if (s.agingListings.length) facts.push(s.agingListings.length + " listing(s) on market 30+ days with no offer, may need a price review: " +
      s.agingListings.map(function(l) { return (l.building || l.area) + " (" + _daysSince(l.created_at) + "d)"; }).join("; ") + ".");

    var sys = "You are an AI Chief of Staff — a real estate agent's private assistant. Write a short, warm, direct 'Good morning' briefing (3-5 sentences max) summarizing the facts given. Be specific (name clients/deals), prioritize what's most urgent first (overdue > today > stale > aging). No fluff, no generic pleasantries, sound like a sharp human assistant, not a report generator. Do not invent any fact not given to you.";
    var reply = await askAI([{ role: "user", content: "Today's facts:\n" + facts.join("\n") }], sys);
    CHIEFS_STATE.briefing.text = reply;
    CHIEFS_STATE.briefing.generatedAt = new Date().toISOString();
  } catch (e) {
    CHIEFS_STATE.briefing.error = e.message || "Could not generate briefing";
  }
  CHIEFS_STATE.briefing.loading = false;
  render();
}

function _renderChiefsBriefing() {
  var cl = C();
  var s = _chiefsComputeSignals();
  if (!_chiefsSignalsHavePayload(s) && !CHIEFS_STATE.briefing.loading && !CHIEFS_STATE.briefing.text) return null;

  var card = el("div", { style: { background: "linear-gradient(135deg,rgba(212,175,55,0.08),rgba(212,175,55,0.02))",
    border: "1px solid rgba(212,175,55,0.25)", borderRadius: "14px", padding: "16px", marginBottom: "16px" } });
  var hdr = el("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" } });
  var hl = el("div", { style: { display: "flex", alignItems: "center", gap: "8px" } });
  hl.appendChild(span({ fontSize: "16px" }, "🌅"));
  hl.appendChild(div({ color: "#D4AF37", fontSize: "12px", fontWeight: "800", fontFamily: "'Space Grotesk',monospace", letterSpacing: "0.05em" }, "TODAY'S BRIEFING"));
  hdr.appendChild(hl);
  var refreshBtn = el("button", { style: { background: "transparent", border: "none", color: "#8899AA", fontSize: "11px", cursor: "pointer", fontFamily: "monospace" } });
  refreshBtn.textContent = CHIEFS_STATE.briefing.loading ? "Thinking…" : "↻ Refresh";
  refreshBtn.disabled = CHIEFS_STATE.briefing.loading;
  refreshBtn.addEventListener("click", function() { _chiefsGenerateBriefing(true); });
  hdr.appendChild(refreshBtn);
  card.appendChild(hdr);

  if (CHIEFS_STATE.briefing.loading && !CHIEFS_STATE.briefing.text) {
    card.appendChild(div({ color: cl.sub, fontSize: "12px" }, "Reviewing your inventory, clients, and pipeline…"));
  } else if (CHIEFS_STATE.briefing.error) {
    card.appendChild(div({ color: "#EF4444", fontSize: "11px" }, CHIEFS_STATE.briefing.error));
  } else if (CHIEFS_STATE.briefing.text) {
    card.appendChild(div({ color: "#E8E8E8", fontSize: "13px", lineHeight: "1.6", fontFamily: "'Inter',sans-serif", marginBottom: "10px" }, CHIEFS_STATE.briefing.text));
  }

  // Actionable chips — click jumps straight to the relevant view.
  var chips = el("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" } });
  function chip(label, color, onClick) {
    var c = el("button", { style: { background: color + "18", border: "1px solid " + color + "44", color: color,
      borderRadius: "8px", padding: "5px 10px", fontSize: "10px", fontWeight: "700", cursor: "pointer", fontFamily: "'Space Grotesk',monospace" } });
    c.textContent = label; c.addEventListener("click", onClick); chips.appendChild(c);
  }
  if (s.overdueActions.length) chip(s.overdueActions.length + " Overdue", "#EF4444", function() { CHIEFS_STATE.view = "pipeline"; render(); });
  if (s.todayActions.length) chip(s.todayActions.length + " Due Today", "#F59E0B", function() { CHIEFS_STATE.view = "pipeline"; render(); });
  if (s.staleClients.length) chip(s.staleClients.length + " Need Follow-Up", "#3B82F6", function() { CHIEFS_STATE.view = "clients"; render(); });
  if (s.stuckDeals.length) chip(s.stuckDeals.length + " Stuck Deals", "#8B5CF6", function() { CHIEFS_STATE.view = "pipeline"; render(); });
  if (s.agingListings.length) chip(s.agingListings.length + " Aging Listings", "#14B8A6", function() { CHIEFS_STATE.view = "inventory"; render(); });
  if (s.newMatches.length) chip(s.newMatches.length + " New Matches", "#10B981", function() { CHIEFS_STATE.view = "matches"; render(); });
  if (chips.children.length) card.appendChild(chips);

  return card;
}

function _renderChiefsDashboard() {
  var cl = C();
  var wrap = el("div",{style:{padding:"16px",maxWidth:"700px",margin:"0 auto"}});

  var briefingCard = _renderChiefsBriefing();
  if (briefingCard) wrap.appendChild(briefingCard);

  wrap.appendChild(_renderChiefsAutomationSettings());

  // Stats row
  var inv = CHIEFS_STATE.inventory; var cli = CHIEFS_STATE.clients;
  var matches = CHIEFS_STATE.matches; var pipe = CHIEFS_STATE.pipeline;
  var pendingMatches = matches.filter(function(m){ return m.status==="new"||m.status==="draft_ready"; });
  var activeDeals = pipe.filter(function(p){ return p.stage!=="closed"&&p.stage!=="lost"; });
  var stats = [
    {label:"My Listings",val:inv.length,color:"#D4AF37",icon:"package"},
    {label:"Active Clients",val:cli.filter(function(c){return c.status==="active";}).length,color:"#3B82F6",icon:"users"},
    {label:"Pending Matches",val:pendingMatches.length,color:"#10B981",icon:"link-2"},
    {label:"Active Deals",val:activeDeals.length,color:"#14B8A6",icon:"clipboard-list"}
  ];
  var statsRow = el("div",{style:{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px",marginBottom:"16px"}});
  stats.forEach(function(s) {
    var c = el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"12px",padding:"14px",cursor:"pointer"}});
    var sIco=el("div",{style:{width:"32px",height:"32px",borderRadius:"8px",background:s.color+"18",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"8px"}});
    sIco.innerHTML='<i data-lucide="'+s.icon+'" style="width:16px;height:16px;color:'+s.color+'"></i>';
    c.appendChild(sIco);
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
    {label:"Scan Chat/Call",color:"#25D366",action:function(){CHIEFS_STATE.scanner.open=true;CHIEFS_STATE.view="clients";render();}},
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

  // Smart To-Do — merges overdue/today pipeline actions, stuck deals, stale
  // clients, and aging listings into one priority-sorted list (replaces the
  // old pipeline-only "Next Actions" preview, which missed everything else).
  var todo = _chiefsSmartTodo(_chiefsComputeSignals());
  if (todo.length > 0) {
    wrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",marginTop:"4px"},"Smart To-Do"));
    todo.slice(0,6).forEach(function(item) {
      var pc = el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderLeft:"3px solid "+item.color,borderRadius:"10px",
        padding:"10px 12px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"10px",cursor:"pointer"}});
      pc.addEventListener("click",function(){CHIEFS_STATE.view=item.view;render();});
      var info = el("div",{style:{flex:"1",minWidth:"0"}});
      info.appendChild(div({color:cl.white,fontSize:"12px",fontWeight:"600",fontFamily:"'Inter',sans-serif"},item.title));
      info.appendChild(div({color:cl.sub,fontSize:"11px",marginTop:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},item.sub));
      pc.appendChild(info);
      if (item.badge) pc.appendChild(_chBadge(item.badge,item.color));
      wrap.appendChild(pc);
    });
    if (todo.length > 6) wrap.appendChild(div({color:cl.muted,fontSize:"10px",textAlign:"center",marginBottom:"8px"},"+"+(todo.length-6)+" more — see relevant tabs"));
  }

  if (!inv.length && !cli.length) {
    // "+ Add Listing"/"+ Add Client" already appear in the Quick Actions
    // grid above (always shown) — no need to repeat them here too.
    var empty = _chCard([
      div({color:cl.white,fontSize:"14px",fontWeight:"600",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",textAlign:"center"},"Welcome to AI Chief of Staff"),
      div({color:cl.sub,fontSize:"12px",lineHeight:"1.6",textAlign:"center",fontFamily:"'Inter',sans-serif"},"Your AI-powered agent workspace. Add listings to your inventory, store client requirements, and let the AI automatically match clients to properties and draft personalized WhatsApp messages — use the Quick Actions above to get started.")
    ],{textAlign:"center"});
    wrap.appendChild(empty);
  }
  return wrap;
}

// ── COMPETITOR / MARKET WATCH ─────────────────────────────────────────────────
// Flags a pocket listing whose asking price has drifted out of line with the
// CURRENT calibrated building PSF (lookupBuilding, same building database the
// Analyzer uses) — either because the listing itself is priced high, or
// because the wider market has moved since it was first added. Pure
// client-side computation against data already loaded/global, no live fetch.
function _chiefsCompetitorCheck(item) {
  if (typeof lookupBuilding !== "function" || !item.building || !item.size_sqft || !item.price) return null;
  var bData = lookupBuilding(item.building, item.area);
  if (!bData || !bData.p) return null;
  var askPsf = Number(item.price) / Number(item.size_sqft);
  var currentPsf = bData.p;
  var diffPct = ((askPsf - currentPsf) / currentPsf) * 100;

  if (diffPct > 8) {
    return { color: "#EF4444", message: "Priced " + Math.round(diffPct) + "% above the current " + item.building + " PSF (AED " + Math.round(currentPsf) + "/sqft) — may be sitting for this reason." };
  }
  if (item.dv_psf && item.dv_psf > currentPsf * 1.05) {
    var driftPct = Math.round(((item.dv_psf - currentPsf) / currentPsf) * 100);
    return { color: "#F59E0B", message: "Building PSF has softened " + driftPct + "% since this was listed (was ~AED " + Math.round(item.dv_psf) + ", now ~AED " + Math.round(currentPsf) + ") — worth a price review." };
  }
  if (diffPct < -8) {
    return { color: "#10B981", message: "Priced " + Math.round(Math.abs(diffPct)) + "% below current market PSF (AED " + Math.round(currentPsf) + "/sqft) — a genuinely strong deal to push to matched clients." };
  }
  return { color: "#3B82F6", message: "In line with current market PSF (AED " + Math.round(currentPsf) + "/sqft) for " + item.building + "." };
}

// ── VIEW: INVENTORY ───────────────────────────────────────────────────────────
function _renderChiefsInventory() {
  var cl = C();
  var wrap = el("div",{style:{padding:"16px",maxWidth:"700px",margin:"0 auto"}});
  var f = CHIEFS_STATE.invForm;
  var areaNames = Object.keys(typeof AREAS!=="undefined"?AREAS:{}).sort();

  // Header + add button
  var hdr = el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}});
  hdr.appendChild(div({color:cl.white,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace"},"Property Inventory"));
  var sc = CHIEFS_STATE.invScanner;
  if (!f.open && !sc.open) {
    var hdrBtns = el("div",{style:{display:"flex",gap:"6px"}});
    hdrBtns.appendChild(_chBtn('<i data-lucide="bot" style="width:11px;height:11px"></i>Paste & Extract',"rgba(37,211,102,0.12)","#25D366",function(){CHIEFS_STATE.invScanner.open=true;render();},{border:"1px solid rgba(37,211,102,0.25)",fontSize:"11px"}));
    hdrBtns.appendChild(_chBtn("+ Add Listing","#D4AF37",undefined,function(){CHIEFS_STATE.invForm.open=true;CHIEFS_STATE.invForm.editing=null;render();}));
    hdr.appendChild(hdrBtns);
  }
  wrap.appendChild(hdr);

  // Paste & Extract — real AI-powered listing extraction (chiefsScanListing),
  // replacing the old empty-state's false "...or import from a URL" promise
  // (no such feature ever existed) with something that genuinely works: paste
  // a WhatsApp message, a Bayut/PF description, or agent notes, and the form
  // below pre-fills for one manual review before saving.
  if (sc.open) {
    var scCard = _chCard(null,{background:"rgba(37,211,102,0.06)",border:"1px solid rgba(37,211,102,0.2)"});
    scCard.appendChild(div({color:"#25D366",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",letterSpacing:"0.1em"},"PASTE & EXTRACT LISTING"));
    scCard.appendChild(div({color:cl.muted,fontSize:"11px",marginBottom:"10px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},"Paste a WhatsApp message, a listing description, or agent notes — AI fills in the fields below for you to review."));
    var scTa = el("textarea",{placeholder:"e.g. \"3BR in Marina Gate 1, Dubai Marina, 1500 sqft, asking 2.5M, sea view, semi-furnished, contact Ali 0501234567\"",style:Object.assign({},I(),{height:"100px",resize:"vertical",fontFamily:"'Inter',sans-serif",lineHeight:"1.5",marginBottom:"8px"})});
    scTa.value = sc.text; scTa.addEventListener("input",function(){CHIEFS_STATE.invScanner.text=this.value;});
    scCard.appendChild(scTa);
    if (sc.error) scCard.appendChild(div({color:"#EF4444",fontSize:"11px",marginBottom:"8px"},sc.error));
    if (sc.result) {
      var r = sc.result;
      var resCard = el("div",{style:{background:"rgba(37,211,102,0.08)",border:"1px solid rgba(37,211,102,0.2)",borderRadius:"8px",padding:"10px",marginBottom:"8px"}});
      resCard.appendChild(div({color:"#25D366",fontSize:"10px",fontWeight:"700",letterSpacing:"0.1em",marginBottom:"6px"},"AI EXTRACTED LISTING"));
      var lFields=[["Building",r.building],["Area",r.area],["Type",(r.beds||"")+" "+(r.prop_type||"")+" ("+(r.purpose||"sale")+")"],["Price",r.price?_fmtPrice(r.price):null],["Size",r.size_sqft?r.size_sqft+" sqft":null],["Notes",r.notes]];
      lFields.forEach(function(pair){if(pair[1]&&pair[1].trim&&pair[1].trim()!=="()"){resCard.appendChild(div({color:cl.sub,fontSize:"11px",marginBottom:"2px"},"• "+pair[0]+": "+span({color:cl.white},pair[1]).textContent));}});
      scCard.appendChild(resCard);
    }
    var scBtnRow = el("div",{style:{display:"flex",gap:"6px"}});
    scBtnRow.appendChild(_chBtn("Cancel","rgba(255,255,255,0.06)","#8899AA",function(){CHIEFS_STATE.invScanner={open:false,text:"",parsing:false,result:null,error:null};render();},{border:"1px solid rgba(255,255,255,0.1)"}));
    if (sc.result) scBtnRow.appendChild(_chBtn('<i data-lucide="check" style="width:12px;height:12px"></i>Use This Listing',"#10B981","#fff",function(){chiefsListingScannerApply();}));
    else scBtnRow.appendChild(_chBtn(sc.parsing?"Analyzing...":'<i data-lucide="bot" style="width:12px;height:12px"></i>Extract Listing',"#25D366",undefined,function(){if(!sc.parsing)chiefsScanListing();}));
    scCard.appendChild(scBtnRow); wrap.appendChild(scCard);
  }

  // Inline form
  if (f.open) {
    var fm = _chCard(null,{background:"rgba(212,175,55,0.06)",border:"1px solid rgba(212,175,55,0.2)"});
    fm.appendChild(div({color:"#D4AF37",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px",letterSpacing:"0.1em"},f.editing?"EDIT LISTING":"NEW LISTING"));
    var g1 = el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}});
    // Building gets its own dedicated input+listener (matching the inp()
    // pattern used everywhere else in this file) — a shared loop-wide
    // "input" listener here previously assumed pair[1] was always the raw
    // Building <input>, but native <select> elements (Purpose/Type/Bedrooms/
    // Status below) also fire "input" events, so picking ANY of those 4
    // dropdowns silently overwrote f.building with that dropdown's own
    // value (e.g. selecting "villa" in Type set f.building="villa") while
    // the visible Building text box kept showing the correct name — a
    // silent data-corruption bug that would save the wrong building name.
    var buildingInp = inp(I(),"Building name","text",f.building||"",function(v){f.building=v;});
    [[lbl("Area *"),mkAuto(Object.assign({},I(),{marginBottom:"0"}),areaNames,f.area,function(v){f.area=v;},"Type area...")],
     [lbl("Building"),buildingInp],
     [lbl("Purpose"),mkSelect(I(),["sale","rent"],f.purpose||"sale",function(v){f.purpose=v;})],
     [lbl("Type"),mkSelect(I(),["apartment","villa","townhouse","penthouse"],f.prop_type||"apartment",function(v){f.prop_type=v;})],
     [lbl("Bedrooms"),mkSelect(I(),["Studio","1 BR","2 BR","3 BR","4 BR","5+ BR"],f.beds||"2 BR",function(v){f.beds=v;})],
     [lbl("Status"),mkSelect(I(),["available","pocket","under_offer","sold","rented","expired"],f.status||"available",function(v){f.status=v;})],
    ].forEach(function(pair,i) {
      var cell = el("div",{});
      if (pair[0]&&pair[0].tagName) { cell.appendChild(pair[0]); }
      else { cell.appendChild(pair[0]); }
      if (pair[1]) { cell.appendChild(pair[1]); }
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
  if (!inv.length && !f.open && !sc.open) {
    wrap.appendChild(_chCard([div({color:cl.sub,fontSize:"12px",textAlign:"center",padding:"8px"},"No listings yet. Add your first pocket listing, or paste a description above and let AI fill it in.")]));
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
      if (item.status==="available"||item.status==="pocket") {
        var marketCheck = _chiefsCompetitorCheck(item);
        if (marketCheck) {
          var mcBox = el("div",{style:{marginTop:"8px",padding:"8px 10px",background:marketCheck.color+"12",border:"1px solid "+marketCheck.color+"33",borderRadius:"8px",display:"flex",alignItems:"flex-start",gap:"6px"}});
          mcBox.appendChild(span({fontSize:"11px",flexShrink:"0"},"📊"));
          mcBox.appendChild(div({color:marketCheck.color,fontSize:"11px",lineHeight:"1.5",fontFamily:"'Inter',sans-serif"},marketCheck.message));
          details.appendChild(mcBox);
        }
      }
      if (item.contact_name||item.contact_phone) { var dr3=_chRow(_chField("Contact",item.contact_name),_chField("Phone",item.contact_phone)); details.appendChild(dr3); }
      if (item.notes) details.appendChild(div({color:cl.sub,fontSize:"11px",marginTop:"8px",fontFamily:"'Inter',sans-serif",lineHeight:"1.5"},item.notes));
      var abtn = el("div",{style:{display:"flex",gap:"6px",marginTop:"10px"}});
      abtn.appendChild(_chBtn('<i data-lucide="pencil" style="width:11px;height:11px"></i>Edit',"rgba(255,255,255,0.06)","#8899AA",function(){chiefsEditInventory(item);},{border:"1px solid rgba(255,255,255,0.1)",fontSize:"11px",padding:"6px 10px"}));
      abtn.appendChild(_chBtn('<i data-lucide="link-2" style="width:11px;height:11px"></i>Find Matches',"rgba(16,185,129,0.1)","#10B981",function(){_chiefsAutoMatch();CHIEFS_STATE.view="matches";render();},{border:"1px solid rgba(16,185,129,0.2)",fontSize:"11px",padding:"6px 10px"}));
      abtn.appendChild(_chBtn('<i data-lucide="trash-2" style="width:11px;height:11px"></i>',"rgba(239,68,68,0.1)","#EF4444",function(){chiefsDeleteInventory(item.id);},{border:"1px solid rgba(239,68,68,0.2)",fontSize:"11px",padding:"6px 10px"}));
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
    btnGrp.appendChild(_chBtn('<i data-lucide="smartphone" style="width:11px;height:11px"></i>Scan Chat',"rgba(37,211,102,0.15)","#25D366",function(){CHIEFS_STATE.scanner.open=true;render();},{border:"1px solid rgba(37,211,102,0.2)",fontSize:"11px"}));
    btnGrp.appendChild(_chBtn("+ Add Client","#3B82F6","#fff",function(){CHIEFS_STATE.cliForm.open=true;CHIEFS_STATE.cliForm.editing=null;render();}));
  }
  hdr.appendChild(btnGrp); wrap.appendChild(hdr);

  // Scanner modal
  if (sc.open) {
    var scCard = _chCard(null,{background:"rgba(37,211,102,0.05)",border:"1px solid rgba(37,211,102,0.2)"});
    scCard.appendChild(div({color:"#25D366",fontSize:"11px",fontWeight:"700",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',monospace",marginBottom:"10px"},"SCAN WHATSAPP / EMAIL / CALL"));
    scCard.appendChild(div({color:cl.sub,fontSize:"11px",marginBottom:"8px",fontFamily:"'Inter',sans-serif"},"Paste a conversation, or upload a recorded call — AI transcribes and extracts client requirements either way."));
    scCard.appendChild(div({color:CHIEFS_AUTOMATION.autoSaveExtracted?"#10B981":"#F59E0B",fontSize:"10px",marginBottom:"8px",fontFamily:"'Inter',sans-serif"},CHIEFS_AUTOMATION.autoSaveExtracted?"⚡ Auto-save is ON — extracted client saves straight to your Client Memory Bank, no extra click. Turn off in ⚡ Automation (Dashboard) to review first.":"Auto-save is OFF — you'll review the extracted details before saving. Turn on in ⚡ Automation (Dashboard) to skip this step."));

    // Voice call upload — reuses the pay-per-use Whisper credit pool already
    // built for the Video Editor's real-subtitle feature.
    var voiceRow = el("div",{style:{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px",padding:"8px 10px",background:"rgba(139,92,246,0.06)",border:"1px solid rgba(139,92,246,0.25)",borderRadius:"8px",flexWrap:"wrap"}});
    var voiceCredits = (typeof DV_AUTH!=="undefined"&&DV_AUTH.profile&&DV_AUTH.profile.video_credits)||0;
    var audioInp = el("input",{type:"file",accept:"audio/*",style:{display:"none"}});
    audioInp.addEventListener("change",function(){ if(this.files&&this.files[0]) chiefsTranscribeVoiceCall(this.files[0]); });
    var voiceBtn = _chBtn(sc.transcribing?"Transcribing…":'<i data-lucide="mic" style="width:12px;height:12px"></i> Upload Call Recording',"rgba(139,92,246,0.15)","#8B5CF6",function(){ if(!sc.transcribing) audioInp.click(); },{border:"1px solid rgba(139,92,246,0.3)",fontSize:"11px",flexShrink:"0"});
    voiceRow.appendChild(voiceBtn);
    voiceRow.appendChild(audioInp);
    voiceRow.appendChild(div({color:cl.muted,fontSize:"10px"},"1 transcription credit · Balance: "+voiceCredits));
    var buyVoiceCredBtn = el("button",{style:{background:"transparent",border:"1px solid #8B5CF6",color:"#8B5CF6",borderRadius:"6px",padding:"4px 9px",fontSize:"10px",fontWeight:"700",cursor:"pointer",fontFamily:"'Space Grotesk',monospace"}});
    buyVoiceCredBtn.textContent = "+ Buy Credit";
    buyVoiceCredBtn.addEventListener("click",function(){ chiefsStartVoiceCreditCheckout().catch(function(e){alert(e.message);}); });
    voiceRow.appendChild(buyVoiceCredBtn);
    scCard.appendChild(voiceRow);
    if (sc.transcribeError) scCard.appendChild(div({color:"#EF4444",fontSize:"11px",marginBottom:"8px"},sc.transcribeError));

    var ta = el("textarea",{placeholder:"...or paste a WhatsApp/email conversation here",style:Object.assign({},I(),{height:"120px",resize:"vertical",fontFamily:"'Inter',sans-serif",lineHeight:"1.5",marginBottom:"8px"})});
    ta.value = sc.text; ta.addEventListener("input",function(){CHIEFS_STATE.scanner.text=this.value;CHIEFS_STATE.scanner.source="whatsapp";}); scCard.appendChild(ta);
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
    scanBtnRow.appendChild(_chBtn("Cancel","rgba(255,255,255,0.06)","#8899AA",function(){CHIEFS_STATE.scanner={open:false,text:"",parsing:false,result:null,error:null,source:"whatsapp",transcribing:false,transcribeError:null};render();},{border:"1px solid rgba(255,255,255,0.1)"}));
    if (sc.result) scanBtnRow.appendChild(_chBtn('<i data-lucide="check" style="width:12px;height:12px"></i>Use This Client',"#10B981","#fff",function(){chiefsScannerApply();}));
    else scanBtnRow.appendChild(_chBtn(sc.parsing?"Analyzing...":'<i data-lucide="bot" style="width:12px;height:12px"></i>Extract Requirements',"#25D366",undefined,function(){if(!sc.parsing)chiefsScanConversation();}));
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
     [lbl("Type"),null,function(v){f.prop_type=v;},["apartment","villa","townhouse","penthouse"],f.prop_type],
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
      abtn.appendChild(_chBtn('<i data-lucide="pencil" style="width:11px;height:11px"></i>Edit',"rgba(255,255,255,0.06)","#8899AA",function(){chiefsEditClient(item);},{border:"1px solid rgba(255,255,255,0.1)",fontSize:"11px",padding:"6px 10px"}));
      abtn.appendChild(_chBtn('<i data-lucide="link-2" style="width:11px;height:11px"></i>Find Matches',"rgba(16,185,129,0.1)","#10B981",function(){_chiefsAutoMatch();CHIEFS_STATE.view="matches";render();},{border:"1px solid rgba(16,185,129,0.2)",fontSize:"11px",padding:"6px 10px"}));
      if (item.client_phone) abtn.appendChild(_chBtn('<i data-lucide="message-circle" style="width:11px;height:11px"></i>WhatsApp',"rgba(37,211,102,0.1)","#25D366",function(){var p=item.client_phone.replace(/[^0-9+]/g,"");window.open("https://wa.me/"+p,"_blank","noopener,noreferrer");},{border:"1px solid rgba(37,211,102,0.2)",fontSize:"11px",padding:"6px 10px"}));
      abtn.appendChild(_chBtn('<i data-lucide="trash-2" style="width:11px;height:11px"></i>',"rgba(239,68,68,0.1)","#EF4444",function(){chiefsDeleteClient(item.id);},{border:"1px solid rgba(239,68,68,0.2)",fontSize:"11px",padding:"6px 10px"}));
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
      abtn.appendChild(_chBtn(isDrafting?"Drafting...":'<i data-lucide="bot" style="width:11px;height:11px"></i>Draft Message',"rgba(16,185,129,0.15)","#10B981",function(){if(!isDrafting)chiefsDraftMessage(match.id);},{border:"1px solid rgba(16,185,129,0.2)",fontSize:"11px"}));
    }
    if (match.draft_message && match.status!=="approved" && match.status!=="sent") {
      abtn.appendChild(_chBtn('<i data-lucide="clipboard" style="width:11px;height:11px"></i>Copy & Approve',"rgba(212,175,55,0.15)","#D4AF37",function(){chiefsApproveMatch(match.id);},{border:"1px solid rgba(212,175,55,0.2)",fontSize:"11px"}));
      if (client.client_phone) abtn.appendChild(_chBtn('<i data-lucide="message-circle" style="width:11px;height:11px"></i>Send via WhatsApp',"rgba(37,211,102,0.15)","#25D366",function(){chiefsWhatsApp(match.id);},{border:"1px solid rgba(37,211,102,0.2)",fontSize:"11px"}));
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
  if (!f.open) hdr.appendChild(_chBtn("+ Add Deal","#14B8A6","#fff",function(){CHIEFS_STATE.pipeForm.open=true;CHIEFS_STATE.pipeForm.editing=null;render();}));
  wrap.appendChild(hdr);

  // Pipeline stats
  var pipe = CHIEFS_STATE.pipeline;
  var activeDeals = pipe.filter(function(p){return p.stage!=="closed"&&p.stage!=="lost";});
  var totalValue = activeDeals.reduce(function(s,p){return s+(Number(p.deal_value)||0);},0);
  var totalComm = activeDeals.reduce(function(s,p){return s+(Number(p.commission_est)||0);},0);
  if (pipe.length > 0) {
    var stats = el("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"14px"}});
    [{label:"Active Deals",val:activeDeals.length+"",color:"#14B8A6"},
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
    var fm = _chCard(null,{background:"rgba(20,184,166,0.06)",border:"1px solid rgba(20,184,166,0.2)"});
    fm.appendChild(div({color:"#14B8A6",fontSize:"11px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"12px",letterSpacing:"0.1em"},f.editing?"EDIT DEAL":"NEW DEAL"));
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
    btnRow.appendChild(_chBtn(CHIEFS_STATE.busySave?"Saving...":f.editing?"Save Changes":"Add to Pipeline","#14B8A6","#fff",function(){if(!CHIEFS_STATE.busySave)chiefsSavePipeline();}));
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
        // Reuses the full STAGES list (single source of truth) — a
        // previously hand-duplicated, drifted copy silently omitted "docs",
        // making that stage a dead end no deal could ever be moved into or
        // out of via this button row, despite it having its own color
        // (_stageColor) and its own grouped section in the board above.
        var activeStages = STAGES;
        activeStages.forEach(function(s) {
          var isActive = deal.stage===s.id;
          var b = el("button",{style:{background:isActive?_stageColor(s.id)+"33":"transparent",border:"1px solid "+(isActive?_stageColor(s.id)+"66":"rgba(255,255,255,0.1)"),color:isActive?_stageColor(s.id):cl.muted,borderRadius:"6px",padding:"3px 8px",fontSize:"10px",cursor:"pointer"}});
          b.textContent = s.label; if (!isActive) b.addEventListener("click",function(){chiefsMoveStage(deal.id,s.id);}); stgBtns.appendChild(b);
        });
        stgRow.appendChild(stgBtns); det.appendChild(stgRow);
        var abtn=el("div",{style:{display:"flex",gap:"6px",marginTop:"10px",flexWrap:"wrap"}});
        abtn.appendChild(_chBtn('<i data-lucide="file-text" style="width:11px;height:11px"></i>Document',"rgba(212,175,55,0.1)","#D4AF37",function(){chiefsOpenDocGen(deal.id);},{border:"1px solid rgba(212,175,55,0.2)",fontSize:"11px",padding:"6px 10px"}));
        abtn.appendChild(_chBtn('<i data-lucide="pencil" style="width:11px;height:11px"></i>Edit',"rgba(255,255,255,0.06)","#8899AA",function(){CHIEFS_STATE.pipeForm={open:true,editing:deal.id,client_name:deal.client_name||"",property_desc:deal.property_desc||"",stage:deal.stage||"lead",deal_value:deal.deal_value||"",next_action:deal.next_action||"",next_action_date:deal.next_action_date||"",notes:deal.notes||""};render();},{border:"1px solid rgba(255,255,255,0.1)",fontSize:"11px",padding:"6px 10px"}));
        abtn.appendChild(_chBtn('<i data-lucide="trash-2" style="width:11px;height:11px"></i>',"rgba(239,68,68,0.1)","#EF4444",function(){chiefsDeletePipeline(deal.id);},{border:"1px solid rgba(239,68,68,0.2)",fontSize:"11px",padding:"6px 10px"}));
        det.appendChild(abtn); card.appendChild(det);
      }
      wrap.appendChild(card);
    });
  });
  return wrap;
}

// ── VIEW: COMMISSION TRACKER ──────────────────────────────────────────────────
// Real-money-weighted view of the pipeline: raw totals are already shown on
// the Pipeline tab, but a flat sum treats a brand-new "lead" the same as a
// deal already at "closing" — this weights each active deal's commission by
// how likely it realistically is to close from its current stage, so the
// projection means something.
var CHIEFS_STAGE_WEIGHT = { lead: 0.1, viewing: 0.2, offer: 0.4, mou: 0.6, docs: 0.75, closing: 0.9, closed: 1, lost: 0 };

function _chiefsMonthKey(dateStr) {
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function _renderChiefsCommission() {
  var cl = C();
  var wrap = el("div",{style:{padding:"16px",maxWidth:"700px",margin:"0 auto"}});
  wrap.appendChild(div({color:cl.white,fontSize:"14px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"4px"},"Commission Tracker"));
  wrap.appendChild(div({color:cl.muted,fontSize:"11px",marginBottom:"14px",fontFamily:"'Inter',sans-serif"},"Weighted by how likely each deal is to close from its current stage — not just a flat sum of everything in the pipeline."));

  var pipe = CHIEFS_STATE.pipeline;
  if (CHIEFS_STATE.loading.pipeline) {
    wrap.appendChild(div({color:cl.sub,fontSize:"12px",textAlign:"center",padding:"20px"},"Loading...")); return wrap;
  }
  if (!pipe.length) {
    wrap.appendChild(_chCard([div({color:cl.sub,fontSize:"12px",textAlign:"center",padding:"8px"},"No deals in the pipeline yet — add deals to see commission projections here.")])); return wrap;
  }

  var active = pipe.filter(function(p){return p.stage!=="closed"&&p.stage!=="lost";});
  var closed = pipe.filter(function(p){return p.stage==="closed";});
  var weightedProjection = active.reduce(function(s,p){return s+(Number(p.commission_est)||0)*(CHIEFS_STAGE_WEIGHT[p.stage]||0);},0);
  var rawActiveTotal = active.reduce(function(s,p){return s+(Number(p.commission_est)||0);},0);
  var closedTotal = closed.reduce(function(s,p){return s+(Number(p.commission_est)||0);},0);

  var stats = el("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"16px"}});
  [{label:"Weighted Projection",val:_fmtPrice(weightedProjection),color:"#D4AF37",hint:"realistic estimate"},
   {label:"Raw Pipeline Total",val:_fmtPrice(rawActiveTotal),color:"#8899AA",hint:"if everything closed"},
   {label:"Closed Commission",val:_fmtPrice(closedTotal),color:"#10B981",hint:closed.length+" deal(s)"}
  ].forEach(function(s) {
    var sc = el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderRadius:"10px",padding:"10px",textAlign:"center"}});
    sc.appendChild(div({color:s.color,fontSize:"14px",fontWeight:"800",fontFamily:"'Space Grotesk',monospace"},s.val));
    sc.appendChild(div({color:cl.muted,fontSize:"10px",marginTop:"2px"},s.label));
    sc.appendChild(div({color:cl.muted,fontSize:"9px",marginTop:"1px",opacity:"0.7"},s.hint));
    stats.appendChild(sc);
  });
  wrap.appendChild(stats);

  // Monthly closed-commission breakdown — approximated from each closed
  // deal's last-updated month, since there's no dedicated "closed_at"
  // column tracking exactly when a deal moved into the closed stage.
  if (closed.length) {
    wrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px"},"Closed by Month (approx.)"));
    var byMonth = {};
    closed.forEach(function(p) {
      var k = _chiefsMonthKey(p.updated_at || p.created_at) || "Unknown";
      byMonth[k] = (byMonth[k]||0) + (Number(p.commission_est)||0);
    });
    Object.keys(byMonth).forEach(function(k) {
      var row = el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",background:cl.surface,border:"1px solid "+cl.border,borderRadius:"8px",padding:"8px 12px",marginBottom:"6px"}});
      row.appendChild(div({color:cl.white,fontSize:"12px"},k));
      row.appendChild(div({color:"#10B981",fontSize:"12px",fontWeight:"700"},_fmtPrice(byMonth[k])));
      wrap.appendChild(row);
    });
  }

  // Active deals contributing most to the weighted projection.
  if (active.length) {
    wrap.appendChild(div({color:cl.sub,fontSize:"9px",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'Space Grotesk',monospace",marginBottom:"8px",marginTop:"8px"},"Active Deals By Weighted Value"));
    active.slice().sort(function(a,b){
      var wa=(Number(a.commission_est)||0)*(CHIEFS_STAGE_WEIGHT[a.stage]||0), wb=(Number(b.commission_est)||0)*(CHIEFS_STAGE_WEIGHT[b.stage]||0);
      return wb-wa;
    }).forEach(function(p) {
      var w = (Number(p.commission_est)||0)*(CHIEFS_STAGE_WEIGHT[p.stage]||0);
      var row = el("div",{style:{background:cl.surface,border:"1px solid "+cl.border,borderLeft:"3px solid "+_stageColor(p.stage),borderRadius:"8px",padding:"8px 12px",marginBottom:"6px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}});
      row.addEventListener("click",function(){CHIEFS_STATE.view="pipeline";render();});
      var info = el("div",{});
      info.appendChild(div({color:cl.white,fontSize:"12px",fontWeight:"600"},p.client_name));
      info.appendChild(div({color:_stageColor(p.stage),fontSize:"10px",marginTop:"1px",textTransform:"uppercase"},p.stage+" · "+Math.round((CHIEFS_STAGE_WEIGHT[p.stage]||0)*100)+"% likely"));
      row.appendChild(info);
      row.appendChild(div({color:"#D4AF37",fontSize:"12px",fontWeight:"700"},_fmtPrice(w)));
      wrap.appendChild(row);
    });
  }

  return wrap;
}

// ── DOCUMENT ASSISTANT ────────────────────────────────────────────────────────
// AI-drafted starting-point documents (offer letter / MOU-style summary /
// listing agreement) auto-filled from a real pipeline deal's own data.
// Deliberately never presented as a legally-binding substitute for the
// official RERA Form F/A or a lawyer-reviewed contract — see the disclaimer
// baked into both the system prompt and the printed footer below.
var CHIEFS_DOC_TYPES = {
  offer: { label: "Offer Letter", desc: "Buyer's formal offer to purchase" },
  mou: { label: "MOU Draft (reference only)", desc: "Draft summary of agreed terms — not the official RERA Form F" },
  listing_agreement: { label: "Listing Agreement", desc: "Agency agreement between agent and seller" }
};
var CHIEFS_DOCGEN = {
  open: false, dealId: null, docType: "offer", extraTerms: "",
  generating: false, text: null, error: null
};

function chiefsOpenDocGen(dealId) {
  CHIEFS_DOCGEN.open = true;
  CHIEFS_DOCGEN.dealId = dealId;
  CHIEFS_DOCGEN.docType = "offer";
  CHIEFS_DOCGEN.extraTerms = "";
  CHIEFS_DOCGEN.text = null;
  CHIEFS_DOCGEN.error = null;
  render();
}

async function chiefsGenerateDocument() {
  var deal = CHIEFS_STATE.pipeline.find(function(p) { return p.id === CHIEFS_DOCGEN.dealId; });
  if (!deal) return;
  CHIEFS_DOCGEN.generating = true;
  CHIEFS_DOCGEN.error = null;
  render();
  try {
    var docType = CHIEFS_DOC_TYPES[CHIEFS_DOCGEN.docType];
    var agentName = (typeof USER_PROFILE !== "undefined" && USER_PROFILE.name) ||
      (typeof DV_AUTH !== "undefined" && DV_AUTH.user && (DV_AUTH.user.name || DV_AUTH.user.email)) || "[TO BE FILLED]";
    var facts = "Document type: " + docType.label +
      "\nClient: " + deal.client_name +
      "\nProperty: " + (deal.property_desc || "[TO BE FILLED]") +
      "\nDeal Value: " + (deal.deal_value ? _fmtPrice(deal.deal_value) : "[TO BE FILLED]") +
      "\nCurrent Stage: " + deal.stage +
      "\nAgent/Broker: " + agentName +
      "\nDate: " + new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) +
      (deal.notes ? "\nDeal Notes: " + deal.notes : "") +
      (CHIEFS_DOCGEN.extraTerms ? "\nAdditional terms requested by agent: " + CHIEFS_DOCGEN.extraTerms : "");
    var sys = "You are drafting a real estate " + docType.label + " for a Dubai property transaction, to save a busy agent time on their own paperwork. Use ONLY the facts given below — never invent a price, name, date, or legal clause not present in the input; where a needed detail wasn't given, write '[TO BE FILLED]' instead of guessing or fabricating one. Write in formal, professional real estate document language with clear numbered sections. This is explicitly a DRAFT/starting point for the agent to review and adapt — it is NOT the official RERA-mandated Form F/Form A and is NOT a substitute for independent legal review, so do not claim legal force or use binding language like 'this constitutes a legally binding agreement'. Keep it realistic in length (300-500 words). Output plain text with line breaks between sections, no markdown symbols.";
    var reply = await askAI([{ role: "user", content: "Facts:\n" + facts }], sys);
    CHIEFS_DOCGEN.text = reply;
  } catch (e) {
    CHIEFS_DOCGEN.error = e.message || "Could not generate document";
  }
  CHIEFS_DOCGEN.generating = false;
  render();
}

// Reuses the exact same #print-report + window.print() mechanism already
// wired globally (index.html) for the Analyzer's PDF export — no new
// library, no new plumbing.
function chiefsPrintDocument() {
  if (!CHIEFS_DOCGEN.text) return;
  var docType = CHIEFS_DOC_TYPES[CHIEFS_DOCGEN.docType];
  var dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  var bodyHtml = CHIEFS_DOCGEN.text.split("\n").map(function(l) {
    var esc = l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return l.trim() ? '<p style="margin:0 0 10px;line-height:1.6">' + esc + '</p>' : '';
  }).join("");
  var h = '<div style="width:210mm;min-height:297mm;padding:20mm;box-sizing:border-box;font-family:Georgia,serif;color:#111">';
  h += '<div style="text-align:center;margin-bottom:24px"><div style="font-size:18px;font-weight:800;letter-spacing:0.05em">' + docType.label.toUpperCase() + '</div><div style="font-size:11px;color:#666;margin-top:4px">' + dateStr + '</div></div>';
  h += '<div style="font-size:12px">' + bodyHtml + '</div>';
  h += '<div style="margin-top:40px;border-top:1px solid #ccc;padding-top:10px;font-size:9px;color:#999">AI-DRAFTED DOCUMENT — FOR REFERENCE ONLY. Not the official RERA Form F/Form A and not a substitute for independent legal review before use in an actual transaction. Generated via DubAIVal AI Chief of Staff.</div>';
  h += '</div>';
  var printEl = document.getElementById("print-report");
  if (printEl) printEl.innerHTML = h;
  setTimeout(function() {
    window.print();
    setTimeout(function() { if (printEl) printEl.innerHTML = ""; }, 2000);
  }, 100);
}

function renderChiefsDocGenOverlay() {
  if (!CHIEFS_DOCGEN.open) return null;
  var cl = C();
  var deal = CHIEFS_STATE.pipeline.find(function(p) { return p.id === CHIEFS_DOCGEN.dealId; });

  var backdrop = el("div", { id: "chiefs-docgen-backdrop", style: { position: "fixed", inset: "0", background: "rgba(0,0,0,0.65)", zIndex: "9990", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" } });
  backdrop.addEventListener("click", function() { CHIEFS_DOCGEN.open = false; render(); });

  var sheet = el("div", { style: { position: "fixed", bottom: "0", left: "0", right: "0", background: cl.bg, borderTop: "1px solid " + cl.border, borderTopLeftRadius: "20px", borderTopRightRadius: "20px", zIndex: "9991", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 -12px 40px rgba(0,0,0,0.7)" } });
  sheet.addEventListener("click", function(e) { e.stopPropagation(); });

  var handle = el("div", { style: { display: "flex", justifyContent: "center", padding: "10px 0 4px" } });
  handle.appendChild(el("div", { style: { width: "36px", height: "4px", background: cl.border, borderRadius: "2px" } }));
  sheet.appendChild(handle);

  var hdr = el("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "0 16px 12px", flexShrink: "0", borderBottom: "1px solid " + cl.border } });
  var hIcon = el("div", { style: { width: "36px", height: "36px", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: "0" } });
  hIcon.innerHTML = '<i data-lucide="file-text" style="width:18px;height:18px;color:#D4AF37"></i>';
  hdr.appendChild(hIcon);
  var hInfo = el("div", { style: { flex: "1", minWidth: "0" } });
  hInfo.appendChild(div({ color: "#D4AF37", fontSize: "13px", fontWeight: "700", fontFamily: "'Space Grotesk',monospace" }, "Document Assistant"));
  hInfo.appendChild(div({ color: cl.muted, fontSize: "11px", marginTop: "2px", fontFamily: "'Inter',sans-serif" }, deal ? deal.client_name : ""));
  hdr.appendChild(hInfo);
  var closeBtn = el("button", { style: { background: "rgba(255,255,255,0.06)", border: "1px solid " + cl.border, color: cl.sub, borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "14px", fontWeight: "600" } });
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", function() { CHIEFS_DOCGEN.open = false; render(); });
  hdr.appendChild(closeBtn);
  sheet.appendChild(hdr);

  var body = el("div", { style: { padding: "16px", overflowY: "auto", flex: "1" } });

  if (!deal) {
    body.appendChild(div({ color: cl.sub, fontSize: "12px" }, "This deal is no longer available."));
    sheet.appendChild(body);
    var wrap0 = el("div", {}); wrap0.appendChild(backdrop); wrap0.appendChild(sheet);
    return wrap0;
  }

  if (!CHIEFS_DOCGEN.text && !CHIEFS_DOCGEN.generating) {
    body.appendChild(div({ color: cl.sub, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Grotesk',monospace", marginBottom: "8px" }, "Document Type"));
    var typeGrid = el("div", { style: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" } });
    Object.keys(CHIEFS_DOC_TYPES).forEach(function(key) {
      var t = CHIEFS_DOC_TYPES[key];
      var isSel = CHIEFS_DOCGEN.docType === key;
      var opt = el("div", { style: { background: isSel ? "rgba(212,175,55,0.1)" : cl.surface, border: "1px solid " + (isSel ? "#D4AF37" : cl.border), borderRadius: "10px", padding: "10px 12px", cursor: "pointer" } });
      opt.appendChild(div({ color: isSel ? "#D4AF37" : cl.white, fontSize: "12px", fontWeight: "700", fontFamily: "'Space Grotesk',monospace" }, t.label));
      opt.appendChild(div({ color: cl.muted, fontSize: "11px", marginTop: "2px", fontFamily: "'Inter',sans-serif" }, t.desc));
      opt.addEventListener("click", function() { CHIEFS_DOCGEN.docType = key; render(); });
      typeGrid.appendChild(opt);
    });
    body.appendChild(typeGrid);

    body.appendChild(div({ color: cl.sub, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Grotesk',monospace", marginBottom: "6px" }, "Additional Terms (optional)"));
    var termsInp = el("textarea", { placeholder: "e.g. 10% deposit within 5 business days, subject to bank valuation...", style: { width: "100%", boxSizing: "border-box", background: "#070B14", border: "1px solid " + cl.border, borderRadius: "8px", padding: "10px", color: cl.white, fontSize: "12px", fontFamily: "'Inter',sans-serif", resize: "vertical", minHeight: "60px", marginBottom: "14px" } });
    termsInp.value = CHIEFS_DOCGEN.extraTerms;
    termsInp.addEventListener("input", function() { CHIEFS_DOCGEN.extraTerms = this.value; });
    body.appendChild(termsInp);

    var genBtn = _chBtn("✦ Generate Draft", "#D4AF37", "#000", function() { chiefsGenerateDocument(); }, { width: "100%", padding: "12px", fontSize: "13px" });
    body.appendChild(genBtn);
  } else if (CHIEFS_DOCGEN.generating) {
    body.appendChild(div({ color: cl.sub, fontSize: "12px", textAlign: "center", padding: "30px 0" }, "Drafting your " + CHIEFS_DOC_TYPES[CHIEFS_DOCGEN.docType].label.toLowerCase() + "…"));
  } else if (CHIEFS_DOCGEN.error) {
    body.appendChild(div({ color: "#EF4444", fontSize: "12px", marginBottom: "10px" }, CHIEFS_DOCGEN.error));
    body.appendChild(_chBtn("Try Again", "rgba(255,255,255,0.06)", "#8899AA", function() { CHIEFS_DOCGEN.error = null; render(); }, { border: "1px solid rgba(255,255,255,0.1)" }));
  } else if (CHIEFS_DOCGEN.text) {
    var disclaimer = el("div", { style: { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", padding: "8px 10px", marginBottom: "10px", fontSize: "10.5px", color: "#F59E0B", lineHeight: "1.5" } });
    disclaimer.textContent = "AI-drafted starting point — not the official RERA Form F/Form A, and not a substitute for review by a licensed conveyancer/lawyer before use.";
    body.appendChild(disclaimer);
    var docBox = el("textarea", { style: { width: "100%", boxSizing: "border-box", background: "#070B14", border: "1px solid " + cl.border, borderRadius: "8px", padding: "12px", color: cl.white, fontSize: "12px", fontFamily: "'Inter',sans-serif", lineHeight: "1.6", resize: "vertical", minHeight: "260px", marginBottom: "12px" } });
    docBox.value = CHIEFS_DOCGEN.text;
    docBox.addEventListener("input", function() { CHIEFS_DOCGEN.text = this.value; });
    body.appendChild(docBox);
    var actionRow = el("div", { style: { display: "flex", gap: "8px" } });
    actionRow.appendChild(_chBtn("Regenerate", "rgba(255,255,255,0.06)", "#8899AA", function() { CHIEFS_DOCGEN.text = null; chiefsGenerateDocument(); }, { border: "1px solid rgba(255,255,255,0.1)", flex: "1" }));
    actionRow.appendChild(_chBtn('<i data-lucide="printer" style="width:12px;height:12px"></i> Print / Save as PDF', "#D4AF37", "#000", function() { chiefsPrintDocument(); }, { flex: "1" }));
    body.appendChild(actionRow);
  }

  sheet.appendChild(body);
  var wrap = el("div", {});
  wrap.appendChild(backdrop);
  wrap.appendChild(sheet);
  if (typeof lucide !== "undefined" && lucide.createIcons) setTimeout(function() { lucide.createIcons(); }, 50);
  return wrap;
}

// ── CO-PILOT ─────────────────────────────────────────────────────────────────
var CHIEFS_COPILOT = {
  open: false, text: "", source: "", senderName: "", senderContact: "", adReferral: null,
  analyzing: false, needs: null, matches: [], draft: null, drafting: false,
  error: null, saving: false, sent: false
};

// Shared low-level send used by both the Matches pipeline and the Co-pilot —
// tries the real, connected WhatsApp Business API first; returns false
// (never throws) so callers can fall back to clipboard/wa.me gracefully.
async function _chiefsRawWhatsAppSend(phone, text) {
  if (!phone || !text) return false;
  try {
    var accessToken = localStorage.getItem("dv_access_token");
    var resp = await fetch("/api/inbox?action=whatsapp-send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken, to: phone.replace(/\D/g,""), message: text })
    });
    var data = await resp.json().catch(function(){ return {}; });
    return resp.ok && data.ok !== false;
  } catch (e) { return false; }
}

// Reports a real Client Memory Bank conversion back to Meta's Conversions
// API, so ad targeting learns from actual outcomes, not just clicks — see
// api/inbox.js handleMetaConversion() for the server-side half. Requires
// the agent's own Meta Ads Pixel ID + Conversions API token (Social Setup)
// — silently no-ops (server returns ok:false with a reason) if not
// connected yet, never surfaced as an error to the agent since this is a
// pure background analytics signal, not something the client-save flow
// should ever be blocked or bothered by.
async function _chiefsReportConversion(client) {
  try {
    var accessToken = localStorage.getItem("dv_access_token");
    await fetch("/api/inbox?action=meta-conversion", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: accessToken,
        ctwa_clid: client.ad_referral && client.ad_referral.ctwa_clid,
        phone: client.client_phone || null,
        event_name: "Lead"
      })
    });
  } catch (e) {}
}

async function chiefsCopilotAnalyze(text, source, senderName, senderContact, adReferral) {
  if (!text || !text.trim()) return;
  CHIEFS_COPILOT.open = true;
  CHIEFS_COPILOT.text = text;
  CHIEFS_COPILOT.source = source || "message";
  CHIEFS_COPILOT.senderName = senderName || "Prospect";
  CHIEFS_COPILOT.senderContact = senderContact || "";
  CHIEFS_COPILOT.adReferral = adReferral || null;
  CHIEFS_COPILOT.analyzing = true;
  CHIEFS_COPILOT.needs = null;
  CHIEFS_COPILOT.matches = [];
  CHIEFS_COPILOT.draft = null;
  CHIEFS_COPILOT.error = null;
  CHIEFS_COPILOT.sent = false;
  render();

  // Ensure inventory is loaded
  if (!CHIEFS_STATE.loaded.inventory) {
    chiefsLoadInventory();
    await new Promise(function(resolve) {
      var deadline = Date.now() + 8000;
      var poll = setInterval(function() {
        if (CHIEFS_STATE.loaded.inventory || Date.now() > deadline) { clearInterval(poll); resolve(); }
      }, 300);
    });
  }

  try {
    // ── Step 1: Extract structured needs (Llama 3.3 70B — best available) ───
    var r = await callGroqRaw({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.1, max_tokens: 500,
      messages: [
        { role: "system", content: "You are an expert Dubai real estate assistant. Extract property requirements from the message with high precision. Return JSON: purpose (\"sale\" or \"rent\"), prop_type (\"apartment\",\"villa\",\"townhouse\",\"penthouse\" or null), beds (\"Studio\",\"1 BR\",\"2 BR\",\"3 BR\",\"4 BR\",\"5+ BR\" or null — must match this exact format, not a bare number), areas (array of Dubai area names — interpret context clues like 'near the beach'→JBR/Palm/Marina, 'family'→Arabian Ranches/Springs, 'investment'→Business Bay/JVC, max 5), max_price (number AED or null), min_price (number AED or null), furnished (\"Furnished\",\"Unfurnished\",\"Semi-Furnished\" or null), summary (1 precise sentence describing what the client wants)." },
        { role: "user", content: "Message: " + text.substring(0, 2500) }
      ]
    });
    var data = await r.json();
    var raw = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    var needs = raw ? JSON.parse(raw) : {};
    CHIEFS_COPILOT.needs = needs;

    // ── Step 2: Build inventory map (loaded items + RPC rows) ──────────────
    var invMap = {};
    (CHIEFS_STATE.inventory || []).forEach(function(l) { invMap[l.id] = l; });

    // ── Step 3: Semantic search — embed the extracted summary, search DB ───
    var semScores = {}; // id → {score, reasons}
    if (needs.summary) {
      var queryEmb = await _chiefsEmbedText(needs.summary, "RETRIEVAL_QUERY");
      if (queryEmb) {
        var semRows = await _chiefsSemanticRPC("match_chiefs_inventory", {
          query_embedding: queryEmb,
          agent_id_filter: _chiefsId(),
          purpose_filter: needs.purpose || null,
          match_count: 8
        });
        semRows.forEach(function(row) {
          if (!invMap[row.id]) invMap[row.id] = row; // use RPC row if not in loaded inventory
          var pct = Math.round(row.similarity * 100);
          semScores[row.id] = { score: pct, reasons: ["semantic " + pct + "%"] };
        });
      }
    }

    // ── Step 4: Rule-based scoring ─────────────────────────────────────────
    var ruleScores = {}; // id → {score, reasons}
    Object.keys(invMap).forEach(function(lid) {
      var listing = invMap[lid];
      if (!listing || listing.status !== "available") return;
      if (needs.purpose && listing.purpose !== needs.purpose) return;
      var score = 0; var reasons = [];
      if (needs.purpose) { score += 20; reasons.push("purpose"); }
      var listArea = (listing.area || "").toLowerCase();
      var wantedAreas = (needs.areas || []).map(function(a) { return a.toLowerCase(); });
      if (wantedAreas.length) {
        var areaMatch = wantedAreas.some(function(a) { return listArea.includes(a) || a.includes(listArea); });
        if (areaMatch) { score += 35; reasons.push("area match"); }
      }
      if (needs.beds && listing.beds) {
        if (listing.beds === needs.beds) { score += 25; reasons.push("beds match"); }
        else { var nb = parseInt(needs.beds), lb = parseInt(listing.beds); if (!isNaN(nb)&&!isNaN(lb)&&Math.abs(nb-lb)<=1) { score += 10; reasons.push("beds close"); } }
      }
      if (needs.max_price && listing.price) {
        if (listing.price <= needs.max_price) { score += 15; reasons.push("within budget"); }
        else if (listing.price <= needs.max_price * 1.1) { score += 5; reasons.push("near budget"); }
        else score -= 10;
      }
      if (needs.prop_type && listing.prop_type === needs.prop_type) { score += 5; reasons.push("type match"); }
      if (needs.furnished && listing.furnished === needs.furnished) { score += 5; reasons.push("furnished"); }
      if (score >= 15) ruleScores[lid] = { score: score, reasons: reasons };
    });

    // ── Step 5: Hybrid merge (semantic 65% + rule 35%) ─────────────────────
    var allIds = Object.keys(semScores).concat(Object.keys(ruleScores).filter(function(k){ return !semScores[k]; }));
    var seen = {};
    var scored = [];
    allIds.forEach(function(lid) {
      if (seen[lid]) return; seen[lid] = true;
      var listing = invMap[lid]; if (!listing) return;
      var sem  = semScores[lid];
      var rule = ruleScores[lid];
      var finalScore, reasons;
      if (sem && rule) {
        finalScore = Math.round(sem.score * 0.65 + rule.score * 0.35);
        reasons = sem.reasons.concat(rule.reasons);
      } else if (sem) {
        finalScore = sem.score; reasons = sem.reasons;
      } else {
        finalScore = rule.score; reasons = rule.reasons;
      }
      scored.push({ listing: listing, score: finalScore, reasons: reasons });
    });
    scored.sort(function(a, b) { return b.score - a.score; });
    CHIEFS_COPILOT.matches = scored.slice(0, 4);
  } catch(e) {
    CHIEFS_COPILOT.error = "Analysis failed: " + (e.message || "Unknown error");
  }
  CHIEFS_COPILOT.analyzing = false;
  render();
}

async function chiefsCopilotDraft() {
  if (!CHIEFS_COPILOT.needs) return;
  CHIEFS_COPILOT.drafting = true;
  CHIEFS_COPILOT.draft = null;
  render();
  try {
    var n = CHIEFS_COPILOT.needs;
    var matchLines = CHIEFS_COPILOT.matches.map(function(m) {
      var l = m.listing;
      return "- " + (l.beds ? l.beds + "BR " : "") + (l.prop_type || "apt") + " in " + l.area + (l.building ? " (" + l.building + ")" : "") + (l.price ? " — AED " + Number(l.price).toLocaleString() + (l.purpose === "rent" ? "/yr" : "") : "") + (l.dv_verdict ? " [" + l.dv_verdict + "]" : "") + (l.size_sqft ? " " + l.size_sqft + " sqft" : "");
    }).join("\n");
    // Use Llama 3.3 70B for higher-quality, more natural draft messages
    var draftR = await callGroqRaw({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7, max_tokens: 250,
      messages: [
        { role: "system", content: "You are a professional Dubai real estate agent writing a WhatsApp message. Be warm, concise, and specific. Mention the listing details naturally — don't list them mechanically. Max 130 words. No generic openers. End with one clear call to action." },
        { role: "user", content: "Draft a WhatsApp reply to " + (CHIEFS_COPILOT.senderName || "the prospect") + " who is looking for: " + (n.summary || JSON.stringify(n)) + "\n\nMy matching pocket listings:\n" + (matchLines || "None yet — I'll search the market for you.") + "\n\nWrite the WhatsApp message only. No preamble." }
      ]
    });
    var draftData = await draftR.json();
    var draft = draftData.choices && draftData.choices[0] && draftData.choices[0].message && draftData.choices[0].message.content;
    CHIEFS_COPILOT.draft = draft || "";
    // Automation: for a real WhatsApp conversation (not email/Instagram/
    // Facebook, which have no send API wired here), send the reply the
    // moment it's drafted, unless the agent has turned auto-send off.
    var isWhatsAppPhone = CHIEFS_COPILOT.source === "whatsapp" && CHIEFS_COPILOT.senderContact && !CHIEFS_COPILOT.senderContact.includes("@");
    if (CHIEFS_AUTOMATION.autoSend && isWhatsAppPhone && CHIEFS_COPILOT.draft) {
      var ok = await _chiefsRawWhatsAppSend(CHIEFS_COPILOT.senderContact, CHIEFS_COPILOT.draft);
      if (ok) {
        CHIEFS_COPILOT.sent = true;
        _chiefsToast("🤖","Auto-replied via WhatsApp","Sent to "+(CHIEFS_COPILOT.senderName||"the client"));
      }
    }
  } catch(e) {
    CHIEFS_COPILOT.draft = "Could not generate draft. Please write your reply manually.";
  }
  CHIEFS_COPILOT.drafting = false;
  render();
}

// Fixed a real crash: areas_wanted used to be built via (n.areas||[]).join(", "),
// producing a plain STRING — but every other consumer of cliForm.areas_wanted
// (the tag UI, chiefsSaveClient's .length check, chiefsEditClient) expects a
// real ARRAY. Confirmed live: clicking "Save to Client Memory" whenever the AI
// had extracted at least one area threw "f.areas_wanted.forEach is not a
// function" and broke the whole render. Now built as a real array, matching
// chiefsScannerApply()/chiefsScannerAutoSave()'s already-correct shape.
async function chiefsCopilotSaveClient() {
  if (!CHIEFS_COPILOT.needs) return;
  var n = CHIEFS_COPILOT.needs;
  var row = {
    open: false, editing: null,
    client_name: CHIEFS_COPILOT.senderName || "Unknown",
    client_phone: CHIEFS_COPILOT.senderContact && !CHIEFS_COPILOT.senderContact.includes("@") ? CHIEFS_COPILOT.senderContact : "",
    client_email: CHIEFS_COPILOT.senderContact && CHIEFS_COPILOT.senderContact.includes("@") ? CHIEFS_COPILOT.senderContact : "",
    purpose: n.purpose || "sale", prop_type: n.prop_type || "apartment",
    beds_wanted: n.beds || "", areas_wanted: Array.isArray(n.areas) ? n.areas.filter(function(a){return a;}) : [],
    area_input: "", min_price: n.min_price || "", max_price: n.max_price || "",
    min_size: "", max_size: "", view_pref: "", furnished_pref: n.furnished || "",
    timeline: "flexible", status: "active",
    notes: "Captured from " + CHIEFS_COPILOT.source + ". " + (n.summary || ""), source: "whatsapp",
    // Carries the Click-to-WhatsApp ad referral through to chiefsSaveClient(),
    // which reports the conversion back to Meta when this is present.
    ad_referral: CHIEFS_COPILOT.adReferral || null
  };
  var savedName = row.client_name;
  var srcLabel = CHIEFS_COPILOT.source || "message";
  CHIEFS_COPILOT.open = false;
  // Per the standing per-process automation directive: auto-save straight to
  // the Client Memory Bank when the agent hasn't turned this off (same
  // autoSaveExtracted toggle the Conversation Scanner already respects) —
  // this button previously ALWAYS required opening the form and a second
  // manual submit, regardless of the toggle, an inconsistency with this
  // file's own stated "every automatable process gets one toggle" rule.
  if (CHIEFS_AUTOMATION.autoSaveExtracted) {
    CHIEFS_STATE.cliForm = row;
    await chiefsSaveClient();
    _chiefsToast("🤖","Auto-saved: "+savedName,"Extracted from "+srcLabel+" and added to Client Memory Bank.",function(){
      CHIEFS_STATE.view="clients";
      if(window.APP_STATE){window.APP_STATE.currentSection="Network";window.APP_STATE.currentSubTab="Chiefs";}
      render();
    });
  } else {
    row.open = true;
    CHIEFS_STATE.cliForm = row;
    CHIEFS_STATE.view = "clients";
    if (window.APP_STATE) { window.APP_STATE.currentSection = "Network"; window.APP_STATE.currentSubTab = "Chiefs"; }
    render();
  }
}

function renderChiefsCopilotOverlay() {
  if (!CHIEFS_COPILOT.open) return null;
  var cl = C();

  var backdrop = el("div", { id: "chiefs-copilot-backdrop", style: { position: "fixed", inset: "0", background: "rgba(0,0,0,0.65)", zIndex: "9990", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" } });
  backdrop.addEventListener("click", function() { CHIEFS_COPILOT.open = false; render(); });

  var sheet = el("div", { style: { position: "fixed", bottom: "0", left: "0", right: "0", background: cl.bg, borderTop: "1px solid " + cl.border, borderTopLeftRadius: "20px", borderTopRightRadius: "20px", zIndex: "9991", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 -12px 40px rgba(0,0,0,0.7)" } });
  sheet.addEventListener("click", function(e) { e.stopPropagation(); });

  // Drag handle
  var handle = el("div", { style: { display: "flex", justifyContent: "center", padding: "10px 0 4px" } });
  handle.appendChild(el("div", { style: { width: "36px", height: "4px", background: cl.border, borderRadius: "2px" } }));
  sheet.appendChild(handle);

  // Header
  var hdr = el("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "0 16px 12px", flexShrink: "0", borderBottom: "1px solid " + cl.border } });
  var hIcon = el("div", { style: { width: "36px", height: "36px", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: "0" } });
  hIcon.innerHTML = '<i data-lucide="bot" style="width:18px;height:18px;color:#D4AF37"></i>';
  hdr.appendChild(hIcon);
  var hInfo = el("div", { style: { flex: "1", minWidth: "0" } });
  hInfo.appendChild(div({ color: "#D4AF37", fontSize: "13px", fontWeight: "700", fontFamily: "'Space Grotesk',monospace" }, "AI Chief Co-pilot"));
  var srcLabel = { email: "Email", instagram: "Instagram", whatsapp: "WhatsApp", facebook: "Facebook" }[CHIEFS_COPILOT.source] || CHIEFS_COPILOT.source;
  hInfo.appendChild(div({ color: cl.muted, fontSize: "11px", marginTop: "2px", fontFamily: "'Inter',sans-serif" }, srcLabel + " · " + (CHIEFS_COPILOT.senderName || "Prospect")));
  hdr.appendChild(hInfo);
  var closeBtn = el("button", { style: { background: "rgba(255,255,255,0.06)", border: "1px solid " + cl.border, color: cl.sub, borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "14px", fontWeight: "600" } });
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", function() { CHIEFS_COPILOT.open = false; render(); });
  hdr.appendChild(closeBtn);
  sheet.appendChild(hdr);

  // Scrollable body
  var body = el("div", { style: { flex: "1", overflowY: "auto", padding: "14px 16px 20px", WebkitOverflowScrolling: "touch" } });

  if (CHIEFS_COPILOT.analyzing) {
    var spin = el("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 0", gap: "14px" } });
    var sp = el("div", { style: { width: "34px", height: "34px", border: "3px solid rgba(212,175,55,0.2)", borderTop: "3px solid #D4AF37", borderRadius: "50%", animation: "spin 0.8s linear infinite" } });
    spin.appendChild(sp);
    spin.appendChild(div({ color: cl.sub, fontSize: "13px", fontFamily: "'Inter',sans-serif" }, "Analyzing message with AI..."));
    body.appendChild(spin);
  } else if (CHIEFS_COPILOT.error) {
    var errBox = el("div", { style: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", padding: "14px", marginBottom: "12px" } });
    errBox.appendChild(div({ color: "#EF4444", fontSize: "13px", fontFamily: "'Inter',sans-serif" }, CHIEFS_COPILOT.error));
    body.appendChild(errBox);
  } else if (CHIEFS_COPILOT.needs) {
    var n = CHIEFS_COPILOT.needs;

    // CLIENT WANTS card
    var wCard = el("div", { style: { background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "12px", padding: "12px", marginBottom: "12px" } });
    wCard.appendChild(div({ color: "#D4AF37", fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em", marginBottom: "8px", fontFamily: "'Space Grotesk',monospace" }, "CLIENT WANTS"));
    if (n.summary) wCard.appendChild(div({ color: cl.white, fontSize: "13px", lineHeight: "1.6", marginBottom: "10px", fontFamily: "'Inter',sans-serif" }, n.summary));
    var tags = el("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" } });
    var addTag = function(label, color) { if (!label) return; tags.appendChild(_chBadge(label, color)); };
    addTag(n.purpose === "rent" ? "For Rent" : "For Sale", n.purpose === "rent" ? "#8B5CF6" : "#D4AF37");
    if (n.beds) addTag(n.beds, "#3B82F6");
    if (n.prop_type) addTag(n.prop_type.charAt(0).toUpperCase() + n.prop_type.slice(1), "#6B7A9E");
    if (n.furnished) addTag(n.furnished, "#6B7A9E");
    if (n.max_price) addTag("≤ AED " + Number(n.max_price).toLocaleString(), "#10B981");
    (n.areas || []).forEach(function(a) { addTag("◆ " + a, "#D4AF37"); });
    wCard.appendChild(tags);
    body.appendChild(wCard);

    // MATCHING POCKET LISTINGS
    var mSec = el("div", { style: { marginBottom: "12px" } });
    mSec.appendChild(div({ color: cl.sub, fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em", marginBottom: "8px", fontFamily: "'Space Grotesk',monospace" }, "YOUR POCKET LISTINGS (" + CHIEFS_COPILOT.matches.length + " matched)"));
    if (CHIEFS_COPILOT.matches.length === 0) {
      mSec.appendChild(div({ color: cl.muted, fontSize: "12px", fontStyle: "italic", fontFamily: "'Inter',sans-serif", padding: "8px 0" }, "No matching pocket listings. Add inventory in Chiefs › Inventory to surface matches here."));
    } else {
      CHIEFS_COPILOT.matches.forEach(function(m) {
        var l = m.listing;
        var scColor = m.score >= 60 ? "#10B981" : m.score >= 40 ? "#F59E0B" : "#6B7A9E";
        var mc = el("div", { style: { background: cl.surface, border: "1px solid " + cl.border, borderRadius: "10px", padding: "10px 12px", marginBottom: "7px", display: "flex", alignItems: "center", gap: "10px" } });
        var ring = el("div", { style: { width: "36px", height: "36px", borderRadius: "50%", background: scColor + "22", border: "2px solid " + scColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: "0" } });
        ring.appendChild(span({ color: scColor, fontSize: "10px", fontWeight: "800" }, m.score + "%"));
        mc.appendChild(ring);
        var info = el("div", { style: { flex: "1", minWidth: "0" } });
        info.appendChild(div({ color: cl.white, fontSize: "12px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Inter',sans-serif" }, (l.beds ? l.beds + "BR " : "") + (l.prop_type || "Apt") + " — " + l.area + (l.building ? " · " + l.building : "")));
        var deets = [l.price ? "AED " + Number(l.price).toLocaleString() + (l.purpose === "rent" ? "/yr" : "") : null, l.size_sqft ? l.size_sqft + " sqft" : null, l.floor_num ? "Floor " + l.floor_num : null].filter(Boolean).join(" · ");
        info.appendChild(div({ color: cl.sub, fontSize: "11px", marginTop: "2px", fontFamily: "'Inter',sans-serif" }, deets || "—"));
        mc.appendChild(info);
        var vColor = { "Undervalued": "#10B981", "Fair Value": "#F59E0B", "Elevated": "#EF4444", "Bubble Risk": "#7C3AED" }[l.dv_verdict] || null;
        if (l.dv_verdict && vColor) mc.appendChild(_chBadge(l.dv_verdict, vColor));
        mSec.appendChild(mc);
      });
    }
    body.appendChild(mSec);

    // DRAFT REPLY
    var dSec = el("div", { style: { marginBottom: "14px" } });
    dSec.appendChild(div({ color: cl.sub, fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em", marginBottom: "8px", fontFamily: "'Space Grotesk',monospace" }, "AI DRAFT REPLY"));
    if (!CHIEFS_COPILOT.draft && !CHIEFS_COPILOT.drafting) {
      dSec.appendChild(_chBtn('<i data-lucide="bot" style="width:12px;height:12px"></i>Generate Reply Draft', "rgba(212,175,55,0.12)", "#D4AF37", function() { chiefsCopilotDraft(); }, { border: "1px solid rgba(212,175,55,0.3)", width: "100%", justifyContent: "center", textAlign: "center" }));
    } else if (CHIEFS_COPILOT.drafting) {
      var dSpin = el("div", { style: { display: "flex", alignItems: "center", gap: "8px", padding: "12px 0" } });
      var dsp = el("div", { style: { width: "16px", height: "16px", border: "2px solid rgba(212,175,55,0.2)", borderTop: "2px solid #D4AF37", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: "0" } });
      dSpin.appendChild(dsp);
      dSpin.appendChild(div({ color: cl.sub, fontSize: "12px", fontFamily: "'Inter',sans-serif" }, "Drafting personalized reply..."));
      dSec.appendChild(dSpin);
    } else if (CHIEFS_COPILOT.sent) {
      var sentBox = el("div", { style: { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "12px", marginBottom: "8px" } });
      sentBox.appendChild(div({ color: "#10B981", fontSize: "12px", fontWeight: "700", fontFamily: "'Space Grotesk',monospace", marginBottom: "6px" }, "✓ Sent automatically via WhatsApp"));
      sentBox.appendChild(div({ color: cl.sub, fontSize: "12px", lineHeight: "1.5", fontFamily: "'Inter',sans-serif" }, CHIEFS_COPILOT.draft));
      dSec.appendChild(sentBox);
    } else {
      var ta = el("textarea", { style: { width: "100%", boxSizing: "border-box", background: "#070B14", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "10px", padding: "12px", color: "#fff", fontSize: "13px", fontFamily: "'Inter',sans-serif", lineHeight: "1.6", resize: "vertical", minHeight: "120px", outline: "none", display: "block", marginBottom: "8px" } });
      ta.value = CHIEFS_COPILOT.draft;
      ta.addEventListener("input", function() { CHIEFS_COPILOT.draft = this.value; });
      dSec.appendChild(ta);
      var actRow = el("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" } });
      var isWa = CHIEFS_COPILOT.source === "whatsapp" && CHIEFS_COPILOT.senderContact && !CHIEFS_COPILOT.senderContact.includes("@");
      if (isWa) {
        actRow.appendChild(_chBtn('<i data-lucide="send" style="width:11px;height:11px"></i>Approve & Send', "rgba(16,185,129,0.12)", "#10B981", function() {
          var contact = CHIEFS_COPILOT.senderContact, msg = CHIEFS_COPILOT.draft;
          _chiefsRawWhatsAppSend(contact, msg).then(function(ok) {
            if (ok) { CHIEFS_COPILOT.sent = true; render(); }
            else { navigator.clipboard.writeText(msg||"").catch(function(){}); window.open("https://wa.me/"+contact.replace(/\D/g,"")+"?text="+encodeURIComponent(msg||""),"_blank"); }
          });
        }, { border: "1px solid rgba(16,185,129,0.3)", fontSize: "12px" }));
      }
      actRow.appendChild(_chBtn('<i data-lucide="copy" style="width:11px;height:11px"></i>Copy', "rgba(212,175,55,0.1)", "#D4AF37", function() { navigator.clipboard.writeText(CHIEFS_COPILOT.draft || "").catch(function(){}); }, { border: "1px solid rgba(212,175,55,0.25)", fontSize: "12px" }));
      if (CHIEFS_COPILOT.senderContact && !CHIEFS_COPILOT.senderContact.includes("@")) {
        actRow.appendChild(_chBtn('<i data-lucide="message-circle" style="width:11px;height:11px"></i>WhatsApp App', "rgba(37,211,102,0.1)", "#25D366", function() { var ph = CHIEFS_COPILOT.senderContact.replace(/\D/g,""); if(ph) window.open("https://wa.me/"+ph+"?text="+encodeURIComponent(CHIEFS_COPILOT.draft||""),"_blank"); }, { border: "1px solid rgba(37,211,102,0.25)", fontSize: "12px" }));
      }
      actRow.appendChild(_chBtn('<i data-lucide="refresh-cw" style="width:11px;height:11px"></i>Regenerate', "rgba(255,255,255,0.04)", cl.sub, function() { chiefsCopilotDraft(); }, { border: "1px solid " + cl.border, fontSize: "12px" }));
      dSec.appendChild(actRow);
    }
    body.appendChild(dSec);

    // Save to Client Memory
    body.appendChild(_chBtn(CHIEFS_COPILOT.saving ? "Saving..." : '<i data-lucide="save" style="width:13px;height:13px"></i>Save to Client Memory', "rgba(212,175,55,0.1)", "#D4AF37", function() { if(!CHIEFS_COPILOT.saving) chiefsCopilotSaveClient(); }, { border: "1px solid rgba(212,175,55,0.25)", width: "100%", textAlign: "center", justifyContent: "center", fontSize: "13px", padding: "10px 14px" }));
  }

  sheet.appendChild(body);

  var wrap = el("div", {});
  wrap.appendChild(backdrop);
  wrap.appendChild(sheet);
  return wrap;
}

// ── MAIN RENDER ───────────────────────────────────────────────────────────────
function renderChiefs() {
  // Init: load data if not yet loaded
  if (!CHIEFS_STATE.loaded.inventory && !CHIEFS_STATE.loading.inventory) chiefsLoadInventory();
  if (!CHIEFS_STATE.loaded.clients && !CHIEFS_STATE.loading.clients) chiefsLoadClients();
  if (!CHIEFS_STATE.loaded.matches && !CHIEFS_STATE.loading.matches) chiefsLoadMatches();
  if (!CHIEFS_STATE.loaded.pipeline && !CHIEFS_STATE.loading.pipeline) chiefsLoadPipeline();

  // Generate the daily briefing once, right after all 4 datasets are in —
  // never re-triggers on every render (guarded inside _chiefsGenerateBriefing).
  if (CHIEFS_STATE.loaded.inventory && CHIEFS_STATE.loaded.clients &&
      CHIEFS_STATE.loaded.matches && CHIEFS_STATE.loaded.pipeline &&
      !CHIEFS_STATE.briefing.checked && !CHIEFS_STATE.briefing.loading) {
    _chiefsGenerateBriefing(false);
  }

  var cl = C();
  var wrap = el("div",{style:{display:"flex",flexDirection:"column",height:"100%",maxWidth:"100%",overflowX:"hidden"}});

  // Premium header
  var _chiH=el('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px 12px',borderBottom:'1px solid rgba(255,255,255,0.06)',flexShrink:'0'}});
  var _chiHL=el('div',{});
  _chiHL.appendChild(div({fontSize:'10px',color:'#6B7A9E',fontWeight:'700',fontFamily:"'Inter',sans-serif",letterSpacing:'0.10em',textTransform:'uppercase',marginBottom:'2px'},'Agent Workspace'));
  _chiHL.appendChild(div({fontSize:'18px',fontWeight:'800',color:'#FFFFFF',fontFamily:"'Space Grotesk',sans-serif",letterSpacing:'-0.02em',lineHeight:'1'},'AI Chief of Staff'));
  _chiH.appendChild(_chiHL);
  var _chiBadge=el('div',{style:{display:'flex',alignItems:'center',gap:'5px',background:'rgba(212,168,67,0.08)',border:'1px solid rgba(212,168,67,0.20)',borderRadius:'20px',padding:'4px 10px',flexShrink:'0'}});
  var _chiDot=el('div',{style:{width:'5px',height:'5px',borderRadius:'50%',background:'#D4A843',animation:'dvPulse 2s ease infinite'}});
  _chiBadge.appendChild(_chiDot);
  _chiBadge.appendChild(span({fontSize:'9px',color:'#D4A843',fontFamily:"'Space Grotesk',sans-serif",fontWeight:'700',letterSpacing:'0.08em'},'AGENT'));
  _chiH.appendChild(_chiBadge);
  wrap.appendChild(_chiH);

  // Internal view tabs
  var VIEWS = [
    {id:"dashboard",label:"Dashboard",icon:"layout-dashboard"},
    {id:"inventory",label:"Inventory",icon:"package"},
    {id:"clients",label:"Clients",icon:"users"},
    {id:"matches",label:"Matches",icon:"link-2"},
    {id:"pipeline",label:"Pipeline",icon:"clipboard-list"},
    {id:"commission",label:"Commission",icon:"trending-up"},
    {id:"inbox",label:"Inbox",icon:"inbox"}
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
    t.innerHTML = '<i data-lucide="'+v.icon+'" style="width:12px;height:12px;vertical-align:middle;margin-right:4px"></i>'+v.label;
    if (pendingBadge > 0) {
      var badge = el("span",{style:{background:"#10B981",color:"#fff",borderRadius:"10px",
        padding:"1px 5px",fontSize:"9px",fontWeight:"700",marginLeft:"4px"}});
      badge.textContent = pendingBadge; t.appendChild(badge);
    }
    t.addEventListener("click",function(){CHIEFS_STATE.view=v.id;render();}); tabBar.appendChild(t);
  });
  wrap.appendChild(tabBar);

  // DB setup banner
  if (CHIEFS_STATE.dbError) {
    var dbBanner = el("div",{style:{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.35)",borderRadius:"12px",margin:"14px",padding:"14px 16px"}});
    dbBanner.appendChild(div({color:"#EF4444",fontSize:"13px",fontWeight:"700",fontFamily:"'Space Grotesk',monospace",marginBottom:"6px"},"⚠ Database setup required"));
    dbBanner.appendChild(div({color:"#8899AA",fontSize:"12px",fontFamily:"'Inter',sans-serif",lineHeight:"1.6",marginBottom:"10px"},"The Chiefs tables don't exist yet in Supabase. Run the SQL migration to activate this feature:"));
    var steps = ["1. Open Supabase Dashboard → SQL Editor","2. Open file: supabase-chiefs-schema.sql from the repo","3. Paste the full SQL content and click Run","4. Refresh this page"];
    steps.forEach(function(s){dbBanner.appendChild(div({color:"#C0C8D8",fontSize:"11px",fontFamily:"'Space Grotesk',monospace",marginBottom:"3px"},s));});
    wrap.appendChild(dbBanner);
  }


  // Content
  var content = el("div",{style:{flex:"1",overflow:"auto",width:"100%",boxSizing:"border-box",overflowX:"hidden"}});
  if (CHIEFS_STATE.view==="dashboard") content.appendChild(_renderChiefsDashboard());
  else if (CHIEFS_STATE.view==="inventory") content.appendChild(_renderChiefsInventory());
  else if (CHIEFS_STATE.view==="clients") content.appendChild(_renderChiefsClients());
  else if (CHIEFS_STATE.view==="matches") content.appendChild(_renderChiefsMatches());
  else if (CHIEFS_STATE.view==="pipeline") content.appendChild(_renderChiefsPipeline());
  else if (CHIEFS_STATE.view==="commission") content.appendChild(_renderChiefsCommission());
  else if (CHIEFS_STATE.view==="inbox" && typeof renderInbox==="function") content.appendChild(renderInbox());
  wrap.appendChild(content);
  return wrap;
}
