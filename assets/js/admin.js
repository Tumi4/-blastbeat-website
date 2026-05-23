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
    ]
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
  }
})();
