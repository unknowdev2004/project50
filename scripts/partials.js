/* ============================================
   PARTIALS.JS — Project 50
   Shared layout partial loader.

   WHAT IT DOES
   ────────────
   Fetches header.html, sidebar.html, footer.html
   from /partials/ and injects them into named
   mount points already present in the page HTML.

   MOUNT POINTS (place in each page's HTML shell):
     <div id="partial-header"></div>
     <div id="partial-sidebar"></div>
     <div id="partial-footer"></div>

   WHY THIS APPROACH
   ─────────────────
   • Root-relative fetch paths (/partials/*.html)
     work identically from any page depth.
   • Mount points have no height/width, so there
     is zero layout shift from empty placeholders.
   • Fetch is async but theme.js runs synchronously
     before this, so dark/light mode is already set
     before any partial renders.
   • CSS is loaded in the page <head> as before —
     partials only inject structural HTML.
   • SEO: crawlers see the injected content after
     JavaScript runs (same as existing dynamic
     rendering in renderers.js, category-page.js).
     Static content in <main> is always crawlable.
   • Progressive enhancement: if JS is off, the
     page renders without header/sidebar/footer
     (same as before partials were introduced).

   WHAT IT DOES NOT DO
   ───────────────────
   • Does NOT inject <script> tags
   • Does NOT manage routing
   • Does NOT re-initialise sidebar.js / header.js
     (those scripts run after this via defer)
   • Does NOT affect CSS loading
   • Does NOT create a component framework

   LOAD ORDER
   ──────────
   Loaded after utils.js (sync), before theme.js.
   theme.js is deferred — runs after DOM parsed,
   so by then partials are already injected.

   EXPOSES: window.P50Partials

   USAGE (in page HTML, near top of <body>):
   ─────
     <div id="partial-header"></div>
     <div id="partial-sidebar"></div>
     ... page content ...
     <div id="partial-footer"></div>

   Pages that already have static header/sidebar/
   footer HTML continue to work unchanged — the
   loader silently skips mounts it cannot find.
============================================ */

(function (global) {
  'use strict';

  /* ============================================
     CONFIGURATION
     All paths are root-relative so they resolve
     identically from / or /tools/bmi-calculator/
  ============================================ */

  var PARTIALS = {
    'partial-header':  '/partials/header.partial',
    'partial-sidebar': '/partials/sidebar.partial',
    'partial-footer':  '/partials/footer.partial'
  };

  /* Cache: avoid re-fetching the same partial
     if multiple calls occur (shouldn't happen,
     but defensive). */
  var _cache = {};

  /* ============================================
     fetchPartial(url)
     Returns Promise<string> of HTML content.
     Caches by URL.
  ============================================ */
  function fetchPartial(url) {
    if (_cache[url]) return Promise.resolve(_cache[url]);

    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
        return res.text();
        
      })
      .then(function (html) {
  var clean = html.replace(
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    ''
  );

  _cache[url] = clean;
  return clean;
});
  }

  /* ============================================
     injectPartial(mountId, url)
     Fetches url and injects into #mountId.
     Replaces the mount div with actual HTML
     so there is no extra wrapper element.
     Returns Promise<void>.
  ============================================ */
  function injectPartial(mountId, url) {
    var mount = document.getElementById(mountId);
    if (!mount) return Promise.resolve(); /* mount not present — skip */

    return fetchPartial(url)
      .then(function (html) {
        /* outerHTML replacement removes the mount div itself,
           leaving clean semantic HTML in the DOM. */
        mount.outerHTML = html;
      })
      .catch(function (err) {
        console.warn('[P50Partials] Could not load partial:', url, err.message);
        /* Fail silently — page is still functional without the partial */
      });
  }

  /* ============================================
     init()
     Loads all partials in parallel.
     Fires p50:partialsReady event when done
     so sidebar.js / header.js can re-query IDs
     if they load before partials complete.

     Returns Promise<void>.
  ============================================ */
  function init() {
    var jobs = Object.keys(PARTIALS).map(function (mountId) {
      return injectPartial(mountId, PARTIALS[mountId]);
    });

    return Promise.all(jobs).then(function () {
      /* Notify other scripts that partials are in DOM */
      window.dispatchEvent(new CustomEvent('p50:partialsReady'));
    });
  }

  /* ============================================
     AUTO-INIT
     Runs as soon as DOM is parsed. Because this
     script is loaded synchronously (no defer),
     DOMContentLoaded may or may not have fired.
  ============================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---- Expose globally ---- */
  global.P50Partials = { init: init, injectPartial: injectPartial };

})(window);
