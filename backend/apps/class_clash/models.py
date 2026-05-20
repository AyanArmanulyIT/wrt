import uuid

from django.conf import settings
from django.db import models


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
