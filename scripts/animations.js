/* ============================================
   ANIMATIONS.JS — Project 50
   Scroll-triggered fade-in
   ============================================ */

   (function () {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });
  
    function observe() {
      document.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
        observer.observe(el);
      });
    }
  
    // Observe initial elements
    observe();

    // Re-observe after dynamic content loads
    window.addEventListener('p50:contentLoaded', observe);

    // Re-observe after partials are injected
    window.addEventListener('p50:partialsReady', observe);
  })();