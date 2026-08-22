from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.applications.models import Application
from apps.applications.services import refresh_progress
from apps.applications.views import scoped_applications
from apps.audit.services import log_action
from apps.common.storage import validate_upload
from apps.documents.models import DocumentRequest, DocumentReview, DocumentSubmission, DocumentType
from apps.documents.serializers import (
    DocumentRequestSerializer,
    DocumentReviewActionSerializer,
    DocumentSubmissionSerializer,
    DocumentTypeSerializer,
    StaffDocumentSubmissionSerializer,
)
from apps.notifications.services import notify_user
from config.permissions import IsAdminRole, IsReviewerRole, IsStaffUser


class DocumentTypeViewSet(viewsets.ModelViewSet):
    queryset = DocumentType.objects.all()
    serializer_class = DocumentTypeSerializer
    search_fields = ("name", "code")

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminRole()]


class DocumentSubmissionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ("application", "status", "document_type")
    search_fields = ("document_type__name", "original_filename", "application__reference")

    def get_queryset(self):
        apps = scoped_applications(self.request.user).values_list("id", flat=True)
        qs = DocumentSubmission.objects.select_related(
            "application", "document_type", "uploaded_by", "reviewed_by"
        ).prefetch_related("reviews__reviewer")
        return qs.filter(application_id__in=apps)

    def get_serializer_class(self):
        if self.request.user.role != User.Role.CLIENT:
            return StaffDocumentSubmissionSerializer
        return DocumentSubmissionSerializer

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request, pk=None):
        submission = self.get_object()
        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "A file is required."}, status=400)
        validate_upload(upload)
        submission.file = upload
        submission.original_filename = upload.name
        submission.uploaded_by = request.user
        submission.uploaded_at = timezone.now()
        submission.status = DocumentSubmission.Status.UPLOADED
        submission.rejection_reason = ""
        submission.save()
        if submission.request:
            submission.request.is_open = False
            submission.request.save(update_fields=["is_open", "updated_at"])
        refresh_progress(submission.application)
        log_action(actor=request.user, action="document.uploaded", target=submission.application, metadata={"document": submission.document_type.name})
        staff = submission.application.assigned_consultant or submission.application.assigned_reviewer
        if staff:
            notify_user(
                staff,
                title="Document uploaded",
                body=f"{request.user.full_name} uploaded {submission.document_type.name} for {submission.application.reference}.",
                category="document",
            )
        return Response(self.get_serializer(submission).data)

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        submission = self.get_object()
        if not submission.file:
            return Response({"detail": "No file has been uploaded."}, status=404)
        return FileResponse(submission.file.open("rb"), as_attachment=True, filename=submission.original_filename or "document")

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsReviewerRole])
    def review(self, request, pk=None):
        submission = self.get_object()
        serializer = DocumentReviewActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        outcome = data["outcome"]
        DocumentReview.objects.create(
            submission=submission,
            reviewer=request.user,
            **data,
        )
        status_map = {
            DocumentReview.Outcome.VERIFIED: DocumentSubmission.Status.VERIFIED,
            DocumentReview.Outcome.REJECTED: DocumentSubmission.Status.REJECTED,
            DocumentReview.Outcome.REPLACEMENT_REQUIRED: DocumentSubmission.Status.REPLACEMENT_REQUIRED,
        }
        submission.status = status_map[outcome]
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.rejection_reason = data.get("reason", "")
        submission.client_note = data.get("client_visible_note", submission.client_note)
        if data.get("internal_note"):
            submission.internal_note = data["internal_note"]
        submission.save()
        refresh_progress(submission.application)
        log_action(
            actor=request.user,
            action=f"document.{outcome.lower()}",
            target=submission.application,
            metadata={"document": submission.document_type.name, "reason": submission.rejection_reason},
        )
        notify_user(
            submission.application.client,
            title=f"{submission.document_type.name} {outcome.replace('_', ' ').title()}",
            body=data.get("client_visible_note") or data.get("reason") or f"Your {submission.document_type.name} was updated.",
            category="document",
            email_code="document_reviewed",
        )
        return Response(self.get_serializer(submission).data)


class DocumentRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = DocumentRequestSerializer
    filterset_fields = ("application", "is_open", "is_required")

    def get_queryset(self):
        apps = scoped_applications(self.request.user).values_list("id", flat=True)
        return DocumentRequest.objects.select_related("application", "document_type").filter(application_id__in=apps)

    def perform_create(self, serializer):
        request_obj = serializer.save(requested_by=self.request.user)
        submission, created = DocumentSubmission.objects.get_or_create(
            application=request_obj.application,
            document_type=request_obj.document_type,
            defaults={"status": DocumentSubmission.Status.REQUESTED, "request": request_obj, "client_note": request_obj.description},
        )
        if not created:
            submission.status = DocumentSubmission.Status.REQUESTED
            submission.request = request_obj
            submission.client_note = request_obj.description
            submission.save()
        refresh_progress(request_obj.application)
        log_action(
            actor=self.request.user,
            action="document.requested",
            target=request_obj.application,
            metadata={"document": request_obj.document_type.name},
        )
        if request_obj.notify_in_app or request_obj.notify_email or request_obj.notify_push:
            notify_user(
                request_obj.application.client,
                title="Document requested",
                body=request_obj.description or f"Please upload {request_obj.document_type.name}.",
                category="document",
                email_code="document_requested" if request_obj.notify_email else "",
                send_push=request_obj.notify_push,
            )
