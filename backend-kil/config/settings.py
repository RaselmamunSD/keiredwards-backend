from datetime import timedelta
from pathlib import Path
import os

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

# ── Optimize Timezone Field Startup on Windows ─────────────────
# The timezone_field library eagerly loads all IANA timezones (600+)
# from Python's zoneinfo / tzdata package on startup. On Windows,
# this causes severe slow downs (or hangs) due to antivirus scanning
# of hundreds of file reads. We limit the default timezones to a
# list of common ones to make the server start up instantly.
try:
    from timezone_field.backends.zoneinfo import ZoneInfoBackend
    import zoneinfo

    common_timezones = {
        "UTC",
        "Asia/Dhaka",  # Local timezone
        "America/New_York",
        "America/Los_Angeles",
        "America/Chicago",
        "America/Denver",
        "America/Phoenix",
        "America/Anchorage",
        "America/Honolulu",
        "America/Toronto",
        "America/Mexico_City",
        "America/Sao_Paulo",
        "Europe/London",
        "Europe/Paris",
        "Europe/Berlin",
        "Europe/Rome",
        "Europe/Madrid",
        "Europe/Dublin",
        "Europe/Moscow",
        "Europe/Istanbul",
        "Asia/Kolkata",
        "Asia/Singapore",
        "Asia/Tokyo",
        "Asia/Shanghai",
        "Asia/Hong_Kong",
        "Asia/Seoul",
        "Asia/Jakarta",
        "Asia/Dubai",
        "Asia/Karachi",
        "Asia/Riyadh",
        "Australia/Sydney",
        "Australia/Melbourne",
        "Australia/Perth",
        "Pacific/Auckland",
        "Africa/Cairo",
        "Africa/Johannesburg",
        "Africa/Nairobi",
        "Africa/Lagos",
    }
    # Only keep timezones that exist in the system's database
    available_tzs = zoneinfo.available_timezones()
    valid_timezones = {tz for tz in common_timezones if tz in available_tzs}
    
    ZoneInfoBackend.base_tzstrs = valid_timezones
    ZoneInfoBackend.all_tzstrs = valid_timezones
except Exception:
    pass


SECRET_KEY = env(
    "SECRET_KEY",
    default="django-insecure-change-me-in-production",
)
DEBUG = env.bool("DEBUG", default=False)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

INSTALLED_APPS = [
    "unfold",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "django_filters",
    "django_celery_beat",
    "apps.core",
    "apps.accounts",
    "apps.authentication",
    "apps.payments",
    "apps.dashboard",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "apps.authentication.middleware.LoginActivityMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.core.middleware.RequestResponseLoggingMiddleware",
    "apps.core.middleware.CustomSecurityHeadersMiddleware",
    "apps.core.middleware.IPRestrictionMiddleware",
]

BLACKLISTED_IPS = []

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ── Database ──────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.sqlite3'),
        'NAME': os.environ.get('DB_NAME', os.path.join(BASE_DIR, 'db.sqlite3')),
        'USER': os.environ.get('DB_USER', ''),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', ''),
        'PORT': os.environ.get('DB_PORT', ''),
        'CONN_MAX_AGE': int(os.environ.get('CONN_MAX_AGE', 0)),
    }
}


WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

AUTH_USER_MODEL = "accounts.User"
AUTHENTICATION_BACKENDS = [
    "apps.accounts.backends.EmailOrUsernameModelBackend",
    "django.contrib.auth.backends.ModelBackend",
]
SITE_ID = 1

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Dhaka"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATIC_MANIFEST_FILE = STATIC_ROOT / "staticfiles.json"

if DEBUG or not STATIC_MANIFEST_FILE.exists():
    STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"
    WHITENOISE_USE_FINDERS = True
    WHITENOISE_AUTOREFRESH = True
else:
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
    WHITENOISE_USE_FINDERS = False
    WHITENOISE_AUTOREFRESH = False

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/day",
        "user": "1000/day",
    },
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Fontaine API",
    "DESCRIPTION": "Production-ready API backend for Fontaine Project",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://yourdomain.com",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]
CORS_ALLOW_HEADERS = ["accept", "authorization", "content-type", "x-csrftoken"]

# ── Cache ──────────────────────────────────────────────────
# Default to LocMemCache for local development.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "fontaine-local-cache",
    }
}
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# ── Celery ──────────────────────────────────────────────────
# Use in-memory broker and result backend.
CELERY_BROKER_URL = "memory://"
CELERY_RESULT_BACKEND = "cache+memory://"

CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "Asia/Dhaka"
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_BEAT_SCHEDULE = {
    "cleanup-expired-tokens-daily": {
        "task": "celery_app.tasks.cleanup_expired_tokens",
        "schedule": 60 * 60 * 24,
    }
}

# Use console backend in debug mode if SMTP settings are placeholders to prevent crashes
if env.bool("DEBUG", default=True) and (env("EMAIL_HOST_USER", default="") in ("", "your@email.com")):
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="no-reply@fontaine.local")

FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:3000")

PAPYL_BASE_URL = env("PAPYL_BASE_URL", default="https://api.papyl.com/v1")
PAPYL_API_KEY = env("PAPYL_API_KEY", default="")
PAPYL_TIMEOUT = env.int("PAPYL_TIMEOUT", default=20)

# IDrive e2 S3 Storage Configs
IDRIVE_E2_ACCESS_KEY = env("IDRIVE_E2_ACCESS_KEY", default="")
IDRIVE_E2_SECRET_KEY = env("IDRIVE_E2_SECRET_KEY", default="")
IDRIVE_E2_BUCKETS = {
    1: {
        "region_code": "us-midwest-1",
        "endpoint": "https://s3.us-midwest-1.idrivee2.com",
        "bucket_name": env("IDRIVE_E2_BUCKET_CHICAGO", default="vault-chicago")
    },
    2: {
        "region_code": "us-central-1",
        "endpoint": "https://s3.us-central-1.idrivee2.com",
        "bucket_name": env("IDRIVE_E2_BUCKET_DALLAS", default="vault-dallas")
    },
    3: {
        "region_code": "us-west-2",
        "endpoint": "https://s3.us-west-2.idrivee2.com",
        "bucket_name": env("IDRIVE_E2_BUCKET_LA", default="vault-la")
    },
    4: {
        "region_code": "us-east-1",
        "endpoint": "https://s3.us-east-1.idrivee2.com",
        "bucket_name": env("IDRIVE_E2_BUCKET_VIRGINIA", default="vault-virginia")
    }
}

UNFOLD = {
    "SITE_TITLE": "I WAS KILLED Admin Dashboard",
    "SITE_HEADER": "I WAS KILLED Admin Dashboard",
    "SITE_SUBHEADER": "Admin Dashboard",
    "SHOW_HISTORY": True,
    "SHOW_SIDEBAR_FILTER": True,
}


