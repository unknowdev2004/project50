/* ============================================
   TARGET-CGPA.JS — Project 50
   Target CGPA Calculator — 2 tabs, 1 calculation engine

   FORMULAS
   ────────
   totalCredits       = completedCredits + remainingCredits
   accumulatedPoints  = currentCGPA × completedCredits

   Required SGPA:    (targetCGPA × totalCredits − accumulatedPoints) ÷ remainingCredits
   Projected CGPA:   (accumulatedPoints + expectedSGPA × remainingCredits) ÷ totalCredits
   Best Possible:    (accumulatedPoints + scaleMax × remainingCredits) ÷ totalCredits
   Worst Possible:   accumulatedPoints ÷ totalCredits

   Full floating-point precision internally. Round only for display.

   ZERO COMPLETED CREDITS: current CGPA has no mathematical meaning with
   nothing completed yet, so it is forced to 0 for calculation purposes
   (the Current CGPA field is disabled and explained via hint text +
   an insight) rather than adding a separate UI mode.

   ZERO REMAINING CREDITS: rejected by validation with a specific
   explanatory message — there is nothing left to plan.

   STORAGE KEY: p50_target_cgpa_calculator
   Saves: scale, shared inputs, both tabs' inputs, active tab.
   Never saves results. 300ms debounce. Reset clears only this tool's
   stored state (single combined key — never touches sibling tools).
============================================ */

(function () {
  'use strict';

  /* ============================================
     CONSTANTS
  ============================================ */

  var STORAGE_KEY = 'p50_target_cgpa_calculator';
  var SAVE_DEBOUNCE_MS = 300;
  var EPSILON = 1e-6;
  var SCALE_MAX = { '10': 10, '4': 4 };

  var ICON_CHECK =
    '<svg class="tcg-insight-icon tcg-insight-icon--positive" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>';

  var ICON_INFO =
    '<svg class="tcg-insight-icon tcg-insight-icon--neutral" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

  var ICON_WARN =
    '<svg class="tcg-insight-icon tcg-insight-icon--warning" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>' +
    '<path d="M12 9v4"/><path d="M12 17h.01"/></svg>';

  /* ============================================
     MODE TABS / PANELS
  ============================================ */

  var MODES = ['required', 'projected'];
  var tablist  = document.querySelector('.tcg-mode-selector');
  var tabEls   = {};
  var panelEls = {};
  MODES.forEach(function (m) {
    tabEls[m]   = document.getElementById('tcg-tab-' + m);
    panelEls[m] = document.getElementById('tcg-panel-' + m);
  });

  /* ============================================
     STATE
  ============================================ */

  var state = {
    activeMode: 'required',
    scale: '10',
    shared: { currentCgpa: '', completedCredits: '', remainingCredits: '' },
    required: { targetCgpa: '' },
    projected: { expectedSgpa: '' }
  };

  function scaleMax() {
    return SCALE_MAX[state.scale];
  }

  /* ============================================
     FORMATTING
  ============================================ */

  function fmtGpa(n) {
    if (!isFinite(n)) return '\u2014';
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  function fmtNum(n) {
    if (!isFinite(n)) return '\u2014';
    var r = Math.round(n * 100) / 100;
    return (r % 1 === 0) ? String(r) : r.toFixed(2);
  }

  function isBlank(v) {
    return v === '' || v === null || v === undefined;
  }

  function isValidNumber(n) {
    return typeof n === 'number' && !isNaN(n) && isFinite(n);
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
          scale: state.scale,
          shared: state.shared,
          required: state.required,
          projected: state.projected
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
     SHARED HELPERS
  ============================================ */

  function markError(input) {
    if (input) {
      input.classList.add('tcg-input--error');
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
    var relatedWrap = document.getElementById('tcg-related-wrap');
    if (relatedWrap && resultsEl.nextElementSibling !== relatedWrap) {
      resultsEl.after(relatedWrap);
    }
  }

  function moveRelatedBackToWrap() {
    var toolWrap    = document.querySelector('.tool-wrap');
    var relatedWrap = document.getElementById('tcg-related-wrap');
    if (toolWrap && relatedWrap && toolWrap.lastElementChild !== relatedWrap) {
      toolWrap.appendChild(relatedWrap);
    }
  }

  /* ============================================
     SHARED INPUTS — Current CGPA / Completed Credits /
     Remaining Credits / GPA Scale
  ============================================ */

  var scaleSelectorEl        = document.getElementById('tcg-scale-selector');
  var currentCgpaInput       = document.getElementById('tcg-current-cgpa');
  var completedCreditsInput  = document.getElementById('tcg-completed-credits');
  var remainingCreditsInput  = document.getElementById('tcg-remaining-credits');
  var currentCgpaHintEl      = document.getElementById('tcg-current-cgpa-hint');

  function syncSharedFromInputs() {
    state.shared.currentCgpa      = currentCgpaInput.value;
    state.shared.completedCredits = completedCreditsInput.value;
    state.shared.remainingCredits = remainingCreditsInput.value;
    saveState();
  }

  /* When completed credits = 0, current CGPA has no mathematical
     meaning yet — disable the field, force it to 0, and explain why
     instead of adding a separate UI mode. */
  function updateCurrentCgpaAvailability() {
    var raw = completedCreditsInput.value.trim();
    var completed = Number(raw);
    var isZero = raw !== '' && isValidNumber(completed) && completed === 0;

    if (isZero) {
      currentCgpaInput.value = '0';
      currentCgpaInput.disabled = true;
      currentCgpaInput.classList.remove('tcg-input--error');
      currentCgpaHintEl.textContent = 'Not used \u2014 you have 0 completed credits, so this starts from zero.';
    } else {
      currentCgpaInput.disabled = false;
      currentCgpaHintEl.textContent = '0\u2013' + scaleMax() + ' (' + state.scale + '-point scale)';
    }
  }

  function updateScaleDependentHints() {
    var targetHint   = document.getElementById('tcg-target-cgpa-hint');
    var expectedHint = document.getElementById('tcg-expected-sgpa-hint');
    if (targetHint)   targetHint.textContent   = '0\u2013' + scaleMax() + ' (' + state.scale + '-point scale)';
    if (expectedHint) expectedHint.textContent = '0\u2013' + scaleMax() + ' (' + state.scale + '-point scale)';
    updateCurrentCgpaAvailability();
  }

  function updateScaleButtons() {
    var btns = scaleSelectorEl.querySelectorAll('.tcg-scale-btn');
    for (var i = 0; i < btns.length; i++) {
      var isActive = btns[i].dataset.scale === state.scale;
      btns[i].setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
  }

  function clearIfOutOfRange(input) {
    if (!input || input.disabled) return;
    var raw = input.value.trim();
    if (raw === '') return;
    var val = Number(raw);
    if (isValidNumber(val) && val > scaleMax() + EPSILON) {
      input.value = '';
    }
  }

  function switchScale(newScale) {
    if (newScale === state.scale || !SCALE_MAX.hasOwnProperty(newScale)) return;

    state.scale = newScale;
    updateScaleButtons();
    updateScaleDependentHints();

    /* Never silently keep a value that is now out of range under the
       new scale. */
    clearIfOutOfRange(currentCgpaInput);
    clearIfOutOfRange(document.getElementById('tcg-target-cgpa'));
    clearIfOutOfRange(document.getElementById('tcg-expected-sgpa'));

    /* Status thresholds depend on scaleMax, so any previously computed
       result is now potentially stale — hide both tabs' results. */
    document.getElementById('tcg-required-results').hidden = true;
    document.getElementById('tcg-projected-results').hidden = true;
    hideValidation(document.getElementById('tcg-required-validation'));
    hideValidation(document.getElementById('tcg-projected-validation'));

    syncSharedFromInputs();
    state.required.targetCgpa   = document.getElementById('tcg-target-cgpa').value;
    state.projected.expectedSgpa = document.getElementById('tcg-expected-sgpa').value;
    saveState();
  }

  scaleSelectorEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.tcg-scale-btn');
    if (!btn) return;
    switchScale(btn.dataset.scale);
  });

  function calculateActive() {
    if (state.activeMode === 'required') {
      if (window.__tcgRequired) window.__tcgRequired.calculate();
    } else {
      if (window.__tcgProjected) window.__tcgProjected.calculate();
    }
  }

  [currentCgpaInput, completedCreditsInput, remainingCreditsInput].forEach(function (input) {
    input.addEventListener('input', function () {
      input.classList.remove('tcg-input--error');
      if (input === completedCreditsInput) updateCurrentCgpaAvailability();
      syncSharedFromInputs();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); calculateActive(); }
    });
    input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
  });

  /* Reset the shared inputs card back to its default state — used by
     both tabs' Reset buttons, since "Reset" clears this tool's full
     state, not just the active tab. */
  function resetSharedFields() {
    currentCgpaInput.value = '';
    completedCreditsInput.value = '';
    remainingCreditsInput.value = '';
    currentCgpaInput.disabled = false;
    clearSharedErrors();
    state.scale = '10';
    state.shared = { currentCgpa: '', completedCredits: '', remainingCredits: '' };
    updateScaleButtons();
    updateScaleDependentHints();
  }

  /* ============================================
     VALIDATE SHARED INPUTS
     Returns { currentCgpa, completedCredits, remainingCredits } or null.
  ============================================ */

  function clearSharedErrors() {
    currentCgpaInput.classList.remove('tcg-input--error');
    completedCreditsInput.classList.remove('tcg-input--error');
    remainingCreditsInput.classList.remove('tcg-input--error');
  }

  function validateShared(validationEl) {
    var completedRaw = completedCreditsInput.value.trim();
    var remainingRaw = remainingCreditsInput.value.trim();

    if (isBlank(completedRaw)) {
      showValidation(validationEl, 'Enter your completed credits.', completedCreditsInput);
      return null;
    }
    var completedCredits = Number(completedRaw);
    if (!isValidNumber(completedCredits)) {
      showValidation(validationEl, 'Completed credits must be a valid number.', completedCreditsInput);
      return null;
    }
    if (completedCredits < 0) {
      showValidation(validationEl, 'Completed credits cannot be negative.', completedCreditsInput);
      return null;
    }

    if (isBlank(remainingRaw)) {
      showValidation(validationEl, 'Enter your remaining credits.', remainingCreditsInput);
      return null;
    }
    var remainingCredits = Number(remainingRaw);
    if (!isValidNumber(remainingCredits)) {
      showValidation(validationEl, 'Remaining credits must be a valid number.', remainingCreditsInput);
      return null;
    }
    if (remainingCredits < 0) {
      showValidation(validationEl, 'Remaining credits cannot be negative.', remainingCreditsInput);
      return null;
    }
    if (remainingCredits === 0) {
      showValidation(validationEl, 'There are no remaining credits to plan. Your current CGPA is already final.');
      return null;
    }

    var currentCgpa;
    if (completedCredits === 0) {
      /* No academic history yet — current CGPA is not mathematically
         meaningful, so it is forced to 0 rather than read from the
         (disabled) input. */
      currentCgpa = 0;
    } else {
      var currentRaw = currentCgpaInput.value.trim();
      if (isBlank(currentRaw)) {
        showValidation(validationEl, 'Enter your current CGPA.', currentCgpaInput);
        return null;
      }
      currentCgpa = Number(currentRaw);
      if (!isValidNumber(currentCgpa)) {
        showValidation(validationEl, 'Current CGPA must be a valid number.', currentCgpaInput);
        return null;
      }
      if (currentCgpa < 0) {
        showValidation(validationEl, 'Current CGPA cannot be negative.', currentCgpaInput);
        return null;
      }
      if (currentCgpa > scaleMax() + EPSILON) {
        showValidation(validationEl, 'Current CGPA cannot exceed ' + scaleMax() + ' on the ' + state.scale + '-point scale.', currentCgpaInput);
        return null;
      }
    }

    return { currentCgpa: currentCgpa, completedCredits: completedCredits, remainingCredits: remainingCredits };
  }

  /* ============================================================
     TAB 1 — REQUIRED SGPA
  ============================================================ */

  (function requiredMode() {
    var targetInput   = document.getElementById('tcg-target-cgpa');
    var validationEl  = document.getElementById('tcg-required-validation');
    var resultsEl     = document.getElementById('tcg-required-results');
    var calcBtn       = document.getElementById('tcg-required-calc-btn');
    var resetBtn      = document.getElementById('tcg-required-reset-btn');

    var displayEl            = document.getElementById('tcg-required-display');
    var heroSubEl             = document.getElementById('tcg-required-hero-sub');
    var badgeEl               = document.getElementById('tcg-required-status-badge');
    var statusTextEl          = document.getElementById('tcg-required-status-text');
    var bestPossibleCardEl    = document.getElementById('tcg-required-best-possible-card');
    var bestPossibleValueEl   = document.getElementById('tcg-required-best-possible-value');
    var detailCurrentEl       = document.getElementById('tcg-required-detail-current');
    var detailCompletedEl     = document.getElementById('tcg-required-detail-completed');
    var detailRemainingEl     = document.getElementById('tcg-required-detail-remaining');
    var detailTargetEl        = document.getElementById('tcg-required-detail-target');
    var detailScaleEl         = document.getElementById('tcg-required-detail-scale');
    var insightsListEl        = document.getElementById('tcg-required-insights-list');
    var insightsCardEl        = document.getElementById('tcg-required-insights-card');

    var STATUS_META = {
      achieved:    { badge: 'Target Already Secured', cls: 'tcg-status-badge--achieved' },
      achievable:  { badge: 'Target Achievable',       cls: 'tcg-status-badge--achievable' },
      perfect:     { badge: 'Perfect SGPA Required',   cls: 'tcg-status-badge--perfect' },
      impossible:  { badge: 'Target Not Achievable',   cls: 'tcg-status-badge--impossible' }
    };

    function clearErrors() {
      targetInput.classList.remove('tcg-input--error');
      clearSharedErrors();
      hideValidation(validationEl);
    }

    function validate() {
      clearErrors();
      var shared = validateShared(validationEl);
      if (!shared) return null;

      var targetRaw = targetInput.value.trim();
      if (isBlank(targetRaw)) {
        showValidation(validationEl, 'Enter your target CGPA.', targetInput);
        return null;
      }
      var targetCgpa = Number(targetRaw);
      if (!isValidNumber(targetCgpa)) {
        showValidation(validationEl, 'Target CGPA must be a valid number.', targetInput);
        return null;
      }
      if (targetCgpa <= 0) {
        showValidation(validationEl, 'Target CGPA must be greater than zero.', targetInput);
        return null;
      }
      if (targetCgpa > scaleMax() + EPSILON) {
        showValidation(validationEl, 'Target CGPA cannot exceed ' + scaleMax() + ' on the ' + state.scale + '-point scale.', targetInput);
        return null;
      }

      return {
        currentCgpa: shared.currentCgpa,
        completedCredits: shared.completedCredits,
        remainingCredits: shared.remainingCredits,
        targetCgpa: targetCgpa
      };
    }

    function compute(v) {
      var totalCredits      = v.completedCredits + v.remainingCredits;
      var accumulatedPoints = v.currentCgpa * v.completedCredits;
      var sMax              = scaleMax();
      var requiredSgpa      = (v.targetCgpa * totalCredits - accumulatedPoints) / v.remainingCredits;
      var bestPossibleCgpa  = (accumulatedPoints + sMax * v.remainingCredits) / totalCredits;

      var status;
      if (requiredSgpa <= EPSILON) {
        status = 'achieved';
      } else if (requiredSgpa > sMax + EPSILON) {
        status = 'impossible';
      } else if (requiredSgpa >= sMax - EPSILON) {
        status = 'perfect';
      } else {
        status = 'achievable';
      }

      return {
        totalCredits: totalCredits,
        accumulatedPoints: accumulatedPoints,
        requiredSgpa: requiredSgpa,
        bestPossibleCgpa: bestPossibleCgpa,
        status: status,
        v: v
      };
    }

    function heroContent(d) {
      switch (d.status) {
        case 'achieved':   return { big: 'Secured', sub: 'Your target is already secured based on your current position.' };
        case 'achievable': return { big: fmtGpa(d.requiredSgpa), sub: 'Required average SGPA across remaining credits.' };
        case 'perfect':    return { big: fmtGpa(scaleMax()), sub: 'A perfect SGPA is required across your remaining credits.' };
        case 'impossible': return { big: 'Not Achievable', sub: 'Even a perfect SGPA across your remaining credits would not reach this target.' };
      }
    }

    function statusText(d) {
      var v = d.v;
      switch (d.status) {
        case 'achieved':
          return 'You have already secured a final CGPA of at least ' + fmtGpa(v.targetCgpa) + ', regardless of your performance across your remaining ' + fmtNum(v.remainingCredits) + ' credits.';
        case 'achievable':
          return 'Average ' + fmtGpa(d.requiredSgpa) + ' SGPA or better across your remaining ' + fmtNum(v.remainingCredits) + ' credits to finish with a CGPA of ' + fmtGpa(v.targetCgpa) + '.';
        case 'perfect':
          return 'You need a perfect ' + fmtGpa(scaleMax()) + ' SGPA average across your remaining credits to reach ' + fmtGpa(v.targetCgpa) + '.';
        case 'impossible':
          return 'Even a perfect SGPA across your remaining credits cannot reach ' + fmtGpa(v.targetCgpa) + ' from your current position.';
      }
      return '';
    }

    function renderInsights(d) {
      var items = [];
      var v = d.v;

      if (v.completedCredits === 0) {
        items.push({ icon: ICON_INFO, text: 'You have 0 completed credits, so this calculation starts from zero \u2014 your required SGPA equals your target CGPA directly.' });
      }

      if (d.status === 'achieved') {
        var worstCase = d.accumulatedPoints / d.totalCredits;
        items.push({ icon: ICON_CHECK, text: 'Even a 0 SGPA across your remaining credits would leave you at ' + fmtGpa(worstCase) + ', which already meets your target.' });
      } else if (d.status === 'impossible') {
        items.push({ icon: ICON_WARN, text: 'Consider setting a lower target CGPA, or double-check your remaining credits figure.' });
        items.push({ icon: ICON_INFO, text: 'The highest final CGPA you could reach is ' + fmtGpa(d.bestPossibleCgpa) + '.' });
      } else if (v.completedCredits > 0) {
        var gap = d.requiredSgpa - v.currentCgpa;
        if (gap > EPSILON) {
          items.push({ icon: ICON_WARN, text: 'You need to average ' + fmtGpa(gap) + ' points above your current CGPA across your remaining credits.' });
        } else {
          items.push({ icon: ICON_CHECK, text: 'Maintaining your current CGPA average across your remaining credits is enough to reach your target.' });
        }
      }

      if (items.length < 3) {
        var share = (v.remainingCredits / d.totalCredits) * 100;
        items.push({ icon: ICON_INFO, text: 'Your remaining ' + fmtNum(v.remainingCredits) + ' credits make up ' + fmtNum(share) + '% of your total credits at completion.' });
      }

      if (d.status === 'perfect' && items.length < 3) {
        items.push({ icon: ICON_WARN, text: 'There is zero margin for error \u2014 any SGPA below the maximum makes this target unreachable.' });
      }

      return items.slice(0, 3);
    }

    function calculate() {
      var v = validate();
      if (!v) { resultsEl.hidden = true; return; }

      var d = compute(v);
      var meta = STATUS_META[d.status];
      var hero = heroContent(d);

      displayEl.textContent = hero.big;
      heroSubEl.textContent = hero.sub;

      badgeEl.textContent = meta.badge;
      badgeEl.className = 'tcg-status-badge ' + meta.cls;
      statusTextEl.textContent = statusText(d);

      detailCurrentEl.textContent   = fmtGpa(v.currentCgpa);
      detailCompletedEl.textContent = fmtNum(v.completedCredits);
      detailRemainingEl.textContent = fmtNum(v.remainingCredits);
      detailTargetEl.textContent    = fmtGpa(v.targetCgpa);
      detailScaleEl.textContent     = state.scale + '-point';

      if (d.status === 'impossible') {
        bestPossibleCardEl.hidden = false;
        bestPossibleValueEl.textContent = fmtGpa(d.bestPossibleCgpa);
      } else {
        bestPossibleCardEl.hidden = true;
      }

      var insights = renderInsights(d);
      renderInsightsInto(insights, insightsListEl, insightsCardEl);

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetMode() {
      targetInput.value = '';
      clearErrors();
      resultsEl.hidden = true;
      state.required = { targetCgpa: '' };
      resetSharedFields();
      /* "Reset" clears this tool's full state, including the other tab. */
      var expectedInputEl = document.getElementById('tcg-expected-sgpa');
      if (expectedInputEl) expectedInputEl.value = '';
      state.projected = { expectedSgpa: '' };
      document.getElementById('tcg-projected-results').hidden = true;
      hideValidation(document.getElementById('tcg-projected-validation'));
      saveState();
      moveRelatedBackToWrap();
      targetInput.focus();
    }

    targetInput.addEventListener('input', function () {
      targetInput.classList.remove('tcg-input--error');
      state.required.targetCgpa = targetInput.value;
      saveState();
    });
    targetInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); calculate(); }
    });
    targetInput.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__tcgRequired = {
      calculate: calculate,
      restore: function (saved) {
        if (!saved) return;
        state.required = saved;
        if (saved.targetCgpa !== '' && saved.targetCgpa != null) targetInput.value = saved.targetCgpa;
      }
    };
  })();

  /* ============================================================
     TAB 2 — PROJECTED CGPA
  ============================================================ */

  (function projectedMode() {
    var expectedInput  = document.getElementById('tcg-expected-sgpa');
    var validationEl   = document.getElementById('tcg-projected-validation');
    var resultsEl      = document.getElementById('tcg-projected-results');
    var calcBtn        = document.getElementById('tcg-projected-calc-btn');
    var resetBtn       = document.getElementById('tcg-projected-reset-btn');

    var displayEl         = document.getElementById('tcg-projected-display');
    var heroSubEl          = document.getElementById('tcg-projected-hero-sub');
    var detailCurrentEl    = document.getElementById('tcg-projected-detail-current');
    var detailCompletedEl  = document.getElementById('tcg-projected-detail-completed');
    var detailRemainingEl  = document.getElementById('tcg-projected-detail-remaining');
    var detailExpectedEl   = document.getElementById('tcg-projected-detail-expected');
    var detailScaleEl      = document.getElementById('tcg-projected-detail-scale');
    var insightsListEl     = document.getElementById('tcg-projected-insights-list');
    var insightsCardEl     = document.getElementById('tcg-projected-insights-card');

    function clearErrors() {
      expectedInput.classList.remove('tcg-input--error');
      clearSharedErrors();
      hideValidation(validationEl);
    }

    function validate() {
      clearErrors();
      var shared = validateShared(validationEl);
      if (!shared) return null;

      var expectedRaw = expectedInput.value.trim();
      if (isBlank(expectedRaw)) {
        showValidation(validationEl, 'Enter your expected future SGPA.', expectedInput);
        return null;
      }
      var expectedSgpa = Number(expectedRaw);
      if (!isValidNumber(expectedSgpa)) {
        showValidation(validationEl, 'Expected SGPA must be a valid number.', expectedInput);
        return null;
      }
      if (expectedSgpa < 0) {
        showValidation(validationEl, 'Expected SGPA cannot be negative.', expectedInput);
        return null;
      }
      if (expectedSgpa > scaleMax() + EPSILON) {
        showValidation(validationEl, 'Expected SGPA cannot exceed ' + scaleMax() + ' on the ' + state.scale + '-point scale.', expectedInput);
        return null;
      }

      return {
        currentCgpa: shared.currentCgpa,
        completedCredits: shared.completedCredits,
        remainingCredits: shared.remainingCredits,
        expectedSgpa: expectedSgpa
      };
    }

    function compute(v) {
      var totalCredits      = v.completedCredits + v.remainingCredits;
      var accumulatedPoints = v.currentCgpa * v.completedCredits;
      var projectedCgpa     = (accumulatedPoints + v.expectedSgpa * v.remainingCredits) / totalCredits;
      var worstPossibleCgpa = accumulatedPoints / totalCredits;
      var bestPossibleCgpa  = (accumulatedPoints + scaleMax() * v.remainingCredits) / totalCredits;

      var diff = projectedCgpa - v.currentCgpa;
      var trend = (v.completedCredits === 0)
        ? 'flat'
        : (diff > EPSILON ? 'up' : (diff < -EPSILON ? 'down' : 'flat'));

      return {
        totalCredits: totalCredits,
        accumulatedPoints: accumulatedPoints,
        projectedCgpa: projectedCgpa,
        worstPossibleCgpa: worstPossibleCgpa,
        bestPossibleCgpa: bestPossibleCgpa,
        diff: diff,
        trend: trend,
        v: v
      };
    }

    function heroSubText(d) {
      if (d.v.completedCredits === 0) {
        return 'Starting from zero completed credits, this equals your expected SGPA.';
      }
      switch (d.trend) {
        case 'up':   return 'This would raise your CGPA from ' + fmtGpa(d.v.currentCgpa) + '.';
        case 'down': return 'This would lower your CGPA from ' + fmtGpa(d.v.currentCgpa) + '.';
        default:     return 'This would keep your CGPA unchanged.';
      }
    }

    function renderInsights(d) {
      var items = [];
      var v = d.v;

      if (v.completedCredits === 0) {
        items.push({ icon: ICON_INFO, text: 'You have 0 completed credits, so this calculation starts from zero \u2014 your projected CGPA equals your expected SGPA directly.' });
      } else if (d.trend === 'up') {
        items.push({ icon: ICON_CHECK, text: 'Averaging ' + fmtGpa(v.expectedSgpa) + ' SGPA across your remaining credits would raise your CGPA by ' + fmtGpa(d.diff) + ', to ' + fmtGpa(d.projectedCgpa) + '.' });
      } else if (d.trend === 'down') {
        items.push({ icon: ICON_WARN, text: 'Averaging ' + fmtGpa(v.expectedSgpa) + ' SGPA across your remaining credits would lower your CGPA by ' + fmtGpa(Math.abs(d.diff)) + ', to ' + fmtGpa(d.projectedCgpa) + '.' });
      } else {
        items.push({ icon: ICON_INFO, text: 'This SGPA would keep your CGPA unchanged at ' + fmtGpa(d.projectedCgpa) + '.' });
      }

      if (items.length < 3) {
        var share = (v.remainingCredits / d.totalCredits) * 100;
        items.push({ icon: ICON_INFO, text: 'Your remaining ' + fmtNum(v.remainingCredits) + ' credits make up ' + fmtNum(share) + '% of your total credits at completion.' });
      }

      if (Math.abs(v.expectedSgpa - scaleMax()) < EPSILON && items.length < 3) {
        items.push({ icon: ICON_CHECK, text: 'This is the highest possible SGPA \u2014 no scenario across your remaining credits can push your CGPA higher.' });
      } else if (v.expectedSgpa < EPSILON && items.length < 3) {
        items.push({ icon: ICON_WARN, text: 'A 0 SGPA across your remaining credits would be the worst case, lowering your CGPA to ' + fmtGpa(d.worstPossibleCgpa) + '.' });
      }

      return items.slice(0, 3);
    }

    function calculate() {
      var v = validate();
      if (!v) { resultsEl.hidden = true; return; }

      var d = compute(v);

      displayEl.textContent = fmtGpa(d.projectedCgpa);
      heroSubEl.textContent = heroSubText(d);

      detailCurrentEl.textContent   = fmtGpa(v.currentCgpa);
      detailCompletedEl.textContent = fmtNum(v.completedCredits);
      detailRemainingEl.textContent = fmtNum(v.remainingCredits);
      detailExpectedEl.textContent  = fmtGpa(v.expectedSgpa);
      detailScaleEl.textContent     = state.scale + '-point';

      var insights = renderInsights(d);
      renderInsightsInto(insights, insightsListEl, insightsCardEl);

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetMode() {
      expectedInput.value = '';
      clearErrors();
      resultsEl.hidden = true;
      state.projected = { expectedSgpa: '' };
      resetSharedFields();
      /* "Reset" clears this tool's full state, including the other tab. */
      var targetInputEl = document.getElementById('tcg-target-cgpa');
      if (targetInputEl) targetInputEl.value = '';
      state.required = { targetCgpa: '' };
      document.getElementById('tcg-required-results').hidden = true;
      hideValidation(document.getElementById('tcg-required-validation'));
      saveState();
      moveRelatedBackToWrap();
      expectedInput.focus();
    }

    expectedInput.addEventListener('input', function () {
      expectedInput.classList.remove('tcg-input--error');
      state.projected.expectedSgpa = expectedInput.value;
      saveState();
    });
    expectedInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); calculate(); }
    });
    expectedInput.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__tcgProjected = {
      calculate: calculate,
      restore: function (saved) {
        if (!saved) return;
        state.projected = saved;
        if (saved.expectedSgpa !== '' && saved.expectedSgpa != null) expectedInput.value = saved.expectedSgpa;
      }
    };
  })();

  /* ============================================
     MODE SWITCHING
  ============================================ */

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
     INITIALISATION
  ============================================ */

  (function init() {
    var saved = loadState();

    if (saved) {
      state.scale = (saved.scale === '4') ? '4' : '10';
      if (saved.shared) {
        state.shared = saved.shared;
        if (saved.shared.currentCgpa      !== '' && saved.shared.currentCgpa      != null) currentCgpaInput.value      = saved.shared.currentCgpa;
        if (saved.shared.completedCredits !== '' && saved.shared.completedCredits != null) completedCreditsInput.value = saved.shared.completedCredits;
        if (saved.shared.remainingCredits !== '' && saved.shared.remainingCredits != null) remainingCreditsInput.value = saved.shared.remainingCredits;
      }

      updateScaleButtons();
      updateScaleDependentHints();

      window.__tcgRequired.restore(saved.required);
      window.__tcgProjected.restore(saved.projected);

      var mode = (saved.activeMode && MODES.indexOf(saved.activeMode) !== -1) ? saved.activeMode : 'required';
      switchMode(mode, false, false);
    } else {
      updateScaleButtons();
      updateScaleDependentHints();
      switchMode('required', false, false);
    }

    if (window.P50ToolBase) {
      P50ToolBase.renderRelatedTools(
        'tcg-related-grid',
        'target-cgpa-calculator',
        'student-tools'
      );
    }
  })();

})();
