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
    list_display = ("name", "slug", "is_active", "sort_order", "robots")
    list_filter = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ServiceRequirementInline, ServiceFAQInline]
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "name",
                    "slug",
                    "short_description",
                    "description",
                    "who_its_for",
                    "process_overview",
                    "how_we_help",
                    "estimated_processing",
                    "icon",
                    "image",
                    "consultation_available",
                    "is_active",
                    "sort_order",
                    "official_sources",
                    "related_service_slugs",
                )
            },
        ),
        (
            "Search",
            {
                "fields": (
                    "seo_title",
                    "seo_description",
                    "og_title",
                    "og_description",
                    "og_image_url",
                    "canonical_path",
                    "robots",
                    "focus_keyword",
                    "related_keywords",
                    "locale",
                )
            },
        ),
    )
