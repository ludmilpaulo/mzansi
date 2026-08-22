from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.consultations.views import AppointmentViewSet, BlockedDateViewSet, ConsultationTypeViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"consultation-types", ConsultationTypeViewSet, basename="consultation-types")
router.register(r"blocked-dates", BlockedDateViewSet, basename="blocked-dates")
router.register(r"appointments", AppointmentViewSet, basename="appointments")

urlpatterns = [path("", include(router.urls))]
