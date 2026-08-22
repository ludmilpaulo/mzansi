# Manual QA — end-to-end journey

Use local seed accounts from `docs/seed-accounts.md`.

1. Open the public site. Confirm hero, services, FAQs, and testimonials load from the API (not a blank/error state).
2. Open a service detail page. Requirements and FAQs come from Django.
3. Register a new client. Receive tokens and land in `/portal`.
4. Book a consultation (type → date → consultant → confirm).
5. Sign in as admin. Confirm the booking appears under `/staff/consultations`.
6. Create an application for the client (or have the client start one). Confirm the document checklist is generated.
7. As the client, upload a document from `/portal/documents`.
8. As reviewer, verify one document and reject another with a reason.
9. As admin, request an extra document. Client sees the request and a notification.
10. Client uploads the replacement. Reviewer verifies.
11. Consultant transitions the application. Client sees the timeline and status email/notification.
12. Client sends a message on the application conversation. Consultant replies.
13. Finance issues an invoice and records a manual payment. Client sees it under invoices.
14. Confirm a client cannot open another client's application by ID.
15. Confirm uploaded files are not reachable as public `/media/` URLs without auth (staff/client download action only).
16. Copy never says “guaranteed approval”.
