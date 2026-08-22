from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.accounts.models import User
from apps.staff.models import StaffProfile
from apps.staff.serializers import PublicConsultantSerializer, StaffProfileSerializer, StaffUserSerializer
from config.permissions import ADMIN_ROLES, IsStaffUser


class AvailableConsultantViewSet(viewsets.ReadOnlyModelViewSet):
    """Public booking directory — only consultants who accept consultations."""

    permission_classes = [AllowAny]
    serializer_class = PublicConsultantSerializer

    def get_queryset(self):
        return (
            User.objects.filter(
                is_active=True,
                role__in=[User.Role.CONSULTANT, User.Role.ADMIN, User.Role.SUPER_ADMIN],
                staff_profile__accepts_consultations=True,
            )
            .select_related("staff_profile")
        )


class StaffDirectoryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = StaffUserSerializer
    search_fields = ("email", "first_name", "last_name")
    filterset_fields = ("role", "is_active")

    def get_queryset(self):
        return User.objects.exclude(role=User.Role.CLIENT).select_related("staff_profile")


class StaffProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = StaffProfileSerializer

    def get_queryset(self):
        qs = StaffProfile.objects.select_related("user")
        if self.request.user.role in ADMIN_ROLES:
            return qs
        return qs.filter(user=self.request.user)
