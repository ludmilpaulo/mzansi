from django.db.models import Prefetch
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.audit.models import AuditLog
from apps.audit.services import log_action
from apps.clients.models import ClientProfile
from apps.clients.serializers import ClientProfileSerializer, StaffClientSerializer
from config.permissions import ADMIN_ROLES, STAFF_ROLES, IsStaffUser


class ClientProfileViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ClientProfileSerializer

    def get_object(self) -> ClientProfile:
        profile, _ = ClientProfile.objects.get_or_create(
            user=self.request.user,
            defaults={"nationality": "", "current_country": ""},
        )
        return profile

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        if request.user.role != User.Role.CLIENT:
            return Response({"detail": "Only clients have a client profile."}, status=403)
        profile = self.get_object()
        if request.method == "PATCH":
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            log_action(actor=request.user, action="client.profile_updated", target=profile)
            return Response(serializer.data)
        return Response(self.get_serializer(profile).data)


class StaffClientViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsStaffUser]
    serializer_class = StaffClientSerializer
    search_fields = ("email", "first_name", "last_name", "phone", "client_profile__passport_number")
    filterset_fields = ("is_active",)
    ordering = ("-date_joined",)

    def get_queryset(self):
        qs = User.objects.filter(role=User.Role.CLIENT).select_related("client_profile")
        user = self.request.user
        if user.role in ADMIN_ROLES or user.role in {"SUPPORT", "FINANCE", "DOCUMENT_REVIEWER"}:
            return qs
        if user.role == User.Role.CONSULTANT:
            return qs.filter(applications__assigned_consultant=user).distinct()
        return qs.none()

    @action(detail=True, methods=["get"])
    def activity(self, request, pk=None):
        client = self.get_object()
        events = AuditLog.objects.filter(target_user=client).order_by("-created_at")[:50]
        return Response(
            [
                {
                    "id": event.id,
                    "action": event.action,
                    "actor_email": event.actor.email if event.actor else None,
                    "created_at": event.created_at,
                    "metadata": event.metadata,
                }
                for event in events
            ]
        )
