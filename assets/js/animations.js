/* Blastbeat — Scroll Reveal & Counters */
(function () {
  // Scroll reveal
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { observer.observe(el); });
  }

  // Animated counters
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { counterObserver.observe(el); });
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    var duration = 2000;
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      var current = Math.floor(eased * target);

      if (current >= 1000) {
        el.textContent = prefix + current.toLocaleString() + suffix;
      } else {
        el.textContent = prefix + current + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target.toLocaleString() + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  // Parallax subtle effect on orbs
  var orbs = document.querySelectorAll('.orb');
  if (orbs.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('mousemove', function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 2;
      var y = (e.clientY / window.innerHeight - 0.5) * 2;
      orbs.forEach(function (orb, i) {
        var speed = (i + 1) * 15;
        orb.style.transform = 'translate(' + (x * speed) + 'px, ' + (y * speed) + 'px)';
      });
    });
  }
})();

// Drag-to-scroll for horizontal role tracks
document.querySelectorAll('.h-scroll-track').forEach(track => {
  let isDown = false, startX = 0, scrollLeft = 0;
  track.addEventListener('mousedown', e => {
    isDown = true;
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
    track.style.scrollSnapType = 'none';
  });
  track.addEventListener('mouseleave', () => { isDown = false; });
  track.addEventListener('mouseup', () => {
    isDown = false;
    track.style.scrollSnapType = 'x mandatory';
  });
  track.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.2;
  });
});
