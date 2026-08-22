# Mzansi Visa Solutions

Digital immigration operations platform: public website, client portal, staff dashboard, Expo client app, and Django REST API.

The API is the source of truth. Services, FAQs, testimonials, application statuses, and site copy are managed in Django — they are not hardcoded in the frontends.

This platform assists clients. It does **not** guarantee visa, permit, or permanent residence approval.

## Layout

| Surface | Path | Stack |
|---------|------|--------|
| API | `backend/` | Django 5, DRF, JWT, Celery, PostgreSQL |
| Web | `web/` | Next.js App Router, TypeScript (strict), Tailwind, RTK Query |
| Mobile | `mobile/` | Expo, TypeScript (strict), React Navigation, RTK Query |
| Docs | `docs/` | Architecture, seed accounts |

## Local setup

Copy `.env.example` to `.env` and adjust if needed. SQLite is used when `DATABASE_URL` is empty.

```powershell
# API
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements\dev.txt
python manage.py migrate
python manage.py seed_platform --with-demo-users
python manage.py runserver

# Web  (http://localhost:3000)
cd web
npm install
npm run dev

# Mobile
cd mobile
npm install
npx expo start
```

Optional stack: `docker compose up postgres redis`.

API docs: [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)

Local demo accounts: see [docs/seed-accounts.md](docs/seed-accounts.md). Do not seed demo users on production.

## Checks

```powershell
cd backend; .\.venv\Scripts\python.exe manage.py test
cd web; npm run lint; npm test; npm run build
cd mobile; npm run lint; npm test
```

## Roles

`SUPER_ADMIN` · `ADMIN` · `CONSULTANT` · `DOCUMENT_REVIEWER` · `FINANCE` · `SUPPORT` · `CLIENT`

Permissions are enforced in Django. Frontend route guards are UX only.

## Production notes

- Set `DJANGO_PRODUCTION=true`, a strong `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=false`, PostgreSQL, Redis, and private object storage (`USE_S3_STORAGE=true`).
- Documents are never public. Downloads are permission-checked.
- Payment providers are pluggable (`apps/payments/providers.py`). No gateway is hardcoded into case logic.
