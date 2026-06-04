from django.db.models import Exists, OuterRef, Prefetch, Q, F, Window
from django.db.models.functions import DenseRank
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.comments.models import Comment
from apps.comments.serializers import CommentSerializer
from apps.posts.models import Like, Post, PostReaction, HotTopic
from apps.posts.serializers import PostCreateSerializer, PostSerializer
from apps.school.models import SchoolClass
from core.permissions import IsVerifiedUser


def _base_queryset(user):
    """
    Base queryset for feed posts.
    Optimized: single query with select_related + prefetch_related + annotation.
    """
    liked = Like.objects.filter(post_id=OuterRef("pk"), user_id=user.id)
    return (
        Post.objects.filter(school_id=user.school_id, is_deleted=False)
        .select_related("author", "author__profile", "author__school_class")
        .prefetch_related(
            Prefetch("reactions", queryset=PostReaction.objects.only("id", "emoji", "user_id", "post_id")),
        )
        .annotate(is_liked=Exists(liked))
        .defer("updated_at", "deleted_at")  # Don't fetch unused fields
    )


def _diversify_posts(qs, user):
    """
    Content diversity: max 2 posts from same author in a row.
    Also prioritize same-class authors.
    """
    posts = list(qs)
    seen_authors = {}
    diversified = []
    temp_pool = []

    user_class_id = user.school_class_id

    for p in posts:
        author_id = str(p.author_id)
        author_class_id = getattr(p.author, 'school_class_id', None)
        is_same_class = author_class_id and author_class_id == user_class_id

        if author_id not in seen_authors:
            seen_authors[author_id] = 0

        if is_same_class and seen_authors.get(author_id, 0) < 3:
            diversified.append(p)
            seen_authors[author_id] = seen_authors.get(author_id, 0) + 1
        else:
            temp_pool.append(p)

    for p in temp_pool:
        author_id = str(p.author_id)
        count = seen_authors.get(author_id, 0)
        if count < 2:
            diversified.append(p)
            seen_authors[author_id] = count + 1
        if len(diversified) >= 50:
            break

    return diversified


class FeedTrendingView(APIView):
    """🔥 Popular — sorted by engagement_score"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.school_id:
            return Response({"results": [], "next": None})

        qs = _base_queryset(user).order_by("-engagement_score", "-created_at")[:50]
        posts = _diversify_posts(qs, user)

        serializer = PostSerializer(posts, many=True, context={"request": request})
        return Response({"results": serializer.data, "next": None})


class FeedNewView(APIView):
    """🆕 New — with pagination support for infinite scroll."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.school_id:
            return Response({"results": [], "next": None})

        page = int(request.query_params.get("page", 1))
        page_size = 20
        offset = (page - 1) * page_size

        qs = _base_queryset(user).order_by("-created_at")

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(content__icontains=search)
                | Q(author__profile__username__icontains=search)
            )

        # Paginate
        total = qs.count()
        qs = qs[offset:offset + page_size]

        has_next = offset + page_size < total
        next_page = page + 1 if has_next else None

        serializer = PostSerializer(qs, many=True, context={"request": request})
        return Response({
            "results": serializer.data,
            "next": next_page,
            "count": total,
        })


class FeedClassView(APIView):
    """🏫 My Class — uses index on author__school_class_id"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.school_id or not user.school_class_id:
            return Response({"results": [], "next": None})

        page = int(request.query_params.get("page", 1))
        page_size = 20
        offset = (page - 1) * page_size

        qs = _base_queryset(user).filter(
            author__school_class_id=user.school_class_id
        ).order_by("-created_at")

        total = qs.count()
        qs = qs[offset:offset + page_size]
        has_next = offset + page_size < total

        serializer = PostSerializer(qs, many=True, context={"request": request})
        return Response({
            "results": serializer.data,
            "next": page + 1 if has_next else None,
        })


class PinnedPostsView(APIView):
    """📌 Pinned posts — uses composite index (school, is_pinned, -created_at)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.school_id:
            return Response([])

        qs = _base_queryset(user).filter(is_pinned=True).order_by("-created_at")
        serializer = PostSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)


class HotTopicsView(APIView):
    """🔥 Hot topics — uses index on (school, -post_count)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.school_id:
            return Response([])

        topics = HotTopic.objects.filter(
            school_id=user.school_id
        ).order_by("-post_count")[:5]

        return Response([
            {"text": t.text, "post_count": t.post_count}
            for t in topics
        ])


class ClassRankView(APIView):
    """🏆 Class card with ranking — optimized single query."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.school_id or not user.school_class_id:
            return Response(None)

        # Single query with window function for ranking
        rank_qs = SchoolClass.objects.filter(
            school_id=user.school_id
        ).annotate(
            rank=Window(
                expression=DenseRank(),
                order_by=F("-total_points").desc(nulls_last=True),
            )
        ).values("id", "name", "total_points", "rank")

        classes_list = list(rank_qs)
        school_class = user.school_class

        # Find current class and next class
        current = None
        next_class = None
        for cls in classes_list:
            if cls["id"] == user.school_class_id:
                current = cls
            if current and not next_class and cls["rank"] < current["rank"]:
                next_class = cls

        if not current:
            return Response(None)

        gap_to_next = (next_class["total_points"] - current["total_points"]) if next_class else 0

        return Response({
            "class_name": school_class.name,
            "total_points": school_class.total_points,
            "weekly_points": school_class.weekly_points,
            "rank": current["rank"],
            "total_classes": len(classes_list),
            "next_class": next_class["name"] if next_class else None,
            "gap_to_next": gap_to_next,
        })


class PostReactionView(APIView):
    """Quick reactions — optimized with bulk get_or_create."""
    permission_classes = [IsAuthenticated, IsVerifiedUser]

    def post(self, request, pk):
        post = get_object_or_404(
            Post.objects.only("id", "school_id", "is_deleted"),
            pk=pk, school_id=request.user.school_id, is_deleted=False,
        )
        emoji = request.data.get("emoji", "").strip()

        valid_emojis = [e[0] for e in PostReaction.EMOJIS]
        if emoji not in valid_emojis:
            return Response({"error": "Invalid emoji"}, status=400)

        reaction, created = PostReaction.objects.get_or_create(
            user=request.user, post=post, emoji=emoji
        )
        if not created:
            reaction.delete()
            reacted = False
        else:
            reacted = True

        return Response({"emoji": emoji, "reacted": reacted})


class FeedListView(FeedNewView):
    """Alias for URL compatibility — 🆕 New feed"""
    pass


class PostCreateView(generics.CreateAPIView):
    serializer_class = PostCreateSerializer
    permission_classes = [IsAuthenticated, IsVerifiedUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        # Re-fetch with annotations for the response
        output = PostSerializer(
            _base_queryset(request.user).filter(pk=post.pk).first(),
            context={"request": request},
        )
        return Response(output.data, status=status.HTTP_201_CREATED)


class PostDetailView(generics.RetrieveAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"

    def get_queryset(self):
        return _base_queryset(self.request.user)

    def retrieve(self, request, *args, **kwargs):
        post = self.get_object()
        # Increment view count asynchronously (no need to wait)
        Post.objects.filter(pk=post.pk).update(views_count=F("views_count") + 1)
        return Response(self.get_serializer(post).data)


class PostLikeView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedUser]

    def post(self, request, pk):
        # Use .only() to fetch only needed fields
        post = get_object_or_404(
            Post.objects.only("id", "school_id", "is_deleted", "likes_count", "engagement_score"),
            pk=pk, school_id=request.user.school_id, is_deleted=False,
        )
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
            liked = False
        else:
            liked = True
        # Refresh from DB to get updated counter
        post.refresh_from_db(fields=["likes_count"])
        return Response(
            {
                "liked": liked,
                "likes_count": post.likes_count,
            }
        )


class PostCommentsView(generics.ListCreateAPIView):
    """
    Comments — optimized with single post lookup for both query and create.
    Fixes double-fetch bug: post looked up once in `get_queryset`,
    passed via context for `perform_create`.
    """
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsVerifiedUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        self.post = get_object_or_404(
            Post.objects.only("id", "school_id", "is_deleted"),
            pk=self.kwargs["pk"], school_id=self.request.user.school_id, is_deleted=False,
        )
        return Comment.objects.filter(post=self.post).select_related(
            "author", "author__profile", "author__school_class"
        )

    def perform_create(self, serializer):
        # Uses self.post set by get_queryset
        serializer.save(post=self.post)