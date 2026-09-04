/* ============================================
   TDEE.JS — Project 50
   TDEE Calculator

   Calculation method: Mifflin-St Jeor Equation
   BMR (male)   = 10×W(kg) + 6.25×H(cm) − 5×A + 5
   BMR (female) = 10×W(kg) + 6.25×H(cm) − 5×A − 161

   TDEE = BMR × activity multiplier
   Activity multipliers:
     Sedentary = 1.20   Lightly Active = 1.375
     Moderately Active = 1.55   Very Active = 1.725
     Athlete = 1.90

   Goal calories:
     Maintain Weight        → TDEE
     Lose Fat               → TDEE − 500   (highlighted)
     Aggressive Fat Loss     → TDEE − 750
     Lean Muscle Gain        → TDEE + 300
     Weight Gain             → TDEE + 500

   Safety floors (clamped, never displayed below):
     Male:   1500 kcal minimum
     Female: 1200 kcal minimum

   Monthly weight change:
     adjustment × 30 ÷ 7700

   Daily Calorie Breakdown (Lose Fat target):
     Breakfast 25% / Lunch 35% / Dinner 30% / Snacks 10%
============================================ */

(function () {
  'use strict';

  /* ---- Storage key ---- */
  var STORAGE_KEY = 'p50_tdee_calculator';

  /* ---- Autosave timer ---- */
  var _saveTimer = null;

  /* ---- DOM refs — Inputs ---- */
  var genderEl     = document.getElementById('tdee-gender');
  var ageEl        = document.getElementById('tdee-age');
  var heightUnitEl = document.getElementById('tdee-height-unit');
  var heightCmEl   = document.getElementById('tdee-height-cm');
  var heightFtEl   = document.getElementById('tdee-height-ft');
  var heightInEl   = document.getElementById('tdee-height-in');
  var weightUnitEl = document.getElementById('tdee-weight-unit');
  var weightEl     = document.getElementById('tdee-weight');
  var activityEl   = document.getElementById('tdee-activity');

  /* ---- DOM refs — Unit panels ---- */
  var heightMetricPanel   = document.getElementById('tdee-height-metric');
  var heightImperialPanel = document.getElementById('tdee-height-imperial');

  /* ---- DOM refs — UI ---- */
  var calcBtn   = document.getElementById('tdee-calc-btn');
  var resetBtn  = document.getElementById('tdee-reset-btn');
  var validEl   = document.getElementById('tdee-validation');
  var resultsEl = document.getElementById('tdee-results');

  /* ---- DOM refs — Result outputs ---- */
  var goalListEl       = document.getElementById('tdee-goal-list');
  var floorWarningEl   = document.getElementById('tdee-floor-warning');
  var monthlyGridEl    = document.getElementById('tdee-monthly-grid');
  var comparisonBodyEl = document.getElementById('tdee-comparison-body');
  var mealGridEl       = document.getElementById('tdee-meal-grid');
  var activityGridEl   = document.getElementById('tdee-activity-grid');
  var bmrValEl         = document.getElementById('tdee-bmr-val');
  var multiplierValEl  = document.getElementById('tdee-multiplier-val');
  var tdeeValEl        = document.getElementById('tdee-tdee-val');
  var formulaNoteEl    = document.getElementById('tdee-formula-note');
  var aggressiveWarnEl = document.getElementById('tdee-aggressive-warning');

  /* ============================================
     GOAL DEFINITIONS
  ============================================ */
  var GOALS = [
    { key: 'maintain',   name: 'Maintain Weight',     adjust: 0,    highlight: false, floorEligible: false },
    { key: 'lose',       name: 'Lose Fat',            adjust: -500, highlight: true,  floorEligible: true  },
    { key: 'aggressive', name: 'Aggressive Fat Loss',  adjust: -750, highlight: false, floorEligible: true  },
    { key: 'lean',       name: 'Lean Muscle Gain',     adjust: 300,  highlight: false, floorEligible: false },
    { key: 'gain',       name: 'Weight Gain',          adjust: 500,  highlight: false, floorEligible: false }
  ];

  var ACTIVITY_LEVELS = [
    { mult: 1.2,   name: 'Sedentary' },
    { mult: 1.375, name: 'Lightly Active' },
    { mult: 1.55,  name: 'Moderately Active' },
    { mult: 1.725, name: 'Very Active' },
    { mult: 1.9,   name: 'Athlete' }
  ];

  var KCAL_PER_KG = 7700;

  /* ============================================
     PREVENT WHEEL SCROLL ON NUMBER INPUTS
  ============================================ */
  var numberInputs = document.querySelectorAll(
    '#tdee-age, #tdee-height-cm, #tdee-height-ft, #tdee-height-in, #tdee-weight'
  );
  numberInputs.forEach(function (el) {
    el.addEventListener('wheel', function (e) {
      el.blur();
      e.preventDefault();
    }, { passive: false });
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
    applyHeightUnit(newUnit);
    heightUnitEl.dataset.prevUnit = newUnit;
    scheduleSave();
  });

  function applyHeightUnit(unit) {
    var label = document.getElementById('tdee-height-label');
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
     WEIGHT UNIT SWITCHER — with value conversion
  ============================================ */
  weightUnitEl.addEventListener('change', function () {
    var prevUnit = weightUnitEl.dataset.prevUnit || 'kg';
    var newUnit  = weightUnitEl.value;

    if (prevUnit !== newUnit) {
      var val = parseFloat(weightEl.value);
      if (!isNaN(val) && val > 0) {
        if (prevUnit === 'kg' && newUnit === 'lbs') {
          weightEl.value = Math.round(val * 2.20462 * 10) / 10;
        } else if (prevUnit === 'lbs' && newUnit === 'kg') {
          weightEl.value = Math.round(val / 2.20462 * 10) / 10;
        }
      }
    }
    applyWeightUnit(newUnit);
    weightUnitEl.dataset.prevUnit = newUnit;
    scheduleSave();
  });

  function applyWeightUnit(unit) {
    var label = document.getElementById('tdee-weight-label');
    var hint  = document.getElementById('tdee-weight-hint');
    if (unit === 'kg') {
      label.textContent = 'Weight (kg)';
      hint.textContent = '20–300 kg';
      weightEl.min = 20; weightEl.max = 300;
    } else {
      label.textContent = 'Weight (lbs)';
      hint.textContent = '44–660 lbs';
      weightEl.min = 44; weightEl.max = 660;
    }
  }

  /* ============================================
     UNIT CONVERSION HELPERS (for calculation)
  ============================================ */
  function getHeightInCm() {
    if (heightUnitEl.value === 'cm') {
      return parseFloat(heightCmEl.value);
    }
    var ft = parseFloat(heightFtEl.value) || 0;
    var inch = parseFloat(heightInEl.value) || 0;
    var totalInches = (ft * 12) + inch;
    return totalInches * 2.54;
  }

  function getWeightInKg() {
    var val = parseFloat(weightEl.value);
    if (isNaN(val)) return NaN;
    if (weightUnitEl.value === 'kg') return val;
    return val / 2.20462;
  }

  /* ============================================
     VALIDATION
  ============================================ */
  function validate() {
    var age = parseFloat(ageEl.value);
    var heightCm = getHeightInCm();
    var weightKg = getWeightInKg();

    if (isNaN(age) || age < 15 || age > 100) {
      return 'Please enter a valid age between 15 and 100.';
    }
    if (isNaN(heightCm) || heightCm < 100 || heightCm > 250) {
      return 'Please enter a valid height.';
    }
    if (isNaN(weightKg) || weightKg < 20 || weightKg > 300) {
      return 'Please enter a valid weight.';
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

  function calculateGoalCalories(tdee, adjust, floor, floorEligible) {
    var raw = tdee + adjust;
    if (!floorEligible) {
      return {
        raw: raw,
        calories: Math.round(raw),
        floorTriggered: false
      };
    }
    var clamped = Math.max(raw, floor);
    return {
      raw: raw,
      calories: Math.round(clamped),
      floorTriggered: raw < floor
    };
  }

  function monthlyChange(adjustedKcalPerDay) {
    return (adjustedKcalPerDay * 30) / KCAL_PER_KG;
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

    var gender   = genderEl.value;
    var age      = parseFloat(ageEl.value);
    var heightCm = getHeightInCm();
    var weightKg = getWeightInKg();
    var activityMult = parseFloat(activityEl.value);
    var activityName = activityEl.options[activityEl.selectedIndex].text.split(' — ')[0];

    var bmr = calculateBMR(gender, weightKg, heightCm, age);
    var tdee = bmr * activityMult;
    var floor = getCalorieFloor(gender);

    /* Compute all 5 goal targets */
    var goalResults = GOALS.map(function (g) {
      var result = calculateGoalCalories(tdee, g.adjust, floor, g.floorEligible);
      var actualAdjust = (g.floorEligible && result.floorTriggered) ? (result.calories - tdee) : g.adjust;
      return {
        key: g.key,
        name: g.name,
        highlight: g.highlight,
        calories: result.calories,
        adjust: g.adjust,
        actualAdjust: actualAdjust,
        floorTriggered: result.floorTriggered,
        monthlyChangeKg: g.key === 'maintain' ? 0 : monthlyChange(actualAdjust)
      };
    });

    var anyFloorTriggered = goalResults.some(function (g) { return g.floorTriggered; });
    var aggressiveGoal = goalResults.filter(function (g) { return g.key === 'aggressive'; })[0];
    var loseGoal = goalResults.filter(function (g) { return g.key === 'lose'; })[0];

    renderGoalList(goalResults, floor);
    renderMonthlyChange(goalResults);
    renderComparisonTable(goalResults);
    renderMealBreakdown(loseGoal.calories);
    renderActivityImpact(bmr, activityMult);
    renderBmrTdeeBreakdown(bmr, activityMult, activityName, tdee, gender, age, heightCm, weightKg);

    floorWarningEl.hidden = !anyFloorTriggered;
    aggressiveWarnEl.hidden = aggressiveGoal.floorTriggered;

    resultsEl.hidden = false;
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    scheduleSave();
  });

  /* ============================================
     RENDER: Goal List (Section 1)
  ============================================ */
  function renderGoalList(goalResults, floor) {
    var html = '';
    goalResults.forEach(function (g) {
      html += '<div class="tdee-goal-item' + (g.highlight ? ' tdee-goal-item--highlight' : '') + '">' +
                '<div class="tdee-goal-name">' + g.name +
                  (g.highlight ? '<span class="tdee-goal-badge">Recommended</span>' : '') +
                '</div>' +
                '<div class="tdee-goal-calories">' + g.calories.toLocaleString() +
                  '<span class="tdee-goal-unit">kcal</span></div>' +
              '</div>';
    });
    goalListEl.innerHTML = html;
  }

  /* ============================================
     RENDER: Monthly Weight Change (Section 2)
  ============================================ */
  function renderMonthlyChange(goalResults) {
    var html = '';
    goalResults.forEach(function (g) {
      var changeClass = 'tdee-monthly-val--neutral';
      var sign = '';
      if (g.monthlyChangeKg < -0.05) { changeClass = 'tdee-monthly-val--loss'; sign = ''; }
      else if (g.monthlyChangeKg > 0.05) { changeClass = 'tdee-monthly-val--gain'; sign = '+'; }

      var displayVal = Math.abs(g.monthlyChangeKg) < 0.05 ? '0.00' : (sign + g.monthlyChangeKg.toFixed(2));

      html += '<div class="tdee-monthly-item">' +
                '<div class="tdee-monthly-name">' + g.name + '</div>' +
                '<div class="tdee-monthly-val ' + changeClass + '">' + displayVal + '</div>' +
                '<div class="tdee-monthly-unit">kg / month</div>' +
              '</div>';
    });
    monthlyGridEl.innerHTML = html;
  }

  /* ============================================
     RENDER: Goal Comparison Table (Section 3)
  ============================================ */
  function renderComparisonTable(goalResults) {
    var html = '';
    goalResults.forEach(function (g) {
      var changeClass = '';
      var sign = '';
      if (g.monthlyChangeKg < -0.05) { changeClass = 'tdee-change--loss'; }
      else if (g.monthlyChangeKg > 0.05) { changeClass = 'tdee-change--gain'; sign = '+'; }

      var displayVal = Math.abs(g.monthlyChangeKg) < 0.05 ? '0.00 kg' : (sign + g.monthlyChangeKg.toFixed(2) + ' kg');

      html += '<tr' + (g.highlight ? ' class="tdee-table-row--highlight"' : '') + '>' +
                '<td>' + g.name + '</td>' +
                '<td>' + g.calories.toLocaleString() + '</td>' +
                '<td class="' + changeClass + '">' + displayVal + '</td>' +
              '</tr>';
    });
    comparisonBodyEl.innerHTML = html;
  }

  /* ============================================
     RENDER: Daily Calorie Breakdown (Section 4)
  ============================================ */
  function renderMealBreakdown(loseCalories) {
    var meals = [
      { name: 'Breakfast', pct: 0.25 },
      { name: 'Lunch',     pct: 0.35 },
      { name: 'Dinner',    pct: 0.30 },
      { name: 'Snacks',    pct: 0.10 }
    ];
    var html = '';
    meals.forEach(function (m) {
      var cal = Math.round(loseCalories * m.pct);
      html += '<div class="tdee-meal-item">' +
                '<div class="tdee-meal-name">' + m.name + '</div>' +
                '<div class="tdee-meal-pct">' + Math.round(m.pct * 100) + '% of daily target</div>' +
                '<div class="tdee-meal-cal">' + cal.toLocaleString() +
                  '<span class="tdee-meal-unit"> kcal</span></div>' +
              '</div>';
    });
    mealGridEl.innerHTML = html;
  }

  /* ============================================
     RENDER: Activity Impact (Section 5)
  ============================================ */
  function renderActivityImpact(bmr, currentMult) {
    var html = '';
    ACTIVITY_LEVELS.forEach(function (lvl) {
      var cal = Math.round(bmr * lvl.mult);
      var isCurrent = Math.abs(lvl.mult - currentMult) < 0.001;
      html += '<div class="tdee-activity-item' + (isCurrent ? ' tdee-activity-item--current' : '') + '">' +
                '<div class="tdee-activity-name">' + lvl.name +
                  (isCurrent ? '<span class="tdee-activity-current-badge">Your Level</span>' : '') +
                '</div>' +
                '<div class="tdee-activity-cal">' + cal.toLocaleString() +
                  '<span class="tdee-activity-cal-unit"> kcal</span></div>' +
              '</div>';
    });
    activityGridEl.innerHTML = html;
  }

  /* ============================================
     RENDER: BMR & TDEE Breakdown (Section 6)
  ============================================ */
  function renderBmrTdeeBreakdown(bmr, mult, activityName, tdee, gender, age, heightCm, weightKg) {
    bmrValEl.textContent = Math.round(bmr).toLocaleString();
    multiplierValEl.textContent = '×' + mult;
    tdeeValEl.textContent = Math.round(tdee).toLocaleString();

    var sexLabel = gender === 'male' ? 'Male' : 'Female';
    var constant = gender === 'male' ? '+ 5' : '− 161';
    formulaNoteEl.innerHTML = 'Mifflin-St Jeor (' + sexLabel + '): ' +
      '(10 × ' + Math.round(weightKg) + 'kg) + (6.25 × ' + Math.round(heightCm) + 'cm) − (5 × ' + age + ') ' + constant +
      ' = ' + Math.round(bmr) + ' kcal BMR<br>' +
      'TDEE = ' + Math.round(bmr) + ' × ' + mult + ' (' + activityName + ') = ' + Math.round(tdee) + ' kcal';
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
    weightEl.value = '';
    applyWeightUnit('kg');
    activityEl.value = '1.55';

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
      gender:     genderEl.value,
      age:        ageEl.value,
      heightUnit: heightUnitEl.value,
      heightCm:   heightCmEl.value,
      heightFt:   heightFtEl.value,
      heightIn:   heightInEl.value,
      weightUnit: weightUnitEl.value,
      weight:     weightEl.value,
      activity:   activityEl.value
    });
  }

  /* Wire autosave to all inputs and selects */
  document.querySelectorAll(
    '#tdee-age, #tdee-height-cm, #tdee-height-ft, #tdee-height-in, #tdee-weight'
  ).forEach(function (el) {
    el.addEventListener('input', scheduleSave);
  });

  document.querySelectorAll(
    '#tdee-gender, #tdee-activity'
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

    if (saved.gender) genderEl.value = saved.gender;
    if (saved.age)    ageEl.value    = saved.age;

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
  }

  /* ============================================
     RELATED TOOLS
     Same category (health-fitness) only.
     Max 4 tools. Excludes self. No fake tools.
  ============================================ */
  function renderRelatedTools() {
    var relatedGrid = document.getElementById('tdee-related-grid');
    if (!relatedGrid) return;

    fetch('/data/tools.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var related = (data.allTools || [])
          .filter(function (t) {
            return t.category === 'health-fitness' && t.id !== 'tdee-calculator';
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
      { id: 'macro-calculator', name: 'Macro Calculator', description: 'Calculate your daily protein, fat and carb targets', link: '/tools/macro-calculator/', icon: 'beef' },
      { id: 'bmi-calculator',   name: 'BMI Calculator',   description: 'Check your Body Mass Index',                  link: '/tools/bmi-calculator/', icon: 'scale' },
      { id: 'body-fat-calculator', name: 'Body Fat Calculator', description: 'Calculate your body fat percentage',     link: '/tools/body-fat-calculator/', icon: 'ruler' }
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
