/* ============================================
   THEME.JS — Project 50
   Dark / Light theme toggle.

   Theme is applied to <html> immediately
   (synchronous) so there is no flash.
   Button wiring happens after DOM is ready
   and also after p50:partialsReady in case
   the toggle button arrives via partial.
============================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'p50_theme';
  var html        = document.documentElement;

  function getPreferred() {
    var saved = (typeof P50Storage !== 'undefined') ? P50Storage.get(STORAGE_KEY) : null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    var iconSun  = document.getElementById('icon-sun');
    var iconMoon = document.getElementById('icon-moon');
    var toggleBtn = document.getElementById('theme-toggle');

    if (iconSun)  iconSun.style.display  = (theme === 'light') ? 'none'  : 'block';
    if (iconMoon) iconMoon.style.display  = (theme === 'light') ? 'block' : 'none';
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label',
        theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }

    if (typeof P50Storage !== 'undefined') P50Storage.set(STORAGE_KEY, theme);
  }

  function toggle() {
    var current = html.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  function wireToggle() {
    var btn = document.getElementById('theme-toggle');
    if (btn && !btn._themeWired) {
      btn.addEventListener('click', toggle);
      btn._themeWired = true;
    }
  }

  /* Apply theme immediately — prevents flash of wrong theme */
  applyTheme(getPreferred());

  /* Wire button now if already in DOM */
  wireToggle();

  /* Wire after DOMContentLoaded (static HTML case) */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireToggle);
  }

  /* Re-wire after partial injection (partial header case) */
  window.addEventListener('p50:partialsReady', function () {
    applyTheme(html.getAttribute('data-theme') || 'dark'); /* sync icons */
    wireToggle();
  });

  /* OS preference sync */
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
    if (typeof P50Storage !== 'undefined' && !P50Storage.get(STORAGE_KEY)) {
      applyTheme(e.matches ? 'light' : 'dark');
    }
  });

})();
