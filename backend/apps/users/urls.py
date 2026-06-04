from django.urls import path

from apps.users.views import (
    CheckUsernameView,
    LoginView,
    MeView,
    PublicProfileView,
    RefreshView,
    RegisterView,
    UpdateProfileView,
    VerifySchoolView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("verify/", VerifySchoolView.as_view(), name="auth-verify"),
    path("check-username/", CheckUsernameView.as_view(), name="auth-check-username"),
    path("profile/update/", UpdateProfileView.as_view(), name="auth-update-profile"),
    path("profile/<str:username>/", PublicProfileView.as_view(), name="auth-public-profile"),
]
