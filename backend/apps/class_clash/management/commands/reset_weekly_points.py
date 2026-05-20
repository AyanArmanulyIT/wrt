from django.core.management.base import BaseCommand

from apps.school.models import SchoolClass


class Command(BaseCommand):
    help = "Сбрасывает weekly_points у всех классов (запускать по понедельникам)"

    def handle(self, *args, **options):
        updated = SchoolClass.objects.update(weekly_points=0)
        self.stdout.write(self.style.SUCCESS(f"Сброшено weekly_points у {updated} классов."))
