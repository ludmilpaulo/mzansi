# Mzansi Visa Solutions — client app

Native Expo (React Native) client for the Mzansi Visa Solutions API. Classic entry (`App.tsx` / `index.ts`), not Expo Router.

## Stack

- Expo ~55, React 19.2, React Native 0.83
- Redux Toolkit + RTK Query
- React Navigation (native stack + bottom tabs)
- `expo-secure-store` for JWT tokens (in-memory fallback in tests)
- TypeScript strict, no `any`

## Prerequisites

1. Node.js 20+
2. Backend running from `../backend` (`python manage.py runserver`)
3. Expo Go (SDK 55) on a device or simulator

## Run

```powershell
cd mobile
npm install
npm start
```

Then press `a` (Android), `i` (iOS), or scan the QR code.

### API base URL

Default: `http://127.0.0.1:8000/api/v1` (`EXPO_PUBLIC_API_BASE_URL`).

| Environment | Base URL |
|-------------|----------|
| iOS simulator | `http://127.0.0.1:8000/api/v1` |
| Android emulator | `http://10.0.2.2:8000/api/v1` |
| Physical device | `http://<your-LAN-IP>:8000/api/v1` |

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "http://10.0.2.2:8000/api/v1"
npm start
```

Or create `mobile/.env` with the same variable.

The Django server must listen on `0.0.0.0` for a physical device (`python manage.py runserver 0.0.0.0:8000`).

## Checks

```powershell
npm run lint
npm run typecheck
npm test
```

## Seed / demo login (local only)

These accounts exist only after:

```powershell
cd ..\backend
python manage.py seed_platform --with-demo-users
```

| Role | Email | Password |
|------|-------|----------|
| Client | `client@mzansivisa.co.za` | `MzansiClient!234` |

See `docs/seed-accounts.md`. Do not use these credentials in production.

## Features

- Auth: welcome, register, login, password reset
- Home: next action, progress, document counts, upcoming consultation, unread messages
- Applications list/detail (timeline) and start-from-service
- Documents checklist with camera / library upload and rejection reasons
- Book consultation (assigned consultant + slots from the API)
- Messages and conversation threads
- Notifications, invoices, profile, and contact (brand settings from `GET /content/settings/home`)

No visa approval is promised in the UI. Services, statuses, and contact details come from the API.
