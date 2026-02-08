/**
 * Monika AI Receptionist — Chat Widget
 * Knowledge base: FAQs, site content, and full menu data
 */
import faqs from '../content/faqs.json';
import siteContent from '../content/site-content.json';
import menuData from '../content/menu-data.json';

// ── DOM ──
const trigger = document.getElementById('chat-trigger');
const headerChatBtn = document.getElementById('header-chat-btn');
const panel = document.getElementById('chat-panel');
const closeBtn = document.getElementById('chat-close');
const messagesEl = document.getElementById('chat-messages');
const input = document.getElementById('chat-input');
const sendBtn = document.getElementById('chat-send');
const quickActions = document.getElementById('chat-quick-actions');

let isOpen = false;
let lastTopic = null; // conversation memory

// ── Build menu search index ──
const allMenuItems = [];
const categoryMap = {};

function buildMenuIndex() {
    const sections = [
        { type: 'food', data: menuData.food },
        { type: 'drinks', data: menuData.drinks }
    ];

    sections.forEach(({ type, data }) => {
        if (!data) return;
        Object.entries(data).forEach(([categoryKey, categoryVal]) => {
            const items = Array.isArray(categoryVal) ? categoryVal : (categoryVal.items || []);
            const categoryName = (categoryVal.title || categoryKey).replace(/_/g, ' ');
            const normalised = categoryName.toLowerCase();
            if (!categoryMap[normalised]) categoryMap[normalised] = { name: categoryName, items: [] };

            items.forEach(item => {
                const entry = {
                    name: item.name,
                    price: typeof item.price === 'number' ? `£${item.price}` : (item.price || ''),
                    description: item.description || '',
                    category: categoryName,
                    type,
                    tags: item.tags || [],
                    addOns: item.addOns || ''
                };
                allMenuItems.push(entry);
                categoryMap[normalised].items.push(entry);
            });
        });
    });
}
buildMenuIndex();

// ── Opening hours ──
const openingTimes = siteContent.global?.openingTimes || [
    { days: 'Monday – Thursday', hours: '17:00 – 23:00' },
    { days: 'Friday', hours: '13:00 – 23:00' },
    { days: 'Saturday', hours: '13:00 – 23:00' },
    { days: 'Sunday', hours: '13:00 – 22:00' }
];

// ── Toggle chat ──
function openChat() {
    isOpen = true;
    panel.classList.add('is-open');
    input.focus();
}

function closeChat() {
    isOpen = false;
    panel.classList.remove('is-open');
}

function toggleChat() {
    isOpen ? closeChat() : openChat();
}

if (trigger) trigger.addEventListener('click', toggleChat);
if (headerChatBtn) headerChatBtn.addEventListener('click', toggleChat);
if (closeBtn) closeBtn.addEventListener('click', closeChat);

// ── Send message ──
function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    input.value = '';

    if (quickActions) quickActions.style.display = 'none';

    const typing = appendTyping();
    setTimeout(() => {
        typing.remove();
        const response = getResponse(text);
        appendMessage(response, 'bot');
    }, 600 + Math.random() * 600);
}

if (sendBtn) sendBtn.addEventListener('click', sendMessage);
if (input) input.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
});

// ── Quick actions ──
if (quickActions) {
    quickActions.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;

        const actionMap = {
            reserve: 'I\'d like to reserve a table',
            menu: 'Can I see the menu?',
            hire: 'Tell me about private hire',
            hours: 'What are your opening hours?',
            call: 'What\'s your phone number?'
        };

        const text = actionMap[action] || action;
        appendMessage(text, 'user');
        if (quickActions) quickActions.style.display = 'none';

        const typing = appendTyping();
        setTimeout(() => {
            typing.remove();
            appendMessage(getResponse(text), 'bot');
        }, 500);
    });
}

// ── Fuzzy helpers ──
function normalise(str) {
    return str.toLowerCase()
        .replace(/&/g, 'and')
        .replace(/['']/g, "'")
        .replace(/[^a-z0-9\s']/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function fuzzyMatch(query, target) {
    const q = normalise(query);
    const t = normalise(target);
    if (t.includes(q) || q.includes(t)) return true;
    // Levenshtein-ish check for short words (handles typos)
    if (q.length >= 4 && t.length >= 4) {
        const shorter = q.length < t.length ? q : t;
        const longer = q.length >= t.length ? q : t;
        if (longer.includes(shorter)) return true;
        // Allow 1 char difference for 4+ char words
        if (Math.abs(q.length - t.length) <= 1) {
            let mismatches = 0;
            for (let i = 0; i < Math.min(q.length, t.length); i++) {
                if (q[i] !== t[i]) mismatches++;
                if (mismatches > 1) break;
            }
            if (mismatches <= 1) return true;
        }
    }
    return false;
}

// ── Response engine ──
function getResponse(userText) {
    const lower = userText.toLowerCase();
    const norm = normalise(userText);

    // 0. Greetings & social
    if (lower.match(/^(hi|hey|hello|good\s+(morning|afternoon|evening)|hiya|yo|sup)\b/i)) {
        return `Hello! 👋 Welcome to Monika Restaurant. How can I help you today?\n\nYou can ask me about:\n• Our menu & prices\n• Opening hours\n• Reservations\n• Private hire\n• Location & parking`;
    }

    if (lower.match(/\b(thanks?|thank\s*you|cheers|ta|great|perfect|awesome)\b/)) {
        return `You're welcome! 😊 Is there anything else I can help you with?`;
    }

    if (lower.match(/^(bye|goodbye|see\s*ya|later|good\s*night)\b/i)) {
        return `Goodbye! 👋 We hope to see you at Monika soon. Have a wonderful day!`;
    }

    // 1. Check FAQs with weighted scoring
    const faqMatch = matchFAQ(lower);
    if (faqMatch) {
        lastTopic = 'faq';
        return faqMatch;
    }

    // 2. Opening hours
    if (lower.match(/\b(hours?|open(ing)?|clos(e|ed|ing)|times?|when|schedule)\b/)) {
        lastTopic = 'hours';
        const hoursText = openingTimes.map(t => `• ${t.days}: ${t.hours}`).join('\n');
        return `🕐 Our opening hours:\n\n${hoursText}\n\nWe recommend booking ahead for weekends!`;
    }

    // 3. Reservation
    if (lower.match(/\b(reserv|book(ing)?|table)\b/)) {
        lastTopic = 'reservation';
        return `🍽️ We'd love to have you! Reserve your table here:\n\nhttps://web.dojo.app/create_booking/vendor/4w3KsIvZJOhkRjvfcYFI9-mNbTqGcKHCCwTTtEr_NhM_restaurant\n\nOr call us on 020 3345 3841.`;
    }

    // 4. Phone / contact
    if (lower.match(/\b(phone|call(ing)?|number|contact|reach|email)\b/)) {
        lastTopic = 'contact';
        return `📞 You can reach us at 020 3345 3841\n📧 Email: info@monikarestaurant.com\n📍 14 Deptford Broadway, London SE8 4PA`;
    }

    // 5. Location / directions
    if (lower.match(/\b(where|location|address|direction|find\s*us|map|parking|drive|transit|bus|train|dlr)\b/)) {
        lastTopic = 'location';
        return `📍 14 Deptford Broadway, London SE8 4PA\n\n🚆 Nearest station: Deptford Bridge (DLR)\n🚌 Bus routes: 47, 53, 177, 199, 453\n🅿️ Parking nearby: https://maps.app.goo.gl/1ZHKEzsGW2fBqyNQ9\n\nVisit our venue page for more: /venue.html`;
    }

    // 6. Private hire
    if (lower.match(/\b(private|hire|event|party|birthday|wedding|corporate|celebration|function)\b/)) {
        lastTopic = 'private-hire';
        return `🎉 We offer private hire for all occasions!\n\n✓ Birthdays & celebrations\n✓ Weddings & engagements\n✓ Corporate events\n✓ Bespoke menus\n✓ Dedicated events coordinator\n\nEnquire here: /private-hire.html\nOr call: 020 3345 3841`;
    }

    // 7. Price query — "how much is X"
    if (lower.match(/\b(how\s*much|price|cost|cheap|expensive)\b/)) {
        const found = searchMenuItem(norm, true);
        if (found.length > 0) {
            lastTopic = 'menu';
            const top = found.slice(0, 3);
            const items = top.map(i => formatItem(i)).join('\n\n');
            return `Here's what I found:\n\n${items}`;
        }
        return `I couldn't find that specific item. Try asking about a dish by name like "lobster", "jollof", or "mac and cheese"!\n\nOr browse our full menu: /menu.html`;
    }

    // 8. "Do you have / serve X" — item search
    if (lower.match(/\b(do\s*you\s*(have|serve|sell|offer|do)|have\s*you\s*got|is\s*there|any)\b/)) {
        const found = searchMenuItem(norm, true);
        if (found.length > 0) {
            lastTopic = 'menu';
            const top = found.slice(0, 4);
            const items = top.map(i => `• ${i.name} — ${i.price}`).join('\n');
            return `Yes! Here's what we have:\n\n${items}\n\nSee our full menu: /menu.html`;
        }
    }

    // 9. Menu category browsing
    const categoryResult = matchCategory(norm);
    if (categoryResult) {
        lastTopic = categoryResult.key;
        const items = categoryResult.items.slice(0, 6);
        const list = items.map(i => `• ${i.name} — ${i.price}`).join('\n');
        const more = categoryResult.items.length > 6
            ? `\n\n...and ${categoryResult.items.length - 6} more!`
            : '';
        return `🍽️ Our ${categoryResult.name}:\n\n${list}${more}\n\nFull menu: /menu.html`;
    }

    // 10. Tag-based search
    const tagResult = matchTag(norm);
    if (tagResult.length > 0) {
        lastTopic = 'menu';
        const top = tagResult.slice(0, 5);
        const list = top.map(i => `• ${i.name} — ${i.price} (${i.category})`).join('\n');
        const more = tagResult.length > 5 ? `\n\n...and ${tagResult.length - 5} more!` : '';
        return `Here are some options:\n\n${list}${more}\n\nFull menu: /menu.html`;
    }

    // 11. General food/drink terms → try item search
    if (lower.match(/\b(menu|food|drink|eat|dish|starter|main|dessert|cocktail|wine|beer|juice|mojito|margarita)\b/)) {
        const found = searchMenuItem(norm, false);
        if (found.length > 0) {
            lastTopic = 'menu';
            const top = found.slice(0, 5);
            const list = top.map(i => `• ${i.name} — ${i.price}`).join('\n');
            return `Here are some items you might like:\n\n${list}\n\nFull menu: /menu.html`;
        }
        // List categories
        const cats = Object.values(categoryMap).map(c => c.name);
        return `🍽️ Our menu features:\n\n${cats.map(c => `• ${c}`).join('\n')}\n\nAsk about any category or browse: /menu.html`;
    }

    // 12. "What else / more" — use last topic
    if (lower.match(/\b(what\s*else|more|anything\s*else|other|also|another)\b/) && lastTopic) {
        const cat = categoryMap[lastTopic];
        if (cat && cat.items.length > 0) {
            const list = cat.items.slice(0, 6).map(i => `• ${i.name} — ${i.price}`).join('\n');
            return `More from our ${cat.name}:\n\n${list}\n\nFull menu: /menu.html`;
        }
    }

    // 13. Story / about
    if (lower.match(/\b(story|about|history|name|who|805|monika)\b/)) {
        lastTopic = 'story';
        return `Monika Restaurant is named after the famous Monika fish 🐟 — a whole grilled croaker fish beloved at the award-winning 805 Restaurant Group.\n\nWe bring authentic West African flavours with a modern twist, specialising in charcoal-grilled seafood.\n\nRead more: /story.html`;
    }

    // 14. Gallery
    if (lower.match(/\b(photo|picture|image|gallery|see|look|vibe|atmosphere|inside)\b/)) {
        lastTopic = 'gallery';
        return `📸 Check out our gallery for a visual tour of Monika:\n/gallery.html`;
    }

    // 15. Last resort — try a general item search before fallback
    const generalSearch = searchMenuItem(norm, false);
    if (generalSearch.length > 0) {
        lastTopic = 'menu';
        const top = generalSearch.slice(0, 3);
        const items = top.map(i => `• ${i.name} — ${i.price} (${i.category})`).join('\n');
        return `I found these on our menu:\n\n${items}\n\nFull menu: /menu.html`;
    }

    // 16. Fallback
    return `I'm not sure I understood that, but I'm here to help! Try asking about:\n\n• Our menu & prices\n• Opening hours\n• Reservations\n• Private hire\n• Location & parking\n\nOr call us: 020 3345 3841`;
}

// ── FAQ matching with weighted scoring ──
function matchFAQ(query) {
    const norm = normalise(query);
    let bestMatch = null;
    let bestScore = 0;

    // Stop words to exclude from keyword matching
    const stopWords = new Set([
        'what', 'when', 'where', 'which', 'who', 'how', 'does', 'do', 'did',
        'have', 'has', 'had', 'your', 'you', 'they', 'their', 'there',
        'this', 'that', 'with', 'from', 'about', 'make', 'made', 'can',
        'will', 'would', 'should', 'could', 'are', 'were', 'been', 'being',
        'some', 'any', 'many', 'much', 'more', 'most', 'also', 'than',
        'into', 'over', 'such', 'very', 'just', 'only'
    ]);

    for (const faq of faqs) {
        const qNorm = normalise(faq.question);
        const keywords = qNorm.split(' ').filter(w => w.length > 3 && !stopWords.has(w));
        if (keywords.length === 0) continue;

        // Exact question match
        if (norm.includes(qNorm) || qNorm.includes(norm)) {
            return faq.answer;
        }

        // Weighted keyword scoring
        let score = 0;
        for (const kw of keywords) {
            if (norm.includes(kw)) {
                score += kw.length > 5 ? 2 : 1; // longer keywords worth more
            } else if (fuzzyMatch(kw, norm.split(' ').find(w => fuzzyMatch(w, kw)) || '')) {
                score += 0.5;
            }
        }

        const threshold = keywords.length <= 1 ? 2 : (keywords.length <= 3 ? 2.5 : 3);
        if (score >= threshold && score > bestScore) {
            bestScore = score;
            bestMatch = faq.answer;
        }
    }

    return bestMatch;
}

// ── Menu search with scoring ──
function searchMenuItem(query, strict) {
    const words = query.split(/\s+/).filter(w => w.length > 2);
    const skipWords = ['how', 'much', 'the', 'is', 'are', 'do', 'you', 'have', 'any',
        'what', 'can', 'get', 'for', 'price', 'cost', 'show', 'me', 'your',
        'serve', 'sell', 'offer', 'got', 'there', 'about', 'tell', 'like',
        'want', 'would', 'could', 'some', 'please', 'with'];
    const searchWords = words.filter(w => !skipWords.includes(w));

    if (searchWords.length === 0) return [];

    // Score each item
    const scored = allMenuItems.map(item => {
        const nameLower = normalise(item.name);
        const descLower = normalise(item.description);
        const catLower = normalise(item.category);
        const tagsLower = item.tags.join(' ').toLowerCase();
        let score = 0;

        for (const word of searchWords) {
            // Exact name match = highest score
            if (nameLower.includes(word)) score += 10;
            // Fuzzy name match
            else if (nameLower.split(' ').some(nw => fuzzyMatch(word, nw))) score += 7;
            // Description match
            else if (descLower.includes(word)) score += 3;
            // Category match
            else if (catLower.includes(word)) score += 2;
            // Tag match
            else if (tagsLower.includes(word)) score += 2;
        }

        // Bonus for multi-word phrase match in name
        const phrase = searchWords.join(' ');
        if (nameLower.includes(phrase)) score += 15;

        return { ...item, score };
    }).filter(i => i.score > (strict ? 5 : 2));

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
}

// ── Category matching (dynamic from indexed data) ──
function matchCategory(query) {
    // Direct category name match
    for (const [key, cat] of Object.entries(categoryMap)) {
        if (query.includes(key) || key.includes(query)) {
            return { key, name: cat.name, items: cat.items };
        }
    }

    // Keyword-to-category aliases
    const aliases = {
        'starters': 'small chops', 'appetizer': 'small chops', 'snack': 'small chops',
        'fish': 'seafood dishes', 'prawn': 'seafood dishes', 'lobster': 'seafood dishes',
        'crab': 'seafood dishes', 'shrimp': 'seafood dishes',
        'jollof': 'rice and stew', 'fried rice': 'rice and stew',
        'beef': 'suya and meat', 'chicken': 'suya and meat', 'lamb': 'suya and meat',
        'goat': 'suya and meat',
        'platter': 'sharing', 'share': 'sharing',
        'side dish': 'sides', 'extra': 'sides',
        'sweet': 'desserts', 'pudding': 'desserts', 'cake': 'desserts', 'ice cream': 'desserts',
        'cocktail': 'cocktails', 'mixology': 'cocktails',
        'mocktail': 'mocktails', 'non alcoholic': 'mocktails', 'virgin': 'mocktails',
        'fresh juice': 'fresh juice', 'smoothie': 'fresh juice',
        'lager': 'beer and draft', 'draft': 'beer and draft', 'ale': 'beer and draft',
        'vodka': 'spirits', 'gin': 'spirits', 'rum': 'spirits',
        'whisky': 'spirits', 'whiskey': 'spirits', 'brandy': 'spirits', 'cognac': 'spirits',
        'champagne': 'wine and champagne', 'prosecco': 'wine and champagne',
        'red wine': 'wine and champagne', 'white wine': 'wine and champagne',
        'soda': 'soft drinks', 'coke': 'soft drinks', 'fanta': 'soft drinks', 'water': 'soft drinks'
    };

    for (const [alias, catKey] of Object.entries(aliases)) {
        if (query.includes(alias)) {
            // Find the category by checking all keys
            for (const [key, cat] of Object.entries(categoryMap)) {
                if (normalise(key).includes(normalise(catKey)) || normalise(catKey).includes(normalise(key))) {
                    return { key, name: cat.name, items: cat.items };
                }
            }
        }
    }

    return null;
}

// ── Tag matching ──
function matchTag(query) {
    const tagKeywords = {
        'spicy': ['spicy', 'hot', 'pepper', 'chili', 'chilli'],
        'vegetarian': ['vegetarian', 'veggie', 'vegan', 'plant based'],
        'seafood': ['seafood'],
        'grill': ['grill', 'grilled', 'charcoal', 'bbq', 'barbecue'],
        'contains-nuts': ['nut', 'nuts', 'peanut'],
        'contains-egg': ['egg']
    };

    for (const [tag, keywords] of Object.entries(tagKeywords)) {
        if (keywords.some(kw => query.includes(kw))) {
            return allMenuItems.filter(item => item.tags.includes(tag));
        }
    }
    return [];
}

// ── Format helpers ──
function formatItem(item) {
    let text = `• ${item.name} — ${item.price}`;
    if (item.description) text += `\n  ${item.description}`;
    if (item.addOns) text += `\n  🔸 ${item.addOns}`;
    return text;
}

// ── UI helpers ──
function appendMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `chat-message chat-message--${sender}`;
    // Render line breaks as <br> for bot messages
    if (sender === 'bot') {
        div.innerHTML = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
            .replace(/(\/[\w-]+\.html)/g, '<a href="$1">$1</a>');
    } else {
        div.textContent = text;
    }
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
}

function appendTyping() {
    const div = document.createElement('div');
    div.className = 'chat-message chat-message--bot chat-typing';
    div.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
}
