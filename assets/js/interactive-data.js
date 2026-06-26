/* =========================================================
   BLASTBEAT — INTERACTIVE DATA MODULE
   Adds life to existing static viz across the site:
     • Count-up animations on .stat .num and .counter-number
     • Progressive bar-fill animation on .bar-chart .bar-fill
     • Hover tooltips with source citations on bar rows
     • Source popover on stat blocks
     • Toggle support for .stat-strip[data-toggle] (e.g., 2024 ↔ 2026)
   Pure vanilla JS, no dependencies. Loaded after document.
   ========================================================= */
(function () {
  'use strict';

  /* ----- 1. COUNT-UP ANIMATIONS ----- */
  function animateCount(el, target, duration) {
    if (el.dataset.counted === 'true') return;
    el.dataset.counted = 'true';
    var startVal = 0;
    var startTime = null;
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var raw = String(el.textContent).trim();
    // Detect formatting: keep the original textContent if we hit issues
    function format(n) {
      if (decimals > 0) return prefix + n.toFixed(decimals) + suffix;
      // For >= 1000, format with thousand separators
      if (target >= 1000) return prefix + Math.round(n).toLocaleString('en-GB') + suffix;
      return prefix + Math.round(n) + suffix;
    }
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      var value = startVal + (target - startVal) * eased;
      el.textContent = format(value);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = el.dataset.original || raw; // restore original formatting
    }
    el.dataset.original = raw;
    requestAnimationFrame(step);
  }

  /* ----- 2. BAR-FILL PROGRESSIVE REVEAL ----- */
  function animateBars(chart) {
    if (chart.dataset.animated === 'true') return;
    chart.dataset.animated = 'true';
    var fills = chart.querySelectorAll('.bar-fill');
    fills.forEach(function (fill, i) {
      var target = fill.style.width;
      fill.style.width = '0%';
      fill.style.transition = 'width 1.0s cubic-bezier(0.22,0.61,0.36,1)';
      setTimeout(function () { fill.style.width = target; }, 120 + i * 80);
    });
  }

  /* ----- 3. HOVER TOOLTIPS ON BAR ROWS ----- */
  function attachBarTooltips(chart) {
    var rows = chart.querySelectorAll('.bar-row');
    rows.forEach(function (row) {
      var srcAttr = row.getAttribute('data-source');
      if (!srcAttr) return;
      var tip = document.createElement('span');
      tip.className = 'bb-tip';
      tip.textContent = srcAttr;
      row.style.position = 'relative';
      row.appendChild(tip);
    });
  }

  /* ----- 4. STAT-STRIP TOGGLE (2024 ↔ 2026) ----- */
  function wireStatToggle(strip) {
    if (!strip.dataset.toggle) return;
    var keys = strip.dataset.toggle.split('|'); // e.g. "2024|2026"
    if (keys.length !== 2) return;
    // Inject toggle UI
    var toggleEl = document.createElement('div');
    toggleEl.className = 'bb-toggle';
    toggleEl.innerHTML =
      '<button data-key="' + keys[0] + '" class="active">' + keys[0] + '</button>' +
      '<button data-key="' + keys[1] + '">' + keys[1] + '</button>';
    strip.parentNode.insertBefore(toggleEl, strip);

    var stats = strip.querySelectorAll('.stat');
    function applyKey(key) {
      stats.forEach(function (s) {
        var num = s.querySelector('.num');
        var val = s.getAttribute('data-' + key);
        if (val && num) num.textContent = val;
      });
    }
    toggleEl.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      toggleEl.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      applyKey(btn.dataset.key);
    });
  }

  /* ----- 5. INTERSECTION OBSERVER — TRIGGER ON SCROLL ----- */
  function setupObserver() {
    if (typeof IntersectionObserver === 'undefined') return null;
    return new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.classList.contains('bar-chart')) {
          animateBars(el);
        } else if (el.matches('.num, .counter-number')) {
          var raw = el.textContent.replace(/[^0-9.]/g, '');
          var target = parseFloat(raw);
          if (!isNaN(target) && target > 0) {
            animateCount(el, target, 1400);
          }
        }
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -50px 0px' });
  }

  /* ----- 6. SPARKLINE WIDGET (data-spark="x,y,z,…") ----- */
  function renderSpark(el) {
    var pts = el.dataset.spark.split(',').map(function (n) { return parseFloat(n); });
    if (pts.length < 2) return;
    var max = Math.max.apply(null, pts), min = Math.min.apply(null, pts);
    var w = 80, h = 22, pad = 2;
    var pathPoints = pts.map(function (p, i) {
      var x = pad + (i / (pts.length - 1)) * (w - pad * 2);
      var y = h - pad - ((p - min) / (max - min || 1)) * (h - pad * 2);
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
    el.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true">' +
      '<path d="' + pathPoints + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /* ----- BOOT ----- */
  function init() {
    // Inject minimal CSS for the new behaviors (scoped to data-driven elements)
    var css = document.createElement('style');
    css.textContent =
      '.bb-tip{position:absolute;left:0;bottom:calc(100% + 6px);padding:6px 10px;font-family:"IBM Plex Mono",monospace;font-size:0.7rem;background:#0F0F1A;border:1px solid rgba(0,245,255,0.3);border-radius:6px;color:rgba(255,255,255,0.85);white-space:nowrap;opacity:0;pointer-events:none;transform:translateY(4px);transition:opacity .2s,transform .2s;z-index:5;max-width:340px;white-space:normal;}' +
      '.bar-row:hover .bb-tip{opacity:1;transform:translateY(0);}' +
      '.bb-toggle{display:inline-flex;gap:4px;padding:4px;margin:0 0 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:100px;}' +
      '.bb-toggle button{padding:6px 14px;border:none;background:transparent;color:rgba(255,255,255,0.6);font-family:"IBM Plex Mono",monospace;font-size:0.7rem;letter-spacing:0.06em;border-radius:100px;cursor:pointer;transition:all .2s;}' +
      '.bb-toggle button.active{background:linear-gradient(135deg,#B8FF00,#00F5FF);color:#0F0F1A;font-weight:700;}' +
      '.bb-toggle button:hover:not(.active){color:white;}' +
      '.bb-spark{display:inline-block;color:var(--neon-cyan,#00F5FF);vertical-align:middle;margin-left:6px;}';
    document.head.appendChild(css);

    var io = setupObserver();

    // Bar charts
    document.querySelectorAll('.bar-chart').forEach(function (chart) {
      attachBarTooltips(chart);
      if (io) io.observe(chart);
      else animateBars(chart);
    });

    // Stat numbers (.stat .num, .counter-number)
    document.querySelectorAll('.stat .num, .counter-number').forEach(function (el) {
      if (io) io.observe(el);
    });

    // Stat-strip toggles
    document.querySelectorAll('.stat-strip[data-toggle]').forEach(wireStatToggle);

    // Sparklines
    document.querySelectorAll('[data-spark]').forEach(renderSpark);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
