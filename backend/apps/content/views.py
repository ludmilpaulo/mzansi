from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.content.models import Article, Category, FAQ, Page, SeoLanding, SiteSetting, Testimonial
from apps.content.serializers import (
    ArticleDetailSerializer,
    ArticleListSerializer,
    ArticleWriteSerializer,
    CategorySerializer,
    FAQSerializer,
    PageSerializer,
    SeoLandingDetailSerializer,
    SeoLandingListSerializer,
    SiteSettingSerializer,
    TestimonialSerializer,
)
from apps.services.models import Service
from apps.services.serializers import ServiceListSerializer
from config.permissions import IsAdminRole


class PublicOrAdminMixin:
    def get_permissions(self):
        if self.action in {"list", "retrieve", "home", "public_seo"}:
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminRole()]


class SiteSettingViewSet(PublicOrAdminMixin, viewsets.ModelViewSet):
    queryset = SiteSetting.objects.all()
    serializer_class = SiteSettingSerializer
    lookup_field = "key"

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def home(self, request):
        settings_map = {item.key: item.value for item in SiteSetting.objects.all()}
        return Response(
            {
                "settings": settings_map,
                "services": ServiceListSerializer(Service.objects.filter(is_active=True)[:8], many=True).data,
                "faqs": FAQSerializer(FAQ.objects.filter(is_active=True)[:12], many=True).data,
                "testimonials": TestimonialSerializer(Testimonial.objects.filter(is_active=True, is_featured=True)[:6], many=True).data,
                "featured_articles": ArticleListSerializer(
                    Article.objects.filter(is_published=True, is_featured=True)[:3], many=True
                ).data,
                "country_landings": SeoLandingListSerializer(
                    SeoLanding.objects.filter(is_published=True, kind=SeoLanding.KIND_COUNTRY), many=True
                ).data,
                "location_landings": SeoLandingListSerializer(
                    SeoLanding.objects.filter(is_published=True, kind=SeoLanding.KIND_LOCATION), many=True
                ).data,
            }
        )

    @action(detail=False, methods=["get"], url_path="public-seo", permission_classes=[AllowAny])
    def public_seo(self, request):
        settings_map = {item.key: item.value for item in SiteSetting.objects.filter(key__in=("brand", "seo", "home_hero"))}
        landings = SeoLanding.objects.filter(is_published=True)
        return Response(
            {
                "settings": settings_map,
                "pages": PageSerializer(Page.objects.filter(is_published=True), many=True).data,
                "services": ServiceListSerializer(Service.objects.filter(is_active=True), many=True).data,
                "articles": ArticleListSerializer(Article.objects.filter(is_published=True), many=True).data,
                "landings": SeoLandingListSerializer(landings, many=True).data,
            }
        )


class PageViewSet(PublicOrAdminMixin, viewsets.ModelViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    lookup_field = "slug"

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in {"list", "retrieve"} and not getattr(self.request.user, "is_staff_role", False):
            return qs.filter(is_published=True)
        return qs


class FAQViewSet(PublicOrAdminMixin, viewsets.ModelViewSet):
    queryset = FAQ.objects.select_related("related_service")
    serializer_class = FAQSerializer
    filterset_fields = ("category", "is_active", "related_service")
    search_fields = ("question", "answer", "category")

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in {"list", "retrieve"} and not getattr(self.request.user, "is_staff_role", False):
            return qs.filter(is_active=True)
        return qs


class TestimonialViewSet(PublicOrAdminMixin, viewsets.ModelViewSet):
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in {"list", "retrieve"} and not getattr(self.request.user, "is_staff_role", False):
            return qs.filter(is_active=True)
        return qs


class CategoryViewSet(PublicOrAdminMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = "slug"


class ArticleViewSet(PublicOrAdminMixin, viewsets.ModelViewSet):
    queryset = Article.objects.select_related("category")
    lookup_field = "slug"
    filterset_fields = ("is_featured", "category__slug")
    search_fields = ("title", "excerpt", "body")

    def get_serializer_class(self):
        if self.action == "list":
            return ArticleListSerializer
        if self.action in {"create", "update", "partial_update"}:
            return ArticleWriteSerializer
        return ArticleDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in {"list", "retrieve"} and not getattr(self.request.user, "is_staff_role", False):
            return qs.filter(is_published=True)
        return qs


class SeoLandingViewSet(PublicOrAdminMixin, viewsets.ModelViewSet):
    queryset = SeoLanding.objects.all()
    lookup_field = "slug"
    filterset_fields = ("kind", "is_published", "locale")
    search_fields = ("title", "excerpt", "body")

    def get_serializer_class(self):
        if self.action == "list":
            return SeoLandingListSerializer
        return SeoLandingDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in {"list", "retrieve"} and not getattr(self.request.user, "is_staff_role", False):
            return qs.filter(is_published=True)
        return qs
