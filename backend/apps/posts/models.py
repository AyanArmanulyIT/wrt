import uuid

from django.conf import settings
from django.db import models


class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posts",
    )
    school = models.ForeignKey(
        "school.School",
        on_delete=models.CASCADE,
        related_name="posts",
    )
    content = models.TextField(max_length=2000)
    image = models.ImageField(upload_to="posts/", blank=True, null=True)
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)
    engagement_score = models.FloatField(default=0.0)
    is_pinned = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Пост"
        verbose_name_plural = "Посты"
        ordering = ["-created_at"]
        indexes = [
            # School feed: most common query path
            models.Index(fields=["school", "is_deleted", "-created_at"]),
            # Engagement-based sorting (trending)
            models.Index(fields=["-engagement_score"]),
            # User's own posts
            models.Index(fields=["author", "-created_at"]),
            # Pinned announcements
            models.Index(fields=["school", "is_pinned", "-created_at"]),
            # Analytics: daily counts
            models.Index(fields=["school", "created_at"]),
        ]

    def save(self, *args, **kwargs):
        """Auto-calculate engagement score on save"""
        self.engagement_score = (
            self.likes_count * 2.0 +
            self.comments_count * 3.0 +
            self.views_count * 0.2
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.author_id} — {self.content[:40]}"


class PostReaction(models.Model):
    """Quick reactions: 🔥 👍 😂 💀"""
    EMOJIS = [
        ("fire", "🔥"),
        ("like", "👍"),
        ("laugh", "😂"),
        ("skull", "💀"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="post_reactions",
    )
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="reactions")
    emoji = models.CharField(max_length=20, choices=EMOJIS)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Реакция"
        verbose_name_plural = "Реакции"
        unique_together = [("user", "post", "emoji")]
        indexes = [
            # Optimize reaction count queries per post
            models.Index(fields=["post", "emoji"]),
            # Optimize "did user react" queries
            models.Index(fields=["user", "post", "emoji"]),
        ]


class HotTopic(models.Model):
    """Горячие темы — часто упоминаемые слова/фразы"""
    school = models.ForeignKey(
        "school.School",
        on_delete=models.CASCADE,
        related_name="hot_topics",
    )
    text = models.CharField(max_length=100)
    post_count = models.PositiveIntegerField(default=1)
    last_used = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Горячая тема"
        verbose_name_plural = "Горячие темы"
        unique_together = [("school", "text")]
        indexes = [
            models.Index(fields=["school", "-post_count"]),
        ]


class Like(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="likes",
    )
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Лайк"
        verbose_name_plural = "Лайки"
        unique_together = [("user", "post")]
        indexes = [
            # Analytics: count likes per post
            models.Index(fields=["post", "-created_at"]),
            # User's like history
            models.Index(fields=["user", "-created_at"]),
        ]