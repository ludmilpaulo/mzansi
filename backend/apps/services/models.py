from django.db import models
from django.utils.text import slugify

from apps.common.models import TimeStampedModel
from apps.common.seo import SearchMetadataMixin


class Service(SearchMetadataMixin, TimeStampedModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    short_description = models.CharField(max_length=400)
    description = models.TextField()
    who_its_for = models.TextField(blank=True)
    process_overview = models.TextField(blank=True)
    estimated_processing = models.CharField(max_length=255, blank=True)
    icon = models.CharField(max_length=64, blank=True, help_text="Lucide icon name, e.g. passport")
    image = models.ImageField(upload_to="services/", blank=True, null=True)
    consultation_available = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True, db_index=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)
    how_we_help = models.TextField(blank=True)
    official_sources = models.JSONField(default=list, blank=True)
    related_service_slugs = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ServiceRequirement(TimeStampedModel):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="requirements")
    document_type = models.ForeignKey(
        "documents.DocumentType",
        on_delete=models.PROTECT,
        related_name="service_requirements",
    )
    description = models.TextField(blank=True)
    is_required = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        unique_together = ("service", "document_type")


class ServiceFAQ(TimeStampedModel):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="faqs")
    question = models.CharField(max_length=400)
    answer = models.TextField()
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]
