from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Protocol


class ApplicationTrackingProvider(Protocol):
    provider_code: str

    def is_available(self) -> bool: ...

    def get_status(
        self,
        *,
        reference_number: str,
        passport_number: str,
        date_of_birth: date | None,
    ) -> TrackingResult: ...


@dataclass(frozen=True)
class TrackingResult:
    provider: str
    status_code: str
    status_label: str
    source: str
    checked_at: datetime
    error_code: str | None = None
    error_detail: str | None = None
    raw_status: str | None = None


@dataclass(frozen=True)
class TrackingSettings:
    provider: str
    automatic_tracking: bool
    automatic_check_interval_hours: int
    manual_refresh_cooldown_minutes: int
    fallback_url: str
    store_raw_status: bool
    status_mapping: dict[str, str]
