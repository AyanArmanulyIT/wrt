from datetime import timedelta, date
from django.db.models import Sum, Count, Q, F
from django.utils import timezone

from apps.class_clash.models import PointEvent, ClassBadge, ClashSeason
from apps.class_clash.services.points import get_week_start, get_class_streak
from apps.school.models import SchoolClass


# ---- Class Level / Progression ----

LEVEL_THRESHOLDS = [
    (1, 0),       # Level 1: 0 points
    (2, 100),     # Level 2: 100 points
    (3, 300),     # Level 3: 300 points
    (4, 600),     # Level 4: 600 points
    (5, 1000),    # Level 5: 1000 points
    (6, 1500),    # Level 6: 1500 points
    (7, 2100),    # Level 7: 2100 points
    (8, 2800),    # Level 8: 2800 points
    (9, 3600),    # Level 9: 3600 points
    (10, 4500),   # Level 10: 4500 points
    (11, 5500),
    (12, 6600),
    (13, 7800),
    (14, 9100),
    (15, 10500),
    (16, 12000),
    (17, 13600),
    (18, 15300),
    (19, 17100),
    (20, 19000),
]


def get_class_level(total_points: int) -> dict:
    """Calculate class level from total points."""
    level = 1
    progress = 0
    next_threshold = LEVEL_THRESHOLDS[1][1] if len(LEVEL_THRESHOLDS) > 1 else 100

    for i in range(len(LEVEL_THRESHOLDS) - 1, -1, -1):
        lvl, threshold = LEVEL_THRESHOLDS[i]
        if total_points >= threshold:
            level = lvl
            if i + 1 < len(LEVEL_THRESHOLDS):
                next_threshold = LEVEL_THRESHOLDS[i + 1][1]
                current_threshold = threshold
                progress = total_points - current_threshold
                next_threshold = next_threshold - current_threshold
                progress_pct = min(100, int((progress / max(next_threshold, 1)) * 100))
            else:
                progress_pct = 100
            break

    # Title based on level
    titles = {
        1: "Новички",
        2: "Начинающие",
        3: "Активные",
        4: "Дружные",
        5: "Сплочённые",
        6: "Командные",
        7: "Сильные",
        8: "Лидеры",
        9: "Элита",
        10: "Чемпионы",
        11: "Легенды",
        12: "Мастера",
        13: "Титаны",
        14: "Неудержимые",
        15: "Великие",
    }

    title = titles.get(level, f"Уровень {level}")

    return {
        "level": level,
        "title": title,
        "total_points": total_points,
        "progress_pct": progress_pct,
        "next_level_points": next_threshold if level < 20 else None,
    }


# ---- Daily Quests ----

DAILY_QUESTS = [
    {
        "id": "daily_post",
        "title": "Автор дня",
        "description": "Опубликуйте пост",
        "icon": "MessageSquare",
        "action": PointEvent.Action.POST,
        "target": 1,
        "reward": 15,
    },
    {
        "id": "daily_likes",
        "title": "Ценитель",
        "description": "Поставьте 5 лайков",
        "icon": "Heart",
        "action": PointEvent.Action.LIKE_GIVEN,
        "target": 5,
        "reward": 10,
    },
    {
        "id": "daily_comments",
        "title": "Болтун",
        "description": "Напишите 3 комментария",
        "icon": "MessageCircle",
        "action": PointEvent.Action.COMMENT,
        "target": 3,
        "reward": 10,
    },
    {
        "id": "daily_login_streak",
        "title": "Постоянство",
        "description": "Заходите в приложение ежедневно",
        "icon": "Zap",
        "action": None,  # Streak-based
        "target": 3,
        "reward": 20,
    },
]

WEEKLY_QUESTS = [
    {
        "id": "weekly_posts",
        "title": "Писатель недели",
        "description": "Опубликуйте 10 постов за неделю",
        "icon": "FileText",
        "action": PointEvent.Action.POST,
        "target": 10,
        "reward": 50,
    },
    {
        "id": "weekly_likes_given",
        "title": "Активный болельщик",
        "description": "Поставьте 30 лайков за неделю",
        "icon": "ThumbsUp",
        "action": PointEvent.Action.LIKE_GIVEN,
        "target": 30,
        "reward": 40,
    },
    {
        "id": "weekly_comments",
        "title": "Комментатор недели",
        "description": "Напишите 20 комментариев за неделю",
        "icon": "MessageCircle",
        "action": PointEvent.Action.COMMENT,
        "target": 20,
        "reward": 45,
    },
    {
        "id": "weekly_class_points",
        "title": "Классный вклад",
        "description": "Заработайте 50 очков для класса за неделю",
        "icon": "TrendingUp",
        "action": None,  # Points-based
        "target": 50,
        "reward": 60,
    },
]


def get_daily_quests(user) -> list:
    """Get daily quest status for a user."""
    today = timezone.localdate()
    week_start = get_week_start()

    results = []
    for quest in DAILY_QUESTS:
        progress = 0
        completed = False

        if quest["action"] == PointEvent.Action.POST:
            progress = PointEvent.objects.filter(
                user=user,
                action=PointEvent.Action.POST,
                created_at__date=today,
            ).count()
        elif quest["action"] == PointEvent.Action.LIKE_GIVEN:
            progress = PointEvent.objects.filter(
                user=user,
                action=PointEvent.Action.LIKE_GIVEN,
                created_at__date=today,
            ).count()
        elif quest["action"] == PointEvent.Action.COMMENT:
            progress = PointEvent.objects.filter(
                user=user,
                action=PointEvent.Action.COMMENT,
                created_at__date=today,
            ).count()

        completed = progress >= quest["target"]

        results.append({
            "id": quest["id"],
            "title": quest["title"],
            "description": quest["description"],
            "icon": quest["icon"],
            "progress": progress,
            "target": quest["target"],
            "completed": completed,
            "reward": quest["reward"],
            "type": "daily",
        })

    return results


def get_weekly_quests(user) -> list:
    """Get weekly quest status for a user."""
    week_start = get_week_start()

    results = []
    for quest in WEEKLY_QUESTS:
        progress = 0

        if quest["id"] == "weekly_class_points":
            # Sum all points from this user for the week
            total = PointEvent.objects.filter(
                user=user,
                created_at__date__gte=week_start,
            ).aggregate(s=Sum("points"))["s"]
            progress = total or 0
        elif quest["action"]:
            progress = PointEvent.objects.filter(
                user=user,
                action=quest["action"],
                created_at__date__gte=week_start,
            ).count()

        completed = progress >= quest["target"]

        results.append({
            "id": quest["id"],
            "title": quest["title"],
            "description": quest["description"],
            "icon": quest["icon"],
            "progress": progress,
            "target": quest["target"],
            "completed": completed,
            "reward": quest["reward"],
            "type": "weekly",
        })

    return results


# ---- Streak Rewards ----

STREAK_MILESTONES = {
    3: {"reward": 5, "title": "3 дня 🔥"},
    7: {"reward": 15, "title": "Неделя 💪"},
    14: {"reward": 30, "title": "2 недели ⚡"},
    21: {"reward": 50, "title": "21 день 🌟"},
    30: {"reward": 75, "title": "Месяц 👑"},
    60: {"reward": 150, "title": "2 месяца 🏆"},
    90: {"reward": 250, "title": "3 месяца 💎"},
}


def get_streak_rewards(current_streak: int) -> list:
    """Get milestone progress and next reward."""
    milestones = []
    for days, info in sorted(STREAK_MILESTONES.items()):
        milestones.append({
            "days": days,
            "title": info["title"],
            "reward": info["reward"],
            "reached": current_streak >= days,
            "progress": min(100, int((current_streak / days) * 100)),
        })
    return milestones


def get_next_streak_milestone(current_streak: int) -> dict | None:
    """Get the next achievable streak milestone."""
    for days, info in sorted(STREAK_MILESTONES.items()):
        if current_streak < days:
            return {
                "days": days,
                "title": info["title"],
                "reward": info["reward"],
                "remaining": days - current_streak,
                "progress": int((current_streak / days) * 100),
            }
    return None


# ---- Class Achievements ----

CLASS_ACHIEVEMENT_DEFINITIONS = [
    {
        "id": "first_post",
        "title": "Первый пост",
        "description": "Кто-то из класса опубликовал первый пост",
        "icon": "MessageSquare",
        "condition": {"action": PointEvent.Action.POST, "count": 1},
        "reward_title": "Первые шаги",
    },
    {
        "id": "hundred_posts",
        "title": "100 постов",
        "description": "Класс опубликовал 100 постов",
        "icon": "FileText",
        "condition": {"action": PointEvent.Action.POST, "count": 100},
        "reward_title": "Писатели",
    },
    {
        "id": "thousand_likes",
        "title": "1000 лайков",
        "description": "Класс получил 1000 лайков",
        "icon": "Heart",
        "condition": {"action": None, "likes": 1000},
        "reward_title": "Звёзды школы",
    },
    {
        "id": "streak_7",
        "title": "Неделя активности",
        "description": "Класс активен 7 дней подряд",
        "icon": "Flame",
        "condition": {"streak": 7},
        "reward_title": "Неудержимые",
    },
    {
        "id": "streak_30",
        "title": "Месяц активности",
        "description": "Класс активен 30 дней подряд",
        "icon": "Flame",
        "condition": {"streak": 30},
        "reward_title": "Огненные",
    },
]


def get_class_achievement_progress(school_class) -> list:
    """Check which class achievements have been earned."""
    streak = get_class_streak(school_class.id)
    total_posts = PointEvent.objects.filter(
        school_class=school_class,
        action=PointEvent.Action.POST,
    ).count()
    total_likes_given = PointEvent.objects.filter(
        school_class=school_class,
        action=PointEvent.Action.LIKE_GIVEN,
    ).count()
    total_likes_received = PointEvent.objects.filter(
        school_class=school_class,
        action=PointEvent.Action.LIKE_RECEIVED,
    ).count()
    total_likes = total_likes_given + total_likes_received

    existing_badges = set(
        ClassBadge.objects.filter(school_class=school_class)
        .values_list("badge_type", flat=True)
    )

    results = []
    for ach in CLASS_ACHIEVEMENT_DEFINITIONS:
        earned = False
        progress = 0
        target = 0

        cond = ach["condition"]
        if "streak" in cond:
            progress = streak
            target = cond["streak"]
            earned = streak >= target
        elif "count" in cond:
            if cond["action"] == PointEvent.Action.POST:
                progress = total_posts
            target = cond["count"]
            earned = progress >= target
        elif "likes" in cond:
            progress = total_likes
            target = cond["likes"]
            earned = progress >= target

        results.append({
            "id": ach["id"],
            "title": ach["title"],
            "description": ach["description"],
            "icon": ach["icon"],
            "progress": progress,
            "target": target,
            "earned": earned,
            "reward_title": ach["reward_title"],
        })

    return results