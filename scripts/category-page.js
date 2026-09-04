/* ============================================
   CATEGORY-PAGE.JS — Project 50
   Shared renderer for all 5 category pages.

   HOW IT WORKS
   ────────────
   1. Reads data-category-id from <body>
   2. Fetches /data/tools.json (relative path resolved)
   3. Finds the matching category object
   4. Filters allTools by categoryId
   5. Renders: hero stats, tool grid, related categories
   6. Wires up filter buttons (All / Popular)

   Each HTML shell sets:
     <body data-category-id="health-fitness">
   That's the only page-specific config needed.
============================================ */

(function () {
    'use strict';
  
    /* ============================================
       UTILITY: resolve the correct path to
       tools.json from /tools/[slug]/ depth.
       Uses P50Utils.fetchData() — root-relative, no path retries needed.
    ============================================ */
  
    const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="3"
      stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/></svg>`;
  
    /* ============================================
       RENDER: TOOL CARD
       Delegates to the shared P50Renderers module.
       This ensures category pages, homepage and
       search results all use identical card markup.
    ============================================ */
    function renderToolCard(tool) {
      if (typeof P50Renderers !== 'undefined') {
        return P50Renderers.toolCard(tool, 'standard');
      }
      /* Fallback if renderers.js somehow not loaded */
      return '<a href="' + tool.link + '" class="tool-card fade-in" role="listitem">' +
        '<div class="tool-card-title">' + tool.name + '</div></a>';
    }
  
    /* ============================================
       RENDER: RELATED CATEGORY CARD
    ============================================ */
    function renderRelatedCard(cat) {
      var catIconSvg = window.P50Icons ? P50Icons.svg(cat.icon || 'wrench', 24) : '';
      return `
        <a href="${cat.link}" class="cat-related-card" aria-label="${cat.name} — ${cat.toolCount} tools">
          <div class="cat-related-icon"
               style="background:color-mix(in srgb, ${cat.color} 12%, transparent)"
               aria-hidden="true">${catIconSvg}</div>
          <div>
            <div class="cat-related-name">${cat.name}</div>
            <div class="cat-related-count">${cat.toolCount} tools</div>
          </div>
        </a>
      `;
    }
  
    /* ============================================
       RENDER: BENEFITS
    ============================================ */
    function renderBenefits(benefits, catColor) {
      return benefits.map(b => `
        <div class="cat-benefit-item">
          <div class="cat-benefit-check" style="--cat-color:${catColor}" aria-hidden="true">
            ${CHECK_SVG}
          </div>
          <p class="cat-benefit-text">${b}</p>
        </div>
      `).join('');
    }
  
    /* ============================================
       FILTER LOGIC
       Runs client-side on the already-fetched tools.
       No re-fetch needed.
    ============================================ */
    let _allCategoryTools = [];
    let _activeFilter = 'all';
  
    function applyFilter(filter) {
      _activeFilter = filter;
      const grid = document.getElementById('cat-tools-grid');
      if (!grid) return;
  
      /* Update button states */
      document.querySelectorAll('.cat-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
      });
  
      const filtered = filter === 'popular'
        ? _allCategoryTools.filter(t => t.popular)
        : _allCategoryTools;
  
      /* Update count label */
      const countEl = document.getElementById('cat-results-count');
      if (countEl) {
        countEl.textContent = `${filtered.length} tool${filtered.length !== 1 ? 's' : ''}`;
      }
  
      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="cat-empty">
            <div class="cat-empty-icon">${window.P50Icons ? P50Icons.svg('search', 40) : ''}</div>
            <h3 class="cat-empty-title">No tools match this filter</h3>
            <p class="cat-empty-desc">Try showing all tools instead.</p>
          </div>`;
        return;
      }
  
      grid.innerHTML = filtered.map(renderToolCard).join('');
  
      /* Re-trigger fade-in observer */
      window.dispatchEvent(new CustomEvent('p50:contentLoaded'));
    }
  
    /* ============================================
       MAIN INIT
    ============================================ */
    async function init() {
      /* 1. Read category identity from body attribute */
      const categoryId = document.body.dataset.categoryId;
      if (!categoryId) {
        console.error('[category-page] Missing data-category-id on <body>');
        return;
      }
  
      /* 2. Fetch data */
      let data;
      try {
        data = await P50Utils.fetchData();
      } catch (err) {
        console.error('[category-page] Failed to load tools.json:', err.message);
        return;
      }
  
      /* 3. Find this category */
      const category = data.categories.find(c => c.id === categoryId);
      if (!category) {
        console.error('[category-page] Category not found:', categoryId);
        return;
      }
  
      /* 4. Filter tools */
      _allCategoryTools = (data.allTools || []).filter(t => t.category === categoryId);
  
      /* ---- Inject category color CSS variable on :root ---- */
      document.documentElement.style.setProperty('--cat-color', category.color);
  
      /* ---- Populate hero icon & stats ---- */
      const heroIcon = document.getElementById('cat-hero-icon');
      if (heroIcon) {
        heroIcon.innerHTML = window.P50Icons
          ? P50Icons.svg(category.icon || 'wrench', 60)
          : '';
      }
  
      const heroCount = document.getElementById('cat-tool-count');
      if (heroCount) heroCount.textContent = category.toolCount + ' tools';
  
      /* ---- Render tool grid ---- */
      const grid = document.getElementById('cat-tools-grid');
      if (grid) {
        grid.innerHTML = _allCategoryTools.map(renderToolCard).join('');
      }
  
      /* ---- Update results count ---- */
      const countEl = document.getElementById('cat-results-count');
      if (countEl) {
        countEl.textContent = `${_allCategoryTools.length} tools`;
      }
  
      /* ---- Render benefits ---- */
      const benefitsList = document.getElementById('cat-benefits-list');
      if (benefitsList && category.benefits) {
        benefitsList.innerHTML = renderBenefits(category.benefits, category.color);
      }
  
      /* ---- Render related categories (exclude self) ---- */
      const relatedGrid = document.getElementById('cat-related-grid');
      if (relatedGrid) {
        const related = data.categories.filter(c => c.id !== categoryId);
        relatedGrid.innerHTML = related.map(renderRelatedCard).join('');
      }
  
      /* ---- Wire filter buttons ---- */
      document.querySelectorAll('.cat-filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          applyFilter(this.dataset.filter);
        });
      });
  
      /* ---- Trigger animation scan ---- */
      window.dispatchEvent(new CustomEvent('p50:contentLoaded'));
  
      /* ---- Footer year ---- */
      const yearEl = document.getElementById('footer-year');
      if (yearEl) yearEl.textContent = new Date().getFullYear();
    }
  
    /* Run after DOM is ready */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
  })();