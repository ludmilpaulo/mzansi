from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request
from datetime import date
from typing import Any

from django.conf import settings
from django.utils import timezone

from apps.applications.tracking.mapping import normalize_status
from apps.applications.tracking.types import ApplicationTrackingProvider, TrackingResult

logger = logging.getLogger("apps.applications.tracking")

CLIENT_INVALID_REFERENCE = "We could not find an application using the provided details. Please verify your information."
CLIENT_UNAVAILABLE = "VFS Global is currently unavailable. Your Mzansi application remains safe. Please try again later."
CLIENT_INTEGRATION_UNAVAILABLE = "Automatic tracking is temporarily unavailable."


class VFSProvider:
    """Official VFS integration only. Never scrapes the public tracking page."""

    provider_code = "VFS"

    def is_available(self) -> bool:
        return bool(getattr(settings, "VFS_TRACKING_API_BASE_URL", "") and getattr(settings, "VFS_TRACKING_API_KEY", ""))

    def get_status(
        self,
        *,
        reference_number: str,
        passport_number: str,
        date_of_birth: date | None,
    ) -> TrackingResult:
        now = timezone.now()
        if not self.is_available():
            return TrackingResult(
                provider=self.provider_code,
                status_code="",
                status_label="",
                source="UNAVAILABLE",
                checked_at=now,
                error_code="INTEGRATION_UNAVAILABLE",
                error_detail=CLIENT_INTEGRATION_UNAVAILABLE,
            )
        from apps.applications.tracking.config import load_tracking_settings

        config = load_tracking_settings()
        payload = {
            "reference_number": reference_number,
            "passport_number": passport_number,
        }
        if date_of_birth:
            payload["date_of_birth"] = date_of_birth.isoformat()
        try:
            status_code, body = _post_official_json(
                str(settings.VFS_TRACKING_API_BASE_URL),
                payload,
                str(settings.VFS_TRACKING_API_KEY),
            )
        except TimeoutError:
            logger.warning("Official VFS tracking request timed out.")
            return TrackingResult(
                provider=self.provider_code,
                status_code="",
                status_label="",
                source="UNAVAILABLE",
                checked_at=now,
                error_code="EXTERNAL_UNAVAILABLE",
                error_detail=CLIENT_UNAVAILABLE,
            )
        except OSError:
            logger.warning("Official VFS tracking endpoint could not be reached.")
            return TrackingResult(
                provider=self.provider_code,
                status_code="",
                status_label="",
                source="UNAVAILABLE",
                checked_at=now,
                error_code="EXTERNAL_UNAVAILABLE",
                error_detail=CLIENT_UNAVAILABLE,
            )
        if status_code in {401, 403}:
            logger.warning("Official VFS tracking credentials were rejected.")
            return TrackingResult(
                provider=self.provider_code,
                status_code="",
                status_label="",
                source="UNAVAILABLE",
                checked_at=now,
                error_code="INTEGRATION_UNAVAILABLE",
                error_detail=CLIENT_INTEGRATION_UNAVAILABLE,
            )
        if status_code == 404:
            return TrackingResult(
                provider=self.provider_code,
                status_code="",
                status_label="",
                source="UNAVAILABLE",
                checked_at=now,
                error_code="INVALID_REFERENCE",
                error_detail=CLIENT_INVALID_REFERENCE,
            )
        if status_code >= 500 or status_code < 200:
            return TrackingResult(
                provider=self.provider_code,
                status_code="",
                status_label="",
                source="UNAVAILABLE",
                checked_at=now,
                error_code="EXTERNAL_UNAVAILABLE",
                error_detail=CLIENT_UNAVAILABLE,
            )
        raw_status = _extract_status_text(body)
        code, label = normalize_status(raw_status, config.status_mapping)
        return TrackingResult(
            provider=self.provider_code,
            status_code=code,
            status_label=label,
            source="API",
            checked_at=now,
            raw_status=raw_status if config.store_raw_status else None,
        )


class ManualProvider:
    provider_code = "MANUAL"

    def is_available(self) -> bool:
        return False

    def get_status(
        self,
        *,
        reference_number: str,
        passport_number: str,
        date_of_birth: date | None,
    ) -> TrackingResult:
        return TrackingResult(
            provider=self.provider_code,
            status_code="",
            status_label="",
            source="UNAVAILABLE",
            checked_at=timezone.now(),
            error_code="INTEGRATION_UNAVAILABLE",
            error_detail=CLIENT_INTEGRATION_UNAVAILABLE,
        )


def get_tracking_provider(code: str | None = None) -> ApplicationTrackingProvider:
    providers: dict[str, ApplicationTrackingProvider] = {
        "VFS": VFSProvider(),
        "DHA": VFSProvider(),
        "MANUAL": ManualProvider(),
    }
    return providers.get((code or "VFS").upper(), VFSProvider())


def _post_official_json(url: str, payload: dict[str, str], token: str) -> tuple[int, dict[str, Any]]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.status, _parse_json_object(response.read())
    except urllib.error.HTTPError as exc:
        return exc.code, _parse_json_object(exc.read())


def _parse_json_object(raw: bytes) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _extract_status_text(body: dict[str, Any]) -> str:
    for key in ("status", "status_code", "statusLabel", "status_label", "message"):
        value = body.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""
