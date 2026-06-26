/* Blastbeat Cookie Consent — GDPR / POPIA / UK GDPR compliant */
(function () {
  var STORAGE_KEY = 'bb-cookie-consent';
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
  } catch (e) { /* private mode */ }

  function fireConsent(choice) {
    try { localStorage.setItem(STORAGE_KEY, choice); } catch (e) {}
    window.dispatchEvent(new CustomEvent('bb:consent', { detail: { choice: choice } }));
  }

  var banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">' +
      '<p style="margin:0;font-size:0.875rem;color:rgba(255,255,255,0.85);flex:1;min-width:200px;line-height:1.5;">' +
        '&#127850; We use cookies to measure traffic and improve your experience. Analytics &amp; ad cookies are off until you accept.' +
      '</p>' +
      '<div style="display:flex;gap:0.6rem;align-items:center;flex-shrink:0;flex-wrap:wrap;">' +
        '<a href="/pages/privacy-policy.html" style="font-size:0.78rem;color:rgba(255,255,255,0.55);text-decoration:underline;min-height:44px;display:inline-flex;align-items:center;padding:0 4px;">Privacy</a>' +
        '<button id="cookie-reject" style="' +
          'background:transparent;color:rgba(255,255,255,0.85);' +
          'border:1px solid rgba(255,255,255,0.25);padding:12px 22px;border-radius:999px;' +
          'font-weight:600;font-size:0.82rem;cursor:pointer;font-family:inherit;' +
          'min-height:44px;min-width:44px;' +
        '">Reject</button>' +
        '<button id="cookie-accept" style="' +
          'background:linear-gradient(135deg,#6366F1,#A855F7,#FF2D78);' +
          'color:white;border:none;padding:13px 24px;border-radius:999px;' +
          'font-weight:700;font-size:0.85rem;cursor:pointer;font-family:inherit;' +
          'transition:transform 0.2s ease,box-shadow 0.2s ease;' +
          'min-height:44px;min-width:44px;' +
        '">Accept</button>' +
      '</div>' +
    '</div>';

  banner.style.cssText =
    'position:fixed;bottom:1rem;left:1rem;right:1rem;' +
    'background:#1A1A2E;border:1px solid rgba(255,255,255,0.1);' +
    'border-radius:16px;padding:1rem 1.25rem;z-index:9999;' +
    'box-shadow:0 20px 60px rgba(0,0,0,0.4);' +
    'transform:translateY(120%);transition:transform 0.5s cubic-bezier(0.16,1,0.3,1);' +
    'max-width:760px;margin:0 auto;backdrop-filter:blur(20px);';

  document.body.appendChild(banner);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () { banner.style.transform = 'translateY(0)'; });
  });

  function dismiss(choice) {
    fireConsent(choice);
    banner.style.transform = 'translateY(120%)';
    setTimeout(function () { banner.remove(); }, 500);
  }

  document.getElementById('cookie-accept').addEventListener('click', function () { dismiss('accepted'); });
  document.getElementById('cookie-reject').addEventListener('click', function () { dismiss('rejected'); });

  var btn = document.getElementById('cookie-accept');
  btn.addEventListener('mouseenter', function () {
    btn.style.transform = 'scale(1.05)';
    btn.style.boxShadow = '0 0 20px rgba(99,102,241,0.4)';
  });
  btn.addEventListener('mouseleave', function () {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = 'none';
  });
})();
