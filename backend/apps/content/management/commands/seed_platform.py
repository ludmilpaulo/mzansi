from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from apps.accounts.models import User
from apps.applications.models import ApplicationStatus
from apps.applications.services import create_application, transition_application
from apps.clients.models import ClientProfile
from apps.consultations.models import Appointment, ConsultationType
from apps.content.models import Article, Category, FAQ, Page, SiteSetting, Testimonial
from apps.documents.models import DocumentType
from apps.notifications.models import EmailTemplate
from apps.services.models import Service, ServiceFAQ, ServiceRequirement
from apps.staff.models import StaffProfile


STATUSES = [
    ("DRAFT", "Draft", "Application created and not yet submitted.", "pending", 5, False, True),
    ("SUBMITTED", "Submitted", "The client has submitted the application for assessment.", "active", 15, False, False),
    ("INITIAL_REVIEW", "Initial Assessment", "A consultant is reviewing the case.", "active", 25, False, False),
    ("DOCUMENTS_REQUIRED", "Documents Requested", "Additional or outstanding documents are required.", "pending", 35, False, True),
    ("DOCUMENTS_UNDER_REVIEW", "Documents Under Review", "Uploaded documents are being verified.", "active", 50, False, False),
    ("DOCUMENTS_COMPLETE", "Documents Complete", "Required documents have been verified.", "active", 65, False, False),
    ("IN_PREPARATION", "Application Prepared", "The consultant is preparing the submission pack.", "active", 75, False, False),
    ("SUBMITTED_TO_AUTHORITY", "Application Submitted", "The application has been lodged with the relevant authority.", "active", 85, False, False),
    ("AWAITING_DECISION", "Awaiting Decision", "Waiting for an official decision. Mzansi cannot influence government outcomes.", "active", 90, False, False),
    ("APPROVED", "Approved", "A positive decision was recorded. This is not a guarantee of future outcomes.", "completed", 100, True, False),
    ("REJECTED", "Rejected", "A negative decision was recorded. Next steps can be discussed in consultation.", "completed", 100, True, False),
    ("COMPLETED", "Completed", "The matter has been closed.", "completed", 100, True, False),
    ("CANCELLED", "Cancelled", "The application was cancelled.", "cancelled", 0, True, False),
]

DOCUMENT_TYPES = [
    ("passport", "Passport", "Bio page of a valid passport."),
    ("current-permit", "Current Permit", "Current visa or permit, if held."),
    ("proof-of-residence", "Proof of Residence", "Recent utility bill, lease, or bank statement showing address."),
    ("police-clearance", "Police Clearance", "Police clearance certificate from relevant countries."),
    ("employment-letter", "Employment Letter", "Letter confirming employment and remuneration."),
    ("bank-statement", "Bank Statement", "Recent bank statements."),
    ("birth-certificate", "Birth Certificate", "Full birth certificate."),
    ("marriage-certificate", "Marriage Certificate", "Marriage certificate where applicable."),
    ("medical-report", "Medical Report", "Medical examination report where required."),
    ("photos", "Passport Photographs", "Recent passport-sized photographs."),
    ("motivation", "Motivation Letter", "Letter motivating the application."),
    ("waiver-grounds", "Waiver Grounds", "Supporting evidence for a waiver or exemption."),
]

SERVICES = [
    {
        "name": "Permanent Residence Permits",
        "slug": "permanent-residence-permit",
        "short": "Professional assistance with South African permanent residence applications.",
        "desc": "We help clients prepare and lodge permanent residence permit applications under the applicable categories. Requirements and government policy can change; we work from the latest published criteria and keep your checklist current.",
        "who": "Foreign nationals who may qualify for permanent residence through work, business, relatives, retirement, or other prescribed categories.",
        "process": "Consultation and eligibility discussion, document collection, quality review, preparation of the application pack, lodging support, and status tracking until a decision is recorded.",
        "eta": "Government processing times vary and are outside our control.",
        "icon": "home",
        "docs": ["passport", "current-permit", "proof-of-residence", "police-clearance", "employment-letter", "bank-statement", "birth-certificate", "photos"],
        "faqs": [
            ("Can you guarantee approval?", "No. Permanent residence is decided by the Department of Home Affairs. We provide professional preparation and guidance only."),
            ("How long does it take?", "Preparation time depends on document readiness. Official processing times change and are published by the Department."),
        ],
    },
    {
        "name": "Temporary Residence Permits",
        "slug": "temporary-residence-permit",
        "short": "Work, study, visitor, relative and other temporary residence categories.",
        "desc": "Support for temporary residence visa and permit applications, renewals, and changes of status or conditions where permitted.",
        "who": "Applicants who need lawful temporary stay for work, study, family, or other prescribed purposes.",
        "process": "Category assessment, checklist generation, document verification, application preparation, and follow-up.",
        "eta": "Varies by category and visa facilitation centre.",
        "icon": "plane",
        "docs": ["passport", "current-permit", "proof-of-residence", "employment-letter", "bank-statement", "photos"],
        "faqs": [
            ("Do I need to leave South Africa to apply?", "It depends on the category and your current status. We confirm this during assessment."),
        ],
    },
    {
        "name": "Waiver / Exemption Applications",
        "slug": "waiver-exemption-applications",
        "short": "Assistance with waiver and exemption requests where a prescribed requirement cannot be met.",
        "desc": "Some applications require a waiver or exemption. We help assemble a reasoned request with supporting evidence. Outcomes remain at the discretion of the authorities.",
        "who": "Applicants who have been advised that a waiver or exemption may be required.",
        "process": "Review of the refusal ground or missing requirement, evidence plan, drafting support, and lodging guidance.",
        "eta": "Highly case-specific.",
        "icon": "scale",
        "docs": ["passport", "current-permit", "motivation", "waiver-grounds", "police-clearance"],
        "faqs": [
            ("Is a waiver always possible?", "No. We will tell you honestly if a waiver is unlikely based on the available facts."),
        ],
    },
    {
        "name": "Zimbabwean Exemption Permits",
        "slug": "zimbabwean-exemption-permit",
        "short": "Guidance on Zimbabwean Exemption Permit (ZEP) processes as published by the Department.",
        "desc": "Requirements, windows, and conditions for exemption permits change. We maintain up-to-date checklists and help clients prepare complete submissions during open periods.",
        "who": "Zimbabwean nationals who may qualify under a published ZEP dispensation.",
        "process": "Eligibility check against the current published criteria, document collection, and submission support.",
        "eta": "Determined by the applicable directive.",
        "icon": "file-check",
        "docs": ["passport", "current-permit", "proof-of-residence", "employment-letter", "photos"],
        "faqs": [
            ("Are ZEP rules fixed?", "No. Always rely on the latest official directive. We update this service when rules change."),
        ],
    },
    {
        "name": "Lesotho Exemption Permits",
        "slug": "lesotho-exemption-permit",
        "short": "Support for Lesotho Exemption Permit (LEP) applications during published windows.",
        "desc": "Assistance preparing LEP applications in line with the current official criteria. We do not guarantee approval.",
        "who": "Lesotho nationals who may qualify under a published LEP dispensation.",
        "process": "Criteria review, document checklist, verification, and lodging support.",
        "eta": "Determined by the applicable directive.",
        "icon": "file-text",
        "docs": ["passport", "current-permit", "proof-of-residence", "employment-letter", "photos"],
        "faqs": [
            ("Can you apply after a window closes?", "Only if a further official process is published. We will not lodge applications outside an authorised process."),
        ],
    },
    {
        "name": "Angola Special Permits",
        "slug": "angola-special-permit",
        "short": "Assistance with Angola Special Permit (ASP) processes as currently published.",
        "desc": "We help eligible clients assemble ASP submissions according to the latest official requirements.",
        "who": "Angolan nationals who may qualify under a published ASP dispensation.",
        "process": "Assessment against current criteria, document preparation, and submission support.",
        "eta": "Determined by the applicable directive.",
        "icon": "stamp",
        "docs": ["passport", "current-permit", "proof-of-residence", "employment-letter", "photos"],
        "faqs": [
            ("Will this lead to permanent residence?", "Special permits are distinct from permanent residence. Ask us about available pathways during a consultation."),
        ],
    },
]


class Command(BaseCommand):
    help = "Seed configurable platform data and optional demo accounts for local development."

    def add_arguments(self, parser):
        parser.add_argument("--with-demo-users", action="store_true", help="Create documented local demo users and a sample case.")

    def handle(self, *args, **options):
        self._statuses()
        self._document_types()
        self._services()
        self._consultations()
        self._content()
        self._emails()
        if options["with_demo_users"]:
            self._demo_users()
        self.stdout.write(self.style.SUCCESS("Platform seed complete."))

    def _statuses(self):
        for code, label, desc, category, weight, terminal, action in STATUSES:
            ApplicationStatus.objects.update_or_create(
                code=code,
                defaults={
                    "label": label,
                    "description": desc,
                    "category": category,
                    "progress_weight": weight,
                    "is_terminal": terminal,
                    "client_action_required": action,
                    "sort_order": STATUSES.index((code, label, desc, category, weight, terminal, action)),
                    "is_active": True,
                },
            )

    def _document_types(self):
        for code, name, desc in DOCUMENT_TYPES:
            DocumentType.objects.update_or_create(code=code, defaults={"name": name, "description": desc, "is_active": True})

    def _services(self):
        for index, item in enumerate(SERVICES):
            service, _ = Service.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "short_description": item["short"],
                    "description": item["desc"],
                    "who_its_for": item["who"],
                    "process_overview": item["process"],
                    "estimated_processing": item["eta"],
                    "icon": item["icon"],
                    "consultation_available": True,
                    "is_active": True,
                    "sort_order": index,
                    "seo_title": f"{item['name']} | Mzansi Visa Solutions",
                    "seo_description": item["short"],
                },
            )
            service.requirements.all().delete()
            for order, code in enumerate(item["docs"]):
                doc = DocumentType.objects.get(code=code)
                ServiceRequirement.objects.create(service=service, document_type=doc, description=doc.description, is_required=True, sort_order=order)
            service.faqs.all().delete()
            for order, (q, a) in enumerate(item["faqs"]):
                ServiceFAQ.objects.create(service=service, question=q, answer=a, sort_order=order, is_active=True)

    def _consultations(self):
        types = [
            ("Visa Consultation", "visa-consultation", "Discuss visa options and next steps.", 45, 85000),
            ("Immigration Assessment", "immigration-assessment", "Structured assessment of possible pathways.", 60, 120000),
            ("Permanent Residence Consultation", "permanent-residence-consultation", "Focused discussion of PR categories and evidence.", 60, 150000),
            ("Document Review", "document-review", "Review of existing documents before lodging.", 30, 65000),
            ("General Consultation", "general-consultation", "General immigration enquiry.", 30, 55000),
        ]
        for index, (name, slug, desc, duration, price) in enumerate(types):
            ConsultationType.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "description": desc,
                    "duration_minutes": duration,
                    "price_cents": price,
                    "currency": "ZAR",
                    "is_active": True,
                    "sort_order": index,
                },
            )

    def _content(self):
        SiteSetting.objects.update_or_create(
            key="brand",
            defaults={
                "value": {
                    "name": "Mzansi Visa Solutions",
                    "tagline": "Your immigration journey, handled with confidence.",
                    "primary_color": "#FF6B21",
                    "phone": "+27 21 000 0000",
                    "email": "hello@mzansivisa.co.za",
                    "address": "Cape Town, South Africa",
                    "whatsapp": "",
                    "social": {"linkedin": "", "facebook": "", "instagram": ""},
                },
                "description": "Public brand and contact details.",
            },
        )
        SiteSetting.objects.update_or_create(
            key="home_hero",
            defaults={
                "value": {
                    "eyebrow": "South African visa & immigration services",
                    "title": "Your Immigration Journey, Handled With Confidence.",
                    "subtitle": "Professional visa and immigration solutions for your next chapter. We prepare, guide, and track — government decisions remain with the Department of Home Affairs.",
                    "primary_cta_label": "Book a Consultation",
                    "primary_cta_href": "/contact",
                    "secondary_cta_label": "Explore Our Services",
                    "secondary_cta_href": "/services",
                    "image_url": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2000&q=80",
                }
            },
        )
        SiteSetting.objects.update_or_create(
            key="trust_points",
            defaults={
                "value": [
                    {"title": "Professional", "body": "Consultant-led case management with clear next actions."},
                    {"title": "Secure", "body": "Private document storage and role-based access."},
                    {"title": "Client-focused", "body": "A portal that shows exactly what you need to do next."},
                ]
            },
        )
        SiteSetting.objects.update_or_create(
            key="why_choose",
            defaults={
                "value": [
                    {"title": "Clear next actions", "body": "Clients always see what to upload or wait for — not a pile of emails."},
                    {"title": "Secure document handling", "body": "Immigration documents stay private, with staff access limited by role."},
                    {"title": "Honest guidance", "body": "We explain options and limits. Government decisions remain with Home Affairs."},
                ]
            },
        )
        SiteSetting.objects.update_or_create(
            key="how_it_works",
            defaults={
                "value": [
                    {"step": 1, "title": "Consultation", "body": "We listen to your circumstances and explain realistic options."},
                    {"step": 2, "title": "Assessment", "body": "A consultant maps the pathway and required evidence."},
                    {"step": 3, "title": "Documents", "body": "You upload through a secure checklist. We verify each item."},
                    {"step": 4, "title": "Application", "body": "We prepare a complete pack for lodging."},
                    {"step": 5, "title": "Follow-up", "body": "Status updates and messages stay in one place."},
                    {"step": 6, "title": "Outcome", "body": "We record the official decision and discuss next steps."},
                ]
            },
        )
        SiteSetting.objects.update_or_create(
            key="disclaimer",
            defaults={
                "value": {
                    "text": "Mzansi Visa Solutions provides professional immigration assistance. We do not guarantee visa, permit, or permanent residence approval. Decisions are made by the relevant government authorities and requirements can change."
                }
            },
        )
        SiteSetting.objects.update_or_create(
            key="progress_weights",
            defaults={"value": {"profile": 10, "documents": 30, "verification": 20, "status": 40}},
        )
        pages = [
            ("about", "About Us", "Mzansi Visa Solutions is a South African immigration services practice helping clients navigate visas, permits, and related applications with clarity and care."),
            ("privacy", "Privacy Policy", "We process personal information and immigration documents only to deliver the services you request, to meet legal obligations, and to keep your account secure. Documents are stored privately and access is role-restricted."),
            ("terms", "Terms of Service", "By using this platform you agree that Mzansi Visa Solutions provides professional assistance only. Government fees, biometrics, and official decisions sit outside our control. Service descriptions on this site are informational and may be updated."),
            ("contact", "Contact", "Book a consultation or send a message. We respond during business hours, Africa/Johannesburg."),
        ]
        for slug, title, body in pages:
            Page.objects.update_or_create(
                slug=slug,
                defaults={"title": title, "body": body, "excerpt": body[:200], "is_published": True, "seo_title": f"{title} | Mzansi Visa Solutions", "seo_description": body[:155]},
            )
        faqs = [
            ("Do you guarantee visa approval?", "No. We never promise approval. We prepare complete, professional applications and keep you informed."),
            ("How do I track my application?", "Register for the client portal or mobile app. You will see status, documents, and next actions in one place."),
            ("Is my passport copy safe?", "Documents are stored in private storage and are only accessible to authorised staff assigned to your matter."),
            ("Can I book a consultation online?", "Yes. Choose a consultation type, date, and available consultant from the booking page."),
            ("What if a document is rejected?", "You will see the reason and can upload a replacement immediately from the portal or app."),
            ("Do requirements change?", "Yes. Home Affairs rules change. Our consultants keep service checklists current in this system."),
        ]
        for index, (q, a) in enumerate(faqs):
            FAQ.objects.update_or_create(question=q, defaults={"answer": a, "category": "general", "sort_order": index, "is_active": True})
        testimonials = [
            ("Thandi M.", "Permanent residence client", "Clear communication and a checklist I could actually follow. I always knew the next step."),
            ("Carlos R.", "Temporary residence", "Uploading documents from my phone saved weeks of back-and-forth email."),
            ("Amina K.", "Consultation", "Honest advice. They told me what was realistic before I spent money on the wrong pathway."),
        ]
        for index, (name, role, quote) in enumerate(testimonials):
            Testimonial.objects.update_or_create(name=name, defaults={"role": role, "quote": quote, "rating": 5, "is_featured": True, "is_active": True, "sort_order": index})
        cat, _ = Category.objects.update_or_create(slug="visa-guides", defaults={"name": "Visa Guides", "description": "Practical guides. Not legal advice and not a government publication."})
        Article.objects.update_or_create(
            slug="how-to-prepare-for-a-visa-consultation",
            defaults={
                "title": "How to prepare for a visa consultation",
                "excerpt": "Bring the facts of your stay, travel history, and current permit so we can give useful guidance.",
                "body": "A useful consultation starts with accurate facts: your nationality, current status, family situation, and what you hope to achieve. Bring copies of your passport and current permit if you have them. We will explain options and limitations without promising outcomes.",
                "category": cat,
                "is_published": True,
                "is_featured": True,
                "published_at": timezone.now(),
                "seo_title": "How to prepare for a visa consultation | Mzansi Visa Solutions",
                "seo_description": "What to bring to an immigration consultation in South Africa.",
            },
        )

    def _emails(self):
        templates = [
            ("welcome", "Welcome", "Welcome to Mzansi Visa Solutions", "Hello {{ first_name }},\n\nYour client portal is ready. You can book a consultation and, when an application is opened, upload documents securely.\n\nMzansi Visa Solutions"),
            ("password_reset", "Password reset", "Reset your password", "Use this reset token with the app or website.\nuid={{ uid }}\ntoken={{ token }}"),
            ("application_created", "Application created", "Your application has been created", "{{ title }}\n\n{{ body }}"),
            ("application_status_changed", "Status changed", "Application status update", "{{ title }}\n\n{{ body }}"),
            ("document_requested", "Document requested", "A document has been requested", "{{ title }}\n\n{{ body }}"),
            ("document_reviewed", "Document reviewed", "A document was reviewed", "{{ title }}\n\n{{ body }}"),
            ("consultation_booked", "Consultation booked", "Consultation booking received", "{{ title }}\n\n{{ body }}"),
            ("consultation_confirmed", "Consultation confirmed", "Your consultation is confirmed", "{{ title }}\n\n{{ body }}"),
            ("consultation_reminder", "Consultation reminder", "Consultation reminder", "{{ title }}\n\n{{ body }}"),
            ("new_message", "New message", "You have a new message", "{{ title }}\n\n{{ body }}"),
        ]
        for code, name, subject, body in templates:
            EmailTemplate.objects.update_or_create(code=code, defaults={"name": name, "subject": subject, "body": body, "is_active": True})

    def _demo_users(self):
        admin, _ = User.objects.get_or_create(
            email="admin@mzansivisa.co.za",
            defaults={"first_name": "Nomsa", "last_name": "Dlamini", "role": User.Role.ADMIN, "is_staff": True, "is_email_verified": True},
        )
        admin.set_password("MzansiAdmin!234")
        admin.role = User.Role.ADMIN
        admin.is_staff = True
        admin.save()
        StaffProfile.objects.get_or_create(user=admin, defaults={"job_title": "Operations Manager", "accepts_consultations": False})

        consultant, _ = User.objects.get_or_create(
            email="consultant@mzansivisa.co.za",
            defaults={"first_name": "Sarah", "last_name": "Smith", "role": User.Role.CONSULTANT, "is_staff": True, "is_email_verified": True, "phone": "+27 21 000 0001"},
        )
        consultant.set_password("MzansiConsult!234")
        consultant.role = User.Role.CONSULTANT
        consultant.is_staff = True
        consultant.save()
        StaffProfile.objects.update_or_create(
            user=consultant,
            defaults={
                "job_title": "Immigration Consultant",
                "bio": "Assists clients with temporary and permanent residence matters.",
                "accepts_consultations": True,
                "working_hours": {day: [["09:00", "16:00"]] for day in ["monday", "tuesday", "wednesday", "thursday", "friday"]},
            },
        )

        reviewer, _ = User.objects.get_or_create(
            email="reviewer@mzansivisa.co.za",
            defaults={"first_name": "Michael", "last_name": "Jones", "role": User.Role.DOCUMENT_REVIEWER, "is_staff": True, "is_email_verified": True},
        )
        reviewer.set_password("MzansiReview!234")
        reviewer.role = User.Role.DOCUMENT_REVIEWER
        reviewer.is_staff = True
        reviewer.save()
        StaffProfile.objects.get_or_create(user=reviewer, defaults={"job_title": "Document Reviewer"})

        finance, _ = User.objects.get_or_create(
            email="finance@mzansivisa.co.za",
            defaults={"first_name": "Lerato", "last_name": "Mokoena", "role": User.Role.FINANCE, "is_staff": True, "is_email_verified": True},
        )
        finance.set_password("MzansiFinance!234")
        finance.role = User.Role.FINANCE
        finance.is_staff = True
        finance.save()

        client, _ = User.objects.get_or_create(
            email="client@mzansivisa.co.za",
            defaults={"first_name": "John", "last_name": "Doe", "role": User.Role.CLIENT, "phone": "+27 82 000 0000", "is_email_verified": True},
        )
        client.set_password("MzansiClient!234")
        client.role = User.Role.CLIENT
        client.save()
        ClientProfile.objects.update_or_create(
            user=client,
            defaults={
                "nationality": "Zimbabwe",
                "current_country": "South Africa",
                "date_of_birth": date(1992, 4, 12),
                "passport_number": "ZN123456",
                "residential_address": "12 Long Street, Cape Town",
                "city": "Cape Town",
            },
        )
        if not client.applications.exists():
            service = Service.objects.get(slug="permanent-residence-permit")
            application = create_application(client=client, service=service, actor=consultant)
            application.assigned_consultant = consultant
            application.assigned_reviewer = reviewer
            application.save()
            transition_application(
                application=application,
                status=ApplicationStatus.objects.get(code="DOCUMENTS_UNDER_REVIEW"),
                actor=consultant,
                note="Initial documents requested. Proof of residence is still outstanding.",
            )
            Appointment.objects.create(
                client=client,
                consultant=consultant,
                consultation_type=ConsultationType.objects.get(slug="immigration-assessment"),
                application=application,
                starts_at=timezone.now() + timedelta(days=7),
                ends_at=timezone.now() + timedelta(days=7, minutes=60),
                status=Appointment.Status.CONFIRMED,
            )
        self.stdout.write("Demo users: admin / consultant / reviewer / finance / client @mzansivisa.co.za (see docs/seed-accounts.md)")
