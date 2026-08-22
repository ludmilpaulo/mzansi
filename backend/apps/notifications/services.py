from apps.notifications.models import Notification
from apps.notifications.tasks import send_notification_email, send_push_notification


def notify_user(
    user,
    *,
    title: str,
    body: str,
    category: str = "general",
    link: str = "",
    email_code: str = "",
    send_push: bool = True,
    metadata: dict | None = None,
) -> Notification | None:
    if user is None:
        return None
    notification = Notification.objects.create(
        user=user,
        title=title,
        body=body,
        category=category,
        link=link,
        metadata=metadata or {},
    )
    context = {"first_name": user.first_name, "title": title, "body": body}
    if email_code and getattr(user, "email", ""):
        try:
            send_notification_email.delay(user.email, email_code, context)
        except Exception:
            send_notification_email(user.email, email_code, context)
    if send_push:
        try:
            send_push_notification.delay(user.id, title, body)
        except Exception:
            send_push_notification(user.id, title, body)
    return notification
