from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.messaging.views import ConversationViewSet, InquiryViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r"conversations", ConversationViewSet, basename="conversations")
router.register(r"inquiries", InquiryViewSet, basename="inquiries")

urlpatterns = [path("", include(router.urls))]
