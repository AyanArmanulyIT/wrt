from django.db.models import F
from rest_framework import serializers

from apps.posts.models import Like, Post


class PostAuthorSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    username = serializers.CharField()
    avatar = serializers.ImageField(required=False, allow_null=True)
    class_name = serializers.CharField(allow_null=True)


class PostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    is_liked = serializers.BooleanField(read_only=True, default=False)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Post
        fields = (
            "id",
            "author",
            "content",
            "image",
            "likes_count",
            "comments_count",
            "is_liked",
            "created_at",
        )
        read_only_fields = (
            "id",
            "likes_count",
            "comments_count",
            "created_at",
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

    def create(self, validated_data):
        user = self.context["request"].user
        if not user.school_id:
            raise serializers.ValidationError("Выберите школу в профиле.")
        post = Post.objects.create(
            author=user,
            school_id=user.school_id,
            **validated_data,
        )
        profile = getattr(user, "profile", None)
        if profile:
            from apps.users.models import UserProfile

            UserProfile.objects.filter(pk=profile.pk).update(
                posts_count=F("posts_count") + 1
            )
        return post
