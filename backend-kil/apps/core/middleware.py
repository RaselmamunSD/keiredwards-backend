import logging
import time
from django.conf import settings
from django.http import HttpResponseForbidden, JsonResponse

logger = logging.getLogger("django.request")


def _extract_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class RequestResponseLoggingMiddleware:
    """
    Middleware to log details of all incoming requests and outgoing responses,
    including the processing time.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        ip = _extract_client_ip(request)

        logger.info(f"Incoming: {request.method} {request.get_full_path()} from IP: {ip}")

        response = self.get_response(request)

        duration = time.time() - start_time
        logger.info(
            f"Outgoing: {request.method} {request.get_full_path()} -> "
            f"Status: {response.status_code} (Duration: {duration:.3f}s)"
        )
        return response


class CustomSecurityHeadersMiddleware:
    """
    Middleware to add security headers to all HTTP responses.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Adding common security headers
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["X-XSS-Protection"] = "1; mode=block"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response


class IPRestrictionMiddleware:
    """
    Middleware to block requests from blacklisted IPs.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        ip = _extract_client_ip(request)
        blacklisted_ips = getattr(settings, "BLACKLISTED_IPS", [])

        if ip in blacklisted_ips:
            return HttpResponseForbidden("Forbidden: Your IP address is blacklisted.")

        response = self.get_response(request)
        return response


class PaymentRequiredMiddleware:
    """
    Middleware to require a successful payment before allowing access to the API.
    Exempts authentication endpoints, payment endpoints, and webhooks.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path_info

        # Allow unauthenticated paths or specific paths
        exempt_paths = [
            "/api/v1/accounts/register/",
            "/api/v1/accounts/login/",
            "/api/v1/accounts/password-reset/",
            "/api/v1/accounts/password-reset/confirm/",
            "/api/v1/payments/",
            "/api/v1/payments/create/",
            "/api/v1/payments/verify/",
            "/api/v1/payments/webhook/",
            "/api/v1/payments/pricing/",
            "/admin/",
            "/media/",
        ]
        
        is_exempt = False
        for ep in exempt_paths:
            if path.startswith(ep):
                is_exempt = True
                break

        if not is_exempt and request.user.is_authenticated:
            # Check if user has a completed payment
            has_paid = request.user.payments.filter(status="completed").exists()
            if not has_paid:
                return JsonResponse(
                    {
                        "success": False,
                        "message": "Payment is required before accessing the account.",
                        "status_code": 403,
                        "code": "payment_required"
                    },
                    status=403
                )

        response = self.get_response(request)
        return response
