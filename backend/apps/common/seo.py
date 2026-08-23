from django.db import models

ROBOTS_INDEX = "index,follow"
ROBOTS_NOINDEX = "noindex,nofollow"
ROBOTS_CHOICES = (
    (ROBOTS_INDEX, "Index, follow"),
    (ROBOTS_NOINDEX, "No index, no follow"),
)

MIN_LANDING_BODY_CHARS = 400


class SearchMetadataMixin(models.Model):
    """Shared discoverability fields. Titles and descriptions stay on each model."""

    og_title = models.CharField(max_length=255, blank=True)
    og_description = models.CharField(max_length=320, blank=True)
    og_image_url = models.URLField(blank=True)
    canonical_path = models.CharField(
        max_length=255,
        blank=True,
        help_text="Site-relative path such as /services/permanent-residence-permit",
    )
    robots = models.CharField(max_length=32, choices=ROBOTS_CHOICES, default=ROBOTS_INDEX)
    focus_keyword = models.CharField(max_length=128, blank=True)
    related_keywords = models.JSONField(default=list, blank=True)
    locale = models.CharField(max_length=12, default="en")

    class Meta:
        abstract = True
