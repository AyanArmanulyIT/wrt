from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Назначает пользователя администратором (is_staff + is_school_moderator)"

    def add_arguments(self, parser):
        parser.add_argument("email", type=str, help="Email пользователя")

    def handle(self, *args, **options):
        email = options["email"].lower().strip()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            self.stderr.write(self.style.ERROR(f"Пользователь {email} не найден"))
            return
        user.is_staff = True
        user.is_school_moderator = True
        user.save(update_fields=["is_staff", "is_school_moderator", "updated_at"])
        self.stdout.write(
            self.style.SUCCESS(f"{email} — теперь администратор. Откройте /admin")
        )
