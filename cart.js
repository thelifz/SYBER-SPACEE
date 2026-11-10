// =============================================================================
// SYBER SPACE SURVEILLANCE & SECURITY SYSTEMS — UNIFIED ECOMMERCE ENGINE
// File: cart.js
// Standards: Zero external dependencies, pure vanilla JavaScript, persistent localStorage
// =============================================================================

(function (window, document) {
    'use strict';

    const CART_KEY = 'syber_cart';
    const CART_ITEMS_KEY = 'syber_cart_items';
    const FREE_SHIPPING_THRESHOLD = 1000;

    // -------------------------------------------------------------------------
    // 1. DATA ACCESS & STORAGE HELPERS
    // -------------------------------------------------------------------------
    function getStoredCart() {
        try {
            const raw = localStorage.getItem(CART_KEY) || localStorage.getItem(CART_ITEMS_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Failed to read cart from localStorage:', e);
            return [];
        }
    }

    function saveCart(items) {
        try {
            const safe = Array.isArray(items) ? items : [];
            const json = JSON.stringify(safe);
            localStorage.setItem(CART_KEY, json);
            localStorage.setItem(CART_ITEMS_KEY, json);
            updateAllCounters();
            renderDrawer();
            // Dispatch custom event for cross-component sync
            window.dispatchEvent(new CustomEvent('syberCartUpdated', { detail: { cart: safe } }));
        } catch (e) {
            console.error('Failed to save cart to localStorage:', e);
        }
    }

    function formatRupee(amount) {
        const num = Math.round(Number(amount) || 0);
        return '₹' + num.toLocaleString('en-IN');
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[m];
        });
    }

    function normalizeImage(src) {
        if (!src) return 'assets/official_bestseller_idada_q2i_transparent.png';
        if (src.startsWith('assets/') || src.startsWith('http') || src.startsWith('data:')) return src;
        return 'assets/' + src;
    }

    // -------------------------------------------------------------------------
    // 2. CORE CART ACTIONS
    // -------------------------------------------------------------------------
    function addToCart(product, qty) {
        const quantity = Math.max(1, parseInt(qty, 10) || 1);
        const cart = getStoredCart();
        const id = product.id || String(product.name || product.title || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const title = product.title || product.name || 'Surveillance Hardware';
        const price = Math.round(Number(product.price) || 0);
        const image = normalizeImage(product.image || product.img || (product.images && product.images[0]));
        const category = product.category || product.mainCategory || 'Security';
        const brand = product.brand || 'SYBER';

        const existing = cart.find(function (item) {
            return item.id === id || item.name === title;
        });

        if (existing) {
            existing.quantity = (existing.quantity || 1) + quantity;
        } else {
            cart.push({
                id: id,
                name: title,
                title: title,
                price: price,
                mrp: product.mrp || formatRupee(price * 1.4),
                image: image,
                category: category,
                brand: brand,
                quantity: quantity
            });
        }

        saveCart(cart);
        showToast('Added ' + title + ' to cart', 'success');
        openDrawer();
    }

    function removeFromCart(idOrName) {
        let cart = getStoredCart();
        const target = String(idOrName || '').toLowerCase().trim();
        cart = cart.filter(function (item) {
            const itemId = String(item.id || '').toLowerCase().trim();
            const itemName = String(item.name || item.title || '').toLowerCase().trim();
            return itemId !== target && itemName !== target;
        });
        saveCart(cart);
        showToast('Item removed from cart', 'info');
    }

    function updateQuantity(idOrName, delta) {
        const cart = getStoredCart();
        const target = String(idOrName || '').toLowerCase().trim();
        const item = cart.find(function (i) {
            const itemId = String(i.id || '').toLowerCase().trim();
            const itemName = String(i.name || i.title || '').toLowerCase().trim();
            return itemId !== target && itemName !== target;
        });

        if (item) {
            item.quantity = (item.quantity || 1) + delta;
            if (item.quantity <= 0) {
                removeFromCart(idOrName);
                return;
            }
            saveCart(cart);
        }
    }

    function clearCart() {
        saveCart([]);
    }

    function getCartCount() {
        const cart = getStoredCart();
        return cart.reduce(function (sum, item) {
            return sum + (item.quantity || 1);
        }, 0);
    }

    function getCartSubtotal() {
        const cart = getStoredCart();
        return cart.reduce(function (sum, item) {
            return sum + ((item.price || 0) * (item.quantity || 1));
        }, 0);
    }

    // -------------------------------------------------------------------------
    // 3. COUNTER & BADGE SYNCHRONIZATION
    // -------------------------------------------------------------------------
    function updateAllCounters() {
        const count = getCartCount();
        const countStr = String(count);

        // Header tool badge dot
        const badgeDots = document.querySelectorAll('.cart-badge-dot, #cartBadgeCount, #cart-counter, .cart-counter, .cart-pill-badge');
        badgeDots.forEach(function (el) {
            el.textContent = countStr;
            el.style.display = count > 0 ? 'flex' : 'none';
        });

        // Any nav links containing CART (X)
        const navLinks = document.querySelectorAll('.nav-links a, .header-tool-btn[aria-label="Shopping Cart"] span');
        navLinks.forEach(function (link) {
            if (link.innerText && link.innerText.includes('CART')) {
                link.innerText = 'CART (' + countStr + ')';
            }
        });
    }

    // -------------------------------------------------------------------------
    // 4. SLIDE-IN CART DRAWER (YELLOW, BLACK & WHITE STADIUM THEME)
    // -------------------------------------------------------------------------
    function ensureDrawerDOMElements() {
        if (document.getElementById('cart-drawer')) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'syber-cart-drawer-styles';
        styleEl.textContent = `
            /* SLIDE-IN CART DRAWER STYLES */
            #cart-drawer-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.55);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                z-index: 99998;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }

            #cart-drawer-overlay.active {
                opacity: 1;
                visibility: visible;
            }

            #cart-drawer {
                position: fixed;
                top: 0;
                right: 0;
                width: 440px;
                max-width: 95vw;
                height: 100vh;
                background: #ffffff;
                box-shadow: -10px 0 35px rgba(0, 0, 0, 0.2);
                z-index: 99999;
                transform: translateX(100%);
                transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                display: flex;
                flex-direction: column;
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            #cart-drawer.active {
                transform: translateX(0);
            }

            .drawer-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 18px 24px;
                background: #000000;
                color: #ffffff;
            }

            .drawer-title-group {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .drawer-title {
                font-size: 16px;
                font-weight: 900;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                margin: 0;
            }

            .drawer-badge {
                background: #ffe500;
                color: #000000;
                font-size: 11px;
                font-weight: 900;
                padding: 2px 8px;
                border-radius: 9999px;
            }

            .drawer-close-btn {
                background: transparent;
                border: none;
                color: #ffffff;
                cursor: pointer;
                padding: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s ease, transform 0.2s ease;
            }

            .drawer-close-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                transform: rotate(90deg);
            }

            /* Free Shipping Progress */
            .drawer-shipping-bar {
                background: #fffbeb;
                border-bottom: 1px solid #fef3c7;
                padding: 12px 24px;
            }

            .drawer-shipping-label {
                font-size: 12px;
                font-weight: 700;
                color: #92400e;
                display: flex;
                justify-content: space-between;
                margin-bottom: 6px;
            }

            .drawer-shipping-track {
                width: 100%;
                height: 6px;
                background: #fde68a;
                border-radius: 9999px;
                overflow: hidden;
            }

            .drawer-shipping-fill {
                height: 100%;
                background: #059669;
                transition: width 0.3s ease;
            }

            /* Cart Items Scroll Area */
            .drawer-body {
                flex: 1;
                overflow-y: auto;
                padding: 16px 24px;
            }

            .drawer-empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                height: 100%;
                padding: 40px 20px;
            }

            .drawer-empty-icon {
                width: 64px;
                height: 64px;
                color: #a1a1aa;
                margin-bottom: 16px;
            }

            .drawer-empty-title {
                font-size: 18px;
                font-weight: 800;
                color: #000000;
                margin-bottom: 8px;
            }

            .drawer-empty-desc {
                font-size: 13px;
                color: #71717a;
                margin-bottom: 24px;
                line-height: 1.45;
            }

            .drawer-shop-btn {
                background: #ffe500;
                color: #000000;
                font-size: 13px;
                font-weight: 900;
                padding: 12px 24px;
                border-radius: 9999px;
                text-decoration: none;
                transition: all 0.2s ease;
                border: 2px solid #000000;
            }

            .drawer-shop-btn:hover {
                background: #000000;
                color: #ffffff;
            }

            .drawer-item-row {
                display: flex;
                gap: 14px;
                padding: 14px 0;
                border-bottom: 1px solid #f4f4f5;
                align-items: center;
            }

            .drawer-item-img {
                width: 68px;
                height: 68px;
                object-fit: contain;
                background: #f8fafc;
                border: 1px solid #e4e4e7;
                border-radius: 10px;
                padding: 4px;
                flex-shrink: 0;
            }

            .drawer-item-details {
                flex: 1;
                min-width: 0;
            }

            .drawer-item-brand {
                font-size: 10px;
                font-weight: 800;
                letter-spacing: 0.5px;
                color: #71717a;
                text-transform: uppercase;
                margin-bottom: 2px;
            }

            .drawer-item-title {
                font-size: 13px;
                font-weight: 700;
                color: #000000;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: 6px;
            }

            .drawer-item-price-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .drawer-item-price {
                font-size: 14px;
                font-weight: 900;
                color: #000000;
            }

            .drawer-qty-stepper {
                display: inline-flex;
                align-items: center;
                border: 1.5px solid #e4e4e7;
                border-radius: 9999px;
                overflow: hidden;
                background: #ffffff;
            }

            .drawer-qty-btn {
                background: transparent;
                border: none;
                width: 26px;
                height: 26px;
                font-size: 14px;
                font-weight: 800;
                color: #000000;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
            }

            .drawer-qty-btn:hover {
                background: #f4f4f5;
            }

            .drawer-qty-val {
                width: 24px;
                text-align: center;
                font-size: 12px;
                font-weight: 800;
                color: #000000;
            }

            .drawer-item-del-btn {
                background: transparent;
                border: none;
                color: #a1a1aa;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.2s ease;
            }

            .drawer-item-del-btn:hover {
                color: #dc2626;
            }

            /* Drawer Footer */
            .drawer-footer {
                padding: 18px 24px 24px;
                background: #ffffff;
                border-top: 1px solid #e4e4e7;
                box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.04);
            }

            .drawer-subtotal-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 4px;
            }

            .drawer-subtotal-label {
                font-size: 14px;
                font-weight: 700;
                color: #52525b;
            }

            .drawer-subtotal-val {
                font-size: 20px;
                font-weight: 900;
                color: #000000;
            }

            .drawer-tax-note {
                font-size: 11px;
                color: #71717a;
                margin-bottom: 16px;
            }

            .drawer-actions-col {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .drawer-btn-checkout {
                width: 100%;
                padding: 14px 20px;
                background: #ffe500;
                color: #000000;
                border: 2px solid #000000;
                border-radius: 9999px;
                font-size: 14px;
                font-weight: 900;
                text-align: center;
                text-decoration: none;
                letter-spacing: 0.3px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .drawer-btn-whatsapp {
            width: 100%;
            padding: 13px 20px;
            background: transparent;
            color: #000000;
            border: 1.5px solid #000000;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            cursor: pointer;
            margin-top: 8px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: inherit;
        }
        .drawer-btn-whatsapp:hover {
            background: #000000;
            color: #ffe500;
        }
        .drawer-btn-checkout:hover {
                background: #000000;
                color: #ffffff;
            }

            .drawer-btn-view-cart {
                width: 100%;
                padding: 10px 20px;
                background: #f4f4f5;
                color: #000000;
                border: 1px solid #e4e4e7;
                border-radius: 9999px;
                font-size: 12.5px;
                font-weight: 800;
                text-align: center;
                text-decoration: none;
                transition: all 0.2s ease;
            }

            .drawer-btn-view-cart:hover {
                background: #e4e4e7;
            }

            /* LIVE SEARCH AUTOCOMPLETE DROPDOWN */
            .header-search-results-dropdown {
                position: absolute;
                top: calc(100% + 8px);
                left: 0;
                right: 0;
                background: #ffffff;
                border: 1.5px solid #000000;
                border-radius: 16px;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
                max-height: 480px;
                overflow-y: auto;
                z-index: 100000;
                display: none;
            }

            .search-results-header {
                padding: 10px 16px;
                background: #f4f4f5;
                border-bottom: 1px solid #e4e4e7;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.8px;
                text-transform: uppercase;
                color: #71717a;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .search-result-item {
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 12px 16px;
                border-bottom: 1px solid #f4f4f5;
                text-decoration: none;
                color: inherit;
                transition: background 0.15s ease;
            }

            .search-result-item:hover, .search-result-item.highlighted {
                background: #fffbeb;
            }

            .search-result-thumb {
                width: 44px;
                height: 44px;
                object-fit: contain;
                background: #ffffff;
                border: 1px solid #e4e4e7;
                border-radius: 8px;
                padding: 2px;
                flex-shrink: 0;
            }

            .search-result-info {
                flex: 1;
                min-width: 0;
            }

            .search-result-brand {
                font-size: 10px;
                font-weight: 800;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                color: #71717a;
            }

            .search-result-title {
                font-size: 13px;
                font-weight: 700;
                color: #000000;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .search-result-price {
                font-size: 13px;
                font-weight: 900;
                color: #000000;
                flex-shrink: 0;
            }

            .search-results-footer {
                padding: 12px 16px;
                background: #fafafa;
                text-align: center;
                border-top: 1px solid #e4e4e7;
            }

            .search-results-footer a {
                font-size: 12px;
                font-weight: 800;
                color: #000000;
                text-decoration: none;
            }

            .search-results-footer a:hover {
                text-decoration: underline;
            }

            /* TOAST NOTIFICATIONS */
            #syber-toast-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 100001;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            }

            .syber-toast {
                pointer-events: auto;
                background: #000000;
                color: #ffffff;
                border: 1.5px solid #ffe500;
                border-radius: 12px;
                padding: 12px 18px;
                font-size: 13px;
                font-weight: 700;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
                display: flex;
                align-items: center;
                gap: 10px;
                animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .toast-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #ffe500;
            }

            @keyframes toastSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(styleEl);

        // Overlay
        const overlay = document.createElement('div');
        overlay.id = 'cart-drawer-overlay';
        overlay.onclick = closeDrawer;
        document.body.appendChild(overlay);

        // Drawer
        const drawer = document.createElement('div');
        drawer.id = 'cart-drawer';
        drawer.innerHTML = `
            <div class="drawer-header">
                <div class="drawer-title-group">
                    <h3 class="drawer-title">Shopping Cart</h3>
                    <span class="drawer-badge" id="drawerCartBadge">0</span>
                </div>
                <button type="button" class="drawer-close-btn" onclick="window.syberCart.closeDrawer()" aria-label="Close Cart">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="drawer-shipping-bar" id="drawerShippingBar">
                <div class="drawer-shipping-label">
                    <span id="drawerShippingText">Add items for FREE Delivery</span>
                    <span id="drawerShippingStatus">₹0 / ₹1,000</span>
                </div>
                <div class="drawer-shipping-track">
                    <div class="drawer-shipping-fill" id="drawerShippingFill" style="width: 0%;"></div>
                </div>
            </div>
            <div class="drawer-body" id="drawerItemsBody"></div>
            <div class="drawer-footer" id="drawerFooter">
                <div class="drawer-subtotal-row">
                    <span class="drawer-subtotal-label">Subtotal:</span>
                    <span class="drawer-subtotal-val" id="drawerSubtotalVal">₹0</span>
                </div>
                <div class="drawer-tax-note">Includes all GST &amp; commercial logistics.</div>
                <div class="drawer-actions-col">
                    <a href="checkout.html" class="drawer-btn-checkout" id="drawerCheckoutBtn">
                        <span>PROCEED TO CHECKOUT</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </a>
                    <a href="cart.html" class="drawer-btn-view-cart">VIEW FULL CART DETAILS</a>
                </div>
            </div>
        `;
        document.body.appendChild(drawer);

        // Toast container
        const toastContainer = document.createElement('div');
        toastContainer.id = 'syber-toast-container';
        document.body.appendChild(toastContainer);
    }

    function renderDrawer() {
        const bodyEl = document.getElementById('drawerItemsBody');
        const badgeEl = document.getElementById('drawerCartBadge');
        const subtotalEl = document.getElementById('drawerSubtotalVal');
        const footerEl = document.getElementById('drawerFooter');
        const shippingBar = document.getElementById('drawerShippingBar');
        const shippingText = document.getElementById('drawerShippingText');
        const shippingStatus = document.getElementById('drawerShippingStatus');
        const shippingFill = document.getElementById('drawerShippingFill');

        if (!bodyEl) return;

        const cart = getStoredCart();
        const count = getCartCount();
        const subtotal = getCartSubtotal();

        if (badgeEl) badgeEl.textContent = String(count);
        if (subtotalEl) subtotalEl.textContent = formatRupee(subtotal);

        // Free shipping progress
        if (shippingBar) {
            if (subtotal >= FREE_SHIPPING_THRESHOLD) {
                if (shippingText) shippingText.textContent = 'You qualified for FREE Express Delivery!';
                if (shippingStatus) shippingStatus.textContent = 'UNLOCKED';
                if (shippingFill) {
                    shippingFill.style.width = '100%';
                    shippingFill.style.background = '#059669';
                }
            } else {
                const diff = FREE_SHIPPING_THRESHOLD - subtotal;
                const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
                if (shippingText) shippingText.textContent = 'Add ' + formatRupee(diff) + ' more for FREE Express Delivery';
                if (shippingStatus) shippingStatus.textContent = pct + '%';
                if (shippingFill) {
                    shippingFill.style.width = pct + '%';
                    shippingFill.style.background = '#eab308';
                }
            }
        }

        if (cart.length === 0) {
            bodyEl.innerHTML = `
                <div class="drawer-empty-state">
                    <svg class="drawer-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <h4 class="drawer-empty-title">Your Cart is Empty</h4>
                    <p class="drawer-empty-desc">Explore our commercial security cameras, recorders, and accessories at wholesale outlet prices.</p>
                    <a href="category.html?cat=all" class="drawer-shop-btn" onclick="window.syberCart.closeDrawer()">EXPLORE CATALOG</a>
                </div>
            `;
            if (footerEl) footerEl.style.display = 'none';
            return;
        }

        if (footerEl) footerEl.style.display = 'block';

        bodyEl.innerHTML = cart.map(function (item) {
            const itemPrice = Math.round(Number(item.price) || 0);
            const lineTotal = itemPrice * (item.quantity || 1);
            const img = normalizeImage(item.image);
            const safeId = escapeHtml(item.id || item.name);
            const safeTitle = escapeHtml(item.name || item.title);
            const safeBrand = escapeHtml(item.brand || 'SYBER');

            return `
                <div class="drawer-item-row" data-id="${safeId}">
                    <img src="${img}" alt="${safeTitle}" class="drawer-item-img" onerror="this.src='assets/official_bestseller_idada_q2i_transparent.png'">
                    <div class="drawer-item-details">
                        <div class="drawer-item-brand">${safeBrand}</div>
                        <div class="drawer-item-title" title="${safeTitle}">${safeTitle}</div>
                        <div class="drawer-item-price-row">
                            <div class="drawer-item-price">${formatRupee(lineTotal)}</div>
                            <div class="drawer-qty-stepper">
                                <button type="button" class="drawer-qty-btn" onclick="window.syberCart.update('${safeId}', -1)" aria-label="Decrease quantity">-</button>
                                <span class="drawer-qty-val">${item.quantity || 1}</span>
                                <button type="button" class="drawer-qty-btn" onclick="window.syberCart.update('${safeId}', 1)" aria-label="Increase quantity">+</button>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="drawer-item-del-btn" onclick="window.syberCart.remove('${safeId}')" aria-label="Remove item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
    }

    function openDrawer() {
        ensureDrawerDOMElements();
        renderDrawer();
        const overlay = document.getElementById('cart-drawer-overlay');
        const drawer = document.getElementById('cart-drawer');
        if (overlay) overlay.classList.add('active');
        if (drawer) drawer.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        const overlay = document.getElementById('cart-drawer-overlay');
        const drawer = document.getElementById('cart-drawer');
        if (overlay) overlay.classList.remove('active');
        if (drawer) drawer.classList.remove('active');
        document.body.style.overflow = '';
    }

    // -------------------------------------------------------------------------
    // 5. TOAST NOTIFICATIONS
    // -------------------------------------------------------------------------
    function showToast(message, type) {
        ensureDrawerDOMElements();
        const container = document.getElementById('syber-toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'syber-toast';
        toast.innerHTML = `
            <span class="toast-dot"></span>
            <span>${escapeHtml(message)}</span>
        `;
        container.appendChild(toast);

        setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(15px)';
            toast.style.transition = 'all 0.25s ease';
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 250);
        }, 2500);
    }

    // -------------------------------------------------------------------------
    // 6. LIVE INSTANT SEARCH AUTOCOMPLETE
    // -------------------------------------------------------------------------
    function initInstantSearch() {
        const searchInputs = document.querySelectorAll('.stadium-search-input, #jeko-search-input, #header-search-input');
        if (!searchInputs || searchInputs.length === 0) return;

        searchInputs.forEach(function (input) {
            const parent = input.closest('.stadium-search-wrap') || input.parentElement;
            if (!parent) return;

            // Ensure relative positioning
            parent.style.position = 'relative';

            // Create dropdown container
            let dropdown = parent.querySelector('.header-search-results-dropdown');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.className = 'header-search-results-dropdown';
                parent.appendChild(dropdown);
            }

            let debounceTimer = null;

            input.addEventListener('input', function () {
                clearTimeout(debounceTimer);
                const query = input.value.trim().toLowerCase();

                if (query.length < 2) {
                    dropdown.style.display = 'none';
                    return;
                }

                debounceTimer = setTimeout(function () {
                    renderSearchResults(query, dropdown);
                }, 140);
            });

            input.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    dropdown.style.display = 'none';
                } else if (e.key === 'Enter') {
                    const query = input.value.trim();
                    if (query) {
                        e.preventDefault();
                        window.location.href = 'category.html?q=' + encodeURIComponent(query);
                    }
                }
            });

            // Close on click outside
            document.addEventListener('click', function (e) {
                if (!parent.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
        });
    }

    function renderSearchResults(query, dropdown) {
        // Source products from global SYBER_PRODUCTS
        const products = (typeof SYBER_PRODUCTS !== 'undefined' && Array.isArray(SYBER_PRODUCTS)) ? SYBER_PRODUCTS : [];
        if (products.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        const terms = query.split(/\s+/).filter(Boolean);
        const matches = products.filter(function (p) {
            const text = (
                (p.title || '') + ' ' +
                (p.brand || '') + ' ' +
                (p.category || '') + ' ' +
                (p.mainCategory || '') + ' ' +
                (p.desc || '') + ' ' +
                (p.chips ? p.chips.join(' ') : '')
            ).toLowerCase();

            return terms.every(function (t) { return text.includes(t); });
        }).slice(0, 6);

        if (matches.length === 0) {
            dropdown.innerHTML = `
                <div class="search-results-header">
                    <span>Search Results</span>
                    <span>0 Matches</span>
                </div>
                <div style="padding: 24px; text-align: center; color: #71717a; font-size: 13px;">
                    No hardware found matching "<strong>${escapeHtml(query)}</strong>".
                </div>
                <div class="search-results-footer">
                    <a href="category.html?cat=all">Browse all 142 catalog products &rarr;</a>
                </div>
            `;
            dropdown.style.display = 'block';
            return;
        }

        dropdown.innerHTML = `
            <div class="search-results-header">
                <span>Matching Products</span>
                <span>${matches.length} Results</span>
            </div>
            ${matches.map(function (m) {
                const img = normalizeImage((m.images && m.images[0]) || m.image);
                const title = escapeHtml(m.title);
                const brand = escapeHtml(m.brand || 'SYBER');
                const price = formatRupee(m.price);
                return `
                    <a href="product.html?id=${encodeURIComponent(m.id)}" class="search-result-item">
                        <img src="${img}" alt="${title}" class="search-result-thumb" onerror="this.src='assets/official_bestseller_idada_q2i_transparent.png'">
                        <div class="search-result-info">
                            <div class="search-result-brand">${brand}</div>
                            <div class="search-result-title">${title}</div>
                        </div>
                        <div class="search-result-price">${price}</div>
                    </a>
                `;
            }).join('')}
            <div class="search-results-footer">
                <a href="category.html?q=${encodeURIComponent(query)}">See all results for "<strong>${escapeHtml(query)}</strong>" &rarr;</a>
            </div>
        `;
        dropdown.style.display = 'block';
    }

    // -------------------------------------------------------------------------
    // 7. INITIALIZATION ON DOM READY
    // -------------------------------------------------------------------------
    function init() {
        ensureDrawerDOMElements();
        updateAllCounters();
        initInstantSearch();

        // Bind click on header cart buttons to open slide-in drawer
        const cartTriggers = document.querySelectorAll('.header-tool-btn[aria-label="Shopping Cart"], .btn-cart-trigger');
        cartTriggers.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                // If not already on cart.html or checkout.html, open the slide drawer
                const path = window.location.pathname.toLowerCase();
                if (!path.endsWith('cart.html') && !path.endsWith('checkout.html')) {
                    e.preventDefault();
                    openDrawer();
                }
            });
        });

        // Close drawer on ESC
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeDrawer();
            }
        });

        // Listen for storage events from other tabs
        window.addEventListener('storage', function (e) {
            if (e.key === CART_KEY || e.key === CART_ITEMS_KEY) {
                updateAllCounters();
                renderDrawer();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export to global window scope
    window.syberCart = {
        getCart: getStoredCart,
        saveCart: saveCart,
        add: addToCart,
        addToCart: addToCart,
        remove: removeFromCart,
        removeFromCart: removeFromCart,
        update: updateQuantity,
        updateQuantity: updateQuantity,
        clear: clearCart,
        clearCart: clearCart,
        count: getCartCount,
        getCartCount: getCartCount,
        subtotal: getCartSubtotal,
        getCartSubtotal: getCartSubtotal,
        formatRupee: formatRupee,
        openDrawer: openDrawer,
        closeDrawer: closeDrawer,
        renderDrawer: renderDrawer,
        showToast: showToast
    };

})(window, document);

window.sendCartToWhatsApp = function() {
    try {
        const cart = (window.syberCart && window.syberCart.items) ? window.syberCart.items : (JSON.parse(localStorage.getItem('syber_cart')) || []);
        if (!cart || cart.length === 0) {
            alert('Your cart is currently empty. Add products first to generate a WhatsApp quote.');
            return;
        }
        let lines = ['Hi Syber Space, please confirm stock and B2B pricing for:'];
        let subtotal = 0;
        cart.forEach(function(item) {
            const qty = item.quantity || 1;
            const cost = (item.price || 0) * qty;
            subtotal += cost;
            lines.push('- ' + qty + 'x ' + (item.title || item.name) + ' (₹' + cost.toLocaleString('en-IN') + ')');
        });
        lines.push('');
        lines.push('Estimated Order Value: ₹' + subtotal.toLocaleString('en-IN') + ' (incl. 18% GST)');
        lines.push('Please confirm dispatch time and GST invoice details.');
        const msg = encodeURIComponent(lines.join('\n'));
        window.open('https://wa.me/917511180808?text=' + msg, '_blank');
    } catch(e) {
        console.error('WhatsApp RFQ Error:', e);
        window.open('https://wa.me/917511180808', '_blank');
    }
};
