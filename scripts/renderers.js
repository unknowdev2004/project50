/* ============================================
   RENDERERS.JS — Project 50
   Shared tool card renderer.

   Depends on: utils.js, icons/icons.js,
               icons/icon-map.js, config/categories.js
   Exposes: window.P50Renderers
============================================ */

(function (global) {
  'use strict';

  const ARROW_SVG = `<svg class="tool-card-cta-icon"
    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2.5"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

  /* Lucide star for the popular badge */
  const STAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"
    viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`;

  function esc(str) {
    if (global.P50Utils && global.P50Utils.escHtml) {
      return global.P50Utils.escHtml(str);
    }
    const d = document.createElement('div');
    d.textContent = String(str == null ? '' : str);
    return d.innerHTML;
  }

  function getCatMeta(categoryId) {
    if (global.P50Categories && global.P50Categories.get) {
      return global.P50Categories.get(categoryId);
    }
    return { label: categoryId, icon: 'wrench', color: '#3b82f6' };
  }

  /**
   * Resolve the SVG for a tool's icon field.
   * tool.icon is now an icon key (e.g. 'scale').
   * Falls back gracefully for any unmapped key.
   */
  function resolveToolIconSvg(tool, size) {
    size = size || 28;
    if (global.P50Icons) {
      var key = tool.icon || 'wrench';
      return global.P50Icons.svg(key, size, 'tool-card-icon-svg');
    }
    /* Graceful degradation if icons.js not loaded */
    return '';
  }

  /**
   * Resolve the SVG for a category icon.
   */
  function resolveCatIconSvg(iconKey, size) {
    size = size || 20;
    if (global.P50Icons) {
      return global.P50Icons.svg(iconKey || 'wrench', size, 'cat-icon-svg');
    }
    return '';
  }

  function toolCard(tool, variant) {
    variant = variant || 'standard';

    const iconSvg = resolveToolIconSvg(tool, variant === 'search' ? 24 : 28);
    const tags = (tool.tags || []).slice(0, 2).map(t => `<span class="tag">${esc(t)}</span>`).join('');
    const popularBadge = tool.popular
      ? `<span class="tool-card-popular">${STAR_SVG} <span class="popular-tag">Popular</span></span>`
      : '';
    const cat = getCatMeta(tool.category);

    if (variant === 'search') {
      return _searchCard(tool, iconSvg, tags, popularBadge, cat);
    }
    return _standardCard(tool, iconSvg, tags, popularBadge);
  }

  function _standardCard(tool, iconSvg, tags, popularBadge) {
    return `<a href="${esc(tool.link)}" class="tool-card fade-in" role="listitem"
               aria-label="Open ${esc(tool.name)}">
        <div class="tool-card-header">
          <div class="tool-card-icon" aria-hidden="true">${iconSvg}</div>
          ${popularBadge}
        </div>
        <div>
          <h3 class="tool-card-title">${esc(tool.name)}</h3>
          <p class="tool-card-desc">${esc(tool.description || '')}</p>
        </div>
        <div class="tool-card-footer">
          <div class="tool-card-tags" aria-label="Tags">${tags}</div>
          <span class="tool-card-cta" aria-hidden="true">Open tool ${ARROW_SVG}</span>
        </div>
      </a>`;
  }

  function _searchCard(tool, iconSvg, tags, popularBadge, cat) {
    const catIconSvg = resolveCatIconSvg(cat.icon, 14);
    const catBadge = `<span class="search-card-cat"
      style="--cat-color:${cat.color}">${catIconSvg} ${esc(cat.label)}</span>`;

    return `<a href="${esc(tool.link)}" class="search-card fade-in" role="listitem"
               aria-label="Open ${esc(tool.name)}">
        <div class="search-card-icon" aria-hidden="true">${iconSvg}</div>
        <div class="search-card-body">
          <div class="search-card-top">
            <h2 class="search-card-title">${esc(tool.name)}</h2>
            ${popularBadge ? `<span class="tool-card-popular">${popularBadge}</span>` : ''}
          </div>
          <p class="search-card-desc">${esc(tool.description || '')}</p>
          <div class="search-card-meta">
            ${catBadge}
            <div class="search-card-tags">${tags}</div>
          </div>
        </div>
        <span class="search-card-cta" aria-hidden="true">${ARROW_SVG}</span>
      </a>`;
  }

  /**
   * Related tool small card used on tool pages (keeps existing styling)
   * Returns the compact related-tool card markup (icon + name + desc).
   */
  function relatedToolCard(tool) {
    var iconSvg = resolveToolIconSvg(tool, 20);
    var desc = esc(tool.description || '');
    return '<a href="' + esc(tool.link) + '" class="tool-related-card">' +
             '<span class="tool-related-icon" aria-hidden="true">' + iconSvg + '</span>' +
             '<div>' +
               '<div class="tool-related-name">' + esc(tool.name) + '</div>' +
               '<div class="tool-related-desc">' + desc + '</div>' +
             '</div>' +
           '</a>';
  }


  global.P50Renderers = {
    toolCard: toolCard,
    relatedToolCard: relatedToolCard
  };

})(window);
