from rest_framework import serializers
from apps.posts.models import Post, PostReaction


class PostReactionSerializer(serializers.Serializer):
    emoji = serializers.CharField()
    count = serializers.IntegerField()
    user_reacted = serializers.BooleanField()


class PostAuthorSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    username = serializers.CharField()
    avatar = serializers.ImageField(required=False, allow_null=True)
    class_name = serializers.CharField(allow_null=True)


class PostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    is_liked = serializers.BooleanField(read_only=True, default=False)
    image = serializers.ImageField(required=False, allow_null=True)
    reactions = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            "id", "author", "content", "image",
            "likes_count", "comments_count", "views_count",
            "engagement_score", "is_pinned", "is_liked",
            "reactions", "created_at",
        )
        read_only_fields = (
            "id", "likes_count", "comments_count", "views_count",
            "engagement_score", "is_pinned", "created_at",
        )

    def get_author(self, obj):
        profile = getattr(obj.author, "profile", None)
        school_class = getattr(obj.author, "school_class", None)
        avatar = profile.avatar if profile and profile.avatar else None
        request = self.context.get("request")
        avatar_url = None
        if avatar and request:
            avatar_url = request.build_absolute_uri(avatar.url)
        return {
            "id": str(obj.author_id),
            "username": profile.username if profile else "unknown",
            "avatar": avatar_url,
            "class_name": school_class.name if school_class else None,
        }

    def get_reactions(self, obj):
        """Return reaction counts with user_reacted — optimized with prefetched data."""
        request = self.context.get("request")
        user = request.user if request else None

        # Use prefetched reactions to prevent N+1 queries
        all_reactions = list(obj.reactions.all())
        user_id = user.id if user else None

        result = []
        for emoji_key, emoji_char in PostReaction.EMOJIS:
            matching = [r for r in all_reactions if r.emoji == emoji_key]
            count = len(matching)
            user_reacted = any(r.user_id == user_id for r in matching) if user_id else False
            result.append({
                "emoji": emoji_char,
                "count": count,
                "user_reacted": user_reacted,
            })
        return result

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if instance.image and request:
            data["image"] = request.build_absolute_uri(instance.image.url)
        elif not instance.image:
            data["image"] = None
        return data


class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ("content", "image")

    def validate_content(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Текст поста не может быть пустым.")
        return value

    def validate_image(self, value):
        if value:
            if value.size > 8 * 1024 * 1024:
                raise serializers.ValidationError("Изображение не должно превышать 8MB.")
            allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
            if hasattr(value, "content_type") and value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    "Поддерживаются только JPEG, PNG, WebP, GIF, AVIF."
                )
        return value

    def create(self, validated_data):
        user = self.context["request"].user
        if not user.school_id:
            raise serializers.ValidationError("Выберите школу в профиле.")
        post = Post.objects.create(
            author=user,
            school_id=user.school_id,
            **validated_data,
        )
        return post