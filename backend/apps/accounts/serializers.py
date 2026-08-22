from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.clients.models import ClientProfile
from apps.staff.models import StaffProfile


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    is_staff_role = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "role",
            "preferred_language",
            "is_email_verified",
            "is_staff_role",
            "date_joined",
        )
        read_only_fields = ("id", "role", "is_email_verified", "is_staff_role", "date_joined")


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=32)
    country_of_nationality = serializers.CharField(max_length=128)
    current_country = serializers.CharField(max_length=128)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    passport_number = serializers.CharField(max_length=64, required=False, allow_blank=True)
    preferred_language = serializers.CharField(max_length=16, default="en")
    password = serializers.CharField(write_only=True, min_length=10)
    password_confirm = serializers.CharField(write_only=True, min_length=10)

    def validate_email(self, value: str) -> str:
        email = value.lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.pop("password_confirm")
        profile_fields = {
            "nationality": validated_data.pop("country_of_nationality"),
            "current_country": validated_data.pop("current_country"),
            "date_of_birth": validated_data.pop("date_of_birth", None),
            "passport_number": validated_data.pop("passport_number", ""),
        }
        user = User.objects.create_user(
            password=password,
            role=User.Role.CLIENT,
            **validated_data,
        )
        ClientProfile.objects.create(user=user, **profile_fields)
        return user


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=10)

    def validate_new_password(self, value: str) -> str:
        validate_password(value, self.context["request"].user)
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=10)


class MeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    is_staff_role = serializers.BooleanField(read_only=True)
    client_profile = serializers.SerializerMethodField()
    staff_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "role",
            "preferred_language",
            "is_email_verified",
            "is_staff_role",
            "client_profile",
            "staff_profile",
        )
        read_only_fields = ("id", "email", "role", "is_email_verified", "is_staff_role")

    def get_client_profile(self, obj: User):
        if obj.role != User.Role.CLIENT:
            return None
        from apps.clients.serializers import ClientProfileSerializer

        profile = getattr(obj, "client_profile", None)
        return ClientProfileSerializer(profile).data if profile else None

    def get_staff_profile(self, obj: User):
        if obj.role == User.Role.CLIENT:
            return None
        profile = getattr(obj, "staff_profile", None)
        if not profile:
            return None
        return {
            "id": profile.id,
            "job_title": profile.job_title,
            "bio": profile.bio,
            "accepts_consultations": profile.accepts_consultations,
        }


def tokens_for_user(user: User) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["email"] = user.email
    return {"refresh": str(refresh), "access": str(refresh.access_token)}
