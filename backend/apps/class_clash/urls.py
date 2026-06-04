from django.urls import path

from .views import (
    ClassAchievementProgressView,
    ClassAchievementsView,
    ClassFeedView,
    ClassLevelView,
    ClassMembersView,
    ClassOfWeekView,
    ClassPageView,
    ClassQuestView,
    ClassSeasonHistoryView,
    ClassStatsView,
    ClassStreakRewardsView,
    ClassTopPlayersView,
    ClashDashboardView,
    HallOfFameView,
    LeaderboardView,
    MyContributionView,
    WeeklyLeaderboardView,
)

urlpatterns = [
    path("class-clash/leaderboard/", LeaderboardView.as_view(), name="clash-leaderboard"),
    path("class-clash/weekly/", WeeklyLeaderboardView.as_view(), name="clash-weekly"),
    path("class-clash/class-of-week/", ClassOfWeekView.as_view(), name="clash-class-of-week"),
    path("class-clash/my-contribution/", MyContributionView.as_view(), name="clash-my-contribution"),
    path("class-clash/dashboard/", ClashDashboardView.as_view(), name="clash-dashboard"),
    path("class-clash/hall-of-fame/", HallOfFameView.as_view(), name="clash-hall-of-fame"),
    # Gamification
    path("class-clash/class-level/", ClassLevelView.as_view(), name="clash-class-level"),
    path("class-clash/quests/", ClassQuestView.as_view(), name="clash-quests"),
    path("class-clash/streak-rewards/", ClassStreakRewardsView.as_view(), name="clash-streak-rewards"),
    path("class-clash/achievement-progress/", ClassAchievementProgressView.as_view(), name="clash-achievement-progress"),
    # Class page endpoints
    path("class-clash/class/<slug:slug>/", ClassPageView.as_view(), name="class-page"),
    path("class-clash/class/<slug:slug>/stats/", ClassStatsView.as_view(), name="class-stats"),
    path("class-clash/class/<slug:slug>/members/", ClassMembersView.as_view(), name="class-members"),
    path("class-clash/class/<slug:slug>/achievements/", ClassAchievementsView.as_view(), name="class-achievements"),
    path("class-clash/class/<slug:slug>/history/", ClassSeasonHistoryView.as_view(), name="class-history"),
    path("class-clash/class/<slug:slug>/top-players/", ClassTopPlayersView.as_view(), name="class-top-players"),
    path("class-clash/class/<slug:slug>/feed/", ClassFeedView.as_view(), name="class-feed"),
]
