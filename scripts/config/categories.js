/* ============================================
   CATEGORIES.JS — Project 50
   Single source of truth for category metadata.

   Exposes: window.P50Categories

   DATA CONTRACT
   ─────────────
   Each entry keyed by category id:
   {
     id:    string  — "health-fitness"
     label: string  — "Health & Fitness"
     icon:  string  — P50Icons key, e.g. "activity"
     color: string  — "#10b981"
     slug:  string  — "health"
     link:  string  — "/tools/health/"
   }

   Usage examples:
     P50Categories['health-fitness'].label  → "Health & Fitness"
     P50Categories['student-tools'].icon    → "graduation-cap"
     P50Categories['finance-tools'].color   → "#8b5cf6"
     Object.values(P50Categories)           → all entries as array

   LOAD ORDER: after icons.js and icon-map.js, before
   renderers.js, search.js, search-page.js, category-page.js.
============================================ */

(function (global) {
  'use strict';

  var CATEGORIES = {
    'health-fitness': {
      id:    'health-fitness',
      label: 'Health & Fitness',
      icon:  'activity',
      color: '#10b981',
      slug:  'health',
      link:  '/tools/health/'
    },
    'student-tools': {
      id:    'student-tools',
      label: 'Student Tools',
      icon:  'graduation-cap',
      color: '#3b82f6',
      slug:  'student',
      link:  '/tools/student/'
    },
    'utility-tools': {
      id:    'utility-tools',
      label: 'Utility Tools',
      icon:  'wrench',
      color: '#f59e0b',
      slug:  'utility',
      link:  '/tools/utility/'
    },
    'finance-tools': {
      id:    'finance-tools',
      label: 'Finance Tools',
      icon:  'wallet',
      color: '#8b5cf6',
      slug:  'finance',
      link:  '/tools/finance/'
    },
    'creator-tools': {
      id:    'creator-tools',
      label: 'Creator Tools',
      icon:  'palette',
      color: '#ec4899',
      slug:  'creator',
      link:  '/tools/creator/'
    }
  };

  /* ---- Safe lookup with fallback ---- */
  function get(id) {
    return CATEGORIES[id] || {
      id:    id,
      label: id,
      icon:  'wrench',
      color: '#3b82f6',
      slug:  id,
      link:  '/tools/' + id + '/'
    };
  }

  global.P50Categories = CATEGORIES;

  /* Attach helper directly on the object for convenience */
  global.P50Categories.get = get;

})(window);
