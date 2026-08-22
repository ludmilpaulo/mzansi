from rest_framework import serializers

from apps.accounts.models import User
from apps.staff.models import StaffProfile


class StaffProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)

    class Meta:
        model = StaffProfile
        fields = (
            "id",
            "user",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "job_title",
            "bio",
            "specialisations",
            "accepts_consultations",
            "working_hours",
            "timezone_name",
        )
        read_only_fields = ("id", "user")


class StaffUserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    staff_profile = StaffProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "full_name", "phone", "role", "is_active", "staff_profile")


class PublicConsultantSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    job_title = serializers.CharField(source="staff_profile.job_title", read_only=True)
    bio = serializers.CharField(source="staff_profile.bio", read_only=True)

    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "full_name", "job_title", "bio")
