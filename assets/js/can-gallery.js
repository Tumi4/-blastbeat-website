/* ============================================================
   <can-gallery> — reusable video gallery web component
   Cinema-house styling: framed thumbnails, theatrical hover,
   letterboxed lightbox. Reads /can-videos.json (cached) and
   renders a filterable grid. Iframes only load on click (facade).

   Usage:
     <can-gallery data-theme="Climate Action" data-limit="6"></can-gallery>
     <can-gallery data-featured="true" data-layout="featured"></can-gallery>
     <can-gallery data-category="Uganda & Community" data-layout="carousel"></can-gallery>

   Attributes:
     data-theme       Filter to a single theme
     data-category    Filter to a single category
     data-search      Substring match on title + blurb
     data-featured    "true" → show only featured items
     data-limit       Cap to N items
     data-layout      "grid" (default) | "carousel" | "featured"
     data-hide-blurb  "true" → compact title-only cards
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

  /* ---- Shared cinema styles, injected once ---- */
  var STYLE_ID = 'can-gallery-styles';
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = ''
      /* ===== layouts ===== */
      + '.cg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:2rem;justify-content:center;max-width:1200px;margin:0 auto}'
      + '.cg-featured{display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:2.5rem;justify-content:center;max-width:1200px;margin:0 auto}'
      + '.cg-featured .cg-card{max-width:560px;margin:0 auto;width:100%}'
      + '.cg-carousel{display:flex;gap:1.5rem;overflow-x:auto;scroll-snap-type:x mandatory;padding:0.5rem 0 1.5rem;scrollbar-width:thin;justify-content:flex-start}'
      + '.cg-carousel .cg-card{flex:0 0 340px;scroll-snap-align:start}'
      + '@media (max-width:600px){.cg-grid{grid-template-columns:1fr;gap:1.5rem}.cg-featured{grid-template-columns:1fr;gap:1.5rem}.cg-carousel .cg-card{flex-basis:280px}}'
      /* ===== the card — movie-poster frame ===== */
      + '.cg-card{position:relative;background:#0A0A0E;border:1px solid rgba(232,195,107,0.18);border-radius:8px;overflow:hidden;cursor:pointer;transition:transform .35s cubic-bezier(0.34,1.56,0.64,1),border-color .3s ease,box-shadow .35s ease;display:flex;flex-direction:column;text-align:left;font-family:inherit;color:inherit;width:100%;padding:0;box-shadow:0 14px 40px -10px rgba(0,0,0,0.6),0 0 0 1px rgba(232,195,107,0.05)}'
      + '.cg-card::before{content:"";position:absolute;inset:0;border-radius:8px;border:1px solid rgba(255,255,255,0.04);pointer-events:none;z-index:3}'
      + '.cg-card:hover{transform:translateY(-6px);border-color:rgba(232,195,107,0.55);box-shadow:0 28px 60px -10px rgba(0,0,0,0.75),0 0 50px -10px rgba(232,195,107,0.35),0 0 0 1px rgba(232,195,107,0.25)}'
      + '.cg-card:focus-visible{outline:3px solid #E8C36B;outline-offset:4px}'
      /* ===== thumb with letterbox + spotlight ===== */
      + '.cg-thumb{position:relative;aspect-ratio:16/9;background:#000;overflow:hidden}'
      + '.cg-thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease,filter .35s ease}'
      + '.cg-card:hover .cg-thumb img{transform:scale(1.04);filter:brightness(1.05) contrast(1.05)}'
      /* spotlight veil */
      + '.cg-thumb::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,0.45) 100%),linear-gradient(180deg,transparent 50%,rgba(0,0,0,0.65) 100%);pointer-events:none;transition:background .35s ease}'
      + '.cg-card:hover .cg-thumb::after{background:radial-gradient(ellipse at center,rgba(232,195,107,0.10) 20%,transparent 60%,rgba(0,0,0,0.65) 100%),linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.7) 100%)}'
      /* play button */
      + '.cg-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2}'
      + '.cg-play svg{width:78px;height:78px;filter:drop-shadow(0 6px 20px rgba(0,0,0,0.8)) drop-shadow(0 0 30px rgba(232,195,107,0.25));transition:transform .35s cubic-bezier(0.34,1.56,0.64,1)}'
      + '.cg-card:hover .cg-play svg{transform:scale(1.12);filter:drop-shadow(0 8px 24px rgba(0,0,0,0.9)) drop-shadow(0 0 40px rgba(232,195,107,0.55))}'
      + '.cg-featured .cg-play svg{width:96px;height:96px}'
      /* tag like a film-classification badge */
      + '.cg-tag{position:absolute;top:14px;left:14px;display:inline-flex;align-items:center;gap:0.3rem;font-family:"IBM Plex Mono","Space Grotesk",monospace;font-size:0.6rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:5px 12px;border-radius:3px;background:rgba(0,0,0,0.7);color:#E8C36B;border:1px solid rgba(232,195,107,0.45);backdrop-filter:blur(6px);z-index:2}'
      + '.cg-tag.featured{color:#1a1206;background:linear-gradient(135deg,#E8C36B,#C9A24B);border-color:#E8C36B;font-weight:800}'
      /* runtime ticker (decorative — "Now Playing" feel) */
      + '.cg-runtime{position:absolute;bottom:14px;right:14px;font-family:"IBM Plex Mono",monospace;font-size:0.62rem;letter-spacing:0.1em;color:rgba(255,255,255,0.85);background:rgba(0,0,0,0.7);padding:3px 8px;border-radius:3px;border:1px solid rgba(255,255,255,0.15);backdrop-filter:blur(4px);z-index:2}'
      /* body — marquee strip under the poster */
      + '.cg-body{padding:1.1rem 1.25rem 1.4rem;display:flex;flex-direction:column;gap:0.5rem;flex:1;background:linear-gradient(180deg,#0A0A0E 0%,#15110A 100%);border-top:1px solid rgba(232,195,107,0.15);position:relative}'
      + '.cg-featured .cg-body{padding:1.4rem 1.6rem 1.6rem}'
      + '.cg-title{font-family:"Space Grotesk","DM Sans",sans-serif;font-weight:700;font-size:1.05rem;line-height:1.3;color:#F4ECD8;margin:0;letter-spacing:-0.005em}'
      + '.cg-featured .cg-title{font-size:1.3rem;font-weight:800}'
      + '.cg-blurb{font-size:0.82rem;line-height:1.55;color:rgba(244,236,216,0.7);margin:0}'
      + '.cg-featured .cg-blurb{font-size:0.92rem;line-height:1.65}'
      + '.cg-cat{font-family:"IBM Plex Mono","Space Grotesk",monospace;font-size:0.58rem;letter-spacing:0.18em;text-transform:uppercase;color:#E8C36B;margin-top:auto;opacity:0.85}'
      + '.cg-empty{padding:3rem 2rem;text-align:center;color:rgba(244,236,216,0.5);font-style:italic;font-family:"Space Grotesk",sans-serif}'
      /* ===== Lightbox — cinema screen ===== */
      + '#cg-lightbox{position:fixed;inset:0;z-index:9995;background:#000;display:none;align-items:center;justify-content:center;padding:0;animation:cg-fade .35s ease}'
      + '#cg-lightbox::before,#cg-lightbox::after{content:"";position:absolute;left:0;right:0;height:60px;background:linear-gradient(180deg,#000,transparent);z-index:2;pointer-events:none}'
      + '#cg-lightbox::before{top:0}'
      + '#cg-lightbox::after{bottom:0;background:linear-gradient(0deg,#000,transparent)}'
      + '#cg-lightbox.open{display:flex}'
      + '@keyframes cg-fade{from{opacity:0}to{opacity:1}}'
      + '@keyframes cg-screen-in{from{transform:scale(0.96);opacity:0}to{transform:scale(1);opacity:1}}'
      + '.cg-lb-inner{width:100%;max-width:1280px;display:flex;flex-direction:column;gap:1.25rem;padding:2rem 1.5rem;animation:cg-screen-in .45s cubic-bezier(0.34,1.2,0.64,1)}'
      + '.cg-lb-frame{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:6px;overflow:hidden;border:1px solid rgba(232,195,107,0.25);box-shadow:0 0 0 1px rgba(255,255,255,0.04),0 30px 80px rgba(0,0,0,0.7),0 0 100px rgba(232,195,107,0.18)}'
      + '.cg-lb-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}'
      + '.cg-lb-meta{color:rgba(244,236,216,0.92);font-family:"DM Sans",sans-serif;display:flex;justify-content:space-between;gap:1.5rem;align-items:flex-end;flex-wrap:wrap}'
      + '.cg-lb-meta-l{flex:1;min-width:240px}'
      + '.cg-lb-meta h3{font-family:"Space Grotesk",sans-serif;font-weight:800;font-size:1.4rem;margin:0 0 0.4rem;color:#F4ECD8;letter-spacing:-0.01em}'
      + '.cg-lb-meta p{font-size:0.9rem;color:rgba(244,236,216,0.72);margin:0;line-height:1.55;max-width:760px}'
      + '.cg-lb-stamp{font-family:"IBM Plex Mono",monospace;font-size:0.62rem;letter-spacing:0.18em;text-transform:uppercase;color:#E8C36B;padding:6px 14px;border:1px solid rgba(232,195,107,0.4);border-radius:3px;white-space:nowrap}'
      + '.cg-lb-close{position:fixed;top:1.5rem;right:1.5rem;width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(232,195,107,0.35);color:#E8C36B;cursor:pointer;font-size:1.6rem;display:flex;align-items:center;justify-content:center;line-height:1;transition:all .25s;z-index:3;backdrop-filter:blur(8px)}'
      + '.cg-lb-close:hover{background:rgba(232,195,107,0.2);color:#fff;transform:rotate(90deg)}'
      + '.cg-lb-close:focus-visible{outline:2px solid #E8C36B;outline-offset:3px}'
      + '@media (max-width:640px){.cg-lb-inner{padding:1.25rem 1rem}.cg-lb-meta h3{font-size:1.15rem}.cg-lb-close{top:1rem;right:1rem;width:42px;height:42px}}'
      ;
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
        '<div class="cg-lb-meta">' +
          '<div class="cg-lb-meta-l"><h3 id="cg-lb-title"></h3><p id="cg-lb-blurb"></p></div>' +
          '<span class="cg-lb-stamp" id="cg-lb-stamp">CAN Music</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(lb);
    lb.querySelector('.cg-lb-close').addEventListener('click', closeLightbox);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('open')) closeLightbox();
      if (e.key === 'Tab' && lb.classList.contains('open')) {
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
    lb.querySelector('#cg-lb-stamp').textContent = video.category || 'CAN Music';
    var frame = lb.querySelector('.cg-lb-frame');
    frame.innerHTML = '<iframe src="' + video.url + '?autoplay=1&rel=0&modestbranding=1" title="' + escapeHtml(video.title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { lb.querySelector('.cg-lb-close').focus(); }, 20);
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('open');
    lb.querySelector('.cg-lb-frame').innerHTML = '';
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
      var layoutAttr = el.getAttribute('data-layout') || 'grid';
      var layoutClass = layoutAttr === 'carousel' ? 'cg-carousel'
                     : layoutAttr === 'featured' ? 'cg-featured'
                     : 'cg-grid';
      var hideBlurb = el.getAttribute('data-hide-blurb') === 'true';

      // Multi-category and multi-theme — pipe-separated (because some category
      // names already contain commas, e.g. "Surf, Skate & Eco").
      var categoriesAttr = el.getAttribute('data-categories');
      var themesAttr = el.getAttribute('data-themes');
      var categories = categoriesAttr ? categoriesAttr.split('|').map(function(s){return s.trim();}).filter(Boolean) : null;
      var themes = themesAttr ? themesAttr.split('|').map(function(s){return s.trim();}).filter(Boolean) : null;

      el.innerHTML = '<div class="cg-empty">Loading videos&hellip;</div>';

      loadData().then(function (data) {
        var items = (data.videos || []).filter(function (v) {
          if (featured && !v.featured) return false;
          if (theme && (!v.themes || v.themes.indexOf(theme) === -1)) return false;
          if (category && v.category !== category) return false;
          if (themes && themes.length) {
            if (!v.themes || !themes.some(function (t) { return v.themes.indexOf(t) !== -1; })) return false;
          }
          if (categories && categories.length) {
            if (categories.indexOf(v.category) === -1) return false;
          }
          if (search) {
            var hay = ((v.title || '') + ' ' + (v.blurb || '')).toLowerCase();
            if (hay.indexOf(search) === -1) return false;
          }
          return true;
        });
        if (limit && !isNaN(limit)) items = items.slice(0, limit);

        if (!items.length) { el.innerHTML = '<div class="cg-empty">No videos match this filter yet.</div>'; return; }

        var wrap = document.createElement('div');
        wrap.className = layoutClass;
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
        (v.featured ? '<span class="cg-tag featured">&#9733; Featured</span>' : '<span class="cg-tag">' + escapeHtml(v.category || '') + '</span>') +
        '<span class="cg-runtime">&#9658; HD</span>' +
        '<img src="' + v.thumbnail + '" alt="" loading="lazy" decoding="async">' +
        '<span class="cg-play" aria-hidden="true">' +
          '<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="40" cy="40" r="38" fill="rgba(0,0,0,0.55)" stroke="rgba(232,195,107,0.85)" stroke-width="1.5"/>' +
            '<circle cx="40" cy="40" r="32" fill="none" stroke="rgba(244,236,216,0.4)" stroke-width="0.5"/>' +
            '<path d="M33 26 L58 40 L33 54 Z" fill="#F4ECD8"/>' +
          '</svg>' +
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
  window.CanGallery = { load: loadData, open: openLightbox };
})();
