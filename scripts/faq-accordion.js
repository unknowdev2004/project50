/* ============================================
   FAQ-ACCORDION.JS — Project 50
   Phase 3.4: SEO content FAQ accordions.

   Handles .tool-faq-question and
   .cat-faq-question toggle buttons.

   Keyboard: Enter/Space to toggle.
   Does NOT touch: faq.js (homepage FAQs).
============================================ */

(function () {
  'use strict';

  var SELECTORS = '.tool-faq-question, .cat-faq-question';

  function toggle(btn) {
    var expanded = btn.getAttribute('aria-expanded') === 'true';
    var answerId = btn.getAttribute('aria-controls');
    var answer = answerId ? document.getElementById(answerId) : null;

    btn.setAttribute('aria-expanded', String(!expanded));
    if (answer) {
      answer.classList.toggle('is-open', !expanded);
    }
  }

  function init() {
    document.querySelectorAll(SELECTORS).forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggle(btn);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
