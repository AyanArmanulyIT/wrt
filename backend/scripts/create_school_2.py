"""
Create school #2 named after Zhumeken Nazhidenov (Atyrau) + all classes.
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.dev'

import django
django.setup()

from django.db import transaction
from apps.school.models import School, SchoolClass

SCHOOL_NAME = "Школа №2 имени Жумекена Нажмиденова"
CITY = "Атырау"
SLUG = "school-2-zhumeken"

CLASSES = [
    "1A","1Б","1В","1Г","1Д","1Е",
    "2A","2Б","2В","2Г","2Д","2Е","2Ж",
    "3A","3Б","3В","3Г","3Д",
    "4A","4Б","4В","4Г","4Д",
    "5A","5Б","5В","5Г",
    "6A","6Б","6В","6Г","6Д",
    "7A","7Б","7В","7Г","7Д","7Е",
    "8A","8Б","8В","8Г","8Д","8Е","8Ж","8Х",
    "9A","9Б","9В","9Г","9Д",
    "10A","10Б","10В",
    "11A","11Б","11В",
]

@transaction.atomic
def run():
    school, created = School.objects.get_or_create(
        slug=SLUG,
        defaults={
            "name": SCHOOL_NAME,
            "city": CITY,
            "verification_mode": School.VerificationMode.MANUAL,
            "is_active": True,
        }
    )
    if created:
        print(f"OK - Created: {school.name}")
    else:
        print(f"Exists: {school.name}")

    n = 0
    for cls_name in CLASSES:
        _, was = SchoolClass.objects.get_or_create(
            school=school,
            name=cls_name,
            defaults={"slug": f"{SLUG}-{cls_name.lower()}"}
        )
        if was:
            n += 1
    print(f"Done. {n} classes added. Total: {school.classes.count()}")

if __name__ == "__main__":
    run()