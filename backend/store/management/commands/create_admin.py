import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create the CartNova admin user"

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.getenv("DJANGO_SUPERUSER_USERNAME", "dhruva")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "dhruvacm2007@gmail.com")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

        if not password:
            self.stdout.write(
                self.style.ERROR(
                    "DJANGO_SUPERUSER_PASSWORD is not configured."
                )
            )
            return

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
            },
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Admin user '{username}' created successfully."
                )
            )
        else:
            if not user.is_staff or not user.is_superuser:
                user.is_staff = True
                user.is_superuser = True
                user.save(update_fields=["is_staff", "is_superuser"])

            self.stdout.write(
                self.style.SUCCESS(
                    f"Admin user '{username}' already exists."
                )
            )