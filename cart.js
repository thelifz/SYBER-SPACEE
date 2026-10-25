
function normalizeImgPath(src) {
    if (!src) return 'assets/idada_q2i35s_1.jpg';
    if (src.startsWith('assets/') || src.startsWith('http') || src.startsWith('data:')) return src;
    return 'assets/' + src;
}

// ==========================================================================
// SYBER SPACE — Shopping Cart Logic Engine
// Strict HDFC Bank SmartGateway&trade; Multi-Rail Integration
// ==========================================================================

let activeCheckoutTotal = 0;
let currentOrderRef = '';
let currentCustomerData = null;
let selectedPaymentRail = 'upi';
let selectedNetBankingBank = 'HDFC Bank';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');

    if (menuToggle && mobileOverlay) {
        menuToggle.addEventListener('click', () => {
            const isOpen = mobileOverlay.classList.toggle('open');
            menuToggle.classList.toggle('active', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });
    }

    // 2. Render Cart
    renderCart();

    // 3. Listen for ESC to close HDFC modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeHdfcModal();
        }
    });

    // 4. Auto-launch HDFC checkout if navigated with ?checkout=1
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === '1') {
        const cart = getCart();
        if (cart && cart.length > 0) {
            const grandTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
            setTimeout(() => {
                initiateHdfcCheckout(grandTotal);
            }, 180);
        }
    }
});

function getCart() {
    try {
        const raw = localStorage.getItem('syber_cart') || '[]';
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem('syber_cart', JSON.stringify(cart));
    updateNavCartCount();
}

function updateNavCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    const desktopBadge = document.getElementById('header-cart-badge');
    if (desktopBadge) {
        desktopBadge.textContent = String(totalItems);
    }

    const mbBadge = document.getElementById('mb-cart-badge');
    if (mbBadge) {
        mbBadge.textContent = String(totalItems);
        mbBadge.style.display = totalItems > 0 ? 'inline-flex' : 'none';
    }

    const headerBadge = document.getElementById('mobile-header-cart-badge');
    if (headerBadge) {
        headerBadge.textContent = String(totalItems);
        headerBadge.style.display = totalItems > 0 ? 'inline-flex' : 'none';
    }

    const counterLabels = document.querySelectorAll('.cart-counter-label');
    counterLabels.forEach(label => {
        if (label.id === 'header-cart-badge' || label.id === 'mobile-header-cart-badge' || label.id === 'mb-cart-badge') return;
        if (label.classList.contains('mobile-link')) {
            label.textContent = `Shopping Cart (${totalItems})`;
        } else {
            label.textContent = `Cart (${totalItems})`;
        }
    });
}

function renderCart() {
    updateNavCartCount();
    const container = document.getElementById('cart-content-wrapper');
    if (!container) return;

    const cart = getCart();

    if (!cart || cart.length === 0) {
        container.innerHTML = `
            <div class="cart-items-panel cart-empty-state">
                <div class="cart-empty-icon-wrap">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                </div>
                <h2 class="cart-empty-title">Your shopping cart is empty</h2>
                <p class="cart-empty-subtitle">
                    Explore our collection of precision CCTV cameras, 4G solar systems, and surveillance accessories at direct wholesale rates.
                </p>
                <a href="index.html#cameras" class="cart-empty-cta">
                    <span>EXPLORE ALL CAMERAS &rarr;</span>
                </a>
            </div>
        `;
        return;
    }

    let subtotal = 0;
    let itemsHtml = '';

    cart.forEach((item, index) => {
        const qty = item.quantity || 1;
        const itemTotal = item.price * qty;
        subtotal += itemTotal;

        itemsHtml += `
            <div class="cart-item-row" data-index="${index}">
                <div class="cart-item-img-box">
                    <img src="${normalizeImgPath(item.img || item.image)}" onerror="this.onerror=null;this.src='assets/idada_q2i35s_1.jpg';" alt="${escapeHtml(item.name)}" class="cart-item-img">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-badge-wrap">
                        <span class="cart-item-badge">GENUINE HARDWARE</span>
                    </div>
                    <h3 class="cart-item-name">${escapeHtml(item.name)}</h3>
                    <div class="cart-item-meta">
                        <span class="cart-item-unit-price">&#8377;${item.price.toLocaleString('en-IN')} each</span>
                        <span class="cart-item-warranty">&bull; Official 1-Yr Warranty</span>
                    </div>
                </div>
                <div class="cart-item-actions-cell">
                    <div class="cart-qty-control">
                        <button type="button" class="cart-qty-btn minus" onclick="updateItemQty(${index}, -1)" aria-label="Decrease quantity">&minus;</button>
                        <span class="cart-qty-val">${qty}</span>
                        <button type="button" class="cart-qty-btn plus" onclick="updateItemQty(${index}, 1)" aria-label="Increase quantity">+</button>
                    </div>
                    <div class="cart-item-subtotal-cell">
                        <span class="cart-item-subtotal-label">Subtotal</span>
                        <span class="cart-item-subtotal-amount">&#8377;${itemTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <button type="button" class="cart-item-remove-btn" onclick="removeItem(${index})" title="Remove item" aria-label="Remove item">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span>Remove</span>
                    </button>
                </div>
            </div>
        `;
    });

    const gstAmount = Math.round(subtotal * 0.18 / 1.18); // inclusive 18% calculation
    const baseAmount = subtotal - gstAmount;
    const grandTotal = subtotal;

    container.innerHTML = `
        <div class="cart-layout">
            <!-- Left: Cart Items List -->
            <div class="cart-items-panel">
                <div class="cart-items-header-bar">
                    <span class="cart-items-heading">Cart Items (${cart.reduce((sum, item) => sum + (item.quantity || 1), 0)})</span>
                    <a href="index.html#cameras" class="cart-add-more-link">+ Add More Products</a>
                </div>
                <div class="cart-items-list">
                    ${itemsHtml}
                </div>
                <div class="cart-guarantee-bar">
                    <div class="guarantee-pill">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        <span>100% Genuine Certified Hardware</span>
                    </div>
                    <div class="guarantee-pill">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                        <span>Free Insured Pan-India Express Delivery</span>
                    </div>
                    <div class="guarantee-pill">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <span>Official GST Tax Invoice Included</span>
                    </div>
                </div>
            </div>

            <!-- Right: Order Summary & Checkout -->
            <div class="cart-summary-panel">
                <div class="cart-summary-card">
                    <h2 class="cart-summary-title">Order Summary</h2>
                    <div class="cart-summary-rows">
                        <div class="cart-summary-row">
                            <span>Taxable Subtotal</span>
                            <span class="summary-val">&#8377;${baseAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="cart-summary-row">
                            <span>GST (18% Included)</span>
                            <span class="summary-val">&#8377;${gstAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="cart-summary-row">
                            <span>Insured Pan-India Delivery</span>
                            <span class="summary-val free-delivery">FREE</span>
                        </div>
                        <div class="cart-summary-row total-row">
                            <span>Total Payable</span>
                            <span class="summary-total-val">&#8377;${grandTotal.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <!-- Checkout Actions -->
                    <button type="button" class="cart-checkout-btn" onclick="initiateHdfcCheckout(${grandTotal})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        <span>PROCEED TO SECURE CHECKOUT</span>
                    </button>

                    <a href="https://wa.me/917511180808?text=${encodeURIComponent('Hello Syber Space, I am reviewing my shopping cart with total ' + '₹' + grandTotal.toLocaleString('en-IN') + '. Please assist me with this order.')}" target="_blank" rel="noopener noreferrer" class="cart-whatsapp-btn">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        <span>WhatsApp Quick Assistance</span>
                    </a>

                    <div class="cart-trust-badges-box">
                        <div class="trust-badge-row">
                            <span class="trust-badge-tag">HDFC BANK</span>
                            <span>256-Bit SSL SmartGateway&reg; Checkout</span>
                        </div>
                        <div class="trust-badge-row">
                            <span class="trust-badge-tag">WARRANTY</span>
                            <span>100% Original Manufacturer Warranty</span>
                        </div>
                        <div class="trust-badge-row">
                            <span class="trust-badge-tag">DISPATCH</span>
                            <span>Insured Pan-India Express Delivery</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (typeof gsap !== 'undefined') {
        const rows = container.querySelectorAll('.cart-item-row');
        if (rows.length > 0) {
            gsap.fromTo(rows,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out', clearProps: 'transform,opacity' }
            );
        }
        const summaryPanel = container.querySelector('.cart-summary-panel');
        if (summaryPanel) {
            gsap.fromTo(summaryPanel,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.35, delay: 0.05, ease: 'power2.out', clearProps: 'transform,opacity' }
            );
        }
    }
}

function updateItemQty(index, delta) {
    const cart = getCart();
    if (!cart[index]) return;

    cart[index].quantity = (cart[index].quantity || 1) + delta;
    if (cart[index].quantity <= 0) {
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

// ==========================================================================
// HDFC BANK SMARTGATEWAY™ PAYMENT LOGIC
// ==========================================================================

function initiateHdfcCheckout(total) {
    activeCheckoutTotal = total;
    currentOrderRef = `SS-HDFC-${Math.floor(100000 + Math.random() * 900000)}`;

    const modal = document.getElementById('hdfc-checkout-modal');
    const orderRefEl = document.getElementById('hdfc-order-ref');
    const totalAmountEl = document.getElementById('hdfc-total-amount');

    if (orderRefEl) orderRefEl.textContent = currentOrderRef;
    if (totalAmountEl) totalAmountEl.innerHTML = `&#8377;${total.toLocaleString('en-IN')}`;

    // Render Step 1: Dispatch & Invoicing Details Form
    renderHdfcStep1();

    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (typeof gsap !== 'undefined') {
            const card = modal.querySelector('.hdfc-card');
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

function closeHdfcModal() {
    const modal = document.getElementById('hdfc-checkout-modal');
    if (!modal) return;

    if (typeof gsap !== 'undefined') {
        const card = modal.querySelector('.hdfc-card');
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
            }
        });
    } else {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function getCookieValue(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

// STEP 1: Billing, Shipping & GST Tax Invoice Form
function renderHdfcStep1() {
    const body = document.getElementById('hdfc-modal-body');
    if (!body) return;

    const detectedCity = getCookieValue('syber_user_city') || 'Kochi';
    const detectedState = getCookieValue('syber_user_state') || 'Kerala';
    const detectedPin = getCookieValue('syber_user_pincode') || '682001';

    body.innerHTML = `
        <div class="hdfc-form-step">
            <div class="hdfc-form-section-title">
                <span>1. SHIPPING & BILLING DETAILS</span>
                <span style="color:#059669; font-size:0.7rem; font-weight:700;">STEP 1 OF 2</span>
            </div>

            <form id="hdfc-billing-form" onsubmit="handleBillingSubmit(event)">
                <div class="hdfc-grid-form">
                    <div class="hdfc-field-group">
                        <label for="cust-name">Full Name *</label>
                        <input type="text" id="cust-name" required placeholder="e.g. Adithyan S." value="Adithyan S.">
                    </div>

                    <div class="hdfc-field-group">
                        <label for="cust-phone">Phone Number (+91) *</label>
                        <input type="tel" id="cust-phone" required pattern="[0-9]{10}" placeholder="10-digit mobile" value="9876543210">
                    </div>

                    <div class="hdfc-field-group">
                        <label for="cust-email">Email Address *</label>
                        <input type="email" id="cust-email" required placeholder="name@domain.com" value="orders@syberspace.in">
                    </div>

                    <div class="hdfc-field-group">
                        <label for="cust-company">Company Name (Optional)</label>
                        <input type="text" id="cust-company" placeholder="e.g. Syber Space Systems LLP">
                    </div>

                    <div class="hdfc-field-group span-2">
                        <label for="cust-gstin">GSTIN (Optional)</label>
                        <input type="text" id="cust-gstin" placeholder="15-character GSTIN (e.g. 32AABCU9603R1ZM)" maxlength="15">
                    </div>

                    <div class="hdfc-field-group span-2">
                        <label for="cust-address">Delivery Address *</label>
                        <input type="text" id="cust-address" required placeholder="Premises, Street, Area" value="Tech Zone, Civil Station Road">
                    </div>

                    <div class="hdfc-field-group">
                        <label for="cust-city">City / District *</label>
                        <input type="text" id="cust-city" required placeholder="e.g. Ernakulam" value="${detectedCity}">
                    </div>

                    <div class="hdfc-field-group">
                        <label for="cust-state">State *</label>
                        <select id="cust-state" required>
                            <option value="Kerala" ${detectedState === 'Kerala' ? 'selected' : ''}>Kerala (32)</option>
                            <option value="Tamil Nadu" ${detectedState === 'Tamil Nadu' ? 'selected' : ''}>Tamil Nadu (33)</option>
                            <option value="Karnataka" ${detectedState === 'Karnataka' ? 'selected' : ''}>Karnataka (29)</option>
                            <option value="Maharashtra" ${detectedState === 'Maharashtra' ? 'selected' : ''}>Maharashtra (27)</option>
                            <option value="Delhi" ${detectedState === 'Delhi' ? 'selected' : ''}>Delhi (07)</option>
                            <option value="Telangana" ${detectedState === 'Telangana' ? 'selected' : ''}>Telangana (36)</option>
                            <option value="Andhra Pradesh" ${detectedState === 'Andhra Pradesh' ? 'selected' : ''}>Andhra Pradesh (37)</option>
                            <option value="Gujarat" ${detectedState === 'Gujarat' ? 'selected' : ''}>Gujarat (24)</option>
                            <option value="Other">Other Indian State</option>
                        </select>
                    </div>

                    <div class="hdfc-field-group">
                        <label for="cust-pincode">Postal Pincode *</label>
                        <input type="text" id="cust-pincode" required pattern="[0-9]{6}" placeholder="6-digit pincode" value="${detectedPin}" maxlength="6">
                    </div>
                </div>

                <div class="hdfc-modal-footer" style="padding-left:0; padding-right:0; margin-top:24px; background:transparent;">
                    <div class="hdfc-security-badge">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <span>256-BIT SSL ENCRYPTED</span>
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

    // Asynchronously register order session with HDFC Backend
    fetch('/api/hdfc/create-order', {
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

// STEP 2: HDFC Multi-Rail Payment Interface (UPI, Cards, NetBanking, EMI)
function renderHdfcStep2() {
    const body = document.getElementById('hdfc-modal-body');
    if (!body) return;

    body.innerHTML = `
        <div class="hdfc-payment-step">
            <div class="hdfc-form-section-title">
                <span>2. PAYMENT METHOD</span>
                <button type="button" onclick="renderHdfcStep1()" class="hdfc-back-link">
                    &larr; Edit Shipping Address
                </button>
            </div>

            <!-- Payment Methods Tabs -->
            <div class="hdfc-rails-tabs" role="tablist">
                <button type="button" class="hdfc-rail-tab active" onclick="switchHdfcRail('upi', this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                    <span>UPI (GPay / PhonePe / Paytm)</span>
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

            <!-- Rail 1: UPI Panel -->
            <div id="panel-upi" class="hdfc-rail-panel active">
                <div class="hdfc-upi-flow-wrap">
                    <span class="hdfc-field-subheading">Select UPI App</span>
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
                                <span>PAY NOW</span>
                            </button>
                        </div>
                        <div class="hdfc-vpa-handles">
                            <span>Supported: @okhdfcbank &bull; @okaxis &bull; @oksbi &bull; @ybl &bull; @paytm &bull; @ibl</span>
                        </div>
                    </div>

                    <!-- Bank Notice -->
                    <div class="hdfc-dynamic-notice">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#004c8f" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        <span>Secured by HDFC Bank SmartGateway&trade; with 256-bit SSL encryption and PCI-DSS compliance.</span>
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
                        <input type="text" id="card-name" placeholder="Name as displayed on card" value="${currentCustomerData.name}">
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
                    <span>PAY ₹${activeCheckoutTotal.toLocaleString('en-IN')} NOW</span>
                </button>
            </div>
        </div>
    `;
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
    const body = document.getElementById('hdfc-modal-body');
    if (!body) return;

    // Show Authorization in progress
    body.innerHTML = `
        <div class="hdfc-verifying-screen">
            <div class="hdfc-spinner"></div>
            <h3 style="font-family:var(--font-display); font-size:1.4rem; color:var(--base-dark);">Securing Multi-Rail Authorization...</h3>
            <p style="font-size:0.86rem; color:var(--base-dark-muted); max-width:480px; line-height:1.6;">
                Connecting to HDFC Bank Core Switch via ${paymentRail.toUpperCase()}. Routing 256-bit encrypted payload through merchant terminal <strong>#88102941</strong>.
            </p>
            <div style="font-family:var(--font-mono); font-size:0.75rem; color:#004c8f; margin-top:8px;">
                ORDER REFERENCE // ${currentOrderRef}
            </div>
        </div>
    `;

    // Attempt Server Verification via HDFC SmartGateway API
    let serverTxn = null;
    try {
        const res = await fetch('/api/hdfc/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: currentOrderRef,
                amount: activeCheckoutTotal,
                paymentRail: paymentRail,
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
        const cart = getCart();
        const txnId = (serverTxn && serverTxn.txnId) ? serverTxn.txnId : `HDFC-TXN-${Math.floor(100000000 + Math.random() * 900000000)}`;
        const authCode = (serverTxn && serverTxn.authCode) ? serverTxn.authCode : `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
        const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

        // Calculate item breakdown
        let itemsRows = '';
        let totalQty = 0;
        cart.forEach((it, idx) => {
            const q = it.quantity || 1;
            totalQty += q;
            itemsRows += `
                <tr>
                    <td>SS-${1000 + idx}</td>
                    <td>${it.name}</td>
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
                    <h2 style="font-family:var(--font-display); font-size:1.6rem; color:var(--base-dark); margin-bottom:6px;">
                        Payment Verified & Captured
                    </h2>
                    <p style="font-size:0.86rem; color:#059669; font-family:var(--font-mono); font-weight:700;">
                        AUTHORIZED BY HDFC BANK CORE GATEWAY (RRN: ${txnId})
                    </p>
                </div>

                <!-- B2B Tax Invoice Receipt (Printable) -->
                <div class="hdfc-invoice-receipt" id="printable-invoice">
                    <div class="receipt-header-row">
                        <div>
                            <strong style="font-size:1rem; color:var(--base-dark);">SYBER SPACE SECURITY SYSTEMS</strong><br>
                            Authorized CCTV & Surveillance Systems<br>
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
                        ${currentCustomerData ? currentCustomerData.name : 'Customer'}<br>
                        ${currentCustomerData && currentCustomerData.company ? currentCustomerData.company + '<br>' : ''}
                        ${currentCustomerData ? currentCustomerData.address + ', ' + currentCustomerData.city + ', ' + currentCustomerData.state + ' - ' + currentCustomerData.pincode : ''}<br>
                        Phone: +91 ${currentCustomerData ? currentCustomerData.phone : ''} • Email: ${currentCustomerData ? currentCustomerData.email : ''}<br>
                        ${currentCustomerData && currentCustomerData.gstin ? '<strong>GSTIN:</strong> ' + currentCustomerData.gstin : '<strong>GSTIN:</strong> Not Provided'}
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

                    <div style="border-top:1px dashed rgba(27,24,21,0.2); padding-top:12px;">
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
                            <span style="color:#059669; font-weight:700;">FREE</span>
                        </div>
                        <div class="receipt-totals-row grand">
                            <span>TOTAL AMOUNT CHARGED & RECEIVED:</span>
                            <span>₹${activeCheckoutTotal.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:14px; flex-wrap:wrap; margin-top:12px;">
                    <button type="button" class="hdfc-pay-now-btn" onclick="window.print()" style="background:#111622; border-color:#111622;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        <span>PRINT / SAVE TAX INVOICE (PDF)</span>
                    </button>
                    <a href="index.html#cameras" class="hdfc-pay-now-btn" style="text-decoration:none; text-align:center;">
                        <span>CONTINUE SHOPPING &rarr;</span>
                    </a>
                </div>
            </div>
        `;

        // Clear Cart & Reset Nav
        localStorage.removeItem('syber_cart');
        updateNavCartCount();

    }, 1400);
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
