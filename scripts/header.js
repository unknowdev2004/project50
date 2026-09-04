/* ============================================
   HEADER.JS — Project 50
   Scroll effects, header behaviour.

   Works with both static and partial-injected
   header HTML. Listens for p50:partialsReady
   to re-query after injection.
============================================ */

(function () {
  'use strict';

  var header = null;

  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 20);
  }

  function init() {
    header = document.getElementById('site-header');
    if (!header) return;
    window.addEventListener('scroll', onScroll, { passive: true });

    /* Footer year — set once; tool-base.js also sets it for tool pages */
    var yearEl = document.getElementById('footer-year');
    if (yearEl && !yearEl.textContent) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  /* Re-init if partial-injected header arrives later */
  window.addEventListener('p50:partialsReady', init);

})();
