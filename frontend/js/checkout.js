'use strict';

const ORDERS_API_URL = "https://cartnova-backend-ae6c.onrender.com/api/orders";

// Guards against a double order: both the Place Order button's click
// handler and the delivery form's submit handler call handleOrderSubmit,
// so this flag (checked synchronously, before any await) makes sure the
// Django create-order API is only ever called once per click/press.
let isPlacingOrder = false;

// Escapes server/user-supplied text (product names, addresses, order IDs)
// before it is placed into innerHTML.
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function initCheckoutPage() {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        if (typeof showToast === 'function') showToast('Please login to checkout', 'info');
        window.location.href = 'login.html';
        return;
    }

    // Load products, then refresh the cart from Django (the source of
    // truth) rather than trusting whatever is cached in localStorage -
    // that cache can be stale (another device, or left over from a
    // previous account on this browser).
    if (typeof loadProducts === 'function') {
        await loadProducts();
    }

    if (typeof loadCartFromBackend === 'function') {
        await loadCartFromBackend();
    }

    const cart = typeof getCart === 'function' ? getCart() : [];
    if (cart.length === 0) {
        if (typeof showToast === 'function') showToast('Your cart is empty', 'warning');
        window.location.href = 'cart.html';
        return;
    }

    renderCheckoutSummary();

    // Pre-fill user data
    if (typeof getCurrentUser === 'function') {
        const user = getCurrentUser();
        if (user) {
            if (document.getElementById('checkoutName')) document.getElementById('checkoutName').value = user.name || '';
            if (document.getElementById('checkoutEmail')) document.getElementById('checkoutEmail').value = user.email || '';
            if (document.getElementById('checkoutPhone')) document.getElementById('checkoutPhone').value = user.phone || '';
        }
    }

    const handleOrderSubmit = async (e) => {
        if (e) e.preventDefault();

        if (isPlacingOrder) return;

        const validation = validateCheckoutForm();
        if (!validation.valid) {
            if (typeof showToast === 'function') showToast('Please fill all required fields correctly', 'error');
            return;
        }

        const formData = {
            name: document.getElementById('checkoutName').value.trim(),
            email: document.getElementById('checkoutEmail').value.trim(),
            phone: document.getElementById('checkoutPhone').value.trim(),
            address: document.getElementById('checkoutAddress').value.trim(),
            city: document.getElementById('checkoutCity').value.trim(),
            state: document.getElementById('checkoutState').value.trim(),
            pin: document.getElementById('checkoutPin').value.trim()
        };

        await createOrder(formData);
    };

    const placeOrderBtn = document.getElementById('placeOrderBtn');

    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', handleOrderSubmit);
    }
    const deliveryForm = document.getElementById('deliveryForm');
    if (deliveryForm) {
        deliveryForm.addEventListener('submit', handleOrderSubmit);
    }
}

function renderCheckoutSummary() {
    const checkoutItems = document.getElementById('checkoutItems');
    if (!checkoutItems) return;

    const cart = typeof getCart === 'function' ? getCart() : [];
    let html = '';

    cart.forEach(item => {
        const product = typeof getProductById === 'function' ? getProductById(item.productId) : null;
        if (!product) return;

        html += `
            <div class="checkout-item" style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                <div style="display:flex; gap:1rem;">
                    <img src="${product.images[0]}" alt="${product.name}" style="width:50px;height:50px;object-fit:cover;border-radius:var(--radius-sm);">
                    <div>
                        <div style="font-weight:500;">${product.name}</div>
                        <div style="color:var(--muted);font-size:0.875rem;">Qty: ${item.quantity}</div>
                    </div>
                </div>
                <div style="font-weight:500;">${typeof formatPrice === 'function' ? formatPrice(product.price * item.quantity) : '₹' + (product.price * item.quantity)}</div>
            </div>
        `;
    });

    checkoutItems.innerHTML = html;

    if (typeof calculateSubtotal === 'function') {
        const subtotal = calculateSubtotal();
        const shipping = calculateShipping(subtotal);
        const discount = calculateDiscount(subtotal);
        const total = calculateTotal();

        const format = typeof formatPrice === 'function' ? formatPrice : (v) => '₹' + v;

        if (document.getElementById('checkoutSubtotal')) document.getElementById('checkoutSubtotal').textContent = format(subtotal);
        if (document.getElementById('checkoutShipping')) document.getElementById('checkoutShipping').textContent = shipping === 0 ? 'Free' : format(shipping);
        if (document.getElementById('checkoutDiscount')) document.getElementById('checkoutDiscount').textContent = discount > 0 ? '-' + format(discount) : '₹0';
        if (document.getElementById('checkoutTotal')) document.getElementById('checkoutTotal').textContent = format(total);
    }
}

function validateCheckoutForm() {
    const errors = {};
    let valid = true;

    const fieldMapping = {
        checkoutName: 'nameError',
        checkoutEmail: 'emailError',
        checkoutPhone: 'phoneError',
        checkoutAddress: 'addressError',
        checkoutCity: 'cityError',
        checkoutState: 'stateError',
        checkoutPin: 'pinError'
    };

    // Clear all errors first
    Object.keys(fieldMapping).forEach(id => {
        const input = document.getElementById(id);
        if (input) input.classList.remove('error');
        const errEl = document.getElementById(fieldMapping[id]);
        if (errEl) {
            errEl.textContent = '';
            errEl.style.display = 'none';
        }
    });

    const requiredFields = ['checkoutName', 'checkoutEmail', 'checkoutPhone', 'checkoutAddress', 'checkoutCity', 'checkoutState', 'checkoutPin'];

    requiredFields.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !el.value.trim()) {
            valid = false;
            errors[id] = 'This field is required';
        }
    });

    const email = document.getElementById('checkoutEmail')?.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        valid = false;
        errors['checkoutEmail'] = 'Enter a valid email address';
    }

    const phone = document.getElementById('checkoutPhone')?.value.trim();
    if (phone && !/^\d{10}$/.test(phone)) {
        valid = false;
        errors['checkoutPhone'] = 'Enter a valid 10-digit phone number';
    }

    const pin = document.getElementById('checkoutPin')?.value.trim();
    if (pin && !/^\d{6}$/.test(pin)) {
        valid = false;
        errors['checkoutPin'] = 'Enter a valid 6-digit PIN code';
    }

    // Show errors in DOM
    Object.keys(errors).forEach(id => {
        const input = document.getElementById(id);
        if (input) input.classList.add('error');
        const errEl = document.getElementById(fieldMapping[id]);
        if (errEl) {
            errEl.textContent = errors[id];
            errEl.style.display = 'block';
        }
    });

    return { valid, errors };
}

async function createOrder(formData) {
    if (isPlacingOrder) return;
    isPlacingOrder = true;

    const placeOrderBtn = document.getElementById('placeOrderBtn');

    if (placeOrderBtn) {
        placeOrderBtn.disabled = true;
        placeOrderBtn.dataset.originalText = placeOrderBtn.innerHTML;
        placeOrderBtn.innerHTML = 'Placing Order...';
    }

    try {
        if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
            showToast('Please login again.', 'error');
            window.location.href = 'login.html';
            return;
        }

        const cart = getCart();

        if (!cart || cart.length === 0) {
            showToast('Your cart is empty.', 'warning');
            window.location.href = 'cart.html';
            return;
        }

        // Convert cart to Django API format
        const items = cart.map(item => ({
            product_id: Number(item.productId),
            quantity: Number(item.quantity)
        }));

        // Create shipping address
        const shippingAddress = [
            formData.name,
            formData.address,
            formData.city,
            formData.state,
            formData.pin,
            `Phone: ${formData.phone}`
        ].join(', ');

        // Send order to Django (exactly once - authFetch itself only
        // retries on an expired token, never on any other failure)
        const response = await authFetch(
            `${ORDERS_API_URL}/create/`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: items,
                    shipping_address: shippingAddress
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Order API error:', data);

            showToast(
                data.error || data.detail || 'Failed to place order.',
                'error'
            );

            return;
        }

        // The real order lives under data.order (id, order_id,
        // total_amount, ...) - NOT at the top level of the response.
        if (!data.order) {
            console.error("Invalid order response:", data);

            showToast(
                'Order may have been placed, but the confirmation could not be loaded. Please check your Orders page.',
                'error'
            );

            return;
        }

        const order = data.order;

        // Order created successfully server-side: now it's safe to clear
        // the cart (both in Django and the local cache/badge) and send the
        // user to their own confirmation page. This is a real navigation
        // to order-confirmed.html, not a div inside checkout.html, so the
        // confirmation can't be wiped out by checkout.html re-rendering.
        if (typeof clearCart === 'function') {
            await clearCart();
        }

        window.location.href =
            `order-confirmed.html?id=${encodeURIComponent(order.order_id)}`;

        return;

    } catch (error) {

        console.error('Create order error:', error);

        if (typeof showToast === 'function') {
            showToast(
                'Unable to place order. Please try again.',
                'error'
            );
        }

    } finally {

        isPlacingOrder = false;

        if (placeOrderBtn) {
            placeOrderBtn.disabled = false;

            if (placeOrderBtn.dataset.originalText) {
                placeOrderBtn.innerHTML =
                    placeOrderBtn.dataset.originalText;
            }
        }
    }
}

/* =========================
   ORDERS LIST PAGE (Django-backed)
========================= */

function renderOrdersLoading() {
    const ordersList = document.getElementById('ordersList');
    const ordersEmpty = document.getElementById('ordersEmpty');
    if (!ordersList || !ordersEmpty) return;

    ordersEmpty.style.display = 'none';
    ordersList.style.display = 'block';
    ordersList.innerHTML = `
        <div class="empty-state">
            <i data-lucide="loader-2" class="empty-state-icon" style="animation:spin 1s linear infinite;"></i>
            <h2 class="empty-state-title">Loading your orders...</h2>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

function renderOrdersError(message) {
    const ordersList = document.getElementById('ordersList');
    const ordersEmpty = document.getElementById('ordersEmpty');
    if (!ordersList || !ordersEmpty) return;

    ordersEmpty.style.display = 'none';
    ordersList.style.display = 'block';
    ordersList.innerHTML = `
        <div class="empty-state">
            <i data-lucide="wifi-off" class="empty-state-icon"></i>
            <h2 class="empty-state-title">Unable to load orders</h2>
            <p class="empty-state-text">${message || 'Please make sure the CartNova backend is running, then try again.'}</p>
            <button class="btn btn-primary empty-state-action" onclick="initOrdersPage()">Retry</button>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

async function initOrdersPage() {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const ordersList = document.getElementById('ordersList');
    const ordersEmpty = document.getElementById('ordersEmpty');
    if (!ordersList || !ordersEmpty) return;

    renderOrdersLoading();

    let orders;
    try {
        const response = await authFetch(`${ORDERS_API_URL}/`, { method: 'GET' });

        if (!response.ok) {
            throw new Error(`Orders API failed: ${response.status}`);
        }

        orders = await response.json();
    } catch (error) {
        console.error('Failed to load orders:', error);
        renderOrdersError();
        return;
    }

    if (!orders || orders.length === 0) {
        ordersList.style.display = 'none';
        ordersEmpty.style.display = 'flex';
        return;
    }

    ordersEmpty.style.display = 'none';
    ordersList.style.display = 'flex';
    ordersList.style.flexDirection = 'column';
    ordersList.style.gap = '1.5rem';

    let html = '';
    orders.forEach(order => {
        const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
        const statusLabel = order.status.charAt(0).toUpperCase() + order.status.slice(1);

        html += `
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <div class="order-id">Order #${escapeHtml(order.order_id)}</div>
                        <div class="order-date">Placed on ${dateStr}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:600;">${formatPrice(Number(order.total_amount))}</div>
                        <div class="order-date">${order.items.length} item(s)</div>
                    </div>
                </div>
                <div class="order-card-body">
                    <div class="order-items-preview" style="display:flex;gap:1rem;overflow-x:auto;">
                        ${order.items.map(item => `
                            <img src="${escapeHtml(item.product_image || 'https://placehold.co/60x60/eee/999?text=No+Image')}" alt="${escapeHtml(item.product_name)}" title="${escapeHtml(item.product_name)} x${item.quantity}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid var(--border);">
                        `).join('')}
                    </div>
                </div>
                <div class="order-card-footer">
                    <span class="status-badge ${order.status}">${statusLabel}</span>
                    <a href="order-details.html?id=${encodeURIComponent(order.order_id)}" class="btn btn-sm btn-secondary">View Details</a>
                </div>
            </div>
        `;
    });

    ordersList.innerHTML = html;
    if (window.lucide) lucide.createIcons();
}

/* =========================
   ORDER DETAIL PAGE (Django-backed)
========================= */

function renderOrderDetailLoading(content) {
    content.innerHTML = `
        <div class="empty-state">
            <i data-lucide="loader-2" class="empty-state-icon" style="animation:spin 1s linear infinite;"></i>
            <h2 class="empty-state-title">Loading order...</h2>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

function renderOrderDetailError(content, { title, message, showBackToOrders = true }) {
    content.innerHTML = `
        <div class="empty-state">
            <i data-lucide="alert-circle" class="empty-state-icon"></i>
            <h2 class="empty-state-title">${title}</h2>
            <p class="empty-state-text">${message}</p>
            ${showBackToOrders ? '<a href="orders.html" class="btn btn-primary empty-state-action">Back to Orders</a>' : ''}
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

async function initOrderDetailPage() {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const content = document.getElementById('orderDetailContent');
    if (!content) return;

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        renderOrderDetailError(content, {
            title: 'Order Not Found',
            message: 'No order ID was provided.'
        });
        return;
    }

    renderOrderDetailLoading(content);

    let response;
    try {
        response = await authFetch(`${ORDERS_API_URL}/${encodeURIComponent(orderId)}/`, { method: 'GET' });
    } catch (error) {
        console.error('Failed to load order:', error);
        renderOrderDetailError(content, {
            title: 'Unable to load order',
            message: 'Please make sure the CartNova backend is running, then try again.'
        });
        return;
    }

    if (response.status === 404) {
        renderOrderDetailError(content, {
            title: 'Order Not Found',
            message: 'The order you are looking for does not exist, or does not belong to your account.'
        });
        return;
    }

    if (!response.ok) {
        renderOrderDetailError(content, {
            title: 'Unable to load order',
            message: 'Something went wrong while loading this order. Please try again.'
        });
        return;
    }

    const order = await response.json();

    const breadcrumbOrder = document.getElementById('breadcrumbOrder');
    if (breadcrumbOrder) breadcrumbOrder.textContent = `Order #${order.order_id}`;

    const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Address was stored as one comma-joined string by checkout.js:
    // "name, address, city, state, pin, Phone: xxxxxxxxxx"
    const addressParts = order.shipping_address.split(',').map(p => p.trim());
    const [addrName, addrLine, addrCity, addrState, addrPin, addrPhone] = addressParts;

    let bodyHtml = '';

    if (order.status === 'cancelled') {
        bodyHtml += `
            <div class="empty-state" style="padding:2rem 20px;">
                <span class="status-badge cancelled" style="font-size:1rem;">Cancelled</span>
                <p class="empty-state-text" style="margin-top:1rem;">This order was cancelled.</p>
            </div>
        `;
    } else {
        const timelineStatuses = ['pending', 'processing', 'shipped', 'delivered'];
        let currIdx = timelineStatuses.indexOf(order.status);
        if (currIdx === -1) currIdx = 0;

        bodyHtml += '<div class="order-timeline"><div class="timeline-track"></div>';
        timelineStatuses.forEach((status, idx) => {
            let stepClass = 'upcoming';
            if (idx < currIdx) stepClass = 'completed';
            if (idx === currIdx) stepClass = 'current';

            bodyHtml += `
                <div class="timeline-step ${stepClass}">
                    <div class="timeline-dot">
                        ${idx < currIdx ? '<i data-lucide="check" style="width:16px;height:16px;"></i>' : (idx + 1)}
                    </div>
                    <div class="timeline-label">${status.charAt(0).toUpperCase() + status.slice(1)}</div>
                </div>
            `;
        });
        bodyHtml += '</div>';
    }

    const itemsHtml = order.items.map(item => `
        <div class="order-product-item">
            <img src="${escapeHtml(item.product_image || 'https://placehold.co/60x60/eee/999?text=No+Image')}" alt="${escapeHtml(item.product_name)}">
            <div style="flex:1;">
                <div style="font-weight:500;">${escapeHtml(item.product_name)}</div>
                <div style="color:var(--muted);font-size:0.875rem;">Qty: ${item.quantity} × ${formatPrice(Number(item.price))}</div>
            </div>
            <div style="font-weight:600;">${formatPrice(Number(item.price) * item.quantity)}</div>
        </div>
    `).join('');

    const subtotal = Number(order.subtotal);
    const shipping = Number(order.shipping);
    const discount = Number(order.discount);
    const total = Number(order.total_amount);

    content.innerHTML = `
        <div class="order-detail-header">
            <h2>Order #${escapeHtml(order.order_id)}</h2>
            <p style="color:var(--muted);">Placed on ${dateStr}</p>
        </div>

        ${bodyHtml}

        <div style="display:grid;grid-template-columns:1fr;gap:2rem;margin-top:2rem;">
            <div class="order-detail-section">
                <h3>Items Ordered</h3>
                <div class="order-products-list">
                    ${itemsHtml}
                </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:2rem;">
                <div class="order-address order-detail-section">
                    <h3>Delivery Address</h3>
                    <p><strong>${escapeHtml(addrName || 'Customer')}</strong></p>
                    <p>${escapeHtml(addrLine || '')}</p>
                    <p>${escapeHtml(addrCity || '')}${addrState ? ', ' + escapeHtml(addrState) : ''}${addrPin ? ' - ' + escapeHtml(addrPin) : ''}</p>
                    <p>${escapeHtml(addrPhone || '')}</p>
                </div>

                <div class="order-payment order-detail-section">
                    <h3>Order Summary</h3>
                    <div class="summary-row"><span class="label">Subtotal</span><span class="value">${formatPrice(subtotal)}</span></div>
                    <div class="summary-row"><span class="label">Shipping</span><span class="value">${shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
                    <div class="summary-row discount"><span class="label">Discount</span><span class="value">${discount > 0 ? '-' + formatPrice(discount) : '₹0'}</span></div>
                    <hr class="summary-divider">
                    <div class="summary-total"><span>Total</span><span>${formatPrice(total)}</span></div>

                    <h4 style="margin-top:1.5rem;margin-bottom:0.5rem;">Payment Method</h4>
                    <p style="color:var(--muted);">Cash on Delivery</p>
                </div>
            </div>
        </div>

        <div style="margin-top:2rem;">
            <a href="orders.html" class="btn btn-secondary"><i data-lucide="arrow-left"></i> Back to Orders</a>
        </div>
    `;

    if (window.lucide) lucide.createIcons();
}

/* =========================
   ORDER CONFIRMED PAGE (Django-backed)
   Reached only by a real navigation from checkout.js after a
   successful POST /api/orders/create/. Fetches the authoritative
   order from Django itself (rather than trusting the redirect URL
   alone), and never auto-redirects - the user leaves only by
   clicking View Order / Continue Shopping / Back to Orders, or via
   the browser's own Back button.
========================= */

function renderOrderConfirmedError(container, { title, message }) {
    container.innerHTML = `
        <div class="success-icon" style="background-color:var(--danger, #dc3545);">
            <i data-lucide="alert-circle"></i>
        </div>
        <h2 class="success-title">${title}</h2>
        <p class="success-text">${message}</p>
        <div class="success-actions">
            <a href="orders.html" class="btn btn-primary">View Orders</a>
            <a href="products.html" class="btn btn-secondary">Continue Shopping</a>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

async function initOrderConfirmedPage() {
    const container = document.getElementById('orderConfirmedContent');
    if (!container) return;

    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        renderOrderConfirmedError(container, {
            title: 'Unable to load order details',
            message: "We couldn't retrieve your order information."
        });
        return;
    }

    let response;
    try {
        response = await authFetch(
            `${ORDERS_API_URL}/${encodeURIComponent(orderId)}/`,
            { method: 'GET' }
        );
    } catch (error) {
        // authFetch already redirects to login on a hard session
        // expiry; this only catches network-level failures.
        console.error('Failed to load order:', error);
        renderOrderConfirmedError(container, {
            title: 'Unable to load order details',
            message: "We couldn't retrieve your order information."
        });
        return;
    }

    if (!response.ok) {
        console.error('Order confirmed fetch failed:', response.status);
        renderOrderConfirmedError(container, {
            title: 'Unable to load order details',
            message: "We couldn't retrieve your order information."
        });
        return;
    }

    const order = await response.json();

    const dateStr = order.created_at
        ? new Date(order.created_at).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
        : '';

    const statusLabel = order.status
        ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
        : '';

    container.innerHTML = `
        <div class="success-icon">
            <i data-lucide="check"></i>
        </div>
        <h2 class="success-title">Order Confirmed!</h2>
        <p class="success-text">Thank you for your purchase. Your order has been placed successfully and is now being processed.</p>
        <div class="success-details">
            <p><strong>Order ID:</strong> <span>${escapeHtml(order.order_id)}</span></p>
            <p><strong>Total:</strong> <span>${formatPrice(Number(order.total_amount) || 0)}</span></p>
            ${statusLabel ? `<p><strong>Status:</strong> <span class="status-badge ${escapeHtml(order.status)}">${escapeHtml(statusLabel)}</span></p>` : ''}
            ${dateStr ? `<p><strong>Placed on:</strong> <span>${dateStr}</span></p>` : ''}
        </div>
        <div class="success-actions">
            <a href="order-details.html?id=${encodeURIComponent(order.order_id)}" class="btn btn-primary">View Order</a>
            <a href="products.html" class="btn btn-secondary">Continue Shopping</a>
            <a href="orders.html" class="btn btn-secondary">Back to Orders</a>
        </div>
    `;

    if (window.lucide) lucide.createIcons();
}
