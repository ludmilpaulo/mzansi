import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("applications", "0002_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ApplicationExternalTracking",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("provider", models.CharField(choices=[("VFS", "VFS Global"), ("DHA", "Department of Home Affairs"), ("MANUAL", "Manual")], default="VFS", max_length=16)),
                ("tracking_enabled", models.BooleanField(default=False)),
                ("country", models.CharField(default="South Africa", max_length=128)),
                ("application_centre", models.CharField(default="Cape Town", max_length=128)),
                ("reference_number", models.CharField(blank=True, db_index=True, max_length=64)),
                ("passport_encrypted", models.TextField(blank=True)),
                ("passport_last4", models.CharField(blank=True, max_length=8)),
                ("date_of_birth_encrypted", models.TextField(blank=True)),
                (
                    "current_status_code",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("APPLICATION_RECEIVED", "Application Received"),
                            ("APPLICATION_UNDER_PROCESS", "Application Under Process"),
                            ("DECISION_RETURNED", "Decision Returned"),
                            ("READY_FOR_COLLECTION", "Ready for Collection"),
                            ("UNKNOWN", "Unknown"),
                        ],
                        max_length=64,
                    ),
                ),
                ("current_status_label", models.CharField(blank=True, max_length=255)),
                ("status_source", models.CharField(blank=True, choices=[("API", "Official API"), ("MANUAL", "Manual update"), ("UNAVAILABLE", "Integration unavailable")], max_length=16)),
                ("last_checked_at", models.DateTimeField(blank=True, null=True)),
                ("last_status_changed_at", models.DateTimeField(blank=True, null=True)),
                ("last_manual_refresh_at", models.DateTimeField(blank=True, null=True)),
                ("last_error_code", models.CharField(blank=True, max_length=64)),
                ("last_error_detail", models.CharField(blank=True, max_length=255)),
                ("last_manual_note", models.TextField(blank=True)),
                (
                    "application",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="external_tracking", to="applications.application"),
                ),
                (
                    "last_updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="external_tracking_updates",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-updated_at"]},
        ),
        migrations.CreateModel(
            name="ExternalApplicationStatus",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("provider", models.CharField(max_length=50)),
                ("status_code", models.CharField(max_length=100)),
                ("status_label", models.CharField(max_length=255)),
                ("source", models.CharField(choices=[("API", "Official API"), ("MANUAL", "Manual update"), ("UNAVAILABLE", "Integration unavailable")], max_length=16)),
                ("raw_status_encrypted", models.TextField(blank=True)),
                ("note", models.TextField(blank=True)),
                ("checked_at", models.DateTimeField()),
                (
                    "application",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="external_statuses", to="applications.application"),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="external_status_updates",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-checked_at", "-id"]},
        ),
    ]
