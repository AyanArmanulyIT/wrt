from django.core.management.base import BaseCommand

from apps.school.models import School, SchoolClass, SchoolInviteCode


class Command(BaseCommand):
    help = "Создаёт демо-школы, классы и коды приглашения для регистрации"

    def handle(self, *args, **options):
        school, created = School.objects.get_or_create(
            slug="school-12",
            defaults={
                "name": "Школа №12",
                "verification_mode": School.VerificationMode.INVITE,
                "is_active": True,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Создана школа: {school.name}"))
        else:
            self.stdout.write(f"Школа уже есть: {school.name}")

        classes_data = [
            ("8А", "8a"),
            ("8Б", "8b"),
            ("9А", "9a"),
        ]
        for name, slug in classes_data:
            sc, c_created = SchoolClass.objects.get_or_create(
                school=school,
                name=name,
                defaults={"slug": slug},
            )
            if c_created:
                self.stdout.write(f"  + класс {name}")

        code, code_created = SchoolInviteCode.objects.get_or_create(
            school=school,
            code="WRT-2026",
            defaults={"is_active": True},
        )
        if code_created:
            self.stdout.write(self.style.SUCCESS("Код приглашения: WRT-2026"))

        # Вторая школа (email-верификация) — опционально
        school2, created2 = School.objects.get_or_create(
            slug="lyceum-1",
            defaults={
                "name": "Лицей №1",
                "verification_mode": School.VerificationMode.EMAIL,
                "allowed_email_domains": ["lyceum1.ru", "edu.lyceum1.ru"],
                "is_active": True,
            },
        )
        if created2:
            SchoolClass.objects.get_or_create(
                school=school2, name="10А", defaults={"slug": "10a"}
            )
            self.stdout.write(self.style.SUCCESS(f"Создана школа: {school2.name} (email)"))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Готово! Для регистрации:"))
        self.stdout.write("  Школа: Школа №12 (slug: school-12)")
        self.stdout.write("  Код:   WRT-2026")
        self.stdout.write("  Классы: 8А, 8Б, 9А")
