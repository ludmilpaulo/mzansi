from __future__ import annotations

from datetime import date, datetime, timedelta

from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.accounts.models import User
from apps.applications.crypto import decrypt_value, encrypt_value, mask_passport
from apps.applications.models import (
    Application,
    ApplicationExternalTracking,
    ApplicationTimeline,
    ExternalApplicationStatus,
    ExternalStatusCode,
    TrackingProvider,
    TrackingSource,
)
from apps.applications.tracking.config import load_tracking_settings
from apps.applications.tracking.mapping import SOURCE_LABELS, display_label, normalize_status
from apps.applications.tracking.providers import get_tracking_provider
from apps.applications.tracking.types import ApplicationTrackingProvider, TrackingResult
from apps.audit.services import log_action
from apps.notifications.services import notify_user
from config.exceptions import TrackingIntegrationUnavailable, TrackingInvalidReference, TrackingRateLimited
from config.permissions import ADMIN_ROLES

LODGED_INTERNAL = {"SUBMITTED_TO_AUTHORITY", "AWAITING_DECISION", "APPROVED", "REJECTED", "COMPLETED"}
DOCUMENTS_DONE = {
    "DOCUMENTS_COMPLETE",
    "IN_PREPARATION",
    "READY_FOR_SUBMISSION",
    "SUBMITTED_TO_AUTHORITY",
    "AWAITING_DECISION",
    "APPROVED",
    "REJECTED",
    "COMPLETED",
}
DECISION_INTERNAL = {"APPROVED", "REJECTED", "COMPLETED"}
PROCESSING_EXTERNAL = {
    ExternalStatusCode.APPLICATION_UNDER_PROCESS,
    ExternalStatusCode.DECISION_RETURNED,
    ExternalStatusCode.READY_FOR_COLLECTION,
}
DECISION_EXTERNAL = {ExternalStatusCode.DECISION_RETURNED, ExternalStatusCode.READY_FOR_COLLECTION}


def get_or_init_tracking(application: Application) -> ApplicationExternalTracking:
    tracking, _ = ApplicationExternalTracking.objects.get_or_create(application=application)
    return tracking


def serialize_tracking(application: Application, *, viewer: User) -> dict[str, object]:
    config = load_tracking_settings()
    tracking = getattr(application, "external_tracking", None)
    provider = get_tracking_provider(tracking.provider if tracking else config.provider)
    status_code = tracking.current_status_code if tracking else ""
    next_refresh = _next_refresh_at(tracking, config.manual_refresh_cooldown_minutes) if tracking else None
    can_edit = _can_edit_details(viewer, application)
    return {
        "application_id": application.id,
        "application_reference": application.reference,
        "service_name": application.service.name,
        "client_name": application.client.full_name,
        "internal_status": {
            "code": application.status.code,
            "label": application.status.label,
        },
        "provider": (tracking.provider if tracking else config.provider) or "VFS",
        "reference_number": tracking.reference_number if tracking else "",
        "passport_masked": _passport_masked(tracking) if tracking else "",
        "has_date_of_birth": bool(tracking and tracking.date_of_birth_encrypted),
        "country": tracking.country if tracking else "South Africa",
        "application_centre": tracking.application_centre if tracking else "Cape Town",
        "tracking_enabled": bool(tracking and tracking.tracking_enabled),
        "status": status_code or None,
        "status_label": tracking.current_status_label if tracking else "",
        "source": tracking.status_source if tracking else None,
        "source_label": SOURCE_LABELS.get(tracking.status_source, "") if tracking else "",
        "manually_updated": bool(tracking and tracking.status_source == TrackingSource.MANUAL),
        "updated_by_name": tracking.last_updated_by.full_name if tracking and tracking.last_updated_by_id else None,
        "manual_note": tracking.last_manual_note if tracking and viewer.role != User.Role.CLIENT else "",
        "checked_at": tracking.last_checked_at.isoformat() if tracking and tracking.last_checked_at else None,
        "status_changed_at": tracking.last_status_changed_at.isoformat() if tracking and tracking.last_status_changed_at else None,
        "next_refresh_at": next_refresh.isoformat() if next_refresh else None,
        "automatic_available": provider.is_available() and config.automatic_tracking,
        "fallback_url": config.fallback_url,
        "error_code": tracking.last_error_code if tracking else None,
        "error_detail": tracking.last_error_detail if tracking else None,
        "journey": build_journey(application, tracking),
        "can_refresh": _can_refresh(tracking, provider, next_refresh),
        "can_edit_details": can_edit,
        "can_manual_update": viewer.role in ADMIN_ROLES or viewer.role == User.Role.CONSULTANT,
    }


def serialize_tracking_summary(application: Application) -> dict[str, object] | None:
    tracking = getattr(application, "external_tracking", None)
    if tracking is None:
        return None
    if not tracking.tracking_enabled and not tracking.reference_number:
        return None
    config = load_tracking_settings()
    provider = get_tracking_provider(tracking.provider)
    return {
        "enabled": tracking.tracking_enabled,
        "provider": tracking.provider,
        "reference_number": tracking.reference_number,
        "status": tracking.current_status_code or None,
        "status_label": tracking.current_status_label,
        "source": tracking.status_source or None,
        "source_label": SOURCE_LABELS.get(tracking.status_source, ""),
        "manually_updated": tracking.status_source == TrackingSource.MANUAL,
        "checked_at": tracking.last_checked_at.isoformat() if tracking.last_checked_at else None,
        "automatic_available": provider.is_available() and config.automatic_tracking,
        "fallback_url": config.fallback_url,
    }


def update_tracking_details(application: Application, *, actor: User, data: dict[str, object]) -> ApplicationExternalTracking:
    if not _can_edit_details(actor, application):
        raise PermissionDenied("You cannot update tracking details for this application.")
    tracking = get_or_init_tracking(application)
    previous_reference = tracking.reference_number
    is_staff = actor.role != User.Role.CLIENT
    if "reference_number" in data:
        tracking.reference_number = str(data.get("reference_number") or "").strip()[:64]
    if is_staff:
        if "provider" in data:
            provider = str(data.get("provider") or TrackingProvider.VFS).upper()
            if provider not in {choice[0] for choice in TrackingProvider.choices}:
                raise ValidationError({"provider": "Unknown tracking provider."})
            tracking.provider = provider
        if "country" in data:
            tracking.country = str(data.get("country") or "South Africa").strip()[:128]
        if "application_centre" in data:
            tracking.application_centre = str(data.get("application_centre") or "").strip()[:128]
        if "tracking_enabled" in data:
            tracking.tracking_enabled = bool(data.get("tracking_enabled"))
    elif tracking.reference_number:
        tracking.tracking_enabled = True
    passport = data.get("passport_number")
    if isinstance(passport, str) and passport.strip():
        cleaned = passport.strip()[:32]
        tracking.passport_encrypted = encrypt_value(cleaned)
        tracking.passport_last4 = cleaned[-4:] if len(cleaned) >= 4 else cleaned[-1:]
    dob = data.get("date_of_birth")
    if isinstance(dob, str) and dob.strip():
        parsed = _parse_date(dob.strip())
        tracking.date_of_birth_encrypted = encrypt_value(parsed.isoformat())
    tracking.save()
    if tracking.reference_number and tracking.reference_number != previous_reference:
        ApplicationTimeline.objects.create(
            application=application,
            status=application.status,
            title="VFS tracking details saved",
            description="A VFS reference was securely associated with this application.",
            staff_member=actor if is_staff else None,
        )
    log_action(
        actor=actor,
        action="application.tracking_details_updated",
        target=application,
        metadata={"provider": tracking.provider, "has_reference": bool(tracking.reference_number)},
    )
    return tracking


def refresh_external_status(
    application: Application,
    *,
    actor: User,
    provider: ApplicationTrackingProvider | None = None,
    automatic: bool = False,
) -> ApplicationExternalTracking:
    tracking = get_or_init_tracking(application)
    config = load_tracking_settings()
    active_provider = provider or get_tracking_provider(tracking.provider)
    if not tracking.reference_number:
        raise ValidationError({"reference_number": "A VFS reference number is required before status can be refreshed."})
    if not automatic:
        next_refresh = _next_refresh_at(tracking, config.manual_refresh_cooldown_minutes)
        if next_refresh and active_provider.is_available():
            raise TrackingRateLimited(
                f"Your application was checked recently. Please try again at {next_refresh.astimezone().strftime('%H:%M')}."
            )
    if not active_provider.is_available():
        tracking.last_error_code = "INTEGRATION_UNAVAILABLE"
        tracking.last_error_detail = "Automatic tracking is temporarily unavailable."
        tracking.save(update_fields=["last_error_code", "last_error_detail", "updated_at"])
        if not automatic:
            raise TrackingIntegrationUnavailable("Automatic tracking is temporarily unavailable.")
        return tracking

    passport = decrypt_value(tracking.passport_encrypted)
    dob = _decrypt_date(tracking.date_of_birth_encrypted)
    result = active_provider.get_status(
        reference_number=tracking.reference_number,
        passport_number=passport,
        date_of_birth=dob,
    )
    if not automatic:
        tracking.last_manual_refresh_at = timezone.now()
    if result.error_code:
        tracking.last_error_code = result.error_code
        tracking.last_error_detail = result.error_detail or ""
        tracking.save(update_fields=["last_error_code", "last_error_detail", "last_manual_refresh_at", "updated_at"])
        if result.error_code == "INVALID_REFERENCE":
            raise TrackingInvalidReference(result.error_detail)
        if result.error_code == "INTEGRATION_UNAVAILABLE":
            raise TrackingIntegrationUnavailable(result.error_detail)
        raise TrackingIntegrationUnavailable(result.error_detail or "VFS Global is currently unavailable. Your Mzansi application remains safe. Please try again later.")

    apply_external_result(application, tracking, result, actor=actor, note="", store_raw=config.store_raw_status)
    log_action(
        actor=actor,
        action="application.external_status_refreshed",
        target=application,
        metadata={"provider": tracking.provider, "status": tracking.current_status_code, "source": result.source},
    )
    return tracking


def record_manual_status(
    application: Application,
    *,
    actor: User,
    status_code: str,
    note: str = "",
    status_label: str = "",
) -> ApplicationExternalTracking:
    if actor.role not in ADMIN_ROLES and actor.role != User.Role.CONSULTANT:
        raise PermissionDenied("Only authorised staff can record a manual external status.")
    tracking = get_or_init_tracking(application)
    code, label = normalize_status(status_code)
    if status_label.strip():
        label = status_label.strip()
    now = timezone.now()
    result = TrackingResult(
        provider=tracking.provider or TrackingProvider.VFS,
        status_code=code,
        status_label=label,
        source=TrackingSource.MANUAL,
        checked_at=now,
    )
    apply_external_result(application, tracking, result, actor=actor, note=note.strip(), store_raw=False)
    tracking.last_manual_note = note.strip()
    tracking.last_updated_by = actor
    tracking.tracking_enabled = True
    tracking.save(update_fields=["last_manual_note", "last_updated_by", "tracking_enabled", "updated_at"])
    log_action(
        actor=actor,
        action="application.external_status_manual",
        target=application,
        metadata={"provider": tracking.provider, "status": code},
    )
    return tracking


def apply_external_result(
    application: Application,
    tracking: ApplicationExternalTracking,
    result: TrackingResult,
    *,
    actor: User | None,
    note: str,
    store_raw: bool,
) -> None:
    previous_code = tracking.current_status_code
    previous_label = tracking.current_status_label
    changed = bool(result.status_code) and result.status_code != previous_code
    tracking.current_status_code = result.status_code or tracking.current_status_code
    tracking.current_status_label = result.status_label or display_label(tracking.current_status_code)
    tracking.status_source = result.source
    tracking.last_checked_at = result.checked_at
    tracking.last_error_code = ""
    tracking.last_error_detail = ""
    if changed:
        tracking.last_status_changed_at = result.checked_at
    if actor and result.source == TrackingSource.MANUAL:
        tracking.last_updated_by = actor
    tracking.save()

    history = ExternalApplicationStatus.objects.create(
        application=application,
        provider=result.provider,
        status_code=tracking.current_status_code,
        status_label=tracking.current_status_label,
        source=result.source,
        note=note,
        updated_by=actor if result.source == TrackingSource.MANUAL else None,
        checked_at=result.checked_at,
    )
    if store_raw and result.raw_status:
        history.raw_status_encrypted = encrypt_value(result.raw_status)
        history.save(update_fields=["raw_status_encrypted"])

    if not changed:
        return

    source_note = "Manually updated" if result.source == TrackingSource.MANUAL else "Status source: VFS Global"
    ApplicationTimeline.objects.create(
        application=application,
        status=application.status,
        title="VFS status updated",
        description=f"{tracking.current_status_label}. {source_note}.",
        staff_member=actor if result.source == TrackingSource.MANUAL else None,
    )
    notify_user(
        application.client,
        title="VFS Status Updated",
        body=(
            "Your application status has changed.\n\n"
            f"Previous: {previous_label or 'Not recorded'}\n"
            f"New status: {tracking.current_status_label}"
        ),
        category="application",
        email_code="vfs_status_changed",
        link=f"/portal/applications/{application.id}/tracking",
        metadata={
            "application_id": application.id,
            "previous_status": previous_code,
            "new_status": tracking.current_status_code,
            "source": result.source,
        },
    )


def serialize_history(application: Application) -> list[dict[str, object]]:
    rows = application.external_statuses.select_related("updated_by").all()
    return [
        {
            "id": row.id,
            "provider": row.provider,
            "status": row.status_code,
            "status_label": row.status_label,
            "source": row.source,
            "source_label": SOURCE_LABELS.get(row.source, row.source),
            "manually_updated": row.source == TrackingSource.MANUAL,
            "updated_by_name": row.updated_by.full_name if row.updated_by_id else None,
            "note": row.note,
            "checked_at": row.checked_at.isoformat(),
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]


def serialize_admin_row(tracking: ApplicationExternalTracking) -> dict[str, object]:
    application = tracking.application
    health = _tracking_health(tracking)
    return {
        "id": application.id,
        "tracking_id": tracking.id,
        "client_name": application.client.full_name,
        "application_reference": application.reference,
        "service_name": application.service.name,
        "reference_number": tracking.reference_number,
        "status": tracking.current_status_code or None,
        "status_label": tracking.current_status_label,
        "source": tracking.status_source or None,
        "checked_at": tracking.last_checked_at.isoformat() if tracking.last_checked_at else None,
        "health": health,
        "health_label": {
            "connected": "Connected",
            "manual": "Manually updated",
            "fallback": "Official VFS page",
            "error": "Needs attention",
            "not_configured": "Not configured",
        }[health],
        "tracking_enabled": tracking.tracking_enabled,
    }


def build_journey(application: Application, tracking: ApplicationExternalTracking | None) -> list[dict[str, object]]:
    internal = application.status.code
    external = tracking.current_status_code if tracking else ""
    lodged = internal in LODGED_INTERNAL or bool(tracking and tracking.tracking_enabled and tracking.reference_number)
    processing = external in PROCESSING_EXTERNAL or internal in {"AWAITING_DECISION", *DECISION_INTERNAL}
    decision = external in DECISION_EXTERNAL or internal in DECISION_INTERNAL
    collection = external == ExternalStatusCode.READY_FOR_COLLECTION or internal == "COMPLETED"
    lodged = lodged or processing or decision or collection
    documents = internal in DOCUMENTS_DONE or lodged
    steps = [
        ("CREATED", "Application created", True),
        ("DOCUMENTS", "Documents submitted", documents),
        ("LODGED", "Application lodged at VFS", lodged),
        ("PROCESSING", "Application under process", processing),
        ("DECISION", "Decision made", decision),
        ("COLLECTION", "Passport / decision collection", collection),
    ]
    first_open = next((index for index, item in enumerate(steps) if not item[2]), None)
    journey: list[dict[str, object]] = []
    for index, (code, label, complete) in enumerate(steps):
        state = "complete" if complete else "upcoming"
        if first_open is not None and index == first_open:
            state = "current"
        journey.append({"code": code, "label": label, "state": state})
    return journey


def _can_edit_details(viewer: User, application: Application) -> bool:
    if viewer.role == User.Role.CLIENT:
        return application.client_id == viewer.id
    return viewer.role in ADMIN_ROLES or viewer.role in {User.Role.CONSULTANT, User.Role.SUPPORT}


def _can_refresh(tracking: ApplicationExternalTracking | None, provider, next_refresh: datetime | None) -> bool:
    if tracking is None or not tracking.reference_number:
        return False
    if not provider.is_available():
        return False
    return next_refresh is None or next_refresh <= timezone.now()


def _next_refresh_at(tracking: ApplicationExternalTracking | None, cooldown_minutes: int) -> datetime | None:
    if tracking is None or not tracking.last_manual_refresh_at:
        return None
    ready = tracking.last_manual_refresh_at + timedelta(minutes=cooldown_minutes)
    return ready if ready > timezone.now() else None


def _passport_masked(tracking: ApplicationExternalTracking) -> str:
    if tracking.passport_last4:
        return f"{'*' * 8}{tracking.passport_last4}"
    if tracking.passport_encrypted:
        return mask_passport(decrypt_value(tracking.passport_encrypted))
    return ""


def _parse_date(value: str) -> date:
    try:
        return date.fromisoformat(value[:10])
    except ValueError as exc:
        raise ValidationError({"date_of_birth": "Enter a valid date of birth."}) from exc


def _decrypt_date(token: str) -> date | None:
    plain = decrypt_value(token)
    if not plain:
        return None
    try:
        return date.fromisoformat(plain[:10])
    except ValueError:
        return None


def _tracking_health(tracking: ApplicationExternalTracking) -> str:
    if not tracking.reference_number:
        return "not_configured"
    if tracking.last_error_code:
        return "error"
    if tracking.status_source == TrackingSource.API:
        return "connected"
    if tracking.status_source == TrackingSource.MANUAL:
        return "manual"
    return "fallback"
