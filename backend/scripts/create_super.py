import django
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import UserProfile

User = get_user_model()

# Create superuser 5which
user, created = User.objects.get_or_create(
    email="5which@wrt.app",
    defaults={
        "is_superuser": True,
        "is_staff": True,
        "is_school_moderator": True,
        "is_active": True,
        "is_banned": False,
    },
)
user.set_password("5whichadmin2026")
user.save()

if created:
    print("Created new user: 5which")
else:
    print("User 5which already existed, updated password + permissions")

# Create/update profile
profile, profile_created = UserProfile.objects.get_or_create(
    user=user,
    defaults={"username": "5which", "bio": "Official WRT account"},
)
if not profile_created:
    profile.bio = "Official WRT account"
    profile.save()

print(f"Superuser: {user.is_superuser}")
print(f"Staff: {user.is_staff}")
print(f"Verification: {user.verification_status}")
print(f"Profile: @{profile.username}")
print("Done.")