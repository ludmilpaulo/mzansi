from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        return Response({"service": "mzansi-visa-api", "status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    re_path(r"^api/health/?$", HealthView.as_view(), name="health"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/v1/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.clients.urls")),
    path("api/v1/", include("apps.staff.urls")),
    path("api/v1/", include("apps.services.urls")),
    path("api/v1/", include("apps.applications.urls")),
    path("api/v1/", include("apps.documents.urls")),
    path("api/v1/", include("apps.consultations.urls")),
    path("api/v1/", include("apps.messaging.urls")),
    path("api/v1/", include("apps.notifications.urls")),
    path("api/v1/", include("apps.payments.urls")),
    path("api/v1/", include("apps.content.urls")),
    path("api/v1/", include("apps.audit.urls")),
    path("api/v1/", include("apps.reports.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

admin.site.site_header = "Mzansi Visa Solutions"
admin.site.site_title = "Mzansi Admin"
admin.site.index_title = "Operations"
