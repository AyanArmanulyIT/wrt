from django.apps import AppConfig


class ClassClashConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.class_clash"
    verbose_name = "Class Clash"

    def ready(self):
        import apps.class_clash.signals  # noqa: F401
