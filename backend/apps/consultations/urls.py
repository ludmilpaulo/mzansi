from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter

from apps.consultations.public_views import (
    ActivateAccountView,
    PublicBookView,
    PublicConsultationTypesView,
    PublicConsultantsView,
    PublicHoldView,
    PublicSlotsView,
    PublicTermsCurrentView,
    ResendActivationView,
)
from apps.consultations.views import AppointmentViewSet, BlockedDateViewSet, ConsultationTypeViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"consultation-types", ConsultationTypeViewSet, basename="consultation-types")
router.register(r"blocked-dates", BlockedDateViewSet, basename="blocked-dates")
router.register(r"appointments", AppointmentViewSet, basename="appointments")

urlpatterns = [
    path("", include(router.urls)),
    re_path(r"^public/consultation-types/?$", PublicConsultationTypesView.as_view(), name="public-consultation-types"),
    re_path(r"^public/consultants/?$", PublicConsultantsView.as_view(), name="public-consultants"),
    re_path(r"^public/consultations/slots/?$", PublicSlotsView.as_view(), name="public-consultation-slots"),
    re_path(r"^public/consultations/hold/?$", PublicHoldView.as_view(), name="public-consultation-hold"),
    re_path(r"^public/consultations/book/?$", PublicBookView.as_view(), name="public-consultation-book"),
    re_path(r"^public/legal/terms/current/?$", PublicTermsCurrentView.as_view(), name="public-terms-current"),
    re_path(r"^auth/activate/?$", ActivateAccountView.as_view(), name="auth-activate"),
    re_path(r"^auth/activate/resend/?$", ResendActivationView.as_view(), name="auth-activate-resend"),
]
