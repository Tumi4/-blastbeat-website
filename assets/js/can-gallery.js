/* ============================================================
   <can-gallery> — reusable video gallery web component
   Reads /can-videos.json (cached across instances) and renders a
   filterable grid of YouTube-thumbnail cards. Iframes only load on
   click (facade pattern) into an accessible lightbox.

   Usage:
     <can-gallery data-theme="Climate Action" data-limit="6" data-layout="grid"></can-gallery>
     <can-gallery data-featured="true"></can-gallery>
     <can-gallery data-category="Uganda & Community" data-layout="carousel"></can-gallery>

   Attributes (all optional):
     data-theme       Filter to a single theme (e.g. "Climate Action")
     data-category    Filter to a single category (e.g. "Music & CAN Music")
     data-search      Substring match on title + blurb (case-insensitive)
     data-featured    "true" → show only featured items
     data-limit       Cap to N items
     data-layout      "grid" (default) | "carousel"
     data-hide-blurb  "true" → render compact cards (title only)
   ============================================================ */

(function () {
  'use strict';
  if (window.__canGalleryRegistered) return;
  window.__canGalleryRegistered = true;

  var DATA_URL = '/can-videos.json';
  var dataPromise = null;

  function loadData() {
    if (!dataPromise) {
      dataPromise = fetch(DATA_URL, { credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) throw new Error('fetch ' + r.status); return r.json(); })
        .catch(function (err) { console.warn('[can-gallery] data load failed:', err); dataPromise = null; return { videos: [] }; });
    }
    return dataPromise;
  }

  /* ---- Shared styles, injected once ---- */
  var STYLE_ID = 'can-gallery-styles';
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = ''
      + '.cg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.25rem}'
      + '.cg-carousel{display:flex;gap:1rem;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:0.75rem;scrollbar-width:thin}'
      + '.cg-carousel .cg-card{flex:0 0 280px;scroll-snap-align:start}'
      + '.cg-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:18px;overflow:hidden;cursor:pointer;transition:transform .25s ease,border-color .25s ease,box-shadow .3s ease;display:flex;flex-direction:column;text-align:left;font-family:inherit;color:inherit;width:100%;padding:0;position:relative}'
      + '.cg-card:hover{transform:translateY(-4px);border-color:rgba(52,211,153,0.45);box-shadow:0 20px 40px -10px rgba(0,0,0,0.4)}'
      + '.cg-card:focus-visible{outline:3px solid #00F5FF;outline-offset:3px}'
      + '.cg-thumb{position:relative;aspect-ratio:16/9;background:#0a0e1a}'
      + '.cg-thumb img{width:100%;height:100%;object-fit:cover;display:block}'
      + '.cg-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,rgba(0,0,0,0.0),rgba(0,0,0,0.55));transition:background .25s}'
      + '.cg-card:hover .cg-play{background:linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0.7))}'
      + '.cg-play svg{width:64px;height:64px;filter:drop-shadow(0 4px 14px rgba(0,0,0,0.5));transition:transform .25s}'
      + '.cg-card:hover .cg-play svg{transform:scale(1.08)}'
      + '.cg-tag{position:absolute;top:12px;left:12px;display:inline-block;font-size:0.62rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,0.6);color:#34D399;border:1px solid rgba(52,211,153,0.4);backdrop-filter:blur(4px)}'
      + '.cg-tag.featured{color:#FFE08A;border-color:rgba(255,224,138,0.45);background:rgba(40,28,0,0.7)}'
      + '.cg-body{padding:1rem 1.1rem 1.2rem;display:flex;flex-direction:column;gap:0.45rem;flex:1}'
      + '.cg-title{font-family:"Space Grotesk","DM Sans",sans-serif;font-weight:700;font-size:0.95rem;line-height:1.35;color:#fff;margin:0}'
      + '.cg-blurb{font-size:0.78rem;line-height:1.5;color:rgba(255,255,255,0.7);margin:0}'
      + '.cg-cat{font-family:"IBM Plex Mono","Space Grotesk",monospace;font-size:0.6rem;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-top:auto}'
      + '.cg-empty{padding:2rem;text-align:center;color:rgba(255,255,255,0.6);font-style:italic}'
      /* Lightbox */
      + '#cg-lightbox{position:fixed;inset:0;z-index:9995;background:rgba(8,9,16,0.92);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;padding:1.5rem;animation:cg-fade .25s ease}'
      + '#cg-lightbox.open{display:flex}'
      + '@keyframes cg-fade{from{opacity:0}to{opacity:1}}'
      + '.cg-lb-inner{width:100%;max-width:1080px;display:flex;flex-direction:column;gap:1rem}'
      + '.cg-lb-frame{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)}'
      + '.cg-lb-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}'
      + '.cg-lb-meta{color:rgba(255,255,255,0.85);font-family:"DM Sans",sans-serif}'
      + '.cg-lb-meta h3{font-family:"Space Grotesk",sans-serif;font-weight:800;font-size:1.15rem;margin:0 0 0.3rem}'
      + '.cg-lb-meta p{font-size:0.85rem;color:rgba(255,255,255,0.7);margin:0;line-height:1.55}'
      + '.cg-lb-close{position:absolute;top:1rem;right:1rem;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);color:#fff;cursor:pointer;font-size:1.5rem;display:flex;align-items:center;justify-content:center;line-height:1;transition:background .2s}'
      + '.cg-lb-close:hover{background:rgba(255,255,255,0.2)}'
      + '.cg-lb-close:focus-visible{outline:2px solid #00F5FF;outline-offset:2px}';
    document.head.appendChild(s);
  }

  /* ---- Lightbox (single instance, reused) ---- */
  var lb = null;
  var lastFocus = null;
  function ensureLightbox() {
    if (lb) return lb;
    lb = document.createElement('div');
    lb.id = 'cg-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-labelledby', 'cg-lb-title');
    lb.innerHTML =
      '<button class="cg-lb-close" aria-label="Close video">&times;</button>' +
      '<div class="cg-lb-inner">' +
        '<div class="cg-lb-frame"></div>' +
        '<div class="cg-lb-meta"><h3 id="cg-lb-title"></h3><p id="cg-lb-blurb"></p></div>' +
      '</div>';
    document.body.appendChild(lb);
    lb.querySelector('.cg-lb-close').addEventListener('click', closeLightbox);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('open')) closeLightbox();
      if (e.key === 'Tab' && lb.classList.contains('open')) {
        // Simple focus trap — only one focusable inside, keep it on the close button
        e.preventDefault();
        lb.querySelector('.cg-lb-close').focus();
      }
    });
    return lb;
  }

  function openLightbox(video) {
    ensureLightbox();
    lastFocus = document.activeElement;
    lb.querySelector('#cg-lb-title').textContent = video.title;
    lb.querySelector('#cg-lb-blurb').textContent = video.blurb || '';
    var frame = lb.querySelector('.cg-lb-frame');
    frame.innerHTML = '<iframe src="' + video.url + '?autoplay=1&rel=0&modestbranding=1" title="' + escapeHtml(video.title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { lb.querySelector('.cg-lb-close').focus(); }, 20);
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('open');
    lb.querySelector('.cg-lb-frame').innerHTML = ''; // stop the video
    document.body.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]); });
  }

  /* ---- The web component ---- */
  class CanGallery extends HTMLElement {
    connectedCallback() {
      injectStyles();
      this.render();
    }
    render() {
      var el = this;
      var theme = el.getAttribute('data-theme');
      var category = el.getAttribute('data-category');
      var search = (el.getAttribute('data-search') || '').toLowerCase();
      var featured = el.getAttribute('data-featured') === 'true';
      var limit = parseInt(el.getAttribute('data-limit'), 10);
      var layout = el.getAttribute('data-layout') === 'carousel' ? 'carousel' : 'grid';
      var hideBlurb = el.getAttribute('data-hide-blurb') === 'true';

      el.innerHTML = '<div class="cg-empty">Loading videos&hellip;</div>';

      loadData().then(function (data) {
        var items = (data.videos || []).filter(function (v) {
          if (featured && !v.featured) return false;
          if (theme && (!v.themes || v.themes.indexOf(theme) === -1)) return false;
          if (category && v.category !== category) return false;
          if (search) {
            var hay = ((v.title || '') + ' ' + (v.blurb || '')).toLowerCase();
            if (hay.indexOf(search) === -1) return false;
          }
          return true;
        });
        if (limit && !isNaN(limit)) items = items.slice(0, limit);

        if (!items.length) { el.innerHTML = '<div class="cg-empty">No videos match this filter yet.</div>'; return; }

        var wrap = document.createElement('div');
        wrap.className = layout === 'carousel' ? 'cg-carousel' : 'cg-grid';
        items.forEach(function (v) { wrap.appendChild(buildCard(v, hideBlurb)); });
        el.innerHTML = '';
        el.appendChild(wrap);
      });
    }
  }

  function buildCard(v, hideBlurb) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'cg-card';
    card.setAttribute('aria-label', 'Play video: ' + v.title);

    var blurbHtml = hideBlurb ? '' : '<p class="cg-blurb">' + escapeHtml(v.blurb || '') + '</p>';

    card.innerHTML =
      '<div class="cg-thumb">' +
        (v.featured ? '<span class="cg-tag featured">Featured</span>' : '<span class="cg-tag">' + escapeHtml(v.category || '') + '</span>') +
        '<img src="' + v.thumbnail + '" alt="" loading="lazy" decoding="async">' +
        '<span class="cg-play" aria-hidden="true">' +
          '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.85)" stroke-width="2"/><path d="M26 21 L46 32 L26 43 Z" fill="#fff"/></svg>' +
        '</span>' +
      '</div>' +
      '<div class="cg-body">' +
        '<h3 class="cg-title">' + escapeHtml(v.title) + '</h3>' +
        blurbHtml +
        '<div class="cg-cat">' + escapeHtml(v.category || '') + '</div>' +
      '</div>';

    card.addEventListener('click', function () { openLightbox(v); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(v); }
    });
    return card;
  }

  customElements.define('can-gallery', CanGallery);

  // expose for the hub page filter bar
  window.CanGallery = { load: loadData, open: openLightbox };
})();
