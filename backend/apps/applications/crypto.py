from __future__ import annotations

import base64
import hashlib
import logging

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings

logger = logging.getLogger("apps.applications.crypto")


def mask_passport(value: str) -> str:
    cleaned = (value or "").strip()
    if not cleaned:
        return ""
    tail = cleaned[-4:] if len(cleaned) >= 4 else cleaned[-1:]
    return f"{'*' * 8}{tail}"


def _fernet() -> Fernet:
    configured = str(getattr(settings, "FIELD_ENCRYPTION_KEY", "") or "").strip()
    if configured:
        key = configured.encode("utf-8") if isinstance(configured, str) else configured
        return Fernet(key)
    if getattr(settings, "MZANSI_PRODUCTION", False):
        raise RuntimeError("FIELD_ENCRYPTION_KEY must be set in production.")
    digest = hashlib.sha256(str(settings.SECRET_KEY).encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt_value(plain: str) -> str:
    text = (plain or "").strip()
    if not text:
        return ""
    return _fernet().encrypt(text.encode("utf-8")).decode("utf-8")


def decrypt_value(token: str) -> str:
    raw = (token or "").strip()
    if not raw:
        return ""
    try:
        return _fernet().decrypt(raw.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError):
        logger.warning("Unable to decrypt a protected application field.")
        return ""
