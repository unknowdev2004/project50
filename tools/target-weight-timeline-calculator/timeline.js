/* ============================================
   TIMELINE.JS — Project 50
   Target Weight Timeline Calculator

   Formulas:
   BMR (male)   = 10×W(kg) + 6.25×H(cm) − 5×A + 5
   BMR (female) = 10×W(kg) + 6.25×H(cm) − 5×A − 161
   TDEE = BMR × activity multiplier

   Activity multipliers:
     Sedentary         = 1.20
     Lightly Active    = 1.375
     Moderately Active = 1.55
     Very Active       = 1.725
     Athlete           = 1.90

   Weight change constant: 7700 kcal = 1 kg

   Fat Loss scenarios:
     Lose Fat         → TDEE − 500 → 1.95 kg/month, 0.45 kg/week
     Aggressive       → TDEE − 750 → 2.92 kg/month, 0.67 kg/week

   Weight Gain scenarios:
     Lean Gain        → TDEE + 300 → 1.17 kg/month, 0.27 kg/week
     Weight Gain      → TDEE + 500 → 1.95 kg/month, 0.45 kg/week

   Timeline = weightDiff ÷ monthlyRate
   Calorie floors:
     Male:   1500 kcal
     Female: 1200 kcal

   Human-readable duration:
     < 4 weeks  → "N weeks"
     ≥ 1 month  → "N months" or "N years M months"
============================================ */

(function () {
  'use strict';

  /* ---- Storage key ---- */
  var STORAGE_KEY = 'p50_target_weight_timeline';

  /* ---- Autosave timer ---- */
  var _saveTimer = null;

  /* ---- DOM refs — Inputs ---- */
  var genderEl      = document.getElementById('twtl-gender');
  var ageEl         = document.getElementById('twtl-age');
  var heightUnitEl  = document.getElementById('twtl-height-unit');
  var heightCmEl    = document.getElementById('twtl-height-cm');
  var heightFtEl    = document.getElementById('twtl-height-ft');
  var heightInEl    = document.getElementById('twtl-height-in');
  var weightUnitEl  = document.getElementById('twtl-weight-unit');
  var currentWtEl   = document.getElementById('twtl-current-weight');
  var targetWtEl    = document.getElementById('twtl-target-weight');
  var activityEl    = document.getElementById('twtl-activity');

  /* ---- DOM refs — Unit panels ---- */
  var heightMetricPanel   = document.getElementById('twtl-height-metric');
  var heightImperialPanel = document.getElementById('twtl-height-imperial');

  /* ---- DOM refs — Advanced Options ---- */
  var customDeficitEl = document.getElementById('twtl-custom-deficit');

  /* ---- DOM refs — UI ---- */
  var calcBtn   = document.getElementById('twtl-calc-btn');
  var resetBtn  = document.getElementById('twtl-reset-btn');
  var validEl   = document.getElementById('twtl-validation');
  var resultsEl = document.getElementById('twtl-results');

  /* ---- DOM refs — Result output containers ---- */
  var heroSummaryEl      = document.getElementById('twtl-hero-summary');
  var heroScenarioEl     = document.getElementById('twtl-hero-scenarios');
  var floorWarningEl     = document.getElementById('twtl-floor-warning');
  var milestonesBodyEl   = document.getElementById('twtl-milestones-body');
  var weeklyBodyEl       = document.getElementById('twtl-weekly-body');
  var calorieBodyEl      = document.getElementById('twtl-calorie-body');
  var strategyBodyEl     = document.getElementById('twtl-strategy-body');
  var bmrStatEl          = document.getElementById('twtl-bmr-val');
  var tdeeStatEl         = document.getElementById('twtl-tdee-val');
  var multiplierStatEl   = document.getElementById('twtl-multiplier-val');
  var formulaNoteEl      = document.getElementById('twtl-formula-note');
  var quickSummaryEl     = document.getElementById('twtl-quick-summary');

  /* ============================================
     CONSTANTS
  ============================================ */
  var KCAL_PER_KG = 7700;

  var SCENARIOS_FAT_LOSS = [
    {
      key:       'lose',
      name:      'Lose Fat',
      adjust:    -500,
      monthlyKg: 1.95,
      weeklyKg:  0.45,
      highlight: true,
      label:     'Recommended'
    },
    {
      key:       'aggressive',
      name:      'Aggressive',
      adjust:    -750,
      monthlyKg: 2.92,
      weeklyKg:  0.67,
      highlight: false,
      label:     ''
    }
  ];

  var SCENARIOS_WEIGHT_GAIN = [
    {
      key:       'lean',
      name:      'Lean Gain',
      adjust:    300,
      monthlyKg: 1.17,
      weeklyKg:  0.27,
      highlight: true,
      label:     'Recommended'
    },
    {
      key:       'gain',
      name:      'Weight Gain',
      adjust:    500,
      monthlyKg: 1.95,
      weeklyKg:  0.45,
      highlight: false,
      label:     ''
    }
  ];

  /* ============================================
     PREVENT WHEEL SCROLL ON NUMBER INPUTS
  ============================================ */
  var numberInputs = document.querySelectorAll(
    '#twtl-age, #twtl-height-cm, #twtl-height-ft, #twtl-height-in, #twtl-current-weight, #twtl-target-weight, #twtl-custom-deficit'
  );
  numberInputs.forEach(function (el) {
    el.addEventListener('wheel', function (e) {
      el.blur();
      e.preventDefault();
    }, { passive: false });
  });

  /* ============================================
     HEIGHT UNIT SWITCHER
  ============================================ */
  heightUnitEl.addEventListener('change', function () {
    var prevUnit = heightUnitEl.dataset.prevUnit || 'cm';
    var newUnit  = heightUnitEl.value;
    if (prevUnit !== newUnit) convertHeightDisplay(prevUnit, newUnit);
    applyHeightUnit(newUnit);
    heightUnitEl.dataset.prevUnit = newUnit;
    scheduleSave();
  });

  function applyHeightUnit(unit) {
    var label = document.getElementById('twtl-height-label');
    if (unit === 'cm') {
      heightMetricPanel.hidden = false;
      heightImperialPanel.hidden = true;
      label.textContent = 'Height (cm)';
    } else {
      heightMetricPanel.hidden = true;
      heightImperialPanel.hidden = false;
      label.textContent = 'Height (ft / in)';
    }
  }

  function convertHeightDisplay(fromUnit, toUnit) {
    if (fromUnit === 'cm' && toUnit === 'imperial') {
      var cm = parseFloat(heightCmEl.value);
      if (!isNaN(cm) && cm > 0) {
        var totalIn = cm / 2.54;
        var ft = Math.floor(totalIn / 12);
        var inch = Math.round(totalIn % 12);
        if (inch === 12) { ft += 1; inch = 0; }
        heightFtEl.value = ft;
        heightInEl.value = inch;
      }
    } else if (fromUnit === 'imperial' && toUnit === 'cm') {
      var ft2 = parseFloat(heightFtEl.value) || 0;
      var in2 = parseFloat(heightInEl.value) || 0;
      var totalInches = (ft2 * 12) + in2;
      if (totalInches > 0) {
        heightCmEl.value = Math.round(totalInches * 2.54);
      }
    }
  }

  /* ============================================
     WEIGHT UNIT SWITCHER
  ============================================ */
  weightUnitEl.addEventListener('change', function () {
    var prevUnit = weightUnitEl.dataset.prevUnit || 'kg';
    var newUnit  = weightUnitEl.value;

    if (prevUnit !== newUnit) {
      convertWeightField(currentWtEl, prevUnit, newUnit);
      convertWeightField(targetWtEl, prevUnit, newUnit);
    }
    applyWeightUnit(newUnit);
    weightUnitEl.dataset.prevUnit = newUnit;
    scheduleSave();
  });

  function convertWeightField(el, fromUnit, toUnit) {
    var val = parseFloat(el.value);
    if (isNaN(val) || val <= 0) return;
    if (fromUnit === 'kg' && toUnit === 'lbs') {
      el.value = Math.round(val * 2.20462 * 10) / 10;
    } else if (fromUnit === 'lbs' && toUnit === 'kg') {
      el.value = Math.round(val / 2.20462 * 10) / 10;
    }
  }

  function applyWeightUnit(unit) {
    var curLabel = document.getElementById('twtl-current-weight-label');
    var tgtLabel = document.getElementById('twtl-target-weight-label');
    var curHint  = document.getElementById('twtl-current-weight-hint');
    var tgtHint  = document.getElementById('twtl-target-weight-hint');
    if (unit === 'kg') {
      curLabel.textContent = 'Current Weight (kg)';
      tgtLabel.textContent = 'Target Weight (kg)';
      curHint.textContent  = '20–300 kg';
      tgtHint.textContent  = '20–300 kg';
      currentWtEl.min = 20; currentWtEl.max = 300;
      targetWtEl.min  = 20; targetWtEl.max  = 300;
    } else {
      curLabel.textContent = 'Current Weight (lbs)';
      tgtLabel.textContent = 'Target Weight (lbs)';
      curHint.textContent  = '44–661 lbs';
      tgtHint.textContent  = '44–661 lbs';
      currentWtEl.min = 44; currentWtEl.max = 661;
      targetWtEl.min  = 44; targetWtEl.max  = 661;
    }
  }

  /* ============================================
     UNIT CONVERSION HELPERS
  ============================================ */
  function getHeightInCm() {
    if (heightUnitEl.value === 'cm') return parseFloat(heightCmEl.value);
    var ft   = parseFloat(heightFtEl.value) || 0;
    var inch = parseFloat(heightInEl.value) || 0;
    return ((ft * 12) + inch) * 2.54;
  }

  function getWeightInKg(el) {
    var val = parseFloat(el.value);
    if (isNaN(val)) return NaN;
    if (weightUnitEl.value === 'kg') return val;
    return val / 2.20462;
  }

  /* ============================================
     VALIDATION
  ============================================ */
  function validate() {
    var age        = parseFloat(ageEl.value);
    var heightCm   = getHeightInCm();
    var currentKg  = getWeightInKg(currentWtEl);
    var targetKg   = getWeightInKg(targetWtEl);

    if (isNaN(age) || age < 15 || age > 100) {
      return 'Please enter a valid age between 15 and 100.';
    }
    if (isNaN(heightCm) || heightCm < 100 || heightCm > 250) {
      return 'Please enter a valid height.';
    }
    if (isNaN(currentKg) || currentKg < 20 || currentKg > 300) {
      return 'Please enter a valid current weight (20–300 kg).';
    }
    if (isNaN(targetKg) || targetKg < 20 || targetKg > 300) {
      return 'Please enter a valid target weight (20–300 kg).';
    }
    if (Math.abs(currentKg - targetKg) < 0.01) {
      return 'Target weight must be different from current weight.';
    }
    return null;
  }

  function showValidation(msg) {
    if (msg) {
      validEl.textContent = msg;
      validEl.hidden = false;
    } else {
      validEl.hidden = true;
    }
  }

  /* ============================================
     CALCULATION ENGINE
  ============================================ */
  function calculateBMR(gender, weightKg, heightCm, age) {
    var base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    return gender === 'male' ? base + 5 : base - 161;
  }

  function getCalorieFloor(gender) {
    return gender === 'male' ? 1500 : 1200;
  }

  /* Returns months as decimal. Uses actual TDEE-based rate (not P50 fixed rates).
     Fixed monthly rates in SCENARIOS are Project50 "standard" display labels only.
     Actual calculation uses deficit/surplus ÷ 7700 for accuracy. */
  function calcTimelineMonths(weightDiffKg, tdee, adjust, floor, floorEligible) {
    var dailyCalories = tdee + adjust;
    var floorTriggered = false;
    if (floorEligible && dailyCalories < floor) {
      dailyCalories = floor;
      floorTriggered = true;
    }
    var actualAdjust = dailyCalories - tdee; /* negative for deficit */
    var monthlyRate  = Math.abs(actualAdjust * 30 / KCAL_PER_KG);
    if (monthlyRate < 0.001) return { months: Infinity, monthlyRateKg: 0, weeklyRateKg: 0, floorTriggered: floorTriggered, calories: Math.round(dailyCalories) };
    var months      = weightDiffKg / monthlyRate;
    var weeklyRate  = Math.abs(actualAdjust * 7 / KCAL_PER_KG);
    return {
      months:       months,
      monthlyRateKg: monthlyRate,
      weeklyRateKg:  weeklyRate,
      floorTriggered: floorTriggered,
      calories:      Math.round(dailyCalories)
    };
  }

  /* ============================================
     HUMAN-READABLE DURATION
  ============================================ */
  function formatDuration(months) {
    if (!isFinite(months) || months <= 0) return 'N/A';

    /* Under ~1 month → show in weeks */
    if (months < 0.9) {
      var weeks = Math.round(months * 4.33);
      if (weeks < 1) weeks = 1;
      return weeks === 1 ? '1 week' : weeks + ' weeks';
    }

    if (months < 12) {
      var roundedMonths = Math.round(months * 10) / 10;
      var isWhole = Math.abs(roundedMonths - Math.round(roundedMonths)) < 0.001;
      var monthsLabel = isWhole ? Math.round(roundedMonths).toString() : roundedMonths.toFixed(1);
      return monthsLabel + (isWhole && Math.round(roundedMonths) === 1 ? ' month' : ' months');
    }

    var totalMonthsRounded = Math.round(months * 10) / 10;
    var years     = Math.floor(totalMonthsRounded / 12);
    var remMonths = Math.round((totalMonthsRounded - (years * 12)) * 10) / 10;
    var remIsWhole = Math.abs(remMonths - Math.round(remMonths)) < 0.001;
    var remLabel   = remIsWhole ? Math.round(remMonths).toString() : remMonths.toFixed(1);
    var yearStr    = years === 1 ? '1 year' : years + ' years';
    if (remMonths < 0.05) return yearStr;
    return yearStr + ' ' + remLabel + ' ' + ((remIsWhole && Math.round(remMonths) === 1) ? 'month' : 'months');
  }

  /* ============================================
     MILESTONES
  ============================================ */
  function generateMilestones(currentKg, targetKg, monthlyRate, direction) {
    var milestones = [];
    var weightDiff = Math.abs(targetKg - currentKg);
    var totalMonths = weightDiff / monthlyRate;

    /* Build one milestone per month */
    var maxFull = Math.ceil(totalMonths);
    var showAll = maxFull <= 8;
    var indices = [];

    if (showAll) {
      for (var i = 1; i <= maxFull; i++) indices.push(i);
    } else {
      /* First 6, then final */
      for (var j = 1; j <= 6; j++) indices.push(j);
      indices.push('final');
    }

    indices.forEach(function (idx) {
      var month, weight;
      if (idx === 'final') {
        month  = totalMonths;
        weight = targetKg;
      } else {
        month  = idx;
        var change = monthlyRate * idx;
        if (change >= weightDiff) {
          month  = totalMonths;
          weight = targetKg;
        } else {
          weight = direction === 'loss' ? currentKg - change : currentKg + change;
        }
      }
      milestones.push({ month: month, weight: weight, isGoal: Math.abs(weight - targetKg) < 0.05 });
    });

    return milestones;
  }

  /* ============================================
     CALCULATE — main handler
  ============================================ */
  calcBtn.addEventListener('click', function () {
    var err = validate();
    if (err) {
      showValidation(err);
      resultsEl.hidden = true;
      return;
    }
    showValidation(null);

    var gender      = genderEl.value;
    var age         = parseFloat(ageEl.value);
    var heightCm    = getHeightInCm();
    var currentKg   = getWeightInKg(currentWtEl);
    var targetKg    = getWeightInKg(targetWtEl);
    var activityMult = parseFloat(activityEl.value);
    var activityName = activityEl.options[activityEl.selectedIndex].text.split(' — ')[0];

    var bmr   = calculateBMR(gender, currentKg, heightCm, age);
    var tdee  = bmr * activityMult;
    var floor = getCalorieFloor(gender);

    var direction   = targetKg < currentKg ? 'loss' : 'gain';
    var weightDiff  = Math.abs(targetKg - currentKg);
    var weightUnit  = weightUnitEl.value;

    /* --- Custom deficit (fat-loss only) --- */
    var rawCustom     = parseFloat(customDeficitEl.value);
    var hasCustom     = !isNaN(rawCustom) && customDeficitEl.value.trim() !== '';
    /* Validate range: reject outside 250–1000 */
    if (hasCustom && (rawCustom < 250 || rawCustom > 1000)) {
      showValidation('Custom deficit must be between 250 and 1,000 kcal.');
      resultsEl.hidden = true;
      return;
    }
    var customDeficit = hasCustom ? rawCustom : null; /* null = use defaults */

    /* Build scenarios, applying custom deficit when set */
    var baseScenarios = direction === 'loss' ? SCENARIOS_FAT_LOSS : SCENARIOS_WEIGHT_GAIN;
    var scenarios;
    if (direction === 'loss' && customDeficit !== null) {
      var aggressiveDeficit = customDeficit * 1.5;
      scenarios = [
        {
          key:       'lose',
          name:      'Lose Fat',
          adjust:    -customDeficit,
          highlight: true,
          label:     'Recommended'
        },
        {
          key:       'aggressive',
          name:      'Aggressive',
          adjust:    -aggressiveDeficit,
          highlight: false,
          label:     ''
        }
      ];
    } else {
      scenarios = baseScenarios;
    }

    /* Compute timelines for each scenario */
    var computed = scenarios.map(function (sc) {
      var result = calcTimelineMonths(weightDiff, tdee, sc.adjust, floor, direction === 'loss');
      return {
        key:           sc.key,
        name:          sc.name,
        highlight:     sc.highlight,
        label:         sc.label,
        adjust:        sc.adjust,
        months:        result.months,
        monthlyRateKg: result.monthlyRateKg,
        weeklyRateKg:  result.weeklyRateKg,
        floorTriggered: result.floorTriggered,
        calories:      result.calories,
        duration:      formatDuration(result.months)
      };
    });

    /* Two separate signals — previously conflated into one boolean which caused:
       Bug #1: warning shown when Aggressive alone hits floor (def=700 male → Agg=1630 > 1500, fine)
       Bug #2: ALL results suppressed when only Aggressive hits floor, Lose Fat still valid.

       anyFloorTriggered → controls floor warning visibility only.
       allInvalid        → true only when Lose Fat (primary) itself is below floor,
                           meaning there is genuinely no usable fat-loss strategy. */
    var anyFloorTriggered = direction === 'loss' && computed.some(function (sc) {
      return sc.floorTriggered;
    });
    var allInvalid = direction === 'loss' && computed.every(function (sc) {
      return sc.floorTriggered;
    });


    var primaryScenario = computed[0]; /* recommended (Lose Fat) */

    renderHeroSummary(currentKg, targetKg, weightDiff, direction, weightUnit, computed, allInvalid);
    renderMilestones(currentKg, targetKg, primaryScenario, direction, weightUnit, allInvalid);
    renderWeeklyProgress(primaryScenario, weightUnit, allInvalid);
    renderCalorieTargets(computed, tdee, direction, floor, allInvalid);
    renderStrategyComparison(computed, weightUnit, allInvalid);
    renderBmrTdee(bmr, activityMult, activityName, tdee, gender, age, heightCm, currentKg);
    renderQuickSummary(currentKg, targetKg, weightDiff, direction, weightUnit, primaryScenario, allInvalid);

    if (anyFloorTriggered) {
      floorWarningEl.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>' +
        (allInvalid
          ? 'Weight-loss target unavailable at safe calorie levels. Your maintenance calories are at or below the safety floor (1,500 kcal for men / 1,200 kcal for women). Consult a healthcare provider.'
          : 'Some strategies exceed safe calorie limits and have been adjusted to the minimum safe intake (1,500 kcal for men / 1,200 kcal for women).');
      floorWarningEl.hidden = false;
    } else {
      floorWarningEl.hidden = true;
    }

    resultsEl.hidden = false;
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    scheduleSave();
  });

  /* ============================================
     RENDER HELPERS
  ============================================ */

  function fmtWeight(kg, unit) {
    if (unit === 'lbs') return (Math.round(kg * 2.20462 * 10) / 10).toFixed(1) + ' lbs';
    return (Math.round(kg * 10) / 10).toFixed(1) + ' kg';
  }

  function fmtWeightShort(kg, unit) {
    if (unit === 'lbs') return (Math.round(kg * 2.20462 * 10) / 10).toFixed(1);
    return (Math.round(kg * 10) / 10).toFixed(1);
  }

  /* ---- Card 1: Hero Summary ---- */
  function renderHeroSummary(currentKg, targetKg, weightDiff, direction, weightUnit, computed, floorAbove) {
    /* Weight stats */
    var statsHtml =
      '<div class="twtl-hero-stats">' +
        '<div class="twtl-hero-stat">' +
          '<div class="twtl-hero-stat-val">' + fmtWeight(currentKg, weightUnit) + '</div>' +
          '<div class="twtl-hero-stat-lbl">Current Weight</div>' +
        '</div>' +
        '<div class="twtl-hero-stat">' +
          '<div class="twtl-hero-stat-val">' + fmtWeight(targetKg, weightUnit) + '</div>' +
          '<div class="twtl-hero-stat-lbl">Target Weight</div>' +
        '</div>' +
        '<div class="twtl-hero-stat">' +
          '<div class="twtl-hero-stat-val twtl-hero-stat-val--diff">' + fmtWeight(weightDiff, weightUnit) + '</div>' +
          '<div class="twtl-hero-stat-lbl">' + (direction === 'loss' ? 'To Lose' : 'To Gain') + '</div>' +
        '</div>' +
      '</div>';
    heroSummaryEl.innerHTML = statsHtml;

    /* Scenario timelines */
    if (floorAbove) {
      heroScenarioEl.innerHTML =
        '<div class="twtl-unavailable">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>' +
          'Weight-loss target unavailable at safe calorie levels.' +
        '</div>';
      return;
    }

    var html = '';
    computed.forEach(function (sc) {
      html += '<div class="twtl-scenario-item' + (sc.highlight ? ' twtl-scenario-item--highlight' : '') + '">' +
                '<div class="twtl-scenario-name">' + sc.name +
                  (sc.highlight ? '<span class="twtl-scenario-badge">' + sc.label + '</span>' : '') +
                  (sc.floorTriggered ? '<span class="twtl-calorie-floor-note"> (floor)</span>' : '') +
                '</div>' +
                '<div class="twtl-scenario-duration">' + sc.duration + '</div>' +
              '</div>';
    });
    heroScenarioEl.innerHTML = html;
  }

  /* ---- Card 2: Monthly Milestones ---- */
  function renderMilestones(currentKg, targetKg, primaryScenario, direction, weightUnit, floorAbove) {
    if (floorAbove) {
      milestonesBodyEl.innerHTML = '<tr><td colspan="3" class="twtl-unavail-cell">Weight-loss target unavailable at safe calorie levels.</td></tr>';
      return;
    }

    var milestones = generateMilestones(currentKg, targetKg, primaryScenario.monthlyRateKg, direction);
    var totalMonths = Math.abs(targetKg - currentKg) / primaryScenario.monthlyRateKg;
    var html = '';
    var prevIdx = 0;

    milestones.forEach(function (m, i) {
      /* Show ellipsis between month 6 and final when skipping */
      if (i === milestones.length - 1 && milestones.length > 7 && !m.isGoal) {
        html += '<tr class="twtl-milestone-ellipsis"><td colspan="3">…</td></tr>';
      } else if (i > 0 && milestones[i].month - milestones[i-1].month > 1.5 && !milestones[i].isGoal) {
        html += '<tr class="twtl-milestone-ellipsis"><td colspan="3">…</td></tr>';
      }

      var monthLabel = m.isGoal ? formatDuration(m.month) : (Math.round(m.month) + (Math.round(m.month) === 1 ? ' month' : ' months'));
      var change = Math.abs(m.weight - currentKg);
      html += '<tr' + (m.isGoal ? ' class="twtl-milestone-goal"' : '') + '>' +
                '<td>' + monthLabel + '</td>' +
                '<td>' + fmtWeight(m.weight, weightUnit) + (m.isGoal ? ' 🎯' : '') + '</td>' +
                '<td>' + (direction === 'loss' ? '−' : '+') + fmtWeight(change, weightUnit) + '</td>' +
              '</tr>';
    });
    milestonesBodyEl.innerHTML = html;
  }

  /* ---- Card 3: Weekly Progress ---- */
  function renderWeeklyProgress(primaryScenario, weightUnit, floorAbove) {
    if (floorAbove) {
      weeklyBodyEl.innerHTML = '<tr><td colspan="2" class="twtl-unavail-cell">Weight-loss target unavailable at safe calorie levels.</td></tr>';
      return;
    }
    var weeklyKg   = primaryScenario.weeklyRateKg;
    var weeklyDisp = weightUnit === 'lbs' ? (weeklyKg * 2.20462).toFixed(2) + ' lbs/week' : weeklyKg.toFixed(2) + ' kg/week';
    var totalWeeks = Math.round(primaryScenario.months * 4.33);

if (totalWeeks < 1) totalWeeks = 1;
    weeklyBodyEl.innerHTML =
      '<tr>' +
        '<td>Rate (' + primaryScenario.name + ')</td>' +
        '<td class="twtl-td-right twtl-td-highlight">' + weeklyDisp + '</td>' +
      '</tr>' +
      '<tr>' +
        '<td>Weeks to goal</td>' +
        '<td class="twtl-td-right">' + totalWeeks + (totalWeeks === 1 ? ' week' : ' weeks') + '</td>' +
      '</tr>' +
      '<tr>' +
        '<td>Daily calorie target</td>' +
        '<td class="twtl-td-right">' + primaryScenario.calories.toLocaleString() + ' kcal</td>' +
      '</tr>';
  }

  /* ---- Card 4: Calorie Targets ---- */
  function renderCalorieTargets(computed, tdee, direction, floor, floorAbove) {
    var html = '';
    if (floorAbove) {
      html = '<div class="twtl-calorie-row">' +
               '<div class="twtl-calorie-name">Maintenance (TDEE)</div>' +
               '<div class="twtl-calorie-val">' + Math.round(tdee).toLocaleString() + '<span class="twtl-calorie-unit"> kcal</span></div>' +
             '</div>' +
             '<div class="twtl-calorie-row">' +
               '<div class="twtl-calorie-name">Safe Minimum Floor</div>' +
               '<div class="twtl-calorie-val">' + floor.toLocaleString() + '<span class="twtl-calorie-unit"> kcal</span></div>' +
             '</div>';
    } else {
      html += '<div class="twtl-calorie-row twtl-calorie-row--maint">' +
                '<div class="twtl-calorie-name">Maintenance (TDEE)</div>' +
                '<div class="twtl-calorie-val">' + Math.round(tdee).toLocaleString() + '<span class="twtl-calorie-unit"> kcal</span></div>' +
              '</div>';
      computed.forEach(function (sc) {
        html += '<div class="twtl-calorie-row' + (sc.highlight ? ' twtl-calorie-row--highlight' : '') + '">' +
                  '<div class="twtl-calorie-name">' + sc.name +
                    (sc.highlight ? '<span class="twtl-calorie-badge">Recommended</span>' : '') +
                  '</div>' +
                  '<div class="twtl-calorie-val">' + sc.calories.toLocaleString() +
                    '<span class="twtl-calorie-unit"> kcal</span>' +
                    (sc.floorTriggered ? '<span class="twtl-calorie-floor-note"> (floor)</span>' : '') +
                  '</div>' +
                '</div>';
      });
    }
    calorieBodyEl.innerHTML = html;
  }

  /* ---- Card 5: Strategy Comparison ---- */
  function renderStrategyComparison(computed, weightUnit, floorAbove) {
    if (floorAbove) {
      strategyBodyEl.innerHTML = '<tr><td colspan="4" class="twtl-unavail-cell">Weight-loss target unavailable at safe calorie levels.</td></tr>';
      return;
    }
    var html = '';
    computed.forEach(function (sc) {
      var monthly = weightUnit === 'lbs'
        ? (sc.monthlyRateKg * 2.20462).toFixed(2) + ' lbs'
        : sc.monthlyRateKg.toFixed(2) + ' kg';
      var weekly = weightUnit === 'lbs'
        ? (sc.weeklyRateKg * 2.20462).toFixed(2) + ' lbs'
        : sc.weeklyRateKg.toFixed(2) + ' kg';
      html += '<tr' + (sc.highlight ? ' class="twtl-strategy-row--highlight"' : '') + '>' +
                '<td>' + sc.name + (sc.floorTriggered ? '<span class="twtl-calorie-floor-note"> (floor)</span>' : '') + '</td>' +
                '<td class="twtl-td-right">' + sc.duration + '</td>' +
                '<td class="twtl-td-right">' + monthly + '/mo</td>' +
                '<td class="twtl-td-right">' + weekly + '/wk</td>' +
              '</tr>';
    });
    strategyBodyEl.innerHTML = html;
  }

  /* ---- Card 6: BMR & TDEE ---- */
  function renderBmrTdee(bmr, mult, activityName, tdee, gender, age, heightCm, weightKg) {
    bmrStatEl.textContent        = Math.round(bmr).toLocaleString();
    multiplierStatEl.textContent = '×' + mult;
    tdeeStatEl.textContent       = Math.round(tdee).toLocaleString();

    var sexLabel = gender === 'male' ? 'Male' : 'Female';
    var constant = gender === 'male' ? '+ 5' : '− 161';
    formulaNoteEl.innerHTML =
      'Mifflin-St Jeor (' + sexLabel + '): ' +
      '(10 × ' + Math.round(weightKg) + 'kg) + (6.25 × ' + Math.round(heightCm) + 'cm) − (5 × ' + age + ') ' + constant +
      ' = ' + Math.round(bmr) + ' kcal BMR<br>' +
      'TDEE = ' + Math.round(bmr) + ' × ' + mult + ' (' + activityName + ') = ' + Math.round(tdee) + ' kcal';
  }

  /* ---- Card 7: Quick Summary ---- */
  function renderQuickSummary(currentKg, targetKg, weightDiff, direction, weightUnit, primaryScenario, floorAbove) {
    if (floorAbove) {
      quickSummaryEl.innerHTML =
        '<p class="twtl-summary-line">Your current maintenance calories are too low for a safe calorie deficit. Consult a healthcare provider.</p>';
      return;
    }
    var action   = direction === 'loss' ? 'lose' : 'gain';
    var adjLabel = direction === 'loss' ? 'deficit' : 'surplus';
    var adjSign  = direction === 'loss' ? '−' : '+';
    var adjAmt   = Math.abs(primaryScenario.adjust);
    quickSummaryEl.innerHTML =
      '<p class="twtl-summary-line">You need to ' + action + ' <strong>' + fmtWeight(weightDiff, weightUnit) + '</strong>.</p>' +
      '<p class="twtl-summary-line">At a ' + adjAmt + ' kcal/day ' + adjLabel + ' (' + primaryScenario.calories.toLocaleString() + ' kcal/day), you can reach your goal in approximately <strong>' + primaryScenario.duration + '</strong>.</p>' +
      '<p class="twtl-summary-line">That is roughly <strong>' + primaryScenario.weeklyRateKg.toFixed(2) + ' kg/week</strong> at the recommended pace.</p>';
  }

  /* ============================================
     RESET
  ============================================ */
  resetBtn.addEventListener('click', function () {
    genderEl.value = 'male';
    ageEl.value = '';
    heightUnitEl.value = 'cm';
    heightUnitEl.dataset.prevUnit = 'cm';
    heightCmEl.value = '';
    heightFtEl.value = '';
    heightInEl.value = '';
    applyHeightUnit('cm');
    weightUnitEl.value = 'kg';
    weightUnitEl.dataset.prevUnit = 'kg';
    currentWtEl.value = '';
    targetWtEl.value  = '';
    applyWeightUnit('kg');
    activityEl.value = '1.55';
    customDeficitEl.value = '';

    showValidation(null);
    resultsEl.hidden = true;

    if (window.P50Storage) P50Storage.remove(STORAGE_KEY);
  });

  /* ============================================
     AUTOSAVE — 300ms debounce
  ============================================ */
  function scheduleSave() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(saveState, 300);
  }

  function saveState() {
    if (!window.P50Storage) return;
    P50Storage.set(STORAGE_KEY, {
      gender:        genderEl.value,
      age:           ageEl.value,
      heightUnit:    heightUnitEl.value,
      heightCm:      heightCmEl.value,
      heightFt:      heightFtEl.value,
      heightIn:      heightInEl.value,
      weightUnit:    weightUnitEl.value,
      currentWeight: currentWtEl.value,
      targetWeight:  targetWtEl.value,
      activity:      activityEl.value,
      customDeficit: customDeficitEl.value
    });
  }

  /* Wire autosave */
  document.querySelectorAll(
    '#twtl-age, #twtl-height-cm, #twtl-height-ft, #twtl-height-in, #twtl-current-weight, #twtl-target-weight, #twtl-custom-deficit'
  ).forEach(function (el) {
    el.addEventListener('input', scheduleSave);
  });
  document.querySelectorAll(
    '#twtl-gender, #twtl-activity'
  ).forEach(function (el) {
    el.addEventListener('change', scheduleSave);
  });

  /* ============================================
     RESTORE STATE ON LOAD
  ============================================ */
  function restoreState() {
    if (!window.P50Storage) return;
    var saved = P50Storage.get(STORAGE_KEY, null);
    if (!saved) return;

    if (saved.gender)    genderEl.value   = saved.gender;
    if (saved.age)       ageEl.value      = saved.age;

    if (saved.heightUnit) {
      heightUnitEl.value = saved.heightUnit;
      heightUnitEl.dataset.prevUnit = saved.heightUnit;
      applyHeightUnit(saved.heightUnit);
    }
    if (saved.heightCm) heightCmEl.value = saved.heightCm;
    if (saved.heightFt) heightFtEl.value = saved.heightFt;
    if (saved.heightIn) heightInEl.value = saved.heightIn;

    if (saved.weightUnit) {
      weightUnitEl.value = saved.weightUnit;
      weightUnitEl.dataset.prevUnit = saved.weightUnit;
      applyWeightUnit(saved.weightUnit);
    }
    if (saved.currentWeight) currentWtEl.value    = saved.currentWeight;
    if (saved.targetWeight)  targetWtEl.value     = saved.targetWeight;
    if (saved.activity)      activityEl.value     = saved.activity;
    if (saved.customDeficit) customDeficitEl.value = saved.customDeficit;
  }

  /* ============================================
     RELATED TOOLS
  ============================================ */
  function renderRelatedTools() {
    var relatedGrid = document.getElementById('twtl-related-grid');
    if (!relatedGrid) return;

    var PRIORITY_IDS = [
      'tdee-calculator',
      'daily-calorie-planner',
      'macro-calculator',
      'protein-calculator'
    ];

    fetch('/data/tools.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var all = (data.allTools || []).filter(function (t) {
          return t.category === 'health-fitness' && t.id !== 'target-weight-timeline-calculator';
        });

        /* Prioritise in spec order */
        var related = [];
        PRIORITY_IDS.forEach(function (id) {
          var match = all.filter(function (t) { return t.id === id; })[0];
          if (match && related.length < 4) related.push(match);
        });
        /* Fill remaining from all */
        all.forEach(function (t) {
          if (related.length < 4 && !PRIORITY_IDS.includes(t.id)) related.push(t);
        });

        if (!related.length) related = getRelatedFallback();
        buildRelatedHTML(relatedGrid, related);
      })
      .catch(function () {
        buildRelatedHTML(relatedGrid, getRelatedFallback());
      });
  }

  function getRelatedFallback() {
    return [
      { id: 'tdee-calculator',       name: 'TDEE Calculator',       description: 'Calculate your Total Daily Energy Expenditure and personalised calorie targets.',         link: '/tools/tdee-calculator/',        icon: 'trending-up' },
      { id: 'daily-calorie-planner', name: 'Daily Calorie Planner', description: 'Calculate your BMR, TDEE and daily calorie target for weight loss, maintenance or gain.', link: '/tools/daily-calorie-planner/',  icon: 'salad' },
      { id: 'macro-calculator',      name: 'Macro Calculator',      description: 'Calculate your daily protein, fat and carbohydrate targets.',                             link: '/tools/macro-calculator/',       icon: 'beef' },
      { id: 'protein-calculator',    name: 'Protein Calculator',    description: 'Calculate your daily protein intake for fat loss, maintenance or muscle gain.',           link: '/tools/protein-calculator/',     icon: 'beef' }
    ];
  }

  function buildRelatedHTML(grid, tools) {
    var html = '';
    tools.forEach(function (t) {
      if (window.P50Renderers && P50Renderers.relatedToolCard) {
        html += P50Renderers.relatedToolCard(t);
      } else if (window.P50Icons && window.P50IconMap) {
        var key = P50IconMap.forTool(t.id) || (t.icon || 'wrench');
        var iconHtml = P50Icons.svg(key, 20);
        html += '<a href="' + t.link + '" class="tool-related-card">' +
                  '<span class="tool-related-icon" aria-hidden="true">' + iconHtml + '</span>' +
                  '<div><div class="tool-related-name">' + t.name + '</div>' +
                  '<div class="tool-related-desc">' + t.description + '</div></div></a>';
      } else {
        html += '<a href="' + t.link + '" class="tool-related-card">' +
                  '<div><div class="tool-related-name">' + t.name + '</div>' +
                  '<div class="tool-related-desc">' + t.description + '</div></div></a>';
      }
    });
    grid.innerHTML = html;
  }

  /* ============================================
     INIT
  ============================================ */
  document.addEventListener('DOMContentLoaded', function () {
    heightUnitEl.dataset.prevUnit = heightUnitEl.value;
    weightUnitEl.dataset.prevUnit = weightUnitEl.value;
    restoreState();
    renderRelatedTools();
  });

})();
