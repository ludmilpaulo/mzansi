from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class StaffProfile(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="staff_profile")
    job_title = models.CharField(max_length=128, blank=True)
    bio = models.TextField(blank=True)
    specialisations = models.JSONField(default=list, blank=True)
    accepts_consultations = models.BooleanField(default=False)
    working_hours = models.JSONField(
        default=dict,
        blank=True,
        help_text='Example: {"monday": [["09:00","17:00"]], "tuesday": [["09:00","17:00"]]}',
    )
    timezone_name = models.CharField(max_length=64, default="Africa/Johannesburg")

    def __str__(self) -> str:
        return self.user.email
