from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class ConsultationType(TimeStampedModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveSmallIntegerField(default=45)
    price_cents = models.PositiveIntegerField(default=0)
    currency = models.CharField(max_length=8, default="ZAR")
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self) -> str:
        return self.name


class BlockedDate(TimeStampedModel):
    date = models.DateField()
    consultant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="blocked_dates",
        help_text="Leave empty to block for all consultants.",
    )
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ("date", "consultant")


class Appointment(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        RESCHEDULED = "RESCHEDULED", "Rescheduled"

    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="appointments")
    consultant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="consultant_appointments",
    )
    consultation_type = models.ForeignKey(ConsultationType, on_delete=models.PROTECT, related_name="appointments")
    application = models.ForeignKey(
        "applications.Application",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
    )
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.PENDING, db_index=True)
    meeting_link = models.URLField(blank=True)
    client_notes = models.TextField(blank=True)
    staff_notes = models.TextField(blank=True)
    cancelled_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["starts_at"]
        indexes = [models.Index(fields=["consultant", "starts_at"]), models.Index(fields=["client", "starts_at"])]
