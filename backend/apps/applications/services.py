from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from apps.applications.models import Application, ApplicationStatus, ApplicationTimeline
from apps.documents.models import DocumentSubmission
from apps.services.models import Service


def generate_reference() -> str:
    year = timezone.now().year
    prefix = f"MVS-{year}-"
    last = (
        Application.objects.filter(reference__startswith=prefix)
        .aggregate(max_ref=Max("reference"))
        .get("max_ref")
    )
    next_number = 1
    if last:
        try:
            next_number = int(last.split("-")[-1]) + 1
        except ValueError:
            next_number = Application.objects.filter(reference__startswith=prefix).count() + 1
    return f"{prefix}{next_number:05d}"


def get_status(code: str) -> ApplicationStatus:
    status = ApplicationStatus.objects.filter(code=code, is_active=True).first()
    if status:
        return status
    fallback = ApplicationStatus.objects.filter(is_active=True).order_by("sort_order").first()
    if not fallback:
        raise ApplicationStatus.DoesNotExist("No application statuses have been configured.")
    return fallback


def generate_document_checklist(application: Application) -> None:
    from apps.documents.models import DocumentSubmission as Submission

    requirements = application.service.requirements.select_related("document_type").all()
    existing = set(application.documents.values_list("document_type_id", flat=True))
    to_create = []
    for requirement in requirements:
        if requirement.document_type_id in existing:
            continue
        to_create.append(
            Submission(
                application=application,
                document_type=requirement.document_type,
                status=Submission.Status.REQUESTED,
                client_note=requirement.description,
            )
        )
    if to_create:
        Submission.objects.bulk_create(to_create)


def _weights() -> dict[str, int]:
    defaults = {
        "profile": 10,
        "documents": 30,
        "verification": 20,
        "status": 40,
    }
    try:
        from apps.content.models import SiteSetting

        setting = SiteSetting.objects.filter(key="progress_weights").first()
        if setting and isinstance(setting.value, dict):
            defaults.update({k: int(v) for k, v in setting.value.items() if str(v).isdigit()})
    except Exception:
        pass
    return defaults


def calculate_progress(application: Application) -> int:
    weights = _weights()
    profile = getattr(application.client, "client_profile", None)
    profile_score = (profile.completion_percent / 100) if profile else 0

    docs = list(application.documents.all())
    if docs:
        uploaded = sum(1 for doc in docs if doc.status != DocumentSubmission.Status.REQUESTED and doc.file)
        verified = sum(1 for doc in docs if doc.status == DocumentSubmission.Status.VERIFIED)
        doc_score = uploaded / len(docs)
        verify_score = verified / len(docs)
    else:
        doc_score = 0
        verify_score = 0

    status_score = min(application.status.progress_weight, 100) / 100
    total = (
        profile_score * weights["profile"]
        + doc_score * weights["documents"]
        + verify_score * weights["verification"]
        + status_score * weights["status"]
    )
    return max(0, min(100, int(round(total))))


def next_client_action(application: Application) -> str:
    pending = application.documents.filter(
        status__in=[
            DocumentSubmission.Status.REQUESTED,
            DocumentSubmission.Status.REJECTED,
            DocumentSubmission.Status.REPLACEMENT_REQUIRED,
        ]
    ).select_related("document_type").first()
    if pending:
        verb = "Upload" if pending.status == DocumentSubmission.Status.REQUESTED else "Replace"
        return f"{verb} {pending.document_type.name}"
    if application.status.client_action_required:
        return application.status.description or application.status.label
    if application.status.is_terminal:
        return "No further action required"
    return "Awaiting review from Mzansi Visa Solutions"


@transaction.atomic
def create_application(*, client, service: Service, actor=None) -> Application:
    status = get_status("DRAFT")
    application = Application.objects.create(
        reference=generate_reference(),
        client=client,
        service=service,
        status=status,
        next_action="Complete your profile and upload required documents",
    )
    generate_document_checklist(application)
    ApplicationTimeline.objects.create(
        application=application,
        status=status,
        title="Application created",
        description=f"Application opened for {service.name}.",
        staff_member=actor if actor and getattr(actor, "is_staff_role", False) else None,
        client_action_required=True,
    )
    from apps.messaging.models import Conversation

    Conversation.objects.get_or_create(application=application, defaults={"subject": f"Application {application.reference}"})
    refresh_progress(application)
    return application


@transaction.atomic
def transition_application(*, application: Application, status: ApplicationStatus, actor, note: str = "") -> Application:
    application.status = status
    if status.code == "SUBMITTED" and not application.submitted_at:
        application.submitted_at = timezone.now()
    if status.is_terminal:
        application.completed_at = timezone.now()
    application.save()
    ApplicationTimeline.objects.create(
        application=application,
        status=status,
        title=status.label,
        description=note or status.description,
        staff_member=actor,
        client_action_required=status.client_action_required,
    )
    refresh_progress(application)
    return application


def refresh_progress(application: Application) -> Application:
    application.progress = calculate_progress(application)
    application.next_action = next_client_action(application)
    application.save(update_fields=["progress", "next_action", "updated_at"])
    return application
