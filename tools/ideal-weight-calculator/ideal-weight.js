/* ============================================
   IDEAL-WEIGHT.JS — Project 50
   Ideal Weight Calculator

   Formula Consensus System:
   ─────────────────────────
   Four formulas run internally. Raw outputs are
   NEVER shown to users.

   1. Devine (1974)
      Male:   50.0 + 2.3 × (height_in − 60)
      Female: 45.5 + 2.3 × (height_in − 60)

   2. Hamwi (1964)
      Male:   48.0 + 2.7 × (height_in − 60)
      Female: 45.4 + 2.2 × (height_in − 60)

   3. Robinson (1983)
      Male:   52.0 + 1.9 × (height_in − 60)
      Female: 49.0 + 1.7 × (height_in − 60)

   4. Miller (1983)
      Male:   56.2 + 1.41 × (height_in − 60)
      Female: 53.1 + 1.36 × (height_in − 60)

   All height_in values = total height in inches.
   All outputs in kg.

   Consensus outputs:
     Minimum Weight   = Math.min(...4 results)
     Maximum Weight   = Math.max(...4 results)
     Recommended Weight = average of all 4

   Current Status:
     Below Range  → current < minimum
     Healthy Range → minimum ≤ current ≤ maximum
     Above Range  → current > maximum

   Weight Position Bar:
     3 segments: Underweight / Healthy / Overweight
     Total bar = 100%
     Each segment = 33.33%
     Segment 1 (0–33.33%):  Underweight zone
     Segment 2 (33.33–66.67%): Healthy zone
     Segment 3 (66.67–100%): Overweight zone
     Marker position maps current weight to 0–100%:
       ≤ minimum → maps 0–33.33% within underweight band
       within range → maps 33.33–66.67%
       ≥ maximum → maps 66.67–100% within overweight band

   Storage key: 'p50_ideal_weight'
   Persists: gender, age, heightUnit, heightCm,
             heightFt, heightIn, weightUnit, weight
============================================ */

(function () {
  'use strict';

  /* ---- Storage key ---- */
  var STORAGE_KEY = 'p50_ideal_weight';

  /* ---- Autosave timer ---- */
  var _saveTimer = null;

  /* ---- DOM refs — Inputs ---- */
  var genderEl     = document.getElementById('iw-gender');
  var ageEl        = document.getElementById('iw-age');
  var heightUnitEl = document.getElementById('iw-height-unit');
  var heightCmEl   = document.getElementById('iw-height-cm');
  var heightFtEl   = document.getElementById('iw-height-ft');
  var heightInEl   = document.getElementById('iw-height-in');
  var weightUnitEl = document.getElementById('iw-weight-unit');
  var weightEl     = document.getElementById('iw-weight');

  /* ---- DOM refs — Unit panels ---- */
  var heightMetricPanel   = document.getElementById('iw-height-metric');
  var heightImperialPanel = document.getElementById('iw-height-imperial');

  /* ---- DOM refs — UI ---- */
  var calcBtn   = document.getElementById('iw-calc-btn');
  var resetBtn  = document.getElementById('iw-reset-btn');
  var validEl   = document.getElementById('iw-validation');
  var resultsEl = document.getElementById('iw-results');

  /* ---- DOM refs — Result outputs ---- */
  var minWeightEl   = document.getElementById('iw-min-weight');
  var recWeightEl   = document.getElementById('iw-rec-weight');
  var maxWeightEl   = document.getElementById('iw-max-weight');
  var statusTextEl  = document.getElementById('iw-status-text');
  var statusCardEl  = document.getElementById('iw-status-card');
  var rangeLowEl    = document.getElementById('iw-range-low');
  var rangeHighEl   = document.getElementById('iw-range-high');
  var analysisCurrEl = document.getElementById('iw-analysis-current');
  var analysisRangeEl = document.getElementById('iw-analysis-range');
  var analysisDiffEl  = document.getElementById('iw-analysis-diff');
  var barMarkerEl   = document.getElementById('iw-bar-marker');
  var nextStepEl    = document.getElementById('iw-next-step');

  /* Unit display elements */
  var minUnitEl  = document.getElementById('iw-min-unit');
  var recUnitEl  = document.getElementById('iw-rec-unit');
  var maxUnitEl  = document.getElementById('iw-max-unit');
  var rangeUnitEl = document.getElementById('iw-range-unit');

  /* ============================================
     PREVENT WHEEL SCROLL ON NUMBER INPUTS
  ============================================ */
  var numberInputs = document.querySelectorAll(
    '#iw-age, #iw-height-cm, #iw-height-ft, #iw-height-in, #iw-weight'
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

    heightUnitEl.dataset.prevUnit = newUnit;
    applyHeightUnit(newUnit);
    scheduleSave();
  });

  function applyHeightUnit(unit) {
    var isMetric = (unit === 'cm');
    heightMetricPanel.hidden   = !isMetric;
    heightImperialPanel.hidden = isMetric;
    document.getElementById('iw-height-label').textContent =
      isMetric ? 'Height (cm)' : 'Height (ft / in)';
  }

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
    document.getElementById('iw-weight-label').textContent =
      isKg ? 'Current Weight (kg)' : 'Current Weight (lbs)';
    document.getElementById('iw-weight-hint').textContent =
      isKg ? '20–300 kg' : '45–660 lbs';
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
    var age      = parseInt(ageEl.value, 10);
    var heightCm = getHeightCm();
    var weightKg = getWeightKg();

    if (!age || age < 18 || age > 100) {
      showValidation('Please enter a valid age between 18 and 100.');
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
     Formulas operate on height_in (total inches)
     All outputs in kg, rounded to 1 decimal.
  ============================================ */
  function calculateFormulas(gender, heightCm) {
    var heightIn = heightCm / 2.54; /* total inches */
    var excess   = heightIn - 60;   /* inches above 5ft */

    var devine, hamwi, robinson, miller;

    if (gender === 'male') {
      devine   = 50.0 + 2.30 * excess;
      hamwi    = 48.0 + 2.70 * excess;
      robinson = 52.0 + 1.90 * excess;
      miller   = 56.2 + 1.41 * excess;
    } else {
      devine   = 45.5 + 2.30 * excess;
      hamwi    = 45.4 + 2.20 * excess;
      robinson = 49.0 + 1.70 * excess;
      miller   = 53.1 + 1.36 * excess;
    }

    return {
      devine:   Math.round(devine   * 10) / 10,
      hamwi:    Math.round(hamwi    * 10) / 10,
      robinson: Math.round(robinson * 10) / 10,
      miller:   Math.round(miller   * 10) / 10
    };
  }

  function calculate() {
    var gender   = genderEl.value;
    var heightCm = getHeightCm();
    var weightKg = Math.round(getWeightKg() * 10) / 10;

    /* Run all four formulas */
    var f = calculateFormulas(gender, heightCm);
    var results = [f.devine, f.hamwi, f.robinson, f.miller];

    /* Consensus outputs */
    var minWeight = Math.round(Math.min.apply(null, results) * 10) / 10;
    var maxWeight = Math.round(Math.max.apply(null, results) * 10) / 10;
    var recWeight = Math.round(
      results.reduce(function (a, b) { return a + b; }, 0) / results.length * 10
    ) / 10;

    /* Current Status */
    var status;
    if (weightKg < minWeight) {
      status = 'below';
    } else if (weightKg > maxWeight) {
      status = 'above';
    } else {
      status = 'healthy';
    }

    /* Weight difference */
    var diff;
    if (status === 'below') {
      diff = Math.round((minWeight - weightKg) * 10) / 10;
    } else if (status === 'above') {
      diff = Math.round((weightKg - maxWeight) * 10) / 10;
    } else {
      diff = 0;
    }

    /* Bar marker position (0–100%) */
    var markerPct = weightToMarker(weightKg, minWeight, maxWeight);

    return {
      gender:       gender,
      weightKg:     weightKg,
      weightUnit:   weightUnitEl.value,
      minWeight:    minWeight,
      recWeight:    recWeight,
      maxWeight:    maxWeight,
      status:       status,
      diff:         diff,
      markerPct:    markerPct
    };
  }

  /*
     weightToMarker:
     Maps current weight to 0–100 on a 3-segment bar.
     Each segment = 33.33% of the bar.

     Segment 1 (0–33.33%):   Underweight
       Maps: [0, minWeight] → [0, 33.33]
       Below: uses a virtual lower bound of (minWeight − rangeSpan)
     Segment 2 (33.33–66.67%): Healthy
       Maps: [minWeight, maxWeight] → [33.33, 66.67]
     Segment 3 (66.67–100%): Overweight
       Maps: [maxWeight, maxWeight + rangeSpan] → [66.67, 100]
  */
  function weightToMarker(weightKg, minWeight, maxWeight) {
    var THIRD = 100 / 3;
    var rangeSpan = maxWeight - minWeight;
    if (rangeSpan <= 0) rangeSpan = 5; /* safety fallback */

    var pct;
    if (weightKg <= minWeight) {
      /* Underweight segment */
      var lowerBound = minWeight - rangeSpan;
      var ratio = (weightKg - lowerBound) / (minWeight - lowerBound);
      ratio = Math.max(0, Math.min(1, ratio));
      pct = ratio * THIRD;
    } else if (weightKg >= maxWeight) {
      /* Overweight segment */
      var upperBound = maxWeight + rangeSpan;
      var ratio2 = (weightKg - maxWeight) / (upperBound - maxWeight);
      ratio2 = Math.max(0, Math.min(1, ratio2));
      pct = THIRD * 2 + ratio2 * THIRD;
    } else {
      /* Healthy segment */
      var ratio3 = (weightKg - minWeight) / (maxWeight - minWeight);
      pct = THIRD + ratio3 * THIRD;
    }

    /* Clamp to [1, 99] so dot stays within bar bounds */
    return Math.max(1, Math.min(99, Math.round(pct * 10) / 10));
  }

  /* ============================================
     FORMAT VALUE IN USER'S CHOSEN UNIT
  ============================================ */
  function formatWeight(kg, unit) {
    if (unit === 'lbs') {
      return Math.round(kg * 2.20462 * 10) / 10;
    }
    return kg;
  }

  function unitLabel(unit) {
    return unit === 'lbs' ? 'lbs' : 'kg';
  }

  /* ============================================
     RENDER RESULTS
  ============================================ */
  function render(d) {
    var unit     = d.weightUnit;
    var uLabel   = unitLabel(unit);
    var minDisp  = formatWeight(d.minWeight, unit);
    var recDisp  = formatWeight(d.recWeight, unit);
    var maxDisp  = formatWeight(d.maxWeight, unit);
    var currDisp = formatWeight(d.weightKg, unit);
    var diffDisp = formatWeight(d.diff, unit);

    /* Section 1: Healthy Weight Snapshot */
    minWeightEl.textContent  = minDisp;
    recWeightEl.textContent  = recDisp;
    maxWeightEl.textContent  = maxDisp;
    if (minUnitEl)  minUnitEl.textContent  = uLabel;
    if (recUnitEl)  recUnitEl.textContent  = uLabel;
    if (maxUnitEl)  maxUnitEl.textContent  = uLabel;

    /* Status card */
    var statusLabels = {
      below:   'Below Range',
      healthy: 'Healthy Range',
      above:   'Above Range'
    };
    statusTextEl.textContent = statusLabels[d.status];
    statusCardEl.dataset.status = d.status;

    /* Section 2: Range display */
    rangeLowEl.textContent  = minDisp;
    rangeHighEl.textContent = maxDisp;
    if (rangeUnitEl) rangeUnitEl.textContent = uLabel;

    /* Section 3: Current Weight Analysis */
    analysisCurrEl.textContent  = currDisp + ' ' + uLabel;
    analysisRangeEl.textContent = minDisp + '–' + maxDisp + ' ' + uLabel;

    if (d.status === 'healthy') {
      analysisDiffEl.textContent     = 'Within Healthy Range';
      analysisDiffEl.dataset.diff    = 'healthy';
    } else if (d.status === 'below') {
      analysisDiffEl.textContent     = 'Gain ' + diffDisp + ' ' + uLabel;
      analysisDiffEl.dataset.diff    = 'below';
    } else {
      analysisDiffEl.textContent     = 'Lose ' + diffDisp + ' ' + uLabel;
      analysisDiffEl.dataset.diff    = 'above';
    }

    /* Section 4: Weight position bar */
    barMarkerEl.style.left = d.markerPct + '%';

    /* Section 5: Next Step */
    var nextStepMessages = {
      below:   'Focus on gradual weight gain, adequate nutrition, and resistance training.',
      healthy: 'You are already within a healthy weight range. Focus on maintaining your current habits.',
      above:   'A moderate calorie deficit may help you move toward the healthy range gradually.'
    };
    nextStepEl.textContent = nextStepMessages[d.status];

    /* Show results */
    resultsEl.hidden = false;

    /* Move related tools below results */
    var relatedWrap = document.getElementById('iw-related-tools');
    var toolWrap    = document.querySelector('.tool-wrap');
    if (relatedWrap && toolWrap) {
      toolWrap.appendChild(relatedWrap);
    }

    /* Scroll results into view */
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    /* Trigger animations */
    if (window.P50ToolBase) P50ToolBase.triggerAnimations();
  }

  /* ============================================
     CALCULATE BUTTON
  ============================================ */
  calcBtn.addEventListener('click', function () {
    if (!validate()) return;
    var data = calculate();
    if (!data) return;
    render(data);
    saveState();
  });

  /* Enter key triggers calculation */
  document.querySelectorAll(
    '#iw-age, #iw-height-cm, #iw-height-ft, #iw-height-in, #iw-weight'
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
    [ageEl, heightCmEl, heightFtEl, heightInEl, weightEl].forEach(function (el) {
      if (el) el.value = '';
    });

    /* Reset selects to defaults */
    if (genderEl)     genderEl.value     = 'male';
    if (heightUnitEl) { heightUnitEl.value = 'cm'; heightUnitEl.dataset.prevUnit = 'cm'; }
    if (weightUnitEl) { weightUnitEl.value = 'kg'; weightUnitEl.dataset.prevUnit = 'kg'; }

    /* Reset panels */
    heightMetricPanel.hidden   = false;
    heightImperialPanel.hidden = true;
    document.getElementById('iw-height-label').textContent = 'Height (cm)';

    /* Reset weight label */
    applyWeightUnit('kg');

    /* Hide results and validation */
    resultsEl.hidden = true;
    hideValidation();

    /* Move related tools back to default position */
    var relatedWrap = document.getElementById('iw-related-tools');
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
      gender:     genderEl.value,
      age:        ageEl.value,
      heightUnit: heightUnitEl.value,
      heightCm:   heightCmEl.value,
      heightFt:   heightFtEl.value,
      heightIn:   heightInEl.value,
      weightUnit: weightUnitEl.value,
      weight:     weightEl.value
    });
  }

  /* Wire autosave to all inputs and selects */
  document.querySelectorAll(
    '#iw-age, #iw-height-cm, #iw-height-ft, #iw-height-in, #iw-weight'
  ).forEach(function (el) {
    el.addEventListener('input', scheduleSave);
  });

  document.querySelectorAll(
    '#iw-gender'
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
  }

  /* ============================================
     RELATED TOOLS
     Same category (health-fitness) only.
     Max 4 tools. Excludes self. No fake tools.
  ============================================ */
  function renderRelatedTools() {
    var relatedGrid = document.getElementById('iw-related-grid');
    if (!relatedGrid) return;

    fetch('/data/tools.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var related = (data.allTools || [])
          .filter(function (t) {
            return t.category === 'health-fitness' && t.id !== 'ideal-weight-calculator';
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
      { id: 'bmi-calculator',        name: 'BMI Calculator',        description: 'Check your Body Mass Index',                   link: '/tools/bmi-calculator/',        icon: 'scale'    },
      { id: 'body-fat-calculator',   name: 'Body Fat Calculator',   description: 'Calculate your body fat percentage',            link: '/tools/body-fat-calculator/',   icon: 'ruler'    },
      { id: 'macro-calculator',      name: 'Macro Calculator',      description: 'Calculate your daily protein, fat and carbs',   link: '/tools/macro-calculator/',      icon: 'beef'     },
      { id: 'daily-calorie-planner', name: 'Daily Calorie Planner', description: 'Calculate your BMR, TDEE and calorie target',   link: '/tools/daily-calorie-planner/', icon: 'salad'    }
    ];
  }

  function buildRelatedHTML(grid, tools) {
    var html = '';
    tools.forEach(function (t) {
      if (window.P50Renderers && P50Renderers.relatedToolCard) {
        html += P50Renderers.relatedToolCard(t);
      } else if (window.P50Icons && window.P50IconMap) {
        var key     = P50IconMap.forTool(t.id) || (t.icon || 'wrench');
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
