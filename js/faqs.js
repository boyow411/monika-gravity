/**
 * FAQs.js — Accordion component from JSON data
 */

async function init() {
    const container = document.getElementById('faq-list');
    if (!container) return;

    try {
        const res = await fetch('/content/faqs.json');
        const faqs = await res.json();

        container.innerHTML = faqs.map((faq, i) => `
      <div class="faq-item" id="faq-${i}">
        <button class="faq-item__question" aria-expanded="false" aria-controls="faq-answer-${i}">
          <span>${faq.question}</span>
          <span class="faq-item__icon">+</span>
        </button>
        <div class="faq-item__answer" id="faq-answer-${i}" role="region">
          <p>${faq.answer}</p>
        </div>
      </div>
    `).join('');

        // Accordion behavior
        container.querySelectorAll('.faq-item__question').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.closest('.faq-item');
                const isOpen = item.classList.contains('is-open');

                // Close all
                container.querySelectorAll('.faq-item').forEach(el => {
                    el.classList.remove('is-open');
                    el.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
                });

                // Open clicked (if wasn't open)
                if (!isOpen) {
                    item.classList.add('is-open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
    } catch (err) {
        console.error('Failed to load FAQs:', err);
        container.innerHTML = '<p class="text-muted text-center">Failed to load FAQs. Please try again later.</p>';
    }
}

document.addEventListener('DOMContentLoaded', init);
