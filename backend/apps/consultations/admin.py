from django.contrib import admin

from apps.consultations.models import Appointment, BlockedDate, ConsultationType


@admin.register(ConsultationType)
class ConsultationTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "duration_minutes", "price_cents", "is_active")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(BlockedDate)
class BlockedDateAdmin(admin.ModelAdmin):
    list_display = ("date", "consultant", "reason")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("client", "consultant", "consultation_type", "starts_at", "status")
    list_filter = ("status",)
