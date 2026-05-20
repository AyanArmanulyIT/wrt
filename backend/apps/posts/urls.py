from django.urls import path

from apps.posts.views import (
    FeedListView,
    PostCommentsView,
    PostCreateView,
    PostDetailView,
    PostLikeView,
)

urlpatterns = [
    path("feed/", FeedListView.as_view(), name="feed"),
    path("posts/", PostCreateView.as_view(), name="post-create"),
    path("posts/<uuid:pk>/", PostDetailView.as_view(), name="post-detail"),
    path("posts/<uuid:pk>/like/", PostLikeView.as_view(), name="post-like"),
    path("posts/<uuid:pk>/comments/", PostCommentsView.as_view(), name="post-comments"),
]
