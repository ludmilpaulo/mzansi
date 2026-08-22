from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.audit.services import log_action
from apps.payments.models import Invoice, Payment
from apps.payments.providers import get_provider
from apps.payments.serializers import InvoiceSerializer
from config.permissions import IsFinanceRole


def next_invoice_number() -> str:
    year = timezone.now().year
    prefix = f"INV-{year}-"
    count = Invoice.objects.filter(number__startswith=prefix).count() + 1
    return f"{prefix}{count:05d}"


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InvoiceSerializer
    filterset_fields = ("status", "client")
    search_fields = ("number", "description", "client__email")

    def get_queryset(self):
        qs = Invoice.objects.select_related("client", "application").prefetch_related("payments")
        if self.request.user.role == User.Role.CLIENT:
            return qs.filter(client=self.request.user)
        return qs

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy", "record_payment"}:
            return [IsAuthenticated(), IsFinanceRole()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        invoice = serializer.save(number=next_invoice_number())
        log_action(actor=self.request.user, action="invoice.created", target=invoice)
        return invoice

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsFinanceRole])
    def record_payment(self, request, pk=None):
        invoice = self.get_object()
        provider = get_provider(request.data.get("provider"))
        payment = Payment.objects.create(
            invoice=invoice,
            provider=provider.code,
            provider_reference=request.data.get("provider_reference", ""),
            amount_cents=int(request.data.get("amount_cents", invoice.amount_cents)),
            currency=invoice.currency,
            status=Payment.Status.COMPLETED,
            received_at=timezone.now(),
        )
        invoice.status = Invoice.Status.PAID
        invoice.save(update_fields=["status", "updated_at"])
        log_action(actor=request.user, action="payment.recorded", target=invoice, metadata={"payment_id": payment.id})
        return Response(self.get_serializer(invoice).data)
