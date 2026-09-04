/* ============================================
   MAIN.JS — Project 50
   Homepage dynamic rendering.

   Uses P50Renderers from renderers.js for
   tool cards (shared renderer, 'standard' variant).
   Category cards remain homepage-specific
   (they use a different visual structure).
============================================ */

(async function () {
  'use strict';

  /* ---- Fetch Data ---- */
  let data = { categories: [], popularTools: [], allTools: [] };
  try {
    data = await P50Utils.fetchData();
  } catch (e) {
    console.warn('[main] Failed to load tools.json:', e.message);
  }

  /* ============================================
     RENDER: CATEGORY CARDS
     Homepage-specific visual structure.
     Not shared — uses different card layout
     (cat-card-icon, cat-card-footer etc).
  ============================================ */
  function renderCategories(categories) {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;

    const ARROW = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

    grid.innerHTML = categories.map(function (cat) {
      var iconSvg = (window.P50Icons)
        ? P50Icons.svg(cat.icon || 'wrench', 32, 'cat-card-icon-svg')
        : '';
      return '<a href="' + cat.link + '" class="category-card fade-in" role="listitem"' +
        ' style="--cat-color:' + cat.color + '"' +
        ' aria-label="' + cat.name + ' — ' + cat.toolCount + ' tools">' +
        '<div class="cat-card-icon" aria-hidden="true">' + iconSvg + '</div>' +
        '<h3 class="cat-card-title">' + cat.name + '</h3>' +
        '<p class="cat-card-desc">' + cat.description + '</p>' +
        '<div class="cat-card-footer">' +
          '<span class="cat-card-count">' + cat.toolCount + ' tools</span>' +
          '<span class="cat-card-arrow" aria-hidden="true">' + ARROW + '</span>' +
        '</div>' +
        '</a>';
    }).join('');
  }

  /* ============================================
     RENDER: POPULAR TOOLS
     Uses the shared P50Renderers.toolCard() with
     'standard' variant — same card as category pages.
     popularTools objects have a different shape
     (shortName, name as benefit headline) so we
     normalise them to the allTools shape first.
  ============================================ */
  function renderPopularTools(tools) {
    const grid = document.getElementById('tools-grid');
    if (!grid) return;

    if (typeof P50Renderers === 'undefined') {
      console.warn('[main] P50Renderers not loaded — renderers.js missing?');
      return;
    }

    grid.innerHTML = tools.map(function (tool) {
      /* popularTools use categoryId not category for the ID */
      const normalized = {
        id:          tool.id,
        name:        tool.name,        /* benefit headline */
        description: tool.description,
        icon:        tool.icon,
        category:    tool.categoryId,  /* "health-fitness" etc */
        tags:        tool.tags || [],
        popular:     true,
        link:        tool.link
      };
      return P50Renderers.toolCard(normalized, 'standard');
    }).join('');
  }

  /* ============================================
     INIT
  ============================================ */
  renderCategories(data.categories);
  renderPopularTools(data.popularTools);

  window.dispatchEvent(new CustomEvent('p50:contentLoaded'));

  const yearEl = document.getElementById('footer-year');
  if (yearEl && !yearEl.textContent) {
    yearEl.textContent = new Date().getFullYear();
  }

})();