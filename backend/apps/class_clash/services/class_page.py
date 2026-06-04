from django.db.models import Count, Sum
from django.utils import timezone

from apps.class_clash.models import PointEvent, ClassBadge, ClashSeason
from apps.class_clash.services.points import get_week_start, get_top_contributors, get_class_streak
from apps.school.models import SchoolClass


def get_class_by_slug(slug: str, school_id):
    """Get a class by slug scoped to the user's school."""
    try:
        return SchoolClass.objects.get(slug=slug, school_id=school_id)
    except SchoolClass.DoesNotExist:
        return None


def get_class_detail(school_class: SchoolClass) -> dict:
    """Basic class info."""
    return {
        "id": str(school_class.id),
        "name": school_class.name,
        "slug": school_class.slug,
        "total_points": school_class.total_points,
        "weekly_points": school_class.weekly_points,
        "student_count": school_class.students.filter(is_active=True, is_banned=False).count(),
    }


def get_class_stats(school_class: SchoolClass) -> dict:
    """Statistics for the class."""
    from apps.users.models import UserProfile

    week_start = get_week_start()
    
    weekly_events = PointEvent.objects.filter(
        school_class=school_class,
        created_at__date__gte=week_start,
    )
    
    weekly_breakdown = (
        weekly_events
        .values("action")
        .annotate(
            count=Count("id"),
            points=Sum("points"),
        )
        .order_by("-points")
    )
    
    action_labels = dict(PointEvent.Action.choices)
    weekly_by_action = {
        row["action"]: {
            "label": action_labels.get(row["action"], row["action"]),
            "count": row["count"],
            "points": row["points"],
        }
        for row in weekly_breakdown
    }
    
    total_posts = (
        PointEvent.objects
        .filter(school_class=school_class, action=PointEvent.Action.POST)
        .count()
    )
    total_comments = (
        PointEvent.objects
        .filter(school_class=school_class, action=PointEvent.Action.COMMENT)
        .count()
    )
    total_likes = (
        PointEvent.objects
        .filter(
            school_class=school_class,
            action__in=[PointEvent.Action.LIKE_GIVEN, PointEvent.Action.LIKE_RECEIVED],
        )
        .count()
    )
    
    streak = get_class_streak(school_class.id)
    
    return {
        "total_points": school_class.total_points,
        "weekly_points": school_class.weekly_points,
        "streak_days": streak,
        "total_posts": total_posts,
        "total_comments": total_comments,
        "total_likes": total_likes,
        "weekly_by_action": weekly_by_action,
        "week_start": week_start.isoformat(),
        "member_count": school_class.students.filter(is_active=True, is_banned=False).count(),
    }


def get_class_members(school_class: SchoolClass) -> list:
    """List of class members with their stats."""
    from apps.users.models import UserProfile

    profiles = (
        UserProfile.objects
        .filter(user__school_class=school_class, user__is_active=True, user__is_banned=False)
        .select_related("user")
        .order_by("-total_points", "username")
    )
    
    return [
        {
            "username": p.username,
            "avatar": p.avatar.url if p.avatar else None,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "total_points": p.total_points,
            "posts_count": p.posts_count,
            "comments_count": p.comments_count,
            "is_moderator": p.user.is_school_moderator,
            "joined_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in profiles
    ]


def get_class_achievements(school_class: SchoolClass) -> dict:
    """Badges & achievements for the class."""
    from apps.users.models import UserAchievement

    # Class badges
    badges = ClassBadge.objects.filter(school_class=school_class).select_related("season")
    badge_list = [
        {
            "type": b.badge_type,
            "label": b.get_badge_type_display(),
            "awarded_at": b.awarded_at.isoformat(),
            "season_number": b.season.season_number if b.season else None,
        }
        for b in badges
    ]
    
    # Top member achievements
    top_achievers = (
        UserAchievement.objects
        .filter(user__school_class=school_class)
        .select_related("achievement", "user__profile")
        .order_by("-unlocked_at")[:20]
    )
    
    member_achievements = [
        {
            "username": ua.user.profile.username if hasattr(ua.user, "profile") else "unknown",
            "achievement_name": ua.achievement.name,
            "achievement_slug": ua.achievement.slug,
            "icon_name": ua.achievement.icon_name,
            "category": ua.achievement.category,
            "unlocked_at": ua.unlocked_at.isoformat(),
        }
        for ua in top_achievers
    ]
    
    return {
        "badges": badge_list,
        "recent_member_achievements": member_achievements,
    }


def get_class_season_history(school_class: SchoolClass) -> list:
    """History of seasons the class participated in."""
    seasons = ClashSeason.objects.filter(is_active=False).order_by("-season_number")[:10]
    
    history = []
    for season in seasons:
        season_points = (
            PointEvent.objects
            .filter(
                school_class=school_class,
                created_at__gte=season.start_date,
                created_at__lte=season.end_date,
            )
            .aggregate(total=Sum("points"))["total"]
            or 0
        )
        
        season_badges = ClassBadge.objects.filter(
            school_class=school_class,
            season=season,
        )
        
        weekly_points = 0
        if season_points > 0:
            weekly_points = season_points // max((season.days_remaining + 1), 7) if season.is_over else 0
        
        history.append({
            "season_number": season.season_number,
            "name": season.name,
            "total_points": season_points,
            "weekly_avg": weekly_points,
            "badges": [b.get_badge_type_display() for b in season_badges],
        })
    
    return history


def get_class_top_players(school_class: SchoolClass, limit: int = 20) -> list:
    """Top players in the class (all-time)."""
    from apps.users.models import UserProfile

    profiles = (
        UserProfile.objects
        .filter(user__school_class=school_class, user__is_active=True, user__is_banned=False)
        .select_related("user")
        .order_by("-total_points", "username")[:limit]
    )
    
    result = []
    for i, p in enumerate(profiles, 1):
        week_start = get_week_start()
        week_points = (
            PointEvent.objects
            .filter(
                user_id=p.user_id,
                school_class=school_class,
                created_at__date__gte=week_start,
            )
            .aggregate(s=Sum("points"))["s"]
            or 0
        )
        
        result.append({
            "rank": i,
            "username": p.username,
            "avatar": p.avatar.url if p.avatar else None,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "total_points": p.total_points,
            "week_points": week_points,
            "posts_count": p.posts_count,
            "comments_count": p.comments_count,
        })
    
    return result