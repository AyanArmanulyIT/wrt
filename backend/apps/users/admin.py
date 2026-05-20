from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.users.models import User, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = (
        "email",
        "school",
        "verification_status",
        "is_active",
        "is_banned",
        "created_at",
    )
    list_filter = ("verification_status", "school", "is_banned", "is_staff")
    search_fields = ("email", "profile__username")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Школа", {"fields": ("school", "school_class", "verification_status", "verified_at")}),
        ("Права", {"fields": ("is_active", "is_staff", "is_superuser", "is_school_moderator", "is_banned")}),
        ("Даты", {"fields": ("last_seen_at", "created_at")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2")}),
    )
    readonly_fields = ("created_at", "verified_at")
    inlines = [UserProfileInline]


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("username", "user", "total_points")
    search_fields = ("username", "user__email")
