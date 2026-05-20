from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone

from apps.comments.models import Comment
from apps.posts.models import Like, Post
from apps.school.models import SchoolClass
from apps.users.models import User

UserModel = get_user_model()

ONLINE_THRESHOLD = timedelta(minutes=5)


def _school_filter(user, qs, field="school_id"):
    if user.is_superuser:
        return qs
    if user.school_id:
        return qs.filter(**{field: user.school_id})
    return qs.none()


def get_admin_stats(admin_user):
    users_qs = UserModel.objects.all()
    posts_qs = Post.objects.filter(is_deleted=False)
    classes_qs = SchoolClass.objects.all()

    if not admin_user.is_superuser:
        users_qs = users_qs.filter(school_id=admin_user.school_id)
        posts_qs = posts_qs.filter(school_id=admin_user.school_id)
        classes_qs = classes_qs.filter(school_id=admin_user.school_id)

    online_since = timezone.now() - ONLINE_THRESHOLD
    online_qs = users_qs.filter(
        last_seen_at__gte=online_since,
        is_banned=False,
        is_active=True,
    )

    pending = users_qs.filter(verification_status=User.VerificationStatus.PENDING).count()

    return {
        "total_users": users_qs.count(),
        "online_users": online_qs.count(),
        "total_posts": posts_qs.count(),
        "active_classes": classes_qs.filter(weekly_points__gt=0).count(),
        "pending_verifications": pending,
        "banned_users": users_qs.filter(is_banned=True).count(),
    }


def get_daily_activity(admin_user, days=7):
    since = timezone.now() - timedelta(days=days)

    def daily_counts(model, date_field="created_at", extra_filter=None):
        qs = model.objects.filter(**{f"{date_field}__gte": since})
        if not admin_user.is_superuser:
            if model is Post:
                qs = qs.filter(school_id=admin_user.school_id, is_deleted=False)
            elif model is Comment:
                qs = qs.filter(post__school_id=admin_user.school_id)
            elif model is Like:
                qs = qs.filter(post__school_id=admin_user.school_id)
            elif model is UserModel:
                qs = qs.filter(school_id=admin_user.school_id)
        if extra_filter:
            qs = qs.filter(**extra_filter)
        rows = (
            qs.annotate(day=TruncDate(date_field))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )
        return {str(r["day"]): r["count"] for r in rows if r["day"]}

    posts = daily_counts(Post)
    comments = daily_counts(Comment)
    likes = daily_counts(Like)
    new_users = daily_counts(UserModel)

    all_days = sorted(set(posts) | set(comments) | set(likes) | set(new_users))
    result = []
    for day in all_days:
        result.append({
            "date": day,
            "posts": posts.get(day, 0),
            "comments": comments.get(day, 0),
            "likes": likes.get(day, 0),
            "new_users": new_users.get(day, 0),
        })
    return result
