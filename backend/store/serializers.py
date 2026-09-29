from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        email = attrs.get("username")
        password = attrs.get("password")

        User = get_user_model()

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "Invalid email or password."}
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "User account is disabled."}
            )

        authenticated_user = authenticate(
            request=self.context.get("request"),
            username=user.username,
            password=password,
        )

        if authenticated_user is None:
            raise serializers.ValidationError(
                {"detail": "Invalid email or password."}
            )

        # SimpleJWT expects the actual username here
        attrs["username"] = user.username

        return super().validate(attrs)