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


class ProfileTheme(models.Model):
    """Тема оформления профиля."""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    label_ru = models.CharField(max_length=100, blank=True)
    primary_color = models.CharField(max_length=7, default="#818cf8")  # accent
    gradient_from = models.CharField(max_length=7, default="#1e1b4b")
    gradient_to = models.CharField(max_length=7, default="#0f0f0f")
    card_border = models.CharField(max_length=7, default="#2e2e2e")
    is_premium = models.BooleanField(default=False)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "Тема профиля"
        verbose_name_plural = "Темы профиля"
        ordering = ["sort_order"]

    def __str__(self):
        return self.name


class Achievement(models.Model):
    """Достижение."""
    class Category(models.TextChoices):
        SOCIAL = "social", "Общение"
        CONTENT = "content", "Контент"
        STREAK = "streak", "Серия"
        CLASS = "class", "Класс"
        SPECIAL = "special", "Особое"

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.CharField(max_length=300, blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.SOCIAL)
    icon_name = models.CharField(max_length=50, default="Award")  # lucide icon name
    condition_code = models.CharField(max_length=100, blank=True, help_text="Код условия, напр. posts>=10")
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Достижение"
        verbose_name_plural = "Достижения"
        ordering = ["sort_order"]

    def __str__(self):
        return self.name


class UserAchievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="achievements")
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Достижение пользователя"
        verbose_name_plural = "Достижения пользователей"
        unique_together = ("user", "achievement")
        ordering = ["-unlocked_at"]

    def __str__(self):
        return f"{self.user_id} — {self.achievement.name}"


class UserStreak(models.Model):
    """Серия ежедневных входов."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="streak")
    current_streak = models.PositiveSmallIntegerField(default=0)
    longest_streak = models.PositiveSmallIntegerField(default=0)
    last_login_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Серия пользователя"
        verbose_name_plural = "Серии пользователей"

    def __str__(self):
        return f"{self.user_id} — {self.current_streak} дней"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    username = models.CharField(max_length=50, unique=True)
    first_name = models.CharField("Имя", max_length=50, blank=True, default="")
    last_name = models.CharField("Фамилия", max_length=50, blank=True, default="")
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    bio = models.CharField(max_length=300, blank=True)
    total_points = models.PositiveIntegerField(default=0)
    posts_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    likes_received = models.PositiveIntegerField(default=0)
    theme = models.ForeignKey(
        ProfileTheme,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="profiles",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Профиль"
        verbose_name_plural = "Профили"

    def __str__(self):
        return self.username