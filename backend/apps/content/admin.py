from django.contrib import admin

from apps.content.models import Article, Category, FAQ, LegalAcceptance, Page, SeoLanding, SiteSetting, TermsDocument, Testimonial

SEO_FIELDSET = (
    "Search",
    {
        "fields": (
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
    },
)


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ("key", "updated_at")


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_published", "robots")
    prepopulated_fields = {"slug": ("title",)}
    fieldsets = (
        (None, {"fields": ("slug", "title", "excerpt", "body", "is_published")}),
        SEO_FIELDSET,
    )


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ("question", "category", "is_active", "last_reviewed_at", "next_review_at")
    list_filter = ("category", "is_active")
    search_fields = ("question", "answer")


@admin.register(TermsDocument)
class TermsDocumentAdmin(admin.ModelAdmin):
    list_display = ("version", "title", "effective_date", "is_published")
    list_filter = ("is_published",)


@admin.register(LegalAcceptance)
class LegalAcceptanceAdmin(admin.ModelAdmin):
    list_display = ("user", "terms_version", "source", "created_at")
    search_fields = ("user__email", "terms_version")
    readonly_fields = ("user", "terms", "terms_version", "privacy_version", "source", "ip_address", "user_agent", "appointment", "created_at", "updated_at")


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("name", "is_featured", "is_active")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "is_published", "is_featured", "published_at", "last_reviewed_at")
    prepopulated_fields = {"slug": ("title",)}
    fieldsets = (
        (
            None,
            {
                "fields": (
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
                )
            },
        ),
        SEO_FIELDSET,
    )


@admin.register(SeoLanding)
class SeoLandingAdmin(admin.ModelAdmin):
    list_display = ("title", "kind", "slug", "is_published", "locale")
    list_filter = ("kind", "is_published", "locale")
    prepopulated_fields = {"slug": ("title",)}
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "kind",
                    "title",
                    "slug",
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
                )
            },
        ),
        SEO_FIELDSET,
    )
