/* ============================================
   ICON-MAP.JS — Project 50
   Maps each tool ID to a P50Icons key.

   Exposes: window.P50IconMap

   USAGE:
     P50IconMap.forTool('bmi-calculator')  → 'scale'
     P50IconMap.forCat('health-fitness')   → 'activity'

   LOAD ORDER: after icons.js, before categories.js,
   renderers.js, search.js, search-page.js.
============================================ */

(function (global) {
  'use strict';

  /* ---- Category icon mapping ---- */
  var CAT_ICONS = {
    'health-fitness': 'activity',
    'student-tools':  'graduation-cap',
    'utility-tools':  'wrench',
    'finance-tools':  'wallet',
    'creator-tools':  'palette',
  };

  /* ---- Tool icon mapping (by tool id) ---- */
  var TOOL_ICONS = {
    /* Health & Fitness */
    'bmi-calculator':   'scale',
    'daily-calorie-planner': 'salad',
    'body-fat-calculator': 'ruler',
    'water-intake':     'droplets',
    'water-intake-calculator': 'droplets',
    'body-fat':         'ruler',
    'ideal-weight':     'target',
    'macro-calculator': 'beef',
    'calorie-burn-calculator': 'activity',
    'tdee-calculator':        'trending-up',
    'protein-calculator':     'beef',
    'target-weight-timeline-calculator': 'trending-up',
    'ideal-weight-calculator': 'target',
    'heart-rate':       'heart-pulse',
    'sleep-calculator': 'moon',
    'running-pace':     'footprints',
    'step-counter':     'steps',

    /* Student Tools */
    'sgpa-calculator':    'bar-chart-2',
    'cgpa-calculator':    'graduation-cap',
    'attendance-calculator': 'calendar-check',
    'marks-percentage-calculator': 'percent',
    'gpa-calculator':     'bar-chart-2',
    'grade-calculator':   'calculator',
    'grade-required-marks-calculator': 'calculator',
    'cgpa-percentage-converter': 'arrow-left-right',
    'study-hours-exam-planner': 'calendar-clock',
    'target-cgpa-calculator': 'target',
    'pomodoro-timer':     'timer',
    'word-counter':       'file-text',
    'essay-outline':      'layout-list',
    'citation-generator': 'book-open',
    'note-taker':         'pencil',
    'study-planner':      'calendar',
    'flashcard-maker':    'layers',

    /* Utility Tools */
    'password-generator': 'shield',
    'unit-converter':     'refresh-cw',
    'age-calculator':     'cake',
    'date-calculator':    'calendar-days',
    'qr-generator':       'qr-code',
    'base64-encoder':     'code',
    'json-formatter':     'braces',
    'ip-lookup':          'globe',
    'random-number':      'dice-5',
    'text-case':          'type',

    /* Finance Tools */
    'emi-calculator':      'landmark',
    'sip-calculator':      'trending-up',
    'tax-calculator':      'receipt',
    'compound-interest':   'percent',
    'budget-planner':      'briefcase',
    'salary-calculator':   'banknote',
    'currency-converter':  'arrow-left-right',
    'tip-calculator':      'utensils',
    'discount-calculator': 'tag',
    'inflation-calculator':'trending-down',

    /* Creator Tools */
    'color-palette':       'pipette',
    'font-pairer':         'text-cursor-input',
    'gradient-maker':      'blend',
    'image-resizer':       'image',
    'aspect-ratio':        'maximize-2',
    'social-sizes':        'layout',
    'meta-tag-generator':  'tags',
    'lorem-ipsum':         'align-left',
    'contrast-checker':    'contrast',
    'icon-finder':         'shapes',
  };

  /**
   * Get the icon key for a tool id.
   * @param {string} toolId
   * @returns {string} P50Icons key
   */
  function forTool(toolId) {
    return TOOL_ICONS[toolId] || 'wrench';
  }

  /**
   * Get the icon key for a category id.
   * @param {string} catId
   * @returns {string} P50Icons key
   */
  function forCat(catId) {
    return CAT_ICONS[catId] || 'wrench';
  }

  global.P50IconMap = {
    forTool: forTool,
    forCat:  forCat,
    _tools:  TOOL_ICONS,  /* for debugging */
    _cats:   CAT_ICONS,
  };

})(window);
