from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="service",
            name="og_title",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="service",
            name="og_description",
            field=models.CharField(blank=True, max_length=320),
        ),
        migrations.AddField(
            model_name="service",
            name="og_image_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="service",
            name="canonical_path",
            field=models.CharField(blank=True, help_text="Site-relative path such as /services/permanent-residence-permit", max_length=255),
        ),
        migrations.AddField(
            model_name="service",
            name="robots",
            field=models.CharField(choices=[("index,follow", "Index, follow"), ("noindex,nofollow", "No index, no follow")], default="index,follow", max_length=32),
        ),
        migrations.AddField(
            model_name="service",
            name="focus_keyword",
            field=models.CharField(blank=True, max_length=128),
        ),
        migrations.AddField(
            model_name="service",
            name="related_keywords",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="service",
            name="locale",
            field=models.CharField(default="en", max_length=12),
        ),
        migrations.AddField(
            model_name="service",
            name="how_we_help",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="service",
            name="official_sources",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="service",
            name="related_service_slugs",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
