/* ============================================
   SEARCH.JS — Project 50
   Header autocomplete dropdown + navigation.

   SCOPE (deliberately narrow)
   ────────────────────────────
   This file ONLY handles:
     1. Header search dropdown suggestions
     2. Keyboard "/" shortcut → focus header input
     3. Navigation to /search/?q= on Enter

   It does NOT:
     - Render search result pages
     - Score or rank tools (full scoring is in search-page.js)

   The dedicated search results page is handled by:
     scripts/search-page.js
============================================ */

(function () {
  'use strict';

  const MAX_DROPDOWN = 7;

  let _allTools = [];

  /* Delegate to shared utility — no local copy needed */
  var escHtml = P50Utils.escHtml.bind(P50Utils);

  function getCatMeta(categoryId) {
    if (window.P50Categories && P50Categories.get) return P50Categories.get(categoryId);
    return { label: categoryId, icon: 'wrench', color: '#3b82f6' };
  }

  function iconSvg(key, size) {
    if (window.P50Icons) return P50Icons.svg(key || 'wrench', size || 18);
    return '';
  }

  /* ============================================
     DATA FETCH
     Uses P50Utils.fetchData() — root-relative,
     works from any page depth without path retries.
  ============================================ */
  /* Re-wire header search (called on init + after partials) */
  function tryWireHeaderSearch() {
    var input = document.getElementById('header-search');
    var sugg  = document.getElementById('header-suggestions');
    if (input && !input._searchWired) {
      setupInput(input, sugg);
      input._searchWired = true;
    }
  }

  async function loadData() {
    try {
      const data = await P50Utils.fetchData();
      _allTools = data.allTools || [];
    } catch (_) {
      console.warn('[search] Could not load tools.json');
    }
  }

  /* ============================================
     FILTER
     Simple substring match for the dropdown.
     Full scored search is in search-page.js.
  ============================================ */
  function filterTools(query) {
    if (!query || query.trim().length < 1) return [];
    const q = query.trim().toLowerCase();
    return _allTools.filter(function (t) {
      const name = (t.name || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const tags = (t.tags || []).join(' ').toLowerCase();
      const cat  = (t.category || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || tags.includes(q) || cat.includes(q);
    }).slice(0, MAX_DROPDOWN);
  }

  /* ============================================
     HIGHLIGHT
  ============================================ */
  function highlight(text, query) {
    if (!query) return escHtml(text);
    const q = query.trim();
    const rex = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return escHtml(text).replace(rex,
      '<mark style="background:rgba(59,130,246,0.22);color:inherit;border-radius:2px;padding:0 1px">$1</mark>');
  }

  /* ============================================
     NAVIGATE TO SEARCH PAGE
  ============================================ */
  function navigateToSearch(query) {
    if (!query || !query.trim()) return;
    if (window.P50Storage) P50Storage.addSearchHistory(query.trim());
    window.location.href = '/search/?q=' + encodeURIComponent(query.trim());
  }

  function clearRecentSearches() {
    if (window.P50Storage) P50Storage.clearSearchHistory();

    const headerInput = document.getElementById('header-search');
    const heroInput   = document.getElementById('hero-search');
    const headerEl    = document.getElementById('header-suggestions');
    const heroEl      = document.getElementById('hero-suggestions');

    renderSuggestions(headerEl, headerInput ? headerInput.value : '');
    renderSuggestions(heroEl, heroInput ? heroInput.value : '');

    const emptyQuery = !(headerInput && headerInput.value.trim()) &&
      !(heroInput && heroInput.value.trim());
    if (emptyQuery) {
      if (headerEl) headerEl.classList.remove('open');
      if (heroEl) heroEl.classList.remove('open');
    }
  }

  /* ============================================
     RENDER SUGGESTIONS DROPDOWN
  ============================================ */
  function renderSuggestions(container, query) {
    if (!container) return;

    const results = filterTools(query);
    const history = window.P50Storage ? P50Storage.getSearchHistory() : [];
    let html = '';

    if (!query || query.trim().length < 1) {
      /* Show recent searches */
      if (history.length > 0) {
        html +=
          '<div class="suggestion-section">' +
            '<div class="suggestion-section-head">' +
              '<p class="suggestion-label">Recent</p>' +
              '<button type="button" class="suggestion-clear-btn" data-action="clear-history" aria-label="Clear recent searches">Clear</button>' +
            '</div>';
        history.slice(0, 4).forEach(function (h) {
          html +=
            '<div class="suggestion-item" role="option" data-query="' + escHtml(h) + '" tabindex="-1">' +
              '<span class="suggestion-item-icon">' + iconSvg('clock', 18) + '</span>' +
              '<span class="suggestion-item-name">' + escHtml(h) + '</span>' +
            '</div>';
        });
        html += '</div>';
      }
    } else if (results.length === 0) {
      html =
        '<div class="search-no-results">' +
          'No results for "<strong>' + escHtml(query) + '</strong>" — ' +
          '<a href="/search/?q=' + encodeURIComponent(query) + '" style="color:var(--color-primary)">see all</a>' +
        '</div>';
    } else {
      html += '<div class="suggestion-section"><p class="suggestion-label">Tools</p>';
      results.forEach(function (tool) {
        html +=
          '<a class="suggestion-item" href="' + escHtml(tool.link) + '" role="option" tabindex="-1">' +
            '<span class="suggestion-item-icon">' + iconSvg(tool.icon || getCatMeta(tool.category).icon, 18) + '</span>' +
            '<span class="suggestion-item-name">' + highlight(tool.name, query) + '</span>' +
            '<span class="suggestion-item-cat">' + escHtml(getCatMeta(tool.category).label) + '</span>' +
          '</a>';
      });
      html += '</div>';

      /* "See all results" link at bottom */
      html +=
        '<div class="suggestion-section" style="border-top:1px solid var(--color-border);padding-top:6px">' +
          '<a class="suggestion-item" href="/search/?q=' + encodeURIComponent(query) + '">' +
            '<span class="suggestion-item-icon">' + iconSvg('search', 18) + '</span>' +
            '<span class="suggestion-item-name">See all results for "' + escHtml(query) + '"</span>' +
          '</a>' +
        '</div>';
    }

    container.innerHTML = html;

    /* Wire history item clicks */
    container.querySelectorAll('[data-query]').forEach(function (item) {
      item.addEventListener('click', function () {
        navigateToSearch(item.dataset.query);
      });
    });

    container.querySelectorAll('[data-action="clear-history"]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        clearRecentSearches();
      });
    });
  }

  /* ============================================
     SETUP INPUT
     Binds autocomplete behaviour to a search input.
  ============================================ */
  function setupInput(inputEl, suggestionsEl) {
    if (!inputEl) return;

    /* ---- Resolve sibling kbd badge and clear button ---- */
    var wrap    = inputEl.closest('.header-search');
    var kbdEl   = wrap ? wrap.querySelector('.header-search-kbd')   : null;
    var clearEl = wrap ? wrap.querySelector('.header-search-clear') : null;

    /* Toggle kbd visibility and clear button based on input value */
    function syncClearState() {
      var hasVal = inputEl.value.length > 0;
      if (kbdEl)   { kbdEl.style.display   = hasVal ? 'none' : ''; }
      if (clearEl) { clearEl.style.display  = hasVal ? 'flex' : 'none'; }
    }

    /* Clear button click */
    if (clearEl) {
      clearEl.addEventListener('click', function () {
        inputEl.value = '';
        syncClearState();
        if (suggestionsEl) suggestionsEl.classList.remove('open');
        inputEl.focus();
      });
    }

    let debounceTimer;

    inputEl.addEventListener('input', function () {
      syncClearState();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        const q = inputEl.value;
        renderSuggestions(suggestionsEl, q);
        if (suggestionsEl) suggestionsEl.classList.add('open');
      }, 140);
    });

    inputEl.addEventListener('focus', function () {
      renderSuggestions(suggestionsEl, inputEl.value);
      if (suggestionsEl) suggestionsEl.classList.add('open');
    });

    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        const q = inputEl.value.trim();
        if (q) navigateToSearch(q);
        if (suggestionsEl) suggestionsEl.classList.remove('open');
      }
      if (e.key === 'Escape' && suggestionsEl) {
        suggestionsEl.classList.remove('open');
        inputEl.blur();
      }
    });

    document.addEventListener('click', function (e) {
      if (suggestionsEl &&
          !inputEl.contains(e.target) &&
          !suggestionsEl.contains(e.target)) {
        suggestionsEl.classList.remove('open');
      }
    });
  }

  /* ============================================
     "/" SHORTCUT — focus header search
     (not active when user is typing in any input)
  ============================================ */
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        document.activeElement.tagName !== 'SELECT') {
      e.preventDefault();
      const headerInput = document.getElementById('header-search');
      if (headerInput) {
        headerInput.focus();
        headerInput.select();
      }
    }
  });

  /* ============================================
     HERO SEARCH — Search button → /search/
     Live suggestions wired in init via setupInput().
  ============================================ */
  const heroBtn   = document.getElementById('hero-search-btn');
  const heroInput = document.getElementById('hero-search');

  if (heroBtn && heroInput) {
    heroBtn.addEventListener('click', function () {
      navigateToSearch(heroInput.value);
    });
  }

  /* ============================================
     INIT
  ============================================ */
  /* Wire header search after data loads */
  loadData().then(function () {
    tryWireHeaderSearch();
    setupInput(
      document.getElementById('hero-search'),
      document.getElementById('hero-suggestions')
    );
  });

  /* Re-wire if header arrives via partial after data already loaded */
  window.addEventListener('p50:partialsReady', function () {
    if (_allTools.length) tryWireHeaderSearch();
  });

})();
/* ============================================
   NOTE (Phase 2 addition):
   search.js already runs after DOMContentLoaded
   via defer. When partials.js injects the header,
   the p50:partialsReady event fires synchronously
   after injection. search.js data is cached at
   that point so re-wiring is cheap.
============================================ */
