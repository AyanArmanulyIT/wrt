from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.posts.models import Post

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="profile.username", read_only=True)
    school_name = serializers.CharField(source="school.name", read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "school_name",
            "verification_status",
            "is_banned",
            "is_active",
            "is_school_moderator",
            "created_at",
            "last_seen_at",
        )


class AdminPostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.profile.username", read_only=True)
    school_name = serializers.CharField(source="school.name", read_only=True)

    class Meta:
        model = Post
        fields = (
            "id",
            "author_username",
            "school_name",
            "content",
            "likes_count",
            "comments_count",
            "is_deleted",
            "created_at",
        )


class BanUserSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)
