from django.contrib import admin

from apps.applications.models import (
    Application,
    ApplicationExternalTracking,
    ApplicationNote,
    ApplicationStatus,
    ApplicationTask,
    ApplicationTimeline,
    ExternalApplicationStatus,
)


@admin.register(ApplicationStatus)
class ApplicationStatusAdmin(admin.ModelAdmin):
    list_display = ("code", "label", "category", "sort_order", "progress_weight", "is_active")
    list_editable = ("sort_order", "is_active")


class TimelineInline(admin.TabularInline):
    model = ApplicationTimeline
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("reference", "client", "service", "status", "progress", "assigned_consultant")
    list_filter = ("status", "service")
    search_fields = ("reference", "client__email")
    inlines = [TimelineInline]


@admin.register(ApplicationNote)
class ApplicationNoteAdmin(admin.ModelAdmin):
    list_display = ("application", "author", "is_visible_to_client", "created_at")


@admin.register(ApplicationTask)
class ApplicationTaskAdmin(admin.ModelAdmin):
    list_display = ("title", "application", "status", "assigned_to", "due_date")


@admin.register(ApplicationExternalTracking)
class ApplicationExternalTrackingAdmin(admin.ModelAdmin):
    list_display = (
        "application",
        "provider",
        "reference_number",
        "passport_last4",
        "current_status_label",
        "status_source",
        "tracking_enabled",
        "last_checked_at",
    )
    list_filter = ("provider", "status_source", "tracking_enabled")
    search_fields = ("reference_number", "application__reference", "application__client__email")
    readonly_fields = (
        "passport_encrypted",
        "date_of_birth_encrypted",
        "passport_last4",
        "last_checked_at",
        "last_status_changed_at",
        "created_at",
        "updated_at",
    )


@admin.register(ExternalApplicationStatus)
class ExternalApplicationStatusAdmin(admin.ModelAdmin):
    list_display = ("application", "provider", "status_label", "source", "checked_at")
    list_filter = ("provider", "source")
    readonly_fields = ("raw_status_encrypted", "checked_at", "created_at")
