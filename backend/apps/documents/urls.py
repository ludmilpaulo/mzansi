from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.documents.views import DocumentRequestViewSet, DocumentSubmissionViewSet, DocumentTypeViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"document-types", DocumentTypeViewSet, basename="document-types")
router.register(r"documents", DocumentSubmissionViewSet, basename="documents")
router.register(r"document-requests", DocumentRequestViewSet, basename="document-requests")

urlpatterns = [path("", include(router.urls))]
