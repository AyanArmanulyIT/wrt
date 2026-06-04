from django.contrib import admin
from apps.chats.models import Chat, Message, OnlineStatus


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ["id", "chat_type", "created_at"]
    list_filter = ["chat_type", "created_at"]
    search_fields = ["participant_1__email", "participant_2__email", "school_class__name"]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["sender", "chat", "created_at"]
    list_filter = ["created_at", "chat"]
    search_fields = ["sender__email", "content"]
    readonly_fields = ["created_at", "edited_at"]


@admin.register(OnlineStatus)
class OnlineStatusAdmin(admin.ModelAdmin):
    list_display = ["user", "is_online", "last_seen"]
    list_filter = ["is_online", "last_seen"]
    search_fields = ["user__email"]
    readonly_fields = ["last_seen"]
