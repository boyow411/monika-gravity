/**
 * Analytics.js — Lightweight event tracking stub
 * Replace with real analytics (GA4, Mixpanel, etc.) when ready
 */

// Track CTA clicks
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[id]');
    if (!btn) return;

    const trackableIds = [
        'hero-reserve-btn', 'hero-menu-btn', 'nav-reserve-btn',
        'sticky-reserve-btn', 'bookings-reserve-btn', 'food-menu-btn',
        'private-hire-btn', 'story-btn', 'download-pdf-btn',
        'chat-trigger', 'chat-send'
    ];

    if (trackableIds.includes(btn.id)) {
        console.log(`[Analytics] CTA click: ${btn.id}`);
        // TODO: Send to analytics provider
        // gtag('event', 'cta_click', { button_id: btn.id });
    }
});

// Track page view
console.log(`[Analytics] Page view: ${window.location.pathname}`);
