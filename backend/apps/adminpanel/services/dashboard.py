from datetime import timedelta, date, datetime
from django.db.models import Count, Sum, Q, Avg
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone
from django.contrib.auth import get_user_model

from apps.posts.models import Post, Like
from apps.comments.models import Comment
from apps.school.models import School, SchoolClass
from apps.users.models import UserProfile, UserStreak
from apps.class_clash.models import PointEvent

User = get_user_model()


def get_founder_dashboard(admin_user):
    """Ultimate founder dashboard with all KPIs."""
    school_id = admin_user.school_id if not admin_user.is_superuser else None
    today = timezone.localdate()
    now = timezone.now()

    # === 1. USER METRICS ===
    users_qs = User.objects.all()
    if school_id:
        users_qs = users_qs.filter(school_id=school_id)

    total_users = users_qs.count()
    verified_users = users_qs.filter(verification_status="verified").count()
    pending_users = users_qs.filter(verification_status="pending").count()

    # DAU — users active today (point_event, post, comment, like, or login)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    dau = (
        users_qs.filter(
            Q(point_events__created_at__gte=today_start)
            | Q(posts__created_at__gte=today_start)
            | Q(comments__created_at__gte=today_start)
            | Q(likes__created_at__gte=today_start)
            | Q(last_seen_at__gte=today_start)
        )
        .distinct()
        .count()
    )

    # WAU — users active in last 7 days
    week_ago = now - timedelta(days=7)
    wau = (
        users_qs.filter(
            Q(point_events__created_at__gte=week_ago)
            | Q(posts__created_at__gte=week_ago)
            | Q(comments__created_at__gte=week_ago)
            | Q(likes__created_at__gte=week_ago)
            | Q(last_seen_at__gte=week_ago)
        )
        .distinct()
        .count()
    )

    # MAU — users active in last 30 days
    month_ago = now - timedelta(days=30)
    mau = (
        users_qs.filter(
            Q(point_events__created_at__gte=month_ago)
            | Q(posts__created_at__gte=month_ago)
            | Q(comments__created_at__gte=month_ago)
            | Q(likes__created_at__gte=month_ago)
            | Q(last_seen_at__gte=month_ago)
        )
        .distinct()
        .count()
    )

    # === 2. RETENTION (Day-1, Day-7, Day-30) ===
    # Users who registered 1+ days ago and were active today
    day1_retention = _calculate_retention(users_qs, days_ago=1)
    day7_retention = _calculate_retention(users_qs, days_ago=7)
    day30_retention = _calculate_retention(users_qs, days_ago=30)

    # === 3. CONTENT METRICS ===
    posts_qs = Post.objects.filter(is_deleted=False)
    if school_id:
        posts_qs = posts_qs.filter(school_id=school_id)

    total_posts = posts_qs.count()
    posts_today = posts_qs.filter(created_at__gte=today_start).count()
    posts_this_week = posts_qs.filter(created_at__gte=week_ago).count()
    posts_this_month = posts_qs.filter(created_at__gte=month_ago).count()

    top_posts = (
        posts_qs
        .select_related("author__profile")
        .order_by("-engagement_score", "-likes_count")[:10]
    )

    # === 4. CLASS METRICS ===
    classes_qs = SchoolClass.objects.all()
    if school_id:
        classes_qs = classes_qs.filter(school_id=school_id)

    active_classes = classes_qs.filter(weekly_points__gt=0).count()
    total_classes = classes_qs.count()
    top_classes = classes_qs.order_by("-total_points")[:5]

    # === 5. GROWTH (new users per day for last 30 days) ===
    growth_data = (
        users_qs
        .filter(created_at__gte=month_ago)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )
    growth = {str(r["day"]): r["count"] for r in growth_data}

    # === 6. DAILY ACTIVITY (last 30 days) ===
    activity_data = _get_daily_activity(admin_user, days=30)

    # === 7. POST ENGAGEMENT ===
    avg_likes = posts_qs.aggregate(avg=Avg("likes_count"))["avg"] or 0
    avg_comments = posts_qs.aggregate(avg=Avg("comments_count"))["avg"] or 0
    total_likes = Like.objects.filter(post__is_deleted=False)
    total_comments = Comment.objects.all()
    if school_id:
        total_likes = total_likes.filter(post__school_id=school_id)
        total_comments = total_comments.filter(post__school_id=school_id)

    # === 8. STICKINESS (DAU/MAU ratio) ===
    stickiness = round((dau / max(mau, 1)) * 100, 1)

    # === 9. ONLINE NOW ===
    online_now = users_qs.filter(
        last_seen_at__gte=now - timedelta(minutes=5),
        is_banned=False,
        is_active=True,
    ).count()

    return {
        "users": {
            "total": total_users,
            "verified": verified_users,
            "pending": pending_users,
            "online_now": online_now,
            "dau": dau,
            "wau": wau,
            "mau": mau,
            "stickiness_pct": stickiness,
        },
        "retention": {
            "day_1": day1_retention,
            "day_7": day7_retention,
            "day_30": day30_retention,
        },
        "content": {
            "total_posts": total_posts,
            "posts_today": posts_today,
            "posts_this_week": posts_this_week,
            "posts_this_month": posts_this_month,
            "total_likes": total_likes.count(),
            "total_comments": total_comments.count(),
            "avg_likes_per_post": round(avg_likes, 1),
            "avg_comments_per_post": round(avg_comments, 1),
            "top_posts": [
                {
                    "id": str(p.id),
                    "content": p.content[:150],
                    "author_username": p.author.profile.username if hasattr(p.author, "profile") else "unknown",
                    "likes_count": p.likes_count,
                    "comments_count": p.comments_count,
                    "engagement_score": p.engagement_score,
                    "created_at": p.created_at.isoformat(),
                }
                for p in top_posts
            ],
        },
        "classes": {
            "total": total_classes,
            "active": active_classes,
            "active_pct": round((active_classes / max(total_classes, 1)) * 100, 1),
            "top_classes": [
                {
                    "name": c.name,
                    "total_points": c.total_points,
                    "weekly_points": c.weekly_points,
                    "student_count": c.students.filter(is_active=True, is_banned=False).count(),
                }
                for c in top_classes
            ],
        },
        "growth": growth,
        "activity": activity_data,
        "report_date": now.isoformat(),
    }


def _calculate_retention(users_qs, days_ago):
    """Calculate what % of users who signed up N days ago are still active."""
    target_date = timezone.localdate() - timedelta(days=days_ago)
    cohort_start = target_date
    cohort_end = target_date + timedelta(days=1)

    cohort = users_qs.filter(
        created_at__date__gte=cohort_start,
        created_at__date__lt=cohort_end,
    )
    cohort_count = cohort.count()
    if cohort_count == 0:
        return None

    # Active in last 24h
    now = timezone.now()
    active = cohort.filter(
        Q(last_seen_at__gte=now - timedelta(days=1))
        | Q(point_events__created_at__gte=now - timedelta(days=1))
    ).distinct().count()

    return round((active / cohort_count) * 100, 1)


def _get_daily_activity(admin_user, days=30):
    """Daily activity breakdown for the last N days."""
    since = timezone.now() - timedelta(days=days)
    school_id = admin_user.school_id if not admin_user.is_superuser else None

    def daily_counts(model, date_field="created_at", extra_filter=None):
        qs = model.objects.filter(**{f"{date_field}__gte": since})
        if school_id:
            if model is Post:
                qs = qs.filter(school_id=school_id, is_deleted=False)
            elif model is Comment:
                qs = qs.filter(post__school_id=school_id)
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
    new_users = daily_counts(User)

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