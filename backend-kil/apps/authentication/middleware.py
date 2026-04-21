from .models import AuthAuditLog


def _extract_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class LoginActivityMiddleware:
    """
    Logs authenticated API access for security analytics.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if (
            request.path.startswith("/api/")
            and getattr(request, "user", None)
            and request.user.is_authenticated
        ):
            AuthAuditLog.objects.create(
                user=request.user,
                action="api_access",
                method=request.method,
                endpoint=request.path,
                was_successful=200 <= response.status_code < 400,
                ip_address=_extract_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:255],
            )

        return response
