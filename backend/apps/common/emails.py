from django.conf import settings
from django.core.mail import send_mail
from django.template import Context, Template


def render_and_send(*, template_code: str, to_email: str, context: dict[str, object], fallback_subject: str, fallback_body: str) -> None:
    subject = fallback_subject
    body = fallback_body
    try:
        from apps.notifications.models import EmailTemplate

        tmpl = EmailTemplate.objects.filter(code=template_code, is_active=True).first()
        if tmpl:
            subject = Template(tmpl.subject).render(Context(context))
            body = Template(tmpl.body).render(Context(context))
    except Exception:
        pass
    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[to_email],
        fail_silently=True,
    )
