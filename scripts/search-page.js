/* ============================================
   SEARCH-PAGE.JS — Project 50
   Dedicated search results page engine.

   RESPONSIBILITIES
   ────────────────
   • Reads query from URL: /search/?q=bmi
   • Fetches tools.json once, caches in closure
   • Runs scored fuzzy search across name/desc/tags/category
   • Renders results using P50Renderers.toolCard(tool, 'search')
   • Updates URL on every input (replaceState — no history spam)
   • Updates <title> and <meta description> dynamically
   • Handles: initial (no query), results, empty states
   • Renders related categories
   • Wires live input, clear button, keyboard shortcuts

   SEARCH ALGORITHM
   ────────────────
   Each tool gets a numeric score:
     name exact match        → +10
     name starts with query  → +6
     name includes query     → +4
     description includes    → +2
     tags include any word   → +2 per match
     category name includes  → +1
   Results sorted by score DESC, then alphabetically.
   Minimum score: 1 (must match something)
   Max results returned: all matches (not capped on results page)

   DATA PATH
   ─────────
   Uses P50Utils.fetchData() — root-relative /data/tools.json,
   works from any page depth without path retries.
============================================ */

(function () {
    'use strict';
  
    /* ============================================
       CONSTANTS
    ============================================ */
  
    const SEARCH_PARAM   = 'q';
    const DEBOUNCE_MS    = 180;
    const MAX_HEADER_RESULTS = 7; /* header dropdown cap */
  
    const POPULAR_QUERIES = ['BMI', 'EMI', 'CGPA', 'Password', 'Pomodoro', 'Color Palette'];

    function getCatMeta(categoryId) {
      if (window.P50Categories && P50Categories.get) return P50Categories.get(categoryId);
      return { label: categoryId, icon: 'wrench', color: '#3b82f6', slug: categoryId };
    }
  
    /* ============================================
       DOM REFS — grabbed once
    ============================================ */
  
    const searchInput   = document.getElementById('search-bar-input');
    const clearBtn      = document.getElementById('search-bar-clear');
    const resultsHeader = document.getElementById('search-results-header');
    const resultsGrid   = document.getElementById('search-results-grid');
    const relatedGrid   = document.getElementById('search-related-grid');
  
    /* ============================================
       STATE
    ============================================ */
  
    let _allTools    = [];
    let _categories  = [];
    let _debounceTimer = null;
  
    /* ============================================
       SEARCH ALGORITHM
       Scores each tool against the query.
       Returns sorted array of { tool, score }.
    ============================================ */
  
    function scoreTools(query) {
      if (!query || !query.trim()) return [];
  
      const raw = query.trim().toLowerCase();
      /* Split into words for multi-word matching */
      const words = raw.split(/\s+/).filter(Boolean);
  
      const scored = [];
  
      _allTools.forEach(function (tool) {
        const name    = (tool.name        || '').toLowerCase();
        const desc    = (tool.description || '').toLowerCase();
        const catId   = (tool.category    || '').toLowerCase();
        const catMeta = getCatMeta(tool.category);
        const catName = (catMeta.label || catId).toLowerCase();
        const tags    = (tool.tags        || []).map(function(t){ return t.toLowerCase(); });
  
        let score = 0;
  
        words.forEach(function (word) {
          /* Name scoring */
          if (name === word)             score += 10;
          else if (name.startsWith(word)) score += 6;
          else if (name.includes(word))   score += 4;
  
          /* Description */
          if (desc.includes(word))        score += 2;
  
          /* Tags — each matching tag adds score */
          tags.forEach(function (tag) {
            if (tag.includes(word) || word.includes(tag)) score += 2;
          });
  
          /* Category */
          if (catId.includes(word) || catName.includes(word)) score += 1;
        });
  
        if (score > 0) {
          scored.push({ tool: tool, score: score });
        }
      });
  
      /* Sort by score DESC, then name ASC */
      scored.sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return a.tool.name.localeCompare(b.tool.name);
      });
  
      return scored.map(function (s) { return s.tool; });
    }
  
    /* ============================================
       HIGHLIGHTING
       Wraps query matches in <mark> inside the
       rendered card title text node.
       Uses the already-escaped title from renderers.js,
       so we apply regex on the escaped string safely.
    ============================================ */
  
    function highlightQuery(html, query) {
      if (!query || !query.trim()) return html;
      const words = query.trim().split(/\s+/).filter(Boolean);
      words.forEach(function (word) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        /* Only highlight inside the title element, not the whole card */
        html = html.replace(
          new RegExp('(<h2 class="search-card-title">)(.*?)(' + escaped + ')(.*?)(</h2>)', 'gi'),
          function (_, open, before, match, after, close) {
            return open + before + '<mark>' + match + '</mark>' + after + close;
          }
        );
      });
      return html;
    }
  
    /* ============================================
       URL MANAGEMENT
       replaceState — does not add browser history entries.
       Preserves back-navigation from result → homepage.
    ============================================ */
  
    function getQueryFromURL() {
      return new URLSearchParams(window.location.search).get(SEARCH_PARAM) || '';
    }
  
    function setQueryInURL(query) {
      const url = new URL(window.location.href);
      if (query) {
        url.searchParams.set(SEARCH_PARAM, query);
      } else {
        url.searchParams.delete(SEARCH_PARAM);
      }
      window.history.replaceState(null, '', url.toString());
    }
  
    /* ============================================
       DOCUMENT TITLE + META
    ============================================ */
  
    function updateDocMeta(query, count) {
      if (query) {
        document.title = 'Results for "' + query + '" — Project 50';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content',
            count + ' tool' + (count !== 1 ? 's' : '') +
            ' found for "' + query + '" on Project 50.');
        }
      } else {
        document.title = 'Search Tools — Project 50';
      }
    }
  
    /* ============================================
       RENDER: RESULTS HEADER
    ============================================ */
  
    function renderResultsHeader(query, count) {
      if (!query) {
        resultsHeader.innerHTML = '';
        return;
      }
  
      const countText = count === 0
        ? 'No tools found'
        : count + ' tool' + (count !== 1 ? 's' : '') + ' found';
  
      resultsHeader.innerHTML =
        '<h1 class="search-results-heading">' +
          'Results for <span class="query-text">&ldquo;' + escHtml(query) + '&rdquo;</span>' +
        '</h1>' +
        '<span class="search-results-meta">' + countText + '</span>';
    }
  
    /* ============================================
       RENDER: INITIAL STATE (no query)
    ============================================ */
  
    function renderInitialState() {
      const pills = POPULAR_QUERIES.map(function (q) {
        return '<a href="/search/?q=' + encodeURIComponent(q) +
          '" class="search-empty-tag">' + escHtml(q) + '</a>';
      }).join('');
  
      resultsGrid.innerHTML =
        '<div class="search-initial" style="grid-column:1/-1">' +
          '<p class="search-initial-title">What are you looking for?</p>' +
          '<p class="search-initial-desc">Search across 50 free tools by name, category, or tag.</p>' +
          '<div class="search-initial-pills">' + pills + '</div>' +
        '</div>';
    }
  
    /* ============================================
       RENDER: EMPTY STATE
    ============================================ */
  
    function renderEmptyState(query) {
      const pills = POPULAR_QUERIES.map(function (q) {
        return '<a href="/search/?q=' + encodeURIComponent(q) +
          '" class="search-empty-tag">' + escHtml(q) + '</a>';
      }).join('');
  
      resultsGrid.innerHTML =
        '<div class="search-empty">' +
          '<div class="search-empty-icon">' + (window.P50Icons ? P50Icons.svg('search', 48) : '') + '</div>' +
          '<h2 class="search-empty-title">No tools found for &ldquo;' + escHtml(query) + '&rdquo;</h2>' +
          '<p class="search-empty-desc">Try a different keyword, or browse by category below.</p>' +
          '<div class="search-empty-suggestions">' + pills + '</div>' +
        '</div>';
    }
  
    /* ============================================
       RENDER: RESULTS GRID
    ============================================ */
  
    function renderResults(tools, query) {
      const fragment = document.createDocumentFragment();
      const wrapper  = document.createElement('div');

      if (typeof P50Renderers === 'undefined') {
        console.error('[search-page] P50Renderers not loaded');
        resultsGrid.innerHTML =
          '<div class="search-empty" style="grid-column:1/-1">' +
            '<p class="search-empty-desc">Search UI failed to load. Please refresh.</p>' +
          '</div>';
        return;
      }

      /* Build all card HTML as a string then set once */
      let html = '';
      tools.forEach(function (tool) {
        let card = P50Renderers.toolCard(tool, 'search');
        /* Apply highlight to title only */
        card = highlightQuery(card, query);
        html += card;
      });
  
      wrapper.innerHTML = html;
      /* Move children to fragment */
      while (wrapper.firstChild) {
        fragment.appendChild(wrapper.firstChild);
      }
  
      resultsGrid.innerHTML = '';
      resultsGrid.appendChild(fragment);
  
      /* Trigger fade-in animation */
      window.dispatchEvent(new CustomEvent('p50:contentLoaded'));
    }
  
    /* ============================================
       RENDER: RELATED CATEGORIES
    ============================================ */
  
    function renderRelatedCategories() {
      if (!relatedGrid) return;
  
      let html = '';
      _categories.forEach(function (cat) {
        var catIconSvg = window.P50Icons ? P50Icons.svg(cat.icon || 'wrench', 32) : '';
        html +=
          '<a href="/tools/' + cat.slug + '/" class="search-related-card fade-in" role="listitem"' +
            ' aria-label="' + escHtml(cat.name) + ' — ' + cat.toolCount + ' tools">' +
            '<div class="search-related-icon" style="--cat-color:' + cat.color + '" aria-hidden="true">' +
              catIconSvg +
            '</div>' +
            '<div class="search-related-name">' + escHtml(cat.name) + '</div>' +
          '</a>';
      });
  
      relatedGrid.innerHTML = html;
    }
  
    /* ============================================
       MAIN SEARCH RUNNER
       Called on: init, every input event (debounced),
                  clear button, popstate.
    ============================================ */
  
    function runSearch(query) {
      query = (query || '').trim();
  
      /* Sync input value */
      if (searchInput.value !== query) {
        searchInput.value = query;
      }
  
      /* Clear button visibility */
      clearBtn.classList.toggle('visible', query.length > 0);
  
      /* URL + meta */
      setQueryInURL(query);
  
      if (!query) {
        renderResultsHeader('', 0);
        renderInitialState();
        updateDocMeta('', 0);
        return;
      }
  
      /* Run scored search */
      const results = scoreTools(query);
  
      renderResultsHeader(query, results.length);
      updateDocMeta(query, results.length);
  
      if (results.length === 0) {
        renderEmptyState(query);
      } else {
        renderResults(results, query);
      }
  
      /* Save to history */
      if (window.P50Storage) P50Storage.addSearchHistory(query);
    }

    /* Delegate to shared utility — no local duplicate needed */
    var escHtml = P50Utils.escHtml.bind(P50Utils);

    /* ============================================
       EVENT WIRING
    ============================================ */
  
    function wireEvents() {
      /* Live search input with debounce */
      searchInput.addEventListener('input', function () {
        clearTimeout(_debounceTimer);
        _debounceTimer = setTimeout(function () {
          runSearch(searchInput.value);
        }, DEBOUNCE_MS);
      });
  
      /* Enter key — run immediately */
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          clearTimeout(_debounceTimer);
          runSearch(searchInput.value);
        }
        if (e.key === 'Escape') {
          searchInput.blur();
        }
      });
  
      /* Clear button */
      clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        runSearch('');
        searchInput.focus();
      });
  
      /* "/" shortcut — focus the main search input */
      document.addEventListener('keydown', function (e) {
        if (e.key === '/' && document.activeElement !== searchInput &&
            document.activeElement.tagName !== 'INPUT') {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      });
  
      /* Browser back/forward (popstate) — re-read URL */
      window.addEventListener('popstate', function () {
        runSearch(getQueryFromURL());
      });
    }
  
    /* ============================================
       INIT
    ============================================ */
  
    async function init() {
      /* 1. Fetch data */
      let data;
      try {
        data = await P50Utils.fetchData();
      } catch (err) {
        console.error('[search-page] Failed to load tools.json:', err.message);
        resultsGrid.innerHTML =
          '<div class="search-empty" style="grid-column:1/-1">' +
            '<div class="search-empty-icon">' + (window.P50Icons ? P50Icons.svg('alert-triangle', 48) : '') + '</div>' +
            '<h2 class="search-empty-title">Could not load tools</h2>' +
            '<p class="search-empty-desc">Please refresh and try again.</p>' +
          '</div>';
        return;
      }
  
      /* 2. Cache data */
      _allTools   = data.allTools   || [];
      _categories = (data.categories || []).map(function (c) {
        return {
          id:        c.id,
          name:      c.name,
          icon:      c.icon,
          color:     c.color,
          toolCount: c.toolCount,
          slug:      c.slug || c.link.replace(/.*\/tools\//, '').replace(/\/$/, '')
        };
      });
  
      /* 3. Wire events */
      wireEvents();
  
      /* 4. Render related categories (always shown) */
      renderRelatedCategories();
  
      /* 5. Run initial search from URL */
      const initialQuery = getQueryFromURL();
      runSearch(initialQuery);
  
      /* 6. Auto-focus input if no query */
      if (!initialQuery) {
        searchInput.focus();
      }
  
      /* 7. Footer year */
      const yearEl = document.getElementById('footer-year');
      if (yearEl) yearEl.textContent = new Date().getFullYear();
    }
  
    /* Run */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
  })();