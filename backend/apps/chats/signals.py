from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from apps.users.models import User
from apps.chats.models import OnlineStatus, Chat


@receiver(post_save, sender=User)
def create_online_status(sender, instance, created, **kwargs):
    """Создать статус онлайна при создании пользователя"""
    if created:
        OnlineStatus.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def create_private_chats(sender, instance, created, **kwargs):
    """Создать личные чаты при создании пользователя (опционально)"""
    # Это может быть реализовано при первом сообщении
    pass
