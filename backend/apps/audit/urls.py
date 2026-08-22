from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.audit.views import AuditLogViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"audit", AuditLogViewSet, basename="audit")

urlpatterns = [path("", include(router.urls))]
