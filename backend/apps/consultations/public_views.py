from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import AccountActivationToken, User
from apps.common.emails import render_and_send
from apps.consultations.models import Appointment, ConsultationType
from apps.consultations.public_serializers import (
    ActivateAccountSerializer,
    PublicBookSerializer,
    PublicHoldSerializer,
    PublicSlotQuerySerializer,
    ResendActivationSerializer,
)
from apps.consultations.serializers import AppointmentSerializer, ConsultationTypeSerializer
from apps.consultations.services import (
    ACTIVATION_HOURS,
    SlotUnavailable,
    book_public_consultation,
    create_slot_hold,
    list_available_slots,
)
from apps.content.models import TermsDocument
from apps.staff.serializers import PublicConsultantSerializer
import secrets
from datetime import timedelta


class PublicConsultationTypesView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        qs = ConsultationType.objects.filter(is_active=True)
        return Response(ConsultationTypeSerializer(qs, many=True).data)


class PublicConsultantsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        qs = User.objects.filter(
            is_active=True,
            role__in=[User.Role.CONSULTANT, User.Role.ADMIN, User.Role.SUPER_ADMIN],
            staff_profile__accepts_consultations=True,
        ).select_related("staff_profile")
        return Response(PublicConsultantSerializer(qs, many=True).data)


class PublicSlotsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        query = PublicSlotQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        data = query.validated_data
        consultation = None
        if data.get("consultation_type_id"):
            consultation = ConsultationType.objects.filter(pk=data["consultation_type_id"], is_active=True).first()
        slots = list_available_slots(
            consultant_id=data["consultant_id"],
            day=data["date"],
            consultation_type=consultation,
            ignore_hold_id=str(data["hold_id"]) if data.get("hold_id") else None,
        )
        return Response({"timezone": "Africa/Johannesburg", "slots": slots})


class PublicHoldView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        serializer = PublicHoldSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            hold = create_slot_hold(
                consultant=data["consultant"],
                consultation_type=data["consultation_type"],
                starts_at=data["starts_at"],
            )
        except SlotUnavailable as exc:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "SLOT_UNAVAILABLE",
                        "detail": str(exc),
                        "alternatives": exc.alternatives,
                    },
                },
                status=status.HTTP_409_CONFLICT,
            )
        remaining = max(0, int((hold.expires_at - timezone.now()).total_seconds()))
        return Response(
            {
                "hold_id": str(hold.pk),
                "starts_at": hold.starts_at.isoformat().replace("+00:00", "Z"),
                "expires_at": hold.expires_at.isoformat().replace("+00:00", "Z"),
                "expires_in_seconds": remaining,
            },
            status=status.HTTP_201_CREATED,
        )


class PublicBookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        serializer = PublicBookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            result = book_public_consultation(
                request=request,
                consultation_type=data["consultation_type"],
                consultant=data["consultant"],
                starts_at=data["starts_at"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                email=data["email"],
                phone=data["phone"],
                nationality=data["nationality"],
                current_country=data["current_country"],
                matter_summary=data["matter_summary"],
                preferred_language=data.get("preferred_language", "en"),
                additional_message=data.get("additional_message", ""),
                hold_id=str(data["hold_id"]) if data.get("hold_id") else None,
                terms_version=data["terms_version"],
                timezone_name=data.get("timezone_name", "Africa/Johannesburg"),
            )
        except SlotUnavailable as exc:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "SLOT_UNAVAILABLE",
                        "detail": str(exc),
                        "alternatives": exc.alternatives,
                    },
                },
                status=status.HTTP_409_CONFLICT,
            )
        appointment = result.appointment
        payload = {
            "appointment": {
                "id": appointment.pk,
                "reference_number": appointment.reference_number,
                "status": appointment.status,
                "starts_at": appointment.starts_at.isoformat().replace("+00:00", "Z"),
                "ends_at": appointment.ends_at.isoformat().replace("+00:00", "Z"),
                "timezone_name": appointment.timezone_name,
                "consultation_type": appointment.consultation_type.name,
                "duration_minutes": appointment.consultation_type.duration_minutes,
                "consultant_name": appointment.consultant.full_name,
                "calendar_token": appointment.calendar_token,
            },
            "client": {
                "email": appointment.client.email,
                "first_name": appointment.client.first_name,
                "last_name": appointment.client.last_name,
            },
            "account_created": result.account_created,
            "activation_required": result.activation_required,
            "activation_expires_at": (
                result.activation_expires_at.isoformat().replace("+00:00", "Z") if result.activation_expires_at else None
            ),
            "message": (
                "Consultation confirmed. Check your email to activate your client account."
                if result.activation_required
                else "Consultation confirmed. Sign in to your existing client account to manage it."
            ),
        }
        return Response(payload, status=status.HTTP_201_CREATED)


class PublicTermsCurrentView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        terms = TermsDocument.objects.filter(is_published=True).order_by("-effective_date", "-id").first()
        if not terms:
            return Response(
                {
                    "version": "draft",
                    "title": "Terms & Conditions",
                    "effective_date": None,
                    "summary": "Terms are being prepared for legal review.",
                    "body": "",
                }
            )
        return Response(
            {
                "version": terms.version,
                "title": terms.title,
                "effective_date": terms.effective_date.isoformat(),
                "summary": terms.summary,
                "body": terms.body,
            }
        )


class ActivateAccountView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        serializer = ActivateAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = User.objects.filter(email__iexact=data["email"], role=User.Role.CLIENT).first()
        if not user:
            return Response({"detail": "Invalid activation link."}, status=status.HTTP_400_BAD_REQUEST)
        token_row = (
            AccountActivationToken.objects.filter(user=user, used_at__isnull=True, expires_at__gt=timezone.now())
            .order_by("-created_at")
            .first()
        )
        if not token_row or not check_password(data["token"], token_row.token_hash):
            return Response(
                {"detail": "This activation link is invalid or has expired. Request a new link."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(data["password"])
        user.is_email_verified = True
        user.save(update_fields=["password", "is_email_verified"])
        token_row.used_at = timezone.now()
        token_row.save(update_fields=["used_at", "updated_at"])
        AccountActivationToken.objects.filter(user=user, used_at__isnull=True).exclude(pk=token_row.pk).update(
            used_at=timezone.now()
        )
        return Response({"detail": "Account activated. You can now sign in.", "email": user.email})


class ResendActivationView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def post(self, request):
        serializer = ResendActivationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = User.objects.filter(email__iexact=email, role=User.Role.CLIENT, is_email_verified=False).first()
        # Always return success to avoid email enumeration.
        if user and not user.has_usable_password():
            raw = secrets.token_urlsafe(32)
            AccountActivationToken.objects.create(
                user=user,
                token_hash=make_password(raw),
                expires_at=timezone.now() + timedelta(hours=ACTIVATION_HOURS),
            )
            from django.conf import settings as django_settings

            site = getattr(django_settings, "PUBLIC_SITE_URL", "https://mzansi-pi.vercel.app").rstrip("/")
            render_and_send(
                template_code="account_activation",
                to_email=user.email,
                context={
                    "first_name": user.first_name or "there",
                    "activation_url": f"{site}/activate?token={raw}&email={user.email}",
                    "expires_hours": ACTIVATION_HOURS,
                    "consultation_reference": "",
                },
                fallback_subject="Activate your Mzansi Visa Solutions client account",
                fallback_body=f"Activate your account: {site}/activate?token={raw}&email={user.email}",
            )
        return Response({"detail": "If an account needs activation, a new email has been sent."})
