from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.applications.views import (
    AdminTrackingRefreshView,
    ApplicationStatusViewSet,
    ApplicationViewSet,
    ExternalTrackingAdminViewSet,
)

router = DefaultRouter(trailing_slash=False)
router.register(r"application-statuses", ApplicationStatusViewSet, basename="application-statuses")
router.register(r"applications", ApplicationViewSet, basename="applications")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "admin/applications/external-tracking",
        ExternalTrackingAdminViewSet.as_view({"get": "list"}),
        name="external-tracking-admin",
    ),
    path(
        "admin/applications/<int:pk>/tracking/refresh",
        AdminTrackingRefreshView.as_view(),
        name="external-tracking-admin-refresh",
    ),
]
