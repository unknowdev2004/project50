/* ============================================
   BODY-FAT.JS — Project 50
   Body Fat Calculator

   Calculation method: U.S. Navy Body Fat Formula
   (Hodgdon & Beckett, 1984)

   Male:
     D = 1.0324 - 0.19077*log10(waist-neck) + 0.15456*log10(height)
     BF% = 495/D - 450

   Female:
     D = 1.29579 - 0.35004*log10(waist+hip-neck) + 0.22100*log10(height)
     BF% = 495/D - 450

   Architecture note:
     Formula selection uses a strategy object
     (FORMULA_STRATEGIES) keyed by method id.
     Future methods (Skinfold, BMI Estimate) can
     be added by registering a new key — no changes
     to calculate() or render() are needed.

   Fixes applied (v2):
     - Height unit toggle (cm / ft+in) matching Daily Calorie Planner
     - Weight unit toggle (kg / lbs) matching Daily Calorie Planner
     - Live autosave with 300ms debounce on all input/change events
     - Save also persists selected units (heightUnit, weightUnit)
     - Related tools always visible, loaded from tools.json (health-fitness only)
     - Maximum 4 related tools, no cross-category tools
     - Button row: Calculate + Reset use identical btn-lg sizing (no flex:1 on Reset)
     - Category bar marker: centered via transform translateX(-50%), top aligned to bar centre
     - Reset clears localStorage immediately
     - No wheel-scroll value changes on any number input

   Storage key: 'p50_body_fat'
   Persists: gender, heightUnit, height, weightUnit, weight,
             neck, waist, hip, target
============================================ */

(function () {
  'use strict';

  /* ============================================
     FORMULA STRATEGIES
  ============================================ */
  var FORMULA_STRATEGIES = {
    navy: {
      id:    'navy',
      label: 'U.S. Navy Method',
      fields: {
        male:   ['bf-neck', 'bf-waist'],
        female: ['bf-neck', 'bf-waist', 'bf-hip'],
      },
      run: function (inputs) {
        var h  = inputs.height; /* always cm */
        var n  = inputs.neck;
        var w  = inputs.waist;
        var hi = inputs.hip;   /* female only */
        var density;

        if (inputs.gender === 'male') {
          if (w <= n) return NaN;
          density = 1.0324
            - 0.19077 * Math.log10(w - n)
            + 0.15456 * Math.log10(h);
        } else {
          if (w + hi <= n) return NaN;
          density = 1.29579
            - 0.35004 * Math.log10(w + hi - n)
            + 0.22100 * Math.log10(h);
        }

        return (495 / density) - 450;
      },
    },
  };

  var activeFormula = FORMULA_STRATEGIES.navy;

  /* ============================================
     BODY FAT CATEGORIES — ACMS / ACE ranges
  ============================================ */
  var CATEGORIES = {
    male: [
      { id: 'essential', label: 'Essential Fat', min: 2,  max: 5  },
      { id: 'athlete',   label: 'Athlete',        min: 6,  max: 13 },
      { id: 'fitness',   label: 'Fitness',         min: 14, max: 17 },
      { id: 'average',   label: 'Average',          min: 18, max: 24 },
      { id: 'obese',     label: 'Obese',            min: 25, max: Infinity },
    ],
    female: [
      { id: 'essential', label: 'Essential Fat', min: 10, max: 13 },
      { id: 'athlete',   label: 'Athlete',        min: 14, max: 20 },
      { id: 'fitness',   label: 'Fitness',         min: 21, max: 24 },
      { id: 'average',   label: 'Average',          min: 25, max: 31 },
      { id: 'obese',     label: 'Obese',            min: 32, max: Infinity },
    ],
  };

  var HEALTHY_RANGE = {
    male:   { low: 14, high: 24 },
    female: { low: 21, high: 31 },
  };

  /* ============================================
     STORAGE KEY
  ============================================ */
  var STORAGE_KEY = 'p50_body_fat';

  /* ============================================
     DOM REFERENCES
  ============================================ */
  var genderBtnMale    = document.getElementById('bf-btn-male');
  var genderBtnFemale  = document.getElementById('bf-btn-female');
  var hipWrap          = document.getElementById('bf-hip-wrap');

  /* Height */
  var heightUnitEl     = document.getElementById('bf-height-unit');
  var heightMetricEl   = document.getElementById('bf-height-metric');
  var heightImperialEl = document.getElementById('bf-height-imperial');
  var heightCmEl       = document.getElementById('bf-height-cm');
  var heightFtEl       = document.getElementById('bf-height-ft');
  var heightInEl       = document.getElementById('bf-height-in');
  var heightLabelEl    = document.getElementById('bf-height-label');

  /* Weight */
  var weightUnitEl     = document.getElementById('bf-weight-unit');
  var weightEl         = document.getElementById('bf-weight');
  var weightLabelEl    = document.getElementById('bf-weight-label');
  var weightHintEl     = document.getElementById('bf-weight-hint');

  /* Circumferences */
  var neckEl           = document.getElementById('bf-neck');
  var waistEl          = document.getElementById('bf-waist');
  var hipEl            = document.getElementById('bf-hip');
  var targetEl         = document.getElementById('bf-target');

  /* UI */
  var validEl          = document.getElementById('bf-validation');
  var resultsEl        = document.getElementById('bf-results');
  var calcBtn          = document.getElementById('bf-calc-btn');
  var resetBtn         = document.getElementById('bf-reset-btn');

  /* Result elements */
  var pctNumber        = document.getElementById('bf-pct-number');
  var categoryBadge    = document.getElementById('bf-category-badge');
  var catMarker        = document.getElementById('bf-cat-marker');
  var compositionCard  = document.getElementById('bf-composition-card');
  var fatMassEl        = document.getElementById('bf-fat-mass');
  var leanMassEl       = document.getElementById('bf-lean-mass');
  var rangeCurrent     = document.getElementById('bf-range-current');
  var rangeTarget      = document.getElementById('bf-range-target');
  var rangeNote        = document.getElementById('bf-range-note');
  var targetCard       = document.getElementById('bf-target-card');
  var targetCurrentEl  = document.getElementById('bf-target-current');
  var targetGoalEl     = document.getElementById('bf-target-goal');
  var targetWeightEl   = document.getElementById('bf-target-weight');
  var targetNoteEl     = document.getElementById('bf-target-note');
  var summaryText      = document.getElementById('bf-summary-text');

  /* ============================================
     STATE
  ============================================ */
  var gender = 'male';

  /* ============================================
     PREVENT MOUSE-WHEEL ON NUMBER INPUTS
  ============================================ */
  var allNumberInputs = document.querySelectorAll(
    '#bf-height-cm, #bf-height-ft, #bf-height-in, ' +
    '#bf-neck, #bf-waist, #bf-hip, #bf-weight, #bf-target'
  );
  allNumberInputs.forEach(function (el) {
    el.addEventListener('wheel', function (e) {
      el.blur();
      e.preventDefault();
    }, { passive: false });
  });

  /* ============================================
     GENDER TOGGLE
  ============================================ */
  genderBtnMale.addEventListener('click', function () { setGender('male'); });
  genderBtnFemale.addEventListener('click', function () { setGender('female'); });

  function setGender(g) {
    gender = g;
    genderBtnMale.classList.toggle('active',   g === 'male');
    genderBtnFemale.classList.toggle('active', g === 'female');
    genderBtnMale.setAttribute('aria-pressed',   g === 'male'   ? 'true' : 'false');
    genderBtnFemale.setAttribute('aria-pressed', g === 'female' ? 'true' : 'false');
    hipWrap.hidden = (g !== 'female');
    hideResults();
    scheduleSave();
  }

  /* ============================================
     HEIGHT UNIT SWITCHER
  ============================================ */
  heightUnitEl.addEventListener('change', function () {
    applyHeightUnit(heightUnitEl.value);
    scheduleSave();
  });

  function applyHeightUnit(unit) {
    var isMetric = (unit === 'cm');
    heightMetricEl.hidden   = !isMetric;
    heightImperialEl.hidden = isMetric;
    /* Update label — keep the optional badge in place via innerHTML split */
    heightLabelEl.firstChild.textContent = isMetric ? 'Height (cm)' : 'Height (ft / in)';
  }

  /* ============================================
     WEIGHT UNIT SWITCHER
  ============================================ */
  weightUnitEl.addEventListener('change', function () {
    applyWeightUnit(weightUnitEl.value);
    scheduleSave();
  });

  function applyWeightUnit(unit) {
    var isKg = (unit === 'kg');
    /* Update label text node only — preserve the badge span */
    if (weightLabelEl) {
      weightLabelEl.childNodes[0].textContent = isKg
        ? 'Current Weight (kg) '
        : 'Current Weight (lbs) ';
    }
    weightHintEl.textContent = isKg
      ? 'Required for fat mass and lean mass breakdown'
      : 'Required for fat mass and lean mass breakdown';
    weightEl.placeholder = isKg ? 'e.g. 75' : 'e.g. 165';
    if (isKg) {
      weightEl.min = 30;  weightEl.max = 300;
    } else {
      weightEl.min = 66;  weightEl.max = 660;
    }
  }

  /* ============================================
     HEIGHT CONVERSION HELPERS
  ============================================ */
  function getHeightCm() {
    if (heightUnitEl.value === 'cm') {
      return parseFloat(heightCmEl.value);
    }
    var ft  = parseFloat(heightFtEl.value) || 0;
    var inc = parseFloat(heightInEl.value) || 0;
    return (ft * 12 + inc) * 2.54;
  }

  /* ============================================
     WEIGHT CONVERSION HELPER
  ============================================ */
  function getWeightKg() {
    var v = parseFloat(weightEl.value);
    if (isNaN(v)) return NaN;
    return weightUnitEl.value === 'kg' ? v : v * 0.453592;
  }

  /* ============================================
     ENTER KEY — trigger calculate on all inputs
  ============================================ */
  allNumberInputs.forEach(function (el) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') calcBtn.click();
    });
  });

  /* ============================================
     AUTOSAVE — debounced 300ms
     Wire input/change events on all interactive fields.
  ============================================ */
  var saveTimer = null;

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 300);
  }

  /* Wire autosave to every input/change */
  allNumberInputs.forEach(function (el) {
    el.addEventListener('input', scheduleSave);
  });
  /* unit selects handled by their own change listeners above */

  /* ============================================
     CALCULATE BUTTON
  ============================================ */
  calcBtn.addEventListener('click', function () {
    if (!validate()) return;
    var data = calculate();
    if (data === null) return;
    render(data);
    saveState(); /* immediate save on calculate */
  });

  /* ============================================
     RESET BUTTON
  ============================================ */
  resetBtn.addEventListener('click', function () {
    resetAll();
  });

  /* ============================================
     VALIDATE
  ============================================ */
  function validate() {
    hideValidation();

    var heightCm = getHeightCm();
    var n   = parseFloat(neckEl.value);
    var w   = parseFloat(waistEl.value);
    var hi  = parseFloat(hipEl.value);
    var wt  = getWeightKg();
    var tgt = parseFloat(targetEl.value);

    /* Height */
    if (isNaN(heightCm) || heightCm < 100 || heightCm > 250) {
      if (heightUnitEl.value === 'cm') {
        return showValidation('Please enter a valid height between 100 and 250 cm.');
      }
      return showValidation('Please enter a valid height (3–8 ft, 0–11 in).');
    }

    if (isNaN(n) || n < 20 || n > 80) {
      return showValidation('Please enter a valid neck circumference between 20 and 80 cm.');
    }
    if (isNaN(w) || w < 40 || w > 200) {
      return showValidation('Please enter a valid waist circumference between 40 and 200 cm.');
    }
    if (gender === 'female') {
      if (isNaN(hi) || hi < 50 || hi > 200) {
        return showValidation('Please enter a valid hip circumference between 50 and 200 cm.');
      }
      if (w + hi <= n) {
        return showValidation('The combination of your measurements produced an invalid result. Please double-check your neck, waist, and hip measurements.');
      }
    } else {
      if (w <= n) {
        return showValidation('Waist circumference must be greater than neck circumference. Please check your measurements.');
      }
    }

    /* Optional weight */
    if (weightEl.value !== '') {
      var wtKg = getWeightKg();
      if (isNaN(wtKg) || wtKg < 13.6 || wtKg > 136) {
        if (weightUnitEl.value === 'kg') {
          return showValidation('Please enter a valid weight between 30 and 300 kg, or leave it blank.');
        }
        return showValidation('Please enter a valid weight between 66 and 660 lbs, or leave it blank.');
      }
    }

    /* Optional target */
    if (targetEl.value !== '') {
      if (isNaN(tgt) || tgt < 3 || tgt > 50) {
        return showValidation('Please enter a target body fat between 3% and 50%, or leave it blank.');
      }
    }

    return true;
  }

  /* ============================================
     CALCULATE
  ============================================ */
  function calculate() {
    var heightCm = getHeightCm();

    var inputs = {
      gender: gender,
      height: heightCm,
      neck:   parseFloat(neckEl.value),
      waist:  parseFloat(waistEl.value),
      hip:    parseFloat(hipEl.value) || 0,
    };

    var bf = activeFormula.run(inputs);

    if (isNaN(bf) || bf <= 0 || bf >= 100) {
      showValidation('Could not calculate body fat from these measurements. Please check your inputs and try again.');
      return null;
    }

    bf = Math.min(bf, 70);
    var bfRounded = Math.round(bf * 10) / 10;

    /* Category */
    var cats = CATEGORIES[gender];
    var cat = cats[cats.length - 1];
    for (var i = 0; i < cats.length; i++) {
      if (bfRounded >= cats[i].min && bfRounded <= cats[i].max) {
        cat = cats[i];
        break;
      }
    }

    /* Marker position */
    var markerPct = bfToMarker(bfRounded, gender);

    /* Healthy range */
    var healthy = HEALTHY_RANGE[gender];

    /* Composition (requires weight) */
    var hasWeight = weightEl.value !== '' && !isNaN(getWeightKg());
    var weightKg  = hasWeight ? getWeightKg() : null;
    var fatMass   = null;
    var leanMass  = null;
    var weightUnit = weightUnitEl.value;

    if (hasWeight) {
      fatMass  = Math.round((bfRounded / 100) * weightKg * 10) / 10;
      leanMass = Math.round((weightKg - fatMass) * 10) / 10;
    }

    /* Target planner */
    var hasTarget  = targetEl.value !== '' && !isNaN(parseFloat(targetEl.value));
    var targetBf   = hasTarget ? parseFloat(targetEl.value) : null;
    var goalWeight = null;
    var targetNote = null;

    if (hasTarget && hasWeight) {
      goalWeight = Math.round((leanMass / (1 - targetBf / 100)) * 10) / 10;
      if (targetBf >= bfRounded) {
        targetNote = 'Your target is at or above your current body fat. To reduce body fat, aim for a calorie deficit combined with resistance training to preserve lean mass.';
      } else {
        var lossKg = Math.round((weightKg - goalWeight) * 10) / 10;
        targetNote = 'To reach ' + targetBf + '%, you would need to lose approximately ' + lossKg + ' kg of fat while maintaining your current lean mass of ' + leanMass + ' kg.';
      }
    } else if (hasTarget && !hasWeight) {
      targetNote = 'Enter your current weight to see the estimated goal weight.';
    }

    return {
      bf:         bfRounded,
      cat:        cat,
      markerPct:  markerPct,
      healthy:    healthy,
      fatMass:    fatMass,
      leanMass:   leanMass,
      hasWeight:  hasWeight,
      weightKg:   weightKg,
      weightUnit: weightUnit,
      hasTarget:  hasTarget,
      targetBf:   targetBf,
      goalWeight: goalWeight,
      targetNote: targetNote,
    };
  }

  /* ============================================
     bfToMarker(bf, gender)
     Maps body fat % to 0–100 position on the 5-segment bar.
     Each segment spans 20% of the bar width.
     Marker is centered on the dot by CSS transform: translateX(-50%).
  ============================================ */
  function bfToMarker(bf, g) {
    var cats = CATEGORIES[g];
    for (var i = 0; i < cats.length; i++) {
      var c = cats[i];
      var maxVal = c.max === Infinity ? c.min + 15 : c.max;
      if (bf >= c.min && bf <= maxVal) {
        var segStart = i * 20;
        var fraction = (bf - c.min) / (maxVal - c.min);
        /* clamp to 1–99 so the dot stays within bar bounds */
        return Math.min(99, Math.max(1, segStart + fraction * 20));
      }
    }
    return Math.min(99, 80 + (bf - cats[cats.length - 1].min) / 15 * 18);
  }

  /* ============================================
     FORMAT WEIGHT for display
     Shows kg or lbs based on selected unit.
  ============================================ */
  function fmtWeight(kg, unit) {
    if (unit === 'lbs') {
      return Math.round(kg * 2.20462 * 10) / 10 + ' lbs';
    }
    return kg + ' kg';
  }

  /* ============================================
     RENDER
  ============================================ */
  function render(data) {
    /* Section 1 — primary */
    pctNumber.textContent     = data.bf;
    categoryBadge.textContent = data.cat.label;
    categoryBadge.className   = 'bf-category-badge cat-' + data.cat.id;

    /* Section 2 — category bar marker */
    catMarker.style.left = data.markerPct + '%';

    /* Section 3 — composition */
    if (data.hasWeight) {
      fatMassEl.textContent  = fmtWeight(data.fatMass,  data.weightUnit);
      leanMassEl.textContent = fmtWeight(data.leanMass, data.weightUnit);
      compositionCard.hidden = false;
    } else {
      compositionCard.hidden = true;
    }

    /* Section 4 — healthy range */
    rangeCurrent.textContent = data.bf + '%';
    rangeTarget.textContent  = data.healthy.low + '–' + data.healthy.high + '%';
    var inRange    = data.bf >= data.healthy.low && data.bf <= data.healthy.high;
    var belowRange = data.bf < data.healthy.low;
    if (inRange) {
      rangeNote.textContent = 'Your body fat falls within the recommended healthy range for your gender. Well done — maintaining this range supports long-term health and energy levels.';
    } else if (belowRange) {
      rangeNote.textContent = 'Your body fat is below the standard healthy range. Very low levels may indicate you are in athlete or essential fat territory — this is fine for competitive athletes but should be monitored if unintentional.';
    } else {
      var above = Math.round((data.bf - data.healthy.high) * 10) / 10;
      rangeNote.textContent = 'Your body fat is ' + above + '% above the recommended upper limit. A modest reduction through nutrition and resistance training can meaningfully improve metabolic health.';
    }

    /* Section 5 — target planner */
    if (data.hasTarget) {
      targetCurrentEl.textContent = data.bf + '%';
      targetGoalEl.textContent    = data.targetBf + '%';
      targetWeightEl.textContent  = data.goalWeight !== null
        ? fmtWeight(data.goalWeight, data.weightUnit)
        : '—';
      targetNoteEl.textContent = data.targetNote || '';
      targetCard.hidden = false;
    } else {
      targetCard.hidden = true;
    }

    /* Section 6 — summary */
    summaryText.innerHTML = buildSummary(data);

    /* Show results */
    resultsEl.hidden = false;
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (window.P50ToolBase) {
      P50ToolBase.triggerAnimations();
    }

    /* Move related tools below results */
    moveRelatedBelowResults();
  }

  /* ============================================
     BUILD SUMMARY TEXT
  ============================================ */
  function buildSummary(data) {
    var lines = [];

    if (data.hasWeight) {
      lines.push(
        'You currently carry approximately <strong>' + fmtWeight(data.fatMass, data.weightUnit) + '</strong> of fat mass ' +
        'and <strong>' + fmtWeight(data.leanMass, data.weightUnit) + '</strong> of lean mass.'
      );
    } else {
      lines.push('Your estimated body fat is <strong>' + data.bf + '%</strong>.');
    }

    var healthy = HEALTHY_RANGE[gender];
    var inRange = data.bf >= healthy.low && data.bf <= healthy.high;

    if (inRange) {
      lines.push(
        'Your body fat falls within the <strong>healthy range (' + healthy.low + '–' + healthy.high + '%)</strong> for ' + gender + 's.'
      );
    } else if (data.bf < healthy.low) {
      lines.push(
        'Your body fat is below the typical healthy range — you are in the <strong>' + data.cat.label + '</strong> category.'
      );
    } else {
      lines.push(
        'Your body fat is above the healthy range. Focus on a modest calorie deficit and <strong>resistance training</strong> to reduce fat while preserving lean mass.'
      );
    }

    if (data.hasTarget && data.goalWeight !== null && data.targetBf < data.bf) {
      lines.push(
        'To reach your target of <strong>' + data.targetBf + '%</strong>, your estimated goal weight is <strong>' + fmtWeight(data.goalWeight, data.weightUnit) + '</strong>.'
      );
    }

    return lines.join(' ');
  }

  /* ============================================
     VALIDATION HELPERS
  ============================================ */
  function showValidation(msg) {
    validEl.textContent = msg;
    validEl.hidden = false;
    hideResults();
    validEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return false;
  }

  function hideValidation() {
    validEl.textContent = '';
    validEl.hidden = true;
  }

  function hideResults() {
    resultsEl.hidden = true;
  }

  /* ============================================
     RESET
  ============================================ */
  function resetAll() {
    clearTimeout(saveTimer);

    /* Clear inputs */
    heightCmEl.value = '';
    heightFtEl.value = '';
    heightInEl.value = '';
    neckEl.value     = '';
    waistEl.value    = '';
    hipEl.value      = '';
    weightEl.value   = '';
    targetEl.value   = '';

    /* Reset unit selects */
    heightUnitEl.value = 'cm';
    weightUnitEl.value = 'kg';
    applyHeightUnit('cm');
    applyWeightUnit('kg');

    /* Restore default gender */
    setGender('male');

    /* Clear validation + results */
    hideValidation();
    hideResults();

    /* Clear storage immediately */
    if (window.P50Storage) {
      P50Storage.remove(STORAGE_KEY);
    }
  }

  /* ============================================
     STORAGE — save
  ============================================ */
  function saveState() {
    if (!window.P50Storage) return;
    P50Storage.set(STORAGE_KEY, {
      gender:     gender,
      heightUnit: heightUnitEl.value,
      heightCm:   heightCmEl.value,
      heightFt:   heightFtEl.value,
      heightIn:   heightInEl.value,
      weightUnit: weightUnitEl.value,
      weight:     weightEl.value,
      neck:       neckEl.value,
      waist:      waistEl.value,
      hip:        hipEl.value,
      target:     targetEl.value,
    });
  }

  /* ============================================
     STORAGE — restore on page load
  ============================================ */
  function restoreState() {
    if (!window.P50Storage) return;
    var saved = P50Storage.get(STORAGE_KEY, null);
    if (!saved) return;

    if (saved.gender)     setGender(saved.gender);

    /* Height unit + values */
    if (saved.heightUnit) {
      heightUnitEl.value = saved.heightUnit;
      applyHeightUnit(saved.heightUnit);
    }
    if (saved.heightCm)   heightCmEl.value = saved.heightCm;
    if (saved.heightFt)   heightFtEl.value = saved.heightFt;
    if (saved.heightIn)   heightInEl.value = saved.heightIn;

    /* Weight unit + value */
    if (saved.weightUnit) {
      weightUnitEl.value = saved.weightUnit;
      applyWeightUnit(saved.weightUnit);
    }
    if (saved.weight)     weightEl.value   = saved.weight;

    /* Circumferences */
    if (saved.neck)   neckEl.value   = saved.neck;
    if (saved.waist)  waistEl.value  = saved.waist;
    if (saved.hip)    hipEl.value    = saved.hip;
    if (saved.target) targetEl.value = saved.target;
  }

  /* ============================================
     RELATED TOOLS
     Always visible. Loaded from tools.json.
     Same category (health-fitness) only.
     Maximum 4 tools. Excludes self (body-fat-calculator).
  ============================================ */
  function renderRelatedTools() {
    var grid = document.getElementById('bf-related-grid');
    if (!grid) return;

    /* Use centralized renderer for related tool icons to avoid duplication */

    /* Fetch tools.json and filter to health-fitness, excluding self */
    fetch('/data/tools.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var related = (data.allTools || [])
          .filter(function (t) {
            return t.category === 'health-fitness' &&
                   t.id !== 'body-fat-calculator';
          })
          .slice(0, 4);

        if (!related.length) {
          /* Fallback: hard-coded confirmed tools */
          related = [
            { id: 'bmi-calculator',       name: 'BMI Calculator',         description: 'Calculate your Body Mass Index', link: '/tools/bmi-calculator/', icon: 'scale' },
            { id: 'daily-calorie-planner', name: 'Daily Calorie Planner',  description: 'Find your TDEE and calorie target', link: '/tools/daily-calorie-planner/', icon: 'salad' },
          ];
        }

        buildRelatedHTML(grid, related);
      })
      .catch(function () {
        /* Network/parse error: render confirmed tools directly */
        var fallback = [
          { id: 'bmi-calculator',       name: 'BMI Calculator',         description: 'Calculate your Body Mass Index', link: '/tools/bmi-calculator/', icon: 'scale' },
          { id: 'daily-calorie-planner', name: 'Daily Calorie Planner',  description: 'Find your TDEE and calorie target', link: '/tools/daily-calorie-planner/', icon: 'salad' },
        ];
        buildRelatedHTML(grid, fallback);
      });
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
     RELATED TOOLS — move below results after calc
  ============================================ */
  function moveRelatedBelowResults() {
    var resultsEl   = document.getElementById('bf-results');
    var relatedWrap = document.getElementById('bf-related-wrap');
    if (!resultsEl || !relatedWrap) return;
    if (resultsEl.nextElementSibling !== relatedWrap) {
      resultsEl.after(relatedWrap);
    }
  }

  /* ============================================
     INIT
  ============================================ */
  restoreState();
  renderRelatedTools();

})();
