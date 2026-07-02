// Inbox — unified view of email_inbox + social_inbox from Supabase
// renderInbox() is the main entry point, called from app.js routing

var INBOX_STATE = {
  emails: [],
  social: [],
  loading: false,
  loaded: false,
  tab: "all",         // all | email | instagram | facebook
  expandedId: null,
  replyText: {},       // { [id]: string }
  replyBusy: {},       // { [id]: bool }
  replySent: {},       // { [id]: bool }
  replyError: {},      // { [id]: string }
  page: 0,
  perPage: 30
};

// ── DATA FETCHING ──────────────────────────────────────────────────────────────

async function _loadInbox() {
  if (INBOX_STATE.loading) return;
  INBOX_STATE.loading = true;
  INBOX_STATE.loaded = false;
  render();
  try {
    var headers = { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY };
    var [emailResp, socialResp] = await Promise.all([
      fetch(SUPABASE_URL + "/rest/v1/email_inbox?select=*&order=received_at.desc&limit=100", { headers: headers }),
      fetch(SUPABASE_URL + "/rest/v1/social_inbox?select=*&order=received_at.desc&limit=100", { headers: headers })
    ]);
    INBOX_STATE.emails = emailResp.ok ? await emailResp.json() : [];
    INBOX_STATE.social = socialResp.ok ? await socialResp.json() : [];
  } catch (e) {
    INBOX_STATE.emails = [];
    INBOX_STATE.social = [];
  }
  INBOX_STATE.loading = false;
  INBOX_STATE.loaded = true;
  render();
}

async function _sendEmailReply(emailId) {
  var email = INBOX_STATE.emails.find(function(e) { return e.id === emailId; });
  if (!email) return;
  var body = (INBOX_STATE.replyText[emailId] || "").trim();
  if (!body) return;
  INBOX_STATE.replyBusy[emailId] = true;
  INBOX_STATE.replyError[emailId] = null;
  render();
  try {
    var loggedName = (typeof USER_PROFILE !== "undefined" && USER_PROFILE.name) ||
      (typeof DV_AUTH !== "undefined" && DV_AUTH.user && DV_AUTH.user.email) || "";
    var resp = await fetch("/api/reply-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId: email.id,
        replyTo: email.from_email,
        replyName: email.from_name,
        subject: email.subject,
        body: body,
        agentName: loggedName || "DubAIVal Team"
      })
    });
    var d = await resp.json();
    if (d.ok) {
      INBOX_STATE.replySent[emailId] = true;
      INBOX_STATE.replyText[emailId] = "";
      email.status = "agent_replied";
      email.agent_reply = body;
    } else {
      INBOX_STATE.replyError[emailId] = d.error || "Failed to send";
    }
  } catch (e) {
    INBOX_STATE.replyError[emailId] = e.message || "Network error";
  }
  INBOX_STATE.replyBusy[emailId] = false;
  render();
}

// ── HELPERS ────────────────────────────────────────────────────────────────────

function _timeAgo(ts) {
  if (!ts) return "";
  var diff = Date.now() - new Date(ts).getTime();
  if (isNaN(diff) || diff < 0) return "";
  var m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return m + "m ago";
  var h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  var d = Math.floor(h / 24);
  if (d < 7) return d + "d ago";
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function _platformColor(platform, type) {
  if (platform === "instagram") return "#E1306C";
  if (platform === "facebook") return "#1877F2";
  return "#D4AF37";
}

function _platformIcon(platform, type) {
  if (platform === "instagram") return "instagram";
  if (platform === "facebook") return "facebook";
  return "mail";
}

function _statusBadge(status, platform) {
  var map = {
    "new":            ["#EF4444","#3A1F1F","New"],
    "read":           ["#8899AA","#1A1F2E","Read"],
    "agent_replied":  ["#10B981","#0E2420","Replied"],
    "ai_replied":     ["#8B5CF6","#1A1030","AI Replied"],
    "replied":        ["platform" === "instagram" ? "#E1306C" : "#1877F2","#1A1F2E","Replied"]
  };
  var cfg = map[status] || map["read"];
  return "<span style='font-size:11px;font-weight:600;color:" + cfg[0] + ";background:" + cfg[1] + ";padding:2px 8px;border-radius:20px;white-space:nowrap'>" + cfg[2] + "</span>";
}

function _unreadCount() {
  var emailNew = INBOX_STATE.emails.filter(function(e) { return e.status === "new"; }).length;
  var socialNew = INBOX_STATE.social.filter(function(e) { return e.status === "new"; }).length;
  return emailNew + socialNew;
}

// Expose for badge in NAV
window.INBOX_UNREAD_COUNT = function() { return _unreadCount(); };

// ── RENDER ─────────────────────────────────────────────────────────────────────

function renderInbox() {
  var wrap = div("", "padding:16px;max-width:900px;margin:0 auto");

  // Header
  var unread = _unreadCount();
  var header = div("", "display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px");
  var titleRow = div("", "display:flex;align-items:center;gap:12px");
  var titleEl = div("Inbox", "font-size:22px;font-weight:700;color:#fff;font-family:'Space Grotesk',sans-serif");
  if (unread > 0) {
    titleRow.appendChild(titleEl);
    var badge = span(unread + " unread", "background:#EF4444;color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px");
    titleRow.appendChild(badge);
  } else {
    titleRow.appendChild(titleEl);
  }
  header.appendChild(titleRow);
  var refreshBtn = div("", "display:flex;align-items:center;gap:6px;background:#1A1F2E;border:1px solid #2A3040;color:#8899AA;padding:6px 14px;border-radius:8px;font-size:13px;cursor:pointer");
  refreshBtn.innerHTML = '<i data-lucide="refresh-cw" style="width:14px;height:14px"></i> Refresh';
  refreshBtn.addEventListener("click", function() {
    INBOX_STATE.loaded = false;
    _loadInbox();
  });
  header.appendChild(refreshBtn);
  wrap.appendChild(header);

  // Tab bar
  var tabs = [
    { id: "all", label: "All" },
    { id: "email", label: "Email" },
    { id: "instagram", label: "Instagram" },
    { id: "facebook", label: "Facebook" }
  ];
  var tabBar = div("", "display:flex;gap:6px;margin-bottom:20px;flex-wrap:wrap");
  tabs.forEach(function(t) {
    var count = 0;
    if (t.id === "all") count = INBOX_STATE.emails.length + INBOX_STATE.social.length;
    else if (t.id === "email") count = INBOX_STATE.emails.length;
    else count = INBOX_STATE.social.filter(function(s) { return s.platform === t.id; }).length;
    var isActive = INBOX_STATE.tab === t.id;
    var tabEl = div("", "display:flex;align-items:center;gap:6px;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;" + (isActive ? "background:#D4AF37;color:#000" : "background:#1A1F2E;color:#8899AA;border:1px solid #2A3040"));
    tabEl.textContent = t.label;
    if (count > 0) {
      var c = span(String(count), "background:" + (isActive ? "rgba(0,0,0,.25)" : "#2A3040") + ";border-radius:20px;padding:1px 6px;font-size:11px");
      tabEl.appendChild(c);
    }
    tabEl.addEventListener("click", function() { INBOX_STATE.tab = t.id; render(); });
    tabBar.appendChild(tabEl);
  });
  wrap.appendChild(tabBar);

  // Loading state
  if (INBOX_STATE.loading) {
    var loading = div("", "text-align:center;padding:60px;color:#8899AA");
    loading.innerHTML = '<i data-lucide="loader-2" style="width:32px;height:32px;animation:spin 1s linear infinite;margin-bottom:12px"></i><div>Loading inbox...</div>';
    wrap.appendChild(loading);
    if (typeof lucide !== "undefined") setTimeout(function() { lucide.createIcons(); }, 50);
    return wrap;
  }

  // Trigger load on first render
  if (!INBOX_STATE.loaded && !INBOX_STATE.loading) {
    _loadInbox();
    var loading2 = div("", "text-align:center;padding:60px;color:#8899AA");
    loading2.innerHTML = '<i data-lucide="loader-2" style="width:32px;height:32px;animation:spin 1s linear infinite"></i>';
    wrap.appendChild(loading2);
    if (typeof lucide !== "undefined") setTimeout(function() { lucide.createIcons(); }, 50);
    return wrap;
  }

  // Build combined list
  var allItems = [];
  if (INBOX_STATE.tab === "all" || INBOX_STATE.tab === "email") {
    INBOX_STATE.emails.forEach(function(e) {
      allItems.push({ type: "email", data: e, ts: e.received_at });
    });
  }
  if (INBOX_STATE.tab === "all" || INBOX_STATE.tab === "instagram" || INBOX_STATE.tab === "facebook") {
    INBOX_STATE.social.forEach(function(s) {
      if (INBOX_STATE.tab === "all" || s.platform === INBOX_STATE.tab) {
        allItems.push({ type: "social", data: s, ts: s.received_at });
      }
    });
  }
  allItems.sort(function(a, b) { return new Date(b.ts) - new Date(a.ts); });

  if (allItems.length === 0) {
    var empty = div("", "text-align:center;padding:60px;color:#556677");
    empty.innerHTML = '<i data-lucide="inbox" style="width:40px;height:40px;margin-bottom:12px;opacity:.4"></i><div style="font-size:16px">No messages yet</div><div style="font-size:13px;margin-top:6px">Messages from email, Instagram, and Facebook will appear here</div>';
    wrap.appendChild(empty);
    if (typeof lucide !== "undefined") setTimeout(function() { lucide.createIcons(); }, 50);
    return wrap;
  }

  // Message list
  var list = div("", "display:flex;flex-direction:column;gap:8px");
  allItems.forEach(function(item) {
    list.appendChild(_renderItem(item));
  });
  wrap.appendChild(list);

  if (typeof lucide !== "undefined") setTimeout(function() { lucide.createIcons(); }, 50);
  return wrap;
}

function _renderItem(item) {
  var isEmail = item.type === "email";
  var d = item.data;
  var id = d.id;
  var isExpanded = INBOX_STATE.expandedId === id;
  var platform = isEmail ? "email" : d.platform;
  var pColor = _platformColor(platform);
  var pIcon = _platformIcon(platform, d.event_type);
  var isNew = d.status === "new";

  var card = div("", "background:#0D1220;border:1px solid " + (isNew ? "rgba(239,68,68,.3)" : "#1D2535") + ";border-radius:12px;overflow:hidden;transition:border-color .2s");
  if (isNew) card.style.borderLeftWidth = "3px";

  // Header row
  var cardHeader = div("", "display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;user-select:none");
  cardHeader.addEventListener("click", function() {
    INBOX_STATE.expandedId = isExpanded ? null : id;
    if (!isExpanded && isNew) {
      d.status = "read";
      var hdr = { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json", "Prefer": "return=minimal" };
      var tbl = isEmail ? "email_inbox" : "social_inbox";
      fetch(SUPABASE_URL + "/rest/v1/" + tbl + "?id=eq." + id, { method: "PATCH", headers: hdr, body: JSON.stringify({ status: "read" }) }).catch(function() {});
    }
    render();
  });

  // Platform icon
  var iconWrap = div("", "width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:" + pColor + "22");
  iconWrap.innerHTML = '<i data-lucide="' + pIcon + '" style="width:16px;height:16px;color:' + pColor + '"></i>';
  cardHeader.appendChild(iconWrap);

  // Middle: sender + preview
  var middle = div("", "flex:1;min-width:0");
  var topRow = div("", "display:flex;align-items:center;gap:8px;margin-bottom:4px");
  var senderEl = span(isEmail ? (d.from_name || d.from_email || "Unknown") : (d.sender_name || d.sender_id || "Unknown"), "font-weight:600;color:#fff;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px");
  topRow.appendChild(senderEl);
  if (isEmail && d.from_email) {
    var emailSpan = span("<" + d.from_email + ">", "color:#556677;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
    topRow.appendChild(emailSpan);
  } else if (!isEmail) {
    var typeSpan = span(d.event_type === "dm" ? "DM" : "Comment", "font-size:11px;color:" + pColor + ";background:" + pColor + "22;padding:1px 6px;border-radius:10px;font-weight:600");
    topRow.appendChild(typeSpan);
  }
  middle.appendChild(topRow);

  var preview = div("", "font-size:13px;color:#8899AA;white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
  if (isEmail && d.subject && d.subject !== "(No subject)") {
    preview.textContent = d.subject;
  } else {
    preview.textContent = (isEmail ? d.body_text : d.message_text) || "";
  }
  middle.appendChild(preview);
  cardHeader.appendChild(middle);

  // Right: time + status
  var right = div("", "display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0");
  right.appendChild(span(_timeAgo(d.received_at || d.ts), "font-size:12px;color:#556677"));
  right.innerHTML += _statusBadge(d.status, platform);
  cardHeader.appendChild(right);
  card.appendChild(cardHeader);

  // Expanded body
  if (isExpanded) {
    var body = div("", "border-top:1px solid #1D2535;padding:16px");

    // Full message
    if (isEmail) {
      if (d.subject && d.subject !== "(No subject)") {
        body.appendChild(div("Subject: " + d.subject, "font-size:13px;font-weight:600;color:#D4AF37;margin-bottom:12px"));
      }
      if (d.body_text) {
        var msgBox = div("", "background:#070B14;border-radius:8px;padding:14px;font-size:13px;color:#CCC;line-height:1.7;white-space:pre-wrap;max-height:300px;overflow-y:auto;margin-bottom:16px");
        msgBox.textContent = d.body_text;
        body.appendChild(msgBox);
      }
    } else {
      if (d.message_text) {
        var msgBox2 = div("", "background:#070B14;border-radius:8px;padding:14px;font-size:13px;color:#CCC;line-height:1.7;white-space:pre-wrap;margin-bottom:16px");
        msgBox2.textContent = d.message_text;
        body.appendChild(msgBox2);
      }
    }

    // AI / agent reply shown if exists
    var shownReply = isEmail ? (d.agent_reply || d.ai_reply) : d.ai_reply;
    var replyLabel = isEmail ? (d.agent_reply ? "Agent Reply" : (d.ai_reply ? "AI Reply" : null)) : (d.ai_reply ? "AI Reply (sent)" : null);
    if (shownReply && replyLabel) {
      var replyShow = div("", "margin-bottom:16px");
      replyShow.appendChild(div(replyLabel, "font-size:12px;font-weight:600;color:#8899AA;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px"));
      var replyBox = div("", "background:#0D1A12;border:1px solid #1A3A22;border-radius:8px;padding:14px;font-size:13px;color:#BBB;line-height:1.7;white-space:pre-wrap");
      replyBox.textContent = shownReply;
      replyShow.appendChild(replyBox);
      body.appendChild(replyShow);
    }

    // Email reply form (only for emails, only if not already replied)
    if (isEmail && d.status !== "agent_replied") {
      var replySection = div("", "margin-top:12px");
      replySection.appendChild(div("Reply", "font-size:13px;font-weight:600;color:#fff;margin-bottom:8px"));
      var textarea = document.createElement("textarea");
      textarea.value = INBOX_STATE.replyText[id] || "";
      textarea.placeholder = "Type your reply to " + (d.from_name || d.from_email) + "...";
      textarea.style.cssText = "width:100%;box-sizing:border-box;background:#070B14;border:1px solid #2A3040;border-radius:8px;padding:12px;color:#fff;font-size:13px;font-family:inherit;line-height:1.6;resize:vertical;min-height:100px;outline:none";
      textarea.addEventListener("input", function() { INBOX_STATE.replyText[id] = textarea.value; });
      replySection.appendChild(textarea);

      var btnRow = div("", "display:flex;align-items:center;gap:10px;margin-top:10px");
      var sendBtn = div("", "display:flex;align-items:center;gap:6px;background:#D4AF37;color:#000;font-weight:700;font-size:13px;padding:8px 20px;border-radius:8px;cursor:pointer");
      sendBtn.innerHTML = '<i data-lucide="send" style="width:14px;height:14px"></i>' + (INBOX_STATE.replyBusy[id] ? "Sending..." : "Send Reply");
      if (INBOX_STATE.replyBusy[id]) sendBtn.style.opacity = "0.6";
      sendBtn.addEventListener("click", function() {
        if (!INBOX_STATE.replyBusy[id]) _sendEmailReply(id);
      });
      btnRow.appendChild(sendBtn);
      if (INBOX_STATE.replySent[id]) {
        btnRow.appendChild(span("Sent!", "color:#10B981;font-size:13px;font-weight:600"));
      }
      if (INBOX_STATE.replyError[id]) {
        btnRow.appendChild(span("Error: " + INBOX_STATE.replyError[id], "color:#EF4444;font-size:12px"));
      }
      replySection.appendChild(btnRow);
      body.appendChild(replySection);
    }

    // Social: show instructions for manual reply if not replied
    if (!isEmail && d.status === "new") {
      var hint = div("", "background:#1A1F2E;border-radius:8px;padding:12px;font-size:12px;color:#8899AA;margin-top:8px");
      hint.innerHTML = '<i data-lucide="info" style="width:13px;height:13px;display:inline;vertical-align:middle;margin-right:4px"></i> AI auto-reply was sent immediately via ' + (d.platform === "instagram" ? "Instagram" : "Facebook") + ' API.';
      body.appendChild(hint);
    }

    card.appendChild(body);
  }

  return card;
}
