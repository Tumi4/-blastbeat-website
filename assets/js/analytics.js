/*!
 * Blastbeat Analytics + Google Consent Mode v2
 *
 * REPLACE GTM_ID below with your real container before launch.
 * While GTM_ID === 'GTM-XXXXXXX' the file is a no-op (safe to deploy).
 *
 * Consent flow:
 *  1. Defaults set to denied on page load (Consent Mode v2 requirement).
 *  2. cookie-consent.js dispatches 'bb:consent' with detail.choice = 'accept' | 'reject'.
 *  3. We translate that to a gtag('consent','update', ...) call.
 *  4. GTM is loaded once we know the user's choice (or immediately if they already chose).
 *
 * Public API: window.bbTrack(eventName, params)
 */
(function () {
  'use strict';

  var GTM_ID = 'GTM-XXXXXXX'; // <-- REPLACE WITH REAL CONTAINER ID
  var STORAGE_KEY = 'bb-cookie-consent';

  // Consent Mode v2 defaults — must run before GTM
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });

  // Apply stored consent immediately if user has chosen before
  var stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
  if (stored === 'accepted' || stored === 'accepted-all') {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
  } else if (stored === 'rejected') {
    // Stays denied — explicit for clarity
    gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
  }

  // Listen for future consent changes
  window.addEventListener('bb:consent', function (e) {
    var choice = e && e.detail && e.detail.choice;
    // cookie-consent.js dispatches 'accepted' / 'rejected'
    if (choice === 'accepted' || choice === 'accept' || choice === 'accepted-all') {
      gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted'
      });
    } else if (choice === 'reject' || choice === 'rejected') {
      gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied'
      });
    }
  });

  // Lightweight tracking helper — works whether GTM is live or in stub mode
  window.bbTrack = function (eventName, params) {
    window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
  };

  // ---- Ambassador referral attribution ----
  // /r/<slug> lands with ?ref=<slug>. Persist it (30 days) and stamp it into
  // any form that carries an input[name="referral"], so a sponsor enquiry or
  // demo signup that started from an ambassador's link reaches the ledger
  // with their name on it.
  var REF_KEY = 'bb-ref';
  try {
    var refMatch = window.location.search.match(/[?&]ref=([A-Za-z0-9_-]{1,64})/);
    if (refMatch) {
      localStorage.setItem(REF_KEY, JSON.stringify({ ref: refMatch[1], at: Date.now() }));
      window.bbTrack('referral_visit', { ref: refMatch[1] });
    }
    var stored_ref = null;
    try { stored_ref = JSON.parse(localStorage.getItem(REF_KEY) || 'null'); } catch (e2) {}
    if (stored_ref && Date.now() - stored_ref.at < 30 * 24 * 3600 * 1000) {
      var stampRef = function () {
        var fields = document.querySelectorAll('input[name="referral"]');
        for (var i = 0; i < fields.length; i++) { if (!fields[i].value) fields[i].value = stored_ref.ref; }
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', stampRef);
      else stampRef();
    }
  } catch (e) { /* storage blocked — attribution simply doesn't persist */ }

  // GTM loader — gated on having a real container ID
  if (GTM_ID && GTM_ID !== 'GTM-XXXXXXX') {
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l !== 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', GTM_ID);
  } else if (window.console && window.console.info) {
    window.console.info('[Blastbeat] Analytics in stub mode — set GTM_ID in /assets/js/analytics.js to enable.');
  }
})();
