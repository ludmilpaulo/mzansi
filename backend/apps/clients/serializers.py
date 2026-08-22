from rest_framework import serializers

from apps.accounts.models import User
from apps.clients.models import ClientProfile


class ClientProfileSerializer(serializers.ModelSerializer):
    completion_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = ClientProfile
        fields = (
            "id",
            "nationality",
            "current_country",
            "date_of_birth",
            "passport_number",
            "residential_address",
            "city",
            "postal_code",
            "occupation",
            "employer",
            "emergency_contact_name",
            "emergency_contact_phone",
            "completion_percent",
        )


class ClientUserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    client_profile = ClientProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "preferred_language",
            "is_email_verified",
            "date_joined",
            "client_profile",
        )


class StaffClientProfileSerializer(ClientProfileSerializer):
    class Meta(ClientProfileSerializer.Meta):
        fields = ClientProfileSerializer.Meta.fields + ("profile_notes",)


class StaffClientSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    client_profile = StaffClientProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "preferred_language",
            "is_active",
            "is_email_verified",
            "date_joined",
            "last_login",
            "client_profile",
        )
