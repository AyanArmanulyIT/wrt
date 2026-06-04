from datetime import timedelta, date
from django.db.models import Sum, Count, F, Q
from django.utils import timezone

from apps.class_clash.models import PointEvent
from apps.class_clash.services.points import get_week_start
from apps.posts.models import Post
from apps.school.models import SchoolClass
from apps.users.models import UserProfile, UserStreak


def get_month_start(dt: date = None) -> date:
    """First day of the current month."""
    if dt is None:
        dt = timezone.localdate()
    return dt.replace(day=1)


def get_hall_of_fame(school_id):
    """All Hall of Fame categories for the user's school."""
    today = timezone.localdate()
    month_start = get_month_start(today)
    week_start = get_week_start()

    return {
        "best_class_month": _get_best_class_month(school_id, month_start),
        "best_student_month": _get_best_student_month(school_id, month_start),
        "most_active_user": _get_most_active_user(school_id),
        "best_post_week": _get_best_post_week(school_id, week_start),
        "week_start": week_start.isoformat(),
        "month_start": month_start.isoformat(),
    }


def _get_best_class_month(school_id, month_start: date):
    """🏆 Лучший класс месяца — highest total points this month."""
    qs = (
        PointEvent.objects
        .filter(
            school_class__school_id=school_id,
            created_at__date__gte=month_start,
        )
        .values("school_class_id")
        .annotate(total=Sum("points"))
        .order_by("-total")[:1]
    )
    if not qs:
        return None

    row = qs[0]
    try:
        school_class = SchoolClass.objects.get(pk=row["school_class_id"])
    except SchoolClass.DoesNotExist:
        return None

    return {
        "id": str(school_class.id),
        "name": school_class.name,
        "slug": school_class.slug,
        "points": row["total"],
    }


def _get_best_student_month(school_id, month_start: date):
    """👑 Лучший ученик месяца — most points earned by a user this month."""
    qs = (
        PointEvent.objects
        .filter(
            user__school__id=school_id,
            user__is_active=True,
            user__is_banned=False,
            created_at__date__gte=month_start,
        )
        .values("user_id")
        .annotate(total=Sum("points"))
        .order_by("-total")[:1]
    )
    if not qs:
        return None

    row = qs[0]
    try:
        profile = UserProfile.objects.select_related("user__school_class").get(user_id=row["user_id"])
    except UserProfile.DoesNotExist:
        return None

    return {
        "username": profile.username,
        "avatar": profile.avatar.url if profile.avatar else None,
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "points": row["total"],
        "class_name": profile.user.school_class.name if profile.user.school_class else None,
    }


def _get_most_active_user(school_id):
    """🔥 Самый активный пользователь — highest streak + recent activity."""
    # Get user with longest streak
    top_streak = (
        UserStreak.objects
        .filter(user__school_id=school_id, user__is_active=True, user__is_banned=False)
        .select_related("user__profile", "user__school_class")
        .order_by("-current_streak", "-user__profile__total_points")[:1]
    )
    if not top_streak:
        return None

    streak = top_streak[0]
    profile = getattr(streak.user, "profile", None)
    if not profile:
        return None

    # Weekly points for this user
    week_start = get_week_start()
    week_points = (
        PointEvent.objects
        .filter(user=streak.user, created_at__date__gte=week_start)
        .aggregate(s=Sum("points"))["s"]
        or 0
    )

    return {
        "username": profile.username,
        "avatar": profile.avatar.url if profile.avatar else None,
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "streak": streak.current_streak,
        "week_points": week_points,
        "total_points": profile.total_points,
        "class_name": streak.user.school_class.name if streak.user.school_class else None,
    }


def _get_best_post_week(school_id, week_start: date):
    """⭐ Лучший пост недели — highest engagement (likes + comments) within the school."""
    qs = (
        Post.objects
        .filter(
            school_id=school_id,
            is_deleted=False,
            created_at__date__gte=week_start,
        )
        .select_related("author__profile")
        .order_by("-engagement_score", "-likes_count", "-comments_count")[:1]
    )
    if not qs:
        return None

    post = qs[0]
    profile = getattr(post.author, "profile", None)

    return {
        "id": str(post.id),
        "author_username": profile.username if profile else "unknown",
        "author_avatar": profile.avatar.url if profile and profile.avatar else None,
        "content": post.content[:200],
        "likes_count": post.likes_count,
        "comments_count": post.comments_count,
        "engagement_score": post.engagement_score,
        "created_at": post.created_at.isoformat(),
    }