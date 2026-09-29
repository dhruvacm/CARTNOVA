'use strict';

let products = [];

const PRODUCTS_API_URL = "http://127.0.0.1:8000/api/products/";

async function loadProducts() {
    try {
        const response = await fetch(PRODUCTS_API_URL);

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        products = data.map(product => ({
            id: Number(product.id),
            name: product.name,
            category: product.category?.name || "",
            description: product.description || "",
            price: Number(product.price),
            oldPrice: product.old_price ? Number(product.old_price) : null,
            discount: Number(product.discount) || 0,
            rating: Number(product.rating) || 0,
            reviews: Number(product.reviews) || 0,
            stock: Number(product.stock) || 0,
            brand: product.brand || "",
            color: product.color || "",
            images: Array.isArray(product.images)
                ? product.images
                : [],
            specifications: product.specifications || {},
            isFeatured: Boolean(product.is_featured),
            isNew: Boolean(product.is_new)
        }));

        console.log("CartNova products loaded from Django:", products);

        return products;

    } catch (error) {
        console.error("Failed to load products:", error);

        products = [];

        const productsGrid = document.getElementById("productsGrid");

        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i data-lucide="wifi-off"
                       class="empty-state-icon"
                       style="width:64px;height:64px;margin-bottom:1rem;color:var(--muted);">
                    </i>

                    <h3 class="empty-state-title">
                        Unable to load products
                    </h3>

                    <p class="empty-state-text">
                        Please make sure the CartNova Django backend is running.
                    </p>
                </div>
            `;
        }

        if (window.lucide) {
            lucide.createIcons();
        }

        return [];
    }
}

const mockReviews = [
    { name: "Rahul S.", rating: 5, date: "2 days ago", text: "Excellent product! Exceeded my expectations. The quality is top-notch." },
    { name: "Priya M.", rating: 4, date: "1 week ago", text: "Very good value for money. Would definitely recommend to others." },
    { name: "Amit K.", rating: 5, date: "2 weeks ago", text: "Fast delivery and the product looks exactly like the pictures." },
    { name: "Sneha P.", rating: 4, date: "1 month ago", text: "Good quality, but packaging could have been a bit better. Overall satisfied." },
    { name: "Vikram R.", rating: 5, date: "2 months ago", text: "Been using this for a while now and I have absolutely no complaints." }
];

function getProductById(id) {
    return products.find(p => p.id === parseInt(id)) || null;
}

function formatPrice(amount) {
    return "₹" + amount.toLocaleString("en-IN");
}

function renderStars(rating) {
    let html = "";
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            html += '<i data-lucide="star" class="star filled"></i>';
        } else if (i === fullStars && hasHalf) {
            html += '<i data-lucide="star" class="star filled"></i>';
        } else {
            html += '<i data-lucide="star" class="star"></i>';
        }
    }
    return html;
}

function renderProductCard(product) {
    const isWished = typeof window.isInWishlist === "function" && window.isInWishlist(product.id) ? "active" : "";
    let badgeHtml = "";
    if (product.isNew) {
        badgeHtml = '<span class="product-badge new">NEW</span>';
    } else if (product.discount > 0) {
        badgeHtml = '<span class="product-badge">-' + product.discount + '%</span>';
    }

    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image-wrapper">
                <img src="${product.images[0]}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://placehold.co/400x400/eee/999?text=Image+Not+Found'">
                <button class="product-wishlist-btn ${isWished}" onclick="toggleWishlist(${product.id})" aria-label="Add to wishlist">
                    <i data-lucide="heart"></i>
                </button>
                ${badgeHtml}
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <a href="product-details.html?id=${product.id}" class="product-name">${product.name}</a>
                <div class="product-rating">
                    ${renderStars(product.rating)}
                    <span>(${product.reviews})</span>
                </div>
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.oldPrice ? `<span class="original-price">${formatPrice(product.oldPrice)}</span>` : ""}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary btn-block add-to-cart-btn" onclick="addToCart(${product.id})">Add to Cart</button>
                </div>
            </div>
        </div>
    `;
}

function renderProducts(productList, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (productList.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i data-lucide="package-x" class="empty-state-icon" style="width:64px;height:64px;margin-bottom:1rem;color:var(--muted);"></i>
                <h3 class="empty-state-title">No products found</h3>
                <p class="empty-state-text">Try adjusting your filters or search query.</p>
            </div>
        `;
    } else {
        container.innerHTML = productList.map(p => renderProductCard(p)).join("");
    }
    if (window.lucide) {
        lucide.createIcons();
    }
}

function searchProducts(query, productList) {
    if (!query) return productList;
    const lowerQuery = query.toLowerCase();
    return productList.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
    );
}

function filterProducts(productList, filters) {
    return productList.filter(p => {
        if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(p.category)) return false;
        if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
        if (filters.minRating !== undefined && p.rating < filters.minRating) return false;
        if (filters.inStock && p.stock <= 0) return false;
        return true;
    });
}

function sortProducts(productList, sortBy) {
    const arr = [...productList];
    switch (sortBy) {
        case "popular":
            return arr.sort((a, b) => b.reviews - a.reviews);
        case "newest":
            return arr.sort((a, b) => (a.isNew === b.isNew) ? 0 : a.isNew ? -1 : 1);
        case "price-asc":
            return arr.sort((a, b) => a.price - b.price);
        case "price-desc":
            return arr.sort((a, b) => b.price - a.price);
        case "rating":
            return arr.sort((a, b) => b.rating - a.rating);
        default:
            return arr;
    }
}

let currentProducts = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 8;

async function initProductsPage() {
    await loadProducts();

    if (products.length === 0) return;

    currentProducts = [...products];
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get("category");
    const searchParam = urlParams.get("search");

    // Set up categories dynamically
    const categories = [...new Set(products.map(p => p.category))];
    const categoryFilters = document.getElementById("categoryFilters");
    if (categoryFilters) {
        categoryFilters.innerHTML = categories.map(cat => `
            <div class="filter-option">
                <input type="checkbox" class="filter-checkbox category-filter" id="cat-${cat}" value="${cat}" ${categoryParam === cat ? "checked" : ""}>
                <label class="filter-label" for="cat-${cat}">${cat}</label>
            </div>
        `).join("");
    }

    const searchInput = document.getElementById("productSearch");
    if (searchInput && searchParam) {
        searchInput.value = searchParam;
    }

    function applyFiltersAndSort() {
        let filtered = [...products];

        // Search
        if (searchInput) {
            filtered = searchProducts(searchInput.value, filtered);
        }

        // Filters
        const activeCategories = Array.from(document.querySelectorAll(".category-filter:checked")).map(cb => cb.value);
        const minPrice = parseFloat(document.getElementById("priceMin")?.value) || 0;
        const maxPrice = parseFloat(document.getElementById("priceMax")?.value) || Infinity;
        const activeRating = document.querySelector(".rating-filter:checked")?.value || 0;
        const inStock = document.getElementById("stockFilter")?.checked || false;

        filtered = filterProducts(filtered, {
            categories: activeCategories,
            minPrice: minPrice,
            maxPrice: maxPrice,
            minRating: parseFloat(activeRating),
            inStock: inStock
        });

        // Sort
        const sortBy = document.getElementById("sortSelect")?.value || "popular";
        filtered = sortProducts(filtered, sortBy);

        currentProducts = filtered;
        currentPage = 1;
        updateProductsView();
    }

    function updateProductsView() {
        const productsCount = document.getElementById("productsCount");
        if (productsCount) productsCount.textContent = `${currentProducts.length} products found`;

        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginated = currentProducts.slice(start, start + ITEMS_PER_PAGE);
        renderProducts(paginated, "productsGrid");
        renderPagination();
    }

    function renderPagination() {
        const pagination = document.getElementById("pagination");
        if (!pagination) return;

        const totalPages = Math.ceil(currentProducts.length / ITEMS_PER_PAGE);
        if (totalPages <= 1) {
            pagination.innerHTML = "";
            return;
        }

        let html = `<button class="page-btn" ${currentPage === 1 ? "disabled" : ""} onclick="window.changePage(${currentPage - 1})"><i data-lucide="chevron-left"></i></button>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${currentPage === i ? "active" : ""}" onclick="window.changePage(${i})">${i}</button>`;
        }
        html += `<button class="page-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="window.changePage(${currentPage + 1})"><i data-lucide="chevron-right"></i></button>`;

        pagination.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    }

    window.changePage = function (page) {
        currentPage = page;
        updateProductsView();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Event Listeners
    document.getElementById("priceApply")?.addEventListener("click", () => {

        applyFiltersAndSort();

        filterSidebar?.classList.remove("active");
        filterOverlay?.classList.remove("active");

    });
    document.querySelectorAll(".category-filter, .rating-filter, #stockFilter").forEach(el => {
        el.addEventListener("change", applyFiltersAndSort);
    });
    document.getElementById("sortSelect")?.addEventListener("change", applyFiltersAndSort);
    document.getElementById("clearFilters")?.addEventListener("click", () => {

        // Clear category filters
        document
            .querySelectorAll(".category-filter")
            .forEach(cb => cb.checked = false);

        // Reset rating
        const allRatings = document.querySelector(
            '.rating-filter[value="0"]'
        );

        if (allRatings) {
            allRatings.checked = true;
        }

        // Clear stock filter
        const stockFilter = document.getElementById("stockFilter");

        if (stockFilter) {
            stockFilter.checked = false;
        }

        // Clear price
        const priceMin = document.getElementById("priceMin");
        const priceMax = document.getElementById("priceMax");

        if (priceMin) priceMin.value = "";
        if (priceMax) priceMax.value = "";

        // Clear search
        if (searchInput) {
            searchInput.value = "";
        }

        // Reset sorting
        const sortSelect = document.getElementById("sortSelect");

        if (sortSelect) {
            sortSelect.value = "popular";
        }

        // Clear URL parameters
        const url = new URL(window.location.href);
        url.search = "";

        window.history.replaceState(
            {},
            document.title,
            url.toString()
        );

        // Close mobile filter
        filterSidebar?.classList.remove("active");
        filterOverlay?.classList.remove("active");

        // Apply reset
        applyFiltersAndSort();

    });

    let debounceTimer;
    searchInput?.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            applyFiltersAndSort();
        }, 300);
    });

    // Mobile filter
    const filterSidebar = document.getElementById("filterSidebar");
    const filterOverlay = document.getElementById("filterOverlay");

    document.getElementById("mobileFilterBtn")?.addEventListener("click", () => {
        filterSidebar?.classList.add("active");
        filterOverlay?.classList.add("active");
    });
    // =========================================
    // MOBILE SORT
    // =========================================

    const mobileSortBtn = document.getElementById("mobileSortBtn");
    const sortModalOverlay = document.getElementById("sortModalOverlay");
    const sortModalClose = document.getElementById("sortModalClose");
    const mobileSortOptions = document.querySelectorAll('input[name="mobileSort"]');

    function openSortModal() {
        if (!sortModalOverlay) return;

        const currentSort =
            document.getElementById("sortSelect")?.value || "popular";

        mobileSortOptions.forEach(option => {
            option.checked = option.value === currentSort;
        });

        sortModalOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeSortModal() {
        if (!sortModalOverlay) return;

        sortModalOverlay.classList.remove("active");
        document.body.style.overflow = "";
    }

    mobileSortBtn?.addEventListener("click", openSortModal);

    sortModalClose?.addEventListener("click", closeSortModal);

    sortModalOverlay?.addEventListener("click", (event) => {
        if (event.target === sortModalOverlay) {
            closeSortModal();
        }
    });

    mobileSortOptions.forEach(option => {
        option.addEventListener("change", () => {

            const desktopSort = document.getElementById("sortSelect");

            if (desktopSort) {
                desktopSort.value = option.value;

                // Trigger existing sorting logic
                desktopSort.dispatchEvent(new Event("change"));
            }

            closeSortModal();
        });
    });

    filterOverlay?.addEventListener("click", () => {
        filterSidebar?.classList.remove("active");
        filterOverlay?.classList.remove("active");
    });

    // Initial load
    applyFiltersAndSort();
}

async function initProductDetailPage() {
    await loadProducts();

    if (products.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    const product = getProductById(productId);

    if (!product) {
        const container = document.getElementById("productDetail");
        if (container) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 4rem 0;">
                    <i data-lucide="package-x" class="empty-state-icon" style="width:64px;height:64px;margin-bottom:1rem;color:var(--muted);"></i>
                    <h2 class="empty-state-title">Product Not Found</h2>
                    <p class="empty-state-text">The product you're looking for doesn't exist or has been removed.</p>
                    <a href="products.html" class="btn btn-primary" style="margin-top:1rem;">Back to Products</a>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
        return;
    }

    // Update Breadcrumb
    const breadcrumbProduct =
        document.getElementById("breadcrumbProduct");

    if (breadcrumbProduct) {
        breadcrumbProduct.textContent = product.name;
    }

    // Gallery
    const galleryMain = document.getElementById("galleryMain");
    const galleryThumbs = document.getElementById("galleryThumbs");
    if (galleryMain) {
        galleryMain.innerHTML = `<img src="${product.images[0]}" alt="${product.name}" id="mainImage" onerror="this.src='https://placehold.co/600x600/eee/999?text=Image+Not+Found'">`;
    }
    if (galleryThumbs) {
        galleryThumbs.innerHTML = product.images.map((img, i) => `
            <div class="gallery-thumb ${i === 0 ? "active" : ""}" onclick="window.changeMainImage('${img}', this)">
                <img src="${img}" alt="${product.name} thumbnail" onerror="this.src='https://placehold.co/100x100/eee/999?text=Thumb'">
            </div>
        `).join("");
    }

    window.changeMainImage = function (src, thumbEl) {
        const mainImg = document.getElementById("mainImage");
        if (mainImg) mainImg.src = src;
        document.querySelectorAll(".gallery-thumb").forEach(el => el.classList.remove("active"));
        thumbEl.classList.add("active");
    };

    // Info
    const detailCat = document.querySelector(".detail-category") || document.getElementById("detailCategory");
    if (detailCat) detailCat.textContent = product.category;

    const detailName = document.querySelector(".detail-name") || document.getElementById("detailName");
    if (detailName) detailName.textContent = product.name;

    const detailRating = document.querySelector(".detail-rating") || document.getElementById("detailRating");
    if (detailRating) {
        detailRating.innerHTML = `${renderStars(product.rating)} <span class="rating-number" style="font-weight:600;margin-left:6px;">${product.rating}</span> <span class="detail-reviews-count" style="color:var(--muted);font-size:0.9rem;margin-left:4px;">(${product.reviews} reviews)</span>`;
    }

    const detailPrice = document.querySelector(".detail-price") || document.getElementById("detailPrice");
    if (detailPrice) {
        const discountHtml = product.discount > 0 ? `<span class="detail-discount">${product.discount}% OFF</span>` : "";
        const oldPriceHtml = product.oldPrice ? `<span class="detail-original">${formatPrice(product.oldPrice)}</span>` : "";
        detailPrice.innerHTML = `<span class="detail-current">${formatPrice(product.price)}</span> ${oldPriceHtml} ${discountHtml}`;
    }

    const stockStatus = document.querySelector(".stock-status") || document.getElementById("stockStatus");
    if (stockStatus) {
        if (product.stock > 0) {
            stockStatus.className = "stock-status in-stock";
            stockStatus.innerHTML = `<i data-lucide="check-circle" style="width:16px;height:16px;color:var(--success);"></i> In Stock (${product.stock} available)`;
        } else {
            stockStatus.className = "stock-status out-of-stock";
            stockStatus.innerHTML = `<i data-lucide="x-circle" style="width:16px;height:16px;color:var(--danger);"></i> Out of Stock`;
        }
    }

    const detailDesc = document.querySelector(".detail-description") || document.getElementById("detailDescription");
    if (detailDesc) detailDesc.textContent = product.description;

    // Actions
    const qtyInput = document.getElementById("quantityInput");
    document.getElementById("qtyMinus")?.addEventListener("click", () => {
        let val = parseInt(qtyInput.value);
        if (val > 1) qtyInput.value = val - 1;
    });
    document.getElementById("qtyPlus")?.addEventListener("click", () => {
        let val = parseInt(qtyInput.value);
        if (val < product.stock) qtyInput.value = val + 1;
    });

    document.getElementById("addToCartBtn")?.addEventListener("click", () => {
        const qty = parseInt(qtyInput.value) || 1;
        if (typeof window.addToCart === "function") window.addToCart(product.id, qty);
    });

    const wishlistBtn = document.getElementById("addToWishlistBtn");
    if (wishlistBtn && typeof window.isInWishlist === "function") {
        if (window.isInWishlist(product.id)) wishlistBtn.classList.add("active");
        wishlistBtn.addEventListener("click", () => {
            if (typeof window.toggleWishlist === "function") window.toggleWishlist(product.id);
            wishlistBtn.classList.toggle("active");
        });
    }

    // Tabs
    const tabDesc = document.getElementById("tabDescription");
    if (tabDesc) tabDesc.innerHTML = `<p>${product.description}</p>`;

    const specsHtml = Object.entries(product.specifications).map(([key, val]) => `
        <tr><td>${key}</td><td>${val}</td></tr>
    `).join("");
    const tabSpecs = document.getElementById("tabSpecs");
    if (tabSpecs) tabSpecs.innerHTML = `<table class="specs-table"><tbody>${specsHtml}</tbody></table>`;

    const reviewsHtml = mockReviews.slice(0, 3 + (product.id % 3)).map(r => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-avatar">${r.name.charAt(0)}</div>
                <div>
                    <div class="review-name">${r.name}</div>
                    <div class="review-rating">${renderStars(r.rating)}</div>
                </div>
                <div class="review-date" style="margin-left: auto; color: var(--muted); font-size: 0.875rem;">${r.date}</div>
            </div>
            <div class="review-text">${r.text}</div>
        </div>
    `).join("");
    const tabRev = document.getElementById("tabReviews");
    if (tabRev) tabRev.innerHTML = `<div class="reviews-list">${reviewsHtml}</div>`;

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            const targetId = btn.dataset.tab || btn.dataset.target;
            if (targetId && document.getElementById(targetId)) {
                document.getElementById(targetId).classList.add("active");
            }
        });
    });

    // Related products
    const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
    if (related.length > 0) {
        renderProducts(related, "relatedProducts");
    }
}
