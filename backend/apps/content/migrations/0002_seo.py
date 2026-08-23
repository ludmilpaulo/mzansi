from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="page",
            name="og_title",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="page",
            name="og_description",
            field=models.CharField(blank=True, max_length=320),
        ),
        migrations.AddField(
            model_name="page",
            name="og_image_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="page",
            name="canonical_path",
            field=models.CharField(blank=True, help_text="Site-relative path such as /services/permanent-residence-permit", max_length=255),
        ),
        migrations.AddField(
            model_name="page",
            name="robots",
            field=models.CharField(choices=[("index,follow", "Index, follow"), ("noindex,nofollow", "No index, no follow")], default="index,follow", max_length=32),
        ),
        migrations.AddField(
            model_name="page",
            name="focus_keyword",
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name="page",
            name="related_keywords",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="page",
            name="locale",
            field=models.CharField(default="en", max_length=12),
        ),
        migrations.AddField(
            model_name="article",
            name="og_title",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="article",
            name="og_description",
            field=models.CharField(blank=True, max_length=320),
        ),
        migrations.AddField(
            model_name="article",
            name="og_image_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="article",
            name="canonical_path",
            field=models.CharField(blank=True, help_text="Site-relative path such as /services/permanent-residence-permit", max_length=255),
        ),
        migrations.AddField(
            model_name="article",
            name="robots",
            field=models.CharField(choices=[("index,follow", "Index, follow"), ("noindex,nofollow", "No index, no follow")], default="index,follow", max_length=32),
        ),
        migrations.AddField(
            model_name="article",
            name="focus_keyword",
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name="article",
            name="related_keywords",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="article",
            name="locale",
            field=models.CharField(default="en", max_length=12),
        ),
        migrations.AddField(
            model_name="article",
            name="last_reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="article",
            name="author_name",
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name="article",
            name="reviewer_name",
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.CreateModel(
            name="SeoLanding",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("og_title", models.CharField(blank=True, max_length=255)),
                ("og_description", models.CharField(blank=True, max_length=320)),
                ("og_image_url", models.URLField(blank=True)),
                ("canonical_path", models.CharField(blank=True, help_text="Site-relative path such as /services/permanent-residence-permit", max_length=255)),
                ("robots", models.CharField(choices=[("index,follow", "Index, follow"), ("noindex,nofollow", "No index, no follow")], default="index,follow", max_length=32)),
                ("focus_keyword", models.CharField(blank=True, max_length=128)),
                ("related_keywords", models.JSONField(blank=True, default=list)),
                ("locale", models.CharField(default="en", max_length=12)),
                ("kind", models.CharField(choices=[("country", "Country"), ("location", "Location")], db_index=True, max_length=16)),
                ("slug", models.SlugField(max_length=255, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("excerpt", models.CharField(max_length=400)),
                ("body", models.TextField()),
                ("audience", models.TextField(blank=True)),
                ("pathways", models.TextField(blank=True)),
                ("documents", models.TextField(blank=True)),
                ("official_sources", models.JSONField(blank=True, default=list)),
                ("faqs", models.JSONField(blank=True, default=list)),
                ("related_service_slugs", models.JSONField(blank=True, default=list)),
                ("related_article_slugs", models.JSONField(blank=True, default=list)),
                ("seo_title", models.CharField(blank=True, max_length=255)),
                ("seo_description", models.CharField(blank=True, max_length=320)),
                ("is_published", models.BooleanField(default=False)),
            ],
            options={
                "ordering": ["kind", "title"],
            },
        ),
    ]
