from django.urls import path

from apps.posts.views import (
    ClassRankView,
    FeedClassView,
    FeedListView,
    FeedNewView,
    FeedTrendingView,
    HotTopicsView,
    PinnedPostsView,
    PostCommentsView,
    PostCreateView,
    PostDetailView,
    PostLikeView,
    PostReactionView,
)

urlpatterns = [
    # Feed tabs
    path("feed/", FeedListView.as_view(), name="feed"),
    path("feed/new/", FeedNewView.as_view(), name="feed-new"),
    path("feed/trending/", FeedTrendingView.as_view(), name="feed-trending"),
    path("feed/class/", FeedClassView.as_view(), name="feed-class"),
    path("feed/pinned/", PinnedPostsView.as_view(), name="feed-pinned"),
    
    # Posts
    path("posts/", PostCreateView.as_view(), name="post-create"),
    path("posts/<uuid:pk>/", PostDetailView.as_view(), name="post-detail"),
    path("posts/<uuid:pk>/like/", PostLikeView.as_view(), name="post-like"),
    path("posts/<uuid:pk>/comments/", PostCommentsView.as_view(), name="post-comments"),
    path("posts/<uuid:pk>/react/", PostReactionView.as_view(), name="post-react"),
    
    # Extras
    path("hot-topics/", HotTopicsView.as_view(), name="hot-topics"),
    path("class-rank/", ClassRankView.as_view(), name="class-rank"),
]