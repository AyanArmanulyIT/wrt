from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.comments.models import Comment
from apps.posts.models import Like, Post

from .services.points import award_comment_points, award_like_given, award_post_points


@receiver(post_save, sender=Post)
def post_points(sender, instance, created, **kwargs):
    if created and not instance.is_deleted:
        award_post_points(instance.author, instance.id)


@receiver(post_save, sender=Comment)
def comment_points(sender, instance, created, **kwargs):
    if created:
        award_comment_points(instance.author, instance.id)


@receiver(post_save, sender=Like)
def like_points(sender, instance, created, **kwargs):
    if created:
        post = instance.post
        award_like_given(instance.user, instance.id, post.author)
