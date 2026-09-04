/* ============================================
   BMI.JS — Project 50
   BMI Calculator — State-Driven with Persistence

   DATA FLOW
   ─────────
   User types → input event (debounced 300ms) → saveState()
   Unit toggle → unit switch → saveState()
   Calculate button → calculate() → displayResult() → saveState()
   Reset button → resetAll() → P50Storage.remove()
   Page loads → restoreState() → render saved values

   LOCALSTORAGE KEY: "p50_bmi"
============================================ */

(function () {
  'use strict';

  /* ---- Constants ---- */
  var STORAGE_KEY     = 'p50_bmi';
  var DEBOUNCE_MS     = 300;

  /* ---- State ---- */
  var unit = 'metric';

  /* ---- DOM refs ---- */
  var metricInputs   = document.getElementById('bmi-inputs-metric');
  var imperialInputs = document.getElementById('bmi-inputs-imperial');
  var resultEl       = document.getElementById('bmi-result');
  var bmiNumber      = document.getElementById('bmi-number');
  var bmiLabel       = document.getElementById('bmi-label');
  var bmiMarker      = document.getElementById('bmi-marker');
  var calcBtn        = document.getElementById('calculate-btn');
  var resetBtn       = document.getElementById('bmi-reset-btn');
  var relatedWrap    = document.getElementById('bmi-related-wrap');
  var relatedGrid    = document.getElementById('bmi-related-grid');

  /* ---- Debounce timer ---- */
  var saveTimer = null;

  /* ============================================
     PERSISTENCE — save (debounced)
  ============================================ */
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, DEBOUNCE_MS);
  }

  function saveState() {
    if (!window.P50Storage) return;
    P50Storage.set(STORAGE_KEY, {
      unit:        unit,
      weightKg:    document.getElementById('weight-kg').value,
      heightCm:    document.getElementById('height-cm').value,
      weightLbs:   document.getElementById('weight-lbs').value,
      heightFt:    document.getElementById('height-ft').value,
      heightIn:    document.getElementById('height-in').value,
    });
  }

  /* ============================================
     PERSISTENCE — restore on page load
  ============================================ */
  function restoreState() {
    if (!window.P50Storage) return;
    var saved = P50Storage.get(STORAGE_KEY, null);
    if (!saved) return;

    /* Restore unit toggle */
    if (saved.unit === 'imperial') {
      setUnit('imperial');
    } else {
      setUnit('metric');
    }

    /* Restore values */
    if (saved.weightKg)  document.getElementById('weight-kg').value  = saved.weightKg;
    if (saved.heightCm)  document.getElementById('height-cm').value  = saved.heightCm;
    if (saved.weightLbs) document.getElementById('weight-lbs').value = saved.weightLbs;
    if (saved.heightFt)  document.getElementById('height-ft').value  = saved.heightFt;
    if (saved.heightIn)  document.getElementById('height-in').value  = saved.heightIn;
  }

  /* ============================================
     UNIT SWITCH
  ============================================ */
  function setUnit(u) {
    unit = u;
    var btnMetric   = document.getElementById('btn-metric');
    var btnImperial = document.getElementById('btn-imperial');

    if (u === 'metric') {
      btnMetric.classList.add('active');
      btnImperial.classList.remove('active');
      metricInputs.style.display   = '';
      imperialInputs.style.display = 'none';
    } else {
      btnImperial.classList.add('active');
      btnMetric.classList.remove('active');
      metricInputs.style.display   = 'none';
      imperialInputs.style.display = '';
    }
    resultEl.hidden = true;
  }

  document.getElementById('btn-metric').addEventListener('click', function () {
    setUnit('metric');
    scheduleSave();
  });

  document.getElementById('btn-imperial').addEventListener('click', function () {
    setUnit('imperial');
    scheduleSave();
  });

  /* ============================================
     INPUT AUTOSAVE
  ============================================ */
  document.querySelectorAll('.bmi-field input').forEach(function (input) {
    input.addEventListener('input', scheduleSave);
  });

  /* ============================================
     CALCULATE
  ============================================ */
  calcBtn.addEventListener('click', calculate);

  document.querySelectorAll('.bmi-field input').forEach(function (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') calculate();
    });
  });

  function calculate() {
    var bmi;

    if (unit === 'metric') {
      var weight = parseFloat(document.getElementById('weight-kg').value);
      var height = parseFloat(document.getElementById('height-cm').value) / 100;
      if (!weight || !height || weight <= 0 || height <= 0) { showError(); return; }
      if (weight < 20 || weight > 300) { showError('Please enter a valid weight between 20 kg and 300 kg.'); return; }
      if (height < 1.0 || height > 2.5) { showError('Please enter a valid height between 100 cm and 250 cm.'); return; }
      bmi = weight / (height * height);
    } else {
      var weightL  = parseFloat(document.getElementById('weight-lbs').value);
      var ft       = parseFloat(document.getElementById('height-ft').value) || 0;
      var inches   = parseFloat(document.getElementById('height-in').value) || 0;
      var totalIn  = ft * 12 + inches;
      if (!weightL || totalIn <= 0) { showError(); return; }
      if (weightL < 44 || weightL > 661) { showError('Please enter a valid weight between 44 lbs and 661 lbs.'); return; }
      if (totalIn < 39 || totalIn > 98) { showError('Please enter a valid height between 3\'3\" and 8\'2\".'); return; }
      bmi = (703 * weightL) / (totalIn * totalIn);
    }

    displayResult(bmi);
    saveState(); /* immediate save after calculation */
  }

  function displayResult(bmi) {
    var rounded = Math.round(bmi * 10) / 10;
    bmiNumber.textContent = rounded;

    var label, cls, markerPercent;

    if (bmi < 18.5) {
      label = 'Underweight'; cls = 'underweight';
      markerPercent = Math.max(2, (bmi / 18.5) * 22);
    } else if (bmi < 25) {
      label = 'Normal Weight'; cls = 'normal';
      markerPercent = 22 + ((bmi - 18.5) / 6.5) * 25;
    } else if (bmi < 30) {
      label = 'Overweight'; cls = 'overweight';
      markerPercent = 47 + ((bmi - 25) / 5) * 25;
    } else {
      label = 'Obese'; cls = 'obese';
      markerPercent = Math.min(98, 72 + ((bmi - 30) / 10) * 26);
    }

    bmiLabel.textContent = label;
    bmiLabel.className   = 'bmi-result-label ' + cls;
    bmiMarker.style.left = markerPercent + '%';

    resultEl.hidden = false;
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (window.P50ToolBase) P50ToolBase.triggerAnimations();

    /* Move related tools below results */
    moveRelatedBelowResults();
  }

  function showError(msg) {
    bmiNumber.textContent = '—';
    bmiLabel.textContent  = msg || 'Please enter valid values';
    bmiLabel.className    = 'bmi-result-label';
    resultEl.hidden       = false;
  }

  /* ============================================
     RESET
  ============================================ */
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAll);
  }

  function resetAll() {
    clearTimeout(saveTimer);

    /* Clear all inputs */
    document.getElementById('weight-kg').value  = '';
    document.getElementById('height-cm').value  = '';
    document.getElementById('weight-lbs').value = '';
    document.getElementById('height-ft').value  = '';
    document.getElementById('height-in').value  = '';

    /* Reset to metric */
    setUnit('metric');

    /* Hide result */
    resultEl.hidden = true;

    /* Clear storage immediately */
    if (window.P50Storage) {
      P50Storage.remove(STORAGE_KEY);
    }
  }

  /* ============================================
     RELATED TOOLS — move below results after calc
  ============================================ */
  function moveRelatedBelowResults() {
    if (!relatedWrap || !resultEl) return;
    /* Insert after resultEl if not already there */
    if (resultEl.nextElementSibling !== relatedWrap) {
      resultEl.after(relatedWrap);
    }
  }

  /* Use centralized renderer for related tool icons to avoid duplication */

  function renderRelatedTools() {
    if (!relatedGrid) return;

    fetch('/data/tools.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var related = (data.allTools || [])
          .filter(function (t) {
            return t.category === 'health-fitness' && t.id !== 'bmi-calculator';
          })
          .slice(0, 4);

        if (!related.length) {
          related = getHardcodedFallback();
        }
        buildRelatedHTML(related);
      })
      .catch(function () {
        buildRelatedHTML(getHardcodedFallback());
      });
  }

  function getHardcodedFallback() {
    return [
      { id: 'daily-calorie-planner', name: 'Daily Calorie Planner',  description: 'Find your TDEE and calorie target', link: '/tools/daily-calorie-planner/', icon: 'salad' },
      { id: 'body-fat-calculator',   name: 'Body Fat Calculator',    description: 'Calculate your body composition',  link: '/tools/body-fat-calculator/', icon: 'ruler' },
    ];
  }

  function buildRelatedHTML(tools) {
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
    relatedGrid.innerHTML = html;
  }

  /* ============================================
     INIT
  ============================================ */
  restoreState();
  renderRelatedTools();

})();
