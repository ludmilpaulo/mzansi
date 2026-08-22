from rest_framework import serializers

from apps.messaging.models import Conversation, Inquiry, InquiryReply, Message, MessageAttachment


class MessageAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageAttachment
        fields = ("id", "original_filename", "content_type", "created_at")


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True, default=None)
    sender_role = serializers.CharField(source="sender.role", read_only=True, default=None)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ("id", "sender", "sender_name", "sender_role", "kind", "body", "read_at", "attachments", "created_at")
        read_only_fields = ("id", "sender", "kind", "read_at", "created_at")


class ConversationSerializer(serializers.ModelSerializer):
    application_reference = serializers.CharField(source="application.reference", read_only=True)
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ("id", "application", "application_reference", "subject", "unread_count", "last_message", "updated_at")

    def get_unread_count(self, obj: Conversation) -> int:
        user = self.context["request"].user
        return obj.messages.exclude(sender=user).filter(read_at__isnull=True).count()

    def get_last_message(self, obj: Conversation):
        message = obj.messages.order_by("-created_at").first()
        return MessageSerializer(message).data if message else None


class InquiryReplySerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True, default=None)

    class Meta:
        model = InquiryReply
        fields = ("id", "author", "author_name", "body", "created_at")
        read_only_fields = ("id", "author", "created_at")


class InquirySerializer(serializers.ModelSerializer):
    replies = InquiryReplySerializer(many=True, read_only=True)
    client_name = serializers.CharField(source="client.full_name", read_only=True)

    class Meta:
        model = Inquiry
        fields = (
            "id",
            "client",
            "client_name",
            "assigned_to",
            "subject",
            "category",
            "message",
            "status",
            "application",
            "replies",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "client", "status", "created_at", "updated_at")
