from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import User
from apps.consultations.models import Appointment, BlockedDate, ConsultationType


class ConsultationTypeSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()

    class Meta:
        model = ConsultationType
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "duration_minutes",
            "price_cents",
            "price",
            "currency",
            "is_active",
            "sort_order",
        )

    def get_price(self, obj: ConsultationType) -> str:
        return f"{obj.currency} {obj.price_cents / 100:.2f}"


class BlockedDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedDate
        fields = ("id", "date", "consultant", "reason")


class AppointmentSerializer(serializers.ModelSerializer):
    consultation_type = ConsultationTypeSerializer(read_only=True)
    consultation_type_id = serializers.PrimaryKeyRelatedField(
        source="consultation_type", queryset=ConsultationType.objects.filter(is_active=True), write_only=True
    )
    consultant_name = serializers.CharField(source="consultant.full_name", read_only=True)
    client_name = serializers.CharField(source="client.full_name", read_only=True)
    consultant_id = serializers.PrimaryKeyRelatedField(
        source="consultant", queryset=User.objects.filter(role__in=["CONSULTANT", "ADMIN", "SUPER_ADMIN"]), write_only=True
    )
    client_id = serializers.PrimaryKeyRelatedField(
        source="client", queryset=User.objects.filter(role="CLIENT"), write_only=True, required=False
    )

    class Meta:
        model = Appointment
        fields = (
            "id",
            "reference_number",
            "client",
            "client_id",
            "client_name",
            "consultant_id",
            "consultant_name",
            "consultation_type",
            "consultation_type_id",
            "application",
            "starts_at",
            "ends_at",
            "timezone_name",
            "status",
            "meeting_link",
            "client_notes",
            "staff_notes",
            "cancelled_reason",
            "calendar_token",
            "created_at",
        )
        read_only_fields = (
            "id",
            "reference_number",
            "client",
            "ends_at",
            "status",
            "created_at",
            "staff_notes",
            "calendar_token",
            "timezone_name",
        )

    def validate(self, attrs):
        starts_at = attrs.get("starts_at") or getattr(self.instance, "starts_at", None)
        consultant = attrs.get("consultant") or getattr(self.instance, "consultant", None)
        consultation_type = attrs.get("consultation_type") or getattr(self.instance, "consultation_type", None)
        if starts_at and starts_at < timezone.now():
            raise serializers.ValidationError({"starts_at": "Appointments cannot be booked in the past."})
        if starts_at and consultant:
            blocked = BlockedDate.objects.filter(date=starts_at.date()).filter(
                Q(consultant=consultant) | Q(consultant__isnull=True)
            )
            if blocked.exists():
                raise serializers.ValidationError({"starts_at": "This date is unavailable."})
            overlap = Appointment.objects.filter(
                consultant=consultant,
                starts_at__lt=starts_at + timedelta(minutes=consultation_type.duration_minutes if consultation_type else 45),
                ends_at__gt=starts_at,
            ).exclude(status=Appointment.Status.CANCELLED)
            if self.instance:
                overlap = overlap.exclude(pk=self.instance.pk)
            if overlap.exists():
                raise serializers.ValidationError({"starts_at": "This consultant is not available at the selected time."})
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        consultation_type = validated_data["consultation_type"]
        starts_at = validated_data["starts_at"]
        validated_data["ends_at"] = starts_at + timedelta(minutes=consultation_type.duration_minutes)
        if request.user.role == User.Role.CLIENT:
            validated_data["client"] = request.user
        elif "client" not in validated_data or not validated_data.get("client"):
            raise serializers.ValidationError({"client": "Client is required."})
        validated_data.setdefault("status", Appointment.Status.PENDING)
        return super().create(validated_data)
