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
            name="SchoolEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=200, verbose_name="Название")),
                ("description", models.TextField(blank=True, max_length=2000, verbose_name="Описание")),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("sports", "🏆 Спорт"),
                            ("esports", "🎮 Киберспорт"),
                            ("academic", "📚 Олимпиада"),
                            ("ceremony", "🎓 Церемония"),
                            ("other", "🎪 Другое"),
                        ],
                        default="other",
                        max_length=20,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("upcoming", "Предстоит"),
                            ("ongoing", "Идёт сейчас"),
                            ("finished", "Завершено"),
                            ("cancelled", "Отменено"),
                        ],
                        default="upcoming",
                        max_length=20,
                    ),
                ),
                ("location", models.CharField(blank=True, max_length=200, verbose_name="Место проведения")),
                ("max_participants", models.PositiveIntegerField(blank=True, null=True, verbose_name="Макс. участников", help_text="Оставьте пустым, если без ограничений")),
                ("starts_at", models.DateTimeField(verbose_name="Начало")),
                ("ends_at", models.DateTimeField(blank=True, null=True, verbose_name="Конец")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_events", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "school",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="events", to="school.school"),
                ),
            ],
            options={
                "verbose_name": "Событие",
                "verbose_name_plural": "События",
                "ordering": ["starts_at"],
            },
        ),
        migrations.CreateModel(
            name="EventParticipant",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("registered_at", models.DateTimeField(auto_now_add=True)),
                (
                    "event",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="participants", to="events.schoolevent"),
                ),
                (
                    "user",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="event_registrations", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={
                "verbose_name": "Участник события",
                "verbose_name_plural": "Участники событий",
                "ordering": ["registered_at"],
                "unique_together": {("event", "user")},
            },
        ),
        migrations.AddIndex(
            model_name="schoolevent",
            index=models.Index(fields=["school", "status"], name="events_scho_school_2a8043_idx"),
        ),
        migrations.AddIndex(
            model_name="schoolevent",
            index=models.Index(fields=["school", "starts_at"], name="events_scho_school_5b72f4_idx"),
        ),
    ]