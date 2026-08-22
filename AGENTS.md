# AI agents — Mzansi Visa Solutions

Premium digital immigration operations platform: public website, client portal, staff dashboard, Expo client app, and Django REST API.

## Layout

| Surface | Path | Stack |
|---------|------|--------|
| API | `backend/` | Django 5, DRF, JWT, Celery, PostgreSQL |
| Web | `web/` | Next.js App Router, TypeScript (strict, no `any`), Tailwind, RTK Query |
| Mobile | `mobile/` | Expo, TypeScript (strict, no `any`), React Navigation, RTK Query |
| Docs | `docs/` | Architecture, API notes, seed accounts, QA |

## Non-negotiables

- **No TypeScript `any`** (including `as any` and `Record<string, any>`).
- **No hardcoded production business data** in UI. Services, FAQs, testimonials, statuses, and site copy come from the API.
- Seed/demo data only via `python manage.py seed_platform`.
- Permissions are enforced in Django. Frontend route guards are UX only.
- Uploaded immigration documents are private (signed URLs / object-level checks).
- Do not promise guaranteed visa approval in copy or UI.

## Data flow

```
Web / Mobile → typed HTTP client → Django REST `/api/v1/` → PostgreSQL
                                      ↓
                                   Celery / Redis
```

## Local commands

```powershell
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements/dev.txt
copy ..\.env.example .env   # then edit
python manage.py migrate
python manage.py seed_platform
python manage.py runserver

# Web
cd web
npm install
npm run dev

# Mobile
cd mobile
npm install
npx expo start
```

Checks:

```powershell
cd backend; python manage.py check; python manage.py test
cd web; npm run lint; npm run build
cd mobile; npm run lint
```

## Roles

`SUPER_ADMIN`, `ADMIN`, `CONSULTANT`, `DOCUMENT_REVIEWER`, `FINANCE`, `SUPPORT`, `CLIENT`
