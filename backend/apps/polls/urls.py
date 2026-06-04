from django.urls import path

from .views import PollDetailView, PollListView, PollResultsView, PollVoteView

urlpatterns = [
    path("polls/", PollListView.as_view(), name="poll-list"),
    path("polls/<uuid:poll_id>/", PollDetailView.as_view(), name="poll-detail"),
    path("polls/<uuid:poll_id>/vote/", PollVoteView.as_view(), name="poll-vote"),
    path("polls/<uuid:poll_id>/results/", PollResultsView.as_view(), name="poll-results"),
]