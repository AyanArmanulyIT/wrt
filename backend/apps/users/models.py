import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.school.models import School, SchoolClass
from apps.users.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "На проверке"
        VERIFIED = "verified", "Подтверждён"
        REJECTED = "rejected", "Отклонён"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField("Email", unique=True)
    school = models.ForeignKey(
        School,
        on_delete=models.PROTECT,
        related_name="users",
        null=True,
        blank=True,
    )
    school_class = models.ForeignKey(
        SchoolClass,
        on_delete=models.SET_NULL,
        related_name="students",
        null=True,
        blank=True,
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    verification_method = models.CharField(max_length=30, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_banned = models.BooleanField(default=False)
    banned_at = models.DateTimeField(null=True, blank=True)
    ban_reason = models.TextField(blank=True)
    is_school_moderator = models.BooleanField(default=False)
    last_seen_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        return self.email

    @property
    def is_verified(self):
        return self.verification_status == self.VerificationStatus.VERIFIED

    def mark_verified(self, method: str = ""):
        self.verification_status = self.VerificationStatus.VERIFIED
        self.verification_method = method
        self.verified_at = timezone.now()
        self.save(
            update_fields=[
                "verification_status",
                "verification_method",
                "verified_at",
                "updated_at",
            ]
        )


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    username = models.CharField(max_length=50, unique=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    bio = models.CharField(max_length=300, blank=True)
    total_points = models.PositiveIntegerField(default=0)
    posts_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    likes_received = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Профиль"
        verbose_name_plural = "Профили"

    def __str__(self):
        return self.username
