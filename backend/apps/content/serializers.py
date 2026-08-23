from rest_framework import serializers

from apps.common.seo import MIN_LANDING_BODY_CHARS
from apps.content.models import Article, Category, FAQ, Page, SeoLanding, SiteSetting, Testimonial


SEO_FIELDS = (
    "seo_title",
    "seo_description",
    "og_title",
    "og_description",
    "og_image_url",
    "canonical_path",
    "robots",
    "focus_keyword",
    "related_keywords",
    "locale",
)


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = ("id", "key", "value", "description", "updated_at")


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = (
            "id",
            "slug",
            "title",
            "excerpt",
            "body",
            "is_published",
            "updated_at",
            *SEO_FIELDS,
        )


class FAQSerializer(serializers.ModelSerializer):
    related_service_slug = serializers.CharField(source="related_service.slug", read_only=True, allow_null=True)

    class Meta:
        model = FAQ
        fields = (
            "id",
            "question",
            "answer",
            "category",
            "related_service",
            "related_service_slug",
            "sort_order",
            "is_active",
            "last_reviewed_at",
            "next_review_at",
            "reviewed_by",
        )


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ("id", "name", "role", "quote", "rating", "is_featured", "is_active", "sort_order")


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description")


class ArticleListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Article
        fields = (
            "id",
            "title",
            "slug",
            "excerpt",
            "category",
            "cover_image",
            "is_featured",
            "published_at",
            "last_reviewed_at",
            "author_name",
            "reviewer_name",
            "updated_at",
            *SEO_FIELDS,
        )


class ArticleDetailSerializer(ArticleListSerializer):
    class Meta(ArticleListSerializer.Meta):
        fields = ArticleListSerializer.Meta.fields + ("body", "is_published")


class ArticleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = (
            "id",
            "title",
            "slug",
            "excerpt",
            "body",
            "category",
            "cover_image",
            "is_published",
            "is_featured",
            "published_at",
            "last_reviewed_at",
            "author_name",
            "reviewer_name",
            *SEO_FIELDS,
        )


class SeoLandingListSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeoLanding
        fields = (
            "id",
            "kind",
            "slug",
            "title",
            "excerpt",
            "is_published",
            "updated_at",
            *SEO_FIELDS,
        )


class SeoLandingDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeoLanding
        fields = (
            "id",
            "kind",
            "slug",
            "title",
            "excerpt",
            "body",
            "audience",
            "pathways",
            "documents",
            "official_sources",
            "faqs",
            "related_service_slugs",
            "related_article_slugs",
            "is_published",
            "updated_at",
            *SEO_FIELDS,
        )

    def validate(self, attrs):
        published = attrs.get("is_published", getattr(self.instance, "is_published", False))
        body = attrs.get("body", getattr(self.instance, "body", ""))
        if published and len((body or "").strip()) < MIN_LANDING_BODY_CHARS:
            raise serializers.ValidationError(
                {"body": "Published country and location pages need unique, substantial content."}
            )
        return attrs
