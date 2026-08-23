from __future__ import annotations

from apps.applications.tracking.mapping import DEFAULT_STATUS_MAPPING
from apps.applications.tracking.types import TrackingSettings

DEFAULT_FALLBACK_URL = "https://visa.vfsglobal.com/zaf/en/dha/track-application"

DEFAULT_TRACKING_SETTINGS: dict[str, object] = {
    "provider": "VFS",
    "automatic_tracking": False,
    "automatic_check_interval_hours": 6,
    "manual_refresh_cooldown_minutes": 30,
    "fallback_url": DEFAULT_FALLBACK_URL,
    "store_raw_status": False,
    "status_mapping": DEFAULT_STATUS_MAPPING,
}


def load_tracking_settings() -> TrackingSettings:
    from apps.content.models import SiteSetting

    raw = {}
    setting = SiteSetting.objects.filter(key="external_tracking").first()
    if setting and isinstance(setting.value, dict):
        raw = setting.value
    mapping_raw = raw.get("status_mapping", DEFAULT_STATUS_MAPPING)
    mapping = {str(key): str(value) for key, value in mapping_raw.items()} if isinstance(mapping_raw, dict) else dict(DEFAULT_STATUS_MAPPING)
    return TrackingSettings(
        provider=str(raw.get("provider") or "VFS"),
        automatic_tracking=bool(raw.get("automatic_tracking", False)),
        automatic_check_interval_hours=_positive_int(raw.get("automatic_check_interval_hours"), 6),
        manual_refresh_cooldown_minutes=_positive_int(raw.get("manual_refresh_cooldown_minutes"), 30),
        fallback_url=str(raw.get("fallback_url") or DEFAULT_FALLBACK_URL),
        store_raw_status=bool(raw.get("store_raw_status", False)),
        status_mapping=mapping,
    )


def _positive_int(value: object, default: int) -> int:
    try:
        parsed = int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return default
    return parsed if parsed > 0 else default
