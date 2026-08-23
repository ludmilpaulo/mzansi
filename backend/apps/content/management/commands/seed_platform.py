from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from apps.accounts.models import User
from apps.applications.models import ApplicationStatus
from apps.applications.services import create_application, transition_application
from apps.clients.models import ClientProfile
from apps.consultations.models import Appointment, ConsultationType
from apps.content.models import Article, Category, FAQ, Page, SeoLanding, SiteSetting, Testimonial

OFFICIAL_SOURCES = [
    {"label": "Department of Home Affairs", "url": "https://www.dha.gov.za/"},
    {"label": "VFS Global — South Africa (DHA)", "url": "https://visa.vfsglobal.com/zaf/en/dha/"},
]

SERVICE_SEO = {
    "permanent-residence-permit": {
        "seo_title": "Permanent Residence South Africa",
        "seo_description": "Professional assistance preparing South African permanent residence applications. Requirements change; government decisions remain with Home Affairs.",
        "focus_keyword": "permanent residence South Africa",
        "related_keywords": ["permanent residence permit South Africa", "South Africa permanent residence application"],
        "related": ["temporary-residence-permit", "waiver-exemption-applications"],
        "how": "We map the published category, keep your evidence checklist current, review documents, and prepare a complete pack. We do not decide applications and do not promise approval.",
    },
    "temporary-residence-permit": {
        "seo_title": "Temporary Residence Permits South Africa",
        "seo_description": "Support for South African temporary residence visas and permits, including work, study, visitor and family categories.",
        "focus_keyword": "temporary residence South Africa",
        "related_keywords": ["temporary residence permit South Africa", "South Africa temporary permit"],
        "related": ["permanent-residence-permit", "waiver-exemption-applications"],
        "how": "We identify the category that matches your purpose of stay, confirm what evidence is typically requested, and prepare the file you will lodge. Outcomes remain with the authorities.",
    },
    "waiver-exemption-applications": {
        "seo_title": "South Africa Waiver Application",
        "seo_description": "Assistance assembling reasoned South African immigration waiver or exemption requests with supporting evidence. Outcomes are discretionary.",
        "focus_keyword": "South Africa waiver application",
        "related_keywords": ["DHA waiver South Africa", "immigration waiver South Africa"],
        "related": ["permanent-residence-permit", "temporary-residence-permit"],
        "how": "We review the missing requirement or refusal ground, plan evidence, and help draft a reasoned request. A waiver is not always available.",
    },
    "zimbabwean-exemption-permit": {
        "seo_title": "Zimbabwean Exemption Permit South Africa",
        "seo_description": "Guidance on Zimbabwean Exemption Permit processes as published by the Department of Home Affairs. Windows and criteria change.",
        "focus_keyword": "Zimbabwean Exemption Permit",
        "related_keywords": ["ZEP South Africa", "South Africa immigration for Zimbabwean citizens"],
        "related": ["temporary-residence-permit", "waiver-exemption-applications"],
        "how": "We check your facts against the current published ZEP criteria and help you prepare a complete file only when an authorised process is open.",
    },
    "lesotho-exemption-permit": {
        "seo_title": "Lesotho Exemption Permit South Africa",
        "seo_description": "Support preparing Lesotho Exemption Permit applications during published windows. We do not lodge outside an authorised process.",
        "focus_keyword": "Lesotho Exemption Permit",
        "related_keywords": ["LEP South Africa", "South Africa immigration for Basotho applicants"],
        "related": ["temporary-residence-permit", "waiver-exemption-applications"],
        "how": "We confirm whether a published LEP window applies, then help assemble the documents listed in the current directive.",
    },
    "angola-special-permit": {
        "seo_title": "Angola Special Permit South Africa",
        "seo_description": "Assistance with Angola Special Permit processes as currently published. Special permits are distinct from permanent residence.",
        "focus_keyword": "Angola Special Permit",
        "related_keywords": ["ASP South Africa", "South Africa immigration for Angolan applicants"],
        "related": ["temporary-residence-permit", "permanent-residence-permit"],
        "how": "We assess eligibility against the latest published ASP criteria and help you prepare a complete submission. This is not a path we can guarantee.",
    },
}
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
    ("READY_FOR_SUBMISSION", "Ready for Submission", "The application pack is complete and ready to lodge.", "active", 80, False, False),
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
                    "seo_title": SERVICE_SEO[item["slug"]]["seo_title"],
                    "seo_description": SERVICE_SEO[item["slug"]]["seo_description"],
                    "focus_keyword": SERVICE_SEO[item["slug"]]["focus_keyword"],
                    "related_keywords": SERVICE_SEO[item["slug"]]["related_keywords"],
                    "canonical_path": f"/services/{item['slug']}",
                    "how_we_help": SERVICE_SEO[item["slug"]]["how"],
                    "official_sources": OFFICIAL_SOURCES,
                    "related_service_slugs": SERVICE_SEO[item["slug"]]["related"],
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
        SiteSetting.objects.update_or_create(
            key="seo",
            defaults={
                "description": "Public SEO defaults, route metadata, and locale policy. Translations must be human-reviewed.",
                "value": {
                    "default_title": "Mzansi Visa Solutions | South Africa Visa & Immigration Services",
                    "default_description": "Professional South Africa visa and immigration assistance for temporary residence, permanent residence, waivers, permits and consultations. We prepare complete files — government decisions remain with the authorities.",
                    "default_og_image": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2000&q=80",
                    "title_suffix": "Mzansi Visa Solutions",
                    "supported_locales": ["en"],
                    "locale_default": "en",
                    "translation_policy": "Human-reviewed translations only. Do not publish machine translation.",
                    "routes": {
                        "home": {
                            "title": "Mzansi Visa Solutions | South Africa Visa & Immigration Services",
                            "description": "Professional South Africa visa and immigration assistance for temporary residence, permanent residence, waivers, permits and consultations. Start with a consultation.",
                        },
                        "services": {
                            "title": "South Africa Visa & Immigration Services",
                            "description": "Immigration pathways we prepare with you: permanent residence, temporary residence, waivers and special permits. Requirements change and outcomes are not guaranteed.",
                        },
                        "resources": {
                            "title": "South Africa Immigration Guides",
                            "description": "Practical guides on South African visas, permits and consultations. Informational only — not government publications.",
                        },
                        "immigration-guides": {
                            "title": "South Africa Immigration Knowledge Hub",
                            "description": "Guides, FAQs and country notes on South African immigration. We explain processes and link to official sources. We do not promise approval.",
                        },
                        "faq": {
                            "title": "South Africa Visa FAQ",
                            "description": "Honest answers about consultations, documents, tracking and whether Mzansi Visa Solutions can guarantee approval — we cannot.",
                        },
                        "countries": {
                            "title": "South Africa Immigration by Nationality",
                            "description": "Country-specific notes for applicants considering South African visas and permits. Each page is unique and maintained when official rules change.",
                        },
                        "locations": {
                            "title": "South Africa Immigration Consultations by City",
                            "description": "Where Mzansi Visa Solutions offers consultations and how we work with clients in South Africa.",
                        },
                        "contact": {
                            "title": "South Africa Visa Consultation",
                            "description": "Book a South Africa visa or immigration consultation with Mzansi Visa Solutions. We explain realistic options and do not guarantee government outcomes.",
                        },
                    },
                },
            },
        )
        SiteSetting.objects.update_or_create(
            key="external_tracking",
            defaults={
                "value": {
                    "provider": "VFS",
                    "automatic_tracking": False,
                    "automatic_check_interval_hours": 6,
                    "manual_refresh_cooldown_minutes": 30,
                    "fallback_url": "https://visa.vfsglobal.com/zaf/en/dha/track-application",
                    "store_raw_status": False,
                    "status_mapping": {
                        "application received": "APPLICATION_RECEIVED",
                        "application under process": "APPLICATION_UNDER_PROCESS",
                        "decision returned": "DECISION_RETURNED",
                        "ready for collection": "READY_FOR_COLLECTION",
                    },
                },
                "description": "VFS / DHA external tracking. Automatic polling runs only when an official API is configured.",
            },
        )
        pages = [
            ("about", "About Us", "Mzansi Visa Solutions is a South African immigration services practice helping clients navigate visas, permits, and related applications with clarity and care."),
            ("privacy", "Privacy Policy", "We process personal information and immigration documents only to deliver the services you request, to meet legal obligations, and to keep your account secure. Documents are stored privately and access is role-restricted."),
            ("terms", "Terms of Service", "By using this platform you agree that Mzansi Visa Solutions provides professional assistance only. Government fees, biometrics, and official decisions sit outside our control. Service descriptions on this site are informational and may be updated."),
            ("contact", "Contact", "Book a consultation or send a message. We respond during business hours, Africa/Johannesburg."),
        ]
        page_seo = {
            "about": ("About Mzansi Visa Solutions", "Who we are, how we work, and why we never promise visa or permanent residence approval."),
            "privacy": ("Privacy Policy", "How Mzansi Visa Solutions handles personal information and private immigration documents."),
            "terms": ("Terms of Service", "Terms for using the Mzansi Visa Solutions website, portal, and professional assistance."),
            "contact": ("South Africa Visa Consultation", "Book a South Africa visa or immigration consultation. We explain options; government decisions remain with the authorities."),
        }
        for slug, title, body in pages:
            seo_title, seo_description = page_seo[slug]
            Page.objects.update_or_create(
                slug=slug,
                defaults={
                    "title": title,
                    "body": body,
                    "excerpt": body[:200],
                    "is_published": True,
                    "seo_title": seo_title,
                    "seo_description": seo_description,
                    "canonical_path": f"/{slug}",
                    "focus_keyword": title,
                },
            )
        faqs = [
            ("Do you guarantee visa approval?", "No. We never promise approval. We prepare complete, professional applications and keep you informed."),
            ("How do I track my application?", "The client portal shows your Mzansi case status. When a VFS reference is linked, you can also open the official VFS Global tracking page from your application. Mzansi case status and VFS status are shown separately."),
            ("Is my passport copy safe?", "Documents are stored in private storage and are only accessible to authorised staff assigned to your matter."),
            ("Can I book a consultation online?", "Yes. Choose a consultation type, date, and available consultant from the booking page."),
            ("What if a document is rejected?", "You will see the reason and can upload a replacement immediately from the portal or app."),
            ("Do requirements change?", "Yes. Home Affairs rules change. Our consultants keep service checklists current in this system."),
            ("How long does South African permanent residence take?", "Preparation time depends on your documents. Official processing times are set by the Department of Home Affairs and change. We will not quote a guaranteed timeline."),
            ("Can I apply for a South African visa from another country?", "Often yes, through a visa facilitation centre or mission. The correct channel depends on your nationality, location, and category. Confirm this in consultation against current official instructions."),
            ("What documents do I need for a South African visa?", "Typical files include a valid passport, photographs, proof of purpose, and category-specific evidence. The exact list is published by the Department and can change. We maintain a live checklist on your application."),
            ("What is a South African waiver?", "A waiver or exemption is a request that a prescribed requirement be set aside. It is discretionary. We help assemble evidence only where a request is realistically available."),
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
        guides, _ = Category.objects.update_or_create(slug="visa-guides", defaults={"name": "Visa Guides", "description": "Practical guides. Not legal advice and not a government publication."})
        documents_cat, _ = Category.objects.update_or_create(slug="document-guides", defaults={"name": "Document Guides", "description": "What evidence is typically requested, and why lists change."})
        application_cat, _ = Category.objects.update_or_create(slug="application-guides", defaults={"name": "Application Guides", "description": "How South African visa and permit processes usually unfold."})
        now = timezone.now()
        articles = [
            {
                "slug": "how-to-prepare-for-a-visa-consultation",
                "title": "How to prepare for a visa consultation",
                "excerpt": "Bring the facts of your stay, travel history, and current permit so we can give useful guidance.",
                "body": "A useful consultation starts with accurate facts: your nationality, current status, family situation, and what you hope to achieve. Bring copies of your passport and current permit if you have them. Write down questions about work, study, family, or long-term stay. We will explain options and limitations without promising outcomes. Official criteria sit with the Department of Home Affairs; we help you understand how those criteria apply to your circumstances.",
                "category": guides,
                "featured": True,
                "seo_title": "How to Prepare for a South Africa Visa Consultation",
                "seo_description": "What to bring to an immigration consultation in South Africa so the discussion is specific and honest.",
                "focus": "South Africa visa consultation",
            },
            {
                "slug": "what-documents-are-required-for-a-south-african-visa",
                "title": "What documents are required for a South African visa?",
                "excerpt": "Most categories need a passport, photographs and proof of purpose. The rest is category-specific and can change.",
                "body": "There is no single document list for every South African visa. Most applicants need a valid passport, recent photographs, and evidence of why they are applying — work, study, family, visit, or another published category. Additional items such as police clearances, medical reports, bank statements, or employment letters appear only for some pathways. The Department of Home Affairs and, where used, VFS Global publish the list that applies on the day you lodge. We keep a live checklist on your Mzansi application and update it when official requirements change. Treat any article, including this one, as orientation rather than a substitute for the current official list.",
                "category": documents_cat,
                "featured": True,
                "seo_title": "What Documents Are Required for a South African Visa?",
                "seo_description": "Typical South African visa documents, why lists differ by category, and how we keep your checklist current.",
                "focus": "South African visa documents",
            },
            {
                "slug": "how-long-does-a-south-african-visa-application-take",
                "title": "How long does a South African visa application take?",
                "excerpt": "Preparation time depends on your documents. Official processing times are set by government and can change.",
                "body": "Two clocks matter. The first is preparation: gathering evidence, correcting rejected uploads, and completing the pack. That clock is partly in your control. The second is official processing after lodging. The Department of Home Affairs and visa facilitation centres publish or revise those times; they are outside Mzansi’s control. We will not quote a guaranteed decision date. What we can do is keep your file complete so it is not delayed by avoidable omissions, and record the official status when it is available. If you need to travel or start work on a specific date, raise that in consultation so we can discuss realistic sequencing — not promises.",
                "category": application_cat,
                "featured": False,
                "seo_title": "How Long Does a South African Visa Application Take?",
                "seo_description": "Why South African visa timelines split into preparation and official processing, and why we do not guarantee dates.",
                "focus": "South African visa processing time",
            },
        ]
        for item in articles:
            Article.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "title": item["title"],
                    "excerpt": item["excerpt"],
                    "body": item["body"],
                    "category": item["category"],
                    "is_published": True,
                    "is_featured": item["featured"],
                    "published_at": now,
                    "last_reviewed_at": now,
                    "author_name": "Mzansi Visa Solutions editorial",
                    "reviewer_name": "Practice review",
                    "seo_title": item["seo_title"],
                    "seo_description": item["seo_description"],
                    "canonical_path": f"/resources/{item['slug']}",
                    "focus_keyword": item["focus"],
                },
            )
        self._landings()

    def _landings(self):
        landings = [
            {
                "kind": SeoLanding.KIND_COUNTRY,
                "slug": "angola-to-south-africa",
                "title": "Moving from Angola to South Africa",
                "excerpt": "Immigration options Angolan applicants commonly discuss, including the Angola Special Permit when a published process exists.",
                "seo_title": "South Africa Visa & Immigration Services for Angolan Applicants",
                "seo_description": "How Angolan applicants typically approach South African visas, the Angola Special Permit when published, and what to confirm with official sources.",
                "focus_keyword": "South Africa immigration for Angolan citizens",
                "related_keywords": ["Angola Special Permit", "Angola to South Africa visa"],
                "audience": "Angolan nationals in Angola, South Africa, or another country who are considering lawful stay, work, study, family reunion, or a published special-permit process.",
                "pathways": "When a current Angola Special Permit (ASP) directive is published, that process is specific to eligible Angolan nationals and is distinct from permanent residence. Outside those windows, applicants usually look at the ordinary temporary residence categories — work, study, visitor, relative — or, where facts support it, a permanent residence category. Portuguese-language civil documents often need sworn translation into English before they can be used. Confirm the open process on the Department of Home Affairs site before you spend money on a pathway that is closed.",
                "documents": "Expect a valid Angolan passport, photographs, and proof of the purpose of stay. ASP files, when that process is open, follow the directive in force — not a generic visa list. Birth, marriage, and police documents issued in Portuguese typically require certified translation. We will not invent a checklist that the Department has not published.",
                "related_service_slugs": ["angola-special-permit", "temporary-residence-permit", "permanent-residence-permit"],
                "related_article_slugs": ["what-documents-are-required-for-a-south-african-visa", "how-to-prepare-for-a-visa-consultation"],
                "faqs": [
                    {"question": "Is the Angola Special Permit the same as permanent residence?", "answer": "No. A special permit is a published dispensation with its own rules. Permanent residence is a separate category decided by the Department of Home Affairs."},
                    {"question": "Can I apply from Luanda?", "answer": "Lodging channels change. Use the current VFS Global or mission instructions for your location. We confirm the channel during assessment."},
                ],
                "body": (
                    "Angolan applicants ask a different first question than many other nationalities: is a special-permit window open, or should we work from the ordinary visa categories? "
                    "The Angola Special Permit exists only when the Department of Home Affairs publishes criteria and dates. It is not a standing substitute for a work, study, or visitor visa, and it is not permanent residence. "
                    "If no directive is in force, treating ASP as if it were available would waste time. We will say so plainly.\n\n"
                    "Portuguese is the language of most Angolan civil records. South African lodging typically expects English. Sworn translations, consistent names across passport and certificates, and readable scans matter more here than on pages written for English-only files. "
                    "That is a document problem, not a keyword problem, and it is why this page is not a copy of the Zimbabwe or Mozambique notes.\n\n"
                    "People already in South Africa on another status should not assume they can switch into ASP or a work visa without leaving. Change-of-status rules are category-specific. People still in Angola should confirm whether they lodge through VFS Global, a mission, or another published channel — those instructions move.\n\n"
                    "Mzansi Visa Solutions helps eligible clients prepare ASP files when a process is open, and otherwise maps temporary or permanent residence options against published criteria. We do not guarantee approval. Official requirements and fees sit with the Department of Home Affairs and, where used, VFS Global."
                ),
            },
            {
                "kind": SeoLanding.KIND_COUNTRY,
                "slug": "zimbabwe-to-south-africa",
                "title": "Moving from Zimbabwe to South Africa",
                "excerpt": "Visa, permit and exemption-permit options Zimbabwean applicants commonly need to distinguish.",
                "seo_title": "South Africa Visa & Immigration Services for Zimbabwean Applicants",
                "seo_description": "ZEP windows, ordinary visas, and how Zimbabwean applicants should read current Home Affairs publications — not outdated social-media lists.",
                "focus_keyword": "South Africa immigration for Zimbabwean citizens",
                "related_keywords": ["Zimbabwean Exemption Permit", "Zimbabwe to South Africa visa"],
                "audience": "Zimbabwean nationals in South Africa or abroad who hold, or hope to hold, lawful status — including people asking about exemption permits.",
                "pathways": "The Zimbabwean Exemption Permit (ZEP) is a published dispensation. It opens and closes. It is not the same as a general work visa, a visitor visa, or permanent residence. When a ZEP process is closed, applicants look at the ordinary categories that match their facts. When it is open, the directive — not a previous year’s checklist — controls. Many Zimbabwean clients already have a history of South African permits; that history changes what is realistic next.",
                "documents": "A valid Zimbabwean passport is the starting point. ZEP, when open, lists its own evidence. Ordinary work or relative categories add employment or family documents. Do not reuse a 2018 or 2021 list. We update your portal checklist from the current official publication.",
                "related_service_slugs": ["zimbabwean-exemption-permit", "temporary-residence-permit", "waiver-exemption-applications"],
                "related_article_slugs": ["how-long-does-a-south-african-visa-application-take", "how-to-prepare-for-a-visa-consultation"],
                "faqs": [
                    {"question": "Are ZEP rules fixed?", "answer": "No. Always rely on the latest official directive. Social-media summaries go stale quickly."},
                    {"question": "If ZEP is closed, is there nothing I can do?", "answer": "Not necessarily. Ordinary visa categories may still apply to your facts. That is a consultation question, not a promise."},
                ],
                "body": (
                    "Zimbabwean immigration questions in South Africa are dominated by exemption-permit history. That history is useful only if you treat each directive as time-bound. "
                    "A Zimbabwean Exemption Permit is not a general work visa, not a visitor visa, and not permanent residence. Confusing those labels is the most common expensive mistake we see.\n\n"
                    "If you already live in South Africa, your current stamp or permit — expired, pending, or valid — changes the next lawful step. Some people need to wait for a published ZEP window. Others should be looking at a temporary residence category that matches work, study, or family facts. "
                    "We will not lodge a ZEP file because a neighbour did so in a previous year.\n\n"
                    "English-language documents are usually easier for Zimbabwean civil records than for Lusophone countries, but police clearances, birth certificates, and name consistency still delay files. "
                    "The Department of Home Affairs and VFS Global publish where to lodge; those addresses and portals change.\n\n"
                    "Mzansi helps clients read the current ZEP publication, or map an ordinary pathway if no dispensation is open. We prepare complete files and track our own case status. Official decisions stay with the authorities. Nothing on this page is a government form."
                ),
            },
            {
                "kind": SeoLanding.KIND_COUNTRY,
                "slug": "mozambique-to-south-africa",
                "title": "Moving from Mozambique to South Africa",
                "excerpt": "Ordinary South African visa categories for Mozambican applicants, plus translation and border-channel practicalities.",
                "seo_title": "South Africa Visa & Immigration Services for Mozambican Applicants",
                "seo_description": "Temporary residence, work, study and family options for Mozambican applicants — without inventing a special-permit programme that is not published.",
                "focus_keyword": "South Africa immigration for Mozambican citizens",
                "related_keywords": ["Mozambique to South Africa visa", "South Africa visa from Mozambique"],
                "audience": "Mozambican nationals considering work, study, family, visits, or longer stay in South Africa.",
                "pathways": "Unlike Angola and Zimbabwe, this page does not centre on a standing special-permit brand. Most Mozambican applicants use the ordinary temporary residence categories or, where facts support it, permanent residence. Cross-border movement is common; lawful stay still depends on the visa or permit you hold, not on proximity. Confirm lodging through the channel published for Mozambique or for your current country of residence.",
                "documents": "Portuguese civil documents usually need sworn English translation. Passports, photographs, and purpose-of-stay evidence follow the category. There is no Mozambique-only exemption checklist on this site because we will not invent one.",
                "related_service_slugs": ["temporary-residence-permit", "permanent-residence-permit", "waiver-exemption-applications"],
                "related_article_slugs": ["what-documents-are-required-for-a-south-african-visa", "how-to-prepare-for-a-visa-consultation"],
                "faqs": [
                    {"question": "Is there a Mozambique exemption permit like ZEP?", "answer": "Do not assume a parallel programme. Use only processes the Department of Home Affairs has published for your nationality."},
                    {"question": "I live near the border. Do I still need a visa?", "answer": "Lawful stay is about status, not distance. Visitor concessions and visa rules are official, not informal."},
                ],
                "body": (
                    "Mozambican applicants are poorly served by pages that only swap the word Angola or Zimbabwe. Mozambique does not automatically inherit another country’s special-permit programme. "
                    "If the Department of Home Affairs has not published a Mozambique-specific dispensation, the honest starting point is the ordinary visa and permit framework: visitor, work, study, relative, and other listed temporary residence types, or permanent residence where a category fits.\n\n"
                    "Portuguese-language records from Mozambique need the same translation discipline as Angolan files, but the immigration story is different. Many clients move between Maputo and South African cities for work or family. Proximity does not replace a visa. "
                    "Overstaying a visit or relying on informal border practice is a status problem we cannot fix with wording on a website.\n\n"
                    "Lodging may be in Mozambique, in South Africa, or in a third country depending on the category and the current VFS or mission instructions. Those channels should be read on the official sites, not copied from a blog dated last year.\n\n"
                    "Mzansi Visa Solutions helps Mozambican clients prepare temporary or permanent residence files against published criteria, keep document checklists current, and book a consultation before they choose a pathway. We do not guarantee approval and we will not advertise a special permit that does not exist."
                ),
            },
            {
                "kind": SeoLanding.KIND_LOCATION,
                "slug": "cape-town",
                "title": "Immigration consultations in Cape Town",
                "excerpt": "Cape Town is where Mzansi Visa Solutions is based. Consultations can be in person or remote depending on the booking type.",
                "seo_title": "Immigration Consultant Cape Town | South Africa Visa Advice",
                "seo_description": "Book a South Africa visa or immigration consultation in Cape Town. Remote options are available. We do not guarantee Home Affairs outcomes.",
                "focus_keyword": "immigration consultant Cape Town",
                "related_keywords": ["visa consultant Cape Town", "South Africa visa consultation"],
                "audience": "People in Cape Town, the Western Cape, or who can travel here — and clients abroad who prefer a Cape Town practice.",
                "pathways": "Location does not change the visa category. It changes how you meet us and, sometimes, which VFS or Home Affairs office you attend for biometrics. We prepare files for the category that fits your facts, whether you live in Observatory or overseas.",
                "documents": "Bring passport copies to a consultation if you have them. Lodging and biometrics follow the official Cape Town or other centre instructions for your category — not our office address.",
                "related_service_slugs": ["temporary-residence-permit", "permanent-residence-permit", "waiver-exemption-applications"],
                "related_article_slugs": ["how-to-prepare-for-a-visa-consultation"],
                "faqs": [
                    {"question": "Do I have to attend in Cape Town?", "answer": "Not always. Some consultation types can be remote. Biometrics and lodging still follow official centre instructions."},
                    {"question": "Do you have Johannesburg or Pretoria offices?", "answer": "This page only describes the Cape Town practice we actually operate. We will not publish city pages for offices we do not have."},
                ],
                "body": (
                    "Mzansi Visa Solutions is based in Cape Town. This page exists because local searchers look for an immigration or visa consultant in this city, not because every South African city needs a duplicate article. "
                    "We have not created Johannesburg or Pretoria landing pages. Those would be doorway pages unless we had a real office or a distinct service story.\n\n"
                    "A Cape Town consultation is a conversation about your nationality, status, and goal. It is not a Home Affairs appointment. After you instruct us, document uploads happen in the client portal. "
                    "If your category requires biometrics or a visa-centre visit, you will use the centre published for that category — often a VFS location — which may or may not be in the same suburb as our practice.\n\n"
                    "Clients who live in the Western Cape can book in person when the consultation type allows it. Clients elsewhere in South Africa or abroad can usually meet remotely. "
                    "The visa rules do not become easier because the meeting is in Cape Town, and they do not become harder. Geography affects logistics, not the Department’s criteria.\n\n"
                    "Book through the consultation page. Bring facts, not rumours. We will explain options and limits. We do not guarantee visa, permit, or permanent residence approval."
                ),
            },
        ]
        for item in landings:
            SeoLanding.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "kind": item["kind"],
                    "title": item["title"],
                    "excerpt": item["excerpt"],
                    "body": item["body"],
                    "audience": item["audience"],
                    "pathways": item["pathways"],
                    "documents": item["documents"],
                    "official_sources": OFFICIAL_SOURCES,
                    "faqs": item["faqs"],
                    "related_service_slugs": item["related_service_slugs"],
                    "related_article_slugs": item["related_article_slugs"],
                    "seo_title": item["seo_title"],
                    "seo_description": item["seo_description"],
                    "canonical_path": f"/{'countries' if item['kind'] == SeoLanding.KIND_COUNTRY else 'locations'}/{item['slug']}",
                    "focus_keyword": item["focus_keyword"],
                    "related_keywords": item["related_keywords"],
                    "is_published": True,
                    "locale": "en",
                },
            )

    def _emails(self):
        templates = [
            ("welcome", "Welcome", "Welcome to Mzansi Visa Solutions", "Hello {{ first_name }},\n\nYour client portal is ready. You can book a consultation and, when an application is opened, upload documents securely.\n\nMzansi Visa Solutions"),
            ("password_reset", "Password reset", "Reset your password", "Use this reset token with the app or website.\nuid={{ uid }}\ntoken={{ token }}"),
            ("application_created", "Application created", "Your application has been created", "{{ title }}\n\n{{ body }}"),
            ("application_status_changed", "Status changed", "Application status update", "{{ title }}\n\n{{ body }}"),
            ("vfs_status_changed", "VFS status updated", "Your VFS application status has changed", "{{ title }}\n\n{{ body }}"),
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
