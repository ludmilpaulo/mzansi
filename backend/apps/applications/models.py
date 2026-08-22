from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class ApplicationStatus(TimeStampedModel):
    code = models.SlugField(unique=True, max_length=64)
    label = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=32,
        default="active",
        help_text="active | pending | completed | cancelled",
    )
    sort_order = models.PositiveSmallIntegerField(default=0)
    progress_weight = models.PositiveSmallIntegerField(default=0, help_text="0-100 contribution when this status is current.")
    is_terminal = models.BooleanField(default=False)
    client_action_required = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "label"]
        verbose_name_plural = "Application statuses"

    def __str__(self) -> str:
        return self.label


class Application(TimeStampedModel):
    reference = models.CharField(max_length=32, unique=True, db_index=True)
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="applications")
    service = models.ForeignKey("services.Service", on_delete=models.PROTECT, related_name="applications")
    status = models.ForeignKey(ApplicationStatus, on_delete=models.PROTECT, related_name="applications")
    assigned_consultant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="consulted_applications",
    )
    assigned_reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_applications",
    )
    progress = models.PositiveSmallIntegerField(default=0)
    next_action = models.CharField(max_length=255, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    decision_notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["client", "status"]),
            models.Index(fields=["assigned_consultant", "status"]),
            models.Index(fields=["reference"]),
        ]

    def __str__(self) -> str:
        return self.reference


class ApplicationTimeline(TimeStampedModel):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="timeline")
    status = models.ForeignKey(ApplicationStatus, on_delete=models.PROTECT)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    staff_member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="timeline_events",
    )
    client_action_required = models.BooleanField(default=False)
    is_visible_to_client = models.BooleanField(default=True)
    occurred_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["occurred_at", "id"]


class ApplicationNote(TimeStampedModel):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="notes")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    body = models.TextField()
    is_visible_to_client = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]


class ApplicationTask(TimeStampedModel):
    class TaskStatus(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_PROGRESS = "IN_PROGRESS", "In progress"
        DONE = "DONE", "Done"

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="application_tasks",
    )
    status = models.CharField(max_length=24, choices=TaskStatus.choices, default=TaskStatus.OPEN)
    due_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["status", "due_date", "id"]
