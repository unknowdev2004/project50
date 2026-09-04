/* ============================================
   CALORIE.JS — Project 50
   Daily Calorie Planner

   Calculation method: Mifflin-St Jeor Equation
   BMR (male)   = 10×weight(kg) + 6.25×height(cm) − 5×age + 5
   BMR (female) = 10×weight(kg) + 6.25×height(cm) − 5×age − 161

   TDEE = BMR × activity multiplier

   Goal adjustments:
     Lose Weight  → TDEE − 500 kcal (moderate deficit)
     Maintain     → TDEE
     Gain Weight  → TDEE + 300 kcal (lean bulk surplus)

   Weight change assumption: 7,700 kcal ≈ 1 kg of body fat
   Weekly kcal delta = |dailyDelta| × 7
   Weeks to goal     = kgToChange × 7,700 / weeklyKcalDelta
============================================ */

(function () {
  'use strict';

  /* ---- DOM refs ---- */
  var ageEl        = document.getElementById('cal-age');
  var genderEl     = document.getElementById('cal-gender');
  var heightUnitEl = document.getElementById('cal-height-unit');
  var heightCmEl   = document.getElementById('cal-height-cm');
  var heightFtEl   = document.getElementById('cal-height-ft');
  var heightInEl   = document.getElementById('cal-height-in');
  var weightUnitEl = document.getElementById('cal-weight-unit');
  var weightEl     = document.getElementById('cal-weight');
  var weightGwEl   = document.getElementById('cal-goal-weight');
  var activityEl   = document.getElementById('cal-activity');
  var goalEl       = document.getElementById('cal-goal');
  var calcBtn      = document.getElementById('cal-calc-btn');
  var validEl      = document.getElementById('cal-validation');
  var resultsEl    = document.getElementById('cal-results');

  /* ---- Unit panels ---- */
  var heightMetricPanel   = document.getElementById('cal-height-metric');
  var heightImperialPanel = document.getElementById('cal-height-imperial');

  /* ---- Strategy labels ---- */
  var STRATEGY = {
    'aggressive-cut':  'Aggressive Cut',
    'moderate-cut':    'Moderate Cut',
    'maintenance':     'Maintenance',
    'lean-bulk':       'Lean Bulk',
    'aggressive-bulk': 'Aggressive Bulk',
  };

  /* ---- Prevent mouse-wheel from changing number input values ---- */
  /* Blurs the input on wheel to strip focus, then prevents default so the
     value never changes. Works across Chrome, Firefox, and Safari.      */
  var numberInputs = document.querySelectorAll(
    '#cal-age, #cal-height-cm, #cal-height-ft, #cal-height-in, #cal-weight, #cal-goal-weight'
  );
  numberInputs.forEach(function (el) {
    el.addEventListener('wheel', function (e) {
      el.blur();
      e.preventDefault();
    }, { passive: false });
  });

  /* ---- Unit switchers ---- */
  heightUnitEl.addEventListener('change', function () {
    var isMetric = heightUnitEl.value === 'cm';
    heightMetricPanel.hidden   = !isMetric;
    heightImperialPanel.hidden = isMetric;
    /* Update label */
    document.getElementById('cal-height-label').textContent =
      isMetric ? 'Height (cm)' : 'Height (ft / in)';
  });

  weightUnitEl.addEventListener('change', function () {
    var isKg = weightUnitEl.value === 'kg';
    document.getElementById('cal-weight-label').textContent     = isKg ? 'Weight (kg)' : 'Weight (lbs)';
    document.getElementById('cal-weight-hint').textContent      = isKg ? '20–300 kg' : '45–660 lbs';
    document.getElementById('cal-gw-label-unit').textContent    = isKg ? '(kg)' : '(lbs)';
    weightEl.placeholder  = isKg ? 'e.g. 75' : 'e.g. 165';
    weightGwEl.placeholder = isKg ? 'e.g. 68' : 'e.g. 150';
    if (isKg) {
      weightEl.min  = 20;   weightEl.max  = 300;
      weightGwEl.min = 20;  weightGwEl.max = 300;
    } else {
      weightEl.min  = 45;   weightEl.max  = 660;
      weightGwEl.min = 45;  weightGwEl.max = 660;
    }
  });

  /* ---- Wire calculate events ---- */
  calcBtn.addEventListener('click', run);
  document.querySelectorAll('#cal-age, #cal-height-cm, #cal-height-ft, #cal-height-in, #cal-weight, #cal-goal-weight').forEach(function (el) {
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
  });

  /* ---- Unit conversion helpers ---- */
  function getHeightCm() {
    if (heightUnitEl.value === 'cm') {
      return parseFloat(heightCmEl.value);
    }
    var ft  = parseFloat(heightFtEl.value) || 0;
    var inc = parseFloat(heightInEl.value) || 0;
    return (ft * 12 + inc) * 2.54;
  }

  function getWeightKg(rawVal) {
    var v = parseFloat(rawVal);
    if (isNaN(v)) return NaN;
    return weightUnitEl.value === 'kg' ? v : v * 0.453592;
  }

  /* ---- Main calculation ---- */
  function run() {
    hideValidation();

    var age      = parseFloat(ageEl.value);
    var gender   = genderEl.value;
    var heightCm = getHeightCm();
    var weightRaw = parseFloat(weightEl.value);
    var weight   = getWeightKg(weightRaw);
    var activity = parseFloat(activityEl.value);
    var goal     = goalEl.value;
    var goalWtRaw = weightGwEl.value !== '' ? parseFloat(weightGwEl.value) : null;
    var goalWt   = goalWtRaw !== null ? getWeightKg(goalWtRaw) : null;

    /* ---- Validate ---- */
    var err = validate(age, heightCm, weight, goal, goalWt);
    if (err) { showValidation(err); return; }

    /* ---- BMR — Mifflin-St Jeor ---- */
    var bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * heightCm - 5 * age - 161;
    }

    /* ---- TDEE ---- */
    var tdee = bmr * activity;

    /* ---- Goal calories + daily delta (signed: negative = deficit) ---- */
    var targetCals, dailyDelta, strategyKey;

    if (goal === 'lose') {
      targetCals = tdee - 500;
      dailyDelta = -500;   /* deficit */
      strategyKey = (targetCals < bmr + 200) ? 'aggressive-cut' : 'moderate-cut';
    } else if (goal === 'maintain') {
      targetCals = tdee;
      dailyDelta = 0;
      strategyKey = 'maintenance';
    } else {
      /* build */
      targetCals = tdee + 300;
      dailyDelta = 300;    /* surplus */
      strategyKey = (targetCals > tdee * 1.15) ? 'aggressive-bulk' : 'lean-bulk';
    }

    /* Calorie floor — Health Category Standard
       Male: 1500 kcal · Female: 1200 kcal
       Applied only to deficit (lose) goal. Visible warning shown to user. */
    var CAL_FLOOR = gender === 'male' ? 1500 : 1200;
    var calFloorTriggered = false;
    if (goal === 'lose' && targetCals < CAL_FLOOR) {
      targetCals  = CAL_FLOOR;
      dailyDelta  = Math.round(targetCals - tdee);
      calFloorTriggered = true;
    }

    /* ---- Macros ---- */
    var macros = calcMacros(weight, goal, targetCals, activity);

    /* ---- Render primary result ---- */
    renderPrimary(targetCals, bmr, tdee, strategyKey, goal);

    /* ---- Render recommendation summary ---- */
    renderSummary(targetCals, macros, dailyDelta, goal);

    /* ---- Render forecast (if goal weight provided) ---- */
    if (goalWt !== null) {
      renderForecast(weight, goalWt, dailyDelta, weightUnitEl.value);
    } else {
      document.getElementById('cal-forecast-card').hidden = true;
    }

    /* ---- Render monthly projection ---- */
    renderProjection(weight, dailyDelta, weightUnitEl.value);

    /* ---- Render macros ---- */
    renderMacros(macros);

    /* ---- Show results ---- */
    resultsEl.hidden = false;
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (window.P50ToolBase) P50ToolBase.triggerAnimations();

    /* Floor warning */
    var floorWarnEl = document.getElementById('cal-floor-warning');
    if (floorWarnEl) floorWarnEl.hidden = !calFloorTriggered;

    /* Save state after successful calculation */
    saveState();

    /* Move related tools below results */
    var relatedWrap = document.getElementById('cal-related-tools');
    if (relatedWrap && resultsEl.nextElementSibling !== relatedWrap) {
      resultsEl.after(relatedWrap);
    }
  }

  /* ---- Validation ---- */
  function validate(age, heightCm, weightKg, goal, goalWtKg) {
    if (!age || isNaN(age) || age < 15 || age > 100) {
      return 'Please enter a valid age between 15 and 100.';
    }
    if (!heightCm || isNaN(heightCm) || heightCm < 100 || heightCm > 250) {
      if (heightUnitEl.value === 'cm') {
        return 'Please enter a valid height between 100 cm and 250 cm.';
      }
      return 'Please enter a valid height (4\'1\" – 8\'2\").';
    }
    if (!weightKg || isNaN(weightKg) || weightKg < 20 || weightKg > 300) {
      if (weightUnitEl.value === 'kg') {
        return 'Please enter a valid weight between 20 kg and 300 kg.';
      }
      return 'Please enter a valid weight between 45 lbs and 660 lbs.';
    }
    if (goalWtKg !== null) {
      if (isNaN(goalWtKg) || goalWtKg < 20 || goalWtKg > 300) {
        return weightUnitEl.value === 'kg'
          ? 'Goal weight must be between 20 kg and 300 kg.'
          : 'Goal weight must be between 45 lbs and 660 lbs.';
      }
      if (Math.abs(goalWtKg - weightKg) < 0.1) {
        return 'Your goal weight is the same as your current weight. Select "Maintain Weight" as your goal.';
      }
      if (goal === 'lose' && goalWtKg >= weightKg) {
        return 'Your goal weight is higher than your current weight. To lose weight, enter a goal weight below your current weight.';
      }
      if (goal === 'build' && goalWtKg <= weightKg) {
        return 'Your goal weight is lower than your current weight. To build muscle, enter a goal weight above your current weight.';
      }
    }
    return null;
  }

  /* ---- Macro calculation — Health Category Standard ---- */
  function calcMacros(weightKg, goal, targetCals, activity) {
    /* Canonical protein base rates (rec tier, g/kg) */
    var PROTEIN_BASE = {
      lose:     1.9,
      maintain: 1.4,
      build:    2.1
    };
    /* Activity bonus (g/kg) — matches Protein Calculator */
    var ACTIVITY_PROTEIN_BONUS = {
      1.2: 0.0, 1.375: 0.1, 1.55: 0.2, 1.725: 0.3, 1.9: 0.4
    };
    var actBonus = ACTIVITY_PROTEIN_BONUS[activity] || 0.0;
    var pBase    = PROTEIN_BASE[goal] || PROTEIN_BASE['maintain'];

    var protein = Math.round(weightKg * (pBase + actBonus));
    var fat     = Math.round(weightKg * 0.8);   /* 0.8 g/kg — canonical rec tier */

    /* Remaining calories → carbohydrates
       Protein = 4 kcal/g  |  Fat = 9 kcal/g  |  Carbs = 4 kcal/g */
    var proteinCals = protein * 4;
    var fatCals     = fat * 9;
    var carbsCals   = targetCals - proteinCals - fatCals;
    var carbs = Math.max(0, Math.round(carbsCals / 4));

    return { protein: protein, fat: fat, carbs: carbs };
  }

  /* ---- Display weight with current unit preference ---- */
  function displayWeight(kg, unit) {
    if (unit === 'lbs') {
      return (kg * 2.20462).toFixed(1) + ' lbs';
    }
    return kg.toFixed(1) + ' kg';
  }

  /* ---- Renderers ---- */

  function renderPrimary(targetCals, bmr, tdee, strategyKey, goal) {
    var targetRounded = Math.round(targetCals);

    /* Primary number */
    document.getElementById('cal-target-calories').innerHTML =
      targetRounded + '<span class="cal-unit">kcal</span>';

    /* Strategy badge */
    var badgeEl = document.getElementById('cal-strategy-badge');
    badgeEl.textContent = STRATEGY[strategyKey] || strategyKey;
    badgeEl.className   = 'cal-strategy-badge strategy-' + strategyKey;

    /* Stats */
    document.getElementById('cal-bmr-val').textContent  = Math.round(bmr)  + ' kcal';
    document.getElementById('cal-tdee-val').textContent = Math.round(tdee) + ' kcal';
    document.getElementById('cal-rec-val').textContent  = targetRounded    + ' kcal';

    /* Result explanation */
    var explanationEl = document.getElementById('cal-result-explanation');
    if (explanationEl) {
      var text = '';
      if (goal === 'lose') {
        var kgMonthLose = Math.round((500 * 30) / 7700 * 10) / 10;
        text = 'Your target is <strong>' + targetRounded + ' kcal/day</strong> — a <strong>500 kcal daily deficit</strong> below your maintenance level. At this rate, expect approximately <strong>' + kgMonthLose + ' kg per month</strong> of fat loss at a sustainable pace that protects muscle.';
      } else if (goal === 'maintain') {
        text = 'Your target is <strong>' + targetRounded + ' kcal/day</strong> — matching your estimated maintenance (TDEE). Eating consistently at this level keeps your weight stable. Adjust by ±100–200 kcal if your weight drifts after 2–3 weeks.';
      } else {
        var kgMonthGain = Math.round((300 * 30) / 7700 * 10) / 10;
        text = 'Your target is <strong>' + targetRounded + ' kcal/day</strong> — a <strong>300 kcal daily surplus</strong> above your maintenance level. This supports approximately <strong>' + kgMonthGain + ' kg per month</strong> of lean muscle gain when combined with resistance training.';
      }
      explanationEl.innerHTML = text;
    }
  }

  function renderSummary(targetCals, macros, dailyDelta, goal) {
    var summaryCard = document.getElementById('cal-summary-card');
    if (!summaryCard) return;

    var targetRounded = Math.round(targetCals);
    var items = [];

    items.push('Eat approximately <strong>' + targetRounded + ' kcal/day</strong>');
    items.push('Target <strong>' + macros.protein + ' g protein</strong> per day');

    if (goal === 'lose') {
      var kgPerMonth = Math.round((500 * 30) / 7700 * 10) / 10;
      items.push('Expect around <strong>' + kgPerMonth + ' kg (' + Math.round(kgPerMonth * 2.205 * 10) / 10 + ' lbs) fat loss</strong> per month');
    } else if (goal === 'build') {
      var kgPerMonthGain = Math.round((300 * 30) / 7700 * 10) / 10;
      items.push('Expect around <strong>' + kgPerMonthGain + ' kg (' + Math.round(kgPerMonthGain * 2.205 * 10) / 10 + ' lbs) muscle gain</strong> per month');
    } else {
      items.push('Your weight will remain <strong>stable</strong> at this intake');
    }

    items.push('Limit fat to approximately <strong>' + macros.fat + ' g/day</strong>');

    var html = '';
    items.forEach(function (item) {
      html += '<li><p>' + item + '</p></li>';
    });

    document.getElementById('cal-summary-list').innerHTML = html;
    summaryCard.hidden = false;
  }

  function renderForecast(currentWtKg, goalWtKg, dailyDelta, unit) {
    var card = document.getElementById('cal-forecast-card');

    if (dailyDelta === 0) {
      card.hidden = true;
      return;
    }

    var kgToChange   = Math.abs(goalWtKg - currentWtKg);
    var weeklyKcal   = Math.abs(dailyDelta) * 7;          /* kcal/week */
    var weeksToGoal  = (kgToChange * 7700) / weeklyKcal;
    var monthsToGoal = weeksToGoal / 4.33;

    document.getElementById('fc-current-weight').textContent = displayWeight(currentWtKg, unit);
    document.getElementById('fc-goal-weight').textContent    = displayWeight(goalWtKg, unit);
    document.getElementById('fc-weeks').textContent          = Math.round(weeksToGoal) + ' wks';
    document.getElementById('fc-months').textContent         = monthsToGoal.toFixed(1) + ' mo';

    card.hidden = false;
  }

  function renderProjection(startWeightKg, dailyDelta, unit) {
    var projCard = document.getElementById('cal-projection-card');
    var grid     = document.getElementById('cal-projection-grid');

    /* kg change per month: dailyDelta kcal × 30 days ÷ 7700 kcal/kg */
    var kgPerMonth = (dailyDelta * 30) / 7700;
    grid.innerHTML = '';

    var months = ['Month 1', 'Month 2', 'Month 3', 'Month 4'];

    months.forEach(function (label, i) {
      var projectedKg = startWeightKg + kgPerMonth * (i + 1);
      projectedKg = Math.max(20, Math.round(projectedKg * 10) / 10);

      var delta       = kgPerMonth * (i + 1);
      var deltaRounded = Math.round(delta * 10) / 10;
      var deltaStr, deltaClass;

      if (Math.abs(delta) < 0.05) {
        deltaStr   = 'No change';
        deltaClass = 'neutral';
      } else if (delta > 0) {
        deltaStr   = '+' + deltaRounded + ' kg';
        deltaClass = 'positive';
      } else {
        deltaStr   = deltaRounded + ' kg';
        deltaClass = 'negative';
      }

      var displayStr = unit === 'lbs'
        ? (projectedKg * 2.20462).toFixed(1) + ' lbs'
        : projectedKg + ' kg';

      var div = document.createElement('div');
      div.className = 'cal-projection-month';
      div.innerHTML =
        '<span class="cal-projection-label">' + label + '</span>' +
        '<div style="text-align:right">' +
          '<div class="cal-projection-weight">' + displayStr + '</div>' +
          '<div class="cal-projection-delta ' + deltaClass + '">' + deltaStr + '</div>' +
        '</div>';

      grid.appendChild(div);
    });

    projCard.hidden = false;
  }

  function renderMacros(macros) {
    document.getElementById('macro-protein').textContent = macros.protein;
    document.getElementById('macro-fat').textContent     = macros.fat;
    document.getElementById('macro-carbs').textContent   = macros.carbs;
  }

  /* ---- Validation display ---- */
  function showValidation(msg) {
    validEl.textContent = msg;
    validEl.hidden = false;
    resultsEl.hidden = true;
    validEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideValidation() {
    validEl.hidden = true;
    validEl.textContent = '';
  }

  /* ============================================
     PERSISTENCE — P50Storage
     Key: "p50_calorie"
     Autosave: 300ms debounce on all inputs/selects
     Restore: on page load
     Reset: clears storage immediately
  ============================================ */

  var STORAGE_KEY = 'p50_calorie';
  var _saveTimer  = null;

  function scheduleSave() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(saveState, 300);
  }

  function saveState() {
    if (!window.P50Storage) return;
    P50Storage.set(STORAGE_KEY, {
      age:        ageEl        ? ageEl.value        : '',
      gender:     genderEl     ? genderEl.value     : '',
      heightUnit: heightUnitEl ? heightUnitEl.value : 'cm',
      heightCm:   heightCmEl  ? heightCmEl.value   : '',
      heightFt:   heightFtEl  ? heightFtEl.value   : '',
      heightIn:   heightInEl  ? heightInEl.value   : '',
      weightUnit: weightUnitEl ? weightUnitEl.value : 'kg',
      weight:     weightEl     ? weightEl.value     : '',
      goalWeight: weightGwEl   ? weightGwEl.value   : '',
      activity:   activityEl   ? activityEl.value   : '',
      goal:       goalEl       ? goalEl.value       : '',
    });
  }

  function restoreState() {
    if (!window.P50Storage) return;
    var saved = P50Storage.get(STORAGE_KEY, null);
    if (!saved) return;

    if (ageEl        && saved.age)        ageEl.value        = saved.age;
    if (genderEl     && saved.gender)     genderEl.value     = saved.gender;
    if (weightEl     && saved.weight)     weightEl.value     = saved.weight;
    if (weightGwEl   && saved.goalWeight) weightGwEl.value   = saved.goalWeight;
    if (activityEl   && saved.activity)   activityEl.value   = saved.activity;
    /* Migrate legacy goal key 'gain' → 'build' */
    if (saved.goal === 'gain') saved.goal = 'build';
    if (goalEl       && saved.goal)       goalEl.value       = saved.goal;

    /* Restore height unit + panel */
    if (heightUnitEl && saved.heightUnit) {
      heightUnitEl.value = saved.heightUnit;
      var isMetric = saved.heightUnit === 'cm';
      heightMetricPanel.hidden   = !isMetric;
      heightImperialPanel.hidden = isMetric;
      document.getElementById('cal-height-label').textContent =
        isMetric ? 'Height (cm)' : 'Height (ft / in)';
    }
    if (heightCmEl && saved.heightCm) heightCmEl.value = saved.heightCm;
    if (heightFtEl && saved.heightFt) heightFtEl.value = saved.heightFt;
    if (heightInEl && saved.heightIn) heightInEl.value = saved.heightIn;

    /* Restore weight unit labels */
    if (weightUnitEl && saved.weightUnit) {
      weightUnitEl.value = saved.weightUnit;
      var isKg = saved.weightUnit === 'kg';
      var wLabel = document.getElementById('cal-weight-label');
      var wHint  = document.getElementById('cal-weight-hint');
      var gwUnit = document.getElementById('cal-gw-label-unit');
      if (wLabel) wLabel.textContent = isKg ? 'Weight (kg)' : 'Weight (lbs)';
      if (wHint)  wHint.textContent  = isKg ? '20–300 kg'   : '45–660 lbs';
      if (gwUnit) gwUnit.textContent = isKg ? '(kg)'        : '(lbs)';
      if (weightEl)  { weightEl.placeholder  = isKg ? 'e.g. 75'  : 'e.g. 165'; }
      if (weightGwEl){ weightGwEl.placeholder= isKg ? 'e.g. 68'  : 'e.g. 150'; }
    }
  }

  function resetAll() {
    clearTimeout(_saveTimer);

    /* Clear inputs */
    [ageEl, heightCmEl, heightFtEl, heightInEl, weightEl, weightGwEl].forEach(function (el) {
      if (el) el.value = '';
    });

    /* Reset selects to defaults */
    if (genderEl)     genderEl.value     = 'male';
    if (heightUnitEl) heightUnitEl.value = 'cm';
    if (weightUnitEl) weightUnitEl.value = 'kg';
    if (activityEl)   activityEl.value   = '1.55';
    if (goalEl)       goalEl.value       = 'maintain';

    /* Reset unit panels */
    heightMetricPanel.hidden   = false;
    heightImperialPanel.hidden = true;
    document.getElementById('cal-height-label').textContent = 'Height (cm)';

    /* Hide results and validation */
    resultsEl.hidden = true;
    validEl.hidden   = true;
    var floorWarnEl = document.getElementById('cal-floor-warning');
    if (floorWarnEl) floorWarnEl.hidden = true;

    /* Clear storage immediately */
    if (window.P50Storage) P50Storage.remove(STORAGE_KEY);
  }

  /* ---- Autosave event wiring ---- */
  var _allInputs = document.querySelectorAll(
    '#cal-age, #cal-height-cm, #cal-height-ft, #cal-height-in, #cal-weight, #cal-goal-weight'
  );
  _allInputs.forEach(function (el) {
    el.addEventListener('input', scheduleSave);
  });

  var _allSelects = document.querySelectorAll(
    '#cal-gender, #cal-height-unit, #cal-weight-unit, #cal-activity, #cal-goal'
  );
  _allSelects.forEach(function (el) {
    el.addEventListener('change', scheduleSave);
  });

  /* ---- Reset button wiring ---- */
  var calResetBtn = document.getElementById('cal-reset-btn');
  if (calResetBtn) calResetBtn.addEventListener('click', resetAll);

  /* ============================================
     RELATED TOOLS — render from tools.json
     Health-fitness only, max 4, excludes self.
  ============================================ */

  /* Use centralized renderer for related tool icons to avoid duplication */

  function renderRelatedTools() {
    /* The related tools div is already in the HTML; we only need to populate the grid */
    var relatedGrid = document.getElementById('cal-related-grid');
    if (!relatedGrid) return;

    fetch('/data/tools.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var related = (data.allTools || [])
          .filter(function (t) {
            return t.category === 'health-fitness' && t.id !== 'daily-calorie-planner';
          })
          .slice(0, 4);

        if (!related.length) related = getCalFallback();
        buildCalRelatedHTML(relatedGrid, related);
      })
      .catch(function () {
        buildCalRelatedHTML(relatedGrid, getCalFallback());
      });
  }

  function getCalFallback() {
    return [
      { id: 'bmi-calculator',      name: 'BMI Calculator',      description: 'Check your Body Mass Index',       link: '/tools/bmi-calculator/', icon: 'scale' },
      { id: 'body-fat-calculator', name: 'Body Fat Calculator', description: 'Calculate your body composition',  link: '/tools/body-fat-calculator/', icon: 'ruler' },
    ];
  }

  function buildCalRelatedHTML(grid, tools) {
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
