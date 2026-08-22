from celery import shared_task

from apps.common.emails import render_and_send


@shared_task
def send_notification_email(to_email: str, template_code: str, context: dict) -> None:
    render_and_send(
        template_code=template_code,
        to_email=to_email,
        context=context,
        fallback_subject=str(context.get("title") or "Mzansi Visa Solutions"),
        fallback_body=str(context.get("body") or ""),
    )


@shared_task
def send_push_notification(user_id: int, title: str, body: str) -> None:
    from apps.notifications.models import DeviceToken

    tokens = DeviceToken.objects.filter(user_id=user_id, is_active=True)
    # Provider integration (Expo / FCM) is hooked here later. Tokens are stored and ready.
    _ = (tokens, title, body)


@shared_task
def send_consultation_reminders() -> None:
    from datetime import timedelta

    from django.utils import timezone

    from apps.consultations.models import Appointment
    from apps.notifications.services import notify_user

    window_start = timezone.now() + timedelta(hours=23)
    window_end = timezone.now() + timedelta(hours=25)
    upcoming = Appointment.objects.filter(
        status__in=["PENDING", "CONFIRMED"],
        starts_at__gte=window_start,
        starts_at__lte=window_end,
    )
    for appointment in upcoming:
        notify_user(
            appointment.client,
            title="Consultation reminder",
            body=f"Your consultation is tomorrow at {appointment.starts_at.strftime('%H:%M')}.",
            category="consultation",
            email_code="consultation_reminder",
        )
