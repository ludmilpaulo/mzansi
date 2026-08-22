from rest_framework import serializers

from apps.notifications.models import DeviceToken, EmailTemplate, Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "title", "body", "category", "is_read", "link", "metadata", "created_at")
        read_only_fields = fields


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = ("id", "code", "name", "subject", "body", "is_active", "updated_at")


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ("id", "token", "platform", "is_active")
        read_only_fields = ("id",)
