import uuid

from django.db import IntegrityError

from apps.class_clash.services.points import get_week_start
from apps.notifications.models import Notification
from apps.school.models import SchoolClass
from apps.users.models import User


def _actor_name(user: User) -> str:
    if hasattr(user, "profile") and user.profile:
        return user.profile.username
    return user.email.split("@")[0]


def create_notification(
    *,
    recipient: User,
    ntype: str,
    message: str,
    actor: User | None = None,
    post=None,
    reference_id=None,
) -> Notification | None:
    if actor and recipient.id == actor.id:
        return None
    if recipient.is_banned or not recipient.is_active:
        return None

    try:
        return Notification.objects.create(
            recipient=recipient,
            actor=actor,
            type=ntype,
            post=post,
            message=message,
            reference_id=reference_id,
        )
    except IntegrityError:
        return None


def notify_like(like) -> None:
    post = like.post
    author = post.author
    actor = like.user
    if author.id == actor.id:
        return
    create_notification(
        recipient=author,
        ntype=Notification.Type.LIKE,
        actor=actor,
        post=post,
        message=f"@{_actor_name(actor)} лайкнул ваш пост",
        reference_id=like.id,
    )


def notify_comment(comment) -> None:
    post = comment.post
    author = post.author
    actor = comment.author
    if author.id == actor.id:
        return
    create_notification(
        recipient=author,
        ntype=Notification.Type.COMMENT,
        actor=actor,
        post=post,
        message=f"@{_actor_name(actor)} прокомментировал ваш пост",
        reference_id=comment.id,
    )


def _week_class_ref(class_id, week_start) -> uuid.UUID:
    namespace = uuid.UUID("7f8a9b0c-1d2e-3f4a-5b6c-7d8e9f0a1b2c")
    return uuid.uuid5(namespace, f"{class_id}-{week_start.isoformat()}")


def notify_class_rank_if_leading(school_class_id) -> None:
    """Уведомляет участников класса, если он на 1-м месте по weekly_points."""
    school_class = (
        SchoolClass.objects.filter(pk=school_class_id).select_related("school").first()
    )
    if not school_class or school_class.weekly_points == 0:
        return

    top = (
        SchoolClass.objects.filter(school_id=school_class.school_id)
        .order_by("-weekly_points", "name")
        .first()
    )
    if not top or top.id != school_class.id:
        return

    week_start = get_week_start()
    ref = _week_class_ref(school_class.id, week_start)

    users = User.objects.filter(
        school_class=school_class,
        is_active=True,
        is_banned=False,
    )

    message = f"Класс {school_class.name} лидирует в Class Clash на этой неделе!"
    for user in users:
        create_notification(
            recipient=user,
            ntype=Notification.Type.CLASS_RANK,
            message=message,
            reference_id=ref,
        )
