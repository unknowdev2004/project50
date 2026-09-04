/* ============================================
   WATER.JS — Project 50
   Water Intake Calculator

   Formula:
     Base Need  = 35ml × weight (kg)

   Activity bonus (ml):
     Sedentary      +0
     Lightly Active +250
     Moderately     +500
     Very Active    +750
     Athlete       +1000

   Climate bonus (ml):
     Cool     +0
     Moderate +250
     Hot      +500
     Very Hot +750

   Final Target = Base + Activity + Climate

   Summary range:
     Minimum  = Final × 0.8
     Recommended = Final
     Optimal  = Final × 1.1

   Glasses = Final ÷ 250 (1 glass = 250ml)

   STORAGE KEY: p50_water_intake_calculator
   AUTOSAVE: 300ms debounce, inputs only

   Refactored UI IDs to match new macro-style card structure.
   All formulas, storage, related tools and integrations preserved.
============================================ */

(function () {
  'use strict';

  /* ---- Storage key ---- */
  var STORAGE_KEY = 'p50_water_intake_calculator';

  /* ---- Autosave timer ---- */
  var _saveTimer = null;

  /* ---- Activity bonus map (ml) ---- */
  var ACTIVITY_BONUS = {
    sedentary: 0,
    light:     250,
    moderate:  500,
    very:      750,
    athlete:   1000
  };

  /* ---- Activity labels ---- */
  var ACTIVITY_LABEL = {
    sedentary: 'Sedentary',
    light:     'Lightly Active',
    moderate:  'Moderately Active',
    very:      'Very Active',
    athlete:   'Athlete'
  };

  /* ---- Climate bonus map (ml) ---- */
  var CLIMATE_BONUS = {
    cool:      0,
    moderate:  250,
    hot:       500,
    'very-hot': 750
  };

  /* ---- Climate labels ---- */
  var CLIMATE_LABEL = {
    cool:      'Cool Climate',
    moderate:  'Moderate Climate',
    hot:       'Hot Climate',
    'very-hot': 'Very Hot Climate'
  };

  /* ---- DOM refs — Inputs ---- */
  var weightEl     = document.getElementById('water-weight');
  var weightUnitEl = document.getElementById('water-weight-unit');
  var activityEl   = document.getElementById('water-activity');
  var climateEl    = document.getElementById('water-climate');

  /* ---- DOM refs — UI ---- */
  var calcBtn    = document.getElementById('water-calc-btn');
  var resetBtn   = document.getElementById('water-reset-btn');
  var validEl    = document.getElementById('water-validation');
  var resultsEl  = document.getElementById('water-results');

  /* ---- DOM refs — Summary card (Card 1) ---- */
  var summaryMinEl     = document.getElementById('summary-min');
  var summaryRecEl     = document.getElementById('summary-rec');
  var summaryOptEl     = document.getElementById('summary-opt');
  var summaryGlassesEl = document.getElementById('summary-glasses');

  /* ---- Card 2 is now static/educational — no DOM refs needed ---- */

  /* ---- DOM refs — Breakdown (Card 3) ---- */
  var wbBaseEl     = document.getElementById('wb-base');
  var wbActivityEl = document.getElementById('wb-activity');
  var wbClimateEl  = document.getElementById('wb-climate');
  var wbTotalEl    = document.getElementById('wb-total');

  /* ---- DOM refs — Schedule (Card 4) ---- */
  var scheduleListEl = document.getElementById('water-schedule-list');

  /* ---- DOM refs — Conversions (Card 5) ---- */
  var convGlassesEl = document.getElementById('conv-glasses');
  var conv500mlEl   = document.getElementById('conv-500ml');
  var conv1lEl      = document.getElementById('conv-1l');
  var conv2lEl      = document.getElementById('conv-2l');

  /* ============================================
     PREVENT WHEEL SCROLL ON NUMBER INPUTS
     Same pattern as macro.js, body-fat.js, etc.
  ============================================ */
  document.querySelectorAll('#water-weight').forEach(function (el) {
    el.addEventListener('wheel', function (e) {
      el.blur();
      e.preventDefault();
    }, { passive: false });
  });

  /* ============================================
     WEIGHT UNIT SWITCHER — with value conversion
     Mirrors macro.js pattern exactly.
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
    document.getElementById('water-weight-label').textContent = isKg ? 'Weight (kg)' : 'Weight (lbs)';
    document.getElementById('water-weight-hint').textContent  = isKg ? '20–300 kg'   : '45–660 lbs';
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
     AUTOSAVE — 300ms debounce
     Same pattern as macro.js.
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
      activity:   activityEl.value,
      climate:    climateEl.value
    });
  }

  /* Wire autosave to all inputs */
  weightEl.addEventListener('input', scheduleSave);
  activityEl.addEventListener('change', scheduleSave);
  climateEl.addEventListener('change', scheduleSave);

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
    if (saved.weight)   weightEl.value   = saved.weight;
    if (saved.activity) activityEl.value = saved.activity;
    if (saved.climate)  climateEl.value  = saved.climate;
  }

  /* ============================================
     VALIDATION
  ============================================ */
  function validate() {
    var weightKg = getWeightKg();
    if (isNaN(weightKg) || weightKg < 20 || weightKg > 300) {
      showValidation('Please enter a valid weight (20–300 kg or equivalent).');
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
     CALCULATION ENGINE
     All formulas preserved exactly.
  ============================================ */
  function calculate() {
    var weightKg  = getWeightKg();
    var activity  = activityEl.value;
    var climate   = climateEl.value;

    /* Base need: 35ml per kg */
    var baseNeed = Math.round(weightKg * 35);

    /* Bonuses */
    var activityBonus = ACTIVITY_BONUS[activity] || 0;
    var climateBonus  = CLIMATE_BONUS[climate]   || 0;

    /* Final target (ml) */
    var finalTarget = baseNeed + activityBonus + climateBonus;

    /* Summary range */
    var minWater = Math.round(finalTarget * 0.8);
    var optWater = Math.round(finalTarget * 1.1);

    /* Glasses (1 glass = 250ml) */
    var glasses = Math.round(finalTarget / 250);

    return {
      weightKg:      Math.round(weightKg * 10) / 10,
      activity:      activity,
      climate:       climate,
      baseNeed:      baseNeed,
      activityBonus: activityBonus,
      climateBonus:  climateBonus,
      finalTarget:   finalTarget,
      minWater:      minWater,
      optWater:      optWater,
      glasses:       glasses
    };
  }

  /* ============================================
     FORMAT HELPERS
  ============================================ */
  function mlToLiters(ml) {
    return (ml / 1000).toFixed(1);
  }

  function mlLabel(ml) {
    if (ml === 0) return '+0 ml';
    return '+' + ml.toLocaleString() + ' ml';
  }

  function mlLabelTotal(ml) {
    return (ml / 1000).toFixed(2).replace(/\.?0+$/, '') + ' L (' + ml.toLocaleString() + ' ml)';
  }

  /* ============================================
     DRINKING SCHEDULE GENERATOR
     Generates realistic, human-scale sessions.

     Algorithm:
       • Hard cap: 500 ml per drinking event
       • Min slots: 6 (always spread across the day)
       • For moderate totals (≤4 000 ml): 6–8 slots
         drawn from TIME_POOL_NORMAL (7 AM – 9 PM)
       • For high totals (>4 000 ml): up to 17 slots
         drawn from TIME_POOL_EXT (6:30 AM – 10 PM)
       • Base amount = floor(total / slots) rounded
         down to nearest 50 ml
       • Remainder (in 50 ml units) is distributed
         back-to-front so no single slot spikes
       • Sum always equals totalMl exactly
  ============================================ */
  var _TIME_POOL_NORMAL = [
    { time: '7:00 AM',  label: 'Wake up — rehydrate after sleep'      },
    { time: '9:00 AM',  label: 'Mid-morning — before the caffeine dip' },
    { time: '11:00 AM', label: 'Late morning — steady energy'          },
    { time: '1:00 PM',  label: 'With lunch — aid digestion'            },
    { time: '3:00 PM',  label: 'Afternoon — stay alert'                },
    { time: '5:00 PM',  label: 'Late afternoon — replenish'            },
    { time: '7:00 PM',  label: 'Evening — replenish after dinner'      },
    { time: '9:00 PM',  label: 'Before bed — stay topped up'           }
  ];

  var _TIME_POOL_EXT = [
    { time: '6:30 AM',  label: 'Wake up — rehydrate after sleep'        },
    { time: '7:30 AM',  label: 'Morning — start your day hydrated'      },
    { time: '8:30 AM',  label: 'Mid-morning — before the caffeine dip'  },
    { time: '9:30 AM',  label: 'Mid-morning — beat the midday dip'      },
    { time: '10:30 AM', label: 'Late morning — steady energy'           },
    { time: '11:30 AM', label: 'Before lunch — aid digestion'           },
    { time: '12:30 PM', label: 'With lunch — aid digestion'             },
    { time: '1:30 PM',  label: 'Post-lunch — avoid the afternoon slump' },
    { time: '2:30 PM',  label: 'Afternoon — stay alert'                 },
    { time: '3:30 PM',  label: 'Late afternoon — steady energy'         },
    { time: '4:30 PM',  label: 'End of afternoon — replenish'           },
    { time: '5:30 PM',  label: 'Early evening — wind down'              },
    { time: '6:30 PM',  label: 'Evening — replenish after dinner'       },
    { time: '7:30 PM',  label: 'Evening — stay topped up'               },
    { time: '8:30 PM',  label: 'Night — final top-up'                   },
    { time: '9:30 PM',  label: 'Before bed — stay topped up'            },
    { time: '10:00 PM', label: 'Before sleep — final sip'               }
  ];

  function buildSchedule(totalMl) {
    var MAX_SERVING = 500;
    var MIN_SLOTS   = 6;

    /* Choose pool: extended only when a high volume truly needs it */
    var numSlotsNeeded = Math.max(MIN_SLOTS, Math.ceil(totalMl / MAX_SERVING));
    var pool = (numSlotsNeeded <= _TIME_POOL_NORMAL.length)
      ? _TIME_POOL_NORMAL
      : _TIME_POOL_EXT;
    var numSlots = Math.min(numSlotsNeeded, pool.length);

    /* Pick evenly-spaced entries from the chosen pool */
    var slots = [];
    if (numSlots >= pool.length) {
      slots = pool.slice();
    } else {
      var step = (pool.length - 1) / (numSlots - 1);
      for (var i = 0; i < numSlots; i++) {
        slots.push(pool[Math.round(i * step)]);
      }
    }

    /* Base amount: floor to nearest 50 ml */
    var baseAmount = Math.floor((totalMl / numSlots) / 50) * 50;
    var items = slots.map(function (s) {
      return { time: s.time, label: s.label, amount: baseAmount };
    });

    /* Distribute remainder (in 50 ml chunks) back-to-front */
    var remainder50 = Math.round((totalMl - baseAmount * numSlots) / 50);
    for (var j = 0; j < remainder50 && j < items.length; j++) {
      items[items.length - 1 - j].amount += 50;
    }

    /* Find max for progress-bar scaling */
    var maxAmount = 0;
    for (var k = 0; k < items.length; k++) {
      if (items[k].amount > maxAmount) maxAmount = items[k].amount;
    }

    return { items: items, maxAmount: maxAmount };
  }

  /* ============================================
     RENDER RESULTS
  ============================================ */
  function render(d) {

    /* Card 1 — Recommended Daily Hydration summary */
    summaryMinEl.textContent     = mlToLiters(d.minWater);
    summaryRecEl.textContent     = mlToLiters(d.finalTarget);
    summaryOptEl.textContent     = mlToLiters(d.optWater);
    summaryGlassesEl.textContent = d.glasses;

    /* Card 2 — Hydration Range Explained (static educational card — no data render needed) */

    /* Card 3 — Breakdown */
    wbBaseEl.textContent     = d.baseNeed.toLocaleString() + ' ml';
    wbActivityEl.textContent = mlLabel(d.activityBonus);
    wbClimateEl.textContent  = mlLabel(d.climateBonus);
    wbTotalEl.textContent    = mlLabelTotal(d.finalTarget);

    /* Card 4 — Schedule */
    var schedule = buildSchedule(d.finalTarget);
    scheduleListEl.innerHTML = schedule.items.map(function (item) {
      var pct = schedule.maxAmount
        ? Math.round((item.amount / schedule.maxAmount) * 100)
        : 100;
      return '<div class="water-schedule-item">' +
        '<span class="water-schedule-time">' + item.time + '</span>' +
        '<span class="water-schedule-amount">' + item.amount.toLocaleString() + ' ml</span>' +
        '<span class="water-schedule-label">' + item.label + '</span>' +
        '<div class="water-schedule-bar-wrap">' +
          '<div class="water-schedule-bar" style="width:' + pct + '%"></div>' +
        '</div>' +
      '</div>';
    }).join('');

    /* Card 5 — Conversions */
    convGlassesEl.textContent = Math.round(d.finalTarget / 250);
    conv500mlEl.textContent   = (d.finalTarget / 500).toFixed(1);
    conv1lEl.textContent      = (d.finalTarget / 1000).toFixed(1);
    conv2lEl.textContent      = (d.finalTarget / 2000).toFixed(1);

    /* Show results */
    resultsEl.hidden = false;

    /* Move related tools above SEO sections (after calculation) */
    var relatedWrap = document.getElementById('water-related-tools');
    var seoSections = document.getElementById('water-seo-sections');
    var toolWrap    = document.querySelector('.tool-wrap');
    var container   = document.querySelector('.container');

    if (relatedWrap && seoSections && container && toolWrap) {
      /* Place related tools between .tool-wrap and .tool-seo-sections */
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

  /* Enter key on weight input triggers calculation */
  weightEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (!validate()) return;
      var data = calculate();
      render(data);
      saveState();
    }
  });

  /* ============================================
     RESET
  ============================================ */
  resetBtn.addEventListener('click', resetAll);

  function resetAll() {
    clearTimeout(_saveTimer);

    /* Clear inputs */
    weightEl.value = '';

    /* Reset selects to defaults */
    weightUnitEl.value = 'kg';
    weightUnitEl.dataset.prevUnit = 'kg';
    activityEl.value = 'light';
    climateEl.value  = 'moderate';

    /* Reset weight label */
    applyWeightUnit('kg');

    /* Hide results and validation */
    resultsEl.hidden = true;
    hideValidation();

    /* Move related tools back inside the tool wrap */
    var relatedWrap = document.getElementById('water-related-tools');
    var toolWrap    = document.querySelector('.tool-wrap');
    if (relatedWrap && toolWrap) {
      toolWrap.appendChild(relatedWrap);
    }

    /* Clear storage */
    if (window.P50Storage) P50Storage.remove(STORAGE_KEY);
  }

  /* ============================================
     RELATED TOOLS
     Same category (health-fitness) only.
     Max 4 tools. Excludes self. No fake tools.
     Mirrors macro.js renderRelatedTools pattern.
  ============================================ */
  function renderRelatedTools() {
    var relatedGrid = document.getElementById('water-related-grid');
    if (!relatedGrid) return;

    fetch('/data/tools.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var related = (data.allTools || [])
          .filter(function (t) {
            return t.category === 'health-fitness' && t.id !== 'water-intake-calculator';
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
      { id: 'bmi-calculator',        name: 'BMI Calculator',        description: 'Check your Body Mass Index instantly',           link: '/tools/bmi-calculator/',        icon: 'scale' },
      { id: 'daily-calorie-planner', name: 'Daily Calorie Planner', description: 'Calculate your BMR, TDEE and target calories',    link: '/tools/daily-calorie-planner/', icon: 'salad' },
      { id: 'body-fat-calculator',   name: 'Body Fat Calculator',   description: 'Calculate your body fat percentage',              link: '/tools/body-fat-calculator/',   icon: 'ruler' },
      { id: 'macro-calculator',      name: 'Macro Calculator',      description: 'Calculate daily protein, fat and carb targets',   link: '/tools/macro-calculator/',      icon: 'beef'  }
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
  restoreState();
  renderRelatedTools();

})();
