/* ============================================
   EMI.JS — Project 50
   EMI Calculator — State-Driven with Persistence

   FORMULA
   ───────
   EMI = P × r × (1+r)^n / ((1+r)^n - 1)
   where:
     P = principal loan amount
     r = monthly interest rate (annual% / 100 / 12)
     n = total months (years × 12)
   Edge case: if rate = 0, EMI = P / n

   DATA FLOW
   ─────────
   Sliders change → update() + scheduleSave()
   Calculate button → calculate() → renderResult() → saveState()
   Reset button → resetAll() → P50Storage.remove()
   Page loads → restoreState() → update()

   LOCALSTORAGE KEY: "p50_emi"
============================================ */

(function () {
  'use strict';

  /* ---- Constants ---- */
  var STORAGE_KEY  = 'p50_emi';
  var DEBOUNCE_MS  = 300;

  /* ---- DOM refs — grabbed once ---- */
  var loanInput     = document.getElementById('loan-amount');
  var rateInput     = document.getElementById('interest-rate');
  var tenureInput   = document.getElementById('loan-tenure');
  var loanDisplay   = document.getElementById('loan-display');
  var rateDisplay   = document.getElementById('rate-display');
  var tenureDisplay = document.getElementById('tenure-display');
  var calcBtn       = document.getElementById('calc-emi');
  var resetBtn      = document.getElementById('emi-reset-btn');
  var resultEl      = document.getElementById('emi-result');
  var emiValueEl    = document.getElementById('emi-value');
  var principalEl   = document.getElementById('principal-val');
  var interestEl    = document.getElementById('interest-val');
  var totalEl       = document.getElementById('total-val');
  var relatedWrap   = document.getElementById('emi-related-wrap');
  var relatedGrid   = document.getElementById('emi-related-grid');

  /* ---- Debounce timer ---- */
  var saveTimer = null;

  /* ============================================
     FORMAT CURRENCY — Indian locale, rupee prefix
  ============================================ */
  function fmt(n) {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }

  /* ============================================
     UPDATE DISPLAY LABELS
     Refreshes live value labels beside each slider.
  ============================================ */
  function update() {
    var amount = Number(loanInput.value);
    var rate   = Number(rateInput.value);
    var years  = Number(tenureInput.value);

    loanDisplay.textContent   = fmt(amount);
    rateDisplay.textContent   = rate.toFixed(1) + '%';
    tenureDisplay.textContent = years + (years === 1 ? ' year' : ' years');
  }

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
      loan:   loanInput.value,
      rate:   rateInput.value,
      tenure: tenureInput.value,
    });
  }

  /* ============================================
     PERSISTENCE — restore on page load
  ============================================ */
  function restoreState() {
    if (!window.P50Storage) return;
    var saved = P50Storage.get(STORAGE_KEY, null);
    if (!saved) return;

    if (saved.loan   != null) loanInput.value   = saved.loan;
    if (saved.rate   != null) rateInput.value   = saved.rate;
    if (saved.tenure != null) tenureInput.value = saved.tenure;
  }

  /* ============================================
     CALCULATE EMI
  ============================================ */
  function calculate() {
    var P      = Number(loanInput.value);
    var annual = Number(rateInput.value);
    var years  = Number(tenureInput.value);
    var r      = annual / 100 / 12;
    var n      = years * 12;

    var emi;
    if (r === 0) {
      emi = P / n;
    } else {
      var factor = Math.pow(1 + r, n);
      emi = (P * r * factor) / (factor - 1);
    }

    var total    = emi * n;
    var interest = total - P;

    renderResult(emi, P, interest, total);
    saveState(); /* immediate save after calculation */
  }

  /* ============================================
     RENDER RESULT
  ============================================ */
  function renderResult(emi, principal, interest, total) {
    emiValueEl.textContent  = fmt(emi);
    principalEl.textContent = fmt(principal);
    interestEl.textContent  = fmt(interest);
    totalEl.textContent     = fmt(total);

    resultEl.hidden = false;
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (window.P50ToolBase) P50ToolBase.triggerAnimations();

    /* Move related tools below results */
    moveRelatedBelowResults();
  }

  /* ============================================
     RESET
  ============================================ */
  function resetAll() {
    clearTimeout(saveTimer);

    /* Restore slider defaults */
    loanInput.value   = 500000;
    rateInput.value   = 8.5;
    tenureInput.value = 5;

    /* Refresh display labels */
    update();

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
    if (resultEl.nextElementSibling !== relatedWrap) {
      resultEl.after(relatedWrap);
    }
  }

  /* ============================================
     RELATED TOOLS — render from tools.json
     Finance category only, max 4, excludes self.
  ============================================ */

  function renderRelatedTools() {
    if (!relatedGrid) return;

    fetch('/data/tools.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var related = (data.allTools || [])
          .filter(function (t) {
            return t.category === 'finance-tools' && t.id !== 'emi-calculator';
          })
          .slice(0, 4);

          if (!related.length) related = getHardcodedFallback();
          buildRelatedHTML(related);
      })
      .catch(function () {
          buildRelatedHTML(getHardcodedFallback());
      });
  }

  function getHardcodedFallback() {
    return [
      { id: 'sip-calculator',        name: 'SIP Calculator',        description: 'Plan your monthly SIP investments',  link: '/tools/sip-calculator/', icon: 'trending-up' },
      { id: 'compound-interest',     name: 'Compound Interest',     description: 'Calculate compound growth over time', link: '/tools/compound-interest/', icon: 'percent' },
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
     EVENT WIRING
  ============================================ */

  /* Slider → live label + debounced save */
  [loanInput, rateInput, tenureInput].forEach(function (input) {
    if (input) {
      input.addEventListener('input', function () {
        update();
        scheduleSave();
      });
    }
  });

  /* Calculate button */
  if (calcBtn) calcBtn.addEventListener('click', calculate);

  /* Reset button */
  if (resetBtn) resetBtn.addEventListener('click', resetAll);

  /* Enter key inside emi-form triggers calculate */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || document.activeElement.tagName === 'BUTTON') return;
    if (!document.activeElement.closest('.emi-form')) return;
    calculate();
  });

  /* ============================================
     INIT
  ============================================ */
  restoreState(); /* Restore saved slider positions first */
  update();       /* Then refresh display labels */
  renderRelatedTools();

})();
