from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify

from apps.common.models import TimeStampedModel
from apps.common.seo import MIN_LANDING_BODY_CHARS, SearchMetadataMixin


class SiteSetting(TimeStampedModel):
    key = models.SlugField(unique=True)
    value = models.JSONField(default=dict, blank=True)
    description = models.CharField(max_length=255, blank=True)

    def __str__(self) -> str:
        return self.key


class Page(SearchMetadataMixin, TimeStampedModel):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=255)
    excerpt = models.CharField(max_length=400, blank=True)
    body = models.TextField(blank=True)
    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)
    is_published = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.title


class FAQ(TimeStampedModel):
    question = models.CharField(max_length=400)
    answer = models.TextField()
    category = models.CharField(max_length=64, default="general")
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]


class Testimonial(TimeStampedModel):
    name = models.CharField(max_length=128)
    role = models.CharField(max_length=128, blank=True)
    quote = models.TextField()
    rating = models.PositiveSmallIntegerField(default=5)
    is_featured = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "-created_at"]


class Category(TimeStampedModel):
    name = models.CharField(max_length=128)
    slug = models.SlugField(unique=True)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Article(SearchMetadataMixin, TimeStampedModel):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    excerpt = models.CharField(max_length=400)
    body = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="articles")
    cover_image = models.ImageField(upload_to="articles/", blank=True, null=True)
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    last_reviewed_at = models.DateTimeField(null=True, blank=True)
    author_name = models.CharField(max_length=128, blank=True)
    reviewer_name = models.CharField(max_length=128, blank=True)
    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class SeoLanding(SearchMetadataMixin, TimeStampedModel):
    """Country or location pages with unique published content. No thin doorway pages."""

    KIND_COUNTRY = "country"
    KIND_LOCATION = "location"
    KIND_CHOICES = (
        (KIND_COUNTRY, "Country"),
        (KIND_LOCATION, "Location"),
    )

    kind = models.CharField(max_length=16, choices=KIND_CHOICES, db_index=True)
    slug = models.SlugField(unique=True, max_length=255)
    title = models.CharField(max_length=255)
    excerpt = models.CharField(max_length=400)
    body = models.TextField()
    audience = models.TextField(blank=True)
    pathways = models.TextField(blank=True)
    documents = models.TextField(blank=True)
    official_sources = models.JSONField(default=list, blank=True)
    faqs = models.JSONField(default=list, blank=True)
    related_service_slugs = models.JSONField(default=list, blank=True)
    related_article_slugs = models.JSONField(default=list, blank=True)
    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["kind", "title"]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        if self.is_published:
            self.full_clean()
        super().save(*args, **kwargs)

    def clean(self):
        if self.is_published and len((self.body or "").strip()) < MIN_LANDING_BODY_CHARS:
            raise ValidationError(
                {"body": "Published country and location pages need unique, substantial content."}
            )
        if not isinstance(self.official_sources, list) or not isinstance(self.faqs, list):
            raise ValidationError("Official sources and FAQs must be lists.")
        if not isinstance(self.related_service_slugs, list) or not isinstance(self.related_article_slugs, list):
            raise ValidationError("Related slugs must be lists.")
