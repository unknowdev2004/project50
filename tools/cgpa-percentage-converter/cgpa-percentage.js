/* ============================================
   CGPA-PERCENTAGE.JS — Project 50
   CGPA & Percentage Converter — 2 tabs, 1 calculation engine

   FORMULA MODEL (safe linear formulas only — no eval, no
   arbitrary expressions):

     Percentage = (CGPA × multiplier) + offset

   REVERSE:

     CGPA = (Percentage − offset) ÷ multiplier
     (unavailable when multiplier === 0)

   Full floating-point precision internally. Round only for display.

   STORAGE KEY: p50_cgpa_percentage_converter
   Saves: activeMode, methodId, cgpaScale, customFormula,
   each tab's input value, and showComparison.
   Never saves results, validation messages, or reference tables.
   300ms debounce. Reset clears only the active tab's input.
============================================ */

(function () {
  'use strict';

  /* ============================================
     CONSTANTS
  ============================================ */

  var STORAGE_KEY = 'p50_cgpa_percentage_converter';
  var SAVE_DEBOUNCE_MS = 300;
  var EPSILON = 1e-9;

  var esc = (window.P50Utils && window.P50Utils.escapeAttr) ? window.P50Utils.escapeAttr : function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  var ICON_CHECK =
    '<svg class="cpc-insight-icon cpc-insight-icon--positive" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>';

  var ICON_INFO =
    '<svg class="cpc-insight-icon cpc-insight-icon--neutral" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

  var ICON_WARN =
    '<svg class="cpc-insight-icon cpc-insight-icon--warning" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>' +
    '<path d="M12 9v4"/><path d="M12 17h.01"/></svg>';

  /* ============================================
     PRESET / FORMULA DATA
     Verified presets are only included where an authoritative
     source and stated applicability exist. See SEO section
     "Why Different Institutions Use Different Formulas" for
     the caveats shown to the user.
  ============================================ */

  var VERIFIED_PRESETS = [
    {
      id: 'cbse',
      name: 'CBSE — Indicative',
      type: 'verified',
      multiplier: 9.5,
      offset: 0,
      cgpaScale: 10,
      sourceName: 'CBSE (Central Board of Secondary Education) — official circular',
      sourceUrl: 'https://www.cbse.gov.in/circulars/cir24-2010.pdf',
      applicability: 'A widely used indicative formula for converting CBSE Class X/XII CGPA to a percentage. CBSE\u2019s own circular describes this as an approximate figure for general reference — it is not a certified marks equivalence.',
      notes: 'Treat this as indicative only. It is not a substitute for your official CBSE marksheet or any subject-wise, moderation-based marks your school or board issues.'
    },
    {
      id: 'anna-university',
      name: 'Anna University — CGPA × 10',
      type: 'verified',
      multiplier: 10,
      offset: 0,
      cgpaScale: 10,
      sourceName: 'Anna University — Office of the Controller of Examinations (ACOE)',
      sourceUrl: 'https://acoe.annauniv.edu/download_forms/student_forms/CGPA_TO_PERCENTAGE_CONVERSION.pdf',
      applicability: 'Reported for UG/PG programmes under Regulations R-2013, R-2017, R-2019 and R-2021. Some third-party sources describe a different, offset-based formula for specific cohorts — always confirm against your own regulation\u2019s official notification.',
      notes: 'For admissions, employment or visa purposes, request an official conversion certificate from Anna University rather than relying only on a self-calculated figure.'
    }
  ];

  var GENERAL_PRESETS = [
    { id: 'general-9.5', name: 'CGPA \u00D7 9.5', type: 'general', multiplier: 9.5, offset: 0 },
    { id: 'general-10',  name: 'CGPA \u00D7 10',  type: 'general', multiplier: 10,  offset: 0 }
  ];

  var ALL_PRESETS = VERIFIED_PRESETS.concat(GENERAL_PRESETS);

  function findPreset(id) {
    for (var i = 0; i < ALL_PRESETS.length; i++) {
      if (ALL_PRESETS[i].id === id) return ALL_PRESETS[i];
    }
    return null;
  }

  /* ============================================
     STATE
  ============================================ */

  var state = {
    activeMode: 'cgpa-to-percentage',
    methodId: 'cbse',
    cgpaScale: '10',
    cgpaToPercentage: { cgpa: '' },
    percentageToCgpa: { percentage: '' },
    customFormula: { multiplier: '', offsetSign: '+', offsetMagnitude: '' },
    showComparison: false,
    showReference: false
  };

  /* ============================================
     FORMATTING
  ============================================ */

  function fmtPct(n) {
    if (!isFinite(n)) return '\u2014';
    return (Math.round(n * 100) / 100).toFixed(2) + '%';
  }

  function fmtNum(n) {
    if (!isFinite(n)) return '\u2014';
    var r = Math.round(n * 100) / 100;
    return (r % 1 === 0) ? String(r) : r.toFixed(2);
  }

  function fmtCgpa(n) {
    if (!isFinite(n)) return '\u2014';
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  function fmtFormula(f) {
    var m = fmtNum(f.multiplier);
    var offsetPart = '';
    if (f.offset > EPSILON) offsetPart = ' + ' + fmtNum(f.offset);
    else if (f.offset < -EPSILON) offsetPart = ' \u2212 ' + fmtNum(Math.abs(f.offset));
    return 'Percentage = (CGPA \u00D7 ' + m + ')' + offsetPart;
  }

  /* ============================================
     CALCULATION ENGINE — centralised, no duplication
  ============================================ */

  function calculatePercentage(cgpa, formula) {
    return (cgpa * formula.multiplier) + formula.offset;
  }

  function isReversible(formula) {
    return isFinite(formula.multiplier) && Math.abs(formula.multiplier) > EPSILON;
  }

  function calculateCgpa(percentage, formula) {
    if (!isReversible(formula)) return NaN;
    return (percentage - formula.offset) / formula.multiplier;
  }

  function compareFormulas(value, formulas, direction) {
    return formulas.map(function (f) {
      var result = (direction === 'cgpa-to-percentage')
        ? calculatePercentage(value, f)
        : calculateCgpa(value, f);
      return {
        id: f.id,
        name: f.name,
        type: f.type,
        formula: f,
        reversible: isReversible(f),
        result: result
      };
    });
  }

  function generateReferenceTable(formula, scaleMax) {
    var rows = [];
    var step = scaleMax / 20;
    for (var v = scaleMax; v >= -EPSILON; v -= step) {
      var cgpa = Math.max(0, Math.round(v * 100) / 100);
      rows.push({ cgpa: cgpa, percentage: calculatePercentage(cgpa, formula) });
      if (rows.length >= 21) break;
    }
    return rows;
  }

  /* ============================================
     CURRENT FORMULA RESOLUTION
  ============================================ */

  function getCustomMultiplier() {
    var m = parseFloat(state.customFormula.multiplier);
    return isFinite(m) ? m : NaN;
  }

  function getCustomOffset() {
    var mag = parseFloat(state.customFormula.offsetMagnitude);
    if (!isFinite(mag)) mag = 0;
    return state.customFormula.offsetSign === '-' ? -mag : mag;
  }

  function getCurrentFormula() {
    if (state.methodId === 'custom') {
      return {
        id: 'custom',
        name: 'Custom Formula',
        type: 'custom',
        multiplier: getCustomMultiplier(),
        offset: getCustomOffset()
      };
    }
    var preset = findPreset(state.methodId);
    if (!preset) preset = VERIFIED_PRESETS[0];
    return preset;
  }

  function getCurrentScaleMax() {
    return getScaleForFormula(findPreset(state.methodId) || { type: state.methodId === 'custom' ? 'custom' : null });
  }

  /* Scale to validate a given formula's CGPA domain against — a verified
     preset uses its own fixed scale; general/custom formulas use the
     shared scale selector. Needed so "Compare Other Conversion Methods"
     checks each alternative against ITS OWN valid scale, not the
     currently active method's scale. */
  function getScaleForFormula(preset) {
    if (preset && preset.type === 'verified' && preset.cgpaScale) return preset.cgpaScale;
    return parseFloat(state.cgpaScale) || 10;
  }

  /* ============================================
     PERSISTENCE
  ============================================ */

  var _saveTimer = null;

  function saveState() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function () {
      try {
        P50Storage.set(STORAGE_KEY, {
          activeMode: state.activeMode,
          methodId: state.methodId,
          cgpaScale: state.cgpaScale,
          cgpaToPercentage: state.cgpaToPercentage,
          percentageToCgpa: state.percentageToCgpa,
          customFormula: state.customFormula,
          showComparison: state.showComparison,
          showReference: state.showReference
        });
      } catch (e) {}
    }, SAVE_DEBOUNCE_MS);
  }

  function loadState() {
    try {
      var saved = P50Storage.get(STORAGE_KEY, null);
      if (!saved || typeof saved !== 'object') return null;
      return saved;
    } catch (e) {
      return null;
    }
  }

  /* ============================================
     TABS — mirrors the latest polished Project 50 tab
     implementation (Grade & Required Marks Calculator),
     extended with a centralized positionActiveTab() helper.

     Unlike the original pattern (which skipped positioning
     entirely on restore), this tool ALWAYS positions the
     active tab so it is fully visible — instantly (no
     animation) on initial restore, smoothly on user-initiated
     switches. This is the corrected behavior per the tab
     persistence fix and should be the template for future
     tab-based tools.
  ============================================ */

  var MODES = ['cgpa-to-percentage', 'percentage-to-cgpa'];
  var tablist  = document.querySelector('.cpc-mode-selector');
  var tabEls   = {};
  var panelEls = {};
  MODES.forEach(function (m) {
    tabEls[m]   = document.getElementById('cpc-tab-' + m);
    panelEls[m] = document.getElementById('cpc-panel-' + m);
  });

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /**
   * positionActiveTab(mode, options)
   * Centralized tab-scroll positioning. Single source of truth
   * for both initial restoration and user-driven switches, so
   * scroll logic is never duplicated in multiple handlers.
   *
   * @param {string} mode
   * @param {Object} [options]
   * @param {boolean} [options.instant=false] - force 'auto' (no
   *   animation) regardless of reduced-motion state. Used for
   *   initial page-load restoration so the tab is immediately
   *   visible without a distracting scroll animation.
   */
  function positionActiveTab(mode, options) {
    var tabEl = tabEls[mode];
    if (!tabEl || typeof tabEl.scrollIntoView !== 'function') return;
    var instant = !!(options && options.instant) || prefersReducedMotion();
    tabEl.scrollIntoView({
      behavior: instant ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }

  /**
   * @param {string} mode
   * @param {boolean} focusTab - move keyboard focus to the tab (arrow-key nav)
   * @param {boolean} [userInitiated=true] - false only on initial page load
   *   restore. The active tab is positioned either way — restore uses an
   *   instant (non-animated) position via requestAnimationFrame so it is
   *   already visible once the layout settles; user-initiated switches use
   *   a smooth scroll (unless reduced motion is enabled).
   */
  function switchMode(mode, focusTab, userInitiated) {
    if (MODES.indexOf(mode) === -1) return;
    if (userInitiated === undefined) userInitiated = true;
    state.activeMode = mode;

    MODES.forEach(function (m) {
      var isActive = m === mode;
      tabEls[m].setAttribute('aria-selected', isActive ? 'true' : 'false');
      tabEls[m].tabIndex = isActive ? 0 : -1;
      panelEls[m].hidden = !isActive;
    });

    if (focusTab) tabEls[mode].focus();

    if (userInitiated) {
      positionActiveTab(mode);
    } else {
      /* Initial restore: wait for a valid layout pass before
         positioning, so the tab bar's scrollable width is
         already correct (fixes the reload mis-positioning bug
         where the restored tab could be off-screen). No
         animation on this pass. */
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(function () {
          positionActiveTab(mode, { instant: true });
        });
      } else {
        positionActiveTab(mode, { instant: true });
      }
    }

    saveState();
  }

  MODES.forEach(function (m) {
    tabEls[m].addEventListener('click', function () {
      switchMode(m, false);
    });
  });

  tablist.addEventListener('keydown', function (e) {
    var currentIdx = MODES.indexOf(state.activeMode);
    var nextIdx = null;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (currentIdx + 1) % MODES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (currentIdx - 1 + MODES.length) % MODES.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = MODES.length - 1;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      switchMode(MODES[nextIdx], true);
    }
  });

  /* ============================================
     VALIDATION HELPERS
  ============================================ */

  function isBlank(v) {
    return v === '' || v === null || v === undefined;
  }

  function isValidNumber(n) {
    return typeof n === 'number' && !isNaN(n) && isFinite(n);
  }

  /* Output-domain validity — used both for the primary result and for
     each row in "Compare Other Conversion Methods", so an out-of-range
     alternative is never presented as a legitimate figure. */
  function isValidPercentageOutput(p) {
    return isValidNumber(p) && p >= -EPSILON && p <= 100 + EPSILON;
  }

  function isValidCgpaOutput(c, scaleMax) {
    return isValidNumber(c) && c >= -EPSILON && c <= scaleMax + EPSILON;
  }

  function markError(input) {
    if (input) {
      input.classList.add('cpc-input--error');
      input.focus();
    }
  }

  function showValidation(el, msg, input) {
    el.textContent = msg;
    el.hidden = false;
    if (input) markError(input);
  }

  function hideValidation(el) {
    el.hidden = true;
    el.textContent = '';
  }

  function renderInsightsInto(items, listEl, cardEl) {
    if (!items.length) { cardEl.hidden = true; return; }
    cardEl.hidden = false;
    listEl.innerHTML = items.map(function (item) {
      return '<li>' + item.icon + '<span>' + item.text + '</span></li>';
    }).join('');
  }

  function moveRelatedAfterResults(resultsEl) {
    var relatedWrap = document.getElementById('cpc-related-wrap');
    if (relatedWrap && resultsEl.nextElementSibling !== relatedWrap) {
      resultsEl.after(relatedWrap);
    }
  }

  function moveRelatedBackToWrap() {
    var toolWrap    = document.querySelector('.tool-wrap');
    var relatedWrap = document.getElementById('cpc-related-wrap');
    if (toolWrap && relatedWrap && toolWrap.lastElementChild !== relatedWrap) {
      toolWrap.appendChild(relatedWrap);
    }
  }

  /* ============================================
     METHOD SELECTOR / SCALE SELECTOR / CUSTOM BUILDER
     Shared across both tabs so the selected conversion
     method stays consistent when switching directions.
  ============================================ */

  var methodSelect   = document.getElementById('cpc-method-select');
  var scaleGroup      = document.getElementById('cpc-scale-group');
  var scaleButtons    = document.querySelectorAll('.cpc-scale-btn');
  var scaleFixedNote   = document.getElementById('cpc-scale-fixed-note');
  var methodInfoEl    = document.getElementById('cpc-method-info');
  var customBuilderEl = document.getElementById('cpc-custom-builder');
  var customMultInput  = document.getElementById('cpc-custom-multiplier');
  var customSignSelect = document.getElementById('cpc-custom-sign');
  var customMagInput   = document.getElementById('cpc-custom-magnitude');
  var customFormulaPreview = document.getElementById('cpc-custom-formula-preview');
  var customReverseNote    = document.getElementById('cpc-custom-reverse-note');
  var customValidationEl   = document.getElementById('cpc-custom-validation');

  function renderMethodInfo() {
    var preset = findPreset(state.methodId);

    if (state.methodId === 'custom') {
      methodInfoEl.innerHTML =
        '<p class="cpc-method-info-title">Custom calculation</p>' +
        '<p>This result uses the formula you build below. Verify that formula against your institution\u2019s official academic documentation.</p>';
      return;
    }

    if (preset && preset.type === 'verified') {
      var sourceRow = preset.sourceUrl
        ? '<dd>' + esc(preset.sourceName) + ' — ' +
          '<a href="' + esc(preset.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' +
          'View official source' +
          '<span class="cpc-external-icon" aria-hidden="true">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>' +
          '</span>' +
          '<span class="sr-only"> (opens in a new tab)</span>' +
          '</a></dd>'
        : '<dd>' + esc(preset.sourceName) + '</dd>';

      methodInfoEl.innerHTML =
        '<dl class="cpc-info-list">' +
          '<div><dt>Formula</dt><dd>' + esc(fmtFormula(preset)) + '</dd></div>' +
          '<div><dt>Source</dt>' + sourceRow + '</div>' +
          '<div><dt>Applicability</dt><dd>' + esc(preset.applicability) + '</dd></div>' +
        '</dl>' +
        (preset.notes ? '<p class="cpc-method-info-note">' + esc(preset.notes) + '</p>' : '');
      return;
    }

    if (preset && preset.type === 'general') {
      methodInfoEl.innerHTML =
        '<dl class="cpc-info-list">' +
          '<div><dt>Formula</dt><dd>' + esc(fmtFormula(preset)) + '</dd></div>' +
          '<div><dt>Type</dt><dd>General calculation</dd></div>' +
        '</dl>' +
        '<p class="cpc-method-info-note">Verify your institution\u2019s official conversion rule.</p>';
    }
  }

  function updateScaleUI() {
    var preset = findPreset(state.methodId);
    var isVerified = preset && preset.type === 'verified';

    scaleGroup.hidden = isVerified;
    scaleFixedNote.hidden = !isVerified;
    if (isVerified) {
      scaleFixedNote.textContent = 'Scale: ' + preset.cgpaScale + '-point (fixed by this preset)';
    }

    scaleButtons.forEach(function (btn) {
      var active = btn.dataset.scale === state.cgpaScale;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function updateCustomBuilderUI() {
    var isCustom = state.methodId === 'custom';
    customBuilderEl.hidden = !isCustom;
    if (!isCustom) return;

    var f = getCurrentFormula();
    customFormulaPreview.textContent = isValidNumber(f.multiplier)
      ? fmtFormula(f)
      : 'Enter a multiplier to see the formula.';

    if (!isValidNumber(f.multiplier)) {
      showValidation(customValidationEl, 'Enter a valid multiplier.');
    } else {
      hideValidation(customValidationEl);
    }

    customReverseNote.textContent = isReversible(f)
      ? 'CGPA = (Percentage \u2212 ' + fmtNum(f.offset) + ') \u00F7 ' + fmtNum(f.multiplier)
      : 'Reverse conversion unavailable for this formula.';
    customReverseNote.classList.toggle('cpc-reverse-note--warning', !isReversible(f));
  }

  function refreshMethodUI() {
    renderMethodInfo();
    updateScaleUI();
    updateCustomBuilderUI();
  }

  methodSelect.addEventListener('change', function () {
    state.methodId = methodSelect.value;
    refreshMethodUI();
    saveState();
  });

  scaleButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.cgpaScale = btn.dataset.scale;
      updateScaleUI();
      if (window.__cpcCgpaToPercentage) window.__cpcCgpaToPercentage.updateScaleHint();
      saveState();
    });
  });

  [customMultInput, customMagInput].forEach(function (input) {
    input.addEventListener('input', function () {
      state.customFormula.multiplier = customMultInput.value;
      state.customFormula.offsetMagnitude = customMagInput.value;
      updateCustomBuilderUI();
      saveState();
    });
    input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
  });

  customSignSelect.addEventListener('change', function () {
    state.customFormula.offsetSign = customSignSelect.value;
    updateCustomBuilderUI();
    saveState();
  });

  /* ============================================
     INSIGHTS BUILDERS
  ============================================ */

  function buildForwardInsights(formula, cgpa, percentage) {
    var items = [];
    if (formula.type === 'verified') {
      items.push({ icon: ICON_CHECK, text: 'This result uses the selected institution\u2019s published conversion rule.' });
    } else if (formula.type === 'general') {
      items.push({ icon: ICON_INFO, text: 'This is an indicative calculation. Your institution may use a different formula.' });
    } else {
      items.push({ icon: ICON_INFO, text: 'This result uses the formula you entered. Verify it against your institution\u2019s official documentation.' });
    }

    var altPct = calculatePercentage(cgpa, { multiplier: 10, offset: 0 });
    if (Math.abs(altPct - percentage) > 0.5) {
      items.push({ icon: ICON_WARN, text: 'Different conversion rules can produce different percentages from the same CGPA \u2014 always check which one your institution requires.' });
    }

    return items.slice(0, 3);
  }

  function buildReverseInsights(formula, percentage, cgpa) {
    var items = [];
    if (formula.type === 'verified') {
      items.push({ icon: ICON_CHECK, text: 'This result uses the selected institution\u2019s published conversion rule.' });
    } else if (formula.type === 'general') {
      items.push({ icon: ICON_INFO, text: 'This is an indicative calculation. Your institution may use a different formula.' });
    } else {
      items.push({ icon: ICON_INFO, text: 'This result uses the formula you entered. Verify it against your institution\u2019s official documentation.' });
    }
    items.push({ icon: ICON_INFO, text: 'Different conversion rules can produce different CGPA values from the same percentage.' });
    return items.slice(0, 3);
  }

  /* ============================================
     GLOBAL RESET
     Per spec: Reset clears the active input, restores the
     default method and default CGPA scale, resets the custom
     formula controls, clears validation, hides results/
     comparison/reference on both tabs, and clears this tool's
     stored state entirely (never affects other Project 50 tools).
  ============================================ */

  function resetAllTool() {
    state.methodId = 'cbse';
    state.cgpaScale = '10';
    state.customFormula = { multiplier: '', offsetSign: '+', offsetMagnitude: '' };
    state.showComparison = false;
    state.showReference = false;

    methodSelect.value = state.methodId;
    customMultInput.value = '';
    customSignSelect.value = '+';
    customMagInput.value = '';
    hideValidation(customValidationEl);
    refreshMethodUI();

    if (window.__cpcCgpaToPercentage) window.__cpcCgpaToPercentage.resetTab(true);
    if (window.__cpcPercentageToCgpa) window.__cpcPercentageToCgpa.resetTab(false);

    moveRelatedBackToWrap();

    try { P50Storage.remove(STORAGE_KEY); } catch (e) {}
  }

  /* ============================================================
     MODE 1 — CGPA → PERCENTAGE
  ============================================================ */

  (function cgpaToPercentageMode() {
    var input        = document.getElementById('cpc-cgpa-input');
    var validationEl = document.getElementById('cpc-cgpa-validation');
    var resultsEl    = document.getElementById('cpc-cgpa-results');
    var calcBtn      = document.getElementById('cpc-cgpa-calc-btn');
    var resetBtn     = document.getElementById('cpc-cgpa-reset-btn');
    var scaleHint    = document.getElementById('cpc-cgpa-scale-hint');

    var heroEl           = document.getElementById('cpc-cgpa-hero');
    var heroSubEl        = document.getElementById('cpc-cgpa-hero-sub');
    var detailInputEl    = document.getElementById('cpc-cgpa-detail-input');
    var detailMethodEl   = document.getElementById('cpc-cgpa-detail-method');
    var detailFormulaEl  = document.getElementById('cpc-cgpa-detail-formula');
    var detailResultEl   = document.getElementById('cpc-cgpa-detail-result');

    var compareToggle  = document.getElementById('cpc-cgpa-compare-toggle');
    var compareBody    = document.getElementById('cpc-cgpa-compare-body');
    var compareListEl  = document.getElementById('cpc-cgpa-compare-list');

    var refToggle = document.getElementById('cpc-cgpa-ref-toggle');
    var refBody   = document.getElementById('cpc-cgpa-ref-body');
    var refTableBody = document.getElementById('cpc-cgpa-ref-table-body');

    var insightsListEl = document.getElementById('cpc-cgpa-insights-list');
    var insightsCardEl = document.getElementById('cpc-cgpa-insights-card');

    function updateScaleHint() {
      var max = getCurrentScaleMax();
      scaleHint.textContent = '0\u2013' + fmtNum(max) + ' (' + fmtNum(max) + '-point scale)';
      input.max = String(max);
    }

    function clearErrors() {
      hideValidation(validationEl);
      input.classList.remove('cpc-input--error');
    }

    function renderComparison(cgpa) {
      var others = ALL_PRESETS.filter(function (f) { return f.id !== state.methodId; });
      var rows = compareFormulas(cgpa, others, 'cgpa-to-percentage');
      compareListEl.innerHTML = rows.map(function (r) {
        var valid = isValidPercentageOutput(r.result);
        var valueText = valid ? fmtPct(r.result) : 'Out of range';
        var valueCls = valid ? 'cpc-compare-card-value' : 'cpc-compare-card-value cpc-compare-card-value--invalid';
        return '<div class="cpc-compare-card">' +
          '<span class="cpc-compare-card-name">' + esc(r.name) + '</span>' +
          '<span class="' + valueCls + '">' + esc(valueText) + '</span>' +
        '</div>';
      }).join('') || '<p class="cpc-compare-empty">No other formulas to compare.</p>';
    }

    function renderReferenceTable(formula, scaleMax) {
      var rows = generateReferenceTable(formula, scaleMax);
      refTableBody.innerHTML = rows.map(function (r) {
        return '<tr><td>' + esc(fmtNum(r.cgpa)) + '</td><td>' + esc(fmtPct(r.percentage)) + '</td></tr>';
      }).join('');
    }

    function calculate() {
      clearErrors();
      var raw = input.value.trim();

      if (isBlank(raw)) {
        showValidation(validationEl, 'Enter your CGPA.', input);
        return;
      }

      var cgpa = parseFloat(raw);
      if (!isValidNumber(cgpa)) {
        showValidation(validationEl, 'Enter a valid CGPA.', input);
        return;
      }

      var max = getCurrentScaleMax();
      if (cgpa < 0) {
        showValidation(validationEl, 'CGPA cannot be negative.', input);
        return;
      }
      if (cgpa > max) {
        showValidation(validationEl, 'CGPA cannot be greater than ' + fmtNum(max) + '.', input);
        return;
      }

      var formula = getCurrentFormula();
      if (state.methodId === 'custom' && !isValidNumber(formula.multiplier)) {
        showValidation(validationEl, 'Enter a valid multiplier.', customMultInput);
        return;
      }

      state.cgpaToPercentage.cgpa = raw;
      saveState();

      var percentage = calculatePercentage(cgpa, formula);

      if (!isValidPercentageOutput(percentage)) {
        resultsEl.hidden = true;
        showValidation(validationEl, 'This formula produces a percentage outside the valid 0\u2013100% range for this CGPA.');
        return;
      }

      heroEl.textContent = fmtPct(percentage);
      heroSubEl.textContent = fmtNum(cgpa) + ' CGPA';

      detailInputEl.textContent = fmtNum(cgpa) + ' CGPA';
      detailMethodEl.textContent = formula.name;
      detailFormulaEl.textContent = fmtFormula(formula);
      detailResultEl.textContent = fmtPct(percentage);

      renderComparison(cgpa);
      renderReferenceTable(formula, max);

      var insights = buildForwardInsights(formula, cgpa, percentage);
      renderInsightsInto(insights, insightsListEl, insightsCardEl);

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetTab(focusAfter) {
      input.value = '';
      clearErrors();
      resultsEl.hidden = true;
      compareBody.hidden = true;
      compareToggle.setAttribute('aria-expanded', 'false');
      refBody.hidden = true;
      refToggle.setAttribute('aria-expanded', 'false');
      state.cgpaToPercentage = { cgpa: '' };
      if (focusAfter) input.focus();
    }

    input.addEventListener('input', function () {
      input.classList.remove('cpc-input--error');
      state.cgpaToPercentage.cgpa = input.value;
      saveState();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); calculate(); }
    });
    input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', function () { resetAllTool(); });

    compareToggle.addEventListener('click', function () {
      state.showComparison = !state.showComparison;
      compareToggle.setAttribute('aria-expanded', state.showComparison ? 'true' : 'false');
      compareBody.hidden = !state.showComparison;
      saveState();
    });

    refToggle.addEventListener('click', function () {
      state.showReference = !state.showReference;
      refToggle.setAttribute('aria-expanded', state.showReference ? 'true' : 'false');
      refBody.hidden = !state.showReference;
      saveState();
    });

    window.__cpcCgpaToPercentage = {
      restore: function (saved) {
        if (saved && saved.cgpa !== '' && saved.cgpa != null) input.value = saved.cgpa;
      },
      updateScaleHint: updateScaleHint,
      resetTab: resetTab
    };
  })();

  /* ============================================================
     MODE 2 — PERCENTAGE → CGPA
  ============================================================ */

  (function percentageToCgpaMode() {
    var input        = document.getElementById('cpc-pct-input');
    var validationEl = document.getElementById('cpc-pct-validation');
    var resultsEl    = document.getElementById('cpc-pct-results');
    var calcBtn      = document.getElementById('cpc-pct-calc-btn');
    var resetBtn     = document.getElementById('cpc-pct-reset-btn');
    var unavailableEl = document.getElementById('cpc-pct-unavailable-note');

    var heroEl          = document.getElementById('cpc-pct-hero');
    var heroSubEl       = document.getElementById('cpc-pct-hero-sub');
    var detailInputEl   = document.getElementById('cpc-pct-detail-input');
    var detailMethodEl  = document.getElementById('cpc-pct-detail-method');
    var detailFormulaEl = document.getElementById('cpc-pct-detail-formula');
    var detailResultEl  = document.getElementById('cpc-pct-detail-result');

    var compareToggle  = document.getElementById('cpc-pct-compare-toggle');
    var compareBody    = document.getElementById('cpc-pct-compare-body');
    var compareListEl  = document.getElementById('cpc-pct-compare-list');

    var refToggle = document.getElementById('cpc-pct-ref-toggle');
    var refBody   = document.getElementById('cpc-pct-ref-body');
    var refTableBody = document.getElementById('cpc-pct-ref-table-body');

    var insightsListEl = document.getElementById('cpc-pct-insights-list');
    var insightsCardEl = document.getElementById('cpc-pct-insights-card');

    function clearErrors() {
      hideValidation(validationEl);
      input.classList.remove('cpc-input--error');
    }

    function updateUnavailableNote() {
      var formula = getCurrentFormula();
      var reversible = isReversible(formula) && (state.methodId !== 'custom' || isValidNumber(formula.multiplier));
      unavailableEl.hidden = reversible;
      calcBtn.disabled = !reversible;
    }

    function renderComparison(percentage) {
      var others = ALL_PRESETS.filter(function (f) { return f.id !== state.methodId; });
      var rows = compareFormulas(percentage, others, 'percentage-to-cgpa');
      compareListEl.innerHTML = rows.map(function (r) {
        var valueText, valueCls = 'cpc-compare-card-value';
        if (!r.reversible) {
          valueText = 'Not reversible';
        } else if (!isValidCgpaOutput(r.result, getScaleForFormula(r.formula))) {
          valueText = 'Out of range';
          valueCls += ' cpc-compare-card-value--invalid';
        } else {
          valueText = fmtCgpa(r.result) + ' CGPA';
        }
        return '<div class="cpc-compare-card">' +
          '<span class="cpc-compare-card-name">' + esc(r.name) + '</span>' +
          '<span class="' + valueCls + '">' + esc(valueText) + '</span>' +
        '</div>';
      }).join('') || '<p class="cpc-compare-empty">No other formulas to compare.</p>';
    }

    function renderReferenceTable(formula, scaleMax) {
      var rows = generateReferenceTable(formula, scaleMax);
      refTableBody.innerHTML = rows.map(function (r) {
        return '<tr><td>' + esc(fmtNum(r.cgpa)) + '</td><td>' + esc(fmtPct(r.percentage)) + '</td></tr>';
      }).join('');
    }

    function calculate() {
      clearErrors();
      var raw = input.value.trim();

      if (isBlank(raw)) {
        showValidation(validationEl, 'Enter your percentage.', input);
        return;
      }

      var percentage = parseFloat(raw);
      if (!isValidNumber(percentage)) {
        showValidation(validationEl, 'Enter a valid percentage.', input);
        return;
      }
      if (percentage < 0 || percentage > 100) {
        showValidation(validationEl, 'Percentage must be between 0 and 100.', input);
        return;
      }

      var formula = getCurrentFormula();
      if (state.methodId === 'custom' && !isValidNumber(formula.multiplier)) {
        showValidation(validationEl, 'Enter a valid multiplier.', customMultInput);
        return;
      }
      if (!isReversible(formula)) {
        showValidation(validationEl, 'Reverse conversion is unavailable for this formula.');
        return;
      }

      state.percentageToCgpa.percentage = raw;
      saveState();

      var cgpa = calculateCgpa(percentage, formula);
      var max = getCurrentScaleMax();

      if (!isValidCgpaOutput(cgpa, max)) {
        resultsEl.hidden = true;
        showValidation(validationEl, 'This formula produces a CGPA outside the selected scale.');
        return;
      }

      heroEl.textContent = fmtCgpa(cgpa);
      heroSubEl.textContent = fmtNum(percentage) + '%';

      detailInputEl.textContent = fmtNum(percentage) + '%';
      detailMethodEl.textContent = formula.name;
      detailFormulaEl.textContent = fmtFormula(formula);
      detailResultEl.textContent = fmtCgpa(cgpa) + ' CGPA';

      renderComparison(percentage);
      renderReferenceTable(formula, max);

      var insights = buildReverseInsights(formula, percentage, cgpa);
      renderInsightsInto(insights, insightsListEl, insightsCardEl);

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetTab(focusAfter) {
      input.value = '';
      clearErrors();
      resultsEl.hidden = true;
      compareBody.hidden = true;
      compareToggle.setAttribute('aria-expanded', 'false');
      refBody.hidden = true;
      refToggle.setAttribute('aria-expanded', 'false');
      state.percentageToCgpa = { percentage: '' };
      if (focusAfter) input.focus();
    }

    input.addEventListener('input', function () {
      input.classList.remove('cpc-input--error');
      state.percentageToCgpa.percentage = input.value;
      saveState();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); calculate(); }
    });
    input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', function () { resetAllTool(); });

    compareToggle.addEventListener('click', function () {
      state.showComparison = !state.showComparison;
      compareToggle.setAttribute('aria-expanded', state.showComparison ? 'true' : 'false');
      compareBody.hidden = !state.showComparison;
      saveState();
    });

    refToggle.addEventListener('click', function () {
      state.showReference = !state.showReference;
      refToggle.setAttribute('aria-expanded', state.showReference ? 'true' : 'false');
      refBody.hidden = !state.showReference;
      saveState();
    });

    window.__cpcPercentageToCgpa = {
      restore: function (saved) {
        if (saved && saved.percentage !== '' && saved.percentage != null) input.value = saved.percentage;
      },
      updateUnavailableNote: updateUnavailableNote,
      resetTab: resetTab
    };
  })();

  /* ============================================
     INITIALISATION
  ============================================ */

  (function init() {
    /* Populate method select from preset data + custom option */
    var verifiedOpts = VERIFIED_PRESETS.map(function (p) {
      return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>';
    }).join('');
    var generalOpts = GENERAL_PRESETS.map(function (p) {
      return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>';
    }).join('');
    methodSelect.innerHTML =
      '<optgroup label="Verified Institution">' + verifiedOpts + '</optgroup>' +
      '<optgroup label="General Formula">' + generalOpts + '</optgroup>' +
      '<optgroup label="Custom"><option value="custom">Custom Formula</option></optgroup>';

    var saved = loadState();

    if (saved) {
      state.methodId    = (saved.methodId && (findPreset(saved.methodId) || saved.methodId === 'custom')) ? saved.methodId : 'cbse';
      state.cgpaScale    = saved.cgpaScale || '10';
      state.customFormula = saved.customFormula || state.customFormula;
      state.showComparison = !!saved.showComparison;
      state.showReference  = !!saved.showReference;

      window.__cpcCgpaToPercentage.restore(saved.cgpaToPercentage);
      window.__cpcPercentageToCgpa.restore(saved.percentageToCgpa);
    }

    methodSelect.value = state.methodId;
    customMultInput.value = state.customFormula.multiplier || '';
    customSignSelect.value = state.customFormula.offsetSign || '+';
    customMagInput.value = state.customFormula.offsetMagnitude || '';

    refreshMethodUI();
    window.__cpcCgpaToPercentage.updateScaleHint();
    window.__cpcPercentageToCgpa.updateUnavailableNote();

    /* Re-run scale hint + reverse-availability whenever the method
       or scale changes, since they affect validation on both tabs. */
    var _origRefresh = refreshMethodUI;
    refreshMethodUI = function () {
      _origRefresh();
      window.__cpcCgpaToPercentage.updateScaleHint();
      window.__cpcPercentageToCgpa.updateUnavailableNote();
    };

    var mode = (saved && saved.activeMode && MODES.indexOf(saved.activeMode) !== -1) ? saved.activeMode : 'cgpa-to-percentage';
    switchMode(mode, false, false);

    var compareToggles = document.querySelectorAll('.cpc-compare-toggle');
    compareToggles.forEach(function (btn) {
      btn.setAttribute('aria-expanded', state.showComparison ? 'true' : 'false');
    });
    var compareBodies = document.querySelectorAll('.cpc-compare-body');
    compareBodies.forEach(function (el) { el.hidden = !state.showComparison; });
    var refToggles = document.querySelectorAll('.cpc-ref-toggle');
    refToggles.forEach(function (btn) {
      btn.setAttribute('aria-expanded', state.showReference ? 'true' : 'false');
    });
    var refBodies = document.querySelectorAll('.cpc-ref-body');
    refBodies.forEach(function (el) { el.hidden = !state.showReference; });

    if (window.P50ToolBase) {
      P50ToolBase.renderRelatedTools(
        'cpc-related-grid',
        'cgpa-percentage-converter',
        'student-tools'
      );
    }
  })();

})();
