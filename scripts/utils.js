/* ============================================
   UTILS.JS — Project 50
   Shared utility functions.

   Exposes: window.P50Utils

   REPLACES duplicated helpers in:
     - renderers.js   (local esc)
     - search.js      (local escHtml)
     - search-page.js (local escHtml)
     - cgpa.js        (local escapeAttr)

   LOAD ORDER: Must be the FIRST script on every page.
   All other P50 scripts depend on this.
============================================ */

(function (global) {
    'use strict';
  
    /* ============================================
       HTML ESCAPING
       Both names exposed — escHtml is the primary,
       escapeAttr is an alias kept for tool scripts
       that call it by that name (cgpa.js).
    ============================================ */
  
    function escHtml(str) {
      var d = document.createElement('div');
      d.textContent = String(str == null ? '' : str);
      return d.innerHTML;
    }
  
    /* Alias — identical output, separate name for
       attribute context clarity in tool scripts. */
    function escapeAttr(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  
    /* ============================================
       DEBOUNCE
       Returns a function that delays invoking fn
       until after wait ms have elapsed since the
       last call. Used in search inputs.
    ============================================ */
  
    function debounce(fn, wait) {
      var timer = null;
      return function () {
        var ctx  = this;
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
          fn.apply(ctx, args);
        }, wait);
      };
    }
  
    /* ============================================
       CLAMP
       Constrains a number within [min, max].
    ============================================ */
  
    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }
  
    /* ============================================
       FORMAT NUMBER
       Locale-aware integer formatting.
       prefix: optional string prepended (e.g. '₹')
    ============================================ */
  
    function formatNumber(n, prefix, locale) {
      var rounded = Math.round(n);
      var formatted = rounded.toLocaleString(locale || 'en-IN');
      return prefix ? prefix + formatted : formatted;
    }
  
    /* ============================================
       SAFE QUERY
       querySelector that returns null (not throws)
       when selector is invalid. Useful in tool
       scripts where elements may not exist on page.
    ============================================ */
  
    function safeQuery(selector, context) {
      try {
        return (context || document).querySelector(selector);
      } catch (_) {
        return null;
      }
    }
  
    /* ============================================
       BUILD URL
       Appends a query param to a base URL safely.
       buildUrl('/search/', 'q', 'bmi')
       → '/search/?q=bmi'
    ============================================ */
  
    function buildUrl(base, key, value) {
      var url = new URL(base, window.location.origin);
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
      return url.toString();
    }

    /* ============================================
       FETCH DATA
       Root-relative fetch for tools.json.
       Always resolves to /data/tools.json regardless
       of page depth — no waterfall path retries.

       Usage:
         P50Utils.fetchData().then(function(data) { … });

       Returns a Promise<object>. Rejects on network
       error or non-OK HTTP status.
    ============================================ */

    function fetchData() {
      return fetch('/data/tools.json')
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        });
    }
  
    /* ============================================
       EXPOSE GLOBALLY
    ============================================ */
  
    global.P50Utils = {
      escHtml:      escHtml,
      escapeAttr:   escapeAttr,
      debounce:     debounce,
      clamp:        clamp,
      formatNumber: formatNumber,
      safeQuery:    safeQuery,
      buildUrl:     buildUrl,
      fetchData:    fetchData
    };
  
  })(window);