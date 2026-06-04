from datetime import timedelta
from django.utils import timezone
from apps.users.models import UserStreak, User


def update_user_streak(user: User) -> UserStreak:
    """
    Updates the user's daily login streak.
    - If last login was yesterday (today - 1 day), streak is incremented.
    - If last login was today, we do nothing.
    - If last login was before yesterday or None, streak is reset/set to 1.
    """
    today = timezone.localdate()
    streak, created = UserStreak.objects.get_or_create(user=user)

    if created or not streak.last_login_date:
        streak.current_streak = 1
        streak.longest_streak = max(streak.longest_streak, 1)
        streak.last_login_date = today
        streak.save()
    else:
        last_login = streak.last_login_date
        if last_login == today:
            # Already logged in today
            pass
        elif last_login == today - timedelta(days=1):
            # Yesterday - increment streak
            streak.current_streak += 1
            streak.longest_streak = max(streak.longest_streak, streak.current_streak)
            streak.last_login_date = today
            streak.save()
        else:
            # Missed a day - reset streak to 1
            streak.current_streak = 1
            streak.last_login_date = today
            streak.save()

    return streak
