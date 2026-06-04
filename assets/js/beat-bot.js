/*!
 * BeatBot — Blastbeat Education AI Assistant
 * Gen Z chatbot for students aged 14–21
 */
(function () {
  'use strict';

  /* ── Knowledge base ── */
  var KB = [
    {
      patterns: ['hello', 'hi', 'hey', 'sup', 'yo', 'hiya', 'howzit'],
      reply: "Yo! 👋 I'm Beat — your Blastbeat guide.\nAsk me anything about the programme, how to apply, or what being part of Blastbeat looks like. What's on your mind?",
      chips: ['What is Blastbeat?', 'How do I apply?', 'Is it free?']
    },
    {
      patterns: ['what is blastbeat', 'about blastbeat', 'tell me about', 'what do you do', 'explain blastbeat'],
      reply: "Blastbeat Education is an Enterprise Skills Education (ESE) programme for young people aged 14–21.\n\nStudents work in real business teams, produce creative projects, and compete at national level — building skills in leadership, finance, marketing, music, sport, and more.\n\nWe've been doing this since 2003. 360,000+ students across 11 countries. Real experience, not just theory.",
      chips: ['MACC programme', 'FootBeat programme', 'How do I apply?']
    },
    {
      patterns: ['macc', 'music', 'arts', 'culture', 'creative', 'commerce'],
      reply: "MACC stands for **Music, Arts, Commerce & Culture**.\n\nStudents form entertainment businesses — booking acts, running events, managing budgets, designing marketing. They develop real enterprise skills through the lens of creative industries.\n\nMACC is perfect for students who love music, design, performance, or business.",
      chips: ['FootBeat programme', 'How do I apply?', 'What roles are there?']
    },
    {
      patterns: ['footbeat', 'football', 'sport', 'sports', 'athlete', 'soccer'],
      reply: "FootBeat is our Sport & Enterprise vertical 🏆\n\nStudents run sports events and organisations — managing teams, sponsors, match-day operations, and finances. It builds enterprise skills through sport.\n\nIf your school loves sport, FootBeat is a seriously powerful way to turn that passion into business skills.",
      chips: ['MACC programme', 'How do I apply?', 'Is it free?']
    },
    {
      patterns: ['apply', 'sign up', 'register', 'join', 'how to get', 'how do we'],
      reply: "Applying is straightforward! Here's the quick version:\n\n1️⃣ Fill in the school application form\n2️⃣ We'll reach out within 2 business days\n3️⃣ Quick discovery call with your principal or HOD\n4️⃣ Teacher training & onboarding\n5️⃣ Launch day — students go live!\n\nWe still have founding school spots available — free access for the first 12 schools.",
      chips: ['Apply now →', 'Is it free?', 'How long is the programme?'],
      links: [{ label: 'Go to application form', url: '/pages/apply.html' }]
    },
    {
      patterns: ['free', 'cost', 'price', 'fee', 'pay', 'money', 'afford', 'licence'],
      reply: "Great news — it's **completely free** for founding schools 🙌\n\nBlastbeat is a registered charity. We're running a founding cohort model: the first 12 schools get full access at no cost, including teacher training, platform, and competition entry.\n\n6 of 12 spots are taken — if your school is interested, now is the time.",
      chips: ['Apply for a spot', "What's included?", 'How do I apply?']
    },
    {
      patterns: ['what\'s included', "what is included", 'included', 'get when', 'what do we get', 'benefits'],
      reply: "Here's everything founding schools get:\n\n✅ Full programme licence (MACC + FootBeat)\n✅ Teacher training & CPD hours\n✅ National competition entry\n✅ CAPS-aligned curriculum materials\n✅ School dashboard & progress tracking\n✅ Sponsor matching support\n\nAll included. No hidden extras.",
      chips: ['Apply now →', 'Is it free?', 'How long is the programme?']
    },
    {
      patterns: ['how long', 'duration', 'term', 'weeks', 'months', 'year', 'semester'],
      reply: "The Blastbeat programme runs over one full school term (about 10–12 weeks) with an optional extended track for competing schools.\n\nIt slots into existing timetabled lessons — Business Studies, EMS, Life Orientation, or Arts — so no extra admin overhead for your team.\n\nFounding schools can start from Term 2, 2026.",
      chips: ['Apply for Term 2', 'Is it CAPS-aligned?', 'How do I apply?']
    },
    {
      patterns: ['caps', 'curriculum', 'aligned', 'official', 'department', 'dbe'],
      reply: "Yes! The Blastbeat curriculum is CAPS-aligned for:\n\n📚 Business Studies\n📚 Economics & Management Sciences (EMS)\n📚 Life Orientation\n📚 Arts & Culture\n\nNo extra lesson time needed — it integrates directly into your existing timetable. HODs can use completion data for reporting.",
      chips: ['Apply now →', "What's included?", 'How do I apply?']
    },
    {
      patterns: ['age', 'old', 'grade', 'year group', 'who is it for', 'student'],
      reply: "Blastbeat is designed for **students aged 14–21**, typically Grades 9–12 in the South African system.\n\nIt works well for secondary schools, FET colleges, and community education programmes. Both MACC and FootBeat are structured to match this age group's energy and ambition.",
      chips: ['MACC programme', 'FootBeat programme', 'Apply for your school']
    },
    {
      patterns: ['where', 'country', 'south africa', 'ireland', 'namibia', 'international', 'global', 'location'],
      reply: "Blastbeat has been running across 11 countries 🌍\n\nWe're currently expanding in:\n🇿🇦 South Africa (priority market — founding cohort open now)\n🇮🇪 Ireland\n🇳🇦 Namibia\n🇯🇵 Japan\n🇷🇼 Rwanda\n\nIf your school is outside these countries, get in touch — we're open to new territories.",
      chips: ['Apply now →', 'Contact us', 'Is it free?']
    },
    {
      patterns: ['competition', 'compete', 'event', 'showcase', 'prize', 'national'],
      reply: "Every Blastbeat school participates in regional and national showcases 🏆\n\nStudents pitch their business ideas, present creative projects, and perform in front of industry judges and media. It's real-world experience — not a mock exam.\n\nPrizes, media coverage, and industry connections for top performers.",
      chips: ['What is MACC?', 'What is FootBeat?', 'Apply now →']
    },
    {
      patterns: ['teacher', 'training', 'cpd', 'educator', 'facilitator', 'staff', 'professional development'],
      reply: "Teacher support is central to how Blastbeat works.\n\nAll founding school educators receive:\n🎓 Two days of in-school or virtual onboarding\n🎓 Certified ESE Facilitator status\n🎓 Ongoing virtual CPD workshops\n🎓 Access to lesson resources and support community\n\nNo experience in entrepreneurship needed — we train your team from scratch.",
      chips: ['Apply for your school', "What's included?", 'Is it free?']
    },
    {
      patterns: ['roles', 'role', 'job', 'team', 'what can i do', 'position'],
      reply: "Students choose from 14 real business roles inside Blastbeat:\n\n🎵 Artist / Performer\n⚽ Athlete / Team Captain\n📊 Financial Manager\n📣 Marketing Manager\n🎬 Creative Director\n📸 Content Creator\n🗓️ Event Coordinator\n🤝 Sponsorship Manager\n...and more!\n\nEvery role mirrors what you'd find in a real entertainment or sports business.",
      chips: ['MACC programme', 'FootBeat programme', 'Apply now →']
    },
    {
      patterns: ['sponsor', 'sponsorship', 'fund', 'corporate', 'partner', 'adopt a school'],
      reply: "We have an Adopt-A-School marketplace where corporate sponsors can fund schools.\n\nSponsoring through Blastbeat counts towards BBBEE SED spend, Section 18A tax relief, and SDG commitments.\n\nFounding school rate: R45,000/school — includes full programme for up to 100 students.",
      chips: ['Partners page', 'Contact us'],
      links: [{ label: 'View sponsorship packages', url: '/pages/partners.html' }]
    },
    {
      patterns: ['contact', 'email', 'phone', 'reach', 'talk', 'speak', 'message', 'whatsapp'],
      reply: "Here's how to reach the team:\n\n📧 info@blastbeat.education\n📧 partners@blastbeat.education (schools & sponsorship)\n📞 +27 73 804 8409\n\nOr fill in the contact form on our website — we respond within 2 business days.",
      chips: ['Apply now →', 'How do I apply?'],
      links: [{ label: 'Contact page', url: '/pages/contact.html' }]
    },
    {
      patterns: ['impact', 'results', 'stats', 'data', 'how many', 'proof', 'evidence'],
      reply: "Blastbeat's impact in numbers:\n\n📈 360,000+ students reached\n🌍 11 countries\n⏳ 23+ years of delivery\n💼 14 enterprise roles per school\n🏆 National competitions since 2003\n\nWe track skills development outcomes and learner confidence — full impact data is on our website.",
      chips: ['Impact page', 'Apply now →'],
      links: [{ label: 'See impact data', url: '/pages/impact.html' }]
    }
  ];

  var DEFAULT_REPLY = "Good question! I'm still learning 🎵 Try asking me about:\n\n• How to apply\n• What MACC or FootBeat is\n• Whether it's free\n• Teacher training\n• Competitions\n\nOr reach the team at info@blastbeat.education";
  var DEFAULT_CHIPS = ['What is Blastbeat?', 'How do I apply?', 'Contact us'];

  /* ── Link resolution ── */
  var QUICK_LINKS = {
    'Apply now →': '/pages/apply.html',
    'Apply for a spot': '/pages/apply.html',
    'Apply for your school': '/pages/apply.html',
    'Apply for Term 2': '/pages/apply.html',
    'Partners page': '/pages/partners.html',
    'Contact us': '/pages/contact.html',
    'Impact page': '/pages/impact.html'
  };

  /* ── Styles ── */
  var css = `
    #bb-bot-trigger {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9990;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366F1, #A855F7, #FF2D78);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(99,102,241,0.45), 0 0 0 0 rgba(99,102,241,0.4);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      animation: bb-pulse 2.5s ease-in-out infinite 3s;
      outline: none;
    }
    #bb-bot-trigger:hover {
      transform: scale(1.08);
      box-shadow: 0 8px 30px rgba(99,102,241,0.55);
      animation: none;
    }
    #bb-bot-trigger:focus-visible {
      outline: 3px solid #00F5FF;
      outline-offset: 3px;
    }
    #bb-bot-trigger svg { width: 26px; height: 26px; }
    #bb-bot-greeting {
      position: fixed;
      bottom: 1.6rem;
      right: 5.5rem;
      z-index: 9988;
      background: linear-gradient(135deg, #1a1f3a, #131725);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 18px 18px 6px 18px;
      padding: 10px 16px;
      color: #fff;
      font-size: 0.85rem;
      font-weight: 600;
      box-shadow: 0 12px 30px rgba(0,0,0,0.4);
      transform: translateY(8px) scale(0.95);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
      white-space: nowrap;
      max-width: calc(100vw - 8rem);
    }
    #bb-bot-greeting::after {
      content: '';
      position: absolute;
      right: -7px;
      bottom: 14px;
      width: 14px;
      height: 14px;
      background: linear-gradient(135deg, #1a1f3a, #131725);
      border-right: 1px solid rgba(255,255,255,0.14);
      border-bottom: 1px solid rgba(255,255,255,0.14);
      transform: rotate(-45deg);
    }
    #bb-bot-greeting.show {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }
    #bb-bot-greeting .bb-wave { display: inline-block; animation: bb-wave 1s ease-in-out infinite; transform-origin: 70% 70%; margin-right: 4px; }
    @keyframes bb-wave {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(18deg); }
      75% { transform: rotate(-12deg); }
    }
    @media (max-width: 480px) {
      #bb-bot-greeting { font-size: 0.78rem; padding: 8px 12px; bottom: 1.4rem; right: 4.6rem; }
    }
    #bb-bot-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      width: 16px;
      height: 16px;
      background: #FF2D78;
      border-radius: 50%;
      border: 2px solid #0F0F1A;
      display: none;
      animation: bb-blink 1s ease infinite;
    }
    #bb-bot-badge.show { display: block; }

    @keyframes bb-pulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(99,102,241,0.45), 0 0 0 0 rgba(99,102,241,0.4); }
      70% { box-shadow: 0 4px 20px rgba(99,102,241,0.45), 0 0 0 14px rgba(99,102,241,0); }
    }
    @keyframes bb-blink { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
    @keyframes bb-slide-up { from { opacity:0; transform: translateY(16px) scale(0.97); } to { opacity:1; transform: translateY(0) scale(1); } }
    @keyframes bb-msg-in { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:translateY(0); } }

    #bb-bot-panel {
      position: fixed;
      bottom: 5.5rem;
      right: 1.5rem;
      z-index: 9989;
      width: 360px;
      max-width: calc(100vw - 2rem);
      max-height: 560px;
      background: rgba(15, 15, 26, 0.97);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.1);
      animation: bb-slide-up 0.35s cubic-bezier(0.16,1,0.3,1);
      font-family: 'DM Sans', system-ui, sans-serif;
    }
    #bb-bot-panel.hidden { display: none !important; }

    #bb-bot-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      flex-shrink: 0;
      background: linear-gradient(90deg, rgba(99,102,241,0.08), transparent);
    }
    #bb-bot-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #6366F1, #FF2D78);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
      position: relative;
    }
    #bb-bot-avatar::after {
      content: '';
      position: absolute; bottom: 1px; right: 1px;
      width: 10px; height: 10px; border-radius: 50%;
      background: #22C55E;
      border: 2px solid #0F0F1A;
    }
    #bb-bot-info { flex: 1; }
    #bb-bot-info strong { display: block; color: white; font-size: 0.9rem; font-weight: 700; }
    #bb-bot-info span { color: #22C55E; font-size: 0.72rem; font-weight: 600; }
    #bb-bot-close {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.4); font-size: 1.2rem; line-height: 1;
      padding: 0.25rem 0.5rem; border-radius: 6px;
      transition: color 0.2s, background 0.2s;
    }
    #bb-bot-close:hover { color: white; background: rgba(255,255,255,0.08); }

    #bb-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      scroll-behavior: smooth;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    #bb-messages::-webkit-scrollbar { width: 3px; }
    #bb-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

    .bb-msg {
      display: flex;
      flex-direction: column;
      animation: bb-msg-in 0.3s ease;
      max-width: 88%;
    }
    .bb-msg.bot { align-self: flex-start; }
    .bb-msg.user { align-self: flex-end; }

    .bb-bubble {
      padding: 0.75rem 1rem;
      border-radius: 16px;
      font-size: 0.875rem;
      line-height: 1.55;
      white-space: pre-line;
    }
    .bb-msg.bot .bb-bubble {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.88);
      border-bottom-left-radius: 4px;
    }
    .bb-msg.bot .bb-bubble strong { color: white; }
    .bb-msg.user .bb-bubble {
      background: linear-gradient(135deg, #6366F1, #A855F7);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .bb-link-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.5rem;
    }
    .bb-link-btn {
      display: inline-block;
      padding: 0.3rem 0.75rem;
      background: rgba(0,245,255,0.1);
      border: 1px solid rgba(0,245,255,0.3);
      color: #00F5FF;
      font-size: 0.78rem;
      font-weight: 600;
      border-radius: 999px;
      text-decoration: none;
      transition: background 0.2s, color 0.2s;
    }
    .bb-link-btn:hover { background: rgba(0,245,255,0.2); color: white; }

    .bb-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.5rem;
    }
    .bb-chip {
      padding: 0.35rem 0.85rem;
      background: rgba(99,102,241,0.12);
      border: 1px solid rgba(99,102,241,0.35);
      color: rgba(255,255,255,0.8);
      font-size: 0.76rem;
      font-weight: 600;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .bb-chip:hover { background: rgba(99,102,241,0.25); border-color: rgba(99,102,241,0.55); color: white; }
    .bb-chip:active { transform: scale(0.96); }

    .bb-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0.6rem 1rem;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      border-bottom-left-radius: 4px;
      width: fit-content;
    }
    .bb-typing span {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: rgba(99,102,241,0.7);
      animation: bb-typing-dot 1.2s ease infinite;
    }
    .bb-typing span:nth-child(2) { animation-delay: 0.2s; }
    .bb-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bb-typing-dot { 0%,80%,100%{transform:scale(0.7);opacity:0.4} 40%{transform:scale(1);opacity:1} }

    #bb-input-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1rem;
      border-top: 1px solid rgba(255,255,255,0.07);
      flex-shrink: 0;
      background: rgba(255,255,255,0.02);
    }
    #bb-input {
      flex: 1;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      color: white;
      font-family: inherit;
      font-size: 0.875rem;
      padding: 0.6rem 0.9rem;
      border-radius: 12px;
      outline: none;
      transition: border-color 0.2s;
      min-height: 40px;
    }
    #bb-input::placeholder { color: rgba(255,255,255,0.3); }
    #bb-input:focus { border-color: rgba(99,102,241,0.5); }
    #bb-send {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #6366F1, #A855F7);
      border: none;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: transform 0.2s, opacity 0.2s;
      outline: none;
    }
    #bb-send:hover { transform: scale(1.06); }
    #bb-send:active { transform: scale(0.94); }
    #bb-send svg { width: 18px; height: 18px; }

    #bb-powered {
      text-align: center;
      font-size: 0.65rem;
      color: rgba(255,255,255,0.2);
      padding: 0.4rem;
      border-top: 1px solid rgba(255,255,255,0.04);
      flex-shrink: 0;
    }
  `;

  /* ── Inject CSS ── */
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ── Build HTML ── */
  var trigger = document.createElement('button');
  trigger.id = 'bb-bot-trigger';
  trigger.setAttribute('aria-label', 'Chat with Beat');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = `
    <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="8" width="14" height="12" rx="3" stroke="white" stroke-width="1.5"/>
      <path d="M17 13h3l2 2v-5l-2 2h-3" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="8" cy="14" r="1.5" fill="white"/>
      <circle cx="12" cy="14" r="1.5" fill="white"/>
      <path d="M9 8V6M14 8V6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <span id="bb-bot-badge"></span>
  `;

  var panel = document.createElement('div');
  panel.id = 'bb-bot-panel';
  panel.className = 'hidden';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Beat chat');
  panel.innerHTML = `
    <div id="bb-bot-header">
      <div id="bb-bot-avatar">🎵</div>
      <div id="bb-bot-info">
        <strong>Beat</strong>
        <span>● Online — Blastbeat AI</span>
      </div>
      <button id="bb-bot-close" aria-label="Close chat">✕</button>
    </div>
    <div id="bb-messages" role="log" aria-live="polite"></div>
    <div id="bb-input-row">
      <input id="bb-input" type="text" placeholder="Ask me anything..." autocomplete="off" aria-label="Message Beat" maxlength="200">
      <button id="bb-send" aria-label="Send message">
        <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 9h14M10 3l6 6-6 6" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    <div id="bb-powered">Powered by Blastbeat Education</div>
  `;

  document.body.appendChild(trigger);
  document.body.appendChild(panel);

  /* ---- Friendly greeting bubble ---- */
  var greetEl = document.createElement('div');
  greetEl.id = 'bb-bot-greeting';
  greetEl.setAttribute('role', 'button');
  greetEl.setAttribute('tabindex', '0');
  greetEl.setAttribute('aria-label', "Open Beat — Blastbeat's AI guide");
  greetEl.innerHTML = '<span class="bb-wave" aria-hidden="true">👋</span> Hey, I\'m <strong>Beat</strong> — need a hand?';
  document.body.appendChild(greetEl);

  // Show once per session, ~6 seconds after page load, only if bot panel hasn't been opened yet
  try {
    var seen = sessionStorage.getItem('bb-bot-greeted');
    if (!seen) {
      setTimeout(function () {
        if (panel.classList.contains('hidden')) {
          greetEl.classList.add('show');
          sessionStorage.setItem('bb-bot-greeted', '1');
          // Auto-hide after 8s if user ignores it
          setTimeout(function () { greetEl.classList.remove('show'); }, 8000);
        }
      }, 6000);
    }
  } catch (e) { /* sessionStorage blocked — no greeting */ }

  function hideGreeting() { greetEl.classList.remove('show'); }
  greetEl.addEventListener('click', function () { hideGreeting(); trigger.click(); });
  greetEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hideGreeting(); trigger.click(); }
  });

  /* ── Logic ── */
  var msgs = document.getElementById('bb-messages');
  var input = document.getElementById('bb-input');
  var badge = document.getElementById('bb-bot-badge');
  var opened = false;
  var greeted = false;

  function togglePanel() {
    var hidden = panel.classList.toggle('hidden');
    trigger.setAttribute('aria-expanded', !hidden);
    badge.classList.remove('show');
    if (!hidden) {
      opened = true;
      if (!greeted) { greet(); greeted = true; }
      setTimeout(function () { input.focus(); }, 200);
    }
  }

  function greet() {
    setTimeout(function () {
      addTyping();
      setTimeout(function () {
        removeTyping();
        addBotMsg(
          "Hey! 👋 I'm **Beat**, Blastbeat's digital guide.\n\nI can tell you about the programme, how to apply, or what it's like being a Blastbeat student. What would you like to know?",
          ['What is Blastbeat?', 'How do I apply?', 'Is it free?']
        );
      }, 1200);
    }, 400);
  }

  trigger.addEventListener('click', togglePanel);
  document.getElementById('bb-bot-close').addEventListener('click', function () {
    panel.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'false');
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });
  document.getElementById('bb-send').addEventListener('click', sendMsg);

  function sendMsg() {
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    addUserMsg(text);
    recordUserTurn(text);
    respond(text.toLowerCase(), text);
  }

  // Keep the last N exchanges to send to the AI endpoint as context.
  var conversationHistory = [];
  var MAX_HISTORY = 8;

  function recordUserTurn(content) {
    conversationHistory.push({ role: 'user', content: content });
    if (conversationHistory.length > MAX_HISTORY) conversationHistory.shift();
  }
  function recordAssistantTurn(content) {
    conversationHistory.push({ role: 'assistant', content: content });
    if (conversationHistory.length > MAX_HISTORY) conversationHistory.shift();
  }

  function askAI(text, originalText) {
    return fetch('/api/beat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: originalText || text,
        history: conversationHistory.slice(0, -1), // exclude the just-added user turn
      }),
    }).then(function (res) {
      if (!res.ok && res.status !== 429 && res.status !== 503) {
        return res.json().then(function (j) {
          throw new Error(j.error || ('http_' + res.status));
        }).catch(function () { throw new Error('http_' + res.status); });
      }
      return res.json();
    });
  }

  function respond(text, originalText) {
    addTyping();
    var matchedKB = null;
    for (var i = 0; i < KB.length; i++) {
      for (var j = 0; j < KB[i].patterns.length; j++) {
        if (text.indexOf(KB[i].patterns[j]) !== -1) { matchedKB = KB[i]; break; }
      }
      if (matchedKB) break;
    }

    if (matchedKB) {
      setTimeout(function () {
        removeTyping();
        addBotMsg(matchedKB.reply, matchedKB.chips, matchedKB.links);
        recordAssistantTurn(matchedKB.reply);
      }, 600 + Math.random() * 400);
      return;
    }

    // No KB match — try the AI endpoint.
    askAI(text, originalText)
      .then(function (data) {
        removeTyping();
        var reply = data.reply || DEFAULT_REPLY;
        addBotMsg(reply, DEFAULT_CHIPS);
        recordAssistantTurn(reply);
      })
      .catch(function () {
        removeTyping();
        addBotMsg(DEFAULT_REPLY, DEFAULT_CHIPS);
      });
  }

  function addBotMsg(text, chips, links) {
    var div = document.createElement('div');
    div.className = 'bb-msg bot';
    var bubble = document.createElement('div');
    bubble.className = 'bb-bubble';
    bubble.innerHTML = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    div.appendChild(bubble);
    if (links && links.length) {
      var lr = document.createElement('div');
      lr.className = 'bb-link-row';
      links.forEach(function (l) {
        var a = document.createElement('a');
        a.className = 'bb-link-btn';
        a.href = l.url;
        a.textContent = l.label;
        lr.appendChild(a);
      });
      div.appendChild(lr);
    }
    if (chips && chips.length) {
      var cr = document.createElement('div');
      cr.className = 'bb-chips';
      chips.forEach(function (c) {
        var btn = document.createElement('button');
        btn.className = 'bb-chip';
        btn.textContent = c;
        btn.addEventListener('click', function () {
          if (QUICK_LINKS[c]) { window.location.href = QUICK_LINKS[c]; return; }
          addUserMsg(c);
          recordUserTurn(c);
          respond(c.toLowerCase(), c);
        });
        cr.appendChild(btn);
      });
      div.appendChild(cr);
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addUserMsg(text) {
    var div = document.createElement('div');
    div.className = 'bb-msg user';
    var bubble = document.createElement('div');
    bubble.className = 'bb-bubble';
    bubble.textContent = text;
    div.appendChild(bubble);
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  var typingEl = null;
  function addTyping() {
    var div = document.createElement('div');
    div.className = 'bb-msg bot';
    div.id = 'bb-typing-indicator';
    div.innerHTML = '<div class="bb-typing"><span></span><span></span><span></span></div>';
    typingEl = div;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function removeTyping() {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    typingEl = null;
  }

  /* ── Show badge after 8 seconds if not opened ── */
  setTimeout(function () {
    if (!opened) { badge.classList.add('show'); }
  }, 8000);
})();
