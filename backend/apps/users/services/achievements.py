import uuid
from apps.users.models import User, Achievement, UserAchievement
from apps.notifications.services import create_notification


def uuid_from_slug(slug: str) -> uuid.UUID:
    namespace = uuid.UUID("9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4")
    return uuid.uuid5(namespace, slug)


def check_user_achievements(user: User) -> None:
    """
    Checks if the user has completed conditions for any locked achievements,
    unlocks them, and sends a notification.
    """
    profile = getattr(user, "profile", None)
    if not profile:
        return

    # Fetch all achievements
    achievements = Achievement.objects.all()
    # Fetch already unlocked achievement IDs
    unlocked_ids = set(
        UserAchievement.objects.filter(user=user).values_list("achievement_id", flat=True)
    )

    for achievement in achievements:
        if achievement.id in unlocked_ids:
            continue

        unlocked = False
        slug = achievement.slug

        if slug == "first-post":
            unlocked = profile.posts_count >= 1
        elif slug == "100-likes":
            unlocked = profile.likes_received >= 100
        elif slug == "top-contributor":
            unlocked = profile.total_points >= 500
        elif slug == "class-warrior":
            unlocked = profile.total_points >= 100
        elif slug == "7-day-streak":
            streak = getattr(user, "streak", None)
            unlocked = streak and streak.current_streak >= 7

        if unlocked:
            # Unlock the achievement
            UserAchievement.objects.get_or_create(user=user, achievement=achievement)

            # Send real-time/database notification
            create_notification(
                recipient=user,
                ntype="achievement",
                message=f"Вы разблокировали достижение: {achievement.name}!",
                reference_id=uuid_from_slug(achievement.slug),
            )
