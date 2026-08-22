from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel
from apps.common.storage import private_upload_to, validate_upload


class DocumentType(TimeStampedModel):
    code = models.SlugField(unique=True, max_length=64)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class DocumentRequest(TimeStampedModel):
    application = models.ForeignKey("applications.Application", on_delete=models.CASCADE, related_name="document_requests")
    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT, related_name="requests")
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    is_required = models.BooleanField(default=True)
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="document_requests_made")
    notify_email = models.BooleanField(default=True)
    notify_push = models.BooleanField(default=True)
    notify_in_app = models.BooleanField(default=True)
    is_open = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]


class DocumentSubmission(TimeStampedModel):
    class Status(models.TextChoices):
        REQUESTED = "REQUESTED", "Requested"
        UPLOADED = "UPLOADED", "Uploaded"
        UNDER_REVIEW = "UNDER_REVIEW", "Under review"
        VERIFIED = "VERIFIED", "Verified"
        REJECTED = "REJECTED", "Rejected"
        EXPIRED = "EXPIRED", "Expired"
        REPLACEMENT_REQUIRED = "REPLACEMENT_REQUIRED", "Replacement required"

    application = models.ForeignKey("applications.Application", on_delete=models.CASCADE, related_name="documents")
    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT, related_name="submissions")
    request = models.ForeignKey(DocumentRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name="submissions")
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.REQUESTED, db_index=True)
    file = models.FileField(upload_to=private_upload_to, blank=True, null=True, validators=[validate_upload])
    original_filename = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_documents",
    )
    uploaded_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    client_note = models.TextField(blank=True)
    internal_note = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_documents",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateField(null=True, blank=True)
    page_count = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["document_type__name", "id"]
        indexes = [
            models.Index(fields=["application", "status"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"{self.application.reference} — {self.document_type.name}"


class DocumentReview(TimeStampedModel):
    class Outcome(models.TextChoices):
        VERIFIED = "VERIFIED", "Verified"
        REJECTED = "REJECTED", "Rejected"
        REPLACEMENT_REQUIRED = "REPLACEMENT_REQUIRED", "Replacement required"

    submission = models.ForeignKey(DocumentSubmission, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    outcome = models.CharField(max_length=32, choices=Outcome.choices)
    reason = models.TextField(blank=True)
    client_visible_note = models.TextField(blank=True)
    internal_note = models.TextField(blank=True)
