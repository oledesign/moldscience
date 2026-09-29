document.documentElement.classList.add('js');

(() => {
  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    [...group.children]
      .filter((child) => child.matches('[data-reveal]'))
      .forEach((child, index) => {
        if (!child.style.getPropertyValue('--reveal-i')) {
          child.style.setProperty('--reveal-i', index);
        }
      });
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Reveal on entry — and anything already scrolled past (an End-key jump,
        // a reload that restored scroll position, find-in-page), so nothing is
        // ever left hidden above the fold.
        if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach((item) => {
      if (item.closest('.band--hero')) item.classList.add('is-visible');
      else observer.observe(item);
    });
  }

  const nav = document.querySelector('.nav');
  if (!nav) return;

  let ticking = false;
  let isScrolled = false;
  const updateNav = () => {
    const next = window.scrollY > 8;
    if (next !== isScrolled) {
      isScrolled = next;
      nav.classList.toggle('is-scrolled', isScrolled);
    }
    ticking = false;
  };
  const requestNavUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateNav);
  };

  updateNav();
  window.addEventListener('scroll', requestNavUpdate, { passive: true });
})();

// Mobile menu: also close on Escape, an outside tap, a link tap, and when the
// viewport widens past the breakpoint. (The toggle itself lives in site.js.)
(() => {
  const nav = document.querySelector('.nav');
  const toggle = nav?.querySelector('.nav-toggle');
  if (!nav || !toggle) return;
  const close = (returnFocus) => {
    if (!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(true); });
  document.addEventListener('click', (e) => { if (!nav.contains(e.target)) close(false); });
  nav.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => close(false)));
  window.matchMedia?.('(min-width: 900px)').addEventListener?.('change', (e) => { if (e.matches) close(false); });
})();

// Fade images in as they decode, so lazy images don't pop in mid-scroll.
(function () {
  function mark(img) { img.classList.add('is-loaded'); }
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    if (img.complete && img.naturalWidth) return mark(img);
    img.addEventListener('load', () => mark(img), { once: true });
    img.addEventListener('error', () => mark(img), { once: true }); // never leave it invisible
  });
})();
