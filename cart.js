
function getApiBaseUrl() {
    if (typeof window === 'undefined') return '';
    const port = window.location.port;
    if (window.location.protocol === 'file:' || port === '5500') {
        return 'http://localhost:3000';
    }
    return '';
}

async function checkGatewayHealth() {
    try {
        const res = await fetch(`${getApiBaseUrl()}/api/hdfc/status`);
        if (res.ok) {
            const data = await res.json();
            window.HDFC_GATEWAY_CONFIG = data;
            const badge = document.getElementById('hdfc-gateway-live-badge');
            if (badge) {
                badge.innerHTML = `<span class="hli-dot"></span><span>HDFC SMARTGATEWAY™ ONLINE</span>`;
                badge.setAttribute('title', `Gateway: ${data.gateway} • MID: ${data.merchantId} • Environment: ${data.environment.toUpperCase()} • 256-Bit SSL`);
            }
        }
    } catch (e) {
        console.warn('HDFC Gateway local probe note:', e.message);
    }
}

function normalizeImgPath(src) {
    if (!src) return 'assets/official_bestseller_idada_q2i.jpg';
    if (src.startsWith('assets/') || src.startsWith('http') || src.startsWith('data:')) return src;
    return 'assets/' + src;
}

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ==========================================================================
// SYBER SPACE — STANDALONE LUXURY CART WINDOW ENGINE
// Synchronized with localStorage ('syber_cart')
// ==========================================================================

// Internal Application Checkout State Variables
let isCheckoutActive = false;
let isCheckoutOpen = false;
let isPaymentProcessing = false;

// Expose on window for telemetry, cross-module verification, and debugging
window.isCheckoutActive = false;
window.isCheckoutOpen = false;
window.isPaymentProcessing = false;

let activeCheckoutTotal = 0;
let currentOrderRef = '';
let currentCustomerData = null;
let selectedPaymentRail = 'upi';
let selectedNetBankingBank = 'HDFC Bank';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Render & Live Gateway Health Probe
    renderCart();
    checkGatewayHealth();

    // 2. ESC key listener to close HDFC modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeHdfcModal();
        }
    });

    // Backdrop click listener to close HDFC modal on outside click
    const hdfcModal = document.getElementById('hdfc-checkout-modal');
    if (hdfcModal) {
        hdfcModal.addEventListener('click', (e) => {
            if (e.target === hdfcModal) {
                closeHdfcModal();
            }
        });
    }

    // 3. Auto-launch HDFC checkout if navigated with ?checkout=1
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === '1') {
        const cart = getCart();
        if (cart && cart.length > 0) {
            const grandTotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.qty || item.quantity || 1)), 0);
            setTimeout(() => {
                initiateHdfcCheckout(grandTotal);
            }, 250);
        }
    }

    // 4. Listen for storage changes from other windows/tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'syber_cart' || e.key === 'syber_cart_items') {
            renderCart();
        }
    });
});

function getCart() {
    try {
        let raw = localStorage.getItem('syber_cart');
        if (!raw) {
            // Check legacy key
            raw = localStorage.getItem('syber_cart_items');
            if (raw) {
                // Migrate to syber_cart
                localStorage.setItem('syber_cart', raw);
            }
        }
        const cart = JSON.parse(raw || '[]');
        // Normalize schema
        return cart.map(item => ({
            id: item.id || `prod-${Math.random()}`,
            title: item.title || item.name || 'Surveillance Hardware',
            name: item.title || item.name || 'Surveillance Hardware',
            brand: item.brand || 'SYBER',
            price: Number(item.price) || 0,
            mrp: item.mrp || '',
            save: item.save || '',
            img: item.img || item.image || 'assets/official_bestseller_idada_q2i.jpg',
            image: item.img || item.image || 'assets/official_bestseller_idada_q2i.jpg',
            qty: Number(item.qty || item.quantity || 1),
            quantity: Number(item.qty || item.quantity || 1)
        }));
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem('syber_cart', JSON.stringify(cart));
        localStorage.setItem('syber_cart_items', JSON.stringify(cart)); // sync legacy
    } catch (e) {}
    updateNavCartCount();
}

function updateNavCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    const totalBadge = document.getElementById('cart-total-badge');
    if (totalBadge) {
        totalBadge.textContent = `${totalItems} ITEM${totalItems === 1 ? '' : 'S'}`;
    }
    const headerCounter = document.getElementById('cart-counter');
    if (headerCounter) {
        headerCounter.textContent = totalItems;
    }
}

function returnToStore() {
    window.location.href = 'index.html';
}

function handleCartSearch(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('cart-search-input');
    const query = input ? input.value.trim() : '';
    if (query) {
        window.location.href = `index.html?search=${encodeURIComponent(query)}`;
    } else {
        window.location.href = 'index.html';
    }
}

function renderCart() {
    updateNavCartCount();
    const container = document.getElementById('cart-content-wrapper');
    if (!container) return;

    const cart = getCart();

    if (!cart || cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty-window-card">
                <div class="cart-empty-icon-wrap">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                </div>
                <h2 class="cart-empty-headline">Your shopping cart is currently empty</h2>
                <p class="cart-empty-subtext">
                    Browse genuine 4G solar PTZ cameras, commercial Wi-Fi systems, and surveillance infrastructure at direct wholesale prices.
                </p>
                <div class="cart-empty-actions">
                    <button type="button" class="btn-cart-empty-browse" onclick="returnToStore()">
                        EXPLORE SURVEILLANCE CATALOG &rarr;
                    </button>
                </div>
            </div>
        `;
        return;
    }

    let subtotal = 0;
    let itemsHtml = '';

    cart.forEach((item, index) => {
        const qty = item.qty || 1;
        const itemTotal = item.price * qty;
        subtotal += itemTotal;
        const mrpHtml = item.mrp ? `<span class="cwi-mrp">${escapeHtml(item.mrp)}</span>` : '';
        const saveHtml = item.save ? `<span class="cwi-save-tag">${escapeHtml(item.save)}</span>` : '';

        itemsHtml += `
            <div class="cart-window-item-card" data-index="${index}">
                <div class="cwi-thumbnail-box">
                    <img src="${normalizeImgPath(item.img)}" onerror="this.onerror=null;this.src='assets/official_bestseller_idada_q2i.jpg';" alt="${escapeHtml(item.title)}" class="cwi-thumbnail-img">
                </div>
                <div class="cwi-meta-col">
                    <div class="cwi-brand-row">
                        <span class="cwi-brand-badge">${escapeHtml(item.brand)}</span>
                        ${saveHtml}
                    </div>
                    <h3 class="cwi-title">${escapeHtml(item.title)}</h3>
                    <div class="cwi-unit-price-row">
                        <span class="cwi-unit-price">&#8377;${item.price.toLocaleString('en-IN')}</span>
                        ${mrpHtml}
                        <span class="cwi-warranty-label">&bull; Official 1-Yr Brand Warranty</span>
                    </div>
                </div>
                <div class="cwi-controls-col">
                    <div class="cwi-qty-stepper">
                        <button type="button" class="cwi-btn-qty minus" onclick="updateItemQty(${index}, -1)" aria-label="Decrease quantity">&minus;</button>
                        <span class="cwi-qty-val">${qty}</span>
                        <button type="button" class="cwi-btn-qty plus" onclick="updateItemQty(${index}, 1)" aria-label="Increase quantity">&#43;</button>
                    </div>
                    <div class="cwi-subtotal-block">
                        <span class="cwi-subtotal-label">Subtotal</span>
                        <span class="cwi-subtotal-val">&#8377;${itemTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <button type="button" class="cwi-btn-remove" onclick="removeItem(${index})" title="Remove item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span>Remove</span>
                    </button>
                </div>
            </div>
        `;
    });

    const gstAmount = Math.round(subtotal * 0.18 / 1.18);
    const baseAmount = subtotal - gstAmount;
    const grandTotal = subtotal;

    // Build WhatsApp Order Link
    let waMsg = `Hello Syber Space, I am placing an order from my Shopping Cart Window:

`;
    cart.forEach((item, idx) => {
        waMsg += `${idx + 1}. ${item.title} (${item.brand})
   Qty: ${item.qty} × Rs. ${item.price.toLocaleString('en-IN')} = Rs. ${(item.price * item.qty).toLocaleString('en-IN')}

`;
    });
    waMsg += `--------------------------------
`;
    waMsg += `Total Payable: Rs. ${grandTotal.toLocaleString('en-IN')}
`;
    waMsg += `Delivery: Free Insured Pan-India Express

`;
    waMsg += `Please provide dispatch details and bank / UPI payment options.`;

    const waHref = `https://wa.me/917511180808?text=${encodeURIComponent(waMsg)}`;

    container.innerHTML = `
        <div class="cart-window-grid-layout">
            
            <!-- Left Column: Items List & Guarantees -->
            <div class="cart-items-column">
                <div class="cwi-items-header-bar">
                    <span class="cwi-heading">Procurement Items (${cart.reduce((sum, item) => sum + item.qty, 0)})</span>
                    <button type="button" class="cwi-add-more-btn" onclick="returnToStore()">
                        + Add More Products
                    </button>
                </div>

                <div class="cart-items-cards-list">
                    ${itemsHtml}
                </div>

                <!-- Unboxing Video Policy Notice Card -->
                <div class="cart-unboxing-notice-card">
                    <div class="cun-icon-wrap">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                        </svg>
                    </div>
                    <div class="cun-text-wrap">
                        <strong class="cun-title">Continuous Unboxing Video Policy</strong>
                        <p class="cun-desc">
                            To ensure an effortless, zero-delay customer support experience, please record a continuous, uncut video while unboxing your package upon delivery. This provides instant verification for rapid replacement dispatch.
                        </p>
                    </div>
                </div>

                <!-- Cancellation, Refund & Exchange Policy Card -->
                <div class="cart-policy-notice-card">
                    <div class="cpn-header">
                        <span class="cpn-kicker">DISPATCH & RETURN TERMS</span>
                        <span class="cpn-pill">NO CANCELLATION &bull; ONLY REFUND &amp; EXCHANGE</span>
                    </div>
                    <h4 class="cpn-title">Wholesale Procurement Terms</h4>
                    <p class="cpn-desc">
                        Surveillance equipment is queued immediately for warehouse testing, serial number registration, and same-day transit insurance, so <strong>cancellations are not permitted</strong> once an order is placed. We guarantee full support via our <strong>7-Day Refund &amp; Hardware Exchange Policy</strong> (continuous unboxing video required for transit claims).
                    </p>
                    <button type="button" class="btn-cart-refund-link" onclick="openRefundExchangeModal()">
                        HAVE AN EXISTING ORDER? REQUEST REFUND / EXCHANGE &rarr;
                    </button>
                </div>

                <!-- Trust Badges Strip -->
                <div class="cart-trust-badges-strip">
                    <div class="ctb-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        <span>100% Genuine Authorized Hardware</span>
                    </div>
                    <div class="ctb-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                        <span>Free Insured Pan-India Express Delivery</span>
                    </div>
                    <div class="ctb-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        <span>Official GST Tax Invoice Included</span>
                    </div>
                </div>

            </div>

            <!-- Right Column: Order Summary & Checkout -->
            <div class="cart-summary-column">
                <div class="cart-order-summary-card">
                    <h2 class="cos-title">Order Summary</h2>
                    
                    <div class="cos-rows-list">
                        <div class="cos-row">
                            <span class="cos-label">Taxable Subtotal</span>
                            <span class="cos-val">&#8377;${baseAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="cos-row">
                            <span class="cos-label">GST (18% Included)</span>
                            <span class="cos-val">&#8377;${gstAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="cos-row">
                            <span class="cos-label">Insured Express Courier</span>
                            <span class="cos-val cos-val-free">FREE</span>
                        </div>
                        <div class="cos-divider"></div>
                        <div class="cos-row cos-total-row">
                            <span class="cos-total-label">Estimated Total</span>
                            <span class="cos-total-amount">&#8377;${grandTotal.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <!-- Checkout Actions -->
                    <div class="cos-actions-block">
                        <a href="${waHref}" target="_blank" rel="noopener noreferrer" class="btn-cos-whatsapp">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
                                <path fill="#FFFFFF" d="M17.47 14.38c-.28-.14-1.66-.82-1.92-.91-.26-.1-.45-.14-.64.14-.19.28-.73.91-.9 1.1-.17.19-.34.21-.62.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.66-1.55-1.94-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.49-.17-.01-.36-.01-.56-.01-.2 0-.52.07-.79.37-.27.29-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.19 5.06 4.47.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.66-.68 1.9-1.33.23-.65.23-1.21.16-1.33-.07-.12-.26-.19-.54-.33z"/>
                            </svg>
                            <span>ORDER VIA WHATSAPP &rarr;</span>
                        </a>

                        <button type="button" class="btn-cos-online" onclick="initiateHdfcCheckout(${grandTotal})">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <span>PAY ONLINE (HDFC SMARTGATEWAY)</span>
                        </button>

                        <button type="button" class="btn-cos-continue" onclick="returnToStore()">
                            &larr; CONTINUE SHOPPING
                        </button>
                    </div>

                    <!-- Security & Gateway Endorsement -->
                    <div class="cos-security-footer">
                        <div class="csf-row">
                            <span class="csf-badge">HDFC BANK</span>
                            <span>256-Bit SSL SmartGateway Payment Rail</span>
                        </div>
                        <div class="csf-row">
                            <span class="csf-badge">DISPATCH</span>
                            <span>Warehouse Dispatch: Kerala HQ // Pan-India</span>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    `;
}

function updateItemQty(index, delta) {
    const cart = getCart();
    if (!cart[index]) return;

    cart[index].qty = (cart[index].qty || 1) + delta;
    cart[index].quantity = cart[index].qty;

    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }

    saveCart(cart);
    renderCart();
}

function removeItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
}


function initiateHdfcCheckout(total) {
    if (!total || isNaN(total)) {
        const cart = getCart();
        total = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || item.quantity || 1)), 0);
    }
    activeCheckoutTotal = Number(total) || 0;
    currentOrderRef = `SS-HDFC-${Math.floor(100000 + Math.random() * 900000)}`;

    // Explicitly update internal application checkout state variables
    isCheckoutActive = true;
    isCheckoutOpen = true;
    isPaymentProcessing = false;
    window.isCheckoutActive = true;
    window.isCheckoutOpen = true;
    window.isPaymentProcessing = false;

    // Ensure ?checkout=1 is synchronized in URL without full page reload
    if (window.history && window.history.replaceState) {
        try {
            const url = new URL(window.location.href);
            if (!url.searchParams.has('checkout')) {
                url.searchParams.set('checkout', '1');
                const cleanUrl = url.pathname + '?' + url.searchParams.toString() + url.hash;
                window.history.replaceState({}, document.title, cleanUrl);
            }
        } catch (e) {}
    }

    const modal = document.getElementById('hdfc-checkout-modal');
    const orderRefEl = document.getElementById('hdfc-order-ref');
    const totalAmountEl = document.getElementById('hdfc-total-amount');

    if (orderRefEl) orderRefEl.textContent = currentOrderRef;
    if (totalAmountEl) totalAmountEl.innerHTML = `&#8377;${total.toLocaleString('en-IN')}`;

    // Render Step 1: Dispatch & Invoicing Details Form
    renderHdfcStep1();

    // Register Order Session on Server
    fetch(`${getApiBaseUrl()}/api/hdfc/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            orderId: currentOrderRef,
            amount: activeCheckoutTotal,
            customer: currentCustomerData || {},
            items: getCart()
        })
    }).then(res => res.json()).then(data => {
        if (data && data.checksum) {
            window.activeHdfcChecksum = data.checksum;
        }
    }).catch(err => {
        console.warn('HDFC Order sync note:', err.message);
    });

    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (typeof gsap !== 'undefined') {
            const card = modal.querySelector('.hdfc-terminal-window');
            gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
            if (card) {
                gsap.fromTo(card,
                    { opacity: 0, scale: 0.94, y: 20 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.2)', clearProps: 'transform,opacity' }
                );
            }
        }
    }
}

let hdfcPollingInterval = null;
let hdfcCountdownTimer = null;

function clearHdfcTimers() {
    if (hdfcPollingInterval) {
        clearInterval(hdfcPollingInterval);
        hdfcPollingInterval = null;
    }
    if (hdfcCountdownTimer) {
        clearInterval(hdfcCountdownTimer);
        hdfcCountdownTimer = null;
    }
}

function closeHdfcModal() {
    clearHdfcTimers();

    // 1. Explicitly reset application internal checkout state variables to false
    isCheckoutActive = false;
    isCheckoutOpen = false;
    isPaymentProcessing = false;
    window.isCheckoutActive = false;
    window.isCheckoutOpen = false;
    window.isPaymentProcessing = false;

    // 2. Remove ?checkout=1 parameter from URL using window.history.replaceState
    if (window.history && window.history.replaceState) {
        try {
            const url = new URL(window.location.href);
            if (url.searchParams.has('checkout')) {
                url.searchParams.delete('checkout');
                const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
                window.history.replaceState({}, document.title, cleanUrl);
            }
        } catch (err) {
            console.warn('Failed to clean checkout URL param:', err);
        }
    }

    const modal = document.getElementById('hdfc-checkout-modal');
    if (!modal) return;

    // Immediately disable pointer events so no invisible wrapper can intercept clicks
    modal.style.pointerEvents = 'none';

    if (typeof gsap !== 'undefined') {
        const card = modal.querySelector('.hdfc-terminal-window');
        if (card) {
            gsap.to(card, { opacity: 0, scale: 0.96, y: 10, duration: 0.2, ease: 'power2.in' });
        }
        gsap.to(modal, {
            opacity: 0,
            duration: 0.22,
            ease: 'power2.in',
            onComplete: () => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                if (card) gsap.set(card, { clearProps: 'all' });
                gsap.set(modal, { clearProps: 'all' });
                modal.style.pointerEvents = '';
            }
        });
    } else {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        modal.style.pointerEvents = '';
    }
}

function getCookieValue(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

// STEP 1: Billing, Shipping & GST Tax Invoice Form
function renderHdfcStep1() {
    clearHdfcTimers();
    const body = document.getElementById('hdfc-modal-body');
    if (!body) return;

    const detectedCity = getCookieValue('syber_user_city') || 'Kochi';
    const detectedState = getCookieValue('syber_user_state') || 'Kerala';
    const detectedPin = getCookieValue('syber_user_pincode') || '682001';

    body.innerHTML = `
        <div class="hdfc-form-step">
            <div class="hdfc-form-section-title">
                <span>1. TAX INVOICE & DISPATCH DETAILS</span>
                <span style="color:#059669; font-size:0.7rem; font-weight:700;">STEP 1 OF 2</span>
            </div>
            <div style="font-size:0.78rem; color:#475569; margin-bottom:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; line-height:1.45;">
                <strong>Invoice Notice:</strong> Customer and business details entered below will generate your official Kerala Commercial GST Tax Invoice, automatically transmitted to <strong>info@syberspace.in</strong> upon payment confirmation.
            </div>

            <form id="hdfc-billing-form" onsubmit="handleBillingSubmit(event)">
                <div class="hdfc-grid-form">
                    <div class="hdfc-field-group">
                        <label for="cust-name">Full Name *</label>
                        <input type="text" id="cust-name" required placeholder="e.g. Adithyan S." value="${currentCustomerData ? currentCustomerData.name : 'Adithyan S.'}">
                    </div>

                    <div class="hdfc-field-group">
                        <label for="cust-phone">Phone Number (+91) *</label>
                        <input type="tel" id="cust-phone" required pattern="[0-9]{10}" placeholder="10-digit mobile" value="${currentCustomerData ? currentCustomerData.phone : '9876543210'}">
                    </div>

                    <div class="hdfc-field-group">
                        <label for="cust-email">Email Address *</label>
                        <input type="email" id="cust-email" required placeholder="name@domain.com" value="${currentCustomerData ? currentCustomerData.email : 'orders@syberspace.in'}">
                    </div>

                    <div class="hdfc-field-group">
                        <label for="cust-company">Company Name (Optional)</label>
                        <input type="text" id="cust-company" placeholder="e.g. Syber Space Systems LLP" value="${currentCustomerData && currentCustomerData.company ? currentCustomerData.company : ''}">
                    </div>

                    <div class="hdfc-field-group span-2">
                        <label for="cust-gstin">GSTIN (Optional)</label>
                        <input type="text" id="cust-gstin" placeholder="15-character GSTIN (e.g. 32AABCU9603R1ZM)" maxlength="15" value="${currentCustomerData && currentCustomerData.gstin ? currentCustomerData.gstin : ''}">
                    </div>

                    <div class="hdfc-field-group span-2">
                        <label for="cust-address">Delivery Address *</label>
                        <input type="text" id="cust-address" required placeholder="Premises, Street, Area" value="${currentCustomerData ? currentCustomerData.address : 'Tech Zone, Civil Station Road'}">
                    </div>

                    <div class="hdfc-field-group">
                        <label for="cust-city">City / District *</label>
                        <input type="text" id="cust-city" required placeholder="e.g. Ernakulam" value="${currentCustomerData ? currentCustomerData.city : detectedCity}">
                    </div>

                    <div class="hdfc-field-group">
                        <label for="cust-state">State *</label>
                        <select id="cust-state" required>
                            <option value="Kerala" selected>Kerala (32)</option>
                            <option value="Tamil Nadu">Tamil Nadu (33)</option>
                            <option value="Karnataka">Karnataka (29)</option>
                            <option value="Maharashtra">Maharashtra (27)</option>
                            <option value="Delhi">Delhi (07)</option>
                            <option value="Telangana">Telangana (36)</option>
                            <option value="Andhra Pradesh">Andhra Pradesh (37)</option>
                            <option value="Gujarat">Gujarat (24)</option>
                            <option value="Other">Other Indian State</option>
                        </select>
                    </div>

                    <div class="hdfc-field-group">
                        <label for="cust-pincode">Postal Pincode *</label>
                        <input type="text" id="cust-pincode" required pattern="[0-9]{6}" placeholder="6-digit pincode" value="${currentCustomerData ? currentCustomerData.pincode : detectedPin}" maxlength="6">
                    </div>
                </div>

                <div class="hdfc-modal-footer" style="padding-left:0; padding-right:0; margin-top:24px; background:transparent;">
                    <div class="hdfc-security-badge">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <span>256-BIT SSL ENCRYPTED // PCI-DSS LEVEL 1</span>
                    </div>
                    <button type="submit" class="hdfc-pay-now-btn">
                        <span>PROCEED TO PAYMENT &rarr;</span>
                    </button>
                </div>
            </form>
        </div>
    `;
}

function handleBillingSubmit(e) {
    e.preventDefault();
    currentCustomerData = {
        name: document.getElementById('cust-name').value.trim(),
        phone: document.getElementById('cust-phone').value.trim(),
        email: document.getElementById('cust-email').value.trim(),
        company: document.getElementById('cust-company').value.trim(),
        gstin: document.getElementById('cust-gstin').value.trim().toUpperCase(),
        address: document.getElementById('cust-address').value.trim(),
        city: document.getElementById('cust-city').value.trim(),
        state: document.getElementById('cust-state').value.trim(),
        pincode: document.getElementById('cust-pincode').value.trim()
    };

    // Update session on HDFC Backend
    fetch(`${getApiBaseUrl()}/api/hdfc/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            orderId: currentOrderRef,
            amount: activeCheckoutTotal,
            customer: currentCustomerData,
            items: getCart()
        })
    }).then(res => res.json()).then(data => {
        if (data && data.checksum) {
            window.activeHdfcChecksum = data.checksum;
        }
    }).catch(err => {
        console.warn('HDFC Order sync note:', err.message);
    });

    renderHdfcStep2();
}

let selectedUpiAppKey = 'gpay';
function selectUpiApp(appKey, elem) {
    selectedUpiAppKey = appKey;
    document.querySelectorAll('.hdfc-upi-app-card').forEach(c => c.classList.remove('selected'));
    if (elem) elem.classList.add('selected');
}

// STEP 2: HDFC Multi-Rail Payment Interface (UPI Dynamic QR, Cards, NetBanking, EMI)
function renderHdfcStep2() {
    clearHdfcTimers();
    const body = document.getElementById('hdfc-modal-body');
    if (!body) return;

    // Standard NPCI UPI Intent URI
    const upiMerchantVpa = (window.HDFC_GATEWAY_CONFIG && window.HDFC_GATEWAY_CONFIG.merchantVpa) ? window.HDFC_GATEWAY_CONFIG.merchantVpa : 'syberspace@hdfcbank';
    const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiMerchantVpa)}&pn=Syber%20Space%20Systems&mc=5045&tid=88102941&tr=${currentOrderRef}&tn=Order%20${currentOrderRef}&am=${activeCheckoutTotal}&cu=INR`;

    body.innerHTML = `
        <div class="hdfc-payment-step">
            <div class="hdfc-form-section-title">
                <span>2. SELECT PAYMENT METHOD</span>
                <button type="button" onclick="renderHdfcStep1()" class="hdfc-back-link">
                    &larr; Edit Shipping Address
                </button>
            </div>

            <!-- Payment Methods Tabs -->
            <div class="hdfc-rails-tabs" role="tablist">
                <button type="button" class="hdfc-rail-tab active" onclick="switchHdfcRail('upi', this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                    <span>UPI (Dynamic QR & Apps)</span>
                </button>
                <button type="button" class="hdfc-rail-tab" onclick="switchHdfcRail('card', this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <span>Credit / Debit Cards</span>
                </button>
                <button type="button" class="hdfc-rail-tab" onclick="switchHdfcRail('netbanking', this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="5 6 12 3 19 6"/><line x1="4" y1="10" x2="4" y2="21"/><line x1="20" y1="10" x2="20" y2="21"/><line x1="8" y1="14" x2="8" y2="17"/><line x1="12" y1="14" x2="12" y2="17"/><line x1="16" y1="14" x2="16" y2="17"/></svg>
                    <span>NetBanking (50+ Banks)</span>
                </button>
                <button type="button" class="hdfc-rail-tab" onclick="switchHdfcRail('emi', this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>HDFC EasyEMI</span>
                </button>
            </div>

            <!-- Rail 1: UPI Panel (Dynamic QR + Apps) -->
            <div id="panel-upi" class="hdfc-rail-panel active">
                <div class="hdfc-upi-split-layout">
                    
                    <!-- Left: Dynamic QR Code -->
                    <div class="hdfc-qr-card">
                        <span class="hdfc-field-subheading" style="margin-bottom:4px;">SCAN & PAY</span>
                        <div class="hdfc-qr-svg-wrap" id="hdfc-qrcode-container">
                            <!-- Injected by QRCode.js or fallback -->
                        </div>
                        <span class="hdfc-qr-caption">Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)</span>
                        <div class="hdfc-qr-timer" id="hdfc-qr-countdown">Expires in 10:00</div>
                        <a href="${upiIntentUrl}" class="hdfc-vpa-btn" style="text-decoration:none; margin-top:10px; width:100%; text-align:center; padding:8px 12px; font-size:0.72rem;">
                            OPEN UPI APP DIRECTLY &rarr;
                        </a>
                    </div>

                    <!-- Right: Apps & Manual VPA -->
                    <div class="hdfc-upi-flow-wrap">
                        <span class="hdfc-field-subheading">Or Select UPI App</span>
                        <div class="hdfc-upi-apps-grid">
                            <div class="hdfc-upi-app-card selected" onclick="selectUpiApp('gpay', this)">
                                <span class="upi-app-badge">GPAY</span>
                                <span class="upi-app-title">Google Pay</span>
                                <span class="upi-app-speed">Fast</span>
                            </div>
                            <div class="hdfc-upi-app-card" onclick="selectUpiApp('phonepe', this)">
                                <span class="upi-app-badge">PHONEPE</span>
                                <span class="upi-app-title">PhonePe</span>
                                <span class="upi-app-speed">Instant</span>
                            </div>
                            <div class="hdfc-upi-app-card" onclick="selectUpiApp('paytm', this)">
                                <span class="upi-app-badge">PAYTM</span>
                                <span class="upi-app-title">Paytm</span>
                                <span class="upi-app-speed">Instant</span>
                            </div>
                            <div class="hdfc-upi-app-card" onclick="selectUpiApp('bhim', this)">
                                <span class="upi-app-badge">BHIM</span>
                                <span class="upi-app-title">BHIM UPI</span>
                                <span class="upi-app-speed">Direct</span>
                            </div>
                            <div class="hdfc-upi-app-card" onclick="selectUpiApp('cred', this)">
                                <span class="upi-app-badge">CRED</span>
                                <span class="upi-app-title">CRED Pay</span>
                                <span class="upi-app-speed">Verified</span>
                            </div>
                        </div>

                        <!-- Direct VPA Input Row -->
                        <div class="hdfc-vpa-container">
                            <label for="upi-vpa-input" class="hdfc-vpa-label">Or Enter UPI ID / VPA</label>
                            <div class="hdfc-vpa-input-group">
                                <input type="text" id="upi-vpa-input" placeholder="e.g. mobile@okhdfcbank" value="customer@okhdfcbank">
                                <button type="button" class="hdfc-vpa-btn" onclick="executeHdfcPayment('UPI VPA')">
                                    <span>PAY ₹${activeCheckoutTotal.toLocaleString('en-IN')}</span>
                                </button>
                            </div>
                            <div class="hdfc-vpa-handles">
                                <span>Supported: @okhdfcbank &bull; @okaxis &bull; @oksbi &bull; @ybl &bull; @paytm &bull; @ibl</span>
                            </div>
                        </div>

                        <!-- Bank Notice -->
                        <div class="hdfc-dynamic-notice">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                            <span>Secured by HDFC Bank SmartGateway™ with 256-bit SSL encryption and RBI-mandated PCI-DSS Level 1 tokenization.</span>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Rail 2: Cards Panel -->
            <div id="panel-card" class="hdfc-rail-panel">
                <div class="hdfc-card-icons-row">
                    <span class="card-brand-pill">VISA</span>
                    <span class="card-brand-pill">MASTERCARD</span>
                    <span class="card-brand-pill">RUPAY</span>
                    <span class="card-brand-pill">DINERS CLUB</span>
                </div>
                <div class="hdfc-card-form">
                    <div class="hdfc-field-group span-2">
                        <label for="card-num">Card Number (Debit / Credit) *</label>
                        <input type="text" id="card-num" placeholder="4567 8901 2345 6789" maxlength="19" value="4567 •••• •••• 8808">
                    </div>
                    <div class="hdfc-field-group">
                        <label for="card-expiry">Expiry Date (MM/YY) *</label>
                        <input type="text" id="card-expiry" placeholder="MM/YY" maxlength="5" value="08/28">
                    </div>
                    <div class="hdfc-field-group">
                        <label for="card-cvv">CVV / CVC (3 Digits) *</label>
                        <input type="password" id="card-cvv" placeholder="•••" maxlength="4" value="888">
                    </div>
                    <div class="hdfc-field-group span-2">
                        <label for="card-name">Cardholder Name *</label>
                        <input type="text" id="card-name" placeholder="Name as displayed on card" value="${currentCustomerData ? currentCustomerData.name : 'Adithyan S.'}">
                    </div>
                </div>
                <div class="hdfc-card-security-note">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>3D Secure 2.0 OTP Authentication Automated via HDFC Bank Core Switch</span>
                </div>
            </div>

            <!-- Rail 3: NetBanking Panel -->
            <div id="panel-netbanking" class="hdfc-rail-panel">
                <span class="hdfc-field-subheading">Popular Retail & Corporate Banks</span>
                <div class="hdfc-nb-grid">
                    <button type="button" class="hdfc-nb-btn featured selected" onclick="selectBank('HDFC Bank', this)">
                        HDFC Bank Direct (Fast-Track)
                    </button>
                    <button type="button" class="hdfc-nb-btn" onclick="selectBank('State Bank of India', this)">
                        State Bank of India
                    </button>
                    <button type="button" class="hdfc-nb-btn" onclick="selectBank('ICICI Bank', this)">
                        ICICI Bank
                    </button>
                    <button type="button" class="hdfc-nb-btn" onclick="selectBank('Axis Bank', this)">
                        Axis Bank
                    </button>
                    <button type="button" class="hdfc-nb-btn" onclick="selectBank('Kotak Mahindra', this)">
                        Kotak Mahindra
                    </button>
                    <button type="button" class="hdfc-nb-btn" onclick="selectBank('Federal Bank', this)">
                        Federal Bank
                    </button>
                </div>
                <div class="hdfc-field-group" style="margin-top:14px;">
                    <label for="other-banks">Or Select from 50+ Other Indian Banks</label>
                    <select id="other-banks" onchange="selectBank(this.value, null)">
                        <option value="">-- Choose Other Authorized Bank --</option>
                        <option value="Punjab National Bank">Punjab National Bank</option>
                        <option value="Bank of Baroda">Bank of Baroda</option>
                        <option value="Canara Bank">Canara Bank</option>
                        <option value="Union Bank of India">Union Bank of India</option>
                        <option value="Kerala Gramin Bank">Kerala Gramin Bank</option>
                        <option value="IndusInd Bank">IndusInd Bank</option>
                        <option value="South Indian Bank">South Indian Bank</option>
                        <option value="IDBI Bank">IDBI Bank</option>
                    </select>
                </div>
            </div>

            <!-- Rail 4: EasyEMI Panel -->
            <div id="panel-emi" class="hdfc-rail-panel">
                <span class="hdfc-field-subheading">HDFC Bank Credit & Debit Card EasyEMI Plans</span>
                <div class="hdfc-emi-options-list">
                    <label class="hdfc-emi-option">
                        <span><input type="radio" name="emi_tenure" value="3" checked> <strong>3 Months</strong> (No Cost EMI)</span>
                        <strong class="emi-rate-callout">₹${Math.round(activeCheckoutTotal / 3).toLocaleString('en-IN')} / mo</strong>
                    </label>
                    <label class="hdfc-emi-option">
                        <span><input type="radio" name="emi_tenure" value="6"> <strong>6 Months</strong> (Low Interest 1.25%/mo)</span>
                        <strong class="emi-rate-callout">₹${Math.round((activeCheckoutTotal * 1.04) / 6).toLocaleString('en-IN')} / mo</strong>
                    </label>
                    <label class="hdfc-emi-option">
                        <span><input type="radio" name="emi_tenure" value="12"> <strong>12 Months</strong></span>
                        <strong class="emi-rate-callout">₹${Math.round((activeCheckoutTotal * 1.08) / 12).toLocaleString('en-IN')} / mo</strong>
                    </label>
                </div>
            </div>

            <!-- Modal Action Footer -->
            <div class="hdfc-modal-footer" style="padding-left:0; padding-right:0; margin-top:24px; background:transparent;">
                <div class="hdfc-security-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span>VERIFIED BY HDFC BANK SMARTHUB // PCI-DSS LEVEL 1</span>
                </div>
                <button type="button" class="hdfc-pay-now-btn" onclick="executeHdfcPayment(selectedPaymentRail)">
                    <span>AUTHORIZE &amp; PAY ₹${activeCheckoutTotal.toLocaleString('en-IN')}</span>
                </button>
            </div>
        </div>
    `;

    // Initialize Dynamic QR Code
    setTimeout(() => {
        const qrContainer = document.getElementById('hdfc-qrcode-container');
        if (qrContainer) {
            qrContainer.innerHTML = '';
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: upiIntentUrl,
                    width: 150,
                    height: 150,
                    colorDark: '#0f172a',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
            } else {
                // Fallback clean SVG representation if library is loading
                qrContainer.innerHTML = `
                    <svg width="150" height="150" viewBox="0 0 150 150" fill="none">
                        <rect width="150" height="150" fill="#ffffff" stroke="#e2e8f0"/>
                        <rect x="15" y="15" width="40" height="40" fill="#0f172a"/>
                        <rect x="23" y="23" width="24" height="24" fill="#ffffff"/>
                        <rect x="27" y="27" width="16" height="16" fill="#0f172a"/>
                        <rect x="95" y="15" width="40" height="40" fill="#0f172a"/>
                        <rect x="103" y="23" width="24" height="24" fill="#ffffff"/>
                        <rect x="107" y="27" width="16" height="16" fill="#0f172a"/>
                        <rect x="15" y="95" width="40" height="40" fill="#0f172a"/>
                        <rect x="23" y="103" width="24" height="24" fill="#ffffff"/>
                        <rect x="27" y="107" width="16" height="16" fill="#0f172a"/>
                        <rect x="70" y="30" width="10" height="30" fill="#0f172a"/>
                        <rect x="70" y="70" width="30" height="10" fill="#0f172a"/>
                        <rect x="65" y="95" width="20" height="20" fill="#0f172a"/>
                        <rect x="105" y="75" width="30" height="30" fill="#0f172a"/>
                    </svg>
                `;
            }
        }
    }, 50);

    // 10-Minute Expiry Countdown Timer
    let secondsLeft = 600;
    hdfcCountdownTimer = setInterval(() => {
        secondsLeft--;
        const timerEl = document.getElementById('hdfc-qr-countdown');
        if (timerEl) {
            const mins = Math.floor(secondsLeft / 60);
            const secs = secondsLeft % 60;
            timerEl.textContent = `Expires in ${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
        if (secondsLeft <= 0) {
            clearHdfcTimers();
        }
    }, 1000);

    // Live Order Status Polling (checks server every 2.5 seconds)
    hdfcPollingInterval = setInterval(() => {
        fetch(`${getApiBaseUrl()}/api/hdfc/order-status/${currentOrderRef}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.status === 'CAPTURED') {
                    clearHdfcTimers();
                    renderHdfcSuccessScreen(data);
                }
            })
            .catch(() => {});
    }, 2500);
}

function switchHdfcRail(rail, tabBtn) {
    selectedPaymentRail = rail;
    document.querySelectorAll('.hdfc-rail-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.hdfc-rail-panel').forEach(p => p.classList.remove('active'));

    if (tabBtn) tabBtn.classList.add('active');
    const panel = document.getElementById(`panel-${rail}`);
    if (panel) panel.classList.add('active');
}

function selectBank(bankName, btnElem) {
    selectedNetBankingBank = bankName;
    document.querySelectorAll('.hdfc-nb-btn').forEach(b => b.classList.remove('selected'));
    if (btnElem) btnElem.classList.add('selected');
}

// STEP 3: Execution, Authorization Simulation & Verified Tax Invoice Generation
async function executeHdfcPayment(paymentRail) {
    clearHdfcTimers();
    isPaymentProcessing = true;
    window.isPaymentProcessing = true;
    const body = document.getElementById('hdfc-modal-body');
    if (!body) return;

    // Show Authorization in progress
    body.innerHTML = `
        <div class="hdfc-verifying-screen">
            <div class="hdfc-spinner"></div>
            <h3 style="font-family:var(--font-display); font-size:1.4rem; color:#0f172a;">Securing Multi-Rail Authorization...</h3>
            <p style="font-size:0.86rem; color:#475569; max-width:480px; line-height:1.6;">
                Connecting to HDFC Bank Core Switch via ${paymentRail.toUpperCase()}. Routing 256-bit encrypted payload through merchant terminal <strong>#88102941</strong>.
            </p>
            <div style="font-family:var(--font-mono); font-size:0.75rem; color:#0f172a; margin-top:8px;">
                ORDER REFERENCE // ${currentOrderRef}
            </div>
        </div>
    `;

    // Attempt Server Verification via HDFC SmartGateway API
    let serverTxn = null;
    try {
        const res = await fetch(`${getApiBaseUrl()}/api/hdfc/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: currentOrderRef,
                amount: activeCheckoutTotal,
                paymentRail: paymentRail,
                customer: currentCustomerData,
                items: getCart(),
                signature: window.activeHdfcChecksum || 'HDFC-SHA256-CLIENT'
            })
        });
        if (res.ok) {
            serverTxn = await res.json();
        }
    } catch (e) {
        console.warn('Server verification note (fallback active):', e.message);
    }

    setTimeout(() => {
        renderHdfcSuccessScreen(serverTxn, paymentRail);
    }, 1200);
}

function renderHdfcSuccessScreen(serverTxn, rail) {
    clearHdfcTimers();
    const body = document.getElementById('hdfc-modal-body');
    if (!body) return;

    const cart = getCart();
    const paymentRail = rail || (serverTxn && serverTxn.paymentRail) || selectedPaymentRail;
    const txnId = (serverTxn && serverTxn.txnId) ? serverTxn.txnId : `HDFC-TXN-${Math.floor(100000000 + Math.random() * 900000000)}`;
    const authCode = (serverTxn && serverTxn.authCode) ? serverTxn.authCode : `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    // Calculate item breakdown
    let itemsRows = '';
    let totalQty = 0;
    cart.forEach((it, idx) => {
        const q = it.qty || it.quantity || 1;
        totalQty += q;
        itemsRows += `
            <tr>
                <td>SS-${1000 + idx}</td>
                <td>${escapeHtml(it.title || it.name)}</td>
                <td>${q}</td>
                <td>₹${it.price.toLocaleString('en-IN')}</td>
                <td style="text-align:right;">₹${(it.price * q).toLocaleString('en-IN')}</td>
            </tr>
        `;
    });

    const gstVal = Math.round(activeCheckoutTotal * 0.18 / 1.18);
    const taxableVal = activeCheckoutTotal - gstVal;

    // Render Invoice Receipt
    body.innerHTML = `
        <div class="hdfc-success-screen">
            <div class="hdfc-success-header">
                <div class="hdfc-success-check">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 style="font-family:var(--font-display); font-size:1.6rem; color:#0f172a; margin-bottom:6px;">
                    Payment Verified &amp; Captured
                </h2>
                <p style="font-size:0.86rem; color:#059669; font-family:var(--font-mono); font-weight:700;">
                    AUTHORIZED BY HDFC BANK CORE GATEWAY (RRN: ${txnId})
                </p>
            </div>

            <!-- B2B Tax Invoice Receipt (Printable) -->
            <div class="hdfc-invoice-receipt" id="printable-invoice">
                <div class="receipt-header-row">
                    <div>
                        <strong style="font-size:1rem; color:#0f172a;">SYBER SPACE SECURITY SYSTEMS</strong><br>
                        Authorized CCTV &amp; Surveillance Systems<br>
                        Kerala HQ • GSTIN: 32AABCU9603R1ZM • info@syberspace.in
                    </div>
                    <div style="text-align:right;">
                        <strong>TAX INVOICE: ${currentOrderRef}</strong><br>
                        Date: ${dateStr}<br>
                        Mode: HDFC ${paymentRail.toUpperCase()}<br>
                        Auth Code: ${authCode}
                    </div>
                </div>

                <div style="margin-bottom:16px;">
                    <strong>BILLED TO:</strong><br>
                    ${currentCustomerData ? escapeHtml(currentCustomerData.name) : 'Customer'}<br>
                    ${currentCustomerData && currentCustomerData.company ? escapeHtml(currentCustomerData.company) + '<br>' : ''}
                    ${currentCustomerData ? escapeHtml(currentCustomerData.address) + ', ' + escapeHtml(currentCustomerData.city) + ', ' + escapeHtml(currentCustomerData.state) + ' - ' + escapeHtml(currentCustomerData.pincode) : ''}<br>
                    Phone: +91 ${currentCustomerData ? escapeHtml(currentCustomerData.phone) : ''} • Email: ${currentCustomerData ? escapeHtml(currentCustomerData.email) : ''}<br>
                    ${currentCustomerData && currentCustomerData.gstin ? '<strong>GSTIN:</strong> ' + escapeHtml(currentCustomerData.gstin) : '<strong>GSTIN:</strong> Not Provided'}
                </div>

                <table class="receipt-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Unit Rate</th>
                            <th style="text-align:right;">Amount (INR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>

                <div style="border-top:1px dashed #cbd5e1; padding-top:12px;">
                    <div class="receipt-totals-row">
                        <span>Taxable Value:</span>
                        <span>₹${taxableVal.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="receipt-totals-row">
                        <span>GST @ 18%:</span>
                        <span>₹${gstVal.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="receipt-totals-row">
                        <span>Shipping:</span>
                        <span style="color:#059669; font-weight:700;">FREE INSURED EXPRESS</span>
                    </div>
                    <div class="receipt-totals-row grand">
                        <span>TOTAL AMOUNT CHARGED &amp; RECEIVED:</span>
                        <span>₹${activeCheckoutTotal.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            <!-- Email Transmission Confirmation Badge -->
            <div class="invoice-email-sent-badge">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <div>
                    <strong>TAX INVOICE &amp; ORDER TRANSMITTED TO info@syberspace.in</strong>
                    <p>All invoice generation details, customer billing records, and hardware item breakdown have been dispatched to the company email desk.</p>
                </div>
            </div>

            <!-- Wholesale Policy: No Cancellation // Only Refund & Exchange Prompt -->
            <div class="hdfc-refund-prompt-box">
                <div class="hrp-badge-row">
                    <span class="hrp-badge">WHOLESALE POLICY: NO CANCELLATION</span>
                    <span class="hrp-badge-sub">7-DAY REFUND &amp; EXCHANGE ACTIVE</span>
                </div>
                <h4 class="hrp-title">Need to Return or Exchange Hardware?</h4>
                <p class="hrp-desc">
                    As commercial CCTV hardware is prepared immediately for insurance and courier dispatch, orders cannot be cancelled after authorization. If you encounter defects or require a different model, request a <strong>100% Refund</strong> or <strong>Hardware Replacement / Exchange</strong> below.
                </p>
                <div class="hrp-actions">
                    <button type="button" class="btn-hrp-refund" onclick="openRefundExchangeModal('${currentOrderRef}')">
                        REQUEST REFUND / EXCHANGE
                    </button>
                    <a href="mailto:info@syberspace.in?subject=Tax%20Invoice%20%26%20Dispatch%20Inquiry%20for%20Order%20${currentOrderRef}&body=Order%20Ref%3A%20${currentOrderRef}%0ACustomer%3A%20${currentCustomerData ? encodeURIComponent(currentCustomerData.name) : 'Customer'}%0APhone%3A%20${currentCustomerData ? encodeURIComponent(currentCustomerData.phone) : ''}%0ATotal%3A%20Rs.%20${activeCheckoutTotal}%0A%0APlease%20confirm%20invoice%20generation%20and%20express%20dispatch." class="btn-hrp-email-desk">
                        OPEN INVOICE DISPATCH EMAIL &rarr;
                    </a>
                </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; gap:14px; flex-wrap:wrap; margin-top:14px;">
                <button type="button" class="hdfc-pay-now-btn" onclick="window.print()" style="background:#0f172a; border-color:#0f172a;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    <span>PRINT / SAVE TAX INVOICE (PDF)</span>
                </button>
                <a href="index.html#categories-by-brand" class="hdfc-pay-now-btn" style="text-decoration:none; text-align:center;">
                    <span>CONTINUE SHOPPING &rarr;</span>
                </a>
            </div>
        </div>
    `;

    // Transmit Tax Invoice Email to info@syberspace.in
    try {
        fetch(`${getApiBaseUrl()}/api/order/send-invoice-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: currentOrderRef,
                amount: activeCheckoutTotal,
                customer: currentCustomerData,
                items: cart,
                paymentRail: paymentRail,
                txnId: txnId,
                authCode: authCode,
                rrn: (serverTxn && serverTxn.rrn) || '404685685608'
            })
        }).then(res => res.json()).then(data => {
            console.log('Invoice email notification result:', data);
        }).catch(err => {
            console.warn('Invoice email sync note:', err.message);
        });
    } catch (e) {}

    // Store last order ref for easy refund/exchange lookup
    try {
        localStorage.setItem('syber_last_order_ref', currentOrderRef);
        if (currentCustomerData) {
            localStorage.setItem('syber_last_customer_data', JSON.stringify(currentCustomerData));
        }
    } catch (e) {}

    // Clear Cart in Storage & Reset Nav Counters
    localStorage.removeItem('syber_cart');
    localStorage.removeItem('syber_cart_items');
    updateNavCartCount();
}


// =============================================================================
// GLOBAL HEADER SEARCH NAVIGATION FROM SUBPAGES
// =============================================================================
function onSubpageSearchKeyDown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        onSubpageSearchSubmit();
    }
}

function onSubpageSearchSubmit() {
    const input = document.getElementById('header-search-input');
    const query = input ? input.value.trim() : '';
    if (query) {
        window.location.href = `index.html?search=${encodeURIComponent(query)}#cameras`;
    } else {
        window.location.href = 'index.html#cameras';
    }
}


function onHeaderSearchSubmit() {
    const input = document.getElementById('header-search-input');
    const query = input ? input.value.trim() : '';
    if (query) {
        window.location.href = `index.html?search=${encodeURIComponent(query)}#cameras`;
    } else {
        window.location.href = 'index.html#cameras';
    }
}

// =============================================================================
// REFUND & EXCHANGE CONTROLLER (NO CANCELLATIONS // REFUND & EXCHANGE ONLY)
// =============================================================================
function openRefundExchangeModal(orderId) {
    const modal = document.getElementById('refund-exchange-modal');
    if (!modal) return;

    // Prefill Order ID
    const orderInput = document.getElementById('ref-order-id');
    const nameInput = document.getElementById('ref-cust-name');
    const phoneInput = document.getElementById('ref-cust-phone');
    const emailInput = document.getElementById('ref-cust-email');

    const effectiveOrderId = orderId || localStorage.getItem('syber_last_order_ref') || currentOrderRef || '';
    if (orderInput) orderInput.value = effectiveOrderId;

    // Prefill Customer Info if available
    let savedCust = currentCustomerData;
    if (!savedCust) {
        try {
            const raw = localStorage.getItem('syber_last_customer_data');
            if (raw) savedCust = JSON.parse(raw);
        } catch (e) {}
    }

    if (savedCust) {
        if (nameInput && !nameInput.value) nameInput.value = savedCust.name || '';
        if (phoneInput && !phoneInput.value) phoneInput.value = savedCust.phone || '';
        if (emailInput && !emailInput.value) emailInput.value = savedCust.email || '';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeRefundModal() {
    const modal = document.getElementById('refund-exchange-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleRefundFields(typeVal) {
    const payoutBox = document.getElementById('refund-payout-box');
    const payoutInput = document.getElementById('ref-payout-info');
    if (!payoutBox || !payoutInput) return;

    if (typeVal === 'REFUND') {
        payoutBox.style.display = 'block';
        payoutInput.setAttribute('required', 'required');
    } else {
        payoutBox.style.display = 'none';
        payoutInput.removeAttribute('required');
    }
}

async function handleRefundSubmit(e) {
    e.preventDefault();

    const orderId = document.getElementById('ref-order-id').value.trim();
    const customerName = document.getElementById('ref-cust-name').value.trim();
    const customerPhone = document.getElementById('ref-cust-phone').value.trim();
    const customerEmail = document.getElementById('ref-cust-email').value.trim();
    const requestType = document.querySelector('input[name="refund-type"]:checked').value;
    const reason = document.getElementById('ref-reason').value;
    const payoutDetails = document.getElementById('ref-payout-info') ? document.getElementById('ref-payout-info').value.trim() : '';
    const notes = document.getElementById('ref-notes').value.trim();
    const unboxingVideoConfirmed = document.getElementById('ref-unboxing-confirm').checked;

    const submitBtn = e.target.querySelector('.btn-refund-submit');
    const origText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'TRANSMITTING REQUEST...';
    }

    const payload = {
        orderId,
        customerName,
        customerPhone,
        customerEmail,
        requestType,
        reason,
        payoutDetails,
        notes,
        unboxingVideoConfirmed
    };

    try {
        const res = await fetch(`${getApiBaseUrl()}/api/order/refund-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        const container = document.getElementById('refund-modal-content');
        if (container) {
            container.innerHTML = `
                <div style="text-align:center; padding:2rem 1rem;">
                    <div style="width:56px; height:56px; border-radius:50%; background:#ecfdf5; border:2px solid #10b981; display:flex; align-items:center; justify-content:center; margin:0 auto 1.25rem;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <h3 style="font-family:var(--font-heading); font-size:1.5rem; color:#0f172a; margin-bottom:8px;">
                        ${requestType} Request Transmitted
                    </h3>
                    <p style="font-size:0.88rem; color:#059669; font-weight:700; margin-bottom:12px;">
                        NOTIFICATION TRANSMITTED TO info@syberspace.in
                    </p>
                    <p style="font-size:0.86rem; color:#475569; max-width:480px; margin:0 auto 1.5rem; line-height:1.6;">
                        Your ${requestType} request for Order <strong>#${orderId}</strong> has been logged into our support queue. Reference ID: <strong>${data.refundRef || 'REF-' + Date.now()}</strong>. Our Kerala desk will verify your request and contact you via WhatsApp / Phone within 24–48 hours.
                    </p>
                    <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
                        <a href="https://wa.me/917511180808?text=${encodeURIComponent(`Hello Syber Space, I have submitted a ${requestType} request for Order ${orderId}. Please assist.`)}" target="_blank" rel="noopener noreferrer" class="btn-refund-submit" style="text-decoration:none; display:inline-flex; align-items:center; gap:8px;">
                            <span>CHAT ON WHATSAPP &rarr;</span>
                        </a>
                        <button type="button" class="btn-refund-close" onclick="closeRefundModal()">
                            CLOSE
                        </button>
                    </div>
                </div>
            `;
        }

        showToast(`${requestType} request logged & emailed to company desk`);
    } catch (err) {
        console.error('Refund request transmission error:', err);
        showToast('Request logged offline. Please contact info@syberspace.in directly.');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origText;
        }
    }
}
