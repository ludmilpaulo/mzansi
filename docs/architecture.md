# Architecture — Mzansi Visa Solutions

## Surfaces

1. **Public website** (`web/app/(public)`) — marketing, services, resources, contact.
2. **Client portal** (`web/app/(portal)`) — applications, documents, bookings, messages.
3. **Staff dashboard** (`web/app/(staff)`) — case management, document review, analytics.
4. **Client mobile** (`mobile/`) — native client experience (camera upload, push-ready).
5. **API** (`backend/`) — source of truth for all business data.

## API envelope

Success:

```json
{ "success": true, "data": {}, "message": "optional" }
```

Error:

```json
{ "success": false, "error": { "code": "permission_denied", "detail": "...", "fields": {} } }
```

Paginated lists nest DRF pagination inside `data`:

```json
{ "success": true, "data": { "count": 12, "next": null, "previous": null, "results": [] } }
```

## Application workflow

Statuses are rows in `applications.ApplicationStatus` (seeded, editable). Typical codes:

`DRAFT` → `SUBMITTED` → `INITIAL_REVIEW` → `DOCUMENTS_REQUIRED` → `DOCUMENTS_UNDER_REVIEW` → `DOCUMENTS_COMPLETE` → `IN_PREPARATION` → `SUBMITTED_TO_AUTHORITY` → `AWAITING_DECISION` → `APPROVED` | `REJECTED` → `COMPLETED`

`CANCELLED` is a terminal side-path. Each transition writes a timeline event and an audit log, and queues client notifications.

## Progress

Weighted from:

- Profile completeness
- Document upload / verification ratios
- Current status weight (`ApplicationStatus.progress_weight`)
- Configurable category weights in `SiteSetting` key `progress_weights`

## Documents

Creating an application copies active `ServiceRequirement` / `DocumentType` rows into per-application checklist items. Staff can request extra documents. Files are stored privately; download uses a permission-checked signed URL.

## Payments

`payments` is provider-agnostic. `PaymentProvider` is an interface; no provider is hardcoded in application/consultation logic. Invoices can exist without a live gateway.

## Extensibility (not implemented now)

WhatsApp, video consults, OCR, extra payment providers, partner portal, multi-office — hook via notifications, consultation meeting links, and the payment provider interface.
