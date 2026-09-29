from rest_framework import serializers
from .models import Category, Product, Order, OrderItem


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(
        source="products.count",
        read_only=True
    )

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "product_count"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "category",
            "description",
            "price",
            "old_price",
            "discount",
            "rating",
            "reviews",
            "stock",
            "brand",
            "color",
            "images",
            "specifications",
            "is_featured",
            "is_new",
            "created_at",
            "updated_at",
        ]