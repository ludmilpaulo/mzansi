from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class Invoice(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ISSUED = "ISSUED", "Issued"
        PAID = "PAID", "Paid"
        VOID = "VOID", "Void"
        OVERDUE = "OVERDUE", "Overdue"

    number = models.CharField(max_length=32, unique=True)
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="invoices")
    application = models.ForeignKey(
        "applications.Application",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
    )
    appointment = models.ForeignKey(
        "consultations.Appointment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
    )
    description = models.CharField(max_length=255)
    amount_cents = models.PositiveIntegerField()
    currency = models.CharField(max_length=8, default="ZAR")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ISSUED, db_index=True)
    due_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.number


class Payment(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name="payments")
    provider = models.CharField(max_length=64, default="manual")
    provider_reference = models.CharField(max_length=128, blank=True)
    amount_cents = models.PositiveIntegerField()
    currency = models.CharField(max_length=8, default="ZAR")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    received_at = models.DateTimeField(null=True, blank=True)
    raw_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
