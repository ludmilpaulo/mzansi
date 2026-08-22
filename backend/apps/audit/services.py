from django.contrib.contenttypes.models import ContentType

from apps.accounts.models import User
from apps.audit.models import AuditLog


def log_action(*, actor, action: str, target=None, metadata: dict | None = None, ip_address: str | None = None) -> AuditLog:
    target_user = None
    content_type = None
    object_id = None
    if target is not None:
        if isinstance(target, User):
            target_user = target
        elif hasattr(target, "client") and getattr(target, "client", None):
            target_user = target.client
        content_type = ContentType.objects.get_for_model(target.__class__)
        object_id = getattr(target, "pk", None)
    return AuditLog.objects.create(
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        action=action,
        target_user=target_user,
        content_type=content_type,
        object_id=object_id,
        metadata=metadata or {},
        ip_address=ip_address,
    )
