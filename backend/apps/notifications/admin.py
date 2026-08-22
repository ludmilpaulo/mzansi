from django.contrib import admin

from apps.notifications.models import EmailTemplate, Notification


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_active")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "category", "is_read", "created_at")
    list_filter = ("category", "is_read")
