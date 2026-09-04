/* ============================================
   STUDY-HOURS-EXAM-PLANNER.JS — Project 50
   Study Hours & Exam Planner — 5 modes, 1 calculator

   FORMULAS
   ────────
   Study Hours:     Required Hours/Day = Total Hours ÷ Study Days

   Exam Planner:    Priority Score = (Subject Hours ÷ Total Workload)
                                      × Difficulty Weight × Priority Weight
                     Available Capacity = Study Days × Hours/Day
                     Usable Capacity = Available Capacity × (1 − Buffer%)
                     New Study = Usable × (1 − Revision%)
                     Revision  = Usable × Revision%
                     Revision defaults: >7 days 30%, 3–7 days 50%, 1–2 days 80%

   Syllabus:        Subject Workload = Remaining Topics × Hours/Topic
                     Required Hours/Day = Total Workload ÷ Study Days
                     Topics/Day = Total Remaining Topics ÷ Study Days

   Catch-Up:        Required Hours/Day = Remaining Workload ÷ Remaining Days
                     Shortfall = Required − Available (when positive)

   Readiness:       Incomplete Factor = 1 − Completion
                     Priority Score = Incomplete Factor × Confidence Weight
                                      × Difficulty Weight × Importance Weight

   Weight table (shared): Easy/Low/High-confidence = 1.00,
                           Medium = 1.15, Hard/High/Low-confidence = 1.30

   Full floating-point precision internally. Round only for display.
   Daily plan allocations snapped to 5-minute increments.

   STORAGE KEY: p50_study_hours_exam_planner
   Saves: activeMode + each mode's input data only (never results).
   300ms debounce. Reset clears only the active mode's stored data.

   This tool never predicts exam marks, rank, or success.
============================================ */

(function () {
  'use strict';

  /* ============================================
     CONSTANTS
  ============================================ */

  var STORAGE_KEY = 'p50_study_hours_exam_planner';
  var SAVE_DEBOUNCE_MS = 300;
  var EPSILON = 1e-6;
  var MIN_SUBJECTS = 1;
  var MAX_SUBJECTS = 20;
  var ROUND_MINUTES = 5; /* schedule rounding increment */

  var WEIGHTS = { low: 1.00, medium: 1.15, high: 1.30 };
  /* Difficulty/Priority/Importance all use the same low→high weight scale.
     Confidence is inverted: high confidence = 1.00, low confidence = 1.30,
     because lower confidence should increase study priority. */
  var CONFIDENCE_WEIGHTS = { high: 1.00, medium: 1.15, low: 1.30 };

  var ICON_CHECK =
    '<svg class="shep-insight-icon shep-insight-icon--positive" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>';

  var ICON_INFO =
    '<svg class="shep-insight-icon shep-insight-icon--neutral" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

  var ICON_WARN =
    '<svg class="shep-insight-icon shep-insight-icon--warning" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>' +
    '<path d="M12 9v4"/><path d="M12 17h.01"/></svg>';

  var esc = (window.P50Utils && window.P50Utils.escapeAttr) ? window.P50Utils.escapeAttr : function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  function genId() {
    return 'row_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  /* ============================================
     MODE TABS / PANELS
  ============================================ */

  var MODES = ['study-hours', 'exam-planner', 'syllabus', 'catchup', 'readiness'];
  var tablist  = document.querySelector('.shep-mode-selector');
  var tabEls   = {};
  var panelEls = {};
  MODES.forEach(function (m) {
    tabEls[m]   = document.getElementById('shep-tab-' + m);
    panelEls[m] = document.getElementById('shep-panel-' + m);
  });

  /* ============================================
     STATE
  ============================================ */

  var state = {
    activeMode: 'study-hours',
    studyHours: { totalHours: '', days: '', maxPerDay: '' },
    examPlanner: {
      startDate: '', examDate: '',
      weekdays: [1, 1, 1, 1, 1, 1, 1], /* index = JS Date.getDay(): 0=Sun..6=Sat */
      hoursPerDay: '',
      subjects: [],
      showDetails: false,
      revisionMode: 'auto',
      revisionCustom: '',
      bufferPct: 10,
      advancedOpen: false
    },
    syllabus: { subjects: [], days: '', hoursPerDay: '' },
    catchup: { remainingWorkload: '', remainingDays: '', hoursPerDay: '' },
    readiness: { subjects: [] }
  };

  /* ============================================
     FORMATTING HELPERS
  ============================================ */

  function fmtHM(hoursFloat) {
    if (!isFinite(hoursFloat) || hoursFloat < 0) return '—';
    var totalMinutes = Math.round(hoursFloat * 60);
    var h = Math.floor(totalMinutes / 60);
    var m = totalMinutes % 60;
    if (h === 0 && m === 0) return '0m';
    if (h === 0) return m + 'm';
    if (m === 0) return h + 'h';
    return h + 'h ' + m + 'm';
  }

  function fmtHMPerDay(hoursFloat) {
    return fmtHM(hoursFloat) + (isFinite(hoursFloat) ? '/day' : '');
  }

  function fmtNum(n, decimals) {
    if (!isFinite(n)) return '—';
    var d = decimals == null ? 1 : decimals;
    var r = Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
    return (r % 1 === 0) ? String(r) : r.toFixed(d).replace(/0+$/, '').replace(/\.$/, '');
  }

  function fmtHours(n) {
    if (!isFinite(n)) return '—';
    return fmtNum(n, 1) + 'h';
  }

  function fmtDate(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function fmtDateShort(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  /* Round a decimal-hours value to the nearest 5-minute increment. */
  function roundToIncrement(hoursFloat) {
    var minutes = hoursFloat * 60;
    var rounded = Math.round(minutes / ROUND_MINUTES) * ROUND_MINUTES;
    return rounded / 60;
  }

  /* ============================================
     DATE HELPERS
  ============================================ */

  function parseDate(str) {
    if (!str) return null;
    var parts = str.split('-');
    if (parts.length !== 3) return null;
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return isNaN(d.getTime()) ? null : d;
  }

  function todayDateInputValue() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function addDays(date, n) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + n);
    return d;
  }

  function isSameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  /**
   * Builds the list of actual study dates between start (inclusive) and
   * exam date (exclusive), filtered by selected weekdays.
   * If start === exam date, returns a single same-day study date
   * (rule: exam-today permits a same-day plan).
   */
  function buildStudyDates(startDate, examDate, weekdays) {
    if (isSameDate(startDate, examDate)) {
      return [new Date(startDate.getTime())];
    }
    var dates = [];
    var cursor = new Date(startDate.getTime());
    var last = addDays(examDate, -1);
    /* safety cap to avoid runaway loops on bad input */
    var guard = 0;
    while (cursor.getTime() <= last.getTime() && guard < 3660) {
      if (weekdays[cursor.getDay()]) {
        dates.push(new Date(cursor.getTime()));
      }
      cursor = addDays(cursor, 1);
      guard++;
    }
    return dates;
  }

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
      input.classList.add('shep-input--error');
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
    if (!items.length) { if (cardEl) cardEl.hidden = true; return; }
    if (cardEl) cardEl.hidden = false;
    listEl.innerHTML = items.map(function (item) {
      return '<li>' + item.icon + '<span>' + item.text + '</span></li>';
    }).join('');
  }

  function moveRelatedAfterResults(resultsEl) {
    var relatedWrap = document.getElementById('shep-related-wrap');
    if (relatedWrap && resultsEl.nextElementSibling !== relatedWrap) {
      resultsEl.after(relatedWrap);
    }
  }

  function moveRelatedBackToWrap() {
    var toolWrap    = document.querySelector('.tool-wrap');
    var relatedWrap = document.getElementById('shep-related-wrap');
    if (toolWrap && relatedWrap && toolWrap.lastElementChild !== relatedWrap) {
      toolWrap.appendChild(relatedWrap);
    }
  }

  /* ============================================
     PERSISTENCE
  ============================================ */

  function saveState() {
    window.P50Storage.set(STORAGE_KEY, state);
  }

  var saveStateDebounced = (window.P50Utils && window.P50Utils.debounce)
    ? window.P50Utils.debounce(saveState, SAVE_DEBOUNCE_MS)
    : saveState;

  function loadState() {
    return window.P50Storage.get(STORAGE_KEY, null);
  }

  /* ============================================
     MODE SWITCHING (tab pattern — see grade-required-marks.js
     and cgpa-percentage.js for the established convention)
  ============================================ */

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function scrollTabIntoView(mode, instant) {
    var tabEl = tabEls[mode];
    if (!tabEl || typeof tabEl.scrollIntoView !== 'function') return;
    tabEl.scrollIntoView({
      behavior: (instant || prefersReducedMotion()) ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }

  /**
   * @param {string} mode
   * @param {boolean} focusTab - move keyboard focus to the tab (arrow-key nav)
   * @param {boolean} [userInitiated=true] - false only on initial page load
   *   restore, so positioning uses instant ('auto') behavior instead of
   *   'smooth', but STILL runs (post-layout) so a restored non-first tab
   *   is guaranteed visible without the user needing to swipe manually.
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
      scrollTabIntoView(mode, false);
    } else {
      /* Reload restore: wait until layout is available (post-paint),
         then position instantly so the tab is immediately visible
         without requiring a manual swipe. */
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            scrollTabIntoView(mode, true);
          });
        });
      } else {
        scrollTabIntoView(mode, true);
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
     SHARED WEIGHT / SCORE HELPERS
  ============================================ */

  function weightOf(level) {
    return WEIGHTS[level] != null ? WEIGHTS[level] : WEIGHTS.medium;
  }

  function confidenceWeightOf(level) {
    return CONFIDENCE_WEIGHTS[level] != null ? CONFIDENCE_WEIGHTS[level] : CONFIDENCE_WEIGHTS.medium;
  }

  /* Revision % default by days-remaining band (rule 16). */
  function autoRevisionPct(days) {
    if (days > 7) return 0.30;
    if (days >= 3) return 0.50;
    return 0.80; /* 1–2 days */
  }

  /* ============================================
     STATUS CLASSIFICATION (shared across modes)
     Objective thresholds: Not Realistic when required > available;
     Tight when utilisation is close to full (>=85%); otherwise On Track.
  ============================================ */

  /* Shared capacity model (used by Exam Planner's schedule generator, and
     documented here so Study Hours / Exam Planner / Catch-Up all reason
     about "usable" time the same way). Buffer is reserved exactly once. */
  function calculateUsableCapacity(rawHours, bufferPct) {
    return rawHours * (1 - bufferPct);
  }

  /* Single shared feasibility classifier — Study Hours, Exam Planner and
     Catch-Up all call this with (required/day, usable-or-available/day)
     so the On Track / Tight / Not Realistic thresholds never diverge
     between modes. Exam Planner passes the *actual* post-buffer,
     post-revision new-study capacity produced by the schedule generator,
     not the raw hours/day figure — see generatePlan() below. */
  function classifyStatus(requiredPerDay, availablePerDay) {
    if (!isFinite(availablePerDay) || availablePerDay <= 0) {
      return isFinite(requiredPerDay) && requiredPerDay > 0 ? 'not-realistic' : 'on-track';
    }
    var ratio = requiredPerDay / availablePerDay;
    if (ratio > 1 + EPSILON) return 'not-realistic';
    if (ratio >= 0.85) return 'tight';
    return 'on-track';
  }

  function statusLabel(status) {
    if (status === 'on-track') return 'On Track';
    if (status === 'tight') return 'Tight';
    return 'Not Realistic';
  }

  function applyStatusBadge(badgeEl, status) {
    badgeEl.className = 'shep-status-badge shep-status-badge--' + status;
    badgeEl.textContent = statusLabel(status);
  }

  /* ============================================================
     MODE 2 — EXAM PLANNER (flagship mode)
  ============================================================ */

  (function examPlannerMode() {
    var startInput   = document.getElementById('shep-ep-start-date');
    var examInput    = document.getElementById('shep-ep-exam-date');
    var hoursInput   = document.getElementById('shep-ep-hours-per-day');
    var weekdayBtns  = Array.prototype.slice.call(document.querySelectorAll('.shep-weekday-selector .shep-weekday-btn'));
    var subjectListEl = document.getElementById('shep-ep-subject-list');
    var addSubjectBtn = document.getElementById('shep-ep-add-subject-btn');
    var toggleDetailsBtn = document.getElementById('shep-ep-toggle-details-btn');
    var colHeaders = document.getElementById('shep-ep-col-headers');
    var advToggle  = document.getElementById('shep-ep-advanced-toggle');
    var advBody    = document.getElementById('shep-ep-advanced-body');
    var revisionModeSel = document.getElementById('shep-ep-revision-mode');
    var revisionCustomField = document.getElementById('shep-ep-revision-custom-field');
    var revisionCustomInput = document.getElementById('shep-ep-revision-custom');
    var bufferInput = document.getElementById('shep-ep-buffer-pct');
    var validationEl = document.getElementById('shep-ep-validation');
    var generateBtn = document.getElementById('shep-ep-generate-btn');
    var resetBtn    = document.getElementById('shep-ep-reset-btn');
    var resultsEl   = document.getElementById('shep-ep-results');

    var heroEl = document.getElementById('shep-ep-hero');
    var heroSubEl = document.getElementById('shep-ep-hero-sub');
    var statusBadgeEl = document.getElementById('shep-ep-status-badge');
    var statusTextEl = document.getElementById('shep-ep-status-text');
    var notRealisticEl = document.getElementById('shep-ep-not-realistic');
    var shortfallTextEl = document.getElementById('shep-ep-shortfall-text');
    var statTotalShortfall = document.getElementById('shep-ep-stat-total-shortfall');
    var statExtraPerDay = document.getElementById('shep-ep-stat-extra-per-day');
    var summaryCard = document.getElementById('shep-ep-summary-card');
    var statRequired = document.getElementById('shep-ep-stat-required');
    var statAvailable = document.getElementById('shep-ep-stat-available');
    var statRemaining = document.getElementById('shep-ep-stat-remaining');
    var chipNew = document.getElementById('shep-ep-chip-new');
    var chipRevision = document.getElementById('shep-ep-chip-revision');
    var chipBuffer = document.getElementById('shep-ep-chip-buffer');
    var chipFreeWrap = document.getElementById('shep-ep-chip-free-wrap');
    var chipFree = document.getElementById('shep-ep-chip-free');
    var insightsCard = document.getElementById('shep-ep-insights-card');
    var insightsList = document.getElementById('shep-ep-insights-list');
    var planCard = document.getElementById('shep-ep-plan-card');
    var planCardTitle = document.getElementById('shep-ep-plan-card-title');
    var planCardNote = document.getElementById('shep-ep-plan-card-note');
    var planTbody = document.getElementById('shep-ep-plan-tbody');
    var planCards = document.getElementById('shep-ep-plan-cards');

    function makeSubject(name, hours, difficulty, priority) {
      return {
        id: genId(),
        name: name || '',
        hours: hours != null ? hours : '',
        difficulty: difficulty || 'medium',
        priority: priority || 'medium'
      };
    }

    function subjectRowHtml(subj, showDetails) {
      var extraFields = '';
      if (showDetails) {
        extraFields =
          '<div class="shep-diff-field shep-col-extra">' +
            '<span class="shep-field-mobile-label">Difficulty</span>' +
            '<div class="shep-select-wrap shep-select-wrap--sm">' +
              '<select class="tool-select shep-diff-select" data-row-id="' + subj.id + '">' +
                '<option value="easy"' + (subj.difficulty === 'easy' ? ' selected' : '') + '>Easy</option>' +
                '<option value="medium"' + (subj.difficulty === 'medium' ? ' selected' : '') + '>Medium</option>' +
                '<option value="hard"' + (subj.difficulty === 'hard' ? ' selected' : '') + '>Hard</option>' +
              '</select>' +
              '<span class="shep-select-arrow" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>' +
            '</div>' +
          '</div>' +
          '<div class="shep-priority-field shep-col-extra">' +
            '<span class="shep-field-mobile-label">Priority</span>' +
            '<div class="shep-select-wrap shep-select-wrap--sm">' +
              '<select class="tool-select shep-priority-select" data-row-id="' + subj.id + '">' +
                '<option value="low"' + (subj.priority === 'low' ? ' selected' : '') + '>Low</option>' +
                '<option value="medium"' + (subj.priority === 'medium' ? ' selected' : '') + '>Medium</option>' +
                '<option value="high"' + (subj.priority === 'high' ? ' selected' : '') + '>High</option>' +
              '</select>' +
              '<span class="shep-select-arrow" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>' +
            '</div>' +
          '</div>';
      }

      return (
        '<div class="shep-subject-row' + (showDetails ? '' : ' shep-subject-row--compact') + '" data-row-id="' + subj.id + '">' +  
        '<div class="shep-name-field">' +
            '<span class="shep-field-mobile-label">Subject</span>' +
            '<input class="tool-input shep-name-input" type="text" maxlength="60" placeholder="e.g. Physics" value="' + esc(subj.name) + '" data-row-id="' + subj.id + '" aria-label="Subject name">' +
          '</div>' +
          '<div class="shep-hours-field">' +
            '<span class="shep-field-mobile-label">Estimated Hours</span>' +
            '<input class="tool-input shep-hours-input" type="number" min="0" step="any" inputmode="decimal" placeholder="0" value="' + esc(subj.hours) + '" data-row-id="' + subj.id + '" aria-label="Estimated remaining hours">' +
          '</div>' +
          extraFields +
           '<button type="button" class="shep-remove-btn" data-row-id="' + subj.id + '" aria-label="Remove subject">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
          '</button>' +
        '</div>'
      );
    }

    function renderSubjectRows() {
      subjectListEl.innerHTML = state.examPlanner.subjects.map(function (s) {
        return subjectRowHtml(s, state.examPlanner.showDetails);
      }).join('');
      colHeaders.classList.toggle('shep-col-headers--compact', !state.examPlanner.showDetails);
      updateRemoveButtons();
    }

    function updateRemoveButtons() {
      var disable = state.examPlanner.subjects.length <= MIN_SUBJECTS;
      subjectListEl.querySelectorAll('.shep-remove-btn').forEach(function (btn) {
        btn.disabled = disable;
      });
    }

    function readRowsIntoState() {
      var rows = subjectListEl.querySelectorAll('.shep-subject-row');
      rows.forEach(function (row) {
        var id = row.getAttribute('data-row-id');
        var subj = state.examPlanner.subjects.find(function (s) { return s.id === id; });
        if (!subj) return;
        var nameInput = row.querySelector('.shep-name-input');
        var hoursInputEl = row.querySelector('.shep-hours-input');
        var diffSelect = row.querySelector('.shep-diff-select');
        var prioritySelect = row.querySelector('.shep-priority-select');
        subj.name = nameInput ? nameInput.value : subj.name;
        subj.hours = hoursInputEl ? hoursInputEl.value : subj.hours;
        if (diffSelect) subj.difficulty = diffSelect.value;
        if (prioritySelect) subj.priority = prioritySelect.value;
      });
    }

    function addSubjectRow() {
      if (state.examPlanner.subjects.length >= MAX_SUBJECTS) return;
      state.examPlanner.subjects.push(makeSubject());
      renderSubjectRows();
      saveState();
      var rows = subjectListEl.querySelectorAll('.shep-name-input');
      if (rows.length) rows[rows.length - 1].focus();
    }

    addSubjectBtn.addEventListener('click', addSubjectRow);

    toggleDetailsBtn.addEventListener('click', function () {
      state.examPlanner.showDetails = !state.examPlanner.showDetails;
      toggleDetailsBtn.setAttribute('aria-pressed', state.examPlanner.showDetails ? 'true' : 'false');
      toggleDetailsBtn.textContent = state.examPlanner.showDetails ? '− Difficulty & Priority' : '+ Difficulty & Priority';
      colHeaders.querySelectorAll('.shep-col-extra').forEach(function (h) { h.hidden = !state.examPlanner.showDetails; });
      renderSubjectRows();
      saveState();
    });

    subjectListEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.shep-remove-btn');
      if (!btn) return;
      if (state.examPlanner.subjects.length <= MIN_SUBJECTS) return;
      var id = btn.getAttribute('data-row-id');
      var idx = state.examPlanner.subjects.findIndex(function (s) { return s.id === id; });
      if (idx === -1) return;
      var row = btn.closest('.shep-subject-row');
      row.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
      row.style.opacity = '0';
      row.style.transform = 'translateX(8px)';
      setTimeout(function () {
        state.examPlanner.subjects.splice(idx, 1);
        renderSubjectRows();
        saveState();
      }, 180);
    });

    subjectListEl.addEventListener('input', function (e) {
      if (e.target.matches('.shep-name-input') || e.target.matches('.shep-hours-input')) {
        e.target.classList.remove('shep-input--error');
        readRowsIntoState();
        saveStateDebounced();
      }
    });

    subjectListEl.addEventListener('change', function (e) {
      if (e.target.matches('.shep-diff-select') || e.target.matches('.shep-priority-select')) {
        readRowsIntoState();
        saveState();
      }
    });

    /* ---- Weekday selector ---- */
    weekdayBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var day = parseInt(btn.getAttribute('data-day'), 10);
        var pressed = btn.getAttribute('aria-pressed') === 'true';
        /* Require at least one selected weekday */
        var selectedCount = state.examPlanner.weekdays.reduce(function (a, b) { return a + b; }, 0);
        if (pressed && selectedCount <= 1) return;
        state.examPlanner.weekdays[day] = pressed ? 0 : 1;
        btn.setAttribute('aria-pressed', pressed ? 'false' : 'true');
        saveState();
      });
    });

    /* ---- Advanced collapse ---- */
    advToggle.addEventListener('click', function () {
      var open = advToggle.getAttribute('aria-expanded') === 'true';
      advToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      advBody.hidden = open;
      state.examPlanner.advancedOpen = !open;
      saveState();
    });

    revisionModeSel.addEventListener('change', function () {
      state.examPlanner.revisionMode = revisionModeSel.value;
      revisionCustomField.hidden = revisionModeSel.value !== 'custom';
      saveState();
    });

    revisionCustomInput.addEventListener('input', function () {
      state.examPlanner.revisionCustom = revisionCustomInput.value;
      saveStateDebounced();
    });

    bufferInput.addEventListener('input', function () {
      state.examPlanner.bufferPct = bufferInput.value;
      saveStateDebounced();
    });

    [startInput, examInput, hoursInput, revisionCustomInput, bufferInput].forEach(function (input) {
      input.addEventListener('wheel', function (e) { if (input.type === 'number') e.preventDefault(); }, { passive: false });
    });

    startInput.addEventListener('input', function () { state.examPlanner.startDate = startInput.value; hideValidation(validationEl); saveStateDebounced(); });
    examInput.addEventListener('input', function () { state.examPlanner.examDate = examInput.value; hideValidation(validationEl); saveStateDebounced(); });
    hoursInput.addEventListener('input', function () { hoursInput.classList.remove('shep-input--error'); state.examPlanner.hoursPerDay = hoursInput.value; hideValidation(validationEl); saveStateDebounced(); });

    /* ============================================
       PRIORITY SCORE + DAILY PLAN ALGORITHM
    ============================================ */

    function computePriorityScores(subjects, totalWorkload) {
      subjects.forEach(function (s) {
        var normalized = totalWorkload > 0 ? (s._hours / totalWorkload) : 0;
        s._score = normalized * weightOf(s.difficulty) * weightOf(s.priority);
      });
    }

    /* Allocate `dayTime` hours across subjects with remaining workload,
       proportionally to priority score, redistributing any leftover
       (from workload caps) until exhausted — this both respects
       priority order and avoids one subject monopolising a day. */
    function allocateDay(subjects, dayTime) {
      var allocations = {}; /* id -> hours allocated this day */
      var remaining = dayTime;
      var guard = 0;

      while (remaining > EPSILON && guard < 50) {
        var incomplete = subjects.filter(function (s) { return s._remaining > EPSILON; });
        if (!incomplete.length) break;

        var weightSum = incomplete.reduce(function (sum, s) { return sum + s._score; }, 0);
        if (weightSum <= EPSILON) {
          /* fallback: equal split if all scores are zero */
          incomplete.forEach(function (s) { s._score = 1; });
          weightSum = incomplete.length;
        }

        var distributed = 0;
        var anyCapped = false;

        incomplete.forEach(function (s) {
          var share = remaining * (s._score / weightSum);
          var give = Math.min(share, s._remaining);
          if (give < share - EPSILON) anyCapped = true;
          s._remaining -= give;
          allocations[s.id] = (allocations[s.id] || 0) + give;
          distributed += give;
        });

        remaining -= distributed;
        guard++;
        if (!anyCapped) break; /* nothing left to redistribute */
      }

      return allocations;
    }

    /* ----------------------------------------------------------------
       REVISION MODEL — revision demand pool
       ----------------------------------------------------------------
       Revision represents deliberate review of material studied on a
       PRIOR day that has not yet been revised. This is tracked
       explicitly with `revisionPool`, rather than using cumulative
       studiedSoFar (which never decreases) as an unlimited proxy:

         - New study completed on a day is added to the pool at the
           END of that day — same-day material is never revised the
           day it was learned.
         - Each day, revision consumes from the pool: actual revision
           is capped at BOTH the configured allocation (revisionPct x
           usable capacity) AND whatever demand currently sits in the
           pool. Consuming revision removes that amount from the pool.

       This keeps revision bounded by real planning demand: once
       previously-studied material has been revised, it is removed
       from the pool and is not available again until more new study
       replenishes it. A small workload (e.g. 2h total) therefore
       produces at most a little revision before the pool runs dry —
       not an indefinite stream of it — while a plan with ongoing new
       study each day keeps replenishing the pool and can support
       revision every day, up to the configured allocation. Revisiting
       the same material more than once is possible, but only insofar
       as it hasn't already been consumed from the pool; it is never
       an unbounded supply. */
    function generatePlan(subjects, studyDates, hoursPerDay, bufferPct, revisionPctFn) {
      var days = [];
      var totalNewCapacity = 0; /* the true daily new-study capacity ceiling, unreduced by early finishing — used for feasibility */
      var totalNewActual = 0;   /* hours actually spent on new study — used for display totals */
      var totalRevision = 0, totalBuffer = 0;
      var revisionPool = 0; /* previously-studied material available for revision, not yet consumed */

      studyDates.forEach(function (date, idx) {
        var daysLeft = studyDates.length - idx;
        var isFirstDay = idx === 0;

        /* Revision needs something already studied to revise. Day 1 has
           nothing behind it yet, so it goes entirely to new study —
           revision only enters the schedule from day 2 onward, and only
           if the revision pool actually holds demand (revisionPool > 0).
           The configured revision % (auto bands or custom) still governs
           how much once it does apply, so the existing "more revision as
           the exam approaches" progression is preserved. */
        var revisionPct = (isFirstDay || revisionPool <= EPSILON) ? 0 : revisionPctFn(daysLeft);

        var dailyAvailable = hoursPerDay;
        var dailyBuffer = dailyAvailable - calculateUsableCapacity(dailyAvailable, bufferPct); /* reserved once */
        var dailyUsable = calculateUsableCapacity(dailyAvailable, bufferPct);
        var desiredRevision = dailyUsable * revisionPct;      /* configured target, before demand-capping */
        var desiredNewStudySlot = dailyUsable - desiredRevision;

        dailyBuffer = roundToIncrement(dailyBuffer);
        desiredRevision = roundToIncrement(desiredRevision);
        desiredNewStudySlot = Math.max(0, roundToIncrement(desiredNewStudySlot));
        /* Integrity: never let rounding push the day over its available time */
        var roundedTotal = dailyBuffer + desiredRevision + desiredNewStudySlot;
        if (roundedTotal > dailyAvailable + EPSILON) {
          desiredNewStudySlot = Math.max(0, desiredNewStudySlot - (roundedTotal - dailyAvailable));
        }

        /* Cap revision at BOTH the configured allocation AND the current
           revision-pool demand — never revise more than is actually owed
           a review. Day 1 has no previously studied material, so 0. */
        var actualDailyRevision = isFirstDay
          ? 0
          : Math.min(desiredRevision, Math.max(0, revisionPool));
        actualDailyRevision = roundToIncrement(actualDailyRevision);

        /* Reuse unused revision capacity: whatever revision demand could
           not be satisfied (desiredRevision − actualDailyRevision) is
           freed back into New Study rather than left idle. This is NOT
           the same as converting unused New Study into Revision — it
           only ever flows the other way, and only into New Study, which
           will itself simply go unused (and fall through to Free Time)
           if there is no remaining workload to spend it on. */
        var freedRevisionCapacity = Math.max(0, desiredRevision - actualDailyRevision);
        var dailyNewStudySlot = desiredNewStudySlot + freedRevisionCapacity;

        var allocations = allocateDay(subjects, dailyNewStudySlot);
        var usedNew = 0;
        for (var key in allocations) { if (allocations.hasOwnProperty(key)) usedNew += allocations[key]; }

        var dailyNewStudyActual = usedNew;
        var dailyRevision = actualDailyRevision;

        /* Consume the revised material from the pool, then add today's
           newly studied material for future days to revise. */
        revisionPool = Math.max(0, revisionPool - dailyRevision);

        var focusItems = [];
        subjects.forEach(function (s) {
          var t = allocations[s.id];
          if (t && t > EPSILON) {
            var rt = roundToIncrement(t);
            if (rt > EPSILON) focusItems.push({ name: s.name || 'Subject', time: rt });
          }
        });
        if (dailyRevision > EPSILON) {
          focusItems.push({ name: 'Revision', time: dailyRevision });
        }

        totalNewCapacity += dailyNewStudySlot;
        totalNewActual += dailyNewStudyActual;
        totalRevision += dailyRevision;
        totalBuffer += dailyBuffer;
        revisionPool += usedNew;

        days.push({
          date: date,
          focusItems: focusItems,
          studyTime: dailyNewStudyActual + dailyRevision
        });
      });

      var remainingWorkload = 0;
      subjects.forEach(function (s) { remainingWorkload += Math.max(0, s._remaining); });

      return {
        days: days,
        totalNew: totalNewCapacity,     /* feasibility ceiling — what "Usable for New Study" reports */
        totalNewActual: totalNewActual, /* what was actually spent on new study across the plan */
        totalRevision: totalRevision,
        totalBuffer: totalBuffer,
        remainingWorkload: remainingWorkload
      };
    }

    function renderPlan(planResult) {
      planTbody.innerHTML = planResult.days.map(function (day) {
        var lines = day.focusItems.map(function (item) {
          return '<div class="shep-plan-focus-line"><span class="shep-plan-focus-name">' + esc(item.name) + '</span><span class="shep-plan-focus-time">' + fmtHM(item.time) + '</span></div>';
        }).join('');
        if (!lines) lines = '<span class="tool-field-hint">Rest day</span>';
        return '<tr><td>' + esc(fmtDate(day.date)) + '</td><td>' + lines + '</td><td>' + fmtHM(day.studyTime) + '</td></tr>';
      }).join('');

      planCards.innerHTML = planResult.days.map(function (day) {
        var lines = day.focusItems.map(function (item) {
          return '<div class="shep-plan-card-line"><span class="shep-plan-card-subject">' + esc(item.name) + '</span><span class="shep-plan-card-time">' + fmtHM(item.time) + '</span></div>';
        }).join('');
        if (!lines) lines = '<p class="tool-field-hint">Rest day</p>';
        return '<div class="shep-plan-card"><div class="shep-plan-card-date">' + esc(fmtDate(day.date)) + '</div>' + lines + '</div>';
      }).join('');
    }

    function calculate() {
      hideValidation(validationEl);
      readRowsIntoState();

      var startDate = parseDate(startInput.value);
      var examDate = parseDate(examInput.value);
      var hoursPerDay = hoursInput.value === '' ? NaN : parseFloat(hoursInput.value);

      if (!startDate) { showValidation(validationEl, 'Enter a start date.', startInput); return; }
      if (!examDate) { showValidation(validationEl, 'Enter an exam date.', examInput); return; }
      if (examDate.getTime() < startDate.getTime()) {
        showValidation(validationEl, 'Exam date cannot be before the start date.', examInput);
        return;
      }
      if (!isValidNumber(hoursPerDay) || hoursPerDay <= 0) {
        showValidation(validationEl, 'Enter available study hours per day (greater than 0).', hoursInput);
        return;
      }

      var subjects = state.examPlanner.subjects
  .map(function (s) {
    var name = (s.name || '').trim();
    var hoursBlank = s.hours === '' || s.hours === null || s.hours === undefined;

    return {
      id: s.id,
      name: name,
      _hours: hoursBlank ? NaN : parseFloat(s.hours),
      difficulty: s.difficulty,
      priority: s.priority
    };
  })
  .filter(function (s) {
    /* Completely empty rows are optional and ignored. */
    return s.name !== '' || !isNaN(s._hours);
  });

if (!subjects.length) {
  showValidation(validationEl, 'Add at least one subject with estimated hours.');
  return;
}

for (var i = 0; i < subjects.length; i++) {
  if (subjects[i].name === '') {
    var nameInput = subjectListEl.querySelector(
      '.shep-name-input[data-row-id="' + subjects[i].id + '"]'
    );
    showValidation(validationEl, 'Enter a subject name.', nameInput);
    return;
  }

  if (!isValidNumber(subjects[i]._hours) || subjects[i]._hours < 0) {
    var rowInput = subjectListEl.querySelector(
      '.shep-hours-input[data-row-id="' + subjects[i].id + '"]'
    );
    showValidation(
      validationEl,
      'Enter estimated hours (0 or more) for every subject.',
      rowInput
    );
    return;
  }
}

      var weekdays = state.examPlanner.weekdays;
      var studyDates = buildStudyDates(startDate, examDate, weekdays);
      if (!studyDates.length) {
        showValidation(validationEl, 'No study days fall between your start date and exam date with the selected weekdays.');
        return;
      }

      var totalWorkload = subjects.reduce(function (sum, s) { return sum + s._hours; }, 0);

      var bufferPct = clampBuffer(state.examPlanner.bufferPct);
      var revisionPctFn = state.examPlanner.revisionMode === 'custom'
        ? (function () {
            var custom = parseFloat(state.examPlanner.revisionCustom);
            var pct = isValidNumber(custom) ? clampPct(custom / 100) : autoRevisionPct(studyDates.length);
            return function () { return pct; };
          })()
        : function (daysLeft) { return autoRevisionPct(daysLeft); };

      /* Zero-workload case */
      if (totalWorkload === 0) {
        resultsEl.hidden = false;
        heroEl.textContent = '0h/day';
        heroSubEl.parentElement.querySelector('.shep-status-badge').style.display = 'none';
        statusTextEl.textContent = 'No remaining study workload was entered.';
        notRealisticEl.hidden = true;
        summaryCard.hidden = true;
        planCard.hidden = true;
        renderInsightsInto([], insightsList, insightsCard);
        moveRelatedAfterResults(resultsEl);
        return;
      }
      heroEl.parentElement.querySelector('.shep-status-badge').style.display = '';

      /* ---- Generate the actual schedule FIRST. Feasibility is decided
         from what the schedule can really complete (rules 10, 11, 15, 16),
         never from a raw hours/day comparison that ignores buffer and
         revision. ---- */
      subjects.forEach(function (s) { s._remaining = s._hours; });
      computePriorityScores(subjects, totalWorkload);
      var planResult = generatePlan(subjects, studyDates, hoursPerDay, bufferPct, revisionPctFn);

      var requiredPerDay = totalWorkload / studyDates.length;
      var avgUsablePerDay = planResult.totalNew / studyDates.length; /* actual new-study capacity/day, post buffer+revision */
      var remainingWorkload = planResult.remainingWorkload;

      /* Final integrity check (rule 15/16): a plan that leaves workload
         unscheduled can never be reported as On Track, regardless of what
         the raw ratio suggested. */
      var status = (remainingWorkload > EPSILON)
        ? 'not-realistic'
        : classifyStatus(requiredPerDay, avgUsablePerDay);

      heroEl.textContent = fmtHM(requiredPerDay);
      applyStatusBadge(statusBadgeEl, status);

      statRequired.textContent = fmtHM(requiredPerDay);
      statAvailable.textContent = fmtHM(avgUsablePerDay);
      statRemaining.textContent = fmtHours(totalWorkload);
      summaryCard.hidden = false;

      var avgNew = planResult.totalNewActual / studyDates.length;
      var avgRevision = planResult.totalRevision / studyDates.length;
      var avgBuffer = planResult.totalBuffer / studyDates.length;
      var avgRaw = hoursPerDay;
      var avgFree = Math.max(0, avgRaw - avgNew - avgRevision - avgBuffer);
      
      chipNew.textContent = fmtHM(avgNew);
      chipRevision.textContent = fmtHM(avgRevision);
      chipBuffer.textContent = fmtHM(avgBuffer);
      
      /* Show Free Time only if it exists (> 5 minutes) */
      if (avgFree > EPSILON) {
        chipFree.textContent = fmtHM(avgFree);
        chipFreeWrap.style.display = '';
      } else {
        chipFreeWrap.style.display = 'none';
      }

      var insights = [];

      if (status === 'not-realistic') {
        var extraPerDay = Math.max(0, requiredPerDay - avgUsablePerDay);
        notRealisticEl.hidden = false;
        shortfallTextEl.textContent = 'Your subjects need ' + fmtHours(totalWorkload) + ' of study time, but your selected days and hours only provide ' + fmtHours(planResult.totalNew) + ' of usable new-study capacity (after buffer and revision).';
        statTotalShortfall.textContent = fmtHours(remainingWorkload);
        statExtraPerDay.textContent = fmtHM(extraPerDay);
        statusTextEl.textContent = 'This plan is not realistic with your current inputs — see the shortfall below.';
        planCard.hidden = false;
        planCardTitle.textContent = 'Best Possible Schedule';
        planCardNote.hidden = false;
        insights.push({ icon: ICON_WARN, text: 'Reduce workload, add study days, or increase hours per day to make this plan achievable.' });
        renderInsightsInto(insights, insightsList, insightsCard);
        renderPlan(planResult);
        resultsEl.hidden = false;
        moveRelatedAfterResults(resultsEl);
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      notRealisticEl.hidden = true;
      planCard.hidden = false;
      planCardTitle.textContent = 'Your Day-by-Day Plan';
      planCardNote.hidden = true;

      if (status === 'on-track') {
        statusTextEl.textContent = 'Your workload fits comfortably within your available study time.';
        insights.push({ icon: ICON_CHECK, text: 'You have healthy margin between your required pace and your actual usable study capacity.' });
      } else {
        statusTextEl.textContent = 'Your plan uses most of your usable study time — stay consistent to keep pace.';
        insights.push({ icon: ICON_WARN, text: 'This schedule leaves little room for missed days. Consider a small buffer increase if your routine is unpredictable.' });
      }

      

      var hardSubjects = subjects.filter(function (s) { return s.difficulty === 'hard' && s._hours > 0; });
      if (hardSubjects.length) {
        insights.push({ icon: ICON_INFO, text: hardSubjects.map(function (s) { return s.name; }).join(', ') + (hardSubjects.length > 1 ? ' are' : ' is') + ' marked Hard and scheduled with higher priority.' });
      }
      insights.push({ icon: ICON_INFO, text: 'Revision only starts once there is material to review, and is a redistribution of your available time — not extra hours added on top.' });

      renderInsightsInto(insights, insightsList, insightsCard);
      renderPlan(planResult);

      resultsEl.hidden = false;
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function clampPct(p) { return Math.min(1, Math.max(0, p)); }
    function clampBuffer(v) {
      var n = parseFloat(v);
      if (!isValidNumber(n)) return 0.10;
      return clampPct(n / 100);
    }

    function resetMode() {
      startInput.value = '';
      examInput.value = '';
      hoursInput.value = '';
      hoursInput.classList.remove('shep-input--error');
      weekdayBtns.forEach(function (btn) { btn.setAttribute('aria-pressed', 'true'); });
      revisionModeSel.value = 'auto';
      revisionCustomInput.value = '';
      revisionCustomField.hidden = true;
      bufferInput.value = 10;
      advToggle.setAttribute('aria-expanded', 'false');
      advBody.hidden = true;
      toggleDetailsBtn.setAttribute('aria-pressed', 'false');
      toggleDetailsBtn.textContent = '+ Difficulty & Priority';
      colHeaders.querySelectorAll('.shep-col-extra').forEach(function (h) { h.hidden = true; });
      hideValidation(validationEl);
      resultsEl.hidden = true;

      state.examPlanner = {
        startDate: '', examDate: '',
        weekdays: [1, 1, 1, 1, 1, 1, 1],
        hoursPerDay: '',
        subjects: [makeSubject(), makeSubject()],
        showDetails: false,
        revisionMode: 'auto', revisionCustom: '', bufferPct: 10,
        advancedOpen: false
      };
      renderSubjectRows();
      saveState();
      moveRelatedBackToWrap();
    }

    generateBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__shepExamPlanner = {
      restore: function (saved) {
        if (saved && saved.subjects && saved.subjects.length) {
          state.examPlanner = saved;
        } else {
          state.examPlanner.subjects = [makeSubject(), makeSubject()];
        }
        startInput.value = state.examPlanner.startDate || todayDateInputValue();
        examInput.value = state.examPlanner.examDate || '';
        hoursInput.value = state.examPlanner.hoursPerDay || '';
        weekdayBtns.forEach(function (btn) {
          var day = parseInt(btn.getAttribute('data-day'), 10);
          var on = !!state.examPlanner.weekdays[day];
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        toggleDetailsBtn.setAttribute('aria-pressed', state.examPlanner.showDetails ? 'true' : 'false');
        toggleDetailsBtn.textContent = state.examPlanner.showDetails ? '− Difficulty & Priority' : '+ Difficulty & Priority';
        colHeaders.querySelectorAll('.shep-col-extra').forEach(function (h) { h.hidden = !state.examPlanner.showDetails; });
        revisionModeSel.value = state.examPlanner.revisionMode || 'auto';
        revisionCustomInput.value = state.examPlanner.revisionCustom || '';
        revisionCustomField.hidden = revisionModeSel.value !== 'custom';
        bufferInput.value = (state.examPlanner.bufferPct != null && state.examPlanner.bufferPct !== '') ? state.examPlanner.bufferPct : 10;
        advToggle.setAttribute('aria-expanded', state.examPlanner.advancedOpen ? 'true' : 'false');
        advBody.hidden = !state.examPlanner.advancedOpen;
        renderSubjectRows();
      }
    };
  })();

  /* ============================================================
     MODE 1 — STUDY HOURS
  ============================================================ */

  (function studyHoursMode() {
    var totalInput   = document.getElementById('shep-sh-total-hours');
    var daysInput    = document.getElementById('shep-sh-days');
    var maxInput     = document.getElementById('shep-sh-max-per-day');
    var validationEl = document.getElementById('shep-sh-validation');
    var resultsEl    = document.getElementById('shep-sh-results');
    var calcBtn      = document.getElementById('shep-sh-calc-btn');
    var resetBtn     = document.getElementById('shep-sh-reset-btn');

    var heroEl        = document.getElementById('shep-sh-hero');
    var heroSubEl     = document.getElementById('shep-sh-hero-sub');
    var statusWrap    = document.getElementById('shep-sh-status-wrap');
    var statusBadgeEl = document.getElementById('shep-sh-status-badge');
    var statusTextEl  = document.getElementById('shep-sh-status-text');
    var statTotal     = document.getElementById('shep-sh-stat-total');
    var statDays      = document.getElementById('shep-sh-stat-days');
    var statWeekly    = document.getElementById('shep-sh-stat-weekly');
    var capacityGrid  = document.getElementById('shep-sh-capacity-grid');
    var statCapacity  = document.getElementById('shep-sh-stat-capacity');
    var statDiff      = document.getElementById('shep-sh-stat-diff');
    var statDiffLabel = document.getElementById('shep-sh-stat-diff-label');
    var insightsCard  = document.getElementById('shep-sh-insights-card');
    var insightsList  = document.getElementById('shep-sh-insights-list');

    function readInputs() {
      return {
        total: totalInput.value === '' ? NaN : parseFloat(totalInput.value),
        days:  daysInput.value === '' ? NaN : parseFloat(daysInput.value),
        max:   maxInput.value === '' ? NaN : parseFloat(maxInput.value)
      };
    }

    function persist() {
      state.studyHours.totalHours = totalInput.value;
      state.studyHours.days       = daysInput.value;
      state.studyHours.maxPerDay  = maxInput.value;
      saveStateDebounced();
    }

    [totalInput, daysInput, maxInput].forEach(function (input) {
      input.addEventListener('input', function () {
        input.classList.remove('shep-input--error');
        hideValidation(validationEl);
        persist();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); calculate(); }
      });
      input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    });

    function calculate() {
      hideValidation(validationEl);
      var v = readInputs();

      if (isBlank(totalInput.value) || !isValidNumber(v.total) || v.total < 0) {
        showValidation(validationEl, 'Enter total study hours (0 or more).', totalInput);
        return;
      }
      if (isBlank(daysInput.value) || !isValidNumber(v.days) || v.days < 1) {
        showValidation(validationEl, 'Enter at least 1 study day.', daysInput);
        return;
      }
      var hasMax = !isBlank(maxInput.value);
      if (hasMax && (!isValidNumber(v.max) || v.max <= 0)) {
        showValidation(validationEl, 'Maximum hours per day must be greater than 0.', maxInput);
        return;
      }

      /* Zero-workload case */
      if (v.total === 0) {
        resultsEl.hidden = false;
        heroEl.textContent = '0h/day';
        heroSubEl.textContent = 'No remaining study workload was entered.';
        statusWrap.style.display = 'none';
        statTotal.textContent = '0h';
        statDays.textContent = fmtNum(v.days, 0);
        statWeekly.textContent = '0h';
        capacityGrid.hidden = true;
        renderInsightsInto([], insightsList, insightsCard);
        moveRelatedAfterResults(resultsEl);
        return;
      }
      statusWrap.style.display = '';

      var requiredPerDay = v.total / v.days;
      var weeklyEquivalent = requiredPerDay * 7;

      heroEl.textContent = fmtHM(requiredPerDay);
      heroSubEl.textContent = 'per day';

      statTotal.textContent = fmtHours(v.total);
      statDays.textContent = fmtNum(v.days, 0);
      statWeekly.textContent = fmtHours(weeklyEquivalent);

      var insights = [];

      if (hasMax) {
        capacityGrid.hidden = false;
        var diff = v.max - requiredPerDay;
        statCapacity.textContent = fmtHours(v.max);
        var status = classifyStatus(requiredPerDay, v.max);
        applyStatusBadge(statusBadgeEl, status);

        if (diff >= 0) {
          statDiff.textContent = '+' + fmtHM(diff);
          statDiffLabel.textContent = 'Daily Surplus';
        } else {
          statDiff.textContent = '−' + fmtHM(Math.abs(diff));
          statDiffLabel.textContent = 'Daily Shortfall';
        }

        if (status === 'on-track') {
          statusTextEl.textContent = 'Your required pace fits comfortably within your daily capacity.';
          insights.push({ icon: ICON_CHECK, text: 'You have ' + fmtHM(diff) + ' of spare capacity each day at this pace.' });
        } else if (status === 'tight') {
          statusTextEl.textContent = 'Your required pace uses most of your daily capacity — there is little room for a missed day.';
          insights.push({ icon: ICON_WARN, text: 'You are using ' + fmtNum((requiredPerDay / v.max) * 100, 0) + '% of your daily capacity. A single missed day will make this tight schedule harder to recover.' });
        } else {
          statusTextEl.textContent = 'Your required pace exceeds your maximum daily capacity.';
          insights.push({ icon: ICON_WARN, text: 'You are short by ' + fmtHM(Math.abs(diff)) + ' per day. You will need ' + fmtNum(v.total / v.max, 1) + ' days at your maximum capacity to cover this workload.' });
        }
      } else {
        capacityGrid.hidden = true;
        statusWrap.style.display = 'none';
      }

      if (requiredPerDay > 8) {
        insights.push({ icon: ICON_WARN, text: 'A pace above 8 hours a day is demanding to sustain — consider whether more study days are available.' });
      }
      insights.push({ icon: ICON_INFO, text: 'This is a planning estimate based only on the workload and days you entered.' });

      resultsEl.hidden = false;
      renderInsightsInto(insights, insightsList, insightsCard);
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetMode() {
      totalInput.value = '';
      daysInput.value = '';
      maxInput.value = '';
      [totalInput, daysInput, maxInput].forEach(function (i) { i.classList.remove('shep-input--error'); });
      hideValidation(validationEl);
      resultsEl.hidden = true;
      state.studyHours = { totalHours: '', days: '', maxPerDay: '' };
      saveState();
      moveRelatedBackToWrap();
    }

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__shepStudyHours = {
      restore: function (saved) {
        if (!saved) return;
        state.studyHours = saved;
        if (saved.totalHours !== '' && saved.totalHours != null) totalInput.value = saved.totalHours;
        if (saved.days !== '' && saved.days != null) daysInput.value = saved.days;
        if (saved.maxPerDay !== '' && saved.maxPerDay != null) maxInput.value = saved.maxPerDay;
      }
    };
  })();



  /* ============================================================
     MODE 3 — SYLLABUS PLANNER
  ============================================================ */

  (function syllabusMode() {
    var subjectListEl = document.getElementById('shep-syl-subject-list');
    var addSubjectBtn = document.getElementById('shep-syl-add-subject-btn');
    var daysInput = document.getElementById('shep-syl-days');
    var hoursPerDayInput = document.getElementById('shep-syl-hours-per-day');
    var validationEl = document.getElementById('shep-syl-validation');
    var calcBtn = document.getElementById('shep-syl-calc-btn');
    var resetBtn = document.getElementById('shep-syl-reset-btn');
    var resultsEl = document.getElementById('shep-syl-results');

    var heroEl = document.getElementById('shep-syl-hero');
    var heroSubEl = document.getElementById('shep-syl-hero-sub');
    var statusBadgeEl = document.getElementById('shep-syl-status-badge');
    var statusTextEl = document.getElementById('shep-syl-status-text');
    var statTopics = document.getElementById('shep-syl-stat-topics');
    var statHours = document.getElementById('shep-syl-stat-hours');
    var statDays = document.getElementById('shep-syl-stat-days');
    var statTopicsPerDay = document.getElementById('shep-syl-stat-topics-per-day');
    var insightsCard = document.getElementById('shep-syl-insights-card');
    var insightsList = document.getElementById('shep-syl-insights-list');

    function makeSubject(name, topics, perTopic) {
      return { id: genId(), name: name || '', topics: topics != null ? topics : '', perTopic: perTopic != null ? perTopic : '' };
    }

    function subjectRowHtml(subj) {
      return (
        '<div class="shep-subject-row shep-subject-row--syllabus" data-row-id="' + subj.id + '">' +  
        '<div class="shep-name-field">' +
            '<span class="shep-field-mobile-label">Subject</span>' +
            '<input class="tool-input shep-name-input" type="text" maxlength="60" placeholder="e.g. Chemistry" value="' + esc(subj.name) + '" data-row-id="' + subj.id + '" aria-label="Subject name">' +
          '</div>' +
          '<div class="shep-topics-field">' +
            '<span class="shep-field-mobile-label">Rem. Topics</span>' +
            '<input class="tool-input shep-topics-input" type="number" min="0" step="1" inputmode="numeric" placeholder="0" value="' + esc(subj.topics) + '" data-row-id="' + subj.id + '" aria-label="Remaining topics">' +
          '</div>' +
          '<div class="shep-per-topic-field">' +
            '<span class="shep-field-mobile-label">Hrs / Topic</span>' +
            '<input class="tool-input shep-per-topic-input" type="number" min="0" step="any" inputmode="decimal" placeholder="0" value="' + esc(subj.perTopic) + '" data-row-id="' + subj.id + '" aria-label="Hours per topic">' +
          '</div>' +
          '<button type="button" class="shep-remove-btn" data-row-id="' + subj.id + '" aria-label="Remove subject">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
          '</button>' +
        '</div>'
      );
    }

    function renderRows() {
      subjectListEl.innerHTML = state.syllabus.subjects.map(subjectRowHtml).join('');
      var disable = state.syllabus.subjects.length <= MIN_SUBJECTS;
      subjectListEl.querySelectorAll('.shep-remove-btn').forEach(function (btn) { btn.disabled = disable; });
    }

    function readRowsIntoState() {
      subjectListEl.querySelectorAll('.shep-subject-row').forEach(function (row) {
        var id = row.getAttribute('data-row-id');
        var subj = state.syllabus.subjects.find(function (s) { return s.id === id; });
        if (!subj) return;
        subj.name = row.querySelector('.shep-name-input').value;
        subj.topics = row.querySelector('.shep-topics-input').value;
        subj.perTopic = row.querySelector('.shep-per-topic-input').value;
      });
    }

    addSubjectBtn.addEventListener('click', function () {
      if (state.syllabus.subjects.length >= MAX_SUBJECTS) return;
      state.syllabus.subjects.push(makeSubject());
      renderRows();
      saveState();
      var inputs = subjectListEl.querySelectorAll('.shep-name-input');
      if (inputs.length) inputs[inputs.length - 1].focus();
    });

    subjectListEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.shep-remove-btn');
      if (!btn || state.syllabus.subjects.length <= MIN_SUBJECTS) return;
      var id = btn.getAttribute('data-row-id');
      var idx = state.syllabus.subjects.findIndex(function (s) { return s.id === id; });
      if (idx === -1) return;
      var row = btn.closest('.shep-subject-row');
      row.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
      row.style.opacity = '0';
      row.style.transform = 'translateX(8px)';
      setTimeout(function () {
        state.syllabus.subjects.splice(idx, 1);
        renderRows();
        saveState();
      }, 180);
    });

    subjectListEl.addEventListener('input', function (e) {
      if (e.target.matches('.shep-name-input') || e.target.matches('.shep-topics-input') || e.target.matches('.shep-per-topic-input')) {
        e.target.classList.remove('shep-input--error');
        readRowsIntoState();
        saveStateDebounced();
      }
    });

    [daysInput, hoursPerDayInput].forEach(function (input) {
      input.addEventListener('input', function () {
        input.classList.remove('shep-input--error');
        hideValidation(validationEl);
        state.syllabus.days = daysInput.value;
        state.syllabus.hoursPerDay = hoursPerDayInput.value;
        saveStateDebounced();
      });
      input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    });

    function calculate() {
      hideValidation(validationEl);
      readRowsIntoState();

      var subjects = state.syllabus.subjects.map(function (s) {
        return {
          name: (s.name || '').trim() || 'Subject',
          topics: s.topics === '' ? NaN : parseFloat(s.topics),
          perTopic: s.perTopic === '' ? NaN : parseFloat(s.perTopic)
        };
      });

      if (!subjects.length) { showValidation(validationEl, 'Add at least one subject.'); return; }
      for (var i = 0; i < subjects.length; i++) {
        if (!isValidNumber(subjects[i].topics) || subjects[i].topics < 0) {
          showValidation(validationEl, 'Enter remaining topics (0 or more) for every subject.', subjectListEl.querySelectorAll('.shep-topics-input')[i]);
          return;
        }
        if (!isValidNumber(subjects[i].perTopic) || subjects[i].perTopic < 0) {
          showValidation(validationEl, 'Enter hours per topic (0 or more) for every subject.', subjectListEl.querySelectorAll('.shep-per-topic-input')[i]);
          return;
        }
      }

      var days = daysInput.value === '' ? NaN : parseFloat(daysInput.value);
      var hoursPerDay = hoursPerDayInput.value === '' ? NaN : parseFloat(hoursPerDayInput.value);
      if (!isValidNumber(days) || days < 1) { showValidation(validationEl, 'Enter at least 1 available study day.', daysInput); return; }
      if (!isValidNumber(hoursPerDay) || hoursPerDay <= 0) { showValidation(validationEl, 'Enter available hours per day (greater than 0).', hoursPerDayInput); return; }

      var totalTopics = subjects.reduce(function (sum, s) { return sum + s.topics; }, 0);
      var totalWorkload = subjects.reduce(function (sum, s) { return sum + (s.topics * s.perTopic); }, 0);

      resultsEl.hidden = false;

      if (totalTopics === 0 || totalWorkload === 0) {
        heroEl.textContent = '0h/day';
        heroSubEl.textContent = 'Syllabus complete based on the information entered.';
        statusBadgeEl.style.display = 'none';
        statusTextEl.textContent = '';
        statTopics.textContent = '0';
        statHours.textContent = '0h';
        statDays.textContent = fmtNum(days, 0);
        statTopicsPerDay.textContent = '0';
        renderInsightsInto([], insightsList, insightsCard);
        moveRelatedAfterResults(resultsEl);
        return;
      }
      statusBadgeEl.style.display = '';

      var requiredPerDay = totalWorkload / days;
      var topicsPerDay = totalTopics / days;
      var availableCapacity = days * hoursPerDay;
      var status = classifyStatus(requiredPerDay, hoursPerDay);

      heroEl.textContent = fmtHM(requiredPerDay);
      heroSubEl.textContent = 'per study day';
      applyStatusBadge(statusBadgeEl, status);

      statTopics.textContent = fmtNum(totalTopics, 0);
      statHours.textContent = fmtHours(totalWorkload);
      statDays.textContent = fmtNum(days, 0);
      statTopicsPerDay.textContent = fmtNum(topicsPerDay, 1);

      var insights = [];
      if (status === 'on-track') {
        statusTextEl.textContent = 'Your syllabus pace fits comfortably within your available time.';
        insights.push({ icon: ICON_CHECK, text: 'You have margin above your required pace of ' + fmtHM(requiredPerDay) + ' per day.' });
      } else if (status === 'tight') {
        statusTextEl.textContent = 'Your pace uses most of your available time each day.';
        insights.push({ icon: ICON_WARN, text: 'You are using ' + fmtNum((requiredPerDay / hoursPerDay) * 100, 0) + '% of your daily capacity — little room for a slow day.' });
      } else {
        var shortfall = totalWorkload - availableCapacity;
        statusTextEl.textContent = 'Your remaining syllabus needs more time than you currently have available.';
        insights.push({ icon: ICON_WARN, text: 'You are short by ' + fmtHours(shortfall) + ' in total, or ' + fmtHM(requiredPerDay - hoursPerDay) + ' per day.' });
      }
      insights.push({ icon: ICON_INFO, text: 'Pace = total remaining hours (topics × hours/topic) ÷ available study days.' });

      renderInsightsInto(insights, insightsList, insightsCard);
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetMode() {
      hideValidation(validationEl);
      resultsEl.hidden = true;
      daysInput.value = '';
      hoursPerDayInput.value = '';
      [daysInput, hoursPerDayInput].forEach(function (i) { i.classList.remove('shep-input--error'); });
      state.syllabus = { subjects: [makeSubject(), makeSubject()], days: '', hoursPerDay: '' };
      renderRows();
      saveState();
      moveRelatedBackToWrap();
    }

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__shepSyllabus = {
      restore: function (saved) {
        if (saved && saved.subjects && saved.subjects.length) {
          state.syllabus = saved;
        } else {
          state.syllabus.subjects = [makeSubject(), makeSubject()];
        }
        daysInput.value = state.syllabus.days || '';
        hoursPerDayInput.value = state.syllabus.hoursPerDay || '';
        renderRows();
      }
    };
  })();

  /* ============================================================
     MODE 4 — CATCH-UP
     Reuses the same required-hours/day + status engine as
     Study Hours (rule 33: no separate algorithm for catch-up).
  ============================================================ */

  (function catchUpMode() {
    var workloadInput = document.getElementById('shep-cu-remaining-workload');
    var daysInput = document.getElementById('shep-cu-remaining-days');
    var hoursInput = document.getElementById('shep-cu-hours-per-day');
    var validationEl = document.getElementById('shep-cu-validation');
    var calcBtn = document.getElementById('shep-cu-calc-btn');
    var resetBtn = document.getElementById('shep-cu-reset-btn');
    var resultsEl = document.getElementById('shep-cu-results');

    var heroEl = document.getElementById('shep-cu-hero');
    var heroSubEl = document.getElementById('shep-cu-hero-sub');
    var statusBadgeEl = document.getElementById('shep-cu-status-badge');
    var statusTextEl = document.getElementById('shep-cu-status-text');
    var statRequired = document.getElementById('shep-cu-stat-required');
    var statAvailable = document.getElementById('shep-cu-stat-available');
    var statShortfall = document.getElementById('shep-cu-stat-shortfall');
    var altCard = document.getElementById('shep-cu-alt-card');
    var altList = document.getElementById('shep-cu-alt-list');
    var insightsCard = document.getElementById('shep-cu-insights-card');
    var insightsList = document.getElementById('shep-cu-insights-list');

    [workloadInput, daysInput, hoursInput].forEach(function (input) {
      input.addEventListener('input', function () {
        input.classList.remove('shep-input--error');
        hideValidation(validationEl);
        state.catchup.remainingWorkload = workloadInput.value;
        state.catchup.remainingDays = daysInput.value;
        state.catchup.hoursPerDay = hoursInput.value;
        saveStateDebounced();
      });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); calculate(); } });
      input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    });

    function altCardHtml(title, value, desc) {
      return '<div class="shep-alt-card"><div class="shep-alt-title">' + esc(title) + '</div>' +
        '<div class="shep-alt-value">' + value + '</div>' +
        '<div class="shep-alt-desc">' + esc(desc) + '</div></div>';
    }

    function calculate() {
      hideValidation(validationEl);
      var workload = workloadInput.value === '' ? NaN : parseFloat(workloadInput.value);
      var days = daysInput.value === '' ? NaN : parseFloat(daysInput.value);
      var available = hoursInput.value === '' ? NaN : parseFloat(hoursInput.value);

      if (!isValidNumber(workload) || workload < 0) { showValidation(validationEl, 'Enter remaining workload in hours (0 or more).', workloadInput); return; }
      if (!isValidNumber(days) || days < 1) { showValidation(validationEl, 'Enter at least 1 remaining study day.', daysInput); return; }
      if (!isValidNumber(available) || available <= 0) { showValidation(validationEl, 'Enter available hours per day (greater than 0).', hoursInput); return; }

      resultsEl.hidden = false;

      if (workload === 0) {
        heroEl.textContent = '0h/day';
        heroSubEl.textContent = 'No remaining workload was entered.';
        statusBadgeEl.style.display = 'none';
        statusTextEl.textContent = '';
        statRequired.textContent = '0h';
        statAvailable.textContent = fmtHM(available);
        statShortfall.textContent = '0h';
        altCard.hidden = true;
        renderInsightsInto([], insightsList, insightsCard);
        moveRelatedAfterResults(resultsEl);
        return;
      }
      statusBadgeEl.style.display = '';

      var requiredPerDay = workload / days;
      var shortfall = requiredPerDay - available;
      var status = classifyStatus(requiredPerDay, available);

      heroEl.textContent = fmtHM(requiredPerDay);
      applyStatusBadge(statusBadgeEl, status);
      statRequired.textContent = fmtHM(requiredPerDay);
      statAvailable.textContent = fmtHM(available);
      statShortfall.textContent = shortfall > EPSILON ? fmtHM(shortfall) : '0h';

      var insights = [];

      if (shortfall > EPSILON) {
        statusTextEl.textContent = 'You are behind — see the alternatives below to close the gap.';
        altCard.hidden = false;

        var additionalDaily = shortfall;
        var requiredDays = workload / available;
        var additionalDays = Math.ceil(requiredDays - days);
        var maxWorkloadFittable = available * days;
        var workloadReduction = workload - maxWorkloadFittable;

        altList.innerHTML =
          altCardHtml('Add Daily Time', '+' + fmtHM(additionalDaily) + '/day', 'Study ' + fmtHM(additionalDaily) + ' more each day to hit your remaining workload in ' + fmtNum(days, 0) + ' days.') +
          altCardHtml('Add Study Days', '+' + fmtNum(Math.max(0, additionalDays), 0) + ' day' + (additionalDays === 1 ? '' : 's'), 'At ' + fmtHM(available) + '/day, you would need about ' + fmtNum(requiredDays, 1) + ' days total to cover this workload.') +
          altCardHtml('Reduce Workload', '−' + fmtHours(Math.max(0, workloadReduction)), 'Cut your remaining workload to ' + fmtHours(maxWorkloadFittable) + ' to fit your current days and hours.');

        insights.push({ icon: ICON_WARN, text: 'Choose whichever option is realistic for you — more time, more days, or less workload. The tool doesn\u2019t choose for you.' });
      } else {
        statusTextEl.textContent = status === 'tight'
          ? 'You can still catch up, but there is little room to spare.'
          : 'You have enough time to catch up comfortably.';
        altCard.hidden = true;
        insights.push({ icon: ICON_CHECK, text: 'At your current available hours, you are on pace to finish your remaining workload in time.' });
      }

      renderInsightsInto(insights, insightsList, insightsCard);
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetMode() {
      hideValidation(validationEl);
      resultsEl.hidden = true;
      [workloadInput, daysInput, hoursInput].forEach(function (i) { i.value = ''; i.classList.remove('shep-input--error'); });
      state.catchup = { remainingWorkload: '', remainingDays: '', hoursPerDay: '' };
      saveState();
      moveRelatedBackToWrap();
    }

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__shepCatchUp = {
      restore: function (saved) {
        if (!saved) return;
        state.catchup = saved;
        if (saved.remainingWorkload !== '' && saved.remainingWorkload != null) workloadInput.value = saved.remainingWorkload;
        if (saved.remainingDays !== '' && saved.remainingDays != null) daysInput.value = saved.remainingDays;
        if (saved.hoursPerDay !== '' && saved.hoursPerDay != null) hoursInput.value = saved.hoursPerDay;
      }
    };
  })();

  /* ============================================================
     MODE 5 — READINESS
     Study Priority Estimate — never an exam-success prediction.
  ============================================================ */

  (function readinessMode() {
    var subjectListEl = document.getElementById('shep-rd-subject-list');
    var addSubjectBtn = document.getElementById('shep-rd-add-subject-btn');
    var validationEl = document.getElementById('shep-rd-validation');
    var calcBtn = document.getElementById('shep-rd-calc-btn');
    var resetBtn = document.getElementById('shep-rd-reset-btn');
    var resultsEl = document.getElementById('shep-rd-results');

    var topNameEl = document.getElementById('shep-rd-top-name');
    var topCompletionEl = document.getElementById('shep-rd-top-completion');
    var topConfidenceEl = document.getElementById('shep-rd-top-confidence');
    var topDifficultyEl = document.getElementById('shep-rd-top-difficulty');
    var topImportanceEl = document.getElementById('shep-rd-top-importance');
    var topScoreEl = document.getElementById('shep-rd-top-score');
    var topReasonEl = document.getElementById('shep-rd-top-reason');
    var priorityListEl = document.getElementById('shep-rd-priority-list');
    var insightsCard = document.getElementById('shep-rd-insights-card');
    var insightsList = document.getElementById('shep-rd-insights-list');

    function makeSubject(name, completion, confidence, difficulty, importance) {
      return {
        id: genId(), name: name || '',
        completion: completion != null ? completion : '',
        confidence: confidence || 'medium',
        difficulty: difficulty || 'medium',
        importance: importance || 'medium'
      };
    }

    function selectHtml(cls, id, value, options) {
      return '<div class="shep-select-wrap shep-select-wrap--sm">' +
        '<select class="tool-select ' + cls + '" data-row-id="' + id + '">' +
        options.map(function (o) { return '<option value="' + o + '"' + (o === value ? ' selected' : '') + '>' + o.charAt(0).toUpperCase() + o.slice(1) + '</option>'; }).join('') +
        '</select>' +
        '<span class="shep-select-arrow" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>' +
        '</div>';
    }

    function subjectRowHtml(subj) {
      return (
        '<div class="shep-subject-row shep-subject-row--readiness" data-row-id="' + subj.id + '">' +
        '<div class="shep-name-field">' +
            '<span class="shep-field-mobile-label">Subject</span>' +
            '<input class="tool-input shep-name-input" type="text" maxlength="60" placeholder="e.g. Biology" value="' + esc(subj.name) + '" data-row-id="' + subj.id + '" aria-label="Subject name">' +
          '</div>' +
          '<div class="shep-completion-field">' +
            '<span class="shep-field-mobile-label">Completion %</span>' +
            '<input class="tool-input shep-completion-input" type="number" min="0" max="100" step="1" inputmode="numeric" placeholder="0" value="' + esc(subj.completion) + '" data-row-id="' + subj.id + '" aria-label="Completion percent">' +
          '</div>' +
          '<div class="shep-confidence-field">' +
            '<span class="shep-field-mobile-label">Confidence</span>' +
            selectHtml('shep-confidence-select', subj.id, subj.confidence, ['low', 'medium', 'high']) +
          '</div>' +
          '<div class="shep-diff-field">' +
            '<span class="shep-field-mobile-label">Difficulty</span>' +
            selectHtml('shep-diff-select', subj.id, subj.difficulty, ['easy', 'medium', 'hard']) +
          '</div>' +
          '<div class="shep-importance-field">' +
            '<span class="shep-field-mobile-label">Importance</span>' +
            selectHtml('shep-importance-select', subj.id, subj.importance, ['low', 'medium', 'high']) +
          '</div>' +
          '<button type="button" class="shep-remove-btn" data-row-id="' + subj.id + '" aria-label="Remove subject">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
          '</button>' +  
        '</div>'
      );
    }

    function renderRows() {
      subjectListEl.innerHTML = state.readiness.subjects.map(subjectRowHtml).join('');
      var disable = state.readiness.subjects.length <= MIN_SUBJECTS;
      subjectListEl.querySelectorAll('.shep-remove-btn').forEach(function (btn) { btn.disabled = disable; });
    }

    function readRowsIntoState() {
      subjectListEl.querySelectorAll('.shep-subject-row').forEach(function (row) {
        var id = row.getAttribute('data-row-id');
        var subj = state.readiness.subjects.find(function (s) { return s.id === id; });
        if (!subj) return;
        subj.name = row.querySelector('.shep-name-input').value;
        subj.completion = row.querySelector('.shep-completion-input').value;
        subj.confidence = row.querySelector('.shep-confidence-select').value;
        subj.difficulty = row.querySelector('.shep-diff-select').value;
        subj.importance = row.querySelector('.shep-importance-select').value;
      });
    }

    addSubjectBtn.addEventListener('click', function () {
      if (state.readiness.subjects.length >= MAX_SUBJECTS) return;
      state.readiness.subjects.push(makeSubject());
      renderRows();
      saveState();
      var inputs = subjectListEl.querySelectorAll('.shep-name-input');
      if (inputs.length) inputs[inputs.length - 1].focus();
    });

    subjectListEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.shep-remove-btn');
      if (!btn || state.readiness.subjects.length <= MIN_SUBJECTS) return;
      var id = btn.getAttribute('data-row-id');
      var idx = state.readiness.subjects.findIndex(function (s) { return s.id === id; });
      if (idx === -1) return;
      var row = btn.closest('.shep-subject-row');
      row.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
      row.style.opacity = '0';
      row.style.transform = 'translateX(8px)';
      setTimeout(function () {
        state.readiness.subjects.splice(idx, 1);
        renderRows();
        saveState();
      }, 180);
    });

    subjectListEl.addEventListener('input', function (e) {
      if (e.target.matches('.shep-name-input') || e.target.matches('.shep-completion-input')) {
        e.target.classList.remove('shep-input--error');
        readRowsIntoState();
        saveStateDebounced();
      }
    });

    subjectListEl.addEventListener('change', function (e) {
      if (e.target.matches('.shep-confidence-select') || e.target.matches('.shep-diff-select') || e.target.matches('.shep-importance-select')) {
        readRowsIntoState();
        saveState();
      }
    });

    /* Importance uses the shared low/medium/high weight scale, same as
       difficulty and priority elsewhere in this tool (rule 29–31). */
    function importanceWeightOf(subj) {
      return weightOf(subj.importance || 'medium');
    }

    function calculate() {
      hideValidation(validationEl);
      readRowsIntoState();

      var subjects = state.readiness.subjects.map(function (s) {
        return {
          name: (s.name || '').trim() || 'Subject',
          completion: s.completion === '' ? NaN : parseFloat(s.completion),
          confidence: s.confidence, difficulty: s.difficulty, importance: s.importance || 'medium'
        };
      });

      if (!subjects.length) { showValidation(validationEl, 'Add at least one subject.'); return; }
      for (var i = 0; i < subjects.length; i++) {
        if (!isValidNumber(subjects[i].completion) || subjects[i].completion < 0 || subjects[i].completion > 100) {
          showValidation(validationEl, 'Enter completion % (0–100) for every subject.', subjectListEl.querySelectorAll('.shep-completion-input')[i]);
          return;
        }
      }

      subjects.forEach(function (s) {
        var incompleteFactor = 1 - (s.completion / 100);
        s._score = incompleteFactor * confidenceWeightOf(s.confidence) * weightOf(s.difficulty) * importanceWeightOf(s);
      });

      var maxPossible = 1 * CONFIDENCE_WEIGHTS.low * WEIGHTS.high * WEIGHTS.high;
      subjects.forEach(function (s) { s._display = Math.round((s._score / maxPossible) * 100); });

      subjects.sort(function (a, b) { return b._score - a._score; });

      var top = subjects[0];
      resultsEl.hidden = false;
      topNameEl.textContent = top.name;
      topCompletionEl.textContent = fmtNum(subjects[0].completion, 0) + '%';
      topConfidenceEl.textContent = top.confidence.charAt(0).toUpperCase() + top.confidence.slice(1);
      topDifficultyEl.textContent = top.difficulty.charAt(0).toUpperCase() + top.difficulty.slice(1);
      topImportanceEl.textContent = (top.importance || 'medium').charAt(0).toUpperCase() + (top.importance || 'medium').slice(1);
      topScoreEl.textContent = top._display + '/100';

      var reasonParts = [];
      if (top.completion < 50) reasonParts.push('is only ' + fmtNum(top.completion, 0) + '% complete');
      if (top.confidence === 'low') reasonParts.push('has low confidence');
      if (top.difficulty === 'hard') reasonParts.push('is marked Hard');
      if (top.importance === 'high') reasonParts.push('is high importance');
      topReasonEl.textContent = reasonParts.length
        ? (top.name + ' ' + reasonParts.join(', ') + ' — that combination gives it the highest study priority.')
        : (top.name + ' has the highest study priority based on its current completion, confidence and difficulty.');

      priorityListEl.innerHTML = subjects.map(function (s) {
        return '<div class="shep-readiness-row">' +
          '<div><div class="shep-readiness-row-name">' + esc(s.name) + '</div>' +
          '<div class="shep-readiness-row-meta">' + fmtNum(s.completion, 0) + '% complete · ' + esc(s.confidence) + ' confidence · ' + esc(s.difficulty) + ' · ' + esc(s.importance || 'medium') + ' importance</div></div>' +
          '<div class="shep-readiness-row-score">' + s._display + '<small>/100</small></div>' +
        '</div>';
      }).join('');

      var insights = [
        { icon: ICON_INFO, text: 'Study Priority is a planning estimate — not a prediction of exam marks, rank, or success.' },
        { icon: ICON_INFO, text: 'Lower completion and lower confidence both raise a subject\u2019s priority, so it surfaces to the top of your list.' }
      ];
      var allLow = subjects.every(function (s) { return s.completion >= 80; });
      if (allLow) insights.unshift({ icon: ICON_CHECK, text: 'All subjects are at least 80% complete — nice work staying ahead.' });

      renderInsightsInto(insights, insightsList, insightsCard);
      moveRelatedAfterResults(resultsEl);
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function resetMode() {
      hideValidation(validationEl);
      resultsEl.hidden = true;
      state.readiness = { subjects: [makeSubject(), makeSubject()] };
      renderRows();
      saveState();
      moveRelatedBackToWrap();
    }

    calcBtn.addEventListener('click', calculate);
    resetBtn.addEventListener('click', resetMode);

    window.__shepReadiness = {
      restore: function (saved) {
        if (saved && saved.subjects && saved.subjects.length) {
          state.readiness = saved;
        } else {
          state.readiness.subjects = [makeSubject(), makeSubject()];
        }
        renderRows();
      }
    };
  })();

  /* ============================================================
     INITIALISATION
  ============================================================ */

  (function init() {
    var saved = loadState();

    if (saved) {
      window.__shepStudyHours.restore(saved.studyHours);
      window.__shepExamPlanner.restore(saved.examPlanner);
      window.__shepSyllabus.restore(saved.syllabus);
      window.__shepCatchUp.restore(saved.catchup);
      window.__shepReadiness.restore(saved.readiness);

      var mode = (saved.activeMode && MODES.indexOf(saved.activeMode) !== -1) ? saved.activeMode : 'study-hours';
      switchMode(mode, false, false);
    } else {
      window.__shepStudyHours.restore(null);
      window.__shepExamPlanner.restore(null);
      window.__shepSyllabus.restore(null);
      window.__shepCatchUp.restore(null);
      window.__shepReadiness.restore(null);
      switchMode('study-hours', false, false);
    }

    if (window.P50ToolBase) {
      P50ToolBase.renderRelatedTools(
        'shep-related-grid',
        'study-hours-exam-planner',
        'student-tools'
      );
    }
  })();

})();
