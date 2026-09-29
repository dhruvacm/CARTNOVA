from decimal import Decimal, ROUND_HALF_UP

from django.contrib.auth.models import User
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Product,
    Category,
    Order,
    OrderItem,
    Cart,
    CartItem
)
from .serializers import ProductSerializer, CategorySerializer


# =========================
# ORDER PRICING
# =========================
# These thresholds mirror calculateShipping() / calculateDiscount() in
# frontend/js/cart.js. Keeping the rule in one place on the backend (and
# using the exact same numbers on the frontend) is what keeps the total
# shown at checkout consistent with the total Django actually stores.

FREE_SHIPPING_THRESHOLD = Decimal("2000")
SHIPPING_FEE = Decimal("99")
DISCOUNT_THRESHOLD = Decimal("5000")
DISCOUNT_RATE = Decimal("0.10")


def calculate_order_pricing(subtotal):
    subtotal = Decimal(subtotal)

    if subtotal <= 0 or subtotal >= FREE_SHIPPING_THRESHOLD:
        shipping = Decimal("0")
    else:
        shipping = SHIPPING_FEE

    if subtotal >= DISCOUNT_THRESHOLD:
        discount = (subtotal * DISCOUNT_RATE).quantize(
            Decimal("1"), rounding=ROUND_HALF_UP
        )
    else:
        discount = Decimal("0")

    total = subtotal + shipping - discount
    return shipping, discount, total


class OrderError(Exception):
    def __init__(self, message, status):
        self.message = message
        self.status = status


# =========================
# PRODUCT APIs
# =========================

@api_view(["GET"])
def product_list(request):
    products = Product.objects.select_related("category").all()
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def product_detail(request, product_id):
    try:
        product = Product.objects.select_related("category").get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found"},
            status=404
        )

    serializer = ProductSerializer(product)
    return Response(serializer.data)


# =========================
# CATEGORY API
# =========================

@api_view(["GET"])
def category_list(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


# =========================
# USER REGISTRATION
# =========================

@api_view(["POST"])
def register_user(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")

    if not username or not email or not password:
        return Response(
            {"error": "Username, email and password are required."},
            status=400
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists."},
            status=400
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already exists."},
            status=400
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    return Response(
        {
            "message": "User registered successfully.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        },
        status=201
    )


# =========================
# CREATE ORDER
# =========================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):

    items = request.data.get("items")
    shipping_address = request.data.get("shipping_address")

    if not items:
        return Response(
            {"error": "Order must contain at least one item."},
            status=400
        )

    if not shipping_address:
        return Response(
            {"error": "Shipping address is required."},
            status=400
        )

    # Validate the shape of every line item up front, before touching the
    # database or opening a transaction.
    parsed_items = []

    for item in items:

        product_id = item.get("product_id")
        quantity = item.get("quantity")

        if not product_id or not quantity:
            return Response(
                {"error": "Each item must contain product_id and quantity."},
                status=400
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"error": "Quantity must be a valid number."},
                status=400
            )

        if quantity <= 0:
            return Response(
                {"error": "Quantity must be greater than zero."},
                status=400
            )

        parsed_items.append((product_id, quantity))

    try:
        with transaction.atomic():
            subtotal = Decimal("0")
            order_items = []

            for product_id, quantity in parsed_items:

                # select_for_update locks each product row for the rest of
                # this transaction, so two simultaneous checkouts can't both
                # read the same stock value and oversell the last unit.
                try:
                    product = Product.objects.select_for_update().get(
                        id=product_id
                    )
                except Product.DoesNotExist:
                    raise OrderError(
                        f"Product {product_id} not found.", 404
                    )

                if product.stock < quantity:
                    raise OrderError(
                        f"Only {product.stock} units of "
                        f"{product.name} are available.",
                        400
                    )

                subtotal += product.price * quantity

                order_items.append(
                    {
                        "product": product,
                        "quantity": quantity,
                        "price": product.price
                    }
                )

            shipping, discount, total_amount = calculate_order_pricing(
                subtotal
            )

            # Create order
            order = Order.objects.create(
                user=request.user,
                total_amount=total_amount,
                shipping_address=shipping_address
            )

            # Create order items and reduce stock. Stock is only ever
            # decremented here, inside the same atomic block that created
            # the order, so a failure anywhere above leaves stock untouched.
            for item in order_items:

                OrderItem.objects.create(
                    order=order,
                    product=item["product"],
                    quantity=item["quantity"],
                    price=item["price"]
                )

                product = item["product"]
                product.stock -= item["quantity"]
                product.save(update_fields=["stock"])

    except OrderError as error:
        return Response({"error": error.message}, status=error.status)

    return Response(
        {
            "message": "Order created successfully.",
            "order": {
                "id": order.id,
                "order_id": order.order_id,
                "subtotal": str(subtotal),
                "shipping": str(shipping),
                "discount": str(discount),
                "total_amount": str(order.total_amount),
                "status": order.status,
                "shipping_address": order.shipping_address,
                "created_at": order.created_at
            }
        },
        status=201
    )


# =========================
# USER ORDERS
# =========================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_list(request):

    orders = Order.objects.filter(
        user=request.user
    ).prefetch_related("items__product").order_by("-created_at")

    data = []

    for order in orders:
        items = order.items.all()
        subtotal = sum(
            (item.price * item.quantity for item in items),
            Decimal("0")
        )
        shipping, discount, _ = calculate_order_pricing(subtotal)

        data.append(
            {
                "id": order.id,
                "order_id": order.order_id,
                "subtotal": str(subtotal),
                "shipping": str(shipping),
                "discount": str(discount),
                "total_amount": str(order.total_amount),
                "status": order.status,
                "shipping_address": order.shipping_address,
                "created_at": order.created_at,
                "items": [
                    {
                        "product_id": item.product.id if item.product else None,
                        "product_name": item.product.name if item.product else "Deleted Product",
                        "product_image": (
                            item.product.images[0]
                            if item.product and item.product.images
                            else None
                        ),
                        "quantity": item.quantity,
                        "price": str(item.price)
                    }
                    for item in items
                ]
            }
        )

    return Response(data)


# =========================
# ORDER DETAIL
# =========================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id):

    try:
        order = Order.objects.prefetch_related(
            "items__product"
        ).get(
            order_id=order_id,
            user=request.user
        )

    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found."},
            status=404
        )

    items = order.items.all()
    subtotal = sum(
        (item.price * item.quantity for item in items),
        Decimal("0")
    )
    shipping, discount, _ = calculate_order_pricing(subtotal)

    return Response(
        {
            "id": order.id,
            "order_id": order.order_id,
            "subtotal": str(subtotal),
            "shipping": str(shipping),
            "discount": str(discount),
            "total_amount": str(order.total_amount),
            "status": order.status,
            "shipping_address": order.shipping_address,
            "created_at": order.created_at,
            "items": [
                {
                    "product_id": item.product.id if item.product else None,
                    "product_name": item.product.name if item.product else "Deleted Product",
                    "product_image": (
                        item.product.images[0]
                        if item.product and item.product.images
                        else None
                    ),
                    "quantity": item.quantity,
                    "price": str(item.price)
                }
                for item in items
            ]
        }
    )


# =========================
# CART API
# =========================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart, created = Cart.objects.get_or_create(
        user=request.user
    )

    items = cart.items.select_related("product")

    data = []

    for item in items:
        data.append({
            "id": item.id,
            "product_id": item.product.id,
            "product_name": item.product.name,
            "price": str(item.product.price),
            "quantity": item.quantity,
            "stock": item.product.stock,
            "images": item.product.images,
        })

    return Response({
        "cart_id": cart.id,
        "items": data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get("product_id")
    quantity = request.data.get("quantity", 1)

    if not product_id:
        return Response(
            {"error": "Product ID is required."},
            status=400
        )

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return Response(
            {"error": "Quantity must be a valid number."},
            status=400
        )

    if quantity <= 0:
        return Response(
            {"error": "Quantity must be greater than zero."},
            status=400
        )

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found."},
            status=404
        )

    cart, created = Cart.objects.get_or_create(
        user=request.user
    )

    cart_item, item_created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={"quantity": quantity}
    )

    if not item_created:
        new_quantity = cart_item.quantity + quantity

        if new_quantity > product.stock:
            return Response(
                {
                    "error": f"Only {product.stock} units of "
                             f"{product.name} are available."
                },
                status=400
            )

        cart_item.quantity = new_quantity
        cart_item.save()

    return Response({
        "message": "Product added to cart.",
        "product_id": product.id,
        "quantity": cart_item.quantity
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_cart_item(request, product_id):
    quantity = request.data.get("quantity")

    if quantity is None:
        return Response(
            {"error": "Quantity is required."},
            status=400
        )

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return Response(
            {"error": "Quantity must be a valid number."},
            status=400
        )

    if quantity <= 0:
        return Response(
            {"error": "Quantity must be greater than zero."},
            status=400
        )

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found."},
            status=404
        )

    if quantity > product.stock:
        return Response(
            {
                "error": f"Only {product.stock} units of "
                         f"{product.name} are available."
            },
            status=400
        )

    try:
        cart = Cart.objects.get(user=request.user)
        cart_item = CartItem.objects.get(
            cart=cart,
            product=product
        )
    except (Cart.DoesNotExist, CartItem.DoesNotExist):
        return Response(
            {"error": "Cart item not found."},
            status=404
        )

    cart_item.quantity = quantity
    cart_item.save()

    return Response({
        "message": "Cart updated successfully.",
        "product_id": product.id,
        "quantity": cart_item.quantity
    })


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, product_id):
    try:
        cart = Cart.objects.get(user=request.user)

        cart_item = CartItem.objects.get(
            cart=cart,
            product_id=product_id
        )

        cart_item.delete()

        return Response({
            "message": "Product removed from cart."
        })

    except Cart.DoesNotExist:
        return Response(
            {"error": "Cart not found."},
            status=404
        )

    except CartItem.DoesNotExist:
        return Response(
            {"error": "Cart item not found."},
            status=404
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def clear_cart(request):
    try:
        cart = Cart.objects.get(user=request.user)
        cart.items.all().delete()

        return Response({
            "message": "Cart cleared successfully."
        })

    except Cart.DoesNotExist:
        return Response({
            "message": "Cart is already empty."
        })