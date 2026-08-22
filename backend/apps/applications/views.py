from django.db.models import Prefetch, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.applications.models import Application, ApplicationNote, ApplicationStatus, ApplicationTask
from apps.applications.serializers import (
    ApplicationCreateSerializer,
    ApplicationDetailSerializer,
    ApplicationListSerializer,
    ApplicationNoteSerializer,
    ApplicationStatusSerializer,
    ApplicationTaskSerializer,
)
from apps.applications.services import refresh_progress, transition_application
from apps.audit.services import log_action
from apps.documents.models import DocumentSubmission
from apps.notifications.services import notify_user
from config.permissions import ADMIN_ROLES, IsConsultantRole, IsStaffUser


def scoped_applications(user):
    qs = Application.objects.select_related(
        "client",
        "client__client_profile",
        "service",
        "status",
        "assigned_consultant",
        "assigned_reviewer",
    ).prefetch_related(
        Prefetch("documents", queryset=DocumentSubmission.objects.select_related("document_type")),
        "timeline__status",
        "notes",
        "tasks",
    )
    if user.role == User.Role.CLIENT:
        return qs.filter(client=user)
    if user.role in ADMIN_ROLES or user.role in {"SUPPORT", "FINANCE"}:
        return qs
    if user.role == User.Role.CONSULTANT:
        return qs.filter(Q(assigned_consultant=user) | Q(assigned_consultant__isnull=True))
    if user.role == User.Role.DOCUMENT_REVIEWER:
        return qs.filter(Q(assigned_reviewer=user) | Q(assigned_reviewer__isnull=True))
    return qs.none()


class ApplicationStatusViewSet(viewsets.ModelViewSet):
    queryset = ApplicationStatus.objects.all()
    serializer_class = ApplicationStatusSerializer
    filterset_fields = ("is_active", "category")

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsStaffUser()]


class ApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    search_fields = ("reference", "client__email", "client__first_name", "client__last_name", "service__name")
    filterset_fields = ("status__code", "status__category", "service__slug", "assigned_consultant")
    ordering_fields = ("created_at", "updated_at", "progress", "reference")
    ordering = ("-updated_at",)

    def get_queryset(self):
        qs = scoped_applications(self.request.user)
        bucket = self.request.query_params.get("bucket")
        mapping = {
            "active": Q(status__category="active"),
            "pending": Q(status__category="pending"),
            "completed": Q(status__category="completed"),
            "cancelled": Q(status__category="cancelled"),
            "new": Q(status__code="DRAFT") | Q(status__code="SUBMITTED"),
            "in_progress": Q(status__category="active"),
            "awaiting_client": Q(status__client_action_required=True),
            "documents_review": Q(status__code="DOCUMENTS_UNDER_REVIEW"),
            "submitted": Q(status__code="SUBMITTED_TO_AUTHORITY") | Q(status__code="AWAITING_DECISION"),
        }
        if bucket in mapping:
            qs = qs.filter(mapping[bucket])
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return ApplicationCreateSerializer
        if self.action == "list":
            return ApplicationListSerializer
        return ApplicationDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = ApplicationCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        log_action(actor=request.user, action="application.created", target=application, metadata={"reference": application.reference})
        notify_user(
            application.client,
            title="Application created",
            body=f"Application {application.reference} for {application.service.name} is ready.",
            category="application",
            email_code="application_created",
        )
        return Response(ApplicationDetailSerializer(application, context={"request": request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsConsultantRole])
    def transition(self, request, pk=None):
        application = self.get_object()
        code = request.data.get("status_code")
        note = request.data.get("note", "")
        status_obj = ApplicationStatus.objects.filter(code=code, is_active=True).first()
        if not status_obj:
            return Response({"detail": "Unknown or inactive status."}, status=400)
        transition_application(application=application, status=status_obj, actor=request.user, note=note)
        log_action(actor=request.user, action="application.status_changed", target=application, metadata={"status": code})
        notify_user(
            application.client,
            title="Application status updated",
            body=f"{application.reference} is now {status_obj.label}.",
            category="application",
            email_code="application_status_changed",
        )
        return Response(ApplicationDetailSerializer(application, context={"request": request}).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsConsultantRole])
    def assign(self, request, pk=None):
        application = self.get_object()
        consultant_id = request.data.get("consultant_id")
        reviewer_id = request.data.get("reviewer_id")
        if consultant_id is not None:
            application.assigned_consultant_id = consultant_id or None
        if reviewer_id is not None:
            application.assigned_reviewer_id = reviewer_id or None
        application.save()
        log_action(actor=request.user, action="application.assigned", target=application)
        return Response(ApplicationDetailSerializer(application, context={"request": request}).data)

    @action(detail=True, methods=["get", "post"])
    def notes(self, request, pk=None):
        application = self.get_object()
        if request.method == "GET":
            notes = application.notes.select_related("author")
            if request.user.role == User.Role.CLIENT:
                notes = notes.filter(is_visible_to_client=True)
            return Response(ApplicationNoteSerializer(notes, many=True).data)
        if request.user.role == User.Role.CLIENT:
            return Response({"detail": "Clients cannot add staff notes."}, status=403)
        serializer = ApplicationNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = ApplicationNote.objects.create(
            application=application,
            author=request.user,
            **serializer.validated_data,
        )
        return Response(ApplicationNoteSerializer(note).data, status=201)

    @action(detail=True, methods=["get", "post"], permission_classes=[IsAuthenticated, IsStaffUser])
    def tasks(self, request, pk=None):
        application = self.get_object()
        if request.method == "GET":
            return Response(ApplicationTaskSerializer(application.tasks.all(), many=True).data)
        serializer = ApplicationTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = ApplicationTask.objects.create(application=application, **serializer.validated_data)
        return Response(ApplicationTaskSerializer(task).data, status=201)

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        qs = self.get_queryset()
        active = qs.exclude(status__is_terminal=True).first()
        data = {
            "active_application": ApplicationDetailSerializer(active, context={"request": request}).data if active else None,
            "counts": {
                "active": qs.filter(status__category="active").count(),
                "completed": qs.filter(status__category="completed").count(),
                "pending": qs.filter(status__category="pending").count(),
            },
        }
        if active:
            refresh_progress(active)
            data["active_application"] = ApplicationDetailSerializer(active, context={"request": request}).data
        return Response(data)
