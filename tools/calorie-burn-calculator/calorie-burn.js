/* ============================================
   CALORIE-BURN.JS — Project 50
   Calorie Burn Calculator

   Formula:
     Calories Burned = MET × Weight(kg) × Duration(hours)

   STORAGE KEY: p50_calorie_burn_calculator
   AUTOSAVE: 300ms debounce, inputs only

   Pattern mirrors macro.js / water.js:
     - unit-switch (kg/lbs) with live conversion
     - dependent activity dropdown
     - P50Storage autosave + restore (inputs only)
     - related tools via tools.json (health-fitness, max 4)
============================================ */

(function () {
  'use strict';

  /* ---- Storage key ---- */
  var STORAGE_KEY = 'p50_calorie_burn_calculator';

  /* ---- Autosave timer ---- */
  var _saveTimer = null;

  /* ============================================
     MET VALUES
  ============================================ */
  var MET_VALUES = {
    walking: {
      'slow-walking':   2.5,
      'normal-walking': 3.5,
      'brisk-walking':  4.3,
      'hiking':         6.0
    },
    running: {
      'jogging':      7.0,
      'running':      9.8,
      'fast-running': 11.8
    },
    cycling: {
      'leisure-cycling':  4.0,
      'moderate-cycling': 8.0,
      'fast-cycling':     10.0
    },
    gym: {
      'weight-training':  5.0,
      'circuit-training': 8.0,
      'hiit':             10.0,
      'crossfit':         9.0
    },
    sports: {
      'badminton':  5.5,
      'tennis':     7.3,
      'basketball': 6.5,
      'football':   7.0,
      'volleyball': 4.0,
      'cricket':    3.8
    }
  };

  /* ---- Activity labels (per category) ---- */
  var ACTIVITY_LABELS = {
    walking: {
      'slow-walking':   'Slow Walking',
      'normal-walking': 'Normal Walking',
      'brisk-walking':  'Brisk Walking',
      'hiking':         'Hiking'
    },
    running: {
      'jogging':      'Jogging',
      'running':      'Running',
      'fast-running': 'Fast Running'
    },
    cycling: {
      'leisure-cycling':  'Leisure Cycling',
      'moderate-cycling': 'Moderate Cycling',
      'fast-cycling':     'Fast Cycling'
    },
    gym: {
      'weight-training':  'Weight Training',
      'circuit-training': 'Circuit Training',
      'hiit':             'HIIT',
      'crossfit':         'CrossFit'
    },
    sports: {
      'badminton':  'Badminton',
      'tennis':     'Tennis',
      'basketball': 'Basketball',
      'football':   'Football',
      'volleyball': 'Volleyball',
      'cricket':    'Cricket'
    }
  };

  /* ---- Food equivalents (kcal) ---- */
  var FOOD_ITEMS = [
    { key: 'samosa',  name: 'Samosa',   kcal: 150 },
    { key: 'banana',  name: 'Banana',   kcal: 105 },
    { key: 'egg',     name: 'Egg',      kcal: 70  },
    { key: 'cuprice', name: 'Cup Rice', kcal: 200 }
  ];

  /* ---- Compare-activities MET values (fixed set) ---- */
  var COMPARE_ACTIVITIES = [
    { key: 'walking', label: 'Walking', met: MET_VALUES.walking['normal-walking'] },
    { key: 'running', label: 'Running', met: MET_VALUES.running['running'] },
    { key: 'cycling', label: 'Cycling', met: MET_VALUES.cycling['moderate-cycling'] },
    { key: 'hiit',    label: 'HIIT',    met: MET_VALUES.gym['hiit'] }
  ];

  /* ---- DOM refs — Inputs ---- */
  var weightEl     = document.getElementById('cb-weight');
  var weightUnitEl = document.getElementById('cb-weight-unit');
  var categoryEl   = document.getElementById('cb-activity-category');
  var activityEl   = document.getElementById('cb-activity');
  var durationEl   = document.getElementById('cb-duration');

  /* ---- DOM refs — UI ---- */
  var calcBtn   = document.getElementById('cb-calc-btn');
  var resetBtn  = document.getElementById('cb-reset-btn');
  var validEl   = document.getElementById('cb-validation');
  var resultsEl = document.getElementById('cb-results');

  /* ---- DOM refs — Snapshot (Section 1) ---- */
  var snapCaloriesEl  = document.getElementById('snap-calories');
  var snapFatEl       = document.getElementById('snap-fat');
  var snapPerHourEl   = document.getElementById('snap-per-hour');
  var snapIntensityEl = document.getElementById('snap-intensity');

  /* ---- DOM refs — Weight Loss Impact (Section 2) ---- */
  var weeklyBurnEl  = document.getElementById('cb-weekly-burn');
  var monthlyBurnEl = document.getElementById('cb-monthly-burn');
  var fatLossEl     = document.getElementById('cb-fat-loss');

  /* ---- DOM refs — Food Equivalents (Section 3) ---- */
  var foodGridEl = document.getElementById('cb-food-grid');

  /* ---- DOM refs — Compare Activities (Section 4) ---- */
  var compareGridEl = document.getElementById('cb-compare-grid');

  /* ---- DOM refs — Activity Breakdown (Section 5) ---- */
  var breakdownActivityEl  = document.getElementById('breakdown-activity');
  var breakdownMetEl       = document.getElementById('breakdown-met');
  var breakdownDurationEl  = document.getElementById('breakdown-duration');
  var breakdownIntensityEl = document.getElementById('breakdown-intensity');
  var breakdownFormulaEl   = document.getElementById('breakdown-formula');

  /* ============================================
     PREVENT WHEEL SCROLL ON NUMBER INPUTS
  ============================================ */
  document.querySelectorAll('#cb-weight, #cb-duration').forEach(function (el) {
    el.addEventListener('wheel', function (e) {
      el.blur();
      e.preventDefault();
    }, { passive: false });
  });

  /* ============================================
     WEIGHT UNIT SWITCHER — with value conversion
     Mirrors macro.js / water.js pattern.
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
    document.getElementById('cb-weight-label').textContent = isKg ? 'Weight (kg)' : 'Weight (lbs)';
    document.getElementById('cb-weight-hint').textContent  = isKg ? '20–300 kg'   : '45–660 lbs';
    weightEl.placeholder = isKg ? 'e.g. 70' : 'e.g. 154';
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

  function getWeightKg() {
    var val = parseFloat(weightEl.value);
    if (isNaN(val)) return NaN;
    return weightUnitEl.value === 'lbs' ? val / 2.20462 : val;
  }

  /* ============================================
     DEPENDENT ACTIVITY DROPDOWN
  ============================================ */
  function populateActivities(category, selectedActivity) {
    var activities = MET_VALUES[category] || {};
    var labels = ACTIVITY_LABELS[category] || {};
    var html = '';
    Object.keys(activities).forEach(function (key) {
      html += '<option value="' + key + '">' + labels[key] + '</option>';
    });
    activityEl.innerHTML = html;

    if (selectedActivity && activities.hasOwnProperty(selectedActivity)) {
      activityEl.value = selectedActivity;
    } else {
      activityEl.selectedIndex = 0;
    }
  }

  categoryEl.addEventListener('change', function () {
    populateActivities(categoryEl.value);
    scheduleSave();
  });

  /* ============================================
     VALIDATION
  ============================================ */
  function validate() {
    var weightKg = getWeightKg();
    var duration = parseFloat(durationEl.value);

    if (isNaN(weightKg) || weightKg < 20 || weightKg > 300) {
      showValidation('Please enter a valid weight (20–300 kg or equivalent).');
      return false;
    }
    if (isNaN(duration) || duration < 15 || duration > 300) {
      showValidation('Please enter a valid duration between 15 and 300 minutes.');
      return false;
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
     INTENSITY CLASSIFICATION (based on MET)
  ============================================ */
  function getIntensity(met) {
    if (met < 3) return 'Light';
    if (met < 6) return 'Moderate';
    return 'Vigorous';
  }

  /* ============================================
     CALCULATE
  ============================================ */
  function calculate() {
    var weightKg = getWeightKg();
    var duration = parseFloat(durationEl.value); /* minutes */
    var category = categoryEl.value;
    var activity = activityEl.value;
    var met = (MET_VALUES[category] && MET_VALUES[category][activity]) || 0;

    var hours = duration / 60;
    var caloriesBurned = met * weightKg * hours;

    var fatEquivalentG  = (caloriesBurned / 7700) * 1000;
    var caloriesPerHour = (caloriesBurned / duration) * 60;
    var intensity = getIntensity(met);

    /* Weight Loss Impact — assume 3 sessions/week */
    var weeklyBurn  = caloriesBurned * 3;
    var monthlyBurn = caloriesBurned * 12;
    var monthlyFatLossKg = monthlyBurn / 7700;

    /* Food Equivalents */
    var foodEquivalents = FOOD_ITEMS.map(function (food) {
      return {
        name: food.name,
        kcal: food.kcal,
        qty:  caloriesBurned / food.kcal
      };
    });

    /* Compare Activities — same weight + duration */
    var compareResults = COMPARE_ACTIVITIES.map(function (act) {
      var isCurrent =
        (category === 'walking' && act.key === 'walking' && activity === 'normal-walking') ||
        (category === 'running' && act.key === 'running' && activity === 'running') ||
        (category === 'cycling' && act.key === 'cycling' && activity === 'moderate-cycling') ||
        (category === 'gym'     && act.key === 'hiit'    && activity === 'hiit');
      return {
        label: act.label,
        calories: act.met * weightKg * hours,
        isCurrent: isCurrent
      };
    });

    return {
      weightKg: weightKg,
      duration: duration,
      category: category,
      activity: activity,
      activityLabel: (ACTIVITY_LABELS[category] && ACTIVITY_LABELS[category][activity]) || activity,
      met: met,
      caloriesBurned: caloriesBurned,
      fatEquivalentG: fatEquivalentG,
      caloriesPerHour: caloriesPerHour,
      intensity: intensity,
      weeklyBurn: weeklyBurn,
      monthlyBurn: monthlyBurn,
      monthlyFatLossKg: monthlyFatLossKg,
      foodEquivalents: foodEquivalents,
      compareResults: compareResults
    };
  }

  /* ============================================
     FORMATTING HELPERS
  ============================================ */
  function roundClean(num) {
    if (num >= 100) return Math.round(num).toLocaleString();
    if (num >= 10)  return Math.round(num).toString();
    return (Math.round(num * 10) / 10).toString();
  }

  function roundQty(num) {
    if (num < 1)  return (Math.round(num * 10) / 10).toString();
    if (num < 10) return (Math.round(num * 2) / 2).toString(); /* nearest 0.5 */
    return Math.round(num).toString();
  }

  /* ============================================
     RENDER RESULTS
  ============================================ */
  function render(d) {

    /* Section 1 — Calorie Burn Snapshot */
    snapCaloriesEl.textContent  = roundClean(d.caloriesBurned);
    snapFatEl.textContent       = roundClean(d.fatEquivalentG);
    snapPerHourEl.textContent   = roundClean(d.caloriesPerHour);
    snapIntensityEl.textContent = d.intensity;

    /* Section 2 — Weight Loss Impact */
    weeklyBurnEl.textContent  = roundClean(d.weeklyBurn) + ' kcal';
    monthlyBurnEl.textContent = roundClean(d.monthlyBurn) + ' kcal';
    fatLossEl.textContent     = (Math.round(d.monthlyFatLossKg * 100) / 100) + ' kg';

    /* Section 3 — Food Equivalents */
    foodGridEl.innerHTML = d.foodEquivalents.map(function (f) {
      return '<div class="cb-food-item">' +
        '<span class="cb-food-name">' + f.name + '</span>' +
        '<span class="cb-food-amount">' + roundQty(f.qty) + 'x (' + f.kcal + ' kcal)</span>' +
        '</div>';
    }).join('');

    /* Section 4 — Compare Activities */
    compareGridEl.innerHTML = d.compareResults.map(function (c) {
      var highlightClass = c.isCurrent ? ' cb-compare-card--highlight' : '';
      var badge = c.isCurrent ? '<div class="cb-compare-badge">Selected</div>' : '';
      return '<div class="cb-compare-card' + highlightClass + '">' +
        badge +
        '<div class="cb-compare-value">' + roundClean(c.calories) + '</div>' +
        '<div class="cb-compare-unit">kcal</div>' +
        '<div class="cb-compare-name">' + c.label + '</div>' +
        '</div>';
    }).join('');

    /* Section 5 — Activity Breakdown */
    breakdownActivityEl.textContent  = d.activityLabel;
    breakdownMetEl.textContent       = d.met.toFixed(1);
    breakdownDurationEl.textContent  = d.duration + ' min';
    breakdownIntensityEl.textContent = d.intensity;
    breakdownFormulaEl.textContent =
      d.met.toFixed(1) + ' × ' + roundClean(d.weightKg) + ' kg × ' +
      (Math.round((d.duration / 60) * 100) / 100) + ' h = ' + roundClean(d.caloriesBurned) + ' kcal';

    /* Show results */
    resultsEl.hidden = false;

    /* Move related tools above SEO sections (after calculation) — mirrors water.js */
    var relatedWrap = document.getElementById('cb-related-tools');
    var seoSections = document.getElementById('cb-seo-sections');
    var toolWrap    = document.querySelector('.tool-wrap');
    var container   = document.querySelector('.container');


    if (relatedWrap && seoSections && container && toolWrap) {
      container.insertBefore(relatedWrap, seoSections);
    }

    /* Scroll results into view */
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    /* Trigger animations for fade-in elements */
    if (window.P50ToolBase) P50ToolBase.triggerAnimations();
  }

  /* ============================================
     CALCULATE BUTTON
  ============================================ */
  calcBtn.addEventListener('click', function () {
    if (!validate()) return;
    var data = calculate();
    render(data);
    saveState();
  });

  /* Enter key on number inputs triggers calculation */
  document.querySelectorAll('#cb-weight, #cb-duration').forEach(function (el) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (!validate()) return;
        var data = calculate();
        render(data);
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
    weightEl.value = '';
    durationEl.value = '';

    /* Reset selects to defaults */
    weightUnitEl.value = 'kg';
    weightUnitEl.dataset.prevUnit = 'kg';
    categoryEl.value = 'walking';
    populateActivities('walking');

    /* Reset weight label */
    applyWeightUnit('kg');

    /* Hide results and validation */
    resultsEl.hidden = true;
    hideValidation();

    /* Move related tools back inside the tool wrap */
    var relatedWrap = document.getElementById('cb-related-tools');
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
      weight:     weightEl.value,
      weightUnit: weightUnitEl.value,
      category:   categoryEl.value,
      activity:   activityEl.value,
      duration:   durationEl.value
    });
  }

  /* Wire autosave to all inputs */
  weightEl.addEventListener('input', scheduleSave);
  durationEl.addEventListener('input', scheduleSave);
  activityEl.addEventListener('change', scheduleSave);

  /* ============================================
     RESTORE STATE ON LOAD
     Inputs only — never restores results.
  ============================================ */
  function restoreState() {
    if (!window.P50Storage) return;
    var saved = P50Storage.get(STORAGE_KEY, null);
    if (!saved) return;

    if (saved.weightUnit) {
      weightUnitEl.value = saved.weightUnit;
      weightUnitEl.dataset.prevUnit = saved.weightUnit;
      applyWeightUnit(saved.weightUnit);
    }
    if (saved.weight) weightEl.value = saved.weight;

    if (saved.category && MET_VALUES.hasOwnProperty(saved.category)) {
      categoryEl.value = saved.category;
      populateActivities(saved.category, saved.activity);
    }

    if (saved.duration) durationEl.value = saved.duration;
  }

  /* ============================================
     RELATED TOOLS
     Same category (health-fitness) only.
     Max 4 tools. Excludes self. No fake tools.
     Mirrors macro.js / water.js renderRelatedTools pattern.
  ============================================ */
  function renderRelatedTools() {
    var relatedGrid = document.getElementById('cb-related-grid');
    if (!relatedGrid) return;

    fetch('/data/tools.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var related = (data.allTools || [])
          .filter(function (t) {
            return t.category === 'health-fitness' && t.id !== 'calorie-burn-calculator';
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
      { id: 'macro-calculator',        name: 'Macro Calculator',        description: 'Calculate daily protein, fat and carb targets',         link: '/tools/macro-calculator/',        icon: 'beef'     },
      { id: 'daily-calorie-planner',   name: 'Daily Calorie Planner',   description: 'Calculate your BMR, TDEE and target calories',          link: '/tools/daily-calorie-planner/',   icon: 'salad'    },
      { id: 'body-fat-calculator',     name: 'Body Fat Calculator',     description: 'Calculate your body fat percentage',                    link: '/tools/body-fat-calculator/',     icon: 'ruler'    },
      { id: 'water-intake-calculator', name: 'Water Intake Calculator', description: 'Calculate your personalised daily hydration target',    link: '/tools/water-intake-calculator/', icon: 'droplets' }
    ];
  }

  function buildRelatedHTML(grid, tools) {
    var html = '';
    tools.forEach(function (t) {
      if (window.P50Renderers && P50Renderers.relatedToolCard) {
        html += P50Renderers.relatedToolCard(t);
      } else if (window.P50Icons && window.P50IconMap) {
        var key      = P50IconMap.forTool(t.id) || (t.icon || 'wrench');
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
  populateActivities('walking');
  restoreState();
  renderRelatedTools();

})();
