/* ============================================
   MARKS-PERCENTAGE.JS — Project 50
   Marks Percentage Calculator — 5 modes, 1 calculator

   FORMULAS
   ────────
   Quick:        % = (Obtained ÷ Maximum) × 100
   Subjects:     Overall % = (Σ Obtained ÷ Σ Maximum) × 100   (never average subject %s)
   Target:       Required Total = (Target% ÷ 100) × (CurrentMax + RemainingMax)
                 Marks Needed   = Required Total − CurrentObtained
                 Required Remaining % = (Marks Needed ÷ RemainingMax) × 100
   Best Subjects: rank by subject %, sum top N obtained ÷ top N maximum × 100
   Goal:         same mathematics as Target, goal-oriented framing

   Full floating-point precision internally. Round only for display.

   STORAGE KEY: p50_marks_percentage_calculator
   Saves: activeMode + each mode's input data only (never results).
   300ms debounce. Reset clears only the active mode's stored data.

   RESULT HIERARCHY (per mode)
   ────────────────────────────
   Hero Result → Key Summary → Mode-Specific Analysis → Insights
============================================ */

(function () {
  'use strict';

  /* ============================================
     CONSTANTS
  ============================================ */

  var STORAGE_KEY = 'p50_marks_percentage_calculator';
  var SAVE_DEBOUNCE_MS = 300;
  var EPSILON = 1e-6;
  var MIN_SUBJECTS = 1;
  var MAX_SUBJECTS = 20;

  var ICON_CHECK =
    '<svg class="mpc-insight-icon mpc-insight-icon--positive" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>';

  var ICON_INFO =
    '<svg class="mpc-insight-icon mpc-insight-icon--neutral" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

  var ICON_WARN =
    '<svg class="mpc-insight-icon mpc-insight-icon--warning" viewBox="0 0 24 24" fill="none" ' +
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

  var MODES = ['quick', 'subjects', 'target', 'best', 'goal'];
  var tablist  = document.querySelector('.mpc-mode-selector');
  var tabEls   = {};
  var panelEls = {};
  MODES.forEach(function (m) {
    tabEls[m]   = document.getElementById('mpc-tab-' + m);
    panelEls[m] = document.getElementById('mpc-panel-' + m);
  });

  /* ============================================
     STATE
  ============================================ */

  var state = {
    activeMode: 'quick',
    quick:    { obtained: '', maximum: '' },
    subjects: { rows: [] },
    target:   { currentObtained: '', currentMax: '', remainingMax: '', targetPct: '' },
    best:     { rows: [], bestN: 5 },
    goal:     { currentObtained: '', currentMax: '', futureMax: '', desiredPct: '' }
  };

  function genId() {
    return 'row_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  /* ============================================
     CLASSIFICATION
  ============================================ */

  function classify(pct) {
    if (pct >= 90) return 'Outstanding';
    if (pct >= 80) return 'Excellent';
    if (pct >= 70) return 'Very Good';
    if (pct >= 60) return 'Good';
    if (pct >= 50) return 'Satisfactory';
    return 'Needs Improvement';
  }

  function classifyText(pct) {
    return classify(pct) + ' — general guidance, not an official grading standard';
  }

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
          quick: state.quick,
          subjects: {
            rows: state.subjects.rows.map(function (r) {
              return { id: r.id, name: r.name, obtained: r.obtained, maximum: r.maximum };
            })
          },
          target: state.target,
          best: {
            bestN: state.best.bestN,
            rows: state.best.rows.map(function (r) {
              return { id: r.id, name: r.name, obtained: r.obtained, maximum: r.maximum };
            })
          },
          goal: state.goal
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
     SUBJECT ROW COMPONENT
     Shared between Multiple Subjects + Best Subjects
  ============================================ */

  function buildSubjectRow(subj) {
    var row = document.createElement('div');
    row.className = 'mpc-subject-row';
    row.setAttribute('role', 'listitem');
    row.dataset.rowId = subj.id;

    var nameVal     = esc(subj.name || '');
    var obtainedVal = (subj.obtained !== '' && subj.obtained != null) ? esc(String(subj.obtained)) : '';
    var maxVal      = (subj.maximum !== '' && subj.maximum != null) ? esc(String(subj.maximum)) : '';

    row.innerHTML =
      '<div class="mpc-name-field">' +
        '<span class="mpc-field-mobile-label" aria-hidden="true">Subject</span>' +
        '<input type="text" class="mpc-name-input tool-input" placeholder="e.g. Mathematics"' +
          ' value="' + nameVal + '" aria-label="Subject name (optional)" autocomplete="off">' +
      '</div>' +
      '<div class="mpc-obtained-field">' +
        '<span class="mpc-field-mobile-label" aria-hidden="true">Obtained</span>' +
        '<input type="number" class="mpc-obtained-input tool-input" placeholder="e.g. 85"' +
          ' value="' + obtainedVal + '" min="0" step="any" inputmode="decimal" aria-label="Marks obtained">' +
      '</div>' +
      '<div class="mpc-max-field">' +
        '<span class="mpc-field-mobile-label" aria-hidden="true">Maximum</span>' +
        '<input type="number" class="mpc-max-input tool-input" placeholder="e.g. 100"' +
          ' value="' + maxVal + '" min="0" step="any" inputmode="decimal" aria-label="Maximum marks">' +
      '</div>' +
      '<button class="mpc-remove-btn" data-row-id="' + esc(subj.id) + '"' +
        ' type="button" aria-label="Remove this subject">' +
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
      frag.appendChild(buildSubjectRow(rows[i]));
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
    var rowEls = listEl.querySelectorAll('.mpc-subject-row');
    for (var i = 0; i < rowEls.length; i++) {
      var rowEl = rowEls[i];
      var id    = rowEl.dataset.rowId;
      var subj  = findRow(rows, id);
      if (!subj) continue;
      subj.name     = rowEl.querySelector('.mpc-name-input').value;
      subj.obtained = parseFloat(rowEl.querySelector('.mpc-obtained-input').value);
      subj.maximum  = parseFloat(rowEl.querySelector('.mpc-max-input').value);
    }
  }

  function addSubjectRow(rows, listEl, data, focusAfter) {
    if (rows.length >= MAX_SUBJECTS) return;
    var subj = {
      id:       (data && data.id)               ? data.id       : genId(),
      name:     (data && data.name)              ? data.name     : '',
      obtained: (data && data.obtained != null)  ? data.obtained : '',
      maximum:  (data && data.maximum != null)   ? data.maximum  : ''
    };
    rows.push(subj);

    if (!data) {
      var row = buildSubjectRow(subj);
      listEl.appendChild(row);
      if (focusAfter) {
        var input = row.querySelector('.mpc-name-input');
        if (input) setTimeout(function () { input.focus(); }, 50);
      }
      saveState();
    }
  }

  function removeSubjectRowFromState(rows, id) {
    var idx = -1;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) { idx = i; break; }
    }
    if (idx !== -1) rows.splice(idx, 1);
    saveState();
  }

  function wireSubjectList(listEl, rows, hideResultsFn, onCountChange) {
    listEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.mpc-remove-btn');
      if (!btn) return;
      if (rows.length <= MIN_SUBJECTS) return;
      var id  = btn.dataset.rowId;
      var row = btn.closest('.mpc-subject-row');
      if (!row) return;
      row.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
      row.style.opacity    = '0';
      row.style.transform  = 'translateX(8px)';
      setTimeout(function () {
        row.remove();
        removeSubjectRowFromState(rows, id);
        if (onCountChange) onCountChange();
      }, 180);
    });

    listEl.addEventListener('input', function (e) {
      if (
        e.target.matches('.mpc-name-input') ||
        e.target.matches('.mpc-obtained-input') ||
        e.target.matches('.mpc-max-input')
      ) {
        readRowsIntoState(listEl, rows);
        saveState();
        if (e.target.matches('.mpc-obtained-input') || e.target.matches('.mpc-max-input')) {
          e.target.classList.remove('mpc-input--error');
        }
      }
    });
  }

  /* ============================================
     MODE SWITCHING
  ============================================ */

  function switchMode(mode, focusTab) {
    if (MODES.indexOf(mode) === -1) return;
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
      input.classList.add('mpc-input--error');
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

  /* ============================================================
     MODE 1 — QUICK CALCULATE
  ============================================================ */

  (function quickMode() {
    var obtainedInput = document.getElementById('mpc-quick-obtained');
    var maxInput       = document.getElementById('mpc-quick-max');
    var validationEl   = document.getElementById('mpc-quick-validation');
    var resultsEl       = document.getElementById('mpc-quick-results');
    var calcBtn         = document.getElementById('mpc-quick-calc-btn');
    var resetBtn        = document.getElementById('mpc-quick-reset-btn');

    var displayEl        = document.getElementById('mpc-quick-display');
    var classificationEl = document.getElementById('mpc-quick-classification');
    var obtainedStatEl   = document.getElementById('mpc-quick-obtained-stat');
    var maxStatEl        = document.getElementById('mpc-quick-max-stat');
    var lostStatEl       = document.getElementById('mpc-quick-lost-stat');
    var insightEl        = document.getElementById('mpc-quick-insight');

    var inputs = [obtainedInput, maxInput];

    function clearErrors() {
      inputs.forEach(function (i) { i.classList.remove('mpc-input--error'); });
      hideValidation(validationEl);
    }

    function validate() {
      clearErrors();
      var obtainedRaw = obtainedInput.value.trim();
      var maxRaw      = maxInput.value.trim();

      if (isBlank(obtainedRaw)) {
        showValidation(validationEl, 'Enter the marks obtained.', obtainedInput);
        return null;
      }
      if (isBlank(maxRaw)) {
        showValidation(validationEl, 'Enter the maximum marks.', maxInput);
        return null;
      }

      var obtained = Number(obtainedRaw);
      var maximum  = Number(maxRaw);

      if (!isValidNumber(obtained)) {
        showValidation(validationEl, 'Marks obtained must be a valid number.', obtainedInput);
        return null;
      }
      if (!isValidNumber(maximum)) {
        showValidation(validationEl, 'Maximum marks must be a valid number.', maxInput);
        return null;
      }
      if (obtained < 0) {
        showValidation(validationEl, 'Marks obtained cannot be negative.', obtainedInput);
        return null;
      }
      if (maximum <= 0) {
        showValidation(validationEl, 'Maximum marks must be greater than zero.', maxInput);
        return null;
      }
      if (obtained > maximum) {
        showValidation(validationEl, 'Marks obtained cannot exceed maximum marks.', obtainedInput);
        return null;
      }

      return { obtained: obtained, maximum: maximum };
    }

    function buildInsight(pct, obtained, maximum) {
      if (Math.abs(pct - 100) < EPSILON) {
        return 'Perfect score — you obtained every available mark.';
      }
      if (pct === 0) {
        return 'No marks were obtained out of ' + fmtNum(maximum) + ' available.';
      }
      var lost = maximum - obtained;
      return 'You lost ' + fmtNum(lost) + ' mark' + (lost === 1 ? '' : 's') +
        ' out of ' + fmtNum(maximum) + ' — scoring ' + fmtNum(lost) + ' more would have meant a perfect result.';
    }

    function calculate() {
      var v = validate();
      if (!v) return;

      var pct = (v.obtained / v.maximum) * 100;

      displayEl.textContent = fmtPct(pct);
      classificationEl.textContent = classifyText(pct);
      obtainedStatEl.textContent = fmtNum(v.obtained);
      maxStatEl.textContent = fmtNum(v.maximum);
      lostStatEl.textContent = fmtNum(v.maximum - v.obtained);
      insightEl.textContent = buildInsight(pct, v.obtained, v.maximum);

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetMode() {
      obtainedInput.value = '';
      maxInput.value = '';
      clearErrors();
      resultsEl.hidden = true;
      state.quick = { obtained: '', maximum: '' };
      saveState();
      obtainedInput.focus();
    }

    inputs.forEach(function (input) {
      input.addEventListener('input', function () {
        input.classList.remove('mpc-input--error');
        state.quick.obtained = obtainedInput.value;
        state.quick.maximum  = maxInput.value;
        saveState();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); calculate(); }
      });
      input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__mpcQuick = { restore: function (saved) {
      if (!saved) return;
      state.quick = saved;
      if (saved.obtained !== '' && saved.obtained != null) obtainedInput.value = saved.obtained;
      if (saved.maximum  !== '' && saved.maximum  != null) maxInput.value = saved.maximum;
    } };
  })();

  /* ============================================================
     MODE 2 — MULTIPLE SUBJECTS
  ============================================================ */

  (function subjectsMode() {
    var listEl        = document.getElementById('mpc-subjects-list');
    var validationEl  = document.getElementById('mpc-subjects-validation');
    var resultsEl      = document.getElementById('mpc-subjects-results');
    var addBtn         = document.getElementById('mpc-subjects-add-btn');
    var calcBtn         = document.getElementById('mpc-subjects-calc-btn');
    var resetBtn        = document.getElementById('mpc-subjects-reset-btn');

    var displayEl        = document.getElementById('mpc-subjects-display');
    var classificationEl = document.getElementById('mpc-subjects-classification');
    var countEl          = document.getElementById('mpc-subjects-count');
    var totalObtainedEl  = document.getElementById('mpc-subjects-total-obtained');
    var totalMaxEl        = document.getElementById('mpc-subjects-total-max');
    var bestPctEl         = document.getElementById('mpc-subjects-best-pct');
    var bestLabelEl       = document.getElementById('mpc-subjects-best-label');
    var worstPctEl        = document.getElementById('mpc-subjects-worst-pct');
    var worstLabelEl      = document.getElementById('mpc-subjects-worst-label');
    var breakdownEl       = document.getElementById('mpc-subjects-breakdown');
    var insightsListEl    = document.getElementById('mpc-subjects-insights-list');
    var insightsCardEl    = document.getElementById('mpc-subjects-insights-card');

    var rows = state.subjects.rows;

    function hideResults() { resultsEl.hidden = true; }

    wireSubjectList(listEl, rows, hideResults, function () {
      if (rows.length === 0) hideResults();
    });

    function clearErrors() {
      var inputs = listEl.querySelectorAll('.tool-input');
      for (var i = 0; i < inputs.length; i++) inputs[i].classList.remove('mpc-input--error');
      hideValidation(validationEl);
    }

    function validate() {
      readRowsIntoState(listEl, rows);
      var rowEls = listEl.querySelectorAll('.mpc-subject-row');
      clearErrors();

      if (rows.length < MIN_SUBJECTS) {
        showValidation(validationEl, 'Add at least one subject before calculating.');
        return null;
      }
      if (rows.length > MAX_SUBJECTS) {
        showValidation(validationEl, 'You can add a maximum of ' + MAX_SUBJECTS + ' subjects.');
        return null;
      }

      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var label = r.name || ('Subject ' + (i + 1));

        if (isBlank(r.obtained) || !isValidNumber(r.obtained)) {
          showValidation(validationEl, 'Enter valid obtained marks for ' + label + '.');
          markError(rowEls[i].querySelector('.mpc-obtained-input'));
          return null;
        }
        if (r.obtained < 0) {
          showValidation(validationEl, 'Obtained marks cannot be negative. Check ' + label + '.');
          markError(rowEls[i].querySelector('.mpc-obtained-input'));
          return null;
        }
        if (isBlank(r.maximum) || !isValidNumber(r.maximum)) {
          showValidation(validationEl, 'Enter valid maximum marks for ' + label + '.');
          markError(rowEls[i].querySelector('.mpc-max-input'));
          return null;
        }
        if (r.maximum <= 0) {
          showValidation(validationEl, 'Maximum marks must be greater than zero. Check ' + label + '.');
          markError(rowEls[i].querySelector('.mpc-max-input'));
          return null;
        }
        if (r.obtained > r.maximum) {
          showValidation(validationEl, 'Obtained marks cannot exceed maximum marks for ' + label + '.');
          markError(rowEls[i].querySelector('.mpc-obtained-input'));
          return null;
        }
      }

      return true;
    }

    function calculate() {
      if (!validate()) return;
      saveState();

      var totalObtained = 0, totalMax = 0;
      var withPct = rows.map(function (r, i) {
        var pct = (r.obtained / r.maximum) * 100;
        totalObtained += r.obtained;
        totalMax      += r.maximum;
        return { name: r.name || ('Subject ' + (i + 1)), obtained: r.obtained, maximum: r.maximum, pct: pct };
      });

      var overall = (totalObtained / totalMax) * 100;

      var best = withPct[0], worst = withPct[0];
      withPct.forEach(function (s) {
        if (s.pct > best.pct) best = s;
        if (s.pct < worst.pct) worst = s;
      });

      displayEl.textContent = fmtPct(overall);
      classificationEl.textContent = classifyText(overall);
      countEl.textContent = rows.length;
      totalObtainedEl.textContent = fmtNum(totalObtained);
      totalMaxEl.textContent = fmtNum(totalMax);

      bestPctEl.textContent = fmtPct(best.pct);
      bestLabelEl.textContent = 'Best: ' + best.name;
      worstPctEl.textContent = fmtPct(worst.pct);
      worstLabelEl.textContent = 'Lowest: ' + worst.name;

      breakdownEl.innerHTML = withPct.map(function (s) {
        return '<li><span class="mpc-breakdown-name">' + esc(s.name) + '</span>' +
          '<span class="mpc-breakdown-value">' + esc(fmtNum(s.obtained)) + ' / ' + esc(fmtNum(s.maximum)) +
          ' &middot; ' + esc(fmtPct(s.pct)) + '</span></li>';
      }).join('');

      renderInsights(buildInsights(overall, withPct, best, worst));

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();

      var relatedWrap = document.getElementById('mpc-related-wrap');
      if (relatedWrap && resultsEl.nextElementSibling !== relatedWrap) {
        resultsEl.after(relatedWrap);
      }
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function renderInsights(items) {
      if (!items.length) { insightsCardEl.hidden = true; return; }
      insightsCardEl.hidden = false;
      insightsListEl.innerHTML = items.map(function (item) {
        return '<li>' + item.icon + '<span>' + item.text + '</span></li>';
      }).join('');
    }

    function buildInsights(overall, withPct, best, worst) {
      var items = [];
      var range = best.pct - worst.pct;

      if (withPct.length >= 2 && range <= 5) {
        items.push({ icon: ICON_CHECK, text: 'Consistent performance across subjects — the spread between your best and lowest subject is only ' + range.toFixed(1) + ' points.' });
      } else if (withPct.length >= 2 && range > 30) {
        items.push({ icon: ICON_WARN, text: 'Large gap between subjects — ' + best.name + ' and ' + worst.name + ' differ by ' + range.toFixed(1) + ' points. Focusing on ' + worst.name + ' would raise your overall percentage the most.' });
      } else if (withPct.length >= 2) {
        items.push({ icon: ICON_INFO, text: best.name + ' is your strongest subject at ' + fmtPct(best.pct) + ', while ' + worst.name + ' is your weakest at ' + fmtPct(worst.pct) + '.' });
      }

      var gap = Math.abs(overall - (withPct.reduce(function (s, x) { return s + x.pct; }, 0) / withPct.length));
      if (gap >= 0.5) {
        items.push({ icon: ICON_INFO, text: 'Your overall percentage (' + fmtPct(overall) + ') differs from a simple average of subject percentages by ' + gap.toFixed(1) + ' points, because subjects carry different maximum marks.' });
      }

      if (overall >= 90) {
        items.push({ icon: ICON_CHECK, text: 'An outstanding overall result across all ' + withPct.length + ' subject' + (withPct.length === 1 ? '' : 's') + '.' });
      }

      return items.slice(0, 3);
    }

    function resetMode() {
      hideResults();
      clearErrors();
      state.subjects.rows = [];
      rows.length = 0;
      addSubjectRow(rows, listEl, null, false);
      addSubjectRow(rows, listEl, null, false);
      renderRowsFromState(listEl, rows);
      /* NOTE: storage is a single combined key shared by all modes — never
         call P50Storage.remove(STORAGE_KEY) here, or every other mode's
         saved data would be wiped too. saveState() persists the full
         current in-memory state, which only has THIS mode's data reset. */
      saveState();

      var toolWrap    = document.querySelector('.tool-wrap');
      var relatedWrap = document.getElementById('mpc-related-wrap');
      if (toolWrap && relatedWrap && !toolWrap.contains(relatedWrap)) {
        toolWrap.appendChild(relatedWrap);
      }
    }

    addBtn.addEventListener('click', function () {
      if (rows.length >= MAX_SUBJECTS) {
        showValidation(validationEl, 'You can add a maximum of ' + MAX_SUBJECTS + ' subjects.');
        return;
      }
      addSubjectRow(rows, listEl, null, true);
    });

    listEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); calculate(); }
    });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__mpcSubjects = {
      rows: rows,
      listEl: listEl,
      restore: function (saved) {
        if (saved && Array.isArray(saved.rows) && saved.rows.length) {
          saved.rows.forEach(function (r) { addSubjectRow(rows, listEl, r, false); });
          renderRowsFromState(listEl, rows);
        } else {
          addSubjectRow(rows, listEl, null, false);
          addSubjectRow(rows, listEl, null, false);
        }
      }
    };
  })();

  /* ============================================================
     MODE 3 — REACH A TARGET
  ============================================================ */

  (function targetMode() {
    var curObtainedInput = document.getElementById('mpc-target-current-obtained');
    var curMaxInput       = document.getElementById('mpc-target-current-max');
    var remMaxInput       = document.getElementById('mpc-target-remaining-max');
    var targetPctInput    = document.getElementById('mpc-target-percentage');
    var validationEl      = document.getElementById('mpc-target-validation');
    var resultsEl          = document.getElementById('mpc-target-results');
    var calcBtn             = document.getElementById('mpc-target-calc-btn');
    var resetBtn            = document.getElementById('mpc-target-reset-btn');

    var heroCardEl    = document.getElementById('mpc-target-hero-card');
    var badgeEl        = document.getElementById('mpc-target-status-badge');
    var statusTextEl   = document.getElementById('mpc-target-status-text');
    var currentPctEl    = document.getElementById('mpc-target-current-pct');
    var marksNeededEl   = document.getElementById('mpc-target-marks-needed');
    var requiredPctEl   = document.getElementById('mpc-target-required-remaining-pct');
    var noteEl          = document.getElementById('mpc-target-note');
    var insightsListEl  = document.getElementById('mpc-target-insights-list');
    var insightsCardEl  = document.getElementById('mpc-target-insights-card');

    var inputs = [curObtainedInput, curMaxInput, remMaxInput, targetPctInput];

    function clearErrors() {
      inputs.forEach(function (i) { i.classList.remove('mpc-input--error'); });
      hideValidation(validationEl);
    }

    function validate() {
      clearErrors();

      var vals = {
        currentObtained: curObtainedInput.value.trim(),
        currentMax:      curMaxInput.value.trim(),
        remainingMax:    remMaxInput.value.trim(),
        targetPct:       targetPctInput.value.trim()
      };

      if (isBlank(vals.currentObtained)) { showValidation(validationEl, 'Enter your current obtained marks.', curObtainedInput); return null; }
      if (isBlank(vals.currentMax))      { showValidation(validationEl, 'Enter your current maximum marks completed.', curMaxInput); return null; }
      if (isBlank(vals.remainingMax))    { showValidation(validationEl, 'Enter the remaining maximum marks.', remMaxInput); return null; }
      if (isBlank(vals.targetPct))       { showValidation(validationEl, 'Enter your target percentage.', targetPctInput); return null; }

      var currentObtained = Number(vals.currentObtained);
      var currentMax       = Number(vals.currentMax);
      var remainingMax      = Number(vals.remainingMax);
      var targetPct          = Number(vals.targetPct);

      if (!isValidNumber(currentObtained)) { showValidation(validationEl, 'Current obtained marks must be a valid number.', curObtainedInput); return null; }
      if (!isValidNumber(currentMax))      { showValidation(validationEl, 'Current maximum marks must be a valid number.', curMaxInput); return null; }
      if (!isValidNumber(remainingMax))    { showValidation(validationEl, 'Remaining maximum marks must be a valid number.', remMaxInput); return null; }
      if (!isValidNumber(targetPct))       { showValidation(validationEl, 'Target percentage must be a valid number.', targetPctInput); return null; }

      if (currentObtained < 0) { showValidation(validationEl, 'Current obtained marks cannot be negative.', curObtainedInput); return null; }
      if (currentMax <= 0)     { showValidation(validationEl, 'Current maximum marks must be greater than zero.', curMaxInput); return null; }
      if (remainingMax <= 0)   { showValidation(validationEl, 'Remaining maximum marks must be greater than zero.', remMaxInput); return null; }
      if (currentObtained > currentMax) { showValidation(validationEl, 'Current obtained marks cannot exceed current maximum marks.', curObtainedInput); return null; }
      if (targetPct <= 0)   { showValidation(validationEl, 'Target percentage must be greater than zero.', targetPctInput); return null; }
      if (targetPct > 100)  { showValidation(validationEl, 'Target percentage cannot exceed 100.', targetPctInput); return null; }

      return { currentObtained: currentObtained, currentMax: currentMax, remainingMax: remainingMax, targetPct: targetPct };
    }

    function compute(v) {
      var totalMax        = v.currentMax + v.remainingMax;
      var requiredTotal   = (v.targetPct / 100) * totalMax;
      var marksNeeded      = requiredTotal - v.currentObtained;
      var currentPct        = (v.currentObtained / v.currentMax) * 100;
      var requiredRemainingPct = (marksNeeded / v.remainingMax) * 100;

      var status;
      if (marksNeeded <= EPSILON) {
        status = 'achieved';
      } else if (requiredRemainingPct > 100 + EPSILON) {
        status = 'impossible';
      } else if (requiredRemainingPct >= 100 - 1e-4) {
        status = 'perfect';
      } else {
        status = 'achievable';
      }

      return {
        currentPct: currentPct,
        marksNeeded: Math.max(0, marksNeeded),
        requiredRemainingPct: Math.max(0, requiredRemainingPct),
        status: status,
        v: v
      };
    }

    var STATUS_META = {
      achieved:    { badge: 'Target Already Achieved', cls: 'mpc-status-badge--achieved' },
      achievable:  { badge: 'Target Is Achievable', cls: 'mpc-status-badge--achievable' },
      perfect:     { badge: 'Perfect Score Required', cls: 'mpc-status-badge--perfect' },
      impossible:  { badge: 'Target Not Achievable', cls: 'mpc-status-badge--impossible' }
    };

    function statusText(d) {
      var v = d.v;
      switch (d.status) {
        case 'achieved':
          return 'You have already secured ' + fmtPct(d.currentPct) + ', which meets or exceeds your ' + v.targetPct + '% target — even a zero on the rest would not undo it.';
        case 'achievable':
          return 'Score ' + fmtPct(d.requiredRemainingPct) + ' or better on the remaining ' + fmtNum(v.remainingMax) + ' marks to finish at ' + v.targetPct + '%.';
        case 'perfect':
          return 'You need every remaining mark — a perfect score on the remaining ' + fmtNum(v.remainingMax) + ' marks — to reach ' + v.targetPct + '%.';
        case 'impossible':
          return 'Even a perfect score on the remaining ' + fmtNum(v.remainingMax) + ' marks cannot reach ' + v.targetPct + '% from your current position.';
      }
      return '';
    }

    function noteText(d) {
      var v = d.v;
      if (d.status === 'impossible') {
        var maxPossible = ((v.currentObtained + v.remainingMax) / (v.currentMax + v.remainingMax)) * 100;
        return 'The highest percentage you could reach from here, even with full marks remaining, is ' + fmtPct(maxPossible) + '.';
      }
      return 'Required Total Marks = (Target % ÷ 100) × (Current Max + Remaining Max), then subtract what you already have.';
    }

    function renderInsights(d) {
      var items = [];
      var v = d.v;

      if (d.status === 'achieved') {
        var margin = d.currentPct - v.targetPct;
        items.push({ icon: ICON_CHECK, text: 'You are currently ' + margin.toFixed(1) + ' points above your target — a comfortable safety margin.' });
      } else if (d.status === 'impossible') {
        items.push({ icon: ICON_WARN, text: 'Consider setting a lower, achievable target, or check whether more assessments remain than entered.' });
      } else {
        var swing = d.requiredRemainingPct - d.currentPct;
        if (swing > 0) {
          items.push({ icon: ICON_WARN, text: 'You need to outperform your current average by ' + swing.toFixed(1) + ' points in the remaining assessments.' });
        } else {
          items.push({ icon: ICON_CHECK, text: 'The required remaining percentage is below your current average — maintaining your pace is enough.' });
        }
      }

      var weight = (v.remainingMax / (v.currentMax + v.remainingMax)) * 100;
      items.push({ icon: ICON_INFO, text: 'The remaining assessments make up ' + weight.toFixed(1) + '% of your total marks for this target.' });

      if (d.status === 'perfect') {
        items.push({ icon: ICON_WARN, text: 'There is zero margin for error — any dropped marks will make the target unreachable.' });
      }

      return items.slice(0, 3);
    }

    function calculate() {
      var v = validate();
      if (!v) return;

      var d = compute(v);
      var meta = STATUS_META[d.status];

      badgeEl.textContent = meta.badge;
      badgeEl.className = 'mpc-status-badge ' + meta.cls;
      statusTextEl.textContent = statusText(d);

      currentPctEl.textContent = fmtPct(d.currentPct);
      marksNeededEl.textContent = d.status === 'impossible' ? 'Not possible' : fmtNum(d.marksNeeded);
      requiredPctEl.textContent = d.status === 'impossible' ? 'Not possible' : fmtPct(d.requiredRemainingPct);
      noteEl.textContent = noteText(d);

      var insights = renderInsights(d);
      if (!insights.length) {
        insightsCardEl.hidden = true;
      } else {
        insightsCardEl.hidden = false;
        insightsListEl.innerHTML = insights.map(function (item) {
          return '<li>' + item.icon + '<span>' + item.text + '</span></li>';
        }).join('');
      }

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();

      var relatedWrap = document.getElementById('mpc-related-wrap');
      if (relatedWrap && resultsEl.nextElementSibling !== relatedWrap) {
        resultsEl.after(relatedWrap);
      }
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetMode() {
      inputs.forEach(function (i) { i.value = ''; });
      clearErrors();
      resultsEl.hidden = true;
      state.target = { currentObtained: '', currentMax: '', remainingMax: '', targetPct: '' };
      saveState();
      curObtainedInput.focus();
    }

    inputs.forEach(function (input) {
      input.addEventListener('input', function () {
        input.classList.remove('mpc-input--error');
        state.target.currentObtained = curObtainedInput.value;
        state.target.currentMax      = curMaxInput.value;
        state.target.remainingMax    = remMaxInput.value;
        state.target.targetPct       = targetPctInput.value;
        saveState();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); calculate(); }
      });
      input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__mpcTarget = { restore: function (saved) {
      if (!saved) return;
      state.target = saved;
      if (saved.currentObtained !== '' && saved.currentObtained != null) curObtainedInput.value = saved.currentObtained;
      if (saved.currentMax      !== '' && saved.currentMax      != null) curMaxInput.value = saved.currentMax;
      if (saved.remainingMax    !== '' && saved.remainingMax    != null) remMaxInput.value = saved.remainingMax;
      if (saved.targetPct       !== '' && saved.targetPct       != null) targetPctInput.value = saved.targetPct;
    } };
  })();

  /* ============================================================
     MODE 4 — BEST SUBJECTS
  ============================================================ */

  (function bestMode() {
    var listEl        = document.getElementById('mpc-best-list');
    var countInput    = document.getElementById('mpc-best-count');
    var validationEl  = document.getElementById('mpc-best-validation');
    var resultsEl      = document.getElementById('mpc-best-results');
    var addBtn         = document.getElementById('mpc-best-add-btn');
    var calcBtn         = document.getElementById('mpc-best-calc-btn');
    var resetBtn        = document.getElementById('mpc-best-reset-btn');

    var displayEl         = document.getElementById('mpc-best-display');
    var classificationEl  = document.getElementById('mpc-best-classification');
    var selectedObtainedEl = document.getElementById('mpc-best-selected-obtained');
    var selectedMaxEl      = document.getElementById('mpc-best-selected-max');
    var performerEl        = document.getElementById('mpc-best-performer');
    var selectedListEl     = document.getElementById('mpc-best-selected-list');
    var excludedListEl     = document.getElementById('mpc-best-excluded-list');
    var excludedCardEl     = document.getElementById('mpc-best-excluded-card');
    var insightsListEl     = document.getElementById('mpc-best-insights-list');
    var insightsCardEl     = document.getElementById('mpc-best-insights-card');

    var rows = state.best.rows;

    function hideResults() { resultsEl.hidden = true; }

    wireSubjectList(listEl, rows, hideResults, function () {
      if (rows.length === 0) hideResults();
    });

    function clearErrors() {
      var inputs = listEl.querySelectorAll('.tool-input');
      for (var i = 0; i < inputs.length; i++) inputs[i].classList.remove('mpc-input--error');
      countInput.classList.remove('mpc-input--error');
      hideValidation(validationEl);
    }

    function validate() {
      readRowsIntoState(listEl, rows);
      var rowEls = listEl.querySelectorAll('.mpc-subject-row');
      clearErrors();

      if (rows.length < MIN_SUBJECTS) {
        showValidation(validationEl, 'Add at least one subject before calculating.');
        return null;
      }
      if (rows.length > MAX_SUBJECTS) {
        showValidation(validationEl, 'You can add a maximum of ' + MAX_SUBJECTS + ' subjects.');
        return null;
      }

      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var label = r.name || ('Subject ' + (i + 1));

        if (isBlank(r.obtained) || !isValidNumber(r.obtained)) {
          showValidation(validationEl, 'Enter valid obtained marks for ' + label + '.');
          markError(rowEls[i].querySelector('.mpc-obtained-input'));
          return null;
        }
        if (r.obtained < 0) {
          showValidation(validationEl, 'Obtained marks cannot be negative. Check ' + label + '.');
          markError(rowEls[i].querySelector('.mpc-obtained-input'));
          return null;
        }
        if (isBlank(r.maximum) || !isValidNumber(r.maximum)) {
          showValidation(validationEl, 'Enter valid maximum marks for ' + label + '.');
          markError(rowEls[i].querySelector('.mpc-max-input'));
          return null;
        }
        if (r.maximum <= 0) {
          showValidation(validationEl, 'Maximum marks must be greater than zero. Check ' + label + '.');
          markError(rowEls[i].querySelector('.mpc-max-input'));
          return null;
        }
        if (r.obtained > r.maximum) {
          showValidation(validationEl, 'Obtained marks cannot exceed maximum marks for ' + label + '.');
          markError(rowEls[i].querySelector('.mpc-obtained-input'));
          return null;
        }
      }

      var bestNRaw = countInput.value.trim();
      if (isBlank(bestNRaw)) {
        showValidation(validationEl, 'Enter how many best subjects to use.', countInput);
        return null;
      }
      var bestN = Number(bestNRaw);
      if (!isValidNumber(bestN) || Math.floor(bestN) !== bestN) {
        showValidation(validationEl, 'Best-of count must be a whole number.', countInput);
        return null;
      }
      if (bestN < 1) {
        showValidation(validationEl, 'Best-of count must be at least 1.', countInput);
        return null;
      }
      if (bestN > rows.length) {
        showValidation(validationEl, 'Best-of count cannot exceed the number of subjects entered (' + rows.length + ').', countInput);
        return null;
      }

      state.best.bestN = bestN;
      return { bestN: bestN };
    }

    function calculate() {
      var v = validate();
      if (!v) return;
      saveState();

      var withPct = rows.map(function (r, i) {
        return {
          name: r.name || ('Subject ' + (i + 1)),
          obtained: r.obtained,
          maximum: r.maximum,
          pct: (r.obtained / r.maximum) * 100,
          origIndex: i
        };
      });

      /* Rank: higher % first; tie → higher maximum first; tie → original order */
      var ranked = withPct.slice().sort(function (a, b) {
        if (b.pct !== a.pct) return b.pct - a.pct;
        if (b.maximum !== a.maximum) return b.maximum - a.maximum;
        return a.origIndex - b.origIndex;
      });

      var selected = ranked.slice(0, v.bestN);
      var excluded = ranked.slice(v.bestN);

      var selObtained = selected.reduce(function (s, x) { return s + x.obtained; }, 0);
      var selMax       = selected.reduce(function (s, x) { return s + x.maximum; }, 0);
      var bestOfPct     = (selObtained / selMax) * 100;
      var performer      = ranked[0];

      displayEl.textContent = fmtPct(bestOfPct);
      classificationEl.textContent = classifyText(bestOfPct);
      selectedObtainedEl.textContent = fmtNum(selObtained);
      selectedMaxEl.textContent = fmtNum(selMax);
      performerEl.textContent = performer.name;

      selectedListEl.innerHTML = selected.map(function (s) {
        return '<li><span class="mpc-breakdown-name">' + esc(s.name) + '</span>' +
          '<span class="mpc-breakdown-value">' + esc(fmtNum(s.obtained)) + ' / ' + esc(fmtNum(s.maximum)) +
          ' &middot; ' + esc(fmtPct(s.pct)) + '</span></li>';
      }).join('');

      if (!excluded.length) {
        excludedCardEl.hidden = true;
      } else {
        excludedCardEl.hidden = false;
        excludedListEl.innerHTML = excluded.map(function (s) {
          return '<li><span class="mpc-breakdown-name">' + esc(s.name) + '</span>' +
            '<span class="mpc-breakdown-value">' + esc(fmtNum(s.obtained)) + ' / ' + esc(fmtNum(s.maximum)) +
            ' &middot; ' + esc(fmtPct(s.pct)) + '</span></li>';
        }).join('');
      }

      renderInsights(buildInsights(withPct, selected, excluded, bestOfPct, v.bestN));

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();

      var relatedWrap = document.getElementById('mpc-related-wrap');
      if (relatedWrap && resultsEl.nextElementSibling !== relatedWrap) {
        resultsEl.after(relatedWrap);
      }
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function renderInsights(items) {
      if (!items.length) { insightsCardEl.hidden = true; return; }
      insightsCardEl.hidden = false;
      insightsListEl.innerHTML = items.map(function (item) {
        return '<li>' + item.icon + '<span>' + item.text + '</span></li>';
      }).join('');
    }

    function buildInsights(withPct, selected, excluded, bestOfPct, bestN) {
      var items = [];
      var overallAll = (withPct.reduce(function (s, x) { return s + x.obtained; }, 0) /
                         withPct.reduce(function (s, x) { return s + x.maximum; }, 0)) * 100;

      var lift = bestOfPct - overallAll;
      if (lift > 0.5) {
        items.push({ icon: ICON_CHECK, text: 'Counting only your best ' + bestN + ' subject' + (bestN === 1 ? '' : 's') + ' raises your percentage by ' + lift.toFixed(1) + ' points over including all subjects.' });
      } else {
        items.push({ icon: ICON_INFO, text: 'Your best-' + bestN + ' percentage is close to your all-subject percentage, meaning your performance is fairly even.' });
      }

      if (excluded.length) {
        var lowestExcluded = excluded[0];
        items.push({ icon: ICON_INFO, text: lowestExcluded.name + ' is the highest-scoring subject that was excluded, at ' + fmtPct(lowestExcluded.pct) + '.' });
      }

      if (selected.length >= 2) {
        var spread = selected[0].pct - selected[selected.length - 1].pct;
        if (spread <= 5) {
          items.push({ icon: ICON_CHECK, text: 'Your selected subjects perform consistently — a spread of only ' + spread.toFixed(1) + ' points among them.' });
        }
      }

      return items.slice(0, 3);
    }

    function resetMode() {
      hideResults();
      clearErrors();
      state.best.rows = [];
      rows.length = 0;
      state.best.bestN = 5;
      countInput.value = '5';
      for (var i = 0; i < 5; i++) addSubjectRow(rows, listEl, null, false);
      renderRowsFromState(listEl, rows);
      /* NOTE: storage is a single combined key shared by all modes — never
         call P50Storage.remove(STORAGE_KEY) here, or every other mode's
         saved data would be wiped too. saveState() persists the full
         current in-memory state, which only has THIS mode's data reset. */
      saveState();

      var toolWrap    = document.querySelector('.tool-wrap');
      var relatedWrap = document.getElementById('mpc-related-wrap');
      if (toolWrap && relatedWrap && !toolWrap.contains(relatedWrap)) {
        toolWrap.appendChild(relatedWrap);
      }
    }

    addBtn.addEventListener('click', function () {
      if (rows.length >= MAX_SUBJECTS) {
        showValidation(validationEl, 'You can add a maximum of ' + MAX_SUBJECTS + ' subjects.');
        return;
      }
      addSubjectRow(rows, listEl, null, true);
    });

    listEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); calculate(); }
    });

    countInput.addEventListener('input', function () {
      countInput.classList.remove('mpc-input--error');
      state.best.bestN = countInput.value;
      saveState();
    });
    countInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); calculate(); }
    });
    countInput.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__mpcBest = {
      rows: rows,
      listEl: listEl,
      restore: function (saved) {
        if (saved && Array.isArray(saved.rows) && saved.rows.length) {
          saved.rows.forEach(function (r) { addSubjectRow(rows, listEl, r, false); });
          renderRowsFromState(listEl, rows);
          state.best.bestN = saved.bestN || Math.min(5, rows.length);
        } else {
          for (var i = 0; i < 5; i++) addSubjectRow(rows, listEl, null, false);
          state.best.bestN = 5;
        }
        countInput.value = state.best.bestN;
      }
    };
  })();

  /* ============================================================
     MODE 5 — PLAN MY GOAL
  ============================================================ */

  (function goalMode() {
    var curObtainedInput = document.getElementById('mpc-goal-current-obtained');
    var curMaxInput       = document.getElementById('mpc-goal-current-max');
    var futureMaxInput    = document.getElementById('mpc-goal-future-max');
    var desiredPctInput   = document.getElementById('mpc-goal-desired-pct');
    var validationEl      = document.getElementById('mpc-goal-validation');
    var resultsEl          = document.getElementById('mpc-goal-results');
    var calcBtn             = document.getElementById('mpc-goal-calc-btn');
    var resetBtn            = document.getElementById('mpc-goal-reset-btn');

    var badgeEl        = document.getElementById('mpc-goal-status-badge');
    var statusTextEl   = document.getElementById('mpc-goal-status-text');
    var currentPctEl    = document.getElementById('mpc-goal-current-pct');
    var requiredMarksEl = document.getElementById('mpc-goal-required-marks');
    var requiredPctEl   = document.getElementById('mpc-goal-required-pct');
    var noteEl          = document.getElementById('mpc-goal-note');
    var insightsListEl  = document.getElementById('mpc-goal-insights-list');
    var insightsCardEl  = document.getElementById('mpc-goal-insights-card');

    var inputs = [curObtainedInput, curMaxInput, futureMaxInput, desiredPctInput];

    function clearErrors() {
      inputs.forEach(function (i) { i.classList.remove('mpc-input--error'); });
      hideValidation(validationEl);
    }

    function validate() {
      clearErrors();

      var vals = {
        currentObtained: curObtainedInput.value.trim(),
        currentMax:      curMaxInput.value.trim(),
        futureMax:       futureMaxInput.value.trim(),
        desiredPct:      desiredPctInput.value.trim()
      };

      if (isBlank(vals.currentObtained)) { showValidation(validationEl, 'Enter your current obtained marks.', curObtainedInput); return null; }
      if (isBlank(vals.currentMax))      { showValidation(validationEl, 'Enter your current maximum marks.', curMaxInput); return null; }
      if (isBlank(vals.futureMax))       { showValidation(validationEl, 'Enter the future maximum marks.', futureMaxInput); return null; }
      if (isBlank(vals.desiredPct))      { showValidation(validationEl, 'Enter your desired final percentage.', desiredPctInput); return null; }

      var currentObtained = Number(vals.currentObtained);
      var currentMax       = Number(vals.currentMax);
      var futureMax          = Number(vals.futureMax);
      var desiredPct           = Number(vals.desiredPct);

      if (!isValidNumber(currentObtained)) { showValidation(validationEl, 'Current obtained marks must be a valid number.', curObtainedInput); return null; }
      if (!isValidNumber(currentMax))      { showValidation(validationEl, 'Current maximum marks must be a valid number.', curMaxInput); return null; }
      if (!isValidNumber(futureMax))       { showValidation(validationEl, 'Future maximum marks must be a valid number.', futureMaxInput); return null; }
      if (!isValidNumber(desiredPct))      { showValidation(validationEl, 'Desired final percentage must be a valid number.', desiredPctInput); return null; }

      if (currentObtained < 0) { showValidation(validationEl, 'Current obtained marks cannot be negative.', curObtainedInput); return null; }
      if (currentMax <= 0)     { showValidation(validationEl, 'Current maximum marks must be greater than zero.', curMaxInput); return null; }
      if (futureMax <= 0)      { showValidation(validationEl, 'Future maximum marks must be greater than zero.', futureMaxInput); return null; }
      if (currentObtained > currentMax) { showValidation(validationEl, 'Current obtained marks cannot exceed current maximum marks.', curObtainedInput); return null; }
      if (desiredPct <= 0)  { showValidation(validationEl, 'Desired final percentage must be greater than zero.', desiredPctInput); return null; }
      if (desiredPct > 100) { showValidation(validationEl, 'Desired final percentage cannot exceed 100.', desiredPctInput); return null; }

      return { currentObtained: currentObtained, currentMax: currentMax, futureMax: futureMax, desiredPct: desiredPct };
    }

    function compute(v) {
      var totalMax             = v.currentMax + v.futureMax;
      var requiredTotal        = (v.desiredPct / 100) * totalMax;
      var requiredFutureMarks  = requiredTotal - v.currentObtained;
      var currentPct             = (v.currentObtained / v.currentMax) * 100;
      var requiredFuturePct      = (requiredFutureMarks / v.futureMax) * 100;

      var status;
      if (requiredFutureMarks <= EPSILON) {
        status = 'secured';
      } else if (requiredFuturePct > 100 + EPSILON) {
        status = 'impossible';
      } else if (requiredFuturePct >= 100 - 1e-4) {
        status = 'perfect';
      } else {
        status = 'achievable';
      }

      return {
        currentPct: currentPct,
        requiredFutureMarks: Math.max(0, requiredFutureMarks),
        requiredFuturePct: Math.max(0, requiredFuturePct),
        status: status,
        v: v
      };
    }

    var STATUS_META = {
      secured:     { badge: 'Goal Already Secured', cls: 'mpc-status-badge--secured' },
      achievable:  { badge: 'Goal Is Achievable', cls: 'mpc-status-badge--achievable' },
      perfect:     { badge: 'Perfect Score Required', cls: 'mpc-status-badge--perfect' },
      impossible:  { badge: 'Goal Not Achievable', cls: 'mpc-status-badge--impossible' }
    };

    function statusText(d) {
      var v = d.v;
      switch (d.status) {
        case 'secured':
          return 'You have already secured a final percentage of at least ' + v.desiredPct + '% — your current position guarantees the goal.';
        case 'achievable':
          return 'Score ' + fmtPct(d.requiredFuturePct) + ' or better in the ' + fmtNum(v.futureMax) + ' marks still to come and you will finish at ' + v.desiredPct + '%.';
        case 'perfect':
          return 'Reaching ' + v.desiredPct + '% requires a perfect score across all remaining assessments.';
        case 'impossible':
          return 'From your current position, ' + v.desiredPct + '% is out of reach — even a perfect score on the remaining ' + fmtNum(v.futureMax) + ' marks would not be enough.';
      }
      return '';
    }

    function noteText(d) {
      var v = d.v;
      if (d.status === 'impossible') {
        var maxPossible = ((v.currentObtained + v.futureMax) / (v.currentMax + v.futureMax)) * 100;
        return 'The highest final percentage possible from here is ' + fmtPct(maxPossible) + '. Consider setting a more realistic goal.';
      }
      return 'This plan is based on the marks you have earned so far plus everything still to come — revisit it after every new result.';
    }

    function renderInsights(d) {
      var items = [];
      var v = d.v;

      if (d.status === 'secured') {
        items.push({ icon: ICON_CHECK, text: 'Your current position of ' + fmtPct(d.currentPct) + ' already guarantees your goal, regardless of future results.' });
      } else if (d.status === 'impossible') {
        items.push({ icon: ICON_WARN, text: 'Try lowering your desired percentage, or check whether more future assessments should be included.' });
      } else {
        var gap = d.requiredFuturePct - d.currentPct;
        if (gap > 0) {
          items.push({ icon: ICON_WARN, text: 'You will need to perform ' + gap.toFixed(1) + ' points above your current average in the assessments ahead.' });
        } else {
          items.push({ icon: ICON_CHECK, text: 'Simply maintaining your current average in future assessments is enough to reach your goal.' });
        }
      }

      var weight = (v.futureMax / (v.currentMax + v.futureMax)) * 100;
      items.push({ icon: ICON_INFO, text: 'Future assessments make up ' + weight.toFixed(1) + '% of your total marks toward this goal.' });

      if (d.status === 'perfect') {
        items.push({ icon: ICON_WARN, text: 'There is no room for a single dropped mark — plan your remaining preparation accordingly.' });
      }

      return items.slice(0, 3);
    }

    function calculate() {
      var v = validate();
      if (!v) return;

      var d = compute(v);
      var meta = STATUS_META[d.status];

      badgeEl.textContent = meta.badge;
      badgeEl.className = 'mpc-status-badge ' + meta.cls;
      statusTextEl.textContent = statusText(d);

      currentPctEl.textContent = fmtPct(d.currentPct);
      requiredMarksEl.textContent = d.status === 'impossible' ? 'Not possible' : fmtNum(d.requiredFutureMarks);
      requiredPctEl.textContent = d.status === 'impossible' ? 'Not possible' : fmtPct(d.requiredFuturePct);
      noteEl.textContent = noteText(d);

      var insights = renderInsights(d);
      if (!insights.length) {
        insightsCardEl.hidden = true;
      } else {
        insightsCardEl.hidden = false;
        insightsListEl.innerHTML = insights.map(function (item) {
          return '<li>' + item.icon + '<span>' + item.text + '</span></li>';
        }).join('');
      }

      resultsEl.hidden = false;
      if (window.P50ToolBase) P50ToolBase.triggerAnimations();

      var relatedWrap = document.getElementById('mpc-related-wrap');
      if (relatedWrap && resultsEl.nextElementSibling !== relatedWrap) {
        resultsEl.after(relatedWrap);
      }
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetMode() {
      inputs.forEach(function (i) { i.value = ''; });
      clearErrors();
      resultsEl.hidden = true;
      state.goal = { currentObtained: '', currentMax: '', futureMax: '', desiredPct: '' };
      saveState();
      curObtainedInput.focus();
    }

    inputs.forEach(function (input) {
      input.addEventListener('input', function () {
        input.classList.remove('mpc-input--error');
        state.goal.currentObtained = curObtainedInput.value;
        state.goal.currentMax      = curMaxInput.value;
        state.goal.futureMax       = futureMaxInput.value;
        state.goal.desiredPct      = desiredPctInput.value;
        saveState();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); calculate(); }
      });
      input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    });

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__mpcGoal = { restore: function (saved) {
      if (!saved) return;
      state.goal = saved;
      if (saved.currentObtained !== '' && saved.currentObtained != null) curObtainedInput.value = saved.currentObtained;
      if (saved.currentMax      !== '' && saved.currentMax      != null) curMaxInput.value = saved.currentMax;
      if (saved.futureMax       !== '' && saved.futureMax       != null) futureMaxInput.value = saved.futureMax;
      if (saved.desiredPct      !== '' && saved.desiredPct      != null) desiredPctInput.value = saved.desiredPct;
    } };
  })();

  /* ============================================
     INITIALISATION
  ============================================ */

  (function init() {
    var saved = loadState();

    if (saved) {
      window.__mpcQuick.restore(saved.quick);
      window.__mpcSubjects.restore(saved.subjects);
      window.__mpcTarget.restore(saved.target);
      window.__mpcBest.restore(saved.best);
      window.__mpcGoal.restore(saved.goal);

      var mode = (saved.activeMode && MODES.indexOf(saved.activeMode) !== -1) ? saved.activeMode : 'quick';
      switchMode(mode, false);
    } else {
      window.__mpcSubjects.restore(null);
      window.__mpcBest.restore(null);
      switchMode('quick', false);
    }

    if (window.P50ToolBase) {
      P50ToolBase.renderRelatedTools(
        'mpc-related-grid',
        'marks-percentage-calculator',
        'student-tools'
      );
    }
  })();

})();
