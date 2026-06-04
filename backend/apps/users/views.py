from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.users.auth_serializers import WRTTokenObtainPairSerializer

from apps.users.models import UserProfile
from apps.users.serializers import (
    PublicProfileSerializer,
    RegisterSerializer,
    UserSerializer,
    VerifySchoolSerializer,
)
from apps.class_clash.services.points import get_week_start, get_user_contribution
from apps.class_clash.models import PointEvent
from apps.school.models import SchoolClass
from django.db.models import Sum


class CheckUsernameView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        username = request.query_params.get("username", "").strip()
        if not username:
            return Response({"available": False, "error": "Укажите username"}, status=400)
        if len(username) < 3:
            return Response({"available": False, "error": "Минимум 3 символа"})
        if len(username) > 50:
            return Response({"available": False, "error": "Максимум 50 символов"})

        profile = UserProfile.objects.filter(username__iexact=username).first()
        if not profile:
            return Response({
                "available": True,
                "was_banned": False,
                "error": None,
            })

        is_banned = profile.user.is_banned
        return Response({
            "available": False,
            "was_banned": is_banned,
            "error": "Имя пользователя занято" + (" (владелец забанен)" if is_banned else ""),
        })


class PublicProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, username):
        profile = (
            UserProfile.objects
            .select_related("user__school_class__school", "theme")
            .prefetch_related(
                "user__achievements__achievement",
                "user__streak",
            )
            .filter(username__iexact=username)
            .first()
        )
        if not profile:
            return Response({"error": "Пользователь не найден"}, status=404)

        user = profile.user

        # Contribution data
        week_start = get_week_start()
        totals = (
            PointEvent.objects.filter(user=user)
            .values("action")
            .annotate(total=Sum("points"))
        )
        by_action = {row["action"]: row["total"] for row in totals}
        week_points = (
            PointEvent.objects.filter(user=user, created_at__date__gte=week_start)
            .aggregate(s=Sum("points"))["s"] or 0
        )

        # Class rank
        class_rank = 0
        class_total = 0
        if user.school_class_id:
            school_class = user.school_class
            school = school_class.school
            classes = list(
                SchoolClass.objects.filter(school=school)
                .order_by("-total_points")
                .values_list("id", "total_points")
            )
            class_total = len(classes)
            for i, (cid, _) in enumerate(classes, 1):
                if cid == user.school_class_id:
                    class_rank = i
                    break

        # Achievements
        achievements = list(user.achievements.select_related("achievement").all())

        # Streak
        streak = getattr(user, "streak", None)

        data = PublicProfileSerializer({
            "username": profile.username,
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "avatar": profile.avatar.url if profile.avatar else None,
            "bio": profile.bio,
            "total_points": profile.total_points,
            "posts_count": profile.posts_count,
            "comments_count": profile.comments_count,
            "likes_received": profile.likes_received,
            "class_name": profile.user.school_class.name if profile.user.school_class else None,
            "school_name": profile.user.school.name if profile.user.school else None,
            "created_at": user.created_at,
            "achievements": achievements,
            "streak": streak,
            "theme": profile.theme,
            "week_points": week_points,
            "class_rank": class_rank,
            "class_total": class_total,
            "contribution_by_action": by_action,
            "is_verified": user.is_verified,
            "is_staff": user.is_staff or user.is_superuser,
        }).data
        return Response(data)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        output = UserSerializer(user)
        return Response(output.data, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return (
            type(self.request.user)
            .objects.select_related("school", "school_class", "profile__theme")
            .get(pk=self.request.user.pk)
        )

    def retrieve(self, request, *args, **kwargs):
        award_daily_login(request.user)
        return super().retrieve(request, *args, **kwargs)


class VerifySchoolView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifySchoolSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        user = (
            type(request.user)
            .objects.select_related("school", "school_class", "profile")
            .get(pk=request.user.pk)
        )
        return Response(UserSerializer(user).data)


class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        profile = request.user.profile
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")
        bio = request.data.get("bio")

        if first_name is not None:
            profile.first_name = str(first_name).strip()[:50]
        if last_name is not None:
            profile.last_name = str(last_name).strip()[:50]
        if bio is not None:
            profile.bio = str(bio).strip()[:300]

        profile.save(update_fields=["first_name", "last_name", "bio", "updated_at"])

        return Response({
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "bio": profile.bio,
        })


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = WRTTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


def award_daily_login(user):
    from apps.class_clash.services.points import award_daily_login as _award, uuid_from_date
    _award(user)