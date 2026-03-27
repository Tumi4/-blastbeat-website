/* Blastbeat Navigation */
(function () {
  const nav = document.querySelector('.bb-nav');
  const toggle = document.querySelector('.bb-nav-toggle');
  const mobileNav = document.querySelector('.bb-nav-mobile');

  if (!nav) return;

  // Mobile menu toggle
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      const isOpen = mobileNav.classList.toggle('open');
      toggle.classList.toggle('active');
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Active state based on current path
  var path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.bb-nav-link, .bb-nav-mobile a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href) return;
    var linkPath = href.replace(/\/$/, '') || '/';
    if (path === linkPath || (linkPath !== '/' && path.startsWith(linkPath))) {
      link.classList.add('active');
    }
  });

  // Hide/show on scroll
  var lastScroll = 0;
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var currentScroll = window.scrollY;
      if (currentScroll > 100 && currentScroll > lastScroll) {
        nav.classList.add('nav-hidden');
      } else {
        nav.classList.remove('nav-hidden');
      }
      lastScroll = currentScroll;
      ticking = false;
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
