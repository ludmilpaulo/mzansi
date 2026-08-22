from rest_framework import serializers

from apps.payments.models import Invoice, Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ("id", "provider", "provider_reference", "amount_cents", "currency", "status", "received_at", "created_at")
        read_only_fields = fields


class InvoiceSerializer(serializers.ModelSerializer):
    payments = PaymentSerializer(many=True, read_only=True)
    amount = serializers.SerializerMethodField()
    client_name = serializers.CharField(source="client.full_name", read_only=True)

    class Meta:
        model = Invoice
        fields = (
            "id",
            "number",
            "client",
            "client_name",
            "application",
            "appointment",
            "description",
            "amount_cents",
            "amount",
            "currency",
            "status",
            "due_date",
            "payments",
            "created_at",
        )
        read_only_fields = ("id", "number", "created_at")

    def get_amount(self, obj: Invoice) -> str:
        return f"{obj.currency} {obj.amount_cents / 100:.2f}"
