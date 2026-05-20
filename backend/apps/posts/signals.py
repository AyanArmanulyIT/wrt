from django.db.models import F
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.comments.models import Comment
from apps.posts.models import Like, Post


def _recalc_engagement(post: Post):
    score = post.likes_count * 2 + post.comments_count * 3
    Post.objects.filter(pk=post.pk).update(engagement_score=score)


@receiver(post_save, sender=Like)
def like_created(sender, instance, created, **kwargs):
    if created:
        Post.objects.filter(pk=instance.post_id).update(likes_count=F("likes_count") + 1)
        post = Post.objects.get(pk=instance.post_id)
        _recalc_engagement(post)


@receiver(post_delete, sender=Like)
def like_deleted(sender, instance, **kwargs):
    Post.objects.filter(pk=instance.post_id, likes_count__gt=0).update(
        likes_count=F("likes_count") - 1
    )
    post = Post.objects.get(pk=instance.post_id)
    _recalc_engagement(post)


@receiver(post_save, sender=Comment)
def comment_created(sender, instance, created, **kwargs):
    if created:
        Post.objects.filter(pk=instance.post_id).update(
            comments_count=F("comments_count") + 1
        )
        post = Post.objects.get(pk=instance.post_id)
        _recalc_engagement(post)


@receiver(post_delete, sender=Comment)
def comment_deleted(sender, instance, **kwargs):
    Post.objects.filter(pk=instance.post_id, comments_count__gt=0).update(
        comments_count=F("comments_count") - 1
    )
    post = Post.objects.get(pk=instance.post_id)
    _recalc_engagement(post)
