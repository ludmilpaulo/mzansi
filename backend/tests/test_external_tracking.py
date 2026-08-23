from datetime import date
from unittest.mock import patch

from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.applications.crypto import decrypt_value, encrypt_value, mask_passport
from apps.applications.models import (
    Application,
    ApplicationExternalTracking,
    ApplicationStatus,
    ApplicationTimeline,
    ExternalApplicationStatus,
)
from apps.applications.tracking.types import TrackingResult
from apps.audit.models import AuditLog
from apps.clients.models import ClientProfile
from apps.notifications.models import Notification
from apps.services.models import Service
from apps.staff.models import StaffProfile


class FakeAvailableProvider:
    provider_code = "VFS"

    def is_available(self) -> bool:
        return True

    def get_status(self, *, reference_number: str, passport_number: str, date_of_birth: date | None) -> TrackingResult:
        return TrackingResult(
            provider="VFS",
            status_code="APPLICATION_UNDER_PROCESS",
            status_label="Application Under Process",
            source="API",
            checked_at=timezone.now(),
        )


class ExternalTrackingTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_platform", verbosity=0)
        cls.admin = User.objects.create_user(
            email="track.admin@example.com",
            password="StrongPass!234",
            first_name="Ada",
            last_name="Admin",
            role=User.Role.ADMIN,
            is_staff=True,
        )
        cls.consultant = User.objects.create_user(
            email="track.consult@example.com",
            password="StrongPass!234",
            first_name="Sarah",
            last_name="Smith",
            role=User.Role.CONSULTANT,
            is_staff=True,
        )
        StaffProfile.objects.create(user=cls.consultant, job_title="Consultant", accepts_consultations=True)
        cls.client_user = User.objects.create_user(
            email="track.client@example.com",
            password="StrongPass!234",
            first_name="John",
            last_name="Doe",
            role=User.Role.CLIENT,
        )
        ClientProfile.objects.create(user=cls.client_user, nationality="Zimbabwe", current_country="South Africa")
        cls.other_client = User.objects.create_user(
            email="track.other@example.com",
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

    def _create_application(self, user: User) -> dict:
        self.auth(user)
        response = self.client.post("/api/v1/applications", {"service": self.service.slug}, format="json")
        self.assertEqual(response.status_code, 201)
        return self._unwrap(response)

    def test_mask_and_encrypt_passport(self):
        self.assertEqual(mask_passport("A123456789"), "********6789")
        token = encrypt_value("A123456789")
        self.assertNotIn("A123456789", token)
        self.assertEqual(decrypt_value(token), "A123456789")

    def test_staff_can_store_tracking_details_without_exposing_passport(self):
        app = self._create_application(self.client_user)
        internal_code = app["status"]["code"]
        self.auth(self.consultant)
        response = self.client.patch(
            f"/api/v1/applications/{app['id']}/tracking",
            {
                "reference_number": "ABC123456789",
                "passport_number": "A123456789",
                "date_of_birth": "1990-05-12",
                "country": "South Africa",
                "application_centre": "Cape Town",
                "tracking_enabled": True,
                "provider": "VFS",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = self._unwrap(response)
        self.assertEqual(data["reference_number"], "ABC123456789")
        self.assertEqual(data["passport_masked"], "********6789")
        self.assertTrue(data["has_date_of_birth"])
        self.assertNotIn("passport_number", data)
        self.assertNotIn("A123456789", response.content.decode())
        self.assertNotIn("1990-05-12", response.content.decode())
        tracking = ApplicationExternalTracking.objects.get(application_id=app["id"])
        self.assertNotEqual(tracking.passport_encrypted, "A123456789")
        self.assertEqual(decrypt_value(tracking.passport_encrypted), "A123456789")
        application = Application.objects.get(pk=app["id"])
        self.assertEqual(application.status.code, internal_code)

    def test_client_cannot_access_another_clients_tracking(self):
        app = self._create_application(self.client_user)
        self.auth(self.consultant)
        self.client.patch(
            f"/api/v1/applications/{app['id']}/tracking",
            {"reference_number": "ABC123456789", "passport_number": "A123456789", "tracking_enabled": True},
            format="json",
        )
        self.auth(self.other_client)
        forbidden = self.client.get(f"/api/v1/applications/{app['id']}/tracking")
        self.assertIn(forbidden.status_code, {403, 404})
        refresh = self.client.post(f"/api/v1/applications/{app['id']}/tracking/refresh", {}, format="json")
        self.assertIn(refresh.status_code, {403, 404})

    def test_refresh_without_official_api_does_not_claim_vfs_status(self):
        app = self._create_application(self.client_user)
        self.auth(self.consultant)
        self.client.patch(
            f"/api/v1/applications/{app['id']}/tracking",
            {"reference_number": "ABC123456789", "tracking_enabled": True},
            format="json",
        )
        self.auth(self.client_user)
        response = self.client.post(f"/api/v1/applications/{app['id']}/tracking/refresh", {}, format="json")
        self.assertEqual(response.status_code, 503)
        payload = response.json()
        self.assertFalse(payload["success"])
        self.assertEqual(payload["error"]["code"], "integration_unavailable")
        tracking = ApplicationExternalTracking.objects.get(application_id=app["id"])
        self.assertEqual(tracking.current_status_code, "")
        self.assertIsNone(tracking.last_checked_at)
        self.assertFalse(ExternalApplicationStatus.objects.filter(application_id=app["id"]).exists())

    def test_manual_status_does_not_overwrite_internal_status(self):
        app = self._create_application(self.client_user)
        internal = Application.objects.get(pk=app["id"]).status.code
        self.auth(self.consultant)
        response = self.client.post(
            f"/api/v1/applications/{app['id']}/tracking/manual",
            {
                "status_code": "DECISION_RETURNED",
                "note": "Confirmed through official VFS communication.",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = self._unwrap(response)
        self.assertEqual(data["status"], "DECISION_RETURNED")
        self.assertEqual(data["internal_status"]["code"], internal)
        self.assertTrue(data["manually_updated"])
        self.assertEqual(data["source_label"], "Manually updated")
        application = Application.objects.get(pk=app["id"])
        self.assertEqual(application.status.code, internal)
        self.assertTrue(ApplicationTimeline.objects.filter(application=application, title="VFS status updated").exists())
        self.assertTrue(Notification.objects.filter(user=self.client_user, title="VFS Status Updated").exists())
        self.assertTrue(AuditLog.objects.filter(action="application.external_status_manual").exists())
        history = self._unwrap(self.client.get(f"/api/v1/applications/{app['id']}/tracking/history"))
        self.assertEqual(len(history), 1)
        self.assertTrue(history[0]["manually_updated"])

    def test_official_api_refresh_and_rate_limit(self):
        app = self._create_application(self.client_user)
        self.auth(self.consultant)
        self.client.patch(
            f"/api/v1/applications/{app['id']}/tracking",
            {"reference_number": "ABC123456789", "passport_number": "A123456789", "tracking_enabled": True},
            format="json",
        )
        self.auth(self.client_user)
        with patch("apps.applications.tracking.service.get_tracking_provider", return_value=FakeAvailableProvider()):
            first = self.client.post(f"/api/v1/applications/{app['id']}/tracking/refresh", {}, format="json")
            self.assertEqual(first.status_code, 200)
            data = self._unwrap(first)
            self.assertEqual(data["status"], "APPLICATION_UNDER_PROCESS")
            self.assertEqual(data["source"], "API")
            second = self.client.post(f"/api/v1/applications/{app['id']}/tracking/refresh", {}, format="json")
        self.assertEqual(second.status_code, 429)
        self.assertEqual(second.json()["error"]["code"], "rate_limited")
        application = Application.objects.get(pk=app["id"])
        self.assertNotEqual(application.status.code, "APPLICATION_UNDER_PROCESS")

    def test_admin_list_hides_passport_and_supports_search(self):
        app = self._create_application(self.client_user)
        self.auth(self.consultant)
        self.client.patch(
            f"/api/v1/applications/{app['id']}/tracking",
            {"reference_number": "ABC123456789", "passport_number": "SECRET9999", "tracking_enabled": True},
            format="json",
        )
        self.auth(self.admin)
        listed = self.client.get("/api/v1/admin/applications/external-tracking", {"search": "ABC123"})
        self.assertEqual(listed.status_code, 200)
        body = listed.content.decode()
        self.assertNotIn("SECRET9999", body)
        results = self._unwrap(listed)["results"]
        self.assertEqual(results[0]["reference_number"], "ABC123456789")
        self.assertEqual(results[0]["application_reference"], app["reference"])

    def test_audit_metadata_does_not_include_passport(self):
        app = self._create_application(self.client_user)
        self.auth(self.consultant)
        self.client.patch(
            f"/api/v1/applications/{app['id']}/tracking",
            {"reference_number": "ABC123456789", "passport_number": "SECRET9999", "tracking_enabled": True},
            format="json",
        )
        logs = AuditLog.objects.filter(action="application.tracking_details_updated")
        self.assertTrue(logs.exists())
        for log in logs:
            self.assertNotIn("SECRET9999", str(log.metadata))
            self.assertNotIn("passport", str(log.metadata).lower())

    def test_automatic_poll_skips_without_official_api(self):
        from apps.applications.tasks import poll_external_application_tracking

        app = self._create_application(self.client_user)
        ApplicationExternalTracking.objects.create(
            application_id=app["id"],
            reference_number="ABC123456789",
            tracking_enabled=True,
        )
        self.assertEqual(poll_external_application_tracking(), 0)
        self.assertFalse(ExternalApplicationStatus.objects.filter(application_id=app["id"]).exists())
