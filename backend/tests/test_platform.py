from datetime import timedelta
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.applications.models import Application, ApplicationStatus
from apps.audit.models import AuditLog
from apps.clients.models import ClientProfile
from apps.consultations.models import Appointment, ConsultationType
from apps.documents.models import DocumentSubmission, DocumentType
from apps.messaging.models import Conversation, Inquiry
from apps.notifications.models import Notification
from apps.payments.models import Invoice
from apps.payments.providers import get_provider
from apps.services.models import Service
from apps.staff.models import StaffProfile


class PlatformAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_platform", verbosity=0)
        cls.admin = User.objects.create_user(
            email="admin.test@example.com",
            password="StrongPass!234",
            first_name="Ada",
            last_name="Admin",
            role=User.Role.ADMIN,
            is_staff=True,
        )
        cls.consultant = User.objects.create_user(
            email="consult.test@example.com",
            password="StrongPass!234",
            first_name="Sarah",
            last_name="Smith",
            role=User.Role.CONSULTANT,
            is_staff=True,
        )
        StaffProfile.objects.create(user=cls.consultant, job_title="Consultant", accepts_consultations=True)
        cls.reviewer = User.objects.create_user(
            email="review.test@example.com",
            password="StrongPass!234",
            first_name="Mike",
            last_name="Jones",
            role=User.Role.DOCUMENT_REVIEWER,
            is_staff=True,
        )
        cls.finance = User.objects.create_user(
            email="finance.test@example.com",
            password="StrongPass!234",
            first_name="Lee",
            last_name="Finance",
            role=User.Role.FINANCE,
            is_staff=True,
        )
        cls.client_user = User.objects.create_user(
            email="client.test@example.com",
            password="StrongPass!234",
            first_name="John",
            last_name="Doe",
            role=User.Role.CLIENT,
            phone="+27820000000",
        )
        ClientProfile.objects.create(
            user=cls.client_user,
            nationality="Zimbabwe",
            current_country="South Africa",
            passport_number="AB123",
        )
        cls.other_client = User.objects.create_user(
            email="other.client@example.com",
            password="StrongPass!234",
            first_name="Other",
            last_name="Person",
            role=User.Role.CLIENT,
        )
        ClientProfile.objects.create(user=cls.other_client, nationality="Lesotho", current_country="South Africa")
        cls.service = Service.objects.get(slug="permanent-residence-permit")

    def auth(self, user: User) -> None:
        self.client.force_authenticate(user=user)

    def _unwrap(self, response):
        payload = response.json()
        if isinstance(payload, dict) and payload.get("success") is True and "data" in payload:
            return payload["data"]
        return payload

    def test_register_and_login(self):
        response = self.client.post(
            "/api/v1/auth/register",
            {
                "first_name": "New",
                "last_name": "Client",
                "email": "new.client@example.com",
                "phone": "+27821112222",
                "country_of_nationality": "Angola",
                "current_country": "South Africa",
                "preferred_language": "en",
                "password": "StrongPass!234",
                "password_confirm": "StrongPass!234",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        data = self._unwrap(response)
        self.assertEqual(data["user"]["role"], "CLIENT")
        self.assertTrue(data["tokens"]["access"])
        self.assertTrue(User.objects.filter(email="new.client@example.com").exists())
        self.assertTrue(AuditLog.objects.filter(action="account.registered").exists())

    def test_public_services_come_from_backend(self):
        response = self.client.get("/api/v1/services")
        self.assertEqual(response.status_code, 200)
        data = self._unwrap(response)
        results = data["results"] if isinstance(data, dict) else data
        slugs = {item["slug"] for item in results}
        self.assertIn("permanent-residence-permit", slugs)
        self.assertIn("zimbabwean-exemption-permit", slugs)

    def test_client_isolation_on_applications(self):
        self.auth(self.client_user)
        created = self.client.post("/api/v1/applications", {"service": self.service.slug}, format="json")
        self.assertEqual(created.status_code, 201)
        own = self._unwrap(created)
        self.auth(self.other_client)
        listed = self._unwrap(self.client.get("/api/v1/applications"))
        results = listed["results"] if isinstance(listed, dict) else listed
        self.assertEqual(results, [])
        forbidden = self.client.get(f"/api/v1/applications/{own['id']}")
        self.assertIn(forbidden.status_code, {403, 404})

    def test_application_creates_document_checklist_and_conversation(self):
        self.auth(self.client_user)
        response = self.client.post("/api/v1/applications", {"service": self.service.slug}, format="json")
        self.assertEqual(response.status_code, 201)
        data = self._unwrap(response)
        application = Application.objects.get(pk=data["id"])
        self.assertTrue(application.reference.startswith("MVS-"))
        self.assertGreater(application.documents.count(), 0)
        self.assertTrue(Conversation.objects.filter(application=application).exists())
        self.assertGreaterEqual(application.progress, 0)
        self.assertLessEqual(application.progress, 100)

    def test_document_upload_and_review_flow(self):
        self.auth(self.client_user)
        created = self._unwrap(self.client.post("/api/v1/applications", {"service": self.service.slug}, format="json"))
        application = Application.objects.get(pk=created["id"])
        application.assigned_reviewer = self.reviewer
        application.save()
        submission = application.documents.first()
        pdf = SimpleUploadedFile("passport.pdf", b"%PDF-1.4 test", content_type="application/pdf")
        upload = self.client.post(f"/api/v1/documents/{submission.id}/upload", {"file": pdf}, format="multipart")
        self.assertEqual(upload.status_code, 200)
        submission.refresh_from_db()
        self.assertEqual(submission.status, DocumentSubmission.Status.UPLOADED)
        self.auth(self.other_client)
        blocked = self.client.get(f"/api/v1/documents/{submission.id}/download")
        self.assertIn(blocked.status_code, {403, 404})
        self.auth(self.reviewer)
        review = self.client.post(
            f"/api/v1/documents/{submission.id}/review",
            {"outcome": "REJECTED", "reason": "Document is older than the required period."},
            format="json",
        )
        self.assertEqual(review.status_code, 200)
        submission.refresh_from_db()
        self.assertEqual(submission.status, DocumentSubmission.Status.REJECTED)
        self.assertTrue(AuditLog.objects.filter(action="document.rejected").exists())
        self.assertTrue(Notification.objects.filter(user=self.client_user, category="document").exists())

    def test_staff_document_request(self):
        self.auth(self.client_user)
        created = self._unwrap(self.client.post("/api/v1/applications", {"service": self.service.slug}, format="json"))
        doc_type = DocumentType.objects.get(code="medical-report")
        self.auth(self.consultant)
        response = self.client.post(
            "/api/v1/document-requests",
            {
                "application": created["id"],
                "document_type_id": doc_type.id,
                "description": "Please provide a recent medical report.",
                "is_required": True,
                "notify_email": True,
                "notify_in_app": True,
                "notify_push": False,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            DocumentSubmission.objects.filter(application_id=created["id"], document_type=doc_type).exists()
        )

    def test_consultation_booking(self):
        consultation = ConsultationType.objects.get(slug="visa-consultation")
        self.auth(self.client_user)
        starts = (timezone.now() + timedelta(days=3)).replace(hour=10, minute=0, second=0, microsecond=0)
        response = self.client.post(
            "/api/v1/appointments",
            {
                "consultation_type_id": consultation.id,
                "consultant_id": self.consultant.id,
                "starts_at": starts.isoformat(),
                "client_notes": "Need advice on TRP renewal.",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        data = self._unwrap(response)
        self.assertEqual(data["status"], "PENDING")
        self.assertTrue(Appointment.objects.filter(client=self.client_user).exists())

    def test_messaging_and_inquiries(self):
        self.auth(self.client_user)
        created = self._unwrap(self.client.post("/api/v1/applications", {"service": self.service.slug}, format="json"))
        conversation = Conversation.objects.get(application_id=created["id"])
        sent = self.client.post(
            f"/api/v1/conversations/{conversation.id}/messages",
            {"body": "I have uploaded my passport."},
            format="json",
        )
        self.assertEqual(sent.status_code, 201)
        inquiry = self.client.post(
            "/api/v1/inquiries",
            {"subject": "Question about my application", "category": "APPLICATION", "message": "When will review start?"},
            format="json",
        )
        self.assertEqual(inquiry.status_code, 201)
        self.assertTrue(Inquiry.objects.filter(client=self.client_user).exists())

    def test_notifications_are_user_scoped(self):
        Notification.objects.create(user=self.client_user, title="Yours", body="Only you", category="account")
        Notification.objects.create(user=self.other_client, title="Theirs", body="Not you", category="account")
        self.auth(self.client_user)
        data = self._unwrap(self.client.get("/api/v1/notifications"))
        results = data["results"] if isinstance(data, dict) else data
        titles = {item["title"] for item in results}
        self.assertIn("Yours", titles)
        self.assertNotIn("Theirs", titles)

    def test_payments_modular_and_finance_only_write(self):
        self.assertEqual(get_provider("manual").code, "manual")
        self.auth(self.client_user)
        forbidden = self.client.post(
            "/api/v1/invoices",
            {"client": self.client_user.id, "description": "Consultation", "amount_cents": 85000, "currency": "ZAR"},
            format="json",
        )
        self.assertIn(forbidden.status_code, {403, 401})
        self.auth(self.finance)
        created = self.client.post(
            "/api/v1/invoices",
            {"client": self.client_user.id, "description": "Consultation", "amount_cents": 85000, "currency": "ZAR"},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        invoice = Invoice.objects.get(client=self.client_user)
        paid = self.client.post(f"/api/v1/invoices/{invoice.id}/record_payment", {"provider": "manual"}, format="json")
        self.assertEqual(paid.status_code, 200)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, Invoice.Status.PAID)

    def test_audit_not_writable(self):
        self.auth(self.admin)
        listed = self.client.get("/api/v1/audit")
        self.assertEqual(listed.status_code, 200)
        created = self.client.post("/api/v1/audit", {"action": "hack"}, format="json")
        self.assertEqual(created.status_code, 405)

    def test_home_content_endpoint(self):
        response = self.client.get("/api/v1/content/settings/home")
        self.assertEqual(response.status_code, 200)
        data = self._unwrap(response)
        self.assertIn("settings", data)
        self.assertIn("services", data)
        self.assertTrue(data["services"])

    def test_staff_reports(self):
        self.auth(self.admin)
        response = self.client.get("/api/v1/reports/dashboard")
        self.assertEqual(response.status_code, 200)
        data = self._unwrap(response)
        self.assertIn("totals", data)
        self.auth(self.client_user)
        denied = self.client.get("/api/v1/reports/dashboard")
        self.assertEqual(denied.status_code, 403)
