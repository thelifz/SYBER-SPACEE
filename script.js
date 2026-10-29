// ==========================================================================
// SYBER SPACE // JEST-STYLE LUXURY HEADER & CART WINDOW SYNC ENGINE
// ==========================================================================

let CART_ITEMS = [];

document.addEventListener('DOMContentLoaded', () => {
    initCart();
    initJekoSearch();
    initOfferSlideshow();
    initBrandGrid();
    initAsusShowcaseScroll();

    // Support URL param ?brand=TRUEVIEW or ?test_bubble=TRUEVIEW or ?search=...
    const urlParams = new URLSearchParams(window.location.search);
    const brandParam = urlParams.get('brand');
    if (brandParam && typeof switchBrandDisplay === 'function') {
        switchBrandDisplay(brandParam);
    }
    const searchParam = urlParams.get('search') || urlParams.get('q');
    if (searchParam) {
        setTimeout(() => {
            quickFillSearch(searchParam);
        }, 200);
    }
    const scrollParam = urlParams.get('scroll');
    if (scrollParam) {
        setTimeout(() => {
            const showcase = document.getElementById('hardware-showcase');
            const container = document.getElementById('asus-stage-container');
            if (scrollParam === 'showcase' && showcase) {
                window.scrollTo({ top: showcase.offsetTop, behavior: 'instant' });
            } else if (scrollParam === 'stage1' && container) {
                window.scrollTo({ top: container.offsetTop + 100, behavior: 'instant' });
            } else if (scrollParam === 'stage2' && container) {
                window.scrollTo({ top: container.offsetTop + 700, behavior: 'instant' });
            } else if (scrollParam === 'stage3' && container) {
                window.scrollTo({ top: container.offsetTop + 1400, behavior: 'instant' });
            } else if (scrollParam === 'stage4' && container) {
                window.scrollTo({ top: container.offsetTop + 2100, behavior: 'instant' });
            }
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
            }
        }, 300);
    }

    // Smooth scroll for 3D showcase anchor links
    document.querySelectorAll('a[href="#hardware-showcase"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sc = document.getElementById('hardware-showcase');
            if (sc) {
                const headerOffset = 70;
                const elementPosition = sc.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            } else {
                window.location.href = 'product.html?scroll=showcase';
            }
        });
    });

});

// Sync cart changes across all open browser windows/tabs in real-time
window.addEventListener('storage', (e) => {
    if (e.key === 'syber_cart' || e.key === 'syber_cart_items') {
        initCart();
    }
});

// ==========================================================================
// 1. SHOPPING CART ENGINE & DEDICATED CART WINDOW LAUNCHER
// ==========================================================================
function initCart() {
    try {
        let raw = localStorage.getItem('syber_cart');
        if (!raw) {
            raw = localStorage.getItem('syber_cart_items');
            if (raw) localStorage.setItem('syber_cart', raw);
        }
        CART_ITEMS = JSON.parse(raw || '[]');
        // Normalize
        CART_ITEMS = CART_ITEMS.map(i => ({
            id: i.id || `prod-${Math.random()}`,
            title: i.title || i.name || 'Surveillance Camera',
            name: i.title || i.name || 'Surveillance Camera',
            brand: i.brand || 'SYBER',
            price: Number(i.price) || 0,
            mrp: i.mrp || '',
            save: i.save || '',
            img: i.img || i.image || 'assets/official_bestseller_idada_q2i.jpg',
            image: i.img || i.image || 'assets/official_bestseller_idada_q2i.jpg',
            qty: Number(i.qty || i.quantity || 1),
            quantity: Number(i.qty || i.quantity || 1)
        }));
    } catch (e) {
        CART_ITEMS = [];
    }
    updateCartUI();
}

function saveCart() {
    try {
        localStorage.setItem('syber_cart', JSON.stringify(CART_ITEMS));
        localStorage.setItem('syber_cart_items', JSON.stringify(CART_ITEMS));
    } catch (e) {}
    updateCartUI();
}

function openCartWindow(e) {
    window.location.href = 'cart.html';
}

function addToCartById(productId) {
    if (typeof SYBER_PRODUCTS === 'undefined') return;
    const product = SYBER_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = CART_ITEMS.find(item => item.id === productId);
    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
        existing.quantity = existing.qty;
    } else {
        const img = (product.images && product.images.length > 0) ? product.images[0] : 'assets/official_bestseller_idada_q2i.jpg';
        CART_ITEMS.push({
            id: product.id,
            title: product.title,
            name: product.title,
            brand: product.brand || 'SYBER',
            price: Number(product.price) || 0,
            mrp: product.mrp || '',
            save: product.save || '',
            img: img,
            image: img,
            qty: 1,
            quantity: 1
        });
    }

    saveCart();
    showToastWithCartButton(product.title, product.brand);
}

function updateCartQty(productId, delta) {
    const item = CART_ITEMS.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    item.quantity = item.qty;
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
    const totalCount = CART_ITEMS.reduce((sum, i) => sum + (i.qty || 1), 0);
    const totalPrice = CART_ITEMS.reduce((sum, i) => sum + (i.price * (i.qty || 1)), 0);

    // Update Counter Badges
    const badge = document.getElementById('cart-counter');
    if (badge) badge.textContent = totalCount;

    const countSub = document.getElementById('cart-drawer-count');
    if (countSub) countSub.textContent = `${totalCount} ITEM${totalCount === 1 ? '' : 'S'}`;

    const totalVal = document.getElementById('cart-drawer-total');
    if (totalVal) totalVal.innerHTML = `&#8377;${totalPrice.toLocaleString('en-IN')}`;

    // Render Items inside drawer if modal still opened
    const container = document.getElementById('cart-drawer-items');
    if (!container) return;

    if (CART_ITEMS.length === 0) {
        container.innerHTML = `
            <div class="cw-empty-state">
                <div class="cw-empty-icon">
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#0f172a" stroke-width="1.8">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                </div>
                <h4 class="cw-empty-title">Your Cart is Empty</h4>
                <p class="cw-empty-desc">Explore genuine 4G solar, Wi-Fi &amp; AI surveillance cameras at direct wholesale prices.</p>
                <button type="button" class="btn-cw-browse" onclick="toggleCartDrawer()">
                    BROWSE INVENTORY &rarr;
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = CART_ITEMS.map(item => `
        <div class="cart-item-row">
            <img src="${item.img}" alt="${item.title}" class="cir-img" onerror="this.src='assets/official_bestseller_idada_q2i.jpg'">
            <div class="cir-details">
                <span class="cir-brand">${item.brand || 'SURVEILLANCE'}</span>
                <h4 class="cir-title">${item.title}</h4>
                <div class="cir-price">&#8377;${(item.price * item.qty).toLocaleString('en-IN')}</div>
                <div class="cir-controls">
                    <button type="button" class="cir-btn-qty" onclick="updateCartQty('${item.id}', -1)" aria-label="Decrease">&minus;</button>
                    <span class="cir-qty-val">${item.qty}</span>
                    <button type="button" class="cir-btn-qty" onclick="updateCartQty('${item.id}', 1)" aria-label="Increase">&#43;</button>
                    <button type="button" class="cir-btn-remove" onclick="removeCartItem('${item.id}')">REMOVE</button>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleCartDrawer() {
    // Open dedicated cart window directly
    openCartWindow();
}

function checkoutViaWhatsApp() {
    if (CART_ITEMS.length === 0) {
        showToast('Your basket is empty!');
        return;
    }

    let msg = `Hello Syber Space, I want to place an order from your website:

`;
    CART_ITEMS.forEach((item, idx) => {
        msg += `${idx + 1}. ${item.title} (Qty: ${item.qty}) - Rs. ${(item.price * item.qty).toLocaleString('en-IN')}
`;
    });
    const totalPrice = CART_ITEMS.reduce((sum, i) => sum + (i.price * i.qty), 0);
    msg += `
Estimated Total: Rs. ${totalPrice.toLocaleString('en-IN')}
`;
    msg += `Please confirm availability and dispatch timeline.`;

    const url = `https://wa.me/917511180808?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

let toastTimer = null;
function showToast(message) {
    const toast = document.getElementById('toast-notify');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('active');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('active');
    }, 2800);
}

function showToastWithCartButton(title, brand) {
    const toast = document.getElementById('toast-notify');
    if (!toast) return;
    const shortTitle = (title.length > 28) ? title.substring(0, 28) + '...' : title;
    toast.innerHTML = `
        <div class="toast-cart-win-wrap">
            <div class="tcw-text-block">
                <span class="tcw-kicker">ADDED TO CART</span>
                <span class="tcw-title">${shortTitle}</span>
            </div>
            <a href="cart.html" class="btn-tcw-open">
                VIEW CART &rarr;
            </a>
        </div>
    `;
    toast.classList.add('active');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('active');
    }, 4500);
}


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
            <div class="jeko-search-item" onclick="window.location.href='product.html?id=' + encodeURIComponent('${item.id}')">
                <img src="${img}" alt="${item.title}" class="jsi-img" onerror="this.src='assets/official_bestseller_idada_q2i.jpg'">
                <div class="jsi-info">
                    <div class="jsi-title">${item.title}</div>
                    <div class="jsi-meta">${item.brand} • ${item.chips ? item.chips.slice(0, 2).join(' • ') : ''}</div>
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
    const SLIDE_DURATION = 4500;

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
            <div style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; color: #64748b; font-size: 0.95rem;">
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
                <div class="lpc-img-wrap" onclick="window.location.href='product.html?id=${p.id}'" style="cursor: pointer;">
                    <img src="${img}" alt="${p.title}" class="lpc-img" loading="lazy" onerror="this.src='assets/hero_product_solar_v2.png'">
                </div>
                <div class="lpc-title" title="${p.title}" onclick="window.location.href='product.html?id=${p.id}'" style="cursor: pointer;">${p.title}</div>
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
// Brand bubble takeover & hover strips removed per user specification.

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



// ==========================================================================
// ASUS ROG / APPLE-LEVEL GSAP PINNED HARDWARE SHOWCASE ENGINE
// Sticky center camera, scrolling features track, and right-corner buy dock
// ==========================================================================
const SHOWCASE_FEATURE_DATA = [
    {
        title: "01 // DUAL-AXIS GIMBAL ACTIVE",
        rotateY: -10,
        rotateZ: -3,
        scale: 1.02,
        pointerId: "ptr-0"
    },
    {
        title: "02 // 4G CELLULAR CORE STANDBY",
        rotateY: 12,
        rotateZ: 2,
        scale: 1.04,
        pointerId: "ptr-1"
    },
    {
        title: "03 // 7.8W SOLAR ARRAY CHARGING",
        rotateY: 0,
        rotateZ: -5,
        scale: 1.06,
        pointerId: "ptr-2"
    },
    {
        title: "04 // NEURAL AI INFERENCE ONLINE",
        rotateY: -5,
        rotateZ: 0,
        scale: 1.09,
        pointerId: "ptr-3"
    },
    {
        title: "05 // IP66 DIELECTRIC SEAL LOCKED",
        rotateY: 8,
        rotateZ: 3,
        scale: 1.03,
        pointerId: "ptr-4"
    }
];

let currentShowcaseIndex = 0;

function initAsusShowcaseScroll() {
    const showcaseSection = document.getElementById('hardware-showcase');
    const stageViewport = document.getElementById('asus-stage-viewport');
    const featuresTrack = document.getElementById('asus-features-track');
    const cameraImg = document.getElementById('asus-camera-img');
    const featureCards = document.querySelectorAll('.asus-feature-card');

    if (!showcaseSection || !stageViewport) return;

    // Feature card click: allows user to jump to any feature directly
    featureCards.forEach((card, idx) => {
        card.addEventListener('click', () => {
            setActiveShowcaseFeature(idx);
        });
    });

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('GSAP or ScrollTrigger not loaded, fallback enabled');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Refresh ScrollTrigger once images/fonts finish loading
    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    });

    // Pinning the stage viewport with GSAP ScrollTrigger
    const showcaseTl = gsap.timeline({
        scrollTrigger: {
            trigger: '#asus-stage-viewport',
            start: 'top top+=78',
            end: '+=2000',
            pin: true,
            scrub: 0.5,
            fastScrollEnd: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                const progress = self.progress; // 0 to 1
                const count = SHOWCASE_FEATURE_DATA.length;
                const targetIdx = Math.min(count - 1, Math.floor(progress * count));
                
                if (targetIdx !== currentShowcaseIndex) {
                    setActiveShowcaseFeature(targetIdx);
                }

                // Continuous dynamic scrub micro-perspective on camera
                if (cameraImg) {
                    const cfg = SHOWCASE_FEATURE_DATA[targetIdx];
                    const microTilt = (progress - 0.5) * 8;
                    cameraImg.style.transform = `perspective(1000px) rotateY(${cfg.rotateY + microTilt}deg) rotateZ(${cfg.rotateZ}deg) scale(${cfg.scale})`;
                }
            }
        }
    });

    // Animate features track scrolling smoothly from top (Feature 01) through all cards
    if (featuresTrack && window.innerWidth > 980) {
        showcaseTl.fromTo(featuresTrack, 
            { y: 0 },
            {
                y: () => {
                    const trackH = featuresTrack.scrollHeight;
                    const containerH = stageViewport.clientHeight;
                    return -Math.max(0, trackH - containerH + 60);
                },
                ease: 'none',
                duration: 1
            }, 
            0
        );
    }
}

function setActiveShowcaseFeature(index) {
    currentShowcaseIndex = index;
    const featureCards = document.querySelectorAll('.asus-feature-card');
    const pointers = document.querySelectorAll('.asus-hud-pointer');
    const targetText = document.getElementById('acr-target-text');
    const stepIndicator = document.getElementById('afh-step-indicator');
    const cameraImg = document.getElementById('asus-camera-img');

    // Update active feature card
    featureCards.forEach((card, i) => {
        if (i === index) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    // Update active pointer
    pointers.forEach((ptr, i) => {
        if (i === index) {
            ptr.classList.add('active');
        } else {
            ptr.classList.remove('active');
        }
    });

    // Update text telemetry
    if (SHOWCASE_FEATURE_DATA[index]) {
        const item = SHOWCASE_FEATURE_DATA[index];
        if (targetText) targetText.textContent = item.title;
        if (stepIndicator) stepIndicator.textContent = `STAGE ${index + 1} / ${SHOWCASE_FEATURE_DATA.length}`;
        if (cameraImg) {
            cameraImg.style.transform = `perspective(1000px) rotateY(${item.rotateY}deg) rotateZ(${item.rotateZ}deg) scale(${item.scale})`;
        }
    }
}

function addShowcaseCameraToCart(buyNow = false) {
    const flagshipId = 'trueview-solar-4g-sim-outdoor-pan-tilt-camera';
    addToCartById(flagshipId);
    if (buyNow) {
        window.location.href = 'cart.html';
    }
}


// ==========================================================================
// AUTHORIZED BRANDS SHOWCASE LOGIC (MATCHING REFERENCE DESIGN)
// ==========================================================================
const BRAND_SHOWCASE_DATA = {
    'TRUEVIEW': {
        partnerBadge: 'AUTHORIZED PARTNER',
        title: 'TRUEVIEW',
        count: '31 Products',
        desc: '4G Solar PTZ, PoE Switches, Routers & NVRs',
        bestseller: {
            tag: '#1 BESTSELLER',
            img: 'assets/hero_product_solar_v2.png',
            label: 'Trueview 4G Mini PT'
        },
        products: [
            { kicker: '4G SOLAR', title: 'Trueview 4G Mini PT 3MP IP65', price: 3200, brand: 'TRUEVIEW', img: 'assets/hero_product_solar_v2.png' },
            { kicker: '8-PORT POE', title: 'Trueview 8-Port Commercial PoE', price: 2350, brand: 'TRUEVIEW', img: 'assets/trueview_poe_front.jpg' },
            { kicker: '4G ROUTER', title: 'Trueview 4G Industrial Wi-Fi 6 Router', price: 1850, brand: 'TRUEVIEW', img: 'assets/trueview_router_angle.jpg' },
            { kicker: '4MP DUAL LENS', title: 'Trueview 4MP Dual-Lens Solar Camera', price: 4600, brand: 'TRUEVIEW', img: 'assets/hero_product_solar_v2.png' },
            { kicker: '16-CH NVR', title: 'Trueview 16-Channel 4K NVR Recorder', price: 6400, brand: 'TRUEVIEW', img: 'assets/trueview_dvr_16ch.webp' }
        ]
    },
    'CPPLUS': {
        partnerBadge: 'AUTHORIZED DISTRIBUTOR',
        title: 'CP PLUS',
        count: '9 Products',
        desc: 'Smart Wi-Fi Ezykam, Full Color Dome & Bullet AI Security',
        bestseller: {
            tag: '#1 BESTSELLER',
            img: 'assets/hero_product_cpplus_v2.png',
            label: 'CP Plus Ezykam 3MP PT'
        },
        products: [
            { kicker: 'SMART PAN & TILT', title: 'CP Plus Ezykam 3MP Pan & Tilt Wi-Fi', price: 1980, brand: 'CP PLUS', img: 'assets/hero_product_cpplus_v2.png' },
            { kicker: 'OUTDOOR BULLET', title: 'CP Plus 2MP Full-Color Bullet Camera', price: 1450, brand: 'CP PLUS', img: 'assets/hero_product_cpplus_v2.png' },
            { kicker: 'AI 4MP INDOOR', title: 'CP Plus 4MP Ultra-HD Guard Cam', price: 2450, brand: 'CP PLUS', img: 'assets/hero_product_cpplus_v2.png' },
            { kicker: '4-CH HD DVR', title: 'CP Plus 4-Channel H.265+ DVR System', price: 2850, brand: 'CP PLUS', img: 'assets/trueview_dvr_4ch.webp' },
            { kicker: '8-CH HD DVR', title: 'CP Plus 8-Channel Commercial DVR', price: 4200, brand: 'CP PLUS', img: 'assets/trueview_dvr_4ch.webp' }
        ]
    },
    'IDADA': {
        partnerBadge: 'PREMIUM SMART HOME',
        title: 'iDADA',
        count: '14 Products',
        desc: 'High-Speed Pan & Tilt Wi-Fi Cameras with 2-Way Intercom',
        bestseller: {
            tag: '#1 BESTSELLER',
            img: 'assets/hero_product_idada_v2.png',
            label: 'iDADA 3MP Smart PT'
        },
        products: [
            { kicker: '3MP SMART PT', title: 'iDADA 3MP Smart Wi-Fi Pan & Tilt Cam', price: 1850, brand: 'iDADA', img: 'assets/hero_product_idada_v2.png' },
            { kicker: 'DUAL ANTENNA', title: 'iDADA 3MP Long-Range Outdoor Wi-Fi', price: 2150, brand: 'iDADA', img: 'assets/hero_product_idada_v2.png' },
            { kicker: 'SMART HOME', title: 'iDADA Baby & Elderly Care 2-Way Audio', price: 1650, brand: 'iDADA', img: 'assets/hero_product_idada_v2.png' },
            { kicker: '4G CELLULAR', title: 'iDADA 4G SIM Card Autonomous Camera', price: 3100, brand: 'iDADA', img: 'assets/hero_product_idada_v2.png' },
            { kicker: 'SOLAR BACKUP', title: 'iDADA Solar Battery Standalone PTZ', price: 3850, brand: 'iDADA', img: 'assets/hero_product_idada_v2.png' }
        ]
    },
    'SEAGATE': {
        partnerBadge: 'SURVEILLANCE STORAGE',
        title: 'SEAGATE',
        count: '3 Capacities',
        desc: 'SkyHawk 24/7 Zero Frame Loss Heavy-Duty Surveillance Hard Drives',
        bestseller: {
            tag: '#1 BESTSELLER',
            img: 'assets/acc_official_skyhawk_hdd.png',
            label: 'Seagate SkyHawk 2TB'
        },
        products: [
            { kicker: '1TB SURVEILLANCE', title: 'Seagate SkyHawk 1TB Surveillance HDD', price: 3400, brand: 'SEAGATE', img: 'assets/acc_official_skyhawk_hdd.png' },
            { kicker: '2TB BEST VALUE', title: 'Seagate SkyHawk 2TB Heavy-Duty HDD', price: 4650, brand: 'SEAGATE', img: 'assets/acc_official_skyhawk_hdd.png' },
            { kicker: '4TB ENTERPRISE', title: 'Seagate SkyHawk 4TB Commercial HDD', price: 7800, brand: 'SEAGATE', img: 'assets/acc_official_skyhawk_hdd.png' },
            { kicker: '6TB AI RECORDER', title: 'Seagate SkyHawk AI 6TB Analytics HDD', price: 12400, brand: 'SEAGATE', img: 'assets/acc_official_skyhawk_hdd.png' },
            { kicker: 'MICRO SD 128GB', title: 'SanDisk High Endurance 128GB Card', price: 1150, brand: 'SANDISK', img: 'assets/acc_sandisk_128gb.jpg' }
        ]
    },
    'INFRASTRUCTURE': {
        partnerBadge: 'PRO CCTV CABLING & POWER',
        title: 'INFRASTRUCTURE',
        count: '22 Items',
        desc: 'Power SMPS, Pure Copper Cat6 & RG59 Cabling, Racks & Waterproof Boxes',
        bestseller: {
            tag: '#1 BESTSELLER',
            img: 'assets/acc_official_smps.png',
            label: 'Ultra-Link 12V 5A SMPS'
        },
        products: [
            { kicker: '12V 5A SMPS', title: 'Ultra-Link 12V 5A 4-Channel Metal SMPS', price: 450, brand: 'INFRASTRUCTURE', img: 'assets/acc_official_smps.png' },
            { kicker: '12V 10A SMPS', title: 'Ultra-Link 12V 10A 8-Channel Industrial SMPS', price: 750, brand: 'INFRASTRUCTURE', img: 'assets/acc_official_smps.png' },
            { kicker: 'CAT6 305M', title: 'Ultra-Link Pure Copper Cat6 Cable 305m Drum', price: 4200, brand: 'INFRASTRUCTURE', img: 'assets/acc_official_cat6_drum.png' },
            { kicker: '3+1 COAXIAL', title: 'D-Link 3+1 RG59 Pure Copper CCTV Cable 90m', price: 1450, brand: 'INFRASTRUCTURE', img: 'assets/acc_official_cat6_drum.png' },
            { kicker: 'JUNCTION BOX', title: 'Waterproof IP66 Heavy Duty Camera Base Box (Pack of 10)', price: 380, brand: 'INFRASTRUCTURE', img: 'assets/acc_official_smps.png' }
        ]
    }
};

function switchBrandDisplay(brandKey, tabBtn) {
    const data = BRAND_SHOWCASE_DATA[brandKey];
    if (!data) return;

    // 1. Update active tab
    document.querySelectorAll('.brand-tab-btn').forEach(b => b.classList.remove('active'));
    if (tabBtn) {
        tabBtn.classList.add('active');
    } else {
        const matchingBtn = document.querySelector(`.brand-tab-btn[data-brand="${brandKey}"]`);
        if (matchingBtn) matchingBtn.classList.add('active');
    }

    // 2. Smooth transition of card content
    const card = document.getElementById('brandDisplayCard');
    if (card) {
        card.style.opacity = '0.5';
        card.style.transform = 'translateY(4px)';
    }

    setTimeout(() => {
        const partnerBadge = document.getElementById('bdcPartnerBadge');
        const titleEl = document.getElementById('bdcBrandTitle');
        const countPill = document.getElementById('bdcCountPill');
        const descEl = document.getElementById('bdcBrandDesc');
        const bestImg = document.getElementById('bdcBestsellerImg');
        const bestLabel = document.getElementById('bdcBestsellerLabel');
        const bestBox = document.getElementById('bdcBestsellerBox');
        const shelf = document.getElementById('bdcProductsShelf');

        if (partnerBadge) {
            partnerBadge.innerHTML = `
                <svg class="bdc-check-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                ${data.partnerBadge}
            `;
        }
        if (titleEl) titleEl.textContent = data.title;
        if (countPill) countPill.innerHTML = `&#10003; ${data.count.replace('', '')}`;
        if (descEl) descEl.textContent = data.desc;
        if (bestImg) {
            bestImg.src = data.bestseller.img;
            bestImg.alt = data.bestseller.label;
        }
        if (bestLabel) bestLabel.textContent = data.bestseller.label;
        if (bestBox) {
            bestBox.setAttribute('onclick', `quickViewBestseller('${brandKey}')`);
        }

        if (shelf && data.products) {
            shelf.innerHTML = data.products.map(p => `
                <div class="bpc-card">
                    <span class="bpc-kicker">${p.kicker}</span>
                    <div class="bpc-img-wrap">
                        <img src="${p.img}" alt="${p.title}" class="bpc-img" loading="lazy" onerror="this.src='assets/hero_product_solar_v2.png'">
                    </div>
                    <h4 class="bpc-title">${p.title}</h4>
                    <div class="bpc-price">&#8377;${Number(p.price).toLocaleString('en-IN')}</div>
                    <div class="bpc-actions">
                        <button type="button" class="btn-bpc-cart" onclick="directAddToCart('${p.title.replace(/'/g, "\\'")}', ${p.price}, '${p.brand}', '${p.img}', this)">+ CART</button>
                        <button type="button" class="btn-bpc-pay" onclick="directPayProduct('${p.title.replace(/'/g, "\\'")}', ${p.price}, '${p.brand}', '${p.img}')">PAY</button>
                    </div>
                </div>
            `).join('');
        }

        if (card) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }
    }, 160);
}

function quickViewBestseller(brandKey) {
    const data = BRAND_SHOWCASE_DATA[brandKey];
    if (!data) return;
    const firstProd = data.products[0];
    if (firstProd) {
        directAddToCart(firstProd.title, firstProd.price, firstProd.brand, firstProd.img);
    }
}

function directAddToCart(title, price, brand, img, btn) {
    let pid = 'bpc-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (typeof SYBER_PRODUCTS !== 'undefined') {
        const found = SYBER_PRODUCTS.find(p => p.title.toLowerCase().includes(title.toLowerCase().slice(0, 15)));
        if (found) pid = found.id;
    }

    const existing = CART_ITEMS.find(item => item.id === pid || item.title === title);
    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
        existing.quantity = existing.qty;
    } else {
        CART_ITEMS.push({
            id: pid,
            title: title,
            name: title,
            brand: brand || 'TRUEVIEW',
            price: Number(price) || 0,
            mrp: '₹' + Math.round(Number(price) * 1.35).toLocaleString('en-IN'),
            save: 'Direct Partner Price',
            img: img,
            image: img,
            qty: 1,
            quantity: 1
        });
    }
    saveCart();

    if (btn) {
        const origText = btn.textContent;
        btn.textContent = 'ADDED ';
        btn.style.background = '#059669';
        btn.style.color = '#ffffff';
        btn.style.borderColor = '#059669';
        setTimeout(() => {
            btn.textContent = origText;
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
        }, 1200);
    }

    showToastWithCartButton(title, brand || 'Authorized Brand');
}

function directPayProduct(title, price, brand, img) {
    directAddToCart(title, price, brand, img);
    window.location.href = 'checkout.html';
}


function openProductShowcase(productId) {
    if (!productId) return;
    window.location.href = 'product.html?id=' + encodeURIComponent(productId) + '&scroll=showcase';
}

// ==========================================================================
// BRANDS WE SELL - SLIDESHOW & TAB SELECTOR CONTROLLER (NO OUTER BOX)
// ==========================================================================
const BRAND_KEYS = ['TRUEVIEW', 'CPPLUS', 'IDADA', 'SEAGATE', 'INFRASTRUCTURE', 'SUGGESTED'];
let currentBrandIndex = 0;
let brandAutoSlideTimer = null;

function goToBrandSlide(idx) {
    currentBrandIndex = (idx + BRAND_KEYS.length) % BRAND_KEYS.length;
    const track = document.getElementById('brandSlidesTrack');
    if (track) {
        track.style.transform = `translateX(-${currentBrandIndex * 100}%)`;
    }

    const currentKey = BRAND_KEYS[currentBrandIndex];

    // Update active tab button
    const tabs = document.querySelectorAll('.brand-tab-btn');
    let matchedTab = null;
    tabs.forEach(tab => {
        if (tab.getAttribute('data-brand-target') === currentKey) {
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            matchedTab = tab;
        } else {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        }
    });

    if (matchedTab) {
        const strip = document.querySelector('.brand-selector-strip');
        if (strip && strip.scrollWidth > strip.clientWidth) {
            const stripRect = strip.getBoundingClientRect();
            const tabRect = matchedTab.getBoundingClientRect();
            const offset = (tabRect.left - stripRect.left) - (strip.clientWidth / 2) + (tabRect.width / 2);
            strip.scrollTo({
                left: strip.scrollLeft + offset,
                behavior: 'smooth'
            });
        }
    }
}

function nextBrandSlide() {
    goToBrandSlide(currentBrandIndex + 1);
}

function prevBrandSlide() {
    goToBrandSlide(currentBrandIndex - 1);
}

function selectBrandTab(brandKey) {
    if (!brandKey) return;
    const cleanKey = brandKey.toUpperCase().replace(/[^A-Z]/g, '');
    let target = cleanKey;
    if (cleanKey === 'CP' || cleanKey === 'CPPLUS') target = 'CPPLUS';
    else if (cleanKey === 'BESTSELLER' || cleanKey === 'SUGGESTED' || cleanKey === 'TOPPICKS') target = 'SUGGESTED';
    else if (cleanKey === 'INFRA') target = 'INFRASTRUCTURE';

    const idx = BRAND_KEYS.indexOf(target);
    if (idx !== -1) {
        goToBrandSlide(idx);
    }
}

function switchBrandDisplay(brandKey) {
    selectBrandTab(brandKey);
    const sec = document.getElementById('categories-by-brand');
    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
}

function startBrandAutoSlide() {
    pauseBrandAutoSlide();
    brandAutoSlideTimer = setInterval(() => {
        nextBrandSlide();
    }, 4200);
}

function pauseBrandAutoSlide() {
    if (brandAutoSlideTimer) {
        clearInterval(brandAutoSlideTimer);
        brandAutoSlideTimer = null;
    }
}

function resumeBrandAutoSlide() {
    startBrandAutoSlide();
}

// Touch swipe support on brand slideshow viewport
function initBrandSlideshow() {
    startBrandAutoSlide();

    const viewport = document.getElementById('brandSlidesViewport');
    if (viewport) {
        let touchStartX = 0;
        let touchEndX = 0;

        viewport.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            pauseBrandAutoSlide();
        }, { passive: true });

        viewport.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) {
                nextBrandSlide();
            } else if (touchEndX - touchStartX > 50) {
                prevBrandSlide();
            }
            resumeBrandAutoSlide();
        }, { passive: true });
    }

    // Only run brand autoplay when the brand section is visible on screen
    const container = document.getElementById('brandSlideshowContainer') || document.querySelector('.brand-categories-section');
    if (container && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    resumeBrandAutoSlide();
                } else {
                    pauseBrandAutoSlide();
                }
            });
        }, { threshold: 0.1 });
        observer.observe(container);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBrandSlideshow);
} else {
    initBrandSlideshow();
}


// ==========================================================================
// BRAND SHOWCASE TAKEOVER ENGINE ("BUBBLEGUM EFFECT")
// ==========================================================================
const BRAND_META = {
    'TRUEVIEW': { 
        name: 'TRUEVIEW', 
        color: '#0f172a', 
        bg: '#ffffff',
        kicker: 'OFFICIAL SURVEILLANCE PARTNER',
        subtitle: '31 Autonomous Solar & Commercial CCTV Cameras Available' 
    },
    'CPPLUS': { 
        name: 'CP PLUS', 
        color: '#0f172a', 
        bg: '#ffffff',
        kicker: 'AUTHORIZED ENTERPRISE DISTRIBUTOR',
        subtitle: '9 Commercial & Smart Ezykam Security Cameras Available'
    },
    'IDADA': { 
        name: 'iDADA', 
        color: '#0f172a', 
        bg: '#ffffff',
        kicker: '#1 BESTSELLER SMART HOME',
        subtitle: '14 High-Velocity Pan & Tilt Wi-Fi Cameras Available'
    },
    'SEAGATE': { 
        name: 'SEAGATE', 
        color: '#0f172a', 
        bg: '#ffffff',
        kicker: 'SURVEILLANCE STORAGE SPECIALIST',
        subtitle: 'SkyHawk 24/7 Zero Frame Loss Surveillance Hard Drives'
    },
    'INFRASTRUCTURE': { 
        name: 'INFRASTRUCTURE', 
        color: '#0f172a', 
        bg: '#ffffff',
        kicker: 'PRO CCTV CABLING & HARDWARE',
        subtitle: '22 Power SMPS, Pure Copper Cat6 & RG59 Cabling Items'
    },
    'SUGGESTED': {
        name: 'BESTSELLERS',
        color: '#0f172a',
        bg: '#ffffff',
        kicker: 'FLAGSHIP SELECTION',
        subtitle: 'Direct Kerala Dispatch • 100% Genuine Manufacturer Replacement'
    }
};

function triggerBubbleTakeover(originElemOrEvent, brandKey) {
    const overlay = document.getElementById('brandTakeoverOverlay');
    const bubble = document.getElementById('brandTakeoverBubble');
    const content = document.getElementById('brandTakeoverContent');
    if (!overlay || !bubble) return;

    // Calculate origin coordinates (x, y)
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (originElemOrEvent && originElemOrEvent.getBoundingClientRect) {
        const rect = originElemOrEvent.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
    } else if (originElemOrEvent && originElemOrEvent.clientX) {
        x = originElemOrEvent.clientX;
        y = originElemOrEvent.clientY;
    }

    const relY = y;
    const overlayHeight = window.innerHeight;

    // Calculate radius to cover the entire canvas
    const maxDist = Math.max(
        Math.hypot(x, relY),
        Math.hypot(window.innerWidth - x, relY),
        Math.hypot(x, overlayHeight - relY),
        Math.hypot(window.innerWidth - x, overlayHeight - relY)
    );
    const diameter = maxDist * 2.3;

    // Brand metadata
    const meta = BRAND_META[brandKey] || { 
        name: brandKey, 
        color: '#0f172a', 
        bg: '#ffffff', 
        kicker: 'AUTHORIZED BRAND SHOWCASE', 
        subtitle: 'Surveillance hardware catalog' 
    };

    // Style the blooming bubble
    bubble.style.left = (x - diameter / 2) + 'px';
    bubble.style.top = (relY - diameter / 2) + 'px';
    bubble.style.width = diameter + 'px';
    bubble.style.height = diameter + 'px';
    bubble.style.background = meta.bg;

    // Populate header details
    const kickerEl = document.getElementById('btoKicker');
    const titleEl = document.getElementById('btoTitle');
    const subtitleEl = document.getElementById('btoSubtitle');
    const gridEl = document.getElementById('btoProductsGrid');

    if (kickerEl) kickerEl.textContent = meta.kicker;
    if (titleEl) {
        titleEl.textContent = meta.name;
        titleEl.style.color = meta.color;
    }

    // Populate products
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
        } else if (brandKey === 'SUGGESTED') {
            products = SYBER_PRODUCTS.filter(p => p.badge && (p.badge.includes('BESTSELLER') || p.badge.includes('TOP') || p.badge.includes('ULTRA')));
        } else {
            products = SYBER_PRODUCTS.filter(p => (p.brand || '').toUpperCase() === brandKey.toUpperCase());
        }

        if (subtitleEl) {
            subtitleEl.textContent = `${products.length} product${products.length !== 1 ? 's' : ''} available • Official Manufacturer Warranty • Direct Kerala Dispatch`;
        }

        gridEl.innerHTML = products.map(p => {
            const img = (p.images && p.images.length > 0) ? p.images[0] : 'assets/hero_product_solar_v2.png';
            const chipsHtml = (p.chips || []).slice(0, 3).map(c => `<span class="lpc-chip">${c}</span>`).join('');
            const mrpHtml = p.mrp ? `<span class="lpc-mrp">${p.mrp}</span>` : '';
            const saveBadge = p.save ? `<span class="lpc-save-pill">${p.save}</span>` : '';

            return `
                <div class="live-prod-card" onclick="window.location.href='product.html?id=${p.id}'" style="cursor: pointer;">
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
                    <button type="button" class="btn-lpc-add" onclick="handleTakeoverAdd(event, '${p.id}', this)">
                        [ ADD TO CART ]
                    </button>
                </div>
            `;
        }).join('');
    }

    // Activate takeover
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Premium GSAP bloom animation
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(bubble, 
            { scale: 0.05, opacity: 0.8 }, 
            { scale: 1, opacity: 1, duration: 0.42, ease: 'power2.out', clearProps: 'opacity' }
        );
        const cards = gridEl ? gridEl.querySelectorAll('.live-prod-card') : [];
        if (cards && cards.length) {
            gsap.fromTo(cards, 
                { opacity: 0, y: 16 }, 
                { opacity: 1, y: 0, stagger: 0.035, duration: 0.38, ease: 'power2.out', delay: 0.12, clearProps: 'transform,opacity' }
            );
        }
    }

    try {
        if (!window.history.state || window.history.state.modal !== 'brandTakeover') {
            window.history.pushState({ modal: 'brandTakeover', brand: brandKey }, '', window.location.href);
        }
    } catch (e) {}
}

function closeBubbleTakeover() {
    const overlay = document.getElementById('brandTakeoverOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function handleTakeoverBgClick(e) {
    if (e.target.id === 'brandTakeoverOverlay' || e.target.id === 'brandTakeoverContent') {
        closeBubbleTakeover();
    }
}

function handleTakeoverAdd(e, prodId, btn) {
    e.stopPropagation();
    if (typeof SYBER_PRODUCTS === 'undefined') return;
    const prod = SYBER_PRODUCTS.find(p => p.id === prodId);
    if (!prod) return;

    const imgSrc = (prod.images && prod.images.length > 0) ? prod.images[0] : 'assets/hero_product_solar_v2.png';
    directAddToCart(prod.title, prod.price, prod.brand, imgSrc, btn);
}

// Popstate support so phone back button closes the takeover
window.addEventListener('popstate', (e) => {
    const overlay = document.getElementById('brandTakeoverOverlay');
    if (overlay && overlay.classList.contains('active')) {
        closeBubbleTakeover();
    }
});
