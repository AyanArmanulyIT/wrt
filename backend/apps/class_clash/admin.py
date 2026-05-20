from django.contrib import admin

from .models import PointEvent


@admin.register(PointEvent)
class PointEventAdmin(admin.ModelAdmin):
    list_display = ("user", "school_class", "action", "points", "created_at")
    list_filter = ("action", "school_class__school")
