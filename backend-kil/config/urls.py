from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView


def api_root(_request):
    return JsonResponse(
        {
            "message": "Fontaine backend is running.",
            "docs": "/api/docs/",
            "schema": "/api/schema/",
            "api_base": "/api/v1/",
        }
    )


def api_v1_root(_request):
    return JsonResponse(
        {
            "message": "Fontaine API v1",
            "auth_login": "/api/v1/auth/login/",
            "auth_register": "/api/v1/auth/register/",
            "authentication": "/api/v1/authentication/",
            "payments": "/api/v1/payments/",
            "dashboard": "/api/v1/dashboard/",
        }
    )

urlpatterns = [
    path("", api_root, name="api-root"),
    path("api/v1/", api_v1_root, name="api-v1-root"),
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/authentication/", include("apps.authentication.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/dashboard/", include("apps.dashboard.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
