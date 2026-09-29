# 🛒 CartNova

<p align="center">
  <b>A full-stack e-commerce web application built with Django REST Framework and Vanilla JavaScript.</b>
</p>

<p align="center">
  <a href="https://github.com/dhruvacm/CARTNOVA">GitHub Repository</a>
</p>

---

## 📌 About

**CartNova** is a full-stack e-commerce application developed as an educational and portfolio project.

The application provides a complete shopping workflow, from browsing products and managing a cart to authentication, checkout, order creation, order history, and order details.

The frontend is built using **HTML, CSS, and JavaScript**, while the backend is powered by **Python, Django, Django REST Framework, and JWT authentication**.

---

## ✨ Features

### 🛍️ Shopping
- Product listing
- Product details
- Product categories
- Product search
- Product sorting
- Stock-aware cart operations
- Shopping cart
- Wishlist

### 👤 Authentication
- User registration
- User login
- JWT-based authentication
- Access-token refresh
- User profile

### 🛒 Cart & Checkout
- Add products to cart
- Increase/decrease quantities
- Remove products
- Clear cart
- Backend cart synchronization
- Checkout
- Server-side order creation
- Order confirmation page

### 📦 Orders
- Create orders
- View order history
- View individual order details
- Server-side price calculation
- Stock validation during order creation

### 🎨 UI
- Responsive design
- Mobile-friendly layout
- Custom CSS
- Animations
- Dedicated pages for shopping, authentication, orders, profile, wishlist, and support

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Fetch API
- LocalStorage

### Backend
- Python
- Django
- Django REST Framework
- Simple JWT
- SQLite for local development

### Tools
- Git
- GitHub
- VS Code
- Python Virtual Environment

---

## 📂 Project Structure

```text
CARTNOVA/
│
├── backend/
│   ├── cartnova/
│   ├── store/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── css/
│   │   ├── style.css
│   │   ├── responsive.css
│   │   └── animations.css
│   │
│   ├── js/
│   │   ├── auth.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   ├── main.js
│   │   ├── products.js
│   │   └── wishlist.js
│   │
│   ├── index.html
│   ├── products.html
│   ├── product-details.html
│   ├── cart.html
│   ├── checkout.html
│   ├── order-confirmed.html
│   ├── orders.html
│   ├── order-details.html
│   ├── login.html
│   ├── register.html
│   ├── profile.html
│   ├── wishlist.html
│   └── support.html
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/dhruvacm/CARTNOVA.git
cd CARTNOVA
```

### 2. Set up the backend

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

### Windows PowerShell

```powershell
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file inside the `backend` directory.

```env
SECRET_KEY=your-secret-key
DEBUG=True

ALLOWED_HOSTS=127.0.0.1,localhost

CORS_ALLOWED_ORIGINS=http://127.0.0.1:5500
CSRF_TRUSTED_ORIGINS=http://127.0.0.1:5500

SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
SECURE_HSTS_SECONDS=0
```

> ⚠️ Never commit your `.env` file or expose your `SECRET_KEY`.

### 5. Run database migrations

```bash
python manage.py migrate
```

### 6. Start the Django backend

```bash
python manage.py runserver
```

The backend will normally be available at:

```text
http://127.0.0.1:8000/
```

### 7. Start the frontend

Open the `frontend` directory using a local development server such as **VS Code Live Server**.

For example:

```text
http://127.0.0.1:5500/
```

Make sure the frontend API URLs point to the Django backend.

---

## 🔐 Authentication API

### Register

```http
POST /api/auth/register/
```

### Login

```http
POST /api/auth/token/
```

### Refresh Token

```http
POST /api/auth/token/refresh/
```

CartNova uses **JWT access and refresh tokens** for authenticated API requests.

---

## 🛒 Cart API

```http
GET    /api/cart/
POST   /api/cart/add/
PATCH  /api/cart/update/<product_id>/
DELETE /api/cart/remove/<product_id>/
DELETE /api/cart/clear/
```

The backend keeps the authenticated user's cart synchronized with the frontend.

---

## 📦 Orders API

### Create Order

```http
POST /api/orders/create/
```

### Get Orders

```http
GET /api/orders/
```

### Get Order Details

```http
GET /api/orders/<order_id>/
```

---

## 💰 Order Calculation

CartNova performs important order calculations on the **backend** rather than trusting prices supplied by the frontend.

### Shipping

| Subtotal | Shipping |
|---|---:|
| Below ₹2,000 | ₹99 |
| ₹2,000 or more | Free |

### Discount

Orders with a subtotal of **₹5,000 or more** receive a **10% discount**.

### Final Total

```text
Total = Subtotal + Shipping - Discount
```

The backend also checks product stock when creating an order.

---

## 🔒 Security

CartNova includes several security measures:

- JWT authentication
- Environment variables for secrets
- CORS configuration
- CSRF trusted-origin configuration
- Server-side price calculation
- Server-side stock validation
- Database transaction handling during order creation
- Protected environment files
- `.gitignore` rules for sensitive/development files

The following files/directories are intentionally excluded from Git:

```text
.env
venv/
db.sqlite3
staticfiles/
__pycache__/
```

---

## 🧪 Development

Check the Django project:

```bash
python manage.py check
```

Collect static files:

```bash
python manage.py collectstatic
```

---



## 🔮 Future Improvements

- PostgreSQL production database
- Online payment gateway
- Email notifications
- Product reviews and ratings
- Admin analytics dashboard
- Cloud image storage
- Product recommendation system
- Production deployment
- Improved search and filtering

---

## 👨‍💻 Author

### Dhruva C M

**BE Computer Science & Engineering**

Interested in:

- Software Engineering
- Full-Stack Development
- Python & Django
- Web Development
- AI/ML
- Cybersecurity

GitHub:  
https://github.com/dhruvacm

---

## 📄 License

This project is created for **educational, portfolio, and internship purposes**.

---

⭐ If you find CartNova useful, consider giving the repository a star!
