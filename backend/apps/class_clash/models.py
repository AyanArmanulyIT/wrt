import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


def _default_season_end():
    return timezone.now() + timedelta(days=7)


class ClashSeason(models.Model):
    """Сезон Class Clash."""
    season_number = models.PositiveIntegerField(unique=True)
    name = models.CharField(max_length=100, blank=True)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(default=_default_season_end)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Сезон"
        verbose_name_plural = "Сезоны"
        ordering = ["-season_number"]

    def __str__(self):
        return f"Season #{self.season_number}"

    @property
    def is_over(self):
        return timezone.now() > self.end_date

    @property
    def days_remaining(self):
        delta = self.end_date - timezone.now()
        return max(delta.days, 0)


class ClassBadge(models.Model):
    """Значок класса (Most Active, Fastest Growing, #1 This Week)."""
    class BadgeType(models.TextChoices):
        MOST_ACTIVE = "most_active", "🔥 Most Active"
        FASTEST_GROWING = "fastest_growing", "⚡ Fastest Growing"
        NUMBER_ONE = "number_one", "👑 #1 This Week"

    school_class = models.ForeignKey(
        "school.SchoolClass",
        on_delete=models.CASCADE,
        related_name="badges",
    )
    badge_type = models.CharField(max_length=30, choices=BadgeType.choices)
    awarded_at = models.DateTimeField(auto_now_add=True)
    season = models.ForeignKey(
        ClashSeason,
        on_delete=models.CASCADE,
        related_name="badges",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Значок класса"
        verbose_name_plural = "Значки классов"
        ordering = ["-awarded_at"]
        indexes = [
            models.Index(fields=["school_class", "badge_type"]),
        ]

    def __str__(self):
        return f"{self.get_badge_type_display()} — {self.school_class.name}"


class PointEvent(models.Model):
    class Action(models.TextChoices):
        POST = "post", "Пост"
        COMMENT = "comment", "Комментарий"
        LIKE_GIVEN = "like_given", "Лайк поставлен"
        LIKE_RECEIVED = "like_received", "Лайк получен"
        DAILY_LOGIN = "daily_login", "Ежедневный вход"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="point_events",
    )
    school_class = models.ForeignKey(
        "school.SchoolClass",
        on_delete=models.CASCADE,
        related_name="point_events",
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    points = models.PositiveSmallIntegerField()
    reference_id = models.UUIDField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Событие очков"
        verbose_name_plural = "События очков"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "action", "created_at"]),
            models.Index(fields=["school_class", "-created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "action", "reference_id"],
                condition=models.Q(reference_id__isnull=False),
                name="unique_point_event_per_reference",
            ),
        ]

    def __str__(self):
        return f"{self.user_id} +{self.points} ({self.action})"