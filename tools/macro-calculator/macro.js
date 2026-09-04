/* ============================================
   MACRO.JS — Project 50
   Macro Calculator

   Calculation method: Mifflin-St Jeor Equation
   BMR (male)   = 10×W(kg) + 6.25×H(cm) − 5×A + 5
   BMR (female) = 10×W(kg) + 6.25×H(cm) − 5×A − 161

   TDEE = BMR × activity multiplier

   Goal calories:
     Lose Fat     → TDEE − 500
     Maintain     → TDEE
     Build Muscle → TDEE + 300

   Protein (g/kg of active weight):
     Lose Fat:     min 1.2 / rec 1.6 / opt 2.0
     Maintain:     min 1.0 / rec 1.4 / opt 1.8
     Build Muscle: min 1.4 / rec 1.8 / opt 2.2

   Fat (g/kg of active weight):
     min 0.6 / rec 0.8 / upper 1.0

   Carbs: remaining calories after protein + fat (rec)
   Carb range: derived from min/rec/opt protein + fat combos

   Monthly weight change:
     deficit/surplus ÷ 7700 kcal/kg × 30 days

   If body fat % provided: use lean body mass for
   protein and fat targets instead of total weight.
============================================ */

(function () {
  'use strict';

  /* ---- Storage key ---- */
  var STORAGE_KEY = 'p50_macro_calculator';

  /* ---- Autosave timer ---- */
  var _saveTimer = null;

  /* ---- DOM refs — Inputs ---- */
  var ageEl        = document.getElementById('macro-age');
  var genderEl     = document.getElementById('macro-gender');
  var heightUnitEl = document.getElementById('macro-height-unit');
  var heightCmEl   = document.getElementById('macro-height-cm');
  var heightFtEl   = document.getElementById('macro-height-ft');
  var heightInEl   = document.getElementById('macro-height-in');
  var weightUnitEl = document.getElementById('macro-weight-unit');
  var weightEl     = document.getElementById('macro-weight');
  var activityEl   = document.getElementById('macro-activity');
  var goalEl       = document.getElementById('macro-goal');
  var bfKnownEl    = document.getElementById('macro-bf-known');
  var bfPctEl      = document.getElementById('macro-bf-pct');
  var bfFieldEl    = document.getElementById('macro-bf-field');

  /* ---- DOM refs — Unit panels ---- */
  var heightMetricPanel   = document.getElementById('macro-height-metric');
  var heightImperialPanel = document.getElementById('macro-height-imperial');

  /* ---- DOM refs — UI ---- */
  var calcBtn    = document.getElementById('macro-calc-btn');
  var resetBtn   = document.getElementById('macro-reset-btn');
  var validEl    = document.getElementById('macro-validation');
  var resultsEl  = document.getElementById('macro-results');

  /* ---- DOM refs — Result outputs ---- */
  var targetCalEl = document.getElementById('macro-target-calories');
  var calMetaEl   = document.getElementById('macro-calories-meta');
  var bmrValEl    = document.getElementById('macro-bmr-val');
  var tdeeValEl   = document.getElementById('macro-tdee-val');
  var adjValEl    = document.getElementById('macro-adj-val');
  var adjLabelEl  = document.getElementById('macro-adj-label');

  var proteinMinEl   = document.getElementById('protein-min');
  var proteinRecEl   = document.getElementById('protein-rec');
  var proteinOptEl   = document.getElementById('protein-opt');
  var proteinBasisEl = document.getElementById('protein-basis-note');

  var fatMinEl   = document.getElementById('fat-min');
  var fatRecEl   = document.getElementById('fat-rec');
  var fatUpperEl = document.getElementById('fat-upper');

  var carbMinEl  = document.getElementById('carb-min');
  var carbRecEl  = document.getElementById('carb-rec');
  var carbMaxEl  = document.getElementById('carb-max');

  var mealGridEl = document.getElementById('macro-meal-grid');

  /* ============================================
     PREVENT WHEEL SCROLL ON NUMBER INPUTS
  ============================================ */
  var numberInputs = document.querySelectorAll(
    '#macro-age, #macro-height-cm, #macro-height-ft, #macro-height-in, #macro-weight, #macro-bf-pct'
  );
  numberInputs.forEach(function (el) {
    el.addEventListener('wheel', function (e) {
      el.blur();
      e.preventDefault();
    }, { passive: false });
  });

  /* ============================================
     BODY FAT TOGGLE
  ============================================ */
  bfKnownEl.addEventListener('change', function () {
    bfFieldEl.hidden = (bfKnownEl.value !== 'yes');
    scheduleSave();
  });

  /* ============================================
     HEIGHT UNIT SWITCHER — with value conversion
  ============================================ */
  heightUnitEl.addEventListener('change', function () {
    var prevUnit = heightUnitEl.dataset.prevUnit || 'cm';
    var newUnit  = heightUnitEl.value;

    if (prevUnit !== newUnit) {
      convertHeightDisplay(prevUnit, newUnit);
    }

    heightUnitEl.dataset.prevUnit = newUnit;
    applyHeightUnit(newUnit);
    scheduleSave();
  });

  function applyHeightUnit(unit) {
    var isMetric = (unit === 'cm');
    heightMetricPanel.hidden   = !isMetric;
    heightImperialPanel.hidden = isMetric;
    document.getElementById('macro-height-label').textContent =
      isMetric ? 'Height (cm)' : 'Height (ft / in)';
  }

  /* Convert height values between metric and imperial when toggling */
  function convertHeightDisplay(fromUnit, toUnit) {
    if (fromUnit === 'cm' && toUnit === 'imperial') {
      var cm = parseFloat(heightCmEl.value);
      if (!isNaN(cm) && cm > 0) {
        var totalIn = cm / 2.54;
        var ft = Math.floor(totalIn / 12);
        var inches = Math.round(totalIn % 12);
        if (inches === 12) { ft += 1; inches = 0; }
        heightFtEl.value = ft;
        heightInEl.value = inches;
      }
    } else if (fromUnit === 'imperial' && toUnit === 'cm') {
      var ft2  = parseFloat(heightFtEl.value) || 0;
      var inc2 = parseFloat(heightInEl.value) || 0;
      if (ft2 > 0 || inc2 > 0) {
        var totalCm = Math.round((ft2 * 12 + inc2) * 2.54);
        heightCmEl.value = totalCm;
      }
    }
  }

  /* ============================================
     WEIGHT UNIT SWITCHER — with value conversion
  ============================================ */
  weightUnitEl.addEventListener('change', function () {
    var prevUnit = weightUnitEl.dataset.prevUnit || 'kg';
    var newUnit  = weightUnitEl.value;

    if (prevUnit !== newUnit) {
      convertWeightDisplay(prevUnit, newUnit);
    }

    weightUnitEl.dataset.prevUnit = newUnit;
    applyWeightUnit(newUnit);
    scheduleSave();
  });

  function applyWeightUnit(unit) {
    var isKg = (unit === 'kg');
    document.getElementById('macro-weight-label').textContent = isKg ? 'Weight (kg)' : 'Weight (lbs)';
    document.getElementById('macro-weight-hint').textContent  = isKg ? '20–300 kg'   : '45–660 lbs';
    weightEl.placeholder = isKg ? 'e.g. 75' : 'e.g. 165';
    weightEl.min = isKg ? 20  : 45;
    weightEl.max = isKg ? 300 : 660;
  }

  function convertWeightDisplay(fromUnit, toUnit) {
    var val = parseFloat(weightEl.value);
    if (isNaN(val) || val <= 0) return;
    if (fromUnit === 'kg' && toUnit === 'lbs') {
      weightEl.value = Math.round(val * 2.20462 * 10) / 10;
    } else if (fromUnit === 'lbs' && toUnit === 'kg') {
      weightEl.value = Math.round(val / 2.20462 * 10) / 10;
    }
  }

  /* ============================================
     UNIT HELPERS
  ============================================ */
  function getHeightCm() {
    if (heightUnitEl.value === 'cm') {
      return parseFloat(heightCmEl.value);
    }
    var ft  = parseFloat(heightFtEl.value) || 0;
    var inc = parseFloat(heightInEl.value) || 0;
    return (ft * 12 + inc) * 2.54;
  }

  function getWeightKg() {
    var val = parseFloat(weightEl.value);
    if (isNaN(val)) return NaN;
    return weightUnitEl.value === 'lbs' ? val / 2.20462 : val;
  }

  /* ============================================
     VALIDATION
  ============================================ */
  function validate() {
    var age    = parseInt(ageEl.value, 10);
    var heightCm = getHeightCm();
    var weightKg = getWeightKg();

    if (!age || age < 15 || age > 100) {
      showValidation('Please enter a valid age between 15 and 100.');
      return false;
    }
    if (isNaN(heightCm) || heightCm < 100 || heightCm > 250) {
      showValidation('Please enter a valid height (100–250 cm or equivalent).');
      return false;
    }
    if (isNaN(weightKg) || weightKg < 20 || weightKg > 300) {
      showValidation('Please enter a valid weight (20–300 kg or equivalent).');
      return false;
    }
    if (bfKnownEl.value === 'yes') {
      var bf = parseFloat(bfPctEl.value);
      if (isNaN(bf) || bf < 3 || bf > 60) {
        showValidation('Please enter a valid body fat percentage (3–60%).');
        return false;
      }
    }

    hideValidation();
    return true;
  }

  function showValidation(msg) {
    validEl.textContent = msg;
    validEl.hidden = false;
  }

  function hideValidation() {
    validEl.hidden = true;
    validEl.textContent = '';
  }

  /* ============================================
     CALCULATION ENGINE
  ============================================ */
  function calculate() {
    var age      = parseInt(ageEl.value, 10);
    var gender   = genderEl.value;
    var heightCm = getHeightCm();
    var weightKg = getWeightKg();
    var activity = parseFloat(activityEl.value);
    var goal     = goalEl.value;
    var bfKnown  = bfKnownEl.value === 'yes';
    var bfPct    = bfKnown ? parseFloat(bfPctEl.value) : null;

    /* BMR — Mifflin-St Jeor */
    var bmr;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    /* TDEE */
    var tdee = bmr * activity;

    /* Goal calories */
    var targetCalories;
    var adjustment;
    if (goal === 'lose') {
      targetCalories = tdee - 500;
      adjustment = -500;
    } else if (goal === 'build') {
      targetCalories = tdee + 300;
      adjustment = +300;
    } else {
      targetCalories = tdee;
      adjustment = 0;
    }

    /* Calorie floor — Health Category Standard
       Male: 1500 kcal · Female: 1200 kcal
       Applied only to deficit (lose) goal */
    var CALORIE_FLOOR = gender === 'male' ? 1500 : 1200;
    var floorTriggered = false;
    if (goal === 'lose' && targetCalories < CALORIE_FLOOR) {
      targetCalories = CALORIE_FLOOR;
      adjustment = Math.round(targetCalories - tdee);
      floorTriggered = true;
    }

    /* Active weight for macros */
    var activeWeight;
    if (bfKnown && bfPct !== null) {
      /* Lean Body Mass */
      activeWeight = weightKg * (1 - bfPct / 100);
    } else {
      activeWeight = weightKg;
    }

    /* Protein targets (g) — Health Category Standard
       Base rates + activity bonus (g/kg of active weight) */
    var proteinRatios = {
      lose:     { min: 1.6, rec: 1.9, opt: 2.2 },
      maintain: { min: 1.2, rec: 1.4, opt: 1.6 },
      build:    { min: 1.8, rec: 2.1, opt: 2.4 }
    };
    var ACTIVITY_PROTEIN_BONUS = {
      1.2: 0.0, 1.375: 0.1, 1.55: 0.2, 1.725: 0.3, 1.9: 0.4
    };
    var actBonus = ACTIVITY_PROTEIN_BONUS[activity] || 0.0;
    var pRatio = proteinRatios[goal];
    var proteinMin = Math.round(activeWeight * (pRatio.min + actBonus));
    var proteinRec = Math.round(activeWeight * (pRatio.rec + actBonus));
    var proteinOpt = Math.round(activeWeight * (pRatio.opt + actBonus));

    /* Fat targets (g) */
    var fatMin   = Math.round(activeWeight * 0.6);
    var fatRec   = Math.round(activeWeight * 0.8);
    var fatUpper = Math.round(activeWeight * 1.0);

    /* Carb range (g) — remaining calories
       Min carbs  = target cal - proteinOpt×4  - fatUpper×9  (least room for carbs)
       Rec carbs  = target cal - proteinRec×4  - fatRec×9    (balanced approach)
       Max carbs  = target cal - proteinMin×4  - fatMin×9    (most room for carbs) */
    var carbMin = Math.round(Math.max(0, (targetCalories - proteinOpt * 4 - fatUpper * 9) / 4));
    var carbRec = Math.round(Math.max(0, (targetCalories - proteinRec * 4 - fatRec   * 9) / 4));
    var carbMax = Math.round(Math.max(0, (targetCalories - proteinMin * 4 - fatMin   * 9) / 4));

    /* Monthly weight change — 7700 kcal per kg of body fat
       adjustment per day × 30 days ÷ 7700 kcal/kg */
    var monthlyChangeKg = (adjustment * 30) / 7700;

    /* 6-month projection from current weight */
    var projections = [];
    for (var m = 1; m <= 6; m++) {
      projections.push(Math.round((weightKg + monthlyChangeKg * m) * 10) / 10);
    }

    /* Meal split — use recommended protein, fat and calories */
    var mealSplit = {
      3: {
        cal:     Math.round(targetCalories / 3),
        protein: Math.round(proteinRec / 3),
        fat:     Math.round(fatRec / 3),
        carbs:   Math.round(carbRec / 3)
      },
      4: {
        cal:     Math.round(targetCalories / 4),
        protein: Math.round(proteinRec / 4),
        fat:     Math.round(fatRec / 4),
        carbs:   Math.round(carbRec / 4)
      },
      5: {
        cal:     Math.round(targetCalories / 5),
        protein: Math.round(proteinRec / 5),
        fat:     Math.round(fatRec / 5),
        carbs:   Math.round(carbRec / 5)
      }
    };

    return {
      bmr:            Math.round(bmr),
      tdee:           Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      adjustment:     adjustment,
      goal:           goal,
      floorTriggered: floorTriggered,
      bfKnown:        bfKnown,
      bfPct:          bfPct,
      activeWeight:   Math.round(activeWeight * 10) / 10,
      weightKg:       Math.round(weightKg * 10) / 10,
      proteinMin:     proteinMin,
      proteinRec:     proteinRec,
      proteinOpt:     proteinOpt,
      fatMin:         fatMin,
      fatRec:         fatRec,
      fatUpper:       fatUpper,
      carbMin:        carbMin,
      carbRec:        carbRec,
      carbMax:        carbMax,
      monthlyChangeKg: Math.round(monthlyChangeKg * 10) / 10,
      projections:    projections,
      mealSplit:      mealSplit
    };
  }

  /* ============================================
     RENDER RESULTS
  ============================================ */
  function render(d) {
    /* --- Recommended Daily Targets (quick-answer card) --- */
    var summaryCalEl     = document.getElementById('summary-cal');
    var summaryProteinEl = document.getElementById('summary-protein');
    var summaryFatEl     = document.getElementById('summary-fat');
    var summaryCarbsEl   = document.getElementById('summary-carbs');
    if (summaryCalEl)     summaryCalEl.textContent     = d.targetCalories.toLocaleString();
    if (summaryProteinEl) summaryProteinEl.textContent = d.proteinRec;
    if (summaryFatEl)     summaryFatEl.textContent     = d.fatRec;
    if (summaryCarbsEl)   summaryCarbsEl.textContent   = d.carbRec;

    /* --- Target Calories card --- */
    targetCalEl.textContent = d.targetCalories.toLocaleString();

    var goalLabel = { lose: 'Lose Fat', maintain: 'Maintain Weight', build: 'Build Muscle' }[d.goal];
    var adjText = '';
    if (d.adjustment < 0) adjText = ' (' + Math.abs(d.adjustment) + ' kcal deficit from TDEE)';
    else if (d.adjustment > 0) adjText = ' (+' + d.adjustment + ' kcal surplus over TDEE)';
    else adjText = ' (equal to TDEE — maintenance)';
    calMetaEl.innerHTML = '<strong>' + goalLabel + '</strong>' + adjText;

    bmrValEl.textContent  = d.bmr.toLocaleString();
    tdeeValEl.textContent = d.tdee.toLocaleString();

    if (d.adjustment === 0) {
      adjValEl.textContent   = '—';
      adjLabelEl.textContent = 'Adjustment';
    } else if (d.adjustment < 0) {
      adjValEl.textContent   = d.adjustment;
      adjLabelEl.textContent = 'Calorie Deficit';
    } else {
      adjValEl.textContent   = '+' + d.adjustment;
      adjLabelEl.textContent = 'Calorie Surplus';
    }

    /* --- Protein --- */
    proteinMinEl.textContent = d.proteinMin;
    proteinRecEl.textContent = d.proteinRec;
    proteinOptEl.textContent = d.proteinOpt;

    if (d.bfKnown && d.bfPct !== null) {
      proteinBasisEl.textContent =
        'Targets based on your lean body mass (' + d.activeWeight + ' kg). Body fat ' + d.bfPct + '% excluded for precision.';
    } else {
      proteinBasisEl.textContent =
        'Targets based on total body weight (' + d.weightKg + ' kg). Enter body fat % for lean mass-based precision.';
    }

    /* --- Fat --- */
    fatMinEl.textContent   = d.fatMin;
    fatRecEl.textContent   = d.fatRec;
    fatUpperEl.textContent = d.fatUpper;

    /* --- Carbs (3-card layout) --- */
    carbMinEl.textContent = d.carbMin;
    carbRecEl.textContent = d.carbRec;
    carbMaxEl.textContent = d.carbMax;

    /* --- Body Composition card (only when BF% known) --- */
    var bfCardEl = document.getElementById('macro-bf-comp-card');
    if (bfCardEl) {
      if (d.bfKnown && d.bfPct !== null) {
        bfCardEl.hidden = false;
        var bfWeightEl    = document.getElementById('bf-comp-weight');
        var bfPctDispEl   = document.getElementById('bf-comp-pct');
        var bfLeanEl      = document.getElementById('bf-comp-lean');
        if (bfWeightEl)  bfWeightEl.textContent  = d.weightKg + ' kg';
        if (bfPctDispEl) bfPctDispEl.textContent = d.bfPct + '%';
        if (bfLeanEl)    bfLeanEl.textContent    = d.activeWeight + ' kg';
      } else {
        bfCardEl.hidden = true;
      }
    }

    /* --- Meal split --- */
    mealGridEl.innerHTML =
      buildMealItem('3 Meals', d.mealSplit[3]) +
      buildMealItem('4 Meals', d.mealSplit[4]) +
      buildMealItem('5 Meals', d.mealSplit[5]);

    /* --- Expected Progress card --- */
    renderProgress(d);

    /* Show results */
    resultsEl.hidden = false;

    /* Floor warning */
    var floorWarnEl = document.getElementById('macro-floor-warning');
    if (floorWarnEl) floorWarnEl.hidden = !d.floorTriggered;

    /* Move related tools below results */
    var relatedWrap = document.getElementById('macro-related-tools');
    var toolWrap    = document.querySelector('.tool-wrap');
    if (relatedWrap && toolWrap) {
      toolWrap.appendChild(relatedWrap);
    }

    /* Scroll results into view smoothly */
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    /* Trigger animations */
    if (window.P50ToolBase) P50ToolBase.triggerAnimations();
  }

  function buildMealItem(label, split) {
    return '<div class="macro-meal-item">' +
      '<div class="macro-meal-count">' + label + '</div>' +
      '<div class="macro-meal-row">' +
        '<div class="macro-meal-stat">' +
          '<div class="macro-meal-val">' + split.cal + '</div>' +
          '<div class="macro-meal-unit">kcal</div>' +
        '</div>' +
        '<div class="macro-meal-stat macro-meal-stat--protein">' +
          '<div class="macro-meal-val">' + split.protein + 'g</div>' +
          '<div class="macro-meal-unit">protein</div>' +
        '</div>' +
        '<div class="macro-meal-stat macro-meal-stat--fat">' +
          '<div class="macro-meal-val">' + split.fat + 'g</div>' +
          '<div class="macro-meal-unit">fat</div>' +
        '</div>' +
        '<div class="macro-meal-stat macro-meal-stat--carbs">' +
          '<div class="macro-meal-val">' + split.carbs + 'g</div>' +
          '<div class="macro-meal-unit">carbs</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderProgress(d) {
    var progressCardEl = document.getElementById('macro-progress-card');
    if (!progressCardEl) return;

    var changeKg   = d.monthlyChangeKg;
    var goal       = d.goal;
    var weightKg   = d.weightKg;
    var projections = d.projections;

    /* Monthly change label */
    var changeSign = changeKg > 0 ? '+' : (changeKg < 0 ? '' : '');
    var changeStr  = changeSign + changeKg.toFixed(1) + ' kg/month';

    var contextLabel;
    if (goal === 'lose')     contextLabel = 'Fat Loss — 500 kcal/day deficit';
    else if (goal === 'build') contextLabel = 'Muscle Build — 300 kcal/day surplus';
    else                     contextLabel = 'Maintenance — no calorie adjustment';

    var monthChangeEl = document.getElementById('progress-monthly-change');
    var monthContextEl = document.getElementById('progress-monthly-context');
    if (monthChangeEl)  monthChangeEl.textContent  = changeStr;
    if (monthContextEl) monthContextEl.textContent = contextLabel;

    /* 6-month projection table */
    var projEl = document.getElementById('progress-projection');
    if (projEl) {
      var html = '';
      var months = ['Month 1','Month 2','Month 3','Month 4','Month 5','Month 6'];
      for (var i = 0; i < 6; i++) {
        var diff = Math.round((projections[i] - weightKg) * 10) / 10;
        var diffStr = diff === 0 ? '—' : (diff > 0 ? '+' + diff.toFixed(1) : diff.toFixed(1));
        html +=
          '<div class="macro-proj-row">' +
            '<div class="macro-proj-month">' + months[i] + '</div>' +
            '<div class="macro-proj-weight">' + projections[i].toFixed(1) + ' kg</div>' +
            '<div class="macro-proj-delta' + (diff < 0 ? ' macro-proj-delta--loss' : diff > 0 ? ' macro-proj-delta--gain' : '') + '">' + diffStr + '</div>' +
          '</div>';
      }
      projEl.innerHTML = html;
    }
  }

  /* ============================================
     CALCULATE BUTTON
  ============================================ */
  calcBtn.addEventListener('click', function () {
    if (!validate()) return;
    var data = calculate();
    if (data === null) return;
    render(data);
    saveState();
  });

  /* Enter key on number inputs triggers calculation */
  document.querySelectorAll(
    '#macro-age, #macro-height-cm, #macro-height-ft, #macro-height-in, #macro-weight, #macro-bf-pct'
  ).forEach(function (el) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (!validate()) return;
        var data = calculate();
        if (data) render(data);
        saveState();
      }
    });
  });

  /* ============================================
     RESET
  ============================================ */
  resetBtn.addEventListener('click', resetAll);

  function resetAll() {
    clearTimeout(_saveTimer);

    /* Clear inputs */
    [ageEl, heightCmEl, heightFtEl, heightInEl, weightEl, bfPctEl].forEach(function (el) {
      if (el) el.value = '';
    });

    /* Reset selects to defaults */
    if (genderEl)     genderEl.value     = 'male';
    if (heightUnitEl) { heightUnitEl.value = 'cm'; heightUnitEl.dataset.prevUnit = 'cm'; }
    if (weightUnitEl) { weightUnitEl.value = 'kg'; weightUnitEl.dataset.prevUnit = 'kg'; }
    if (activityEl)   activityEl.value   = '1.55';
    if (goalEl)       goalEl.value       = 'maintain';
    if (bfKnownEl)    bfKnownEl.value    = 'no';

    /* Reset panels */
    heightMetricPanel.hidden   = false;
    heightImperialPanel.hidden = true;
    document.getElementById('macro-height-label').textContent = 'Height (cm)';

    /* Reset weight label */
    applyWeightUnit('kg');

    /* Hide body fat field */
    bfFieldEl.hidden = true;

    /* Hide results and validation */
    resultsEl.hidden = true;
    hideValidation();
    var floorWarnEl = document.getElementById('macro-floor-warning');
    if (floorWarnEl) floorWarnEl.hidden = true;

    /* Move related tools back to default position */
    var relatedWrap = document.getElementById('macro-related-tools');
    var toolWrap    = document.querySelector('.tool-wrap');
    if (relatedWrap && toolWrap) {
      toolWrap.appendChild(relatedWrap);
    }

    /* Clear storage */
    if (window.P50Storage) P50Storage.remove(STORAGE_KEY);
  }

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
      age:        ageEl.value,
      gender:     genderEl.value,
      heightUnit: heightUnitEl.value,
      heightCm:   heightCmEl.value,
      heightFt:   heightFtEl.value,
      heightIn:   heightInEl.value,
      weightUnit: weightUnitEl.value,
      weight:     weightEl.value,
      activity:   activityEl.value,
      goal:       goalEl.value,
      bfKnown:    bfKnownEl.value,
      bfPct:      bfPctEl.value
    });
  }

  /* Wire autosave to all inputs and selects */
  document.querySelectorAll(
    '#macro-age, #macro-height-cm, #macro-height-ft, #macro-height-in, #macro-weight, #macro-bf-pct'
  ).forEach(function (el) {
    el.addEventListener('input', scheduleSave);
  });

  document.querySelectorAll(
    '#macro-gender, #macro-activity, #macro-goal'
  ).forEach(function (el) {
    el.addEventListener('change', scheduleSave);
  });

  /* ============================================
     RESTORE STATE ON LOAD
     Inputs only — never restores results.
  ============================================ */
  function restoreState() {
    if (!window.P50Storage) return;
    var saved = P50Storage.get(STORAGE_KEY, null);
    if (!saved) return;

    if (saved.age)    ageEl.value    = saved.age;
    if (saved.gender) genderEl.value = saved.gender;

    /* Height unit + values */
    if (saved.heightUnit) {
      heightUnitEl.value = saved.heightUnit;
      heightUnitEl.dataset.prevUnit = saved.heightUnit;
      applyHeightUnit(saved.heightUnit);
    }
    if (saved.heightCm) heightCmEl.value = saved.heightCm;
    if (saved.heightFt) heightFtEl.value = saved.heightFt;
    if (saved.heightIn) heightInEl.value = saved.heightIn;

    /* Weight unit + value */
    if (saved.weightUnit) {
      weightUnitEl.value = saved.weightUnit;
      weightUnitEl.dataset.prevUnit = saved.weightUnit;
      applyWeightUnit(saved.weightUnit);
    }
    if (saved.weight) weightEl.value = saved.weight;

    if (saved.activity) activityEl.value = saved.activity;
    if (saved.goal)     goalEl.value     = saved.goal;

    /* Body fat */
    if (saved.bfKnown) {
      bfKnownEl.value  = saved.bfKnown;
      bfFieldEl.hidden = (saved.bfKnown !== 'yes');
    }
    if (saved.bfPct) bfPctEl.value = saved.bfPct;
  }

  /* ============================================
     RELATED TOOLS
     Same category (health-fitness) only.
     Max 4 tools. Excludes self. No fake tools.
  ============================================ */
  /* Use centralized renderer for related tool icons to avoid duplication */

  function renderRelatedTools() {
    var relatedGrid = document.getElementById('macro-related-grid');
    if (!relatedGrid) return;

    fetch('/data/tools.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var related = (data.allTools || [])
          .filter(function (t) {
            return t.category === 'health-fitness' && t.id !== 'macro-calculator';
          })
          .slice(0, 4);

        if (!related.length) {
          related = getRelatedFallback();
        }
        buildRelatedHTML(relatedGrid, related);
      })
      .catch(function () {
        buildRelatedHTML(relatedGrid, getRelatedFallback());
      });
  }

  function getRelatedFallback() {
    return [
      { id: 'bmi-calculator',        name: 'BMI Calculator',        description: 'Check your Body Mass Index',                  link: '/tools/bmi-calculator/', icon: 'scale' },
      { id: 'daily-calorie-planner', name: 'Daily Calorie Planner', description: 'Calculate your BMR, TDEE and target calories', link: '/tools/daily-calorie-planner/', icon: 'salad' },
      { id: 'body-fat-calculator',   name: 'Body Fat Calculator',   description: 'Calculate your body fat percentage',           link: '/tools/body-fat-calculator/', icon: 'ruler' }
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
  restoreState();
  renderRelatedTools();

})();
