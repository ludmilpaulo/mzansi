from datetime import datetime
from zoneinfo import ZoneInfo

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import serializers

from apps.accounts.models import User
from apps.consultations.models import ConsultationType


class PublicSlotQuerySerializer(serializers.Serializer):
    consultant_id = serializers.IntegerField()
    date = serializers.DateField()
    consultation_type_id = serializers.IntegerField(required=False)
    hold_id = serializers.UUIDField(required=False)


class PublicHoldSerializer(serializers.Serializer):
    consultation_type_id = serializers.IntegerField()
    consultant_id = serializers.IntegerField()
    starts_at = serializers.DateTimeField()

    def validate(self, attrs):
        consultation_type = ConsultationType.objects.filter(pk=attrs["consultation_type_id"], is_active=True).first()
        if not consultation_type:
            raise serializers.ValidationError({"consultation_type_id": "Unknown consultation type."})
        consultant = User.objects.filter(
            pk=attrs["consultant_id"],
            role__in=[User.Role.CONSULTANT, User.Role.ADMIN, User.Role.SUPER_ADMIN],
            staff_profile__accepts_consultations=True,
        ).first()
        if not consultant:
            raise serializers.ValidationError({"consultant_id": "This consultant is not available."})
        starts_at = attrs["starts_at"]
        if timezone.is_naive(starts_at):
            starts_at = timezone.make_aware(starts_at, ZoneInfo("UTC"))
            attrs["starts_at"] = starts_at
        attrs["consultation_type"] = consultation_type
        attrs["consultant"] = consultant
        return attrs


class PublicBookSerializer(serializers.Serializer):
    consultation_type_id = serializers.IntegerField()
    consultant_id = serializers.IntegerField()
    starts_at = serializers.DateTimeField()
    hold_id = serializers.UUIDField(required=False, allow_null=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=32)
    nationality = serializers.CharField(max_length=128)
    current_country = serializers.CharField(max_length=128)
    matter_summary = serializers.CharField(min_length=10, max_length=4000)
    preferred_language = serializers.CharField(max_length=16, required=False, default="en")
    additional_message = serializers.CharField(required=False, allow_blank=True, default="")
    timezone_name = serializers.CharField(max_length=64, required=False, default="Africa/Johannesburg")
    terms_version = serializers.CharField(max_length=32)
    accept_terms = serializers.BooleanField()

    def validate_email(self, value: str) -> str:
        return value.lower().strip()

    def validate_accept_terms(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError("You must accept the Terms & Conditions and Privacy Policy.")
        return value

    def validate(self, attrs):
        consultation_type = ConsultationType.objects.filter(pk=attrs["consultation_type_id"], is_active=True).first()
        if not consultation_type:
            raise serializers.ValidationError({"consultation_type_id": "Unknown consultation type."})
        consultant = User.objects.filter(
            pk=attrs["consultant_id"],
            role__in=[User.Role.CONSULTANT, User.Role.ADMIN, User.Role.SUPER_ADMIN],
            staff_profile__accepts_consultations=True,
        ).first()
        if not consultant:
            raise serializers.ValidationError({"consultant_id": "This consultant is not available."})
        starts_at = attrs["starts_at"]
        if timezone.is_naive(starts_at):
            attrs["starts_at"] = timezone.make_aware(starts_at, ZoneInfo("UTC"))
        attrs["consultation_type"] = consultation_type
        attrs["consultant"] = consultant
        return attrs


class ActivateAccountSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField(min_length=20)
    password = serializers.CharField(min_length=10)
    password_confirm = serializers.CharField(min_length=10)

    def validate_email(self, value: str) -> str:
        return value.lower().strip()

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        from django.contrib.auth.password_validation import validate_password

        validate_password(attrs["password"])
        return attrs


class ResendActivationSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value: str) -> str:
        return value.lower().strip()
