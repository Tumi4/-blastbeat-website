/* ============================================================
   BLASTBEAT — Magic Cursor
   A soft glowing orb that follows the pointer with a subtle
   particle trail. Brand-tinted, lerped for smoothness, expands
   on interactive elements, and disables on touch / reduced-motion.
   ============================================================ */

(function () {
  'use strict';

  // Bail out early on touch devices, reduced-motion, or very small viewports
  const isTouch = window.matchMedia('(hover: none)').matches || 'ontouchstart' in window;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isTouch || prefersReducedMotion) return;

  // Don't draw twice if a previous instance is already running
  if (window.__bbMagicCursorMounted) return;
  window.__bbMagicCursorMounted = true;

  const COLORS = [
    'rgba(99,102,241,0.85)',   // electric purple
    'rgba(0,245,255,0.75)',    // neon cyan
    'rgba(255,107,53,0.80)',   // sunset orange
    'rgba(184,255,0,0.70)',    // neon lime
    'rgba(255,45,120,0.78)'    // neon pink
  ];

  // ----- Build DOM ------------------------------------------------------
  const root = document.createElement('div');
  root.id = 'bb-magic-cursor';
  root.setAttribute('aria-hidden', 'true');

  const dot = document.createElement('div');
  dot.className = 'bb-cursor-dot';

  const ring = document.createElement('div');
  ring.className = 'bb-cursor-ring';

  root.appendChild(ring);
  root.appendChild(dot);
  document.body.appendChild(root);

  // ----- Trail canvas ---------------------------------------------------
  const canvas = document.createElement('canvas');
  canvas.id = 'bb-cursor-trail';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // ----- State ----------------------------------------------------------
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ringPos = { x: pointer.x, y: pointer.y };
  const dotPos = { x: pointer.x, y: pointer.y };
  const particles = [];
  let lastEmit = 0;
  let moving = false;
  let movingTimer = 0;
  let hoveringInteractive = false;
  let clickPulse = 0;

  // ----- Pointer wiring -------------------------------------------------
  document.addEventListener('mousemove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    moving = true;
    clearTimeout(movingTimer);
    movingTimer = setTimeout(() => (moving = false), 80);
  }, { passive: true });

  document.addEventListener('mousedown', () => { clickPulse = 1; });
  document.addEventListener('mouseleave', () => { root.classList.add('bb-cursor-hidden'); });
  document.addEventListener('mouseenter', () => { root.classList.remove('bb-cursor-hidden'); });

  // Interactive hover state — covers links, buttons, form controls,
  // [data-cursor="magnet"] opt-ins, and anything role=button
  const HOVER_SELECTOR = 'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor="magnet"]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest && e.target.closest(HOVER_SELECTOR)) {
      hoveringInteractive = true;
      root.classList.add('bb-cursor-hover');
    }
  }, { passive: true });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest(HOVER_SELECTOR)) {
      hoveringInteractive = false;
      root.classList.remove('bb-cursor-hover');
    }
  }, { passive: true });

  // ----- Animation loop -------------------------------------------------
  function spawnParticle() {
    if (!moving) return;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.4 + Math.random() * 0.8;
    particles.push({
      x: pointer.x + (Math.random() - 0.5) * 4,
      y: pointer.y + (Math.random() - 0.5) * 4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.15,
      life: 1,
      decay: 0.012 + Math.random() * 0.012,
      size: 2 + Math.random() * 3,
      color: COLORS[(Math.random() * COLORS.length) | 0]
    });
    if (particles.length > 120) particles.shift();
  }

  function frame(t) {
    // Smooth follow with lerp
    const dotLerp = 0.32;
    const ringLerp = 0.14;
    dotPos.x += (pointer.x - dotPos.x) * dotLerp;
    dotPos.y += (pointer.y - dotPos.y) * dotLerp;
    ringPos.x += (pointer.x - ringPos.x) * ringLerp;
    ringPos.y += (pointer.y - ringPos.y) * ringLerp;

    const ringScale = hoveringInteractive ? 1.9 : (clickPulse > 0 ? 0.7 : 1);
    const dotScale = hoveringInteractive ? 0.35 : 1;
    dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%, -50%) scale(${dotScale})`;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%) scale(${ringScale})`;

    if (clickPulse > 0) clickPulse = Math.max(0, clickPulse - 0.08);

    // Spawn trail at fixed rate
    if (t - lastEmit > 16) {
      spawnParticle();
      lastEmit = t;
    }

    // Draw particles
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 14;
      ctx.shadowColor = p.color;
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
