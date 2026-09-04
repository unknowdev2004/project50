/* ============================================
   PROTEIN.JS — Project 50
   Protein Calculator

   Formulas (g protein per kg bodyweight):
   Goal factors:
     Maintenance:  Min=1.2  Rec=1.4  Opt=1.6
     Fat Loss:     Min=1.6  Rec=1.9  Opt=2.2
     Muscle Gain:  Min=1.8  Rec=2.1  Opt=2.4

   Activity bonus added to all three factors:
     Sedentary       = +0.0
     Lightly Active  = +0.1
     Moderately Act. = +0.2
     Very Active     = +0.3
     Athlete         = +0.4

   Protein (g) = Weight (kg) × (factor + bonus)
   All values capped at 350g/day.

   Food equivalents (protein per unit):
     Egg          = 6g each
     Chicken Breast = 31g per 100g
     Milk         = 3.4g per 100ml
     Whey Scoop   = 24g each

   Storage key: p50_protein_calculator
   Autosave: 300ms debounce on inputs
   Restore: inputs only, results hidden
   Reset: clears storage + fields
============================================ */

(function () {
  'use strict';

  /* ---- Storage key ---- */
  var STORAGE_KEY = 'p50_protein_calculator';

  /* ---- Autosave timer ---- */
  var _saveTimer = null;

  /* ---- DOM refs — Inputs ---- */
  var weightEl     = document.getElementById('protein-weight');
  var weightUnitEl = document.getElementById('protein-weight-unit');
  var goalEl       = document.getElementById('protein-goal');
  var activityEl   = document.getElementById('protein-activity');

  /* ---- DOM refs — UI ---- */
  var calcBtn   = document.getElementById('protein-calc-btn');
  var resetBtn  = document.getElementById('protein-reset-btn');
  var validEl   = document.getElementById('protein-validation');
  var resultsEl = document.getElementById('protein-results');

  /* ---- DOM refs — Result outputs ---- */
  var minEl          = document.getElementById('protein-min');
  var recEl          = document.getElementById('protein-rec');
  var optEl          = document.getElementById('protein-opt');
  var recInlineEl    = document.getElementById('protein-rec-inline');
  var mealGridEl     = document.getElementById('protein-meal-grid');
  var foodGridEl     = document.getElementById('protein-food-grid');
  var activityGridEl = document.getElementById('protein-activity-grid');
  var snapshotGridEl = document.getElementById('protein-snapshot-grid');

  /* ============================================
     GOAL DEFINITIONS
  ============================================ */
  var GOALS = {
    'maintain': { label: 'Maintain Weight', min: 1.2, rec: 1.4, opt: 1.6 },
    'lose':     { label: 'Lose Fat',        min: 1.6, rec: 1.9, opt: 2.2 },
    'build':    { label: 'Build Muscle',    min: 1.8, rec: 2.1, opt: 2.4 }
  };

  var ACTIVITY_LEVELS = [
    { key: 'sedentary',          label: 'Sedentary',          bonus: 0.0 },
    { key: 'lightly-active',     label: 'Lightly Active',     bonus: 0.1 },
    { key: 'moderately-active',  label: 'Moderately Active',  bonus: 0.2 },
    { key: 'very-active',        label: 'Very Active',        bonus: 0.3 },
    { key: 'athlete',            label: 'Athlete',            bonus: 0.4 }
  ];

  var MAX_PROTEIN = 350;

  /* ============================================
     FOOD REFERENCE VALUES
  ============================================ */
  /*
   * Food data: proteinPerUnit = grams of protein in one display unit.
   * qty formula per food:
   *   Eggs         → ceil(rec / 6)       → "N eggs"
   *   Chicken      → round(rec / 0.31)g  → "Ng" (31g per 100g = 0.31g/g)
   *   Milk         → round(rec / 0.034)ml, displayed as L if >=1000
   *   Whey Scoops  → ceil(rec / 24)      → "N scoops"
   */
  var FOODS = [
    {
      iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4 0 8-3 8-9 0-4-4-7-8-7S4 9 4 13c0 6 4 9 8 9z"/><path d="M12 6V3"/><path d="M9 5l3-2 3 2"/></svg>',
      name: 'Eggs',
      calcQty: function (rec) { return Math.ceil(rec / 6); },
      unitLabel: function (qty) { return qty + ' eggs'; },
      qtyDisplay: function (qty) { return qty; },
      unitSub: 'whole eggs'
    },
    {
      iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.13 1 6 16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V1"/><path d="M14.05 1 14 5a2 2 0 0 1-2 2H6"/><path d="M10 1v4"/></svg>',
      name: 'Chicken Breast',
      calcQty: function (rec) { return Math.round(rec / 0.31); },
      qtyDisplay: function (qty) { return qty; },
      unitSub: 'grams (raw)'
    },
    {
      iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8l1 8H7L8 2z"/><path d="M7 10c0 6 2 10 5 10s5-4 5-10"/><path d="M6.5 15h11"/></svg>',
      name: 'Milk',
      calcQty: function (rec) { return Math.round(rec / 0.034); },
      qtyDisplay: function (qty) {
        if (qty >= 1000) { return (qty / 1000).toFixed(1) + 'L'; }
        return qty + 'ml';
      },
      unitSub: 'whole milk'
    },
    {
      iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
      name: 'Whey Scoops',
      calcQty: function (rec) { return Math.ceil(rec / 24); },
      qtyDisplay: function (qty) { return qty; },
      unitSub: 'scoops (~24g ea)'
    }
  ];

  /* ============================================
     PREVENT WHEEL SCROLL ON NUMBER INPUTS
  ============================================ */
  var numberInputs = document.querySelectorAll('#protein-weight');
  numberInputs.forEach(function (el) {
    el.addEventListener('wheel', function (e) {
      el.blur();
      e.preventDefault();
    }, { passive: false });
  });

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
    var label = document.getElementById('protein-weight-label');
    var hint  = document.getElementById('protein-weight-hint');
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
     UNIT CONVERSION HELPER
  ============================================ */
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
    var weightKg = getWeightInKg();
    if (isNaN(weightKg) || weightKg < 20 || weightKg > 300) {
      return 'Please enter a valid weight (20–300 kg or 44–660 lbs).';
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
  function cap(val) {
    return Math.min(Math.round(val), MAX_PROTEIN);
  }

  function calcProtein(weightKg, goalKey, activityKey) {
    var goal = GOALS[goalKey];
    var activ = ACTIVITY_LEVELS.filter(function (a) { return a.key === activityKey; })[0];
    var bonus = activ ? activ.bonus : 0;

    return {
      min: cap(weightKg * (goal.min + bonus)),
      rec: cap(weightKg * (goal.rec + bonus)),
      opt: cap(weightKg * (goal.opt + bonus))
    };
  }

  /* ============================================
     RENDER — Card 1: Daily Protein Targets
  ============================================ */
  function renderTargets(targets) {
    minEl.textContent = targets.min;
    recEl.textContent = targets.rec;
    optEl.textContent = targets.opt;
    recInlineEl.textContent = targets.rec;
  }

  /* ============================================
     RENDER — Card 2: Protein Per Meal
  ============================================ */
  function renderMeals(rec) {
    var meals = [3, 4, 5, 6];
    mealGridEl.innerHTML = meals.map(function (n) {
      var per = Math.round(rec / n);
      return '<div class="protein-meal-item">' +
        '<div class="protein-meal-label">' + n + ' Meals</div>' +
        '<div class="protein-meal-value">' + per + '</div>' +
        '<div class="protein-meal-unit">g per meal</div>' +
        '</div>';
    }).join('');
  }

  /* ============================================
     RENDER — Card 3: Food Equivalents
  ============================================ */
  function renderFoods(rec) {
    foodGridEl.innerHTML = FOODS.map(function (f) {
      var rawQty = f.calcQty(rec);
      var display = f.qtyDisplay(rawQty);
      return '<div class="protein-food-item">' +
        '<div class="protein-food-icon">' + f.iconSvg + '</div>' +
        '<div class="protein-food-name">' + f.name + '</div>' +
        '<div class="protein-food-qty">' + display + '</div>' +
        '<div class="protein-food-unit">' + f.unitSub + '</div>' +
        '</div>';
    }).join('');
  }

  /* ============================================
     RENDER — Card 4: Activity Comparison
  ============================================ */
  function renderActivityComparison(weightKg, goalKey, currentActivityKey) {
    var goal = GOALS[goalKey];
    activityGridEl.innerHTML = ACTIVITY_LEVELS.map(function (activ) {
      var isCurrent = activ.key === currentActivityKey;
      var rec = cap(weightKg * (goal.rec + activ.bonus));
      var badgeHtml = isCurrent
        ? '<span class="protein-activity-current-badge">You</span>'
        : '';
      return '<div class="protein-activity-item' + (isCurrent ? ' protein-activity-item--current' : '') + '">' +
        '<div class="protein-activity-name">' + activ.label + badgeHtml + '</div>' +
        '<div class="protein-activity-val">' + rec + '<span class="protein-activity-unit">g/day</span></div>' +
        '</div>';
    }).join('');
  }

  /* ============================================
     RENDER — Card 5: Protein Snapshot
  ============================================ */
  function renderSnapshot(weightKg, goalKey, activityKey, rec) {
    var goal = GOALS[goalKey];
    var activ = ACTIVITY_LEVELS.filter(function (a) { return a.key === activityKey; })[0];
    var weightDisplay = weightUnitEl.value === 'lbs'
      ? Math.round(weightKg * 2.20462) + ' lbs'
      : Math.round(weightKg) + ' kg';
    var perMeal4 = Math.round(rec / 4);

    var stats = [
      { value: weightDisplay,       label: 'Weight' },
      { value: goal.label,          label: 'Goal' },
      { value: activ ? activ.label : '—', label: 'Activity' },
      { value: rec + 'g/day',       label: 'Recommended' },
      { value: '≈' + perMeal4 + 'g', label: 'Per Meal (4)' }
    ];

    snapshotGridEl.innerHTML = stats.map(function (s) {
      return '<div class="tool-stat">' +
        '<div class="tool-stat-value">' + s.value + '</div>' +
        '<div class="tool-stat-label">' + s.label + '</div>' +
        '</div>';
    }).join('');
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

    var weightKg    = getWeightInKg();
    var goalKey     = goalEl.value;
    var activityKey = activityEl.value;

    var targets = calcProtein(weightKg, goalKey, activityKey);

    renderTargets(targets);
    renderMeals(targets.rec);
    renderFoods(targets.rec);
    renderActivityComparison(weightKg, goalKey, activityKey);
    renderSnapshot(weightKg, goalKey, activityKey, targets.rec);

    resultsEl.hidden = false;

    /* DOM reposition: move related tools above SEO sections */
    var relatedEl   = document.getElementById('protein-related-tools');
    var seoSections = document.querySelector('.tool-seo-sections');
   
  });

  /* ============================================
     RESET
  ============================================ */
  resetBtn.addEventListener('click', function () {
    clearTimeout(_saveTimer);
    if (typeof P50Storage !== 'undefined') {
      P50Storage.remove(STORAGE_KEY);
    } else {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }

    weightEl.value      = '';
    weightUnitEl.value  = 'kg';
    goalEl.value        = 'lose';
    activityEl.value    = 'moderately-active';
    weightUnitEl.dataset.prevUnit = 'kg';
    applyWeightUnit('kg');

    validEl.hidden  = true;
    resultsEl.hidden = true;

    /* Move related tools back inside tool-wrap */
    var relatedEl = document.getElementById('protein-related-tools');
    var toolWrap  = document.querySelector('.tool-wrap');
    if (relatedEl && toolWrap) {
      toolWrap.appendChild(relatedEl);
    }
  });

  /* ============================================
     AUTOSAVE — 300ms debounce on inputs
  ============================================ */
  function scheduleSave() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(saveState, 300);
  }

  function saveState() {
    var data = {
      weight:     weightEl.value,
      weightUnit: weightUnitEl.value,
      goal:       goalEl.value,
      activity:   activityEl.value
    };
    var serialised = JSON.stringify(data);
    if (typeof P50Storage !== 'undefined') {
      P50Storage.set(STORAGE_KEY, serialised);
    } else {
      try { localStorage.setItem(STORAGE_KEY, serialised); } catch (e) {}
    }
  }

  /* ============================================
     RESTORE — inputs only, results hidden
  ============================================ */
  function restoreState() {
    var raw;
    if (typeof P50Storage !== 'undefined') {
      raw = P50Storage.get(STORAGE_KEY, null);
    } else {
      try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    }
    if (!raw) return;

    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }

    if (data.weightUnit) {
      weightUnitEl.value = data.weightUnit;
      weightUnitEl.dataset.prevUnit = data.weightUnit;
      applyWeightUnit(data.weightUnit);
    }
    if (data.weight) weightEl.value = data.weight;
    if (data.goal && GOALS[data.goal]) goalEl.value = data.goal;
    /* Migrate legacy goal keys from pre-standard storage */
    var GOAL_MIGRATE = { 'fat-loss': 'lose', 'maintenance': 'maintain', 'muscle-gain': 'build' };
    if (data.goal && GOAL_MIGRATE[data.goal]) goalEl.value = GOAL_MIGRATE[data.goal];
    if (data.activity) activityEl.value = data.activity;
  }

  /* ============================================
     INPUT LISTENERS — autosave
  ============================================ */
  [weightEl, weightUnitEl, goalEl, activityEl].forEach(function (el) {
    el.addEventListener('change', scheduleSave);
    if (el.type === 'number') {
      el.addEventListener('input', scheduleSave);
    }
  });

  /* ============================================
     RELATED TOOLS
  ============================================ */
  var FALLBACK_RELATED = [
    {
      id: 'tdee-calculator',
      name: 'TDEE Calculator',
      description: 'Calculate your Total Daily Energy Expenditure and calorie targets.',
      icon: 'trending-up',
      link: '/tools/tdee-calculator/'
    },
    {
      id: 'macro-calculator',
      name: 'Macro Calculator',
      description: 'Break your daily calories into protein, carbs and fat targets.',
      icon: 'beef',
      link: '/tools/macro-calculator/'
    },
    {
      id: 'daily-calorie-planner',
      name: 'Daily Calorie Planner',
      description: 'Plan your daily calorie intake for your body and goals.',
      icon: 'salad',
      link: '/tools/daily-calorie-planner/'
    },
    {
      id: 'water-intake-calculator',
      name: 'Water Intake Calculator',
      description: 'Find out how much water you should drink each day.',
      icon: 'droplets',
      link: '/tools/water-intake-calculator/'
    }
  ];

  function renderRelated(tools) {
    var grid = document.getElementById('protein-related-grid');
    if (!grid) return;
    if (typeof P50Renderers !== 'undefined') {
      grid.innerHTML = tools.map(function (t) {
        return P50Renderers.relatedToolCard(t);
      }).join('');
    } else {
      grid.innerHTML = tools.map(function (t) {
        return '<a class="related-tool-card" href="' + t.link + '">' +
          '<span class="related-tool-name">' + t.name + '</span>' +
          '<span class="related-tool-desc">' + t.description + '</span>' +
          '</a>';
      }).join('');
    }
  }

  function loadRelated() {
    if (typeof P50Utils !== 'undefined' && P50Utils.fetchData) {
      P50Utils.fetchData('/data/tools.json').then(function (data) {
        var all = (data && data.allTools) ? data.allTools : [];
        var filtered = all
          .filter(function (t) {
            return t.category === 'health-fitness' && t.id !== 'protein-calculator';
          })
          .slice(0, 4);
        if (filtered.length > 0) {
          renderRelated(filtered);
        } else {
          renderRelated(FALLBACK_RELATED);
        }
      }).catch(function () {
        renderRelated(FALLBACK_RELATED);
      });
    } else {
      renderRelated(FALLBACK_RELATED);
    }
  }

  /* ============================================
     INIT
  ============================================ */
  restoreState();
  loadRelated();

})();
