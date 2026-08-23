from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.audit.services import log_action
from apps.consultations.models import Appointment, BlockedDate, ConsultationType
from apps.consultations.serializers import AppointmentSerializer, BlockedDateSerializer, ConsultationTypeSerializer
from apps.notifications.services import notify_user
from config.permissions import IsAdminRole, IsStaffUser


class ConsultationTypeViewSet(viewsets.ModelViewSet):
    queryset = ConsultationType.objects.all()
    serializer_class = ConsultationTypeSerializer
    lookup_field = "slug"

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminRole()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in {"list", "retrieve"} and not getattr(self.request.user, "is_staff_role", False):
            return qs.filter(is_active=True)
        return qs


class BlockedDateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = BlockedDateSerializer
    queryset = BlockedDate.objects.all()


class AppointmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AppointmentSerializer
    filterset_fields = ("status", "consultant", "consultation_type")
    ordering = ("starts_at",)

    def get_queryset(self):
        qs = Appointment.objects.select_related("client", "consultant", "consultation_type", "application")
        user = self.request.user
        if user.role == User.Role.CLIENT:
            return qs.filter(client=user)
        if user.role in {"CONSULTANT"}:
            return qs.filter(consultant=user)
        return qs

    def perform_create(self, serializer):
        appointment = serializer.save()
        log_action(actor=self.request.user, action="appointment.created", target=appointment)
        notify_user(
            appointment.client,
            title="Consultation booked",
            body=f"Your {appointment.consultation_type.name} is scheduled.",
            category="consultation",
            email_code="consultation_booked",
        )
        notify_user(
            appointment.consultant,
            title="New consultation booking",
            body=f"{appointment.client.full_name} booked {appointment.consultation_type.name}.",
            category="consultation",
        )

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def slots(self, request):
        from apps.consultations.services import list_available_slots

        consultant_id = request.query_params.get("consultant_id")
        date_str = request.query_params.get("date")
        type_id = request.query_params.get("consultation_type_id")
        if not (consultant_id and date_str):
            return Response({"detail": "consultant_id and date are required."}, status=400)
        day = datetime.strptime(date_str, "%Y-%m-%d").date()
        consultation = ConsultationType.objects.filter(pk=type_id).first() if type_id else None
        slots = list_available_slots(
            consultant_id=int(consultant_id),
            day=day,
            consultation_type=consultation,
        )
        return Response(slots)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = Appointment.Status.CANCELLED
        appointment.cancelled_reason = request.data.get("reason", "")
        appointment.save()
        log_action(actor=request.user, action="appointment.cancelled", target=appointment)
        return Response(self.get_serializer(appointment).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsStaffUser])
    def confirm(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = Appointment.Status.CONFIRMED
        appointment.meeting_link = request.data.get("meeting_link", appointment.meeting_link)
        appointment.staff_notes = request.data.get("staff_notes", appointment.staff_notes)
        appointment.save()
        notify_user(
            appointment.client,
            title="Consultation confirmed",
            body=f"Your consultation on {appointment.starts_at.strftime('%d %B %Y')} is confirmed.",
            category="consultation",
            email_code="consultation_confirmed",
        )
        return Response(self.get_serializer(appointment).data)

    @action(detail=True, methods=["post"])
    def reschedule(self, request, pk=None):
        appointment = self.get_object()
        starts_at = request.data.get("starts_at")
        if not starts_at:
            return Response({"detail": "starts_at is required."}, status=400)
        serializer = self.get_serializer(appointment, data={"starts_at": starts_at, "consultation_type_id": appointment.consultation_type_id, "consultant_id": appointment.consultant_id}, partial=True)
        serializer.is_valid(raise_exception=True)
        appointment.starts_at = serializer.validated_data["starts_at"]
        appointment.ends_at = appointment.starts_at + timedelta(minutes=appointment.consultation_type.duration_minutes)
        appointment.status = Appointment.Status.RESCHEDULED
        appointment.save()
        log_action(actor=request.user, action="appointment.rescheduled", target=appointment)
        return Response(self.get_serializer(appointment).data)


def models_q(consultant_id):
    from django.db.models import Q

    return Q(consultant_id=consultant_id) | Q(consultant__isnull=True)
