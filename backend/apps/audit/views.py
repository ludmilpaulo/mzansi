from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.serializers import ModelSerializer

from apps.audit.models import AuditLog
from config.permissions import IsAdminRole


class AuditLogSerializer(ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ("id", "actor", "action", "target_user", "metadata", "ip_address", "created_at")
        read_only_fields = fields


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.select_related("actor", "target_user")
    filterset_fields = ("action", "actor", "target_user")
    search_fields = ("action", "actor__email", "target_user__email")
    http_method_names = ["get", "head", "options"]
