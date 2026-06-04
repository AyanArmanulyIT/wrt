from django.urls import path

from .views import (
    AdminAccessView,
    AdminActivityView,
    AdminBanUserView,
    AdminDeletePostView,
    AdminPostListView,
    AdminStatsView,
    AdminUnbanUserView,
    AdminUpdateUserView,
    AdminUserListView,
    AdminVerifyUserView,
    FounderDashboardView,
)

urlpatterns = [
    path("admin/access/", AdminAccessView.as_view(), name="admin-access"),
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("admin/dashboard/", FounderDashboardView.as_view(), name="admin-dashboard"),
    path("admin/activity/", AdminActivityView.as_view(), name="admin-activity"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-users"),
    path("admin/users/<uuid:pk>/ban/", AdminBanUserView.as_view(), name="admin-ban"),
    path("admin/users/<uuid:pk>/unban/", AdminUnbanUserView.as_view(), name="admin-unban"),
    path("admin/users/<uuid:pk>/verify/", AdminVerifyUserView.as_view(), name="admin-verify"),
    path("admin/users/<uuid:pk>/update/", AdminUpdateUserView.as_view(), name="admin-update"),
    path("admin/posts/", AdminPostListView.as_view(), name="admin-posts"),
    path("admin/posts/<uuid:pk>/delete/", AdminDeletePostView.as_view(), name="admin-delete-post"),
]
