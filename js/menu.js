/**
 * Menu.js — Interactive menu with filtering and category navigation
 */

import menuData from '../content/menu-data.json';

const CATEGORY_ICONS = {
    smallChops: '🥘', seafoodDishes: '🦞', riceAndStew: '🍚', suyaAndMeat: '🥩',
    sharing: '🍽️', sides: '🥗', desserts: '🍰',
    cocktails: '🍸', mocktails: '🥤', juice: '🧃', beerAndDraft: '🍺',
    spirits: '🥃', wine: '🍷', softDrinks: '🥤'
};

const TAG_LABELS = {
    seafood: '🐟 Seafood', grill: '🔥 Grill', spicy: '🌶️ Spicy',
    vegetarian: '🥬 Vegetarian', 'contains-nuts': '🥜 Nuts', 'contains-egg': '🥚 Egg'
};

let currentSection = 'food';
let activeFilters = new Set();
let activeCategory = 'all';

// ── Init ──
function init() {
    // Check for hash to auto-switch to drinks
    if (window.location.hash === '#drinks') {
        currentSection = 'drinks';
    }

    setupToggle();
    renderCategories();
    setupFilters();
    renderMenu();
}

// ── Food / Drinks Toggle ──
function setupToggle() {
    const toggle = document.getElementById('menu-toggle');
    if (!toggle) return;
    toggle.querySelectorAll('.menu-toggle__btn').forEach(btn => {
        if (btn.dataset.section === currentSection) btn.classList.add('is-active');
        else btn.classList.remove('is-active');

        btn.addEventListener('click', () => {
            currentSection = btn.dataset.section;
            activeCategory = 'all';
            activeFilters.clear();
            toggle.querySelectorAll('.menu-toggle__btn').forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');

            // Show/hide filter chips (only for food)
            const filters = document.getElementById('menu-filters');
            if (filters) filters.style.display = currentSection === 'food' ? 'flex' : 'none';

            renderCategories();
            renderMenu();
        });
    });
}

// ── Category Navigation ──
function renderCategories() {
    const container = document.getElementById('menu-categories');
    if (!container) return;

    const data = menuData[currentSection];
    const cats = Object.keys(data);

    container.innerHTML = `
    <button class="menu-category-btn ${activeCategory === 'all' ? 'is-active' : ''}" data-cat="all">All</button>
    ${cats.map(key => `
      <button class="menu-category-btn ${activeCategory === key ? 'is-active' : ''}" data-cat="${key}">
        ${CATEGORY_ICONS[key] || ''} ${data[key].title}
      </button>
    `).join('')}
  `;

    container.querySelectorAll('.menu-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeCategory = btn.dataset.cat;
            container.querySelectorAll('.menu-category-btn').forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            renderMenu();
        });
    });
}

// ── Filter Chips ──
function setupFilters() {
    const filters = document.getElementById('menu-filters');
    if (!filters) return;

    // Only show for food
    if (currentSection !== 'food') filters.style.display = 'none';

    filters.querySelectorAll('.menu-filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const filter = chip.dataset.filter;
            if (activeFilters.has(filter)) {
                activeFilters.delete(filter);
                chip.classList.remove('is-active');
            } else {
                activeFilters.add(filter);
                chip.classList.add('is-active');
            }
            renderMenu();
        });
    });
}

// ── Render Menu Items ──
function renderMenu() {
    const content = document.getElementById('menu-content');
    if (!content) return;

    const data = menuData[currentSection];
    const categories = activeCategory === 'all' ? Object.keys(data) : [activeCategory];
    let html = '';

    categories.forEach(catKey => {
        const category = data[catKey];
        if (!category) return;

        const filteredItems = category.items.filter(item => {
            if (activeFilters.size === 0) return true;
            return [...activeFilters].some(f => item.tags && item.tags.includes(f));
        });

        if (filteredItems.length === 0) return;

        html += `
      <div class="menu-section" id="section-${catKey}">
        <div class="menu-section__header">
          <span class="menu-section__icon">${CATEGORY_ICONS[catKey] || '🍽️'}</span>
          <h2 class="menu-section__title">${category.title}</h2>
          <span class="menu-section__count">${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="menu-items">
          ${filteredItems.map(item => renderItem(item, catKey)).join('')}
        </div>
      </div>
    `;
    });

    if (!html) {
        html = `<div class="text-center" style="padding:var(--space-64) 0;"><p class="text-muted">No items match your filters. Try adjusting your selection.</p></div>`;
    }

    content.innerHTML = html;
}

function renderItem(item, catKey) {
    const isSpirit = catKey === 'spirits';
    const isWine = catKey === 'wine';

    let priceHtml = '';
    if (isSpirit) {
        priceHtml = `<div style="display:flex;gap:var(--space-16);font-size:var(--text-body-sm);">
      <span><span class="text-caption" style="display:block;">Bottle</span><span class="menu-item__price">£${item.bottlePrice}</span></span>
      <span><span class="text-caption" style="display:block;">Shot</span><span class="menu-item__price">£${item.shotPrice}</span></span>
    </div>`;
    } else if (isWine && item.bottlePrice) {
        priceHtml = `<div style="display:flex;gap:var(--space-16);font-size:var(--text-body-sm);">
      <span><span class="text-caption" style="display:block;">Bottle</span><span class="menu-item__price">£${item.bottlePrice}</span></span>
      ${item.glassPrice ? `<span><span class="text-caption" style="display:block;">Glass</span><span class="menu-item__price">£${item.glassPrice}</span></span>` : ''}
    </div>`;
    } else {
        priceHtml = `<span class="menu-item__price">£${item.price}</span>`;
    }

    const tagsHtml = (item.tags || []).filter(t => TAG_LABELS[t]).map(tag =>
        `<span class="menu-item__tag menu-item__tag--${tag}">${TAG_LABELS[tag]}</span>`
    ).join('');

    return `
    <div class="menu-item">
      <div class="menu-item__header">
        <span class="menu-item__name">${item.name}</span>
        ${!isSpirit && !isWine ? priceHtml : ''}
      </div>
      <p class="menu-item__desc">${item.description}</p>
      ${item.addOns ? `<p class="menu-item__addons">${item.addOns}</p>` : ''}
      ${(isSpirit || isWine) ? priceHtml : ''}
      ${tagsHtml ? `<div class="menu-item__tags">${tagsHtml}</div>` : ''}
    </div>
  `;
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', init);
