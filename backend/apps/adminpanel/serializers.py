from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.posts.models import Post

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="profile.username", read_only=True)
    school_name = serializers.CharField(source="school.name", read_only=True, allow_null=True)
    is_verified = serializers.BooleanField(read_only=True)
    first_name = serializers.CharField(source="profile.first_name", read_only=True, default="")
    last_name = serializers.CharField(source="profile.last_name", read_only=True, default="")
    bio = serializers.CharField(source="profile.bio", read_only=True, default="")

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "school_name",
            "verification_status",
            "is_verified",
            "first_name",
            "last_name",
            "bio",
            "is_banned",
            "is_active",
            "is_school_moderator",
            "created_at",
            "last_seen_at",
        )


class AdminUpdateUserSerializer(serializers.Serializer):
    """Edit user profile fields"""
    first_name = serializers.CharField(max_length=50, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=50, required=False, allow_blank=True)
    username = serializers.CharField(max_length=50, required=False)
    bio = serializers.CharField(max_length=300, required=False, allow_blank=True)
    school_slug = serializers.SlugField(required=False)
    school_class_id = serializers.UUIDField(required=False, allow_null=True)


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
