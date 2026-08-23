from __future__ import annotations

from apps.applications.models import ExternalStatusCode

DEFAULT_STATUS_MAPPING: dict[str, str] = {
    "application received": ExternalStatusCode.APPLICATION_RECEIVED,
    "received": ExternalStatusCode.APPLICATION_RECEIVED,
    "application under process": ExternalStatusCode.APPLICATION_UNDER_PROCESS,
    "under process": ExternalStatusCode.APPLICATION_UNDER_PROCESS,
    "in process": ExternalStatusCode.APPLICATION_UNDER_PROCESS,
    "processing": ExternalStatusCode.APPLICATION_UNDER_PROCESS,
    "under adjudication": ExternalStatusCode.APPLICATION_UNDER_PROCESS,
    "decision returned": ExternalStatusCode.DECISION_RETURNED,
    "decision made": ExternalStatusCode.DECISION_RETURNED,
    "ready for collection": ExternalStatusCode.READY_FOR_COLLECTION,
    "ready for collect": ExternalStatusCode.READY_FOR_COLLECTION,
}

DISPLAY_LABELS: dict[str, str] = {
    ExternalStatusCode.APPLICATION_RECEIVED: "Application Received",
    ExternalStatusCode.APPLICATION_UNDER_PROCESS: "Application Under Process",
    ExternalStatusCode.DECISION_RETURNED: "Decision Returned",
    ExternalStatusCode.READY_FOR_COLLECTION: "Ready for Collection",
    ExternalStatusCode.UNKNOWN: "Unknown",
}

SOURCE_LABELS: dict[str, str] = {
    "API": "VFS Global",
    "MANUAL": "Manually updated",
    "UNAVAILABLE": "Official VFS page",
}

VALID_STATUS_CODES = {choice[0] for choice in ExternalStatusCode.choices}


def normalize_status(raw: str | None, mapping: dict[str, str] | None = None) -> tuple[str, str]:
    text = (raw or "").strip()
    if not text:
        return ExternalStatusCode.UNKNOWN, DISPLAY_LABELS[ExternalStatusCode.UNKNOWN]
    compact = text.replace("-", "_").replace(" ", "_").upper()
    if compact in VALID_STATUS_CODES:
        return compact, DISPLAY_LABELS.get(compact, text)
    merged = {**DEFAULT_STATUS_MAPPING, **{str(key).strip().lower(): value for key, value in (mapping or {}).items()}}
    mapped = merged.get(text.lower())
    if mapped in VALID_STATUS_CODES:
        return mapped, DISPLAY_LABELS.get(mapped, text)
    return ExternalStatusCode.UNKNOWN, text


def display_label(status_code: str, fallback: str = "") -> str:
    if status_code in DISPLAY_LABELS:
        return DISPLAY_LABELS[status_code]
    return fallback or DISPLAY_LABELS[ExternalStatusCode.UNKNOWN]
