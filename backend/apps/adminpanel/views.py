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
    BanUserSerializer,
)
from apps.adminpanel.services import get_admin_stats, get_daily_activity
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
