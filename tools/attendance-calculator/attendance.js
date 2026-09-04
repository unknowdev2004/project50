/* ============================================
   ATTENDANCE.JS — Project 50
   Attendance Calculator — Student Tool #2

   FORMULAS
   ────────
   Attendance %   = (Attended ÷ Total) × 100
   Classes Missed = Total − Attended
   Eligible       = Attendance % ≥ Required %

   Classes Can Be Missed
     = floor((Attended ÷ (Required ÷ 100)) − Total)
     Never negative.

   Classes Needed (consecutive attendance from now)
     = ceil((((Required ÷ 100) × Total) − Attended) ÷ (1 − (Required ÷ 100)))
     Never negative. Undefined (shown as "Not possible") when
     Required = 100 and the student is not already at 100%.

   Full internal precision. Display values only are rounded.

   STORAGE KEY: p50_attendance_calculator
   Saves inputs only (attended, total, required). 300ms debounce.

   RESULT HIERARCHY
   ────────────────
   1. Hero Result        — current attendance % + status
   2. Eligibility         — eligible/not eligible + progress bar
   3. Attendance Analysis — attended / total / missed
   4. Attendance Forecast — if attend next / if miss next
   5. Academic Summary    — classes can miss / classes needed / required %
   6. Insights             — contextual observations
============================================ */

(function () {
  'use strict';

  /* ============================================
     CONSTANTS
  ============================================ */

  var STORAGE_KEY = 'p50_attendance_calculator';
  var SAVE_DEBOUNCE_MS = 300;
  var EPSILON = 1e-9;

  /* Insight SVG icons */
  var ICON_CHECK =
    '<svg class="attendance-insight-icon attendance-insight-icon--positive" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>';

  var ICON_INFO =
    '<svg class="attendance-insight-icon attendance-insight-icon--neutral" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';

  var ICON_WARN =
    '<svg class="attendance-insight-icon attendance-insight-icon--warning" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>' +
    '<path d="M12 9v4"/><path d="M12 17h.01"/></svg>';

  /* ============================================
     DOM REFERENCES
  ============================================ */

  var attendedInput  = document.getElementById('attendance-attended');
  var totalInput     = document.getElementById('attendance-total');
  var requiredInput  = document.getElementById('attendance-required');

  var validationEl   = document.getElementById('attendance-validation');
  var resultsEl       = document.getElementById('attendance-results');
  var calcBtn         = document.getElementById('attendance-calc-btn');
  var resetBtn        = document.getElementById('attendance-reset-btn');

  /* Hero */
  var heroDisplayEl  = document.getElementById('attendance-display');
  var heroStatusEl   = document.getElementById('attendance-hero-status');
  var heroCardEl     = document.getElementById('attendance-hero-card');

  /* Eligibility */
  var eligBadgeEl        = document.getElementById('attendance-eligibility-badge');
  var eligTextEl         = document.getElementById('attendance-eligibility-text');
  var eligCardEl          = document.getElementById('attendance-eligibility-card');
  var progressFillEl      = document.getElementById('attendance-progress-fill');
  var progressMarkerEl    = document.getElementById('attendance-progress-marker');
  var progressReqLabelEl = document.getElementById('attendance-progress-required-label');

  /* Attendance Analysis */
  var statAttendedEl = document.getElementById('attendance-stat-attended');
  var statTotalEl    = document.getElementById('attendance-stat-total');
  var statMissedEl   = document.getElementById('attendance-stat-missed');

  /* Forecast */
  var forecastAttendEl      = document.getElementById('attendance-forecast-attend');
  var forecastAttendDeltaEl = document.getElementById('attendance-forecast-attend-delta');
  var forecastMissEl        = document.getElementById('attendance-forecast-miss');
  var forecastMissDeltaEl   = document.getElementById('attendance-forecast-miss-delta');

  /* Academic Summary */
  var canMissEl        = document.getElementById('attendance-can-miss');
  var needAttendEl     = document.getElementById('attendance-need-attend');
  var requiredDisplayEl = document.getElementById('attendance-required-display');
  var summaryNoteEl    = document.getElementById('attendance-summary-note');

  /* Insights */
  var insightsListEl = document.getElementById('attendance-insights-list');
  var insightsCardEl = document.getElementById('attendance-insights-card');

  var allNumberInputs = [attendedInput, totalInput, requiredInput];

  /* ============================================
     PERSISTENCE
  ============================================ */

  var _saveTimer = null;

  function saveState() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function () {
      try {
        P50Storage.set(STORAGE_KEY, {
          attended: attendedInput.value,
          total:    totalInput.value,
          required: requiredInput.value
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

  function restoreState() {
    var saved = loadState();
    if (!saved) return;
    if (saved.attended !== undefined && saved.attended !== null && saved.attended !== '') {
      attendedInput.value = saved.attended;
    }
    if (saved.total !== undefined && saved.total !== null && saved.total !== '') {
      totalInput.value = saved.total;
    }
    if (saved.required !== undefined && saved.required !== null && saved.required !== '') {
      requiredInput.value = saved.required;
    }
  }

  /* ============================================
     VALIDATION
  ============================================ */

  function clearErrors() {
    for (var i = 0; i < allNumberInputs.length; i++) {
      allNumberInputs[i].classList.remove('attendance-input--error');
    }
    hideValidation();
  }

  function showValidation(msg, input) {
    validationEl.textContent = msg;
    validationEl.hidden = false;
    if (input) {
      input.classList.add('attendance-input--error');
      input.focus();
    }
  }

  function hideValidation() {
    validationEl.hidden = true;
    validationEl.textContent = '';
  }

  function isBlank(v) {
    return v === '' || v === null || v === undefined;
  }

  function validate() {
    clearErrors();

    var attendedRaw = attendedInput.value.trim();
    var totalRaw    = totalInput.value.trim();
    var requiredRaw = requiredInput.value.trim();

    if (isBlank(attendedRaw)) {
      showValidation('Enter the number of classes attended.', attendedInput);
      return null;
    }
    if (isBlank(totalRaw)) {
      showValidation('Enter the total number of classes.', totalInput);
      return null;
    }
    if (isBlank(requiredRaw)) {
      showValidation('Enter the required attendance percentage.', requiredInput);
      return null;
    }

    var attended = Number(attendedRaw);
    var total    = Number(totalRaw);
    var required = Number(requiredRaw);

    if (isNaN(attended) || !isFinite(attended)) {
      showValidation('Classes attended must be a valid number.', attendedInput);
      return null;
    }
    if (isNaN(total) || !isFinite(total)) {
      showValidation('Total classes must be a valid number.', totalInput);
      return null;
    }
    if (isNaN(required) || !isFinite(required)) {
      showValidation('Required attendance percentage must be a valid number.', requiredInput);
      return null;
    }

    if (!Number.isInteger(attended)) {
      showValidation('Classes attended must be a whole number — decimals are not allowed.', attendedInput);
      return null;
    }
    if (!Number.isInteger(total)) {
      showValidation('Total classes must be a whole number — decimals are not allowed.', totalInput);
      return null;
    }
    if (!Number.isInteger(required)) {
      showValidation('Required attendance percentage must be a whole number — decimals are not allowed.', requiredInput);
      return null;
    }

    if (attended < 0) {
      showValidation('Classes attended cannot be negative.', attendedInput);
      return null;
    }
    if (total <= 0) {
      showValidation('Total classes must be greater than zero.', totalInput);
      return null;
    }
    if (attended > total) {
      showValidation('Classes attended cannot be greater than total classes.', attendedInput);
      return null;
    }
    if (required <= 0) {
      showValidation('Required attendance percentage must be greater than 0.', requiredInput);
      return null;
    }
    if (required > 100) {
      showValidation('Required attendance percentage cannot exceed 100.', requiredInput);
      return null;
    }

    return { attended: attended, total: total, required: required };
  }

  /* ============================================
     CALCULATION HELPERS
  ============================================ */

  function computeCanMiss(attended, total, requiredPct) {
    var req = requiredPct / 100;
    var raw = (attended / req) - total;
    var val = Math.floor(raw + EPSILON);
    return val > 0 ? val : 0;
  }

  /* Returns a finite number, or Infinity if mathematically unreachable
     (Required = 100% and student is not already at 100%). */
  function computeClassesNeeded(attended, total, requiredPct) {
    var req = requiredPct / 100;
    if (req >= 1 - EPSILON) {
      return (attended === total) ? 0 : Infinity;
    }
    var raw = ((req * total) - attended) / (1 - req);
    var val = Math.ceil(raw - EPSILON);
    return val > 0 ? val : 0;
  }

  function fmtPct(n) {
    return n.toFixed(1) + '%';
  }

  /* ============================================
     CALCULATE
  ============================================ */

  function calculate() {
    var input = validate();
    if (!input) return;

    var attended = input.attended;
    var total    = input.total;
    var required = input.required;

    var missed   = total - attended;
    var pct      = (attended / total) * 100;
    var eligible = (attended * 100) >= (required * total) - EPSILON;

    var canMiss    = computeCanMiss(attended, total, required);
    var needAttend = computeClassesNeeded(attended, total, required);

    var attendNextPct = ((attended + 1) / (total + 1)) * 100;
    var missNextPct    = (attended / (total + 1)) * 100;

    renderResults({
      attended: attended,
      total: total,
      required: required,
      missed: missed,
      pct: pct,
      eligible: eligible,
      canMiss: canMiss,
      needAttend: needAttend,
      attendNextPct: attendNextPct,
      missNextPct: missNextPct
    });
  }

  /* ============================================
     RENDER
  ============================================ */

  function renderResults(d) {
    /* 1. Hero */
    heroDisplayEl.textContent = fmtPct(d.pct);
    heroStatusEl.textContent  = d.eligible
      ? 'Eligible — you meet the required attendance'
      : 'Not Eligible — below required attendance';
    heroStatusEl.className = 'attendance-hero-status ' +
      (d.eligible ? 'attendance-hero-status--good' : 'attendance-hero-status--bad');
    heroCardEl.classList.toggle('attendance-hero-card--good', d.eligible);
    heroCardEl.classList.toggle('attendance-hero-card--bad', !d.eligible);

    /* 2. Eligibility */
    eligBadgeEl.textContent = d.eligible ? 'Eligible' : 'Not Eligible';
    eligBadgeEl.className = 'attendance-eligibility-badge ' +
      (d.eligible ? 'attendance-eligibility-badge--good' : 'attendance-eligibility-badge--bad');

    var gap = Math.abs(d.pct - d.required);
    eligTextEl.textContent = d.eligible
      ? 'Your attendance is ' + gap.toFixed(1) + ' points above the ' + d.required + '% requirement.'
      : 'Your attendance is ' + gap.toFixed(1) + ' points below the ' + d.required + '% requirement.';

    var fillPct = Math.min(100, Math.max(0, d.pct));
    progressFillEl.style.width = fillPct + '%';
    progressFillEl.className = 'attendance-progress-fill ' +
      (d.eligible ? 'attendance-progress-fill--good' : 'attendance-progress-fill--bad');
    progressMarkerEl.style.left = Math.min(100, Math.max(0, d.required)) + '%';
    progressReqLabelEl.textContent = 'Required ' + d.required + '%';

    /* 3. Attendance Analysis */
    statAttendedEl.textContent = d.attended;
    statTotalEl.textContent    = d.total;
    statMissedEl.textContent   = d.missed;

    /* 4. Attendance Forecast */
    forecastAttendEl.textContent = fmtPct(d.attendNextPct);
    var attendDelta = d.attendNextPct - d.pct;
    forecastAttendDeltaEl.textContent = '+' + attendDelta.toFixed(1) + ' points';

    forecastMissEl.textContent = fmtPct(d.missNextPct);
    var missDelta = d.missNextPct - d.pct;
    forecastMissDeltaEl.textContent = missDelta.toFixed(1) + ' points';

    /* 5. Academic Summary */
    canMissEl.textContent = d.canMiss;
    needAttendEl.textContent = isFinite(d.needAttend) ? d.needAttend : 'Not possible';
    requiredDisplayEl.textContent = d.required + '%';

    if (!isFinite(d.needAttend)) {
      summaryNoteEl.textContent = 'A 100% requirement can never be regained once a class has been missed — attending every future class only approaches, but never reaches, 100% again.';
    } else if (d.eligible) {
      summaryNoteEl.textContent = 'You are currently eligible, so no additional classes are required right now — the figure above shows your safety margin.';
    } else {
      summaryNoteEl.textContent = 'Attend the next ' + d.needAttend + ' class' + (d.needAttend === 1 ? '' : 'es') + ' in a row, without missing any, to reach ' + d.required + '% attendance.';
    }

    /* 6. Insights */
    renderInsights(d);

    /* Show results */
    resultsEl.hidden = false;

    if (window.P50ToolBase) P50ToolBase.triggerAnimations();

    /* Move related tools below results */
    var relatedWrap = document.getElementById('attendance-related-wrap');
    if (relatedWrap && resultsEl.nextElementSibling !== relatedWrap) {
      resultsEl.after(relatedWrap);
    }

    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ============================================
     INSIGHTS
  ============================================ */

  function renderInsights(d) {
    var insights = buildInsights(d);

    if (!insights.length) {
      insightsCardEl.hidden = true;
      return;
    }

    insightsCardEl.hidden = false;
    insightsListEl.innerHTML = insights.map(function (item) {
      return '<li>' + item.icon + '<span>' + item.text + '</span></li>';
    }).join('');
  }

  function buildInsights(d) {
    var items = [];

    /* Eligibility status */
    if (d.eligible) {
      if (d.canMiss === 0) {
        items.push({
          icon: ICON_WARN,
          text: 'You are right at the eligibility threshold — missing even one more class would drop you below ' + d.required + '%.'
        });
      } else {
        items.push({
          icon: ICON_CHECK,
          text: 'You can miss up to ' + d.canMiss + ' more class' + (d.canMiss === 1 ? '' : 'es') + ' and remain eligible for the ' + d.required + '% requirement.'
        });
      }
    } else {
      if (!isFinite(d.needAttend)) {
        items.push({
          icon: ICON_WARN,
          text: 'Reaching 100% attendance from here is mathematically impossible — you have already missed at least one class.'
        });
      } else {
        items.push({
          icon: ICON_WARN,
          text: 'You are below the required attendance. Attend the next ' + d.needAttend + ' class' + (d.needAttend === 1 ? '' : 'es') + ' without missing any to reach ' + d.required + '%.'
        });
      }
    }

    /* Forecast swing */
    var swing = d.attendNextPct - d.missNextPct;
    items.push({
      icon: ICON_INFO,
      text: 'Attending your next class raises attendance to ' + fmtPct(d.attendNextPct) + '; missing it lowers it to ' + fmtPct(d.missNextPct) + ' — a swing of ' + swing.toFixed(1) + ' points from a single class.'
    });

    /* Missed classes context */
    if (d.missed === 0) {
      items.push({
        icon: ICON_CHECK,
        text: 'You have not missed a single class so far — your attendance is currently a perfect 100%.'
      });
    } else if (d.eligible && d.canMiss > 0 && d.canMiss <= 2) {
      items.push({
        icon: ICON_WARN,
        text: 'Your safety margin is thin — only ' + d.canMiss + ' class' + (d.canMiss === 1 ? '' : 'es') + ' of buffer remains before you fall below the requirement.'
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

    attendedInput.value = '';
    totalInput.value    = '';
    requiredInput.value = '75';

    clearErrors();
    hideResults();

    /* Move related tools back inside tool-wrap */
    var toolWrap    = document.querySelector('.tool-wrap');
    var relatedWrap = document.getElementById('attendance-related-wrap');
    if (toolWrap && relatedWrap && !toolWrap.contains(relatedWrap)) {
      toolWrap.appendChild(relatedWrap);
    }

    attendedInput.focus();
  }

  /* ============================================
     EVENT WIRING
  ============================================ */

  for (var i = 0; i < allNumberInputs.length; i++) {
    (function (input) {
      input.addEventListener('input', function () {
        input.classList.remove('attendance-input--error');
        saveState();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          calculate();
        }
      });
      /* Prevent wheel scroll from changing number input values */
      input.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    })(allNumberInputs[i]);
  }

  calcBtn.addEventListener('click', calculate);
  resetBtn.addEventListener('click', resetAll);

  /* ============================================
     INITIALISATION
  ============================================ */

  (function init() {
    restoreState();

    if (window.P50ToolBase) {
      P50ToolBase.renderRelatedTools(
        'attendance-related-grid',
        'attendance-calculator',
        'student-tools'
      );
    }
  })();

})();
