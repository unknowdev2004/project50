/* ============================================
   [TOOL-SLUG].JS — Project 50
   [TOOL NAME] — tool-specific logic ONLY.

   LOAD ORDER: Last deferred script on the page.
   DEPENDS ON (available as globals):
     P50Utils    — escHtml, formatNumber, debounce
     P50ToolBase — renderRelatedTools, triggerAnimations

   RESPONSIBILITIES (this file):
     • Read inputs and validate
     • Run the calculation / transform
     • Write results to the DOM
     • Show/hide the result card
     • Register event listeners

   DO NOT:
     • Touch header, footer, sidebar, theme
     • Load tools.json directly (use P50ToolBase)
     • Write to localStorage directly (use P50Storage)

   PATTERN:
     1. Cache DOM references
     2. Attach event listeners
     3. validate() — return true/false + show errors
     4. calculate() — pure logic, return result object
     5. render(result) — write to DOM, show result card

   RELATED TOOLS:
     Call once after DOM ready:
       P50ToolBase.renderRelatedTools(
         'tool-related-grid',  // id of grid container
         '[tool-slug]',        // current tool id
         '[category-id]'       // category for prioritisation
       );
============================================ */

(function () {
  'use strict';

  /* ---- DOM references ---- */
  /* Cache elements at init — do NOT query inside event handlers */
  var inputEl    = document.getElementById('[input-id]');
  var calcBtn    = document.getElementById('[calc-btn-id]');
  var resultEl   = document.getElementById('[result-id]');
  var resultNum  = document.getElementById('[result-number-id]');
  var resultStatus = document.getElementById('[result-status-id]');

  /* ---- Validation ---- */
  /* Returns true if inputs are valid, false otherwise.
     Show inline errors here (add .tool-field--error class, etc.) */
  function validate() {
    var val = parseFloat(inputEl.value);
    if (isNaN(val) || val <= 0) {
      inputEl.focus();
      return false;
    }
    return true;
  }

  /* ---- Calculation ---- */
  /* Pure function — no DOM side-effects.
     Returns a plain object with result values. */
  function calculate() {
    var val = parseFloat(inputEl.value);
    /* TODO: implement calculation */
    return {
      result: val,
      status: '[status label]'
    };
  }

  /* ---- Render ---- */
  /* Writes result object to DOM and reveals result card. */
  function render(data) {
    resultNum.textContent    = data.result;
    resultStatus.textContent = data.status;
    resultEl.removeAttribute('hidden');

    /* Trigger fade-in animations for dynamically shown elements */
    if (window.P50ToolBase) {
      P50ToolBase.triggerAnimations();
    }
  }

  /* ---- Event: calculate button ---- */
  calcBtn.addEventListener('click', function () {
    if (!validate()) return;
    var data = calculate();
    render(data);
  });

  /* ---- Event: Enter key on inputs ---- */
  /* Keyboard accessibility — Enter triggers calculation */
  [inputEl].forEach(function (el) {
    if (!el) return;
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') calcBtn.click();
    });
  });

  /* ---- Related tools ---- */
  /* Renders related tool cards in #tool-related-grid */
  if (window.P50ToolBase) {
    P50ToolBase.renderRelatedTools(
      'tool-related-grid',
      '[tool-slug]',
      '[category-id]'
    );
  }

})();
