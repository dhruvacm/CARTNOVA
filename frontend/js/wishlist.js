'use strict';

function getWishlist() {
    try {
        return JSON.parse(localStorage.getItem('cartNovaWishlist')) || [];
    } catch {
        return [];
    }
}

function saveWishlist(wishlist) {
    localStorage.setItem('cartNovaWishlist', JSON.stringify(wishlist));
    updateWishlistCount();
}

function addToWishlist(productId) {
    const wishlist = getWishlist();
    if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        saveWishlist(wishlist);
    }
}

function removeFromWishlist(productId) {
    let wishlist = getWishlist();
    wishlist = wishlist.filter(id => id !== productId);
    saveWishlist(wishlist);
}

function isInWishlist(productId) {
    return getWishlist().includes(productId);
}

function toggleWishlist(productId) {
    if (isInWishlist(productId)) {
        removeFromWishlist(productId);
        if (typeof showToast === 'function') showToast('Removed from wishlist', 'info');
    } else {
        addToWishlist(productId);
        if (typeof showToast === 'function') showToast('Added to wishlist', 'success');
    }
    
    const active = isInWishlist(productId);
    document.querySelectorAll('.product-wishlist-btn').forEach(btn => {
        const card = btn.closest('.product-card');
        if (card && parseInt(card.dataset.productId) === productId) {
            btn.classList.toggle('active', active);
        }
    });
    const detailBtn = document.getElementById('addToWishlistBtn');
    if (detailBtn) {
        detailBtn.classList.toggle('active', active);
    }

    // Re-render if on wishlist page
    if (document.getElementById('wishlistGrid')) {
        renderWishlist();
    }
}

function getWishlistCount() {
    return getWishlist().length;
}

function updateWishlistCount() {
    const count = getWishlistCount();
    const badges = document.querySelectorAll('#wishlistCount');
    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

function renderWishlist() {
    const wishlistGrid = document.getElementById('wishlistGrid');
    const wishlistEmpty = document.getElementById('wishlistEmpty');
    
    if (!wishlistGrid || !wishlistEmpty) return;
    
    const wishlistIds = getWishlist();
    
    if (wishlistIds.length === 0) {
        wishlistEmpty.style.display = 'flex';
        wishlistGrid.style.display = 'none';
        return;
    }
    
    wishlistEmpty.style.display = 'none';
    wishlistGrid.style.display = 'grid';
    
    const wProducts = wishlistIds.map(id => typeof getProductById === 'function' ? getProductById(id) : null).filter(p => p !== null);
    
    if (typeof renderProducts === 'function') {
        renderProducts(wProducts, 'wishlistGrid');
    }
}

async function initWishlistPage() {
    // Products must be loaded from Django first, or getProductById() in
    // renderWishlist() has nothing to look up and the page renders empty
    // even when the wishlist itself has items in it.
    if (typeof loadProducts === 'function') {
        await loadProducts();
    }
    renderWishlist();
}
