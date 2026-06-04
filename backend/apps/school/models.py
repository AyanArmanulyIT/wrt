import uuid

from django.db import models


class School(models.Model):
    class VerificationMode(models.TextChoices):
        INVITE = "invite", "Код школы"
        EMAIL = "email", "Email домена"
        CLASS_CODE = "class_code", "Код класса"
        MANUAL = "manual", "Ручная проверка"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField("Название", max_length=200)
    slug = models.SlugField("Slug", max_length=80, unique=True)
    city = models.CharField("Город", max_length=100, blank=True, default="")
    logo = models.ImageField("Логотип", upload_to="schools/logos/", blank=True, null=True)
    verification_mode = models.CharField(
        max_length=20,
        choices=VerificationMode.choices,
        default=VerificationMode.INVITE,
    )
    allowed_email_domains = models.JSONField(
        "Разрешённые домены email",
        default=list,
        blank=True,
        help_text='Например: ["school12.ru", "edu.school12.ru"]',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Школа"
        verbose_name_plural = "Школы"
        ordering = ["name"]

    def __str__(self):
        return self.name


class SchoolClass(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="classes",
    )
    name = models.CharField("Класс", max_length=20)
    slug = models.SlugField(max_length=30)
    total_points = models.PositiveIntegerField(default=0)
    weekly_points = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Класс"
        verbose_name_plural = "Классы"
        unique_together = [("school", "name")]
        ordering = ["school", "name"]
        indexes = [
            # Leaderboard: all-time ranking by school
            models.Index(fields=["school", "-total_points"]),
            # Weekly leaderboard
            models.Index(fields=["school", "-weekly_points"]),
            # "Class of the week" query (school + weekly_points > 0)
            models.Index(fields=["school", "-weekly_points", "name"]),
        ]

    def __str__(self):
        return f"{self.school.name} — {self.name}"


class SchoolInviteCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="invite_codes")
    code = models.CharField(max_length=32, unique=True)
    is_active = models.BooleanField(default=True)
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    uses_count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Код приглашения"
        verbose_name_plural = "Коды приглашения"

    def __str__(self):
        return f"{self.school.slug}: {self.code}"
