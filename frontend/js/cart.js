'use strict';

const CART_API_URL = "http://127.0.0.1:8000/api/cart";


function getCart() {
    try {
        return JSON.parse(localStorage.getItem('cartNovaCart')) || [];
    } catch {
        return [];
    }
}


function saveCart(cart) {
    localStorage.setItem('cartNovaCart', JSON.stringify(cart));
    updateCartCount();
}


/* =========================
   LOAD CART FROM DJANGO
========================= */

async function loadCartFromBackend() {
    const token = typeof getAccessToken === 'function'
        ? getAccessToken()
        : null;

    if (!token) {
        return [];
    }

    try {
        const response = await authFetch(`${CART_API_URL}/`, {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error(`Cart API failed: ${response.status}`);
        }

        const data = await response.json();

        const cart = data.items.map(item => ({
            productId: Number(item.product_id),
            quantity: Number(item.quantity)
        }));

        saveCart(cart);

        return cart;

    } catch (error) {
        console.error("Failed to load cart:", error);
        return getCart();
    }
}


/* =========================
   ADD TO CART
========================= */

async function addToCart(productId, qty = 1) {

    const product = typeof getProductById === 'function'
        ? getProductById(productId)
        : null;

    if (!product) return;

    const token = typeof getAccessToken === 'function'
        ? getAccessToken()
        : null;

    if (!token) {
        if (typeof showToast === 'function') {
            showToast("Please login to add items to cart", "info");
        }

        window.location.href = "login.html";
        return;
    }

    try {

        const response = await authFetch(`${CART_API_URL}/add/`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                product_id: Number(productId),
                quantity: Number(qty)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Failed to add product to cart."
            );
        }

        await loadCartFromBackend();

        if (typeof showToast === 'function') {
            showToast(
                `${product.name} added to cart`,
                "success"
            );
        }

        if (document.getElementById('cartItems')) {
            renderCart();
        }

    } catch (error) {

        console.error("Add to cart error:", error);

        if (typeof showToast === 'function') {
            showToast(error.message, "error");
        }
    }
}


/* =========================
   REMOVE FROM CART
========================= */

async function removeFromCart(productId) {

    const token = typeof getAccessToken === 'function'
        ? getAccessToken()
        : null;

    if (!token) {
        return;
    }

    try {

        const response = await authFetch(
            `${CART_API_URL}/remove/${productId}/`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Failed to remove item."
            );
        }

        await loadCartFromBackend();

        if (typeof showToast === 'function') {
            showToast(
                "Item removed from cart",
                "success"
            );
        }

        if (document.getElementById('cartItems')) {
            renderCart();
        }

    } catch (error) {

        console.error("Remove cart item error:", error);

        if (typeof showToast === 'function') {
            showToast(error.message, "error");
        }
    }
}


/* =========================
   INCREASE QUANTITY
========================= */

async function increaseQuantity(productId) {
    const cart = getCart();
    const item = cart.find(item => Number(item.productId) === Number(productId));

    if (!item) return;

    await updateCartQuantity(productId, item.quantity + 1);
}

async function decreaseQuantity(productId) {
    const cart = getCart();
    const item = cart.find(item => Number(item.productId) === Number(productId));

    if (!item) return;

    if (item.quantity <= 1) {
        await removeFromCart(productId);
        return;
    }

    await updateCartQuantity(productId, item.quantity - 1);
}

async function updateCartQuantity(productId, quantity) {
    const token = getAccessToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await authFetch(
            `${CART_API_URL}/update/${productId}/`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    quantity: quantity
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            showToast(data.error || data.detail || "Unable to update cart", "error");
            return;
        }

        await loadCartFromBackend();
        renderCart();

        if (typeof lucide !== "undefined") {
            lucide.createIcons();
        }

    } catch (error) {
        console.error("Update cart error:", error);
        showToast("Something went wrong while updating cart", "error");
    }
}

/* =========================
   CLEAR CART
========================= */

async function clearCart() {

    const token = typeof getAccessToken === 'function'
        ? getAccessToken()
        : null;

    if (!token) {
        localStorage.removeItem('cartNovaCart');
        updateCartCount();
        return;
    }

    try {

        const response = await authFetch(
            `${CART_API_URL}/clear/`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Failed to clear cart.");
        }

        localStorage.removeItem('cartNovaCart');

        updateCartCount();

        if (document.getElementById('cartItems')) {
            renderCart();
        }

    } catch (error) {

        console.error("Clear cart error:", error);

        if (typeof showToast === 'function') {
            showToast(error.message, "error");
        }
    }
}


/* =========================
   CART COUNT
========================= */

function getCartCount() {
    return getCart().reduce(
        (sum, item) => sum + Number(item.quantity),
        0
    );
}


function updateCartCount() {

    const count = getCartCount();

    const badges = document.querySelectorAll('#cartCount');

    badges.forEach(badge => {

        badge.textContent = count;

        badge.style.display =
            count > 0 ? 'flex' : 'none';
    });
}


/* =========================
   TOTALS
========================= */

function calculateSubtotal() {

    return getCart().reduce((sum, item) => {

        const product =
            typeof getProductById === 'function'
                ? getProductById(item.productId)
                : null;

        return sum +
            (product
                ? Number(product.price) * Number(item.quantity)
                : 0);

    }, 0);
}


function calculateShipping(subtotal) {

    if (subtotal === 0) return 0;

    return subtotal >= 2000 ? 0 : 99;
}


function calculateDiscount(subtotal) {

    return subtotal >= 5000
        ? Math.round(subtotal * 0.1)
        : 0;
}


function calculateTotal() {

    const subtotal = calculateSubtotal();

    return subtotal +
        calculateShipping(subtotal) -
        calculateDiscount(subtotal);
}


/* =========================
   RENDER CART
========================= */

function renderCart() {

    const cartItems =
        document.getElementById('cartItems');

    const cartSummary =
        document.getElementById('cartSummary');

    const cartEmpty =
        document.getElementById('cartEmpty');

    if (!cartItems || !cartSummary || !cartEmpty) {
        return;
    }

    const cart = getCart();

    if (cart.length === 0) {

        cartEmpty.style.display = 'flex';
        cartItems.style.display = 'none';
        cartSummary.style.display = 'none';

        return;
    }

    cartEmpty.style.display = 'none';
    cartItems.style.display = 'block';
    cartSummary.style.display = 'block';

    let html = '';

    cart.forEach(item => {

        const product =
            typeof getProductById === 'function'
                ? getProductById(item.productId)
                : null;

        if (!product) return;

        html += `
            <div class="cart-item">

                <img
                    src="${product.images[0]}"
                    alt="${product.name}"
                    class="cart-item-image"
                    onerror="this.src='https://placehold.co/100x100/eee/999?text=No+Image'"
                >

                <div class="cart-item-details">

                    <a
                        href="product-details.html?id=${product.id}"
                        class="cart-item-name"
                    >
                        ${product.name}
                    </a>

                    <div class="cart-item-category">
                        ${product.category}
                    </div>

                    <div class="cart-item-price">
                        ${typeof formatPrice === 'function'
                ? formatPrice(product.price)
                : '₹' + product.price
            }
                    </div>

                </div>

                <div class="cart-item-quantity">

                    <button
                        class="btn-icon"
                        onclick="decreaseQuantity(${product.id})"
                        aria-label="Decrease quantity"
                    >
                        <i data-lucide="minus"></i>
                    </button>

                    <span>${item.quantity}</span>

                    <button
                        class="btn-icon"
                        onclick="increaseQuantity(${product.id})"
                        aria-label="Increase quantity"
                    >
                        <i data-lucide="plus"></i>
                    </button>

                </div>

                <div class="cart-item-total">
                    ${typeof formatPrice === 'function'
                ? formatPrice(
                    product.price * item.quantity
                )
                : '₹' +
                (product.price * item.quantity)
            }
                </div>

                <button
                    class="cart-item-remove btn-icon"
                    onclick="confirmRemoveFromCart(${product.id})"
                    aria-label="Remove item"
                >
                    <i data-lucide="trash-2"></i>
                </button>

            </div>
        `;
    });

    cartItems.innerHTML = html;

    const subtotal = calculateSubtotal();
    const shipping = calculateShipping(subtotal);
    const discount = calculateDiscount(subtotal);
    const total = calculateTotal();

    const format =
        typeof formatPrice === 'function'
            ? formatPrice
            : (v) => '₹' + v;

    document.getElementById(
        'subtotalAmount'
    ).textContent = format(subtotal);

    document.getElementById(
        'shippingAmount'
    ).textContent =
        shipping === 0
            ? 'Free'
            : format(shipping);

    document.getElementById(
        'discountAmount'
    ).textContent =
        discount > 0
            ? '-' + format(discount)
            : '₹0';

    document.getElementById(
        'totalAmount'
    ).textContent = format(total);

    if (window.lucide) {
        lucide.createIcons();
    }
}


/* =========================
   REMOVE CONFIRMATION
========================= */

window.confirmRemoveFromCart = function (productId) {

    if (typeof showModal === 'function') {

        showModal({
            title: 'Remove Item',

            message:
                'Are you sure you want to remove this item from your cart?',

            confirmText: 'Remove',

            type: 'danger',

            onConfirm: () =>
                removeFromCart(productId)
        });

    } else {

        if (confirm('Remove item from cart?')) {
            removeFromCart(productId);
        }
    }
};


/* =========================
   INIT CART PAGE
========================= */

async function initCartPage() {

    if (
        typeof isLoggedIn === 'function' &&
        !isLoggedIn()
    ) {
        if (typeof showToast === 'function') {
            showToast(
                'Please login to view your cart',
                'info'
            );
        }

        window.location.href = 'login.html';
        return;
    }

    // Load products from Django first
    if (typeof loadProducts === 'function') {
        await loadProducts();
    }

    // Then load the user's cart from Django
    await loadCartFromBackend();

    // Now product details are available
    renderCart();
}