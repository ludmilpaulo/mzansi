from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.services.models import Service, ServiceFAQ, ServiceRequirement
from apps.services.serializers import (
    ServiceDetailSerializer,
    ServiceFAQSerializer,
    ServiceListSerializer,
    ServiceRequirementSerializer,
    ServiceWriteSerializer,
)
from config.permissions import IsAdminRole


class ServiceViewSet(viewsets.ModelViewSet):
    lookup_field = "slug"
    filterset_fields = ("is_active", "consultation_available")
    search_fields = ("name", "short_description", "description")
    ordering = ("sort_order", "name")

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminRole()]

    def get_queryset(self):
        qs = Service.objects.all().prefetch_related("requirements__document_type", "faqs")
        user = self.request.user
        if self.action in {"list", "retrieve"} and not (user.is_authenticated and getattr(user, "is_staff_role", False)):
            qs = qs.filter(is_active=True)
        if self.action == "list":
            return qs
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return ServiceListSerializer
        if self.action in {"create", "update", "partial_update"}:
            return ServiceWriteSerializer
        return ServiceDetailSerializer


class ServiceRequirementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = ServiceRequirementSerializer
    queryset = ServiceRequirement.objects.select_related("service", "document_type")
    filterset_fields = ("service", "is_required")


class ServiceFAQViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = ServiceFAQSerializer
    queryset = ServiceFAQ.objects.select_related("service")
    filterset_fields = ("service", "is_active")
