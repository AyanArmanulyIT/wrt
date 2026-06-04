from rest_framework import serializers
from apps.chats.models import Chat, Message, OnlineStatus
from apps.users.models import User


class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email"]


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ["id", "chat", "sender", "content", "created_at", "edited_at"]
        read_only_fields = ["sender", "created_at", "edited_at"]


class ChatSerializer(serializers.ModelSerializer):
    participant_1 = UserSimpleSerializer(read_only=True)
    participant_2 = UserSimpleSerializer(read_only=True)
    school_class = serializers.StringRelatedField(read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Chat
        fields = [
            "id",
            "chat_type",
            "participant_1",
            "participant_2",
            "school_class",
            "messages",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class OnlineStatusSerializer(serializers.ModelSerializer):
    user = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = OnlineStatus
        fields = ["user", "is_online", "last_seen"]
        read_only_fields = ["last_seen"]
