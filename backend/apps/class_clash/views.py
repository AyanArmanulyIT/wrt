from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.class_clash.services.points import (
    get_school_leaderboard,
    get_user_contribution,
    get_week_start,
)
from apps.school.models import SchoolClass


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
