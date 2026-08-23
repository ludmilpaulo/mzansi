from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

from apps.common.models import TimeStampedModel


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("role", User.Role.CLIENT)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.SUPER_ADMIN)
        extra_fields.setdefault("is_email_verified", True)
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
        ADMIN = "ADMIN", "Admin"
        CONSULTANT = "CONSULTANT", "Immigration Consultant"
        DOCUMENT_REVIEWER = "DOCUMENT_REVIEWER", "Document Reviewer"
        FINANCE = "FINANCE", "Finance"
        SUPPORT = "SUPPORT", "Support Agent"
        CLIENT = "CLIENT", "Client"

    username = None
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=32, blank=True)
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.CLIENT, db_index=True)
    preferred_language = models.CharField(max_length=16, default="en")
    is_email_verified = models.BooleanField(default=False)
    failed_login_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    objects = UserManager()

    class Meta:
        indexes = [
            models.Index(fields=["role", "is_active"]),
            models.Index(fields=["email"]),
        ]

    def __str__(self) -> str:
        return self.email

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() or self.email

    @property
    def is_staff_role(self) -> bool:
        return self.role != self.Role.CLIENT


class LoginEvent(TimeStampedModel):
    user = models.ForeignKey("accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="login_events")
    email = models.EmailField()
    success = models.BooleanField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True)
    reason = models.CharField(max_length=128, blank=True)

    class Meta:
        ordering = ["-created_at"]


class AccountActivationToken(TimeStampedModel):
    """One-time account activation after guest consultation booking. Expires in 72 hours."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="activation_tokens")
    token_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField(db_index=True)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "expires_at"])]

    @property
    def is_valid(self) -> bool:
        from django.utils import timezone

        return self.used_at is None and self.expires_at > timezone.now()
