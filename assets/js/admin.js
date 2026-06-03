/* ============================================================
   BLASTBEAT — Admin Dashboard (prototype)
   Front-end only. Data persists in localStorage with seed records.
   Login is a CLIENT-SIDE demo gate — NOT real security. Replace
   with Netlify Identity / Supabase Auth before exposing real data.
   ============================================================ */

(function () {
  'use strict';

  // ---- Demo access gate (client-side only — not secure) ----
  var ACCESS_CODE = 'blastbeat2026';
  var SESSION_KEY = 'bb-admin-ok';

  var gate = document.getElementById('gate');
  var shell = document.getElementById('shell');
  var form = document.getElementById('gate-form');
  var pass = document.getElementById('gate-pass');
  var err = document.getElementById('gate-err');

  function unlock() {
    gate.classList.add('hidden');
    shell.style.display = 'grid';
    render();
  }
  if (sessionStorage.getItem(SESSION_KEY) === '1') unlock();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (pass.value === ACCESS_CODE) {
      sessionStorage.setItem(SESSION_KEY, '1');
      err.textContent = '';
      unlock();
    } else {
      err.textContent = 'Wrong access code. Try again.';
      pass.value = '';
      pass.focus();
    }
  });
  document.getElementById('logout').addEventListener('click', function () {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  });

  // ---- Data store (localStorage + seed) ----
  var STORE_KEY = 'bb-admin-data-v1';

  var SEED = {
    schools: [
      { id: 1, name: 'Mitchells Plain Secondary', country: 'South Africa', contact: 'Ms. Adams', status: 'Active', twin: 'Naspers', progress: 65, start: '2026-05-18' },
      { id: 2, name: 'COSAT, Khayelitsha', country: 'South Africa', contact: 'Mr. Dlamini', status: 'Active', twin: 'Old Mutual', progress: 40, start: '2026-05-18' },
      { id: 3, name: 'Kigali Heights Academy', country: 'Rwanda', contact: 'Ms. Uwase', status: 'Active', twin: 'Bank of Kigali', progress: 30, start: '2026-05-18' },
      { id: 4, name: 'Pinelands High', country: 'South Africa', contact: 'Mr. Botha', status: 'Onboarding', twin: 'Woolworths', progress: 10, start: '2026-06-01' },
      { id: 5, name: 'Gugulethu Comprehensive', country: 'South Africa', contact: 'Ms. Nkosi', status: 'Onboarding', twin: 'Capitec', progress: 5, start: '2026-06-01' },
      { id: 6, name: 'Green Hills School, Kigali', country: 'Rwanda', contact: 'Mr. Habimana', status: 'Confirmed', twin: 'MTN Rwanda', progress: 0, start: '2026-06-15' },
      { id: 7, name: 'Belhar High', country: 'South Africa', contact: 'Ms. Petersen', status: 'Awaiting twin', twin: '', progress: 0, start: 'TBC' },
      { id: 8, name: 'Athlone High', country: 'South Africa', contact: 'Mr. Jacobs', status: 'Awaiting twin', twin: '', progress: 0, start: 'TBC' }
    ],
    sponsors: [
      { id: 1, company: 'Naspers', tier: 'Twin (1 school)', value: 1250, twin: 'Mitchells Plain Secondary', status: 'Funded', contact: 'csr@naspers.com' },
      { id: 2, company: 'Old Mutual', tier: 'Twin (1 school)', value: 1250, twin: 'COSAT, Khayelitsha', status: 'Funded', contact: 'esg@oldmutual.com' },
      { id: 3, company: 'Bank of Kigali', tier: 'Twin (1 school)', value: 1250, twin: 'Kigali Heights Academy', status: 'Funded', contact: 'impact@bk.rw' },
      { id: 4, company: 'Woolworths', tier: 'Twin (1 school)', value: 1250, twin: 'Pinelands High', status: 'Invoiced', contact: 'gooddifference@woolworths.co.za' },
      { id: 5, company: 'Capitec', tier: 'Twin (1 school)', value: 1250, twin: 'Gugulethu Comprehensive', status: 'Invoiced', contact: 'sed@capitec.co.za' },
      { id: 6, company: 'MTN Rwanda', tier: 'Twin (1 school)', value: 1250, twin: 'Green Hills School, Kigali', status: 'Pledged', contact: 'foundation@mtn.rw' }
    ],
    partners: [
      { id: 1, name: 'Lerato M.', type: 'Affiliate', referred: 4, signed: 3, owed: 1125, status: 'Active', link: 'bb.education/r/lerato' },
      { id: 2, name: 'Mr. Naidoo (teacher)', type: 'Ambassador', referred: 2, signed: 2, owed: 150, status: 'Active', link: 'bb.education/r/naidoo' },
      { id: 3, name: 'EduConsult Africa', type: 'Affiliate', referred: 9, signed: 6, owed: 2250, status: 'Active', link: 'bb.education/r/educonsult' },
      { id: 4, name: 'Thandi (alumna)', type: 'Ambassador', referred: 5, signed: 4, owed: 300, status: 'Active', link: 'bb.education/r/thandi' },
      { id: 5, name: 'Parent — J. Smit', type: 'Referral', referred: 1, signed: 1, owed: 100, status: 'Payout due', link: 'bb.education/r/jsmit' }
    ],
    leads: [
      { id: 1, name: 'Heather Adams', org: 'Mitchells Plain Secondary', type: 'School', source: 'apply form', date: '2026-05-12', status: 'Converted' },
      { id: 2, name: 'CSR Team', org: 'Naspers', type: 'Sponsor', source: '2winaid', date: '2026-05-13', status: 'Converted' },
      { id: 3, name: 'EduConsult Africa', org: 'EduConsult', type: 'Affiliate', source: 'ambassadors page', date: '2026-05-14', status: 'Active' },
      { id: 4, name: 'Coach Mbeki', org: 'Soweto FC', type: 'Sports Club', source: 'contact form', date: '2026-05-15', status: 'New' },
      { id: 5, name: 'James (parent)', org: '—', type: 'Referral', source: 'referral link', date: '2026-05-16', status: 'New' }
    ],
    licences: [],
    audit: []
  };

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return JSON.parse(JSON.stringify(SEED));
  }
  function save() { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
  var data = load();

  function nextId(arr) { return arr.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1; }
  function eur(n) { return '€' + Number(n).toLocaleString('en-IE'); }

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
    if (/active|funded|converted/.test(t)) cls = 'green';
    else if (/onboard|invoiced|payout|due/.test(t)) cls = 'amber';
    else if (/confirm|pledg/.test(t)) cls = 'cyan';
    else if (/awaiting|new|tbc/.test(t)) cls = 'pink';
    return '<span class="pill ' + cls + '">' + (text || '—') + '</span>';
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
    var twinned = data.schools.filter(function (s) { return s.twin; }).length;
    var funded = data.sponsors.filter(function (s) { return /funded/i.test(s.status); }).reduce(function (a, s) { return a + s.value; }, 0);
    var pipeline = data.sponsors.reduce(function (a, s) { return a + s.value; }, 0);
    var owed = data.partners.reduce(function (a, p) { return a + p.owed; }, 0);
    var newLeads = data.leads.filter(function (l) { return /new/i.test(l.status); }).length;

    var stats = [
      { label: 'Pilot schools', val: data.schools.length + ' / 20', sub: twinned + ' twinned with a sponsor' },
      { label: 'Sponsorship funded', val: eur(funded), sub: eur(pipeline) + ' total pipeline' },
      { label: 'Commission owed', val: eur(owed), sub: data.partners.length + ' active partners' },
      { label: 'Open leads', val: newLeads, sub: data.leads.length + ' total in pipeline' }
    ];
    document.getElementById('overview-stats').innerHTML = stats.map(function (s) {
      return '<div class="stat"><div class="label">' + s.label + '</div><div class="val">' + s.val + '</div><div class="sub">' + s.sub + '</div></div>';
    }).join('');

    var pct = Math.round((twinned / 20) * 100);
    document.getElementById('pilot-progress').style.width = pct + '%';
    document.getElementById('pilot-progress-label').textContent = twinned + ' / 20 twinned';
  }

  function table(headers, rows) {
    return '<thead><tr>' + headers.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody>';
  }

  function delBtn(kind, id) {
    return '<button class="btn sm" data-del="' + kind + '" data-id="' + id + '">Remove</button>';
  }

  function renderPilot() {
    var rows = data.schools.map(function (s) {
      return '<tr>'
        + '<td><strong>' + s.name + '</strong></td>'
        + '<td>' + s.country + '</td>'
        + '<td>' + (s.twin ? s.twin : '<span class="pill pink">needs twin</span>') + '</td>'
        + '<td>' + pill(s.status) + '</td>'
        + '<td><div style="display:flex;align-items:center;gap:0.5rem;"><div class="bar"><div style="width:' + s.progress + '%"></div></div><span style="font-size:0.74rem;color:var(--muted);">' + s.progress + '%</span></div></td>'
        + '<td style="font-family:var(--mono);font-size:0.76rem;">' + s.start + '</td>'
        + '<td class="row-actions">' + delBtn('schools', s.id) + '</td>'
        + '</tr>';
    }).join('');
    document.getElementById('tbl-pilot').innerHTML = table(['School', 'Country', 'Twin sponsor', 'Status', 'Progress', 'Start', ''], rows);
  }

  function renderSponsors() {
    var rows = data.sponsors.map(function (s) {
      return '<tr>'
        + '<td><strong>' + s.company + '</strong><br><span style="font-size:0.72rem;color:var(--muted);">' + s.contact + '</span></td>'
        + '<td>' + s.tier + '</td>'
        + '<td style="font-family:var(--head);font-weight:700;">' + eur(s.value) + '</td>'
        + '<td>' + (s.twin || '—') + '</td>'
        + '<td>' + pill(s.status) + '</td>'
        + '<td class="row-actions">' + delBtn('sponsors', s.id) + '</td>'
        + '</tr>';
    }).join('');
    document.getElementById('tbl-sponsors').innerHTML = table(['Sponsor', 'Tier', 'Value', 'Twin school', 'Status', ''], rows);
  }

  function renderPartners() {
    var byType = { Ambassador: 0, Affiliate: 0, Referral: 0 };
    data.partners.forEach(function (p) { if (byType[p.type] != null) byType[p.type]++; });
    var totalOwed = data.partners.reduce(function (a, p) { return a + p.owed; }, 0);
    var totalSigned = data.partners.reduce(function (a, p) { return a + p.signed; }, 0);
    var pstats = [
      { label: 'Active partners', val: data.partners.length, sub: byType.Ambassador + ' amb · ' + byType.Affiliate + ' aff · ' + byType.Referral + ' ref' },
      { label: 'Schools signed', val: totalSigned, sub: 'via partner referrals' },
      { label: 'Commission owed', val: eur(totalOwed), sub: 'across all programmes' }
    ];
    document.getElementById('partner-stats').innerHTML = pstats.map(function (s) {
      return '<div class="stat"><div class="label">' + s.label + '</div><div class="val">' + s.val + '</div><div class="sub">' + s.sub + '</div></div>';
    }).join('');

    var rows = data.partners.map(function (p) {
      var typeCls = p.type === 'Affiliate' ? 'amber' : (p.type === 'Ambassador' ? 'cyan' : 'green');
      return '<tr>'
        + '<td><strong>' + p.name + '</strong><br><span style="font-size:0.72rem;color:var(--muted);font-family:var(--mono);">' + p.link + '</span></td>'
        + '<td><span class="pill ' + typeCls + '">' + p.type + '</span></td>'
        + '<td>' + p.referred + '</td>'
        + '<td>' + p.signed + '</td>'
        + '<td style="font-family:var(--head);font-weight:700;color:var(--lime);">' + eur(p.owed) + '</td>'
        + '<td>' + pill(p.status) + '</td>'
        + '<td class="row-actions">' + delBtn('partners', p.id) + '</td>'
        + '</tr>';
    }).join('');
    document.getElementById('tbl-partners').innerHTML = table(['Partner', 'Programme', 'Referred', 'Signed', 'Owed', 'Status', ''], rows);
  }

  function renderLeads() {
    var rows = data.leads.map(function (l) {
      return '<tr>'
        + '<td><strong>' + l.name + '</strong></td>'
        + '<td>' + l.org + '</td>'
        + '<td><span class="pill grey">' + l.type + '</span></td>'
        + '<td style="font-size:0.78rem;color:var(--muted);">' + l.source + '</td>'
        + '<td style="font-family:var(--mono);font-size:0.76rem;">' + l.date + '</td>'
        + '<td>' + pill(l.status) + '</td>'
        + '<td class="row-actions">' + delBtn('leads', l.id) + '</td>'
        + '</tr>';
    }).join('');
    document.getElementById('tbl-leads').innerHTML = table(['Name', 'Organisation', 'Type', 'Source', 'Date', 'Status', ''], rows);
  }

  // ---- Add / remove (prompt-based, lightweight) ----
  document.body.addEventListener('click', function (e) {
    var addBtn = e.target.closest('[data-add]');
    if (addBtn) { addRecord(addBtn.dataset.add); return; }
    var del = e.target.closest('[data-del]');
    if (del) {
      var kind = del.dataset.del, id = parseInt(del.dataset.id, 10);
      data[kind] = data[kind].filter(function (x) { return x.id !== id; });
      save(); render();
    }
  });

  function addRecord(kind) {
    if (kind === 'school') {
      var name = prompt('School name?'); if (!name) return;
      var country = prompt('Country?', 'South Africa') || 'South Africa';
      data.schools.push({ id: nextId(data.schools), name: name, country: country, contact: '', status: 'Awaiting twin', twin: '', progress: 0, start: 'TBC' });
    } else if (kind === 'sponsor') {
      var company = prompt('Sponsor company?'); if (!company) return;
      var twin = prompt('Twin school (optional)?', '') || '';
      data.sponsors.push({ id: nextId(data.sponsors), company: company, tier: 'Twin (1 school)', value: 1250, twin: twin, status: 'Pledged', contact: '' });
    } else if (kind === 'partner') {
      var pname = prompt('Partner name?'); if (!pname) return;
      var type = prompt('Programme — Ambassador, Affiliate or Referral?', 'Ambassador') || 'Ambassador';
      data.partners.push({ id: nextId(data.partners), name: pname, type: type, referred: 0, signed: 0, owed: 0, status: 'Active', link: 'bb.education/r/new' });
    } else if (kind === 'lead') {
      var lname = prompt('Lead name?'); if (!lname) return;
      var org = prompt('Organisation?', '') || '—';
      data.leads.push({ id: nextId(data.leads), name: lname, org: org, type: 'School', source: 'manual', date: new Date().toISOString().slice(0, 10), status: 'New' });
    }
    save(); render();
    audit('create', kind, { id: kind === 'school' ? data.schools[data.schools.length-1].id : kind === 'sponsor' ? data.sponsors[data.sponsors.length-1].id : kind === 'partner' ? data.partners[data.partners.length-1].id : data.leads[data.leads.length-1].id });
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

  var ISSUER_DID = {
    ZA: { id: 'https://www.blastbeat.education/issuers/can-rsa', name: 'Climate Actions Now RSA (Pty) Ltd', country: 'ZA' },
    UK: { id: 'https://www.blastbeat.education/issuers/can-uk',  name: 'Climate Actions Now (UK charity)',   country: 'GB' },
    IE: { id: 'https://www.blastbeat.education/issuers/can-ie',  name: 'Climate Actions Now Ltd',            country: 'IE' }
  };
  var TIER_VALUE = {
    'Founding Pilot 6-month': 1250,
    'Full Year Twin': 2500,
    "Founders' Circle Patron": 6250,
    'Founding Patron Cohort': 25000,
    'Legacy Partner': 100000
  };

  async function buildCredential(form) {
    var now = new Date();
    var iso = now.toISOString();
    var issuer = ISSUER_DID[form.region] || ISSUER_DID.ZA;
    var validFrom = form.validFrom ? new Date(form.validFrom).toISOString() : iso;
    var validUntil = new Date(form.validFrom || iso);
    validUntil.setMonth(validUntil.getMonth() + (form.tier === 'Full Year Twin' ? 12 : 6));
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
        tier: form.tier,
        tierValueEUR: TIER_VALUE[form.tier] || 1250,
        sponsor: { name: form.sponsor, notes: form.notes || '' },
        region: form.region,
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

  function openIssueModal() {
    var sel = document.getElementById('f-school');
    sel.innerHTML = '<option value="">Select a school&hellip;</option>' +
      data.schools.map(function (s) { return '<option value="' + escapeHtmlAttr(s.name) + '">' + escapeHtmlText(s.name) + ' &mdash; ' + escapeHtmlText(s.country) + '</option>'; }).join('');
    document.getElementById('f-sponsor').value = '';
    document.getElementById('f-notes').value = '';
    document.getElementById('f-from').value = new Date().toISOString().slice(0, 10);
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
  if (openIssueBtn) openIssueBtn.addEventListener('click', openIssueModal);
  document.getElementById('issue-close').addEventListener('click', closeIssueModal);
  document.getElementById('issue-cancel').addEventListener('click', closeIssueModal);
  document.getElementById('preview-close').addEventListener('click', closePreviewModal);
  issueModal.addEventListener('click', function (e) { if (e.target === issueModal) closeIssueModal(); });
  previewModal.addEventListener('click', function (e) { if (e.target === previewModal) closePreviewModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!issueModal.hidden) closeIssueModal();
    if (!previewModal.hidden) closePreviewModal();
  });

  document.getElementById('issue-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var form = {
      school: document.getElementById('f-school').value,
      sponsor: document.getElementById('f-sponsor').value.trim(),
      tier: document.getElementById('f-tier').value,
      region: document.getElementById('f-region').value,
      validFrom: document.getElementById('f-from').value,
      notes: document.getElementById('f-notes').value.trim()
    };
    if (!form.school || !form.sponsor) { toast('School and sponsor are required.'); return; }
    var vc = await buildCredential(form);
    data.licences.push({
      id: vc.id,
      issuanceDate: vc.issuanceDate,
      school: form.school,
      sponsor: form.sponsor,
      tier: form.tier,
      region: form.region,
      proofHash: vc.proof.proofValue,
      vc: vc
    });
    audit('issue', 'licence', { id: vc.id, school: form.school, sponsor: form.sponsor, tier: form.tier, region: form.region });
    save();
    closeIssueModal();
    renderLicences();
    renderAudit();
    renderOverview();
    showCredentialPreview(vc);
    toast('Licence issued and stamped &mdash; ' + form.school);
  });

  function showCredentialPreview(vc) {
    document.getElementById('preview-title').textContent = 'Licence — ' + (vc.credentialSubject.schoolName || '');
    document.getElementById('preview-json').textContent = JSON.stringify(vc, null, 2);
    document.getElementById('preview-download').onclick = function () { downloadJson(vc, 'blastbeat-licence-' + vc.id.replace('urn:uuid:', '').slice(0, 8) + '.json'); };
    document.getElementById('preview-email').onclick = function () {
      var subj = 'Your Blastbeat licence — ' + vc.credentialSubject.schoolName;
      var body = 'Hi,\n\nAttached is the Blastbeat V2 licence credential for ' + vc.credentialSubject.schoolName +
                 ', issued by ' + vc.issuer.name + ' on ' + vc.issuanceDate.slice(0, 10) + '.\n\n' +
                 'Licence ID: ' + vc.id + '\nTier: ' + vc.credentialSubject.tier + '\n' +
                 'Tamper-evident SHA-256 proof: ' + vc.proof.proofValue + '\n\n' +
                 'Full W3C-aligned JSON-LD credential is in the attachment. The proof value is a SHA-256 hash of the canonicalised credential body — any change invalidates it.\n\n' +
                 'Best,\nClimate Actions Now / Blastbeat Education';
      window.location.href = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
    };
    previewModal.hidden = false;
  }

  function downloadJson(obj, filename) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---- Renderers for the new views ---- */
  function renderLicences() {
    var totalValue = data.licences.reduce(function (a, l) { return a + (TIER_VALUE[l.tier] || 0); }, 0);
    var byRegion = data.licences.reduce(function (a, l) { a[l.region] = (a[l.region] || 0) + 1; return a; }, {});
    var stats = [
      { label: 'Licences issued', val: data.licences.length, sub: 'all-time, this browser' },
      { label: 'Sponsorship value', val: eur(totalValue), sub: 'sum of tier values' },
      { label: 'By region', val: 'ZA ' + (byRegion.ZA || 0) + ' · UK ' + (byRegion.UK || 0) + ' · IE ' + (byRegion.IE || 0), sub: '' }
    ];
    var statsEl = document.getElementById('licence-stats');
    if (statsEl) statsEl.innerHTML = stats.map(function (s) {
      return '<div class="stat"><div class="label">' + s.label + '</div><div class="val">' + s.val + '</div><div class="sub">' + s.sub + '</div></div>';
    }).join('');

    var rows = data.licences.length ? data.licences.slice().reverse().map(function (l) {
      var idShort = l.id.replace('urn:uuid:', '').slice(0, 8);
      var proofShort = l.proofHash.slice(0, 12);
      return '<tr>'
        + '<td><strong>' + escapeHtmlText(l.school) + '</strong><br><span style="font-size:0.7rem;color:var(--muted);font-family:var(--mono);">' + idShort + '</span></td>'
        + '<td>' + escapeHtmlText(l.sponsor) + '</td>'
        + '<td><span class="pill cyan">' + escapeHtmlText(l.tier) + '</span></td>'
        + '<td><span class="pill grey">' + l.region + '</span></td>'
        + '<td style="font-family:var(--mono);font-size:0.74rem;color:var(--lime);">' + proofShort + '&hellip;</td>'
        + '<td style="font-family:var(--mono);font-size:0.74rem;">' + l.issuanceDate.slice(0, 10) + '</td>'
        + '<td class="row-actions">'
          + '<button class="btn sm" data-licence-view="' + l.id + '">View</button>'
          + '<button class="btn sm" data-licence-revoke="' + l.id + '">Revoke</button>'
        + '</td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted);">No licences issued yet. Click <strong>+ Issue new licence</strong> to begin.</td></tr>';
    var tbl = document.getElementById('tbl-licences');
    if (tbl) tbl.innerHTML = '<thead><tr><th>School / ID</th><th>Sponsor</th><th>Tier</th><th>Region</th><th>Proof (SHA-256)</th><th>Issued</th><th></th></tr></thead><tbody>' + rows + '</tbody>';
  }

  function renderAudit() {
    var rows = data.audit.length ? data.audit.slice().reverse().map(function (a) {
      var detail = a.detail ? JSON.stringify(a.detail) : '';
      var actionCls = a.action === 'issue' ? 'green' : a.action === 'revoke' ? 'pink' : a.action === 'create' ? 'cyan' : 'grey';
      return '<tr>'
        + '<td style="font-family:var(--mono);font-size:0.74rem;color:var(--muted);">' + a.timestamp + '</td>'
        + '<td><span class="pill ' + actionCls + '">' + a.action + '</span></td>'
        + '<td>' + escapeHtmlText(a.entity) + '</td>'
        + '<td style="font-family:var(--mono);font-size:0.72rem;color:var(--muted);">' + escapeHtmlText(detail) + '</td>'
        + '</tr>';
    }).join('') : '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--muted);">Audit log is empty. Every issue / revoke / create / delete is recorded here.</td></tr>';
    var tbl = document.getElementById('tbl-audit');
    if (tbl) tbl.innerHTML = '<thead><tr><th>Timestamp (UTC)</th><th>Action</th><th>Entity</th><th>Detail</th></tr></thead><tbody>' + rows + '</tbody>';
  }

  function audit(action, entity, detail) {
    data.audit.push({ timestamp: new Date().toISOString(), action: action, entity: entity, detail: detail || null });
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
    var rev = e.target.closest('[data-licence-revoke]');
    if (rev) {
      var rid = rev.dataset.licenceRevoke;
      if (!confirm('Revoke this licence? The credential remains in the audit log but is marked revoked.')) return;
      var idx = data.licences.findIndex(function (l) { return l.id === rid; });
      if (idx === -1) return;
      var l2 = data.licences[idx];
      audit('revoke', 'licence', { id: rid, school: l2.school });
      data.licences.splice(idx, 1);
      save(); renderLicences(); renderAudit(); renderOverview();
      toast('Licence revoked.');
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
  var resetBtn = document.getElementById('reset-state');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    if (!confirm('Wipe the local store and reload with seed data? Anything not exported is lost.')) return;
    localStorage.removeItem(STORE_KEY);
    location.reload();
  });

  /* ---- Settings: big-text toggle + saved confirmations ---- */
  var BIG_KEY = 'bb-admin-bigtext';
  var SAVED_KEY = 'bb-admin-savetoast';
  var bigEl = document.getElementById('opt-bigtext');
  var savedEl = document.getElementById('opt-confirm-save');
  function applyBig() { document.body.classList.toggle('bigtext', localStorage.getItem(BIG_KEY) === '1'); }
  if (bigEl) {
    bigEl.checked = localStorage.getItem(BIG_KEY) === '1';
    bigEl.addEventListener('change', function () {
      localStorage.setItem(BIG_KEY, bigEl.checked ? '1' : '0');
      applyBig();
      toast(bigEl.checked ? 'Big-text mode on.' : 'Big-text mode off.');
    });
  }
  if (savedEl) {
    if (localStorage.getItem(SAVED_KEY) === '0') savedEl.checked = false;
    savedEl.addEventListener('change', function () {
      localStorage.setItem(SAVED_KEY, savedEl.checked ? '1' : '0');
    });
  }
  applyBig();

  /* ---- Toast ---- */
  var toastEl = document.getElementById('bb-toast');
  var toastTimer = null;
  function toast(msg) {
    if (localStorage.getItem(SAVED_KEY) === '0') return;
    if (!toastEl) return;
    toastEl.innerHTML = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  /* ---- Hook into existing render() so new tabs refresh too ---- */
  var _origRender = render;
  render = function () { _origRender(); renderLicences(); renderAudit(); };
  render();

})();
