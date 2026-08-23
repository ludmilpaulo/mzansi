from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from apps.accounts.models import AccountActivationToken, LoginEvent, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = ("email", "first_name", "last_name", "role", "is_active", "is_email_verified")
    list_filter = ("role", "is_active", "is_email_verified")
    search_fields = ("email", "first_name", "last_name", "phone")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("first_name", "last_name", "phone", "preferred_language")}),
        ("Access", {"fields": ("role", "is_active", "is_staff", "is_superuser", "is_email_verified", "groups", "user_permissions")}),
        ("Security", {"fields": ("failed_login_attempts", "locked_until", "last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2", "role")}),
    )


@admin.register(LoginEvent)
class LoginEventAdmin(admin.ModelAdmin):
    list_display = ("email", "success", "ip_address", "created_at")
    list_filter = ("success",)
    search_fields = ("email",)
    readonly_fields = ("user", "email", "success", "ip_address", "user_agent", "reason", "created_at", "updated_at")


@admin.register(AccountActivationToken)
class AccountActivationTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "expires_at", "used_at", "created_at")
    readonly_fields = ("user", "token_hash", "expires_at", "used_at", "created_at", "updated_at")
