import logging
import time
from django.conf import settings
from django.http import HttpResponseForbidden

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
