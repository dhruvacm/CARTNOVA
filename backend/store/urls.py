from django.urls import path
from .views import (
    product_list,
    product_detail,
    category_list,
    register_user,
    create_order,
    order_list,
    order_detail,
    get_cart,
    add_to_cart,
    update_cart_item,
    remove_from_cart,
    clear_cart,
)
urlpatterns = [
    path("products/", product_list, name="product-list"),
    path("products/<int:product_id>/", product_detail, name="product-detail"),
    path("categories/", category_list, name="category-list"),
    path("auth/register/", register_user, name="register"),
    path("orders/", order_list, name="order-list"),
    path("orders/create/", create_order, name="order-create"),
    path("orders/<str:order_id>/", order_detail, name="order-detail"),
    path("cart/", get_cart, name="cart"),
path("cart/add/", add_to_cart, name="cart-add"),
path("cart/update/<int:product_id>/", update_cart_item, name="cart-update"),
path("cart/remove/<int:product_id>/", remove_from_cart, name="cart-remove"),
path("cart/clear/", clear_cart, name="cart-clear"),
]