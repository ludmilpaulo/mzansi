from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.services.views import ServiceFAQViewSet, ServiceRequirementViewSet, ServiceViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"services", ServiceViewSet, basename="services")
router.register(r"service-requirements", ServiceRequirementViewSet, basename="service-requirements")
router.register(r"service-faqs", ServiceFAQViewSet, basename="service-faqs")

urlpatterns = [path("", include(router.urls))]
