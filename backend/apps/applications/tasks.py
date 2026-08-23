from __future__ import annotations

import logging

from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from apps.applications.models import ApplicationExternalTracking
from apps.applications.tracking.config import load_tracking_settings
from apps.applications.tracking.providers import get_tracking_provider
from apps.applications.tracking.service import refresh_external_status

logger = logging.getLogger("apps.applications.tracking")


@shared_task(name="apps.applications.tasks.poll_external_application_tracking")
def poll_external_application_tracking() -> int:
    config = load_tracking_settings()
    if not config.automatic_tracking:
        return 0
    provider = get_tracking_provider(config.provider)
    if not provider.is_available():
        logger.info("Skipping automatic VFS polling; no official tracking integration is configured.")
        return 0

    refreshed = 0
    cutoff = timezone.now() - timedelta(hours=config.automatic_check_interval_hours)
    queryset = (
        ApplicationExternalTracking.objects.select_related("application", "application__status", "application__service", "application__client")
        .filter(tracking_enabled=True)
        .exclude(reference_number="")
    )
    for tracking in queryset:
        last_checked = tracking.last_checked_at
        if last_checked and last_checked > cutoff:
            continue
        try:
            refresh_external_status(tracking.application, actor=tracking.application.client, provider=provider, automatic=True)
            refreshed += 1
        except Exception:
            logger.warning("Automatic tracking refresh failed for application %s.", tracking.application.reference)
    return refreshed
