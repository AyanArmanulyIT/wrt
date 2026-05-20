from rest_framework import serializers

from apps.comments.models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.SerializerMethodField()
    author_class = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            "id",
            "post",
            "author_username",
            "author_class",
            "content",
            "created_at",
        )
        read_only_fields = ("id", "post", "created_at")

    def get_author_username(self, obj):
        return obj.author.profile.username if hasattr(obj.author, "profile") else "?"

    def get_author_class(self, obj):
        sc = getattr(obj.author, "school_class", None)
        return sc.name if sc else None

    def validate_content(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Комментарий не может быть пустым.")
        return value

    def create(self, validated_data):
        post = self.context["post"]
        return Comment.objects.create(
            author=self.context["request"].user,
            post=post,
            content=validated_data["content"],
        )
