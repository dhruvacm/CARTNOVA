from django.core.management.base import BaseCommand
from store.models import Category, Product


PRODUCTS = [
    {
        "id": 1,
        "name": "Wireless Headphones",
        "category": "Electronics",
        "description": "Premium wireless headphones with immersive sound, active noise cancellation, and 40-hour battery life. Comfortable over-ear design with memory foam cushions.",
        "price": 1999,
        "old_price": 2999,
        "discount": 33,
        "rating": 4.8,
        "reviews": 128,
        "stock": 15,
        "brand": "NovaSound",
        "color": "Black",
        "images": [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "NovaSound",
            "Model": "NS-WH100",
            "Color": "Black",
            "Connectivity": "Bluetooth 5.3",
            "Battery": "40 Hours",
            "Driver Size": "40mm",
            "Warranty": "1 Year"
        },
        "is_featured": True,
        "is_new": False
    },

    {
        "id": 2,
        "name": "Smart Watch",
        "category": "Electronics",
        "description": "Track your fitness and stay connected with this sleek smart watch. Features heart rate monitoring, GPS, and customizable watch faces.",
        "price": 3499,
        "old_price": 4999,
        "discount": 30,
        "rating": 4.6,
        "reviews": 95,
        "stock": 25,
        "brand": "NovaTech",
        "color": "Silver",
        "images": [
            "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "NovaTech",
            "Display": "1.4 inch AMOLED",
            "Battery Life": "7 Days",
            "Water Resistance": "5 ATM",
            "Sensors": "Heart Rate, SpO2",
            "Compatibility": "Android & iOS",
            "Warranty": "1 Year"
        },
        "is_featured": True,
        "is_new": True
    },

    {
        "id": 3,
        "name": "Bluetooth Speaker",
        "category": "Electronics",
        "description": "Portable Bluetooth speaker with 360-degree sound and deep bass. Waterproof design makes it perfect for outdoor adventures.",
        "price": 2499,
        "old_price": 3499,
        "discount": 28,
        "rating": 4.5,
        "reviews": 76,
        "stock": 40,
        "brand": "AudioPro",
        "color": "Blue",
        "images": [
            "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "AudioPro",
            "Output Power": "20W",
            "Battery": "12 Hours",
            "Waterproof": "IPX7",
            "Bluetooth": "v5.1",
            "Weight": "450g",
            "Warranty": "1 Year"
        },
        "is_featured": True,
        "is_new": False
    },

    {
        "id": 4,
        "name": "Mechanical Keyboard",
        "category": "Electronics",
        "description": "High-performance mechanical gaming keyboard with RGB backlighting and tactile switches. Built for durability and speed.",
        "price": 4999,
        "old_price": 6499,
        "discount": 23,
        "rating": 4.7,
        "reviews": 203,
        "stock": 12,
        "brand": "GameTech",
        "color": "Black",
        "images": [
            "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "GameTech",
            "Switch Type": "Blue Switches",
            "Layout": "Full Size",
            "Backlight": "RGB",
            "Connectivity": "Wired USB",
            "Material": "Aluminum Frame",
            "Warranty": "2 Years"
        },
        "is_featured": True,
        "is_new": False
    },

    {
        "id": 5,
        "name": "Wireless Mouse",
        "category": "Electronics",
        "description": "Ergonomic wireless mouse with adjustable DPI and long-lasting battery. Smooth tracking on almost any surface.",
        "price": 999,
        "old_price": 1499,
        "discount": 33,
        "rating": 4.4,
        "reviews": 156,
        "stock": 50,
        "brand": "TechPeriph",
        "color": "White",
        "images": [
            "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "TechPeriph",
            "DPI": "Up to 4000",
            "Buttons": "6",
            "Connectivity": "2.4GHz Wireless",
            "Battery Life": "Up to 18 months",
            "Weight": "95g",
            "Warranty": "1 Year"
        },
        "is_featured": False,
        "is_new": False
    },

    {
        "id": 6,
        "name": "Premium T-Shirt",
        "category": "Fashion",
        "description": "Comfortable and stylish premium cotton t-shirt. Perfect for everyday wear with a modern fit.",
        "price": 799,
        "old_price": 1299,
        "discount": 38,
        "rating": 4.3,
        "reviews": 89,
        "stock": 100,
        "brand": "NovaStyle",
        "color": "Yellow",
        "images": [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "NovaStyle",
            "Material": "100% Cotton",
            "Fit": "Regular Fit",
            "Neckline": "Crew Neck",
            "Care": "Machine Wash",
            "Pattern": "Solid",
            "Origin": "India"
        },
        "is_featured": False,
        "is_new": True
    },

    {
        "id": 7,
        "name": "Denim Jacket",
        "category": "Fashion",
        "description": "Classic denim jacket with a vintage wash. Versatile outerwear that pairs well with any casual outfit.",
        "price": 2999,
        "old_price": 4499,
        "discount": 33,
        "rating": 4.6,
        "reviews": 67,
        "stock": 30,
        "brand": "DenimCo",
        "color": "Blue",
        "images": [
            "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "DenimCo",
            "Material": "98% Cotton, 2% Elastane",
            "Fit": "Slim Fit",
            "Pockets": "4",
            "Closure": "Button",
            "Care": "Machine Wash Cold",
            "Origin": "India"
        },
        "is_featured": True,
        "is_new": False
    },

    {
        "id": 8,
        "name": "Casual Hoodie",
        "category": "Fashion",
        "description": "Cozy fleece pullover hoodie for chilly days. Features a front kangaroo pocket and adjustable drawstring hood.",
        "price": 1499,
        "old_price": 2199,
        "discount": 31,
        "rating": 4.5,
        "reviews": 112,
        "stock": 45,
        "brand": "UrbanWear",
        "color": "Grey",
        "images": [
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "UrbanWear",
            "Material": "Cotton Blend",
            "Sleeve Length": "Long Sleeves",
            "Pattern": "Solid",
            "Hooded": "Yes",
            "Care": "Machine Wash",
            "Origin": "India"
        },
        "is_featured": True,
        "is_new": False
    },

    {
        "id": 9,
        "name": "Running Shoes",
        "category": "Shoes",
        "description": "Lightweight running shoes with breathable mesh upper and responsive cushioning for maximum comfort.",
        "price": 3999,
        "old_price": 5999,
        "discount": 33,
        "rating": 4.7,
        "reviews": 234,
        "stock": 20,
        "brand": "SprintTech",
        "color": "Red",
        "images": [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "SprintTech",
            "Upper Material": "Mesh",
            "Sole Material": "Rubber",
            "Fastening": "Lace-Up",
            "Type": "Running",
            "Weight": "250g",
            "Warranty": "3 Months"
        },
        "is_featured": True,
        "is_new": False
    },

    {
        "id": 10,
        "name": "Classic Sneakers",
        "category": "Shoes",
        "description": "Timeless white sneakers that go with everything. Premium synthetic leather upper and durable rubber outsole.",
        "price": 2499,
        "old_price": 3499,
        "discount": 28,
        "rating": 4.4,
        "reviews": 178,
        "stock": 60,
        "brand": "StreetWalk",
        "color": "White",
        "images": [
            "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "StreetWalk",
            "Upper Material": "Synthetic Leather",
            "Sole Material": "Rubber",
            "Fastening": "Lace-Up",
            "Type": "Casual",
            "Care": "Wipe with clean cloth",
            "Warranty": "3 Months"
        },
        "is_featured": False,
        "is_new": True
    },

    {
        "id": 11,
        "name": "Leather Wallet",
        "category": "Accessories",
        "description": "Genuine leather bifold wallet with multiple card slots and a dedicated coin pocket. Slim design fits perfectly in any pocket.",
        "price": 1299,
        "old_price": 1999,
        "discount": 35,
        "rating": 4.5,
        "reviews": 92,
        "stock": 40,
        "brand": "LuxLeather",
        "color": "Brown",
        "images": [
            "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "LuxLeather",
            "Material": "Genuine Leather",
            "Type": "Bifold",
            "Card Slots": "6",
            "Coin Pocket": "Yes",
            "Dimensions": "11 x 9 cm",
            "Warranty": "6 Months"
        },
        "is_featured": True,
        "is_new": False
    },

    {
        "id": 12,
        "name": "Sunglasses",
        "category": "Accessories",
        "description": "Stylish aviator sunglasses with polarized UV400 lenses. Lightweight metal frame ensures all-day comfort.",
        "price": 1799,
        "old_price": 2499,
        "discount": 28,
        "rating": 4.3,
        "reviews": 145,
        "stock": 35,
        "brand": "ShadePro",
        "color": "Black/Gold",
        "images": [
            "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "ShadePro",
            "Frame Material": "Metal",
            "Lens Type": "Polarized",
            "UV Protection": "100%",
            "Shape": "Aviator",
            "Gender": "Unisex",
            "Warranty": "1 Year"
        },
        "is_featured": False,
        "is_new": False
    },

    {
        "id": 13,
        "name": "Smart LED Lamp",
        "category": "Home & Living",
        "description": "App-controlled smart LED desk lamp with adjustable color temperature and brightness. Perfect for reading or creating ambiance.",
        "price": 1499,
        "old_price": 2299,
        "discount": 34,
        "rating": 4.6,
        "reviews": 83,
        "stock": 25,
        "brand": "NovaHome",
        "color": "White",
        "images": [
            "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "NovaHome",
            "Type": "Desk Lamp",
            "Connectivity": "Wi-Fi",
            "Color Temp": "2700K - 6500K",
            "Power": "10W",
            "Smart Assistant": "Alexa, Google Assistant",
            "Warranty": "1 Year"
        },
        "is_featured": False,
        "is_new": True
    },

    {
        "id": 14,
        "name": "Coffee Maker",
        "category": "Home & Living",
        "description": "Programmable drip coffee maker with a 12-cup glass carafe. Features keep-warm function and auto shut-off.",
        "price": 4499,
        "old_price": 5999,
        "discount": 25,
        "rating": 4.8,
        "reviews": 67,
        "stock": 15,
        "brand": "BrewMaster",
        "color": "Black/Silver",
        "images": [
            "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "BrewMaster",
            "Capacity": "12 Cups",
            "Type": "Drip",
            "Filter Type": "Reusable",
            "Power": "900W",
            "Material": "Stainless Steel/Plastic",
            "Warranty": "2 Years"
        },
        "is_featured": False,
        "is_new": False
    },

    {
        "id": 15,
        "name": "Face Moisturizer",
        "category": "Beauty",
        "description": "Hydrating daily face moisturizer with hyaluronic acid. Leaves skin feeling soft, smooth, and nourished without being greasy.",
        "price": 599,
        "old_price": 899,
        "discount": 33,
        "rating": 4.4,
        "reviews": 198,
        "stock": 80,
        "brand": "GlowSkin",
        "color": "N/A",
        "images": [
            "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "GlowSkin",
            "Volume": "100ml",
            "Skin Type": "All Skin Types",
            "Key Ingredient": "Hyaluronic Acid",
            "Cruelty Free": "Yes",
            "Form": "Cream",
            "Shelf Life": "24 Months"
        },
        "is_featured": False,
        "is_new": True
    },

    {
        "id": 16,
        "name": "Perfume",
        "category": "Beauty",
        "description": "Elegant and long-lasting fragrance with floral and woody notes. Perfect for evening wear and special occasions.",
        "price": 2999,
        "old_price": 3999,
        "discount": 25,
        "rating": 4.7,
        "reviews": 156,
        "stock": 25,
        "brand": "AuraFragrance",
        "color": "N/A",
        "images": [
            "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "AuraFragrance",
            "Volume": "50ml",
            "Type": "Eau de Parfum",
            "Fragrance Family": "Floral Woody",
            "Gender": "Women",
            "Longevity": "8-10 Hours",
            "Origin": "France"
        },
        "is_featured": False,
        "is_new": False
    },

    {
        "id": 17,
        "name": "Backpack",
        "category": "Accessories",
        "description": "Durable water-resistant backpack with laptop compartment and ergonomic straps. Ideal for daily commute or travel.",
        "price": 1999,
        "old_price": 2999,
        "discount": 33,
        "rating": 4.6,
        "reviews": 124,
        "stock": 45,
        "brand": "UrbanCarry",
        "color": "Grey",
        "images": [
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "UrbanCarry",
            "Material": "Polyester",
            "Capacity": "25L",
            "Laptop Compartment": "Up to 15.6 inch",
            "Water Resistant": "Yes",
            "Compartments": "3 Main, 2 Side",
            "Warranty": "1 Year"
        },
        "is_featured": True,
        "is_new": False
    },

    {
        "id": 18,
        "name": "Travel Bottle",
        "category": "Home & Living",
        "description": "Insulated stainless steel water bottle keeps drinks cold for 24 hours or hot for 12 hours. Leak-proof cap.",
        "price": 499,
        "old_price": 799,
        "discount": 37,
        "rating": 4.2,
        "reviews": 87,
        "stock": 120,
        "brand": "HydroVibe",
        "color": "Matte Black",
        "images": [
            "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop",
            "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop&q=80",
            "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop&q=60"
        ],
        "specifications": {
            "Brand": "HydroVibe",
            "Material": "Stainless Steel",
            "Capacity": "750ml",
            "Insulation": "Double Wall Vacuum",
            "BPA Free": "Yes",
            "Weight": "320g",
            "Warranty": "1 Year"
        },
        "is_featured": False,
        "is_new": True
    },
]


class Command(BaseCommand):
    help = "Seed CartNova products into the database"

    def handle(self, *args, **options):
        created = 0
        updated = 0

        for data in PRODUCTS:
            category_name = data.pop("category")

            category, created = Category.objects.get_or_create(
    name=category_name
)

            product, was_created = Product.objects.update_or_create(
                id=data["id"],
                defaults={
                    **data,
                    "category": category,
                },
            )

            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"CartNova products seeded successfully! "
                f"Created: {created}, Updated: {updated}"
            )
        )