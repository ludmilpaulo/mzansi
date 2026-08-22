from django.contrib import admin

from apps.services.models import Service, ServiceFAQ, ServiceRequirement


class ServiceRequirementInline(admin.TabularInline):
    model = ServiceRequirement
    extra = 0


class ServiceFAQInline(admin.TabularInline):
    model = ServiceFAQ
    extra = 0


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "sort_order")
    list_filter = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ServiceRequirementInline, ServiceFAQInline]
