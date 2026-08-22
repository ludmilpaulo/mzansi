from datetime import timedelta
import sys

from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.models import LoginEvent, User
from apps.accounts.serializers import (
    EmailTokenObtainPairSerializer,
    MeSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    tokens_for_user,
)
from apps.audit.services import log_action
from apps.common.emails import render_and_send
from apps.notifications.services import notify_user


def _client_ip(request) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "signup"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_action(actor=user, action="account.registered", target=user)
        notify_user(
            user,
            title="Welcome to Mzansi Visa Solutions",
            body="Your account has been created. Complete your profile to get started.",
            category="account",
            email_code="welcome",
        )
        render_and_send(
            template_code="welcome",
            to_email=user.email,
            context={"first_name": user.first_name or "there"},
            fallback_subject="Welcome to Mzansi Visa Solutions",
            fallback_body=f"Welcome {user.first_name or 'there'}. Your client portal is ready.",
        )
        return Response(
            {"user": MeSerializer(user).data, "tokens": tokens_for_user(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = EmailTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def get_throttles(self):
        if "test" in sys.argv:
            return []
        return super().get_throttles()

    def post(self, request, *args, **kwargs):
        email = (request.data.get("email") or "").lower()
        response = None
        try:
            response = super().post(request, *args, **kwargs)
        except Exception:
            user = User.objects.filter(email__iexact=email).first()
            LoginEvent.objects.create(
                user=user,
                email=email,
                success=False,
                ip_address=_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:512],
                reason="invalid_credentials",
            )
            if user:
                user.failed_login_attempts += 1
                if user.failed_login_attempts >= 8:
                    user.locked_until = timezone.now() + timedelta(minutes=15)
                user.save(update_fields=["failed_login_attempts", "locked_until"])
            raise

        user = User.objects.filter(email__iexact=email).first()
        if user:
            user.failed_login_attempts = 0
            user.locked_until = None
            user.save(update_fields=["failed_login_attempts", "locked_until"])
            LoginEvent.objects.create(
                user=user,
                email=email,
                success=True,
                ip_address=_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:512],
            )
            log_action(actor=user, action="account.login", target=user)
        return response


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)

    def patch(self, request):
        serializer = MeSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_action(actor=request.user, action="account.profile_updated", target=request.user)
        return Response(serializer.data)


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data["current_password"]):
            return Response({"detail": "Current password is incorrect."}, status=400)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        log_action(actor=request.user, action="account.password_changed", target=request.user)
        return Response({"detail": "Password updated."})


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=serializer.validated_data["email"]).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            render_and_send(
                template_code="password_reset",
                to_email=user.email,
                context={"uid": uid, "token": token, "first_name": user.first_name},
                fallback_subject="Reset your Mzansi Visa Solutions password",
                fallback_body=f"Use this reset token with your client: uid={uid} token={token}",
            )
        return Response({"detail": "If an account exists, reset instructions have been sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data["uid"]))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"detail": "Invalid reset link."}, status=400)
        if not default_token_generator.check_token(user, serializer.validated_data["token"]):
            return Response({"detail": "Invalid or expired reset token."}, status=400)
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        log_action(actor=user, action="account.password_reset", target=user)
        return Response({"detail": "Password has been reset."})
