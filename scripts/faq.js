/* ============================================
   FAQ.JS — Project 50
   Accordion FAQ
   ============================================ */

   (function () {
    const faqData = [
      {
        q: 'Are all tools completely free?',
        a: 'Yes — every tool on Project 50 is 100% free. No subscriptions, no premium tier, no paywalls. All 50 tools, always free.'
      },
      {
        q: 'Do I need to create an account?',
        a: 'No account is required. Just open a tool and start using it immediately. We believe useful tools should be instantly accessible.'
      },
      {
        q: 'Is my data private and secure?',
        a: 'Absolutely. All tools run entirely in your browser. Your data never leaves your device and is never sent to any server.'
      },
      {
        q: 'Can I use these tools on my phone?',
        a: 'Yes. Project 50 is built mobile-first and works perfectly on phones, tablets, and desktops. Every tool is fully responsive.'
      },
      {
        q: 'Will more tools be added?',
        a: 'Yes! We\'re continuously expanding. The current 50 tools are just the start. New tools are added regularly across all categories.'
      }
    ];
  
    const container = document.getElementById('faq-list');
    if (!container) return;
  
    // Render FAQ items
    faqData.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = 'faq-item';
      el.setAttribute('role', 'listitem');
      el.innerHTML = `
        <div class="faq-question" role="button" aria-expanded="false" aria-controls="faq-answer-${i}" tabindex="0" id="faq-question-${i}">
          <span class="faq-question-text">${item.q}</span>
          <div class="faq-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
        <div class="faq-answer" id="faq-answer-${i}" role="region" aria-labelledby="faq-question-${i}">
          <div class="faq-answer-inner">
            <p class="faq-answer-text">${item.a}</p>
          </div>
        </div>
      `;
      container.appendChild(el);
    });
  
    // Accordion behavior
    container.querySelectorAll('.faq-question').forEach(question => {
      function toggle() {
        const item = question.closest('.faq-item');
        const isOpen = item.classList.contains('open');
  
        // Close all others
        container.querySelectorAll('.faq-item.open').forEach(openItem => {
          if (openItem !== item) {
            openItem.classList.remove('open');
            openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          }
        });
  
        // Toggle current
        item.classList.toggle('open', !isOpen);
        question.setAttribute('aria-expanded', String(!isOpen));
      }
  
      question.addEventListener('click', toggle);
      question.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  
    // Open first by default
    const firstItem = container.querySelector('.faq-item');
    if (firstItem) {
      firstItem.classList.add('open');
      firstItem.querySelector('.faq-question').setAttribute('aria-expanded', 'true');
    }
  })();