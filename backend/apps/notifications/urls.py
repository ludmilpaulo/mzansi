from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.notifications.views import DeviceTokenViewSet, EmailTemplateViewSet, NotificationViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"notifications", NotificationViewSet, basename="notifications")
router.register(r"email-templates", EmailTemplateViewSet, basename="email-templates")
router.register(r"device-tokens", DeviceTokenViewSet, basename="device-tokens")

urlpatterns = [path("", include(router.urls))]
