/* ============================================
   SGPA.JS — Project 50
   SGPA Calculator — Subject-based, dual grade scale

   FORMULA
   ───────
   SGPA = Σ(Credits × Grade Point) ÷ Σ(Credits)

   Full floating-point precision internally.
   Round to 2 decimal places for display only.

   GRADE SCALES
   ────────────
   10-Point: O=10 A+=9 A=8 B+=7 B=6 C=5 P=4 F=0
   4-Point:  A+=4.0 A=3.7 B+=3.3 B=3.0 B-=2.7 C+=2.3 C=2.0 D=1.0 F=0

   STORAGE KEY: p50_sgpa_calculator
   Saves grade scale + subject inputs only (never results).
   300ms debounce. Reset clears storage.

   RESULT HIERARCHY
   ────────────────
   1. Hero Result        — SGPA
   2. Academic Summary    — subjects / credits / weighted pts
   3. Performance Analysis — avg / highest / lowest grade point
   4. Subject Breakdown    — per-subject calculation table
   5. Insights              — contextual academic observations
============================================ */

(function () {
  'use strict';

  /* ============================================
     CONSTANTS
  ============================================ */

  var STORAGE_KEY = 'p50_sgpa_calculator';
  var SAVE_DEBOUNCE_MS = 300;

  var GRADE_SCALES = {
    '10': {
      max: 10,
      grades: [
        { grade: 'O',  point: 10 },
        { grade: 'A+', point: 9 },
        { grade: 'A',  point: 8 },
        { grade: 'B+', point: 7 },
        { grade: 'B',  point: 6 },
        { grade: 'C',  point: 5 },
        { grade: 'P',  point: 4 },
        { grade: 'F',  point: 0 }
      ]
    },
    '4': {
      max: 4,
      grades: [
        { grade: 'A+', point: 4.0 },
        { grade: 'A',  point: 3.7 },
        { grade: 'B+', point: 3.3 },
        { grade: 'B',  point: 3.0 },
        { grade: 'B-', point: 2.7 },
        { grade: 'C+', point: 2.3 },
        { grade: 'C',  point: 2.0 },
        { grade: 'D',  point: 1.0 },
        { grade: 'F',  point: 0 }
      ]
    }
  };

  /* Insight SVG icons — mirrors cgpa.js / attendance.js pattern */
  var ICON_CHECK =
    '<svg class="sgpa-insight-icon sgpa-insight-icon--positive" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>';

  var ICON_INFO =
    '<svg class="sgpa-insight-icon sgpa-insight-icon--neutral" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

  var ICON_WARN =
    '<svg class="sgpa-insight-icon sgpa-insight-icon--warning" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>' +
    '<path d="M12 9v4"/><path d="M12 17h.01"/></svg>';

  /* ============================================
     DOM REFERENCES
  ============================================ */

  var scaleSelectorEl  = document.getElementById('sgpa-scale-selector');
  var subjectsListEl   = document.getElementById('sgpa-subjects-list');
  var validationEl     = document.getElementById('sgpa-validation');
  var resultsEl        = document.getElementById('sgpa-results');
  var addBtn           = document.getElementById('sgpa-add-btn');
  var calcBtn          = document.getElementById('sgpa-calc-btn');
  var resetBtn         = document.getElementById('sgpa-reset-btn');

  /* Result display elements */
  var sgpaDisplayEl     = document.getElementById('sgpa-display');
  var scaleNoteEl       = document.getElementById('sgpa-scale-note');
  var totalSubjectsEl   = document.getElementById('sgpa-total-subjects');
  var totalCreditsEl    = document.getElementById('sgpa-total-credits');
  var weightedPointsEl  = document.getElementById('sgpa-weighted-points');
  var avgGpEl           = document.getElementById('sgpa-avg-gp');
  var highestGpEl       = document.getElementById('sgpa-highest-gp');
  var highestLabelEl    = document.getElementById('sgpa-highest-label');
  var lowestGpEl        = document.getElementById('sgpa-lowest-gp');
  var lowestLabelEl     = document.getElementById('sgpa-lowest-label');
  var breakdownBodyEl   = document.getElementById('sgpa-breakdown-body');
  var insightsListEl    = document.getElementById('sgpa-insights-list');
  var insightsCardEl    = document.getElementById('sgpa-insights-card');

  /* ============================================
     STATE
     scale: '10' | '4'
     subjects: Array<{ id, name, credits, grade }>
  ============================================ */

  var state = {
    scale: '10',
    subjects: []
  };

  /* ============================================
     ID GENERATOR
  ============================================ */

  function genId() {
    return 'subj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  /* ============================================
     GRADE SCALE HELPERS
  ============================================ */

  function currentGrades() {
    return GRADE_SCALES[state.scale].grades;
  }

  function pointForGrade(grade) {
    var list = currentGrades();
    for (var i = 0; i < list.length; i++) {
      if (list[i].grade === grade) return list[i].point;
    }
    return null;
  }

  function isValidGrade(grade) {
    return pointForGrade(grade) !== null;
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
          scale: state.scale,
          subjects: state.subjects.map(function (s) {
            return { id: s.id, name: s.name, credits: s.credits, grade: s.grade };
          })
        };
        P50Storage.set(STORAGE_KEY, data);
      } catch (e) {}
    }, SAVE_DEBOUNCE_MS);
  }

  function loadState() {
    try {
      var saved = P50Storage.get(STORAGE_KEY, null);
      if (!saved || typeof saved !== 'object') return null;

      var scale = (saved.scale === '4') ? '4' : '10';

      if (!Array.isArray(saved.subjects) || saved.subjects.length === 0) return null;

      var subjects = saved.subjects.filter(function (s) {
        return s && typeof s.id === 'string';
      }).map(function (s) {
        return {
          id:      s.id,
          name:    typeof s.name === 'string' ? s.name : '',
          credits: (typeof s.credits === 'number' && isFinite(s.credits)) ? s.credits : '',
          grade:   typeof s.grade === 'string' ? s.grade : ''
        };
      });

      return subjects.length ? { scale: scale, subjects: subjects } : null;
    } catch (e) {
      return null;
    }
  }

  /* ============================================
     GRADE OPTIONS MARKUP
  ============================================ */

  function gradeOptionsHtml(selectedGrade) {
    var list = currentGrades();
    var html = '<option value="" ' + (selectedGrade ? '' : 'selected') + ' disabled>Select</option>';
    for (var i = 0; i < list.length; i++) {
      var g = list[i];
      var sel = (g.grade === selectedGrade) ? ' selected' : '';
      html += '<option value="' + escAttr(g.grade) + '"' + sel + '>' + escAttr(g.grade) + '</option>';
    }
    return html;
  }

  /* ============================================
     BUILD ROW
  ============================================ */

  function buildRow(subj) {
    var row = document.createElement('div');
    row.className = 'sgpa-row';
    row.setAttribute('role', 'listitem');
    row.dataset.subjId = subj.id;

    var nameVal    = escAttr(subj.name || '');
    var creditsVal = (subj.credits !== '' && subj.credits != null) ? escAttr(String(subj.credits)) : '';
    var gp         = isValidGrade(subj.grade) ? pointForGrade(subj.grade) : null;
    var gpDisplay  = gp !== null ? formatPoint(gp) : '—';

    row.innerHTML =
      '<div class="sgpa-name-field">' +
        '<span class="sgpa-field-label" aria-hidden="true">Subject Name</span>' +
        '<input type="text" class="sgpa-name-input tool-input" placeholder="e.g. Mathematics"' +
          ' value="' + nameVal + '" aria-label="Subject name" autocomplete="off">' +
      '</div>' +
      '<div class="sgpa-credits-field">' +
        '<span class="sgpa-field-label" aria-hidden="true">Credits</span>' +
        '<input type="number" class="sgpa-credits-input tool-input" placeholder="e.g. 4"' +
          ' value="' + creditsVal + '" min="1" step="1" aria-label="Credits for this subject">' +
      '</div>' +
      '<div class="sgpa-grade-field">' +
        '<span class="sgpa-field-label" aria-hidden="true">Grade</span>' +
        '<div class="sgpa-select-wrap">' +
          '<select class="sgpa-grade-input tool-select" aria-label="Grade for this subject">' +
            gradeOptionsHtml(subj.grade) +
          '</select>' +
          '<span class="sgpa-select-arrow" aria-hidden="true">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' +
          '</span>' +
        '</div>' +
      '</div>' +
      '<div class="sgpa-gp-field">' +
        '<span class="sgpa-field-label" aria-hidden="true">Grade Point</span>' +
        '<div class="sgpa-gp-display" aria-label="Grade point (calculated automatically)">' + gpDisplay + '</div>' +
      '</div>' +
      '<button class="sgpa-remove-btn" data-subj-id="' + escAttr(subj.id) + '"' +
        ' type="button" aria-label="Remove this subject">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
      '</button>';

    /* Prevent scroll on number inputs */
    var nums = row.querySelectorAll('input[type="number"]');
    for (var i = 0; i < nums.length; i++) {
      nums[i].addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    }

    return row;
  }

  function formatPoint(n) {
    /* 10-point scale grade points are always whole numbers.
       4-point scale values always carry one decimal for clarity. */
    return (state.scale === '4') ? n.toFixed(1) : String(n);
  }

  /* ============================================
     RENDER ROWS FROM STATE
  ============================================ */

  function renderFromState() {
    subjectsListEl.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < state.subjects.length; i++) {
      frag.appendChild(buildRow(state.subjects[i]));
    }
    subjectsListEl.appendChild(frag);
  }

  /* ============================================
     READ DOM INTO STATE
  ============================================ */

  function readRowsIntoState() {
    var rows = subjectsListEl.querySelectorAll('.sgpa-row');
    for (var i = 0; i < rows.length; i++) {
      var row  = rows[i];
      var id   = row.dataset.subjId;
      var subj = findSubj(id);
      if (!subj) continue;
      subj.name    = row.querySelector('.sgpa-name-input').value;
      subj.credits = parseFloat(row.querySelector('.sgpa-credits-input').value);
      subj.grade   = row.querySelector('.sgpa-grade-input').value;
    }
    saveState();
  }

  function findSubj(id) {
    for (var i = 0; i < state.subjects.length; i++) {
      if (state.subjects[i].id === id) return state.subjects[i];
    }
    return null;
  }

  /* ============================================
     UPDATE SINGLE ROW'S GRADE POINT DISPLAY
  ============================================ */

  function updateRowGradePoint(row) {
    var select = row.querySelector('.sgpa-grade-input');
    var gpEl   = row.querySelector('.sgpa-gp-display');
    var gp     = isValidGrade(select.value) ? pointForGrade(select.value) : null;
    gpEl.textContent = gp !== null ? formatPoint(gp) : '—';
  }

  /* ============================================
     ADD / REMOVE SUBJECT
  ============================================ */

  var MAX_SUBJECTS = 20;

  function addSubject(data, focusAfter) {
    if (state.subjects.length >= MAX_SUBJECTS) return;

    var subj = {
      id:      (data && data.id)      ? data.id      : genId(),
      name:    (data && data.name)    ? data.name     : '',
      credits: (data && data.credits) ? data.credits  : '',
      grade:   (data && data.grade)   ? data.grade     : ''
    };
    state.subjects.push(subj);

    /* If restoring from storage, DOM is rebuilt in bulk via renderFromState */
    if (!data) {
      var row = buildRow(subj);
      subjectsListEl.appendChild(row);
      updateAddBtnState();
      if (focusAfter) {
        var input = row.querySelector('.sgpa-name-input');
        if (input) setTimeout(function () { input.focus(); }, 50);
      }
      saveState();
    }
  }

  function removeSubject(id) {
    state.subjects = state.subjects.filter(function (s) { return s.id !== id; });
    if (state.subjects.length === 0) {
      hideResults();
    }
    updateAddBtnState();
    saveState();
  }

  function updateAddBtnState() {
    var atMax = state.subjects.length >= MAX_SUBJECTS;
    addBtn.disabled = atMax;
    addBtn.setAttribute('aria-disabled', atMax ? 'true' : 'false');
  }

  /* ============================================
     GRADE SCALE SWITCHING
  ============================================ */

  function switchScale(newScale) {
    if (newScale === state.scale) return;

    readRowsIntoState();

    state.scale = newScale;

    /* Grade meaning changes between scales — never silently keep a
       potentially mismatched grade value. Clear all selections. */
    for (var i = 0; i < state.subjects.length; i++) {
      state.subjects[i].grade = '';
    }

    renderFromState();
    hideResults();
    hideValidation();
    updateScaleButtons();
    saveState();
  }

  function updateScaleButtons() {
    var btns = scaleSelectorEl.querySelectorAll('.sgpa-scale-btn');
    for (var i = 0; i < btns.length; i++) {
      var isActive = btns[i].dataset.scale === state.scale;
      btns[i].setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
  }

  /* ============================================
     VALIDATION
  ============================================ */

  function validate() {
    readRowsIntoState();
    var rows = subjectsListEl.querySelectorAll('.sgpa-row');

    /* Clear previous error states */
    var inputs = subjectsListEl.querySelectorAll('.tool-input, .tool-select');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].classList.remove('sgpa-input--error');
    }
    hideValidation();

    if (rows.length === 0) {
      showValidation('Add at least one subject before calculating.');
      return false;
    }

    for (var j = 0; j < state.subjects.length; j++) {
      var subj    = state.subjects[j];
      var name    = subj.name;
      var credits = subj.credits;
      var grade   = subj.grade;
      var label   = (name && name.trim()) ? name.trim() : ('Subject ' + (j + 1));

      if (!name || !name.trim()) {
        showValidation('Enter a subject name for Subject ' + (j + 1) + '.');
        markError(rows[j], '.sgpa-name-input');
        return false;
      }
      if (credits === '' || credits == null || isNaN(credits) || !isFinite(credits)) {
        showValidation('Enter valid credits for ' + label + '. Credits must be a number.');
        markError(rows[j], '.sgpa-credits-input');
        return false;
      }
      if (credits <= 0) {
        showValidation('Credits must be greater than zero. Check ' + label + '.');
        markError(rows[j], '.sgpa-credits-input');
        return false;
      }
      if (!grade || !isValidGrade(grade)) {
        showValidation('Select a valid grade for ' + label + '.');
        markError(rows[j], '.sgpa-grade-input');
        return false;
      }
    }

    return true;
  }

  function markError(row, selector) {
    var input = row.querySelector(selector);
    if (input) {
      input.classList.add('sgpa-input--error');
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

    var subs = state.subjects;
    var totalWeighted = 0;
    var totalCredits  = 0;
    var sumGp         = 0;
    var highGp        = -Infinity;
    var lowGp         = Infinity;
    var highLabel     = '';
    var lowLabel      = '';
    var highIdx       = -1;
    var lowIdx        = -1;
    var maxCredits    = -Infinity;
    var maxCreditIdx  = -1;
    var hasFail       = false;

    var breakdown = [];

    for (var i = 0; i < subs.length; i++) {
      var s     = subs[i];
      var gp    = pointForGrade(s.grade);
      var label = s.name.trim() || ('Subject ' + (i + 1));
      var weighted = s.credits * gp;

      totalWeighted += weighted;
      totalCredits  += s.credits;
      sumGp         += gp;

      /* Highest grade point — ties broken by higher credit, then order */
      if (highIdx === -1 || gp > highGp || (gp === highGp && s.credits > subs[highIdx].credits)) {
        highGp    = gp;
        highLabel = label;
        highIdx   = i;
      }
      /* Lowest grade point — ties broken by higher credit, then order */
      if (lowIdx === -1 || gp < lowGp || (gp === lowGp && s.credits > subs[lowIdx].credits)) {
        lowGp    = gp;
        lowLabel = label;
        lowIdx   = i;
      }
      if (s.credits > maxCredits) {
        maxCredits   = s.credits;
        maxCreditIdx = i;
      }
      if (s.grade === 'F') hasFail = true;

      breakdown.push({
        name:     label,
        credits:  s.credits,
        grade:    s.grade,
        gp:       gp,
        weighted: weighted
      });
    }

    var sgpa  = totalWeighted / totalCredits;
    var avgGp = sumGp / subs.length;

    renderResults({
      sgpa:          sgpa,
      scale:         state.scale,
      scaleMax:      GRADE_SCALES[state.scale].max,
      totalSubjects: subs.length,
      totalCredits:  totalCredits,
      totalWeighted: totalWeighted,
      avgGp:         avgGp,
      highGp:        highGp,
      highLabel:     highLabel,
      lowGp:         lowGp,
      lowLabel:      lowLabel,
      maxCreditIdx:  maxCreditIdx,
      hasFail:       hasFail,
      breakdown:     breakdown
    });
  }

  /* ============================================
     RENDER RESULTS
  ============================================ */

  function renderResults(data) {
    /* 1. Hero */
    sgpaDisplayEl.textContent = data.sgpa.toFixed(2);
    scaleNoteEl.textContent = 'Semester Grade Point Average on the ' + data.scale + '-point scale, weighted by subject credits.';

    /* 2. Academic Summary */
    totalSubjectsEl.textContent  = data.totalSubjects;
    totalCreditsEl.textContent   = data.totalCredits;
    weightedPointsEl.textContent = data.totalWeighted.toFixed(2);

    /* 3. Performance Analysis */
    avgGpEl.textContent = data.avgGp.toFixed(2);
    highestGpEl.textContent   = data.highGp.toFixed(2);
    highestLabelEl.textContent = 'Highest' + (data.highLabel ? ' (' + data.highLabel + ')' : '');
    lowestGpEl.textContent    = data.lowGp.toFixed(2);
    lowestLabelEl.textContent  = 'Lowest'  + (data.lowLabel  ? ' (' + data.lowLabel  + ')' : '');

    /* 4. Subject Breakdown */
    renderBreakdown(data.breakdown);

    /* 5. Insights */
    renderInsights(data);

    /* Show results */
    resultsEl.hidden = false;

    if (window.P50ToolBase) P50ToolBase.triggerAnimations();

    /* Move related tools below results */
    var relatedWrap = document.getElementById('sgpa-related-wrap');
    if (relatedWrap && resultsEl.nextElementSibling !== relatedWrap) {
      resultsEl.after(relatedWrap);
    }

    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ============================================
     SUBJECT BREAKDOWN
  ============================================ */

  function renderBreakdown(breakdown) {
    breakdownBodyEl.innerHTML = breakdown.map(function (b) {
      return (
        '<div class="sgpa-breakdown-row">' +
          '<div class="sgpa-bd-name" data-label="Subject">' + escHtml(b.name) + '</div>' +
          '<div class="sgpa-bd-credits" data-label="Credits">' + b.credits + '</div>' +
          '<div class="sgpa-bd-grade" data-label="Grade">' + escHtml(b.grade) + '</div>' +
          '<div class="sgpa-bd-gp" data-label="Grade Point">' + formatPoint(b.gp) + '</div>' +
          '<div class="sgpa-bd-weighted" data-label="Weighted Points">' + b.weighted.toFixed(2) + '</div>' +
        '</div>'
      );
    }).join('');
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
    var bd    = data.breakdown;

    if (bd.length < 2) return items;

    var maxCreditSubj = bd[data.maxCreditIdx];
    var scaleMax = data.scaleMax;

    /* Strong high-credit performance vs. high-credit weakness (mutually exclusive) */
    if (maxCreditSubj) {
      if (maxCreditSubj.gp >= data.avgGp) {
        items.push({
          icon: ICON_CHECK,
          text: 'Strong performance in ' + maxCreditSubj.name + ', your highest-credit subject, is contributing significantly to your SGPA.'
        });
      } else if (maxCreditSubj.gp < data.avgGp - (scaleMax * 0.1)) {
        items.push({
          icon: ICON_WARN,
          text: 'Your lower grade in ' + maxCreditSubj.name + ', a high-credit subject, has a larger impact on your SGPA than a lighter subject would.'
        });
      }
    }

    /* Consistency vs. large variation (mutually exclusive) */
    var range = data.highGp - data.lowGp;
    if (range <= scaleMax * 0.2) {
      items.push({
        icon: ICON_CHECK,
        text: 'Your grades are relatively consistent across subjects — a range of only ' + formatPoint(range) + ' grade points.'
      });
    } else if (range >= scaleMax * 0.6) {
      items.push({
        icon: ICON_WARN,
        text: 'Your grades vary considerably between subjects (a range of ' + formatPoint(range) + ' grade points), which may indicate uneven performance.'
      });
    }

    /* Failed subject */
    if (data.hasFail && items.length < 3) {
      items.push({
        icon: ICON_WARN,
        text: 'At least one subject scored an F (0 grade points), which is significantly lowering your SGPA.'
      });
    }

    return items.slice(0, 3);
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

    state.scale = '10';
    state.subjects = [];
    updateScaleButtons();
    renderFromState();
    hideResults();
    hideValidation();

    /* Move related tools back inside tool-wrap */
    var toolWrap    = document.querySelector('.tool-wrap');
    var relatedWrap = document.getElementById('sgpa-related-wrap');
    if (toolWrap && relatedWrap && !toolWrap.contains(relatedWrap)) {
      toolWrap.appendChild(relatedWrap);
    }

    /* Default: 4 empty rows */
    addSubject(null, false);
    addSubject(null, false);
    addSubject(null, false);
    addSubject(null, false);
  }

  /* ============================================
     ESCAPE HELPERS
  ============================================ */

  function escAttr(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escHtml(str) {
    return (window.P50Utils && P50Utils.escHtml) ? P50Utils.escHtml(str) : escAttr(str);
  }

  /* ============================================
     EVENT WIRING
  ============================================ */

  /* Remove button + live grade-point display — event delegation */
  subjectsListEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.sgpa-remove-btn');
    if (!btn) return;
    var id  = btn.dataset.subjId;
    var row = btn.closest('.sgpa-row');
    if (!row) return;

    row.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    row.style.opacity    = '0';
    row.style.transform  = 'translateX(8px)';
    setTimeout(function () {
      row.remove();
      removeSubject(id);
    }, 180);
  });

  /* Live input sync — event delegation */
  subjectsListEl.addEventListener('input', function (e) {
    if (
      e.target.matches('.sgpa-name-input') ||
      e.target.matches('.sgpa-credits-input')
    ) {
      readRowsIntoState();
      e.target.classList.remove('sgpa-input--error');
    }
  });

  subjectsListEl.addEventListener('change', function (e) {
    if (e.target.matches('.sgpa-grade-input')) {
      var row = e.target.closest('.sgpa-row');
      if (row) updateRowGradePoint(row);
      readRowsIntoState();
      e.target.classList.remove('sgpa-input--error');
    }
  });

  /* Enter key triggers calculate */
  subjectsListEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches('input')) {
      e.preventDefault();
      calculate();
    }
  });

  /* Scale selector */
  scaleSelectorEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.sgpa-scale-btn');
    if (!btn) return;
    switchScale(btn.dataset.scale);
  });

  addBtn.addEventListener('click', function () {
    addSubject(null, true);
  });

  calcBtn.addEventListener('click', calculate);
  resetBtn.addEventListener('click', resetAll);

  /* ============================================
     INITIALISATION
  ============================================ */

  (function init() {
    var saved = loadState();

    if (saved && saved.subjects.length > 0) {
      state.scale = saved.scale;
      for (var i = 0; i < saved.subjects.length; i++) {
        addSubject(saved.subjects[i], false);
      }
      updateScaleButtons();
      renderFromState();
      updateAddBtnState();
    } else {
      addSubject(null, false);
      addSubject(null, false);
      addSubject(null, false);
      addSubject(null, false);
    }

    /* Render Related Tools */
    if (window.P50ToolBase) {
      P50ToolBase.renderRelatedTools(
        'sgpa-related-grid',
        'sgpa-calculator',
        'student-tools'
      );
    }

  })();
})();
