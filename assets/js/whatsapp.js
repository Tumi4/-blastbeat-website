/* ============================================================
   BLASTBEAT — WhatsApp Smart Module
   Floating button that captures who's asking + what they want
   before opening WhatsApp with a pre-filled message. Lets us
   filter / route leads without needing any backend.
   ============================================================ */

(function () {
  'use strict';

  if (window.__bbWhatsAppMounted) return;
  window.__bbWhatsAppMounted = true;

  // Robert's WhatsApp (SA mobile, international format, no leading +)
  var WA_NUMBER = '27738048409';

  // Lead categories — pre-filled message per role + intent
  var CATEGORIES = [
    {
      id: 'school',
      icon: '🎓',
      label: 'I run a school',
      subtitle: 'Principal, teacher, or programme coordinator',
      color: '#6366F1',
      message: "Hi Blastbeat! I'm a {role} at {school} ({country}). I'd like to learn about bringing the programme to our school for the 2026 cohort."
    },
    {
      id: 'sponsor',
      icon: '🤝',
      label: 'I want to sponsor',
      subtitle: 'Corporate, foundation, or ESG / CSR lead',
      color: '#FF6B35',
      message: "Hi Blastbeat! I'm {name} at {company}. We're interested in the Adopt-A-School / sponsorship programme and the ESG, BBBEE and Section 18A documentation."
    },
    {
      id: 'club',
      icon: '⚽',
      label: 'I run a sports club',
      subtitle: 'FootBeat — community sports + enterprise',
      color: '#10B981',
      message: "Hi Blastbeat! I run {clubName} (community sports club) and I'd like to find out about FootBeat for our young players."
    },
    {
      id: 'investor',
      icon: '📈',
      label: 'I want to invest',
      subtitle: 'Investor, partner, or strategic enquiry',
      color: '#F5C842',
      message: "Hi Blastbeat! I'm {name} at {fund}. I'd like to set up a call with Robert about the V2 platform and the South Africa / Africa expansion."
    },
    {
      id: 'student',
      icon: '🎤',
      label: "I'm a student",
      subtitle: 'Apply to a participating school',
      color: '#FF2D78',
      message: "Hi Blastbeat! I'm a student and I'd love to join. My school is {school}."
    },
    {
      id: 'press',
      icon: '📰',
      label: 'Press / media',
      subtitle: 'Interview, feature, or photo request',
      color: '#00F5FF',
      message: "Hi Blastbeat! I'm {name} at {outlet}. I'd like to talk about a feature on the programme."
    }
  ];

  /* ---- Styles ---- */
  var css = ''
    + '#bb-wa-trigger{position:fixed;bottom:6rem;right:1.5rem;z-index:9989;width:56px;height:56px;border-radius:50%;background:#25D366;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 18px rgba(37,211,102,0.45),0 0 0 0 rgba(37,211,102,0.5);transition:transform .3s ease,box-shadow .3s ease;animation:bb-wa-pulse 3s ease-in-out infinite 6s;outline:none}'
    + '#bb-wa-trigger:hover{transform:scale(1.08);box-shadow:0 8px 28px rgba(37,211,102,0.6);animation:none}'
    + '#bb-wa-trigger:focus-visible{outline:3px solid #00F5FF;outline-offset:3px}'
    + '@keyframes bb-wa-pulse{0%,100%{box-shadow:0 4px 18px rgba(37,211,102,0.45),0 0 0 0 rgba(37,211,102,0.55)}50%{box-shadow:0 4px 18px rgba(37,211,102,0.5),0 0 0 14px rgba(37,211,102,0)}}'
    + '#bb-wa-trigger svg{width:28px;height:28px}'
    + '#bb-wa-overlay{position:fixed;inset:0;z-index:9991;background:rgba(10,14,26,0.74);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:1rem;animation:bb-wa-fade .25s ease}'
    + '#bb-wa-overlay.open{display:flex}'
    + '@keyframes bb-wa-fade{from{opacity:0}to{opacity:1}}'
    + '#bb-wa-panel{width:100%;max-width:480px;max-height:calc(100dvh - 2rem);overflow-y:auto;background:linear-gradient(180deg,#0F1424 0%,#0A0E1A 100%);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:1.75rem;box-shadow:0 30px 80px rgba(0,0,0,0.5);animation:bb-wa-rise .32s cubic-bezier(.4,0,.2,1)}'
    + '@keyframes bb-wa-rise{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}'
    + '.bb-wa-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1.25rem}'
    + '.bb-wa-title{font-family:var(--font-heading,"Space Grotesk",sans-serif);font-size:1.25rem;font-weight:800;color:#fff;line-height:1.15;margin:0}'
    + '.bb-wa-deck{font-size:.85rem;color:rgba(255,255,255,0.72);line-height:1.5;margin:.35rem 0 0}'
    + '.bb-wa-close{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .2s ease}'
    + '.bb-wa-close:hover{background:rgba(255,255,255,0.16)}'
    + '.bb-wa-grid{display:grid;grid-template-columns:1fr 1fr;gap:.65rem;margin:0}'
    + '@media (max-width:480px){.bb-wa-grid{grid-template-columns:1fr}}'
    + '.bb-wa-card{display:flex;flex-direction:column;align-items:flex-start;gap:.35rem;padding:.95rem .9rem;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);cursor:pointer;transition:all .2s ease;text-align:left;font-family:inherit;color:#fff}'
    + '.bb-wa-card:hover{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.25);transform:translateY(-2px)}'
    + '.bb-wa-card-icon{font-size:1.4rem;line-height:1}'
    + '.bb-wa-card-label{font-weight:800;font-size:.92rem}'
    + '.bb-wa-card-sub{font-size:.72rem;color:rgba(255,255,255,0.62);line-height:1.35}'
    + '.bb-wa-footer{margin-top:1.25rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap;font-size:.72rem;color:rgba(255,255,255,0.6)}'
    + '.bb-wa-footer a{color:rgba(255,255,255,0.85);text-decoration:none}'
    + '.bb-wa-footer a:hover{text-decoration:underline}'
    + '.bb-wa-detail{display:flex;flex-direction:column;gap:.9rem}'
    + '.bb-wa-detail-head{display:flex;align-items:center;gap:.75rem}'
    + '.bb-wa-detail-icon{font-size:1.8rem}'
    + '.bb-wa-back{background:transparent;border:1px solid rgba(255,255,255,0.18);color:rgba(255,255,255,0.85);padding:6px 12px;border-radius:999px;cursor:pointer;font-size:.72rem;font-weight:600}'
    + '.bb-wa-back:hover{background:rgba(255,255,255,0.06);color:#fff}'
    + '.bb-wa-msg-label{display:block;margin-bottom:.4rem;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,0.7)}'
    + '.bb-wa-msg{width:100%;min-height:130px;resize:vertical;padding:.85rem 1rem;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.18);color:#fff;font-family:inherit;font-size:.92rem;line-height:1.55;outline:none;transition:border-color .2s}'
    + '.bb-wa-msg:focus{border-color:#25D366}'
    + '.bb-wa-send{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.9rem 1.5rem;border-radius:999px;background:#25D366;color:#fff;font-weight:800;font-size:.95rem;text-decoration:none;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(37,211,102,0.4);transition:transform .2s,box-shadow .2s}'
    + '.bb-wa-send:hover{transform:translateY(-2px);box-shadow:0 14px 36px rgba(37,211,102,0.5)}'
    + '.bb-wa-send svg{width:18px;height:18px}'
    + '@media (max-width:480px){#bb-wa-trigger{bottom:5.25rem;right:1.1rem;width:50px;height:50px}#bb-wa-trigger svg{width:24px;height:24px}#bb-wa-panel{padding:1.25rem;border-radius:18px}.bb-wa-title{font-size:1.1rem}}'
    + '@supports (padding:max(0px)){#bb-wa-trigger{bottom:max(6rem,calc(5rem + env(safe-area-inset-bottom)))}@media (max-width:480px){#bb-wa-trigger{bottom:max(5.25rem,calc(4.5rem + env(safe-area-inset-bottom)))}}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---- Trigger ---- */
  var trigger = document.createElement('button');
  trigger.id = 'bb-wa-trigger';
  trigger.setAttribute('aria-label', 'Chat with us on WhatsApp');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.innerHTML =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
    + '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>'
    + '</svg>';
  document.body.appendChild(trigger);

  /* ---- Overlay + panel ---- */
  var overlay = document.createElement('div');
  overlay.id = 'bb-wa-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'bb-wa-title');

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'})[c];
    });
  }

  function listView() {
    var cards = CATEGORIES.map(function (c) {
      return '<button class="bb-wa-card" data-cat="' + c.id + '" style="border-left:3px solid ' + c.color + ';">'
        + '<span class="bb-wa-card-icon">' + c.icon + '</span>'
        + '<span class="bb-wa-card-label">' + escapeHtml(c.label) + '</span>'
        + '<span class="bb-wa-card-sub">' + escapeHtml(c.subtitle) + '</span>'
        + '</button>';
    }).join('');

    overlay.innerHTML = ''
      + '<div id="bb-wa-panel">'
      + '<div class="bb-wa-head">'
      + '<div>'
      + '<h2 id="bb-wa-title" class="bb-wa-title">Chat with Blastbeat on WhatsApp</h2>'
      + '<p class="bb-wa-deck">Pick the path that matches you. We&rsquo;ll prefill your first message so you can send it in one tap.</p>'
      + '</div>'
      + '<button class="bb-wa-close" aria-label="Close">'
      + '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>'
      + '</button>'
      + '</div>'
      + '<div class="bb-wa-grid">' + cards + '</div>'
      + '<div class="bb-wa-footer">'
      + '<span>Replies typically within a few hours, Mon&ndash;Fri.</span>'
      + '<a href="/pages/contact.html">Prefer email? &rarr;</a>'
      + '</div>'
      + '</div>';

    overlay.querySelector('.bb-wa-close').addEventListener('click', close);
    overlay.querySelectorAll('.bb-wa-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var cat = CATEGORIES.find(function (c) { return c.id === card.dataset.cat; });
        if (cat) detailView(cat);
      });
    });
  }

  function detailView(cat) {
    overlay.innerHTML = ''
      + '<div id="bb-wa-panel">'
      + '<div class="bb-wa-head">'
      + '<div class="bb-wa-detail-head">'
      + '<span class="bb-wa-detail-icon">' + cat.icon + '</span>'
      + '<div>'
      + '<h2 class="bb-wa-title">' + escapeHtml(cat.label) + '</h2>'
      + '<p class="bb-wa-deck">' + escapeHtml(cat.subtitle) + '</p>'
      + '</div>'
      + '</div>'
      + '<button class="bb-wa-close" aria-label="Close">'
      + '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>'
      + '</button>'
      + '</div>'
      + '<div class="bb-wa-detail">'
      + '<div>'
      + '<span class="bb-wa-msg-label">Edit your message, then send</span>'
      + '<textarea class="bb-wa-msg" rows="5">' + escapeHtml(cat.message) + '</textarea>'
      + '</div>'
      + '<div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;">'
      + '<button class="bb-wa-back">&larr; Back</button>'
      + '<a class="bb-wa-send" href="#" target="_blank" rel="noopener">'
      + '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0c3.181 0 6.167 1.24 8.413 3.488a11.824 11.824 0 013.48 8.413c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24z"/></svg>'
      + 'Open WhatsApp'
      + '</a>'
      + '</div>'
      + '</div>'
      + '</div>';

    var textarea = overlay.querySelector('.bb-wa-msg');
    var sendBtn = overlay.querySelector('.bb-wa-send');
    var updateHref = function () {
      sendBtn.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(textarea.value);
    };
    updateHref();
    textarea.addEventListener('input', updateHref);
    overlay.querySelector('.bb-wa-close').addEventListener('click', close);
    overlay.querySelector('.bb-wa-back').addEventListener('click', listView);
  }

  function open() {
    listView();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    var btn = overlay.querySelector('.bb-wa-close');
    if (btn) btn.focus();
  }
  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    trigger.focus();
  }

  trigger.addEventListener('click', open);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
})();
