from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.class_clash.models import ClashSeason, ClassBadge
from apps.class_clash.services.points import (
    get_school_leaderboard,
    get_user_contribution,
    get_week_start,
    get_top_contributors,
    get_class_streak,
)
from apps.class_clash.services.class_page import (
    get_class_by_slug,
    get_class_detail,
    get_class_stats,
    get_class_members,
    get_class_achievements,
    get_class_season_history,
    get_class_top_players,
)
from apps.class_clash.services.hall_of_fame import get_hall_of_fame
from apps.class_clash.services.gamification import (
    get_class_level,
    get_daily_quests,
    get_weekly_quests,
    get_streak_rewards,
    get_next_streak_milestone,
    get_class_achievement_progress,
)
from apps.school.models import SchoolClass


class ClassLevelView(APIView):
    """🎮 Class level & progression."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        school_class = request.user.school_class
        if not school_class:
            return Response({"level": None})
        return Response(get_class_level(school_class.total_points))


class ClassQuestView(APIView):
    """📋 Daily & weekly quests."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        daily = get_daily_quests(user)
        weekly = get_weekly_quests(user)
        return Response({"daily": daily, "weekly": weekly})


class ClassStreakRewardsView(APIView):
    """🔥 Streak milestones & rewards."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, "streak"):
            from apps.users.models import UserStreak
            streak, _ = UserStreak.objects.get_or_create(user=user)
        else:
            streak = user.streak

        return Response({
            "current_streak": streak.current_streak,
            "longest_streak": streak.longest_streak,
            "milestones": get_streak_rewards(streak.current_streak),
            "next_milestone": get_next_streak_milestone(streak.current_streak),
        })


class ClassAchievementProgressView(APIView):
    """🏆 Class achievement progress tracker."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        school_class = request.user.school_class
        if not school_class:
            return Response({"achievements": []})
        return Response({
            "achievements": get_class_achievement_progress(school_class),
        })


class HallOfFameView(APIView):
    """Hall of Fame — лучшие классы, ученики, посты."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        school_id = request.user.school_id
        if not school_id:
            return Response({"error": "Школа не найдена"}, status=400)
        return Response(get_hall_of_fame(school_id))


class ClassFeedPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"


class ClassFeedView(APIView):
    """Посты класса (лента класса)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        from apps.posts.models import Post

        school_class = get_class_by_slug(slug, request.user.school_id)
        if not school_class:
            return Response({"error": "Класс не найден"}, status=404)

        # Get posts from students of this class
        qs = Post.objects.filter(
            author__school_class=school_class,
            is_deleted=False,
        ).select_related("author__profile").order_by("-created_at")

        paginator = ClassFeedPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            results = []
            for post in page:
                profile = getattr(post.author, "profile", None)
                results.append({
                    "id": str(post.id),
                    "author_username": profile.username if profile else "unknown",
                    "author_avatar": profile.avatar.url if profile and profile.avatar else None,
                    "content": post.content,
                    "image": post.image.url if post.image else None,
                    "likes_count": post.likes_count,
                    "comments_count": post.comments_count,
                    "created_at": post.created_at.isoformat(),
                })
            return paginator.get_paginated_response(results)

        return Response({"results": [], "count": 0})


class ClassPageView(APIView):
    """Данные для страницы класса (основная информация)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        school_class = get_class_by_slug(slug, request.user.school_id)
        if not school_class:
            return Response({"error": "Класс не найден"}, status=404)
        return Response(get_class_detail(school_class))


class ClassStatsView(APIView):
    """Статистика класса."""
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        school_class = get_class_by_slug(slug, request.user.school_id)
        if not school_class:
            return Response({"error": "Класс не найден"}, status=404)
        return Response(get_class_stats(school_class))


class ClassMembersView(APIView):
    """Участники класса."""
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        school_class = get_class_by_slug(slug, request.user.school_id)
        if not school_class:
            return Response({"error": "Класс не найден"}, status=404)
        return Response({"members": get_class_members(school_class)})


class ClassAchievementsView(APIView):
    """Достижения класса."""
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        school_class = get_class_by_slug(slug, request.user.school_id)
        if not school_class:
            return Response({"error": "Класс не найден"}, status=404)
        return Response(get_class_achievements(school_class))


class ClassSeasonHistoryView(APIView):
    """История сезонов класса."""
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        school_class = get_class_by_slug(slug, request.user.school_id)
        if not school_class:
            return Response({"error": "Класс не найден"}, status=404)
        return Response({"history": get_class_season_history(school_class)})


class ClassTopPlayersView(APIView):
    """Топ игроков класса."""
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        school_class = get_class_by_slug(slug, request.user.school_id)
        if not school_class:
            return Response({"error": "Класс не найден"}, status=404)
        return Response({"players": get_class_top_players(school_class)})


class LeaderboardView(APIView):
    """Общий рейтинг классов школы."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.school_id:
            return Response({"results": []})
        results = get_school_leaderboard(request.user.school_id, weekly=False)
        return Response({"results": results})


class WeeklyLeaderboardView(APIView):
    """Рейтинг за текущую неделю."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.school_id:
            return Response({"results": [], "week_start": None})
        results = get_school_leaderboard(request.user.school_id, weekly=True)
        return Response({
            "results": results,
            "week_start": get_week_start().isoformat(),
        })


class ClassOfWeekView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.school_id:
            return Response({"class": None})
        top = (
            SchoolClass.objects.filter(school_id=request.user.school_id)
            .order_by("-weekly_points", "name")
            .first()
        )
        if not top or top.weekly_points == 0:
            return Response({"class": None, "week_start": get_week_start().isoformat()})
        return Response({
            "class": {
                "id": str(top.id),
                "name": top.name,
                "slug": top.slug,
                "weekly_points": top.weekly_points,
            },
            "week_start": get_week_start().isoformat(),
        })


class MyContributionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, "school_class"):
            from apps.users.models import User
            user = User.objects.select_related("school_class", "profile").get(pk=user.pk)
        return Response(get_user_contribution(user))


class ClashDashboardView(APIView):
    """V2 — Все данные для Class Clash dashboard одним запросом."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        school_id = user.school_id
        class_id = user.school_class_id

        # Season
        season = ClashSeason.objects.filter(is_active=True).first()
        season_data = None
        if season:
            season_data = {
                "season_number": season.season_number,
                "name": season.name or f"Season #{season.season_number}",
                "days_remaining": season.days_remaining,
                "end_date": season.end_date.isoformat(),
            }

        # Class of week
        class_of_week = None
        week_class = (
            SchoolClass.objects.filter(school_id=school_id)
            .order_by("-weekly_points", "name")
            .first()
        )
        if week_class and week_class.weekly_points > 0:
            class_of_week = {
                "id": str(week_class.id),
                "name": week_class.name,
                "slug": week_class.slug,
                "weekly_points": week_class.weekly_points,
            }

        # Weekly leaderboard
        weekly = get_school_leaderboard(school_id, weekly=True) if school_id else []

        # All-time leaderboard
        all_time = get_school_leaderboard(school_id, weekly=False) if school_id else []

        # Top contributors for user's class
        top_contributors = []
        class_streak = 0
        if class_id:
            top_contributors = get_top_contributors(class_id, limit=3)
            class_streak = get_class_streak(class_id)

        # Badges for user's class
        badges = []
        if class_id:
            badge_qs = ClassBadge.objects.filter(school_class_id=class_id).select_related("season")
            for b in badge_qs:
                badges.append({
                    "badge_type": b.badge_type,
                    "label": b.get_badge_type_display(),
                    "awarded_at": b.awarded_at.isoformat(),
                    "season": b.season.season_number if b.season else None,
                })

        return Response({
            "season": season_data,
            "class_of_week": class_of_week,
            "weekly_leaderboard": weekly,
            "all_time_leaderboard": all_time,
            "top_contributors": top_contributors,
            "class_streak": class_streak,
            "badges": badges,
            "week_start": get_week_start().isoformat(),
        })