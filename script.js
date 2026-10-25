/**
 * SYBER SPACE // AUTHORIZED WHOLESALE SURVEILLANCE
 * BRAND BESTSELLER ENGINE, YOUTUBE-STYLE SEARCH & BRAND CATALOG MODAL
 */

// Global Cart & Brand Modal State
let CART = [];
let CURRENT_MODAL_BRAND = '';
let CURRENT_BRAND_PRODUCTS = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Cart from LocalStorage
    initCartState();

    // 2. Initialize Hero Bestseller Slider
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

    // 5. Marquee Scroll Boost
    initMarqueeScrollBoost();
});

/* ==========================================================================
   1. CART STATE & LOCAL STORAGE ENGINE
   ========================================================================== */
function initCartState() {
    try {
        const stored = localStorage.getItem('syber_cart_v11');
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
        localStorage.setItem('syber_cart_v11', JSON.stringify(CART));
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
                <a href="#brands" class="btn-co-add-cart" onclick="closeCartDrawer()" style="display:inline-block; max-width:200px; text-align:center;">BROWSE BESTSELLERS</a>
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
   2. HERO BESTSELLER SLIDER CONTROLLER
   ========================================================================== */
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const frame = document.querySelector('.hero-slider-frame');

    if (!slides.length) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    const DURATION = 6000;
    let startTime = performance.now();
    let isPaused = false;
    let animFrame = null;

    function goToSlide(index) {
        const prevVideo = slides[currentIndex].querySelector('video');
        if (prevVideo) prevVideo.pause();

        slides[currentIndex].classList.remove('active');
        currentIndex = (index + totalSlides) % totalSlides;

        const nextSlide = slides[currentIndex];
        nextSlide.classList.add('active');

        const nextVideo = nextSlide.querySelector('video');
        if (nextVideo) {
            nextVideo.currentTime = 0;
            nextVideo.play().catch(() => {});
        }

        startTime = performance.now();
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function loop(now) {
        if (!isPaused) {
            const elapsed = now - startTime;
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
   3. COMPANY BRAND CATALOG MODAL ENGINE
   (Triggered by "EXPLORE ALL PRODUCTS OF [COMPANY] →")
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

    // Filter products matching this company
    const normalizedTarget = brandName.toUpperCase().replace(/\s+/g, '');
    CURRENT_BRAND_PRODUCTS = SYBER_PRODUCTS.filter(p => {
        const b = (p.brand || '').toUpperCase().replace(/\s+/g, '');
        return b === normalizedTarget;
    });

    const displayBrand = (brandName === 'CPPLUS' || brandName === 'CP PLUS') ? 'CP PLUS' : brandName;
    if (titleEl) titleEl.textContent = `ALL PRODUCTS OF ${displayBrand}`;
    if (countEl) countEl.textContent = `${CURRENT_BRAND_PRODUCTS.length} CERTIFIED WHOLESALE MODELS`;

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
                No models found matching your search in this brand.
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
   4. YOUTUBE-STYLE LIVE SEARCH ENGINE
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
                    <div class="dropdown-item" onclick="handleSearchSelect('${p.id}', '${p.brand}')">
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
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = input.value.trim().toLowerCase();
            if (!query) return;

            if (dropdown) dropdown.style.display = 'none';

            // If query matches a company brand, open that company's modal directly
            if (query.includes('trueview')) {
                openBrandModal('TRUEVIEW');
            } else if (query.includes('cp plus') || query.includes('cpplus')) {
                openBrandModal('CPPLUS');
            } else if (query.includes('idada')) {
                openBrandModal('IDADA');
            } else {
                // Open first matching brand or Trueview
                const firstMatch = SYBER_PRODUCTS.find(p => (p.title || '').toLowerCase().includes(query));
                if (firstMatch && firstMatch.brand) {
                    openBrandModal(firstMatch.brand);
                } else {
                    openBrandModal('TRUEVIEW');
                }
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (dropdown && !e.target.closest('.yt-search-container')) {
            dropdown.style.display = 'none';
        }
    });
}

function handleSearchSelect(productId, brand) {
    const dropdown = document.getElementById('search-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    openBrandModal(brand);
}

/* ==========================================================================
   5. GSAP 3 ANIMATIONS & SCROLL INTERACTIONS
   ========================================================================== */
function initGsapAnimations() {
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.from('.showcase-header-bar', {
            scrollTrigger: {
                trigger: '.company-showcase-section',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            opacity: 0,
            y: 30,
            ease: 'power3.out'
        });

        gsap.from('.company-card', {
            scrollTrigger: {
                trigger: '.company-cards-grid',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            duration: 0.8,
            opacity: 0,
            y: 40,
            stagger: 0.15,
            ease: 'power3.out'
        });

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
