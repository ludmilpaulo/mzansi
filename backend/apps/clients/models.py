from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class ClientProfile(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="client_profile")
    nationality = models.CharField(max_length=128)
    current_country = models.CharField(max_length=128)
    date_of_birth = models.DateField(null=True, blank=True)
    passport_number = models.CharField(max_length=64, blank=True)
    residential_address = models.TextField(blank=True)
    city = models.CharField(max_length=128, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)
    occupation = models.CharField(max_length=128, blank=True)
    employer = models.CharField(max_length=255, blank=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = models.CharField(max_length=32, blank=True)
    profile_notes = models.TextField(blank=True, help_text="Internal staff notes. Never exposed on client endpoints.")

    class Meta:
        indexes = [models.Index(fields=["nationality"]), models.Index(fields=["current_country"])]

    def __str__(self) -> str:
        return self.user.email

    @property
    def completion_percent(self) -> int:
        fields = [
            self.user.first_name,
            self.user.last_name,
            self.user.phone,
            self.nationality,
            self.current_country,
            self.date_of_birth,
            self.passport_number,
            self.residential_address,
        ]
        filled = sum(1 for value in fields if value)
        return int((filled / len(fields)) * 100)
