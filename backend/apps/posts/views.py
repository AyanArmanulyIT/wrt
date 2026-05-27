from django.db.models import Exists, OuterRef, Prefetch, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.comments.models import Comment
from apps.comments.serializers import CommentSerializer
from apps.posts.models import Like, Post
from apps.posts.serializers import PostCreateSerializer, PostSerializer
from core.permissions import IsVerifiedUser


def _posts_queryset(user):
    liked = Like.objects.filter(post_id=OuterRef("pk"), user_id=user.id)
    return (
        Post.objects.filter(school_id=user.school_id, is_deleted=False)
        .select_related("author", "author__profile", "author__school_class")
        .annotate(is_liked=Exists(liked))
        .order_by("-created_at")
    )


class FeedListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.school_id:
            return Post.objects.none()
        qs = _posts_queryset(user)
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(content__icontains=search)
                | Q(author__profile__username__icontains=search)
            )
        return qs


class PostCreateView(generics.CreateAPIView):
    serializer_class = PostCreateSerializer
    permission_classes = [IsAuthenticated, IsVerifiedUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        output = PostSerializer(
            _posts_queryset(request.user).filter(pk=post.pk).first(),
            context={"request": request},
        )
        return Response(output.data, status=status.HTTP_201_CREATED)


class PostDetailView(generics.RetrieveAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "pk"

    def get_queryset(self):
        return _posts_queryset(self.request.user)


class PostLikeView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedUser]

    def post(self, request, pk):
        post = get_object_or_404(
            Post,
            pk=pk,
            school_id=request.user.school_id,
            is_deleted=False,
        )
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
            liked = False
        else:
            liked = True
        post.refresh_from_db()
        return Response(
            {
                "liked": liked,
                "likes_count": post.likes_count,
            }
        )


class PostCommentsView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsVerifiedUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        post = get_object_or_404(
            Post,
            pk=self.kwargs["pk"],
            school_id=self.request.user.school_id,
            is_deleted=False,
        )
        return Comment.objects.filter(post=post).select_related(
            "author", "author__profile", "author__school_class"
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["post"] = get_object_or_404(Post, pk=self.kwargs["pk"])
        return ctx

    def perform_create(self, serializer):
        post = get_object_or_404(
            Post,
            pk=self.kwargs["pk"],
            school_id=self.request.user.school_id,
            is_deleted=False,
        )
        serializer.save(post=post)
