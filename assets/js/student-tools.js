/*!
 * Blastbeat Student Tools
 * Three interactive tools for youth aged 14–21:
 *   1. Enterprise Idea Spark — random business idea generator
 *   2. Quick P&L Calculator — revenue/cost/profit tool
 *   3. Career Role Matcher — quiz to find your Blastbeat role
 *
 * Usage: add <div id="bb-student-tools"></div> to any page.
 * The widget self-initialises on DOMContentLoaded.
 */
(function () {
  'use strict';

  /* ── Mount check ── */
  function init() {
    var mount = document.getElementById('bb-student-tools');
    if (!mount) return;

    /* ── Styles ── */
    var css = `
      .bbt-wrap {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px;
        overflow: hidden;
        font-family: 'DM Sans', system-ui, sans-serif;
        color: white;
      }
      .bbt-tabs {
        display: flex;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        overflow-x: auto;
        scrollbar-width: none;
      }
      .bbt-tabs::-webkit-scrollbar { display:none; }
      .bbt-tab {
        padding: 0.9rem 1.5rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: rgba(255,255,255,0.45);
        cursor: pointer;
        border: none;
        background: none;
        white-space: nowrap;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
        transition: color 0.2s, border-color 0.2s;
        letter-spacing: 0.01em;
      }
      .bbt-tab:hover { color: rgba(255,255,255,0.8); }
      .bbt-tab.active {
        color: #00F5FF;
        border-bottom-color: #00F5FF;
      }
      .bbt-panel {
        padding: 2rem 2rem;
        display: none;
      }
      .bbt-panel.active { display: block; }

      /* ── Idea Spark ── */
      .bbt-idea-display {
        background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08));
        border: 1px solid rgba(99,102,241,0.25);
        border-radius: 14px;
        padding: 1.75rem;
        min-height: 140px;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }
      .bbt-idea-category {
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #A855F7;
      }
      .bbt-idea-title {
        font-size: 1.2rem;
        font-weight: 800;
        color: white;
        font-family: 'Space Grotesk', system-ui, sans-serif;
        line-height: 1.3;
      }
      .bbt-idea-desc {
        font-size: 0.875rem;
        color: rgba(255,255,255,0.6);
        line-height: 1.6;
        margin: 0;
      }
      .bbt-spark-btn {
        background: linear-gradient(135deg, #6366F1, #A855F7);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 0.8rem 1.75rem;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: transform 0.2s, box-shadow 0.2s;
        font-family: inherit;
      }
      .bbt-spark-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
      .bbt-spark-btn:active { transform: scale(0.97); }
      .bbt-spark-icon { font-size: 1.1rem; transition: transform 0.4s; }
      .bbt-spark-btn.spinning .bbt-spark-icon { transform: rotate(360deg); }

      /* ── P&L Calculator ── */
      .bbt-calc-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1.25rem;
      }
      @media (max-width: 480px) { .bbt-calc-grid { grid-template-columns: 1fr; } }
      .bbt-field label {
        display: block;
        font-size: 0.78rem;
        font-weight: 700;
        color: rgba(255,255,255,0.6);
        margin-bottom: 0.4rem;
        letter-spacing: 0.03em;
      }
      .bbt-field input {
        width: 100%;
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 10px;
        color: white;
        font-size: 1rem;
        font-weight: 600;
        padding: 0.65rem 0.9rem;
        outline: none;
        transition: border-color 0.2s;
        font-family: 'Space Grotesk', system-ui, sans-serif;
        box-sizing: border-box;
        -webkit-appearance: none;
      }
      .bbt-field input:focus { border-color: rgba(99,102,241,0.5); }
      .bbt-field input::placeholder { color: rgba(255,255,255,0.25); font-weight: 400; }
      .bbt-calc-result {
        background: rgba(0,245,255,0.06);
        border: 1px solid rgba(0,245,255,0.2);
        border-radius: 14px;
        padding: 1.25rem 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .bbt-result-label { font-size: 0.8rem; color: rgba(255,255,255,0.5); font-weight: 600; }
      .bbt-result-value {
        font-size: 1.8rem;
        font-weight: 800;
        font-family: 'Space Grotesk', system-ui, sans-serif;
        line-height: 1;
      }
      .bbt-result-value.profit { color: #22C55E; }
      .bbt-result-value.loss { color: #FF2D78; }
      .bbt-result-value.break-even { color: #00F5FF; }
      .bbt-result-tip { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-top: 0.75rem; font-style: italic; }
      .bbt-divider { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 1.25rem 0; }

      /* ── Role Matcher ── */
      .bbt-quiz-q {
        font-size: 1rem;
        font-weight: 700;
        color: white;
        margin-bottom: 1rem;
        line-height: 1.4;
      }
      .bbt-quiz-progress {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }
      .bbt-quiz-bar {
        flex: 1;
        height: 4px;
        background: rgba(255,255,255,0.08);
        border-radius: 2px;
        overflow: hidden;
      }
      .bbt-quiz-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #6366F1, #FF2D78);
        border-radius: 2px;
        transition: width 0.4s ease;
      }
      .bbt-quiz-step { font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 600; white-space: nowrap; }
      .bbt-quiz-options {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        margin-bottom: 1.5rem;
      }
      .bbt-quiz-opt {
        padding: 0.85rem 1.1rem;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        color: rgba(255,255,255,0.8);
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s ease;
        font-family: inherit;
      }
      .bbt-quiz-opt:hover {
        background: rgba(99,102,241,0.12);
        border-color: rgba(99,102,241,0.35);
        color: white;
      }
      .bbt-quiz-opt.selected {
        background: rgba(99,102,241,0.18);
        border-color: rgba(99,102,241,0.5);
        color: white;
      }
      .bbt-quiz-result {
        background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(255,45,120,0.08));
        border: 1px solid rgba(99,102,241,0.25);
        border-radius: 16px;
        padding: 1.75rem;
        text-align: center;
        display: none;
      }
      .bbt-quiz-result.show { display: block; }
      .bbt-role-emoji { font-size: 3rem; display: block; margin-bottom: 0.75rem; }
      .bbt-role-name {
        font-size: 1.4rem;
        font-weight: 800;
        font-family: 'Space Grotesk', system-ui, sans-serif;
        background: linear-gradient(135deg, #6366F1, #A855F7, #FF2D78);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.5rem;
        display: block;
      }
      .bbt-role-desc { font-size: 0.875rem; color: rgba(255,255,255,0.65); line-height: 1.6; margin-bottom: 1.25rem; }
      .bbt-retry-btn {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.2);
        color: rgba(255,255,255,0.6);
        border-radius: 10px;
        padding: 0.55rem 1.25rem;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s;
      }
      .bbt-retry-btn:hover { border-color: rgba(255,255,255,0.4); color: white; }
      .bbt-apply-cta {
        display: inline-block;
        background: linear-gradient(135deg, #6366F1, #A855F7);
        color: white;
        border-radius: 10px;
        padding: 0.7rem 1.5rem;
        font-size: 0.85rem;
        font-weight: 700;
        text-decoration: none;
        margin-left: 0.6rem;
        transition: transform 0.2s;
      }
      .bbt-apply-cta:hover { transform: scale(1.03); color: white; }
    `;

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    /* ── DATA: Business Ideas ── */
    var IDEAS = [
      { cat: 'Digital', title: 'Social Media Manager for Local Businesses', desc: 'Help small shops and restaurants build their Instagram and TikTok presence. Charge a monthly retainer. Start with one client in your neighbourhood.' },
      { cat: 'Creative', title: 'Event Photography & Content Package', desc: 'Offer photography + same-day social media content at matric dances, birthday parties, and school events. Upsell a printed photobook.' },
      { cat: 'Service', title: 'Tutoring Network App (WhatsApp-based)', desc: 'Connect matric students with subject tutors via WhatsApp. Take a small booking fee. Scale by recruiting top students from your school.' },
      { cat: 'Social Impact', title: 'Community Food Garden & Fresh Produce Sales', desc: 'Start a vertical garden or school allotment. Sell fresh produce to teachers, parents, and local restaurants. Reinvest profit into growing capacity.' },
      { cat: 'Digital', title: 'AI-Powered CV & Job Application Service', desc: 'Help school leavers write CVs, cover letters, and LinkedIn profiles using AI tools. Charge R150–R300 per package. Run via WhatsApp.' },
      { cat: 'Creative', title: 'Custom Merch for Schools & Sports Teams', desc: 'Design and sell custom hoodies, jerseys, and caps for school clubs and sports teams. Use print-on-demand to start with zero stock.' },
      { cat: 'Service', title: 'Homework & Assignment Help Subscription', desc: 'Charge R99/month for access to a shared study group + curated resources for each subject. Grow into a platform with multiple tutors.' },
      { cat: 'Social Impact', title: 'Recycling Collection & Upcycling Studio', desc: 'Collect recyclables in your area, sell to recyclers, and run upcycling workshops to turn waste into handmade products for resale.' },
      { cat: 'Digital', title: 'Local Events & Gig Listing Website', desc: 'Build a simple website listing local youth events, gigs, and pop-ups. Charge event organisers R200 to be featured. Monetise with ads later.' },
      { cat: 'Creative', title: 'Youth Podcast Production Service', desc: 'Help youth organisations, schools, and churches launch their own podcasts. Offer recording, editing, and publishing as a monthly package.' },
      { cat: 'Service', title: 'Party & Event Planning Packages', desc: 'Offer budget-friendly birthday and celebration packages for families. Coordinate décor, music, catering sourcing, and photography.' },
      { cat: 'Social Impact', title: 'Pre-Loved Clothing Market Pop-Up', desc: 'Source second-hand clothes, style and resell them at school and community pop-up markets. Build a social media following to grow demand.' },
      { cat: 'Digital', title: 'Graphic Design Service for Matric Jackets', desc: 'Design custom matric farewell jacket graphics. Use Canva + a local printing partner. Market to Grade 11 classes 6 months before farewell season.' },
      { cat: 'Creative', title: 'Music Lesson & Beat-Making Studio (Home)', desc: 'Offer beginner guitar, piano, or beat-making lessons from home. Charge R150/hour. Sell custom beats online via Fiverr for extra revenue.' },
      { cat: 'Service', title: 'Neighbourhood Errand & Delivery Service', desc: 'Offer grocery runs, pharmacy pickups, and courier services for elderly residents and busy parents. Build trust, then expand with a small team.' },
      { cat: 'Social Impact', title: 'Mental Health & Wellness App for Teens', desc: 'Build a simple app (or WhatsApp chatbot) with daily affirmations, mental health resources, and peer support. Partner with school counsellors.' },
      { cat: 'Digital', title: 'School Canteen Menu Design & Marketing', desc: 'Offer schools a modern digital menu board + weekly WhatsApp specials design. Charge R500/month. Grow to 10 schools for R5,000/month.' },
      { cat: 'Creative', title: 'Spoken Word & Poetry Event Series', desc: 'Host monthly spoken word evenings at a local café or community hall. Charge entry, sell merch, and live-stream on social media for wider reach.' },
      { cat: 'Service', title: 'School Sports Administration Assistant', desc: 'Manage fixtures, transport coordination, and score tracking for school sports teams. Offer this as a service to multiple schools in your district.' },
      { cat: 'Social Impact', title: 'Youth Coding & Tech Workshop Facilitator', desc: 'Run beginner coding and app design workshops for younger learners using free platforms like Scratch and code.org. Partner with your local library.' }
    ];

    /* ── DATA: Quiz ── */
    var QUIZ = [
      {
        q: 'Your class has a project to run an event. Which part do you want to lead?',
        opts: [
          { text: '🎨 Design the visual brand and marketing', scores: { creative: 2, marketer: 2 } },
          { text: '📊 Manage the budget and ticket sales', scores: { finance: 2, manager: 1 } },
          { text: '🎤 Book and manage the performers or athletes', scores: { events: 2, talent: 1 } },
          { text: '📱 Run the social media and content', scores: { digital: 2, marketer: 1 } }
        ]
      },
      {
        q: 'Which subject do you enjoy most?',
        opts: [
          { text: '🎵 Music / Drama / Arts', scores: { creative: 2, talent: 2 } },
          { text: '⚽ Physical Education / Sport', scores: { athlete: 3 } },
          { text: '📈 Business Studies / EMS', scores: { finance: 2, manager: 2 } },
          { text: '💻 IT / Media / Design', scores: { digital: 2, creative: 1 } }
        ]
      },
      {
        q: 'A new product needs to reach 1,000 people. What would you do first?',
        opts: [
          { text: '📲 Create a viral social media campaign', scores: { digital: 2, marketer: 2 } },
          { text: '🤝 Phone sponsors and pitch partnerships', scores: { sponsor: 3, manager: 1 } },
          { text: '🎬 Produce a short film or promo video', scores: { creative: 3 } },
          { text: '🗓️ Plan a launch event from scratch', scores: { events: 3 } }
        ]
      },
      {
        q: 'How do you prefer to work with others?',
        opts: [
          { text: '🧭 I like leading and organising', scores: { manager: 3 } },
          { text: '🤝 I like collaborating as part of a team', scores: { talent: 1, events: 1, digital: 1 } },
          { text: '🎯 I prefer working independently on my piece', scores: { creative: 2, finance: 1 } },
          { text: '🌟 I want to be in the spotlight', scores: { talent: 3, creative: 1 } }
        ]
      },
      {
        q: 'What\'s your dream career direction?',
        opts: [
          { text: '🎤 Artist, performer, or content creator', scores: { talent: 3 } },
          { text: '💰 Entrepreneur or business owner', scores: { manager: 2, finance: 2 } },
          { text: '📣 Marketing, PR, or brand strategist', scores: { marketer: 3 } },
          { text: '🏆 Sports professional or sports business', scores: { athlete: 3 } }
        ]
      }
    ];

    var ROLES = {
      creative:  { emoji: '🎨', name: 'Creative Director', desc: 'You think visually and lead with imagination. In Blastbeat you\'d shape the brand identity — designing assets, directing content shoots, and making sure everything looks elite.' },
      marketer:  { emoji: '📣', name: 'Marketing Manager', desc: 'You understand audiences and know how to reach them. You\'d run campaigns, own the social feeds, write copy, and make sure the right people show up.' },
      finance:   { emoji: '💰', name: 'Financial Manager', desc: 'Numbers are your superpower. You\'d manage the business budget, track revenue and costs, handle ticket sales, and present financial reports to the board.' },
      manager:   { emoji: '🧭', name: 'Managing Director', desc: 'Natural born leader. You\'d run the whole enterprise — setting strategy, managing the team, keeping everyone on track, and pitching to the judges at nationals.' },
      events:    { emoji: '🗓️', name: 'Events Coordinator', desc: 'You live for a well-executed plan. You\'d manage logistics, coordinate venues, manage timelines, and make sure every showcase or match runs without a hitch.' },
      digital:   { emoji: '📱', name: 'Digital Content Creator', desc: 'You eat algorithms for breakfast. You\'d produce reels, run the TikTok, manage the website, and build the online presence that makes Blastbeat go viral.' },
      talent:    { emoji: '🌟', name: 'Talent & Artist Manager', desc: 'You have the instinct for spotting and developing talent. You\'d manage performers and athletes — handling bookings, schedules, contracts, and development plans.' },
      athlete:   { emoji: '⚽', name: 'Team Captain / Athlete Director', desc: 'Sport is your language. You\'d lead the FootBeat team — managing fixtures, coordinating training, and driving the competitive edge that gets you to nationals.' },
      sponsor:   { emoji: '🤝', name: 'Sponsorship Manager', desc: 'You\'re a deal-maker. You\'d identify and pitch to corporate sponsors, negotiate packages, manage relationships, and bring in the funding that powers everything.' }
    };

    /* ── Build HTML ── */
    mount.innerHTML = `
      <div class="bbt-wrap">
        <div class="bbt-tabs" role="tablist">
          <button class="bbt-tab active" data-panel="idea" role="tab" aria-selected="true">⚡ Idea Spark</button>
          <button class="bbt-tab" data-panel="calc" role="tab" aria-selected="false">💰 P&amp;L Calculator</button>
          <button class="bbt-tab" data-panel="quiz" role="tab" aria-selected="false">🎭 Role Matcher</button>
        </div>

        <!-- IDEA SPARK -->
        <div class="bbt-panel active bb-tool-panel" id="bbt-panel-idea" role="tabpanel">
          <div class="bbt-idea-display" id="bbt-idea-box">
            <span class="bbt-idea-category" id="bbt-idea-cat">DIGITAL</span>
            <div class="bbt-idea-title" id="bbt-idea-title">Social Media Manager for Local Businesses</div>
            <p class="bbt-idea-desc" id="bbt-idea-desc">Help small shops and restaurants build their Instagram and TikTok presence. Charge a monthly retainer. Start with one client in your neighbourhood.</p>
          </div>
          <button class="bbt-spark-btn" id="bbt-spark-btn">
            <span class="bbt-spark-icon" id="bbt-spark-icon">✦</span> Spark a New Idea
          </button>
          <p style="margin-top:1rem;font-size:0.78rem;color:rgba(255,255,255,0.3);line-height:1.5;">
            20 real youth business ideas — from digital services to social enterprises. Use these as a starting point to develop your own pitch.
          </p>
        </div>

        <!-- P&L CALCULATOR -->
        <div class="bbt-panel bb-tool-panel" id="bbt-panel-calc" role="tabpanel">
          <p style="font-size:0.82rem;color:rgba(255,255,255,0.5);margin-bottom:1.25rem;">Enter your numbers to see if your business idea makes money. <strong style="color:rgba(255,255,255,0.75);">Revenue − Costs = Profit</strong></p>
          <div class="bbt-calc-grid">
            <div class="bbt-field">
              <label for="bbt-price">Price per unit (R)</label>
              <input type="number" id="bbt-price" placeholder="e.g. 150" min="0" step="0.01">
            </div>
            <div class="bbt-field">
              <label for="bbt-units">Units sold per month</label>
              <input type="number" id="bbt-units" placeholder="e.g. 30" min="0">
            </div>
          </div>
          <hr class="bbt-divider">
          <div class="bbt-calc-grid">
            <div class="bbt-field">
              <label for="bbt-materials">Materials / stock (R/month)</label>
              <input type="number" id="bbt-materials" placeholder="e.g. 1200" min="0" step="0.01">
            </div>
            <div class="bbt-field">
              <label for="bbt-other">Other costs (R/month)</label>
              <input type="number" id="bbt-other" placeholder="e.g. 500" min="0" step="0.01">
            </div>
          </div>
          <div class="bbt-calc-result" id="bbt-calc-result">
            <div>
              <div class="bbt-result-label">Monthly Revenue</div>
              <div class="bbt-result-value" id="bbt-revenue-out" style="color:rgba(255,255,255,0.5)">R 0</div>
            </div>
            <div style="color:rgba(255,255,255,0.2);font-size:1.5rem">−</div>
            <div>
              <div class="bbt-result-label">Total Costs</div>
              <div class="bbt-result-value" id="bbt-costs-out" style="color:rgba(255,255,255,0.5)">R 0</div>
            </div>
            <div style="color:rgba(255,255,255,0.2);font-size:1.5rem">=</div>
            <div>
              <div class="bbt-result-label">Profit / Loss</div>
              <div class="bbt-result-value" id="bbt-profit-out">R 0</div>
            </div>
          </div>
          <p class="bbt-result-tip" id="bbt-calc-tip">Fill in your numbers above to see your result.</p>
        </div>

        <!-- ROLE MATCHER -->
        <div class="bbt-panel bb-tool-panel" id="bbt-panel-quiz" role="tabpanel">
          <div id="bbt-quiz-wrap">
            <div class="bbt-quiz-progress">
              <div class="bbt-quiz-bar"><div class="bbt-quiz-bar-fill" id="bbt-quiz-progress" style="width:20%"></div></div>
              <span class="bbt-quiz-step" id="bbt-quiz-step">1 / 5</span>
            </div>
            <div class="bbt-quiz-q" id="bbt-quiz-q"></div>
            <div class="bbt-quiz-options" id="bbt-quiz-opts"></div>
          </div>
          <div class="bbt-quiz-result" id="bbt-quiz-result">
            <span class="bbt-role-emoji" id="bbt-role-emoji"></span>
            <strong class="bbt-role-name" id="bbt-role-name"></strong>
            <p class="bbt-role-desc" id="bbt-role-desc"></p>
            <button class="bbt-retry-btn" id="bbt-retry">Try again</button>
            <a href="/pages/apply.html" class="bbt-apply-cta">Apply for your school</a>
          </div>
        </div>
      </div>
    `;

    /* ── Tabs ── */
    var tabs = mount.querySelectorAll('.bbt-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        mount.querySelectorAll('.bbt-panel').forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        var panel = mount.querySelector('#bbt-panel-' + tab.getAttribute('data-panel'));
        if (panel) panel.classList.add('active');
      });
    });

    /* ── Idea Spark ── */
    var lastIdeaIdx = 0;
    function showIdea(idx) {
      var idea = IDEAS[idx];
      document.getElementById('bbt-idea-cat').textContent = idea.cat.toUpperCase();
      document.getElementById('bbt-idea-title').textContent = idea.title;
      document.getElementById('bbt-idea-desc').textContent = idea.desc;
    }
    document.getElementById('bbt-spark-btn').addEventListener('click', function () {
      var btn = this;
      var icon = document.getElementById('bbt-spark-icon');
      btn.classList.add('spinning');
      var next;
      do { next = Math.floor(Math.random() * IDEAS.length); } while (next === lastIdeaIdx);
      lastIdeaIdx = next;
      setTimeout(function () { showIdea(next); btn.classList.remove('spinning'); }, 300);
    });

    /* ── P&L Calculator ── */
    function calcPL() {
      var price = parseFloat(document.getElementById('bbt-price').value) || 0;
      var units = parseFloat(document.getElementById('bbt-units').value) || 0;
      var materials = parseFloat(document.getElementById('bbt-materials').value) || 0;
      var other = parseFloat(document.getElementById('bbt-other').value) || 0;
      var revenue = price * units;
      var costs = materials + other;
      var profit = revenue - costs;
      var fmt = function (n) { return 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); };
      document.getElementById('bbt-revenue-out').textContent = fmt(revenue);
      document.getElementById('bbt-costs-out').textContent = fmt(costs);
      var pEl = document.getElementById('bbt-profit-out');
      pEl.textContent = (profit < 0 ? '−R ' + Math.abs(profit).toLocaleString() : fmt(profit));
      pEl.className = 'bbt-result-value ' + (profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'break-even');
      var tip = document.getElementById('bbt-calc-tip');
      if (revenue === 0 && costs === 0) { tip.textContent = 'Fill in your numbers above to see your result.'; }
      else if (profit > 0) { tip.textContent = 'You\'re making a profit of ' + fmt(profit) + '/month. That\'s R' + Math.round(profit * 12).toLocaleString() + ' per year — now think about how to grow it.'; }
      else if (profit < 0) { tip.textContent = 'You\'re making a loss of ' + fmt(Math.abs(profit)) + '/month. Try increasing your price, selling more, or cutting costs.'; }
      else { tip.textContent = 'Break even — you\'re covering costs but making zero profit. Increase your price or volume to move into profit.'; }
    }
    ['bbt-price', 'bbt-units', 'bbt-materials', 'bbt-other'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', calcPL);
    });

    /* ── Role Matcher ── */
    var qIdx = 0;
    var scores = {};
    function initQuiz() {
      qIdx = 0; scores = {};
      document.getElementById('bbt-quiz-result').classList.remove('show');
      document.getElementById('bbt-quiz-wrap').style.display = '';
      renderQ();
    }
    function renderQ() {
      var q = QUIZ[qIdx];
      document.getElementById('bbt-quiz-q').textContent = q.q;
      document.getElementById('bbt-quiz-step').textContent = (qIdx + 1) + ' / ' + QUIZ.length;
      document.getElementById('bbt-quiz-progress').style.width = ((qIdx + 1) / QUIZ.length * 100) + '%';
      var optsEl = document.getElementById('bbt-quiz-opts');
      optsEl.innerHTML = '';
      q.opts.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.className = 'bbt-quiz-opt';
        btn.textContent = opt.text;
        btn.addEventListener('click', function () {
          optsEl.querySelectorAll('.bbt-quiz-opt').forEach(function (b) { b.disabled = true; });
          btn.classList.add('selected');
          Object.keys(opt.scores).forEach(function (k) { scores[k] = (scores[k] || 0) + opt.scores[k]; });
          setTimeout(function () {
            qIdx++;
            if (qIdx < QUIZ.length) { renderQ(); }
            else { showResult(); }
          }, 350);
        });
        optsEl.appendChild(btn);
      });
    }
    function showResult() {
      document.getElementById('bbt-quiz-wrap').style.display = 'none';
      var best = Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; })[0] || 'manager';
      var role = ROLES[best] || ROLES.manager;
      document.getElementById('bbt-role-emoji').textContent = role.emoji;
      document.getElementById('bbt-role-name').textContent = role.name;
      document.getElementById('bbt-role-desc').textContent = role.desc;
      document.getElementById('bbt-quiz-result').classList.add('show');
    }
    document.getElementById('bbt-retry').addEventListener('click', initQuiz);
    initQuiz();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
