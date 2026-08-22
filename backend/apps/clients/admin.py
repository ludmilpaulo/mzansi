from django.contrib import admin

from apps.clients.models import ClientProfile


@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "nationality", "current_country", "passport_number")
    search_fields = ("user__email", "passport_number", "nationality")
