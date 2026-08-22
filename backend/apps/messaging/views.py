from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.applications.models import Application
from apps.applications.views import scoped_applications
from apps.audit.services import log_action
from apps.messaging.models import Conversation, Inquiry, InquiryReply, Message, MessageAttachment
from apps.messaging.serializers import ConversationSerializer, InquiryReplySerializer, InquirySerializer, MessageSerializer
from apps.notifications.services import notify_user
from config.permissions import IsStaffUser, IsSupportRole


class ConversationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer

    def get_queryset(self):
        apps = scoped_applications(self.request.user)
        return Conversation.objects.filter(application__in=apps).select_related("application").prefetch_related("messages")

    @action(detail=True, methods=["get", "post"], parser_classes=[MultiPartParser, FormParser, JSONParser])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        if request.method == "GET":
            messages = conversation.messages.select_related("sender").prefetch_related("attachments")
            messages.exclude(sender=request.user).filter(read_at__isnull=True).update(read_at=timezone.now())
            return Response(MessageSerializer(messages, many=True).data)
        serializer = MessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            body=serializer.validated_data["body"],
        )
        upload = request.FILES.get("file")
        if upload:
            MessageAttachment.objects.create(
                message=message,
                file=upload,
                original_filename=upload.name,
                content_type=getattr(upload, "content_type", ""),
            )
        recipient = conversation.application.client if request.user != conversation.application.client else conversation.application.assigned_consultant
        if recipient:
            notify_user(
                recipient,
                title="New message",
                body=f"New message on {conversation.application.reference}.",
                category="message",
                email_code="new_message",
            )
        conversation.save(update_fields=["updated_at"])
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)


class InquiryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InquirySerializer
    filterset_fields = ("status", "category")
    search_fields = ("subject", "message", "client__email")

    def get_queryset(self):
        qs = Inquiry.objects.select_related("client", "assigned_to", "application").prefetch_related("replies__author")
        if self.request.user.role == User.Role.CLIENT:
            return qs.filter(client=self.request.user)
        return qs

    def perform_create(self, serializer):
        inquiry = serializer.save(client=self.request.user if self.request.user.role == User.Role.CLIENT else serializer.validated_data.get("client") or self.request.user)
        log_action(actor=self.request.user, action="inquiry.created", target=inquiry)
        return inquiry

    @action(detail=True, methods=["post"])
    def reply(self, request, pk=None):
        inquiry = self.get_object()
        serializer = InquiryReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reply = InquiryReply.objects.create(inquiry=inquiry, author=request.user, body=serializer.validated_data["body"])
        if request.user.role == User.Role.CLIENT:
            inquiry.status = Inquiry.Status.IN_PROGRESS
        else:
            inquiry.status = Inquiry.Status.WAITING_FOR_CLIENT
            notify_user(inquiry.client, title="Inquiry update", body=f"A reply was added to: {inquiry.subject}", category="support")
        inquiry.save(update_fields=["status", "updated_at"])
        return Response(InquiryReplySerializer(reply).data, status=201)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsSupportRole])
    def set_status(self, request, pk=None):
        inquiry = self.get_object()
        new_status = request.data.get("status")
        if new_status not in Inquiry.Status.values:
            return Response({"detail": "Invalid status."}, status=400)
        inquiry.status = new_status
        if request.data.get("assigned_to"):
            inquiry.assigned_to_id = request.data["assigned_to"]
        inquiry.save()
        return Response(self.get_serializer(inquiry).data)
