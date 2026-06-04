from django.contrib import admin

from .models import SchoolEvent, EventParticipant


class EventParticipantInline(admin.TabularInline):
    model = EventParticipant
    extra = 1
    readonly_fields = ["user", "registered_at"]
    can_delete = False


@admin.register(SchoolEvent)
class SchoolEventAdmin(admin.ModelAdmin):
    list_display = ["title", "school", "category", "status", "starts_at", "participant_count"]
    list_filter = ["category", "status", "school"]
    search_fields = ["title", "description"]
    inlines = [EventParticipantInline]


@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    list_display = ["user", "event", "registered_at"]
    list_filter = ["event__category"]