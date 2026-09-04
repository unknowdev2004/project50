/* ============================================
   SIDEBAR.JS — Project 50
   Mobile sidebar open/close.

   IMPORTANT: Compatible with both:
   1. Static sidebar HTML (already in DOM)
   2. Partial-injected sidebar (loaded by partials.js)

   ID CONTRACT
   ───────────
   Open button:  id="sidebar-toggle"
   Close button: id="sidebar-close"
   Panel:        id="sidebar"
   Overlay:      id="sidebar-overlay"

   If partials.js injects sidebar after this script
   runs, it fires p50:partialsReady — this module
   listens and re-queries then.
============================================ */

(function () {
  'use strict';

  var sidebar, overlay, openBtn, closeBtn;
  var isOpen = false;
  var bound  = false;

  function open() {
    if (!sidebar) return;
    isOpen = true;
    sidebar.classList.add('open');
    if (overlay) { overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); }
    if (openBtn)  openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var first = sidebar.querySelector('button, a, input');
    if (first) setTimeout(function () { first.focus(); }, 50);
  }

  function close() {
    if (!sidebar) return;
    isOpen = false;
    sidebar.classList.remove('open');
    if (overlay) { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); }
    if (openBtn)  openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (openBtn) openBtn.focus();
  }

  function bindAll() {
    /* Re-query every time — handles both static and partial-injected DOM */
    sidebar  = document.getElementById('sidebar');
    overlay  = document.getElementById('sidebar-overlay');
    openBtn  = document.getElementById('sidebar-toggle');
    closeBtn = document.getElementById('sidebar-close');

    if (!sidebar || bound) return;
    bound = true;

    if (openBtn)  openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay)  overlay.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) close();
    });

    sidebar.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { if (isOpen) close(); });
    });
  }

  /* Try binding immediately (static HTML case) */
  if (document.readyState !== 'loading') {
    bindAll();
  } else {
    document.addEventListener('DOMContentLoaded', bindAll);
  }

  /* Also bind after partials inject (partial case) */
  window.addEventListener('p50:partialsReady', function () {
    bound = false; /* allow re-bind after partial injection */
    bindAll();
  });

})();
