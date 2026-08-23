from django.core.exceptions import ValidationError
from django.core.management import call_command
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.common.seo import MIN_LANDING_BODY_CHARS
from apps.content.models import SeoLanding


class SeoApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_platform", verbosity=0)
        cls.admin = User.objects.create_user(
            email="seo.admin@example.com",
            password="StrongPass!234",
            first_name="Seo",
            last_name="Admin",
            role=User.Role.ADMIN,
            is_staff=True,
        )
        cls.client_user = User.objects.create_user(
            email="seo.client@example.com",
            password="StrongPass!234",
            first_name="Seo",
            last_name="Client",
            role=User.Role.CLIENT,
        )

    def test_public_seo_index_includes_routes_and_landings(self):
        response = self.client.get("/api/v1/content/settings/public-seo")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertIn("seo", data["settings"])
        self.assertGreaterEqual(len(data["landings"]), 4)
        self.assertTrue(any(item["slug"] == "angola-to-south-africa" for item in data["landings"]))
        titles = [item["seo_title"] for item in data["services"]]
        self.assertEqual(len(titles), len(set(titles)))

    def test_home_includes_country_and_location_landings(self):
        response = self.client.get("/api/v1/content/settings/home")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertGreaterEqual(len(data["country_landings"]), 3)
        self.assertGreaterEqual(len(data["location_landings"]), 1)

    def test_unpublished_landing_is_hidden(self):
        landing = SeoLanding.objects.get(slug="cape-town")
        landing.is_published = False
        landing.save()
        response = self.client.get("/api/v1/content/landings/cape-town")
        self.assertEqual(response.status_code, 404)

    def test_thin_landing_cannot_be_published(self):
        landing = SeoLanding(
            kind=SeoLanding.KIND_COUNTRY,
            slug="thin-doorway",
            title="Thin",
            excerpt="Too short",
            body="short",
            is_published=True,
        )
        with self.assertRaises(ValidationError):
            landing.save()

    def test_country_pages_are_not_near_duplicates(self):
        bodies = list(
            SeoLanding.objects.filter(kind=SeoLanding.KIND_COUNTRY, is_published=True).values_list("body", flat=True)
        )
        self.assertGreaterEqual(len(bodies), 3)
        for body in bodies:
            self.assertGreaterEqual(len(body), MIN_LANDING_BODY_CHARS)
        self.assertEqual(len(bodies), len(set(bodies)))

    def test_admin_can_update_landing_seo(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            "/api/v1/content/landings/cape-town",
            {"seo_title": "Immigration Consultant Cape Town"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["seo_title"], "Immigration Consultant Cape Town")

    def test_client_cannot_update_landing_seo(self):
        self.client.force_authenticate(self.client_user)
        response = self.client.patch(
            "/api/v1/content/landings/cape-town",
            {"seo_title": "hack"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)
