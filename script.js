/**
 * SYBER SPACE // AUTHORIZED WHOLESALE SURVEILLANCE
 * E-COMMERCE ENGINE, YOUTUBE-STYLE SEARCH & HERO SLIDER CONTROLLER
 */

// Global Cart State
let CART = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Cart from LocalStorage
    initCartState();

    // 2. Initialize Hero Bestseller Slider (Screenshot 1)
    initHeroSlider();

    // 3. Initialize YouTube Search Engine
    initYouTubeSearch();

    // 4. Render Product Catalog
    initProductCatalog();

    // 5. Initialize GSAP & Scroll Interactions
    if (typeof gsap !== 'undefined') {
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
        initGsapAnimations();
    }

    // 6. Marquee Scroll Boost
    initMarqueeScrollBoost();
});

/* ==========================================================================
   1. CART STATE & LOCAL STORAGE ENGINE
   ========================================================================== */
function initCartState() {
    try {
        const stored = localStorage.getItem('syber_cart_v10');
        if (stored) {
            CART = JSON.parse(stored);
        }
    } catch (e) {
        CART = [];
    }
    updateCartUI();

    // Cart Drawer Toggle
    const cartBtn = document.getElementById('cart-toggle-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', openCartDrawer);
    }
}

function saveCartState() {
    try {
        localStorage.setItem('syber_cart_v10', JSON.stringify(CART));
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
    showToast(`Added to Wholesale Cart: ${product.title}`);
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

    // Update Counter Badges
    const counterEl = document.getElementById('cart-counter');
    const itemsCountEl = document.getElementById('cd-items-count');
    if (counterEl) counterEl.textContent = totalQty;
    if (itemsCountEl) itemsCountEl.textContent = `${totalQty} ITEMS`;

    // Wholesale Tier Discount Calculator
    let discountPct = 0;
    let tierName = '';
    let nextTierHint = '';

    if (totalQty >= 30) {
        discountPct = 0.45;
        tierName = 'Tier 3 Enterprise (45% OFF)';
        nextTierHint = 'MAXIMUM WHOLESALE TIER APPLIED (45% OFF)';
    } else if (totalQty >= 10) {
        discountPct = 0.35;
        tierName = 'Tier 2 Contractor (35% OFF)';
        nextTierHint = `Add ${30 - totalQty} more units for Tier 3 (45% OFF)`;
    } else if (totalQty >= 5) {
        discountPct = 0.25;
        tierName = 'Tier 1 Installer (25% OFF)';
        nextTierHint = `Add ${10 - totalQty} more units for Tier 2 (35% OFF)`;
    } else {
        discountPct = 0;
        nextTierHint = `Order ${5 - totalQty} more units for Tier 1 Wholesale (25% OFF)`;
    }

    const discountAmount = Math.round(subtotal * discountPct);
    const finalPrice = subtotal - discountAmount;

    // Update Totals
    const subtotalEl = document.getElementById('cd-subtotal');
    const discountRowEl = document.getElementById('cd-discount-row');
    const discountValEl = document.getElementById('cd-discount-val');
    const finalPriceEl = document.getElementById('cd-final-price');
    const bannerEl = document.getElementById('cd-discount-banner');

    if (subtotalEl) subtotalEl.innerHTML = `&#8377;${subtotal.toLocaleString('en-IN')}`;
    if (finalPriceEl) finalPriceEl.innerHTML = `&#8377;${finalPrice.toLocaleString('en-IN')}`;

    if (discountRowEl && discountValEl) {
        if (discountPct > 0) {
            discountRowEl.style.display = 'flex';
            discountValEl.innerHTML = `-${tierName} (-&#8377;${discountAmount.toLocaleString('en-IN')})`;
        } else {
            discountRowEl.style.display = 'none';
        }
    }

    if (bannerEl) {
        bannerEl.textContent = `• ${nextTierHint.toUpperCase()}`;
    }

    // Render Cart Items
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (CART.length === 0) {
        container.innerHTML = `
            <div class="cart-empty-state">
                <div class="cart-empty-icon">&#128722;</div>
                <p>Your wholesale cart is empty.</p>
                <a href="#catalog" class="btn-card-add" onclick="closeCartDrawer()" style="display:inline-block; max-width:200px; text-align:center;">BROWSE CATALOG</a>
            </div>
        `;
        return;
    }

    container.innerHTML = CART.map(item => `
        <div class="cd-item">
            <img src="${item.image}" alt="${item.title}" class="cd-item-img" onerror="this.src='assets/idada_q2i35s_1.jpg'">
            <div class="cd-item-details">
                <span class="cd-item-title">${item.title}</span>
                <span class="cd-item-price">&#8377;${item.price.toLocaleString('en-IN')} / unit</span>
                <div class="cd-qty-row">
                    <button type="button" class="cd-qty-btn" onclick="updateCartQty('${item.id}', -1)">-</button>
                    <span class="cd-qty-val">${item.qty}</span>
                    <button type="button" class="cd-qty-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
                </div>
            </div>
            <button type="button" class="cd-item-remove" onclick="removeCartItem('${item.id}')" aria-label="Remove item">&times;</button>
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
        alert('Please add items to your cart before checking out.');
        return;
    }

    const totalQty = CART.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = CART.reduce((sum, item) => sum + (item.price * item.qty), 0);

    let discountPct = 0;
    if (totalQty >= 30) discountPct = 0.45;
    else if (totalQty >= 10) discountPct = 0.35;
    else if (totalQty >= 5) discountPct = 0.25;

    const discountAmount = Math.round(subtotal * discountPct);
    const finalPrice = subtotal - discountAmount;

    let itemsList = CART.map((i, idx) => `${idx + 1}. ${i.title}\n   Qty: ${i.qty} units @ Rs ${i.price} = Rs ${i.price * i.qty}`).join('\n');

    let msg = `*SYBER SPACE WHOLESALE PROCUREMENT INVOICE REQUEST*\n\n` +
              `*ITEMS ORDERED:*\n${itemsList}\n\n` +
              `*Total Units:* ${totalQty} units\n` +
              `*Gross Subtotal:* Rs ${subtotal.toLocaleString('en-IN')}\n` +
              (discountPct > 0 ? `*Wholesale Discount:* -Rs ${discountAmount.toLocaleString('en-IN')} (${discountPct * 100}% OFF)\n` : '') +
              `*Net Payable:* Rs ${finalPrice.toLocaleString('en-IN')}\n\n` +
              `Please share stock confirmation, official 18% GST invoice, and Kerala/Pan-India dispatch schedule.`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/917511180808?text=${encoded}`, '_blank');
}

function showToast(message) {
    const toast = document.getElementById('cart-toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('active');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('active');
    }, 2800);
}

/* ==========================================================================
   2. HERO BESTSELLER SLIDER CONTROLLER (MATCHING SCREENSHOT 1)
   ========================================================================== */
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const prevBtn = document.getElementById('hero-prev-btn');
    const nextBtn = document.getElementById('hero-next-btn');
    const activeNum = document.getElementById('active-slide-num');
    const totalNum = document.getElementById('total-slide-num');
    const progressBar = document.getElementById('hero-timer-bar');
    const frame = document.querySelector('.hero-slider-frame');

    if (!slides.length) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    if (totalNum) totalNum.textContent = String(totalSlides).padStart(2, '0');

    const DURATION = 6000;
    let startTime = performance.now();
    let isPaused = false;
    let animFrame = null;

    function goToSlide(index) {
        // Pause previous video
        const prevVideo = slides[currentIndex].querySelector('video');
        if (prevVideo) prevVideo.pause();

        slides[currentIndex].classList.remove('active');
        currentIndex = (index + totalSlides) % totalSlides;

        const nextSlide = slides[currentIndex];
        nextSlide.classList.add('active');

        // Play active video if present
        const nextVideo = nextSlide.querySelector('video');
        if (nextVideo) {
            nextVideo.currentTime = 0;
            nextVideo.play().catch(() => {});
        }

        if (activeNum) {
            activeNum.textContent = String(currentIndex + 1).padStart(2, '0');
        }

        startTime = performance.now();
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    // Progress Loop
    function loop(now) {
        if (!isPaused) {
            const elapsed = now - startTime;
            const progress = Math.min((elapsed / DURATION) * 100, 100);
            if (progressBar) progressBar.style.width = `${progress}%`;

            if (elapsed >= DURATION) {
                nextSlide();
                return;
            }
        }
        animFrame = requestAnimationFrame(loop);
    }

    if (frame) {
        frame.addEventListener('mouseenter', () => { isPaused = true; });
        frame.addEventListener('mouseleave', () => { 
            isPaused = false; 
            startTime = performance.now(); 
        });
    }

    animFrame = requestAnimationFrame(loop);
}

/* ==========================================================================
   3. YOUTUBE-STYLE LIVE SEARCH ENGINE
   ========================================================================== */
function initYouTubeSearch() {
    const input = document.getElementById('yt-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    const dropdown = document.getElementById('search-dropdown');
    const resultsContainer = document.getElementById('dropdown-results');
    const countLabel = document.getElementById('search-match-count');
    const form = document.getElementById('search-form');

    if (!input || typeof SYBER_PRODUCTS === 'undefined') return;

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

        if (!query) {
            if (dropdown) dropdown.style.display = 'none';
            return;
        }

        // Search through products
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
                    No wholesale hardware matching "${query}"
                </div>
            `;
        } else {
            resultsContainer.innerHTML = matches.map(p => {
                const img = (p.images && p.images.length > 0) ? p.images[0] : 'assets/idada_q2i35s_1.jpg';
                return `
                    <div class="dropdown-item" onclick="selectSearchItem('${p.id}')">
                        <div class="di-left">
                            <img src="${img}" alt="${p.title}" class="di-thumb" onerror="this.src='assets/idada_q2i35s_1.jpg'">
                            <div class="di-info">
                                <span class="di-title">${p.title}</span>
                                <span class="di-meta">${p.brand} &bull; ${p.category}</span>
                            </div>
                        </div>
                        <div class="di-right">
                            <span class="di-price">&#8377;${Number(p.price).toLocaleString('en-IN')}</span>
                            <button type="button" class="di-add-btn" onclick="event.stopPropagation(); addToCartById('${p.id}')">+ ADD</button>
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
            clearCatalogSearch();
        });
    }

    // Submit form (Enter key) filters catalog
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = input.value.trim();
            if (dropdown) dropdown.style.display = 'none';
            filterCatalogBySearch(query);
        });
    }

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (dropdown && !e.target.closest('.yt-search-container')) {
            dropdown.style.display = 'none';
        }
    });
}

function selectSearchItem(productId) {
    const dropdown = document.getElementById('search-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    filterCatalogBySearch(productId);
}

/* ==========================================================================
   4. PRODUCT CATALOG DYNAMIC RENDERER
   ========================================================================== */
let CURRENT_CATEGORY = 'all';
let SEARCH_QUERY = '';

function initProductCatalog() {
    renderCatalogGrid();

    // Category Tabs
    const tabBtns = document.querySelectorAll('.cat-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            CURRENT_CATEGORY = btn.getAttribute('data-cat');
            renderCatalogGrid();
        });
    });
}

function filterCatalogBySearch(query) {
    SEARCH_QUERY = (query || '').toLowerCase();
    const statusBar = document.getElementById('search-status-bar');
    const label = document.getElementById('search-query-label');

    if (statusBar && label) {
        if (SEARCH_QUERY) {
            statusBar.style.display = 'flex';
            label.textContent = query;
        } else {
            statusBar.style.display = 'none';
        }
    }

    renderCatalogGrid();

    // Scroll smoothly to catalog
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
}

function clearCatalogSearch() {
    SEARCH_QUERY = '';
    const statusBar = document.getElementById('search-status-bar');
    const input = document.getElementById('yt-search-input');
    const clearBtn = document.getElementById('search-clear-btn');

    if (statusBar) statusBar.style.display = 'none';
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';

    renderCatalogGrid();
}

function renderCatalogGrid() {
    const grid = document.getElementById('products-grid');
    if (!grid || typeof SYBER_PRODUCTS === 'undefined') return;

    let filtered = SYBER_PRODUCTS;

    // Filter by category
    if (CURRENT_CATEGORY !== 'all') {
        filtered = filtered.filter(p => (p.category || '').toLowerCase() === CURRENT_CATEGORY.toLowerCase());
    }

    // Filter by search query
    if (SEARCH_QUERY) {
        filtered = filtered.filter(p => {
            const title = (p.title || '').toLowerCase();
            const brand = (p.brand || '').toLowerCase();
            const cat = (p.category || '').toLowerCase();
            const desc = (p.desc || '').toLowerCase();
            const id = (p.id || '').toLowerCase();
            return title.includes(SEARCH_QUERY) || brand.includes(SEARCH_QUERY) || cat.includes(SEARCH_QUERY) || desc.includes(SEARCH_QUERY) || id === SEARCH_QUERY;
        });
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 4rem 1rem; text-align: center; color: var(--c-muted);">
                <h3>No wholesale hardware found matching criteria.</h3>
                <button type="button" class="btn-card-add" onclick="clearCatalogSearch()" style="margin-top: 1rem; display: inline-block; max-width: 200px;">VIEW ALL PRODUCTS</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const img = (p.images && p.images.length > 0) ? p.images[0] : 'assets/idada_q2i35s_1.jpg';
        const chipsHtml = (p.chips || []).slice(0, 3).map(c => `<span class="pchip">${c}</span>`).join('');
        const badgeHtml = p.badge ? `<span class="pcard-badge">${p.badge}</span>` : '';
        const mrpHtml = p.mrp ? `<span class="pcard-mrp">${p.mrp}</span>` : '';

        return `
            <div class="product-card" data-id="${p.id}">
                <div class="pcard-img-box">
                    ${badgeHtml}
                    <span class="pcard-brand">${p.brand || 'SURVEILLANCE'}</span>
                    <img src="${img}" alt="${p.title}" class="pcard-img" loading="lazy" onerror="this.src='assets/idada_q2i35s_1.jpg'">
                </div>
                <div class="pcard-info">
                    <h3 class="pcard-title" title="${p.title}">${p.title}</h3>
                    <div class="pcard-chips">${chipsHtml}</div>
                    <div class="pcard-pricing-row">
                        <div class="pcard-price-group">
                            <span class="pcard-wholesale-lbl">WHOLESALE</span>
                            <span class="pcard-price">&#8377;${Number(p.price).toLocaleString('en-IN')}</span>
                        </div>
                        ${mrpHtml}
                    </div>
                    <div class="pcard-actions">
                        <button type="button" class="btn-card-add" onclick="addToCartById('${p.id}')">[ ADD TO CART ]</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/* ==========================================================================
   5. GSAP 3 ANIMATIONS & SCROLL INTERACTIONS
   ========================================================================= */
function initGsapAnimations() {
    // ScrollTrigger Wholesale Tiers
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.from('.wholesale-intro-header', {
            scrollTrigger: {
                trigger: '.observe-wholesale-section',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            opacity: 0,
            y: 30,
            ease: 'power3.out'
        });

        gsap.from('.tier-box', {
            scrollTrigger: {
                trigger: '.wholesale-cards-row',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            opacity: 0,
            y: 40,
            stagger: 0.15,
            ease: 'power3.out'
        });

        // ScrollTrigger Procurement Hotline
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

/* ==========================================================================
   6. MARQUEE SCROLL BOOST
   ========================================================================== */
function initMarqueeScrollBoost() {
    const track = document.querySelector('.ribbon-marquee-track');
    if (!track) return;

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    window.addEventListener('scroll', () => {
        const delta = Math.abs(window.scrollY - lastScrollY);
        scrollVelocity = Math.min(delta * 0.15, 2.5);
        lastScrollY = window.scrollY;

        track.style.animationDuration = `${Math.max(12, 32 - scrollVelocity * 8)}s`;

        clearTimeout(track._timeout);
        track._timeout = setTimeout(() => {
            track.style.animationDuration = '32s';
        }, 150);
    }, { passive: true });
}
