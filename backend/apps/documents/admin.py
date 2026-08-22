from django.contrib import admin

from apps.documents.models import DocumentRequest, DocumentReview, DocumentSubmission, DocumentType


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_active")
    search_fields = ("name", "code")


@admin.register(DocumentSubmission)
class DocumentSubmissionAdmin(admin.ModelAdmin):
    list_display = ("application", "document_type", "status", "uploaded_at", "reviewed_by")
    list_filter = ("status",)
    search_fields = ("application__reference", "document_type__name")


@admin.register(DocumentRequest)
class DocumentRequestAdmin(admin.ModelAdmin):
    list_display = ("application", "document_type", "is_open", "due_date")


@admin.register(DocumentReview)
class DocumentReviewAdmin(admin.ModelAdmin):
    list_display = ("submission", "outcome", "reviewer", "created_at")
