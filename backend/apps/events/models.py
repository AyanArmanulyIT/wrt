import uuid
from django.conf import settings
from django.db import models


class SchoolEvent(models.Model):
    """Событие/мероприятие в школе."""
    class Category(models.TextChoices):
        SPORTS = "sports", "🏆 Спорт"
        ESPORTS = "esports", "🎮 Киберспорт"
        ACADEMIC = "academic", "📚 Олимпиада"
        CEREMONY = "ceremony", "🎓 Церемония"
        OTHER = "other", "🎪 Другое"

    class Status(models.TextChoices):
        UPCOMING = "upcoming", "Предстоит"
        ONGOING = "ongoing", "Идёт сейчас"
        FINISHED = "finished", "Завершено"
        CANCELLED = "cancelled", "Отменено"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        "school.School",
        on_delete=models.CASCADE,
        related_name="events",
    )
    title = models.CharField("Название", max_length=200)
    description = models.TextField("Описание", max_length=2000, blank=True)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPCOMING,
    )
    location = models.CharField("Место проведения", max_length=200, blank=True)
    max_participants = models.PositiveIntegerField(
        "Макс. участников",
        null=True,
        blank=True,
        help_text="Оставьте пустым, если без ограничений",
    )
    starts_at = models.DateTimeField("Начало")
    ends_at = models.DateTimeField("Конец", null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_events",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Событие"
        verbose_name_plural = "События"
        ordering = ["starts_at"]
        indexes = [
            models.Index(fields=["school", "status"]),
            models.Index(fields=["school", "starts_at"]),
        ]

    def __str__(self):
        return self.title

    @property
    def participant_count(self):
        return self.participants.count()

    @property
    def is_full(self):
        if self.max_participants:
            return self.participant_count >= self.max_participants
        return False


class EventParticipant(models.Model):
    """Регистрация участника на событие."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        SchoolEvent,
        on_delete=models.CASCADE,
        related_name="participants",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_registrations",
    )
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Участник события"
        verbose_name_plural = "Участники событий"
        unique_together = [("event", "user")]
        ordering = ["registered_at"]

    def __str__(self):
        return f"{self.user_id} → {self.event.title}"