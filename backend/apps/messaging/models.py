from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel
from apps.common.storage import private_upload_to, validate_upload


class Conversation(TimeStampedModel):
    application = models.OneToOneField(
        "applications.Application",
        on_delete=models.CASCADE,
        related_name="conversation",
    )
    subject = models.CharField(max_length=255, blank=True)

    def __str__(self) -> str:
        return self.application.reference


class Message(TimeStampedModel):
    class Kind(models.TextChoices):
        TEXT = "TEXT", "Text"
        SYSTEM = "SYSTEM", "System"

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.TEXT)
    body = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]


class MessageAttachment(TimeStampedModel):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to=private_upload_to, validators=[validate_upload])
    original_filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=128, blank=True)


class Inquiry(TimeStampedModel):
    class Category(models.TextChoices):
        APPLICATION = "APPLICATION", "Application"
        DOCUMENTS = "DOCUMENTS", "Documents"
        PAYMENT = "PAYMENT", "Payment"
        CONSULTATION = "CONSULTATION", "Consultation"
        GENERAL = "GENERAL", "General"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_PROGRESS = "IN_PROGRESS", "In progress"
        WAITING_FOR_CLIENT = "WAITING_FOR_CLIENT", "Waiting for client"
        RESOLVED = "RESOLVED", "Resolved"
        CLOSED = "CLOSED", "Closed"

    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="inquiries")
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_inquiries",
    )
    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=32, choices=Category.choices, default=Category.GENERAL)
    message = models.TextField()
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.OPEN, db_index=True)
    application = models.ForeignKey(
        "applications.Application",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inquiries",
    )

    class Meta:
        ordering = ["-updated_at"]


class InquiryReply(TimeStampedModel):
    inquiry = models.ForeignKey(Inquiry, on_delete=models.CASCADE, related_name="replies")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    body = models.TextField()
