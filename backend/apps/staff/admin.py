from django.contrib import admin

from apps.staff.models import StaffProfile


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "job_title", "accepts_consultations")
    search_fields = ("user__email", "job_title")
