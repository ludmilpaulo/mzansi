from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import AccountActivationToken, User
from apps.consultations.models import Appointment, ConsultationType
from apps.content.models import FAQ, TermsDocument
from apps.staff.models import StaffProfile


class PublicConsultationBookingTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_platform", verbosity=0)
        cls.consultant = User.objects.filter(role=User.Role.CONSULTANT, staff_profile__accepts_consultations=True).first()
        if not cls.consultant:
            cls.consultant = User.objects.create_user(
                email="booking.consultant@example.com",
                password="StrongPass!234",
                first_name="Sarah",
                last_name="Smith",
                role=User.Role.CONSULTANT,
                is_staff=True,
            )
            StaffProfile.objects.create(
                user=cls.consultant,
                job_title="Consultant",
                accepts_consultations=True,
                working_hours={
                    "monday": [["09:00", "17:00"]],
                    "tuesday": [["09:00", "17:00"]],
                    "wednesday": [["09:00", "17:00"]],
                    "thursday": [["09:00", "17:00"]],
                    "friday": [["09:00", "17:00"]],
                },
            )
        else:
            profile, _ = StaffProfile.objects.get_or_create(user=cls.consultant)
            profile.accepts_consultations = True
            profile.working_hours = {
                "monday": [["09:00", "17:00"]],
                "tuesday": [["09:00", "17:00"]],
                "wednesday": [["09:00", "17:00"]],
                "thursday": [["09:00", "17:00"]],
                "friday": [["09:00", "17:00"]],
            }
            profile.save()
        cls.consultation_type = ConsultationType.objects.filter(is_active=True).first()
        cls.terms = TermsDocument.objects.filter(is_published=True).first()

    def _next_slot(self):
        tz = ZoneInfo("Africa/Johannesburg")
        day = timezone.now().astimezone(tz).date() + timedelta(days=1)
        while day.weekday() > 4:
            day += timedelta(days=1)
        starts = datetime(day.year, day.month, day.day, 10, 0, tzinfo=tz).astimezone(ZoneInfo("UTC"))
        return starts

    def _book_payload(self, email: str, starts_at):
        return {
            "consultation_type_id": self.consultation_type.pk,
            "consultant_id": self.consultant.pk,
            "starts_at": starts_at.isoformat().replace("+00:00", "Z"),
            "first_name": "Ada",
            "last_name": "Client",
            "email": email,
            "phone": "+27821234567",
            "nationality": "Zimbabwe",
            "current_country": "South Africa",
            "matter_summary": "I need guidance on permanent residence options for my family.",
            "terms_version": self.terms.version,
            "accept_terms": True,
            "timezone_name": "Africa/Johannesburg",
        }

    def test_guest_booking_creates_activation_token(self):
        starts = self._next_slot()
        response = self.client.post(
            "/api/v1/public/consultations/book",
            self._book_payload("guest.book@example.com", starts),
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.content)
        payload = response.json()["data"]
        self.assertTrue(payload["account_created"])
        self.assertTrue(payload["activation_required"])
        user = User.objects.get(email="guest.book@example.com")
        self.assertFalse(user.has_usable_password())
        self.assertTrue(AccountActivationToken.objects.filter(user=user, used_at__isnull=True).exists())
        self.assertEqual(Appointment.objects.filter(client=user).count(), 1)

    def test_existing_email_does_not_duplicate_account(self):
        starts = self._next_slot()
        first = self.client.post(
            "/api/v1/public/consultations/book",
            self._book_payload("repeat.client@example.com", starts),
            format="json",
        )
        self.assertEqual(first.status_code, 201, first.content)
        second_start = starts + timedelta(hours=2)
        second = self.client.post(
            "/api/v1/public/consultations/book",
            self._book_payload("repeat.client@example.com", second_start),
            format="json",
        )
        self.assertEqual(second.status_code, 201, second.content)
        self.assertEqual(User.objects.filter(email__iexact="repeat.client@example.com").count(), 1)
        self.assertFalse(second.json()["data"]["account_created"])

    def test_double_booking_rejected_with_alternatives(self):
        starts = self._next_slot() + timedelta(hours=1)
        first = self.client.post(
            "/api/v1/public/consultations/book",
            self._book_payload("first.wins@example.com", starts),
            format="json",
        )
        self.assertEqual(first.status_code, 201, first.content)
        second = self.client.post(
            "/api/v1/public/consultations/book",
            self._book_payload("second.loses@example.com", starts),
            format="json",
        )
        self.assertEqual(second.status_code, 409, second.content)
        body = second.json()
        self.assertEqual(body["error"]["code"], "SLOT_UNAVAILABLE")
        self.assertIn("alternatives", body["error"])
        self.assertEqual(
            Appointment.objects.filter(consultant=self.consultant, starts_at=starts)
            .exclude(status=Appointment.Status.CANCELLED)
            .count(),
            1,
        )

    def test_faq_seed_volume(self):
        self.assertGreaterEqual(FAQ.objects.filter(is_active=True).count(), 55)
        self.assertTrue(TermsDocument.objects.filter(is_published=True).exists())
