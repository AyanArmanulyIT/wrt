from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.recommendations.serializers import (
    ActiveClassSerializer,
    TrendingUserSerializer,
)
from apps.posts.serializers import PostSerializer
from apps.recommendations.services import (
    get_active_classes,
    get_popular_posts,
    get_trending_users,
)


class RecommendationsView(APIView):
    """
    Рекомендации для ленты: популярные посты, активные пользователи, топ классов.
    Простой алгоритм MVP — сортировка по engagement_score и счётчикам.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        posts_qs = get_popular_posts(user)
        users_qs = get_trending_users(user)
        classes_qs = get_active_classes(user)

        trending_users = []
        for u in users_qs:
            profile = u.profile
            avatar_url = None
            if profile.avatar and request:
                avatar_url = request.build_absolute_uri(profile.avatar.url)
            trending_users.append({
                "id": u.id,
                "username": profile.username,
                "avatar": avatar_url,
                "class_name": u.school_class.name if u.school_class else None,
                "total_points": profile.total_points,
                "posts_count": profile.posts_count,
            })

        active_classes = [
            {
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "weekly_points": c.weekly_points,
                "total_points": c.total_points,
            }
            for c in classes_qs
        ]

        data = {
            "popular_posts": PostSerializer(
                posts_qs, many=True, context={"request": request}
            ).data,
            "trending_users": TrendingUserSerializer(trending_users, many=True).data,
            "active_classes": ActiveClassSerializer(active_classes, many=True).data,
        }

        return Response(data)
