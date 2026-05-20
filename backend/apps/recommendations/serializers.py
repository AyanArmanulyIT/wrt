from rest_framework import serializers

from apps.posts.serializers import PostSerializer


class TrendingUserSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    username = serializers.CharField()
    avatar = serializers.CharField(allow_null=True)
    class_name = serializers.CharField(allow_null=True)
    total_points = serializers.IntegerField()
    posts_count = serializers.IntegerField()


class ActiveClassSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.CharField()
    weekly_points = serializers.IntegerField()
    total_points = serializers.IntegerField()


class RecommendationsSerializer(serializers.Serializer):
    popular_posts = PostSerializer(many=True)
    trending_users = TrendingUserSerializer(many=True)
    active_classes = ActiveClassSerializer(many=True)
