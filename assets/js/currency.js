/* =========================================================
   BLASTBEAT — CURRENCY SWITCHER
   - Reads /assets/data/rates.json
   - Updates every [data-price-zar] element to chosen currency
   - Persists choice in localStorage (key: bb_currency)
   - Smart default from navigator.language on first visit
   - Fires `bb:currency-changed` event so calculators can react
   - Renders a <select> picker into [data-bb-currency-mount]
   No deps, ~110 lines.
   ========================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'bb_currency';
  var RATES_URL = '/assets/data/rates.json';
  var ratesCache = null;

  function pickDefault(rates) {
    // 1. localStorage win
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored && rates.currencies[stored]) return stored;
    // 2. navigator language map
    var lang = (navigator.language || 'en-US');
    var map = rates.default_locale_map || {};
    if (map[lang]) return map[lang];
    var langPrefix = lang.toLowerCase().split('-')[0];
    var match = Object.keys(map).find(function (k) {
      return k.toLowerCase().split('-')[0] === langPrefix;
    });
    if (match) return map[match];
    return rates.fallback || 'ZAR';
  }

  function format(zarAmount, currency, rates) {
    var c = rates.currencies[currency];
    if (!c) return zarAmount;
    var v = zarAmount * c.rate;
    var roundTo = c.round_to || 1;
    v = Math.round(v / roundTo) * roundTo;
    var s = v.toLocaleString('en-GB');
    return c.format.replace('{value}', s);
  }

  function applyToDOM(currency, rates) {
    var els = document.querySelectorAll('[data-price-zar]');
    els.forEach(function (el) {
      var zar = parseFloat(el.getAttribute('data-price-zar'));
      if (isNaN(zar)) return;
      // Optional override: data-price-format="prefix" or "K-suffix"
      var fmt = el.getAttribute('data-price-format');
      var out;
      if (fmt === 'k') {
        // e.g. R45K-style display
        var c = rates.currencies[currency];
        var v = zar * c.rate;
        if (v >= 1000) {
          out = c.symbol + Math.round(v / 1000) + 'K';
        } else {
          out = format(zar, currency, rates);
        }
      } else {
        out = format(zar, currency, rates);
      }
      el.textContent = out;
    });
    // Reveal a small "rates approximate" badge for non-ZAR
    document.querySelectorAll('[data-currency-note]').forEach(function (el) {
      if (currency === 'ZAR') {
        el.style.display = 'none';
      } else {
        el.style.display = '';
        el.textContent = 'Rates approximate · last updated ' + (rates.updated || 'recently') + ' · brand pricing, not live FX';
      }
    });
  }

  function fireChange(currency, rates) {
    document.dispatchEvent(new CustomEvent('bb:currency-changed', {
      detail: { currency: currency, rates: rates }
    }));
  }

  function setCurrency(currency, rates) {
    if (!rates.currencies[currency]) return;
    try { localStorage.setItem(STORAGE_KEY, currency); } catch (e) {}
    applyToDOM(currency, rates);
    // Sync any picker UIs
    document.querySelectorAll('[data-bb-currency-picker]').forEach(function (sel) {
      sel.value = currency;
      var label = sel.parentElement.querySelector('.bb-curr-label');
      if (label) label.textContent = currency;
    });
    fireChange(currency, rates);
  }

  function mountPicker(rates, currentCurrency) {
    var mounts = document.querySelectorAll('[data-bb-currency-mount]');
    mounts.forEach(function (mount) {
      if (mount.querySelector('.bb-curr-wrap')) return; // already mounted
      var wrap = document.createElement('div');
      wrap.className = 'bb-curr-wrap';
      var sel = document.createElement('select');
      sel.setAttribute('data-bb-currency-picker', '');
      sel.setAttribute('aria-label', 'Choose currency');
      Object.keys(rates.currencies).forEach(function (k) {
        var opt = document.createElement('option');
        opt.value = k;
        opt.textContent = rates.currencies[k].symbol + ' ' + k;
        if (k === currentCurrency) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', function (e) {
        setCurrency(e.target.value, rates);
      });
      wrap.appendChild(sel);
      mount.appendChild(wrap);
    });
  }

  function init(rates) {
    ratesCache = rates;
    var currency = pickDefault(rates);
    mountPicker(rates, currency);
    setCurrency(currency, rates);
  }

  // Expose a tiny global for calculators
  window.BBCurrency = {
    get: function () {
      try { return localStorage.getItem(STORAGE_KEY) || (ratesCache && pickDefault(ratesCache)) || 'ZAR'; }
      catch (e) { return 'ZAR'; }
    },
    rates: function () { return ratesCache; },
    format: function (zarAmount) {
      if (!ratesCache) return 'R ' + zarAmount;
      return format(zarAmount, this.get(), ratesCache);
    }
  };

  // Boot
  function boot() {
    fetch(RATES_URL).then(function (r) { return r.json(); }).then(init).catch(function (err) {
      console.warn('[bb-currency] failed to load rates, falling back to ZAR display:', err);
      // Failsafe: still mount a picker stub but only ZAR
      init({
        base: 'ZAR', updated: 'unknown', fallback: 'ZAR', default_locale_map: {},
        currencies: { ZAR: { name: 'Rand', symbol: 'R', rate: 1, format: 'R {value}', round_to: 1 } }
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
