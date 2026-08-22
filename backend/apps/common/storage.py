from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic", ".doc", ".docx"}


def private_upload_to(instance, filename: str) -> str:
    ext = Path(filename).suffix.lower()
    today = timezone.now()
    return f"private/{today.year}/{today.month:02d}/{uuid4().hex}{ext}"


def validate_upload(file) -> None:
    name = getattr(file, "name", "")
    ext = Path(name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError("This file type is not allowed.")
    max_size = getattr(settings, "MAX_UPLOAD_SIZE_BYTES", 15 * 1024 * 1024)
    if getattr(file, "size", 0) > max_size:
        raise ValidationError("This file exceeds the maximum upload size.")
    content_type = getattr(file, "content_type", "") or ""
    allowed = getattr(settings, "ALLOWED_UPLOAD_CONTENT_TYPES", [])
    if content_type and allowed and content_type not in allowed:
        raise ValidationError("This file content type is not allowed.")
