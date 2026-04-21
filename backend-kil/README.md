# Fontaine Backend (Django REST Framework)

Production-ready backend for the Fontaine Project frontend.

## Stack

- Python 3.12+
- Django 5.x
- DRF + JWT (SimpleJWT)
- Redis (cache + Celery broker/result backend)
- Celery + Celery Beat
- drf-spectacular (OpenAPI/Swagger)
- PostgreSQL (production), SQLite3 (development)

## Project Structure

```text
fontaine-backend/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── accounts/
│   └── core/
├── celery_app/
├── requirements/
├── .env.example
├── manage.py
└── docker-compose.yml
```

## Development Setup

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements/development.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Run Redis (separate terminal)

```bash
redis-server
```

## Run Celery Worker (separate terminal)

```bash
celery -A config worker -l info
```

## Run Celery Beat (separate terminal)

```bash
celery -A config beat -l info
```

## Run with Docker

```bash
docker-compose up --build
```

## API Base

- Base URL: `/api/v1/`
- Swagger docs: `/api/docs/`
- OpenAPI schema: `/api/schema/`

## Auth Endpoints

- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/logout/`
- `POST /api/v1/auth/token/refresh/`
- `POST /api/v1/auth/token/verify/`
- `POST /api/v1/auth/password/change/`
- `POST /api/v1/auth/password/reset/`
- `POST /api/v1/auth/password/reset/confirm/`
- `GET /api/v1/auth/profile/`
- `PUT /api/v1/auth/profile/update/`

## Authentication App Endpoints

- `GET /api/v1/authentication/health/`
- `GET /api/v1/authentication/activity/`

## Payment Endpoints (Papyl-ready)

- `GET /api/v1/payments/`
- `POST /api/v1/payments/create/`
- `POST /api/v1/payments/verify/`

## Dashboard Endpoints

- `GET /api/v1/dashboard/summary/`
- `GET /api/v1/dashboard/analytics/?days=30`

## Next.js Integration Example

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = {
  get: (endpoint: string, token: string) =>
    fetch(`${API_URL}/api/v1/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  post: (endpoint: string, data: unknown, token: string) =>
    fetch(`${API_URL}/api/v1/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),
};
```

## Next.js Payment Flow

1. Call `POST /api/v1/payments/create/` with amount and currency.
2. Redirect user to `checkout_url`.
3. After checkout, call `POST /api/v1/payments/verify/` with `reference`.
4. Refresh dashboard using `/api/v1/dashboard/summary/` and `/api/v1/dashboard/analytics/`.
