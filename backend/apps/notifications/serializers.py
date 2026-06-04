from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.SerializerMethodField()
    actor_avatar = serializers.SerializerMethodField()
    post_id = serializers.UUIDField(source="post_id", read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "type",
            "message",
            "actor_username",
            "actor_avatar",
            "post_id",
            "is_read",
            "created_at",
        )
        read_only_fields = fields

    def get_actor_username(self, obj):
        if not obj.actor_id:
            return None
        if hasattr(obj.actor, "profile") and obj.actor.profile:
            return obj.actor.profile.username
        return None

    def get_actor_avatar(self, obj):
        if not obj.actor_id:
            return None
        profile = getattr(obj.actor, "profile", None)
        if profile and profile.avatar:
            return profile.avatar.url
        return None
