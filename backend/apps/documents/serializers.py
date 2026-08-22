from rest_framework import serializers

from apps.documents.models import DocumentRequest, DocumentReview, DocumentSubmission, DocumentType


class DocumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentType
        fields = ("id", "code", "name", "description", "is_active")


class DocumentReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.full_name", read_only=True, default=None)

    class Meta:
        model = DocumentReview
        fields = ("id", "outcome", "reason", "client_visible_note", "internal_note", "reviewer_name", "created_at")


class DocumentSubmissionSerializer(serializers.ModelSerializer):
    document_type = DocumentTypeSerializer(read_only=True)
    document_type_id = serializers.PrimaryKeyRelatedField(
        source="document_type", queryset=DocumentType.objects.filter(is_active=True), write_only=True, required=False
    )
    has_file = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()

    class Meta:
        model = DocumentSubmission
        fields = (
            "id",
            "application",
            "document_type",
            "document_type_id",
            "status",
            "has_file",
            "original_filename",
            "uploaded_at",
            "rejection_reason",
            "client_note",
            "reviewed_at",
            "expires_at",
            "page_count",
            "reviews",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "status",
            "has_file",
            "original_filename",
            "uploaded_at",
            "reviewed_at",
            "created_at",
            "updated_at",
        )

    def get_has_file(self, obj: DocumentSubmission) -> bool:
        return bool(obj.file)

    def get_reviews(self, obj: DocumentSubmission):
        request = self.context.get("request")
        reviews = obj.reviews.select_related("reviewer")
        if request and getattr(request.user, "role", "") == "CLIENT":
            return [
                {
                    "id": review.id,
                    "outcome": review.outcome,
                    "reason": review.reason,
                    "client_visible_note": review.client_visible_note,
                    "created_at": review.created_at,
                }
                for review in reviews
            ]
        return DocumentReviewSerializer(reviews, many=True).data


class StaffDocumentSubmissionSerializer(DocumentSubmissionSerializer):
    internal_note = serializers.CharField(required=False, allow_blank=True)

    class Meta(DocumentSubmissionSerializer.Meta):
        fields = DocumentSubmissionSerializer.Meta.fields + ("internal_note",)


class DocumentRequestSerializer(serializers.ModelSerializer):
    document_type = DocumentTypeSerializer(read_only=True)
    document_type_id = serializers.PrimaryKeyRelatedField(
        source="document_type", queryset=DocumentType.objects.filter(is_active=True), write_only=True
    )

    class Meta:
        model = DocumentRequest
        fields = (
            "id",
            "application",
            "document_type",
            "document_type_id",
            "description",
            "due_date",
            "is_required",
            "notify_email",
            "notify_push",
            "notify_in_app",
            "is_open",
            "created_at",
        )
        read_only_fields = ("id", "is_open", "created_at")


class DocumentReviewActionSerializer(serializers.Serializer):
    outcome = serializers.ChoiceField(choices=DocumentReview.Outcome.choices)
    reason = serializers.CharField(required=False, allow_blank=True)
    client_visible_note = serializers.CharField(required=False, allow_blank=True)
    internal_note = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["outcome"] in {DocumentReview.Outcome.REJECTED, DocumentReview.Outcome.REPLACEMENT_REQUIRED}:
            if not attrs.get("reason"):
                raise serializers.ValidationError({"reason": "A reason is required when rejecting or requesting replacement."})
        return attrs
