/**
 * Main.js — Global functionality
 * Header scroll, mobile nav, section reveals, lazy loading
 */

// ── Header Scroll Effect ──
const header = document.getElementById('header');
if (header && !header.classList.contains('is-scrolled')) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
        lastScroll = scrollY;
    }, { passive: true });
}

// ── Mobile Nav Toggle ──
const navToggle = document.getElementById('nav-toggle');
const navMobile = document.getElementById('nav-mobile');

if (navToggle && navMobile) {
    const navMobileClose = document.getElementById('nav-mobile-close');

    const closeMobileNav = () => {
        navToggle.classList.remove('is-active');
        navMobile.classList.remove('is-open');
        document.body.style.overflow = '';
    };

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('is-active');
        navMobile.classList.toggle('is-open');
        document.body.style.overflow = navMobile.classList.contains('is-open') ? 'hidden' : '';
    });

    if (navMobileClose) {
        navMobileClose.addEventListener('click', closeMobileNav);
    }

    // Close on link click
    navMobile.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', closeMobileNav);
    });
}

// ── Intersection Observer for Reveals ──
const revealElements = document.querySelectorAll('.reveal');
if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
}

// ── Stagger Children ──
const staggerElements = document.querySelectorAll('.stagger-children');
if (staggerElements.length > 0) {
    const staggerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                staggerObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    staggerElements.forEach(el => staggerObserver.observe(el));
}

// ── Smooth Scroll for Anchor Links ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ── Active Nav Link Highlighting ──
const currentPath = window.location.pathname;
document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === '/') || (currentPath.endsWith('/index.html') && href === '/')) {
        link.classList.add('is-active');
    } else if (href !== '/' && currentPath.includes(href)) {
        link.classList.add('is-active');
    }
});

// ── Theme Switcher ──
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Check local storage or system preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    html.setAttribute('data-theme', savedTheme);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // Default to light as per new requirement, but respect user choice if previously saved
    // If no save, we default to light (no attribute needed as variables.css handles default)
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

console.log('🍽️ Monika Restaurant — Loaded');
