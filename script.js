// ==========================================================================
// SYBER SPACE // JEST-STYLE LUXURY HEADER & CART ENGINE
// ==========================================================================

let CART_ITEMS = [];

document.addEventListener('DOMContentLoaded', () => {
    initCart();
    initJekoSearch();
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
