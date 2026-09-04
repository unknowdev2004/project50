/* ============================================
   TOOL-BASE.JS — Project 50
   Shared initialisation for all tool pages.

   EXPOSES: window.P50ToolBase

   LOAD ORDER: After utils.js, categories.js,
   storage.js, theme.js, header.js —
   before the individual tool script.

   RESPONSIBILITIES
   ────────────────
   1. Footer year — sets #footer-year on all tools
   2. Animation hook — triggers p50:contentLoaded
      so animations.js observes dynamically added
      elements after tool renders its result
   3. Related tools — renders #tool-related-grid
      if present, using tools.json + P50Renderers
   4. Breadcrumb helper — builds breadcrumb HTML
      from a config object
   5. Page init guard — prevents double-init

   DOES NOT:
   ─────────
   - Contain any tool-specific business logic
   - Handle calculation or state
   - Modify tool-specific DOM elements
============================================ */

(function (global) {
    'use strict';
  
    /* ---- Dependency guard ---- */
    if (typeof global.P50Utils === 'undefined') {
      console.error('[P50ToolBase] utils.js must load before tool-base.js');
    }
  
    var _initialized = false;
  
    /* ============================================
       setFooterYear()
       Writes the current year into #footer-year.
       Called automatically on init.
    ============================================ */
    function setFooterYear() {
      var el = document.getElementById('footer-year');
      if (el && !el.textContent) {
        el.textContent = new Date().getFullYear();
      }
    }
  
    /* ============================================
       triggerAnimations()
       Dispatches p50:contentLoaded so animations.js
       re-scans for .fade-in elements after a tool
       renders dynamic content (results, added rows).
  
       Call this after any dynamic DOM insertion in
       a tool script:
         P50ToolBase.triggerAnimations();
    ============================================ */
    function triggerAnimations() {
      window.dispatchEvent(new CustomEvent('p50:contentLoaded'));
    }
  
    /* ============================================
       renderRelatedTools(containerId, currentToolId, categoryId)
       Fetches tools.json and renders related tool
       cards in the specified container.
  
       Parameters:
         containerId   — id of the grid element to populate
         currentToolId — id of the current tool (excluded)
         categoryId    — show tools from this category first,
                         then fill with others if < 3
  
       Uses P50Renderers.toolCard if available.
       Silently skips if container not found.
    ============================================ */
    function renderRelatedTools(containerId, currentToolId, categoryId) {
      var container = document.getElementById(containerId);
      if (!container) return;
  
      /* Use centralized root-relative fetch */
      (global.P50Utils ? global.P50Utils.fetchData() : fetch('/data/tools.json').then(function(r){ return r.json(); }))
        .then(function (data) {
            var all = (data.allTools || []).filter(function (t) {
              return t.id !== currentToolId;
            });
  
            /* Same category only, cap at 4 */
              var related = all.filter(function (t) {
                return t.category === categoryId;
              }).slice(0, 4);

              /* No related tools in this category */
              if (!related.length) {
                container.innerHTML =
                  '<p class="tool-related-empty">' +
                    'More tools in this category are coming soon.' +
                  '</p>';
                
                return;
              }
  
            if (typeof global.P50Renderers !== 'undefined') {
              if (P50Renderers.relatedToolCard) {
                container.innerHTML = related.map(function (t) { return P50Renderers.relatedToolCard(t); }).join('');
              } else {
                container.innerHTML = related.map(function (t) { return P50Renderers.toolCard(t, 'standard'); }).join('');
              }
            } else {
              var esc = global.P50Utils ? global.P50Utils.escHtml : function (s) { return String(s); };
              container.innerHTML = related.map(function (t) {
                return '<a href="' + esc(t.link) + '" class="tool-card fade-in">' +
                         esc(t.icon) + ' ' + esc(t.name) +
                       '</a>';
              }).join('');
            }
  
            triggerAnimations();
          })
        .catch(function () {
          console.warn('[P50ToolBase] Could not load tools.json for related tools');
        });
    }
  
    /* ============================================
       buildBreadcrumb(items)
       Returns breadcrumb HTML string.
  
       items: array of { label, href? }
       Last item is aria-current="page" with no link.
  
       Usage:
         var html = P50ToolBase.buildBreadcrumb([
           { label: 'Home',          href: '/' },
           { label: 'Student Tools', href: '/tools/student/' },
           { label: 'CGPA Calculator' }
         ]);
         document.querySelector('.tool-breadcrumb').innerHTML = html;
    ============================================ */
    function buildBreadcrumb(items) {
      if (!items || !items.length) return '';
      var esc = global.P50Utils ? global.P50Utils.escHtml : function (s) { return String(s); };
  
      return items.map(function (item, i) {
        var isLast = i === items.length - 1;
        var sep    = i > 0 ? '<span class="sep" aria-hidden="true">›</span>' : '';
  
        if (isLast || !item.href) {
          return sep + '<span aria-current="page">' + esc(item.label) + '</span>';
        }
        return sep + '<a href="' + esc(item.href) + '">' + esc(item.label) + '</a>';
      }).join('');
    }
  
    /* ============================================
       init()
       Runs shared tool page setup.
       Called automatically on DOMContentLoaded.
       Safe to call manually before DOM ready.
    ============================================ */
    function init() {
      if (_initialized) return;
      _initialized = true;
  
      setFooterYear();
  
      /* Trigger initial animation scan for
         any .fade-in elements already in the DOM */
      triggerAnimations();
    }
  
    /* ---- Auto-init ---- */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
    /* ---- Expose globally ---- */
    global.P50ToolBase = {
      init:               init,
      setFooterYear:      setFooterYear,
      triggerAnimations:  triggerAnimations,
      renderRelatedTools: renderRelatedTools,
      buildBreadcrumb:    buildBreadcrumb
    };
  
  })(window);