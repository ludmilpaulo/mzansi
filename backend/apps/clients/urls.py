from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.clients.views import ClientProfileViewSet, StaffClientViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"clients/profile", ClientProfileViewSet, basename="client-profile")
router.register(r"clients", StaffClientViewSet, basename="staff-clients")

urlpatterns = [path("", include(router.urls))]
