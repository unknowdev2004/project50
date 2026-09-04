/* ============================================
   CGPA.JS — Project 50
   CGPA Calculator — Semester-based

   FORMULA
   ───────
   CGPA = Σ(GPA × Credits) ÷ Σ(Credits)

   Full floating-point precision internally.
   Round to 2 decimal places for display only.

   STORAGE KEY: p50_cgpa_calculator
   Saves semester inputs only (never results).
   300ms debounce. Reset clears storage.

   RESULT HIERARCHY
   ────────────────
   1. Hero Result  — CGPA + classification
   2. Academic Summary  — semesters / credits / weighted pts
   3. Performance Analysis  — avg / highest / lowest GPA
   4. Insights  — contextual academic observations
============================================ */

(function () {
  'use strict';

  /* ============================================
     CONSTANTS
  ============================================ */

  var STORAGE_KEY = 'p50_cgpa_calculator';
  var SAVE_DEBOUNCE_MS = 300;

  /* Insight SVG icons */
  var ICON_CHECK =
    '<svg class="cgpa-insight-icon cgpa-insight-icon--positive" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>';

  var ICON_INFO =
    '<svg class="cgpa-insight-icon cgpa-insight-icon--neutral" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

  var ICON_WARN =
    '<svg class="cgpa-insight-icon cgpa-insight-icon--warning" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>' +
    '<path d="M12 9v4"/><path d="M12 17h.01"/></svg>';

  /* ============================================
     DOM REFERENCES
  ============================================ */

  var semestersList    = document.getElementById('cgpa-semesters-list');
  var validationEl     = document.getElementById('cgpa-validation');
  var resultsEl        = document.getElementById('cgpa-results');
  var addBtn           = document.getElementById('cgpa-add-btn');
  var calcBtn          = document.getElementById('cgpa-calc-btn');
  var resetBtn         = document.getElementById('cgpa-reset-btn');

  /* Result display elements */
  var cgpaDisplayEl      = document.getElementById('cgpa-display');
  var totalSemestersEl   = document.getElementById('cgpa-total-semesters');
  var totalCreditsEl     = document.getElementById('cgpa-total-credits');
  var weightedPointsEl   = document.getElementById('cgpa-weighted-points');
  var avgGpaEl           = document.getElementById('cgpa-avg-gpa');
  var highestGpaEl       = document.getElementById('cgpa-highest-gpa');
  var highestLabelEl     = document.getElementById('cgpa-highest-label');
  var lowestGpaEl        = document.getElementById('cgpa-lowest-gpa');
  var lowestLabelEl      = document.getElementById('cgpa-lowest-label');
  var insightsListEl     = document.getElementById('cgpa-insights-list');
  var insightsCardEl     = document.getElementById('cgpa-insights-card');

  /* ============================================
     STATE
     semesters: Array<{ id, label, gpa, credits }>
  ============================================ */

  var state = {
    semesters: []
  };

  /* ============================================
     ID GENERATOR
  ============================================ */

  function genId() {
    return 'sem_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  /* ============================================
     PERSISTENCE
  ============================================ */

  var _saveTimer = null;

  function saveState() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function () {
      try {
        var data = state.semesters.map(function (s) {
          return { id: s.id, label: s.label, gpa: s.gpa, credits: s.credits };
        });
        P50Storage.set(STORAGE_KEY, data);
      } catch (e) {}
    }, SAVE_DEBOUNCE_MS);
  }

  function loadState() {
    try {
      var saved = P50Storage.get(STORAGE_KEY, null);
      if (!Array.isArray(saved) || saved.length === 0) return null;
      var semesters = saved.filter(function (s) {
        return s &&
          typeof s.id === 'string' &&
          typeof s.gpa === 'number' && isFinite(s.gpa) && s.gpa >= 0 &&
          typeof s.credits === 'number' && isFinite(s.credits) && s.credits > 0;
      }).map(function (s) {
        return {
          id:      s.id,
          label:   typeof s.label === 'string' ? s.label : '',
          gpa:     s.gpa,
          credits: s.credits
        };
      });
      return semesters.length ? semesters : null;
    } catch (e) {
      return null;
    }
  }

  /* ============================================
     BUILD ROW
  ============================================ */

  function buildRow(sem) {
    var row = document.createElement('div');
    row.className = 'cgpa-row';
    row.setAttribute('role', 'listitem');
    row.dataset.semId = sem.id;

    var labelVal   = escAttr(sem.label || '');
    var gpaVal     = (sem.gpa !== '' && sem.gpa != null) ? escAttr(String(sem.gpa)) : '';
    var creditsVal = (sem.credits !== '' && sem.credits != null) ? escAttr(String(sem.credits)) : '';

    row.innerHTML =
      '<div class="cgpa-name-field">' +
        '<span class="cgpa-field-label" aria-hidden="true">Semester</span>' +
        '<input type="text" class="cgpa-label-input tool-input" placeholder="e.g. Semester 1"' +
          ' value="' + labelVal + '" aria-label="Semester name (optional)" autocomplete="off">' +
      '</div>' +
      '<div class="cgpa-gpa-field">' +
        '<span class="cgpa-field-label" aria-hidden="true">GPA</span>' +
        '<input type="number" class="cgpa-gpa-input tool-input" placeholder="e.g. 3.5"' +
          ' value="' + gpaVal + '" min="0" step="0.01" aria-label="GPA for this semester">' +
      '</div>' +
      '<div class="cgpa-credits-field">' +
        '<span class="cgpa-field-label" aria-hidden="true">Credits</span>' +
        '<input type="number" class="cgpa-credits-input tool-input" placeholder="e.g. 18"' +
          ' value="' + creditsVal + '" min="1" step="1" aria-label="Credit hours for this semester">' +
      '</div>' +
      '<button class="cgpa-remove-btn" data-sem-id="' + escAttr(sem.id) + '"' +
        ' type="button" aria-label="Remove this semester">' +
        '&times;' +
      '</button>';

    /* Prevent scroll on number inputs */
    var nums = row.querySelectorAll('input[type="number"]');
    for (var i = 0; i < nums.length; i++) {
      nums[i].addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    }

    return row;
  }

  /* ============================================
     RENDER ROWS FROM STATE
  ============================================ */

  function renderFromState() {
    semestersList.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < state.semesters.length; i++) {
      frag.appendChild(buildRow(state.semesters[i]));
    }
    semestersList.appendChild(frag);
  }

  /* ============================================
     READ DOM INTO STATE
  ============================================ */

  function readRowsIntoState() {
    var rows = semestersList.querySelectorAll('.cgpa-row');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var id  = row.dataset.semId;
      var sem = findSem(id);
      if (!sem) continue;
      sem.label   = row.querySelector('.cgpa-label-input').value;
      sem.gpa     = parseFloat(row.querySelector('.cgpa-gpa-input').value);
      sem.credits = parseFloat(row.querySelector('.cgpa-credits-input').value);
    }
    saveState();
  }

  function findSem(id) {
    for (var i = 0; i < state.semesters.length; i++) {
      if (state.semesters[i].id === id) return state.semesters[i];
    }
    return null;
  }

  /* ============================================
     ADD / REMOVE SEMESTER
  ============================================ */

  function addSemester(data, focusAfter) {
    var sem = {
      id:      (data && data.id)           ? data.id      : genId(),
      label:   (data && data.label)        ? data.label   : '',
      gpa:     (data && data.gpa != null)  ? data.gpa     : '',
      credits: (data && data.credits)      ? data.credits : ''
    };
    state.semesters.push(sem);

    /* If restoring from storage, DOM is rebuilt in bulk via renderFromState */
    if (!data) {
      var row = buildRow(sem);
      semestersList.appendChild(row);
      if (focusAfter) {
        var input = row.querySelector('.cgpa-label-input');
        if (input) setTimeout(function () { input.focus(); }, 50);
      }
      saveState();
    }
  }

  function removeSemester(id) {
    state.semesters = state.semesters.filter(function (s) { return s.id !== id; });
    if (state.semesters.length === 0) {
      hideResults();
    }
    saveState();
  }

  /* ============================================
     VALIDATION
  ============================================ */

  function validate() {
    readRowsIntoState();
    var rows = semestersList.querySelectorAll('.cgpa-row');

    /* Clear previous error states */
    var inputs = semestersList.querySelectorAll('.tool-input');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].classList.remove('cgpa-input--error');
    }
    hideValidation();

    if (rows.length === 0) {
      showValidation('Add at least one semester before calculating.');
      return false;
    }

    for (var j = 0; j < state.semesters.length; j++) {
      var sem     = state.semesters[j];
      var gpa     = sem.gpa;
      var credits = sem.credits;
      var label   = sem.label || ('Semester ' + (j + 1));

      if (gpa === '' || gpa == null || isNaN(gpa) || !isFinite(gpa)) {
        showValidation('Enter a valid GPA for ' + label + '. GPA must be a number.');
        markError(rows[j], '.cgpa-gpa-input');
        return false;
      }
      if (gpa < 0) {
        showValidation('GPA cannot be negative. Check the value for ' + label + '.');
        markError(rows[j], '.cgpa-gpa-input');
        return false;
      }
      if (credits === '' || credits == null || isNaN(credits) || !isFinite(credits)) {
        showValidation('Enter valid credit hours for ' + label + '. Credits must be a number.');
        markError(rows[j], '.cgpa-credits-input');
        return false;
      }
      if (credits <= 0) {
        showValidation('Credit hours must be greater than zero. Check ' + label + '.');
        markError(rows[j], '.cgpa-credits-input');
        return false;
      }
    }

    return true;
  }

  function markError(row, selector) {
    var input = row.querySelector(selector);
    if (input) {
      input.classList.add('cgpa-input--error');
      input.focus();
    }
  }

  function showValidation(msg) {
    validationEl.textContent = msg;
    validationEl.hidden = false;
  }

  function hideValidation() {
    validationEl.hidden = true;
    validationEl.textContent = '';
  }

  /* ============================================
     CALCULATE
  ============================================ */

  function calculate() {
    if (!validate()) return;

    var sems = state.semesters;
    var totalWeighted = 0;
    var totalCredits  = 0;
    var sumGpa        = 0;
    var highGpa       = -Infinity;
    var lowGpa        = Infinity;
    var highLabel     = '';
    var lowLabel      = '';

    for (var i = 0; i < sems.length; i++) {
      var s = sems[i];
      totalWeighted += s.gpa * s.credits;
      totalCredits  += s.credits;
      sumGpa        += s.gpa;
      if (s.gpa > highGpa) {
        highGpa   = s.gpa;
        highLabel = s.label || ('Semester ' + (i + 1));
      }
      if (s.gpa < lowGpa) {
        lowGpa   = s.gpa;
        lowLabel = s.label || ('Semester ' + (i + 1));
      }
    }

    var cgpa   = totalWeighted / totalCredits;
    var avgGpa = sumGpa / sems.length;

    renderResults({
      cgpa:           cgpa,
      totalSemesters: sems.length,
      totalCredits:   totalCredits,
      totalWeighted:  totalWeighted,
      avgGpa:         avgGpa,
      highGpa:        highGpa,
      highLabel:      highLabel,
      lowGpa:         lowGpa,
      lowLabel:       lowLabel,
      semesters:      sems
    });
  }

  /* ============================================
     RENDER RESULTS
  ============================================ */

  function renderResults(data) {
    /* 1. Hero */
    cgpaDisplayEl.textContent = data.cgpa.toFixed(2);

    /* 2. Academic Summary */
    totalSemestersEl.textContent  = data.totalSemesters;
    totalCreditsEl.textContent    = data.totalCredits;
    weightedPointsEl.textContent  = data.totalWeighted.toFixed(2);

    /* 3. Performance Analysis */
    avgGpaEl.textContent      = data.avgGpa.toFixed(2);
    highestGpaEl.textContent  = data.highGpa.toFixed(2);
    highestLabelEl.textContent = 'Highest' + (data.highLabel ? ' (' + data.highLabel + ')' : '');
    lowestGpaEl.textContent   = data.lowGpa.toFixed(2);
    lowestLabelEl.textContent  = 'Lowest'  + (data.lowLabel  ? ' (' + data.lowLabel  + ')' : '');

    /* 4. Insights */
    renderInsights(data);

    /* Show results */
    resultsEl.hidden = false;

    if (window.P50ToolBase) P50ToolBase.triggerAnimations();

    /* Move related tools below results */
    var relatedWrap = document.getElementById('cgpa-related-wrap');
    if (relatedWrap && resultsEl.nextElementSibling !== relatedWrap) {
      resultsEl.after(relatedWrap);
    }

    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ============================================
     INSIGHTS
  ============================================ */

  function renderInsights(data) {
    var insights = buildInsights(data);

    if (!insights.length) {
      insightsCardEl.hidden = true;
      return;
    }

    insightsCardEl.hidden = false;
    insightsListEl.innerHTML = insights.map(function (item) {
      return '<li>' + item.icon + '<span>' + item.text + '</span></li>';
    }).join('');
  }

  function buildInsights(data) {
    var items = [];
    var cgpa  = data.cgpa;
    var sems  = data.semesters;

    /* Consistency insight */
    var gpas  = sems.map(function (s) { return s.gpa; });
    var range = data.highGpa - data.lowGpa;
    if (range <= 0.3 && sems.length >= 2) {
      items.push({
        icon: ICON_CHECK,
        text: 'Consistent performance — your GPA range is only ' + range.toFixed(2) + ' points across all semesters.'
      });
    } else if (range > 1.5 && sems.length >= 2) {
      items.push({
        icon: ICON_WARN,
        text: 'High variance — your best and worst semesters differ by ' + range.toFixed(2) + ' GPA points. Aim for more consistency.'
      });
    }

    /* Trend insight — compare last semester to CGPA */
    if (sems.length >= 2) {
      var last       = sems[sems.length - 1];
      var lastLabel  = last.label || ('Semester ' + sems.length);
      if (last.gpa > cgpa + 0.1) {
        items.push({
          icon: ICON_CHECK,
          text: 'Upward trend — your most recent semester (' + last.gpa.toFixed(2) + ') is above your current CGPA. Keep it up.'
        });
      } else if (last.gpa < cgpa - 0.1) {
        items.push({
          icon: ICON_WARN,
          text: 'Your most recent semester (' + last.gpa.toFixed(2) + ') is below your CGPA. A stronger next semester can help recover your average.'
        });
      } else {
        items.push({
          icon: ICON_INFO,
          text: 'Your most recent semester GPA (' + last.gpa.toFixed(2) + ') closely matches your cumulative CGPA — you are maintaining your level.'
        });
      }
    }

    /* Credit concentration insight */
    var maxCredits = 0;
    var heaviestLabel = '';
    for (var i = 0; i < sems.length; i++) {
      if (sems[i].credits > maxCredits) {
        maxCredits    = sems[i].credits;
        heaviestLabel = sems[i].label || ('Semester ' + (i + 1));
      }
    }
    if (sems.length >= 3) {
      items.push({
        icon: ICON_INFO,
        text: heaviestLabel + ' carries the most credits (' + maxCredits + ') and has the greatest individual impact on your CGPA.'
      });
    }

    /* CGPA-to-average gap insight */
    var gap = Math.abs(cgpa - data.avgGpa);
    if (gap >= 0.1) {
      var dir = cgpa > data.avgGpa ? 'above' : 'below';
      items.push({
        icon: ICON_INFO,
        text: 'Your CGPA (' + cgpa.toFixed(2) + ') is ' + gap.toFixed(2) + ' points ' + dir + ' the simple average (' + data.avgGpa.toFixed(2) + ') — because credit weights differ across semesters.'
      });
    }

    return items;
  }

  /* ============================================
     HIDE RESULTS
  ============================================ */

  function hideResults() {
    resultsEl.hidden = true;
  }

  /* ============================================
     RESET
  ============================================ */

  function resetAll() {
    clearTimeout(_saveTimer);
    P50Storage.remove(STORAGE_KEY);

    state.semesters = [];
    renderFromState();
    hideResults();
    hideValidation();

    /* Move related tools back inside tool-wrap */
    var toolWrap    = document.querySelector('.tool-wrap');
    var relatedWrap = document.getElementById('cgpa-related-wrap');
    if (toolWrap && relatedWrap && !toolWrap.contains(relatedWrap)) {
      toolWrap.appendChild(relatedWrap);
    }

    /* Default: 2 empty rows */
    addSemester(null, false);
    addSemester(null, false);
  }

  /* ============================================
     ESCAPE HELPER
  ============================================ */

  function escAttr(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ============================================
     EVENT WIRING
  ============================================ */

  /* Remove button — event delegation */
  semestersList.addEventListener('click', function (e) {
    var btn = e.target.closest('.cgpa-remove-btn');
    if (!btn) return;
    var id  = btn.dataset.semId;
    var row = btn.closest('.cgpa-row');
    if (!row) return;

    row.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    row.style.opacity    = '0';
    row.style.transform  = 'translateX(8px)';
    setTimeout(function () {
      row.remove();
      removeSemester(id);
    }, 180);
  });

  /* Live input sync — event delegation */
  semestersList.addEventListener('input', function (e) {
    if (
      e.target.matches('.cgpa-label-input') ||
      e.target.matches('.cgpa-gpa-input') ||
      e.target.matches('.cgpa-credits-input')
    ) {
      readRowsIntoState();
      if (e.target.matches('.cgpa-gpa-input') || e.target.matches('.cgpa-credits-input')) {
        e.target.classList.remove('cgpa-input--error');
      }
    }
  });

  /* Enter key triggers calculate */
  semestersList.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches('input')) {
      e.preventDefault();
      calculate();
    }
  });

  addBtn.addEventListener('click', function () {
    addSemester(null, true);
  });

  calcBtn.addEventListener('click', calculate);
  resetBtn.addEventListener('click', resetAll);

  /* ============================================
     INITIALISATION
  ============================================ */

  (function init() {
  var saved = loadState();

  if (saved && saved.length > 0) {
    for (var i = 0; i < saved.length; i++) {
      addSemester(saved[i], false);
    }
    renderFromState();
  } else {
    addSemester(null, false);
    addSemester(null, false);
  }

  /* Render Related Tools */
  if (window.P50ToolBase) {
    P50ToolBase.renderRelatedTools(
      'cgpa-related-grid',
      'cgpa-calculator',
      'student-tools'
    );
  }

})();
})();
