from django.contrib import admin

from .models import School, SchoolClass, SchoolInviteCode


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "verification_mode", "is_active")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")


@admin.register(SchoolClass)
class SchoolClassAdmin(admin.ModelAdmin):
    list_display = ("name", "school", "weekly_points", "total_points")
    list_filter = ("school",)


@admin.register(SchoolInviteCode)
class SchoolInviteCodeAdmin(admin.ModelAdmin):
    list_display = ("code", "school", "is_active", "uses_count", "max_uses")
