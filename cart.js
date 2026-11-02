// Shared Cart Logic using localStorage

function getCart() {
    const cart = localStorage.getItem('syberspace_cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('syberspace_cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    // Sum total quantity
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update all nav links that contain CART
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        if (link.innerText.includes('CART')) {
            link.innerText = `CART (${totalItems})`;
        }
    });
}

function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(item => item.name === product.name);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart(cart);
}

function removeFromCart(productName) {
    let cart = getCart();
    cart = cart.filter(item => item.name !== productName);
    saveCart(cart);
    renderCart(); // Re-render if on cart page
}

function updateQuantity(productName, delta) {
    let cart = getCart();
    const item = cart.find(i => i.name === productName);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.name !== productName);
        }
        saveCart(cart);
        renderCart();
    }
}

function renderCart() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryGst = document.getElementById('summary-gst');
    const summaryTotal = document.getElementById('summary-total');
    
    // If not on cart page, exit
    if (!cartItemsContainer) return;

    const cart = getCart();

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-msg">
                [ NO HARDWARE SELECTED ]<br><br>
                YOUR CART IS CURRENTLY EMPTY.
            </div>
        `;
        summarySubtotal.innerText = '₹0';
        summaryGst.innerText = '₹0';
        summaryTotal.innerText = '₹0';
        return;
    }

    // Render items
    cartItemsContainer.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        subtotal += (item.price * item.quantity);

        const itemHtml = `
            <div class="cart-item" style="display: flex; gap: 2rem; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.2); padding: 1rem; margin-bottom: 1rem; align-items: center;">
                <img src="${item.img}" style="width: 100px; height: 100px; object-fit: cover; border: 1px solid #333;" alt="${item.name}">
                <div style="flex: 1;">
                    <h3 style="font-family: var(--font-display); font-size: 1.2rem; margin-bottom: 0.5rem;">${item.name}</h3>
                    <p style="font-family: var(--font-mono); color: var(--accent); margin-bottom: 0.5rem;">₹${item.price.toLocaleString('en-IN')}</p>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                        <span style="font-size: 0.8rem; color: #888;">QTY:</span>
                        <button onclick="updateQuantity('${item.name}', -1)" style="background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.3); padding: 2px 8px; cursor: pointer; font-family: var(--font-mono); transition: 0.3s;" onmouseover="this.style.borderColor='var(--accent)'; this.style.color='var(--accent)';" onmouseout="this.style.borderColor='rgba(255,255,255,0.3)'; this.style.color='#fff';">-</button>
                        <span style="font-size: 0.9rem; color: #fff; font-family: var(--font-mono); width: 20px; text-align: center;">${item.quantity}</span>
                        <button onclick="updateQuantity('${item.name}', 1)" style="background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.3); padding: 2px 8px; cursor: pointer; font-family: var(--font-mono); transition: 0.3s;" onmouseover="this.style.borderColor='var(--accent)'; this.style.color='var(--accent)';" onmouseout="this.style.borderColor='rgba(255,255,255,0.3)'; this.style.color='#fff';">+</button>
                    </div>
                </div>
                <button onclick="removeFromCart('${item.name}')" style="background: transparent; border: 1px solid var(--accent-red); color: var(--accent-red); padding: 0.5rem 1rem; font-family: var(--font-mono); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='var(--accent-red)'; this.style.color='#000';" onmouseout="this.style.background='transparent'; this.style.color='var(--accent-red)';">[ REMOVE ]</button>
            </div>
        `;
        cartItemsContainer.innerHTML += itemHtml;
    });

    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;

    summarySubtotal.innerText = '₹' + subtotal.toLocaleString('en-IN');
    summaryGst.innerText = '₹' + gst.toLocaleString('en-IN');
    summaryTotal.innerText = '₹' + total.toLocaleString('en-IN');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    renderCart();

    // Attach event listeners to all Add To Cart buttons on index.html
    const addButtons = document.querySelectorAll('.add-cart');
    addButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const name = card.querySelector('h3').innerText;
            const price = parseFloat(card.getAttribute('data-price'));
            const img = card.querySelector('img').getAttribute('src');

            addToCart({ name, price, img });

            // Visual feedback
            const originalText = btn.innerText;
            btn.innerText = '[ ADDED TO CART ]';
            btn.style.background = 'var(--accent)';
            btn.style.color = '#000';
            
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = 'transparent';
                btn.style.color = 'var(--text-color)';
            }, 1000);
        });
    });
});