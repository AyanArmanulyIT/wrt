from rest_framework import serializers
from django.utils import timezone

from .models import SchoolEvent, EventParticipant


class EventListSerializer(serializers.ModelSerializer):
    participant_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    is_registered = serializers.SerializerMethodField()

    class Meta:
        model = SchoolEvent
        fields = [
            "id", "title", "description", "category", "status",
            "location", "max_participants", "participant_count",
            "is_full", "is_registered", "starts_at", "ends_at",
            "created_at",
        ]

    def get_is_registered(self, obj):
        user = self.context["request"].user
        return EventParticipant.objects.filter(event=obj, user=user).exists()


class EventDetailSerializer(serializers.ModelSerializer):
    participant_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    is_registered = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()
    created_by_username = serializers.SerializerMethodField()

    class Meta:
        model = SchoolEvent
        fields = [
            "id", "title", "description", "category", "status",
            "location", "max_participants", "participant_count",
            "is_full", "is_registered", "starts_at", "ends_at",
            "created_by_username", "participants", "created_at",
        ]

    def get_is_registered(self, obj):
        user = self.context["request"].user
        return EventParticipant.objects.filter(event=obj, user=user).exists()

    def get_participants(self, obj):
        qs = EventParticipant.objects.filter(event=obj).select_related("user__profile")[:50]
        return [
            {
                "username": p.user.profile.username if hasattr(p.user, "profile") else "unknown",
                "registered_at": p.registered_at.isoformat(),
            }
            for p in qs
        ]

    def get_created_by_username(self, obj):
        if obj.created_by and hasattr(obj.created_by, "profile"):
            return obj.created_by.profile.username
        return None


class RegisterSerializer(serializers.Serializer):
    def validate(self, attrs):
        user = self.context["request"].user
        event = self.context["event"]

        if event.status not in (SchoolEvent.Status.UPCOMING, SchoolEvent.Status.ONGOING):
            raise serializers.ValidationError("Регистрация на это событие закрыта")

        if event.is_full:
            raise serializers.ValidationError("Все места заняты")

        if EventParticipant.objects.filter(event=event, user=user).exists():
            raise serializers.ValidationError("Вы уже зарегистрированы")

        return attrs


class UnregisterSerializer(serializers.Serializer):
    def validate(self, attrs):
        user = self.context["request"].user
        event = self.context["event"]

        if not EventParticipant.objects.filter(event=event, user=user).exists():
            raise serializers.ValidationError("Вы не зарегистрированы на это событие")

        return attrs