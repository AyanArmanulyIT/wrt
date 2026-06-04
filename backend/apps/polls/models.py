import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class Poll(models.Model):
    """Голосование в школе."""
    class Category(models.TextChoices):
        MEME = "meme", "Лучший мем недели"
        PHOTO = "photo", "Лучшее фото"
        FRIENDLY_CLASS = "friendly_class", "Самый дружный класс"
        CUSTOM = "custom", "Другое"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        "school.School",
        on_delete=models.CASCADE,
        related_name="polls",
    )
    title = models.CharField("Название", max_length=200)
    description = models.TextField("Описание", max_length=1000, blank=True)
    category = models.CharField(
        max_length=30,
        choices=Category.choices,
        default=Category.CUSTOM,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_polls",
    )
    ends_at = models.DateTimeField("Заканчивается", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    max_votes_per_user = models.PositiveSmallIntegerField(
        "Макс. голосов на пользователя", default=1
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Голосование"
        verbose_name_plural = "Голосования"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["school", "-created_at"]),
            models.Index(fields=["school", "is_active"]),
        ]

    def __str__(self):
        return self.title

    @property
    def is_over(self):
        return self.ends_at and timezone.now() > self.ends_at

    @property
    def total_votes(self):
        return Vote.objects.filter(option__poll=self).count()


class PollOption(models.Model):
    """Вариант ответа в голосовании."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    poll = models.ForeignKey(
        Poll,
        on_delete=models.CASCADE,
        related_name="options",
    )
    text = models.CharField("Текст", max_length=200)
    image = models.ImageField("Изображение", upload_to="polls/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Вариант"
        verbose_name_plural = "Варианты"
        ordering = ["created_at"]

    def __str__(self):
        return self.text

    @property
    def vote_count(self):
        return self.votes.count()


class Vote(models.Model):
    """Голос пользователя."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    option = models.ForeignKey(
        PollOption,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Голос"
        verbose_name_plural = "Голоса"
        unique_together = [("user", "option")]
        indexes = [
            models.Index(fields=["user", "option"]),
        ]

    def __str__(self):
        return f"{self.user_id} -> {self.option_id}"