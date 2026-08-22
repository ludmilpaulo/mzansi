from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.payments.views import InvoiceViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"invoices", InvoiceViewSet, basename="invoices")

urlpatterns = [path("", include(router.urls))]
