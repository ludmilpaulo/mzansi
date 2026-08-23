import uuid

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
    icon = models.CharField(max_length=64, blank=True)
    color = models.CharField(max_length=16, default="#FF6B21")
    cancellation_hours = models.PositiveSmallIntegerField(default=24)
    reschedule_hours = models.PositiveSmallIntegerField(default=24)
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


class SlotHold(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    consultant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="slot_holds",
    )
    consultation_type = models.ForeignKey(ConsultationType, on_delete=models.CASCADE, related_name="slot_holds")
    starts_at = models.DateTimeField()
    expires_at = models.DateTimeField(db_index=True)
    converted = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["consultant", "starts_at", "expires_at"])]


class Appointment(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        NO_SHOW = "NO_SHOW", "No show"
        RESCHEDULED = "RESCHEDULED", "Rescheduled"

    reference_number = models.CharField(max_length=32, unique=True, blank=True)
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
    timezone_name = models.CharField(max_length=64, default="Africa/Johannesburg")
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.PENDING, db_index=True)
    meeting_link = models.URLField(blank=True)
    client_notes = models.TextField(blank=True)
    staff_notes = models.TextField(blank=True)
    cancelled_reason = models.CharField(max_length=255, blank=True)
    calendar_token = models.CharField(max_length=64, unique=True, blank=True)

    class Meta:
        ordering = ["starts_at"]
        indexes = [models.Index(fields=["consultant", "starts_at"]), models.Index(fields=["client", "starts_at"])]
        constraints = [
            models.UniqueConstraint(
                fields=["consultant", "starts_at"],
                condition=models.Q(status__in=["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW", "RESCHEDULED"]),
                name="uniq_active_consultant_slot",
            )
        ]

    def save(self, *args, **kwargs):
        creating = self.pk is None
        super().save(*args, **kwargs)
        updates: list[str] = []
        if not self.reference_number:
            self.reference_number = f"MVS-CONS-{self.pk:05d}"
            updates.append("reference_number")
        if not self.calendar_token:
            self.calendar_token = uuid.uuid4().hex
            updates.append("calendar_token")
        if updates:
            super().save(update_fields=updates)
        _ = creating
