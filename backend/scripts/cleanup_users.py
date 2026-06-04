import django
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from apps.posts.models import Post, Like
from apps.comments.models import Comment
from apps.class_clash.models import PointEvent, ClashSeason, ClassBadge
from apps.notifications.models import Notification

User = get_user_model()

non_super = User.objects.filter(is_superuser=False)
count = non_super.count()
print(f"Deleting {count} non-superuser users...")
non_super.delete()

print("Clearing posts, likes, comments...")
Post.objects.all().delete()
Like.objects.all().delete()
Comment.objects.all().delete()
PointEvent.objects.all().delete()
Notification.objects.all().delete()

print(f"Total users remaining: {User.objects.count()}")
print("Done. All data cleared.")