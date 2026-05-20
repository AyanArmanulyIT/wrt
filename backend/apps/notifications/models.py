import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        LIKE = "like", "Лайк"
        COMMENT = "comment", "Комментарий"
        CLASS_RANK = "class_rank", "Рейтинг класса"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications_sent",
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    post = models.ForeignKey(
        "posts.Post",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    message = models.CharField(max_length=300)
    reference_id = models.UUIDField(null=True, blank=True, db_index=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Уведомление"
        verbose_name_plural = "Уведомления"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read", "-created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["recipient", "type", "reference_id"],
                condition=models.Q(reference_id__isnull=False),
                name="unique_notification_per_reference",
            ),
        ]

    def __str__(self):
        return f"{self.recipient_id} — {self.type}"
