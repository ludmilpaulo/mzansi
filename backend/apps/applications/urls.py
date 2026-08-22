from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.applications.views import ApplicationStatusViewSet, ApplicationViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"application-statuses", ApplicationStatusViewSet, basename="application-statuses")
router.register(r"applications", ApplicationViewSet, basename="applications")

urlpatterns = [path("", include(router.urls))]
