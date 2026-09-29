from django.contrib import admin
from .models import Category, Product, Order, OrderItem, Cart, CartItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "price",
        "stock",
        "rating",
        "is_featured",
        "is_new",
    )

    list_filter = (
        "category",
        "is_featured",
        "is_new",
    )

    search_fields = (
        "name",
        "brand",
        "description",
    )

    list_editable = (
        "price",
        "stock",
        "is_featured",
        "is_new",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_id",
        "user",
        "total_amount",
        "status",
        "created_at",
    )

    list_filter = ("status",)
    search_fields = ("order_id", "user__username")
    readonly_fields = ("created_at",)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "order",
        "product",
        "quantity",
        "price",
    )


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    raw_id_fields = ("product",)


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "item_count",
        "created_at",
        "updated_at",
    )

    search_fields = ("user__username", "user__email")
    list_filter = ("created_at",)
    ordering = ("-updated_at",)
    inlines = [CartItemInline]

    def item_count(self, obj):
        return obj.items.count()

    item_count.short_description = "Items"


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = (
        "cart",
        "product",
        "quantity",
    )

    search_fields = (
        "cart__user__username",
        "product__name",
    )

    list_filter = ("product__category",)
    raw_id_fields = ("cart", "product")
    ordering = ("cart",)