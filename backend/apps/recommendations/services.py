from datetime import timedelta

from django.db.models import Exists, OuterRef
from django.utils import timezone

from apps.posts.models import Like, Post
from apps.school.models import SchoolClass
from apps.users.models import User


def get_popular_posts(user, limit=5):
    """Популярные посты школы за последние 14 дней."""
    if not user.school_id:
        return Post.objects.none()

    since = timezone.now() - timedelta(days=14)
    liked = Like.objects.filter(post_id=OuterRef("pk"), user_id=user.id)

    return (
        Post.objects.filter(
            school_id=user.school_id,
            is_deleted=False,
            created_at__gte=since,
        )
        .select_related("author", "author__profile", "author__school_class")
        .annotate(is_liked=Exists(liked))
        .order_by("-engagement_score", "-created_at")[:limit]
    )


def get_trending_users(user, limit=5):
    """Активные пользователи школы по очкам и постам."""
    if not user.school_id:
        return User.objects.none()

    return (
        User.objects.filter(
            school_id=user.school_id,
            verification_status=User.VerificationStatus.VERIFIED,
            is_active=True,
            is_banned=False,
        )
        .exclude(pk=user.pk)
        .select_related("profile", "school_class")
        .filter(profile__isnull=False)
        .order_by("-profile__total_points", "-profile__posts_count")[:limit]
    )


def get_active_classes(user, limit=5):
    """Самые активные классы школы за неделю."""
    if not user.school_id:
        return SchoolClass.objects.none()

    return (
        SchoolClass.objects.filter(school_id=user.school_id)
        .order_by("-weekly_points", "-total_points")[:limit]
    )
