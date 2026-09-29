'use strict';

window.showToast = function (message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconName = 'check-circle';
    if (type === 'error') iconName = 'x-circle';
    if (type === 'warning') iconName = 'alert-triangle';
    if (type === 'info') iconName = 'info';

    toast.innerHTML = `
        <div class="toast-content">
            <i data-lucide="${iconName}" class="toast-icon"></i>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" aria-label="Close" onclick="this.parentElement.remove()"><i data-lucide="x"></i></button>
    `;

    container.appendChild(toast);

    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300); // match transition duration
    }, 3000);
};

window.showModal = function (options) {
    const { title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, type = 'danger' } = options;
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    if (!overlay || !content) return;

    const btnClass = type === 'danger' ? 'btn-danger' : 'btn-primary';

    content.innerHTML = `
        <div class="modal-header">
            <h3 style="margin:0;font-size:1.25rem;">${title}</h3>
            <button onclick="closeModal()" style="background:none;border:none;cursor:pointer;"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body" style="padding:1.5rem;color:var(--muted);">
            <p style="margin:0;">${message}</p>
        </div>
        <div class="modal-footer" style="padding:1rem 1.5rem;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:1rem;">
            <button class="btn btn-secondary" onclick="closeModal()">${cancelText}</button>
            <button class="btn ${btnClass}" id="modalConfirmBtn">${confirmText}</button>
        </div>
    `;

    if (window.lucide) lucide.createIcons({ root: content });

    overlay.classList.add('active');

    const confirmBtn = document.getElementById('modalConfirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (typeof onConfirm === 'function') onConfirm();
            closeModal();
        });
    }
};

window.closeModal = function () {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
};

// Highlight active navigation link

function updateActiveNav() {
    const navLinks = document.querySelectorAll(".nav-link");

    const path = window.location.pathname;
    const hash = window.location.hash;

    navLinks.forEach(link => {
        link.classList.remove("active");

        const href = link.getAttribute("href");

        if (!href) return;

        // Categories
        if (href === "index.html#categories" && hash === "#categories") {
            link.classList.add("active");
        }

        // About
        else if (href === "index.html#about" && hash === "#about") {
            link.classList.add("active");
        }

        // Home
        else if (
            href === "index.html" &&
            !hash &&
            (path.endsWith("/") || path.endsWith("index.html"))
        ) {
            link.classList.add("active");
        }

        // Products
        else if (
            href === "products.html" &&
            path.endsWith("products.html") &&
            !hash
        ) {
            link.classList.add("active");
        }
    });
}

// Run when page loads
document.addEventListener("DOMContentLoaded", updateActiveNav);

// Run when URL hash changes
window.addEventListener("hashchange", updateActiveNav);
function initMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            const isActive = mobileMenu.classList.contains('active');
            hamburgerBtn.innerHTML = `<i data-lucide="${isActive ? 'x' : 'menu'}"></i>`;
            if (window.lucide) lucide.createIcons({ root: hamburgerBtn });
        });

        // Close on link click
        document.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                hamburgerBtn.innerHTML = '<i data-lucide="menu"></i>';
                if (window.lucide) lucide.createIcons({ root: hamburgerBtn });
            });
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target) && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                hamburgerBtn.innerHTML = '<i data-lucide="menu"></i>';
                if (window.lucide) lucide.createIcons({ root: hamburgerBtn });
            }
        });
    }
}

function initSearch() {
    const searchToggle = document.getElementById('searchToggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');
    const globalSearchForm = document.getElementById('globalSearchForm');
    const globalSearchInput = document.getElementById('globalSearchInput');

    if (searchToggle && searchOverlay) {
        searchToggle.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            setTimeout(() => {
                if (globalSearchInput) globalSearchInput.focus();
            }, 100);
        });
    }

    const closeSearch = () => {
        if (searchOverlay) searchOverlay.classList.remove('active');
    };

    if (searchClose) searchClose.addEventListener('click', closeSearch);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSearch();
            closeModal();
        }
    });

    if (globalSearchForm && globalSearchInput) {
        globalSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = globalSearchInput.value.trim();
            if (query) {
                window.location.href = `products.html?search=${encodeURIComponent(query)}`;
            }
        });
    }
}

async function initHomePage() {
    // Products must be loaded from Django before we can filter them -
    // without this await, `products` is still the empty array products.js
    // starts with, and Featured/New Arrivals silently render nothing.
    if (typeof loadProducts === 'function') {
        await loadProducts();
    }

    // Render featured products
    if (typeof renderProducts === 'function' && typeof products !== 'undefined') {
        const featured = products.filter(p => p.isFeatured).slice(0, 8);
        renderProducts(featured, 'featuredProducts');

        const newArr = products.filter(p => p.isNew).slice(0, 4);
        renderProducts(newArr, 'newArrivals');
    }

    // Newsletter
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('newsletterEmail');
            const successMsg = document.getElementById('newsletterSuccess');

            if (emailInput && emailInput.value && typeof validateEmail === 'function' && validateEmail(emailInput.value)) {
                successMsg.style.display = 'block';
                emailInput.value = '';
                if (typeof showToast === 'function') showToast('Subscribed to newsletter!', 'success');
            } else {
                if (typeof showToast === 'function') showToast('Please enter a valid email address', 'error');
            }
        });
    }

    // Intersection Observer for animations (simple fade in)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = 0;
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'all 0.6s ease-out';
        observer.observe(section);
    });
}

function initPage() {
    const path = window.location.pathname;

    if (path.endsWith('/') || path.endsWith('index.html')) {
        if (typeof initHomePage === 'function') initHomePage();
    } else if (path.includes('product-details.html')) {
        if (typeof initProductDetailPage === 'function') initProductDetailPage();
    } else if (path.includes('products.html')) {
        if (typeof initProductsPage === 'function') initProductsPage();
    } else if (path.includes('cart.html')) {
        if (typeof initCartPage === 'function') initCartPage();
    } else if (path.includes('wishlist.html')) {
        if (typeof initWishlistPage === 'function') initWishlistPage();
    } else if (path.includes('login.html')) {
        if (typeof initLoginPage === 'function') initLoginPage();
    } else if (path.includes('register.html')) {
        if (typeof initRegisterPage === 'function') initRegisterPage();
    } else if (path.includes('profile.html')) {
        if (typeof initProfilePage === 'function') initProfilePage();
    } else if (path.includes('checkout.html')) {
        if (typeof initCheckoutPage === 'function') initCheckoutPage();
    } else if (path.includes('order-details.html')) {
        if (typeof initOrderDetailPage === 'function') initOrderDetailPage();
    } else if (path.includes('order-confirmed.html')) {
        if (typeof initOrderConfirmedPage === 'function') initOrderConfirmedPage();
    } else if (path.includes('orders.html')) {
        if (typeof initOrdersPage === 'function') initOrdersPage();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initSearch();

    if (typeof updateCartCount === 'function') updateCartCount();
    if (typeof updateWishlistCount === 'function') updateWishlistCount();
    if (typeof updateAuthUI === 'function') updateAuthUI();
    loadCategories();
    initPage();

    updateActiveNav();

    if (window.lucide) {
        lucide.createIcons();
    }
});
// Global image error handling
document.addEventListener('error', function (e) {
    var elem = e.target;
    if (elem.tagName.toLowerCase() == 'img') {
        elem.src = 'https://placehold.co/400x400/eee/999?text=Image+Not+Found';
    }
}, true);

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            // Account for sticky navbar (72px)
            const yOffset = -80;
            const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    });
});
document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        // Close normal modal
        if (typeof window.closeModal === "function") {
            window.closeModal();
        }

        // Close mobile menu
        const mobileMenu =
            document.getElementById("mobileMenu");

        if (mobileMenu) {
            mobileMenu.classList.remove("active");
        }
    }

});
const categoryToggle = document.querySelector(".category-toggle");
const categoryDropdown = document.querySelector(".category-dropdown");

if (categoryToggle && categoryDropdown) {
    categoryToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        categoryDropdown.classList.toggle("show");
    });

    document.addEventListener("click", () => {
        categoryDropdown.classList.remove("show");
    });
}
async function loadCategories() {
    const categoriesGrid = document.getElementById("categoriesGrid");

    if (!categoriesGrid) return;

    try {
        const response = await fetch(
            "https://cartnova-backend-ae6c.onrender.com/api/categories/"
        );

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const categories = await response.json();

        const categoryIcons = {
            "Electronics": "smartphone",
            "Fashion": "shirt",
            "Shoes": "footprints",
            "Accessories": "watch",
            "Home & Living": "lamp",
            "Beauty": "sparkles"
        };

        categoriesGrid.innerHTML = categories.map(category => {
            const icon = categoryIcons[category.name] || "grid-3x3";

            return `
                <a href="products.html?category=${encodeURIComponent(category.name)}"
                   class="category-card">

                    <div class="category-icon">
                        <i data-lucide="${icon}"></i>
                    </div>

                    <h3 class="category-name">
                        ${category.name}
                    </h3>

                    <p class="category-count">
                        ${category.product_count} Products
                    </p>

                </a>
            `;
        }).join("");

        if (window.lucide) {
            lucide.createIcons();
        }

    } catch (error) {
        console.error("Failed to load categories:", error);

        categoriesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <h3 class="empty-state-title">
                    Unable to load categories
                </h3>
                <p class="empty-state-text">
                    Please make sure the CartNova backend is running.
                </p>
            </div>
        `;
    }
}