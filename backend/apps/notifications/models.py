from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class EmailTemplate(TimeStampedModel):
    code = models.SlugField(unique=True)
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    body = models.TextField(help_text="Django template syntax. Context depends on the event.")
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name


class Notification(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    body = models.TextField()
    category = models.CharField(max_length=32, default="general")
    is_read = models.BooleanField(default=False, db_index=True)
    link = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]


class DeviceToken(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="device_tokens")
    token = models.CharField(max_length=512, unique=True)
    platform = models.CharField(max_length=16, default="expo")
    is_active = models.BooleanField(default=True)
