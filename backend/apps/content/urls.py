from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.content.views import (
    ArticleViewSet,
    CategoryViewSet,
    FAQViewSet,
    PageViewSet,
    SeoLandingViewSet,
    SiteSettingViewSet,
    TestimonialViewSet,
)

router = DefaultRouter(trailing_slash=False)
router.register(r"content/settings", SiteSettingViewSet, basename="site-settings")
router.register(r"content/pages", PageViewSet, basename="pages")
router.register(r"content/faqs", FAQViewSet, basename="faqs")
router.register(r"content/testimonials", TestimonialViewSet, basename="testimonials")
router.register(r"content/categories", CategoryViewSet, basename="categories")
router.register(r"content/articles", ArticleViewSet, basename="articles")
router.register(r"content/landings", SeoLandingViewSet, basename="seo-landings")

urlpatterns = [path("", include(router.urls))]
