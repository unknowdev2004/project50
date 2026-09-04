/* ============================================
   STORAGE.JS — Project 50
   localStorage helpers

   EXPOSES: window.P50Storage
   NAMING: follows the P50* global convention.

   window.Storage alias kept for backward compat
   during Phase 1.6 — will be removed in Phase 2.

   LOAD ORDER: synchronous, before theme.js.
============================================ */

const P50Storage = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },

  /* Search history helpers */
  getSearchHistory() {
    return this.get('p50_search_history', []);
  },

  addSearchHistory(query) {
    if (!query || query.trim().length < 2) return;
    const history = this.getSearchHistory();
    const q = query.trim().toLowerCase();
    const filtered = history.filter(h => h !== q);
    filtered.unshift(q);
    this.set('p50_search_history', filtered.slice(0, 8));
  },

  clearSearchHistory() {
    this.remove('p50_search_history');
  }
};

window.P50Storage = P50Storage;
/* Backward-compat alias — remove in Phase 2 once all
   callers (theme.js, search.js, search-page.js) are
   updated to use P50Storage directly. */
window.Storage = P50Storage;
