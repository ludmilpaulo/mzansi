from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.applications.models import Application
from apps.consultations.models import Appointment
from apps.documents.models import DocumentReview, DocumentSubmission
from apps.payments.models import Invoice, Payment
from config.permissions import IsStaffUser


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        now = timezone.now()
        start_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        applications = Application.objects.all()
        monthly = (
            applications.filter(created_at__gte=start_year)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        by_service = applications.values("service__name").annotate(count=Count("id")).order_by("-count")
        by_status = applications.values("status__label", "status__code").annotate(count=Count("id")).order_by("-count")
        reviews = DocumentReview.objects.all()
        rejected = reviews.filter(outcome="REJECTED").count()
        verified = reviews.filter(outcome="VERIFIED").count()
        paid = Payment.objects.filter(status="COMPLETED").aggregate(total=Sum("amount_cents"))["total"] or 0
        return Response(
            {
                "totals": {
                    "clients": User.objects.filter(role=User.Role.CLIENT).count(),
                    "active_applications": applications.filter(status__is_terminal=False).count(),
                    "pending_documents": DocumentSubmission.objects.filter(
                        status__in=["REQUESTED", "UPLOADED", "UNDER_REVIEW", "REJECTED", "REPLACEMENT_REQUIRED"]
                    ).count(),
                    "consultations": Appointment.objects.filter(starts_at__gte=now, status__in=["PENDING", "CONFIRMED"]).count(),
                    "completed_applications": applications.filter(status__category="completed").count(),
                    "revenue_cents": paid,
                    "outstanding_invoices": Invoice.objects.filter(status__in=["ISSUED", "OVERDUE"]).count(),
                },
                "applications_over_time": [
                    {"month": item["month"].date().isoformat() if item["month"] else None, "count": item["count"]}
                    for item in monthly
                ],
                "applications_by_service": list(by_service),
                "applications_by_status": list(by_status),
                "document_verification": {
                    "verified": verified,
                    "rejected": rejected,
                    "rejection_rate": (rejected / reviews.count()) if reviews.count() else 0,
                },
                "new_clients": [
                    {"month": item["month"].date().isoformat() if item["month"] else None, "count": item["count"]}
                    for item in (
                        User.objects.filter(role=User.Role.CLIENT, date_joined__gte=start_year)
                        .annotate(month=TruncMonth("date_joined"))
                        .values("month")
                        .annotate(count=Count("id"))
                        .order_by("month")
                    )
                ],
                "staff_workload": list(
                    applications.exclude(assigned_consultant=None)
                    .values("assigned_consultant__first_name", "assigned_consultant__last_name", "assigned_consultant__email")
                    .annotate(count=Count("id"))
                    .order_by("-count")
                ),
            }
        )
