/**
 * SYBER SPACE // AUTHORIZED SURVEILLANCE SYSTEMS
 * ASUS-INSPIRED 2x2 EDITORIAL SHOWCASE, YOUTUBE-STYLE SEARCH & DIRECT PROCUREMENT
 */

// Global State
let CART = [];
let CURRENT_MODAL_BRAND = '';
let CURRENT_BRAND_PRODUCTS = [];

// 4 Core Accessories Data for Tile 4 Interactive Switcher (Official Product Imagery)
const ACCESSORY_PREVIEWS = [
    {
        id: 'cctv-smps-power-supply-12v-10a',
        category: '12V 10A CCTV SMPS POWER SUPPLY',
        title: 'Syber Space 12V 10A CCTV SMPS Power Supply',
        img: 'assets/acc_official_smps.png',
        price: '₹850',
        mrp: '₹1,499',
        feats: [
            { title: '12V 10A Output', desc: 'Central power distribution box supporting up to 9 CCTV cameras simultaneously.' },
            { title: 'Surge & Overload Protection', desc: 'Automatic thermal reset and short-circuit isolation for every channel.' },
            { title: 'Perforated Metal Enclosure', desc: 'Heavy-duty heat dissipation cage built for 24/7 continuous duty.' },
            { title: 'Certified Compatibility', desc: 'Works with all analog HD, AHD, and IP CCTV camera systems.' }
        ]
    },
    {
        id: 'cctv-surveillance-hard-drive-4tb',
        category: 'SEAGATE SKYHAWK 4TB SURVEILLANCE HDD',
        title: 'Seagate SkyHawk 4TB 24/7 Surveillance Grade HDD',
        img: 'assets/acc_official_skyhawk_hdd.png',
        price: '₹5,400',
        mrp: '₹8,999',
        feats: [
            { title: '4TB Storage Capacity', desc: 'Stores up to 60+ days of continuous high-bitrate multi-camera recordings.' },
            { title: '24/7 CCTV Workload Rating', desc: 'Rated for 180TB/year workload, 3x higher than desktop PC hard drives.' },
            { title: 'ImagePerfect Firmware', desc: 'Minimizes frame drops and optimizes multi-stream security writes.' },
            { title: '1 Million Hours MTBF', desc: 'Industrial durability with built-in rotational vibration sensors.' }
        ]
    },
    {
        id: 'cctv-cat6-pure-copper-cable-305m',
        category: 'ULTRA-LINK PURE COPPER CAT6 305M REEL',
        title: 'Ultra-Link Pure Copper Cat6 305M Network Reel',
        img: 'assets/acc_official_cat6_drum.png',
        price: '₹4,200',
        mrp: '₹6,999',
        feats: [
            { title: '305 Meters (1000 FT) Reel', desc: 'Continuous unshielded twisted pair on heavy-duty wooden installation drum.' },
            { title: '100% Solid Bare Copper', desc: '23AWG pure copper conductors offering maximum conductivity and signal strength.' },
            { title: 'PoE+ Long-Distance Certified', desc: 'Delivers full gigabit data and power up to 250 meters without voltage drop.' },
            { title: 'Weather & Tangle Resistant', desc: 'Flame-retardant PVC jacket with easy-pull payout hole.' }
        ]
    },
    {
        id: 'cctv-weatherproof-junction-box-ip66',
        category: 'WEATHERPROOF IP66 CAMERA JUNCTION BOX',
        title: 'Weatherproof IP66 Round CCTV Deep Base Box',
        img: 'assets/acc_official_junction_box.png',
        price: '₹180',
        mrp: '₹350',
        feats: [
            { title: 'IP66 Weatherproof Seal', desc: 'Waterproof silicone rubber gasket prevents rain, moisture, and dust ingress.' },
            { title: 'Conceals BNC & RJ45 Cables', desc: 'Deep interior chamber keeps power and video connectors completely sheltered.' },
            { title: 'Universal Camera Mount', desc: 'Pre-drilled mounting patterns fit all major dome and bullet camera bases.' },
            { title: 'Threaded Cable Gland', desc: 'Includes watertight compression fitting for clean conduit integration.' }
        ]
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Cart
    initCartState();

    // 2. Initialize Hero Cinematic Slider
    initHeroSlider();

    // 3. Initialize YouTube Search Engine
    initYouTubeSearch();

    // 4. Initialize GSAP & Scroll Interactions
    if (typeof gsap !== 'undefined') {
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
        initGsapAnimations();
    }
});

/* ==========================================================================
   1. SHOPPING CART ENGINE & LOCAL STORAGE
   ========================================================================== */
function initCartState() {
    try {
        const stored = localStorage.getItem('syber_cart_v12');
        if (stored) {
            CART = JSON.parse(stored);
        }
    } catch (e) {
        CART = [];
    }
    updateCartUI();

    const cartBtn = document.getElementById('cart-toggle-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', openCartDrawer);
    }
}

function saveCartState() {
    try {
        localStorage.setItem('syber_cart_v12', JSON.stringify(CART));
    } catch (e) {}
    updateCartUI();
}

function addToCartById(productId) {
    if (typeof SYBER_PRODUCTS === 'undefined') return;
    const product = SYBER_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = CART.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
        CART[existingIndex].qty += 1;
    } else {
        const img = (product.images && product.images.length > 0) ? product.images[0] : 'assets/idada_q2i35s_1.jpg';
        CART.push({
            id: product.id,
            title: product.title,
            price: Number(product.price) || 0,
            image: img,
            qty: 1
        });
    }

    saveCartState();
    showToast(`Added to Cart: ${product.title}`);
    openCartDrawer();
}

function updateCartQty(productId, delta) {
    const item = CART.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        CART = CART.filter(i => i.id !== productId);
    }
    saveCartState();
}

function removeCartItem(productId) {
    CART = CART.filter(i => i.id !== productId);
    saveCartState();
}

function updateCartUI() {
    const totalQty = CART.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = CART.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const counterEl = document.getElementById('cart-counter');
    const itemsCountEl = document.getElementById('cd-items-count');
    if (counterEl) counterEl.textContent = totalQty;
    if (itemsCountEl) itemsCountEl.textContent = `${totalQty} ITEMS`;

    const subtotalEl = document.getElementById('cd-subtotal');
    const finalPriceEl = document.getElementById('cd-final-price');

    if (subtotalEl) subtotalEl.innerHTML = `&#8377;${subtotal.toLocaleString('en-IN')}`;
    if (finalPriceEl) finalPriceEl.innerHTML = `&#8377;${subtotal.toLocaleString('en-IN')}`;

    // Render cart items
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (CART.length === 0) {
        container.innerHTML = `
            <div class="cd-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <p>Your shopping cart is currently empty.</p>
                <span>Add any flagship camera or accessory to request instant order dispatch.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = CART.map(item => `
        <div class="cart-item-row" data-id="${item.id}">
            <img src="${item.image}" alt="${item.title}" class="ci-thumb" onerror="this.src='assets/idada_q2i35s_1.jpg'">
            <div class="ci-details">
                <span class="ci-title">${item.title}</span>
                <span class="ci-unit-price">&#8377;${item.price.toLocaleString('en-IN')} each</span>
                <div class="ci-qty-row">
                    <div class="ci-qty-controls">
                        <button type="button" class="btn-qty" onclick="updateCartQty('${item.id}', -1)" aria-label="Decrease">&minus;</button>
                        <span class="ci-qty-val">${item.qty}</span>
                        <button type="button" class="btn-qty" onclick="updateCartQty('${item.id}', 1)" aria-label="Increase">&#43;</button>
                    </div>
                    <span class="ci-item-total">&#8377;${(item.price * item.qty).toLocaleString('en-IN')}</span>
                </div>
            </div>
            <button type="button" class="btn-remove-item" onclick="removeCartItem('${item.id}')" aria-label="Remove item">&times;</button>
        </div>
    `).join('');
}

function openCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer) drawer.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (drawer) drawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function checkoutWhatsApp() {
    if (CART.length === 0) {
        alert('Your cart is empty. Please add items to proceed.');
        return;
    }

    const totalQty = CART.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = CART.reduce((sum, item) => sum + (item.price * item.qty), 0);

    let message = `*SYBER SPACE // DIRECT CCTV ORDER INQUIRY*\n`;
    message += `Date: ${new Date().toLocaleDateString('en-IN')}\n\n`;
    message += `*ORDER ITEMS (${totalQty} units total):*\n`;

    CART.forEach((item, index) => {
        message += `${index + 1}. *${item.title}*\n`;
        message += `   Qty: ${item.qty} | Price: Rs ${item.price.toLocaleString('en-IN')} | Total: Rs ${(item.price * item.qty).toLocaleString('en-IN')}\n`;
    });

    message += `\n*TOTAL PAYABLE: Rs ${subtotal.toLocaleString('en-IN')}*\n\n`;
    message += `Please confirm stock availability, delivery timeline, and share the official invoice. Thank you!`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/917511180808?text=${encoded}`;
    window.open(waUrl, '_blank');
}

function showToast(message) {
    const toast = document.getElementById('cart-toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('visible');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('visible');
    }, 2800);
}

/* ==========================================================================
   2. HERO BESTSELLER CINEMATIC SLIDER
   ========================================================================== */
let HERO_CURRENT_INDEX = 0;
let HERO_AUTO_TIMER = null;

function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dotsContainer = document.getElementById('hero-dots');
    if (!slides || slides.length === 0) return;

    if (dotsContainer) {
        dotsContainer.innerHTML = Array.from(slides).map((_, i) => `
            <button type="button" class="hero-dot ${i === 0 ? 'active' : ''}" onclick="goToHeroSlide(${i})" aria-label="Slide ${i+1}"></button>
        `).join('');
    }

    resetHeroAutoTimer();

    const sliderFrame = document.querySelector('.hero-slider-frame');
    if (sliderFrame) {
        sliderFrame.addEventListener('mouseenter', () => clearInterval(HERO_AUTO_TIMER));
        sliderFrame.addEventListener('mouseleave', () => resetHeroAutoTimer());
    }
}

function goToHeroSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    if (!slides || slides.length === 0) return;

    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;

    HERO_CURRENT_INDEX = index;

    slides.forEach((slide, i) => {
        if (i === index) {
            slide.classList.add('active');
            const vid = slide.querySelector('video');
            if (vid) {
                vid.currentTime = 0;
                vid.play().catch(() => {});
            }
        } else {
            slide.classList.remove('active');
            const vid = slide.querySelector('video');
            if (vid) vid.pause();
        }
    });

    dots.forEach((dot, i) => {
        if (i === index) dot.classList.add('active');
        else dot.classList.remove('active');
    });

    resetHeroAutoTimer();
}

function changeHeroSlide(direction) {
    goToHeroSlide(HERO_CURRENT_INDEX + direction);
}

function resetHeroAutoTimer() {
    clearInterval(HERO_AUTO_TIMER);
    HERO_AUTO_TIMER = setInterval(() => {
        changeHeroSlide(1);
    }, 6500);
}

/* ==========================================================================
   3. TILE 4 INTERACTIVE ACCESSORIES SWITCHER
   ========================================================================== */
function switchAccPreview(index) {
    const item = ACCESSORY_PREVIEWS[index];
    if (!item) return;

    // Update active tab button
    const tabs = document.querySelectorAll('.acc-tab-btn');
    tabs.forEach((t, i) => {
        if (i === index) t.classList.add('active');
        else t.classList.remove('active');
    });

    // Update image
    const imgEl = document.getElementById('acc-preview-img');
    if (imgEl) {
        imgEl.style.opacity = '0';
        setTimeout(() => {
            imgEl.src = item.img;
            imgEl.alt = item.title;
            imgEl.style.opacity = '1';
        }, 150);
    }

    // Update Category Label & Prices
    const catEl = document.getElementById('acc-preview-category');
    const priceEl = document.getElementById('acc-preview-price');
    const mrpEl = document.getElementById('acc-preview-mrp');
    const addBtn = document.getElementById('btn-acc-add-cart');

    if (catEl) catEl.textContent = item.category;
    if (priceEl) priceEl.innerHTML = `&#8377;${item.price.replace('₹', '')}`;
    if (mrpEl) mrpEl.innerHTML = `&#8377;${item.mrp.replace('₹', '')}`;
    if (addBtn) addBtn.setAttribute('onclick', `addToCartById('${item.id}')`);

    // Update Feature items
    for (let i = 0; i < 4; i++) {
        const featEl = document.getElementById(`acc-feat-${i+1}`);
        if (featEl && item.feats[i]) {
            featEl.innerHTML = `<strong>${item.feats[i].title}:</strong> ${item.feats[i].desc}`;
        }
    }
}

/* ==========================================================================
   4. FULL BRAND CATALOG MODAL ENGINE
   ========================================================================== */
function openBrandModal(brandName) {
    if (typeof SYBER_PRODUCTS === 'undefined') return;

    CURRENT_MODAL_BRAND = brandName;
    const modal = document.getElementById('brand-modal');
    const overlay = document.getElementById('brand-modal-overlay');
    const titleEl = document.getElementById('bm-brand-title');
    const countEl = document.getElementById('bm-product-count');
    const searchInput = document.getElementById('bm-search-input');

    if (searchInput) searchInput.value = '';

    const normalizedTarget = brandName.toUpperCase().replace(/\s+/g, '');

    // Support ACCESSORIES category filter
    if (normalizedTarget === 'ACCESSORIES' || normalizedTarget === 'ACCESSORY') {
        const accCategories = ['accessory', 'poe-switch', 'router', 'solar-hub'];
        CURRENT_BRAND_PRODUCTS = SYBER_PRODUCTS.filter(p => accCategories.includes((p.category || '').toLowerCase()));
        CURRENT_BRAND_PRODUCTS.sort((a, b) => {
            if (a.category === 'accessory' && b.category !== 'accessory') return -1;
            if (a.category !== 'accessory' && b.category === 'accessory') return 1;
            return 0;
        });
        if (titleEl) titleEl.textContent = `ALL SURVEILLANCE ACCESSORIES & HARDWARE`;
        if (countEl) countEl.textContent = `${CURRENT_BRAND_PRODUCTS.length} HARDWARE ITEMS AVAILABLE`;
    } else {
        CURRENT_BRAND_PRODUCTS = SYBER_PRODUCTS.filter(p => {
            const b = (p.brand || '').toUpperCase().replace(/\s+/g, '');
            return b === normalizedTarget;
        });

        const displayBrand = (brandName === 'CPPLUS' || brandName === 'CP PLUS') ? 'CP PLUS' : brandName;
        if (titleEl) titleEl.textContent = `ALL PRODUCTS OF ${displayBrand}`;
        if (countEl) countEl.textContent = `${CURRENT_BRAND_PRODUCTS.length} CERTIFIED MODELS AVAILABLE`;
    }

    renderBrandModalItems(CURRENT_BRAND_PRODUCTS);

    if (modal) modal.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBrandModal() {
    const modal = document.getElementById('brand-modal');
    const overlay = document.getElementById('brand-modal-overlay');
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function filterBrandModalProducts() {
    const searchInput = document.getElementById('bm-search-input');
    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();

    if (!query) {
        renderBrandModalItems(CURRENT_BRAND_PRODUCTS);
        return;
    }

    const filtered = CURRENT_BRAND_PRODUCTS.filter(p => {
        const title = (p.title || '').toLowerCase();
        const desc = (p.desc || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return title.includes(query) || desc.includes(query) || cat.includes(query);
    });

    renderBrandModalItems(filtered);
}

function renderBrandModalItems(products) {
    const container = document.getElementById('bm-products-container');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; color: var(--c-muted);">
                No models found matching your search.
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(p => {
        const img = (p.images && p.images.length > 0) ? p.images[0] : 'assets/idada_q2i35s_1.jpg';
        return `
            <div class="bm-item-card">
                <img src="${img}" alt="${p.title}" class="bm-item-img" loading="lazy" onerror="this.src='assets/idada_q2i35s_1.jpg'">
                <h4 class="bm-item-title" title="${p.title}">${p.title}</h4>
                <div class="bm-item-price-row">
                    <span class="bm-item-price">&#8377;${Number(p.price).toLocaleString('en-IN')}</span>
                    <button type="button" class="btn-bm-add" onclick="addToCartById('${p.id}')">[ + ADD ]</button>
                </div>
            </div>
        `;
    }).join('');
}

/* ==========================================================================
   5. YOUTUBE-STYLE LIVE SEARCH ENGINE
   ========================================================================== */
function initYouTubeSearch() {
    const input = document.getElementById('yt-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    const dropdown = document.getElementById('search-dropdown');
    const resultsContainer = document.getElementById('dropdown-results');
    const countLabel = document.getElementById('search-match-count');

    if (!input || typeof SYBER_PRODUCTS === 'undefined') return;

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

        if (!query) {
            if (dropdown) dropdown.style.display = 'none';
            return;
        }

        const matches = SYBER_PRODUCTS.filter(p => {
            const title = (p.title || '').toLowerCase();
            const brand = (p.brand || '').toLowerCase();
            const cat = (p.category || '').toLowerCase();
            const desc = (p.desc || '').toLowerCase();
            return title.includes(query) || brand.includes(query) || cat.includes(query) || desc.includes(query);
        }).slice(0, 6);

        if (countLabel) countLabel.textContent = `${matches.length} MATCHES`;

        if (matches.length === 0) {
            resultsContainer.innerHTML = `
                <div style="padding: 1.25rem; text-align: center; color: var(--c-muted); font-size: 0.82rem;">
                    No hardware found matching "${query}"
                </div>
            `;
        } else {
            resultsContainer.innerHTML = matches.map(p => {
                const img = (p.images && p.images.length > 0) ? p.images[0] : 'assets/idada_q2i35s_1.jpg';
                return `
                    <div class="dropdown-item" onclick="handleSearchSelect('${p.id}', '${p.brand}', '${p.category}')">
                        <div class="di-left">
                            <img src="${img}" alt="${p.title}" class="di-thumb" onerror="this.src='assets/idada_q2i35s_1.jpg'">
                            <div class="di-info">
                                <span class="di-title">${p.title}</span>
                                <span class="di-meta">${p.brand} &bull; ${p.category}</span>
                            </div>
                        </div>
                        <div class="di-right">
                            <span class="di-price">&#8377;${Number(p.price).toLocaleString('en-IN')}</span>
                            <button type="button" class="btn-di-add" onclick="event.stopPropagation(); addToCartById('${p.id}');">[ + ]</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (dropdown) dropdown.style.display = 'block';
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            if (dropdown) dropdown.style.display = 'none';
            input.focus();
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.yt-search-container')) {
            if (dropdown) dropdown.style.display = 'none';
        }
    });
}

function handleSearchSelect(productId, brand, category) {
    const dropdown = document.getElementById('search-dropdown');
    if (dropdown) dropdown.style.display = 'none';

    const accCategories = ['accessory', 'poe-switch', 'router', 'solar-hub'];
    if (accCategories.includes((category || '').toLowerCase())) {
        openBrandModal('ACCESSORIES');
    } else {
        openBrandModal(brand);
    }
}

/* ==========================================================================
   6. GSAP 3 ANIMATIONS & SCROLL INTERACTIONS
   ========================================================================== */
function initGsapAnimations() {
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.from('.ahb-title, .ahb-desc', {
            scrollTrigger: {
                trigger: '.asus-showcase-section',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            opacity: 0,
            y: 30,
            stagger: 0.1,
            ease: 'power3.out'
        });

        gsap.from('.asus-tile', {
            scrollTrigger: {
                trigger: '.asus-editorial-grid',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            duration: 0.85,
            opacity: 0,
            y: 40,
            stagger: 0.15,
            ease: 'power3.out'
        });

        gsap.from('.acc-product-card', {
            scrollTrigger: {
                trigger: '.accessories-cards-grid',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            duration: 0.75,
            opacity: 0,
            y: 35,
            stagger: 0.12,
            ease: 'power3.out'
        });

        gsap.from('.procurement-box', {
            scrollTrigger: {
                trigger: '.observe-contact-section',
                start: 'top 82%',
                toggleActions: 'play none none none'
            },
            duration: 0.9,
            opacity: 0,
            scale: 0.96,
            ease: 'power3.out'
        });
    }
}
