/* Blastbeat Cookie Consent */
(function () {
  if (localStorage.getItem('bb-cookie-consent')) return;

  var banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">' +
      '<p style="margin:0;font-size:0.875rem;color:rgba(255,255,255,0.8);flex:1;min-width:200px;">' +
        '&#127850; We use cookies to improve your experience on blastbeat.education.' +
      '</p>' +
      '<div style="display:flex;gap:0.75rem;align-items:center;flex-shrink:0;">' +
        '<a href="/pages/privacy-policy.html" style="font-size:0.8rem;color:rgba(255,255,255,0.5);text-decoration:underline;">Learn More</a>' +
        '<button id="cookie-accept" style="' +
          'background:linear-gradient(135deg,#6366F1,#A855F7,#FF2D78);' +
          'color:white;border:none;padding:10px 24px;border-radius:999px;' +
          'font-weight:700;font-size:0.85rem;cursor:pointer;' +
          'transition:transform 0.2s ease,box-shadow 0.2s ease;' +
        '">Accept All</button>' +
      '</div>' +
    '</div>';

  banner.style.cssText =
    'position:fixed;bottom:1.5rem;left:1.5rem;right:1.5rem;' +
    'background:#1A1A2E;border:1px solid rgba(255,255,255,0.1);' +
    'border-radius:16px;padding:1rem 1.5rem;z-index:9999;' +
    'box-shadow:0 20px 60px rgba(0,0,0,0.4);' +
    'transform:translateY(120%);transition:transform 0.5s cubic-bezier(0.16,1,0.3,1);' +
    'max-width:720px;margin:0 auto;backdrop-filter:blur(20px);';

  document.body.appendChild(banner);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      banner.style.transform = 'translateY(0)';
    });
  });

  document.getElementById('cookie-accept').addEventListener('click', function () {
    localStorage.setItem('bb-cookie-consent', 'accepted');
    banner.style.transform = 'translateY(120%)';
    setTimeout(function () { banner.remove(); }, 500);
  });

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
