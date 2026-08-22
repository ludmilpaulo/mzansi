# Seed data and local demo accounts

Run after migrate:

```powershell
cd backend
python manage.py seed_platform --with-demo-users
```

`--with-demo-users` is for **local development only**. It is not production data and must not be run against a live database that already has real clients.

## Demo accounts (local)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@mzansivisa.co.za` | `MzansiAdmin!234` |
| Consultant | `consultant@mzansivisa.co.za` | `MzansiConsult!234` |
| Document reviewer | `reviewer@mzansivisa.co.za` | `MzansiReview!234` |
| Finance | `finance@mzansivisa.co.za` | `MzansiFinance!234` |
| Client | `client@mzansivisa.co.za` | `MzansiClient!234` |

The client seed also opens a Permanent Residence application assigned to Sarah Smith, with a confirmed consultation one week ahead.

Without `--with-demo-users`, only CMS content, services, statuses, document types, consultation types, and email templates are created.
