from django.contrib import admin

from apps.applications.models import Application, ApplicationNote, ApplicationStatus, ApplicationTask, ApplicationTimeline


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
