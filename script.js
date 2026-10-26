// ==========================================================================
// SYBER SPACE // JEST-STYLE LUXURY HEADER & CART ENGINE
// ==========================================================================

let CART_ITEMS = [];

document.addEventListener('DOMContentLoaded', () => {
    initCart();
    initJekoSearch();
    initOfferSlideshow();
    initBrandGrid();
});

// ==========================================================================
// 1. SHOPPING CART ENGINE
// ==========================================================================
function initCart() {
    try {
        const stored = localStorage.getItem('syber_cart_items');
        if (stored) {
            CART_ITEMS = JSON.parse(stored);
        }
    } catch (e) {
        CART_ITEMS = [];
    }
    updateCartUI();
}

function saveCart() {
    try {
        localStorage.setItem('syber_cart_items', JSON.stringify(CART_ITEMS));
    } catch (e) {}
    updateCartUI();
}

function addToCartById(productId) {
    if (typeof SYBER_PRODUCTS === 'undefined') return;
    const product = SYBER_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = CART_ITEMS.find(item => item.id === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        const img = (product.images && product.images.length > 0) ? product.images[0] : 'assets/official_bestseller_idada_q2i.jpg';
        CART_ITEMS.push({
            id: product.id,
            title: product.title,
            brand: product.brand,
            price: Number(product.price) || 0,
            img: img,
            qty: 1
        });
    }

    saveCart();
    showToast(`Added ${product.brand} to cart!`);
    
    // Open cart drawer so user sees instant feedback
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer && !drawer.classList.contains('active')) {
        drawer.classList.add('active');
        if (overlay) overlay.classList.add('active');
    }
}

function updateCartQty(productId, delta) {
    const item = CART_ITEMS.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        CART_ITEMS = CART_ITEMS.filter(i => i.id !== productId);
    }
    saveCart();
}

function removeCartItem(productId) {
    CART_ITEMS = CART_ITEMS.filter(i => i.id !== productId);
    saveCart();
}

function updateCartUI() {
    const totalCount = CART_ITEMS.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = CART_ITEMS.reduce((sum, i) => sum + (i.price * i.qty), 0);

    // Update Counter Badges
    const badge = document.getElementById('cart-counter');
    if (badge) badge.textContent = totalCount;

    const countSub = document.getElementById('cart-drawer-count');
    if (countSub) countSub.textContent = `${totalCount} ITEM${totalCount === 1 ? '' : 'S'}`;

    const totalVal = document.getElementById('cart-drawer-total');
    if (totalVal) totalVal.innerHTML = `&#8377;${totalPrice.toLocaleString('en-IN')}`;

    // Render Items
    const container = document.getElementById('cart-drawer-items');
    if (!container) return;

    if (CART_ITEMS.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: #7c685d;">
                <p style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; color: #241610;">Your basket is empty</p>
                <p style="font-size: 0.85rem;">Browse our 4G solar &amp; AI surveillance cameras to add items.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = CART_ITEMS.map(item => `
        <div class="cart-item-row">
            <img src="${item.img}" alt="${item.title}" class="cir-img" onerror="this.src='assets/official_bestseller_idada_q2i.jpg'">
            <div class="cir-details">
                <h4 class="cir-title">${item.title}</h4>
                <div class="cir-price">&#8377;${(item.price * item.qty).toLocaleString('en-IN')}</div>
                <div class="cir-controls">
                    <button type="button" class="cir-btn-qty" onclick="updateCartQty('${item.id}', -1)">-</button>
                    <span class="cir-qty-val">${item.qty}</span>
                    <button type="button" class="cir-btn-qty" onclick="updateCartQty('${item.id}', 1)">+</button>
                    <button type="button" class="cir-btn-remove" onclick="removeCartItem('${item.id}')">REMOVE</button>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer) drawer.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

function checkoutViaWhatsApp() {
    if (CART_ITEMS.length === 0) {
        showToast('Your basket is empty!');
        return;
    }

    let msg = `Hello Syber Space, I want to place an order from your website:\n\n`;
    CART_ITEMS.forEach((item, idx) => {
        msg += `${idx + 1}. ${item.title} (Qty: ${item.qty}) - Rs. ${(item.price * item.qty).toLocaleString('en-IN')}\n`;
    });
    const totalPrice = CART_ITEMS.reduce((sum, i) => sum + (i.price * i.qty), 0);
    msg += `\nEstimated Total: Rs. ${totalPrice.toLocaleString('en-IN')}\n`;
    msg += `Please confirm availability and dispatch timeline.`;

    const url = `https://wa.me/917511180808?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

function showToast(message) {
    const toast = document.getElementById('toast-notify');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 2800);
}

// ==========================================================================
// 2. JEKOJETS INTEGRATED SEARCH ENGINE
// ==========================================================================
function initJekoSearch() {
    const input = document.getElementById('jeko-search-input');
    const clearBtn = document.getElementById('jeko-search-clear');
    const dropdown = document.getElementById('jeko-search-dropdown');
    const resultsContainer = document.getElementById('jeko-search-results');

    if (!input || !dropdown) return;

    input.addEventListener('focus', () => {
        dropdown.style.display = 'block';
        performSearch(input.value.trim());
    });

    input.addEventListener('input', () => {
        const val = input.value.trim();
        if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';
        performSearch(val);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(input.value.trim());
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            performSearch('');
            input.focus();
        });
    }

    // Dismiss when clicking outside
    document.addEventListener('click', (e) => {
        const searchBox = document.getElementById('jeko-search-box');
        if (searchBox && !searchBox.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

function quickFillSearch(term) {
    const input = document.getElementById('jeko-search-input');
    const clearBtn = document.getElementById('jeko-search-clear');
    const dropdown = document.getElementById('jeko-search-dropdown');
    if (!input) return;

    input.value = term;
    if (clearBtn) clearBtn.style.display = term ? 'block' : 'none';
    if (dropdown) dropdown.style.display = 'block';
    input.focus();
    performSearch(term);
}

function performSearch(query) {
    const resultsContainer = document.getElementById('jeko-search-results');
    if (!resultsContainer) return;
    if (typeof SYBER_PRODUCTS === 'undefined') return;

    let matches = SYBER_PRODUCTS;
    if (query) {
        const q = query.toLowerCase();
        matches = SYBER_PRODUCTS.filter(p => {
            const title = (p.title || '').toLowerCase();
            const brand = (p.brand || '').toLowerCase();
            const category = (p.category || '').toLowerCase();
            const desc = (p.desc || '').toLowerCase();
            const chips = (p.chips || []).join(' ').toLowerCase();
            return title.includes(q) || brand.includes(q) || category.includes(q) || desc.includes(q) || chips.includes(q);
        });
    }

    // Limit to top 8 items
    const displayList = matches.slice(0, 8);

    if (displayList.length === 0) {
        resultsContainer.innerHTML = `
            <div style="padding: 1.5rem; text-align: center; color: #7c685d; font-size: 0.85rem;">
                No surveillance items found matching "<strong>${query}</strong>".
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = displayList.map(item => {
        const img = (item.images && item.images.length > 0) ? item.images[0] : 'assets/official_bestseller_idada_q2i.jpg';
        return `
            <div class="jeko-search-item" onclick="addToCartById('${item.id}')">
                <img src="${img}" alt="${item.title}" class="jsi-img" onerror="this.src='assets/official_bestseller_idada_q2i.jpg'">
                <div class="jsi-info">
                    <div class="jsi-title">${item.title}</div>
                    <div class="jsi-meta">${item.brand} &bull; ${item.chips ? item.chips.slice(0, 2).join(' &bull; ') : ''}</div>
                </div>
                <div class="jsi-price">&#8377;${Number(item.price).toLocaleString('en-IN')}</div>
            </div>
        `;
    }).join('');
}

function triggerSearchAction() {
    const input = document.getElementById('jeko-search-input');
    const dropdown = document.getElementById('jeko-search-dropdown');
    if (!input) return;
    input.focus();
    if (dropdown) dropdown.style.display = 'block';
    performSearch(input.value.trim());
}


// ==========================================================================
// 3. OFFER HERO SLIDESHOW CONTROLLER
// ==========================================================================
function initOfferSlideshow() {
    const slides = document.querySelectorAll('.offer-slide');
    const dots = document.querySelectorAll('.slide-dot');
    const prevBtn = document.getElementById('prevSlideBtn');
    const nextBtn = document.getElementById('nextSlideBtn');
    const wrap = document.querySelector('.offer-slideshow-wrap');

    if (!slides.length) return;

    let currentSlide = 0;
    let autoplayInterval = null;
    const SLIDE_DURATION = 5000;

    function showSlide(index) {
        if (index < 0) {
            currentSlide = slides.length - 1;
        } else if (index >= slides.length) {
            currentSlide = 0;
        } else {
            currentSlide = index;
        }

        slides.forEach((slide, i) => {
            if (i === currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        dots.forEach((dot, i) => {
            if (i === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function next() {
        showSlide(currentSlide + 1);
    }

    function prev() {
        showSlide(currentSlide - 1);
    }

    function startAutoplay() {
        stopAutoplay();
        autoplayInterval = setInterval(next, SLIDE_DURATION);
    }

    function stopAutoplay() {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            next();
            startAutoplay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prev();
            startAutoplay();
        });
    }

    dots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const targetIndex = parseInt(dot.getAttribute('data-to'), 10);
            if (!isNaN(targetIndex)) {
                showSlide(targetIndex);
                startAutoplay();
            }
        });
    });

    if (wrap) {
        wrap.addEventListener('mouseenter', stopAutoplay);
        wrap.addEventListener('mouseleave', startAutoplay);

        let touchStartX = 0;
        let touchEndX = 0;

        wrap.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        wrap.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchEndX - touchStartX;
            if (Math.abs(diff) > 40) {
                if (diff < 0) {
                    next();
                } else {
                    prev();
                }
                startAutoplay();
            }
        }, { passive: true });
    }

    startAutoplay();
}


// ==========================================================================
// 4. BRAND CATEGORIES & LIVE INVENTORY ENGINE
// ==========================================================================
let CURRENT_BRAND_FILTER = 'ALL';

function initBrandGrid() {
    renderBrandProducts();
}

function filterByBrand(brandKey) {
    CURRENT_BRAND_FILTER = brandKey;
    updatePillActiveState(brandKey);
    renderBrandProducts();
    
    const anchor = document.getElementById('live-inventory-anchor');
    if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function filterByCategory(catKey) {
    CURRENT_BRAND_FILTER = catKey;
    updatePillActiveState(catKey);
    
    if (typeof SYBER_PRODUCTS === 'undefined') return;
    const filtered = SYBER_PRODUCTS.filter(p => p.category === catKey);
    renderProductsGrid(filtered, `Category: ${catKey}`);
    
    const anchor = document.getElementById('live-inventory-anchor');
    if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updatePillActiveState(key) {
    const pills = document.querySelectorAll('.brand-pill');
    pills.forEach(pill => {
        if (pill.getAttribute('data-filter') === key) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
}

function renderBrandProducts() {
    if (typeof SYBER_PRODUCTS === 'undefined') return;

    let list = SYBER_PRODUCTS;
    const b = CURRENT_BRAND_FILTER.toUpperCase();

    if (b !== 'ALL') {
        if (b === 'INFRASTRUCTURE') {
            list = SYBER_PRODUCTS.filter(p => 
                p.category === 'accessory' || 
                p.brand === 'SYBER SPACE' || 
                p.brand === 'ULTRA-LINK' || 
                p.brand === 'SANDISK' ||
                (p.title && (p.title.includes('SMPS') || p.title.includes('Cat6') || p.title.includes('Cable') || p.title.includes('Rack')))
            );
        } else {
            list = SYBER_PRODUCTS.filter(p => (p.brand || '').toUpperCase() === b);
        }
    }

    renderProductsGrid(list, b === 'ALL' ? 'All Products' : b);
}

function renderProductsGrid(list, label) {
    const container = document.getElementById('liveProductsGrid');
    const counter = document.getElementById('active-category-count');
    if (!container) return;

    if (counter) {
        counter.textContent = `Showing ${list.length} item${list.length === 1 ? '' : 's'} (${label})`;
    }

    if (!list || list.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; color: #8c6a54; font-size: 0.95rem;">
                No products found in this category.
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(p => {
        const img = (p.images && p.images.length > 0) ? p.images[0] : 'assets/hero_product_solar_v2.png';
        const brand = p.brand || 'SYBER';
        const chipsHtml = (p.chips || []).slice(0, 3).map(chip => `<span class="lpc-chip">${chip}</span>`).join('');
        const mrpHtml = p.mrp ? `<span class="lpc-mrp">${p.mrp}</span>` : '';
        const saveBadge = p.save ? `<span class="lpc-save-pill">${p.save}</span>` : '';

        return `
            <div class="live-prod-card">
                <div class="lpc-top-tags">
                    <span class="lpc-brand-pill">${brand}</span>
                    ${saveBadge}
                </div>
                <div class="lpc-img-wrap">
                    <img src="${img}" alt="${p.title}" class="lpc-img" loading="lazy" onerror="this.src='assets/hero_product_solar_v2.png'">
                </div>
                <div class="lpc-title" title="${p.title}">${p.title}</div>
                <div class="lpc-chips">${chipsHtml}</div>
                <div class="lpc-price-row">
                    <div class="lpc-price">&#8377;${Number(p.price).toLocaleString('en-IN')}</div>
                    ${mrpHtml}
                </div>
                <button type="button" class="btn-lpc-add" onclick="addToCartById('${p.id}')">
                    [ ADD TO CART ]
                </button>
            </div>
        `;
    }).join('');
}


// ==========================================================================
// 5. BRAND BUBBLE TAKEOVER ENGINE
// ==========================================================================
let brandHoverTimer = null;
const BRAND_HOVER_DELAY = 1200; // 1.2 seconds hover to trigger

const BRAND_META = {
    'TRUEVIEW': { name: 'TRUEVIEW', color: '#c5894e', bg: '#fdf8f2' },
    'CPPLUS': { name: 'CP PLUS', color: '#2e5090', bg: '#f0f4fa' },
    'IDADA': { name: 'iDADA', color: '#e76f51', bg: '#fef5f2' },
    'SEAGATE': { name: 'SEAGATE', color: '#6aaa64', bg: '#f2faf2' },
    'INFRASTRUCTURE': { name: 'INFRASTRUCTURE', color: '#5c4335', bg: '#f5f0eb' }
};

function startBrandHover(event, brandKey) {
    cancelBrandHover();
    brandHoverTimer = setTimeout(() => {
        triggerBubbleTakeover(event, brandKey);
    }, BRAND_HOVER_DELAY);
}

function cancelBrandHover() {
    if (brandHoverTimer) {
        clearTimeout(brandHoverTimer);
        brandHoverTimer = null;
    }
}

function triggerBubbleTakeover(event, brandKey) {
    cancelBrandHover();
    
    const overlay = document.getElementById('brandTakeoverOverlay');
    const bubble = document.getElementById('brandTakeoverBubble');
    const content = document.getElementById('brandTakeoverContent');
    if (!overlay || !bubble) return;

    // Get click/hover origin position
    const x = event.clientX || window.innerWidth / 2;
    const y = event.clientY || window.innerHeight / 2;

    // Calculate required bubble radius to cover entire viewport
    const maxDist = Math.max(
        Math.hypot(x, y),
        Math.hypot(window.innerWidth - x, y),
        Math.hypot(x, window.innerHeight - y),
        Math.hypot(window.innerWidth - x, window.innerHeight - y)
    );
    const diameter = maxDist * 2.2;

    // Get brand metadata
    const meta = BRAND_META[brandKey] || { name: brandKey, color: '#c5894e', bg: '#fdf8f2' };

    // Position and style the bubble
    bubble.style.left = (x - diameter / 2) + 'px';
    bubble.style.top = (y - diameter / 2) + 'px';
    bubble.style.width = diameter + 'px';
    bubble.style.height = diameter + 'px';
    bubble.style.background = meta.bg;

    // Populate content
    const titleEl = document.getElementById('btoTitle');
    const subtitleEl = document.getElementById('btoSubtitle');
    const gridEl = document.getElementById('btoProductsGrid');

    if (typeof SYBER_PRODUCTS !== 'undefined' && gridEl) {
        let products;
        if (brandKey === 'INFRASTRUCTURE') {
            products = SYBER_PRODUCTS.filter(p => 
                p.category === 'accessory' || 
                p.brand === 'SYBER SPACE' || 
                p.brand === 'ULTRA-LINK' || 
                p.brand === 'SANDISK' ||
                (p.title && (p.title.includes('SMPS') || p.title.includes('Cat6') || p.title.includes('Cable') || p.title.includes('Rack')))
            );
        } else {
            products = SYBER_PRODUCTS.filter(p => (p.brand || '').toUpperCase() === brandKey.toUpperCase());
        }

        if (titleEl) titleEl.textContent = meta.name;
        if (titleEl) titleEl.style.color = meta.color;
        if (subtitleEl) subtitleEl.textContent = `${products.length} product${products.length !== 1 ? 's' : ''} available`;

        gridEl.innerHTML = products.map(p => {
            const img = (p.images && p.images.length > 0) ? p.images[0] : 'assets/hero_product_solar_v2.png';
            const chipsHtml = (p.chips || []).slice(0, 3).map(c => `<span class="lpc-chip">${c}</span>`).join('');
            const mrpHtml = p.mrp ? `<span class="lpc-mrp">${p.mrp}</span>` : '';
            const saveBadge = p.save ? `<span class="lpc-save-pill">${p.save}</span>` : '';

            return `
                <div class="live-prod-card">
                    <div class="lpc-top-tags">
                        <span class="lpc-brand-pill">${p.brand || 'SYBER'}</span>
                        ${saveBadge}
                    </div>
                    <div class="lpc-img-wrap">
                        <img src="${img}" alt="${p.title}" class="lpc-img" loading="lazy" onerror="this.src='assets/hero_product_solar_v2.png'">
                    </div>
                    <div class="lpc-title" title="${p.title}">${p.title}</div>
                    <div class="lpc-chips">${chipsHtml}</div>
                    <div class="lpc-price-row">
                        <div class="lpc-price">&#8377;${Number(p.price).toLocaleString('en-IN')}</div>
                        ${mrpHtml}
                    </div>
                    <button type="button" class="btn-lpc-add" onclick="addToCartById('${p.id}')">
                        [ ADD TO CART ]
                    </button>
                </div>
            `;
        }).join('');
    }

    // Activate
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Scroll content to top
    if (content) content.scrollTop = 0;
}

function closeBubbleTakeover() {
    const overlay = document.getElementById('brandTakeoverOverlay');
    const bubble = document.getElementById('brandTakeoverBubble');

    if (!overlay) return;

    // Remove active — CSS transition handles shrink
    overlay.classList.remove('active');
    document.body.style.overflow = '';

    // Reset bubble after transition
    setTimeout(() => {
        if (bubble) {
            bubble.style.transform = '';
        }
    }, 700);
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeBubbleTakeover();
    }
});


// ==========================================================================
// 6. SMART CAMERA FINDER WIZARD ENGINE
// ==========================================================================
let SELECTED_PROPERTY = 'home';

const PROPERTY_LABELS = {
    'home': 'House & Residential',
    'commercial': 'Commercial Building & Retail',
    'office': 'Office & Workspace',
    'farm': 'Farm & Agricultural Land'
};

function selectProperty(propType) {
    SELECTED_PROPERTY = propType;
    const badge = document.getElementById('step-selected-prop-tag');
    if (badge) {
        badge.textContent = `Selected Location: ${PROPERTY_LABELS[propType] || propType}`;
    }
    goToStep(2);
}

function goToStep(stepNum) {
    // Update step panes
    for (let i = 1; i <= 3; i++) {
        const pane = document.getElementById(`wizard-step-1`.replace('1', i));
        const ind = document.getElementById(`step-ind-1`.replace('1', i));
        const line = document.getElementById(`step-line-${i}`);

        if (pane) {
            if (i === stepNum) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        }

        if (ind) {
            if (i === stepNum) {
                ind.classList.add('active');
                ind.classList.remove('completed');
            } else if (i < stepNum) {
                ind.classList.remove('active');
                ind.classList.add('completed');
            } else {
                ind.classList.remove('active');
                ind.classList.remove('completed');
            }
        }

        if (line) {
            if (i < stepNum) {
                line.classList.add('active');
            } else {
                line.classList.remove('active');
            }
        }
    }
}

function computeRecommendation() {
    const checkedBoxes = document.querySelectorAll('input[name="camera_feature"]:checked');
    const features = Array.from(checkedBoxes).map(cb => cb.value);

    let matchProduct = null;
    let matchReason = '';
    let matchScore = '99% SYSTEM MATCH';

    // Rule 1: Off-grid / Farm / Solar / 4G SIM needed
    if (SELECTED_PROPERTY === 'farm' || features.includes('solar') || features.includes('4g_sim')) {
        matchProduct = {
            id: 'trueview-solar-4g-sim-outdoor-pan-tilt-camera',
            title: 'Trueview 4G Solar Smart PTZ Camera',
            brand: 'TRUEVIEW SURVEILLANCE',
            price: 4950,
            mrp: '₹8,999',
            save: 'Save 45%',
            image: 'assets/hero_product_solar_v2.png',
            tags: ['Solar Powered', '4G SIM Connectivity', '360° PTZ', 'Full-Color Night Vision', 'Weatherproof IP66']
        };
        matchReason = `Engineered with high-efficiency monocrystalline solar panels and built-in 4G cellular SIM connectivity. It operates 24/7 with zero electrical cabling and zero local Wi-Fi required — perfect for your ${PROPERTY_LABELS[SELECTED_PROPERTY]}.`;
        matchScore = '99% PERFECT FIT';
    }
    // Rule 2: Commercial / Office / AI Tracking / Siren
    else if (SELECTED_PROPERTY === 'commercial' || SELECTED_PROPERTY === 'office' || features.includes('humanoid') || features.includes('siren')) {
        matchProduct = {
            id: 'cp-plus-ezykam-cp-e38q-3mp-pan-tilt-wi-fi-camera',
            title: 'CP Plus Ezykam CP-E38Q 3MP Pan-Tilt Camera',
            brand: 'CP PLUS AUTHORIZED',
            price: 2235,
            mrp: '₹3,900',
            save: 'Save 43%',
            image: 'assets/hero_product_cpplus_v2.png',
            tags: ['2K Ultra HD', 'AI Humanoid Tracking', 'Active Deterrent Siren', '2-Way Audio', '360° Room Sweep']
        };
        matchReason = `Combines 3MP 2K Ultra HD clarity with AI humanoid motion auto-tracking and an active built-in siren. Delivers comprehensive coverage and deterrence for busy spaces in your ${PROPERTY_LABELS[SELECTED_PROPERTY]}.`;
        matchScore = '98% PERFECT FIT';
    }
    // Rule 3: House / Baby / Home Security / 2-Way Talk
    else {
        matchProduct = {
            id: 'idada-id-q2i35s-td-3mp-pan-tilt-smart-wi-fi-camera',
            title: 'iDADA ID-Q2i35S 3MP Smart Wi-Fi Camera',
            brand: 'IDADA SMART SECURITY',
            price: 1850,
            mrp: '₹3,299',
            save: 'Save 44%',
            image: 'assets/hero_product_idada_v2.png',
            tags: ['3MP Ultra Clarity', '360° Motorized Pan-Tilt', 'Crystal 2-Way Audio', 'Infrared Night Vision', 'Instant App Alerts']
        };
        matchReason = `Precision-engineered for residential villas and modern homes. Blends cleanly into your architecture with discreet wall and soffit mounting, 360° motorized room coverage, crystal two-way audio talkback, and instant mobile security notifications.`;
        matchScore = '97% PERFECT FIT';
    }

    // Populate UI
    const card = document.getElementById('recommendedCameraCard');
    const scoreBadge = document.getElementById('result-score');
    if (scoreBadge) scoreBadge.textContent = matchScore;

    if (card && matchProduct) {
        const tagsHtml = matchProduct.tags.map(t => `<span class="rc-tag">${t}</span>`).join('');
        const waText = encodeURIComponent(`Hello Syber Space, I used your Camera Finder for my ${PROPERTY_LABELS[SELECTED_PROPERTY]} and got matched with ${matchProduct.title} (Rs ${matchProduct.price}). I want to place an order.`);

        const isHome = (SELECTED_PROPERTY === 'home');
        const defaultFitted = isHome ? 'active' : '';
        const defaultUnit = isHome ? '' : 'active';

        card.innerHTML = `
            <div class="rc-visual-col">
                <div class="rc-view-switcher">
                    <button type="button" class="rc-tab-btn ${isHome ? 'active' : ''}" id="rcBtnFitted" onclick="switchRcVisual('fitted')">
                        FITTED ON WALL
                    </button>
                    <button type="button" class="rc-tab-btn ${isHome ? '' : 'active'}" id="rcBtnUnit" onclick="switchRcVisual('unit')">
                        HARDWARE UNIT
                    </button>
                </div>
                <div class="rc-media-frame">
                    <div class="rc-view-pane ${isHome ? 'active' : ''}" id="rcPaneFitted">
                        <img src="assets/camera_mounted_house.jpg" alt="CCTV Camera Fitted on Building" class="rc-fitted-img">
                        <span class="rc-fitted-badge">FITTED IN-SITU ON PROPERTY</span>
                    </div>
                    <div class="rc-view-pane ${isHome ? '' : 'active'}" id="rcPaneUnit">
                        <img src="${matchProduct.image}" alt="${matchProduct.title}" class="rc-img" onerror="this.src='assets/hero_product_solar_v2.png'">
                        <span class="rc-fitted-badge">PRODUCT SPECIFICATION</span>
                    </div>
                </div>
            </div>
            <div class="rc-details-col">
                <span class="rc-brand">${matchProduct.brand}</span>
                <h4 class="rc-title">${matchProduct.title}</h4>
                <div class="rc-reason-box">
                    <strong>Why this matches your space:</strong> ${matchReason}
                </div>
                <div class="rc-tags-list">
                    ${tagsHtml}
                </div>
                <div class="rc-price-row">
                    <span class="rc-price-val">&#8377;${Number(matchProduct.price).toLocaleString('en-IN')}</span>
                    <span class="rc-price-mrp">${matchProduct.mrp}</span>
                    <span class="rc-price-save">${matchProduct.save}</span>
                </div>
                <div class="rc-actions-row">
                    <button type="button" class="btn-rc-cart" onclick="addToCartById('${matchProduct.id}')">
                        [ ADD TO BASKET ]
                    </button>
                    <a href="https://wa.me/917511180808?text=${waText}" target="_blank" rel="noopener noreferrer" class="btn-rc-wa">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
                        ORDER VIA WHATSAPP
                    </a>
                </div>
            </div>
        `;
    }

    goToStep(3);

    // Smooth scroll to recommendation card
    const finderSection = document.getElementById('camera-finder');
    if (finderSection) {
        finderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function resetFinderWizard() {
    goToStep(1);
    const finderSection = document.getElementById('camera-finder');
    if (finderSection) {
        finderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}


function switchRcVisual(mode) {
    const paneFitted = document.getElementById('rcPaneFitted');
    const paneUnit = document.getElementById('rcPaneUnit');
    const btnFitted = document.getElementById('rcBtnFitted');
    const btnUnit = document.getElementById('rcBtnUnit');

    if (mode === 'fitted') {
        if (paneFitted) paneFitted.classList.add('active');
        if (paneUnit) paneUnit.classList.remove('active');
        if (btnFitted) btnFitted.classList.add('active');
        if (btnUnit) btnUnit.classList.remove('active');
    } else {
        if (paneFitted) paneFitted.classList.remove('active');
        if (paneUnit) paneUnit.classList.add('active');
        if (btnFitted) btnFitted.classList.remove('active');
        if (btnUnit) btnUnit.classList.add('active');
    }
}
