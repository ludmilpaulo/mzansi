"""Consultation availability, holds, and transactional public booking."""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from django.contrib.auth.hashers import make_password
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from django.utils.crypto import constant_time_compare

from apps.accounts.models import User
from apps.audit.services import log_action
from apps.clients.models import ClientProfile
from apps.common.emails import render_and_send
from apps.consultations.models import Appointment, BlockedDate, ConsultationType, SlotHold
from apps.notifications.services import notify_user
from apps.staff.models import StaffProfile

HOLD_MINUTES = 10
ACTIVATION_HOURS = 72
DEFAULT_TZ = "Africa/Johannesburg"
BUFFER_MINUTES = 0


class SlotUnavailable(Exception):
    """Raised when a requested consultation slot cannot be booked."""

    def __init__(self, message: str = "This consultation time has just been booked.", *, alternatives: list[dict] | None = None):
        super().__init__(message)
        self.alternatives = alternatives or []


@dataclass
class PublicBookingResult:
    appointment: Appointment
    account_created: bool
    activation_required: bool
    activation_expires_at: datetime | None
    activation_token: str | None = None


def consultant_timezone(consultant: User) -> ZoneInfo:
    profile = getattr(consultant, "staff_profile", None)
    name = (profile.timezone_name if profile and profile.timezone_name else DEFAULT_TZ)
    try:
        return ZoneInfo(name)
    except Exception:
        return ZoneInfo(DEFAULT_TZ)


def _day_blocked(day: date, consultant_id: int) -> bool:
    return BlockedDate.objects.filter(date=day).filter(Q(consultant_id=consultant_id) | Q(consultant__isnull=True)).exists()


def _active_holds(consultant_id: int, day: date | None = None):
    qs = SlotHold.objects.filter(
        consultant_id=consultant_id,
        converted=False,
        expires_at__gt=timezone.now(),
    )
    if day is not None:
        qs = qs.filter(starts_at__date=day)
    return qs


def _booked_appointments(consultant_id: int, day: date | None = None):
    qs = Appointment.objects.filter(consultant_id=consultant_id).exclude(status=Appointment.Status.CANCELLED)
    if day is not None:
        qs = qs.filter(starts_at__date=day)
    return qs


def slot_is_free(
    *,
    consultant_id: int,
    starts_at: datetime,
    ends_at: datetime,
    ignore_hold_id: str | None = None,
    ignore_appointment_id: int | None = None,
) -> bool:
    booked = _booked_appointments(consultant_id).filter(starts_at__lt=ends_at, ends_at__gt=starts_at)
    if ignore_appointment_id:
        booked = booked.exclude(pk=ignore_appointment_id)
    if booked.exists():
        return False
    holds = _active_holds(consultant_id).filter(starts_at__lt=ends_at, starts_at__gte=starts_at - timedelta(hours=12))
    # Hold stores starts_at only; treat as blocking that exact start.
    holds = holds.filter(starts_at=starts_at)
    if ignore_hold_id:
        holds = holds.exclude(pk=ignore_hold_id)
    return not holds.exists()


def list_available_slots(
    *,
    consultant_id: int,
    day: date,
    consultation_type: ConsultationType | None,
    ignore_hold_id: str | None = None,
) -> list[dict]:
    if _day_blocked(day, consultant_id):
        return []
    duration = consultation_type.duration_minutes if consultation_type else 45
    profile = StaffProfile.objects.filter(user_id=consultant_id).select_related("user").first()
    tz = consultant_timezone(profile.user) if profile else ZoneInfo(DEFAULT_TZ)
    weekday = day.strftime("%A").lower()
    windows = (profile.working_hours or {}).get(weekday) if profile else None
    if not windows:
        windows = [["09:00", "17:00"]]
    booked = list(_booked_appointments(consultant_id, day))
    holds = list(_active_holds(consultant_id, day))
    slots: list[dict] = []
    now = timezone.now()
    for start_s, end_s in windows:
        start_h, start_m = [int(p) for p in start_s.split(":")]
        end_h, end_m = [int(p) for p in end_s.split(":")]
        local_start = datetime(day.year, day.month, day.day, start_h, start_m, tzinfo=tz)
        local_end = datetime(day.year, day.month, day.day, end_h, end_m, tzinfo=tz)
        cursor = local_start
        while cursor + timedelta(minutes=duration) <= local_end:
            ends = cursor + timedelta(minutes=duration)
            cursor_utc = cursor.astimezone(ZoneInfo("UTC"))
            ends_utc = ends.astimezone(ZoneInfo("UTC"))
            taken_appt = any(a.starts_at < ends_utc and a.ends_at > cursor_utc for a in booked)
            taken_hold = any(
                h.starts_at == cursor_utc and (ignore_hold_id is None or str(h.pk) != str(ignore_hold_id)) for h in holds
            )
            if not taken_appt and not taken_hold and cursor_utc > now:
                slots.append(
                    {
                        "starts_at": cursor_utc.isoformat().replace("+00:00", "Z"),
                        "ends_at": ends_utc.isoformat().replace("+00:00", "Z"),
                        "timezone": str(tz),
                        "label_sast": cursor.strftime("%H:%M"),
                    }
                )
            cursor += timedelta(minutes=duration + BUFFER_MINUTES)
    return slots


def suggest_alternatives(
    *,
    consultant_id: int,
    consultation_type: ConsultationType,
    around: datetime,
    limit: int = 6,
) -> list[dict]:
    found: list[dict] = []
    day = around.astimezone(consultant_timezone(User.objects.get(pk=consultant_id))).date()
    for offset in range(0, 14):
        probe = day + timedelta(days=offset)
        for slot in list_available_slots(
            consultant_id=consultant_id,
            day=probe,
            consultation_type=consultation_type,
        ):
            found.append(slot)
            if len(found) >= limit:
                return found
    return found


@transaction.atomic
def create_slot_hold(
    *,
    consultant: User,
    consultation_type: ConsultationType,
    starts_at: datetime,
) -> SlotHold:
    duration = consultation_type.duration_minutes
    ends_at = starts_at + timedelta(minutes=duration)
    if starts_at <= timezone.now():
        raise SlotUnavailable("Appointments cannot be booked in the past.")
    if _day_blocked(starts_at.date(), consultant.pk):
        raise SlotUnavailable("This date is unavailable.")
    if not slot_is_free(consultant_id=consultant.pk, starts_at=starts_at, ends_at=ends_at):
        raise SlotUnavailable(
            alternatives=suggest_alternatives(
                consultant_id=consultant.pk,
                consultation_type=consultation_type,
                around=starts_at,
            )
        )
    # Expire older holds on the same slot.
    SlotHold.objects.filter(
        consultant=consultant,
        starts_at=starts_at,
        converted=False,
        expires_at__lte=timezone.now(),
    ).delete()
    return SlotHold.objects.create(
        consultant=consultant,
        consultation_type=consultation_type,
        starts_at=starts_at,
        expires_at=timezone.now() + timedelta(minutes=HOLD_MINUTES),
    )


def _client_ip(request) -> str | None:
    if request is None:
        return None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


@transaction.atomic
def book_public_consultation(
    *,
    request,
    consultation_type: ConsultationType,
    consultant: User,
    starts_at: datetime,
    first_name: str,
    last_name: str,
    email: str,
    phone: str,
    nationality: str,
    current_country: str,
    matter_summary: str,
    preferred_language: str = "en",
    additional_message: str = "",
    hold_id: str | None = None,
    terms_version: str,
    timezone_name: str = DEFAULT_TZ,
) -> PublicBookingResult:
    from apps.content.models import LegalAcceptance, TermsDocument
    from apps.accounts.models import AccountActivationToken

    email = email.lower().strip()
    ends_at = starts_at + timedelta(minutes=consultation_type.duration_minutes)

    # Lock overlapping appointments for this consultant.
    conflicts = (
        Appointment.objects.select_for_update()
        .filter(consultant=consultant, starts_at__lt=ends_at, ends_at__gt=starts_at)
        .exclude(status=Appointment.Status.CANCELLED)
    )
    if conflicts.exists():
        raise SlotUnavailable(
            alternatives=suggest_alternatives(
                consultant_id=consultant.pk,
                consultation_type=consultation_type,
                around=starts_at,
            )
        )

    hold: SlotHold | None = None
    if hold_id:
        hold = (
            SlotHold.objects.select_for_update()
            .filter(pk=hold_id, consultant=consultant, converted=False, expires_at__gt=timezone.now())
            .first()
        )
        if hold is None or hold.starts_at != starts_at:
            raise SlotUnavailable(
                "Your temporary reservation expired. Please choose a time again.",
                alternatives=suggest_alternatives(
                    consultant_id=consultant.pk,
                    consultation_type=consultation_type,
                    around=starts_at,
                ),
            )
    elif not slot_is_free(consultant_id=consultant.pk, starts_at=starts_at, ends_at=ends_at):
        raise SlotUnavailable(
            alternatives=suggest_alternatives(
                consultant_id=consultant.pk,
                consultation_type=consultation_type,
                around=starts_at,
            )
        )

    account_created = False
    activation_required = False
    activation_expires_at: datetime | None = None
    activation_token: str | None = None
    existing = User.objects.select_for_update().filter(email__iexact=email).first()
    if existing:
        if existing.role != User.Role.CLIENT:
            raise SlotUnavailable("This email belongs to a staff account. Please use a different email or contact support.")
        client = existing
        if phone and not client.phone:
            client.phone = phone
            client.save(update_fields=["phone"])
        profile = getattr(client, "client_profile", None)
        if profile is None:
            ClientProfile.objects.create(
                user=client,
                nationality=nationality,
                current_country=current_country,
            )
    else:
        client = User.objects.create_user(
            email=email,
            password=None,
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            phone=phone.strip(),
            preferred_language=preferred_language or "en",
            role=User.Role.CLIENT,
            is_active=True,
            is_email_verified=False,
        )
        client.set_unusable_password()
        client.save(update_fields=["password"])
        ClientProfile.objects.create(
            user=client,
            nationality=nationality.strip(),
            current_country=current_country.strip(),
        )
        account_created = True
        activation_required = True
        activation_token = secrets.token_urlsafe(32)
        activation_expires_at = timezone.now() + timedelta(hours=ACTIVATION_HOURS)
        AccountActivationToken.objects.create(
            user=client,
            token_hash=make_password(activation_token),
            expires_at=activation_expires_at,
        )
    notes = matter_summary.strip()
    if additional_message.strip():
        notes = f"{notes}\n\nAdditional message:\n{additional_message.strip()}"

    try:
        appointment = Appointment.objects.create(
            client=client,
            consultant=consultant,
            consultation_type=consultation_type,
            starts_at=starts_at,
            ends_at=ends_at,
            timezone_name=timezone_name or DEFAULT_TZ,
            status=Appointment.Status.PENDING,
            client_notes=notes,
        )
    except IntegrityError as exc:
        raise SlotUnavailable(
            alternatives=suggest_alternatives(
                consultant_id=consultant.pk,
                consultation_type=consultation_type,
                around=starts_at,
            )
        ) from exc

    if hold:
        hold.converted = True
        hold.save(update_fields=["converted", "updated_at"])

    terms = TermsDocument.objects.filter(version=terms_version, is_published=True).first()
    if terms is None:
        terms = TermsDocument.objects.filter(is_published=True).order_by("-effective_date", "-id").first()
    if terms:
        LegalAcceptance.objects.create(
            user=client,
            terms=terms,
            terms_version=terms.version,
            source="consultation_booking",
            ip_address=_client_ip(request),
            user_agent=(request.META.get("HTTP_USER_AGENT", "")[:512] if request else ""),
            appointment=appointment,
        )

    log_action(actor=client, action="appointment.public_booked", target=appointment)
    notify_user(
        client,
        title="Consultation booked",
        body=f"Your {consultation_type.name} is scheduled for {starts_at.strftime('%d %B %Y %H:%M')} SAST.",
        category="consultation",
        email_code="consultation_booked",
    )
    notify_user(
        consultant,
        title="New consultation booking",
        body=f"{client.full_name} booked {consultation_type.name}.",
        category="consultation",
    )

    if account_created and activation_token:
        from django.conf import settings as django_settings

        site = getattr(django_settings, "PUBLIC_SITE_URL", "https://mzansi-pi.vercel.app").rstrip("/")
        render_and_send(
            template_code="account_activation",
            to_email=client.email,
            context={
                "first_name": client.first_name or "there",
                "activation_url": f"{site}/activate?token={activation_token}&email={client.email}",
                "expires_hours": ACTIVATION_HOURS,
                "consultation_reference": appointment.reference_number,
            },
            fallback_subject="Activate your Mzansi Visa Solutions client account",
            fallback_body=(
                f"Hi {client.first_name or 'there'},\n\n"
                f"Your consultation {appointment.reference_number} is booked. "
                f"Activate your account (link expires in {ACTIVATION_HOURS} hours):\n"
                f"{site}/activate?token={activation_token}&email={client.email}\n"
            ),
        )

    return PublicBookingResult(
        appointment=appointment,
        account_created=account_created,
        activation_required=activation_required,
        activation_expires_at=activation_expires_at,
        activation_token=None,
    )
