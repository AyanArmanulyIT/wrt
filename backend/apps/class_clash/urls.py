from django.urls import path

from .views import (
    ClassOfWeekView,
    LeaderboardView,
    MyContributionView,
    WeeklyLeaderboardView,
)

urlpatterns = [
    path("class-clash/leaderboard/", LeaderboardView.as_view(), name="clash-leaderboard"),
    path("class-clash/weekly/", WeeklyLeaderboardView.as_view(), name="clash-weekly"),
    path("class-clash/class-of-week/", ClassOfWeekView.as_view(), name="clash-class-of-week"),
    path("class-clash/my-contribution/", MyContributionView.as_view(), name="clash-my-contribution"),
]
