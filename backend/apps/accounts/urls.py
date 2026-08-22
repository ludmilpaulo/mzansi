from django.urls import re_path

from apps.accounts.views import (
    LoginView,
    MeView,
    PasswordChangeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RefreshView,
    RegisterView,
)

urlpatterns = [
    re_path(r"^auth/register/?$", RegisterView.as_view(), name="auth-register"),
    re_path(r"^auth/login/?$", LoginView.as_view(), name="auth-login"),
    re_path(r"^auth/token/refresh/?$", RefreshView.as_view(), name="auth-refresh"),
    re_path(r"^auth/me/?$", MeView.as_view(), name="auth-me"),
    re_path(r"^auth/password/change/?$", PasswordChangeView.as_view(), name="auth-password-change"),
    re_path(r"^auth/password/reset/?$", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    re_path(r"^auth/password/reset/confirm/?$", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
]
