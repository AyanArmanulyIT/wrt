from datetime import timedelta

from django.db import IntegrityError
from django.db.models import F, Sum
from django.utils import timezone

from apps.class_clash.models import PointEvent
from apps.school.models import SchoolClass
from apps.users.models import User, UserProfile

POINT_VALUES = {
    PointEvent.Action.POST: 10,
    PointEvent.Action.COMMENT: 3,
    PointEvent.Action.LIKE_GIVEN: 1,
    PointEvent.Action.LIKE_RECEIVED: 1,
    PointEvent.Action.DAILY_LOGIN: 2,
}

DAILY_LIMITS = {
    PointEvent.Action.POST: 5,
    PointEvent.Action.COMMENT: 20,
    PointEvent.Action.LIKE_GIVEN: 50,
    PointEvent.Action.DAILY_LOGIN: 1,
}


def get_week_start():
    """Понедельник текущей недели (локальное время)."""
    now = timezone.localdate()
    return now - timedelta(days=now.weekday())


def _count_today(user: User, action: str) -> int:
    today = timezone.localdate()
    return PointEvent.objects.filter(
        user=user,
        action=action,
        created_at__date=today,
    ).count()


def _can_award(user: User, action: str, reference_id=None) -> bool:
    if not user.is_verified or user.is_banned:
        return False
    if not user.school_class_id:
        return False
    limit = DAILY_LIMITS.get(action)
    if limit is not None and _count_today(user, action) >= limit:
        return False
    if reference_id and PointEvent.objects.filter(
        user=user, action=action, reference_id=reference_id
    ).exists():
        return False
    return True


def award_points(
    user: User,
    action: str,
    *,
    reference_id=None,
    target_class_id=None,
) -> PointEvent | None:
    """
    Начисляет очки классу и пользователю.
    target_class_id — для LIKE_RECEIVED (класс автора поста).
    """
    points = POINT_VALUES.get(action, 0)
    if points <= 0:
        return None

    class_id = target_class_id or user.school_class_id
    if not class_id:
        return None

    if not _can_award(user, action, reference_id):
        return None

    try:
        event = PointEvent.objects.create(
            user=user,
            school_class_id=class_id,
            action=action,
            points=points,
            reference_id=reference_id,
        )
    except IntegrityError:
        return None

    SchoolClass.objects.filter(pk=class_id).update(
        total_points=F("total_points") + points,
        weekly_points=F("weekly_points") + points,
    )

    if hasattr(user, "profile"):
        UserProfile.objects.filter(user=user).update(
            total_points=F("total_points") + points
        )

    from apps.notifications.services import notify_class_rank_if_leading

    notify_class_rank_if_leading(class_id)

    return event


def award_post_points(user: User, post_id) -> None:
    award_points(user, PointEvent.Action.POST, reference_id=post_id)


def award_comment_points(user: User, comment_id) -> None:
    award_points(user, PointEvent.Action.COMMENT, reference_id=comment_id)


def award_like_given(liker: User, like_id, post_author: User) -> None:
    award_points(liker, PointEvent.Action.LIKE_GIVEN, reference_id=like_id)
    if post_author.school_class_id and post_author.is_verified:
        award_points(
            post_author,
            PointEvent.Action.LIKE_RECEIVED,
            reference_id=like_id,
            target_class_id=post_author.school_class_id,
        )


def award_daily_login(user: User) -> None:
    today = timezone.localdate()
    ref = uuid_from_date(user.id, today)
    award_points(user, PointEvent.Action.DAILY_LOGIN, reference_id=ref)


def uuid_from_date(user_id, date):
    """Детерминированный UUID для ежедневного лимита входа."""
    import uuid

    namespace = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
    return uuid.uuid5(namespace, f"{user_id}-{date.isoformat()}")


def get_user_contribution(user: User) -> dict:
    week_start = get_week_start()
    totals = (
        PointEvent.objects.filter(user=user)
        .values("action")
        .annotate(total=Sum("points"))
    )
    by_action = {row["action"]: row["total"] for row in totals}
    week_points = (
        PointEvent.objects.filter(user=user, created_at__date__gte=week_start).aggregate(
            s=Sum("points")
        )["s"]
        or 0
    )
    profile = getattr(user, "profile", None)
    return {
        "total_points": profile.total_points if profile else 0,
        "week_points": week_points,
        "by_action": by_action,
        "class_name": user.school_class.name if user.school_class else None,
    }


def get_school_leaderboard(school_id, weekly: bool = False):
    qs = SchoolClass.objects.filter(school_id=school_id).select_related("school")
    if weekly:
        qs = qs.order_by("-weekly_points", "name")
        field = "weekly_points"
    else:
        qs = qs.order_by("-total_points", "name")
        field = "total_points"
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "slug": c.slug,
            "points": getattr(c, field),
            "total_points": c.total_points,
            "weekly_points": c.weekly_points,
        }
        for c in qs
    ]
