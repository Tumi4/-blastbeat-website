/* ============================================================
   BLASTBEAT — Admin Dashboard
   Server-backed when the backend is configured (Netlify Function
   /api/admin + Blobs store, HttpOnly session cookie, rev-based sync);
   falls back to a browser-local prototype mode when it isn't (static
   dev server, preview without env vars). See docs/ADMIN-BACKEND.md.
   ============================================================ */

(function () {
  'use strict';

  // Storage guards — Safari private mode and blocked-storage contexts throw
  // on any access; the dashboard must degrade, not die.
  function lsGet(k)    { try { return localStorage.getItem(k); }   catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); }       catch (e) {} }
  function lsDel(k)    { try { localStorage.removeItem(k); }       catch (e) {} }
  function ssGet(k)    { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); }     catch (e) {} }
  function ssDel(k)    { try { sessionStorage.removeItem(k); }     catch (e) {} }

  /* ---- Access gate ----
     Two modes, decided by the server at login time:
       SERVER mode — POST /api/admin/login checks the code server-side
         (ADMIN_ACCESS_CODE env var) and sets an HttpOnly session cookie.
         All data then syncs to the site's private Netlify Blobs store.
       LOCAL mode — the backend answered "not configured" (or we're on a
         static dev server with no functions). Falls back to the demo code
         and browser-local storage. Gates nothing sensitive: the local
         store starts from the public seed roster. */
  var API_BASE = '/api/admin';
  var LOCAL_DEMO_CODE = 'blastbeat2026'; // local prototype mode only — server mode never consults this
  var SESSION_KEY = 'bb-admin-ok';
  var MODE_KEY = 'bb-admin-mode';
  var WHO_KEY = 'bb-admin-who';

  var apiMode = 'local';   // 'server' | 'local'
  var apiWho = '';
  var serverRev = 0;

  var gate = document.getElementById('gate');
  var shell = document.getElementById('shell');
  var form = document.getElementById('gate-form');
  var pass = document.getElementById('gate-pass');
  var whoSel = document.getElementById('gate-who');
  var err = document.getElementById('gate-err');

  function unlock() {
    gate.classList.add('hidden');
    shell.style.display = 'grid';
    render();
  }
  // NOTE: the returning-session auto-unlock runs at the END of this file
  // (after `data` and the licence engine are initialised) — calling
  // unlock() here would render against uninitialised state and brick
  // the dashboard on every reload while logged in.

  function apiFetch(path, opts) {
    var o = opts || {};
    o.credentials = 'same-origin';
    o.headers = Object.assign({ 'Content-Type': 'application/json' }, o.headers || {});
    return fetch(API_BASE + path, o);
  }

  // Returns 'server' | 'wrong' | 'rate' | 'local'
  async function apiLogin(code, who) {
    try {
      var res = await apiFetch('/login', { method: 'POST', body: JSON.stringify({ code: code, who: who }) });
      if (res.status === 200) return 'server';
      if (res.status === 401) return 'wrong';
      if (res.status === 429) return 'rate';
      return 'local'; // 501 not_configured, static dev server, anything else
    } catch (e) {
      return 'local'; // no network / no functions
    }
  }

  var loggingIn = false;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (loggingIn) return;
    loggingIn = true;
    var code = pass.value;
    var who = whoSel ? whoSel.value : 'admin';
    err.textContent = 'Checking…';
    var outcome = await apiLogin(code, who);
    loggingIn = false;
    if (outcome === 'server') {
      apiMode = 'server';
      apiWho = who;
      ssSet(SESSION_KEY, '1'); ssSet(MODE_KEY, 'server'); ssSet(WHO_KEY, who);
      err.textContent = '';
      if (syncDirty) {
        // Re-login after a mid-edit session expiry: the unsaved work is
        // still in memory — push it rather than pulling over it.
        unlock();
        pushState();
      } else {
        await syncFromServer();
        unlock();
      }
      return;
    }
    if (outcome === 'rate') {
      err.textContent = 'Too many attempts. Wait 15 minutes and try again.';
      return;
    }
    if (outcome === 'local' && code === LOCAL_DEMO_CODE) {
      apiMode = 'local';
      apiWho = who;
      ssSet(SESSION_KEY, '1'); ssSet(MODE_KEY, 'local'); ssSet(WHO_KEY, who);
      err.textContent = '';
      unlock();
      return;
    }
    err.textContent = 'Wrong access code. Try again.';
    pass.value = '';
    pass.focus();
  });
  document.getElementById('logout').addEventListener('click', function () {
    ssDel(SESSION_KEY); ssDel(MODE_KEY); ssDel(WHO_KEY);
    var reload = function () { location.reload(); };
    if (apiMode === 'server') {
      apiFetch('/logout', { method: 'POST' }).then(reload, reload);
    } else {
      reload();
    }
  });

  function sessionExpired() {
    ssDel(SESSION_KEY); ssDel(MODE_KEY);
    err.textContent = 'Session expired — sign in again.';
    gate.classList.remove('hidden');
  }

  // ---- Data store (localStorage + seed) ----
  // Store key bumped to v2 when we swapped the sample seed for the real
  // BB_PROGRAMME roster — forces Robert's browser to load real data once.
  var STORE_KEY = 'bb-admin-data-v2';

  // Build the admin's working model from window.BB_PROGRAMME (assets/js/programme-data.js),
  // which is generated from /data/programme-data.json — the single source of truth.
  function buildSeedFromProgramme() {
    var P = window.BB_PROGRAMME;
    if (!P || !P.schools) {
      return { schools: [], sponsors: [], partners: [], leads: [], licences: [], audit: [] };
    }
    var regionName = { SA: 'South Africa', Namibia: 'Namibia', UK: 'United Kingdom', IE: 'Ireland' };
    var groupStatus = { heritage: 'Heritage', pilot: 'Active', namibia: 'Agreed in principle', proposal: 'Proposal' };
    var progressByStatus = { valid: 60, issued: 30, welcomed: 20, due: 15 };
    var byId = function (arr) { var m = {}; (arr || []).forEach(function (x) { m[x.id] = x; }); return m; };
    var schoolMap = byId(P.schools), sponsorMap = byId(P.sponsors);
    var schoolSponsor = {}, sponsorSchool = {};
    (P.licences || []).forEach(function (l) {
      var sp = sponsorMap[l.sponsorId], sc = schoolMap[l.schoolId];
      if (sc && sp && !schoolSponsor[l.schoolId]) schoolSponsor[l.schoolId] = sp.name;
      if (sp && sc && !sponsorSchool[l.sponsorId]) sponsorSchool[l.sponsorId] = sc.name;
    });
    var schools = P.schools.map(function (s, i) {
      var lic = (P.licences || []).filter(function (l) { return l.schoolId === s.id; })[0];
      return {
        id: i + 1, key: s.id, name: s.name, group: s.group, area: s.area || '', region: s.region || '',
        country: (s.area ? s.area + ' · ' : '') + (regionName[s.region] || s.region || ''),
        note: s.note || '', twin: schoolSponsor[s.id] || '',
        status: groupStatus[s.group] || 'Active',
        progress: lic ? (progressByStatus[lic.status] || 0) : 0,
        start: lic ? (lic.validFrom || 'TBC') : 'TBC'
      };
    });
    var sponsors = P.sponsors.map(function (s, i) {
      return {
        id: i + 1, key: s.id, company: s.name, brand: s.brand || '', roles: s.roles || [],
        tier: (s.roles && s.roles[0]) || 'Sponsor', value: 12225, currency: 'ZAR',
        twin: sponsorSchool[s.id] || '', status: s.founding ? 'Funded' : 'Confirmed',
        contact: s.note || '', founding: !!s.founding, region: s.region || ''
      };
    });
    var partners = (P.ambassadors || []).map(function (a, i) {
      return {
        id: i + 1, name: a.ambassador, type: 'Ambassador',
        referred: (a.licence && a.licence !== '—') ? 1 : 0,
        signed: a.amount > 0 ? 1 : 0, owed: a.amount || 0, currency: 'ZAR',
        status: a.status === 'pending' ? 'Payout due' : 'Active',
        link: 'bb.education/r/' + String(a.ambassador || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        note: a.note || ''
      };
    });
    var regionCode = { SA: 'ZA', Namibia: 'NA', UK: 'UK', IE: 'IE' };
    var licences = (P.licences || []).map(function (l) {
      var sc = schoolMap[l.schoolId], sp = sponsorMap[l.sponsorId];
      return {
        id: l.credentialId, seq: l.seq, source: 'programme',
        school: sc ? sc.name : l.schoolId, sponsor: sp ? sp.name : l.sponsorId,
        tier: l.tier, role: l.role, amount: l.amount, currency: 'ZAR',
        status: l.status, region: l.region || (sc ? (regionCode[sc.region] || sc.region) : ''),
        validFrom: l.validFrom, validUntil: l.validUntil,
        twinCohort: l.twinCohort || '', twinLoc: l.twinLoc || '', proofHash: '', vc: null
      };
    });
    return { schools: schools, sponsors: sponsors, partners: partners, leads: [], licences: licences, audit: [] };
  }
  var SEED = buildSeedFromProgramme();

  function normalizeData(d) {
    d = d && typeof d === 'object' ? d : {};
    ['schools', 'sponsors', 'partners', 'leads', 'licences', 'audit'].forEach(function (k) {
      if (!Array.isArray(d[k])) d[k] = [];
    });
    return d;
  }
  function load() {
    try {
      var raw = lsGet(STORE_KEY);
      if (raw) return normalizeData(JSON.parse(raw));
    } catch (e) {}
    return JSON.parse(JSON.stringify(SEED));
  }
  function save() {
    lsSet(STORE_KEY, JSON.stringify(data));
    if (apiMode === 'server') scheduleServerSave();
  }
  var data = load();

  /* ---- Server sync (server mode only) ----
     Every save() debounces a PUT of the full state with the last-seen rev.
     A 409 means another device saved first — we adopt the server copy and
     re-render rather than clobbering it. localStorage stays as the offline
     cache either way. */
  var saveTimer = null;
  var syncDirty = false;
  var pendingInboxIds = [];

  var badgeEl = document.getElementById('sync-badge');
  function setBadge(state, text) {
    if (!badgeEl) return;
    badgeEl.hidden = false;
    badgeEl.className = 'sync-badge ' + state;
    badgeEl.querySelector('.txt').textContent = text || ({
      synced: 'Synced to secure store',
      saving: 'Saving…',
      offline: 'Offline — changes kept in this browser',
      local: 'Local mode — this browser only'
    }[state] || state);
  }

  function scheduleServerSave() {
    syncDirty = true;
    setBadge('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(pushState, 800);
  }

  async function pushState() {
    if (apiMode !== 'server') return;
    try {
      var res = await apiFetch('/state', {
        method: 'PUT',
        body: JSON.stringify({ rev: serverRev, data: data, consumeInbox: pendingInboxIds })
      });
      if (res.status === 409) {
        var conflict = await res.json();
        serverRev = conflict.rev || 0;
        // Drop the pending consume ids: the adopted copy may not contain
        // the leads we merged from the inbox, and consuming their messages
        // against a state that lacks them would destroy those leads.
        pendingInboxIds = [];
        if (conflict.data) {
          data = normalizeData(conflict.data);
          lsSet(STORE_KEY, JSON.stringify(data));
          render();
        }
        syncDirty = false;
        setBadge('synced');
        toast('Updated from another device — showing the latest copy.');
        // Re-pull state + inbox so outstanding form leads get re-merged
        // into the adopted copy (and only consumed once saved with them).
        syncFromServer().then(function () { render(); });
        return;
      }
      if (res.status === 401) { setBadge('offline', 'Session expired'); sessionExpired(); return; }
      if (!res.ok) throw new Error('save_failed_' + res.status);
      var ok = await res.json();
      serverRev = ok.rev;
      pendingInboxIds = [];
      syncDirty = false;
      setBadge('synced');
    } catch (e) {
      // Network blip or function cold-start hiccup: keep the local copy,
      // show offline, retry while there are unsaved changes.
      setBadge('offline');
      clearTimeout(saveTimer);
      saveTimer = setTimeout(pushState, 15000);
    }
  }

  // Pull the authoritative copy. Returns false when the session is dead.
  async function syncFromServer() {
    try {
      var res = await apiFetch('/state', { method: 'GET' });
      if (res.status === 401) return false;
      if (!res.ok) throw new Error('load_failed_' + res.status);
      var body = await res.json();
      apiWho = body.who || apiWho;
      if (body.data && !syncDirty) {
        serverRev = body.rev || 0;
        data = normalizeData(body.data);
        lsSet(STORE_KEY, JSON.stringify(data));
      } else if (body.data) {
        // Unsaved local edits exist — keep them; just learn the rev so the
        // pending push can reconcile (409 path handles a real conflict).
        serverRev = body.rev || 0;
        scheduleServerSave();
      } else {
        // First run against an empty store: seed it with what this browser
        // has (the roster seed, or Robert's existing local edits).
        serverRev = body.rev || 0;
        scheduleServerSave();
      }
      var added = mergeInbox(body.inbox);
      if (added) {
        save();
        toast(added + ' new lead' + (added === 1 ? '' : 's') + ' from the site forms.');
      } else if (pendingInboxIds.length) {
        // Already-merged inbox messages still need consuming server-side.
        scheduleServerSave();
      }
      setBadge('synced');
      updateBackendCard(body.updatedAt, body.updatedBy);
      return true;
    } catch (e) {
      setBadge('offline');
      if (backendCardText) backendCardText.innerHTML = '<strong style="color:var(--pink);">Offline.</strong> Working from this browser&rsquo;s cached copy &mdash; changes sync back automatically once the connection returns.';
      return true; // work from the local cache; sync retries on next save
    }
  }

  // Form submissions land in the server inbox (submission-created.mjs);
  // merge them into Leads exactly once, keyed by inbox id.
  function mergeInbox(inbox) {
    if (!Array.isArray(inbox) || !inbox.length) return 0;
    var have = {};
    data.leads.forEach(function (l) { if (l.inboxId) have[l.inboxId] = 1; });
    var added = 0;
    inbox.forEach(function (m) {
      if (!m || !m.id) return;
      pendingInboxIds.push(m.id);
      if (have[m.id]) return;
      data.leads.push({
        id: nextId(data.leads, 'leads'), inboxId: m.id,
        name: m.name || '(no name)', org: m.org || '—',
        type: m.type || 'Contact', source: 'form: ' + (m.form || '?'),
        email: m.email || '', phone: m.phone || '', referral: m.referral || '',
        raw: m.raw || null,
        date: String(m.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
        status: 'New'
      });
      added++;
    });
    if (added) audit('receive', 'lead', { count: added, via: 'forms-inbox' });
    return added;
  }

  // Pick up remote changes when Robert returns to the tab (only when
  // nothing is unsaved here — never clobber in-flight edits).
  var lastFocusSync = 0;
  window.addEventListener('focus', function () {
    if (apiMode !== 'server' || syncDirty) return;
    var now = Date.now();
    if (now - lastFocusSync < 15000) return;
    lastFocusSync = now;
    apiFetch('/state', { method: 'GET' }).then(function (res) {
      if (!res.ok) return null;
      return res.json();
    }).then(function (body) {
      if (!body || syncDirty) return;
      var changed = false;
      // Strictly newer only: a GET serviced concurrently with our own PUT
      // can carry the PREVIOUS rev — adopting it would roll back the save.
      if (body.data && body.rev > serverRev) {
        serverRev = body.rev;
        data = normalizeData(body.data);
        lsSet(STORE_KEY, JSON.stringify(data));
        changed = true;
      }
      if (mergeInbox(body.inbox)) { save(); changed = true; }
      if (changed) { render(); toast('Refreshed with the latest changes.'); }
    }).catch(function () {});
  });

  var backendCardText = document.getElementById('backend-status-text');
  var modeBanner = document.getElementById('mode-banner');
  function updateBackendCard(updatedAt, updatedBy) {
    if (modeBanner) modeBanner.hidden = (apiMode === 'server');
    if (!backendCardText) return;
    if (apiMode === 'server') {
      var lastLine = updatedAt
        ? 'Last saved ' + String(updatedAt).replace('T', ' ').slice(0, 16) + ' UTC' + (updatedBy ? ' by ' + escapeHtmlText(updatedBy) : '') + '.'
        : 'No server snapshot yet — your first change writes one.';
      backendCardText.innerHTML = '<strong style="color:var(--green);">&#10003; Connected to the secure backend.</strong> '
        + 'Data lives in the site&rsquo;s private store (Netlify Blobs), behind the server-checked access code. '
        + 'Every device signed in with the code sees the same records; the leads inbox pulls site form submissions in automatically. '
        + lastLine + ' Sessions last 12 hours.';
    } else {
      backendCardText.innerHTML = '<strong style="color:var(--orange);">Local mode.</strong> '
        + 'The server backend isn&rsquo;t reachable, so records live only in this browser. '
        + 'To go live: set <code>ADMIN_ACCESS_CODE</code> (and optionally <code>ADMIN_SESSION_SECRET</code>) in '
        + 'Netlify &rarr; Site settings &rarr; Environment variables, redeploy, and sign in again — the dashboard switches to server mode automatically. '
        + 'Full runbook: <code>docs/ADMIN-BACKEND.md</code>.';
    }
  }

  // Monotonic per-collection ids. Ids are embedded in partner referral
  // codes (money attribution), so a deleted record's id must never be
  // recycled — data.seq keeps the high-water mark across deletes.
  function nextId(arr, key) {
    var maxId = arr.reduce(function (m, x) { return Math.max(m, x.id || 0); }, 0);
    if (!data.seq) data.seq = {};
    var n = Math.max(maxId, (key && data.seq[key]) || 0) + 1;
    if (key) data.seq[key] = n;
    return n;
  }
  function eur(n) { return '€' + Number(n).toLocaleString('en-IE'); }
  function zar(n) { return 'R' + Number(n || 0).toLocaleString('en-ZA'); }
  // Format a record's value in its own currency (real data is ZAR; issued VCs default ZAR).
  function money(n, ccy) { return (ccy === 'EUR') ? eur(n) : zar(n); }

  // ---- Navigation ----
  var navItems = document.querySelectorAll('.nav-item');
  var views = document.querySelectorAll('.view');
  navItems.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var v = btn.dataset.view;
      navItems.forEach(function (b) { b.classList.toggle('active', b === btn); });
      views.forEach(function (s) { s.classList.toggle('active', s.id === 'view-' + v); });
    });
  });

  // ---- Status pill helper ----
  function pill(text) {
    var cls = 'grey';
    var t = (text || '').toLowerCase();
    if (/revoked|expired/.test(t)) cls = 'pink';
    else if (/active|funded|converted|valid|qualified/.test(t)) cls = 'green';
    else if (/onboard|invoiced|payout|due|issued|contacted/.test(t)) cls = 'amber';
    else if (/confirm|pledg|agreed|welcomed|heritage/.test(t)) cls = 'cyan';
    else if (/awaiting|new|tbc|proposal/.test(t)) cls = 'pink';
    return '<span class="pill ' + cls + '">' + (text || '—') + '</span>';
  }

  // ---- Table search (inputs live in each view's page head) ----
  var searchQ = {};
  document.body.addEventListener('input', function (e) {
    var t = e.target;
    if (!t.classList || !t.classList.contains('tbl-search')) return;
    searchQ[t.dataset.tbl] = t.value.trim().toLowerCase();
    render();
  });
  function matchesSearch(key, parts) {
    var q = searchQ[key];
    if (!q) return true;
    return parts.join(' ').toLowerCase().indexOf(q) !== -1;
  }

  /* ---- Filter chips: one-tap status filters above each table ----
     Chips are built from whatever values actually exist in the data, with
     live counts, so they never show empty categories. "All" resets. */
  var chipState = {}; // view key -> selected value ('' = all)
  var CHIP_SPECS = {
    schools:  { get: function (r) { return r.status || 'No status'; } },
    sponsors: { get: function (r) { return r.status || 'No status'; } },
    partners: { get: function (r) { return r.type || 'No type'; } },
    leads:    { get: function (r) { return r.status || 'No status'; } },
    licences: { get: function (l) {
      if (l.status === 'revoked') return 'Revoked';
      return l.vc ? 'Credentialed' : 'Roster';
    } }
  };
  function chipFilter(view, rec) {
    var sel = chipState[view];
    if (!sel) return true;
    return CHIP_SPECS[view].get(rec) === sel;
  }
  function renderChips(view, items) {
    var host = document.querySelector('[data-chips="' + view + '"]');
    if (!host) return;
    var counts = {};
    items.forEach(function (r) {
      var k = CHIP_SPECS[view].get(r);
      counts[k] = (counts[k] || 0) + 1;
    });
    var keys = Object.keys(counts).sort();
    if (keys.length < 2) { host.innerHTML = ''; chipState[view] = ''; return; }
    var sel = chipState[view] || '';
    var html = '<button type="button" class="chip' + (sel === '' ? ' active' : '') + '" data-chip-view="' + view + '" data-chip-val="" aria-pressed="' + (sel === '') + '">All <span class="count">' + items.length + '</span></button>';
    keys.forEach(function (k) {
      html += '<button type="button" class="chip' + (sel === k ? ' active' : '') + '" data-chip-view="' + view + '" data-chip-val="' + escapeHtmlAttr(k) + '" aria-pressed="' + (sel === k) + '">' + escapeHtmlText(k) + ' <span class="count">' + counts[k] + '</span></button>';
    });
    host.innerHTML = html;
  }
  document.body.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-chip-view]');
    if (!chip) return;
    chipState[chip.dataset.chipView] = chip.dataset.chipVal;
    render();
  });

  // Calendar-safe month adder: 31 Aug + 6mo clamps to 28/29 Feb instead of
  // overflowing into March (setMonth alone would).
  function addMonths(dateStr, months) {
    var dt = new Date(dateStr);
    if (isNaN(dt)) dt = new Date();
    var day = dt.getDate();
    dt.setDate(1);
    dt.setMonth(dt.getMonth() + months);
    var lastDay = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
    dt.setDate(Math.min(day, lastDay));
    return dt;
  }

  // Days until a licence's validUntil (null when unknown/not parseable).
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    var t = Date.parse(dateStr);
    if (isNaN(t)) return null;
    return Math.ceil((t - Date.now()) / 86400000);
  }

  // ---- Renderers ----
  function render() {
    renderOverview();
    renderPilot();
    renderSponsors();
    renderPartners();
    renderLeads();
  }

  function renderOverview() {
    var target = (window.BB_PROGRAMME && window.BB_PROGRAMME.cohort_target) || 20;
    var twinned = data.schools.filter(function (s) { return s.twin; }).length;
    var live = (data.licences || []).filter(function (l) { return l.status !== 'revoked'; });
    var licValue = live.reduce(function (a, l) { return a + (typeof l.amount === 'number' ? l.amount : 0); }, 0);
    var owed = data.partners.reduce(function (a, p) { return a + (p.owed || 0); }, 0);
    var stamped = live.filter(function (l) { return l.vc; }).length;
    var partnerLic = live.filter(function (l) { return !!l.partner; }).length;
    var renewals = live.filter(function (l) {
      var d = daysUntil(l.vc ? l.vc.validUntil : l.validUntil);
      return d != null && d <= 60;
    }).length;
    var newLeads = data.leads.filter(function (l) { return l.status === 'New'; }).length;

    var stats = [
      { label: 'Schools on programme', val: data.schools.length, sub: twinned + ' twinned with a sponsor' },
      { label: 'Pilot cohort', val: twinned + ' / ' + target, sub: 'twinned toward target' },
      { label: 'Programme value', val: zar(licValue), sub: live.length + ' active licences on record' },
      { label: 'Credentialed', val: stamped, sub: partnerLic + ' via partner referrals' },
      { label: 'Commission owed', val: zar(owed), sub: data.partners.length + ' ambassadors' },
      { label: 'Needs attention', val: (renewals + newLeads), sub: renewals + ' renewal' + (renewals === 1 ? '' : 's') + ' ≤60d · ' + newLeads + ' new lead' + (newLeads === 1 ? '' : 's') }
    ];
    document.getElementById('overview-stats').innerHTML = stats.map(function (s) {
      return '<div class="stat"><div class="label">' + s.label + '</div><div class="val">' + s.val + '</div><div class="sub">' + s.sub + '</div></div>';
    }).join('');

    var pct = Math.round((twinned / target) * 100);
    document.getElementById('pilot-progress').style.width = pct + '%';
    document.getElementById('pilot-progress-label').textContent = twinned + ' / ' + target + ' twinned';
  }

  function table(headers, rows) {
    return '<thead><tr>' + headers.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody>';
  }

  function delBtn(kind, id) {
    return '<button class="btn sm" data-del="' + kind + '" data-id="' + id + '">Remove</button>';
  }

  function sampleTag(rec) {
    return rec && rec._sample ? ' <span class="pill amber" style="font-size:0.58rem;margin-left:0.4rem;letter-spacing:0.1em;">SAMPLE</span>' : '';
  }

  var GROUP_TAG = {
    heritage: '<span class="pill cyan" style="font-size:0.56rem;margin-left:0.4rem;">HERITAGE</span>',
    pilot:    '<span class="pill green" style="font-size:0.56rem;margin-left:0.4rem;">SA PILOT</span>',
    namibia:  '<span class="pill grey" style="font-size:0.56rem;margin-left:0.4rem;">NAMIBIA</span>',
    proposal: '<span class="pill pink" style="font-size:0.56rem;margin-left:0.4rem;">PROPOSAL</span>'
  };
  function editBtn(kind, id) {
    return '<button class="btn sm" data-edit="' + kind + '" data-id="' + id + '">Edit</button>';
  }
  function renderPilot() {
    renderChips('schools', data.schools);
    var rows = data.schools.filter(function (s) {
      return chipFilter('schools', s) && matchesSearch('schools', [s.name, s.country, s.twin, s.status, s.note]);
    }).map(function (s) {
      return '<tr' + (s._sample ? ' class="sample-row"' : '') + '>'
        + '<td><strong>' + escapeHtmlText(s.name) + '</strong>' + (GROUP_TAG[s.group] || '') + sampleTag(s)
          + (s.note ? '<br><span style="font-size:0.7rem;color:var(--muted);">' + escapeHtmlText(s.note) + '</span>' : '') + '</td>'
        + '<td>' + escapeHtmlText(s.country) + '</td>'
        + '<td>' + (s.twin ? escapeHtmlText(s.twin) : '<span class="pill pink">needs twin</span>') + '</td>'
        + '<td>' + pill(s.status) + '</td>'
        + '<td><div style="display:flex;align-items:center;gap:0.5rem;"><div class="bar"><div style="width:' + (Number(s.progress) || 0) + '%"></div></div><span style="font-size:0.74rem;color:var(--muted);">' + (Number(s.progress) || 0) + '%</span></div></td>'
        + '<td style="font-family:var(--mono);font-size:0.76rem;">' + escapeHtmlText(s.start || 'TBC') + '</td>'
        + '<td class="row-actions">' + editBtn('schools', s.id) + delBtn('schools', s.id) + '</td>'
        + '</tr>';
    }).join('');
    if (!rows) rows = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted);">' + (searchQ.schools ? 'No schools match that search.' : 'No schools yet.') + '</td></tr>';
    document.getElementById('tbl-pilot').innerHTML = table(['School', 'Location', 'Twin sponsor', 'Status', 'Progress', 'Start', ''], rows);
  }

  function renderSponsors() {
    renderChips('sponsors', data.sponsors);
    var rows = data.sponsors.filter(function (s) {
      var roleText = (s.roles && s.roles.length) ? s.roles.join(' ') : (s.tier || '');
      return chipFilter('sponsors', s) && matchesSearch('sponsors', [s.company, roleText, s.twin, s.status, s.contact]);
    }).map(function (s) {
      var roleText = (s.roles && s.roles.length) ? s.roles.join(' · ') : s.tier;
      return '<tr' + (s._sample ? ' class="sample-row"' : '') + '>'
        + '<td><strong>' + escapeHtmlText(s.company) + '</strong>' + (s.founding ? ' <span class="pill green" style="font-size:0.56rem;">FOUNDING</span>' : '') + sampleTag(s)
          + (s.contact ? '<br><span style="font-size:0.72rem;color:var(--muted);">' + escapeHtmlText(s.contact) + '</span>' : '') + '</td>'
        + '<td style="font-size:0.8rem;">' + escapeHtmlText(roleText) + '</td>'
        + '<td style="font-family:var(--head);font-weight:700;">' + money(s.value, s.currency) + '</td>'
        + '<td>' + (s.twin ? escapeHtmlText(s.twin) : '—') + '</td>'
        + '<td>' + pill(s.status) + '</td>'
        + '<td class="row-actions">' + editBtn('sponsors', s.id) + delBtn('sponsors', s.id) + '</td>'
        + '</tr>';
    }).join('');
    if (!rows) rows = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted);">' + (searchQ.sponsors ? 'No sponsors match that search.' : 'No sponsors yet.') + '</td></tr>';
    document.getElementById('tbl-sponsors').innerHTML = table(['Sponsor', 'Role', 'Licence value', 'Twin school', 'Status', ''], rows);
  }

  function renderPartners() {
    var byType = { Ambassador: 0, Affiliate: 0, Referral: 0 };
    data.partners.forEach(function (p) { if (byType[p.type] != null) byType[p.type]++; });
    var totalOwed = data.partners.reduce(function (a, p) { return a + p.owed; }, 0);
    var totalSigned = data.partners.reduce(function (a, p) { return a + p.signed; }, 0);
    var pstats = [
      { label: 'Active partners', val: data.partners.length, sub: byType.Ambassador + ' amb · ' + byType.Affiliate + ' aff · ' + byType.Referral + ' ref' },
      { label: 'Schools signed', val: totalSigned, sub: 'via partner referrals' },
      { label: 'Commission owed', val: zar(totalOwed), sub: 'across all programmes' }
    ];
    document.getElementById('partner-stats').innerHTML = pstats.map(function (s) {
      return '<div class="stat"><div class="label">' + s.label + '</div><div class="val">' + s.val + '</div><div class="sub">' + s.sub + '</div></div>';
    }).join('');

    renderChips('partners', data.partners);
    var rows = data.partners.filter(function (p) {
      return chipFilter('partners', p) && matchesSearch('partners', [p.name, p.type, p.status, p.email, p.link, p.refCode]);
    }).map(function (p) {
      var typeCls = p.type === 'Affiliate' ? 'amber' : (p.type === 'Ambassador' ? 'cyan' : 'green');
      return '<tr' + (p._sample ? ' class="sample-row"' : '') + '>'
        + '<td><strong>' + escapeHtmlText(p.name) + '</strong>' + sampleTag(p) + '<br><span style="font-size:0.72rem;color:var(--muted);font-family:var(--mono);">' + escapeHtmlText(p.link || '') + '</span></td>'
        + '<td><span class="pill ' + typeCls + '">' + escapeHtmlText(p.type) + '</span></td>'
        + '<td>' + p.referred + '</td>'
        + '<td>' + p.signed + '</td>'
        + '<td style="font-family:var(--head);font-weight:700;color:var(--lime);">' + zar(p.owed) + '</td>'
        + '<td>' + pill(p.status) + '</td>'
        + '<td class="row-actions">'
          + editBtn('partners', p.id) + '&nbsp;'
          + '<button class="btn sm" data-partner-kit="' + p.id + '" title="Open the partner&rsquo;s personalised resources URL">&#127873;&nbsp;Kit</button>&nbsp;'
          + '<button class="btn sm" data-partner-welcome="' + p.id + '" title="Send the welcome email">&#9993;&nbsp;Welcome</button>&nbsp;'
          + '<button class="btn sm" data-partner-rotate="' + p.id + '" title="Issue a new referral code (invalidates the old kit URL)">&#128260;</button>&nbsp;'
          + delBtn('partners', p.id)
        + '</td>'
        + '</tr>';
    }).join('');
    if (!rows) rows = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted);">' + (searchQ.partners ? 'No partners match that search.' : 'No partners yet.') + '</td></tr>';
    document.getElementById('tbl-partners').innerHTML = table(['Partner', 'Programme', 'Referred', 'Signed', 'Owed', 'Status', ''], rows);
  }

  /* ---- Partner kit URL generator + welcome mailto ---- */
  function refCodeFor(p) {
    // Stable, human-readable code: first-name-initial + last-name + 3-digit id, all upper-case
    var bits = (p.name || '').trim().split(/\s+/);
    var first = (bits[0] || 'P').slice(0, 1).toUpperCase();
    var last = (bits[bits.length - 1] || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12) || 'PARTNER';
    var id = String(p.id || 0).padStart(3, '0');
    return first + last + '-' + id;
  }
  function partnerKitUrl(p) {
    var code = p.refCode || refCodeFor(p);
    var qs = new URLSearchParams({ code: code, name: p.name || '', email: p.email || '' });
    return 'https://www.blastbeat.education/pages/partner-resources.html?' + qs.toString();
  }
  document.body.addEventListener('click', function (e) {
    var kitBtn = e.target.closest('[data-partner-kit]');
    if (kitBtn) {
      var id = parseInt(kitBtn.dataset.partnerKit, 10);
      var p = data.partners.find(function (x) { return x.id === id; });
      if (!p) return;
      if (!p.refCode) { p.refCode = refCodeFor(p); save(); }
      var url = partnerKitUrl(p);
      // Copy + open
      navigator.clipboard && navigator.clipboard.writeText(url);
      window.open(url, '_blank');
      toast('Kit URL copied &mdash; ' + p.name);
      audit('open', 'partner-kit', { id: id, code: p.refCode });
      return;
    }
    var welcomeBtn = e.target.closest('[data-partner-welcome]');
    if (welcomeBtn) {
      var pid = parseInt(welcomeBtn.dataset.partnerWelcome, 10);
      var pp = data.partners.find(function (x) { return x.id === pid; });
      if (!pp) return;
      if (!pp.email) {
        toast('No email on file for ' + pp.name + ' &mdash; add one before sending.');
        return;
      }
      if (!pp.refCode) { pp.refCode = refCodeFor(pp); save(); }
      var to = pp.email;
      var first = (pp.name || '').split(' ')[0] || 'there';
      var url = partnerKitUrl(pp);
      var subj = 'Welcome to the Blastbeat partner cohort — your kit is ready';
      var body = 'Hi ' + first + ',\n\n' +
        'Welcome aboard. You are now part of the Blastbeat founding partner cohort.\n\n' +
        'Your personalised kit lives here — bookmark this URL, it is yours:\n' +
        url + '\n\n' +
        'Inside the kit:\n' +
        '  • Your pre-tagged links for pitch / for-schools / apply / 2winAid / patrons / see-it-in-action\n' +
        '  • Three sales scripts (cold email to schools, cold email to sponsors, WhatsApp warm intro)\n' +
        '  • A LinkedIn DM template\n' +
        '  • Live commission calculator\n' +
        '  • Printable A4 cheatsheet (PDF)\n' +
        '  • Logo + photo pack\n\n' +
        'Your referral code is ' + pp.refCode + '. Every link in your kit auto-attributes to you.\n\n' +
        'Three actions this week:\n' +
        '  1. Day 1 — cold email two principals and two sponsors using the scripts in the kit.\n' +
        '  2. Day 3 — WhatsApp your two warmest contacts.\n' +
        '  3. End of week — reply to this email with a short pipeline note: who you reached out to, what came back.\n\n' +
        'Quick replies, real humans. Anything weird, just ping me.\n\n' +
        'Tumelo\n' +
        'Partnership Lead, Blastbeat Education / Climate Actions Now';
      window.location.href = 'mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
      audit('send', 'partner-welcome', { id: pid, code: pp.refCode });
      toast('Welcome email opened &mdash; ' + pp.name);
      return;
    }
    var rotateBtn = e.target.closest('[data-partner-rotate]');
    if (rotateBtn) {
      var rid = parseInt(rotateBtn.dataset.partnerRotate, 10);
      var rp = data.partners.find(function (x) { return x.id === rid; });
      if (!rp) return;
      var oldCode = rp.refCode || refCodeFor(rp);
      if (!confirm('Rotate referral code for ' + rp.name + '?\n\nThis invalidates the existing kit URL (' + oldCode + '). Any links the partner has already shared will still resolve to the page, but will be attributed to the OLD code. Generate the new welcome email afterwards.')) return;
      // Bump the suffix until the code is unique across ALL partners —
      // referral codes are a money-attribution key, collisions misroute
      // commission to the wrong person.
      var codeTaken = function (code) {
        return data.partners.some(function (x) { return x !== rp && (x.refCode || refCodeFor(x)) === code; });
      };
      var stem = oldCode.replace(/-\d+$/, '');
      var nextSuffix = (parseInt(((oldCode.match(/-(\d+)$/) || [])[1] || '0'), 10) + 1);
      var candidate = stem + '-' + String(nextSuffix).padStart(3, '0');
      while (codeTaken(candidate)) {
        nextSuffix++;
        candidate = stem + '-' + String(nextSuffix).padStart(3, '0');
      }
      rp.refCode = candidate;
      save();
      audit('rotate', 'partner-code', { id: rid, from: oldCode, to: rp.refCode });
      render();
      toast('Code rotated &mdash; new: ' + rp.refCode);
      return;
    }
  });

  function renderLeads() {
    renderChips('leads', data.leads);
    var rows = data.leads.filter(function (l) {
      return chipFilter('leads', l) && matchesSearch('leads', [l.name, l.org, l.type, l.source, l.status, l.email, l.referral]);
    }).map(function (l) {
      var sub = [l.email, l.phone].filter(Boolean).join(' · ');
      var refTag = l.referral ? ' <span class="pill cyan" style="font-size:0.56rem;">REF ' + escapeHtmlText(l.referral) + '</span>' : '';
      return '<tr' + (l._sample ? ' class="sample-row"' : '') + '>'
        + '<td><strong>' + escapeHtmlText(l.name) + '</strong>' + refTag + sampleTag(l)
          + (sub ? '<br><span style="font-size:0.72rem;color:var(--muted);">' + escapeHtmlText(sub) + '</span>' : '') + '</td>'
        + '<td>' + escapeHtmlText(l.org) + '</td>'
        + '<td><span class="pill grey">' + escapeHtmlText(l.type) + '</span></td>'
        + '<td style="font-size:0.78rem;color:var(--muted);">' + escapeHtmlText(l.source) + '</td>'
        + '<td style="font-family:var(--mono);font-size:0.76rem;">' + escapeHtmlText(l.date) + '</td>'
        + '<td>' + pill(l.status) + '</td>'
        + '<td class="row-actions">' + editBtn('leads', l.id)
          + (l.status !== 'Converted' ? '<button class="btn sm" data-lead-convert="' + l.id + '" title="Create a pilot school record from this lead">&#127979;&nbsp;Convert</button>' : '')
          + delBtn('leads', l.id) + '</td>'
        + '</tr>';
    }).join('');
    if (!rows) rows = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted);">'
      + (searchQ.leads ? 'No leads match that search.' : 'No leads yet. Site form submissions land here automatically once the backend is connected.') + '</td></tr>';
    document.getElementById('tbl-leads').innerHTML = table(['Name', 'Organisation', 'Type', 'Source', 'Date', 'Status', ''], rows);
  }

  // ---- Add / edit / convert / remove ----
  var KIND_TO_COLLECTION = { school: 'schools', sponsor: 'sponsors', partner: 'partners', lead: 'leads' };

  document.body.addEventListener('click', function (e) {
    var addBtn = e.target.closest('[data-add]');
    if (addBtn) { openRecordModal(KIND_TO_COLLECTION[addBtn.dataset.add] || addBtn.dataset.add, null); return; }
    var editBtn = e.target.closest('[data-edit]');
    if (editBtn) { openRecordModal(editBtn.dataset.edit, parseInt(editBtn.dataset.id, 10)); return; }
    var convBtn = e.target.closest('[data-lead-convert]');
    if (convBtn) { convertLead(parseInt(convBtn.dataset.leadConvert, 10)); return; }
    var del = e.target.closest('[data-del]');
    if (del) {
      var kind = del.dataset.del, id = parseInt(del.dataset.id, 10);
      var rec = (data[kind] || []).find(function (x) { return x.id === id; });
      if (!rec) return;
      var label = rec.name || rec.company || ('#' + id);
      if (!confirm('Remove "' + label + '"?\n\nThis is recorded in the audit log.')) return;
      data[kind] = data[kind].filter(function (x) { return x.id !== id; });
      audit('delete', kind.replace(/s$/, ''), { id: id, name: label });
      save(); render();
      toast('Removed — ' + escapeHtmlText(label));
    }
  });

  /* ---- Record modal: one form for schools / sponsors / partners / leads ---- */
  var ENTITY_SPECS = {
    schools: {
      label: 'school',
      fields: [
        { k: 'name', label: 'School name', required: true },
        { k: 'country', label: 'Location (area · country)' },
        { k: 'twin', label: 'Twin sponsor' },
        { k: 'status', label: 'Status', type: 'select', opts: ['Active', 'Awaiting twin', 'Agreed in principle', 'Proposal', 'Heritage'] },
        { k: 'progress', label: 'Progress %', type: 'number', min: 0, max: 100 },
        { k: 'start', label: 'Start (date or TBC)' },
        { k: 'note', label: 'Note (internal)', type: 'textarea' }
      ],
      defaults: { status: 'Awaiting twin', progress: 0, start: 'TBC', twin: '', country: '', note: '', contact: '' }
    },
    sponsors: {
      label: 'sponsor',
      fields: [
        { k: 'company', label: 'Company / patron', required: true },
        { k: 'contact', label: 'Contact / note' },
        { k: 'value', label: 'Licence value', type: 'number', min: 0 },
        { k: 'currency', label: 'Currency', type: 'select', opts: ['ZAR', 'EUR'] },
        { k: 'twin', label: 'Twin school' },
        { k: 'status', label: 'Status', type: 'select', opts: ['Pledged', 'Confirmed', 'Invoiced', 'Funded'] }
      ],
      defaults: { tier: 'Twin (1 school)', value: 12225, currency: 'ZAR', twin: '', status: 'Pledged', contact: '' }
    },
    partners: {
      label: 'partner',
      fields: [
        { k: 'name', label: 'Name', required: true },
        { k: 'type', label: 'Programme', type: 'select', opts: ['Ambassador', 'Affiliate', 'Referral'] },
        { k: 'email', label: 'Email (for the welcome kit)', type: 'email' },
        { k: 'status', label: 'Status', type: 'select', opts: ['Active', 'Payout due', 'Paused'] },
        { k: 'referred', label: 'Referred', type: 'number', min: 0 },
        { k: 'signed', label: 'Signed', type: 'number', min: 0 },
        { k: 'owed', label: 'Commission owed (R)', type: 'number', min: 0 },
        { k: 'note', label: 'Note (internal)', type: 'textarea' }
      ],
      defaults: { type: 'Ambassador', email: '', referred: 0, signed: 0, owed: 0, status: 'Active', note: '' }
    },
    leads: {
      label: 'lead',
      fields: [
        { k: 'name', label: 'Name', required: true },
        { k: 'org', label: 'Organisation' },
        { k: 'email', label: 'Email', type: 'email' },
        { k: 'phone', label: 'Phone' },
        { k: 'type', label: 'Type', type: 'select', opts: ['School', 'Sponsor', 'Partner', 'Demo', 'Ambassador', 'Contact'] },
        { k: 'source', label: 'Source' },
        { k: 'date', label: 'Date', type: 'date' },
        { k: 'status', label: 'Status', type: 'select', opts: ['New', 'Contacted', 'Qualified', 'Converted', 'Closed'] }
      ],
      defaults: { org: '—', email: '', phone: '', type: 'School', source: 'manual', status: 'New' }
    }
  };

  var recordModal = document.getElementById('record-modal');
  var recordEditing = null; // { collection, id } while the modal is open

  function fieldHtml(f, value) {
    var v = value == null ? '' : String(value);
    var inner;
    if (f.type === 'select') {
      var cur = v || (f.opts[0] || '');
      var opts = f.opts.slice();
      if (v && opts.indexOf(v) === -1) opts.unshift(v); // keep legacy statuses selectable
      inner = '<select name="' + f.k + '">' + opts.map(function (o) {
        return '<option value="' + escapeHtmlAttr(o) + '"' + (o === cur ? ' selected' : '') + '>' + escapeHtmlText(o) + '</option>';
      }).join('') + '</select>';
    } else if (f.type === 'textarea') {
      inner = '<textarea name="' + f.k + '" rows="2">' + escapeHtmlText(v) + '</textarea>';
    } else {
      inner = '<input name="' + f.k + '" type="' + (f.type || 'text') + '"'
        + (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '')
        + ' value="' + escapeHtmlAttr(v) + '"' + (f.required ? ' required' : '') + '>';
    }
    return '<label class="field"><span>' + escapeHtmlText(f.label) + (f.required ? ' *' : '') + '</span>' + inner + '</label>';
  }

  function openRecordModal(collection, id) {
    var spec = ENTITY_SPECS[collection];
    if (!spec || !recordModal) return;
    var rec = id != null ? (data[collection] || []).find(function (x) { return x.id === id; }) : null;
    recordEditing = { collection: collection, id: rec ? rec.id : null };
    document.getElementById('record-title').textContent = (rec ? 'Edit ' : 'Add ') + spec.label;
    document.getElementById('record-fields').innerHTML = spec.fields.map(function (f) {
      var val = rec ? rec[f.k] : (f.k === 'date' ? new Date().toISOString().slice(0, 10) : spec.defaults[f.k]);
      return fieldHtml(f, val);
    }).join('');
    // Leads that arrived from a site form carry the full submission —
    // show it read-only so Robert can see exactly what was asked for.
    var extra = document.getElementById('record-extra');
    if (extra) {
      var bits = '';
      if (rec && rec.raw && typeof rec.raw === 'object') {
        bits += '<div class="field"><span>Original form submission</span><pre style="white-space:pre-wrap;word-break:break-word;background:#0a0e1a;padding:0.85rem;border-radius:8px;font-family:var(--mono);font-size:0.72rem;color:var(--muted);max-height:180px;overflow:auto;margin:0;">'
          + escapeHtmlText(Object.keys(rec.raw).map(function (k) { return k + ': ' + rec.raw[k]; }).join('\n')) + '</pre></div>';
      }
      if (rec && rec.email) {
        bits += '<a class="btn sm" href="mailto:' + encodeURIComponent(rec.email) + '">&#9993;&nbsp;Reply by email</a>';
      }
      extra.innerHTML = bits;
    }
    recordModal.hidden = false;
    setTimeout(function () {
      var first = recordModal.querySelector('input, select, textarea');
      if (first) first.focus();
    }, 30);
  }
  function closeRecordModal() { recordModal.hidden = true; recordEditing = null; }

  if (recordModal) {
    document.getElementById('record-close').addEventListener('click', closeRecordModal);
    document.getElementById('record-cancel').addEventListener('click', closeRecordModal);
    recordModal.addEventListener('click', function (e) { if (e.target === recordModal) closeRecordModal(); });
    document.getElementById('record-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!recordEditing) return;
      var collection = recordEditing.collection;
      var spec = ENTITY_SPECS[collection];
      var formEl = e.target;
      var isNew = recordEditing.id == null;
      var rec;
      if (isNew) {
        rec = Object.assign({ id: nextId(data[collection], collection) }, spec.defaults);
        data[collection].push(rec);
      } else {
        rec = data[collection].find(function (x) { return x.id === recordEditing.id; });
        if (!rec) { closeRecordModal(); return; }
      }
      spec.fields.forEach(function (f) {
        var el = formEl.elements[f.k];
        if (!el) return;
        var v = el.value;
        if (f.type === 'number') {
          var n = parseFloat(v);
          v = isFinite(n) ? n : 0;
          if (f.min != null && v < f.min) v = f.min;
          if (f.max != null && v > f.max) v = f.max;
        } else {
          v = String(v).trim();
        }
        rec[f.k] = v;
      });
      if (collection === 'partners') {
        if (!rec.refCode) rec.refCode = refCodeFor(rec);
        if (!rec.link) rec.link = 'bb.education/r/' + String(rec.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      audit(isNew ? 'create' : 'edit', spec.label, { id: rec.id, name: rec.name || rec.company || '' });
      save(); render();
      closeRecordModal();
      toast((isNew ? 'Added — ' : 'Saved — ') + escapeHtmlText(rec.name || rec.company || spec.label));
    });
  }

  function convertLead(id) {
    var l = data.leads.find(function (x) { return x.id === id; });
    if (!l) return;
    var schoolName = (l.org && l.org !== '—') ? l.org : l.name;
    if (!confirm('Convert "' + schoolName + '" into a pilot school record?\n\nThe lead stays here, marked Converted.')) return;
    data.schools.push({
      id: nextId(data.schools, 'schools'), name: schoolName, country: '', contact: l.email || '',
      status: 'Awaiting twin', twin: '', progress: 0, start: 'TBC',
      note: 'From lead: ' + (l.name || '') + (l.email ? ' · ' + l.email : '')
    });
    l.status = 'Converted';
    audit('convert', 'lead', { id: l.id, school: schoolName });
    save(); render();
    toast('Lead converted — school added to the pilot roster.');
  }

  /* ===========================================================
     LICENCES — W3C-style Verifiable Credentials with SHA-256 stamp
     =========================================================== */

  if (!data.licences) data.licences = [];
  if (!data.audit) data.audit = [];

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'lic-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  async function sha256Hex(str) {
    if (window.crypto && crypto.subtle) {
      var enc = new TextEncoder().encode(str);
      var buf = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }
    // Fallback (shouldn't hit in modern browsers): a non-cryptographic stamp marked as such
    var h = 0; for (var i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
    return 'fallback-' + Math.abs(h).toString(16);
  }
  function canonicalize(obj) {
    // Stable JSON serialization for hashing — sort keys recursively
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
    return '{' + Object.keys(obj).sort().map(function (k) { return JSON.stringify(k) + ':' + canonicalize(obj[k]); }).join(',') + '}';
  }

  // Issuing entity per region (per BB_PROGRAMME.issuing_entity_by_region):
  // SA & Namibia licences are issued by Climate Actions Now RSA; UK by the UK charity.
  var ISSUER_DID = {
    ZA: { id: 'https://www.blastbeat.education/issuers/can-rsa', name: 'Climate Actions Now RSA (Pty) Ltd', country: 'ZA' },
    NA: { id: 'https://www.blastbeat.education/issuers/can-rsa', name: 'Climate Actions Now RSA (Pty) Ltd', country: 'NA' },
    UK: { id: 'https://www.blastbeat.education/issuers/can-uk',  name: 'Climate Actions Now (UK Registered Charity No. 1113530)', country: 'GB' },
    IE: { id: 'https://www.blastbeat.education/issuers/can-ie',  name: 'Climate Actions Now Ltd (Ireland)', country: 'IE' }
  };
  // The founding SA licence is a flat R12,225 (ZAR) regardless of tier; tier is the
  // medallion level. (The €1,250 figure is an outward marketing rate only.)
  var LICENCE_AMOUNT_ZAR = (window.BB_PROGRAMME && window.BB_PROGRAMME.pricing && window.BB_PROGRAMME.pricing.licence && window.BB_PROGRAMME.pricing.licence.amount) || 12225;
  var TIER_NAME = {};
  var TIER_VALUE = {};
  ((window.BB_PROGRAMME && window.BB_PROGRAMME.tiers) || []).forEach(function (t) {
    TIER_NAME[t.id] = t.name;
    TIER_VALUE[t.id] = LICENCE_AMOUNT_ZAR;
  });
  function tierLabel(id) { return TIER_NAME[id] || id; }

  async function buildCredential(form) {
    var now = new Date();
    var iso = now.toISOString();
    var issuer = ISSUER_DID[form.region] || ISSUER_DID.ZA;
    var validFrom = form.validFrom ? new Date(form.validFrom).toISOString() : iso;
    var validUntil = addMonths(form.validFrom || iso, form.tier === 'founding-pilot' ? 6 : 12);
    var credId = 'urn:uuid:' + uuid();

    var unsigned = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.blastbeat.education/credentials/v1'
      ],
      id: credId,
      type: ['VerifiableCredential', 'BlastbeatLicenceCredential'],
      issuer: { id: issuer.id, name: issuer.name, country: issuer.country },
      issuanceDate: iso,
      validFrom: validFrom,
      validUntil: validUntil.toISOString(),
      credentialSubject: {
        id: 'bb:school:' + (form.school || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 64),
        schoolName: form.school,
        programme: 'Blastbeat V2 — Event Social Enterprise Licence',
        tier: tierLabel(form.tier),
        tierId: form.tier,
        amountZAR: TIER_VALUE[form.tier] || LICENCE_AMOUNT_ZAR,
        sponsor: { name: form.sponsor, notes: form.notes || '' },
        region: form.region,
        referredBy: (form.partner || form.partnerCode) ? { partner: form.partner || '', code: form.partnerCode || '' } : null,
        rights: {
          enrolmentSeats: 100,
          rolesPerESE: 14,
          profitSplit: '75 / 25 (student / climate)',
          renewable: true
        }
      }
    };
    var canon = canonicalize(unsigned);
    var hash = await sha256Hex(canon);
    unsigned.proof = {
      type: 'Sha256Stamp2026',
      created: iso,
      proofPurpose: 'assertionMethod',
      verificationMethod: issuer.id + '#stamp',
      proofValue: hash,
      note: 'SHA-256 hash of the canonicalized credential minus the proof field. Tamper-evident: any change to the credential body invalidates this proof. For production: replace with Ed25519 / RSA signature.'
    };
    return unsigned;
  }

  /* ---- Issuance modal ---- */
  var issueModal = document.getElementById('issue-modal');
  var previewModal = document.getElementById('preview-modal');

  var stampingRosterId = null;
  function openIssueModal(prefill) {
    var dl = document.getElementById('schools-datalist');
    if (dl) {
      dl.innerHTML = data.schools.map(function (s) {
        return '<option value="' + escapeHtmlAttr(s.name) + '">' + escapeHtmlText(s.country) + '</option>';
      }).join('');
    }
    var sponsorDl = document.getElementById('sponsors-datalist');
    if (sponsorDl) {
      sponsorDl.innerHTML = data.sponsors.map(function (s) {
        return '<option value="' + escapeHtmlAttr(s.company) + '">' + escapeHtmlText(s.tier || '') + '</option>';
      }).join('');
    }
    var partnerDl = document.getElementById('partners-ref-datalist');
    if (partnerDl) {
      partnerDl.innerHTML = data.partners.map(function (p) {
        var code = p.refCode || refCodeFor(p);
        return '<option value="' + escapeHtmlAttr(p.name) + '">' + escapeHtmlText(code) + ' &mdash; ' + escapeHtmlText(p.type || '') + '</option>';
      }).join('');
    }
    var pre = prefill || {};
    document.getElementById('f-school').value = pre.school || '';
    document.getElementById('f-sponsor').value = pre.sponsor || '';
    var fp = document.getElementById('f-partner'); if (fp) fp.value = '';
    document.getElementById('f-notes').value = pre.notes || '';
    document.getElementById('f-from').value = pre.validFrom || new Date().toISOString().slice(0, 10);
    var tierSel = document.getElementById('f-tier'); if (tierSel && pre.tier) tierSel.value = pre.tier;
    var regSel = document.getElementById('f-region'); if (regSel && pre.region) regSel.value = pre.region;
    issueModal.hidden = false;
    setTimeout(function () { document.getElementById('f-school').focus(); }, 30);
  }
  function closeIssueModal() { issueModal.hidden = true; }
  function closePreviewModal() { previewModal.hidden = true; }

  function escapeHtmlText(s) {
    return String(s).replace(/[&<>]/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]); });
  }
  function escapeHtmlAttr(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]); });
  }

  var openIssueBtn = document.getElementById('issue-licence-open');
  if (openIssueBtn) openIssueBtn.addEventListener('click', function () { stampingRosterId = null; openIssueModal(); });
  document.getElementById('issue-close').addEventListener('click', closeIssueModal);
  document.getElementById('issue-cancel').addEventListener('click', closeIssueModal);
  document.getElementById('preview-close').addEventListener('click', closePreviewModal);
  issueModal.addEventListener('click', function (e) { if (e.target === issueModal) closeIssueModal(); });
  previewModal.addEventListener('click', function (e) { if (e.target === previewModal) closePreviewModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!issueModal.hidden) closeIssueModal();
    if (!previewModal.hidden) closePreviewModal();
    if (recordModal && !recordModal.hidden) closeRecordModal();
  });

  // Loose name equality for duplicate detection: case, whitespace and
  // punctuation insensitive, so "Rhodes High" vs "rhodes high " vs
  // "Rhodes High." don't spawn duplicate rows.
  function sameName(a, b) {
    var norm = function (s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
    return norm(a) === norm(b);
  }

  document.getElementById('issue-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var partnerInput = ((document.getElementById('f-partner') || {}).value || '').trim();
    // The field promises "name or referral code" — honour both.
    var matchedPartner = data.partners.find(function (p) {
      if (p.name && p.name.toLowerCase() === partnerInput.toLowerCase()) return true;
      var code = p.refCode || refCodeFor(p);
      return code && code.toLowerCase() === partnerInput.toLowerCase();
    });
    var form = {
      school: document.getElementById('f-school').value.trim(),
      sponsor: document.getElementById('f-sponsor').value.trim(),
      tier: document.getElementById('f-tier').value,
      region: document.getElementById('f-region').value,
      validFrom: document.getElementById('f-from').value,
      partner: matchedPartner ? matchedPartner.name : partnerInput,
      partnerCode: matchedPartner ? (matchedPartner.refCode || refCodeFor(matchedPartner)) : '',
      notes: document.getElementById('f-notes').value.trim()
    };
    if (!form.school || !form.sponsor) { toast('School and sponsor are required.'); return; }
    // Build the credential FIRST — if hashing ever fails, nothing has been
    // written yet (no half-committed auto-created school/sponsor).
    var vc;
    try {
      vc = await buildCredential(form);
    } catch (err) {
      toast('Could not build the credential (' + escapeHtmlText(err && err.message || 'crypto error') + '). Nothing was saved.');
      return;
    }
    // Auto-create the school if Robert typed a name we've never seen.
    // Same for the sponsor. Cuts the post-sale flow from two-step to one-step.
    var regionToCountry = { ZA: 'South Africa', UK: 'United Kingdom', IE: 'Ireland' };
    var schoolExists = data.schools.some(function (s) { return sameName(s.name, form.school); });
    if (!schoolExists) {
      data.schools.push({ id: nextId(data.schools, 'schools'), name: form.school, country: regionToCountry[form.region] || '', contact: '', status: 'Active', twin: form.sponsor, progress: 0, start: form.validFrom });
      audit('create', 'school', { id: data.schools[data.schools.length - 1].id, autoCreatedDuring: 'licence-issue' });
    }
    var sponsorExists = data.sponsors.some(function (s) { return sameName(s.company, form.sponsor); });
    if (!sponsorExists) {
      data.sponsors.push({ id: nextId(data.sponsors, 'sponsors'), company: form.sponsor, tier: form.tier, value: TIER_VALUE[form.tier] || 0, twin: form.school, status: 'Confirmed', contact: '' });
      audit('create', 'sponsor', { id: data.sponsors[data.sponsors.length - 1].id, autoCreatedDuring: 'licence-issue' });
    }
    data.licences.push({
      id: vc.id,
      issuanceDate: vc.issuanceDate,
      school: form.school,
      sponsor: form.sponsor,
      tier: form.tier,
      region: form.region,
      amount: TIER_VALUE[form.tier] || LICENCE_AMOUNT_ZAR,
      currency: 'ZAR',
      status: 'valid',
      partner: form.partner || '',
      partnerCode: form.partnerCode || '',
      proofHash: vc.proof.proofValue,
      vc: vc
    });
    // If this issuance came from "Stamp" on a roster line, retire that roster record.
    if (stampingRosterId) {
      var ri = data.licences.findIndex(function (l) { return l.source === 'programme' && l.id === stampingRosterId; });
      if (ri !== -1) data.licences.splice(ri, 1);
      stampingRosterId = null;
    }
    // Credit referred deals against the partner's pipeline counter
    if (matchedPartner) {
      matchedPartner.signed = (matchedPartner.signed || 0) + 1;
      // 25% ambassador commission — matches BB_PROGRAMME.ambassadors
      // (Tekkers→Puma ledger entry: R3,056 = 25% of R12,225).
      matchedPartner.owed   = (matchedPartner.owed   || 0) + Math.round((TIER_VALUE[form.tier] || 0) * 0.25);
    }
    audit('issue', 'licence', { id: vc.id, school: form.school, sponsor: form.sponsor, tier: form.tier, region: form.region, partner: form.partnerCode || form.partner || '' });
    save();
    closeIssueModal();
    renderLicences();
    renderAudit();
    renderOverview();
    showCredentialPreview(vc);
    if (window.bbTrack) window.bbTrack('licence_issued', {
      tier: form.tier,
      region: form.region,
      value: TIER_VALUE[form.tier] || 0,
      currency: 'ZAR'
    });
    toast('Licence issued and stamped &mdash; ' + form.school);
  });

  function showCredentialPreview(vc) {
    document.getElementById('preview-title').textContent = 'Licence — ' + (vc.credentialSubject.schoolName || '');
    document.getElementById('preview-json').textContent = JSON.stringify(vc, null, 2);
    document.getElementById('preview-download').onclick = function () { downloadJson(vc, 'blastbeat-licence-' + vc.id.replace('urn:uuid:', '').slice(0, 8) + '.json'); };
    document.getElementById('preview-email').onclick = function () {
      var idShort = vc.id.replace('urn:uuid:', '').slice(0, 8);
      var subj = 'Your Blastbeat licence — ' + vc.credentialSubject.schoolName;
      var body = 'Hi,\n\nHere is the Blastbeat V2 licence credential for ' + vc.credentialSubject.schoolName +
                 ', issued by ' + vc.issuer.name + ' on ' + vc.issuanceDate.slice(0, 10) + '.\n\n' +
                 'Licence ID: ' + vc.id + '\nTier: ' + vc.credentialSubject.tier + '\n' +
                 'Tamper-evident SHA-256 proof: ' + vc.proof.proofValue + '\n\n' +
                 'Verify it any time (live register — shows valid / revoked / expired):\n' +
                 'https://www.blastbeat.education/verify/' + idShort + '\n\n' +
                 'The full W3C-aligned JSON-LD credential file is attached. (Robert: click "Download .json" in the preview and attach it to this email before sending.) The proof value is a SHA-256 hash of the canonicalised credential body — any change invalidates it.\n\n' +
                 'Best,\nClimate Actions Now / Blastbeat Education';
      window.location.href = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
    };
    var certBtn = document.getElementById('preview-certificate');
    if (certBtn) certBtn.onclick = function () { openCertificate(vc); };
    previewModal.hidden = false;
  }

  /* ---- Printable PDF certificate (renders to a new window, auto-opens print dialog) ---- */
  function openCertificate(vc) {
    var idShort = vc.id.replace('urn:uuid:', '').slice(0, 8).toUpperCase();
    var proofShort = (vc.proof.proofValue || '').slice(0, 16);
    var validFrom = (vc.validFrom || vc.issuanceDate || '').slice(0, 10);
    var validUntil = (vc.validUntil || '').slice(0, 10);
    var verifyUrl = 'https://www.blastbeat.education/verify/' + idShort;
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(verifyUrl);

    var html = '<!doctype html><html><head><meta charset="utf-8"><title>Blastbeat Licence Certificate — ' + escapeHtmlText(vc.credentialSubject.schoolName) + '</title>'
      + '<style>'
      + '@page { size: A4 portrait; margin: 0; }'
      + '* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }'
      + 'body { margin: 0; font-family: Georgia, "Times New Roman", serif; color: #1a1206; background: #f7efd9; }'
      + '.cert { width: 210mm; min-height: 297mm; padding: 22mm 22mm 18mm; position: relative; background: linear-gradient(135deg, #fbf4dd 0%, #f3e7c0 100%); }'
      + '.cert::before { content: ""; position: absolute; inset: 10mm; border: 1.5px solid #c9a24b; border-radius: 4px; pointer-events: none; }'
      + '.cert::after { content: ""; position: absolute; inset: 12mm; border: 0.5px solid #c9a24b; opacity: 0.55; border-radius: 3px; pointer-events: none; }'
      + '.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18mm; position: relative; z-index: 1; }'
      + '.brand { font-family: "Helvetica Neue", Arial, sans-serif; letter-spacing: 0.32em; font-size: 11pt; font-weight: 800; color: #1a1206; }'
      + '.brand span { color: #c9a24b; }'
      + '.id-stamp { font-family: ui-monospace, "SF Mono", Consolas, monospace; font-size: 9pt; color: #6b4f1c; letter-spacing: 0.12em; }'
      + '.eyebrow { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 10pt; letter-spacing: 0.32em; text-transform: uppercase; color: #8a6a26; margin-bottom: 8mm; text-align: center; }'
      + 'h1.title { font-style: italic; font-size: 42pt; text-align: center; margin: 0 0 10mm; line-height: 1.05; color: #1a1206; font-weight: 900; }'
      + 'h1.title em { color: #c9a24b; font-style: italic; }'
      + '.deck { text-align: center; font-size: 13pt; max-width: 130mm; margin: 0 auto 14mm; line-height: 1.55; color: #3a2a12; }'
      + '.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm 18mm; max-width: 150mm; margin: 0 auto 16mm; }'
      + '.field { border-bottom: 0.8px solid #c9a24b; padding-bottom: 4mm; }'
      + '.field .label { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 8pt; letter-spacing: 0.22em; text-transform: uppercase; color: #8a6a26; margin-bottom: 2mm; }'
      + '.field .value { font-size: 14pt; font-weight: 700; color: #1a1206; }'
      + '.attest { text-align: center; max-width: 150mm; margin: 0 auto 12mm; font-size: 11pt; line-height: 1.6; color: #3a2a12; font-style: italic; }'
      + '.foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 10mm; margin-top: 14mm; }'
      + '.sig { flex: 1; }'
      + '.sig-line { border-top: 1px solid #1a1206; margin-bottom: 2mm; height: 22mm; }'
      + '.sig-label { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 9pt; color: #6b4f1c; letter-spacing: 0.1em; text-transform: uppercase; }'
      + '.qr { width: 32mm; text-align: center; }'
      + '.qr img { width: 30mm; height: 30mm; display: block; margin: 0 auto 2mm; background: white; padding: 1.5mm; border: 0.5px solid #c9a24b; }'
      + '.qr .verify-url { font-family: ui-monospace, monospace; font-size: 7pt; color: #6b4f1c; word-break: break-all; }'
      + '.proof { font-family: ui-monospace, "SF Mono", Consolas, monospace; font-size: 7.5pt; color: #6b4f1c; text-align: center; margin-top: 4mm; letter-spacing: 0.04em; }'
      + '.fineprint { font-size: 7.5pt; color: #6b4f1c; text-align: center; margin-top: 4mm; line-height: 1.5; }'
      + '@media screen { body { padding: 20px; background: #2a2a2a; } .cert { margin: 0 auto; box-shadow: 0 30px 80px rgba(0,0,0,0.6); } .toolbar { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); background: #1a1206; color: #f4ecd8; padding: 10px 18px; border-radius: 8px; z-index: 100; font-family: -apple-system, system-ui, sans-serif; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); } .toolbar button { background: #c9a24b; color: #1a1206; border: none; padding: 7px 14px; border-radius: 5px; font-weight: 700; cursor: pointer; margin-left: 10px; font-family: inherit; font-size: 13px; } }'
      + '@media print { body { padding: 0; background: white; } .toolbar { display: none; } .cert { box-shadow: none; margin: 0; } }'
      + '</style></head><body>'
      + '<div class="toolbar">Press <strong>Cmd/Ctrl + P</strong> and choose <strong>Save as PDF</strong>, or '
      + '<button onclick="window.print()">Print / Save as PDF</button></div>'
      + '<div class="cert">'
      + '<div class="header">'
        + '<div class="brand">BLAST<span>BEAT</span></div>'
        + '<div class="id-stamp">LICENCE ID &middot; ' + idShort + '</div>'
      + '</div>'
      + '<div class="eyebrow">Verifiable Licence Certificate</div>'
      + '<h1 class="title"><em>This licence is awarded to</em><br>' + escapeHtmlText(vc.credentialSubject.schoolName) + '</h1>'
      + '<p class="deck">Granting the holder full access to the <strong>Blastbeat V2</strong> Event Social Enterprise programme &mdash; including the four-phase curriculum, fourteen real business roles, teacher training, the AI mentor, the impact report, and entry to the National Finals.</p>'
      + '<div class="fields">'
        + '<div class="field"><div class="label">Sponsor / Patron</div><div class="value">' + escapeHtmlText(vc.credentialSubject.sponsor) + '</div></div>'
        + '<div class="field"><div class="label">Tier</div><div class="value">' + escapeHtmlText(vc.credentialSubject.tier) + '</div></div>'
        + '<div class="field"><div class="label">Valid from</div><div class="value">' + validFrom + '</div></div>'
        + '<div class="field"><div class="label">Valid until</div><div class="value">' + validUntil + '</div></div>'
        + '<div class="field"><div class="label">Issued by</div><div class="value">' + escapeHtmlText(vc.issuer.name) + '</div></div>'
        + '<div class="field"><div class="label">Date of issue</div><div class="value">' + vc.issuanceDate.slice(0, 10) + '</div></div>'
      + '</div>'
      + '<p class="attest">Issued in trust on behalf of the holder, the sponsor and the Blastbeat learner community. This certificate is backed by a W3C-aligned Verifiable Credential and a tamper-evident SHA-256 proof &mdash; recorded on the Blastbeat registry.</p>'
      + '<div class="foot">'
        + '<div class="sig">'
          + '<div class="sig-line"></div>'
          + '<div class="sig-label">Robert Stephenson FRSA &mdash; Founder &amp; Programme Director</div>'
        + '</div>'
        + '<div class="qr">'
          + '<img src="' + qrUrl + '" alt="Verify QR code">'
          + '<div class="verify-url">verify/' + idShort + '</div>'
        + '</div>'
      + '</div>'
      + '<div class="proof">Proof &middot; sha256:' + proofShort + '&hellip;</div>'
      + '<div class="fineprint">Climate Actions Now group &middot; Verify at blastbeat.education/verify/' + idShort + ' &middot; Any alteration to this certificate or its backing credential invalidates the SHA-256 proof.</div>'
      + '</div>'
      + '<script>window.addEventListener("load", function(){ setTimeout(function(){ try { window.focus(); } catch(e){} }, 400); });<\/script>'
      + '</body></html>';

    var w = window.open('', '_blank');
    if (!w) { toast('Pop-up blocked &mdash; allow pop-ups for this site to print certificates.'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  function downloadJson(obj, filename) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---- Renderers for the new views ----
     data.licences holds two kinds of record:
       - roster (source:'programme') — the real agreed pipeline from BB_PROGRAMME;
         has amount/status/twin but no cryptographic VC yet. Robert "stamps" these
         to generate a real W3C credential + certificate.
       - issued — created by the credential engine; has a urn:uuid id, proofHash, vc. */
  function renderLicences() {
    var live = data.licences.filter(function (l) { return l.status !== 'revoked'; });
    var totalValue = live.reduce(function (a, l) {
      return a + (typeof l.amount === 'number' ? l.amount : (TIER_VALUE[l.tier] || 0));
    }, 0);
    var byRegion = data.licences.reduce(function (a, l) { a[l.region] = (a[l.region] || 0) + 1; return a; }, {});
    var stamped = live.filter(function (l) { return l.vc; }).length;
    var revoked = data.licences.length - live.length;
    var renewals = live.filter(function (l) {
      var d = daysUntil(l.vc ? l.vc.validUntil : l.validUntil);
      return d != null && d <= 60;
    }).length;
    var stats = [
      { label: 'Licences on record', val: data.licences.length, sub: stamped + ' credentialed · ' + (live.length - stamped) + ' on the roster' + (revoked ? ' · ' + revoked + ' revoked' : '') },
      { label: 'Programme value', val: zar(totalValue), sub: 'active licences only' },
      { label: 'Renewals due ≤60d', val: renewals, sub: renewals ? 'chase these first' : 'nothing urgent' },
      { label: 'By region', val: 'ZA ' + (byRegion.ZA || 0) + ' · NA ' + (byRegion.NA || 0) + ' · UK ' + (byRegion.UK || 0), sub: '' }
    ];
    var statsEl = document.getElementById('licence-stats');
    if (statsEl) statsEl.innerHTML = stats.map(function (s) {
      return '<div class="stat"><div class="label">' + s.label + '</div><div class="val">' + s.val + '</div><div class="sub">' + s.sub + '</div></div>';
    }).join('');

    renderChips('licences', data.licences);
    var list = data.licences.filter(function (l) {
      return chipFilter('licences', l) && matchesSearch('licences', [l.school, l.sponsor, tierLabel(l.tier), l.region, l.status, String(l.id)]);
    });
    var rows = list.length ? list.slice().reverse().map(function (l) {
      var isIssued = !!l.vc;
      var isRevoked = l.status === 'revoked';
      var validUntil = isIssued ? l.vc.validUntil : l.validUntil;
      var days = daysUntil(validUntil);
      var displayStatus = isRevoked ? 'revoked'
        : (days != null && days < 0) ? 'expired'
        : (l.status || (isIssued ? 'valid' : 'roster'));
      var renewChip = (!isRevoked && days != null && days >= 0 && days <= 60)
        ? ' <span class="pill amber" style="font-size:0.56rem;">renews in ' + days + 'd</span>' : '';
      var idShort = isIssued ? l.id.replace('urn:uuid:', '').slice(0, 8) : escapeHtmlText(l.id);
      var proofCell = isIssued
        ? '<span style="font-family:var(--mono);font-size:0.74rem;color:var(--lime);">' + l.proofHash.slice(0, 12) + '&hellip;</span>'
        : '<span class="pill grey" style="font-size:0.56rem;">roster</span>';
      var dateCell = isIssued ? l.issuanceDate.slice(0, 10) : (l.validFrom || '—');
      var twin = (l.twinCohort || l.twinLoc) ? ('<br><span style="font-size:0.66rem;color:var(--muted);">twin: ' + escapeHtmlText([l.twinCohort, l.twinLoc].filter(Boolean).join(' · ')) + '</span>') : '';
      var actions = isIssued
        ? '<button class="btn sm" data-licence-view="' + l.id + '">View</button>' + (isRevoked ? '' : '<button class="btn sm" data-licence-revoke="' + l.id + '">Revoke</button>')
        : '<button class="btn sm" data-licence-stamp="' + escapeHtmlAttr(l.id) + '">&#9745; Stamp</button>';
      return '<tr' + (isRevoked ? ' class="revoked-row"' : '') + '>'
        + '<td><strong>' + escapeHtmlText(l.school) + '</strong>' + twin + '<br><span style="font-size:0.7rem;color:var(--muted);font-family:var(--mono);">' + idShort + '</span></td>'
        + '<td>' + escapeHtmlText(l.sponsor) + '</td>'
        + '<td><span class="pill cyan">' + escapeHtmlText(tierLabel(l.tier)) + '</span></td>'
        + '<td><span class="pill grey">' + (l.region || '—') + '</span></td>'
        + '<td style="font-family:var(--head);font-weight:700;">' + money(l.amount, l.currency) + '</td>'
        + '<td>' + pill(displayStatus) + renewChip + '</td>'
        + '<td>' + proofCell + '</td>'
        + '<td style="font-family:var(--mono);font-size:0.74rem;">' + dateCell + '</td>'
        + '<td class="row-actions">' + actions + '</td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--muted);">'
      + (searchQ.licences ? 'No licences match that search.' : 'No licences yet. Click <strong>+ Issue new licence</strong> to begin.') + '</td></tr>';
    var tbl = document.getElementById('tbl-licences');
    if (tbl) tbl.innerHTML = '<thead><tr><th>School / ID</th><th>Sponsor</th><th>Tier</th><th>Region</th><th>Amount</th><th>Status</th><th>Proof</th><th>Date</th><th></th></tr></thead><tbody>' + rows + '</tbody>';
  }

  function renderAudit() {
    var rows = data.audit.length ? data.audit.slice().reverse().map(function (a) {
      var detail = a.detail ? JSON.stringify(a.detail) : '';
      var actionCls = a.action === 'issue' ? 'green' : a.action === 'revoke' ? 'pink' : a.action === 'delete' ? 'pink' : a.action === 'create' ? 'cyan' : 'grey';
      return '<tr>'
        + '<td style="font-family:var(--mono);font-size:0.74rem;color:var(--muted);">' + a.timestamp + '</td>'
        + '<td><span class="pill ' + actionCls + '">' + a.action + '</span></td>'
        + '<td>' + escapeHtmlText(a.entity) + '</td>'
        + '<td style="font-family:var(--mono);font-size:0.74rem;">' + escapeHtmlText(a.who || '—') + '</td>'
        + '<td style="font-family:var(--mono);font-size:0.72rem;color:var(--muted);">' + escapeHtmlText(detail) + '</td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--muted);">Audit log is empty. Every issue / revoke / create / edit / delete is recorded here.</td></tr>';
    var tbl = document.getElementById('tbl-audit');
    if (tbl) tbl.innerHTML = '<thead><tr><th>Timestamp (UTC)</th><th>Action</th><th>Entity</th><th>Who</th><th>Detail</th></tr></thead><tbody>' + rows + '</tbody>';
  }

  function audit(action, entity, detail) {
    data.audit.push({ timestamp: new Date().toISOString(), action: action, entity: entity, who: apiWho || 'local', detail: detail || null });
    save();
  }

  /* ---- Wire table row buttons ---- */
  document.body.addEventListener('click', function (e) {
    var view = e.target.closest('[data-licence-view]');
    if (view) {
      var id = view.dataset.licenceView;
      var lic = data.licences.find(function (l) { return l.id === id; });
      if (lic) showCredentialPreview(lic.vc);
    }
    var stamp = e.target.closest('[data-licence-stamp]');
    if (stamp) {
      var sid = stamp.dataset.licenceStamp;
      var rl = data.licences.find(function (l) { return l.source === 'programme' && l.id === sid; });
      if (!rl) return;
      stampingRosterId = sid;
      openIssueModal({ school: rl.school, sponsor: rl.sponsor, tier: rl.tier, region: rl.region, validFrom: rl.validFrom, notes: 'Stamping roster licence ' + sid });
      return;
    }
    var rev = e.target.closest('[data-licence-revoke]');
    if (rev) {
      var rid = rev.dataset.licenceRevoke;
      if (!confirm('Revoke this licence?\n\nThe record stays on the register marked REVOKED (the public verify page reports it as revoked), and the action is written to the audit log.')) return;
      var l2 = data.licences.find(function (l) { return l.id === rid; });
      if (!l2) return;
      l2.status = 'revoked';
      l2.revokedAt = new Date().toISOString();
      // A referred deal credited the partner's signed/owed at issue time —
      // offer to reverse it so commission isn't owed on a dead deal.
      var refPartner = l2.partnerCode ? data.partners.find(function (p) { return (p.refCode || refCodeFor(p)) === l2.partnerCode; }) : null;
      if (refPartner && confirm('This licence was referred by ' + refPartner.name + '.\n\nReverse their commission for it (signed −1, owed −' + zar(Math.round((l2.amount || 0) * 0.25)) + ')?')) {
        refPartner.signed = Math.max(0, (refPartner.signed || 0) - 1);
        refPartner.owed = Math.max(0, (refPartner.owed || 0) - Math.round((l2.amount || 0) * 0.25));
        audit('reverse', 'commission', { partner: refPartner.name, licence: rid });
      }
      audit('revoke', 'licence', { id: rid, school: l2.school });
      save(); renderLicences(); renderPartners(); renderAudit(); renderOverview();
      toast('Licence revoked — kept on the register as revoked.');
    }
  });

  /* ---- Exports ---- */
  function legalBundle() {
    return {
      generated: new Date().toISOString(),
      generator: 'Blastbeat Admin v1 (prototype)',
      note: 'Credentials follow the W3C Verifiable Credentials Data Model v1.1. The proof type Sha256Stamp2026 is a tamper-evident hash, not a cryptographic signature — it proves no post-issuance changes have been made to the credential body. For production legal use, the issuance pipeline should be migrated to Ed25519 / RSA signatures held by Climate Actions Now under each regional entity.',
      issuers: ISSUER_DID,
      licences: data.licences,
      audit: data.audit
    };
  }
  var legalBtn = document.getElementById('export-legal-bundle');
  if (legalBtn) legalBtn.addEventListener('click', function () {
    downloadJson(legalBundle(), 'blastbeat-legal-bundle-' + new Date().toISOString().slice(0,10) + '.json');
    toast('Legal bundle downloaded.');
  });
  var auditExportBtn = document.getElementById('export-audit');
  if (auditExportBtn) auditExportBtn.addEventListener('click', function () {
    downloadJson({ exportedAt: new Date().toISOString(), entries: data.audit }, 'blastbeat-audit-' + new Date().toISOString().slice(0,10) + '.json');
    toast('Audit log exported.');
  });
  var everythingBtn = document.getElementById('export-everything');
  if (everythingBtn) everythingBtn.addEventListener('click', function () {
    downloadJson({ exportedAt: new Date().toISOString(), data: data }, 'blastbeat-full-state-' + new Date().toISOString().slice(0,10) + '.json');
    toast('Full state exported.');
  });
  // Bulk-export every partner with their kit URL — accounting + board reports
  var kitsBtn = document.getElementById('export-partner-kits');
  if (kitsBtn) kitsBtn.addEventListener('click', function () {
    var csvCell = function (v) {
      var s = String(v == null ? '' : v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    var header = ['id','name','email','type','refCode','status','signed','owed_zar','kit_url','welcome_subject'];
    var lines = [header.join(',')];
    data.partners.forEach(function (p) {
      if (!p.refCode) p.refCode = refCodeFor(p);
      var row = [
        p.id, p.name, p.email || '', p.type || '', p.refCode, p.status || '',
        p.signed || 0, p.owed || 0,
        partnerKitUrl(p),
        'Welcome to the Blastbeat partner cohort — your kit is ready'
      ].map(csvCell).join(',');
      lines.push(row);
    });
    var csv = lines.join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'blastbeat-partner-kits-' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    save();
    audit('export', 'partner-kits', { count: data.partners.length });
    toast('Partner kits CSV exported &mdash; ' + data.partners.length + ' partners.');
  });
  var resetBtn = document.getElementById('reset-state');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    var msg = apiMode === 'server'
      ? 'Reset this browser’s copy? The dashboard reloads and re-syncs from the secure store — nothing on the server is deleted.'
      : 'Wipe the local store and reload with seed data? Anything not exported is lost.';
    if (!confirm(msg)) return;
    lsDel(STORE_KEY);
    location.reload();
  });

  // Restore from a full-state export. Downloads a safety backup of the
  // current data first, so a mistaken import is always reversible.
  var importInput = document.getElementById('import-state');
  if (importInput) importInput.addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var parsed = JSON.parse(String(r.result || ''));
        var incoming = normalizeData(parsed.data || parsed);
        if (!incoming.schools.length && !incoming.sponsors.length && !incoming.licences.length && !incoming.partners.length && !incoming.leads.length) {
          toast('That file has no records in it — nothing imported.');
          importInput.value = '';
          return;
        }
        var counts = incoming.schools.length + ' schools · ' + incoming.sponsors.length + ' sponsors · '
          + incoming.licences.length + ' licences · ' + incoming.partners.length + ' partners · ' + incoming.leads.length + ' leads';
        if (!confirm('Replace everything with this backup?\n\n' + counts + '\n\nA safety export of the current data downloads first.')) {
          importInput.value = '';
          return;
        }
        downloadJson({ exportedAt: new Date().toISOString(), data: data }, 'blastbeat-pre-import-backup-' + new Date().toISOString().slice(0, 10) + '.json');
        data = incoming;
        audit('import', 'full-state', { counts: counts });
        save(); render();
        toast('Backup imported — ' + counts + '.');
      } catch (err2) {
        toast('That file isn&rsquo;t a valid Blastbeat export.');
      }
      importInput.value = '';
    };
    r.readAsText(f);
  });

  /* ---- Settings: big-text toggle + saved confirmations ---- */
  var BIG_KEY = 'bb-admin-bigtext';
  var SAVED_KEY = 'bb-admin-savetoast';
  var bigEl = document.getElementById('opt-bigtext');
  var savedEl = document.getElementById('opt-confirm-save');
  var sideBigBtn = document.getElementById('side-bigtext');
  function applyBig() {
    var on = lsGet(BIG_KEY) === '1';
    document.body.classList.toggle('bigtext', on);
    if (bigEl) bigEl.checked = on;
    if (sideBigBtn) {
      sideBigBtn.classList.toggle('on', on);
      sideBigBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }
  function setBigText(on) {
    lsSet(BIG_KEY, on ? '1' : '0');
    applyBig();
    toast(on ? 'Big-text mode on.' : 'Big-text mode off.');
  }
  if (bigEl) {
    bigEl.checked = lsGet(BIG_KEY) === '1';
    bigEl.addEventListener('change', function () { setBigText(bigEl.checked); });
  }
  if (sideBigBtn) sideBigBtn.addEventListener('click', function () {
    setBigText(lsGet(BIG_KEY) !== '1');
  });
  if (savedEl) {
    if (lsGet(SAVED_KEY) === '0') savedEl.checked = false;
    savedEl.addEventListener('change', function () {
      lsSet(SAVED_KEY, savedEl.checked ? '1' : '0');
    });
  }
  applyBig();

  /* ---- Toast ---- */
  var toastEl = document.getElementById('bb-toast');
  var toastTimer = null;
  function toast(msg) {
    if (lsGet(SAVED_KEY) === '0') return;
    if (!toastEl) return;
    toastEl.innerHTML = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  /* ---- Samples banner + clearSamples ---- */
  var DISMISS_KEY = 'bb-admin-samples-dismissed';
  var bannerEl = document.getElementById('samples-banner');
  function hasSamples() {
    return (data.schools || []).some(function (r) { return r._sample; })
      || (data.sponsors || []).some(function (r) { return r._sample; })
      || (data.partners || []).some(function (r) { return r._sample; })
      || (data.leads || []).some(function (r) { return r._sample; });
  }
  function updateSamplesBanner() {
    if (!bannerEl) return;
    var show = hasSamples() && lsGet(DISMISS_KEY) !== '1';
    if (show) bannerEl.removeAttribute('hidden'); else bannerEl.setAttribute('hidden', '');
  }
  function clearSamples() {
    var before = (data.schools.length + data.sponsors.length + data.partners.length + data.leads.length);
    data.schools = data.schools.filter(function (r) { return !r._sample; });
    data.sponsors = data.sponsors.filter(function (r) { return !r._sample; });
    data.partners = data.partners.filter(function (r) { return !r._sample; });
    data.leads = data.leads.filter(function (r) { return !r._sample; });
    var after = (data.schools.length + data.sponsors.length + data.partners.length + data.leads.length);
    var removed = before - after;
    audit('clear', 'samples', { removed: removed });
    save();
    render();
    updateSamplesBanner();
    toast('Cleared ' + removed + ' sample record' + (removed === 1 ? '' : 's') + '. Fresh slate.');
  }
  var clearBtn = document.getElementById('clear-samples');
  if (clearBtn) clearBtn.addEventListener('click', function () {
    if (!confirm('Delete all sample records? This clears the demo schools, sponsors, partners and leads so you can start with your real data.')) return;
    clearSamples();
  });
  var dismissBtn = document.getElementById('dismiss-samples');
  if (dismissBtn) dismissBtn.addEventListener('click', function () {
    lsSet(DISMISS_KEY, '1');
    updateSamplesBanner();
  });
  var settingsClearBtn = document.getElementById('settings-clear-samples');
  if (settingsClearBtn) settingsClearBtn.addEventListener('click', function () {
    if (!hasSamples()) { toast('No sample data left to clear.'); return; }
    if (!confirm('Delete all sample records?')) return;
    clearSamples();
  });

  /* ---- Beat tour (6-step guided walkthrough) ---- */
  // Versioned key — bump when TOUR_STEPS changes so existing users see the new walk-through once.
  var TOUR_VERSION = 'v2';
  var TOUR_KEY = 'bb-admin-tour-done-' + TOUR_VERSION;
  var tourEl = document.getElementById('beat-tour');
  var tourTitle = document.getElementById('beat-title');
  var tourText = document.getElementById('beat-text');
  var tourStepNum = document.getElementById('beat-step-num');
  var tourBar = document.getElementById('beat-progress-bar');
  var tourBack = document.getElementById('beat-back');
  var tourNext = document.getElementById('beat-next');
  var tourSkip = document.getElementById('beat-skip');
  var TOUR_STEPS = [
    {
      title: 'Hey Robert, I&rsquo;m Beat.',
      body: 'I&rsquo;m your dashboard guide. Four minutes &mdash; I&rsquo;ll walk you through everything you can do today. Tap <strong>Next</strong> when you&rsquo;re ready, or <strong>Skip</strong> if you want to dive in.'
    },
    {
      title: 'This is your real programme.',
      body: 'Everything here is the live BlastBeat roster &mdash; <strong>21 schools</strong> in four groups (Heritage, SA pilot, Namibia, Black Coffee proposal), <strong>8 sponsors</strong>, and <strong>9 licences</strong> on record. Each school carries a tag so you can see at a glance what&rsquo;s confirmed versus proposed.'
    },
    {
      title: 'Stamp a credential when a deal is real.',
      body: 'On the <strong>Licences</strong> tab, roster lines show a <strong>&#9745; Stamp</strong> button. Click it when a licence is confirmed &mdash; I&rsquo;ll prefill the details, build the W3C credential, hash it (SHA-256), and produce the printable certificate. Roster amounts are the founding rate, <strong>R12,225</strong>.'
    },
    {
      title: 'Issue a real licence &mdash; one step.',
      body: 'Open <strong>Licences</strong> in the left menu, then <strong>+ Issue new licence</strong>. Just <em>type</em> the school name &mdash; if it&rsquo;s new, I&rsquo;ll add it automatically. Same for the sponsor. Then pick tier and region &mdash; I&rsquo;ll build a W3C verifiable credential, hash it (SHA-256), and write it to the audit log.'
    },
    {
      title: 'Send a real certificate &mdash; the sponsor&rsquo;s deliverable.',
      body: 'After you issue, the preview opens with three buttons. The gold one &mdash; <strong>Print certificate (PDF)</strong> &mdash; opens a wall-worthy A4 certificate with the QR, the sponsor&rsquo;s name, the proof hash. Browser print dialog gives you <em>Save as PDF</em>. Email that to the sponsor. They can verify it any time at <code>blastbeat.education/verify</code>.'
    },
    {
      title: 'Onboard a partner &mdash; two buttons.',
      body: 'Open <strong>Ambassadors &amp; Affiliates</strong>. Each row has two new actions: <strong>&#127873; Kit</strong> opens that partner&rsquo;s personalised resources page (their links, scripts, calculator, cheatsheet &mdash; URL-only, no login needed). <strong>&#9993; Welcome</strong> drafts the welcome email with their URL pre-filled. Two clicks per new partner.'
    },
    {
      title: 'For your lawyer &mdash; one-click bundle.',
      body: 'On the <strong>Licences</strong> page, scroll to <strong>Export legal bundle</strong>. That hands your lawyer every credential plus the full audit trail in one file. Tamper with a credential after issuance and the proof breaks &mdash; that&rsquo;s the whole point.'
    },
    {
      title: 'One last thing.',
      body: 'In <strong>Settings</strong> you can turn on <strong>big text + high-contrast mode</strong>, replay this tour any time, export everything, and bulk-export all partner kit URLs. If anything ever feels off, WhatsApp Tumi. You&rsquo;ve got this.'
    }
  ];
  var tourIdx = 0;
  function renderTourStep() {
    var s = TOUR_STEPS[tourIdx];
    tourTitle.innerHTML = s.title;
    tourText.innerHTML = s.body;
    tourStepNum.textContent = (tourIdx + 1) + ' / ' + TOUR_STEPS.length;
    tourBar.style.width = ((tourIdx + 1) / TOUR_STEPS.length * 100) + '%';
    if (tourIdx === 0) tourBack.setAttribute('hidden', ''); else tourBack.removeAttribute('hidden');
    tourNext.innerHTML = (tourIdx === TOUR_STEPS.length - 1) ? 'Got it &mdash; let&rsquo;s go' : 'Next &rarr;';
  }
  function openTour() {
    tourIdx = 0;
    renderTourStep();
    tourEl.removeAttribute('hidden');
  }
  function closeTour() {
    tourEl.setAttribute('hidden', '');
    lsSet(TOUR_KEY, '1');
  }
  if (tourNext) tourNext.addEventListener('click', function () {
    if (tourIdx === TOUR_STEPS.length - 1) { closeTour(); return; }
    tourIdx++;
    renderTourStep();
  });
  if (tourBack) tourBack.addEventListener('click', function () {
    if (tourIdx === 0) return;
    tourIdx--;
    renderTourStep();
  });
  if (tourSkip) tourSkip.addEventListener('click', closeTour);
  var restartBtn = document.getElementById('restart-tour');
  if (restartBtn) restartBtn.addEventListener('click', openTour);
  var settingsRestartBtn = document.getElementById('settings-restart-tour');
  if (settingsRestartBtn) settingsRestartBtn.addEventListener('click', openTour);

  /* ---- Beat help panel: always-there, per-page guidance ----
     Static, dependable how-to content (no AI round-trip) — written for a
     reader who wants three clear steps, not a manual. Opens on the current
     tab's topic and always offers the tour, big text, and a human. */
  var BEAT_HELP = {
    overview: {
      title: 'This page is your morning glance.',
      html: '<ul>'
        + '<li>The <strong>Needs attention</strong> card counts renewals due and new leads — if it&rsquo;s not 0, that&rsquo;s your first job today.</li>'
        + '<li>The progress bar tracks the 20-school pilot target.</li>'
        + '<li>The backend card at the bottom confirms your data is safely synced.</li>'
        + '</ul>'
    },
    pilot: {
      title: 'Your schools, all in one list.',
      html: '<ol>'
        + '<li>Tap a <strong>filter chip</strong> (Active, Proposal&hellip;) to see one group at a time.</li>'
        + '<li><strong>Edit</strong> opens a form — change anything, press Save.</li>'
        + '<li>&ldquo;Needs twin&rdquo; in pink means the school still needs a sponsor.</li>'
        + '</ol>'
    },
    twinaid: {
      title: 'Sponsors and who they twin with.',
      html: '<ol>'
        + '<li><strong>+ Add sponsor</strong> the moment a company says yes.</li>'
        + '<li>Set their <strong>status</strong> as the deal moves: Pledged &rarr; Confirmed &rarr; Invoiced &rarr; Funded.</li>'
        + '<li>Put the school&rsquo;s name in <strong>Twin school</strong> to pair them.</li>'
        + '</ol>'
    },
    partners: {
      title: 'Ambassadors, affiliates, and what they&rsquo;re owed.',
      html: '<ol>'
        + '<li><strong>&#127873; Kit</strong> opens a partner&rsquo;s personal resources page — copy the link and send it.</li>'
        + '<li><strong>&#9993; Welcome</strong> drafts their welcome email for you.</li>'
        + '<li>The <strong>Owed</strong> column is live — it updates when their referred licences are issued or revoked.</li>'
        + '</ol>'
    },
    leads: {
      title: 'Every website enquiry lands here by itself.',
      html: '<ol>'
        + '<li>New form submissions appear with a <strong>New</strong> badge — no copying from email.</li>'
        + '<li><strong>Edit</strong> shows exactly what they wrote, with a reply-by-email button.</li>'
        + '<li>When a school is ready, press <strong>&#127979; Convert</strong> — it joins the pilot roster in one tap.</li>'
        + '</ol>'
    },
    licences: {
      title: 'Issue, stamp, and track every licence.',
      html: '<ol>'
        + '<li><strong>&#9745; Stamp</strong> on a roster line turns an agreed deal into a real credential + certificate.</li>'
        + '<li><strong>+ Issue new licence</strong> for anything brand new — type the school, we add it for you.</li>'
        + '<li>Amber <strong>renews in&hellip;</strong> chips = call that sponsor soon.</li>'
        + '</ol>'
    },
    audit: {
      title: 'The record of everything.',
      html: '<ul>'
        + '<li>Every add, edit, delete, issue and revoke is here, with <strong>who did it</strong> and when.</li>'
        + '<li>Nothing can be quietly changed — that&rsquo;s the point.</li>'
        + '<li>Export it any time for your lawyer or the board.</li>'
        + '</ul>'
    },
    settings: {
      title: 'Comfort and safety switches.',
      html: '<ul>'
        + '<li><strong>Big text mode</strong> makes everything larger — also one tap in the left menu (&ldquo;Aa&rdquo;).</li>'
        + '<li><strong>Export full state</strong> is your backup — do it before big changes.</li>'
        + '<li><strong>Restore from backup</strong> brings an export straight back.</li>'
        + '</ul>'
    }
  };
  var beatFab = document.getElementById('beat-fab');
  var beatPanel = document.getElementById('beat-panel');
  var beatPanelBody = document.getElementById('beat-panel-body');
  function currentViewKey() {
    var active = document.querySelector('.nav-item.active');
    return (active && active.dataset.view) || 'overview';
  }
  function openBeatPanel() {
    var help = BEAT_HELP[currentViewKey()] || BEAT_HELP.overview;
    var bigOn = lsGet(BIG_KEY) === '1';
    beatPanelBody.innerHTML = '<h4>' + help.title + '</h4>' + help.html
      + '<div class="beat-actions">'
      + '<button type="button" class="btn primary" id="beat-restart-tour">&#128173; Walk me through it (tour)</button>'
      + '<button type="button" class="btn" id="beat-bigtext-toggle">Aa &nbsp;' + (bigOn ? 'Turn big text OFF' : 'Turn big text ON') + '</button>'
      + '<a class="btn" href="https://wa.me/27738048409" target="_blank" rel="noopener">&#128172; WhatsApp Tumi — a human, fast</a>'
      + '</div>';
    beatPanel.hidden = false;
    beatFab.setAttribute('aria-expanded', 'true');
  }
  function closeBeatPanel() {
    beatPanel.hidden = true;
    if (beatFab) beatFab.setAttribute('aria-expanded', 'false');
  }
  if (beatFab) beatFab.addEventListener('click', function () {
    if (beatPanel.hidden) openBeatPanel(); else closeBeatPanel();
  });
  var beatPanelClose = document.getElementById('beat-panel-close');
  if (beatPanelClose) beatPanelClose.addEventListener('click', closeBeatPanel);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && beatPanel && !beatPanel.hidden) closeBeatPanel();
  });
  document.body.addEventListener('click', function (e) {
    if (e.target.closest('#beat-restart-tour')) { closeBeatPanel(); openTour(); }
    if (e.target.closest('#beat-bigtext-toggle')) { setBigText(lsGet(BIG_KEY) !== '1'); openBeatPanel(); }
  });
  // Refresh the panel's topic when Robert switches tabs while it's open.
  document.querySelectorAll('.nav-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (beatPanel && !beatPanel.hidden) openBeatPanel();
    });
  });

  /* ---- Hook into existing render() so new tabs refresh too ---- */
  var _origRender = render;
  render = function () { _origRender(); renderLicences(); renderAudit(); updateSamplesBanner(); };
  render();

  /* ---- Auto-launch tour on first unlock ---- */
  function maybeAutoLaunchTour() {
    if (lsGet(TOUR_KEY) === '1') return;
    if (gate && !gate.classList.contains('hidden')) return;
    setTimeout(openTour, 600);
  }
  var _origUnlock = unlock;
  unlock = function () {
    _origUnlock();
    if (apiMode !== 'server') {
      setBadge('local');
      updateBackendCard(null, null);
    }
    if (beatFab) beatFab.hidden = false; // help is only useful once inside
    maybeAutoLaunchTour();
  };

  // Returning session: everything is initialised now, safe to unlock.
  // Server mode revalidates the cookie first — a dead session drops back
  // to the gate instead of showing a dashboard that can't save.
  (function restoreSession() {
    if (ssGet(SESSION_KEY) !== '1') return;
    apiWho = ssGet(WHO_KEY) || '';
    if (ssGet(MODE_KEY) === 'server') {
      apiMode = 'server';
      syncFromServer().then(function (ok) {
        if (!ok) { apiMode = 'local'; sessionExpired(); return; }
        unlock();
      });
    } else {
      apiMode = 'local';
      unlock();
    }
  })();

})();
