from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.staff.views import AvailableConsultantViewSet, StaffDirectoryViewSet, StaffProfileViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"consultants", AvailableConsultantViewSet, basename="available-consultants")
router.register(r"staff/directory", StaffDirectoryViewSet, basename="staff-directory")
router.register(r"staff/profiles", StaffProfileViewSet, basename="staff-profiles")

urlpatterns = [path("", include(router.urls))]
