from rest_framework import serializers

from apps.services.models import Service, ServiceFAQ, ServiceRequirement


class ServiceRequirementSerializer(serializers.ModelSerializer):
    document_type_name = serializers.CharField(source="document_type.name", read_only=True)
    document_type_code = serializers.CharField(source="document_type.code", read_only=True)

    class Meta:
        model = ServiceRequirement
        fields = (
            "id",
            "document_type",
            "document_type_name",
            "document_type_code",
            "description",
            "is_required",
            "sort_order",
        )


class ServiceFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceFAQ
        fields = ("id", "question", "answer", "sort_order", "is_active")


class ServiceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = (
            "id",
            "name",
            "slug",
            "short_description",
            "icon",
            "image",
            "consultation_available",
            "estimated_processing",
            "is_active",
            "sort_order",
            "seo_title",
            "seo_description",
        )


class ServiceDetailSerializer(serializers.ModelSerializer):
    requirements = ServiceRequirementSerializer(many=True, read_only=True)
    faqs = ServiceFAQSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = (
            "id",
            "name",
            "slug",
            "short_description",
            "description",
            "who_its_for",
            "process_overview",
            "estimated_processing",
            "icon",
            "image",
            "consultation_available",
            "is_active",
            "sort_order",
            "seo_title",
            "seo_description",
            "requirements",
            "faqs",
        )


class ServiceWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = (
            "id",
            "name",
            "slug",
            "short_description",
            "description",
            "who_its_for",
            "process_overview",
            "estimated_processing",
            "icon",
            "image",
            "consultation_available",
            "is_active",
            "sort_order",
            "seo_title",
            "seo_description",
        )
