'use strict';

// Pre-seed demo account
const AUTH_API_URL = "https://cartnova-backend-ae6c.onrender.com/api/auth";

function getAccessToken() {
    return localStorage.getItem("cartNovaAccessToken");
}

function getRefreshToken() {
    return localStorage.getItem("cartNovaRefreshToken");
}
function isLoggedIn() {
    return !!getAccessToken();
}

/* =========================
   AUTHENTICATED FETCH (with JWT refresh)
========================= */

// Clears every piece of auth/session data tied to the current account,
// including the locally cached cart, so a different user logging in on
// the same browser never sees the previous user's cart or session.
function clearAuthData() {
    localStorage.removeItem("cartNovaAccessToken");
    localStorage.removeItem("cartNovaRefreshToken");
    localStorage.removeItem("cartNovaAuth");
    localStorage.removeItem("cartNovaCart");
}

async function refreshAccessToken() {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        return false;
    }

    try {
        const response = await fetch(`${AUTH_API_URL}/token/refresh/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ refresh: refreshToken })
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();

        if (!data.access) {
            return false;
        }

        localStorage.setItem("cartNovaAccessToken", data.access);
        return true;

    } catch (error) {
        console.error("Token refresh error:", error);
        return false;
    }
}

// Wraps fetch() for protected (JWT-authenticated) API calls. If the access
// token has expired, it silently refreshes once and retries the request
// exactly once - never in a loop. If the refresh token is also invalid, it
// clears auth and sends the user back to login.
async function authFetch(url, options = {}) {
    const headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${getAccessToken()}`
    };

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        const refreshed = await refreshAccessToken();

        if (!refreshed) {
            clearAuthData();

            if (typeof showToast === "function") {
                showToast("Your session has expired. Please login again.", "info");
            }

            window.location.href = "login.html";

            throw new Error("Session expired");
        }

        response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                "Authorization": `Bearer ${getAccessToken()}`
            }
        });
    }

    return response;
}
function getCurrentUser() {
    if (!isLoggedIn()) return null;

    try {
        return JSON.parse(localStorage.getItem("cartNovaUser"));
    } catch {
        return null;
    }
}
async function loginUser(email, password) {
    try {
        const response = await fetch(`${AUTH_API_URL}/token/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: "Invalid username or password"
            };
        }

        // A different account may have been logged in on this browser
        // before (or its cart may still be cached from that session) -
        // clear that out before storing anything for the new session.
        clearAuthData();

        localStorage.setItem("cartNovaAccessToken", data.access);
        localStorage.setItem("cartNovaRefreshToken", data.refresh);
        localStorage.setItem("cartNovaAuth", "true");

        // Django's default JWT login uses username.
        // Only reuse the cached profile info (name/phone) if it actually
        // belongs to this same email - otherwise a previous user's name
        // would leak into the new session.
        const existingUser = JSON.parse(
            localStorage.getItem("cartNovaUser") || "{}"
        );

        const sameAccount = existingUser.email === email;

        const user = {
            username: email,
            email: email,
            name: (sameAccount && existingUser.name) || email.split("@")[0],
            phone: (sameAccount && existingUser.phone) || ""
        };

        localStorage.setItem("cartNovaUser", JSON.stringify(user));

        updateAuthUI();

        return {
            success: true,
            message: "Login successful"
        };

    } catch (error) {
        console.error("Login error:", error);

        return {
            success: false,
            message: "Unable to connect to the server"
        };
    }
}

function logoutUser() {
    // Clears tokens AND the cached cart, so the next person to log in on
    // this browser never sees this account's cart or session.
    clearAuthData();

    if (typeof showToast === "function") {
        showToast("Logged out successfully", "info");
    }

    setTimeout(() => {
        window.location.href = "index.html";
    }, 1000);
}

async function registerUser(data) {
    if (!validateEmail(data.email)) {
        return {
            success: false,
            message: "Invalid email format"
        };
    }

    if (!validatePassword(data.password)) {
        return {
            success: false,
            message: "Password must be at least 8 characters"
        };
    }

    if (data.password !== data.confirmPassword) {
        return {
            success: false,
            message: "Passwords do not match"
        };
    }

    try {
        const response = await fetch(
            `${AUTH_API_URL}/register/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: data.username,
                    email: data.email,
                    password: data.password
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: result.error || "Registration failed"
            };
        }

        // Keep non-sensitive profile information locally.
        localStorage.setItem(
            "cartNovaUser",
            JSON.stringify({
                name: data.name,
                username: data.username,
                email: data.email,
                phone: data.phone
            })
        );

        return {
            success: true,
            message: "Registration successful"
        };

    } catch (error) {
        console.error("Registration error:", error);

        return {
            success: false,
            message: "Unable to connect to the server"
        };
    }
}

function updateAuthUI() {
    const authNav = document.getElementById('authNav');
    const mobileAuth = document.getElementById('mobileAuth');

    if (isLoggedIn()) {
        const user = getCurrentUser();
        const initial = user ? user.name.charAt(0).toUpperCase() : 'U';

        if (authNav) {
            authNav.innerHTML = `
                <div class="user-dropdown" style="position:relative;">
                    <button class="action-btn user-btn" aria-label="Account">
                        <i data-lucide="user"></i>
                    </button>
                    <div class="dropdown-menu" style="display:none; position:absolute; right:0; top:100%; background:var(--card); box-shadow:var(--shadow-lg); border-radius:var(--radius-sm); padding:0.5rem; min-width:150px; z-index:100;">
                        <a href="profile.html" style="display:block; padding:0.5rem; color:var(--text); text-decoration:none;"><i data-lucide="user" style="width:16px;height:16px;margin-right:0.5rem;"></i> Profile</a>
                        <a href="orders.html" style="display:block; padding:0.5rem; color:var(--text); text-decoration:none;"><i data-lucide="package" style="width:16px;height:16px;margin-right:0.5rem;"></i> Orders</a>
                        <a href="#" onclick="logoutUser()" style="display:block; padding:0.5rem; color:var(--danger); text-decoration:none;"><i data-lucide="log-out" style="width:16px;height:16px;margin-right:0.5rem;"></i> Logout</a>
                    </div>
                </div>
            `;
            // Simple dropdown toggle logic
            const userBtn = authNav.querySelector('.user-btn');
            const dropdown = authNav.querySelector('.dropdown-menu');
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            });
            document.addEventListener('click', () => {
                if (dropdown) dropdown.style.display = 'none';
            });
        }

        if (mobileAuth) {
            mobileAuth.innerHTML = `
                <div style="padding: 1rem; border-top: 1px solid var(--border);">
                    <p style="margin-bottom: 0.5rem;">Welcome, ${user ? user.name : 'User'}</p>
                    <button onclick="logoutUser()" class="btn btn-secondary btn-block">Logout</button>
                </div>
            `;
        }
    } else {
        if (authNav) {
            authNav.innerHTML = `<a href="login.html" class="btn btn-sm btn-primary">Login</a>`;
        }
        if (mobileAuth) {
            mobileAuth.innerHTML = `<a href="login.html" class="btn btn-primary btn-block">Login</a>`;
        }
    }

    if (window.lucide) lucide.createIcons();
}

function initLoginPage() {
    if (isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    // Show/hide password
    const toggle = document.getElementById('loginPasswordToggle');
    const pwdInput = document.getElementById('loginPassword');
    if (toggle && pwdInput) {
        toggle.addEventListener('click', () => {
            const type = pwdInput.getAttribute('type') === 'password' ? 'text' : 'password';
            pwdInput.setAttribute('type', type);
            toggle.innerHTML = `<i data-lucide="${type === 'password' ? 'eye' : 'eye-off'}"></i>`;
            if (window.lucide) lucide.createIcons();
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = pwdInput.value;
        const errorEl = document.getElementById('loginError');

        const res = await loginUser(email, password);
        if (res.success) {
            if (errorEl) errorEl.style.display = 'none';
            if (typeof showToast === 'function') showToast(res.message, 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            if (errorEl) {
                errorEl.textContent = res.message;
                errorEl.style.display = 'block';
            } else if (typeof showToast === 'function') {
                showToast(res.message, 'error');
            }
        }
    });
}

function initRegisterPage() {
    if (isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('regName').value,
            username: document.getElementById('regUsername').value,
            email: document.getElementById('regEmail').value,
            phone: document.getElementById('regPhone').value,
            password: document.getElementById('regPassword').value,
            confirmPassword: document.getElementById('regConfirmPassword').value
        };

        if (!document.getElementById('regTerms').checked) {
            if (typeof showToast === 'function') showToast('You must agree to terms', 'warning');
            return;
        }

        const res = await registerUser(data);
        if (res.success) {
            if (typeof showToast === 'function') showToast(res.message, 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        } else {
            if (typeof showToast === 'function') showToast(res.message, 'error');
        }
    });
}

function initProfilePage() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const user = getCurrentUser();
    if (!user) return;

    const nameInput = document.getElementById('profileName');
    const emailInput = document.getElementById('profileEmail');
    const phoneInput = document.getElementById('profilePhone');
    const displayName = document.getElementById('profileDisplayName');
    const displayEmail = document.getElementById('profileDisplayEmail');
    const avatar = document.getElementById('profileAvatar');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (displayName) displayName.textContent = user.name || 'User';
    if (displayEmail) displayEmail.textContent = user.email || '';
    if (avatar) avatar.textContent = (user.name || 'U').charAt(0).toUpperCase();

    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const updatedUser = {
                ...user,
                name: nameInput ? nameInput.value.trim() : user.name,
                email: emailInput ? emailInput.value.trim() : user.email,
                phone: phoneInput ? phoneInput.value.trim() : user.phone
            };
            localStorage.setItem('cartNovaUser', JSON.stringify(updatedUser));
            if (displayName) displayName.textContent = updatedUser.name;
            if (displayEmail) displayEmail.textContent = updatedUser.email;
            if (avatar) avatar.textContent = updatedUser.name.charAt(0).toUpperCase();
            updateAuthUI();
            if (typeof showToast === 'function') showToast('Profile updated successfully', 'success');
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
}

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
    return password && password.length >= 8;
}
