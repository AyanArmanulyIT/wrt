from django.contrib.auth import get_user_model
from django.db import models
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.adminpanel.permissions import IsAdminUser, user_has_admin_access
from apps.adminpanel.serializers import (
    AdminPostSerializer,
    AdminUserSerializer,
    AdminUpdateUserSerializer,
    BanUserSerializer,
)
from apps.school.models import School, SchoolClass
from apps.adminpanel.services import get_admin_stats, get_daily_activity
from apps.adminpanel.services.dashboard import get_founder_dashboard
from apps.posts.models import Post

User = get_user_model()


def _check_school_scope(admin, target_school_id):
    if admin.is_superuser:
        return
    if target_school_id != admin.school_id:
        raise PermissionDenied("Нельзя модерировать другую школу.")


class AdminAccessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "allowed": user_has_admin_access(request.user),
            "is_superuser": request.user.is_superuser,
            "school_name": request.user.school.name if request.user.school else None,
        })


class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        return Response(get_admin_stats(request.user))


class FounderDashboardView(APIView):
    """🚀 Ultimate Founder Dashboard — every KPI in one view."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        return Response(get_founder_dashboard(request.user))


class AdminActivityView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        days = int(request.query_params.get("days", 7))
        return Response({"days": get_daily_activity(request.user, days=days)})


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        qs = User.objects.select_related("profile", "school").order_by("-created_at")
        if not self.request.user.is_superuser:
            qs = qs.filter(school_id=self.request.user.school_id)
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                models.Q(email__icontains=search)
                | models.Q(profile__username__icontains=search)
            )
        status_filter = self.request.query_params.get("status")
        if status_filter == "pending":
            qs = qs.filter(verification_status=User.VerificationStatus.PENDING)
        elif status_filter == "banned":
            qs = qs.filter(is_banned=True)
        return qs[:100]


class AdminBanUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        user = get_object_or_404(User.objects.select_related("school"), pk=pk)
        _check_school_scope(request.user, user.school_id)
        serializer = BanUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.is_banned = True
        user.banned_at = timezone.now()
        user.ban_reason = serializer.validated_data.get("reason", "")
        user.save(update_fields=["is_banned", "banned_at", "ban_reason", "updated_at"])
        return Response(AdminUserSerializer(user).data)


class AdminUnbanUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        user = get_object_or_404(User.objects.select_related("profile", "school"), pk=pk)
        _check_school_scope(request.user, user.school_id)
        user.is_banned = False
        user.banned_at = None
        user.ban_reason = ""
        user.save(update_fields=["is_banned", "banned_at", "ban_reason", "updated_at"])
        return Response(AdminUserSerializer(user).data)


class AdminVerifyUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        user = get_object_or_404(User.objects.select_related("profile", "school"), pk=pk)
        _check_school_scope(request.user, user.school_id)
        user.mark_verified("manual")
        user = User.objects.select_related("profile", "school").get(pk=user.pk)
        return Response(AdminUserSerializer(user).data)


class AdminUpdateUserView(APIView):
    """Edit user profile: first_name, last_name, username, bio, school, class"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, pk):
        user = get_object_or_404(User.objects.select_related("profile", "school"), pk=pk)
        _check_school_scope(request.user, user.school_id)
        serializer = AdminUpdateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        profile = user.profile

        # Update profile fields
        if "first_name" in data:
            profile.first_name = data["first_name"][:50]
        if "last_name" in data:
            profile.last_name = data["last_name"][:50]
        if "bio" in data:
            profile.bio = data["bio"][:300]
        if "username" in data:
            new_username = data["username"].strip()
            if new_username and new_username.lower() != profile.username.lower():
                if User.objects.filter(profile__username__iexact=new_username).exists():
                    return Response({"error": "Username already taken"}, status=400)
                profile.username = new_username
        profile.save(update_fields=["first_name", "last_name", "bio", "username", "updated_at"])

        # Update school
        if "school_slug" in data:
            school = get_object_or_404(School, slug=data["school_slug"])
            if not request.user.is_superuser and school.id != request.user.school_id:
                return Response({"error": "Cannot move user to another school"}, status=403)
            user.school = school
            user.school_class = None  # reset class when school changes

        # Update class
        if "school_class_id" in data:
            school_class = None
            if data["school_class_id"]:
                school_class = get_object_or_404(
                    SchoolClass, id=data["school_class_id"], school=user.school
                )
            user.school_class = school_class

        user.save(update_fields=["school_id", "school_class_id", "updated_at"])
        user = User.objects.select_related("profile", "school").get(pk=user.pk)
        return Response(AdminUserSerializer(user).data)


class AdminPostListView(generics.ListAPIView):
    serializer_class = AdminPostSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        qs = Post.objects.select_related("author", "author__profile", "school").order_by(
            "-created_at"
        )
        if not self.request.user.is_superuser:
            qs = qs.filter(school_id=self.request.user.school_id)
        if self.request.query_params.get("deleted") == "true":
            return qs.filter(is_deleted=True)[:100]
        return qs.filter(is_deleted=False)[:100]


class AdminDeletePostView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        _check_school_scope(request.user, post.school_id)
        post.is_deleted = True
        post.deleted_at = timezone.now()
        post.save(update_fields=["is_deleted", "deleted_at", "updated_at"])
        return Response({"deleted": True})
