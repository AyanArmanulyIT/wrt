from django.contrib import admin

from .models import Poll, PollOption, Vote


class PollOptionInline(admin.TabularInline):
    model = PollOption
    extra = 2


@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    list_display = ["title", "school", "category", "is_active", "ends_at", "total_votes"]
    list_filter = ["is_active", "category", "school"]
    search_fields = ["title", "description"]
    inlines = [PollOptionInline]


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ["user", "option", "created_at"]
    list_filter = ["option__poll"]