from rest_framework import serializers

from apps.applications.models import Application, ApplicationNote, ApplicationStatus, ApplicationTask, ApplicationTimeline
from apps.services.models import Service
from apps.services.serializers import ServiceListSerializer


class ApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationStatus
        fields = (
            "id",
            "code",
            "label",
            "description",
            "category",
            "sort_order",
            "progress_weight",
            "is_terminal",
            "client_action_required",
            "is_active",
        )


class TimelineSerializer(serializers.ModelSerializer):
    status = ApplicationStatusSerializer(read_only=True)
    staff_name = serializers.CharField(source="staff_member.full_name", read_only=True, default=None)

    class Meta:
        model = ApplicationTimeline
        fields = (
            "id",
            "status",
            "title",
            "description",
            "staff_name",
            "client_action_required",
            "is_visible_to_client",
            "occurred_at",
        )


class ApplicationNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True, default=None)

    class Meta:
        model = ApplicationNote
        fields = ("id", "body", "is_visible_to_client", "author_name", "created_at")
        read_only_fields = ("id", "author_name", "created_at")


class ApplicationTaskSerializer(serializers.ModelSerializer):
    assigned_name = serializers.CharField(source="assigned_to.full_name", read_only=True, default=None)

    class Meta:
        model = ApplicationTask
        fields = ("id", "title", "description", "assigned_to", "assigned_name", "status", "due_date", "created_at")


class ApplicationListSerializer(serializers.ModelSerializer):
    service = ServiceListSerializer(read_only=True)
    status = ApplicationStatusSerializer(read_only=True)
    client_name = serializers.CharField(source="client.full_name", read_only=True)
    client_email = serializers.EmailField(source="client.email", read_only=True)
    consultant_name = serializers.CharField(source="assigned_consultant.full_name", read_only=True, default=None)
    document_counts = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = (
            "id",
            "reference",
            "client",
            "client_name",
            "client_email",
            "service",
            "status",
            "assigned_consultant",
            "consultant_name",
            "progress",
            "next_action",
            "document_counts",
            "created_at",
            "updated_at",
        )

    def get_document_counts(self, obj: Application) -> dict[str, int]:
        docs = list(obj.documents.all()) if hasattr(obj, "_prefetched_objects_cache") and "documents" in obj._prefetched_objects_cache else list(obj.documents.all())
        return {
            "total": len(docs),
            "verified": sum(1 for doc in docs if doc.status == "VERIFIED"),
            "pending": sum(1 for doc in docs if doc.status in {"REQUESTED", "REJECTED", "REPLACEMENT_REQUIRED"}),
            "under_review": sum(1 for doc in docs if doc.status in {"UPLOADED", "UNDER_REVIEW"}),
        }


class ApplicationDetailSerializer(ApplicationListSerializer):
    timeline = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()
    tasks = ApplicationTaskSerializer(many=True, read_only=True)
    reviewer_name = serializers.CharField(source="assigned_reviewer.full_name", read_only=True, default=None)

    class Meta(ApplicationListSerializer.Meta):
        fields = ApplicationListSerializer.Meta.fields + (
            "assigned_reviewer",
            "reviewer_name",
            "submitted_at",
            "completed_at",
            "decision_notes",
            "timeline",
            "notes",
            "tasks",
        )

    def get_timeline(self, obj: Application):
        request = self.context.get("request")
        events = obj.timeline.select_related("status", "staff_member")
        if request and getattr(request.user, "role", "") == "CLIENT":
            events = events.filter(is_visible_to_client=True)
        return TimelineSerializer(events, many=True).data

    def get_notes(self, obj: Application):
        request = self.context.get("request")
        notes = obj.notes.select_related("author")
        if request and getattr(request.user, "role", "") == "CLIENT":
            notes = notes.filter(is_visible_to_client=True)
        return ApplicationNoteSerializer(notes, many=True).data


class ApplicationCreateSerializer(serializers.Serializer):
    service = serializers.SlugRelatedField(slug_field="slug", queryset=Service.objects.filter(is_active=True))
    client_id = serializers.IntegerField(required=False)

    def create(self, validated_data):
        from apps.accounts.models import User
        from apps.applications.services import create_application

        request = self.context["request"]
        service = validated_data["service"]
        if request.user.role == User.Role.CLIENT:
            client = request.user
        else:
            client_id = validated_data.get("client_id")
            if not client_id:
                raise serializers.ValidationError({"client_id": "Required when creating on behalf of a client."})
            client = User.objects.get(pk=client_id, role=User.Role.CLIENT)
        return create_application(client=client, service=service, actor=request.user)
