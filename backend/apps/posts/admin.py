from django.contrib import admin

from .models import Like, Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "school", "likes_count", "comments_count", "created_at")
    list_filter = ("school", "is_deleted")
    search_fields = ("content", "author__email")


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("user", "post", "created_at")
