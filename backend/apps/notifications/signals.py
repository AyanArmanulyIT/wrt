from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.comments.models import Comment
from apps.posts.models import Like

from .services import notify_comment, notify_like


@receiver(post_save, sender=Like)
def on_like_created(sender, instance, created, **kwargs):
    if created:
        notify_like(instance)


@receiver(post_save, sender=Comment)
def on_comment_created(sender, instance, created, **kwargs):
    if created:
        notify_comment(instance)
