from django.contrib import admin

from apps.consultations.models import Appointment, BlockedDate, ConsultationType, SlotHold


@admin.register(ConsultationType)
class ConsultationTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "duration_minutes", "price_cents", "is_active")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(BlockedDate)
class BlockedDateAdmin(admin.ModelAdmin):
    list_display = ("date", "consultant", "reason")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("reference_number", "client", "consultant", "consultation_type", "starts_at", "status")
    list_filter = ("status",)
    search_fields = ("reference_number", "client__email", "client__first_name", "client__last_name")


@admin.register(SlotHold)
class SlotHoldAdmin(admin.ModelAdmin):
    list_display = ("consultant", "starts_at", "expires_at", "converted")
    list_filter = ("converted",)
