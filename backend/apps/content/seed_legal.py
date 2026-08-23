"""Seed FAQ catalogue and Terms document for public booking / legal flows."""

from __future__ import annotations

from datetime import date, timedelta

from django.utils import timezone

from apps.content.models import FAQ, Page, TermsDocument
from apps.notifications.models import EmailTemplate

from apps.content.legal_terms_text import TERMS_BODY
from apps.content.faq_items import FAQ_ITEMS


def seed_legal_and_faqs() -> None:
    now = timezone.now()
    reviewed = now
    next_review = now + timedelta(days=90)

    Page.objects.update_or_create(
        slug="terms",
        defaults={
            "title": "Terms & Conditions",
            "excerpt": "Terms for Mzansi Visa Solutions immigration services. Subject to legal review before production reliance.",
            "body": TERMS_BODY,
            "is_published": True,
            "seo_title": "Terms & Conditions | Mzansi Visa Solutions",
            "seo_description": "Terms for consultations, applications, documents and the client portal. We do not guarantee government outcomes.",
            "canonical_path": "/terms",
            "focus_keyword": "Mzansi Visa Solutions terms",
        },
    )

    TermsDocument.objects.update_or_create(
        version="1.0",
        defaults={
            "title": "Terms & Conditions for Immigration Services",
            "body": TERMS_BODY,
            "effective_date": date(2026, 8, 23),
            "is_published": True,
            "summary": "Professional draft covering consultations, applications, documents, fees and no-guarantee of approval. Legal review required before production reliance.",
        },
    )

    EmailTemplate.objects.update_or_create(
        code="account_activation",
        defaults={
            "name": "Account activation",
            "subject": "Activate your Mzansi Visa Solutions client account",
            "body": (
                "Hi {{ first_name }},\n\n"
                "Your consultation has been booked{% if consultation_reference %} ({{ consultation_reference }}){% endif %} "
                "and a client account has been created for you.\n\n"
                "Activate your account and create your password:\n{{ activation_url }}\n\n"
                "This link expires in {{ expires_hours }} hours.\n\n"
                "Mzansi Visa Solutions"
            ),
            "is_active": True,
        },
    )

    FAQ.objects.all().delete()
    for index, (category, question, answer) in enumerate(FAQ_ITEMS):
        FAQ.objects.create(
            question=question,
            answer=answer,
            category=category,
            sort_order=index,
            is_active=True,
            last_reviewed_at=reviewed,
            next_review_at=next_review,
            reviewed_by="Practice editorial",
        )
