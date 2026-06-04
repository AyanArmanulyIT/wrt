from django.db.models import Count
from rest_framework import serializers

from .models import Poll, PollOption, Vote


class PollOptionSerializer(serializers.ModelSerializer):
    vote_count = serializers.IntegerField(read_only=True)
    voted = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = PollOption
        fields = ["id", "text", "image", "vote_count", "voted", "created_at"]


class PollListSerializer(serializers.ModelSerializer):
    total_votes = serializers.IntegerField(read_only=True)
    options_count = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = [
            "id", "title", "description", "category", "is_active",
            "ends_at", "max_votes_per_user", "total_votes",
            "options_count", "created_at",
        ]

    def get_options_count(self, obj):
        return obj.options.count()


class PollDetailSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()
    total_votes = serializers.IntegerField(read_only=True)
    is_over = serializers.BooleanField(read_only=True)

    class Meta:
        model = Poll
        fields = [
            "id", "title", "description", "category", "is_active",
            "ends_at", "is_over", "max_votes_per_user",
            "total_votes", "options", "created_at",
        ]

    def get_options(self, obj):
        user = self.context["request"].user
        options = obj.options.annotate(vote_count=Count("votes"))

        user_voted_option_ids = set(
            Vote.objects.filter(user=user, option__poll=obj)
            .values_list("option_id", flat=True)
        )

        return [
            {
                "id": str(opt.id),
                "text": opt.text,
                "image": opt.image.url if opt.image else None,
                "vote_count": opt.vote_count,
                "voted": str(opt.id) in user_voted_option_ids,
                "created_at": opt.created_at.isoformat(),
            }
            for opt in options
        ]


class VoteSerializer(serializers.Serializer):
    option_id = serializers.UUIDField()

    def validate_option_id(self, value):
        try:
            option = PollOption.objects.select_related("poll").get(pk=value)
        except PollOption.DoesNotExist:
            raise serializers.ValidationError("Вариант не найден")
        self.context["option"] = option
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        option = self.context["option"]
        poll = option.poll

        if not poll.is_active or poll.is_over:
            raise serializers.ValidationError("Голосование закрыто")

        user_votes = Vote.objects.filter(user=user, option__poll=poll).count()
        if user_votes >= poll.max_votes_per_user:
            raise serializers.ValidationError(
                f"Максимум {poll.max_votes_per_user} голосов на пользователя"
            )

        if Vote.objects.filter(user=user, option=option).exists():
            raise serializers.ValidationError("Вы уже голосовали за этот вариант")

        return attrs