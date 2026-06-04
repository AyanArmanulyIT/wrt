from django.db.models import F
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.comments.models import Comment
from apps.posts.models import Like, Post
from apps.users.models import UserProfile, UserStreak
from apps.users.services.achievements import check_user_achievements


@receiver(post_save, sender=Post)
def post_created_or_updated(sender, instance, created, **kwargs):
    if created and not instance.is_deleted:
        profile = getattr(instance.author, "profile", None)
        if profile:
            UserProfile.objects.filter(pk=profile.pk).update(posts_count=F("posts_count") + 1)
            profile.refresh_from_db()
            check_user_achievements(instance.author)


@receiver(post_delete, sender=Post)
def post_deleted(sender, instance, **kwargs):
    profile = getattr(instance.author, "profile", None)
    if profile:
        UserProfile.objects.filter(pk=profile.pk, posts_count__gt=0).update(
            posts_count=F("posts_count") - 1
        )
        profile.refresh_from_db()
        check_user_achievements(instance.author)


@receiver(post_save, sender=Comment)
def comment_created_or_updated(sender, instance, created, **kwargs):
    if created:
        profile = getattr(instance.author, "profile", None)
        if profile:
            UserProfile.objects.filter(pk=profile.pk).update(
                comments_count=F("comments_count") + 1
            )
            profile.refresh_from_db()
            check_user_achievements(instance.author)


@receiver(post_delete, sender=Comment)
def comment_deleted(sender, instance, **kwargs):
    profile = getattr(instance.author, "profile", None)
    if profile:
        UserProfile.objects.filter(pk=profile.pk, comments_count__gt=0).update(
            comments_count=F("comments_count") - 1
        )
        profile.refresh_from_db()
        check_user_achievements(instance.author)


@receiver(post_save, sender=Like)
def like_created_or_updated(sender, instance, created, **kwargs):
    if created:
        post = instance.post
        profile = getattr(post.author, "profile", None)
        if profile:
            UserProfile.objects.filter(pk=profile.pk).update(
                likes_received=F("likes_received") + 1
            )
            profile.refresh_from_db()
            check_user_achievements(post.author)


@receiver(post_delete, sender=Like)
def like_deleted(sender, instance, **kwargs):
    post = instance.post
    profile = getattr(post.author, "profile", None)
    if profile:
        UserProfile.objects.filter(pk=profile.pk, likes_received__gt=0).update(
            likes_received=F("likes_received") - 1
        )
        profile.refresh_from_db()
        check_user_achievements(post.author)


@receiver(post_save, sender=UserStreak)
def streak_updated(sender, instance, **kwargs):
    check_user_achievements(instance.user)
