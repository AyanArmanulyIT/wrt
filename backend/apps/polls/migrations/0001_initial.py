import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("school", "0002_add_city_to_school"),
    ]

    operations = [
        migrations.CreateModel(
            name="Poll",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=200, verbose_name="Название")),
                ("description", models.TextField(blank=True, max_length=1000, verbose_name="Описание")),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("meme", "Лучший мем недели"),
                            ("photo", "Лучшее фото"),
                            ("friendly_class", "Самый дружный класс"),
                            ("custom", "Другое"),
                        ],
                        default="custom",
                        max_length=30,
                    ),
                ),
                ("ends_at", models.DateTimeField(blank=True, null=True, verbose_name="Заканчивается")),
                ("is_active", models.BooleanField(default=True)),
                ("max_votes_per_user", models.PositiveSmallIntegerField(default=1, verbose_name="Макс. голосов на пользователя")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_polls",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="polls",
                        to="school.school",
                    ),
                ),
            ],
            options={
                "verbose_name": "Голосование",
                "verbose_name_plural": "Голосования",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="PollOption",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("text", models.CharField(max_length=200, verbose_name="Текст")),
                ("image", models.ImageField(blank=True, null=True, upload_to="polls/", verbose_name="Изображение")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "poll",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="options",
                        to="polls.poll",
                    ),
                ),
            ],
            options={
                "verbose_name": "Вариант",
                "verbose_name_plural": "Варианты",
                "ordering": ["created_at"],
            },
        ),
        migrations.CreateModel(
            name="Vote",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "option",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="votes",
                        to="polls.polloption",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="votes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Голос",
                "verbose_name_plural": "Голоса",
                "unique_together": {("user", "option")},
            },
        ),
        migrations.AddIndex(
            model_name="poll",
            index=models.Index(fields=["school", "-created_at"], name="polls_poll_school__8d908f_idx"),
        ),
        migrations.AddIndex(
            model_name="poll",
            index=models.Index(fields=["school", "is_active"], name="polls_poll_school__50e27a_idx"),
        ),
        migrations.AddIndex(
            model_name="vote",
            index=models.Index(fields=["user", "option"], name="polls_vote_user_id_36457f_idx"),
        ),
    ]