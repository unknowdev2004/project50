/* ============================================
   GRADE-REQUIRED-MARKS.JS — Project 50
   Grade & Required Marks Calculator — 5 modes, 1 calculator

   FORMULAS
   ────────
   Current Grade:   Weighted Contribution = Score × Weight (weight as decimal)
                     Completed Weight = Σ Weight
                     Current Contribution = Σ(Score × Weight)
                     Current Grade = Current Contribution ÷ Completed Weight
                     Remaining Weight = 1 − Completed Weight

   Required Final:  Required Final Score =
                       (Target − Current Grade × (1 − Final Weight)) ÷ Final Weight

   What-If Final:   Projected Final Grade =
                       Current Grade × (1 − Final Weight) + Expected Final Score × Final Weight

   Best Possible:   Best Possible Grade =
                       Current Grade × Completed Weight + 100 × Remaining Weight
                     (Completed Weight = 1 − Remaining Weight)

   Target Comparison (per default target): same mathematics as Required Final,
                     using Remaining Weight in place of Final Weight.

   Full floating-point precision internally. Round only for display.

   STORAGE KEY: p50_grade_required_marks_calculator
   Saves: activeMode + each mode's input data only (never results).
   300ms debounce. Reset clears only the active mode's stored data.

   RESULT HIERARCHY (per mode)
   ────────────────────────────
   Hero Result → Key Summary → Mode-Specific Analysis → Planning Info → Insights
============================================ */

(function () {
  'use strict';

  /* ============================================
     CONSTANTS
  ============================================ */

  var STORAGE_KEY = 'p50_grade_required_marks_calculator';
  var SAVE_DEBOUNCE_MS = 300;
  var EPSILON = 1e-6;
  var MIN_ASSESSMENTS = 1;
  var MAX_ASSESSMENTS = 20;
  var DEFAULT_TARGETS = [70, 75, 80, 85, 90];

  var ICON_CHECK =
    '<svg class="grmc-insight-icon grmc-insight-icon--positive" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>';

  var ICON_INFO =
    '<svg class="grmc-insight-icon grmc-insight-icon--neutral" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

  var ICON_WARN =
    '<svg class="grmc-insight-icon grmc-insight-icon--warning" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>' +
    '<path d="M12 9v4"/><path d="M12 17h.01"/></svg>';

  var esc = (window.P50Utils && window.P50Utils.escapeAttr) ? window.P50Utils.escapeAttr : function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  /* ============================================
     MODE TABS / PANELS
  ============================================ */

  var MODES = ['current-grade', 'required-final', 'what-if', 'best-possible', 'target-comparison'];
  var tablist  = document.querySelector('.grmc-mode-selector');
  var tabEls   = {};
  var panelEls = {};
  MODES.forEach(function (m) {
    tabEls[m]   = document.getElementById('grmc-tab-' + m);
    panelEls[m] = document.getElementById('grmc-panel-' + m);
  });

  /* ============================================
     STATE
  ============================================ */

  var state = {
    activeMode: 'current-grade',
    currentGrade:    { assessments: [] },
    requiredFinal:   { currentGrade: '', finalWeight: '', targetGrade: '' },
    whatIf:          { currentGrade: '', finalWeight: '', expectedFinal: '' },
    bestPossible:    { currentGrade: '', remainingWeight: '' },
    targetComparison:{ currentGrade: '', remainingWeight: '' }
  };

  function genId() {
    return 'row_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  /* ============================================
     FORMATTING
  ============================================ */

  function fmtPct(n) {
    if (!isFinite(n)) return '—';
    return (Math.round(n * 100) / 100).toFixed(2) + '%';
  }

  function fmtNum(n) {
    if (!isFinite(n)) return '—';
    var r = Math.round(n * 100) / 100;
    return (r % 1 === 0) ? String(r) : r.toFixed(2);
  }

  /* ============================================
     PERSISTENCE
  ============================================ */

  var _saveTimer = null;

  function saveState() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function () {
      try {
        var data = {
          activeMode: state.activeMode,
          currentGrade: {
            assessments: state.currentGrade.assessments.map(function (r) {
              return { id: r.id, name: r.name, score: r.score, weight: r.weight };
            })
          },
          requiredFinal: state.requiredFinal,
          whatIf: state.whatIf,
          bestPossible: state.bestPossible,
          targetComparison: state.targetComparison
        };
        P50Storage.set(STORAGE_KEY, data);
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
     ASSESSMENT ROW COMPONENT — Current Grade mode
  ============================================ */

  function buildAssessmentRow(a) {
    var row = document.createElement('div');
    row.className = 'grmc-assessment-row';
    row.setAttribute('role', 'listitem');
    row.dataset.rowId = a.id;

    var nameVal   = esc(a.name || '');
    var scoreVal  = (a.score !== '' && a.score != null) ? esc(String(a.score)) : '';
    var weightVal = (a.weight !== '' && a.weight != null) ? esc(String(a.weight)) : '';

    row.innerHTML =
      '<div class="grmc-name-field">' +
        '<span class="grmc-field-mobile-label" aria-hidden="true">Assessment</span>' +
        '<input type="text" class="grmc-name-input tool-input" placeholder="e.g. Midterm"' +
          ' value="' + nameVal + '" aria-label="Assessment name (optional)" autocomplete="off">' +
      '</div>' +
      '<div class="grmc-score-field">' +
        '<span class="grmc-field-mobile-label" aria-hidden="true">Score %</span>' +
        '<input type="number" class="grmc-score-input tool-input" placeholder="e.g. 85"' +
          ' value="' + scoreVal + '" min="0" max="100" step="any" inputmode="decimal" aria-label="Score percent">' +
      '</div>' +
      '<div class="grmc-weight-field">' +
        '<span class="grmc-field-mobile-label" aria-hidden="true">Weight %</span>' +
        '<input type="number" class="grmc-weight-input tool-input" placeholder="e.g. 20"' +
          ' value="' + weightVal + '" min="0" max="100" step="any" inputmode="decimal" aria-label="Weight percent">' +
      '</div>' +
      '<button class="grmc-remove-btn" data-row-id="' + esc(a.id) + '"' +
        ' type="button" aria-label="Remove this assessment">' +
        '&times;' +
      '</button>';

    var nums = row.querySelectorAll('input[type="number"]');
    for (var i = 0; i < nums.length; i++) {
      nums[i].addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    }

    return row;
  }

  function renderRowsFromState(listEl, rows) {
    listEl.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < rows.length; i++) {
      frag.appendChild(buildAssessmentRow(rows[i]));
    }
    listEl.appendChild(frag);
  }

  function findRow(rows, id) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) return rows[i];
    }
    return null;
  }

  function readRowsIntoState(listEl, rows) {
    var rowEls = listEl.querySelectorAll('.grmc-assessment-row');
    for (var i = 0; i < rowEls.length; i++) {
      var rowEl = rowEls[i];
      var id    = rowEl.dataset.rowId;
      var a     = findRow(rows, id);
      if (!a) continue;
      a.name   = rowEl.querySelector('.grmc-name-input').value;
      a.score  = parseFloat(rowEl.querySelector('.grmc-score-input').value);
      a.weight = parseFloat(rowEl.querySelector('.grmc-weight-input').value);
    }
  }

  function addAssessmentRow(rows, listEl, data, focusAfter) {
    if (rows.length >= MAX_ASSESSMENTS) return;
    var a = {
      id:     (data && data.id)             ? data.id     : genId(),
      name:   (data && data.name)           ? data.name   : '',
      score:  (data && data.score != null)  ? data.score  : '',
      weight: (data && data.weight != null) ? data.weight : ''
    };
    rows.push(a);

    if (!data) {
      var row = buildAssessmentRow(a);
      listEl.appendChild(row);
      if (focusAfter) {
        var input = row.querySelector('.grmc-name-input');
        if (input) setTimeout(function () { input.focus(); }, 50);
      }
      saveState();
    }
  }

  function removeAssessmentRowFromState(rows, id) {
    var idx = -1;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) { idx = i; break; }
    }
    if (idx !== -1) rows.splice(idx, 1);
    saveState();
  }

  function wireAssessmentList(listEl, rows, onCountChange) {
    listEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.grmc-remove-btn');
      if (!btn) return;
      if (rows.length <= MIN_ASSESSMENTS) return;
      var id  = btn.dataset.rowId;
      var row = btn.closest('.grmc-assessment-row');
      if (!row) return;
      row.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
      row.style.opacity    = '0';
      row.style.transform  = 'translateX(8px)';
      setTimeout(function () {
        row.remove();
        removeAssessmentRowFromState(rows, id);
        if (onCountChange) onCountChange();
      }, 180);
    });

    listEl.addEventListener('input', function (e) {
      if (
        e.target.matches('.grmc-name-input') ||
        e.target.matches('.grmc-score-input') ||
        e.target.matches('.grmc-weight-input')
      ) {
        readRowsIntoState(listEl, rows);
        saveState();
        if (e.target.matches('.grmc-score-input') || e.target.matches('.grmc-weight-input')) {
          e.target.classList.remove('grmc-input--error');
        }
      }
    });
  }

  /* ============================================
     MODE SWITCHING
  ============================================ */

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function scrollTabIntoView(mode) {
    var tabEl = tabEls[mode];
    if (!tabEl || typeof tabEl.scrollIntoView !== 'function') return;
    tabEl.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }

  /**
   * @param {string} mode
   * @param {boolean} focusTab - move keyboard focus to the tab (arrow-key nav)
   * @param {boolean} [userInitiated=true] - false only on initial page load restore,
   *   so the first/restored tab is never auto-scrolled into a centered position.
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
    if (userInitiated) scrollTabIntoView(mode);
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

  function markError(input) {
    if (input) {
      input.classList.add('grmc-input--error');
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
    var relatedWrap = document.getElementById('grmc-related-wrap');
    if (relatedWrap && resultsEl.nextElementSibling !== relatedWrap) {
      resultsEl.after(relatedWrap);
    }
  }

  function moveRelatedBackToWrap() {
    var toolWrap    = document.querySelector('.tool-wrap');
    var relatedWrap = document.getElementById('grmc-related-wrap');
    if (toolWrap && relatedWrap && !toolWrap.contains(relatedWrap)) {
      toolWrap.appendChild(relatedWrap);
    } else if (toolWrap && relatedWrap && toolWrap.lastElementChild !== relatedWrap) {
      toolWrap.appendChild(relatedWrap);
    }
  }

  /* ============================================================
     MODE 1 — CURRENT GRADE
  ============================================================ */

  (function currentGradeMode() {
    var listEl       = document.getElementById('grmc-current-list');
    var validationEl = document.getElementById('grmc-current-validation');
    var resultsEl     = document.getElementById('grmc-current-results');
    var addBtn        = document.getElementById('grmc-current-add-btn');
    var calcBtn        = document.getElementById('grmc-current-calc-btn');
    var resetBtn       = document.getElementById('grmc-current-reset-btn');

    var displayEl           = document.getElementById('grmc-current-display');
    var completedWeightEl   = document.getElementById('grmc-current-completed-weight');
    var remainingWeightEl   = document.getElementById('grmc-current-remaining-weight');
    var contributionEl      = document.getElementById('grmc-current-contribution');
    var breakdownEl         = document.getElementById('grmc-current-breakdown');
    var insightsListEl      = document.getElementById('grmc-current-insights-list');
    var insightsCardEl      = document.getElementById('grmc-current-insights-card');

    var rows = state.currentGrade.assessments;

    function hideResults() { resultsEl.hidden = true; }

    wireAssessmentList(listEl, rows, function () {
      if (rows.length === 0) hideResults();
    });

    function clearErrors() {
      var inputs = listEl.querySelectorAll('.tool-input');
      for (var i = 0; i < inputs.length; i++) inputs[i].classList.remove('grmc-input--error');
      hideValidation(validationEl);
    }

    function validate() {
      readRowsIntoState(listEl, rows);
      var rowEls = listEl.querySelectorAll('.grmc-assessment-row');
      clearErrors();

      if (rows.length < MIN_ASSESSMENTS) {
        showValidation(validationEl, 'Add at least one assessment before calculating.');
        return null;
      }
      if (rows.length > MAX_ASSESSMENTS) {
        showValidation(validationEl, 'You can add a maximum of ' + MAX_ASSESSMENTS + ' assessments.');
        return null;
      }

      var totalWeight = 0;

      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var label = r.name || ('Assessment ' + (i + 1));

        if (isBlank(r.score) || !isValidNumber(r.score)) {
          showValidation(validationEl, 'Enter a valid score for ' + label + '.');
          markError(rowEls[i].querySelector('.grmc-score-input'));
          return null;
        }
        if (r.score < 0) {
          showValidation(validationEl, 'Score cannot be negative. Check ' + label + '.');
          markError(rowEls[i].querySelector('.grmc-score-input'));
          return null;
        }
        if (r.score > 100) {
          showValidation(validationEl, 'Score cannot exceed 100. Check ' + label + '.');
          markError(rowEls[i].querySelector('.grmc-score-input'));
          return null;
        }
        if (isBlank(r.weight) || !isValidNumber(r.weight)) {
          showValidation(validationEl, 'Enter a valid weight for ' + label + '.');
          markError(rowEls[i].querySelector('.grmc-weight-input'));
          return null;
        }
        if (r.weight <= 0) {
          showValidation(validationEl, 'Weight must be greater than zero. Check ' + label + '.');
          markError(rowEls[i].querySelector('.grmc-weight-input'));
          return null;
        }
        if (r.weight > 100) {
          showValidation(validationEl, 'Weight cannot exceed 100. Check ' + label + '.');
          markError(rowEls[i].querySelector('.grmc-weight-input'));
          return null;
        }
        totalWeight += r.weight;
      }

      if (totalWeight > 100 + 1e-4) {
        showValidation(validationEl, 'Total assessment weight cannot exceed 100% (currently ' + fmtNum(totalWeight) + '%).');
        return null;
      }

      return true;
    }

    function calculate() {
      if (!validate()) return;
      saveState();

      var completedWeightDecimal = 0;
      var currentContribution    = 0;

      var withContribution = rows.map(function (r, i) {
        var weightDecimal = r.weight / 100;
        var contribution  = r.score * weightDecimal;
        completedWeightDecimal += weightDecimal;
        currentContribution    += contribution;
        return {
          name: r.name || ('Assessment ' + (i + 1)),
          score: r.score,
          weight: r.weight,
          contribution: contribution
        };
      });

      var currentGradePct     = currentContribution / completedWeightDecimal;
      var remainingWeightDecimal = Math.max(0, 1 - completedWeightDecimal);

      displayEl.textContent = fmtPct(currentGradePct);
      completedWeightEl.textContent = fmtPct(completedWeightDecimal * 100);
      remainingWeightEl.textContent = fmtPct(remainingWeightDecimal * 100);
      contributionEl.textContent = fmtPct(currentContribution);

      breakdownEl.innerHTML = withContribution.map(function (a) {
        return '<li><span class="grmc-breakdown-name">' + esc(a.name) + '</span>' +
          '<span class="grmc-breakdown-value">' + esc(fmtPct(a.score)) + ' score &middot; ' +
          esc(fmtPct(a.weight)) + ' weight &middot; contributes ' + esc(fmtPct(a.contribution)) +
          '</span></li>';
      }).join('');

      var insights = buildInsights(withContribution, completedWeightDecimal, remainingWeightDecimal);
      renderInsightsInto(insights, insightsListEl, insightsCardEl);

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function buildInsights(withContribution, completedWeightDecimal, remainingWeightDecimal) {
      var items = [];

      if (remainingWeightDecimal > EPSILON) {
        items.push({
          icon: ICON_INFO,
          text: fmtPct(remainingWeightDecimal * 100) + ' of your final grade (' + fmtNum(remainingWeightDecimal * 100) +
            ' percentage points) is still undetermined by assessments not yet entered here.'
        });
      } else {
        items.push({
          icon: ICON_CHECK,
          text: 'You have accounted for all of your course weight — this is effectively your final grade.'
        });
      }

      if (withContribution.length >= 2) {
        var heaviest = withContribution[0];
        withContribution.forEach(function (a) {
          if (a.weight > heaviest.weight) heaviest = a;
        });
        items.push({
          icon: ICON_INFO,
          text: '"' + heaviest.name + '" carries the most weight at ' + fmtPct(heaviest.weight) +
            ', giving it the largest influence on your current grade.'
        });

        var minScore = withContribution[0].score, maxScore = withContribution[0].score;
        withContribution.forEach(function (a) {
          if (a.score < minScore) minScore = a.score;
          if (a.score > maxScore) maxScore = a.score;
        });
        var spread = maxScore - minScore;
        if (spread > EPSILON) {
          items.push({
            icon: ICON_WARN,
            text: 'Your assessment scores range from ' + fmtNum(minScore) + '% to ' + fmtNum(maxScore) +
              '%, a spread of ' + fmtNum(spread) + ' points.'
          });
        }
      }

      return items.slice(0, 3);
    }

    function resetMode() {
      hideResults();
      clearErrors();
      state.currentGrade.assessments = [];
      rows.length = 0;
      for (var i = 0; i < 2; i++) addAssessmentRow(rows, listEl, null, false);
      renderRowsFromState(listEl, rows);
      /* NOTE: storage is a single combined key shared by all modes — never
         call P50Storage.remove(STORAGE_KEY) here, or every other mode's
         saved data would be wiped too. saveState() persists the full
         current in-memory state, which only has THIS mode's data reset. */
      saveState();
      moveRelatedBackToWrap();
    }

    addBtn.addEventListener('click', function () {
      if (rows.length >= MAX_ASSESSMENTS) {
        showValidation(validationEl, 'You can add a maximum of ' + MAX_ASSESSMENTS + ' assessments.');
        return;
      }
      addAssessmentRow(rows, listEl, null, true);
    });

    listEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); calculate(); }
    });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__grmcCurrent = {
      rows: rows,
      listEl: listEl,
      restore: function (saved) {
        if (saved && Array.isArray(saved.assessments) && saved.assessments.length) {
          saved.assessments.forEach(function (r) { addAssessmentRow(rows, listEl, r, false); });
          renderRowsFromState(listEl, rows);
        } else {
          for (var i = 0; i < 2; i++) addAssessmentRow(rows, listEl, null, false);
        }
      }
    };
  })();

  /* ============================================================
     MODE 2 — REQUIRED FINAL
  ============================================================ */

  (function requiredFinalMode() {
    var currentGradeInput = document.getElementById('grmc-required-current-grade');
    var finalWeightInput  = document.getElementById('grmc-required-final-weight');
    var targetGradeInput  = document.getElementById('grmc-required-target-grade');
    var validationEl      = document.getElementById('grmc-required-validation');
    var resultsEl          = document.getElementById('grmc-required-results');
    var calcBtn             = document.getElementById('grmc-required-calc-btn');
    var resetBtn            = document.getElementById('grmc-required-reset-btn');

    var displayEl       = document.getElementById('grmc-required-display');
    var heroSubEl        = document.getElementById('grmc-required-hero-sub');
    var badgeEl          = document.getElementById('grmc-required-status-badge');
    var statusTextEl     = document.getElementById('grmc-required-status-text');
    var currentStatEl     = document.getElementById('grmc-required-current-stat');
    var weightStatEl      = document.getElementById('grmc-required-weight-stat');
    var targetStatEl      = document.getElementById('grmc-required-target-stat');
    var bestPossibleCardEl = document.getElementById('grmc-required-best-possible-card');
    var bestPossibleValueEl = document.getElementById('grmc-required-best-possible-value');
    var insightsListEl   = document.getElementById('grmc-required-insights-list');
    var insightsCardEl   = document.getElementById('grmc-required-insights-card');

    var inputs = [currentGradeInput, finalWeightInput, targetGradeInput];

    function clearErrors() {
      inputs.forEach(function (i) { i.classList.remove('grmc-input--error'); });
      hideValidation(validationEl);
    }

    function validate() {
      clearErrors();

      var raw = {
        currentGrade: currentGradeInput.value.trim(),
        finalWeight:  finalWeightInput.value.trim(),
        targetGrade:  targetGradeInput.value.trim()
      };

      if (isBlank(raw.currentGrade)) { showValidation(validationEl, 'Enter your current grade.', currentGradeInput); return null; }
      if (isBlank(raw.finalWeight))  { showValidation(validationEl, 'Enter the final exam weight.', finalWeightInput); return null; }
      if (isBlank(raw.targetGrade))  { showValidation(validationEl, 'Enter your target final grade.', targetGradeInput); return null; }

      var currentGrade = Number(raw.currentGrade);
      var finalWeight  = Number(raw.finalWeight);
      var targetGrade  = Number(raw.targetGrade);

      if (!isValidNumber(currentGrade)) { showValidation(validationEl, 'Current grade must be a valid number.', currentGradeInput); return null; }
      if (!isValidNumber(finalWeight))  { showValidation(validationEl, 'Final exam weight must be a valid number.', finalWeightInput); return null; }
      if (!isValidNumber(targetGrade))  { showValidation(validationEl, 'Target final grade must be a valid number.', targetGradeInput); return null; }

      if (currentGrade < 0)   { showValidation(validationEl, 'Current grade cannot be negative.', currentGradeInput); return null; }
      if (currentGrade > 100) { showValidation(validationEl, 'Current grade cannot exceed 100.', currentGradeInput); return null; }
      if (finalWeight <= 0)   { showValidation(validationEl, 'Final exam weight must be greater than zero.', finalWeightInput); return null; }
      if (finalWeight > 100)  { showValidation(validationEl, 'Final exam weight cannot exceed 100.', finalWeightInput); return null; }
      if (targetGrade <= 0)   { showValidation(validationEl, 'Target final grade must be greater than zero.', targetGradeInput); return null; }
      if (targetGrade > 100)  { showValidation(validationEl, 'Target final grade cannot exceed 100.', targetGradeInput); return null; }

      return { currentGrade: currentGrade, finalWeight: finalWeight, targetGrade: targetGrade };
    }

    function compute(v) {
      var finalWeightDecimal = v.finalWeight / 100;
      var requiredFinal = (v.targetGrade - v.currentGrade * (1 - finalWeightDecimal)) / finalWeightDecimal;
      var bestPossible  = v.currentGrade * (1 - finalWeightDecimal) + 100 * finalWeightDecimal;

      var status;
      if (requiredFinal <= EPSILON) {
        status = 'achieved';
      } else if (requiredFinal > 100 + EPSILON) {
        status = 'impossible';
      } else if (requiredFinal >= 100 - 1e-4) {
        status = 'perfect';
      } else {
        status = 'achievable';
      }

      return { requiredFinal: requiredFinal, bestPossible: bestPossible, status: status, v: v };
    }

    var STATUS_META = {
      achieved:    { badge: 'Target Already Secured', cls: 'grmc-status-badge--achieved' },
      achievable:  { badge: 'Target Achievable',       cls: 'grmc-status-badge--achievable' },
      perfect:     { badge: 'Perfect Score Required',  cls: 'grmc-status-badge--perfect' },
      impossible:  { badge: 'Target Not Achievable',   cls: 'grmc-status-badge--impossible' }
    };

    function heroContent(d) {
      switch (d.status) {
        case 'achieved':    return { big: 'Secured', sub: 'Your current grade already meets the target.' };
        case 'achievable':  return { big: fmtPct(d.requiredFinal), sub: 'Score needed on the final exam.' };
        case 'perfect':     return { big: fmtPct(100), sub: 'A perfect score is required on the final.' };
        case 'impossible':  return { big: 'Not Achievable', sub: 'Even a perfect final score would not reach this target.' };
      }
    }

    function statusText(d) {
      var v = d.v;
      switch (d.status) {
        case 'achieved':
          return 'You have already secured ' + fmtPct(v.currentGrade) + ', which meets or exceeds your ' + fmtNum(v.targetGrade) + '% target for the course.';
        case 'achievable':
          return 'Score ' + fmtPct(d.requiredFinal) + ' or better on the final (weighted at ' + fmtNum(v.finalWeight) + '%) to finish the course at ' + fmtNum(v.targetGrade) + '%.';
        case 'perfect':
          return 'You need a perfect score on the final exam to reach ' + fmtNum(v.targetGrade) + '%.';
        case 'impossible':
          return 'Even a perfect score on the final cannot reach ' + fmtNum(v.targetGrade) + '% from your current position.';
      }
      return '';
    }

    function renderInsights(d) {
      var items = [];
      var v = d.v;

      if (d.status === 'achieved') {
        var margin = v.currentGrade - v.targetGrade;
        items.push({ icon: ICON_CHECK, text: 'You are currently ' + margin.toFixed(1) + ' points above your target — the final cannot bring you below it.' });
      } else if (d.status === 'impossible') {
        items.push({ icon: ICON_WARN, text: 'Consider setting a lower target grade, or double-check the final exam\u2019s weight.' });
        items.push({ icon: ICON_INFO, text: 'The highest final course grade you could reach is ' + fmtPct(d.bestPossible) + '.' });
      } else {
        var gap = d.requiredFinal - v.currentGrade;
        if (gap > 0) {
          items.push({ icon: ICON_WARN, text: 'You need to score ' + gap.toFixed(1) + ' points above your current grade average on the final.' });
        } else {
          items.push({ icon: ICON_CHECK, text: 'Maintaining your current average on the final is enough to reach your target.' });
        }
      }

      items.push({ icon: ICON_INFO, text: 'The final exam makes up ' + fmtPct(v.finalWeight) + ' of your total course grade.' });

      if (d.status === 'perfect') {
        items.push({ icon: ICON_WARN, text: 'There is zero margin for error — any dropped points make the target unreachable.' });
      }

      return items.slice(0, 3);
    }

    function calculate() {
      var v = validate();
      if (!v) return;

      var d = compute(v);
      var meta = STATUS_META[d.status];
      var hero = heroContent(d);

      displayEl.textContent = hero.big;
      heroSubEl.textContent = hero.sub;

      badgeEl.textContent = meta.badge;
      badgeEl.className = 'grmc-status-badge ' + meta.cls;
      statusTextEl.textContent = statusText(d);

      currentStatEl.textContent = fmtPct(v.currentGrade);
      weightStatEl.textContent = fmtPct(v.finalWeight);
      targetStatEl.textContent = fmtPct(v.targetGrade);

      if (d.status === 'achieved') {
        bestPossibleCardEl.hidden = true;
      } else {
        bestPossibleCardEl.hidden = false;
        bestPossibleValueEl.textContent = fmtPct(d.bestPossible);
      }

      var insights = renderInsights(d);
      renderInsightsInto(insights, insightsListEl, insightsCardEl);

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetMode() {
      inputs.forEach(function (i) { i.value = ''; });
      clearErrors();
      resultsEl.hidden = true;
      state.requiredFinal = { currentGrade: '', finalWeight: '', targetGrade: '' };
      saveState();
      moveRelatedBackToWrap();
      currentGradeInput.focus();
    }

    inputs.forEach(function (input) {
      input.addEventListener('input', function () {
        input.classList.remove('grmc-input--error');
        state.requiredFinal.currentGrade = currentGradeInput.value;
        state.requiredFinal.finalWeight  = finalWeightInput.value;
        state.requiredFinal.targetGrade  = targetGradeInput.value;
        saveState();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); calculate(); }
      });
      input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__grmcRequired = { restore: function (saved) {
      if (!saved) return;
      state.requiredFinal = saved;
      if (saved.currentGrade !== '' && saved.currentGrade != null) currentGradeInput.value = saved.currentGrade;
      if (saved.finalWeight  !== '' && saved.finalWeight  != null) finalWeightInput.value = saved.finalWeight;
      if (saved.targetGrade  !== '' && saved.targetGrade  != null) targetGradeInput.value = saved.targetGrade;
    } };
  })();

  /* ============================================================
     MODE 3 — WHAT-IF FINAL
  ============================================================ */

  (function whatIfMode() {
    var currentGradeInput = document.getElementById('grmc-whatif-current-grade');
    var finalWeightInput  = document.getElementById('grmc-whatif-final-weight');
    var expectedFinalInput = document.getElementById('grmc-whatif-expected-final');
    var validationEl      = document.getElementById('grmc-whatif-validation');
    var resultsEl          = document.getElementById('grmc-whatif-results');
    var calcBtn             = document.getElementById('grmc-whatif-calc-btn');
    var resetBtn            = document.getElementById('grmc-whatif-reset-btn');

    var displayEl        = document.getElementById('grmc-whatif-display');
    var currentStatEl     = document.getElementById('grmc-whatif-current-stat');
    var expectedStatEl    = document.getElementById('grmc-whatif-expected-stat');
    var weightStatEl      = document.getElementById('grmc-whatif-weight-stat');
    var insightsListEl   = document.getElementById('grmc-whatif-insights-list');
    var insightsCardEl   = document.getElementById('grmc-whatif-insights-card');

    var inputs = [currentGradeInput, finalWeightInput, expectedFinalInput];

    function clearErrors() {
      inputs.forEach(function (i) { i.classList.remove('grmc-input--error'); });
      hideValidation(validationEl);
    }

    function validate() {
      clearErrors();

      var raw = {
        currentGrade:  currentGradeInput.value.trim(),
        finalWeight:   finalWeightInput.value.trim(),
        expectedFinal: expectedFinalInput.value.trim()
      };

      if (isBlank(raw.currentGrade))  { showValidation(validationEl, 'Enter your current grade.', currentGradeInput); return null; }
      if (isBlank(raw.finalWeight))   { showValidation(validationEl, 'Enter the final exam weight.', finalWeightInput); return null; }
      if (isBlank(raw.expectedFinal)) { showValidation(validationEl, 'Enter your expected final score.', expectedFinalInput); return null; }

      var currentGrade  = Number(raw.currentGrade);
      var finalWeight   = Number(raw.finalWeight);
      var expectedFinal = Number(raw.expectedFinal);

      if (!isValidNumber(currentGrade))  { showValidation(validationEl, 'Current grade must be a valid number.', currentGradeInput); return null; }
      if (!isValidNumber(finalWeight))   { showValidation(validationEl, 'Final exam weight must be a valid number.', finalWeightInput); return null; }
      if (!isValidNumber(expectedFinal)) { showValidation(validationEl, 'Expected final score must be a valid number.', expectedFinalInput); return null; }

      if (currentGrade < 0)    { showValidation(validationEl, 'Current grade cannot be negative.', currentGradeInput); return null; }
      if (currentGrade > 100)  { showValidation(validationEl, 'Current grade cannot exceed 100.', currentGradeInput); return null; }
      if (finalWeight <= 0)    { showValidation(validationEl, 'Final exam weight must be greater than zero.', finalWeightInput); return null; }
      if (finalWeight > 100)   { showValidation(validationEl, 'Final exam weight cannot exceed 100.', finalWeightInput); return null; }
      if (expectedFinal < 0)   { showValidation(validationEl, 'Expected final score cannot be negative.', expectedFinalInput); return null; }
      if (expectedFinal > 100) { showValidation(validationEl, 'Expected final score cannot exceed 100.', expectedFinalInput); return null; }

      return { currentGrade: currentGrade, finalWeight: finalWeight, expectedFinal: expectedFinal };
    }

    function compute(v) {
      var finalWeightDecimal = v.finalWeight / 100;
      var projected = v.currentGrade * (1 - finalWeightDecimal) + v.expectedFinal * finalWeightDecimal;
      return { projected: projected, v: v };
    }

    function renderInsights(d) {
      var items = [];
      var v = d.v;
      var diff = d.projected - v.currentGrade;

      if (diff > EPSILON) {
        items.push({ icon: ICON_CHECK, text: 'Scoring ' + fmtNum(v.expectedFinal) + '% on the final would raise your overall grade by ' + diff.toFixed(1) + ' points, to ' + fmtPct(d.projected) + '.' });
      } else if (diff < -EPSILON) {
        items.push({ icon: ICON_WARN, text: 'Scoring ' + fmtNum(v.expectedFinal) + '% on the final would lower your overall grade by ' + Math.abs(diff).toFixed(1) + ' points, to ' + fmtPct(d.projected) + '.' });
      } else {
        items.push({ icon: ICON_INFO, text: 'This score would keep your overall grade unchanged at ' + fmtPct(d.projected) + '.' });
      }

      items.push({ icon: ICON_INFO, text: 'The final exam makes up ' + fmtPct(v.finalWeight) + ' of your total course grade in this scenario.' });

      if (Math.abs(v.expectedFinal - 100) < EPSILON) {
        items.push({ icon: ICON_CHECK, text: 'This is the highest possible final score — no scenario can push your grade higher at this weighting.' });
      } else if (v.expectedFinal < EPSILON) {
        items.push({ icon: ICON_WARN, text: 'A zero on the final would be the worst-case scenario at this weighting.' });
      }

      return items.slice(0, 3);
    }

    function calculate() {
      var v = validate();
      if (!v) return;

      var d = compute(v);

      displayEl.textContent = fmtPct(d.projected);
      currentStatEl.textContent = fmtPct(v.currentGrade);
      expectedStatEl.textContent = fmtPct(v.expectedFinal);
      weightStatEl.textContent = fmtPct(v.finalWeight);

      var insights = renderInsights(d);
      renderInsightsInto(insights, insightsListEl, insightsCardEl);

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetMode() {
      inputs.forEach(function (i) { i.value = ''; });
      clearErrors();
      resultsEl.hidden = true;
      state.whatIf = { currentGrade: '', finalWeight: '', expectedFinal: '' };
      saveState();
      moveRelatedBackToWrap();
      currentGradeInput.focus();
    }

    inputs.forEach(function (input) {
      input.addEventListener('input', function () {
        input.classList.remove('grmc-input--error');
        state.whatIf.currentGrade  = currentGradeInput.value;
        state.whatIf.finalWeight   = finalWeightInput.value;
        state.whatIf.expectedFinal = expectedFinalInput.value;
        saveState();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); calculate(); }
      });
      input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__grmcWhatIf = { restore: function (saved) {
      if (!saved) return;
      state.whatIf = saved;
      if (saved.currentGrade  !== '' && saved.currentGrade  != null) currentGradeInput.value = saved.currentGrade;
      if (saved.finalWeight   !== '' && saved.finalWeight   != null) finalWeightInput.value = saved.finalWeight;
      if (saved.expectedFinal !== '' && saved.expectedFinal != null) expectedFinalInput.value = saved.expectedFinal;
    } };
  })();

  /* ============================================================
     MODE 4 — BEST POSSIBLE
  ============================================================ */

  (function bestPossibleMode() {
    var currentGradeInput    = document.getElementById('grmc-best-current-grade');
    var remainingWeightInput = document.getElementById('grmc-best-remaining-weight');
    var validationEl        = document.getElementById('grmc-best-validation');
    var resultsEl            = document.getElementById('grmc-best-results');
    var calcBtn               = document.getElementById('grmc-best-calc-btn');
    var resetBtn              = document.getElementById('grmc-best-reset-btn');

    var displayEl        = document.getElementById('grmc-best-display');
    var explainEl        = document.getElementById('grmc-best-explain');
    var contributionStatEl = document.getElementById('grmc-best-contribution-stat');
    var remainingStatEl    = document.getElementById('grmc-best-remaining-stat');
    var futureStatEl       = document.getElementById('grmc-best-future-stat');
    var insightsListEl   = document.getElementById('grmc-best-insights-list');
    var insightsCardEl   = document.getElementById('grmc-best-insights-card');

    var inputs = [currentGradeInput, remainingWeightInput];

    function clearErrors() {
      inputs.forEach(function (i) { i.classList.remove('grmc-input--error'); });
      hideValidation(validationEl);
    }

    function validate() {
      clearErrors();

      var raw = {
        currentGrade:    currentGradeInput.value.trim(),
        remainingWeight: remainingWeightInput.value.trim()
      };

      if (isBlank(raw.currentGrade))    { showValidation(validationEl, 'Enter your current grade.', currentGradeInput); return null; }
      if (isBlank(raw.remainingWeight)) { showValidation(validationEl, 'Enter the remaining assessment weight.', remainingWeightInput); return null; }

      var currentGrade    = Number(raw.currentGrade);
      var remainingWeight = Number(raw.remainingWeight);

      if (!isValidNumber(currentGrade))    { showValidation(validationEl, 'Current grade must be a valid number.', currentGradeInput); return null; }
      if (!isValidNumber(remainingWeight)) { showValidation(validationEl, 'Remaining weight must be a valid number.', remainingWeightInput); return null; }

      if (currentGrade < 0)      { showValidation(validationEl, 'Current grade cannot be negative.', currentGradeInput); return null; }
      if (currentGrade > 100)    { showValidation(validationEl, 'Current grade cannot exceed 100.', currentGradeInput); return null; }
      if (remainingWeight < 0)   { showValidation(validationEl, 'Remaining weight cannot be negative.', remainingWeightInput); return null; }
      if (remainingWeight > 100) { showValidation(validationEl, 'Remaining weight cannot exceed 100.', remainingWeightInput); return null; }

      return { currentGrade: currentGrade, remainingWeight: remainingWeight };
    }

    function compute(v) {
      var remainingWeightDecimal = v.remainingWeight / 100;
      var completedWeightDecimal = 1 - remainingWeightDecimal;
      var currentContribution    = v.currentGrade * completedWeightDecimal;
      var maxFutureContribution  = 100 * remainingWeightDecimal;
      var bestPossible = currentContribution + maxFutureContribution;
      return {
        remainingWeightDecimal: remainingWeightDecimal,
        currentContribution: currentContribution,
        maxFutureContribution: maxFutureContribution,
        bestPossible: bestPossible,
        v: v
      };
    }

    function renderInsights(d) {
      var items = [];
      var v = d.v;

      if (d.remainingWeightDecimal <= EPSILON) {
        items.push({ icon: ICON_INFO, text: 'Your course is fully complete — there is no remaining weight left to change your final grade.' });
        return items.slice(0, 3);
      }

      var upside = d.bestPossible - v.currentGrade;
      items.push({ icon: ICON_CHECK, text: 'Scoring perfectly on everything remaining could raise your grade by up to ' + upside.toFixed(1) + ' points.' });
      items.push({ icon: ICON_INFO, text: 'Remaining assessments make up ' + fmtPct(v.remainingWeight) + ' of your total course grade.' });

      if (d.remainingWeightDecimal >= 0.5 - EPSILON) {
        items.push({ icon: ICON_WARN, text: 'More than half of your course grade is still undetermined — remaining performance will heavily influence your final result.' });
      }

      return items.slice(0, 3);
    }

    function calculate() {
      var v = validate();
      if (!v) return;

      var d = compute(v);

      displayEl.textContent = fmtPct(d.bestPossible);
      explainEl.textContent = d.remainingWeightDecimal <= EPSILON
        ? 'There are no remaining assessments — this is your current final grade.'
        : 'This assumes a 100% score across all remaining assessments.';

      contributionStatEl.textContent = fmtPct(d.currentContribution);
      remainingStatEl.textContent = fmtPct(v.remainingWeight);
      futureStatEl.textContent = fmtPct(d.maxFutureContribution);

      var insights = renderInsights(d);
      renderInsightsInto(insights, insightsListEl, insightsCardEl);

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetMode() {
      inputs.forEach(function (i) { i.value = ''; });
      clearErrors();
      resultsEl.hidden = true;
      state.bestPossible = { currentGrade: '', remainingWeight: '' };
      saveState();
      moveRelatedBackToWrap();
      currentGradeInput.focus();
    }

    inputs.forEach(function (input) {
      input.addEventListener('input', function () {
        input.classList.remove('grmc-input--error');
        state.bestPossible.currentGrade    = currentGradeInput.value;
        state.bestPossible.remainingWeight = remainingWeightInput.value;
        saveState();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); calculate(); }
      });
      input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__grmcBest = { restore: function (saved) {
      if (!saved) return;
      state.bestPossible = saved;
      if (saved.currentGrade    !== '' && saved.currentGrade    != null) currentGradeInput.value = saved.currentGrade;
      if (saved.remainingWeight !== '' && saved.remainingWeight != null) remainingWeightInput.value = saved.remainingWeight;
    } };
  })();

  /* ============================================================
     MODE 5 — TARGET COMPARISON
  ============================================================ */

  (function targetComparisonMode() {
    var currentGradeInput    = document.getElementById('grmc-compare-current-grade');
    var remainingWeightInput = document.getElementById('grmc-compare-remaining-weight');
    var validationEl        = document.getElementById('grmc-compare-validation');
    var resultsEl            = document.getElementById('grmc-compare-results');
    var calcBtn               = document.getElementById('grmc-compare-calc-btn');
    var resetBtn              = document.getElementById('grmc-compare-reset-btn');

    var tbodyEl        = document.getElementById('grmc-compare-tbody');
    var cardsEl         = document.getElementById('grmc-compare-cards');
    var insightsListEl = document.getElementById('grmc-compare-insights-list');
    var insightsCardEl = document.getElementById('grmc-compare-insights-card');

    var inputs = [currentGradeInput, remainingWeightInput];

    var STATUS_LABEL = {
      achieved:   'Achieved',
      achievable: 'Achievable',
      perfect:    'Perfect Required',
      impossible: 'Not Possible'
    };

    function clearErrors() {
      inputs.forEach(function (i) { i.classList.remove('grmc-input--error'); });
      hideValidation(validationEl);
    }

    function validate() {
      clearErrors();

      var raw = {
        currentGrade:    currentGradeInput.value.trim(),
        remainingWeight: remainingWeightInput.value.trim()
      };

      if (isBlank(raw.currentGrade))    { showValidation(validationEl, 'Enter your current grade.', currentGradeInput); return null; }
      if (isBlank(raw.remainingWeight)) { showValidation(validationEl, 'Enter the remaining assessment weight.', remainingWeightInput); return null; }

      var currentGrade    = Number(raw.currentGrade);
      var remainingWeight = Number(raw.remainingWeight);

      if (!isValidNumber(currentGrade))    { showValidation(validationEl, 'Current grade must be a valid number.', currentGradeInput); return null; }
      if (!isValidNumber(remainingWeight)) { showValidation(validationEl, 'Remaining weight must be a valid number.', remainingWeightInput); return null; }

      if (currentGrade < 0)      { showValidation(validationEl, 'Current grade cannot be negative.', currentGradeInput); return null; }
      if (currentGrade > 100)    { showValidation(validationEl, 'Current grade cannot exceed 100.', currentGradeInput); return null; }
      if (remainingWeight <= 0)  { showValidation(validationEl, 'Remaining weight must be greater than zero.', remainingWeightInput); return null; }
      if (remainingWeight > 100) { showValidation(validationEl, 'Remaining weight cannot exceed 100.', remainingWeightInput); return null; }

      return { currentGrade: currentGrade, remainingWeight: remainingWeight };
    }

    function compute(v) {
      var remainingWeightDecimal = v.remainingWeight / 100;
      var completedWeightDecimal = 1 - remainingWeightDecimal;

      var results = DEFAULT_TARGETS.map(function (target) {
        var required = (target - v.currentGrade * completedWeightDecimal) / remainingWeightDecimal;
        var status;
        if (required <= EPSILON) {
          status = 'achieved';
        } else if (required > 100 + EPSILON) {
          status = 'impossible';
        } else if (required >= 100 - 1e-4) {
          status = 'perfect';
        } else {
          status = 'achievable';
        }
        return { target: target, required: required, status: status };
      });

      return { results: results, v: v };
    }

    function renderInsights(d) {
      var items = [];
      var v = d.v;
      var results = d.results;

      var achievedTargets   = results.filter(function (r) { return r.status === 'achieved'; }).map(function (r) { return r.target; });
      var impossibleTargets = results.filter(function (r) { return r.status === 'impossible'; }).map(function (r) { return r.target; });
      var reachableTargets  = results.filter(function (r) { return r.status !== 'impossible'; }).map(function (r) { return r.target; });

      if (achievedTargets.length) {
        items.push({ icon: ICON_CHECK, text: 'You have already secured a final grade of at least ' + fmtNum(Math.max.apply(null, achievedTargets)) + '%, regardless of your remaining performance.' });
      } else if (reachableTargets.length) {
        items.push({ icon: ICON_INFO, text: 'The highest target you can realistically reach is ' + fmtNum(Math.max.apply(null, reachableTargets)) + '%, based on your current position.' });
      }

      if (impossibleTargets.length) {
        items.push({ icon: ICON_WARN, text: 'Targets of ' + fmtNum(Math.min.apply(null, impossibleTargets)) + '% and above are not reachable from here, even with a perfect score on everything remaining.' });
      }

      items.push({ icon: ICON_INFO, text: 'Remaining assessments make up ' + fmtPct(v.remainingWeight) + ' of your total course grade.' });

      return items.slice(0, 3);
    }

    function calculate() {
      var v = validate();
      if (!v) return;

      var d = compute(v);

      tbodyEl.innerHTML = d.results.map(function (r) {
        var pillCls = 'grmc-pill grmc-pill--' + r.status;
        var requiredDisplay = r.status === 'impossible' ? 'Not possible' : fmtPct(Math.max(0, r.required));
        return '<tr>' +
          '<td>' + esc(fmtNum(r.target)) + '%</td>' +
          '<td>' + esc(requiredDisplay) + '</td>' +
          '<td><span class="' + pillCls + '">' + esc(STATUS_LABEL[r.status]) + '</span></td>' +
          '</tr>';
      }).join('');

      cardsEl.innerHTML = d.results.map(function (r) {
        var pillCls = 'grmc-pill grmc-pill--' + r.status;
        var requiredDisplay = r.status === 'impossible' ? 'Not possible' : fmtPct(Math.max(0, r.required));
        return '<div class="grmc-compare-card">' +
          '<span class="grmc-compare-card-target">' + esc(fmtNum(r.target)) + '%</span>' +
          '<span class="grmc-compare-card-mid">' +
            '<span class="grmc-compare-card-required">' + esc(requiredDisplay) + '</span>' +
            '<span class="grmc-compare-card-label">Required on remaining</span>' +
          '</span>' +
          '<span class="' + pillCls + '">' + esc(STATUS_LABEL[r.status]) + '</span>' +
          '</div>';
      }).join('');

      var insights = renderInsights(d);
      renderInsightsInto(insights, insightsListEl, insightsCardEl);

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetMode() {
      inputs.forEach(function (i) { i.value = ''; });
      clearErrors();
      resultsEl.hidden = true;
      state.targetComparison = { currentGrade: '', remainingWeight: '' };
      saveState();
      moveRelatedBackToWrap();
      currentGradeInput.focus();
    }

    inputs.forEach(function (input) {
      input.addEventListener('input', function () {
        input.classList.remove('grmc-input--error');
        state.targetComparison.currentGrade    = currentGradeInput.value;
        state.targetComparison.remainingWeight = remainingWeightInput.value;
        saveState();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); calculate(); }
      });
      input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__grmcCompare = { restore: function (saved) {
      if (!saved) return;
      state.targetComparison = saved;
      if (saved.currentGrade    !== '' && saved.currentGrade    != null) currentGradeInput.value = saved.currentGrade;
      if (saved.remainingWeight !== '' && saved.remainingWeight != null) remainingWeightInput.value = saved.remainingWeight;
    } };
  })();

  /* ============================================
     INITIALISATION
  ============================================ */

  (function init() {
    var saved = loadState();

    if (saved) {
      window.__grmcCurrent.restore(saved.currentGrade);
      window.__grmcRequired.restore(saved.requiredFinal);
      window.__grmcWhatIf.restore(saved.whatIf);
      window.__grmcBest.restore(saved.bestPossible);
      window.__grmcCompare.restore(saved.targetComparison);

      var mode = (saved.activeMode && MODES.indexOf(saved.activeMode) !== -1) ? saved.activeMode : 'current-grade';
      switchMode(mode, false, false);
    } else {
      window.__grmcCurrent.restore(null);
      switchMode('current-grade', false, false);
    }

    if (window.P50ToolBase) {
      P50ToolBase.renderRelatedTools(
        'grmc-related-grid',
        'grade-required-marks-calculator',
        'student-tools'
      );
    }
  })();

})();
