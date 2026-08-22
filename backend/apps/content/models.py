from django.db import models
from django.utils.text import slugify

from apps.common.models import TimeStampedModel


class SiteSetting(TimeStampedModel):
    key = models.SlugField(unique=True)
    value = models.JSONField(default=dict, blank=True)
    description = models.CharField(max_length=255, blank=True)

    def __str__(self) -> str:
        return self.key


class Page(TimeStampedModel):
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


class Article(TimeStampedModel):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    excerpt = models.CharField(max_length=400)
    body = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="articles")
    cover_image = models.ImageField(upload_to="articles/", blank=True, null=True)
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
